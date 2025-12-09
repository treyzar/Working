import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "@shared/ui/forms/Form";

import { EButtonTypes, EInputTypes } from "@shared/config/enums/enums";
import {
  loginSchema,
  type TAuthSchema,
} from "@shared/types/schemas/authorizaton/authSchema";
import { useLogin } from "@features/authorization/loginAPI";
import "./LoginForm.scss";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
        <Label htmlFor="username">Имя пользователя*</Label>
        <Input
          type={EInputTypes.TEXT}
          className="form-control"
          id="username"
          {...register("username")}
        />
        {errors.username && (
          <span className="error-text">{errors.username.message}</span>
        )}

        <label htmlFor="password">Пароль*</label>
        <Input
          type={EInputTypes.PASSWORD}
          className="form-control"
          id="password"
          {...register("password")}
        />
        {errors.password && (
          <span className="error-text">{errors.password.message}</span>
        )}

        <div className="action-buttons">
          <Button
            type={EButtonTypes.SUBMIT}
            className="btn-primary btn-accent"
            disabled={isPending}
          >
            Войти
          </Button>
          <Button
            onClick={() => navigate("/registration")}
            type={EButtonTypes.BUTTON}
            className="btn-outline-secondary bg-white text-gray-500"
          >
            Регистрация
          </Button>
        </div>
        <Link to="/forgot-password" className="forgot-pass">
          Забыли пароль?
        </Link>
      </Form>
    </div>
  );
};

export default LoginForm;
