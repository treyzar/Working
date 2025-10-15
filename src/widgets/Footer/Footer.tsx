import { useLocation } from "react-router-dom";
import CustomNavigateButton from "../../shared/button/CustomNavigateButton";
import { EButtonTypes } from "../../shared/enums/enums";
import "./Footer.scss";
const Footer = ({ is_staff }: { is_staff: boolean }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="footer-wrap">
      <footer className="app-footer" role="contentinfo">
        <div className="footer__inner">
          <nav className="footer__nav" aria-label="Навигация в футере">
            <ul className="nav">
              <li className="nav-item">
                <CustomNavigateButton
                  title="Заказы"
                  path="/orders"
                  type={EButtonTypes.BUTTON}
                  classname={`nav-link ${isActive("/orders") ? "active" : ""}`}
                />
              </li>
              {is_staff && (
                <li className="nav-item">
                  <CustomNavigateButton
                    title="Каталог"
                    path="/catalog"
                    type={EButtonTypes.BUTTON}
                    classname={`nav-link ${
                      isActive("/catalog") ? "active" : ""
                    }`}
                  />
                </li>
              )}
              <li className="nav-item">
                <CustomNavigateButton
                  title="Реестр писем"
                  path="/letters"
                  type={EButtonTypes.BUTTON}
                  classname={`nav-link ${isActive("/letters") ? "active" : ""}`}
                />
              </li>
            </ul>
          </nav>

          <p className="copyright mb-0">
            &copy; {new Date().getFullYear()} ООО «НПП Бреслер». Все права
            защищены
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
