# -*- coding: utf-8 -*-
"""数据校验：解析结果与 PDF 原文逐行模糊比对。"""
import csv
import re
import sys
from collections import defaultdict

import pypdfium2 as pdfium


def load_raw(pdf_path: str) -> dict[int, str]:
    pdf = pdfium.PdfDocument(pdf_path)
    out = {}
    for p in range(len(pdf)):
        tp = pdf[p].get_textpage()
        out[p + 1] = tp.get_text_range(0, tp.count_chars())
    return out


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s or "")


def main():
    pdf_path = sys.argv[1]
    csv_path = sys.argv[2]
    raw = load_raw(pdf_path)
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))

    stats = defaultdict(int)
    examples = []
    for r in rows:
        page = int(r["page"])
        # 跨页行内容可能在相邻页，取本页+前后页拼接
        text = norm("".join(raw.get(p, "") for p in (page - 1, page, page + 1)))
        code = r["code"]
        name = norm(r["name"])
        # 取代码在页内全部出现位置，任一位于其后的 300 字符窗口命中即算通过
        windows = []
        start = 0
        while True:
            idx = text.find(code, start)
            if idx < 0:
                break
            windows.append(text[idx: idx + 300])
            start = idx + 1
        if not windows:
            stats["code_not_found_on_page"] += 1
            if len(examples) < 5:
                examples.append(("code", r))
            continue
        joined = "|".join(windows)
        # 名称/教师放宽到整页校验（部分页面提取顺序按列而非按行）
        if name and name not in joined and name not in text:
            stats["name_not_in_segment"] += 1
            if len(examples) < 10:
                examples.append(("name", r))
        teacher = norm(r["teacher"].replace(" ", ""))
        if teacher and teacher[:2] not in joined and teacher[:2] not in text:
            stats["teacher_head_not_in_segment"] += 1
            if len(examples) < 15:
                examples.append(("teacher", r))
        room = norm(r["room"])
        if room and room[:4] not in joined and "在线" not in room:
            stats["room_head_not_in_segment"] += 1
            if len(examples) < 20:
                examples.append(("room", r))
        if r["periods"] and r["periods"] != "/":
            if norm(r["periods"]) not in joined:
                stats["periods_not_in_segment"] += 1
                if len(examples) < 25:
                    examples.append(("periods", r))

    print("total rows:", len(rows))
    for k, v in sorted(stats.items()):
        print(f"  {k}: {v}")
    print("\nexamples:")
    for kind, r in examples[:25]:
        print(f"  [{kind}]", {k: r[k] for k in
              ("unit", "code", "name", "teacher", "day", "periods", "weeks", "room", "page")})


if __name__ == "__main__":
    main()
