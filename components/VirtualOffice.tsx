'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Coffee, 
  Sparkles, 
  UserCheck, 
  Send, 
  Activity, 
  Bot, 
  Layers, 
  Info,
  Maximize2
} from 'lucide-react';

export interface AgentCharacter {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  status: 'idle' | 'working' | 'coffee' | 'meeting';
  desk: { x: number; y: number; floor?: number };
  triggers: string[];
  currentTask?: string;
  avatarSeed: number;
}

const DEFAULT_AGENTS: AgentCharacter[] = [
  { id: 'produk', name: 'Mbak Rina (Produk)', role: 'Katalog & Stok UMKM', emoji: '📦', color: '#10b981', status: 'working', desk: { x: 160, y: 160 }, triggers: ['produk', 'katalog', 'harga'], currentTask: 'Update harga beras 5kg', avatarSeed: 1 },
  { id: 'pesanan', name: 'Mas Budi (Pesanan)', role: 'Order WA & Checkout', emoji: '🛒', color: '#3b82f6', status: 'working', desk: { x: 280, y: 160 }, triggers: ['pesan', 'order', 'beli'], currentTask: 'Memproses invoice #WA-904', avatarSeed: 2 },
  { id: 'absensi', name: 'Siti (HR & Absensi)', role: 'Selfie & Shift Karyawan', emoji: '📸', color: '#8b5cf6', status: 'idle', desk: { x: 400, y: 160 }, triggers: ['absen', 'hadir'], currentTask: 'Rekap shift pagi', avatarSeed: 3 },
  { id: 'antrian', name: 'Doni (Antrian)', role: 'Nomor Tiket & Antrian Toko', emoji: '🎫', color: '#f59e0b', status: 'coffee', desk: { x: 520, y: 160 }, triggers: ['antrian', 'panggil'], currentTask: 'Istirahat kopi sebentar', avatarSeed: 4 },
  { id: 'keuangan', name: 'Pak Hendra (Keuangan)', role: 'Rekap Kas, Omset & Laba', emoji: '💰', color: '#ef4444', status: 'working', desk: { x: 160, y: 280 }, triggers: ['omset', 'kas', 'laba'], currentTask: 'Hitung laba harian', avatarSeed: 5 },
  { id: 'konten', name: 'Jessica (Konten)', role: 'Caption IG & Ide TikTok', emoji: '✍️', color: '#ec4899', status: 'working', desk: { x: 280, y: 280 }, triggers: ['caption', 'ide', 'post'], currentTask: 'Draft konten promo gajian', avatarSeed: 6 },
  { id: 'support', name: 'Arief (CS Support)', role: 'Auto-balas FAQ 24/7', emoji: '🤝', color: '#06b6d4', status: 'idle', desk: { x: 400, y: 280 }, triggers: ['bantuan', 'faq', 'tanya'], currentTask: 'Standby pesan masuk', avatarSeed: 7 },
  { id: 'echo', name: 'Echo Bot (QA)', role: 'System Health & Ping', emoji: '🦜', color: '#6b7280', status: 'idle', desk: { x: 520, y: 280 }, triggers: ['echo', 'ping'], currentTask: 'Monitor gateway', avatarSeed: 8 },
];

