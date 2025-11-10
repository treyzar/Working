import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { buildCards } from "../../widgets/Card/Letters/BuildCards/buildCards";
import { CardRenderer } from "../../widgets/Card/Letters/Render/CardRender";
import { useLetterDetails } from "../../features/letters/useLetterDetails";
export default function LetterDetails() {
  const { id } = useParams<{ id: string }>();
  const { letter, files, createdDate, isLoading, isFetching, refetch } =
    useLetterDetails(id);
  return (
    <div>
      <style>{`
        .container-1600 {max-width:1600px}
        .card-dark { background-color:#2B2E31; color:#F5F7F8; border-color:#3A3D40; }
        .card-dark .card-header { border-bottom-color:#3A3D40; background:transparent; }
        .muted { color:#9aa1a8; }
        .btn-accent { background-color:#E73F0C; border-color:#E73F0C; color:#fff; }
        .btn-accent:hover { filter:brightness(0.95); color:#fff; }
        .badge-soft { background:#EEF1F4; color:#2F3235; }
        .form-notes { background:#F4F5F6; }
        .icon { vertical-align: -0.2rem; }
      `}</style>

      <div className="container container-1600 py-3">
        <div className="card shadow-sm border-0">
          <div className="card-body d-flex align-items-center justify-content-between py-3 px-3 px-md-4">
            <div>
              <h1 className="h4 mb-1 fw-bold text-dark">
                Документ {letter?.document_number ?? id ?? "—"}
              </h1>
              <div className="small text-secondary">
                Подробная информация и вложения
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link
                to="/letters"
                className="btn btn-outline-secondary rounded-3"
              >
                <FiArrowLeft className="me-2 icon" /> К списку
              </Link>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <FiRefreshCw className="me-2 icon" />
                {isFetching ? "Обновляем…" : "Обновить"}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="pt-3">
            {[{ h: 180 }, { h: 80 }, { h: 80 }].map((s, i) => (
              <div className="card card-dark mb-3" key={i}>
                <div className="card-body">
                  <span
                    className="placeholder col-12"
                    style={{ height: s.h, display: "block" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-3">
            <CardRenderer cards={buildCards({ letter, createdDate, files })} />
          </div>
        )}
      </div>
    </div>
  );
}
