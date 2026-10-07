/*
 * Lesson + course rendering.
 * lesson: { id, title, learn:[...], body:[...paragraphs], example:{code, note}, mistakes:[...], check:{q,options,answer,explain} }
 * Every lesson renders: WHAT YOU WILL LEARN / LESSON / EXAMPLE / COMMON MISTAKES / KNOWLEDGE CHECK / COMPLETE LESSON
 */
(function () {
  'use strict';
  const CF = (window.CF = window.CF || {});
  const h = CF.h;

  /** Compact lesson constructor used by the content files. */
  CF.L = function (id, title, learn, body, example, mistakes, check) {
    return { id, title, learn, body, example, mistakes, check };
  };
  /** Compact question constructor: Q(question, [4 options], answerIndex, explanation) */
  CF.Q = function (q, options, answer, explain) { return { q, options, answer, explain }; };

  function section(title, node, cls) { return h('div', { class: 'lsec ' + (cls || '') }, h('h4', null, title), node); }

  function lessonNode(course, lesson, idx) {
    const done = () => CF.store.isDone('lesson', lesson.id);
    const det = h('details', { class: 'lesson' + (done() ? ' done' : ''), id: lesson.id });
    const state = h('span', { class: 'state' }, done() ? 'COMPLETED' : '+' + CF.XP.lesson + ' XP');
    det.appendChild(h('summary', null,
      h('span', { class: 'num' }, String(idx + 1).padStart(2, '0')), h('span', { class: 'ttl' }, lesson.title), state));

    let built = false;
    det.addEventListener('toggle', () => { if (det.open && !built) { built = true; det.appendChild(body()); } });

    function body() {
      const completeBtn = h('button', { class: 'btn btn-primary', type: 'button' }, done() ? 'Lesson completed ✓' : 'Complete lesson');
      const status = h('span', { class: 'muted' }, done() ? 'XP already earned.' : 'Answer the knowledge check, then mark the lesson complete (+' + CF.XP.lesson + ' XP).');
      completeBtn.disabled = done();
      completeBtn.addEventListener('click', () => {
        if (CF.store.complete('lesson', lesson.id, { skill: course.skill, label: lesson.title })) {
          completeBtn.textContent = 'Lesson completed ✓'; completeBtn.disabled = true;
          det.classList.add('done'); state.textContent = 'COMPLETED'; status.textContent = 'XP awarded.';
          document.dispatchEvent(new CustomEvent('cf:lesson', { detail: { course: course.id } }));
        }
      });
      return h('div', { class: 'lesson-body' },
        section('What you will learn', h('ul', null, lesson.learn.map((x) => h('li', null, CF.rich(x))))),
        section('Lesson', h('div', null, lesson.body.map(CF.p))),
        lesson.example ? section('Example', h('div', null, h('pre', null, h('code', null, lesson.example.code)), lesson.example.note ? CF.p(lesson.example.note) : null)) : null,
        lesson.mistakes ? section('Common mistakes', h('ul', null, lesson.mistakes.map((x) => h('li', null, CF.rich(x)))), 'warn') : null,
        lesson.check ? section('Knowledge check', CF.knowledgeCheck(lesson.check)) : null,
        section('Complete lesson', h('div', { class: 'complete-row' }, completeBtn, status)));
    }
    return det;
  }

  /** Render a whole course: header stats, lessons, and the end-of-course quiz. */
  CF.renderCourse = function (courseId, opts) {
    opts = opts || {};
    const course = CF.course(courseId);
    const wrap = h('section', { class: 'course', id: opts.anchor || courseId });
    const prog = h('div');
    const refresh = () => {
      const p = CF.catalog.courseProgress(courseId);
      CF.clear(prog).append(
        h('div', { class: 'meta-row' },
          CF.diffPill(course.difficulty),
          h('span', { class: 'pill cyan' }, course.lessons.length + ' lessons'),
          h('span', { class: 'pill green' }, CF.lessonXP(course) + ' XP available'),
          h('span', { class: 'pill' }, p.done + '/' + p.total + ' complete')),
        CF.bar(p.pct));
    };
    wrap.append(
      opts.hideTitle ? null : h('h2', null, course.title),
      course.intro ? h('p', { class: 'lead' }, course.intro) : null, prog,
      h('div', { css: { marginTop: '22px' } }, course.lessons.map((l, i) => lessonNode(course, l, i))));
    const quizBox = h('div', { css: { marginTop: '28px' } }, h('h3', null, course.title + ' — Final Quiz'));
    wrap.appendChild(quizBox);
    CF.quiz.mount(quizBox, { id: 'quiz-' + course.id, title: course.title + ' Quiz', questions: course.quiz, skill: course.skill, onDone: refresh });
    refresh();
    document.addEventListener('cf:lesson', refresh);
    return wrap;
  };
})();
