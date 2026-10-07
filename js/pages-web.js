/*
 * Web Security page + intentionally vulnerable TRAINING SIMULATORS.
 * SECURITY: every simulator is pure client-side string logic over fake data. None of them
 * evaluates SQL, injects HTML, requests a URL, loads a file or executes input. User input is
 * only ever displayed with textContent. They teach WHY flaws happen and how the fix works.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  CF.pages = CF.pages || {};

  const simCard = (title, blurb, body) => h('div', { class: 'card', css: { marginBottom: '20px' } }, h('span', { class: 'kicker' }, 'Simulated vulnerable app'), h('h3', null, title), h('p', { class: 'muted' }, blurb), body);
  function modeToggle(onChange) {
    let vulnerable = true;
    const vBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'true' }, 'Vulnerable version'), sBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false' }, 'Fixed version');
    const set = (v) => { vulnerable = v; vBtn.setAttribute('aria-pressed', String(v)); sBtn.setAttribute('aria-pressed', String(!v)); onChange(v); };
    vBtn.addEventListener('click', () => set(true)); sBtn.addEventListener('click', () => set(false));
    return { el: h('div', { class: 'filters', role: 'group', 'aria-label': 'Application version' }, vBtn, sBtn), get: () => vulnerable };
  }
  const resultBox = () => h('div', { class: 'result-box', 'aria-live': 'polite' }, 'Submit the form to see what the server would do.');

  /* 1. Training portal login — SQL injection concept */
  function sqlSim() {
    const USERS = { admin: 'Tr@in-Only-1', student: 'learn123' }; // fictional training credentials
    const u = h('input', { id: 'sq-u', type: 'text', maxlength: '60', autocomplete: 'off', value: 'student' }), p = h('input', { id: 'sq-p', type: 'text', maxlength: '60', autocomplete: 'off', value: 'wrong-password' });
    const out = resultBox(), q = h('pre', null, h('code', null, ''));
    const mode = modeToggle(() => run());
    const examples = h('div', { class: 'btn-row', css: { margin: '10px 0' } },
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { u.value = 'student'; p.value = 'learn123'; run(); } }, 'Valid login'),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { u.value = "student"; p.value = "' OR '1'='1"; run(); } }, 'Injection-style input'),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { u.value = "admin'--"; p.value = 'x'; run(); } }, 'Comment-style input'));
    const TAUTOLOGY = /'\s*or\s*'?(\w+)'?\s*=\s*'?\1'?/i, COMMENT = /'\s*(--|#|\/\*)/;
    function run() {
      const uu = u.value.slice(0, 60), pp = p.value.slice(0, 60);
      if (mode.get()) {
        q.firstChild.textContent = "SELECT * FROM users\n WHERE username = '" + uu + "'\n   AND password = '" + pp + "';";
        const alters = TAUTOLOGY.test(uu + pp) || COMMENT.test(uu + pp);
        if (alters) out.textContent = 'RESULT (simulated): AUTHENTICATION BYPASSED\n\nThe input contained quote characters and SQL syntax, so it changed the structure of the query instead of being treated as data. A real vulnerable application could then log the visitor in without knowing a password, or expose data.\n\nRoot cause: user input was concatenated into the SQL string.';
        else if (USERS[uu] && USERS[uu] === pp) out.textContent = 'RESULT: login OK for "' + uu + '" (normal behaviour).';
        else out.textContent = 'RESULT: login failed (normal behaviour).\n\nTry the "Injection-style input" example to see how concatenation lets input change the query logic.';
      } else {
        q.firstChild.textContent = "SELECT * FROM users\n WHERE username = ?\n   AND password_hash = ?;\n-- bound values: [" + JSON.stringify(uu) + ', hash(' + JSON.stringify(pp) + ')]';
        out.textContent = USERS[uu] && USERS[uu] === pp ? 'RESULT: login OK for "' + uu + '".' : 'RESULT: Invalid credentials.\n\nParameterised queries send the SQL structure and the values separately, so quotes and SQL keywords inside the input are just characters. The injection-style examples now fail like any wrong password.';
      }
    }
    [u, p].forEach((i) => i.addEventListener('input', run));
    run();
    return simCard('Training Portal login (SQL injection concept)', 'No database exists: the "query" is just a displayed string and the outcome is decided by simple pattern logic. Compare string concatenation with parameterised queries.',
      h('div', null, mode.el, h('div', { class: 'grid grid-2' }, h('div', { class: 'field' }, h('label', { for: 'sq-u' }, 'Username'), u), h('div', { class: 'field' }, h('label', { for: 'sq-p' }, 'Password (training value)'), p)), examples, h('h4', null, 'Query the server builds'), q, out,
        h('p', { class: 'muted', css: { fontSize: '.85rem' } }, 'Valid training logins: student / learn123.')));
  }

  /* 2. Comment board — XSS / output encoding concept */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  function xssSim() {
    const ta = h('textarea', { id: 'xs-in', rows: '3', maxlength: '300', 'aria-label': 'Comment text' }); ta.value = 'Great course! <b>bold?</b> <img src=x onerror=alert(1)>';
    const mode = modeToggle(() => run());
    const rendered = h('div', { class: 'result-box' }), explain = h('div', { class: 'result-box' }), encoded = h('pre', null, h('code', null, ''));
    function run() {
      const v = ta.value.slice(0, 300), tags = v.match(/<\/?[a-z][^>]*>/gi) || [];
      // IMPORTANT: always textContent. We never insert user input as HTML, even in the "vulnerable" mode.
      rendered.textContent = v;
      if (mode.get()) explain.textContent = tags.length ? 'A VULNERABLE app would pass this string to innerHTML. The browser would parse ' + tags.length + ' HTML tag(s): ' + tags.join(' ') + '\nAn attacker-controlled attribute such as onerror could then run script in every visitor\'s browser with the site\'s privileges.\n\n(CyberForge shows the raw text above and never inserts it as HTML.)' : 'No HTML tags in this comment. A vulnerable app would still be at risk as soon as one appears.';
      else explain.textContent = 'The FIXED app encodes output for the HTML context (or uses textContent). Tags become harmless text:\n\n' + (tags.length ? 'The ' + tags.length + ' tag(s) are displayed literally and never parsed.' : 'Nothing to neutralise in this input.');
      encoded.firstChild.textContent = esc(v);
    }
    ta.addEventListener('input', run); run();
    return simCard('Comment board (cross-site scripting concept)', 'This simulator only DISPLAYS what a vulnerable page would do. Your input is always rendered as plain text.',
      h('div', null, mode.el, h('div', { class: 'field' }, h('label', { for: 'xs-in' }, 'Comment'), ta), h('h4', null, 'What visitors see (plain text, safe)'), rendered, h('h4', { css: { marginTop: '12px' } }, 'What would happen'), explain, h('h4', { css: { marginTop: '12px' } }, 'Contextually encoded output'), encoded));
  }

  /* 3. Document viewer — path traversal concept */
  function pathSim() {
    const FILES = { 'report.pdf': '[binary PDF — public report]', 'logo.png': '[binary PNG — company logo]', '../config/app.conf': 'db_host=10.0.0.9\ndb_user=app\ndb_pass=EXAMPLE-ONLY-NOT-REAL\n(fictional file outside the public folder)' };
    const BASE = ['srv', 'app', 'public'];
    const inp = h('input', { id: 'pt-in', type: 'text', maxlength: '80', value: 'report.pdf', autocomplete: 'off', 'aria-label': 'File name' }), out = resultBox(), mode = modeToggle(() => run());
    const ex = h('div', { class: 'btn-row', css: { margin: '10px 0' } }, ['report.pdf', '../config/app.conf', '..%2fconfig%2fapp.conf'].map((v) => h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { inp.value = v; run(); } }, v)));
    function norm(path) { const parts = []; path.split('/').forEach((s) => { if (!s || s === '.') return; if (s === '..') parts.pop(); else parts.push(s); }); return parts; }
    function run() {
      const raw = inp.value.slice(0, 80);
      let decoded = raw; try { decoded = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
      const resolved = norm(BASE.join('/') + '/' + decoded), full = '/' + resolved.join('/'), inside = resolved.slice(0, 3).join('/') === BASE.join('/');
      const lines = ['Requested : ' + raw, 'Resolved  : ' + full];
      if (mode.get()) {
        lines.push('Check     : none (path appended to /srv/app/public)');
        const hit = FILES[decoded] !== undefined ? FILES[decoded] : null;
        lines.push('', inside ? (hit ? 'RESULT: 200 OK — ' + hit : 'RESULT: 404 Not Found') : 'RESULT (simulated): file OUTSIDE the public folder would be served:\n' + (hit || '[some other server file]') + '\n\nRoot cause: the path was built from user input and never validated.');
      } else {
        lines.push('Check     : canonicalise, then require path to stay inside /srv/app/public', '', inside ? (FILES[decoded] ? 'RESULT: 200 OK — ' + FILES[decoded] : 'RESULT: 404 Not Found') : 'RESULT: 403 Forbidden — resolved path escapes the base directory.\nEncoded variants (%2f) are decoded before the check, so they fail too.');
      }
      out.textContent = lines.join('\n');
    }
    inp.addEventListener('input', run); run();
    return simCard('Document viewer (path traversal concept)', 'A fake file server with a virtual folder. No real file is ever read.', h('div', null, mode.el, h('div', { class: 'field' }, h('label', { for: 'pt-in' }, 'GET /download?file='), inp), ex, out));
  }

  /* 4. Security header analyzer */
  const SAMPLE_HEADERS = 'HTTP/1.1 200 OK\nServer: Apache/2.2.15 (CentOS)\nX-Powered-By: PHP/5.3.3\nContent-Type: text/html\nSet-Cookie: sid=abc123; Path=/\nStrict-Transport-Security: max-age=300';
  const GOOD_HEADERS = 'HTTP/1.1 200 OK\nContent-Security-Policy: default-src \'self\'; frame-ancestors \'none\'\nStrict-Transport-Security: max-age=31536000; includeSubDomains\nX-Content-Type-Options: nosniff\nReferrer-Policy: strict-origin-when-cross-origin\nPermissions-Policy: camera=(), microphone=(), geolocation=()\nSet-Cookie: __Host-sid=abc; Secure; HttpOnly; SameSite=Lax; Path=/';
  function headerAnalyzer() {
    const ta = h('textarea', { id: 'hd-in', rows: '9', maxlength: '4000', 'aria-label': 'HTTP response headers' }); ta.value = SAMPLE_HEADERS;
    const out = h('div', { 'aria-live': 'polite' });
    function analyze() {
      const hdr = {}, cookies = [];
      ta.value.split('\n').slice(0, 60).forEach((ln) => { const m = ln.match(/^([A-Za-z][A-Za-z0-9-]{0,40}):\s*(.*)$/); if (m) { const k = m[1].toLowerCase(); if (k === 'set-cookie') cookies.push(m[2]); else hdr[k] = m[2]; } });
      const checks = [];
      const add = (pts, ok, name, why) => checks.push({ pts, ok, name, why });
      const csp = hdr['content-security-policy'];
      add(20, !!csp && !/unsafe-inline|unsafe-eval|\*/.test(csp), 'Content-Security-Policy', !csp ? 'Missing: add a CSP to restrict script and content sources.' : /unsafe-inline|unsafe-eval|\*/.test(csp) ? 'Present but weakened by unsafe-inline/unsafe-eval or wildcards.' : 'Present and restrictive.');
      const hsts = hdr['strict-transport-security'], age = hsts && Number((hsts.match(/max-age=(\d+)/) || [])[1]);
      add(20, !!hsts && age >= 15552000, 'Strict-Transport-Security', !hsts ? 'Missing: forces browsers to use HTTPS.' : age >= 15552000 ? 'Present with a long max-age.' : 'max-age is too short (use at least 6 months, ideally 1 year).');
      add(10, (hdr['x-content-type-options'] || '').toLowerCase() === 'nosniff', 'X-Content-Type-Options', 'Should be "nosniff" to stop MIME sniffing.');
      add(10, !!hdr['referrer-policy'], 'Referrer-Policy', 'Limits what URL information is shared with other sites.');
      add(10, !!hdr['permissions-policy'], 'Permissions-Policy', 'Restricts powerful browser features.');
      add(10, !!hdr['x-frame-options'] || /frame-ancestors/.test(csp || ''), 'Clickjacking protection', 'Use CSP frame-ancestors (or X-Frame-Options).');
      const cookieOk = cookies.length ? cookies.every((c) => /;\s*secure/i.test(c) && /;\s*httponly/i.test(c) && /;\s*samesite=/i.test(c)) : true;
      add(10, cookieOk, 'Cookie flags', cookies.length ? (cookieOk ? 'All cookies have Secure, HttpOnly and SameSite.' : 'At least one cookie lacks Secure, HttpOnly or SameSite.') : 'No cookies in this response.');
      const leak = /\d+\.\d+/.test((hdr['server'] || '') + (hdr['x-powered-by'] || ''));
      add(10, !leak, 'Version disclosure', leak ? 'Server/X-Powered-By reveals software versions — remove or genericise.' : 'No version banners detected.');
      const score = checks.reduce((a, c) => a + (c.ok ? c.pts : 0), 0);
      CF.clear(out).append(h('div', { class: 'stats', css: { margin: '12px 0' } }, h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Score'), h('div', { class: 'value ' + (score >= 80 ? 'green' : ''), css: score < 50 ? { color: 'var(--red)' } : null }, score + ' / 100'))),
        h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Check', 'Result', 'Notes'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, checks.map((c) => h('tr', null, h('td', null, c.name), h('td', null, h('span', { class: 'pill ' + (c.ok ? 'green' : 'red') }, c.ok ? 'PASS' : 'FIX')), h('td', null, c.why)))))));
    }
    ta.addEventListener('input', analyze); analyze();
    return simCard('Security header analyzer', 'Paste response headers from your own lab app (or use a sample). Analysis is pure text parsing — no requests are made.',
      h('div', null, h('div', { class: 'btn-row', css: { marginBottom: '10px' } }, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { ta.value = SAMPLE_HEADERS; analyze(); } }, 'Weak sample'), h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { ta.value = GOOD_HEADERS; analyze(); } }, 'Hardened sample')),
        h('div', { class: 'field' }, h('label', { for: 'hd-in' }, 'Response headers'), ta), out));
  }

  CF.pages['web-security'] = function () {
    const page = h('div'), wrap = h('div', { class: 'container section-sm' });
    page.append(CF.pageHead('web-security', 'Web Security', 'Understand how web applications fail and how to defend them — using completely simulated, intentionally vulnerable training apps that run only in your browser.', 'Course · Level 6'), wrap);
    wrap.appendChild(h('div', { class: 'notice' }, h('b', null, 'Simulations only. '), 'None of the apps below touch a real website, database or server. Never test real systems without written authorization.'));
    const ids = ['lessons', 'simulators'];
    const x = location.hash.slice(1);
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Lessons (13)', render: () => CF.renderCourse('web', { hideTitle: true }) },
      { id: 'simulators', label: 'Training simulators', render: () => h('div', { id: 'simulators-box' }, h('h2', null, 'Vulnerable training applications'), sqlSim(), xssSim(), pathSim(), headerAnalyzer()) }
    ], ids.includes(x) ? x : 'lessons'));
    return page;
  };
})();
