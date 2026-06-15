import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      navigate("/login", { state: { message: "Contraseña actualizada. Podés iniciar sesión." } });
    } catch (err) {
      setError(err.response?.data?.message || "Token inválido o expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <p className="text-sm text-red-600">Token faltante. Pedí un nuevo link de recuperación.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una contraseña de al menos 8 caracteres.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver al login</Link>
      </div>
    </div>
  );
}
