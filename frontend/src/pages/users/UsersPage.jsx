import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/axios";

const EMPTY_FORM = { name: "", email: "", password: "", role: "USER", grupo_sas_id: "", cycle_start_date: "", initial_week_type: "A" };

function GrupoSelect({ value, onChange, grupos }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">Grupo SAS</span>
      <select
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="">— Sin grupo (manual) —</option>
        {grupos.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nombre} (Semana {g.tipo_inicio})
          </option>
        ))}
      </select>
    </label>
  );
}

function EditModal({ user, grupos, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active ? true : false,
    grupo_sas_id: user.grupo_sas_id ?? "",
    cycle_start_date: user.cycle_start_date ? user.cycle_start_date.slice(0, 10) : "",
    initial_week_type: user.initial_week_type ?? "A",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${user.id}`, {
        ...form,
        grupo_sas_id: form.grupo_sas_id || null,
        cycle_start_date: form.grupo_sas_id ? null : (form.cycle_start_date || null),
        initial_week_type: form.grupo_sas_id ? null : (form.initial_week_type || "A"),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-slate-900">Editar usuario</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
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
          <GrupoSelect
            value={form.grupo_sas_id}
            onChange={(e) => setForm((p) => ({ ...p, grupo_sas_id: e.target.value }))}
            grupos={grupos}
          />
          {!form.grupo_sas_id && (
            <>
              <Input
                label="Fecha inicio ciclo"
                type="date"
                value={form.cycle_start_date}
                onChange={(e) => setForm((p) => ({ ...p, cycle_start_date: e.target.value }))}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Semana inicial</span>
                <select
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none"
                  value={form.initial_week_type}
                  onChange={(e) => setForm((p) => ({ ...p, initial_week_type: e.target.value }))}
                >
                  <option value="A">Semana A</option>
                  <option value="B">Semana B</option>
                </select>
              </label>
            </>
          )}
          <label className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Activo</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [grupos, setGrupos] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editUser, setEditUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [usersRes, gruposRes] = await Promise.all([
      api.get("/users/"),
      api.get("/users/grupos"),
    ]);
    setUsers(usersRes.data?.data || []);
    setGrupos(gruposRes.data?.data || []);
  }

  useEffect(() => { loadData(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/auth/users", {
        ...form,
        grupo_sas_id: form.grupo_sas_id || null,
        cycle_start_date: form.grupo_sas_id ? null : (form.cycle_start_date || null),
        initial_week_type: form.grupo_sas_id ? null : (form.initial_week_type || "A"),
      });
      setMessage("Usuario creado correctamente.");
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear usuario");
    }
  }

  function grupoBadge(user) {
    if (user.grupo_nombre) {
      return (
        <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-800">
          {user.grupo_nombre}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Lista de usuarios */}
      {users.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">Usuarios registrados</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {u.name}
                    {!u.is_active && (
                      <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1">INACTIVO</span>
                    )}
                    {grupoBadge(u)}
                  </p>
                  <p className="text-xs text-slate-500">{u.email} · {u.role}</p>
                </div>
                <button
                  onClick={() => setEditUser(u)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulario de creación */}
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-sm font-bold text-slate-800">Crear usuario</h2>
        <form className="space-y-3" onSubmit={submit}>
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
          <GrupoSelect
            value={form.grupo_sas_id}
            onChange={(e) => setForm((p) => ({ ...p, grupo_sas_id: e.target.value }))}
            grupos={grupos}
          />
          {!form.grupo_sas_id && (
            <>
              <Input
                label="Fecha inicio ciclo"
                type="date"
                value={form.cycle_start_date}
                onChange={(e) => setForm((p) => ({ ...p, cycle_start_date: e.target.value }))}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Semana inicial</span>
                <select
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none"
                  value={form.initial_week_type}
                  onChange={(e) => setForm((p) => ({ ...p, initial_week_type: e.target.value }))}
                >
                  <option value="A">Semana A</option>
                  <option value="B">Semana B</option>
                </select>
              </label>
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit">Crear usuario</Button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </form>
      </div>

      {/* Modal de edición */}
      {editUser && (
        <EditModal
          user={editUser}
          grupos={grupos}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); loadData(); }}
        />
      )}
    </div>
  );
}
