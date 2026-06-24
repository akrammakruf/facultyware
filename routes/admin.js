var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const { checkPermission } = require('../middlewares/acl');
const { uploadCommitteeFile } = require('../middlewares/uploadCommittee');

// ---------------------------------------------------------------
// FITUR 1, 2, 3: Manajemen Event (tambah, lihat, edit, publish, hapus)
// ---------------------------------------------------------------
router.get('/events', checkPermission('manage_events'), adminController.listEvents);
router.post('/events/add', checkPermission('manage_events'), adminController.addEvent);

router.get('/events/:id/edit', checkPermission('manage_events'), adminController.editEventForm);
router.post('/events/:id/edit', checkPermission('manage_events'), adminController.updateEvent);

router.post('/events/publish/:id', checkPermission('manage_events'), adminController.publishEvent);
router.post('/events/delete/:id', checkPermission('manage_events'), adminController.deleteEvent);

// ---------------------------------------------------------------
// FITUR 4, 5: Kelola panitia (halaman web: tambah, lihat detail, update, hapus)
// ---------------------------------------------------------------
router.get('/panitia', checkPermission('manage_events'), adminController.panitiaIndex);
router.get('/events/:id/panitia', checkPermission('manage_events'), adminController.committeePage);
router.post('/events/:id/panitia/add', checkPermission('manage_events'), adminController.addCommitteeMember);
router.post(
  '/events/:id/panitia/import',
  checkPermission('manage_events'),
  (req, res, next) => {
    uploadCommitteeFile.single('file')(req, res, (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran file maksimal 2MB'
            : err.message || 'File tidak valid';

        return res.redirect(
          `/admin/events/${req.params.id}/panitia?error=${encodeURIComponent(message)}`
        );
      }

      next();
    });
  },
  adminController.importCommittee
);
router.post('/events/:id/panitia/:memberId/update', checkPermission('manage_events'), adminController.updateCommitteeMember);
router.post('/events/:id/panitia/:memberId/delete', checkPermission('manage_events'), adminController.removeCommitteeMember);

// ---------------------------------------------------------------
// FITUR 6: Export panitia ke Excel / PDF / DOCX
// ---------------------------------------------------------------
router.get('/panitia/export/:id', checkPermission('manage_events'), adminController.exportExcel);
router.get('/panitia/export/:id/pdf', checkPermission('manage_events'), adminController.exportPdf);
router.get('/panitia/export/:id/docx', checkPermission('manage_events'), adminController.exportDocx);

// ---------------------------------------------------------------
// FITUR 7: REST API JSON untuk data event & panitia (GET, POST, PUT, DELETE)
// ---------------------------------------------------------------
router.get('/api/events/active', adminController.apiActiveEvents);
router.get('/api/events/deleted', adminController.apiDeletedEvents);

router.get('/api/committee/:id', adminController.apiCommittee);
router.post('/api/committee/:id', adminController.apiAddCommittee);
router.put('/api/committee/:id/:memberId', adminController.apiUpdateCommittee);
router.delete('/api/committee/:id/:memberId', adminController.apiDeleteCommittee);

module.exports = router;
