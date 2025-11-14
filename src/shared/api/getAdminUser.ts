import { AxiosError } from "axios";
import type { IUserAdmin } from "@/shared/types/interfaces/interfaces";
import apiClient from "./response";

const API_URL = import.meta.env.VITE_API_URL as string;

export async function fetchIsAdmin(signal?: AbortSignal): Promise<IUserAdmin> {
  const access = localStorage.getItem("access");
  if (!access) {
    const err = new AxiosError("No access token", "ERR_NO_TOKEN");
    (err as any).status = 401;
    throw err;
  }

  const res = await apiClient.get<IUserAdmin>(`${API_URL}/api/auth/is-admin`, {
    headers: { Authorization: `Bearer ${access}` },
    signal,
  });

  return res.data;
}
