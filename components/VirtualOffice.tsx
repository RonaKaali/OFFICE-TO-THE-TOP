'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Send, 
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
  Smartphone,
  ShieldCheck,
  Cpu,
  Monitor
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
  triggers: string[];
  currentTask: string;
  ringkasan: string;
  urgent: string[];
  waiting: string[];
}

const RUANGAN_LIST: RoomZone[] = [
  { key: 'admin', label: 'Wing Barat • Ruang Komando WhatsApp (SANG ADMIN)', x0: -9.5, x1: -3.2, floorColor: 0x1e293b, rugColor: 0x1d4ed8 },
  { key: 'eksekutor', label: 'Wing Tengah • Studio Eksekusi & Boardroom (SANG EKSEKUTOR)', x0: -3.2, x1: 3.2, floorColor: 0x0f172a, rugColor: 0x059669 },
  { key: 'qc', label: 'Wing Timur • Stasiun Verifikasi & Quality Control (SANG QC)', x0: 3.2, x1: 9.5, floorColor: 0x1e293b, rugColor: 0xd97706 },
];

const INITIAL_ACTORS: AgentActor[] = [
  {
    id: 'admin',
    name: 'SANG ADMIN',
    role: 'Chief Orchestrator & WhatsApp Gateway',
    room: 'Ruang Komando WA (Wing Barat)',
    emoji: '👑',
    shirtColor: '#2563eb',
    skinColor: '#f1c7a5',
    hairColor: '#1e293b',
    deskPos: [-5.5, 0, -2.0],
    triggers: ['admin', 'wa', 'whatsapp', 'tugas', 'order', 'semua'],
    currentTask: 'Terhubung 24/7 ke WhatsApp Owner & siap delegasi tugas',
    ringkasan: (initialLaporan as any).admin?.ringkasan || 'Gateway WhatsApp aktif terhubung ke nomor Anda.',
    urgent: (initialLaporan as any).admin?.mendesak || [],
    waiting: (initialLaporan as any).admin?.menunggu || [],
  },
  {
    id: 'eksekutor',
    name: 'SANG EKSEKUTOR',
    role: 'Tech Builder & Task Execution Workhorse',
    room: 'Studio Eksekusi (Wing Tengah)',
    emoji: '⚡',
    shirtColor: '#10b981',
    skinColor: '#e8b896',
    hairColor: '#334155',
    deskPos: [0, 0, -2.0],
    triggers: ['eksekusi', 'kerjakan', 'buat', 'tulis', 'coding'],
    currentTask: 'Mengeksekusi otomasi teknis dan menyerahkan berkas ke QC',
    ringkasan: (initialLaporan as any).eksekutor?.ringkasan || 'Mengeksekusi seluruh instruksi dan menyerahkan ke QC.',
    urgent: (initialLaporan as any).eksekutor?.mendesak || [],
    waiting: (initialLaporan as any).eksekutor?.menunggu || [],
  },
  {
    id: 'qc',
    name: 'SANG QC',
    role: 'Quality Assurance & Compliance Auditor',
    room: 'Stasiun Verifikasi QC (Wing Timur)',
    emoji: '🔍',
    shirtColor: '#f59e0b',
    skinColor: '#deb887',
    hairColor: '#475569',
    deskPos: [5.5, 0, -2.0],
    triggers: ['qc', 'cek', 'verifikasi', 'validasi', 'review'],
    currentTask: 'Menguji ketelitian & verifikasi kelayakan hasil Eksekutor',
    ringkasan: (initialLaporan as any).qc?.ringkasan || 'Memvalidasi hasil kerja eksekutor sebelum dilaporkan.',
    urgent: (initialLaporan as any).qc?.mendesak || [],
    waiting: (initialLaporan as any).qc?.menunggu || [],
  },
];

