/* CyberForge — site header, responsive navigation and footer (shared by every page). */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;

  const COURSES = [
    ['learn.html', 'Learning Path'],
    ['linux.html', 'Linux Fundamentals'],
    ['kali.html', 'Kali Linux'],
    ['networking.html', 'Networking'],
    ['cybersecurity.html', 'Cybersecurity Fundamentals'],
    ['web-security.html', 'Web Security'],
    ['security-operations.html', 'Security Operations'],
    ['forensics.html', 'Digital Forensics']
  ];
  const MORE = [['profile.html', 'Profile'], ['about.html', 'About'], ['admin.html', 'Admin Dashboard']];
  const PAGE_FILES = { home: 'index.html' };

  function currentFile() {
    const f = location.pathname.split('/').pop();
    return f || 'index.html';
  }

  function link(href, label) {
    const here = currentFile() === href;
    return h('a', { href, 'aria-current': here ? 'page' : null }, label);
  }

  function dropdown(label, items) {
    const file = currentFile();
    const d = h('details', { class: items.some((i) => i[0] === file) ? 'active' : '' },
      h('summary', null, label + ' ▾'),
      h('div', { class: 'menu-panel' }, items.map((i) => link(i[0], i[1]))));
    return d;
  }

  function render() {
    const host = CF.$('#site-header');
    if (host) {
      const nav = h('nav', { class: 'nav', id: 'primary-nav', 'aria-label': 'Primary' },
        link('index.html', 'Home'),
        dropdown('Courses', COURSES),
        link('labs.html', 'Labs'),
        link('challenges.html', 'Challenges'),
        link('tools.html', 'Tools'),
        link('progress.html', 'Progress'),
        dropdown('More', MORE));
      const xpChip = h('a', { class: 'header-xp', href: 'progress.html', 'aria-label': 'Your level and XP' });
      const toggle = h('button', { class: 'menu-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'primary-nav', 'aria-label': 'Toggle navigation menu' }, '☰');
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? '✕' : '☰';
      });
      CF.clear(host).appendChild(h('div', { class: 'container header-inner' },
        h('a', { class: 'brand', href: 'index.html', 'aria-label': 'CyberForge home' },
          h('img', { src: 'assets/icons/logo.svg', alt: '', width: 32, height: 32 }),
          h('span', null, 'CYBER', h('em', null, 'FORGE'))),
        nav, xpChip, toggle));
      host.className = 'site-header';

      const updateXp = () => {
        const i = CF.store.info();
        xpChip.textContent = '';
        xpChip.append('LVL ', h('b', null, String(i.level)), ' · ', h('b', null, CF.fmt(CF.store.state().xp)), ' XP');
      };
      updateXp();
      document.addEventListener('cf:update', updateXp);

      // Close dropdowns on outside click / Escape; close mobile menu on link click.
      document.addEventListener('click', (e) => {
        CF.$$('.nav details[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          CF.$$('.nav details[open]').forEach((d) => d.removeAttribute('open'));
          if (nav.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '☰'; toggle.focus(); }
        }
      });
    }

    const foot = CF.$('#site-footer');
    if (foot) {
      foot.className = 'site-footer';
      const col = (title, items) => h('div', null, h('h4', null, title), items.map((i) => h('a', { href: i[0] }, i[1])));
      CF.clear(foot).appendChild(h('div', { class: 'container' },
        h('div', { class: 'footer-grid' },
          h('div', null,
            h('a', { class: 'brand', href: 'index.html' }, h('img', { src: 'assets/icons/logo.svg', alt: '', width: 28, height: 28 }), h('span', null, 'CYBER', h('em', null, 'FORGE'))),
            h('p', { css: { marginTop: '12px', maxWidth: '36ch' } }, 'Learn Kali Linux. Master Cybersecurity. Free, open and built for authorized, ethical learning.')),
          col('Learn', COURSES.slice(0, 5)),
          col('Practice', [['labs.html', 'Labs'], ['challenges.html', 'Challenges'], ['tools.html', 'Security Tools'], ['web-security.html', 'Web Security'], ['security-operations.html', 'Security Operations']]),
          col('Platform', [['progress.html', 'Progress'], ['profile.html', 'Profile'], ['about.html', 'About'], ['admin.html', 'Admin Dashboard']])),
        h('div', { class: 'footer-bottom' },
          h('span', null, '© CyberForge — educational use only. All labs are simulated; only test systems you own or are explicitly authorized to assess.'),
          h('span', { class: 'mono' }, 'v1.0 · static · no tracking'))));
    }
  }

  CF.nav = { render };
})();
