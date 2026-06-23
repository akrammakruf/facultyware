const db = require('../lib/db');

const reminders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        er.id,
        er.channel,
        er.message,
        er.sent_at,
        e.title AS event_title,
        emp.name AS sender_name
      FROM event_reminders er
      JOIN events e ON er.event_id = e.id
      LEFT JOIN employees emp ON er.sent_by = emp.id
      ORDER BY er.sent_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data reminder.',
      error: err.message
    });
  }
};

const attendances = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ea.id,
        ea.checked_in_at,
        ea.checked_out_at,
        ea.attendance_method,
        ea.status,
        er.ticket_number,
        er.registration_number,
        e.title AS event_title,
        u.name AS participant_name,
        u.email AS participant_email
      FROM event_attendances ea
      JOIN event_registrations er ON ea.event_registration_id = er.id
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      ORDER BY ea.checked_in_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data attendance.',
      error: err.message
    });
  }
};

const attendanceRecap = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id AS event_id,
        e.title AS event_title,
        COUNT(er.id) AS total_registered,
        SUM(CASE WHEN ea.status = 'present' THEN 1 ELSE 0 END) AS total_present,
        SUM(CASE WHEN ea.status = 'partial' THEN 1 ELSE 0 END) AS total_partial,
        SUM(CASE WHEN er.attendance_status = 'no_show' THEN 1 ELSE 0 END) AS total_no_show,
        SUM(CASE WHEN ea.id IS NULL AND er.attendance_status = 'registered' THEN 1 ELSE 0 END) AS total_not_checked_in
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN event_attendances ea ON er.id = ea.event_registration_id
      GROUP BY e.id, e.title
      ORDER BY e.start_date DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil rekap attendance.',
      error: err.message
    });
  }
};

const checkin = async (req, res) => {
  const { ticket_number, attendance_method } = req.body;
  const checkedBy = req.session.userId;
  const method = attendance_method || 'manual';

  try {
    if (!ticket_number || ticket_number.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Ticket number wajib diisi.'
      });
    }

    if (!['manual', 'qr_scan', 'system'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Metode check-in tidak valid.'
      });
    }

    const [registrations] = await db.query(`
      SELECT
        er.id AS registration_id,
        er.ticket_number,
        er.attendance_status,
        er.registration_number,
        e.title AS event_title,
        u.name AS participant_name,
        u.email AS participant_email
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE er.ticket_number = ?
      LIMIT 1
    `, [ticket_number.trim()]);

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket number tidak ditemukan.'
      });
    }

    const registration = registrations[0];

    if (registration.attendance_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Registrasi peserta sudah dibatalkan.',
        data: registration
      });
    }

    const [existing] = await db.query(`
      SELECT id
      FROM event_attendances
      WHERE event_registration_id = ?
      LIMIT 1
    `, [registration.registration_id]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Peserta ini sudah melakukan check-in sebelumnya.',
        data: registration
      });
    }

    await db.query(`
      INSERT INTO event_attendances
        (event_registration_id, checked_in_at, checked_by, attendance_method, status, checked_by_id, created_at, updated_at)
      VALUES
        (?, NOW(), ?, ?, 'present', ?, NOW(), NOW())
    `, [registration.registration_id, checkedBy, method, checkedBy]);

    await db.query(`
      UPDATE event_registrations
      SET attendance_status = 'attended', updated_at = NOW()
      WHERE id = ?
    `, [registration.registration_id]);

    res.json({
      success: true,
      message: 'Check-in berhasil.',
      data: registration
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan check-in.',
      error: err.message
    });
  }
};

module.exports = {
  reminders,
  attendances,
  attendanceRecap,
  checkin
};