import React, { useState, useEffect } from "react";
import "./App.css";
import CloudManager from "./cloudManager";
import heartImg from "./Vida.png";
import Player from "./Player";
import Enemy from "./Enemy";
import LevelUps from "./LevelUps";

function App() {
  const playerSize = 200; // tamanho do jogador
  const playerHitboxScale = 0.3;
  const playerHitboxSize = Math.round(playerSize * playerHitboxScale);
  const playerHitboxOffset = Math.round((playerSize - playerHitboxSize) / 2);
  const enemySize = 80; // tamanho dos inimigos
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });
  const [playerAlive, setPlayerAlive] = useState(true);
  const maxLives = 3;
  const [lives, setLives] = useState(maxLives);
  const [invincible, setInvincible] = useState(false);
  const [round, setRound] = useState(1);
  const [enemies, setEnemies] = useState([]);
  const enemyIdRef = React.useRef(1);
  const [viewport, setViewport] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 800,
    h: typeof window !== "undefined" ? window.innerHeight : 600,
  });
  //constantes para subir de nivel e contar kills
  const [kills, setKills] = useState(0);
  const [level, setLevel] = useState(1);
  const [killToNext, setKillsToNext] = useState(5);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [paused, setPaused] = useState(false);

  //player stats
  const [playerStats, setPlayerStats] = useState({
    speed: 200,
    health: 100,
    damage: 10,
    fireRate: 1,
    maxLives: 3,
  });

  useEffect(() => {
    function onResize() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleDeath() {
    setPlayerAlive(false);
  }

  function handleEnemyHit() {
    if (invincible || !playerAlive) return;

    setLives((prev) => {
      const next = Math.max(0, prev - 1);
      if (next <= 0) setPlayerAlive(false);
      return next;
    });

    // 2 segundos de invencibilidade
    setInvincible(true);
    setTimeout(() => setInvincible(false), 2000);
  }

  function handleEnemyHitById(id) {
    handleEnemyHit();
  }

  // quando um inimigo é atingido por uma bala, removemos do array
  function handleEnemyKilled(id) {
    setEnemies((prev) => prev.filter((e) => e.id !== id));
    setKills((k) => {
      const next = k + 1;
      // abrir level up se atingir threshold
      if (next >= killToNext) {
        setShowLevelUp(true);
        setPaused(true);
      }
      return next;
    });
  }

  // recebe atualizações de posição dos inimigos
  function updateEnemyPos(id, x, y, size) {
    setEnemies((prev) => {
      let changed = false;
      const next = prev.map((e) => {
        if (e.id === id) {
          if (e.x !== x || e.y !== y) changed = true;
          return { ...e, x, y, w: size, h: size };
        }
        return e;
      });
      return changed ? next : prev;
    });
  }

  // spawn numero de inimigos baseado na ronda
  function spawnForRound(r) {
    // base inicial de inimigos
    const base = 5;
    // aumenta 50% a cada ronda: base * 1.5^(r-1)
    const count = Math.max(1, Math.round(base * Math.pow(1.5, r - 1)));
    const list = [];
    const minDist = enemySize * 5; // distancia minima entre inimigos
    const maxW = Math.max(0, worldWidth - enemySize);
    const maxH = Math.max(0, worldHeight - enemySize);
    // área visível do jogador (em coordenadas do mundo): queremos spawnar inimigos fora desta área
    const playerCenterX = playerPos.x + playerSize / 2;
    const playerCenterY = playerPos.y + playerSize / 2;
    const visibleLeft = playerCenterX - viewport.w / 2;
    const visibleTop = playerCenterY - viewport.h / 2;
    const visibleRight = visibleLeft + viewport.w;
    const visibleBottom = visibleTop + viewport.h;
    const spawnMargin = 100; // pixels de margem extra fora do ecrã
    let attempts = 0;
    while (list.length < count && attempts < count * 50) {
      attempts++;
      const rx = Math.floor(Math.random() * (maxW || 1));
      const ry = Math.floor(Math.random() * (maxH || 1));
      // rejeita posições muito perto de outros inimigos
      let ok = true;
      for (const e of list) {
        const dx = e.x - rx;
        const dy = e.y - ry;
        if (Math.hypot(dx, dy) < minDist) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      // rejeita posições que fiquem dentro da área visível do jogador (com margem)
      const insideVisible =
        rx >= visibleLeft - spawnMargin &&
        rx <= visibleRight + spawnMargin &&
        ry >= visibleTop - spawnMargin &&
        ry <= visibleBottom + spawnMargin;
      if (insideVisible) continue;
      list.push({ id: enemyIdRef.current++, x: rx, y: ry });
    }
    while (list.length < count) {
      const rx = Math.floor(Math.random() * (maxW || 1));
      const ry = Math.floor(Math.random() * (maxH || 1));
      list.push({ id: enemyIdRef.current++, x: rx, y: ry });
    }
    setEnemies(list);
  }

  const worldWidth = Math.max(viewport.w * 2, 2000);
  const worldHeight = Math.max(viewport.h * 2, 2000);

  // spawn inimigos ao iniciar e ao mudar de ronda
  useEffect(() => {
    spawnForRound(round);
  }, [round]);

  // Avança para a próxima ronda automaticamente quando não restarem inimigos
  // Espera 3 segundos antes de avançar; cancela se novos inimigos surgirem
  useEffect(() => {
    if (enemies.length !== 0) return undefined;
    const t = setTimeout(() => setRound((r) => r + 1), 3000);
    return () => clearTimeout(t);
  }, [enemies.length]);

  // centraliza a camera no jogador
  let tx = -playerPos.x + viewport.w / 2 - playerSize / 2;
  let ty = -playerPos.y + viewport.h / 2 - playerSize / 2;
  // Faz com que a camera não mostre áreas fora do mundo
  const minTx = -(worldWidth - viewport.w);
  const minTy = -(worldHeight - viewport.h);
  if (tx > 0) tx = 0;
  if (tx < minTx) tx = minTx;
  if (ty > 0) ty = 0;
  if (ty < minTy) ty = minTy;

  return (
    <div className="App">
      <CloudManager />
      <header className="App-header">
        <div
          className="camera"
          style={{
            width: viewport.w,
            height: viewport.h,
            position: "absolute",
            inset: 0,
          }}
        >
          <div
            className="world"
            style={{
              width: worldWidth,
              height: worldHeight,
              transform: `translate3d(${Math.round(tx)}px, ${Math.round(
                ty
              )}px, 0)`,
              position: "absolute",
              left: 0,
              top: 0,
            }}
          >
            <Player
              size={playerSize}
              // usar playerStats quando disponível
              playerStats={playerStats}
              paused={paused}
              onPosChange={setPlayerPos}
              alive={playerAlive}
              hitboxScale={playerHitboxScale}
              invincible={invincible}
              worldWidth={worldWidth}
              worldHeight={worldHeight}
              enemies={enemies}
              onEnemyHit={handleEnemyKilled}
            />
            {enemies.map((e) => (
              <Enemy
                key={e.id}
                id={e.id}
                initialPos={e}
                allEnemies={enemies}
                onPosUpdate={updateEnemyPos}
                playerPos={playerPos}
                size={enemySize}
                speed={220}
                playerHitboxSize={playerHitboxSize}
                playerHitboxOffset={playerHitboxOffset}
                onDie={(id) => handleEnemyHitById(id)}
                paused={paused}
                worldWidth={worldWidth}
                worldHeight={worldHeight}
              />
            ))}
          </div>
        </div>
        <div className="lives" aria-hidden>
          {Array.from({ length: lives }).map((_, i) => (
            <img key={i} src={heartImg} alt={`life-${i + 1}`} />
          ))}
        </div>
        <div className="hud">
          <div className="hud__round">Ronda: {round}</div>
          <div className="hud__enemies">
            Inimigos Restantes: {enemies.length}
          </div>
          <div className="hud__level">Nível: {level}</div>
          <div className="hud__kills">
            Kills: {kills}/{killToNext}
          </div>
        </div>
      </header>

      {showLevelUp && (
        <LevelUps
          playerStats={playerStats}
          onChoose={(choiceId) => {
            // aplicar upgrades simples
            setPlayerStats((prev) => {
              const next = { ...prev };
              switch (choiceId) {
                case "speed":
                  next.speed = Math.round((next.speed || 200) * 1.2);
                  break;
                case "damage":
                  next.damage = (next.damage || 10) + 5;
                  break;
                case "firerate":
                  // aumentar tiros por segundo
                  next.fireRate = Number(
                    ((next.fireRate || 1) * 1.15).toFixed(2)
                  );
                  break;
                default:
                  break;
              }
              return next;
            });
            // avança nível e reinicia kills
            setLevel((l) => l + 1);
            setKills(0);
            setKillsToNext((k) => Math.max(1, Math.round(k * 1.5)));
            setShowLevelUp(false);
            setPaused(false);
          }}
          onCancel={() => {
            setShowLevelUp(false);
            setPaused(false);
          }}
        />
      )}
      {!playerAlive && (
        <div className="game-over" role="dialog" aria-modal="true">
          <div>
            <div className="game-over__text">You died</div>
            <div className="game-over__sub">Refresh to try again</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
