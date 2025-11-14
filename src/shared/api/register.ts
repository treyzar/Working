import type { RegisterResponse } from "../types/interfaces/interfaces";
import type { TRegSchema } from "../types/schemas/authorizaton/regSchema";
import apiClient from "./response";
const VITE_URL = import.meta.env.VITE_API_URL;
export async function registerRequest(data: TRegSchema) {
  const res = await apiClient.post<RegisterResponse>(
    `${VITE_URL}/users/api/register/`,
    data
  );
  return res.data;
}
