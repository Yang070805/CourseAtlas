# -*- coding: utf-8 -*-
"""南开大学《选课手册》PDF 全量课程目录解析器。

基于 pypdfium2 双通道解析：
1. 表格矢量网格（type-2 path 对象）：全宽横线=行分隔线，竖线=列边界；
2. 字符级坐标（get_charbox）：按网格行/列切分单元格文本；
右侧教师/星期/节次/周次/教室/备注做分栏解析，支持教师姓名、周次、
教室的跨行折行合并与跨页行延续。

输入：选课手册 PDF；输出：JSON（结构化）+ CSV（一行一次开课）。
"""
import csv
import json
import re
import sys
from collections import defaultdict

import pypdfium2 as pdfium

Y_LINE_TOL = 4.5   # 同一视觉行基线容差（连字符基线略高）
Y_FOOTER = 30      # 页面底部页脚区（'-- 页码 --'），直接丢弃

# 无网格时的兜底列边界（由表头字符实测标定）
FALLBACK_COLS = [36, 85.8, 182.4, 232.1, 258.3, 284.5, 334.2, 351.0,
                 381.9, 412.8, 518.8, 559.1]


def load_chars(pdf_path: str) -> list[dict]:
    pdf = pdfium.PdfDocument(pdf_path)
    out = []
    for pidx in range(len(pdf)):
        tp = pdf[pidx].get_textpage()
        n = tp.count_chars()
        for i in range(n):
            c = tp.get_text_range(i, 1)
            l, b, r, t = tp.get_charbox(i)
            if c not in "\r\n" and b > Y_FOOTER:
                out.append({"page": pidx, "x": l, "y": b, "c": c})
    return out


def page_grid(pdf_path: str, pidx: int):
    """提取页面表格网格：返回 (row_seps_desc, col_boundaries, sub_lines_desc)。

    sub_lines 是行内的右侧块子分隔线（多开课条目的单元格边界，
    横线仅覆盖 x≈284-559），用于精确归属折行片段。"""
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[pidx]
    hs, vs = [], []
    for o in page.get_objects():
        if o.type != 2:
            continue
        x0, y0, x1, y1 = o.get_bounds()
        if x1 < x0 or y1 < y0:
            continue
        if y1 - y0 < 1.6 and x1 - x0 > 3:
            hs.append((x0, x1, (y0 + y1) / 2))
        elif x1 - x0 < 1.6 and y1 - y0 > 3:
            vs.append((x0, y0, y1))

    # 横向：按 y 分组，覆盖整表宽（x 35→560）的组为行分隔线，
    # 仅覆盖右侧块（x≥280，宽≥250）的组为子分隔线
    groups = defaultdict(list)
    for x0, x1, y in hs:
        placed = False
        for gy in groups:
            if abs(gy - y) <= 1.0:
                groups[gy].append((x0, x1))
                placed = True
                break
        if not placed:
            groups[y].append((x0, x1))
    seps = []
    sub_lines = []
    for gy, pieces in groups.items():
        cov = sorted(pieces)
        total = 0.0
        cur0 = cur1 = None
        for x0, x1 in cov:
            if cur1 is None or x0 > cur1 + 2:
                if cur1 is not None:
                    total += cur1 - cur0
                cur0, cur1 = x0, x1
            else:
                cur1 = max(cur1, x1)
        if cur1 is not None:
            total += cur1 - cur0
        min_x = min(x0 for x0, _ in cov)
        if total > 400:  # 整行分隔线（整表宽 ~523；个别页面缺边线 ~433）
            seps.append(gy)
        elif total >= 230 and min_x >= 280:  # 行内右侧块子分隔线（234~275）
            sub_lines.append(gy)
    seps.sort(reverse=True)
    sub_lines.sort(reverse=True)

    # 纵向：按 x 分组取中位
    vgroups = defaultdict(list)
    for x0, y0, y1 in vs:
        placed = False
        for gx in vgroups:
            if abs(gx - x0) <= 1.5:
                vgroups[gx].append(x0)
                placed = True
                break
        if not placed:
            vgroups[x0].append(x0)
    cols = sorted(sum(v) / len(v) for v in vgroups.values() if len(v) >= 3)
    cols = [c for c in cols if 30 < c < 565]

    if len(seps) < 3 or len(cols) < 6:
        return None, None, None
    return seps, cols, sub_lines


