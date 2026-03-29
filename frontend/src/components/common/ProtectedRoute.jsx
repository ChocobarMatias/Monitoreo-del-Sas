import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { LoadingScreen } from "../ui/LoadingScreen";

export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isBooting = useAuthStore((state) => state.isBooting);

  if (isBooting) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}