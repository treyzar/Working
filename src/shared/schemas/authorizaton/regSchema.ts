import { z } from "zod";

export const regSchema = z
  .object({
    username: z
      .string()
      .min(5, "Обязательное поле")
      .max(150, "Не более 150 символов")
      .regex(/^[a-zA-Z0-9@.+_-]+$/, "Только буквы, цифры и символы @ . + - _"),
    email: z
      .string()
      .min(1, "Обязательное поле.")
      .email("Введите правильный адрес электронной почты."),

    name: z.string(),
    surname: z.string(),
    middle_name: z.string().optional(),
    gender: z.enum(["male", "female"], {
      message: "Пол должен быть 'male' или 'female'",
    }),
    date: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val || val === "") return true;

          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;

          const date = new Date(val);
          return (
            !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === val
          );
        },
        {
          message: "Некорректная дата. Используйте формат ГГГГ-ММ-ДД",
        }
      ),
    position: z.string(),
    department: z.string(),
    password: z
      .string()
      .min(1, "Обязательное поле.")
      .max(100, "Пароль слишком длинный"),
    password_confirm: z
      .string()
      .min(1, "Обязательное поле.")
      .max(100, "Пароль слишком длинный"),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Введенные пароли не совпадают.",
    path: ["password_confirm"],
  });

export type TRegSchema = z.infer<typeof regSchema>;
