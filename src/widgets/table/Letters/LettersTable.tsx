import type { MutableRefObject } from "react";
import Loader from "@widgets/loader/Loader";

interface LettersTableProps {
  tableRef: MutableRefObject<HTMLTableElement | null>;
  loading: boolean;
}

export const LettersTable: React.FC<LettersTableProps> = ({
  tableRef,
  loading,
}) => (
  <div className="dt-surface">
    {loading && <Loader fullscreen />}
    <table
      ref={tableRef}
      id="documents_table"
      className="display table table-hover w-100"
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
      <tbody />
    </table>
  </div>
);
