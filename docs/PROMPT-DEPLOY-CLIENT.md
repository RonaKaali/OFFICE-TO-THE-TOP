# PROMPT: Deploy OFFICE TO THE TOP ke Client UMKM

> Copy-paste ke **Antigravity** untuk setup instance client baru (demo/produksi).

---

## 🎯 Prompt untuk Antigravity

```
KAMU ANTIGRAVITY — DEPLOY OFFICE TO THE TOP KE CLIENT BARU.

CLIENT INFO:
- Nama UMKM: <Warung Makmur>
- Paket: <Bronze/Silver/Gold/Platinum>
- Nomor WA Bot: <628xxxxxxxxxx> (khusus client, bukan nomor Alex)
- Fitur aktif: <Produk, Pesanan, Support> (pilih dari daftar agen)
- Supabase Project: < Baru / Existing >

TUGAS:
1. Buat folder client: clients/<slug>/
2. Generate config .env.client
3. Setup Supabase: schema + RLS policies per client
4. Seed agents sesuai paket
5. Buat script deploy-client.ps1 (one-command)
6. Dokumentasi handover ke client

OUTPUT: Folder clients/<slug>/ siap dikirim/zip ke client.
```

---

## 📦 Paket & Agen Mapping

| Paket | Harga | Agen Aktif | Fitur Utama |
|-------|-------|------------|-------------|
| **Bronze** | 350K | Produk, Support | Katalog + FAQ |
| **Silver** | 650K | Produk, Pesanan, Support | Order + Katalog |
| **Gold** | 1JT | Produk, Pesanan, Absensi, Support | Full SaaS Absensi |
| **Platinum** | 2JT | Semua agen + Custom | Full + Antrian + Keuangan + Konten |

---

## 🏗️ Struktur Folder Client

```
clients/<slug>/
├── .env                    # Config client (Supabase, WA, API keys)
├── docker-compose.yml      # Optional: jika client pakai VPS
├── scripts/
│   ├── setup-client.ps1    # Setup di laptop/VPS client
│   ├── start-client.ps1    # Jalankan stack
│   └── backup-client.ps1   # Backup rutin
├── supabase/
│   ├── schema-client.sql   # Schema + RLS policies
│   └── seed-agents.sql     # Agents sesuai paket
├── skills/                 # Copy skills yang dipakai
│   ├── agent-produk/
│   ├── agent-pesanan/
│   └── agent-support/
├── docs/
│   ├── CARA-PAKAI.md       # Manual client (Bahasa Indonesia)
│   ├── PERINTAH-WA.md      # Daftar perintah WhatsApp
│   └── TROUBLESHOOT.md     # FAQ client
└── README-CLIENT.md        # Overview untuk client
```

---

## 🔐 Supabase RLS per Client

**Penting**: Setiap client punya data terisolasi.

```sql
-- 1. Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 2. Policy: client hanya lihat data sendiri
CREATE POLICY "client_isolation" ON products
  USING (client_id = current_setting('app.current_client_id')::text);

-- 3. Set client_id via RPC saat login
CREATE OR REPLACE FUNCTION set_client_context(p_client_id text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.current_client_id', p_client_id, true);
END; $$;
```

**Di aplikasi**: Set `client_id` = `chat_id` (WA number) atau custom ID.

---

## 📋 Script: deploy-client.ps1 (Template)

