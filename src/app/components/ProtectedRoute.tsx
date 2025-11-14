import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "@shared/api/response";
import type { ProtectedRouteProps } from "@shared/types/interfaces/interfaces";

const ProtectedRoute = ({ redirectPath = "/" }: ProtectedRouteProps) => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
