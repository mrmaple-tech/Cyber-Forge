/*
 * Scenario engine + Labs dashboard.
 *
 * A scenario is a guided investigation: an intro, optional alert + evidence artifacts, and steps.
 * Step types: choice | multi | text | terminal.  Everything is simulated, fictional data.
 * Fictional addresses use documentation ranges (RFC 5737/3849) and example domains (RFC 2606).
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, '');

  /* ---------------- Scenario engine ---------------- */
  CF.scenario = {
    /** opts: { kind:'lab'|'challenge'|'daily', xp, bonus:boolean, onDone } */
    mount(container, sc, opts) {
      opts = opts || {};
      const kind = opts.kind || 'lab';
      const xp = opts.xp != null ? opts.xp : sc.xp;
      let i = 0, mistakes = 0;
      const root = h('div', { class: 'scenario' });
      container.appendChild(root);

      const evidence = h('div');
      if (sc.alert) {
        evidence.appendChild(h('div', { class: 'alert-box', role: 'note' }, h('h4', null, sc.alert.title || 'SECURITY ALERT'),
          h('ul', null, sc.alert.lines.map((l) => h('li', null, h('b', null, l[0]), ' ' + l[1])))));
      }
      (sc.artifacts || []).forEach((a) => evidence.appendChild(h('div', { class: 'artifact' }, h('div', { class: 'at' }, a.title), h('pre', null, h('code', null, a.text)))));

      const stepBox = h('div');
      const prog = h('div');
      root.append(sc.intro ? CF.p(sc.intro) : null, evidence, prog, stepBox);

      function advance() { i++; i < sc.steps.length ? render() : finish(); }

      function render() {
        CF.clear(stepBox); CF.clear(prog);
        prog.appendChild(h('div', { class: 'quiz-head', css: { marginTop: '10px' } }, h('span', null, 'STEP ' + (i + 1) + ' / ' + sc.steps.length), h('span', null, 'Mistakes: ' + mistakes)));
        prog.appendChild(CF.bar(Math.round((i / sc.steps.length) * 100)));
        const s = sc.steps[i];
        const card = h('div', { class: 'quiz', css: { marginTop: '14px' } });
        stepBox.appendChild(card);
        const fb = h('div', { 'aria-live': 'polite' });
        const next = () => h('div', { class: 'quiz-actions' }, h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: advance }, i + 1 < sc.steps.length ? 'Next step' : 'Finish'));
        const good = (extra) => { CF.clear(fb); fb.append(h('div', { class: 'feedback good' }, h('strong', null, 'Correct. '), CF.rich(s.explain || '')), next()); if (extra) extra(); };
        const bad = (msg) => { mistakes++; prog.firstChild.lastChild.textContent = 'Mistakes: ' + mistakes; CF.clear(fb); fb.appendChild(h('div', { class: 'feedback bad' }, msg || 'Not quite. Re-read the evidence and try again.')); };

        if (s.type === 'terminal') {
          card.append(h('p', { class: 'quiz-q' }, CF.rich(s.q || 'Complete the mission in the simulated terminal.')));
          const holder = h('div');
          card.append(holder, fb);
          let finished = false;
          CF.terminal.mount(holder, { missions: [Object.assign({ custom: true, n: 1 }, s.mission)], tall: false, onMission: () => { if (finished) return; finished = true; good(); } });
          return;
        }
        card.appendChild(h('p', { class: 'quiz-q' }, CF.rich(s.q)));
        if (s.type === 'text') {
          const inp = h('input', { type: 'text', maxlength: '80', autocomplete: 'off', 'aria-label': 'Your answer', placeholder: s.placeholder || 'Type your answer' });
          const btn = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Submit answer');
          const check = () => { const v = norm(inp.value.slice(0, 80)); if (!v) return; s.answers.map(norm).includes(v) ? (inp.disabled = btn.disabled = true, good()) : bad(s.hint ? 'Not quite. Hint: ' + s.hint : null); };
          btn.addEventListener('click', check);
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
          card.append(h('div', { class: 'field' }, inp), h('div', { class: 'quiz-actions' }, btn), fb);
        } else if (s.type === 'multi') {
          const boxes = s.options.map((o, k) => h('label', { class: 'opt', css: { marginBottom: 0, color: 'var(--text)', fontWeight: 400, fontSize: '.95rem', cursor: 'pointer' } }, h('input', { type: 'checkbox', value: String(k), css: { width: 'auto', marginRight: '6px' } }), h('span', null, o)));
          const btn = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Check selection');
          btn.addEventListener('click', () => {
            const picked = boxes.map((b, k) => (b.firstChild.checked ? k : -1)).filter((k) => k >= 0);
            const ok = picked.length === s.answers.length && s.answers.every((a) => picked.includes(a));
            if (ok) { boxes.forEach((b) => (b.firstChild.disabled = true)); btn.disabled = true; good(); } else bad('Not quite. Select every correct item and nothing else.');
          });
          card.append(h('div', { class: 'opts' }, boxes), h('div', { class: 'quiz-actions' }, btn), fb);
        } else {
          const opts2 = s.options.map((o, k) => h('button', {
            class: 'opt', type: 'button', onclick: (e) => {
              if (k === s.answer) { opts2.forEach((b) => (b.disabled = true)); e.currentTarget.classList.add('correct'); good(); }
              else { e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true; bad(); }
            }
          }, h('span', { class: 'k' }, LETTERS[k] + '.'), h('span', null, o)));
          card.append(h('div', { class: 'opts' }, opts2), fb);
        }
      }

      function finish() {
        CF.clear(stepBox); CF.clear(prog);
        const perfect = mistakes === 0;
        const label = sc.title + ' complete';
        const awarded = CF.store.complete(kind, sc.id, { xp, skill: sc.skill, label });
        let bonus = 0;
        if (awarded && opts.bonus && perfect) bonus = CF.store.bonus(sc.id, CF.XP.challengeBonus, 'Perfect score bonus');
        const label2 = kind === 'lab' ? 'LAB COMPLETE' : kind === 'daily' ? 'COMPLETED' : 'CHALLENGE COMPLETE';
        stepBox.appendChild(h('div', { class: 'quiz', css: { marginTop: '14px' } },
          h('div', { class: 'quiz-head' }, h('span', null, label2)),
          h('div', { class: 'score-ring' }, awarded ? '+' + (awarded + bonus) + ' XP' : 'Done'),
          h('p', null, perfect ? 'Perfect run — no mistakes.' : 'Finished with ' + mistakes + ' mistake' + (mistakes === 1 ? '' : 's') + '. Review the explanations to lock in the learning.'),
          bonus ? h('p', null, h('span', { class: 'reward' }, 'Perfect score +' + bonus + ' bonus XP')) : null,
          !awarded ? h('p', { class: 'muted' }, 'XP for this item was already earned — replays are for practice.') : null,
          h('div', { class: 'quiz-actions' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { i = 0; mistakes = 0; render(); } }, 'Replay'))));
        if (opts.onDone) opts.onDone(awarded, perfect);
      }
      render();
      return root;
    }
  };

  /* ---------------- Lab data ---------------- */
  const S = (q, options, answer, explain) => ({ type: 'choice', q, options, answer, explain });
  const T = (q, answers, explain, hint, placeholder) => ({ type: 'text', q, answers, explain, hint, placeholder });
  const M = (q, options, answers, explain) => ({ type: 'multi', q, options, answers, explain });

  const SKILL_OF = { 'Linux': 'linux', 'Networking': 'networking', 'Web Security': 'web', 'Digital Forensics': 'forensics', 'Security Operations': 'secops', 'Cryptography': 'cyber', 'OSINT': 'cyber', 'Cybersecurity Fundamentals': 'cyber' };
  CF.LAB_CATEGORIES = Object.keys(SKILL_OF);

  const RAW = [
    { id: 'lab-lnx-01', cat: 'Linux', code: 'LINUX LAB 01', title: 'Permissions Audit', diff: 'Beginner', time: 15,
      intro: 'You are reviewing a fictional file server. Apply the principle of least privilege to the directory listing below.',
      artifacts: [{ title: 'ls -l /srv/share (simulated)', text: '-rw-r--r-- 1 alice staff  1204 notes.txt\n-rwxrwxrwx 1 root  root   880 backup.sh\n-rw------- 1 bob   bob    322 id_ed25519\n-rw-rw-rw- 1 alice staff   512 customers.csv\n-rwxr-x--- 1 root  ops    2048 deploy.sh\n-rw-r--r-- 1 root  root   100 readme.txt' }],
      steps: [M('Which files have permissions that violate least privilege? (select all)', ['notes.txt', 'backup.sh', 'id_ed25519', 'customers.csv', 'deploy.sh'], [1, 3], '`backup.sh` is world-writable AND executable (any user could modify a script run as root), and `customers.csv` is world-writable. Private key `id_ed25519` is correctly 600.'),
        T('What numeric (octal) mode should `customers.csv` have if only the owner and group should read/write it and others get nothing?', ['660'], '660 = owner rw, group rw, others none.', 'Owner 6, group 6, others 0.', 'e.g. 640'),
        S('What command applies that mode?', ['chmod 660 customers.csv', 'chown 660 customers.csv', 'cat 660 customers.csv', 'ls 660 customers.csv'], 0, '`chmod` changes permissions; `chown` changes ownership.')] },
    { id: 'lab-lnx-02', cat: 'Linux', code: 'LINUX LAB 02', title: 'Organise a Lab Workspace', diff: 'Beginner', time: 10,
      intro: 'Use the simulated terminal to build a tidy workspace, as you would for a real lab. Nothing runs on your computer.',
      steps: [{ type: 'terminal', q: 'In the terminal below, create the directory `~/Labs/lab03` and then create an empty file `report.txt` inside it.', explain: 'Organised workspaces make evidence and notes easy to find.', mission: { id: 'lab-lnx-02-m', text: 'Create ~/Labs/lab03 and a file report.txt inside it.', hint: 'mkdir ~/Labs/lab03 then touch ~/Labs/lab03/report.txt', check: (c) => c.isFile('/home/student/Labs/lab03/report.txt') } }] },
    { id: 'lab-net-01', cat: 'Networking', code: 'NETWORK LAB 01', title: 'Analyze Network Traffic', diff: 'Beginner', time: 15,
      intro: 'Below is a simplified, fictional packet capture from a training network. Read it like an analyst.',
      artifacts: [{ title: 'capture-01.pcap (summary)', text: 'No. Time   Source           Destination      Proto Info\n 1  0.000  192.168.56.101   192.168.56.1     DNS   Standard query A lab-portal.example\n 2  0.012  192.168.56.1     192.168.56.101   DNS   Response A 192.168.56.110\n 3  0.020  192.168.56.101   192.168.56.110   TCP   51514 > 80 [SYN]\n 4  0.021  192.168.56.110   192.168.56.101   TCP   80 > 51514 [SYN, ACK]\n 5  0.021  192.168.56.101   192.168.56.110   TCP   51514 > 80 [ACK]\n 6  0.022  192.168.56.101   192.168.56.110   HTTP  GET /login HTTP/1.1\n 7  0.030  192.168.56.110   192.168.56.101   HTTP  HTTP/1.1 200 OK\n 8  0.450  192.168.56.101   192.168.56.110   HTTP  POST /login  (form: username=student&password=******)' }],
      steps: [S('Which protocol resolved the name `lab-portal.example` to an address?', ['TCP', 'DNS', 'HTTP', 'ARP'], 1, 'Packets 1–2 are a DNS query and response.'),
        S('What do packets 3–5 show?', ['A TCP three-way handshake', 'A DNS zone transfer', 'An SSH login', 'A firewall block'], 0, 'SYN → SYN/ACK → ACK establishes a TCP connection.'),
        T('Which destination port is the web server using?', ['80'], 'Port 80 is plain HTTP.', 'Look at packet 3.', 'port number'),
        S('What is the main security concern in packet 8?', ['Credentials are sent over unencrypted HTTP', 'DNS was used', 'The handshake was slow', 'The IP is private'], 0, 'Anyone on the path could read the form data. The service should use HTTPS.')] },
    { id: 'lab-net-02', cat: 'Networking', code: 'NETWORK LAB 02', title: 'Subnet Planning', diff: 'Intermediate', time: 15,
      intro: 'Plan address space for a small fictional office using CIDR notation. (Tip: use the Subnet Calculator on the Networking page.)',
      steps: [T('How many usable host addresses are in a /26 network?', ['62'], '/26 leaves 6 host bits: 2^6 = 64 addresses minus network and broadcast = 62.', '2^(32−26) − 2', 'number'),
        T('What is the broadcast address of 192.168.10.0/26?', ['192.168.10.63'], 'The /26 block 192.168.10.0–63: network .0, broadcast .63.', 'The block size is 64.', 'x.x.x.x'),
        S('Why would the office put guest Wi-Fi in a separate subnet?', ['Segmentation limits what guests can reach', 'It makes Wi-Fi faster', 'It removes the need for passwords', 'It hides the router'], 0, 'Segmentation reduces lateral movement and exposure.')] },
    { id: 'lab-net-03', cat: 'Networking', code: 'NETWORK LAB 03', title: 'Reading DNS Records', diff: 'Beginner', time: 10,
      intro: 'Interpret this fictional DNS response for `shop.example`.',
      artifacts: [{ title: 'dig shop.example ANY (simulated)', text: 'shop.example.   300  IN  A      203.0.113.25\nshop.example.   300  IN  AAAA   2001:db8::25\nshop.example.  3600  IN  MX  10 mail.shop.example.\nshop.example.  3600  IN  TXT    "v=spf1 ip4:203.0.113.0/24 -all"\nwww.shop.example. 300 IN CNAME  shop.example.' }],
      steps: [S('Which record maps the name to an IPv6 address?', ['A', 'AAAA', 'MX', 'CNAME'], 1, 'AAAA records hold IPv6 addresses.'),
        S('What does the CNAME record for www do?', ['Creates an alias pointing to shop.example', 'Sets the mail server', 'Encrypts DNS', 'Blocks spam'], 0, 'A CNAME makes one name an alias of another.'),
        S('The TXT record with `v=spf1` is used for…', ['Email sender validation (SPF)', 'Web caching', 'Port forwarding', 'DHCP'], 0, 'SPF lists servers allowed to send mail for the domain, reducing spoofing.')] },
    { id: 'lab-web-01', cat: 'Web Security', code: 'WEB LAB 01', title: 'Review a Vulnerable Login (Simulated)', diff: 'Intermediate', time: 20,
      intro: 'Code review exercise using a fictional application snippet. You are the defender recommending fixes.',
      artifacts: [{ title: 'login.js (training code — intentionally flawed)', text: 'app.post("/login", (req, res) => {\n  const q = "SELECT * FROM users WHERE name=\'" + req.body.user +\n            "\' AND pass=\'" + req.body.pass + "\'";\n  const row = db.get(q);\n  if (!row) return res.send("No such user: " + req.body.user);\n  res.cookie("sid", row.id);\n  res.send("Welcome " + row.name);\n});' }],
      steps: [M('Which problems exist in this code? (select all)', ['SQL built by string concatenation', 'Passwords compared in plain text', 'Reflects user input in the response without encoding', 'Session cookie has no Secure/HttpOnly flags and uses a guessable ID', 'It uses POST instead of GET'], [0, 1, 2, 3], 'Using POST is correct. The other four are real flaws: injection risk, plaintext password storage/comparison, reflected output (XSS risk) and a weak session cookie.'),
        S('Which fix addresses the injection risk at its root?', ['Parameterised queries', 'Removing quotes from input', 'Making the form longer', 'Using a bigger database'], 0, 'Parameters keep data separate from SQL code.'),
        S('Best login failure message?', ['"No such user"', '"Wrong password"', '"Invalid credentials"', 'The SQL error text'], 2, 'A generic message prevents account enumeration.')] },
    { id: 'lab-web-02', cat: 'Web Security', code: 'WEB LAB 02', title: 'Security Header Review', diff: 'Beginner', time: 15,
      intro: 'Review the response headers from a fictional training site.',
      artifacts: [{ title: 'HTTP response headers', text: 'HTTP/1.1 200 OK\nServer: Apache/2.2.15 (CentOS)\nX-Powered-By: PHP/5.3.3\nContent-Type: text/html\nSet-Cookie: sid=abc123; Path=/' }],
      steps: [M('Which security headers are missing? (select all)', ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Content-Type'], [0, 1, 2], 'Content-Type is present. CSP, HSTS and nosniff are not.'),
        M('Which findings should be fixed? (select all)', ['Version banners reveal outdated software', 'Cookie lacks Secure, HttpOnly and SameSite', 'The page is HTML', 'PHP version disclosed via X-Powered-By'], [0, 1, 3], 'Version disclosure aids targeting; the old versions also need upgrading. Cookie flags are missing.')] },
    { id: 'lab-web-03', cat: 'Web Security', code: 'WEB LAB 03', title: 'Safe File Upload Design', diff: 'Intermediate', time: 15,
      intro: 'A fictional avatar-upload feature is being designed.',
      steps: [M('Which controls belong in a secure design? (select all)', ['Allow-list image types and verify file content', 'Store files with random names outside the web root', 'Keep the original file name and make files executable', 'Enforce a size limit', 'Trust the Content-Type sent by the browser'], [0, 1, 3], 'Never trust client-supplied type, never keep executable permission, and always limit size.'),
        S('Where should uploaded files be served from ideally?', ['A separate domain/bucket with safe headers', 'The application\'s code directory', '/etc', 'The database login page'], 0, 'Separate storage limits impact of any mistake.')] },
    { id: 'lab-for-01', cat: 'Digital Forensics', code: 'FORENSICS LAB 01', title: 'File Metadata Timeline', diff: 'Intermediate', time: 20,
      intro: 'Fictional incident: confidential file `plan.xlsx` was suspected of being copied before an employee left on 02 Oct 2026. Examine the metadata.',
      artifacts: [{ title: 'stat output (UTC, fictional)', text: 'File: /home/jlee/plan.xlsx\n  Modify: 2026-09-29 15:02:11\n  Change: 2026-10-02 22:14:50\n  Birth : 2026-09-01 08:30:00\n\nFile: /media/usb0/plan.xlsx\n  Modify: 2026-09-29 15:02:11\n  Change: 2026-10-02 22:15:32\n  Birth : 2026-10-02 22:15:32\n\nAuth log: 2026-10-02 22:13:05 USB device attached (serial FAKE-0042)' }],
      steps: [S('What does the USB copy\'s Birth time tell you?', ['The file was created on the USB at 22:15:32 on 2 Oct', 'The file was created on 1 Sep', 'It was never copied', 'It was edited on 29 Sep'], 0, 'Birth is when this copy was created on the USB volume.'),
        S('Why does the USB copy keep Modify 2026-09-29 15:02:11?', ['Copying preserved the original modification time', 'It was edited that day', 'The clock was wrong', 'Metadata is random'], 0, 'Many copy operations keep the modified time but set a new creation time.'),
        T('At what time (HH:MM) was the USB device attached?', ['22:13', '22:13:05'], 'The authentication log shows 22:13:05 UTC.', 'See the auth log line.', 'HH:MM'),
        S('Which statement is most defensible?', ['Evidence is consistent with a copy to USB shortly after attachment, but intent must be established separately', 'The employee is guilty', 'Nothing happened', 'The file was deleted'], 0, 'State what the evidence shows, with limits.')] },
    { id: 'lab-for-02', cat: 'Digital Forensics', code: 'FORENSICS LAB 02', title: 'Evidence Integrity', diff: 'Beginner', time: 10,
      intro: 'You acquired a fictional disk image and recorded hashes at three points.',
      artifacts: [{ title: 'Hash log (SHA-256, shortened)', text: 'Source disk (acquisition) : 9f2c41ab...e17d\nImage after acquisition   : 9f2c41ab...e17d\nImage after transfer      : 9f2c41ab...e17c\nCustody note: "USB drive left unattended 2 hours"' }],
      steps: [S('What is wrong?', ['The hash after transfer differs, so integrity cannot be shown for that copy', 'Nothing', 'The disk is too big', 'Hashes must be shorter'], 0, 'The last hash ends in e17c, not e17d.'),
        S('What should you do?', ['Re-copy from the verified original or earlier image and re-verify; document the discrepancy', 'Proceed anyway', 'Delete the original', 'Edit the hash log'], 0, 'Never alter records; re-acquire/verify and document.'),
        S('The custody note is a concern because…', ['Unattended evidence weakens chain of custody', 'USB is slow', 'It uses power', 'It is cold'], 0, 'Chain of custody must account for who held evidence at all times.')] },
    { id: 'lab-sec-01', cat: 'Security Operations', code: 'SECOPS LAB 01', title: 'Investigate Failed Logins', diff: 'Beginner', time: 15,
      intro: 'A SIEM raised the alert below. Investigate and decide what to do.',
      alert: { title: 'SECURITY ALERT', lines: [['47', 'failed login attempts'], ['12', 'usernames attempted'], ['1', 'source address (203.0.113.50)'], ['3', 'successful logins']] },
      artifacts: [{ title: 'auth.log excerpt (fictional)', text: '10:01:02 FAIL  user=admin    src=203.0.113.50\n10:01:04 FAIL  user=backup   src=203.0.113.50\n10:01:06 FAIL  user=jsmith   src=203.0.113.50\n  ... (44 more failures, 9 more usernames)\n10:04:51 FAIL  user=mlopez   src=203.0.113.50\n10:05:10 OK    user=mlopez   src=203.0.113.50\n10:05:33 OK    user=mlopez   src=203.0.113.50\n10:07:40 OK    user=svc-print src=203.0.113.50' }],
      steps: [S('What pattern best fits this activity?', ['Password spraying / guessing from a single source', 'Normal user behaviour', 'A backup job', 'DNS misconfiguration'], 0, 'Many usernames and failures from one address, then successes, is classic guessing.'),
        S('Which finding is most urgent?', ['The 3 successful logins following the failures', 'The first failure', 'The log format', 'The time zone'], 0, 'Successes after failures from the same source mean accounts may be compromised.'),
        M('Which actions are appropriate? (select all)', ['Disable or force-reset the affected accounts', 'Block the source address at the perimeter', 'Review what the accounts did after login', 'Ignore it — failed logins are normal', 'Enable MFA on externally reachable logins'], [0, 1, 2, 4], 'Contain, investigate scope and improve controls. Ignoring it is never correct.')] },
    { id: 'lab-sec-02', cat: 'Security Operations', code: 'SECOPS LAB 02', title: 'Phishing Email Triage', diff: 'Beginner', time: 15,
      intro: 'A user reported the following fictional email. Triage it.',
      artifacts: [{ title: 'Email headers + body (fictional)', text: 'From: "IT Support" <helpdesk@examp1e-corp.example>\nReply-To: support-team@mail-secure.example\nSubject: URGENT: Password expires in 1 hour\nAuthentication-Results: spf=fail dkim=none\n\nYour password expires today. Sign in now to keep access:\nhttps://examplecorp-login.mail-secure.example/verify' }],
      steps: [M('Which red flags are present? (select all)', ['SPF failure and no DKIM', 'Lookalike domain "examp1e-corp"', 'Reply-To differs from sender', 'Urgent deadline', 'It is written in English'], [0, 1, 2, 3], 'Authentication failure, lookalike domain, mismatched reply path and urgency are all indicators.'),
        S('What should the analyst do first?', ['Check who else received/clicked, and remove the email', 'Reply to the sender', 'Click the link to test it', 'Close the ticket'], 0, 'Scope the incident: recipients, clicks, credential entry. Do not interact with the link on a production machine.'),
        S('If the user entered credentials, what is required?', ['Reset the password, revoke sessions, review account activity', 'Nothing', 'Reboot their laptop', 'Change the font'], 0, 'Assume the credential is compromised.')] },
    { id: 'lab-sec-03', cat: 'Security Operations', code: 'SECOPS LAB 03', title: 'Suspicious Process Tree', diff: 'Intermediate', time: 20,
      intro: 'An endpoint alert fired on a fictional workstation. Read the process lineage.',
      artifacts: [{ title: 'EDR process tree (fictional)', text: 'explorer.exe\n └─ WINWORD.EXE  "invoice_Oct.docm"\n     └─ cmd.exe /c powershell -enc <long-base64-string>\n         └─ powershell.exe\n             └─ connects to 198.51.100.77:443 (new destination)\n             └─ creates scheduled task "UpdateCheck"' }],
      steps: [S('What is most suspicious?', ['A document spawning cmd and PowerShell with encoded commands', 'explorer.exe running', 'Port 443 in use', 'A .docm file existing'], 0, 'Office applications launching shells is a common malicious-document pattern.'),
        S('Which immediate response is best?', ['Isolate the host from the network and preserve evidence', 'Delete the file and continue', 'Restart the PC', 'Email the user a joke'], 0, 'Isolation limits spread while preserving forensic data.'),
        S('What does the scheduled task "UpdateCheck" most likely indicate?', ['Persistence — the actor wants to run again later', 'A legitimate update', 'A printer', 'A DNS issue'], 0, 'Newly created tasks after suspicious execution are classic persistence.')] },
    { id: 'lab-cry-01', cat: 'Cryptography', code: 'CRYPTO LAB 01', title: 'Hashes and Encoding', diff: 'Beginner', time: 10,
      intro: 'Work with hashes and encodings (all values fictional or public examples).',
      steps: [S('A 64-character hexadecimal digest is most likely…', ['SHA-256', 'MD5', 'CRC8', 'Base64'], 0, 'SHA-256 produces 256 bits = 64 hex characters. MD5 is 32.'),
        T('Decode this Base64 text: `Y3liZXJmb3JnZQ==`', ['cyberforge'], 'Base64 is encoding, not encryption — anyone can reverse it.', 'Base64 → plain text', 'plain text'),
        S('Is Base64 a secure way to protect a password?', ['No — it is reversible encoding', 'Yes', 'Only for short ones', 'Only on Linux'], 0, 'Encoding is not encryption or hashing.')] },
    { id: 'lab-cry-02', cat: 'Cryptography', code: 'CRYPTO LAB 02', title: 'Classical Cipher', diff: 'Beginner', time: 10,
      intro: 'A Caesar cipher shifts letters by a fixed amount. It is trivially breakable, which is why it teaches why modern algorithms exist.',
      steps: [T('Decrypt `FRQJUDWV` using a shift of 3 (each letter moves back 3).', ['congrats'], 'F→C, R→O, Q→N, J→G, U→R, D→A, W→T, V→S = CONGRATS.', 'F minus 3 = C', 'plain text'),
        S('Why is a Caesar cipher insecure?', ['Only 25 possible keys', 'It is too fast', 'It uses too much RAM', 'It needs the internet'], 0, 'An attacker can try all keys instantly.')] },
    { id: 'lab-osint-01', cat: 'OSINT', code: 'OSINT LAB 01', title: 'Public Exposure Review', diff: 'Beginner', time: 15,
      intro: 'You are helping a fictional company, Northwind Training Ltd, understand what its public footprint reveals. Only public, fictional information is used — OSINT must always respect law, privacy and terms of service.',
      artifacts: [{ title: 'Public sources (fictional)', text: 'Job ad: "Seeking admin for our Windows Server 2012 and Cisco ASA firewall"\nStaff post: photo of desk showing a Wi-Fi password sticky note\nDNS: vpn.northwind.example, dev-jenkins.northwind.example (public)\nRepo: public commit containing "DB_PASSWORD=..."' }],
      steps: [M('Which items present the highest risk? (select all)', ['Credential committed to a public repository', 'Password visible in a photo', 'Public development build server', 'Company has a website'], [0, 1, 2], 'Exposed secrets and unnecessary public services are priority issues.'),
        S('What is the right first action for the leaked credential?', ['Revoke/rotate it immediately, then remove it from history', 'Delete the commit only', 'Ignore it', 'Rename the repo'], 0, 'Once public, a secret is compromised: rotate it.'),
        S('What makes OSINT ethical?', ['Using public data lawfully with purpose and authorization', 'Collecting any personal data', 'Contacting individuals to trick them', 'Breaking into accounts'], 0, 'Stay within law, scope and privacy.')] },
    { id: 'lab-osint-02', cat: 'OSINT', code: 'OSINT LAB 02', title: 'Image Metadata Exposure', diff: 'Beginner', time: 10,
      intro: 'Photos can carry hidden metadata. Review this fictional EXIF summary.',
      artifacts: [{ title: 'EXIF (fictional)', text: 'Camera: PhoneModel X\nDateTimeOriginal: 2026:09:30 08:12:44\nGPSLatitude: 51.5000 N (fictional)\nGPSLongitude: 0.1200 W (fictional)\nSoftware: PhotoEditor 4.1' }],
      steps: [S('Which field is the biggest privacy risk if the photo is shared?', ['GPS coordinates', 'Camera model', 'Software', 'File extension'], 0, 'GPS can reveal home or workplace.'),
        S('Best practice before publishing photos?', ['Strip location metadata or disable geotagging', 'Rename the file', 'Make it smaller only', 'Add a filter'], 0, 'Remove or disable embedded location data.')] },
    { id: 'lab-cyb-01', cat: 'Cybersecurity Fundamentals', code: 'FUNDAMENTALS LAB 01', title: 'Risk Assessment Workshop', diff: 'Beginner', time: 15,
      intro: 'Rate risks for a fictional bakery using Likelihood (1–5) × Impact (1–5).',
      artifacts: [{ title: 'Risk register', text: 'R1  Unpatched point-of-sale software    L=4  I=4\nR2  Staff phishing                      L=3  I=3\nR3  Lost backup tape (no encryption)    L=2  I=5\nR4  Office printer firmware outdated    L=2  I=1' }],
      steps: [T('What is the risk score of R1?', ['16'], '4 × 4 = 16.', 'Multiply L by I.', 'number'),
        S('Which risk should be addressed first?', ['R1', 'R2', 'R3', 'R4'], 0, 'R1 has the highest score (16).'),
        S('A manager decides not to fix R4 and records the decision with an owner. This is…', ['Risk acceptance', 'Risk transfer', 'Risk avoidance', 'Mitigation'], 0, 'Documented acceptance of low risk is a valid treatment.')] },
    { id: 'lab-cyb-02', cat: 'Cybersecurity Fundamentals', code: 'FUNDAMENTALS LAB 02', title: 'Access Review', diff: 'Intermediate', time: 15,
      intro: 'Quarterly access review for a fictional finance system.',
      artifacts: [{ title: 'Access list', text: 'alice   Accountant   read/write ledger\nbob     Accountant   read/write ledger, admin\ncarol   Intern       read/write ledger, approve payments\ndan     Left company 3 months ago   (account active)\nsvc-rep Service      read ledger' }],
      steps: [M('Which findings need action? (select all)', ['bob has unneeded admin rights', 'carol (intern) can approve payments', 'dan\'s account is still active', 'svc-rep has read-only access'], [0, 1, 2], 'Excess privilege, separation-of-duties violation and an orphaned account are findings. Read-only for a reporting service is fine.'),
        S('Which principle does the carol finding violate?', ['Separation of duties / least privilege', 'Availability', 'Encryption at rest', 'Time sync'], 0, 'Interns should not both enter and approve payments.')] }
  ];

  CF.LABS = RAW.map((r) => ({ id: r.id, code: r.code, title: r.title, category: r.cat, skill: SKILL_OF[r.cat], difficulty: r.diff, xp: CF.XP.lab, time: r.time, intro: r.intro, alert: r.alert, artifacts: r.artifacts, steps: r.steps }));

  // Labs authored in the Admin dashboard (localStorage). Single question each.
  function customLabs() {
    return CF.db.customList('labs').map((c) => ({
      id: c.id, code: 'CUSTOM LAB', title: c.title, category: c.category, skill: SKILL_OF[c.category] || 'cyber', difficulty: c.difficulty, xp: c.xp, time: c.time, intro: c.intro, custom: true,
      steps: [S(c.q, c.options, c.answer, c.explain || 'Correct.')]
    }));
  }
  CF.allLabs = () => CF.LABS.concat(customLabs());

  /* ---------------- Labs page ---------------- */
  CF.pages = CF.pages || {};
  CF.pages.labs = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('labs', 'Labs', 'Guided, simulated investigations. Every lab uses fictional data and local simulations — nothing touches a real system.', 'Practice'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const list = h('div'), detail = h('div', { hidden: true });
    wrap.append(list, detail);
    let cat = 'All', status = 'All';

    function openLab(lab) {
      list.hidden = true; detail.hidden = false; CF.clear(detail);
      history.replaceState(null, '', '#' + lab.id);
      detail.append(
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => { detail.hidden = true; list.hidden = false; history.replaceState(null, '', location.pathname); drawList(); } }, '← Back to labs'),
        h('div', { css: { margin: '18px 0' } }, h('span', { class: 'kicker mono', css: { color: 'var(--green)', letterSpacing: '.14em', fontSize: '.75rem' } }, lab.code),
          h('h2', null, lab.title),
          h('div', { class: 'meta-row' }, CF.diffPill(lab.difficulty), h('span', { class: 'pill green' }, lab.xp + ' XP'), h('span', { class: 'pill cyan' }, '~' + lab.time + ' min'), h('span', { class: 'pill' }, lab.category))));
      CF.scenario.mount(detail, lab, { kind: 'lab', xp: lab.xp });
      window.scrollTo(0, 0);
    }

    function drawList() {
      CF.clear(list);
      const labs = CF.allLabs();
      const cats = ['All'].concat(CF.LAB_CATEGORIES);
      const mkChips = (items, cur, set) => h('div', { class: 'filters', role: 'group' }, items.map((c) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(cur === c), onclick: () => { set(c); drawList(); } }, c)));
      const done = labs.filter((l) => CF.store.isDone('lab', l.id)).length;
      list.append(
        h('div', { class: 'stats', css: { marginBottom: '22px' } },
          h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Labs completed'), h('div', { class: 'value green' }, done + ' / ' + labs.length)),
          h('div', { class: 'stat' }, h('div', { class: 'label' }, 'XP per lab'), h('div', { class: 'value cyan' }, '+' + CF.XP.lab))),
        mkChips(cats, cat, (c) => (cat = c)), mkChips(['All', 'Not started', 'Completed'], status, (c) => (status = c)));
      const shown = labs.filter((l) => (cat === 'All' || l.category === cat) && (status === 'All' || (status === 'Completed') === CF.store.isDone('lab', l.id)));
      if (!shown.length) return list.appendChild(h('div', { class: 'empty' }, 'No labs match these filters.'));
      list.appendChild(h('div', { class: 'grid grid-3' }, shown.map((l) => {
        const done2 = CF.store.isDone('lab', l.id);
        return h('article', { class: 'card lab-card' + (done2 ? ' complete' : ''), id: 'card-' + l.id },
          h('span', { class: 'kicker' }, l.code), h('h3', null, l.title),
          h('p', { class: 'muted grow', css: { fontSize: '.9rem' } }, l.intro.length > 120 ? l.intro.slice(0, 117) + '…' : l.intro),
          h('dl', { class: 'kv' }, h('dt', null, 'Difficulty'), h('dd', null, l.difficulty), h('dt', null, 'XP'), h('dd', null, String(l.xp)), h('dt', null, 'Estimated'), h('dd', null, l.time + ' minutes'), h('dt', null, 'Status'), h('dd', null, done2 ? 'Completed' : 'Not started')),
          h('button', { class: 'btn btn-sm ' + (done2 ? '' : 'btn-primary'), type: 'button', onclick: () => openLab(l) }, done2 ? 'Replay lab' : 'Start lab'));
      })));
    }
    drawList();
    const want = location.hash.slice(1), target = CF.allLabs().find((l) => l.id === want);
    if (target) openLab(target);

    wrap.appendChild(h('hr', { class: 'divider' }));
    wrap.appendChild(h('div', { class: 'card' }, h('h3', null, 'Looking for the terminal?'), h('p', null, 'The simulated Linux terminal with guided missions lives on the ', h('a', { href: 'kali.html#terminal' }, 'Kali Linux page'), ' and the ', h('a', { href: 'linux.html#terminal' }, 'Linux Fundamentals page'), '. Web security simulators are on the ', h('a', { href: 'web-security.html#simulators' }, 'Web Security page'), '.')));
    return page;
  };
})();
