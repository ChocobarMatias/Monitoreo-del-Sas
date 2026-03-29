import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleGuard } from "./components/common/RoleGuard";
import { MobileLayout } from "./components/layout/MobileLayout";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import KeysPage from "./pages/keys/KeysPage";
import SalaryPage from "./pages/salary/SalaryPage";
import ProfilePage from "./pages/profile/ProfilePage";
import UsersPage from "./pages/users/UsersPage";
import NotFoundPage from "./pages/not-found/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MobileLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "/attendance", element: <AttendancePage /> },
              { path: "/keys", element: <KeysPage /> },
              { path: "/salary", element: <SalaryPage /> },
              { path: "/profile", element: <ProfilePage /> },
              {
                path: "/users",
                element: (
                  <RoleGuard roles={["ADMIN"]}>
                    <UsersPage />
                  </RoleGuard>
                )
              }
            ]
          }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);