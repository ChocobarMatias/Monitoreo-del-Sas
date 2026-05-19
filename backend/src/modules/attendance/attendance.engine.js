
/**
 * Determina el tipo de semana (A o B) para una fecha dada, según la configuración del ciclo.
 * @param {Date} date Fecha a consultar
 * @param {Date} cycleStartDate Fecha de inicio del ciclo
 * @param {"A"|"B"} initialWeekType Tipo de semana inicial
 * @returns {"A"|"B"}
 */
function getWeekType(date, cycleStartDate, initialWeekType) {
  // Normaliza fechas a medianoche
  const d1 = new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), cycleStartDate.getDate());
  const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  // El ciclo es: los primeros 7 días (incluyendo el día 0) son semana inicial, luego alterna cada 7 días
  const weekIndex = Math.floor((diffDays) / 7);
  if (initialWeekType === "A") {
    return weekIndex % 2 === 0 ? "A" : "B";
  } else {
    return weekIndex % 2 === 0 ? "B" : "A";
  }
}

function isWeekend(day) {
  return day === 0 || day === 6;
}


/**
 * Devuelve el turno base (DAY/NIGHT/NONE) según el ciclo y el día de la semana.
 * @param {"A"|"B"} weekType
 * @param {number} dayOfWeek 0=Domingo, 1=Lunes, ...
 * @returns {"DAY"|"NIGHT"|"NONE"}
 */
function getBaseShiftByCycle(weekType, dayOfWeek) {
  if (weekType === "A") {
    // Lunes(1), Miércoles(3), Viernes(5), Sábado(6), Domingo(0): NOCHE
    if ([1, 3, 5, 6, 0].includes(dayOfWeek)) return "NIGHT";
    // Martes(2), Jueves(4): libre
    return "NONE";
  }
  if (weekType === "B") {
    // Martes(2), Jueves(4): NOCHE
    if ([2, 4].includes(dayOfWeek)) return "NIGHT";
    // Sábado(6), Domingo(0): DÍA
    if ([6, 0].includes(dayOfWeek)) return "DAY";
    // Lunes(1), Miércoles(3), Viernes(5): libre
    return "NONE";
  }
  return "NONE";
}

function buildShift(type) {
  if (type === "NONE") {
    return {
      shiftType: "NONE",
      startTime: null,
      endTime: null,
      workedHours: 0,
      nightHours: 0,
      holidayPaidHours: 0,
    };
  }

  if (type === "DAY") {
    return {
      shiftType: "DAY",
      startTime: "08:00",
      endTime: "20:00",
      workedHours: 12,
      nightHours: 0,
      holidayPaidHours: 0,
    };
  }

  if (type === "NIGHT") {
    return {
      shiftType: "NIGHT",
      startTime: "20:00",
      endTime: "08:00",
      workedHours: 12,
      nightHours: 9,
      holidayPaidHours: 0,
    };
  }
}


/**
 * Aplica reglas especiales de feriado, paro, descanso y continuidad.
 * @param {Object} params
 * @param {"DAY"|"NIGHT"|"NONE"} baseShift
 * @param {boolean} isHoliday
 * @param {boolean|null} holidayWorked  null = N/A, true = trabajó, false = feriado libre
 * @param {boolean} isStrike
 * @param {boolean} isRest
 * @param {boolean} isVacation
 * @param {boolean} isSickLeave
 * @param {boolean} prevWorked
 * @param {"DAY"|"NIGHT"|null} prevShiftType
 * @returns {Object} shift
 */
function applyRules({ baseShift, isHoliday, holidayWorked, isStrike, isRest, isVacation, isSickLeave, prevWorked, prevShiftType }) {
  let shift = buildShift(baseShift);

  // Descanso forzado, vacaciones, enfermedad → siempre 0 horas
  if (isRest || isVacation || isSickLeave) {
    return buildShift("NONE");
  }

  // Paro: debía trabajar pero no trabajó → 0 horas, shiftType queda como referencia
  if (isStrike && shift.shiftType !== "NONE") {
    return { ...shift, workedHours: 0, nightHours: 0, holidayPaidHours: 0 };
  }

  if (isHoliday) {
    // Feriado no trabajado → libre, sin horas
    if (holidayWorked === false) {
      return buildShift("NONE");
    }
    if (shift.shiftType === "NONE") {
      // Feriado trabajado en día libre:
      // si el día anterior fue laborable → mismo turno; si no → DAY (08-20)
      const target = (prevWorked && prevShiftType) ? prevShiftType : "DAY";
      shift = buildShift(target);
    }
    // Feriado trabajado en día laborable → mantiene turno normal
    shift.holidayPaidHours = shift.workedHours;
  }

  return shift;
}


module.exports = {
  getWeekType,
  getBaseShiftByCycle,
  applyRules,
  buildShift,
};



// function oppositeShift(shiftType) {
//   return shiftType === "DAY" ? "NIGHT" : "DAY";
// }

// function buildShift(shiftType, options = {}) {
//   if (!shiftType || shiftType === "NONE") {
//     return {
//       shiftType: "NONE",
//       startTime: null,
//       endTime: null,
//       workedHours: 0,
//       nightHours: 0,
//       holidayPaidHours: 0,
//       ...options
//     };
//   }

//   const isDay = shiftType === "DAY";
//   return {
//     shiftType,
//     startTime: isDay ? "08:00" : "20:00",
//     endTime: isDay ? "20:00" : "08:00",
//     workedHours: 12,
//     nightHours: isDay ? 0 : 8,
//     holidayPaidHours: 0,
//     ...options
//   };
// }

// function getBaseShiftForDate({ previousWorked, lastWorkedShiftType }) {
//   if (previousWorked) {
//     return buildShift("NONE");
//   }

//   if (!lastWorkedShiftType) {
//     return buildShift("DAY");
//   }

//   return buildShift(oppositeShift(lastWorkedShiftType));
// }

// function applySpecialRules({
//   baseShift,
//   isHoliday,
//   isStrike,
//   strikeShiftType,
//   isRest,
//   isVacation,
//   isSickLeave,
//   previousWorked,
//   lastWorkedShiftType
// }) {
//   if (isRest) {
//     return buildShift("NONE");
//   }

//   if (isVacation || isSickLeave) {
//     return {
//       shiftType: "LICENSE",
//       startTime: "00:00",
//       endTime: "08:00",
//       workedHours: 8,
//       nightHours: 0,
//       holidayPaidHours: 0
//     };
//   }

//   if (isStrike) {
//     const strikeShift = strikeShiftType === "NIGHT" ? "NIGHT" : "DAY";
//     return buildShift(strikeShift);
//   }

//   let shift = { ...baseShift };

//   if (isHoliday) {
//     if (shift.shiftType === "NONE") {
//       const holidayShift = previousWorked
//         ? oppositeShift(lastWorkedShiftType || "DAY")
//         : (lastWorkedShiftType || "DAY");
//       shift = buildShift(holidayShift);
//     }

//     if (shift.workedHours > 0) {
//       shift.holidayPaidHours = shift.workedHours;
//     }
//   }

//   return shift;
// }

// module.exports = {
//   applySpecialRules,
//   getBaseShiftForDate
// };
