import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLetterRequest } from "@shared/api/createLetter";
import type { TLetterForm } from "@shared/types/schemas/letters/addLetterSchema";

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
