import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { api } from "../../lib/axios";

// step: "select" → "holiday-question" / "manual" / "reset-normal"
const INITIAL = { selectedDate: "", step: "select", startTime: "08:00", endTime: "20:00", workedHours: 12 };

export function OverrideActionSheet({ open, onClose, days, year, month, onSuccess, initialDate }) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    if (open) {
      setState({ ...INITIAL, selectedDate: initialDate || "" });
    }
  }, [open, initialDate]);

  const { selectedDate, step, startTime, endTime, workedHours } = state;
  const selectedDay = days?.find((d) => d.work_date === selectedDate) || null;
  const dayNum = selectedDay ? new Date(selectedDay.work_date + "T00:00:00").getDate() : "";

  function set(patch) { setState((s) => ({ ...s, ...patch })); }

  async function sendOverride(type, extra = {}) {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await api.post("/attendance/override", { year, month, date: selectedDate, type, ...extra });
      onSuccess?.();
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  async function sendManual(overrideStart, overrideEnd, overrideHours) {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await api.patch("/attendance/day", {
        year, month, date: selectedDate,
        startTime: overrideStart ?? startTime,
        endTime: overrideEnd ?? endTime,
        workedHours: overrideHours ?? workedHours,
      });
      onSuccess?.();
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setState(INITIAL);
    onClose?.();
  }

  function openManual() {
    set({
      step: "manual",
      startTime: selectedDay?.start_time || "08:00",
      endTime: selectedDay?.end_time || "20:00",
      workedHours: selectedDay?.worked_hours > 0 ? selectedDay.worked_hours : 12,
    });
  }

  function handleStartTime(val) {
    set({ startTime: val, endTime: val === "20:00" ? "08:00" : "20:00" });
  }

  const TITLE = {
    "select": "Configurar día",
    "holiday-question": `Feriado · ${selectedDay?.day_name} ${dayNum}`,
    "manual": `Editar manual · ${selectedDay?.day_name} ${dayNum}`,
    "reset-normal": `Restablecer turno · ${selectedDay?.day_name} ${dayNum}`,
  };

  return (
    <Modal open={open} onClose={handleClose} title={TITLE[step]}>

      {/* ── PASO 1: elegir día + acción ── */}
      {step === "select" && (
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Elegir día</label>
            <select
              value={selectedDate}
              onChange={(e) => set({ selectedDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">— Seleccioná el día —</option>
              {days?.map((d) => {
                const n = new Date(d.work_date + "T00:00:00").getDate();
                const turno = d.shift_type !== "NONE" ? `${d.start_time}–${d.end_time}` : "Libre";
                return (
                  <option key={d.work_date} value={d.work_date}>
                    {n} · {d.day_name} ({turno})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedDay && (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Acción para {selectedDay.day_name} {dayNum}
              </p>
              <Button disabled={loading} onClick={() => set({ step: "holiday-question" })}>
                Feriado
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => sendOverride("REST")}>
                Descanso
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => sendOverride("VACATION")}>
                Vacaciones
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => sendOverride("SICK")}>
                Enfermedad
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => sendOverride("STRIKE", { strikeShift: "DAY" })}>
                Paro 08 a 20
              </Button>
              <Button variant="secondary" disabled={loading} onClick={() => sendOverride("STRIKE", { strikeShift: "NIGHT" })}>
                Paro 20 a 08
              </Button>
              <button
                disabled={loading}
                onClick={openManual}
                className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
              >
                Editar manual
              </button>
              <button
                disabled={loading}
                onClick={() => set({ step: "reset-normal" })}
                className="w-full rounded-2xl border border-dashed border-emerald-300 px-4 py-2.5 text-sm font-semibold text-emerald-600"
              >
                Restablecer día normal
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 2: ¿Trabajaste el feriado? ── */}
      {step === "holiday-question" && (
        <div className="grid gap-4">
          <p className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-slate-700">
            El <strong>{selectedDay?.day_name} {dayNum}</strong> es feriado.
            <br />¿Igual trabajaste ese día?
          </p>

          <Button
            disabled={loading}
            onClick={() => sendOverride("HOLIDAY", { holidayWorked: true })}
          >
            Sí, trabajé ese día
          </Button>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => sendOverride("HOLIDAY", { holidayWorked: false })}
          >
            No, fue feriado libre
          </Button>
          <button
            className="text-xs text-slate-400 underline"
            onClick={() => set({ step: "select" })}
          >
            Volver
          </button>
        </div>
      )}

      {/* ── PASO 3: edición manual ── */}
      {step === "manual" && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Ingreso</label>
              <select
                value={startTime}
                onChange={(e) => handleStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
              >
                <option value="08:00">08:00</option>
                <option value="20:00">20:00</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Egreso</label>
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">
                {endTime}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Horas trabajadas
            </label>
            <input
              type="number"
              min="0"
              max="12"
              step="0.5"
              value={workedHours}
              onChange={(e) => set({ workedHours: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="mt-1 text-xs text-slate-400">
              Editá si saliste antes o fue parcial. Normal = 12 hs.
            </p>
          </div>

          <Button disabled={loading} onClick={sendManual}>
            Guardar cambios
          </Button>
          <button
            className="text-xs text-slate-400 underline"
            onClick={() => set({ step: "select" })}
          >
            Volver
          </button>
        </div>
      )}

      {/* ── PASO: restablecer turno normal ── */}
      {step === "reset-normal" && (
        <div className="grid gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Elegí el turno a restablecer
          </p>
          <Button disabled={loading} onClick={() => sendManual("20:00", "08:00", 12)}>
            Nocturno · 20:00 a 08:00 · 12 hs
          </Button>
          <Button variant="secondary" disabled={loading} onClick={() => sendManual("08:00", "20:00", 12)}>
            Diurno · 08:00 a 20:00 · 12 hs
          </Button>
          <button
            className="text-xs text-slate-400 underline"
            onClick={() => set({ step: "select" })}
          >
            Volver
          </button>
        </div>
      )}
    </Modal>
  );
}
