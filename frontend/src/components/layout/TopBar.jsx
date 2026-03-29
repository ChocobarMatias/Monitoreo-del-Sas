import { Bell, Download } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export function TopBar({ title, rightSlot }) {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Guard App</p>
          <h1 className="text-lg font-black text-slate-950">{title}</h1>
          <p className="text-xs text-slate-500">Hola, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <button className="rounded-2xl bg-white p-3 shadow-soft">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}