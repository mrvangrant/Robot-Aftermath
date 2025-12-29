import React, { useEffect, useState } from "react";
import chestImg from "./items/chest.png";

const INTERACT_DISTANCE = 120;

export default function Chest({ x, y, playerPos, onOpen, opened }) {
  const [canInteract, setCanInteract] = useState(false);

  // detectar proximidade
  useEffect(() => {
    const dx = playerPos.x - x;
    const dy = playerPos.y - y;
    const dist = Math.hypot(dx, dy);
    setCanInteract(dist < INTERACT_DISTANCE && !opened);
  }, [playerPos, x, y, opened]);

  // tecla E
  useEffect(() => {
    function onKey(e) {
      if (e.key.toLowerCase() === "e" && canInteract) {
        onOpen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canInteract, onOpen]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 96,
        height: 96,
        pointerEvents: "none",
      }}
    >
      <img
        src={chestImg}
        alt="Chest"
        style={{
          width: "100%",
          height: "100%",
          opacity: opened ? 0.5 : 1,
        }}
      />

      {canInteract && (
        <div
          style={{
            position: "absolute",
            top: -24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 6px",
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          Press E
        </div>
      )}
    </div>
  );
}
