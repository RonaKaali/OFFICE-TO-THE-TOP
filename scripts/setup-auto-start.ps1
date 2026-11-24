<##
.SYNOPSIS
    Setup Windows Task Scheduler for auto-start on boot/login
.DESCRIPTION
    Creates a scheduled task that runs the stack automatically when user logs in.
    Runs with highest privileges to ensure Docker/Node processes can start.
#>

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "Cyan" } }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

$taskName = "OfficeToTheTop-AutoStart"
$scriptPath = Join-Path $PROJECT_ROOT "scripts\start-stack.ps1"
$powershellExe = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""

Write-Log "Creating Windows Task Scheduler entry: $taskName"

# Delete existing task if exists
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Log "Removing existing task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create trigger: At log on (any user)
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Create action: Run PowerShell script
$action = New-ScheduledTaskAction -Execute $powershellExe -Argument $arguments

# Settings: Run with highest privileges, allow on demand, etc.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 24) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Principal: Run as current user with highest privileges
$principal = New-ScheduledTaskPrincipal -UserId (Get-CimInstance -ClassName Win32_ComputerSystem).UserName -LogonType Interactive -RunLevel Highest

# Register task
Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -Principal $principal -Force

Write-Log "Task registered successfully!" "OK"
Write-Log ""
Write-Log "Task Details:"
Write-Log "  Name: $taskName"
Write-Log "  Trigger: At user logon"
Write-Log "  Action: $powershellExe $arguments"
Write-Log "  Run Level: Highest privileges"
Write-Log ""
Write-Log "To test manually: Run-ScheduledTask -TaskName $taskName"
Write-Log "To disable: Disable-ScheduledTask -TaskName $taskName"
Write-Log "To remove: Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
Write-Log ""
Write-Log "Note: Task runs in background (hidden window). Check Task Scheduler > Task Scheduler Library for status."