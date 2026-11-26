"""
export_app_data.py — 将南开真实数据导出为前端可直接加载的 JSON

输入：
  data-nankai/nankai_courses_2026秋.json   （教务部选课手册 2026-2027-1，已解析并校验）
  data-nankai/nankai_courses_2025春.json   （教学手册 2024-2025-2，已解析并校验）
  data-nankai/枝上-26秋-选课攻略-整理.xlsx  （枝上学生课程评价，644 条）

输出：
  public/data/term-2026-2027-1.json
  public/data/term-2024-2025-2.json
  public/data/reviews.json

数据口径（与 docs/05 一致）：
  - 学分手册未提供，保持 null（学分为用户在计划中录入）
  - 备注含"停课"的开课记录不导出（不可选）
  - module 字段去内部空格（PDF 折行导致），day 为 1-7（周一至周日）
  - periods "a/b" 解析为 start=a, end=b（原始数据保证 a<=b）
"""
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, "..", "public", "data")
os.makedirs(OUT_DIR, exist_ok=True)

CATEGORY_MAP = {
    "通识选修课": ("通识选修课", "通识选修"),
    "通识必修·体育": ("通识必修课", "体育"),
    "通识必修·大学英语": ("通识必修课", "大学英语"),
    "通识必修·思想政治": ("通识必修课", "思想政治"),
    "通识必修·心理健康": ("通识必修课", "心理健康"),
    "通识必修·军事理论": ("通识必修课", "军事理论"),
    "大类基础·数学": ("大类基础课", "数学"),
    "大类基础·计算机": ("大类基础课", "计算机"),
    "专业课程·必修选修待定": ("专业课程", "专业课程"),
    "国际学生课程": ("其他课程", "国际学生"),
    "创新创业课程·性质待定": ("其他课程", "创新创业"),
}


def norm_module(m):
    if not m:
        return ""
    return re.sub(r"\s+", "", str(m))


def parse_periods(p):
    p = str(p or "").strip()
    if not p or p == "/":
        return None
    m = re.fullmatch(r"(\d+)/(\d+)", p)
    if not m:
        raise ValueError(f"unexpected periods: {p!r}")
    a, b = int(m.group(1)), int(m.group(2))
    if a > b:
        a, b = b, a
    return a, b


def export_term(src_name, term_id, out_name):
    src = os.path.join(BASE, src_name)
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    courses = []
    skipped = 0
    seq = 0
    for section in data["sections"]:
        unit = section.get("unit") or ""
        offered = []
        for c in section.get("courses", []):
            ctype = c.get("course_type") or ""
            cat, label = CATEGORY_MAP.get(ctype, ("其他课程", ctype or "其他"))
            offerings = []
            for o in c.get("offerings", []):
                remark = str(o.get("remark") or "").strip()
                if "停课" in remark:
                    skipped += 1
                    continue
                day = str(o.get("day") or "").strip()
                rng = parse_periods(o.get("periods"))
                slot = None
                if day and rng:
                    weeks = sorted({int(w) for w in (o.get("weeks") or []) if isinstance(w, int) or str(w).isdigit()})
                    slot = {"day": int(day), "start": rng[0], "end": rng[1], "weeks": weeks}
                offerings.append(
                    {
                        "_slot": slot,
                        "teacher": str(o.get("teachers") or "").strip(),
                        "room": str(o.get("room") or "").strip(),
                        "remark": remark,
                    }
                )
            if not offerings:
                continue
            offered.append(
                {
                    "code": str(c.get("code") or ""),
                    "name": str(c.get("name") or "").strip(),
                    "category": cat,
                    "typeLabel": label,
                    "module": norm_module(c.get("module")),
                    "capacity": c.get("capacity"),
                    "crossCapacity": c.get("cross_capacity"),
                    "offerings": offerings,
                }
            )
        for course in offered:
            n = len(course["offerings"])
            for i, off in enumerate(course["offerings"], start=1):
                seq += 1
                courses.append(
                    {
                        "id": f"C{seq:04d}",
                        "code": course["code"],
                        "name": course["name"],
                        "unit": unit,
                        "category": course["category"],
                        "typeLabel": course["typeLabel"],
                        "module": course["module"],
                        "teacher": off["teacher"],
                        "slots": [off["_slot"]] if off["_slot"] else [],
                        "room": off["room"],
                        "capacity": course["capacity"],
                        "crossCapacity": course["crossCapacity"],
                        "sectionLabel": f"班次 {i}/{n}" if n > 1 else "",
                        "remark": off["remark"],
                    }
                )
    meta = data.get("meta", {})
    payload = {
        "term": term_id,
        "label": meta.get("title", term_id),
        "source": meta.get("source_pdf", ""),
        "count": len(courses),
        "courses": courses,
    }
    out = os.path.join(OUT_DIR, out_name)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(out) / 1024 / 1024
    print(f"{out_name}: {len(courses)} 门（跳过停课 {skipped} 条开课记录）, {size:.2f} MB")
    return courses


def export_reviews(xlsx_name, term_id):
    from openpyxl import load_workbook

    path = os.path.join(BASE, xlsx_name)
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb["总表"]
    by_name = {}
    rows = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[1]:
            continue
        name = str(row[1]).strip().replace("\n", " ")
        if not name:
            continue
        entry = {
            "category": str(row[0] or "").strip(),
            "teacher": str(row[2] or "").strip(),
            "grading": str(row[3] or "").strip(),
            "attendance": str(row[4] or "").strip(),
            "score": str(row[5] or "").strip(),
            "review": re.sub(r"\s+", " ", str(row[6] or "")).strip(),
            "tasks": re.sub(r"\s+", " ", str(row[7] or "")).strip(),
            "exam": re.sub(r"\s+", " ", str(row[8] or "")).strip(),
            "unit": str(row[9] or "").strip(),
        }
        by_name.setdefault(name, []).append(entry)
        rows += 1
    wb.close()
    payload = {
        "term": term_id,
        "source": "枝上 26秋 选课攻略（学生填写，整理 644 条）",
        "count": rows,
        "byName": by_name,
    }
    out = os.path.join(OUT_DIR, "reviews.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"reviews.json: {rows} 条评价，覆盖 {len(by_name)} 门课程名，{os.path.getsize(out)/1024:.0f} KB")
    return by_name


if __name__ == "__main__":
    c1 = export_term("nankai_courses_2026秋.json", "2026-2027-1", "term-2026-2027-1.json")
    c2 = export_term("nankai_courses_2025春.json", "2024-2025-2", "term-2024-2025-2.json")
    rev = export_reviews("枝上-26秋-选课攻略-整理.xlsx", "2026-2027-1")
    names = {c["name"] for c in c1}
    hit = sum(1 for n in rev if n in names)
    print(f"\n评价覆盖校验：{hit}/{len(rev)} 个课程名能对上 2026 秋课程库")
    # 结构自检
    assert all(c["id"] for c in c1 + c2)
    assert all(c["category"] in ("通识必修课", "通识选修课", "大类基础课", "专业课程", "其他课程") for c in c1 + c2)
    assert all((not c["slots"]) or (1 <= c["slots"][0]["day"] <= 7 and c["slots"][0]["start"] <= c["slots"][0]["end"] <= 14) for c in c1 + c2)
    print("结构自检通过")
