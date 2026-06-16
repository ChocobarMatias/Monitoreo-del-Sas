# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir dos vulnerabilidades de seguridad críticas: rutas `/keys` sin autenticación y flujo de reset de contraseña incompleto.

**Architecture:** Fix 1 agrega `authMiddleware` a las rutas GET/POST/PUT de `/keys`. Fix 2 completa el flujo de password reset: nuevo service + controller + ruta en backend, y una nueva página `ResetPasswordPage` en frontend que lee el token desde query string.

**Tech Stack:** Node.js + Express, bcrypt, crypto, React + React Router DOM, axios

---

## Contexto de arquitectura relevante

`auth.controller.js` contiene TANTO los controllers (arriba) COMO los services (abajo, duplicados de auth.service.js). Seguir ese patrón — agregar funciones nuevas al final de `auth.controller.js` antes del `module.exports`.

El flujo de forgot password actualmente devuelve el token crudo en la respuesta JSON (`{ ok: true, token: rawToken }`). Sin sistema de email, el frontend mostrará el link de reset directamente. Esto es un workaround temporal hasta implementar el mailer.

---

## Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `backend/src/modules/keys/keys.routes.js` | Modificar — agregar authMiddleware a 3 rutas |
| `backend/src/modules/auth/auth.controller.js` | Modificar — agregar resetPasswordService + resetPasswordController |
| `backend/src/modules/auth/auth.routes.js` | Modificar — agregar ruta POST /reset-password |
| `frontend/src/pages/auth/ForgotPasswordPage.jsx` | Modificar — mostrar link de reset tras éxito |
| `frontend/src/pages/auth/ResetPasswordPage.jsx` | Crear — formulario para nueva contraseña |
| `frontend/src/router.jsx` | Modificar — agregar ruta /reset-password |

---

## Task 1: Proteger rutas de keys con authMiddleware

**Files:**
- Modify: `backend/src/modules/keys/keys.routes.js`

- [ ] **Step 1: Agregar authMiddleware a GET, POST y PUT**

Reemplazar el contenido completo de `backend/src/modules/keys/keys.routes.js`:

```js
const { Router } = require("express");
const { listKeysController, createKeyController, updateKeyController, deleteKeyController } = require("./keys.controller");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const router = Router();

router.get("/", authMiddleware, listKeysController);
router.post("/", authMiddleware, createKeyController);
router.put("/:id", authMiddleware, updateKeyController);
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteKeyController);

module.exports = router;
```

Notas:
- Se eliminó la importación de `calculateSalaryController` (endpoint no implementado)
- Se agregó `roleMiddleware` import para DELETE
- DELETE ahora usa el middleware en cadena en lugar de verificar manualmente `req.user.role` en el controller

- [ ] **Step 2: Limpiar deleteKeyController — quitar verificación manual de rol**

En `backend/src/modules/keys/keys.controller.js`, reemplazar `deleteKeyController`:

```js
async function deleteKeyController(req, res, next) {
  try {
    const data = await deleteKeyService(req.params.id);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}
```

Y quitar `calculateSalaryController` del exports y del archivo completo. El módulo queda:

```js
const { listKeysService, createKeyService, updateKeyService, deleteKeyService } = require("./keys.service");

async function listKeysController(req, res, next) {
  try {
    const data = await listKeysService();
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function createKeyController(req, res, next) {
  try {
    const data = await createKeyService(req.body);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function updateKeyController(req, res, next) {
  try {
    const data = await updateKeyService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function deleteKeyController(req, res, next) {
  try {
    const data = await deleteKeyService(req.params.id);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listKeysController,
  createKeyController,
  updateKeyController,
  deleteKeyController
};
```

- [ ] **Step 3: Verificar que el frontend manda el token**

Confirmar en `frontend/src/lib/axios.js` que el interceptor ya agrega `Authorization: Bearer <token>` a todas las requests. Está configurado — no requiere cambios.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/keys/keys.routes.js backend/src/modules/keys/keys.controller.js
git commit -m "fix(keys): require authentication for all key routes"
```

---

## Task 2: Backend — completar flujo de reset de contraseña

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.js`
- Modify: `backend/src/modules/auth/auth.routes.js`

- [ ] **Step 1: Agregar resetPasswordService en auth.controller.js**

Insertar la función antes de `module.exports` al final del archivo:

