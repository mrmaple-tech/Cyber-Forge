# CyberForge

**Learn Kali Linux. Master Cybersecurity.**

CyberForge is an interactive cybersecurity education platform for beginners and intermediate learners. It teaches Linux, Kali Linux, networking, cybersecurity fundamentals, web security, security operations and digital forensics through lessons, quizzes, a simulated terminal, guided labs and challenges — with XP, levels, badges and a daily challenge.

Everything runs in the browser. There is **no backend**, no tracking and no third-party code. All practical exercises are **local simulations on fictional data**; nothing scans, attacks or connects to real systems.

## Features

- **16 pages**: Home, Learn (10-level path), Kali Linux, Linux Fundamentals, Networking, Cybersecurity Fundamentals, Web Security, Security Operations, Digital Forensics, Labs, Security Tools, Challenges, Progress, About, Profile and an Admin Dashboard prototype.
- **~120 lessons** in 10 courses. Each lesson has *What you will learn · Lesson · Example · Common mistakes · Knowledge check · Complete lesson*. Linux Fundamentals teaches 24 commands with *What it does · Why it matters · Safe example · Common mistakes*.
- **Simulated terminal** (`ls pwd cd cat mkdir touch echo clear whoami help …`) over an in-memory fake filesystem, with five guided missions (+100 XP each). It never executes anything real.
- **Interactive networking diagrams**: layer explorer, DNS-resolution and TCP-handshake steppers, subnet calculator, port reference.
- **Web-security training simulators**: login (SQL injection concept), comment board (XSS / output encoding), document viewer (path traversal), security-header analyzer. Each has a *vulnerable* and a *fixed* mode; none evaluates SQL, injects HTML, reads files or uses the network.
- **Security operations & forensics**: simulated incidents (e.g. 47 failed logins / 12 usernames / 1 source / 3 successes), authentication-log analyzer, evidence timeline explorer and hash-based integrity checker.
- **19 labs** across Linux, Networking, Web Security, Digital Forensics, Security Operations, Cryptography, OSINT and Fundamentals; **12 challenges** (multiple choice, terminal, log analysis, network analysis, configuration, web simulation, cryptography, Linux missions, forensics) plus a **rotating daily challenge**.
- **Security tools library** with 31 tools (Nmap, Wireshark, Burp Suite, Gobuster, John the Ripper, Hashcat, Metasploit, Nikto, Netcat, …): category, description, purpose, difficulty, concepts, safe training environment and related lessons. Search and filters included.
- **XP, levels, streaks and 11 badges** stored in `localStorage`; skill progress bars; export/import/reset on the Profile page.
- **CyberForge Mentor**: a frontend tutor with predefined answers (e.g. it explains `chmod 755`), safety guardrails and a clean seam for a future secure AI backend.
- **Admin dashboard (mockup)**: overview stats, users, courses, lessons, labs, challenges, tools and reports; create-forms persist to `localStorage`.
- Accessible and responsive: skip link, ARIA labels, keyboard operation, visible focus, reduced-motion support, mobile navigation.

## Tech stack

HTML5 · CSS3 · vanilla JavaScript (no framework, no build step) · `localStorage` · GitHub Pages (via GitHub Actions). Structured so Supabase and an AI backend can be added later.

## Local development

No install is required — any static file server works:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
python3 -m http.server 8000        # or: npx serve .
# open http://localhost:8000
```

Opening `index.html` directly from the file system also works for most pages, but a local server matches GitHub Pages most closely.

Useful commands:

```bash
node scripts/check-site.mjs        # JS syntax, link check, banned patterns (innerHTML/eval…), secret patterns
node scripts/generate-pages.mjs    # regenerate the 16 HTML shells after changing the script list or titles
```

## GitHub Pages deployment

1. Push the repository to GitHub (default branch `main`).
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow `.github/workflows/pages.yml` runs `scripts/check-site.mjs` and publishes the site on every push to `main`.
4. Your site appears at `https://USERNAME.github.io/REPOSITORY/`.