def cluster_lines(chars: list[dict], tol: float = Y_LINE_TOL) -> list[dict]:
    lines = []
    for ch in chars:
        placed = False
        for line in lines:
            if abs(line["y"] - ch["y"]) <= tol:
                line["chars"].append((ch["x"], ch["y"], ch["c"]))
                line["y"] = (line["y"] * (len(line["chars"]) - 1) + ch["y"]) / len(line["chars"])
                placed = True
                break
        if not placed:
            lines.append({"y": ch["y"], "chars": [(ch["x"], ch["y"], ch["c"])]})
    for line in lines:
        line["chars"].sort(key=lambda t: t[0])
    lines.sort(key=lambda L: -L["y"])
    return lines


def join_frag(prev: str, nxt: str) -> str:
    if not prev:
        return nxt
    if not nxt:
        return prev
    if re.search(r"[A-Za-z0-9]$", prev) and re.search(r"^[A-Za-z0-9]", nxt):
        return prev + " " + nxt
    return prev + nxt


def cell_text(chars, x0: float, x1: float) -> str:
    return "".join(c for x, c in chars if x0 <= x < x1).strip()


def parse_weeks(raw: str):
    """周次原文 → (规范文本, 周序号列表)。支持整体/分段 '单'、'双' 后缀。"""
    raw = raw.strip().replace(" ", "")
    if not raw:
        return raw, []
    overall_odd = overall_even = False
    m = re.search(r"([单双])$", raw)
    if m:
        overall_odd, overall_even = m.group(1) == "单", m.group(1) == "双"
        raw = raw[:-1]
    weeks = []
    out_parts = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        odd, even = overall_odd, overall_even
        mm = re.match(r"^(.+?)([单双])$", part)
        if mm:
            part = mm.group(1)
            odd = odd or mm.group(2) == "单"
            even = even or mm.group(2) == "双"
        if "-" in part:
            a, b = part.split("-", 1)
            try:
                a, b = int(a), int(b)
            except ValueError:
                continue
            vals = list(range(a, b + 1))
        else:
            try:
                vals = [int(part)]
            except ValueError:
                continue
        if odd:
            vals = [w for w in vals if w % 2 == 1]
        if even:
            vals = [w for w in vals if w % 2 == 0]
        weeks.extend(vals)
    weeks = sorted(set(w for w in weeks if 1 <= w <= 40))
    return raw, weeks


