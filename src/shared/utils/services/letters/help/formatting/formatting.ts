import type { IExecutor } from "../../../../../interfaces/interfaces";
export const formatExecutor = (
  ex?: IExecutor | string | null
): string | null => {
  if (!ex) return null;
  if (typeof ex === "string") return ex;

  const fio = [ex.last_name, ex.first_name, ex.third_name]
    .filter(Boolean)
    .join(" ");
  const main = fio || ex.username || ex.email;
  const role = ex.post_job;
  const parts = [main, role].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

export const formatSize = (size?: number) =>
  typeof size === "number" && size > 0 ? `${(size / 1024).toFixed(2)} KB` : "—";
