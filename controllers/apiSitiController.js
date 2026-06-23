const db = require('../lib/db');
const ExcelJS = require('exceljs');

/**
 * GET committee by event
 */
exports.getCommittee = async (req, res) => {
    try {

        const [rows] = await db.query(
            `SELECT
                ecm.id,
                ecm.event_id,
                ecm.employee_id,
                emp.name,
                ecm.role,
                ecm.is_leader
            FROM event_committee_members ecm
            LEFT JOIN employees emp
                ON emp.id = ecm.employee_id
            WHERE ecm.event_id = ?`,
            [req.params.eventId]
        );

        res.status(200).json({
            status: 'success',
            data: rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};


/**
 * POST add committee member
 */
exports.addCommittee = async (req, res) => {

    try {

        const {
            event_id,
            employee_id,
            role,
            is_leader
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO event_committee_members
            (
                event_id,
                employee_id,
                role,
                is_leader
            )
            VALUES (?, ?, ?, ?)`,
            [
                event_id,
                employee_id,
                role,
                is_leader || 0
            ]
        );

        res.status(201).json({
            status: 'success',
            committee_member_id: result.insertId
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};


/**
 * PUT update committee member
 */
exports.updateCommittee = async (req, res) => {

    try {

        const {
            role,
            is_leader
        } = req.body;

        await db.query(
            `UPDATE event_committee_members
            SET
                role = ?,
                is_leader = ?
            WHERE id = ?`,
            [
                role,
                is_leader,
                req.params.id
            ]
        );

        res.json({
            status: 'success',
            message: 'Committee updated'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};


/**
 * DELETE committee member
 */
exports.deleteCommittee = async (req, res) => {

    try {

        await db.query(
            `DELETE FROM event_committee_members
             WHERE id = ?`,
            [req.params.id]
        );

        res.json({
            status: 'success',
            message: 'Committee deleted'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};


/**
 * Export Committee Excel
 */
exports.exportCommitteeExcel = async (req, res) => {

    try {

        const [rows] = await db.query(
            `SELECT
                emp.name,
                ecm.role,
                ecm.is_leader
            FROM event_committee_members ecm
            LEFT JOIN employees emp
                ON emp.id = ecm.employee_id
            WHERE ecm.event_id = ?`,
            [req.params.eventId]
        );

        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet('Committee');

        worksheet.columns = [
            {
                header: 'Nama',
                key: 'name',
                width: 30
            },
            {
                header: 'Role',
                key: 'role',
                width: 25
            },
            {
                header: 'Leader',
                key: 'is_leader',
                width: 15
            }
        ];

        worksheet.addRows(rows);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=committee.xlsx'
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        console.error(err);

        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};