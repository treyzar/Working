import { Link, useLocation } from "react-router-dom";
import betaLogo from "../../images/header/logo_word_beta_black.png";
import UserMenu from "../List/UserMenu/userMenu";
import type {
  AppRoute,
  IUserMenuProps,
} from "../../shared/interfaces/interfaces";
import { getAccessToken } from "../../shared/utils/services/response";
import "./Header.scss";

const Header = ({ first_name, username, is_staff }: IUserMenuProps) => {
  const location = useLocation();
  const isActive = (path: AppRoute) => location.pathname === path;
  const isAuth = getAccessToken();

  return (
    <div className="header-wrap">
      <header className="app-header" role="banner">
        <div className="app-header__inner">
          <Link to="/" className="app-header__logo">
            <img src={betaLogo} alt="Логотип" height="32" />
          </Link>

          <nav className="app-header__nav">
            <ul className="nav">
              <li className="nav-item">
                <Link
                  to="/orders"
                  className={`nav-link ${isActive("/orders") ? "active" : ""}`}
                >
                  Заказы
                </Link>
              </li>
              {is_staff && (
                <li className="nav-item">
                  <Link
                    to="/catalog"
                    className={`nav-link ${
                      isActive("/catalog") ? "active" : ""
                    }`}
                  >
                    Каталог
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <Link
                  to="/letters"
                  className={`nav-link ${isActive("/letters") ? "active" : ""}`}
                >
                  Реестр писем
                </Link>
              </li>
            </ul>
          </nav>

          <div className="app-header__user">
            {isAuth ? (
              <UserMenu first_name={first_name} username={username} />
            ) : (
              <div>
                <Link to="/login" className="btn btn-primary">
                  Войти
                </Link>
                <Link to={"/registration"} className="btn btn-secondary">
                  Зарегистрироваться
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
