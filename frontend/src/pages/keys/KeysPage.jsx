import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { PinModal } from "../../components/ui/PinModal";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";

const initialForm = {
  numero_sucursal: "",
  nombre: "",
  mec1: "",
  mec2: "",
  mec3: "",
  mec4: "",
  mec5: "",
  mec6: "",
  vol: "",
  back1: "",
  back2: "",
  descripcion: "",
  guardia1: "",
  guardia2: "",
  telefono_guardia1: "",
  telefono_guardia2: "",
  fecha_actualizacion: ""
};

const FORM_FIELDS = Object.keys(initialForm);

const FIELD_LABELS = {
  numero_sucursal: "N° Sucursal",
  nombre: "Nombre",
  mec1: "Clave Mecanica 1", mec2: "Clave Mecanica 2", mec3: "Clave Mecanica 3",
  mec4: "Clave Mecanica 4", mec5: "Clave Mecanica 5", mec6: "Clave Mecanica 6",
  vol: "Volumetrica 1",
  back1: "BACK1", back2: "BACK2",
  descripcion: "Descripción",
  guardia1: "Guardia 1", guardia2: "Guardia 2",
  telefono_guardia1: "Tel. Guardia 1",
  telefono_guardia2: "Tel. Guardia 2",
  fecha_actualizacion: "Fecha actualización"
};

const COLUMNS = [
  { key: "numero_sucursal", label: "N° Sucursal" },
  { key: "nombre", label: "Nombre" },
  { key: "guardia1", label: "Guardia 1" },
  { key: "guardia2", label: "Guardia 2" },
  // { key: "mec1", label: "MEC1" },
  // { key: "mec2", label: "MEC2" },
  // { key: "mec3", label: "MEC3" },
  // { key: "mec4", label: "MEC4" },
  // { key: "mec5", label: "MEC5" },
  // { key: "mec6", label: "MEC6" },
  // { key: "vol", label: "VOL" },
  // { key: "back1", label: "BACK1" },
  // { key: "back2", label: "BACK2" },
  // { key: "descripcion", label: "Descripción" },
  // { key: "fecha_actualizacion", label: "Fecha" },
];

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("es-AR");
}

export default function KeysPage() {
  const [openPin, setOpenPin] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  async function fetchKeys() {
    const { data } = await api.get("/keys");
    setRecords(Array.isArray(data?.data) ? data.data : []);
  }

  useEffect(() => {
    if (!openPin) fetchKeys();
  }, [openPin]);

  async function createKey() {
    await api.post("/keys", form);
    setForm(initialForm);
    setFormOpen(false);
    fetchKeys();
  }

  async function updateKey() {
    await api.put(`/keys/${editRecord.id}`, editForm);
    setEditRecord(null);
    fetchKeys();
  }

  async function deleteKey(id) {
    if (!window.confirm("¿Eliminar este registro?")) return;
    await api.delete(`/keys/${id}`);
    fetchKeys();
  }

  function openEdit(record) {
    setEditRecord(record);
    setEditForm({ ...initialForm, ...record, fecha_actualizacion: record.fecha_actualizacion ? record.fecha_actualizacion.slice(0, 10) : "" });
  }

  if (openPin) {
    return <PinModal open={openPin} onSuccess={() => setOpenPin(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Registro de Claves</h2>
        <Button onClick={() => setFormOpen(true)}>Agregar registro</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-6 text-center text-slate-400">
                  Sin registros
                </td>
              </tr>
            ) : (
              records.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {col.key === "fecha_actualizacion"
                        ? formatDate(item[col.key])
                        : item[col.key] || "-"}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewRecord(item)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                        title="Ver"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => deleteKey(item.id)}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo registro de claves">
        <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {FORM_FIELDS.map((key) => (
            <Input
              key={key}
              label={FIELD_LABELS[key] || key}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          <Button onClick={createKey}>Guardar</Button>
        </div>
      </Modal>

      {/* Modal ver */}
      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Detalle de registro">
        {viewRecord && (
          <div className="grid gap-2 max-h-[70vh] overflow-y-auto pr-1 text-sm">
            {FORM_FIELDS.map((key) => (
              <div key={key} className="flex gap-2">
                <span className="font-semibold text-slate-600 w-40 shrink-0">{FIELD_LABELS[key] || key}:</span>
                <span className="text-slate-800 break-all">
                  {key === "fecha_actualizacion"
                    ? formatDate(viewRecord[key])
                    : viewRecord[key] || "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="Editar registro">
        <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {FORM_FIELDS.map((key) => (
            <Input
              key={key}
              label={FIELD_LABELS[key] || key}
              value={editForm[key]}
              onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          <Button onClick={updateKey}>Guardar cambios</Button>
        </div>
      </Modal>
    </div>
  );
}
