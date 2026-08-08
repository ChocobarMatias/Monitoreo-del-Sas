import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useSubscriptionStore } from "../../store/subscription.store";
import SubscriptionBlockedPage from "../../pages/subscription/SubscriptionBlockedPage";

export function SubscriptionGate() {
  const user = useAuthStore((s) => s.user);
  const { status, fetchStatus } = useSubscriptionStore();

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      fetchStatus();
    }
  }, [user]);

  if (user?.role === "ADMIN") return <Outlet />;
  if (status === null) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );
  if (status === "active") return <Outlet />;
  return <SubscriptionBlockedPage />;
}
