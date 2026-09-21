-- ============================================================
-- MANDIR ERP - Seed Data
-- Realistic 20+ staff members, donors, and inventory
-- ============================================================

-- Insert Staff (20+ realistic records)
INSERT INTO staff (name, role, phone, aadhaar, date_of_joining, base_salary, bank_account, upi_id, bank_name, address) VALUES
('Pandit Ramesh Sharma', 'Priest', '9876543210', '123456789012', '2020-01-15', 25000, '12345678901234', 'ramesh.sharma@upi', 'State Bank of India', 'Near Temple, Varanasi'),
('Pandit Suresh Mishra', 'Priest', '9876543211', '234567890123', '2019-06-01', 22000, '23456789012345', 'suresh.mishra@upi', 'Punjab National Bank', 'Vishwanath Gali, Varanasi'),
('Pandit Vikram Tiwari', 'Priest', '9876543212', '345678901234', '2021-03-10', 20000, '34567890123456', 'vikram.tiwari@upi', 'HDFC Bank', 'Lanka, Varanasi'),
('Ravi Kumar Singh', 'Cook', '9876543213', '456789012345', '2018-08-20', 18000, '45678901234567', 'ravi.cook@upi', 'Bank of Baroda', 'Sarnath Road, Varanasi'),
('Mohan Prasad Gupta', 'Cook', '9876543214', '567890123456', '2020-11-01', 16000, '56789012345678', 'mohan.cook@upi', 'Allahabad Bank', 'Assi Ghat, Varanasi'),
('Sita Devi', 'Cook', '9876543215', '678901234567', '2022-01-05', 15000, '67890123456789', 'sita.cook@upi', 'UCO Bank', 'Dashashwamedh, Varanasi'),
('Ganesh Prasad', 'Cleaner', '9876543216', '789012345678', '2021-07-15', 12000, '78901234567890', 'ganesh.clean@upi', 'SBI', 'Godowlia, Varanasi'),
('Lakshmi Bai', 'Cleaner', '9876543217', '890123456789', '2022-04-01', 12000, '89012345678901', 'lakshmi.clean@upi', 'Canara Bank', 'Ramnagar, Varanasi'),
('Ramnarayan Yadav', 'Cleaner', '9876543218', '901234567890', '2023-02-10', 11000, '90123456789012', NULL, 'Bank of India', 'Varanasi Cantonment'),
('Chandan Kumar', 'Guard', '9876543219', '012345678901', '2019-12-01', 14000, '01234567890123', 'chandan.guard@upi', 'SBI', 'BHU Campus, Varanasi'),
('Ramlal Chauhan', 'Guard', '9876543220', '112345678901', '2020-09-15', 13500, '11234567890123', NULL, 'PNB', 'Sigra, Varanasi'),
('Kamlesh Patel', 'Guard', '9876543221', '212345678901', '2021-05-20', 13000, '21234567890123', NULL, 'Union Bank', 'Orderly Bazar, Varanasi'),
('Dinesh Kumar Sharma', 'Admin', '9876543222', '312345678901', '2018-01-10', 28000, '31234567890123', 'dinesh.admin@upi', 'HDFC Bank', 'Shivpur, Varanasi'),
('Priya Pandey', 'Admin', '9876543223', '412345678901', '2022-06-01', 22000, '41234567890123', 'priya.admin@upi', 'ICICI Bank', 'Naria, Varanasi'),
('Rajesh Kumar', 'Storekeeper', '9876543224', '512345678901', '2019-03-01', 16000, '51234567890123', 'rajesh.store@upi', 'Axis Bank', 'Mahmoorganj, Varanasi'),
('Santosh Yadav', 'Storekeeper', '9876543225', '612345678901', '2021-10-15', 15000, '61234567890123', NULL, 'BOB', 'Varuna, Varanasi'),
('Hanuman Das', 'Priest', '9876543226', '712345678901', '2020-04-01', 21000, '71234567890123', 'hanuman.priest@upi', 'SBI', 'Panchkoshi Marg, Varanasi'),
('Ishwar Prasad', 'Manager', '9876543227', '812345678901', '2017-06-01', 35000, '81234567890123', 'ishwar.mgr@upi', 'HDFC Bank', 'Civil Lines, Varanasi'),
('Narayan Lal', 'Cook', '9876543228', '912345678901', '2023-01-01', 14000, '91234567890123', NULL, 'UCO Bank', 'Bhelupur, Varanasi'),
('Savitri Devi', 'Cleaner', '9876543229', '013456789012', '2022-08-15', 11500, '01345678901234', NULL, 'BOI', 'Manduadih, Varanasi'),
('Badrinath Singh', 'Driver', '9876543230', '113456789012', '2020-02-10', 17000, '11345678901234', 'badri.driver@upi', 'PNB', 'Lanka, Varanasi'),
('Tulsi Ram Verma', 'Guard', '9876543231', '213456789012', '2023-03-01', 13000, '21345678901234', NULL, 'SBI', 'Nadesar, Varanasi')
ON CONFLICT DO NOTHING;

