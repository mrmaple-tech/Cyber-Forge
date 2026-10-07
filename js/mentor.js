/*
 * CyberForge Mentor — frontend tutor interface.
 *
 * v1 uses a local knowledge base of predefined educational answers (no network, no API keys).
 * FUTURE AI INTEGRATION: replace CF.mentor.ask() so it POSTs the question to YOUR OWN backend
 * (CF_CONFIG.mentorEndpoint), which holds the AI provider key server-side, enforces auth,
 * rate limits, input filtering and logging. NEVER put an AI API key in this file or any frontend code.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;

  // [keywords[], answer]  — first entry with all of its keyword groups matched wins.
  const KB = [
    [['permission', 'permissions'], 'Linux permissions have three sets (owner, group, others) of read (4), write (2) and execute (1). Add the numbers per set: `chmod 640 file` = owner rw (6), group r (4), others none (0). Use least privilege: grant only what is needed.'],
    [['sudo'], '`sudo` runs one command with administrator rights and logs it. Prefer it over logging in as root, and only use it when a task truly needs elevated privileges.'],
    [['kali'], 'Kali Linux is a Debian-based distribution packed with security tools for authorized testing, forensics and research. Run it in a virtual machine on an isolated network and always test only with written permission. Start with the Kali Linux course.'],
    [['lab', 'safe'], 'A safe lab = a Kali VM + intentionally vulnerable targets (Metasploitable, DVWA, Juice Shop) on a host-only/internal virtual network with no route to the internet or your home LAN. Snapshot a clean state so you can reset.'],
    [['tcp', 'udp'], 'TCP is connection-oriented and reliable (three-way handshake, retransmission, ordering). UDP is connectionless and faster but offers no delivery guarantees. Web, SSH and email use TCP; DNS queries, VoIP and streaming often use UDP.'],
    [['dns'], 'DNS translates names like example.com into IP addresses. Records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verification/SPF). Defenders monitor DNS because malware often relies on it.'],
    [['443'], 'Port 443 is the standard port for HTTPS (HTTP over TLS). Port 80 is plain HTTP, 22 is SSH, 53 is DNS.'],
    [['port'], 'A port identifies a service on a host (0–65535). Common: 22 SSH, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS, 3389 RDP. A service listens on a port; `ss -tuln` shows what is listening on your machine.'],
    [['subnet', 'cidr'], 'A subnet divides a network. In CIDR notation /24 means 24 network bits and 8 host bits: 256 addresses, 254 usable. Each extra bit halves the host count. Try the Subnet Calculator on the Networking page.'],
    [['nat'], 'NAT lets many private addresses share one public address by rewriting addresses and ports. It is not a firewall, although it blocks unsolicited inbound connections by side effect.'],
    [['firewall'], 'A firewall allows or blocks traffic by rule. Use default deny: block everything, then allow only what is required. Stateful firewalls automatically allow replies to permitted outbound connections.'],
    [['cia', 'triad'], 'The CIA triad: Confidentiality (only authorised people can read data), Integrity (data is accurate and unaltered), Availability (systems work when needed). Map every incident to which of the three failed.'],
    [['hash', 'hashing'], 'A hash is a one-way fingerprint of data. Use hashes to verify integrity (SHA-256). Store passwords with slow salted algorithms like Argon2 or bcrypt — never MD5 or plain text.'],
    [['encrypt', 'encryption', 'aes', 'rsa'], 'Symmetric encryption (AES) uses one shared key and is fast; asymmetric (RSA/ECC) uses a public/private pair, great for key exchange and signatures. TLS uses both. Never invent your own cryptography.'],
    [['mfa', '2fa', 'multi-factor', 'multifactor'], 'MFA combines different factor types (know, have, are). Hardware security keys and passkeys are the most phishing-resistant; authenticator apps are good; SMS is the weakest.'],
    [['password'], 'Use long, unique passwords in a password manager and turn on MFA. Developers should store passwords with Argon2/bcrypt plus a salt, rate-limit logins and check against breached-password lists.'],
    [['phishing'], 'Phishing tricks people into revealing credentials or running malware. Red flags: urgency, lookalike domains, unexpected attachments, requests for passwords. Report via the official process rather than clicking.'],
    [['sql injection', 'sqli', 'injection'], 'SQL injection happens when user input is concatenated into a query so data is treated as code. The root fix is parameterised queries/prepared statements, plus least-privilege database accounts and generic error messages.'],
    [['xss', 'cross-site scripting'], 'Cross-site scripting happens when untrusted data is placed in a page without proper encoding. Defend with contextual output encoding, safe DOM APIs like `textContent`, framework auto-escaping, HttpOnly cookies and a strict Content-Security-Policy.'],
    [['csrf'], 'CSRF tricks a logged-in browser into sending an unwanted request. Defend with SameSite cookies, anti-CSRF tokens and re-authentication for sensitive actions.'],
    [['cors'], 'CORS is a browser mechanism that lets a server permit specific other origins to read its responses. Allow-list exact origins; never reflect arbitrary origins or combine wildcard origins with credentials.'],
    [['header', 'csp', 'hsts'], 'Key security headers: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy and frame-ancestors. Try the Header Analyzer on the Web Security page.'],
    [['cookie'], 'Secure session cookies use Secure (HTTPS only), HttpOnly (hidden from JavaScript) and SameSite (limits cross-site sending). Prefer the __Host- prefix and short lifetimes.'],
    [['siem'], 'A SIEM collects and normalises logs, lets you search them, and correlates events into alerts (e.g., many failed logins then a success). Tune rules to reduce false positives and alert fatigue.'],
    [['log', 'logs'], 'Useful log events answer who, what, when, where from and result. Keep clocks synchronised, protect logs from tampering, and look for patterns: bursts, rare values, failures followed by success.'],
    [['incident'], 'Incident response (NIST): Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-incident review. Preserve evidence, keep a timeline and communicate clearly.'],
    [['forensic', 'forensics', 'evidence'], 'Digital forensics preserves and analyses evidence: collect volatile data first, image disks and verify with hashes, work on copies, keep a chain of custody, and normalise timelines to UTC.'],
    [['nmap'], 'Nmap discovers hosts, open ports and services. Use it only on networks you own or are authorised to assess — for practice, scan your own host-only lab VMs. See the Security Tools library.'],
    [['wireshark', 'packet'], 'Wireshark is a packet analyser. Learn to read DNS, the TCP handshake and HTTP first. Capture only on networks you are authorised to monitor — your lab is ideal.'],
    [['grep'], '`grep` searches text for patterns. Example: `grep -i "failed password" /var/log/auth.log` finds failed SSH logins. Useful flags: -i (ignore case), -n (line numbers), -r (recursive), -v (invert).'],
    [['ssh'], 'SSH gives encrypted remote access (port 22). Prefer key-based authentication, disable root login and password logins, and verify host keys on first connect.'],
    [['vulnerability', 'cve', 'cvss'], 'A vulnerability is a weakness that could be exploited. CVE IDs name public flaws; CVSS scores severity 0–10. Prioritise by severity, exposure and evidence of exploitation, then verify fixes.'],
    [['risk'], 'Risk = likelihood × impact. Treat it by mitigating, transferring, accepting (documented) or avoiding. Keep a risk register with owners and review dates.'],
    [['authorization', 'authorised', 'authorized', 'legal', 'permission to test'], 'Security testing is only legitimate with explicit written authorization defining scope, timing and rules. Without it, even "just looking" can be illegal. Practise on your own lab or intentionally vulnerable targets.'],
    [['learn', 'start', 'begin', 'path'], 'A great order: Linux Fundamentals → Terminal & Bash → Networking → Kali Linux → Cybersecurity Fundamentals → Web Security → Security Analysis → Security Operations → Digital Forensics. See the Learning Path page.'],
    [['hello', 'hi', 'hey'], 'Hello! I\'m CyberForge Mentor. Ask me about Linux commands, networking, cybersecurity concepts, tools or how to practise safely.']
  ];

  // Requests aimed at harming real systems/people are declined and redirected to safe learning.
  const UNSAFE = /(hack|break into|crack|ddos|take down|steal|spy on)\b.*\b(someone|someone's|my (ex|neighbou?r|school|boss)|website|wifi|wi-fi|account|instagram|facebook|server|company)|\bexploit\b.*\b(real|live|production)\b/i;
  const UNSAFE_REPLY = 'I can\'t help with accessing or disrupting systems or accounts you do not own or lack written permission to test. If you want to learn how attacks work so you can defend against them, I can explain the concepts, or point you to safe labs (Metasploitable, DVWA, Juice Shop) and the CyberForge simulations.';

  function chmodAnswer(text) {
    const m = text.match(/chmod\s+([0-7]{3,4})\b/i);
    if (!m) return null;
    const digits = m[1].slice(-3).split('').map(Number);
    const word = (d) => (d & 4 ? 'read' : '') + (d & 2 ? (d & 4 ? ', ' : '') + 'write' : '') + (d & 1 ? (d & 6 ? ', ' : '') + 'execute' : '') || 'no permissions';
    const sym = (d) => (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-');
    const names = ['the file owner', 'the group', 'others'];
    let out = 'chmod ' + m[1] + ' gives ' + digits.map((d, i) => names[i] + ' ' + word(d)).join('; ') + '. Symbolic form: ' + digits.map(sym).join('') + '.';
    if (digits[2] & 2) out += ' Warning: others can write — that is rarely a good idea.';
    if (m[1] === '755') out += ' (755 is common for programs and directories: everyone can run/read, only the owner can change.)';
    return out;
  }

  function answer(text) {
    const t = text.toLowerCase();
    if (UNSAFE.test(t)) return UNSAFE_REPLY;
    const c = chmodAnswer(text);
    if (c) return c;
    for (const [keys, ans] of KB) {
      if (keys.some((k) => new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(t))) return ans;
    }
    return 'I don\'t have a prepared answer for that yet. Try asking about permissions (e.g. "What does chmod 755 mean?"), TCP vs UDP, DNS, port 443, hashing, MFA, SQL injection, XSS, SIEM, incident response or forensics. For deeper study, check the Learning Path.';
  }

  /** Public API. Swap the body for a call to your own backend later (see header comment). */
  CF.mentor = {
    ask(question) {
      const q = CF.clean(question, 300);
      return new Promise((resolve) => setTimeout(() => resolve(answer(q)), 350)); // simulated latency
    },
    mountChat(container, opts) {
      opts = opts || {};
      const log = h('div', { class: 'mentor-log', role: 'log', 'aria-live': 'polite' });
      const input = h('input', { type: 'text', maxlength: '300', placeholder: 'Ask a cybersecurity question…', 'aria-label': 'Ask CyberForge Mentor', autocomplete: 'off' });
      const send = h('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Ask');
      const form = h('form', { class: 'mentor-form' }, input, send);
      const add = (cls, text) => { const m = h('div', { class: 'msg ' + cls }, text); log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
      add('bot', 'Hi, I\'m CyberForge Mentor. Ask me about Linux, networking, cybersecurity concepts or tools. (Local demo mode: answers come from a built-in knowledge base.)');
      async function submit(text) {
        text = CF.clean(text, 300);
        if (!text) return;
        add('user', text);
        const wait = add('bot', '…');
        wait.textContent = await CF.mentor.ask(text);
        log.scrollTop = log.scrollHeight;
      }
      form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; submit(v); });
      const sugg = h('div', { class: 'mentor-sugg' }, ['What does chmod 755 mean?', 'TCP vs UDP?', 'What is port 443?', 'Explain SQL injection'].map((s) => h('button', { class: 'chip', type: 'button', onclick: () => submit(s) }, s)));
      container.append(log, sugg, form);
      return { submit };
    },
    mountWidget() {
      if (CF.$('#mentor-fab')) return;
      const panel = h('section', { class: 'mentor-panel', id: 'mentor-panel', hidden: true, 'aria-label': 'CyberForge Mentor chat' });
      const head = h('div', { class: 'mentor-head' }, h('div', null, 'CyberForge Mentor', h('small', null, '● online · local demo mode')), h('button', { type: 'button', 'aria-label': 'Close mentor', onclick: () => toggle(false) }, '×'));
      panel.appendChild(head);
      let built = false;
      const fab = h('button', { class: 'mentor-fab', id: 'mentor-fab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'mentor-panel' }, 'Ask Mentor');
      function toggle(open) {
        panel.hidden = !open; fab.setAttribute('aria-expanded', String(open));
        if (open && !built) { built = true; CF.mentor.mountChat(panel); }
        if (open) CF.$('input', panel).focus(); else fab.focus();
      }
      fab.addEventListener('click', () => toggle(panel.hidden));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
      document.body.append(panel, fab);
    }
  };
})();
