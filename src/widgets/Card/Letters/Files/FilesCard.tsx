import { Link } from "react-router-dom";
import { FiPaperclip } from "react-icons/fi";
import { FiFileText, FiDownload } from "react-icons/fi";
import { formatSize } from "../../../../shared/utils/services/letters/help/formatting/formatting";
import { downloadFileById } from "../../../../shared/utils/services/letters/download/download";
import type { FilesCardProps } from "../../../../shared/types/types";
export function FilesCard({ files }: FilesCardProps) {
  return (
    <div className="card card-dark mb-3">
      <div className="card-header fw-semibold">
        <FiPaperclip className="me-2 icon" /> Прикрепленные файлы
      </div>
      <div className="card-body">
        {files.length === 0 ? (
          <div className="text-secondary">Нет вложений</div>
        ) : (
          <ul className="list-group list-group-flush">
            {files.map((f) => (
              <li
                key={String(f.id)}
                className="list-group-item d-flex justify-content-between align-items-center bg-white rounded-3 my-2"
              >
                <div className="d-flex align-items-center">
                  <FiFileText className="me-2 text-secondary icon" />
                  <div className="d-flex align-items-center flex-wrap">
                    {f.file ? (
                      <Link
                        to={f.file}
                        target="_blank"
                        rel="noreferrer"
                        className="fw-semibold small text-decoration-none me-2"
                        style={{ color: "black" }}
                      >
                        {f.file_name}
                      </Link>
                    ) : (
                      <span className="fw-semibold small me-2">
                        {f.file_name}
                      </span>
                    )}
                    <span className="text-secondary small">
                      ({formatSize(f.file_size)})
                    </span>
                  </div>
                </div>

                {f.file ? (
                  <button
                    className="btn btn-accent rounded-3"
                    onClick={() =>
                      downloadFileById(f.id as unknown as number, f.file_name)
                    }
                  >
                    <FiDownload className="me-2 icon" /> Скачать
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-secondary rounded-3"
                    disabled
                  >
                    Недоступно
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
