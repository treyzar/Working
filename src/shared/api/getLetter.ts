import apiClient from "./response";

export const getLetter = async (id: string, signal?: AbortSignal) => {
  const { data } = await apiClient.get(`/edo/api/documents/${id}/`, { signal });
  return data;
};
