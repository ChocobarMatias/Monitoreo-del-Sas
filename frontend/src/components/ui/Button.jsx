import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50",
        variant === "primary" && "bg-slate-950 text-white",
        variant === "secondary" && "bg-white text-slate-900 shadow-soft",
        variant === "ghost" && "bg-transparent text-slate-700",
        variant === "danger" && "bg-red-600 text-white",
        className
      )}
      {...props}
    />
  );
}