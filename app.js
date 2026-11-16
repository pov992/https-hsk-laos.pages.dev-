(function () {
  "use strict";

  const LS_KEY = "hanlao.learned.v1";
  const state = {
    mode: "life",
    level: "all",
    cat: "all",
    q: "",
    showPy: true,
    showLo: true,
    onlyNew: false,
    learned: new Set()
  };

  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (Array.isArray(saved)) state.learned = new Set(saved);
  } catch (e) { /* ignore */ }

  const $ = (sel) => document.querySelector(sel);
  const grid = $("#grid");
  const catsEl = $("#cats");
  const emptyEl = $("#empty");
  const searchEl = $("#search");

  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify([...state.learned])); } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  const catName = (id) => (window.CATEGORIES.find((c) => c.id === id) || {}).zh || "";
  const levelName = (id) => (window.HSK_LEVELS.find((l) => l.id === id) || {}).zh || "";
  const currentData = () => (state.mode === "life" ? window.LESSONS : window.HSK_WORDS);

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const clean = text.replace(/……/g, "").replace(/[？?。，,！!]/g, "");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "zh-CN";
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find((v) => /zh[-_]CN/i.test(v.lang)) || voices.find((v) => /^zh/i.test(v.lang));
    if (zh) u.voice = zh;
    window.speechSynthesis.speak(u);
  }

  /* ---------- 声调 ---------- */
  function renderTones() {
    $("#toneGrid").innerHTML = window.TONES.map((t) => `
      <div class="tone">
        <b>${escapeHtml(t.mark)}</b>
        <span>${escapeHtml(t.tone)} · ${escapeHtml(t.desc)}</span>
        <span class="lo">${escapeHtml(t.lo)}</span>
      </div>`).join("");
  }

  /* ---------- 分类 ---------- */
  function renderCats() {
    catsEl.innerHTML = window.CATEGORIES.map((c) => {
      const n = c.id === "all" ? window.LESSONS.length : window.LESSONS.filter((l) => l.cat === c.id).length;
      return `<button class="cat ${state.cat === c.id ? "active" : ""}" type="button" data-cat="${c.id}">
        ${escapeHtml(c.zh)} <span style="opacity:.6">${n}</span>
      </button>`;
    }).join("");
  }

  /* ---------- HSK 等级 ---------- */
  function renderLevels() {
    const total = window.HSK_WORDS.length;
    const items = [{ id: "all", zh: "全部", n: total }].concat(
      window.HSK_LEVELS.map((l) => ({ id: l.id, zh: l.zh, n: window.HSK_WORDS.filter((w) => w.lv === l.id).length }))
    );
    $("#levels").innerHTML = items.map((it) =>
      `<button class="cat ${state.level === it.id ? "active" : ""}" type="button" data-level="${it.id}">
        ${escapeHtml(it.zh)} <span style="opacity:.6">${it.n}</span>
      </button>`
    ).join("");
  }

  /* ---------- 卡片 ---------- */
  function visibleLessons() {
    const q = state.q.trim().toLowerCase();
    return currentData().filter((l) => {
      if (state.mode === "life") {
        if (state.cat !== "all" && l.cat !== state.cat) return false;
      } else if (state.level !== "all" && l.lv !== state.level) {
        return false;
      }
      if (state.onlyNew && state.learned.has(l.id)) return false;
      if (!q) return true;
      const tag = state.mode === "life" ? catName(l.cat) : levelName(l.lv);
      return (l.zh + " " + l.py + " " + l.lo + " " + tag).toLowerCase().includes(q);
    });
  }

  function cardHtml(l) {
    const learned = state.learned.has(l.id);
    return `<article class="card ${learned ? "learned" : ""} ${state.showPy ? "" : "hide-py"} ${state.showLo ? "" : "hide-lo"}"
        data-id="${l.id}" tabindex="0" role="button" aria-label="朗读 ${escapeHtml(l.zh)}">
      <div class="card-top">
        <div>
          <h3 class="zh">${escapeHtml(l.zh)}</h3>
          <p class="py">${escapeHtml(l.py)}</p>
        </div>
        <button class="icon-btn learn ${learned ? "on" : ""}" type="button" data-learn="${l.id}"
          title="标记为已掌握" aria-label="标记为已掌握">✓</button>
      </div>
      <p class="lo">${escapeHtml(l.lo)}</p>
      <div class="card-foot">
        <span class="cat-tag">${escapeHtml(state.mode === "life" ? catName(l.cat) : levelName(l.lv))}</span>
        <div class="card-btns">
          <button class="icon-btn speak" type="button" data-speak="${escapeHtml(l.zh)}" title="朗读" aria-label="朗读">🔊</button>
        </div>
      </div>
    </article>`;
  }

  function render() {
    const list = visibleLessons();
    grid.innerHTML = list.map(cardHtml).join("");
    emptyEl.hidden = list.length > 0;
    emptyEl.textContent = state.mode === "hsk"
      ? "这一级的内容还在准备中。 / ເນື້ອຫາຂັ້ນນີ້ຍັງກຽມຢູ່"
      : "没有找到结果，换个词试试。 / ບໍ່ພົບຜົນ";
    renderProgress();
  }

  function renderProgress() {
    const data = currentData();
    const total = data.length;
    const done = data.filter((l) => state.learned.has(l.id)).length;
    $("#progressText").textContent = `已掌握 ${done} / ${total}`;
    $("#progressBar").style.width = total ? (done / total) * 100 + "%" : "0%";
  }

  /* ---------- 事件 ---------- */
  catsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    renderCats();
    render();
  });

  $("#modes").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode");
    if (!btn) return;
    state.mode = btn.dataset.mode;
    document.querySelectorAll("#modes .mode").forEach((b) => b.classList.toggle("active", b === btn));
    catsEl.hidden = state.mode !== "life";
    const levelsEl = $("#levels");
    levelsEl.hidden = state.mode !== "hsk";
    $("#lessonBanner").hidden = state.mode !== "hsk";
    $("#lessonList").hidden = false;
    if (state.mode === "hsk") { renderLevels(); renderLessonList(); }
    render();
  });

  const HSK1_TOC = [
    [1, "AI小语，你好！", "AI Xiǎoyǔ, nǐ hǎo!"],
    [2, "我叫李文", "Wǒ jiào Lǐ Wén"],
    [3, "我是中国人", "Wǒ shì Zhōngguó rén"],
    [4, "我有两个孩子", "Wǒ yǒu liǎng ge háizi"],
    [5, "今天我休息", "Jīntiān wǒ xiūxi"],
    [6, "你的手机号是多少？", "Nǐ de shǒujīhào shì duōshao?"],
    [7, "我晚上六点半下班", "Wǒ wǎnshang liù diǎn bàn xiàbān"],
    [8, "我爸爸也在医院工作", "Wǒ bàba yě zài yīyuàn gōngzuò"],
    [9, "我明天上午在学校学习", "Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí"],
    [10, "这儿的苹果真便宜！", "Zhèr de píngguǒ zhēn piányi!"],
    [11, "我读大学呢", "Wǒ dú dàxué ne"],
    [12, "昨天下雪了", "Zuótiān xià xuě le"],
    [13, "请给我一杯茶", "Qǐng gěi wǒ yì bēi chá"],
    [14, "我看了一个电影", "Wǒ kàn le yí ge diànyǐng"],
    [15, "大兴机场见！", "Dàxīng Jīchǎng jiàn!"]
  ];

  function renderLessonList() {
    const box = $("#llGrid");
    if (!box || box.dataset.done === "1") return;
    box.dataset.done = "1";
    box.innerHTML = HSK1_TOC.map(([n, zh, py]) =>
      `<a class="ll-item" href="lessons/lesson.html?l=${n}"><span class="ll-no">LESSON ${String(n).padStart(2, "0")}</span><span class="ll-zh">${escapeHtml(zh)}</span><span class="ll-py">${escapeHtml(py)}</span></a>`
    ).join("");
  }

  $("#levels").addEventListener("click", (e) => {
    const btn = e.target.closest(".cat");
    if (!btn) return;
    state.level = btn.dataset.level;
    renderLevels();
    render();
  });

  searchEl.addEventListener("input", () => {
    state.q = searchEl.value;
    render();
  });

  $("#showPy").addEventListener("change", (e) => { state.showPy = e.target.checked; render(); });
  $("#showLo").addEventListener("change", (e) => { state.showLo = e.target.checked; render(); });
  $("#onlyNew").addEventListener("change", (e) => { state.onlyNew = e.target.checked; render(); });

  grid.addEventListener("click", (e) => {
    const learnBtn = e.target.closest("[data-learn]");
    if (learnBtn) {
      e.stopPropagation();
      const id = learnBtn.dataset.learn;
      if (state.learned.has(id)) state.learned.delete(id); else state.learned.add(id);
      persist();
      render();
      return;
    }
    const speakBtn = e.target.closest("[data-speak]");
    if (speakBtn) {
      e.stopPropagation();
      speak(speakBtn.dataset.speak);
      return;
    }
    const card = e.target.closest(".card");
    if (card) {
      const lesson = window.LESSONS.find((l) => l.id === card.dataset.id);
      if (lesson) speak(lesson.zh);
    }
  });

  grid.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) {
      e.preventDefault();
      const lesson = window.LESSONS.find((l) => l.id === e.target.dataset.id);
      if (lesson) speak(lesson.zh);
    }
  });

  $("#randomBtn").addEventListener("click", () => {
    const pool = visibleLessons().length ? visibleLessons() : window.LESSONS;
    const l = pool[Math.floor(Math.random() * pool.length)];
    state.cat = l.cat;
    state.q = "";
    searchEl.value = "";
    renderCats();
    render();
    speak(l.zh);
    const el = grid.querySelector(`[data-id="${l.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate(
        [{ boxShadow: "0 0 0 0 rgba(14,110,92,.45)" }, { boxShadow: "0 0 0 12px rgba(14,110,92,0)" }],
        { duration: 900, easing: "ease-out" }
      );
    }
  });

  /* ---------- 测验 ---------- */
  const quiz = $("#quiz");
  let quizPool = [];
  let quizIndex = 0;
  let quizScore = 0;
  let answered = false;

  function startQuiz() {
    const all = currentData().slice();
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    quizPool = all.slice(0, Math.min(10, all.length));
    quizIndex = 0;
    quizScore = 0;
    $("#quizScore").textContent = "0";
    quiz.hidden = false;
    showQuestion();
  }

  function showQuestion() {
    if (quizIndex >= quizPool.length) return finishQuiz();
    answered = false;
    const l = quizPool[quizIndex];
    $("#quizCount").textContent = `${quizIndex + 1} / ${quizPool.length}`;
    $("#quizZh").textContent = l.zh;
    $("#quizPy").textContent = l.py;
    $("#quizLo").textContent = l.lo;
    $("#quizLo").hidden = true;
    $("#quizReveal").hidden = false;
    $("#quizActions").hidden = true;
    speak(l.zh);
  }

  function finishQuiz() {
    $("#quizZh").textContent = "完成！";
    $("#quizPy").textContent = `ສຳເລັດ · 得分 ${quizScore} / ${quizPool.length}`;
    $("#quizLo").textContent = quizScore >= quizPool.length * 0.8 ? "很棒！ດີຫຼາຍ!" : "再练一轮吧。ຝຶກອີກເທື່ອ.";
    $("#quizLo").hidden = false;
    $("#quizReveal").textContent = "再来一轮 · ອີກເທື່ອ";
    $("#quizReveal").hidden = false;
    $("#quizActions").hidden = true;
    $("#quizReveal").dataset.restart = "1";
  }

  $("#quizBtn").addEventListener("click", startQuiz);
  $("#quizClose").addEventListener("click", () => { quiz.hidden = true; });
  quiz.addEventListener("click", (e) => { if (e.target === quiz) quiz.hidden = true; });

  $("#quizReveal").addEventListener("click", () => {
    if ($("#quizReveal").dataset.restart === "1") {
      $("#quizReveal").dataset.restart = "";
      $("#quizReveal").textContent = "显示答案 · ເບິ່ງຄຳຕອບ";
      startQuiz();
      return;
    }
    $("#quizLo").hidden = false;
    $("#quizReveal").hidden = true;
    $("#quizActions").hidden = false;
    answered = true;
  });

  $("#quizYes").addEventListener("click", () => {
    if (!answered) return;
    quizScore++;
    $("#quizScore").textContent = quizScore;
    quizIndex++;
    showQuestion();
  });
  $("#quizNo").addEventListener("click", () => {
    if (!answered) return;
    quizIndex++;
    showQuestion();
  });

  document.addEventListener("keydown", (e) => {
    if (!quiz.hidden && e.key === "Escape") quiz.hidden = true;
  });

  /* ---------- init ---------- */
  renderTones();
  renderCats();
  renderLevels();
  renderLessonList();
  render();
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
})();
