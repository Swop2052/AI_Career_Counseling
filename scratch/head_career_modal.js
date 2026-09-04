<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SkillSense — Career Guidance Chatbot</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<style>
        /* ============================================================
           SkillSense — Design System
           ============================================================ */
        :root {
            --primary: #00A86B;
            --primary-hover: #008f5a;
            --secondary: #00A86B;
            --violet: #00A86B;
            --violet-2: #008f5a;
            --cyan: #00A86B;
            --amber: #FF9500;
            --coral: #FF3B30;
            --bg: #FFFFFF;
            --bg-2: #F4FBF7;
            --ink: #1C1C1E;
            --muted: #636366;
            --faint: #AEAEB2;
            --glass: #F4FBF7;
            --glass-2: #E8F5EE;
            --stroke: rgba(0, 168, 107, 0.15);
            --stroke-bright: rgba(0, 168, 107, 0.3);
            --r: 20px;
            --r-sm: 10px;
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            --body: 'Inter', system-ui, sans-serif;
            --maxw: 1180px;
        }

        /* Dark mode overrides are removed since the theme is now unified */
        .theme-toggle-floating {
            display: none !important;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--body);
            color: var(--ink);
            background: var(--bg);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        .aura {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            background-color: var(--bg);
        }

        .grain {
            display: none;
        }

        .wrap {
            position: relative;
            z-index: 2;
            max-width: var(--maxw);
            margin: 0 auto;
            padding: 0 22px;
        }

        .eyebrow {
            font-size: 0.72rem;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: var(--cyan);
            display: inline-flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 18px;
            font-weight: 600;
        }

        .eyebrow::before {
            content: "";
            width: 26px;
            height: 1px;
            background: linear-gradient(90deg, var(--cyan), transparent);
        }

        .h-sec {
            font-size: clamp(1.9rem, 4.4vw, 3rem);
            font-weight: 700;
            line-height: 1.08;
            letter-spacing: -0.02em;
        }

        .h-sec .grad {
            background: linear-gradient(100deg, var(--violet-2), var(--cyan));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .lead {
            color: var(--muted);
            max-width: 56ch;
            font-size: 1.04rem;
            margin-top: 14px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 0.97rem;
            padding: 15px 26px;
            border-radius: 999px;
            transition: 0.25s transform, 0.25s box-shadow;
            will-change: transform;
            cursor: pointer;
            border: none;
            text-decoration: none;
        }

        .btn:active {
            transform: scale(0.97);
        }

        .btn-primary {
            background: var(--primary);
            color: #fff;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
        }

        .btn-ghost {
            background: #ffffff;
            border: 1px solid var(--stroke);
            color: var(--ink);
        }

        .btn-ghost:hover {
            border-color: var(--primary);
            background: #f4f7f9;
            transform: translateY(-2px);
        }

        .btn-success {
            background: var(--cyan);
            color: #fff;
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.25);
        }

        .btn-success:hover {
            background: #28a745;
            transform: translateY(-2px);
        }

        .glass {
            background: #F4FBF7;
            border: 1px solid var(--stroke);
            border-radius: var(--r);
            box-shadow: var(--shadow);
        }

        .nav {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 95%;
            max-width: var(--maxw);
            z-index: 40;
            transition: 0.3s;
            background: #E8EAE6;
            border-radius: 999px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .nav-in {
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .nav.scrolled {
            background: rgba(232, 234, 230, 0.95);
            backdrop-filter: blur(18px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 11px;
            font-weight: 700;
            font-size: 1.12rem;
            color: var(--primary);
        }

        .brand-logo {
            height: 48px !important;
            width: 48px !important;
            object-fit: contain;
            filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.4));
            margin-right: 8px;
        }

        .brand .orb {
            width: 34px;
            height: 34px;
            border-radius: 11px;
            display: grid;
            place-items: center;
            background: var(--primary);
            color: #fff;
            font-size: 1rem;
        }

        .nav-links {
            display: flex;
            gap: 30px;
            align-items: center;
        }

        .nav-links a {
            font-size: 0.92rem;
            color: var(--muted);
            font-weight: 600;
            transition: 0.2s;
            text-decoration: none;
            cursor: pointer;
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .nav-cta {
            font-size: 0.88rem;
            padding: 9px 20px;
            background: var(--primary);
            color: #fff;
            border: none;
            border-radius: 999px;
            transition: all 0.25s ease;
        }

        .nav-cta:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
        }

        .hero {
            position: relative;
            min-height: 100svh;
            display: flex;
            align-items: center;
            padding-top: 90px;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url('{{ url_for("static", filename="bg-hero-boy-watermark.png") }}') center center / auto 85% no-repeat;
            opacity: 0.25;
            z-index: 0;
            pointer-events: none;
            mix-blend-mode: multiply;
        }

        .hero-grid {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 40px;
            align-items: center;
        }

        .hero h1 {
            font-size: clamp(2.0rem, 4.6vw, 3.4rem);
            font-weight: 700;
            line-height: 1.08;
            text-shadow: none;
        }

        .hero h1 .l2 {
            background: linear-gradient(100deg, var(--violet-2) 10%, var(--cyan));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            filter: drop-shadow(0 2px 10px rgba(123, 97, 255, 0.35));
        }

        .hero p.sub {
            margin: 22px 0 30px;
            color: var(--muted);
            font-size: 1.13rem;
            max-width: 42ch;
        }

        .hero-cta {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
        }

        .hero-stats {
            display: flex;
            gap: 26px;
            margin-top: 38px;
            flex-wrap: wrap;
        }

        .hstat .n {
            font-size: 1.6rem;
            font-weight: 700;
            background: linear-gradient(100deg, var(--cyan), var(--violet-2));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .hstat .l {
            font-size: 0.78rem;
            color: var(--faint);
            letter-spacing: 0.04em;
        }

        .hero-card-stack {
            position: relative;
            width: 100%;
            max-width: 380px;
            height: 420px;
            margin-left: auto;
            z-index: 2;
            perspective: 1000px;
            animation: float-stack 5s ease-in-out infinite;
        }

        @keyframes float-stack {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .stack-card {
            position: absolute;
            top: 20px;
            left: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--stroke);
            border-radius: 24px;
            padding: 32px 28px;
            box-shadow: 0 15px 35px rgba(0, 168, 107, 0.05);
            transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            cursor: pointer;
            transform-origin: center bottom;
        }

        .stack-card:nth-child(1) {
            transform: translateY(0) scale(1) rotate(0);
            z-index: 3;
        }
        
        .stack-card:nth-child(2) {
            transform: translateY(20px) scale(0.95) rotate(-3deg);
            z-index: 2;
            opacity: 0.9;
        }
        
        .stack-card:nth-child(3) {
            transform: translateY(40px) scale(0.9) rotate(3deg);
            z-index: 1;
            opacity: 0.8;
        }

        .hero-card-stack:hover .stack-card:nth-child(1) {
            transform: translateY(-50px) scale(1.02) rotate(-3deg);
            box-shadow: 0 30px 60px rgba(0, 168, 107, 0.12);
        }
        
        .hero-card-stack:hover .stack-card:nth-child(2) {
            transform: translateY(10px) scale(1) rotate(6deg) translateX(30px);
            opacity: 1;
            box-shadow: 0 20px 40px rgba(0, 168, 107, 0.08);
        }
        
        .hero-card-stack:hover .stack-card:nth-child(3) {
            transform: translateY(70px) scale(1) rotate(-5deg) translateX(-25px);
            opacity: 1;
            box-shadow: 0 20px 40px rgba(0, 168, 107, 0.08);
        }

        .sc-icon {
            width: 54px;
            height: 54px;
            background: #F0FDF4;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin-bottom: 20px;
            box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
        }

        .sc-title {
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 10px;
            letter-spacing: -0.02em;
        }

        .sc-desc {
            font-size: 0.95rem;
            color: var(--muted);
            line-height: 1.55;
        }

        .card-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .card-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .card-modal {
            background: #ffffff;
            width: 90%;
            max-width: 450px;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0,168,107,0.15);
            transform: translateY(30px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            position: relative;
            text-align: center;
        }

        .card-modal-overlay.active .card-modal {
            transform: translateY(0) scale(1);
        }

        .card-modal .close-btn {
            position: absolute;
            top: 20px; right: 20px;
            background: rgba(0,0,0,0.05);
            border: none;
            width: 32px; height: 32px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            transition: background 0.2s;
        }
        .card-modal .close-btn:hover { background: rgba(0,0,0,0.1); }

        .card-modal .cm-icon {
            font-size: 3.5rem;
            margin-bottom: 20px;
            display: inline-block;
            background: #F0FDF4;
            padding: 20px;
            border-radius: 50%;
            box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
        }

        .card-modal .cm-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--ink);
            margin-bottom: 16px;
        }

        .card-modal .cm-desc {
            font-size: 1.05rem;
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .card-modal .cm-action {
            background: var(--primary);
            color: white;
            border: none;
            padding: 14px 32px;
            font-size: 1.1rem;
            font-weight: 700;
            border-radius: 999px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 168, 107, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card-modal .cm-action:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 168, 107, 0.4);
        }

        .section {
            position: relative;
            padding: 96px 0;
        }

        .sec-head {
            margin-bottom: 46px;
            max-width: 720px;
        }

        .steps {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
        }

        .step {
            padding: 26px 22px 28px;
            position: relative;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 16px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
            transition: all 0.3s ease;
            animation: float-step 6s ease-in-out infinite;
        }

        .step:nth-child(1) { animation-delay: 0s; }
        .step:nth-child(2) { animation-delay: 1.5s; }
        .step:nth-child(3) { animation-delay: 3s; }
        .step:nth-child(4) { animation-delay: 4.5s; }

        @keyframes float-step {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        .step:hover {
            transform: translateY(-12px) !important;
            box-shadow: 0 15px 35px rgba(0, 212, 255, 0.1);
            border-color: rgba(0, 212, 255, 0.3);
        }

        .step .num {
            font-size: 0.8rem;
            color: var(--cyan);
            letter-spacing: 0.1em;
            font-weight: 700;
        }

        .step .ic {
            font-size: 2rem;
            margin: 14px 0 10px;
        }

        .step h4 {
            font-size: 1.12rem;
            margin-bottom: 7px;
        }

        .step p {
            color: var(--muted);
            font-size: 0.9rem;
        }

        .step::after {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 2px;
            background: linear-gradient(90deg, var(--violet), var(--cyan));
            transform: scaleX(0);
            transform-origin: left;
            transition: 0.5s;
        }

        .step:hover::after {
            transform: scaleX(1);
        }

        /* Profile Form */
        .profile-form-container {
            display: none;
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 30px;
        }

        .profile-form-container.active {
            display: block;
        }

        .profile-form-container .form-group {
            margin-bottom: 20px;
        }

        .profile-form-container label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--muted);
            margin-bottom: 6px;
        }

        .profile-form-container input,
        .profile-form-container select,
        .profile-form-container textarea {
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--stroke);
            color: var(--ink);
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: 0.3s;
        }

        .profile-form-container input:focus,
        .profile-form-container select:focus,
        .profile-form-container textarea:focus {
            border-color: var(--cyan);
            box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
        }

        .profile-form-container select option {
            background: var(--bg);
            color: var(--ink);
        }

        .profile-form-container textarea {
            resize: vertical;
            min-height: 80px;
        }

        .profile-form-container .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .profile-form-container .form-hint {
            font-size: 0.78rem;
            color: var(--faint);
            margin-top: 4px;
        }

        /* Quiz Styles */
        .quiz-container {
            display: none;
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 30px;
        }

        .quiz-container.active {
            display: block;
        }

        .quiz-progress {
            margin-bottom: 30px;
        }

        .quiz-progress .pbar {
            height: 6px;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.07);
            overflow: hidden;
        }

        .quiz-progress .pbar i {
            display: block;
            height: 100%;
            border-radius: 99px;
            background: linear-gradient(90deg, var(--violet), var(--cyan));
            transition: 0.3s;
        }

        .quiz-progress .qcount {
            text-align: center;
            color: var(--muted);
            font-size: 0.9rem;
            margin-bottom: 8px;
        }

        .qcard {
            padding: 34px 30px 30px;
            text-align: center;
            animation: qin 0.45s cubic-bezier(0.16, 0.84, 0.44, 1);
        }

        @keyframes qin {
            from {
                opacity: 0;
                transform: translateY(26px) scale(0.97);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .qcard .qicon {
            font-size: 3.2rem;
            margin-bottom: 10px;
        }

        .qcard .qtype {
            font-size: 0.7rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--cyan);
            margin-bottom: 10px;
            font-weight: 700;
        }

        .qcard .qtext {
            font-size: clamp(1.1rem, 2.5vw, 1.4rem);
            font-weight: 600;
            margin-bottom: 26px;
            min-height: 2.2em;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .scale {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 9px;
        }

        .scale button {
            padding: 16px 6px;
            border-radius: var(--r-sm);
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--stroke);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            transition: 0.18s;
            font-weight: 700;
            color: var(--ink);
            cursor: pointer;
        }

        .scale button .e {
            font-size: 1.5rem;
        }

        .scale button .t {
            font-size: 0.68rem;
            color: var(--muted);
        }

        .scale button:hover {
            transform: translateY(-4px);
            border-color: var(--cyan);
            box-shadow: var(--glow-c);
        }

        .scale button.selected {
            border-color: var(--cyan);
            background: rgba(0, 212, 255, 0.14);
            box-shadow: 0 10px 24px -12px rgba(0, 212, 255, 0.65);
            transform: translateY(-2px);
        }

        .quiz-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
        }

        .quiz-nav .btn {
            min-width: 120px;
            justify-content: center;
        }

        .quiz-nav .btn[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* Results Container */
        .results-container {
            display: none;
            max-width: 960px;
            margin: 0 auto;
        }

        .results-container.active {
            display: block;
        }

        .student-profile-wrapper {
            background: var(--glass);
            border: 1px solid var(--stroke);
            border-radius: var(--r);
            box-shadow: var(--shadow);
            padding: 30px;
            margin-bottom: 30px;
            color: var(--ink);
        }

        .student-profile-card {
            display: none;
        }

        .student-profile-card.active {
            display: block;
        }

        .student-profile-card .profile-header {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }

        .student-profile-card .profile-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--violet), var(--cyan));
            display: grid;
            place-items: center;
            font-size: 2rem;
            flex-shrink: 0;
        }

        .student-profile-card .profile-info {
            flex: 1;
        }

        .student-profile-card .profile-info .name {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--ink);
        }

        .student-profile-card .profile-info .details {
            color: var(--muted);
            font-size: 0.9rem;
            margin-top: 4px;
        }

        .student-profile-card .profile-info .details span {
            margin-right: 16px;
        }

        .student-profile-card .profile-riasec {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }

        .student-profile-card .profile-riasec .code {
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            background: linear-gradient(100deg, var(--violet), var(--cyan));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .student-profile-card .profile-riasec .label {
            font-size: 0.75rem;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        /* RIASEC Score Bars */
        .riasec-scores {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
        }

        .riasec-scores .score-item {
            text-align: center;
        }

        .riasec-scores .score-item .score-label {
            font-size: 0.7rem;
            font-weight: 700;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .score-bar-container {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.06);
            border-radius: 99px;
            margin: 4px 0;
            overflow: hidden;
        }

        .score-bar-container .score-bar {
            height: 100%;
            border-radius: 99px;
            transition: width 0.8s ease;
        }

        .score-bar-container .score-bar.r {
            background: linear-gradient(90deg, #FF6B6B, #FF8E53);
        }

        .score-bar-container .score-bar.i {
            background: linear-gradient(90deg, #4ECDC4, #44B39D);
        }

        .score-bar-container .score-bar.a {
            background: linear-gradient(90deg, #A78BFA, #7C3AED);
        }

        .score-bar-container .score-bar.s {
            background: linear-gradient(90deg, #F472B6, #DB2777);
        }

        .score-bar-container .score-bar.e {
            background: linear-gradient(90deg, #FBBF24, #F59E0B);
        }

        .score-bar-container .score-bar.c {
            background: linear-gradient(90deg, #60A5FA, #3B82F6);
        }

        .riasec-scores .score-item .score-value {
            font-size: 0.65rem;
            color: var(--faint);
            font-weight: 600;
        }

        /* Trait tags - click to open modal */
        .student-profile-card .profile-traits {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 12px;
        }

        .student-profile-card .profile-traits .trait-tag {
            padding: 4px 14px;
            border-radius: 99px;
            background: var(--stroke);
            border: 1px solid var(--stroke-bright);
            font-size: 0.78rem;
            color: var(--primary);
            cursor: pointer;
            transition: 0.2s;
        }

        .student-profile-card .profile-traits .trait-tag:hover {
            background: var(--stroke-bright);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 168, 107, 0.15);
        }

        /* Trait Detail Modal */
        .trait-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            background: rgba(3, 5, 15, 0.92);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .trait-modal-overlay .trait-modal {
            max-width: 500px;
            width: 100%;
            padding: 36px 32px;
            border-radius: var(--r);
            background: var(--bg-2);
            border: 1px solid var(--stroke-bright);
            box-shadow: var(--shadow);
        }

        .trait-modal-overlay .trait-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 16px;
        }

        .trait-modal-overlay .trait-modal .modal-header h3 {
            font-size: 1.5rem;
            color: var(--ink);
            margin: 0;
        }

        .trait-modal-overlay .trait-modal .modal-close {
            background: var(--glass-2);
            border: 1px solid var(--stroke);
            color: var(--muted);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            transition: 0.2s;
            display: grid;
            place-items: center;
        }

        .trait-modal-overlay .trait-modal .modal-close:hover {
            border-color: var(--coral);
            color: var(--coral);
        }

        .trait-modal-overlay .trait-modal .trait-description {
            color: var(--muted);
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: 12px;
        }

        .trait-modal-overlay .trait-modal .trait-example {
            color: var(--amber);
            font-size: 0.9rem;
            padding: 12px 16px;
            background: rgba(255, 179, 71, 0.08);
            border-radius: 10px;
            border-left: 3px solid var(--amber);
        }

        .result-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .result-header .code-badge {
            display: inline-block;
            padding: 8px 24px;
            border-radius: 99px;
            background: linear-gradient(100deg, var(--violet), var(--cyan));
            font-size: 1.8rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            margin: 12px 0;
            color: #fff;
        }

        .career-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px;
            margin-top: 30px;
        }

        .career-card {
            position: relative;
            padding: 22px;
            border-radius: 20px;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
        }

        .career-card:hover {
            transform: translateY(-8px);
            border-color: rgba(0, 212, 255, 0.3);
            box-shadow: 0 15px 35px rgba(0, 212, 255, 0.1);
        }

        .career-card .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
        }

        .career-card .rank {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--ink);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .career-card .match {
            font-weight: 700;
            font-size: 0.8rem;
            padding: 5px 12px;
            border-radius: 99px;
            background: rgba(0, 212, 255, 0.1);
            color: var(--cyan);
            border: 1px solid rgba(0, 212, 255, 0.25);
            letter-spacing: 0.02em;
        }

        .career-card h4 {
            font-size: 1.15rem;
            margin: 0 0 8px 0;
            color: var(--ink);
            font-weight: 700;
            line-height: 1.3;
        }

        .career-card .career-desc {
            font-size: 0.85rem;
            color: var(--muted);
            margin-bottom: 20px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .career-card .cstats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 14px;
        }

        .career-card .cstat-box {
            background: rgba(0, 0, 0, 0.02);
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 12px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .career-card .cstat-box:hover {
            background: rgba(0, 0, 0, 0.04);
        }

        .career-card .cstat-box .lbl-row {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 4px;
        }

        .career-card .cstat-box .lbl-row .icon {
            font-size: 1rem;
        }

        .career-card .cstat-box .lbl {
            font-size: 0.7rem;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 600;
        }

        .career-card .cstat-box .val {
            font-weight: 600;
            font-size: 0.85rem;
            color: var(--ink);
            line-height: 1.4;
            word-break: break-word;
        }

        .career-card .cstats-list-full {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
            flex-grow: 1;
        }

        .career-card .cstat-row-full {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: rgba(0, 0, 0, 0.02);
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 12px;
            padding: 10px 14px;
            transition: all 0.2s;
        }

        .career-card .cstat-row-full:hover {
            background: rgba(0, 0, 0, 0.04);
            border-color: rgba(0, 0, 0, 0.08);
        }

        .career-card .cstat-row-full .icon {
            font-size: 1.1rem;
            margin-top: 2px;
            flex-shrink: 0;
        }

        .career-card .cstat-row-full .info {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex-grow: 1;
        }

        .career-card .cstat-row-full .lbl {
            font-size: 0.68rem;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .career-card .cstat-row-full .val {
            font-weight: 600;
            font-size: 0.84rem;
            color: var(--ink);
            line-height: 1.4;
            word-break: break-word;
        }

        .career-card .card-footer {
            font-size: 0.82rem;
            color: var(--violet-2);
            font-weight: 600;
            margin-top: auto;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: color 0.2s;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .career-card:hover .card-footer {
            color: var(--cyan);
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(3, 5, 15, 0.95);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        }

        .modal-overlay .modal-content {
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 40px;
        }

        .modal-overlay .modal-content .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 24px;
        }

        .modal-overlay .modal-content .modal-header h2 {
            font-size: 1.8rem;
            margin: 4px 0;
            color: var(--ink);
        }

        .modal-overlay .modal-content .modal-close {
            background: var(--glass-2);
            border: 1px solid var(--stroke);
            color: var(--ink);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            transition: 0.2s;
        }

        .modal-overlay .modal-content .modal-close:hover {
            border-color: var(--coral);
            color: var(--coral);
        }

        .modal-overlay .modal-content .section-title {
            color: var(--cyan);
            margin-bottom: 8px;
            font-size: 1rem;
        }

        .modal-overlay .modal-content .section-content {
            color: var(--muted);
            margin-bottom: 16px;
        }

        .modal-overlay .modal-content .tag {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 99px;
            background: var(--glass-2);
            border: 1px solid var(--stroke);
            font-size: 0.85rem;
            color: var(--muted);
            margin: 4px;
        }

        .modal-overlay .modal-content .tag-cyan {
            background: rgba(0, 212, 255, 0.12);
            border: 1px solid rgba(0, 212, 255, 0.3);
            color: var(--cyan);
        }

        .modal-overlay .modal-content .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        .modal-overlay .modal-content .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }

        .modal-overlay .modal-content .list-item {
            padding: 4px 0;
            color: var(--muted);
        }

        .modal-overlay .modal-content .list-item::before {
            content: "▸ ";
            color: var(--cyan);
        }

        .modal-overlay .modal-content .link-item {
            color: var(--cyan);
            text-decoration: underline;
            word-break: break-all;
        }

        .modal-overlay .modal-content .quote-text {
            font-style: italic;
            color: var(--cyan);
            padding: 12px 16px;
            background: var(--glass-2);
            border-radius: 12px;
            border-left: 3px solid var(--cyan);
            margin: 8px 0;
        }

        .modal-overlay .modal-content .story-card {
            margin-bottom: 16px;
            background: var(--glass-2);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--stroke);
        }

        /* Chatbot */
        .chat-wrap {
            max-width: 720px;
            margin: 0 auto;
            overflow: hidden;
            height: 560px;
            display: flex;
            flex-direction: column;
        }

        .chat-hd {
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 18px 22px;
            border-bottom: 1px solid var(--stroke);
            background: linear-gradient(100deg, rgba(123, 97, 255, 0.16), rgba(0, 212, 255, 0.06));
            flex-shrink: 0;
        }

        .chat-hd .av {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            font-size: 1.5rem;
            background: radial-gradient(circle at 35% 30%, var(--violet), var(--cyan));
            box-shadow: 0 0 26px -6px var(--violet);
        }

        .chat-hd .who b {
            font-size: 1rem;
        }

        .chat-hd .who span {
            font-size: 0.78rem;
            color: var(--cyan);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .chat-hd .who .live {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #39ff9e;
            box-shadow: 0 0 8px #39ff9e;
            animation: blink 1.6s infinite;
        }

        @keyframes blink {
            50% {
                opacity: 0.3;
            }
        }

        .chat-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px 22px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: rgba(0, 0, 0, 0.2);
        }

        .msg {
            max-width: 82%;
            padding: 13px 16px;
            border-radius: 16px;
            font-size: 0.92rem;
            line-height: 1.5;
            animation: fadeIn 0.3s;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .msg.bot {
            align-self: flex-start;
            background: var(--glass-2);
            border: 1px solid var(--stroke);
            border-bottom-left-radius: 5px;
        }

        .msg.me {
            align-self: flex-end;
            background: linear-gradient(100deg, var(--violet), var(--violet-2));
            color: #fff;
            border-bottom-right-radius: 5px;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .typing {
            align-self: flex-start;
            display: flex;
            gap: 5px;
            padding: 14px 16px;
            background: var(--glass-2);
            border-radius: 16px;
            border: 1px solid var(--stroke);
        }

        .typing span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--cyan);
            animation: tdot 1.2s infinite;
        }

        .typing span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes tdot {

            0%,
            60%,
            100% {
                opacity: 0.3;
                transform: translateY(0);
            }

            30% {
                opacity: 1;
                transform: translateY(-5px);
            }
        }

        .quickq {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            padding: 12px 22px;
            background: rgba(0, 0, 0, 0.15);
            border-top: 1px solid var(--stroke);
            flex-shrink: 0;
        }

        .quickq button {
            font-size: 0.8rem;
            font-weight: 600;
            padding: 8px 13px;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--stroke);
            color: var(--muted);
            transition: 0.2s;
            cursor: pointer;
        }

        .quickq button:hover {
            border-color: var(--cyan);
            color: var(--cyan);
        }

        .chat-input {
            display: flex;
            gap: 10px;
            padding: 16px 22px;
            border-top: 1px solid var(--stroke);
            background: rgba(0, 0, 0, 0.15);
            flex-shrink: 0;
        }

        .chat-input input {
            flex: 1;
            padding: 13px 16px;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--stroke);
            color: var(--ink);
            font-family: inherit;
            font-size: 0.92rem;
            outline: none;
        }

        .chat-input input:focus {
            border-color: var(--cyan);
        }

        .chat-input button {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            flex: none;
            display: grid;
            place-items: center;
            background: linear-gradient(100deg, var(--violet), var(--violet-2));
            color: #fff;
            font-size: 1.1rem;
            box-shadow: 0 8px 24px -8px var(--violet);
            border: none;
            cursor: pointer;
            transition: 0.2s;
        }

        .chat-input button:hover {
            transform: scale(1.05);
        }

        .chat-input button:disabled {
            opacity: 0.5;
        }

        footer {
            position: relative;
            z-index: 2;
            border-top: 1px solid rgba(123, 97, 255, 0.16);
            padding: 56px 0 30px;
            margin-top: 30px;
        }

        .foot-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.2fr;
            gap: 34px;
            margin-bottom: 36px;
        }

        .foot-col h5 {
            font-size: 0.78rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--faint);
            margin-bottom: 14px;
            font-weight: 700;
        }

        .foot-col a {
            display: block;
            color: var(--muted);
            font-size: 0.9rem;
            margin-bottom: 9px;
            transition: 0.2s;
            text-decoration: none;
            cursor: pointer;
        }

        .foot-col a:hover {
            color: var(--cyan);
        }

        .foot-about p {
            margin-top: 14px;
            line-height: 1.6;
            font-size: 0.9rem;
            color: var(--muted);
        }

        .foot-bottom {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            color: var(--faint);
            font-size: 0.82rem;
        }

        .toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            z-index: 120;
            background: var(--glass-2);
            border: 1px solid var(--stroke-bright);
            backdrop-filter: blur(14px);
            padding: 13px 22px;
            border-radius: 99px;
            font-weight: 600;
            font-size: 0.9rem;
            opacity: 0;
            transition: 0.3s;
            box-shadow: var(--shadow);
            pointer-events: none;
        }

        .toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        .reveal {
            opacity: 0;
            transform: translateY(28px);
            transition: 0.7s cubic-bezier(0.16, 0.84, 0.44, 1);
        }

        .reveal.in {
            opacity: 1;
            transform: none;
        }

        .loading-spinner {
            text-align: center;
            padding: 40px;
        }

        .loading-spinner .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--stroke);
            border-top-color: var(--cyan);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }

        .modal-content::-webkit-scrollbar,
        .chat-body::-webkit-scrollbar {
            width: 5px;
        }

        .modal-content::-webkit-scrollbar-track,
        .chat-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .modal-content::-webkit-scrollbar-thumb,
        .chat-body::-webkit-scrollbar-thumb {
            background: var(--stroke);
            border-radius: 99px;
        }

        @media (max-width: 860px) {
            .hero-grid {
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .holo {
                height: 330px;
                order: -1;
            }

            .holo-ring.r1 {
                width: 300px;
                height: 300px;
            }

            .holo-ring.r2 {
                width: 230px;
                height: 230px;
            }

            .holo-ring.r3 {
                width: 165px;
                height: 165px;
            }

            .holo-core {
                width: 135px;
                height: 135px;
            }

            .holo-core .bot {
                font-size: 3.3rem;
            }

            .chip {
                font-size: 0.74rem;
                padding: 7px 11px;
            }

            .steps {
                grid-template-columns: 1fr 1fr;
            }

            .career-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .foot-grid {
                grid-template-columns: 1fr 1fr;
            }

            .nav-links {
                display: none;
            }

            .modal-overlay .modal-content .grid-2,
            .modal-overlay .modal-content .grid-3 {
                grid-template-columns: 1fr;
            }

            .profile-form-container .form-row {
                grid-template-columns: 1fr;
            }

            .student-profile-card .profile-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .student-profile-card .profile-riasec {
                align-items: flex-start;
                width: 100%;
            }

            .riasec-scores {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        @media (max-width: 600px) {
            .steps {
                grid-template-columns: 1fr;
            }

            .foot-grid {
                grid-template-columns: 1fr;
            }

            .chat-wrap {
                height: 480px;
            }

            .hero h1 {
                font-size: 2.2rem;
            }

            .career-grid {
                grid-template-columns: minmax(0, 1fr);
            }

            .riasec-scores {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .reveal {
                opacity: 1;
                transform: none;
                transition: none;
            }

            .holo-core,
            .holo-ring,
            .chip {
                animation: none;
            }
        }
    </style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
<!-- Theme Toggle Floating Button -->
<div class="theme-toggle-floating" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Theme">🌕</div>
<div class="aura"></div>
<div class="grain"></div>
<!-- ============================== NAV ============================== -->
<nav class="nav" id="nav">
<div class="nav-in">
<div class="brand" onclick="window.location.href = '/'" style="cursor: pointer;"><img alt="SkillSense Logo" class="brand-logo" src="/static/logo.png"/> SkillSense</div>
<div class="nav-links">
<a href="/how-it-works">How it works</a>
<a href="/take-test">Take Test</a>
<a href="/ai-counselor">AI Counselor</a>
<a href="/contact">Contact</a>
</div>
<div class="nav-actions" style="display: flex; align-items: center; gap: 12px;">
<button class="btn nav-cta" onclick="window.location.href='/take-test'">Start Career Test</button>
<select id="langSelect" onchange="switchLanguage(this.value)" style="
                    background: rgba(0, 0, 0, 0.06);
                    color: #111827;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.25s ease;
                ">
<option style="background:#ffffff; color:#111827;" value="en">English</option>
<option style="background:#ffffff; color:#111827;" value="hi">हिंदी (Hindi)</option>
<option style="background:#ffffff; color:#111827;" value="mr">मराठी (Marathi)</option>
</select>
</div>
</div>
</nav>
<!-- ============================== HERO ============================== -->
{% block content %}{% endblock %}
<!-- ============================== HOW IT WORKS ============================== -->

<!-- ============================== QUIZ SECTION ============================== -->

<!-- ============================== AI COUNSELOR ============================== -->

<!-- ============================== CONTACT SECTION ============================== -->
<style>
        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 32px;
            margin-top: 40px;
            text-align: left;
            align-items: start;
        }
        @media (max-width: 768px) {
            .contact-grid {
                grid-template-columns: 1fr !important;
            }
        }
    </style>

<!-- ============================== FOOTER ============================== -->
<footer>
<div class="wrap">
<div class="foot-grid">
<div class="foot-col foot-about">
<div class="brand" onclick="window.location.href = '/'" style="cursor: pointer;"><img alt="SkillSense Logo" class="brand-logo" src="/static/logo.png"/> SkillSense</div>
<p>An intelligent career guidance platform helping students discover their strengths, explore
                        opportunities, and build a roadmap for their future.</p>
</div>
<div class="foot-col">
<h5>Explore</h5>
<a onclick="document.getElementById('quiz-section').scrollIntoView({behavior:'smooth'})">Take
                        Test</a>
<a onclick="document.getElementById('counselor').scrollIntoView({behavior:'smooth'})">AI
                        Counselor</a>
<a onclick="document.getElementById('contact-section').scrollIntoView({behavior:'smooth'})">Contact</a>
</div>
<div class="foot-col">
<h5>Resources</h5>
<a onclick="document.getElementById('counselor').scrollIntoView({behavior:'smooth'})">Career
                        Advice</a>
</div>
<div class="foot-col">
<h5>Get Started</h5>
<a onclick="startQuiz()">Start Career Test</a>
</div>
</div>
<div class="foot-bottom">
<span>© 2026 SkillSense. Built for curious students.</span>
<span></span>
</div>
</div>
</footer>
<div class="toast" id="toast"></div>
<script>
        // Immediately apply saved theme on load to prevent flash
        (function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        })();

        // ============================================================
        // TRAIT DEFINITIONS WITH DESCRIPTIONS
        // ============================================================
        const TRAIT_DESCRIPTIONS = {
            "Organized": {
                title: "Organized",
                description: "You excel at arranging things systematically and keeping track of tasks and schedules efficiently.",
                example: "Example: You often create checklists, maintain neat workspaces, and plan your time effectively."
            },
            "Detail Oriented": {
                title: "Detail Oriented",
                description: "You pay close attention to the small things that others might miss, ensuring high accuracy.",
                example: "Example: You double-check your work for errors and notice subtle differences in patterns."
            },
            "Structured": {
                title: "Structured",
                description: "You prefer clear rules, predictable routines, and step-by-step processes to achieve goals.",
                example: "Example: You like having a clear agenda before meetings and follow established procedures."
            },
            "Leadership": {
                title: "Leadership",
                description: "You have a natural ability to guide, inspire, and manage others towards a shared vision.",
                example: "Example: You naturally take charge in group projects and are comfortable making decisions."
            },
            "Persuasive": {
                title: "Persuasive",
                description: "You have a talent for communicating effectively to influence others and negotiate outcomes.",
                example: "Example: You can easily convince your friends to try new things and present arguments well."
            },
            "Goal Oriented": {
                title: "Goal Oriented",
                description: "You are highly driven by objectives and focus your energy on achieving specific targets.",
                example: "Example: You set personal benchmarks and feel most satisfied when crossing the finish line."
            },
            "Analytical": {
                title: "Analytical",
                description: "You enjoy breaking down complex problems, examining data, and finding logical solutions.",
                example: "Example: You love solving puzzles, analyzing case studies, and understanding how systems work."
            },
            "Research Oriented": {
                title: "Research Oriented",
                description: "You have a natural curiosity and love to explore, investigate, and discover new information.",
                example: "Example: You enjoy conducting experiments, reading about new discoveries, and digging deep into topics."
            },
            "Curious": {
                title: "Curious",
                description: "You have a strong desire to learn, explore, and understand the world around you.",
                example: "Example: You ask lots of questions, love learning new things, and are always exploring new interests."
            },
            "Practical": {
                title: "Practical",
                description: "You prefer hands-on, real-world solutions and enjoy working with tangible objects.",
                example: "Example: You enjoy building things, fixing items, and solving practical problems around you."
            },
            "Hands-on": {
                title: "Hands-on",
                description: "You learn best by doing and prefer activities where you can physically interact with materials.",
                example: "Example: You love DIY projects, working with tools, or engaging in crafts and making things."
            },
            "Mechanical": {
                title: "Mechanical",
                description: "You have a natural understanding of how machines and mechanical systems work.",
                example: "Example: You enjoy taking things apart, understanding how engines work, and fixing devices."
            },
            "Creative": {
                title: "Creative",
                description: "You have a vivid imagination and enjoy expressing yourself through art, design, or music.",
                example: "Example: You love painting, designing, writing stories, or composing music."
            },
            "Innovative": {
                title: "Innovative",
                description: "You enjoy thinking outside the box and coming up with new, original ideas.",
                example: "Example: You love brainstorming new solutions, challenging conventions, and creating novel concepts."
            },
            "Expressive": {
                title: "Expressive",
                description: "You have a natural ability to express yourself clearly and emotionally through words or art.",
                example: "Example: You enjoy writing poetry, public speaking, or expressing yourself through art."
            },
            "Helpful": {
                title: "Helpful",
                description: "You have a strong desire to assist others and make a positive impact on people's lives.",
                example: "Example: You enjoy volunteering, mentoring others, or helping friends solve their problems."
            },
            "Empathetic": {
                title: "Empathetic",
                description: "You have the ability to understand and share the feelings of others.",
                example: "Example: You are good at listening, understanding others' perspectives, and offering support."
            },
            "Collaborative": {
                title: "Collaborative",
                description: "You enjoy working with others toward common goals and value shared success.",
                example: "Example: You love team projects, group activities, and contributing to team goals."
            },
            "Leadership": {
                title: "Leadership",
                description: "You have the ability to guide, inspire, and influence others.",
                example: "Example: You enjoy leading teams, organizing events, and motivating others to achieve goals."
            },
            "Persuasive": {
                title: "Persuasive",
                description: "You have the ability to influence others' opinions, decisions, and actions.",
                example: "Example: You are good at debates, convincing others, and negotiating effectively."
            },
            "Goal Oriented": {
                title: "Goal Oriented",
                description: "You are highly motivated by achieving specific objectives.",
                example: "Example: You set clear targets, work diligently to achieve them, and track your progress."
            },
            "Organized": {
                title: "Organized",
                description: "You like structure, order, and systematic approaches.",
                example: "Example: You love planning, keeping your workspace tidy, and creating efficient systems."
            },
            "Detail Oriented": {
                title: "Detail Oriented",
                description: "You have a sharp eye for precision and accuracy.",
                example: "Example: You notice small details that others miss and take pride in thorough, accurate work."
            },
            "Structured": {
                title: "Structured",
                description: "You prefer clear rules, procedures, and organized environments.",
                example: "Example: You thrive with clear instructions, defined roles, and structured processes."
            }
        };

        // ============================================================
        // STATE
        // ============================================================
        let questions = [];
        let currentQuestion = 0;
        let answers = [];
        let isProcessing = false;
        let userProfile = null;
        let topCareers = [];
        let studentInfo = {};
        let riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

        // Language settings
        let currentLanguage = 'en';
        let rawResultsData = null;
        const careerTranslationCache = {};

        // Static translations dictionary
        const uiTranslations = {
            en: {
                "brand-title": "🚀 SkillSense",
                "nav-how": "How it works",
                "nav-test": "Take Test",
                "nav-counselor": "AI Counselor",
                "nav-contact": "Contact",
                "nav-start": "Start Career Test",
                "contact-eyebrow": "Let's Connect",
                "contact-title": "Let's <span class=\"grad\">Connect</span>",
                "contact-lead": "Whether you are a student exploring your path, a school administrator looking to bring SkillSense to your campus, or have questions about our platform, we are here to help.",
                "contact-info-title": "Contact Information",
                "contact-email-label": "Email Us",
                "contact-email-sub": "Direct lines to our departments",
                "contact-hq-label": "Headquarters",
                "contact-phone-label": "Call Us",
                "contact-form-title": "Send a Message",
                "contact-form-sub": "Secure transmission through our encrypted routing system.",
                "contact-name-placeholder": "Full Name",
                "contact-email-placeholder": "Email Address",
                "contact-company-placeholder": "Company (Optional)",
                "contact-subject-placeholder": "Subject",
                "contact-msg-placeholder": "Your Message",
                "contact-btn-text": "✈️ Send Message",
                "hero-eyebrow": "PERSONALITY · AI INSIGHTS · CAREER ROADMAPS",
                "hero-title": "Find a career path<br><span class=\"12\">that matches who you are.</span>",
                "hero-sub": "An intelligent career companion that understands your interests, strengths, and goals to create a personalized roadmap for your future.",
                "hero-start": "Start Career Test →",
                "hero-chat": "Chat with AI",
                "num-1": "6",
                "num-2": "500+",
                "num-3": "24/7",
                "step-num-1": "01",
                "step-num-2": "02",
                "step-num-3": "03",
                "step-num-4": "04",
                "stat-1": "Personality Dimensions",
                "stat-2": "Career Paths",
                "stat-3": "AI Guidance",
                "sec-journey-eyebrow": "The journey",
                "sec-journey-title": "Four steps to your <span class=\"grad\">career match</span>",
                "step-1-title": "Build your profile",
                "step-1-desc": "Tell us your name, age, class, interests and hobbies — your AI assistant guides you through.",
                "step-2-title": "Play the career test",
                "step-2-desc": "Quick cards, XP, coins and streaks. It feels like a game, not an exam.",
                "step-3-title": "AI reads your strengths",
                "step-3-desc": "Your answers become a personalized personality and interest profile in seconds.",
                "step-4-title": "Get your roadmap",
                "step-4-desc": "Matched careers, colleges, scholarships and a step-by-step path forward.",
                "sec-quiz-eyebrow": "CAREER DISCOVERY ASSESSMENT",
                "sec-quiz-title": "Discover the path <span class=\"grad\">that fits you.</span>",
                "sec-quiz-lead": "Tell us about yourself and answer a few questions to understand your interests, strengths, and career preferences.",
                "form-heading": "Tell us about yourself",
                "label-name": "Full Name *",
                "placeholder-name": "Enter your full name",
                "label-age": "Age *",
                "placeholder-age": "Enter your age",
                "label-class": "Class/Year *",
                "option-select-class": "Select your class",
                "label-stream": "Education Stream/Field",
                "placeholder-stream": "e.g., Science, Commerce, Arts, Engineering",
                "heading-learning-profile": "Your Learning Profile",
                "label-subjects": "Subjects you enjoy learning",
                "placeholder-subjects": "e.g., Mathematics, Physics, English, Biology, History",
                "label-weak-subjects": "Subjects You Find Challenging",
                "placeholder-weak-subjects": "e.g., Chemistry, Statistics, Economics",
                "heading-outside-academics": "What inspires you outside academics?",
                "label-interests": "Your Interests",
                "placeholder-interests": "e.g., Technology, Research, Art, Sports, Social Work",
                "label-hobbies": "Your Hobbies",
                "placeholder-hobbies": "e.g., Reading, Gaming, Painting, Coding, Gardening",
                "label-strengths": "Your natural strengths",
                "placeholder-strengths": "e.g., Problem-solving, Communication, Leadership, Creativity",
                "label-aspirations": "Career Aspirations (if any)",
                "placeholder-aspirations": "e.g., Engineer, Doctor, Scientist, Entrepreneur",
                "heading-preferences": "Career Ambitions & Preferences",
                "label-learning-mode": "Preferred Learning Mode",
                "label-budget": "Budget Preference",
                "label-location": "Location Preference",
                "label-student-location": "Preferred Study Location",
                "placeholder-student-location": "e.g., Tamil Nadu, Maharashtra, Delhi",
                "label-college-range": "Preferred College Type/Range",
                "option-college-1": "1st Year College",
                "option-college-2": "2nd Year College",
                "option-college-3": "3rd Year College",
                "option-college-4": "4th Year College",
                "option-graduate": "Graduate",
                "option-post-graduate": "Post Graduate",
                "option-learning-offline": "Offline (Classroom/Lab)",
                "option-learning-distance": "Distance/Online Learning",
                "option-learning-hybrid": "Hybrid (Mix)",
                "option-budget-moderate": "Moderate Budget",
                "option-budget-sensitive": "Budget Sensitive",
                "option-budget-no-constraint": "No Budget Constraint",
                "option-location-india": "India Wide",
                "option-location-local": "Local Opportunities",
                "option-location-international": "International Career",
                "option-range-all": "All Colleges (Govt & Private)",
                "option-range-govt": "Government Colleges Only",
                "option-range-private": "Private Colleges Only",
                "option-range-distance": "Distance Learning Only",
                "btn-submit-profile": "Continue to Career Test →",
                "scale-not-me": "Not me",
                "scale-little": "A little",
                "scale-maybe": "Maybe",
                "scale-yes": "Yes",
                "scale-so-me": "So me!",
                "btn-back": "← Back",
                "btn-next": "Next →",
                "btn-submit-test": "Submit Test →",
                "sec-counselor-eyebrow": "Nova AI Counselor",
                "sec-counselor-title": "Have questions? <span class=\"grad\">Ask VERA.</span>",
                "sec-counselor-sub": "Ask anything about your matches, course fees, colleges, entrance exams, or alternate paths.",
                "placeholder-chat": "Ask Nova about your career matches, colleges, entrance exams...",
                "btn-send": "Send",
                "chat-disclaimer": "Disclaimer: VERA is an AI assistant. Guidance is for informational purposes only. Consult professional counselors for critical career decisions.",
                "modal-close": "Close",
                "title-overview": "Career Overview",
                "title-why-matches": "Why It Matches Student Profile",
                "title-traits": "Personality Traits Alignment",
                "title-pathway": "Educational Pathway",
                "title-fees": "Course Fees",
                "title-income": "Expected Income",
                "title-scholarships": "Scholarships",
                "title-loans": "Loans",
                "title-study": "Where Will You Study?",
                "title-gov": "Government",
                "title-priv": "Private",
                "title-dist": "Distance Learning",
                "title-work": "Where Will You Work?",
                "title-growth": "Expected Growth Path",
                "title-skills": "Skill Development Plan",
                "title-example": "Example From The Field",
                "title-exams": "Entrance Exams"
            },
            hi: {
                "brand-title": "SkillSense",
                "nav-how": "यह कैसे काम करता है",
                "nav-test": "टेस्ट लें",
                "nav-counselor": "एआई काउंसलर",
                "nav-contact": "संपर्क",
                "nav-start": "करियर टेस्ट शुरू करें",
                "contact-eyebrow": "आइए जुड़ें",
                "contact-title": "आइए <span class=\"grad\">जुड़ें</span>",
                "contact-lead": "चाहे आप अपना रास्ता तलाशने वाले छात्र हों, अपने परिसर में स्किलसेंस लाने के इच्छुक स्कूल प्रशासक हों, या हमारे प्लेटफॉर्म के बारे में प्रश्न हों, हम मदद के लिए यहां हैं।",
                "contact-info-title": "संपर्क जानकारी",
                "contact-email-label": "हमें ईमेल करें",
                "contact-email-sub": "हमारे विभागों के लिए सीधी लाइनें",
                "contact-hq-label": "मुख्यालय",
                "contact-phone-label": "हमें कॉल करें",
                "contact-form-title": "एक संदेश भेजें",
                "contact-form-sub": "हमारे सुरक्षित राउटिंग सिस्टम के माध्यम से सुरक्षित ट्रांसमिशन।",
                "contact-name-placeholder": "पूरा नाम",
                "contact-email-placeholder": "ईमेल पता",
                "contact-company-placeholder": "कंपनी (वैकल्पिक)",
                "contact-subject-placeholder": "विषय",
                "contact-msg-placeholder": "आपका संदेश",
                "contact-btn-text": "संदेश भेजें",
                "hero-eyebrow": "व्यक्तित्व · एआई अंतर्दृष्टि · करियर रोडमैप",
                "hero-title": "एक ऐसा करियर पथ खोजें<br><span class=\"12\">जो आपके व्यक्तित्व से मेल खाता हो।</span>",
                "hero-sub": "एक बुद्धिमान करियर साथी जो आपके भविष्य के लिए एक व्यक्तिगत रोडमैप बनाने के लिए आपके हितों, शक्तियों और लक्ष्यों को समझता है।",
                "hero-start": "करियर टेस्ट शुरू करें →",
                "hero-chat": "एआई से चैट करें",
                "num-1": "६",
                "num-2": "५००+",
                "num-3": "२४/७",
                "step-num-1": "०१",
                "step-num-2": "०२",
                "step-num-3": "०३",
                "step-num-4": "०४",
                "stat-1": "व्यक्तित्व आयाम",
                "stat-2": "करियर विकल्प",
                "stat-3": "एआई मार्गदर्शन",
                "sec-journey-eyebrow": "सफ़र",
                "sec-journey-title": "आपके <span class=\"grad\">करियर मैच</span> के चार चरण",
                "step-1-title": "अपनी प्रोफाइल बनाएं",
                "step-1-desc": "हमें अपना नाम, उम्र, कक्षा, रुचियां और शौक बताएं - आपका एआई सहायक आपका मार्गदर्शन करेगा।",
                "step-2-title": "करियर टेस्ट खेलें",
                "step-2-desc": "त्वरित कार्ड, अनुभव अंक (XP) और दैनिक सिलसिले। यह एक खेल जैसा लगता है, परीक्षा नहीं।",
                "step-3-title": "एआई आपकी ताकत पढ़ता है",
                "step-3-desc": "आपके उत्तर सेकंडों में एक व्यक्तिगत व्यक्तित्व और रुचि प्रोफ़ाइल बन जाते हैं।",
                "step-4-title": "अपना रोडमैप प्राप्त करें",
                "step-4-desc": "मेले खाने वाले करियर, कॉलेज, छात्रवृत्तियां और आगे बढ़ने का एक चरण-दर-चरण मार्ग।",
                "sec-quiz-eyebrow": "करियर खोज मूल्यांकन",
                "sec-quiz-title": "वह मार्ग खोजें <span class=\"grad\">जो आपके अनुकूल हो।</span>",
                "sec-quiz-lead": "अपने बारे में बताएं और अपनी रुचियों, शक्तियों और करियर प्राथमिकताओं को समझने के लिए कुछ प्रश्नों के उत्तर दें।",
                "form-heading": "अपने बारे में बताएं",
                "label-name": "पूरा नाम *",
                "placeholder-name": "अपना पूरा नाम दर्ज करें",
                "label-age": "उम्र *",
                "placeholder-age": "अपनी उम्र दर्ज करें",
                "label-class": "कक्षा/वर्ष *",
                "option-select-class": "अपनी कक्षा चुनें",
                "label-stream": "शिक्षा स्ट्रीम/क्षेत्र",
                "placeholder-stream": "जैसे, विज्ञान, वाणिज्य, कला, इंजीनियरिंग",
                "heading-learning-profile": "आपका सीखने का प्रोफ़ाइल",
                "label-subjects": "वे विषय जिन्हें पढ़ने में आपको मज़ा आता है",
                "placeholder-subjects": "जैसे, गणित, भौतिकी, अंग्रेजी, जीव विज्ञान, इतिहास",
                "label-weak-subjects": "वे विषय जो आपको कठिन लगते हैं",
                "placeholder-weak-subjects": "जैसे, रसायन विज्ञान, सांख्यिकी, अर्थशास्त्र",
                "heading-outside-academics": "पढ़ाई के अलावा आपको क्या प्रेरित करता है?",
                "label-interests": "आपकी रुचियां",
                "placeholder-interests": "जैसे, प्रौद्योगिकी, अनुसंधान, कला, खेल, सामाजिक कार्य",
                "label-hobbies": "आपके शौक",
                "placeholder-hobbies": "जैसे, पढ़ना, गेमिंग, पेंटिंग, कोडिंग, बागवानी",
                "label-strengths": "आपकी स्वाभाविक ताकतें",
                "placeholder-strengths": "जैसे, समस्या-समाधान, संचार, नेतृत्व, रचनात्मकता",
                "label-aspirations": "करियर आकांक्षाएं (यदि कोई हो)",
                "placeholder-aspirations": "जैसे, इंजीनियर, डॉक्टर, वैज्ञानिक, उद्यमी",
                "heading-preferences": "करियर प्राथमिकताएं",
                "label-learning-mode": "पसंदीदा सीखने का तरीका",
                "label-budget": "बजट प्राथमिकता",
                "label-location": "स्थान प्राथमिकता",
                "label-student-location": "पसंदीदा अभ्यास स्थान",
                "placeholder-student-location": "जैसे, महाराष्ट्र, दिल्ली, उत्तर प्रदेश",
                "label-college-range": "पसंदीदा कॉलेज प्रकार/श्रेणी",
                "option-college-1": "प्रथम वर्ष कॉलेज",
                "option-college-2": "द्वितीय वर्ष कॉलेज",
                "option-college-3": "तृतीय वर्ष कॉलेज",
                "option-college-4": "चतुर्थ वर्ष कॉलेज",
                "option-graduate": "स्नातक (Graduate)",
                "option-post-graduate": "स्नातकोत्तर (Post Graduate)",
                "option-learning-offline": "ऑफलाइन (क्लासरूम/लैब)",
                "option-learning-distance": "डिस्टेंस/ऑनलाइन लर्निंग",
                "option-learning-hybrid": "हाइब्रिड (मिश्रित)",
                "option-budget-moderate": "मध्यम बजट",
                "option-budget-sensitive": "बजट संवेदनशील (कम बजट)",
                "option-budget-no-constraint": "कोई बजट सीमा नहीं",
                "option-location-india": "पूरे भारत में",
                "option-location-local": "स्थानीय अवसर",
                "option-location-international": "अंतर्राष्ट्रीय करिअर",
                "option-range-all": "सभी कॉलेज (सरकारी और निजी)",
                "option-range-govt": "केवल सरकारी कॉलेज",
                "option-range-private": "केवल निजी कॉलेज",
                "option-range-distance": "केवल डिस्टेंस लर्निंग",
                "btn-submit-profile": "करियर टेस्ट के लिए आगे बढ़ें →",
                "scale-not-me": "मैं नहीं",
                "scale-little": "थोड़ा",
                "scale-maybe": "शायद",
                "scale-yes": "हाँ",
                "scale-so-me": "बिल्कुल मैं!",
                "btn-back": "← पीछे",
                "btn-next": "आगे →",
                "btn-submit-test": "टेस्ट सबमिट करें →",
                "sec-counselor-eyebrow": "नोवा एआई काउंसलर",
                "sec-counselor-title": "कोई सवाल है? <span class=\"grad\"> वेरा से पूछें।</span>",
                "sec-counselor-sub": "अपने करियर मैच, कॉलेज फीस, प्रवेश परीक्षाओं या वैकल्पिक मार्गों के बारे में कुछ भी पूछें।",
                "placeholder-chat": "अपने करियर मैच, कॉलेज, प्रवेश परीक्षाओं के बारे में नोवा से पूछें...",
                "btn-send": "भेजें",
                "chat-disclaimer": "अस्वीकरण: VERA एक एआई सहायक है। यह मार्गदर्शन केवल सूचनात्मक उद्देश्यों के लिए है। अंतिम निर्णयों के लिए पेशेवर सलाहकारों से संपर्क करें।",
                "modal-close": "बंद करें",
                "title-overview": "करियर विवरण",
                "title-why-matches": "यह छात्र प्रोफाइल से क्यों मेल खाता है",
                "title-traits": "व्यक्तित्व लक्षण संरेखण",
                "title-pathway": "शैक्षणिक मार्ग",
                "title-fees": "कोर्स शुल्क",
                "title-income": "अपेक्षित मासिक आय",
                "title-scholarships": "छात्रवृत्तियां",
                "title-loans": "शैक्षणिक ऋण",
                "title-study": "आप कहाँ अध्ययन करेंगे?",
                "title-gov": "सरकारी संस्थान",
                "title-priv": "निजी संस्थान",
                "title-dist": "दूरी शिक्षा",
                "title-work": "आप कहाँ काम करेंगे?",
                "title-growth": "अपेक्षित विकास पथ",
                "title-skills": "कौशल विकास योजना",
                "title-example": "क्षेत्र से उदाहरण",
                "title-exams": "प्रवेश परीक्षाएं"
            },
            mr: {
                "brand-title": "SkillSense",
                "nav-how": "कसे कार्य करते",
                "nav-test": "चाचणी घ्या",
                "nav-counselor": "एआय समुपदेशक",
                "nav-contact": "संपर्क",
                "nav-start": "करिअर चाचणी सुरू करा",
                "contact-eyebrow": "चला जोडूया",
                "contact-title": "चला <span class=\"grad\">जोडूया</span>",
                "contact-lead": "तुम्ही तुमचा मार्ग शोधणारे विद्यार्थी असाल, तुमच्या शाळेत स्किलसेन्स आणू इच्छिणारे प्रशासक असाल किंवा आमच्या प्लॅटफॉर्मबद्दल काही प्रश्न असतील, आम्ही मदतीसाठी येथे आहोत.",
                "contact-info-title": "संपर्क माहिती",
                "contact-email-label": "आम्हाला ईमेल करा",
                "contact-email-sub": "आमच्या विभागांसाठी थेट संपर्क",
                "contact-hq-label": "मुख्यालय",
                "contact-phone-label": "आम्हाला कॉल करा",
                "contact-form-title": "संदेश पाठवा",
                "contact-form-sub": "आमच्या सुरक्षित प्रणालीद्वारे सुरक्षित संदेश पाठवणे.",
                "contact-name-placeholder": "पूर्ण नाव",
                "contact-email-placeholder": "ईमेल पत्ता",
                "contact-company-placeholder": "कंपनी (पर्यायी)",
                "contact-subject-placeholder": "विषय",
                "contact-msg-placeholder": "तुमचा संदेश",
                "contact-btn-text": "संदेश पाठवा",
                "hero-eyebrow": "व्यक्तिमत्त्व · एआय अंतर्दृष्टी · करिअर रोडमॅप",
                "hero-title": "तुमच्या व्यक्तिमत्त्वाशी जुळणारा<br><span class=\"12\">करिअरचा मार्ग शोधा.</span>",
                "hero-sub": "एक बुद्धिमान करिअर सोबती जो तुमच्या भविष्यासाठी वैयक्तिकृत रोडमॅप तयार करण्यासाठी तुमचे स्वारस्य, सामर्थ्य आणि उद्दिष्टे समजून घेतो.",
                "hero-start": "करिअर चाचणी सुरू करा →",
                "hero-chat": "एआय सोबत चॅट करा",
                "num-1": "६",
                "num-2": "५००+",
                "num-3": "२४/७",
                "step-num-1": "०१",
                "step-num-2": "०२",
                "step-num-3": "०३",
                "step-num-4": "०४",
                "stat-1": "व्यक्तिमत्त्व परिमाणे",
                "stat-2": "करिअरचे पर्याय",
                "stat-3": "एआय मार्गदर्शन",
                "sec-journey-eyebrow": "प्रवास",
                "sec-journey-title": "तुमच्या <span class=\"grad\">करिअर जुळणी</span>चे चार टप्पे",
                "step-1-title": "तुमची प्रोफाइल बनवा",
                "step-1-desc": "आम्हाला तुमचे नाव, वय, इयत्ता, आवडी आणि छंद सांगा - तुमचा एआय सहाय्यक तुम्हाला मार्गदर्शन करेल.",
                "step-2-title": "करिअर चाचणी खेळा",
                "step-2-desc": "झटपट कार्डे, अनुभव गुण (XP) आणि दैनंदिन सातत्य. हे एका खेळासारखे वाटते, परीक्षेसारखे नाही.",
                "step-3-title": "एआय तुमचे सामर्थ्य वाचते",
                "step-3-desc": "तुमची उत्तरे काही सेकंदात वैयक्तिकृत व्यक्तिमत्त्व आणि आवडीचे प्रोफाइल बनतात.",
                "step-4-title": "तुमचा रोडमॅप मिळवा",
                "step-4-desc": "जुळणारे करिअर, कॉलेजेस, शिष्यवृत्ती आणि पुढे जाण्याचा टप्प्याटप्प्याने मार्ग.",
                "sec-quiz-eyebrow": "करिअर शोध मूल्यमापन",
                "sec-quiz-title": "तुमच्यासाठी <span class=\"grad\">योग्य मार्ग शोधा.</span>",
                "sec-quiz-lead": "तुमच्याबद्दल सांगा आणि तुमची आवड, सामर्थ्य आणि करिअरच्या पसंती समजून घेण्यासाठी काही प्रश्नांची उत्तरे द्या.",
                "form-heading": "तुमच्याबद्दल सांगा",
                "label-name": "पूर्ण नाव *",
                "placeholder-name": "तुमचे पूर्ण नाव प्रविष्ट करा",
                "label-age": "वय *",
                "placeholder-age": "तुमचे वय प्रविष्ट करा",
                "label-class": "इयत्ता/वर्ष *",
                "option-select-class": "तुमची इयत्ता निवडा",
                "label-stream": "शिक्षण शाखा/क्षेत्र",
                "placeholder-stream": "उदा. विज्ञान, वाणिज्य, कला, अभियांत्रिकी",
                "heading-learning-profile": "तुमचे शिकण्याचे प्रोफाइल",
                "label-subjects": "तुम्हाला शिकायला आवडणारे विषय",
                "placeholder-subjects": "उदा. गणित, भौतिकशास्त्र, इंग्रजी, जीवशास्त्र, इतिहास",
                "label-weak-subjects": "तुम्हाला कठीण वाटणारे विषय",
                "placeholder-weak-subjects": "उदा. रसायनशास्त्र, सांख्यिकी, अर्थशास्त्र",
                "heading-outside-academics": "अभ्यासाबाहेर तुम्हाला कशाने प्रेरणा मिळते?",
                "label-interests": "तुमच्या आवडी",
                "placeholder-interests": "उदा. तंत्रज्ञान, संशोधन, कला, क्रीडा, समाजसेवा",
                "label-hobbies": "तुमचे छंद",
                "placeholder-hobbies": "उदा. वाचन, गेमिंग, चित्रकला, कोडिंग, बागकाम",
                "label-strengths": "तुमची नैसर्गिक ताकद",
                "placeholder-strengths": "उदा. समस्या निवारण, संवाद, नेतृत्व, सर्जनशीलता",
                "label-aspirations": "करिअरची महत्त्वाकांक्षा (असल्यास)",
                "placeholder-aspirations": "उदा. अभियंता, डॉक्टर, वैज्ञानिक, उद्योजक",
                "heading-preferences": "💼 करिअर आवडी-निवडी",
                "label-learning-mode": "पसंतीची शिकण्याची पद्धत",
                "label-budget": "बजेट पसंती",
                "label-location": "स्थान पसंती",
                "label-student-location": "पसंतीचे अभ्यास स्थान",
                "placeholder-student-location": "उदा. महाराष्ट्र, दिल्ली, कर्नाटक",
                "label-college-range": "पसंतीचा कॉलेज प्रकार/श्रेणी",
                "option-college-1": "प्रथम वर्ष कॉलेज",
                "option-college-2": "द्वितीय वर्ष कॉलेज",
                "option-college-3": "तृतीय वर्ष कॉलेज",
                "option-college-4": "चतुर्थ वर्ष कॉलेज",
                "option-graduate": "पदवीधर (Graduate)",
                "option-post-graduate": "पदव्युत्तर (Post Graduate)",
                "option-learning-offline": "ऑफलाइन (क्लासरूम/लॅब)",
                "option-learning-distance": "डिस्टन्स/ऑनलाइन लर्निंग",
                "option-learning-hybrid": "हायब्रिड (मिश्रित)",
                "option-budget-moderate": "मध्यम बजेट",
                "option-budget-sensitive": "बजेट संवेदनशील (कमी बजेट)",
                "option-budget-no-constraint": "बजेटची मर्यादा नाही",
                "option-location-india": "पूर्ण भारतात",
                "option-location-local": "स्थानिक संधी",
                "option-location-international": "आंतरराष्ट्रीय करिअर",
                "option-range-all": "सर्व कॉलेजेस (शासकीय आणि खाजगी)",
                "option-range-govt": "फक्त शासकीय कॉलेजेस",
                "option-range-private": "फक्त खाजगी कॉलेजेस",
                "option-range-distance": "फक्त डिस्टन्स लर्निंग",
                "btn-submit-profile": "करिअर चाचणीकडे जा →",
                "scale-not-me": "माझ्यासारखे नाही",
                "scale-little": "थोडं",
                "scale-maybe": "कदाचित",
                "scale-yes": "होय",
                "scale-so-me": "अगदी मीच!",
                "btn-back": "← मागे",
                "btn-next": "पुढे →",
                "btn-submit-test": "चाचणी सबमिट करा →",
                "sec-counselor-eyebrow": "वेरा एआय समुपदेशक",
                "sec-counselor-title": "काही प्रश्न आहेत? <span class=\"grad\">वेराला विचारा.</span>",
                "sec-counselor-sub": "तुमचे करिअर सामने, कॉलेज फी, प्रवेश परीक्षा किंवा पर्यायी मार्गांबद्दल काहीही विचारा.",
                "placeholder-chat": "तुमच्या करिअरचे सामने, कॉलेजेस, प्रवेश परीक्षांबद्दल नोव्हाला विचारा...",
                "btn-send": "पाठवा",
                "chat-disclaimer": "अस्वीकरण: VERA हे एआय सहाय्यक आहे. हे मार्गदर्शन केवळ माहितीच्या उद्देशाने आहे. अंतिम करिअर निर्णयांसाठी व्यावसायिक सल्लागारांचा सल्ला घ्या.",
                "modal-close": "बंद करा",
                "title-overview": "📋 करिअर विहंगावलोकन",
                "title-why-matches": "🎯 हे विद्यार्थ्याच्या प्रोफाइलशी का जुळते",
                "title-traits": "🧠 व्यक्तिमत्व वैशिष्ट्ये संरेखन",
                "title-pathway": "🎓 शैक्षणिक मार्ग (पाथवे)",
                "title-fees": "💰 कोर्स शुल्क",
                "title-income": "💵 अपेक्षित मासिक उत्पन्न",
                "title-scholarships": "🎓 शिष्यवृत्ती",
                "title-loans": "🏦 शैक्षणिक कर्ज",
                "title-study": "🏛️ तुम्ही कुठे अभ्यास कराल?",
                "title-gov": "🏛️ शासकीय संस्था",
                "title-priv": "🏢 खाजगी संस्था",
                "title-dist": "💻 दूरस्थ शिक्षण (डिस्टन्स लर्निंग)",
                "title-work": "🏢 तुम्ही कुठे काम कराल?",
                "title-growth": "📈 अपेक्षित वाढीचा मार्ग",
                "title-skills": "📚 कौशल्य विकास योजना",
                "title-example": "🌟 क्षेत्रातील उदाहरण",
                "title-exams": "📝 प्रवेश परीक्षा"
            }
        }

        const riasecQuestionsTranslations = {
            hi: {
                1: "मुझे कारों पर काम करना पसंद है",
                2: "मुझे चीजें बनाना पसंद है",
                3: "मुझे जानवरों की देखभाल करना पसंद है",
                4: "मुझे चीजों को आपस में जोड़ना या इकट्ठा करना पसंद है",
                5: "मुझे खाना बनाना पसंद है",
                6: "मैं एक व्यावहारिक व्यक्ति हूँ",
                7: "मुझे बाहर (खुले में) काम करना पसंद है",
                8: "मुझे पहेलियां सुलझाना पसंद है",
                9: "मैं स्वतंत्र रूप से काम करने में अच्छा हूँ",
                10: "मुझे प्रयोग करना पसंद है",
                11: "मुझे विज्ञान में आनंद आता है",
                12: "मुझे यह समझने में मज़ा आता है कि चीजें कैसे काम करती हैं",
                13: "मुझे चीजों (समस्याओं, स्थितियों) का विश्लेषण करना पसंद है",
                14: "मैं गणित में अच्छा हूँ",
                15: "मुझे कला और संगीत के बारे में पढ़ना पसंद है",
                16: "मुझे रचनात्मक लेखन का आनंद मिलता है",
                17: "मैं एक रचनात्मक व्यक्ति हूँ",
                18: "मुझे वाद्ययंत्र बजाना या गाना पसंद है",
                19: "मुझे नाटकों में अभिनय करना पसंद है",
                20: "मुझे चित्र बनाना पसंद है",
                21: "मुझे टीमों में काम करना पसंद है",
                22: "मुझे लोगों को पढ़ाना या प्रशिक्षित करना पसंद है",
                23: "मुझे लोगों की समस्याओं को हल करने में मदद करना पसंद है",
                24: "मुझे लोगों को स्वस्थ करने/इलाज करने में रुचि है",
                25: "मुझे अन्य संस्कृतियों के बारे में जानने में मज़ा आता है",
                26: "मुझे लोगों की मदद करना पसंद है",
                27: "मैं एक महत्वाकांक्षी व्यक्ति हूँ, मैं अपने लिए लक्ष्य निर्धारित करता हूँ",
                28: "मुझे लोगों को प्रभावित करने या मनाने की कोशिश करना पसंद है",
                29: "मुझे चीजें बेचना पसंद है",
                30: "मैं नई जिम्मेदारियां लेने में तत्पर रहता हूँ",
                31: "मैं अपना खुद का व्यवसाय शुरू करना चाहूंगा",
                32: "मुझे मुद्दों पर चर्चा करना पसंद है",
                33: "मुझे नेतृत्व करना पसंद है",
                34: "मुझे भाषण देना पसंद है",
                35: "मुझे चीजों (फाइलों, डेस्क, कार्यालयों) को व्यवस्थित करना पसंद है",
                36: "मुझे पालन करने के लिए स्पष्ट निर्देश पसंद हैं",
                37: "मुझे एक कार्यालय में प्रतिदिन 8 घंटे काम करने में कोई आपत्ति नहीं होगी",
                38: "मैं बारीकियों पर ध्यान देता हूँ",
                39: "मुझे फाइलिंग या टाइपिंग करना पसंद है",
                40: "मुझे संख्याओं या चार्ट के साथ काम करना पसंद है",
                41: "मैं अपने काम का रिकॉर्ड रखने में अच्छा हूँ",
                42: "मैं एक कार्यालय में काम करना चाहूंगा"
            },
            mr: {
                1: "मला गाड्यांवर काम करायला आवडते",
                2: "मला गोष्टी बनवायला आवडतात",
                3: "मला प्राण्यांची काळजी घ्यायला आवडते",
                4: "मला गोष्टी एकत्र जोडायला किंवा जोडणी करायला आवडते",
                5: "मला स्वयंपाक करायला आवडतो",
                6: "मी एक व्यावहारिक व्यक्ती आहे",
                7: "मला बाहेर (मोकळ्या जागेत) काम करायला आवडते",
                8: "मला कोडी सोडवायला आवडतात",
                9: "मी स्वतंत्रपणे काम करण्यात चांगला आहे",
                10: "मला प्रयोग करायला आवडतात",
                11: "मला विज्ञानात रस वाटतो",
                12: "गोष्टी कशा चालतात हे शोधण्यात मला आनंद मिळतो",
                13: "मला गोष्टींचे (समस्या, परिस्थिती) विश्लेषण करायला आवडते",
                14: "मी गणितात चांगला आहे",
                15: "मला कला आणि संगीताबद्दल वाचायला आवडते",
                16: "मला सर्जनशील लिखाणाचा आनंद मिळतो",
                17: "मी एक सर्जनशील व्यक्ती आहे",
                18: "मला वाद्ये वाजवायला किंवा गाणे गायला आवडते",
                19: "मला नाटकांमध्ये अभिनय करायला आवडते",
                20: "मला चित्रे काढायला आवडतात",
                21: "मला संघात (टीममध्ये) काम करायला आवडते",
                22: "मला लोकांना शिकवायला किंवा प्रशिक्षित करायला आवडते",
                23: "मला लोकांच्या समस्या सोडवण्यास मदत करायला आवडते",
                24: "मला लोकांना बरे करण्यात/त्यांच्यावर उपचार करण्यात रस आहे",
                25: "मला इतर संस्कृतींबद्दल जाणून घ्यायला आवडते",
                26: "मला लोकांना मदत करायला आवडते",
                27: "मी एक महत्त्वाकांक्षी व्यक्ती आहे, मी स्वतःसाठी उद्दिष्टे ठरवतो",
                28: "मला लोकांना प्रभावित किंवा पटवून देण्याचा प्रयत्न करायला आवडते",
                29: "मला गोष्टी विकायला आवडते",
                30: "मी नवीन जबाबदाऱ्या घेण्यास तत्पर असतो",
                31: "मला स्वतःचा व्यवसाय सुरू करायला आवडेल",
                32: "मला मुद्द्यांवर चर्चा करायला आवडते",
                33: "मला नेतृत्व करायला आवडते",
                34: "मला भाषणे द्यायला आवडते",
                35: "मला गोष्टी (फाईल्स, डेस्क, कार्यालये) व्यवस्थित करायला आवडते",
                36: "मला पाळण्यासाठी स्पष्ट सूचना आवडतात",
                37: "मला कार्यालयात दररोज ८ तास काम करायला काही हरकत नाही",
                38: "मी बारीक तपशीलांवर लक्ष देतो",
                39: "मला फाइलिंग किंवा टायपिंग करायला आवडते",
                40: "मला संख्या किंवा चार्ट सोबत काम करायला आवडते",
                41: "मी माझ्या कामाची नोंद ठेवण्यात चांगला आहे",
                42: "मला कार्यालयात काम करायला आवडेल"
            }
        };

        // Free Translation Helper using Google Translate public endpoint
        async function translateText(text, targetLang) {
            if (!text || targetLang === 'en') return text;
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data && data[0]) {
                    return data[0].map(x => x[0]).join('');
                }
                return text;
            } catch (e) {
                console.error('Translation error:', e);
                return text;
            }
        }

        // Get all translatable strings recursively in depth-first order
        function getTranslatableStrings(obj, collected = []) {
            if (typeof obj === 'string') {
                if (obj.trim().length > 3 || /[a-zA-Z]/.test(obj)) {
                    collected.push(obj);
                }
            } else if (Array.isArray(obj)) {
                obj.forEach(item => getTranslatableStrings(item, collected));
            } else if (obj && typeof obj === 'object') {
                const skipKeys = ['emoji', 'link', 'color', 'value', 'id', 'category', 'match_score', 'confidence', 'image', 'url', 'website', 'source', 'originalName'];
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key) && !skipKeys.includes(key)) {
                        getTranslatableStrings(obj[key], collected);
                    }
                }
            }
            return collected;
        }

        // Apply translated strings using the translation map
        function applyTranslatedStrings(obj, translationMap) {
            if (typeof obj === 'string') {
                if (obj.trim().length > 3 || /[a-zA-Z]/.test(obj)) {
                    const val = translationMap.get(obj);
                    return val !== undefined ? val : obj;
                }
                return obj;
            } else if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    obj[i] = applyTranslatedStrings(obj[i], translationMap);
                }
                return obj;
            } else if (obj && typeof obj === 'object') {
                const skipKeys = ['emoji', 'link', 'color', 'value', 'id', 'category', 'match_score', 'confidence', 'image', 'url', 'website', 'source', 'originalName'];
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key) && !skipKeys.includes(key)) {
                        obj[key] = applyTranslatedStrings(obj[key], translationMap);
                    }
                }
                return obj;
            }
            return obj;
        }

        // Production-ready dynamic batch translator (translates entire object using plain-text delimiters to guarantee 100% clean translations without HTML leaks)
        async function translateObject(obj, targetLang) {
            if (targetLang === 'en' || !obj) return obj;

            // Deep copy to avoid mutating cache
            const copy = JSON.parse(JSON.stringify(obj));

            // Collect strings
            const strings = [];
            getTranslatableStrings(copy, strings);
            if (strings.length === 0) return copy;

            // Deduplicate strings to prevent Google Translate from mangling tags on duplicate terms
            const uniqueStrings = [...new Set(strings)];

            try {
                // Process in parallel chunks of 15 strings each to ensure URL safety and avoid sequential delays
                const chunkSize = 15;
                const translatedList = new Array(uniqueStrings.length);
                const promises = [];

                for (let i = 0; i < uniqueStrings.length; i += chunkSize) {
                    promises.push((async (offset) => {
                        const chunkStrings = uniqueStrings.slice(offset, offset + chunkSize);
                        // Clean any carriage returns or existing delimiters from the text to be safe
                        const cleanedStrings = chunkStrings.map(str => str.replace(/\|\|\|/g, '').replace(/\n/g, ' '));
                        const combinedText = cleanedStrings.join(' ||| ');
                        const translatedText = await translateText(combinedText, targetLang);

                        // Split by the non-translatable delimiter with regex spacing support
                        const splitParts = translatedText.split(/\s*\|\|\|\s*/);

                        // If split matches chunk size, map them 1-to-1
                        if (splitParts.length === chunkStrings.length) {
                            for (let j = 0; j < chunkStrings.length; j++) {
                                translatedList[offset + j] = splitParts[j].trim();
                            }
                        } else {
                            // Fallback to translating sequentially if Google Translate merged or dropped separators
                            console.warn(`Delimiter count mismatch in chunk (expected ${chunkStrings.length}, got ${splitParts.length}). Falling back to sequential.`);
                            for (let j = 0; j < chunkStrings.length; j++) {
                                const idx = offset + j;
                                translatedList[idx] = await translateText(chunkStrings[j], targetLang);
                            }
                        }
                    })(i));
                }

                await Promise.all(promises);

                // Build a translation lookup map matching the original English to its translated string
                const translationMap = new Map();
                for (let i = 0; i < uniqueStrings.length; i++) {
                    translationMap.set(uniqueStrings[i], translatedList[i] || uniqueStrings[i]);
                }

                applyTranslatedStrings(copy, translationMap);
                return copy;
            } catch (e) {
                console.error('Batch translation failed, falling back to sequential:', e);
                return await translateObjectSequential(obj, targetLang);
            }
        }

        // Fallback sequential translator
        async function translateObjectSequential(obj, targetLang) {
            if (targetLang === 'en' || !obj) return obj;
            if (typeof obj === 'string') {
                if (obj.trim().length <= 3 && !/[a-zA-Z]/.test(obj)) return obj;
                return await translateText(obj, targetLang);
            }
            if (Array.isArray(obj)) {
                const translatedArray = [];
                for (const item of obj) {
                    translatedArray.push(await translateObjectSequential(item, targetLang));
                }
                return translatedArray;
            }
            if (typeof obj === 'object') {
                const translatedObj = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const skipKeys = ['emoji', 'link', 'color', 'value', 'id', 'category', 'match_score', 'confidence', 'image', 'url', 'website', 'source', 'originalName'];
                        if (skipKeys.includes(key)) {
                            translatedObj[key] = obj[key];
                        } else {
                            translatedObj[key] = await translateObjectSequential(obj[key], targetLang);
                        }
                    }
                }
                return translatedObj;
            }
            return obj;
        }

        // Helper to strip heavy, unused details (colleges list, pathway steps) before translating matched results
        function stripHeavyDetails(data) {
            if (!data) return data;
            const copy = JSON.parse(JSON.stringify(data));
            if (copy.top_careers && Array.isArray(copy.top_careers)) {
                copy.top_careers.forEach(career => {
                    // Keep track of the original English name for database retrieval
                    career.originalName = career.name;
                    if (career.data && typeof career.data === 'object') {
                        const heavyKeys = ['where_will_you_study', 'educational_pathway', 'entrance_exams', 'scholarships', 'success_stories', 'future_scope', 'growth_opportunities', 'growth_path_detail'];
                        heavyKeys.forEach(key => {
                            delete career.data[key];
                        });
                    }
                });
            }
            return copy;
        }

        async function switchLanguage(lang) {
            currentLanguage = lang;

            // Show dynamic feedback loader
            showToast(lang === 'hi' ? 'भाषा बदली जा रही है...' : lang === 'mr' ? 'भाषा बदलली जात आहे...' : 'Switching language...');

            translateStaticUI(lang);

            // Refresh quiz questions if loaded
            if (questions.length > 0) {
                showQuestion(currentQuestion);
            }

            // Re-translate and re-display dashboard results if they exist
            if (rawResultsData) {
                const lightData = stripHeavyDetails(rawResultsData);
                const translatedData = await translateObject(lightData, lang);
                displayResults(translatedData);

                // Prefetch and pre-translate full career details in background for 0ms loading time on clicks in the new language!
                prefetchCareerDetails(rawResultsData.top_careers, lang);
            }

            showToast(lang === 'hi' ? 'भाषा सफलतापूर्वक बदली गई!' : lang === 'mr' ? 'भाषा यशस्वीरित्या बदलली गेली!' : 'Language updated!');
        }

        function translateStaticUI(lang) {
            const dict = uiTranslations[lang] || uiTranslations['en'];

            // Navbar brand & links
            const brandEl = document.querySelector('.brand');
            if (brandEl) {
                brandEl.innerHTML = `<img src="/static/logo.png" alt="SkillSense Logo" class="brand-logo"> SkillSense`;
            }
            const navLinks = document.querySelectorAll('.nav-links a');
            if (navLinks.length >= 3) {
                navLinks[0].textContent = dict['nav-how'];
                navLinks[1].textContent = dict['nav-test'];
                navLinks[2].textContent = dict['nav-counselor'];
            }
            const navCta = document.querySelector('.nav-cta');
            if (navCta) navCta.textContent = dict['nav-start'];

            // Hero section
            const heroEyebrow = document.querySelector('.hero-copy .eyebrow');
            if (heroEyebrow) heroEyebrow.textContent = dict['hero-eyebrow'];

            const heroTitle = document.querySelector('.hero-copy h1');
            if (heroTitle) heroTitle.innerHTML = dict['hero-title'];

            const heroSub = document.querySelector('.hero-copy p.sub');
            if (heroSub) heroSub.textContent = dict['hero-sub'];

            const heroStartBtn = document.querySelector('.hero-cta .btn-primary');
            if (heroStartBtn) heroStartBtn.innerHTML = dict['hero-start'];

            const heroChatBtn = document.querySelector('.hero-cta .btn-ghost');
            if (heroChatBtn) heroChatBtn.textContent = dict['hero-chat'];

            const stats = document.querySelectorAll('.hero-stats .hstat .l');
            if (stats.length >= 3) {
                stats[0].textContent = dict['stat-1'];
                stats[1].textContent = dict['stat-2'];
                stats[2].textContent = dict['stat-3'];
            }

            const statsNums = document.querySelectorAll('.hero-stats .hstat .n');
            if (statsNums.length >= 3 && dict['num-1']) {
                statsNums[0].textContent = dict['num-1'];
                statsNums[1].textContent = dict['num-2'];
                statsNums[2].textContent = dict['num-3'];
            }

            // How Section
            const howEyebrow = document.querySelector('#how .sec-head .eyebrow');
            if (howEyebrow) howEyebrow.textContent = dict['sec-journey-eyebrow'];

            const howTitle = document.querySelector('#how .sec-head h2');
            if (howTitle) howTitle.innerHTML = dict['sec-journey-title'];

            const stepsList = document.querySelectorAll('#how .steps .step');
            if (stepsList.length >= 4) {
                stepsList[0].querySelector('h4').textContent = dict['step-1-title'];
                stepsList[0].querySelector('p').textContent = dict['step-1-desc'];
                stepsList[0].querySelector('.num').textContent = dict['step-num-1'] || "01";

                stepsList[1].querySelector('h4').textContent = dict['step-2-title'];
                stepsList[1].querySelector('p').textContent = dict['step-2-desc'];
                stepsList[1].querySelector('.num').textContent = dict['step-num-2'] || "02";

                stepsList[2].querySelector('h4').textContent = dict['step-3-title'];
                stepsList[2].querySelector('p').textContent = dict['step-3-desc'];
                stepsList[2].querySelector('.num').textContent = dict['step-num-3'] || "03";

                stepsList[3].querySelector('h4').textContent = dict['step-4-title'];
                stepsList[3].querySelector('p').textContent = dict['step-4-desc'];
                stepsList[3].querySelector('.num').textContent = dict['step-num-4'] || "04";
            }

            // Quiz header
            const quizEyebrow = document.querySelector('#quiz-section .sec-head .eyebrow');
            if (quizEyebrow) quizEyebrow.textContent = dict['sec-quiz-eyebrow'];

            const quizTitle = document.querySelector('#quiz-section .sec-head h2');
            if (quizTitle) quizTitle.innerHTML = dict['sec-quiz-title'];

            const quizLead = document.querySelector('#quiz-section .sec-head p.lead');
            if (quizLead) quizLead.textContent = dict['sec-quiz-lead'];

            // Profile Form Inputs
            const formHeading = document.querySelector('#profileFormContainer h3');
            if (formHeading) formHeading.textContent = dict['form-heading'];

            const labels = document.querySelectorAll('#profileForm label');
            labels.forEach(label => {
                const forAttr = label.getAttribute('for');
                if (forAttr === 'studentName') label.textContent = dict['label-name'];
                else if (forAttr === 'studentAge') label.textContent = dict['label-age'];
                else if (forAttr === 'studentClass') label.textContent = dict['label-class'];
                else if (forAttr === 'studentEducation') label.textContent = dict['label-stream'];
                else if (forAttr === 'studentSubjects') label.textContent = dict['label-subjects'];
                else if (forAttr === 'studentWeakSubjects') label.textContent = dict['label-weak-subjects'];
                else if (forAttr === 'studentInterests') label.textContent = dict['label-interests'];
                else if (forAttr === 'studentHobbies') label.textContent = dict['label-hobbies'];
                else if (forAttr === 'studentStrengths') label.textContent = dict['label-strengths'];
                else if (forAttr === 'studentAspirations') label.textContent = dict['label-aspirations'];
                else if (forAttr === 'learningMode') label.textContent = dict['label-learning-mode'];
                else if (forAttr === 'budgetPreference') label.textContent = dict['label-budget'];
                else if (forAttr === 'locationPreference') label.textContent = dict['label-location'];
                else if (forAttr === 'studentLocation') label.textContent = dict['label-student-location'];
                else if (forAttr === 'collegeRange') label.textContent = dict['label-college-range'];
            });

            // Translate select dropdown options
            const classSelect = document.getElementById('studentClass');
            if (classSelect && dict['option-select-class']) {
                for (let opt of classSelect.options) {
                    if (opt.value === "") opt.textContent = dict['option-select-class'];
                    else if (opt.value === "1st Year College") opt.textContent = dict['option-college-1'];
                    else if (opt.value === "2nd Year College") opt.textContent = dict['option-college-2'];
                    else if (opt.value === "3rd Year College") opt.textContent = dict['option-college-3'];
                    else if (opt.value === "4th Year College") opt.textContent = dict['option-college-4'];
                    else if (opt.value === "Graduate") opt.textContent = dict['option-graduate'];
                    else if (opt.value === "Post Graduate") opt.textContent = dict['option-post-graduate'];
                }
            }

            const learningSelect = document.getElementById('learningMode');
            if (learningSelect && dict['option-learning-offline']) {
                for (let opt of learningSelect.options) {
                    if (opt.value === "offline") opt.textContent = dict['option-learning-offline'];
                    else if (opt.value === "distance") opt.textContent = dict['option-learning-distance'];
                    else if (opt.value === "hybrid") opt.textContent = dict['option-learning-hybrid'];
                }
            }

            const budgetSelect = document.getElementById('budgetPreference');
            if (budgetSelect && dict['option-budget-moderate']) {
                for (let opt of budgetSelect.options) {
                    if (opt.value === "moderate") opt.textContent = dict['option-budget-moderate'];
                    else if (opt.value === "budget_sensitive") opt.textContent = dict['option-budget-sensitive'];
                    else if (opt.value === "no_constraint") opt.textContent = dict['option-budget-no-constraint'];
                }
            }

            const locationSelect = document.getElementById('locationPreference');
            if (locationSelect && dict['option-location-india']) {
                for (let opt of locationSelect.options) {
                    if (opt.value === "india") opt.textContent = dict['option-location-india'];
                    else if (opt.value === "local") opt.textContent = dict['option-location-local'];
                    else if (opt.value === "international") opt.textContent = dict['option-location-international'];
                }
            }

            const collegeSelect = document.getElementById('collegeRange');
            if (collegeSelect && dict['option-range-all']) {
                for (let opt of collegeSelect.options) {
                    if (opt.value === "all") opt.textContent = dict['option-range-all'];
                    else if (opt.value === "government") opt.textContent = dict['option-range-govt'];
                    else if (opt.value === "private") opt.textContent = dict['option-range-private'];
                    else if (opt.value === "distance") opt.textContent = dict['option-range-distance'];
                }
            }

            // Placeholders
            const studentName = document.getElementById('studentName');
            if (studentName) studentName.placeholder = dict['placeholder-name'];
            const studentAge = document.getElementById('studentAge');
            if (studentAge) studentAge.placeholder = dict['placeholder-age'];
            const studentEducation = document.getElementById('studentEducation');
            if (studentEducation) studentEducation.placeholder = dict['placeholder-stream'];
            const studentSubjects = document.getElementById('studentSubjects');
            if (studentSubjects) studentSubjects.placeholder = dict['placeholder-subjects'];
            const studentWeakSubjects = document.getElementById('studentWeakSubjects');
            if (studentWeakSubjects) studentWeakSubjects.placeholder = dict['placeholder-weak-subjects'];
            const studentInterests = document.getElementById('studentInterests');
            if (studentInterests) studentInterests.placeholder = dict['placeholder-interests'];
            const studentHobbies = document.getElementById('studentHobbies');
            if (studentHobbies) studentHobbies.placeholder = dict['placeholder-hobbies'];
            const studentStrengths = document.getElementById('studentStrengths');
            if (studentStrengths) studentStrengths.placeholder = dict['placeholder-strengths'];
            const studentAspirations = document.getElementById('studentAspirations');
            if (studentAspirations) studentAspirations.placeholder = dict['placeholder-aspirations'];
            const studentLocation = document.getElementById('studentLocation');
            if (studentLocation) studentLocation.placeholder = dict['placeholder-student-location'];

            const selectClass = document.getElementById('studentClass');
            if (selectClass && selectClass.options[0]) selectClass.options[0].textContent = dict['option-select-class'];

            const subheaders = document.querySelectorAll('#profileForm h4');
            if (subheaders.length >= 3) {
                subheaders[0].textContent = dict['heading-learning-profile'];
                subheaders[1].textContent = dict['heading-outside-academics'];
                subheaders[2].textContent = dict['heading-preferences'];
            }

            const submitBtn = document.querySelector('#profileForm button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = dict['btn-submit-profile'];

            // Quiz Scale Ratings
            const scaleBtnsText = document.querySelectorAll('#scaleButtons button .t');
            if (scaleBtnsText.length >= 5) {
                scaleBtnsText[0].textContent = dict['scale-not-me'];
                scaleBtnsText[1].textContent = dict['scale-little'];
                scaleBtnsText[2].textContent = dict['scale-maybe'];
                scaleBtnsText[3].textContent = dict['scale-yes'];
                scaleBtnsText[4].textContent = dict['scale-so-me'];
            }

            const backBtn = document.getElementById('backBtn');
            if (backBtn) backBtn.textContent = dict['btn-back'];
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.textContent = currentQuestion === questions.length - 1 
                    ? (dict['btn-submit-test'] || 'Submit Test →') 
                    : (dict['btn-next'] || 'Next →');
            }

            // Counselor Section
            const counselorEyebrow = document.querySelector('#counselor .sec-head .eyebrow');
            if (counselorEyebrow) counselorEyebrow.textContent = dict['sec-counselor-eyebrow'];
            const counselorTitle = document.querySelector('#counselor .sec-head h2');
            if (counselorTitle) counselorTitle.innerHTML = dict['sec-counselor-title'];
            const counselorSub = document.querySelector('#counselor .sec-head p.sub');
            if (counselorSub) counselorSub.textContent = dict['sec-counselor-sub'];
            const chatInput = document.getElementById('chatInput');
            if (chatInput) chatInput.placeholder = dict['placeholder-chat'];
            const chatSend = document.getElementById('chatSend');
            if (chatSend) chatSend.textContent = dict['btn-send'];
            const chatDisclaimer = document.getElementById('chatDisclaimer');
            if (chatDisclaimer) chatDisclaimer.textContent = dict['chat-disclaimer'];

            // Contact section translations
            const contactEyebrow = document.querySelector('#contact-section .sec-head .eyebrow');
            if (contactEyebrow) contactEyebrow.textContent = dict['contact-eyebrow'] || `Let's Connect`;
            
            const contactTitle = document.querySelector('#contact-section .sec-head h2');
            if (contactTitle) contactTitle.innerHTML = dict['contact-title'] || `Let's <span class="grad">Connect</span>`;
            
            const contactLead = document.querySelector('#contact-section .sec-head p');
            if (contactLead) contactLead.textContent = dict['contact-lead'] || 'Whether you are a student exploring your path, a school administrator looking to bring SkillSense to your campus, or have questions about our platform, we are here to help.';
            
            const contactInfoTitle = document.querySelector('#contact-section h4');
            if (contactInfoTitle) contactInfoTitle.textContent = dict['contact-info-title'] || 'Contact Information';
            
            const contactEmailLabel = document.querySelector('#contact-email-label');
            if (contactEmailLabel) contactEmailLabel.textContent = dict['contact-email-label'] || 'Email Us';
            
            const contactEmailSub = document.querySelector('#contact-email-sub');
            if (contactEmailSub) contactEmailSub.textContent = dict['contact-email-sub'] || 'Direct lines to our departments';
            
            const contactHqLabel = document.querySelector('#contact-hq-label');
            if (contactHqLabel) contactHqLabel.textContent = dict['contact-hq-label'] || 'Headquarters';
            
            const contactPhoneLabel = document.querySelector('#contact-phone-label');
            if (contactPhoneLabel) contactPhoneLabel.textContent = dict['contact-phone-label'] || 'Call Us';
            
            const contactFormTitle = document.querySelector('#contact-form-title');
            if (contactFormTitle) contactFormTitle.textContent = dict['contact-form-title'] || 'Send a Message';
            
            const contactFormSub = document.querySelector('#contact-form-sub');
            if (contactFormSub) contactFormSub.textContent = dict['contact-form-sub'] || 'Secure transmission through our encrypted routing system.';
            
            const contactNameInput = document.querySelector('#contact-name-input');
            if (contactNameInput) contactNameInput.placeholder = dict['contact-name-placeholder'] || 'Full Name';
            
            const contactEmailInput = document.querySelector('#contact-email-input');
            if (contactEmailInput) contactEmailInput.placeholder = dict['contact-email-placeholder'] || 'Email Address';
            
            const contactCompanyInput = document.querySelector('#contact-company-input');
            if (contactCompanyInput) contactCompanyInput.placeholder = dict['contact-company-placeholder'] || 'Company (Optional)';
            
            const contactSubjectInput = document.querySelector('#contact-subject-input');
            if (contactSubjectInput) contactSubjectInput.placeholder = dict['contact-subject-placeholder'] || 'Subject';
            
            const contactMsgInput = document.querySelector('#contact-msg-input');
            if (contactMsgInput) contactMsgInput.placeholder = dict['contact-msg-placeholder'] || 'Your Message';
            
            const contactBtn = document.querySelector('#contact-btn');
            if (contactBtn) contactBtn.innerHTML = dict['contact-btn-text'] || '✈️ Send Message';

            if (typeof navLinks !== 'undefined' && navLinks.length >= 4) {
                navLinks[3].textContent = dict['nav-contact'] || 'Contact';
            }
        }


        // ============================================================
        // CONTACT FORM SUBMISSION
        // ============================================================
        function handleContactSubmit(event) {
            event.preventDefault();
            const lang = currentLanguage || 'en';
            
            const fullname = document.getElementById('contact-name-input').value;
            const email = document.getElementById('contact-email-input').value;
            const company = document.getElementById('contact-company-input').value;
            const subject = document.getElementById('contact-subject-input').value;
            const message = document.getElementById('contact-msg-input').value;
            
            const btn = document.getElementById('contact-btn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = lang === 'mr' ? '⏳ पाठवत आहे...' : (lang === 'hi' ? '⏳ भेज रहे हैं...' : '⏳ Sending...');
            
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullname, email, company, subject, message })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const toastMsgs = {
                        en: '📩 Message sent successfully! We will get in touch soon.',
                        hi: '📩 संदेश सफलतापूर्वक भेजा गया! हम जल्द ही आपसे संपर्क करेंगे।',
                        mr: '📩 संदेश यशस्वीरित्या पाठवला! आम्ही लवकरच तुमच्याशी संपर्क साधू.'
                    };
                    showToast(toastMsgs[lang] || toastMsgs['en']);
                    event.target.reset();
                } else {
                    showToast('⚠️ ' + (data.error || 'Failed to send message.'));
                }
            })
            .catch(err => {
                console.error('Error sending message:', err);
                showToast('⚠️ ' + (lang === 'mr' ? 'कनेक्शन एरर!' : (lang === 'hi' ? 'कनेक्शन एरर!' : 'Connection error!')));
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
        }

        // ============================================================
        // THEME FUNCTIONS
        // ============================================================
        function toggleTheme() {
            const html = document.documentElement;
            const toggleBtn = document.getElementById('themeToggleBtn');
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            
            if (currentTheme === 'dark') {
                html.setAttribute('data-theme', 'light');
                if (toggleBtn) toggleBtn.textContent = '🌗';
                localStorage.setItem('theme', 'light');
                showToast('☀️ Light Theme Enabled');
            } else {
                html.setAttribute('data-theme', 'dark');
                if (toggleBtn) toggleBtn.textContent = '🌕';
                localStorage.setItem('theme', 'dark');
                showToast('🌙 Dark Theme Enabled');
            }
        }

        // ============================================================
        // INIT
        // ============================================================
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            const toggleBtn = document.getElementById('themeToggleBtn');
            if (toggleBtn) {
                toggleBtn.textContent = savedTheme === 'light' ? '🌗' : '🌕';
            }
            loadQuestions();
            observeReveals();
            window.addEventListener('scroll', () => {
                document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 30);
            });
        });

        // ============================================================
        // PROFILE FORM
        // ============================================================
        function submitProfile(event) {
            event.preventDefault();

            const name = document.getElementById('studentName').value.trim();
            const age = document.getElementById('studentAge').value.trim();
            const studentClass = document.getElementById('studentClass').value;
            const education = document.getElementById('studentEducation').value.trim();
            const subjects = document.getElementById('studentSubjects').value.trim();
            const weakSubjects = document.getElementById('studentWeakSubjects').value.trim();
            const hobbies = document.getElementById('studentHobbies').value.trim();
            const interests = document.getElementById('studentInterests').value.trim();
            const strengths = document.getElementById('studentStrengths').value.trim();
            const aspirations = document.getElementById('studentAspirations').value.trim();
            const learningMode = document.getElementById('learningMode').value;
            const budgetPreference = document.getElementById('budgetPreference').value;
            const locationPreference = document.getElementById('locationPreference').value;
            const studentLocation = document.getElementById('studentLocation').value.trim();
            const collegeRange = document.getElementById('collegeRange').value;

            if (!name || !age || !studentClass) {
                showToast('Please fill in all required fields (Name, Age, Class)');
                return;
            }

            studentInfo = {
                name: name,
                age: age,
                class: studentClass,
                education: education || 'Not specified',
                subjects: subjects || '',
                weak_subjects: weakSubjects || '',
                hobbies: hobbies || '',
                interests: interests || '',
                strengths: strengths || '',
                career_aspirations: aspirations || '',
                learning_mode: learningMode || 'offline',
                budget: budgetPreference || 'moderate',
                location: locationPreference || 'india',
                student_location: studentLocation || '',
                college_range: collegeRange || 'all'
            };

            document.getElementById('profileFormContainer').classList.remove('active');
            document.getElementById('quizContainer').classList.add('active');
            document.getElementById('quizContainer').scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (questions.length > 0) showQuestion(0);

            showToast(`Welcome ${name}! Let's start the career assessment.`);
        }

        // ============================================================
        // LOAD QUESTIONS
        // ============================================================
        async function loadQuestions() {
            try {
                const response = await fetch('/api/questions');
                const data = await response.json();
                questions = data.questions;
                if (questions.length > 0 && document.getElementById('quizContainer').classList.contains('active')) {
                    showQuestion(0);
                }
            } catch (error) {
                console.error('Error loading questions:', error);
                document.getElementById('qText').textContent = 'Error loading questions. Please refresh.';
            }
        }

        // ============================================================
        // QUIZ FUNCTIONS
        // ============================================================
        function startQuiz() {
            // Call backend to clear previous session so we start completely fresh
            try {
                fetch('/api/clear-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                }).catch(err => console.error('Error clearing session:', err));
            } catch (e) {
                console.error(e);
            }

            document.getElementById('quiz-section').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('profileFormContainer').classList.add('active');
            document.getElementById('quizContainer').classList.remove('active');
            document.getElementById('resultsContainer').classList.remove('active');
            currentQuestion = 0;
            answers = [];
            studentInfo = {};
            riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
            document.getElementById('profileForm').reset();
        }

        function showQuestion(index) {
            if (index >= questions.length) { submitQuiz(); return; }
            const q = questions[index];
            if (currentLanguage === 'hi') {
                document.getElementById('qCount').textContent = `प्रश्न ${index + 1} / ${questions.length}`;
            } else if (currentLanguage === 'mr') {
                document.getElementById('qCount').textContent = `प्रश्न ${index + 1} / ${questions.length}`;
            } else {
                document.getElementById('qCount').textContent = `Question ${index + 1} of ${questions.length}`;
            }
            updateQuizProgress();
            const icons = ['🔧', '🔬', '🎨', '🤝', '📈', '🗂️'];
            const categories = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'];
            const idx = categories.indexOf(q.category);
            document.getElementById('qIcon').textContent = idx >= 0 ? icons[idx] : '💡';
            document.getElementById('qTypeLabel').textContent = q.category;

            let questionText = q.question;
            if (currentLanguage !== 'en' && riasecQuestionsTranslations[currentLanguage]) {
                questionText = riasecQuestionsTranslations[currentLanguage][q.id] || q.question;
            }
            document.getElementById('qText').textContent = questionText;
            const selectedValue = answers[index] ? answers[index].value : null;
            updateScaleSelection(selectedValue);
            updateNavigationButtons();
            document.getElementById('qCard').style.animation = 'none';
            setTimeout(() => {
                document.getElementById('qCard').style.animation = 'qin 0.45s cubic-bezier(0.16, 0.84, 0.44, 1)';
            }, 10);
        }

        function answerQuestion(value) {
            const q = questions[currentQuestion];
            if (!q) return;
            answers[currentQuestion] = { question_id: q.id, category: q.category, value: value };
            updateScaleSelection(value);
            updateQuizProgress();
            updateNavigationButtons();
            
            // Auto-advance to the next question (or submit if it's the last)
            setTimeout(() => {
                goToNextQuestion();
            }, 300);
        }

        function updateQuizProgress() {
            const answeredCount = answers.filter(Boolean).length;
            const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
            document.getElementById('qbar').style.width = `${Math.min(progress, 100)}%`;
        }

        function updateScaleSelection(selectedValue) {
            const buttons = document.querySelectorAll('#scaleButtons button');
            buttons.forEach((btn, idx) => {
                const buttonValue = idx + 1;
                btn.classList.toggle('selected', selectedValue === buttonValue);
            });
        }

        function updateNavigationButtons() {
            const backBtn = document.getElementById('backBtn');
            const nextBtn = document.getElementById('nextBtn');
            const hasAnswer = Boolean(answers[currentQuestion]);

            if (backBtn) {
                backBtn.disabled = currentQuestion === 0;
            }

            if (nextBtn) {
                nextBtn.disabled = !hasAnswer;
                const dict = uiTranslations[currentLanguage] || uiTranslations['en'];
                nextBtn.textContent = currentQuestion === questions.length - 1 
                    ? (dict['btn-submit-test'] || 'Submit Test →') 
                    : (dict['btn-next'] || 'Next →');
            }
        }

        function goToPreviousQuestion() {
            if (currentQuestion <= 0) return;
            currentQuestion -= 1;
            showQuestion(currentQuestion);
        }

        function goToNextQuestion() {
            if (!answers[currentQuestion]) {
                showToast('Please choose an option before continuing.');
                return;
            }

            if (currentQuestion >= questions.length - 1) {
                submitQuiz();
                return;
            }

            currentQuestion += 1;
            showQuestion(currentQuestion);
        }

        function calculateRiasecScoresFromAnswers(answerList) {
            const localScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
            const categoryMap = { "Realistic": "R", "Investigative": "I", "Artistic": "A", "Social": "S", "Enterprising": "E", "Conventional": "C" };

            for (const answer of answerList) {
                if (!answer) continue;
                const code = categoryMap[answer.category];
                if (code) {
                    localScores[code] += Number(answer.value || 0);
                }
            }

            return localScores;
        }

        // ============================================================
        // SUBMIT QUIZ
        // ============================================================
        async function submitQuiz() {
            const finalAnswers = answers.filter(Boolean);
            if (finalAnswers.length !== questions.length) {
                showToast('Please answer all questions before submitting.');
                return;
            }

            riasecScores = calculateRiasecScoresFromAnswers(finalAnswers);
            const btn = document.getElementById('qCard');
            btn.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p style="color:var(--muted)">Analyzing your answers...</p></div>`;
            try {
                const response = await fetch('/api/submit-answers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        answers: finalAnswers,
                        student_info: studentInfo
                    })
                });
                const data = await response.json();

                if (!response.ok) {
                    const msg = data && data.error ? data.error : 'Failed to analyze answers. Please try again.';
                    throw new Error(msg);
                }

                if (!Array.isArray(data.top_careers)) {
                    throw new Error('Invalid server response: top_careers missing');
                }

                rawResultsData = data;
                userProfile = data.profile;
                topCareers = data.top_careers;
                // Store scores from response
                if (data.scores) {
                    riasecScores = data.scores;
                }

                const lightData = stripHeavyDetails(data);
                const translatedData = await translateObject(lightData, currentLanguage);
                displayResults(translatedData);

                // Prefetch and pre-translate full career details in background for 0ms loading time on clicks!
                prefetchCareerDetails(data.top_careers, currentLanguage);

                setTimeout(async () => {
                    let botMsg = `🎉 Great job ${studentInfo.name || 'Student'}! I've analyzed your answers and found ${Math.min((data.top_careers || []).length, 6)} career matches for you. Ask me about any of them!`;
                    if (currentLanguage !== 'en') {
                        botMsg = await translateText(botMsg, currentLanguage);
                    }
                    addChatMessage('bot', botMsg);
                }, 500);
            } catch (error) {
                console.error('Error submitting answers:', error);
                btn.innerHTML = `<div style="text-align:center;padding:20px"><p style="color:var(--coral)">${error.message || 'Error analyzing your answers. Please try again.'}</p><button class="btn btn-primary" onclick="startQuiz()">Retry</button></div>`;
            }
        }

        // ============================================================
        // FORMAT HELPERS
        // ============================================================
        function formatCourseFee(fee, isPreview = false) {
            if (!fee) return 'Information not available';
            if (typeof fee === 'string') return fee;
            if (typeof fee === 'object') {
                // If it's a simple flat fee object
                if (fee.minimum_inr != null && fee.maximum_inr != null) {
                    let text = `₹${fee.minimum_inr.toLocaleString()} - ₹${fee.maximum_inr.toLocaleString()}`;
                    if (!isPreview) {
                        if (fee.course_type) text += ` (${fee.course_type})`;
                        if (fee.note) text += ` — ${fee.note}`;
                    }
                    return text;
                }
                if (fee.amount != null) return `₹${fee.amount.toLocaleString()}`;
                if (fee.fee_range) {
                    let text = fee.fee_range;
                    if (isPreview) {
                        text = text.replace(/\(approximate\)/gi, '').trim();
                    }
                    return text;
                }
                if (fee.range) return fee.range;
                if (fee.minimum_inr != null) return `₹${fee.minimum_inr.toLocaleString()}`;
                if (fee.maximum_inr != null) return `₹${fee.maximum_inr.toLocaleString()}`;

                // Check for nested course levels (undergraduate, postgraduate, etc.)
                const courseLevels = ['undergraduate', 'postgraduate', 'diploma', 'certificate', 'phd', 'graduate', 'doctorate'];
                let hasLevels = false;
                let levelsText = [];
                let note = fee.note || '';

                let minFee = null;
                let maxFee = null;

                for (const [key, value] of Object.entries(fee)) {
                    if (courseLevels.includes(key.toLowerCase()) && typeof value === 'object' && value !== null) {
                        hasLevels = true;

                        if (value.minimum_inr != null) {
                            if (minFee === null || value.minimum_inr < minFee) minFee = value.minimum_inr;
                        }
                        if (value.maximum_inr != null) {
                            if (maxFee === null || value.maximum_inr > maxFee) maxFee = value.maximum_inr;
                        }

                        if (!isPreview) {
                            let valText = '';
                            if (value.minimum_inr != null && value.maximum_inr != null) {
                                valText = `₹${value.minimum_inr.toLocaleString()} - ₹${value.maximum_inr.toLocaleString()}`;
                            } else if (value.minimum_inr != null) {
                                valText = `₹${value.minimum_inr.toLocaleString()}+`;
                            } else if (value.maximum_inr != null) {
                                valText = `Up to ₹${value.maximum_inr.toLocaleString()}`;
                            } else if (value.amount != null) {
                                valText = `₹${value.amount.toLocaleString()}`;
                            } else if (value.range) {
                                valText = value.range;
                            } else {
                                valText = 'N/A';
                            }

                            if (value.duration) {
                                valText += ` (${value.duration})`;
                            }

                            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                            levelsText.push(`${capitalizedKey}: ${valText}`);
                        }
                    }
                }

                if (isPreview && hasLevels) {
                    if (minFee !== null && maxFee !== null) {
                        return `₹${minFee.toLocaleString()} - ₹${maxFee.toLocaleString()}`;
                    } else if (minFee !== null) {
                        return `₹${minFee.toLocaleString()}+`;
                    } else if (maxFee !== null) {
                        return `Up to ₹${maxFee.toLocaleString()}`;
                    }
                }

                if (hasLevels && !isPreview) {
                    let result = levelsText.join(' • ');
                    if (note) result += ` (${note})`;
                    return result;
                }

                // If no specific levels matched but it has sub-objects, convert them cleanly
                let genericPairs = [];
                for (const [key, value] of Object.entries(fee)) {
                    if (key === 'note') continue;
                    const capitalizedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    if (typeof value === 'object' && value !== null) {
                        if (value.minimum_inr != null) {
                            if (minFee === null || value.minimum_inr < minFee) minFee = value.minimum_inr;
                        }
                        if (value.maximum_inr != null) {
                            if (maxFee === null || value.maximum_inr > maxFee) maxFee = value.maximum_inr;
                        }

                        if (!isPreview) {
                            let innerText = '';
                            if (value.minimum_inr != null && value.maximum_inr != null) {
                                innerText = `₹${value.minimum_inr.toLocaleString()} - ₹${value.maximum_inr.toLocaleString()}`;
                            } else if (value.amount != null) {
                                innerText = `₹${value.amount.toLocaleString()}`;
                            } else if (value.range) {
                                innerText = value.range;
                            } else {
                                innerText = JSON.stringify(value);
                            }
                            if (value.duration) innerText += ` (${value.duration})`;
                            genericPairs.push(`${capitalizedKey}: ${innerText}`);
                        }
                    } else if (!isPreview) {
                        genericPairs.push(`${capitalizedKey}: ${value}`);
                    }
                }

                if (isPreview) {
                    if (minFee !== null && maxFee !== null) {
                        return `₹${minFee.toLocaleString()} - ₹${maxFee.toLocaleString()}`;
                    } else if (minFee !== null) {
                        return `₹${minFee.toLocaleString()}+`;
                    } else if (maxFee !== null) {
                        return `Up to ₹${maxFee.toLocaleString()}`;
                    }
                    const firstVal = Object.values(fee)[0];
                    if (firstVal && typeof firstVal !== 'object') return String(firstVal);
                    return 'Contact Institute';
                }

                if (genericPairs.length > 0) {
                    let result = genericPairs.join(' • ');
                    if (note) result += ` (${note})`;
                    return result;
                }

                return JSON.stringify(fee);
            }
            return 'Information not available';
        }

        function formatIncome(income) {
            if (!income) return { text: 'Information not available', source: null };
            if (typeof income === 'string') return { text: income, source: null };
            let text = 'Information not available';
            const min = income.minimum_monthly_salary || income.minimum_salary;
            const max = income.maximum_monthly_salary || income.maximum_salary;
            const range = income.range || income.salary_range || income.annual_salary;
            if (min && max) {
                text = `${min} - ${max} per month`;
            } else if (min) {
                text = `${min} per month`;
            } else if (max) {
                text = `${max} per month`;
            } else if (range) {
                text = range;
            }
            return { text: text, source: income.source || null };
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function hasRenderableValue(value) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'boolean') return true;
            if (typeof value === 'number') return true;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return Object.keys(value).length > 0;
            return false;
        }

        function renderStructuredValue(value, depth = 0) {
            if (!hasRenderableValue(value)) {
                return '<div class="list-item">Information not available</div>';
            }
            if (typeof value === 'string') {
                return `<div class="list-item">${escapeHtml(value)}</div>`;
            }
            if (typeof value === 'number' || typeof value === 'boolean') {
                return `<div class="list-item">${escapeHtml(String(value))}</div>`;
            }
            if (Array.isArray(value)) {
                if (value.length === 0) return '<div class="list-item">Information not available</div>';
                return value.map(item => `<div style="margin-left:${depth * 8}px">${renderStructuredValue(item, depth)}</div>`).join('');
            }
            if (typeof value === 'object') {
                const entries = Object.entries(value).filter(([, entryValue]) => hasRenderableValue(entryValue));
                if (entries.length === 0) return '<div class="list-item">Information not available</div>';
                return entries.map(([entryKey, entryValue]) => `
                    <div style="margin-left:${depth * 8}px; margin-bottom: 6px;">
                        <strong style="color:var(--ink)">${escapeHtml(entryKey.replace(/_/g, ' '))}</strong>
                        <div style="margin-top:4px">${renderStructuredValue(entryValue, depth + 1)}</div>
                    </div>
                `).join('');
            }
            return `<div class="list-item">${escapeHtml(String(value))}</div>`;
        }

        function summarizeValue(value) {
            if (!hasRenderableValue(value)) return 'N/A';
            if (typeof value === 'string') return value;
            if (typeof value === 'number' || typeof value === 'boolean') return String(value);
            if (Array.isArray(value)) {
                if (value.length === 0) return 'N/A';
                return value.slice(0, 3).map(item => summarizeValue(item)).filter(Boolean).join(' • ');
            }
            if (typeof value === 'object') {
                const entries = Object.entries(value).filter(([, entryValue]) => hasRenderableValue(entryValue));
                if (entries.length === 0) return 'N/A';
                return entries.slice(0, 3).map(([key, entryValue]) => `${key.replace(/_/g, ' ')}: ${summarizeValue(entryValue)}`).join(' • ');
            }
            return 'N/A';
        }

        function getEmojiForCareer(name) {
            const keywords = {
                'engineer': '⚙️', 'engineering': '⚙️',
                'developer': '💻', 'programmer': '💻', 'coder': '💻',
                'scientist': '🔬', 'research': '🔬', 'researcher': '🔬',
                'doctor': '👨‍⚕️', 'physician': '👨‍⚕️', 'medical': '🏥',
                'nurse': '👩‍⚕️', 'health': '🏥',
                'teacher': '👨‍🏫', 'professor': '👨‍🏫', 'educator': '👨‍🏫',
                'designer': '🎨', 'artist': '🎨', 'creative': '🎨',
                'manager': '📊', 'executive': '📊',
                'analyst': '📈', 'data': '📊',
                'lawyer': '⚖️', 'legal': '⚖️', 'judge': '⚖️',
                'pilot': '✈️', 'aircraft': '✈️',
                'architect': '🏗️', 'builder': '🏗️',
                'accountant': '💰', 'finance': '💰',
                'marketing': '📣', 'sales': '📣',
                'social': '🤝', 'counselor': '🤝',
                'police': '👮', 'security': '👮', 'defense': '🛡️',
                'agriculture': '🌾', 'farmer': '🌾',
                'sports': '🏅', 'athlete': '🏅',
                'music': '🎵', 'musician': '🎵',
                'writer': '✍️', 'journalist': '✍️',
                'photographer': '📷',
                'chef': '🍳', 'culinary': '🍳',
                'veterinarian': '🐾', 'animal': '🐾',
                'psychologist': '🧠', 'psychiatrist': '🧠',
                'physiotherapist': '💪', 'fitness': '💪',
                'dietitian': '🥗', 'nutrition': '🥗',
                'dentist': '🦷', 'dental': '🦷',
                'pharmacist': '💊', 'pharmacy': '💊',
                'leather': '🧵', 'textile': '🧵',
                'aeronautical': '✈️', 'aerospace': '🚀'
            };
            const lower = name.toLowerCase();
            for (const [key, emoji] of Object.entries(keywords)) {
                if (lower.includes(key)) return emoji;
            }
            return '🚀';
        }

        // ============================================================
        // CREATE TRAIT TAG WITH MODAL POPUP
        // ============================================================
        function createTraitTag(trait) {
            const traitInfo = TRAIT_DESCRIPTIONS[trait] || {
                title: trait,
                description: `${trait} is one of your key personality traits.`,
                example: `Example: This trait influences how you learn, work, and interact with others.`
            };

            const tag = document.createElement('span');
            tag.className = 'trait-tag';
            tag.textContent = trait;

            tag.addEventListener('click', function (e) {
                e.stopPropagation();
                showTraitDetailModal(trait, traitInfo);
            });

            return tag;
        }

        // ============================================================
        // SHOW TRAIT DETAIL MODAL
        // ============================================================
        function showTraitDetailModal(traitName, traitInfo) {
            const modal = document.createElement('div');
            modal.className = 'trait-modal-overlay';
            modal.innerHTML = `
                <div class="trait-modal glass">
                    <div class="modal-header">
                        <h3>🧠 ${traitInfo.title}</h3>
                        <button class="modal-close" onclick="this.closest('.trait-modal-overlay').remove();document.body.style.overflow=''">✕</button>
                    </div>
                    <div class="trait-description">${traitInfo.description}</div>
                    <div class="trait-example">${traitInfo.example}</div>
                </div>
            `;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.style.overflow = '';
                }
            });
        }

        // ============================================================
        // UPDATE SCORE BARS
        // ============================================================
        function updateScoreBars(scores) {
            const maxScore = 35;
            const barIds = {
                'R': { bar: 'scoreBarR', val: 'scoreValR' },
                'I': { bar: 'scoreBarI', val: 'scoreValI' },
                'A': { bar: 'scoreBarA', val: 'scoreValA' },
                'S': { bar: 'scoreBarS', val: 'scoreValS' },
                'E': { bar: 'scoreBarE', val: 'scoreValE' },
                'C': { bar: 'scoreBarC', val: 'scoreValC' }
            };

            for (const [key, value] of Object.entries(scores)) {
                const percentage = Math.round((value / maxScore) * 100);
                if (barIds[key]) {
                    const bar = document.getElementById(barIds[key].bar);
                    const val = document.getElementById(barIds[key].val);
                    if (bar) bar.style.width = `${Math.min(percentage, 100)}%`;
                    if (val) val.textContent = `${Math.min(percentage, 100)}%`;
                }
            }
        }

        // ============================================================
        // DISPLAY RESULTS
        // ============================================================
        function displayResults(data) {
            document.getElementById('quizContainer').classList.remove('active');
            document.getElementById('resultsContainer').classList.add('active');

            const profile = data.profile;
            const student = profile.student_info || {};

            // Update Student Profile Card
            document.getElementById('studentProfileCard').classList.add('active');
            document.getElementById('profileAvatar').textContent = student.name ? student.name.charAt(0).toUpperCase() : '🧑';
            document.getElementById('profileName').textContent = student.name || 'Student';
            document.getElementById('profileAge').textContent = student.age ? `Age: ${student.age}` : 'Age: --';
            document.getElementById('profileClass').textContent = student.class ? `Class: ${student.class}` : 'Class: --';
            document.getElementById('profileEducation').textContent = student.education ? `Stream: ${student.education}` : 'Stream: --';
            document.getElementById('profileHobbies').textContent = student.hobbies ? `Hobbies: ${student.hobbies}` : 'Hobbies: --';
            document.getElementById('profileSubjects').textContent = student.subjects ? `Subjects: ${student.subjects}` : 'Subjects: --';

            // RIASEC Code
            document.getElementById('profileRiasecCode').textContent = profile.riasec_code || '---';

            // Update Score Bars
            if (data.scores) {
                updateScoreBars(data.scores);
            } else if (riasecScores) {
                updateScoreBars(riasecScores);
            }

            // Traits with click to open modal
            const traitsContainer = document.getElementById('profileTraits');
            traitsContainer.innerHTML = '';
            if (profile.traits && profile.traits.length > 0) {
                profile.traits.slice(0, 6).forEach(trait => {
                    const tag = createTraitTag(trait);
                    traitsContainer.appendChild(tag);
                });
            }

            document.getElementById('profileDescription').textContent =
                `${profile.primary} · ${profile.secondary} · ${profile.tertiary}`;

            const container = document.getElementById('careerResults');
            if (data.top_careers && data.top_careers.length > 0) {
                const topSix = data.top_careers.slice(0, 6);
                let html = `
                    <div style="text-align:center;margin-bottom:16px">
                        <p style="color:var(--cyan);font-weight:600">🎯 Top ${topSix.length} Career Matches for You</p>
                    </div>
                    <div class="career-grid">
                `;
                topSix.forEach((career, index) => {
                    const c = career.data;
                    const emoji = c.emoji || getEmojiForCareer(career.name);
                    const income = formatIncome(c.expected_income);
                    const fee = formatCourseFee(c.course_fee, true);
                    const growth = c.growth_path || c.expected_growth_path || [];
                    const growthText = Array.isArray(growth) && growth.length > 0 ? growth.slice(0, 2).join(' → ') : 'N/A';
                    const traits = c.personality_traits || [];
                    const traitText = Array.isArray(traits) && traits.length > 0 ? traits.slice(0, 2).join(', ') : 'N/A';

                    // Compute matching colleges
                    let matchedCollegesCount = 0;
                    const studentLocVal = studentInfo.student_location ? studentInfo.student_location.trim().toLowerCase() : '';
                    if (studentLocVal && c.where_will_you_study) {
                        const study = c.where_will_you_study;
                        const gov = study.government_institutes || study.government || [];
                        const priv = study.private_institutes || study.private || [];
                        const dist = study.distance_learning || [];

                        [gov, priv, dist].forEach(list => {
                            if (Array.isArray(list)) {
                                list.forEach(inst => {
                                    let instLoc = '';
                                    if (typeof inst === 'string') instLoc = inst.toLowerCase();
                                    else if (inst && typeof inst === 'object') instLoc = (inst.location || '').toLowerCase();

                                    if (instLoc && instLoc.includes(studentLocVal)) {
                                        matchedCollegesCount++;
                                    }
                                });
                            }
                        });
                    }

                    let badgeHtml = '';
                    if (studentLocVal) {
                        if (matchedCollegesCount > 0) {
                            badgeHtml = `<span class="tag tag-cyan" style="font-size: 0.72rem; padding: 2px 8px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0, 200, 83, 0.1); border-color: rgba(0, 200, 83, 0.3); color: #00e676; border-radius: 4px; font-weight: 600;">📍 ${matchedCollegesCount} in ${studentInfo.student_location}</span>`;
                        }
                    }

                    html += `
                        <div class="career-card" onclick="viewFullCareerDetail('${(career.originalName || career.name).replace(/'/g, "\\'")}')">
                            <div class="top">
                                <span class="rank">${emoji} #${index + 1}</span>
                                ${badgeHtml}
                            </div>
                            <h4>${career.name}</h4>
                            <p class="career-desc">${c.description || 'No description available'}</p>
                            
                            <div class="cstats-grid">
                                <div class="cstat-box">
                                    <div class="lbl-row">
                                        <span class="icon">💵</span>
                                        <span class="lbl">Salary</span>
                                    </div>
                                    <div class="val" title="${income.text}">${income.text}</div>
                                </div>
                                <div class="cstat-box">
                                    <div class="lbl-row">
                                        <span class="icon">🎓</span>
                                        <span class="lbl">Fee</span>
                                    </div>
                                    <div class="val" title="${fee}">${fee}</div>
                                </div>
                            </div>

                            <div class="cstats-list-full">
                                <div class="cstat-row-full">
                                    <span class="icon">🧠</span>
                                    <div class="info">
                                        <span class="lbl">Matching Traits</span>
                                        <div class="val" title="${traitText}">${traitText}</div>
                                    </div>
                                </div>
                                <div class="cstat-row-full">
                                    <span class="icon">📈</span>
                                    <div class="info">
                                        <span class="lbl">Growth Path</span>
                                        <div class="val" title="${growthText}">${growthText}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                                <span>Click for full details →</span>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = `<div style="text-align:center;padding:40px"><p style="color:var(--muted)">No career matches found. Try the assessment again.</p><button class="btn btn-primary" onclick="startQuiz()">Retake Test</button></div>`;
            }

            showToast('✨ Results ready! Scroll down to see your matches.');
            
            // Trigger LinkedIn Share Modal after 5 seconds
            setTimeout(() => {
                if (document.getElementById('resultsContainer').classList.contains('active')) {
                    showLinkedInShareModal(data);
                }
            }, 5000);
        }

        // ============================================================
        // DOWNLOAD CAREER GUIDE AS PDF
        // ============================================================
        
        // ============================================================
        // SHOW DYNAMIC LINKEDIN SHARE POPUP (AUTOMATIC AFTER 5S)
        // ============================================================
        function showLinkedInShareModal(data) {
            if (!data) return;
            const profile = data.profile || {};
            const student = profile.student_info || {};
            
            const studentName = student.name || 'Student';
            const studentHashtag = studentName.replace(/\s+/g, '');
            
            const traits = profile.traits || [];
            const traitListText = traits.slice(0, 3).join(', ');
            
            let mbti = 'INFP';
            const code = profile.riasec_code || 'ISA';
            const mbtiMap = {
                'R': 'ISTP', 'I': 'INTP', 'A': 'INFP', 'S': 'ENFJ', 'E': 'ENTJ', 'C': 'ISTJ'
            };
            if (code && code.length > 0) {
                mbti = mbtiMap[code[0]] || 'INFP';
            }
            
            const topCareers = data.top_careers || [];
            const careerHashtags = topCareers.slice(0, 3).map(c => `#${c.name.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
            
            let careersText = '';
            topCareers.slice(0, 6).forEach((c, idx) => {
                careersText += `${idx + 1}️⃣ ${c.name}
`;
            });
            
            const dynamicMessage = `${studentName} is a ${traitListText.toLowerCase()} individual with hobbies like ${student.hobbies || 'learning'} and interests in ${student.interests || 'technology'}. Based on their profile, they are highly aligned with careers like ${topCareers.slice(0, 3).map(c => c.name).join(', ')}.`;
            
            const postText = `🌟 Let's Connect! My SkillSense Career Assessment Results! 🚀

` +
                `${dynamicMessage}

` +
                `🧠 Key Traits: ${traitListText}
` +
                `📊 Personality Code: ${profile.riasec_code || '---'}

` +
                `🎯 Top Recommended Careers:
${careersText}
` +
                `Explore your path at https://careerguide.aisense.co.in!

` +
                `#VitalsAndVectors #SkillSense #CareerGuidance #AIGuidance #${studentHashtag} ${careerHashtags}`;

            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'linkedinShareModal';
            modalOverlay.className = 'trait-modal-overlay';
            
            modalOverlay.innerHTML = `
                <div class="trait-modal glass" style="max-width: 900px; width: 90%; padding: 28px; border: 1px solid rgba(255,255,255,0.12); text-align: left;">
                    <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h3 style="margin:0; font-size:1.4rem; display:flex; align-items:center; gap:8px;">
                            <span style="font-size:1.6rem">🌟</span> Share Your Achievement!
                        </h3>
                        <button class="modal-close" onclick="this.closest('.trait-modal-overlay').remove();" style="background:none; border:none; color:var(--muted); font-size:1.2rem; cursor:pointer;">✕</button>
                    </div>
                    
                    <div style="display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start;">
                        <!-- Left: Card Preview Container (Fixed width for perfect canvas compile) -->
                        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column; align-items: center;">
                            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Preview Card</div>
                            
                            <!-- Shareable Card Element -->
                            <div id="shareableCardElement" style="
                                width: 380px;
                                padding: 24px;
                                border-radius: 16px;
                                background-color: #0b0f24;
                                background: linear-gradient(135deg, #120e36 0%, #070913 100%);
                                border: 1px solid rgba(0, 212, 255, 0.2);
                                box-shadow: 0 15px 30px rgba(0,0,0,0.4);
                                font-family: 'Inter', system-ui, sans-serif;
                                color: #fff;
                                position: relative;
                                overflow: hidden;
                                box-sizing: border-box;
                            ">
                                <!-- Glowing backgrounds (html2canvas safe) -->
                                <div style="position: absolute; top: -10%; left: -10%; width: 180px; height: 180px; background: rgba(109, 74, 255, 0.15); border-radius: 50%; filter: blur(40px); pointer-events: none;"></div>
                                <div style="position: absolute; bottom: -10%; right: -10%; width: 180px; height: 180px; background: rgba(0, 212, 255, 0.1); border-radius: 50%; filter: blur(40px); pointer-events: none;"></div>

                                <!-- Card Header -->
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 16px; position: relative; z-index: 2;">
                                    <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 1.05rem; color: #00D4FF; letter-spacing: 0.02em;">
                                        🚀 SkillSense
                                    </div>
                                    <div style="font-size: 0.65rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600;">
                                        AI Career Assessment
                                    </div>
                                </div>

                                <!-- Student profile info -->
                                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px; position: relative; z-index: 2;">
                                    <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #6D4AFF, #00D4FF); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; color: #fff; box-shadow: 0 0 15px rgba(109, 74, 255, 0.35);">
                                        ${studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 1.12rem; font-weight: 700; color: #fff; letter-spacing: -0.01em;">${studentName}</h4>
                                        <div style="font-size: 0.78rem; color: #9AA6CC; margin-top: 2px; display: flex; gap: 8px;">
                                            <span>🧠 Code: <b>${profile.riasec_code || '---'}</b></span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Hobbies & Interests Row -->
                                <div style="display: flex; gap: 16px; margin-bottom: 14px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; position: relative; z-index: 2;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.62rem; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 700; margin-bottom: 3px;">Hobbies</div>
                                        <div style="color: rgba(255,255,255,0.85); font-size: 0.75rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${student.hobbies || '---'}</div>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.62rem; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 700; margin-bottom: 3px;">Interests</div>
                                        <div style="color: rgba(255,255,255,0.85); font-size: 0.75rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${student.interests || '---'}</div>
                                    </div>
                                </div>

                                <!-- Traits list -->
                                <div style="margin-bottom: 16px; position: relative; z-index: 2;">
                                    <div style="font-size: 0.65rem; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 700; margin-bottom: 8px;">Key Personality Traits</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                        ${traits.slice(0, 3).map(t => '<span style="background: rgba(109, 74, 255, 0.1); border: 1px solid rgba(109, 74, 255, 0.2); color: #9AA6CC; font-size: 0.72rem; font-weight: 600; padding: 4px 8px; border-radius: 12px; white-space: nowrap;">' + t + '</span>').join('')}
                                    </div>
                                </div>

                                <!-- Top careers lists -->
                                <div style="margin-bottom: 20px; position: relative; z-index: 2;">
                                    <div style="font-size: 0.65rem; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.45); font-weight: 700; margin-bottom: 8px;">Top Career Mappings</div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                        ${topCareers.slice(0, 6).map((c, idx) => '<div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 8px; display: flex; align-items: center; justify-content: flex-start; gap: 4px;"><span style="font-size: 0.78rem; font-weight: 600; color: #fff; white-space: normal; line-height: 1.2;">' + (idx + 1) + '. ' + c.name + '</span></div>').join('')}
                                    </div>
                                </div>

                                <!-- Footer branding -->
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}; padding-top: 12px; position: relative; z-index: 2;">
                                    <div style="font-size: 0.68rem; color: ${window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'}; font-weight: 500;">
                                        Explore at <b>careerguide.aisense.co.in</b>
                                    </div>
                                    <div style="font-size: 0.62rem; color: #00D4FF; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
                                        🤖 VERA — AI Counselor
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Actions & Copier -->
                        <div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column; justify-content: space-between; align-self: stretch;">
                            <div>
                                <p style="font-size:0.92rem; color:var(--muted); margin: 0 0 16px 0; line-height:1.45;">
                                    Congratulations! We've designed a custom **SkillSense Career Card** showing your results. Download your image card and copy the post details to share on LinkedIn.
                                </p>
                                
                                <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Post Text Template</div>
                                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px; margin-bottom: 18px; max-height: 160px; overflow-y: auto;">
                                    <pre id="sharePostText" style="white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; color: var(--text); margin: 0; line-height:1.45;">${postText}</pre>
                                </div>
                            </div>
                            
                            <div style="display:flex; gap:10px; flex-wrap: wrap; justify-content: flex-end; margin-top: 12px;">
                                <button id="downloadCardBtn" class="btn" style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.25); color: #00D4FF; padding: 10px 16px; font-weight: 600; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px; transition: all 0.2s;">
                                    💾 Download Card
                                </button>
                                <button id="copyPostBtn" class="btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: var(--text); padding: 10px 16px; font-weight: 500; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px; transition: all 0.2s;">
                                    📂 Copy Post
                                </button>
                                <button id="linkedinGoBtn" class="btn btn-primary" style="padding: 10px 18px; font-weight: 600; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px; transition: all 0.2s;">
                                    🔗 Share on LinkedIn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalOverlay);
            
            const downloadBtn = modalOverlay.querySelector('#downloadCardBtn');
            downloadBtn.addEventListener('click', function() {
                const card = document.getElementById('shareableCardElement');
                downloadBtn.innerHTML = '⏳ Generating...';
                downloadBtn.disabled = true;
                
                html2canvas(card, {
                    backgroundColor: '#0b0f24',
                    scale: 2,
                    logging: false,
                    useCORS: true
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `${studentName.replace(/\s+/g, '_')}_SkillSense_Assessment.png`;
                    link.href = imgData;
                    link.click();
                    
                    downloadBtn.innerHTML = '💾 Download Card';
                    downloadBtn.disabled = false;
                    showToast('🎉 Card image downloaded successfully!');
                }).catch(err => {
                    console.error('Failed to generate card image:', err);
                    downloadBtn.innerHTML = '💾 Download Card';
                    downloadBtn.disabled = false;
                    showToast('⚠️ Failed to generate card image.');
                });
            });
            
            const copyBtn = modalOverlay.querySelector('#copyPostBtn');
            copyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(postText).then(() => {
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.background = 'rgba(0, 200, 83, 0.15)';
                    copyBtn.style.borderColor = 'rgba(0, 200, 83, 0.4)';
                    copyBtn.style.color = '#00e676';
                    showToast('📝 Post copied to clipboard!');
                    setTimeout(() => {
                        copyBtn.innerHTML = '📂 Copy Post';
                        copyBtn.style.background = 'rgba(255,255,255,0.08)';
                        copyBtn.style.borderColor = 'rgba(255,255,255,0.15)';
                        copyBtn.style.color = 'var(--text)';
                    }, 2000);
                });
            });
            
            const goBtn = modalOverlay.querySelector('#linkedinGoBtn');
            goBtn.addEventListener('click', function() {
                const card = document.getElementById('shareableCardElement');
                const originalText = goBtn.innerHTML;
                
                // Open window synchronously to avoid popup blocker
                const newWindow = window.open('about:blank', '_blank');
                newWindow.document.write('<html><body style="background:#120e36;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;"><h2>⏳ Generating Career Card...<br><span style="font-size:1rem;font-weight:normal;opacity:0.7">Please wait while we prepare your post.</span></h2></body></html>');
                
                goBtn.innerHTML = '⏳ Preparing post...';
                goBtn.disabled = true;

                html2canvas(card, {
                    backgroundColor: '#0b0f24',
                    scale: 2,
                    logging: false,
                    useCORS: true
                }).then(canvas => {
                    canvas.toBlob(blob => {
                        const formData = new FormData();
                        formData.append('file', blob, 'career_card.png');
                        
                        fetch('/api/upload-image', {
                            method: 'POST',
                            body: formData
                        }).then(res => res.json()).then(data => {
                            if(data.status !== 'success') throw new Error("Upload failed");
                            const fileUrl = data.data.url;
                            const baseText = document.getElementById('sharePostText').innerText;
                            const finalPostText = baseText + `\n\nCareer Card: ${fileUrl}`;
                            const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(finalPostText)}`;
                            
                            newWindow.location.href = shareUrl;
                            
                            goBtn.innerHTML = originalText;
                            goBtn.disabled = false;
                        }).catch(err => {
                            console.error('Upload failed', err);
                            newWindow.close();
                            showToast('⚠️ Failed to upload image for sharing.');
                            goBtn.innerHTML = originalText;
                            goBtn.disabled = false;
                        });
                    }, 'image/png');
                }).catch(err => {
                    console.error('Canvas generation failed', err);
                    newWindow.close();
                    showToast('⚠️ Failed to generate card.');
                    goBtn.innerHTML = originalText;
                    goBtn.disabled = false;
                });
            });
        }

        // ============================================================
        // FEEDBACK REQUIRED BEFORE DOWNLOAD
        // ============================================================
        const careerFeedbackSubmitted = {};

        function showDownloadFeedbackModal(career) {
            const careerName = career.career_name || career.name;
            const lang = currentLanguage || 'en';
            
            const labels = {
                en: {
                    title: "Feedback Required",
                    sub: `To download the guide for <b>${careerName}</b>, please let us know if this career matches your interests:`,
                    yes: "👍 Yes, it matches!",
                    no: "👎 No, it doesn't match",
                    saving: "Saving feedback..."
                },
                hi: {
                    title: "फीडबैक आवश्यक है",
                    sub: `<b>${careerName}</b> का गाइड डाउनलोड करने के लिए, कृपया बताएं कि क्या यह करियर आपकी पसंद से मेल खाता है:`,
                    yes: "👍 हाँ, यह मेल खाता है!",
                    no: "👎 नहीं, यह मेल नहीं खाता",
                    saving: "फीडबैक सहेज रहे हैं..."
                },
                mr: {
                    title: "फीडबॅक आवश्यक आहे",
                    sub: `<b>${careerName}</b> चे मार्गदर्शक डाउनलोड करण्यासाठी, कृपया सांगा की हे करिअर तुमच्या आवडीशी जुळते का:`,
                    yes: "👍 होय, हे जुळते!",
                    no: "👎 नाही, हे जुळत नाही",
                    saving: "फीडबॅक जतन करत आहे..."
                }
            };
            
            const l = labels[lang] || labels['en'];
            
            const overlay = document.createElement('div');
            overlay.id = 'downloadFeedbackModal';
            overlay.className = 'trait-modal-overlay';
            overlay.style.zIndex = '999999';
            
            overlay.innerHTML = `
                <div class="trait-modal glass" style="max-width: 450px; padding: 28px; border: 1px solid rgba(255,255,255,0.12); text-align: center;">
                    <div style="font-size: 2.8rem; margin-bottom: 12px;">📊</div>
                    <h3 style="margin: 0 0 12px 0; font-size: 1.4rem; font-weight:600;">${l.title}</h3>
                    <p style="font-size: 0.95rem; color: var(--muted); line-height: 1.5; margin-bottom: 24px;">
                        ${l.sub}
                    </p>
                    
                    <div id="feedbackOptions" style="display: flex; gap: 16px; justify-content: center; margin-bottom: 8px;">
                        <button class="btn" id="feedbackYesBtn" style="flex: 1; justify-content: center; padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 200, 83, 0.3); background: rgba(0, 200, 83, 0.08); color: #00e676; font-weight: 600; cursor: pointer; transition: all 0.2s; gap: 6px;">
                            ${l.yes}
                        </button>
                        <button class="btn" id="feedbackNoBtn" style="flex: 1; justify-content: center; padding: 12px; border-radius: 8px; border: 1px solid rgba(244, 67, 54, 0.3); background: rgba(244, 67, 54, 0.08); color: #ff5252; font-weight: 600; cursor: pointer; transition: all 0.2s; gap: 6px;">
                            ${l.no}
                        </button>
                    </div>
                    
                    <div id="feedbackSpinner" style="display: none; font-size: 0.95rem; color: var(--muted); margin: 12px 0;">
                        <div class="spinner" style="width:20px; height:20px; display:inline-block; vertical-align:middle; margin-right:8px;"></div>
                        <span>${l.saving}</span>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const submitFeedbackAction = async (liked) => {
                overlay.querySelector('#feedbackOptions').style.display = 'none';
                overlay.querySelector('#feedbackSpinner').style.display = 'block';
                
                try {
                    await fetch('/api/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            liked_result: liked,
                            feedback_category: 'career_match',
                            comment: 'Auto-submitted via PDF download intercept',
                            career_id: careerName
                        })
                    });
                } catch (e) {
                    console.error('Failed to submit download feedback:', e);
                }
                
                careerFeedbackSubmitted[careerName] = true;
                overlay.remove();
                
                // Trigger actual PDF generation
                downloadCareerPDF(career);
            };
            
            overlay.querySelector('#feedbackYesBtn').addEventListener('click', () => submitFeedbackAction(true));
            overlay.querySelector('#feedbackNoBtn').addEventListener('click', () => submitFeedbackAction(false));
        }

        function downloadCareerPDF(career) {
            const targetCareerName = career.career_name || career.name;
            
            // Intercept if feedback is not yet submitted for this career
            if (!careerFeedbackSubmitted[targetCareerName]) {
                showDownloadFeedbackModal(career);
                return;
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('⚠️ Popup blocked! Please allow popups to save the PDF.');
                return;
            }

            // PDF Headings Localization
            const pdfLabels = {
                en: {
                    subtitle: "Interactive Career Guide & Pathway Report",
                    overview: "Career Overview",
                    personality: "Personality Alignment",
                    pathway: "Educational Pathway",
                    exams: "Entrance Exams",
                    fees: "Approximate Course Fees",
                    income: "Expected Monthly Income",
                    financial: "Financial Assistance",
                    scholarships: "Scholarships",
                    loans: "Educational Loans",
                    study: "Where Will You Study?",
                    gov: "Government Institutes",
                    priv: "Private Institutes",
                    dist: "Distance Learning",
                    growth: "Expected Growth Path",
                    work: "Where You Will Work",
                    nearYou: "Near You",
                    filtered: "Filtered out based on your college type preferences",
                    noInstitutes: "No institutes listed",
                    notAvailable: "Information not available",
                    none: "None listed"
                },
                hi: {
                    subtitle: "इंटरएक्टिव करियर गाइड और पाथवे रिपोर्ट",
                    overview: "करियर विवरण",
                    personality: "व्यक्तित्व संरेखण",
                    pathway: "शैक्षणिक मार्ग (पाथवे)",
                    exams: "प्रवेश परीक्षाएं",
                    fees: "अनुमानित कोर्स शुल्क",
                    income: "अपेक्षित मासिक आय",
                    financial: "वित्तीय सहायता",
                    scholarships: "छात्रवृत्तियां",
                    loans: "शैक्षणिक ऋण",
                    study: "आप कहाँ अध्ययन करेंगे?",
                    gov: "सरकारी संस्थान",
                    priv: "निजी संस्थान",
                    dist: "दूरी शिक्षा (डिस्टेंस लर्निंग)",
                    growth: "अपेक्षित विकास पथ",
                    work: "आप कहाँ काम करेंगे",
                    nearYou: "आपके पास",
                    filtered: "आपके कॉलेज प्रकार की प्राथमिकताओं के आधार पर फ़िल्टर किया गया",
                    noInstitutes: "कोई संस्थान सूचीबद्ध नहीं है",
                    notAvailable: "जानकारी उपलब्ध नहीं है",
                    none: "कोई सूचीबद्ध नहीं है"
                },
                mr: {
                    subtitle: "इंटरएक्टिव करिअर मार्गदर्शक आणि पाथवे अहवाल",
                    overview: "करिअर विहंगावलोकन",
                    personality: "व्यक्तिमत्व संरेखन",
                    pathway: "शैक्षणिक मार्ग (पाथवे)",
                    exams: "प्रवेश परीक्षा",
                    fees: "अंदाजे कोर्स शुल्क",
                    income: "अपेक्षित मासिक उत्पन्न",
                    financial: "वित्तीय सहाय्य",
                    scholarships: "शिष्यवृत्ती",
                    loans: "शैक्षणिक कर्ज",
                    study: "तुम्ही कुठे अभ्यास कराल?",
                    gov: "शासकीय संस्था",
                    priv: "खाजगी संस्था",
                    dist: "दूरस्थ शिक्षण (डिस्टन्स लर्निंग)",
                    growth: "अपेक्षित वाढीचा मार्ग",
                    work: "तुम्ही कुठे काम कराल",
                    nearYou: "तुमच्या जवळ",
                    filtered: "तुमच्या कॉलेज प्रकारच्या आवडीनुसार फिल्टर केले गेले",
                    noInstitutes: "कोणतीही संस्था सूचीबद्ध नाही",
                    notAvailable: "माहिती उपलब्ध नाही",
                    none: "कोणतीही सूचीबद्ध नाही"
                }
            };
            const labels = pdfLabels[currentLanguage] || pdfLabels['en'];

            const emoji = career.emoji || '💼';
            const careerName = career.career_name || 'Career Guide';
            const description = career.description || labels.notAvailable;

            // Format Personality Traits
            const traitsHtml = (career.personality_traits || []).map(t => `<span class="tag">${t}</span>`).join('') || labels.none;

            // Format Educational Pathway
            let pathwayHtml = '';
            const steps = career.educational_pathway?.steps || (Array.isArray(career.educational_pathway) ? career.educational_pathway : null);
            if (steps && Array.isArray(steps)) {
                pathwayHtml = steps.map((step, idx) => {
                    if (typeof step === 'string') {
                        return `<div class="step-row"><span class="step-num">${idx + 1}</span><div class="step-desc">${step}</div></div>`;
                    }
                    let desc = step.details || step.description || '';
                    if (step.note) {
                        desc = desc ? `${desc} (${step.note})` : step.note;
                    }
                    let extra = '';
                    if (step.entrance_exams && Array.isArray(step.entrance_exams)) {
                        const examsList = step.entrance_exams.map(e => typeof e === 'string' ? e : (e.name || ''));
                        extra = `<div class="step-extra"><strong>${labels.exams}:</strong> ${examsList.join(', ')}</div>`;
                    }
                    return `<div class="step-row">
                        <span class="step-num">${idx + 1}</span>
                        <div class="step-desc">
                            <div>${desc}</div>
                            ${extra}
                        </div>
                    </div>`;
                }).join('');
            } else {
                pathwayHtml = `<p>${labels.notAvailable}</p>`;
            }

            // Format Entrance Exams
            const examsHtml = (career.entrance_exams || []).map(e => {
                const name = typeof e === 'string' ? e : (e.name || '');
                return `<span class="tag tag-cyan">${name}</span>`;
            }).join('') || `<span class="tag">${labels.none}</span>`;

            // Format Course Fees
            let feesHtml = labels.notAvailable;
            if (career.course_fee) {
                if (typeof career.course_fee === 'string') {
                    feesHtml = career.course_fee;
                } else {
                    const parts = [];
                    if (career.course_fee.fee_range) parts.push(career.course_fee.fee_range);
                    else {
                        let minVal = career.course_fee.minimum_inr;
                        let maxVal = career.course_fee.maximum_inr;
                        if (minVal !== undefined && maxVal !== undefined) {
                            parts.push(`INR ${minVal.toLocaleString('en-IN')} - ${maxVal.toLocaleString('en-IN')} (${career.course_fee.course_type || 'Per Year'})`);
                        }
                    }
                    if (career.course_fee.note) parts.push(`<small style="display:block;margin-top:4px;color:#666;">* ${career.course_fee.note}</small>`);
                    feesHtml = parts.join('<br/>');
                }
            }

            // Format Expected Income
            let salaryHtml = labels.notAvailable;
            if (career.expected_income) {
                if (typeof career.expected_income === 'string') {
                    salaryHtml = career.expected_income;
                } else {
                    const parts = [];
                    let minSal = career.expected_income.minimum_monthly_salary;
                    let maxSal = career.expected_income.maximum_monthly_salary;
                    if (minSal && maxSal) {
                        parts.push(`${minSal} - ${maxSal} per month`);
                    } else if (career.expected_income.minimum_monthly_salary_inr && career.expected_income.maximum_monthly_salary_inr) {
                        parts.push(`INR ${career.expected_income.minimum_monthly_salary_inr.toLocaleString('en-IN')} - ${career.expected_income.maximum_monthly_salary_inr.toLocaleString('en-IN')} per month`);
                    }
                    if (career.expected_income.note) parts.push(`<small style="display:block;margin-top:4px;color:#666;">* ${career.expected_income.note}</small>`);
                    salaryHtml = parts.join('<br/>');
                }
            }

            // Format Scholarships & Loans
            const formatFin = (items, prefix) => {
                if (!Array.isArray(items) || items.length === 0) return `<li>${labels.notAvailable}</li>`;
                return items.map(item => {
                    if (typeof item === 'string') return `<li>${item}</li>`;
                    const name = item.name || item.title || `${prefix} Scheme`;
                    const isVidyalakshmi = (
                        (item.website && (item.website.toLowerCase().includes('vidyalakshmi') || item.website.toLowerCase().includes('vidyalaksmi'))) ||
                        (name && (name.toLowerCase().includes('vidyalakshmi') || name.toLowerCase().includes('vidyalaksmi')))
                    );
                    const desc = item.description || item.details || (isVidyalakshmi ? item.website : '') || '';
                    const web = (item.website && isVidyalakshmi) ? ` (Website: ${item.website})` : '';
                    return `<li><strong>${name}</strong>: ${desc}${web}</li>`;
                }).join('');
            };
            const scholarshipsHtml = formatFin(career.scholarships, 'Scholarship');
            const loansHtml = formatFin(career.loans, 'Loan');

            // Format Growth Path (Normalized for multi-path structures)
            const getGrowthPaths = (gList) => {
                if (!Array.isArray(gList) || gList.length === 0) return [];
                if (gList.every(item => typeof item === 'string' || typeof item === 'number')) {
                    return [gList];
                }
                const pathsList = [];
                gList.forEach(item => {
                    if (Array.isArray(item)) {
                        pathsList.push(item);
                    } else if (item && typeof item === 'object') {
                        if (Array.isArray(item.path)) {
                            pathsList.push(item.path);
                        } else {
                            const val = item.step || item.title || item.name || item.role || item.designation;
                            if (val) pathsList.push([val]);
                        }
                    }
                });
                return pathsList.length > 0 ? pathsList : [gList.map(x => String(x))];
            };

            const growthList = career.expected_growth_path || career.growth_path || [];
            const normalizedPaths = getGrowthPaths(growthList);
            let growthHtml = '';

            if (normalizedPaths.length > 0) {
                growthHtml = normalizedPaths.map((path, pathIdx) => `
                    ${normalizedPaths.length > 1 ? `<div style="color:#0891b2; font-size:0.8rem; font-weight:bold; margin-top:8px; margin-bottom:4px;">Option ${pathIdx + 1}</div>` : ''}
                    <div class="growth-timeline">${path.map((g, i) => `
                        <div class="growth-node">${g}</div>
                        ${i < path.length - 1 ? '<span class="growth-arrow">➔</span>' : ''}
                    `).join('')}</div>
                `).join('');
            } else {
                growthHtml = labels.notAvailable;
            }

            // Format Institutes
            const whereStudy = career.where_will_you_study || career.institutes || {};
            const govInst = whereStudy.government_institutes || whereStudy.government || [];
            const privInst = whereStudy.private_institutes || whereStudy.private || [];
            const distInst = whereStudy.distance_learning || [];

            const formatInst = (list, typeName) => {
                if (!Array.isArray(list) || list.length === 0) return `<li>${labels.noInstitutes}</li>`;

                const studentLocVal = studentInfo.student_location ? studentInfo.student_location.trim().toLowerCase() : '';
                const prefRange = studentInfo.college_range || 'all';

                if (prefRange !== 'all' && prefRange !== typeName) {
                    return `<li>${labels.filtered}</li>`;
                }

                const processed = list.map(i => {
                    let name = 'Unknown Institute';
                    let location = '';
                    if (typeof i === 'string') {
                        name = i;
                    } else if (typeof i === 'object' && i !== null) {
                        name = i.name || 'Unknown Institute';
                        location = i.location ? i.location : '';
                    }
                    const isLocal = studentLocVal && location.toLowerCase().includes(studentLocVal);
                    return { name, location, isLocal };
                });

                processed.sort((a, b) => (b.isLocal ? 1 : 0) - (a.isLocal ? 1 : 0));

                return processed.map(item => {
                    const localMarker = item.isLocal ? ` 📍 [${labels.nearYou}]` : '';
                    const loc = item.location ? ` (${item.location})` : '';
                    return `<li style="${item.isLocal ? 'background-color: #f0fdf4; border-left: 3px solid #16a34a; padding-left: 8px;' : ''}"><strong>${item.name}</strong>${loc}${localMarker}</li>`;
                }).join('');
            };
            const govHtml = formatInst(govInst, 'government');
            const privHtml = formatInst(privInst, 'private');
            const distHtml = formatInst(distInst, 'distance');

            // Format Work Details
            const whereWork = career.where_will_you_work || {};
            const places = whereWork.places_of_work || career.places_of_work || [];
            const placesHtml = places.map(p => `<span class="tag">${p}</span>`).join('') || labels.notAvailable;

            let workEnvHtml = labels.notAvailable;
            const workEnv = whereWork.work_environment || career.work_environment;
            if (workEnv) {
                if (typeof workEnv === 'string') workEnvHtml = workEnv;
                else if (typeof workEnv === 'object') {
                    const parts = [];
                    if (workEnv.description) parts.push(workEnv.description);
                    if (workEnv.working_hours_per_day) parts.push(`<strong>Hours:</strong> ${workEnv.working_hours_per_day}`);
                    if (workEnv.desk_job !== undefined) parts.push(workEnv.desk_job ? 'Desk job' : 'Field job');
                    workEnvHtml = parts.join(' · ');
                }
            }

            // Format Success Story
            let storyHtml = '';
            const story = career.example_from_field || career.success_story;
            if (story && (story.name || story.details || story.description)) {
                let quoteHtml = '';
                if (story.quote) {
                    quoteHtml = '<blockquote style="font-style:italic; border-left:3px solid #7e22ce; padding-left:12px; margin:12px 0; color:#555;">"' + story.quote + '"</blockquote>';
                }
                const storyTitle = currentLanguage === 'hi' ? '🌟 क्षेत्र से उदाहरण' : currentLanguage === 'mr' ? '🌟 क्षेत्रातील उदाहरण' : '🌟 Example From The Field';
                storyHtml = `
                    <div class="story-card">
                        <h3>${storyTitle}</h3>
                        <p style="font-size:1.1rem; font-weight:bold; margin-bottom:4px; color:#5b21b6;">` + (story.name || '') + `</p>
                        <p style="color:#666; margin-top:0;">` + (story.profession || story.designation || careerName) + `</p>
                        ` + quoteHtml + `
                        <p style="margin-top:8px;">` + (story.details || story.description || '') + `</p>
                    </div>
                `;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${careerName} - Career Guide</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            color: #333;
                            line-height: 1.5;
                            padding: 40px;
                            max-width: 850px;
                            margin: 0 auto;
                            font-size: 0.95rem;
                        }
                        .header {
                            border-bottom: 3px solid #5b21b6;
                            padding-bottom: 16px;
                            margin-bottom: 24px;
                            display: flex;
                            align-items: center;
                            gap: 16px;
                        }
                        .header-text h1 {
                            color: #5b21b6;
                            margin: 0 0 4px 0;
                            font-size: 2rem;
                            text-transform: uppercase;
                        }
                        .header-text p {
                            margin: 0;
                            color: #666;
                            font-style: italic;
                        }
                        h2 {
                            color: #0891b2;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 4px;
                            margin-top: 28px;
                            font-size: 1.3rem;
                            text-transform: uppercase;
                        }
                        h3 {
                            color: #4b5563;
                            font-size: 1.05rem;
                            margin-top: 16px;
                            margin-bottom: 8px;
                        }
                        .tag {
                            display: inline-block;
                            background: #f3f4f6;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            padding: 4px 10px;
                            margin: 4px 4px 4px 0;
                            font-size: 0.82rem;
                            color: #374151;
                            font-weight: 500;
                        }
                        .tag-cyan {
                            background: #ecfeff;
                            border-color: #a5f3fc;
                            color: #0891b2;
                        }
                        .grid-2 {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 24px;
                        }
                        .step-row {
                            display: flex;
                            gap: 12px;
                            margin-bottom: 10px;
                            align-items: start;
                        }
                        .step-num {
                            background: #5b21b6;
                            color: #fff;
                            width: 22px;
                            height: 22px;
                            border-radius: 50%;
                            display: grid;
                            place-items: center;
                            font-weight: bold;
                            font-size: 0.8rem;
                            flex-shrink: 0;
                        }
                        .step-desc {
                            padding-top: 2px;
                        }
                        .step-extra {
                            margin-top: 4px;
                            font-size: 0.85rem;
                            color: #0891b2;
                        }
                        .growth-timeline {
                            display: flex;
                            flex-wrap: wrap;
                            align-items: center;
                            gap: 8px;
                            background: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 12px 16px;
                        }
                        .growth-node {
                            background: #f3e8ff;
                            border: 1px solid #d8b4fe;
                            border-radius: 6px;
                            padding: 6px 12px;
                            font-weight: bold;
                            font-size: 0.85rem;
                            color: #6b21a8;
                        }
                        .growth-arrow {
                            color: #a855f7;
                            font-weight: bold;
                        }
                        .story-card {
                            background: #faf5ff;
                            border: 1px solid #f3e8ff;
                            border-radius: 10px;
                            padding: 20px;
                            margin-top: 24px;
                        }
                        ul {
                            padding-left: 20px;
                            margin: 8px 0;
                        }
                        li {
                            margin-bottom: 6px;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            @page {
                                margin: 1.5cm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="font-size: 2.8rem; line-height: 1;">${emoji}</div>
                        <div class="header-text">
                            <h1>${careerName}</h1>
                            <p>${labels.subtitle}</p>
                        </div>
                    </div>
                    
                    <h2>${labels.overview}</h2>
                    <p>${description}</p>
                    
                    <h2>${labels.personality}</h2>
                    <div>${traitsHtml}</div>
                    
                    <h2>${labels.pathway}</h2>
                    <div style="margin-top: 12px;">${pathwayHtml}</div>
                    
                    <h2>${labels.exams}</h2>
                    <div style="margin-top: 8px;">${examsHtml}</div>
                    
                    <div class="grid-2" style="margin-top: 16px;">
                        <div>
                            <h2>${labels.fees}</h2>
                            <p style="font-size: 1.05rem; font-weight: 600; color: #111827;">${feesHtml}</p>
                        </div>
                        <div>
                            <h2>${labels.income}</h2>
                            <p style="font-size: 1.05rem; font-weight: 600; color: #111827;">${salaryHtml}</p>
                        </div>
                    </div>
                    
                    <h2>${labels.financial}</h2>
                    <div class="grid-2">
                        <div>
                            <h3>${labels.scholarships}</h3>
                            <ul>${scholarshipsHtml}</ul>
                        </div>
                        <div>
                            <h3>${labels.loans}</h3>
                            <ul>${loansHtml}</ul>
                        </div>
                    </div>
                    
                    <h2>${labels.study}</h2>
                    <div class="grid-2">
                        <div>
                            <h3>${labels.gov}</h3>
                            <ul>${govHtml}</ul>
                        </div>
                        <div>
                            <h3>${labels.priv}</h3>
                            <ul>${privHtml}</ul>
                        </div>
                    </div>
                    ${distInst.length > 0 ? `
                    <div style="margin-top: 16px;">
                        <h3>${labels.dist}</h3>
                        <ul>${distHtml}</ul>
                    </div>
                    ` : ''}
                    
                    <h2>${labels.growth}</h2>
                    <div style="margin-top: 12px;">${growthHtml}</div>
                    
                    <h2>${labels.work}</h2>
                    <div>${placesHtml}</div>
                    <p style="margin-top: 10px; font-style: italic;">${workEnvHtml}</p>
                    
                    ${storyHtml}
                    
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => { window.close(); }, 500);
                        }
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        async function downloadCareerReport(careerName) {
            showToast(`Generating report for ${careerName}...`);
            try {
                const response = await fetch('/api/career-detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ career_name: careerName })
                });
                const data = await response.json();
                if (data.career) {
                    downloadCareerPDF(data.career);
                } else {
                    showToast('Career details not available for download');
                }
            } catch (error) {
                console.error('Error generating PDF:', error);
                showToast('Error generating PDF');
            }
        }

        // ============================================================
        // PREFETCH AND PRE-TRANSLATE CAREER DETAILS (BACKGROUND SPEEDUP)
        // ============================================================
        async function prefetchCareerDetails(topCareersList, lang) {
            if (!Array.isArray(topCareersList) || topCareersList.length === 0 || lang === 'en') return;

            console.log(`[PREFETCH] Starting background prefetch for ${topCareersList.length} careers in '${lang}'...`);

            // Loop through each career to fetch and translate in background
            for (const careerMatch of topCareersList) {
                const careerName = careerMatch.originalName || careerMatch.name;
                const cacheKey = lang + '_' + careerName;

                // Skip if already cached
                if (careerTranslationCache[cacheKey]) {
                    continue;
                }

                // Asynchronously fetch and translate (without blocking the loop or UI)
                (async () => {
                    try {
                        const response = await fetch('/api/career-detail', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ career_name: careerName })
                        });
                        const data = await response.json();
                        if (data.career) {
                            data.career.skill_development_plan = generateSkillPlan(data.career);
                            const translatedCareer = await translateObject(data.career, lang);
                            careerTranslationCache[cacheKey] = translatedCareer;
                            console.log(`[PREFETCH] Successfully pre-translated and cached: ${careerName} (${lang})`);
                        }
                    } catch (e) {
                        console.warn(`[PREFETCH] Error prefetching ${careerName}:`, e);
                    }
                })();

                // Add a small 200ms delay between fetches to keep network traffic smooth
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // ============================================================
        // VIEW FULL CAREER DETAIL
        // ============================================================
        async function viewFullCareerDetail(careerName) {
            const cacheKey = currentLanguage + '_' + careerName;
            if (currentLanguage !== 'en' && careerTranslationCache[cacheKey]) {
                showCareerDetailModal(careerTranslationCache[cacheKey]);
                return;
            }

            let toastMsg = `Loading details for ${careerName}...`;
            if (currentLanguage !== 'en') {
                toastMsg = await translateText(toastMsg, currentLanguage);
            }
            showToast(toastMsg);
            try {
                const response = await fetch('/api/career-detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ career_name: careerName })
                });
                const data = await response.json();
                if (data.career) {
                    data.career.skill_development_plan = generateSkillPlan(data.career);
                    const translatedCareer = await translateObject(data.career, currentLanguage);
                    if (currentLanguage !== 'en') {
                        careerTranslationCache[cacheKey] = translatedCareer;
                    }
                    showCareerDetailModal(translatedCareer);
                } else {
                    let errMsg = 'Career details not available';
                    if (currentLanguage !== 'en') errMsg = await translateText(errMsg, currentLanguage);
                    showToast(errMsg);
                }
            } catch (error) {
                console.error('Error fetching career detail:', error);
                let errLoadMsg = 'Error loading career details';
                if (currentLanguage !== 'en') errLoadMsg = await translateText(errLoadMsg, currentLanguage);
                showToast(errLoadMsg);
            }
        }

        // ============================================================
        // SHOW CAREER DETAIL MODAL
        // ============================================================
        function showCareerDetailModal(career) {
            const dict = uiTranslations[currentLanguage] || uiTranslations['en'];
            console.log('Career Data:', career);

            const hasText = (value) => {
                if (value === null || value === undefined) return false;
                if (typeof value !== 'string') return true;
                const v = value.trim().toLowerCase();
                return v.length > 0 && v !== 'information not available' && v !== 'n/a';
            };

            const hasArray = (value) => Array.isArray(value) && value.length > 0;

            const emoji = career.emoji || getEmojiForCareer(career.career_name || '');
            const careerName = career.career_name || 'Unknown Career';
            const description = career.description || 'No description available';

            const traits = career.personality_traits || [];
            const traitHtml = traits.length > 0 ?
                traits.map(t => `<span class="tag">${t}</span>`).join('') :
                '<span class="tag">Information not available</span>';

            // Educational Pathway
            let pathwayHtml = '';
            const pathway = career.educational_pathway || {};
            const steps = pathway.steps || (Array.isArray(pathway) ? pathway : null);
            if (steps && Array.isArray(steps)) {
                pathwayHtml = steps.map((step, idx) => {
                    if (typeof step === 'string') {
                        return `<div class="pathway-step" style="display:flex; gap:12px; margin-bottom:12px; align-items:start;">
                            <span class="step-num" style="background:var(--violet); color:#fff; width:24px; height:24px; border-radius:50%; display:grid; place-items:center; font-size:0.8rem; font-weight:700; flex-shrink:0; border: 1px solid var(--stroke-bright);">${idx + 1}</span>
                            <div style="color:var(--muted); font-size:0.92rem; padding-top:2px; line-height:1.4;">${step}</div>
                        </div>`;
                    }

                    let desc = step.details || step.description || '';
                    let extra = '';

                    if (step.note) {
                        desc = desc ? `${desc} (${step.note})` : step.note;
                    }

                    if (step.entrance_exams && Array.isArray(step.entrance_exams)) {
                        const examsList = step.entrance_exams.map(e => typeof e === 'string' ? e : (e.name || JSON.stringify(e)));
                        extra = `<div style="margin-top:6px;"><span style="color:var(--cyan); font-size:0.8rem; font-weight:600;">Entrance Exams: </span><span style="color:var(--muted); font-size:0.84rem;">${examsList.join(', ')}</span></div>`;
                    }

                    if (!desc && Object.keys(step).length > 0) {
                        desc = Object.entries(step)
                            .filter(([k]) => k !== 'step')
                            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                            .join(' · ');
                    }

                    return `<div class="pathway-step" style="display:flex; gap:12px; margin-bottom:12px; align-items:start;">
                        <span class="step-num" style="background:var(--violet); color:#fff; width:24px; height:24px; border-radius:50%; display:grid; place-items:center; font-size:0.8rem; font-weight:700; flex-shrink:0; border: 1px solid var(--stroke-bright);">${idx + 1}</span>
                        <div style="color:var(--muted); font-size:0.92rem; padding-top:2px; line-height:1.4;">
                            <div>${desc}</div>
                            ${extra}
                        </div>
                    </div>`;
                }).join('');
            } else {
                pathwayHtml = renderStructuredValue(pathway);
            }

            // Entrance Exams
            const exams = career.entrance_exams || [];
            const examHtml = Array.isArray(exams) && exams.length > 0 ?
                exams.map(e => {
                    const name = typeof e === 'string' ? e : (e.name || JSON.stringify(e));
                    return `<span class="tag tag-cyan">${name}</span>`;
                }).join('') :
                '<span class="tag">Information not available</span>';

            // Course Fee
            const feeText = formatCourseFee(career.course_fee);

            // Expected Income
            const incomeData = formatIncome(career.expected_income);
            const incomeSourceHtml = (incomeData.source && (incomeData.source.toLowerCase().includes('vidyalakshmi') || incomeData.source.toLowerCase().includes('vidyalaksmi'))) ?
                `<p style="color:var(--faint);font-size:0.75rem">Source: <a href="${incomeData.source}" target="_blank" class="link-item">${incomeData.source}</a></p>` :
                '';

            // Scholarships & Loans Custom Beautiful Formatting
            const formatScholarshipsOrLoans = (items, badge) => {
                if (!Array.isArray(items) || items.length === 0) {
                    return '<div class="list-item">Information not available</div>';
                }
                return items.map(item => {
                    if (typeof item === 'string') {
                        return `<div class="list-item">${item}</div>`;
                    }
                    const name = item.name || item.title || 'Scholarship Scheme';
                    const isVidyalakshmi = (
                        (item.website && (item.website.toLowerCase().includes('vidyalakshmi') || item.website.toLowerCase().includes('vidyalaksmi'))) ||
                        (name && (name.toLowerCase().includes('vidyalakshmi') || name.toLowerCase().includes('vidyalaksmi')))
                    );
                    const desc = item.description || item.details || (isVidyalakshmi ? item.website : '') || '';
                    const linkHtml = (item.website && isVidyalakshmi) ? `<br/><a href="${item.website}" target="_blank" class="link-item" style="display:inline-block; margin-top:6px; font-size:0.8rem;">🔗 Website: ${item.website}</a>` : '';
                    return `<div style="background:rgba(255,255,255,0.015); border:1px solid var(--stroke); border-radius:10px; padding:12px 16px; margin-bottom:8px; display:flex; flex-direction:column; gap:4px;">
                        <strong style="color:var(--cyan); font-size:0.92rem;">${badge} ${name}</strong>
                        <span style="color:var(--muted); font-size:0.86rem; line-height:1.5;">${desc}</span>
                        ${linkHtml}
                    </div>`;
                }).join('');
            };

            // Scholarships
            const scholarships = career.scholarships || [];
            const schHtml = formatScholarshipsOrLoans(scholarships, '🎓');

            // Loans
            const loans = career.loans || [];
            const loanHtml = formatScholarshipsOrLoans(loans, '🏦');

            // Where Will You Study
            const whereStudy = career.where_will_you_study || career.institutes || {};
            const govInst = whereStudy.government_institutes || whereStudy.government || [];
            const privInst = whereStudy.private_institutes || whereStudy.private || [];
            const distInst = whereStudy.distance_learning || [];
            const hasStudyData = hasArray(govInst) || hasArray(privInst) || hasArray(distInst);

            // Dynamic Personalized Study Section Renderer
            const renderStudySection = (filterActive) => {
                const studentLocVal = studentInfo.student_location ? studentInfo.student_location.trim().toLowerCase() : '';
                const prefRange = studentInfo.college_range || 'all';

                // Helper to process institute list and match local state/city
                const processList = (rawList) => {
                    if (!rawList) return [];
                    const listArr = Array.isArray(rawList) ? rawList : [rawList];

                    const mapped = listArr.map(inst => {
                        let name = 'Unknown Institute';
                        let location = '';
                        if (typeof inst === 'string') {
                            name = inst;
                        } else if (inst && typeof inst === 'object') {
                            name = inst.name || 'Unknown Institute';
                            location = inst.location || '';
                        }

                        const isLocal = studentLocVal && location.toLowerCase().includes(studentLocVal);
                        return { name, location, isLocal, original: inst };
                    });

                    // Reorder local first
                    mapped.sort((a, b) => (b.isLocal ? 1 : 0) - (a.isLocal ? 1 : 0));
                    return mapped;
                };

                const govProcessed = processList(govInst);
                const privProcessed = processList(privInst);
                const distProcessed = processList(distInst);

                // Helper to render HTML
                const renderList = (processed, icon, typeName) => {
                    if (filterActive && prefRange !== 'all' && prefRange !== typeName) {
                        return '';
                    }

                    let listToRender = processed;
                    if (filterActive && studentLocVal) {
                        const localOnly = processed.filter(p => p.isLocal);
                        if (localOnly.length > 0) {
                            listToRender = localOnly;
                        }
                    }

                    if (listToRender.length === 0) {
                        return '<div style="color:var(--faint); font-size:0.86rem; padding:4px 0;">No matching colleges found</div>';
                    }

                    return listToRender.map(item => {
                        const localBadge = item.isLocal ? `<span class="tag tag-cyan" style="background:rgba(0, 200, 83, 0.12); border-color:rgba(0, 200, 83, 0.35); color:#00e676; margin-left:6px; font-size:0.7rem; padding:1px 5px; border-radius:4px; font-weight:700;">📍 Near You</span>` : '';
                        const locText = item.location ? ` (${item.location})` : '';
                        return `<div class="institute-item" style="font-size:0.86rem; color:var(--muted); margin-bottom:8px; display:flex; align-items:start; gap:6px; background: ${item.isLocal ? 'rgba(0, 200, 83, 0.03)' : 'transparent'}; border: ${item.isLocal ? '1px solid rgba(0, 200, 83, 0.2)' : 'none'}; padding: ${item.isLocal ? '6px 10px' : '0'}; border-radius: 8px;">
                            <span style="color:var(--cyan);">${icon}</span>
                            <span><strong>${item.name}</strong>${locText} ${localBadge}</span>
                        </div>`;
                    }).join('');
                };

                const govListHtml = renderList(govProcessed, '🏛️', 'government');
                const privListHtml = renderList(privProcessed, '🏢', 'private');
                const distListHtml = renderList(distProcessed, '💻', 'distance');

                const showGov = !filterActive || prefRange === 'all' || prefRange === 'government';
                const showPriv = !filterActive || prefRange === 'all' || prefRange === 'private';
                const showDist = !filterActive || prefRange === 'all' || prefRange === 'distance';

                return `
                    <div class="grid-3" id="modalInstitutesGrid">
                        ${showGov ? `
                        <div>
                            <h5 style="color:var(--amber);margin-bottom:8px;font-size:0.85rem;display:flex;align-items:center;gap:4px;">${dict['title-gov'] || 'Government'} ${prefRange === 'government' ? '<span style="color:var(--cyan);font-size:0.75rem;">(Preferred)</span>' : ''}</h5>
                            ${govListHtml}
                        </div>
                        ` : ''}
                        ${showPriv ? `
                        <div>
                            <h5 style="color:var(--coral);margin-bottom:8px;font-size:0.85rem;display:flex;align-items:center;gap:4px;">${dict['title-priv'] || 'Private'} ${prefRange === 'private' ? '<span style="color:var(--cyan);font-size:0.75rem;">(Preferred)</span>' : ''}</h5>
                            ${privListHtml}
                        </div>
                        ` : ''}
                        ${showDist ? `
                        <div>
                            <h5 style="color:var(--violet-2);margin-bottom:8px;font-size:0.85rem;display:flex;align-items:center;gap:4px;">${dict['title-dist'] || 'Distance Learning'} ${prefRange === 'distance' ? '<span style="color:var(--cyan);font-size:0.75rem;">(Preferred)</span>' : ''}</h5>
                            ${distListHtml}
                        </div>
                        ` : ''}
                    </div>
                `;
            };

            // Expose the renderer globally for the toggle checkbox to invoke
            window._renderModalStudySection = renderStudySection;

            // Where Will You Work
            const whereWork = career.where_will_you_work || {};
            const places = whereWork.places_of_work || career.places_of_work || [];
            const placesHtml = places.length > 0 ? places.map(p => `<span class="tag">${p}</span>`).join('') : '<span class="tag">Information not available</span>';
            const workEnv = whereWork.work_environment || career.work_environment;
            let workEnvText = 'Information not available';
            if (workEnv) {
                if (typeof workEnv === 'string') workEnvText = workEnv;
                else if (typeof workEnv === 'object') {
                    const parts = [];
                    if (workEnv.description) parts.push(workEnv.description);
                    if (workEnv.type) parts.push(`Type: ${workEnv.type}`);
                    if (workEnv.working_days) parts.push(`Days: ${workEnv.working_days}`);
                    if (workEnv.working_hours) parts.push(`Hours: ${workEnv.working_hours}`);
                    if (workEnv.working_hours_per_day) parts.push(`Hours per day: ${workEnv.working_hours_per_day}`);

                    if (workEnv.travel_required || workEnv.travelling_required) parts.push("Travel Required");
                    if (workEnv.part_time_available || workEnv.part_time_jobs_available) parts.push("Part-time Available");
                    if (workEnv.contractual_jobs_available) parts.push("Contractual Opportunities");
                    if (workEnv.desk_job === true) parts.push("Desk Job");
                    else if (workEnv.desk_job === false) parts.push("Field/On-site Job");

                    workEnvText = parts.length > 0 ? parts.join(' · ') : 'Information not available';
                }
            }
            const hasWorkData = hasArray(places) || hasText(workEnvText);

            // Expected Growth Path Normalization
            const getGrowthPaths = (gList) => {
                if (!Array.isArray(gList) || gList.length === 0) return [];
                if (gList.every(item => typeof item === 'string' || typeof item === 'number')) {
                    return [gList];
                }
                const pathsList = [];
                gList.forEach(item => {
                    if (Array.isArray(item)) {
                        pathsList.push(item);
                    } else if (item && typeof item === 'object') {
                        if (Array.isArray(item.path)) {
                            pathsList.push(item.path);
                        } else {
                            const val = item.step || item.title || item.name || item.role || item.designation;
                            if (val) pathsList.push([val]);
                        }
                    }
                });
                return pathsList.length > 0 ? pathsList : [gList.map(x => String(x))];
            };

            const growth = career.expected_growth_path || career.growth_path || [];
            const normalizedPaths = getGrowthPaths(growth);
            let growthHtml = '';

            if (normalizedPaths.length > 0) {
                growthHtml = normalizedPaths.map((path, pathIdx) => `
                    ${normalizedPaths.length > 1 ? `<div style="color:var(--cyan); font-size:0.82rem; font-weight:600; margin-bottom:6px; margin-top:${pathIdx > 0 ? '12px' : '0'}">Option ${pathIdx + 1}</div>` : ''}
                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; background:rgba(255,255,255,0.015); border:1px solid var(--stroke); border-radius:12px; padding:16px 20px;">
                        ${path.map((step, idx) => `
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="background:linear-gradient(135deg, rgba(123, 97, 255, 0.2), rgba(0, 212, 255, 0.1)); border:1px solid var(--stroke); border-radius:10px; padding:8px 14px; font-weight:600; font-size:0.88rem; color:var(--ink);">${step}</div>
                                ${idx < path.length - 1 ? '<span style="color:var(--cyan); font-size:1.2rem; font-weight:700;">➔</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('');
            } else {
                growthHtml = renderStructuredValue(growth);
            }

            // Example From Field
            const example = career.example_from_field || career.success_story;
            let exampleHtml = '';
            if (example) {
                const name = example.name || '';
                const role = example.designation || example.profession || example.career || '';
                const org = example.organization || example.current_organization || '';
                const desc = example.description || example.details || '';
                const quote = example.quote || '';
                const source = example.source || '';
                const achievements = example.achievements || [];

                const hasExample = hasText(name) || hasText(role) || hasText(desc) || hasText(quote);
                if (hasExample) {
                    const isVidyalakshmi = source && (source.toLowerCase().includes('vidyalakshmi') || source.toLowerCase().includes('vidyalaksmi'));
                    const sourceHtml = (source && isVidyalakshmi) ? `<p style="color:var(--faint);font-size:0.75rem;margin-top:8px">Source: <a href="${source}" target="_blank" class="link-item">${source}</a></p>` : '';

                    exampleHtml = `
                    <h4 class="section-title">${dict['title-example'] || '🌟 Example From The Field'}</h4>
                    <div class="story-card">
                        ${name ? `<p style="font-size:1.1rem;font-weight:600;color:var(--ink)">${name}</p>` : ''}
                        ${role ? `<p style="color:var(--muted)">${role}${org ? ' at ' + org : ''}</p>` : ''}
                        ${quote ? `<div class="quote-text">"${quote}"</div>` : ''}
                        ${desc ? `<p style="color:var(--muted);margin-top:8px">${desc}</p>` : ''}
                        ${sourceHtml}
                        ${achievements && Array.isArray(achievements) && achievements.length > 0 ? `
                            <div style="margin-top:8px">
                                <p style="color:var(--muted);font-weight:600">Achievements:</p>
                                ${achievements.map(a => `<div class="list-item">${a}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                }
            }

            // Important Note
            const noteHtml = career.important_note ? `<p style="color:var(--faint);font-size:0.8rem;margin-top:12px;font-style:italic">${career.important_note}</p>` : '';

            // Differently Abled
            const inclusiveHtml = career.differently_abled_opportunities ? '<span class="tag tag-cyan" style="margin-bottom:16px;display:inline-block">♿ Opportunities for differently abled exist in this field</span>' : '';

            // Related Careers
            const related = career.related_careers || [];
            let relatedHtml = '';
            if (Array.isArray(related) && related.length > 0) {
                relatedHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px;">${related.map(r => `<span class="tag tag-cyan">${r}</span>`).join('')}</div>`;
            } else {
                relatedHtml = renderStructuredValue(related);
            }

            // AI Insights
            const aiInsights = career.ai_insights || {};
            const futureScope = aiInsights.future_scope || aiInsights.futureScope || 'Information not available';
            const emergingTech = aiInsights.emerging_technologies || aiInsights.emergingTech || [];
            let techHtml = '';
            if (Array.isArray(emergingTech) && emergingTech.length > 0) {
                techHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px;">${emergingTech.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
            } else {
                techHtml = renderStructuredValue(emergingTech);
            }

            // Skill Plan
            const skills = career.skill_development_plan || generateSkillPlan(career);
            const skillHtml = skills.map(s => `<div class="list-item">${s}</div>`).join('');

            const whyMatches = traits.length > 0 ? `This career aligns with your personality traits: ${traits.slice(0, 3).join(', ')}` : 'This career matches your RIASEC profile based on your interests and personality traits.';

            const traitsSection = hasArray(traits) ? `
                    <h4 class="section-title">${dict['title-traits'] || '🧠 Personality Traits Alignment'}</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">${traitHtml}</div>
                ` : '';

            const pathwaySection = hasRenderableValue(pathway) ? `
                    <h4 class="section-title">${dict['title-pathway'] || '🎓 Educational Pathway'}</h4>
                    <div style="margin-bottom:16px">${pathwayHtml}</div>
                ` : '';

            const examsSection = hasRenderableValue(exams) ? `
                    <h4 class="section-title">${dict['title-exams'] || '📝 Entrance Exams'}</h4>
                    <div style="margin-bottom:16px">${examHtml}</div>
                ` : '';

            const feesIncomeSection = (hasText(feeText) || hasText(incomeData.text)) ? `
                    <div class="grid-2">
                    ${hasText(feeText) ? `
                    <div>
                        <h4 class="section-title">${dict['title-fees'] || '💰 Course Fees'}</h4>
                        <p class="section-content">${feeText.split(' • ').join('<br/>')}</p>
                    </div>
                    ` : ''}
                    ${hasText(incomeData.text) ? `
                    <div>
                        <h4 class="section-title">${dict['title-income'] || '💵 Expected Income'}</h4>
                        <p class="section-content">${incomeData.text}</p>
                        ${incomeSourceHtml}
                    </div>
                    ` : ''}
                    </div>
                ` : '';

            const scholarshipsSection = hasArray(scholarships) ? `
                    <h4 class="section-title">${dict['title-scholarships'] || '🎓 Scholarships'}</h4>
                    <div style="margin-bottom:16px">${schHtml}</div>
                ` : '';

            const loansSection = hasArray(loans) ? `
                    <h4 class="section-title">${dict['title-loans'] || '🏦 Loans'}</h4>
                    <div style="margin-bottom:16px">${loanHtml}</div>
                ` : '';

            // Preferences Toggle Bar if student has location or specific range set
            const prefFilterBar = studentInfo.student_location || (studentInfo.college_range && studentInfo.college_range !== 'all') ? `
                <div style="background:rgba(255,255,255,0.015); border:1px solid var(--stroke); border-radius:12px; padding:12px 18px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.1rem;">🎯</span>
                        <div>
                            <span style="color:var(--cyan); font-size:0.85rem; font-weight:600; display:block;">Personalized College Filter</span>
                            <span style="color:var(--muted); font-size:0.78rem;">Location: <strong>${studentInfo.student_location || 'All India'}</strong> · Range: <strong>${studentInfo.college_range === 'government' ? 'Government Only' : studentInfo.college_range === 'private' ? 'Private Only' : studentInfo.college_range === 'distance' ? 'Distance Only' : 'All Colleges'}</strong></span>
                        </div>
                    </div>
                    <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem; color:var(--ink); font-weight:600; user-select:none;">
                        <input type="checkbox" id="modalPrefFilter" checked style="cursor:pointer; width:15px; height:15px; accent-color:var(--violet);" onchange="const container = document.getElementById('modalInstitutesContainer'); if(container) { container.innerHTML = window._renderModalStudySection(this.checked); }">
                        Filter strictly by my preferences
                    </label>
                </div>
            ` : '';

            const studySection = hasStudyData ? `
                    <h4 class="section-title">${dict['title-study'] || '🏛️ Where Will You Study?'}</h4>
                    ${prefFilterBar}
                    <div id="modalInstitutesContainer" style="margin-bottom: 16px;">
                        ${renderStudySection(true)}
                    </div>
                ` : '';

            const workSection = hasWorkData ? `
                    <h4 class="section-title">${dict['title-work'] || '🏢 Where Will You Work?'}</h4>
                    ${hasText(workEnvText) ? `<p class="section-content">${workEnvText}</p>` : ''}
                    ${hasArray(places) ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${placesHtml}</div>` : ''}
                ` : '';

            const growthSection = hasArray(growth) ? `
                    <h4 class="section-title">${dict['title-growth'] || '📈 Expected Growth Path'}</h4>
                    <div style="margin-bottom:16px">${growthHtml}</div>
                ` : '';

            const futureScopeSection = hasText(futureScope) ? `
                    <h4 class="section-title">${currentLanguage === 'hi' ? '🔮 भविष्य की संभावनाएं' : currentLanguage === 'mr' ? '🔮 भविष्यातील वाव' : '🔮 Future Scope'}</h4>
                    <p class="section-content">${futureScope}</p>
                ` : '';

            const techSection = hasArray(emergingTech) ? `
                    <h4 class="section-title">${currentLanguage === 'hi' ? '⚡ उभरती हुई तकनीकें' : currentLanguage === 'mr' ? '⚡ उदयोन्मुख तंत्रज्ञान' : '⚡ Emerging Technologies'}</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">${techHtml}</div>
                ` : '';

            const skillsSection = hasArray(skills) ? `
                    <h4 class="section-title">${dict['title-skills'] || '📚 Skill Development Plan'}</h4>
                    <div style="margin-bottom:16px">${skillHtml}</div>
                ` : '';

            const relatedSection = hasRenderableValue(related) ? `
                    <h4 class="section-title">${currentLanguage === 'hi' ? '🔗 संबंधित करियर' : currentLanguage === 'mr' ? '🔗 संबंधित करिअर' : '🔗 Related Careers'}</h4>
                    <div style="margin-bottom:16px">${relatedHtml}</div>
                ` : '';

            const extraSections = Object.entries(career)
                .filter(([key]) => !['career_name', 'description', 'personality_traits', 'educational_pathway', 'entrance_exams', 'course_fee', 'expected_income', 'scholarships', 'loans', 'where_will_you_study', 'institutes', 'where_will_you_work', 'places_of_work', 'work_environment', 'growth_path', 'expected_growth_path', 'related_careers', 'differently_abled_opportunities', 'entrepreneurship', 'ai_insights', 'success_story', 'example_from_field', 'future_scope', 'emerging_technologies', 'important_note', 'emoji', 'pages', 'source_page', 'source_pages', 'ranking_information', 'reference_ranking_website', 'riasec_tags'].includes(key))
                .filter(([, value]) => hasRenderableValue(value))
                .map(([key, value]) => `
                        <div style="margin-bottom:16px">
                            <h4 class="section-title">${escapeHtml(key.replace(/_/g, ' '))}</h4>
                            <div class="section-content">${renderStructuredValue(value)}</div>
                        </div>
                    `).join('');

            // Expose globally so the modal download button can call it
            window._downloadCurrentModalCareer = () => {
                downloadCareerPDF(career);
            };

            const downloadBtnLabel = currentLanguage === 'hi' ? '📥 पीडीएफ डाउनलोड करें' : currentLanguage === 'mr' ? '📥 पीडीएफ डाउनलोड करा' : '📥 Download PDF';
            const askBtnLabel = currentLanguage === 'hi' ? 'इस करियर के बारे में VERA से पूछें →' : currentLanguage === 'mr' ? 'या करिअरबद्दल VERA ला विचारा →' : 'Ask VERA about this career →';

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="glass modal-content">
                    <div class="modal-header">
                        <div>
                            <div style="font-size:2.5rem">${emoji}</div>
                            <h2>${careerName}</h2>
                            ${inclusiveHtml}
                        </div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove();document.body.style.overflow=''">✕</button>
                    </div>

                    <h4 class="section-title">${dict['title-overview'] || '📋 Career Overview'}</h4>
                    <p class="section-content">${description}</p>

                    <h4 class="section-title">${dict['title-why-matches'] || '🎯 Why It Matches Student Profile'}</h4>
                    <p class="section-content">${whyMatches}</p>

                    ${traitsSection}
                    ${pathwaySection}
                    ${examsSection}
                    ${feesIncomeSection}
                    ${scholarshipsSection}
                    ${loansSection}
                    ${studySection}
                    ${workSection}
                    ${growthSection}
                    ${futureScopeSection}
                    ${techSection}
                    ${skillsSection}
                    ${relatedSection}
                    ${extraSections}

                    ${exampleHtml}
                    ${noteHtml}

                    <div style="display:flex; gap:12px; width:100%; margin-top:12px; flex-wrap: wrap;">
                        <button class="btn" style="flex:1; min-width: 140px; justify-content:center; background:var(--glass); border:1px solid var(--stroke-bright); color:var(--cyan); font-weight:600; padding:10px 16px; border-radius:var(--r-sm); cursor:pointer;"
                            onclick="window._downloadCurrentModalCareer()">
                            ${downloadBtnLabel}
                        </button>
                        <button class="btn btn-primary" style="flex:1.5; min-width: 200px; justify-content:center;" 
                            onclick="this.closest('.modal-overlay').remove();document.body.style.overflow='';document.getElementById('counselor').scrollIntoView({behavior:'smooth'});document.getElementById('chatInput').value='${currentLanguage === 'hi' ? 'मुझे ' + careerName + ' बनने के बारे में और बताएं' : currentLanguage === 'mr' ? 'मला ' + careerName + ' बनण्याबद्दल अधिक सांगा' : 'Tell me more about becoming a ' + careerName}';setTimeout(sendChat,500)">
                            ${askBtnLabel}
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.style.overflow = '';
                }
            });
        }

        // ============================================================
        // GENERATE SKILL PLAN
        // ============================================================
        function generateSkillPlan(career) {
            const skills = [];
            const traits = career.personality_traits || [];
            for (const trait of traits) {
                const t = trait.toLowerCase();
                if (t.includes('analytical') || t.includes('research') || t.includes('investigative'))
                    skills.push('Develop strong analytical and research skills');
                else if (t.includes('creative') || t.includes('artistic') || t.includes('innovative'))
                    skills.push('Enhance creative thinking and design skills');
                else if (t.includes('leadership') || t.includes('persuasive') || t.includes('enterprising'))
                    skills.push('Build leadership and communication skills');
                else if (t.includes('helpful') || t.includes('empathetic') || t.includes('social'))
                    skills.push('Strengthen interpersonal and counseling skills');
                else if (t.includes('organized') || t.includes('detail') || t.includes('conventional'))
                    skills.push('Master organization and attention to detail');
                else if (t.includes('practical') || t.includes('hands-on') || t.includes('realistic'))
                    skills.push('Develop practical and technical skills');
            }
            skills.push('Build relevant technical skills through online courses');
            skills.push('Gain practical experience through internships');
            skills.push('Develop strong communication and teamwork abilities');
            skills.push('Stay updated with industry trends and technologies');
            return [...new Set(skills)];
        }

        // ============================================================
        // CHAT FUNCTIONS
        // ============================================================
        function formatBotMessage(text) {
            let formatted = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/^- (.*?)$/gm, '<div style="margin-left:12px">• $1</div>')
                .replace(/^• (.*?)$/gm, '<div style="margin-left:12px">• $1</div>');
            return formatted;
        }

        function addChatMessage(role, text) {
            const body = document.getElementById('chatBody');
            const msg = document.createElement('div');
            msg.className = `msg ${role === 'user' ? 'me' : 'bot'}`;

            if (role === 'bot') {
                msg.innerHTML = formatBotMessage(text);
            } else {
                msg.textContent = text;
            }

            body.appendChild(msg);
            body.scrollTop = body.scrollHeight;
            return msg;
        }

        function showTyping() {
            const body = document.getElementById('chatBody');
            const typing = document.createElement('div');
            typing.className = 'typing';
            typing.id = 'typingIndicator';
            typing.innerHTML = '<span></span><span></span><span></span>';
            body.appendChild(typing);
            body.scrollTop = body.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('typingIndicator');
            if (typing) typing.remove();
        }

        function askQuick(button) {
            document.getElementById('chatInput').value = button.textContent;
            sendChat();
        }

        async function sendChat() {
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text || isProcessing) return;
            input.value = '';
            isProcessing = true;
            document.getElementById('chatSend').disabled = true;

            addChatMessage('user', text);
            showTyping();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        message: text,
                        language: currentLanguage
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                hideTyping();

                const botResponse = data.response || 'I could not process your request. Please try again.';
                addChatMessage('bot', botResponse);
            } catch (error) {
                console.error('Chat error:', error);
                hideTyping();
                let errChatMsg = '😔 Oops! I encountered a small issue. Let me try that again. Please retry your question or check your internet connection! 🌐';
                if (currentLanguage !== 'en') {
                    errChatMsg = await translateText(errChatMsg, currentLanguage);
                }
                addChatMessage('bot', errChatMsg);
            } finally {
                isProcessing = false;
                document.getElementById('chatSend').disabled = false;
                document.getElementById('chatInput').focus();
            }
        }

        // ============================================================
        // UTILITY FUNCTIONS
        // ============================================================
        function observeReveals() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in'); });
            }, { threshold: 0.12 });
            document.querySelectorAll('.reveal:not(.in)').forEach(el => observer.observe(el));
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast._timer);
            toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) { modal.remove(); document.body.style.overflow = ''; }
                const traitModal = document.querySelector('.trait-modal-overlay');
                if (traitModal) { traitModal.remove(); document.body.style.overflow = ''; }
            }
        });

        window.startQuiz = startQuiz;
        window.answerQuestion = answerQuestion;
        window.goToPreviousQuestion = goToPreviousQuestion;
        window.goToNextQuestion = goToNextQuestion;
        window.sendChat = sendChat;
        window.askQuick = askQuick;
        window.viewFullCareerDetail = viewFullCareerDetail;
        window.submitProfile = submitProfile;
        window.getEmojiForCareer = getEmojiForCareer;

        window.showRiasecModal = function(trait) {
            const data = {
                'Realistic': {
                    desc: 'People with a "Realistic" personality like to work with their hands, machines, and tools. They are practical, active, and enjoy building or fixing things.',
                    example: 'E.g., Mechanical Engineer, Electrician, Pilot.'
                },
                'Investigative': {
                    desc: 'People with an "Investigative" personality enjoy analyzing problems, researching, and observing. They are logical, intellectual, and scientific.',
                    example: 'E.g., Data Scientist, Researcher, Software Developer.'
                },
                'Artistic': {
                    desc: 'People with an "Artistic" personality value creativity, originality, and independence. They enjoy self-expression through art, writing, or design.',
                    example: 'E.g., Graphic Designer, Writer, Architect.'
                },
                'Social': {
                    desc: 'People with a "Social" personality are helpers. They enjoy teaching, counseling, and caring for others. They are empathetic and communicative.',
                    example: 'E.g., Teacher, Nurse, Counselor.'
                },
                'Enterprising': {
                    desc: 'People with an "Enterprising" personality are leaders and persuaders. They enjoy taking initiative, managing teams, and achieving business goals.',
                    example: 'E.g., Entrepreneur, Sales Manager, Executive.'
                },
                'Conventional': {
                    desc: 'People with a "Conventional" personality thrive in organized, structured environments. They are detail-oriented, precise, and enjoy working with data.',
                    example: 'E.g., Accountant, Administrator, Data Entry.'
                }
            };
            
            const info = data[trait];
            if(!info) return;

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'trait-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="trait-modal glass" style="max-width: 500px; width: 90%; padding: 24px; border: 1px solid rgba(255,255,255,0.12); text-align: left;">
                    <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                        <h3 style="margin:0; font-size:1.4rem; color: #00D4FF;">
                            ${trait} Personality
                        </h3>
                        <button class="modal-close" onclick="this.closest('.trait-modal-overlay').remove();" style="background:none; border:none; color:var(--muted); font-size:1.2rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size: 0.95rem; color: var(--ink); line-height: 1.6; margin-bottom: 16px;">
                        ${info.desc}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--muted); background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px;">
                        <strong>Examples:</strong><br>
                        ${info.example}
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        };

        // Persist test state to prevent loss on accidental navigation
        window.addEventListener('beforeunload', () => {
            if (window.location.pathname === '/take-test') {
                const wrap = document.querySelector('.wrap');
                if (wrap) {
                    sessionStorage.setItem('testWrapHTML_v2', wrap.innerHTML);
                    sessionStorage.setItem('testVars_v2', JSON.stringify({
                        currentQuestion: typeof currentQuestion !== 'undefined' ? currentQuestion : 0,
                        answers: typeof answers !== 'undefined' ? answers : [],
                        topCareers: typeof topCareers !== 'undefined' ? topCareers : [],
                        studentInfo: typeof studentInfo !== 'undefined' ? studentInfo : {},
                        riasecScores: typeof riasecScores !== 'undefined' ? riasecScores : { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
                        userProfile: typeof userProfile !== 'undefined' ? userProfile : null,
                        rawResultsData: typeof rawResultsData !== 'undefined' ? rawResultsData : null
                    }));
                }
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            if (window.location.pathname === '/take-test') {
                const navEntries = performance.getEntriesByType("navigation");
                if (navEntries.length > 0 && navEntries[0].type === "reload") {
                    sessionStorage.removeItem('testWrapHTML_v2');
                    sessionStorage.removeItem('testVars_v2');
                    return;
                }

                const savedHTML = sessionStorage.getItem('testWrapHTML_v2');
                const savedVarsStr = sessionStorage.getItem('testVars_v2');
                
                if (savedHTML && savedVarsStr) {
                    const wrap = document.querySelector('.wrap');
                    if (wrap && wrap.innerHTML.trim() !== '') {
                        wrap.innerHTML = savedHTML;
                        try {
                            const savedVars = JSON.parse(savedVarsStr);
                            if (savedVars.currentQuestion !== undefined) currentQuestion = savedVars.currentQuestion;
                            if (savedVars.answers !== undefined) answers = savedVars.answers;
                            if (savedVars.topCareers !== undefined) topCareers = savedVars.topCareers;
                            if (savedVars.studentInfo !== undefined) studentInfo = savedVars.studentInfo;
                            if (savedVars.riasecScores !== undefined) riasecScores = savedVars.riasecScores;
                            if (savedVars.userProfile !== undefined) userProfile = savedVars.userProfile;
                            if (savedVars.rawResultsData !== undefined) rawResultsData = savedVars.rawResultsData;
                        } catch(e) {}
                    }
                }
            }
        });
    </script>
</body>
</html>