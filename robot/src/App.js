import React, { useState } from "react";
import "./App.css";
import Player from "./Player";
import Enemy from "./Enemy";

function App() {
  const playerSize = 200;
  const playerHitboxScale = 0.3;
  const playerHitboxSize = Math.round(playerSize * playerHitboxScale);
  const playerHitboxOffset = Math.round((playerSize - playerHitboxSize) / 2);
  const enemySize = 96;
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });
  const [playerAlive, setPlayerAlive] = useState(true);

  function handleDeath() {
    setPlayerAlive(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <Player
          size={playerSize}
          speed={280}
          onPosChange={setPlayerPos}
          alive={playerAlive}
          hitboxScale={playerHitboxScale}
        />
        <Enemy
          playerPos={playerPos}
          size={enemySize}
          speed={160}
          playerHitboxSize={playerHitboxSize}
          playerHitboxOffset={playerHitboxOffset}
          onDie={handleDeath}
        />
      </header>
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
