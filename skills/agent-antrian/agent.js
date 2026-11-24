// Agent Antrian - Stub
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Antrian: ${text.slice(0,50)}`);
  
  const reply = `🎫 *Agen Antrian (Coming Soon)*

Fitur SaaS Antrian Digital:
/antrian ambil     - Ambil nomor
/antrian status    - Cek posisi
/antrian panggil   - Panggil berikutnya (admin)
/antrian reset     - Reset antrian (admin)

Integrasi dengan sistem Antrian Digital WEBSITE GENZ.`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📎 Media diterima.' };
}