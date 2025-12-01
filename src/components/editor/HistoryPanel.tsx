import { useEditorStore } from '@entities/docs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Undo2, Redo2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HistoryPanel() {
  const { history, historyIndex, undo, redo, canUndo, canRedo } = useEditorStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="h-full border-orange-100 dark:border-orange-900/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-base text-orange-800 dark:text-orange-200">
            История изменений
          </CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={undo}
            disabled={!canUndo()}
            data-testid="button-history-undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={redo}
            disabled={!canRedo()}
            data-testid="button-history-redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 px-4 bg-orange-50/30 dark:bg-orange-950/20 rounded-lg border border-dashed border-orange-200 dark:border-orange-800">
            История пуста. Начните редактирование, чтобы увидеть изменения.
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {history.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-200',
                    index === historyIndex
                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium border-l-2 border-orange-500'
                      : 'text-muted-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30'
                  )}
                  data-testid={`history-item-${index}`}
                >
                  <Clock className="h-3 w-3 flex-shrink-0 text-orange-500 dark:text-orange-400" />
                  <span className="flex-1 truncate">{item.description}</span>
                  <span className="text-xs opacity-70">{formatTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
