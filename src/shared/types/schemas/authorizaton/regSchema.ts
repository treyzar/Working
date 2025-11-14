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

    first_name: z.string(),
    last_name: z.string(),
    third_name: z.string().optional(),
    gender: z.enum(["m", "f"], {
      message: "Пол должен быть 'm' или 'f'",
    }),
    birth_date: z
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
    post_job: z.string(),
    departament: z.string(),
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
