# DB Coverage Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el uso real de 3 áreas de la base de datos: api_keys (sólo tenía INSERT, nunca validaba), salary_scale_versions (year/month nunca usados para filtrar), y attendance_months (6 columnas de métricas nunca calculadas).

**Architecture:**
- Task 1: api_keys cambia de bcrypt a SHA-256 (API keys son strings aleatorios de 64 chars, SHA-256 es apropiado y permite `WHERE key_hash = ?`). Se agrega `validateApiKeyService` + middleware `apiKeyMiddleware`.
- Task 2: `salary.service.js` recibe una nueva función `findScaleForPeriod(year, month)` que devuelve el scale más reciente para ese período. `calculateSalaryService` acepta `scaleId` opcionalmente — si no viene, lo resuelve por año/mes.
- Task 3: `attendance.service.js` extiende `getEmptySummary`, `buildMonthRows`, `updateMonthSummary`, `getAttendanceMonthService` y `manualUpdateDayService` para computar y persistir: `total_days`, `holidays_worked`, `justification_days`, `overtime_hours`. Se omiten `absence_days` y `late_minutes` porque no hay fuente de datos en el engine actual.

**Tech Stack:** Node.js, Express, MySQL (mysql2), crypto (built-in), bcrypt omitido para api_keys.

---

## Contexto de arquitectura relevante

### api_keys — problema actual

`apikey.service.js` usa `bcrypt.hash` para guardar la key. Bcrypt no permite lookup por hash — no se puede hacer `WHERE key_hash = bcrypt(rawKey)`. Con bcrypt hay que traer todos los registros y comparar uno a uno, lo cual no escala.

**Solución:** Cambiar a SHA-256. La key ya es un string aleatorio de 64 chars hexadecimales (`crypto.randomBytes(32).toString("hex")`), por lo que SHA-256 es suficiente. Permite: `WHERE key_hash = SHA2(rawKey, 256)` — un solo SELECT por request.

### salary_scale_versions — campos ignorados

```sql
-- Tabla actual — year y month nunca se usan en queries
salary_scale_versions: id, category_name, year, month, sueldo_basico, adicional_presentismo, viatico, adicional_no_rem
```

El controller recibe `scaleId` explícito desde el frontend. Para permitir que el backend resuelva la escala por período:

```js
// Nuevo: findScaleForPeriod(year, month)
SELECT * FROM salary_scale_versions
WHERE (year < ?) OR (year = ? AND month <= ?)
ORDER BY year DESC, month DESC
LIMIT 1
```

### attendance_months — columnas sin datos

Columnas ignoradas en `updateMonthSummary` actual:
- `holidays_worked` — feriados en que el empleado trabajó
- `total_days` — días totales del mes (simple: `new Date(year, month, 0).getDate()`)
- `justification_days` — días de vacaciones + enfermedad
- `overtime_hours` — `Math.max(0, totalHours - 200)`
- `absence_days` → **SKIP** (el engine no genera días "ausente" sin flag)
- `late_minutes` → **SKIP** (no hay input de minutos en el engine)

Función actual a extender:
```js
// attendance.service.js:38
function getEmptySummary() {
  return {
    totalHours: 0, totalNightHours: 0, totalHolidayHours: 0,
    workedDays: 0, restDays: 0, totalHolidays: 0, weekendDays: 0,
    // FALTAN:
    totalDays: 0, holidaysWorked: 0, justificationDays: 0, overtimeHours: 0
  };
}
```

### Nota sobre convenios_salariales

Los campos `presentismo`, `viaticos_no_rem`, `anios_antiguedad`, `suma_no_remunerativa` se insertan y se devuelven vía `SELECT *` en `listConveniosService`. No alimentan cálculos — esto es una brecha de negocio (ej: bono por antigüedad no implementado), no un bug de datos. Se deja para cuando el usuario defina las reglas.

---

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `backend/src/modules/API-KEY/apikey.service.js` | Modificar — SHA-256 en lugar de bcrypt, agregar `validateApiKeyService` |
| `backend/src/middlewares/apiKeyMiddleware.js` | Crear — middleware Express que valida API key desde header |
| `backend/src/modules/salary/salary.service.js` | Modificar — agregar `findScaleForPeriod`, actualizar `calculateSalaryService` |
| `backend/src/modules/salary/salary.controller.js` | Modificar — pasar year/month a calculateSalaryService cuando no hay scaleId |
| `backend/src/modules/attendance/attendance.service.js` | Modificar — extender summary en 4 funciones |

---

## Task 1: api_keys — SHA-256 + validateApiKeyService + middleware

**Files:**
- Modify: `backend/src/modules/API-KEY/apikey.service.js`
- Create: `backend/src/middlewares/apiKeyMiddleware.js`

