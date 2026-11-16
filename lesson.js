(function () {
  "use strict";

  /* ---------- 朗读 ---------- */
  let voicesReady = false;
  function pickVoice() {
    const vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => { voicesReady = true; };
    window.speechSynthesis.getVoices();
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[！？。，、；：""''（）]/g, "");
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "zh-CN";
    u.rate = 0.82;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-say]");
    if (btn) {
      e.preventDefault();
      speak(btn.dataset.say);
    }
  });

  /* ---------- 显示/隐藏 ---------- */
  const pyBtn = document.getElementById("togglePy");
  const loBtn = document.getElementById("toggleLo");
  function syncToggles() {
    pyBtn.style.background = document.body.classList.contains("hide-py") ? "#E4DCCD" : "#fff";
    loBtn.style.background = document.body.classList.contains("hide-lo") ? "#E4DCCD" : "#fff";
  }
  pyBtn.addEventListener("click", () => { document.body.classList.toggle("hide-py"); syncToggles(); });
  loBtn.addEventListener("click", () => { document.body.classList.toggle("hide-lo"); syncToggles(); });
  syncToggles();

  /* ---------- 练习 ---------- */
  const QUESTIONS = [
    {
      q: "“谢谢” 是什么意思？",
      options: ["ຂອບໃຈ", "ລາກ່ອນ", "ສະບາຍດີ", "ຂໍໂທດ"],
      answer: 0,
      why: "谢谢 = ຂອບໃຈ. 回答用“不客气”。"
    },
    {
      q: "别人说“谢谢”，你应该回答：",
      options: ["不客气", "再见", "你好", "对不起"],
      answer: 0,
      why: "“不客气” = ບໍ່ເປັນຫຍັງ，是对“谢谢”的标准回答。"
    },
    {
      q: "对老师，应该用哪个词表示“你”？",
      options: ["您", "你", "你们", "她们"],
      answer: 0,
      why: "“您” 是敬称，用于老师、长辈或需要尊重的人。"
    },
    {
      q: "“同学们” 是什么意思？",
      options: ["ເພື່ອນຮ່ວມຫ້ອງທັງຫຼາຍ", "ຄູ", "ພວກເຈົ້າ", "ນັກຮຽນຄົນໜຶ່ງ"],
      answer: 0,
      why: "同学 = ເພື່ອນຮ່ວມຫ້ອງ；加“们”表示复数。"
    },
    {
      q: "补全句子：老师，___！（告别）",
      options: ["再见", "你好", "谢谢", "不客气"],
      answer: 0,
      why: "告别说“再见” = ລາກ່ອນ。"
    }
  ];

  const quizEl = document.getElementById("quiz");
  let score = 0;
  let answeredCount = 0;

  quizEl.innerHTML = QUESTIONS.map((item, i) => `
    <div class="quiz-item" data-q="${i}">
      <p class="q-text"><span class="zh">${i + 1}. ${item.q}</span></p>
      <div class="opts">
        ${item.options.map((o, j) => `<button class="opt" type="button" data-opt="${j}">${o}</button>`).join("")}
      </div>
      <p class="q-feedback"></p>
    </div>
  `).join("");

  quizEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".opt");
    if (!btn) return;
    const card = btn.closest(".quiz-item");
    if (card.dataset.done === "1") return;
    card.dataset.done = "1";
    answeredCount++;

    const idx = Number(card.dataset.q);
    const item = QUESTIONS[idx];
    const chosen = Number(btn.dataset.opt);
    const opts = card.querySelectorAll(".opt");
    opts[item.answer].classList.add("correct");

    if (chosen === item.answer) {
      score++;
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
    }

    const fb = card.querySelector(".q-feedback");
    fb.textContent = (chosen === item.answer ? "✅ 正确！" : "❌ 再想想：") + item.why;
    fb.classList.add("show");

    document.getElementById("score").textContent = score;
  });
})();
