---
name: agent-keuangan
description: "Agen Keuangan: Rekap omset/pengeluaran harian. Trigger: omset, kas, laba, rugi. Perintah: /keuangan ..."
category: office-agents
---
# agent-keuangan — Finance Agent

## Trigger
- Command: `/keuangan <subcommand>`
- Triggers: `["omset", "kas", "laba", "rugi"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/keuangan hari` | Omset & pengeluaran hari ini |
| `/keuangan minggu` | Rekap mingguan |
| `/keuangan bulan` | Rekap bulanan |
| `/keuangan catat masuk <jumlah> <keterangan>` | Catat pemasukan |
| `/keuangan catat keluar <jumlah> <keterangan>` | Catat pengeluaran |
| `/keuangan laporan` | Laporan lengkap Excel |

## Integration
- SaaS Keuangan UMKM
- Auto-sync dari Pesanan (paid orders)
- Kategori pengeluaran
- Export PDF/Excel untuk pajak