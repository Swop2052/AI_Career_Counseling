import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_INDEX = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(BASE_INDEX)) {
  console.error('dist/index.html not found. Please run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(BASE_INDEX, 'utf-8');

const PAGES = [
  {
    path: 'after-10th-career-guidance',
    title: 'Which Stream After 10th? Free AI Career Test',
    description: "Confused about Arts, Science or Commerce after 10th? Take SkillSense's free AI career test to find the stream and path that fits you best.",
    h1: 'Which Stream Should You Choose After 10th?',
    h2: 'Take a Free AI Career Test Built for Class 10 Students',
    bodyText: `
      <section style="max-width:900px;margin:40px auto;padding:24px;font-family:sans-serif;line-height:1.6;color:#04211F;">
        <h1 style="font-size:2rem;font-weight:bold;color:#04302E;margin-bottom:8px;">Which Stream Should You Choose After 10th?</h1>
        <h2 style="font-size:1.25rem;font-weight:600;color:#09A3A3;margin-bottom:20px;">Take a Free AI Career Test Built for Class 10 Students</h2>
        <p>Choosing between Science, Commerce, and Arts shouldn't be based on friend circles or guesswork. SkillSense evaluates your natural strengths through 48 fun psychometric questions to find your genuine fit in 10 minutes.</p>
        
        <h3>Compare 11th & 12th Streams:</h3>
        <ul>
          <li><strong>Science (PCM / PCB):</strong> For Engineering, Medicine, Computer Science, Architecture, and Biotechnology.</li>
          <li><strong>Commerce (With / Without Maths):</strong> For Chartered Accountancy (CA), Investment Banking, Corporate Law, and Management (IPMAT/BBA).</li>
          <li><strong>Arts & Humanities:</strong> For Law, Clinical Psychology, UI/UX Design, Journalism, and Civil Services (UPSC).</li>
        </ul>

        <p><a href="/#onboarding" style="display:inline-block;padding:12px 28px;background:#04302E;color:#fff;border-radius:30px;text-decoration:none;font-weight:bold;margin-top:16px;">Start Free Class 10 Assessment</a></p>
      </section>
    `
  },
  {
    path: 'after-12th-science-career-options',
    title: 'Career Options After 12th Science | Free AI Test',
    description: "Not sure what to do after 12th Science? Discover the best-fit courses and careers with SkillSense's free AI career assessment and personal roadmap.",
    h1: 'What to Do After 12th Science? Discover Your Best-Fit Career',
    h2: 'Free AI Career Assessment for Science Stream Students',
    bodyText: `
      <section style="max-width:900px;margin:40px auto;padding:24px;font-family:sans-serif;line-height:1.6;color:#04211F;">
        <h1 style="font-size:2rem;font-weight:bold;color:#04302E;margin-bottom:8px;">What to Do After 12th Science? Discover Your Best-Fit Career</h1>
        <h2 style="font-size:1.25rem;font-weight:600;color:#09A3A3;margin-bottom:20px;">Free AI Career Assessment for Science Stream Students</h2>
        <p>Stuck between Engineering, Medicine, or exploring modern careers in AI, Biotechnology, and Design? SkillSense maps your analytical mindset against 100+ high-growth science careers and verified salary benchmarks.</p>
        
        <h3>Emerging Science Horizons:</h3>
        <ul>
          <li><strong>Artificial Intelligence & Robotics:</strong> Machine Learning, Cloud Architecture, and Autonomous Systems (₹8-25 LPA).</li>
          <li><strong>Biotechnology & Genomics:</strong> Bioinformatics, Genetics, and Drug Discovery beyond NEET.</li>
          <li><strong>Aviation & Defense:</strong> Commercial Pilot License (CPL) and National Defence Academy (NDA).</li>
        </ul>

        <p><a href="/#onboarding" style="display:inline-block;padding:12px 28px;background:#04302E;color:#fff;border-radius:30px;text-decoration:none;font-weight:bold;margin-top:16px;">Start Free Science Aptitude Test</a></p>
      </section>
    `
  },
  {
    path: 'career-test-for-commerce-students',
    title: 'Career Test for Commerce Students | Free AI Test',
    description: "Explore the best career options for commerce students with SkillSense's free AI career test — personality insights, course guidance, and a roadmap.",
    h1: 'Best Career Options for Commerce Students',
    h2: 'Take a Free AI-Powered Career Test Designed for Commerce Students',
    bodyText: `
      <section style="max-width:900px;margin:40px auto;padding:24px;font-family:sans-serif;line-height:1.6;color:#04211F;">
        <h1 style="font-size:2rem;font-weight:bold;color:#04302E;margin-bottom:8px;">Best Career Options for Commerce Students</h1>
        <h2 style="font-size:1.25rem;font-weight:600;color:#09A3A3;margin-bottom:20px;">Take a Free AI-Powered Career Test Designed for Commerce Students</h2>
        <p>Commerce is much bigger than traditional accounting. Discover whether you're best suited for Investment Banking, Corporate Law, FinTech, Actuarial Science, or Entrepreneurship.</p>
        
        <h3>Top Specializations:</h3>
        <ul>
          <li><strong>Chartered Accountancy & Audit:</strong> ICAI CA, ACCA, and CPA certifications.</li>
          <li><strong>Investment Banking & Valuation:</strong> Equity research, financial modeling, and venture capital.</li>
          <li><strong>Management & Strategy:</strong> BBA, BMS, and prestigious IIM 5-Year Integrated Programs (IPM).</li>
        </ul>

        <p><a href="/#onboarding" style="display:inline-block;padding:12px 28px;background:#04302E;color:#fff;border-radius:30px;text-decoration:none;font-weight:bold;margin-top:16px;">Start Free Commerce Aptitude Test</a></p>
      </section>
    `
  }
];

PAGES.forEach(page => {
  const pageDir = path.join(DIST_DIR, page.path);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  let html = template;
  const canonicalUrl = `https://skillsense.aisense.co.in/${page.path}`;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`);

  // Replace Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/i,
    `<meta name="description" content="${page.description}" />`
  );

  // Replace Canonical
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // Replace OpenGraph
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/i,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/i,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // Replace Twitter
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/i,
    `<meta name="twitter:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/i,
    `<meta name="twitter:description" content="${page.description}" />`
  );

  // Inject pre-rendered crawlable HTML inside <noscript>
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>${page.bodyText}</noscript>`
  );

  // ALSO inject pre-rendered HTML directly into <div id="root">
  // so crawlers and scrapers that don't execute JS read full text immediately,
  // and React replaces it smoothly upon client hydration!
  html = html.replace(
    /<div id="root"><\/div>/i,
    `<div id="root">${page.bodyText}</div>`
  );

  const destFile = path.join(pageDir, 'index.html');
  fs.writeFileSync(destFile, html, 'utf-8');
  console.log(`Generated pre-rendered static page: ${page.path}/index.html`);
});

console.log('All static SEO landing pages generated successfully!');
