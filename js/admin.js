/*
 * Admin dashboard MOCKUP.
 * This page has NO real authentication: it is a client-side prototype using localStorage and
 * fictional users. In production the admin area must sit behind server-side authentication,
 * role checks and Row Level Security (see SECURITY.md and supabase/schema.sql).
 * All content entered here is validated, length-limited and always rendered as text.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;

  const USERS = [
    ['Avery Cole', 3420, 52, 11, 8, 0], ['Jordan Pike', 2890, 44, 9, 6, 1], ['Sam Ortega', 2450, 38, 8, 5, 0], ['Riley Chen', 1980, 31, 6, 4, 2],
    ['Taylor Brooks', 1710, 27, 5, 4, 3], ['Morgan Reyes', 1330, 22, 4, 2, 1], ['Casey Nguyen', 960, 18, 3, 2, 6], ['Jamie Patel', 720, 13, 2, 1, 9],
    ['Alex Novak', 540, 10, 2, 1, 2], ['Drew Santos', 310, 6, 1, 0, 14], ['Quinn Adler', 180, 4, 0, 0, 5], ['Robin Hale', 90, 2, 0, 0, 21]
  ].map((u) => ({ name: u[0], xp: u[1], lessons: u[2], labs: u[3], challenges: u[4], lastActiveDays: u[5] }));

  const csvSafe = (v) => { v = String(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; };
  const uid = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function table(heads, rows) {
    return h('div', { class: 'table-wrap' }, h('table', null,
      h('thead', null, h('tr', null, heads.map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
  }

  function field(label, input, id) { return h('div', { class: 'field' }, h('label', { for: id }, label), input); }
  function input(id, attrs) { return h('input', Object.assign({ id, type: 'text', maxlength: '120' }, attrs)); }

  function mergedUsers() {
    const s = CF.store.state();
    const me = { name: s.name + ' (you)', xp: s.xp, lessons: Object.keys(s.done.lesson).length, labs: Object.keys(s.done.lab).length, challenges: Object.keys(s.done.challenge).length, lastActiveDays: 0 };
    return [me].concat(USERS);
  }

  /* ---- Create forms ---- */
  function formShell(title, fields, onSave, saved) {
    const msg = h('p', { role: 'status', class: 'muted' });
    const form = h('form', { class: 'card', novalidate: true }, h('h3', null, title), fields, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save to localStorage'), msg);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = onSave();
      msg.textContent = res.ok ? 'Saved. (Stored only in this browser.)' : res.error;
      msg.style.color = res.ok ? 'var(--green)' : 'var(--red)';
      if (res.ok) { form.reset(); saved(); }
    });
    return form;
  }

  function mcqFields(prefix) {
    const opts = [0, 1, 2, 3].map((i) => field('Option ' + 'ABCD'[i], input(prefix + '-o' + i, { maxlength: '140' }), prefix + '-o' + i));
    const correct = h('select', { id: prefix + '-ans' }, ['A', 'B', 'C', 'D'].map((l, i) => h('option', { value: String(i) }, l)));
    return [field('Question', input(prefix + '-q', { maxlength: '240' }), prefix + '-q'), h('div', { class: 'form-grid' }, opts), field('Correct answer', correct, prefix + '-ans'), field('Explanation', input(prefix + '-ex', { maxlength: '300' }), prefix + '-ex')];
  }
  function readMcq(prefix) {
    const q = CF.clean(CF.$('#' + prefix + '-q').value, 240);
    const options = [0, 1, 2, 3].map((i) => CF.clean(CF.$('#' + prefix + '-o' + i).value, 140));
    const answer = Number(CF.$('#' + prefix + '-ans').value);
    if (q.length < 8) return { error: 'Question must be at least 8 characters.' };
    if (options.some((o) => !o)) return { error: 'All four options are required.' };
    if (new Set(options).size < 4) return { error: 'Options must be different.' };
    return { q, options, answer, explain: CF.clean(CF.$('#' + prefix + '-ex').value, 300) };
  }
  const num = (id, min, max, dflt) => { const n = Math.floor(Number(CF.$('#' + id).value)); return Number.isFinite(n) && n >= min && n <= max ? n : dflt; };
  const sel = (id, opts) => h('select', { id }, opts.map((o) => h('option', { value: o }, o)));
  const DIFFS = ['Beginner', 'Intermediate', 'Advanced'];

  function customList(kind, label, redraw) {
    const items = CF.db.customList(kind);
    if (!items.length) return h('div', { class: 'empty' }, 'No custom ' + label + ' yet. Use the form above.');
    return table(['Title', 'Details', ''], items.map((it) => [it.title, [it.category || it.course || it.skill || '', it.difficulty ? ' · ' + it.difficulty : '', it.xp ? ' · ' + it.xp + ' XP' : ''].join(''),
      h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { CF.db.customRemove(kind, it.id); redraw(); } }, 'Delete')]));
  }

  CF.pages = CF.pages || {};
  CF.pages.admin = function () {
    const page = h('div');
    page.appendChild(CF.pageHead('admin', 'Admin Dashboard', 'Content and platform overview (prototype).', 'Mockup'));
    const wrap = h('div', { class: 'container section-sm' });
    page.appendChild(wrap);
    wrap.appendChild(h('div', { class: 'notice' }, h('b', null, 'Prototype only. '), 'This dashboard has no authentication and uses fictional users plus your own browser data. A production admin area must enforce server-side authentication, role checks and Row Level Security — never client-side checks.'));
    const layout = h('div', { class: 'admin-layout' });
    const side = h('nav', { class: 'side-nav', 'aria-label': 'Admin sections' });
    const content = h('div', { 'aria-live': 'polite' });
    layout.append(side, content);
    wrap.appendChild(layout);

    const sections = [
      ['Overview', overview], ['Users', users], ['Courses', courses], ['Lessons', lessons], ['Labs', labs], ['Challenges', challenges], ['Tools', tools], ['Reports', reports]
    ];
    function show(name) {
      CF.$$('button', side).forEach((b) => b.setAttribute('aria-current', String(b.textContent === name)));
      CF.clear(content).appendChild(sections.find((s) => s[0] === name)[1]());
    }
    sections.forEach(([name]) => side.appendChild(h('button', { type: 'button', onclick: () => show(name) }, name)));

    function stat(label, value, sub) { return h('div', { class: 'stat' }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value), sub ? h('div', { class: 'sub' }, sub) : null); }

    function overview() {
      const us = mergedUsers();
      const active = us.filter((u) => u.lastActiveDays <= 7).length;
      const totalLessons = us.reduce((a, u) => a + u.lessons, 0), totalLabs = us.reduce((a, u) => a + u.labs, 0), totalCh = us.reduce((a, u) => a + u.challenges, 0);
      const avg = Math.round(us.reduce((a, u) => a + u.xp, 0) / us.length);
      const rate = CF.pct(totalCh, us.length * CF.allChallenges().length);
      const top = us.slice().sort((a, b) => b.xp - a.xp).slice(0, 6), max = top[0].xp || 1;
      return h('div', null,
        h('div', { class: 'stats' }, stat('Total users', CF.fmt(us.length)), stat('Active users', CF.fmt(active), 'last 7 days'), stat('Lessons completed', CF.fmt(totalLessons)),
          stat('Labs completed', CF.fmt(totalLabs)), stat('Average XP', CF.fmt(avg)), stat('Challenge completion', rate + '%', CF.fmt(totalCh) + ' completions')),
        h('h3', { css: { marginTop: '28px' } }, 'Top learners by XP'),
        h('div', { class: 'card' }, top.map((u) => h('div', { class: 'skill' }, h('div', { class: 'skill-head' }, h('span', null, u.name), h('span', null, CF.fmt(u.xp) + ' XP')), CF.bar(CF.pct(u.xp, max))))));
    }
    function users() {
      return h('div', null, h('h3', null, 'Users (fictional + you)'),
        table(['Name', 'XP', 'Level', 'Lessons', 'Labs', 'Challenges', 'Last active'], mergedUsers().map((u) => [u.name, CF.fmt(u.xp), String(CF.store.levelInfo(u.xp).level), String(u.lessons), String(u.labs), String(u.challenges), u.lastActiveDays === 0 ? 'today' : u.lastActiveDays + 'd ago'])));
    }
    function courses() {
      const box = h('div');
      const draw = () => {
        CF.clear(box);
        const form = formShell('Create Course', [
          field('Title', input('c-title'), 'c-title'), field('Description', input('c-desc', { maxlength: '300' }), 'c-desc'),
          h('div', { class: 'form-grid' }, field('Difficulty', sel('c-diff', DIFFS), 'c-diff'), field('Skill area', sel('c-skill', CF.SKILLS.map((s) => s.id)), 'c-skill'))],
          () => {
            const title = CF.clean(CF.$('#c-title').value, 80), desc = CF.clean(CF.$('#c-desc').value, 300);
            if (title.length < 4) return { error: 'Title must be at least 4 characters.' };
            if (desc.length < 10) return { error: 'Description must be at least 10 characters.' };
            const ok = CF.db.customAdd('courses', { id: uid('course'), title, desc, difficulty: CF.$('#c-diff').value, skill: CF.$('#c-skill').value });
            return ok ? { ok: true } : { error: 'Could not save (storage unavailable).' };
          }, draw);
        box.append(form, h('h3', { css: { marginTop: '24px' } }, 'Built-in courses'),
          table(['Course', 'Lessons', 'Difficulty', 'XP'], CF.COURSES.map((c) => [c.title, String(c.lessons.length), c.difficulty, String(CF.lessonXP(c))])),
          h('h3', { css: { marginTop: '24px' } }, 'Custom courses'), customList('courses', 'courses', draw));
      };
      draw(); return box;
    }
    function lessons() {
      const box = h('div');
      const draw = () => {
        CF.clear(box);
        const cs = CF.db.customList('courses');
        if (!cs.length) { box.appendChild(h('div', { class: 'empty' }, 'Create a custom course first, then add lessons to it.')); return; }
        const courseSel = h('select', { id: 'l-course' }, cs.map((c) => h('option', { value: c.id }, c.title)));
        const form = formShell('Create Lesson', [field('Course', courseSel, 'l-course'), field('Lesson title', input('l-title'), 'l-title'),
          field('Lesson content (plain text; blank line = new paragraph)', h('textarea', { id: 'l-body', maxlength: '4000' }), 'l-body')],
          () => {
            const title = CF.clean(CF.$('#l-title').value, 100), body = String(CF.$('#l-body').value).replace(/[<>]/g, '').slice(0, 4000).trim();
            if (title.length < 4) return { error: 'Title must be at least 4 characters.' };
            if (body.length < 20) return { error: 'Content must be at least 20 characters.' };
            const course = cs.find((c) => c.id === courseSel.value);
            if (!course) return { error: 'Choose a course.' };
            return CF.db.customAdd('lessons', { id: uid('lesson'), title, body, courseId: course.id, course: course.title }) ? { ok: true } : { error: 'Could not save.' };
          }, draw);
        box.append(form, h('h3', { css: { marginTop: '24px' } }, 'Custom lessons'), customList('lessons', 'lessons', draw));
      };
      draw(); return box;
    }
    function labs() {
      const box = h('div');
      const draw = () => {
        CF.clear(box);
        const form = formShell('Create Lab', [field('Title', input('lab-title'), 'lab-title'), field('Scenario / intro', input('lab-intro', { maxlength: '300' }), 'lab-intro'),
          h('div', { class: 'form-grid' }, field('Category', sel('lab-cat', CF.LAB_CATEGORIES), 'lab-cat'), field('Difficulty', sel('lab-diff', DIFFS), 'lab-diff'),
            field('XP (10–1000)', input('lab-xp', { type: 'number', value: '250', min: '10', max: '1000' }), 'lab-xp'), field('Minutes (1–180)', input('lab-time', { type: 'number', value: '15', min: '1', max: '180' }), 'lab-time')),
          mcqFields('lab')],
          () => {
            const title = CF.clean(CF.$('#lab-title').value, 80), intro = CF.clean(CF.$('#lab-intro').value, 300);
            if (title.length < 4) return { error: 'Title must be at least 4 characters.' };
            if (intro.length < 10) return { error: 'Intro must be at least 10 characters.' };
            const m = readMcq('lab'); if (m.error) return m;
            return CF.db.customAdd('labs', { id: uid('lab-c'), title, intro, category: CF.$('#lab-cat').value, difficulty: CF.$('#lab-diff').value, xp: num('lab-xp', 10, 1000, 250), time: num('lab-time', 1, 180, 15), q: m.q, options: m.options, answer: m.answer, explain: m.explain }) ? { ok: true } : { error: 'Could not save.' };
          }, draw);
        box.append(form, h('p', { class: 'muted', css: { marginTop: '12px' } }, 'Custom labs appear on the Labs page.'), h('h3', null, 'Built-in labs'),
          table(['Lab', 'Category', 'Difficulty', 'XP'], CF.LABS.map((l) => [l.title, l.category, l.difficulty, String(l.xp)])), h('h3', { css: { marginTop: '24px' } }, 'Custom labs'), customList('labs', 'labs', draw));
      };
      draw(); return box;
    }
    function challenges() {
      const box = h('div');
      const draw = () => {
        CF.clear(box);
        const form = formShell('Create Challenge', [field('Title', input('ch-title'), 'ch-title'), field('Intro', input('ch-intro', { maxlength: '300' }), 'ch-intro'),
          h('div', { class: 'form-grid' }, field('Difficulty', sel('ch-diff', DIFFS), 'ch-diff'), field('XP (10–1000)', input('ch-xp', { type: 'number', value: '250', min: '10', max: '1000' }), 'ch-xp')), mcqFields('ch')],
          () => {
            const title = CF.clean(CF.$('#ch-title').value, 80), intro = CF.clean(CF.$('#ch-intro').value, 300);
            if (title.length < 4) return { error: 'Title must be at least 4 characters.' };
            if (intro.length < 10) return { error: 'Intro must be at least 10 characters.' };
            const m = readMcq('ch'); if (m.error) return m;
            return CF.db.customAdd('challenges', { id: uid('ch-c'), title, intro, difficulty: CF.$('#ch-diff').value, xp: num('ch-xp', 10, 1000, 250), q: m.q, options: m.options, answer: m.answer, explain: m.explain }) ? { ok: true } : { error: 'Could not save.' };
          }, draw);
        box.append(form, h('h3', { css: { marginTop: '24px' } }, 'Built-in challenges'), table(['Challenge', 'Type', 'Difficulty'], CF.CHALLENGES.map((c) => [c.title, c.type, c.difficulty])),
          h('h3', { css: { marginTop: '24px' } }, 'Custom challenges'), customList('challenges', 'challenges', draw));
      };
      draw(); return box;
    }
    function tools() {
      const by = {}; CF.TOOLS.forEach((t) => { by[t.category] = (by[t.category] || 0) + 1; });
      return h('div', null, h('h3', null, 'Tool library (' + CF.TOOLS.length + ' tools)'), table(['Category', 'Tools'], Object.keys(by).map((k) => [k, String(by[k])])),
        h('p', { class: 'muted', css: { marginTop: '12px' } }, 'Tool entries live in js/tools.js today and map to the tool_library table in the Supabase schema.'));
    }
    function reports() {
      const us = mergedUsers();
      return h('div', null, h('h3', null, 'Reports & exports'),
        h('div', { class: 'card' },
          h('p', null, 'Download data from this prototype. Files are generated in your browser; nothing is uploaded.'),
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn', type: 'button', onclick: () => CF.download('cyberforge-users.csv', ['name,xp,level,lessons,labs,challenges'].concat(us.map((u) => [csvSafe(u.name).replace(/,/g, ' '), u.xp, CF.store.levelInfo(u.xp).level, u.lessons, u.labs, u.challenges].join(','))).join('\n'), 'text/csv') }, 'Export users (CSV)'),
            h('button', { class: 'btn', type: 'button', onclick: () => CF.download('cyberforge-custom-content.json', JSON.stringify(CF.db.customAll(), null, 2)) }, 'Export custom content (JSON)'),
            h('button', { class: 'btn', type: 'button', onclick: () => CF.download('cyberforge-progress.json', CF.store.exportJSON()) }, 'Export my progress (JSON)'))),
        h('h3', { css: { marginTop: '24px' } }, 'Skill coverage'),
        h('div', { class: 'card' }, CF.catalog.skillProgress().map((s) => h('div', { class: 'skill' }, h('div', { class: 'skill-head' }, h('span', null, s.label), h('span', null, s.done + '/' + s.total + ' items')), CF.bar(s.pct)))));
    }
    show('Overview');
    return page;
  };
})();
