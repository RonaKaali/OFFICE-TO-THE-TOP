// Agent Support - Stub
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Support: ${text.slice(0,50)}`);
  
  const reply = `🤝 *Agen Support (Coming Soon)*

FAQ Otomatis:
/support                    - Daftar pertanyaan umum
/support <pertanyaan>       - Tanya apa saja
/support daftar             - Semua FAQ
/support tambah "Q" "A"     - Tambah FAQ (admin)

Contoh FAQ siap pakai:
- "Jam buka?" → "Buka 08:00-21:00"
- "Lokasi?" → "Jl. Contoh No. 123"
- "Pesan lewat WA?" → "Ketik /pesanan baru ..."
- "Bayar lewat apa?" → "Cash, QRIS, Transfer"

Auto-learn dari percakapan admin.`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📎 Media diterima.' };
}