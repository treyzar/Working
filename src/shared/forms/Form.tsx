import type { IFormProps } from "../interfaces/interfaces";

const Form = ({ children, classname, ...props }: IFormProps) => {
  return (
    <form className={classname} {...props}>
      {children}
    </form>
  );
};

export default Form;
