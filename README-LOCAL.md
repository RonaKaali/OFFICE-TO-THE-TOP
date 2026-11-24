# OFFICE TO THE TOP — Local Multi-Agent WhatsApp System

> **WEBSITE GENZ** internal tool — Zero cost, zero VPS, runs on laptop startup.

## 🎯 Overview
Sistem multi-agen WhatsApp yang jalan **full local** di Windows:
- **Hermes Agent** = Orkestrator (ganti n8n)
- **Evolution API** (Node.js native) = WhatsApp Gateway
- **SQLite** = Database lokal (file `data/office.db`)
- **Supabase Cloud Free Tier** = Auth, RLS, Realtime (opsional sync)
- **Playwright** = Browser automation untuk agen scraper
- **Cloudflare Tunnel** = Public webhook URL gratis

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      LAPTOP WINDOWS                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               HERMES AGENT (Profile: default)       │   │
│  │  Skills: core-router, lib-wa, lib-status,           │   │
│  │          lib-memory, lib-db, agent-*, etc.          │   │
│  │  Kanban: Task queue & agent status                  │   │
│  │  Memory: Agent state persistence                    │   │
│  │  Cron: Housekeeping, watchdog                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  SQLite     │    │  Evolution  │    │  Playwright │    │
│  │  (office.db)│    │  API :8080  │    │  Chromium   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                            │                                │
│                     ┌──────┴──────┐                         │
│                     ▼             ▼                         │
│              ┌────────────┐ ┌────────────┐                 │
│              │ Cloudflare │ │  Supabase  │                 │
│              │  Tunnel    │ │  (Cloud)   │                 │
│              │  (Webhook) │ │  Auth/RLS  │                 │
│              └────────────┘ └────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Windows 10/11
- Node.js 18+ (`winget install OpenJS.NodeJS`)
- Git (`winget install Git.Git`)
- Cloudflare Tunnel (`winget install Cloudflare.cloudflared`) — optional

### One-Command Setup
```powershell
cd "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP"
npm run setup
```
Script `setup-native.ps1` akan:
1. Install npm packages
2. Clone & build Evolution API native
3. Install Playwright Chromium
4. Init SQLite database + seed agents
5. Install Hermes skills to profile
6. Setup Windows Task Scheduler auto-start
7. Create `.env` from template

### Manual Steps After Setup
```powershell
# 1. Edit .env with your Supabase credentials
notepad .env

# 2. Start the stack
npm run start

# 3. Open Evolution Manager & scan QR
start http://localhost:8080/manager

# 4. Test echo agent
npm run test:echo
```

### For Public Webhook (Client Demo)
```powershell
# Terminal 1: Start tunnel
npm run tunnel
# Copy https://xxx.trycloudflare.com

# Terminal 2: Set webhook in Evolution API
# Or use the script (auto-detects tunnel URL)
```

## 📁 Project Structure
```
OFFICE TO THE TOP/
├── package.json              # Node deps & scripts
├── .env.example              # Config template
├── .env                      # Your config (gitignored)
├── index.js                  # Main entry point
├── webhook-server.js         # HTTP webhook receiver
├── data/
│   ├── office.db             # SQLite database
│   └── evolution.db          # Evolution API data
├── evolution-api/            # Evolution API (native Node.js)
├── scripts/
│   ├── setup-native.ps1      # Master setup
│   ├── start-stack.ps1       # Start Evolution + Hermes
│   ├── stop-stack.ps1        # Stop stack
│   ├── cloudflare-tunnel.ps1 # Public tunnel
│   ├── setup-auto-start.ps1  # Windows Task Scheduler
│   ├── init-db.js            # Init SQLite schema
│   ├── seed-agents.js        # Seed default agents
│   └── test-echo.ps1         # Test /echo
├── skills/                   # Hermes Skills (auto-installed)
│   ├── core-router/          # WhatsApp router
│   ├── lib-wa/               # Evolution API wrapper
│   ├── lib-status/           # Agent status
│   ├── lib-memory/           # Agent memory (KV)
│   ├── lib-db/               # Database abstraction
│   ├── agent-echo/           # Template agent
│   ├── agent-produk/         # Product catalog
│   ├── agent-pesanan/        # Order processing
│   ├── agent-absensi/        # Attendance
│   ├── agent-antrian/        # Queue management
│   ├── agent-keuangan/       # Finance
│   ├── agent-konten/         # Content generation
│   └── agent-support/        # FAQ support
├── supabase/
│   └── schema.sql            # Supabase schema (reference)
└── docs/
    ├── PROMPT-TAMBAH-AGEN.md     # How to add new agent
    ├── PROMPT-DEPLOY-CLIENT.md   # Deploy to client UMKM
    └── TROUBLESHOOTING.md        # Common issues
```

