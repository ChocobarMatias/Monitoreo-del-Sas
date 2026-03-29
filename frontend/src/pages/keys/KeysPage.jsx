import { useEffect, useState } from "react";
import { KeyRecordCard } from "../../components/keys/KeyRecordCard";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";

import { PinModal } from "../../components/ui/PinModal";

import { api } from "../../lib/axios";

const initialForm = {
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
  guardia2: ""
};

export default function KeysPage() {
  const [openPin, setOpenPin] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function fetchKeys() {
    const pin = prompt("PIN para consultar claves");
    const { data } = await api.get("/keys", { headers: { pin } });
    setRecords(Array.isArray(data?.data) ? data.data : []);
  }

  useEffect(() => {
    if (!openPin) {
      fetchKeys();
    }
  }, [openPin]);

  async function createKey() {
    const pin = prompt("PIN para guardar");
    await api.post("/keys", form, { headers: { pin } });
    setForm(initialForm);
    setFormOpen(false);
    fetchKeys();
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={() => setFormOpen(true)}>Agregar registro</Button>

      <div className="space-y-3">
        {records.map((item) => <KeyRecordCard key={item.id} item={item} />)}
      </div>

      <PinModal open={openPin} onClose={() => setOpenPin(false)} onSuccess={() => setOpenPin(false)} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo registro de claves">
        <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {Object.keys(initialForm).map((key) => (
            <Input
              key={key}
              label={key}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          <Button onClick={createKey}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}