```powershell
<#
.SYNOPSIS
    Deploy OFFICE TO THE TOP ke client UMKM
#>

param(
    [string]$ClientName,
    [string]$Package = "Bronze",  # Bronze, Silver, Gold, Platinum
    [string]$WaNumber,
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey,
    [string]$SupabaseServiceKey
)

$slug = $ClientName.ToLower().Replace(' ', '-')
$clientDir = "clients\$slug"

# 1. Create folder structure
mkdir $clientDir, "$clientDir\scripts", "$clientDir\supabase", "$clientDir\skills", "$clientDir\docs" -Force

# 2. Generate .env
@"
TZ=Asia/Jakarta
EVOLUTION_INSTANCE=$slug
EVOLUTION_API_KEY=$(New-Guid).ToString('N')
SUPABASE_URL=$SupabaseUrl
SUPABASE_ANON_KEY=$SupabaseAnonKey
SUPABASE_SERVICE_KEY=$SupabaseServiceKey
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
WA_ALLOWED_CHATS=
"@ | Set-Content "$clientDir\.env" -Encoding UTF8

# 3. Copy skills sesuai paket
$agents = @{
    Bronze = @('agent-produk', 'agent-support')
    Silver = @('agent-produk', 'agent-pesanan', 'agent-support')
    Gold   = @('agent-produk', 'agent-pesanan', 'agent-absensi', 'agent-support')
    Platinum = @('agent-produk', 'agent-pesanan', 'agent-absensi', 'agent-antrian', 'agent-keuangan', 'agent-konten', 'agent-support')
}
foreach ($agent in $agents[$Package]) {
    Copy-Item "skills\$agent" "$clientDir\skills\" -Recurse -Force
}

# 4. Generate Supabase schema + seed
# ... (generate SQL files)

# 5. Generate docs
# CARA-PAKAI.md, PERINTAH-WA.md, etc.

Write-Host "✅ Client $ClientName ($Package) ready at $clientDir" -ForegroundColor Green
Write-Host "Next: Zip folder, send to client, they run scripts\setup-client.ps1"
```

---

## 📄 Handover Documents untuk Client

### CARA-PAKAI.md (Bahasa Indonesia)
```
# Cara Pakai OFFICE TO THE TOP - <Nama UMKM>

## 1. Persiapan
- Laptop Windows 10/11
- Nomor WA khusus bot (sudah disediakan)
- Internet stabil

## 2. Menjalankan
- Double-click `scripts\start-client.bat`
- Tunggu sampai muncul "System ready!"
- Buka WhatsApp → kirim `/produk katalog` untuk test

## 3. Perintah Utama
/produk katalog          - Lihat daftar produk
/produk tambah "Nasi" 15000 50  - Tambah produk
/pesanan baru "Nasi" 2  - Buat pesanan
/support                - Bantuan

## 4. Troubleshooting
- Bot tidak balas? Cek laptop menyala & internet
- QR expired? Restart & scan ulang
- Error? Hubungi WEBSITE GENZ (Alex)
```

### PERINTAH-WA.md
```
# Daftar Perintah WhatsApp - Paket <Paket>

## Produk 📦
/produk katalog                    - Lihat semua produk
/produk tambah "Nama" Harga Stok   - Tambah produk
/produk harga "Nama" HargaBaru     - Ubah harga
/produk stok "Nama" Jumlah         - Ubah stok
/produk hapus "Nama"               - Hapus produk
/produk cari "kata"                - Cari produk

## Pesanan 🛒 (Silver+)
/pesanan baru "Produk" Jumlah      - Order baru
/pesanan daftar                    - Lihat pesanan saya
/pesanan status <id>               - Cek status

## Absensi 📸 (Gold+)
/absensi hadir                     - Absen masuk
/absensi pulang                    - Absen pulang
/absensi laporan                   - Laporan bulanan

## Support 🤝
/support                           - Bantuan & FAQ
/bantuan                           - Sama
```

---

## ✅ Checklist Deploy

- [ ] Folder `clients/<slug>/` dibuat
- [ ] `.env` terisi Supabase + WA credentials
- [ ] Skills sesuai paket ter-copy
- [ ] Supabase schema + RLS dijalankan
- [ ] Agents di-seed ke database
- [ ] `scripts/setup-client.ps1` tested
- [ ] `docs/CARA-PAKAI.md` customized
- [ ] `docs/PERINTAH-WA.md` customized
- [ ] Zip folder → kirim ke client via Telegram/Drive
- [ ] Client test run → confirm working
- [ ] Catat di CRM: client, paket, tanggal deploy, status