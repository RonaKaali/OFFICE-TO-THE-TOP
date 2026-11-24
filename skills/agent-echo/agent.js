// Agent Echo - Template for testing
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, task_id, agent_id } = context;
  
  // Set status working
  await status.setStatus(agent_id, 'working', `Echo: ${text.slice(0, 50)}`);
  
  // Simple echo reply
  const reply = `🦜 *Echo Agent*\n\nKamu bilang: "${text || '(kosong)'}"\n\n⏰ ${new Date().toLocaleString('id-ID')}`;
  
  return { reply };
}

export async function handleMedia(context) {
  const { agent_id, mime_type } = context;
  await status.setStatus(agent_id, 'working', `Echo media: ${mime_type}`);
  return { reply: `🦜 Echo: [Media ${mime_type} diterima]` };
}

export default { handleMessage, handleMedia };