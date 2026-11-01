#!/bin/sh
# Operator-run logical backup example. No automatic rotation, restore or deletion.
# Configure a dedicated libpq PGSERVICE and owner-only PGPASSFILE externally.
# https://www.postgresql.org/docs/18/app-pgdump.html
set -eu
umask 077
: "${PGSERVICE:?Set an explicit libpq backup service}"
: "${BACKUP_ROOT:?Set an existing private backup destination}"
: "${EVIDENCE_ROOT:?Set the persistent immutable evidence root}"
backup_root=$(realpath -e -- "$BACKUP_ROOT")
evidence_root=$(realpath -e -- "$EVIDENCE_ROOT")
test -d "$backup_root" && test -d "$evidence_root"
case "$backup_root" in /) echo 'Backup destination must not be the filesystem root' >&2; exit 1;; esac
case "$evidence_root" in /) echo 'Evidence source must not be the filesystem root' >&2; exit 1;; esac
case "$backup_root/" in "$evidence_root/"*) echo 'Keep backups outside evidence storage' >&2; exit 1;; esac
target=$(mktemp -d "$backup_root/solar-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
pg_dump --format=custom --no-owner --no-acl --file="$target/database.dump"
# Evidence objects are immutable and retained. Copy after the database snapshot.
tar -C "$evidence_root" -czf "$target/evidence.tar.gz" .
(cd "$target" && sha256sum database.dump evidence.tar.gz > SHA256SUMS)
printf 'Backup created: %s\n' "$target"
# This is not a verified recovery plan or point-in-time recovery configuration.
# Retain role/migration configuration and encryption keys separately. Validate
# restoration into a separate disposable database before relying on backups.
