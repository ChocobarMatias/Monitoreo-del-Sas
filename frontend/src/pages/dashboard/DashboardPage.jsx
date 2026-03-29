import { Link } from "react-router-dom";
import { CalendarRange, KeyRound, Wallet, Users2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { useAuthStore } from "../../store/auth.store";

const items = [
  { to: "/attendance", title: "Planilla", desc: "Turnos, feriados y descansos", icon: CalendarRange },
  { to: "/keys", title: "Claves", desc: "Acceso protegido por PIN", icon: KeyRound },
  { to: "/salary", title: "Sueldo", desc: "Cálculo mensual", icon: Wallet }
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-950 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Resumen</p>
        <h2 className="mt-2 text-2xl font-black">Bienvenido, {user?.name}</h2>
        <p className="mt-2 text-sm text-white/70">Tu sistema de guardia ya está en línea. Cero vueltas, full control.</p>
      </Card>

      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}>
              <Card className="flex items-center gap-4">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}

        {user?.role === "ADMIN" ? (
          <Link to="/users">
            <Card className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-100 p-3">
                <Users2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Usuarios</h3>
                <p className="text-sm text-slate-500">Alta de compañero y control de permisos</p>
              </div>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}