# SkillSense — Production Deployment Guide

This guide provides the complete, authoritative procedure for deploying SkillSense in a production environment (VPS, Cloud VM, or Docker).

---

## Architecture Overview

SkillSense operates with a strict authoritative backend architecture:

```
[Browser / Client (Untrusted)]
            │  HTTPS / REST API
            ▼
[Flask Backend (Authoritative WSGI Server)]
            │  psycopg2 (connect_timeout=5s)
            ▼
[PostgreSQL Database (Source of Truth)]
```

- **Frontend**: Vite + React single-page application built to static assets.
- **Backend**: Flask WSGI application served via Gunicorn or Waitress.
- **Database**: PostgreSQL only. There is zero runtime SQLite dependency in production.
- **Security**: Strict server-authoritative pricing, atomic credit transactions, idempotent payment grants, and session-governed role authorization.

---

## Step 1 — Configure Environment Variables

1. Copy the production template `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in all authoritative production credentials:

   | Variable | Description |
   | :--- | :--- |
   | `SECRET_KEY` | High-entropy random string for Flask session signing |
   | `FLASK_ENV` | Must be set to `production` |
   | `DATABASE_URL` | PostgreSQL connection URL (e.g. `postgresql://user:pass@host:5432/dbname`) |
   | `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Individual PostgreSQL parameters if `DATABASE_URL` is omitted |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Live Razorpay merchant credentials |
   | `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay webhook dashboard |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | SMTP email server credentials for OTPs and invitations |
   | `ANTHROPIC_API_KEY` | Anthropic API key for AI career guidance |
   | `HF_TOKEN` | Hugging Face token for embeddings |
   | `CORS_ORIGINS` | Comma-separated list of allowed frontend domains (e.g. `https://skillsense.ai,https://www.skillsense.ai`) |

> **IMPORTANT**: Never commit the real `.env` file to version control.

---

## Step 2 — Configure PostgreSQL Database

The production application requires PostgreSQL (version 14 or higher).

1. Ensure PostgreSQL is installed and running:  
   ```bash
   sudo systemctl status postgresql
   ```
2. Create the production database and user:
   ```sql
   CREATE USER skillsense_user WITH ENCRYPTED PASSWORD 'your_strong_password';
   CREATE DATABASE skillsense OWNER skillsense_user;
   GRANT ALL PRIVILEGES ON DATABASE skillsense TO skillsense_user;
   ```
3. Enable the `uuid-ossp` extension (SkillSense handles this automatically during schema init, provided the user has permissions):
   ```sql
   \c skillsense
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

---

## Step 3 — Install Dependencies

### Backend Dependencies
1. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate    # On Linux/macOS
   # or: .venv\Scripts\activate # On Windows
   ```
2. Upgrade pip and install production dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Frontend Production Build
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
   The compiled production bundle will be output to `frontend/dist/`.

---

## Step 4 — Initialize Database Schema

Run the safe, non-destructive database initialization:

```bash
python database/migrations.py
```
or via Python:
```bash
python -c "from database.schema import init_db; init_db()"
```

### Safety Guarantees:
- Applies all tables, indexes, and constraints from `database/schema.sql` using `CREATE TABLE IF NOT EXISTS`.
- Applies backward-compatible additive columns using `ADD COLUMN IF NOT EXISTS`.
- Seeds active pricing plans (`plan_single`, `plan_pack30`) and promotional campaign codes (`SCHOOL20`) only if absent.
- **NEVER drops or truncates existing tables.**
- **NEVER creates hardcoded default administrators or passwords.**

---

## Step 5 — Create Initial Super Admin via CLI

Before starting the public server, bootstrap the first `SUPER_ADMIN` account directly in PostgreSQL:

```bash
flask create-super-admin
```

The CLI interactively and securely prompts for:
1. **Full name**: (e.g., `Platform Administrator`)
2. **Email address**: (e.g., `admin@yourdomain.com`)
3. **Password**: (Hidden prompt, minimum 8 characters)
4. **Password confirmation**: (Hidden prompt, must match)

### CLI Safeguards:
- The password is hashed using PBKDF2/SHA256 via Werkzeug before storage.
- Passwords and secrets are never printed to terminal or saved to logs.
- Refuses to execute if a `SUPER_ADMIN` account already exists.
- Refuses duplicate emails.
- Creates `role = SUPER_ADMIN` and `can_manage_developers = 1`.

---

## Step 6 — Start Production Application

### Option A: Using Gunicorn (Recommended for Linux VPS)
```bash
gunicorn wsgi:app -w 4 -b 0.0.0.0:5000 --access-logfile - --error-logfile -
```

### Option B: Using Waitress (Windows Server or Lightweight Linux)
```bash
waitress-serve --listen=0.0.0.0:5000 wsgi:app
```

### Option C: Using Docker Compose
```bash
docker-compose up -d --build
```

---

## Step 7 — Verify Health & Availability

Verify the backend and PostgreSQL connection using the production-safe health endpoint:

```bash
curl -i http://localhost:5000/api/health
```

Expected response (`HTTP 200 OK`):
```json
{
  "database": "connected",
  "service": "skillsense-backend",
  "status": "healthy"
}
```

This endpoint returns `HTTP 503` if the database is unreachable, with zero exposure of credentials, database URLs, or internal system paths.

---

## Step 8 — Super Admin Login & Administrative Setup

1. Open the SkillSense web application in your browser (`https://yourdomain.com`).
2. Log in using the `SUPER_ADMIN` credentials created in **Step 5**.
3. Access the **Super Admin Console**:
   - Manage pricing plans and campaign codes.
   - Adjust user credits with mandatory audit reasons.
   - Invite additional Developers or Super Admins.

### Secure Invitation Flow:
When adding a Developer or Super Admin through the dashboard:
1. Super Admin submits invitee's **Name**, **Email**, and **Role**.
2. Server generates a cryptographically secure one-time token (SHA256 hashed in database).
3. Server delivers an invitation email via SMTP.
4. Invitee opens the link, sets their own secure password, and activates their account.
5. The token is immediately invalidated. Permanent passwords are never emailed.
