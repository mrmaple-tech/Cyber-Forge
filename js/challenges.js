/*
 * Challenges + Daily Security Challenge.
 * Scoring: challenge completed +250 XP, perfect (no mistakes) +100 bonus XP. Daily: +150 XP.
 * All challenges are safe, simulated and use fictional data.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  const S = (q, options, answer, explain) => ({ type: 'choice', q, options, answer, explain });
  const T = (q, answers, explain, hint, placeholder) => ({ type: 'text', q, answers, explain, hint, placeholder });
  const M = (q, options, answers, explain) => ({ type: 'multi', q, options, answers, explain });

  CF.CHALLENGE_TYPES = ['Multiple choice', 'Terminal simulation', 'Log analysis', 'Network analysis', 'Security configuration', 'Web security simulation', 'Cryptography', 'Linux mission', 'Forensics'];

  const RAW = [
    { id: 'ch-mc-01', type: 'Multiple choice', skill: 'cyber', title: 'Security Fundamentals Sprint', diff: 'Beginner', intro: 'Five quick questions on core concepts.',
      steps: [S('Which element of the CIA triad does hashing most directly support?', ['Confidentiality', 'Integrity', 'Availability', 'Anonymity'], 1, 'Hashes detect changes, supporting integrity.'),
        S('Which is an example of "something you have"?', ['Password', 'Hardware security key', 'Fingerprint', 'PIN you memorise'], 1, 'A token you possess is a possession factor.'),
        S('Which port is associated with HTTPS?', ['21', '80', '443', '3389'], 2, 'HTTPS defaults to 443.'),
        S('What is the safest response to an unexpected "password expires" email?', ['Click and sign in', 'Report it via the official process', 'Forward to friends', 'Reply with your password'], 1, 'Report suspicious email.'),
        S('Which backup approach is recommended?', ['One copy on the same disk', '3-2-1 with an offline/immutable copy', 'Cloud only, never tested', 'No backups'], 1, '3-2-1 plus tested restores.')] },
    { id: 'ch-term-01', type: 'Terminal simulation', skill: 'linux', title: 'Evidence Folder Setup', diff: 'Beginner', intro: 'Prepare a case folder in the simulated terminal.',
      steps: [{ type: 'terminal', q: 'Create `~/Labs/case01/evidence` (use `mkdir -p`) and then create `~/Labs/case01/evidence/chain-of-custody.txt`.', explain: 'Structured case folders support reproducible work.', mission: { id: 'ch-term-01-m', text: 'Create ~/Labs/case01/evidence and chain-of-custody.txt inside it.', hint: 'mkdir -p ~/Labs/case01/evidence && touch ... (run the commands separately).', check: (c) => c.isFile('/home/student/Labs/case01/evidence/chain-of-custody.txt') } }] },
    { id: 'ch-log-01', type: 'Log analysis', skill: 'secops', title: 'Spot the Compromised Account', diff: 'Intermediate', intro: 'Analyse this fictional authentication log.',
      artifacts: [{ title: 'auth.log (fictional)', text: '08:55:10 OK    user=ana   src=198.51.100.10 (office)\n09:30:02 OK    user=ben   src=198.51.100.11 (office)\n13:02:44 FAIL  user=cara  src=203.0.113.9\n13:02:50 FAIL  user=cara  src=203.0.113.9\n13:02:58 FAIL  user=cara  src=203.0.113.9\n13:03:07 OK    user=cara  src=203.0.113.9 (new country)\n13:05:30 OK    user=cara  action=mailbox-rule-created forward=external' }],
      steps: [S('Which account is most likely compromised?', ['ana', 'ben', 'cara', 'None'], 2, 'Failures, then success from a new location, then a forwarding rule.'),
        S('Which event is the strongest persistence/exfiltration indicator?', ['The office logins', 'The mailbox forwarding rule to an external address', 'The first failure', 'The time zone'], 1, 'Attackers create forwarding rules to keep receiving mail.'),
        T('What is the source IP of the suspicious activity?', ['203.0.113.9'], 'All of cara\'s events come from 203.0.113.9.', 'Look at the FAIL lines.', 'x.x.x.x')] },
    { id: 'ch-net-01', type: 'Network analysis', skill: 'networking', title: 'Beaconing Detection', diff: 'Intermediate', intro: 'Review these fictional flow records.',
      artifacts: [{ title: 'Flow records (fictional)', text: 'time      src          dst              port  bytes\n02:00:00  10.0.0.23     198.51.100.77    443   612\n02:01:00  10.0.0.23     198.51.100.77    443   608\n02:02:01  10.0.0.23     198.51.100.77    443   615\n02:03:00  10.0.0.23     198.51.100.77    443   610\n02:03:15  10.0.0.40     203.0.113.80     443   52,300\n02:04:00  10.0.0.23     198.51.100.77    443   611' }],
      steps: [S('Which pattern suggests beaconing?', ['Regular ~60s connections with similar small sizes to one destination', 'A single large download', 'A DNS query', 'A ping'], 0, 'Regular intervals and consistent payload sizes are typical of automated check-ins.'),
        S('Which host should you investigate first?', ['10.0.0.23', '10.0.0.40', 'Neither', 'Both equally'], 0, 'It shows the periodic pattern.'),
        S('Why can you analyse this even though traffic is encrypted?', ['Metadata (timing, size, destination) remains visible', 'You cannot', 'Encryption is weak', 'Flows contain passwords'], 0, 'Metadata analysis works on encrypted traffic.')] },
    { id: 'ch-cfg-01', type: 'Security configuration', skill: 'cyber', title: 'Harden an SSH Server', diff: 'Intermediate', intro: 'Choose secure settings for a fictional server.',
      steps: [M('Which sshd settings improve security? (select all)', ['PermitRootLogin no', 'PasswordAuthentication no (use keys)', 'PermitEmptyPasswords yes', 'AllowUsers admin-team', 'Port 22 open to the entire internet with weak passwords'], [0, 1, 3], 'Disable root login and password auth, restrict users. Empty passwords and weak public exposure are poor practice.'),
        S('Which additional control reduces brute-force risk?', ['Rate limiting / fail2ban-style blocking', 'Larger fonts', 'Disabling logs', 'Using Telnet'], 0, 'Automatically throttling repeated failures helps.')] },
    { id: 'ch-cfg-02', type: 'Security configuration', skill: 'cyber', title: 'Firewall Rule Review', diff: 'Intermediate', intro: 'Review the rule list for a fictional web server.',
      artifacts: [{ title: 'Firewall rules', text: '1 allow tcp any -> 10.0.0.5:443\n2 allow tcp any -> 10.0.0.5:22\n3 allow tcp any -> 10.0.0.5:3306\n4 allow tcp 10.0.9.0/24 -> 10.0.0.5:22\n5 deny  any -> any' }],
      steps: [M('Which rules are risky? (select all)', ['Rule 2: SSH from anywhere', 'Rule 3: database port open to anyone', 'Rule 1: HTTPS to the web server', 'Rule 5: default deny'], [0, 1], 'Rules 1, 4 and 5 are sensible; 2 and 3 expose administrative and database services.'),
        S('What is the best fix for rule 2?', ['Remove it and rely on rule 4 (admin subnet only)', 'Keep it', 'Add allow all', 'Disable logging'], 0, 'Restrict SSH to an admin network.')] },
    { id: 'ch-web-01', type: 'Web security simulation', skill: 'web', title: 'Fix the Query (Simulated)', diff: 'Intermediate', intro: 'Pure code-reading exercise against a fictional login handler.',
      artifacts: [{ title: 'Option snippets', text: 'A) db.query("SELECT * FROM users WHERE name=\'" + name + "\'")\nB) db.query("SELECT * FROM users WHERE name = ?", [name])\nC) name = name.replace("\'", "")\n   db.query("SELECT * FROM users WHERE name=\'" + name + "\'")' }],
      steps: [S('Which snippet is safest?', ['A', 'B', 'C', 'All equal'], 1, 'Parameterised queries (B) keep data separate from SQL.'),
        S('Why is C inadequate?', ['Manual filtering is easy to get wrong or bypass', 'It is slower', 'It uses replace', 'It is correct'], 0, 'Defence by deny-listing characters is fragile.'),
        S('Which additional control limits damage if a flaw exists?', ['Least-privilege database account', 'Dark mode', 'Longer table names', 'More cookies'], 0, 'The app account should not have admin rights.')] },
    { id: 'ch-web-02', type: 'Web security simulation', skill: 'web', title: 'Cookie Hardening', diff: 'Beginner', intro: 'Pick the best session cookie.',
      steps: [S('Which Set-Cookie header is the most secure?', ['sid=1234; Path=/', 'sid=<random>; Secure; HttpOnly; SameSite=Lax; Path=/', 'sid=<random>; HttpOnly', 'user=admin; Path=/'], 1, 'Secure, HttpOnly and SameSite together defend against sniffing, script theft and CSRF.'),
        S('What does HttpOnly prevent?', ['JavaScript reading the cookie', 'The browser sending the cookie', 'HTTPS', 'Cookie expiry'], 0, 'It limits impact of XSS.')] },
    { id: 'ch-cry-01', type: 'Cryptography', skill: 'cyber', title: 'Decode and Verify', diff: 'Beginner', intro: 'Public/fictional values only.',
      steps: [T('Decode the Caesar cipher (shift 3 back): `VHFXULWB`', ['security'], 'V→S, H→E, F→C, X→U, U→R, L→I, W→T, B→Y = SECURITY.', 'Subtract 3 from each letter.', 'plain text'),
        S('Which should you use to store passwords?', ['Argon2/bcrypt with salt', 'Base64', 'MD5', 'Caesar cipher'], 0, 'Slow, salted password hashing.'),
        S('Which uses a public/private key pair?', ['AES', 'RSA', 'SHA-256', 'Base64'], 1, 'RSA is asymmetric.')] },
    { id: 'ch-lnx-01', type: 'Linux mission', skill: 'linux', title: 'Find the Hidden Audit Token', diff: 'Beginner', intro: 'Navigate the simulated filesystem.',
      steps: [{ type: 'terminal', q: 'Read the hidden `.audit-token` file inside `~/Labs/lab01` (hint: `ls -a`).', explain: 'Hidden files begin with a dot and need -a to be listed.', mission: { id: 'ch-lnx-01-m', text: 'Display the contents of ~/Labs/lab01/.audit-token', hint: 'cd ~/Labs/lab01; ls -a; cat .audit-token', check: (c) => c.events.cat.has('/home/student/Labs/lab01/.audit-token') } },
        T('What is the audit token value you found? (format: CF-####-WORD-WORD)', ['cf-7731-hidden-ok'], 'The token was CF-7731-HIDDEN-OK.', 'It starts with CF-7731.', 'CF-....')] },
    { id: 'ch-for-01', type: 'Forensics', skill: 'forensics', title: 'Order the Timeline', diff: 'Intermediate', intro: 'Reconstruct events from fictional artefacts.',
      artifacts: [{ title: 'Artefacts (UTC)', text: 'A  22:19  Outbound transfer 1.2 GB to 198.51.100.77\nB  22:13  USB device attached\nC  22:25  Security log cleared\nD  22:14  Archive file created in /tmp' }],
      steps: [S('What is the correct order of events?', ['B → D → A → C', 'A → B → C → D', 'C → B → D → A', 'D → A → B → C'], 0, 'USB attached (22:13), archive created (22:14), transfer (22:19), log cleared (22:25).'),
        S('What does clearing the log last suggest?', ['Possible attempt to hide activity', 'Routine maintenance, certainly', 'A hardware fault', 'Nothing can be inferred'], 0, 'It is suspicious and warrants investigation, though intent must be proven.')] },
    { id: 'ch-ops-01', type: 'Log analysis', skill: 'secops', title: 'Web Server Anomalies', diff: 'Advanced', intro: 'Review fictional web logs.',
      artifacts: [{ title: 'access.log (fictional)', text: '203.0.113.7 "GET /index.html" 200\n203.0.113.7 "GET /files?name=../../etc/passwd" 400\n203.0.113.7 "GET /files?name=..%2f..%2fetc%2fpasswd" 400\n203.0.113.7 "GET /search?q=<script>alert(1)</script>" 200\n198.51.100.20 "GET /products?id=5" 200' }],
      steps: [S('What type of activity do requests 2 and 3 resemble?', ['Path traversal attempts', 'Normal browsing', 'DNS lookups', 'Backups'], 0, 'They try to climb directories with ../ and an encoded variant.'),
        S('Request 4 resembles…', ['A cross-site scripting probe', 'A login', 'A file upload', 'A cache hit'], 0, 'Injected script tags are a common XSS probe.'),
        S('Best response?', ['Block/monitor the source, confirm the app encodes output and validates paths, review for any 200 responses', 'Ignore', 'Shut the company down', 'Delete logs'], 0, 'Contain, verify defences and check for success.')] }
  ];

  CF.CHALLENGES = RAW.map((r) => ({ id: r.id, type: r.type, skill: r.skill, title: r.title, difficulty: r.diff, xp: CF.XP.challenge, intro: r.intro, artifacts: r.artifacts, steps: r.steps }));

  function customChallenges() {
    return CF.db.customList('challenges').map((c) => ({ id: c.id, type: 'Multiple choice', skill: 'cyber', title: c.title, difficulty: c.difficulty, xp: c.xp, intro: c.intro, custom: true, steps: [S(c.q, c.options, c.answer, c.explain || 'Correct.')] }));
  }
  CF.allChallenges = () => CF.CHALLENGES.concat(customChallenges());

  /* ---------------- Daily challenge (rotating, local) ---------------- */
  const DAILY = [
    { title: 'Analyze this authentication log', skill: 'secops', artifacts: [{ title: 'auth.log (fictional)', text: '07:01 FAIL user=root src=203.0.113.50\n07:01 FAIL user=root src=203.0.113.50\n07:02 FAIL user=admin src=203.0.113.50\n07:02 FAIL user=test src=203.0.113.50\n07:03 OK   user=test src=203.0.113.50' }], steps: [S('What is the most concerning event?', ['The final successful login for "test"', 'The first failure', 'The time', 'The log file name'], 0, 'A success after guessing common usernames suggests a weak or default account.')] },
    { title: 'Spot the weak control', skill: 'cyber', artifacts: [{ title: 'Policy excerpt', text: 'Passwords: min 6 chars, must include a number.\nRotation: every 30 days.\nMFA: optional.\nLockout: none.' }], steps: [S('Which change improves security the most?', ['Require MFA and block breached/common passwords', 'Rotate every 7 days', 'Require "!" at the end', 'Reduce minimum to 4'], 0, 'MFA and breached-password checks beat forced rotation.')] },
    { title: 'Decode the note', skill: 'cyber', steps: [T('Decode this Base64: `U3RheSBhbGVydA==`', ['stay alert'], 'Base64 decodes to "Stay alert".', 'Base64 → text', 'plain text')] },
    { title: 'Read the permissions', skill: 'linux', artifacts: [{ title: 'ls -l', text: '-rwxr-x--- 1 root ops deploy.sh' }], steps: [T('What is the octal mode of deploy.sh?', ['750'], 'rwx=7, r-x=5, ---=0 → 750.', 'Add r=4 w=2 x=1 per group.', 'e.g. 644')] },
    { title: 'Which port?', skill: 'networking', steps: [S('Which service normally listens on TCP 22?', ['SSH', 'DNS', 'HTTP', 'SMTP'], 0, 'SSH uses port 22.')] },
    { title: 'Cookie flags', skill: 'web', steps: [S('Which cookie attribute helps prevent JavaScript from reading a session cookie?', ['HttpOnly', 'Path', 'Expires', 'Domain'], 0, 'HttpOnly blocks document.cookie access.')] },
    { title: 'Triage priority', skill: 'secops', steps: [S('Which alert should be triaged first?', ['Successful admin login from a new country after many failures', 'Single failed login at 9am', 'Printer offline', 'Scheduled scan finished'], 0, 'Success after failures from a new location on a privileged account is highest risk.')] },
    { title: 'Evidence handling', skill: 'forensics', steps: [S('What should you do before analysing a suspect disk?', ['Create a hashed forensic image and work on the copy', 'Boot from it', 'Delete temp files', 'Run a defrag'], 0, 'Preserve the original.')] }
  ];

  CF.dailyToday = function () {
    const date = CF.today();
    const day = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 86400000);
    const d = DAILY[day % DAILY.length];
    return Object.assign({ id: 'daily-' + date, category: 'Daily', intro: 'Today\'s rotating security challenge — completed locally in your browser.', xp: CF.XP.daily }, d);
  };

  CF.dailyCard = function (compact) {
    const d = CF.dailyToday();
    const card = h('div', { class: 'card daily' });
    const body = h('div');
    const draw = () => {
      CF.clear(body);
      const done = CF.store.isDone('daily', d.id);
      body.append(
        h('span', { class: 'kicker' }, 'Daily Security Challenge'),
        h('h3', null, d.title),
        h('div', { class: 'meta-row' }, h('span', { class: 'pill green' }, 'Reward: +' + d.xp + ' XP'), done ? h('span', { class: 'pill cyan' }, 'COMPLETED') : h('span', { class: 'pill amber' }, 'Available today')),
        done ? h('p', { class: 'reward' }, 'COMPLETED  +' + d.xp + ' XP') : null);
      if (!done && compact) body.appendChild(h('a', { class: 'btn btn-primary btn-sm', href: 'challenges.html#daily' }, 'Take today\'s challenge'));
      if (!compact) {
        const play = h('div', { css: { marginTop: '12px' } });
        body.appendChild(play);
        if (done) body.appendChild(h('p', { class: 'muted' }, 'Come back tomorrow for a new one.'));
        else CF.scenario.mount(play, d, { kind: 'daily', xp: d.xp });
      }
    };
    draw();
    card.appendChild(body);
    return card;
  };

  /* ---------------- Challenges page ---------------- */
  CF.pages = CF.pages || {};
  CF.pages.challenges = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('challenges', 'Challenges', 'Apply what you know. Completing a challenge earns +' + CF.XP.challenge + ' XP, and a perfect run earns +' + CF.XP.challengeBonus + ' bonus XP. All scenarios are simulated.', 'Practice'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const daily = h('div', { id: 'daily' }, CF.dailyCard(false));
    wrap.appendChild(daily);
    wrap.appendChild(h('hr', { class: 'divider' }));
    const list = h('div'), detail = h('div', { hidden: true });
    wrap.append(h('h2', null, 'All challenges'), list, detail);
    let type = 'All';

    function open(c) {
      list.hidden = true; detail.hidden = false; CF.clear(detail);
      detail.append(
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => { detail.hidden = true; list.hidden = false; draw(); } }, '← Back to challenges'),
        h('h2', { css: { marginTop: '18px' } }, c.title),
        h('div', { class: 'meta-row' }, h('span', { class: 'pill violet' }, c.type), CF.diffPill(c.difficulty), h('span', { class: 'pill green' }, '+' + c.xp + ' XP'), h('span', { class: 'pill amber' }, '+' + CF.XP.challengeBonus + ' perfect bonus')));
      CF.scenario.mount(detail, c, { kind: 'challenge', xp: c.xp, bonus: true });
      window.scrollTo(0, 0);
    }

    function draw() {
      CF.clear(list);
      const all = CF.allChallenges();
      const done = all.filter((c) => CF.store.isDone('challenge', c.id)).length;
      list.append(
        h('div', { class: 'stats', css: { marginBottom: '20px' } }, h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Completed'), h('div', { class: 'value green' }, done + ' / ' + all.length))),
        h('div', { class: 'filters' }, ['All'].concat(CF.CHALLENGE_TYPES).map((t) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(type === t), onclick: () => { type = t; draw(); } }, t))));
      const shown = all.filter((c) => type === 'All' || c.type === type);
      if (!shown.length) return list.appendChild(h('div', { class: 'empty' }, 'No challenges of this type yet.'));
      list.appendChild(h('div', { class: 'grid grid-3' }, shown.map((c) => {
        const d = CF.store.isDone('challenge', c.id);
        return h('article', { class: 'card lab-card' + (d ? ' complete' : '') },
          h('span', { class: 'kicker' }, c.type), h('h3', null, c.title), h('p', { class: 'muted grow', css: { fontSize: '.9rem' } }, c.intro),
          h('div', { class: 'meta-row' }, CF.diffPill(c.difficulty), h('span', { class: 'pill green' }, c.xp + ' XP'), c.custom ? h('span', { class: 'pill' }, 'custom') : null),
          h('button', { class: 'btn btn-sm ' + (d ? '' : 'btn-primary'), type: 'button', onclick: () => open(c) }, d ? 'Replay' : 'Start challenge'));
      })));
    }
    draw();
    return page;
  };
})();
