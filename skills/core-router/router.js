import { db } from '../lib-db/db.js';
import { status } from '../lib-status/status.js';
import { wa } from '../lib-wa/wa.js';
import { memory } from '../lib-memory/memory.js';

// Dynamic import of agent skills
const agentSkills = {};

async function loadAgentSkill(agentId) {
  if (agentSkills[agentId]) return agentSkills[agentId];
  try {
    // In Hermes, skills are loaded differently. For now, use dynamic import from skills folder.
    // This will be adapted to Hermes skill system.
    const skill = await import(`../agent-${agentId}/agent.js`);
    agentSkills[agentId] = skill;
    return skill;
  } catch (err) {
    console.error(`Failed to load agent skill: ${agentId}`, err);
    return null;
  }
}

// Normalize Evolution API payload to internal context
function normalizePayload(payload) {
  const data = payload.data || payload;
  const msg = data.message || {};
  const key = data.key || {};
  
  // Extract text from various message types
  let text = '';
  let mediaBase64 = null;
  let mimeType = null;
  let messageType = 'conversation';
  
  if (msg.conversation) {
    text = msg.conversation;
    messageType = 'conversation';
  } else if (msg.extendedTextMessage?.text) {
    text = msg.extendedTextMessage.text;
    messageType = 'extendedTextMessage';
  } else if (msg.imageMessage) {
    text = msg.imageMessage.caption || '';
    mediaBase64 = msg.imageMessage.jpegThumbnail || null; // Note: full media needs download
    mimeType = 'image/jpeg';
    messageType = 'imageMessage';
  } else if (msg.documentMessage) {
    text = msg.documentMessage.caption || '';
    mimeType = msg.documentMessage.mimetype || 'application/octet-stream';
    messageType = 'documentMessage';
  } else if (msg.videoMessage) {
    text = msg.videoMessage.caption || '';
    mimeType = 'video/mp4';
    messageType = 'videoMessage';
  } else if (msg.audioMessage) {
    mimeType = 'audio/ogg';
    messageType = 'audioMessage';
  } else if (msg.stickerMessage) {
    mimeType = 'image/webp';
    messageType = 'stickerMessage';
  }
  
  const chatId = key.remoteJid || data.key?.remoteJid;
  const sender = key.participant || key.remoteJid || data.participant;
  const isGroup = chatId?.endsWith('@g.us') || false;
  const pushName = data.pushName || sender?.split('@')[0] || 'Unknown';
  const messageId = key.id || data.key?.id;
  const instance = payload.instance || process.env.EVOLUTION_INSTANCE || 'kantor-ai';
  
  return {
    text: text.trim(),
    chat_id: chatId,
    sender,
    push_name: pushName,
    message_id: messageId,
    message_type: messageType,
    media_base64: mediaBase64,
    mime_type: mimeType,
    is_group: isGroup,
    instance,
    timestamp: data.messageTimestamp ? new Date(data.messageTimestamp * 1000).toISOString() : new Date().toISOString()
  };
}

// Match command: /agentid args
function matchCommand(text) {
  const match = text.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (match) {
    return { agentId: match[1].toLowerCase(), args: match[2] || '' };
  }
  return null;
}

