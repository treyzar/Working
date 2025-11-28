import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  File,
  X,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useToast } from "@/shared/hooks/docs/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  className?: string;
}

export function DocumentViewer({ className }: DocumentViewerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "docx" | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [docxHtml, setDocxHtml] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      const isPdf = fileName.endsWith(".pdf");
      const isDocx = fileName.endsWith(".docx");

      if (!isPdf && !isDocx) {
        toast({
          title: "Неподдерживаемый формат",
          description: "Пожалуйста, выберите файл PDF или DOCX",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setUploadedFile(file);
      setFileType(isPdf ? "pdf" : "docx");

      try {
        if (isPdf) {
          const arrayBuffer = await file.arrayBuffer();
          setPdfData(arrayBuffer);
          setDocxHtml("");
        } else {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value);
          setPdfData(null);
        }
      } catch (error: unknown) {
        toast({
          title: `Ошибка чтения файла, ${error}`,
          description:
            "Не удалось открыть файл. Проверьте, что файл не поврежден.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
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
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setFileType(null);
    setPdfData(null);
    setDocxHtml("");
    setNumPages(0);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
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
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Загрузите документ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className="flex justify-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <File className="h-4 w-4" />
                PDF
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" />
                DOCX
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              {fileType === "pdf" ? (
                <File className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-sm font-medium truncate flex-1">
                {uploadedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md">
                {fileType === "pdf" && pdfData && (
                  <div
                    className="flex flex-col items-center p-4"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                    }}
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

                {fileType === "docx" && docxHtml && (
                  <div
                    className="p-4 prose prose-sm max-w-none"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                    }}
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
