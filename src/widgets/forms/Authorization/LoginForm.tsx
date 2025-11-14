import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "@shared/ui/forms/Form";
import CustomInput from "@shared/ui/input/CustomInput";
import CustomButton from "@shared/ui/button/CustomButton";
import CustomNavigateButton from "@shared/ui/button/CustomNavigateButton";
import { EButtonTypes, EInputTypes } from "@shared/config/enums/enums";
import {
  loginSchema,
  type TAuthSchema,
} from "@shared/types/schemas/authorizaton/authSchema";
import { useLogin } from "@features/authorization/loginAPI";
import "./LoginForm.scss";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    setError,
  } = useForm<TAuthSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { username: "", password: "" },
  });

  const { login, isPending } = useLogin(clearErrors, setError);

  const onSubmit = (data: TAuthSchema) => {
    login(data);
  };

  return (
    <div className="login-form-card">
      <h3>Добро пожаловать!</h3>

      {errors.root?.serverError && (
        <div className="error-message">{errors.root.serverError.message}</div>
      )}

      <Form classname="login-form" onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="username">Имя пользователя*</label>
        <CustomInput
          type={EInputTypes.TEXT}
          classname="form-control"
          id="username"
          {...register("username")}
        />
        {errors.username && (
          <span className="error-text">{errors.username.message}</span>
        )}

        <label htmlFor="password">Пароль*</label>
        <CustomInput
          type={EInputTypes.PASSWORD}
          classname="form-control"
          id="password"
          {...register("password")}
        />
        {errors.password && (
          <span className="error-text">{errors.password.message}</span>
        )}

        <div className="action-buttons">
          <CustomButton
            title="Войти"
            type={EButtonTypes.SUBMIT}
            classname="btn-primary"
            disabled={isPending}
          />
          <CustomNavigateButton
            title="Регистрация"
            path="/registration"
            type={EButtonTypes.BUTTON}
            classname="btn-outline-secondary"
          >
            Регистрация
          </CustomNavigateButton>
        </div>

        <a href="#" className="forgot-pass">
          Забыли пароль?
        </a>
      </Form>
    </div>
  );
};

export default LoginForm;
