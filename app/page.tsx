import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Fetch Todos from Supabase
  let todos: Array<{ id: number; name: string; is_complete?: boolean }> = []
  let supabaseConnected = false
  try {
    const { data, error } = await supabase.from('todos').select()
    if (!error && data) {
      todos = data
      supabaseConnected = true
    }
  } catch (e) {
    console.error('Error fetching todos:', e)
  }

  // 2. Fetch Agents
  let agents: Array<any> = []
  try {
    const { data } = await supabase.from('agents').select().order('priority')
    if (data && data.length > 0) {
      agents = data
    } else {
      // Default fallback list
      agents = [
        { id: 'echo', name: 'Echo', role: 'Test agent', emoji: '🦜', color: '#6b7280', status: 'idle', triggers: [] },
        { id: 'produk', name: 'Produk', role: 'Kelola katalog & harga UMKM', emoji: '📦', color: '#10b981', status: 'ready', triggers: ['produk', 'katalog', 'harga', 'stok'] },
        { id: 'pesanan', name: 'Pesanan', role: 'Terima order via WhatsApp', emoji: '🛒', color: '#3b82f6', status: 'ready', triggers: ['pesan', 'order', 'beli'] },
        { id: 'absensi', name: 'Absensi', role: 'Absensi selfie karyawan', emoji: '📸', color: '#8b5cf6', status: 'ready', triggers: ['absen', 'hadir'] },
        { id: 'antrian', name: 'Antrian', role: 'Kelola nomor antrian digital', emoji: '🎫', color: '#f59e0b', status: 'ready', triggers: ['antrian', 'nomor'] },
        { id: 'keuangan', name: 'Keuangan', role: 'Rekap omset & pengeluaran', emoji: '💰', color: '#ef4444', status: 'ready', triggers: ['omset', 'kas', 'laba'] },
        { id: 'konten', name: 'Konten', role: 'Caption generator IG & TikTok', emoji: '✍️', color: '#ec4899', status: 'ready', triggers: ['caption', 'ide'] },
        { id: 'support', name: 'Support', role: 'Auto-reply FAQ pelanggan', emoji: '🤝', color: '#06b6d4', status: 'ready', triggers: ['bantuan', 'faq'] }
      ]
    }
  } catch {
    // fallback
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-10 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              OFFICE TO THE TOP
            </h1>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Local Multi-Agent WhatsApp System &bull; Cloudflare Edge &bull; Supabase Cloud
          </p>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloudflare Ready
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            supabaseConnected
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-blue-400' : 'bg-amber-400'}`}></span>
            Supabase: {supabaseConnected ? 'Connected' : 'Offline / Standby'}
          </div>
        </div>
      </header>

      {/* Grid: Main Control & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Supabase Todos & Verifications (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Supabase Todos Section (Requirement Check) */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h2 className="text-xl font-bold text-white">Supabase Live Todos</h2>
              </div>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-400">
                Table: <code className="text-indigo-400">public.todos</code>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Data rendered dynamically from Supabase database via SSR Server Client:
            </p>

            <ul className="divide-y divide-slate-800/80 bg-slate-950/60 rounded-xl border border-slate-800/60 p-2">
              {todos && todos.length > 0 ? (
                todos.map((todo) => (
                  <li key={todo.id} className="py-3 px-4 flex items-center justify-between hover:bg-slate-800/30 rounded-lg transition-colors">
                    <span className="text-slate-200 text-sm font-medium flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">&#10003;</span>
                      {todo.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      #{todo.id}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-slate-500 text-sm">
                  Belum ada item di tabel <code className="text-indigo-400">todos</code>.
                  <br />
                  Jalankan SQL migration di folder <code className="text-indigo-300">supabase/schema.sql</code>.
                </li>
              )}
            </ul>
          </section>

          {/* Active Agents Fleet */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h2 className="text-xl font-bold text-white">AI Fleet &amp; WhatsApp Agents</h2>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                {agents.length} Registered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((ag) => (
                <div
                  key={ag.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {ag.emoji || '🤖'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-100 text-sm">{ag.name}</h3>
                        <p className="text-xs text-slate-400">{ag.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-indigo-300">/{ag.id}</span>
                    <span className="truncate max-w-[150px]">
                      {Array.isArray(ag.triggers) ? ag.triggers.join(', ') : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Client Packages & Operations */}
        <div className="space-y-8">
          
          {/* UMKM Client Deploy Tiers */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📦</span>
              <h2 className="text-lg font-bold text-white">UMKM Deployment Tiers</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Paket langganan dan mapping agen UMKM siap deploy:
            </p>

            <div className="space-y-3">
              {[
                { name: 'Bronze', price: 'Rp 350K', agents: 'Produk, Support', badge: 'Katalog + FAQ' },
                { name: 'Silver', price: 'Rp 650K', agents: 'Produk, Pesanan, Support', badge: 'Order + Katalog' },
                { name: 'Gold', price: 'Rp 1.000K', agents: 'Produk, Pesanan, Absensi, Support', badge: 'Full Absensi' },
                { name: 'Platinum', price: 'Rp 2.000K', agents: 'Semua Agen + Custom', badge: 'Enterprise' },
              ].map((tier) => (
                <div key={tier.name} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-sm">{tier.name}</span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">{tier.price}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{tier.agents}</div>
                  <div className="mt-2 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded inline-block font-mono">
                    {tier.badge}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">CLI Deploy Command:</h4>
              <pre className="text-[11px] bg-black/60 p-2.5 rounded-lg text-slate-300 font-mono overflow-x-auto">
powershell scripts/deploy-client.ps1 -ClientName "Warung Makmur" -Package Silver
              </pre>
            </div>
          </section>

          {/* Quick Links & Resources */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
              System Documentation
            </h2>
            <div className="space-y-2 text-sm">
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Deploy Client Guide</span>
                <span className="text-xs text-slate-500 font-mono">docs/PROMPT-DEPLOY-CLIENT.md</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Tambah Agen Guide</span>
                <span className="text-xs text-slate-500 font-mono">docs/PROMPT-TAMBAH-AGEN.md</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Troubleshooting</span>
                <span className="text-xs text-slate-500 font-mono">docs/TROUBLESHOOTING.md</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
