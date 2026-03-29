import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { AttendanceSummary } from "../../components/attendance/AttendanceSummary";
import { DayCard } from "../../components/attendance/DayCard";
import { OverrideActionSheet } from "../../components/attendance/OverrideActionSheet";

import { api } from "../../lib/axios";

export default function AttendancePage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  async function fetchMonth() {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/${year}/${month}`);
      const payload = data?.data || {};
      const monthRows = Array.isArray(payload?.data) ? payload.data : [];

      if (!monthRows.length) {
        await api.post("/attendance/generate", { year, month });
        const regenerated = await api.get(`/attendance/${year}/${month}`);
        const regeneratedPayload = regenerated?.data?.data || {};
        setRows(Array.isArray(regeneratedPayload?.data) ? regeneratedPayload.data : []);
        setSummary(regeneratedPayload?.summary || {});
      } else {
        setRows(monthRows);
        setSummary(payload?.summary || {});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonth();
    // eslint-disable-next-line
  }, [year, month]);

  function downloadPdf() {
    window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/attendance/${year}/${month}/pdf`, "_blank");
  }

  function monthName(m) {
    return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][m - 1];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
        <Button variant="secondary" onClick={() => setMonth((m) => (m === 1 ? 12 : m - 1))}>Mes anterior</Button>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-soft">
          {monthName(month)} {year}
        </div>
        <Button variant="secondary" onClick={() => setMonth((m) => (m === 12 ? 1 : m + 1))}>Mes siguiente</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" className="gap-2" onClick={fetchMonth}>Recalcular</Button>
        <Button className="gap-2" onClick={downloadPdf}>PDF</Button>
      </div>

      <AttendanceSummary summary={summary} />

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-center shadow-soft">
          <p className="text-sm text-slate-500">Calculando cronograma...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((day) => (
            <DayCard key={day.id} day={day} onAction={setSelectedDay} />
          ))}
        </div>
      )}

      <OverrideActionSheet
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        day={selectedDay}
        year={year}
        month={month}
        onSuccess={fetchMonth}
      />
    </div>
  );
}