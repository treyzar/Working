import type { TAuthSchema } from "../../../schemas/authorizaton/authSchema";
import apiClient from "../response";
const API_URL = import.meta.env.VITE_API_URL;
export const loginFn = async (data: TAuthSchema) => {
  const res = await apiClient.post(`${API_URL}/users/api/login`, data);
  return res.data as { tokens: { access: string; refresh: string } };
};
