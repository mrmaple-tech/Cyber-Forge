// Regenerates the static HTML shells. Run: node scripts/generate-pages.mjs
// Every page is a thin shell; content is rendered by /js using safe DOM APIs.
import { writeFileSync } from 'node:fs';

const pages = [
  ['index.html', 'home', 'CyberForge — Learn Kali Linux. Master Cybersecurity.', 'Interactive cybersecurity training: Kali Linux, Linux, networking, web security, security operations and digital forensics with safe simulated labs.'],
  ['learn.html', 'learn', 'Learning Path — CyberForge', 'A ten-level cybersecurity learning path from Linux fundamentals to advanced cybersecurity.'],
  ['kali.html', 'kali', 'Kali Linux — CyberForge', 'Learn Kali Linux: installation, terminal, permissions, package management and responsible security testing.'],
  ['linux.html', 'linux', 'Linux Fundamentals — CyberForge', 'Twenty-four essential Linux commands explained with safe examples, quizzes and a simulated terminal.'],
  ['networking.html', 'networking', 'Networking — CyberForge', 'IP, DNS, TCP/UDP, ports, subnets, firewalls and NAT with interactive diagrams.'],
  ['cybersecurity.html', 'cybersecurity', 'Cybersecurity Fundamentals — CyberForge', 'The CIA triad, access control, encryption, risk, vulnerability management and incident response.'],
  ['web-security.html', 'web-security', 'Web Security — CyberForge', 'Web application security concepts with simulated vulnerable training apps.'],
  ['security-operations.html', 'security-operations', 'Security Operations — CyberForge', 'Monitoring, logs, SIEM concepts, alert triage and simulated security incidents.'],
  ['forensics.html', 'forensics', 'Digital Forensics — CyberForge', 'Evidence handling, metadata, timelines and fictional forensic cases.'],
  ['labs.html', 'labs', 'Labs — CyberForge', 'Guided simulated labs across Linux, networking, web security, forensics, security operations, cryptography and OSINT.'],
  ['tools.html', 'tools', 'Security Tools Library — CyberForge', 'A reference library of cybersecurity tools with purposes, safe training environments and related lessons.'],
  ['challenges.html', 'challenges', 'Challenges — CyberForge', 'Safe, simulated cybersecurity challenges and the daily security challenge.'],
  ['progress.html', 'progress', 'Progress Dashboard — CyberForge', 'Your XP, level, skills, badges and streak.'],
  ['about.html', 'about', 'About — CyberForge', 'About CyberForge: mission, safety principles and responsible use.'],
  ['profile.html', 'profile', 'Profile — CyberForge', 'Your CyberForge profile, badges and data controls.'],
  ['admin.html', 'admin', 'Admin Dashboard (Prototype) — CyberForge', 'Admin dashboard mockup for managing CyberForge content.']
];

const scripts = ['config', 'app', 'db', 'data', 'lessons', 'quizzes', 'content-kali', 'content-linux', 'content-networking', 'content-cyber', 'content-web', 'content-secops', 'content-forensics',
  'progress', 'terminal', 'labs', 'challenges', 'tools', 'mentor', 'admin', 'pages', 'pages-topics', 'pages-web', 'navigation'];

const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";

for (const [file, id, title, desc] of pages) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="no-referrer">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#080b0e">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/responsive.css">
${scripts.map((s) => `  <script src="js/${s}.js" defer></script>`).join('\n')}
</head>
<body data-page="${id}">
  <a class="skip-link" href="#app">Skip to main content</a>
  <header id="site-header"></header>
  <main id="app" tabindex="-1">
    <noscript><div class="container section"><p class="notice">CyberForge needs JavaScript to run its interactive lessons, labs and simulated terminal. It uses no trackers and no third-party scripts.</p></div></noscript>
  </main>
  <footer id="site-footer"></footer>
</body>
</html>
`;
  writeFileSync(file, html);
}
console.log('Generated', pages.length, 'pages');
