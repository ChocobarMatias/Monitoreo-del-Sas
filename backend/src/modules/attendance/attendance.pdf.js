const PDFDocument = require("pdfkit");

const getMonthName = (month) => {
  const months = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];

  return months[month - 1] || "";
};


const generateAttendancePDF = ({ rows, meta }) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 30,
  });

  const pageWidth = doc.page.width;
  const tableWidth = 500;

  const startX = (pageWidth - tableWidth) / 2;
  let y = 30;

  const colWidths = [30, 90, 90, 90, 200];
  const rowHeight = 16;

  function drawCell(text, x, y, width, height, options = {}) {
    if (options.fill) {
      doc.rect(x, y, width, height).fill(options.fill);
      doc.fillColor("black");
    } else {
      doc.rect(x, y, width, height).stroke();
    }

    doc.fontSize(8).text(text, x + 3, y + 4, {
      width: width - 6,
      align: "center",
    });
  }

  // ===== HEADER =====
  doc.font("Helvetica-Bold");

  drawCell("CONTROL DE HORAS, BENJA", startX, y, tableWidth, 18, {
    fill: "yellow",
  });
  y += 18;

  doc.font("Helvetica");

  drawCell(`SERVICIO: ${meta.servicio}`, startX, y, tableWidth, 14);
  y += 14;

  drawCell(`MES: ${getMonthName(meta.mes)}   AÑO: ${meta.year}`, startX, y, tableWidth, 14);
  y += 14;

  drawCell(`OPERADOR: ${meta.operador}`, startX, y, tableWidth, 14);
  y += 18;

  // ===== TABLE HEADER =====
  const headers = ["N°", "Día", "Ingreso", "Egreso", "Horas"];

  let x = startX;

  doc.font("Helvetica-Bold");

  headers.forEach((h, i) => {
    drawCell(h, x, y, colWidths[i], rowHeight, { fill: "yellow" });
    x += colWidths[i];
  });

  y += rowHeight;

  doc.font("Helvetica");

  // ===== ROWS =====
  rows.forEach((r, i) => {
    let x = startX;

    const rowData = [
      i + 1,
      r.day_name,
      r.start_time || "-",
      r.end_time || "-",
      r.worked_hours || "0",
    ];

    rowData.forEach((cell, j) => {
      drawCell(String(cell), x, y, colWidths[j], rowHeight);
      x += colWidths[j];
    });

    y += rowHeight;
  });

  // ===== TOTAL =====
  y += 40;

  doc.font("Helvetica-Bold");

  drawCell(
    `TOTAL DE HORAS: ${meta.total}`,
    startX,
    y,
    tableWidth,
    18,
    { fill: "yellow" }
  );

  // ===== FIRMA =====
  y += 120;

  const lineWidth = 180;

  doc.moveTo(startX, y).lineTo(startX + lineWidth, y).stroke();
  doc.moveTo(startX + 240, y).lineTo(startX + 240 + lineWidth, y).stroke();

  y += 20;

  doc.fontSize(8).text("FIRMA", startX + 60, y);
  doc.text("ACLARACION", startX + 300, y);

  return doc;
}

module.exports = { generateAttendancePDF };