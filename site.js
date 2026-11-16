/* HSK 3.0 学习站（级别 1–4）— 导航 / 中老双语切换 / 通用小工具 */
(function () {
  var DICT = {
    "nav.home":      ["首页", "ໜ້າຫຼັກ"],
    "nav.pinyin":    ["拼音入门", "ພິນອິນ"],
    "nav.course":    ["HSK 课程", "ບົດຮຽນ HSK"],
    "nav.practice":  ["在线练习", "ຝຶກຫັດ"],
    "nav.downloads": ["资料下载", "ດາວໂຫຼດ"],

    "brand.name": ["HSK 3.0 中文", "ພາສາຈີນ HSK 3.0"],
    "brand.sub":  ["老挝学生自学站 · 1–4 级", "ເວັບຮຽນສຳລັບລາວ · ລະດັບ 1–4"],

    "home.kicker": ["免费 · 零基础 · 不用注册", "ຟຣີ · ຈາກສູນ · ບໍ່ຕ້ອງສະໝັກ"],
    "home.title":  ["免费 HSK 3.0 中文自学网站（1–4 级）", "ເວັບຮຽນພາສາຈີນ HSK 3.0 ລະດັບ 1–4"],
    "home.sub":    ["适合完全零基础的老挝学习者。每天 20 分钟，从 1 级学到 4 级。",
                    "ເໝາະສຳລັບຄົນລາວທີ່ເລີ່ມຈາກສູນ. ມື້ລະ 20 ນາທີ, ຮຽນຈາກລະດັບ 1 ຫາ ລະດັບ 4."],
    "home.lvmap":  ["HSK 3.0 标准：1–2 级入门、3–4 级进阶。本站用 HSK1–HSK3 三册课本覆盖这四级的词汇和语法。",
                    "ມາດຕະຖານ HSK 3.0: ລະດັບ 1–2 ແມ່ນຂັ້ນເລີ່ມຕົ້ນ, ລະດັບ 3–4 ແມ່ນຂັ້ນກາງ. ເວັບນີ້ໃຊ້ປຶ້ມ HSK1–HSK3 ສາມເຫຼັ້ມກວມຄຳສັບ ແລະ ໄວຍາກອນຂອງສີ່ລະດັບນີ້."],
    "home.cta":    ["从拼音开始学习", "ເລີ່ມຮຽນຈາກພິນອິນ"],
    "home.ctaNote":["打开就能学，不用注册", "ເປີດຂຶ້ນມາກໍຮຽນໄດ້, ບໍ່ຕ້ອງສະໝັກ"],
    "home.pathTitle": ["学习路径", "ເສັ້ນທາງການຮຽນ"],
    "home.step1": ["拼音入门", "ພິນອິນ"],
    "home.step2": ["核心词汇", "ຄຳສັບຫຼັກ"],
    "home.step3": ["场景对话", "ບົດສົນທະນາ"],
    "home.step4": ["课后练习", "ຝຶກຫັດ"],
    "home.step5": ["模拟考试", "ສອບເສັງຈຳລອງ"],

    "course.title": ["HSK1 课程", "ບົດຮຽນ HSK1"],
    "course.sub":   ["15 课，每课一个日常主题：生词 + 句型 + 对话",
                     "15 ບົດ, ບົດລະຫົວຂໍ້: ຄຳສັບ + ໂຄງສ້າງ + ບົດສົນທະນາ"],
    "course.words": ["生词", "ຄຳສັບ"],
    "course.done":  ["已学", "ຮຽນແລ້ວ"],

    "p.title": ["在线练习", "ຝຶກຫັດອອນລາຍ"],
    "p.sub":   ["每课 10 道选择题，做完立刻看对错和解析", "ບົດລະ 10 ຂໍ້, ຕອບແລ້ວເຫັນທັນທີ"],
    "p.mock":  ["HSK1 模拟考试 · 20 题", "ສອບເສັງຈຳລອງ HSK1 · 20 ຂໍ້"],
    "p.mockSub": ["做完自动评分，错题带解析", "ຄິດຄະແນນອັດຕະໂນມັດ, ຂໍ້ຜິດມີຄຳອະທິບາຍ"],
    "p.submit": ["提交答案", "ສົ່ງຄຳຕອບ"],
    "p.retry":  ["再做一次", "ເຮັດອີກເທື່ອ"],
    "p.next":   ["下一课", "ບົດຕໍ່ໄປ"],
    "p.score":  ["得分", "ຄະແນນ"],
    "p.right":  ["答对", "ຕອບຖືກ"],
    "p.wrong":  ["答错", "ຕອບຜິດ"],
    "p.answered": ["已答", "ຕອບແລ້ວ"],
    "p.correctIs": ["正确答案", "ຄຳຕອບທີ່ຖືກ"],
    "p.allDone": ["全部答完了，点「提交答案」看结果。", "ຕອບຄົບແລ້ວ, ກົດສົ່ງຄຳຕອບ."],
    "p.pickAll": ["还有题没答。", "ຍັງມີຂໍ້ທີ່ຍັງບໍ່ໄດ້ຕອບ."],

    "d.title": ["资料下载", "ດາວໂຫຼດເອກະສານ"],
    "d.sub":   ["打印出来随时背，手机上也能看", "ພິມອອກມາທ່ອງ, ເບິ່ງໃນມືຖືໄດ້"],
    "d.download": ["下载 PDF", "ດາວໂຫຼດ PDF"],

    "py.title": ["拼音入门", "ພິນອິນ"],
    "py.sub":   ["声母、韵母、四声、拼读规则，一次学会", "ພະຍັນ, ສະຫຼະ, ສີ່ສຽງ, ກົດເກນ"],

    "btn.practice": ["做练习", "ເຮັດແບບຝຶກຫັດ"],
    "btn.open":     ["打开", "ເປີດ"],
    "common.tip":   ["提示", "ຄຳແນະນຳ"]
  };

  var LANG_KEY = "hsk1-lang";
  var LV_NUM = (function () {
    var m = /[?&]lv=([234])\b/.exec(location.search);
    return m ? m[1] : "1";
  })();
  var lang = "lo";
  try { lang = localStorage.getItem(LANG_KEY) || "lo"; } catch (e) {}

  function t(key) {
    var v = DICT[key];
    if (!v) return key;
    return lang === "lo" ? v[1] : v[0];
  }

  function lvText(txt) {
    if (LV_NUM === "1") return txt;
    return txt.split("HSK1").join("HSK" + LV_NUM)
      .split("HSK 1").join("HSK " + LV_NUM);
  }

  function apply() {
    document.documentElement.lang = lang === "lo" ? "lo" : "zh-CN";
    document.body.classList.toggle("lang-lo", lang === "lo");
    document.body.classList.toggle("lang-zh", lang === "zh");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      var v = DICT[k];
      if (!v) return;
      var txt = lvText(lang === "lo" ? v[1] : v[0]);
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = txt;
      else el.textContent = txt;
    });
    document.querySelectorAll(".langsw button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === lang);
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function setLang(next) {
    lang = next === "zh" ? "zh" : "lo";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    apply();
  }

  var NAV = [
    ["home", "index.html"],
    ["pinyin", "pinyin.html"],
    ["course", "course.html"],
    ["practice", "practice.html"],
    ["downloads", "downloads.html"]
  ];

  function base() {
    // 课程页在 lessons/ 子目录，需要回退一层
    return location.pathname.indexOf("/lessons/") >= 0 ? "../" : "";
  }

  function buildNav() {
    var here = location.pathname.split("/").pop() || "index.html";
    // 保留 HSK 级别：在 HSK2 页面里点导航仍留在 HSK2
    var lvq = LV_NUM === "1" ? "" : "?lv=" + LV_NUM;
    var nav = document.createElement("nav");
    nav.className = "mainnav";
    NAV.forEach(function (item) {
      var a = document.createElement("a");
      a.href = base() + item[1] + (item[1] === "index.html" || item[1] === "pinyin.html" ? "" : lvq);
      a.setAttribute("data-i18n", "nav." + item[0]);
      a.textContent = t("nav." + item[0]);
      if (here === item[1]) a.className = "on";
      nav.appendChild(a);
    });
    return nav;
  }

  function buildSwitch() {
    var box = document.createElement("div");
    box.className = "langsw";
    [["zh", "中文"], ["lo", "ລາວ"]].forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-lang", p[0]);
      b.textContent = p[1];
      if (p[0] === lang) b.className = "on";
      b.addEventListener("click", function () { setLang(p[0]); });
      box.appendChild(b);
    });
    return box;
  }

  var LEVEL_PAGES = {
    "course.html": 1, "practice.html": 1, "vocab.html": 1, "grammar.html": 1,
    "review.html": 1, "test.html": 1, "lesson.html": 1
  };

  // 在 HSK2 页面里，把页面内指向其他学习页的链接补上 lv=2，避免一点就掉回 HSK1
  function keepLevel() {
    if (LV_NUM === "1") return;
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|javascript:|tel:)/i.test(href)) continue;
      if (/[?&]lv=/.test(href)) continue;
      var hash = "";
      var hi = href.indexOf("#");
      if (hi >= 0) { hash = href.slice(hi); href = href.slice(0, hi); }
      var qs = "";
      var qi = href.indexOf("?");
      if (qi >= 0) { qs = href.slice(qi + 1); href = href.slice(0, qi); }
      var file = href.split("/").pop();
      if (!LEVEL_PAGES[file]) continue;
      a.setAttribute("href", href + "?" + (qs ? qs + "&" : "") + "lv=" + LV_NUM + hash);
    }
  }

  function boot() {
    var bar = document.querySelector(".topbar-inner");
    if (bar) {
      bar.innerHTML = "";
      var brand = document.createElement("a");
      brand.className = "brand";
      brand.href = base() + "index.html";
      brand.innerHTML = '<span class="brand-mark">汉</span><span class="brand-text">' +
        '<strong data-i18n="brand.name">' + t("brand.name") + "</strong>" +
        '<span data-i18n="brand.sub">' + t("brand.sub") + "</span></span>";
      bar.appendChild(brand);
      bar.appendChild(buildNav());
      bar.appendChild(buildSwitch());
    }
    if (bar) document.body.classList.add("has-nav");
    keepLevel();
    apply();
  }

  window.SITE = { t: t, lang: function () { return lang; }, setLang: setLang, apply: apply };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
