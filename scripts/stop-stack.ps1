<##
.SYNOPSIS
    Stop OFFICE TO THE TOP stack
#>

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "Cyan" } }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

Write-Log "Stopping OFFICE TO THE TOP stack..."

# Stop Evolution API (npm start process)
$evoProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*evolution-api*" }
if ($evoProcesses) {
    foreach ($proc in $evoProcesses) {
        Write-Log "Stopping Evolution API (PID: $($proc.Id))..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Log "Evolution API stopped" "OK"
} else {
    Write-Log "Evolution API not running" "WARN"
}

# Optionally stop Hermes Agent (commented - usually keep running)
# $hermesProcesses = Get-Process -Name "hermes*" -ErrorAction SilentlyContinue
# if ($hermesProcesses) { ... }

Write-Log "Stack stopped"