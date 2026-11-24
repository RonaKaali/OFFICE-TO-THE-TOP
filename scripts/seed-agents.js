import Database from 'better-sqlite3';
import { join } from 'path';

const PROJECT_ROOT = 'C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP';
const DB_PATH = join(PROJECT_ROOT, 'data', 'office.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const agents = [
  { id: 'echo', name: 'Echo', role: 'Test agent', emoji: '🦜', color: '#6b7280', triggers: '[]', priority: 100, enabled: 1, desk: '{"x":-4,"z":0}', config: '{}' },
  { id: 'produk', name: 'Produk', role: 'Kelola katalog & harga produk UMKM', emoji: '📦', color: '#10b981', triggers: '["produk","katalog","harga","stok"]', priority: 10, enabled: 1, desk: '{"x":-2,"z":0}', config: '{}' },
  { id: 'pesanan', name: 'Pesanan', role: 'Terima & proses order via WA', emoji: '🛒', color: '#3b82f6', triggers: '["pesan","order","beli"]', priority: 10, enabled: 1, desk: '{"x":0,"z":0}', config: '{}' },
  { id: 'absensi', name: 'Absensi', role: 'Cek laporan absensi selfie', emoji: '📸', color: '#8b5cf6', triggers: '["absen","hadir","laporan"]', priority: 10, enabled: 1, desk: '{"x":2,"z":0}', config: '{}' },
  { id: 'antrian', name: 'Antrian', role: 'Kelola antrian digital', emoji: '🎫', color: '#f59e0b', triggers: '["antrian","nomor","panggil"]', priority: 10, enabled: 1, desk: '{"x":4,"z":0}', config: '{}' },
  { id: 'keuangan', name: 'Keuangan', role: 'Rekap omset/pengeluaran harian', emoji: '💰', color: '#ef4444', triggers: '["omset","kas","laba","rugi"]', priority: 10, enabled: 1, desk: '{"x":-2,"z":2}', config: '{}' },
  { id: 'konten', name: 'Konten', role: 'Generate caption/ide IG/TikTok', emoji: '✍️', color: '#ec4899', triggers: '["caption","ide konten","post"]', priority: 10, enabled: 1, desk: '{"x":0,"z":2}', config: '{}' },
  { id: 'support', name: 'Support', role: 'Auto-balas FAQ pelanggan', emoji: '🤝', color: '#06b6d4', triggers: '["bantuan","faq","cara"]', priority: 10, enabled: 1, desk: '{"x":2,"z":2}', config: '{}' }
];

const stmt = db.prepare(`
  INSERT INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, role=excluded.role, emoji=excluded.emoji,
    color=excluded.color, triggers=excluded.triggers, priority=excluded.priority,
    enabled=excluded.enabled, desk=excluded.desk, config=excluded.config,
    updated_at=CURRENT_TIMESTAMP
`);

for (const a of agents) {
  stmt.run(a.id, a.name, a.role, a.emoji, a.color, a.triggers, a.priority, a.enabled, a.desk, a.config);
  console.log(`Seeded: ${a.id} (${a.name})`);
}

db.close();
console.log('All agents seeded!');