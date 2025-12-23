import React from "react";
import "./App.css";

// LevelUps: modal simples com 3 escolhas de upgrade.
// Usa o mesmo look do ecrã `game-over`.
export default function LevelUps({ playerStats = {}, onChoose = () => {} }) {
  const choices = [
    {
      id: "speed",
      title: "Velocidade +",
      desc: `+20% velocidade (atual ${Math.round((playerStats.speed || 0))})`,
    },
    {
      id: "damage",
      title: "Dano +",
      desc: `+5 dano (atual ${playerStats.damage || 0})`,
    },
    {
      id: "firerate",
      title: "Cadência +",
      desc: `+15% tiros/s (atual ${playerStats.fireRate || 0} tiros/s)`,
    },
  ];

  return (
    <div className="game-over" role="dialog" aria-modal="true">
      <div>
        <div className="game-over__text">Escolha um upgrade</div>
        <div className="game-over__sub">Escolha uma das opções abaixo para melhorar o seu robo</div>
        <div className="levelup-choices" style={{ marginTop: 18 }}>
          {choices.map((c) => (
            <button
              key={c.id}
              className="levelup-choice"
              onClick={() => onChoose(c.id)}
            >
              <div className="levelup-choice__title">{c.title}</div>
              <div className="levelup-choice__desc">{c.desc}</div>
            </button>
          ))}
        </div>
        </div>
    </div>
  );
}
