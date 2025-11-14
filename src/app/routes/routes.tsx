import LoginPage from "@pages/authorization/Login/LoginPage";
import Profile from "@pages/authorization/Profile/Profile";
import RegistrationPage from "@pages/authorization/Registration/RegistrationPage";
import HomePage from "@pages/home/HomePage";
import NotFound from "@pages/not-found/NotFound";
import TestPage from "@pages/test/TestPage";
import type { IPath } from "@shared/types/interfaces/interfaces";

export const routes: IPath[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/registration", element: <RegistrationPage /> },
  { path: "/", element: <HomePage /> },
  { path: "*", element: <NotFound /> },
  { path: "/profile", element: <Profile /> },
  { path: "/test", element: <TestPage /> },
];
