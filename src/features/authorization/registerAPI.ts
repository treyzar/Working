// features/authorization/useRegister.ts
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { TRegSchema } from "../../shared/schemas/authorizaton/regSchema";
import { regSchema } from "../../shared/schemas/authorizaton/regSchema";
import { registerRequest } from "../../shared/utils/services/auth/api/register";
import {
  setAccessToken,
  setRefreshToken,
} from "../../shared/utils/services/response";
import type { ClearErrorsFn, SetErrorFnReg } from "../../shared/types/types";

export function useRegister(
  clearErrors: ClearErrorsFn<TRegSchema>,
  setError: SetErrorFnReg<TRegSchema>
) {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (values: TRegSchema) => registerRequest(values),
    onSuccess: (data) => {
      if (data?.tokens) {
        setAccessToken(data.tokens.access);
        setRefreshToken(data.tokens.refresh);
      }
      navigate("/");
    },
    onError: (error: any) => {
      clearErrors();

      const status = error?.response?.status;
      const backendErrors = error?.response?.data as
        | Record<string, unknown>
        | undefined;

      if (status === 400 && backendErrors) {
        Object.entries(backendErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages)
            ? String(messages[0])
            : String(messages);

          if (field in (regSchema as any).shape) {
            setError(field as keyof TRegSchema, {
              type: "server",
              message: msg,
            });
          } else {
            setError("root.serverError", { type: "server", message: msg });
          }
        });
      } else {
        setError("root.serverError", {
          type: "server",
          message: "Не удалось подключиться к серверу.",
        });
      }
    },
  });

  return {
    registerUser: mutation.mutate,
    registerUserAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
}