-- Insert Donors / Shopkeepers
INSERT INTO donors (name, phone, category, shop_name, address, is_80g_eligible, total_donated) VALUES
('Ramnath Agarwal Provisions', '9800001111', 'Regular Shopkeeper', 'Agarwal Kirana Store', 'Godowlia Market, Varanasi', false, 45000),
('Shree Lal Confectionery', '9800002222', 'Regular Shopkeeper', 'Shree Lal Sweets & Provisions', 'Chowk, Varanasi', false, 32000),
('Ganga Sagar Oil Depot', '9800003333', 'Regular Shopkeeper', 'Ganga Sagar Oil & Ghee', 'Lanka Market, Varanasi', false, 28000),
('Vrindavan Vegetable Market', '9800004444', 'Regular Shopkeeper', 'Vrindavan Sabzi Mandi', 'Maidagin, Varanasi', false, 15000),
('Mukesh Kumar Gupta', '9800005555', 'Devotee', NULL, 'Sunderpur Colony, Varanasi', true, 100000),
('Smt. Radha Agarwal', '9800006666', 'Devotee', NULL, 'Rajghat Colony, Varanasi', true, 75000),
('Shri Rajendra Prasad Trust', '9800007777', 'Trustee', NULL, 'BHU Road, Varanasi', true, 250000),
('Om Prakash Rice Mill', '9800008888', 'Regular Shopkeeper', 'OP Rice Mill & Trading', 'Adampura, Varanasi', false, 40000),
('Durga Devi Foundation', '9800009999', 'Trustee', NULL, 'Sigra, Varanasi', true, 180000),
('Annapurna Flour Mill', '9800010000', 'Regular Shopkeeper', 'Annapurna Atta Chakki', 'Dashashwamedh, Varanasi', false, 22000)
ON CONFLICT DO NOTHING;

-- Insert Inventory Items
INSERT INTO inventory (item_name, category, unit, current_stock, min_buffer_stock, is_perishable) VALUES
('Rice (Basmati)', 'Groceries', 'KG', 250.0, 50, false),
('Rice (Regular)', 'Groceries', 'KG', 150.0, 30, false),
('Wheat Flour (Atta)', 'Groceries', 'KG', 180.0, 40, false),
('Wheat (Whole)', 'Groceries', 'KG', 200.0, 50, false),
('Chana Dal', 'Groceries', 'KG', 80.0, 20, false),
('Moong Dal', 'Groceries', 'KG', 60.0, 15, false),
('Urad Dal', 'Groceries', 'KG', 45.0, 15, false),
('Cooking Oil (Refined)', 'Oil & Ghee', 'Liters', 120.0, 25, false),
('Pure Ghee', 'Oil & Ghee', 'KG', 30.0, 10, false),
('Sugar', 'Groceries', 'KG', 100.0, 25, false),
('Salt', 'Groceries', 'KG', 40.0, 10, false),
('Turmeric (Haldi)', 'Spices', 'KG', 15.0, 5, false),
('Red Chilli Powder', 'Spices', 'KG', 12.0, 4, false),
('Coriander Powder', 'Spices', 'KG', 10.0, 3, false),
('Potatoes', 'Vegetables', 'KG', 80.0, 20, true),
('Onions', 'Vegetables', 'KG', 60.0, 15, true),
('Tomatoes', 'Vegetables', 'KG', 20.0, 10, true),
('Bananas', 'Fruits', 'Pieces', 150.0, 50, true),
('Apples', 'Fruits', 'KG', 15.0, 5, true),
('Milk', 'Dairy', 'Liters', 50.0, 20, true),
('Paneer', 'Dairy', 'KG', 8.0, 3, true),
('Incense Sticks (Agarbatti)', 'Pooja Items', 'Packets', 50.0, 10, false),
('Camphor (Kapur)', 'Pooja Items', 'KG', 5.0, 2, false),
('Coconuts', 'Fruits', 'Pieces', 100.0, 30, false),
('Flowers (Marigold)', 'Pooja Items', 'KG', 10.0, 5, true)
ON CONFLICT (item_name) DO NOTHING;

-- Insert Sample Donations (This Month)
INSERT INTO donations (receipt_number, donor_id, donor_name, donor_phone, amount, payment_mode, purpose, donation_date) VALUES
('TMPL-2026-0001', 5, 'Mukesh Kumar Gupta', '9800005555', 5000, 'Cash', 'Navratri Special', '2026-09-01'),
('TMPL-2026-0002', 6, 'Smt. Radha Agarwal', '9800006666', 2100, 'UPI', 'Temple Renovation Fund', '2026-09-03'),
('TMPL-2026-0003', 7, 'Shri Rajendra Prasad Trust', '9800007777', 50000, 'Cheque', 'Annual Donation', '2026-09-05'),
('TMPL-2026-0004', 9, 'Durga Devi Foundation', '9800009999', 25000, 'Net Banking', 'Annadanam Fund', '2026-09-10'),
('TMPL-2026-0005', NULL, 'Walk-in Devotee', '9876543001', 501, 'Cash', 'Daan Peti', '2026-09-15')
ON CONFLICT (receipt_number) DO NOTHING;

