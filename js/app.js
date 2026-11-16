/* =========================================================
   应用逻辑：页面渲染 / 双语切换 / 学习进度 / 自动判分
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- 本地存储 ---------- */
const LANG_KEY = "lcl.lang";
const DONE_KEY = "lcl.done";
const SCORE_KEY = "lcl.scores";

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 隐私模式下忽略 */
  }
}

const lessonKey = (course, lesson) => course.id + "/" + (lesson.id || lesson);

function isDone(course, lesson) {
  return !!readStore(DONE_KEY, {})[lessonKey(course, lesson)];
}

function toggleDone(course, lesson) {
  const map = readStore(DONE_KEY, {});
  const key = lessonKey(course, lesson);
  if (map[key]) delete map[key];
  else map[key] = Date.now();
  writeStore(DONE_KEY, map);
}

function getScore(course, lesson) {
  const v = readStore(SCORE_KEY, {})[lessonKey(course, lesson)];
  return typeof v === "number" ? v : null;
}

function saveScore(course, lesson, pct) {
  const map = readStore(SCORE_KEY, {});
  const key = lessonKey(course, lesson);
  if (typeof map[key] !== "number" || pct > map[key]) {
    map[key] = pct;
    writeStore(SCORE_KEY, map);
  }
}

function totalStats() {
  let lessons = 0;
  let questions = 0;
  COURSES.forEach((c) => {
    lessons += c.lessons.length;
    c.lessons.forEach((l) => (questions += l.quiz.length));
  });
  return { courses: COURSES.length, lessons, questions };
}

function overallProgress() {
  const total = totalStats().lessons;
  let done = 0;
  COURSES.forEach((c) => c.lessons.forEach((l) => isDone(c, l) && done++));
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ---------- 语言 ---------- */
function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "zh" || saved === "lo" ? saved : null;
  } catch (e) {
    return null;
  }
}

function initLang() {
  const saved = readLang();
  if (saved) LANG = saved;
  document.documentElement.lang = LANG === "lo" ? "lo" : "zh-CN";
}

function applyI18n() {
  $$("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.title = document.body.dataset.titleKey
    ? t(document.body.dataset.titleKey)
    : document.title;
}

function syncLangButtons() {
  $$(".lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === LANG));
}

function setLang(lang) {
  if (lang === LANG) return;
  LANG = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    /* 隐私模式下忽略 */
  }
  document.documentElement.lang = lang === "lo" ? "lo" : "zh-CN";
  syncLangButtons();
  applyI18n();
  renderPage();
}

/* ---------- 链接 ---------- */
const lessonUrl = (c, l) => `lesson.html?course=${encodeURIComponent(c.id)}&lesson=${encodeURIComponent(l.id)}`;
const quizUrl = (c, l) => `quiz.html?course=${encodeURIComponent(c.id)}&lesson=${encodeURIComponent(l.id)}`;
const coursesUrl = "courses.html";

function resolveParams() {
  const params = new URLSearchParams(location.search);
  const course = COURSES.find((c) => c.id === params.get("course")) || COURSES[0];
  const lesson = course.lessons.find((l) => l.id === params.get("lesson")) || course.lessons[0];
  return { course, lesson };
}

/* ---------- 课程卡片 ---------- */
function courseCard(c, opts = {}) {
  const done = c.lessons.filter((l) => isDone(c, l)).length;
  const pct = Math.round((done / c.lessons.length) * 100);
  const minutes = c.lessons.reduce((n, l) => n + l.minutes, 0);
  return `
  <a class="course-card" href="${lessonUrl(c, c.lessons[0])}">
    <div class="course-cover cover-${c.cover}" aria-hidden="true">
      <span class="cover-char">${c.char}</span>
      <span class="cover-level">${t("level." + c.level)}</span>
      <span class="cover-rings"></span>
    </div>
    <div class="course-body">
      <h3>${pick(c.title)}</h3>
      <p class="course-tagline">${pick(c.tagline)}</p>
      ${opts.full ? `<p class="course-desc">${pick(c.desc)}</p>` : ""}
      <div class="course-meta">
        <span>${c.lessons.length} ${t("unit.lesson")}</span>
        <span class="dot">·</span>
        <span>${minutes} ${t("unit.minute")}</span>
      </div>
      <div class="course-progress">
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span>${pct}%</span>
      </div>
    </div>
  </a>`;
}

/* =========================================================
   首页
   ========================================================= */
function renderHome() {
  const stats = totalStats();
  const set = (sel, val) => {
    const el = $(sel);
    if (el) el.textContent = val;
  };
  set("#statCourses", stats.courses);
  set("#statLessons", stats.lessons);
  set("#statQuestions", stats.questions);

  const grid = $("#courseGrid");
  if (grid) grid.innerHTML = COURSES.map((c) => courseCard(c)).join("");

  const prog = overallProgress();
  const bar = $("#heroBar");
  if (bar) bar.style.width = prog.pct + "%";
  set("#heroPct", prog.pct + "%");
  set("#heroProgressText", fmt(t("progress.summary"), { done: prog.done, total: prog.total }));

  /* “开始学习”指向第一节未完成的课 */
  const cta = $("#heroStart");
  if (cta) {
    let target = null;
    outer: for (const c of COURSES) {
      for (const l of c.lessons) {
        if (!isDone(c, l)) {
          target = { c, l };
          break outer;
        }
      }
    }
    if (!target) target = { c: COURSES[0], l: COURSES[0].lessons[0] };
    cta.href = lessonUrl(target.c, target.l);
  }
}

/* =========================================================
   课程列表
   ========================================================= */
let courseFilter = "all";

function renderCourses() {
  const grid = $("#courseGrid");
  if (!grid) return;
  const list = COURSES.filter((c) => courseFilter === "all" || c.level === courseFilter);
  grid.innerHTML = list.length
    ? list.map((c) => courseCard(c, { full: true })).join("")
    : `<p class="empty">${LANG === "lo" ? "ຍັງບໍ່ມີຫຼັກສູດ" : "暂无课程"}</p>`;

  $$("#courseFilters .chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.filter === courseFilter);
  });
}

