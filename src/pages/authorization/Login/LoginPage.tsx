import bgImage from "@shared/assets/images/login/login-bg-new.png";
import LoginForm from "@widgets/forms/Authorization/LoginForm";
import "./LoginPage.scss";

const LoginPage = () => {
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
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
