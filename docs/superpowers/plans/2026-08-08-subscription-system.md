# Subscription System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de membresía mensual ($5000/mes) que bloquea a usuarios USER sin suscripción activa y permite al ADMIN activar/renovar períodos.

**Architecture:** Tabla `subscriptions` en DB con un registro por período activado. Backend expone 4 endpoints bajo `/api/subscriptions`. Frontend tiene un `SubscriptionGate` que evalúa el estado al montar y renderiza la pantalla de bloqueo o el contenido normal según el rol y suscripción.

**Tech Stack:** Node.js/Express + MySQL (backend), React + Zustand + TanStack Router (frontend), Tailwind CSS, lucide-react

**Spec:** `docs/superpowers/specs/2026-08-08-subscription-system-design.md`

---

## File Map

### Backend — Crear
- `backend/sql/006_subscriptions.sql` — migración de la tabla
- `backend/src/modules/subscription/subscription.service.js` — lógica de negocio
- `backend/src/modules/subscription/subscription.controller.js` — handlers HTTP
- `backend/src/modules/subscription/subscription.routes.js` — registro de rutas

### Backend — Modificar
- `backend/.env` — agregar `PAYMENT_ALIAS`
- `backend/src/config/env.js` — agregar `PAYMENT_ALIAS`
- `backend/src/app.js` — registrar `/api/subscriptions`
- `backend/src/modules/users/users.service.js` — JOIN con subscriptions en listUsersService

### Frontend — Crear
- `frontend/src/store/subscription.store.js` — estado global de suscripción
- `frontend/src/components/common/SubscriptionGate.jsx` — guard de acceso
- `frontend/src/pages/subscription/SubscriptionBlockedPage.jsx` — pantalla de bloqueo/bienvenida

### Frontend — Modificar
- `frontend/src/router.jsx` — insertar SubscriptionGate entre ProtectedRoute y MobileLayout
- `frontend/src/pages/users/UsersPage.jsx` — badge de estado + modal de activación
- `frontend/src/pages/profile/ProfilePage.jsx` — sección "Mi membresía"

---

## Task 1: Migración DB — tabla subscriptions

**Files:**
- Create: `backend/sql/006_subscriptions.sql`

- [ ] **Paso 1: Crear archivo de migración**

```sql
-- backend/sql/006_subscriptions.sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  activated_at  DATE NOT NULL,
  expires_at    DATE NOT NULL,
  activated_by  INT NOT NULL,
  notes         VARCHAR(255) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activated_by) REFERENCES users(id),
  INDEX idx_user_expires (user_id, expires_at)
);
```

- [ ] **Paso 2: Ejecutar la migración en la base de datos**

Conectarse a MySQL y ejecutar el archivo:
```bash
mysql -u root -p guard_app < backend/sql/006_subscriptions.sql
```

Verificar que la tabla existe:
```sql
DESCRIBE subscriptions;
```
Resultado esperado: columnas `id, user_id, activated_at, expires_at, activated_by, notes, created_at`.

- [ ] **Paso 3: Commit**

```bash
git add backend/sql/006_subscriptions.sql
git commit -m "feat(db): add subscriptions table migration"
```

---

## Task 2: Variable de entorno PAYMENT_ALIAS

**Files:**
- Modify: `backend/.env`
- Modify: `backend/src/config/env.js`

- [ ] **Paso 1: Agregar PAYMENT_ALIAS al .env**

Abrir `backend/.env` y agregar al final:
```
PAYMENT_ALIAS=soluxioncode.mp
```
(Reemplazar `soluxioncode.mp` por el alias real si es distinto.)

- [ ] **Paso 2: Exponer PAYMENT_ALIAS en env.js**

En `backend/src/config/env.js`, dentro del objeto `env`, agregar después de `FRONTEND_URL`:

```js
  PAYMENT_ALIAS: process.env.PAYMENT_ALIAS,
```

