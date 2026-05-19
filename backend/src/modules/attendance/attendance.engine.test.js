// attendance.engine.test.js
// Pruebas unitarias para el motor de generación de horarios ciclo A/B

const { getWeekType, getBaseShiftByCycle, applyRules } = require("./attendance.engine");

describe("Motor ciclo A/B", () => {
  const cycleStartDate = new Date(2026, 2, 31); // 31/03/2026 (martes)

  test("getWeekType alterna correctamente desde semana A inicial", () => {
    expect(getWeekType(new Date(2026, 2, 31), cycleStartDate, "A")).toBe("A"); // día 0
    expect(getWeekType(new Date(2026, 3, 1), cycleStartDate, "A")).toBe("A"); // día 1
    expect(getWeekType(new Date(2026, 3, 7), cycleStartDate, "A")).toBe("A"); // fin semana 1
    expect(getWeekType(new Date(2026, 3, 8), cycleStartDate, "A")).toBe("B"); // inicio semana 2
    expect(getWeekType(new Date(2026, 3, 15), cycleStartDate, "A")).toBe("A"); // semana 3
  });

  test("getBaseShiftByCycle semana A", () => {
    // Lunes(1), Miércoles(3), Viernes(5), Sábado(6), Domingo(0): NIGHT
    expect(getBaseShiftByCycle("A", 1)).toBe("NIGHT");
    expect(getBaseShiftByCycle("A", 3)).toBe("NIGHT");
    expect(getBaseShiftByCycle("A", 5)).toBe("NIGHT");
    expect(getBaseShiftByCycle("A", 6)).toBe("NIGHT");
    expect(getBaseShiftByCycle("A", 0)).toBe("NIGHT");
    // Martes(2), Jueves(4): NONE
    expect(getBaseShiftByCycle("A", 2)).toBe("NONE");
    expect(getBaseShiftByCycle("A", 4)).toBe("NONE");
  });

  test("getBaseShiftByCycle semana B", () => {
    // Martes(2), Jueves(4): NIGHT
    expect(getBaseShiftByCycle("B", 2)).toBe("NIGHT");
    expect(getBaseShiftByCycle("B", 4)).toBe("NIGHT");
    // Sábado(6), Domingo(0): DAY
    expect(getBaseShiftByCycle("B", 6)).toBe("DAY");
    expect(getBaseShiftByCycle("B", 0)).toBe("DAY");
    // Lunes(1), Miércoles(3), Viernes(5): NONE
    expect(getBaseShiftByCycle("B", 1)).toBe("NONE");
    expect(getBaseShiftByCycle("B", 3)).toBe("NONE");
    expect(getBaseShiftByCycle("B", 5)).toBe("NONE");
  });

  test("applyRules: feriado en día libre se vuelve laborable DAY", () => {
    const shift = applyRules({ baseShift: "NONE", isHoliday: true, prevWorked: true });
    expect(shift.shiftType).toBe("DAY");
    expect(shift.startTime).toBe("08:00");
    expect(shift.holidayPaidHours).toBe(12);
  });

  test("applyRules: feriado en laborable mantiene turno normal (NIGHT)", () => {
    const shift = applyRules({ baseShift: "NIGHT", isHoliday: true, prevWorked: false });
    expect(shift.shiftType).toBe("NIGHT");
    expect(shift.startTime).toBe("20:00");
    expect(shift.holidayPaidHours).toBe(12);
  });

  test("applyRules: paro en día laborable → 0 horas, mantiene shiftType", () => {
    const shift = applyRules({ baseShift: "NIGHT", isHoliday: false, isStrike: true, prevWorked: true });
    expect(shift.shiftType).toBe("NIGHT");
    expect(shift.workedHours).toBe(0);
    expect(shift.nightHours).toBe(0);
    expect(shift.holidayPaidHours).toBe(0);
  });

  test("applyRules: paro en día libre → NONE sin cambio", () => {
    const shift = applyRules({ baseShift: "NONE", isHoliday: false, isStrike: true, prevWorked: false });
    expect(shift.shiftType).toBe("NONE");
    expect(shift.workedHours).toBe(0);
  });

  test("applyRules: día normal laborable", () => {
    const shift = applyRules({ baseShift: "NIGHT", isHoliday: false, prevWorked: true });
    expect(shift.shiftType).toBe("NIGHT");
    expect(shift.startTime).toBe("20:00");
    expect(shift.holidayPaidHours).toBe(0);
  });
});
