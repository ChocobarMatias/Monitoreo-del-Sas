# AGENT.md — Monitoreo-del-Sas

> Última actualización: 2026-06-16 01:20

## Estado general
Sistema de gestión de personal (asistencia, claves, sueldos, auth). Backend Node.js + Express + MySQL. Frontend React + Vite. Branch activo: `dev`. Auditoría de seguridad y cobertura de DB completada. Plan de DB coverage en ejecución.

---

## Completado ✅

### Auth y Seguridad
- Tokens de reset de contraseña hasheados con SHA-256 antes de guardar en DB — `fdd1ea1`, `1bd847e`, `7cb24a1`
- PublicOnlyRoute en frontend — redirige usuarios autenticados de /login, /forgot-password, /reset-password — `a8e8238`
- Keys module routes requieren auth — `935`
- Authorization bypass en PUT /keys/:id corregido

### Keys Module
- `keys.service.js` — nullish coalescing (`??` en lugar de `||`), `createKeyService` alineado con `KEY_FIELDS` (17 campos, incluye `telefono_guardia1/2`, `fecha_actualizacion`) — `19c95c6`

### PIN Module
- `pin.service.js` — eliminado (código erróneo de key_records)
- `pin.routes.js` — POST /api/pin/set con auth + validación mínimo 4 chars, importa `setPinService` desde `auth.service.js`
- Registrado en `app.js` como `/api/pin`

### API-KEY Module
- `apikey.service.js` — import `query` agregado (era runtime crash), **usa bcrypt actualmente**
- `apikey.controller.js` — reescrito como controller real
- `apikey.routes.js` — creado, POST /api/apikey con authMiddleware
- Registrado en `app.js` como `/api/apikey`

### Limpieza de código muerto
- `frontend/src/api/client.js` — eliminado (nadie lo importaba, todos usan `lib/axios.js`)
- `frontend/src/hook/useAuthInit.js` — eliminado (carpeta singular muerta)
- `pin.service.js` — eliminado (duplicaba `setPinService` de `auth.service.js`)

### Attendance
- Motor A/B cycle implementado (`attendance.engine.js`)
- `buildMonthRows`, `recalculateMonth`, `applyOverrideAndRecalculateService`, `manualUpdateDayService` — funcionales
- Integración con grupos_sas para configuración de ciclo

### Salary
- `calculateSalaryService`, `listConveniosService`, `createConvenioService` — funcionales
- Guarda en `salary_calculations` correctamente

---

## Pendiente ❌ — Plan: `docs/superpowers/plans/2026-06-16-db-coverage-fixes.md`

### Task 1: api_keys — cambiar bcrypt a SHA-256 + validateApiKeyService + apiKeyMiddleware
**Contexto:** `apikey.service.js` actualmente usa bcrypt para el hash de la key. Bcrypt no permite lookup por hash. Hay que cambiar a SHA-256 para poder hacer `WHERE key_hash = SHA256(rawKey)`. No hay datos existentes en `api_keys` (tabla nunca fue usada antes).

**Archivos a tocar:**
- `backend/src/modules/API-KEY/apikey.service.js` — reemplazar bcrypt por SHA-256, agregar `validateApiKeyService`
- `backend/src/middlewares/apiKeyMiddleware.js` — CREAR, lee header `x-api-key`, llama `validateApiKeyService`, setea `req.apiUserId`

**Código del plan:**
```js
// apikey.service.js
function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}
async function createApiKeyService(userId, name) {
  const rawKey = crypto.randomBytes(32).toString("hex");
  await query(`INSERT INTO api_keys (user_id, key_hash, name) VALUES (?, ?, ?)`,
    [userId, hashApiKey(rawKey), name]);
  return rawKey;
}
async function validateApiKeyService(rawKey) {
  const rows = await query(`SELECT user_id FROM api_keys WHERE key_hash = ? LIMIT 1`, [hashApiKey(rawKey)]);
  return rows[0] ?? null;
}
```
**Commit:** `feat(apikey): add SHA-256 hashing and validateApiKeyService + middleware`

