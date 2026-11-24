'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Send, 
  Bot, 
  Play, 
  Pause,
  RotateCcw, 
  Palette,
  Clock,
  ClipboardList,
  AlertCircle,
  X,
  Flame,
  CheckCircle2,
  Sparkles,
  Coffee,
  Users
} from 'lucide-react';
import initialLaporan from '@/src/laporan.json';

export type GayaId = 'asli' | 'hologram' | 'clay' | 'diorama';

export interface RoomZone {
  key: string;
  label: string;
  x0: number;
  x1: number;
  floorColor: number;
  rugColor: number;
}

export interface AgentActor {
  id: string;
  name: string;
  role: string;
  room: string;
  emoji: string;
  shirtColor: string;
  skinColor: string;
  hairColor: string;
  deskPos: [number, number, number];
  rotationY?: number;
  triggers: string[];
  currentTask: string;
  ringkasan: string;
  urgent: string[];
  waiting: string[];
}

const RUANGAN_LIST: RoomZone[] = [
  { key: 'produk', label: 'Wing Barat &bull; Produk &amp; Stok', x0: -9.5, x1: -3.2, floorColor: 0x1f2e3d, rugColor: 0x10b981 },
  { key: 'boardroom', label: 'Wing Tengah &bull; Boardroom &amp; Mission Board', x0: -3.2, x1: 3.2, floorColor: 0x1a2636, rugColor: 0x3b82f6 },
  { key: 'konten', label: 'Wing Timur &bull; Konten, HR &amp; CS', x0: 3.2, x1: 9.5, floorColor: 0x271e36, rugColor: 0x8b5cf6 },
];

const SKIN_TONES = ['#f1c7a5', '#d9a07b', '#e8b896', '#c68863', '#f0c09c', '#e2a77f', '#deb887', '#d2996c'];
const HAIR_COLORS = ['#2b1d16', '#1b1330', '#5a3825', '#2b1d16', '#7a4a2a', '#1e1b4b', '#3b2f2f', '#1c1c1c'];

const INITIAL_ACTORS: AgentActor[] = [
  { id: 'produk', name: 'Mbak Rina', role: 'Katalog & Stok', room: 'Divisi Produk', emoji: '📦', shirtColor: '#10b981', skinColor: SKIN_TONES[0], hairColor: HAIR_COLORS[0], deskPos: [-6.8, 0, -2.5], triggers: ['produk', 'katalog', 'harga'], currentTask: 'Audit stok beras 5kg', ringkasan: initialLaporan.produk.ringkasan, urgent: initialLaporan.produk.mendesak, waiting: initialLaporan.produk.menunggu },
  { id: 'antrian', name: 'Mas Doni', role: 'Nomor Antrian', room: 'Divisi Produk', emoji: '🎫', shirtColor: '#f59e0b', skinColor: SKIN_TONES[1], hairColor: HAIR_COLORS[1], deskPos: [-4.6, 0, 1.2], triggers: ['antrian', 'nomor'], currentTask: 'Panggil antrian #A-14', ringkasan: initialLaporan.antrian.ringkasan, urgent: initialLaporan.antrian.mendesak, waiting: initialLaporan.antrian.menunggu },
  { id: 'pesanan', name: 'Mas Budi', role: 'Pesanan & Order', room: 'Divisi Transaksi', emoji: '🛒', shirtColor: '#3b82f6', skinColor: SKIN_TONES[2], hairColor: HAIR_COLORS[2], deskPos: [-1.6, 0, -2.5], triggers: ['pesan', 'order', 'beli'], currentTask: 'Proses checkout #WA-881', ringkasan: initialLaporan.pesanan.ringkasan, urgent: initialLaporan.pesanan.mendesak, waiting: initialLaporan.pesanan.menunggu },
  { id: 'keuangan', name: 'Pak Hendra', role: 'Keuangan & Kas', room: 'Divisi Transaksi', emoji: '💰', shirtColor: '#ef4444', skinColor: SKIN_TONES[3], hairColor: HAIR_COLORS[3], deskPos: [1.6, 0, 1.2], triggers: ['omset', 'kas', 'laba'], currentTask: 'Rekap pembukuan kasir', ringkasan: initialLaporan.keuangan.ringkasan, urgent: initialLaporan.keuangan.mendesak, waiting: initialLaporan.keuangan.menunggu },
  { id: 'absensi', name: 'Mbak Siti', role: 'HR & Absensi', room: 'Divisi Operasional', emoji: '📸', shirtColor: '#8b5cf6', skinColor: SKIN_TONES[4], hairColor: HAIR_COLORS[4], deskPos: [4.6, 0, -2.5], triggers: ['absen', 'hadir'], currentTask: 'Verifikasi selfie shift pagi', ringkasan: initialLaporan.absensi.ringkasan, urgent: initialLaporan.absensi.mendesak, waiting: initialLaporan.absensi.menunggu },
  { id: 'konten', name: 'Jessica', role: 'Konten & Media', room: 'Divisi Kreatif', emoji: '✍️', shirtColor: '#ec4899', skinColor: SKIN_TONES[5], hairColor: HAIR_COLORS[5], deskPos: [6.8, 0, 1.2], triggers: ['caption', 'ide', 'post'], currentTask: 'Draft konten reels promo', ringkasan: initialLaporan.konten.ringkasan, urgent: initialLaporan.konten.mendesak, waiting: initialLaporan.konten.menunggu },
  { id: 'support', name: 'Mas Arief', role: 'CS & FAQ WhatsApp', room: 'Divisi Support', emoji: '🤝', shirtColor: '#06b6d4', skinColor: SKIN_TONES[6], hairColor: HAIR_COLORS[6], deskPos: [7.2, 0, -2.5], triggers: ['faq', 'bantuan'], currentTask: 'Standby pesan WhatsApp 24/7', ringkasan: initialLaporan.support.ringkasan, urgent: initialLaporan.support.mendesak, waiting: initialLaporan.support.menunggu },
  { id: 'echo', name: 'Mas Alex (Lead)', role: 'Tech & System Lead', room: 'Divisi IT', emoji: '🦜', shirtColor: '#64748b', skinColor: SKIN_TONES[7], hairColor: HAIR_COLORS[7], deskPos: [0, 0, -2.5], triggers: ['echo', 'ping'], currentTask: 'Server Cloudflare & Supabase normal', ringkasan: initialLaporan.echo.ringkasan, urgent: initialLaporan.echo.mendesak, waiting: initialLaporan.echo.menunggu },
];

