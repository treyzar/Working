import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/entities/docs';
import {
  Type,
  Image,
  Table2,
  Undo2,
  Redo2,
  Save,
  Download,
  FileText,
  HelpCircle,
  BookOpen,
  Settings,
  Trash2,
} from 'lucide-react';

interface ToolbarProps {
  onSave: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onPickImage: () => void;
  isSaving?: boolean;
}

export function Toolbar({
  onSave,
  onDownloadPdf,
  onDownloadDocx,
  onPickImage,
  isSaving,
}: ToolbarProps) {
  const {
    addTextField,
    addTable,
    undo,
    redo,
    canUndo,
    canRedo,
    isSimpleMode,
    setSimpleMode,
    setShowHelp,
    setShowTutorial,
    selectedId,
    selectedType,
    removeField,
    removeTable,
  } = useEditorStore();

  const handleDelete = () => {
    if (!selectedId) return;
    if (selectedType === 'field') {
      removeField(selectedId);
    } else if (selectedType === 'table') {
      removeTable(selectedId);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b-2 border-orange-200 dark:border-orange-800/50">
      <div className="flex items-center gap-1 mr-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={addTextField}
              data-testid="button-add-text"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Добавить текст</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onPickImage}
              data-testid="button-add-image"
            >
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Добавить изображение</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={addTable} data-testid="button-add-table">
              <Table2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Добавить таблицу</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-6 w-px bg-orange-200 dark:bg-orange-700 mx-2" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={undo}
              disabled={!canUndo()}
              data-testid="button-undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Отменить</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={redo}
              disabled={!canRedo()}
              data-testid="button-redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Вернуть</TooltipContent>
        </Tooltip>

        {selectedId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive"
                data-testid="button-delete-selected"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Удалить выбранный элемент</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowTutorial(true)}
              data-testid="button-tutorial"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Обучение</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowHelp(true)}
              data-testid="button-help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Инструкция</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isSimpleMode ? 'secondary' : 'outline'}
              onClick={() => setSimpleMode(!isSimpleMode)}
              data-testid="button-toggle-mode"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isSimpleMode ? 'Простой' : 'Расширенный'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSimpleMode ? 'Переключить на расширенный режим' : 'Переключить на простой режим'}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="h-6 w-px bg-orange-200 dark:bg-orange-700 mx-2" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onDownloadPdf}
          data-testid="button-download-pdf"
        >
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onDownloadDocx}
          data-testid="button-download-docx"
        >
          <FileText className="h-4 w-4 mr-2" />
          DOCX
        </Button>

        <Button size="sm" onClick={onSave} disabled={isSaving} data-testid="button-save">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}
