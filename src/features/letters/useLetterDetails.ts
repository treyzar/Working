import { useMemo } from "react";
import { useGetLetter } from "./getLetterAPI";
import type { ILetter, IFile } from "../../shared/types/interfaces/interfaces";

export function useLetterDetails(id?: string) {
  const { data, isLoading, refetch, isFetching } = useGetLetter(id);
  const letter = (data as ILetter | undefined) ?? undefined;

  const files = useMemo<IFile[]>(() => {
    const raw: IFile[] = (letter?.files as IFile[]) ?? [];
    return raw.map((f, i) => ({
      ...f,
      id: f?.id ?? i,
      file_name: f?.file_name || `file_${i + 1}`,
      file_size: f?.file_size ?? 0,
      file: f?.file,
      file_type: f?.file_type,
      uploaded_at: f?.uploaded_at,
    }));
  }, [letter]);

  const createdDate =
    letter?.date ??
    (files.length > 0 ? files[0].uploaded_at : undefined) ??
    "—";

  return {
    letter,
    files,
    createdDate,
    isLoading,
    isFetching,
    refetch,
  };
}
