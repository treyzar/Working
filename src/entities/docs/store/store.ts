import { create } from "zustand";
import type { Field, TableItem, HistoryState } from "@shared/types";
import { PAGE_W, PAGE_H, SAFE_MARGIN } from "@shared/types";

const MAX_HISTORY = 50;

interface EditorState {
  fields: Field[];
  tables: TableItem[];
  selectedId: string | null;
  selectedType: "field" | "table" | null;
  templateTitle: string;
  history: HistoryState[];
  historyIndex: number;
  isSimpleMode: boolean;
  showTutorial: boolean;
  showHelp: boolean;
  guides: { vertical: number[]; horizontal: number[] };

  // Actions
  setFields: (fields: Field[]) => void;
  setTables: (tables: TableItem[]) => void;
  selectItem: (id: string | null, type: "field" | "table" | null) => void;
  setTemplateTitle: (title: string) => void;
  setSimpleMode: (simple: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setGuides: (guides: { vertical: number[]; horizontal: number[] }) => void;

  // Field actions
  addTextField: () => void;
  addImageField: (dataUrl: string, naturalW: number, naturalH: number) => void;
  updateField: (id: string, patch: Partial<Field>) => void;
  removeField: (id: string) => void;

  // Table actions
  addTable: () => void;
  updateTable: (id: string, patch: Partial<TableItem>) => void;
  removeTable: (id: string) => void;
  addTableRow: (id: string) => void;
  removeTableRow: (id: string, rowIndex: number) => void;
  addTableColumn: (id: string) => void;
  removeTableColumn: (id: string, colIndex: number) => void;
  updateTableCell: (
    id: string,
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => void;

  // History actions
  saveToHistory: (description: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Template actions
  loadTemplate: (fields: Field[], tables: TableItem[], title: string) => void;
  clearTemplate: () => void;

  // Import actions
  addTextFieldWithContent: (text: string) => void;
  addTableWithContent: (rows: string[][]) => void;
  importParsedContent: (textBlocks: string[], tables: string[][][]) => void;
}

let fieldIdSeq = 1;
let tableIdSeq = 1;

const uid = () => "f" + (fieldIdSeq++).toString(36);
const tuid = () => "t" + (tableIdSeq++).toString(36);

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function sanitizeRect(
  x: number,
  y: number,
  w: number,
  h: number,
  pageW: number,
  pageH: number,
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

export const useEditorStore = create<EditorState>((set, get) => ({
  fields: [],
  tables: [],
  selectedId: null,
  selectedType: null,
  templateTitle: "Новый документ",
  history: [],
  historyIndex: -1,
  isSimpleMode: true,
  showTutorial: false,
  showHelp: false,
  guides: { vertical: [], horizontal: [] },

  setFields: (fields) => set({ fields }),
  setTables: (tables) => set({ tables }),
  selectItem: (id, type) => set({ selectedId: id, selectedType: type }),
  setTemplateTitle: (title) => set({ templateTitle: title }),
  setSimpleMode: (simple) => set({ isSimpleMode: simple }),
  setShowTutorial: (show) => set({ showTutorial: show }),
  setShowHelp: (show) => set({ showHelp: show }),
  setGuides: (guides) => set({ guides }),

  addTextField: () => {
    const rect = sanitizeRect(
      SAFE_MARGIN + 36,
      SAFE_MARGIN + 36,
      300,
      120,
      PAGE_W,
      PAGE_H,
    );
    const id = uid();
    const field: Field = {
      id,
      type: "text",
      label: "Текст",
      value: "Пример текста",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      fontSize: 14,
      bold: false,
      italic: false,
      align: "left",
    };
    set((state) => ({
      fields: [...state.fields, field],
      selectedId: id,
      selectedType: "field",
    }));
    get().saveToHistory("Добавлен текст");
  },

  addImageField: (dataUrl, naturalW, naturalH) => {
    const maxContentW = PAGE_W - SAFE_MARGIN * 2;
    const maxInitW = Math.min(320, maxContentW);
    const scale = Math.min(1, maxInitW / (naturalW || maxInitW));
    const w = Math.round((naturalW || 240) * scale);
    const h = Math.round((naturalH || 160) * scale);
    const rect = sanitizeRect(
      SAFE_MARGIN + 36,
      SAFE_MARGIN + 36,
      w,
      h,
      PAGE_W,
      PAGE_H,
    );
    const id = uid();
    const field: Field = {
      id,
      type: "image",
      label: "Изображение",
      dataUrl,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    };
    set((state) => ({
      fields: [...state.fields, field],
      selectedId: id,
      selectedType: "field",
    }));
    get().saveToHistory("Добавлено изображение");
  },

  updateField: (id, patch) => {
    set((state) => ({
      fields: state.fields.map((f) => {
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
            PAGE_W,
            PAGE_H,
          );
          next.x = boxed.x;
          next.y = boxed.y;
          next.w = boxed.w;
          next.h = boxed.h;
        }
        return next;
      }),
    }));
  },

  removeField: (id) => {
    set((state) => ({
      fields: state.fields.filter((f) => f.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
    get().saveToHistory("Удален элемент");
  },

  addTable: () => {
    const rect = sanitizeRect(
      SAFE_MARGIN + 36,
      SAFE_MARGIN + 200,
      400,
      120,
      PAGE_W,
      PAGE_H,
    );
    const id = tuid();
    const table: TableItem = {
      id,
      rows: [
        ["Заголовок 1", "Заголовок 2", "Заголовок 3"],
        ["Ячейка 1", "Ячейка 2", "Ячейка 3"],
        ["Ячейка 4", "Ячейка 5", "Ячейка 6"],
      ],
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      headerRow: true,
      borderStyle: "light",
    };
    set((state) => ({
      tables: [...state.tables, table],
      selectedId: id,
      selectedType: "table",
    }));
    get().saveToHistory("Добавлена таблица");
  },

  updateTable: (id, patch) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
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
            PAGE_W,
            PAGE_H,
          );
          next.x = boxed.x;
          next.y = boxed.y;
          next.w = boxed.w;
          next.h = boxed.h;
        }
        return next;
      }),
    }));
  },

