// Dependency-free static checks. Run: node scripts/check-site.mjs
// 1) JS syntax  2) internal links/assets exist  3) banned unsafe patterns  4) obvious secrets
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

let failed = 0;
const fail = (m) => { failed++; console.error('FAIL ' + m); };
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

const js = walk('js').filter((f) => f.endsWith('.js'));
for (const f of js) { try { execFileSync(process.execPath, ['--check', f]); } catch { fail('syntax error in ' + f); } }

const BANNED = [[/\.innerHTML\s*=/, 'innerHTML assignment'], [/\.outerHTML\s*=/, 'outerHTML assignment'], [/insertAdjacentHTML\s*\(/, 'insertAdjacentHTML'], [/document\.write\s*\(/, 'document.write'], [/\beval\s*\(/, 'eval()'], [/new\s+Function\s*\(/, 'new Function()'], [/\bsetTimeout\s*\(\s*['"`]/, 'string setTimeout'], [/<iframe/i, 'iframe']];
const SECRETS = [[/sk-[A-Za-z0-9]{20,}/, 'API-key-like token'], [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, 'JWT-like token'], [/service_role/i, 'service_role reference (frontend)'], [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'], [/AKIA[0-9A-Z]{16}/, 'AWS key id']];
// Lesson text legitimately shows the unsafe pattern as a teaching example inside a string.
const ALLOW = { 'js/content-web.js': ['innerHTML assignment'] };
for (const f of [...js, ...readdirSync('.').filter((x) => x.endsWith('.html'))]) {
  const t = readFileSync(f, 'utf8');
  for (const [re, name] of BANNED) if (re.test(t) && !(ALLOW[f.replace(/\\/g, '/')] || []).includes(name)) fail(`${f}: banned pattern ${name}`);
  for (const [re, name] of SECRETS) if (re.test(t)) fail(`${f}: possible secret: ${name}`);
}

for (const f of readdirSync('.').filter((x) => x.endsWith('.html'))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(u)) { if (/^https?:\/\//.test(u)) fail(`${f}: external resource ${u} (CSP/no third-party policy)`); continue; }
    if (u.startsWith('/')) fail(`${f}: root-absolute path ${u} breaks project-site hosting`);
    else if (!existsSync(u.split('#')[0])) fail(`${f}: missing ${u}`);
  }
}
// Links built in JS (href: 'x.html#y')
const pages = new Set(readdirSync('.').filter((x) => x.endsWith('.html')));
for (const f of js) {
  for (const m of readFileSync(f, 'utf8').matchAll(/['"]([a-z-]+\.html)(?:#[\w-]*)?['"]/g)) if (!pages.has(m[1])) fail(`${f}: link to missing page ${m[1]}`);
}
console.log(failed ? `\n${failed} problem(s)` : 'All checks passed (' + js.length + ' scripts, ' + pages.size + ' pages).');
process.exit(failed ? 1 : 0);
