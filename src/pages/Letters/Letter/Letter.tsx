import { useParams } from "react-router-dom";

const Letter = () => {
  const params = useParams();
  return <div>{params.id}</div>;
};

export default Letter;
