import { z } from "zod";

const ALLOWED_EXT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
];
const MAX_MB = 10;

const isAllowedExt = (name: string) =>
  ALLOWED_EXT.some((ext) => name.toLowerCase().endsWith(ext));

export const letterSchema = z.object({
  date: z.string().min(1, "Укажите дату"),
  recipient: z.string().min(1, "Укажите получателя"),
  theme: z.string().min(1, "Укажите тему"),
  executor: z
    .number({ error: "Выберите исполнителя" })
    .positive("Выберите исполнителя"),
  note: z.string().optional(),
  files: z
    .array(
      z.object({
        id: z.string(),
        error: z.string().nullish(),
        file: z.custom<File>((v) => v instanceof File, "Некорректный файл"),
      })
    )
    .min(1, "Добавьте хотя бы один файл")
    .refine(
      (items) => items.every((i) => !i.error),
      "Есть файлы, не прошедшие проверку"
    )
    .refine(
      (items) => items.every((i) => isAllowedExt(i.file.name)),
      `Допустимые форматы: ${ALLOWED_EXT.join(", ")}`
    )
    .refine(
      (items) => items.every((i) => i.file.size <= MAX_MB * 1024 * 1024),
      `Файл слишком большой. Максимум ${MAX_MB} МБ`
    ),
});

export type TLetterForm = z.infer<typeof letterSchema>;
