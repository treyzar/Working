import { useLocation } from "react-router-dom";
import Header from "@widgets/header/Header";
import Footer from "@widgets/footer/Footer";
import "./Layout.scss";
import { useProfile } from "@features/authorization/profileAPI";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/registration";

  const { data: userProfile } = useProfile({ enabled: !isAuthPage });

  return (
    <div className="app-wrapper">
      {!isAuthPage && (
        <Header
          first_name={userProfile?.first_name || ""}
          username={userProfile?.username || ""}
          is_staff={userProfile?.is_staff}
        />
      )}
      <main className="app-main">{children}</main>
      {!isAuthPage && <Footer is_staff={userProfile?.is_staff || false} />}
    </div>
  );
};
