import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { IUserAdmin } from "@/shared/types/interfaces/interfaces";
import { fetchIsAdmin } from "@/shared/api/getAdminUser";

export function useIsAdmin() {
  return useQuery<IUserAdmin, AxiosError>({
    queryKey: ["auth", "is-admin"],
    queryFn: ({ signal }) => fetchIsAdmin(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, err) => {
      const status = (err as any)?.response?.status ?? (err as any)?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}
