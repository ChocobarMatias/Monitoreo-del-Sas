import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

const titles = {
  "/": "Dashboard",
  "/attendance": "Planilla de asistencia",
  "/keys": "Claves",
  "/salary": "Cálculo de sueldo",
  "/profile": "Perfil",
  "/users": "Usuarios"
};

export function MobileLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || "Guard App";

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <TopBar title={title} />
      <main className="mx-auto max-w-md px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}