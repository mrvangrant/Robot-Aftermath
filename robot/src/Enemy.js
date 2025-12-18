import React, { useEffect, useRef, useState } from "react";
import "./App.css";

// Enemy: aparece aleatoriamente e persegue o jogador.
export default function Enemy({
  playerPos = { x: 0, y: 0 },
  size = 64,
  speed = 120,
  playerHitboxSize = 200,
  playerHitboxOffset = 0,
  onDie,
}) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const posRef = useRef(pos);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const deadRef = useRef(false);

  // atualiza a ref sempre que posição muda
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // spawn aleatorio ao correr
  useEffect(() => {
    const maxW = Math.max(0, window.innerWidth - size);
    const maxH = Math.max(0, window.innerHeight - size);
    const rx = Math.floor(Math.random() * (maxW || 1));
    const ry = Math.floor(Math.random() * (maxH || 1));
    setPos({ x: rx, y: ry });
    posRef.current = { x: rx, y: ry };
  }, [size]);

  // loop de movimentação que segue `playerPos`
  useEffect(() => {
    function step(ts) {
      if (lastTimeRef.current == null) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;

      const cur = posRef.current;
      const dx =
        (playerPos?.x || 0) +
        (playerHitboxOffset || 0) +
        playerHitboxSize / 2 -
        (cur.x + size / 2);
      const dy =
        (playerPos?.y || 0) +
        (playerHitboxOffset || 0) +
        playerHitboxSize / 2 -
        (cur.y + size / 2);
      const dist = Math.hypot(dx, dy);

      // colisão: se a distância entre centros for menor que metade soma dos tamanhos
      const collisionDist = (playerHitboxSize + size) / 2;
      if (dist <= collisionDist) {
        if (!deadRef.current) {
          deadRef.current = true;
          if (typeof onDie === "function") onDie();
        }
        // parar de mover após colidir
        // não return; deixamos o rAF continuar até cleanup
      } else if (dist > 1) {
        const nx = cur.x + (dx / dist) * speed * dt;
        const ny = cur.y + (dy / dist) * speed * dt;
        setPos({ x: nx, y: ny });
        posRef.current = { x: nx, y: ny };
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerPos?.x, playerPos?.y, speed, playerHitboxSize, playerHitboxOffset]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${Math.round(pos.x)}px, ${Math.round(pos.y)}px)`,
  };

  return (
    <div className="enemy-container" aria-hidden>
      <div className="enemy" style={style} aria-label="enemy" />
    </div>
  );
}
