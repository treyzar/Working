import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  RiUpload2Line,
  RiFile2Line,
  RiFilePdfLine,
  RiFileWord2Line,
  RiFileExcel2Line,
  RiImage2Line,
  RiCloseLine,
} from "react-icons/ri";

type FileKind = "image" | "pdf" | "word" | "excel" | "other";

export type FileItem = {
  id: string;
  file: File;
  kind: FileKind;
  url?: string; // для превью изображений
  error?: string | null;
};

export type FileDropZoneProps = {
  value?: FileItem[]; // контролируемый режим (необязательно)
  onChange?: (files: FileItem[]) => void; // отдаём наверх валидные+невалидные (у невалидных будет error)
  maxSizeMB?: number; // по умолчанию 10
  acceptExt?: string[]; // список расширений с точкой, по умолчанию как в примере
  className?: string; // дополнительный класс
};

const DEFAULT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
];
const MAX_MB_DEFAULT = 10;

const fmtSize = (b: number) =>
  b < 1024
    ? `${b} B`
    : b < 1024 * 1024
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / 1024 / 1024).toFixed(2)} MB`;

const detectKind = (f: File): FileKind => {
  const name = f.name.toLowerCase();
  if (
    f.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
  )
    return "image";
  if (f.type === "application/pdf" || /\.pdf$/.test(name)) return "pdf";
  if (/\.docx?$/.test(name)) return "word";
  if (/\.xlsx?$/.test(name)) return "excel";
  return "other";
};

const validate = (f: File, accept: string[], maxMB: number): string | null => {
  const name = f.name.toLowerCase();
  const okExt = accept.some((ext) => name.endsWith(ext));
  if (!okExt) return `Недопустимый формат. Разрешено: ${accept.join(", ")}`;
  const sizeMB = f.size / (1024 * 1024);
  if (sizeMB > maxMB)
    return `Файл слишком большой (${sizeMB.toFixed(
      2
    )} МБ), максимум ${maxMB} МБ`;
  return null;
};

export default function FileDropZone({
  value,
  onChange,
  maxSizeMB = MAX_MB_DEFAULT,
  acceptExt = DEFAULT_ACCEPT,
  className,
}: FileDropZoneProps) {
  const [items, setItems] = useState<FileItem[]>(value ?? []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) setItems(value);
  }, [value]);

  useEffect(() => {
    return () => {
      items.forEach((i) => {
        if (i.url) URL.revokeObjectURL(i.url);
      });
    };
  }, [items]);

  const emit = (next: FileItem[]) => {
    setItems(next);
    onChange?.(next);
  };

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const next: FileItem[] = [];

      list.forEach((f) => {
        const kind = detectKind(f);
        const error = validate(f, acceptExt, maxSizeMB);
        const url = kind === "image" ? URL.createObjectURL(f) : undefined;

        next.push({
          id: `${f.name}_${f.lastModified}_${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          file: f,
          kind,
          url,
          error,
        });
      });

      emit([...items, ...next]);
    },
    [items, acceptExt, maxSizeMB]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      zoneRef.current?.classList.remove("is-dragover");
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    zoneRef.current?.classList.add("is-dragover");
  };
  const onDragLeave = () => zoneRef.current?.classList.remove("is-dragover");

  const remove = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.url) URL.revokeObjectURL(item.url);
    emit(items.filter((i) => i.id !== id));
  };

  const acceptAttr = useMemo(() => acceptExt.join(","), [acceptExt]);
  const needScroll = items.length > 4;
  const Icon = ({ kind }: { kind: FileKind }) => {
    if (kind === "image") return <RiImage2Line />;
    if (kind === "pdf") return <RiFilePdfLine />;
    if (kind === "word") return <RiFileWord2Line />;
    if (kind === "excel") return <RiFileExcel2Line />;
    return <RiFile2Line />;
  };

  return (
    <div className={`file-uploader ${className ?? ""}`}>
      <div
        ref={zoneRef}
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
      >
        <div className="dz-icon">
          <RiUpload2Line />
        </div>
        <div className="dz-label">
          Перетащите файлы сюда или кликните для выбора
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept={acceptAttr}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <div className="dz-hint">
          PDF, DOC(X), XLS(X), JPG, PNG и др. До {maxSizeMB} МБ.
        </div>
      </div>

      {/* список файлов */}
      {!!items.length && (
        <div
          className="file-list"
          style={
            needScroll ? { maxHeight: "30vh", overflowY: "auto" } : undefined
          }
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`file-item ${item.error ? "is-invalid" : ""}`}
            >
              <div className="file-icon">
                {item.kind === "image" && item.url ? (
                  <img src={item.url} alt="" />
                ) : (
                  <Icon kind={item.kind} />
                )}
              </div>
              <div className="file-info">
                <div className="file-name">{item.file.name}</div>
                <div className="file-meta">
                  {fmtSize(item.file.size)}
                  {item.error && (
                    <span className="file-error"> • {item.error}</span>
                  )}
                </div>
              </div>
              <div className="file-actions">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => remove(item.id)}
                >
                  <RiCloseLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
