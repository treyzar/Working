import LoginPage from "../../pages/Authorization/LoginPage";
import Profile from "../../pages/Authorization/Profile";
import RegistrationPage from "../../pages/Authorization/RegistrationPage";
import HomePage from "../../pages/HomePage/HomePage";
import NotFound from "../../pages/NotFound/NotFound";
import type { IPath } from "../../shared/interfaces/interfaces";

export const routes: IPath[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/registration", element: <RegistrationPage /> },
  { path: "/", element: <HomePage /> },
  { path: "*", element: <NotFound /> },
  {path: '/profile', element: <Profile />}
];
