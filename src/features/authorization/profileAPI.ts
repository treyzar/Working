// src/features/authorization/profileAPI.ts
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import apiClient, {
  getAccessToken,
  normalizeProfile,
} from "@shared/api/response";
import { isAuthPath } from "@shared/lib/utils/services/helpers/authHelpers";
import type { IUserProfile } from "@shared/types/interfaces/interfaces";

type RawProfile = IUserProfile | { user: IUserProfile };

export async function profileFn(signal?: AbortSignal): Promise<IUserProfile> {
  const { data } = await apiClient.get<RawProfile>(
    "/users/api/profile/default/",
    { signal }
  );
  return normalizeProfile(data);
}

export function useProfile(opts?: { enabled?: boolean }) {
  const hasToken = Boolean(getAccessToken());
  const onAuth = isAuthPath(window.location.pathname);

  return useQuery<IUserProfile, AxiosError>({
    queryKey: ["profile"],
    enabled: hasToken && !onAuth && (opts?.enabled ?? true),
    queryFn: ({ signal }) => profileFn(signal),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // держим предыдущее значение для анти-мерцания
    retry: (fails, err) => {
      const s = err?.response?.status;
      if (s === 401 || s === 403) return false;
      return fails < 2;
    },
  });
}
