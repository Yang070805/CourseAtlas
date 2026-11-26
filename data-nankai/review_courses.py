# -*- coding: utf-8 -*-
"""数据复审：目录页比对 + 课程号唯一性 + 字段格式 + 跨学期一致性。"""
import csv
import re
import sys
from collections import defaultdict

import pypdfium2 as pdfium


def find_toc_page(pdf_path: str) -> int:
    """找到"开课单位代码表"所在页（PDF 页码，1 起）。"""
    pdf = pdfium.PdfDocument(pdf_path)
    for i in range(min(len(pdf), 30)):
        tp = pdf[i].get_textpage()
        t = tp.get_text_range(0, tp.count_chars())
        if "开课单位代码表" in t:
            return i + 1
    return -1


def parse_toc(pdf_path: str):
    """解析目录：单位 → 手册印刷页码。返回 (entries, printed_page_of_first)"""
    toc_pdf = find_toc_page(pdf_path)
    if toc_pdf < 0:
        return [], None
    pdf = pdfium.PdfDocument(pdf_path)
    tp = pdf[toc_pdf - 1].get_textpage()
    t = tp.get_text_range(0, tp.count_chars())
    entries = []
    for m in re.finditer(r"([A-Z]{4})\s+(\S+?)[.\s]+(\d+)", t):
        entries.append((m.group(2).strip(), int(m.group(3))))
    return entries, toc_pdf


def check(csv_path: str, pdf_path: str, label: str) -> dict:
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))
    stats = defaultdict(int)
    issues = []

    # 1) 课程号唯一性（一门课多条开课行属正常，只统计重复行数）
    seen = set()
    for r in rows:
        seen.add(r["code"])

    # 2) 每门课至少一条开课、每条开课行字段格式
    course_off = defaultdict(int)
    for r in rows:
        course_off[r["code"]] += 1
        d = r["day"]
        if d not in ("", "/") and not re.fullmatch(r"[1-7]", d):
            stats["bad_day"] += 1
            if len(issues) < 12:
                issues.append(("bad_day", r["code"], d, r["page"]))
        p = r["periods"]
        if p not in ("", "/") and not re.fullmatch(r"\d{1,2}/\d{1,2}", p):
            stats["bad_periods"] += 1
            if len(issues) < 12:
                issues.append(("bad_periods", r["code"], p, r["page"]))
        w = r["weeks"]
        if w and not re.fullmatch(r"[0-9,\-单双]+", w):
            stats["bad_weeks"] += 1
            if len(issues) < 12:
                issues.append(("bad_weeks", r["code"], w, r["page"]))
        if r["capacity"] and not re.fullmatch(r"\d+", r["capacity"]):
            stats["bad_capacity"] += 1
        if r["cross_capacity"] and not re.fullmatch(r"\d+", r["cross_capacity"]):
            stats["bad_cross"] += 1
        if not r["weeks_list"] and r["periods"] and r["periods"] != "/" and r["weeks"]:
            stats["weeks_unparseable"] += 1
            if len(issues) < 15:
                issues.append(("weeks_unparseable", r["code"], r["weeks"], r["page"]))
    stats["courses"] = len(course_off)
    stats["offerings"] = len(rows)
    stats["empty_day_are_slash"] = sum(1 for r in rows if not r["day"] and r["periods"] == "/")

    # 3) 目录页比对：小节起始印刷页码 → PDF 页码偏移
    entries, toc_pdf = parse_toc(pdf_path)
    # 找第一个有表格的小节起始页
    first_unit_printed = entries[0][1] if entries else None
    # 用实际数据反查偏移：找"通识选修课"小节起始 PDF 页
    first_sec_pdf = None
    for r in rows:
        if r["section_type"] == "通识选修课":
            first_sec_pdf = int(r["page"])
            break
    if entries and first_sec_pdf is not None and first_unit_printed:
        offset = first_sec_pdf - first_unit_printed
        units_pdf = {}
        for unit, printed in entries:
            units_pdf[unit] = printed + offset
        # 对比每个小节的实际起始页
        sec_start = {}
        for r in rows:
            if r["unit"] not in sec_start:
                sec_start[r["unit"]] = int(r["page"])
        mismatch = 0
        for unit, pdf_page in units_pdf.items():
            if unit in sec_start and abs(sec_start[unit] - pdf_page) > 1:
                mismatch += 1
                if len(issues) < 20:
                    issues.append(("toc_mismatch", unit, sec_start[unit], pdf_page))
        stats["toc_units"] = len(units_pdf)
        stats["toc_matched_units"] = len(units_pdf) - mismatch

    print(f"=== {label}: rows={len(rows)} courses={stats['courses']} "
          f"toc_units={stats.get('toc_units','-')} "
          f"toc_matched={stats.get('toc_matched_units','-')} "
          f"empty_day(slash)={stats['empty_day_are_slash']}")
    stats["multi_offering_rows"] = len(rows) - len(seen)
    for k in ("bad_day", "bad_periods", "bad_weeks",
              "bad_capacity", "bad_cross", "weeks_unparseable"):
        if stats.get(k):
            print(f"  {k}: {stats[k]}")
    for it in issues:
        print("  issue:", it)
    return rows


def cross_semester(fall_rows, spring_rows):
    def names_by_unit(rows):
        d = defaultdict(set)
        for r in rows:
            if r["section_type"] == "开课单位课程":
                d[r["unit"]].add(r["name"])
        return d
    f = names_by_unit(fall_rows)
    s = names_by_unit(spring_rows)
    common = set(f) & set(s)
    print(f"=== 跨学期：共同开课单位 {len(common)} 个")
    for u in sorted(common):
        inter = len(f[u] & s[u])
        print(f"  {u}: 秋 {len(f[u])} 门 / 春 {len(s[u])} 门 / 课程名重合 {inter}")


if __name__ == "__main__":
    fall_csv, fall_pdf, spring_csv, spring_pdf = sys.argv[1:5]
    f = check(fall_csv, fall_pdf, "2026秋")
    s = check(spring_csv, spring_pdf, "2025春")
    cross_semester(f, s)
