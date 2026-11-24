---
name: agent-produk
description: "Agen Produk: Kelola katalog/harga/stok produk UMKM via WhatsApp. Trigger: produk, katalog, harga, stok. Perintah: /produk ..."
category: office-agents
---

# agent-produk — Product Catalog Agent

## Purpose
Manage product catalog for UMKM clients: add, list, update price/stock, delete products.

## Trigger
- Command: `/produk <subcommand> [args]`
- Triggers: `["produk", "katalog", "harga", "stok"]`

## Subcommands
| Command | Description | Example |
|---------|-------------|---------|
| `/produk tambah "Nama" 15000 50` | Tambah produk baru | `/produk tambah "Nasi Goreng" 15000 50` |
| `/produk katalog` | Lihat daftar produk | `/produk katalog` |
| `/produk harga "Nama" 18000` | Update harga | `/produk harga "Nasi Goreng" 18000` |
| `/produk stok "Nama" 30` | Update stok | `/produk stok "Nasi Goreng" 30` |
| `/produk hapus "Nama"` | Hapus produk | `/produk hapus "Nasi Goreng"` |
| `/produk cari "kata"` | Cari produk | `/produk cari nasi` |

## Data Model (SQLite: products table)
```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL, -- mapped from chat_id
    name TEXT NOT NULL,
    price INTEGER NOT NULL, -- in rupiah (no decimals)
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, name)
);
```

## Implementation Plan
1. Parse subcommand from text
2. Get client_id from chat_id mapping (or use chat_id directly for single-tenant)
3. Execute CRUD on products table
4. Format reply with emoji/table
5. Return { reply }

## Usage in Agent Skill
```javascript
export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Produk: ${text.slice(0,50)}`);
  
  const parts = text.split(' ').filter(Boolean);
  const subcmd = parts[1]?.toLowerCase();
  const args = parts.slice(2).join(' ');
  
  let reply;
  switch (subcmd) {
    case 'tambah': case 'add': reply = await addProduct(chat_id, args); break;
    case 'katalog': case 'list': reply = await listProducts(chat_id); break;
    case 'harga': case 'price': reply = await updatePrice(chat_id, args); break;
    case 'stok': case 'stock': reply = await updateStock(chat_id, args); break;
    case 'hapus': case 'delete': reply = await deleteProduct(chat_id, args); break;
    case 'cari': case 'search': reply = await searchProducts(chat_id, args); break;
    default: reply = getHelp();
  }
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}
```

## Help Text
```
📦 *Agen Produk - WEBSITE GENZ*

Perintah:
/produk tambah "Nama" Harga Stok [Kategori]
  Contoh: /produk tambah "Nasi Goreng" 15000 50 Makanan

/produk katalog
  Lihat semua produk

/produk harga "Nama" HargaBaru
  Contoh: /produk harga "Nasi Goreng" 18000

/produk stok "Nama" StokBaru
  Contoh: /produk stok "Nasi Goreng" 30

/produk hapus "Nama"
  Hapus produk

/produk cari "kata"
  Cari produk

Trigger otomatis: produk, katalog, harga, stok
```