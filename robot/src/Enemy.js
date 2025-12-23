import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import robotLeftSprite from "./robot/robot-left.gif";
import robotRightSprite from "./robot/robot-right.gif";

// Enemy: aparece aleatoriamente e persegue o jogador.
export default function Enemy({
  id,
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

  // atualiza a ref sempre que posição muda
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // spawn aleatorio ao correr
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

    const maxW = Math.max(0, (worldWidth || window.innerWidth) - size);
    const maxH = Math.max(0, (worldHeight || window.innerHeight) - size);
    const rx = Math.floor(Math.random() * (maxW || 1));
    const ry = Math.floor(Math.random() * (maxH || 1));
    setPos({ x: rx, y: ry });
    posRef.current = { x: rx, y: ry };
  }, [size, worldWidth, worldHeight]);

  // loop de movimentação que segue `playerPos`
  useEffect(() => {
    if (paused) {
      // stop the loop while paused
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return undefined;
    }

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
        const now = Date.now();
        // previne múltiplos hits em curto espaço de tempo
        if (!lastHitRef.current || now - lastHitRef.current > 500) {
          lastHitRef.current = now;
          if (typeof onDie === "function") onDie(id);
        }
      } else if (dist > 1) {
        // segue o jogador
        const tx = dx / dist;
        const ty = dy / dist;

        // separação entre outros inimigos
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

        // atualiza direção baseado no movimento horizontal
        if (moveX < -0.1) {
          setDirection("left");
        } else if (moveX > 0.1) {
          setDirection("right");
        }

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
        {/* Hitbox visualization */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "2px solid #0f0",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
