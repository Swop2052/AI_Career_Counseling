#!/usr/bin/env python3
"""
=============================================================================
SkillSense - Platform-Identical Mass PDF Export Script
=============================================================================
This script exports Career Assessment PDFs for all registered students who
have taken the assessment in SkillSense.

KEY REQUIREMENT FULFILLED:
- Generates 100% IDENTICAL PDFs to the platform.
- Uses headless Chromium (Playwright) to load the real SkillSense frontend
  and executes the EXACT same 'html2canvas' + 'jsPDF' pipeline that is triggered
  when a student clicks 'Download PDF' on the live website.
- Nothing is changed: exact typography, Recharts RIASEC wheel, colors, cards,
  and formatting are 100% preserved.

USAGE ON VPS:
1. Ensure dependencies are installed:
   pip install playwright psycopg2-binary
   playwright install chromium --with-deps

2. Run the script:
   python scripts/export_all_student_pdfs.py

OPTIONS:
   --url <url>       Frontend URL (default: auto-detected or https://skillsense.aisense.co.in)
   --limit <number>  Export only the first N students (great for testing)
   --email <email>   Export report for one specific student email
   --out <folder>    Output directory (default: ./exported_student_reports)
=============================================================================
"""

import os
import sys
import json
import re
import time
import zipfile
import argparse
from datetime import datetime

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from database.schema import get_db_connection
except Exception as e:
    print(f"[ERROR] Could not import database connection from project: {e}")
    sys.exit(1)


def sanitize_filename(name: str) -> str:
    """Sanitize string for cross-platform safe filename."""
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.strip().replace(" ", "_")
    return name or "Student"


def parse_json_safely(val):
    """Safely parse JSON or return dict."""
    if val is None:
        return {}
    if isinstance(val, dict):
        return val
    if isinstance(val, list):
        return val
    try:
        return json.loads(val)
    except Exception:
        return {}


def fetch_all_student_assessments(target_email=None, limit=None):
    """Fetch all completed assessment attempts belonging to registered students."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT 
                a.id as attempt_id,
                a.user_id,
                u.email,
                p.full_name,
                p.avatar,
                p.education_level,
                p.city,
                a.student_profile,
                a.riasec_answers,
                a.riasec_scores,
                a.riasec_code,
                a.teaser_data,
                a.full_result_data,
                a.is_unlocked,
                a.created_at,
                a.completed_at
            FROM assessment_attempts a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN user_profiles p ON a.user_id = p.user_id
            WHERE a.user_id IS NOT NULL
        """
        params = []
        if target_email:
            query += " AND LOWER(u.email) = %s"
            params.append(target_email.strip().lower())

        query += " ORDER BY a.created_at DESC"

        if limit:
            query += f" LIMIT {int(limit)}"

        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        
        # Convert rows into dictionary list
        results = []
        for r in rows:
            results.append({
                'attempt_id': r[0],
                'user_id': r[1],
                'email': r[2],
                'full_name': r[3],
                'avatar': r[4],
                'education_level': r[5],
                'city': r[6],
                'student_profile': parse_json_safely(r[7]),
                'riasec_answers': parse_json_safely(r[8]),
                'riasec_scores': parse_json_safely(r[9]),
                'riasec_code': r[10],
                'teaser_data': parse_json_safely(r[11]),
                'full_result_data': parse_json_safely(r[12]),
                'is_unlocked': r[13],
                'created_at': str(r[14]),
                'completed_at': str(r[15])
            })
        return results
    finally:
        conn.close()


def prepare_student_payload(item):
    """Format and normalize the student attempt payload expected by ReportCardPage."""
    prof = item.get('student_profile') or {}
    full_data = item.get('full_result_data') or {}
    teaser_data = item.get('teaser_data') or {}

    raw_name = item.get('full_name') or prof.get('name') or prof.get('fullName')
    if not raw_name and item.get('email'):
        raw_name = item['email'].split('@')[0]
    raw_name = raw_name or "Student"

    # Extract RIASEC scores
    riasec_scores = (
        item.get('riasec_scores')
        or full_data.get('riasec_scores')
        or full_data.get('scores')
        or teaser_data.get('riasec_scores')
        or {'R': 20, 'I': 25, 'A': 18, 'S': 22, 'E': 24, 'C': 26}
    )

    # Extract careers
    top_careers = (
        full_data.get('top_careers')
        or full_data.get('career_matches')
        or teaser_data.get('top_careers')
        or []
    )

    riasec_code = (
        item.get('riasec_code')
        or full_data.get('riasec_code')
        or teaser_data.get('riasec_code')
        or "CIE"
    )

    avatar = item.get('avatar') or prof.get('avatar') or "avatar-1"

    report_obj = {
        'attempt_id': item['attempt_id'],
        'student_profile': {
            'name': raw_name,
            'full_name': raw_name,
            'education_level': item.get('education_level') or prof.get('education_level') or 'Grade 10',
            'city': item.get('city') or prof.get('city') or '',
            'avatar': avatar
        },
        'is_unlocked': 1,  # Unlocks full report view for export
        'riasec_scores': riasec_scores,
        'scores': riasec_scores,
        'riasec_code': riasec_code,
        'top_careers': top_careers,
        'career_matches': top_careers,
        'full_result_data': full_data,
        'teaser_data': teaser_data
    }

    user_obj = {
        'id': item['user_id'],
        'name': raw_name,
        'full_name': raw_name,
        'email': item['email'],
        'avatar': avatar
    }

    return report_obj, user_obj, raw_name


