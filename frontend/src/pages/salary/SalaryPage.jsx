import { useState, useMemo, useEffect } from "react";
import { api } from "../../lib/axios";
import { formatCurrency, monthName } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

const LS_KEY = "sas_last_convenio_id";

function n(v) {
  return parseFloat(v) || 0;
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
      {children}
    </p>
  );
}

function ResultRow({ label, value, bold, red }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className={`text-sm ${bold ? "font-semibold text-slate-900" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : "font-medium"} ${red ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function AttChip({ label, value }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-3 py-2.5 text-center ring-1 ring-slate-100">
      <span className="text-[10px] font-medium text-slate-400">{label}</span>
      <span className="mt-0.5 text-base font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const EMPTY_FORM = {
  nombre: "",
  sueldoBasico: "",
  presentismo: "",
  viaticosNoRem: "",
  aniosAntiguedad: "",
  sumaNR: "",
  vigenteDesde: "",
};

export default function SalaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Convenios
  const [convenios, setConvenios] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingConvenios, setLoadingConvenios] = useState(false);

  // Modal nuevo convenio
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Feriado toggle
  const [feriadoBlanco, setFeriadoBlanco] = useState(false);

  // Asistencia
  const [attRows, setAttRows] = useState([]);
  const [attLoading, setAttLoading] = useState(false);

  const [showResults, setShowResults] = useState(false);

  // Cargar convenios al montar
  useEffect(() => {
    setLoadingConvenios(true);
    api
      .get("/salary/convenios")
      .then(({ data }) => {
        const list = data?.data ?? [];
        setConvenios(list);
        // Restaurar última selección
        const lastId = Number(localStorage.getItem(LS_KEY));
        if (lastId && list.find((c) => c.id === lastId)) {
          setSelectedId(lastId);
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
          localStorage.setItem(LS_KEY, list[0].id);
        }
      })
      .catch(() => setConvenios([]))
      .finally(() => setLoadingConvenios(false));
  }, []);

  // Cargar asistencia al cambiar mes/año
  useEffect(() => {
    setShowResults(false);
    let active = true;
    setAttLoading(true);
    api
      .get(`/attendance/${year}/${month}`)
      .then(({ data }) => { if (active) setAttRows(data?.data?.data ?? []); })
      .catch(() => { if (active) setAttRows([]); })
      .finally(() => { if (active) setAttLoading(false); });
    return () => { active = false; };
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function handleSelectConvenio(e) {
    const id = Number(e.target.value);
    setSelectedId(id);
    localStorage.setItem(LS_KEY, id);
    setShowResults(false);
  }

  // Horas desde asistencia
  const hrs = useMemo(() => {
    const total = attRows.reduce((s, r) => s + n(r.worked_hours), 0);
    const feriadoHrs = attRows.filter((r) => r.is_holiday === true).reduce((s, r) => s + n(r.worked_hours), 0);
    const sinFeriado = total - feriadoHrs;
    const nocturnas = attRows
      .filter((r) => r.start_time >= "20:00" && n(r.worked_hours) > 0)
      .reduce((s, r) => s + n(r.worked_hours), 0);
    return { total, feriadoHrs, sinFeriado, nocturnas, adicionales: total - 200 };
  }, [attRows]);

  // Convenio seleccionado
  const convenio = convenios.find((c) => c.id === selectedId) ?? null;

  // Cálculo
  const calc = useMemo(() => {
    if (!convenio) return null;

    const basico = n(convenio.sueldo_basico);
    if (!basico) return null;

    const pres  = n(convenio.presentismo);
    const viat  = n(convenio.viaticos_no_rem);
    const snr   = n(convenio.suma_no_remunerativa);
    const anios = n(convenio.anios_antiguedad);
    const { total, feriadoHrs, sinFeriado, nocturnas, adicionales } = hrs;

    const valorHora         = basico / 200;
    const valorHoraNocturna = basico * 0.001;
    const feriadoVal        = feriadoBlanco ? valorHora * feriadoHrs : 0;

    const antiguedad =
      adicionales < 0
        ? ((basico * sinFeriado) / 200 + (pres * sinFeriado) / 200 + feriadoVal) * 0.01 * anios
        : (basico + feriadoVal + pres) * 0.01 * anios;

    const remunerativo =
      adicionales < 0
        ? (sinFeriado * basico) / 200 + (sinFeriado * pres) / 200 + feriadoVal + antiguedad
        : basico + feriadoVal + pres + antiguedad;

    const noRemunerativo =
      adicionales < 0
        ? (total * viat) / 200 + (total * snr) / 200
        : viat + snr;

    const jubilacion    = remunerativo * 0.11;
    const obraSocial    = remunerativo * 0.03;
    const afip          = remunerativo * 0.03;
    const benefConvenio = basico * 0.0238;
    const descuento     = jubilacion + obraSocial + afip + benefConvenio;
    const totalBlanco   = remunerativo + noRemunerativo - descuento;
    const hrsNegro      = Math.max(0, sinFeriado - 200);
    const totalNegro    = hrsNegro * valorHora + nocturnas * valorHoraNocturna;

    return {
      basico, pres, viat, snr,
      valorHora, valorHoraNocturna, feriadoVal, antiguedad,
      remunerativo, noRemunerativo,
      jubilacion, obraSocial, afip, benefConvenio, descuento,
      totalBlanco, hrsNegro, totalNegro,
      totalSueldo: totalBlanco + totalNegro,
    };
  }, [convenio, feriadoBlanco, hrs]);

  // Guardar nuevo convenio
  async function handleSaveConvenio() {
    if (!form.nombre || !form.sueldoBasico || !form.vigenteDesde) {
      setFormError("Nombre, Sueldo Básico y Vigente desde son obligatorios.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const { data } = await api.post("/salary/convenios", {
        nombre: form.nombre,
        sueldoBasico: form.sueldoBasico,
        presentismo: form.presentismo,
        viaticosNoRem: form.viaticosNoRem,
        aniosAntiguedad: form.aniosAntiguedad,
        sumaNR: form.sumaNR,
        vigenteDesde: form.vigenteDesde,
      });
      const nuevo = data.data;
      setConvenios((prev) => [nuevo, ...prev]);
      setSelectedId(nuevo.id);
      localStorage.setItem(LS_KEY, nuevo.id);
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function setField(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  return (
    <div className="space-y-5">
      {/* Navegación de mes */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="px-3" onClick={prevMonth}>‹</Button>
        <div className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold shadow-soft">
          {monthName(month)} {year}
        </div>
        <Button variant="secondary" className="px-3" onClick={nextMonth}>›</Button>
      </div>

      {/* Selector de convenio */}
      <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Convenio Salarial</SectionLabel>
          <button
            onClick={() => { setModalOpen(true); setFormError(""); }}
            className="rounded-xl bg-yellow-400 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-yellow-500 active:scale-95 transition"
          >
            + Agregar convenio
          </button>
        </div>

        {loadingConvenios ? (
          <p className="text-xs text-slate-400">Cargando convenios...</p>
        ) : convenios.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
            No hay convenios guardados. Agregá uno para calcular.
          </p>
        ) : (
          <select
            value={selectedId ?? ""}
            onChange={handleSelectConvenio}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
          >
            {convenios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — vigente desde {formatDate(c.vigente_desde?.split?.("T")[0] ?? c.vigente_desde)}
              </option>
            ))}
          </select>
        )}

        {convenio && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3">
            <div>
              <p className="text-[10px] text-slate-400">Sueldo Básico</p>
              <p className="text-sm font-bold">{formatCurrency(convenio.sueldo_basico)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Presentismo</p>
              <p className="text-sm font-bold">{formatCurrency(convenio.presentismo)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Viáticos No Rem.</p>
              <p className="text-sm font-bold">{formatCurrency(convenio.viaticos_no_rem)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Suma No Rem.</p>
              <p className="text-sm font-bold">{formatCurrency(convenio.suma_no_remunerativa)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Antigüedad</p>
              <p className="text-sm font-bold">{convenio.anios_antiguedad} años</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen asistencia */}
      <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Asistencia — {monthName(month)} {year}</SectionLabel>
          {attLoading && <span className="text-[10px] text-slate-400">Cargando...</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <AttChip label="Total hs" value={hrs.total.toFixed(1)} />
          <AttChip label="Sin feriado" value={hrs.sinFeriado.toFixed(1)} />
          <AttChip label="Feriado hs" value={hrs.feriadoHrs.toFixed(1)} />
          <AttChip label="Nocturnas" value={hrs.nocturnas.toFixed(1)} />
          <AttChip
            label="Adicionales"
            value={hrs.adicionales >= 0 ? `+${hrs.adicionales.toFixed(1)}` : hrs.adicionales.toFixed(1)}
          />
        </div>
      </div>

      {/* Feriado toggle + calcular */}
      <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <div className="relative shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={feriadoBlanco}
              onChange={(e) => { setFeriadoBlanco(e.target.checked); setShowResults(false); }}
            />
            <div className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-slate-900" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-slate-700">Feriado en blanco</span>
        </label>

        <Button
          className="w-full"
          onClick={() => setShowResults(true)}
          disabled={!convenio}
        >
          Calcular sueldo
        </Button>
      </div>

      {/* Resultados */}
      {showResults && calc && (
        <div className="space-y-4">
          {/* EN BLANCO */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
            <div className="bg-slate-100 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Liquidación en Blanco
              </span>
            </div>
            <div className="px-5 py-4 space-y-5">
              <div>
                <SectionLabel>Horas</SectionLabel>
                <ResultRow label="Horas Básico" value={`${hrs.total.toFixed(1)} hs`} />
                <ResultRow label="Horas Adicionales" value={`${Math.max(0, hrs.adicionales).toFixed(1)} hs`} />
              </div>
              <div>
                <SectionLabel>Valores</SectionLabel>
                <ResultRow label="Básico" value={formatCurrency(calc.basico)} />
                <ResultRow label="Valor Hora" value={formatCurrency(calc.valorHora)} />
                <ResultRow label="Feriado" value={formatCurrency(calc.feriadoVal)} />
                <ResultRow label="Presentismo" value={formatCurrency(calc.pres)} />
                <ResultRow label="Antigüedad" value={formatCurrency(calc.antiguedad)} />
                <ResultRow label="Remunerativo" value={formatCurrency(calc.remunerativo)} bold />
                <ResultRow label="Viáticos (No Rem.)" value={formatCurrency(calc.viat)} />
                <ResultRow label="Suma No Remunerativa" value={formatCurrency(calc.snr)} />
                <ResultRow label="No Remunerativo" value={formatCurrency(calc.noRemunerativo)} bold />
              </div>
              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <SectionLabel>Descuentos</SectionLabel>
                <ResultRow label="Jubilación 11%" value={`– ${formatCurrency(calc.jubilacion)}`} red />
                <ResultRow label="Obra Social 3%" value={`– ${formatCurrency(calc.obraSocial)}`} red />
                <ResultRow label="AFIP 3%" value={`– ${formatCurrency(calc.afip)}`} red />
                <ResultRow label="Benef. Convenio 2.38%" value={`– ${formatCurrency(calc.benefConvenio)}`} red />
                <ResultRow label="Total Descuentos" value={`– ${formatCurrency(calc.descuento)}`} bold red />
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4">
              <span className="text-sm font-semibold text-slate-400">Total Blanco</span>
              <span className="text-xl font-black text-white tabular-nums">
                {formatCurrency(calc.totalBlanco)}
              </span>
            </div>
          </div>

          {/* EN NEGRO */}
          <div className="overflow-hidden rounded-3xl">
            <div className="bg-slate-700 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Liquidación en Negro
              </span>
            </div>
            <div className="bg-slate-800 px-5 py-4">
              {[
                ["Valor Hora", formatCurrency(calc.valorHora)],
                ["Valor Hora Nocturna", formatCurrency(calc.valorHoraNocturna)],
                ["Horas en Negro", `${calc.hrsNegro.toFixed(1)} hs`],
                ["Importe Hs en Negro", formatCurrency(calc.hrsNegro * calc.valorHora)],
                ["Horas Nocturnas", `${hrs.nocturnas.toFixed(1)} hs`],
                ["Importe Hs Nocturnas", formatCurrency(hrs.nocturnas * calc.valorHoraNocturna)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-700 py-2.5 last:border-0">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium tabular-nums text-slate-200">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-bold text-slate-200">Total en Negro</span>
                <span className="text-lg font-black tabular-nums text-white">
                  {formatCurrency(calc.totalNegro)}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL FINAL */}
          <div className="flex items-center justify-between rounded-3xl bg-yellow-400 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-900/60">Total Sueldo</p>
              <p className="text-xs text-yellow-900/50 mt-0.5">{monthName(month)} {year}</p>
            </div>
            <span className="text-2xl font-black tabular-nums text-yellow-900">
              {formatCurrency(calc.totalSueldo)}
            </span>
          </div>
        </div>
      )}

      {showResults && !calc && (
        <p className="rounded-3xl bg-white px-5 py-4 text-center text-sm text-slate-400 shadow-soft">
          Seleccioná un convenio para calcular.
        </p>
      )}

      {/* Modal: nuevo convenio */}
      <Modal open={modalOpen} title="Nuevo Convenio Salarial" onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          <Input label="Nombre del convenio" value={form.nombre} onChange={setField("nombre")} placeholder="Ej: CCT Seguridad Junio 2026" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sueldo Básico" type="number" value={form.sueldoBasico} onChange={setField("sueldoBasico")} />
            <Input label="Presentismo" type="number" value={form.presentismo} onChange={setField("presentismo")} />
            <Input label="Viáticos No Rem." type="number" value={form.viaticosNoRem} onChange={setField("viaticosNoRem")} />
            <Input label="Suma No Remunerativa" type="number" value={form.sumaNR} onChange={setField("sumaNR")} />
            <Input label="Años de Antigüedad" type="number" value={form.aniosAntiguedad} onChange={setField("aniosAntiguedad")} />
            <Input label="Vigente desde" type="date" value={form.vigenteDesde} onChange={setField("vigenteDesde")} />
          </div>

          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>
          )}

          <Button className="w-full" onClick={handleSaveConvenio} disabled={saving}>
            {saving ? "Guardando..." : "Guardar convenio"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
