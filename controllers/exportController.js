const db = require('../lib/db');
const ExcelJS = require('exceljs');

exports.exportExcel = async (req,res)=>{

    const [rows] =
        await db.query(
            `SELECT *
             FROM event_committee_members
             WHERE event_id=?`,
            [req.params.eventId]
        );

    const workbook =
        new ExcelJS.Workbook();

    const sheet =
        workbook.addWorksheet('Committee');

    sheet.addRows(rows);

    res.setHeader(
        'Content-Disposition',
        'attachment; filename=committee.xlsx'
    );

    await workbook.xlsx.write(res);

    res.end();
};

exports.exportPdf = async (req,res)=>{
    res.send('PDF Export');
};

exports.exportDocx = async (req,res)=>{
    res.send('DOCX Export');
};