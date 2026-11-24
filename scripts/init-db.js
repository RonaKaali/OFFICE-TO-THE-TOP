import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import initSqlJs from 'sql.js';

const PROJECT_ROOT = 'C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP';
const DB_PATH = join(PROJECT_ROOT, 'data', 'office.db');

console.log('Initializing database at:', DB_PATH);

// Load SQL.js (WASM)
const SQL = await initSqlJs({
  locateFile: () => join(PROJECT_ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
});

// Load existing DB or create new
let db;
if (existsSync(DB_PATH)) {
  const fileBuffer = readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
  console.log('Loaded existing database');
} else {
  db = new SQL.Database();
  console.log('Created new database');
}

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// ============================================
// CORE TABLES (adapted from kantor-ai supabase/schema.sql)
// ============================================

// Agents registry
db.exec(`
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    emoji TEXT,
    color TEXT,
    triggers TEXT, -- JSON array as text
    priority INTEGER DEFAULT 10,
    enabled INTEGER DEFAULT 1,
    desk TEXT, -- JSON position
    config TEXT, -- JSON config
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Tasks queue
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    sender TEXT,
    push_name TEXT,
    text TEXT,
    message_id TEXT,
    message_type TEXT,
    media_base64 TEXT,
    mime_type TEXT,
    is_group INTEGER DEFAULT 0,
    instance TEXT,
    status TEXT DEFAULT 'pending', -- pending, working, done, failed
    result TEXT, -- JSON result
    error TEXT,
    started_at DATETIME,
    finished_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_status ON tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_chat ON tasks(chat_id);
`);

// Agent events (for dashboard/realtime)
db.exec(`
CREATE TABLE IF NOT EXISTS agent_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    event TEXT NOT NULL, -- working, idle, error, log
    message TEXT,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent_time ON agent_events(agent_id, created_at DESC);
`);

// Agent memory (key-value per agent)
db.exec(`
CREATE TABLE IF NOT EXISTS agent_memory (
    agent_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT, -- JSON value
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (agent_id, key),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);
`);

// Webhook deduplication (message_id tracking)
db.exec(`
CREATE TABLE IF NOT EXISTS processed_messages (
    message_id TEXT PRIMARY KEY,
    chat_id TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_processed_messages_time ON processed_messages(processed_at);
`);

// WA allowed chats (JID list)
db.exec(`
CREATE TABLE IF NOT EXISTS wa_allowed_chats (
    jid TEXT PRIMARY KEY,
    description TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Housekeeping log
db.exec(`
CREATE TABLE IF NOT EXISTS housekeeping_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

console.log('Core tables created.');

// Insert default agents (from seed_agents_contoh.sql adapted)
const defaultAgents = [
    { id: 'echo', name: 'Echo', role: 'Test agent', emoji: '🦜', color: '#6b7280', triggers: '[]', priority: 100, enabled: 1, desk: '{"x":-4,"z":0}', config: '{}' },
    { id: 'produk', name: 'Produk', role: 'Kelola katalog & harga produk UMKM', emoji: '📦', color: '#10b981', triggers: '["produk","katalog","harga","stok"]', priority: 10, enabled: 1, desk: '{"x":-2,"z":0}', config: '{}' },
    { id: 'pesanan', name: 'Pesanan', role: 'Terima & proses order via WA', emoji: '🛒', color: '#3b82f6', triggers: '["pesan","order","beli"]', priority: 10, enabled: 1, desk: '{"x":0,"z":0}', config: '{}' },
    { id: 'absensi', name: 'Absensi', role: 'Cek laporan absensi selfie', emoji: '📸', color: '#8b5cf6', triggers: '["absen","hadir","laporan"]', priority: 10, enabled: 1, desk: '{"x":2,"z":0}', config: '{}' },
    { id: 'antrian', name: 'Antrian', role: 'Kelola antrian digital', emoji: '🎫', color: '#f59e0b', triggers: '["antrian","nomor","panggil"]', priority: 10, enabled: 1, desk: '{"x":4,"z":0}', config: '{}' },
    { id: 'keuangan', name: 'Keuangan', role: 'Rekap omset/pengeluaran harian', emoji: '💰', color: '#ef4444', triggers: '["omset","kas","laba","rugi"]', priority: 10, enabled: 1, desk: '{"x":-2,"z":2}', config: '{}' },
    { id: 'konten', name: 'Konten', role: 'Generate caption/ide IG/TikTok', emoji: '✍️', color: '#ec4899', triggers: '["caption","ide konten","post"]', priority: 10, enabled: 1, desk: '{"x":0,"z":2}', config: '{}' },
    { id: 'support', name: 'Support', role: 'Auto-balas FAQ pelanggan', emoji: '🤝', color: '#06b6d4', triggers: '["bantuan","faq","cara"]', priority: 10, enabled: 1, desk: '{"x":2,"z":2}', config: '{}' }
];

const insertAgent = db.prepare(`
INSERT OR REPLACE INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const agent of defaultAgents) {
    insertAgent.run([agent.id, agent.name, agent.role, agent.emoji, agent.color, agent.triggers, agent.priority, agent.enabled, agent.desk, agent.config]);
    console.log(`  Agent registered: ${agent.id} (${agent.name})`);
}

console.log('Database initialization complete!');
console.log('DB file:', DB_PATH);

// Save database to file
const data = db.export();
writeFileSync(DB_PATH, Buffer.from(data));
console.log('Database saved to:', DB_PATH);

db.close();