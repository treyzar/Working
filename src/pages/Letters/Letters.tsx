import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import Mark from "mark.js";
import $ from "jquery";
import DT from "datatables.net-dt";
import DataTable from "datatables.net-dt";
import type { IExecutor } from "../../shared/interfaces/interfaces";
import { LettersTableSettings } from "./constants";
import CreateModal from "./ui/createModal";
import "./Letters.scss";

DataTable.use(DT);

const Letters: React.FC = () => {
  const tableRef = useRef<HTMLTableElement>(null);
  const dtRef = useRef<DataTables.Api | null>(null);
  const [executors, setExecutors] = useState<IExecutor[]>([]);
  const [selectedExecutor, setSelectedExecutor] = useState("");
  const executorRef = useRef<string>("");
  useEffect(() => {
    executorRef.current = selectedExecutor;
  }, [selectedExecutor]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreated = () => {
    dtRef.current?.ajax.reload(null, false);
  };
  useLayoutEffect(() => {
    fetch("http://127.0.0.1:8000/edo/api/users/?executor_only=true")
      .then((r) => r.json())
      .then((data: IExecutor[] | { results?: IExecutor[] }) =>
        setExecutors(Array.isArray(data) ? data : data.results ?? [])
      )
      .catch(() => setError("Ошибка при загрузке исполнителей"));
  }, []);

  useEffect(() => {
    if (!tableRef.current) return;
    const $table = $(tableRef.current);

    const applyHighlight = () => {
      const tbody = tableRef.current?.tBodies?.[0];
      if (!tbody) return;
      const term = String(dtRef.current?.search?.() ?? "").trim();
      const marker = new Mark(tbody);
      marker.unmark({
        done: () => {
          if (!term) return;
          marker.mark(term, {
            separateWordSearch: false,
            className: "dt-hl",
            diacritics: true,
            acrossElements: true,
          });
        },
      });
    };

    if (!dtRef.current) {
      dtRef.current = $table.DataTable({
        serverSide: true,
        processing: true,
        ajax: LettersTableSettings.ajax(() => executorRef.current, setError),
        columns: LettersTableSettings.columns,
        language: LettersTableSettings.language,
        pageLength: 20,
        lengthMenu: [20, 50, 100],
        initComplete: LettersTableSettings.initComplete(
          $table,
          dtRef,
          navigate,
          applyHighlight,
          () => setLoading(false)
        ),
      });
    } else {
      dtRef.current.ajax.reload();
    }
  }, [selectedExecutor, navigate]);

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-funnel me-2 fs-4"></i>
            <div>
              <h6 className="mb-0">Фильтры</h6>
              <small className="text-muted">
                Уточните выборку по исполнителю
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <select
              id="executor-select"
              className="form-select"
              value={selectedExecutor}
              onChange={(e) => setSelectedExecutor(e.target.value)}
            >
              <option value="">Все исполнители</option>
              {executors.map((executor: IExecutor) => (
                <option key={executor.id} value={executor.id.toString()}>
                  {executor.username}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-outline-secondary ms-auto"
              onClick={() => setSelectedExecutor("")}
            >
              Сброс
            </button>
          </div>
        </div>
      </div>

      {loading && <p>Загрузка данных...</p>}
      {error && <p className="text-danger">Ошибка: {error}</p>}

      <table
        ref={tableRef}
        className="display table table-striped table-bordered w-100"
      >
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
            <th>Получатель</th>
            <th>Тема</th>
            <th>Исполнитель</th>
            <th>Заметки</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Открыть модалку
      </button>
      <CreateModal setOpen={setOpen} open={open} onCreated={handleCreated} />
    </div>
  );
};

export default Letters;
