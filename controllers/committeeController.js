const db = require('../lib/db');

exports.committeeDetail = async (req, res) => {

    const [committee] =
        await db.query(
            `SELECT
                ecm.*,
                emp.name
            FROM event_committee_members ecm
            LEFT JOIN employees emp
            ON emp.id = ecm.employee_id
            WHERE ecm.event_id = ?`,
            [req.params.eventId]
        );

    res.render(
        'admin/committee/detail',
        {
            committee
        }
    );
};

exports.addCommittee = async (req, res) => {

    const {
        event_id,
        employee_id,
        role,
        is_leader
    } = req.body;

    await db.query(
        `INSERT INTO
        event_committee_members
        (
            event_id,
            employee_id,
            role,
            is_leader
        )
        VALUES
        (?, ?, ?, ?)`,
        [
            event_id,
            employee_id,
            role,
            is_leader
        ]
    );

    res.redirect('back');
};