import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { api } from "../../lib/axios";

export function OverrideActionSheet({ open, onClose, day, year, month, onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function send(type, strikeShift) {
    if (!day) return;
    setLoading(true);
    try {
      await api.post("/attendance/override", {
        year,
        month,
        date: day.work_date,
        type,
        strikeShift
      });
      onSuccess?.();
      onClose?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Acciones · ${day?.day_name || ""}`}>
      <div className="grid gap-3">
        <Button disabled={loading} onClick={() => send("HOLIDAY")}>Marcar feriado</Button>
        <Button variant="secondary" disabled={loading} onClick={() => send("REST")}>Marcar descanso</Button>
        <Button variant="secondary" disabled={loading} onClick={() => send("VACATION")}>Vacaciones</Button>
        <Button variant="secondary" disabled={loading} onClick={() => send("SICK")}>Enfermedad</Button>
        <Button variant="secondary" disabled={loading} onClick={() => send("STRIKE", "DAY")}>Paro 08 a 20</Button>
        <Button variant="secondary" disabled={loading} onClick={() => send("STRIKE", "NIGHT")}>Paro 20 a 08</Button>
      </div>
    </Modal>
  );
}