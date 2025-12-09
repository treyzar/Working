import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { setAccessToken, setRefreshToken } from "@shared/api/response";
import type { TAuthSchema } from "@shared/types/schemas/authorizaton/authSchema";
import { loginSchema } from "@shared/types/schemas/authorizaton/authSchema";
import type { SetErrorFn } from "@shared/types/types";
import { loginFn } from "@shared/api/login";

interface BackendErrors {
  [key: string]: string | string[];
}

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
    onError: (error: AxiosError<BackendErrors>) => {
      clearErrors();

      const status = error.response?.status;
      const backendErrors = error.response?.data;

      if (status === 401 && backendErrors) {
        Object.entries(backendErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          const schemaShape = loginSchema.shape as Record<string, unknown>;

          if (field in schemaShape) {
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
