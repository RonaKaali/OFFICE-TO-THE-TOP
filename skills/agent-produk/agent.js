// Agent Produk - Product Catalog Management
import { status } from '../lib-status/status.js';
import { db } from '../lib-db/db.js';
import Database from 'better-sqlite3';

const DB_PATH = 'C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db';

// Initialize products table
function initProductsTable() {
  const sqlite = new Database(DB_PATH);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, name)
    );
    CREATE INDEX IF NOT EXISTS idx_products_client ON products(client_id);
  `);
  sqlite.close();
}
initProductsTable();

function getSqlite() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  return sqlite;
}

// Parse quoted string: "Nama Produk" 15000 50
function parseArgs(argsString) {
  const regex = /"([^"]+)"|(\S+)/g;
  const matches = [...argsString.matchAll(regex)];
  return matches.map(m => m[1] || m[2]).filter(Boolean);
}

function formatPrice(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function getHelp() {
  return `📦 *Agen Produk - WEBSITE GENZ*

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

Trigger otomatis: produk, katalog, harga, stok`;
}

async function addProduct(clientId, args) {
  const parsed = parseArgs(args);
  if (parsed.length < 3) return '❌ Format: /produk tambah "Nama" Harga Stok [Kategori]';
  
  const [name, priceStr, stockStr, ...rest] = parsed;
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  const stock = parseInt(stockStr, 10);
  const category = rest.join(' ') || 'Umum';
  
  if (isNaN(price) || isNaN(stock)) return '❌ Harga dan stok harus angka';
  
  const sqlite = getSqlite();
  try {
    sqlite.prepare(`
      INSERT INTO products (client_id, name, price, stock, category)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(client_id, name) DO UPDATE SET
        price=excluded.price, stock=excluded.stock, category=excluded.category,
        updated_at=CURRENT_TIMESTAMP
    `).run(clientId, name, price, stock, category);
    return `✅ Produk *${name}* ditambah/diperbarui\n💰 Harga: ${formatPrice(price)}\n📦 Stok: ${stock}\n🏷️ Kategori: ${category}`;
  } catch (err) {
    return `❌ Gagal: ${err.message}`;
  } finally {
    sqlite.close();
  }
}

async function listProducts(clientId) {
  const sqlite = getSqlite();
  try {
    const products = sqlite.prepare('SELECT * FROM products WHERE client_id=? ORDER BY category, name').all(clientId);
    if (products.length === 0) return '📭 Belum ada produk. Tambah dengan: /produk tambah "Nama" Harga Stok';
    
    let reply = `📦 *Katalog Produk (${products.length} item)*\n\n`;
    let currentCat = '';
    for (const p of products) {
      if (p.category !== currentCat) {
        currentCat = p.category;
        reply += `\n🏷️ *${currentCat}*\n`;
      }
      const stockEmoji = p.stock > 10 ? '🟢' : p.stock > 0 ? '🟡' : '🔴';
      reply += `${stockEmoji} ${p.name} — ${formatPrice(p.price)} (Stok: ${p.stock})\n`;
    }
    return reply;
  } finally {
    sqlite.close();
  }
}

async function updatePrice(clientId, args) {
  const parsed = parseArgs(args);
  if (parsed.length < 2) return '❌ Format: /produk harga "Nama" HargaBaru';
  
  const [name, priceStr] = parsed;
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  if (isNaN(price)) return '❌ Harga harus angka';
  
  const sqlite = getSqlite();
  try {
    const result = sqlite.prepare('UPDATE products SET price=?, updated_at=CURRENT_TIMESTAMP WHERE client_id=? AND name=?').run(price, clientId, name);
    if (result.changes === 0) return `❌ Produk "${name}" tidak ditemukan`;
    return `✅ Harga *${name}* diupdate: ${formatPrice(price)}`;
  } finally {
    sqlite.close();
  }
}

async function updateStock(clientId, args) {
  const parsed = parseArgs(args);
  if (parsed.length < 2) return '❌ Format: /produk stok "Nama" StokBaru';
  
  const [name, stockStr] = parsed;
  const stock = parseInt(stockStr, 10);
  if (isNaN(stock)) return '❌ Stok harus angka';
  
  const sqlite = getSqlite();
  try {
    const result = sqlite.prepare('UPDATE products SET stock=?, updated_at=CURRENT_TIMESTAMP WHERE client_id=? AND name=?').run(stock, clientId, name);
    if (result.changes === 0) return `❌ Produk "${name}" tidak ditemukan`;
    const emoji = stock > 10 ? '🟢' : stock > 0 ? '🟡' : '🔴';
    return `✅ Stok *${name}* diupdate: ${emoji} ${stock}`;
  } finally {
    sqlite.close();
  }
}

async function deleteProduct(clientId, args) {
  const parsed = parseArgs(args);
  if (parsed.length < 1) return '❌ Format: /produk hapus "Nama"';
  
  const name = parsed[0];
  const sqlite = getSqlite();
  try {
    const result = sqlite.prepare('DELETE FROM products WHERE client_id=? AND name=?').run(clientId, name);
    if (result.changes === 0) return `❌ Produk "${name}" tidak ditemukan`;
    return `🗑️ Produk *${name}* dihapus`;
  } finally {
    sqlite.close();
  }
}

async function searchProducts(clientId, args) {
  const keyword = args.trim().toLowerCase();
  if (!keyword) return '❌ Format: /produk cari "kata"';
  
  const sqlite = getSqlite();
  try {
    const products = sqlite.prepare('SELECT * FROM products WHERE client_id=? AND (name LIKE ? OR category LIKE ?) ORDER BY name')
      .all(clientId, `%${keyword}%`, `%${keyword}%`);
    if (products.length === 0) return `🔍 Tidak ada produk dengan kata "${keyword}"`;
    
    let reply = `🔍 *Hasil cari "${keyword}" (${products.length})*\n\n`;
    for (const p of products) {
      const stockEmoji = p.stock > 10 ? '🟢' : p.stock > 0 ? '🟡' : '🔴';
      reply += `${stockEmoji} ${p.name} — ${formatPrice(p.price)} (Stok: ${p.stock}) [${p.category}]\n`;
    }
    return reply;
  } finally {
    sqlite.close();
  }
}

// Main handler
export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  
  await status.setStatus(agent_id, 'working', `Produk: ${text.slice(0, 50)}`);
  
  // Use chat_id as client_id (single tenant per chat)
  const clientId = chat_id;
  
  const parts = text.trim().split(/\s+/);
  const subcmd = parts[1]?.toLowerCase() || '';
  const args = parts.slice(2).join(' ');
  
  let reply;
  switch (subcmd) {
    case 'tambah': case 'add': case 'buat': reply = await addProduct(clientId, args); break;
    case 'katalog': case 'list': case 'daftar': case 'lihat': reply = await listProducts(clientId); break;
    case 'harga': case 'price': case 'ubah': reply = await updatePrice(clientId, args); break;
    case 'stok': case 'stock': case 'stok': reply = await updateStock(clientId, args); break;
    case 'hapus': case 'delete': case 'del': reply = await deleteProduct(clientId, args); break;
    case 'cari': case 'search': case 'find': reply = await searchProducts(clientId, args); break;
    default: reply = getHelp();
  }
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  const { agent_id, mime_type } = context;
  await status.setStatus(agent_id, 'working', `Produk media: ${mime_type}`);
  // TODO: OCR image for product data
  return { reply: `📸 Foto produk diterima. Fitur OCR coming soon!` };
}

export default { handleMessage, handleMedia };