import type { TAuthSchema } from "../schemas/authorizaton/authSchema";
import type {
  FieldValues,
  FieldPath,
  UseFormClearErrors,
} from "react-hook-form";
export type SetErrorFn = (
  name: keyof TAuthSchema | "root.serverError",
  error: { type: string; message?: string }
) => void;

export type SetErrorFnReg<T extends FieldValues> = (
  name: FieldPath<T> | `root.${string}`,
  error: { type: string; message?: string }
) => void;

export type ClearErrorsFn<T extends FieldValues> = UseFormClearErrors<T>;
