import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from "docx";

// pdfmake: корректный импорт для Vite/ESM и инициализация vfs
// ВАЖНО: именно с .js на конце — так стабильно работает в Vite.
import pdfMake from "pdfmake/build/pdfmake.js";
import vfsFonts from "pdfmake/build/vfs_fonts.js";
(pdfMake as any).vfs = (vfsFonts as any).vfs || (vfsFonts as any).pdfMake?.vfs;

type Align = "left" | "center" | "right";
type FieldType = "text" | "image";

interface Field {
  id: string;
  type: FieldType;
  label: string;
  value?: string; // для text
  dataUrl?: string; // для image (data:image/...;base64,...)
  x: number;
  y: number; // позиция в px на странице
  w: number;
  h: number; // размер в px
  fontSize?: number; // text
  bold?: boolean; // text
  align?: Align; // text
}

const GRID = 8;
const px2pt = (px: number) => Math.round(px * 0.75); // 96dpi → 72pt

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

function escapeHtml(s: string) {
  return (s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ] as string)
  );
}

async function fileToDataURL(
  file: File
): Promise<{ dataUrl: string; natural: { w: number; h: number } }> {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () =>
        res({
          dataUrl: fr.result as string,
          natural: { w: img.naturalWidth, h: img.naturalHeight },
        });
      img.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}

async function dataURLToUint8Array(dataUrl: string) {
  const r = await fetch(dataUrl);
  const ab = await r.arrayBuffer();
  return new Uint8Array(ab);
}

