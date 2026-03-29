import { Card } from "../ui/Card";
import { formatCurrency } from "../../lib/utils";

export function SalarySummaryCard({ data }) {
  return (
    <Card className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Base</p>
          <p className="font-bold">{formatCurrency(data.basePay)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Extras</p>
          <p className="font-bold">{formatCurrency(data.extraPay)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Nocturnas</p>
          <p className="font-bold">{formatCurrency(data.nightBonus)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Feriados</p>
          <p className="font-bold">{formatCurrency(data.holidayPay)}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Total estimado</p>
        <p className="mt-2 text-2xl font-black">{formatCurrency(data.total)}</p>
      </div>
    </Card>
  );
}