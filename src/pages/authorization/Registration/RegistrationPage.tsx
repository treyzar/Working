import bgImage from "@shared/assets/images/login/login-bg-new.png";
import RegistrationForm from "@widgets/forms/Authorization/RegistrationForm";
import "./RegistrationPage.scss";

const RegistrationPage = () => {
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
        <RegistrationForm />
      </div>
    </div>
  );
};

export default RegistrationPage;
