import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export function RoleGuard({ roles, children }) {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}