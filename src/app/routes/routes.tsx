import LoginPage from "../../pages/Authorization/Login/LoginPage";
import Profile from "../../pages/Authorization/Profile/Profile";
import RegistrationPage from "../../pages/Authorization/Registration/RegistrationPage";
import HomePage from "../../pages/HomePage/HomePage";
import NotFound from "../../pages/NotFound/NotFound";
import TestPage from "../../pages/TestPage/TestPage";
import type { IPath } from "../../shared/interfaces/interfaces";

export const routes: IPath[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/registration", element: <RegistrationPage /> },
  { path: "/", element: <HomePage /> },
  { path: "*", element: <NotFound /> },
  { path: "/profile", element: <Profile /> },
  { path: "/test", element: <TestPage /> },
];