// Match triggers against agent list
async function matchTriggers(text, agents) {
  const lowerText = text.toLowerCase();
  for (const agent of agents) {
    if (!agent.enabled) continue;
    try {
      const triggers = JSON.parse(agent.triggers || '[]');
      for (const trigger of triggers) {
        // Word boundary match
        const regex = new RegExp(`\\b${trigger.toLowerCase()}\\b`);
        if (regex.test(lowerText)) {
          return { agentId: agent.id, matchedTrigger: trigger };
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }
  return null;
}

// Get formatted agent list for help
async function getAgentList() {
  const agents = await db.agents.list(true);
  return agents.map(a => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    role: a.role,
    triggers: JSON.parse(a.triggers || '[]')
  }));
}

// Main router
export const router = {
  // Receive webhook from Evolution API
  receive: async (payload) => {
    try {
      // Only handle messages.upsert
      if (payload.event !== 'messages.upsert') {
        return { status: 'ignored', reason: 'not messages.upsert' };
      }
      
      // Ignore fromMe (bot's own messages)
      if (payload.data?.key?.fromMe) {
        return { status: 'ignored', reason: 'fromMe' };
      }
      
      const context = normalizePayload(payload);
      
      // Dedup check
      const isDup = await db.processedMessages.check(context.message_id);
      if (isDup) {
        return { status: 'ignored', reason: 'duplicate' };
      }
      
      // ACL check
      const allowed = await db.allowedChats.isAllowed(context.chat_id);
      if (!allowed) {
        return { status: 'ignored', reason: 'not allowed chat' };
      }
      
      // Mark as processed early
      await db.processedMessages.mark(context.message_id, context.chat_id);
      
      // Route
      const routeResult = await router.route(context.text, context);
      
      if (!routeResult.agentId) {
        // No agent matched
        if (!context.is_group) {
          // Private chat: show help
          const agents = await getAgentList();
          let helpText = '🤖 *OFFICE TO THE TOP*\n\nAgen tersedia:\n';
          for (const a of agents) {
            helpText += `\n${a.emoji} *${a.name}* (/${a.id})\n  ${a.role}\n  Trigger: ${a.triggers.join(', ')}`;
          }
          helpText += '\n\nKetik /agentid pesan atau gunakan kata trigger.';
          await wa.sendText(context.chat_id, helpText);
        }
        return { status: 'no_match', context };
      }
      
      // Dispatch to agent
      return await router.dispatch(routeResult.agentId, {
        ...context,
        ...routeResult,
        task_id: crypto.randomUUID()
      });
      
    } catch (err) {
      console.error('Router error:', err);
      return { status: 'error', error: err.message };
    }
  },
  
  // Determine which agent handles this
  route: async (text, context) => {
    const agents = await db.agents.list(true);
    
    // 1. Check command
    const cmd = matchCommand(text);
    if (cmd) {
      const agent = agents.find(a => a.id === cmd.agentId && a.enabled);
      if (agent) {
        return { agentId: agent.id, isCommand: true, args: cmd.args, matchedTrigger: null };
      }
      return { agentId: null, isCommand: true, args: cmd.args, matchedTrigger: null, error: 'Agent not found/disabled' };
    }
    
    // 2. Check triggers
    const triggerMatch = await matchTriggers(text, agents);
    if (triggerMatch) {
      return { agentId: triggerMatch.agentId, isCommand: false, args: text, matchedTrigger: triggerMatch.matchedTrigger };
    }
    
    // 3. No match
    return { agentId: null, isCommand: false, args: text, matchedTrigger: null };
  },
  
  // Dispatch to agent skill
  dispatch: async (agentId, context) => {
    const agent = await db.agents.get(agentId);
    if (!agent || !agent.enabled) {
      await wa.sendText(context.chat_id, '❌ Agen tidak tersedia atau dinonaktifkan.');
      return { status: 'agent_disabled', agentId };
    }
    
    // Set status working
    await status.setStatus(agentId, 'working', `Processing: ${context.text.slice(0, 50)}`);
    
    // Create task record
    const taskId = context.task_id || crypto.randomUUID();
    await db.tasks.create({
      id: taskId,
      agent_id: agentId,
      chat_id: context.chat_id,
      sender: context.sender,
      push_name: context.push_name,
      text: context.text,
      message_id: context.message_id,
      message_type: context.message_type,
      media_base64: context.media_base64,
      mime_type: context.mime_type,
      is_group: context.is_group ? 1 : 0,
      instance: context.instance
    });
    
    try {
      // Load agent skill
      const skill = await loadAgentSkill(agentId);
      if (!skill || !skill.handleMessage) {
        throw new Error(`Agent skill not found or invalid: ${agentId}`);
      }
      
      // Call agent
      let result;
      if (context.media_base64 && skill.handleMedia) {
        result = await skill.handleMedia(context);
      } else {
        result = await skill.handleMessage(context);
      }
      
      // Send reply
      if (result.reply) {
        await wa.sendText(context.chat_id, result.reply);
      }
      if (result.mediaBase64 && result.mimeType) {
        await wa.sendMedia(context.chat_id, result.mediaBase64, result.mimeType, result.caption || '');
      }
      
      // Update task + status
      await db.tasks.updateStatus(taskId, 'done', result);
      await status.setStatus(agentId, 'idle', 'Selesai');
      
      return { status: 'success', agentId, taskId, result };
      
    } catch (err) {
      console.error(`Agent ${agentId} error:`, err);
      await db.tasks.updateStatus(taskId, 'failed', null, err.message);
      await status.setStatus(agentId, 'error', err.message);
      await wa.sendText(context.chat_id, '❌ Maaf, terjadi kesalahan saat memproses permintaan.');
      return { status: 'agent_error', agentId, taskId, error: err.message };
    }
  },
  
  // Get agent list for help
  getAgentList
};

export default router;