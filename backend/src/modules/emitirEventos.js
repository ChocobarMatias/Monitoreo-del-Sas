
const { io } = require("../../server");

function emitirEventoAttendanceUpdated(monthId) {
	io.emit("attendance_updated", { monthId });
}

module.exports = { emitirEventoAttendanceUpdated };