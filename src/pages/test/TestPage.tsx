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
import pdfMake from "pdfmake/build/pdfmake.js";
import vfsFonts from "pdfmake/build/vfs_fonts.js";
(pdfMake as any).vfs = (vfsFonts as any).vfs || (vfsFonts as any).pdfMake?.vfs;

type Align = "left" | "center" | "right";
type FieldType = "text" | "image";

interface Field {
  id: string; // внутренний (UI не показывает)
  type: FieldType; // внутренний (UI не показывает)
  label: string;
  value?: string;
  dataUrl?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  bold?: boolean;
  align?: Align;
}

const GRID = 8;
const PAGE_W = 794; // px
const PAGE_H = 1123; // px
const SAFE_MARGIN = 24;

const px2pt = (px: number) => Math.round(px * 0.75);
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);
const snap = (n: number) => Math.round(n / GRID) * GRID;

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

function getImageTypeFromDataURL(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  if (!match) return "png";
  const type = match[1].toLowerCase();
  // docx поддерживает: png, jpg, jpeg, gif, bmp
  if (type === "jpeg") return "jpg";
  if (["png", "jpg", "gif", "bmp"].includes(type)) return type;
  return "png"; // fallback
}

function measureCtx(fontSizePx: number) {
  const canvas =
    (measureCtx as any)._c ||
    ((measureCtx as any)._c = document.createElement("canvas"));
  const ctx = canvas.getContext("2d")!;
  // pdfmake по умолчанию рисует Roboto — меряем тем же
  ctx.font = `${fontSizePx || 14}px Roboto, Arial, sans-serif`;
  return ctx;
}

