-- Seed Agents for Supabase Cloud
INSERT INTO public.agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config) VALUES
('echo', 'Echo', 'Test & ping agent', '🦜', '#6b7280', '[]'::jsonb, 100, true, '{"x":-4,"z":0}'::jsonb, '{}'::jsonb),
('produk', 'Produk', 'Kelola katalog & harga produk UMKM', '📦', '#10b981', '["produk","katalog","harga","stok"]'::jsonb, 10, true, '{"x":-2,"z":0}'::jsonb, '{}'::jsonb),
('pesanan', 'Pesanan', 'Terima & proses order via WA', '🛒', '#3b82f6', '["pesan","order","beli"]'::jsonb, 10, true, '{"x":0,"z":0}'::jsonb, '{}'::jsonb),
('absensi', 'Absensi', 'Cek laporan absensi selfie karyawan', '📸', '#8b5cf6', '["absen","hadir","laporan"]'::jsonb, 10, true, '{"x":2,"z":0}'::jsonb, '{}'::jsonb),
('antrian', 'Antrian', 'Kelola antrian digital toko/klinik', '🎫', '#f59e0b', '["antrian","nomor","panggil"]'::jsonb, 10, true, '{"x":4,"z":0}'::jsonb, '{}'::jsonb),
('keuangan', 'Keuangan', 'Rekap omset/pengeluaran harian', '💰', '#ef4444', '["omset","kas","laba","rugi"]'::jsonb, 10, true, '{"x":-2,"z":2}'::jsonb, '{}'::jsonb),
('konten', 'Konten', 'Generate caption/ide konten IG & TikTok', '✍️', '#ec4899', '["caption","ide konten","post"]'::jsonb, 10, true, '{"x":0,"z":2}'::jsonb, '{}'::jsonb),
('support', 'Support', 'Auto-balas FAQ dan bantuan pelanggan', '🤝', '#06b6d4', '["bantuan","faq","cara"]'::jsonb, 10, true, '{"x":2,"z":2}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  triggers = EXCLUDED.triggers,
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();
