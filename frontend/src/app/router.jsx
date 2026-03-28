import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> }
]);
