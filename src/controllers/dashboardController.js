const pool = require('../config/db');

// Dashboard Stats
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const [staffResult, donationResult, expenseResult, inventoryResult, bookingResult, cashResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM staff WHERE is_active = true'),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM') = $1`, [thisMonth]),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM') = $1`, [thisMonth]),
      pool.query(`SELECT COUNT(*) as low FROM inventory WHERE current_stock <= min_buffer_stock`),
      pool.query(`SELECT COUNT(*) FROM pooja_bookings WHERE booking_date >= $1 AND status = 'Confirmed'`, [today]),
      pool.query(`SELECT COALESCE(SUM(cash_in),0) - COALESCE(SUM(cash_out),0) as balance FROM petty_cash`),
    ]);

    const recentDonations = await pool.query(
      `SELECT d.*, dn.name as donor_display FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.id ORDER BY d.created_at DESC LIMIT 5`
    );
    const recentExpenses = await pool.query(
      `SELECT * FROM expenses ORDER BY expense_date DESC LIMIT 5`
    );
    const upcomingBookings = await pool.query(
      `SELECT pb.*, s.name as priest_name FROM pooja_bookings pb LEFT JOIN staff s ON pb.assigned_priest_id = s.id WHERE pb.booking_date >= $1 ORDER BY pb.booking_date LIMIT 5`, [today]
    );
    const lowStockItems = await pool.query(
      `SELECT * FROM inventory WHERE current_stock <= min_buffer_stock ORDER BY category`
    );

    // Monthly chart data
    const monthlyData = await pool.query(`
      SELECT 
        TO_CHAR(donation_date,'Mon') as month,
        SUM(amount) as income
      FROM donations
      WHERE donation_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(donation_date,'Mon'), DATE_TRUNC('month', donation_date)
      ORDER BY DATE_TRUNC('month', donation_date)
    `);

    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        totalStaff: staffResult.rows[0].count,
        monthlyDonations: parseFloat(donationResult.rows[0].total).toLocaleString('en-IN'),
        monthlyExpenses: parseFloat(expenseResult.rows[0].total).toLocaleString('en-IN'),
        lowStockCount: inventoryResult.rows[0].low,
        upcomingBookings: bookingResult.rows[0].count,
        cashBalance: parseFloat(cashResult.rows[0].balance).toLocaleString('en-IN'),
      },
      recentDonations: recentDonations.rows,
      recentExpenses: recentExpenses.rows,
      upcomingBookings: upcomingBookings.rows,
      lowStockItems: lowStockItems.rows,
      monthlyData: JSON.stringify(monthlyData.rows),
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: err.message });
  }
};
