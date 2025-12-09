import type { ICustomInputProps } from "@shared/types/interfaces/interfaces";

const CustomInput = ({ type, classname, id, ...props }: ICustomInputProps) => {
  return <input type={type} className={classname} id={id} {...props} />;
};

export default CustomInput;