- [ ] **Step 1: Reemplazar apikey.service.js completo**

```js
const crypto = require("crypto");
const { query } = require("../../config/db");

function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

async function createApiKeyService(userId, name) {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = hashApiKey(rawKey);

  await query(
    `INSERT INTO api_keys (user_id, key_hash, name) VALUES (?, ?, ?)`,
    [userId, keyHash, name]
  );

  return rawKey;
}

async function validateApiKeyService(rawKey) {
  const keyHash = hashApiKey(rawKey);

  const rows = await query(
    `SELECT user_id FROM api_keys WHERE key_hash = ? LIMIT 1`,
    [keyHash]
  );

  return rows[0] ?? null;
}

module.exports = { createApiKeyService, validateApiKeyService };
```

- [ ] **Step 2: Crear apiKeyMiddleware.js**

```js
const { validateApiKeyService } = require("../modules/API-KEY/apikey.service");

async function apiKeyMiddleware(req, res, next) {
  const rawKey = req.headers["x-api-key"];

  if (!rawKey) {
    return res.status(401).json({ ok: false, message: "API key requerida" });
  }

  const record = await validateApiKeyService(rawKey);

  if (!record) {
    return res.status(401).json({ ok: false, message: "API key inválida" });
  }

  req.apiUserId = record.user_id;
  next();
}

module.exports = { apiKeyMiddleware };
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/API-KEY/apikey.service.js backend/src/middlewares/apiKeyMiddleware.js
git commit -m "feat(apikey): add SHA-256 hashing and validateApiKeyService + middleware"
```

---

## Task 2: salary_scale_versions — findScaleForPeriod

**Files:**
- Modify: `backend/src/modules/salary/salary.service.js`
- Modify: `backend/src/modules/salary/salary.controller.js`

- [ ] **Step 1: Leer salary.service.js actual**

Leer `backend/src/modules/salary/salary.service.js` para confirmar la firma de `calculateSalaryService`.

Estado confirmado:
```js
// línea 7
async function calculateSalaryService({ userId, year, month, scaleId }) {
  // ...
  const scale = await query(
    `SELECT * FROM salary_scale_versions WHERE id = ? LIMIT 1`,
    [scaleId]
  );
```

- [ ] **Step 2: Agregar findScaleForPeriod y actualizar calculateSalaryService**

En `salary.service.js`, agregar ANTES de `calculateSalaryService`:

```js
async function findScaleForPeriod(year, month) {
  const rows = await query(
    `SELECT * FROM salary_scale_versions
     WHERE year < ? OR (year = ? AND month <= ?)
     ORDER BY year DESC, month DESC
     LIMIT 1`,
    [year, year, month]
  );
  return rows[0] ?? null;
}
```

Y modificar `calculateSalaryService` para resolver el scale cuando no viene `scaleId`:

