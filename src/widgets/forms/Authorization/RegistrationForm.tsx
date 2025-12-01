import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Form from "@shared/ui/forms/Form";
import { EButtonTypes } from "@shared/config/enums/enums";
import { Link, useNavigate } from "react-router-dom";

import GenderList from "@widgets/list/GenderList/gendersList";

import {
  regSchema,
  type TRegSchema,
} from "@shared/types/schemas/authorizaton/regSchema";
import { useRegister } from "@features/authorization/registerAPI";

import "./RegistrationForm.scss";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/button";

const RegistrationForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setError,
    clearErrors,
  } = useForm<TRegSchema>({
    resolver: zodResolver(regSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      first_name: "",
      username: "",
      last_name: "",
      third_name: "",
      gender: "m",
      birth_date: "",
      post_job: "",
      departament: "",
      password: "",
      password_confirm: "",
    },
  });
  const { registerUser, isPending } = useRegister(clearErrors, setError);
  const navigate = useNavigate();
  const onSubmit = (data: TRegSchema) => {
    registerUser(data);
  };

  return (
    <div className="registration-form-card">
      <h3>Создать аккаунт</h3>

      {errors.root?.serverError && (
        <div className="error-message">{errors.root.serverError.message}</div>
      )}

      <Form classname="registration-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="username">Имя пользователя*</Label>
            <Input
              id="username"
              type="text"
              className="form-control"
              {...register("username")}
            />
            {errors.username && (
              <span className="error-text">{errors.username.message}</span>
            )}
            <span className="hint">
              Обязательное поле. Не более 150 символов. Только буквы, цифры и
              символы @/./+/-/_.
            </span>
          </div>

          <div className="form-group">
            <Label htmlFor="email">Электронная почта*</Label>
            <Input
              id="email"
              type="email"
              className="form-control"
              {...register("email")}
            />
            {errors.email && (
              <span className="error-text">{errors.email.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              type="text"
              className="form-control"
              {...register("first_name")}
            />
            {errors.first_name && (
              <span className="error-text">{errors.first_name.message}</span>
            )}
          </div>

          <div className="form-group">
            <Label htmlFor="surname">Фамилия</Label>
            <Input
              id="surname"
              type="text"
              className="form-control"
              {...register("last_name")}
            />
            {errors.last_name && (
              <span className="error-text">{errors.last_name.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="middle_name">Отчество</Label>
            <Input
              id="middle_name"
              type="text"
              className="form-control"
              {...register("third_name")}
            />
            {errors.third_name && (
              <span className="error-text">{errors.third_name.message}</span>
            )}
          </div>

          <div className="form-group">
            <Label htmlFor="gender">Пол</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <GenderList
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="form-control"
                />
              )}
            />
            {errors.gender && (
              <span className="error-text">{errors.gender.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="date">Дата рождения</Label>
            <Input
              id="date"
              type="text"
              className="form-control"
              {...register("birth_date")}
            />
            <span className="hint">YYYY-MM-DD</span>
            {errors.birth_date && (
              <span className="error-text">{errors.birth_date.message}</span>
            )}
          </div>

          <div className="form-group">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              type="text"
              className="form-control"
              {...register("post_job")}
            />
            {errors.post_job && (
              <span className="error-text">{errors.post_job.message}</span>
            )}
          </div>
        </div>

        <div className="form-row full-width">
          <div className="form-group">
            <Label htmlFor="department">Подразделение</Label>
            <Input
              id="department"
              type="text"
              className="form-control"
              {...register("departament")}
            />
            {errors.departament && (
              <span className="error-text">{errors.departament.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <Label htmlFor="password">Пароль*</Label>
            <Input
              id="password"
              type="password"
              className="form-control"
              {...register("password")}
            />
            {errors.password && (
              <span className="error-text">{errors.password.message}</span>
            )}
            <ul className="password-hints">
              <li>
                Пароль не должен быть слишком похож на другую вашу личную
                информацию.
              </li>
              <li>Ваш пароль должен содержать как минимум 8 символов.</li>
              <li>Пароль не должен быть слишком простым и распространенным.</li>
              <li>Пароль не может состоять только из цифр.</li>
            </ul>
          </div>

          <div className="form-group">
            <Label htmlFor="password_confirm">Подтверждение пароля*</Label>
            <Input
              id="password_confirm"
              type="password"
              className="form-control"
              {...register("password_confirm")}
            />
            {errors.password_confirm && (
              <span className="error-text">
                {errors.password_confirm.message}
              </span>
            )}
            <span className="hint">
              Для подтверждения введите, пожалуйста, пароль ещё раз.
            </span>
          </div>
        </div>

        <div className="action-buttons">
          <Button
            type={EButtonTypes.SUBMIT}
            className="btn-primary"
            disabled={isPending}
          >
            Зарегистрироваться
          </Button>
          <Button
            onClick={() => navigate("/login")}
            type={EButtonTypes.BUTTON}
            className="btn-outline-secondary"
          >
            Войти
          </Button>
        </div>

        <Link to="/forgot-password" className="forgot-pass">
          Забыли пароль?
        </Link>
      </Form>
    </div>
  );
};

export default RegistrationForm;
