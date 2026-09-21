const pool = require('../config/db');

// Daybook page
exports.getDaybook = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const expenses = await pool.query(`SELECT * FROM expenses WHERE expense_date = $1 ORDER BY created_at DESC`, [date]);
    const cashFlow = await pool.query(`SELECT * FROM petty_cash WHERE entry_date = $1 ORDER BY created_at`, [date]);
    const totals = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN expense_date = $1 THEN amount ELSE 0 END),0) as today_expenses,
        COALESCE(SUM(CASE WHEN TO_CHAR(expense_date,'YYYY-MM') = TO_CHAR($1::date,'YYYY-MM') THEN amount ELSE 0 END),0) as month_expenses
      FROM expenses`, [date]);
    const cashBalance = await pool.query(`SELECT COALESCE(SUM(cash_in),0) - COALESCE(SUM(cash_out),0) as balance, COALESCE(SUM(CASE WHEN entry_date = $1 THEN cash_in ELSE 0 END),0) as today_in, COALESCE(SUM(CASE WHEN entry_date = $1 THEN cash_out ELSE 0 END),0) as today_out FROM petty_cash`, [date]);
    const monthDonations = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM') = TO_CHAR($1::date,'YYYY-MM') AND payment_mode = 'Cash'`, [date]);

    res.render('expenses/daybook', {
      title: 'Daybook & Petty Cash',
      expenses: expenses.rows,
      cashFlow: cashFlow.rows,
      date,
      totals: totals.rows[0],
      cashBalance: cashBalance.rows[0],
      monthDonations: monthDonations.rows[0],
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Add expense
exports.addExpense = async (req, res) => {
  const { expense_date, category, description, amount, payment_mode, approved_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO expenses (expense_date, category, description, amount, payment_mode, approved_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [expense_date, category, description, amount, payment_mode || 'Cash', approved_by || null]
    );
    if ((payment_mode || 'Cash') === 'Cash') {
      await pool.query(`INSERT INTO petty_cash (entry_date, description, cash_out, reference_type, reference_id) VALUES ($1,$2,$3,'Expense',$4)`,
        [expense_date, `${category}: ${description}`, amount, result.rows[0].id]);
    }
    res.json({ success: true, expense: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// List all expenses
exports.getAll = async (req, res) => {
  try {
    const { month } = req.query;
    const thisMonth = month || new Date().toISOString().substring(0, 7);
    const expenses = await pool.query(
      `SELECT * FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM') = $1 ORDER BY expense_date DESC`,
      [thisMonth]
    );
    const summary = await pool.query(
      `SELECT category, SUM(amount) as total FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM') = $1 GROUP BY category ORDER BY total DESC`,
      [thisMonth]
    );
    res.render('expenses/index', { title: 'Expenses', expenses: expenses.rows, summary: summary.rows, month: thisMonth });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};
