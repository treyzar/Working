import { useState } from "react";
import "./UserMenu.scss";
import Avatar from "react-avatar";
import apiClient, {
  clearTokens,
} from "../../../shared/utils/services/response";
import { useNavigate } from "react-router-dom";
import type { IUserMenuProps } from "../../../shared/interfaces/interfaces";
import { FaUserCircle } from "react-icons/fa";
import { IoExitOutline } from "react-icons/io5";
const UserMenu = ({ first_name, username }: IUserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const logout = async () => {
    const data = { refresh: localStorage.getItem("refresh") };
    try {
      await apiClient.post("http://127.0.0.1:8000/users/api/logout/", data);
    } catch (e) {
      console.warn("Logout error (token may be invalid)");
    } finally {
      clearTokens();
      navigate("/login");
    }
  };

  return (
    <div className="user-menu">
      <button className="user-menu__trigger" onClick={toggleMenu}>
        <Avatar name={first_name || username} size="24" round color="#E73F0C" />
        <span className="user-menu__name">{username}</span>
        <svg
          className={`user-menu__arrow ${isOpen ? "rotate" : ""}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 6L6 1.5L10.5 6"
            stroke="#495057"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu__dropdown" onClick={closeMenu}>
          <div className="user-menu__item" onClick={() => navigate("/profile")}>
            <FaUserCircle />
            <span>Личный кабинет</span>
          </div>
          <hr className="user-menu__divider" />
          <div
            className="user-menu__item user-menu__item--logout"
            onClick={logout}
          >
            <IoExitOutline />
            <span>Выйти</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
