/*
 * CyberForge — core helpers.
 * SECURITY: The UI is built exclusively with DOM APIs (createElement / textContent).
 * innerHTML, outerHTML, document.write and eval are intentionally never used, so
 * user-supplied text can never become markup or script.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});

  // Native append/prepend would render null/false as the text "null"/"false" and stringify arrays.
  // Make them skip empty values and flatten arrays so conditional children are safe everywhere.
  ['append', 'prepend'].forEach((name) => {
    const orig = Element.prototype[name];
    Element.prototype[name] = function (...kids) { return orig.apply(this, kids.flat(Infinity).filter((k) => k != null && k !== false)); };
  });

  const BLOCKED_ATTR = /^(on|srcdoc$|formaction$|innerhtml$|outerhtml$)/i;
  const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

  CF.safeUrl = function (v) {
    v = String(v).trim();
    if (/^(https?:|mailto:)/i.test(v)) return true;
    return !HAS_SCHEME.test(v); // relative URLs only otherwise (blocks javascript:, data:, vbscript:)
  };

  function append(el, kids) {
    for (const k of kids) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) append(el, k);
      else if (k instanceof Node) el.appendChild(k);
      else el.appendChild(document.createTextNode(String(k)));
    }
  }

  CF.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    const isAttrs = attrs && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs);
    if (isAttrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = String(v);
        else if (k === 'css') Object.assign(el.style, v); // CSSOM is allowed under CSP
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (BLOCKED_ATTR.test(k)) continue;
        else if ((k === 'href' || k === 'src' || k === 'action') && !CF.safeUrl(v)) continue;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
      append(el, kids);
    } else {
      append(el, attrs == null ? kids : [attrs, ...kids]);
    }
    return el;
  };

  CF.$ = (s, r) => (r || document).querySelector(s);
  CF.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  CF.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  CF.fmt = (n) => Number(n || 0).toLocaleString('en-US');
  CF.pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // Strip control characters, collapse whitespace, cap length. Output is still always rendered as text.
  CF.clean = function (s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[<>]/g, '').trim().slice(0, max || 200);
  };

  CF.today = function () {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  // Minimal safe inline markup: `code`, **bold** and *italic*. Everything else is plain text.
  CF.rich = function (text) {
    const frag = document.createDocumentFragment();
    String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).forEach((part) => {
      if (!part) return;
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) frag.appendChild(CF.h('code', null, part.slice(1, -1)));
      else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) frag.appendChild(CF.h('strong', null, part.slice(2, -2)));
      else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) frag.appendChild(CF.h('em', null, part.slice(1, -1)));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  };
  CF.p = (text) => CF.h('p', null, CF.rich(text));

  CF.toast = function (html, type) {
    let wrap = CF.$('.toast-wrap');
    if (!wrap) { wrap = CF.h('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(wrap); }
    const t = CF.h('div', { class: 'toast ' + (type || '') });
    if (Array.isArray(html)) append(t, html); else t.textContent = html;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };

  CF.download = function (filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = CF.h('a', { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  CF.pageId = function () { return document.body.dataset.page || 'home'; };

  CF.mount = function () { return CF.$('#app'); };

  CF.pageHead = function (crumb, title, lead, eyebrow) {
    return CF.h('header', { class: 'page-head' },
      CF.h('div', { class: 'container' },
        CF.h('div', { class: 'crumbs' }, 'cyberforge / ', crumb),
        eyebrow ? CF.h('span', { class: 'eyebrow' }, eyebrow) : null,
        CF.h('h1', null, title),
        lead ? CF.h('p', { class: 'lead' }, lead) : null));
  };

  CF.bar = function (pct) {
    const i = CF.h('i');
    requestAnimationFrame(() => { i.style.width = Math.max(0, Math.min(100, pct)) + '%'; });
    return CF.h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, i);
  };

  CF.asciiBar = function (pct) {
    const n = Math.round(pct / 10);
    return '█'.repeat(n) + '░'.repeat(10 - n) + ' ' + pct + '%';
  };

  CF.diffPill = function (d) {
    const c = { Beginner: 'green', Intermediate: 'amber', Advanced: 'red' }[d] || '';
    return CF.h('span', { class: 'pill ' + c }, d);
  };

  // Tabs helper: tabs = [{id,label,render:()=>Node}]
  CF.tabs = function (tabs, initial) {
    const root = CF.h('div');
    const bar = CF.h('div', { class: 'tabs', role: 'tablist' });
    const panel = CF.h('div', { role: 'tabpanel' });
    const cache = {};
    const btns = tabs.map((t) => CF.h('button', {
      class: 'tab', role: 'tab', type: 'button', 'aria-selected': 'false',
      onclick: () => select(t.id)
    }, t.label));
    btns.forEach((b) => bar.appendChild(b));
    function select(id) {
      tabs.forEach((t, i) => btns[i].setAttribute('aria-selected', String(t.id === id)));
      CF.clear(panel);
      panel.appendChild(cache[id] || (cache[id] = tabs.find((t) => t.id === id).render()));
      if (history.replaceState && id !== tabs[0].id) history.replaceState(null, '', '#' + id);
    }
    root.append(bar, panel);
    select(initial || tabs[0].id);
    return root;
  };

  CF.init = function () {
    if (CF.nav) CF.nav.render();
    const id = CF.pageId();
    const mount = CF.mount();
    if (mount && CF.pages && CF.pages[id]) {
      try { CF.clear(mount).appendChild(CF.pages[id]()); }
      catch (e) { console.error(e); mount.textContent = 'Something went wrong loading this page. Please refresh.'; }
    }
    if (CF.mentor) CF.mentor.mountWidget();
    if (location.hash) {
      const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) { if (t.tagName === 'DETAILS') t.open = true; t.scrollIntoView(); }
    }
  };
  document.addEventListener('DOMContentLoaded', CF.init);
})();