def parse_offerings(block_chars: list[tuple[float, str]], cols: list[float],
                    sub_ys: list[float] | None = None) -> list[dict]:
    """解析一行课程的右侧块（教师列及之后）：拆成若干开课条目。

    各列独立聚类（教师列额外按 x 回跳拆折行片段），再归属到日行：
    若行内有子网格分隔线（sub_ys，多开课条目的单元格边界），按所属
    子格带精确归属；否则按 y 最近。教师/周次/教室的折行片段按
    y 降序拼接，自然处理"单元格环绕日行"的排版。
    """
    x_teacher0, x_teacher1 = cols[5], cols[6]
    x_day1 = cols[7]
    x_per1 = cols[8]
    x_week1 = cols[9]
    x_room1 = cols[10]
    x_remark1 = cols[11] if len(cols) > 11 else cols[10] + 46

    shifted = []
    for x, y, c in block_chars:
        if c == "-" and x_per1 <= x < x_room1:
            y = y - 3.0
        shifted.append((x, y, c))

    def col_clusters(x0: float, x1: float, tol: float) -> list[dict]:
        return cluster_lines([{"x": x, "y": y, "c": c} for x, y, c in shifted
                              if x0 <= x < x1], tol=tol)

    # 日行：星期+节次列；相距 7pt 内的聚类合并（同一视觉行）
    sched = sorted(col_clusters(x_teacher1, x_per1, 3.0), key=lambda L: -L["y"])
    day_lines = []
    for L in sched:
        if day_lines and day_lines[-1]["y"] - L["y"] < 7:
            day_lines[-1]["chars"] += L["chars"]
            continue
        day_lines.append(L)
    day_lines.sort(key=lambda L: -L["y"])
    day_ys = [L["y"] for L in day_lines]
    if not day_lines:
        return []

    # 教师列：聚类后按 x 回跳拆折行片段
    teacher_frags = []
    for L in col_clusters(x_teacher0, x_teacher1, 4.5):
        chars = sorted(L["chars"], key=lambda t: t[0])
        frag = [chars[0]]
        for x, y, c in chars[1:]:
            if x < frag[-1][0] - 3:
                teacher_frags.append(frag)
                frag = [(x, y, c)]
            else:
                frag.append((x, y, c))
        teacher_frags.append(frag)

    weeks_lines = col_clusters(x_per1, x_week1, 3.0)
    room_lines = col_clusters(x_week1, x_remark1, 4.5)

    sub_ys = sub_ys or []

    def band_of(y: float) -> int | None:
        """y 落在哪条子分隔线之间（0=最上带）。无子线返回 None。"""
        if not sub_ys:
            return None
        for k, s in enumerate(sub_ys):
            if y > s:
                return k
        return len(sub_ys)

    day_bands = [band_of(y) for y in day_ys]

    def pick(y: float) -> int:
        b = band_of(y)
        if b is not None:
            for k, bk in enumerate(day_bands):
                if bk == b:
                    return k
        return min(range(len(day_ys)), key=lambda j: abs(day_ys[j] - y))

    def assign(clusters: list[dict]) -> dict[int, list[dict]]:
        out = defaultdict(list)
        for L in clusters:
            out[pick(L["y"])].append(L)
        return out

    t_assign = {k: [] for k in range(len(day_ys))}
    for frag in teacher_frags:
        y = sum(x[1] for x in frag) / len(frag)
        t_assign[pick(y)].append(frag)
    w_assign = assign(weeks_lines)
    r_assign = assign(room_lines)

    offerings = []
    for k, L in enumerate(day_lines):
        chars2 = [(x, c) for x, y, c in L["chars"]]
        day = cell_text(chars2, x_teacher1, x_day1)
        periods = cell_text(chars2, x_day1, x_per1)

        teacher = ""
        for frag in sorted(t_assign[k], key=lambda f: -f[0][1]):
            teacher = join_frag(teacher, "".join(c for _, _, c in frag))
        teacher = teacher.strip()

        weeks_raw = "".join(
            "".join(c for _, _, c in sorted(Lw["chars"], key=lambda t: t[0]))
            for Lw in sorted(w_assign[k], key=lambda Lw: -Lw["y"]))
        weeks_raw = weeks_raw.strip()

        room_parts = []
        remark_parts = []
        for Lr in sorted(r_assign[k], key=lambda Lr: -Lr["y"]):
            room_txt = cell_text([(x, c) for x, y, c in Lr["chars"]], x_week1, x_room1)
            remark_txt = cell_text([(x, c) for x, y, c in Lr["chars"]], x_room1, x_remark1)
            if room_txt:
                room_parts.append(room_txt)
            if remark_txt:
                remark_parts.append(remark_txt)
        room = "".join(room_parts).strip()
        remark = "".join(remark_parts).strip()
        m = re.match(r"^(.*?)([◎△◇※□]+|组\d+|停课)$", room)
        room, room_remark = (m.group(1), m.group(2)) if m else (room, "")

        weeks_raw, weeks_list = parse_weeks(weeks_raw)
        offerings.append({
            "teachers": teacher,
            "day": day,
            "periods": periods,
            "weeks_raw": weeks_raw,
            "weeks": weeks_list,
            "room": room,
            "remark": (room_remark + remark).strip(),
        })
    return offerings


def detect_section(lines: list[dict]) -> tuple[str, str] | None:
    title_line = None
    unit = None
    for line in lines:
        t = "".join(c for _, _, c in line["chars"]).strip()
        if "课程目录" in t:
            title_line = t
        m = re.match(r"^(?:联系单位|开课单位)[:：]\s*(.+)$", t)
        if m:
            unit = re.sub(r"\s*20\d{2}-20\d{2}第\d学期课程目录.*$", "", m.group(1)).strip()
    if title_line is None:
        return None
    if "通识选修课" in title_line:
        return unit or "", "通识选修课"
    return unit or "", "开课单位课程"




