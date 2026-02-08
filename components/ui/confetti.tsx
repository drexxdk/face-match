'use client';

import { useEffect } from 'react';

interface ConfettiProps {
  active?: boolean;
  duration?: number;
}

export function Confetti({ active = true, duration = 3000 }: ConfettiProps) {
  useEffect(() => {
    if (!active) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = [
      'hsl(262 83% 58%)', // purple
      'hsl(217 91% 60%)', // blue
      'hsl(340 82% 52%)', // pink
      'hsl(142 76% 36%)', // green
      'hsl(38 92% 50%)', // yellow
    ];

    // Create confetti particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let animationId: number;
    const startTime = Date.now();

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (Date.now() - startTime < duration) {
        animationId = requestAnimationFrame(animate);
      } else {
        document.body.removeChild(canvas);
      }
    }

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (canvas.parentNode) document.body.removeChild(canvas);
    };
  }, [active, duration]);

  return null;
}
