import type { ILetter, IFile } from "../../../../shared/interfaces/interfaces";
import type { CardConfig } from "../../../../shared/types/types";
export function buildCards(params: {
  letter?: ILetter;
  createdDate: string;
  files: IFile[];
}): CardConfig[] {
  const { letter, createdDate, files } = params;

  return [
    {
      key: "info",
      component: "info",
      props: { key: "info", letter, createdDate },
    },
    {
      key: "files",
      component: "files",
      props: { key: "files", files },
    },
  ];
}
