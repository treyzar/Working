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
import apiClient from "../../shared/utils/services/response";
import { useNavigate } from "react-router-dom";
import bgImage from "../../images/login/login-bg-new.png";
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
    defaultValues: {
      username: "",
      password: "",
    },
    reValidateMode: "onChange",
  });

  const navigate = useNavigate();

  const onSubmit = async (data: TAuthSchema) => {
    try {
      const response = await apiClient.post(
        "http://127.0.0.1:8000/users/api/login",
        data
      );

      if (response.status === 200) {
        localStorage.setItem("access", response.data.tokens.access);
        localStorage.setItem("refresh", response.data.tokens.refresh);
        navigate("/");
      }
    } catch (error: any) {
      clearErrors();

      if (error.response?.status === 401) {
        const backendErrors = error.response.data;
        for (const [field, messages] of Object.entries(backendErrors)) {
          if (field in loginSchema.shape) {
            if (Array.isArray(messages) && messages.length > 0) {
              setError(field as keyof TAuthSchema, {
                type: "server",
                message: messages[0],
              });
            }
          } else {
            setError("root.serverError", {
              type: "server",
              message: Array.isArray(messages) ? messages[0] : String(messages),
            });
          }
        }
      } else {
        setError("root.serverError", {
          type: "server",
          message: "Не удалось подключиться к серверу. Проверьте соединение.",
        });
      }
    }
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
              />
              <CustomNavigateButton
                title="Регистрация"
                path="/registration"
                type={EButtonTypes.BUTTON}
                classname="btn-outline-secondary"
              />
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
