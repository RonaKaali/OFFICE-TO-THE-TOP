'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
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
  MessageSquare
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
  color: string;
  deskPos: [number, number, number];
  rotationY: number;
  triggers: string[];
  currentTask: string;
  ringkasan: string;
  urgent: string[];
  waiting: string[];
}

const RUANGAN_LIST: RoomZone[] = [
  { key: 'produk', label: 'Divisi Produk & Inventaris', x0: -7.5, x1: -2.5, floorColor: 0x1e2d3d, rugColor: 0x10b981 },
  { key: 'pesanan', label: 'Ruang Rapat & Mission Board', x0: -2.5, x1: 2.5, floorColor: 0x172233, rugColor: 0x3b82f6 },
  { key: 'konten', label: 'Divisi Konten, HR & Support', x0: 2.5, x1: 7.5, floorColor: 0x241d33, rugColor: 0x8b5cf6 },
];

const INITIAL_ACTORS: AgentActor[] = [
  { id: 'produk', name: 'Mbak Rina', role: 'Katalog & Stok', room: 'Divisi Produk', emoji: '📦', color: '#10b981', deskPos: [-5.2, 0, -2], rotationY: 0, triggers: ['produk', 'katalog', 'harga'], currentTask: 'Audit stok beras 5kg', ringkasan: initialLaporan.produk.ringkasan, urgent: initialLaporan.produk.mendesak, waiting: initialLaporan.produk.menunggu },
  { id: 'antrian', name: 'Doni', role: 'Nomor Antrian', room: 'Divisi Produk', emoji: '🎫', color: '#f59e0b', deskPos: [-3.8, 0, 1.2], rotationY: Math.PI, triggers: ['antrian', 'nomor'], currentTask: 'Panggil antrian #A-14', ringkasan: initialLaporan.antrian.ringkasan, urgent: initialLaporan.antrian.mendesak, waiting: initialLaporan.antrian.menunggu },
  { id: 'pesanan', name: 'Mas Budi', role: 'Pesanan & Order', room: 'Divisi Transaksi', emoji: '🛒', color: '#3b82f6', deskPos: [-1.2, 0, -2], rotationY: 0, triggers: ['pesan', 'order', 'beli'], currentTask: 'Proses invoice #WA-881', ringkasan: initialLaporan.pesanan.ringkasan, urgent: initialLaporan.pesanan.mendesak, waiting: initialLaporan.pesanan.menunggu },
  { id: 'keuangan', name: 'Pak Hendra', role: 'Keuangan & Kas', room: 'Divisi Transaksi', emoji: '💰', color: '#ef4444', deskPos: [1.2, 0, 1.2], rotationY: Math.PI, triggers: ['omset', 'kas', 'laba'], currentTask: 'Rekap pembukuan kasir', ringkasan: initialLaporan.keuangan.ringkasan, urgent: initialLaporan.keuangan.mendesak, waiting: initialLaporan.keuangan.menunggu },
  { id: 'absensi', name: 'Siti', role: 'HR & Absensi', room: 'Divisi Operasional', emoji: '📸', color: '#8b5cf6', deskPos: [3.8, 0, -2], rotationY: 0, triggers: ['absen', 'hadir'], currentTask: 'Verifikasi selfie shift pagi', ringkasan: initialLaporan.absensi.ringkasan, urgent: initialLaporan.absensi.mendesak, waiting: initialLaporan.absensi.menunggu },
  { id: 'konten', name: 'Jessica', role: 'Konten & Media', room: 'Divisi Kreatif', emoji: '✍️', color: '#ec4899', deskPos: [5.2, 0, 1.2], rotationY: Math.PI, triggers: ['caption', 'ide', 'post'], currentTask: 'Draft konten reels promo', ringkasan: initialLaporan.konten.ringkasan, urgent: initialLaporan.konten.mendesak, waiting: initialLaporan.konten.menunggu },
  { id: 'support', name: 'Arief', role: 'CS & FAQ WhatsApp', room: 'Divisi Support', emoji: '🤝', color: '#06b6d4', deskPos: [5.8, 0, -2], rotationY: 0, triggers: ['faq', 'bantuan'], currentTask: 'Standby pesan WhatsApp 24/7', ringkasan: initialLaporan.support.ringkasan, urgent: initialLaporan.support.mendesak, waiting: initialLaporan.support.menunggu },
  { id: 'echo', name: 'Echo Bot', role: 'Server Gateway', room: 'Divisi IT', emoji: '🦜', color: '#6b7280', deskPos: [0, 0, -2], rotationY: 0, triggers: ['echo', 'ping'], currentTask: 'Status API server normal', ringkasan: initialLaporan.echo.ringkasan, urgent: initialLaporan.echo.mendesak, waiting: initialLaporan.echo.menunggu },
];

