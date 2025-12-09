import apiClient from "@shared/api/response";

export async function logoutFn(payload: { refresh: string }) {
  const res = await apiClient.post("/users/api/logout/", payload);
  return res.data;
}
