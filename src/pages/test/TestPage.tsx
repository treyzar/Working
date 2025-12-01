import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/entities/docs';
import { useIsMobile } from '@/shared/hooks';
import { useToast } from '@/shared/hooks';
import { useMutation } from '@tanstack/react-query';
import { Toolbar } from '@/components/editor/Toolbar';
import { MobileToolbar } from '@/components/editor/MobileToolbar';
import { Canvas } from '@/components/editor/Canvas';
import { Inspector } from '@/components/editor/Inspector';
import { HistoryPanel } from '@/components/editor/HistoryPanel';
import { Preview } from '@/components/editor/Preview';
import { Tutorial } from '@/components/editor/Tutorial';
import { HelpPanel } from '@/components/editor/HelpPanel';
import { DocumentViewer } from '@/components/editor/DocumentViewer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PAGE_W, PAGE_H, SAFE_MARGIN, type SelectTemplate } from '@shared/types';
import { Sliders, History, Eye, Upload, FileText } from 'lucide-react';

// предполагаю, что apiRequest и queryClient уже есть в проекте,
// если путь отличается — поправь под себя

import pdfMake from 'pdfmake/build/pdfmake.js';
import vfsFonts from 'pdfmake/build/vfs_fonts.js';
(pdfMake as any).vfs = (vfsFonts as any).vfs || (vfsFonts as any).pdfMake?.vfs;

const px2pt = (px: number) => Math.round(px * 0.75);

