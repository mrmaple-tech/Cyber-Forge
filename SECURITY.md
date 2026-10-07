# Security Policy

CyberForge teaches cybersecurity, so the platform itself has to practise what it teaches. This document explains how the site is built securely, what "responsible cybersecurity education" means here, and how a future backend must be secured.

## Reporting a vulnerability in CyberForge

Please report security issues in this project privately (GitHub → *Security* → *Report a vulnerability*) rather than opening a public issue. Include steps to reproduce and the affected page. We aim to acknowledge reports within 5 business days.

---

## 1. Secure development of the site

CyberForge is a static site (HTML, CSS, JavaScript). Its main risk is **client-side injection**, so the design removes the dangerous primitives entirely:

| Control | How it is implemented |
| --- | --- |
| No HTML injection | The UI is built only with `createElement` / `textContent` (`CF.h()` in `js/app.js`). `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write` are never used. |
| No code execution from data | No `eval`, `new Function` or string-based timers. Checked automatically by `scripts/check-site.mjs` (also runs in CI). |
| Sanitised user content | Every user-entered value (display name, admin forms, mentor chat, imports) passes through `CF.clean()` (control-character stripping, `<`/`>` removal, length caps) **and** is displayed as text. |
| Safe URLs | `CF.h()` only accepts relative, `https:` or `mailto:` URLs for `href`/`src`; `javascript:`/`data:` are rejected. |
| Content-Security-Policy | Every page ships a CSP `<meta>`: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'`. No inline scripts or styles, no third-party origins. |
| No third-party code | No CDNs, trackers, fonts or analytics. Nothing to compromise through the supply chain at runtime. |
| No iframes | The site neither embeds nor is designed to be embedded. (When you control response headers, add `frame-ancestors 'none'`.) |
| Validated storage | Anything read back from `localStorage` or an imported file is re-validated and normalised (`normalise()` in `js/progress.js`): types, ranges, id patterns and size limits. |
| No secrets | No API keys, tokens or credentials exist in the repository. The CI check fails on key-like strings and `service_role` references. |
| Spreadsheet-safe exports | CSV exports prefix cells that start with `=`, `+`, `-`, `@` to prevent formula injection. |

> Client-side XP, badges and the admin dashboard are **not trust boundaries**. Anyone can edit `localStorage`. They exist for learning and motivation only.

## 2. The simulated terminal is only a simulation

`js/terminal.js` models a tiny fake filesystem as a JavaScript object. It:

- never runs a real command, never calls a server, never uses `eval`/`Function`;
- rejects shell operators (`| ; & $ ` < >`), uses an allow-list of commands, and validates names (blocking `__proto__`, `constructor`, `prototype`);
- renders output with `textContent` only and caps the output buffer.

Please keep it that way: **do not add real command execution to the terminal, ever.**

## 3. Responsible cybersecurity education

- **Authorization first.** Security testing is only legitimate with explicit written permission that defines scope, timing and rules of engagement. The site repeats this wherever tools are described.
- **Simulation first.** Every lab, challenge and web-security exercise is a local simulation on fictional data. Fictional addresses use documentation ranges (RFC 5737 / RFC 3849) and domains use `example.*` (RFC 2606).
- **No tooling aimed at real targets.** CyberForge contains no scanner, crawler, brute-forcer, exploit or request-sending feature. The vulnerable "applications" never evaluate SQL, inject HTML, read files or call the network; they display string logic only.
- **Defence alongside offence.** Whenever a weakness is explained, the fix (parameterised queries, output encoding, canonicalisation, secure headers, least privilege) is shown next to it.
- **Mentor guardrails.** The CyberForge Mentor declines requests to access, disrupt or spy on systems or accounts the learner does not own, and redirects to safe learning.
- **Contributing content.** Lessons and labs must use fictional data, must not include working attack payloads against real products, and must pair every attack concept with its defence.

## 4. Safe labs for learners

Recommend (and follow) these rules when learners build their own labs:

1. Run lab VMs on **host-only or internal** virtual networks with no route to the internet or your home/work LAN.
2. Use intentionally vulnerable targets (Metasploitable, DVWA, OWASP Juice Shop, VulnHub) and **never expose them** to the internet.
3. Snapshot a clean state; revert after experiments.
4. Verify downloads with checksums; use official sources only.
5. Never reuse real credentials, and keep real data out of the lab.

## 5. Future backend security (Supabase and AI)

When a backend is added, apply these requirements:

**Supabase**
- Only the **anon (public) key** may appear in frontend code (`js/config.js`). The **service-role key and database password are secrets** — never commit them or ship them to the browser.
- Enable **Row Level Security on every table**; deny by default. `supabase/schema.sql` contains starter policies: users read/write only their own rows; content tables are read-only to the public; admin writes require a server-verified role.
- Do **not** let clients write XP or badges directly. Award them in a `SECURITY DEFINER` function or Edge Function that validates the completed item and prevents duplicate awards.
- Enforce authentication with Supabase Auth, short-lived sessions, MFA for admins, and rate limiting (Auth settings + Edge Functions).
- Keep the admin dashboard behind real server-side role checks. Hiding UI is not access control.
- Validate input again on the server (check constraints, length limits, enums). Never trust client validation.

**AI mentor**
- The browser must call **your own backend endpoint**, never an AI provider directly. Store the provider key as a server-side secret.
- The backend must authenticate the user, rate-limit, cap input/output length, filter abusive or unsafe requests, log for abuse review, and avoid sending personal data to the provider.
- Treat model output as untrusted: render it with `textContent`, never `innerHTML`.
- Keep a system prompt that restricts the assistant to defensive, educational, authorised-testing guidance.

**Hosting**
- On GitHub Pages you cannot set response headers, so the CSP is delivered via `<meta>`. If you move to a host that supports headers (Netlify, Cloudflare Pages, nginx), also send `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy` as real headers, plus `frame-ancestors 'none'`.
- When adding the Supabase client, extend `connect-src` to your project URL only (and pin the library version with Subresource Integrity if loaded from a CDN).

## 6. Checks you can run

```bash
node scripts/check-site.mjs   # syntax, links, banned patterns, secret patterns
```
