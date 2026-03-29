import { useState } from "react";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SalarySummaryCard } from "../../components/salary/SalarySummaryCard";

export default function SalaryPage() {
  const now = new Date();
  const [form, setForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    scaleId: 1
  });
  const [result, setResult] = useState(null);

  async function calculate() {
    const { data } = await api.post("/salary/calculate", form);
    setResult(data.data);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Input label="Año" type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))} />
        <Input label="Mes" type="number" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: Number(e.target.value) }))} />
        <Input label="Escala ID" type="number" value={form.scaleId} onChange={(e) => setForm((p) => ({ ...p, scaleId: Number(e.target.value) }))} />
      </div>
      <Button className="w-full" onClick={calculate}>Calcular sueldo</Button>
      {result ? <SalarySummaryCard data={result} /> : null}
    </div>
  );
}