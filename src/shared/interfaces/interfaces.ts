import type { JSX } from "react";
import type { TRegSchema } from "../schemas/authorizaton/regSchema";
import type { TAuthSchema } from "../schemas/authorizaton/authSchema";
import type { FormHTMLAttributes, ReactNode } from "react";
import type React from "react";
export interface ILoginFormProps {
  title: string;
}

export interface ICustomInputProps {
  type: string;
  classname?: string;
  id: number | string;
  hint?: string;
  label?: string;
  required?: boolean;
}

export interface ICustomButtonProps {
  title?: string;
  type: "submit" | "reset" | "button";
  classname?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export interface ICustomNavigateButtonProps extends ICustomButtonProps {
  children: ReactNode;
  path: string;
}

export interface ICustomNavigateButtonLogoProps
  extends Omit<ICustomNavigateButtonProps, "title"> {
  children: ReactNode;
}
export interface IGenderListProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export interface IPath {
  path: string;
  element: JSX.Element;
}

export interface ICustomResponseProps {
  url: string;
  data: TRegSchema | TAuthSchema;
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  status?: number;
}

export interface IFormProps extends FormHTMLAttributes<HTMLFormElement> {
  classname: string;
  children: ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

export interface IUserProfile {
  id?: string | number;
  first_name: string | undefined;
  last_name: string;
  third_name: string;
  username: string | undefined;
  email: string;
  gender: string;
  birth_date: string;
  phone: string;
  company: string;
  post_job: string;
  extension_number: string;
  departament: string;
  is_staff?: boolean;
}

type Maybe<T> = T | null | undefined;

export interface IExecutor {
  id: number; // делаем обязательным (упростит код)
  username?: Maybe<string>;
  first_name?: Maybe<string>;
  last_name?: Maybe<string>;
  third_name?: Maybe<string>;
  email?: Maybe<string>;
  gender?: Maybe<string>;
  birth_date?: Maybe<string>; // ISO-строка
  phone?: Maybe<string>;
  company?: Maybe<string>;
  post_job?: Maybe<string>;
  extension_number?: Maybe<string>;
  departament?: Maybe<string>; // если именно так приходит из API
  is_staff?: Maybe<boolean>;
  num_documents?: Maybe<number>; // если показываешь бейдж с количеством
}
export interface ICards {
  title: string;
  description: string;
}

export interface IUserMenuProps {
  first_name: string;
  username: string;
  is_staff?: boolean;
}

export interface IUserResponse {
  user: IUserProfile;
}

export interface ProtectedRouteProps {
  redirectPath?: string;
}

export type AppRoute = "/" | "/orders" | "/letters" | "/profile" | "/catalog";

export interface DocumentRow {
  id: number;
  document_number: string;
  date: string;
  recipient: string;
  theme: string;
  executor: string;
  note: string;
  created_by?: { id: number };
}

export interface DataTableResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: DocumentRow[];
}

export type DtSearch = { value: string; regex: boolean };
export type DtOrder = { column: number; dir: "asc" | "desc" };
export type DtColumn = {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: DtSearch;
};

export interface DtServerParams {
  draw: number;
  start: number;
  length: number;
  search: DtSearch;
  order: DtOrder[];
  columns: DtColumn[];
  executor?: string;
  [key: string]: unknown;
}

export type CreateLetterModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCreated?: () => void;
};