const TARGET_SPOTS = {
  kopi: new THREE.Vector3(-6.8, 0, 3.8),
  papan: new THREE.Vector3(0, 0, -3.8),
  sofa: new THREE.Vector3(6.8, 0, 3.8),
  meeting: new THREE.Vector3(0, 0, 1.4),
};

export default function VirtualOffice() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [actors] = useState<AgentActor[]>(INITIAL_ACTORS);
  const [selectedAgent, setSelectedAgent] = useState<AgentActor | null>(null);
  const [gaya, setGaya] = useState<GayaId>('asli');
  const [isTimelapse, setIsTimelapse] = useState(false);
  const [clockTime, setClockTime] = useState('11:00');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showMissionBoard, setShowMissionBoard] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  // Floating HTML Bubbles State
  const [bubbles, setBubbles] = useState<Array<{
    id: string;
    name: string;
    text: string;
    urgent: boolean;
    waiting: boolean;
    x: number;
    y: number;
    visible: boolean;
  }>>([]);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Kantor AI 3D Aktif. Seluruh agen AI duduk di kursi kerja masing-masing.', time: '11:00' },
  ]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Procedural Actors Ref
  const actorsMapRef = useRef<Map<string, {
    root: THREE.Group;
    body: THREE.Mesh;
    head: THREE.Mesh;
    armL: THREE.Mesh;
    armR: THREE.Mesh;
    legL: THREE.Mesh;
    legR: THREE.Mesh;
    chairGroup: THREE.Group;
    seatPos: THREE.Vector3;
    currentPos: THREE.Vector3;
    isWalking: boolean;
    deskMesh: THREE.Mesh;
    laptopLight: THREE.PointLight;
  }>>(new Map());

  // Web Audio Synth (72 BPM)
  const toggleAudio = () => {
    if (!audioPlaying) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
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
          gain.gain.setValueAtTime(0.035, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 1.2);
        }, 833);

        setAudioPlaying(true);
      } catch (e) {
        console.error('Audio error', e);
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

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Isometric Orthographic Camera
    const aspect = width / height;
    const frustumSize = 16.5; // Bigger field of view for large office
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      120
    );
    cameraRef.current = camera;
    camera.position.set(16, 16, 16);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer with antialiasing and soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minZoom = 0.5;
    controls.maxZoom = 2.8;

    // 5. Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.7);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    dirLight.position.set(16, 22, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -14;
    dirLight.shadow.camera.right = 14;
    dirLight.shadow.camera.top = 14;
    dirLight.shadow.camera.bottom = -14;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 6. Build Enlarged Multi-Room Office Architecture & Furniture
    buildEnlargedOffice(scene, gaya);

    // 7. Raycasting for Clicking Characters & Desks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let currentObj: any = hit.object;
        if (currentObj.userData && currentObj.userData.isBoard) {
          setShowMissionBoard(true);
          return;
        }

        while (currentObj && currentObj !== scene) {
          if (currentObj.userData && currentObj.userData.agentId) {
            const target = INITIAL_ACTORS.find((a) => a.id === currentObj.userData.agentId);
            if (target) {
              setSelectedAgent(target);
              return;
            }
          }
          currentObj = currentObj.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Loop (Autonomous Walking & Sitting Animations)
    let animId: number;
    let clock = new THREE.Clock();
    let totalTime = 0;

    const smoothStep = (x: number) => x * x * (3 - 2 * x);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      totalTime += delta;

      const curW = container.clientWidth || window.innerWidth;
      const curH = container.clientHeight || window.innerHeight;

      // Update Each Procedural Character
      actorsMapRef.current.forEach((actorData, agentId) => {
        const idx = INITIAL_ACTORS.findIndex((a) => a.id === agentId);
        const speedMultiplier = isTimelapse ? 3.0 : 1.0;
        const shifted = totalTime * speedMultiplier + idx * 5.7;
        const cycle = ((shifted % 22) + 22) % 22;

        let targetSpot = TARGET_SPOTS.kopi;
        if (idx % 4 === 1) targetSpot = TARGET_SPOTS.papan;
        if (idx % 4 === 2) targetSpot = TARGET_SPOTS.sofa;
        if (idx % 4 === 3) targetSpot = TARGET_SPOTS.meeting;

        const seat = actorData.seatPos;

        if (cycle < 3.2) {
          // Walking to Target Spot
          actorData.isWalking = true;
          const k = smoothStep(cycle / 3.2);
          actorData.currentPos.lerpVectors(seat, targetSpot, k);
          actorData.root.position.copy(actorData.currentPos);
          actorData.root.lookAt(targetSpot.x, 0, targetSpot.z);

          // Limb swinging animation while walking
          const swing = Math.sin(totalTime * 10);
          actorData.legL.rotation.x = swing * 0.55;
          actorData.legR.rotation.x = -swing * 0.55;
          actorData.armL.rotation.x = -swing * 0.45;
          actorData.armR.rotation.x = swing * 0.45;
          actorData.root.position.y = Math.abs(Math.sin(totalTime * 10)) * 0.08;
        } else if (cycle < 10.5) {
          // Standing / Relaxing at Target Spot
          actorData.isWalking = false;
          actorData.currentPos.copy(targetSpot);
          actorData.root.position.copy(targetSpot);

          // Subtle idle breathing
          actorData.legL.rotation.x = 0;
          actorData.legR.rotation.x = 0;
          actorData.armL.rotation.x = Math.sin(totalTime * 2) * 0.08;
          actorData.armR.rotation.x = -Math.sin(totalTime * 2) * 0.08;
          actorData.head.rotation.y = Math.sin(totalTime * 1.5) * 0.2;
          actorData.root.position.y = 0;
        } else if (cycle < 14.0) {
          // Walking back to Chair
          actorData.isWalking = true;
          const k = smoothStep((cycle - 10.5) / 3.5);
          actorData.currentPos.lerpVectors(targetSpot, seat, k);
          actorData.root.position.copy(actorData.currentPos);
          actorData.root.lookAt(seat.x, 0, seat.z);

          const swing = Math.sin(totalTime * 10);
          actorData.legL.rotation.x = swing * 0.55;
          actorData.legR.rotation.x = -swing * 0.55;
          actorData.armL.rotation.x = -swing * 0.45;
          actorData.armR.rotation.x = swing * 0.45;
          actorData.root.position.y = Math.abs(Math.sin(totalTime * 10)) * 0.08;
        } else {
          // Sitting on the Chair at the Desk Working!
          actorData.isWalking = false;
          actorData.currentPos.copy(seat);
          actorData.root.position.copy(seat);
          actorData.root.rotation.set(0, 0, 0); // Face the desk

          // Sitting pose: legs bent 90 degrees forward
          actorData.legL.rotation.x = -Math.PI / 2.2;
          actorData.legR.rotation.x = -Math.PI / 2.2;

          // Hands typing on laptop keyboard
          const typing = Math.sin(totalTime * 12 + idx);
          actorData.armL.rotation.x = -Math.PI / 3.2 + typing * 0.12;
          actorData.armR.rotation.x = -Math.PI / 3.2 - typing * 0.12;
          actorData.head.rotation.x = 0.15; // looking down at screen
          actorData.head.rotation.y = Math.sin(totalTime * 1.2 + idx) * 0.08;
          actorData.root.position.y = 0;
        }

        // Pulse desk light if urgent
        const actorMeta = INITIAL_ACTORS[idx];
        if (actorMeta && actorMeta.urgent.length > 0 && actorData.deskMesh) {
          const pulse = (Math.sin(totalTime * 6) + 1) * 0.5;
          (actorData.deskMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
          (actorData.deskMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.7;
        }
      });

      // Update Floating HTML Bubbles
      const newBubbles: typeof bubbles = [];
      actorsMapRef.current.forEach((actorData, agentId) => {
        const actorMeta = INITIAL_ACTORS.find((a) => a.id === agentId);
        if (!actorMeta) return;

        const headPos = actorData.currentPos.clone().add(new THREE.Vector3(0, 1.7, 0));
        headPos.project(camera);

        const x = ((headPos.x + 1) * curW) / 2;
        const y = ((-headPos.y + 1) * curH) / 2;

        let statusText = actorMeta.ringkasan;
        if (actorData.isWalking) {
          statusText = '🚶 Berpindah ke area lain...';
        } else if (actorData.currentPos.distanceTo(TARGET_SPOTS.kopi) < 0.6) {
          statusText = '☕ Ngopi santai di Pantry';
        } else if (actorData.currentPos.distanceTo(TARGET_SPOTS.papan) < 0.6) {
          statusText = '📋 Membaca Mission Board';
        } else if (actorData.currentPos.distanceTo(TARGET_SPOTS.sofa) < 0.6) {
          statusText = '🛋️ Diskusi santai di Sofa';
        } else if (actorData.currentPos.distanceTo(TARGET_SPOTS.meeting) < 0.6) {
          statusText = '📊 Koordinasi di Meja Rapat';
        }

        newBubbles.push({
          id: agentId,
          name: actorMeta.name,
          text: statusText,
          urgent: actorMeta.urgent.length > 0,
          waiting: actorMeta.waiting.length > 0,
          x,
          y,
          visible: headPos.z < 1,
        });
      });

      setBubbles(newBubbles);

      // Timelapse Clock
      if (isTimelapse) {
        const simMinutes = Math.floor((totalTime * 30) % 720) + 480;
        const h = Math.floor(simMinutes / 60);
        const m = simMinutes % 60;
        setClockTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const a = w / h;
      camera.left = (-frustumSize * a) / 2;
      camera.right = (frustumSize * a) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container) container.innerHTML = '';
      actorsMapRef.current.clear();
    };
  }, [gaya, isTimelapse]);

  // Build Enlarged Architectural Office Layout with Chairs & Procedural Characters
  function buildEnlargedOffice(scene: THREE.Scene, theme: GayaId) {
    actorsMapRef.current.clear();

    let wallColor = 0x334155;
    let deskColor = 0x273549;
    let chairColor = 0x1e293b;

    if (theme === 'hologram') {
      scene.background = new THREE.Color(0x040814);
      wallColor = 0x0284c7;
      deskColor = 0x0c2140;
      chairColor = 0x0369a1;
    } else if (theme === 'clay') {
      scene.background = new THREE.Color(0x2d2b38);
      wallColor = 0xb4a49c;
      deskColor = 0xc7b198;
      chairColor = 0x8a7968;
    } else if (theme === 'diorama') {
      scene.background = new THREE.Color(0x11161d);
      wallColor = 0x4a3b32;
      deskColor = 0x5a463a;
      chairColor = 0x2b221c;
    } else {
      scene.background = new THREE.Color(0x0b1120);
    }

    // 1. Large Office Floors (20m x 11m)
    RUANGAN_LIST.forEach((room) => {
      const roomWidth = room.x1 - room.x0;
      const roomGeo = new THREE.PlaneGeometry(roomWidth, 10.5);
      const roomMat = new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x081b33 : room.floorColor,
        roughness: 0.65,
        metalness: theme === 'hologram' ? 0.4 : 0.1,
      });
      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.rotation.x = -Math.PI / 2;
      roomMesh.position.set((room.x0 + room.x1) / 2, 0.005, 0);
      roomMesh.receiveShadow = true;
      scene.add(roomMesh);

      // Large Rug for the department
      const rugGeo = new THREE.PlaneGeometry(roomWidth - 0.7, 9.2);
      const rugMat = new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x0369a1 : room.rugColor,
        roughness: 0.8,
        transparent: true,
        opacity: theme === 'hologram' ? 0.35 : 0.85,
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set((room.x0 + room.x1) / 2, 0.015, 0);
      rug.receiveShadow = true;
      scene.add(rug);
    });

    // 2. Hologram Wireframe Grid
    if (theme === 'hologram') {
      const grid = new THREE.GridHelper(22, 44, 0x38bdf8, 0x0284c7);
      grid.position.y = 0.02;
      scene.add(grid);
    }

    // 3. Back Architecture Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3.6, 0.3),
      new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.5,
        transparent: theme === 'hologram',
        opacity: theme === 'hologram' ? 0.4 : 1,
      })
    );
    backWall.position.set(0, 1.8, -5.25);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 4. Large 3D Mission Board on Center Wall
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 2.0, 0.12),
      new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x0284c7 : 0xf8fafc,
        roughness: 0.3,
        emissive: theme === 'hologram' ? 0x0284c7 : 0x000000,
        emissiveIntensity: 0.3,
      })
    );
    board.position.set(0, 2.0, -5.1);
    board.userData = { isBoard: true };
    scene.add(board);

    // Sticky Notes on Board
    const noteColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    for (let i = 0; i < 10; i++) {
      const note = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.42),
        new THREE.MeshBasicMaterial({ color: noteColors[i % noteColors.length] })
      );
      note.position.set(-2.0 + (i % 5) * 1.0, 2.4 - Math.floor(i / 5) * 0.75, -5.02);
      scene.add(note);
    }

    // 5. Grand Meeting Conference Table & Chairs in Center Zone
    const meetTable = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.75, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    meetTable.position.set(0, 0.375, 1.4);
    meetTable.castShadow = true;
    meetTable.receiveShadow = true;
    scene.add(meetTable);

    // Meeting Chairs around table (6 Chairs)
    const meetChairPositions = [
      [-1.2, 0, 0.4], [0, 0, 0.4], [1.2, 0, 0.4], // North side
      [-1.2, 0, 2.4], [0, 0, 2.4], [1.2, 0, 2.4], // South side
    ];
    meetChairPositions.forEach(([cx, cy, cz], idx) => {
      createOfficeChair(scene, cx, cy, cz, idx < 3 ? 0 : Math.PI, chairColor);
    });

    // 6. Lounge Cafe & Coffee Pantry Bar (Wing Barat & Timur Depan)
    // Coffee Counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.88, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    counter.position.set(-6.8, 0.44, 3.8);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);

    // Coffee Machine
    const coffeeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
    );
    coffeeMachine.position.set(-6.8, 1.18, 3.8);
    coffeeMachine.castShadow = true;
    scene.add(coffeeMachine);

    // Bar Stools (2 Kursi Bar)
    createBarStool(scene, -5.8, 3.8, chairColor);
    createBarStool(scene, -7.8, 3.8, chairColor);

    // Large Lounge Sofa & Coffee Table (Wing Timur Depan)
    const sofa = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.72, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 })
    );
    sofa.position.set(6.8, 0.36, 3.8);
    sofa.castShadow = true;
    sofa.receiveShadow = true;
    scene.add(sofa);

    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.4, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    coffeeTable.position.set(6.8, 0.2, 2.6);
    coffeeTable.castShadow = true;
    scene.add(coffeeTable);

    // 7. Desks, Chairs, and Procedural Cute Human Characters for each Agent
    INITIAL_ACTORS.forEach((actor, i) => {
      const [dx, dy, dz] = actor.deskPos;

      // A. Large Wooden Desk
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.74, 0.9),
        new THREE.MeshStandardMaterial({ color: deskColor, roughness: 0.5 })
      );
      desk.position.set(dx, 0.37, dz);
      desk.castShadow = true;
      desk.receiveShadow = true;
      desk.userData = { agentId: actor.id };
      scene.add(desk);

      // Laptop Base
      const laptop = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.02, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      laptop.position.set(dx, 0.75, dz);
      scene.add(laptop);

      // Laptop Screen Glowing with Agent Color
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.28, 0.015),
        new THREE.MeshBasicMaterial({ color: actor.shirtColor })
      );
      screen.position.set(dx, 0.89, dz + (actor.rotationY === 0 ? -0.12 : 0.12));
      screen.rotation.x = actor.rotationY === 0 ? 0.22 : -0.22;
      scene.add(screen);

      // Desk Lamp with soft glow
      const lampPoint = new THREE.PointLight(actor.shirtColor, 0.8, 2.5);
      lampPoint.position.set(dx + 0.55, 1.1, dz);
      scene.add(lampPoint);

      // B. REAL ERGONOMIC OFFICE CHAIR (TEMPAT DUDUK LENGKAP)
      // Chair position is placed directly behind the desk
      const chairZ = dz + (actor.rotationY === 0 ? 0.85 : -0.85);
      const chairGroup = createOfficeChair(scene, dx, 0, chairZ, actor.rotationY, chairColor);

      // C. CUTE PROCEDURAL HUMAN CHARACTER (Stylized Office Worker)
      const root = new THREE.Group();
      root.position.set(dx, 0, chairZ);
      root.userData = { agentId: actor.id };

      // Materials for this character
      const shirtMat = new THREE.MeshStandardMaterial({ color: actor.shirtColor, roughness: 0.5 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const skinMat = new THREE.MeshStandardMaterial({ color: actor.skinColor, roughness: 0.6 });
      const hairMat = new THREE.MeshStandardMaterial({ color: actor.hairColor, roughness: 0.5 });

      // Torso / Body (Capsule/Rounded Box)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), shirtMat);
      body.position.y = 0.95;
      body.castShadow = true;
      root.add(body);

      // Head (Sphere)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), skinMat);
      head.position.y = 1.44;
      head.castShadow = true;
      root.add(head);

      // Styled Hair Cap
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8), hairMat);
      hair.position.set(0, 0.04, -0.02);
      hair.rotation.x = -0.2;
      head.add(hair);

      // Limbs: Arms
      const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.38, 12);
      armGeo.translate(0, -0.19, 0); // pivot at shoulder

      const armL = new THREE.Mesh(armGeo, shirtMat);
      armL.position.set(-0.28, 1.15, 0);
      root.add(armL);

      const armR = new THREE.Mesh(armGeo, shirtMat);
      armR.position.set(0.28, 1.15, 0);
      root.add(armR);

      // Limbs: Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.44, 12);
      legGeo.translate(0, -0.22, 0); // pivot at hip

      const legL = new THREE.Mesh(legGeo, pantsMat);
      legL.position.set(-0.13, 0.68, 0);
      root.add(legL);

      const legR = new THREE.Mesh(legGeo, pantsMat);
      legR.position.set(0.13, 0.68, 0);
      root.add(legR);

      // Initial sitting pose
      legL.rotation.x = -Math.PI / 2.2;
      legR.rotation.x = -Math.PI / 2.2;
      armL.rotation.x = -Math.PI / 3.2;
      armR.rotation.x = -Math.PI / 3.2;

      scene.add(root);

      actorsMapRef.current.set(actor.id, {
        root,
        body,
        head,
        armL,
        armR,
        legL,
        legR,
        chairGroup,
        seatPos: new THREE.Vector3(dx, 0, chairZ),
        currentPos: new THREE.Vector3(dx, 0, chairZ),
        isWalking: false,
        deskMesh: desk,
        laptopLight: lampPoint,
      });
    });
  }

  // Helper: Create Realistic Ergonomic Office Swivel Chair (Tempat Duduk)
  function createOfficeChair(scene: THREE.Scene, x: number, y: number, z: number, rotY: number, colorHex: number) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x, y, z);
    chairGroup.rotation.y = rotY;

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 });

    // 1. Star Caster Base (5 Wheels)
    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), chromeMat);
    baseCyl.position.y = 0.06;
    chairGroup.add(baseCyl);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.04), chromeMat);
      leg.position.set(Math.cos(angle) * 0.18, 0.05, Math.sin(angle) * 0.18);
      leg.rotation.y = -angle;
      chairGroup.add(leg);
    }

    // 2. Gas Lift Center Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 12), chromeMat);
    stem.position.y = 0.25;
    chairGroup.add(stem);

    // 3. Ergonomic Padded Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.56), cushionMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    seat.receiveShadow = true;
    chairGroup.add(seat);

    // 4. Ergonomic Backrest with Lumbar Support
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.08), cushionMat);
    backrest.position.set(0, 0.80, 0.26);
    backrest.rotation.x = -0.08;
    backrest.castShadow = true;
    chairGroup.add(backrest);

    // 5. Left & Right Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.32), chromeMat);
    armL.position.set(-0.31, 0.65, 0.05);
    chairGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.32), chromeMat);
    armR.position.set(0.31, 0.65, 0.05);
    chairGroup.add(armR);

    scene.add(chairGroup);
    return chairGroup;
  }

  // Helper: Create Bar Stool
  function createBarStool(scene: THREE.Scene, x: number, z: number, colorHex: number) {
    const stool = new THREE.Group();
    stool.position.set(x, 0, z);

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const seatMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24), chromeMat);
    base.position.y = 0.01;
    stool.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 12), chromeMat);
    stem.position.y = 0.33;
    stool.add(stem);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24), seatMat);
    seat.position.y = 0.66;
    stool.add(seat);

    scene.add(stool);
  }

  // Reset Camera View
  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(16, 16, 16);
    controlsRef.current.target.set(0, 0.5, 0);
    controlsRef.current.update();
  };

  // Chat Submission
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgent) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'Anda (Owner)', text: chatInput, time };

    setTimeout(() => {
      const botReply = {
        sender: selectedAgent.name,
        text: `🤖 [${selectedAgent.emoji} ${selectedAgent.name}]: Siap! Perintah "${chatInput}" sedang diproses.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatLogs((prev) => [...prev, userMsg, botReply]);
    }, 800);

    setChatLogs((prev) => [...prev, userMsg]);
    setChatInput('');
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-950 font-sans select-none">
      
      {/* ─── 3D WEBGL FULL-SCREEN CANVAS ─── */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* ─── FLOATING TOP-LEFT TITLE & STATUS WIDGET ─── */}
      <div className="absolute top-5 left-6 z-20 flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-xl border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-2xl">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white tracking-tight">
                OFFICE TO THE TOP
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Full Kantor AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              3 Wing Departemen &bull; Kursi Ergonomis &bull; 8 Karakter Manusia
            </p>
          </div>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-1.5 self-start bg-slate-900/70 backdrop-blur-md border border-slate-800/70 px-3 py-1 rounded-xl text-xs font-mono text-indigo-300">
          <Clock className="w-3.5 h-3.5" />
          <span>{isTimelapse ? `${clockTime} WIB` : '11:00 WIB'}</span>
        </div>
      </div>

      {/* ─── FLOATING TOP-RIGHT TOOLBAR ─── */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2 pointer-events-auto">
        
        {/* Mission Board Trigger */}
        <button
          onClick={() => setShowMissionBoard(true)}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all hover:border-slate-700"
        >
          <ClipboardList className="w-4 h-4 text-indigo-400" />
          <span>Mission Board</span>
        </button>

        {/* Timelapse Toggle */}
        <button
          onClick={() => setIsTimelapse(!isTimelapse)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border flex items-center gap-1.5 shadow-xl transition-all ${
            isTimelapse
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-slate-900/85 backdrop-blur-xl text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="Simulasi 1 Hari Kerja Cepat"
        >
          {isTimelapse ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isTimelapse ? 'Pause' : 'Timelapse'}</span>
        </button>

        {/* Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="px-3.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:border-slate-700 capitalize"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
            <span>Gaya: {gaya}</span>
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1 z-30">
              {(['asli', 'hologram', 'clay', 'diorama'] as GayaId[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => {
                    setGaya(themeKey);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                    gaya === themeKey
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {themeKey === 'asli' ? '🏢 Asli' : themeKey === 'hologram' ? '⚡ Hologram' : themeKey === 'clay' ? '🎨 Clay' : '🪵 Diorama'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Synthesizer */}
        <button
          onClick={toggleAudio}
          className={`p-2.5 rounded-2xl text-xs border shadow-xl transition-all ${
            audioPlaying
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900/85 backdrop-blur-xl text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="Lo-Fi Ambient Music"
        >
          {audioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset Camera */}
        <button
          onClick={resetCamera}
          className="p-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl text-slate-400 hover:text-white border border-slate-800 shadow-xl hover:border-slate-700"
          title="Reset Sudut Kamera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── 3D FLOATING BUBBLES IN SCENE ─── */}
      {bubbles.map((b) => {
        if (!b.visible) return null;
        return (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: `${b.x}px`,
              top: `${b.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            onClick={() => {
              const actor = INITIAL_ACTORS.find((a) => a.id === b.id);
              if (actor) setSelectedAgent(actor);
            }}
            className="transition-all duration-300 z-10 cursor-pointer pointer-events-auto"
          >
            <div className={`px-3 py-1.5 rounded-2xl text-[11px] font-medium shadow-2xl backdrop-blur-xl flex items-center gap-1.5 whitespace-nowrap border transition-transform hover:scale-105 active:scale-95 ${
              b.urgent
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/60 animate-bounce'
                : b.waiting
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
                : 'bg-slate-900/85 text-slate-200 border-slate-700/80'
            }`}>
              {b.urgent && <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
              {b.waiting && <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              <span className="font-bold text-indigo-300">{b.name}:</span>
              <span className="max-w-[170px] truncate">{b.text}</span>
            </div>
          </div>
        );
      })}

      {/* ─── BOTTOM FLOATING HELPER HINT ─── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 text-xs text-slate-400 shadow-2xl flex items-center gap-3 font-medium">
          <span>🖱️ <em>Klik karakter untuk berinteraksi</em></span>
          <span>&bull;</span>
          <span>🔄 <em>Drag putar 3D</em></span>
          <span>&bull;</span>
          <span>🔍 <em>Scroll zoom</em></span>
        </div>
      </div>

      {/* ─── POP-UP MODAL: CHARACTER INSPECTOR (KANTOR AI DIALOG) ─── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/10"
                  style={{ backgroundColor: selectedAgent.shirtColor }}
                >
                  {selectedAgent.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedAgent.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {selectedAgent.room}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedAgent.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Daily Report (laporan.json) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <ClipboardList className="w-4 h-4 text-indigo-400" />
                  Laporan Harian Agen:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">laporan.json</span>
              </div>
              <p className="text-slate-300 italic text-[13px] leading-relaxed">
                "{selectedAgent.ringkasan}"
              </p>

              {selectedAgent.urgent.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <Flame className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span><strong>Mendesak:</strong> {selectedAgent.urgent[0]}</span>
                </div>
              )}

              {selectedAgent.waiting.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span><strong>Menunggu Approval:</strong> {selectedAgent.waiting[0]}</span>
                </div>
              )}
            </div>

            {/* Chat WhatsApp Simulator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Kirim Perintah WhatsApp:</span>
                <span className="text-[10px] text-indigo-400 font-mono">/{selectedAgent.id}</span>
              </label>

              <div className="h-32 overflow-y-auto space-y-2 p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-[11px]">
                {chatLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-500">[{log.time}]</span>{' '}
                    <span className="font-semibold text-indigo-400">{log.sender}:</span>{' '}
                    <span className="text-slate-200">{log.text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendCommand} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Kirim perintah ke ${selectedAgent.name}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ─── POP-UP MODAL: MISSION BOARD ─── */}
      {showMissionBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Mission Board &bull; Status Seluruh Agen AI</h3>
                  <p className="text-xs text-slate-400">Rekapitulasi aktivitas dan tugas dari seluruh tim kantor</p>
                </div>
              </div>
              <button
                onClick={() => setShowMissionBoard(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto p-1">
              {actors.map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => {
                    setShowMissionBoard(false);
                    setSelectedAgent(actor);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-950 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <span>{actor.emoji}</span>
                      {actor.name} ({actor.role})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono">
                      /{actor.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{actor.ringkasan}</p>
                  {actor.urgent.length > 0 && (
                    <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      <span>{actor.urgent[0]}</span>
                    </div>
                  )}
                  {actor.waiting.length > 0 && (
                    <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{actor.waiting[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
