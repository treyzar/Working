import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { profileFn } from "../../shared/utils/services/auth/profile";
import { getAccessToken } from "../../shared/utils/services/response";
import type { IUserProfile } from "../../shared/interfaces/interfaces";

export function useProfile(opts?: { enabled?: boolean }) {
  const hasToken = Boolean(getAccessToken());

  return useQuery<IUserProfile, AxiosError>({
    queryKey: ["profile"],
    enabled: hasToken && (opts?.enabled ?? true),
    queryFn: ({ signal }) => profileFn(signal),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (fails, err) => {
      const s = err?.response?.status;
      if (s === 401 || s === 403) return false;
      return fails < 2;
    },
  });
}