---

### Task 2: salary_scale_versions — findScaleForPeriod + scaleId opcional
**Contexto:** `salary_scale_versions` tiene columnas `year`, `month`, `category_name` que nunca se usan. `calculateSalaryService` exige `scaleId` explícito. Agregar resolución automática por período.

**Archivos a tocar:**
- `backend/src/modules/salary/salary.service.js` — agregar `findScaleForPeriod(year, month)`, actualizar `calculateSalaryService` para aceptar `scaleId` null
- `backend/src/modules/salary/salary.controller.js` — hacer `scaleId` opcional

**Query nueva:**
```sql
SELECT * FROM salary_scale_versions
WHERE year < ? OR (year = ? AND month <= ?)
ORDER BY year DESC, month DESC LIMIT 1
```
**Commit:** `feat(salary): add findScaleForPeriod and make scaleId optional in calculateSalaryService`

---

### Task 3: attendance_months — 4 columnas faltantes
**Contexto:** `attendance_months` tiene `total_days`, `holidays_worked`, `justification_days`, `overtime_hours` que nunca se calculan ni persisten. `absence_days` y `late_minutes` se omiten (sin fuente de datos en el engine).

**Archivo a tocar:** `backend/src/modules/attendance/attendance.service.js`

**Cambios necesarios (5 puntos dentro del mismo archivo):**
1. `getEmptySummary()` — agregar 4 campos nuevos inicializados en 0
2. `buildMonthRows()` — `summary.totalDays = daysInMonth` antes del loop; en el loop: `if (isHoliday && workedHours > 0) holidaysWorked++`, `if (isVacation || isSickLeave) justificationDays++`; post-loop: `summary.overtimeHours = Math.max(0, totalHours - 200)`
3. `updateMonthSummary()` — extender UPDATE para incluir los 4 campos
4. `getAttendanceMonthService()` — agregar 4 campos al objeto summary retornado
5. `manualUpdateDayService()` — extender SELECT agregado con: `COUNT(*) AS totalDays`, `SUM(is_holiday=1 AND worked_hours>0) AS holidaysWorked`, `SUM(is_vacation=1 OR is_sick_leave=1) AS justificationDays`, `GREATEST(0, SUM(worked_hours)-200) AS overtimeHours`

**Commit:** `feat(attendance): compute and persist total_days, holidays_worked, justification_days, overtime_hours`

---

## Decisiones tomadas

| Decisión | Razón |
|----------|-------|
| SHA-256 para API keys (no bcrypt) | Bcrypt no permite lookup por hash. API keys son strings aleatorios de 64 chars, SHA-256 es suficiente |
| Webhooks: dejar sin implementar | Usuario decidió implementar más adelante |
| `absence_days` y `late_minutes`: skip | No hay fuente de datos en el engine actual |
| `convenios_salariales` campos sin usar: no tocar | Son informacionales (SELECT * los devuelve). Bono por antigüedad etc. requieren reglas de negocio no definidas |
| PIN module importa desde auth.service.js | `setPinService` ya existía ahí; evita duplicación |

---

## Stack técnico
- **Backend:** Node.js + Express, MySQL (mysql2), crypto (built-in), bcrypt, JWT
- **Frontend:** React + Vite, Zustand, React Router DOM v6, `lib/axios.js` (único cliente axios)
- **DB:** MySQL — schema en `backend/src/config/db.js` y migraciones en `backend/migrations/`
- **Auth:** JWT en header `Authorization: Bearer`, PIN en header `pin`, API key en header `x-api-key`

## Contexto para retomar
- Rama activa: `dev`
- Plan activo: `docs/superpowers/plans/2026-06-16-db-coverage-fixes.md`
- Ejecutar los 3 tasks del plan en orden (son independientes entre sí)
- Task 1 modifica `apikey.service.js` que fue recién creado — no hay datos en producción en `api_keys`, cambio de hash es seguro
- `auth.service.js` ya tiene `setPinService` y `validatePinService` — cualquier nuevo endpoint de PIN debe importar desde ahí
