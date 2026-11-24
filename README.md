# OFFICE TO THE TOP 🏢🚀

> **Local-First Multi-Agent WhatsApp System & UMKM SaaS Platform**
> Deployable on Cloudflare Edge + Supabase Cloud + Local Node.js Gateway

---

## 🌟 Highlights

- **Multi-Agent WhatsApp Fleet**: 8 Built-in AI agents (Echo, Produk, Pesanan, Absensi, Antrian, Keuangan, Konten, Support).
- **Modern Next.js 16 Web Dashboard**: Real-time fleet management, SSR Supabase data loading, and interactive control panel.
- **Supabase Cloud Native**: Integrated SSR cookies session management, Postgres RLS for multi-tenant UMKM isolation, and Realtime event streaming.
- **Cloudflare Edge Deployment**: Configured with `wrangler.jsonc` for Cloudflare Workers / Cloudflare Pages.
- **Client UMKM Provisioning**: Automated one-command deployment (`scripts/deploy-client.ps1`) for Bronze, Silver, Gold, and Platinum UMKM packages.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      OFFICE TO THE TOP                         │
│                                                                 │
│   ┌───────────────────────┐         ┌───────────────────────┐   │
│   │    Next.js 16 App     │         │   Evolution API WA    │   │
│   │   (Cloudflare Edge)   │         │    (Node.js Local)    │   │
│   └──────────┬────────────┘         └──────────┬────────────┘   │
│              │                                 │                │
│              ▼                                 ▼                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 SUPABASE POSTGRES CLOUD                 │   │
│   │  - agents / tasks / events / memory / processed_msgs    │   │
│   │  - todos / products / orders / attendance (RLS)         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/RonaKaali/OFFICE-TO-THE-TOP.git
cd OFFICE-TO-THE-TOP
npm install
```

### 2. Configure Environment
Create `.env.local` for Next.js web application:
```env
NEXT_PUBLIC_SUPABASE_URL=https://svtfteuvlxkrvnjhxddn.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_BFmp1da98M-g5fCC-r5iHw_Mkpx2xps
```

Create `.env` for WhatsApp backend & local workers:
```env
TZ=Asia/Jakarta
EVOLUTION_INSTANCE=kantor-ai
EVOLUTION_API_KEY='office-to-the-top-secret-key-change-me'
EVOLUTION_URL=http://localhost:8080

SUPABASE_URL=https://svtfteuvlxkrvnjhxddn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_BFmp1da98M-g5fCC-r5iHw_Mkpx2xps
NEXT_PUBLIC_SUPABASE_URL=https://svtfteuvlxkrvnjhxddn.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_BFmp1da98M-g5fCC-r5iHw_Mkpx2xps
DB_MODE=supabase
```

### 3. Run Web Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Next.js
```bash
npm run build
```

---

## ☁️ Deploy to Cloudflare

### Method A: Cloudflare Pages (Recommended via Git)
1. Push this repository to GitHub: `https://github.com/RonaKaali/OFFICE-TO-THE-TOP`
2. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select repository `RonaKaali/OFFICE-TO-THE-TOP`.
4. Build settings:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: `.next`
5. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://svtfteuvlxkrvnjhxddn.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_BFmp1da98M-g5fCC-r5iHw_Mkpx2xps`
6. Click **Save and Deploy**.

### Method B: Wrangler CLI
```bash
npx wrangler deploy
```

---

## 🗄️ Database Setup (Supabase)

Run the SQL migration script located at:
[supabase/schema.sql](file:///c:/Users/LENOVO/OneDrive/Desktop/OFFICE%20TO%20THE%20TOP/supabase/schema.sql)

It provisions:
- `todos` verification table
- `agents` fleet registry & statuses
- `tasks` queue & dispatch state
- `agent_events` realtime event logging
- `clients`, `products`, `orders`, and `attendance` with multi-tenant Row Level Security (RLS).

---

## 🤖 WhatsApp Agent Fleet

| Agent | Command | Triggers | Description |
|-------|---------|----------|-------------|
| **Echo** | `/echo` | ping, test | Test & verification agent |
| **Produk** | `/produk` | produk, katalog, harga, stok | Katalog produk UMKM |
| **Pesanan** | `/pesanan` | pesan, order, beli | Pemrosesan order pelanggan |
| **Absensi** | `/absensi` | absen, hadir, laporan | Absensi selfie karyawan |
| **Antrian** | `/antrian` | antrian, nomor, panggil | Antrian digital toko/klinik |
| **Keuangan** | `/keuangan` | omset, kas, laba, rugi | Rekapitulasi kas & omset |
| **Konten** | `/konten` | caption, ide konten, post | Generator caption IG & TikTok |
| **Support** | `/support` | bantuan, faq, cara | Auto-responder FAQ pelanggan |

---

## 📦 Client UMKM One-Command Deploy

To deploy an isolated instance for a client:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-client.ps1 -ClientName "Warung Makmur" -Package Silver -WaNumber "628123456789"
```

Packages:
- **Bronze**: Produk + Support (Katalog + FAQ)
- **Silver**: Produk + Pesanan + Support (Katalog + Order)
- **Gold**: Produk + Pesanan + Absensi + Support (Full Absensi)
- **Platinum**: Semua agen + custom integrations

---

## 📄 Documentation Links
- [Client Deployment Guide](file:///c:/Users/LENOVO/OneDrive/Desktop/OFFICE%20TO%20THE%20TOP/docs/PROMPT-DEPLOY-CLIENT.md)
- [Add New Agent Guide](file:///c:/Users/LENOVO/OneDrive/Desktop/OFFICE%20TO%20THE%20TOP/docs/PROMPT-TAMBAH-AGEN.md)
- [Troubleshooting Manual](file:///c:/Users/LENOVO/OneDrive/Desktop/OFFICE%20TO%20THE%20TOP/docs/TROUBLESHOOTING.md)
