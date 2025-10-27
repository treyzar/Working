import apiClient from "../response";
import type { IExecutor } from "../../../interfaces/interfaces";

type Paginated<T> = { results?: T[] };
const API_URL = import.meta.env.VITE_API_URL;
export async function getExecutorUsers(
  signal?: AbortSignal
): Promise<IExecutor[]> {
  const { data } = await apiClient.get<IExecutor[] | Paginated<IExecutor>>(
    `${API_URL}/edo/api/users/`,
    { signal }
  );
  return Array.isArray(data) ? data : data.results ?? [];
}
