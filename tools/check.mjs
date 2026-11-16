/*
 * 静态自检：数据完整性 + 双语文案覆盖率
 * 运行：node tools/check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const load = (file, expose) => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read(file) + `\n;globalThis.${expose};`, ctx);
  return ctx;
};

const dataCtx = load("js/data.js", "__c = COURSES");
const i18nCtx = load("js/i18n.js", "__i = I18N");
const COURSES = dataCtx.__c;
const I18N = i18nCtx.__i;

const errors = [];
const warnings = [];

/* ---------- 1. 数据结构 ---------- */
const lessonIds = new Set();
let lessonCount = 0;
let questionCount = 0;

for (const course of COURSES) {
  for (const field of ["id", "level", "cover", "char", "title", "tagline", "desc", "lessons"]) {
    if (!course[field]) errors.push(`课程 ${course.id} 缺少字段 ${field}`);
  }
  if (!["beginner", "advanced"].includes(course.level)) {
    errors.push(`课程 ${course.id} level 非法：${course.level}`);
  }
  if (!course.lessons.length) errors.push(`课程 ${course.id} 没有课时`);

  for (const lesson of course.lessons) {
    lessonCount++;
    if (lessonIds.has(course.id + "/" + lesson.id)) errors.push(`课时 id 重复：${course.id}/${lesson.id}`);
    lessonIds.add(course.id + "/" + lesson.id);

    for (const field of ["title", "objectives", "blocks", "quiz"]) {
      if (!lesson[field]) errors.push(`课时 ${course.id}/${lesson.id} 缺少 ${field}`);
    }
    if (!Array.isArray(lesson.quiz) || lesson.quiz.length === 0) {
      errors.push(`课时 ${course.id}/${lesson.id} 没有练习题`);
    }

    for (const [qi, q] of (lesson.quiz || []).entries()) {
      questionCount++;
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`${course.id}/${lesson.id} 第 ${qi + 1} 题选项不足`);
      }
      if (typeof q.answer !== "number" || !q.options[q.answer]) {
        errors.push(`${course.id}/${lesson.id} 第 ${qi + 1} 题 answer 下标非法`);
      }
      if (!q.explain) errors.push(`${course.id}/${lesson.id} 第 ${qi + 1} 题缺少解析`);
    }
  }
}

/* ---------- 2. 双语字段 ---------- */
const checkBi = (value, label) => {
  if (typeof value === "string") return;
  for (const lang of ["zh", "lo"]) {
    if (!value || typeof value[lang] !== "string" || !value[lang].trim()) {
      errors.push(`${label} 缺少 ${lang} 文案`);
    }
  }
};

const walkBi = (value, label) => {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkBi(v, `${label}[${i}]`));
  } else if (value && typeof value === "object") {
    if ("zh" in value || "lo" in value) {
      checkBi(value, label);
    } else {
      for (const [k, v] of Object.entries(value)) walkBi(v, `${label}.${k}`);
    }
  }
};

walkBi(COURSES, "COURSES");

/* ---------- 3. 界面文案 ---------- */
for (const lang of ["zh", "lo"]) {
  if (!I18N[lang]) errors.push(`I18N 缺少语言包 ${lang}`);
}
const zhKeys = new Set(Object.keys(I18N.zh));
const loKeys = new Set(Object.keys(I18N.lo));

for (const key of zhKeys) if (!loKeys.has(key)) errors.push(`老挝语缺少文案：${key}`);
for (const key of loKeys) if (!zhKeys.has(key)) warnings.push(`中文缺少文案：${key}`);

/* HTML 里用到的 key */
const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
const usedKeys = new Set();
for (const file of htmlFiles) {
  const html = read(file);
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) usedKeys.add(m[1]);
}

/* app.js 里直接调用的 key */
const app = read("js/app.js");
for (const m of app.matchAll(/\bt\("([^"]+)"\)/g)) usedKeys.add(m[1]);
/* 拼接生成的 key */
usedKeys.add("level.beginner");
usedKeys.add("level.advanced");

for (const key of usedKeys) {
  if (!zhKeys.has(key)) errors.push(`页面使用了未定义的文案 key：${key}`);
}

/* ---------- 4. 页面文件 ---------- */
for (const page of ["index.html", "courses.html", "lesson.html", "quiz.html"]) {
  if (!fs.existsSync(path.join(root, page))) errors.push(`缺少页面：${page}`);
}

/* ---------- 输出 ---------- */
console.log(`课程 ${COURSES.length} · 课时 ${lessonCount} · 练习 ${questionCount} · 文案 key ${zhKeys.size}`);
if (warnings.length) {
  console.log("\n提示：");
  warnings.forEach((w) => console.log("  - " + w));
}
if (errors.length) {
  console.error("\n发现问题：");
  errors.forEach((e) => console.error("  ✗ " + e));
  process.exit(1);
}
console.log("\n自检通过 ✓");
