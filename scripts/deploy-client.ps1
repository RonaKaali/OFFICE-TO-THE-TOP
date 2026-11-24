<#
.SYNOPSIS
    Deploy OFFICE TO THE TOP ke Client UMKM (Bronze/Silver/Gold/Platinum)
.DESCRIPTION
    Menyiapkan folder client mandiri dengan konfigurasi, skrip otomatis,
    skills agen terpilih, skema database, dan dokumentasi handover.
.EXAMPLE
    .\scripts\deploy-client.ps1 -ClientName "Warung Makmur" -Package Silver -WaNumber "628123456789"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ClientName,

    [ValidateSet("Bronze", "Silver", "Gold", "Platinum")]
    [string]$Package = "Bronze",

    [string]$WaNumber = "",

    [string]$SupabaseUrl = "https://svtfteuvlxkrvnjhxddn.supabase.co",
    [string]$SupabaseAnonKey = "sb_publishable_BFmp1da98M-g5fCC-r5iHw_Mkpx2xps",
    [string]$SupabaseServiceKey = ""
)

$ErrorActionPreference = "Stop"

$slug = $ClientName.ToLower() -replace '[^a-z0-9]+', '-'
$slug = $slug.Trim('-')
$projectRoot = Split-Path -Parent $PSScriptRoot
$clientDir = Join-Path $projectRoot "clients\$slug"

Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " 🚀 DEPLOYING OFFICE TO THE TOP FOR CLIENT: $ClientName" -ForegroundColor Yellow
Write-Host "    Package : $Package" -ForegroundColor White
Write-Host "    Folder  : $clientDir" -ForegroundColor White
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# 1. Create Directory Hierarchy
$dirs = @(
    $clientDir,
    "$clientDir\scripts",
    "$clientDir\supabase",
    "$clientDir\skills",
    "$clientDir\docs",
    "$clientDir\data"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

# 2. Generate .env Client
$apiKey = [System.Guid]::NewGuid().ToString("N")
$envContent = @"
# ─── CLIENT: $ClientName ($Package) ───
TZ=Asia/Jakarta
CLIENT_ID=$slug
CLIENT_NAME="$ClientName"
CLIENT_PACKAGE=$Package
CLIENT_WA=$WaNumber

# ─── EVOLUTION API ───
EVOLUTION_INSTANCE=$slug
EVOLUTION_API_KEY=$apiKey
EVOLUTION_URL=http://localhost:8080

# ─── SUPABASE ───
SUPABASE_URL=$SupabaseUrl
SUPABASE_ANON_KEY=$SupabaseAnonKey
NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SupabaseAnonKey
SUPABASE_SERVICE_KEY=$SupabaseServiceKey
DB_MODE=supabase

# ─── LLM API ───
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# ─── WHATSAPP ACL ───
WA_ALLOWED_CHATS=$WaNumber
"@

Set-Content -Path "$clientDir\.env" -Value $envContent -Encoding UTF8

# 3. Copy Shared Libraries & Core Skills
$coreLibs = @('lib-db', 'lib-memory', 'lib-status', 'lib-wa', 'core-router')
foreach ($lib in $coreLibs) {
    $src = Join-Path $projectRoot "skills\$lib"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination "$clientDir\skills\" -Recurse -Force
    }
}

# 4. Copy Package-Specific Agents
$agentsPerPackage = @{
    Bronze   = @('agent-produk', 'agent-support')
    Silver   = @('agent-produk', 'agent-pesanan', 'agent-support')
    Gold     = @('agent-produk', 'agent-pesanan', 'agent-absensi', 'agent-support')
    Platinum = @('agent-produk', 'agent-pesanan', 'agent-absensi', 'agent-antrian', 'agent-keuangan', 'agent-konten', 'agent-support')
}

$selectedAgents = $agentsPerPackage[$Package]
Write-Host "📦 Copying skills for package $Package..." -ForegroundColor Green
foreach ($agent in $selectedAgents) {
    $src = Join-Path $projectRoot "skills\$agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination "$clientDir\skills\" -Recurse -Force
        Write-Host "   + $agent" -ForegroundColor DarkGray
    }
}

# 5. Copy Client SQL Schema
$clientSqlPath = Join-Path $projectRoot "supabase\schema-client.sql"
if (Test-Path $clientSqlPath) {
    Copy-Item $clientSqlPath "$clientDir\supabase\schema-client.sql" -Force
}

# 6. Generate Client Scripts
$setupScript = @"
Write-Host "Starting setup for $ClientName..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    Write-Warning ".env file missing!"
}
npm install --production
Write-Host "Setup complete! Run scripts\start-client.ps1 to start." -ForegroundColor Green
"@
Set-Content -Path "$clientDir\scripts\setup-client.ps1" -Value $setupScript -Encoding UTF8

$startScript = @"
Write-Host "Starting OFFICE TO THE TOP ($ClientName)..." -ForegroundColor Cyan
node index.js
"@
Set-Content -Path "$clientDir\scripts\start-client.ps1" -Value $startScript -Encoding UTF8

# 7. Generate Client Manual & Command Docs
$caraPakai = @"
# Panduan Pemakaian OFFICE TO THE TOP - $ClientName
Paket: **$Package**

## 1. Persiapan
- Laptop / PC Windows 10/11
- Nomor WhatsApp khusus bot
- Koneksi Internet stabil

## 2. Cara Menjalankan
1. Jalankan PowerShell di folder ini.
2. Jalankan: `powershell scripts\start-client.ps1`
3. Buka WhatsApp dan scan QR di `http://localhost:8080/manager`

## 3. Fitur Utama Paket $Package
$($selectedAgents -join ', ')
"@
Set-Content -Path "$clientDir\docs\CARA-PAKAI.md" -Value $caraPakai -Encoding UTF8

Write-Host ""
Write-Host "✅ Selesai! Client folder siap di: $clientDir" -ForegroundColor Green
Write-Host "Siap dikirim atau di-zip ke client UMKM." -ForegroundColor White
