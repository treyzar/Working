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
  id: any;
  hint?: string;
  label?: string;
  required?: boolean;
}

export interface ICustomButtonProps {
  title: string;
  type: "submit" | "reset" | "button";
  classname?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export interface ICustomNavigateButtonProps extends ICustomButtonProps {
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
}

export interface IUserProfile {
  id: string | number | undefined;
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

export interface ICards {
  title: string;
  description: string;
}

export interface IUserMenuProps
  extends Omit<
    IUserProfile,
    | "id"
    | "last_name"
    | "email"
    | "third_name"
    | "gender"
    | "birth_date"
    | "phone"
    | "company"
    | "post_job"
    | "extension_number"
    | "departament"
  > {}

export interface IUserResponse {
  user: IUserProfile;
}

export interface ProtectedRouteProps {
  redirectPath?: string;
}

export type AppRoute = "/" | "/orders" | "/letters" | "/profile" | "/catalog";
