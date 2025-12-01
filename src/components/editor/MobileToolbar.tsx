import { useState } from 'react';
import { useEditorStore } from '@/entities/docs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Type,
  Image,
  Table2,
  Undo2,
  Redo2,
  Save,
  FileText,
  Menu,
  HelpCircle,
  BookOpen,
  Settings,
  Trash2,
  File,
} from 'lucide-react';

interface MobileToolbarProps {
  onSave: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onPickImage: () => void;
  isSaving?: boolean;
}

export function MobileToolbar({
  onSave,
  onDownloadPdf,
  onDownloadDocx,
  onPickImage,
  isSaving,
}: MobileToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      {/* Bottom FAB for adding elements */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 border-orange-600 text-white"
          onClick={addTextField}
          data-testid="fab-add-text"
        >
          <Type className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border-t-2 border-orange-200 dark:border-orange-800 safe-area-inset-bottom">
        <div className="flex items-center justify-around p-2">
          <Button
            size="lg"
            variant="ghost"
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={undo}
            disabled={!canUndo()}
            data-testid="mobile-button-undo"
          >
            <Undo2 className="h-5 w-5" />
            <span className="text-[10px]">Отменить</span>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={redo}
            disabled={!canRedo()}
            data-testid="mobile-button-redo"
          >
            <Redo2 className="h-5 w-5" />
            <span className="text-[10px]">Вернуть</span>
          </Button>

          {selectedId && (
            <Button
              size="lg"
              variant="ghost"
              className="flex-1 flex flex-col items-center gap-1 h-auto py-2 text-destructive"
              onClick={handleDelete}
              data-testid="mobile-button-delete"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-[10px]">Удалить</span>
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={onSave}
            disabled={isSaving}
            data-testid="mobile-button-save"
          >
            <Save className="h-5 w-5" />
            <span className="text-[10px]">{isSaving ? '...' : 'Сохранить'}</span>
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                variant="ghost"
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                data-testid="mobile-button-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px]">Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 py-6">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(addTextField)}
                  data-testid="mobile-menu-add-text"
                >
                  <Type className="h-6 w-6" />
                  <span className="text-xs">Текст</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(onPickImage)}
                  data-testid="mobile-menu-add-image"
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Изображение</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(addTable)}
                  data-testid="mobile-menu-add-table"
                >
                  <Table2 className="h-6 w-6" />
                  <span className="text-xs">Таблица</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(onDownloadPdf)}
                  data-testid="mobile-menu-download-pdf"
                >
                  <File className="h-6 w-6" />
                  <span className="text-xs">Скачать PDF</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(onDownloadDocx)}
                  data-testid="mobile-menu-download-docx"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">Скачать DOCX</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(() => setShowTutorial(true))}
                  data-testid="mobile-menu-tutorial"
                >
                  <BookOpen className="h-6 w-6" />
                  <span className="text-xs">Обучение</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(() => setShowHelp(true))}
                  data-testid="mobile-menu-help"
                >
                  <HelpCircle className="h-6 w-6" />
                  <span className="text-xs">Справка</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleAction(() => setSimpleMode(!isSimpleMode))}
                  data-testid="mobile-menu-mode"
                >
                  <Settings className="h-6 w-6" />
                  <span className="text-xs">{isSimpleMode ? 'Простой' : 'Полный'}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
