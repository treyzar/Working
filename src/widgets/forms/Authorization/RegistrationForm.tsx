import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Form from "@shared/ui/forms/Form";
import CustomInput from "@shared/ui/input/CustomInput";
import CustomButton from "@shared/ui/button/CustomButton";
import CustomNavigateButton from "@shared/ui/button/CustomNavigateButton";
import { EButtonTypes } from "@shared/config/enums/enums";

import GenderList from "@widgets/list/GenderList/gendersList";

import {
  regSchema,
  type TRegSchema,
} from "@shared/types/schemas/authorizaton/regSchema";
import { useRegister } from "@features/authorization/registerAPI";

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
              Обязательное поле. Не более 150 символов. Только буквы, цифры и
              символы @/./+/-/_.
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
              {...register("first_name")}
            />
            {errors.first_name && (
              <span className="error-text">{errors.first_name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="surname">Фамилия</label>
            <CustomInput
              id="surname"
              type="text"
              classname="form-control"
              {...register("last_name")}
            />
            {errors.last_name && (
              <span className="error-text">{errors.last_name.message}</span>
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
              {...register("third_name")}
            />
            {errors.third_name && (
              <span className="error-text">{errors.third_name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="gender">Пол</label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <GenderList
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
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
              {...register("birth_date")}
            />
            <span className="hint">YYYY-MM-DD</span>
            {errors.birth_date && (
              <span className="error-text">{errors.birth_date.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="position">Должность</label>
            <CustomInput
              id="position"
              type="text"
              classname="form-control"
              {...register("post_job")}
            />
            {errors.post_job && (
              <span className="error-text">{errors.post_job.message}</span>
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
              {...register("departament")}
            />
            {errors.departament && (
              <span className="error-text">{errors.departament.message}</span>
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
              <li>Пароль не должен быть слишком простым и распространенным.</li>
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
            disabled={isPending}
          />
          <CustomNavigateButton
            path="/login"
            type={EButtonTypes.BUTTON}
            classname="btn-outline-secondary"
          >
            Войти
          </CustomNavigateButton>
        </div>

        <a href="#" className="forgot-pass">
          Забыли пароль?
        </a>
      </Form>
    </div>
  );
};

export default RegistrationForm;
