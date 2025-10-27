import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getExecutorUsers } from "../../shared/utils/services/users/getExecutorUsers";
import type { IExecutor } from "../../shared/interfaces/interfaces";

export function useGetExecutorUsers(enabled = true) {
  return useQuery<IExecutor[], AxiosError>({
    queryKey: ["users", "executors"],
    queryFn: ({ signal }) => getExecutorUsers(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
