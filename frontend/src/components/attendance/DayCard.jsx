const ROW_BG = {
  holiday: "bg-yellow-50",
  rest: "bg-slate-100 text-slate-400",
  strike: "bg-orange-50",
  vacation: "bg-green-50",
  sick: "bg-blue-50",
  free: "bg-slate-50 text-slate-400",
  work: "bg-white",
};

function rowBg(day) {
  if (day.is_holiday) return ROW_BG.holiday;
  if (day.is_rest) return ROW_BG.rest;
  if (day.is_strike) return ROW_BG.strike;
  if (day.is_vacation) return ROW_BG.vacation;
  if (day.is_sick_leave) return ROW_BG.sick;
  if (day.shift_type === "NONE") return ROW_BG.free;
  return ROW_BG.work;
}

function statusTag(day) {
  if (day.is_holiday) return <span className="ml-1 text-[9px] font-bold text-yellow-700 bg-yellow-200 rounded px-1">FER</span>;
  if (day.is_rest) return <span className="ml-1 text-[9px] font-bold text-slate-500 bg-slate-200 rounded px-1">DESC</span>;
  if (day.is_strike) return <span className="ml-1 text-[9px] font-bold text-orange-700 bg-orange-200 rounded px-1">PARO</span>;
  if (day.is_vacation) return <span className="ml-1 text-[9px] font-bold text-green-700 bg-green-200 rounded px-1">VAC</span>;
  if (day.is_sick_leave) return <span className="ml-1 text-[9px] font-bold text-blue-700 bg-blue-200 rounded px-1">ENF</span>;
  return null;
}

export function DayRow({ day, index, onEdit }) {
  return (
    <tr className={`border-b border-slate-200 ${rowBg(day)}`}>
      <td className="px-2 py-2 text-center text-xs font-bold text-slate-500 w-8">{index + 1}</td>
      <td className="px-2 py-2 text-xs font-semibold">
        {day.day_name}
        {statusTag(day)}
      </td>
      <td className="px-2 py-2 text-center text-xs font-mono">{day.start_time || "—"}</td>
      <td className="px-2 py-2 text-center text-xs font-mono">{day.end_time || "—"}</td>
      <td className="px-2 py-2 text-center text-xs font-bold">{day.worked_hours > 0 ? day.worked_hours : "—"}</td>
      <td className="px-1 py-1 text-center">
        <button
          onClick={() => onEdit?.(day.work_date)}
          className="rounded-lg bg-yellow-400 px-2 py-1 text-[10px] font-bold text-slate-900 hover:bg-yellow-500 active:bg-yellow-600"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}
