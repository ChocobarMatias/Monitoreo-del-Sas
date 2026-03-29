import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email });
    setMessage("Si el correo existe, se envió el enlace de recuperación.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Sin drama. Poné tu email y seguimos.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="w-full" type="submit">Enviar</Button>
        </form>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver</Link>
      </div>
    </div>
  );
}