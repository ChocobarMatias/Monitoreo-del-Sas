import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEnviado(true);
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <p className="text-sm text-emerald-700">Si el correo existe, se envió el enlace de recuperación.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Sin drama. Poné tu email y seguimos.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="w-full" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar"}</Button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver</Link>
      </div>
    </div>
  );
}
