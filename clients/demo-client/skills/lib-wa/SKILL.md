---
name: lib-wa
description: "WhatsApp wrapper: send/receive via Evolution API (local Node.js)"
category: office-libs
---

# lib-wa — Evolution API Wrapper

## Purpose
Simple HTTP client for Evolution API running locally on `http://localhost:8080`.

## Configuration (from .env)
- `EVOLUTION_URL`: `http://localhost:8080`
- `EVOLUTION_INSTANCE`: `kantor-ai`
- `EVOLUTION_API_KEY`: secret key

## API

### sendText(chatId, text)
```javascript
await wa.sendText('628123456789@s.whatsapp.net', 'Halo!');
```

### sendMedia(chatId, mediaBase64, mimeType, caption?)
```javascript
await wa.sendMedia(chatId, base64, 'image/jpeg', 'Ini fotonya');
```

### sendButtons(chatId, text, buttons[])
```javascript
await wa.sendButtons(chatId, 'Pilih:', [
  { buttonId: 'opt1', buttonText: { displayText: 'Opsi 1' }, type: 1 },
  { buttonId: 'opt2', buttonText: { displayText: 'Opsi 2' }, type: 1 }
]);
```

### markRead(messageId)
```javascript
await wa.markRead(messageId);
```

### getInstanceState()
```javascript
const state = await wa.getInstanceState();
// { instance: { state: 'open' | 'connecting' | 'close' } }
```

### getGroups()
```javascript
const groups = await wa.getGroups();
// [{ id: '123@g.us', name: 'Grup Test', ... }]
```

### setWebhook(url, events?)
```javascript
await wa.setWebhook('https://xxx.trycloudflare.com/webhook/wa-incoming', [
  'messages.upsert', 'messages.update', 'connection.update'
]);
```

## Usage in Agent Skills
```javascript
import { wa } from '../lib-wa/wa.js';

// In handle_message:
await wa.sendText(context.chat_id, reply);

// For media:
const mediaB64 = await generateImage();
await wa.sendMedia(context.chat_id, mediaB64, 'image/png', 'Gambar produk');
```

## Implementation Notes
- All calls use `fetch` with `apikey` header
- Auto-retry on network error (3x, 2s delay)
- Logs to `agent_events` via `lib-db`