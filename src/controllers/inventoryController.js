const pool = require('../config/db');

// Get inventory dashboard
exports.getAll = async (req, res) => {
  try {
    const items = await pool.query(`SELECT * FROM inventory ORDER BY category, item_name`);
    const transactions = await pool.query(
      `SELECT it.*, i.item_name, i.unit FROM inventory_transactions it JOIN inventory i ON it.item_id = i.id ORDER BY it.created_at DESC LIMIT 30`
    );
    res.render('inventory/index', {
      title: 'Inventory & Stock',
      items: items.rows,
      transactions: transactions.rows,
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Add inventory item
exports.createItem = async (req, res) => {
  const { item_name, category, unit, current_stock, min_buffer_stock, is_perishable } = req.body;
  try {
    await pool.query(
      `INSERT INTO inventory (item_name, category, unit, current_stock, min_buffer_stock, is_perishable) VALUES ($1,$2,$3,$4,$5,$6)`,
      [item_name, category, unit, current_stock || 0, min_buffer_stock || 10, is_perishable === 'true']
    );
    res.json({ success: true, message: 'Item added to inventory' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Issue from kitchen (stock out)
exports.issueStock = async (req, res) => {
  const items = req.body.items; // Array: [{item_id, quantity, purpose}]
  const { transaction_date, issued_by } = req.body;
  try {
    const results = [];
    for (const item of items) {
      const inv = await pool.query('SELECT * FROM inventory WHERE id = $1', [item.item_id]);
      if (!inv.rows.length) continue;
      if (parseFloat(inv.rows[0].current_stock) < parseFloat(item.quantity)) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${inv.rows[0].item_name}` });
      }
      await pool.query(
        'UPDATE inventory SET current_stock = current_stock - $1, last_updated = NOW() WHERE id = $2',
        [item.quantity, item.item_id]
      );
      await pool.query(
        `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_type, purpose, transaction_date, created_by) VALUES ($1,'OUT',$2,'Kitchen Issuance',$3,$4,$5)`,
        [item.item_id, item.quantity, item.purpose || 'Kitchen/Prasad', transaction_date || new Date().toISOString().split('T')[0], issued_by || 'System']
      );
      results.push(inv.rows[0].item_name);
    }
    res.json({ success: true, message: `Issued: ${results.join(', ')}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get stock levels API (for live updates)
exports.getStockApi = async (req, res) => {
  try {
    const items = await pool.query('SELECT id, item_name, unit, current_stock, min_buffer_stock, is_perishable FROM inventory ORDER BY item_name');
    res.json(items.rows);
  } catch (err) { res.status(500).json([]); }
};

// Update stock directly
exports.adjustStock = async (req, res) => {
  const { item_id, quantity, type, purpose } = req.body;
  try {
    const op = type === 'IN' ? '+' : '-';
    await pool.query(`UPDATE inventory SET current_stock = current_stock ${op} $1, last_updated = NOW() WHERE id = $2`, [quantity, item_id]);
    await pool.query(
      `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reference_type, purpose, transaction_date) VALUES ($1,$2,$3,'Manual Adjustment',$4,CURRENT_DATE)`,
      [item_id, type, quantity, purpose || 'Stock Adjustment']
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
