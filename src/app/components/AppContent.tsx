import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@pages/authorization/Login/LoginPage";
import RegistrationPage from "@pages/authorization/Registration/RegistrationPage";
import HomePage from "@pages/home/HomePage";
import Profile from "@pages/authorization/Profile/Profile";
import Letters from "@pages/letters/Letters";
import Orders from "@pages/orders/Orders";
import ProtectedRoute from "../components/ProtectedRoute";
import Catalog from "@pages/catalog/Catalog";
import Letter from "@pages/letter/Letter";
import TestPage from "@/pages/test/TestPage";
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
