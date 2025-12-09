import type { ICustomButtonProps } from "@shared/types/interfaces/interfaces";

const CustomButton = ({
  title,
  type,
  classname,
  disabled,
}: ICustomButtonProps) => {
  return (
    <button type={type} className={classname} disabled={disabled}>
      {title}
    </button>
  );
};

export default CustomButton;
