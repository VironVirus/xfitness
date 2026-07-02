import json
import math
import os
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


def parse_args(argv):
    parsed = {}
    index = 0
    while index < len(argv):
        token = argv[index]
        if not token.startswith("--"):
            index += 1
            continue
        key = token[2:]
        if index + 1 >= len(argv) or argv[index + 1].startswith("--"):
            parsed[key] = True
            index += 1
            continue
        parsed[key] = argv[index + 1]
        index += 2
    return parsed


ARGS = parse_args(sys.argv[1:])
SCRIPT_DIR = Path(__file__).resolve().parent
CONTENT_PATH = Path(ARGS.get("content", SCRIPT_DIR / "xfitness-guide-content.json")).resolve()
OUTPUT_PATH = Path(ARGS.get("out", Path.cwd() / "output" / "pdf" / "xfitness-webapp-guide-mobile.pdf")).resolve()

SCALE = 0.5
PAGE_W = 1080 * SCALE
PAGE_H = 1920 * SCALE

COLORS = {
    "background": HexColor("#090b0f"),
    "surface": HexColor("#131821"),
    "surface_alt": HexColor("#171d26"),
    "border": HexColor("#2b313d"),
    "text": HexColor("#f8f4ea"),
    "muted": HexColor("#c6c0b5"),
    "accent": HexColor("#ff6b2c"),
    "highlight": HexColor("#c0ff4f"),
    "soft": HexColor("#f1e8d3"),
    "dark_text": HexColor("#140a06"),
}

TYPE = {
    "title": 41,
    "title_compact": 36,
    "body": 15.5,
    "body_small": 12,
    "card_title": 14,
    "card_body": 10.5,
    "eyebrow": 9,
    "footer": 8.5,
}


def scale(value):
    return value * SCALE


def rect_y(top, height):
    return PAGE_H - top - height


def make_style(name, font="Helvetica", font_size=TYPE["body"], color=COLORS["text"], leading=None, alignment=0):
    return ParagraphStyle(
        name=name,
        fontName=font,
        fontSize=font_size,
        textColor=color,
        leading=leading or (font_size * 1.18),
        alignment=alignment,
        spaceAfter=0,
        spaceBefore=0,
    )


STYLES = {
    "eyebrow": make_style("eyebrow", "Helvetica-Bold", TYPE["eyebrow"], COLORS["highlight"], TYPE["eyebrow"] * 1.2),
    "header_title": make_style("header_title", "Helvetica-Bold", 14, COLORS["text"], 16),
    "header_sub": make_style("header_sub", "Helvetica", 9, COLORS["muted"], 10),
    "title": make_style("title", "Helvetica-Bold", TYPE["title"], COLORS["text"], TYPE["title"] * 0.94),
    "title_compact": make_style("title_compact", "Helvetica-Bold", TYPE["title_compact"], COLORS["text"], TYPE["title_compact"] * 0.96),
    "body": make_style("body", "Helvetica", TYPE["body"], COLORS["muted"], TYPE["body"] * 1.24),
    "route": make_style("route", "Helvetica-Bold", 9, COLORS["dark_text"], 10, alignment=1),
    "card_title": make_style("card_title", "Helvetica-Bold", TYPE["card_title"], COLORS["text"], 16),
    "card_body": make_style("card_body", "Helvetica", TYPE["card_body"], COLORS["muted"], 12),
    "callout_label": make_style("callout_label", "Helvetica-Bold", 8, COLORS["highlight"], 10),
    "callout_value": make_style("callout_value", "Helvetica-Bold", 14, COLORS["text"], 16),
    "callout_body": make_style("callout_body", "Helvetica", 10, COLORS["muted"], 11.8),
    "bullet_heading": make_style("bullet_heading", "Helvetica-Bold", 13, COLORS["text"], 15),
    "bullet": make_style("bullet", "Helvetica", 10.5, COLORS["muted"], 12.4),
    "footer": make_style("footer", "Helvetica", TYPE["footer"], COLORS["muted"], 10, alignment=1),
}