def make_flat_rows(section: dict, course: dict) -> list[dict]:
    """由课程对象生成扁平 CSV 行。"""
    rows = []
    for off in course["offerings"]:
        rows.append({
            "unit": section["unit"],
            "section_type": section["type"],
            "code": course["code"],
            "name": course["name"],
            "module": course["module"],
            "capacity": course["capacity"],
            "cross_capacity": course["cross_capacity"],
            "teacher": off["teachers"],
            "day": off["day"],
            "periods": off["periods"],
            "weeks": off["weeks_raw"],
            "weeks_list": ",".join(str(w) for w in off["weeks"]),
            "room": off["room"],
            "remark": off["remark"],
            "credits": "",
            "page": course["page"],
        })
    return rows


def parse_pdf(pdf_path: str) -> dict:
    chars = load_chars(pdf_path)
    pages = defaultdict(list)
    for ch in chars:
        pages[ch["page"]].append(ch)
    pdf = pdfium.PdfDocument(pdf_path)
    n_pages = len(pdf)

    # 小节标题（页面顶部视觉行）
    section_at_page = {}
    for pidx in sorted(pages):
        top_lines = cluster_lines([ch for ch in pages[pidx] if ch["y"] > 640])
        sec = detect_section(top_lines)
        if sec:
            section_at_page[pidx] = sec

    sections = []
    cur_section = None
    last_course_ctx = None  # (course, block, sub_ys, page_index)

    for pidx in range(n_pages):
        seps, cols, sub_lines = page_grid(pdf_path, pidx)
        if seps is None:
            continue
        # 个别页面网格缺少最外两条竖线（如 p52 信息与传播学院），
        # 但各页列位一致，统一使用实测标准列边界
        cols = FALLBACK_COLS

        # 行区域 = 相邻分隔线之间
        regions = [(seps[i], seps[i + 1]) for i in range(len(seps) - 1)]

        for idx, (y_hi, y_lo) in enumerate(regions):
            region_chars = [ch for ch in pages[pidx] if y_lo <= ch["y"] < y_hi]
            if not region_chars:
                continue
            code = "".join(c for x, c in sorted((ch["x"], ch["c"]) for ch in region_chars)
                           if x < cols[1]).strip()
            is_anchor = bool(re.fullmatch(r"\d{4}", code))

            if not is_anchor:
                # 无锚点纯右侧区域：上一门课行的跨页延续。
                # 延续字符 y 减去 1000×页差，保证拼接后仍排在原页字符之后；
                # 其子分隔线同样平移。
                right = [(ch["x"], ch["y"], ch["c"]) for ch in region_chars
                         if ch["x"] >= cols[5] - 1]
                pure_right = right and not any(ch["x"] < cols[5] - 1
                                               for ch in region_chars)
                if pure_right and last_course_ctx is not None:
                    course, block0, sub0, cpage = last_course_ctx
                    shift = 1000.0 * (cpage - pidx)
                    ext = [(x, y + shift, c) for x, y, c in right]
                    subs_ext = [s + shift for s in (sub_lines or [])
                                if y_lo < s < y_hi]
                    if subs_ext:
                        # 顶部带只有周次/教室碎片（无教师、无日程）时，
                        # 是 PDF 在分页处的重复绘制，丢弃以免污染下一门课
                        top_sub = max(subs_ext)
                        above = [t for t in ext if t[1] > top_sub]
                        if not any(t[0] < cols[8] for t in above):
                            ext = [t for t in ext if t[1] <= top_sub]
                    # 页边界哨兵：隔离原页与延续页的坐标空间，
                    # 避免延续页首条开课被并入原页最后一条
                    sentinel = shift + 1000.0
                    sub_combined = sub0 + [sentinel] + subs_ext
                    offerings = parse_offerings(block0 + ext, cols,
                                                sub_combined)
                    course["offerings"] = offerings
                    course["_flat"] = make_flat_rows(cur_section, course)
                    last_course_ctx = (course, block0 + ext, sub_combined, cpage)
                continue

            rc = [(ch["x"], ch["c"]) for ch in region_chars]
            name = cell_text(rc, cols[1], cols[2])
            module = cell_text(rc, cols[2], cols[3])
            cap_text = cell_text(rc, cols[3], cols[4])
            cross_text = cell_text(rc, cols[4], cols[5])
            capacity = int(re.findall(r"\d+", cap_text)[0]) if re.search(r"\d", cap_text) else None
            cross = int(re.findall(r"\d+", cross_text)[0]) if re.search(r"\d", cross_text) else None

            if pidx in section_at_page:
                unit, stype = section_at_page[pidx]
                if cur_section is None or cur_section["unit"] != unit:
                    cur_section = {"unit": unit, "type": stype,
                                   "start_page": pidx + 1, "courses": []}
                    sections.append(cur_section)
            if cur_section is None:
                cur_section = {"unit": "", "type": "", "start_page": pidx + 1, "courses": []}
                sections.append(cur_section)

            block = [(ch["x"], ch["y"], ch["c"]) for ch in region_chars
                     if ch["x"] >= cols[5] - 1]
            sub_ys = [s for s in (sub_lines or []) if y_lo < s < y_hi]
            offerings = parse_offerings(block, cols, sub_ys)

            course = {
                "code": code,
                "name": name,
                "module": module,
                "capacity": capacity,
                "cross_capacity": cross,
                "credits": None,
                "credit_note": "选课手册未含学分，待从培养方案补充",
                "page": pidx + 1,
                "offerings": offerings,
            }
            cur_section["courses"].append(course)
            course["_flat"] = make_flat_rows(cur_section, course)
            last_course_ctx = (course, block, sub_ys, pidx)

    flat = []
    for s_ in sections:
        for c_ in s_["courses"]:
            flat.extend(c_.pop("_flat", []))
    return {"sections": sections, "flat": flat}


