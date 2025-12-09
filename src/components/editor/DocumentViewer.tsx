import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, File, X, ZoomIn, ZoomOut, RefreshCw, Eye, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/entities/docs';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function parseTablesFromHtml(html: string): string[][][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables: string[][][] = [];
  
  doc.querySelectorAll('table').forEach((table) => {
    const rows: string[][] = [];
    table.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('td, th').forEach((cell) => {
        cells.push(cell.textContent?.trim() || '');
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    if (rows.length > 0) {
      tables.push(rows);
    }
  });
  
  return tables;
}

function splitTextIntoBlocks(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const blocks: string[] = [];
  
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length > 500) {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      let currentBlock = '';
      for (const sentence of sentences) {
        if (currentBlock.length + sentence.length > 400) {
          if (currentBlock) blocks.push(currentBlock.trim());
          currentBlock = sentence;
        } else {
          currentBlock += (currentBlock ? ' ' : '') + sentence;
        }
      }
      if (currentBlock) blocks.push(currentBlock.trim());
    } else {
      blocks.push(trimmed);
    }
  }
  
  return blocks;
}

interface DocumentViewerProps {
  className?: string;
}

export function DocumentViewer({ className }: DocumentViewerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'docx' | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [docxRawText, setDocxRawText] = useState<string>('');
  const [docxTables, setDocxTables] = useState<string[][][]>([]);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const importParsedContent = useEditorStore((state) => state.importParsedContent);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isPdf = fileName.endsWith('.pdf');
      const isDocx = fileName.endsWith('.docx');

      if (!isPdf && !isDocx) {
        toast({
          title: 'Неподдерживаемый формат',
          description: 'Пожалуйста, выберите файл PDF или DOCX',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      setUploadedFile(file);
      setFileType(isPdf ? 'pdf' : 'docx');

      try {
        if (isPdf) {
          const arrayBuffer = await file.arrayBuffer();
          setPdfData(arrayBuffer);
          setDocxHtml('');
          setDocxRawText('');
          setDocxTables([]);
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
          const textResult = await mammoth.extractRawText({ arrayBuffer });
          setDocxHtml(htmlResult.value);
          setDocxRawText(textResult.value);
          setPdfData(null);
          
          const tables = parseTablesFromHtml(htmlResult.value);
          setDocxTables(tables);
        }
      } catch (error) {
        toast({
          title: 'Ошибка чтения файла',
          description: 'Не удалось открыть файл. Проверьте, что файл не поврежден.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const syntheticEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await handleFileUpload(syntheticEvent);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setFileType(null);
    setPdfData(null);
    setDocxHtml('');
    setDocxRawText('');
    setDocxTables([]);
    setNumPages(0);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleExtractToCanvas = useCallback(async () => {
    if (!uploadedFile) return;
    
    setIsExtracting(true);
    
    try {
      if (fileType === 'docx' && docxRawText) {
        const textBlocks = splitTextIntoBlocks(docxRawText);
        importParsedContent(textBlocks, docxTables);
        
        toast({
          title: 'Контент извлечён',
          description: `Добавлено ${textBlocks.length} текстовых блоков и ${docxTables.length} таблиц`,
        });
      } else if (fileType === 'pdf' && pdfData) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const textBlocks: string[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          if (pageText.trim()) {
            textBlocks.push(...splitTextIntoBlocks(pageText));
          }
        }
        
        importParsedContent(textBlocks, []);
        
        toast({
          title: 'Контент извлечён',
          description: `Добавлено ${textBlocks.length} текстовых блоков из ${pdf.numPages} страниц`,
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Ошибка извлечения',
        description: 'Не удалось извлечь контент из документа',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  }, [uploadedFile, fileType, docxRawText, docxTables, pdfData, importParsedContent, toast]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  return (
    <Card className={cn(className, 'border-orange-100 dark:border-orange-900/50')}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardTitle className="text-base flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Просмотр документов
        </CardTitle>
        {uploadedFile && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((prev) => Math.max(prev - 25, 50))}
              disabled={zoom <= 50}
              data-testid="button-viewer-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-10 text-center">{zoom}%</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setZoom((prev) => Math.min(prev + 25, 200))}
              disabled={zoom >= 200}
              data-testid="button-viewer-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={clearFile}
              data-testid="button-viewer-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div
            className="border-2 border-dashed border-orange-200 dark:border-orange-700 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all duration-200"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            data-testid="document-upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-file-upload"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center">
              <Upload className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-orange-800 dark:text-orange-200">
              Загрузите документ
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded">
                <File className="h-4 w-4" />
                PDF
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded">
                <FileText className="h-4 w-4" />
                DOCX
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-md border border-orange-200 dark:border-orange-800">
              {fileType === 'pdf' ? (
                <File className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              ) : (
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-sm font-medium truncate flex-1">{uploadedFile.name}</span>
              <span className="text-xs text-orange-600/70 dark:text-orange-400/70">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            
            <Button
              onClick={handleExtractToCanvas}
              disabled={isExtracting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              data-testid="button-extract-to-canvas"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExtracting ? 'Извлечение...' : 'Извлечь на холст'}
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] border border-orange-200 dark:border-orange-800 rounded-md">
                {fileType === 'pdf' && pdfData && (
                  <div
                    className="flex flex-col items-center p-4"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  >
                    <Document
                      file={pdfData}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center h-[400px]">
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                    {numPages > 1 && (
                      <div className="flex items-center gap-2 mt-4 sticky bottom-0 bg-background p-2 rounded-md shadow">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((prev) => prev - 1)}
                          data-testid="button-prev-page"
                        >
                          Назад
                        </Button>
                        <span className="text-sm">
                          Страница {currentPage} из {numPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage >= numPages}
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          data-testid="button-next-page"
                        >
                          Вперед
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {fileType === 'docx' && docxHtml && (
                  <div
                    className="p-4 prose prose-sm max-w-none"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                    dangerouslySetInnerHTML={{ __html: docxHtml }}
                    data-testid="docx-content"
                  />
                )}
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
