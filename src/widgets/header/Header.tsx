import { Link, useLocation } from "react-router-dom";
import betaLogo from "@shared/assets/images/header/logo_word_beta_black.png";
import UserMenu from "../list/UserMenu/userMenu";
import type {
  AppRoute,
  IUserMenuProps,
} from "@shared/types/interfaces/interfaces";
import "./Header.scss";
import CustomNavigateButton from "@shared/ui/button/CustomNavigateButton";
import { useProfile } from "@features/authorization/profileAPI";

const Header = ({ first_name, username, is_staff }: IUserMenuProps) => {
  const location = useLocation();
  const isActive = (path: AppRoute) => location.pathname === path;

  const {
    data: profile,
    isLoading,
    isFetching,
  } = useProfile({ enabled: true });

  const isAuthenticated = !!profile || isLoading || isFetching;

  const uiFirstName = (profile?.first_name ?? first_name) || "";
  const uiUsername = (profile?.username ?? username) || "";
  const uiIsStaff = (profile?.is_staff ?? is_staff) || false;

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

              {uiIsStaff && (
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
            {isAuthenticated ? (
              <UserMenu first_name={uiFirstName} username={uiUsername} />
            ) : (
              <div className="d-flex gap-2">
                <CustomNavigateButton
                  path="/login"
                  classname="btn btn-primary btn-login"
                  type="button"
                >
                  Войти
                </CustomNavigateButton>
                <CustomNavigateButton
                  path="/registration"
                  classname="btn btn-secondary btn-register"
                  type="button"
                >
                  Зарегистрироваться
                </CustomNavigateButton>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
