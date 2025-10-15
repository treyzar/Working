import type { ICustomNavigateButtonProps } from "../interfaces/interfaces";
import { useNavigate } from "react-router-dom";

const CustomNavigateButton = ({
  title,
  path,
  classname,
  style,
  type,
}: ICustomNavigateButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={classname}
      style={style}
      type={type}
    >
      {title}
    </button>
  );
};

export default CustomNavigateButton;
