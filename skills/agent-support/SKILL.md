---
name: agent-support
description: "Agen Support: Auto-balas FAQ pelanggan. Trigger: bantuan, faq, cara. Perintah: /support ..."
category: office-agents
---
# agent-support — FAQ Support Agent

## Trigger
- Command: `/support <pertanyaan>` atau `/bantuan`
- Triggers: `["bantuan", "faq", "cara", "help"]`

## Subcommands (Planned)
| Command | Description |
|---------|-------------|
| `/support` | Tampilkan daftar FAQ |
| `/support <pertanyaan>` | Cari jawaban otomatis |
| `/support daftar` | List semua FAQ |
| `/support tambah "Q" "A"` | Tambah FAQ (admin) |
| `/support hapus <id>` | Hapus FAQ (admin) |

## Data Model
```sql
CREATE TABLE faqs (
  id INTEGER PRIMARY KEY,
  client_id TEXT,
  question TEXT,
  answer TEXT,
  keywords TEXT, -- JSON array for matching
  category TEXT,
  priority INTEGER DEFAULT 10,
  enabled INTEGER DEFAULT 1
);
```

## Logic
1. Exact match keywords → return answer
2. Fuzzy match (LLM) → return best match
3. No match → "Maaf, tidak paham. Hubungi admin: ..." + log untuk training
4. Auto-learn dari chat admin-customer