def get_title_style(title):
    length = len(title)
    if length > 84:
        return make_style("title_long", "Helvetica-Bold", 29, COLORS["text"], 29.5)
    if length > 64:
        return make_style("title_medium", "Helvetica-Bold", 31, COLORS["text"], 31.5)
    if length > 48:
        return make_style("title_balanced", "Helvetica-Bold", 34, COLORS["text"], 34.5)
    return make_style("title_short", "Helvetica-Bold", 38, COLORS["text"], 38.5)


def load_image(project_root, relative_path):
    return ImageReader(str((Path(project_root) / relative_path).resolve()))


def draw_round_box(pdf, left, top, width, height, fill_color, stroke_color, radius=18, stroke_width=1):
    pdf.saveState()
    pdf.setFillColor(fill_color)
    pdf.setStrokeColor(stroke_color)
    pdf.setLineWidth(stroke_width)
    pdf.roundRect(left, rect_y(top, height), width, height, radius, stroke=1, fill=1)
    pdf.restoreState()


def draw_text(pdf, text, left, top, width, style):
    paragraph = Paragraph(escape(text), style)
    wrapped_width, wrapped_height = paragraph.wrap(width, PAGE_H)
    paragraph.drawOn(pdf, left, PAGE_H - top - wrapped_height)
    return wrapped_height


def draw_bullet_lines(pdf, items, left, top, width, style, bullet_indent=10, gap=8):
    cursor = top
    for item in items:
        paragraph = Paragraph(f"&bull; {escape(item)}", style)
        _, height = paragraph.wrap(width, PAGE_H)
        paragraph.drawOn(pdf, left, PAGE_H - cursor - height)
        cursor += height + gap
    return cursor - top


def draw_image_cover(pdf, image, left, top, width, height, radius=18):
    img_width, img_height = image.getSize()
    frame_ratio = width / height
    image_ratio = img_width / img_height

    if image_ratio > frame_ratio:
        draw_height = height
        draw_width = height * image_ratio
        draw_x = left - ((draw_width - width) / 2)
        draw_y = rect_y(top, height)
    else:
        draw_width = width
        draw_height = width / image_ratio
        draw_x = left
        draw_y = rect_y(top, height) - ((draw_height - height) / 2)

    clip = pdf.beginPath()
    clip.roundRect(left, rect_y(top, height), width, height, radius)
    pdf.saveState()
    pdf.clipPath(clip, stroke=0, fill=0)
    pdf.drawImage(image, draw_x, draw_y, draw_width, draw_height, mask="auto")
    pdf.restoreState()
    pdf.saveState()
    pdf.setStrokeColor(COLORS["border"])
    pdf.setLineWidth(1)
    pdf.roundRect(left, rect_y(top, height), width, height, radius, stroke=1, fill=0)
    pdf.restoreState()


def draw_pill(pdf, left, top, width, height, label, fill_color, stroke_color, text_color, font_size=9):
    radius = height / 2
    draw_round_box(pdf, left, top, width, height, fill_color, stroke_color, radius=radius, stroke_width=1)
    style = make_style("pill", "Helvetica-Bold", font_size, text_color, font_size + 1, alignment=1)
    draw_text(pdf, label, left + 10, top + (height - font_size - 8) / 2, width - 20, style)


def add_header(pdf, title_text):
    draw_round_box(pdf, scale(72), scale(34), scale(936), scale(88), COLORS["surface"], COLORS["border"], radius=scale(44))
    draw_round_box(pdf, scale(92), scale(48), scale(56), scale(56), COLORS["accent"], COLORS["accent"], radius=scale(28), stroke_width=0)
    style_logo = make_style("logo", "Helvetica-Bold", 10, COLORS["dark_text"], 10, alignment=1)
    draw_text(pdf, "XF", scale(104), scale(60), scale(32), style_logo)
    draw_text(pdf, "Xfitness Guide", scale(164), scale(51), scale(220), STYLES["header_title"])
    draw_text(pdf, title_text, scale(164), scale(79), scale(250), STYLES["header_sub"])
    draw_round_box(pdf, scale(922), scale(48), scale(56), scale(56), COLORS["surface_alt"], COLORS["border"], radius=scale(28))

    pdf.saveState()
    pdf.setFillColor(COLORS["text"])
    for offset in (scale(63), scale(76), scale(89)):
        pdf.roundRect(scale(938), rect_y(offset, scale(4)), scale(24), scale(4), scale(2), stroke=0, fill=1)
    pdf.restoreState()


