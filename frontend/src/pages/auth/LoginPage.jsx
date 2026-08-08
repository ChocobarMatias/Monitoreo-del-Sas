import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const location = useLocation();
  const successMessage = location.state?.message;

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        {successMessage ? <p className="mb-4 text-sm text-emerald-700">{successMessage}</p> : null}
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
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className={`h-12 w-full rounded-2xl border bg-white px-4 pr-12 outline-none transition ${
                  error
                    ? "border-red-400 focus:border-red-500"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </label>
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
