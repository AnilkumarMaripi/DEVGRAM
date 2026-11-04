# DevGram Database Backup & Restore Guide

This document describes how to execute automated backups and restore the DevGram PostgreSQL database from a backup snapshot.

---

## 1. Automated Backups & 7-Day Retention

Automated backups are produced using `pg_dump` with `--clean --if-exists` flags and compressed with `gzip`.

### Automated Execution Options:
- **Bash Script (`backup-db.sh`)**:
  ```bash
  chmod +x scripts/backup-db.sh
  ./scripts/backup-db.sh
  ```
- **PowerShell Script (`backup-db.ps1`)**:
  ```powershell
  .\scripts\backup-db.ps1
  ```
- **Crontab (Nightly at 02:00 AM)**:
  ```cron
  0 2 * * * /path/to/DevGram/Backend/scripts/backup-db.sh >> /var/log/devgram-backup.log 2>&1
  ```
- **Docker Compose Scheduler**:
  ```bash
  docker compose -f scripts/docker-compose.backup.yml up -d
  ```

---

## 2. Restoring the Database

### Prerequisites:
- Target PostgreSQL database is running and accessible.
- The `.sql.gz` or `.sql` backup file located in `backups/`.

### Step 1: Decompress Backup File (if compressed)
```bash
gunzip -k backups/devgram_postgres_YYYYMMDD_HHMMSS.sql.gz
```

### Step 2: Restore via psql
```bash
# Linux / macOS
PGPASSWORD=your_postgres_password psql -h localhost -p 5432 -U postgres -d postgres -f backups/devgram_postgres_YYYYMMDD_HHMMSS.sql

# Windows PowerShell
$env:PGPASSWORD="your_postgres_password"
psql -h localhost -p 5432 -U postgres -d postgres -f backups\devgram_postgres_YYYYMMDD_HHMMSS.sql
```

### Step 3: Verify Restoration
Run the verification query:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT count(*) FROM users;
SELECT count(*) FROM posts;
```

### Step 4: Restart DevGram Backend
Once the database is restored, restart the backend service to verify live connectivity and schema integrity:
```bash
npm start
```

