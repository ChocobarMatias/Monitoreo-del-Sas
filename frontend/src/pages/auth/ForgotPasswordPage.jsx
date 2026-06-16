import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.token) {
        setResetLink(`/reset-password?token=${res.data.token}`);
      } else {
        setResetLink("enviado");
      }
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (resetLink && resetLink !== "enviado") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-black text-slate-950">Link generado</h1>
          <p className="mt-2 text-sm text-slate-500">Usá este link para resetear la contraseña:</p>
          <Link
            to={resetLink}
            className="mt-4 inline-block break-all text-sm font-semibold text-blue-600 underline"
          >
            Hacer click aquí para resetear tu contraseña
          </Link>
          <p className="mt-4 text-xs text-slate-400">Este link expira en 30 minutos.</p>
        </div>
      </div>
    );
  }

  if (resetLink === "enviado") {
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
