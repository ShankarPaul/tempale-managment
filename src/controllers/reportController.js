const pool = require('../config/db');
const ExcelJS = require('exceljs');

// Reports dashboard
exports.getReports = async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  try {
    const incomeTotal = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM')=$1`, [month]);
    const expenseTotal = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM')=$1`, [month]);
    const expenseByCategory = await pool.query(`SELECT category, SUM(amount) as total FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM')=$1 GROUP BY category ORDER BY total DESC`, [month]);
    const topDonors = await pool.query(`SELECT donor_name, SUM(amount) as total FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM')=$1 GROUP BY donor_name ORDER BY total DESC LIMIT 10`, [month]);
    const donationByMode = await pool.query(`SELECT payment_mode, SUM(amount) as total, COUNT(*) as count FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM')=$1 GROUP BY payment_mode`, [month]);
    const commodityDonations = await pool.query(`SELECT item_name, SUM(quantity) as total_qty, unit FROM commodity_donations WHERE TO_CHAR(donation_date,'YYYY-MM')=$1 GROUP BY item_name, unit ORDER BY total_qty DESC`, [month]);
    const payrollTotal = await pool.query(`SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE month=$1`, [month]);
    const inventoryValue = await pool.query(`SELECT category, COUNT(*) as items FROM inventory GROUP BY category`);

    // 6-month trend
    const trend = await pool.query(`
      WITH months AS (
        SELECT generate_series(NOW()-INTERVAL '5 months', NOW(), INTERVAL '1 month')::date as m
      ),
      income AS (SELECT TO_CHAR(donation_date,'YYYY-MM') as mo, SUM(amount) as inc FROM donations GROUP BY mo),
      expenses AS (SELECT TO_CHAR(expense_date,'YYYY-MM') as mo, SUM(amount) as exp FROM expenses GROUP BY mo)
      SELECT TO_CHAR(m,'Mon YYYY') as month, COALESCE(inc,0) as income, COALESCE(exp,0) as expense
      FROM months LEFT JOIN income ON TO_CHAR(m,'YYYY-MM') = income.mo LEFT JOIN expenses ON TO_CHAR(m,'YYYY-MM') = expenses.mo
      ORDER BY m
    `);

    res.render('reports/index', {
      title: 'Reports & Analytics',
      month,
      incomeTotal: parseFloat(incomeTotal.rows[0].total),
      expenseTotal: parseFloat(expenseTotal.rows[0].total),
      payrollTotal: parseFloat(payrollTotal.rows[0].total),
      netBalance: parseFloat(incomeTotal.rows[0].total) - parseFloat(expenseTotal.rows[0].total),
      expenseByCategory: expenseByCategory.rows,
      topDonors: topDonors.rows,
      donationByMode: donationByMode.rows,
      commodityDonations: commodityDonations.rows,
      inventoryValue: inventoryValue.rows,
      trend: JSON.stringify(trend.rows),
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Export Donations to Excel
exports.exportDonations = async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  try {
    const donations = await pool.query(
      `SELECT receipt_number, donor_name, donor_phone, amount, payment_mode, purpose, donation_date, is_80g FROM donations WHERE TO_CHAR(donation_date,'YYYY-MM')=$1 ORDER BY donation_date`,
      [month]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Donations');
    sheet.addRow(['Receipt No', 'Donor Name', 'Phone', 'Amount (₹)', 'Mode', 'Purpose', 'Date', '80G']);
    donations.rows.forEach(r => {
      sheet.addRow([r.receipt_number, r.donor_name, r.donor_phone, r.amount, r.payment_mode, r.purpose, new Date(r.donation_date).toLocaleDateString('en-IN'), r.is_80g ? 'Yes' : 'No']);
    });
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(c => c.width = 18);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=donations-${month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Export Expenses to Excel
exports.exportExpenses = async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  try {
    const expenses = await pool.query(
      `SELECT expense_date, category, description, amount, payment_mode, approved_by FROM expenses WHERE TO_CHAR(expense_date,'YYYY-MM')=$1 ORDER BY expense_date`,
      [month]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenses');
    sheet.addRow(['Date', 'Category', 'Description', 'Amount (₹)', 'Mode', 'Approved By']);
    expenses.rows.forEach(r => {
      sheet.addRow([new Date(r.expense_date).toLocaleDateString('en-IN'), r.category, r.description, r.amount, r.payment_mode, r.approved_by || '-']);
    });
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(c => c.width = 20);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Export Payroll to Excel
exports.exportPayroll = async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  try {
    const payroll = await pool.query(
      `SELECT s.name, s.role, p.base_salary, p.days_in_month, p.days_present, p.festival_bonus, p.advance_deduction, p.net_salary, p.payment_status FROM payroll p JOIN staff s ON p.staff_id = s.id WHERE p.month=$1 ORDER BY s.role, s.name`,
      [month]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payroll');
    sheet.addRow(['Name', 'Role', 'Base Salary', 'Days/Month', 'Days Present', 'Bonus', 'Advance Deduction', 'Net Salary', 'Status']);
    payroll.rows.forEach(r => {
      sheet.addRow([r.name, r.role, r.base_salary, r.days_in_month, r.days_present, r.festival_bonus, r.advance_deduction, r.net_salary, r.payment_status]);
    });
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach(c => c.width = 16);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll-${month}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};
