import { useParams } from "react-router-dom";
import { useGetLetter } from "../../../features/letters/getLetterAPI";

const Letter = () => {
  const { id } = useParams<"id">();
  const { data, isLoading } = useGetLetter(id);

  if (!id) return null;
  if (isLoading) return <div>Загрузка…</div>;

  const letter = data;
  console.log(letter);

  return <div>{id}</div>;
};
export default Letter;
