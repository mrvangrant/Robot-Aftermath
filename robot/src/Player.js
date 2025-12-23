import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import walkUpGif from "./Walk/walk_up.gif";
import walkDownGif from "./Walk/walk_down.gif";
import walkLeftGif from "./Walk/walk_left.gif";
import walkRightGif from "./Walk/walk_right.gif";
import idleUp from "./Idle/idle_up.gif";
import idleDown from "./Idle/idle_down.gif";
import idleLeft from "./Idle/idle_left.gif";
import idleRight from "./Idle/idle_right.gif";
import BulletManager from "./BulletManager";

// Player: controla o jogador — movimento, animações e integração com projéteis.
// Props principais:
// - size, speed: dimensões e velocidade do jogador
// - onPosChange: callback com posição do jogador (x,y)
// - enemies / onEnemyHit: lista de inimigos e callback para quando um inimigo for atingido
// - fireRate, fireRange, bulletSpeed: parâmetros do comportamento de tiro automático

export default function Player({
  size = 200,
  speed = 280,
  playerStats = null,
  paused = false,
  onPosChange,
  alive = true,
  hitboxScale = 0.6,
  worldWidth = typeof window !== "undefined" ? window.innerWidth : 800,
  worldHeight = typeof window !== "undefined" ? window.innerHeight : 600,
  invincible = false,
  // integra bullets: receber lista de inimigos e callback
  enemies = [],
  onEnemyHit = () => {},
  fireRate = 1,
  fireRange = 600,
  bulletSpeed = 600,
}) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const keysRef = useRef(new Set());
  const lastTimeRef = useRef(null);
  const [sprite, setSprite] = useState(idleDown);
  const [lastDir, setLastDir] = useState("down");

  // Input: handlers de teclado (WASD)

  useEffect(() => {
    function handleKeyDown(e) {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    }

    function handleKeyUp(e) {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Coloca o Player no centro ao iniciar
  useEffect(() => {
    const w = Math.max(0, Math.round((worldWidth - size) / 2));
    const h = Math.max(0, Math.round((worldHeight - size) / 2));
    setPos({ x: w, y: h });
  }, [size, worldWidth, worldHeight]);

  // Loop principal: movimento do jogador e troca de sprite

  useEffect(() => {
    let rafId = null;
    const actualSpeed = playerStats && typeof playerStats.speed === "number" ? playerStats.speed : speed;
    const actualFireRate = playerStats && typeof playerStats.fireRate === "number" ? playerStats.fireRate : fireRate;

    if (!alive || paused) {
      // se não está vivo, não correr o loop
      lastTimeRef.current = null;
      return undefined;
    }

    function step(timestamp) {
      if (lastTimeRef.current == null) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000; // em segundos
      lastTimeRef.current = timestamp;

      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has("a")) dx -= 1;
      if (keys.has("d")) dx += 1;
      if (keys.has("w")) dy -= 1;
      if (keys.has("s")) dy += 1;

      // normaliza movimento diagonal
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv;
        dy *= inv;
      }

      setPos((p) => {
        const maxW = Math.max(0, (worldWidth || window.innerWidth) - size);
        const maxH = Math.max(0, (worldHeight || window.innerHeight) - size);
        let nx = p.x + dx * actualSpeed * dt;
        let ny = p.y + dy * speed * dt;
        if (nx < 0) nx = 0;
        if (ny < 0) ny = 0;
        if (nx > maxW) nx = maxW;
        if (ny > maxH) ny = maxH;
        return { x: nx, y: ny };
      });

      // Determina a direção para alterar o sprite
      let dir = lastDir;
      if (keys.has("w")) dir = "up";
      else if (keys.has("s")) dir = "down";
      else if (keys.has("a")) dir = "left";
      else if (keys.has("d")) dir = "right";

      const moving = keys.size > 0;

      if (moving) {
        // Colocar os gifs de andar na direção correta
        switch (dir) {
          case "up":
            if (sprite !== walkUpGif) setSprite(walkUpGif);
            break;
          case "down":
            if (sprite !== walkDownGif) setSprite(walkDownGif);
            break;
          case "left":
            if (sprite !== walkLeftGif) setSprite(walkLeftGif);
            break;
          case "right":
            if (sprite !== walkRightGif) setSprite(walkRightGif);
            break;
          default:
            break;
        }
        setLastDir(dir);
      } else {
        // Idle: colocar os gifs de idle na direção correta
        switch (lastDir) {
          case "up":
            if (sprite !== idleUp) setSprite(idleUp);
            break;
          case "left":
            if (sprite !== idleLeft) setSprite(idleLeft);
            break;
          case "right":
            if (sprite !== idleRight) setSprite(idleRight);
            break;
          case "down":
          default:
            if (sprite !== idleDown) setSprite(idleDown);
            break;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      lastTimeRef.current = null;
    };
  }, [size, speed, sprite, lastDir, alive, worldWidth, worldHeight, paused, playerStats]);

  useEffect(() => {
    if (typeof onPosChange === "function") onPosChange(pos);
  }, [pos, onPosChange]);

  // hitbox size (scaled & centered inside visual sprite)
  const hbSize = Math.round(size * hitboxScale);
  const hbOffset = Math.round((size - hbSize) / 2);

  // center position for bullets
  const centerPos = { x: Math.round(pos.x + size / 2), y: Math.round(pos.y + size / 2) };

  return (
    <div className="game-container" ref={containerRef} style={{ position: "relative" }}>
      {/* visual hitbox for debugging collisions (scaled & centered) */}
      <div
        className="player-hitbox"
        style={{
          width: hbSize,
          height: hbSize,
          transform: `translate(${Math.round(pos.x + hbOffset)}px, ${Math.round(
            pos.y + hbOffset
          )}px)`,
        }}
        aria-hidden
      />

      <div
        className="player"
        style={{
          width: size,
          height: size,
          transform: `translate(${Math.round(pos.x)}px, ${Math.round(
            pos.y
          )}px)`,
          backgroundImage: `url(${sprite})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center center",
          opacity: invincible ? 0.6 : 1,
        }}
        aria-label="player"
      />
      // fo para bulletManager
      <BulletManager
        playerPos={centerPos}
        enemies={enemies}
        fireRate={playerStats && typeof playerStats.fireRate === "number" ? playerStats.fireRate : fireRate}
        fireRange={fireRange}
        bulletSpeed={bulletSpeed}
        onEnemyHit={onEnemyHit}
        worldWidth={worldWidth}
        worldHeight={worldHeight}
      />
    </div>
  );
}
