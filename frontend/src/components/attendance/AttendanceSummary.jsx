import { Card } from "../ui/Card";

const META_HOURS = 204;

export function AttendanceSummary({ summary }) {
  const total = Number(summary.totalHours || 0);
  const pct = Math.min(100, Math.round((total / META_HOURS) * 100));
  const remaining = Math.max(0, META_HOURS - total);
  const barColor = total >= META_HOURS ? "bg-green-500" : total >= META_HOURS * 0.8 ? "bg-yellow-400" : "bg-slate-300";

  return (
    <Card className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Horas trabajadas</p>
          <p className="text-xl font-black">{total}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Días trabajados</p>
          <p className="text-xl font-black">{summary.workedDays || 0}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Hs nocturnas</p>
          <p className="text-xl font-black">{summary.totalNightHours || 0}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Días descanso</p>
          <p className="text-xl font-black">{summary.suggestedRestDays || 0}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Feriados</p>
          <p className="text-xl font-black">{summary.totalHolidays || 0}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Fin de semana (8–20)</p>
          <p className="text-xl font-black">{summary.weekendDays || 0}</p>
        </div>
      </div>

      {/* Barra meta 204 hs */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span className="font-semibold">Meta: {META_HOURS} hs</span>
          <span>
            {total >= META_HOURS
              ? <span className="font-bold text-green-600">¡Completado!</span>
              : <span>Faltan <strong>{remaining} hs</strong> ({pct}%)</span>
            }
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
