import { useRef, useCallback } from 'react';
import { useEditorStore } from '@/entities/docs';
import { PAGE_W, PAGE_H, SAFE_MARGIN, GRID, type Field, type TableItem } from '@shared/types';
import { cn } from '@/lib/utils';

const SNAP_THRESHOLD = 5;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

interface CanvasProps {
  scale?: number;
}

export function Canvas({ scale = 1 }: CanvasProps) {
  const {
    fields,
    tables,
    selectedId,
    selectedType,
    selectItem,
    updateField,
    updateTable,
    guides,
    setGuides,
    saveToHistory,
  } = useEditorStore();

  const pageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    id: string;
    type: 'field' | 'table';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    resizing: boolean;
    origW: number;
    origH: number;
  } | null>(null);

  const findSnapPoints = useCallback(
    (
      currentItem: { x: number; y: number; w: number; h: number },
      otherItems: { x: number; y: number; w: number; h: number; id: string }[]
    ) => {
      const snapGuides: { vertical: number[]; horizontal: number[] } = {
        vertical: [],
        horizontal: [],
      };

      const currentLeft = currentItem.x;
      const currentRight = currentItem.x + currentItem.w;
      const currentCenterX = currentItem.x + currentItem.w / 2;
      const currentTop = currentItem.y;
      const currentBottom = currentItem.y + currentItem.h;
      const currentCenterY = currentItem.y + currentItem.h / 2;

      let snapX = currentItem.x;
      let snapY = currentItem.y;
      let snappedX = false;
      let snappedY = false;

      for (const other of otherItems) {
        const otherLeft = other.x;
        const otherRight = other.x + other.w;
        const otherCenterX = other.x + other.w / 2;
        const otherTop = other.y;
        const otherBottom = other.y + other.h;
        const otherCenterY = other.y + other.h / 2;

        if (!snappedX) {
          if (Math.abs(currentLeft - otherLeft) < SNAP_THRESHOLD) {
            snapX = otherLeft;
            snapGuides.vertical.push(otherLeft);
            snappedX = true;
          } else if (Math.abs(currentLeft - otherRight) < SNAP_THRESHOLD) {
            snapX = otherRight;
            snapGuides.vertical.push(otherRight);
            snappedX = true;
          } else if (Math.abs(currentRight - otherLeft) < SNAP_THRESHOLD) {
            snapX = otherLeft - currentItem.w;
            snapGuides.vertical.push(otherLeft);
            snappedX = true;
          } else if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
            snapX = otherRight - currentItem.w;
            snapGuides.vertical.push(otherRight);
            snappedX = true;
          } else if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
            snapX = otherCenterX - currentItem.w / 2;
            snapGuides.vertical.push(otherCenterX);
            snappedX = true;
          }
        }

        if (!snappedY) {
          if (Math.abs(currentTop - otherTop) < SNAP_THRESHOLD) {
            snapY = otherTop;
            snapGuides.horizontal.push(otherTop);
            snappedY = true;
          } else if (Math.abs(currentTop - otherBottom) < SNAP_THRESHOLD) {
            snapY = otherBottom;
            snapGuides.horizontal.push(otherBottom);
            snappedY = true;
          } else if (Math.abs(currentBottom - otherTop) < SNAP_THRESHOLD) {
            snapY = otherTop - currentItem.h;
            snapGuides.horizontal.push(otherTop);
            snappedY = true;
          } else if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
            snapY = otherBottom - currentItem.h;
            snapGuides.horizontal.push(otherBottom);
            snappedY = true;
          } else if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
            snapY = otherCenterY - currentItem.h / 2;
            snapGuides.horizontal.push(otherCenterY);
            snappedY = true;
          }
        }
      }

      return { x: snapX, y: snapY, guides: snapGuides };
    },
    []
  );

  const onMouseDownBox = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      item: Field | TableItem,
      itemType: 'field' | 'table',
      resizing: boolean
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      draggingRef.current = {
        id: item.id,
        type: itemType,
        startX: clientX,
        startY: clientY,
        origX: item.x,
        origY: item.y,
        resizing,
        origW: item.w,
        origH: item.h,
      };

      selectItem(item.id, itemType);

      document.addEventListener('mousemove', onMouseMoveDoc);
      document.addEventListener('mouseup', onMouseUpDoc, { once: true });
      document.addEventListener('touchmove', onTouchMoveDoc, { passive: false });
      document.addEventListener('touchend', onTouchEndDoc, { once: true });
    },
    [selectItem]
  );

  const onMouseMoveDoc = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY, e.shiftKey);
  }, []);

  const onTouchMoveDoc = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY, false);
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number, shift: boolean) => {
      const st = draggingRef.current;
      if (!st) return;

      const pageW = PAGE_W;
      const pageH = PAGE_H;

      const allItems = [
        ...fields.map((f) => ({ ...f, itemType: 'field' as const })),
        ...tables.map((t) => ({ ...t, itemType: 'table' as const })),
      ].filter((item) => item.id !== st.id);

      if (!st.resizing) {
        let nx = st.origX + (clientX - st.startX) / scale;
        let ny = st.origY + (clientY - st.startY) / scale;

        if (shift) {
          nx = snap(nx);
          ny = snap(ny);
          setGuides({ vertical: [], horizontal: [] });
        } else {
          const currentItem =
            st.type === 'field'
              ? fields.find((f) => f.id === st.id)
              : tables.find((t) => t.id === st.id);
          if (currentItem) {
            const testItem = { ...currentItem, x: nx, y: ny };
            const snapResult = findSnapPoints(testItem, allItems);
            nx = snapResult.x;
            ny = snapResult.y;
            setGuides(snapResult.guides);
          }
        }

        nx = clamp(nx, SAFE_MARGIN, pageW - SAFE_MARGIN - st.origW);
        ny = clamp(ny, SAFE_MARGIN, pageH - SAFE_MARGIN - st.origH);

        if (st.type === 'field') {
          updateField(st.id, { x: nx, y: ny });
        } else {
          updateTable(st.id, { x: nx, y: ny });
        }
      } else {
        let nw = st.origW + (clientX - st.startX) / scale;
        let nh = st.origH + (clientY - st.startY) / scale;

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

        if (st.type === 'field') {
          updateField(st.id, { w: nw, h: nh });
        } else {
          updateTable(st.id, { w: nw, h: nh });
        }
      }
    },
    [fields, tables, scale, findSnapPoints, setGuides, updateField, updateTable]
  );

  const onMouseUpDoc = useCallback(() => {
    document.removeEventListener('mousemove', onMouseMoveDoc);
    draggingRef.current = null;
    setGuides({ vertical: [], horizontal: [] });
    saveToHistory('Элемент перемещен');
  }, [setGuides, saveToHistory]);

  const onTouchEndDoc = useCallback(() => {
    document.removeEventListener('touchmove', onTouchMoveDoc);
    draggingRef.current = null;
    setGuides({ vertical: [], horizontal: [] });
    saveToHistory('Элемент перемещен');
  }, [setGuides, saveToHistory]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === e.currentTarget ||
        (e.target as HTMLElement).classList.contains('canvas-page')
      ) {
        selectItem(null, null);
      }
    },
    [selectItem]
  );

  const wrapLines = useCallback((text: string, fontSize: number, maxWidthPx: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize || 14}px Inter, sans-serif`;

    const words = (text || '').split(/\s+/);
    const lines: string[] = [];
    let line = '';

    for (let i = 0; i < words.length; i++) {
      const add = (line ? ' ' : '') + words[i];
      const test = line + add;
      if (ctx.measureText(test).width > maxWidthPx && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const m = ctx.measureText('ЁУjq');
    const lineStepPx = Math.ceil(
      (m.actualBoundingBoxAscent || (fontSize || 14) * 0.8) +
        (m.actualBoundingBoxDescent || (fontSize || 14) * 0.2)
    );

    return { lines, lineStepPx };
  }, []);

  return (
    <div className="relative flex-1 overflow-auto bg-muted/30 p-8" onClick={handleCanvasClick}>
      <div
        ref={pageRef}
        className="canvas-page relative mx-auto bg-white shadow-xl"
        style={{
          width: PAGE_W * scale,
          height: PAGE_H * scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        data-testid="canvas-page"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
        />

        {/* Safe margin indicator */}
        <div
          className="absolute pointer-events-none border border-dashed border-primary/20"
          style={{
            left: SAFE_MARGIN,
            top: SAFE_MARGIN,
            right: SAFE_MARGIN,
            bottom: SAFE_MARGIN,
          }}
        />

        {/* Snap guides */}
        {guides.vertical.map((x, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none z-50"
            style={{ left: x }}
          />
        ))}
        {guides.horizontal.map((y, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-primary pointer-events-none z-50"
            style={{ top: y }}
          />
        ))}

        {/* Fields */}
        {fields.map((field) => {
          const isSelected = selectedId === field.id && selectedType === 'field';

          return (
            <div
              key={field.id}
              className={cn(
                'absolute cursor-move select-none transition-shadow',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{
                left: field.x,
                top: field.y,
                width: field.w,
                height: field.h,
              }}
              onMouseDown={(e) => onMouseDownBox(e, field, 'field', false)}
              onTouchStart={(e) => onMouseDownBox(e, field, 'field', false)}
              data-testid={`field-${field.id}`}
            >
              {field.type === 'text' && (
                <div
                  className="w-full h-full p-2 overflow-hidden bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-md shadow-sm transition-all duration-200"
                  style={{
                    fontSize: field.fontSize || 14,
                    fontWeight: field.bold ? 'bold' : 'normal',
                    fontStyle: field.italic ? 'italic' : 'normal',
                    textAlign: field.align || 'left',
                  }}
                >
                  {field.value}
                </div>
              )}

              {field.type === 'image' && field.dataUrl && (
                <img
                  src={field.dataUrl}
                  alt={field.label}
                  className="w-full h-full object-contain bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md shadow-sm"
                  draggable={false}
                />
              )}

              {/* Resize handle */}
              {isSelected && (
                <div
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary rounded-full cursor-se-resize touch-manipulation"
                  style={{ minWidth: 16, minHeight: 16 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onMouseDownBox(e, field, 'field', true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    onMouseDownBox(e, field, 'field', true);
                  }}
                  data-testid={`resize-handle-${field.id}`}
                />
              )}
            </div>
          );
        })}

        {/* Tables */}
        {tables.map((table) => {
          const isSelected = selectedId === table.id && selectedType === 'table';

          return (
            <div
              key={table.id}
              className={cn(
                'absolute cursor-move select-none transition-shadow',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{
                left: table.x,
                top: table.y,
                width: table.w,
                height: table.h,
              }}
              onMouseDown={(e) => onMouseDownBox(e, table, 'table', false)}
              onTouchStart={(e) => onMouseDownBox(e, table, 'table', false)}
              data-testid={`table-${table.id}`}
            >
              <div className="w-full h-full overflow-hidden bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-md shadow-sm">
                <table className="w-full h-full border-collapse text-xs">
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cn(
                              'border border-teal-200 dark:border-teal-700 px-1 py-0.5 truncate',
                              ri === 0 &&
                                table.headerRow &&
                                'font-semibold bg-teal-100 dark:bg-teal-900/50'
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resize handle */}
              {isSelected && (
                <div
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary rounded-full cursor-se-resize touch-manipulation"
                  style={{ minWidth: 16, minHeight: 16 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onMouseDownBox(e, table, 'table', true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    onMouseDownBox(e, table, 'table', true);
                  }}
                  data-testid={`resize-handle-${table.id}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
