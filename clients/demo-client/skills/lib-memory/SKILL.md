---
name: lib-memory
description: "Agent memory: key-value store per agent (conversation context, user prefs, etc.)"
category: office-libs
---

# lib-memory — Agent Memory (KV Store)

## Purpose
Persistent key-value storage per agent for conversation context, user preferences, session data.

## API

### get(agentId, key, defaultValue?)
```javascript
const context = await memory.get('produk', 'conversation_context', []);
const userLang = await memory.get('support', 'user_lang', 'id');
```

### set(agentId, key, value)
```javascript
await memory.set('produk', 'last_chat', chatId);
await memory.set('produk', 'conversation_context', [...messages]);
```

### delete(agentId, key)
```javascript
await memory.delete('produk', 'temp_data');
```

### clear(agentId)
```javascript
await memory.clear('produk'); // wipe all keys for agent
```

### getAll(agentId)
```javascript
const all = await memory.getAll('produk');
// { last_chat: '...', conversation_context: [...] }
```

## Storage
- SQLite: `agent_memory` table (agent_id, key, value JSON)
- Supabase: same table with RLS

## Usage Patterns

### Conversation Context (last 10 messages)
```javascript
// In handle_message:
let ctx = await memory.get(agentId, 'conversation_context', []);
ctx.push({ role: 'user', content: text, timestamp: Date.now() });
if (ctx.length > 20) ctx = ctx.slice(-20);
await memory.set(agentId, 'conversation_context', ctx);
```

### User Preferences
```javascript
await memory.set(agentId, `user:${chatId}:lang`, 'id');
await memory.set(agentId, `user:${chatId}:timezone`, 'Asia/Jakarta');
```

### Temporary State (multi-step flow)
```javascript
await memory.set(agentId, `flow:${chatId}:step`, 'awaiting_product_name');
await memory.set(agentId, `flow:${chatId}:data`, { category: 'makanan' });
```

## TTL / Cleanup
- Housekeeping cron can clean old keys (>7 days)
- `memory.set()` auto-updates `updated_at`