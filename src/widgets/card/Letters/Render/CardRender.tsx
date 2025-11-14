import type { CardConfig } from "@shared/types/types";
import { InfoCard } from "../cards";
import { FilesCard } from "../Files/FilesCard";
export function CardRenderer({ cards }: { cards: CardConfig[] }) {
  return (
    <>
      {cards.map((c) => {
        if ("component" in c) {
          if (c.component === "info")
            return <InfoCard {...c.props} key={c.key} />;
          if (c.component === "files")
            return <FilesCard {...c.props} key={c.key} />;
        }
        return null;
      })}
    </>
  );
}