export default function EditorPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const {
    fields,
    tables,
    templateTitle,
    setTemplateTitle,
    addImageField,
    setShowTutorial,
    isSimpleMode,
  } = useEditorStore();

  const [rightPanelTab, setRightPanelTab] = useState<
    'properties' | 'history' | 'preview' | 'viewer'
  >('properties');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation for saving/creating template
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (currentTemplateId) {
        return apiRequest<SelectTemplate>(`/api/templates/${currentTemplateId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: templateTitle,
            fields,
            tables,
          }),
        });
      } else {
        return apiRequest<SelectTemplate>('/api/templates', {
          method: 'POST',
          body: JSON.stringify({
            title: templateTitle,
            fields,
            tables,
          }),
        });
      }
    },
    onSuccess: (data) => {
      setCurrentTemplateId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Документ сохранён',
        description: 'Ваш документ успешно сохранён',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить документ',
        variant: 'destructive',
      });
    },
  });

  // показываем обучение при первом заходе
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('document-editor-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('document-editor-tutorial-seen', 'true');
    }
  }, [setShowTutorial]);

  // горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          useEditorStore.getState().undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          useEditorStore.getState().redo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
      if (e.key === 'Delete') {
        const { selectedId, selectedType, removeField, removeTable } = useEditorStore.getState();
        if (selectedId) {
          if (selectedType === 'field') {
            removeField(selectedId);
          } else if (selectedType === 'table') {
            removeTable(selectedId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // масштаб холста под мобильные
  useEffect(() => {
    const updateScale = () => {
      if (isMobile) {
        const containerWidth = window.innerWidth - 32;
        setCanvasScale(Math.min(1, containerWidth / PAGE_W));
      } else {
        setCanvasScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isMobile]);

  const handleSave = useCallback(() => {
    console.log('asdasd');
  }, []);

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
            absolutePosition: {
              x: px2pt(f.x + 8),
              y: px2pt(f.y + 8) + i * stepPt,
            },
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

  const handleDownloadPdf = useCallback(() => {
    const def = buildPdfDefinition();
    (pdfMake as any).createPdf(def).download(`${templateTitle || 'document'}.pdf`);
    toast({
      title: 'PDF скачан',
      description: 'Файл сохранён на ваш компьютер',
    });
  }, [buildPdfDefinition, templateTitle, toast]);

  const handleDownloadDocx = useCallback(async () => {
    try {
      const allItems = [
        ...fields.map((f) => ({ ...f, itemType: 'field' as const })),
        ...tables.map((t) => ({ ...t, itemType: 'table' as const })),
      ].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

      const children: any[] = [];

      for (const item of allItems) {
        if (item.itemType === 'field') {
          const f = item;
          if (f.type === 'text') {
            const alignment =
              f.align === 'center'
                ? AlignmentType.CENTER
                : f.align === 'right'
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT;

            children.push(
              new Paragraph({
                alignment,
                children: [
                  new TextRun({
                    text: f.value || '',
                    bold: f.bold,
                    italics: f.italic,
                    size: (f.fontSize || 14) * 2,
                  }),
                ],
              })
            );
          } else if (f.type === 'image' && f.dataUrl) {
            try {
              const response = await fetch(f.dataUrl);
              const buffer = await response.arrayBuffer();

              children.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: {
                        width: f.w,
                        height: f.h,
                      },
                      type: 'png',
                    }),
                  ],
                })
              );
            } catch (e) {
              console.error('Failed to add image to DOCX:', e);
            }
          }
        } else if (item.itemType === 'table') {
          const t = item;
          if (t.rows && t.rows.length > 0) {
            const tableRows = t.rows.map(
              (row, ri) =>
                new TableRow({
                  children: row.map(
                    (cell) =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: cell,
                                bold: ri === 0 && t.headerRow,
                              }),
                            ],
                          }),
                        ],
                      })
                  ),
                })
            );

            children.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
          }
        }
      }

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateTitle || 'document'}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'DOCX скачан',
        description: 'Файл сохранён на ваш компьютер',
      });
    } catch (error) {
      console.error('Failed to generate DOCX:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать DOCX файл',
        variant: 'destructive',
      });
    }
  }, [fields, tables, templateTitle, toast]);

  const handlePickImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          addImageField(reader.result as string, img.naturalWidth, img.naturalHeight);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addImageField]
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-orange-50 via-background to-orange-50 dark:from-background dark:via-background dark:to-background">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />

        {/* Header */}
        <header className="flex items-center gap-2 p-3 border-b bg-card/95 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
            <FileText className="h-5 w-5" />
          </div>
          <Input
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            className="flex-1 h-9 font-medium border-none shadow-none focus-visible:ring-1 focus-visible:ring-orange-500/70"
            placeholder="Название документа"
            data-testid="input-template-title"
          />
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-auto pb-20 bg-muted/40">
          <Canvas scale={canvasScale} />
        </div>

        {/* Mobile toolbar */}
        <MobileToolbar
          onSave={handleSave}
          onDownloadPdf={handleDownloadPdf}
          onDownloadDocx={handleDownloadDocx}
          onPickImage={handlePickImage}
          isSaving={saveMutation.isPending}
        />

        <Tutorial />
        <HelpPanel />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 via-background to-orange-100 dark:from-background dark:via-background dark:to-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-2.5 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-tight tracking-tight">DocuParse</span>
            <span className="text-xs text-muted-foreground">Конструктор PDF / DOCX-шаблонов</span>
          </div>
        </div>

        <div className="flex-1" />

        <Input
          value={templateTitle}
          onChange={(e) => setTemplateTitle(e.target.value)}
          className="max-w-xs font-medium focus-visible:ring-orange-500/70"
          placeholder="Название документа"
          data-testid="input-template-title"
        />
      </header>

      {/* Toolbar */}
      <Toolbar
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onDownloadDocx={handleDownloadDocx}
        onPickImage={handlePickImage}
        isSaving={saveMutation.isPending}
      />

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 border-t bg-muted/20">
        {/* Canvas */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <Canvas scale={canvasScale} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
          <div className="h-full flex flex-col bg-card/70 border-l">
            <Tabs
              value={rightPanelTab}
              onValueChange={(v) => setRightPanelTab(v as any)}
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-card px-2">
                <TabsTrigger
                  value="properties"
                  className="flex items-center gap-1"
                  data-testid="tab-properties"
                >
                  <Sliders className="h-4 w-4 text-orange-500" />
                  <span className="hidden lg:inline">Свойства</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-1"
                  data-testid="tab-history"
                >
                  <History className="h-4 w-4 text-orange-500" />
                  <span className="hidden lg:inline">История</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-1"
                  data-testid="tab-preview"
                >
                  <Eye className="h-4 w-4 text-orange-500" />
                  <span className="hidden lg:inline">Предпросмотр</span>
                </TabsTrigger>
                {!isSimpleMode && (
                  <TabsTrigger
                    value="viewer"
                    className="flex items-center gap-1"
                    data-testid="tab-viewer"
                  >
                    <Upload className="h-4 w-4 text-orange-500" />
                    <span className="hidden lg:inline">Просмотр</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="properties" className="flex-1 m-0 p-3 overflow-auto">
                <Inspector />
              </TabsContent>

              <TabsContent value="history" className="flex-1 m-0 p-3 overflow-auto">
                <HistoryPanel />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0 p-3 overflow-auto">
                <Preview
                  isFullscreen={isPreviewFullscreen}
                  onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                />
              </TabsContent>

              <TabsContent value="viewer" className="flex-1 m-0 p-3 overflow-auto">
                <DocumentViewer />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Tutorial />
      <HelpPanel />

      {isPreviewFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsPreviewFullscreen(false)}
        />
      )}
    </div>
  );
}
