-- Seed Agents for Supabase Cloud: Trio Inti Kantor AI
INSERT INTO public.agents (id, name, role, emoji, color, triggers, priority, enabled, desk, config) VALUES
('admin', 'SANG ADMIN', 'WhatsApp Gateway & Orchestrator (Super Admin)', '👑', '#3b82f6', '["admin","wa","whatsapp","tugas","order","semua"]'::jsonb, 1, true, '{"x":-5.5,"z":-2.0}'::jsonb, '{"is_gateway": true}'::jsonb),
('eksekutor', 'SANG EKSEKUTOR', 'Technical Builder & Task Execution', '⚡', '#10b981', '["eksekusi","kerjakan","buat","tulis","coding"]'::jsonb, 2, true, '{"x":0,"z":-2.0}'::jsonb, '{"reports_to": "qc"}'::jsonb),
('qc', 'SANG QC', 'Quality Assurance, Validator & Compliance', '🔍', '#f59e0b', '["qc","cek","verifikasi","validasi","review"]'::jsonb, 3, true, '{"x":5.5,"z":-2.0}'::jsonb, '{"reports_to": "admin"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color,
  triggers = EXCLUDED.triggers,
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();
