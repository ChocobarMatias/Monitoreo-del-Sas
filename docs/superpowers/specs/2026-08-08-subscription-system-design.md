# Subscription System — Design Spec

> Fecha: 2026-08-08
> Proyecto: Monitoreo-del-Sas (Guard App)

## Resumen

Sistema de membresía mensual ($5000/mes) para usuarios con rol USER. Los usuarios deben pagar para acceder a la app. El ADMIN activa/renueva manualmente al recibir el comprobante de pago. Si la membresía vence, el usuario queda bloqueado hasta que el ADMIN reactive.

---

## 1. Base de Datos

### Nueva tabla: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  activated_at  DATE NOT NULL,
  expires_at    DATE NOT NULL,
  activated_by  INT NOT NULL,
  notes         VARCHAR(255) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activated_by) REFERENCES users(id),
  INDEX idx_user_expires (user_id, expires_at)
);
```

**Reglas:**
- La suscripción activa = registro con `expires_at >= CURDATE()` más reciente
- Múltiples períodos solapados → se toma el `expires_at` más lejano
- No hay campos en `users` — `is_active` mantiene su semántica actual (cuenta habilitada/deshabilitada)

### Variable de entorno nueva

```
PAYMENT_ALIAS=soluxioncode.mp
```

Agregar a `backend/.env` y `backend/src/config/env.js`.

---

## 2. Backend

### Módulo: `backend/src/modules/subscription/`

**Archivos a crear:**
- `subscription.service.js`
- `subscription.controller.js`
- `subscription.routes.js`

**Registrar en `backend/src/app.js`:** `app.use("/api/subscriptions", subscriptionRoutes)`

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/subscriptions/status` | authMiddleware | Estado de suscripción del usuario autenticado |
| GET | `/api/subscriptions/history` | authMiddleware | Historial de períodos del usuario autenticado |
| POST | `/api/subscriptions/activate/:userId` | authMiddleware + roleMiddleware("ADMIN") | Activar/renovar suscripción |
| GET | `/api/subscriptions/alias` | authMiddleware | Devuelve PAYMENT_ALIAS del .env |

### Contratos de datos

**GET /status — response:**
```json
{
  "ok": true,
  "status": "active" | "expired" | "never",
  "expires_at": "2026-09-07",
  "remaining_days": 30
}
```
- `"never"`: nunca tuvo suscripción
- `"expired"`: tuvo pero venció (`expires_at < hoy`)
- `"active"`: tiene suscripción vigente

**GET /history — response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "activated_at": "2026-08-08",
      "expires_at": "2026-09-07",
      "notes": "primer pago",
      "activated_by_name": "Matias Chocobar",
      "created_at": "2026-08-08T..."
    }
  ]
}
```

**POST /activate/:userId — body:**
```json
{
  "activated_at": "2026-08-08",
  "expires_at": "2026-09-07",
  "notes": "acceso gratuito - período de prueba"
}
```

**GET /alias — response:**
```json
{ "ok": true, "alias": "soluxioncode.mp" }
```

---

## 3. Frontend

### 3.1 Store de suscripción

**`frontend/src/store/subscription.store.js`** — Zustand store (sin persist):
```js
{
  status: null,        // "active" | "expired" | "never" | null (loading)
  expiresAt: null,
  remainingDays: null,
  fetchStatus: async () => { ... }
}
```

### 3.2 SubscriptionGate

**`frontend/src/components/common/SubscriptionGate.jsx`**

Lógica:
1. Si `user.role === "ADMIN"` → renderiza `<Outlet />` directamente (sin consulta)
2. Si `status === null` → loading spinner
3. Si `status === "active"` → renderiza `<Outlet />`
4. Si `status === "expired"` o `"never"` → renderiza `<SubscriptionBlockedPage />`

Se coloca **dentro** de `ProtectedRoute` en el router, reemplazando o envolviendo `MobileLayout`.

### 3.3 SubscriptionBlockedPage

**`frontend/src/pages/subscription/SubscriptionBlockedPage.jsx`**

Contenido según `status`:

**Si `"never"` (primera vez):**
- Título: "Bienvenido a Guard App"
- Descripción de la app: planillas de horas, cálculo de sueldo, claves de acceso a sucursales, notificaciones (próximamente)
- Sección de pago

**Si `"expired"` (vencida):**
- Título: "Tu membresía venció"
- Mensaje: "Tu período anterior venció. Para continuar usando Guard App necesitás renovar."
- Sección de pago (idéntica)

**Sección de pago (compartida):**
- Precio: $5.000/mes
- Botón "Mostrar alias" → llama GET /subscriptions/alias → muestra alias copiable
- Instrucciones:
  1. Copiar el alias
  2. Transferir $5.000
  3. Mandar WhatsApp al 3816315170 con el comprobante
- Botón "Enviar comprobante por WhatsApp" → abre `https://wa.me/543816315170?text=Hola%2C+realic%C3%A9+el+pago+de+la+membres%C3%ADa+Guard+App.+Adjunto+comprobante.`