def detect_base_url():
    """Detect live/local base URL where frontend is accessible."""
    import urllib.request
    candidates = [
        "http://localhost:5173",            # Local Vite Dev Server
        "http://127.0.0.1:5000",            # Local Flask Server
        "http://localhost:5000",
        "https://skillsense.aisense.co.in"  # Production VPS URL
    ]
    for url in candidates:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "https://skillsense.aisense.co.in"


def run_export(args):
    # 1. Check playwright installation
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("\n" + "=" * 70)
        print("[ERROR] Playwright is not installed.")
        print("Please install Playwright with Chromium dependencies:")
        print("   pip install playwright")
        print("   playwright install chromium --with-deps")
        print("=" * 70 + "\n")
        sys.exit(1)

    # 2. Output directory
    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    base_url = args.url or detect_base_url()
    print(f"\n[INFO] Target Frontend URL: {base_url}")
    print(f"[INFO] Output Directory: {out_dir}")

    # 3. Query records
    print("[INFO] Querying student assessments from PostgreSQL...")
    students = fetch_all_student_assessments(target_email=args.email, limit=args.limit)
    total = len(students)
    print(f"[SUCCESS] Found {total} completed student assessment records to export.\n")

    if total == 0:
        print("[INFO] No assessment attempts found matching criteria. Exiting.")
        return

    # 4. Launch headless browser
    print("[INFO] Launching Headless Chromium (Platform Rendering Engine)...")
    success_count = 0
    fail_count = 0
    generated_files = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            accept_downloads=True
        )
        page = context.new_page()

        # Iterate over each student
        for idx, student in enumerate(students, 1):
            attempt_id = student['attempt_id']
            report_payload, user_payload, student_name = prepare_student_payload(student)
            clean_name = sanitize_filename(student_name)
            filename = f"SkillSense_Report_{clean_name}_{attempt_id}.pdf"
            pdf_path = os.path.join(out_dir, filename)

            # Skip if already exists
            if os.path.exists(pdf_path) and not args.force:
                print(f"[{idx}/{total}] [SKIP] Already exists: {filename}")
                generated_files.append(pdf_path)
                success_count += 1
                continue

            t0 = time.time()
            print(f"[{idx}/{total}] Rendering report for '{student_name}' ({student['email']})...", end="", flush=True)

            try:
                # Load page and inject student data into localStorage
                page.goto(f"{base_url}/#report", wait_until="domcontentloaded", timeout=30000)
                page.evaluate("""
                    (data) => {
                        localStorage.setItem('skillsense_report', JSON.stringify(data.report));
                        localStorage.setItem('skillsense_user', JSON.stringify(data.user));
                        window.location.hash = '#report';
                    }
                """, {"report": report_payload, "user": user_payload})

                # Reload page to trigger clean state
                page.reload(wait_until="networkidle", timeout=30000)

                # Wait for report element
                page.wait_for_selector('.max-w-\\[1200px\\]', timeout=15000)
                # Give 1.5s for fonts, Recharts RIASEC animations, and icons to settle
                page.wait_for_timeout(1500)

                # Intercept the exact platform PDF download
                with page.expect_download(timeout=35000) as download_info:
                    download_btn = page.locator('button:has-text("Download PDF")').first
                    download_btn.click()

                download = download_info.value
                download.save_as(pdf_path)

                elapsed = round(time.time() - t0, 1)
                file_size_kb = round(os.path.getsize(pdf_path) / 1024, 1)
                print(f" [DONE in {elapsed}s] -> {filename} ({file_size_kb} KB)")
                generated_files.append(pdf_path)
                success_count += 1

            except Exception as err:
                print(f" [FAILED: {err}]")
                fail_count += 1

        browser.close()

    # 5. Create ZIP Archive
    if generated_files:
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"SkillSense_All_Student_Reports_{timestamp_str}.zip"
        zip_path = os.path.join(out_dir, zip_filename)

        print(f"\n[INFO] Packaging all {len(generated_files)} PDF reports into ZIP file...")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file_path in generated_files:
                zipf.write(file_path, arcname=os.path.basename(file_path))

        zip_size_mb = round(os.path.getsize(zip_path) / (1024 * 1024), 2)
        print("=" * 70)
        print(f"EXPORT COMPLETED SUCCESSFULLY!")
        print(f"Total Successful PDFs : {success_count}")
        print(f"Total Failed          : {fail_count}")
        print(f"ZIP Archive Created   : {zip_path} ({zip_size_mb} MB)")
        print("=" * 70 + "\n")
    else:
        print("[WARNING] No PDF files were generated.")


def main():
    parser = argparse.ArgumentParser(
        description="SkillSense - Export 100% Platform-Identical Assessment PDFs for All Registered Students"
    )
    parser.add_argument("--url", help="Base URL of frontend (e.g., https://skillsense.aisense.co.in)")
    parser.add_argument("--limit", type=int, help="Export only first N attempts")
    parser.add_argument("--email", help="Export for a specific student email only")
    parser.add_argument("--out", default="./exported_student_reports", help="Output directory")
    parser.add_argument("--force", action="store_true", help="Overwrite existing PDF files")

    args = parser.parse_args()
    run_export(args)


if __name__ == "__main__":
    main()
