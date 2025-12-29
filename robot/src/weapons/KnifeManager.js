import React, { useEffect, useRef, useState } from "react";

import slashUp from "./slash-up.gif";
import slashDown from "./slash-down.gif";
import slashLeft from "./slash-left.gif";
import slashRight from "./slash-right.gif";

export default function KnifeManager({
  playerPos,
  enemies,
  inventory,
  onEnemyHit,
  lastDir,
}) {
  const [slashes, setSlashes] = useState([]);
  const slashesRef = useRef([]);
  const lastSlashRef = useRef(0);
  const idRef = useRef(1);

  const fireRate = 1; // slashes por segundo
  const slashRange = 100; // alcance do slash
  const slashDuration = 0.01; // duração

  useEffect(() => {
    let raf = null;
    let last = performance.now();

    function findNearest(px, py) {
      let best = null;
      let bestD2 = Infinity;
      for (const e of enemies || []) {
        const ex = (typeof e.x === "number" ? e.x : 0) + (e.w || 0) / 2;
        const ey = (typeof e.y === "number" ? e.y : 0) + (e.h || 0) / 2;
        const dx = ex - px;
        const dy = ey - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = { ...e, cx: ex, cy: ey, d2 };
        }
      }
      return best;
    }

    function spawnSlash(x, y, dir) {
      const s = { id: idRef.current++, x, y, dir, life: 0 };
      slashesRef.current.push(s);
      setSlashes([...slashesRef.current]);
    }

    function step(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!inventory?.find((item) => item.id === "knife")) {
        raf = requestAnimationFrame(step);
        return;
      }

      const nearest = findNearest(playerPos.x, playerPos.y);
      if (nearest && nearest.d2 <= slashRange * slashRange) {
        const since = now / 1000 - (lastSlashRef.current || 0);
        if (since >= 1 / fireRate) {
          lastSlashRef.current = now / 1000;
          spawnSlash(playerPos.x, playerPos.y, lastDir);

          if (nearest.d2 <= slashRange * slashRange) {
            try {
              onEnemyHit(nearest.id);
            } catch (err) {
              console.error(err);
            }
          }
        }
      }

      // atualizar vida dos slashes
      for (let i = slashesRef.current.length - 1; i >= 0; i--) {
        const s = slashesRef.current[i];
        s.life += dt;
        if (s.life > slashDuration) {
          slashesRef.current.splice(i, 1);
        }
      }
      setSlashes([...slashesRef.current]);

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playerPos, enemies, inventory, onEnemyHit, lastDir]);

  const getSlashStyle = (s) => {
    const size = 200; // tamanho do GIF
    let gif;
    let offsetX = 0;
    let offsetY = 0;

    // define o GIF e o offset dependendo da direção
    switch (s.dir) {
      case "up":
        gif = slashUp;
        offsetY = -size / 2; // aparece acima do jogador
        break;
      case "down":
        gif = slashDown;
        offsetY = size / 2; // aparece abaixo do jogador
        break;
      case "left":
        gif = slashLeft;
        offsetX = -size / 2; // aparece à esquerda
        break;
      case "right":
      default:
        gif = slashRight;
        offsetX = size / 2; // aparece à direita
        break;
    }

    return {
      x: s.x - size / 2 + offsetX,
      y: s.y - size / 2 + offsetY,
      size,
      gif,
    };
  };

  return (
    <>
      {slashes.map((s) => {
        const { x, y, size, gif } = getSlashStyle(s);
        return (
          <img
            key={s.id}
            src={gif}
            style={{
              position: "absolute",
              width: size,
              height: size,
              pointerEvents: "none",
              zIndex: 70,
              transform: `translate(${x}px, ${y}px)`,
            }}
            alt="slash"
          />
        );
      })}
    </>
  );
}
