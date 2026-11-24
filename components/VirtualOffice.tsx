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
  Sun, 
  Moon, 
  Coffee, 
  Send, 
  Bot, 
  Sparkles,
  Play,
  RotateCcw,
  Eye
} from 'lucide-react';

export interface AgentCharacter {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  defaultAnim: string;
  currentAnim: string;
  deskPos: [number, number, number]; // x, y, z
  rotationY: number;
  triggers: string[];
  currentTask?: string;
  modelType: 'robot' | 'human';
}

const ROBOT_ANIMATIONS = [
  'Dance', 'Death', 'Idle', 'Jump', 'No', 'Punch', 
  'Running', 'Sitting', 'Standing', 'ThumbsUp', 
  'Walking', 'WalkJump', 'Wave', 'Yes'
];

const INITIAL_AGENTS: AgentCharacter[] = [
  { id: 'produk', name: 'Mbak Rina (Produk)', role: 'Katalog & Stok UMKM', emoji: '📦', color: '#10b981', defaultAnim: 'Sitting', currentAnim: 'Sitting', deskPos: [-4, 0, -3], rotationY: 0, triggers: ['produk', 'katalog', 'harga'], currentTask: 'Audit stok beras 5kg', modelType: 'robot' },
  { id: 'pesanan', name: 'Mas Budi (Pesanan)', role: 'Order WA & Checkout', emoji: '🛒', color: '#3b82f6', defaultAnim: 'ThumbsUp', currentAnim: 'ThumbsUp', deskPos: [-1.5, 0, -3], rotationY: 0, triggers: ['pesan', 'order', 'beli'], currentTask: 'Invoice pesanan #WA-881', modelType: 'robot' },
  { id: 'absensi', name: 'Siti (HR & Absensi)', role: 'Selfie & Shift Karyawan', emoji: '📸', color: '#8b5cf6', defaultAnim: 'Sitting', currentAnim: 'Sitting', deskPos: [1.5, 0, -3], rotationY: 0, triggers: ['absen', 'hadir'], currentTask: 'Verifikasi selfie masuk', modelType: 'robot' },
  { id: 'antrian', name: 'Doni (Antrian)', role: 'Nomor Tiket & Antrian Toko', emoji: '🎫', color: '#f59e0b', defaultAnim: 'Wave', currentAnim: 'Wave', deskPos: [4, 0, -3], rotationY: 0, triggers: ['antrian', 'panggil'], currentTask: 'Panggil antrian #A-14', modelType: 'robot' },
  { id: 'keuangan', name: 'Pak Hendra (Keuangan)', role: 'Rekap Kas & Omset Harian', emoji: '💰', color: '#ef4444', defaultAnim: 'Sitting', currentAnim: 'Sitting', deskPos: [-4, 0, 1.5], rotationY: Math.PI, triggers: ['omset', 'kas', 'laba'], currentTask: 'Rekap omset harian UMKM', modelType: 'robot' },
  { id: 'konten', name: 'Jessica (Konten)', role: 'Caption IG & Ide TikTok', emoji: '✍️', color: '#ec4899', defaultAnim: 'Dance', currentAnim: 'Dance', deskPos: [-1.5, 0, 1.5], rotationY: Math.PI, triggers: ['caption', 'ide', 'post'], currentTask: 'Bikin ide reels promo', modelType: 'robot' },
  { id: 'support', name: 'Arief (CS Support)', role: 'Auto-balas FAQ 24/7', emoji: '🤝', color: '#06b6d4', defaultAnim: 'Sitting', currentAnim: 'Sitting', deskPos: [1.5, 0, 1.5], rotationY: Math.PI, triggers: ['bantuan', 'faq', 'tanya'], currentTask: 'Standby pesan WhatsApp', modelType: 'robot' },
  { id: 'echo', name: 'Echo Bot (QA)', role: 'System Health & Ping', emoji: '🦜', color: '#6b7280', defaultAnim: 'Yes', currentAnim: 'Yes', deskPos: [4, 0, 1.5], rotationY: Math.PI, triggers: ['echo', 'ping'], currentTask: 'Gateway health: OK', modelType: 'robot' },
];

