-- Complete PostgreSQL Schema for SkillSense
-- Refactored for full data normalization and strict NOT NULL / UNIQUE constraints.

-- Enable UUID extension for secure primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (authentication identity)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active INTEGER NOT NULL DEFAULT 1,
    can_manage_developers INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    education_level VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    avatar VARCHAR(255),
    age INTEGER,
    class_year VARCHAR(100),
    enjoy_subjects TEXT,
    challenging_subjects TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backward-compatible additive columns for existing deployments
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS class_year VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS enjoy_subjects TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS challenging_subjects TEXT;

-- 3. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id VARCHAR(255),
    student_profile JSONB,
    riasec_answers JSONB,
    riasec_scores JSONB,
    riasec_code VARCHAR(10),
    teaser_data JSONB,
    full_result_data JSONB,
    is_unlocked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unlocked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_guest_id ON assessment_attempts(guest_session_id);

-- 4. Credit Wallets Table
CREATE TABLE IF NOT EXISTS credit_wallets (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Credit Transactions Table (immutable audit ledger)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(100),
    reference_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON credit_transactions(user_id);

-- 6. Pricing Plans Table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    credits INTEGER NOT NULL,
    duration_days INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_recommended INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(255) NOT NULL REFERENCES pricing_plans(id),
    amount NUMERIC(10, 2) NOT NULL,
    original_amount NUMERIC(10, 2),
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    campaign_code_id VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_signature TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(razorpay_payment_id);

-- 8. Campaign Codes Table
CREATE TABLE IF NOT EXISTS campaign_codes (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    discount_type VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 20.0,
    benefit_type VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE',
    benefit_value NUMERIC(10, 2) NOT NULL DEFAULT 20.0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 300,
    used_count INTEGER NOT NULL DEFAULT 0,
    one_use_per_user INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_campaign_code ON campaign_codes(code);

-- 9. Campaign Redemptions Table
CREATE TABLE IF NOT EXISTS campaign_redemptions (
    id VARCHAR(255) PRIMARY KEY,
    campaign_code_id VARCHAR(255) NOT NULL REFERENCES campaign_codes(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    benefit_granted VARCHAR(255) NOT NULL,
    discount_applied NUMERIC(10, 2) DEFAULT 0,
    payment_id VARCHAR(255),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_code ON campaign_redemptions(user_id, campaign_code_id);

-- 10. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    is_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_resets_email ON password_resets(email);

-- 11. Developer Invitations Table
CREATE TABLE IF NOT EXISTS developer_invitations (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON developer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON developer_invitations(status);

-- 12. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    actor_id VARCHAR(255),
    actor_email VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    target_email VARCHAR(255),
    target_id VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- 13. Messages Table (for conversation_memory)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    role VARCHAR(50),
    content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    intent VARCHAR(100)
);

-- 14. Assessments / Tests Backwards Compatibility (conversation memory)
CREATE TABLE IF NOT EXISTS tests (
    test_id VARCHAR(255) PRIMARY KEY,
    fullname VARCHAR(255),
    email VARCHAR(255),
    student_profile JSONB,
    riasec_answers JSONB,
    riasec_scores JSONB,
    riasec_code VARCHAR(10),
    career_matches JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Careers Table (for AI Retrieval and Vector Store seeding)
CREATE TABLE IF NOT EXISTS careers (
    career_id SERIAL PRIMARY KEY,
    career_name VARCHAR(255) UNIQUE NOT NULL,
    career_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Students Table (Legacy)
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 17. Assessments Table (Legacy)
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id VARCHAR(255) PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    student_profile JSONB,
    persona JSONB,
    assessment_status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Assessment RIASEC Table (Legacy)
CREATE TABLE IF NOT EXISTS assessment_riasec (
    assessment_id VARCHAR(255) PRIMARY KEY REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    answers JSONB,
    scores JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Assessment Career Matches Table (Legacy)
CREATE TABLE IF NOT EXISTS assessment_career_matches (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    career_id INTEGER REFERENCES careers(career_id) ON DELETE CASCADE,
    rank INTEGER,
    match_score NUMERIC,
    match_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Student Feedback Table (Legacy)
CREATE TABLE IF NOT EXISTS student_feedback (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    career_id INTEGER,
    liked_result BOOLEAN,
    feedback_category VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Contact Messages Table (Legacy)
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255),
    email VARCHAR(255),
    company VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
