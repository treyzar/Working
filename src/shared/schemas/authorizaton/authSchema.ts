import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Обязательное поле."),
  password: z
    .string()
    .min(1, "Обязательное поле.")
    .max(100, "Пароль слишком длинный"),
});

export type TAuthSchema = z.infer<typeof loginSchema>;
