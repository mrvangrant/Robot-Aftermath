import React, { useState, useEffect } from "react";
import "./App.css";
import CloudManager from "./cloudManager";
import heartImg from "./UI-items/Vida.png";
import Player from "./Player";
import Enemy from "./Enemy";
import EnemyRanger from "./EnemyRanger";
import LevelUps from "./LevelUps";
import Chest from "./Chest";
import backpackImg from "./UI-items/BackPack.png";
import knifeImg from "./items/knife.png";
import PistolImg from "./items/pistol.png";

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
  const deadEnemiesRef = React.useRef(new Set());
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

  //Inventario do jogador e Chests
  const [inventory, setInventory] = useState([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [chests, setChests] = useState([]);

  //recorde de pontuação
  const [maxScore, setMaxScore] = useState(() => {
    const saved = localStorage.getItem("maxScore");
    return saved ? Number(saved) : 0;
  });

  //pontuação do jogador
  const [score, setScore] = useState(0);

  const ENEMY_SCORES = {
    basic: 100,
    ranger: 150,
    tank: 300,
  };

  //player stats
  const [playerStats, setPlayerStats] = useState({
    speed: 200,
    health: 100,
    damage: 10,
    fireRate: 1,
    maxLives: 3,
  });

  // iniciar inventario com a gun
  useEffect(() => {
    setInventory([
      { id: "Pistol", name: "Pistol", icon: PistolImg, rarity: "common" },
    ]);
  }, []);

  // itens possíveis no chest
  const ITEM_POOL = [
    {
      id: "knife",
      name: "Knife",
      icon: knifeImg,
      rarity: "common",
    },
  ];

  //Obter um random item do chest
  function getRandomItem() {
    return ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
  }

  // adicionar item ao inventario
  function addItem(item) {
    setInventory((prev) => [...prev, item]);
  }

  // spawn chests em rondas específicas, a cada 3 rondas
  useEffect(() => {
    if (round % 3 !== 0) return;

    const x = Math.random() * (worldWidth - 100);
    const y = Math.random() * (worldHeight - 100);

    setChests((prev) => [
      ...prev,
      {
        id: Date.now(),
        x,
        y,
        opened: false,
      },
    ]);
  }, [round]);

  // abrir chest
  function openChest(id) {
    const item = getRandomItem();
    addItem(item);

    // remover chest depois de aberto
    setChests((prev) => prev.filter((c) => c.id !== id));
  }

  useEffect(() => {
    function onResize() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleDeath() {
    setPlayerAlive(false);

    setMaxScore((prev) => {
      if (score > prev) {
        localStorage.setItem("maxScore", score);
        return score;
      }
      return prev;
    });

    setPaused(true);
  }

  function handleEnemyHit() {
    if (invincible || !playerAlive) return;

    setLives((prev) => {
      const next = Math.max(0, prev - 1);
      if (next <= 0) handleDeath();
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
    //  já morreu → ignora
    if (deadEnemiesRef.current.has(id)) return;

    // marca como morto imediatamente
    deadEnemiesRef.current.add(id);

    setEnemies((prev) => {
      const enemy = prev.find((e) => e.id === id);

      if (enemy) {
        const points = ENEMY_SCORES[enemy.type] ?? 0;
        setScore((s) => s + points);
      }

      return prev.filter((e) => e.id !== id);
    });

    setKills((k) => {
      const next = k + 1;
      if (next >= killToNext) {
        setShowLevelUp(true);
        setPaused(true);
      }
      return next;
    });
  }

  useEffect(() => {
    deadEnemiesRef.current.clear();
    spawnForRound(round);
  }, [round]);

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
  const base = 5; // inimigos básicos
  const basicCount = Math.max(1, Math.round(base * Math.pow(1.5, r - 1)));

  const list = [];
  const minDist = enemySize * 5; // distância mínima entre inimigos
  const maxW = Math.max(0, worldWidth - enemySize);
  const maxH = Math.max(0, worldHeight - enemySize);

  // Calcular número de Rangers
  let rangerCount = 0;
  if (r >= 3) {
    if (r <= 6) {
      rangerCount = r - 1; // round 3 → 2, round 4 → 3, round 5 → 4, round 6 → 5
    } else {
      rangerCount = 4; // depois da ronda 6 mantém 4 Rangers
    }
  }

  // Spawn básico
  let attempts = 0;
  while (list.length < basicCount && attempts < basicCount * 50) {
    attempts++;
    const rx = Math.floor(Math.random() * maxW);
    const ry = Math.floor(Math.random() * maxH);

    let ok = true;
    for (const e of list) {
      if (Math.hypot(e.x - rx, e.y - ry) < minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    list.push({
      id: enemyIdRef.current++,
      x: rx,
      y: ry,
      type: "basic",
    });
  }

  // Spawn Rangers
  attempts = 0;
  let spawnedRangers = 0;
  while (spawnedRangers < rangerCount && attempts < rangerCount * 50) {
    attempts++;
    const rx = Math.floor(Math.random() * maxW);
    const ry = Math.floor(Math.random() * maxH);

    let ok = true;
    for (const e of list) {
      if (Math.hypot(e.x - rx, e.y - ry) < minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    list.push({
      id: enemyIdRef.current++,
      x: rx,
      y: ry,
      type: "ranger",
    });
    spawnedRangers++;
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

  //Mochila - abrir/fechar com a tecla "I"
  useEffect(() => {
    function handleKey(e) {
      if (e.key.toLowerCase() === "i") {
        setInventoryOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
      <CloudManager cameraX={tx} cameraY={ty} />
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
              inventory={inventory}
            />

            {chests.map((c) => (
              <Chest
                key={c.id}
                x={c.x}
                y={c.y}
                playerPos={playerPos}
                opened={c.opened}
                onOpen={() => openChest(c.id)}
              />
            ))}

            {enemies.map((e) =>
            e.type === "basic" ? (
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
                onHitPlayer={() => handleEnemyHit()}
                paused={paused}
                worldWidth={worldWidth}
                worldHeight={worldHeight}
              />
            ) : (
              <EnemyRanger
                key={e.id}
                id={e.id}
                initialPos={e}
                playerPos={playerPos}
                paused={paused}
                onHitPlayer={handleEnemyHit}
                size={enemySize}
              />
            )
          )}
        </div>
      </div>
        <div className="lives" aria-hidden>
          {Array.from({ length: lives }).map((_, i) => (
            <img key={i} src={heartImg} alt={`life-${i + 1}`} />
          ))}
        </div>
        <div className="hud">
          <div className="hud__round">
            Round: {round}
            <div className="hud__max-round">Highscore: {maxScore}</div>
          </div>
          <div className="hud__enemies">
            Inimigos Restantes: {enemies.length}
            <div className="hud__score">Pontuação: {score}</div>
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

      <div className="inventory-container">
        <img
          src={backpackImg}
          alt="backpack"
          className="backpack"
          onClick={() => setInventoryOpen((prev) => !prev)}
        />

        {inventoryOpen && (
          <div className="inventory-modal">
            {inventory.length === 0 ? (
              <div className="inventory-empty">Mochila vazia</div>
            ) : (
              <div className="inventory-grid">
                {inventory.map((item, i) => (
                  <div
                    key={i}
                    className={`inventory-slot ${item.rarity || "common"}`}
                  >
                    <img src={item.icon} alt={item.name} />
                    <div className="inventory-name">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {!playerAlive && (
        <div className="game-over" role="dialog" aria-modal="true">
          <div>
            <div className="game-over__text">You died</div>
            <div className="game-over__sub">Ronda alcançada: {round}</div>
            <div className="game-over__sub">Pontuação: {score}</div>
            <div className="game-over__sub">Refresh to try again</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
