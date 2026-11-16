"""
网站自检：检查本地页面的链接、资源、结构信息；也可以检查已上线的网址。

用法（在本目录下运行）：
    D:\\python3.13.17\\python.exe tools\\check_site.py
    D:\\python3.13.17\\python.exe tools\\check_site.py --url https://你的域名
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
import argparse
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
SKIP_PREFIX = ("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#")
ASSET_TAGS = {"img": "src", "script": "src", "link": "href", "source": "src",
              "video": "src", "audio": "src", "iframe": "src"}


class Page(HTMLParser):
    """收集一个 HTML 页面里所有需要联网/落盘的地址。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []        # (标签, 属性, 值)
        self.ids = []         # 页面里所有 id
        self.title = ""
        self._in_title = False
        self.has_lang = False
        self.meta = {}        # name -> content
        self.img_no_alt = 0
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "html" and d.get("lang"):
            self.has_lang = True
        if tag == "meta" and d.get("name") and d.get("content"):
            self.meta[d["name"].lower()] = d["content"]
        if d.get("id"):
            self.ids.append(d["id"])
        if tag == "img" and not (d.get("alt") or "").strip():
            self.img_no_alt += 1
        if tag == "h1":
            self.h1 += 1
        for t, attr in ASSET_TAGS.items():
            if tag == t and d.get(attr):
                self.refs.append((tag, attr, d[attr].strip()))
                break
        if tag == "a" and d.get("href"):
            self.refs.append(("a", "href", d["href"].strip()))

    def handle_data(self, data):
        if self._in_title:
            self.title += data.strip()

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def local_target(page_path: Path, value: str):
    """把 href/src 换算成本地文件路径；外链返回 None。"""
    if not value or value.lower().startswith(SKIP_PREFIX):
        return None
    path = unquote(urlparse(value).path)
    if not path:
        return None
    return (page_path.parent / path.lstrip("/")).resolve()


def check_pages():
    pages = sorted(ROOT.glob("*.html"))
    errors, warnings = [], []
    ids_map = {}

    print(f"扫描目录：{ROOT}")
    print(f"页面数量：{len(pages)}\n")

    for page in pages:
        parser = Page()
        parser.feed(page.read_text(encoding="utf-8"))
        parser.close()
        ids_map[page.name] = parser.ids

        name = page.name
        if not parser.has_lang:
            errors.append(f"{name}: <html> 缺少 lang 属性（影响多语言与屏幕阅读器）")
        if not parser.title:
            errors.append(f"{name}: 缺少 <title>")
        if "description" not in parser.meta:
            warnings.append(f"{name}: 缺少 meta description")
        if "viewport" not in parser.meta:
            errors.append(f"{name}: 缺少 viewport，手机上会缩得很小")
        if parser.h1 == 0:
            warnings.append(f"{name}: 没有 <h1>")
        if parser.h1 > 1:
            warnings.append(f"{name}: 有 {parser.h1} 个 <h1>，建议只留一个")
        if parser.img_no_alt:
            warnings.append(f"{name}: {parser.img_no_alt} 个 <img> 没有 alt")

        dup = {i for i in parser.ids if parser.ids.count(i) > 1}
        for i in sorted(dup):
            errors.append(f"{name}: id 重复（{i}）")

        for tag, attr, value in parser.refs:
            if value.lower().startswith("#"):
                anchor = value[1:]
                if anchor and anchor not in parser.ids:
                    errors.append(f"{name}: 页内锚点找不到目标 {value}")
                continue
            if value.lower().startswith(("http://", "https://")):
                continue
            target = local_target(page, value)
            if target is None:
                continue
            if not target.exists():
                errors.append(f"{name}: <{tag} {attr}=\"{value}\"> 指向的文件不存在")
        print(f"  ✓ {name}：{len(parser.refs)} 个链接/资源")

    return errors, warnings


def check_url(url: str):
    print(f"\n检查线上网址：{url}")
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (site-check)"})
    start = time.time()
    try:
        with urlopen(req, timeout=15) as resp:
            body = resp.read()
            elapsed = (time.time() - start) * 1000
            ctype = resp.headers.get("Content-Type", "?")
            print(f"  HTTP {resp.status} {resp.reason}   {len(body)} 字节   {elapsed:.0f} ms")
            print(f"  Content-Type: {ctype}")
            print(f"  Server: {resp.headers.get('Server', '未提供')}")
            text = body.decode("utf-8", "replace")
            parser = Page()
            parser.feed(text)
            parser.close()
            print(f"  标题: {parser.title or '（没有 title）'}")
            return []
    except HTTPError as e:
        print(f"  ✗ 服务器返回 HTTP {e.code} {e.reason}")
        return [f"线上地址返回 {e.code}"]
    except URLError as e:
        print(f"  ✗ 打不开：{e.reason}")
        return [f"线上地址打不开：{e.reason}"]
    except Exception as e:                     # noqa: BLE001
        print(f"  ✗ 出错：{e}")
        return [f"线上检查出错：{e}"]


def main():
    ap = argparse.ArgumentParser(description="本地网站自检 + 线上可用性检查")
    ap.add_argument("--url", help="已上线的网址，例如 https://example.com")
    args = ap.parse_args()

    errors, warnings = check_pages()
    if args.url:
        errors += check_url(args.url)

    if warnings:
        print("\n提示（不一定是错）：")
        for w in warnings:
            print("  · " + w)
    if errors:
        print("\n发现的问题：")
        for e in errors:
            print("  ✗ " + e)
        print(f"\n共 {len(errors)} 个问题需要处理。")
        return 1
    print("\n全部通过 ✓ 页面结构、链接和本地资源都正常。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
