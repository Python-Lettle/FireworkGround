import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Coordinate } from '../types';

// --- Audio Manager ---
class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaunch() {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    
    // Pitch rises
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain) return;
    
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;
    
    // Explosion envelope
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

    noise.start(now);
    noise.stop(now + 1);
  }
}

// --- Physics Constants ---
const GRAVITY = 0.04;
const FRICTION = 0.96;
const HUE_START = 0;
const HUE_END = 360;

// --- Helper Functions ---
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Classes ---

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: number; // Hue
  decay: number;
  coordinates: Coordinate[];
  canvasWidth: number;
  canvasHeight: number;

  constructor(x: number, y: number, hue: number, canvasWidth: number, canvasHeight: number) {
    this.x = x;
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const angle = random(0, Math.PI * 2);
    // Varied speed ensures explosion looks spherical but with depth
    const speed = random(0.005, 0.02);
    // Add some friction to initial velocity
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.coordinates = [];
    this.alpha = 1;
    this.decay = random(0.01, 0.03); 
    this.color = hue + random(-20, 20);
    
    for (let i = 0; i < 5; i++) {
      this.coordinates.push({ x: this.x, y: this.y });
    }
  }

  update() {
    this.coordinates.pop();
    this.coordinates.unshift({ x: this.x, y: this.y });

    this.vx *= FRICTION;
    this.vy *= FRICTION;
    this.vy += GRAVITY * 0.01;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const toPixelX = (x: number) => x * this.canvasWidth;
    const toPixelY = (y: number) => y * this.canvasHeight;
    
    ctx.beginPath();
    // Draw a smooth line through previous coordinates
    ctx.moveTo(toPixelX(this.coordinates[0].x), toPixelY(this.coordinates[0].y));
    for(let i = 1; i < this.coordinates.length; i++) {
        ctx.lineTo(toPixelX(this.coordinates[i].x), toPixelY(this.coordinates[i].y));
    }
    
    ctx.strokeStyle = `hsla(${this.color}, 100%, 60%, ${this.alpha})`;
    // Thicker lines for brighter effect
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Sparkle effect
    if (Math.random() > 0.8) {
      ctx.fillStyle = `hsla(${this.color}, 100%, 90%, ${this.alpha})`;
      ctx.fillRect(toPixelX(this.x) - 1, toPixelY(this.y) - 1, 2, 2);
    }
  }
}

class Firework {
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  distanceToTarget: number;
  distanceTraveled: number;
  coordinates: Coordinate[];
  angle: number;
  speed: number;
  acceleration: number;
  brightness: number;
  hue: number;
  targetRadius: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(sx: number, sy: number, tx: number, ty: number, hue?: number, canvasWidth?: number, canvasHeight?: number) {
    this.x = sx;
    this.y = sy;
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.canvasWidth = canvasWidth || 1;
    this.canvasHeight = canvasHeight || 1;
    
    this.distanceToTarget = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
    this.distanceTraveled = 0;
    
    this.coordinates = [];
    for (let i = 0; i < 4; i++) {
      this.coordinates.push({ x: this.x, y: this.y });
    }

    this.angle = Math.atan2(ty - sy, tx - sx);
    this.speed = 0.02;
    this.acceleration = 1.05;
    this.brightness = random(50, 70);
    // Allow custom hue for multiplayer colors, or random
    this.hue = hue !== undefined ? hue : random(HUE_START, HUE_END);
    this.targetRadius = 0.01;
  }

