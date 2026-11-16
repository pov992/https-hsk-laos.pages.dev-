# 老挝学生中文课堂（网站原型）

面向老挝中学生的中文学习网站：**拼音 → 日常口语 → HSK 一级**，中老双语，课文 + 视频位 + 自动判分练习。

纯静态站点，不需要服务器、不需要安装任何依赖，双击 `index.html` 就能用；也可以放到任意静态托管上。

---

## 一、怎么打开

**方式 1：直接双击** `index.html`（推荐先这样看效果）。

**方式 2：本地起一个小服务**（更接近真实上线环境）：

```bash
python -m http.server 8123
# 然后浏览器打开 http://127.0.0.1:8123
```

**方式 3：部署**：把整个 `lao-chinese` 文件夹上传到 GitHub Pages、Netlify、Vercel，
或学校自己的服务器（Nginx / IIS 静态目录）即可，无需数据库。

---

## 二、页面与功能

| 页面 | 说明 |
| --- | --- |
| `index.html` | 首页：介绍、特色、课程入口、学习进度概览 |
| `courses.html` | 全部课程，可按「入门 / 进阶」筛选 |
| `lesson.html?course=pinyin&lesson=p1` | 课程详情：**课文 / 视频 / 练习** 三个标签，侧边栏目录 + 上一课/下一课 |
| `quiz.html?course=pinyin&lesson=p1` | 练习：逐题作答，提交后**立即判分并显示解析**，最后给分数和逐题回顾 |

已实现：

- **中老双语**：右上角「中文 / ລາວ」一键切换，界面和课程内容一起切换，选择记在浏览器里。
- **自动判分**：选答案 → 提交 → 立刻显示对错、正确答案和解析；全部答完给出百分比分数。
- **学习进度**：学完的课、最好成绩保存在本机（`localStorage`），刷新不丢，首页和课程卡片会显示进度条。
- **无需注册**：打开就能学，适合机房、手机、家里混用。
- **响应式**：手机 / 平板 / 电脑自适应。
- **可访问性**：键盘可操作、语义化标签、`prefers-reduced-motion` 友好。

---

## 三、目录结构

```
lao-chinese/
├─ index.html            首页
├─ courses.html          课程列表
├─ lesson.html           课程详情（课文/视频/练习）
├─ quiz.html             自动判分练习
├─ css/style.css         全部样式
├─ js/
│  ├─ data.js            课程内容（改这里就能换教材）
│  ├─ i18n.js            界面文案（中 / 老双语）
│  └─ app.js             渲染、语言切换、进度、判分逻辑
└─ tools/
   ├─ check.mjs          内容与文案自检
   ├─ smoke.mjs          无浏览器冒烟测试（渲染 + 判分 + 存储）
   └─ check_html.py      HTML 标签结构校验
```

---

## 四、怎么替换成你们学校的内容

### 1. 课程内容：`js/data.js`

一门课的结构（省略了部分字段）：

```js
{
  id: "pinyin",              // 唯一 id，用于网址参数
  level: "beginner",         // beginner 入门 / advanced 进阶
  cover: "pinyin",           // 封面配色：pinyin / daily / hsk
  char: "拼",                 // 封面大字
  title:   { zh: "拼音入门", lo: "ພິນອິນເບື້ອງຕົ້ນ" },
  tagline: { zh: "一句话简介", lo: "..." },
  desc:    { zh: "课程介绍", lo: "..." },
  lessons: [
    {
      id: "p1",
      minutes: 12,
      title: { zh: "声母 b p m f", lo: "..." },
      objectives: [{ zh: "学会……", lo: "..." }],   // 学习目标
      blocks: [                                    // 课文内容
        { type: "p", text: { zh: "段落", lo: "..." } },
        {
          type: "vocab",
          title: { zh: "本课生词", lo: "..." },
          items: [{ zh: "爸爸", pinyin: "bàba", lo: "ພໍ່" }]
        },
        { type: "tip", text: { zh: "小提示", lo: "..." } }
      ],
      quiz: [                                      // 练习题
        {
          q: { zh: "题目", lo: "..." },
          options: [{ zh: "选项 A", lo: "..." }, { zh: "选项 B", lo: "..." }],
          answer: 0,                               // 正确选项的下标，从 0 开始
          explain: { zh: "解析", lo: "..." }
        }
      ]
    }
  ]
}
```

> 增删课程、课时、题目都会自动反映到首页统计、侧边栏目录和课程卡片上，不需要改其它代码。

### 2. 界面文字：`js/i18n.js`

- `I18N.zh` 与 `I18N.lo` 必须保持**相同的 key**。
- `{n}`、`{i}`、`{done}` 是占位符，比如 `"第 {i} / {n} 题"`。

### 3. 视频

`lesson.html` 的「视频」标签现在是**占位播放器**，并标出了接入位置。
把 `js/app.js` 里 `videoTabHTML()` 的 `.video-poster` 换成真实播放器即可，例如：

```html
<video controls poster="images/p1-cover.jpg" style="width:100%">
  <source src="videos/p1.mp4" type="video/mp4" />
</video>
```

或直接嵌 YouTube / Bilibili 的 `<iframe>`（老挝网络若打不开 B 站，建议自托管 mp4）。

### 4. 配色与校徽

- 主色在 `css/style.css` 顶部的 `:root` 里改：`--red`、`--gold`、`--blue`。
- 校名在四个 HTML 页面的 `.brand` 和页脚里（`data-i18n="brand.name"` 的文案在 `i18n.js`）。

---

## 五、自检命令（改完内容后跑一下）

需要 Node 和 Python：

```bash
node tools/check.mjs       # 课程结构、题目答案下标、双语文案是否齐全
node tools/smoke.mjs       # 渲染 + 判分 + 进度存储 + 语言切换
python tools/check_html.py # 页面和动态片段的标签是否闭合
```

三个都通过，基本可以放心发布。

---

## 六、目前的限制（下一阶段再做）

1. **没有账号和后端**：进度只存在当前浏览器，换设备不同步；老师看不到班级成绩。
2. **视频是占位**，需要接入真实视频文件。
3. **老挝语译文是演示稿**：正式使用前请老挝语老师逐条校对（尤其是声调、量词这类专业表述）。
4. **题目目前手写在 `data.js`**：题库大了以后建议迁到 Excel / JSON 后台，再配一个录入界面。
5. **没有防作弊**：判分在前端，学生能看到正确答案（练习场景够用，考试场景不够）。

如果要做「学生账号 + 班级成绩 + 老师后台」，就需要加后端（例如 Node/Express + SQLite，
或直接用 Supabase / Firebase），这是下一步的工作量。

---

## 七、内容声明

站内课程、例句、题目为**演示用示例内容**，用于展示产品形态；
正式发布前请按学校实际教材替换，并由中文、老挝语老师分别审校。