El objeto `env` queda con esta línea agregada al final (antes del cierre `}`):
```js
const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  MAIL_FROM: process.env.MAIL_FROM,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PAYMENT_ALIAS: process.env.PAYMENT_ALIAS,
};

module.exports = { env };
```

- [ ] **Paso 3: Commit**

```bash
git add backend/src/config/env.js
git commit -m "feat(config): add PAYMENT_ALIAS env var"
```
(No stagear `backend/.env` — está en .gitignore.)

---

## Task 3: Subscription Service

**Files:**
- Create: `backend/src/modules/subscription/subscription.service.js`

- [ ] **Paso 1: Crear el archivo del service**

```js
// backend/src/modules/subscription/subscription.service.js
const { query } = require("../../config/db");
const { env } = require("../../config/env");

async function getStatusService(userId) {
  const rows = await query(
    `SELECT MAX(expires_at) AS expires_at FROM subscriptions WHERE user_id = ?`,
    [userId]
  );

  const expiresAt = rows[0]?.expires_at;
  if (!expiresAt) return { status: "never", expires_at: null, remaining_days: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return { status: "expired", expires_at: expiresAt, remaining_days: 0 };

  const remainingDays = Math.round((expiry - today) / (1000 * 60 * 60 * 24));
  return { status: "active", expires_at: expiresAt, remaining_days: remainingDays };
}

async function getHistoryService(userId) {
  return query(
    `SELECT s.id, s.activated_at, s.expires_at, s.notes, s.created_at,
            u.name AS activated_by_name
     FROM subscriptions s
     JOIN users u ON u.id = s.activated_by
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
}

