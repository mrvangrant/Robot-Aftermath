import React, { useEffect, useState } from "react";

export default function RangerBulletManager({
  enemyPos,
  playerPos,
  paused,
  onHitPlayer,
}) {
  const [bullets, setBullets] = useState([]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setBullets((prev) => [...prev, { x: enemyPos.x, y: enemyPos.y }]);
    }, 2000);

    return () => clearInterval(interval);
  }, [enemyPos, paused]);

  useEffect(() => {
    if (paused) return;
    const id = requestAnimationFrame(moveBullets);
    return () => cancelAnimationFrame(id);
  }, [bullets, paused]);

  function moveBullets() {
    setBullets((prev) => {
      return prev
        .map((b) => {
          const dx = playerPos.x - b.x;
          const dy = playerPos.y - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = 4;
          const nx = b.x + (dx / dist) * speed;
          const ny = b.y + (dy / dist) * speed;

          // colisão simplificada
          if (Math.hypot(nx - playerPos.x, ny - playerPos.y) < 20) {
            onHitPlayer();
            return null;
          }

          return { x: nx, y: ny };
        })
        .filter(Boolean);
    });

    requestAnimationFrame(moveBullets);
  }

  return (
    <>
      {bullets.map((b, i) => (
        <div
          key={i}
          className="enemy-bullet"
          style={{
            transform: `translate(${b.x}px, ${b.y}px)`,
          }}
        />
      ))}
    </>
  );
}
