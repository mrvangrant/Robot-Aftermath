import React, { useEffect, useRef, useState } from "react";

// BulletManager: gerencia os projéteis do jogador.
// - Procura o inimigo mais próximo dentro de `fireRange`.
// - Gera (spawn) projéteis com velocidade `bulletSpeed` dirigidos ao inimigo.
// - Atualiza posição dos projéteis a cada frame, verifica colisões e remove projéteis antigos.
// - Chama `onEnemyHit(id, bullet)` quando um inimigo é atingido.
export default function BulletManager({
  playerPos = { x: 0, y: 0 },
  enemies = [],
  fireRate = 1, // shots per second
  fireRange = 450,
  bulletSpeed = 600,
  onEnemyHit = () => {},
  worldWidth = typeof window !== "undefined" ? window.innerWidth : 800,
  worldHeight = typeof window !== "undefined" ? window.innerHeight : 600,
}) {
  const bulletsRef = useRef([]);
  const [bullets, setBullets] = useState([]);
  const lastShotRef = useRef(0);
  const idRef = useRef(1);

  useEffect(() => {
    let raf = null;
    let last = performance.now();

    // Encontra o inimigo mais próximo do ponto (px, py).
    // Retorna null se não houver inimigos.
    function findNearest(px, py) {
      let best = null;
      let bestD2 = Infinity;
      for (const e of enemies || []) {
        const ex = (typeof e.x === "number" ? e.x : 0) + ((e.w || 0) / 2);
        const ey = (typeof e.y === "number" ? e.y : 0) + ((e.h || 0) / 2);
        const dx = ex - px;
        const dy = ey - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = { ...e, cx: ex, cy: ey, d2 };
        }
      }
      return best;
    }

    // Cria um novo projétil na posição (x,y) com velocidade (vx, vy).
    function spawn(x, y, vx, vy) {
      const b = { id: idRef.current++, x, y, vx, vy, life: 0 };
      bulletsRef.current.push(b);
      setBullets([...bulletsRef.current]);
    }

    // Loop principal (requestAnimationFrame): atualiza projéteis, gera novos tiros quando aplicável
    function step(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // auto-fire at nearest enemy in range
      if (playerPos) {
        const centerX = playerPos.x;
        const centerY = playerPos.y;
        const nearest = findNearest(centerX, centerY);
        if (nearest && nearest.d2 <= fireRange * fireRange) {
          const since = now / 1000 - (lastShotRef.current || 0);
          if (since >= 1 / fireRate) {
            lastShotRef.current = now / 1000;
            const dx = nearest.cx - centerX;
            const dy = nearest.cy - centerY;
            const len = Math.hypot(dx, dy) || 1;
            const vx = (dx / len) * bulletSpeed;
            const vy = (dy / len) * bulletSpeed;
            spawn(centerX - 4, centerY - 4, vx, vy);
          }
        }
      }

      // update bullets and check collisions
      if (bulletsRef.current.length > 0) {
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life += dt;

          // world bounds cleanup
          if (
            b.x < -50 ||
            b.y < -50 ||
            b.x > (worldWidth || window.innerWidth) + 50 ||
            b.y > (worldHeight || window.innerHeight) + 50 ||
            b.life > 6
          ) {
            bulletsRef.current.splice(i, 1);
            continue;
          }

          // simple AABB collision with enemies
          for (const e of enemies || []) {
            const ex = e.x || 0;
            const ey = e.y || 0;
            const ew = e.w || 16;
            const eh = e.h || 16;
            if (b.x >= ex && b.x <= ex + ew && b.y >= ey && b.y <= ey + eh) {
              // hit
              bulletsRef.current.splice(i, 1);
              setBullets([...bulletsRef.current]);
              try {
                onEnemyHit(e.id, b);
              } catch (err) {
                // swallow callback errors
                // eslint-disable-next-line no-console
                console.error(err);
              }
              break;
            }
          }
        }
        setBullets([...bulletsRef.current]);
      }

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [playerPos, enemies, fireRate, fireRange, bulletSpeed, onEnemyHit, worldWidth, worldHeight]);

  return (
    <>
      {bullets.map((b) => (
        <div
          key={b.id}
          className="bullet"
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "yellow",
            transform: `translate(${b.x}px, ${b.y}px)`,
            pointerEvents: "none",
            zIndex: 60,
          }}
        />
      ))}
    </>
  );
}