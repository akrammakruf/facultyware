const db = require('../lib/db');
const ExcelJS = require('exceljs');
const exportCommitteePdf = require('../utils/exportCommitteePdf');
const exportCommitteeDocx = require('../utils/exportCommitteeDocx');
const parseCommitteeFile = require('../utils/parseCommitteeFile');

function createSlug(text) {
  const baseSlug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const uniqueCode = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return `${baseSlug || 'event'}-${uniqueCode}`;
}

async function getValidEmployeeId(req) {
  const candidateIds = [
    req.session?.employee?.id,
    req.session?.employeeId,
    req.session?.user?.employee_id,
    req.session?.user?.id,
    req.session?.userId
  ].filter(Boolean);

  for (const id of candidateIds) {
    const [rows] = await db.query(
      'SELECT id FROM employees WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  const [employees] = await db.query(
    'SELECT id FROM employees ORDER BY id ASC LIMIT 1'
  );

  if (employees.length > 0) {
    return employees[0].id;
  }

  throw new Error('Tidak ada data employees. Tambahkan minimal 1 data employee terlebih dahulu.');
}

async function getEventOr404(eventId) {
  const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
  return rows.length > 0 ? rows[0] : null;
}

// ============================================================
// FITUR 1: Admin dapat menambahkan event
// ============================================================
exports.listEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE COALESCE(status, '') != 'cancelled'
        ORDER BY id DESC
      `
    );

    res.render('admin/events', { events });
  } catch (err) {
    next(err);
  }
};

exports.addEvent = async (req, res, next) => {
  try {
    const eventName = (
      req.body.name ||
      req.body.title ||
      req.body.event_name ||
      req.body.nama_event ||
      ''
    ).trim();

    if (!eventName) {
      return res.redirect('/admin/events');
    }

    const employeeId = await getValidEmployeeId(req);
    const slug = createSlug(eventName);

    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      `
        INSERT INTO events (
          title,
          slug,
          description,
          event_type,
          delivery_mode,
          start_date,
          end_date,
          status,
          created_by,
          created_by_id,
          published_by_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        eventName,
        slug,
        '',
        'seminar',
        'offline',
        today,
        today,
        'draft',
        employeeId,
        employeeId,
        employeeId
      ]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR 2: Admin dapat memperbarui data event
// (Sebelumnya tidak ada sama sekali — ditambahkan di sini)
// ============================================================
exports.editEventForm = async (req, res, next) => {
  try {
    const event = await getEventOr404(req.params.id);

    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    res.render('admin/edit-event', { event });
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    const title = (req.body.title || req.body.name || '').trim();

    if (!title) {
      return res.redirect(`/admin/events/${eventId}/edit`);
    }

    const description = req.body.description || '';
    const eventType = req.body.event_type || event.event_type || 'seminar';
    const deliveryMode = req.body.delivery_mode || event.delivery_mode || 'offline';
    const startDate = req.body.start_date || event.start_date;
    const endDate = req.body.end_date || event.end_date;
    const venue = req.body.venue || event.venue || null;
    const quota = req.body.quota ? parseInt(req.body.quota, 10) : event.quota;

    await db.query(
      `
        UPDATE events
        SET
          title = ?,
          description = ?,
          event_type = ?,
          delivery_mode = ?,
          start_date = ?,
          end_date = ?,
          venue = ?,
          quota = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        title,
        description,
        eventType,
        deliveryMode,
        startDate,
        endDate,
        venue,
        quota,
        eventId
      ]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR 3: Admin dapat mempublikasikan event
// ============================================================
exports.publishEvent = async (req, res, next) => {
  try {
    const employeeId = await getValidEmployeeId(req);

    await db.query(
      `
        UPDATE events
        SET
          status = 'published',
          published_by = ?,
          published_by_id = ?,
          published_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `,
      [employeeId, employeeId, req.params.id]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await db.query(
      `
        UPDATE events
        SET
          status = 'cancelled',
          updated_at = NOW()
        WHERE id = ?
      `,
      [req.params.id]
    );

    res.redirect('/admin/events');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR 4 & 5: Admin dapat menentukan anggota panitia
// dan melihat detail data panitia
//
// Panitia diisi langsung dengan NAMA yang diketik oleh admin
// (kolom `name` pada event_committee_members), tidak lagi
// dipilih dari dropdown data pegawai (employees).
// ============================================================

// Halaman landing "Kelola Panitia" yang diakses dari sidebar.
// Menampilkan semua event terlebih dahulu agar admin memilih
// event mana yang akan dikelola panitianya, beserta jumlah
// panitia yang sudah terdaftar pada masing-masing event.
exports.panitiaIndex = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT
          ev.*,
          COUNT(ecm.id) AS total_panitia
        FROM events ev
        LEFT JOIN event_committee_members ecm ON ecm.event_id = ev.id
        WHERE COALESCE(ev.status, '') != 'cancelled'
        GROUP BY ev.id
        ORDER BY ev.id DESC
      `
    );

    res.render('admin/panitia-index', { events });
  } catch (err) {
    next(err);
  }
};

exports.committeePage = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    const [members] = await db.query(
      `
        SELECT
          ecm.id,
          ecm.event_id,
          ecm.role,
          ecm.is_leader,
          ecm.name
        FROM event_committee_members ecm
        WHERE ecm.event_id = ?
        ORDER BY ecm.is_leader DESC, ecm.name ASC
      `,
      [eventId]
    );

    res.render('admin/committee', {
      event,
      members,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.addCommitteeMember = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const name = (req.body.name || '').trim();
    const role = (req.body.role || '').trim();
    const isLeader = req.body.is_leader ? 1 : 0;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    if (!name || !role) {
      return res.redirect(`/admin/events/${eventId}/panitia?error=Nama dan peran wajib diisi`);
    }

    const [existing] = await db.query(
      'SELECT id FROM event_committee_members WHERE event_id = ? AND LOWER(name) = LOWER(?)',
      [eventId, name]
    );

    if (existing.length > 0) {
      return res.redirect(`/admin/events/${eventId}/panitia?error=Nama ini sudah menjadi panitia event ini`);
    }

    await db.query(
      `
        INSERT INTO event_committee_members
          (event_id, name, role, is_leader, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [eventId, name, role, isLeader]
    );

    res.redirect(`/admin/events/${eventId}/panitia?success=Anggota panitia berhasil ditambahkan`);
  } catch (err) {
    next(err);
  }
};

exports.updateCommitteeMember = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const memberId = req.params.memberId;
    const name = (req.body.name || '').trim();
    const role = (req.body.role || '').trim();
    const isLeader = req.body.is_leader ? 1 : 0;

    if (!name || !role) {
      return res.redirect(`/admin/events/${eventId}/panitia?error=Nama dan peran wajib diisi`);
    }

    await db.query(
      `
        UPDATE event_committee_members
        SET name = ?, role = ?, is_leader = ?, updated_at = NOW()
        WHERE id = ? AND event_id = ?
      `,
      [name, role, isLeader, memberId, eventId]
    );

    res.redirect(`/admin/events/${eventId}/panitia?success=Data panitia berhasil diperbarui`);
  } catch (err) {
    next(err);
  }
};

exports.removeCommitteeMember = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const memberId = req.params.memberId;

    await db.query(
      'DELETE FROM event_committee_members WHERE id = ? AND event_id = ?',
      [memberId, eventId]
    );

    res.redirect(`/admin/events/${eventId}/panitia?success=Anggota panitia berhasil dihapus`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR TAMBAHAN: Import anggota panitia sekaligus dari file
// Excel (.xlsx/.xls) atau CSV. Format kolom: Nama, Peran, Ketua.
// Nama langsung disimpan sesuai isi file (tidak perlu cocok
// dengan data pegawai manapun).
// ============================================================
exports.importCommittee = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    if (!req.file) {
      return res.redirect(`/admin/events/${eventId}/panitia?error=Pilih file Excel/CSV terlebih dahulu`);
    }

    let rows;
    try {
      rows = await parseCommitteeFile(req.file.buffer, req.file.originalname);
    } catch (parseErr) {
      console.error('Gagal membaca file import panitia:', parseErr);
      return res.redirect(
        `/admin/events/${eventId}/panitia?error=${encodeURIComponent(
          'File tidak bisa dibaca. Pastikan file masih format Excel (.xlsx) atau CSV yang valid, bukan file .xls lama atau rusak'
        )}`
      );
    }

    if (rows.length === 0) {
      return res.redirect(
        `/admin/events/${eventId}/panitia?error=File kosong atau format kolom tidak dikenali (gunakan kolom Nama dan Peran)`
      );
    }

    const [existingRows] = await db.query(
      'SELECT name FROM event_committee_members WHERE event_id = ?',
      [eventId]
    );
    const existingNames = new Set(existingRows.map((r) => String(r.name || '').toLowerCase().trim()));

    let added = 0;
    let skippedDuplicate = 0;

    for (const row of rows) {
      const nameKey = row.name.toLowerCase().trim();

      if (existingNames.has(nameKey)) {
        skippedDuplicate += 1;
        continue;
      }

      await db.query(
        `
          INSERT INTO event_committee_members
            (event_id, name, role, is_leader, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `,
        [eventId, row.name.trim(), row.role || 'Panitia', row.is_leader ? 1 : 0]
      );

      existingNames.add(nameKey);
      added += 1;
    }

    const messageParts = [`${added} panitia berhasil diimpor`];
    if (skippedDuplicate > 0) messageParts.push(`${skippedDuplicate} dilewati (sudah terdaftar)`);

    const queryParam = skippedDuplicate > 0 && added === 0 ? 'error' : 'success';

    res.redirect(`/admin/events/${eventId}/panitia?${queryParam}=${encodeURIComponent(messageParts.join('. '))}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR 6: Admin dapat mengekspor data panitia ke PDF / DOCX
// (Sebelumnya hanya ada export Excel, tidak ada PDF/DOCX
// sesuai yang diminta di spesifikasi fitur)
// ============================================================
async function getCommitteeMembersForExport(eventId) {
  const [rows] = await db.query(
    `
      SELECT
        ecm.id,
        ecm.role,
        ecm.is_leader,
        ecm.name
      FROM event_committee_members ecm
      WHERE ecm.event_id = ?
      ORDER BY ecm.is_leader DESC, ecm.name ASC
    `,
    [eventId]
  );

  return rows;
}

exports.exportExcel = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const members = await getCommitteeMembersForExport(eventId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Panitia');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama', key: 'name', width: 30 },
      { header: 'Peran', key: 'role', width: 20 },
      { header: 'Ketua', key: 'is_leader', width: 10 }
    ];

    members.forEach((row, index) => {
      sheet.addRow({
        no: index + 1,
        name: row.name,
        role: row.role,
        is_leader: row.is_leader ? 'Ya' : '-'
      });
    });

    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Panitia-${eventId}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

exports.exportPdf = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    const members = await getCommitteeMembersForExport(eventId);

    await exportCommitteePdf(event, members, res);
  } catch (err) {
    next(err);
  }
};

exports.exportDocx = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    const event = await getEventOr404(eventId);
    if (!event) {
      return res.status(404).render('error', {
        message: 'Event tidak ditemukan.',
        error: { status: 404, stack: '' }
      });
    }

    const members = await getCommitteeMembersForExport(eventId);

    await exportCommitteeDocx(event, members, res);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FITUR 7: Sistem menyediakan response API JSON untuk setiap
// operasi data panitia (GET, POST, PUT, DELETE)
//
// BUG SEBELUMNYA: hanya GET yang ada (apiCommittee), dan itu pun
// rusak karena memakai tabel `committee` yang tidak ada.
// POST / PUT / DELETE belum pernah dibuat sama sekali.
// ============================================================
exports.apiActiveEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE COALESCE(status, '') != 'cancelled'
        ORDER BY id DESC
      `
    );

    res.json({
      status: 'success',
      message: 'Data event aktif',
      total: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

exports.apiDeletedEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `
        SELECT *
        FROM events
        WHERE status = 'cancelled'
        ORDER BY id DESC
      `
    );

    res.json({
      status: 'success',
      message: 'Data event yang sudah dihapus',
      total: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/api/committee/:id  -> daftar panitia sebuah event
exports.apiCommittee = async (req, res) => {
  try {
    const eventId = req.params.id;

    const [data] = await db.query(
      `
        SELECT
          ecm.id,
          ecm.event_id,
          ecm.role,
          ecm.is_leader,
          ecm.name
        FROM event_committee_members ecm
        WHERE ecm.event_id = ?
        ORDER BY ecm.is_leader DESC, ecm.name ASC
      `,
      [eventId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Data panitia event',
      total: data.length,
      data
    });
  } catch (err) {
    console.error('API apiCommittee Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// POST /admin/api/committee/:id  -> tambah anggota panitia
exports.apiAddCommittee = async (req, res) => {
  try {
    const eventId = req.params.id;
    const name = (req.body.name || '').trim();
    const role = (req.body.role || '').trim();
    const isLeader = req.body.is_leader ? 1 : 0;

    if (!name || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'name dan role wajib diisi'
      });
    }

    const [events] = await db.query('SELECT id FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Event tidak ditemukan' });
    }

    const [existing] = await db.query(
      'SELECT id FROM event_committee_members WHERE event_id = ? AND LOWER(name) = LOWER(?)',
      [eventId, name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Nama ini sudah menjadi panitia pada event ini'
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO event_committee_members
          (event_id, name, role, is_leader, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [eventId, name, role, isLeader]
    );

    res.status(201).json({
      status: 'success',
      message: 'Anggota panitia berhasil ditambahkan',
      data: {
        id: result.insertId,
        event_id: Number(eventId),
        name,
        role,
        is_leader: Boolean(isLeader)
      }
    });
  } catch (err) {
    console.error('API apiAddCommittee Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// PUT /admin/api/committee/:id/:memberId  -> update anggota panitia
exports.apiUpdateCommittee = async (req, res) => {
  try {
    const { id: eventId, memberId } = req.params;
    const name = (req.body.name || '').trim();
    const role = (req.body.role || '').trim();
    const isLeader = req.body.is_leader ? 1 : 0;

    const [existing] = await db.query(
      'SELECT id FROM event_committee_members WHERE id = ? AND event_id = ?',
      [memberId, eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Anggota panitia tidak ditemukan' });
    }

    if (!role) {
      return res.status(400).json({ status: 'error', message: 'role wajib diisi' });
    }

    await db.query(
      `
        UPDATE event_committee_members
        SET name = COALESCE(?, name), role = ?, is_leader = ?, updated_at = NOW()
        WHERE id = ? AND event_id = ?
      `,
      [name || null, role, isLeader, memberId, eventId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Data panitia berhasil diperbarui',
      data: { id: Number(memberId), event_id: Number(eventId), name, role, is_leader: Boolean(isLeader) }
    });
  } catch (err) {
    console.error('API apiUpdateCommittee Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// DELETE /admin/api/committee/:id/:memberId  -> hapus anggota panitia
exports.apiDeleteCommittee = async (req, res) => {
  try {
    const { id: eventId, memberId } = req.params;

    const [existing] = await db.query(
      'SELECT id FROM event_committee_members WHERE id = ? AND event_id = ?',
      [memberId, eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Anggota panitia tidak ditemukan' });
    }

    await db.query(
      'DELETE FROM event_committee_members WHERE id = ? AND event_id = ?',
      [memberId, eventId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Anggota panitia berhasil dihapus'
    });
  } catch (err) {
    console.error('API apiDeleteCommittee Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