export default function VirtualOffice() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [agents, setAgents] = useState<AgentCharacter[]>(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentCharacter | null>(null);
  const [activeFloor, setActiveFloor] = useState<'all' | 'workspace' | 'lounge' | 'meeting'>('all');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'evening' | 'night'>('day');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [simulatedChat, setSimulatedChat] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Kantor Virtual OFFICE TO THE TOP aktif.', time: '11:00' },
    { sender: 'Mbak Rina (Produk)', text: 'Katalog siap disinkronkan ke WhatsApp.', time: '11:02' },
  ]);

  // Audio Context Ref for synthetic Web Audio lofi music (72 BPM) like Kantor Kita
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Toggle Lo-Fi Ambient Synthesizer
  const toggleAudio = () => {
    if (!audioPlaying) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Pentatonic chill chords
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        let step = 0;

        audioIntervalRef.current = setInterval(() => {
          if (!audioCtxRef.current) return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          
          const freq = notes[step % notes.length];
          step = (step + Math.floor(Math.random() * 3) + 1) % notes.length;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

          gain.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);

          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 1.2);
        }, 833); // ~72 BPM

        setAudioPlaying(true);
      } catch (e) {
        console.error('Audio init failed', e);
      }
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      audioCtxRef.current = null;
      setAudioPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Canvas 2.5D Isometric Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background ambient lighting
      if (timeOfDay === 'day') {
        ctx.fillStyle = '#0f172a'; // Deep slate
      } else if (timeOfDay === 'evening') {
        ctx.fillStyle = '#1c1326'; // Sunset warm tint
      } else {
        ctx.fillStyle = '#070a13'; // Night cozy office
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Office Grid & Room Boundaries
      // Floor Base
      const floorGrad = ctx.createLinearGradient(0, 50, 0, 550);
      floorGrad.addColorStop(0, timeOfDay === 'night' ? '#111827' : '#1e293b');
      floorGrad.addColorStop(1, timeOfDay === 'night' ? '#0b0f17' : '#0f172a');
      ctx.fillStyle = floorGrad;
      ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 16);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floor Parquet Texture / Tiles
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 60; x < canvas.width - 60; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();
      }
      for (let y = 60; y < canvas.height - 60; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(canvas.width - 40, y);
        ctx.stroke();
      }

      // ─── ROOM 1: LOUNGE & PANTRY (Kiri Bawah) ───
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.fillRect(60, 380, 260, 140);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(60, 380, 260, 140);
      
      // Sofa
      ctx.fillStyle = '#334155';
      ctx.roundRect(80, 440, 120, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillText('🛋️ Sofa Santai', 100, 465);

      // Coffee Bar / Pantry
      ctx.fillStyle = '#475569';
      ctx.fillRect(220, 400, 80, 40);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px sans-serif';
      ctx.fillText('☕ Pantry', 235, 425);

      // Office Cat "Moka" sleeping/wiggling tail
      const catTail = Math.sin(tick * 0.05) * 4;
      ctx.font = '18px sans-serif';
      ctx.fillText('🐈', 180 + catTail, 450);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Moka (Cat)', 165, 470);

      // ─── ROOM 2: GLASS MEETING ROOM (Kanan Bawah) ───
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(360, 380, 320, 140);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(360, 380, 320, 140);

      // Glass Meeting Table
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(420, 410, 200, 60, 12);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('📊 Ruang Rapat & Whiteboard UMKM', 440, 445);

      // Potted Plants in Corner
      ctx.font = '20px sans-serif';
      ctx.fillText('🪴', 60, 70);
      ctx.fillText('🪴', canvas.width - 80, 70);
      ctx.fillText('🪴', canvas.width - 80, canvas.height - 60);

      // ─── AGENT DESKS & CHARACTERS ───
      agents.forEach((agent) => {
        const { x, y } = agent.desk;

        // Desk Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 25, y + 45, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Desk
        ctx.fillStyle = '#334155';
        ctx.roundRect(x - 20, y, 90, 45, 6);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Laptop / Monitor
        const screenGlow = Math.sin(tick * 0.08) * 0.2 + 0.8;
        ctx.fillStyle = agent.status === 'working' ? `rgba(96, 165, 250, ${screenGlow})` : '#475569';
        ctx.fillRect(x + 15, y + 8, 22, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 13, y + 22, 26, 3); // keyboard

        // Character Avatar (Chibi / Soft-block style)
        // Body animation (subtle typing breathing movement)
        const typingOffset = agent.status === 'working' ? Math.sin(tick * 0.3 + agent.avatarSeed) * 2 : 0;
        const charY = y - 10 + typingOffset;

        // Body
        ctx.fillStyle = agent.color;
        ctx.roundRect(x + 14, charY, 24, 20, 6);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fed7aa'; // warm peach skin tone
        ctx.beginPath();
        ctx.arc(x + 26, charY - 8, 11, 0, Math.PI * 2);
        ctx.fill();

        // Hair / Cap
        ctx.fillStyle = agent.avatarSeed % 2 === 0 ? '#451a03' : '#1e1b4b';
        ctx.beginPath();
        ctx.arc(x + 26, charY - 12, 11, Math.PI, Math.PI * 2);
        ctx.fill();

        // Hands typing on keyboard
        if (agent.status === 'working') {
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(x + 19 + Math.sin(tick * 0.5) * 2, y + 18, 3, 0, Math.PI * 2);
          ctx.arc(x + 33 - Math.sin(tick * 0.5) * 2, y + 18, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Status Bubble above head
        if (agent.status === 'working') {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px sans-serif';
          ctx.fillText('⚡ Typing...', x + 8, charY - 24);
        } else if (agent.status === 'coffee') {
          ctx.fillStyle = '#f59e0b';
          ctx.font = '10px sans-serif';
          ctx.fillText('☕ Break', x + 12, charY - 24);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = '10px sans-serif';
          ctx.fillText('💤 Idle', x + 16, charY - 24);
        }

        // Agent Name Tag below desk
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${agent.emoji} ${agent.name.split(' ')[0]}`, x + 25, y + 62);
        ctx.textAlign = 'start';

        // Selection highlight ring
        if (selectedAgent?.id === agent.id) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x - 25, charY - 35, 100, 105);
          ctx.setLineDash([]);
        }
      });

      // Lighting Warmth Filter
      if (timeOfDay === 'evening') {
        ctx.fillStyle = 'rgba(251, 146, 60, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [agents, selectedAgent, timeOfDay]);

  // Click handler to select character
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check hit test for each agent
    const clicked = agents.find((ag) => {
      return (
        clickX >= ag.desk.x - 30 &&
        clickX <= ag.desk.x + 80 &&
        clickY >= ag.desk.y - 40 &&
        clickY <= ag.desk.y + 70
      );
    });

    if (clicked) {
      setSelectedAgent(clicked);
    }
  };

  // Simulate command interaction
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedChat.trim() || !selectedAgent) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'Anda (Owner)', text: simulatedChat, time };

    // Update status to working
    setAgents((prev) =>
      prev.map((a) =>
        a.id === selectedAgent.id ? { ...a, status: 'working', currentTask: simulatedChat } : a
      )
    );

    // Bot response simulation
    setTimeout(() => {
      const botReply = {
        sender: selectedAgent.name,
        text: `🤖 [${selectedAgent.emoji} ${selectedAgent.name}]: Perintah "${simulatedChat}" diterima & diproses!`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatLog((logs) => [...logs, userMsg, botReply]);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgent.id ? { ...a, status: 'idle' } : a
        )
      );
    }, 1200);

    setChatLog((logs) => [...logs, userMsg]);
    setSimulatedChat('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Office Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Kantor AI — Virtual 3D Office Diorama
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                8 Karakter Aktif
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualisasi real-time karakter AI agent bekerja di meja kantor virtual (Inspired by Kantor Kita)
            </p>
          </div>
        </div>

        {/* Ambient & Time-of-Day Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer */}
          <button
            onClick={toggleAudio}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              audioPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Lofi Office Music (Web Audio 72 BPM)"
          >
            {audioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {audioPlaying ? 'Music: ON' : 'Music: OFF'}
          </button>

          {/* Time Lighting Toggle */}
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setTimeOfDay('day')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                timeOfDay === 'day' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3" /> Pagi
            </button>
            <button
              onClick={() => setTimeOfDay('evening')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                timeOfDay === 'evening' ? 'bg-orange-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3" /> Sore
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                timeOfDay === 'night' ? 'bg-indigo-950 text-indigo-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3" /> Malam
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Character Inspection Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0">
        
        {/* Interactive Canvas Viewport (2 cols) */}
        <div className="xl:col-span-2 relative p-4 bg-slate-950/80 flex flex-col items-center justify-center border-b xl:border-b-0 xl:border-r border-slate-800">
          <canvas
            ref={canvasRef}
            width={720}
            height={540}
            onClick={handleCanvasClick}
            className="w-full h-auto max-w-full rounded-2xl border border-slate-800 shadow-inner cursor-pointer"
          />
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between w-full px-2">
            <span>💡 <em>Klik pada meja karakter untuk berinteraksi & kirim perintah WA</em></span>
            <span className="font-mono text-indigo-400">FPS: 60 • Canvas 2.5D</span>
          </div>
        </div>

        {/* Character Inspector & Command Console (1 col) */}
        <div className="p-5 flex flex-col justify-between bg-slate-900/50 space-y-4">
          
          {selectedAgent ? (
            <div className="space-y-4">
              {/* Selected Agent Header */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
                    style={{ backgroundColor: selectedAgent.color }}
                  >
                    {selectedAgent.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedAgent.name}</h3>
                    <p className="text-xs text-slate-400">{selectedAgent.role}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                    selectedAgent.status === 'working'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : selectedAgent.status === 'coffee'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {selectedAgent.status}
                </span>
              </div>

              {/* Status & Current Task */}
              <div className="text-xs space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Aktivitas Sekarang:</span>
                  <span className="text-slate-200 font-medium">{selectedAgent.currentTask || 'Standby'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kata Kunci (Triggers):</span>
                  <span className="text-indigo-400 font-mono">/{selectedAgent.id} ({selectedAgent.triggers.join(', ')})</span>
                </div>
              </div>

              {/* Action Buttons to toggle character behavior */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    setAgents((prev) =>
                      prev.map((a) =>
                        a.id === selectedAgent.id ? { ...a, status: 'working' } : a
                      )
                    )
                  }
                  className="px-2 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 text-xs font-medium"
                >
                  ⚡ Set Kerja
                </button>
                <button
                  onClick={() =>
                    setAgents((prev) =>
                      prev.map((a) =>
                        a.id === selectedAgent.id ? { ...a, status: 'coffee' } : a
                      )
                    )
                  }
                  className="px-2 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-300 text-xs font-medium"
                >
                  ☕ Coffee Break
                </button>
                <button
                  onClick={() =>
                    setAgents((prev) =>
                      prev.map((a) =>
                        a.id === selectedAgent.id ? { ...a, status: 'idle' } : a
                      )
                    )
                  }
                  className="px-2 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium"
                >
                  💤 Set Idle
                </button>
              </div>

              {/* Live Mini Chat / Activity Log */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Aktivitas &amp; Interaksi WhatsApp:
                </label>
                <div className="h-44 overflow-y-auto space-y-2 p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px]">
                  {chatLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-slate-500">[{log.time}]</span>{' '}
                      <span className="font-semibold text-indigo-400">{log.sender}:</span>{' '}
                      <span className="text-slate-200">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Command to selected agent */}
              <form onSubmit={handleSendCommand} className="flex gap-2">
                <input
                  type="text"
                  value={simulatedChat}
                  onChange={(e) => setSimulatedChat(e.target.value)}
                  placeholder={`Kirim perintah ke ${selectedAgent.name.split(' ')[0]}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Bot className="w-12 h-12 text-slate-600" />
              <h4 className="font-bold text-slate-300 text-sm">Pilih Karakter di Meja Kantor</h4>
              <p className="text-xs max-w-xs">
                Klik salah satu karakter AI di kantor virtual untuk melihat status tugas, memantau aktivitas, atau memberi instruksi langsung.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
