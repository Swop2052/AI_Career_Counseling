CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  account_status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legal_documents (
  legal_document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (document_type, version)
);

CREATE TABLE IF NOT EXISTS user_consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  legal_document_id UUID NOT NULL REFERENCES legal_documents(legal_document_id),
  consented BOOLEAN NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  UNIQUE (user_id, legal_document_id)
);

CREATE TABLE IF NOT EXISTS assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  assessment_status TEXT NOT NULL DEFAULT 'draft',
  riasec_code VARCHAR(6),
  student_profile JSONB NOT NULL DEFAULT '{}',
  persona JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_riasec (
  assessment_id UUID PRIMARY KEY REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS careers (
  career_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_name TEXT NOT NULL UNIQUE,
  description TEXT,
  riasec_tags CHAR(1)[],
  career_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_career_matches (
  assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(career_id),
  rank SMALLINT NOT NULL,
  match_score NUMERIC(5,2) NOT NULL,
  match_details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_id, career_id),
  UNIQUE (assessment_id, rank)
);

CREATE TABLE IF NOT EXISTS messages (
  message_id BIGSERIAL PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_feedback (
  feedback_id BIGSERIAL PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  career_id UUID REFERENCES careers(career_id),
  liked_result BOOLEAN,
  feedback_category TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  contact_message_id BIGSERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
