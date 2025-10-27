import { useMutation } from "@tanstack/react-query";
import { logoutFn } from "../../shared/utils/services/auth/logout";
import { useNavigate } from "react-router-dom";
import {
  clearTokens,
  getRefreshToken,
} from "../../shared/utils/services/response";

export const useLogout = () => {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: async () => {
      const refresh = getRefreshToken();
      if (!refresh) {
        return null;
      }
      const data = { refresh: refresh };
      return logoutFn(data);
    },
    onSettled: () => {
      clearTokens();
      navigate("/login");
    },
  });
  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
};
