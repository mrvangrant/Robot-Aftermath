import React, { useState, useEffect } from "react";
import RangerBulletManager from "./weapons/RangerBulletManager";
import rangerSpriteLeft from "./robot/ranger-left.gif";
import rangerSpriteRight from "./robot/ranger-right.gif";

export default function EnemyRanger({
  id,
  initialPos,
  playerPos,
  paused,
  onHitPlayer,
  size = 80,
}) {
  const [pos, setPos] = useState({ x: initialPos.x, y: initialPos.y });
  const [direction, setDirection] = useState("right");

  useEffect(() => {
    setPos({ x: initialPos.x, y: initialPos.y });
  }, [initialPos]);

  // Atualiza a direção do sprite baseado na posição do jogador
  useEffect(() => {
    const dx = playerPos.x - pos.x;
    setDirection(dx < 0 ? "left" : "right");
  }, [playerPos, pos]);

  const spriteImage =
    direction === "left" ? rangerSpriteLeft : rangerSpriteRight;

  return (
    <div className="enemy-container" aria-hidden>
      <div
        className="enemy"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
      >
        <img
          src={spriteImage}
          alt="ranger"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {!paused && (
        <RangerBulletManager
          enemyPos={{ x: pos.x + size / 2, y: pos.y + size / 2 }}
          playerPos={playerPos}
          onHitPlayer={onHitPlayer}
          paused={paused}
        />
      )}
    </div>
  );
}
