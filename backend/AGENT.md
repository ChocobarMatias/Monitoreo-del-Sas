# Revisión del backend: Monitoreo-del-Sas


## Estado de correcciones y verificación

### 1. Motor automático de horarios ciclo A/B
✅ Implementado motor determinístico y modular para generación de horarios según ciclo semanal A/B configurable por el usuario.

### 2. Funciones modulares y reglas de negocio
✅ Se crearon funciones desacopladas: `getWeekType(date, cycleStartDate, initialWeekType)`, `getBaseShiftByCycle(weekType, dayOfWeek)`, `applyRules({ baseShift, isHoliday, prevWorked })`.

### 3. Configuración de ciclo
✅ El sistema permite definir manualmente la fecha de inicio del ciclo y el tipo de semana inicial.

### 4. Reglas de feriado y continuidad
✅ Se respeta la lógica: feriado convierte día libre en laborable (DÍA), y si era laborable y el día anterior no trabajó, cambia a DÍA. Se computan correctamente las horas pagas por feriado.

### 5. Recorrido y estado
✅ El motor recorre el mes día por día, mantiene el estado de si trabajó el día anterior y genera los campos requeridos.

### 6. Código limpio y alineado a producción
✅ El código es determinístico, confiable y alineado a planilla Excel. No se usan heurísticas ni simplificaciones.

---

## Resumen de acciones realizadas
- Implementado motor automático de horarios ciclo A/B, configurable.
- Funciones desacopladas y testables para cada parte de la lógica.
- Integración en el flujo de generación mensual.
- Documentadas reglas y ejemplos en comentarios de código.

---

## Mejoras y alineación

- El backend ahora soporta cualquier ciclo A/B definido por el usuario.
- El motor es confiable para producción y extensible para reglas futuras.

No quedan problemas críticos pendientes en la generación automática de horarios.


--------------------------------------------------------------------------
## nuevas tareas
Descripción para Claude Code – Correcciones y nuevas funcionalidades: Planilla de Asistencia (Guard App)

CONTEXTO GENERAL
La app "Guard App" gestiona planillas de asistencia mensual para guardias de seguridad. Actualmente hay bugs críticos en la tabla y en el modal de configuración, y falta implementar la lógica de cronograma rotativo por grupos SAS.

TAREA 1 — Bug: La columna N° no corresponde al día real del mes
Problema: La columna N° muestra un número de fila incremental (1, 2, 3…) pero NO está vinculada al día real del mes. Al presionar "Editar" en la fila N°1 del mes de Junio 2026, el modal muestra 31 - Lunes en lugar de 1 - Lunes.
Corrección esperada:

La columna N° debe mostrar el número del día del mes (1 al 28/29/30/31 según el mes).
La columna Día debe mostrar el nombre del día de la semana correspondiente a esa fecha real.
El dropdown del modal "Configurar día" debe listar los días con formato {numeroDia} · {NombreDia} ({turno}), por ejemplo: 1 · Lunes (20:00–08:00).
La correspondencia debe ser dinámica según el mes y año seleccionado.
En Junio 2026: día 1 = Lunes, día 2 = Martes, etc. (verificar con new Date(2026, 5, 1).getDay()).


TAREA 2 — Bug: Ningún botón de acción del modal funciona
Problema: Los botones del modal "Configurar día" (Feriado, Descanso, Vacaciones, Enfermedad, Paro 08 a 20, Paro 20 a 08, Editar manual) no realizan ninguna acción al hacer clic.
Corrección esperada:

Cada botón debe actualizar el registro del día seleccionado en la base de datos con el tipo de novedad correspondiente.
El botón "Editar manual" debe abrir un sub-formulario para ingresar manualmente Ingreso, Egreso y Horas.
Al confirmar cualquier acción, el modal debe cerrarse y la tabla debe reflejarse actualizada.
El botón "Recalcular" debe recorrer todos los días del mes, recalcular horas trabajadas, horas nocturnas, días de descanso, feriados y fines de semana, y actualizar los totales del encabezado.
El botón "PDF" debe generar y descargar la planilla del mes en formato PDF.


TAREA 3 — Nueva lógica: Cronograma rotativo por grupos SAS
Descripción del sistema de turnos:
El cronograma es rotativo, alternando entre dos tipos de semana. Nunca se reinicia al cambiar de mes ni de año: continúa ininterrumpidamente.

