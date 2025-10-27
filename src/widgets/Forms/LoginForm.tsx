import { EButtonTypes, EInputTypes } from "../../shared/enums/enums";
import Form from "../../shared/forms/Form";
import CustomInput from "../../shared/input/CustomInput";
import CustomNavigateButton from "../../shared/button/CustomNavigateButton";
import CustomButton from "../../shared/button/CustomButton";
import { useForm } from "react-hook-form";
import {
  loginSchema,
  type TAuthSchema,
} from "../../shared/schemas/authorizaton/authSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import bgImage from "../../images/login/login-bg-new.png";
import "./LoginForm.scss";
import { useLogin } from "../../features/authorization/loginAPI";

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
    defaultValues: {
      username: "",
      password: "",
    },
    reValidateMode: "onChange",
  });
  const { login, isPending } = useLogin(clearErrors, setError);

  const onSubmit = async (data: TAuthSchema) => {
    login(data);
  };

  return (
    <div className="login-page">
      <div className="login-page__left">
        <img
          src={bgImage}
          alt="Фоновая картинка"
          className="login-page__bg-image"
        />
      </div>

      <div className="login-page__right">
        <div className="login-page__form-block">
          <h3>Добро пожаловать!</h3>

          {errors.root?.serverError && (
            <div className="error-message">
              {errors.root.serverError.message}
            </div>
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
      </div>
    </div>
  );
};

export default LoginForm;
