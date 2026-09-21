-- ============================================================
-- MANDIR ERP - Complete Database Schema
-- Temple Management System
-- ============================================================

-- Users / Auth Table
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

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Priest','Cook','Cleaner','Guard','Admin','Storekeeper','Manager','Driver')),
  phone VARCHAR(15),
  aadhaar VARCHAR(12),
  date_of_joining DATE NOT NULL,
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  bank_account VARCHAR(30),
  upi_id VARCHAR(50),
  ifsc_code VARCHAR(11),
  bank_name VARCHAR(50),
  address TEXT,
  emergency_contact VARCHAR(15),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Present','Absent','Half-Day','Paid-Leave','Holiday')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, attendance_date)
);

-- Advance Salary Ledger
CREATE TABLE IF NOT EXISTS advance_salary (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  date_given DATE NOT NULL,
  reason TEXT,
  deducted BOOLEAN DEFAULT FALSE,
  deducted_month VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Records
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  base_salary NUMERIC(10,2),
  days_in_month INTEGER,
  days_present NUMERIC(5,2),
  festival_bonus NUMERIC(10,2) DEFAULT 0,
  overtime_amount NUMERIC(10,2) DEFAULT 0,
  advance_deduction NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2),
  payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Paid','Partial')),
  payment_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, month)
);

-- Donors / Shopkeepers
CREATE TABLE IF NOT EXISTS donors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100),
  category VARCHAR(30) DEFAULT 'Devotee' CHECK (category IN ('Regular Shopkeeper','Devotee','Trustee','Corporate','Anonymous')),
  shop_name VARCHAR(100),
  address TEXT,
  pan_number VARCHAR(10),
  is_80g_eligible BOOLEAN DEFAULT FALSE,
  total_donated NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cash / Digital Donations
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(20) UNIQUE NOT NULL,
  donor_id INTEGER REFERENCES donors(id),
  donor_name VARCHAR(100),
  donor_phone VARCHAR(15),
  amount NUMERIC(12,2) NOT NULL,
  payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash','UPI','Card','Net Banking','Cheque','DD')),
  purpose VARCHAR(200),
  is_80g BOOLEAN DEFAULT FALSE,
  cheque_number VARCHAR(20),
  transaction_ref VARCHAR(50),
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commodity / In-Kind Donations
CREATE TABLE IF NOT EXISTS commodity_donations (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(20) UNIQUE NOT NULL,
  donor_id INTEGER REFERENCES donors(id),
  donor_name VARCHAR(100) NOT NULL,
  donor_phone VARCHAR(15),
  item_name VARCHAR(100) NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('KG','Grams','Quintals','Liters','Bags','Packets','Pieces','Dozens')),
  estimated_value NUMERIC(10,2),
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'Groceries' CHECK (category IN ('Groceries','Vegetables','Fruits','Spices','Oil & Ghee','Dairy','Clothing','Precious Metals','Pooja Items','Other')),
  unit VARCHAR(20) NOT NULL,
  current_stock NUMERIC(12,3) DEFAULT 0,
  min_buffer_stock NUMERIC(12,3) DEFAULT 10,
  is_perishable BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('IN','OUT')),
  quantity NUMERIC(10,3) NOT NULL,
  reference_type VARCHAR(30),
  reference_id INTEGER,
  purpose TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Electricity','Pooja Samagri','Maintenance','Gas/Fuel','Cleaning','Salaries','Miscellaneous','Food/Prasad','Security','Decoration','Transport','Medical')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_mode VARCHAR(20) DEFAULT 'Cash' CHECK (payment_mode IN ('Cash','UPI','Card','Net Banking','Cheque')),
  approved_by VARCHAR(100),
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Petty Cash Ledger
CREATE TABLE IF NOT EXISTS petty_cash (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  cash_in NUMERIC(10,2) DEFAULT 0,
  cash_out NUMERIC(10,2) DEFAULT 0,
  reference_type VARCHAR(30),
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pooja Bookings
CREATE TABLE IF NOT EXISTS pooja_bookings (
  id SERIAL PRIMARY KEY,
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  devotee_name VARCHAR(100) NOT NULL,
  devotee_phone VARCHAR(15),
  gotra VARCHAR(50),
  pooja_type VARCHAR(100) NOT NULL CHECK (pooja_type IN ('Satyanarayan Katha','Havan','Rudrabhishek','Vehicle Pooja','Gruhapravesh','Naamkaran','Mundan','Vivah Pooja','Navgrah Pooja','Kanya Pooja','Custom')),
  booking_date DATE NOT NULL,
  pooja_time TIME,
  assigned_priest_id INTEGER REFERENCES staff(id),
  booking_fee NUMERIC(10,2) DEFAULT 0,
  advance_paid NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Confirmed' CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
  address TEXT,
  special_requirements TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_receipt ON donations(receipt_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_donors_phone ON donors(phone);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);
