import { useEffect, useRef } from "react";
import $ from "jquery";
import DT from "datatables.net-dt";
import DataTable from "datatables.net-dt";
import Mark from "mark.js";
import type { MutableRefObject } from "react";
import type { NavigateFunction } from "react-router-dom";
import { LettersTableSettings } from "../../../pages/Letters/constants";

DataTable.use(DT);

type UseLettersTableParams = {
  tableRef: MutableRefObject<HTMLTableElement | null>;
  selectedExecutorRef: MutableRefObject<string>;
  navigate: NavigateFunction;
  onLoadingChange?: (v: boolean) => void;
  onError?: (msg: string | null) => void;
};

export function useLettersTable({
  tableRef,
  selectedExecutorRef,
  navigate,
  onLoadingChange,
  onError,
}: UseLettersTableParams) {
  const dtRef = useRef<DataTables.Api | null>(null);

  useEffect(() => {
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    // Подсветка терма в tbody
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
      // инициализация
      dtRef.current = $table.DataTable({
        serverSide: true,
        processing: true,
        ajax: LettersTableSettings.ajax(
          () => selectedExecutorRef.current,
          (msg) => onError?.(msg)
        ),
        columns: LettersTableSettings.columns,
        language: LettersTableSettings.language,
        pageLength: 20,
        lengthMenu: [20, 50, 100],
        autoWidth: false,
        dom: "<'dt-top'<'dt-left'l><'dt-right'f>>t<'dt-bottom'<'dt-info'i><'dt-pagination'p>>",
        pagingType: "full_numbers",
        initComplete: LettersTableSettings.initComplete(
          $table,
          dtRef,
          navigate,
          applyHighlight,
          () => onLoadingChange?.(false)
        ),
        drawCallback: () => applyHighlight(),
      });
    } else {
      // при смене исполнителя — обновить
      dtRef.current.ajax.reload();
    }
  }, [navigate, onError, onLoadingChange, selectedExecutorRef, tableRef]);

  const reload = (resetPaging = false) =>
    dtRef.current?.ajax.reload(null, !resetPaging);

  return { dtRef, reload };
}