All paths are **relative** (`css/style.css`, `js/app.js`, `kali.html#terminal`), and there is no server-side routing, so the site works from a sub-path with no configuration. (A `.nojekyll` file is included.)

## Project structure

```
index.html … admin.html      16 static page shells (content is rendered by /js)
css/
  style.css                  design tokens, components, themes
  responsive.css             tablet / mobile layout, print
js/
  config.js                  PUBLIC runtime config only (backend flag, future endpoints)
  app.js                     safe DOM helper h(), sanitiser, toasts, tabs, bootstrap
  db.js                      storage abstraction (localStorage now, Supabase later)
  data.js                    XP rules, skills, learning path, badges
  progress.js                XP, levels, streaks, badges, catalog / skill progress
  lessons.js, quizzes.js     lesson & quiz components
  content-*.js               course content (kali, linux, networking, cyber, web, secops, forensics)
  terminal.js                simulated terminal + missions
  labs.js, challenges.js     scenario engine, labs dashboard, challenges, daily challenge
  tools.js                   security tools library
  mentor.js                  CyberForge Mentor (local knowledge base)
  admin.js                   admin dashboard mockup
  pages.js, pages-topics.js, pages-web.js   page renderers & simulators
  navigation.js              header, mobile menu, footer
assets/icons, assets/images  logo / favicon
supabase/schema.sql          future database schema + Row Level Security
scripts/                     page generator and static checks
SECURITY.md  LICENSE  README.md  .github/workflows/pages.yml
```

### XP and levels

| Activity | XP |
| --- | --- |
| Lesson | 50 |
| Quiz (≥ 60 %) | 100 |
| Terminal mission | 100 |
| Lab | 250 |
| Challenge | 250 (+100 for a perfect run) |
| Daily challenge | 150 |

Level threshold = `20 × (level − 1)²` XP, so level 12 begins at 2,420 XP.

## Security philosophy

The site follows the secure-development practices it teaches: no `innerHTML`/`eval`, a strict Content-Security-Policy, input sanitisation and re-validation of stored data, no secrets in code, no third-party scripts, and a terminal that is provably only a simulation. See [SECURITY.md](SECURITY.md).

## Responsible cybersecurity education

CyberForge focuses on understanding systems, detection, defence and **authorized** security testing. Every exercise is simulated; tools are described with their legitimate purpose and a safe training environment. Test only systems you own or have explicit written permission to assess.

## Future Supabase integration

1. Create a Supabase project and run `supabase/schema.sql` (tables: `profiles, courses, lessons, labs, challenges, quiz_questions, user_progress, user_xp, badges, user_badges, tool_library, daily_challenges`, all with Row Level Security).
2. Implement the adapter interface in `js/db.js` (`loadState / saveState / customList / …`) using `@supabase/supabase-js`, then set `backend: 'supabase'`, `supabaseUrl` and the **anon** key in `js/config.js`.
3. Extend the CSP `connect-src` to your project URL.
4. Move XP/badge awarding server-side with the provided `complete_item` function (or an Edge Function) so progress cannot be forged.
5. Replace the admin mockup's client checks with real role checks (`profiles.role = 'admin'`, enforced by RLS).

**Never** put the service-role key, database password or any secret in frontend code.

## Future AI integration

`CF.mentor.ask()` in `js/mentor.js` is the single seam. Replace its body with a `fetch` to **your own backend endpoint** (`CF_CONFIG.mentorEndpoint`) that authenticates the user, rate-limits, filters unsafe requests, calls the AI provider with a server-side secret and returns text. Render replies with `textContent`. **Never** ship an AI API key to the browser.

## Roadmap ideas

More labs and challenges, a spaced-repetition review mode, certificates, localisation, a pcap viewer using bundled sample captures, Supabase auth with a leaderboard, and a secure AI mentor backend.

## License

MIT — see [LICENSE](LICENSE).
