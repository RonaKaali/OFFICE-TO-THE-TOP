---
name: lib-status
description: "Agent status management: Working/Idle/Sleep/Error + dashboard events"
category: office-libs
---

# lib-status — Agent Status Manager

## Purpose
Track and update agent status in real-time for dashboard display.

## Status Values
| Status | Meaning | Color |
|--------|---------|-------|
| `working` | Actively processing task | 🟢 Green |
| `idle` | Ready, waiting for task | 🔵 Blue |
| `sleep` | Inactive >30 min (housekeeping) | 🟣 Purple |
| `error` | Task failed / exception | 🔴 Red |

## API

### setStatus(agentId, status, detail?)
```javascript
await status.setStatus('produk', 'working', 'Memproses katalog...');
await status.setStatus('produk', 'idle', 'Selesai');
```

### getStatus(agentId)
```javascript
const s = await status.getStatus('produk');
// { agent_id: 'produk', status: 'working', detail: '...', updated_at: '...' }
```

### listAll()
```javascript
const all = await status.listAll();
// [{ agent_id, status, detail, updated_at }, ...]
```

## Implementation
- Writes to `agent_events` table (event = status value)
- Dashboard reads from `agent_events` via Supabase Realtime
- Housekeeping (cron) auto-sets `sleep` for idle >30min
- Error handler auto-sets `error` on exception

## Usage in Agent Skills
```javascript
import { status } from '../lib-status/status.js';

// Start of task
await status.setStatus(agentId, 'working', `Processing: ${text.slice(0,50)}`);

try {
  // ... do work ...
  await status.setStatus(agentId, 'idle', 'Done');
} catch (err) {
  await status.setStatus(agentId, 'error', err.message);
  throw err;
}
```