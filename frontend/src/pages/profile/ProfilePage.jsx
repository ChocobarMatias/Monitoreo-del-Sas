import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useSubscriptionStore } from "../../store/subscription.store";
import { api } from "../../lib/axios";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("es-AR");
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { status, expiresAt, remainingDays, fetchStatus } = useSubscriptionStore();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      fetchStatus();
      api.get("/subscriptions/history").then(({ data }) => setHistory(data.data || []));
    }
  }, [user, fetchStatus]);

  async function savePin() {
    await api.post("/auth/set-pin", { pin });
    setMessage("PIN guardado correctamente.");
    setPin("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
        <p className="text-sm text-slate-500">{user?.email}</p>
        <p className="mt-1 text-xs text-slate-500">Rol: {user?.role}</p>
      </div>

      {user?.role !== "ADMIN" && (
        <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-slate-800">Mi membresía</p>

          {status === "active" && (
            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Activa
              </span>
              <p className="text-sm text-slate-600">Vence el: <span className="font-medium">{formatDate(expiresAt)}</span></p>
              <p className="text-sm text-slate-600">Días restantes: <span className="font-medium">{remainingDays}</span></p>
            </div>
          )}

          {(status === "expired" || status === "never") && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {status === "expired" ? "Vencida" : "Sin membresía"}
            </span>
          )}

          {history.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Historial</p>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-slate-100 p-3 text-xs text-slate-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Inicio: <span className="font-medium">{formatDate(h.activated_at)}</span></span>
                      <span>Fin: <span className="font-medium">{formatDate(h.expires_at)}</span></span>
                    </div>
                    {h.notes && <p className="text-slate-400">Nota: {h.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
        <Input
          label="Configurar PIN"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Nuevo PIN"
        />
        <Button className="w-full" onClick={savePin}>Guardar PIN</Button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </div>

      <Button variant="danger" className="w-full" onClick={logout}>Cerrar sesión</Button>
    </div>
  );
}
