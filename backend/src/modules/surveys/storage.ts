import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, relative, isAbsolute, resolve } from 'node:path';
import { ApiError } from '../../lib/http.js';
import { isPublicStoragePath } from '../../config/env.js';

export interface SurveyStorage {
  put(bytes: Buffer, extension: 'jpg' | 'png' | 'pdf'): Promise<{ key: string; discard: () => Promise<void> }>;
  read(key: string): Promise<Buffer>;
}

export class LocalSurveyStorage implements SurveyStorage {
  constructor(private readonly directory: string, private readonly maxBytes: number) {}
  private async root() {
    if (isPublicStoragePath(this.directory)) throw new ApiError(500, 'STORAGE_CONFIGURATION_ERROR', 'Private storage configuration is invalid');
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const root = await realpath(this.directory);
    if (isPublicStoragePath(root)) throw new ApiError(500, 'STORAGE_CONFIGURATION_ERROR', 'Storage must remain outside public directories');
    return root;
  }
  private location(root: string, key: string) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|pdf)$/.test(key)) throw new ApiError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found');
    const full = resolve(join(root, key));
    const part = relative(root, full);
    if (!part || part.startsWith('..') || isAbsolute(part) || dirname(full) !== root) throw new ApiError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found');
    return full;
  }
  async put(bytes: Buffer, extension: 'jpg' | 'png' | 'pdf') {
    if (!bytes.length || bytes.length > this.maxBytes) throw new ApiError(413, 'FILE_TOO_LARGE', 'File exceeds the configured upload limit');
    const root = await this.root();
    const key = `${randomUUID()}.${extension}`;
    const path = this.location(root, key);
    const handle = await open(path, 'wx', 0o600); // Exclusive creation; never overwrite another object.
    try { await handle.writeFile(bytes); } finally { await handle.close(); }
    return { key, discard: async () => {
      // Receipt-scoped cleanup: only this freshly-created file, no caller-supplied path or recursion.
      const checked = this.location(root, key);
      const metadata = await lstat(checked);
      if (!metadata.isFile() || metadata.isSymbolicLink() || await realpath(checked) !== checked) throw new Error('Unsafe storage cleanup refused');
      await unlink(checked);
    } };
  }
  async read(key: string) {
    const root = await this.root();
    const path = this.location(root, key);
    const metadata = await lstat(path).catch(() => null);
    if (!metadata?.isFile() || metadata.isSymbolicLink() || await realpath(path) !== path) throw new ApiError(404, 'ATTACHMENT_NOT_FOUND', 'Private attachment is unavailable');
    const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const current = await handle.stat();
      // Keep historical evidence readable if the operator lowers the new-upload limit.
      if (!current.isFile() || current.size > 10485760) throw new ApiError(409, 'STORAGE_INTEGRITY_ERROR', 'Stored file exceeds the supported object limit');
      return await handle.readFile();
    } finally { await handle.close(); }
  }
}
