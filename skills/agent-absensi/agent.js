// Agent Absensi - Stub
import { status } from '../lib-status/status.js';

export async function handleMessage(context) {
  const { text, chat_id, agent_id } = context;
  await status.setStatus(agent_id, 'working', `Absensi: ${text.slice(0,50)}`);
  
  const reply = `📸 *Agen Absensi (Coming Soon)*

Fitur SaaS Absensi Selfie:
/absensi hadir     - Absen masuk (kirim selfie)
/absensi pulang    - Absen pulang
/absensi laporan   - Laporan bulanan
/absensi izin      - Ajukan izin

Integrasi dengan sistem Absensi Selfie WEBSITE GENZ.`;
  
  await status.setStatus(agent_id, 'idle', 'Selesai');
  return { reply };
}

export async function handleMedia(context) {
  return { reply: '📸 Selfie diterima. Verifikasi wajah coming soon.' };
}