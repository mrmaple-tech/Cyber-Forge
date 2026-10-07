/*
 * Reusable quiz component.
 *   CF.quiz.mount(container, { id, title, questions, xp, skill, onDone })
 * question: { q, options:[4 strings], answer:index, explain }
 * Awards quiz XP once (score >= 60%) via CF.store; perfect scores show a badge-style note.
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function mount(container, cfg) {
    const qs = cfg.questions;
    const xp = cfg.xp != null ? cfg.xp : CF.XP.quiz;
    let i = 0, score = 0;
    const root = h('div', { class: 'quiz' });
    container.appendChild(root);

    function question() {
      CF.clear(root);
      const q = qs[i];
      let answered = false;
      const fb = h('div', { 'aria-live': 'polite' });
      const actions = h('div', { class: 'quiz-actions' });
      const opts = h('div', { class: 'opts', role: 'group', 'aria-label': 'Answer choices' });
      const btns = q.options.map((text, idx) => h('button', {
        class: 'opt', type: 'button',
        onclick: () => {
          if (answered) return;
          answered = true;
          const ok = idx === q.answer;
          if (ok) score++;
          btns.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('correct'); else if (k === idx) b.classList.add('wrong'); });
          fb.appendChild(h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') },
            h('strong', null, ok ? 'Correct. ' : 'Not quite. '), CF.rich(q.explain || '')));
          actions.appendChild(h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => { i++; i < qs.length ? question() : finish(); } },
            i + 1 < qs.length ? 'Next question' : 'See results'));
          actions.firstChild.focus();
        }
      }, h('span', { class: 'k' }, LETTERS[idx] + '.'), h('span', null, text)));
      btns.forEach((b) => opts.appendChild(b));
      root.append(
        h('div', { class: 'quiz-head' }, h('span', null, (cfg.title || 'Quiz').toUpperCase()), h('span', null, 'Question ' + (i + 1) + ' / ' + qs.length + (cfg.noXp ? ' · practice' : ' · +' + xp + ' XP'))),
        CF.bar(Math.round((i / qs.length) * 100)),
        h('p', { class: 'quiz-q', css: { marginTop: '16px' } }, CF.rich(q.q)), opts, fb, actions);
    }

    function finish() {
      CF.clear(root);
      const pct = Math.round((score / qs.length) * 100);
      const pass = pct >= 60;
      let awarded = 0;
      if (pass && !cfg.noXp) awarded = CF.store.complete('quiz', cfg.id, { xp, skill: cfg.skill, label: (cfg.title || 'Quiz') + ' complete' });
      root.append(
        h('div', { class: 'quiz-head' }, h('span', null, 'FINAL SCORE')),
        h('div', { class: 'score-ring' }, score + ' / ' + qs.length + ' (' + pct + '%)'),
        h('p', null, pass ? (score === qs.length ? 'Perfect score — excellent work.' : 'Passed. Review any explanations you missed.') : 'You need 60% to earn XP. Review the lesson material and try again.'),
        pass && !cfg.noXp ? h('p', null, awarded ? h('span', { class: 'reward' }, '+' + awarded + ' XP') : h('span', { class: 'pill green' }, 'XP already earned for this quiz')) : null,
        h('div', { class: 'quiz-actions' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: () => { i = 0; score = 0; question(); } }, 'Retake quiz')));
      if (cfg.onDone) cfg.onDone(score, qs.length, pass);
    }

    if (!cfg.noXp && CF.store.isDone('quiz', cfg.id)) {
      root.appendChild(h('div', { class: 'quiz-head' }, h('span', null, (cfg.title || 'Quiz').toUpperCase()), h('span', { class: 'pill green' }, 'Completed')));
      root.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: question }, 'Practice again (no extra XP)'));
    } else question();
    return root;
  }

  CF.quiz = { mount };

  /** Single inline knowledge-check question (no XP; used inside lessons). */
  CF.knowledgeCheck = function (q) {
    let answered = false;
    const fb = h('div', { 'aria-live': 'polite' });
    const btns = q.options.map((text, idx) => h('button', {
      class: 'opt', type: 'button',
      onclick: () => {
        if (answered) return;
        answered = true;
        const ok = idx === q.answer;
        btns.forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('correct'); else if (k === idx) b.classList.add('wrong'); });
        fb.appendChild(h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') }, h('strong', null, ok ? 'Correct. ' : 'Not quite. '), CF.rich(q.explain || '')));
      }
    }, h('span', { class: 'k' }, LETTERS[idx] + '.'), h('span', null, text)));
    return h('div', { class: 'quiz' }, h('p', { class: 'quiz-q' }, CF.rich(q.q)), h('div', { class: 'opts' }, btns), fb);
  };
})();
