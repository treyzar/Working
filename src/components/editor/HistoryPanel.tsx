import { useEditorStore } from "@/entities/docs/store/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Undo2, Redo2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function HistoryPanel() {
  const { history, historyIndex, undo, redo, canUndo, canRedo } =
    useEditorStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <CardTitle className="text-base">История изменений</CardTitle>
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
          <div className="text-sm text-muted-foreground text-center py-8">
            История пуста. Начните редактирование, чтобы увидеть изменения.
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {history.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    index === historyIndex
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  data-testid={`history-item-${index}`}
                >
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-1 truncate">{item.description}</span>
                  <span className="text-xs opacity-70">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
