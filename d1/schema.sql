-- Cloudflare D1 SQLite Database Schema for AI Mortgage Command Center
-- Database: ai-mortgage-db (ID: 342ef1e9-b708-4885-8511-2441eea2d0f7)

CREATE TABLE IF NOT EXISTS mortgage_inquiries (
  id TEXT PRIMARY KEY,
  reference_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'EMAIL',
  province TEXT DEFAULT 'ON',
  city TEXT NOT NULL,
  purpose TEXT DEFAULT 'PURCHASE',
  is_first_time_buyer INTEGER DEFAULT 0,
  property_price REAL NOT NULL,
  down_payment REAL NOT NULL,
  requested_loan REAL NOT NULL,
  gross_annual_income REAL NOT NULL,
  employment_type TEXT DEFAULT 'SALARIED_FULL_TIME',
  credit_score_estimate INTEGER DEFAULT 720,
  timeline TEXT DEFAULT 'Within 60 Days',
  notes TEXT,
  estimated_monthly_payment REAL,
  qualifying_rate_pct REAL,
  contract_rate_pct REAL DEFAULT 4.79,
  down_payment_pct REAL,
  insurance_required INTEGER DEFAULT 0,
  status TEXT DEFAULT 'NEW_BORROWER_INQUIRY',
  source_page TEXT DEFAULT 'contact_page',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  province TEXT DEFAULT 'ON',
  team_size TEXT DEFAULT '5-20 brokers',
  message TEXT,
  status TEXT DEFAULT 'SAVED_D1_DEMO',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed initial test inquiry
INSERT OR IGNORE INTO mortgage_inquiries (
  id, reference_code, full_name, email, phone, province, city, purpose,
  is_first_time_buyer, property_price, down_payment, requested_loan,
  gross_annual_income, employment_type, credit_score_estimate, timeline,
  notes, estimated_monthly_payment, qualifying_rate_pct, contract_rate_pct,
  down_payment_pct, insurance_required, status, source_page
) VALUES (
  'inq-demo-001', 'CAN-INQ-2026-1001', 'Jordan Campbell', 'jordan.campbell@demo-borrower.ca',
  '(416) 555-0199', 'ON', 'Toronto', 'PURCHASE', 1, 780000, 78000, 702000,
  158000, 'SALARIED_FULL_TIME', 740, 'Within 30 Days',
  'First-time buyer with FHSA savings and pre-approval inquiry.',
  4198.50, 6.79, 4.79, 10.0, 1, 'READY FOR HUMAN REVIEW', 'seed_data'
);