def add_footer(pdf, nav_sections, current_nav, page_index, page_count, destinations):
    draw_round_box(pdf, scale(72), scale(1780), scale(936), scale(92), COLORS["surface"], COLORS["border"], radius=scale(46))
    chip_width = scale(136)
    gap = scale(8)
    start_x = scale(80)
    top = scale(1802)
    height = scale(48)

    for index, section in enumerate(nav_sections):
        x = start_x + index * (chip_width + gap)
        active = section["id"] == current_nav
        draw_pill(
            pdf,
            x,
            top,
            chip_width,
            height,
            section["label"],
            COLORS["accent"] if active else COLORS["surface_alt"],
            COLORS["accent"] if active else COLORS["border"],
            COLORS["dark_text"] if active else COLORS["soft"],
            font_size=8,
        )
        if section["id"] in destinations:
            pdf.linkRect(
                "",
                destinations[section["id"]],
                (x, rect_y(top, height), x + chip_width, rect_y(top, height) + height),
                relative=0,
                thickness=0,
            )

    page_label = f"{page_index + 1:02d} / {page_count:02d}"
    draw_text(pdf, page_label, scale(944), scale(1833), scale(50), STYLES["footer"])


def add_title_block(pdf, page):
    title_style = get_title_style(page["title"])
    draw_text(pdf, page["eyebrow"].upper(), scale(72), scale(158), scale(936), STYLES["eyebrow"])
    title_height = draw_text(pdf, page["title"], scale(72), scale(208), scale(936), title_style)
    body_top = scale(208) + title_height + scale(18)
    body_height = draw_text(pdf, page["body"], scale(72), body_top, scale(936), STYLES["body"])
    return body_top + body_height


def add_bullet_panel(pdf, heading, items, left, top, width, height):
    draw_round_box(pdf, left, top, width, height, COLORS["surface"], COLORS["border"], radius=scale(36))
    draw_text(pdf, heading, left + scale(24), top + scale(24), width - scale(48), STYLES["bullet_heading"])
    draw_bullet_lines(pdf, items, left + scale(24), top + scale(72), width - scale(48), STYLES["bullet"])


def add_callouts(pdf, cards, left, top, width):
    card_height = scale(152)
    gap = scale(18)
    for index, card in enumerate(cards):
        y = top + index * (card_height + gap)
        draw_round_box(pdf, left, y, width, card_height, COLORS["surface_alt"], COLORS["border"], radius=scale(36))
        draw_text(pdf, card["label"].upper(), left + scale(22), y + scale(18), width - scale(44), STYLES["callout_label"])
        draw_text(pdf, card["value"], left + scale(22), y + scale(42), width - scale(44), STYLES["callout_value"])
        draw_text(pdf, card["body"], left + scale(22), y + scale(92), width - scale(44), STYLES["callout_body"])


def add_route_bar(pdf, route):
    draw_pill(
        pdf,
        scale(72),
        scale(988),
        scale(500),
        scale(54),
        f"Where to find it: {route}",
        COLORS["accent"],
        COLORS["accent"],
        COLORS["dark_text"],
        font_size=9,
    )


