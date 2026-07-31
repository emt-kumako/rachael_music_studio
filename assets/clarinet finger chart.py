import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Ellipse

# 初始化畫布
fig, ax = plt.subplots(figsize=(2.2, 5.6), dpi=300)
ax.set_aspect('equal')
ax.axis('off') # 隱藏座標軸

# 設定繪圖樣式
EDGE_COLOR = 'black'
FACE_COLOR = 'white'
LINE_WIDTH = 1.5

# Z-order 設定：線條在底層(zorder=1)，按鍵在頂層(zorder=2)
# 這樣按鍵的白底就能完美覆蓋在管身線條上方
def draw_circle(x, y, r):
    ax.add_patch(Circle((x, y), r, edgecolor=EDGE_COLOR, facecolor=FACE_COLOR, lw=LINE_WIDTH, zorder=2))

def draw_ellipse(x, y, w, h, angle=0):
    # matplotlib 的 angle 是逆時針方向旋轉
    ax.add_patch(Ellipse((x, y), width=w*2, height=h*2, angle=angle, edgecolor=EDGE_COLOR, facecolor=FACE_COLOR, lw=LINE_WIDTH, zorder=2))

# 設定畫布範圍 (Y軸反轉以符合由上往下的視覺直覺)
ax.set_xlim(0, 220)
ax.set_ylim(560, 0)

# --- 繪製豎笛管身 (兩側垂直線) ---
# 左側管身線
ax.plot([40, 40], [0, 560], color=EDGE_COLOR, lw=LINE_WIDTH, zorder=1)
# 若您希望左側完全還原參考圖中「稍微分開的雙線」錯覺感，可取消下方註解：
# ax.plot([36, 36], [0, 560], color=EDGE_COLOR, lw=LINE_WIDTH, zorder=1)

# 右側管身線 (與左側對稱，中心點為主音孔的 X=100)
ax.plot([160, 160], [0, 560], color=EDGE_COLOR, lw=LINE_WIDTH, zorder=1)


# --- 開始精確繪製座標 ---

# 1. 泛音鍵 & 左大拇指
draw_ellipse(55, 70, 7, 16)
draw_circle(55, 115, 12)

# 2. 頂部前面按鍵
draw_ellipse(100, 80, 7, 16)
draw_ellipse(125, 95, 7, 22, angle=-5)

# 3. 上管指孔與側鍵
draw_circle(100, 150, 16)
draw_circle(100, 205, 16)
draw_ellipse(130, 225, 14, 5, angle=15)
draw_circle(100, 260, 16)

# 4. 左小指按鍵 (四個水平橢圓)
draw_ellipse(60, 275, 12, 6)
draw_ellipse(60, 295, 12, 6)
draw_ellipse(60, 315, 12, 6)
draw_ellipse(60, 335, 12, 6)

# 5. 右側四個顫音鍵 (不規則形轉橢圓)
draw_ellipse(130, 270, 8, 12, angle=-45)
draw_ellipse(150, 285, 9, 14, angle=-30)
draw_ellipse(135, 325, 11, 24, angle=15)
draw_ellipse(155, 340, 9, 28, angle=10)

# 6. 下管指孔與側鍵
draw_circle(100, 335, 16)
draw_circle(100, 390, 16)
draw_ellipse(70, 415, 14, 5, angle=-15)
draw_circle(100, 445, 16)

# 7. 右小指/底部按鍵 (2x2 排列)
draw_ellipse(82, 500, 14, 7)
draw_ellipse(114, 500, 14, 7)
draw_ellipse(82, 520, 14, 7)
draw_ellipse(114, 520, 14, 7)

# 輸出並保存
plt.tight_layout(pad=0)
plt.savefig('clarinet_fingering_chart_with_body.png', dpi=300, transparent=True)
print("圖片已成功生成並儲存為 'clarinet_fingering_chart_with_body.png'")
# plt.show() # 若在互動式環境可取消註解以預覽