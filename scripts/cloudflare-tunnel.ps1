<##
.SYNOPSIS
    Run Cloudflare Tunnel for public webhook URL (Evolution API)
.DESCRIPTION
    Creates a temporary public HTTPS URL pointing to local Evolution API (port 8080).
    Use this URL in Evolution API webhook config for receiving WhatsApp messages.
.NOTES
    Requires: cloudflared (winget install Cloudflare.cloudflared)
    Free, no account needed for trycloudflare.com subdomains.
#>

param(
    [int]$Port = 8080,
    [string]$Subdomain = ""  # Optional: custom subdomain (requires Cloudflare account + tunnel config)
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "Cyan" } }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

Write-Log "Starting Cloudflare Tunnel to localhost:$Port..."

# Check cloudflared
$cloudflared = Get-Command "cloudflared" -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Log "cloudflared not found!" "ERROR"
    Write-Log "Install: winget install Cloudflare.cloudflared" "ERROR"
    exit 1
}

# Build command
$args = @("tunnel", "--url", "http://localhost:$Port", "--no-autoupdate")
if ($Subdomain) {
    $args += "--hostname", $Subdomain
}

Write-Log "Command: cloudflared $($args -join ' ')"
Write-Log ""
Write-Log "=== TUNNEL STARTING ===" "OK"
Write-Log "Copy the https://*.trycloudflare.com URL below"
Write-Log "Set it in Evolution API webhook config:"
Write-Log "  POST https://YOUR_TUNNEL_URL/webhook/wa-incoming"
Write-Log ""
Write-Log "Press Ctrl+C to stop tunnel"
Write-Log ""

# Run tunnel (blocking)
& cloudflared @args

# This line only runs after Ctrl+C
Write-Log "Tunnel stopped"