import React, { useEffect, useRef } from "react";
import SoundManager from "../SoundManager"; // importa o manager de sons

const PISTOL_RANGE = 300;
const SMG_RANGE = 350;
const SHOTGUN_RANGE = 150;
const SMG_BURST = 3;
const SMG_DELAY = 0.1;
const SMG_COOLDOWN = 1.5;
const SHOTGUN_COOLDOWN = 2.5;

export default function BulletManager({
  playerPos,
  enemies,
  inventory,
  fireRate = 1,
  bulletSpeed = 700,
  onEnemyHit,
  paused = false,
  gameFrozen = false,
}) {
  const bulletsRef = useRef([]);
  const containerRef = useRef(null);
  const pistolLastShot = useRef(0);
  const idRef = useRef(1);

  const smg = useRef({ active: false, shots: 0, nextShot: 0, cooldown: 0 });
  const shotgun = useRef({ cooldown: 0 });

  function hasSMG() {
    return inventory.some((i) => i.id === "SMG");
  }
  function hasShotgun() {
    return inventory.some((i) => i.id === "Shotgun");
  }

  function nearestEnemy(px, py) {
    let best = null;
    let bestD = Infinity;
    for (const e of enemies) {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      const d = Math.hypot(cx - px, cy - py);
      if (d < bestD) {
        bestD = d;
        best = { ...e, cx, cy };
      }
    }
    return best;
  }

  function spawnBullet(px, py, vx, vy, range, type = "Pistol") {
    bulletsRef.current.push({
      id: idRef.current++,
      x: px,
      y: py,
      sx: px,
      sy: py,
      vx,
      vy,
      range,
      type,
    });

    // TOCAR SOM DA ARMA
    switch (type) {
      case "Pistol":
        SoundManager.playSound("PistolAttack", 0.3);
        break;
      case "SMG":
        break;
      case "Shotgun":
        break;
      default:
        break;
    }
  }

  // Loop principal das balas
  useEffect(() => {
    if (gameFrozen || paused) return;

    let raf;
    let last = performance.now();

    function loop(now) {
      const dt = (now - last) / 1000;
      last = now;
      const t = now / 1000;

      const px = playerPos.x;
      const py = playerPos.y;

      const target = nearestEnemy(px, py);
      if (target) {
        const dx = target.cx - px;
        const dy = target.cy - py;
        const len = Math.hypot(dx, dy) || 1;
        const dirX = dx / len;
        const dirY = dy / len;

        // --- PISTOL ---
        if (t - pistolLastShot.current >= 1 / fireRate) {
          pistolLastShot.current = t;
          spawnBullet(
            px,
            py,
            dirX * bulletSpeed,
            dirY * bulletSpeed,
            PISTOL_RANGE,
            "Pistol"
          );
        }

        // --- SMG ---
        if (hasSMG()) {
          const s = smg.current;
          if (!s.active && t > s.cooldown) {
            s.active = true;
            s.shots = SMG_BURST;
            s.nextShot = t;
          }
          if (s.active && t >= s.nextShot) {
            spawnBullet(
              px,
              py,
              dirX * bulletSpeed,
              dirY * bulletSpeed,
              SMG_RANGE,
              "SMG"
            );
            s.shots--;
            s.nextShot = t + SMG_DELAY;
            if (s.shots <= 0) {
              s.active = false;
              s.cooldown = t + SMG_COOLDOWN;
            }
            SoundManager.playSound("SMGAttack", 0.2);
          }
        }

        // --- SHOTGUN ---
        if (hasShotgun() && t >= shotgun.current.cooldown) {
          const angles = [-20, -10, 0, 10, 20].map(
            (deg) => (deg * Math.PI) / 180
          );
          angles.forEach((a) => {
            const angle = Math.atan2(dirY, dirX) + a;
            spawnBullet(
              px,
              py,
              Math.cos(angle) * bulletSpeed,
              Math.sin(angle) * bulletSpeed,
              SHOTGUN_RANGE,
              "Shotgun"
            );
          });
          SoundManager.playSound("ShotgunAttack", 0.3);
          shotgun.current.cooldown = t + SHOTGUN_COOLDOWN;
        }
      }

      // Update bullets sem setState
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        const dist = Math.hypot(b.x - b.sx, b.y - b.sy);
        if (dist > b.range) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        for (const e of enemies) {
          if (
            b.x >= e.x &&
            b.x <= e.x + e.w &&
            b.y >= e.y &&
            b.y <= e.y + e.h
          ) {
            bulletsRef.current.splice(i, 1);
            onEnemyHit?.(e.id);
            break;
          }
        }
      }

      // Atualiza o DOM das balas
      if (containerRef.current) {
        const childNodes = containerRef.current.childNodes;
        bulletsRef.current.forEach((b, i) => {
          let el = childNodes[i];
          if (!el) {
            el = document.createElement("div");
            el.style.position = "absolute";
            el.style.width = "6px";
            el.style.height = "6px";
            el.style.borderRadius = "3px";
            el.style.pointerEvents = "none";
            el.style.background =
              b.type === "SMG"
                ? "orange"
                : b.type === "Shotgun"
                ? "red"
                : "yellow";
            containerRef.current.appendChild(el);
          }
          el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        });

        while (childNodes.length > bulletsRef.current.length) {
          containerRef.current.removeChild(containerRef.current.lastChild);
        }
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    playerPos,
    enemies,
    inventory,
    fireRate,
    bulletSpeed,
    gameFrozen,
    paused,
    onEnemyHit,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
