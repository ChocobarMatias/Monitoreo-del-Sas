# Tech Debt Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir 3 bugs de datos/seguridad identificados en auditoría: falsy values silenciosos en keys.service.js, campos faltantes en createKeyService, token de reset en texto plano, y falta de redirección para usuarios autenticados en rutas públicas.

**Architecture:** Task 1 arregla keys.service.js con `??` en lugar de `||` y alinea createKeyService con KEY_FIELDS. Task 2 agrega hashing SHA-256 al token de reset en backend (sin cambios en frontend ni en el flujo visible). Task 3 agrega un componente `PublicOnlyRoute` en frontend para redirigir usuarios autenticados.

**Tech Stack:** Node.js + Express, crypto (built-in), React + React Router DOM v6, Zustand

---

## Contexto de arquitectura relevante

### keys.service.js — estado actual con bugs

```js
const KEY_FIELDS = [
  "numero_sucursal", "nombre", "mec1", "mec2", "mec3", "mec4", "mec5", "mec6",
  "vol", "back1", "back2", "descripcion", "guardia1", "guardia2",
  "telefono_guardia1", "telefono_guardia2", "fecha_actualizacion"
];

async function createKeyService(data) {
  const fields = [
    // BUG 1: telefono_guardia1, telefono_guardia2, fecha_actualizacion ausentes
    "numero_sucursal", "nombre", "mec1", "mec2", "mec3", "mec4", "mec5", "mec6",
    "vol", "back1", "back2", "descripcion", "guardia1", "guardia2"
  ];
  const values = fields.map(f => data[f] || null); // BUG 2: data[f] || null silencia 0 y ""
  ...
}

async function updateKeyService(id, data) {
  const fields = KEY_FIELDS.filter(f => f in data);
  const values = fields.map(f => data[f] || null); // BUG 2: mismo problema
  ...
}
```

### auth.controller.js — token guardado en texto plano

```js
// forgotPasswordService — línea 191-195
await query(
  `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
  [user.id, rawToken, expiresAt]  // BUG: rawToken en texto plano en DB
);

// resetPasswordService — línea 201-207
const rows = await query(
  `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
   FROM password_resets pr WHERE pr.token = ? LIMIT 1`,
  [token]  // BUG: busca rawToken en texto plano
);
```

### ProtectedRoute.jsx — patrón a seguir para PublicOnlyRoute

```jsx
export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isBooting = useAuthStore((state) => state.isBooting);

  if (isBooting) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
```

---

## Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `backend/src/modules/keys/keys.service.js` | Modificar — fix falsy values + alinear createKeyService con KEY_FIELDS |
| `backend/src/modules/auth/auth.controller.js` | Modificar — hash SHA-256 en forgotPasswordService y resetPasswordService |
| `frontend/src/components/common/PublicOnlyRoute.jsx` | Crear — redirige usuarios autenticados a `/` |
| `frontend/src/router.jsx` | Modificar — envolver rutas /login, /forgot-password, /reset-password con PublicOnlyRoute |

---

## Task 1: Corregir keys.service.js — falsy values y campos faltantes

**Files:**
- Modify: `backend/src/modules/keys/keys.service.js`

- [ ] **Step 1: Leer el archivo actual**

Leer `backend/src/modules/keys/keys.service.js` para confirmar estado.

- [ ] **Step 2: Reemplazar el contenido completo del archivo**

```js
const { query } = require("../../config/db");

const KEY_FIELDS = [
  "numero_sucursal", "nombre", "mec1", "mec2", "mec3", "mec4", "mec5", "mec6",
  "vol", "back1", "back2", "descripcion", "guardia1", "guardia2",
  "telefono_guardia1", "telefono_guardia2", "fecha_actualizacion"
];

async function listKeysService() {
  const rows = await query("SELECT * FROM key_records ORDER BY id DESC");
  return rows;
}

async function createKeyService(data) {
  const values = KEY_FIELDS.map(f => data[f] ?? null);
  const result = await query(
    `INSERT INTO key_records (${KEY_FIELDS.join(",")}) VALUES (${KEY_FIELDS.map(_ => "?").join(",")})`,
    values
  );
  return { id: result.insertId };
}

async function updateKeyService(id, data) {
  const fields = KEY_FIELDS.filter(f => f in data);
  if (fields.length === 0) return { updated: 0 };
  const values = [...fields.map(f => data[f] ?? null), id];
  const result = await query(
    `UPDATE key_records SET ${fields.map(f => `${f}=?`).join(",")} WHERE id=?`,
    values
  );
  return { updated: result.affectedRows };
}

async function deleteKeyService(id) {
  const result = await query("DELETE FROM key_records WHERE id=?", [id]);
  return { deleted: result.affectedRows };
}

module.exports = {
  listKeysService,
  createKeyService,
  updateKeyService,
  deleteKeyService
};
```

Cambios respecto al original:
- `createKeyService` ahora usa `KEY_FIELDS` directamente (incluye `telefono_guardia1`, `telefono_guardia2`, `fecha_actualizacion`)
- `data[f] || null` → `data[f] ?? null` en ambas funciones — `??` solo convierte `null`/`undefined`, preserva `0` y `""`

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/keys/keys.service.js
git commit -m "fix(keys): use nullish coalescing and align createKeyService with KEY_FIELDS"
```

