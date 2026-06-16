# AGENT.md — Monitoreo-del-Sas

> Última actualización: 2026-06-16 02:00

## Estado general
Sistema de gestión de personal (asistencia, claves, sueldos, auth). Backend Node.js + Express + MySQL. Frontend React + Vite. Branch activo: `dev`. Auditoría de seguridad y cobertura de DB completada. Plan de DB coverage ejecutado y completo.

---

## Completado ✅

### Auth y Seguridad
- Tokens de reset de contraseña hasheados con SHA-256 antes de guardar en DB — `fdd1ea1`, `1bd847e`, `7cb24a1`
- PublicOnlyRoute en frontend — redirige usuarios autenticados de /login, /forgot-password, /reset-password — `a8e8238`
- Keys module routes requieren auth
- Authorization bypass en PUT /keys/:id corregido

### Keys Module
- `keys.service.js` — nullish coalescing (`??`), `createKeyService` alineado con `KEY_FIELDS` (17 campos) — `19c95c6`

### PIN Module
- `pin.routes.js` — POST /api/pin/set con auth + validación mínimo 4 chars, importa `setPinService` desde `auth.service.js`
- Registrado en `app.js` como `/api/pin`

### API-KEY Module — `51f75de`, `11c3721`, `34bfd71`
- `apikey.service.js` — SHA-256 (no bcrypt), `createApiKeyService` + `validateApiKeyService`
- `apikey.controller.js` — controller real
- `apikey.routes.js` — POST /api/apikey con authMiddleware
- `apiKeyMiddleware.js` — NUEVO, lee header `x-api-key`, setea `req.apiUserId`, try/catch
- Registrado en `app.js` como `/api/apikey`

### Salary Module — `4674aec`, `c017b6f`
- `findScaleForPeriod(year, month)` — resuelve escala por período (`year < ? OR (year = ? AND month <= ?)`)
- `calculateSalaryService` — `scaleId` ahora opcional, auto-resuelve via `findScaleForPeriod`
- Response incluye `scaleUsed: { id, categoryName, year, month }`
- Controller valida `year`/`month` con `Number.isInteger` antes de llamar al service

### Attendance Module — `7652641`, `7929407`
- Motor A/B cycle implementado (`attendance.engine.js`)
- `attendance_months` ahora calcula y persiste 4 columnas antes ignoradas:
  - `total_days` — días calendario del mes
  - `holidays_worked` — feriados con horas trabajadas
  - `justification_days` — vacaciones + enfermedad
  - `overtime_hours` — horas sobre 200
- `manualUpdateDayService` — bug corregido: ahora llama `recalculateFutureMonths` (igual que `applyOverrideAndRecalculateService`)
- Código comentado muerto eliminado (`getBaseShiftForDate`, `applySpecialRules` obsoletos)

### Limpieza de código muerto — `a1716c8`
- `frontend/src/api/client.js` — eliminado
- `frontend/src/hook/useAuthInit.js` — eliminado (carpeta singular)
- `pin.service.js` — eliminado (duplicaba `setPinService` de `auth.service.js`)

---

### Auth Controller — `db21b93`
- `auth.controller.js` — eliminadas 180 líneas de servicios duplicados inline; ahora importa correctamente desde `auth.service.js`
- Bug crítico resuelto: los controllers usaban copias locales de los servicios, ignorando cambios en `auth.service.js`

### Users — `f197344`, `c1eb027`, `db21b93`
- `UsersPage.jsx` — campos `cycle_start_date` e `initial_week_type` en create y edit, visibles solo cuando no hay grupo SAS
- `auth.service.js` `registerUserByAdminService` — acepta e inserta `cycle_start_date` e `initial_week_type`
- `auth.controller.js` — pasa ambos campos al service

### Limpieza adicional — `f197344`
- `frontend/src/app/router.jsx` — eliminado (dead code con paths de import incorrectos)

---

## Pendiente ❌
No hay tasks pendientes.

---

## Decisiones tomadas

| Decisión | Razón |
|----------|-------|
| SHA-256 para API keys (no bcrypt) | Bcrypt no permite lookup por hash. API keys son strings aleatorios de 64 chars, SHA-256 es suficiente |
| Webhooks: dejar sin implementar | Usuario decidió implementar más adelante |
| `absence_days` y `late_minutes`: skip | No hay fuente de datos en el engine actual |
| `convenios_salariales` campos sin usar: no tocar | Son informacionales (SELECT * los devuelve). Bono por antigüedad etc. requieren reglas de negocio no definidas |
| PIN module importa desde auth.service.js | `setPinService` ya existía ahí; evita duplicación |
| `salary_calculations` sin unique constraint | Schema definido por usuario no incluye constraint en (attendance_month_id). Doble cálculo posible pero requiere decisión de negocio |

---

## Stack técnico
- **Backend:** Node.js + Express, MySQL (mysql2), crypto (built-in), bcrypt, JWT
- **Frontend:** React + Vite, Zustand, React Router DOM v6, `lib/axios.js` (único cliente axios)
- **DB:** MySQL — schema en `backend/src/config/db.js`
- **Auth:** JWT en header `Authorization: Bearer`, PIN en header `pin`, API key en header `x-api-key`

## Contexto para retomar
- Rama activa: `dev`
- Todos los plans en `docs/superpowers/plans/` están completos
- `auth.service.js` tiene `setPinService` y `validatePinService` — cualquier nuevo endpoint de PIN importa desde ahí
- `apiKeyMiddleware.js` está en `backend/src/middlewares/` listo para usar en rutas que requieran API key
- `salary_calculations` puede tener filas duplicadas por mes si se llama el endpoint dos veces — pendiente decisión de negocio sobre si se permite o se previene
