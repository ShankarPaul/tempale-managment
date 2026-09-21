require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupUsers() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_users.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Users table created & data cleared');
  } catch(e) {
    console.error('Migration error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
setupUsers();
