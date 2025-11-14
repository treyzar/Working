import React, { MutableRefObject } from "react";
import Loader from "@widgets/loader/Loader";

type Props = {
  tableRef: MutableRefObject<HTMLTableElement | null>;
  loading: boolean;
};

export const LettersTable: React.FC<Props> = ({ tableRef, loading }) => (
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
