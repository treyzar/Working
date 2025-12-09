import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { buildCards } from "@widgets/card/Letters/BuildCards/buildCards";
import { CardRenderer } from "@widgets/card/Letters/Render/CardRender";
import { useLetterDetails } from "@features/letters/useLetterDetails";
export default function LetterDetails() {
  const { id } = useParams<{ id: string }>();
  const { letter, files, createdDate, isLoading, isFetching, refetch } =
    useLetterDetails(id);
  return (
    <div>
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
