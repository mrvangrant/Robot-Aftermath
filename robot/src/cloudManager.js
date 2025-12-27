import React, { useEffect, useRef } from "react";
import "./cloudManager.css";

const rand = (min, max) => Math.random() * (max - min) + min;

// força máxima do efeito (quanto o nevoeiro reage ao player)
const PLAYER_INFLUENCE = 8; // px/s (baixo = mais suave)

export default function CloudManager({
  count = 3,
  color = "200,200,210",
  playerVelocityX = 5,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const aqFactorRef = useRef(1);
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
        r: rand(w * 0.35, w * 0.65),
        baseAlpha: rand(0.05, 0.14),
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

        const alpha = Math.min(p.baseAlpha * density, 0.45);

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${color},${alpha})`);
        g.addColorStop(0.75, `rgba(${color},${alpha * 0.45})`);
        g.addColorStop(1, `rgba(${color},0)`);

        ctx.fillStyle = g;
        ctx.filter = "blur(20px)";
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

  /* ================= AIR QUALITY ================= */
  useEffect(() => {
    async function fetchAirQuality() {
      let lat = 38.72;
      let lon = -9.13;

      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition((p) => res(p.coords), rej, {
            timeout: 5000,
          })
        );
        lat = pos.latitude;
        lon = pos.longitude;
      } catch {}

      try {
        const res = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=european_aqi,pm2_5`
        );
        const data = await res.json();

        const aqi = data?.hourly?.european_aqi?.at(-1);
        const pm = data?.hourly?.pm2_5?.at(-1);

        if (aqi == null || pm == null) return;

        let factor = aqi <= 20 ? 0.7 : aqi <= 40 ? 1.0 : aqi <= 60 ? 1.4 : 1.8;

        factor += Math.min(pm / 100, 0.4);
        aqFactorRef.current = Math.min(Math.max(factor, 0.6), 2);
      } catch {}
    }

    fetchAirQuality();
    const id = setInterval(fetchAirQuality, 1000 * 60 * 15);
    return () => clearInterval(id);
  }, []);

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
