import type { ICustomButtonProps } from "../interfaces/interfaces";
const CustomButton = ({
  title,
  type,
  classname,
  disabled
}: ICustomButtonProps) => {
  return (
    <button type={type} className={classname} disabled={disabled}>
      {title}
    </button>
  );
};

export default CustomButton;
