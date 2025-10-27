import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  setAccessToken,
  setRefreshToken,
} from "../../shared/utils/services/response";
import type { TAuthSchema } from "../../shared/schemas/authorizaton/authSchema";
import { loginSchema } from "../../shared/schemas/authorizaton/authSchema";
import type { SetErrorFn } from "../../shared/types/types";
import { loginFn } from "../../shared/utils/services/auth/login";

export const useLogin = (clearErrors: () => void, setError: SetErrorFn) => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (values: TAuthSchema) => loginFn(values),
    onSuccess: (data) => {
      setAccessToken(data.tokens.access);
      setRefreshToken(data.tokens.refresh);
      navigate("/");
    },
    onError: (error: any) => {
      clearErrors();

      const status = error?.response?.status;
      const backendErrors = error?.response?.data;

      if (status === 401 && backendErrors) {
        Object.entries(backendErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);

          if (field in (loginSchema as any).shape) {
            setError(field as keyof TAuthSchema, {
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
          message: "Не удалось подключиться к серверу. Проверьте соединение.",
        });
      }
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
};
