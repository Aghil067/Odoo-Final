import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import type { Principal } from '../auth/auth.js';
import { attachmentPublic, requireFieldEditor, requireSurvey } from './access.js';
import { surveyAtomic } from './policy.js';
import { saveSurvey } from './survey.service.js';
import type { SurveyStorage } from './storage.js';
import * as v from './validation.js';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export function validateFile(bytes: Buffer, mime: string, fileName: string, category: z.infer<typeof v.upload>['category']): 'jpg' | 'png' | 'pdf' {
  const jpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  const png = bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.subarray(12, 16).toString('ascii') === 'IHDR' && bytes.subarray(-8, -4).toString('ascii') === 'IEND';
  const pdf = bytes.length >= 12 && bytes.subarray(0, 5).toString('ascii') === '%PDF-' && bytes.subarray(-1024).toString('ascii').trimEnd().endsWith('%%EOF');
  if (mime === 'image/jpeg' && /\.jpe?g$/i.test(fileName) && jpeg) return 'jpg';
  if (mime === 'image/png' && /\.png$/i.test(fileName) && png) return 'png';
  if (mime === 'application/pdf' && /\.pdf$/i.test(fileName) && pdf && ['SITE_LAYOUT', 'SUPPORTING_FILE'].includes(category)) return 'pdf';
  throw new ApiError(422, 'INVALID_FILE_TYPE', 'Filename, MIME type and file signature must agree; photo categories accept JPEG/PNG only');
}

export async function uploadPreflight(user: Principal, id: string, version: number) {
  return surveyAtomic(async tx => {
    const survey = await requireSurvey(tx, user, id, version);
    requireFieldEditor(user, survey);
    if (await tx.surveyAttachment.count({ where: { surveyId: id } }) >= 25) throw new ApiError(409, 'ATTACHMENT_LIMIT', 'At most 25 attachments are allowed per assessment');
  });
}
export async function uploadAttachment(user: Principal, id: string, input: z.infer<typeof v.upload>, bytes: Buffer, mime: string, storage: SurveyStorage) {
  await uploadPreflight(user, id, input.version);
  const extension = validateFile(bytes, mime, input.fileName, input.category);
  const receipt = await storage.put(bytes, extension);
  try {
    return await surveyAtomic(async tx => {
      const current = await requireSurvey(tx, user, id, input.version);
      requireFieldEditor(user, current);
      if (await tx.surveyAttachment.count({ where: { surveyId: id } }) >= 25) throw new ApiError(409, 'ATTACHMENT_LIMIT', 'At most 25 attachments are allowed per assessment');
      const attachment = await tx.surveyAttachment.create({ data: { surveyId: id, uploaderId: user.id, category: input.category, fileName: input.fileName, mimeType: mime, sizeBytes: bytes.length, sha256: sha256(bytes), storageKey: receipt.key }, select: attachmentPublic });
      const survey = await saveSurvey(tx, user, current, {}, 'ATTACHMENT_ADDED', 'Survey evidence uploaded', { attachmentId: attachment.id, category: attachment.category, sha256: attachment.sha256 });
      return { attachment, surveyVersion: survey.version };
    });
  } catch (error) {
    // Known business/constraint/serialization failures rolled back. Unknown commit outcomes
    // retain the object for reconciliation rather than deleting evidence that may be referenced.
    const rolledBack = error instanceof ApiError || (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2003', 'P2004', 'P2025', 'P2034'].includes(error.code));
    if (rolledBack) await receipt.discard().catch(() => console.error(JSON.stringify({ event: 'survey_upload_cleanup_failed' })));
    else console.error(JSON.stringify({ event: 'survey_upload_reconciliation_required' }));
    throw error;
  }
}
export async function downloadAttachment(user: Principal, id: string, attachmentId: string, storage: SurveyStorage) {
  const file = await surveyAtomic(async tx => {
    await requireSurvey(tx, user, id);
    const record = await tx.surveyAttachment.findFirst({ where: { id: attachmentId, surveyId: id } });
    if (!record) throw new ApiError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found');
    return record;
  });
  const bytes = await storage.read(file.storageKey);
  if (bytes.length !== file.sizeBytes || sha256(bytes) !== file.sha256) throw new ApiError(409, 'STORAGE_INTEGRITY_ERROR', 'Attachment content differs from its recorded digest');
  return { bytes, fileName: file.fileName, mimeType: file.mimeType };
}
