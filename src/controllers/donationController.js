const pool = require('../config/db');

// Helper: generate receipt number
async function generateReceiptNumber(prefix) {
  const year = new Date().getFullYear();
  const table = prefix === 'TMPL' ? 'donations' : 'commodity_donations';
  const result = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE receipt_number LIKE $1`, [`${prefix}-${year}-%`]);
  const seq = String(parseInt(result.rows[0].count) + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

// List all donations
exports.getAll = async (req, res) => {
  try {
    const { type = 'cash', page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let donations, total;
    if (type === 'commodity') {
      donations = await pool.query(`SELECT cd.*, d.name as donor_display FROM commodity_donations cd LEFT JOIN donors d ON cd.donor_id = d.id ORDER BY cd.donation_date DESC LIMIT $1 OFFSET $2`, [limit, offset]);
      total = await pool.query('SELECT COUNT(*) FROM commodity_donations');
    } else {
      donations = await pool.query(`SELECT dn.*, d.name as donor_display FROM donations dn LEFT JOIN donors d ON dn.donor_id = d.id ORDER BY dn.donation_date DESC LIMIT $1 OFFSET $2`, [limit, offset]);
      total = await pool.query('SELECT COUNT(*) FROM donations');
    }
    const donors = await pool.query('SELECT * FROM donors ORDER BY name');
    const inventoryItems = await pool.query('SELECT item_name, unit FROM inventory ORDER BY item_name');

    res.render('donations/index', {
      title: 'Donations',
      donations: donations.rows,
      donors: donors.rows,
      inventoryItems: inventoryItems.rows,
      type,
      page: parseInt(page),
      totalPages: Math.ceil(total.rows[0].count / limit),
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Search donors API
exports.searchDonors = async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM donors WHERE name ILIKE $1 OR phone ILIKE $1 OR shop_name ILIKE $1 LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json([]); }
};

// Create cash donation
exports.createCash = async (req, res) => {
  const { donor_id, donor_name, donor_phone, amount, payment_mode, purpose, is_80g, cheque_number, transaction_ref, donation_date, notes } = req.body;
  try {
    const receiptNumber = await generateReceiptNumber('TMPL');
    const result = await pool.query(
      `INSERT INTO donations (receipt_number, donor_id, donor_name, donor_phone, amount, payment_mode, purpose, is_80g, cheque_number, transaction_ref, donation_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [receiptNumber, donor_id || null, donor_name, donor_phone, amount, payment_mode, purpose, is_80g === 'true', cheque_number || null, transaction_ref || null, donation_date, notes || null]
    );
    if (donor_id) {
      await pool.query('UPDATE donors SET total_donated = total_donated + $1 WHERE id = $2', [amount, donor_id]);
    }
    // Add to petty cash if cash mode
    if (payment_mode === 'Cash') {
      await pool.query(`INSERT INTO petty_cash (entry_date, description, cash_in, reference_type, reference_id) VALUES ($1,$2,$3,'Donation',$4)`,
        [donation_date, `Cash Donation - ${receiptNumber}`, amount, result.rows[0].id]);
    }
    res.json({ success: true, receipt: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Create commodity donation
exports.createCommodity = async (req, res) => {
  const { donor_id, donor_name, donor_phone, item_name, quantity, unit, estimated_value, donation_date, notes } = req.body;
  try {
    const receiptNumber = await generateReceiptNumber('CDN');
    const result = await pool.query(
      `INSERT INTO commodity_donations (receipt_number, donor_id, donor_name, donor_phone, item_name, quantity, unit, estimated_value, donation_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [receiptNumber, donor_id || null, donor_name, donor_phone, item_name, quantity, unit, estimated_value || null, donation_date, notes || null]
    );
    // Auto-update inventory
    await pool.query(
      `UPDATE inventory SET current_stock = current_stock + $1, last_updated = NOW() WHERE item_name = $2`,
      [quantity, item_name]
    );
    // Record inventory transaction
    const invItem = await pool.query('SELECT id FROM inventory WHERE item_name = $1', [item_name]);
    if (invItem.rows.length) {
      await pool.query(
        `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_type, reference_id, purpose, transaction_date) VALUES ($1,'IN',$2,'commodity_donation',$3,$4,$5)`,
        [invItem.rows[0].id, quantity, result.rows[0].id, `Commodity Donation from ${donor_name}`, donation_date]
      );
    }
    res.json({ success: true, receipt: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get receipt for printing
exports.getReceipt = async (req, res) => {
  try {
    const { type, id } = req.params;
    let receipt;
    if (type === 'cash') {
      receipt = await pool.query(`SELECT dn.*, d.name as donor_display, d.address, d.pan_number FROM donations dn LEFT JOIN donors d ON dn.donor_id = d.id WHERE dn.id = $1`, [id]);
    } else {
      receipt = await pool.query(`SELECT cd.*, d.address FROM commodity_donations cd LEFT JOIN donors d ON cd.donor_id = d.id WHERE cd.id = $1`, [id]);
    }
    if (!receipt.rows.length) return res.status(404).render('error', { message: 'Receipt not found' });
    res.render('donations/receipt', { title: 'Donation Receipt', receipt: receipt.rows[0], type });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Donors management
exports.getDonors = async (req, res) => {
  try {
    const donors = await pool.query('SELECT * FROM donors ORDER BY total_donated DESC');
    res.render('donations/donors', { title: 'Donor Directory', donors: donors.rows });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

exports.createDonor = async (req, res) => {
  const { name, phone, email, category, shop_name, address, pan_number, is_80g_eligible } = req.body;
  try {
    await pool.query(
      `INSERT INTO donors (name, phone, email, category, shop_name, address, pan_number, is_80g_eligible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [name, phone, email || null, category, shop_name || null, address || null, pan_number || null, is_80g_eligible === 'true']
    );
    res.json({ success: true, message: 'Donor added successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
