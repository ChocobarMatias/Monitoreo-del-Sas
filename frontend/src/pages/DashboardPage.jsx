import { useState } from 'react';
import { MobileCard } from '../components/MobileCard';
import { useAttendanceStore } from '../store/useAttendanceStore';

export function DashboardPage() {
  const [filters, setFilters] = useState({ userId: 1, year: 2026, month: 3, deductions: 0 });
  const { records, salary, generate, calculateSalary } = useAttendanceStore();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-3">
      <MobileCard title="Attendance Generation">
        <button className="w-full rounded bg-indigo-600 p-2 text-white" onClick={() => generate(filters.userId, filters.year, filters.month)}>
          Generate Monthly Attendance
        </button>
      </MobileCard>

      <MobileCard title="Salary Calculator">
        <button className="w-full rounded bg-emerald-600 p-2 text-white" onClick={() => calculateSalary(filters.userId, filters.year, filters.month, filters.deductions)}>
          Calculate Salary
        </button>
        {salary ? <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(salary, null, 2)}</pre> : null}
      </MobileCard>

      <MobileCard title="Records">
        <ul className="space-y-2 text-sm">
          {records.slice(0, 7).map((record) => (
            <li key={record.workDate} className="rounded bg-slate-100 p-2">
              {record.workDate}: {record.shiftStart}-{record.shiftEnd} ({record.hours}h)
            </li>
          ))}
        </ul>
      </MobileCard>
    </main>
  );
}
