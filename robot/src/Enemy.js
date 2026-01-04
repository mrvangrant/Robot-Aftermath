import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import robotLeftSprite from "./robot/robot-left.gif";
import robotRightSprite from "./robot/robot-right.gif";

// Enemy: segue o jogador, evita outros inimigos, dá pontuação e respeita pausa
export default function Enemy({
  id,
  enemyType = "basic", // tipo de inimigo (pontuação)
  playerPos = { x: 0, y: 0 },
  size = 48,
  speed = 120,
  playerHitboxSize = 200,
  playerHitboxOffset = 0,
  onDie,
  worldWidth = typeof window !== "undefined" ? window.innerWidth : 800,
  worldHeight = typeof window !== "undefined" ? window.innerHeight : 600,
  initialPos = null,
  allEnemies = [],
  onPosUpdate = null,
  paused = false,
}) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState("right");
  const posRef = useRef(pos);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const lastHitRef = useRef(0);

  // atualiza referência
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // spawn inicial aleatório ou fornecido
  useEffect(() => {
    if (
      initialPos &&
      typeof initialPos.x === "number" &&
      typeof initialPos.y === "number"
    ) {
      setPos({ x: initialPos.x, y: initialPos.y });
      posRef.current = { x: initialPos.x, y: initialPos.y };
      return;
    }

    const maxW = Math.max(0, worldWidth - size);
    const maxH = Math.max(0, worldHeight - size);
    const rx = Math.floor(Math.random() * (maxW || 1));
    const ry = Math.floor(Math.random() * (maxH || 1));
    setPos({ x: rx, y: ry });
    posRef.current = { x: rx, y: ry };
  }, [size, worldWidth, worldHeight, initialPos]);

  // loop de movimentação
  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    function step(ts) {
      if (lastTimeRef.current == null) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;

      const cur = posRef.current;

      const dx =
        playerPos?.x +
        playerHitboxOffset +
        playerHitboxSize / 2 -
        (cur.x + size / 2);
      const dy =
        playerPos?.y +
        playerHitboxOffset +
        playerHitboxSize / 2 -
        (cur.y + size / 2);
      const dist = Math.hypot(dx, dy);

      // colisão com player
      const collisionDist = (playerHitboxSize + size) / 2;
      if (dist <= collisionDist) {
        const now = Date.now();
        if (!lastHitRef.current || now - lastHitRef.current > 500) {
          lastHitRef.current = now;
          onDie?.(id, enemyType); // devolve tipo para pontuação
        }
      } else if (dist > 1) {
        // segue jogador
        let tx = dx / dist;
        let ty = dy / dist;

        // separação entre inimigos
        const sepRadius = Math.max(size * 1.6, 120);
        let sepX = 0;
        let sepY = 0;
        let sepCount = 0;

        for (const other of allEnemies || []) {
          if (!other || other.id === id) continue;
          const ox = other.x;
          const oy = other.y;
          if (typeof ox !== "number" || typeof oy !== "number") continue;
          const ddx = cur.x - ox;
          const ddy = cur.y - oy;
          const dd = Math.hypot(ddx, ddy);
          if (dd > 0 && dd < sepRadius) {
            const push = (sepRadius - dd) / sepRadius;
            sepX += (ddx / dd) * push;
            sepY += (ddy / dd) * push;
            sepCount++;
          }
        }

        let moveX = tx;
        let moveY = ty;
        if (sepCount > 0) {
          sepX /= sepCount;
          sepY /= sepCount;
          const sepBlend = 0.9;
          moveX = tx + sepX * sepBlend;
          moveY = ty + sepY * sepBlend;
        }

        const mlen = Math.hypot(moveX, moveY) || 1;
        const nx = cur.x + (moveX / mlen) * speed * dt;
        const ny = cur.y + (moveY / mlen) * speed * dt;

        // direção para sprite
        if (moveX < -0.1) setDirection("left");
        else if (moveX > 0.1) setDirection("right");

        setPos({ x: nx, y: ny });
        posRef.current = { x: nx, y: ny };
        if (typeof onPosUpdate === "function") onPosUpdate(id, nx, ny, size);
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    playerPos?.x,
    playerPos?.y,
    speed,
    playerHitboxSize,
    playerHitboxOffset,
    paused,
    allEnemies,
  ]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${Math.round(pos.x)}px, ${Math.round(pos.y)}px)`,
  };

  const spriteImage = direction === "left" ? robotLeftSprite : robotRightSprite;

  return (
    <div className="enemy-container" aria-hidden>
      <div className="enemy" style={style} aria-label="enemy">
        <img
          src={spriteImage}
          alt="enemy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
