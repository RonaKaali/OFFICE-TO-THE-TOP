---
name: core-router
description: "WhatsApp router: receives webhook, matches command/triggers, dispatches to agent skills"
category: office-core
---

# core-router — WhatsApp Message Router

## Purpose
Entry point for all incoming WhatsApp messages. Normalizes, deduplicates, matches commands/triggers, dispatches to agent skills.

## Flow
```
Evolution API webhook (POST /webhook/wa-incoming)
    ↓
core-router.receive(payload)
    ↓
Normalize: extract text, chat_id, sender, message_id, media, is_group
    ↓
Dedup: check processed_messages (message_id)
    ↓
ACL: check WA_ALLOWED_CHATS / wa_allowed_chats table
    ↓
Route:
  - /command → direct agent
  - triggers match → agent with matching trigger
  - group + no match → ignore
  - private + no match → show agent list
    ↓
Dispatch: call agent skill via delegation (Hermes) or direct import
    ↓
Mark processed
```

## API

### receive(payload)
```javascript
// Called by HTTP webhook handler
await router.receive(evolutionPayload);
```

### route(text, context)
```javascript
// Internal: determine which agent handles this
const { agentId, isCommand, matchedTrigger } = router.route(text, context);
```

### getAgentList()
```javascript
// For /help or unknown private message
const list = router.getAgentList();
// [{ id, name, emoji, role, triggers }]
```

## Routing Logic

### Commands (priority 1)
- Format: `/agentid args...`
- Example: `/produk katalog`, `/echo halo`
- Always routes to that agent if enabled

### Triggers (priority 2)
- Keywords from `agents.triggers` (JSON array)
- Case-insensitive, word boundary match
- Example: triggers `['produk','katalog']` matches "cek katalog produk"

### Group vs Private
- **Group**: Only responds to commands OR trigger matches. Silent otherwise.
- **Private**: Responds to commands, triggers, OR shows help list if no match.

### ACL (WA_ALLOWED_CHATS)
- Empty = allow all
- Comma-separated JIDs or `@g.us` / `@s.whatsapp.net`
- Checked before routing

## Webhook Payload (Evolution API)
```json
{
  "event": "messages.upsert",
  "instance": "kantor-ai",
  "data": {
    "key": {
      "remoteJid": "628123456789@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0...",
      "participant": "628123456789@s.whatsapp.net"
    },
    "message": {
      "conversation": "/produk katalog"
    },
    "messageType": "conversation",
    "messageTimestamp": 1700000000,
    "pushName": "Alex"
  }
}
```

## Implementation
- HTTP server on port 3001 (internal) for webhook
- Uses `lib-db` for dedup + ACL + agent registry
- Uses `lib-status` for agent status updates
- Delegates to agent skills via Hermes `delegation` tool or direct import

## Agent Skill Interface (Contract)
Each agent skill MUST export:
```javascript
export async function handleMessage(context) {
  // context = { text, chat_id, sender, push_name, message_id, is_group, media_base64, mime_type, task_id, agent_id }
  // Returns: { reply: string, mediaBase64?: string, mimeType?: string }
}

export async function handleMedia(context) {
  // For image/document/video/audio
  // Returns same as handleMessage
}
```

## Error Handling
- Invalid payload → log, return 200 (ack)
- Duplicate message_id → ignore, return 200
- Agent not found / disabled → reply "Agen tidak tersedia"
- Agent throws → log error, set status `error`, reply "Maaf, terjadi kesalahan"