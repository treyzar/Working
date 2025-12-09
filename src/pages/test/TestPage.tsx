import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/entities/docs';
import { useIsMobile } from '@/shared/hooks';
import { useToast } from '@/shared/hooks';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PAGE_W, PAGE_H, SAFE_MARGIN, type Field, type TableItem } from '@shared/types';
import { 
  Sliders, 
  History, 
  Eye, 
  Upload, 
  FileText, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  LayoutTemplate,
  Sparkles,
  FileUp,
  Download,
  FolderOpen,
  Plus,
  Grid3X3,
  Type,
  Image,
  Table2,
  Trash2,
  Copy,
  Move
} from 'lucide-react';

import pdfMake from 'pdfmake/build/pdfmake.js';
import vfsFonts from 'pdfmake/build/vfs_fonts.js';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  ImageRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  WidthType 
} from 'docx';

(pdfMake as any).vfs = (vfsFonts as any).vfs || (vfsFonts as any).pdfMake?.vfs;

const px2pt = (px: number) => Math.round(px * 0.75);

const PRESET_TEMPLATES = [
  { id: 'blank', name: 'Пустой документ', icon: FileText },
  { id: 'letter', name: 'Письмо', icon: FileUp },
  { id: 'invoice', name: 'Счет-фактура', icon: Grid3X3 },
  { id: 'report', name: 'Отчет', icon: LayoutTemplate },
];

const TEMPLATE_DATA: Record<string, { fields: Field[], tables: TableItem[], title: string }> = {
  letter: {
    title: 'Официальное письмо',
    fields: [
      {
        id: 'letter-1',
        type: 'text',
        label: 'Получатель',
        value: 'Директору ООО "Компания"\nИванову И.И.',
        x: 56, y: 56, w: 300, h: 60,
        fontSize: 14, bold: false, italic: false, align: 'left'
      },
      {
        id: 'letter-2',
        type: 'text',
        label: 'Дата',
        value: new Date().toLocaleDateString('ru-RU'),
        x: 400, y: 56, w: 150, h: 30,
        fontSize: 12, bold: false, italic: false, align: 'right'
      },
      {
        id: 'letter-3',
        type: 'text',
        label: 'Заголовок',
        value: 'О направлении документов',
        x: 56, y: 150, w: 500, h: 40,
        fontSize: 16, bold: true, italic: false, align: 'center'
      },
      {
        id: 'letter-4',
        type: 'text',
        label: 'Тело письма',
        value: 'Уважаемый Иван Иванович!\n\nНаправляем Вам запрашиваемые документы согласно договору.\n\nПриложение: на 5 листах.',
        x: 56, y: 210, w: 500, h: 150,
        fontSize: 14, bold: false, italic: false, align: 'left'
      },
      {
        id: 'letter-5',
        type: 'text',
        label: 'Подпись',
        value: 'С уважением,\nГенеральный директор _________________ Петров П.П.',
        x: 56, y: 400, w: 400, h: 60,
        fontSize: 14, bold: false, italic: false, align: 'left'
      }
    ],
    tables: []
  },
  invoice: {
    title: 'Счет-фактура',
    fields: [
      {
        id: 'inv-1',
        type: 'text',
        label: 'Заголовок',
        value: 'СЧЕТ-ФАКТУРА № ___',
        x: 56, y: 56, w: 500, h: 40,
        fontSize: 20, bold: true, italic: false, align: 'center'
      },
      {
        id: 'inv-2',
        type: 'text',
        label: 'Дата',
        value: `от ${new Date().toLocaleDateString('ru-RU')}`,
        x: 56, y: 100, w: 500, h: 30,
        fontSize: 14, bold: false, italic: false, align: 'center'
      },
      {
        id: 'inv-3',
        type: 'text',
        label: 'Поставщик',
        value: 'Поставщик: ООО "Поставщик"\nИНН: 1234567890\nАдрес: г. Москва, ул. Примерная, д. 1',
        x: 56, y: 150, w: 250, h: 80,
        fontSize: 12, bold: false, italic: false, align: 'left'
      },
      {
        id: 'inv-4',
        type: 'text',
        label: 'Покупатель',
        value: 'Покупатель: ООО "Покупатель"\nИНН: 0987654321\nАдрес: г. Москва, ул. Другая, д. 2',
        x: 320, y: 150, w: 250, h: 80,
        fontSize: 12, bold: false, italic: false, align: 'left'
      },
      {
        id: 'inv-5',
        type: 'text',
        label: 'Итого',
        value: 'ИТОГО: 150 000,00 руб.',
        x: 56, y: 450, w: 500, h: 40,
        fontSize: 16, bold: true, italic: false, align: 'right'
      }
    ],
    tables: [
      {
        id: 'inv-t1',
        rows: [
          ['№', 'Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма'],
          ['1', 'Товар А', '10', 'шт.', '5 000', '50 000'],
          ['2', 'Услуга Б', '1', 'усл.', '100 000', '100 000']
        ],
        x: 56, y: 260, w: 500, h: 150,
        headerRow: true, borderStyle: 'full'
      }
    ]
  },
  report: {
    title: 'Отчет',
    fields: [
      {
        id: 'rep-1',
        type: 'text',
        label: 'Заголовок',
        value: 'ОТЧЕТ',
        x: 56, y: 56, w: 500, h: 50,
        fontSize: 24, bold: true, italic: false, align: 'center'
      },
      {
        id: 'rep-2',
        type: 'text',
        label: 'Подзаголовок',
        value: 'о проделанной работе за период',
        x: 56, y: 110, w: 500, h: 30,
        fontSize: 14, bold: false, italic: true, align: 'center'
      },
      {
        id: 'rep-3',
        type: 'text',
        label: 'Введение',
        value: '1. Введение\n\nВ данном отчете представлены результаты работы за отчетный период.',
        x: 56, y: 160, w: 500, h: 80,
        fontSize: 14, bold: false, italic: false, align: 'left'
      },
      {
        id: 'rep-4',
        type: 'text',
        label: 'Основная часть',
        value: '2. Основная часть\n\nВыполненные задачи:\n• Задача 1 - выполнена\n• Задача 2 - в процессе\n• Задача 3 - запланирована',
        x: 56, y: 260, w: 500, h: 120,
        fontSize: 14, bold: false, italic: false, align: 'left'
      },
      {
        id: 'rep-5',
        type: 'text',
        label: 'Заключение',
        value: '3. Заключение\n\nВсе поставленные цели достигнуты в полном объеме.',
        x: 56, y: 400, w: 500, h: 80,
        fontSize: 14, bold: false, italic: false, align: 'left'
      }
    ],
    tables: []
  }
};

