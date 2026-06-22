import React, { useRef, useState, useEffect } from 'react';
import { AppConfig, Landmark, PolaroidPhoto } from './types';
import { AudioEngine } from './audioEngine';
import { GestureStateMachine } from './stateMachine';
import { WristbandSimulator } from './wristbandSimulator';
import { TutorialGuide } from './tutorialGuide';
import { UIManager } from './uiManager';
import { GestureEngine } from './gestureEngine';
import { ParticleSystem } from './particleSystem';

// Standard Warm Organic Theme configuration conforming to the AppConfig interface
const DEFAULT_CONFIG: AppConfig = {
  thresholds: {
    pinchTipDistance: 0.65,
    pinchFingerDistance: 0.92,
    tapIndexDistance: 1.1,
    tapFingerCurled: 1.02,
    tapThumbMargin: 0.75,
    tapMinDownwardVelocity: 0.012,
    palmStillnessMaxVariance: 0.08,
    palmStillnessDurationMs: 600,
    smileWidthRatio: 1.15,
    grimaceEARThreshold: 0.18,
    grimaceHeightRatio: 0.65,
    rainVolCoefficient: 0.008,
  },
  timers: {
    dandelionIdleDelaySec: 15,
    handLostGraceMs: 3000,
    petalMin: 6,
    petalRange: 5,
    birdCallMin: 14,
    birdCallRange: 12,
  },
  caps: {
    mushrooms: 8,
    mushroomSpores: 150,
    butterflies: 18,
    flowers: 24,
    raindrops: 75,
    fallingPetals: 45,
    splashes: 60,
    blowingSeeds: 80,
    grimaceStars: 40,
    droplets: 30,
  },
  particles: {
    pollenDensity: 1.0,
    lowPerformanceFailsafe: true,
    flowerScale: 1.0,
    blowingSeedLifeDecay: 0.002,
    shutterFlashDecay: 0.08,
    petalFallSpeed: 1.2,
    grimaceStarGravity: 0.15,
  },
  gestures: {
    cooldowns: {
      butterflies: 500,
      flowers: 150,
      rain: 50,
      droplet: 200,
      mushroom: 2000,
      smile: 2500,
      grimace: 3000,
    }
  }
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Navigation and State overlays
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Settings Panel States
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
  const [butterfliesEnabled, setButterfliesEnabled] = useState<boolean>(true);
  const [rainEnabled, setRainEnabled] = useState<boolean>(true);
  const [starsEnabled, setStarsEnabled] = useState<boolean>(true);
  const [particleIntensity, setParticleIntensity] = useState<number>(1.0);
  const [lowPowerMode, setLowPowerMode] = useState<boolean>(true);
  const [liteMode, setLiteMode] = useState<boolean>(false);

  // On-screen telemetry status logs
  const [cameraStatus, setCameraStatus] = useState<string>('OFF');
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [activeGestureText, setActiveGestureText] = useState<string>('None');
  const [audioStatusText, setAudioStatusText] = useState<string>('SUSPENDED');
  const [fps, setFps] = useState<number>(0);

  // Wristband states
  const [hr, setHr] = useState<number>(72);
  const [steps, setSteps] = useState<number>(4320);
  const [bloomFactor, setBloomFactor] = useState<number>(1.0);

  // Calibration and tutorial states
  const [calibrationState, setCalibrationState] = useState<string>('idle');
  const [curTutorialStep, setCurTutorialStep] = useState<number>(0);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(false);

  // Mindful achievements (5 key gestures)
  const [unlockedGestures, setUnlockedGestures] = useState<Record<string, boolean>>({
    fist: false,
    openPalm: false,
    rain: false,
    pinch: false,
    mushroom: false
  });

  // Mood states
  const [todayMood, setTodayMood] = useState<string>(() => localStorage.getItem('today_mood') || '');
  const [yesterdayMood, setYesterdayMood] = useState<string>(() => localStorage.getItem('yesterday_mood') || '');
  const [isMoodOpen, setIsMoodOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);

  // Polaroid photos states
  const [photos, setPhotos] = useState<PolaroidPhoto[]>(() => {
    try {
      const stored = localStorage.getItem('quiet_garden_photos');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedPhoto, setSelectedPhoto] = useState<PolaroidPhoto | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  // Canvas Touch alternative interactions
  const [isTouchModeEnabled, setIsTouchModeEnabled] = useState<boolean>(false);

  // Breathing guide states
  const [breathingPracticeActive, setBreathingPracticeActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<string>('Inhale'); // Inhale, Hold, Exhale
  const [breathingProgress, setBreathingProgress] = useState<number>(0);
  const [breathingCycleCount, setBreathingCycleCount] = useState<number>(0);
  const [showBreathingCompleteMsg, setShowBreathingCompleteMsg] = useState<boolean>(false);

  // Dandelion active state
  const [dandelionActive, setDandelionActive] = useState<boolean>(false);
  const [dandelionX, setDandelionX] = useState<number>(430);
  const [dandelionY, setDandelionY] = useState<number>(270);
  const [farewellOverlayActive, setFarewellOverlayActive] = useState<boolean>(false);
  const [farewellStart, setFarewellStart] = useState<number>(0);
  const [farewellPhraseChosen, setFarewellPhraseChosen] = useState<string>('');

  const handLostStartTimeRef = useRef<number | null>(null);
  const handOrFaceLastSeen = useRef<number>(Date.now());
  const lastRenderedFrameTime = useRef<number>(0);
  const lastAutoSnapshotTimeRef = useRef<number>(0);
  const takeSnapshotRef = useRef<() => void>(() => {});

  // Audio mic input references
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);

  // High performance anim-synced refs
  const allGesturesUnlockedRef = useRef<boolean>(false);
  const dandelionActiveRef = useRef<boolean>(false);
  const farewellActiveRef = useRef<boolean>(false);
  const farewellPhraseRef = useRef<string>('');
  const farewellStartRef = useRef<number>(0);

  const breathingTimerRef = useRef<number>(Date.now());
  const breathingProgressRef = useRef<number>(0);
  const breathingPhaseRef = useRef<string>('Inhale');

  const triggerDandelionState = (val: boolean) => {
    setDandelionActive(val);
    dandelionActiveRef.current = val;
  };

  const triggerFarewellState = (active: boolean, phrase: string = '') => {
    setFarewellOverlayActive(active);
    farewellActiveRef.current = active;
    if (active) {
      setFarewellPhraseChosen(phrase);
      farewellPhraseRef.current = phrase;
      const now = Date.now();
      setFarewellStart(now);
      farewellStartRef.current = now;
    }
  };

  const [gestureAlert, setGestureAlert] = useState<{
    key: string;
    emoji: string;
    title: string;
    desc: string;
    sketchName: string;
    sketchLines: string[];
  } | null>(null);

  const gestureAlertTimerRef = useRef<any>(null);

  const triggerGestureUnlock = (key: string) => {
    setUnlockedGestures(prev => {
      if (prev[key]) return prev;
      
      const next = { ...prev, [key]: true };
      const allDone = Object.values(next).every(v => v === true);
      if (allDone) {
        allGesturesUnlockedRef.current = true;
      }

      // Metadata with descriptive outline drawings / sketch text
      const gesturesMeta: Record<string, { emoji: string, title: string, desc: string, sketchName: string, sketchLines: string[] }> = {
        fist: {
          emoji: '✊',
          title: 'Butterfly Clench (握拳释放)',
          desc: 'Release fist slowly to command butterflies. Courage blossoms.',
          sketchName: '✊ Clenched Hand',
          sketchLines: ['   _____', '  /     \\', ' |  ✊  |', '  \\_____/']
        },
        openPalm: {
          emoji: '🖐️',
          title: 'Flower Trail (抚心百花)',
          desc: 'Open palm and trace across screens to plant Sakura pink & violet. Generosity blossoms.',
          sketchName: '🖐️ Flat Palm',
          sketchLines: ['  \\ | /', '  - 🖐️ -', '  / | \\']
        },
        rain: {
          emoji: '🌧️',
          title: 'Rain Tap (云雨汇聚)',
          desc: 'Tap/Click anywhere on the space to release rain seeds. Generosity and nourishment.',
          sketchName: '🌧️ Rain Clouds',
          sketchLines: ['   _---_', '  (     )', '  |||||||']
        },
        pinch: {
          emoji: '🤏',
          title: 'Pinch Droplet (凝神捏露)',
          desc: 'Keep index and thumb together to focus droplets. Concentration blossoms.',
          sketchName: '🤏 Pinch fingers',
          sketchLines: ['   (\\ /)', '    )x(', '   (/ \\)']
        },
        mushroom: {
          emoji: '✋',
          title: 'Stillness Sprout (静止野菇)',
          desc: 'Keep hand flat and perfectly still to grow warm forest mushrooms. Stillness blossoms.',
          sketchName: '✋ Flat Still',
          sketchLines: ['   _ | _', '  ( ✋ )', '  -===_-']
        }
      };

      const meta = gesturesMeta[key];
      if (meta) {
        setGestureAlert({
          key,
          emoji: meta.emoji,
          title: meta.title,
          desc: meta.desc,
          sketchName: meta.sketchName,
          sketchLines: meta.sketchLines
        });

        if (gestureAlertTimerRef.current) {
          clearTimeout(gestureAlertTimerRef.current);
        }
        gestureAlertTimerRef.current = setTimeout(() => {
          setGestureAlert(null);
        }, 3800);
      }

      return next;
    });
  };

  // Engine instantiation references
  const enginesRef = useRef<{
    audio: AudioEngine;
    stateMachine: GestureStateMachine;
    wristband: WristbandSimulator;
    tutorial: TutorialGuide;
    ui: UIManager;
    gesture: GestureEngine;
    particles: ParticleSystem;
  } | null>(null);

  // Dimensions & velocities references
  const trackingRef = useRef({
    canvasWidth: 860,
    canvasHeight: 540,
    handCanvasX: null as number | null,
    handCanvasY: null as number | null,
    userHandVx: 0,
    userHandVy: 0,
    faceCanvasX: null as number | null,
    faceCanvasY: null as number | null,
    userFaceVx: 0,
    userFaceVy: 0,
    lastTime: Date.now(),
  });

  // Entrance text sequence
  const [entrancePhrase, setEntrancePhrase] = useState<string>('Relax your shoulders, let your palms drift...');

  useEffect(() => {
    // Automatically trigger dusk/night mode theme based on hours
    const hrVal = new Date().getHours();
    if (hrVal >= 19 || hrVal < 6) {
      setIsNightMode(true);
    }

    const entrancePhrasesList = [
      'Relax your shoulders, let your palms drift...',
      'In this garden, quiet hands sprout deep roots.',
      'A sanctuary designed for un-rushing. Allow breathing to set the pace.',
      'Unclench your jaw. The soil is listening.'
    ];
    setEntrancePhrase(entrancePhrasesList[Math.floor(Math.random() * entrancePhrasesList.length)]);
  }, []);

  // Set up modular class engines on first user activation
  const handleEnterGarden = () => {
    setHasEntered(true);
    
    // 1. Instantiate modules
    const audio = new AudioEngine(DEFAULT_CONFIG);
    const stateMachine = new GestureStateMachine();
    const wristband = new WristbandSimulator();
    const tutorial = new TutorialGuide();
    const ui = new UIManager();
    const gesture = new GestureEngine(DEFAULT_CONFIG);
    const particles = new ParticleSystem(DEFAULT_CONFIG);

    // Initial populate pollen particles
    particles.init(860, 540);

    enginesRef.current = {
      audio,
      stateMachine,
      wristband,
      tutorial,
      ui,
      gesture,
      particles,
    };

    setIsTutorialActive(tutorial.isActive());

    // 2. Wake up audio system
    audio.resume();
    setAudioStatusText('RUNNING');

    // 3. Setup and link MediaPipe
    setupMediaPipeStream();

    // 4. Initialize microphone monitoring
    initMicAnalyser();

    // 5. Fire up loop
    requestAnimationFrame(animationLoop);
  };

  const initMicAnalyser = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        // Request mic access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (stream && enginesRef.current) {
          const audioCtx = enginesRef.current.audio.ctx;
          if (audioCtx) {
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            micStreamRef.current = stream;
            micAnalyserRef.current = analyser;
            console.log('[Mic Analyser] Microphone connected for breathing/blowing feedback.');
          }
        }
      }
    } catch (e) {
      console.warn('Mic analyser initialization failed', e);
    }
  };

  const getCanvasNormalizedPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    
    // Mirror since preview and canvas is flipped:
    return { x: 1 - x, y };
  };

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    longPressTimer: null as any,
    isDragging: false,
    lastSpawnTime: 0
  });

  const handlePointerDown = (e: any) => {
    // If audio is suspended, resume it
    if (enginesRef.current) {
      enginesRef.current.audio.resume();
      setAudioStatusText('RUNNING');
    }

    const { x, y } = getCanvasNormalizedPos(e);
    touchStateRef.current.startX = x;
    touchStateRef.current.startY = y;
    touchStateRef.current.startTime = Date.now();
    touchStateRef.current.isDragging = false;

    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
    }

    // Set 600ms long press for Mushroom!
    touchStateRef.current.longPressTimer = setTimeout(() => {
      if (!touchStateRef.current.isDragging && enginesRef.current) {
        const { particles, audio, ui } = enginesRef.current;
        const spawned = particles.spawnMushroom(trackingRef.current.canvasWidth, trackingRef.current.canvasHeight, x, y);
        if (spawned) {
          audio.startMushroomGrowHum();
          audio.playMushroomAppearsChime();
          ui.showTherapeuticCaption('✋ Stillness grows life. Cozy forest mushrooms emerge when we stop trying.', x * trackingRef.current.canvasWidth, y * trackingRef.current.canvasHeight);
          triggerGestureUnlock('mushroom');
        }
      }
    }, 600);
  };

  const handlePointerMove = (e: any) => {
    const { x, y } = getCanvasNormalizedPos(e);
    const startX = touchStateRef.current.startX;
    const startY = touchStateRef.current.startY;

    if (Math.hypot(x - startX, y - startY) > 0.02) {
      if (!touchStateRef.current.isDragging) {
        touchStateRef.current.isDragging = true;
        if (touchStateRef.current.longPressTimer) {
          clearTimeout(touchStateRef.current.longPressTimer);
        }
      }

      // Dragging spawns flowers! (Open Palm path)
      const now = Date.now();
      if (now - touchStateRef.current.lastSpawnTime > 75 && enginesRef.current) {
        touchStateRef.current.lastSpawnTime = now;
        const { particles, audio } = enginesRef.current;
        particles.spawnFlower(trackingRef.current.canvasWidth, trackingRef.current.canvasHeight, x, y);
        audio.playFlowerBloomChime();
        triggerGestureUnlock('openPalm');
      }
    }
  };

  const handlePointerUp = (e: any) => {
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
    }

    const { x, y } = getCanvasNormalizedPos(e);
    const duration = Date.now() - touchStateRef.current.startTime;

    if (!touchStateRef.current.isDragging && duration < 600 && enginesRef.current) {
      const { particles, audio, ui } = enginesRef.current;

      if (e.shiftKey) {
        // Shift + click -> Pinch Droplet!
        particles.spawnDroplet(trackingRef.current.canvasWidth, trackingRef.current.canvasHeight, x, y);
        audio.playFocusDropletChime();
        ui.showTherapeuticCaption('🤏 Concentration droplet created. Keep mind quiet.', x * trackingRef.current.canvasWidth, y * trackingRef.current.canvasHeight);
        triggerGestureUnlock('pinch');
      } else {
        // Click -> Rain Tap!
        particles.spawnRain(trackingRef.current.canvasWidth, trackingRef.current.canvasHeight, x, y);
        audio.playRainSound();
        ui.showTherapeuticCaption('🌧️ Rain tap. You sprinkle water droplets across the landscape.', x * trackingRef.current.canvasWidth, y * trackingRef.current.canvasHeight);
        triggerGestureUnlock('rain');
      }
    }
  };

  const handleCanvasDoubleClick = (e: any) => {
    const { x, y } = getCanvasNormalizedPos(e);
    if (enginesRef.current) {
      const { particles, audio, ui } = enginesRef.current;
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        particles.spawnButterfly(trackingRef.current.canvasWidth, trackingRef.current.canvasHeight, x, y);
      }
      audio.playSoftButterflyBurst();
      ui.showTherapeuticCaption('✊ Clench & Release. Your hands just exhaled back to life. Butterflies arise.', x * trackingRef.current.canvasWidth, y * trackingRef.current.canvasHeight);
      triggerGestureUnlock('fist');
    }
  };

  const setupMediaPipeStream = () => {
    const video = videoRef.current;
    if (!video) return;

    setCameraStatus('LOADING...');

    const isGlobalLoaded = (window as any).mediaPipeLoaded === true;
    if (!isGlobalLoaded) {
      // Loop pending checks
      (window as any).startMediaPipeEnginePending = true;
      
      // Inject fallback triggers to original loader
      const checkInterval = setInterval(() => {
        if ((window as any).mediaPipeLoaded === true) {
          clearInterval(checkInterval);
          startStreaming();
        }
      }, 300);
    } else {
      startStreaming();
    }
  };

  const startStreaming = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        setCameraStatus('ON');
        video.play().catch(e => console.warn('Autoplay interrupted:', e));
      };

      const HandsClass = (window as any).Hands;
      const FaceMeshClass = (window as any).FaceMesh;
      const CameraClass = (window as any).Camera;

      if (!HandsClass || !FaceMeshClass || !CameraClass) {
        throw new Error('MediaPipe dynamic files not present in window context');
      }

      // Initialize hands detector
      (window as any).__activeMPContext = "hands";
      const hands = new HandsClass({
        locateFile: (file: string) => `${(window as any).activeCdnLocateBase || 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/'}${file}`
      });
      hands.setOptions({
        modelComplexity: 0,
        maxNumHands: 1,
        minDetectionConfidence: 0.58,
        minTrackingConfidence: 0.58
      });
      hands.onResults(handleHandsPipelineResults);
      (window as any).handsDetector = hands;

      // Initialize face mesh detector
      (window as any).__activeMPContext = "face_mesh";
      const faceMesh = new FaceMeshClass({
        locateFile: (file: string) => `${(window as any).activeCdnLocateFaceBase || 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/'}${file}`
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });
      faceMesh.onResults(handleFacialPipelineResults);
      (window as any).faceMeshDetector = faceMesh;

      (window as any).__activeMPContext = null;

      // Bind webcam frames
      const cam = new CameraClass(video, {
        onFrame: async () => {
          try {
            const promises = [];
            if ((window as any).handsDetector) {
              (window as any).__activeMPContext = "hands";
              promises.push((window as any).handsDetector.send({ image: video }));
            }
            if ((window as any).faceMeshDetector) {
              (window as any).__activeMPContext = "face_mesh";
              promises.push((window as any).faceMeshDetector.send({ image: video }));
            }
            if (promises.length > 0) {
              await Promise.all(promises);
            }
          } catch (e) {
            console.error('Video framework evaluation failing:', e);
          }
        },
        width: 640,
        height: 480
      });
      cam.start();

    } catch (err: any) {
      console.error('Webcam capturing failure:', err);
      setCameraStatus('PERMISSION_ERROR');
      setIsTouchModeEnabled(true);
      
      const loader = document.getElementById('camera-loader');
      if (loader) loader.classList.add('hidden');
      
      // Post a therapeutic advice message explaining touch mode
      setTimeout(() => {
        if (enginesRef.current) {
          enginesRef.current.ui.showTherapeuticCaption('🌱 Camera offline. Touch Mode activated! Click to sprinkle Rain, Drag to sow Flowers, Hold to sprout Mushrooms!', 430, 270);
        }
      }, 1200);
    }
  };

  const handleHandsPipelineResults = (results: any) => {
    const refs = trackingRef.current;
    if (!enginesRef.current) return;
    const { gesture, stateMachine, particles, ui, audio } = enginesRef.current;

    // Fast hide loader masks on land
    const loader = document.getElementById('camera-loader');
    if (loader) loader.classList.add('hidden');

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setHandDetected(false);
      setActiveGestureText('None');
      refs.handCanvasX = null;
      refs.handCanvasY = null;
      refs.userHandVx = 0;
      refs.userHandVy = 0;
      
      gesture.resetStillnessHistory();
      stateMachine.resetFist();
      return;
    }

    setHandDetected(true);
    const rawLandmarks = results.multiHandLandmarks[0];

    // Mirror horizontal tracking coordinate
    const targetX = (1 - rawLandmarks[9].x) * refs.canvasWidth;
    const targetY = rawLandmarks[9].y * refs.canvasHeight;

    if (refs.handCanvasX !== null) {
      refs.userHandVx = refs.userHandVx * 0.8 + (targetX - refs.handCanvasX) * 0.2;
      refs.userHandVy = refs.userHandVy * 0.8 + (targetY - refs.handCanvasY) * 0.2;
      refs.handCanvasX = refs.handCanvasX * 0.88 + targetX * 0.12;
      refs.handCanvasY = refs.handCanvasY * 0.88 + targetY * 0.12;
    } else {
      refs.handCanvasX = targetX;
      refs.handCanvasY = targetY;
    }

    // Adapt gestures: slightly raise detection limit on mobile
    const isMobile = window.innerWidth < 768;
    const signals = gesture.analyzeHandSignals(rawLandmarks, isMobile);

    setCalibrationState(gesture.getCalibrationState());

    // Trigger state transition actions
    stateMachine.transition(signals, (action, activeGestureName) => {
      setActiveGestureText(activeGestureName);
      
      if (action === 'release_butterfly') {
        const count = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          particles.spawnButterfly(refs.canvasWidth, refs.canvasHeight, rawLandmarks[9].x, rawLandmarks[9].y);
        }
        audio.playSoftButterflyBurst();
        ui.triggerHapticFeedback();
        ui.showTherapeuticCaption('✊ Clench & Release. Your hands just exhaled back to life. Butterflies arise.', refs.handCanvasX!, refs.handCanvasY!);
        triggerGestureUnlock('fist');
      }

      if (action === 'spawn_rain') {
        particles.spawnRain(refs.canvasWidth, refs.canvasHeight, rawLandmarks[8].x, rawLandmarks[8].y);
        audio.playRainSound();
        ui.triggerHapticFeedback();
        triggerGestureUnlock('rain');
      }

      if (action === 'spawn_droplet') {
        particles.spawnDroplet(refs.canvasWidth, refs.canvasHeight, rawLandmarks[8].x, rawLandmarks[8].y);
        audio.playFocusDropletChime();
        ui.triggerHapticFeedback();
        ui.showTherapeuticCaption('🤏 Pinch is focus. Keep thumb and index together to focus floating droplets.', refs.handCanvasX!, refs.handCanvasY!);
        triggerGestureUnlock('pinch');
      }

      if (action === 'spawn_flower') {
        particles.spawnFlower(refs.canvasWidth, refs.canvasHeight, rawLandmarks[9].x, rawLandmarks[9].y);
        audio.playFlowerBloomChime();
        ui.showTherapeuticCaption('🖐️ Drawing blossoms. You paint paths of serenity across the soil.', refs.handCanvasX!, refs.handCanvasY!);
        triggerGestureUnlock('openPalm');
      }

      if (action === 'sprout_mushroom') {
        const spawnedObj = particles.spawnMushroom(refs.canvasWidth, refs.canvasHeight, rawLandmarks[9].x, rawLandmarks[9].y);
        if (spawnedObj) {
          audio.startMushroomGrowHum();
          ui.showTherapeuticCaption('✋ Stillness grows life. Cozy forest mushrooms emerge when we stop trying.', refs.handCanvasX!, refs.handCanvasY!);
          triggerGestureUnlock('mushroom');
        }
      }
    });
  };

  const handleFacialPipelineResults = (results: any) => {
    const refs = trackingRef.current;
    if (!enginesRef.current) return;
    const { gesture, particles, ui, audio } = enginesRef.current;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      refs.faceCanvasX = null;
      refs.faceCanvasY = null;
      return;
    }

    setFaceDetected(true);
    const rawLandmarks = results.multiFaceLandmarks[0];
    const signals = gesture.analyzeFacialSignals(rawLandmarks);

    if (signals.noseTip) {
      refs.faceCanvasX = (1 - signals.noseTip.x) * refs.canvasWidth;
      refs.faceCanvasY = signals.noseTip.y * refs.canvasHeight;
    }

    if (signals.eyesClosed) {
      // Warm glows ambient trigger when eyes closed
      audio.triggerEyesClosedHum();
    }

    if (signals.smile) {
      particles.spawnFlower(refs.canvasWidth, refs.canvasHeight, rawLandmarks[1].x, rawLandmarks[1].y);
      audio.playSmileWarmArpeggio();
      ui.showTherapeuticCaption('🌸 A warm smile detected. Glowing blossoms unfurl from your warmth.', refs.faceCanvasX!, refs.faceCanvasY!);
    }

    if (signals.grimace) {
      particles.spawnGrimaceStars(refs.canvasWidth, refs.canvasHeight, rawLandmarks[1].x, rawLandmarks[1].y);
      audio.playShutterClick();
      
      const now = Date.now();
      if (now - lastAutoSnapshotTimeRef.current > 7000) {
        lastAutoSnapshotTimeRef.current = now;
        setTimeout(() => {
          if (takeSnapshotRef.current) {
            takeSnapshotRef.current();
          }
        }, 150);
      }
      
      ui.showTherapeuticCaption('📸 Smile or pull a funny face! Fully release tightness from facial muscles.', refs.faceCanvasX!, refs.faceCanvasY!);
    }

    if (signals.nod) {
      particles.spawnGrimaceStars(refs.canvasWidth, refs.canvasHeight, rawLandmarks[1].x, rawLandmarks[1].y);
      audio.playNodBreezeSound();
      ui.showTherapeuticCaption('🍃 A gentle nod detected. A soft mountaintop breeze sweeps the yard.', refs.faceCanvasX!, refs.faceCanvasY!);
    }
  };

  // Central frame rendering loop
  let frameCount = 0;
  let lastSec = performance.now();

  const animationLoop = (timestamp: number) => {
    if (!enginesRef.current) return;
    const { particles, wristband, tutorial, audio } = enginesRef.current;
    const refs = trackingRef.current;

    const mainCanvas = canvasRef.current;
    if (!mainCanvas) {
      requestAnimationFrame(animationLoop);
      return;
    }

    const mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) {
      requestAnimationFrame(animationLoop);
      return;
    }

    // Adaptive Frame Rate: Downscale to 15 FPS if no hand/face detected for > 3.0 seconds
    const activeChecking = handDetected || faceDetected || touchStateRef.current.isDragging || 
                          (Date.now() - touchStateRef.current.startTime < 1000) || breathingPracticeActive;
                          
    if (activeChecking) {
      handOrFaceLastSeen.current = Date.now();
    }
    const isIdle = Date.now() - handOrFaceLastSeen.current > 3000;
    const currentLimit = isIdle ? 15 : 60;
    const delay = 1000 / currentLimit;
    if (timestamp - lastRenderedFrameTime.current < delay) {
      requestAnimationFrame(animationLoop);
      return;
    }
    lastRenderedFrameTime.current = timestamp;

    // Set logical size matches rendering boxes
    const container = document.getElementById('viewport-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const newW = Math.floor(rect.width);
      const newH = Math.floor(rect.height);
      if (newW > 0 && newH > 0 && (refs.canvasWidth !== newW || refs.canvasHeight !== newH)) {
        refs.canvasWidth = newW;
        refs.canvasHeight = newH;
        mainCanvas.width = newW;
        mainCanvas.height = newH;
      }
    }

    // Compute FPS
    frameCount++;
    if (timestamp - lastSec >= 1000) {
      setFps(frameCount);
      frameCount = 0;
      lastSec = timestamp;
    }

    // Wristband Simulator continuous updates
    wristband.update();
    setHr(wristband.getHeartRate());
    setSteps(wristband.getStepCount());

    // Sound ambient periodic triggers (birds chime, gentle wind rustle)
    audio.tick();

    // Microphone Blowing detection:
    let isBlowing = false;
    if (micAnalyserRef.current) {
      const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
      micAnalyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      if (avg > 35) { // microphone blow sound threshold
        isBlowing = true;
      }
    }

    // Checking Dandelion spawning countdown (All 5 unlocked, no active interaction)
    if (allGesturesUnlockedRef.current && !handDetected && !isTouchModeEnabled) {
      if (handLostStartTimeRef.current === null) {
        handLostStartTimeRef.current = Date.now();
      } else if (Date.now() - handLostStartTimeRef.current > 6000) {
        if (!dandelionActiveRef.current && !farewellActiveRef.current) {
          triggerDandelionState(true);
          setDandelionX(refs.canvasWidth / 2);
          setDandelionY(refs.canvasHeight / 2);
          audio.playMushroomAppearsChime();
        }
      }
    } else {
      handLostStartTimeRef.current = null;
    }

    // Checking Dandelion blowing interaction to disperse particles
    if (dandelionActiveRef.current) {
      const hasFastWaving = handDetected && Math.hypot(refs.userHandVx, refs.userHandVy) > 18.0;
      if (isBlowing || hasFastWaving) {
        triggerDandelionState(false);
        particles.triggerDandelionDispersal(refs.canvasWidth / 2, refs.canvasHeight / 2);
        audio.playDandelionDispersionSound();

        const farewellQuotes = [
          "Like seeds on the wind, let go of what weighs you down. 🌿",
          "May your heart be light, your mind clear, and your path blossom. ✨",
          "Every ending is the soil where a new beginning grows. 🌱",
          "Trust the gentle breeze of time to carry you where you belong. 🍃",
          "Deep breath in, let old worries blow away with the autumn wind. 💨",
          "You are right where you need to be. Drift gently. 🌸"
        ];
        const phrase = farewellQuotes[Math.floor(Math.random() * farewellQuotes.length)];
        triggerFarewellState(true, phrase);

        setTimeout(() => {
          triggerFarewellState(false);
        }, 7500);
      }
    }

    // Particle vector update ticks
    const colorShift = Math.sin((Date.now() / 30000) * Math.PI * 2) * 0.02;
    const glowShiftVal = 0.0; // dynamic shift

    particles.update(
      refs.canvasWidth,
      refs.canvasHeight,
      {
        flowers: bloomEnabled,
        butterflies: butterfliesEnabled,
        rain: rainEnabled,
        stars: starsEnabled,
      },
      refs.handCanvasX,
      refs.handCanvasY,
      refs.userHandVx,
      refs.userHandVy,
      colorShift,
      glowShiftVal,
      rainEnabled ? 0.3 : 0.0
    );

    // Double-buffered rendering utilizing backbuffer Blit
    particles.draw(
      mainCtx,
      refs.canvasWidth,
      refs.canvasHeight,
      isNightMode,
      colorShift,
      glowShiftVal,
      rainEnabled ? 0.3 : 0.0, // puddle density
      false, // sunlightActive
      0, // sunlightTimer
      dandelionActiveRef.current, // dandelionActive
      refs.canvasWidth / 2, refs.canvasHeight / 2, // dandelion origin
      farewellActiveRef.current, // farewellOverlay
      farewellStartRef.current, // farewellStart
      farewellPhraseRef.current, // farewellPhrase chosen
      audio.playMushroomAppearsChime.bind(audio),
      audio.playSoftSporePopSound.bind(audio),
      todayMood
    );

    // Continuous heartbeat scale pulse mapping (mapped to heart rate)
    const hrHz = wristband.getHeartRate() / 60;
    const hrScale = 1.0 + Math.sin(Date.now() * 0.001 * Math.PI * 2 * hrHz) * 0.055;

    // Draw central Breathing circles practice overlay
    if (breathingPracticeActive) {
      const elapsed = Date.now() - breathingTimerRef.current;
      const elapsedCycles = Math.floor(elapsed / 12000);
      
      if (elapsedCycles !== breathingCycleCount) {
        setBreathingCycleCount(elapsedCycles);
        audio.playFlowerBloomChime(); // Soft alert chord on breathing wave transition

        if (elapsedCycles >= 3) {
          setBreathingPracticeActive(false);
          setShowBreathingCompleteMsg(true);
          setBloomFactor(prev => prev + 0.45);
          audio.playSmileWarmArpeggio();
        }
      }

      const cycleRemainder = elapsed % 12000;
      let practiceScale = 0.6;
      let phaseText = 'Inhale 吸气';
      let phaseColor = 'rgba(155, 174, 138, ';

      if (cycleRemainder < 4000) {
        // Inhale: 4 seconds (grows from 0.6 to 1.0)
        phaseText = '吸气 Inhale... 🌬️';
        practiceScale = 0.6 + (cycleRemainder / 4000) * 0.4;
        phaseColor = 'rgba(155, 174, 138, ';
      } else if (cycleRemainder < 6000) {
        // Hold: 2 seconds (stays at 1.0)
        phaseText = '屏息 Hold... ⏸️';
        practiceScale = 1.0;
        phaseColor = 'rgba(196, 160, 142, ';
      } else {
        // Exhale: 6 seconds (shrinks from 1.0 to 0.6)
        phaseText = '呼气 Exhale... 💨';
        practiceScale = 1.0 - ((cycleRemainder - 6000) / 6000) * 0.4;
        phaseColor = 'rgba(201, 184, 140, ';
      }

      // Draw Breathing Core Circle on Canvas
      const cx = refs.canvasWidth / 2;
      const cy = refs.canvasHeight / 2;
      const radiusBase = 100;
      const rVal = radiusBase * practiceScale;

      mainCtx.save();
      // Glow envelope
      const glowGrad = mainCtx.createRadialGradient(cx, cy, rVal * 0.6, cx, cy, rVal * 1.4);
      glowGrad.addColorStop(0, phaseColor + '0.15)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mainCtx.fillStyle = glowGrad;
      mainCtx.beginPath();
      mainCtx.arc(cx, cy, rVal * 1.4, 0, Math.PI * 2);
      mainCtx.fill();

      // Outer animated guideline dash ring
      mainCtx.strokeStyle = phaseColor + '0.7)';
      mainCtx.lineWidth = 4.5;
      mainCtx.setLineDash([8, 8]);
      mainCtx.beginPath();
      mainCtx.arc(cx, cy, rVal, 0, Math.PI * 2);
      mainCtx.stroke();

      // Core inner card
      mainCtx.fillStyle = 'rgba(245, 240, 224, 0.88)';
      mainCtx.beginPath();
      mainCtx.arc(cx, cy, rVal * 0.78, 0, Math.PI * 2);
      mainCtx.fill();

      mainCtx.lineWidth = 1.5;
      mainCtx.strokeStyle = '#1e1c18';
      mainCtx.stroke();

      // Caption
      mainCtx.fillStyle = '#1e1c18';
      mainCtx.font = 'italic 15px var(--font-serif)';
      mainCtx.textAlign = 'center';
      mainCtx.textBaseline = 'middle';
      mainCtx.fillText(phaseText, cx, cy - 8);
      mainCtx.font = 'bold 10px var(--font-sans)';
      mainCtx.fillText(`CYCLE ${elapsedCycles + 1}/3`, cx, cy + 14);

      mainCtx.restore();
    } else {
      // Draw standard Heartbeat ambient ring on the canvas sides to anchor the "visual heart beat rate link"
      mainCtx.save();
      mainCtx.strokeStyle = `rgba(155, 174, 138, ${0.05 * (hrScale - 0.95)})`;
      mainCtx.lineWidth = 12 * hrScale;
      mainCtx.beginPath();
      mainCtx.arc(refs.canvasWidth / 2, refs.canvasHeight / 2, (refs.canvasWidth / 2) * 0.96 * hrScale, 0, Math.PI * 2);
      mainCtx.stroke();
      mainCtx.restore();
    }

    // Overlay tutorial visual guide
    if (isTutorialActive) {
      tutorial.updateAndDraw(
        mainCtx,
        refs.canvasWidth,
        refs.canvasHeight,
        () => particles.spawnButterfly(refs.canvasWidth, refs.canvasHeight),
        (x, y) => particles.spawnFlower(refs.canvasWidth, refs.canvasHeight, x, y),
        (x, y) => particles.spawnRain(refs.canvasWidth, refs.canvasHeight, x, y),
        (x, y) => particles.spawnDroplet(refs.canvasWidth, refs.canvasHeight, x, y),
        (x, y) => particles.spawnMushroom(refs.canvasWidth, refs.canvasHeight, x, y)
      );
      setCurTutorialStep(tutorial.getStep());
      setIsTutorialActive(tutorial.isActive());
    }

    // Loop recursively
    requestAnimationFrame(animationLoop);
  };

  const handleToggleNightMode = () => {
    setIsNightMode(prev => !prev);
  };

  const handleInitiateCalibration = () => {
    if (!enginesRef.current) return;
    enginesRef.current.gesture.startHandCalibration();
  };

  const handleMuteToggle = () => {
    if (!enginesRef.current) return;
    const aud = enginesRef.current.audio;
    if (audioStatusText === 'RUNNING') {
      aud.suspend();
      setAudioStatusText('SUSPENDED');
    } else {
      aud.resume();
      setAudioStatusText('RUNNING');
    }
  };

  const takeSnapshot = () => {
    if (!enginesRef.current) return;
    const { audio } = enginesRef.current;
    
    // Play camera shutter click sound
    try {
      audio.playCameraShutterClick();
    } catch (e) {
      console.warn("Could not play camera shutter sound", e);
    }
    
    // Trigger flash flash strobe
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const mainCanvas = canvasRef.current;
    const video = videoRef.current;
    if (!mainCanvas) return;

    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = mainCanvas.width;
      tempCanvas.height = mainCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Mirror horizontally to match what's styled in CSS (.mirrored)
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
        
        // 1. Draw camera video frame if active and ready
        if (video && video.readyState >= 2) {
          try {
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          } catch (err) {
            console.error("Failed to capture video streams in snapshot", err);
          }
        }
        
        // 2. Draw canvas particle system overlays
        try {
          tempCtx.drawImage(mainCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        } catch (err) {
          console.error("Failed to capture canvas context in snapshot", err);
        }
      }

      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
      
      const newPhoto: PolaroidPhoto = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        dataUrl,
        timestamp: Date.now()
      };

      setPhotos(prevPhotos => {
        const updated = [newPhoto, ...prevPhotos];
        if (updated.length > 12) {
          updated.pop();
        }
        let listStr = JSON.stringify(updated);
        while (listStr.length > 0) {
          try {
            localStorage.setItem('quiet_garden_photos', listStr);
            break;
          } catch (storageError) {
            if (updated.length > 1) {
              updated.pop();
              listStr = JSON.stringify(updated);
            } else {
              localStorage.removeItem('quiet_garden_photos');
              break;
            }
          }
        }
        return [...updated];
      });
    } catch (e) {
      console.error("Polaroid photo capture error:", e);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prevPhotos => {
      const updated = prevPhotos.filter(p => p.id !== id);
      try {
        localStorage.setItem('quiet_garden_photos', JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save updated photos list after deletion", err);
      }
      return updated;
    });
  };

  const handleClearPhotos = () => {
    if (window.confirm("🗑️ Are you sure you want to clear your Polaroid memoirs? (您确定要清空所有拍立得记忆吗？)")) {
      setPhotos([]);
      localStorage.removeItem('quiet_garden_photos');
    }
  };

  // Keep takeSnapshotRef current
  takeSnapshotRef.current = takeSnapshot;

  return (
    <div className={`relative w-full h-full select-none transition-colors duration-1000 ${isNightMode ? 'bg-[#1b1528]' : 'bg-[#f5f0e0]'}`}>
      <div className="dust-overlay"></div>

      {/* VINTAGE PARCHMENT BOTANICAL ILLUSTRATIONS */}
      {/* Top-Left: Arching Wild Olive / Leaf Branch */}
      <div className="fixed top-0 left-0 w-80 h-80 pointer-events-none z-10 select-none opacity-15 mix-blend-multiply dark:mix-blend-screen text-[#354535] dark:text-[#beaf98]">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,0 C 70,30 150,110 180,220" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 40,15 C 30,35 60,45 65,30 C 70,15 50,-5 40,15 Z" fill="currentColor"/>
          <path d="M 40,15 L 53,25" stroke="currentColor" strokeWidth="1"/>
          <path d="M 80,40 C 70,75 105,75 110,60 C 115,45 90,25 80,40 Z" fill="currentColor"/>
          <path d="M 80,40 L 98,53" stroke="currentColor" strokeWidth="1"/>
          <path d="M 120,75 C 110,110 145,115 150,100 C 155,85 130,60 120,75 Z" fill="currentColor"/>
          <path d="M 120,75 L 138,91" stroke="currentColor" strokeWidth="1"/>
          <path d="M 150,130 C 145,160 175,170 180,155 C 185,140 160,110 150,130 Z" fill="currentColor"/>
          <path d="M 150,130 L 167,147" stroke="currentColor" strokeWidth="1"/>
          <path d="M 30,12 C 10,25 5,45 12,50 C 20,55 25,30 30,12 Z" fill="currentColor"/>
          <path d="M 70,35 C 50,55 45,75 52,80 C 60,85 65,60 70,35 Z" fill="currentColor"/>
          <path d="M 110,68 C 90,88 85,108 92,113 C 100,118 105,93 110,68 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Top-Right: Elegant curved stem */}
      <div className="fixed top-0 right-0 w-80 h-80 pointer-events-none z-10 select-none opacity-15 mix-blend-multiply dark:mix-blend-screen text-[#354535] dark:text-[#beaf98]">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 300,0 C 230,30 150,110 120,220" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 260,15 C 270,35 240,45 235,30 C 230,15 250,-5 260,15 Z" fill="currentColor"/>
          <path d="M 260,15 L 247,25" stroke="currentColor" strokeWidth="1"/>
          <path d="M 220,40 C 230,75 195,75 190,60 C 185,45 210,25 220,40 Z" fill="currentColor"/>
          <path d="M 220,40 L 202,53" stroke="currentColor" strokeWidth="1"/>
          <path d="M 180,75 C 190,110 155,115 150,100 C 145,85 170,60 180,75 Z" fill="currentColor"/>
          <path d="M 180,75 L 162,91" stroke="currentColor" strokeWidth="1"/>
          <path d="M 150,130 C 155,160 125,170 120,155 C 115,140 140,110 150,130 Z" fill="currentColor"/>
          <path d="M 150,130 L 133,147" stroke="currentColor" strokeWidth="1"/>
          <path d="M 270,12 C 290,25 295,45 288,50 C 280,55 275,30 270,12 Z" fill="currentColor"/>
          <path d="M 230,35 C 250,55 255,75 248,80 C 240,85 235,60 230,35 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Bottom-Left: Majestic Fern Frond */}
      <div className="fixed bottom-0 left-0 w-80 h-80 pointer-events-none z-10 select-none opacity-15 mix-blend-multiply dark:mix-blend-screen text-[#354535] dark:text-[#beaf98]">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,300 C 50,240 110,150 180,100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 25,275 C 15,250 35,230 45,240 C 55,250 40,285 25,275 Z" fill="currentColor"/>
          <path d="M 35,260 C 55,240 65,255 55,265 C 45,275 25,280 35,260 Z" fill="currentColor"/>
          <path d="M 50,235 C 35,210 55,190 70,205 C 85,220 65,250 50,235 Z" fill="currentColor"/>
          <path d="M 65,220 C 85,200 100,215 85,230 C 70,245 50,240 65,220 Z" fill="currentColor"/>
          <path d="M 85,190 C 70,165 95,145 110,160 C 125,175 105,205 85,190 Z" fill="currentColor"/>
          <path d="M 100,175 C 125,155 135,170 120,185 C 105,200 85,195 100,175 Z" fill="currentColor"/>
          <path d="M 125,145 C 115,120 135,105 145,120 C 155,135 140,160 125,145 Z" fill="currentColor"/>
          <path d="M 135,135 C 155,115 165,130 150,145 C 135,160 120,150 135,135 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Bottom-Right: Slender Eucalyptus Sprays */}
      <div className="fixed bottom-0 right-0 w-80 h-80 pointer-events-none z-10 select-none opacity-15 mix-blend-multiply dark:mix-blend-screen text-[#354535] dark:text-[#beaf98]">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 300,300 C 230,240 150,150 100,80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 250,250 C 220,225 215,195 240,190 C 265,185 280,215 250,250 Z" fill="currentColor"/>
          <path d="M 210,210 C 180,185 175,155 200,150 C 225,145 240,175 210,210 Z" fill="currentColor"/>
          <path d="M 170,170 C 140,145 135,115 160,110 C 185,105 200,135 170,170 Z" fill="currentColor"/>
          <path d="M 130,130 C 100,105 95,75 120,70 C 145,65 160,95 130,130 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* CORNER 1: TOP-LEFT MODULE —— BREATHING GUIDE ACTION */}
      {hasEntered && (
        <div className="fixed top-6 left-6 z-20 flex flex-col gap-3 pointer-events-auto">
          <button
            id="breathing-guide-btn"
            onClick={() => {
              if (breathingPracticeActive) {
                setBreathingPracticeActive(false);
              } else {
                setBreathingPracticeActive(true);
                setBreathingCycleCount(0);
                breathingTimerRef.current = Date.now();
                setShowBreathingCompleteMsg(false);
                if (enginesRef.current) {
                  enginesRef.current.audio.resume();
                  enginesRef.current.audio.playFlowerBloomChime();
                }
              }
            }}
            title="Breathing Practice Guide / 🌬️ 呼吸引导"
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border shadow-[2px_3px_8px_rgba(0,0,0,0.18)] cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
              breathingPracticeActive 
                ? 'bg-sage border-sage text-cream animate-pulse' 
                : 'bg-darkCharcoal/85 border-[#e0d7c6]/15 text-[#e0d7c6] hover:bg-darkCharcoal'
            }`}
          >
            💨
          </button>

          {/* Floating guiding overlay card */}
          {(breathingPracticeActive || showBreathingCompleteMsg) && (
            <div className="bg-darkCharcoal/90 backdrop-blur-xl rounded-2xl p-4 w-56 border border-[#e0d7c6]/15 shadow-xl text-[#e0d7c6] font-sans space-y-2">
              <span className="text-[11px] font-medium block text-cream">🌬️ Breathing Practice Guide</span>
              {breathingPracticeActive ? (
                <div className="text-center font-sans">
                  <p className="text-[9px] text-amber-200 animate-pulse font-mono tracking-wider font-semibold uppercase">
                    ACTIVE • CYCLE {breathingCycleCount + 1}/3
                  </p>
                  <p className="text-[11px] italic font-serif mt-1">
                    {breathingPhase === 'Inhale' && 'Slowly Inhale... 🌬️'}
                    {breathingPhase === 'Hold' && 'Hold in stillness... ⏸️'}
                    {breathingPhase === 'Exhale' && 'Gently Exhale... 💨'}
                  </p>
                  <button
                    onClick={() => setBreathingPracticeActive(false)}
                    className="mt-2.5 w-full py-1 bg-red-500/25 border border-red-500/50 rounded-lg text-[9px] uppercase font-mono hover:bg-red-500/40 cursor-pointer"
                  >
                    End Session
                  </button>
                </div>
              ) : (
                <div>
                  {showBreathingCompleteMsg && (
                    <p className="text-[10px] text-green-400 italic text-center animate-bounce">
                      ✨ Completed! Bloom Multiplier boosted!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CORNER 2: TOP-RIGHT MODULE —— MOOD LOG (🌿) & ACHIEVEMENTS (🏆) */}
      {hasEntered && (
        <div className="fixed top-6 right-6 z-20 flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-3">
            {/* Mood Choice Button */}
            <button
              id="mood-choice-corner-btn"
              onClick={() => {
                setIsMoodOpen(prev => !prev);
                setIsAchievementsOpen(false); // Close achievements
              }}
              title="Today's Mood / 🌿 情绪日志"
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border shadow-[2px_3px_8px_rgba(0,0,0,0.18)] cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
                isMoodOpen
                  ? 'bg-sage border-sage text-cream'
                  : 'bg-darkCharcoal/85 border-[#e0d7c6]/15 text-[#e0d7c6] hover:bg-darkCharcoal'
              }`}
            >
              🌿
            </button>

            {/* Achievements Collection Gateway */}
            <button
              id="achievements-corner-btn"
              onClick={() => {
                setIsAchievementsOpen(prev => !prev);
                setIsMoodOpen(false); // Close mood log
              }}
              title="Mindful Achievements / 🏆 成就系统"
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border shadow-[2px_3px_8px_rgba(0,0,0,0.18)] cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
                isAchievementsOpen
                  ? 'bg-sage border-sage text-cream'
                  : 'bg-darkCharcoal/85 border-[#e0d7c6]/15 text-[#e0d7c6] hover:bg-darkCharcoal'
              }`}
            >
              🏆
            </button>
          </div>

          {/* Mood Logging Panel */}
          {isMoodOpen && (
            <div className="bg-darkCharcoal/90 backdrop-blur-xl rounded-2xl p-4 w-60 border border-[#e0d7c6]/15 shadow-xl text-[#e0d7c6] font-sans space-y-3">
              <h4 className="font-serif italic text-cream text-[13px] border-b border-[#e0d7c6]/10 pb-1.5 flex justify-between items-center tracking-wide">
                <span>Inner Soil Mood Log</span>
                <span className="text-[9px] font-sans non-italic tracking-wider opacity-60">DAILY STATE</span>
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { emoji: '🌸', name: 'Serene', desc: '宁静' },
                  { emoji: '🌧️', name: 'Anxious', desc: '焦虑' },
                  { emoji: '✨', name: 'Joyful', desc: '喜悦' },
                  { emoji: '🍃', name: 'Tired', desc: '疲惫' }
                ].map(moodItem => (
                  <button
                    key={moodItem.name}
                    onClick={() => {
                      const prevMood = localStorage.getItem('today_mood') || '';
                      if (prevMood && prevMood !== moodItem.emoji) {
                        localStorage.setItem('yesterday_mood', prevMood);
                        setYesterdayMood(prevMood);
                      }
                      localStorage.setItem('today_mood', moodItem.emoji);
                      setTodayMood(moodItem.emoji);
                      if (enginesRef.current) {
                        enginesRef.current.audio.playSmileWarmArpeggio();
                        enginesRef.current.ui.showTherapeuticCaption(`🌿 Mood Logged: ${moodItem.emoji} ${moodItem.name}. May your garden nurture your state.`, 430, 270);
                      }
                    }}
                    title={`${moodItem.name} (${moodItem.desc})`}
                    className={`py-1 rounded-lg border text-base cursor-pointer hover:bg-white/10 transition-colors flex flex-col items-center justify-center ${
                      todayMood === moodItem.emoji ? 'border-sage bg-sage/20 scale-105' : 'border-white/10 bg-[#1e1c18]/40'
                    }`}
                  >
                    <span>{moodItem.emoji}</span>
                    <span className="text-[7px] text-zinc-400 mt-0.5">{moodItem.name}</span>
                  </button>
                ))}
              </div>
              {yesterdayMood && (
                <p className="text-[9px] text-[#e0d7c6]/50 italic font-sans leading-none">
                  Yesterday's state baseline: {yesterdayMood}
                </p>
              )}
            </div>
          )}

          {/* Achieved State Panel */}
          {isAchievementsOpen && (
            <div className="bg-darkCharcoal/90 backdrop-blur-xl rounded-2xl p-4 w-60 border border-[#e0d7c6]/15 shadow-xl text-[#e0d7c6] font-sans space-y-3">
              <h4 className="font-serif italic text-cream text-[13px] border-b border-[#e0d7c6]/10 pb-1.5 flex justify-between items-center tracking-wide">
                <span>Mindful Achievements</span>
                <span className="text-[9px] font-sans non-italic tracking-wider opacity-60">UNLOCKED</span>
              </h4>
              <div className="flex justify-between items-center text-[10px] font-medium font-mono text-sage leading-none">
                <span>PROGRESS STATUS:</span>
                <span>{Object.values(unlockedGestures).filter(Boolean).length}/5</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { key: 'fist', emoji: '✊', title: 'Butterfly Clench (握拳)' },
                  { key: 'openPalm', emoji: '🖐️', title: 'Flower Trail (张掌)' },
                  { key: 'rain', emoji: '🌧️', title: 'Rain Tap (下点)' },
                  { key: 'pinch', emoji: '🤏', title: 'Pinch Droplet (捏合)' },
                  { key: 'mushroom', emoji: '✋', title: 'Stillness Sprout (静止)' }
                ].map(ach => (
                  <div
                    key={ach.key}
                    title={ach.title}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm border transition-shadow ${
                      unlockedGestures[ach.key] 
                        ? 'border-sage bg-sage/25 text-[#e0d7c6] scale-105 shadow-sm shadow-sage/50' 
                        : 'border-white/5 bg-[#1e1c18]/30 text-zinc-650 grayscale'
                    }`}
                  >
                    {ach.emoji}
                  </div>
                ))}
              </div>
              {Object.values(unlockedGestures).every(Boolean) ? (
                <p className="text-[9px] text-green-400 italic font-serif leading-tight">
                  ✨ Sanctuary complete! Dandelion waiting to bloom in Stillness (6s)...
                </p>
              ) : (
                <p className="text-[9px] text-zinc-400/80 italic leading-snug font-sans">
                  Perform all 5 gestures (or interact with canvas) to unlock the Stillness Dandelion!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* AMBIENT LAYOUT ENCIRCLEMENTS */}
      <div className={`absolute inset-0 border-[30px] rounded-[48px] pointer-events-none z-10 transition-all duration-[4s] ${isNightMode ? 'border-[#bc6be4]/5 scale-[0.98]' : 'border-[#5a5a40]/5 scale-100 animate-pulse'}`}></div>
      <div className="absolute inset-8 border border-sage/10 rounded-[100px] pointer-events-none z-10"></div>
      <div className="absolute inset-10 border border-ochre/10 rounded-[120px] pointer-events-none z-10"></div>

      {/* CENTERED HEADER & MINIMAL GENERAL CONTROLS CONTROLLER PILL */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 text-center flex flex-col items-center gap-1 z-20 font-serif pointer-events-none">
        <h1 className={`text-2xl font-semibold tracking-tight ${isNightMode ? 'text-[#e0d7c6]' : 'text-[#413f38]'}`}>
          Quiet Garden 🌸
        </h1>
        <p className={`text-xs italic font-serif ${isNightMode ? 'text-[#c9b88c]/70' : 'text-[#5a5a40]/80'}`}>
          Mindful Gesture Sanctuary
        </p>

        {/* Floating audio control and light-theme buttons */}
        <div className="mt-1 relative flex items-center gap-2.5 bg-white/45 backdrop-blur-md px-3 py-1.5 border border-[#1e1c18]/10 rounded-full shadow-[2px_3px_0px_rgba(0,0,0,0.05)] pointer-events-auto">
          <button 
            id="night-toggle-btn"
            onClick={handleToggleNightMode}
            title="Toggle theme light/cozy / ☀️ 🌙 主题切换"
            className="w-7 h-7 rounded-full border border-darkCharcoal/10 hover:bg-darkCharcoal hover:text-cream flex items-center justify-center text-xs cursor-pointer transition-all duration-300"
          >
            {isNightMode ? '🌙' : '☀️'}
          </button>
          
          <button
            id="audio-toggle-btn"
            onClick={handleMuteToggle}
            title="Mute / Turn on botanical chimes / 🔊 音效开关"
            className="w-7 h-7 rounded-full border border-darkCharcoal/10 hover:bg-darkCharcoal hover:text-cream flex items-center justify-center text-xs cursor-pointer transition-all duration-300"
          >
            {audioStatusText === 'RUNNING' ? '🔊' : '🔇'}
          </button>

          {!hasEntered && (
            <span className="text-[10px] uppercase font-sans tracking-wide px-1.5 bg-amber-500/10 text-amber-800 rounded font-bold">Inactive</span>
          )}
          {hasEntered && (
            <span className="text-[10px] uppercase font-sans tracking-wide px-1.5 bg-green-500/15 text-green-700 rounded font-bold">Sanctuary Active</span>
          )}
        </div>
      </header>

      {/* ENTRANCE GATEWAYS OVERLAYS */}
      {!hasEntered && (
        <section id="entrance-gate" className="absolute inset-0 backdrop-blur-lg flex flex-col items-center justify-center text-center z-50 text-cream px-8 select-none bg-[#1e1c18]/95 transition-opacity duration-1000">
          <div className="max-w-xl flex flex-col items-center gap-7">
            <h2 className="font-serif italic text-3xl md:text-5xl text-ochre tracking-wide">Quiet Garden</h2>
            <p className="font-serif italic text-base md:text-lg leading-relaxed text-[#e0d7c6]/85 max-w-md">
              "{entrancePhrase}"
            </p>
            <button
              id="enter-garden-btn"
              onClick={handleEnterGarden}
              className="px-10 py-3.5 bg-sage hover:bg-sage/90 text-cream border-2 border-[#fafaf5]/15 rounded-full font-serif italic text-lg transition-all transform hover:scale-[1.03] cursor-pointer shadow-lg active:translate-y-0.5"
            >
              🌸 Enter Sanctuary Garden
            </button>
            <p className="text-[10px] text-zinc-400 font-sans tracking-wide font-medium">
              Allows webcam to connect hand gesture classifiers. All video remains client-side.
            </p>
          </div>
        </section>
      )}

      {/* MAIN FRAMED GRAPHICS VIEWPORT */}
      <main className="absolute inset-0 flex items-center justify-center pt-20 px-6">
        <div 
          id="viewport-container" 
          className="relative w-[860px] h-[540px] max-w-[95vw] max-h-[70vh] aspect-[860/540] bg-[#e8e4d5] rounded-[48px] border-[10px] border-white/60 shadow-2xl overflow-hidden flex items-center justify-center"
        >
          {/* WEBCAM SOURCE */}
          <video 
            ref={videoRef}
            id="webcam" 
            className="absolute w-full h-full object-cover mirrored pointer-events-none opacity-62 z-0" 
            autoPlay 
            playsInline 
            muted
          />

          {/* RENDERING CANVAS */}
          <canvas 
            ref={canvasRef}
            id="interactive-canvas" 
            className="absolute w-full h-full mirrored cursor-pointer z-10"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleCanvasDoubleClick}
          />

          {/* CAMERA SHUTTER FLASH OVERLAY */}
          {shutterFlash && (
            <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 opacity-100 animate-pulse" />
          )}

          {/* FLOATING LABELS BASE */}
          <div id="caption-layer" className="absolute inset-0 z-20 overflow-hidden pointer-events-none" />

          {/* CAMERA LOADER MASK */}
          {hasEntered && cameraStatus === 'OFF' && (
            <div id="camera-loader" className="absolute inset-0 bg-cream flex flex-col items-center justify-center z-30 p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
                <p className="font-serif italic text-darkCharcoal/70 text-lg">Waking up the digital soil...</p>
              </div>
            </div>
          )}

          {/* CALIBRATION WORKSPACE PROMPT */}
          {calibrationState === 'calibrating' && (
            <div id="calibration-banner" className="absolute inset-x-0 top-1/4 mx-auto max-w-sm bg-cream/95 border-2 border-darkCharcoal p-4 rounded-2xl shadow-xl z-30 text-center animate-pulse">
              <span className="text-xl">✋</span>
              <h4 className="font-serif italic text-darkCharcoal text-sm mt-1">Calibrating Hand Scale</h4>
              <p className="text-[11px] text-darkCharcoal/80 font-sans mt-0.5">Please keep your hand flat and still in front of the camera for 1 second...</p>
            </div>
          )}

          {/* TUTORIAL STEP CARD */}
          {isTutorialActive && (
            <div id="tutorial-overlay" className="absolute top-[12%] left-1/2 -translate-x-1/2 text-center max-w-md bg-cream/95 border-2 border-darkCharcoal px-6 py-4 rounded-[20px] shadow-[4px_4px_0px_#1e1c18] z-30">
              <h3 className="font-serif font-semibold text-darkCharcoal text-base mb-0.5">Guided Sanctuary Practice</h3>
              <p id="tutorial-helper" className="text-xs text-darkCharcoal/90 leading-relaxed font-sans mt-1">
                Step {curTutorialStep + 1} of 5 loading...
              </p>
              <button 
                id="skip-tutorial-btn" 
                onClick={() => {
                  if (enginesRef.current) {
                    enginesRef.current.tutorial.skip();
                    setIsTutorialActive(false);
                  }
                }}
                className="mt-3.5 px-4 py-1 text-[11px] border border-darkCharcoal bg-rose/20 hover:bg-rose/40 rounded-full font-serif font-medium transition-colors cursor-pointer"
              >
                Skip Tutorial
              </button>
            </div>
          )}

          {/* HAND GESTURE UNLOCK / HINTS OVERLAY */}
          {gestureAlert && (
            <div className="absolute inset-0 bg-[#1e1c18]/45 backdrop-blur-sm z-40 flex items-center justify-center p-4">
              <div className="bg-cream/95 text-darkCharcoal border-2 border-darkCharcoal max-w-sm w-full rounded-2xl shadow-[6px_6px_0px_#1e1c18] p-5 flex flex-col items-center gap-3.5">
                <div className="text-center">
                  <div className="text-3xl mb-1">{gestureAlert.emoji}</div>
                  <h3 className="font-serif font-bold text-sm tracking-tight text-darkCharcoal">
                    {gestureAlert.title} Unlocked!
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-sage tracking-wider mt-0.5">
                    Gesture Path Discovered ✨
                  </p>
                </div>

                {/* Simplified ASCII outline sketch */}
                <div className="bg-[#1e1c18] text-green-300 font-mono text-[9px] p-2.5 rounded-lg border border-zinc-700 tracking-widest text-left whitespace-pre select-none w-32 shadow-inner">
                  <div className="text-zinc-500 text-[8px] italic text-center mb-1 border-b border-zinc-700/50 pb-0.5 select-none">{gestureAlert.sketchName}</div>
                  {gestureAlert.sketchLines.join('\n')}
                </div>

                <p className="text-[11px] text-darkCharcoal/80 leading-relaxed font-sans text-center max-w-[280px]">
                  {gestureAlert.desc}
                </p>

                <div className="text-[9px] text-[#5a5a40]/60 italic font-medium mt-1">
                  Click/tap target space or hold hand to practice.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CORNER 3: BOTTOM-LEFT MODULE —— DIAGNOSTIC CONTROL CONSOLE (COLLAPSIBLE) */}
      {hasEntered && (
        <div className="fixed bottom-6 left-6 z-20 flex flex-col items-start gap-2.5 pointer-events-auto">
          {/* Collapse/Expand action trigger pill */}
          <button
            onClick={() => setIsDebugOpen(prev => !prev)}
            className="px-3.5 py-1.5 bg-darkCharcoal/85 backdrop-blur-xl border border-[#e0d7c6]/15 rounded-full text-cream text-[11px] font-semibold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all active:scale-95 z-30"
          >
            <span>🔧 {isDebugOpen ? 'Hide Debug' : 'Debug'}</span>
          </button>

          {/* Diagnostic & Wristband integrated module panel */}
          {isDebugOpen && (
            <div className="bg-darkCharcoal/85 backdrop-blur-xl text-[#e0d7c6] font-mono text-[10px] leading-relaxed p-4 rounded-2xl border border-white/10 w-56 shadow-xl flex flex-col gap-3.5">
              {/* Telemetry Logger */}
              <div>
                <h5 className="font-bold text-cream border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between font-sans">
                  <span>LOGGER TELEMETRY</span>
                  <span className="text-[8px] px-1 border border-sage text-sage rounded uppercase font-mono scale-95 origin-right">DIAG</span>
                </h5>
                <div className="space-y-0.5">
                  <div className="flex justify-between gap-4"><span>Camera Source:</span> <span className={`${cameraStatus === 'ON' ? 'text-green-400' : 'text-red-400'} font-semibold font-mono`}>{cameraStatus}</span></div>
                  <div className="flex justify-between gap-4"><span>Hand Detected:</span> <span className={`${handDetected ? 'text-green-400' : 'text-red-400'} font-semibold font-mono`}>{handDetected ? 'YES' : 'NO'}</span></div>
                  <div className="flex justify-between gap-4"><span>Face Detected:</span> <span className={`${faceDetected ? 'text-green-400' : 'text-red-400'} font-semibold font-mono`}>{faceDetected ? 'YES' : 'NO'}</span></div>
                  <div className="flex justify-between gap-4"><span>Active Gesture:</span> <span className="text-amber-300 font-mono text-right truncate overflow-ellipsis leading-tight max-w-[100px]">{activeGestureText}</span></div>
                  <div className="flex justify-between gap-4"><span>Audio Channels:</span> <span className="text-amber-300 font-mono">{audioStatusText}</span></div>
                  <div className="flex justify-between gap-4"><span>Rendering FPS:</span> <span className="text-green-400 font-mono">{fps}</span></div>
                </div>
              </div>

              {/* Wristband hardware metrics */}
              <div className="border-t border-[#e0d7c6]/10 pt-2.5">
                <h5 className="font-bold text-cream pb-1 mb-1.5 flex items-center justify-between font-sans">
                  <span>WRISTBAND DEVICE</span>
                  <span className="text-[8px] px-1 border border-amber-400/40 text-amber-300 rounded uppercase font-mono scale-95 origin-right">SIMULATE</span>
                </h5>
                <div className="space-y-0.5">
                  <div className="flex justify-between gap-4">
                    <span>Heart Pulse:</span>
                    <span className="text-rose-400 font-semibold font-mono drop-shadow-[0_0_4px_rgba(244,63,94,0.4)] animate-pulse">{hr} bpm</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Step Count:</span>
                    <span className="text-emerald-400 font-semibold font-mono drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]">{steps} steps</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Bloom Factor:</span>
                    <span className="text-amber-300 font-mono">{bloomFactor.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORNER 4: BOTTOM-RIGHT MODULE —— SANCTUARY CONTROLS & GESTURE REFERENCE */}
      {hasEntered && (
        <section id="settings-panel" className="fixed bottom-6 right-6 bg-darkCharcoal/85 backdrop-blur-xl rounded-2xl p-4 w-68 z-20 select-none border border-[#e0d7c6]/15 shadow-xl text-[#e0d7c6] font-sans pointer-events-auto">
          <h4 className="font-serif italic text-cream text-[13px] mb-2.5 border-b border-[#e0d7c6]/10 pb-1.5 flex justify-between items-center tracking-wide">
            <span>Sanctuary Settings</span>
            <span className="text-[9px] font-sans non-italic tracking-wider opacity-60">CONTROLS</span>
          </h4>
          <div id="settings-content" className="space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span>🌸 Bloom Flower Trail</span>
              <input 
                type="checkbox" 
                checked={bloomEnabled} 
                onChange={(e) => setBloomEnabled(e.target.checked)}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>🦋 Butterfly Release</span>
              <input 
                type="checkbox" 
                checked={butterfliesEnabled} 
                onChange={(e) => setButterfliesEnabled(e.target.checked)}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>🌧️ Rainfall Effect</span>
              <input 
                type="checkbox" 
                checked={rainEnabled} 
                onChange={(e) => setRainEnabled(e.target.checked)}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>⭐ Starburst Flash</span>
              <input 
                type="checkbox" 
                checked={starsEnabled} 
                onChange={(e) => setStarsEnabled(e.target.checked)}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>🍃 Particle Intensity</span>
                <span id="density-val">{particleIntensity.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.2" 
                max="2.0" 
                step="0.2" 
                value={particleIntensity} 
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  setParticleIntensity(parsed);
                  if (enginesRef.current) {
                    enginesRef.current.particles.handleFallingPetals(860, steps);
                  }
                }}
                className="w-full accent-sage cursor-pointer h-1 rounded bg-[#e0d7c6]/20" 
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#e0d7c6]/10 pt-2.5 mt-1.5">
              <span>⚡ Low Power Governor</span>
              <input 
                type="checkbox" 
                checked={lowPowerMode} 
                onChange={(e) => setLowPowerMode(e.target.checked)}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>
            
            <div className="flex items-center justify-between pb-1">
              <span>🔇 Lite Mode (Offline-first)</span>
              <input 
                type="checkbox" 
                checked={liteMode} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setLiteMode(checked);
                  if (checked) {
                    setParticleIntensity(0.2);
                  } else {
                    setParticleIntensity(1.0);
                  }
                }}
                className="accent-sage cursor-pointer w-3.5 h-3.5"
              />
            </div>

            <button
              onClick={handleInitiateCalibration}
              className="w-full py-1.5 bg-sage/20 border border-sage/60 text-cream rounded-full hover:bg-sage/40 font-serif text-[11px] tracking-wide italic cursor-pointer transition-colors mt-1"
            >
              ✋ Calibrate Hand Scale
            </button>

            {/* QUICK GESTURE CHEAT-SHEET REFERENCE */}
            <div className="border-t border-[#e0d7c6]/10 pt-2.5 mt-2.5">
              <span className="text-[9px] uppercase tracking-wider font-bold text-cream/70 block mb-1.5">
                ✊🖐️👆🤏✋ Gestures Quick Reference
              </span>
              <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
                <div className="bg-[#1e1c18]/40 p-1.5 rounded flex flex-col justify-center items-center" title="Fist: Butterfly Clench (握拳)">
                  <span className="text-xs block">✊</span>
                  <span className="text-[6.5px] text-zinc-400 tracking-tighter">Clench</span>
                </div>
                <div className="bg-[#1e1c18]/40 p-1.5 rounded flex flex-col justify-center items-center" title="Open Palm: Flower Trail (张掌)">
                  <span className="text-xs block">🖐️</span>
                  <span className="text-[6.5px] text-zinc-400 tracking-tighter">Bloom</span>
                </div>
                <div className="bg-[#1e1c18]/40 p-1.5 rounded flex flex-col justify-center items-center" title="Index: Rain Tap (下点)">
                  <span className="text-xs block">👆</span>
                  <span className="text-[6.5px] text-zinc-400 tracking-tighter">Rain</span>
                </div>
                <div className="bg-[#1e1c18]/40 p-1.5 rounded flex flex-col justify-center items-center" title="Pinch: Pinch Droplet (捏合)">
                  <span className="text-xs block">🤏</span>
                  <span className="text-[6.5px] text-zinc-400 tracking-tighter">Pinch</span>
                </div>
                <div className="bg-[#1e1c18]/40 p-1.5 rounded flex flex-col justify-center items-center" title="Stillness: Stillness Sprout (静止)">
                  <span className="text-xs block">✋</span>
                  <span className="text-[6.5px] text-zinc-400 tracking-tighter">Still</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EXPANDED COLUMNS —— POLAROID TRIGGER (📷) BUTTON */}
      {hasEntered && (
        <button
          id="polaroid-take-btn"
          onClick={() => {
            if (takeSnapshotRef.current) {
              takeSnapshotRef.current();
            }
          }}
          title="Take Polaroid Snapshot / 📷 拍立得快照"
          className="fixed right-[56px] top-[140px] w-12 h-12 rounded-full bg-sage hover:bg-sage/90 text-cream border-2 border-white/65 shadow-[2px_3px_8px_rgba(0,0,0,0.18)] flex items-center justify-center text-xl cursor-pointer transition-all duration-300 hover:rotate-12 transform hover:scale-110 active:scale-95 z-40"
        >
          📷
        </button>
      )}

      {/* POLAROID MEMOIRS VERTICAL PHOTO WALL (HEALING FLORA) */}
      {hasEntered && (
        <section 
          id="polaroid-photo-wall" 
          className="fixed right-6 top-[204px] bottom-[485px] w-28 min-h-[140px] max-h-[340px] overflow-y-auto flex flex-col gap-3.5 items-center z-25 p-2 pointer-events-auto select-none bg-darkCharcoal/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg hover:bg-darkCharcoal/45 transition-all duration-300"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {photos.length > 0 ? (
            <div className="flex flex-col gap-1 w-full items-center mb-1 bg-[#1e1c18]/85 backdrop-blur-xl p-1.5 rounded-lg border border-[#e0d7c6]/15 shadow-sm text-[#e0d7c6] text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider font-mono opacity-80 leading-none">
                🎞️ Memoirs
              </div>
              <button 
                onClick={handleClearPhotos}
                className="text-[8px] uppercase tracking-wider font-bold text-red-400 hover:text-red-500 cursor-pointer bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded transition-all leading-none mt-1"
              >
                Clear All
              </button>
            </div>
          ) : (
            <div className="text-[9px] text-[#e0d7c6]/40 text-center font-sans py-4 leading-relaxed font-semibold">
              No flora memories<br/>yet.<br/><br/>Click 📷 above to freeze moment.
            </div>
          )}
          
          <div className="flex flex-col gap-3 w-full items-center">
            {photos.map((photo, idx) => {
              const rotationClasses = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1'];
              const rotation = rotationClasses[idx % rotationClasses.length];
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  onDoubleClick={() => handleDeletePhoto(photo.id)}
                  className={`group relative bg-[#fafaf6] p-1 pb-3 border border-neutral-300/60 shadow-[2px_3px_6px_rgba(0,0,0,0.12)] cursor-pointer hover:rotate-0 hover:scale-105 active:scale-95 transition-all duration-300 w-24 ${rotation} select-none`}
                >
                  <div className="bg-neutral-900 border border-neutral-200 aspect-square overflow-hidden flex items-center justify-center">
                    <img 
                      src={photo.dataUrl} 
                      alt="Polaroid memory" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[6px] text-neutral-500 font-mono text-center mt-1 tracking-tighter truncate overflow-ellipsis leading-none select-none">
                    {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-cream flex items-center justify-center text-[9px] hover:scale-110 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer z-10"
                    title="Delete Memory"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* POLAROID EXPANDED LIGHTBOX VIEW */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-darkCharcoal/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300 cursor-zoom-out"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-[#fafaf6] p-4 pb-10 rounded-xs border-8 border-white shadow-[0_12px_24px_rgba(0,0,0,0.3)] max-w-lg w-full max-h-[85vh] flex flex-col items-center gap-4 relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2.5 text-2xl text-darkCharcoal/55 hover:text-darkCharcoal hover:scale-110 transition-transform font-bold cursor-pointer"
              title="Close View"
            >
              ×
            </button>
            <div className="bg-neutral-900 border border-neutral-300 w-full overflow-hidden aspect-[860/540] rounded shadow-inner">
              <img 
                src={selectedPhoto.dataUrl} 
                alt="Enlarged Polaroid memory" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center font-serif italic text-darkCharcoal/75 text-xs tracking-wide">
              ✨ Captured on {new Date(selectedPhoto.timestamp).toLocaleDateString()} at {new Date(selectedPhoto.timestamp).toLocaleTimeString()}
            </div>
            <div className="flex gap-4 mt-1">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedPhoto.dataUrl;
                  link.download = `quiet_garden_polaroid_${selectedPhoto.id}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3.5 py-1.5 bg-sage text-cream text-[10px] font-sans rounded-full hover:bg-sage/90 transition-all shadow border border-white/20 flex items-center gap-1 cursor-pointer font-semibold"
              >
                📥 Save Photo
              </button>
              <button
                onClick={() => {
                  handleDeletePhoto(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="px-3.5 py-1.5 bg-red-500 text-cream text-[10px] font-sans rounded-full hover:bg-red-600 transition-all shadow flex items-center gap-1 cursor-pointer font-semibold"
              >
                🗑️ Erase Moment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}