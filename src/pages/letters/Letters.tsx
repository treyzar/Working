import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGetExecutorUsers } from "@features/users/getExecutorUsersAPI";
import type { IExecutor } from "@shared/types/interfaces/interfaces";
import { useLettersTable } from "@features/letters/hooks/useLetterTable";
import { LettersHero } from "@widgets/hero/Letters/LettersHero";
import { LettersTable } from "@widgets/table/Letters/LettersTable";
import { LettersFilters } from "@widgets/filters/Letters/LettersFilters";
import CreateModal from "@widgets/modals/Letters/createModal";

import "./Letters.scss";

const Letters: React.FC = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);
  const executorRef = useRef<string>("");

  useEffect(() => {
    executorRef.current = selectedExecutor;
  }, [selectedExecutor]);

  const { data: executors = [] } = useGetExecutorUsers(true);

  const { dtRef } = useLettersTable({
    tableRef,
    selectedExecutorRef: executorRef,
    navigate,
    onLoadingChange: setLoading,
    onError: setError,
  });

  const handleCreated = () => dtRef.current?.ajax.reload(undefined, false);

  return (
    <div className="letters-page">
      <LettersHero onCreate={() => setOpen(true)} />

      <div className="container-1600">
        <LettersFilters
          executors={executors as IExecutor[]}
          selectedExecutor={selectedExecutor}
          onChange={setSelectedExecutor}
          onReset={() => setSelectedExecutor("")}
        />

        {/* TABLE */}
        <LettersTable tableRef={tableRef} loading={loading} />
      </div>

      {/* MODAL */}
      <CreateModal open={open} setOpen={setOpen} onCreated={handleCreated} />

      {/* ERRORS */}
      {error && (
        <div className="container-1600">
          <div className="alert alert-danger mt-3">Ошибка: {error}</div>
        </div>
      )}
    </div>
  );
};

export default Letters;