---

## Task 2: Hash SHA-256 de tokens de reset de contraseña

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.js`

El flujo visible NO cambia: el frontend sigue recibiendo y mostrando el token crudo. Solo cambia lo que se guarda en la DB: se guarda el hash, y se hashea antes de buscar.

- [ ] **Step 1: Leer auth.controller.js**

Leer `backend/src/modules/auth/auth.controller.js` para confirmar líneas exactas.

- [ ] **Step 2: Modificar forgotPasswordService — guardar hash en DB**

Ubicar la función `forgotPasswordService`. Reemplazar el bloque de generación y guardado del token:

**Antes (líneas ~188-197):**
```js
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, rawToken, expiresAt]
  );

  return { ok: true, token: rawToken };
```

**Después:**
```js
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  return { ok: true, token: rawToken };
```

El `rawToken` sigue devolviéndose al frontend. La DB almacena `tokenHash`.

- [ ] **Step 3: Modificar resetPasswordService — hashear antes de buscar**

Ubicar la función `resetPasswordService`. Reemplazar el SELECT para hashear el token entrante antes de la query:

**Antes (líneas ~200-207):**
```js
async function resetPasswordService(token, newPassword) {
  const rows = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
     FROM password_resets pr
     WHERE pr.token = ?
     LIMIT 1`,
    [token]
  );
```

**Después:**
```js
async function resetPasswordService(token, newPassword) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const rows = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
     FROM password_resets pr
     WHERE pr.token = ?
     LIMIT 1`,
    [tokenHash]
  );
```

El resto de la función (`reset` verification, transacción, etc.) permanece sin cambios.

- [ ] **Step 4: Limpiar tokens existentes en texto plano**

Los tokens existentes en la tabla `password_resets` fueron guardados sin hash y ya no funcionarán con el nuevo sistema. Invalidarlos todos es la acción correcta:

```sql
UPDATE password_resets SET used_at = NOW() WHERE used_at IS NULL;
```

Ejecutar este SQL directo en la base de datos antes de deployar. Documentar en el commit.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.controller.js
git commit -m "fix(auth): hash password reset tokens with SHA-256 before storing in DB"
```

---

## Task 3: Frontend — PublicOnlyRoute para redirigir usuarios autenticados

**Files:**
- Create: `frontend/src/components/common/PublicOnlyRoute.jsx`
- Modify: `frontend/src/router.jsx`

Usuarios con sesión activa que visiten `/login`, `/forgot-password` o `/reset-password` serán redirigidos a `/`.

- [ ] **Step 1: Crear PublicOnlyRoute.jsx**

Crear `frontend/src/components/common/PublicOnlyRoute.jsx`:

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { LoadingScreen } from "../ui/LoadingScreen";

export function PublicOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  const isBooting = useAuthStore((state) => state.isBooting);

  if (isBooting) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
```

Mismo patrón que `ProtectedRoute` pero con la lógica invertida: si `user` existe → redirigir a `/`.

- [ ] **Step 2: Actualizar router.jsx**

Leer `frontend/src/router.jsx` para ver el estado actual y luego reemplazar el contenido completo con:

```jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicOnlyRoute } from "./components/common/PublicOnlyRoute";
import { RoleGuard } from "./components/common/RoleGuard";
import { MobileLayout } from "./components/layout/MobileLayout";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import KeysPage from "./pages/keys/KeysPage";
import SalaryPage from "./pages/salary/SalaryPage";
import ProfilePage from "./pages/profile/ProfilePage";
import UsersPage from "./pages/users/UsersPage";
import NotFoundPage from "./pages/not-found/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ]
      },
      {
        element: <ProtectedRoute />,
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
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/common/PublicOnlyRoute.jsx frontend/src/router.jsx
git commit -m "feat(auth): add PublicOnlyRoute to redirect authenticated users from login pages"
```

---

## Self-Review

### Spec coverage
- [x] `data[f] || null` → `data[f] ?? null` en createKeyService y updateKeyService
- [x] `createKeyService` usa `KEY_FIELDS` (incluye telefono_guardia1/2 y fecha_actualizacion)
- [x] SHA-256 de token antes de guardar en `forgotPasswordService`
- [x] SHA-256 de token recibido antes de buscar en `resetPasswordService`
- [x] Tokens existentes en texto plano invalidados con SQL
- [x] `PublicOnlyRoute` creado con mismo patrón que `ProtectedRoute`
- [x] Router envuelve /login, /forgot-password, /reset-password con `PublicOnlyRoute`

### Placeholder scan
- Sin TBDs ni TODOs
- Todos los bloques de código son completos

### Type consistency
- `PublicOnlyRoute` exportado como named export (igual que `ProtectedRoute`) ✓
- `crypto.createHash("sha256").update(rawToken).digest("hex")` — misma llamada en ambas funciones ✓
- `KEY_FIELDS` usado en `createKeyService` y `updateKeyService` ✓