## 🤖 Available Agents

| Agent | Command | Triggers | Description |
|-------|---------|----------|-------------|
| **Echo** | `/echo` | — | Test agent |
| **Produk** | `/produk` | produk, katalog, harga, stok | Katalog UMKM |
| **Pesanan** | `/pesanan` | pesan, order, beli | Terima order |
| **Absensi** | `/absensi` | absen, hadir, laporan | Absensi selfie |
| **Antrian** | `/antrian` | antrian, nomor, panggil | Antrian digital |
| **Keuangan** | `/keuangan` | omset, kas, laba, rugi | Rekap keuangan |
| **Konten** | `/konten` | caption, ide konten, post | Generate caption IG/TikTok |
| **Support** | `/support` | bantuan, faq, cara | Auto-reply FAQ |

## 🛠️ Development

### Add New Agent
See `docs/PROMPT-TAMBAH-AGEN.md` — 3 steps:
1. Create skill folder in `skills/agent-<name>/`
2. Implement `agent.js` with `handleMessage`/`handleMedia`
3. Register in database: `INSERT INTO agents ...`

### Database
- **Local**: SQLite (`data/office.db`) — zero config
- **Cloud**: Supabase — run `supabase/schema.sql` in SQL Editor

### Hermes Skills Location
Skills auto-installed to: `C:\Users\LENOVO\AppData\Local\hermes\profiles\default\skills\`

### Logs
- Evolution API: terminal where `npm run start` runs
- Hermes: Hermes Agent desktop app → Kanban board "Office Agents"
- Webhook: terminal running `node index.js`

## 📱 WhatsApp Setup
1. `npm run start` → Evolution API starts on `:8080`
2. Open `http://localhost:8080/manager`
3. Scan QR with **dedicated bot number** (not personal!)
4. Test: `/echo hello` from another number

## 🌐 Cloudflare Tunnel (Free Public URL)
```powershell
npm run tunnel
# Output: https://random-name.trycloudflare.com
```
Set as Evolution webhook: `https://xxx.trycloudflare.com/webhook/wa-incoming`

## ⚙️ Auto-Start on Boot
Configured via Windows Task Scheduler:
- Trigger: At logon (any user)
- Action: `powershell -ExecutionPolicy Bypass -File scripts\start-stack.ps1`
- Runs hidden, highest privileges

Manage: `Task Scheduler` → `Task Scheduler Library` → `OfficeToTheTop-AutoStart`

## 🔧 Configuration (.env)
```env
# Supabase (Cloud Free Tier)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_KEY=sb_secret_xxx

# LLM (for agents)
GEMINI_API_KEY=xxx          # Free: aistudio.google.com
ANTHROPIC_API_KEY=xxx       # Paid: console.anthropic.com

# WhatsApp
WA_ALLOWED_CHATS=           # Empty = all, or JIDs comma-separated
EVOLUTION_API_KEY=xxx       # Change from default!
```

## 📦 Backup
```powershell
# Backup database + config
Copy-Item data\office.db backup\office-$(Get-Date -Format yyyyMMdd).db
Copy-Item .env backup\env-$(Get-Date -Format yyyyMMdd)
Copy-Item evolution-api\.env backup\evolution-env-$(Get-Date -Format yyyyMMdd)
```

## 🐛 Troubleshooting
See `docs/TROUBLESHOOTING.md` for:
- Evolution API won't start
- QR code not showing
- Messages not received
- Agent not responding
- Database locked
- Port conflicts

## 📄 License
Internal tool — WEBSITE GENZ © 2024