// shared/utils/download.ts
import axios from "axios";

function filenameFromContentDisposition(cd?: string | null) {
  if (!cd) return null;
  const utf = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf?.[1]) return decodeURIComponent(utf[1]);
  const ascii =
    cd.match(/filename\s*=\s*"([^"]+)"/i) ||
    cd.match(/filename\s*=\s*([^;]+)/i);
  return ascii?.[1]?.trim() || null;
}

export async function downloadByUrl(
  url: string,
  fallbackName = "file",
  onProgress?: (pct: number) => void
) {
  const res = await axios.get(url, {
    responseType: "blob",
    onDownloadProgress: (e) => {
      if (onProgress && e.total)
        onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  const cd = res.headers["content-disposition"] as string | undefined;
  const name =
    filenameFromContentDisposition(cd) ||
    fallbackName ||
    url.split("/").filter(Boolean).pop() ||
    "file";

  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function downloadFileById(
  id: number | string,
  fallbackName?: string,
  onProgress?: (pct: number) => void
) {
  return downloadByUrl(`/api/files/${id}/download/`, fallbackName, onProgress);
}
