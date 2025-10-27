import type { TRegSchema } from "../../../schemas/authorizaton/regSchema";
import apiClient from "../response";
const VITE_URL = import.meta.env.VITE_API_URL;
export async function registerRequest(data: TRegSchema) {
  const res = await apiClient.post(`${VITE_URL}/users/api/register/`, data);
  return res.data;
}
