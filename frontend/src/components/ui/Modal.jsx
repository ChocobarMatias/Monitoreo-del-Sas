export function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-soft sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-sm text-slate-500">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}