// Возвращаем строки и точный шаг строки (px) по метрикам
function wrapLines(text: string, fontSize: number, maxWidthPx: number) {
  const ctx = measureCtx(fontSize || 14);
  const words = (text || "").split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const add = (line ? " " : "") + words[i];
    const test = line + add;
    if (ctx.measureText(test).width > maxWidthPx && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const m = ctx.measureText("ЁУjq"); // берём верх/низ
  const lineStepPx = Math.ceil(
    (m.actualBoundingBoxAscent || (fontSize || 14) * 0.8) +
      (m.actualBoundingBoxDescent || (fontSize || 14) * 0.2)
  );

  return { lines, lineStepPx };
}

export default function TestPage() {
  // ===== Состояние
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState("Акт выполненных работ");
  const [leftPanelWidth, setLeftPanelWidth] = useState(55); // процент ширины левой панели
  const [inspectorHeight, setInspectorHeight] = useState(400); // высота инспектора в px
  const [listHeight, setListHeight] = useState(260); // высота списка полей
  const [previewHeight, setPreviewHeight] = useState(500); // высота предпросмотров
  const [pdfPreviewWidth, setPdfPreviewWidth] = useState(50); // ширина PDF preview в %

  // Smart guides для выравнивания как в Figma
  const [guides, setGuides] = useState<{
    vertical: number[];
    horizontal: number[];
  }>({ vertical: [], horizontal: [] });

  const idSeq = useRef(1);
  const uid = () => "f" + (idSeq.current++).toString(36);

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

  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const docxFlowRef = useRef<HTMLDivElement>(null);

  const resizingPanelRef = useRef<{
    startX?: number;
    startY?: number;
    startWidth?: number;
    startHeight?: number;
    type: "horizontal" | "vertical";
    target: "main" | "inspector" | "list" | "preview" | "pdf-docx";
  } | null>(null);

  function selectField(id: string) {
    setSelectedId(id);
  }

  function sanitizeRect(
    x: number,
    y: number,
    w: number,
    h: number,
    pageW: number,
    pageH: number
  ) {
    const minW = 80,
      minH = 30;
    const maxW = Math.max(minW, pageW - SAFE_MARGIN * 2);
    const maxH = Math.max(minH, pageH - SAFE_MARGIN * 2);
    let nw = clamp(w, minW, maxW);
    let nh = clamp(h, minH, maxH);
    let nx = clamp(x, SAFE_MARGIN, pageW - SAFE_MARGIN - nw);
    let ny = clamp(y, SAFE_MARGIN, pageH - SAFE_MARGIN - nh);
    return { x: nx, y: ny, w: nw, h: nh };
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  // ===== Smart Guides & Snapping (как в Figma)
  const SNAP_THRESHOLD = 5; // px - расстояние для прилипания

  function findSnapPoints(
    currentField: Field,
    otherFields: Field[]
  ): {
    x: number;
    y: number;
    guides: { vertical: number[]; horizontal: number[] };
  } {
    const guides: { vertical: number[]; horizontal: number[] } = {
      vertical: [],
      horizontal: [],
    };

    // Текущие точки элемента
    const currentLeft = currentField.x;
    const currentRight = currentField.x + currentField.w;
    const currentCenterX = currentField.x + currentField.w / 2;
    const currentTop = currentField.y;
    const currentBottom = currentField.y + currentField.h;
    const currentCenterY = currentField.y + currentField.h / 2;

    let snapX = currentField.x;
    let snapY = currentField.y;
    let snappedX = false;
    let snappedY = false;

    // Проверяем выравнивание с другими элементами
    for (const other of otherFields) {
      if (other.id === currentField.id) continue;

      const otherLeft = other.x;
      const otherRight = other.x + other.w;
      const otherCenterX = other.x + other.w / 2;
      const otherTop = other.y;
      const otherBottom = other.y + other.h;
      const otherCenterY = other.y + other.h / 2;

      // Проверяем горизонтальное выравнивание (X)
      if (!snappedX) {
        // Левый край к левому краю
        if (Math.abs(currentLeft - otherLeft) < SNAP_THRESHOLD) {
          snapX = otherLeft;
          guides.vertical.push(otherLeft);
          snappedX = true;
        }
        // Левый край к правому краю
        else if (Math.abs(currentLeft - otherRight) < SNAP_THRESHOLD) {
          snapX = otherRight;
          guides.vertical.push(otherRight);
          snappedX = true;
        }
        // Левый край к центру
        else if (Math.abs(currentLeft - otherCenterX) < SNAP_THRESHOLD) {
          snapX = otherCenterX;
          guides.vertical.push(otherCenterX);
          snappedX = true;
        }
        // Правый край к левому краю
        else if (Math.abs(currentRight - otherLeft) < SNAP_THRESHOLD) {
          snapX = otherLeft - currentField.w;
          guides.vertical.push(otherLeft);
          snappedX = true;
        }
        // Правый край к правому краю
        else if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
          snapX = otherRight - currentField.w;
          guides.vertical.push(otherRight);
          snappedX = true;
        }
        // Правый край к центру
        else if (Math.abs(currentRight - otherCenterX) < SNAP_THRESHOLD) {
          snapX = otherCenterX - currentField.w;
          guides.vertical.push(otherCenterX);
          snappedX = true;
        }
        // Центр к центру
        else if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
          snapX = otherCenterX - currentField.w / 2;
          guides.vertical.push(otherCenterX);
          snappedX = true;
        }
        // Центр к левому краю
        else if (Math.abs(currentCenterX - otherLeft) < SNAP_THRESHOLD) {
          snapX = otherLeft - currentField.w / 2;
          guides.vertical.push(otherLeft);
          snappedX = true;
        }
        // Центр к правому краю
        else if (Math.abs(currentCenterX - otherRight) < SNAP_THRESHOLD) {
          snapX = otherRight - currentField.w / 2;
          guides.vertical.push(otherRight);
          snappedX = true;
        }
      }

      // Проверяем вертикальное выравнивание (Y)
      if (!snappedY) {
        // Верхний край к верхнему краю
        if (Math.abs(currentTop - otherTop) < SNAP_THRESHOLD) {
          snapY = otherTop;
          guides.horizontal.push(otherTop);
          snappedY = true;
        }
        // Верхний край к нижнему краю
        else if (Math.abs(currentTop - otherBottom) < SNAP_THRESHOLD) {
          snapY = otherBottom;
          guides.horizontal.push(otherBottom);
          snappedY = true;
        }
        // Верхний край к центру
        else if (Math.abs(currentTop - otherCenterY) < SNAP_THRESHOLD) {
          snapY = otherCenterY;
          guides.horizontal.push(otherCenterY);
          snappedY = true;
        }
        // Нижний край к верхнему краю
        else if (Math.abs(currentBottom - otherTop) < SNAP_THRESHOLD) {
          snapY = otherTop - currentField.h;
          guides.horizontal.push(otherTop);
          snappedY = true;
        }
        // Нижний край к нижнему краю
        else if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
          snapY = otherBottom - currentField.h;
          guides.horizontal.push(otherBottom);
          snappedY = true;
        }
        // Нижний край к центру
        else if (Math.abs(currentBottom - otherCenterY) < SNAP_THRESHOLD) {
          snapY = otherCenterY - currentField.h;
          guides.horizontal.push(otherCenterY);
          snappedY = true;
        }
        // Центр к центру
        else if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
          snapY = otherCenterY - currentField.h / 2;
          guides.horizontal.push(otherCenterY);
          snappedY = true;
        }
        // Центр к верхнему краю
        else if (Math.abs(currentCenterY - otherTop) < SNAP_THRESHOLD) {
          snapY = otherTop - currentField.h / 2;
          guides.horizontal.push(otherTop);
          snappedY = true;
        }
        // Центр к нижнему краю
        else if (Math.abs(currentCenterY - otherBottom) < SNAP_THRESHOLD) {
          snapY = otherBottom - currentField.h / 2;
          guides.horizontal.push(otherBottom);
          snappedY = true;
        }
      }
    }

    return { x: snapX, y: snapY, guides };
  }

  function updateField(id: string, patch: Partial<Field>) {
    const pr = pageRef.current?.getBoundingClientRect();
    const pageW = pr?.width ?? PAGE_W;
    const pageH = pr?.height ?? PAGE_H;
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        if (
          patch.x !== undefined ||
          patch.y !== undefined ||
          patch.w !== undefined ||
          patch.h !== undefined
        ) {
          const boxed = sanitizeRect(
            next.x,
            next.y,
            next.w,
            next.h,
            pageW,
            pageH
          );
          next.x = boxed.x;
          next.y = boxed.y;
          next.w = boxed.w;
          next.h = boxed.h;
        }
        return next;
      })
    );
  }

  function addTextField() {
    const init = sanitizeRect(
      SAFE_MARGIN + 36,
      SAFE_MARGIN + 36,
      300,
      120,
      PAGE_W,
      PAGE_H
    );
    const id = uid();
    setFields((prev) => [
      ...prev,
      {
        id,
        type: "text",
        label: "Текст",
        value: "Пример большого текста",
        x: init.x,
        y: init.y,
        w: init.w,
        h: init.h,
        fontSize: 14,
        bold: false,
        align: "left",
      },
    ]);
    setSelectedId(id);
  }

  async function addImageFromPicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const { dataUrl, natural } = await fileToDataURL(file);
      const maxContentW = PAGE_W - SAFE_MARGIN * 2;
      const maxInitW = Math.min(320, maxContentW);
      const scale = Math.min(1, maxInitW / (natural?.w || maxInitW));
      const w = Math.round((natural?.w || 240) * scale);
      const h = Math.round((natural?.h || 160) * scale);
      const rect = sanitizeRect(
        SAFE_MARGIN + 36,
        SAFE_MARGIN + 36,
        w,
        h,
        PAGE_W,
        PAGE_H
      );
      const id = uid();
      setFields((prev) => [
        ...prev,
        {
          id,
          type: "image",
          label: "Картинка",
          dataUrl,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
        },
      ]);
      setSelectedId(id);
    };
    input.click();
  }

  // ===== Drag & Resize (внутри safe area)
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
    const pr = pageRef.current?.getBoundingClientRect();
    if (!pr) return;
    const pageW = pr.width,
      pageH = pr.height;
    const shift = e.shiftKey;

    if (!st.resizing) {
      let nx = st.origX + (e.clientX - st.startX);
      let ny = st.origY + (e.clientY - st.startY);

      // Прилипание к сетке при Shift
      if (shift) {
        nx = snap(nx);
        ny = snap(ny);
        setGuides({ vertical: [], horizontal: [] });
      } else {
        // Smart guides - выравнивание по другим элементам
        const currentField = fields.find((f) => f.id === st.id);
        if (currentField) {
          const testField = { ...currentField, x: nx, y: ny };
          const otherFields = fields.filter((f) => f.id !== st.id);
          const snapResult = findSnapPoints(testField, otherFields);
          nx = snapResult.x;
          ny = snapResult.y;
          setGuides(snapResult.guides);
        }
      }

      nx = clamp(nx, SAFE_MARGIN, pageW - SAFE_MARGIN - st.origW);
      ny = clamp(ny, SAFE_MARGIN, pageH - SAFE_MARGIN - st.origH);
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
      const minW = 80,
        minH = 30;
      const maxW = Math.max(minW, pageW - SAFE_MARGIN - st.origX);
      const maxH = Math.max(minH, pageH - SAFE_MARGIN - st.origY);
      nw = clamp(nw, minW, maxW);
      nh = clamp(nh, minH, maxH);
      setFields((prev) =>
        prev.map((f) => (f.id === st.id ? { ...f, w: nw, h: nh } : f))
      );
    }
  }
  function onMouseUpDoc() {
    document.removeEventListener("mousemove", onMouseMoveDoc);
    draggingRef.current = null;
    setGuides({ vertical: [], horizontal: [] }); // Очищаем направляющие
  }

  // ===== Resize панелей
  function onMouseDownDivider(
    e: React.MouseEvent,
    type: "horizontal" | "vertical",
    target: "main" | "inspector" | "list" | "preview" | "pdf-docx"
  ) {
    e.preventDefault();
    resizingPanelRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth:
        type === "horizontal"
          ? target === "main"
            ? leftPanelWidth
            : pdfPreviewWidth
          : undefined,
      startHeight:
        type === "vertical"
          ? target === "inspector"
            ? inspectorHeight
            : target === "list"
            ? listHeight
            : target === "preview"
            ? previewHeight
            : 0
          : undefined,
      type,
      target,
    };
    document.addEventListener("mousemove", onMouseMoveDivider);
    document.addEventListener("mouseup", onMouseUpDivider, { once: true });
  }

  function onMouseMoveDivider(e: MouseEvent) {
    if (!resizingPanelRef.current) return;
    const ref = resizingPanelRef.current;

    if (ref.type === "horizontal") {
      if (ref.target === "main") {
        const containerWidth = window.innerWidth - 32;
        const deltaX = e.clientX - (ref.startX || 0);
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = clamp((ref.startWidth || 55) + deltaPercent, 30, 70);
        setLeftPanelWidth(newWidth);
      } else if (ref.target === "pdf-docx") {
        const parent = document.querySelector(".ds-preview-grid");
        if (!parent) return;
        const parentWidth = parent.getBoundingClientRect().width;
        const deltaX = e.clientX - (ref.startX || 0);
        const deltaPercent = (deltaX / parentWidth) * 100;
        const newWidth = clamp((ref.startWidth || 50) + deltaPercent, 20, 80);
        setPdfPreviewWidth(newWidth);
      }
    } else if (ref.type === "vertical") {
      const deltaY = e.clientY - (ref.startY || 0);
      const newHeight = Math.max(200, (ref.startHeight || 0) + deltaY);

      if (ref.target === "inspector") {
        setInspectorHeight(newHeight);
      } else if (ref.target === "list") {
        setListHeight(Math.min(600, newHeight));
      } else if (ref.target === "preview") {
        setPreviewHeight(Math.max(300, Math.min(800, newHeight)));
      }
    }
  }

  function onMouseUpDivider() {
    document.removeEventListener("mousemove", onMouseMoveDivider);
    resizingPanelRef.current = null;
  }

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) || null,
    [fields, selectedId]
  );

  // ===== PDF
  function buildPdfDefinition() {
    const content: any[] = [];

    for (const f of fields) {
      if (f.type === "text") {
        const fontSizePx = f.fontSize || 16;
        const { lines, lineStepPx } = wrapLines(
          f.value || "",
          fontSizePx,
          Math.max(0, f.w - 16)
        );

        // согласуем единицы для pdfmake
        const fontSizePt = px2pt(fontSizePx);
        const stepPt = px2pt(lineStepPx);

        lines.forEach((ln, i) => {
          content.push({
            text: ln,
            absolutePosition: {
              x: px2pt(f.x + 8),
              y: px2pt(f.y + 8) + i * stepPt, // точный шаг по метрикам
            },
            fontSize: fontSizePt,
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
      pageSize: { width: px2pt(PAGE_W), height: px2pt(PAGE_H) },
      pageMargins: [
        px2pt(SAFE_MARGIN),
        px2pt(SAFE_MARGIN),
        px2pt(SAFE_MARGIN),
        px2pt(SAFE_MARGIN),
      ],
      content,
      defaultStyle: {
        fontSize: px2pt(12), // если где-то забудешь задать — тоже в pt
        font: "Roboto", // чтобы pdfmake рендерил тем же шрифтом
      },
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

  // ===== «Псевдо-DOCX»
  function updateDocxFlow() {
    const el = docxFlowRef.current;
    if (!el) return;
    const sorted = [...fields].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y
    );
    let html = "";
    for (const f of sorted) {
      if (f.type === "text") {
        const { lines } = wrapLines(
          f.value || "",
          f.fontSize || 16,
          Math.max(280, f.w - 16)
        );
        const label = f.label ? `<b>${escapeHtml(f.label)}:</b> ` : "";
        for (const ln of lines) {
          html += `<p class="ds-flow-p" style="font-size:${Math.max(
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
        html += `<div class="ds-flow-img"><img src="${f.dataUrl}" alt="img"/></div>`;
      }
    }
    el.innerHTML =
      html ||
      '<p class="ds-hint">Добавьте поля, чтобы увидеть потоковое представление.</p>';
  }

  useEffect(() => {
    const t = setTimeout(() => {
      updatePdfPreview();
      updateDocxFlow();
    }, 200);
    return () => clearTimeout(t);
  }, [fields]);

  // ===== DOCX
  async function downloadDOCX() {
    const sorted = [...fields].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y
    );
    const children: Paragraph[] = [];
    for (const f of sorted) {
      if (f.type === "text") {
        const { lines } = wrapLines(
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
                  size: Math.round((f.fontSize || 16) * 2),
                }),
              ],
            })
          );
        }
        children.push(new Paragraph(""));
      } else if (f.type === "image" && f.dataUrl) {
        const uint8 = await dataURLToUint8Array(f.dataUrl);
        const imageType = getImageTypeFromDataURL(f.dataUrl);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: uint8,
                transformation: { width: f.w, height: f.h },
                type: imageType as any, // png, jpg, gif, bmp
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

  // ===== Экспорт/импорт
  function exportSchemaJson() {
    const schema = {
      version: 1,
      page: {
        size: "A4",
        safeMargin: SAFE_MARGIN,
        width: PAGE_W,
        height: PAGE_H,
      },
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
      if (Array.isArray(json?.fields)) {
        const pr = pageRef.current?.getBoundingClientRect();
        const pageW = pr?.width ?? PAGE_W;
        const pageH = pr?.height ?? PAGE_H;
        const fixed: Field[] = json.fields.map((f: Field) => {
          const boxed = sanitizeRect(f.x, f.y, f.w, f.h, pageW, pageH);
          return { ...f, ...boxed };
        });
        setFields(fixed);
      }
      if (typeof json?.title === "string") setTemplateTitle(json.title);
    } catch (e) {
      console.error("Bad schema_json:", e);
    }
  }

  // ===== UI helpers (все классы с префиксом .ds-*, никаких глобальных тегов)
  function AlignButtons({
    value,
    onChange,
  }: {
    value: Align | undefined;
    onChange: (a: Align) => void;
  }) {
    return (
      <div className="ds-segmented">
        {(["left", "center", "right"] as Align[]).map((opt) => (
          <button
            key={opt}
            type="button"
            className={
              "ds-seg-btn" + (value === opt ? " ds-seg-btn--active" : "")
            }
            onClick={() => onChange(opt)}
            title={
              opt === "left"
                ? "Слева"
                : opt === "center"
                ? "По центру"
                : "Справа"
            }
          >
            {opt === "left" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="14" height="2" rx="1" />
                <rect x="3" y="9" width="18" height="2" rx="1" />
                <rect x="3" y="14" width="12" height="2" rx="1" />
                <rect x="3" y="19" width="16" height="2" rx="1" />
              </svg>
            )}
            {opt === "center" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="5" y="4" width="14" height="2" rx="1" />
                <rect x="3" y="9" width="18" height="2" rx="1" />
                <rect x="6" y="14" width="12" height="2" rx="1" />
                <rect x="4" y="19" width="16" height="2" rx="1" />
              </svg>
            )}
            {opt === "right" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="7" y="4" width="14" height="2" rx="1" />
                <rect x="3" y="9" width="18" height="2" rx="1" />
                <rect x="9" y="14" width="12" height="2" rx="1" />
                <rect x="5" y="19" width="16" height="2" rx="1" />
              </svg>
            )}
          </button>
        ))}
      </div>
    );
  }
  function Switch({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) {
    return (
      <label className="ds-switch">
        <input
          className="ds-switch-input"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="ds-switch-slider" />
        <span className="ds-switch-label">{label}</span>
      </label>
    );
  }

  return (
    <div className="ds" onMouseUp={onMouseUpDoc}>
      <style>{`
        .ds { --bg:#f7f8f8; --ink:#26292a; --muted:#6b7280; --accent:#e73f0c; --border:#e3e6ea; --radius:12px; --shadow:0 8px 22px rgba(0,0,0,.08); --ring:0 0 0 3px rgba(231,63,12,.2);
               background: var(--bg); color: var(--ink); min-height: 100vh; padding: 16px; display:flex; flex-direction:column; gap:16px; }
        .ds-card { background:#fff; border-radius: var(--radius); box-shadow: var(--shadow); padding: 12px; }
        .ds-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .ds-title { font-size:22px; font-weight:700; margin:0; }
        .ds-muted { color: var(--muted); font-size: 13px; }

        /* НОВАЯ СТРУКТУРА: flex вместо grid с разделителем */
        .ds-section-flex { display:flex; gap:0; height: calc(100vh - 140px); }
        .ds-panel-left { flex-shrink: 0; overflow: auto; }
        .ds-panel-divider { width: 8px; background: var(--border); cursor: col-resize; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .ds-panel-divider:hover { background: var(--accent); }
        .ds-panel-divider::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 2px; height: 40px; background: rgba(255,255,255,0.6); border-radius: 2px; }
        .ds-panel-right { flex: 1; overflow: auto; min-width: 300px; }

        /* Вертикальные разделители */
        .ds-divider-vertical { height: 8px; background: var(--border); cursor: row-resize; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .ds-divider-vertical:hover { background: var(--accent); }
        .ds-divider-vertical::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 2px; background: rgba(255,255,255,0.6); border-radius: 2px; }

        /* УНИКАЛЬНЫЕ КНОПКИ (без .btn и без глобальных тегов) */
        .ds-btn-add-text { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-add-text:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-add-text:active { transform: translateY(1px); }

        .ds-btn-add-image { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-add-image:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-add-image:active { transform: translateY(1px); }

        .ds-btn-clear-fields { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-clear-fields:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-clear-fields:active { transform: translateY(1px); }

        .ds-btn-select { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-select:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-select:active { transform: translateY(1px); }

        .ds-btn-delete-list { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-delete-list:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-delete-list:active { transform: translateY(1px); }

        .ds-btn-delete-field { border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; transition: box-shadow .15s ease, transform .05s ease; }
        .ds-btn-delete-field:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        .ds-btn-delete-field:active { transform: translateY(1px); }

        .ds-btn-download-pdf { border:1px solid var(--accent); background: var(--accent); color:#fff; padding:9px 12px; border-radius:999px; font-weight:700; cursor:pointer; transition: filter .15s ease, transform .05s ease; }
        .ds-btn-download-pdf:hover { filter: brightness(0.95); }
        .ds-btn-download-pdf:active { transform: translateY(1px); }

        .ds-btn-download-docx { border:1px solid var(--accent); background: var(--accent); color:#fff; padding:9px 12px; border-radius:999px; font-weight:700; cursor:pointer; transition: filter .15s ease, transform .05s ease; }
        .ds-btn-download-docx:hover { filter: brightness(0.95); }
        .ds-btn-download-docx:active { transform: translateY(1px); }

        .ds-btn-upload { position:relative; overflow:hidden; border:1px solid var(--border); background:#fff; padding:9px 12px; border-radius:999px; font-weight:600; cursor:pointer; }
        .ds-btn-upload-input { position:absolute; inset:0; opacity:0; cursor:pointer; }

        /* Контролы */
        .ds-control { display:flex; flex-direction:column; gap:6px; }
        .ds-label { font-size:12px; color:var(--muted); }
        .ds-row-wrap { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .ds-input, .ds-select, .ds-textarea {
          width:100%; border:1px solid var(--border); border-radius:10px; padding:10px 12px;
          outline:none; transition: box-shadow .2s ease, border-color .2s ease, background-color .2s ease;
          background:#fff; color:var(--ink);
        }
        .ds-input:focus, .ds-select:focus, .ds-textarea:focus { box-shadow: var(--ring); border-color: var(--accent); }
        .ds-textarea { resize: vertical; min-height: 96px; }

        /* Сегменты и свитч */
        .ds-segmented { display:inline-flex; background:#f1f3f4; border:1px solid #e5e7eb; border-radius:999px; padding:4px; gap:4px; }
        .ds-seg-btn { border:none; background:transparent; padding:6px 10px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:6px; color:#374151; }
        .ds-seg-btn:hover { background:#e7eaee; }
        .ds-seg-btn--active { background:#fff; box-shadow: 0 2px 10px rgba(0,0,0,.06); color:#111827; }

        .ds-switch { display:inline-flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
        .ds-switch-input { display:none; }
        .ds-switch-slider { position:relative; width:44px; height:24px; border-radius:999px; background:#e5e7eb; transition: background .2s ease; }
        .ds-switch-slider::after { content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:999px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition: transform .2s ease; }
        .ds-switch-input:checked + .ds-switch-slider { background: var(--accent); }
        .ds-switch-input:checked + .ds-switch-slider::after { transform: translateX(20px); }
        .ds-switch-label { font-size:13px; color:#374151; }

        /* Сцена */
        .ds-stage { position:relative; background:#fefefe; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .ds-page { position:relative; width:${PAGE_W}px; height:${PAGE_H}px; margin: 0 auto; background: repeating-linear-gradient(0deg, #fafafa, #fafafa 26px, #f3f4f6 26px, #f3f4f6 27px); }
        .ds-page-inner { position:relative; width:100%; height:100%; }
        .ds-bg-hint { position:absolute; inset:${SAFE_MARGIN}px; border:1px dashed #d1d5db; border-radius:8px; }
        .ds-drop-layer { position:absolute; inset:0; }

        /* Smart guides - направляющие линии как в Figma */
        .ds-guide-line { position:absolute; background:#ff006e; pointer-events:none; z-index:9999; }
        .ds-guide-vertical { width:1px; top:0; bottom:0; }
        .ds-guide-horizontal { height:1px; left:0; right:0; }

        .ds-box { position:absolute; min-width:80px; min-height:30px; padding:6px 8px 10px; border:1px dashed #9ca3af; background:rgba(255,255,255,0.92); border-radius:8px; cursor:grab; user-select:none; display:flex; flex-direction:column; gap:4px; }
        .ds-box:active { cursor:grabbing; }
        .ds-box-title { font-size:12px; color:#374151; display:flex; align-items:center; gap:6px; }
        .ds-box-value { font-size:14px; font-weight:500; line-height:1.35; white-space:pre-wrap; word-break:break-word; overflow:hidden; }
        .ds-box--selected { outline:2px solid var(--accent); }
        .ds-box--align-center .ds-box-value { text-align:center; }
        .ds-box--align-right .ds-box-value { text-align:right; }
        .ds-box--bold .ds-box-value { font-weight:700; }
        .ds-resize { position:absolute; right:-6px; bottom:-6px; width:12px; height:12px; background:var(--accent); border-radius:3px; cursor:nwse-resize; }

        /* Список */
        .ds-list { display:flex; flex-direction:column; gap:8px; overflow:auto; border:1px solid var(--border); border-radius:10px; padding:8px; }
        .ds-list-item { display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center; }

        /* Предпросмотры - ИСПРАВЛЕНО */
        .ds-preview-grid { display:flex; gap:0; margin-top:16px; position: relative; }
        .ds-preview-section { display: flex; flex-direction: column; }
        .ds-preview-title { font-weight:700; margin:0 0 8px; font-size: 14px; }
        .ds-pdf-frame { width:100%; flex: 1; border:1px solid var(--border); border-radius:8px; min-height: 0; }
        .ds-docx-flow { flex: 1; border:1px solid var(--border); border-radius:8px; padding:12px; overflow:auto; background:#fafafa; min-height: 0; }
        .ds-flow-img { display:block; margin:6px 0; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden; background:#fff; }
        .ds-flow-img img { max-width: 100%; height: auto; display: block; }
        .ds-flow-p { margin:4px 0; line-height:1.5; }

        .ds-hint { font-size:12px; color:#6b7280; }
      `}</style>

      {/* Хедер */}
      <div
        className="ds-card"
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <div className="ds-title">
            Визуальный конструктор: текст и изображения → PDF/DOCX
          </div>
          <div className="ds-muted">
            Live-предпросмотр. Расстановка строго внутри полей документа.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ cursor: "pointer" }}>
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
            Импорт schema.json
          </label>
          <button type="button" onClick={exportSchemaJson}>
            Экспорт schema_json
          </button>
        </div>
      </div>

      {/* Основная секция с resizable панелями */}
      <div className="ds-section-flex">
        {/* Левая панель */}
        <div className="ds-panel-left" style={{ width: `${leftPanelWidth}%` }}>
          <section className="ds-card ds-stage">
            <div className="ds-row" style={{ marginBottom: 10 }}>
              <button
                type="button"
                className="ds-btn-add-text"
                onClick={addTextField}
              >
                + Текст
              </button>
              <button
                type="button"
                className="ds-btn-add-image"
                onClick={addImageFromPicker}
              >
                + Картинка
              </button>
              <button
                type="button"
                className="ds-btn-clear-fields"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFields([]);
                  setSelectedId(null);
                }}
              >
                Очистить поля
              </button>
              <span className="ds-muted">
                Подсказка: Shift — сетка 8px | Без Shift — выравнивание по
                элементам (как в Figma)
              </span>
            </div>

            <div className="ds-page" ref={pageRef} onMouseUp={onMouseUpDoc}>
              <div className="ds-page-inner">
                <div className="ds-bg-hint"></div>

                {/* Smart guides - направляющие линии */}
                {guides.vertical.map((x, i) => (
                  <div
                    key={`v-${i}`}
                    className="ds-guide-line ds-guide-vertical"
                    style={{ left: x }}
                  />
                ))}
                {guides.horizontal.map((y, i) => (
                  <div
                    key={`h-${i}`}
                    className="ds-guide-line ds-guide-horizontal"
                    style={{ top: y }}
                  />
                ))}

                <div className="ds-drop-layer">
                  {fields.map((f) => {
                    let boxCls = "ds-box";
                    if (selectedId === f.id) boxCls += " ds-box--selected";
                    if (f.type === "text") {
                      boxCls += ` ds-box--align-${f.align || "left"}`;
                      if (f.bold) boxCls += " ds-box--bold";
                    }
                    return (
                      <div
                        key={f.id}
                        className={boxCls}
                        style={{
                          left: f.x,
                          top: f.y,
                          width: f.w,
                          height: f.h,
                        }}
                        onMouseDown={(e) => onMouseDownBox(e, f, false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectField(f.id);
                        }}
                      >
                        <div className="ds-box-title">
                          {escapeHtml(f.label)}
                        </div>
                        {f.type === "text" ? (
                          <div
                            className="ds-box-value"
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
                              <span className="ds-muted">[нет картинки]</span>
                            )}
                          </div>
                        )}
                        <div
                          className="ds-resize"
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
        </div>

        {/* Разделитель с возможностью перетаскивания */}
        <div
          className="ds-panel-divider"
          onMouseDown={(e) => onMouseDownDivider(e, "horizontal", "main")}
          title="Перетащите для изменения ширины панелей"
        />

        {/* Правая панель */}
        <div className="ds-panel-right">
          <section
            className="ds-card"
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            {/* Инспектор */}
            <div
              style={{ height: inspectorHeight, overflow: "auto", padding: 12 }}
            >
              <div style={{ fontWeight: 700, margin: "6px 0" }}>
                Выбранное поле
              </div>
              {!selected ? (
                <p className="ds-hint">
                  Кликните по полю на странице, чтобы редактировать.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div className="ds-control">
                    <span className="ds-label">Метка</span>
                    <input
                      className="ds-input"
                      value={selected.label}
                      onChange={(e) =>
                        updateField(selected.id, { label: e.target.value })
                      }
                    />
                  </div>

                  {selected.type === "text" ? (
                    <>
                      <div className="ds-control">
                        <span className="ds-label">Текст</span>
                        <textarea
                          className="ds-textarea"
                          rows={6}
                          value={selected.value || ""}
                          onChange={(e) =>
                            updateField(selected.id, { value: e.target.value })
                          }
                        />
                      </div>

                      <div className="ds-row-wrap">
                        <div className="ds-control" style={{ minWidth: 220 }}>
                          <span className="ds-label">Выравнивание</span>
                          <AlignButtons
                            value={selected.align || "left"}
                            onChange={(a) =>
                              updateField(selected.id, { align: a })
                            }
                          />
                        </div>

                        <div className="ds-control" style={{ minWidth: 220 }}>
                          <span className="ds-label">Жирный</span>
                          <Switch
                            checked={!!selected.bold}
                            onChange={(v) =>
                              updateField(selected.id, { bold: v })
                            }
                            label="Включить жирное начертание"
                          />
                        </div>
                      </div>

                      <div className="ds-row-wrap">
                        <div className="ds-control" style={{ minWidth: 240 }}>
                          <span className="ds-label">Размер шрифта</span>
                          <input
                            className="ds-input"
                            type="range"
                            min={8}
                            max={48}
                            step={1}
                            value={selected.fontSize || 16}
                            onChange={(e) =>
                              updateField(selected.id, {
                                fontSize: Number(e.target.value) || 16,
                              })
                            }
                          />
                        </div>
                        <div className="ds-control" style={{ width: 100 }}>
                          <span className="ds-label">px</span>
                          <input
                            className="ds-input"
                            type="number"
                            min={8}
                            max={72}
                            value={selected.fontSize || 16}
                            onChange={(e) =>
                              updateField(selected.id, {
                                fontSize: Number(e.target.value) || 16,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="ds-control">
                      <span className="ds-label">Изображение</span>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <label className="ds-btn-upload">
                          Загрузить
                          <input
                            className="ds-btn-upload-input"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const out = await fileToDataURL(file);
                              updateField(selected.id, {
                                dataUrl: out.dataUrl,
                              });
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                        {selected.dataUrl ? (
                          <span className="ds-muted">Файл загружен</span>
                        ) : (
                          <span className="ds-muted">Файл не выбран</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="ds-row-wrap">
                    <div className="ds-control" style={{ width: 120 }}>
                      <span className="ds-label">X</span>
                      <input
                        className="ds-input"
                        type="number"
                        value={selected.x}
                        onChange={(e) =>
                          updateField(selected.id, {
                            x: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="ds-control" style={{ width: 120 }}>
                      <span className="ds-label">Y</span>
                      <input
                        className="ds-input"
                        type="number"
                        value={selected.y}
                        onChange={(e) =>
                          updateField(selected.id, {
                            y: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="ds-control" style={{ width: 120 }}>
                      <span className="ds-label">W</span>
                      <input
                        className="ds-input"
                        type="number"
                        value={selected.w}
                        onChange={(e) =>
                          updateField(selected.id, {
                            w: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="ds-control" style={{ width: 120 }}>
                      <span className="ds-label">H</span>
                      <input
                        className="ds-input"
                        type="number"
                        value={selected.h}
                        onChange={(e) =>
                          updateField(selected.id, {
                            h: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="ds-row-wrap">
                    <button
                      type="button"
                      className="ds-btn-delete-field"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeField(selected.id);
                      }}
                    >
                      Удалить поле
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Разделитель для изменения высоты инспектора */}
            <div
              className="ds-divider-vertical"
              onMouseDown={(e) =>
                onMouseDownDivider(e, "vertical", "inspector")
              }
              title="Перетащите для изменения высоты инспектора"
            />

            {/* Список полей */}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 700, margin: "6px 0" }}>
                Список полей
              </div>
              <div className="ds-list" style={{ height: listHeight }}>
                {fields.map((f) => (
                  <div className="ds-list-item" key={f.id}>
                    <input
                      className="ds-input"
                      value={f.label}
                      title="Метка"
                      onChange={(e) =>
                        updateField(f.id, { label: e.target.value })
                      }
                    />
                    <div className="ds-row" style={{ gap: 6 }}>
                      <button
                        type="button"
                        className="ds-btn-select"
                        onClick={() => setSelectedId(f.id)}
                      >
                        Выбрать
                      </button>
                      <button
                        type="button"
                        className="ds-btn-delete-list"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeField(f.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Разделитель для изменения высоты списка */}
            <div
              className="ds-divider-vertical"
              onMouseDown={(e) => onMouseDownDivider(e, "vertical", "list")}
              title="Перетащите для изменения высоты списка"
            />

            {/* Генерация */}
            <div className="ds-row" style={{ padding: 12 }}>
              <button
                type="button"
                className="ds-btn-download-pdf"
                onClick={downloadPDF}
              >
                Скачать PDF
              </button>
              <button
                type="button"
                className="ds-btn-download-docx"
                onClick={downloadDOCX}
              >
                Скачать DOCX
              </button>
            </div>

            {/* Разделитель перед предпросмотрами */}
            <div
              className="ds-divider-vertical"
              onMouseDown={(e) => onMouseDownDivider(e, "vertical", "preview")}
              title="Перетащите для изменения высоты предпросмотров"
            />

            {/* Предпросмотры - ИСПРАВЛЕНО */}
            <div className="ds-preview-grid" style={{ height: previewHeight }}>
              <div
                className="ds-preview-section"
                style={{ width: `${pdfPreviewWidth}%`, padding: 12 }}
              >
                <div className="ds-preview-title">Предпросмотр PDF (live)</div>
                <iframe ref={pdfIframeRef} className="ds-pdf-frame" />
              </div>

              {/* Разделитель между PDF и DOCX */}
              <div
                className="ds-panel-divider"
                onMouseDown={(e) =>
                  onMouseDownDivider(e, "horizontal", "pdf-docx")
                }
                title="Перетащите для изменения ширины предпросмотров"
              />

              <div
                className="ds-preview-section"
                style={{ flex: 1, padding: 12 }}
              >
                <div className="ds-preview-title">Псевдо-предпросмотр DOCX</div>
                <div ref={docxFlowRef} className="ds-docx-flow"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
