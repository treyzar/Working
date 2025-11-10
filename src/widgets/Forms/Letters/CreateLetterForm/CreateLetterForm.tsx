import Form from "../../../../shared/forms/Form";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TLetterForm } from "../../../../shared/schemas/letters/addLetterSchema";
import { letterSchema } from "../../../../shared/schemas/letters/addLetterSchema";
import { RiCalendar2Line, RiUser3Line, RiChat3Line } from "react-icons/ri";
import type { FileItem } from "../../../../shared/fileDropzone/FileDropzone";
import FileDropZone from "../../../../shared/fileDropzone/FileDropzone";
import { useGetExecutorUsers } from "../../../../features/users/getExecutorUsersAPI";
import { useCreateLetter } from "../../../../features/letters/createLetterAPI";
import "./CreateLetterForm.scss";
const CreateLetterForm = ({
  open,
  onCreated,
  setOpen,
}: {
  open: boolean;
  onCreated?: () => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    setError,
  } = useForm<TLetterForm>({
    resolver: zodResolver(letterSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      recipient: "",
      theme: "",
      executor: 0,
      note: "",
      files: [],
    },
    mode: "onTouched",
  });
  const { mutate } = useCreateLetter();
  const { data: executors = [] } = useGetExecutorUsers(open);
  const onSubmit = (values: TLetterForm) => {
    clearErrors();
    mutate(values, {
      onSuccess: () => {
        onCreated?.();
        reset();
        setOpen(false);
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        const backend = err?.response?.data as
          | Record<string, string | string[]>
          | undefined;

        if (status === 400 && backend) {
          Object.entries(backend).forEach(([field, messages]) => {
            const msg = Array.isArray(messages)
              ? messages[0]
              : String(messages);
            if (field in (letterSchema as any).shape) {
              setError(field as keyof TLetterForm, {
                type: "server",
                message: msg,
              });
            } else {
              setError("files", { type: "server", message: msg });
            }
          });
          return;
        }

        setError("files", {
          type: "server",
          message: "Не удалось отправить документ. Попробуйте позже.",
        });
      },
    });
  };
  return (
    <Form
      id="create-letter-form"
      classname="edo-form form-grid grid-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <div className="field-label">Дата</div>
        <div className="input-shell">
          <div className="input-icon">
            <RiCalendar2Line />
          </div>
          <input type="date" aria-label="Дата" {...register("date")} />
        </div>
        {errors.date && <div className="error-text">{errors.date.message}</div>}
      </div>

      <div>
        <div className="field-label">Получатель</div>
        <div className="input-shell">
          <div className="input-icon">
            <RiUser3Line />
          </div>
          <input
            type="text"
            placeholder="Укажите получателя"
            {...register("recipient")}
          />
        </div>
        {errors.recipient && (
          <div className="error-text">{errors.recipient.message}</div>
        )}
      </div>

      <div className="col-span-2">
        <div className="field-label">Тема</div>
        <div className="input-shell">
          <div className="input-icon">
            <RiChat3Line />
          </div>
          <input
            type="text"
            placeholder="Укажите тему документа"
            {...register("theme")}
          />
        </div>
        {errors.theme && (
          <div className="error-text">{errors.theme.message}</div>
        )}
      </div>

      <div className="col-span-2">
        <div className="field-label">Исполнитель</div>
        <div className="input-shell">
          <div className="input-icon">
            <RiUser3Line />
          </div>
          <select
            {...register("executor", { valueAsNumber: true })}
            defaultValue={0}
          >
            <option value={0}>Выберите исполнителя</option>
            {executors.map((x) => (
              <option key={x.id} value={x.id}>
                {x.username}
              </option>
            ))}
          </select>
        </div>
        {errors.executor && (
          <div className="error-text">{errors.executor.message}</div>
        )}
      </div>

      <div className="col-span-2">
        <div className="field-label">Заметки</div>
        <div className="input-shell">
          <div className="input-icon">
            <RiChat3Line />
          </div>
          <textarea
            placeholder="Дополнительные заметки (необязательно)"
            {...register("note")}
          />
        </div>
        {errors.note && <div className="error-text">{errors.note.message}</div>}
      </div>

      <div className="col-span-2">
        <div className="field-label">Файлы</div>
        <Controller
          control={control}
          name="files"
          render={({ field }) => (
            <>
              <FileDropZone
                value={field.value as FileItem[]}
                onChange={field.onChange}
                className="mt-1"
              />
              {errors.files && (
                <div className="error-text">
                  {errors.files.message as string}
                </div>
              )}
            </>
          )}
        />
      </div>
    </Form>
  );
};

export default CreateLetterForm;
