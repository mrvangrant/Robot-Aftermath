import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import walkUpGif from "./player-walk/walk_up.gif";
import walkDownGif from "./player-walk/walk_down.gif";
import walkLeftGif from "./player-walk/walk_left.gif";
import walkRightGif from "./player-walk/walk_right.gif";
import idleUp from "./player-idle/idle_up.gif";
import idleDown from "./player-idle/idle_down.gif";
import idleLeft from "./player-idle/idle_left.gif";
import idleRight from "./player-idle/idle_right.gif";
import death from "./player-idle/death.gif";
import BulletManager from "./weapons/BulletManager";
import KnifeManager from "./weapons/KnifeManager";

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
  enemies = [],
  onEnemyHit = () => {},
  fireRate = 1,
  fireRange = 600,
  bulletSpeed = 600,
  inventory = [],
}) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const keysRef = useRef(new Set());
  const lastTimeRef = useRef(null);
  const [sprite, setSprite] = useState(idleDown);
  const [lastDir, setLastDir] = useState("down");
  const [deadAnimStarted, setDeadAnimStarted] = useState(false);

  // Input handlers
  useEffect(() => {
    function handleKeyDown(e) {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    }
    function handleKeyUp(e) {
      keysRef.current.delete(e.key.toLowerCase());
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // centraliza jogador
  useEffect(() => {
    setPos({
      x: Math.round((worldWidth - size) / 2),
      y: Math.round((worldHeight - size) / 2),
    });
  }, [size, worldWidth, worldHeight]);

  // loop principal de movimento e sprites
  useEffect(() => {
    let rafId = null;
    const actualSpeed = playerStats?.speed ?? speed;

    if (!alive || paused) {
      lastTimeRef.current = null;
      return undefined;
    }

    function step(timestamp) {
      if (lastTimeRef.current == null) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const keys = keysRef.current;
      let dx = 0,
        dy = 0;
      if (keys.has("a")) dx -= 1;
      if (keys.has("d")) dx += 1;
      if (keys.has("w")) dy -= 1;
      if (keys.has("s")) dy += 1;

      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv;
        dy *= inv;
      }

      setPos((p) => {
        let nx = p.x + dx * actualSpeed * dt;
        let ny = p.y + dy * actualSpeed * dt;
        nx = Math.max(0, Math.min(nx, worldWidth - size));
        ny = Math.max(0, Math.min(ny, worldHeight - size));
        return { x: nx, y: ny };
      });

      // direção do sprite
      let dir = lastDir;
      if (keys.has("w")) dir = "up";
      else if (keys.has("s")) dir = "down";
      else if (keys.has("a")) dir = "left";
      else if (keys.has("d")) dir = "right";

      const moving = keys.size > 0;
      if (moving) {
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
        }
        setLastDir(dir);
      } else {
        switch (lastDir) {
          case "up":
            if (sprite !== idleUp) setSprite(idleUp);
            break;
          case "down":
            if (sprite !== idleDown) setSprite(idleDown);
            break;
          case "left":
            if (sprite !== idleLeft) setSprite(idleLeft);
            break;
          case "right":
            if (sprite !== idleRight) setSprite(idleRight);
            break;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [
    size,
    speed,
    sprite,
    lastDir,
    alive,
    worldWidth,
    worldHeight,
    paused,
    playerStats,
  ]);

  useEffect(() => {
    if (onPosChange) onPosChange(pos);
  }, [pos, onPosChange]);

  const hbSize = Math.round(size * hitboxScale);
  const hbOffset = Math.round((size - hbSize) / 2);

  const centerPos = {
    x: Math.round(pos.x + size / 2),
    y: Math.round(pos.y + size / 2),
  };

  useEffect(() => {
    if (!alive && !deadAnimStarted) {
      setDeadAnimStarted(true);
      setSprite(death);
    }
  }, [alive, deadAnimStarted]);

  return (
    <div
      className="game-container"
      ref={containerRef}
      style={{ position: "relative" }}
    >
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
      {/* BulletManager */}
      {alive && !paused && (
        <BulletManager
          playerPos={centerPos}
          enemies={enemies}
          fireRate={playerStats?.fireRate}
          fireRange={fireRange}
          bulletSpeed={bulletSpeed}
          onEnemyHit={onEnemyHit}
          worldWidth={worldWidth}
          worldHeight={worldHeight}
        />
      )}
      {/* KnifeManager */}
      {alive && !paused && (
        <KnifeManager
          playerPos={centerPos}
          lastDir={lastDir}
          enemies={enemies}
          inventory={inventory}
          onEnemyHit={onEnemyHit}
        />
      )}
    </div>
  );
}
