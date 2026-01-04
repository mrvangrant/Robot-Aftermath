import React, { useState, useEffect } from "react";
import "./App.css";
import CloudManager from "./cloudManager";
import heartImg from "./UI-items/Vida.png";
import Player from "./Player";
import Enemy from "./Enemy";
import LevelUps from "./LevelUps";
import Chest from "./Chest";
import backpackImg from "./UI-items/BackPack.png";
import knifeImg from "./items/knife.png";
import SMGImg from "./items/smg.png";
import PistolImg from "./items/pistol.png";
import ShotgunImg from "./items/shotgun.png";
import Walls from "./Walls"; // Import the new Walls component
import backgroundTile from "./background/Tileset_1.png";
import boomImg from "./robot/boom.png";
import playerIdle from "./player-idle/idle_down.gif";
import robotLeft from "./robot/robot-left.gif";
import chestImg from "./items/chest.png";
import SoundManager from "./SoundManager";
import pickupKnife from "./soundfx/knife-pickup.wav";
import pickupSMG from "./soundfx/machinegun-pickup.wav";
import pickupShotgun from "./soundfx/shotgun-pickup.wav";
import explosionSound from "./soundfx/robot-death.wav";
import gameOverSound from "./soundfx/game-over.wav";
import playerHitSound from "./soundfx/player-hurt.wav";
import pistolAttackSound from "./soundfx/pistol-shot.wav";
import smgAttackSound from "./soundfx/smg-shot.wav";
import shotgunAttackSound from "./soundfx/shotgun-shot.wav";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [fadeOutStart, setFadeOutStart] = useState(false);
  const [showSobre, setShowSobre] = useState(false);
  const playerSize = 200; // tamanho do jogador
  const playerHitboxScale = 0.3;
  const playerHitboxSize = Math.round(playerSize * playerHitboxScale);
  const playerHitboxOffset = Math.round((playerSize - playerHitboxSize) / 2);
  const enemySize = 80; // tamanho dos inimigos
  const wallThickness = 20; // espessura das paredes
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
  const [flash, setFlash] = useState(false);
  const [explosions, setExplosions] = useState([]);
  const [pickupItems, setPickupItems] = useState([]);

  //constantes para subir de nivel e contar kills
  const [kills, setKills] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [paused, setPaused] = useState(false);
  const prevRoundRef = React.useRef(round);

  //Inventario do jogador e Chests
  const [inventory, setInventory] = useState([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [chests, setChests] = useState([]);

  // scoring
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("highScore")) || 0;
  });

  // adicionar explosão do inimigo
  function addExplosion(x, y) {
    const id = Date.now() + Math.random(); // ID único
    setExplosions((prev) => [...prev, { id, x, y }]);
    // remove depois de 500ms
    setTimeout(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== id));
    }, 500);
  }

  // carregar sons uma vez
  useEffect(() => {
    //pickups
    SoundManager.loadSound("Knife", pickupKnife);
    SoundManager.loadSound("SMG", pickupSMG);
    SoundManager.loadSound("Shotgun", pickupShotgun);

    //disparos
    SoundManager.loadSound("PistolAttack", pistolAttackSound);
    SoundManager.loadSound("SMGAttack", smgAttackSound);
    SoundManager.loadSound("ShotgunAttack", shotgunAttackSound);

    //explosao do robot
    SoundManager.loadSound("Explosion", explosionSound);

    //game over
    SoundManager.loadSound("GameOver", gameOverSound);

    //player hit
    SoundManager.loadSound("PlayerHit", playerHitSound);
  }, []);

  //player stats
  const [playerStats, setPlayerStats] = useState({
    speed: 200,
    damage: 10,
    maxLives: 3,
  });

  // pontuação ao matar inimigos
  const ENEMY_SCORE = {
    basic: 100,
    // future:
    // ranger: 150,
    // tank: 300,
  };

  function triggerFlash() {
    setFlash(true);
    setTimeout(() => setFlash(false), 200); // dura 200ms
  }

  // detectar mudança de ronda para mostrar LevelUp
  useEffect(() => {
    if (round !== prevRoundRef.current) {
      // nova ronda -> mostrar LevelUp
      setShowLevelUp(true);
      setPaused(true);
      prevRoundRef.current = round;
    }
  }, [round]);

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
    {
      id: "SMG",
      name: "SMG",
      icon: SMGImg,
      rarity: "rare",
    },
    {
      id: "Shotgun",
      name: "Shotgun",
      icon: ShotgunImg,
      rarity: "rare",
    },
  ];

  //Obter um random item do chest
  function getRandomItem() {
    // filtrar itens que o jogador AINDA NÃO TEM
    const availableItems = ITEM_POOL.filter(
      (item) => !inventory.some((inv) => inv.id === item.id)
    );

    // se já tiver tudo, não dropa nada
    if (availableItems.length === 0) return null;

    return availableItems[Math.floor(Math.random() * availableItems.length)];
  }

  // adicionar item ao inventario
  function addItem(item) {
    setInventory((prev) => [...prev, item]);

    SoundManager.playSound(item.id);
  }

  // spawn chests em rondas específicas, a cada 3 rondas
  useEffect(() => {
    const availableItems = ITEM_POOL.filter(
      (item) => !inventory.some((inv) => inv.id === item.id)
    );
    if (availableItems.length === 0) return;

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

  // animação de pickup de item
  function triggerItemPickup(item, x, y) {
    const id = Date.now() + Math.random(); // id único
    setPickupItems((prev) => [...prev, { id, item, x, y, opacity: 1 }]);

    // animação de fade
    const fadeDuration = 1000; // 1 segundo
    const interval = 50;
    let elapsed = 0;

    const fade = setInterval(() => {
      elapsed += interval;
      setPickupItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, opacity: 1 - elapsed / fadeDuration } : p
        )
      );

      if (elapsed >= fadeDuration) {
        clearInterval(fade);
        setPickupItems((prev) => prev.filter((p) => p.id !== id));
      }
    }, interval);
  }

  // abrir chest
  function openChest(chestId) {
    // encontra o chest que está a abrir
    const chest = chests.find((c) => c.id === chestId);
    if (!chest) return;

    const item = getRandomItem();

    if (item) {
      addItem(item);
      // dispara efeito na posição do chest
      triggerItemPickup(item, chest.x, chest.y);
    }

    // remove chest depois de aberto
    setChests((prev) => prev.filter((c) => c.id !== chestId));
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
  }

  function handleEnemyHit() {
    if (invincible || !playerAlive) return;

    SoundManager.playSound("PlayerHit", 0.4);

    setLives((prev) => {
      const next = Math.max(0, prev - 1);

      if (next <= 0) {
        setPlayerAlive(false);

        SoundManager.stopMusic();

        SoundManager.playSound("GameOver", 0.7);
      }

      return next;
    });

    triggerFlash();

    // 2 segundos de invencibilidade
    setInvincible(true);
    setTimeout(() => setInvincible(false), 2000);
  }

  function handleEnemyHitById(id) {
    handleEnemyHit();
  }

  // quando um inimigo é atingido por uma bala, removemos do array
  function handleEnemyKilled(id, enemyType = "basic") {
    const enemy = enemies.find((e) => e.id === id);
    if (enemy) {
      addExplosion(enemy.x + enemySize / 2, enemy.y + enemySize / 2);

      SoundManager.playSound("Explosion", 0.2);
    }

    setEnemies((prev) => prev.filter((e) => e.id !== id));

    const points = ENEMY_SCORE[enemyType] || 0;

    setScore((prev) => {
      const next = prev + points;

      setHighScore((hs) => {
        if (next > hs) {
          localStorage.setItem("highScore", next);
          return next;
        }
        return hs;
      });

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

  //Start Screen
  if (showStartScreen) {
    return (
      <div className={`start-screen ${fadeOutStart ? "fade-out" : ""}`}>
        <h1>Robot Aftermath</h1>
        <div className="start-buttons">
          <button
            onClick={() => {
              setFadeOutStart(true);
              setTimeout(() => {
                setShowStartScreen(false);
                setGameStarted(true);
              }, 500); // corresponde à duração do fade
            }}
          >
            Play
          </button>
          <button onClick={() => window.close()}>Quit</button>
          <button onClick={() => setShowSobre((prev) => !prev)}>Sobre</button>
        </div>
        {showSobre && (
          <div className="sobre">
            <div>
              <img src={playerIdle} alt="Player" />
              Player
            </div>
            <div>
              <img src={robotLeft} alt="Enemy" />
              Enemy
            </div>
            <div>
              <img src={heartImg} alt="Heart" />
              Life
            </div>
            <div>
              <img src={backpackImg} alt="Inventory" />
              Inventory
            </div>
            <div>
              <img src={chestImg} alt="Chest" />
              Chest
            </div>
            <div>
              <img src={PistolImg} alt="Pistol" />
              Pistol
            </div>
            <div>
              <img src={knifeImg} alt="Knife" />
              Knife
            </div>
            <div>
              <img src={SMGImg} alt="SMG" />
              SMG
            </div>
            <div>
              <img src={ShotgunImg} alt="Shotgun" />
              Shotgun
            </div>
          </div>
        )}
      </div>
    );
  }
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
              backgroundImage: `url(${backgroundTile})`,
              backgroundRepeat: "repeat",
              backgroundSize: "16px 16px",
            }}
          >
            {/* Render the walls */}
            <Walls
              worldWidth={worldWidth}
              worldHeight={worldHeight}
              wallThickness={wallThickness}
            />
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
              wallThickness={wallThickness}
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
            {pickupItems.map((p) => (
              <img
                key={p.id}
                src={p.item.icon}
                alt={p.item.name}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: 100, // tamanho do item no chão
                  height: 100,
                  pointerEvents: "none",
                  opacity: p.opacity,
                  transition: "opacity 0.05s linear",
                  zIndex: 1000,
                }}
              />
            ))}
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
                wallThickness={wallThickness}
              />
            ))}
            {explosions.map((e) => (
              <img
                key={e.id}
                src={boomImg}
                alt="explosion"
                style={{
                  position: "absolute",
                  width: enemySize,
                  height: enemySize,
                  top: e.y - enemySize / 2,
                  left: e.x - enemySize / 2,
                  pointerEvents: "none",
                  zIndex: 1000,
                }}
              />
            ))}
          </div>
        </div>
        <div className="lives" aria-hidden>
          {Array.from({ length: lives }).map((_, i) => (
            <img key={i} src={heartImg} alt="" />
          ))}
        </div>
        <div className="hud">
          <div className="hud__round">
            Ronda: {round}
            <div className="hud__highscore">Highscore: {highScore}</div>
          </div>
          <div className="hud__enemies">
            Inimigos Restantes: {enemies.length}
            <div className="hud__score">Score: {score}</div>
          </div>
        </div>
      </header>

      {showLevelUp && (
        <LevelUps
          onChoose={(upgrade) => {
            setPlayerStats((prev) => {
              const next = { ...prev };

              switch (upgrade.type) {
                case "damage":
                  next.damage = (next.damage || 10) + upgrade.value;
                  break;

                case "speed":
                  next.speed = Math.round(
                    (next.speed || 200) * (1 + upgrade.value)
                  );
                  break;

                case "life":
                  next.maxLives = (next.maxLives || 3) + upgrade.value;
                  setLives((l) => l + upgrade.value);
                  break;

                default:
                  break;
              }

              return next;
            });

            // reset normal do level up
            setLevel((l) => l + 1);
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
            <div className="game-over__sub">Refresh to try again</div>
          </div>
        </div>
      )}
      {flash && <div className="flash" />}
    </div>
  );
}

export default App;
