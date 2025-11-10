import React from "react";
import type { IExecutor } from "../../../shared/interfaces/interfaces";

type Props = {
  executors: IExecutor[];
  selectedExecutor: string;
  onChange: (val: string) => void;
  onReset: () => void;
};

export const LettersFilters: React.FC<Props> = ({
  executors,
  selectedExecutor,
  onChange,
  onReset,
}) => (
  <div className="card-bs filters-card">
    <div className="card-header-bs">
      <div className="head">
        <i className="bi bi-funnel" />
        <div>
          <div className="title">Фильтры</div>
          <div className="sub">Уточните выборку по исполнителю</div>
        </div>
      </div>
    </div>
    <div className="card-body">
      <div className="dir-search">
        <select
          id="executor-select"
          className="form-select dir-control"
          value={selectedExecutor}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Выберите исполнителя</option>
          {executors.map((e) => (
            <option key={e.id} value={e.id.toString()}>
              {e.username}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline reset-btn"
          onClick={onReset}
        >
          Сброс
        </button>
      </div>
    </div>
  </div>
);
