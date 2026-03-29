import { Home, CalendarRange, KeyRound, Wallet, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/attendance", label: "Planilla", icon: CalendarRange },
  { to: "/keys", label: "Claves", icon: KeyRound },
  { to: "/salary", label: "Sueldo", icon: Wallet },
  { to: "/profile", label: "Perfil", icon: UserCircle2 }
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-safe pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium",
                isActive ? "bg-slate-950 text-white" : "text-slate-500"
              )
            }
          >
            <Icon size={18} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}