import type { IFormProps } from "../interfaces/interfaces";

const Form = ({ children, classname, onSubmit, ...props }: IFormProps) => {
  return (
    <form
      className={classname}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      {children}
    </form>
  );
};

export default Form;
