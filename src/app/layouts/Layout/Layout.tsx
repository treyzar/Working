import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import apiClient from "../../../shared/utils/services/response";
import Header from "../../../widgets/Header/Header";
import Footer from "../../../widgets/Footer/Footer";
import type {
  IUserProfile,
  IUserResponse,
} from "../../../shared/interfaces/interfaces";
import "./Layout.scss";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);

  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/registration";

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      return;
    }

    try {
      const response = await apiClient.get<IUserResponse>(
        "http://127.0.0.1:8000/users/api/profile/default/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserProfile(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  useEffect(() => {
    if (!isAuthPage) {
      fetchUserProfile();
    }
  }, [isAuthPage]);

  return (
    <div className="app-wrapper">
      {!isAuthPage && (
        <Header
          first_name={userProfile?.first_name}
          username={userProfile?.username}
          is_staff={userProfile?.is_staff}
        />
      )}
      <main className="app-main">{children}</main>
      {!isAuthPage && <Footer is_staff={userProfile?.is_staff || false} />}
    </div>
  );
};
