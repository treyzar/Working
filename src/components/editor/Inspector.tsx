import { useEditorStore } from '@entities/docs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Plus,
  Minus,
  Trash2,
  Table2,
  Type,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Align } from '@shared/types';

export function Inspector() {
  const {
    fields,
    tables,
    selectedId,
    selectedType,
    updateField,
    updateTable,
    removeField,
    removeTable,
    addTableRow,
    removeTableRow,
    addTableColumn,
    removeTableColumn,
    updateTableCell,
    isSimpleMode,
    saveToHistory,
  } = useEditorStore();

  const selectedField = selectedType === 'field' ? fields.find((f) => f.id === selectedId) : null;
  const selectedTable = selectedType === 'table' ? tables.find((t) => t.id === selectedId) : null;

  if (!selectedId) {
    return (
      <Card className="h-full border-orange-100 dark:border-orange-900/50">
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardTitle className="text-base text-orange-800 dark:text-orange-200">Свойства</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8 px-4 bg-orange-50/30 dark:bg-orange-950/20 rounded-lg border border-dashed border-orange-200 dark:border-orange-800">
            Выберите элемент на холсте для редактирования его свойств
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedField) {
    return (
      <Card className="h-full overflow-auto border-orange-100 dark:border-orange-900/50">
        <CardHeader className="pb-3 flex flex-row items-center gap-2 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
          {selectedField.type === 'text' && (
            <Type className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          )}
          {selectedField.type === 'image' && (
            <Image className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <CardTitle className="text-base text-orange-800 dark:text-orange-200">
            {selectedField.type === 'text' ? 'Текст' : 'Изображение'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedField.type === 'text' && (
            <>
              <div className="space-y-2">
                <Label>Текст</Label>
                <Textarea
                  value={selectedField.value || ''}
                  onChange={(e) => {
                    updateField(selectedId, { value: e.target.value });
                  }}
                  onBlur={() => saveToHistory('Текст изменен')}
                  className="min-h-[100px] resize-none"
                  data-testid="input-field-text"
                />
              </div>

              <div className="space-y-2">
                <Label>Размер шрифта: {selectedField.fontSize || 14}px</Label>
                <Slider
                  value={[selectedField.fontSize || 14]}
                  min={8}
                  max={72}
                  step={1}
                  onValueChange={([v]) => updateField(selectedId, { fontSize: v })}
                  onValueCommit={() => saveToHistory('Размер шрифта изменен')}
                  data-testid="slider-font-size"
                />
              </div>

              <div className="space-y-2">
                <Label>Стиль текста</Label>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant={selectedField.bold ? 'default' : 'outline'}
                    onClick={() => {
                      updateField(selectedId, { bold: !selectedField.bold });
                      saveToHistory('Стиль изменен');
                    }}
                    data-testid="button-bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={selectedField.italic ? 'default' : 'outline'}
                    onClick={() => {
                      updateField(selectedId, { italic: !selectedField.italic });
                      saveToHistory('Стиль изменен');
                    }}
                    data-testid="button-italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Выравнивание</Label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as Align[]).map((align) => (
                    <Button
                      key={align}
                      size="icon"
                      variant={selectedField.align === align ? 'default' : 'outline'}
                      onClick={() => {
                        updateField(selectedId, { align });
                        saveToHistory('Выравнивание изменено');
                      }}
                      data-testid={`button-align-${align}`}
                    >
                      {align === 'left' && <AlignLeft className="h-4 w-4" />}
                      {align === 'center' && <AlignCenter className="h-4 w-4" />}
                      {align === 'right' && <AlignRight className="h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!isSimpleMode && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Позиция</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedField.x)}
                    onChange={(e) => updateField(selectedId, { x: parseInt(e.target.value) || 0 })}
                    onBlur={() => saveToHistory('Позиция изменена')}
                    data-testid="input-pos-x"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedField.y)}
                    onChange={(e) => updateField(selectedId, { y: parseInt(e.target.value) || 0 })}
                    onBlur={() => saveToHistory('Позиция изменена')}
                    data-testid="input-pos-y"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Ширина</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedField.w)}
                    onChange={(e) => updateField(selectedId, { w: parseInt(e.target.value) || 80 })}
                    onBlur={() => saveToHistory('Размер изменен')}
                    data-testid="input-width"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Высота</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedField.h)}
                    onChange={(e) => updateField(selectedId, { h: parseInt(e.target.value) || 30 })}
                    onBlur={() => saveToHistory('Размер изменен')}
                    data-testid="input-height"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => removeField(selectedId)}
              data-testid="button-delete-field"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить элемент
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedTable) {
    return (
      <Card className="h-full overflow-auto border-teal-100 dark:border-teal-900/50">
        <CardHeader className="pb-3 flex flex-row items-center gap-2 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <Table2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <CardTitle className="text-base text-teal-800 dark:text-teal-200">Таблица</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Управление таблицей</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addTableRow(selectedId)}
                data-testid="button-add-row"
              >
                <Plus className="h-3 w-3 mr-1" />
                Строка
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addTableColumn(selectedId)}
                data-testid="button-add-column"
              >
                <Plus className="h-3 w-3 mr-1" />
                Колонка
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Заголовок в первой строке</Label>
            <Switch
              checked={selectedTable.headerRow ?? true}
              onCheckedChange={(checked) => {
                updateTable(selectedId, { headerRow: checked });
                saveToHistory('Настройки таблицы изменены');
              }}
              data-testid="switch-header-row"
            />
          </div>

          {!isSimpleMode && (
            <div className="space-y-2">
              <Label>Стиль границ</Label>
              <Select
                value={selectedTable.borderStyle || 'light'}
                onValueChange={(v) => {
                  updateTable(selectedId, { borderStyle: v as 'none' | 'light' | 'full' });
                  saveToHistory('Стиль границ изменен');
                }}
              >
                <SelectTrigger data-testid="select-border-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без границ</SelectItem>
                  <SelectItem value="light">Легкие</SelectItem>
                  <SelectItem value="full">Полные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ячейки таблицы</Label>
            <div className="max-h-[300px] overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <tbody>
                  {selectedTable.rows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-b-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-1">
                          <Input
                            value={cell}
                            onChange={(e) => updateTableCell(selectedId, ri, ci, e.target.value)}
                            onBlur={() => saveToHistory('Ячейка изменена')}
                            className={cn(
                              'h-8 text-xs',
                              ri === 0 && selectedTable.headerRow && 'font-semibold'
                            )}
                            data-testid={`input-cell-${ri}-${ci}`}
                          />
                        </td>
                      ))}
                      {selectedTable.rows.length > 1 && (
                        <td className="p-1 w-8">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => removeTableRow(selectedId, ri)}
                            data-testid={`button-remove-row-${ri}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedTable.rows[0]?.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                {selectedTable.rows[0].map((_, ci) => (
                  <Button
                    key={ci}
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => removeTableColumn(selectedId, ci)}
                    data-testid={`button-remove-col-${ci}`}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Кол. {ci + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {!isSimpleMode && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Позиция</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedTable.x)}
                    onChange={(e) => updateTable(selectedId, { x: parseInt(e.target.value) || 0 })}
                    onBlur={() => saveToHistory('Позиция изменена')}
                    data-testid="input-table-pos-x"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedTable.y)}
                    onChange={(e) => updateTable(selectedId, { y: parseInt(e.target.value) || 0 })}
                    onBlur={() => saveToHistory('Позиция изменена')}
                    data-testid="input-table-pos-y"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Ширина</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedTable.w)}
                    onChange={(e) => updateTable(selectedId, { w: parseInt(e.target.value) || 80 })}
                    onBlur={() => saveToHistory('Размер изменен')}
                    data-testid="input-table-width"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Высота</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedTable.h)}
                    onChange={(e) => updateTable(selectedId, { h: parseInt(e.target.value) || 30 })}
                    onBlur={() => saveToHistory('Размер изменен')}
                    data-testid="input-table-height"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => removeTable(selectedId)}
              data-testid="button-delete-table"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить таблицу
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
