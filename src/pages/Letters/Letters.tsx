import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import DT from "datatables.net-dt";
import DataTable from "datatables.net-dt";
import type { IUserProfile } from "../../shared/interfaces/interfaces";

DataTable.use(DT);

interface DocumentRow {
  id: number;
  document_number: string;
  date: string;
  recipient: string;
  theme: string;
  executor: string;
  note: string;
  created_by?: { id: number };
}

interface DataTableResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: DocumentRow[];
}

const Letters: React.FC = () => {
  const tableRef = useRef<HTMLTableElement>(null);
  const dtInstance = useRef<any>(null);
  const [executors, setExecutors] = useState<IUserProfile[]>([]);
  const [selectedExecutor, setSelectedExecutor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/edo/api/users/?executor_only=true")
      .then((res) => res.json())
      .then((data: IUserProfile[]) => setExecutors(data))
      .catch(() => setError("Ошибка при загрузке исполнителей"));
  }, []);

  useEffect(() => {
    if (!tableRef.current) return;
    const $table = $(tableRef.current);

    if (!dtInstance.current) {
      dtInstance.current = $table.DataTable({
        serverSide: true,
        processing: true,
        ajax: {
          url: "http://127.0.0.1:8000/edo/api/documents/",
          type: "GET",
          data: (d: any) => {
            const currentExecutor = (
              document.getElementById("executor-select") as HTMLSelectElement
            )?.value;
            if (currentExecutor) d.executor = currentExecutor;
          },
          dataSrc: (json: DataTableResponse) => json.data || [],
          error: () => setError("Ошибка при загрузке данных таблицы"),
        },
        columns: [
          {
            data: "document_number",
            title: "№",
            className: "text-center",
            render: (data, type) =>
              type !== "display"
                ? data
                : `<div class="d-flex justify-content-center align-items-center gap-1">
                     <span>${data}</span>
                     <button type="button" class="btn btn-sm btn-link p-0 ms-1 copy-doc-number" data-number="${data}" title="Копировать номер">
                       <i class="fas fa-copy text-secondary" style="font-size:0.75rem;"></i>
                     </button>
                   </div>`,
          },
          {
            data: "date",
            title: "Дата",
            className: "text-center",
            render: (data: string) =>
              new Date(data).toLocaleDateString("ru-RU"),
          },
          { data: "recipient", title: "Получатель", className: "text-center" },
          { data: "theme", title: "Тема", className: "text-center" },
          { data: "executor", title: "Исполнитель", className: "text-center" },
          {
            data: "note",
            title: "Заметки",
            className: "text-center",
            render: (data: string) =>
              data ? data.toString().substring(0, 50) : "",
          },
          {
            data: null,
            title: "Действия",
            className: "text-center",
            orderable: false,
            render: () => "-",
          },
        ],
        language: {
          processing: "Обработка...",
          search: "Поиск:",
          lengthMenu: "Показывать _MENU_ записей",
          info: "Записи с _START_ до _END_ из _TOTAL_",
          infoEmpty: "Записи с 0 до 0 из 0",
          infoFiltered: "(отфильтровано из _MAX_ записей)",
          loadingRecords: "Загрузка...",
          zeroRecords: "Ничего не найдено",
          paginate: {
            first: "Первая",
            previous: "Предыдущая",
            next: "Следующая",
            last: "Последняя",
          },
        },
        pageLength: 20,
        lengthMenu: [20, 50, 100],
        initComplete: function () {
          setLoading(false);
          $table.on("click", "tbody tr", function (e) {
            if ($(e.target).closest(".copy-doc-number").length) return;
            const rowData = dtInstance.current.row(this).data() as
              | DocumentRow
              | undefined;
            if (rowData) navigate(`/letters/${rowData.id}`);
          });
          $table.on("click", ".copy-doc-number", function (e) {
            e.stopPropagation();
            const docNumber = $(this).data("number");
            navigator.clipboard.writeText(docNumber);
          });
        },
      });
    } else {
      dtInstance.current.ajax.reload();
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
              {executors.map((executor) => (
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
    </div>
  );
};

export default Letters;
