import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-3xl bg-white p-6 text-center shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">404</h1>
        <p className="mt-2 text-sm text-slate-500">Esta ruta se fue de ronda sin avisar.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver al inicio</Link>
      </div>
    </div>
  );
}