export default function VirtualOffice() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [actors] = useState<AgentActor[]>(INITIAL_ACTORS);
  const [selectedAgent, setSelectedAgent] = useState<AgentActor | null>(null);
  const [gaya, setGaya] = useState<GayaId>('asli');
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

  // Chat State & Multi-Agent Delegation Pipeline
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'HQ Office To The Top Aktif. Trio Agen Inti (SANG ADMIN, SANG EKSEKUTOR, SANG QC) siap di workstation masing-masing.', time: '11:00' },
    { sender: '👑 SANG ADMIN', text: 'WhatsApp Gateway terhubung ke nomor Owner. Kirim pesan kapan saja!', time: '11:01' },
  ]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Actor Ref map for procedural character animation
  const actorsMapRef = useRef<Map<string, {
    root: THREE.Group;
    body: THREE.Mesh;
    head: THREE.Group;
    armL: THREE.Group;
    armR: THREE.Group;
    thighL: THREE.Group;
    thighR: THREE.Group;
    laptopLight: THREE.PointLight;
    screenMesh: THREE.Mesh;
    phoneGlow?: THREE.PointLight;
    seatPos: THREE.Vector3;
    isBusy: boolean;
  }>>(new Map());

  // Web Audio Synth Lo-fi Ambience (72 BPM)
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
    const frustumSize = 16.5;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      140
    );
    cameraRef.current = camera;
    camera.position.set(16, 15, 16);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer with antialiasing & soft shadows
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

    // 5. Lighting Setup: Warm sunlight + soft ambient skylight
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.4);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    dirLight.position.set(18, 22, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    // Subtle blue fill light from window side
    const windowFill = new THREE.DirectionalLight(0x38bdf8, 0.8);
    windowFill.position.set(-18, 12, -18);
    scene.add(windowFill);

    // 6. Build Real Premium Executive Office Architecture
    buildRealOffice(scene, gaya);

    // 7. Raycasting for Clicking Characters, Desks, and Mission Board
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

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let totalTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      totalTime += delta;

      const curW = container.clientWidth || window.innerWidth;
      const curH = container.clientHeight || window.innerHeight;

      // Animate Each Procedural Character at Desk
      actorsMapRef.current.forEach((actorData, agentId) => {
        const idx = INITIAL_ACTORS.findIndex((a) => a.id === agentId);
        
        // Typing rhythm on keyboard (alternating left & right wrists)
        const typeSpeed = actorData.isBusy ? 22 : 9;
        const leftType = Math.sin(totalTime * typeSpeed + idx);
        const rightType = Math.cos(totalTime * typeSpeed + idx);

        // Arms reach forward onto desk to type
        actorData.armL.rotation.x = -Math.PI / 3.4 + leftType * 0.08;
        actorData.armR.rotation.x = -Math.PI / 3.4 + rightType * 0.08;

        // Subtle head motion (looking between primary and secondary monitor)
        const lookCycle = Math.sin(totalTime * 1.4 + idx * 2.1);
        actorData.head.rotation.y = lookCycle * 0.18;
        actorData.head.rotation.x = 0.12 + Math.cos(totalTime * 1.8 + idx) * 0.04;

        // Subtle body breathing
        actorData.body.scale.set(
          1 + Math.sin(totalTime * 2.2 + idx) * 0.015,
          1 + Math.cos(totalTime * 2.2 + idx) * 0.02,
          1
        );

        // Active glow on screen & phone
        if (actorData.phoneGlow) {
          actorData.phoneGlow.intensity = 0.8 + Math.sin(totalTime * 5) * 0.5;
        }
      });

      // Update Floating HTML Bubbles over characters
      const newBubbles: typeof bubbles = [];
      actorsMapRef.current.forEach((actorData, agentId) => {
        const actorMeta = INITIAL_ACTORS.find((a) => a.id === agentId);
        if (!actorMeta) return;

        const headPos = actorData.seatPos.clone().add(new THREE.Vector3(0, 1.85, 0));
        headPos.project(camera);

        const x = ((headPos.x + 1) * curW) / 2;
        const y = ((-headPos.y + 1) * curH) / 2;

        newBubbles.push({
          id: agentId,
          name: actorMeta.name,
          text: actorMeta.currentTask,
          urgent: actorMeta.urgent.length > 0,
          waiting: actorMeta.waiting.length > 0,
          x,
          y,
          visible: headPos.z < 1,
        });
      });

      setBubbles(newBubbles);

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
      actorsMapRef.current.clear();
    };
  }, [gaya]);

  // Build Real Executive Office Architecture
  function buildRealOffice(scene: THREE.Scene, theme: GayaId) {
    // 1. Flooring: Luxurious Executive Wood Herringbone / Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(21, 13);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === 'hologram' ? 0x03182e : (theme === 'clay' ? 0xd6c7b2 : 0x1e293b),
      roughness: 0.35,
      metalness: theme === 'hologram' ? 0.6 : 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Parquet Floor Planks Texture Lines
    const grid = new THREE.GridHelper(21, 28, 0x334155, 0x1e293b);
    grid.position.y = 0.005;
    scene.add(grid);

    // Executive Room Department Rugs
    RUANGAN_LIST.forEach((room) => {
      const rugW = Math.abs(room.x1 - room.x0) - 0.4;
      const rugGeo = new THREE.PlaneGeometry(rugW, 8.8);
      const rugMat = new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x0284c7 : room.rugColor,
        roughness: 0.85,
        transparent: true,
        opacity: theme === 'hologram' ? 0.35 : 0.7,
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set((room.x0 + room.x1) / 2, 0.015, 0);
      rug.receiveShadow = true;
      scene.add(rug);

      // Rug gold border trim
      const borderGeo = new THREE.RingGeometry(rugW / 2 - 0.04, rugW / 2, 4);
    });

    // 2. City Skyline Beyond Floor-to-Ceiling Windows
    const skylineGroup = new THREE.Group();
    const bldgColors = [0x0f172a, 0x1e293b, 0x090d16, 0x172554];
    for (let i = 0; i < 18; i++) {
      const bw = 1.2 + Math.random() * 1.4;
      const bh = 5 + Math.random() * 9;
      const bd = 1.2 + Math.random() * 1.4;
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        new THREE.MeshStandardMaterial({
          color: bldgColors[i % bldgColors.length],
          roughness: 0.2,
          metalness: 0.8,
        })
      );
      bldg.position.set(-13 + i * 1.5, bh / 2 - 2, -9.5);
      skylineGroup.add(bldg);

      // Skyscraper illuminated window specks
      const winCount = 8;
      for (let w = 0; w < winCount; w++) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        win.position.set(
          bldg.position.x + (Math.random() - 0.5) * (bw * 0.7),
          1 + Math.random() * (bh - 2),
          -9.5 + bd / 2 + 0.01
        );
        skylineGroup.add(win);
      }
    }
    scene.add(skylineGroup);

    // 3. Tall Floor-to-Ceiling Glass Curtain Wall & Aluminum Mullions (Back Wall)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    const glassWall = new THREE.Mesh(new THREE.BoxGeometry(20.5, 4.2, 0.08), glassMat);
    glassWall.position.set(0, 2.1, -5.3);
    scene.add(glassWall);

    // Architectural Steel Mullions / Frames
    for (let x = -10; x <= 10; x += 2.5) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 4.2, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
      );
      mullion.position.set(x, 2.1, -5.28);
      scene.add(mullion);
    }
    // Horizontal window transoms
    [1.4, 2.8, 4.15].forEach((y) => {
      const transom = new THREE.Mesh(
        new THREE.BoxGeometry(20.5, 0.08, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
      );
      transom.position.set(0, y, -5.28);
      scene.add(transom);
    });

    // 4. Acoustic Slatted Wood Accent Feature Wall in Central Hub
    const slatGroup = new THREE.Group();
    const slatMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    for (let x = -3.2; x <= 3.2; x += 0.18) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.8, 0.06), slatMat);
      slat.position.set(x, 1.9, -5.22);
      slatGroup.add(slat);
    }
    scene.add(slatGroup);

    // Warm Ambient LED Glow behind feature wall
    const warmBacklight = new THREE.PointLight(0xf59e0b, 1.2, 8);
    warmBacklight.position.set(0, 3.2, -5.0);
    scene.add(warmBacklight);

    // 5. 3D Illuminated Company Sign & Interactive Mission Board
    // Company Header Plaque
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
    );
    plaque.position.set(0, 3.4, -5.1);
    scene.add(plaque);

    // 3D Mission Board on Center Wall
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 1.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    board.position.set(0, 2.1, -5.1);
    board.userData = { isBoard: true };
    scene.add(board);

    // Colorful sticky task cards on board
    const noteColors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x06b6d4];
    for (let i = 0; i < 8; i++) {
      const note = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.48),
        new THREE.MeshBasicMaterial({ color: noteColors[i % noteColors.length] })
      );
      note.position.set(-1.8 + (i % 4) * 1.15, 2.4 - Math.floor(i / 4) * 0.7, -5.02);
      scene.add(note);
    }

    // 6. Central Executive Boardroom Table & Leather Chairs
    const confTable = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.74, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.4 })
    );
    confTable.position.set(0, 0.37, 1.6);
    confTable.scale.set(1.4, 1, 0.9);
    confTable.castShadow = true;
    confTable.receiveShadow = true;
    scene.add(confTable);

    // Conference phone spider puck
    const confPhone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.24, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    confPhone.position.set(0, 0.765, 1.6);
    scene.add(confPhone);

    // 4 Executive Conference Chairs
    const confChairAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    confChairAngles.forEach((angle) => {
      const cx = Math.cos(angle) * 1.8;
      const cz = 1.6 + Math.sin(angle) * 1.2;
      createExecutiveChair(scene, cx, 0, cz, -angle - Math.PI / 2, 0x1e293b);
    });

    // 7. Coffee Bar & Lounge Area (Wing Barat Depan)
    const barCounter = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.95, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    barCounter.position.set(-6.2, 0.475, 3.8);
    barCounter.castShadow = true;
    barCounter.receiveShadow = true;
    scene.add(barCounter);

    // Chrome Italian Espresso Machine
    const espressoMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.55, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
    );
    espressoMachine.position.set(-6.2, 1.22, 3.8);
    espressoMachine.castShadow = true;
    scene.add(espressoMachine);

    // Coffee Mugs
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    mug.position.set(-5.4, 1.0, 3.8);
    scene.add(mug);

    // Bar Stools
    createBarStool(scene, -5.2, 2.8, 0x334155);
    createBarStool(scene, -7.0, 2.8, 0x334155);

    // 8. Executive Lounge Corner (Wing Timur Depan)
    const loungeSofa = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.65, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    loungeSofa.position.set(6.2, 0.325, 3.8);
    loungeSofa.castShadow = true;
    loungeSofa.receiveShadow = true;
    scene.add(loungeSofa);

    const loungeTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.35, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.3 })
    );
    loungeTable.position.set(6.2, 0.175, 2.5);
    loungeTable.castShadow = true;
    scene.add(loungeTable);

    // 9. Lush Office Plants (Monstera & Fiddle Leaf Fig)
    createOfficePlant(scene, -8.8, 0, -4.2);
    createOfficePlant(scene, 8.8, 0, -4.2);
    createOfficePlant(scene, 8.8, 0, 3.8);

    // 10. Build The 3 Dedicated Executive Workstations & Characters
    INITIAL_ACTORS.forEach((actor) => {
      buildAgentWorkstation(scene, actor);
    });
  }

  // Helper: Build Real Executive Workstation for Each Agent
  function buildAgentWorkstation(scene: THREE.Scene, actor: AgentActor) {
    const [dx, dy, dz] = actor.deskPos;

    // A. Executive Desk with Modesty Panel & Solid Wood Texture
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 1.1),
      new THREE.MeshStandardMaterial({
        color: actor.id === 'admin' ? 0x0f172a : (actor.id === 'eksekutor' ? 0x18181b : 0x1e293b),
        roughness: 0.25,
        metalness: 0.3,
      })
    );
    deskTop.position.set(dx, 0.74, dz);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskTop.userData = { agentId: actor.id };
    scene.add(deskTop);

    // Desk Legs & Cable Channel
    const legL = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.74, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8 })
    );
    legL.position.set(dx - 1.02, 0.37, dz);
    scene.add(legL);

    const legR = legL.clone();
    legR.position.x = dx + 1.02;
    scene.add(legR);

    // Desk Modesty Front Panel
    const frontPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.5, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 })
    );
    frontPanel.position.set(dx, 0.45, dz - 0.48);
    scene.add(frontPanel);

    // B. Ultrawide Multi-Monitors Setup on Heavy Duty Monitor Arm
    // Center Primary Monitor
    const primaryMon = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.42, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85 })
    );
    primaryMon.position.set(dx, 1.12, dz - 0.25);
    scene.add(primaryMon);

    // Primary Screen Display Glowing with Custom UI
    const screenDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.38),
      new THREE.MeshBasicMaterial({ color: actor.shirtColor })
    );
    screenDisplay.position.set(dx, 1.12, dz - 0.23);
    scene.add(screenDisplay);

    // Secondary Monitor (Vertical for Eksekutor, Angled for Admin & QC)
    const secMon = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.48, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85 })
    );
    secMon.position.set(dx + 0.55, 1.15, dz - 0.18);
    secMon.rotation.y = -0.35;
    scene.add(secMon);

    const secDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.31, 0.44),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    secDisplay.position.set(dx + 0.54, 1.15, dz - 0.16);
    secDisplay.rotation.y = -0.35;
    scene.add(secDisplay);

    // Keyboard & Mouse Pad
    const deskPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.005, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
    );
    deskPad.position.set(dx, 0.785, dz + 0.12);
    scene.add(deskPad);

    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.015, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7 })
    );
    keyboard.position.set(dx - 0.08, 0.795, dz + 0.12);
    scene.add(keyboard);

    // C. Specialized Props per Agent
    let phoneLight: THREE.PointLight | undefined;
    if (actor.id === 'admin') {
      // WhatsApp Smartphone Dock with glowing green status indicator
      const phone = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.012, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9 })
      );
      phone.position.set(dx + 0.35, 0.79, dz + 0.14);
      scene.add(phone);

      const phoneScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.075, 0.14),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      phoneScreen.rotation.x = -Math.PI / 2;
      phoneScreen.position.set(dx + 0.35, 0.8, dz + 0.14);
      scene.add(phoneScreen);

      phoneLight = new THREE.PointLight(0x22c55e, 1.2, 2.5);
      phoneLight.position.set(dx + 0.35, 0.95, dz + 0.14);
      scene.add(phoneLight);
    } else if (actor.id === 'eksekutor') {
      // Custom Liquid-Cooled Gaming/Developer PC Tower on floor
      const pcTower = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.48, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8 })
      );
      pcTower.position.set(dx + 0.85, 0.24, dz + 0.1);
      scene.add(pcTower);

      const pcGlow = new THREE.PointLight(0x10b981, 1.5, 2.2);
      pcGlow.position.set(dx + 0.85, 0.3, dz + 0.1);
      scene.add(pcGlow);
    } else if (actor.id === 'qc') {
      // Quality Inspection Tablet & Green Check Hologram
      const tablet = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.01, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8 })
      );
      tablet.position.set(dx - 0.45, 0.79, dz + 0.12);
      scene.add(tablet);

      const checkGlow = new THREE.PointLight(0xf59e0b, 1.2, 2.2);
      checkGlow.position.set(dx - 0.45, 0.95, dz + 0.12);
      scene.add(checkGlow);
    }

    // Nameplate on front of desk
    const nameplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.1, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    nameplate.position.set(dx, 0.74, dz - 0.52);
    scene.add(nameplate);

    // Warm Focused Downlight on Workstation
    const deskSpot = new THREE.PointLight(0xfff7ed, 1.1, 3.5);
    deskSpot.position.set(dx, 2.2, dz);
    scene.add(deskSpot);

    // D. REAL EXECUTIVE LEATHER SWIVEL CHAIR
    // Chair sits at chairZ facing the desk (which is at -Z)
    const chairZ = dz + 0.82;
    createExecutiveChair(scene, dx, 0, chairZ, 0, 0x1e293b);

    // E. PROCEDURAL ARTICULATED HUMAN CHARACTER (SITTING PROPERLY)
    const root = new THREE.Group();
    // Character root is positioned directly on chair seat
    root.position.set(dx, 0.48, chairZ);
    // Face the desk: Desk is at -Z, so root rotation.y = Math.PI (180 degrees)
    root.rotation.y = Math.PI;
    root.userData = { agentId: actor.id };

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: actor.skinColor, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: actor.hairColor, roughness: 0.4 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: actor.shirtColor, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 });

    // 1. Pelvis / Hips (Resting directly on chair cushion)
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.32), pantsMat);
    hips.position.set(0, 0.08, 0);
    root.add(hips);

    // 2. Torso & Shirt / Suit
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.28), clothesMat);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    root.add(torso);

    // White shirt collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    collar.position.set(0, 0.61, 0);
    root.add(collar);

    // Tie for Admin
    if (actor.id === 'admin') {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.02), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      tie.position.set(0, 0.42, 0.15);
      root.add(tie);
    }

    // 3. Articulated Legs (Proper 90-degree sitting pose)
    // Left Thigh (extends forward horizontally onto chair cushion)
    const thighL = new THREE.Group();
    thighL.position.set(-0.12, 0.08, 0);
    const thighLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.36), pantsMat);
    thighLMesh.position.set(0, 0, 0.18);
    thighL.add(thighLMesh);

    // Left Shin & Foot (drops straight down to the floor)
    const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.13), pantsMat);
    shinL.position.set(0, -0.23, 0.34);
    thighL.add(shinL);

    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.22), shoesMat);
    shoeL.position.set(0, -0.46, 0.38);
    thighL.add(shoeL);
    root.add(thighL);

    // Right Thigh
    const thighR = new THREE.Group();
    thighR.position.set(0.12, 0.08, 0);
    const thighRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.36), pantsMat);
    thighRMesh.position.set(0, 0, 0.18);
    thighR.add(thighRMesh);

    const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.13), pantsMat);
    shinR.position.set(0, -0.23, 0.34);
    thighR.add(shinR);

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.22), shoesMat);
    shoeR.position.set(0, -0.46, 0.38);
    thighR.add(shoeR);
    root.add(thighR);

    // 4. Head, Expressive Face & Hair
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.78, 0);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Stylish Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.215, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.7),
      hairMat
    );
    hair.position.set(0, 0.04, -0.02);
    hair.rotation.x = -0.2;
    headGroup.add(hair);

    // Expressive Eyes (Looking forward towards desk)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), eyeMat);
    eyeL.position.set(-0.065, 0.03, 0.18);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), eyeMat);
    eyeR.position.set(0.065, 0.03, 0.18);
    headGroup.add(eyeR);

    // Glasses for Admin & QC
    if (actor.id === 'admin' || actor.id === 'qc') {
      const glasses = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.05, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9 })
      );
      glasses.position.set(0, 0.03, 0.19);
      headGroup.add(glasses);
    }

    // Headphones for Eksekutor
    if (actor.id === 'eksekutor') {
      const hpBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.21, 0.03, 8, 24, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 })
      );
      hpBand.rotation.x = Math.PI / 2;
      hpBand.rotation.z = Math.PI / 2;
      hpBand.position.y = 0.08;
      headGroup.add(hpBand);

      const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x090d16 }));
      earL.rotation.z = Math.PI / 2;
      earL.position.set(-0.21, 0.0, 0);
      headGroup.add(earL);

      const earR = earL.clone();
      earR.position.x = 0.21;
      headGroup.add(earR);
    }

    root.add(headGroup);

    // 5. Articulated Arms (Typing on Keyboard at Desk)
    // Left Arm
    const armL = new THREE.Group();
    armL.position.set(-0.24, 0.52, 0);

    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.26, 12), clothesMat);
    upperArmL.position.set(0, -0.12, 0);
    armL.add(upperArmL);

    // Forearm & Hand reaching forward onto desk
    const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.32), skinMat);
    forearmL.position.set(0, -0.22, 0.16);
    armL.add(forearmL);
    root.add(armL);

    // Right Arm
    const armR = new THREE.Group();
    armR.position.set(0.24, 0.52, 0);

    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.26, 12), clothesMat);
    upperArmR.position.set(0, -0.12, 0);
    armR.add(upperArmR);

    const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.32), skinMat);
    forearmR.position.set(0, -0.22, 0.16);
    armR.add(forearmR);
    root.add(armR);

    scene.add(root);

    // Register into Actors Map
    actorsMapRef.current.set(actor.id, {
      root,
      body: torso,
      head: headGroup,
      armL,
      armR,
      thighL,
      thighR,
      laptopLight: deskSpot,
      screenMesh: screenDisplay,
      phoneGlow: phoneLight,
      seatPos: new THREE.Vector3(dx, 0.48, chairZ),
      isBusy: false,
    });
  }

  // Helper: Create High-End Executive Leather Swivel Chair
  function createExecutiveChair(scene: THREE.Scene, x: number, y: number, z: number, rotY: number, colorHex: number) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x, y, z);
    chairGroup.rotation.y = rotY;

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });

    // 1. 5-Star Caster Chrome Base
    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16), chromeMat);
    baseCyl.position.y = 0.06;
    chairGroup.add(baseCyl);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.04), chromeMat);
      leg.position.set(Math.cos(angle) * 0.19, 0.05, Math.sin(angle) * 0.19);
      leg.rotation.y = -angle;
      chairGroup.add(leg);
    }

    // 2. Gas Lift Hydraulic Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 16), chromeMat);
    stem.position.y = 0.24;
    chairGroup.add(stem);

    // 3. Thick Ergonomic Leather Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.58), leatherMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    seat.receiveShadow = true;
    chairGroup.add(seat);

    // 4. Executive High-Back Rest with Integrated Headrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.09), leatherMat);
    backrest.position.set(0, 0.85, 0.28);
    backrest.rotation.x = -0.06;
    backrest.castShadow = true;
    chairGroup.add(backrest);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.08), leatherMat);
    headrest.position.set(0, 1.25, 0.26);
    chairGroup.add(headrest);

    // 5. Chrome Padded Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.34), chromeMat);
    armL.position.set(-0.33, 0.65, 0.06);
    chairGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.34), chromeMat);
    armR.position.set(0.33, 0.65, 0.06);
    chairGroup.add(armR);

    scene.add(chairGroup);
    return chairGroup;
  }

  // Helper: Create Modern Bar Stool
  function createBarStool(scene: THREE.Scene, x: number, z: number, colorHex: number) {
    const stool = new THREE.Group();
    stool.position.set(x, 0, z);

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const seatMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24), chromeMat);
    base.position.y = 0.01;
    stool.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 16), chromeMat);
    stem.position.y = 0.33;
    stool.add(stem);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 8, 24), chromeMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    stool.add(ring);

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 24), seatMat);
    seat.position.y = 0.68;
    stool.add(seat);

    scene.add(stool);
  }

  // Helper: Create Realistic Indoor Office Plant in Ceramic Pot
  function createOfficePlant(scene: THREE.Scene, x: number, y: number, z: number) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, y, z);

    // White Minimalist Ceramic Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.26, 0.7, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    pot.position.y = 0.35;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 })
    );
    soil.position.y = 0.69;
    plantGroup.add(soil);

    // Lush Broad Leaves (Monstera style)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7;
      const leafStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8), leafMat);
      leafStem.position.set(Math.cos(angle) * 0.1, 0.9, Math.sin(angle) * 0.1);
      leafStem.rotation.z = Math.cos(angle) * 0.45;
      leafStem.rotation.x = Math.sin(angle) * 0.45;
      plantGroup.add(leafStem);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), leafMat);
      leaf.scale.set(1.4, 0.1, 1.0);
      leaf.position.set(Math.cos(angle) * 0.45, 1.35, Math.sin(angle) * 0.45);
      leaf.rotation.y = angle;
      plantGroup.add(leaf);
    }

    scene.add(plantGroup);
  }

  // Reset Camera View
  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(16, 15, 16);
    controlsRef.current.target.set(0, 0.5, 0);
    controlsRef.current.update();
  };

  // Chat Submission & Multi-Agent Delegation Pipeline
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgent) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'Anda (Owner via WhatsApp)', text: chatInput, time };
    const prompt = chatInput;
    setChatInput('');
    setChatLogs((prev) => [...prev, userMsg]);

    // Set agents busy during delegation
    const adminRef = actorsMapRef.current.get('admin');
    const eksekutorRef = actorsMapRef.current.get('eksekutor');
    const qcRef = actorsMapRef.current.get('qc');

    if (adminRef) adminRef.isBusy = true;

    if (selectedAgent.id === 'admin') {
      // 1. SANG ADMIN acknowledges & dispatches to SANG EKSEKUTOR
      setTimeout(() => {
        const adminReply = {
          sender: '👑 SANG ADMIN (WA Gateway)',
          text: `Halo Bos! Pesan WhatsApp diterima: "${prompt}". Saya analisis instruksi ini dan langsung saya delegasikan ke SANG EKSEKUTOR.`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatLogs((prev) => [...prev, adminReply]);
        if (adminRef) adminRef.isBusy = false;
        if (eksekutorRef) eksekutorRef.isBusy = true;
      }, 700);

      // 2. SANG EKSEKUTOR executes the task
      setTimeout(() => {
        const eksekutorReply = {
          sender: '⚡ SANG EKSEKUTOR',
          text: `Menerima tugas dari Sang Admin! Sedang mengeksekusi: "${prompt}"... Selesai dikerjakan! Berkas saya serahkan ke SANG QC untuk verifikasi kualitas.`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatLogs((prev) => [...prev, eksekutorReply]);
        if (eksekutorRef) eksekutorRef.isBusy = false;
        if (qcRef) qcRef.isBusy = true;
      }, 2300);

      // 3. SANG QC audits & validates
      setTimeout(() => {
        const qcReply = {
          sender: '🔍 SANG QC',
          text: `Menerima berkas hasil pengerjaan dari Sang Eksekutor. Melakukan verifikasi ketelitian & uji kelayakan... [STATUS: PASS / LOLOS QC]. Siap dilaporkan ke Owner.`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatLogs((prev) => [...prev, qcReply]);
        if (qcRef) qcRef.isBusy = false;
      }, 4000);

      // 4. SANG ADMIN sends final report to Owner's WhatsApp
      setTimeout(() => {
        const finalReport = {
          sender: '👑 SANG ADMIN (WA Gateway)',
          text: `✅ [LAPORAN KE WA OWNER]: Bos, tugas "${prompt}" telah BERHASIL dieksekusi dan lolos verifikasi SANG QC tanpa catatan revisi. Data sinkron ke Supabase!`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatLogs((prev) => [...prev, finalReport]);
      }, 5600);
    } else {
      setTimeout(() => {
        const botReply = {
          sender: selectedAgent.name,
          text: `[${selectedAgent.emoji} ${selectedAgent.name}]: Siap! Instruksi "${prompt}" sedang diproses dalam pipeline multi-agent.`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatLogs((prev) => [...prev, botReply]);
      }, 800);
    }
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
              <span className="font-extrabold text-white text-sm tracking-wide">OFFICE TO THE TOP</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                ● LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Autonomous Multi-Agent HQ</span>
              <span>&bull;</span>
              <span className="text-indigo-400 font-mono">Trio Inti</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FLOATING TOP-RIGHT CONTROL TOOLS ─── */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2.5 pointer-events-auto">
        
        {/* Mission Board Shortcut */}
        <button
          onClick={() => setShowMissionBoard(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800/90 backdrop-blur-xl border border-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-xl hover:border-slate-700"
          title="Buka Papan Tugas Seluruh Agen"
        >
          <ClipboardList className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Mission Board</span>
        </button>

        {/* Theme / Visual Style Dropdown */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="p-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800/90 backdrop-blur-xl border border-slate-800/80 text-slate-300 hover:text-white transition-all shadow-xl hover:border-slate-700 flex items-center gap-1.5"
            title="Ganti Tema Tampilan Kantor"
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span className="text-xs capitalize font-medium hidden sm:inline">{gaya}</span>
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl z-30 space-y-1">
              {(['asli', 'hologram', 'clay', 'diorama'] as GayaId[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setGaya(mode);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                    gaya === mode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ambient Synth BGM */}
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-2xl backdrop-blur-xl border transition-all shadow-xl ${
            audioPlaying
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : 'bg-slate-900/85 hover:bg-slate-800/90 text-slate-300 hover:text-white border-slate-800/80'
          }`}
          title="Musik Lo-fi Synth Ambience"
        >
          {audioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset Camera View */}
        <button
          onClick={resetCamera}
          className="p-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800/90 backdrop-blur-xl border border-slate-800/80 text-slate-300 hover:text-white transition-all shadow-xl hover:border-slate-700"
          title="Kembalikan Posisi Kamera Isometrik"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

      </div>

      {/* ─── FLOATING 3D HTML BUBBLES DIRECTLY OVER CHARACTERS ─── */}
      {bubbles.map((b) => {
        if (!b.visible) return null;
        return (
          <div
            key={b.id}
            onClick={() => {
              const actor = actors.find((a) => a.id === b.id);
              if (actor) setSelectedAgent(actor);
            }}
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-10 pointer-events-auto cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-md border border-slate-700/80 hover:border-indigo-500 text-white text-[11px] shadow-2xl transition-all scale-95 group-hover:scale-105">
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

              <div className="h-36 overflow-y-auto space-y-2 p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-[11px]">
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
                  <h3 className="font-bold text-white text-base">Mission Board &bull; Trio Inti Kantor AI</h3>
                  <p className="text-xs text-slate-400">Rekapitulasi aktivitas dan tugas SANG ADMIN, SANG EKSEKUTOR, dan SANG QC</p>
                </div>
              </div>
              <button
                onClick={() => setShowMissionBoard(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[440px] overflow-y-auto p-1">
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
