# -*- coding: utf-8 -*-
"""课程类型标注：手册确定部分 + 开课单位性质推断部分。

类型取值与来源：
- 通识选修课              ：手册分节确定（并已有六模块细分 module 字段）
- 通识必修·大学英语/思想政治/体育/军事理论/心理健康 ：开课单位性质推断
- 大类基础·数学/计算机    ：开课单位性质推断（注意：对相应专业本身可能是专业课）
- 专业课程·必修选修待定   ：学院开课单位，公开渠道无法区分必修/选修
- 国际学生课程            ：国际教育学院
- 创新创业课程·性质待定   ：创新创业学院

用法：annotate_types.py <csv_in> <json_in> <csv_out> <json_out>
"""
import csv
import json
import sys

# 开课单位 → (course_type, type_source)
UNIT_TYPES = {
    "公共外语教学部": ("通识必修·大学英语", "开课单位推断"),
    "公共英语教学部": ("通识必修·大学英语", "开课单位推断"),
    "马克思主义基础理论教学部": ("通识必修·思想政治", "开课单位推断"),
    "体育部": ("通识必修·体育", "开课单位推断"),
    "军事教研室": ("通识必修·军事理论", "开课单位推断"),
    "心理健康教育中心": ("通识必修·心理健康", "开课单位推断"),
    "高等数学教学部": ("大类基础·数学", "开课单位推断"),
    "公共计算机基础教学部": ("大类基础·计算机", "开课单位推断"),
    "国际教育学院": ("国际学生课程", "开课单位推断"),
    "创新创业学院": ("创新创业课程·性质待定", "开课单位推断"),
}
DEFAULT_TYPE = ("专业课程·必修选修待定", "开课单位推断")


def annotate_csv(csv_in: str, csv_out: str) -> None:
    with open(csv_in, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        if r["section_type"] == "通识选修课":
            r["course_type"] = "通识选修课"
            r["type_source"] = "手册分节确定"
        else:
            t, s = UNIT_TYPES.get(r["unit"], DEFAULT_TYPE)
            r["course_type"] = t
            r["type_source"] = s
    fields = ["unit", "section_type", "code", "name", "module",
              "course_type", "type_source", "capacity", "cross_capacity",
              "teacher", "day", "periods", "weeks", "weeks_list",
              "room", "remark", "credits", "page"]
    with open(csv_out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def annotate_json(json_in: str, json_out: str) -> None:
    with open(json_in, encoding="utf-8") as f:
        data = json.load(f)
    for section in data["sections"]:
        if section["type"] == "通识选修课":
            t, s = "通识选修课", "手册分节确定"
        else:
            t, s = UNIT_TYPES.get(section["unit"], DEFAULT_TYPE)
        for course in section["courses"]:
            course["course_type"] = t
            course["type_source"] = s
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    csv_in, json_in, csv_out, json_out = sys.argv[1:5]
    annotate_csv(csv_in, csv_out)
    annotate_json(json_in, json_out)
    # 统计
    rows = list(csv.DictReader(open(csv_out, encoding="utf-8-sig")))
    import collections
    cnt = collections.Counter(r["course_type"] for r in rows)
    print("total rows:", len(rows))
    for t, n in cnt.most_common():
        print(f"  {t}: {n}")


if __name__ == "__main__":
    main()
