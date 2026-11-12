# ==============================================================================
# GlamGo Luxury Beauty Marketplace — Automated Deployment Script (PowerShell)
# ==============================================================================
[CmdletBinding()]
param(
    [string]$EnvFile = ".env.production",
    [string]$ComposeFile = "docker-compose.prod.yml",
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "      GLAMGO LUXURY BEAUTY MARKETPLACE — PRODUCTION DEPLOYMENT        " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Deployment started at: $(Get-Date)"

# 1. Validation
Write-Host "`n[Step 1/5] Validating environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path $EnvFile)) {
    Write-Error "[ERROR] Required environment file '$EnvFile' not found! Copy .env.production.example to $EnvFile and set secrets."
    exit 1
}

# 2. Safety Backup
if (-not $SkipBackup) {
    Write-Host "`n[Step 2/5] Checking for active database to create pre-deploy backup..." -ForegroundColor Yellow
    $backupDir = "backups\pre_deploy"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$backupDir\glamgo_predeploy_$timestamp.dump"
    
    $container = docker ps -q --filter "name=glamgo_prod_postgres"
    if ($container) {
        Write-Host "Creating safety backup into $backupFile..."
        docker exec glamgo_prod_postgres pg_dump -U glamgo_prod_admin -d glamgo_prod_db -Fc > $backupFile
        Write-Host "✓ Backup created successfully." -ForegroundColor Green
    } else {
        Write-Host "Database container not currently running. Skipping live dump." -ForegroundColor Gray
    }
}

# 3. Build Images
Write-Host "`n[Step 3/5] Building production images..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile build --pull

# 4. Launch Stack
Write-Host "`n[Step 4/5] Launching containers and applying automated migrations..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile up -d

# 5. Readiness Probe
Write-Host "`n[Step 5/5] Checking application health readiness..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 1
$healthy = $false

while ($attempt -le $maxAttempts) {
    Start-Sleep -Seconds 3
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($resp.status -eq "healthy" -or $resp.database -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {
        Write-Host -NoNewline "."
    }
    $attempt++
}

Write-Host ""
if ($healthy) {
    Write-Host "`n======================================================================" -ForegroundColor Cyan
    Write-Host "    GLAMGO PRODUCTION DEPLOYMENT COMPLETED & VERIFIED HEALTHY!       " -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "Frontend:  http://localhost:80"
    Write-Host "Health:    http://localhost:80/health"
    Write-Host "Metrics:   http://localhost:80/metrics"
} else {
    Write-Host "`n[WARNING] Health probe did not respond within timeout. Check logs with:" -ForegroundColor Red
    Write-Host "docker compose -f $ComposeFile logs --tail 50 backend" -ForegroundColor Yellow
}
