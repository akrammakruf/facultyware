const db = require('../lib/db');

exports.listEvents = async (req, res) => {

    const [events] =
        await db.query('SELECT * FROM events');

    res.render('admin/events/index', {
        events
    });
};

exports.addEvent = async (req, res) => {

    const {
        title,
        description,
        start_date,
        end_date,
        venue,
        quota
    } = req.body;

    await db.query(
        `INSERT INTO events
        (
            title,
            description,
            start_date,
            end_date,
            venue,
            quota,
            status
        )
        VALUES
        (?, ?, ?, ?, ?, ?, 'draft')`,
        [
            title,
            description,
            start_date,
            end_date,
            venue,
            quota
        ]
    );

    res.redirect('/admin/events');
};

exports.updateEvent = async (req, res) => {

    const {
        title,
        description,
        venue,
        quota
    } = req.body;

    await db.query(
        `UPDATE events
        SET
        title=?,
        description=?,
        venue=?,
        quota=?
        WHERE id=?`,
        [
            title,
            description,
            venue,
            quota,
            req.params.id
        ]
    );

    res.redirect('/admin/events');
};

exports.publishEvent = async (req, res) => {

    await db.query(
        `UPDATE events
         SET status='published'
         WHERE id=?`,
        [req.params.id]
    );

    res.redirect('/admin/events');
};