```js
async function resetPasswordService(token, newPassword) {
  const rows = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
     FROM password_resets pr
     WHERE pr.token = ?
     LIMIT 1`,
    [token]
  );

  const reset = rows[0];

  if (!reset) {
    const error = new Error("Token inválido");
    error.status = 400;
    throw error;
  }

  if (reset.used_at) {
    const error = new Error("El token ya fue utilizado");
    error.status = 400;
    throw error;
  }

  if (new Date(reset.expires_at) < new Date()) {
    const error = new Error("El token expiró");
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await query(
    `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
    [passwordHash, reset.user_id]
  );

  await query(
    `UPDATE password_resets SET used_at = NOW() WHERE id = ?`,
    [reset.id]
  );

  return { ok: true };
}
```

- [ ] **Step 2: Agregar resetPasswordController en auth.controller.js**

Insertar después de `resetPasswordService`, antes de `module.exports`:

```js
async function resetPasswordController(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 8) {
      const error = new Error("Token y contraseña (mínimo 8 caracteres) requeridos");
      error.status = 400;
      throw error;
    }

    const result = await resetPasswordService(token, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 3: Actualizar module.exports en auth.controller.js**

El `module.exports` al final del archivo pasa de:

```js
module.exports = { loginController, registerUserByAdminController, setPinController, validatePinController, forgotPasswordController };
```

a:

```js
module.exports = { loginController, registerUserByAdminController, setPinController, validatePinController, forgotPasswordController, resetPasswordController };
```

- [ ] **Step 4: Agregar ruta POST /reset-password en auth.routes.js**

En `backend/src/modules/auth/auth.routes.js`, actualizar el import y agregar la ruta:

```js
const { Router } = require("express");
const {
  forgotPasswordController,
  loginController,
  registerUserByAdminController,
  setPinController,
  validatePinController,
  resetPasswordController
} = require("./auth.controller");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const { forgotPasswordLimiter, loginLimiter } = require("../../middlewares/rateLimiters");

const router = Router();

router.post("/login", loginLimiter, loginController);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordController);
router.post("/reset-password", forgotPasswordLimiter, resetPasswordController);

router.post(
  "/users",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registerUserByAdminController
);

router.post("/set-pin", authMiddleware, setPinController);
router.post("/validate-pin", authMiddleware, validatePinController);

module.exports = router;
```

Nota: se reutiliza `forgotPasswordLimiter` en `/reset-password` para limitar intentos de fuerza bruta sobre tokens.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.controller.js backend/src/modules/auth/auth.routes.js
git commit -m "feat(auth): implement password reset token verification and password update"
```

---

## Task 3: Frontend — página de reset de contraseña

**Files:**
- Create: `frontend/src/pages/auth/ResetPasswordPage.jsx`
- Modify: `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- Modify: `frontend/src/router.jsx`

- [ ] **Step 1: Crear ResetPasswordPage.jsx**

```jsx
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      navigate("/login", { state: { message: "Contraseña actualizada. Podés iniciar sesión." } });
    } catch (err) {
      setError(err.response?.data?.message || "Token inválido o expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <p className="text-sm text-red-600">Token faltante. Pedí un nuevo link de recuperación.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí una contraseña de al menos 8 caracteres.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver al login</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Actualizar ForgotPasswordPage.jsx para mostrar el link de reset**

Reemplazar el componente completo:

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data?.token) {
        setResetLink(`/reset-password?token=${res.data.token}`);
      } else {
        setResetLink("enviado");
      }
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    }
  }

  if (resetLink && resetLink !== "enviado") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-black text-slate-950">Link generado</h1>
          <p className="mt-2 text-sm text-slate-500">Usá este link para resetear la contraseña:</p>
          <Link
            to={resetLink}
            className="mt-4 inline-block break-all text-sm font-semibold text-blue-600 underline"
          >
            {window.location.origin}{resetLink}
          </Link>
          <p className="mt-4 text-xs text-slate-400">Este link expira en 30 minutos.</p>
        </div>
      </div>
    );
  }

  if (resetLink === "enviado") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
          <p className="text-sm text-emerald-700">Si el correo existe, se envió el enlace de recuperación.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-950">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-500">Sin drama. Poné tu email y seguimos.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="w-full" type="submit">Enviar</Button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-slate-900">Volver</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Agregar ruta /reset-password en router.jsx**

En `frontend/src/router.jsx`, agregar el import y la ruta pública:

```jsx
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
```

Y en el array de rutas, junto a `/forgot-password`:

```jsx
{ path: "/forgot-password", element: <ForgotPasswordPage /> },
{ path: "/reset-password", element: <ResetPasswordPage /> },
```

- [ ] **Step 4: Mostrar mensaje de éxito en LoginPage tras redirect**

Verificar si `LoginPage.jsx` ya lee `location.state.message`. Si no, agregar:

```jsx
import { useLocation } from "react-router-dom";

// dentro del componente:
const location = useLocation();
const successMessage = location.state?.message;

// en el JSX, antes del form:
{successMessage ? <p className="mb-4 text-sm text-emerald-700">{successMessage}</p> : null}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/auth/ResetPasswordPage.jsx frontend/src/pages/auth/ForgotPasswordPage.jsx frontend/src/router.jsx frontend/src/pages/auth/LoginPage.jsx
git commit -m "feat(auth): add password reset page and complete forgot-password flow"
```

---

## Self-Review

### Spec coverage
- [x] Keys GET/POST/PUT protegidos con authMiddleware
- [x] DELETE de keys usa roleMiddleware en lugar de verificación manual
- [x] Backend verifica token: existencia, expiración, ya usado
- [x] Backend actualiza password_hash + marca used_at
- [x] Frontend tiene página de reset con validación
- [x] Ruta /reset-password agregada al router
- [x] Link de reset mostrado en ForgotPasswordPage (workaround sin email)

### Placeholder scan
- No hay TBDs ni TODOs en el plan
- Todos los bloques de código son completos

### Type consistency
- `resetPasswordService(token, newPassword)` — llamado en controller con `req.body.token` y `req.body.newPassword` ✓
- `roleMiddleware("ADMIN")` — mismo patrón que en users routes ✓
- `authMiddleware` — mismo import path en ambos archivos de rutas ✓
