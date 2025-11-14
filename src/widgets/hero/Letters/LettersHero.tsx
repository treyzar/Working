import React from "react";

type Props = { onCreate: () => void };

export const LettersHero: React.FC<Props> = ({ onCreate }) => (
  <div className="letters-hero">
    <div className="hero-inner container-1600">
      <div className="hero-text">
        <h1 className="h1">Исходящие письма</h1>
        <div className="hero-sub">Реестр документов и вложений</div>
      </div>
      <button
        type="button"
        aria-label="Создать письмо"
        className="btn btn-accent fab-add"
        onClick={onCreate}
        title="Создать"
      >
        <span>+</span>
      </button>
    </div>
  </div>
);
