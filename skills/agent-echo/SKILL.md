---
name: agent-echo
description: "Template agent: echoes back messages. Use as base for new agents."
category: office-agents
---

# agent-echo — Template Agent

## Purpose
Simple echo agent for testing the pipeline. Replace with real logic.

## Trigger
- Command: `/echo <text>`
- Triggers: `[]` (none)

## Contract
- Input: `context` = { text, chat_id, sender, push_name, message_id, is_group, media_base64, mime_type, task_id, agent_id }
- Output: `{ reply: string, mediaBase64?: string, mimeType?: string }`

## Implementation
```javascript
export async function handleMessage(context) {
  const { text, chat_id, task_id, agent_id } = context;
  
  // 1. Set status working (via lib-status)
  // await status.setStatus(agent_id, 'working', `Echo: ${text.slice(0,50)}`);
  
  // 2. Process
  const reply = `🦜 Echo: ${text || '(kosong)'}`;
  
  // 3. Return result (router handles send + status idle)
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '🦜 Echo: [Media received]' };
}
```

## To Create New Agent
1. Copy this folder to `skills/agent-<name>/`
2. Rename `agent.js` → implement `handleMessage` + `handleMedia`
3. Update `SKILL.md` with name, description, triggers
4. Register in database: `INSERT INTO agents ...`
5. Test: `/<name> test`