import { useState } from "react";
import { useEditorStore } from "@/entities/docs/store/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Type,
  Image,
  Table2,
  Move,
  Edit3,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const tutorialSteps = [
  {
    title: "Добро пожаловать в редактор документов",
    description:
      "Этот редактор поможет вам создавать профессиональные документы в форматах PDF и DOCX. Давайте познакомимся с основными функциями.",
    icon: FileText,
    highlight: null,
  },
  {
    title: "Добавление текста",
    description:
      "Нажмите кнопку с буквой 'T' на панели инструментов, чтобы добавить текстовый блок. Вы можете изменить шрифт, размер и выравнивание текста.",
    icon: Type,
    highlight: "button-add-text",
  },
  {
    title: "Добавление изображений",
    description:
      "Нажмите кнопку с изображением горы, чтобы загрузить картинку с вашего компьютера. Изображения автоматически масштабируются под размер страницы.",
    icon: Image,
    highlight: "button-add-image",
  },
  {
    title: "Добавление таблиц",
    description:
      "Нажмите кнопку с таблицей, чтобы добавить таблицу. Вы можете добавлять и удалять строки и колонки, редактировать ячейки.",
    icon: Table2,
    highlight: "button-add-table",
  },
  {
    title: "Перемещение элементов",
    description:
      "Зажмите левую кнопку мыши на элементе и перетащите его в нужное место. Элементы автоматически выравниваются друг относительно друга.",
    icon: Move,
    highlight: null,
  },
  {
    title: "Редактирование свойств",
    description:
      "Выберите элемент, чтобы открыть панель свойств справа. Здесь вы можете изменить текст, размер, стиль и другие параметры.",
    icon: Edit3,
    highlight: null,
  },
  {
    title: "Готово!",
    description:
      "Теперь вы знаете основы работы с редактором. Не забудьте сохранить свой документ и скачать его в нужном формате!",
    icon: CheckCircle,
    highlight: null,
  },
];

export function Tutorial() {
  const { showTutorial, setShowTutorial } = useEditorStore();
  const [currentStep, setCurrentStep] = useState(0);

  const step = tutorialSteps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setShowTutorial(false);
    setCurrentStep(0);
  };

  return (
    <Dialog open={showTutorial} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="tutorial-dialog"
        aria-describedby="tutorial-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>{step.title}</DialogTitle>
              <p
                id="tutorial-description"
                className="text-sm text-muted-foreground"
              >
                Шаг {currentStep + 1} из {tutorialSteps.length}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progress} className="h-1 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            data-testid="button-tutorial-prev"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleNext} data-testid="button-tutorial-next">
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Начать работу
              </>
            ) : (
              <>
                Далее
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
