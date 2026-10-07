/* CyberForge — topic pages: Kali, Linux, Networking, Cybersecurity, Security Operations, Forensics. */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  CF.pages = CF.pages || {};

  const PREFIX_TAB = { 'ana-': 'analysis', 'adv-': 'advanced', 'bash-': 'bash', 'linux-': 'commands' };
  const hashTab = (ids, dflt) => {
    const x = location.hash.slice(1);
    if (ids.includes(x)) return x;
    const p = Object.keys(PREFIX_TAB).find((k) => x.startsWith(k));
    return p && ids.includes(PREFIX_TAB[p]) ? PREFIX_TAB[p] : dflt;
  };
  const wrapPage = (crumb, title, lead, eyebrow) => {
    const page = h('div'), wrap = h('div', { class: 'container section-sm' });
    page.append(CF.pageHead(crumb, title, lead, eyebrow), wrap);
    return { page, wrap };
  };
  const safeNote = (text) => h('div', { class: 'notice info' }, h('b', null, 'Safe simulation. '), text);

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  CF.sha256Hex = sha256Hex;

  /* ---------- KALI ---------- */
  CF.pages.kali = function () {
    const { page, wrap } = wrapPage('kali', 'Kali Linux', 'Learn Kali Linux the right way: install it safely, master the terminal, and use security tools only in authorized, isolated labs.', 'Course · Level 4');
    wrap.appendChild(h('div', { class: 'notice' }, h('b', null, 'Authorized use only. '), 'Kali tools are for systems you own or have written permission to test. Practise in an isolated lab. Nothing on CyberForge touches real systems.'));
    const ids = ['lessons', 'terminal'];
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Lessons (14)', render: () => CF.renderCourse('kali', { hideTitle: true }) },
      { id: 'terminal', label: 'Interactive terminal', render: terminalTab }
    ], hashTab(ids, 'lessons')));
    return page;
  };

  function terminalTab() {
    const box = h('div', { id: 'terminal' });
    box.append(h('h2', null, 'Simulated terminal & missions'), safeNote('This terminal is a JavaScript simulation of a tiny fake filesystem. It never runs commands on your computer or a server. Supported commands: ls, pwd, cd, cat, mkdir, touch, echo, clear, whoami, help, history, mission. Each mission earns +' + CF.XP.mission + ' XP.'));
    const holder = h('div', { class: 'split' });
    box.appendChild(holder);
    CF.terminal.mount(holder, { tall: true });
    return box;
  }

  /* ---------- LINUX ---------- */
  function commandCards(course) {
    const cats = ['All'].concat(Array.from(new Set(course.lessons.map((l) => l.category))));
    let cat = 'All';
    const box = h('div'), chips = h('div', { class: 'filters' }), grid = h('div', { class: 'grid grid-2' });
    const progress = h('div');
    const drawProg = () => { const p = CF.catalog.courseProgress(course.id); CF.clear(progress).append(h('div', { class: 'meta-row' }, CF.diffPill(course.difficulty), h('span', { class: 'pill cyan' }, course.lessons.length + ' commands'), h('span', { class: 'pill green' }, CF.lessonXP(course) + ' XP'), h('span', { class: 'pill' }, p.done + '/' + p.total + ' complete')), CF.bar(p.pct)); };
    function draw() {
      CF.clear(chips); cats.forEach((c) => chips.appendChild(h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c === cat), onclick: () => { cat = c; draw(); } }, c)));
      CF.clear(grid);
      course.lessons.filter((l) => cat === 'All' || l.category === cat).forEach((l) => {
        const done = CF.store.isDone('lesson', l.id);
        const btn = h('button', { class: 'btn btn-sm btn-primary', type: 'button' }, done ? 'Learned ✓' : 'Mark as learned (+' + CF.XP.lesson + ' XP)');
        btn.disabled = done;
        btn.addEventListener('click', () => { if (CF.store.complete('lesson', l.id, { skill: course.skill, label: 'Learned ' + l.cmd })) { btn.textContent = 'Learned ✓'; btn.disabled = true; card.classList.add('complete'); drawProg(); } });
        const card = h('article', { class: 'card cmd-card' + (done ? ' complete' : ''), id: l.id },
          h('span', { class: 'kicker' }, l.category), h('h3', null, l.cmd),
          h('dl', null, h('dt', null, 'What it does'), h('dd', null, l.what), h('dt', null, 'Why it matters'), h('dd', null, l.why), h('dt', null, 'Safe example'), h('dd', null, h('pre', { css: { margin: '6px 0' } }, h('code', null, l.safe))), h('dt', null, 'Common mistakes'), h('dd', null, l.mistakes)),
          h('div', { css: { margin: '12px 0' } }, CF.knowledgeCheck(l.check)), btn);
        grid.appendChild(card);
      });
    }
    drawProg(); draw();
    document.addEventListener('cf:update', drawProg);
    box.append(h('h2', null, course.title), h('p', { class: 'lead' }, course.intro), progress, chips, grid);
    const q = h('div', { css: { marginTop: '28px' } }, h('h3', null, 'Linux Fundamentals — Final Quiz'));
    CF.quiz.mount(q, { id: 'quiz-' + course.id, title: 'Linux Fundamentals Quiz', questions: course.quiz, skill: course.skill, onDone: drawProg });
    box.appendChild(q);
    return box;
  }

  CF.pages.linux = function () {
    const { page, wrap } = wrapPage('linux', 'Linux Fundamentals', 'The 24 commands that underpin everything in Kali and in security operations — explained, practised and quizzed.', 'Course · Levels 1–2');
    const ids = ['commands', 'terminal', 'bash'];
    wrap.appendChild(CF.tabs([
      { id: 'commands', label: 'Commands (24)', render: () => commandCards(CF.course('linux')) },
      { id: 'terminal', label: 'Interactive terminal', render: terminalTab },
      { id: 'bash', label: 'Terminal & Bash', render: () => CF.renderCourse('bash') }
    ], hashTab(ids, 'commands')));
    const hash = location.hash.slice(1);
    if (hash.startsWith('linux-')) setTimeout(() => { const el = document.getElementById(hash); if (el) el.scrollIntoView(); }, 50);
    return page;
  };

  /* ---------- NETWORKING ---------- */
  const LAYERS = [
    ['Application', '7–5', 'HTTP, HTTPS, DNS, SSH, SMTP', 'Data / messages', 'Where user-facing protocols live. Applications format requests and responses.', 'Input validation, authentication, TLS for confidentiality.'],
    ['Transport', '4', 'TCP, UDP', 'Segments / datagrams', 'Adds port numbers and (for TCP) reliability: handshakes, ordering and retransmission.', 'Port exposure, SYN floods, firewall rules by port.'],
    ['Internet / Network', '3', 'IP, ICMP, routing', 'Packets', 'Adds source and destination IP addresses and routes packets between networks.', 'IP spoofing, routing attacks, ACLs, segmentation.'],
    ['Link / Physical', '2–1', 'Ethernet, Wi-Fi, ARP', 'Frames / bits', 'Delivers frames between devices on the same segment using MAC addresses.', 'ARP spoofing, rogue access points, port security, WPA3.']
  ];

  function layersExplorer() {
    const detail = h('div', { class: 'card', 'aria-live': 'polite' });
    const btns = LAYERS.map((l, i) => h('button', { class: 'layer-btn', type: 'button', 'aria-pressed': 'false', onclick: () => pick(i) }, h('span', { class: 'ln' }, 'L' + l[1]), l[0], h('small', null, l[2])));
    function pick(i) {
      btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      const l = LAYERS[i];
      CF.clear(detail).append(h('h3', null, l[0] + ' layer'), h('dl', { class: 'kv' }, h('dt', null, 'Unit of data'), h('dd', null, l[3]), h('dt', null, 'Examples'), h('dd', null, l[2]), h('dt', null, 'Role'), h('dd', null, l[4]), h('dt', null, 'Security focus'), h('dd', null, l[5])));
    }
    pick(0);
    return h('div', { class: 'grid grid-2' }, h('div', { class: 'layers', role: 'group', 'aria-label': 'Network layers' }, btns), detail);
  }

  function stepper(title, nodes, steps) {
    let i = -1;
    const nodeEls = nodes.map((n) => h('div', { class: 'node' }, h('b', null, n[0]), n[1]));
    const text = h('div', { class: 'step-text', 'aria-live': 'polite' }, 'Press "Next step" to begin.');
    const next = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Next step'), reset = h('button', { class: 'btn btn-sm', type: 'button' }, 'Reset');
    function show() {
      nodeEls.forEach((n, k) => { n.classList.toggle('active', steps[i] && steps[i].on.includes(k)); n.classList.toggle('visited', steps.slice(0, i).some((s) => s.on.includes(k))); });
      text.textContent = i < 0 ? 'Press "Next step" to begin.' : 'Step ' + (i + 1) + '/' + steps.length + ' — ' + steps[i].t;
      next.disabled = i >= steps.length - 1;
    }
    next.addEventListener('click', () => { if (i < steps.length - 1) { i++; show(); } });
    reset.addEventListener('click', () => { i = -1; show(); });
    show();
    return h('div', { class: 'card' }, h('h3', null, title), h('div', { class: 'stepper' }, nodeEls), text, h('div', { class: 'btn-row' }, next, reset));
  }

  function subnetCalc() {
    const inp = h('input', { id: 'cidr', type: 'text', value: '192.168.1.0/24', maxlength: '18', 'aria-label': 'IPv4 address with CIDR prefix', autocomplete: 'off' });
    const out = h('div', { class: 'result-box', 'aria-live': 'polite' });
    const ip2int = (a) => a.reduce((x, o) => ((x << 8) | o) >>> 0, 0);
    const int2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    function calc() {
      const m = inp.value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
      if (!m) return (out.textContent = 'Enter an IPv4 address with prefix, e.g. 10.0.5.20/26');
      const o = m.slice(1, 5).map(Number), p = Number(m[5]);
      if (o.some((x) => x > 255) || p > 32) return (out.textContent = 'Invalid address or prefix (octets 0–255, prefix 0–32).');
      const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0, ip = ip2int(o), net = (ip & mask) >>> 0, bc = (net | ~mask) >>> 0;
      const total = 2 ** (32 - p), hosts = p >= 31 ? (p === 31 ? 2 : 1) : total - 2;
      const priv = o[0] === 10 || (o[0] === 172 && o[1] >= 16 && o[1] <= 31) || (o[0] === 192 && o[1] === 168);
      out.textContent = ['Address       : ' + int2ip(ip), 'Subnet mask   : ' + int2ip(mask), 'Wildcard mask : ' + int2ip(~mask >>> 0), 'Network       : ' + int2ip(net), 'Broadcast     : ' + int2ip(bc),
        'First host    : ' + (p >= 31 ? int2ip(net) : int2ip(net + 1)), 'Last host     : ' + (p >= 31 ? int2ip(bc) : int2ip(bc - 1)), 'Usable hosts  : ' + CF.fmt(hosts) + ' (of ' + CF.fmt(total) + ' addresses)', 'Private range : ' + (priv ? 'yes (RFC 1918)' : 'no')].join('\n');
    }
    inp.addEventListener('input', calc);
    calc();
    return h('div', { class: 'card' }, h('h3', null, 'Subnet calculator'), h('p', { class: 'muted' }, 'Pure arithmetic in your browser — nothing is sent anywhere.'), h('div', { class: 'field' }, h('label', { for: 'cidr' }, 'IPv4 address / prefix'), inp), out);
  }

  const PORTS = [[20, 'TCP', 'FTP data', 'Unencrypted; prefer SFTP'], [21, 'TCP', 'FTP control', 'Unencrypted'], [22, 'TCP', 'SSH / SFTP', 'Encrypted remote access'], [23, 'TCP', 'Telnet', 'Unencrypted; avoid'], [25, 'TCP', 'SMTP', 'Mail transfer'], [53, 'UDP/TCP', 'DNS', 'Name resolution'], [67, 'UDP', 'DHCP server', 'Address assignment'], [80, 'TCP', 'HTTP', 'Unencrypted web'], [110, 'TCP', 'POP3', 'Mail retrieval (use TLS)'], [123, 'UDP', 'NTP', 'Time sync'], [143, 'TCP', 'IMAP', 'Mail retrieval (use TLS)'], [161, 'UDP', 'SNMP', 'Use v3'], [389, 'TCP', 'LDAP', 'Directory'], [443, 'TCP', 'HTTPS', 'HTTP over TLS'], [445, 'TCP', 'SMB', 'File sharing; do not expose'], [587, 'TCP', 'SMTP submission', 'Authenticated mail'], [993, 'TCP', 'IMAPS', 'IMAP over TLS'], [3306, 'TCP', 'MySQL', 'Do not expose publicly'], [3389, 'TCP', 'RDP', 'Remote desktop; protect with VPN/MFA'], [5432, 'TCP', 'PostgreSQL', 'Do not expose publicly']];
  function portTable() {
    const f = h('input', { type: 'search', class: 'search', placeholder: 'Filter ports or services…', 'aria-label': 'Filter ports', maxlength: '30' });
    const tb = h('tbody');
    const draw = () => { const q = CF.clean(f.value, 30).toLowerCase(); CF.clear(tb); PORTS.filter((r) => !q || r.join(' ').toLowerCase().includes(q)).forEach((r) => tb.appendChild(h('tr', null, r.map((c) => h('td', null, String(c)))))); };
    f.addEventListener('input', draw); draw();
    return h('div', null, h('h3', null, 'Common ports'), f, h('div', { class: 'table-wrap', css: { marginTop: '12px' } }, h('table', null, h('thead', null, h('tr', null, ['Port', 'Proto', 'Service', 'Note'].map((x) => h('th', { scope: 'col' }, x)))), tb)));
  }

  CF.pages.networking = function () {
    const { page, wrap } = wrapPage('networking', 'Networking', 'From IP addresses to NAT: the networking concepts behind every log line, packet capture and firewall rule — with interactive diagrams.', 'Course · Level 3');
    const ids = ['lessons', 'diagrams', 'practice'];
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Lessons (15)', render: () => CF.renderCourse('networking', { hideTitle: true }) },
      { id: 'diagrams', label: 'Interactive diagrams', render: () => h('div', null,
        h('h2', null, 'Layers of communication'), layersExplorer(), h('div', { css: { height: '24px' } }),
        h('div', { class: 'grid grid-2' },
          stepper('DNS resolution: what happens when you visit www.example.com', [['Client', 'your device'], ['Resolver', 'recursive DNS'], ['Root', '. servers'], ['TLD', '.com servers'], ['Authoritative', 'example.com']], [
            { on: [0], t: 'Your device checks its local cache. Nothing found, so it asks the configured recursive resolver.' },
            { on: [0, 1], t: 'The resolver receives the question "What is the A record for www.example.com?" and checks its own cache.' },
            { on: [1, 2], t: 'Cache miss. The resolver asks a root server, which replies with the address of the .com TLD servers.' },
            { on: [1, 3], t: 'The resolver asks a .com TLD server, which replies with the authoritative name servers for example.com.' },
            { on: [1, 4], t: 'The authoritative server answers: www.example.com A 203.0.113.10, TTL 3600 seconds.' },
            { on: [1, 0], t: 'The resolver caches the answer for the TTL and returns it. Your device now connects to 203.0.113.10.' }]),
          stepper('TCP three-way handshake and HTTPS request', [['Client', '192.0.2.5:51514'], ['Server', '203.0.113.10:443']], [
            { on: [0, 1], t: 'SYN — the client proposes a connection with an initial sequence number.' },
            { on: [0, 1], t: 'SYN/ACK — the server acknowledges and sends its own sequence number.' },
            { on: [0, 1], t: 'ACK — the client confirms. The TCP connection is established.' },
            { on: [0, 1], t: 'TLS handshake — the server presents its certificate; both sides agree on session keys.' },
            { on: [0, 1], t: 'Encrypted HTTP request/response flows. Observers see only metadata (IPs, ports, sizes, timing).' },
            { on: [0, 1], t: 'FIN/ACK — either side closes the connection cleanly.' }])),
        h('div', { css: { height: '24px' } }), subnetCalc(), h('div', { css: { height: '24px' } }), portTable()) },
      { id: 'practice', label: 'Test yourself', render: () => { const b = h('div'); b.append(h('h2', null, 'Networking Q&A'), h('p', { class: 'muted' }, 'Practice questions (no XP — the final quiz in Lessons awards XP).')); CF.quiz.mount(b, { id: 'net-practice', title: 'Networking Practice', noXp: true, questions: [
        CF.Q('What does DNS do?', ['Encrypts web traffic', 'Translates domain names to IP addresses', 'Assigns IP addresses to devices', 'Blocks malicious packets'], 1, 'DNS resolves names such as example.com to addresses.'),
        CF.Q('What is the difference between TCP and UDP?', ['TCP is connectionless; UDP is reliable', 'TCP is reliable and connection-oriented; UDP is connectionless and faster', 'They are the same', 'UDP encrypts data'], 1, 'TCP guarantees ordered delivery; UDP does not.'),
        CF.Q('What is port 443 commonly associated with?', ['FTP', 'HTTP', 'HTTPS', 'Telnet'], 2, 'HTTPS (HTTP over TLS).'),
        CF.Q('What is a subnet?', ['A logical subdivision of an IP network', 'A type of cable', 'A password', 'A web browser'], 0, 'Subnets divide a network into smaller segments.'),
        CF.Q('Which device typically performs NAT in a home network?', ['The router', 'The monitor', 'The printer', 'The keyboard'], 0, 'The home router translates private to public addresses.')] }); return b; } }
    ], hashTab(ids, 'lessons')));
    return page;
  };

  /* ---------- CYBERSECURITY ---------- */
  function playground() {
    // Password strength estimator — runs locally, input is never stored or transmitted.
    const pw = h('input', { id: 'pw', type: 'password', maxlength: '64', autocomplete: 'off', 'aria-describedby': 'pwres', placeholder: 'Type a TEST password (never a real one)' });
    const show = h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { pw.type = pw.type === 'password' ? 'text' : 'password'; } }, 'Show/hide');
    const pwOut = h('div', { class: 'result-box', id: 'pwres', 'aria-live': 'polite' }, 'Type to analyse.');
    const COMMON = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'admin', 'iloveyou', 'abc123', 'monkey', 'dragon', 'football', 'password1', 'passw0rd', '111111'];
    pw.addEventListener('input', () => {
      const v = pw.value;
      if (!v) return (pwOut.textContent = 'Type to analyse.');
      let pool = 0; if (/[a-z]/.test(v)) pool += 26; if (/[A-Z]/.test(v)) pool += 26; if (/\d/.test(v)) pool += 10; if (/[^A-Za-z0-9]/.test(v)) pool += 33;
      let bits = Math.round(v.length * Math.log2(pool || 1));
      const lower = v.toLowerCase(), common = COMMON.some((c) => lower.includes(c)), repeat = /(.)\1{2,}/.test(v), seq = /(0123|1234|2345|abcd|qwer)/i.test(v);
      if (common) bits = Math.min(bits, 20); if (repeat || seq) bits = Math.round(bits * 0.6);
      const label = bits < 28 ? 'Very weak' : bits < 40 ? 'Weak' : bits < 60 ? 'Fair' : bits < 80 ? 'Strong' : 'Very strong';
      pwOut.textContent = 'Length: ' + v.length + '\nCharacter pool: ~' + pool + '\nEstimated entropy: ~' + bits + ' bits  →  ' + label + (common ? '\n⚠ Contains a very common password pattern.' : '') + (repeat || seq ? '\n⚠ Repeats or sequences reduce strength.' : '') + '\nTip: length and uniqueness beat clever substitutions. Use a password manager + MFA.';
    });
    // Hash playground using the browser's built-in Web Crypto API.
    const txt = h('input', { id: 'hashin', type: 'text', maxlength: '200', value: 'CyberForge', autocomplete: 'off', 'aria-label': 'Text to hash' });
    const hashOut = h('div', { class: 'result-box', 'aria-live': 'polite' });
    let prev = '';
    const upd = async () => {
      const hx = await sha256Hex(txt.value);
      let diff = 0; if (prev) for (let i = 0; i < 64; i++) if (hx[i] !== prev[i]) diff++;
      hashOut.textContent = 'SHA-256:\n' + hx + (prev ? '\n\n' + diff + ' of 64 hex characters changed since the previous value (the "avalanche effect").' : '');
      prev = hx;
    };
    txt.addEventListener('input', upd); upd();
    return h('div', { class: 'grid grid-2' },
      h('div', { class: 'card' }, h('h3', null, 'Password strength estimator'), h('p', { class: 'muted' }, 'Runs entirely in your browser. Don\'t type a real password.'), h('div', { class: 'field' }, h('label', { for: 'pw' }, 'Test password'), pw), show, pwOut),
      h('div', { class: 'card' }, h('h3', null, 'Hashing playground'), h('p', { class: 'muted' }, 'Change one character and watch the whole hash change — why hashes detect tampering.'), h('div', { class: 'field' }, h('label', { for: 'hashin' }, 'Text'), txt), hashOut));
  }

  CF.pages.cybersecurity = function () {
    const { page, wrap } = wrapPage('cybersecurity', 'Cybersecurity Fundamentals', 'A comprehensive foundation: the CIA triad, identity and access, cryptography, vulnerability and risk management, incident response and awareness.', 'Course · Levels 5 & 10');
    const ids = ['lessons', 'playground', 'advanced'];
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Fundamentals (18)', render: () => CF.renderCourse('cyber', { hideTitle: true }) },
      { id: 'playground', label: 'Playground', render: () => h('div', null, h('h2', null, 'Interactive playground'), playground()) },
      { id: 'advanced', label: 'Advanced (6)', render: () => CF.renderCourse('advanced', { anchor: 'advanced-course' }) }
    ], hashTab(ids, 'lessons')));
    return page;
  };

  /* ---------- SECURITY OPERATIONS ---------- */
  function logAnalyzer() {
    const SAMPLE = '10:01:02 FAIL user=admin src=203.0.113.50\n10:01:04 FAIL user=backup src=203.0.113.50\n10:01:06 FAIL user=jsmith src=203.0.113.50\n10:01:09 FAIL user=guest src=203.0.113.50\n10:01:12 FAIL user=test src=203.0.113.50\n10:01:15 FAIL user=oracle src=203.0.113.50\n10:03:20 FAIL user=ana src=198.51.100.10\n10:04:51 FAIL user=mlopez src=203.0.113.50\n10:05:10 OK user=mlopez src=203.0.113.50\n10:07:40 OK user=ana src=198.51.100.10';
    const ta = h('textarea', { id: 'logs', maxlength: '8000', rows: '9', 'aria-label': 'Authentication log lines' }); ta.value = SAMPLE;
    const out = h('div', { class: 'result-box', 'aria-live': 'polite' });
    function analyze() {
      const bySrc = {};
      let lines = 0;
      ta.value.split('\n').slice(0, 500).forEach((ln) => {
        const m = ln.match(/\b(OK|FAIL)\b.*?user=(\S{1,32}).*?src=([\d.]{7,15})/i);
        if (!m) return; lines++;
        const s = (bySrc[m[3]] = bySrc[m[3]] || { fail: 0, ok: 0, users: new Set(), okUsers: new Set() });
        if (m[1].toUpperCase() === 'FAIL') { s.fail++; s.users.add(m[2]); } else { s.ok++; s.okUsers.add(m[2]); }
      });
      if (!lines) return (out.textContent = 'No parsable lines. Format: HH:MM:SS FAIL|OK user=NAME src=IP');
      const rows = Object.entries(bySrc).map(([ip, s]) => {
        const spray = s.fail >= 5 && s.users.size >= 4;
        const compromised = spray && s.ok > 0;
        return ip + '  fail=' + s.fail + '  ok=' + s.ok + '  distinct-failed-users=' + s.users.size + (compromised ? '  ⚠ HIGH: failures followed by success (' + Array.from(s.okUsers).join(', ') + ')' : spray ? '  ⚠ possible password spraying' : '');
      });
      out.textContent = lines + ' events parsed\n\n' + rows.join('\n') + '\n\nRule used: ≥5 failures across ≥4 usernames from one source = possible spraying; any success from that source raises severity.';
    }
    ta.addEventListener('input', analyze); analyze();
    return h('div', { class: 'card' }, h('h3', null, 'Authentication log analyzer'), h('p', { class: 'muted' }, 'Paste fictional log lines. Parsing happens locally with a regular expression — the text is never executed or sent anywhere.'), h('div', { class: 'field' }, h('label', { for: 'logs' }, 'Log lines'), ta), out);
  }

  CF.pages['security-operations'] = function () {
    const { page, wrap } = wrapPage('security-operations', 'Security Operations', 'Monitor, detect and respond. Learn how logs, alerts, SIEMs and playbooks fit together — then investigate simulated incidents.', 'Course · Levels 7 & 8');
    const ids = ['lessons', 'analysis', 'incidents', 'analyzer'];
    const incidents = () => {
      const box = h('div'), list = h('div'), det = h('div', { hidden: true });
      const labs = CF.allLabs().filter((l) => l.category === 'Security Operations');
      const draw = () => {
        CF.clear(list).append(h('h2', null, 'Simulated security incidents'), h('p', { class: 'lead' }, 'Investigate fictional alerts and logs. Each completed incident earns +' + CF.XP.lab + ' XP.'),
          h('div', { class: 'grid grid-3', css: { marginTop: '16px' } }, labs.map((l) => h('article', { class: 'card lab-card' + (CF.store.isDone('lab', l.id) ? ' complete' : '') }, h('span', { class: 'kicker' }, l.code), h('h3', null, l.title), h('p', { class: 'muted grow', css: { fontSize: '.9rem' } }, l.intro), h('div', { class: 'meta-row' }, CF.diffPill(l.difficulty), h('span', { class: 'pill green' }, l.xp + ' XP')),
            h('button', { class: 'btn btn-sm btn-primary', type: 'button', onclick: () => { list.hidden = true; det.hidden = false; CF.clear(det).append(h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: () => { det.hidden = true; list.hidden = false; draw(); } }, '← Back to incidents'), h('h2', { css: { margin: '16px 0' } }, l.title)); CF.scenario.mount(det, l, { kind: 'lab', xp: l.xp }); } }, 'Investigate')))));
      };
      draw(); box.append(list, det); return box;
    };
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Operations (11)', render: () => CF.renderCourse('secops', { hideTitle: true }) },
      { id: 'analysis', label: 'Security Analysis (5)', render: () => CF.renderCourse('analysis', { anchor: 'analysis-course' }) },
      { id: 'incidents', label: 'Incident simulator', render: incidents },
      { id: 'analyzer', label: 'Log analyzer', render: () => h('div', null, h('h2', null, 'Log analyzer'), logAnalyzer()) }
    ], hashTab(ids, 'lessons')));
    return page;
  };

  /* ---------- FORENSICS ---------- */
  const EVENTS = [
    ['21:58', 'Auth', 'Interactive login: jlee (workstation LT-22)', 0], ['22:02', 'Browser', 'Visited internal wiki: "Offboarding checklist"', 0], ['22:09', 'File system', 'plan.xlsx opened (access time updated)', 0],
    ['22:13', 'Device', 'USB mass storage attached (serial FAKE-0042)', 1], ['22:14', 'File system', 'Archive /tmp/data.tgz created', 1], ['22:15', 'File system', 'plan.xlsx copied to /media/usb0 (new creation time)', 1],
    ['22:17', 'Browser', 'Visited news website', 0], ['22:19', 'Network', 'Outbound 1.2 GB to 198.51.100.77:443 (first time seen)', 1], ['22:21', 'Process', 'Backup agent scheduled run (routine)', 0],
    ['22:25', 'Logs', 'Security log cleared by jlee', 1], ['22:31', 'Auth', 'Logout: jlee', 0], ['23:00', 'Process', 'Antivirus signature update (routine)', 0]
  ];
  function timelineExplorer() {
    const picked = new Set();
    const src = ['All'].concat(Array.from(new Set(EVENTS.map((e) => e[1]))));
    let filter = 'All';
    const chips = h('div', { class: 'filters' }), tb = h('tbody'), mine = h('div', { class: 'result-box' }, 'Flag events to build your timeline.'), fb = h('div', { 'aria-live': 'polite' });
    function drawChips() { CF.clear(chips); src.forEach((s) => chips.appendChild(h('button', { class: 'chip', type: 'button', 'aria-pressed': String(filter === s), onclick: () => { filter = s; drawChips(); drawRows(); } }, s))); }
    function drawRows() {
      CF.clear(tb);
      EVENTS.forEach((e, i) => {
        if (filter !== 'All' && e[1] !== filter) return;
        const cb = h('input', { type: 'checkbox', 'aria-label': 'Flag event at ' + e[0], css: { width: 'auto' } }); cb.checked = picked.has(i);
        cb.addEventListener('change', () => { cb.checked ? picked.add(i) : picked.delete(i); drawMine(); });
        tb.appendChild(h('tr', null, h('td', null, cb), h('td', { class: 'mono' }, e[0] + ' UTC'), h('td', null, e[1]), h('td', null, e[2])));
      });
    }
    function drawMine() { mine.textContent = picked.size ? Array.from(picked).sort((a, b) => a - b).map((i) => EVENTS[i][0] + '  ' + EVENTS[i][2]).join('\n') : 'Flag events to build your timeline.'; CF.clear(fb); }
    function check() {
      const key = EVENTS.map((e, i) => (e[3] ? i : -1)).filter((i) => i >= 0), ok = key.length === picked.size && key.every((i) => picked.has(i));
      CF.clear(fb).appendChild(h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') }, ok ? 'Correct. The USB attach, archive creation, copy, large outbound transfer and log clearing form a consistent data-removal sequence. Intent still requires corroboration.' : 'Not yet. Hint: look for the events connected to moving the file off the machine and hiding it (device, file creation/copy, network transfer, log clearing). Routine and unrelated events should stay unflagged. You have flagged ' + picked.size + '; the sequence has ' + key.length + ' events.'));
    }
    drawChips(); drawRows();
    return h('div', { class: 'card' }, h('h3', null, 'Case 2026-017: timeline explorer'), h('p', { class: 'muted' }, 'Fictional case. An employee left on 2 Oct; the company suspects a confidential spreadsheet was removed. Flag the events that form the suspicious sequence, then check your timeline.'),
      chips, h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Flag', 'Time', 'Source', 'Event'].map((x) => h('th', { scope: 'col' }, x)))), tb)),
      h('h4', { css: { margin: '16px 0 6px' } }, 'Your timeline'), mine, h('div', { class: 'quiz-actions' }, h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: check }, 'Check my timeline')), fb);
  }

  function hashChecker() {
    const a = h('textarea', { id: 'ev-a', rows: '3', maxlength: '1000', 'aria-label': 'Original evidence text' }); a.value = 'Evidence note E-014: SSD from LT-22, imaged 2026-10-02 14:05 UTC.';
    const b = h('textarea', { id: 'ev-b', rows: '3', maxlength: '1000', 'aria-label': 'Copy of evidence text' }); b.value = a.value;
    const out = h('div', { class: 'result-box', 'aria-live': 'polite' });
    const run = async () => { const [x, y] = await Promise.all([sha256Hex(a.value), sha256Hex(b.value)]); out.textContent = 'Original: ' + x + '\nCopy:     ' + y + '\n\n' + (x === y ? 'MATCH — the copy is identical to the original.' : 'MISMATCH — the copy differs. Integrity cannot be demonstrated; re-acquire and document.'); };
    a.addEventListener('input', run); b.addEventListener('input', run); run();
    return h('div', { class: 'card' }, h('h3', null, 'Evidence integrity checker'), h('p', { class: 'muted' }, 'Edit one character of the copy to see the SHA-256 values diverge.'), h('div', { class: 'grid grid-2' }, h('div', { class: 'field' }, h('label', { for: 'ev-a' }, 'Original'), a), h('div', { class: 'field' }, h('label', { for: 'ev-b' }, 'Copy'), b)), out);
  }

  CF.pages.forensics = function () {
    const { page, wrap } = wrapPage('forensics', 'Digital Forensics', 'Preserve, examine and explain digital evidence. Every dataset here is fictional and safe.', 'Course · Level 9');
    const ids = ['lessons', 'investigate', 'cases'];
    wrap.appendChild(CF.tabs([
      { id: 'lessons', label: 'Lessons (10)', render: () => CF.renderCourse('forensics', { hideTitle: true }) },
      { id: 'investigate', label: 'Evidence workbench', render: () => h('div', null, h('h2', null, 'Evidence workbench'), timelineExplorer(), h('div', { css: { height: '24px' } }), hashChecker()) },
      { id: 'cases', label: 'Forensic labs', render: () => { const labs = CF.allLabs().filter((l) => l.category === 'Digital Forensics'); return h('div', null, h('h2', null, 'Forensic labs'), h('div', { class: 'grid grid-3' }, labs.map((l) => h('article', { class: 'card lab-card' + (CF.store.isDone('lab', l.id) ? ' complete' : '') }, h('span', { class: 'kicker' }, l.code), h('h3', null, l.title), h('p', { class: 'muted grow', css: { fontSize: '.9rem' } }, l.intro), h('a', { class: 'btn btn-sm btn-primary', href: 'labs.html#' + l.id }, 'Open lab'))))); } }
    ], hashTab(ids, 'lessons')));
    return page;
  };
})();
