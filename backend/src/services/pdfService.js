import PDFDocument from 'pdfkit';

export const pdfService = {
  buildAttendancePdf(records, user) {
    const doc = new PDFDocument({ margin: 30 });
    doc.fontSize(18).text(`Attendance Sheet - ${user.fullName}`);
    doc.moveDown();

    records.forEach((r) => {
      doc
        .fontSize(11)
        .text(`${new Date(r.workDate).toISOString().slice(0, 10)} | ${r.shiftStart}-${r.shiftEnd} | hours: ${r.hours} | holiday: ${r.isHoliday ? 'yes' : 'no'}`);
    });

    doc.end();
    return doc;
  }
};