![alt text](/imagen/semana%20tipo%20A.png)

Semana tipo A:
Día semanaTurnoHorasLunesDescanso0 hsMartes20:00 → 08:0012 hsMiércolesDescanso0 hsJueves20:00 → 08:0012 hsViernesDescanso0 hsSábado08:00 → 20:0012 hsDomingo08:00 → 20:0012 hs

![alt text](/imagen/semana%20tipo%20B.png)

Semana tipo B:
Día semanaTurnoHorasLunes20:00 → 08:0012 hsMartesDescanso0 hsMiércoles20:00 → 08:0012 hsJuevesDescanso0 hsViernes20:00 → 08:0012 hsSábado20:00 → 08:0012 hsDomingo20:00 → 08:0012 hs
Regla de alternancia:

Semana 1 → Tipo A, Semana 2 → Tipo B, Semana 3 → Tipo A, Semana 4 → Tipo B… (infinitamente)
Grupo 1 SAS: comienza con Semana tipo A en la primera semana del historial.
Grupo 2 SAS: comienza con Semana tipo B (desfasado una semana respecto al Grupo 1).
Para saber qué tipo de semana aplica en cualquier fecha: calcular el número de semana ISO desde una fecha ancla conocida y determinar si es par o impar según el grupo.

Fecha ancla de referencia confirmada:

Semana del Lunes 01 de Junio 2026: Grupo 1 = Semana tipo A, Grupo 2 = Semana tipo B.


TAREA 4 — Nueva entidad en base de datos: grupos_sas
Crear una nueva tabla/colección grupos_sas con la siguiente estructura:

grupos_sas {
  id: string/uuid,
  nombre: string,          // ej: "Grupo 1", "Grupo 2"
  tipo_inicio: "A" | "B", // qué tipo de semana arranca
  descripcion: string      // opcional
}

Modificación en la entidad usuarios:

Agregar campo grupo_sas_id (FK a grupos_sas) o campo grupo_sas: 1 | 2.
En el formulario de creación/edición de usuario, agregar un selector para asignar el grupo SAS (Grupo 1 o Grupo 2).


TAREA 5 — Integración del cronograma con la planilla

Al cargar la planilla de un mes, si el día no tiene una novedad manual registrada (Feriado, Vacaciones, etc.), el sistema debe autogenerar el turno según el cronograma rotativo del grupo SAS al que pertenece el usuario.
Si existe una novedad manual para ese día, se muestra la novedad (tiene prioridad sobre el cronograma base).
El botón "Recalcular" debe regenerar los días sin novedad manual usando esta lógica y recalcular todos los totales.


RESUMEN DE TAREAS PENDIENTES (para copiar y pegar)

[ ] TAREA 1: Corregir bug de columna N° – vincular número de fila al día real del mes según mes/año seleccionado. Corregir dropdown del modal para mostrar el día correcto (ej: "1 · Lunes" en vez de "31 · Lunes" para Junio 2026).

[ ] TAREA 2: Hacer funcionar los botones del modal "Configurar día": Feriado, Descanso, Vacaciones, Enfermedad, Paro 08 a 20, Paro 20 a 08, Editar manual. Cada uno debe guardar la novedad en la DB y refrescar la tabla. Implementar sub-formulario de "Editar manual". Hacer funcionar los botones "Recalcular" (recalcula totales del mes) y "PDF" (descarga planilla en PDF).

[ ] TAREA 3: Implementar lógica de cronograma rotativo SAS. Semana tipo A y tipo B alternantes, sin reinicio mensual ni anual. Fecha ancla: semana del 01/06/2026 = Grupo 1 tipo A / Grupo 2 tipo B. Calcular automáticamente el turno de cada día según el grupo del usuario.

[ ] TAREA 4: Crear entidad `grupos_sas` en la DB con campos: id, nombre, tipo_inicio (A|B), descripcion. Agregar campo `grupo_sas_id` al modelo de usuario. Agregar selector de grupo SAS en el formulario de creación/edición de usuario.

[ ] TAREA 5: Integrar cronograma rotativo con la planilla mensual. Los días sin novedad manual deben autogenerarse con el turno del cronograma. Novedades manuales tienen prioridad. El botón "Recalcular" debe regenerar días vacíos y actualizar totales (horas trabajadas, horas nocturnas, días descanso, feriados, fines de semana 8-20).