async function activateSubscriptionService(userId, adminId, { activated_at, expires_at, notes }) {
  await query(
    `INSERT INTO subscriptions (user_id, activated_at, expires_at, activated_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, activated_at, expires_at, adminId, notes || null]
  );
  return { ok: true };
}

function getAliasService() {
  return { alias: env.PAYMENT_ALIAS };
}

module.exports = {
  getStatusService,
  getHistoryService,
  activateSubscriptionService,
  getAliasService,
};
```

- [ ] **Paso 2: Commit**

```bash
git add backend/src/modules/subscription/subscription.service.js
git commit -m "feat(subscription): add subscription service"
```

---

## Task 4: Subscription Controller y Routes

**Files:**
- Create: `backend/src/modules/subscription/subscription.controller.js`
- Create: `backend/src/modules/subscription/subscription.routes.js`

- [ ] **Paso 1: Crear el controller**

```js
// backend/src/modules/subscription/subscription.controller.js
const {
  getStatusService,
  getHistoryService,
  activateSubscriptionService,
  getAliasService,
} = require("./subscription.service");

async function getStatusController(req, res, next) {
  try {
    const result = await getStatusService(req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getHistoryController(req, res, next) {
  try {
    const data = await getHistoryService(req.user.id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function activateSubscriptionController(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const { activated_at, expires_at, notes } = req.body;

    if (!activated_at || !expires_at) {
      const error = new Error("activated_at y expires_at son requeridos");
      error.status = 400;
      throw error;
    }

    const result = await activateSubscriptionService(userId, req.user.id, {
      activated_at,
      expires_at,
      notes,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getAliasController(req, res) {
  res.json({ ok: true, ...getAliasService() });
}

module.exports = {
  getStatusController,
  getHistoryController,
  activateSubscriptionController,
  getAliasController,
};
```

- [ ] **Paso 2: Crear las routes**

```js
// backend/src/modules/subscription/subscription.routes.js
const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const {
  getStatusController,
  getHistoryController,
  activateSubscriptionController,
  getAliasController,
} = require("./subscription.controller");

const router = Router();

router.use(authMiddleware);

router.get("/status",   getStatusController);
router.get("/history",  getHistoryController);
router.get("/alias",    getAliasController);
router.post("/activate/:userId", roleMiddleware("ADMIN"), activateSubscriptionController);

module.exports = router;
```

- [ ] **Paso 3: Commit**

```bash
git add backend/src/modules/subscription/subscription.controller.js backend/src/modules/subscription/subscription.routes.js
git commit -m "feat(subscription): add subscription controller and routes"
```

---

## Task 5: Registrar rutas en app.js

**Files:**
- Modify: `backend/src/app.js`

- [ ] **Paso 1: Agregar import y registro de rutas**

En `backend/src/app.js`, agregar el import junto a los demás:
```js
const subscriptionRoutes = require("./modules/subscription/subscription.routes");
```

Y agregar el `app.use` después de `keysRoutes`:
```js
app.use("/api/subscriptions", subscriptionRoutes);
```

El bloque de rutas queda:
```js
app.use("/api/auth",          authRoutes);
app.use("/api/users",         usersRoutes);
app.use("/api/attendance",    attendanceRoutes);
app.use("/api/salary",        salaryRoutes);
app.use("/api/keys",          keysRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/pin",           pinRoutes);
app.use("/api/apikey",        apikeyRoutes);
```

- [ ] **Paso 2: Verificar que el servidor arranca sin errores**

```bash
cd backend && npm run dev
```

Probar: `GET http://localhost:4000/api/health` → `{ "ok": true }`

- [ ] **Paso 3: Commit**

```bash
git add backend/src/app.js
git commit -m "feat(subscription): register /api/subscriptions routes"
```

---

## Task 6: Actualizar listUsersService con datos de suscripción

**Files:**
- Modify: `backend/src/modules/users/users.service.js`

- [ ] **Paso 1: Actualizar la query de listUsersService**

Reemplazar la función `listUsersService` en `backend/src/modules/users/users.service.js`:

```js
async function listUsersService() {
  return query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active,
            u.cycle_start_date, u.initial_week_type, u.grupo_sas_id,
            g.nome AS grupo_nombre, g.tipo_inicio AS grupo_tipo_inicio,
            s.expires_at AS sub_expires_at,
            CASE
              WHEN s.expires_at IS NULL       THEN 'never'
              WHEN s.expires_at < CURDATE()   THEN 'expired'
              ELSE 'active'
            END AS sub_status,
            GREATEST(0, DATEDIFF(s.expires_at, CURDATE())) AS sub_remaining_days
     FROM users u
     LEFT JOIN grupos_sas g ON g.id = u.grupo_sas_id
     LEFT JOIN (
       SELECT user_id, MAX(expires_at) AS expires_at
       FROM subscriptions
       GROUP BY user_id
     ) s ON s.user_id = u.id
     ORDER BY u.name ASC`
  );
}
```

- [ ] **Paso 2: Verificar endpoint**

Con el servidor corriendo:
```
GET http://localhost:4000/api/users
Authorization: Bearer <token_admin>
```

Cada usuario del response debe incluir: `sub_expires_at`, `sub_status` ("never"/"expired"/"active"), `sub_remaining_days`.

- [ ] **Paso 3: Commit**

```bash
git add backend/src/modules/users/users.service.js
git commit -m "feat(users): include subscription status in listUsersService"
```

---

## Task 7: Subscription Store (Frontend)

**Files:**
- Create: `frontend/src/store/subscription.store.js`

- [ ] **Paso 1: Crear el store**

```js
// frontend/src/store/subscription.store.js
import { create } from "zustand";
import { api } from "../lib/axios";

