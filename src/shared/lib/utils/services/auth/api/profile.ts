import apiClient from "@shared/api/response";
import type { IUserProfile, IUserResponse } from "@shared/types";
const API_URL = import.meta.env.VITE_API_URL;
export async function profileFn(signal?: AbortSignal): Promise<IUserProfile> {
  const { data } = await apiClient.get<IUserResponse>(
    `${API_URL}/users/api/profile/default/`,
    { signal },
  );
  return data.user;
}
