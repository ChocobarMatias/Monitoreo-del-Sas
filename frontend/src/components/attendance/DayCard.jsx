import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function getTone(day) {
  if (day.is_rest) return "warning";
  if (day.is_holiday) return "danger";
  if (day.is_vacation || day.is_sick_leave) return "success";
  return "default";
}

function getLabel(day) {
  if (day.is_rest) return "Descanso";
  if (day.is_holiday) return "Feriado";
  if (day.is_strike) return "Paro";
  if (day.is_vacation) return "Vacaciones";
  if (day.is_sick_leave) return "Enfermedad";
  return day.shift_type === "NONE" ? "Libre" : day.shift_type;
}

export function DayCard({ day, onAction }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{day.day_name} · {new Date(day.work_date).getDate()}</p>
          <p className="text-xs text-slate-500">Ciclo {day.week_cycle}</p>
        </div>
        <Badge tone={getTone(day)}>{getLabel(day)}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Ingreso</p>
          <p className="font-bold">{day.start_time || "-"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Egreso</p>
          <p className="font-bold">{day.end_time || "-"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Horas</p>
          <p className="font-bold">{day.worked_hours}</p>
        </div>
      </div>

      <button
        onClick={() => onAction(day)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        Acciones del día
      </button>
    </Card>
  );
}