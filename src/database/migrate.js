require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schema created successfully');
    
    console.log('🌱 Seeding database...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log('✅ Database seeded successfully');
    
    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
