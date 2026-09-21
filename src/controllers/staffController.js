const pool = require('../config/db');

// List all staff
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM staff ORDER BY role, name`);
    res.render('staff/index', { title: 'Staff Management', staff: result.rows });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Add staff form
exports.getAdd = (req, res) => {
  res.render('staff/add', { title: 'Add Staff Member', staff: null });
};

// Create staff
exports.create = async (req, res) => {
  const { name, role, phone, aadhaar, date_of_joining, base_salary, bank_account, upi_id, ifsc_code, bank_name, address, emergency_contact } = req.body;
  try {
    await pool.query(
      `INSERT INTO staff (name, role, phone, aadhaar, date_of_joining, base_salary, bank_account, upi_id, ifsc_code, bank_name, address, emergency_contact) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [name, role, phone, aadhaar, date_of_joining, base_salary, bank_account || null, upi_id || null, ifsc_code || null, bank_name || null, address || null, emergency_contact || null]
    );
    res.json({ success: true, message: 'Staff member added successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Get single staff
exports.getOne = async (req, res) => {
  try {
    const staff = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    const advances = await pool.query('SELECT * FROM advance_salary WHERE staff_id = $1 ORDER BY date_given DESC', [req.params.id]);
    const payroll = await pool.query('SELECT * FROM payroll WHERE staff_id = $1 ORDER BY month DESC LIMIT 12', [req.params.id]);
    if (!staff.rows.length) return res.status(404).render('error', { message: 'Staff not found' });
    res.render('staff/profile', { title: staff.rows[0].name, staff: staff.rows[0], advances: advances.rows, payroll: payroll.rows });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Update staff
exports.update = async (req, res) => {
  const { name, role, phone, aadhaar, date_of_joining, base_salary, bank_account, upi_id, ifsc_code, bank_name, address, emergency_contact } = req.body;
  try {
    await pool.query(
      `UPDATE staff SET name=$1, role=$2, phone=$3, aadhaar=$4, date_of_joining=$5, base_salary=$6, bank_account=$7, upi_id=$8, ifsc_code=$9, bank_name=$10, address=$11, emergency_contact=$12 WHERE id=$13`,
      [name, role, phone, aadhaar, date_of_joining, base_salary, bank_account, upi_id, ifsc_code, bank_name, address, emergency_contact, req.params.id]
    );
    res.json({ success: true, message: 'Staff updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Delete staff
exports.delete = async (req, res) => {
  try {
    await pool.query('UPDATE staff SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Attendance page
exports.getAttendance = async (req, res) => {
  const month = req.query.month || new Date().toISOString().substring(0, 7);
  try {
    const staff = await pool.query('SELECT * FROM staff WHERE is_active = true ORDER BY role, name');
    const attendance = await pool.query(
      `SELECT * FROM attendance WHERE TO_CHAR(attendance_date,'YYYY-MM') = $1`, [month]
    );
    const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
    const attendanceMap = {};
    attendance.rows.forEach(a => {
      if (!attendanceMap[a.staff_id]) attendanceMap[a.staff_id] = {};
      attendanceMap[a.staff_id][new Date(a.attendance_date).getDate()] = a.status;
    });
    res.render('staff/attendance', {
      title: 'Attendance Management',
      staff: staff.rows,
      month,
      daysInMonth,
      attendanceMap,
      monthName: new Date(month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Mark attendance API
exports.markAttendance = async (req, res) => {
  const { staff_id, attendance_date, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO attendance (staff_id, attendance_date, status) VALUES ($1,$2,$3) ON CONFLICT (staff_id, attendance_date) DO UPDATE SET status = $3`,
      [staff_id, attendance_date, status]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Mark all present for a date
exports.markAllPresent = async (req, res) => {
  const { date } = req.body;
  try {
    const staff = await pool.query('SELECT id FROM staff WHERE is_active = true');
    const promises = staff.rows.map(s =>
      pool.query(`INSERT INTO attendance (staff_id, attendance_date, status) VALUES ($1,$2,'Present') ON CONFLICT (staff_id, attendance_date) DO UPDATE SET status='Present'`, [s.id, date])
    );
    await Promise.all(promises);
    res.json({ success: true, count: staff.rows.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Generate Payroll
exports.generatePayroll = async (req, res) => {
  const { month } = req.body;
  try {
    const staff = await pool.query('SELECT * FROM staff WHERE is_active = true');
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();

    const results = [];
    for (const s of staff.rows) {
      const att = await pool.query(
        `SELECT status FROM attendance WHERE staff_id=$1 AND TO_CHAR(attendance_date,'YYYY-MM')=$2`, [s.id, month]
      );
      let daysPresent = 0;
      att.rows.forEach(a => {
        if (a.status === 'Present') daysPresent += 1;
        else if (a.status === 'Half-Day') daysPresent += 0.5;
        else if (a.status === 'Paid-Leave') daysPresent += 1;
      });

      const advances = await pool.query(
        `SELECT COALESCE(SUM(amount),0) as total FROM advance_salary WHERE staff_id=$1 AND deducted=false`, [s.id]
      );
      const advanceDeduction = parseFloat(advances.rows[0].total);
      const netSalary = ((s.base_salary / daysInMonth) * daysPresent) - advanceDeduction;

      await pool.query(
        `INSERT INTO payroll (staff_id, month, base_salary, days_in_month, days_present, advance_deduction, net_salary) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (staff_id, month) DO UPDATE SET days_present=$5, advance_deduction=$6, net_salary=$7`,
        [s.id, month, s.base_salary, daysInMonth, daysPresent, advanceDeduction, Math.max(0, netSalary)]
      );

      if (advanceDeduction > 0) {
        await pool.query(`UPDATE advance_salary SET deducted=true, deducted_month=$1 WHERE staff_id=$2 AND deducted=false`, [month, s.id]);
      }
      results.push({ name: s.name, daysPresent, netSalary: Math.max(0, netSalary) });
    }
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Salary slip for printing
exports.getSalarySlip = async (req, res) => {
  try {
    const { id, month } = req.params;
    const payroll = await pool.query(`SELECT p.*, s.name, s.role, s.phone, s.upi_id, s.bank_account, s.bank_name FROM payroll p JOIN staff s ON p.staff_id = s.id WHERE p.staff_id=$1 AND p.month=$2`, [id, month]);
    if (!payroll.rows.length) return res.status(404).render('error', { message: 'Payroll record not found' });
    res.render('staff/salary-slip', { title: 'Salary Slip', payroll: payroll.rows[0] });
  } catch (err) { res.status(500).render('error', { message: err.message }); }
};

// Add advance salary
exports.addAdvance = async (req, res) => {
  const { staff_id, amount, date_given, reason } = req.body;
  try {
    await pool.query(`INSERT INTO advance_salary (staff_id, amount, date_given, reason) VALUES ($1,$2,$3,$4)`, [staff_id, amount, date_given, reason]);
    res.json({ success: true, message: 'Advance salary recorded' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
