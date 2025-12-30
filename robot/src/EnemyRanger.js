import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import bulletImg from "./weapons/laser.png";
import rangerLeftSprite from "./robot/ranger-left.gif";
import rangerRightSprite from "./robot/ranger-right.gif";

// Componente da bala
function Bullet({ x, y, vx, vy, size = 12, onHit }) {
  const [pos, setPos] = useState({ x, y });
  const posRef = useRef({ x, y });

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    let raf;
    function step(ts, lastTime = ts) {
      const dt = (ts - lastTime) / 1000;
      const nx = posRef.current.x + vx * dt;
      const ny = posRef.current.y + vy * dt;
      setPos({ x: nx, y: ny });
      posRef.current = { x: nx, y: ny };

      if (typeof onHit === "function") onHit(nx, ny);

      raf = requestAnimationFrame((newTs) => step(newTs, ts));
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [vx, vy, onHit]);

  return (
    <img
      src={bulletImg}
      alt="bullet"
      style={{
        position: "absolute",
        left: pos.x - size / 2,
        top: pos.y - size / 2,
        width: size,
        height: size,
        pointerEvents: "none",
      }}
    />
  );
}

export default function RangerEnemy({
  id,
  playerPos = { x: 0, y: 0 },
  size = 48,
  speed = 100,
  playerHitboxSize = 200,
  playerHitboxOffset = 0,
  onHitPlayer,
  worldWidth = typeof window !== "undefined" ? window.innerWidth : 800,
  worldHeight = typeof window !== "undefined" ? window.innerHeight : 600,
  initialPos = null,
  allEnemies = [],
  onPosUpdate = null,
  paused = false,
  fireRate = 2000, // 1 bala a cada 2 segundos
  bulletSpeed = 250,
}) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState("right");
  const [bullets, setBullets] = useState([]);
  const posRef = useRef(pos);
  const lastTimeRef = useRef(null);
  const lastHitRef = useRef(0);
  const lastFireRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // Spawn aleatório
  useEffect(() => {
    if (
      initialPos &&
      typeof initialPos.x === "number" &&
      typeof initialPos.y === "number"
    ) {
      setPos(initialPos);
      posRef.current = initialPos;
      return;
    }
    const maxW = Math.max(0, worldWidth - size);
    const maxH = Math.max(0, worldHeight - size);
    const rx = Math.floor(Math.random() * (maxW || 1));
    const ry = Math.floor(Math.random() * (maxH || 1));
    setPos({ x: rx, y: ry });
    posRef.current = { x: rx, y: ry };
  }, [size, worldWidth, worldHeight]);

  // Loop de movimentação e tiro
  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return undefined;
    }

    function step(ts) {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;

      const cur = posRef.current;
      const playerCenterX =
        playerPos.x + playerHitboxOffset + playerHitboxSize / 2;
      const playerCenterY =
        playerPos.y + playerHitboxOffset + playerHitboxSize / 2;

      const dx = playerCenterX - (cur.x + size / 2);
      const dy = playerCenterY - (cur.y + size / 2);
      const dist = Math.hypot(dx, dy);

      // Colisão com player (contato físico)
      const collisionDist = (playerHitboxSize + size) / 2;
      if (dist <= collisionDist) {
        const now = Date.now();
        if (!lastHitRef.current || now - lastHitRef.current > 500) {
          lastHitRef.current = now;
          if (typeof onHitPlayer === "function") onHitPlayer(1); // 1 de dano
        }
      }

      // Movimento inimigo
      if (dist > 1) {
        const tx = dx / dist;
        const ty = dy / dist;

        // Separação de inimigos
        const sepRadius = Math.max(size * 1.6, 120);
        let sepX = 0,
          sepY = 0,
          sepCount = 0;
        for (const other of allEnemies || []) {
          if (!other || other.id === id) continue;
          const ox = other.x,
            oy = other.y;
          if (typeof ox !== "number" || typeof oy !== "number") continue;
          const ddx = cur.x - ox,
            ddy = cur.y - oy;
          const dd = Math.hypot(ddx, ddy);
          if (dd > 0 && dd < sepRadius) {
            const push = (sepRadius - dd) / sepRadius;
            sepX += (ddx / dd) * push;
            sepY += (ddy / dd) * push;
            sepCount++;
          }
        }

        let moveX = tx,
          moveY = ty;
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

        if (moveX < -0.1) setDirection("left");
        else if (moveX > 0.1) setDirection("right");

        setPos({ x: nx, y: ny });
        posRef.current = { x: nx, y: ny };
        if (typeof onPosUpdate === "function") onPosUpdate(id, nx, ny, size);
      }

      // Disparo a cada 2 segundos
      const now = Date.now();
      if (now - lastFireRef.current >= fireRate) {
        lastFireRef.current = now;

        const bulletDirX = dx / dist;
        const bulletDirY = dy / dist;

        setBullets((b) => [
          ...b,
          {
            id: Date.now(),
            x: cur.x + size / 2,
            y: cur.y + size / 2,
            vx: bulletDirX * bulletSpeed,
            vy: bulletDirY * bulletSpeed,
          },
        ]);
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    playerPos.x,
    playerPos.y,
    speed,
    playerHitboxSize,
    playerHitboxOffset,
    paused,
    fireRate,
    bulletSpeed,
    allEnemies,
    id,
    onPosUpdate,
    onHitPlayer,
    size,
  ]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${Math.round(pos.x)}px, ${Math.round(pos.y)}px)`,
  };

  const spriteImage =
    direction === "left" ? rangerLeftSprite : rangerRightSprite;

  return (
    <div className="enemy-container" aria-hidden>
      <div className="enemy" style={style} aria-label="ranger-enemy">
        <img
          src={spriteImage}
          alt="ranger enemy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* Renderiza todas as balas */}
        {bullets.map((b) => (
          <Bullet
            key={b.id}
            x={b.x}
            y={b.y}
            vx={b.vx}
            vy={b.vy}
            onHit={(bx, by) => {
              // Colisão com hitbox do player → perde 1 vida
              if (
                bx + 6 > playerPos.x &&
                bx - 6 < playerPos.x + playerHitboxSize &&
                by + 6 > playerPos.y &&
                by - 6 < playerPos.y + playerHitboxSize
              ) {
                if (typeof onHitPlayer === "function") onHitPlayer(1);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
