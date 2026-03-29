import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(form);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Guard App</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Ingresar</h1>
          <p className="mt-2 text-sm text-slate-500">Seguridad, turnos y liquidación. Todo en el bolsillo.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="admin@local.com"
          />
          <Input
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
            error={error}
          />
          <Button className="w-full" disabled={isLoggingIn} type="submit">
            {isLoggingIn ? "Ingresando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-500">
          <Link to="/forgot-password" className="font-semibold text-slate-900">Recuperar contraseña</Link>
        </div>
      </div>
    </div>
  );
}