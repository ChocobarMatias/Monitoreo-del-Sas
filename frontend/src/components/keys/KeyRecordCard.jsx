import { Card } from "../ui/Card";

export function KeyRecordCard({ item }) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">{item.nombre}</h3>
        <span className="text-xs text-slate-500">{item.fecha_actualizacion ? new Date(item.fecha_actualizacion).toLocaleDateString("es-AR") : "-"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <p><span className="font-semibold">Guardia 1:</span> {item.guardia1 || "-"}</p>
        <p><span className="font-semibold">Guardia 2:</span> {item.guardia2 || "-"}</p>
        <p><span className="font-semibold">MEC1:</span> {item.mec1 || "-"}</p>
        <p><span className="font-semibold">MEC2:</span> {item.mec2 || "-"}</p>
        <p><span className="font-semibold">VOL:</span> {item.vol || "-"}</p>
        <p><span className="font-semibold">BACK1:</span> {item.back1 || "-"}</p>
      </div>
      <p className="text-xs text-slate-600">{item.descripcion || "Sin descripción"}</p>
    </Card>
  );
}