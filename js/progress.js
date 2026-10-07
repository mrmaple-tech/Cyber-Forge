/*
 * CyberForge progress, XP, levels, streaks and badges (localStorage via CF.db).
 * NOTE: client-side progress is for learning motivation only; it is not a trust boundary.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const KINDS = ['lesson', 'quiz', 'lab', 'challenge', 'mission', 'daily'];

  function fresh() {
    const done = {}; KINDS.forEach((k) => { done[k] = {}; });
    return { v: 1, name: 'Student', created: Date.now(), xp: 0, done, badges: {}, streak: { count: 0, last: '' } };
  }

  // Validate and normalise anything read from storage / import (never trust its shape).
  function normalise(raw) {
    const s = fresh();
    if (!raw || typeof raw !== 'object') return s;
    s.name = CF.clean(raw.name || 'Student', 24) || 'Student';
    s.created = Number.isFinite(raw.created) ? raw.created : s.created;
    s.xp = Number.isFinite(raw.xp) ? Math.max(0, Math.min(1e7, Math.floor(raw.xp))) : 0;
    KINDS.forEach((k) => {
      const src = raw.done && raw.done[k];
      if (!src || typeof src !== 'object') return;
      Object.keys(src).slice(0, 2000).forEach((id) => {
        if (!/^[\w.:-]{1,60}$/.test(id)) return;
        const e = src[id] || {};
        s.done[k][id] = { t: Number.isFinite(e.t) ? e.t : Date.now(), skill: typeof e.skill === 'string' ? CF.clean(e.skill, 20) : '', xp: Number.isFinite(e.xp) ? Math.max(0, Math.min(5000, e.xp)) : 0 };
      });
    });
    if (raw.badges && typeof raw.badges === 'object') {
      Object.keys(raw.badges).forEach((id) => { if (CF.BADGES.some((b) => b.id === id)) s.badges[id] = Number(raw.badges[id]) || Date.now(); });
    }
    if (raw.streak && typeof raw.streak === 'object') {
      s.streak.count = Number.isFinite(raw.streak.count) ? Math.max(0, Math.min(10000, raw.streak.count)) : 0;
      s.streak.last = /^\d{4}-\d{2}-\d{2}$/.test(raw.streak.last) ? raw.streak.last : '';
    }
    return s;
  }

  let state = normalise(CF.db.loadState());
  const save = () => CF.db.saveState(state);

  // Level curve: threshold(L) = 20 * (L-1)^2  → level 12 begins at 2,420 XP.
  function levelInfo(xp) {
    const level = Math.floor(Math.sqrt(xp / 20)) + 1;
    const cur = 20 * (level - 1) ** 2, next = 20 * level ** 2;
    return { level, cur, next, into: xp - cur, need: next - cur, pct: Math.round(((xp - cur) / (next - cur)) * 100), rank: CF.rank(level) };
  }

  function dayDiff(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

  function touchStreak() {
    const t = CF.today(), s = state.streak;
    if (s.last === t) return;
    s.count = s.last && dayDiff(s.last, t) === 1 ? s.count + 1 : 1;
    s.last = t;
  }

  function currentStreak() {
    const s = state.streak, t = CF.today();
    if (!s.last) return 0;
    return dayDiff(s.last, t) > 1 ? 0 : s.count;
  }

  function count(rule) {
    const kinds = Array.isArray(rule.kind) ? rule.kind : [rule.kind];
    let n = 0;
    kinds.forEach((k) => Object.values(state.done[k] || {}).forEach((e) => { if (!rule.skill || e.skill === rule.skill) n++; }));
    return n;
  }

  function checkBadges() {
    const earned = [];
    CF.BADGES.forEach((b) => {
      if (state.badges[b.id]) return;
      const r = b.rule;
      const ok = r.t === 'level' ? levelInfo(state.xp).level >= r.n : count(r) >= r.n;
      if (ok) { state.badges[b.id] = Date.now(); earned.push(b); }
    });
    return earned;
  }

  CF.store = {
    state: () => state,
    levelInfo,
    info: () => levelInfo(state.xp),
    streak: currentStreak,
    isDone: (kind, id) => !!(state.done[kind] && state.done[kind][id]),
    countDone: (kind, skill) => count({ kind, skill }),

    /** Mark an item complete exactly once and award XP. Returns XP awarded (0 if already done). */
    complete(kind, id, opts) {
      opts = opts || {};
      if (!KINDS.includes(kind) || !/^[\w.:-]{1,60}$/.test(id)) return 0;
      if (state.done[kind][id]) return 0;
      const xp = Math.max(0, Math.min(2000, Math.floor(opts.xp != null ? opts.xp : CF.XP[kind] || 0)));
      const before = levelInfo(state.xp).level;
      state.done[kind][id] = { t: Date.now(), skill: opts.skill || '', xp };
      state.xp += xp;
      touchStreak();
      const earned = checkBadges();
      save();
      CF.toast([CF.h('b', null, '+' + xp + ' XP'), ' — ' + (opts.label || 'Completed')]);
      const after = levelInfo(state.xp).level;
      if (after > before) CF.toast([CF.h('b', null, 'LEVEL UP'), ' — You reached level ' + after + ' (' + CF.rank(after) + ')'], 'info');
      earned.forEach((b) => CF.toast([CF.h('b', null, 'BADGE'), ' — ' + b.name + ' unlocked'], 'info'));
      document.dispatchEvent(new CustomEvent('cf:update', { detail: { kind, id, xp } }));
      return xp;
    },

    /** Award a one-off bonus (e.g. perfect score) tied to a unique key. */
    bonus(key, xp, label) {
      if (state.done.daily['bonus:' + key]) return 0;
      return CF.store.complete('daily', 'bonus:' + key, { xp, label: label || 'Bonus' });
    },

    setName(n) { state.name = CF.clean(n, 24) || 'Student'; save(); document.dispatchEvent(new CustomEvent('cf:update')); },

    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(text) {
      if (typeof text !== 'string' || text.length > 500000) throw new Error('File too large or invalid.');
      let raw; try { raw = JSON.parse(text); } catch (e) { throw new Error('Not valid JSON.'); }
      if (!raw || typeof raw !== 'object' || raw.v !== 1) throw new Error('Not a CyberForge progress file.');
      state = normalise(raw); checkBadges(); save();
      document.dispatchEvent(new CustomEvent('cf:update'));
    },
    reset() { state = fresh(); CF.db.clearState(); CF.db.customClear(); document.dispatchEvent(new CustomEvent('cf:update')); }
  };

  /* ---- Catalog: every trackable item, used for per-skill and per-course progress ---- */
  CF.catalog = {
    items() {
      const out = [];
      CF.COURSES.forEach((c) => {
        c.lessons.forEach((l) => out.push({ kind: 'lesson', id: l.id, skill: c.skill }));
        out.push({ kind: 'quiz', id: 'quiz-' + c.id, skill: c.skill });
      });
      (CF.LABS || []).forEach((l) => out.push({ kind: 'lab', id: l.id, skill: l.skill }));
      (CF.CHALLENGES || []).forEach((c) => out.push({ kind: 'challenge', id: c.id, skill: c.skill }));
      return out;
    },
    skillProgress() {
      const items = CF.catalog.items();
      return CF.SKILLS.map((s) => {
        const mine = items.filter((i) => i.skill === s.id);
        const done = mine.filter((i) => CF.store.isDone(i.kind, i.id)).length;
        return { id: s.id, label: s.label, done, total: mine.length, pct: CF.pct(done, mine.length) };
      });
    },
    courseProgress(courseId) {
      const c = CF.course(courseId);
      if (!c) return { done: 0, total: 0, pct: 0, complete: false };
      const ids = c.lessons.map((l) => ['lesson', l.id]).concat([['quiz', 'quiz-' + c.id]]);
      const done = ids.filter(([k, i]) => CF.store.isDone(k, i)).length;
      return { done, total: ids.length, pct: CF.pct(done, ids.length), complete: done === ids.length };
    },
    coursesCompleted: () => CF.COURSES.filter((c) => CF.catalog.courseProgress(c.id).complete).length
  };
})();
