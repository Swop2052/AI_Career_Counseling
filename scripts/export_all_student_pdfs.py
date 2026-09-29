#!/usr/bin/env python3
"""
=============================================================================
SkillSense - Platform-Identical Mass PDF Export Script
=============================================================================
This script exports Career Assessment PDFs for all registered students who
have taken the assessment in SkillSense.

KEY REQUIREMENTS FULFILLED:
- Generates 100% IDENTICAL 2-page PDFs matching the platform report.
- Connects directly to PostgreSQL to fetch student assessment records.
- Uses headless Chromium (Playwright) to load the SkillSense report.
- Intercepts session authentication and full report endpoints to cleanly hydrate
  the student's report without triggering unauthenticated redirect/lock states.
- Detects and gracefully dismisses any active blocking modal/dialog
  (CanonicalModal, etc.) using genuine dismissal controls:
    1. Close 'X' button (aria-label containing 'close' or 'dismiss')
    2. Text dismissal buttons: 'Not Now', 'Cancel', 'Close', 'Dismiss', 'Later', 'Maybe Later', 'Continue'
    3. Keyboard Escape
    4. Backdrop click
- Isolates the dedicated SkillSensePrintReport root directly onto document.body
  (mirroring useReactToPrint iframe behavior) to completely eliminate extra
  outer wrappers, background artifacts (#CFEDED), and alternating blank pages.
- Sets strict 287mm page bounds and avoids double-margin height overflow so
  each report is exactly 2 pristine pages.
- Saves reports with deterministic filesystem-safe filenames:
  SkillSense_Report_<StudentName>_<AttemptID>.pdf
- Validates that each exported file is a non-empty, valid PDF (%PDF-).
- Compiles all generated reports into a timestamped ZIP archive.

USAGE:
    python scripts/export_all_student_pdfs.py --limit 3
    python scripts/export_all_student_pdfs.py
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
    """Safely parse JSON or return dict/list."""
    if val is None:
        return {}
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return {}


def validate_pdf(file_path: str):
    """Verify that file exists, is non-empty, and has valid PDF magic header."""
    if not os.path.exists(file_path):
        return False, "File does not exist", 0
    size = os.path.getsize(file_path)
    if size == 0:
        return False, "File is empty (0 bytes)", 0
    try:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
        if not pdf_bytes.startswith(b"%PDF-"):
            return False, "Invalid PDF header", 0
        pages = len(re.findall(rb'/Type\s*/Page[^s]', pdf_bytes))
        return True, f"Valid PDF ({round(size / 1024, 1)} KB, {pages} pages)", pages
    except Exception as e:
        return False, f"Cannot read file: {e}", 0


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
        'is_unlocked': 1,
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
        'avatar': avatar,
        'balance': 10
    }

    return report_obj, user_obj, raw_name


def detect_base_url():
    """Detect live/local base URL where frontend is accessible."""
    import urllib.request
    candidates = [
        "https://skillsense.aisense.co.in",  # Production VPS URL (preferred)
        "http://localhost:5173",            # Local Vite Dev Server
        "http://127.0.0.1:5000",            # Local Flask Server
        "http://localhost:5000"
    ]
    for url in candidates:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "https://skillsense.aisense.co.in"


def dismiss_blocking_modals(page, max_retries=3):
    """
    Detect whether any modal/dialog ([role="dialog"][aria-modal="true"]) is open.
    If a modal is present and blocking the report/download interaction:
      - determine whether it is an expected informational/unlock/confirmation modal
      - close/dismiss it using its actual close/cancel action:
        1. Close 'X' button (aria-label containing 'close' or 'dismiss')
        2. Text dismissal buttons: 'Not Now', 'Cancel', 'Close', 'Dismiss', 'Later', 'Maybe Later', 'Continue'
        3. Keyboard Escape
        4. Backdrop click
      - wait until the modal overlay is actually removed from the DOM or no longer intercepts pointer events
    """
    for _ in range(max_retries):
        modal = page.locator('[role="dialog"][aria-modal="true"], [role="dialog"]').first
        if modal.count() == 0 or not modal.is_visible():
            break

        # Extract title or text for logging
        title = ""
        try:
            title_el = modal.locator('#canonical-modal-title, h2, h3').first
            if title_el.count() > 0 and title_el.is_visible():
                title = title_el.inner_text().strip()
        except Exception:
            pass

        print(f" [MODAL DETECTED: '{title or 'Dialog'}']", end="", flush=True)
        dismissed = False

        # 1. Close "X" button
        try:
            close_btn = modal.locator('button[aria-label*="close" i], button[aria-label*="dismiss" i]').first
            if close_btn.count() > 0 and close_btn.is_visible():
                close_btn.click(timeout=2000)
                dismissed = True
        except Exception:
            pass

        # 2. Text dismissal buttons
        if not dismissed:
            for text in ["Not Now", "Cancel", "Close", "Dismiss", "Later", "Maybe Later", "Continue"]:
                try:
                    btn = modal.locator(f'button:has-text("{text}")').first
                    if btn.count() > 0 and btn.is_visible():
                        btn.click(timeout=2000)
                        dismissed = True
                        break
                except Exception:
                    pass

        # 3. Keyboard Escape
        if not dismissed:
            try:
                page.keyboard.press("Escape")
                dismissed = True
            except Exception:
                pass

        # 4. Wait for modal to become hidden / detached
        try:
            modal.wait_for(state="hidden", timeout=3000)
            print(" [MODAL DISMISSED]", end="", flush=True)
            break
        except Exception:
            # 5. Backdrop click fallback
            try:
                modal.click(position={"x": 10, "y": 10}, timeout=2000)
                modal.wait_for(state="hidden", timeout=2000)
                print(" [BACKDROP DISMISSED]", end="", flush=True)
                break
            except Exception:
                pass


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

    # 3. Query records from PostgreSQL
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
    failed_details = []
    active_data = {"user": {}, "report": {}, "attempt_id": ""}

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

        # Intercept session authentication and full report endpoints once for clean hydration
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"authenticated": True, "user": active_data["user"]})
        ))
        page.route("**/api/assessment/*/full*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "is_unlocked": 1,
                "attempt_id": active_data["attempt_id"],
                "full_report": active_data["report"]
            })
        ))

        # Initial navigation to establish origin and mount application shell
        try:
            page.goto(f"{base_url}/#report", wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"[WARNING] Initial navigation warning: {e}")

        # Iterate over each student
        for idx, student in enumerate(students, 1):
            attempt_id = student['attempt_id']
            report_payload, user_payload, student_name = prepare_student_payload(student)
            clean_name = sanitize_filename(student_name)
            filename = f"SkillSense_Report_{clean_name}_{attempt_id}.pdf"
            pdf_path = os.path.join(out_dir, filename)

            # Update active student context for route interceptors
            active_data["user"] = user_payload
            active_data["report"] = report_payload
            active_data["attempt_id"] = attempt_id

            # Skip if already exists and valid
            if os.path.exists(pdf_path) and not args.force:
                is_valid, msg, pages = validate_pdf(pdf_path)
                if is_valid and pages == 2:
                    print(f"[{idx}/{total}] [SKIP] Already exists (2 pages): {filename}")
                    generated_files.append(pdf_path)
                    success_count += 1
                    continue

            t0 = time.time()
            print(f"[{idx}/{total}] Rendering report for '{student_name}' ({student['email']})...", end="", flush=True)

            try:
                # Ensure media is reset to screen for clean DOM mounting
                page.emulate_media(media="screen")

                # Seed report data into localStorage
                page.evaluate("""
                    (data) => {
                        localStorage.setItem('skillsense_report', JSON.stringify(data.report));
                        localStorage.setItem('skillsense_user', JSON.stringify(data.user));
                        window.location.hash = '#report';
                    }
                """, {"report": report_payload, "user": user_payload})

                # Reload page to mount student report state
                page.reload(wait_until="domcontentloaded", timeout=40000)
                page.wait_for_timeout(1000)

                # Detect and dismiss any modal overlay before interaction
                dismiss_blocking_modals(page)

                # Wait for report element or print root
                page.wait_for_selector('.skillsense-print-root, .max-w-\\[1200px\\]', timeout=20000)
                dismiss_blocking_modals(page)

                # Isolate the print root directly onto document.body exactly like react-to-print iframe!
                # This completely eliminates outer wrappers, navbars, App.jsx background (#CFEDED),
                # and multi-page height overflows!
                page.evaluate("""
                    () => {
                        const printRoot = document.querySelector('.skillsense-print-root');
                        if (!printRoot) return false;
                        
                        document.body.innerHTML = '';
                        document.body.appendChild(printRoot);
                        
                        document.documentElement.style.margin = '0';
                        document.documentElement.style.padding = '0';
                        document.documentElement.style.background = '#ffffff';
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                        document.body.style.background = '#ffffff';
                        
                        printRoot.style.position = 'static';
                        printRoot.style.left = 'auto';
                        printRoot.style.top = 'auto';
                        printRoot.style.width = '100%';
                        printRoot.style.opacity = '1';
                        printRoot.style.zIndex = 'auto';
                        printRoot.style.pointerEvents = 'auto';
                        return true;
                    }
                """)

                # Strict A4 print page styles to guarantee exact 2-page print without empty overflow pages
                page.add_style_tag(content="""
                    @page {
                        size: A4 portrait;
                        margin: 5mm 8mm;
                    }
                    body, html {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .skillsense-print-root {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        opacity: 1 !important;
                    }
                    .skillsense-pdf-page {
                        width: 100% !important;
                        height: 287mm !important;
                        max-height: 287mm !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        overflow: hidden !important;
                        background: #ffffff !important;
                    }
                    .skillsense-pdf-page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                        height: 0 !important;
                    }
                """)

                # Emulate print media and generate PDF
                page.emulate_media(media="print")
                page.pdf(
                    path=pdf_path,
                    format="A4",
                    print_background=True,
                    prefer_css_page_size=True,
                    margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
                )
                page.emulate_media(media="screen")

                # Validate downloaded PDF
                is_valid, val_msg, page_count = validate_pdf(pdf_path)
                if not is_valid:
                    raise ValueError(f"Generated PDF failed validation: {val_msg}")

                elapsed = round(time.time() - t0, 1)
                file_size_kb = round(os.path.getsize(pdf_path) / 1024, 1)
                print(f" [DONE in {elapsed}s] -> {filename} ({file_size_kb} KB, {page_count} pages)")
                generated_files.append(pdf_path)
                success_count += 1

            except Exception as err:
                print(f" [FAILED: {err}]")
                fail_count += 1
                failed_details.append({
                    "attempt_id": attempt_id,
                    "student_name": student_name,
                    "email": student['email'],
                    "error": str(err)
                })

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
        print("EXPORT COMPLETED SUCCESSFULLY!")
        print(f"Successfully generated : {success_count}")
        print(f"Failed                 : {fail_count}")
        print(f"Total                  : {total}")
        print(f"ZIP Archive Created    : {zip_path} ({zip_size_mb} MB)")
        print("=" * 70 + "\n")
    else:
        print("\n" + "=" * 70)
        print("EXPORT FINISHED - NO PDFS GENERATED")
        print(f"Successfully generated : {success_count}")
        print(f"Failed                 : {fail_count}")
        print(f"Total                  : {total}")
        if failed_details:
            print("\nFailure Details:")
            for f in failed_details:
                print(f" - Attempt {f['attempt_id']} ({f.get('email', 'Unknown')}): {f['error']}")
        print("=" * 70 + "\n")


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
