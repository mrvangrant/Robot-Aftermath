import React, { useEffect, useRef, useState } from "react";

const PISTOL_RANGE = 300; // alcance pistola
const SMG_RANGE = 350; // alcance SMG
const SHOTGUN_RANGE = 150; // alcance shotgun
const SMG_BURST = 3;
const SMG_DELAY = 0.1;
const SMG_COOLDOWN = 1.5;
const SHOTGUN_COOLDOWN = 2.5; // 3 segundos de delay

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
  const [bullets, setBullets] = useState([]);

  const pistolLastShot = useRef(0);
  const idRef = useRef(1);

  const smg = useRef({
    active: false,
    shots: 0,
    nextShot: 0,
    cooldown: 0,
  });

  const shotgun = useRef({
    cooldown: 0,
  });

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
  }

  useEffect(() => {
    if (gameFrozen) return;

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
          }
        }

        // --- SHOTGUN ---
        if (hasShotgun() && t >= shotgun.current.cooldown) {
          // disparar 5 balas em leque
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
          shotgun.current.cooldown = t + SHOTGUN_COOLDOWN;
        }
      }

      // UPDATE BULLETS
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

      setBullets([...bulletsRef.current]);
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    paused,
    enemies,
    inventory,
    bulletSpeed,
    fireRate,
    playerPos,
    onEnemyHit,
    gameFrozen,
  ]);

  if (paused) return null;

  return (
    <>
      {bullets.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: 3,
            background:
              b.type === "SMG"
                ? "orange"
                : b.type === "Shotgun"
                ? "red"
                : "yellow",
            transform: `translate(${b.x}px, ${b.y}px)`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
