"""
法國號活塞圖示產生器（純活塞版本）
------------------------------------
只畫 3 個活塞（梯形外框），不重疊、無底色、無文字、無內部波浪紋。

執行方式：
    python3 generate_valves_only.py

會在同目錄產生 valves.svg
"""

# ----------------------- 可調整參數 -----------------------

OUTLINE_COLOR = "#2B5A63"   # 活塞外框顏色（原 Bb 排的鐵青色）
FILL_COLOR = "#FFFFFF"      # 活塞內部填色

N_VALVES = 3
VALVE_W = 40        # 單一活塞頂部寬度
VALVE_H = 70         # 單一活塞高度
VALVE_GAP = 12        # 活塞之間的間距（正值 = 不重疊）
PADDING = 10           # 外圍留白
STROKE_W = 3            # 外框線寬


# ----------------------- 繪圖函式 -----------------------

def draw_valve(x, y):
    """畫一個活塞（梯形，上寬下窄，四角略為圓角），不含內部裝飾線。"""
    top_w = VALVE_W
    bottom_w = VALVE_W * 0.55
    h = VALVE_H

    top_l = x
    top_r = x + top_w
    bot_l = x + (top_w - bottom_w) / 2
    bot_r = bot_l + bottom_w

    path = (
        f"M {top_l+8},{y} "
        f"Q {top_l},{y} {top_l},{y+8} "
        f"L {bot_l},{y+h-6} "
        f"Q {bot_l},{y+h} {bot_l+6},{y+h} "
        f"L {bot_r-6},{y+h} "
        f"Q {bot_r},{y+h} {bot_r},{y+h-6} "
        f"L {top_r},{y+8} "
        f"Q {top_r},{y} {top_r-8},{y} "
        f"Z"
    )

    return f'  <path d="{path}" fill="{FILL_COLOR}" stroke="{OUTLINE_COLOR}" stroke-width="{STROKE_W}" stroke-linejoin="round"/>\n'


def build_svg():
    total_w = N_VALVES * VALVE_W + (N_VALVES - 1) * VALVE_GAP + PADDING * 2
    total_h = VALVE_H + PADDING * 2

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} {total_h}" '
        f'width="{total_w}" height="{total_h}">'
    ]

    x = PADDING
    y = PADDING
    for _ in range(N_VALVES):
        parts.append(draw_valve(x, y))
        x += VALVE_W + VALVE_GAP

    parts.append("</svg>")
    return "\n".join(parts)


if __name__ == "__main__":
    svg_content = build_svg()
    out_path = "valves.svg"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"已產生 {out_path}")
