/**
 * FingeringCharts — 指法／把位圖 HTML（純字串，無 DOM 掛載）
 * interface: chartHtml(instrument, note) → HTML string
 */
window.FingeringCharts = (function () {
  let activeGlowId = "wwGlowFlute";

  function renderValves(note) {
    const valves = note.valves || [];
    const set = new Set(valves);
    const html = `
      <div class="valve-board" aria-label="Piston 指法，由左至右為 1、2、3">
        <div class="piston-cluster">
          <div class="cross-tubes" aria-hidden="true">
            <span class="cross-tube upper"></span>
            <span class="cross-tube lower"></span>
          </div>
          ${[1, 2, 3]
            .map(
              (n) => `
            <div class="valve" data-valve="${n}">
              <div class="piston ${set.has(n) ? "down" : ""}" data-piston="${n}">
                <span class="finger-button"></span>
                <span class="piston-stem"></span>
              </div>
              <div class="casing" aria-hidden="true">
                <span class="casing-rim"></span>
                <span class="casing-body"></span>
                <span class="bottom-cap"></span>
              </div>
              <span class="valve-num">${n}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>`;
    return html;
  }

  /** 法國號：座標/梯形外框對齊 assets/Horn valves.py */
  function hornValvePath(x, y) {
    const topW = 40;
    const bottomW = topW * 0.55;
    const h = 70;
    const topL = x;
    const topR = x + topW;
    const botL = x + (topW - bottomW) / 2;
    const botR = botL + bottomW;
    return (
      `M ${topL + 8},${y} ` +
      `Q ${topL},${y} ${topL},${y + 8} ` +
      `L ${botL},${y + h - 6} ` +
      `Q ${botL},${y + h} ${botL + 6},${y + h} ` +
      `L ${botR - 6},${y + h} ` +
      `Q ${botR},${y + h} ${botR},${y + h - 6} ` +
      `L ${topR},${y + 8} ` +
      `Q ${topR},${y} ${topR - 8},${y} Z`
    );
  }

  function renderHornValves(note) {
    const set = new Set(note.valves || []);
    const gap = 22;
    const pad = 14;
    const w = 40;
    const valveH = 70;
    const numGap = 30;
    const totalW = 3 * w + 2 * gap + pad * 2;
    const totalH = pad + valveH + numGap + 14;
    const glow = wwGlowDef("wwGlowHorn");
    activeGlowId = "wwGlowHorn";
    const metalDefs = `
      <linearGradient id="hornMetalGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffe7b0"/>
        <stop offset="38%" stop-color="#e0b45a"/>
        <stop offset="78%" stop-color="#b87a28"/>
        <stop offset="100%" stop-color="#7a4f14"/>
      </linearGradient>
      ${glow}`;
    const valves = [1, 2, 3]
      .map((n, i) => {
        const x = pad + i * (w + gap);
        const on = set.has(n);
        const d = hornValvePath(x, pad);
        const filt = on ? ` filter="url(#wwGlowHorn)"` : "";
        const fill = on ? "url(#hornMetalGold)" : "#d8dde3";
        return `<path class="horn-valve ${on ? "pressed" : "open"}" data-valve="${n}" d="${d}" fill="${fill}"${filt} />
          <text class="horn-valve-num" x="${x + w / 2}" y="${pad + valveH + numGap}" text-anchor="middle">${n}</text>`;
      })
      .join("");
    return `
      <div class="horn-valve-board" aria-label="法國號活塞，由左至右為 1、2、3">
        <svg class="horn-valve-svg" viewBox="0 0 ${totalW} ${totalH}" role="img" aria-label="法國號活塞示意">
          <defs>${metalDefs}</defs>
          ${valves}
        </svg>
      </div>`;
  }

  /**
   * 長號示意：座標對齊 assets/generate_trombone.py
   * 金色外滑管：左緣 = 當前把位虛線；右端固定於 SLIDE_X_END＋圓頭突出（第 7 把位基準）
   * 第 1 把位可見 1→7＋突出整支外滑管；第 n 把位：1→n 深灰內管，n→7＋突出為金色
   */
  const TROMBONE = {
    viewW: 1340,
    viewH: 580,
    slideYTop: 368,
    slideYBot: 408,
    slideXStart: 115,
    /** 與 generate_trombone.py SLIDE_X_END 相同（圓弧起點；突出至 +h/2） */
    slideXEnd: 1300,
    slideInnerGap: 10,
    fixedLen: 140,
    tickXStart: 270,
    tickXEnd: 1230,
    tickYTop: 425,
    tickYBot: 500,
    labelY: 558,
  };

  function tromboneHeadLeftX(pos) {
    const p = Math.max(1, Math.min(7, pos | 0));
    const { tickXStart, tickXEnd } = TROMBONE;
    return tickXStart + ((tickXEnd - tickXStart) / 6) * (p - 1);
  }

  function renderTrombone(note) {
    const pos = note.position || 1;
    const goldLeft = tromboneHeadLeftX(pos);
    const T = TROMBONE;
    const yTop = T.slideYTop;
    const yBot = T.slideYBot;
    const h = yBot - yTop;
    const r = h / 2;
    const cy = (yTop + yBot) / 2;
    const x0 = T.slideXStart;
    const fixedEnd = x0 + T.fixedLen;
    const slideEnd = T.slideXEnd;
    const tipCx = slideEnd + r;
    const innerTop = yTop + T.slideInnerGap;
    const innerH = h - T.slideInnerGap * 2;
    /** 深灰內管：第 1 虛線 → 當前把位虛線（第 1 把位寬度為 0） */
    const grayLeft = T.tickXStart;
    const grayW = Math.max(0, goldLeft - grayLeft);

    const labelCy = T.labelY - 14;
    const ticks = [1, 2, 3, 4, 5, 6, 7]
      .map((p) => {
        const x = tromboneHeadLeftX(p);
        const on = p === pos;
        return `
          <line class="tb-tick ${on ? "active" : ""}" x1="${x}" y1="${T.tickYTop}" x2="${x}" y2="${T.tickYBot}" />
          <g class="tb-pos ${on ? "active" : ""}">
            ${on ? `<ellipse class="tb-pos-glow" cx="${x}" cy="${labelCy}" rx="36" ry="34"/>` : ""}
            <text class="tb-pos-label" x="${x}" y="${labelCy}" text-anchor="middle" dominant-baseline="central">${p}</text>
          </g>`;
      })
      .join("");

    return `
      <div class="trombone-view">
        <svg class="trombone-svg" viewBox="0 0 ${T.viewW} ${T.viewH}" role="img" aria-label="長號第 ${pos} 把位">
          <defs>
            <linearGradient id="tbBrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffe7b0"/>
              <stop offset="32%" stop-color="#e0b45a"/>
              <stop offset="68%" stop-color="#b87a28"/>
              <stop offset="100%" stop-color="#7a4f14"/>
            </linearGradient>
            <linearGradient id="tbBrassSheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
              <stop offset="40%" stop-color="#ffffff" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="tbGoldSlide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffe9b4"/>
              <stop offset="38%" stop-color="#e8c57a"/>
              <stop offset="78%" stop-color="#c7923e"/>
              <stop offset="100%" stop-color="#8f6320"/>
            </linearGradient>
            <linearGradient id="tbInnerGray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#9aa3ad"/>
              <stop offset="40%" stop-color="#6a727a"/>
              <stop offset="100%" stop-color="#3d444c"/>
            </linearGradient>
            <linearGradient id="tbMouth" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#d5dbe2"/>
              <stop offset="55%" stop-color="#8b949e"/>
              <stop offset="100%" stop-color="#5c646d"/>
            </linearGradient>
            <filter id="tbGoldGlow" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur"/>
              <feFlood flood-color="#f0c14a" flood-opacity="0.5" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- 喇叭口＋上管（generate_trombone.py） -->
          <path class="tb-body" fill="url(#tbBrass)" d="M 0,150 L 195,150 L 598,18 L 585,325 L 210,192 L 0,192 Z"/>
          <path class="tb-sheen" fill="url(#tbBrassSheen)" d="M 0,150 L 195,150 L 598,18 L 585,325 L 210,192 L 0,192 Z"/>

          <!-- 左側豎管 -->
          <rect class="tb-body" x="90" y="150" width="45" height="230" fill="url(#tbBrass)"/>
          <circle cx="112.5" cy="365" r="8" fill="url(#tbBrass)" stroke="#8f6320" stroke-width="2"/>

          <!-- 吹嘴 -->
          <path fill="url(#tbMouth)" d="M 20,355 L 100,355 L 120,375 L 120,415 L 100,435 L 20,435 Z"/>

          <!-- 滑管固定段（金屬黃銅） -->
          <path fill="url(#tbBrass)" d="M ${x0},${yTop} L ${fixedEnd},${yTop} L ${fixedEnd},${yBot} L ${x0},${yBot} Z"/>
          <line x1="${x0 + 55}" y1="${yTop}" x2="${x0 + 55}" y2="${yBot}" stroke="#c8811f" stroke-width="3"/>
          <line x1="${x0 + 90}" y1="${yTop}" x2="${x0 + 90}" y2="${yBot}" stroke="#8f6320" stroke-width="2.5"/>

          <!-- 深灰內管：1 虛線 → 當前把位虛線 -->
          ${
            grayW > 0
              ? `<rect class="tb-inner" x="${grayLeft}" y="${yTop}" width="${grayW}" height="${h}" fill="url(#tbInnerGray)"/>
                 <rect class="tb-inner-core" x="${grayLeft}" y="${innerTop}" width="${grayW}" height="${innerH}" fill="#2c3238" opacity="0.55"/>`
              : ""
          }

          <!-- 金色外滑管：左緣=當前虛線，右端=第7＋python 突出圓頭（固定） -->
          <g class="tb-outer" filter="url(#tbGoldGlow)">
            <path fill="url(#tbGoldSlide)" d="M ${goldLeft},${yTop}
              L ${slideEnd},${yTop}
              A ${r},${r} 0 0 1 ${slideEnd},${yBot}
              L ${goldLeft},${yBot} Z"/>
            <rect x="${goldLeft}" y="${yTop - 3}" width="8" height="${h + 6}" rx="2" fill="url(#tbGoldSlide)"/>
            <circle cx="${tipCx}" cy="${cy}" r="4" fill="#1a1206"/>
          </g>

          <!-- 1–7 把位虛線＋數字（當前：加粗/加大/微亮底） -->
          ${ticks}
        </svg>
      </div>`;
  }

  function keyAttrs(pressed, id) {
    const on = pressed.has(id);
    const filt = on ? ` filter="url(#${activeGlowId})"` : "";
    return `class="ww-key ${on ? "pressed" : "open"}" data-key="${id}"${filt}`;
  }

  function oval(cx, cy, rx, ry, id, pressed, angle = 0) {
    const rot = angle ? ` transform="rotate(${-angle} ${cx} ${cy})"` : "";
    return `<ellipse ${keyAttrs(pressed, id)} cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot} />`;
  }

  function circle(cx, cy, r, id, pressed) {
    return `<circle ${keyAttrs(pressed, id)} cx="${cx}" cy="${cy}" r="${r}" />`;
  }

  function spatula(x, y, w, h, id, pressed, rx = 3) {
    return `<rect ${keyAttrs(pressed, id)} x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" />`;
  }

  function pearl(cx, cy, r, id, pressed) {
    return circle(cx, cy, r, id, pressed);
  }

  function wwGlowDef(id) {
    return `
      <filter id="${id}" x="-90%" y="-90%" width="280%" height="280%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="blur" />
        <feFlood flood-color="#f0c14a" flood-opacity="0.85" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`;
  }

  /** 管身金屬紋路（brass＝黃銅；silver＝銀；ebony＝豎笛黑檀漸層） */
  function wwBodyMetalDefs(prefix, tone = "brass") {
    if (tone === "silver") {
      return `
      <linearGradient id="${prefix}Body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fbfcfd"/>
        <stop offset="18%" stop-color="#eef1f4"/>
        <stop offset="42%" stop-color="#dce2e8"/>
        <stop offset="68%" stop-color="#c5cdd6"/>
        <stop offset="100%" stop-color="#a8b2bc"/>
      </linearGradient>
      <linearGradient id="${prefix}Sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7"/>
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.18"/>
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="${prefix}Edge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5f7f9"/>
        <stop offset="50%" stop-color="#b0b8c0"/>
        <stop offset="100%" stop-color="#8a939e"/>
      </linearGradient>
      <pattern id="${prefix}Grain" width="6" height="7" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="7" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.7"/>
        <line x1="3.2" y1="0" x2="3.2" y2="7" stroke="#7a848e" stroke-opacity="0.1" stroke-width="0.6"/>
        <line x1="5" y1="0" x2="5" y2="7" stroke="#ffffff" stroke-opacity="0.14" stroke-width="0.5"/>
      </pattern>`;
    }
    if (tone === "ebony") {
      return `
      <linearGradient id="${prefix}Body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0a0a0c"/>
        <stop offset="22%" stop-color="#2a2a30"/>
        <stop offset="48%" stop-color="#141418"/>
        <stop offset="72%" stop-color="#323238"/>
        <stop offset="100%" stop-color="#08080a"/>
      </linearGradient>
      <linearGradient id="${prefix}Sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0.04"/>
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
      </linearGradient>
      <pattern id="${prefix}Grain" width="5" height="8" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="8" stroke="#ffffff" stroke-opacity="0.07" stroke-width="0.7"/>
        <line x1="3.5" y1="0" x2="3.5" y2="8" stroke="#000000" stroke-opacity="0.22" stroke-width="0.7"/>
      </pattern>`;
    }
    return `
      <linearGradient id="${prefix}Body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#c4a05a"/>
        <stop offset="28%" stop-color="#e8d4a0"/>
        <stop offset="52%" stop-color="#d8b56a"/>
        <stop offset="78%" stop-color="#c9a25a"/>
        <stop offset="100%" stop-color="#a88440"/>
      </linearGradient>
      <pattern id="${prefix}Grain" width="5" height="8" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="8" stroke="#fff8e8" stroke-opacity="0.14" stroke-width="0.8"/>
        <line x1="3.5" y1="0" x2="3.5" y2="8" stroke="#6a4e1c" stroke-opacity="0.08" stroke-width="0.7"/>
      </pattern>`;
  }

  /** 豎笛/Alto/Tenor：按下按鍵金色漸層 */
  function wwKeyGoldDef(id) {
    return `
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffe7b0"/>
        <stop offset="35%" stop-color="#e8c56a"/>
        <stop offset="72%" stop-color="#c7923e"/>
        <stop offset="100%" stop-color="#8a5a14"/>
      </linearGradient>`;
  }

  function wwBodyMetalLayer(prefix, x, y, w, h, rx = 2, extraClass = "", withSheen = false) {
    const cls = extraClass ? ` ${extraClass}` : "";
    const sheen = withSheen
      ? `<rect class="ww-body-sheen" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${prefix}Sheen)" pointer-events="none"/>`
      : "";
    return `
      <rect class="ww-body-fill${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${prefix}Body)"/>
      ${sheen}
      <rect class="ww-body-grain" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${prefix}Grain)" pointer-events="none"/>`;
  }

  function renderFluteSvg(pressed) {
    /**
     * 全新繪製：assets/flute-finger-schematic.png
     * 白＝可變動（空＝白、按＝金）；鐵灰＝固定；管身＝淡金屬灰漸層
     * 指法 Bb~D 見 FLUTE_KEYS
     */
    activeGlowId = "fluteKeyGlow";
    const flKey = (id, shape) => {
      const on = pressed.has(id);
      const cls = `ww-key flute-key ${on ? "pressed" : "open"}`;
      const filt = on ? ` filter="url(#fluteKeyGlow)"` : "";
      return shape.replace("__ATTRS__", `class="${cls}" data-key="${id}"${filt}`);
    };
    const fixed = (shape) =>
      shape.replace("__ATTRS__", `class="flute-key flute-key-fixed" aria-hidden="true"`);

    const defs = `
      <linearGradient id="fluteBodyMetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4f6f8"/>
        <stop offset="35%" stop-color="#d5dce6"/>
        <stop offset="70%" stop-color="#b8c0c8"/>
        <stop offset="100%" stop-color="#9aa3ad"/>
      </linearGradient>
      <linearGradient id="fluteBodySheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
        <stop offset="45%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.28"/>
      </linearGradient>
      ${wwKeyGoldDef("fluteKeyGold")}
      <filter id="fluteKeyGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.8" result="blur"/>
        <feFlood flood-color="#f0c14a" flood-opacity="0.75" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`;

    // 管身＋吹口（原圖座標）
    const body = `
      <rect class="flute-body" x="44" y="209" width="885" height="43" rx="21.5" fill="url(#fluteBodyMetal)"/>
      <rect class="flute-body-sheen" x="44" y="209" width="885" height="43" rx="21.5" fill="url(#fluteBodySheen)" pointer-events="none"/>
      <rect class="flute-body" x="58" y="214" width="78" height="32" rx="10" fill="url(#fluteBodyMetal)"/>
      <rect class="flute-embouchure-hole" x="78" y="222" width="36" height="16" rx="6"/>`;

    // 固定鍵（鐵灰）
    const decor = [
      fixed(`<circle __ATTRS__ cx="291.4" cy="220.4" r="12.5"/>`),
      fixed(`<circle __ATTRS__ cx="385.3" cy="216.4" r="16.5"/>`),
      fixed(`<circle __ATTRS__ cx="516.2" cy="216.4" r="16.5"/>`),
      fixed(`<circle __ATTRS__ cx="558.5" cy="216.4" r="17"/>`),
      fixed(`<ellipse __ATTRS__ cx="770.9" cy="204" rx="16.5" ry="8.5"/>`),
      fixed(`<circle __ATTRS__ cx="830.5" cy="245.6" r="12"/>`),
      fixed(`<circle __ATTRS__ cx="879.6" cy="245.9" r="12"/>`),
    ].join("");

    // 可變動鍵（白/金）— 嚴格對齊新圖白鍵
    const keys = [
      flKey("T", `<circle __ATTRS__ cx="342.7" cy="295.7" r="23.5"/>`),
      flKey("Bb", `<ellipse __ATTRS__ cx="420.2" cy="296" rx="45.5" ry="11.5"/>`),
      flKey("L1", `<circle __ATTRS__ cx="347" cy="220.5" r="12"/>`),
      flKey("L2", `<circle __ATTRS__ cx="427.7" cy="216.4" r="16"/>`),
      flKey("L3", `<circle __ATTRS__ cx="470.1" cy="216.4" r="16"/>`),
      flKey("Ab", `<rect __ATTRS__ x="451.5" y="174.5" width="37" height="13" rx="6.5"/>`),
      flKey("R1", `<circle __ATTRS__ cx="604.7" cy="216.4" r="16"/>`),
      flKey("R2", `<circle __ATTRS__ cx="654.4" cy="216.4" r="16"/>`),
      flKey("R3", `<circle __ATTRS__ cx="703.7" cy="216.4" r="16"/>`),
      flKey("Eb", `<rect __ATTRS__ x="733.6" y="220.7" width="17" height="37" rx="8.5"/>`),
      flKey("Cs", `<rect __ATTRS__ x="767.4" y="224.5" width="26" height="12" rx="6"/>`),
      flKey("LowC", `<rect __ATTRS__ x="767.5" y="244.6" width="26" height="12" rx="6"/>`),
    ].join("");

    // 內容≈44–928 × 173–322；viewBox 加高並下移內容，保留 Ab 鍵＋金暈完整可見
    return `
      <div class="flute-chart-frame">
        <svg class="ww-svg flute flute-chart" viewBox="0 0 990 248" role="img" aria-label="長笛按鍵示意" preserveAspectRatio="xMidYMid meet">
          <defs>${defs}</defs>
          <g transform="scale(1.1, 1.15) translate(-40, -132)">
            ${body}
            ${decor}
            ${keys}
          </g>
        </svg>
      </div>`;
  }

  function renderClarinetSvg(pressed) {
    activeGlowId = "wwGlowClarinet";
    /**
     * 座標嚴格套用 assets/clarinet finger chart.py
     * viewBox 以管身中心 x=100 為準（-10 起算），手機／桌面光學置中；黑檀漸層管身（無外側雙線）
     * 空鍵白；按下＝亮金＋深金框＋淡金光暈
     */
    return `
      <svg class="ww-svg clarinet clarinet-chart" viewBox="-10 0 220 560" role="img" aria-label="豎笛按鍵示意">
        <defs>${wwGlowDef("wwGlowClarinet")}${wwBodyMetalDefs("cl", "ebony")}${wwKeyGoldDef("clarinetKeyGold")}</defs>
        ${wwBodyMetalLayer("cl", 40, 0, 120, 560, 2, "", true)}

        <!-- 1. 泛音鍵 & 左大拇指（略放大） -->
        ${oval(55, 70, 8, 18, "Reg", pressed)}
        ${circle(55, 115, 14, "T", pressed)}

        <!-- 2. 頂部前面按鍵（喉音） -->
        ${oval(100, 80, 8, 18, "A", pressed)}
        ${oval(125, 95, 8, 25, "Gs", pressed, -5)}

        <!-- 3. 上管指孔與側鍵 -->
        ${circle(100, 150, 18.5, "L1", pressed)}
        ${circle(100, 205, 18.5, "L2", pressed)}
        ${oval(130, 225, 16, 6, "sideBb", pressed, 15)}
        ${circle(100, 260, 18.5, "L3", pressed)}

        <!-- 4. 左小指四鍵 -->
        ${oval(60, 275, 14, 7, "LPinky1", pressed)}
        ${oval(60, 295, 14, 7, "LPinky2", pressed)}
        ${oval(60, 315, 14, 7, "LPinky3", pressed)}
        ${oval(60, 335, 14, 7, "LLowC", pressed)}

        <!-- 5. 右側鍵（Cs＝L3 旁 C♯鍵，對齊上傳 #do 圖）/顫音鍵 -->
        ${oval(130, 270, 9, 14, "Cs", pressed, -45)}
        ${oval(150, 285, 10, 16, "Trill2", pressed, -30)}
        ${oval(135, 325, 12.5, 27, "Trill3", pressed, 15)}
        ${oval(155, 340, 10, 31, "Trill4", pressed, 10)}

        <!-- 6. 下管指孔與側鍵 -->
        ${circle(100, 335, 18.5, "R1", pressed)}
        ${circle(100, 390, 18.5, "R2", pressed)}
        ${oval(70, 415, 16, 6, "EbSide", pressed, -15)}
        ${circle(100, 445, 18.5, "R3", pressed)}

        <!-- 7. 右小指 2×2 -->
        ${oval(82, 500, 16, 8, "RPinkyTL", pressed)}
        ${oval(114, 500, 16, 8, "RPinkyTR", pressed)}
        ${oval(82, 520, 16, 8, "RPinkyBL", pressed)}
        ${oval(114, 520, 16, 8, "LowC", pressed)}
      </svg>`;
  }

  function renderSaxSvg(pressed) {
    activeGlowId = "wwGlowSax";
    /**
     * 座標嚴格套用 assets/Saxophone finger chart.py 內嵌 SVG
     * viewBox 0 0 320 960；去背＋淡金屬管身
     * 按鍵模式同豎笛：空鍵白；按下＝亮金＋深金框＋淡金光暈
     */
    return `
      <svg class="ww-svg sax sax-chart" viewBox="0 0 320 960" role="img" aria-label="薩克斯風按鍵示意">
        <defs>${wwGlowDef("wwGlowSax")}${wwBodyMetalDefs("sx")}${wwKeyGoldDef("saxKeyGold")}</defs>
        ${wwBodyMetalLayer("sx", 100, 48, 120, 870, 48, "sax-body")}

        <!-- 八度鍵（對齊指法圖左上橢圓） -->
        ${oval(80, 165, 22, 34, "Oct", pressed)}

        <!-- 上右掌鍵三膠囊 -->
        ${spatula(215, 105, 22, 60, "PalmD", pressed, 11)}
        ${spatula(245, 60, 22, 60, "PalmEb", pressed, 11)}
        ${spatula(265, 140, 22, 60, "PalmF", pressed, 11)}

        <!-- 主音孔上半部 -->
        ${pearl(172, 65, 15, "FrontF", pressed)}
        ${pearl(160, 130, 31, "L1", pressed)}
        ${pearl(172, 177, 15, "Bis", pressed)}
        ${pearl(160, 235, 31, "L2", pressed)}
        ${pearl(160, 345, 31, "L3", pressed)}

        <!-- 中右側鍵組：橫 → 雙小圓 → 橫（下橫＝側 B♭，對齊圖 Alternate Bb） -->
        ${spatula(225, 370, 46, 24, "MidR1", pressed, 12)}
        ${pearl(238, 410, 6, "MidDot1", pressed)}
        ${pearl(258, 410, 6, "MidDot2", pressed)}
        ${spatula(225, 426, 46, 24, "SideBb", pressed, 12)}

        <!-- 中左三連鍵（同尺寸） -->
        ${spatula(58, 485, 24, 60, "Gs", pressed, 12)}
        ${spatula(58, 550, 24, 60, "LowCs", pressed, 12)}
        ${spatula(58, 615, 24, 60, "LowB", pressed, 12)}

        <!-- 主音孔下半部 -->
        ${pearl(160, 555, 31, "R1", pressed)}
        ${pearl(160, 665, 31, "R2", pressed)}
        ${pearl(160, 775, 31, "R3", pressed)}

        <!-- 下左雙圓角矩形：上＝低 E♭、下＝低 C（對齊圖 1 小指對） -->
        ${spatula(35, 810, 68, 58, "LowEb", pressed, 20)}
        ${spatula(35, 873, 68, 58, "LowC", pressed, 20)}
      </svg>`;
  }

  function renderWoodwind(note, instrument) {
    const inst = instrument;
    const pressed = new Set(note.keys || []);
    const family = inst.wwFamily || "flute";
    let svg = "";
    if (family === "clarinet") svg = renderClarinetSvg(pressed);
    else if (family === "sax") svg = renderSaxSvg(pressed);
    else svg = renderFluteSvg(pressed);

    const legend = `
        <div class="ww-legend" aria-hidden="true">
          <span><i class="ww-swatch open"></i>空</span>
          <span><i class="ww-swatch pressed"></i>按</span>
        </div>`;
    // 長笛：圖在上（靠近譜面音文字）、圖例在下；其餘樂器維持圖例在上
    const body =
      family === "flute"
        ? `${svg}${legend}`
        : `${legend}${svg}`;

    return `
      <div class="woodwind-view ww-${inst.id}">
        ${body}
      </div>`;
  }

  function renderPiano(note, instrument) {
    const inst = instrument;
    const lo = (inst.concertStart ?? 58) - 1;
    const hi = (inst.concertEnd ?? 70) + 1;
    const isBlack = (name) =>
      ["C♯", "D♯", "E♭", "F♯", "G♯", "A♭", "A♯", "B♭"].includes(name);
    const keys = [];
    for (let m = lo; m <= hi; m++) {
      const info = window.BandInstruments.midiToName(m);
      keys.push({ midi: m, black: isBlack(info.name), name: info.name });
    }
    const whiteKeys = keys.filter((k) => !k.black);
    const blackKeys = keys.filter((k) => k.black);
    const active = note.concertMidi;

    const whiteHtml = whiteKeys
      .map(
        (k) =>
          `<div class="piano-key ${k.midi === active ? "active" : ""}" data-midi="${k.midi}"></div>`
      )
      .join("");

    const blackHtml = blackKeys
      .map((k) => {
        const whitesBelow = whiteKeys.filter((w) => w.midi < k.midi).length;
        const left = ((whitesBelow - 0.35) / whiteKeys.length) * 100;
        return `<div class="piano-key black ${k.midi === active ? "active" : ""}" style="left:${left}%" data-midi="${k.midi}"></div>`;
      })
      .join("");

    return `
      <div class="piano-view">
        <div class="piano-keys">${whiteHtml}${blackHtml}</div>
      </div>`;
  }

  function chartHtml(instrument, note) {
    if (!instrument || !note) return "";
    if (instrument.ui === "horn") return renderHornValves(note);
    if (instrument.ui === "valves") return renderValves(note);
    if (instrument.ui === "trombone") return renderTrombone(note);
    if (instrument.ui === "woodwind") return renderWoodwind(note, instrument);
    if (instrument.ui === "piano") return renderPiano(note, instrument);
    return "";
  }

  return { chartHtml };
})();
