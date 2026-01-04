import React, { useMemo } from "react";
import "./App.css";

export default function LevelUps({ onChoose = () => {} }) {
  const UPGRADE_POOL = [
    // ----- DANO -----
    {
      id: "damage_common",
      type: "damage",
      value: 2,
      rarity: "common",
      title: "+2 Dano",
      desc: "Dano aumentado ligeiramente",
    },
    {
      id: "damage_rare",
      type: "damage",
      value: 5,
      rarity: "rare",
      title: "+5 Dano",
      desc: "Dano aumentado bastante",
    },

    // ----- VELOCIDADE -----
    {
      id: "speed_common",
      type: "speed",
      value: 0.1, // +10%
      rarity: "common",
      title: "Velocidade +10%",
      desc: "Movimento ligeiramente mais rápido",
    },
    {
      id: "speed_rare",
      type: "speed",
      value: 0.25, // +25%
      rarity: "rare",
      title: "Velocidade +25%",
      desc: "Movimento muito mais rápido",
    },

    // ----- VIDA -----
    {
      id: "life_rare",
      type: "life",
      value: 1,
      rarity: "rare",
      title: "+2 Vida",
      desc: "Ganha 2 vidas extra",
    },
  ];

  // escolher 2 upgrades aleatórios
  const choices = useMemo(() => {
    const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, []);

  return (
    <div className="game-over" role="dialog" aria-modal="true">
      <div>
        <div className="game-over__text">Escolhe um upgrade</div>

        <div className="levelup-choices" style={{ marginTop: 18 }}>
          {choices.map((c) => (
            <button
              key={c.id}
              className={`levelup-choice ${c.rarity}`}
              onClick={() => onChoose(c)}
            >
              <div className="levelup-choice__title">
                {c.title}
                <span className={`rarity ${c.rarity}`}>
                  {c.rarity.toUpperCase()}
                </span>
              </div>
              <div className="levelup-choice__desc">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
