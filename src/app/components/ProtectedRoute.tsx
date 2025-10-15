import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../../shared/utils/services/response";
import type { ProtectedRouteProps } from "../../shared/interfaces/interfaces";

const ProtectedRoute = ({ redirectPath = "/login" }: ProtectedRouteProps) => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
