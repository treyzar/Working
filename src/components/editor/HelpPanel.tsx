import { useEditorStore } from '@/entities/docs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Mouse, Type, Image, Table2, Save, Undo2, Maximize2 } from 'lucide-react';

const helpSections = [
  {
    id: 'basics',
    title: 'Основы работы',
    icon: Mouse,
    items: [
      {
        question: 'Как добавить элемент?',
        answer:
          'Используйте кнопки на панели инструментов вверху экрана. Кнопка с буквой T добавляет текст, кнопка с горой — изображение, кнопка с сеткой — таблицу.',
      },
      {
        question: 'Как переместить элемент?',
        answer:
          'Зажмите левую кнопку мыши (или палец на сенсорном экране) на элементе и перетащите его в нужное место. Отпустите, когда элемент окажется там, где нужно.',
      },
      {
        question: 'Как изменить размер элемента?',
        answer: 'Выберите элемент, затем потяните за синюю точку в правом нижнем углу элемента.',
      },
      {
        question: 'Как удалить элемент?',
        answer:
          "Выберите элемент и нажмите кнопку с корзиной на панели инструментов, или кнопку 'Удалить' в панели свойств справа.",
      },
    ],
  },
  {
    id: 'text',
    title: 'Работа с текстом',
    icon: Type,
    items: [
      {
        question: 'Как изменить текст?',
        answer:
          "Выберите текстовый блок и введите новый текст в поле 'Текст' на панели свойств справа.",
      },
      {
        question: 'Как изменить размер шрифта?',
        answer: "Выберите текстовый блок и передвиньте ползунок 'Размер шрифта' на панели свойств.",
      },
      {
        question: 'Как сделать текст жирным или курсивом?',
        answer:
          'Выберите текстовый блок и нажмите кнопку B (жирный) или I (курсив) на панели свойств.',
      },
      {
        question: 'Как выровнять текст?',
        answer:
          'Выберите текстовый блок и нажмите одну из кнопок выравнивания (по левому краю, по центру, по правому краю) на панели свойств.',
      },
    ],
  },
  {
    id: 'tables',
    title: 'Работа с таблицами',
    icon: Table2,
    items: [
      {
        question: 'Как добавить строку в таблицу?',
        answer: "Выберите таблицу и нажмите кнопку '+ Строка' на панели свойств.",
      },
      {
        question: 'Как добавить колонку?',
        answer: "Выберите таблицу и нажмите кнопку '+ Колонка' на панели свойств.",
      },
      {
        question: 'Как редактировать ячейки?',
        answer:
          'Выберите таблицу. На панели свойств вы увидите все ячейки таблицы. Нажмите на нужную ячейку и введите текст.',
      },
      {
        question: 'Как удалить строку или колонку?',
        answer:
          "Выберите таблицу. Рядом с каждой строкой есть кнопка '−' для удаления строки. Под таблицей есть кнопки для удаления колонок.",
      },
    ],
  },
  {
    id: 'images',
    title: 'Работа с изображениями',
    icon: Image,
    items: [
      {
        question: 'Как добавить изображение?',
        answer:
          'Нажмите кнопку с изображением горы на панели инструментов. Выберите файл с вашего компьютера.',
      },
      {
        question: 'Какие форматы поддерживаются?',
        answer: 'Поддерживаются форматы JPG, PNG, GIF и BMP.',
      },
      {
        question: 'Как изменить размер изображения?',
        answer: 'Выберите изображение и потяните за синюю точку в правом нижнем углу.',
      },
    ],
  },
  {
    id: 'save',
    title: 'Сохранение и экспорт',
    icon: Save,
    items: [
      {
        question: 'Как сохранить документ?',
        answer:
          "Нажмите кнопку 'Сохранить' в правом верхнем углу. Документ сохранится автоматически и вы сможете продолжить работу позже.",
      },
      {
        question: 'Как скачать PDF?',
        answer:
          "Нажмите кнопку 'PDF' на панели инструментов. Файл автоматически скачается на ваш компьютер.",
      },
      {
        question: 'Как скачать DOCX?',
        answer:
          "Нажмите кнопку 'DOCX' на панели инструментов. Файл можно открыть в Microsoft Word или другом редакторе.",
      },
    ],
  },
  {
    id: 'history',
    title: 'Отмена действий',
    icon: Undo2,
    items: [
      {
        question: 'Как отменить последнее действие?',
        answer: 'Нажмите кнопку со стрелкой влево (Отменить) на панели инструментов.',
      },
      {
        question: 'Как вернуть отмененное действие?',
        answer: 'Нажмите кнопку со стрелкой вправо (Вернуть) на панели инструментов.',
      },
      {
        question: 'Где посмотреть историю изменений?',
        answer:
          "История изменений отображается на панели 'История' справа. Там вы видите все действия с документом.",
      },
    ],
  },
  {
    id: 'modes',
    title: 'Режимы работы',
    icon: Maximize2,
    items: [
      {
        question: 'Что такое простой режим?',
        answer:
          'В простом режиме скрыты расширенные настройки (точные координаты, размеры в пикселях). Это упрощает работу для начинающих.',
      },
      {
        question: 'Как включить расширенный режим?',
        answer: "Нажмите кнопку 'Простой/Расширенный' на панели инструментов.",
      },
      {
        question: 'Можно ли работать на телефоне?',
        answer:
          'Да! Редактор адаптирован для работы на мобильных устройствах. Используйте касания для перемещения элементов.',
      },
    ],
  },
];

export function HelpPanel() {
  const { showHelp, setShowHelp } = useEditorStore();

  return (
    <Sheet open={showHelp} onOpenChange={setShowHelp}>
      <SheetContent
        className="w-full sm:max-w-lg border-l-2 border-orange-200 dark:border-orange-800"
        data-testid="help-panel"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40">
              <Keyboard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            Инструкция по использованию
          </SheetTitle>
          <SheetDescription>
            Ответы на частые вопросы о работе с редактором документов
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <Accordion type="single" collapsible className="w-full">
            {helpSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger
                    className="hover:no-underline hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-md px-2 transition-colors"
                    data-testid={`help-section-${section.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span>{section.title}</span>
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      >
                        {section.items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-6">
                      {section.items.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <h4 className="text-sm font-medium">{item.question}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">
              Горячие клавиши
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Отменить</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded text-xs shadow-sm">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Вернуть</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded text-xs shadow-sm">
                  Ctrl + Y
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сохранить</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded text-xs shadow-sm">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Удалить элемент</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded text-xs shadow-sm">
                  Delete
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Точное перемещение</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-orange-900/50 border border-orange-200 dark:border-orange-700 rounded text-xs shadow-sm">
                  Shift + перетаскивание
                </kbd>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