export default function EditorPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const {
    fields,
    tables,
    templateTitle,
    setTemplateTitle,
    addImageField,
    addTextField,
    addTable,
    setShowTutorial,
    isSimpleMode,
    removeField,
    removeTable,
    selectedId,
    selectedType,
    clearTemplate,
  } = useEditorStore();

  const [rightPanelTab, setRightPanelTab] = useState<
    'properties' | 'history' | 'preview' | 'viewer' | 'layers' | 'templates'
  >('properties');
  const [leftPanelTab, setLeftPanelTab] = useState<'tools' | 'elements'>('tools');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('document-editor-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('document-editor-tutorial-seen', 'true');
    }
  }, [setShowTutorial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          useEditorStore.getState().undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          useEditorStore.getState().redo();
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
    toast({
      title: 'Документ сохранён',
      description: 'Ваш документ успешно сохранён локально',
    });
  }, [toast]);

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

      const children: (Paragraph | Table)[] = [];

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
        const img = new window.Image();
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

  const handleZoomIn = useCallback(() => {
    setCanvasScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleNewDocument = useCallback(() => {
    clearTemplate();
    toast({
      title: 'Новый документ',
      description: 'Создан новый пустой документ',
    });
  }, [clearTemplate, toast]);

  const elementsCount = fields.length + tables.length;

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

        <header className="flex items-center gap-2 p-3 border-b bg-card/95 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
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

        <div className="flex-1 overflow-auto pb-20 bg-muted/40">
          <Canvas scale={canvasScale} />
        </div>

        <MobileToolbar
          onSave={handleSave}
          onDownloadPdf={handleDownloadPdf}
          onDownloadDocx={handleDownloadDocx}
          onPickImage={handlePickImage}
          isSaving={false}
        />

        <Tutorial />
        <HelpPanel />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-background to-slate-100 dark:from-slate-950 dark:via-background dark:to-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
      />

      <header className="flex items-center gap-4 px-6 py-3 border-b bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              DocuParse Pro
            </span>
            <span className="text-xs text-muted-foreground">
              Конструктор и парсер документов
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewDocument}
                data-testid="button-new-document"
              >
                <Plus className="h-4 w-4 mr-1" />
                Новый
              </Button>
            </TooltipTrigger>
            <TooltipContent>Создать новый документ</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => docInputRef.current?.click()}
                data-testid="button-open-document"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Открыть
              </Button>
            </TooltipTrigger>
            <TooltipContent>Открыть документ</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <Input
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            className="max-w-xs font-medium bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-orange-500/50"
            placeholder="Название документа"
            data-testid="input-template-title"
          />
          
          <Badge variant="secondary" className="px-3">
            {elementsCount} элементов
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={canvasScale <= 0.5}
                className="h-8 w-8"
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Уменьшить</TooltipContent>
          </Tooltip>
          
          <span className="text-xs font-medium w-12 text-center">
            {Math.round(canvasScale * 100)}%
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={canvasScale >= 2}
                className="h-8 w-8"
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Увеличить</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <Toolbar
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onDownloadDocx={handleDownloadDocx}
        onPickImage={handlePickImage}
        isSaving={false}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {showLeftPanel && (
          <>
            <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
              <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/50 border-r">
                <Tabs value={leftPanelTab} onValueChange={(v) => setLeftPanelTab(v as any)} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 py-1">
                    <TabsTrigger value="tools" className="text-xs" data-testid="tab-tools">
                      Инструменты
                    </TabsTrigger>
                    <TabsTrigger value="elements" className="text-xs" data-testid="tab-elements">
                      Элементы
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tools" className="flex-1 m-0 overflow-auto">
                    <div className="p-3 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Добавить элемент
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 border-dashed"
                            onClick={addTextField}
                            data-testid="button-add-text-panel"
                          >
                            <Type className="h-6 w-6 text-orange-500" />
                            <span className="text-xs">Текст</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 border-dashed"
                            onClick={handlePickImage}
                            data-testid="button-add-image-panel"
                          >
                            <Image className="h-6 w-6 text-amber-500" />
                            <span className="text-xs">Изображение</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 border-dashed"
                            onClick={addTable}
                            data-testid="button-add-table-panel"
                          >
                            <Table2 className="h-6 w-6 text-teal-500" />
                            <span className="text-xs">Таблица</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 border-dashed"
                            onClick={() => setRightPanelTab('viewer')}
                            data-testid="button-import-panel"
                          >
                            <Upload className="h-6 w-6 text-blue-500" />
                            <span className="text-xs">Импорт</span>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Шаблоны
                        </h4>
                        <div className="space-y-1">
                          {PRESET_TEMPLATES.map((template) => (
                            <Button
                              key={template.id}
                              variant="ghost"
                              className="w-full justify-start h-9 text-xs"
                              onClick={() => {
                                if (template.id === 'blank') {
                                  handleNewDocument();
                                } else if (TEMPLATE_DATA[template.id]) {
                                  const data = TEMPLATE_DATA[template.id];
                                  useEditorStore.getState().loadTemplate(data.fields, data.tables, data.title);
                                  toast({
                                    title: 'Шаблон загружен',
                                    description: `Загружен шаблон "${template.name}"`,
                                  });
                                }
                              }}
                              data-testid={`button-template-${template.id}`}
                            >
                              <template.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {template.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Экспорт
                        </h4>
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-9 text-xs"
                            onClick={handleDownloadPdf}
                            data-testid="button-export-pdf"
                          >
                            <Download className="h-4 w-4 mr-2 text-red-500" />
                            Скачать PDF
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-9 text-xs"
                            onClick={handleDownloadDocx}
                            data-testid="button-export-docx"
                          >
                            <Download className="h-4 w-4 mr-2 text-blue-500" />
                            Скачать DOCX
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="elements" className="flex-1 m-0 overflow-auto">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Слои ({elementsCount})
                        </h4>
                        
                        {fields.length === 0 && tables.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Нет элементов
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {fields.map((field, index) => (
                              <Card 
                                key={field.id} 
                                className={`p-2 cursor-pointer transition-all ${
                                  selectedId === field.id ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/30' : ''
                                }`}
                                onClick={() => useEditorStore.getState().selectItem(field.id, 'field')}
                                data-testid={`layer-field-${field.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  {field.type === 'text' ? (
                                    <Type className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <Image className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="text-xs truncate flex-1">
                                    {field.type === 'text' ? (field.value?.slice(0, 20) || 'Текст') + '...' : 'Изображение'}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeField(field.id);
                                    }}
                                    data-testid={`button-delete-layer-${field.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                            
                            {tables.map((table, index) => (
                              <Card 
                                key={table.id} 
                                className={`p-2 cursor-pointer transition-all ${
                                  selectedId === table.id ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/30' : ''
                                }`}
                                onClick={() => useEditorStore.getState().selectItem(table.id, 'table')}
                                data-testid={`layer-table-${table.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Table2 className="h-4 w-4 text-teal-500" />
                                  <span className="text-xs truncate flex-1">
                                    Таблица {table.rows.length}x{table.rows[0]?.length || 0}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTable(table.id);
                                    }}
                                    data-testid={`button-delete-layer-${table.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={showLeftPanel ? 52 : 60} minSize={40}>
          <div className="h-full bg-slate-100 dark:bg-slate-900">
            <Canvas scale={canvasScale} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
          <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/50 border-l">
            <Tabs
              value={rightPanelTab}
              onValueChange={(v) => setRightPanelTab(v as any)}
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 py-1 flex-wrap gap-1">
                <TabsTrigger
                  value="properties"
                  className="flex items-center gap-1 text-xs"
                  data-testid="tab-properties"
                >
                  <Sliders className="h-3 w-3" />
                  Свойства
                </TabsTrigger>
                <TabsTrigger
                  value="layers"
                  className="flex items-center gap-1 text-xs"
                  data-testid="tab-layers"
                >
                  <Layers className="h-3 w-3" />
                  Слои
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-1 text-xs"
                  data-testid="tab-history"
                >
                  <History className="h-3 w-3" />
                  История
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-1 text-xs"
                  data-testid="tab-preview"
                >
                  <Eye className="h-3 w-3" />
                  Превью
                </TabsTrigger>
                {!isSimpleMode && (
                  <TabsTrigger
                    value="viewer"
                    className="flex items-center gap-1 text-xs"
                    data-testid="tab-viewer"
                  >
                    <Upload className="h-3 w-3" />
                    Импорт
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="properties" className="flex-1 m-0 p-3 overflow-auto">
                <Inspector />
              </TabsContent>

              <TabsContent value="layers" className="flex-1 m-0 p-3 overflow-auto">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-orange-500" />
                      Все элементы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedId === field.id
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                                : 'border-border'
                            }`}
                            onClick={() => useEditorStore.getState().selectItem(field.id, 'field')}
                            data-testid={`layer-item-${field.id}`}
                          >
                            <div className="flex items-center gap-2">
                              {field.type === 'text' ? (
                                <Type className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Image className="h-4 w-4 text-amber-500" />
                              )}
                              <span className="text-sm font-medium flex-1 truncate">
                                {field.type === 'text' ? field.value?.slice(0, 30) || 'Пустой текст' : field.label}
                              </span>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6">
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(field.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Позиция: {Math.round(field.x)}, {Math.round(field.y)} | Размер: {Math.round(field.w)}x{Math.round(field.h)}
                            </div>
                          </div>
                        ))}
                        
                        {tables.map((table) => (
                          <div
                            key={table.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedId === table.id
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                                : 'border-border'
                            }`}
                            onClick={() => useEditorStore.getState().selectItem(table.id, 'table')}
                            data-testid={`layer-item-${table.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <Table2 className="h-4 w-4 text-teal-500" />
                              <span className="text-sm font-medium flex-1">
                                Таблица ({table.rows.length} строк, {table.rows[0]?.length || 0} колонок)
                              </span>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6">
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTable(table.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Позиция: {Math.round(table.x)}, {Math.round(table.y)} | Размер: {Math.round(table.w)}x{Math.round(table.h)}
                            </div>
                          </div>
                        ))}
                        
                        {fields.length === 0 && tables.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Нет элементов на холсте</p>
                            <p className="text-xs mt-1">Добавьте текст, изображение или таблицу</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsPreviewFullscreen(false)}
        />
      )}
    </div>
  );
}
