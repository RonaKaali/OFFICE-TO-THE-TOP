// Agent Pesanan - Stub (Coming Soon)
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Pesanan: ${text.slice(0,50)}`);
  
  const reply = `🛒 *Agen Pesanan (Coming Soon)*

Fitur yang akan datang:
/pesanan baru "Produk" Jumlah  - Buat order
/pesanan daftar                - Lihat riwayat
/pesanan status <id>           - Cek status

Saat ini: gunakan /produk untuk katalog.`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📎 Media diterima. Fitur order via foto coming soon.' };
}