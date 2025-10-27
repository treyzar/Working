import apiClient from "../response";
import type { TLetterForm } from "../../../schemas/letters/addLetterSchema";
type BackendResponse = unknown;

export async function createLetterRequest(
  values: TLetterForm
): Promise<BackendResponse> {
  const API_URL = import.meta.env.VITE_API_URL;
  const fd = new FormData();
  fd.append("date", values.date);
  fd.append("recipient", values.recipient);
  fd.append("theme", values.theme);
  fd.append("executor", String(values.executor));
  if (values.note) fd.append("note", values.note);

  values.files
    .filter((x) => !x.error)
    .forEach((x) => fd.append("files", x.file));

  const { data } = await apiClient.post(`${API_URL}/edo/api/documents/`, fd);
  return data;
}
