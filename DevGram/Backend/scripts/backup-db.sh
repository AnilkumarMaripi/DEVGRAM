#!/usr/bin/env bash
# ====================================================================
# DevGram Automated PostgreSQL Database Backup Script
# Features:
# - pg_dump compressed backup with gzip
# - 7-day retention auto-pruning
# - Status logging & alert handling
# ====================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-postgres}"
PGUSER="${PGUSER:-postgres}"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/devgram_${PGDATABASE}_${TIMESTAMP}.sql.gz"

echo "📦 [$(date)] Starting DevGram database backup for ${PGDATABASE} on ${PGHOST}:${PGPORT}..."

# Execute pg_dump and pipe to gzip
export PGPASSWORD="${PGPASSWORD:-postgres}"
pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" --clean --if-exists | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ [$(date)] Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Enforce 7-day retention policy: remove archives older than 7 days
echo "🧹 Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "devgram_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "✨ Database backup workflow finished."