/* =========================================================
   课程详情（课文 / 视频 / 练习）
   ========================================================= */
const lessonState = { course: null, lesson: null, tab: "text" };

function blockHTML(b) {
  if (b.type === "p") return `<p class="prose">${pick(b.text)}</p>`;
  if (b.type === "tip") {
    return `
      <div class="tip">
        <span class="tip-icon" aria-hidden="true">💡</span>
        <div>
          <b>${t("lesson.tip")}</b>
          <p>${pick(b.text)}</p>
        </div>
      </div>`;
  }
  if (b.type === "vocab") {
    const rows = b.items
      .map(
        (it) => `
        <tr>
          <td class="vocab-zh">${it.zh}</td>
          <td class="vocab-pinyin">${it.pinyin}</td>
          <td class="vocab-lo">${it.lo}</td>
        </tr>`
      )
      .join("");
    return `
      <div class="vocab">
        <h4>${pick(b.title)}</h4>
        <table>
          <thead>
            <tr>
              <th>汉字</th><th>拼音</th><th>ລາວ / 意思</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  return "";
}

function textTabHTML(course, lesson) {
  const objectives = lesson.objectives.map((o) => `<li>${pick(o)}</li>`).join("");
  const blocks = lesson.blocks.map(blockHTML).join("");
  const done = isDone(course, lesson);
  return `
    <div class="objectives">
      <h3>${t("lesson.objectives")}</h3>
      <ul>${objectives}</ul>
    </div>
    ${blocks}
    <div class="lesson-foot">
      <button class="btn ${done ? "btn-done" : "btn-outline"}" id="markDone" type="button">
        ${done ? "✓ " + t("lesson.done") : t("lesson.markDone")}
      </button>
    </div>`;
}

function videoTabHTML(lesson) {
  return `
    <div class="video-box">
      <div class="video-poster" id="videoPoster">
        <button class="play" id="playBtn" type="button" aria-label="${t("tab.video")}">▶</button>
        <p class="video-title">${pick(lesson.title)}</p>
        <span class="video-badge">${t("lesson.videoPlaceholder")}</span>
      </div>
    </div>
    <p class="muted small">${t("lesson.videoNote")}</p>
    <div class="video-hint" id="videoHint" hidden>
      ${LANG === "lo"
        ? "ນີ້ແມ່ນບ່ອນວາງວິດີໂອຈິງ: ສາມາດໃສ່ &lt;video&gt; ຫຼື iframe ຂອງ YouTube/Bilibili."
        : "这里就是接真实视频的位置：换成 &lt;video&gt; 标签或 YouTube / Bilibili 的 iframe 即可。"}
    </div>`;
}

function quizTabHTML(course, lesson) {
  const best = getScore(course, lesson);
  return `
    <div class="quiz-cta">
      <div>
        <h3>${t("quiz.intro")}</h3>
        <p class="muted">${fmt(t("quiz.questions"), { n: lesson.quiz.length })}</p>
        <p class="muted small">${t("quiz.best")}：<b>${best === null ? t("quiz.noScore") : best + " " + t("unit.point")}</b></p>
      </div>
      <a class="btn btn-primary" href="${quizUrl(course, lesson)}">${t("quiz.start")} →</a>
    </div>
    <p class="muted small">${LANG === "lo"
      ? "ຄຳຖາມທັງໝົດຈະຖືກກວດຄະແນນອັດຕະໂນມັດ ແລະ ສະແດງຄຳອະທິບາຍ."
      : "全部题目提交后自动判分，并逐题给出解析。"}</p>`;
}

function renderLessonUI() {
  const { course, lesson } = lessonState;
  if (!course || !lesson) return;

  document.title = pick(lesson.title) + " · " + pick(course.title);

  const crumb = $("#crumbCourse");
  if (crumb) {
    crumb.textContent = pick(course.title);
    crumb.href = coursesUrl;
  }
  const h1 = $("#lessonTitle");
  if (h1) h1.textContent = pick(lesson.title);
  const meta = $("#lessonMeta");
  if (meta) {
    meta.innerHTML = `
      <span class="chip chip-red">${t("level." + course.level)}</span>
      <span class="meta-item">⏱ ${lesson.minutes} ${t("unit.minute")}</span>
      <span class="meta-item">✎ ${lesson.quiz.length} ${t("unit.question")}</span>`;
  }

  const doneCount = course.lessons.filter((l) => isDone(course, l)).length;
  const pct = Math.round((doneCount / course.lessons.length) * 100);
  const sideHead = $("#sideProgress");
  if (sideHead) {
    sideHead.innerHTML = `
      <span>${fmt(t("progress.summary"), { done: doneCount, total: course.lessons.length })}</span>
      <span class="side-pct">${pct}%</span>
      <div class="bar"><i style="width:${pct}%"></i></div>`;
  }

  const list = $("#lessonList");
  if (list) {
    list.innerHTML = course.lessons
      .map((l, i) => {
        const active = l.id === lesson.id;
        const done = isDone(course, l);
        return `
          <li>
            <a class="side-item ${active ? "is-active" : ""} ${done ? "is-done" : ""}" href="${lessonUrl(course, l)}">
              <span class="side-idx">${done ? "✓" : i + 1}</span>
              <span class="side-title">${pick(l.title)}</span>
              <span class="side-min">${l.minutes}′</span>
            </a>
          </li>`;
      })
      .join("");
  }

  const textPanel = $("#tabText");
  if (textPanel) textPanel.innerHTML = textTabHTML(course, lesson);
  const videoPanel = $("#tabVideo");
  if (videoPanel) videoPanel.innerHTML = videoTabHTML(lesson);
  const quizPanel = $("#tabQuiz");
  if (quizPanel) quizPanel.innerHTML = quizTabHTML(course, lesson);

  const pager = $("#lessonPager");
  if (pager) {
    const idx = course.lessons.findIndex((l) => l.id === lesson.id);
    const prev = course.lessons[idx - 1];
    const next = course.lessons[idx + 1];
    pager.innerHTML = `
      ${prev
        ? `<a class="pager-link prev" href="${lessonUrl(course, prev)}"><small>${t("lesson.prev")}</small><b>${pick(prev.title)}</b></a>`
        : `<span class="pager-link is-off"><small>${t("lesson.prev")}</small><b>—</b></span>`}
      ${next
        ? `<a class="pager-link next" href="${lessonUrl(course, next)}"><small>${t("lesson.next")}</small><b>${pick(next.title)}</b></a>`
        : `<a class="pager-link next" href="${coursesUrl}"><small>${t("lesson.next")}</small><b>${t("courses.title")}</b></a>`}`;
  }

  $$(".tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === lessonState.tab));
  showTab(lessonState.tab);

  attachLessonHandlers();
}

function showTab(name) {
  lessonState.tab = name;
  $$(".tab-panel").forEach((p) => (p.hidden = p.id !== "tab" + name[0].toUpperCase() + name.slice(1)));
  $$(".tab-btn").forEach((b) => {
    const active = b.dataset.tab === name;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function attachLessonHandlers() {
  const btn = $("#markDone");
  if (btn) {
    btn.addEventListener("click", () => {
      toggleDone(lessonState.course, lessonState.lesson);
      renderLessonUI();
    });
  }
  const play = $("#playBtn");
  if (play) {
    play.addEventListener("click", () => {
      const hint = $("#videoHint");
      if (hint) hint.hidden = false;
      $("#videoPoster")?.classList.add("is-pressed");
    });
  }
}

function setupLesson() {
  const { course, lesson } = resolveParams();
  lessonState.course = course;
  lessonState.lesson = lesson;
  renderLessonUI();
}

/* =========================================================
   练习（自动判分）
   ========================================================= */
const quizState = {
  course: null,
  lesson: null,
  idx: 0,
  selected: null,
  locked: false,
  answers: [],
  correct: 0,
  finished: false
};

function setupQuiz() {
  const { course, lesson } = resolveParams();
  quizState.course = course;
  quizState.lesson = lesson;
  quizState.idx = 0;
  quizState.selected = null;
  quizState.locked = false;
  quizState.answers = [];
  quizState.correct = 0;
  quizState.finished = false;
  document.title = t("quiz.intro") + " · " + pick(lesson.title);
  renderQuizPage();
}

function renderQuizPage() {
  if (!quizState.course) return;
  renderQuizHeader();
  if (quizState.finished) renderResult();
  else renderQuestion();
}

function renderQuizHeader() {
  const { course, lesson } = quizState;
  document.title = t("quiz.intro") + " · " + pick(lesson.title);
  const back = $("#quizBack");
  if (back) {
    back.href = lessonUrl(course, lesson);
    back.textContent = "← " + t("lesson.back");
  }
  const title = $("#quizLesson");
  if (title) title.textContent = pick(course.title) + " · " + pick(lesson.title);
}

function renderQuestion() {
  const app = $("#quizApp");
  if (!app) return;
  const { lesson, idx, selected, locked } = quizState;
  const q = lesson.quiz[idx];
  const total = lesson.quiz.length;
  const last = idx === total - 1;
  const doneAnswer = quizState.answers[idx];

  const options = q.options
    .map((opt, i) => {
      let cls = "option";
      if (locked) {
        if (i === q.answer) cls += " is-correct";
        else if (i === selected) cls += " is-wrong";
      } else if (i === selected) {
        cls += " is-selected";
      }
      const mark = locked && i === q.answer ? "✓" : locked && i === selected ? "✗" : "";
      return `
        <button class="${cls}" type="button" data-i="${i}" ${locked ? "disabled" : ""}>
          <span class="option-key">${String.fromCharCode(65 + i)}</span>
          <span class="option-text">${pick(opt)}</span>
          <span class="option-mark">${mark}</span>
        </button>`;
    })
    .join("");

  const feedback = locked
    ? `<div class="feedback ${doneAnswer && doneAnswer.ok ? "is-ok" : "is-no"}" role="status">
         <b>${doneAnswer && doneAnswer.ok ? "✓ " + t("quiz.correct") : "✗ " + t("quiz.wrong")}</b>
         <p>${pick(q.explain)}</p>
       </div>`
    : "";

  let actionLabel = t("quiz.submit");
  if (locked) actionLabel = last ? t("quiz.finish") : t("quiz.next");

  app.innerHTML = `
    <div class="quiz-meter">
      <div class="bar"><i style="width:${Math.round((idx / total) * 100)}%"></i></div>
      <span>${fmt(t("quiz.qIndex"), { i: idx + 1, n: total })}</span>
    </div>
    <div class="quiz-card">
      <h2 class="q-text">${pick(q.q)}</h2>
      <div class="options">${options}</div>
      ${feedback}
      <div class="quiz-actions">
        <button class="btn btn-primary" id="quizAction" type="button" ${!locked && selected === null ? "disabled" : ""}>${actionLabel}</button>
        ${!locked ? `<span class="hint small">${LANG === "lo" ? "ເລືອກຄຳຕອບແລ້ວກົດສົ່ງ" : "选择答案后提交"}</span>` : ""}
      </div>
    </div>`;

  const action = $("#quizAction");
  if (!locked) {
    $$(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        quizState.selected = Number(btn.dataset.i);
        $$(".option").forEach((b) => b.classList.toggle("is-selected", b === btn));
        const act = $("#quizAction");
        if (act) act.disabled = false;
      });
    });
    if (action) {
      action.addEventListener("click", () => {
        if (quizState.selected === null) return;
        submitAnswer();
      });
    }
  } else if (action) {
    action.addEventListener("click", () => {
      if (last) finishQuiz();
      else {
        quizState.idx += 1;
        quizState.selected = null;
        quizState.locked = false;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }
}

function submitAnswer() {
  const { lesson, idx, selected } = quizState;
  const q = lesson.quiz[idx];
  const ok = selected === q.answer;
  quizState.locked = true;
  quizState.answers[idx] = { selected, ok };
  if (ok) quizState.correct += 1;
  renderQuestion();
}

function finishQuiz() {
  const { lesson } = quizState;
  const pct = Math.round((quizState.correct / lesson.quiz.length) * 100);
  quizState.finished = true;
  saveScore(quizState.course, lesson, pct);
  if (!isDone(quizState.course, lesson)) toggleDone(quizState.course, lesson);
  renderResult();
}

function renderResult() {
  const app = $("#quizApp");
  if (!app) return;
  const { course, lesson } = quizState;
  const total = lesson.quiz.length;
  const pct = Math.round((quizState.correct / total) * 100);
  const level = pct >= 80 ? "is-good" : pct >= 60 ? "is-mid" : "is-low";
  const msg = pct >= 80 ? t("quiz.good") : pct >= 60 ? t("quiz.mid") : t("quiz.low");

  const review = lesson.quiz
    .map((q, i) => {
      const a = quizState.answers[i];
      const ok = a && a.ok;
      return `
        <div class="review-item ${ok ? "is-ok" : "is-no"}">
          <div class="review-head">
            <span class="review-idx">${ok ? "✓" : "✗"}</span>
            <p>${i + 1}. ${pick(q.q)}</p>
          </div>
          <p class="review-line"><b>${t("quiz.your")}</b>：${a ? pick(q.options[a.selected]) : "—"}</p>
          ${!ok ? `<p class="review-line"><b>${t("quiz.right")}</b>：${pick(q.options[q.answer])}</p>` : ""}
          <p class="review-exp">${pick(q.explain)}</p>
        </div>`;
    })
    .join("");

  app.innerHTML = `
    <div class="result-card">
      <div class="score-ring ${level}" style="--p:${pct}">
        <b>${pct}<small>%</small></b>
      </div>
      <div class="result-info">
        <h2>${t("quiz.resultTitle")}</h2>
        <p class="muted">${msg}</p>
        <p class="result-count">${quizState.correct} / ${total} ${LANG === "lo" ? "ຂໍ້" : "题"}</p>
        <div class="result-actions">
          <button class="btn btn-primary" id="retryQuiz" type="button">${t("quiz.retry")}</button>
          <a class="btn btn-outline" href="${lessonUrl(course, lesson)}">${t("quiz.backLesson")}</a>
        </div>
      </div>
    </div>
    <div class="review">
      <h3>${t("quiz.review")}</h3>
      ${review}
    </div>`;

  const retry = $("#retryQuiz");
  if (retry) {
    retry.addEventListener("click", () => {
      quizState.idx = 0;
      quizState.selected = null;
      quizState.locked = false;
      quizState.answers = [];
      quizState.correct = 0;
      quizState.finished = false;
      renderQuestion();
    });
  }
}

/* =========================================================
   入口
   ========================================================= */
function renderPage() {
  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  else if (page === "courses") renderCourses();
  else if (page === "lesson") renderLessonUI();
  else if (page === "quiz") renderQuizPage();
}

function init() {
  initLang();
  syncLangButtons();
  applyI18n();

  $$(".lang-btn").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });

  $$("#courseFilters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      courseFilter = chip.dataset.filter;
      renderCourses();
    });
  });

  $$(".tab-btn").forEach((b) => {
    b.addEventListener("click", () => {
      if (!lessonState.course) return;
      showTab(b.dataset.tab);
    });
  });

  const page = document.body.dataset.page;
  if (page === "home") {
    renderHome();
  } else if (page === "courses") {
    renderCourses();
  } else if (page === "lesson") {
    setupLesson();
  } else if (page === "quiz") {
    setupQuiz();
  }
}

document.addEventListener("DOMContentLoaded", init);
