import React, { useEffect, useRef, useState } from "react";
import "./cloudManager.css";

const rand = (min, max) => Math.random() * (max - min) + min;

export default function CloudManager({ count = 3, color = "200,200,210" }) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const [aqFactor, setAqFactor] = useState(1);
  const aqFactorRef = useRef(1);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function createParticle() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const dir = Math.random() > 0.5 ? 1 : -1;
      return {
        x: rand(0, w),
        y: rand(h * 0.02, h * 0.6),
        r: rand(w * 0.22, w * 0.55),
        alpha: rand(0.03, 0.12),
        vx: rand(8, 28) * (dir > 0 ? 1 : -1),
        dir,
      };
    }

    particlesRef.current = Array.from({ length: count }, () => createParticle());

    let last = performance.now();
    function draw(now) {
      const dt = Math.max(0.001, (now - last) / 1000);
      last = now;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      particlesRef.current.forEach((p) => {
        p.x += p.vx * dt * 30; // tuned for smooth slow movement

        // respawn when fully off-screen
        if (p.dir > 0 && p.x - p.r > w) {
          p.x = -p.r * 0.6;
          p.y = rand(h * 0.02, h * 0.6);
          p.r = rand(w * 0.22, w * 0.55);
          p.alpha = rand(0.03, 0.12);
          p.vx = rand(8, 28);
        } else if (p.dir < 0 && p.x + p.r < 0) {
          p.x = w + p.r * 0.6;
          p.y = rand(h * 0.02, h * 0.6);
          p.r = rand(w * 0.22, w * 0.55);
          p.alpha = rand(0.03, 0.12);
          p.vx = -rand(8, 28);
        }

        // apply air-quality factor to particle alpha (clamped)
        const alpha = Math.min((p.alpha || 0.04) * (aqFactorRef.current || 1), 0.6);
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grd.addColorStop(0, `rgba(${color},${alpha})`);
        grd.addColorStop(0.6, `rgba(${color},${alpha * 0.6})`);
        grd.addColorStop(1, `rgba(${color},0)`);

        ctx.fillStyle = grd;
        ctx.filter = "blur(12px)";
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
  }, [count, color]);

  // fetch air quality and update aqFactor (uses Open-Meteo Air Quality API)
  useEffect(() => {
    const aqRef = aqFactorRef;

    const getPosition = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("no-geo"));
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p.coords),
          (err) => reject(err),
          { timeout: 5000 }
        );
      });

    async function fetchAQ() {
      try {
        let lat = 38.72;
        let lon = -9.13; // fallback (Lisbon)
        try {
          const c = await getPosition();
          lat = c.latitude;
          lon = c.longitude;
        } catch (e) {
          // use fallback
        }

        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const arr = data?.hourly?.pm2_5;
        if (Array.isArray(arr) && arr.length) {
          const latest = arr[arr.length - 1] || 0;
          const factor = Math.min(Math.max(0.6, 1 + latest / 50), 3);
          aqRef.current = factor;
          setAqFactor(factor);
        }
      } catch (err) {
        // ignore errors, keep previous factor
      }
    }

    fetchAQ();
    const id = setInterval(fetchAQ, 1000 * 60 * 15); // 15 minutes
    return () => clearInterval(id);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
        width: "100%",
        height: "100%",
        willChange: "transform",
      }}
    />
  );
}
