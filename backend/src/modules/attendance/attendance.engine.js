function oppositeShift(shiftType) {
  return shiftType === "DAY" ? "NIGHT" : "DAY";
}

function buildShift(shiftType, options = {}) {
  if (!shiftType || shiftType === "NONE") {
    return {
      shiftType: "NONE",
      startTime: null,
      endTime: null,
      workedHours: 0,
      nightHours: 0,
      holidayPaidHours: 0,
      ...options
    };
  }

  const isDay = shiftType === "DAY";
  return {
    shiftType,
    startTime: isDay ? "08:00" : "20:00",
    endTime: isDay ? "20:00" : "08:00",
    workedHours: 12,
    nightHours: isDay ? 0 : 8,
    holidayPaidHours: 0,
    ...options
  };
}

function getBaseShiftForDate({ previousWorked, lastWorkedShiftType }) {
  if (previousWorked) {
    return buildShift("NONE");
  }

  if (!lastWorkedShiftType) {
    return buildShift("DAY");
  }

  return buildShift(oppositeShift(lastWorkedShiftType));
}

function applySpecialRules({
  baseShift,
  isHoliday,
  isStrike,
  strikeShiftType,
  isRest,
  isVacation,
  isSickLeave,
  previousWorked,
  lastWorkedShiftType
}) {
  if (isRest) {
    return buildShift("NONE");
  }

  if (isVacation || isSickLeave) {
    return {
      shiftType: "LICENSE",
      startTime: "00:00",
      endTime: "08:00",
      workedHours: 8,
      nightHours: 0,
      holidayPaidHours: 0
    };
  }

  if (isStrike) {
    const strikeShift = strikeShiftType === "NIGHT" ? "NIGHT" : "DAY";
    return buildShift(strikeShift);
  }

  let shift = { ...baseShift };

  if (isHoliday) {
    if (shift.shiftType === "NONE") {
      const holidayShift = previousWorked
        ? oppositeShift(lastWorkedShiftType || "DAY")
        : (lastWorkedShiftType || "DAY");
      shift = buildShift(holidayShift);
    }

    if (shift.workedHours > 0) {
      shift.holidayPaidHours = shift.workedHours;
    }
  }

  return shift;
}

module.exports = {
  applySpecialRules,
  getBaseShiftForDate
};
