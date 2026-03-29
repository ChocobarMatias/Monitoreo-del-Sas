import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/axios";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

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