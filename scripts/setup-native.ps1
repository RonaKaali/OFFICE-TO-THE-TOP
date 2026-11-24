<##
.SYNOPSIS
    Setup OFFICE TO THE TOP - Local Multi-Agent WhatsApp System (No Docker)
.DESCRIPTION
    Installs all dependencies, configures Evolution API native, SQLite DB,
    Playwright, Hermes skills, Cloudflare Tunnel, and Windows Auto-Start.
.NOTES
    Author: Antigravity (via Hermes Agent)
    Target: Windows 11, Node.js 18+, PowerShell 5.1+
#>

param(
    [switch]$ForceReinstall,
    [switch]$SkipTunnel,
    [switch]$SkipAutostart
)

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"
$ENV_FILE = Join-Path $PROJECT_ROOT ".env"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "OK"    { "Green" }
        default { "Cyan" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Check-Command {
    param([string]$Command, [string]$Name, [string]$InstallHint)
    try {
        $null = & $Command --version 2>$null
        Write-Log "✓ $Name found" "OK"
        return $true
    } catch {
        Write-Log "✗ $Name NOT found. $InstallHint" "ERROR"
        return $false
    }
}

function Check-Node {
    Write-Log "Checking Node.js..."
    if (-not (Check-Command "node" "Node.js" "Install dari https://nodejs.org atau via winget: `winget install OpenJS.NodeJS`")) {
        exit 1
    }
    $version = node --version
    Write-Log "Node.js version: $version"
}

function Check-Npm {
    Write-Log "Checking npm..."
    if (-not (Check-Command "npm" "npm" "Installed with Node.js")) {
        exit 1
    }
}

function Check-Git {
    Write-Log "Checking Git..."
    Check-Command "git" "Git" "Install via winget: `winget install Git.Git`" | Out-Null
}

function Check-Cloudflared {
    Write-Log "Checking cloudflared..."
    if (-not (Check-Command "cloudflared" "cloudflared" "Install: `winget install Cloudflare.cloudflared`")) {
        Write-Log "Cloudflare Tunnel opsional (untuk webhook WA publik). Lanjut tanpa tunnel." "WARN"
        return $false
    }
    return $true
}

function Setup-Environment {
    Write-Log "Setting up .env file..."
    if (-not (Test-Path $ENV_FILE)) {
        $example = Join-Path $PROJECT_ROOT ".env.example"
        if (Test-Path $example) {
            Copy-Item $example $ENV_FILE
            Write-Log "Created .env from .env.example" "OK"
        } else {
            Write-Log ".env.example not found!" "ERROR"
            exit 1
        }
    } else {
        Write-Log ".env already exists" "OK"
    }
}

function Install-NpmPackages {
    Write-Log "Installing npm packages..."
    Set-Location $PROJECT_ROOT
    if ($ForceReinstall -or -not (Test-Path "node_modules")) {
        npm install 2>&1 | Write-Host
        Write-Log "npm install completed" "OK"
    } else {
        Write-Log "node_modules exists, skipping (use -ForceReinstall to force)" "WARN"
    }
}

function Setup-EvolutionAPI {
    Write-Log "Setting up Evolution API (native)..."
    $evoPath = Join-Path $PROJECT_ROOT "evolution-api"
    
    if (-not (Test-Path $evoPath)) {
        Write-Log "Cloning Evolution API..."
        git clone https://github.com/EvolutionAPI/evolution-api.git $evoPath 2>&1 | Write-Host
    } else {
        Write-Log "Evolution API already cloned, pulling latest..."
        Set-Location $evoPath
        git pull 2>&1 | Write-Host
    }
    
    Set-Location $evoPath
    
    if ($ForceReinstall -or -not (Test-Path "node_modules")) {
        Write-Log "Installing Evolution API dependencies..."
        npm install 2>&1 | Write-Host
    }
    
    # Create .env for Evolution API if not exists
    $evoEnv = Join-Path $evoPath ".env"
    if (-not (Test-Path $evoEnv)) {
        Write-Log "Creating Evolution API .env..."
        $evoEnvContent = @"
# Evolution API Configuration - LOCAL MODE
SERVER_URL=http://localhost:8080
AUTHENTICATION_API_KEY=office-to-the-top-secret-key-change-me
DATABASE_PROVIDER=sqlite
DATABASE_CONNECTION_URI=file:../../data/evolution.db
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false
CACHE_REDIS_ENABLED=false
WEBSOCKET_ENABLED=true
CONFIG_SESSION_PHONE_CLIENT=OFFICE TO THE TOP
CONFIG_SESSION_PHONE_NAME=Chrome
LOG_LEVEL=INFO
DEL_INSTANCE=false
PORT=8080
"@
        Set-Content -Path $evoEnv -Value $evoEnvContent -Encoding UTF8
        Write-Log "Evolution API .env created" "OK"
    }
    
    Write-Log "Building Evolution API..."
    npm run build 2>&1 | Write-Host
    Write-Log "Evolution API built successfully" "OK"
}

function Install-Playwright {
    Write-Log "Installing Playwright Chromium..."
    Set-Location $PROJECT_ROOT
    npx playwright install chromium --with-deps 2>&1 | Write-Host
    Write-Log "Playwright Chromium installed" "OK"
}

function Init-Database {
    Write-Log "Initializing SQLite database..."
    Set-Location $PROJECT_ROOT
    node scripts/init-db.js 2>&1 | Write-Host
    Write-Log "Database initialized" "OK"
}

function Seed-Agents {
    Write-Log "Seeding agents to database..."
    Set-Location $PROJECT_ROOT
    node scripts/seed-agents.js 2>&1 | Write-Host
    Write-Log "Agents seeded" "OK"
}

function Install-HermesSkills {
    Write-Log "Installing Hermes skills..."
    $skillsSource = Join-Path $PROJECT_ROOT "skills"
    $skillsTarget = "C:\Users\LENOVO\AppData\Local\hermes\profiles\default\skills"
    
    if (-not (Test-Path $skillsTarget)) {
        New-Item -ItemType Directory -Path $skillsTarget -Force | Out-Null
    }
    
    # Copy each skill folder
    Get-ChildItem $skillsSource -Directory | ForEach-Object {
        $dest = Join-Path $skillsTarget $_.Name
        if (Test-Path $dest) {
            Remove-Item $dest -Recurse -Force
        }
        Copy-Item $_.FullName $dest -Recurse
        Write-Log "  Installed skill: $($_.Name)" "OK"
    }
    
    Write-Log "All skills installed to Hermes profile" "OK"
}

function Setup-CloudflareTunnel {
    if ($SkipTunnel) { return }
    $hasCloudflared = Check-Cloudflared
    if (-not $hasCloudflared) { return }
    
    Write-Log "Setting up Cloudflare Tunnel script..."
    # Script already created, just verify
    $tunnelScript = Join-Path $PROJECT_ROOT "scripts\cloudflare-tunnel.ps1"
    if (Test-Path $tunnelScript) {
        Write-Log "Cloudflare Tunnel script ready" "OK"
    }
}

function Setup-AutoStart {
    if ($SkipAutostart) { return }
    Write-Log "Setting up Windows Auto-Start (Task Scheduler)..."
    powershell -ExecutionPolicy Bypass -File "scripts\setup-auto-start.ps1" 2>&1 | Write-Host
    Write-Log "Auto-start configured" "OK"
}

function Verify-Installation {
    Write-Log "Verifying installation..."
    $checks = @(
        @{ Name = "Project .env"; Path = Join-Path $PROJECT_ROOT ".env" },
        @{ Name = "Evolution API .env"; Path = Join-Path $PROJECT_ROOT "evolution-api\.env" },
        @{ Name = "SQLite DB"; Path = Join-Path $PROJECT_ROOT "data\office.db" },
        @{ Name = "Evolution DB"; Path = Join-Path $PROJECT_ROOT "data\evolution.db" },
        @{ Name = "node_modules"; Path = Join-Path $PROJECT_ROOT "node_modules" },
        @{ Name = "Evolution build"; Path = Join-Path $PROJECT_ROOT "evolution-api\dist" }
    )
    
    $allOk = $true
    foreach ($check in $checks) {
        if (Test-Path $check.Path) {
            Write-Log "✓ $($check.Name)" "OK"
        } else {
            Write-Log "✗ $($check.Name) - MISSING: $($check.Path)" "ERROR"
            $allOk = $false
        }
    }
    
    if ($allOk) {
        Write-Log "=== ALL CHECKS PASSED ===" "OK"
    } else {
        Write-Log "=== SOME CHECKS FAILED ===" "ERROR"
    }
}

# ========== MAIN ==========
Write-Log "========================================"
Write-Log "  OFFICE TO THE TOP - NATIVE SETUP"
Write-Log "========================================"

Check-Node
Check-Npm
Check-Git
Setup-Environment
Install-NpmPackages
Setup-EvolutionAPI
Install-Playwright
Init-Database
Seed-Agents
Install-HermesSkills
Setup-CloudflareTunnel
Setup-AutoStart
Verify-Installation

Write-Log ""
Write-Log "========================================"
Write-Log "  SETUP COMPLETE!"
Write-Log "========================================"
Write-Log ""
Write-Log "NEXT STEPS:"
Write-Log "1. Edit .env with your Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)"
Write-Log "2. Edit evolution-api/.env if needed (API key, etc.)"
Write-Log "3. Start the stack:  npm run start"
Write-Log "4. Open Evolution Manager:  start http://localhost:8080/manager"
Write-Log "5. Scan QR code with WhatsApp"
Write-Log "6. Test:  npm run test:echo"
Write-Log ""
Write-Log "Cloudflare Tunnel (for public webhook):  npm run tunnel"
Write-Log "Auto-start on boot:  Already configured via Task Scheduler"
Write-Log ""