  update(index: number): boolean {
    this.coordinates.pop();
    this.coordinates.unshift({ x: this.x, y: this.y });

    this.speed *= this.acceleration;
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;

    this.distanceTraveled = Math.sqrt(Math.pow(this.x - this.sx, 2) + Math.pow(this.y - this.sy, 2));

    if (this.distanceTraveled >= this.distanceToTarget) {
      return true;
    } else {
      this.x += vx;
      this.y += vy;
      return false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    const toPixelX = (x: number) => x * canvasWidth;
    const toPixelY = (y: number) => y * canvasHeight;
    
    ctx.beginPath();
    ctx.moveTo(toPixelX(this.coordinates[this.coordinates.length - 1].x), toPixelY(this.coordinates[this.coordinates.length - 1].y));
    ctx.lineTo(toPixelX(this.x), toPixelY(this.y));
    ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
    ctx.lineWidth = 3; 
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(toPixelX(this.tx), toPixelY(this.ty), this.targetRadius * Math.min(canvasWidth, canvasHeight), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, 0.1)`;
    ctx.fill();
  }
}

interface FireworkCanvasProps {
  onLaunch: (sx: number, sy: number, tx: number, ty: number, hue: number) => void;
  onExplode: () => void;
}

export interface FireworkCanvasHandle {
  launchRocket: (sx: number, sy: number, tx: number, ty: number, hue?: number) => void;
}

export const FireworkCanvas = forwardRef<FireworkCanvasHandle, FireworkCanvasProps>(({ onLaunch, onExplode }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const soundManagerRef = useRef<SoundManager | null>(null);

  // State for continuous launching
  const firingIntervalRef = useRef<number | null>(null);
  const activePointerRef = useRef<{x: number, y: number} | null>(null);

  // Expose method to parent for multiplayer events
  useImperativeHandle(ref, () => ({
    launchRocket: (sx: number, sy: number, tx: number, ty: number, hue?: number) => {
      fireworksRef.current.push(new Firework(sx, sy, tx, ty, hue, canvasRef.current?.clientWidth || 1, canvasRef.current?.clientHeight || 1));
      soundManagerRef.current?.playLaunch();
    }
  }));

  // Initialize Sound and Canvas
  useEffect(() => {
    soundManagerRef.current = new SoundManager();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    };

    window.addEventListener('resize', handleResize);
    
    const resizeWithDelay = () => {
        handleResize();
        setTimeout(handleResize, 0);
        setTimeout(handleResize, 100);
    };
    
    resizeWithDelay();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (firingIntervalRef.current) clearInterval(firingIntervalRef.current);
    };
  }, []);

  // Main Loop
  const loop = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Use logical dimensions
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Fade effect for trails
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalCompositeOperation = 'lighter';

    // Update Fireworks
    let i = fireworksRef.current.length;
    while (i--) {
      const firework = fireworksRef.current[i];
      const exploded = firework.update(i);
      firework.draw(ctx, width, height);

      if (exploded) {
        // Explosion logic
        const particleCount = random(30, 80);
        for (let j = 0; j < particleCount; j++) {
            particlesRef.current.push(new Particle(firework.tx, firework.ty, firework.hue, width, height));
        }
        soundManagerRef.current?.playExplosion();
        fireworksRef.current.splice(i, 1);
        onExplode();
      }
    }

    // Update Particles
    let k = particlesRef.current.length;
    while (k--) {
      const particle = particlesRef.current[k];
      particle.update();
      particle.draw(ctx);

      if (particle.alpha <= 0.01) {
        particlesRef.current.splice(k, 1);
      }
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [onExplode]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [loop]);

  // Helper to get relative coordinates from pointer event
  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
  };

  const launchAtPosition = (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const startX = 0.5 + random(-0.05, 0.05);
      const startY = 1.0;
      const hue = random(HUE_START, HUE_END);
      
      fireworksRef.current.push(new Firework(startX, startY, x, y, hue));
      soundManagerRef.current?.playLaunch();
      
      // Notify parent for multiplayer sync
      onLaunch(startX, startY, x, y, hue);
  };

  // --- Pointer Event Handlers for Long Press ---
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default browser actions (scrolling, etc.)
    soundManagerRef.current?.resume();
    
    // Capture pointer so we keep getting events even if cursor leaves canvas
    (e.target as Element).setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e);
    activePointerRef.current = { x, y };

    // Immediate launch
    launchAtPosition(x, y);

    // Start interval for continuous fire (150ms)
    if (firingIntervalRef.current === null) {
        firingIntervalRef.current = window.setInterval(() => {
            if (activePointerRef.current) {
                launchAtPosition(activePointerRef.current.x, activePointerRef.current.y);
            }
        }, 150); 
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // e.preventDefault();
    if (activePointerRef.current) {
        const { x, y } = getCanvasCoords(e);
        activePointerRef.current = { x, y };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // e.preventDefault();
    activePointerRef.current = null;
    if (firingIntervalRef.current !== null) {
        clearInterval(firingIntervalRef.current);
        firingIntervalRef.current = null;
    }
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair touch-none active:cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
});

FireworkCanvas.displayName = "FireworkCanvas";