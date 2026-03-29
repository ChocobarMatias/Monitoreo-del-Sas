import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/axios";

export default function UsersPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    await api.post("/auth/users", form);
    setMessage("Usuario creado correctamente.");
    setForm({ name: "", email: "", password: "", role: "USER" });
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
      <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Rol</span>
        <select
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none"
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </label>
      <Button className="w-full" type="submit">Crear usuario</Button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </form>
  );
}