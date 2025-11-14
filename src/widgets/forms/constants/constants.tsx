import { EInputTypes } from "@shared/config/enums/enums";
import type { ICustomInputProps } from "@shared/types/interfaces/interfaces";
export const CInputs: ICustomInputProps[] = [
  {
    id: "username",
    type: EInputTypes.TEXT,
    label: "Имя пользователя",
    hint: "Обязательное поле. Не более 150 символов. Только буквы, цифры и символы @/./+/-/_.",
    required: true,
  },
  {
    id: "email",
    type: EInputTypes.EMAIL,
    label: "Электронная почта*",
    required: true,
  },
  { id: "name", type: EInputTypes.TEXT, label: "Имя" },
  { id: "surname", type: EInputTypes.TEXT, label: "Фамилия" },
  { id: "middle_name", type: EInputTypes.TEXT, label: "Отчество" },
  { id: "date", type: EInputTypes.TEXT, label: "Дата рождения" },
  { id: "position", type: EInputTypes.TEXT, label: "Должность" },
  { id: "department", type: EInputTypes.TEXT, label: "Подразделение" },
  {
    id: "password",
    type: EInputTypes.PASSWORD,
    label: "Пароль*",
    hint: "Пароль не должен быть слишком похож на другую вашу личную информацию.\nВаш пароль должен содержать как минимум 8 символов.\nПароль не должен быть слишком простым и распространенным.\nПароль не может состоять только из цифр.",
    required: true,
  },
  {
    id: "password_confirm",
    type: EInputTypes.PASSWORD,
    label: "Подтверждение пароля*",
    hint: "Для подтверждения введите, пожалуйста, пароль ещё раз.",
    required: true,
  },
] as const;
