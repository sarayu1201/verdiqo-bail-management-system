-- ==========================================
-- VERDIQO: BAIL MANAGEMENT SYSTEM FOR INDIAN COURTS
-- Database Schema (PostgreSQL)
-- Client: QUANTEX INTELLIGENCE SYSTEMS (P) LTD.
-- ==========================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES AND USERS TABLE
CREATE TYPE user_role AS ENUM ('STAFF', 'JUDGE', 'ADMIN', 'CITIZEN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(150),
    court_name VARCHAR(150),
    mobile_number VARCHAR(15) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CASE REGISTRY TABLE
CREATE TABLE court_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., SC/241/2026
    fir_number VARCHAR(50) NOT NULL,          -- e.g., FIR/104/2026-RJM
    ipc_sections TEXT NOT NULL,               -- e.g., "IPC Section 379, 411"
    police_station VARCHAR(150) NOT NULL,     -- e.g., "Rajamundry Urban PS"
    arresting_officer VARCHAR(150) NOT NULL,
    date_of_arrest DATE NOT NULL,
    bail_type VARCHAR(50) NOT NULL,           -- "First Bail", "Second Bail", "Anticipatory Bail"
    presiding_judge VARCHAR(150) NOT NULL,
    hearing_date TIMESTAMP WITH TIME ZONE,
    current_status VARCHAR(50) DEFAULT 'Checking', -- 'Checking', 'Verified', 'Ready for Judge', 'Completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACCUSED PERSON DETAILS
CREATE TABLE accused (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    dob DATE NOT NULL,
    fathers_name VARCHAR(150) NOT NULL,
    residential_address TEXT NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    aadhaar_number VARCHAR(12) UNIQUE NOT NULL,
    pan_number VARCHAR(10) UNIQUE NOT NULL,
    dl_number VARCHAR(20) UNIQUE,
    passport_number VARCHAR(20) UNIQUE,
    
    -- Biometrics (simulated verification states)
    fingerprint_matched BOOLEAN DEFAULT FALSE,
    retina_matched BOOLEAN DEFAULT FALSE,
    live_photo_url TEXT,

    -- Financial Information (auto-fetched details)
    itr_income_y1 NUMERIC(12,2), -- Past Year 1 Income
    itr_income_y2 NUMERIC(12,2), -- Past Year 2 Income
    itr_income_y3 NUMERIC(12,2), -- Past Year 3 Income
    cibil_score INT,
    bank_balance_average_6m NUMERIC(12,2),
    rbi_npa_status VARCHAR(50) DEFAULT 'CLEAN', -- 'CLEAN', 'NPA_ALERT'
    
    -- Criminal History Stats
    ncrb_record_count INT DEFAULT 0,
    previous_bails_granted INT DEFAULT 0,
    previous_bails_honored INT DEFAULT 0,
    absconding_history_count INT DEFAULT 0,
    travel_restricted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SURETY / GUARANTOR DETAILS
CREATE TABLE sureties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    aadhaar_number VARCHAR(12) UNIQUE NOT NULL,
    pan_number VARCHAR(10) UNIQUE NOT NULL,
    dl_number VARCHAR(20),
    passport_number VARCHAR(20),
    
    -- Biometrics
    fingerprint_matched BOOLEAN DEFAULT FALSE,
    retina_matched BOOLEAN DEFAULT FALSE,
    
    -- Income Profile
    employment_details TEXT NOT NULL,
    monthly_income NUMERIC(12,2) NOT NULL,
    verified_itr_income NUMERIC(12,2),
    
    -- Surety commitments (cross-court load)
    active_bail_guarantees INT DEFAULT 0, -- Active bail guarantees in other courts
    past_surety_defaults INT DEFAULT 0,
    
    -- Property Pledged (if applicable)
    property_address TEXT,
    survey_number VARCHAR(50),
    property_valuation NUMERIC(12,2),
    encumbrance_status VARCHAR(50) DEFAULT 'CLEAN', -- 'CLEAN', 'ENCUMBERED'
    revenue_dept_owner VARCHAR(150),
    mutation_status VARCHAR(50) DEFAULT 'PENDING',  -- 'PENDING', 'COMPLETED', 'RELEASED'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. LEGAL ARGUMENTS & CONDITIONS
CREATE TABLE case_arguments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    prosecution_objections TEXT,
    defence_plea TEXT,
    proposed_bail_amount NUMERIC(12,2),
    proposed_reporting_schedule VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. VERIFICATION ENGINE AUDITS
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    
    -- Check Statuses
    identity_check VARCHAR(20) NOT NULL,     -- 'GREEN', 'RED'
    financial_check VARCHAR(20) NOT NULL,    -- 'CAPABLE', 'BORDERLINE', 'NOT_CAPABLE'
    risk_score INT NOT NULL,                 -- 0 - 100
    risk_level VARCHAR(20) NOT NULL,         -- 'LOW', 'MEDIUM', 'HIGH'
    surety_load_check VARCHAR(20) NOT NULL,  -- 'CLEAR', 'OVERLOADED', 'DISQUALIFIED'
    property_check VARCHAR(20) NOT NULL,     -- 'ELIGIBLE', 'BLOCKED', 'N/A'
    
    -- System Advice
    system_recommendation VARCHAR(50) NOT NULL, -- 'GRANT_BAIL', 'GRANT_WITH_CONDITIONS', 'DENY_BAIL'
    recommendation_reasoning TEXT NOT NULL,
    
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. OFFICIAL COURT BAIL ORDERS
CREATE TABLE bail_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    judge_id UUID REFERENCES users(id),
    decision VARCHAR(50) NOT NULL, -- 'GRANTED', 'GRANTED_WITH_CONDITIONS', 'DENIED', 'ADJOURNED'
    custom_conditions TEXT[],      -- Array of conditions
    judge_remarks TEXT,
    digital_signature_hash TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMPLIANCE AND POST-BAIL ALERTS
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES court_cases(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'HEARING_REMINDER', 'ABSCONDING_ALERT', 'MUTATION_TIMEOUT', 'FINANCIAL_DROP'
    message TEXT NOT NULL,
    alert_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create helpful indices for performance and searchability
CREATE INDEX idx_cases_case_number ON court_cases(case_number);
CREATE INDEX idx_cases_status ON court_cases(current_status);
CREATE INDEX idx_accused_aadhaar ON accused(aadhaar_number);
CREATE INDEX idx_sureties_aadhaar ON sureties(aadhaar_number);
CREATE INDEX idx_alerts_status ON compliance_alerts(status);
