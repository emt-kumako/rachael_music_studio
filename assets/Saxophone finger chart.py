def generate_saxophone_svg(output_filename="saxophone_chart.svg"):
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 960" width="100%" height="100%">
  <defs>
    <style>
      .sax-key {
        fill: #ffffff;
        stroke: #000000;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </defs>

  <!-- 上左單橢圓 -->
  <ellipse class="sax-key" cx="80" cy="165" rx="22" ry="34" />

  <!-- 上右三膠囊鍵 -->
  <rect class="sax-key" x="215" y="105" width="22" height="60" rx="11" />
  <rect class="sax-key" x="245" y="60"  width="22" height="60" rx="11" />
  <rect class="sax-key" x="265" y="140" width="22" height="60" rx="11" />

  <!-- 主音孔上半部 -->
  <circle class="sax-key" cx="172" cy="65" r="15" />
  <circle class="sax-key" cx="160" cy="130" r="31" />
  <circle class="sax-key" cx="172" cy="177" r="15" />
  <circle class="sax-key" cx="160" cy="235" r="31" />
  <circle class="sax-key" cx="160" cy="345" r="31" />

  <!-- 中右側鍵組 -->
  <rect class="sax-key" x="225" y="370" width="46" height="24" rx="12" />
  <circle class="sax-key" cx="238" cy="410" r="6" />
  <circle class="sax-key" cx="258" cy="410" r="6" />
  <rect class="sax-key" x="225" y="426" width="46" height="24" rx="12" />

  <!-- 中左三連鍵 -->
  <rect class="sax-key" x="58" y="485" width="24" height="60" rx="12" />
  <rect class="sax-key" x="58" y="550" width="24" height="60" rx="12" />
  <rect class="sax-key" x="58" y="615" width="24" height="60" rx="12" />

  <!-- 主音孔下半部 -->
  <circle class="sax-key" cx="160" cy="555" r="31" />
  <circle class="sax-key" cx="160" cy="665" r="31" />
  <circle class="sax-key" cx="160" cy="775" r="31" />

  <!-- 下左雙圓角矩形 -->
  <rect class="sax-key" x="35" y="810" width="68" height="58" rx="20" />
  <rect class="sax-key" x="35" y="873" width="68" height="58" rx="20" />
</svg>"""

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"高解析度向量檔已成功生成：{output_filename}")


if __name__ == "__main__":
    generate_saxophone_svg()