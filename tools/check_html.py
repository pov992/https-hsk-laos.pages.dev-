"""
HTML 结构校验：检查整页与动态片段里的标签是否闭合、是否有多余闭合。
运行：python tools/check_html.py
"""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class Checker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"多余的闭合标签 </{tag}>")
        elif self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(f"闭合不匹配：遇到 </{tag}>，但当前未闭合的是 <{self.stack[-1]}>")


def check(path):
    checker = Checker()
    checker.feed(path.read_text(encoding="utf-8"))
    checker.close()
    problems = list(checker.errors)
    if checker.stack:
        problems.append("未闭合：" + ", ".join(f"<{t}>" for t in checker.stack))
    return problems


def main():
    targets = sorted(ROOT.glob("*.html"))
    frag_dir = ROOT.parent / "_preview" / "fragments"
    fragments = sorted(frag_dir.glob("*.html")) if frag_dir.exists() else []

    failed = 0
    for path in targets + fragments:
        problems = check(path)
        if problems:
            failed += 1
            print(f"✗ {path.name}")
            for p in problems:
                print("   " + p)

    print(f"检查 {len(targets)} 个页面、{len(fragments)} 个动态片段："
          f"{'全部结构正确 ✓' if failed == 0 else str(failed) + ' 个文件有问题'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
