import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { AttendanceSummary } from "../../components/attendance/AttendanceSummary";
import { DayRow } from "../../components/attendance/DayCard";
import { OverrideActionSheet } from "../../components/attendance/OverrideActionSheet";
import { api } from "../../lib/axios";

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function sortByDate(rows) {
  return [...rows].sort((a, b) => a.work_date.localeCompare(b.work_date));
}

export default function AttendancePage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [editDate, setEditDate] = useState(null);

  async function fetchMonth() {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/${year}/${month}`);
      const payload = data?.data || {};
      const monthRows = Array.isArray(payload?.data) ? payload.data : [];

      if (!monthRows.length) {
        await api.post("/attendance/generate", { year, month });
        const regenerated = await api.get(`/attendance/${year}/${month}`);
        const rp = regenerated?.data?.data || {};
        setRows(sortByDate(Array.isArray(rp?.data) ? rp.data : []));
        setSummary(rp?.summary || {});
      } else {
        setRows(sortByDate(monthRows));
        setSummary(payload?.summary || {});
      }
    } finally {
      setLoading(false);
    }
  }

  async function recalculate() {
    setLoading(true);
    try {
      const { data } = await api.post("/attendance/generate", { year, month });
      const payload = data?.data || {};
      setRows(sortByDate(Array.isArray(payload?.data) ? payload.data : []));
      setSummary(payload?.summary || {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonth();
    // eslint-disable-next-line
  }, [year, month]);

  async function downloadPdf() {
    try {
      const response = await api.get(`/attendance/${year}/${month}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte-${year}-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error descargando PDF:", err);
    }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function handleEditDay(workDate) {
    setEditDate(workDate);
    setOverrideOpen(true);
  }

  function handleCloseOverride() {
    setOverrideOpen(false);
    setEditDate(null);
  }

  return (
    <div className="space-y-4">
      {/* Navegación de mes */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="px-3" onClick={prevMonth}>‹</Button>
        <div className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold shadow-soft">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <Button variant="secondary" className="px-3" onClick={nextMonth}>›</Button>
      </div>

      {/* Acciones globales */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={recalculate}>Recalcular</Button>
        <Button onClick={() => setOverrideOpen(true)}>Configurar día</Button>
        <Button variant="secondary" onClick={downloadPdf}>PDF</Button>
      </div>

      <AttendanceSummary summary={summary} />

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-slate-500">Calculando cronograma...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-yellow-400 text-slate-900">
                <th className="w-8 px-2 py-2.5 text-center text-xs font-bold">N°</th>
                <th className="px-2 py-2.5 text-xs font-bold">Día</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold">Ingreso</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold">Egreso</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold">Hs</th>
                <th className="px-2 py-2.5 text-center text-xs font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((day, i) => (
                <DayRow key={day.id ?? day.work_date} day={day} index={i} onEdit={handleEditDay} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OverrideActionSheet
        open={overrideOpen}
        onClose={handleCloseOverride}
        days={rows}
        year={year}
        month={month}
        onSuccess={fetchMonth}
        initialDate={editDate}
      />
    </div>
  );
}