export default function VirtualOffice() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [agents, setAgents] = useState<AgentCharacter[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentCharacter | null>(INITIAL_AGENTS[0]);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'evening' | 'night'>('day');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>(ROBOT_ANIMATIONS);
  
  // Interactive Chat State
  const [simulatedChat, setSimulatedChat] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Kantor Virtual 3D OFFICE TO THE TOP aktif.', time: '12:00' },
    { sender: 'Mbak Rina (Produk)', text: 'Katalog siap disinkronkan ke WhatsApp.', time: '12:01' },
  ]);

  // Audio Context Ref for synthetic Web Audio lofi music (72 BPM)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Mixers map: agentId -> { mixer, actions: Record<string, THREE.AnimationAction>, currentAction }
  const agentMixersRef = useRef<Map<string, {
    mixer: THREE.AnimationMixer;
    actions: Map<string, THREE.AnimationAction>;
    currentActionName: string;
    modelGroup: THREE.Group;
  }>>(new Map());

  // Toggle Lo-Fi Ambient Synthesizer
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

  // Update Three.js lighting based on TimeOfDay
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;

    if (timeOfDay === 'day') {
      sceneRef.current.background = new THREE.Color(0x0f172a);
      sceneRef.current.fog = new THREE.FogExp2(0x0f172a, 0.025);
      hemiLightRef.current.color.setHex(0xffffff);
      hemiLightRef.current.groundColor.setHex(0x444444);
      hemiLightRef.current.intensity = 1.6;
      dirLightRef.current.color.setHex(0xfff5e6);
      dirLightRef.current.intensity = 2.2;
    } else if (timeOfDay === 'evening') {
      sceneRef.current.background = new THREE.Color(0x1c1326);
      sceneRef.current.fog = new THREE.FogExp2(0x1c1326, 0.025);
      hemiLightRef.current.color.setHex(0xfb923c);
      hemiLightRef.current.groundColor.setHex(0x27173a);
      hemiLightRef.current.intensity = 1.3;
      dirLightRef.current.color.setHex(0xff7733);
      dirLightRef.current.intensity = 2.0;
    } else {
      sceneRef.current.background = new THREE.Color(0x070a13);
      sceneRef.current.fog = new THREE.FogExp2(0x070a13, 0.03);
      hemiLightRef.current.color.setHex(0x38bdf8);
      hemiLightRef.current.groundColor.setHex(0x0b0f19);
      hemiLightRef.current.intensity = 0.8;
      dirLightRef.current.color.setHex(0x60a5fa);
      dirLightRef.current.intensity = 1.2;
    }
  }, [timeOfDay]);

  // Main Three.js Scene Setup & Model Loading
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || 760;
    const height = 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 11, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.target.set(0, 1, -0.5);

    // 2. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(10, 18, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 3. Environment: Floor & Desks
    // Main Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(16, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Overlay
    const grid = new THREE.GridHelper(16, 16, 0x475569, 0x334155);
    grid.position.y = 0.01;
    scene.add(grid);

    // Lounge Area Mat
    const loungeMatGeo = new THREE.PlaneGeometry(5, 4);
    const loungeMatMesh = new THREE.Mesh(loungeMatGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
    loungeMatMesh.rotation.x = -Math.PI / 2;
    loungeMatMesh.position.set(-5, 0.02, 3.5);
    loungeMatMesh.receiveShadow = true;
    scene.add(loungeMatMesh);

    // Sofa
    const sofaGeo = new THREE.BoxGeometry(2.5, 0.6, 0.9);
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const sofa = new THREE.Mesh(sofaGeo, sofaMat);
    sofa.position.set(-5, 0.3, 4.2);
    sofa.castShadow = true;
    sofa.receiveShadow = true;
    scene.add(sofa);

    // Glass Meeting Room Wall & Table
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
    });
    const wallGeo = new THREE.BoxGeometry(0.1, 2.5, 4.5);
    const wall = new THREE.Mesh(wallGeo, glassMat);
    wall.position.set(4.5, 1.25, 3.5);
    scene.add(wall);

    const meetTableGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.75, 24);
    const meetTableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const meetTable = new THREE.Mesh(meetTableGeo, meetTableMat);
    meetTable.position.set(6, 0.375, 3.5);
    meetTable.castShadow = true;
    meetTable.receiveShadow = true;
    scene.add(meetTable);

    // Create 8 Desks + Laptops + Identification Plates
    INITIAL_AGENTS.forEach((agent) => {
      const [dx, dy, dz] = agent.deskPos;

      // Wooden Desk
      const deskGeo = new THREE.BoxGeometry(1.6, 0.75, 0.9);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x273549, roughness: 0.5 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(dx, 0.375, dz + (agent.rotationY === 0 ? 0.7 : -0.7));
      desk.castShadow = true;
      desk.receiveShadow = true;
      scene.add(desk);

      // Laptop base & screen
      const laptopMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7, roughness: 0.2 });
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.3), laptopMat);
      laptopBase.position.set(dx, 0.76, desk.position.z);
      scene.add(laptopBase);

      // Laptop glowing screen
      const screenMat = new THREE.MeshBasicMaterial({ color: agent.color });
      const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.02), screenMat);
      screenMesh.position.set(dx, 0.88, desk.position.z + (agent.rotationY === 0 ? -0.12 : 0.12));
      screenMesh.rotation.x = agent.rotationY === 0 ? 0.2 : -0.2;
      scene.add(screenMesh);

      // Color Identification Pedestal / Ring under Character
      const ringGeo = new THREE.RingGeometry(0.35, 0.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: agent.color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(dx, 0.02, dz);
      scene.add(ring);
    });

    // 4. Load GLB Model with GLTFLoader & AnimationMixer
    const loader = new GLTFLoader();
    setIsLoading(true);

    loader.load(
      '/models/robot.glb',
      (gltf) => {
        setIsLoading(false);
        const originalScene = gltf.scene;
        const animations = gltf.animations;

        // Extract and store available animation names
        const animNames = animations.map((a) => a.name);
        setAvailableAnimations(animNames);

        // Instantiate and place each character with its own AnimationMixer
        INITIAL_AGENTS.forEach((agent) => {
          // Clone the rigged model with SkeletonUtils
          const clone = SkeletonUtils.clone(originalScene) as THREE.Group;
          clone.scale.set(0.42, 0.42, 0.42);
          clone.position.set(agent.deskPos[0], agent.deskPos[1], agent.deskPos[2]);
          clone.rotation.y = agent.rotationY;

          // Enable shadows and add agent metadata
          clone.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { agentId: agent.id };
            }
          });

          scene.add(clone);

          // Create independent AnimationMixer for this agent
          const mixer = new THREE.AnimationMixer(clone);
          const actionsMap = new Map<string, THREE.AnimationAction>();

          animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actionsMap.set(clip.name, action);
          });

          // Play default animation
          const initialAnim = actionsMap.get(agent.defaultAnim) || actionsMap.get('Sitting') || actionsMap.get('Idle');
          if (initialAnim) {
            initialAnim.play();
          }

          agentMixersRef.current.set(agent.id, {
            mixer,
            actions: actionsMap,
            currentActionName: agent.defaultAnim,
            modelGroup: clone,
          });
        });
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
        setIsLoading(false);
      }
    );

    // 5. Raycasting for Mouse Selection
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
        while (currentObj && currentObj !== scene) {
          if (currentObj.userData && currentObj.userData.agentId) {
            const foundAgent = INITIAL_AGENTS.find((a) => a.id === currentObj.userData.agentId);
            if (foundAgent) {
              setSelectedAgent(foundAgent);
              // Trigger Wave or ThumbsUp on click
              triggerAgentAnimation(foundAgent.id, 'Wave');
              return;
            }
          }
          currentObj = currentObj.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 6. Animation Render Loop with delta time
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Update all agent AnimationMixers
      agentMixersRef.current.forEach(({ mixer }) => {
        mixer.update(delta);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 760;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container) container.innerHTML = '';
      agentMixersRef.current.clear();
    };
  }, []);

  // Function to smoothly switch animation using crossFadeTo
  const triggerAgentAnimation = (agentId: string, targetAnim: string) => {
    const entry = agentMixersRef.current.get(agentId);
    if (!entry) return;

    const { actions, currentActionName } = entry;
    const currentAction = actions.get(currentActionName);
    const newAction = actions.get(targetAnim);

    if (!newAction || targetAnim === currentActionName) return;

    newAction.reset();
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);

    if (currentAction) {
      currentAction.crossFadeTo(newAction, 0.35, true);
    }
    newAction.play();

    entry.currentActionName = targetAnim;

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, currentAnim: targetAnim } : a))
    );
  };

  // Focus Camera on Selected Character
  const focusOnAgent = (agent: AgentCharacter) => {
    setSelectedAgent(agent);
    if (!controlsRef.current || !cameraRef.current) return;
    const [x, y, z] = agent.deskPos;
    controlsRef.current.target.set(x, y + 0.5, z);
    cameraRef.current.position.set(x + 2, y + 2.5, z + 3);
    controlsRef.current.update();
  };

  // Reset Camera View
  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 1, -0.5);
    cameraRef.current.position.set(0, 11, 14);
    controlsRef.current.update();
  };

  // Handle Command in Console
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedChat.trim() || !selectedAgent) return;

    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'Anda (Owner)', text: simulatedChat, time };

    // Trigger positive animation on the agent (ThumbsUp / Yes / Dance)
    triggerAgentAnimation(selectedAgent.id, 'ThumbsUp');

    setTimeout(() => {
      const botReply = {
        sender: selectedAgent.name,
        text: `🤖 [${selectedAgent.emoji} ${selectedAgent.name}]: Perintah "${simulatedChat}" diterima & berhasil dieksekusi!`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatLog((logs) => [...logs, userMsg, botReply]);
    }, 1000);

    setChatLog((logs) => [...logs, userMsg]);
    setSimulatedChat('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Office Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Kantor AI 3D — GLB Model &amp; Animation Mixer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Three.js + GLTFLoader
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Karakter 3D bergerak di meja kerja dengan AnimationMixer nyata &bull; {availableAnimations.length} Animasi GLB terdeteksi
            </p>
          </div>
        </div>

        {/* Ambient & Time-of-Day Controls */}
        <div className="flex items-center gap-2">
          {/* Reset Camera View */}
          <button
            onClick={resetCamera}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
            title="Reset Posisi Kamera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>

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

      {/* Main 3D Viewport + Character Control Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0">
        
        {/* 3D WebGL Canvas Container (2 cols) */}
        <div className="xl:col-span-2 relative p-0 bg-slate-950 flex flex-col items-center justify-center border-b xl:border-b-0 xl:border-r border-slate-800 overflow-hidden">
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center space-y-3">
              <Bot className="w-10 h-10 text-indigo-400 animate-bounce" />
              <div className="text-sm font-semibold text-white">Memuat Model 3D GLB Karakter...</div>
              <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${loadingProgress || 50}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">GLTFLoader + AnimationMixer</span>
            </div>
          )}

          {/* Three.js Mount Point */}
          <div ref={mountRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />

          {/* Bottom Viewport Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400 pointer-events-none bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-1.5">
              <span>🖱️ <em>Drag untuk putar 3D &bull; Scroll untuk zoom &bull; Klik karakter untuk kontrol</em></span>
            </span>
            <span className="font-mono text-indigo-400 hidden sm:inline">Three.js WebGL &bull; Shadows &bull; 60 FPS</span>
          </div>
        </div>

        {/* Character Inspector & Animation Controller (1 col) */}
        <div className="p-5 flex flex-col justify-between bg-slate-900/60 space-y-4">
          
          {selectedAgent ? (
            <div className="space-y-4">
              {/* Selected Agent Header */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-start justify-between">
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
                <button
                  onClick={() => focusOnAgent(selectedAgent)}
                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs flex items-center gap-1"
                  title="Fokuskan Kamera 3D ke Karakter ini"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status & Current Task */}
              <div className="text-xs space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Animasi 3D Aktif:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedAgent.currentAnim}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tugas Sekarang:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[170px]">{selectedAgent.currentTask || 'Standby'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>WhatsApp Trigger:</span>
                  <span className="text-indigo-400 font-mono">/{selectedAgent.id}</span>
                </div>
              </div>

              {/* Real GLB Animation Mixer Triggers */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Trigger Animasi 3D (AnimationMixer):</span>
                  <span className="text-[10px] text-slate-500 font-mono">14 Clips</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {availableAnimations.map((animName) => {
                    const isCurrent = selectedAgent.currentAnim === animName;
                    return (
                      <button
                        key={animName}
                        onClick={() => triggerAgentAnimation(selectedAgent.id, animName)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all truncate flex items-center justify-center gap-1 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                        title={`Putar animasi ${animName}`}
                      >
                        {animName === 'Dance' && '🕺'}
                        {animName === 'Wave' && '👋'}
                        {animName === 'ThumbsUp' && '👍'}
                        {animName === 'Yes' && '✅'}
                        {animName === 'No' && '❌'}
                        {animName === 'Sitting' && '🪑'}
                        {animName === 'Idle' && '💤'}
                        {animName === 'Walking' && '🚶'}
                        {animName === 'Jump' && '🦘'}
                        {animName === 'Punch' && '🥊'}
                        <span>{animName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live WhatsApp Chat Log */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Aktivitas &amp; Interaksi WhatsApp:
                </label>
                <div className="h-32 overflow-y-auto space-y-2 p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px]">
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
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 shadow-lg shadow-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Bot className="w-12 h-12 text-slate-600" />
              <h4 className="font-bold text-slate-300 text-sm">Pilih Karakter di Ruangan 3D</h4>
              <p className="text-xs max-w-xs">
                Klik salah satu karakter 3D di ruangan kantor untuk memicu gerakan animasi, memantau tugas, atau memberi perintah WhatsApp.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
