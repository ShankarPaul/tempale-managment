require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.getLogin = (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/');
  res.render('auth/login', { title: 'Login', error: null });
};

exports.getSignup = (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/');
  res.render('auth/signup', { title: 'Create Account', error: null });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase().trim()]);
    if (!result.rows.length) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.templeName = user.temple_name || 'Shri Mandir Trust';
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { title: 'Login', error: 'Server error. Please try again.' });
  }
};

exports.postSignup = async (req, res) => {
  const { name, email, password, confirm_password, temple_name } = req.body;
  if (password !== confirm_password) {
    return res.render('auth/signup', { title: 'Create Account', error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.render('auth/signup', { title: 'Create Account', error: 'Password must be at least 6 characters' });
  }
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists.rows.length) {
      return res.render('auth/signup', { title: 'Create Account', error: 'Email already registered. Please login.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, temple_name) VALUES ($1,$2,$3,'superadmin',$4) RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), hash, temple_name?.trim() || 'Shri Mandir Trust']
    );
    req.session.userId = user.rows[0].id;
    req.session.userName = user.rows[0].name;
    req.session.userRole = 'superadmin';
    req.session.templeName = user.rows[0].temple_name;
    res.redirect('/');
  } catch (err) {
    res.render('auth/signup', { title: 'Create Account', error: 'Registration failed: ' + err.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
};