const SPOTS = {
  kopi: new THREE.Vector3(-5.2, 0, 3.2),
  papan: new THREE.Vector3(0, 0, -3.2),
  sofa: new THREE.Vector3(5.2, 0, 3.2),
};

export default function VirtualOffice() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [actors] = useState<AgentActor[]>(INITIAL_ACTORS);
  const [selectedAgent, setSelectedAgent] = useState<AgentActor | null>(null);
  const [gaya, setGaya] = useState<GayaId>('asli');
  const [isTimelapse, setIsTimelapse] = useState(false);
  const [clockTime, setClockTime] = useState('11:00');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMissionBoard, setShowMissionBoard] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  // Floating Labels state
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

  // Chat simulation state
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Kantor AI 3D Aktif. Seluruh agen beroperasi secara otonom.', time: '11:00' },
  ]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const deskMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Mixers and Actors Map
  const actorObjectsRef = useRef<Map<string, {
    mixer: THREE.AnimationMixer;
    actions: Map<string, THREE.AnimationAction>;
    currentActionName: string;
    model: THREE.Group;
    seatPos: THREE.Vector3;
    currentPos: THREE.Vector3;
    isWalking: boolean;
    deskMesh: THREE.Mesh;
  }>>(new Map());

  // Web Audio Synthesizer
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
        console.error('Audio failed', e);
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
    const frustumSize = 13.5;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    cameraRef.current = camera;
    camera.position.set(14, 14, 14);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with antialiasing and shadows
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
    controls.target.set(0, 0.4, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minZoom = 0.5;
    controls.maxZoom = 2.5;

    // 5. Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 2.3);
    dirLight.position.set(14, 20, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.left = -11;
    dirLight.shadow.camera.right = 11;
    dirLight.shadow.camera.top = 11;
    dirLight.shadow.camera.bottom = -11;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 6. Build Architectural Multi-Room Office
    buildRooms(scene, gaya);

    // 7. Load GLB Characters with GLTFLoader & AnimationMixer
    const loader = new GLTFLoader();
    setIsLoading(true);

    loader.load(
      '/models/robot.glb',
      (gltf) => {
        setIsLoading(false);
        const originalScene = gltf.scene;
        const animations = gltf.animations;

        INITIAL_ACTORS.forEach((actor) => {
          const clone = SkeletonUtils.clone(originalScene) as THREE.Group;
          clone.scale.set(0.44, 0.44, 0.44);
          clone.position.set(actor.deskPos[0], actor.deskPos[1], actor.deskPos[2]);
          clone.rotation.y = actor.rotationY;

          clone.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { agentId: actor.id };
            }
          });

          scene.add(clone);

          const mixer = new THREE.AnimationMixer(clone);
          const actionsMap = new Map<string, THREE.AnimationAction>();

          animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actionsMap.set(clip.name, action);
          });

          const initialAction = actionsMap.get('Sitting') || actionsMap.get('Idle');
          if (initialAction) initialAction.play();

          const desk = deskMeshesRef.current.get(actor.id)!;

          actorObjectsRef.current.set(actor.id, {
            mixer,
            actions: actionsMap,
            currentActionName: 'Sitting',
            model: clone,
            seatPos: new THREE.Vector3(actor.deskPos[0], actor.deskPos[1], actor.deskPos[2]),
            currentPos: new THREE.Vector3(actor.deskPos[0], actor.deskPos[1], actor.deskPos[2]),
            isWalking: false,
            deskMesh: desk,
          });
        });
      },
      undefined,
      (err) => {
        console.error('Failed to load GLB:', err);
        setIsLoading(false);
      }
    );

    // 8. Raycasting Mouse Click to open character popup
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
              triggerActorAnimation(target.id, 'Wave');
              return;
            }
          }
          currentObj = currentObj.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Autonomous Agents Pathfinding & Render Loop
    let animId: number;
    let clock = new THREE.Clock();
    let totalTime = 0;

    const smoothStep = (x: number) => x * x * (3 - 2 * x);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      totalTime += delta;

      // Update Mixers and Autonomous Walking
      actorObjectsRef.current.forEach((actorData, agentId) => {
        actorData.mixer.update(delta);

        const idx = INITIAL_ACTORS.findIndex((a) => a.id === agentId);
        const shifted = totalTime * (isTimelapse ? 2.5 : 1) + idx * 5.3;
        const cycle = ((shifted % 20) + 20) % 20;

        let targetSpot = SPOTS.kopi;
        if (idx % 3 === 1) targetSpot = SPOTS.papan;
        if (idx % 3 === 2) targetSpot = SPOTS.sofa;

        const seat = actorData.seatPos;

        if (cycle < 3) {
          // Walking to spot
          const k = smoothStep(cycle / 3);
          actorData.currentPos.lerpVectors(seat, targetSpot, k);
          actorData.model.position.copy(actorData.currentPos);
          actorData.model.lookAt(targetSpot.x, 0, targetSpot.z);

          if (!actorData.isWalking) {
            actorData.isWalking = true;
            crossFade(actorData, 'Walking');
          }
        } else if (cycle < 10) {
          // Relaxing at spot
          actorData.model.position.copy(targetSpot);

          if (actorData.isWalking) {
            actorData.isWalking = false;
            const spotAnim = idx % 3 === 2 ? 'Sitting' : idx % 3 === 1 ? 'Idle' : 'Wave';
            crossFade(actorData, spotAnim);
          }
        } else if (cycle < 13) {
          // Walking back to desk
          const k = smoothStep((cycle - 10) / 3);
          actorData.currentPos.lerpVectors(targetSpot, seat, k);
          actorData.model.position.copy(actorData.currentPos);
          actorData.model.lookAt(seat.x, 0, seat.z);

          if (!actorData.isWalking) {
            actorData.isWalking = true;
            crossFade(actorData, 'Walking');
          }
        } else {
          // At desk working
          actorData.model.position.copy(seat);
          const defaultRot = INITIAL_ACTORS[idx]?.rotationY || 0;
          actorData.model.rotation.set(0, defaultRot, 0);

          if (actorData.isWalking) {
            actorData.isWalking = false;
            crossFade(actorData, 'Sitting');
          }
        }

        // Urgent alert pulsing red desk
        const actorMeta = INITIAL_ACTORS[idx];
        if (actorMeta && actorMeta.urgent.length > 0 && actorData.deskMesh) {
          const pulse = (Math.sin(totalTime * 6) + 1) * 0.5;
          (actorData.deskMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
          (actorData.deskMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.7;
        }
      });

      // Update Floating HTML Bubble Positions
      const curW = container.clientWidth || window.innerWidth;
      const curH = container.clientHeight || window.innerHeight;
      const newBubbles: typeof bubbles = [];

      actorObjectsRef.current.forEach((actorData, agentId) => {
        const actorMeta = INITIAL_ACTORS.find((a) => a.id === agentId);
        if (!actorMeta) return;

        const headPos = actorData.currentPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        headPos.project(camera);

        const x = ((headPos.x + 1) * curW) / 2;
        const y = ((-headPos.y + 1) * curH) / 2;

        let statusText = actorMeta.ringkasan;
        if (actorData.isWalking) {
          statusText = '🚶 Berpindah ruangan...';
        } else if (actorData.currentPos.distanceTo(SPOTS.kopi) < 0.5) {
          statusText = '☕ Ngopi dulu di Pantry';
        } else if (actorData.currentPos.distanceTo(SPOTS.papan) < 0.5) {
          statusText = '📋 Cek Mission Board';
        } else if (actorData.currentPos.distanceTo(SPOTS.sofa) < 0.5) {
          statusText = '🛋️ Diskusi di Sofa';
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

      // Timelapse Clock Simulation
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

    // 10. Resize
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
      actorObjectsRef.current.clear();
      deskMeshesRef.current.clear();
    };
  }, [gaya, isTimelapse]);

  // Build Office Architecture
  function buildRooms(scene: THREE.Scene, theme: GayaId) {
    deskMeshesRef.current.clear();

    let wallColor = 0x334155;
    let floorBaseColor = 0x1e293b;
    let deskColor = 0x273549;

    if (theme === 'hologram') {
      scene.background = new THREE.Color(0x040814);
      wallColor = 0x0284c7;
      floorBaseColor = 0x071126;
      deskColor = 0x0c2140;
    } else if (theme === 'clay') {
      scene.background = new THREE.Color(0x2d2b38);
      wallColor = 0xb4a49c;
      floorBaseColor = 0xdfd3c3;
      deskColor = 0xc7b198;
    } else if (theme === 'diorama') {
      scene.background = new THREE.Color(0x11161d);
      wallColor = 0x4a3b32;
      floorBaseColor = 0x221a15;
      deskColor = 0x5a463a;
    } else {
      scene.background = new THREE.Color(0x0b1120);
    }

    // 1. Multi-Rooms Floor Layout (3 Ruangan Berbeda)
    RUANGAN_LIST.forEach((room) => {
      const roomWidth = room.x1 - room.x0;
      const roomGeo = new THREE.PlaneGeometry(roomWidth, 9);
      const roomMat = new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x081b33 : theme === 'clay' ? room.floorColor + 0x222222 : room.floorColor,
        roughness: theme === 'clay' ? 0.9 : 0.6,
        metalness: theme === 'hologram' ? 0.5 : 0.1,
      });
      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.rotation.x = -Math.PI / 2;
      roomMesh.position.set((room.x0 + room.x1) / 2, 0.005, -0.4);
      roomMesh.receiveShadow = true;
      scene.add(roomMesh);

      // Carpet for Room Zone
      const rugGeo = new THREE.PlaneGeometry(roomWidth - 0.6, 7.8);
      const rugMat = new THREE.MeshStandardMaterial({
        color: theme === 'hologram' ? 0x0369a1 : room.rugColor,
        roughness: 0.8,
        transparent: true,
        opacity: theme === 'hologram' ? 0.4 : 0.85,
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set((room.x0 + room.x1) / 2, 0.015, -0.4);
      rug.receiveShadow = true;
      scene.add(rug);
    });

    // 2. Neon Grid for Hologram Mode
    if (theme === 'hologram') {
      const grid = new THREE.GridHelper(16, 32, 0x38bdf8, 0x0284c7);
      grid.position.y = 0.02;
      scene.add(grid);
    }

    // 3. Back Walls
    const backWallGeo = new THREE.BoxGeometry(16, 3.2, 0.25);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.5,
      transparent: theme === 'hologram',
      opacity: theme === 'hologram' ? 0.4 : 1,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 1.6, -4.9);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 4. Mission Board 3D di Dinding Tengah
    const boardGeo = new THREE.BoxGeometry(4.2, 1.8, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({
      color: theme === 'hologram' ? 0x0284c7 : 0xf8fafc,
      roughness: 0.3,
      emissive: theme === 'hologram' ? 0x0284c7 : 0x000000,
      emissiveIntensity: 0.3,
    });
    const missionBoard = new THREE.Mesh(boardGeo, boardMat);
    missionBoard.position.set(0, 1.8, -4.76);
    missionBoard.userData = { isBoard: true };
    scene.add(missionBoard);

    // Sticky Notes on Board
    const noteColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 8; i++) {
      const noteGeo = new THREE.PlaneGeometry(0.38, 0.38);
      const noteMat = new THREE.MeshBasicMaterial({ color: noteColors[i % noteColors.length] });
      const note = new THREE.Mesh(noteGeo, noteMat);
      note.position.set(-1.5 + (i % 4) * 1.0, 2.1 - Math.floor(i / 4) * 0.7, -4.70);
      scene.add(note);
    }

    // 5. Lounge & Pantry Furniture (Front Area)
    // Coffee Counter
    const counterGeo = new THREE.BoxGeometry(2.6, 0.85, 0.95);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(-5.2, 0.425, 3.2);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);

    // Coffee Machine
    const coffeeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8 })
    );
    coffeeMachine.position.set(-5.2, 1.15, 3.2);
    coffeeMachine.castShadow = true;
    scene.add(coffeeMachine);

    // Sofa Santai
    const sofa = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.7, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 })
    );
    sofa.position.set(5.2, 0.35, 3.2);
    sofa.castShadow = true;
    sofa.receiveShadow = true;
    scene.add(sofa);

    // 6. Desks & Laptops for Each Agent
    INITIAL_ACTORS.forEach((actor) => {
      const [dx, dy, dz] = actor.deskPos;

      const deskGeo = new THREE.BoxGeometry(1.5, 0.74, 0.85);
      const deskMat = new THREE.MeshStandardMaterial({ color: deskColor, roughness: 0.5 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(dx, 0.37, dz + (actor.rotationY === 0 ? 0.7 : -0.7));
      desk.castShadow = true;
      desk.receiveShadow = true;
      desk.userData = { agentId: actor.id };
      scene.add(desk);
      deskMeshesRef.current.set(actor.id, desk);

      // Laptop Base
      const laptopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.3), laptopMat);
      laptop.position.set(dx, 0.75, desk.position.z);
      scene.add(laptop);

      // Glowing Screen
      const screenMat = new THREE.MeshBasicMaterial({ color: actor.color });
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.015), screenMat);
      screen.position.set(dx, 0.87, desk.position.z + (actor.rotationY === 0 ? -0.1 : 0.1));
      screen.rotation.x = actor.rotationY === 0 ? 0.2 : -0.2;
      scene.add(screen);

      // Identification Ring under Chair
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.38, 0.48, 32),
        new THREE.MeshBasicMaterial({ color: actor.color, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(dx, 0.025, dz);
      scene.add(ring);
    });
  }

  // CrossFade animation transition
  function crossFade(actorData: any, targetAnim: string) {
    const currentAction = actorData.actions.get(actorData.currentActionName);
    const newAction = actorData.actions.get(targetAnim);
    if (!newAction || targetAnim === actorData.currentActionName) return;

    newAction.reset();
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);

    if (currentAction) {
      currentAction.crossFadeTo(newAction, 0.3, true);
    }
    newAction.play();
    actorData.currentActionName = targetAnim;
  }

  const triggerActorAnimation = (agentId: string, animName: string) => {
    const actorData = actorObjectsRef.current.get(agentId);
    if (!actorData) return;
    crossFade(actorData, animName);
  };

  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(14, 14, 14);
    controlsRef.current.target.set(0, 0.4, 0);
    controlsRef.current.update();
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgent) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'Anda (Owner)', text: chatInput, time };

    triggerActorAnimation(selectedAgent.id, 'ThumbsUp');

    setTimeout(() => {
      const botReply = {
        sender: selectedAgent.name,
        text: `🤖 [${selectedAgent.emoji} ${selectedAgent.name}]: Siap! Perintah "${chatInput}" sedang dijalankan.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatLogs((prev) => [...prev, userMsg, botReply]);
    }, 1000);

    setChatLogs((prev) => [...prev, userMsg]);
    setChatInput('');
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-950 font-sans select-none">
      
      {/* ─── 3D WEBGL FULL-SCREEN CANVAS ─── */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center space-y-3">
          <Bot className="w-12 h-12 text-indigo-400 animate-bounce" />
          <div className="text-base font-bold text-white tracking-wide">Memuat Kantor AI 3D Diorama...</div>
          <span className="text-xs text-slate-400 font-mono">Three.js &bull; Orthographic Isometric</span>
        </div>
      )}

      {/* ─── FLOATING TOP-LEFT TITLE & STATUS WIDGET ─── */}
      <div className="absolute top-5 left-6 z-20 flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-2xl">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white tracking-tight">
                OFFICE TO THE TOP
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Autonomous AI Workforce &bull; {actors.length} Agen Mandiri
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
          className="px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all hover:border-slate-700"
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
              : 'bg-slate-900/80 backdrop-blur-xl text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="Simulasi 1 Hari Kerja Cepat (30 Detik)"
        >
          {isTimelapse ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isTimelapse ? 'Pause' : 'Timelapse'}</span>
        </button>

        {/* Theme Selector (Pilihan Gaya 3D) */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:border-slate-700 capitalize"
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

        {/* Audio Ambient Synthesizer */}
        <button
          onClick={toggleAudio}
          className={`p-2.5 rounded-2xl text-xs border shadow-xl transition-all ${
            audioPlaying
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900/80 backdrop-blur-xl text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title="Lo-Fi Ambient Music"
        >
          {audioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset Camera */}
        <button
          onClick={resetCamera}
          className="p-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl text-slate-400 hover:text-white border border-slate-800 shadow-xl hover:border-slate-700"
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
              if (actor) {
                setSelectedAgent(actor);
                triggerActorAnimation(actor.id, 'Wave');
              }
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
          <span>🔄 <em>Drag untuk putar 3D</em></span>
          <span>&bull;</span>
          <span>🔍 <em>Scroll untuk zoom</em></span>
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
                  style={{ backgroundColor: selectedAgent.color }}
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

            {/* 3D Action Triggers */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Gerakan Animasi Karakter 3D:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'Sitting', label: '🪑 Duduk' },
                  { key: 'Wave', label: '👋 Sapa' },
                  { key: 'ThumbsUp', label: '👍 Mantap' },
                  { key: 'Dance', label: '🕺 Joget' },
                  { key: 'Jump', label: '🦘 Lompat' },
                  { key: 'Idle', label: '💤 Standby' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => triggerActorAnimation(selectedAgent.id, key)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-800/60 text-xs font-medium text-slate-300 hover:text-white transition-all text-center"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat WhatsApp Simulator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Interaksi WhatsApp Simulator:</span>
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
                    triggerActorAnimation(actor.id, 'Wave');
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
