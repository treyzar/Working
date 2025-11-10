import {
  FiInfo,
  FiHash,
  FiCalendar,
  FiUser,
  FiTag,
  FiUserCheck,
  FiFileText,
  FiClock,
} from "react-icons/fi";
import { Row } from "./Row/CardRow";
import { formatExecutor } from "../../../shared/utils/services/letters/help/formatting/formatting";
import type { InfoCardProps } from "../../../shared/types/types";

export function InfoCard({ letter, createdDate }: InfoCardProps) {
  return (
    <div className="card card-dark mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div className="fw-semibold">
          <FiInfo className="me-2 icon" /> Информация о документе
        </div>
        <span className="badge badge-soft rounded-pill small">
          <FiClock className="me-1 icon" /> {createdDate}
        </span>
      </div>

      <div className="card-body">
        <Row
          label={
            <>
              <FiHash className="me-2 icon" /> Номер
            </>
          }
          value={letter?.document_number ?? "—"}
        />
        <Row
          label={
            <>
              <FiCalendar className="me-2 icon" /> Дата создания
            </>
          }
          value={createdDate}
        />
        <Row
          label={
            <>
              <FiUser className="me-2 icon" /> Получатель
            </>
          }
          value={letter?.recipient ?? "—"}
        />
        <Row
          label={
            <>
              <FiTag className="me-2 icon" /> Тема
            </>
          }
          value={letter?.theme ?? "—"}
        />
        <Row
          label={
            <>
              <FiUserCheck className="me-2 icon" /> Исполнитель
            </>
          }
          value={formatExecutor(letter?.executor) ?? "—"}
        />

        <div className="mt-3">
          <div className="muted small text-uppercase mb-2">
            <FiFileText className="me-2 icon" /> Заметки
          </div>
          <textarea
            className="form-control form-notes rounded-3"
            readOnly
            rows={3}
            value={letter?.note ?? ""}
            placeholder="Заметки отсутствуют"
          />
        </div>
      </div>
    </div>
  );
}