def main():
    pdf_path = sys.argv[1]
    out_json = sys.argv[2]
    out_csv = sys.argv[3]
    # 可选元数据覆盖：title semester source_page source_pdf
    title = sys.argv[4] if len(sys.argv) > 4 else "2026-2027学年第一学期选课手册"
    semester = sys.argv[5] if len(sys.argv) > 5 else "2026-2027-1"
    src_page = (sys.argv[6] if len(sys.argv) > 6 else
                "https://jwc.nankai.edu.cn/2026/0817/c35933a601256/page.htm")
    src_pdf = (sys.argv[7] if len(sys.argv) > 7 else
               "https://jwc.nankai.edu.cn/_upload/article/files/cc/83/7b0b7e00413a9b68d08b7ad4e569/304931be-8c23-445c-8e06-f51a0bf2a696.pdf")
    data = parse_pdf(pdf_path)

    meta = {
        "school": "南开大学",
        "title": title,
        "source_page": src_page,
        "source_pdf": src_pdf,
        "semester": semester,
        "note": "教务部公开选课手册；学分手册未提供（留空待补）；教师/时间/教室为真实排课信息",
    }
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "sections": data["sections"]}, f, ensure_ascii=False, indent=2)

    fields = ["unit", "section_type", "code", "name", "module", "capacity",
              "cross_capacity", "teacher", "day", "periods", "weeks",
              "weeks_list", "room", "remark", "credits", "page"]
    with open(out_csv, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(data["flat"])

    n_sections = len(data["sections"])
    n_courses = sum(len(s["courses"]) for s in data["sections"])
    n_off = len(data["flat"])
    print(f"sections={n_sections} courses={n_courses} offerings={n_off}")
    for s in data["sections"]:
        print(f"  p{s['start_page']:>3}  [{s['type']}] {s['unit']}: {len(s['courses'])} 门")
    print("empty name/code:", sum(1 for r in data["flat"] if not r["name"] or not r["code"]))
    print("empty teacher:", sum(1 for r in data["flat"] if not r["teacher"]))
    print("empty day:", sum(1 for r in data["flat"] if not r["day"]))
    print("empty room:", sum(1 for r in data["flat"] if not r["room"]))


if __name__ == "__main__":
    main()