def render_cover(pdf, page, content):
    image = load_image(content["meta"]["projectRoot"], page["image"])
    draw_image_cover(pdf, image, scale(72), scale(164), scale(936), scale(860), radius=scale(36))
    draw_text(pdf, page["eyebrow"].upper(), scale(72), scale(1064), scale(936), STYLES["eyebrow"])
    draw_text(pdf, page["title"], scale(72), scale(1110), scale(936), make_style("cover_title", "Helvetica-Bold", 43, COLORS["text"], 41))
    draw_text(pdf, page["body"], scale(72), scale(1370), scale(936), STYLES["body"])

    chip_x = scale(72)
    chip_y = scale(1506)
    for index, chip in enumerate(page["chips"]):
        width = scale(max(176, 40 + len(chip) * 11))
        if chip_x + width > scale(1008):
            chip_x = scale(72)
            chip_y += scale(62)
        draw_pill(
            pdf,
            chip_x,
            chip_y,
            width,
            scale(50),
            chip,
            COLORS["accent"] if index == 0 else COLORS["surface_alt"],
            COLORS["accent"] if index == 0 else COLORS["border"],
            COLORS["dark_text"] if index == 0 else COLORS["soft"],
            font_size=9,
        )
        chip_x += width + scale(14)


def render_overview(pdf, page):
    content_start = add_title_block(pdf, page)
    column_width = scale(456)
    card_height = scale(214)
    gap_x = scale(24)
    gap_y = scale(24)
    start_y = max(scale(550), content_start + scale(16))

    for index, card in enumerate(page["cards"]):
        column = index % 2
        row = index // 2
        left = scale(72) + column * (column_width + gap_x)
        top = start_y + row * (card_height + gap_y)
        draw_round_box(pdf, left, top, column_width, card_height, COLORS["surface"], COLORS["border"], radius=scale(36))
        draw_text(pdf, card["title"], left + scale(24), top + scale(22), column_width - scale(48), STYLES["card_title"])
        draw_pill(pdf, left + scale(24), top + scale(68), column_width - scale(48), scale(40), card["route"], COLORS["surface_alt"], COLORS["border"], COLORS["soft"], font_size=8)
        draw_text(pdf, card["body"], left + scale(24), top + scale(122), column_width - scale(48), STYLES["card_body"])


def render_journey(pdf, page, content):
    content_start = add_title_block(pdf, page)
    image = load_image(content["meta"]["projectRoot"], page["image"])
    image_top = max(scale(550), content_start + scale(18))
    draw_image_cover(pdf, image, scale(72), image_top, scale(936), scale(336), radius=scale(36))

    card_width = scale(456)
    card_height = scale(158)
    gap_x = scale(24)
    gap_y = scale(22)
    start_y = image_top + scale(376)

    for index, step in enumerate(page["steps"]):
        column = index % 2
        row = index // 2
        left = scale(72) + column * (card_width + gap_x)
        top = start_y + row * (card_height + gap_y)
        draw_round_box(pdf, left, top, card_width, card_height, COLORS["surface"], COLORS["border"], radius=scale(36))
        draw_round_box(pdf, left + scale(20), top + scale(22), scale(52), scale(52), COLORS["accent"], COLORS["accent"], radius=scale(26), stroke_width=0)
        number_style = make_style("num", "Helvetica-Bold", 11, COLORS["dark_text"], 12, alignment=1)
        draw_text(pdf, str(index + 1), left + scale(30), top + scale(35), scale(32), number_style)
        draw_text(pdf, step, left + scale(88), top + scale(26), card_width - scale(110), make_style("step", "Helvetica", 12, COLORS["text"], 13.5))


def render_feature(pdf, page, content):
    content_start = add_title_block(pdf, page)
    image = load_image(content["meta"]["projectRoot"], page["image"])
    image_top = max(scale(548), content_start + scale(20))
    draw_image_cover(pdf, image, scale(72), image_top, scale(936), scale(430), radius=scale(36))
    draw_pill(pdf, scale(72), image_top + scale(456), scale(500), scale(54), f"Where to find it: {page['route']}", COLORS["accent"], COLORS["accent"], COLORS["dark_text"], font_size=9)
    panels_top = image_top + scale(542)
    add_bullet_panel(pdf, "What this area does", page["bullets"], scale(72), panels_top, scale(506), scale(620))
    add_callouts(pdf, page["callouts"], scale(602), panels_top, scale(406))


