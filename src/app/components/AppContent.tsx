import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../../pages/Authorization/Login/LoginPage";
import RegistrationPage from "../../pages/Authorization/Registration/RegistrationPage";
import HomePage from "../../pages/HomePage/HomePage";
import Profile from "../../pages/Authorization/Profile/Profile";
import Letters from "../../pages/Letters/Letters";
import Orders from "../../pages/Orders/Orders";
import ProtectedRoute from "../components/ProtectedRoute";
import Catalog from "../../pages/Catalog/Catalog";
import Letter from "../../pages/Letter/Letter";
import TestPage from "../../pages/TestPage/TestPage";
export const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/letters" element={<Letters />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="letters/:id" element={<Letter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
