import React from "react";
import "./App.css";

// LevelUps: modal simples com 3 escolhas de upgrade.
// Props:
// - playerStats: objeto com stats atuais (speed, damage, fireRate, maxLives)
// - onChoose(choiceId): chamado quando o jogador escolhe uma opção
// - onCancel(): opcional, fechar modal sem escolher
export default function LevelUps({ playerStats = {}, onChoose = () => {}, onCancel = () => {} }) {
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
      desc: `-15% tempo entre tiros (atual ${playerStats.fireRate || 0} tiros/s)`,
    },
  ];

  return (
    <div className="levelup-overlay" role="dialog" aria-modal="true">
      <div className="levelup-modal">
        <h2>Escolha um upgrade</h2>
        <div className="levelup-choices">
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
        <div style={{ marginTop: 8 }}>
          <button onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
