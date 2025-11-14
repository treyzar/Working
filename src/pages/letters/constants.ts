import type { MutableRefObject } from "react";
import type { NavigateFunction } from "react-router-dom";
import type {
  DtServerParams,
  DocumentRow,
  DataTableResponse,
} from "../../shared/interfaces/interfaces";
import $ from "jquery";
import { FaCopy } from "react-icons/fa6";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import DataTables from "datatables.net";
const COPY_SVG = renderToStaticMarkup(
  React.createElement(FaCopy, { size: 14, color: "gray" })
);
export const LettersTableSettings = {
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

  columns: [
    {
      data: "document_number",
      title: "№",
      className: "text-center",
      render: (data: string, type: string) =>
        type !== "display"
          ? data
          : `
          <div class="d-flex justify-content-center align-items-center gap-1">
            <span>${data}</span>
            <button
              type="button"
              class="btn btn-sm btn-link p-0 ms-1 copy-doc-number"
              data-number="${data}"
              title="Копировать номер"
              aria-label="Копировать номер"
              style="line-height:0"
            >
              ${COPY_SVG}
            </button>
          </div>
        `,
    },
    {
      data: "date",
      title: "Дата",
      className: "text-center",
      render: (data: string) => new Date(data).toLocaleDateString("ru-RU"),
    },
    { data: "recipient", title: "Получатель", className: "text-center" },
    { data: "theme", title: "Тема", className: "text-center" },
    { data: "executor", title: "Исполнитель", className: "text-center" },
    {
      data: "note",
      title: "Заметки",
      className: "text-center",
      render: (data: string) => (data ? data.toString().substring(0, 50) : ""),
    },
    {
      data: null,
      title: "Действия",
      className: "text-center",
      orderable: false,
      render: () => "-",
    },
  ] as DataTables.ConfigColumns[],

  /**
   * ajax(getExecutor, onError) — фабрика AJAX-настроек.
   * getExecutor должен возвращать актуальное значение фильтра (используй ref).
   */
  ajax(getExecutor: () => string, onError: (s: string) => void) {
    return {
      url: "http://127.0.0.1:8000/edo/api/documents/",
      type: "GET",
      data(d: DtServerParams) {
        const ex = getExecutor();
        if (ex) d.executor = ex;
      },
      dataSrc(json: DataTableResponse) {
        return json.data || [];
      },
      error: () => onError("Ошибка при загрузке данных таблицы"),
    };
  },

  /**
   * initComplete(...) — фабрика колбэка initComplete для DataTables.
   */
  initComplete(
    $table: JQuery<HTMLElement>,
    dtRef: MutableRefObject<DataTables.Api | null>,
    navigate: NavigateFunction,
    applyHighlight: () => void,
    onReady?: () => void
  ) {
    return function initComplete() {
      $table.on("click", "tbody tr", function (e) {
        const target = e.target as Element | null;
        if (target && $(target).closest(".copy-doc-number").length) return;

        const rowData = dtRef.current
          ?.row(this as unknown as HTMLTableRowElement)
          .data() as DocumentRow | undefined;

        if (rowData) navigate(`/letters/${rowData.id}`);
      });

      $table.on("click", ".copy-doc-number", function (e) {
        e.stopPropagation();
        const docNumber = String(($(this) as JQuery).data("number") ?? "");
        if (docNumber) void navigator.clipboard.writeText(docNumber);
      });

      $table.on("search.dt draw.dt", applyHighlight);

      onReady?.();
      applyHighlight();
    };
  },
} as const;

export type LettersTableSettingsType = typeof LettersTableSettings;