export const useSubscriptionStore = create((set) => ({
  status: null,        // null | "active" | "expired" | "never"
  expiresAt: null,
  remainingDays: 0,

  fetchStatus: async () => {
    try {
      const { data } = await api.get("/subscriptions/status");
      set({
        status: data.status,
        expiresAt: data.expires_at,
        remainingDays: data.remaining_days,
      });
    } catch {
      set({ status: "never", expiresAt: null, remainingDays: 0 });
    }
  },

  reset: () => set({ status: null, expiresAt: null, remainingDays: 0 }),
}));
```

- [ ] **Paso 2: Commit**

```bash
git add frontend/src/store/subscription.store.js
git commit -m "feat(subscription): add subscription Zustand store"
```

---

## Task 8: SubscriptionBlockedPage

**Files:**
- Create: `frontend/src/pages/subscription/SubscriptionBlockedPage.jsx`

- [ ] **Paso 1: Crear el componente**

```jsx
// frontend/src/pages/subscription/SubscriptionBlockedPage.jsx
import { useState } from "react";
import { api } from "../../lib/axios";
import { useSubscriptionStore } from "../../store/subscription.store";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../../components/ui/Button";
import { Copy, MessageCircle, ChevronDown } from "lucide-react";

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

        {/* Header */}
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

        {/* Funcionalidades (solo para nuevos) */}
        {!isExpired && (
          <div className="rounded-3xl bg-white p-6 shadow-soft space-y-3">
            <p className="text-sm font-semibold text-slate-800">¿Qué podés hacer?</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span>📋</span> Planillas de horas y asistencia</li>
              <li className="flex gap-2"><span>💰</span> Cálculo automático de sueldos</li>
              <li className="flex gap-2"><span>🔑</span> Gestión de claves de acceso a sucursales</li>
              <li className="flex gap-2"><span>🔔</span> Notificaciones <span className="text-slate-400">(próximamente)</span></li>
            </ul>
          </div>
        )}

        {/* Pago */}
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

          {/* Alias */}
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

          {/* WhatsApp */}
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
```

- [ ] **Paso 2: Commit**

```bash
git add frontend/src/pages/subscription/SubscriptionBlockedPage.jsx
git commit -m "feat(subscription): add SubscriptionBlockedPage"
```

---

## Task 9: SubscriptionGate

**Files:**
- Create: `frontend/src/components/common/SubscriptionGate.jsx`

- [ ] **Paso 1: Crear el componente**

```jsx
// frontend/src/components/common/SubscriptionGate.jsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useSubscriptionStore } from "../../store/subscription.store";
import SubscriptionBlockedPage from "../../pages/subscription/SubscriptionBlockedPage";

