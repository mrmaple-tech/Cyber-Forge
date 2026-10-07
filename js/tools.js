/*
 * Security Tools library. Descriptive and educational: each tool lists its legitimate purpose,
 * a safe training environment and related lessons. Use only on systems you own or are
 * explicitly authorized in writing to assess.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;

  CF.TOOL_CATEGORIES = ['Information Gathering', 'Network Analysis', 'Web Security', 'Password Security', 'Wireless Security', 'Traffic Analysis', 'Vulnerability Assessment', 'Forensics', 'Reverse Engineering', 'Security Monitoring', 'Reporting'];

  // T(name, category, difficulty, description, purpose, concepts[], safeEnvironment, lessonIds[])
  const T = (name, category, difficulty, description, purpose, concepts, env, lessons) => ({ name, category, difficulty, description, purpose, concepts, env, lessons });
  const LAB = 'An isolated, host-only lab network containing intentionally vulnerable VMs such as Metasploitable.';

  CF.TOOLS = [
    T('Nmap', 'Information Gathering', 'Beginner', 'Open-source network discovery and security auditing tool that identifies hosts, open ports, services and versions.', 'Build an accurate inventory of what is exposed on networks you own or are authorized to assess.', ['Ports', 'TCP/UDP', 'Attack surface', 'Service enumeration'], LAB, ['net-05', 'net-03', 'kali-09', 'cyb-12']),
    T('theHarvester', 'Information Gathering', 'Beginner', 'Collects publicly available information such as email addresses, subdomains and hostnames from open sources.', 'Understand an organisation\'s public footprint during authorized reconnaissance or when reducing your own exposure.', ['OSINT', 'DNS', 'Public exposure'], 'Your own domain, or the fictional exercises in the OSINT labs.', ['net-06', 'kali-13']),
    T('Recon-ng', 'Information Gathering', 'Intermediate', 'A modular web reconnaissance framework with a workflow similar to a command-line console.', 'Organise open-source reconnaissance and keep results in a structured database.', ['OSINT', 'Scoping', 'Documentation'], 'Domains you own; fictional targets in CyberForge OSINT labs.', ['kali-14', 'kali-13']),
    T('Netcat', 'Network Analysis', 'Beginner', 'A simple utility for reading and writing data across TCP/UDP connections, often called the "Swiss army knife" of networking.', 'Test connectivity, understand how clients and servers talk and troubleshoot services.', ['Sockets', 'TCP/UDP', 'Ports', 'Troubleshooting'], 'Two lab VMs on a host-only network, or localhost.', ['net-03', 'net-04', 'net-05']),
    T('mtr', 'Network Analysis', 'Beginner', 'Combines traceroute and ping to show the path and per-hop latency or loss to a destination.', 'Diagnose routing and connectivity problems.', ['Routing', 'TTL', 'Latency'], 'Any host you are allowed to contact, such as your own server.', ['net-11']),
    T('Burp Suite', 'Web Security', 'Intermediate', 'An intercepting proxy and testing platform for web applications, with a free Community edition.', 'Inspect and modify HTTP(S) traffic between a browser and an authorized web application to understand and test its behaviour.', ['HTTP', 'Sessions', 'Input validation', 'Access control'], 'DVWA, OWASP Juice Shop or PortSwigger Web Security Academy labs.', ['net-08', 'web-03', 'web-08', 'web-12']),
    T('OWASP ZAP', 'Web Security', 'Beginner', 'Free, open-source web application scanner and intercepting proxy maintained by the OWASP community.', 'Find common web vulnerabilities in applications you build or are authorized to test, including in CI pipelines.', ['OWASP Top 10', 'DAST', 'Security headers'], 'Local OWASP Juice Shop or DVWA containers.', ['web-10', 'web-05', 'adv-03']),
    T('Gobuster', 'Web Security', 'Beginner', 'A fast tool for discovering hidden directories, files and DNS subdomains using wordlists.', 'Map the content of an authorized web server so unlinked or forgotten resources can be reviewed and removed.', ['Content discovery', 'Attack surface', 'Wordlists'], 'A local DVWA/Juice Shop instance.', ['web-12', 'kali-11']),
    T('Nikto', 'Web Security', 'Beginner', 'Open-source web server scanner that checks for outdated software, dangerous files and misconfigurations.', 'Quickly identify obvious server misconfigurations on systems you administer.', ['Misconfiguration', 'Patch management', 'Banners'], 'Your own test web server or lab VM.', ['cyb-10', 'cyb-11', 'web-10']),
    T('John the Ripper', 'Password Security', 'Intermediate', 'A widely used password-auditing tool that tests the strength of password hashes.', 'Audit password hash strength for accounts you are authorized to review and justify stronger policies.', ['Hashing', 'Salting', 'Password policy'], 'Hashes you generate yourself from test passwords in your own lab.', ['cyb-07', 'cyb-08', 'cyb-09']),
    T('Hashcat', 'Password Security', 'Intermediate', 'GPU-accelerated password recovery tool supporting many hash algorithms.', 'Demonstrate why fast hashes are unsuitable for passwords, and measure resistance of hashing choices.', ['Hashing', 'Work factor', 'Key stretching'], 'Self-generated sample hashes only.', ['cyb-07', 'cyb-08']),
    T('KeePassXC', 'Password Security', 'Beginner', 'An offline, open-source password manager.', 'Generate and store unique, strong passwords — a practical defensive control.', ['Password hygiene', 'MFA', 'Credential reuse'], 'Install locally; practise with a test database.', ['cyb-08', 'cyb-09']),
    T('Aircrack-ng', 'Wireless Security', 'Advanced', 'A suite of tools for assessing Wi-Fi network security (monitoring, capture, analysis and key-strength testing).', 'Evaluate the security of wireless networks that you own, and understand why WPA3 and strong passphrases matter.', ['Wi-Fi security', 'Encryption', 'Passphrase strength'], 'Your own access point in a lab; never neighbouring networks.', ['net-01', 'net-13', 'kali-13']),
    T('Kismet', 'Wireless Security', 'Intermediate', 'Wireless network detector, sniffer and intrusion detection system.', 'Survey and monitor wireless environments you are responsible for, and spot rogue access points.', ['Rogue AP', 'Wireless monitoring', 'Asset inventory'], 'Your own premises and equipment.', ['ops-08', 'net-02']),
    T('Wireshark', 'Traffic Analysis', 'Beginner', 'The world\'s most widely used network protocol analyser with a graphical interface.', 'Inspect captured traffic to learn protocols, troubleshoot and investigate suspicious activity.', ['Packets', 'Encapsulation', 'TCP handshake', 'DNS'], 'Sample capture files and traffic between your own lab VMs.', ['net-13', 'net-03', 'net-06', 'for-08']),
    T('tcpdump', 'Traffic Analysis', 'Intermediate', 'Command-line packet capture and filtering tool.', 'Capture traffic on servers where a GUI is unavailable, then analyse it later in Wireshark.', ['Packets', 'BPF filters', 'Troubleshooting'], 'Your own lab interfaces.', ['net-13', 'for-08']),
    T('NetworkMiner', 'Traffic Analysis', 'Intermediate', 'Network forensic analysis tool that extracts hosts, files and credentials metadata from packet captures.', 'Reconstruct what happened in a capture during investigations.', ['Network forensics', 'Evidence', 'Sessions'], 'Public sample pcaps and your lab captures.', ['for-08', 'for-05']),
    T('OpenVAS / Greenbone', 'Vulnerability Assessment', 'Intermediate', 'Open-source vulnerability scanner with a regularly updated feed of tests.', 'Run authenticated, scheduled vulnerability scans as part of a vulnerability management programme.', ['CVE', 'CVSS', 'Remediation SLAs'], LAB, ['cyb-12', 'cyb-11', 'ops-10']),
    T('Lynis', 'Vulnerability Assessment', 'Beginner', 'A security auditing tool for Unix-like systems that checks hardening and configuration.', 'Harden Linux hosts and track improvement over time.', ['Hardening', 'Baselines', 'Compliance'], 'Your own Kali or Debian VM.', ['cyb-10', 'kali-06']),
    T('Metasploit Framework', 'Vulnerability Assessment', 'Advanced', 'A modular framework used by professionals to validate whether known vulnerabilities are exploitable in authorized assessments.', 'Confirm risk, demonstrate impact to stakeholders and test detection capability — only with written authorization.', ['Exploit validation', 'Risk', 'Rules of engagement'], 'Metasploitable VMs on an isolated network. Never use against systems without permission.', ['kali-13', 'kali-12', 'cyb-12']),
    T('Autopsy', 'Forensics', 'Intermediate', 'Graphical digital forensics platform built on The Sleuth Kit.', 'Examine disk images: timelines, deleted files, web artefacts and keyword searches.', ['Disk images', 'File systems', 'Timelines', 'Chain of custody'], 'Fictional/public sample disk images.', ['for-03', 'for-05', 'for-06']),
    T('Volatility', 'Forensics', 'Advanced', 'Open-source memory forensics framework.', 'Analyse RAM captures: processes, network connections and injected code.', ['Memory forensics', 'Volatile data', 'Process trees'], 'Public sample memory images.', ['for-07', 'ops-07']),
    T('ExifTool', 'Forensics', 'Beginner', 'Reads, writes and removes metadata in many file types.', 'Inspect file metadata for investigations or strip location data before publishing.', ['Metadata', 'Privacy', 'OSINT'], 'Your own sample files.', ['for-02']),
    T('Ghidra', 'Reverse Engineering', 'Advanced', 'Open-source software reverse-engineering suite with disassembler and decompiler.', 'Understand how compiled software behaves for malware analysis or vulnerability research you are permitted to perform.', ['Disassembly', 'Static analysis', 'Malware concepts'], 'Training binaries and crackmes written for learners.', ['adv-05', 'adv-06']),
    T('radare2', 'Reverse Engineering', 'Advanced', 'Command-line reverse-engineering framework.', 'Scriptable binary analysis and debugging.', ['Static analysis', 'Debugging'], 'Training binaries.', ['adv-06']),
    T('Wazuh', 'Security Monitoring', 'Intermediate', 'Open-source security platform providing log analysis, file-integrity monitoring and threat detection.', 'Centralise endpoint telemetry and alerts — a practical SIEM/XDR lab.', ['SIEM', 'FIM', 'Detection rules'], 'A small lab with 2–3 VMs reporting to a Wazuh manager.', ['ops-04', 'ops-07', 'ops-02']),
    T('Security Onion', 'Security Monitoring', 'Advanced', 'Linux distribution for network security monitoring, log management and threat hunting.', 'Build a monitoring lab combining IDS, packet capture and hunting tools.', ['NSM', 'Threat hunting', 'IDS'], 'Virtualised lab with replayed sample traffic.', ['ops-08', 'adv-04']),
    T('Zeek', 'Security Monitoring', 'Advanced', 'Network analysis framework that turns traffic into rich, structured logs.', 'Gain visibility into connections, DNS, HTTP and certificates for detection and hunting.', ['Network logs', 'Metadata', 'Hunting'], 'Replay public pcaps.', ['ops-08', 'for-08']),
    T('Suricata', 'Security Monitoring', 'Intermediate', 'High-performance IDS/IPS and network security monitoring engine.', 'Detect (or block) known malicious patterns and policy violations.', ['IDS/IPS', 'Signatures', 'Alerts'], 'Lab network with replayed traffic.', ['ops-06', 'ops-08']),
    T('Dradis', 'Reporting', 'Beginner', 'Collaboration and reporting platform for security assessments.', 'Combine findings from multiple tools into consistent, professional reports.', ['Reporting', 'Findings', 'Remediation'], 'Practice with the fictional findings in the labs.', ['kali-14', 'ops-11']),
    T('CherryTree', 'Reporting', 'Beginner', 'Hierarchical note-taking application that ships with Kali.', 'Keep structured, timestamped notes for labs and engagements.', ['Documentation', 'Evidence', 'Reproducibility'], 'Any lab.', ['kali-14'])
  ];

  const PAGES = { net: 'networking.html', kali: 'kali.html', web: 'web-security.html', cyb: 'cybersecurity.html', adv: 'cybersecurity.html', ops: 'security-operations.html', ana: 'security-operations.html', for: 'forensics.html' };
  function lessonLink(id) {
    const prefix = id.split('-')[0];
    const course = CF.COURSES.find((c) => c.lessons.some((l) => l.id === id));
    const lesson = course && course.lessons.find((l) => l.id === id);
    if (!lesson || !PAGES[prefix]) return null;
    return h('a', { href: PAGES[prefix] + '#' + id }, lesson.title);
  }

  CF.pages = CF.pages || {};
  CF.pages.tools = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('tools', 'Security Tools Library', 'A curated reference of widely used cybersecurity tools: what they do, why professionals use them, and where to practise safely.', 'Reference'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    wrap.appendChild(h('div', { class: 'notice' }, h('b', null, 'Authorized use only. '), 'These tools are described for education, defence and authorized assessment. Use them only on systems you own or have explicit written permission to test, and prefer intentionally vulnerable training environments.'));

    let cat = 'All', diff = 'All', q = '';
    const grid = h('div', { class: 'grid grid-2' }), count = h('p', { class: 'muted', role: 'status' });
    const search = h('input', { type: 'search', class: 'search', placeholder: 'Search tools…', 'aria-label': 'Search tools', maxlength: '40' });
    search.addEventListener('input', () => { q = CF.clean(search.value, 40).toLowerCase(); draw(); });
    const diffSel = h('select', { 'aria-label': 'Filter by difficulty', css: { width: 'auto' } }, ['All', 'Beginner', 'Intermediate', 'Advanced'].map((d) => h('option', { value: d }, d === 'All' ? 'All difficulties' : d)));
    diffSel.addEventListener('change', () => { diff = diffSel.value; draw(); });
    const chips = h('div', { class: 'filters', role: 'group', 'aria-label': 'Categories' });
    function drawChips() {
      CF.clear(chips);
      ['All'].concat(CF.TOOL_CATEGORIES).forEach((c) => chips.appendChild(h('button', { class: 'chip', type: 'button', 'aria-pressed': String(cat === c), onclick: () => { cat = c; drawChips(); draw(); } }, c)));
    }
    wrap.append(h('div', { class: 'filters' }, search, diffSel), chips, count, grid);

    function draw() {
      CF.clear(grid);
      const shown = CF.TOOLS.filter((t) => (cat === 'All' || t.category === cat) && (diff === 'All' || t.difficulty === diff) &&
        (!q || (t.name + ' ' + t.description + ' ' + t.concepts.join(' ')).toLowerCase().includes(q)));
      count.textContent = shown.length + ' of ' + CF.TOOLS.length + ' tools';
      if (!shown.length) return grid.appendChild(h('div', { class: 'empty', css: { gridColumn: '1/-1' } }, 'No tools match your filters.'));
      shown.forEach((t) => {
        const links = t.lessons.map(lessonLink).filter(Boolean);
        grid.appendChild(h('article', { class: 'card tool-card' },
          h('span', { class: 'kicker' }, t.category),
          h('h3', null, t.name),
          h('div', { class: 'meta-row' }, CF.diffPill(t.difficulty)),
          h('p', null, t.description),
          h('dl', { class: 'kv' },
            h('dt', null, 'Purpose'), h('dd', null, t.purpose),
            h('dt', null, 'Safe training'), h('dd', null, t.env)),
          h('div', { class: 'tags', 'aria-label': 'Related concepts' }, t.concepts.map((c) => h('span', { class: 'pill cyan' }, c))),
          links.length ? h('p', { css: { fontSize: '.88rem', margin: 0 } }, h('span', { class: 'muted' }, 'Related lessons: '), links.reduce((acc, l, i) => (i ? acc.concat([', ', l]) : [l]), [])) : null));
      });
    }
    drawChips(); draw();
    return page;
  };
})();
