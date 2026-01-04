// cloudmanager.js
import React, { useEffect, useRef } from "react";
import "./cloudManager.css";

const rand = (min, max) => Math.random() * (max - min) + min;

// força máxima do efeito (quanto o nevoeiro reage ao player)
const PLAYER_INFLUENCE = 8; // px/s (baixo = mais suave)

export default function CloudManager({
  count = 5, // menos partículas = menos denso
  color = "200,200,210",
  playerVelocityX = 5,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const aqFactorRef = useRef(1.2); // densidade base um pouco menor
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    function createParticle() {
      const { w, h } = sizeRef.current;
      return {
        x: rand(-w, w),
        y: rand(h * 0.15, h * 0.65),
        r: rand(w * 0.35, w * 0.7), // partículas um pouco menores
        baseAlpha: rand(0.06, 0.14), // base um pouco menor
      };
    }

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

      sizeRef.current = { w, h };

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particlesRef.current = Array.from({ length: count }, createParticle);
    }

    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();

    function draw(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const { w, h } = sizeRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const density = aqFactorRef.current;

      // nevoeiro move SEMPRE no sentido oposto ao player
      const wind = -playerVelocityX * PLAYER_INFLUENCE * dt;

      particlesRef.current.forEach((p) => {
        p.x += wind;

        // wrap horizontal
        if (p.x - p.r > w) p.x = -p.r;
        if (p.x + p.r < 0) p.x = w + p.r;

        const alpha = Math.min(p.baseAlpha * density, 0.45); // menos denso

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${color},${alpha})`);
        g.addColorStop(0.75, `rgba(${color},${alpha * 0.5})`);
        g.addColorStop(1, `rgba(${color},0)`);

        ctx.fillStyle = g;
        ctx.filter = "blur(25px)"; // menos blur
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = "none";
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count, color, playerVelocityX]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
