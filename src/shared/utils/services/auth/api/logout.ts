import apiClient from "../../response";
const API_URL = import.meta.env.VITE_API_URL;
export async function logoutFn(payload: { refresh: string }) {
  const res = await apiClient.post(`${API_URL}/users/api/logout/`, payload);
  return res.data as unknown;
}
