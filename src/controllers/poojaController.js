const pool = require('../config/db');

// Generate booking number
async function generateBookingNumber() {
  const year = new Date().getFullYear();
  const result = await pool.query(`SELECT COUNT(*) FROM pooja_bookings WHERE booking_number LIKE $1`, [`BOOK-${year}-%`]);
  const seq = String(parseInt(result.rows[0].count) + 1).padStart(3, '0');
  return `BOOK-${year}-${seq}`;
}

// List bookings
exports.getAll = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `SELECT pb.*, s.name as priest_name FROM pooja_bookings pb LEFT JOIN staff s ON pb.assigned_priest_id = s.id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND pb.status = $${params.length}`; }
    if (date) { params.push(date); query += ` AND pb.booking_date = $${params.length}`; }
    query += ' ORDER BY pb.booking_date, pb.pooja_time';

    const bookings = await pool.query(query, params);
    const priests = await pool.query(`SELECT id, name FROM staff WHERE role = 'Priest' AND is_active = true`);

    res.render('pooja/index', {
      title: 'Pooja Bookings',
      bookings: bookings.rows,
      priests: priests.rows,
      filters: { status, date },
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Create booking
exports.create = async (req, res) => {
  const { devotee_name, devotee_phone, gotra, pooja_type, booking_date, pooja_time, assigned_priest_id, booking_fee, advance_paid, address, special_requirements } = req.body;
  try {
    const bookingNumber = await generateBookingNumber();
    const result = await pool.query(
      `INSERT INTO pooja_bookings (booking_number, devotee_name, devotee_phone, gotra, pooja_type, booking_date, pooja_time, assigned_priest_id, booking_fee, advance_paid, address, special_requirements) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [bookingNumber, devotee_name, devotee_phone, gotra || null, pooja_type, booking_date, pooja_time || null, assigned_priest_id || null, booking_fee || 0, advance_paid || 0, address || null, special_requirements || null]
    );
    if (parseFloat(advance_paid) > 0) {
      await pool.query(`INSERT INTO petty_cash (entry_date, description, cash_in, reference_type) VALUES ($1,$2,$3,'Booking')`,
        [booking_date, `Advance for ${bookingNumber} - ${pooja_type}`, advance_paid]);
    }
    res.json({ success: true, booking: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Update booking status
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE pooja_bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
    if (status === 'Completed') {
      const booking = await pool.query('SELECT * FROM pooja_bookings WHERE id = $1', [req.params.id]);
      const balance = parseFloat(booking.rows[0].booking_fee) - parseFloat(booking.rows[0].advance_paid);
      if (balance > 0) {
        await pool.query(`INSERT INTO petty_cash (entry_date, description, cash_in, reference_type) VALUES (CURRENT_DATE,$1,$2,'Booking')`,
          [`Balance for ${booking.rows[0].booking_number}`, balance]);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get booking slip
exports.getSlip = async (req, res) => {
  try {
    const booking = await pool.query(
      `SELECT pb.*, s.name as priest_name, s.phone as priest_phone FROM pooja_bookings pb LEFT JOIN staff s ON pb.assigned_priest_id = s.id WHERE pb.id = $1`,
      [req.params.id]
    );
    if (!booking.rows.length) return res.status(404).render('error', { message: 'Booking not found' });
    res.render('pooja/slip', { title: 'Booking Slip', booking: booking.rows[0] });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};
