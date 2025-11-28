import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getLetter } from "@shared/api/getLetter";

export const useGetLetter = (id?: string) =>
  useQuery<unknown, AxiosError>({
    queryKey: ["letter", id],
    queryFn: ({ signal }) => getLetter(id!, signal),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
