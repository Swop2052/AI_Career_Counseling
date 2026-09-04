# SkillSense — Developer Account Provisioning & Production Deployment Guide

## 1. Initial Production Setup via CLI

In production, no manual SQLite seeding or raw database editing is permitted for admin/developer accounts. The first `SUPER_ADMIN` account is provisioned securely through the Flask CLI command.

### Running the Command on VPS over SSH

Connect to your VPS and navigate to the project directory:

```bash
# 1. SSH into the production server
ssh user@your-vps-ip

# 2. Activate the Python virtual environment
cd /path/to/AI_Career_Counseling
source venv/bin/activate

# 3. Set Flask application environment variable (if not in .env)
export FLASK_APP=app.py

# 4. Run the Super Admin creation command
flask create-super-admin
```

### Interactive Prompts

```text
  SkillSense -- Create Super Admin
  -----------------------------------------
  This creates the first SUPER_ADMIN account.
  The account will have full platform management access.

  Full name: Jane Doe
  Email address: admin@yourdomain.com
  Password (min 8 characters): [hidden input]
  Confirm password: [hidden input]

  Creating SUPER_ADMIN account...

  [SUCCESS] SUPER_ADMIN account created!
  Email:    admin@yourdomain.com
  Role:     SUPER_ADMIN
  User ID:  usr_8b84cb38cd6c
```

### Security & Safety Rules Enforced by CLI
1. **Never prints or logs plaintext passwords.**
2. **Hashes passwords securely** using PBKDF2/SHA256 via Werkzeug security primitives.
3. **Refuses execution** if a `SUPER_ADMIN` account already exists.
4. **Writes an immutable audit log record** with action `CREATED_SUPER_ADMIN_VIA_CLI`.

---

## 2. Developer Roles & Permissions Architecture

SkillSense supports three distinct user roles:

| Role | Dashboard Access | Student Assessment | Manage Plans & Campaigns | Invite & Manage Developers |
| :--- | :--- | :--- | :--- | :--- |
| `USER` | No | Yes (Self) | No | No |
| `DEVELOPER` | Yes (`/developer`) | Yes (Self) | Yes | Only if `can_manage_developers = 1` |
| `SUPER_ADMIN` | Yes (`/developer`) | Yes (Self) | Yes | Always (`can_manage_developers = 1`) |

### Adding Developers (Dashboard Flow)
1. Super Admin logs into `https://your-domain/login` with email and password.
2. Navigates to **Developer Dashboard → Developer Accounts** tab.
3. Clicks **+ Add Developer**.
4. Enters full name, email, and role (`DEVELOPER` or `SUPER_ADMIN`).
5. The platform generates a secure 32-byte cryptographic token (valid for 24 hours), stores its SHA-256 hash in `developer_invitations`, and dispatches an invitation email with a one-time setup link:
   ```text
   https://your-domain/setup-account?token=<raw_token>
   ```
6. The developer clicks the link, enters a secure password, and their account is activated immediately.

---

## 3. Campaign Status Toggle & Server-Authoritative Logic

### Instant Inline Toggle in Status Column
In **Developer Dashboard → Campaign Codes**, each campaign displays:
- An **effective status badge** (`Active`, `Inactive`, `Scheduled`, `Expired`, or `Usage Limit Reached`).
- An **inline toggle switch** allowing instant one-click activation/deactivation (`is_active: 1` vs `0`).

### Effective Status Resolution Matrix
```text
is_active = 0 (OFF)
  --> Status: Inactive / Disabled

is_active = 1 (ON) AND valid_from > now
  --> Status: Scheduled (Blue)

is_active = 1 (ON) AND valid_until < now
  --> Status: Expired (Red)

is_active = 1 (ON) AND used_count >= max_uses
  --> Status: Usage Limit Reached (Amber)

is_active = 1 (ON) AND valid dates AND used_count < max_uses
  --> Status: Active (Green)
```

---

## 4. Audit Trail

All administrative actions are permanently logged in the `audit_log` SQLite table:
- `CREATED_SUPER_ADMIN_VIA_CLI`
- `INVITED_DEVELOPER`
- `RESENT_INVITATION`
- `ACCEPTED_INVITATION`
- `DISABLED_DEVELOPER`
- `REACTIVATED_DEVELOPER`
- `GRANTED_CAN_MANAGE_DEVELOPERS`
- `REVOKED_CAN_MANAGE_DEVELOPERS`
- `MANUAL_CREDIT_ADJUSTMENT`

Super Admins and authorized Developers can inspect the recent audit trail directly under **Developer Dashboard → Audit Log**.
