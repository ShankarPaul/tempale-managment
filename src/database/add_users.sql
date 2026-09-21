-- Add users table for auth
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin','admin','manager','viewer')),
  temple_name VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Truncate all seed data for fresh start
TRUNCATE TABLE inventory_transactions, petty_cash, pooja_bookings, payroll, advance_salary, attendance, expenses, commodity_donations, donations, donors, inventory, staff RESTART IDENTITY CASCADE;
