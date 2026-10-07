/*
 * CyberForge simulated terminal.
 *
 * SECURITY: this is a PURE SIMULATION. It never executes real commands, never calls a
 * server, never uses eval/Function, and only operates on an in-memory JavaScript object
 * that models a tiny fake filesystem. Output is rendered with textContent only.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  const HOME = ['home', 'student'];
  const MAX_LINES = 300;

  // string => file contents, object => directory
  function buildFS() {
    return {
      home: {
        student: {
          Documents: {
            'meeting-agenda.txt': 'Weekly security sync\n1. Patch status\n2. Phishing report review\n3. Lab schedule',
            Policies: { 'acceptable-use.txt': 'Acceptable Use Policy (training copy)\nUse systems only for authorized purposes.' },
            Reports: {
              'q3-summary.txt': 'Q3 summary: 14 incidents triaged, 0 critical. MFA coverage: 92%.',
              'security-notes.txt': 'SECURITY NOTES\n- Always get written authorization before testing.\n- Keep lab VMs on host-only networks.\n- Record every action in your notes.\nFLAG{notes-found-responsibly}'
            }
          },
          Downloads: { 'readme.txt': 'Downloaded files should be verified with checksums.', 'installer-checksums.txt': 'sha256  4f2a...e91  kali-linux-lab.iso (example)' },
          Labs: {
            lab01: { 'scope.txt': 'LAB 01 SCOPE\nTarget: training-vm (simulated)\nAuthorized: yes (this is a simulation)', 'targets.txt': 'training-vm  192.168.56.110  intentionally vulnerable (fictional)', '.audit-token': 'AUDIT-TOKEN: CF-7731-HIDDEN-OK' },
            lab02: { 'capture-notes.txt': 'Capture notes: DNS lookups observed from training-vm to lab-dns.' }
          },
          Tools: { 'README.txt': 'Tools directory. See the Security Tools library on CyberForge.', wordlists: { 'sample-words.txt': 'alpha\nbravo\ncharlie\ndelta' } },
          'notes.txt': 'Personal study notes.\nTODO: finish Linux Fundamentals.'
        }
      }
    };
  }

  const MISSIONS = [
    { id: 'mission-01', n: 1, text: 'Locate the security-notes.txt file and read it with cat.', hint: 'Look inside Documents, then Reports. Use ls to list and cd to move.', check: (c) => c.events.cat.has('/home/student/Documents/Reports/security-notes.txt') },
    { id: 'mission-02', n: 2, text: 'Create a directory named evidence inside ~/Labs/lab01.', hint: 'cd Labs/lab01 then mkdir evidence — or use a full path.', check: (c) => c.isDir('/home/student/Labs/lab01/evidence') },
    { id: 'mission-03', n: 3, text: 'Create an empty file named findings.txt inside the evidence directory.', hint: 'touch ~/Labs/lab01/evidence/findings.txt', check: (c) => c.isFile('/home/student/Labs/lab01/evidence/findings.txt') },
    { id: 'mission-04', n: 4, text: 'There is a hidden file in ~/Labs/lab01. Find it and read it.', hint: 'Hidden files start with a dot. Try ls -a, then cat the file.', check: (c) => c.events.cat.has('/home/student/Labs/lab01/.audit-token') },
    { id: 'mission-05', n: 5, text: 'Run pwd while inside ~/Tools/wordlists.', hint: 'cd Tools/wordlists and then run pwd.', check: (c) => c.events.pwd.has('/home/student/Tools/wordlists') }
  ];

  const HELP = [
    'Available commands (simulation):',
    '  ls [-a] [-l] [path]   list directory contents',
    '  pwd                   print working directory',
    '  cd [path]             change directory (.., ~, absolute and relative paths)',
    '  cat <file>            print a file',
    '  mkdir [-p] <dir>      create a directory',
    '  touch <file>          create an empty file',
    '  echo <text>           print text',
    '  whoami · hostname · history · clear',
    '  mission               show the current mission',
    '  help                  show this help',
    'This terminal is a safe simulation. It never runs real commands.'
  ];

  function mount(container, opts) {
    opts = opts || {};
    const fs = buildFS();
    const missions = opts.missions || MISSIONS;
    let cwd = HOME.slice();
    const history = [];
    let hIdx = 0;
    const events = { cat: new Set(), pwd: new Set() };
    const sessionDone = new Set();

    const join = (parts) => '/' + parts.join('/');
    const pretty = (parts) => (parts.join('/') === HOME.join('/') ? '~' : parts.slice(0, 2).join('/') === HOME.join('/') ? '~/' + parts.slice(2).join('/') : join(parts));

    function resolve(p) {
      let parts = p.startsWith('/') ? [] : cwd.slice();
      if (p === '~' || p.startsWith('~/')) { parts = HOME.slice(); p = p.slice(1); }
      for (const seg of p.split('/')) {
        if (!seg || seg === '.') continue;
        if (seg === '..') parts.pop(); else parts.push(seg);
      }
      return parts;
    }
    function node(parts) {
      let n = fs;
      for (const seg of parts) {
        if (n === null || typeof n !== 'object' || !Object.prototype.hasOwnProperty.call(n, seg)) return undefined;
        n = n[seg];
      }
      return n;
    }
    const isDirNode = (n) => n !== undefined && typeof n === 'object';
    const ctx = {
      events,
      isDir: (p) => isDirNode(node(resolve(p))),
      isFile: (p) => typeof node(resolve(p)) === 'string'
    };
    const validName = (s) => /^[\w][\w.\- ]{0,63}$/.test(s) && !['__proto__', 'constructor', 'prototype'].includes(s);

    // ---- UI ----
    const body = h('div', { class: 'term-body' + (opts.tall ? ' tall' : ''), role: 'log', 'aria-live': 'polite', tabindex: '0', 'aria-label': 'Terminal output' });
    const promptEl = h('span', { class: 'prompt' });
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '200', 'aria-label': 'Terminal command input' });
    const form = h('form', { class: 'term-input' }, promptEl, input);
    const term = h('div', { class: 'term' },
      h('div', { class: 'term-bar' }, h('i'), h('i'), h('i'), h('span', null, 'cyberforge@kali — simulated terminal (safe sandbox)')), body, form);

    function setPrompt() { promptEl.textContent = 'cyberforge@kali:' + pretty(cwd) + '$'; }
    function out(text, cls) {
      String(text).split('\n').forEach((line) => body.appendChild(h('div', { class: 'term-line ' + (cls || '') }, line === '' ? ' ' : line)));
      while (body.childNodes.length > MAX_LINES) body.removeChild(body.firstChild);
      body.scrollTop = body.scrollHeight;
    }
    function echoCmd(line) {
      const l = h('div', { class: 'term-line' }, h('span', { class: 'prompt' }, promptEl.textContent + ' '), line);
      body.appendChild(l);
    }

    // ---- commands ----
    const cmds = {
      help: () => out(HELP.join('\n'), 'dim'),
      pwd: () => { const p = join(cwd); events.pwd.add(p); out(p); },
      whoami: () => out('student'),
      hostname: () => out('kali'),
      history: () => history.forEach((c, i) => out(String(i + 1).padStart(4) + '  ' + c)),
      clear: () => CF.clear(body),
      echo: (a) => out(a.join(' ')),
      mission: () => { const m = currentMission(); out(m ? 'MISSION ' + String(m.n).padStart(2, '0') + ': ' + m.text : 'All missions complete. Great work.', 'accent'); },
      ls: (a) => {
        const flags = a.filter((x) => x.startsWith('-')).join('');
        const paths = a.filter((x) => !x.startsWith('-'));
        const all = flags.includes('a'), long = flags.includes('l');
        (paths.length ? paths : ['.']).forEach((p, i, arr) => {
          const parts = resolve(p), n = node(parts);
          if (n === undefined) return out('ls: cannot access \'' + p + '\': No such file or directory', 'err');
          if (arr.length > 1) out((i ? '\n' : '') + p + ':');
          if (!isDirNode(n)) return out(p);
          let names = Object.keys(n).sort((x, y) => x.localeCompare(y));
          if (!all) names = names.filter((x) => !x.startsWith('.'));
          if (all) { out(long ? 'drwxr-xr-x 2 student student 4096 .' : '.'); out(long ? 'drwxr-xr-x 3 student student 4096 ..' : '..'); }
          names.forEach((name) => {
            const dir = isDirNode(n[name]);
            const line = long ? (dir ? 'drwxr-xr-x' : '-rw-r--r--') + ' 1 student student ' + String(dir ? 4096 : n[name].length).padStart(5) + ' ' + name : name;
            out(line, dir ? 'accent' : '');
          });
        });
      },
      cd: (a) => {
        const target = a[0] || '~';
        const parts = resolve(target), n = node(parts);
        if (n === undefined) return out('cd: ' + target + ': No such file or directory', 'err');
        if (!isDirNode(n)) return out('cd: ' + target + ': Not a directory', 'err');
        cwd = parts; setPrompt();
      },
      cat: (a) => {
        if (!a.length) return out('cat: missing file operand', 'err');
        a.forEach((f) => {
          const parts = resolve(f), n = node(parts);
          if (n === undefined) return out('cat: ' + f + ': No such file or directory', 'err');
          if (isDirNode(n)) return out('cat: ' + f + ': Is a directory', 'err');
          events.cat.add(join(parts));
          out(n === '' ? '(empty file)' : n);
        });
      },
      mkdir: (a) => {
        const p = a.includes('-p');
        const names = a.filter((x) => x !== '-p');
        if (!names.length) return out('mkdir: missing operand', 'err');
        names.forEach((name) => {
          const parts = resolve(name);
          const leaf = parts[parts.length - 1];
          if (!leaf || !validName(leaf)) return out('mkdir: invalid directory name \'' + name + '\'', 'err');
          let n = fs;
          for (let i = 0; i < parts.length; i++) {
            const seg = parts[i], last = i === parts.length - 1;
            if (!Object.prototype.hasOwnProperty.call(n, seg)) {
              if (!last && !p) return out('mkdir: cannot create directory \'' + name + '\': No such file or directory', 'err');
              n[seg] = {};
            } else if (last) return out('mkdir: cannot create directory \'' + name + '\': File exists', 'err');
            if (!isDirNode(n[seg])) return out('mkdir: \'' + seg + '\' is not a directory', 'err');
            n = n[seg];
          }
        });
      },
      touch: (a) => {
        if (!a.length) return out('touch: missing file operand', 'err');
        a.forEach((name) => {
          const parts = resolve(name);
          const leaf = parts[parts.length - 1];
          const parent = node(parts.slice(0, -1));
          if (!leaf || !validName(leaf)) return out('touch: invalid file name \'' + name + '\'', 'err');
          if (!isDirNode(parent)) return out('touch: cannot touch \'' + name + '\': No such file or directory', 'err');
          if (!Object.prototype.hasOwnProperty.call(parent, leaf)) parent[leaf] = '';
        });
      }
    };

    // Tokenise respecting simple quotes. No expansion, no substitution, no pipes — it's a simulation.
    function tokenize(line) {
      const re = /"([^"]*)"|'([^']*)'|(\S+)/g, out2 = [];
      let m; while ((m = re.exec(line))) out2.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
      return out2;
    }

    function run(line) {
      echoCmd(line);
      const trimmed = line.trim();
      if (!trimmed) return;
      history.push(trimmed); hIdx = history.length;
      const [cmd, ...args] = tokenize(trimmed);
      if (/[|;&`$<>]/.test(trimmed)) return out('Shell operators are not supported in this simulation.', 'err');
      if (Object.prototype.hasOwnProperty.call(cmds, cmd)) cmds[cmd](args);
      else out(cmd + ': command not found (type "help" for available commands)', 'err');
      evaluateMissions();
    }

    // ---- missions ----
    let missionBox = null;
    const isDone = (m) => sessionDone.has(m.id) || (!m.custom && CF.store.isDone('mission', m.id));
    const currentMission = () => missions.find((m) => !isDone(m));

    function evaluateMissions() {
      const m = currentMission();
      if (m && m.check(ctx)) {
        sessionDone.add(m.id);
        let xp = 0;
        if (!m.custom) xp = CF.store.complete('mission', m.id, { xp: CF.XP.mission, skill: 'linux', label: 'Mission ' + m.n + ' complete' });
        out('', '');
        out('MISSION COMPLETE', 'ok');
        out(xp ? '+' + xp + ' XP' : (m.custom ? '' : '(XP already earned)'), 'ok');
        const next = currentMission();
        if (next) out('Next → MISSION ' + String(next.n).padStart(2, '0') + ': ' + next.text, 'accent');
        else out('All missions in this set are complete.', 'accent');
        if (opts.onMission) opts.onMission(m, !next);
        renderMissions();
      }
    }

    function renderMissions() {
      if (!missionBox) return;
      CF.clear(missionBox);
      missionBox.appendChild(h('h3', null, 'Missions'));
      const cur = currentMission();
      missions.forEach((m) => {
        const done = isDone(m), active = cur === m;
        const hint = h('p', { class: 'muted', hidden: true, css: { margin: '6px 0 0', fontSize: '.85rem' } }, 'Hint: ' + m.hint);
        missionBox.appendChild(h('div', { class: 'card' + (done ? ' complete' : ''), css: { padding: '14px', marginBottom: '10px', borderColor: active ? 'var(--cyan)' : '' } },
          h('span', { class: 'kicker' }, 'Mission ' + String(m.n).padStart(2, '0') + (m.custom ? '' : ' · +' + CF.XP.mission + ' XP')),
          h('p', { css: { margin: 0 } }, m.text),
          active ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', css: { marginTop: '8px' }, onclick: (e) => { hint.hidden = !hint.hidden; e.currentTarget.setAttribute('aria-expanded', String(!hint.hidden)); }, 'aria-expanded': 'false' }, 'Show hint') : null,
          active ? hint : null));
      });
    }

    // ---- input handling ----
    form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v.slice(0, 200)); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) { hIdx--; input.value = history[hIdx]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ''; } }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); CF.clear(body); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value, m = v.match(/(\S*)$/), word = m ? m[1] : '';
        const idx = word.lastIndexOf('/'), dirPart = idx >= 0 ? word.slice(0, idx + 1) : '', prefix = word.slice(idx + 1);
        const d = node(resolve(dirPart || '.'));
        if (!isDirNode(d)) return;
        const matches = Object.keys(d).filter((k) => k.startsWith(prefix) && (prefix.startsWith('.') || !k.startsWith('.')));
        if (matches.length === 1) input.value = v.slice(0, v.length - word.length) + dirPart + matches[0] + (isDirNode(d[matches[0]]) ? '/' : ' ');
        else if (matches.length > 1) out(matches.join('  '), 'dim');
      }
    });
    term.addEventListener('click', (e) => { if (window.getSelection().toString() === '' && e.target !== input) input.focus(); });

    setPrompt();
    out('CyberForge simulated terminal. Type "help" to begin. Nothing here runs on your computer.', 'dim');
    const m0 = currentMission();
    if (m0) out('MISSION ' + String(m0.n).padStart(2, '0') + ': ' + m0.text, 'accent');
    container.appendChild(term);

    if (opts.showMissions !== false) {
      missionBox = h('div');
      renderMissions();
      container.classList.add('split');
      container.appendChild(missionBox);
    }
    return { run, term, ctx };
  }

  CF.terminal = { mount, MISSIONS };
})();
