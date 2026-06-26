const db = require('../lib/db');
const generateQrCode = require('../utils/generateQrCode');
const generateTicketPdf = require('../utils/generateTicketPdf');

exports.show = async (req, res, next) => {
    try {
        const ticketNumber = req.params.ticketNumber;
        const userId = req.session.userId;
        const isAdminOrPanitia = req.session.role === 'admin' || req.session.role === 'panitia';
        
        let query = `
             SELECT r.*, e.title, e.start_date, e.start_time, e.venue, e.online_link, e.delivery_mode 
             FROM event_registrations r 
             JOIN events e ON r.event_id = e.id 
             WHERE r.ticket_number = ?`;
        const queryParams = [ticketNumber];
        
        if (!isAdminOrPanitia) {
            query += ` AND r.user_id = ?`;
            queryParams.push(userId);
        }

        const [rows] = await db.query(query, queryParams);
        
        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'Tiket tidak ditemukan atau Anda tidak memiliki akses', error: { status: 404 } });
        }
        
        const registration = rows[0];
        
        // Generate QR Code
        const qrCodeDataUri = await generateQrCode(registration.ticket_number);
        
        res.render('tickets/show', { registration, qrCodeDataUri, title: 'Tiket Anda', user: req.session.username });
    } catch (err) {
        next(err);
    }
};

exports.download = async (req, res, next) => {
    try {
        const ticketNumber = req.params.ticketNumber;
        const userId = req.session.userId;
        const isAdminOrPanitia = req.session.role === 'admin' || req.session.role === 'panitia';
        
        let query = `
             SELECT r.*, e.title, e.start_date, e.start_time, e.venue, e.online_link, e.delivery_mode 
             FROM event_registrations r 
             JOIN events e ON r.event_id = e.id 
             WHERE r.ticket_number = ?`;
        const queryParams = [ticketNumber];
        
        if (!isAdminOrPanitia) {
            query += ` AND r.user_id = ?`;
            queryParams.push(userId);
        }

        const [rows] = await db.query(query, queryParams);
        
        if (rows.length === 0) {
            return res.status(404).send('Tiket tidak ditemukan atau Anda tidak memiliki akses');
        }
        
        const registration = rows[0];
        
        // Generate PDF dan pipe ke response
        await generateTicketPdf(registration, res);
        
    } catch (err) {
        next(err);
    }
};
