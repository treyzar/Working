import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLetterRequest } from "../../shared/utils/services/letters/createLetter";
import type { TLetterForm } from "../../shared/schemas/letters/addLetterSchema";

export function useCreateLetter() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["letters", "create"],
    mutationFn: (payload: TLetterForm) => createLetterRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["letters"] });
    },
  });
}
