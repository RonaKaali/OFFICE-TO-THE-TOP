---
name: lib-db
description: "Database layer: SQLite (local) + Supabase (cloud) abstraction for agents"
category: office-libs
---

# lib-db — Database Abstraction Layer

## Purpose
Unified interface for agents to read/write data. Uses **SQLite locally** (file: `data/office.db`) and **Supabase (cloud)** for production sync.

## Configuration
- `DB_MODE`: `sqlite` (default, local) | `supabase` (cloud)
- SQLite path: `C:/Users/LENOVO/OneDrive/Desktop/OFFICE TO THE TOP/data/office.db`
- Supabase: via `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (env)

## API (available to all agent skills)

### SQLite (Local Mode)
```javascript
import Database from 'better-sqlite3';
const db = new Database('data/office.db');
db.pragma('journal_mode = WAL');

// Query helpers
db.prepare('SELECT * FROM agents WHERE enabled=1').all();
db.prepare('INSERT INTO tasks ...').run(...);
db.prepare('UPDATE agents SET ... WHERE id=?').run(...);
db.prepare('DELETE FROM ... WHERE ...').run(...);

// Transaction
const tx = db.transaction(() => { ... });
tx();
```

### Supabase (Cloud Mode)
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Agents
await supabase.from('agents').select('*').eq('enabled', true);
// Tasks
await supabase.from('tasks').insert({ ... });
// Events
await supabase.from('agent_events').insert({ agent_id, event, message });
// Memory
await supabase.from('agent_memory').upsert({ agent_id, key, value });
// RPC
await supabase.rpc('finish_task', { p_task_id, p_status, p_result });
```

## Unified Wrapper (use in skills)
```javascript
// lib/db.js - auto-detects mode
export const db = {
  agents: {
    list: () => DB_MODE === 'sqlite' ? ... : ...,
    get: (id) => ...,
    upsert: (agent) => ...
  },
  tasks: {
    create: (task) => ...,
    get: (id) => ...,
    updateStatus: (id, status, result?) => ...,
    listPending: (agentId) => ...
  },
  events: {
    log: (agentId, event, message, metadata?) => ...
  },
  memory: {
    get: (agentId, key) => ...,
    set: (agentId, key, value) => ...
  },
  allowedChats: {
    list: () => ...,
    isAllowed: (chatId) => ...
  }
};
```

## Usage in Agent Skills
```javascript
import { db } from '../lib-db/db.js';

// In handle_message:
const agent = await db.agents.get(context.agent_id);
const task = await db.tasks.create({ ... });
await db.events.log(agent_id, 'working', 'Processing...');
const memory = await db.memory.get(agent_id, 'conversation_context');
await db.memory.set(agent_id, 'last_chat', chat_id);
await db.tasks.updateStatus(task.id, 'done', { reply });
await db.events.log(agent_id, 'idle', 'Done');
```

## Tables Reference
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `agents` | Agent registry | id, name, triggers, enabled |
| `tasks` | Task queue | id, agent_id, chat_id, status, result |
| `agent_events` | Dashboard log | agent_id, event, message, created_at |
| `agent_memory` | Agent KV store | agent_id, key, value |
| `processed_messages` | Dedup | message_id |
| `wa_allowed_chats` | ACL | jid |
| `housekeeping_log` | Maintenance | action, details |