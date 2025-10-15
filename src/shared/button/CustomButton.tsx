import type { ICustomButtonProps } from "../interfaces/interfaces";
const CustomButton = ({ title, type, classname }: ICustomButtonProps) => {
  return (
    <button type={type} className={classname}>
      {title}
    </button>
  );
};

export default CustomButton;
