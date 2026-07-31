"""
長號 (Trombone) 把位示意圖產生器
------------------------------------
重繪：橘色長號側面剪影（喇叭口 + 滑管）+ 下方 7 個把位刻度 (1st ~ 7th)

執行方式：
    python3 generate_trombone.py

會在同目錄產生 trombone.svg
"""

# ----------------------- 可調整參數 -----------------------

BODY_COLOR = "#F5A430"        # 長號本體顏色（橘色）
MOUTHPIECE_COLOR = "#B3B3B3"  # 吹嘴顏色（灰色）
TICK_COLOR = "#1A1A1A"        # 把位刻度線顏色
LABEL_COLOR = "#1A1A1A"       # 把位文字顏色

N_POSITIONS = 7                # 把位數量
LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]

CANVAS_W = 1340
CANVAS_H = 560

# 滑管（下方雙線長管）幾何
SLIDE_Y_TOP = 368      # 滑管上緣 y
SLIDE_Y_BOT = 408      # 滑管下緣 y
SLIDE_X_START = 115    # 滑管左端 x（與豎管交接處）
SLIDE_X_END = 1300     # 滑管右端 x（不含末端圓點）
SLIDE_INNER_GAP = 10   # 內外管線之間的間距（雙線效果）

# 把位刻度幾何（畫在滑管下方）
TICK_X_START = 270     # 第一個把位刻度 x
TICK_X_END = 1230      # 最後一個把位刻度 x
TICK_Y_TOP = 425        # 刻度線頂端 y（緊接滑管下緣）
TICK_Y_BOT = 505         # 刻度線底端 y
TICK_WIDTH = 8             # 刻度線寬度
LABEL_Y = 535               # 文字 y 座標
LABEL_FONT_SIZE = 34         # 文字字級


# ----------------------- 繪圖函式 -----------------------

def draw_mouthpiece():
    """吹嘴：左側灰色梯形（漏斗狀）。"""
    x0, y0 = 20, 355
    x1, y1 = 120, 375
    path = (
        f"M {x0},{y0} "
        f"L {x1-20},{y1-20} "
        f"L {x1},{y1} "
        f"L {x1},{y1+40} "
        f"L {x1-20},{y1+60} "
        f"L {x0},{y0+80} "
        f"Z"
    )
    return f'  <path d="{path}" fill="{MOUTHPIECE_COLOR}"/>\n'


def draw_upper_tube_and_bell():
    """上方喇叭口（bell）+ 連接的短水平管，全部以直線構成（不使用弧線）。"""
    # 由左側水平細管，以直線往右上展開成喇叭形頂點，
    # 再以直線收回到底部尖點，最後直線收回水平管，形成平面（無弧度）的旗形喇叭剪影。
    path = (
        "M 0,150 "        # 左端（水平管上緣）起點
        "L 195,150 "      # 水平管上緣往右
        "L 598,18 "       # 直線展開至喇叭頂點
        "L 585,325 "      # 直線收回至喇叭底部尖點
        "L 210,192 "      # 直線收回水平管下緣
        "L 0,192 "        # 回到水平管下緣左端
        "Z"
    )
    return f'  <path d="{path}" fill="{BODY_COLOR}"/>\n'


def draw_vertical_crook():
    """左側連接豎管（U 型轉折的一部分）+ 螺絲圓點。"""
    x0, y0, w, h = 90, 150, 45, 230
    rect = f'  <rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="{BODY_COLOR}"/>\n'
    circle = f'  <circle cx="{x0+w/2}" cy="{y0+h-15}" r="8" fill="{BODY_COLOR}" stroke="#c8811f" stroke-width="2"/>\n'
    return rect + circle


def draw_slide():
    """下方滑管：外管（實心橘色）+ 內管（白色細縫，營造雙線效果）+ 右端圓點。"""
    x0, x1 = SLIDE_X_START, SLIDE_X_END
    y_top, y_bot = SLIDE_Y_TOP, SLIDE_Y_BOT
    h = y_bot - y_top

    # 外管主體（圓角右端）
    outer = (
        f'  <path d="M {x0},{y_top} L {x1},{y_top} '
        f'A {h/2},{h/2} 0 0 1 {x1},{y_bot} L {x0},{y_bot} Z" '
        f'fill="{BODY_COLOR}"/>\n'
    )

    # 內管白色細縫（雙線效果），留出左側一小段實心（滑管固定段）
    gap = SLIDE_INNER_GAP
    inner_y_top = y_top + gap
    inner_y_bot = y_bot - gap
    inner_x0 = x0 + 140  # 左側留一段不挖空，模擬滑管固定段
    inner = (
        f'  <rect x="{inner_x0}" y="{inner_y_top}" '
        f'width="{x1 - inner_x0 - 10}" height="{inner_y_bot - inner_y_top}" '
        f'fill="#FFFFFF" opacity="0.55"/>\n'
    )

    # 右端末端小圓點（滑管尖端）
    tip = f'  <circle cx="{x1 + h/2}" cy="{(y_top+y_bot)/2}" r="4" fill="#1A1A1A"/>\n'

    # 滑管左側與豎管交接處的兩條細直紋（裝飾，呼應原圖的短刻痕）
    deco = (
        f'  <line x1="{x0+55}" y1="{y_top}" x2="{x0+55}" y2="{y_bot}" '
        f'stroke="{BODY_COLOR}" stroke-width="4"/>\n'
        f'  <line x1="{x0+90}" y1="{y_top}" x2="{x0+90}" y2="{y_bot}" '
        f'stroke="#c8811f" stroke-width="3"/>\n'
    )

    return outer + inner + tip + deco


def draw_positions():
    """下方 7 個把位刻度線 + 文字標籤（等間距）。"""
    svg = ""
    if N_POSITIONS <= 1:
        step = 0
    else:
        step = (TICK_X_END - TICK_X_START) / (N_POSITIONS - 1)

    for i in range(N_POSITIONS):
        x = TICK_X_START + step * i
        svg += (
            f'  <line x1="{x}" y1="{TICK_Y_TOP}" x2="{x}" y2="{TICK_Y_BOT}" '
            f'stroke="{TICK_COLOR}" stroke-width="{TICK_WIDTH}" stroke-linecap="round"/>\n'
        )
        label = LABELS[i] if i < len(LABELS) else f"{i+1}th"
        svg += (
            f'  <text x="{x}" y="{LABEL_Y}" font-family="Arial, \'Noto Sans TC\', sans-serif" '
            f'font-size="{LABEL_FONT_SIZE}" fill="{LABEL_COLOR}" '
            f'text-anchor="middle">{label}</text>\n'
        )
    return svg


def build_svg():
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" '
        f'width="{CANVAS_W}" height="{CANVAS_H}">'
    ]
    parts.append(draw_upper_tube_and_bell())
    parts.append(draw_vertical_crook())
    parts.append(draw_slide())
    parts.append(draw_mouthpiece())
    parts.append(draw_positions())
    parts.append("</svg>")
    return "\n".join(parts)


if __name__ == "__main__":
    svg_content = build_svg()
    out_path = "trombone.svg"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"已產生 {out_path}")
