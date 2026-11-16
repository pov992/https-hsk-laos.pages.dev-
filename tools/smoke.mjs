/*
 * 冒烟测试：用最小 DOM 桩执行 app.js 的渲染与判分逻辑，
 * 把生成的 HTML 片段落盘，交给 tools/check-html.py 做结构校验。
 * 运行：node tools/smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.resolve(root, "..", "_preview", "fragments");
fs.mkdirSync(outDir, { recursive: true });

/* ---------- 最小 DOM 桩 ---------- */
const nodes = new Map();
const store = new Map();

function makeNode(sel) {
  return {
    sel,
    innerHTML: "",
    textContent: "",
    href: "",
    hidden: false,
    disabled: false,
    dataset: {},
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {},
    setAttribute() {},
    setAttributeNS() {},
  };
}

const document = {
  title: "",
  documentElement: { lang: "zh-CN" },
  body: { dataset: { page: "lesson" } },
  addEventListener() {},
  querySelector(sel) {
    if (!nodes.has(sel)) nodes.set(sel, makeNode(sel));
    return nodes.get(sel);
  },
  querySelectorAll() {
    return [];
  },
};

const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
};

const ctx = {
  console,
  document,
  localStorage,
  location: { search: "?course=pinyin&lesson=p1" },
  window: { scrollTo() {} },
  setTimeout,
  URLSearchParams,
};
vm.createContext(ctx);

for (const file of ["js/i18n.js", "js/data.js", "js/app.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
}

/* const 声明不会挂到全局对象上，这里显式导出给测试脚本用 */
vm.runInContext("globalThis.COURSES = COURSES;", ctx);

const errors = [];
const check = (cond, msg) => {
  if (!cond) errors.push(msg);
};

/* ---------- 1. 课程卡片 ---------- */
for (const lang of ["zh", "lo"]) {
  vm.runInContext(`LANG = "${lang}"`, ctx);
  for (const course of ctx.COURSES) {
    const html = vm.runInContext(`courseCard(COURSES.find(c => c.id === "${course.id}"))`, ctx);
    check(!/undefined|NaN/.test(html), `courseCard ${course.id} (${lang}) 出现 undefined/NaN`);
    check(html.includes(course.char), `courseCard ${course.id} 缺少封面字`);
    fs.writeFileSync(path.join(outDir, `card-${course.id}-${lang}.html`), html);
  }
}

/* ---------- 2. 课时三个标签页 ---------- */
for (const lang of ["zh", "lo"]) {
  vm.runInContext(`LANG = "${lang}"`, ctx);
  for (const course of ctx.COURSES) {
    for (const lesson of course.lessons) {
      const set = (fn) =>
        vm.runInContext(`(${fn})(COURSES.find(c=>c.id==="${course.id}"), COURSES.find(c=>c.id==="${course.id}").lessons.find(l=>l.id==="${lesson.id}"))`, ctx);

      const text = set("textTabHTML");
      const video = set("videoTabHTML");
      const quiz = set("quizTabHTML");

      check(!/undefined|NaN/.test(text), `课文 ${course.id}/${lesson.id} (${lang}) 出现 undefined/NaN`);
      check(!/undefined|NaN/.test(video), `视频 ${course.id}/${lesson.id} (${lang}) 出现 undefined/NaN`);
      check(!/undefined|NaN/.test(quiz), `练习 ${course.id}/${lesson.id} (${lang}) 出现 undefined/NaN`);
      check(text.includes('id="markDone"'), `课文 ${course.id}/${lesson.id} 缺少 markDone 按钮`);
      check(video.includes('id="playBtn"'), `视频 ${course.id}/${lesson.id} 缺少播放按钮`);
      check(quiz.includes(lesson.quiz.length + ""), `练习 ${course.id}/${lesson.id} 题数不正确`);

      const base = `${course.id}-${lesson.id}-${lang}`;
      fs.writeFileSync(path.join(outDir, `text-${base}.html`), text);
      fs.writeFileSync(path.join(outDir, `video-${base}.html`), video);
      fs.writeFileSync(path.join(outDir, `quiztab-${base}.html`), quiz);
    }
  }
}

/* ---------- 3. 整页渲染（课文页 / 练习页） ---------- */
vm.runInContext(`LANG = "zh"`, ctx);
vm.runInContext("setupLesson()", ctx);
for (const sel of ["#lessonTitle", "#lessonMeta", "#sideProgress", "#lessonList", "#lessonPager", "#tabText"]) {
  const node = nodes.get(sel);
  check(node && (node.innerHTML || node.textContent), `课时页 ${sel} 未渲染`);
}
fs.writeFileSync(path.join(outDir, "page-lesson.html"), nodes.get("#tabText").innerHTML);

vm.runInContext("setupQuiz()", ctx);
document.body.dataset.page = "quiz";
const quizApp = () => nodes.get("#quizApp").innerHTML;
check(quizApp().includes('id="quizAction"'), "练习页缺少提交按钮");
fs.writeFileSync(path.join(outDir, "quiz-q1.html"), quizApp());

/* ---------- 4. 判分流程：全选正确答案应得 100% ---------- */
let percent = null;
for (let i = 0; i < 3; i++) {
  const state = vm.runInContext("quizState", ctx);
  const correct = vm.runInContext("quizState.lesson.quiz[quizState.idx].answer", ctx);
  state.selected = correct;
  vm.runInContext("submitAnswer()", ctx);
  check(quizApp().includes("is-correct"), `第 ${i + 1} 题提交后没有正确态样式`);

  if (i < 2) {
    vm.runInContext("quizState.idx += 1; quizState.selected = null; quizState.locked = false; renderQuestion();", ctx);
  }
}
vm.runInContext("finishQuiz()", ctx);
const resultHTML = quizApp();
check(resultHTML.includes("100"), "全对后未显示 100%");
check(resultHTML.includes("review-item"), "结果页缺少逐题回顾");
fs.writeFileSync(path.join(outDir, "quiz-result.html"), resultHTML);

const savedScore = JSON.parse(store.get("lcl.scores") || "{}");
check(savedScore["pinyin/p1"] === 100, "成绩未写入本地存储");
const savedDone = JSON.parse(store.get("lcl.done") || "{}");
check(!!savedDone["pinyin/p1"], "完成练习后未标记课时完成");

/* ---------- 5. 错题路径 ---------- */
const wrong = vm.runInContext("quizState.lesson.quiz[0].answer === 0 ? 1 : 0", ctx);
vm.runInContext(`renderQuestion(); quizState.selected = ${wrong}; submitAnswer();`, ctx);
check(quizApp().includes("is-wrong"), "答错后没有错误态样式");
check(quizApp().includes("is-correct"), "答错后没有标出正确答案");

/* ---------- 6. 语言切换 ---------- */
vm.runInContext("renderResult()", ctx);
const zhResult = quizApp();
vm.runInContext('setLang("lo")', ctx);
const loResult = quizApp();
check(zhResult !== loResult, "切换语言后练习页内容未变化");
check(/[\u0E80-\u0EFF]/.test(loResult), "老挝语模式下页面没有老挝文字符");
vm.runInContext('setLang("zh")', ctx);

/* ---------- 输出 ---------- */
if (errors.length) {
  console.error("冒烟测试失败：");
  errors.forEach((e) => console.error("  ✗ " + e));
  process.exit(1);
}
console.log("冒烟测试通过 ✓（课程卡片、课文/视频/练习、判分、存储、语言切换）");