```js
async function calculateSalaryService({ userId, year, month, scaleId }) {
  const monthRow = await query(
    `SELECT id, total_hours, total_night_hours, total_holiday_hours
     FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ? LIMIT 1`,
    [userId, year, month]
  );

  if (!monthRow.length) throw new Error("Mes no encontrado");

  const monthData = monthRow[0];

  let scale;
  if (scaleId) {
    const rows = await query(
      `SELECT * FROM salary_scale_versions WHERE id = ? LIMIT 1`,
      [scaleId]
    );
    scale = rows[0];
  } else {
    scale = await findScaleForPeriod(year, month);
  }

  if (!scale) throw new Error("Escala salarial no encontrada para el período");

  const s = scale;
  const valorHora = calcHourlyRate(s.sueldo_basico);
  const extraHours = Math.max(0, Number(monthData.total_hours) - 200);

  const basePay = valorHora * 200;
  const extraPay = valorHora * extraHours;
  const nightBonus = valorHora * 0.1 * Number(monthData.total_night_hours || 0);
  const holidayPay = valorHora * Number(monthData.total_holiday_hours || 0);

  const remunerative =
    basePay + extraPay + nightBonus + holidayPay +
    Number(s.adicional_presentismo || 0);

  const nonRemunerative =
    Number(s.viatico || 0) + Number(s.adicional_no_rem || 0);

  const discounts = remunerative * 0.17;
  const total = remunerative + nonRemunerative - discounts;

  await query(
    `INSERT INTO salary_calculations
     (attendance_month_id, salary_scale_version_id,
      basic_hours, extra_hours, night_hours, holiday_hours,
      gross_remunerative, gross_non_remunerative, discounts, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      monthData.id, scale.id, 200, extraHours,
      Number(monthData.total_night_hours || 0),
      Number(monthData.total_holiday_hours || 0),
      remunerative, nonRemunerative, discounts, total
    ]
  );

  return {
    scaleUsed: { id: scale.id, categoryName: scale.category_name, year: scale.year, month: scale.month },
    basePay, extraPay, nightBonus, holidayPay,
    remunerative, nonRemunerative, discounts, total
  };
}
```

Agregar al final del module.exports:
```js
module.exports = { calculateSalaryService, findScaleForPeriod, listConveniosService, createConvenioService };
```

- [ ] **Step 3: Actualizar salary.controller.js**

Modificar `calculateSalaryController` para que `scaleId` sea opcional:

```js
async function calculateSalaryController(req, res, next) {
  try {
    const { year, month, scaleId } = req.body;
    const data = await calculateSalaryService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month),
      scaleId: scaleId ? Number(scaleId) : null,
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/salary/salary.service.js backend/src/modules/salary/salary.controller.js
git commit -m "feat(salary): add findScaleForPeriod and make scaleId optional in calculateSalaryService"
```

---

## Task 3: attendance_months — 4 columnas faltantes

**Files:**
- Modify: `backend/src/modules/attendance/attendance.service.js`

Columnas a implementar:
- `total_days` = días totales del mes calendario
- `holidays_worked` = feriados en que worked_hours > 0
- `justification_days` = is_vacation + is_sick_leave
- `overtime_hours` = Math.max(0, total_hours - 200)

### Step 1: Extender getEmptySummary

- [ ] **Localizar y reemplazar `getEmptySummary` (líneas 38-48)**

```js
function getEmptySummary() {
  return {
    totalHours: 0,
    totalNightHours: 0,
    totalHolidayHours: 0,
    workedDays: 0,
    restDays: 0,
    totalHolidays: 0,
    weekendDays: 0,
    totalDays: 0,
    holidaysWorked: 0,
    justificationDays: 0,
    overtimeHours: 0,
  };
}
```

### Step 2: Extender buildMonthRows para calcular los 4 nuevos valores

- [ ] **En `buildMonthRows`, inicializar totalDays al inicio del loop (línea 63, después de `const daysInMonth`)**

```js
summary.totalDays = daysInMonth;
```

Agregar esta línea justo después de `const summary = getEmptySummary();`:

```js
const { rows, summary } = buildMonthRows(...)
// dentro de buildMonthRows, después de: const summary = getEmptySummary();
summary.totalDays = daysInMonth;
```

- [ ] **En el loop de buildMonthRows, agregar contadores dentro del bloque de cada row (después de los contadores existentes, líneas 113-118)**

Localizar este bloque:
```js
    summary.totalHours += row.workedHours;
    summary.totalNightHours += row.nightHours;
    summary.totalHolidayHours += row.holidayPaidHours;
    if (isHoliday) summary.totalHolidays++;
    if (isRest) summary.restDays++;
    rows.push(row);
```

Reemplazar con:
```js
    summary.totalHours += row.workedHours;
    summary.totalNightHours += row.nightHours;
    summary.totalHolidayHours += row.holidayPaidHours;
    if (isHoliday) {
      summary.totalHolidays++;
      if (row.workedHours > 0) summary.holidaysWorked++;
    }
    if (isRest) summary.restDays++;
    if (isVacation || isSickLeave) summary.justificationDays++;
    rows.push(row);
```

- [ ] **Después del loop (antes de `return { rows, summary }`), calcular overtimeHours**

Localizar `return { rows, summary };` y agregar antes:
```js
  summary.overtimeHours = Math.max(0, summary.totalHours - 200);
  return { rows, summary };
```

### Step 3: Extender updateMonthSummary para persistir los 4 campos

- [ ] **Reemplazar `updateMonthSummary` completo (líneas 325-342)**

```js
async function updateMonthSummary(attendanceMonthId, summary) {
  await query(
    `UPDATE attendance_months
     SET total_hours = ?, total_night_hours = ?, total_holiday_hours = ?,
         suggested_rest_days = ?, worked_days = ?, total_holidays = ?, weekend_days = ?,
         total_days = ?, holidays_worked = ?, justification_days = ?, overtime_hours = ?
     WHERE id = ?`,
    [
      summary.totalHours,
      summary.totalNightHours,
      summary.totalHolidayHours,
      summary.restDays,
      summary.workedDays,
      summary.totalHolidays,
      summary.weekendDays,
      summary.totalDays,
      summary.holidaysWorked,
      summary.justificationDays,
      summary.overtimeHours,
      attendanceMonthId
    ]
  );
}
```

### Step 4: Extender getAttendanceMonthService para devolver los 4 nuevos campos

- [ ] **Reemplazar el objeto `summary:` en `getAttendanceMonthService` (líneas 469-478)**

```js
  return {
    data,
    summary: {
      totalHours: Number(monthRow.total_hours || 0),
      totalNightHours: Number(monthRow.total_night_hours || 0),
      totalHolidayHours: Number(monthRow.total_holiday_hours || 0),
      suggestedRestDays: Number(monthRow.suggested_rest_days || 0),
      workedDays: Number(monthRow.worked_days || 0),
      totalHolidays: Number(monthRow.total_holidays || 0),
      weekendDays: Number(monthRow.weekend_days || 0),
      totalDays: Number(monthRow.total_days || 0),
      holidaysWorked: Number(monthRow.holidays_worked || 0),
      justificationDays: Number(monthRow.justification_days || 0),
      overtimeHours: Number(monthRow.overtime_hours || 0),
    }
  };
```

### Step 5: Extender manualUpdateDayService para calcular los 4 nuevos campos en el SELECT agregado

- [ ] **Reemplazar el SELECT de aggregate en `manualUpdateDayService` (líneas 520-529)**

```js
  const [result] = await query(
    `SELECT
       SUM(worked_hours) AS totalHours,
       SUM(night_hours) AS totalNightHours,
       SUM(holiday_paid_hours) AS totalHolidayHours,
       SUM(worked_hours > 0) AS workedDays,
       SUM(is_holiday) AS totalHolidays,
       SUM(is_rest) AS restDays,
       SUM(shift_type = 'DAY' AND DAYOFWEEK(work_date) IN (1, 7)) AS weekendDays,
       COUNT(*) AS totalDays,
       SUM(is_holiday = 1 AND worked_hours > 0) AS holidaysWorked,
       SUM(is_vacation = 1 OR is_sick_leave = 1) AS justificationDays,
       GREATEST(0, SUM(worked_hours) - 200) AS overtimeHours
     FROM attendance_days WHERE attendance_month_id = ?`,
    [monthRow.id]
  );

  const summary = {
    totalHours: Number(result.totalHours || 0),
    totalNightHours: Number(result.totalNightHours || 0),
    totalHolidayHours: Number(result.totalHolidayHours || 0),
    workedDays: Number(result.workedDays || 0),
    restDays: Number(result.restDays || 0),
    totalHolidays: Number(result.totalHolidays || 0),
    weekendDays: Number(result.weekendDays || 0),
    totalDays: Number(result.totalDays || 0),
    holidaysWorked: Number(result.holidaysWorked || 0),
    justificationDays: Number(result.justificationDays || 0),
    overtimeHours: Number(result.overtimeHours || 0),
  };
```

- [ ] **Commit**

```bash
git add backend/src/modules/attendance/attendance.service.js
git commit -m "feat(attendance): compute and persist total_days, holidays_worked, justification_days, overtime_hours"
```

---

## Self-Review

### Spec coverage
- [x] api_keys: `createApiKeyService` cambia a SHA-256 para permitir lookup
- [x] api_keys: `validateApiKeyService` agrega lookup por hash
- [x] api_keys: `apiKeyMiddleware` usa `x-api-key` header y setea `req.apiUserId`
- [x] salary_scale_versions: `findScaleForPeriod(year, month)` usa year/month para filtrar
- [x] salary_scale_versions: `calculateSalaryService` acepta `scaleId` null y auto-resuelve
- [x] salary_scale_versions: response incluye `scaleUsed.categoryName` (usa category_name)
- [x] attendance_months.total_days: calculado en buildMonthRows + persistido + devuelto
- [x] attendance_months.holidays_worked: calculado en loop + persistido + devuelto + en manualUpdate
- [x] attendance_months.justification_days: calculado en loop + persistido + devuelto + en manualUpdate
- [x] attendance_months.overtime_hours: calculado post-loop + persistido + devuelto + en manualUpdate
- [x] attendance_months.absence_days: SKIP documentado (sin fuente de datos)
- [x] attendance_months.late_minutes: SKIP documentado (sin fuente de datos)
- [x] webhooks: dejar para más adelante (decisión del usuario)

### Placeholder scan
- Sin TBD, sin TODO, sin "handle edge cases"
- Todos los bloques tienen código completo

### Type consistency
- `findScaleForPeriod` retorna objeto o null — `calculateSalaryService` hace `if (!scale)` ✓
- `summary.totalDays` inicializado en `getEmptySummary` como 0 ✓
- `updateMonthSummary` recibe `summary.totalDays` (camelCase) y persiste en `total_days` (snake_case) ✓
- `getAttendanceMonthService` lee `monthRow.total_days` → `totalDays` ✓
- `manualUpdateDayService` usa `COUNT(*)` para `totalDays` — correcto porque cuenta todos los días del mes que ya fueron insertados ✓
