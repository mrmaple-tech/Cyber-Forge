/* CyberForge — Home, Learn (path), Progress, Profile and About pages. */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  CF.pages = CF.pages || {};

  /* ---- helpers ---- */
  CF.titleOf = function (kind, id) {
    if (kind === 'lesson') { for (const c of CF.COURSES) { const l = c.lessons.find((x) => x.id === id); if (l) return l.title; } }
    if (kind === 'quiz') { const c = CF.course(id.replace('quiz-', '')); if (c) return c.title + ' quiz'; }
    if (kind === 'lab') { const l = CF.allLabs().find((x) => x.id === id); if (l) return l.title; }
    if (kind === 'challenge') { const l = CF.allChallenges().find((x) => x.id === id); if (l) return l.title; }
    if (kind === 'mission') return 'Terminal ' + id.replace('mission-', 'mission ');
    if (kind === 'daily') return id.startsWith('bonus:') ? 'Perfect-score bonus' : 'Daily challenge ' + id.replace('daily-', '');
    return id;
  };

  function levelStatus(lv) {
    const p = CF.catalog.courseProgress(lv.course);
    return { p, label: p.complete ? 'Completed' : p.done ? 'In progress' : 'Not started', cls: p.complete ? 'green' : p.done ? 'cyan' : '' };
  }

  function levelCard(lv) {
    const c = CF.course(lv.course), st = levelStatus(lv);
    const pre = lv.prereq.map((n) => 'Level ' + n + ' · ' + CF.PATH[n - 1].title);
    const missing = lv.prereq.filter((n) => !CF.catalog.courseProgress(CF.PATH[n - 1].course).complete);
    return h('article', { class: 'level ' + (st.p.complete ? 'done' : st.p.done ? 'progress' : '') },
      h('div', { class: 'card' },
        h('div', { class: 'level-head' }, h('div', null, h('span', { class: 'level-num' }, 'LEVEL ' + lv.n), h('h3', { css: { margin: '4px 0 0' } }, lv.title)), h('span', { class: 'pill ' + st.cls }, st.label)),
        h('p', { css: { margin: '10px 0' } }, lv.desc),
        h('div', { class: 'level-stats' }, h('span', null, 'Difficulty: ', h('b', null, lv.difficulty)), h('span', null, 'Lessons: ', h('b', null, String(c.lessons.length))), h('span', null, 'XP reward: ', h('b', null, CF.fmt(CF.lessonXP(c)))), h('span', null, 'Progress: ', h('b', null, st.p.pct + '%'))),
        CF.bar(st.p.pct),
        h('p', { class: 'muted', css: { fontSize: '.85rem', margin: '10px 0' } }, 'Prerequisites: ' + (pre.length ? pre.join(' · ') : 'none — start here'), missing.length ? '  (recommended before this level)' : ''),
        h('a', { class: 'btn btn-sm ' + (st.p.complete ? '' : 'btn-primary'), href: lv.page }, st.p.done ? (st.p.complete ? 'Review level' : 'Continue') : 'Start level')));
  }

  /* ---------------- HOME ---------------- */
  function typeTerminal(body) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PROMPT = 'cyberforge@kali:~$ ';
    const script = [['whoami', 'student'], ['echo "Welcome to CyberForge"', 'Welcome to CyberForge']];
    const caret = h('span', { class: 'caret', 'aria-hidden': 'true' });
    function newLine(prompt) { const l = h('div', { class: 'term-line' }); if (prompt) l.append(h('span', { class: 'prompt' }, PROMPT)); body.appendChild(l); return l; }
    if (reduce) {
      script.forEach(([c, o]) => { const l = newLine(true); l.append(c); newLine(false).append(h('span', { class: 'ok' }, o)); });
      newLine(true).append(caret); return;
    }
    let step = 0;
    function next() {
      if (step >= script.length) { const l = newLine(true); l.append(caret); return; }
      const [cmd, out] = script[step++];
      const line = newLine(true), txt = document.createTextNode(''); line.append(txt, caret);
      let i = 0;
      const t = setInterval(() => {
        txt.nodeValue = cmd.slice(0, ++i);
        if (i >= cmd.length) {
          clearInterval(t); caret.remove();
          setTimeout(() => { newLine(false).append(h('span', { class: 'ok' }, out)); body.appendChild(h('div', { class: 'term-line' }, ' ')); setTimeout(next, 450); }, 350);
        }
      }, 45);
    }
    setTimeout(next, 500);
  }

  CF.pages.home = function () {
    const page = h('div');
    const body = h('div', { class: 'term-body', 'aria-label': 'Terminal animation' });
    const lessonsTotal = CF.COURSES.reduce((a, c) => a + c.lessons.length, 0);
    page.appendChild(h('section', { class: 'hero' }, h('div', { class: 'container hero-grid' },
      h('div', null,
        h('span', { class: 'eyebrow' }, 'Interactive cybersecurity training'),
        h('h1', null, h('span', { class: 'logo-word' }, 'CYBERFORGE'), h('span', { class: 'tag' }, 'Learn Kali Linux.'), h('span', { class: 'tag' }, 'Master Cybersecurity.')),
        h('p', { class: 'sub' }, 'Build real cybersecurity skills through interactive lessons, safe labs, practical challenges, and guided learning.'),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-primary', href: 'learn.html' }, 'START LEARNING'), h('a', { class: 'btn', href: 'labs.html' }, 'EXPLORE LABS')),
        h('div', { class: 'status-line' }, h('span', null, h('i', { class: 'dot' }), 'Simulated labs only'), h('span', null, h('i', { class: 'dot' }), CF.COURSES.length + ' courses · ' + lessonsTotal + ' lessons'), h('span', null, h('i', { class: 'dot amber' }), 'Progress saved in your browser'))),
      h('div', { class: 'term', 'aria-label': 'Terminal demo' }, h('div', { class: 'term-bar' }, h('i'), h('i'), h('i'), h('span', null, 'cyberforge@kali: ~')), body))));
    typeTerminal(body);

    const feat = (icon, t, d) => h('div', { class: 'card feature' }, h('div', { class: 'icon', 'aria-hidden': 'true' }, icon), h('h3', null, t), h('p', { class: 'muted' }, d));
    page.appendChild(h('section', { class: 'section-sm' }, h('div', { class: 'container' }, h('div', { class: 'grid grid-4' },
      feat('01', 'LEARN', 'Build cybersecurity knowledge.'), feat('02', 'PRACTICE', 'Apply concepts in controlled environments.'),
      feat('03', 'ANALYZE', 'Understand systems, networks, and security events.'), feat('04', 'DEFEND', 'Learn how to identify and respond to security problems.')))));

    // Learning path preview
    page.appendChild(h('section', { class: 'section' }, h('div', { class: 'container' },
      h('span', { class: 'eyebrow' }, 'Learning path'), h('h2', null, 'Ten levels from first command to advanced practice'),
      h('p', { class: 'lead' }, 'Each level has lessons, a quiz and XP. Follow the order, or jump to what you need.'),
      h('div', { class: 'grid grid-3', css: { marginTop: '24px' } }, CF.PATH.map((lv) => {
        const st = levelStatus(lv);
        return h('a', { class: 'card hover', href: lv.page }, h('span', { class: 'kicker' }, 'LEVEL ' + lv.n), h('h3', null, lv.title), h('div', { class: 'meta-row' }, CF.diffPill(lv.difficulty), h('span', { class: 'pill ' + st.cls }, st.label)), CF.bar(st.p.pct));
      })),
      h('p', { css: { marginTop: '20px' } }, h('a', { href: 'learn.html' }, 'See the full learning path →')))));

    page.appendChild(h('section', { class: 'section-sm' }, h('div', { class: 'container grid grid-2' }, CF.dailyCard(true),
      h('div', { class: 'card' }, h('span', { class: 'kicker' }, 'Your progress'), h('h3', null, 'Level ' + CF.store.info().level + ' · ' + CF.rank(CF.store.info().level)),
        h('p', { class: 'muted' }, CF.fmt(CF.store.state().xp) + ' XP · ' + CF.store.streak() + '-day streak'), CF.bar(CF.store.info().pct), h('p', { css: { marginTop: '12px', marginBottom: 0 } }, h('a', { href: 'progress.html' }, 'Open your dashboard →'))))));

    page.appendChild(h('section', { class: 'section' }, h('div', { class: 'container' }, h('div', { class: 'cta-band' },
      h('h2', null, 'Start with a single command'), h('p', { class: 'lead', css: { margin: '0 auto 22px' } }, 'Open the simulated terminal and complete your first mission. It never touches your computer.'),
      h('div', { class: 'btn-row', css: { justifyContent: 'center' } }, h('a', { class: 'btn btn-primary', href: 'kali.html#terminal' }, 'Open the terminal'), h('a', { class: 'btn', href: 'about.html' }, 'How CyberForge keeps you safe'))))));
    return page;
  };

  /* ---------------- LEARN ---------------- */
  CF.pages.learn = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('learn', 'Learning Path', 'Ten levels take you from Linux basics to advanced cybersecurity. Each level lists its difficulty, lesson count, XP reward, prerequisites and your completion status.', 'Learn'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const info = CF.store.info();
    wrap.appendChild(h('div', { class: 'stats', css: { marginBottom: '28px' } },
      h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Your level'), h('div', { class: 'value green' }, String(info.level)), h('div', { class: 'sub' }, info.rank)),
      h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Total XP'), h('div', { class: 'value' }, CF.fmt(CF.store.state().xp)), h('div', { class: 'sub' }, CF.fmt(info.next - CF.store.state().xp) + ' to next level')),
      h('div', { class: 'stat' }, h('div', { class: 'label' }, 'Courses completed'), h('div', { class: 'value cyan' }, CF.catalog.coursesCompleted() + ' / ' + CF.COURSES.length))));
    wrap.appendChild(h('div', { class: 'path' }, CF.PATH.map(levelCard)));

    const custom = CF.db.customList('courses');
    if (custom.length) {
      const lessons = CF.db.customList('lessons');
      wrap.appendChild(h('hr', { class: 'divider' }));
      wrap.appendChild(h('h2', null, 'Custom courses'));
      wrap.appendChild(h('p', { class: 'muted' }, 'Created in the Admin dashboard prototype and stored only in this browser.'));
      custom.forEach((c) => {
        wrap.appendChild(h('div', { class: 'card', css: { marginBottom: '16px' } }, h('span', { class: 'kicker' }, c.skill + ' · ' + c.difficulty), h('h3', null, c.title), h('p', null, c.desc),
          lessons.filter((l) => l.courseId === c.id).map((l) => h('details', { class: 'lesson' }, h('summary', null, h('span', { class: 'ttl' }, l.title)), h('div', { class: 'lesson-body' }, l.body.split(/\n\s*\n/).map((para) => h('p', null, para))))))); // text nodes only
      });
    }
    return page;
  };

  /* ---------------- PROGRESS ---------------- */
  CF.pages.progress = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('progress', 'Progress Dashboard', 'Your CyberForge profile, skills and achievements. Progress is stored in this browser.', 'Dashboard'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const s = CF.store.state(), info = CF.store.info();
    const stat = (l, v, c, sub) => h('div', { class: 'stat' }, h('div', { class: 'label' }, l), h('div', { class: 'value ' + (c || '') }, v), sub ? h('div', { class: 'sub' }, sub) : null);
    wrap.appendChild(h('div', { class: 'stats' },
      stat('Level', String(info.level), 'green', info.rank), stat('XP', CF.fmt(s.xp), 'cyan', info.into + ' / ' + info.need + ' to level ' + (info.level + 1)),
      stat('Courses completed', CF.catalog.coursesCompleted() + '/' + CF.COURSES.length), stat('Labs completed', String(CF.store.countDone('lab')) + '/' + CF.allLabs().length),
      stat('Challenges completed', String(CF.store.countDone('challenge')) + '/' + CF.allChallenges().length), stat('Current streak', CF.store.streak() + ' day' + (CF.store.streak() === 1 ? '' : 's'))));
    wrap.appendChild(h('div', { css: { margin: '16px 0 28px' } }, h('div', { class: 'skill-head' }, h('span', null, 'Progress to level ' + (info.level + 1)), h('span', null, info.pct + '%')), CF.bar(info.pct)));

    const skills = CF.catalog.skillProgress();
    const profile = h('div', { class: 'card' },
      h('span', { class: 'kicker' }, 'CyberForge profile'), h('h3', null, s.name),
      h('p', { class: 'mono', css: { margin: '0 0 14px' } }, 'Level ' + info.level + ' · ' + CF.fmt(s.xp) + ' XP'),
      skills.map((k) => h('div', { class: 'skill' }, h('div', { class: 'skill-head' }, h('span', null, k.label), h('span', null, k.pct + '%')), h('div', { class: 'ascii-bar', 'aria-hidden': 'true' }, CF.asciiBar(k.pct)), h('div', { class: 'sr-only' }, k.pct + ' percent complete'), CF.bar(k.pct))));
    const recent = Object.keys(s.done).flatMap((k) => Object.entries(s.done[k]).map(([id, e]) => ({ k, id, t: e.t, xp: e.xp }))).sort((a, b) => b.t - a.t).slice(0, 8);
    const activity = h('div', { class: 'card' }, h('span', { class: 'kicker' }, 'Recent activity'),
      recent.length ? h('ul', { css: { listStyle: 'none', padding: 0, margin: 0 } }, recent.map((r) => h('li', { css: { padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px' } }, h('span', null, h('span', { class: 'pill', css: { marginRight: '8px' } }, r.k), CF.titleOf(r.k, r.id)), h('span', { class: 'mono', css: { color: 'var(--green)' } }, '+' + r.xp)))) : h('p', { class: 'muted' }, 'Nothing yet. Complete a lesson to get started.'));
    wrap.appendChild(h('div', { class: 'grid grid-2' }, profile, h('div', null, activity, h('div', { css: { height: '20px' } }), CF.dailyCard(true))));

    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'Badges'));
    wrap.appendChild(badgeGrid());
    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'XP rules'));
    wrap.appendChild(h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Activity'), h('th', null, 'XP'))),
      h('tbody', null, [['Complete a lesson', CF.XP.lesson], ['Complete a quiz (60%+)', CF.XP.quiz], ['Complete a terminal mission', CF.XP.mission], ['Complete a lab', CF.XP.lab], ['Complete a challenge', CF.XP.challenge], ['Perfect challenge score (bonus)', CF.XP.challengeBonus], ['Daily security challenge', CF.XP.daily]].map((r) => h('tr', null, h('td', null, r[0]), h('td', { class: 'mono' }, '+' + r[1])))))));
    wrap.appendChild(h('p', { class: 'muted', css: { fontSize: '.85rem', marginTop: '10px' } }, 'Levels use threshold = 20 × (level − 1)² XP, so level 12 begins at 2,420 XP.'));
    return page;
  };

  function badgeGrid() {
    const s = CF.store.state();
    return h('div', { class: 'grid grid-4' }, CF.BADGES.map((b) => {
      const got = !!s.badges[b.id];
      return h('div', { class: 'card badge-card' + (got ? '' : ' locked') }, h('div', { class: 'badge-icon', 'aria-hidden': 'true' }, b.abbr), h('h4', null, b.name), h('p', null, b.desc), h('p', { css: { marginTop: '8px' } }, h('span', { class: 'pill ' + (got ? 'green' : '') }, got ? 'Unlocked' : 'Locked')));
    }));
  }
  CF.badgeGrid = badgeGrid;

  /* ---------------- PROFILE ---------------- */
  CF.pages.profile = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('profile', 'Profile', 'Your display name, badges and data controls. Everything is stored locally in your browser.', 'Account'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const s = CF.store.state(), info = CF.store.info();
    const initials = (s.name.match(/\b\w/g) || ['S']).slice(0, 2).join('').toUpperCase();
    const nameInput = h('input', { id: 'pname', type: 'text', maxlength: '24', value: s.name, autocomplete: 'nickname' });
    const msg = h('p', { role: 'status', class: 'muted' });
    const form = h('form', { novalidate: true }, h('div', { class: 'field' }, h('label', { for: 'pname' }, 'Display name (max 24 characters)'), nameInput), h('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Save name'), msg);
    form.addEventListener('submit', (e) => { e.preventDefault(); const n = CF.clean(nameInput.value, 24); if (n.length < 2) { msg.textContent = 'Name must be at least 2 characters.'; return; } CF.store.setName(n); msg.textContent = 'Saved.'; });

    const importMsg = h('p', { role: 'status', class: 'muted' });
    const file = h('input', { type: 'file', accept: 'application/json,.json', id: 'impfile', 'aria-label': 'Import progress file', css: { display: 'none' } });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (f.size > 500000) { importMsg.textContent = 'File too large.'; return; }
      const r = new FileReader();
      r.onload = () => { try { CF.store.importJSON(String(r.result)); importMsg.textContent = 'Progress imported. Reloading…'; setTimeout(() => location.reload(), 600); } catch (e) { importMsg.textContent = 'Import failed: ' + e.message; } };
      r.readAsText(f);
    });

    wrap.appendChild(h('div', { class: 'grid grid-2' },
      h('div', { class: 'card' }, h('div', { css: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' } },
        h('div', { class: 'badge-icon', css: { margin: 0 }, 'aria-hidden': 'true' }, initials), h('div', null, h('h3', { css: { margin: 0 } }, s.name), h('p', { class: 'muted', css: { margin: 0 } }, 'Level ' + info.level + ' · ' + info.rank + ' · ' + CF.fmt(s.xp) + ' XP'))), form),
      h('div', { class: 'card' }, h('h3', null, 'Your data'), h('p', { class: 'muted' }, 'CyberForge has no accounts or servers yet. Your progress lives in this browser\'s localStorage. Export a backup to move it to another device.'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn btn-sm', type: 'button', onclick: () => CF.download('cyberforge-progress.json', CF.store.exportJSON()) }, 'Export progress'),
          h('button', { class: 'btn btn-sm', type: 'button', onclick: () => file.click() }, 'Import progress'),
          h('button', { class: 'btn btn-sm btn-danger', type: 'button', onclick: () => { if (confirm('Reset ALL progress, XP, badges and custom content in this browser? This cannot be undone.')) { CF.store.reset(); location.reload(); } } }, 'Reset all')),
        file, importMsg)));
    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'Badges'));
    wrap.appendChild(badgeGrid());
    return page;
  };

  /* ---------------- ABOUT ---------------- */
  CF.pages.about = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('about', 'About CyberForge', 'A free, open cybersecurity education platform built around safe simulation, clear explanations and responsible practice.', 'About'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    const card = (t, body) => h('div', { class: 'card' }, h('h3', null, t), body);
    wrap.appendChild(h('div', { class: 'grid grid-3' },
      card('Our mission', h('p', { class: 'muted' }, 'Make cybersecurity skills accessible to beginners and intermediate learners with clear lessons, realistic investigation practice and a gentle path from the Linux terminal to security operations.')),
      card('Safe by design', h('p', { class: 'muted' }, 'Every lab, terminal and web application on CyberForge is a local JavaScript simulation using fictional data. Nothing scans, attacks or connects to real systems, and the terminal never runs a real command.')),
      card('Defence-first', h('p', { class: 'muted' }, 'We teach how systems work and how they fail so you can detect, prevent and respond. Offensive concepts appear only in authorised, simulated contexts and always alongside the defence.'))));
    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'Responsible use pledge'));
    wrap.appendChild(h('div', { class: 'card' }, h('ul', null, [
      'I will only test systems I own or have explicit written permission to assess.', 'I will practise in isolated labs on intentionally vulnerable targets.',
      'I will protect any data I encounter and report vulnerabilities responsibly.', 'I will use what I learn to help defend people and organisations.'].map((x) => h('li', null, x)))));
    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'How the platform works'));
    wrap.appendChild(h('div', { class: 'grid grid-2' },
      card('Technology', h('p', { class: 'muted' }, 'Plain HTML, CSS and JavaScript — no build step, no backend, no tracking and no third-party scripts. Progress is saved in localStorage. The code is structured so Supabase and a secure AI backend can be added later.')),
      card('Privacy', h('p', { class: 'muted' }, 'CyberForge collects nothing. Your name, XP and badges never leave your browser. You can export or reset them any time on the Profile page.'))));
    wrap.appendChild(h('h2', { css: { marginTop: '36px' } }, 'Frequently asked questions'));
    [['Why is the word "hacking" not used?', 'The profession is cybersecurity: protecting systems and the people who rely on them. We focus on understanding, detection, defence and authorised security testing.'],
      ['Does the terminal run real commands?', 'No. It is a JavaScript simulation over an in-memory fake filesystem. It cannot access your files, your network or any server.'],
      ['Can I use Kali Linux on my main computer?', 'We recommend a virtual machine on an isolated network. See the Kali Linux course, lesson 12: Building a safe cybersecurity lab.'],
      ['Is my progress saved?', 'Yes, in this browser. Use Profile → Export progress to back it up. Clearing site data removes it.'],
      ['Is the AI mentor a real AI?', 'Version 1 is a local knowledge-base demo. The code is prepared for a secure backend integration; no API keys ever live in the frontend.']]
      .forEach(([q, a]) => wrap.appendChild(h('details', { class: 'lesson' }, h('summary', null, h('span', { class: 'ttl' }, q)), h('div', { class: 'lesson-body' }, h('p', null, a)))));
    return page;
  };
})();