-- Insert Sample Commodity Donations
INSERT INTO commodity_donations (receipt_number, donor_id, donor_name, donor_phone, item_name, quantity, unit, donation_date) VALUES
('CDN-2026-0001', 1, 'Ramnath Agarwal Provisions', '9800001111', 'Rice (Regular)', 50, 'KG', '2026-09-02'),
('CDN-2026-0002', 8, 'Om Prakash Rice Mill', '9800008888', 'Rice (Basmati)', 25, 'KG', '2026-09-07'),
('CDN-2026-0003', 2, 'Shree Lal Confectionery', '9800002222', 'Sugar', 20, 'KG', '2026-09-09'),
('CDN-2026-0004', 3, 'Ganga Sagar Oil Depot', '9800003333', 'Pure Ghee', 10, 'KG', '2026-09-12'),
('CDN-2026-0005', 10, 'Annapurna Flour Mill', '9800010000', 'Wheat Flour (Atta)', 30, 'KG', '2026-09-14')
ON CONFLICT (receipt_number) DO NOTHING;

-- Insert Sample Expenses
INSERT INTO expenses (expense_date, category, description, amount, payment_mode) VALUES
('2026-09-01', 'Electricity', 'Monthly Electricity Bill - UPPCL', 8500, 'Net Banking'),
('2026-09-03', 'Pooja Samagri', 'Flowers, Incense, Camphor for Navratri', 3500, 'Cash'),
('2026-09-05', 'Gas/Fuel', 'LPG Cylinder x 4', 4800, 'Cash'),
('2026-09-08', 'Cleaning', 'Cleaning Supplies & Phenyl', 1200, 'Cash'),
('2026-09-10', 'Maintenance', 'Plumbing Repair - Bathroom', 2500, 'Cash'),
('2026-09-12', 'Food/Prasad', 'Prasad Items for Sunday Bhandara', 8000, 'UPI'),
('2026-09-15', 'Decoration', 'Navratri Decoration Lights & Fabric', 12000, 'UPI'),
('2026-09-18', 'Transport', 'Diesel for Generator', 3000, 'Cash'),
('2026-09-20', 'Miscellaneous', 'Stationery & Office Supplies', 800, 'Cash')
ON CONFLICT DO NOTHING;

-- Insert Sample Pooja Bookings
INSERT INTO pooja_bookings (booking_number, devotee_name, devotee_phone, gotra, pooja_type, booking_date, pooja_time, assigned_priest_id, booking_fee, advance_paid, status) VALUES
('BOOK-2026-001', 'Sunil Kumar Agarwal', '9700001111', 'Bharadwaj', 'Satyanarayan Katha', '2026-09-22', '10:00:00', 1, 2100, 500, 'Confirmed'),
('BOOK-2026-002', 'Meena Devi Sharma', '9700002222', 'Kashyap', 'Rudrabhishek', '2026-09-23', '06:00:00', 2, 1500, 500, 'Confirmed'),
('BOOK-2026-003', 'Amit Verma', '9700003333', 'Vashishtha', 'Havan', '2026-09-25', '09:00:00', 1, 5000, 1000, 'Confirmed'),
('BOOK-2026-004', 'Kavita Singh', '9700004444', 'Atri', 'Vehicle Pooja', '2026-09-21', '11:00:00', 3, 501, 0, 'Completed'),
('BOOK-2026-005', 'Rakesh Pandey', '9700005555', 'Gautam', 'Gruhapravesh', '2026-09-28', '08:00:00', 2, 7500, 2000, 'Pending')
ON CONFLICT (booking_number) DO NOTHING;

-- Sample Petty Cash entries
INSERT INTO petty_cash (entry_date, description, cash_in, cash_out, reference_type) VALUES
('2026-09-01', 'Opening Balance', 15000, 0, 'Opening'),
('2026-09-01', 'Donation Collection - Daan Peti', 8500, 0, 'Donation'),
('2026-09-03', 'Pooja Samagri Purchase', 0, 3500, 'Expense'),
('2026-09-05', 'LPG Cylinder', 0, 4800, 'Expense'),
('2026-09-10', 'TMPL-2026-0001 Cash Donation', 5000, 0, 'Donation'),
('2026-09-15', 'Plumbing Repair', 0, 2500, 'Expense')
ON CONFLICT DO NOTHING;
