import type { ICustomNavigateButtonProps } from "../interfaces/interfaces";
import { useNavigate } from "react-router-dom";

const CustomNavigateButton = ({
  path,
  classname,
  type,
  children,
}: ICustomNavigateButtonProps) => {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(path)} className={classname} type={type}>
      {children}
    </button>
  );
};

export default CustomNavigateButton;
