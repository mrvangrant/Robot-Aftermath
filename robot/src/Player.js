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

export default function Player({
  size = 200,
  speed = 280,
  onPosChange,
  alive = true,
  hitboxScale = 0.6,
}) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const keysRef = useRef(new Set());
  const lastTimeRef = useRef(null);
  const [sprite, setSprite] = useState(idleDown);
  const [lastDir, setLastDir] = useState("down");

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
    const w =
      (containerRef.current && containerRef.current.clientWidth) ||
      window.innerWidth ||
      800;
    const h =
      (containerRef.current && containerRef.current.clientHeight) ||
      window.innerHeight ||
      600;
    const startX = Math.max(0, Math.round((w - size) / 2));
    const startY = Math.max(0, Math.round((h - size) / 2));
    setPos({ x: startX, y: startY });
  }, [size]);

  useEffect(() => {
    let rafId = null;

    if (!alive) {
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
        const container = containerRef.current || document.documentElement;
        const maxW = (container.clientWidth || window.innerWidth) - size;
        const maxH = (container.clientHeight || window.innerHeight) - size;
        let nx = p.x + dx * speed * dt;
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
  }, [size, speed, sprite, lastDir, alive]);

  // notify parent about position changes
  useEffect(() => {
    if (typeof onPosChange === "function") onPosChange(pos);
  }, [pos, onPosChange]);

  // hitbox size (scaled & centered inside visual sprite)
  const hbSize = Math.round(size * hitboxScale);
  const hbOffset = Math.round((size - hbSize) / 2);

  return (
    <div className="game-container" ref={containerRef}>
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
        }}
        aria-label="player"
      />
    </div>
  );
}
