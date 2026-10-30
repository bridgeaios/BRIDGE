import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Trophy, Zap, Shield, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { gameAudio } from './gameAudio';
import { triggerHaptic } from '../../utils/haptics';

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

interface ItemParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export const CircuitRunner3D: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // High-level Game Shell State
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('bb_runner_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [multiplier, setMultiplier] = useState(1);
  const [batteryShield, setBatteryShield] = useState(100);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Internal mutable simulation references to prevent React re-render lag
  const simRef = useRef({
    score: 0,
    multiplier: 1,
    combo: 0,
    batteryShield: 100,
    distance: 0,
    speed: 28, // units/sec
    targetLane: 1, // 0 = left, 1 = center, 2 = right
    playerX: 0,
    playerY: 0,
    isJumping: false,
    jumpVelocity: 0,
    hitstopTimer: 0,
    cameraShake: 0,
    state: 'title' as GameState,
    particles: [] as ItemParticle[],
    items: [] as {
      mesh: THREE.Group | THREE.Mesh;
      type: 'gear' | 'battery' | 'receipt' | 'hazard' | 'barrier';
      lane: number;
      z: number;
      collected: boolean;
    }[],
  });

  const keysHeld = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  // Track lanes: left (-3.5), center (0), right (3.5)
  const LANES = [-3.5, 0, 3.5];

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.018);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 4.5, 8);
    camera.lookAt(0, 1.2, -6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- 2. LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0aa, 1.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Dynamic player neon point light
    const playerLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
    playerLight.position.set(0, 1.5, 0);
    scene.add(playerLight);

    // --- 3. WORKSHOP CIRCUIT TRACK & ENVIRONMENT ---
    const trackWidth = 12;
    const trackLength = 220;
    const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLength, 12, 60);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.2,
      metalness: 0.8,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.z = -trackLength / 2 + 10;
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Glowing Neon Rails along the track
    const railMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, trackLength), railMat);
    leftRail.position.set(-trackWidth / 2, 0.2, -trackLength / 2 + 10);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, trackLength), railMat);
    rightRail.position.set(trackWidth / 2, 0.2, -trackLength / 2 + 10);
    scene.add(rightRail);

    // Grid lane divider lines
    const laneLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const laneLine1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, trackLength), laneLineMat);
    laneLine1.position.set(-1.75, 0.02, -trackLength / 2 + 10);
    scene.add(laneLine1);

    const laneLine2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, trackLength), laneLineMat);
    laneLine2.position.set(1.75, 0.02, -trackLength / 2 + 10);
    scene.add(laneLine2);

    // Floating Lab Pillars / Circuit Arches in background
    const archGroup = new THREE.Group();
    for (let z = 0; z > -trackLength; z -= 30) {
      const archMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
      const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 0.8), archMat);
      archLeft.position.set(-trackWidth / 2 - 1.5, 6, z);
      const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 0.8), archMat);
      archRight.position.set(trackWidth / 2 + 1.5, 6, z);
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 4, 0.8, 0.8), archMat);
      archTop.position.set(0, 12, z);

      archGroup.add(archLeft, archRight, archTop);
    }
    scene.add(archGroup);

    // --- 4. PLAYER HERO: COMPOSITE PROCEDURAL TINKERER ROVER ---
    const playerGroup = new THREE.Group();

    // Rover Chassis (Chunky Neo-Brutalist Hull)
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 2.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright Tinkerer Yellow
      metalness: 0.3,
      roughness: 0.4,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.5;
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);

    // Dual Hover Jet Thrusters
    const jetGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.8, 16);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const jetLeft = new THREE.Mesh(jetGeo, jetMat);
    jetLeft.rotation.x = Math.PI / 2;
    jetLeft.position.set(-0.9, 0.5, 0.9);
    const jetRight = new THREE.Mesh(jetGeo, jetMat);
    jetRight.rotation.x = Math.PI / 2;
    jetRight.position.set(0.9, 0.5, 0.9);
    playerGroup.add(jetLeft, jetRight);

    // Thruster Flames (Glowing Cyan Mesh)
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const flameLeft = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), flameMat);
    flameLeft.rotation.x = -Math.PI / 2;
    flameLeft.position.set(-0.9, 0.5, 1.5);
    const flameRight = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), flameMat);
    flameRight.rotation.x = -Math.PI / 2;
    flameRight.position.set(0.9, 0.5, 1.5);
    playerGroup.add(flameLeft, flameRight);

    // Articulated Sensor Dome & Glowing Visor
    const domeGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.set(0, 0.95, -0.2);
    playerGroup.add(domeMesh);

    const visorGeo = new THREE.BoxGeometry(0.65, 0.2, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Emerald Neon
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.95, -0.55);
    playerGroup.add(visorMesh);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    // --- 5. PARTICLE SYSTEM (Pooled Item Collection Bursts) ---
    const maxParticles = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(maxParticles * 3);
    const particleColors = new Float32Array(maxParticles * 3);
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    function spawnBurst(pos: THREE.Vector3, colorHex: number, count: number = 15) {
      const color = new THREE.Color(colorHex);
      for (let i = 0; i < count; i++) {
        if (simRef.current.particles.length >= maxParticles) {
          simRef.current.particles.shift();
        }
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        );
        simRef.current.particles.push({
          position: pos.clone(),
          velocity: vel,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.25,
          color,
        });
      }
    }

    // --- 6. PROCEDURAL SPAWNERS FOR ITEMS & HAZARDS ---
    const gearGeo = new THREE.TorusGeometry(0.6, 0.2, 12, 24);
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });

    const batteryGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
    });

    const receiptGeo = new THREE.BoxGeometry(0.7, 0.05, 1.1);
    const receiptMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      emissive: 0x93c5fd,
      emissiveIntensity: 0.3,
    });

    const hazardGeo = new THREE.ConeGeometry(0.7, 1.4, 8);
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red Hazard Spark
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.8,
    });

    const barrierGeo = new THREE.BoxGeometry(2.4, 1.0, 0.5);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange Barrier
      metalness: 0.5,
      roughness: 0.4,
    });

    function spawnWave(zOffset: number) {
      // Pick random lanes
      const laneA = Math.floor(Math.random() * 3);
      let laneB = (laneA + 1 + Math.floor(Math.random() * 2)) % 3;

      // Item 1: Collectible (Gear, Battery, or Receipt)
      const roll = Math.random();
      let itemType: 'gear' | 'battery' | 'receipt' = 'gear';
      let itemMesh: THREE.Mesh;

      if (roll < 0.6) {
        itemType = 'gear';
        itemMesh = new THREE.Mesh(gearGeo, gearMat);
      } else if (roll < 0.85) {
        itemType = 'battery';
        itemMesh = new THREE.Mesh(batteryGeo, batteryMat);
      } else {
        itemType = 'receipt';
        itemMesh = new THREE.Mesh(receiptGeo, receiptMat);
      }

      itemMesh.position.set(LANES[laneA], 0.9, zOffset);
      itemMesh.castShadow = true;
      scene.add(itemMesh);
      simRef.current.items.push({
        mesh: itemMesh,
        type: itemType,
        lane: laneA,
        z: zOffset,
        collected: false,
      });

      // Item 2: Hazard or Barrier in another lane
      const hazardRoll = Math.random();
      let hazMesh: THREE.Mesh;
      let hazType: 'hazard' | 'barrier' = 'hazard';

      if (hazardRoll < 0.5) {
        hazType = 'hazard';
        hazMesh = new THREE.Mesh(hazardGeo, hazardMat);
        hazMesh.position.set(LANES[laneB], 0.7, zOffset);
      } else {
        hazType = 'barrier';
        hazMesh = new THREE.Mesh(barrierGeo, barrierMat);
        hazMesh.position.set(LANES[laneB], 0.5, zOffset);
      }

      hazMesh.castShadow = true;
      scene.add(hazMesh);
      simRef.current.items.push({
        mesh: hazMesh,
        type: hazType,
        lane: laneB,
        z: zOffset,
        collected: false,
      });
    }

    // Populate initial items ahead
    for (let z = -20; z > -trackLength; z -= 14) {
      spawnWave(z);
    }

    // --- 7. KEYBOARD & INPUT CONTROLS ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (simRef.current.state === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          startGame();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        togglePause();
        return;
      }

      if (simRef.current.state !== 'playing') return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        steerLeft();
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        steerRight();
      } else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        triggerJump();
      }
    };

    const handleKeyUp = (_e: KeyboardEvent) => {};

    const handleBlur = () => {
      keysHeld.current = { left: false, right: false, jump: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // --- 8. ACTION HELPERS ---
    const steerLeft = () => {
      if (simRef.current.targetLane > 0) {
        simRef.current.targetLane -= 1;
        triggerHaptic.light();
      }
    };

    const steerRight = () => {
      if (simRef.current.targetLane < 2) {
        simRef.current.targetLane += 1;
        triggerHaptic.light();
      }
    };

    const triggerJump = () => {
      if (!simRef.current.isJumping) {
        simRef.current.isJumping = true;
        simRef.current.jumpVelocity = 11;
        gameAudio.playJump();
        triggerHaptic.medium();
      }
    };

    const startGame = () => {
      simRef.current.score = 0;
      simRef.current.multiplier = 1;
      simRef.current.combo = 0;
      simRef.current.batteryShield = 100;
      simRef.current.distance = 0;
      simRef.current.speed = 28;
      simRef.current.targetLane = 1;
      simRef.current.playerX = 0;
      simRef.current.playerY = 0;
      simRef.current.isJumping = false;
      simRef.current.state = 'playing';

      setScore(0);
      setMultiplier(1);
      setBatteryShield(100);
      setDistanceMeters(0);
      setGameState('playing');

      gameAudio.playPowerup();
      triggerHaptic.celebrate();
    };

    const togglePause = () => {
      if (simRef.current.state === 'playing') {
        simRef.current.state = 'paused';
        setGameState('paused');
      } else if (simRef.current.state === 'paused') {
        simRef.current.state = 'playing';
        setGameState('playing');
      }
    };

    // Attach actions to window for touch pad buttons
    (window as any).__runnerSteerLeft = steerLeft;
    (window as any).__runnerSteerRight = steerRight;
    (window as any).__runnerJump = triggerJump;
    (window as any).__runnerStart = startGame;

    // --- 9. 60FPS SIMULATION CLOCK LOOP ---
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling on frame drop

      // Hitstop logic on heavy impact
      if (simRef.current.hitstopTimer > 0) {
        simRef.current.hitstopTimer -= dt;
        return;
      }

      const sim = simRef.current;

      // TITLE SCREEN ORBIT ANIMATION
      if (sim.state === 'title') {
        const time = clock.getElapsedTime();
        camera.position.x = Math.sin(time * 0.4) * 5;
        camera.position.z = Math.cos(time * 0.4) * 6 + 2;
        camera.position.y = 4.2 + Math.sin(time * 0.8) * 0.4;
        camera.lookAt(playerGroup.position.x, 1.2, playerGroup.position.z);

        // Hover bobbing
        playerGroup.position.y = 0.5 + Math.sin(time * 3) * 0.12;
        renderer.render(scene, camera);
        return;
      }

      if (sim.state === 'paused') {
        renderer.render(scene, camera);
        return;
      }

      // PLAYING LOOP
      if (sim.state === 'playing') {
        // Distance & smooth difficulty ramp
        sim.distance += sim.speed * dt;
        sim.speed = 28 + Math.min(sim.distance * 0.015, 24); // Ramps up smoothly
        setDistanceMeters(Math.floor(sim.distance));

        // Lateral lane interpolation
        const targetX = LANES[sim.targetLane];
        sim.playerX += (targetX - sim.playerX) * 14 * dt;
        playerGroup.position.x = sim.playerX;

        // Banking tilt on steering
        const tilt = (targetX - sim.playerX) * -0.15;
        playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, tilt, 12 * dt);

        // Vertical Jump & Gravity simulation
        if (sim.isJumping) {
          sim.playerY += sim.jumpVelocity * dt;
          sim.jumpVelocity -= 28 * dt; // Gravity
          if (sim.playerY <= 0) {
            sim.playerY = 0;
            sim.isJumping = false;
            sim.jumpVelocity = 0;
          }
        }
        playerGroup.position.y = sim.playerY + 0.35 + Math.sin(clock.getElapsedTime() * 6) * 0.08;

        // Camera follow with decaying shake
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (sim.cameraShake > 0) {
          shakeOffsetX = (Math.random() - 0.5) * sim.cameraShake;
          shakeOffsetY = (Math.random() - 0.5) * sim.cameraShake;
          sim.cameraShake = Math.max(0, sim.cameraShake - dt * 3.5);
        }

        camera.position.x = sim.playerX * 0.6 + shakeOffsetX;
        camera.position.y = 4.5 + sim.playerY * 0.3 + shakeOffsetY;
        camera.position.z = 8;
        camera.lookAt(sim.playerX * 0.8, 1.4 + sim.playerY * 0.2, -10);

        playerLight.position.x = sim.playerX;
        playerLight.position.y = sim.playerY + 1.2;

        // Move items toward camera & test collisions
        for (let i = sim.items.length - 1; i >= 0; i--) {
          const item = sim.items[i];
          item.mesh.position.z += sim.speed * dt;

          // Item rotations
          if (item.type === 'gear') {
            item.mesh.rotation.y += dt * 3.5;
            item.mesh.rotation.x += dt * 2.0;
          } else if (item.type === 'battery' || item.type === 'receipt') {
            item.mesh.rotation.y += dt * 2.5;
          }

          // Collision check with player
          const distZ = Math.abs(item.mesh.position.z - playerGroup.position.z);
          const distX = Math.abs(item.mesh.position.x - sim.playerX);

          if (!item.collected && distZ < 1.3 && distX < 1.4) {
            if (item.type === 'gear') {
              item.collected = true;
              scene.remove(item.mesh);
              sim.combo += 1;
              const points = 100 * sim.multiplier;
              sim.score += points;
              if (sim.combo % 4 === 0) {
                sim.multiplier = Math.min(sim.multiplier + 1, 5);
                setMultiplier(sim.multiplier);
              }
              setScore(sim.score);
              gameAudio.playGearPickup(sim.combo);
              spawnBurst(item.mesh.position, 0xfbbf24, 16);
              triggerHaptic.light();
            } else if (item.type === 'battery') {
              item.collected = true;
              scene.remove(item.mesh);
              sim.batteryShield = Math.min(100, sim.batteryShield + 35);
              setBatteryShield(sim.batteryShield);
              sim.score += 200;
              setScore(sim.score);
              gameAudio.playPowerup();
              spawnBurst(item.mesh.position, 0x10b981, 22);
              triggerHaptic.medium();
            } else if (item.type === 'receipt') {
              item.collected = true;
              scene.remove(item.mesh);
              sim.score += 350 * sim.multiplier;
              setScore(sim.score);
              gameAudio.playGearPickup(5);
              spawnBurst(item.mesh.position, 0x60a5fa, 20);
              triggerHaptic.heavy();
            } else if (item.type === 'hazard' || item.type === 'barrier') {
              // Only hit if player is NOT high enough in jump
              if (sim.playerY < 1.1) {
                item.collected = true;
                scene.remove(item.mesh);

                // Hit feedback
                sim.combo = 0;
                sim.multiplier = 1;
                setMultiplier(1);
                sim.hitstopTimer = 0.055; // 55ms hitstop
                sim.cameraShake = 0.65; // Screen shake
                sim.batteryShield -= item.type === 'barrier' ? 40 : 25;
                setBatteryShield(Math.max(0, sim.batteryShield));

                gameAudio.playHit();
                triggerHaptic.heavy();
                spawnBurst(item.mesh.position, 0xef4444, 25);

                // Game Over Check
                if (sim.batteryShield <= 0) {
                  sim.state = 'gameover';
                  setGameState('gameover');
                  gameAudio.playGameOver();
                  if (sim.score > highScore) {
                    setHighScore(sim.score);
                    try {
                      localStorage.setItem('bb_runner_high_score', sim.score.toString());
                    } catch {}
                  }
                }
              }
            }
          }

          // Respawn past camera
          if (item.mesh.position.z > 14) {
            scene.remove(item.mesh);
            sim.items.splice(i, 1);
          }
        }

        // Keep item pipeline filled
        const furthestZ = sim.items.reduce((min, it) => Math.min(min, it.mesh.position.z), 0);
        if (furthestZ > -trackLength + 20) {
          spawnWave(furthestZ - 14);
        }

        // Particle simulation
        const pPositions = particleGeo.attributes.position.array as Float32Array;
        const pColors = particleGeo.attributes.color.array as Float32Array;
        for (let i = 0; i < maxParticles; i++) {
          if (i < sim.particles.length) {
            const p = sim.particles[i];
            p.life += dt;
            p.position.addScaledVector(p.velocity, dt);
            p.velocity.y -= 14 * dt; // Particle gravity

            pPositions[i * 3] = p.position.x;
            pPositions[i * 3 + 1] = p.position.y;
            pPositions[i * 3 + 2] = p.position.z;

            pColors[i * 3] = p.color.r;
            pColors[i * 3 + 1] = p.color.g;
            pColors[i * 3 + 2] = p.color.b;

            if (p.life >= p.maxLife) {
              sim.particles.splice(i, 1);
            }
          } else {
            pPositions[i * 3 + 1] = -999; // Offscreen
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
        particleGeo.attributes.color.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // --- 10. RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);

      // Dispose three.js resources
      renderer.dispose();
      trackGeo.dispose();
      trackMat.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      gearGeo.dispose();
      gearMat.dispose();
      batteryGeo.dispose();
      batteryMat.dispose();
      receiptGeo.dispose();
      receiptMat.dispose();
      hazardGeo.dispose();
      hazardMat.dispose();
      barrierGeo.dispose();
      barrierMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleStartCTA = () => {
    if ((window as any).__runnerStart) {
      (window as any).__runnerStart();
    }
  };

  const handleMuteToggle = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="relative w-full h-[88vh] min-h-[580px] rounded-3xl overflow-hidden border-4 border-slate-900 shadow-[8px_8px_0px_#000000] bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Viewport Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WORLD-MATCHED, LOW-OCCLUSION HUD OVERLAY (<15% occlusion) */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          {/* Top Status Cluster */}
          <div className="flex items-center justify-between gap-3">
            {/* Score & Combo Multiplier */}
            <div className="bg-slate-900/90 border-3 border-amber-400 rounded-2xl px-4 py-2 shadow-[4px_4px_0px_#000] flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  SCORE • MULTIPLIER
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight">
                  {score.toLocaleString()} <span className="text-amber-400 text-sm font-black">x{multiplier}</span>
                </div>
              </div>
            </div>

            {/* Shield Bar & Distance */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-900/90 border-3 border-emerald-400 rounded-2xl px-4 py-2 shadow-[4px_4px_0px_#000] flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center justify-between gap-2">
                    <span>BATTERY SHIELD</span>
                    <span className="tabular-nums font-bold">{batteryShield}%</span>
                  </div>
                  {/* Health meter */}
                  <div className="w-28 sm:w-36 h-2.5 bg-slate-800 rounded-full border border-slate-700 overflow-hidden mt-0.5">
                    <div
                      className={`h-full transition-all duration-150 ${
                        batteryShield > 40 ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                      }`}
                      style={{ width: `${Math.max(0, batteryShield)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mute button */}
              <button
                onClick={handleMuteToggle}
                className="pointer-events-auto chunky-btn p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white shadow-[2px_2px_0px_#000]"
                title="Mute / Unmute"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Bottom Mobile Tactile Touch Controls */}
          <div className="flex items-end justify-between gap-4 pointer-events-auto pt-4">
            {/* Steering Touch Buttons */}
            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => (window as any).__runnerSteerLeft?.()}
                onClick={() => (window as any).__runnerSteerLeft?.()}
                className="chunky-btn w-16 h-16 rounded-2xl bg-amber-400 active:bg-amber-500 border-3 border-slate-900 shadow-[4px_4px_0px_#000] flex items-center justify-center text-slate-950 font-black text-2xl active:translate-y-1"
                aria-label="Steer Left"
              >
                <ArrowLeft className="w-8 h-8 stroke-[3]" />
              </button>

              <button
                onTouchStart={() => (window as any).__runnerSteerRight?.()}
                onClick={() => (window as any).__runnerSteerRight?.()}
                className="chunky-btn w-16 h-16 rounded-2xl bg-amber-400 active:bg-amber-500 border-3 border-slate-900 shadow-[4px_4px_0px_#000] flex items-center justify-center text-slate-950 font-black text-2xl active:translate-y-1"
                aria-label="Steer Right"
              >
                <ArrowRight className="w-8 h-8 stroke-[3]" />
              </button>
            </div>

            {/* Jump / Turbo Button */}
            <button
              onTouchStart={() => (window as any).__runnerJump?.()}
              onClick={() => (window as any).__runnerJump?.()}
              className="chunky-btn px-6 h-16 rounded-2xl bg-cyan-400 active:bg-cyan-500 border-3 border-slate-900 shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 text-slate-950 font-black text-lg active:translate-y-1"
              aria-label="Jump / Boost"
            >
              <ArrowUp className="w-7 h-7 stroke-[3]" />
              <span>JUMP</span>
            </button>
          </div>
        </div>
      )}

      {/* GAME SHELL 1: TITLE SCREEN OVERLAY */}
      {gameState === 'title' && (
        <div className="absolute inset-0 bg-slate-950/65 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="max-w-md w-full space-y-6">
            {/* Bespoke Inline SVG Title Lockup */}
            <div className="relative inline-block">
              <svg viewBox="0 0 380 90" className="w-full h-auto drop-shadow-[0_4px_12px_rgba(250,204,21,0.5)]">
                <defs>
                  <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FACC15" />
                    <stop offset="50%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="370" height="80" rx="20" fill="#0F172A" stroke="#FACC15" strokeWidth="4" />
                <text
                  x="190"
                  y="45"
                  textAnchor="middle"
                  fill="url(#titleGrad)"
                  fontSize="28"
                  fontWeight="900"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="2"
                >
                  CIRCUIT RUSH 3D
                </text>
                <text
                  x="190"
                  y="68"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="monospace"
                  letterSpacing="4"
                >
                  TINKERER WORKSHOP RUNNER
                </text>
              </svg>
            </div>

            {/* High score badge */}
            {highScore > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-300 font-black text-xs">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>ALL-TIME RECORD: {highScore.toLocaleString()} PTS</span>
              </div>
            )}

            {/* Primary Start CTA Button */}
            <button
              onClick={handleStartCTA}
              className="chunky-btn w-full py-4 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-4 border-slate-950 font-black text-xl tracking-tight shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-none transition-transform"
            >
              ⚡ LAUNCH RUN [SPACE / ENTER]
            </button>

            {/* Single Flat Control-Hint Line */}
            <p className="text-xs font-mono font-bold text-slate-400 tracking-wider">
              WASD / Arrows Steer · Space Jump/Boost · Esc Pause
            </p>

            {onExit && (
              <button
                onClick={onExit}
                className="text-xs font-bold text-slate-400 hover:text-white underline pt-2"
              >
                ← Return to Hub Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* GAME SHELL 2: PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 max-w-sm w-full text-center shadow-[8px_8px_0px_#000] space-y-4">
            <h3 className="text-2xl font-black text-yellow-400 tracking-tight">RUN PAUSED</h3>
            <p className="text-xs font-bold text-slate-300">Take a breath, check your tools, and resume when ready!</p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleStartCTA}
                className="chunky-btn w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-3 border-slate-950 font-black text-sm shadow-[3px_3px_0px_#000] active:translate-y-0.5"
              >
                RESUME RUN
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  className="chunky-btn w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 font-black text-xs"
                >
                  Exit to Hub
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAME SHELL 3: GAME OVER MODAL */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-4 border-rose-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-[8px_8px_0px_#000] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-3xl">
              💥
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-400 tracking-tight">CIRCUIT OVERLOAD!</h3>
              <p className="text-xs font-bold text-slate-400">Battery depleted by workshop hazards.</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border-2 border-slate-800 space-y-1">
              <div className="text-xs font-bold text-slate-400">FINAL SCORE</div>
              <div className="text-3xl font-black text-yellow-400 tabular-nums">{score.toLocaleString()}</div>
              <div className="text-[11px] font-mono text-slate-500">Distance: {distanceMeters} meters</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleStartCTA}
                className="chunky-btn w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-3 border-slate-950 font-black text-sm shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 active:translate-y-0.5"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                <span>TRY ANOTHER RUN</span>
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  className="chunky-btn w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 font-black text-xs"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