function wrapLines(text: string, fontSize: number, maxWidthPx: number) {
  const canvas =
    (wrapLines as any)._c ||
    ((wrapLines as any)._c = document.createElement("canvas"));
  const ctx = canvas.getContext("2d")!;
  ctx.font = (fontSize || 14) + "px Inter, system-ui, Arial";
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((w, i) => {
    const add = i === 0 ? w : " " + w;
    const test = line + add;
    const wpx = ctx.measureText(test).width;
    if (wpx > maxWidthPx && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

export default function TestPage() {
  // ===== Состояние конструктора
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState("Акт выполненных работ");

  // Canvas refs
  const pageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    resizing: boolean;
    origW: number;
    origH: number;
  } | null>(null);

  // Превью refs
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const docxFlowRef = useRef<HTMLDivElement>(null);

  const uid = (() => {
    let n = 1;
    return () => "f" + (n++).toString(36);
  })();

  function selectField(id: string) {
    setSelectedId(id);
  }
  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function updateField(id: string, patch: Partial<Field>) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  function addTextField() {
    const id = uid();
    setFields((prev) => [
      ...prev,
      {
        id,
        type: "text",
        label: "Текст",
        value: "Пример большого текста",
        x: 60,
        y: 380,
        w: 300,
        h: 120,
        fontSize: 14,
        bold: false,
        align: "left",
      },
    ]);
    setSelectedId(id);
  }

  async function addImageFromPicker() {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      const { dataUrl, natural } = await fileToDataURL(file);
      const id = uid();
      const maxW = 320;
      const scale = Math.min(1, maxW / (natural?.w || maxW));
      const w = Math.round((natural?.w || 240) * scale);
      const h = Math.round((natural?.h || 160) * scale);
      setFields((prev) => [
        ...prev,
        { id, type: "image", label: "Картинка", dataUrl, x: 60, y: 520, w, h },
      ]);
      setSelectedId(id);
    };
    picker.click();
  }

  // ===== Drag & Resize
  function onMouseDownBox(
    e: React.MouseEvent<HTMLDivElement>,
    f: Field,
    resizing: boolean
  ) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = {
      id: f.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: f.x,
      origY: f.y,
      resizing,
      origW: f.w,
      origH: f.h,
    };
    document.addEventListener("mousemove", onMouseMoveDoc);
    document.addEventListener("mouseup", onMouseUpDoc, { once: true });
  }

  function onMouseMoveDoc(e: MouseEvent) {
    const st = draggingRef.current;
    if (!st) return;
    const page = pageRef.current;
    if (!page) return;
    const pr = page.getBoundingClientRect();
    const shift = e.shiftKey;

    if (!st.resizing) {
      let nx = st.origX + (e.clientX - st.startX);
      let ny = st.origY + (e.clientY - st.startY);
      if (shift) {
        nx = snap(nx);
        ny = snap(ny);
      }
      nx = Math.max(0, Math.min(nx, pr.width - 20));
      ny = Math.max(0, Math.min(ny, pr.height - 20));
      setFields((prev) =>
        prev.map((f) => (f.id === st.id ? { ...f, x: nx, y: ny } : f))
      );
    } else {
      let nw = st.origW + (e.clientX - st.startX);
      let nh = st.origH + (e.clientY - st.startY);
      if (shift) {
        nw = snap(nw);
        nh = snap(nh);
      }
      nw = Math.max(80, Math.min(nw, pr.width - 10));
      nh = Math.max(30, Math.min(nh, pr.height - 10));
      setFields((prev) =>
        prev.map((f) => (f.id === st.id ? { ...f, w: nw, h: nh } : f))
      );
    }
  }

  function onMouseUpDoc() {
    document.removeEventListener("mousemove", onMouseMoveDoc);
    draggingRef.current = null;
  }

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) || null,
    [fields, selectedId]
  );

  // ===== PDF: предпросмотр + скачивание
  function buildPdfDefinition() {
    const content: any[] = [];
    for (const f of fields) {
      if (f.type === "text") {
        const lines = wrapLines(
          f.value || "",
          f.fontSize || 16,
          Math.max(0, f.w - 16)
        );
        lines.forEach((ln, i) => {
          content.push({
            text: ln,
            absolutePosition: {
              x: px2pt(f.x + 8),
              y: px2pt(f.y + 8 + i * ((f.fontSize || 16) * 1.35)),
            },
            fontSize: f.fontSize || 16,
            bold: !!f.bold,
            alignment: f.align || "left",
          });
        });
      } else {
        content.push({
          image: f.dataUrl,
          absolutePosition: { x: px2pt(f.x), y: px2pt(f.y) },
          width: px2pt(f.w),
          height: px2pt(f.h),
        });
      }
    }
    return {
      pageSize: { width: px2pt(794), height: px2pt(1123) },
      pageMargins: [px2pt(24), px2pt(24), px2pt(24), px2pt(24)],
      content,
      defaultStyle: { fontSize: 12 },
    };
  }

  function downloadPDF() {
    const def = buildPdfDefinition();
    (pdfMake as any)
      .createPdf(def)
      .download(`${templateTitle || "document"}.pdf`);
  }

  function updatePdfPreview() {
    const def = buildPdfDefinition();
    (pdfMake as any).createPdf(def).getDataUrl((url: string) => {
      if (pdfIframeRef.current) pdfIframeRef.current.src = url;
    });
  }

  function updateDocxFlow() {
    const el = docxFlowRef.current;
    if (!el) return;
    const sorted = [...fields].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y
    );
    let html = "";
    for (const f of sorted) {
      if (f.type === "text") {
        const lines = wrapLines(
          f.value || "",
          f.fontSize || 16,
          Math.max(280, f.w - 16)
        );
        const label = f.label ? `<b>${escapeHtml(f.label)}:</b> ` : "";
        for (const ln of lines) {
          html += `<p style="margin:4px 0; line-height:1.5; font-size:${Math.max(
            12,
            f.fontSize || 16
          )}px;${f.bold ? "font-weight:700;" : ""}${
            f.align === "center"
              ? "text-align:center;"
              : f.align === "right"
              ? "text-align:right;"
              : ""
          }">${label}${escapeHtml(ln)}</p>`;
        }
      } else {
        html += `<div class="img"><img src="${f.dataUrl}" alt="img"/></div>`;
      }
    }
    el.innerHTML =
      html ||
      '<p class="hint">Добавьте поля, чтобы увидеть потоковое представление.</p>';
  }

  useEffect(() => {
    const t = setTimeout(() => {
      updatePdfPreview();
      updateDocxFlow();
    }, 200);
    return () => clearTimeout(t);
  }, [fields]);

  // ===== DOCX: скачивание (без Media.addImage, без addSection)
  async function downloadDOCX() {
    const sorted = [...fields].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y
    );
    const children: Paragraph[] = [];

    for (const f of sorted) {
      if (f.type === "text") {
        const lines = wrapLines(
          f.value || "",
          f.fontSize || 16,
          Math.max(0, f.w - 16)
        );
        for (const ln of lines) {
          children.push(
            new Paragraph({
              alignment:
                f.align === "center"
                  ? AlignmentType.CENTER
                  : f.align === "right"
                  ? AlignmentType.RIGHT
                  : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: (f.label ? f.label + ": " : "") + ln,
                  bold: !!f.bold,
                  size: Math.round((f.fontSize || 16) * 2), // docx размер в половинных пунктах
                }),
              ],
            })
          );
        }
        children.push(new Paragraph("")); // отступ
      } else if (f.type === "image" && f.dataUrl) {
        const uint8 = await dataURLToUint8Array(f.dataUrl);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: uint8,
                transformation: { width: f.w, height: f.h }, // px
              }),
            ],
          }),
          new Paragraph("")
        );
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${templateTitle || "document"}.docx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
  }

  // ===== Экспорт/импорт schema_json (локально)
  function exportSchemaJson() {
    const schema = {
      version: 1,
      page: { size: "A4" },
      fields,
      meta: { source: "canvas", exportedAt: new Date().toISOString() },
    };
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (templateTitle || "template") + ".schema.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  async function importSchemaJson(file: File) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json?.fields)) setFields(json.fields);
      if (typeof json?.title === "string") setTemplateTitle(json.title);
    } catch (e) {
      console.error("Bad schema_json:", e);
    }
  }

  return (
    <div
      className="w-full min-h-screen flex flex-col gap-4 p-4"
      onMouseUp={onMouseUpDoc}
    >
      <style>{`
        :root { --bg:#f7f8f8; --ink:#26292a; --muted:#6b7280; --accent:#e73f0c; --border:#e3e6ea; --radius:12px; --shadow:0 8px 22px rgba(0,0,0,.08); }
        body { background: var(--bg); color: var(--ink); }
        .card { background:#fff; border-radius: var(--radius); box-shadow: var(--shadow); padding: 12px; }
        .btn { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; }
        .btn.primary { background: var(--accent); color:#fff; border-color: var(--accent); }
        .btn:active { transform: translateY(1px); }
        .stage { position:relative; background:#fefefe; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .page { position:relative; width:794px; height:1123px; margin: 0 auto; background: repeating-linear-gradient(0deg, #fafafa, #fafafa 26px, #f3f4f6 26px, #f3f4f6 27px); }
        .page-inner { position:relative; width:100%; height:100%; }
        .bg-hint { position:absolute; inset:24px; border:1px dashed #d1d5db; border-radius:8px; }
        .drop-layer { position:absolute; inset:0; }
        .box { position:absolute; min-width:120px; min-height:36px; padding:6px 8px 10px; border:1px dashed #9ca3af; background:rgba(255,255,255,0.92); border-radius:8px; cursor:grab; user-select:none; display:flex; flex-direction:column; gap:4px; }
        .box:active { cursor:grabbing; }
        .box .title { font-size:12px; color:#374151; display:flex; align-items:center; gap:6px; }
        .box .value { font-size:14px; font-weight:500; line-height:1.35; white-space:pre-wrap; word-break:break-word; overflow:hidden; }
        .box.selected { outline:2px solid var(--accent); }
        .box.align-center .value { text-align:center; }
        .box.align-right .value { text-align:right; }
        .box.bold .value { font-weight:700; }
        .resize { position:absolute; right:-6px; bottom:-6px; width:12px; height:12px; background:var(--accent); border-radius:3px; cursor:nwse-resize; }
        .list { display:flex; flex-direction:column; gap:8px; max-height:260px; overflow:auto; border:1px solid var(--border); border-radius:10px; padding:8px; }
        .list-item { display:grid; grid-template-columns: 1fr 1fr 140px; gap:6px; align-items:center; }
        .muted { color: var(--muted); font-size: 13px; }
        .hint { font-size:12px; color:#6b7280; }
        .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; background:#f1f5f9; color:#334155; font-size:12px; border:1px solid #e2e8f0; }
        .pdf-frame { width:100%; height:640px; border:1px solid var(--border); border-radius:8px; }
        .docx-flow { height:640px; border:1px solid var(--border); border-radius:8px; padding:12px; overflow:auto; background:#fafafa; }
        .docx-flow .img { display:block; margin:6px 0; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden; background:#fff; }
      `}</style>

      {/* Hero */}
      <div
        className="card"
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            Визуальный конструктор: текст и изображения → PDF/DOCX
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Поля: перетаскивание, ресайз, инспектор. Live-предпросмотр PDF и
            «псевдо-DOCX».
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="btn">
            Импорт schema.json
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importSchemaJson(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button className="btn" onClick={exportSchemaJson}>
            Экспорт schema_json
          </button>
        </div>
      </div>

      {/* Основная сетка */}
      <div
        className="w-full"
        style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}
      >
        {/* Левая: Полотно */}
        <section className="card stage">
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <button className="btn" onClick={addTextField}>
              + Текст
            </button>
            <button className="btn" onClick={addImageFromPicker}>
              + Картинка
            </button>
            <button
              className="btn"
              onClick={() => {
                setFields([]);
                setSelectedId(null);
              }}
            >
              Очистить поля
            </button>
            <span className="muted">
              Подсказка:{" "}
              <kbd
                style={{
                  background: "#0f172a",
                  color: "#e5e7eb",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                Shift
              </kbd>{" "}
              — прилипание к сетке 8px
            </span>
          </div>

          <div className="page" ref={pageRef} onMouseUp={onMouseUpDoc}>
            <div className="page-inner">
              <div className="bg-hint"></div>
              <div className="drop-layer">
                {fields.map((f) => {
                  const boxCls =
                    "box" +
                    (selectedId === f.id ? " selected" : "") +
                    (f.type === "text"
                      ? ` align-${f.align || "left"}${f.bold ? " bold" : ""}`
                      : "");
                  return (
                    <div
                      key={f.id}
                      className={boxCls}
                      style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
                      onMouseDown={(e) => onMouseDownBox(e, f, false)}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectField(f.id);
                      }}
                    >
                      <div className="title">
                        {escapeHtml(f.label)}
                        {f.type === "image" && (
                          <span className="badge">IMG</span>
                        )}
                      </div>
                      {f.type === "text" ? (
                        <div
                          className="value"
                          style={{ fontSize: f.fontSize || 14 }}
                        >
                          {escapeHtml(f.value || "")}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {f.dataUrl ? (
                            <img
                              src={f.dataUrl}
                              alt="img"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span className="muted">[нет картинки]</span>
                          )}
                        </div>
                      )}
                      <div
                        className="resize"
                        onMouseDown={(e) => onMouseDownBox(e, f, true)}
                        title="Потяните для изменения размера"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Правая панель */}
        <section
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Инспектор выбранного поля */}
          <div>
            <h3 style={{ margin: "6px 0" }}>Выбранное поле</h3>
            {!selected ? (
              <p className="hint">
                Кликните по полю на странице, чтобы редактировать.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="muted">
                  ID: <code>{selected.id}</code> &nbsp; Тип:{" "}
                  <b>{selected.type}</b>
                </div>
                <div
                  className="field"
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label>Метка</label>
                  <input
                    value={selected.label}
                    onChange={(e) =>
                      updateField(selected.id, { label: e.target.value })
                    }
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "8px 10px",
                    }}
                  />
                </div>

                {selected.type === "text" ? (
                  <>
                    <div className="field">
                      <label>Текст</label>
                      <textarea
                        rows={6}
                        value={selected.value || ""}
                        onChange={(e) =>
                          updateField(selected.id, { value: e.target.value })
                        }
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "8px 10px",
                          resize: "vertical",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <label>Размер шрифта</label>
                      <input
                        type="number"
                        min={8}
                        max={72}
                        value={selected.fontSize || 16}
                        onChange={(e) =>
                          updateField(selected.id, {
                            fontSize: Number(e.target.value) || 16,
                          })
                        }
                        style={{ width: 90 }}
                      />
                      <label>Выравнивание</label>
                      <select
                        value={selected.align || "left"}
                        onChange={(e) =>
                          updateField(selected.id, {
                            align: e.target.value as Align,
                          })
                        }
                      >
                        <option value="left">Слева</option>
                        <option value="center">По центру</option>
                        <option value="right">Справа</option>
                      </select>
                      <label
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected.bold}
                          onChange={(e) =>
                            updateField(selected.id, { bold: e.target.checked })
                          }
                        />
                        Жирный
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="field">
                    <label>Изображение</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const out = await fileToDataURL(file);
                        updateField(selected.id, { dataUrl: out.dataUrl });
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <label>Позиция</label>
                  <input
                    type="number"
                    value={selected.x}
                    onChange={(e) =>
                      updateField(selected.id, { x: Number(e.target.value) })
                    }
                    style={{ width: 90 }}
                  />
                  ×
                  <input
                    type="number"
                    value={selected.y}
                    onChange={(e) =>
                      updateField(selected.id, { y: Number(e.target.value) })
                    }
                    style={{ width: 90 }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <label>Размер</label>
                  <input
                    type="number"
                    value={selected.w}
                    onChange={(e) =>
                      updateField(selected.id, { w: Number(e.target.value) })
                    }
                    style={{ width: 90 }}
                  />
                  ×
                  <input
                    type="number"
                    value={selected.h}
                    onChange={(e) =>
                      updateField(selected.id, { h: Number(e.target.value) })
                    }
                    style={{ width: 90 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn"
                    onClick={() => removeField(selected.id)}
                  >
                    Удалить поле
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Список полей */}
          <div>
            <h3 style={{ margin: "6px 0" }}>Список полей</h3>
            <div className="list">
              {fields.map((f) => (
                <div className="list-item" key={f.id}>
                  <input
                    value={f.label}
                    title="Метка"
                    onChange={(e) =>
                      updateField(f.id, { label: e.target.value })
                    }
                  />
                  <input
                    value={f.type === "text" ? f.value || "" : "[image]"}
                    title="Значение"
                    disabled={f.type === "image"}
                    onChange={(e) =>
                      updateField(f.id, { value: e.target.value })
                    }
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn" onClick={() => setSelectedId(f.id)}>
                      Выбрать
                    </button>
                    <button
                      className="btn"
                      onClick={async () => {
                        if (f.type === "text") {
                          await addImageFromPicker(); // добавляет новое IMG (сделал простую логику)
                        } else {
                          updateField(f.id, { type: "text", value: "" });
                        }
                      }}
                    >
                      {f.type === "text" ? "IMG" : "TXT"}
                    </button>
                    <button className="btn" onClick={() => removeField(f.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Генерация */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={downloadPDF}>
              Скачать PDF
            </button>
            <button className="btn primary" onClick={downloadDOCX}>
              Скачать DOCX
            </button>
          </div>

          {/* Предпросмотры */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            <section className="card">
              <h3 style={{ margin: "0 0 8px" }}>Предпросмотр PDF (live)</h3>
              <iframe ref={pdfIframeRef} className="pdf-frame" />
            </section>
            <section className="card">
              <h3 style={{ margin: "0 0 8px" }}>Псевдо-предпросмотр DOCX</h3>
              <div ref={docxFlowRef} className="docx-flow"></div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
