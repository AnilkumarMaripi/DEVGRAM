<#
.SYNOPSIS
    DevGram Automated PostgreSQL Backup Script for PowerShell (Windows/Cross-platform)
.DESCRIPTION
    Creates compressed database dumps using pg_dump and enforces a 7-day retention policy.
#>

$BackupDir = If ($env:BACKUP_DIR) { $env:BACKUP_DIR } Else { Join-Path $PSScriptRoot "..\backups" }
$PgHost = If ($env:PGHOST) { $env:PGHOST } Else { "localhost" }
$PgPort = If ($env:PGPORT) { $env:PGPORT } Else { "5432" }
$PgDatabase = If ($env:PGDATABASE) { $env:PGDATABASE } Else { "postgres" }
$PgUser = If ($env:PGUSER) { $env:PGUSER } Else { "postgres" }
$RetentionDays = 7

If (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $BackupDir "devgram_${PgDatabase}_${Timestamp}.sql"

Write-Host "📦 Starting DevGram PostgreSQL backup for $PgDatabase on ${PgHost}:${PgPort}..." -ForegroundColor Cyan

& pg_dump -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase --clean --if-exists -f $OutputFile

If ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
    $FileSize = (Get-Item $OutputFile).Length / 1MB
    Write-Host "✅ Backup created successfully: $OutputFile ($([math]::Round($FileSize, 2)) MB)" -ForegroundColor Green

    # Enforce 7-day retention
    Write-Host "🧹 Pruning backups older than $RetentionDays days..." -ForegroundColor Gray
    Get-ChildItem -Path $BackupDir -Filter "devgram_*.sql*" | Where-Object {
        $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
    } | Remove-Item -Force
    Write-Host "✨ Retention cleanup completed." -ForegroundColor Green
} Else {
    Write-Host "⚠️ Warning: pg_dump did not exit cleanly or pg_dump binary is not in PATH." -ForegroundColor Yellow
}

