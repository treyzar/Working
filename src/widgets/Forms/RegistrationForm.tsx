import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "../../shared/button/CustomButton";
import CustomNavigateButton from "../../shared/button/CustomNavigateButton";
import { EButtonTypes } from "../../shared/enums/enums";
import Form from "../../shared/forms/Form";
import { Controller } from "react-hook-form";
import {
  regSchema,
  type TRegSchema,
} from "../../shared/schemas/authorizaton/regSchema";
import CustomInput from "../../shared/input/CustomInput";
import GenderList from "../List/GenderList/gendersList";
import apiClient from "../../shared/utils/services/response";
import { useNavigate } from "react-router-dom";
import bgImage from "../../images/login/login-bg-new.png";
import "./RegistrationForm.scss";

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
    defaultValues: {
      email: "",
      name: "",
      username: "",
      surname: "",
      middle_name: "",
      gender: "male",
      date: "",
      position: "",
      department: "",
      password: "",
      password_confirm: "",
    },
    reValidateMode: "onChange",
  });

  const register_url = import.meta.env.VITE_REG_URL;
  const navigate = useNavigate();

  const onSubmit = async (data: TRegSchema) => {
    try {
      const response = await apiClient.post(register_url, data);
      if (response.status === 201) {
        localStorage.setItem("access", response.data.tokens.access);
        localStorage.setItem("refresh", response.data.tokens.refresh);
        navigate("/");
      }
    } catch (error: any) {
      clearErrors();
      if (error.response?.status === 400) {
        const backendErrors = error.response.data;

        for (const [field, messages] of Object.entries(backendErrors)) {
          if (field in regSchema.shape) {
            if (Array.isArray(messages) && messages.length > 0) {
              setError(field as keyof TRegSchema, {
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
      }
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-page__left">
        <img
          src={bgImage}
          alt="Фоновая картинка"
          className="registration-page__bg-image"
        />
      </div>

      <div className="registration-page__right">
        <div className="registration-page__form-block">
          <h3>Создать аккаунт</h3>

          {errors.root?.serverError && (
            <div className="error-message">
              {errors.root.serverError.message}
            </div>
          )}

          <Form classname="registration-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Имя пользователя*</label>
                <CustomInput
                  id="username"
                  type="text"
                  classname="form-control"
                  {...register("username")}
                />
                {errors.username && (
                  <span className="error-text">{errors.username.message}</span>
                )}
                <span className="hint">
                  Обязательное поле. Не более 150 символов. Только буквы, цифры
                  и символы @/./+/-/_.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="email">Электронная почта*</label>
                <CustomInput
                  id="email"
                  type="email"
                  classname="form-control"
                  {...register("email")}
                />
                {errors.email && (
                  <span className="error-text">{errors.email.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Имя</label>
                <CustomInput
                  id="name"
                  type="text"
                  classname="form-control"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="error-text">{errors.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="surname">Фамилия</label>
                <CustomInput
                  id="surname"
                  type="text"
                  classname="form-control"
                  {...register("surname")}
                />
                {errors.surname && (
                  <span className="error-text">{errors.surname.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="middle_name">Отчество</label>
                <CustomInput
                  id="middle_name"
                  type="text"
                  classname="form-control"
                  {...register("middle_name")}
                />
                {errors.middle_name && (
                  <span className="error-text">
                    {errors.middle_name.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="gender">Пол</label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <GenderList
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
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
                <label htmlFor="date">Дата рождения</label>
                <CustomInput
                  id="date"
                  type="text"
                  classname="form-control"
                  {...register("date")}
                />
                <span className="hint">YYYY-MM-DD</span>
                {errors.date && (
                  <span className="error-text">{errors.date.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="position">Должность</label>
                <CustomInput
                  id="position"
                  type="text"
                  classname="form-control"
                  {...register("position")}
                />
                {errors.position && (
                  <span className="error-text">{errors.position.message}</span>
                )}
              </div>
            </div>

            <div className="form-row full-width">
              <div className="form-group">
                <label htmlFor="department">Подразделение</label>
                <CustomInput
                  id="department"
                  type="text"
                  classname="form-control"
                  {...register("department")}
                />
                {errors.department && (
                  <span className="error-text">
                    {errors.department.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Пароль*</label>
                <CustomInput
                  id="password"
                  type="password"
                  classname="form-control"
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
                  <li>
                    Пароль не должен быть слишком простым и распространенным.
                  </li>
                  <li>Пароль не может состоять только из цифр.</li>
                </ul>
              </div>

              <div className="form-group">
                <label htmlFor="password_confirm">Подтверждение пароля*</label>
                <CustomInput
                  id="password_confirm"
                  type="password"
                  classname="form-control"
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
              <CustomButton
                title="Зарегистрироваться"
                type={EButtonTypes.SUBMIT}
                classname="btn-primary"
              />
              <CustomNavigateButton
                title="Войти"
                path="/login"
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

export default RegistrationForm;
