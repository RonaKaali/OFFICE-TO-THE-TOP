---
name: agent-pesanan
description: "Agen Pesanan: Terima & proses order via WA. Trigger: pesan, order, beli. Perintah: /pesanan ..."
category: office-agents
---

# agent-pesanan — Order Processing Agent

## Trigger
- Command: `/pesanan <subcommand>`
- Triggers: `["pesan", "order", "beli"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/pesanan baru "Produk" Jumlah` | Buat pesanan baru |
| `/pesanan daftar` | Lihat pesanan saya |
| `/pesanan status <id>` | Cek status pesanan |
| `/pesanan bayar <id>` | Konfirmasi pembayaran |
| `/pesanan batal <id>` | Batalkan pesanan |

## Data Model
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  client_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items TEXT, -- JSON: [{product_id, name, qty, price}]
  total INTEGER,
  status TEXT, -- pending, confirmed, preparing, ready, delivered, cancelled
  payment_status TEXT, -- unpaid, paid, refunded
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Notes
- Integrasi dengan agent-produk (cek stok, kurangi stok)
- Notifikasi ke admin via AKUNTAN_ADMIN_CHATS
- Support pembayaran QRIS (generate via API)
- History pesanan per customer