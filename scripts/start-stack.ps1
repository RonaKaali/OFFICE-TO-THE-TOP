<##
.SYNOPSIS
    Start OFFICE TO THE TOP stack (Evolution API + Hermes Agent)
#>

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "Cyan" } }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

Write-Log "Starting OFFICE TO THE TOP stack..."

# 1. Start Evolution API
Write-Log "Starting Evolution API on port 8080..."
$evoPath = Join-Path $PROJECT_ROOT "evolution-api"
$evoProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $evoPath -PassThru -WindowStyle Hidden
Write-Log "Evolution API started (PID: $($evoProcess.Id))" "OK"

# 2. Wait for Evolution API to be ready
Write-Log "Waiting for Evolution API to be ready..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/manager" -Method Get -UseBasicParsing -ErrorAction Stop
        if ($response) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    Write-Log "Evolution API did not start in time" "ERROR"
    exit 1
}
Write-Log "Evolution API is ready!" "OK"

# 3. Start Hermes Agent (if not already running)
$hermesRunning = Get-Process -Name "hermes*" -ErrorAction SilentlyContinue
if (-not $hermesRunning) {
    Write-Log "Starting Hermes Agent..."
    Start-Process -FilePath "hermes-agent" -ArgumentList "--profile default" -WindowStyle Minimized
    Write-Log "Hermes Agent started" "OK"
} else {
    Write-Log "Hermes Agent already running" "OK"
}

# 4. Open Evolution Manager for QR scan
Write-Log "Opening Evolution Manager for QR scan..."
Start-Process "http://localhost:8080/manager"

Write-Log ""
Write-Log "=== STACK RUNNING ===" "OK"
Write-Log "Evolution API:  http://localhost:8080"
Write-Log "Evolution Manager:  http://localhost:8080/manager (scan QR here)"
Write-Log "Hermes Agent:  Running in background"
Write-Log ""
Write-Log "Press Ctrl+C to stop..."

# Keep script alive
try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    Write-Log "Stopping stack..."
    Stop-Process -Id $evoProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Log "Stack stopped"
}