  removeTable: (id) => {
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
    get().saveToHistory("Удалена таблица");
  },

  addTableRow: (id) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id) return t;
        const colCount = t.rows[0]?.length || 3;
        return {
          ...t,
          rows: [...t.rows, Array(colCount).fill("")],
        };
      }),
    }));
    get().saveToHistory("Добавлена строка");
  },

  removeTableRow: (id, rowIndex) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id || t.rows.length <= 1) return t;
        return {
          ...t,
          rows: t.rows.filter((_, i) => i !== rowIndex),
        };
      }),
    }));
    get().saveToHistory("Удалена строка");
  },

  addTableColumn: (id) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          rows: t.rows.map((row, i) => [
            ...row,
            i === 0 ? `Колонка ${row.length + 1}` : "",
          ]),
        };
      }),
    }));
    get().saveToHistory("Добавлена колонка");
  },

  removeTableColumn: (id, colIndex) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id || (t.rows[0]?.length || 0) <= 1) return t;
        return {
          ...t,
          rows: t.rows.map((row) => row.filter((_, i) => i !== colIndex)),
        };
      }),
    }));
    get().saveToHistory("Удалена колонка");
  },

  updateTableCell: (id, rowIndex, colIndex, value) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== id) return t;
        const newRows = t.rows.map((row, ri) =>
          ri === rowIndex
            ? row.map((cell, ci) => (ci === colIndex ? value : cell))
            : row,
        );
        return { ...t, rows: newRows };
      }),
    }));
  },

  saveToHistory: (description) => {
    const { fields, tables, history, historyIndex } = get();
    const newState: HistoryState = {
      fields: JSON.parse(JSON.stringify(fields)),
      tables: JSON.parse(JSON.stringify(tables)),
      timestamp: Date.now(),
      description,
    };

    const newHistory = [...history.slice(0, historyIndex + 1), newState].slice(
      -MAX_HISTORY,
    );
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prevState = history[historyIndex - 1];
    set({
      fields: JSON.parse(JSON.stringify(prevState.fields)),
      tables: JSON.parse(JSON.stringify(prevState.tables)),
      historyIndex: historyIndex - 1,
      selectedId: null,
      selectedType: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextState = history[historyIndex + 1];
    set({
      fields: JSON.parse(JSON.stringify(nextState.fields)),
      tables: JSON.parse(JSON.stringify(nextState.tables)),
      historyIndex: historyIndex + 1,
      selectedId: null,
      selectedType: null,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  loadTemplate: (fields, tables, title) => {
    set({
      fields: JSON.parse(JSON.stringify(fields)),
      tables: JSON.parse(JSON.stringify(tables)),
      templateTitle: title,
      history: [],
      historyIndex: -1,
      selectedId: null,
      selectedType: null,
    });
    get().saveToHistory("Шаблон загружен");
  },

  clearTemplate: () => {
    set({
      fields: [],
      tables: [],
      templateTitle: "Новый документ",
      history: [],
      historyIndex: -1,
      selectedId: null,
      selectedType: null,
    });
    get().saveToHistory("Новый документ");
  },

  addTextFieldWithContent: (text: string) => {
    get().importParsedContent([text], []);
  },

  addTableWithContent: (rows: string[][]) => {
    if (rows && rows.length > 0) {
      get().importParsedContent([], [rows]);
    }
  },

  importParsedContent: (textBlocks, parsedTables) => {
    const { fields, tables, saveToHistory } = get();
    const existingItems = [...fields, ...tables];
    let currentY = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.y + item.h)) + 20
      : SAFE_MARGIN + 36;
    
    const newFields: Field[] = [];
    const newTables: TableItem[] = [];
    const spacing = 20;
    
    const computeRect = (estimatedHeight: number) => {
      if (currentY + estimatedHeight > PAGE_H - SAFE_MARGIN) {
        currentY = SAFE_MARGIN + 36;
      }
      return sanitizeRect(
        SAFE_MARGIN + 36,
        currentY,
        PAGE_W - SAFE_MARGIN * 2 - 72,
        estimatedHeight,
        PAGE_W,
        PAGE_H,
      );
    };
    
    for (const text of textBlocks) {
      if (text.trim()) {
        const estimatedHeight = Math.min(200, Math.max(60, text.length * 0.5));
        const rect = computeRect(estimatedHeight);
        
        const id = uid();
        newFields.push({
          id,
          type: "text",
          label: "Импортированный текст",
          value: text.trim(),
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          fontSize: 14,
          bold: false,
          italic: false,
          align: "left",
        });
        currentY = rect.y + rect.h + spacing;
      }
    }
    
    for (const tableRows of parsedTables) {
      if (tableRows && tableRows.length > 0) {
        const rowHeight = 30;
        const estimatedHeight = Math.min(400, tableRows.length * rowHeight);
        const rect = computeRect(estimatedHeight);
        
        const id = tuid();
        newTables.push({
          id,
          rows: tableRows,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          headerRow: true,
          borderStyle: "light",
        });
        currentY = rect.y + rect.h + spacing;
      }
    }
    
    set((state) => ({
      fields: [...state.fields, ...newFields],
      tables: [...state.tables, ...newTables],
    }));
    
    saveToHistory("Импортирован контент из документа");
  },
}));
