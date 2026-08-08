import { cn } from "../../lib/utils";

export function Input({ label, error, className, ...props }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        className={cn(
          "h-12 w-full rounded-2xl border bg-white px-4 outline-none transition",
          error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-400",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}