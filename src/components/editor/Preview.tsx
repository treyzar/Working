import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/entities/docs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, File, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { PAGE_W, PAGE_H, SAFE_MARGIN, type Field, type TableItem } from '@shared/types';
import { cn } from '@/lib/utils';

import pdfMake from 'pdfmake/build/pdfmake.js';
import vfsFonts from 'pdfmake/build/vfs_fonts.js';
(pdfMake as any).vfs = (vfsFonts as any).vfs || (vfsFonts as any).pdfMake?.vfs;

const px2pt = (px: number) => Math.round(px * 0.75);

interface PreviewProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function Preview({ isFullscreen, onToggleFullscreen }: PreviewProps) {
  const { fields, tables } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'pdf' | 'docx'>('pdf');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

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

  const buildPdfDefinition = useCallback(() => {
    const content: any[] = [];

    for (const f of fields) {
      if (f.type === 'text') {
        const fontSizePx = f.fontSize || 16;
        const { lines, lineStepPx } = wrapLines(f.value || '', fontSizePx, Math.max(0, f.w - 16));
        const fontSizePt = px2pt(fontSizePx);
        const stepPt = px2pt(lineStepPx);

        lines.forEach((ln, i) => {
          content.push({
            text: ln,
            absolutePosition: { x: px2pt(f.x + 8), y: px2pt(f.y + 8) + i * stepPt },
            fontSize: fontSizePt,
            bold: !!f.bold,
            italics: !!f.italic,
            alignment: f.align || 'left',
          });
        });
      } else if (f.type === 'image' && f.dataUrl) {
        content.push({
          image: f.dataUrl,
          absolutePosition: { x: px2pt(f.x), y: px2pt(f.y) },
          width: px2pt(f.w),
          height: px2pt(f.h),
        });
      }
    }

    for (const t of tables) {
      if (t.rows && t.rows.length > 0) {
        const tableBody = t.rows.map((row, ri) =>
          row.map((cell) => ({
            text: cell,
            fontSize: 10,
            bold: ri === 0 && t.headerRow,
          }))
        );
        content.push({
          absolutePosition: { x: px2pt(t.x), y: px2pt(t.y) },
          table: {
            widths: Array(t.rows[0]?.length || 1).fill('*'),
            body: tableBody,
          },
          layout:
            t.borderStyle === 'none'
              ? 'noBorders'
              : t.borderStyle === 'full'
              ? undefined
              : 'lightHorizontalLines',
        });
      }
    }

    return {
      pageSize: { width: px2pt(PAGE_W), height: px2pt(PAGE_H) },
      pageMargins: [px2pt(SAFE_MARGIN), px2pt(SAFE_MARGIN), px2pt(SAFE_MARGIN), px2pt(SAFE_MARGIN)],
      content,
      defaultStyle: { fontSize: px2pt(12) },
    };
  }, [fields, tables, wrapLines]);

  const generatePdfPreview = useCallback(() => {
    setIsGenerating(true);
    const def = buildPdfDefinition();
    (pdfMake as any).createPdf(def).getDataUrl((url: string) => {
      setPdfUrl(url);
      setIsGenerating(false);
    });
  }, [buildPdfDefinition]);

  const generateDocxPreview = useCallback(() => {
    const allItems = [
      ...fields.map((f) => ({ ...f, itemType: 'field' as const })),
      ...tables.map((t) => ({ ...t, itemType: 'table' as const })),
    ].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

    let html = '<div style="font-family: Inter, sans-serif; padding: 20px;">';

    for (const item of allItems) {
      if (item.itemType === 'field') {
        const f = item as Field;
        if (f.type === 'text') {
          html += `<p style="
            font-size: ${f.fontSize || 14}px;
            font-weight: ${f.bold ? 'bold' : 'normal'};
            font-style: ${f.italic ? 'italic' : 'normal'};
            text-align: ${f.align || 'left'};
            margin: 8px 0;
          ">${escapeHtml(f.value || '')}</p>`;
        } else if (f.type === 'image' && f.dataUrl) {
          html += `<img src="${f.dataUrl}" style="max-width: 100%; height: auto; margin: 8px 0;" />`;
        }
      } else if (item.itemType === 'table') {
        const t = item as TableItem;
        html += '<table style="border-collapse: collapse; width: 100%; margin: 8px 0;">';
        t.rows.forEach((row, ri) => {
          html += '<tr>';
          row.forEach((cell) => {
            const isHeader = ri === 0 && t.headerRow;
            html += `<${isHeader ? 'th' : 'td'} style="
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              ${isHeader ? 'background: #f5f5f5; font-weight: bold;' : ''}
            ">${escapeHtml(cell)}</${isHeader ? 'th' : 'td'}>`;
          });
          html += '</tr>';
        });
        html += '</table>';
      }
    }

    html += '</div>';
    setDocxHtml(html);
  }, [fields, tables]);

  const escapeHtml = (s: string) => {
    return (s || '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    );
  };

  useEffect(() => {
    if (activeTab === 'pdf') {
      generatePdfPreview();
    } else {
      generateDocxPreview();
    }
  }, [activeTab, fields, tables, generatePdfPreview, generateDocxPreview]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <Card
      className={cn(
        isFullscreen ? 'fixed inset-4 z-50' : 'h-full',
        'border-orange-100 dark:border-orange-900/50'
      )}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardTitle className="text-base text-orange-800 dark:text-orange-200">
          Предпросмотр
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{zoom}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {onToggleFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleFullscreen}
              data-testid="button-fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pdf' | 'docx')}>
          <TabsList className="w-full rounded-none border-b border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30">
            <TabsTrigger
              value="pdf"
              className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-pdf"
            >
              <File className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger
              value="docx"
              className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-docx"
            >
              <FileText className="h-4 w-4 mr-2" />
              DOCX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="m-0">
            <div
              className="relative bg-orange-50/30 dark:bg-orange-950/10 overflow-auto"
              style={{ height: isFullscreen ? 'calc(100vh - 180px)' : '400px' }}
            >
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : pdfUrl ? (
                <iframe
                  ref={pdfIframeRef}
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                  data-testid="preview-pdf-iframe"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Добавьте элементы для предпросмотра
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="docx" className="m-0">
            <div
              className="relative bg-white overflow-auto p-4"
              style={{
                height: isFullscreen ? 'calc(100vh - 180px)' : '400px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              {docxHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                  data-testid="preview-docx-content"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Добавьте элементы для предпросмотра
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
