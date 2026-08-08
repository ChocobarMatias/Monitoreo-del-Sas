import { useState } from "react";
import { api } from "../../lib/axios";
import { useSubscriptionStore } from "../../store/subscription.store";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../../components/ui/Button";
import { Copy, MessageCircle } from "lucide-react";

export default function SubscriptionBlockedPage() {
  const status = useSubscriptionStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const [alias, setAlias] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadingAlias, setLoadingAlias] = useState(false);

  async function handleShowAlias() {
    if (alias) return;
    setLoadingAlias(true);
    try {
      const { data } = await api.get("/subscriptions/alias");
      setAlias(data.alias);
    } finally {
      setLoadingAlias(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl =
    "https://wa.me/543816315170?text=Hola%2C+realic%C3%A9+el+pago+de+la+membres%C3%ADa+Guard+App.+Adjunto+comprobante.";

  const isExpired = status === "expired";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Guard App</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">
            {isExpired ? "Tu membresía venció" : "Bienvenido a Guard App"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isExpired
              ? "Tu período anterior venció. Para continuar usando Guard App necesitás renovar tu membresía."
              : "La app para gestionar tu equipo de seguridad. Todo desde el celular."}
          </p>
        </div>

        {!isExpired && (
          <div className="rounded-3xl bg-white p-6 shadow-soft space-y-3">
            <p className="text-sm font-semibold text-slate-800">¿Qué podés hacer?</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span>📋</span> Carga rápida de planillas de horas y asistencia</li>
              <li className="flex gap-2"><span>📋</span> Descarga ilimitada de reportes en PDF</li>
              <li className="flex gap-2"><span>📋</span> Acceso 24/7 desde cualquier celular</li>
              <li className="flex gap-2"><span>💰</span> Cálculo automático de sueldos en blanco y negro</li>
              <li className="flex gap-2"><span>🔑</span> Gestión centralizada de claves de acceso a sucursales</li>
              <li className="flex gap-2"><span>🔔</span> Notificaciones <span className="text-slate-400">(próximamente)</span></li>
            </ul><br />
Tu membresía garantiza que el servicio se mantenga activo, seguro y disponible para todo el equipo las 24 horas.
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-slate-800">Membresía mensual</p>
            <p className="text-2xl font-black text-slate-950">$5.000</p>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Cómo pagar:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Presioná "Mostrar alias" y copialo</li>
              <li>Realizá la transferencia de $5.000</li>
              <li>Enviá el comprobante por WhatsApp</li>
            </ol>
          </div>

          <div className="space-y-2">
            {!alias ? (
              <Button className="w-full" onClick={handleShowAlias} disabled={loadingAlias}>
                {loadingAlias ? "Cargando..." : "Mostrar alias"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="flex-1 font-mono text-sm font-semibold text-slate-800">{alias}</span>
                <button
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                  title="Copiar alias"
                >
                  <Copy size={16} />
                </button>
              </div>
            )}
            {copied && <p className="text-xs text-emerald-600 text-center">¡Alias copiado!</p>}
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle size={16} />
            Enviar comprobante por WhatsApp
          </a>
        </div>

        <button
          onClick={logout}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
