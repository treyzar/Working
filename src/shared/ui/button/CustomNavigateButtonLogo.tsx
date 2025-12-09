import { useNavigate } from "react-router-dom";
import type { ICustomNavigateButtonLogoProps } from "@shared/types/interfaces/interfaces";

const CustomNavigateButtonLogo = ({
  path,
  classname,
  children,
}: ICustomNavigateButtonLogoProps) => {
  const navigate = useNavigate();
  return (
    <button className={classname} onClick={() => navigate(path)}>
      {children}
    </button>
  );
};

export default CustomNavigateButtonLogo;
