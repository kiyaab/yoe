#!/bin/sh
# ==============================================================================
# Yalfal Online Eta - Automated PostgreSQL Backup & Rotation
# ==============================================================================

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/yalfal_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Starting PostgreSQL backup for ${POSTGRES_DB}..."

export PGPASSWORD="${POSTGRES_PASSWORD}"

if pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup successful: ${BACKUP_FILE} (Size: ${BACKUP_SIZE})"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Backup FAILED!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "yalfal_db_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

REMAINING_COUNT=$(find "${BACKUP_DIR}" -name "yalfal_db_*.sql.gz" -type f | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📊 Backup rotation completed. ${REMAINING_COUNT} snapshot(s) retained."