def render_diagram(pdf, page, content):
    content_start = add_title_block(pdf, page)
    image = load_image(content["meta"]["projectRoot"], page["image"])
    top = max(scale(548), content_start + scale(18))
    draw_image_cover(pdf, image, scale(604), top, scale(404), scale(268), radius=scale(36))

    node_x = scale(72)
    node_y = top
    node_width = scale(486)
    node_height = scale(152)
    node_gap = scale(18)

    for index, node in enumerate(page["nodes"]):
        top = node_y + index * (node_height + node_gap)
        draw_round_box(pdf, node_x, top, node_width, node_height, COLORS["surface"], COLORS["border"], radius=scale(36))
        draw_pill(pdf, node_x + scale(20), top + scale(18), scale(66), scale(36), f"0{index + 1}", COLORS["accent"], COLORS["accent"], COLORS["dark_text"], font_size=8)
        draw_text(pdf, node["title"], node_x + scale(20), top + scale(60), node_width - scale(40), make_style("node_title", "Helvetica-Bold", 13, COLORS["text"], 14))
        draw_text(pdf, node["body"], node_x + scale(20), top + scale(92), node_width - scale(40), make_style("node_body", "Helvetica", 10, COLORS["muted"], 11.5))

    add_bullet_panel(pdf, "What keeps the app connected", page["bullets"], scale(604), top + scale(290), scale(404), scale(678))


def render_checklist(pdf, page, content):
    content_start = add_title_block(pdf, page)
    image = load_image(content["meta"]["projectRoot"], page["image"])
    image_top = max(scale(548), content_start + scale(16))
    draw_image_cover(pdf, image, scale(72), image_top, scale(936), scale(250), radius=scale(36))
    panel_top = image_top + scale(282)
    add_bullet_panel(pdf, "Member rhythm", page["memberTasks"], scale(72), panel_top, scale(456), scale(664))
    add_bullet_panel(pdf, "Owner rhythm", page["ownerTasks"], scale(552), panel_top, scale(456), scale(664))
    add_bullet_panel(pdf, "Support notes", page["supportNotes"], scale(72), panel_top + scale(686), scale(936), scale(214))


def render_page(pdf, page, content):
    if page["layout"] == "cover":
        render_cover(pdf, page, content)
        return
    if page["layout"] == "overview":
        render_overview(pdf, page)
        return
    if page["layout"] == "journey":
        render_journey(pdf, page, content)
        return
    if page["layout"] == "diagram":
        render_diagram(pdf, page, content)
        return
    if page["layout"] == "checklist":
        render_checklist(pdf, page, content)
        return
    render_feature(pdf, page, content)


def main():
    with open(CONTENT_PATH, "r", encoding="utf-8") as handle:
        content = json.load(handle)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    destinations = {}
    for page in content["pages"]:
        if page["nav"] not in destinations:
            destinations[page["nav"]] = page["id"]

    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=(PAGE_W, PAGE_H))
    pdf.setTitle(content["meta"]["title"])
    pdf.setAuthor("OpenAI Codex")
    pdf.setSubject(content["meta"]["subtitle"])

    page_count = len(content["pages"])

    for index, page in enumerate(content["pages"]):
        pdf.setFillColor(COLORS["background"])
        pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        pdf.bookmarkPage(page["id"])
        if index == 0 or content["pages"][index - 1]["nav"] != page["nav"]:
            pdf.addOutlineEntry(page["eyebrow"], page["id"], 0, closed=False)
        else:
            pdf.addOutlineEntry(page["title"], page["id"], 1, closed=False)

        add_header(pdf, page["eyebrow"])
        add_footer(pdf, content["navSections"], page["nav"], index, page_count, destinations)
        render_page(pdf, page, content)
        pdf.showPage()

    pdf.save()


if __name__ == "__main__":
    main()
