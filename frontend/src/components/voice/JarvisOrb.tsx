import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../../types';

interface JarvisOrbProps {
  state?: AssistantState;
  volume?: number; // 0.0 to 1.0
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  interactive?: boolean;
}

export const JarvisOrb: React.FC<JarvisOrbProps> = ({
  state = 'IDLE',
  volume = 0,
  size = 'md',
  onClick,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Increased dimensions for prominent futuristic display
  const pixelSize =
    size === 'sm' ? 56 : size === 'md' ? 160 : size === 'lg' ? 240 : 320;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Particle system
    const numParticles = size === 'sm' ? 25 : size === 'md' ? 55 : 90;
    const particles = Array.from({ length: numParticles }, (_, i) => ({
      angle: (i / numParticles) * Math.PI * 2,
      radiusOffset: (Math.random() - 0.5) * 25,
      speed: 0.015 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 3.0,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      // Speed multiplier based on state
      const timeSpeed =
        state === 'PROCESSING'
          ? 0.09
          : state === 'SPEAKING'
          ? 0.07
          : state === 'LISTENING'
          ? 0.05
          : 0.025;

      time += timeSpeed;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = (pixelSize / 2) * 0.52;

      ctx.clearRect(0, 0, width, height);

      // Color scheme based on state
      let primaryColor = '0, 240, 255'; // Cyan
      let secondaryColor = '59, 130, 246'; // Blue
      let coreColor = '186, 230, 253'; // Light bright cyan
      let glowIntensity = 0.6;

      if (state === 'LISTENING') {
        primaryColor = '0, 255, 210';
        secondaryColor = '0, 240, 255';
        glowIntensity = 0.8 + volume * 0.8;
      } else if (state === 'PROCESSING') {
        primaryColor = '168, 85, 247'; // Purple/Quantum
        secondaryColor = '59, 130, 246';
        glowIntensity = 0.95;
      } else if (state === 'SPEAKING') {
        primaryColor = '56, 189, 248';
        secondaryColor = '96, 165, 250';
        glowIntensity = 0.85 + Math.sin(time * 8) * 0.3;
      } else if (state === 'ERROR') {
        primaryColor = '239, 68, 68';
        secondaryColor = '249, 115, 22';
      }

      // Outer breathing aura
      const auraPulse = (state === 'LISTENING' ? volume * 35 : Math.sin(time * 3) * 10);
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.9 + auraPulse
      );
      outerGlow.addColorStop(0, `rgba(${primaryColor}, ${glowIntensity * 0.45})`);
      outerGlow.addColorStop(0.5, `rgba(${secondaryColor}, ${glowIntensity * 0.2})`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.9 + auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Holographic Concentric Rings
      const ringCount = size === 'sm' ? 2 : 4;
      for (let r = 1; r <= ringCount; r++) {
        const ringRadius =
          baseRadius * (0.75 + r * 0.25) +
          (state === 'LISTENING' ? volume * 22 : Math.sin(time * 2 + r) * 3);

        ctx.save();
        ctx.translate(centerX, centerY);
        const rotDir = r % 2 === 0 ? 1 : -1;
        const rotSpeed = state === 'PROCESSING' ? 0.12 : state === 'SPEAKING' ? 0.06 : 0.025;
        ctx.rotate(rotDir * time * rotSpeed * r);

        ctx.strokeStyle = `rgba(${primaryColor}, ${0.35 + (r === 1 ? 0.25 : 0)})`;
        ctx.lineWidth = size === 'sm' ? 1.5 : 2;
        ctx.setLineDash([14 + r * 6, 8 + r * 4]);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(5, ringRadius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic Audio Energy Waveform Ribbon
      if (state === 'LISTENING' || state === 'SPEAKING' || state === 'PROCESSING') {
        const waveRadius = baseRadius * 1.2;
        const waveAmp =
          (state === 'LISTENING'
            ? volume * 35 + 8
            : state === 'PROCESSING'
            ? Math.sin(time * 12) * 15 + 6
            : Math.sin(time * 8) * 12 + 6);

        ctx.beginPath();
        const step = 0.08;
        for (let a = 0; a <= Math.PI * 2; a += step) {
          const distortion = Math.sin(a * 7 + time * 8) * waveAmp;
          const x = centerX + Math.cos(a) * (waveRadius + distortion);
          const y = centerY + Math.sin(a) * (waveRadius + distortion);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${primaryColor}, 0.85)`;
        ctx.lineWidth = size === 'sm' ? 2 : 3;
        ctx.shadowColor = `rgba(${primaryColor}, 0.95)`;
        ctx.shadowBlur = size === 'sm' ? 10 : 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Orbital Holographic Particles
      particles.forEach((p) => {
        p.angle += p.speed * (state === 'PROCESSING' ? 3.5 : state === 'SPEAKING' ? 2.0 : 1.0);
        const radius =
          baseRadius * 0.9 +
          p.radiusOffset +
          (state === 'LISTENING' ? volume * 15 : Math.sin(time * 2 + p.phase) * 8);

        const px = centerX + Math.cos(p.angle) * radius;
        const py = centerY + Math.sin(p.angle) * radius;

        ctx.fillStyle = `rgba(${primaryColor}, ${0.7 + Math.sin(time * 4 + p.phase) * 0.3})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Core Glass & Fusion Center
      const corePulse =
        state === 'LISTENING'
          ? volume * 18
          : state === 'PROCESSING'
          ? Math.sin(time * 6) * 8
          : Math.sin(time * 3) * (baseRadius * 0.08);

      const coreR = Math.max(8, baseRadius * 0.65 + corePulse);

      const coreGradient = ctx.createRadialGradient(
        centerX - coreR * 0.25,
        centerY - coreR * 0.25,
        coreR * 0.1,
        centerX,
        centerY,
        coreR
      );
      coreGradient.addColorStop(0, `rgba(255, 255, 255, 0.98)`);
      coreGradient.addColorStop(0.25, `rgba(${coreColor}, 0.85)`);
      coreGradient.addColorStop(0.65, `rgba(${secondaryColor}, 0.45)`);
      coreGradient.addColorStop(1, `rgba(${primaryColor}, 0.15)`);

      ctx.save();
      ctx.shadowColor = `rgba(${primaryColor}, 0.95)`;
      ctx.shadowBlur = size === 'sm' ? 18 : 35;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Core Specular Reflection Arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = size === 'sm' ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreR * 0.78, Math.PI * 1.1, Math.PI * 1.55);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, volume, pixelSize, size]);

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative flex items-center justify-center select-none transition-transform duration-300 ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95 group' : ''
      }`}
      style={{ width: pixelSize, height: pixelSize }}
      title={interactive ? 'Clicca per attivare/disattivare la modalità vocale' : undefined}
    >
      <canvas
        ref={canvasRef}
        width={pixelSize * 1.5}
        height={pixelSize * 1.5}
        style={{ width: pixelSize, height: pixelSize }}
        className="pointer-events-none drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]"
      />

      {interactive && state === 'LISTENING' && (
        <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0a0f1d] animate-ping" />
      )}
    </div>
  );
};
