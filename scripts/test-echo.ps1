<##
.SYNOPSIS
    Test Echo agent via WhatsApp (send /echo test message)
#>

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "Cyan" } }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# Load .env
$envFile = Join-Path $PROJECT_ROOT ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim("'\"")
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$instance = $env:EVOLUTION_INSTANCE ?? "kantor-ai"
$apiKey = $env:EVOLUTION_API_KEY ?? "office-to-the-top-secret-key-change-me"
$baseUrl = "http://localhost:8080"

Write-Log "Testing Echo agent..."
Write-Log "Instance: $instance"
Write-Log "Base URL: $baseUrl"

# Get instance status
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/instance/connectionState/$instance" -Headers @{ "apikey" = $apiKey } -Method Get
    Write-Log "Instance state: $($status.instance.state)"
    if ($status.instance.state -ne "open") {
        Write-Log "Instance not connected! Scan QR at http://localhost:8080/manager" "WARN"
        Start-Process "http://localhost:8080/manager"
        exit 1
    }
} catch {
    Write-Log "Failed to get instance status: $($_.Exception.Message)" "ERROR"
    exit 1
}

# Ask for target number
$target = Read-Host "Enter target WhatsApp number (format: 628xxxxxxxxxx)"
if (-not $target -or $target -notmatch '^\d+$') {
    Write-Log "Invalid number format" "ERROR"
    exit 1
}

$chatId = "$target@s.whatsapp.net"
$message = "/echo Halo dari OFFICE TO THE TOP! ⏰ $(Get-Date -Format 'HH:mm:ss')"

Write-Log "Sending test message to $chatId..."

$payload = @{
    number = $target
    text = $message
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/message/sendText/$instance" `
        -Method Post `
        -Headers @{ "apikey" = $apiKey; "Content-Type" = "application/json" } `
        -Body $payload
    Write-Log "Message sent!" "OK"
    Write-Log "Response: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Log "Failed to send: $($_.Exception.Message)" "ERROR"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Log "Error body: $body" "ERROR"
    }
}

Write-Log ""
Write-Log "Check WhatsApp for reply. Check Hermes Kanban for agent status."