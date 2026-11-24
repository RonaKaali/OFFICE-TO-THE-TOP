// Agent Keuangan - Stub
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Keuangan: ${text.slice(0,50)}`);
  
  const reply = `💰 *Agen Keuangan (Coming Soon)*

Fitur:
/keuangan hari       - Omset hari ini
/keuangan minggu     - Rekap mingguan
/keuangan bulan      - Rekap bulanan
/keuangan catat masuk 50000 "Jual nasi"  - Catat pemasukan
/keuangan catat keluar 20000 "Beli beras" - Catat pengeluaran
/keuangan laporan    - Export Excel

Auto-sync dari Pesanan (paid orders).`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📎 Foto struk/nota diterima. OCR coming soon.' };
}