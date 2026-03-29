
const PDFDocument = require("pdfkit");

function generateAttendancePDF({ rows, meta }) {
  const doc = new PDFDocument({ margin: 30 });

  doc.fontSize(14).text("CONTROL DE HORAS", { align: "center" });

  doc.moveDown();
  doc.fontSize(10);

  doc.text(`Servicio: ${meta.servicio}`);
  doc.text(`Mes: ${meta.mes} Año: ${meta.year}`);
  doc.text(`Operador: ${meta.operador}`);

  doc.moveDown();

  const startX = 50;
  let y = 150;

  doc.text("N°", startX, y);
  doc.text("Día", startX + 40, y);
  doc.text("Ingreso", startX + 120, y);
  doc.text("Egreso", startX + 200, y);
  doc.text("Horas", startX + 280, y);

  y += 20;

  rows.forEach((r, i) => {
    doc.text(i + 1, startX, y);
    doc.text(r.day_name, startX + 40, y);
    doc.text(r.start_time || "-", startX + 120, y);
    doc.text(r.end_time || "-", startX + 200, y);
    doc.text(r.worked_hours, startX + 280, y);
    y += 18;
  });

  doc.moveDown();
  doc.text(`TOTAL HORAS: ${meta.total}`);

  return doc;
}

module.exports = { generateAttendancePDF };