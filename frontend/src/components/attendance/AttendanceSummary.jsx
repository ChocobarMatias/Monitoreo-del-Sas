import { Card } from "../ui/Card";

export function AttendanceSummary({ summary }) {
  return (
    <Card className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Horas totales</p>
        <p className="text-xl font-black">{summary.totalHours || 0}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Nocturnas</p>
        <p className="text-xl font-black">{summary.totalNightHours || 0}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Feriado pagado</p>
        <p className="text-xl font-black">{summary.totalHolidayHours || 0}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Descansos sugeridos</p>
        <p className="text-xl font-black">{summary.suggestedRestDays || 0}</p>
      </div>
    </Card>
  );
}