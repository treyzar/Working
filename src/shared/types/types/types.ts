import type { TAuthSchema } from "@shared/types";
import type {
  FieldValues,
  FieldPath,
  UseFormClearErrors,
} from "react-hook-form";
import type { ILetter, IFile } from "@shared/types";

export type SetErrorFn = (
  name: keyof TAuthSchema | `root.${string}`,
  error: { type: string; message?: string },
) => void;

export type SetErrorFnReg<T extends FieldValues> = (
  name: FieldPath<T> | `root.${string}`,
  error: { type: string; message?: string },
) => void;

export type CardPropsBase = { key: string; hide?: boolean };
export type InfoCardProps = CardPropsBase & {
  letter?: ILetter;
  createdDate: string;
};
export type ClearErrorsFn<T extends FieldValues> = UseFormClearErrors<T>;
export type FilesCardProps = CardPropsBase & { files: IFile[] };

export type CardConfig =
  | { key: string; component: "info"; props: InfoCardProps }
  | { key: string; component: "files"; props: FilesCardProps };