### 3.4 UsersPage — cambios para ADMIN

En la tabla de usuarios, cada fila agrega:
- **Badge de estado:** `Activo (N días)` en verde / `Vencido` en rojo / `Sin suscripción` en gris
- **Botón "Activar":** abre `ActivateSubscriptionModal`

**`ActivateSubscriptionModal`** (componente local en UsersPage):
- Campo: Fecha inicio (date input, default = hoy)
- Campo: Fecha fin (date input, default = hoy + 30 días)
- Campo: Notas (text input, opcional, placeholder "ej: acceso gratuito, período de prueba")
- Botón "Confirmar" → POST /subscriptions/activate/:userId → cierra modal → refresca lista

La tabla muestra `expires_at` y `remaining_days` de la suscripción activa de cada usuario. El backend los incluye directamente en `listUsersService` via LEFT JOIN con `subscriptions` (subconsulta con el expires_at más reciente >= hoy). Sin llamadas extra del frontend.

### 3.5 ProfilePage — cambios para USER

Nueva sección "Mi membresía" debajo del PIN:

**Si activo:**
- Badge verde "Activa"
- "Vence el: 07/09/2026"
- "Días restantes: 30"

**Si vencida o nunca:**
- Badge rojo "Vencida" / gris "Sin membresía"
- Botón "¿Cómo pagar?" → abre SubscriptionBlockedPage o un sheet con instrucciones

**Historial:**
- Tabla: Período | Vencimiento | Notas | Estado
- Datos de GET /subscriptions/history

---

## 4. Casos Borde

| Caso | Comportamiento |
|------|---------------|
| ADMIN siempre pasa | No se consulta /status para role=ADMIN |
| Dos períodos solapados | Se usa el `expires_at` más lejano |
| Usuario nuevo (`"never"`) | Ve pantalla de bienvenida completa |
| Membresía vence durante sesión activa | Al refrescar/navegar, SubscriptionGate re-evalúa y bloquea |
| ADMIN da acceso gratuito | Misma UI, fecha fin personalizada, notas "gratuito" |
| WhatsApp | Link `wa.me` con mensaje pre-cargado, sin backend |

---

## 5. Archivos a Crear/Modificar

### Backend (crear)
- `backend/sql/006_subscriptions.sql`
- `backend/src/modules/subscription/subscription.service.js`
- `backend/src/modules/subscription/subscription.controller.js`
- `backend/src/modules/subscription/subscription.routes.js`

### Backend (modificar)
- `backend/.env` — agregar `PAYMENT_ALIAS`
- `backend/src/config/env.js` — agregar `PAYMENT_ALIAS`
- `backend/src/app.js` — registrar ruta `/api/subscriptions`
- `backend/src/modules/users/users.service.js` — incluir datos de suscripción en listUsersService

### Frontend (crear)
- `frontend/src/store/subscription.store.js`
- `frontend/src/components/common/SubscriptionGate.jsx`
- `frontend/src/pages/subscription/SubscriptionBlockedPage.jsx`

### Frontend (modificar)
- `frontend/src/router.jsx` — insertar SubscriptionGate
- `frontend/src/pages/users/UsersPage.jsx` — badge + modal de activación
- `frontend/src/pages/profile/ProfilePage.jsx` — sección de membresía
