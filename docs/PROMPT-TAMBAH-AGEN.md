# PROMPT: Tambah Agen Baru ke OFFICE TO THE TOP

> Copy-paste ke **Antigravity** (coding agent) untuk bikin agen baru dalam 5 menit.

---

## 🎯 Prompt untuk Antigravity

```
KAMU ANTIGRAVITY — TAMBAH AGEN BARU KE OFFICE TO THE TOP.

NAMA AGEN: <isi nama, mis: agent-laporan>
ID AGEN: <isi id unik, mis: laporan>  (huruf kecil, angka, _ atau -)
TRIGGERS: <array kata kunci, mis: ["laporan", "report", "rekap"]>
PERAN: <deskripsi singkat, mis: "Generate laporan harian/mingguan">
EMOJI: <emoji, mis: 📊>
WARNA: <hex, mis: #6366f1>

BUATKAN:
1. Folder: skills/agent-<id>/
2. SKILL.md (dari template)
3. agent.js dengan handleMessage + handleMedia
4. SQL insert untuk tabel agents
5. Update README-LOCAL.md daftar agen

TEMPLATE agent.js:
```javascript
import { status } from '../lib-status/status.js';
import { db } from '../lib-db/db.js';
import { memory } from '../lib-memory/memory.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id, task_id } = context;
  await status.setStatus(agent_id, 'working', `<id>: ${text.slice(0,50)}`);
  
  // TODO: Implement logic here
  const reply = `🤖 Agen <id>: Belum diimplementasikan. Input: "${text}"`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  const { agent_id, mime_type } = context;
  await status.setStatus(agent_id, 'working', `<id> media: ${mime_type}`);
  return { reply: `📎 Media diterima (${mime_type}). Fitur coming soon.` };
}
```

SQL:
```sql
INSERT INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config) VALUES
('<id>', '<Nama>', '<Peran>', '<Emoji>', '<Warna>', '<JSON triggers>', 10, true, '{"x":0,"z":0}', '{}')
ON CONFLICT (id) DO UPDATE SET enabled=true;
```

OUTPUT: File-file siap pakai, tidak perlu jalanin.
```

---

## ✅ Checklist Manual (Kalau Mau Sendiri)

### 1. Buat Folder Skill
```powershell
mkdir "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP\skills\agent-<id>"
```

### 2. Buat SKILL.md
```markdown
---
name: agent-<id>
description: "Agen <Nama>: <Peran>. Trigger: <triggers>. Perintah: /<id> ..."
category: office-agents
---

# agent-<id> — <Nama>

## Trigger
- Command: `/<id> <subcommand>`
- Triggers: <array>

## Subcommands
| Command | Description |
|---------|-------------|
| `/<id> <sub>` | ... |

## Implementasi
- `handleMessage(context)` — logika utama
- `handleMedia(context)` — optional
```

### 3. Buat agent.js
```javascript
import { status } from '../lib-status/status.js';
import { db } from '../lib-db/db.js';
import { memory } from '../lib-memory/memory.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id, task_id } = context;
  await status.setStatus(agent_id, 'working', `<id>: ${text.slice(0,50)}`);
  
  // Parse subcommand
  const parts = text.trim().split(/\s+/);
  const subcmd = parts[1]?.toLowerCase() || '';
  const args = parts.slice(2).join(' ');
  
  let reply;
  switch (subcmd) {
    case 'sub1': reply = await doSub1(chat_id, args); break;
    case 'sub2': reply = await doSub2(chat_id, args); break;
    default: reply = getHelp();
  }
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  // Optional: handle image/document
  return { reply: 'Media diterima' };
}

function getHelp() {
  return `<Emoji> *Agen <Nama>*

Perintah:
/<id> sub1 — ...
/<id> sub2 — ...

Trigger otomatis: <triggers>`;
}
```

### 4. Daftarkan ke Database
```powershell
# Option A: Via SQLite CLI
sqlite3 data/office.db "INSERT INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config) VALUES ('<id>', '<Nama>', '<Peran>', '<Emoji>', '<Warna>', '<JSON triggers>', 10, true, '{\"x\":0,\"z\":0}', '{}');"

# Option B: Via Node
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/office.db');
db.prepare(\`INSERT INTO agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config) VALUES ('<id>', '<Nama>', '<Peran>', '<Emoji>', '<Warna>', '<JSON triggers>', 10, true, '{\"x\":0,\"z\":0}', '{}')\`).run();
console.log('Done');
"
```

### 5. Install Skill ke Hermes
```powershell
# Copy ke Hermes profile
$src = "C:\Users\LENOVO\OneDrive\Desktop\OFFICE TO THE TOP\skills\agent-<id>"
$dst = "C:\Users\LENOVO\AppData\Local\hermes\profiles\default\skills\agent-<id>"
Copy-Item $src $dst -Recurse -Force
```

### 6. Test
```powershell
# Restart Hermes / reload skills
# Kirim WA: /<id> test
# Atau trigger: <kata kunci>
```

---

## 🔧 Tips

### Multi-Step Flow (Conversation State)
```javascript
// In handleMessage:
const flowState = await memory.flow.getState(agent_id, chat_id);
if (flowState === 'awaiting_name') {
  await memory.flow.setState(agent_id, chat_id, 'awaiting_price', { name: text });
  return { reply: 'Nama diterima. Sekarang masukkan harga:' };
}
await memory.flow.setState(agent_id, chat_id, 'awaiting_name');
return { reply: 'Masukkan nama produk:' };
```

### Access Supabase (Cloud Mode)
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { data } = await supabase.from('my_table').select('*').eq('client_id', chatId);
```

### Call Another Agent
```javascript
// Via router (internal)
const result = await router.dispatch('keuangan', {
  ...context,
  text: '/keuangan catat pengeluaran 50000'
});
```

### Browser Automation (Playwright)
```javascript
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
// ... scrape ...
await browser.close();
```

---

## 📝 Contoh Agen Siap Pakai (Ideas)

| ID | Name | Triggers | Use Case |
|----|------|----------|----------|
| `inventaris` | Inventaris | stok, barang, inventaris | Gudang UMKM |
| `pegawai` | Pegawai | gaji, cuti, shift, pegawai | HR sederhana |
| `marketing` | Marketing | kampanye, iklan, promosi | Auto-post IG |
| `survey` | Survey | survey, polling, vote | Quick poll grup |
| `jadwal` | Jadwal | jadwal, kalender, reminder | Reminder otomatis |