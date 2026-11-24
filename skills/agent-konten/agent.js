// Agent Konten - Stub
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Konten: ${text.slice(0,50)}`);
  
  const reply = `✍️ *Agen Konten (Coming Soon)*

Fitur AI Content:
/konten caption "Nasi Goreng" "Promo 50% hari ini"  - Generate caption IG
/konten ide "Kuliner" 5                           - 5 ide konten
/konten hashtag "Kuliner"                         - Rekomendasi hashtag
/konten jadwal                                    - Jadwal posting
/konten rewrite "Caption lama"                    - Rewrite

Pakai Gemini/Claude. Brand voice WEBSITE GENZ.`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📸 Foto produk diterima. Generate caption dari foto coming soon.' };
}