export function SubscriptionGate() {
  const user = useAuthStore((s) => s.user);
  const { status, fetchStatus } = useSubscriptionStore();

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      fetchStatus();
    }
  }, [user]);

  if (user?.role === "ADMIN") return <Outlet />;
  if (status === null) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );
  if (status === "active") return <Outlet />;
  return <SubscriptionBlockedPage />;
}
```

- [ ] **Paso 2: Commit**

```bash
git add frontend/src/components/common/SubscriptionGate.jsx
git commit -m "feat(subscription): add SubscriptionGate component"
```

---

## Task 10: Actualizar router.jsx

**Files:**
- Modify: `frontend/src/router.jsx`

- [ ] **Paso 1: Insertar SubscriptionGate en el árbol de rutas**

Agregar el import al principio de `frontend/src/router.jsx`:
```jsx
import { SubscriptionGate } from "./components/common/SubscriptionGate";
```

Modificar el árbol de rutas protegidas para que SubscriptionGate envuelva MobileLayout:

```jsx
{
  element: <ProtectedRoute />,
  children: [
    {
      element: <SubscriptionGate />,
      children: [
        {
          element: <MobileLayout />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: "/attendance", element: <AttendancePage /> },
            { path: "/keys", element: <KeysPage /> },
            { path: "/salary", element: <SalaryPage /> },
            { path: "/profile", element: <ProfilePage /> },
            {
              path: "/users",
              element: (
                <RoleGuard roles={["ADMIN"]}>
                  <UsersPage />
                </RoleGuard>
              )
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Paso 2: Verificar que la app compila**

```bash
cd frontend && npm run dev
```

Loguearse como USER sin suscripción → debe aparecer `SubscriptionBlockedPage`.
Loguearse como ADMIN → debe ir directo al dashboard.

- [ ] **Paso 3: Commit**

```bash
git add frontend/src/router.jsx
git commit -m "feat(subscription): insert SubscriptionGate into router"
```

---

## Task 11: Actualizar UsersPage (ADMIN)

**Files:**
- Modify: `frontend/src/pages/users/UsersPage.jsx`

- [ ] **Paso 1: Agregar badge de estado de suscripción en la lista de usuarios**

En `UsersPage.jsx`, agregar función helper y badge en cada fila de usuario. Agregar este helper antes del componente principal:

```jsx
function SubBadge({ status, remainingDays }) {
  if (status === "active") return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Activo · {remainingDays}d
    </span>
  );
  if (status === "expired") return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Vencido
    </span>
  );
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Sin membresía
    </span>
  );
}
```

- [ ] **Paso 2: Agregar estado y modal de activación**

En el componente `UsersPage`, agregar estos estados:
```jsx
const [activateTarget, setActivateTarget] = useState(null); // { id, name }
const [activateForm, setActivateForm] = useState({
  activated_at: new Date().toISOString().slice(0, 10),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  notes: "",
});
const [activating, setActivating] = useState(false);
```

Y la función de activación:
```jsx
async function handleActivate() {
  if (!activateTarget) return;
  setActivating(true);
  try {
    await api.post(`/subscriptions/activate/${activateTarget.id}`, activateForm);
    setActivateTarget(null);
    setActivateForm({
      activated_at: new Date().toISOString().slice(0, 10),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: "",
    });
    fetchUsers();
  } catch (err) {
    alert(err.response?.data?.message || "Error al activar");
  } finally {
    setActivating(false);
  }
}
```

- [ ] **Paso 3: Agregar columna "Membresía" y botón "Activar" en la tabla de usuarios**

En la tabla de la lista de usuarios, agregar una nueva celda para cada usuario que muestre el badge y el botón. En el `<tr>` de cada usuario agregar al final:

```jsx
<td className="px-3 py-2 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <SubBadge status={u.sub_status} remainingDays={u.sub_remaining_days} />
    <button
      onClick={() => setActivateTarget({ id: u.id, name: u.name })}
      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
    >
      Activar
    </button>
  </div>
</td>
```

Y en el `<thead>` agregar el encabezado:
```jsx
<th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Membresía</th>
```

- [ ] **Paso 4: Agregar el modal de activación**

Al final del JSX del componente (antes del `</div>` de cierre), agregar:

```jsx
{/* Modal activar suscripción */}
<Modal
  open={!!activateTarget}
  onClose={() => setActivateTarget(null)}
  title={`Activar membresía — ${activateTarget?.name}`}
>
  <div className="space-y-3">
    <Input
      label="Fecha inicio"
      type="date"
      value={activateForm.activated_at}
      onChange={(e) => setActivateForm((p) => ({ ...p, activated_at: e.target.value }))}
    />
    <Input
      label="Fecha fin"
      type="date"
      value={activateForm.expires_at}
      onChange={(e) => setActivateForm((p) => ({ ...p, expires_at: e.target.value }))}
    />
    <Input
      label="Notas (opcional)"
      value={activateForm.notes}
      placeholder="ej: acceso gratuito, período de prueba"
      onChange={(e) => setActivateForm((p) => ({ ...p, notes: e.target.value }))}
    />
    <Button className="w-full" onClick={handleActivate} disabled={activating}>
      {activating ? "Activando..." : "Confirmar activación"}
    </Button>
  </div>
</Modal>
```

Asegurarse de que `Modal` está importado: `import { Modal } from "../../components/ui/Modal";`

- [ ] **Paso 5: Commit**

```bash
git add frontend/src/pages/users/UsersPage.jsx
git commit -m "feat(users): add subscription badge and activation modal for ADMIN"
```

---

## Task 12: Actualizar ProfilePage (USER)

**Files:**
- Modify: `frontend/src/pages/profile/ProfilePage.jsx`

- [ ] **Paso 1: Agregar sección "Mi membresía" con estado e historial**

Reemplazar el contenido completo de `frontend/src/pages/profile/ProfilePage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useSubscriptionStore } from "../../store/subscription.store";
import { api } from "../../lib/axios";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("es-AR");
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { status, expiresAt, remainingDays, fetchStatus } = useSubscriptionStore();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      fetchStatus();
      api.get("/subscriptions/history").then(({ data }) => setHistory(data.data || []));
    }
  }, [user]);

  async function savePin() {
    await api.post("/auth/set-pin", { pin });
    setMessage("PIN guardado correctamente.");
    setPin("");
  }

  return (
    <div className="space-y-4">
      {/* Info de usuario */}
      <div className="rounded-3xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
        <p className="text-sm text-slate-500">{user?.email}</p>
        <p className="mt-1 text-xs text-slate-500">Rol: {user?.role}</p>
      </div>

      {/* Membresía (solo USER) */}
      {user?.role !== "ADMIN" && (
        <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-slate-800">Mi membresía</p>

          {status === "active" && (
            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Activa
              </span>
              <p className="text-sm text-slate-600">Vence el: <span className="font-medium">{formatDate(expiresAt)}</span></p>
              <p className="text-sm text-slate-600">Días restantes: <span className="font-medium">{remainingDays}</span></p>
            </div>
          )}

          {(status === "expired" || status === "never") && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {status === "expired" ? "Vencida" : "Sin membresía"}
            </span>
          )}

          {history.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Historial</p>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-slate-100 p-3 text-xs text-slate-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Inicio: <span className="font-medium">{formatDate(h.activated_at)}</span></span>
                      <span>Fin: <span className="font-medium">{formatDate(h.expires_at)}</span></span>
                    </div>
                    {h.notes && <p className="text-slate-400">Nota: {h.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PIN */}
      <div className="rounded-3xl bg-white p-4 shadow-soft space-y-3">
        <Input
          label="Configurar PIN"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Nuevo PIN"
        />
        <Button className="w-full" onClick={savePin}>Guardar PIN</Button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </div>

      <Button variant="danger" className="w-full" onClick={logout}>Cerrar sesión</Button>
    </div>
  );
}
```

- [ ] **Paso 2: Commit**

```bash
git add frontend/src/pages/profile/ProfilePage.jsx
git commit -m "feat(profile): add subscription status and history section"
```

---

## Task 13: Verificación final

- [ ] **Paso 1: Smoke test completo**

Con backend y frontend corriendo, verificar:

| Escenario | Resultado esperado |
|-----------|-------------------|
| Login como ADMIN | Va directo al dashboard, sin gate |
| Login como USER sin suscripción | Ve `SubscriptionBlockedPage` con mensaje de bienvenida |
| USER con suscripción vencida | Ve `SubscriptionBlockedPage` con mensaje de vencimiento |
| USER con suscripción activa | Va directo al dashboard |
| Botón "Mostrar alias" | Aparece el alias del .env |
| Botón "Enviar comprobante por WhatsApp" | Abre wa.me con mensaje pre-cargado |
| ADMIN activa suscripción a USER | Badge cambia a "Activo · 30d", usuario puede acceder |
| ADMIN da acceso gratuito (fecha fin custom + nota) | Funciona igual, nota aparece en historial |
| ProfilePage USER activo | Muestra estado activo, días restantes, historial |
| ProfilePage USER vencido | Muestra estado vencido, historial |

- [ ] **Paso 2: Commit final si hay ajustes menores**

```bash
git add -A
git commit -m "fix: subscription system final adjustments"
```
