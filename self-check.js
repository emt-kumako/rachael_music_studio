/**
 * 自檢腳本（Node 或與瀏覽器資料同源邏輯複核）
 * 若無 Node，可用: powershell 執行專案內檢查；有 Node 則 node self-check.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const instrumentsSrc = fs.readFileSync(path.join(root, "instruments.js"), "utf8");
const timingSrc = fs.readFileSync(path.join(root, "practice-timing.js"), "utf8");
const challengeSrc = fs.readFileSync(path.join(root, "fingering-challenge.js"), "utf8");
const chartsSrc = fs.readFileSync(path.join(root, "fingering-charts.js"), "utf8");
const uiSoundsSrc = fs.readFileSync(path.join(root, "ui-sounds.js"), "utf8");
const sandbox = { window: {}, console };
vm.runInNewContext(instrumentsSrc, sandbox);
vm.runInNewContext(timingSrc, sandbox);
vm.runInNewContext(challengeSrc, sandbox);
vm.runInNewContext(chartsSrc, sandbox);
vm.runInNewContext(uiSoundsSrc, sandbox);
const Band = sandbox.window.BandInstruments;
const Timing = sandbox.window.PracticeTiming;
const Challenge = sandbox.window.FingeringChallenge;
const Charts = sandbox.window.FingeringCharts;
const UiSounds = sandbox.window.UiSounds;

let passed = 0;
let failed = 0;
function check(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log("✓", name);
  } else {
    failed += 1;
    console.error("✗", name, detail || "");
  }
}

const A4 = 442;
const hz = (midi) => A4 * 2 ** ((midi - 69) / 12);

check("A4=442", Math.abs(Band.midiToHz(69) - 442) < 1e-9);
check("樂器數量 10", Band.instruments.length === 10);

const ids = Band.instruments.map((i) => i.id);
check(
  "含指定樂器",
  ["trumpet", "flute", "clarinet", "altoSax", "tenorSax", "horn", "trombone", "euphonium", "tuba", "piano"].every(
    (id) => ids.includes(id)
  )
);

for (const inst of Band.instruments) {
  const [w0, w1] = inst.scaleWrittenMidi;
  check(`${inst.name} 13 音`, inst.notes.length === 13, String(inst.notes.length));
  check(
    `${inst.name} 音域對齊 scaleWrittenMidi`,
    inst.notes[0].writtenMidi === w0 && inst.notes[12].writtenMidi === w1,
    `${inst.notes[0].writtenMidi}–${inst.notes[12].writtenMidi} vs ${w0}–${w1}`
  );
  check(
    `${inst.name} 起始/結束實音`,
    inst.notes[0].concertMidi === inst.concertStart && inst.notes[12].concertMidi === inst.concertEnd
  );
  check(
    `${inst.name} 半音連續`,
    inst.notes.every((n, i) => i === 0 || n.concertMidi === inst.notes[i - 1].concertMidi + 1)
  );
  check(
    `${inst.name} 移調一致`,
    inst.notes.every((n) => n.writtenMidi - n.concertMidi === inst.transpose)
  );
  check(
    `${inst.name} 有唱名簡譜`,
    inst.notes.every((n) => n.solfege && n.jianpu)
  );
}

const trumpet = Band.getById("trumpet");
check("Trumpet 起始譜面 C", trumpet.notes[0].writtenName === "C" && trumpet.notes[0].solfege === "do");
check("Trumpet 空閥在起始", trumpet.notes[0].valves.length === 0);
check("Trumpet D(譜) = 1·3", JSON.stringify(trumpet.notes[2].valves) === JSON.stringify([1, 3]));

const trom = Band.getById("trombone");
check("Trombone 移調 0", trom.transpose === 0);
check("Trombone 起始 Bb 第1把位", trom.notes[0].position === 1 && trom.notes[0].concertName === "B♭");
check("Trombone 把位皆 1–7", trom.notes.every((n) => n.position >= 1 && n.position <= 7));

const euph = Band.getById("euphonium");
const tuba = Band.getById("tuba");
check("Euphonium/Tuba 移調 0", euph.transpose === 0 && tuba.transpose === 0);
check("Euphonium 起始空閥 Bb", euph.notes[0].valves.length === 0);
check("Tuba 起始空閥 Bb", tuba.notes[0].valves.length === 0);
check("Euph/Tuba 含 valve4 欄位", "valve4" in euph.notes[0] && "valve4" in tuba.notes[0]);

const alto = Band.getById("altoSax");
check("Alto 起始譜面 G", alto.notes[0].writtenName === "G");
const horn = Band.getById("horn");
check("Horn 起始譜面 F", horn.notes[0].writtenName === "F");
check("Horn 移調 +7", horn.transpose === 7);
check("Horn 起始實音 Bb2", horn.notes[0].concertName === "B♭" && horn.notes[0].concertMidi === 46);
const flute = Band.getById("flute");
check("Flute 起始譜面 Bb", flute.notes[0].writtenName === "B♭");

check("Bb3 ≈ 234.14", Math.abs(hz(58) - 234.1413) < 0.01);
check("Bb4 = 2×Bb3", Math.abs(hz(70) / hz(58) - 2) < 1e-9);

const marks = Band.TEMPO_MARKS.map((m) => m.name);
check(
  "五種速度用語",
  JSON.stringify(marks) === JSON.stringify(["Largo", "Adagio", "Andante", "Moderato", "Allegro"])
);
check(
  "速度用語中文與 BPM",
  JSON.stringify(Band.TEMPO_MARKS.map((m) => [m.nameZh, m.bpm])) ===
    JSON.stringify([
      ["廣板", 50],
      ["慢板", 70],
      ["行板", 88],
      ["中板", 108],
      ["快板", 120],
    ])
);

// HTML / CSS / app 結構
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const charts = chartsSrc;

check("載入 FingeringCharts", !!Charts && typeof Charts.chartHtml === "function");
check("index 載入 fingering-charts.js", /fingering-charts\.js/.test(html));
check("app 使用 chartHtml", /Charts\.chartHtml|FingeringCharts/.test(app) && !/captureFingeringHtml/.test(app));
for (const inst of Band.instruments) {
  const htmlChart = Charts.chartHtml(inst, inst.notes[0]);
  check(
    `${inst.name} chartHtml 非空`,
    typeof htmlChart === "string" && htmlChart.length > 40,
    String((htmlChart && htmlChart.length) || 0)
  );
}
check("小號 chart 含 valve-board", /valve-board/.test(Charts.chartHtml(Band.getById("trumpet"), Band.getById("trumpet").notes[0])));
check("長笛 chart 含 woodwind-view", /woodwind-view/.test(Charts.chartHtml(Band.getById("flute"), Band.getById("flute").notes[0])));
check("長號 chart 含 trombone-view", /trombone-view/.test(Charts.chartHtml(Band.getById("trombone"), Band.getById("trombone").notes[0])));
check("鋼琴 chart 含 piano-view", /piano-view/.test(Charts.chartHtml(Band.getById("piano"), Band.getById("piano").notes[0])));
check("法國號 chart 含 horn-valve", /horn-valve/.test(Charts.chartHtml(Band.getById("horn"), Band.getById("horn").notes[0])));

check("載入 PracticeTiming", !!Timing && typeof Timing.buildBeatPlan === "function");
check("index 載入 practice-timing.js", /practice-timing\.js/.test(html));
check("app 使用 PracticeTiming", /window\.PracticeTiming|Timing\.planSession|Timing\.stepTiming/.test(app));
check("載入 FingeringChallenge", !!Challenge && typeof Challenge.buildSession === "function");
check("index 載入 fingering-challenge.js", /fingering-challenge\.js/.test(html));
check("指法挑戰選單入口", /btnFingeringChallenge/.test(html) && /指法挑戰/.test(html));
check("指法挑戰 flow-layer", /data-layer="challenge"/.test(html) || /id="layerChallenge"/.test(html));
check("載入 UiSounds", !!UiSounds && typeof UiSounds.assetPath === "function");
check("index 載入 ui-sounds.js", /ui-sounds\.js/.test(html));
check(
  "UiSounds 六種對照",
  ["choose", "back", "startGame", "correct", "wrong", "finish"].every((k) => !!UiSounds.assetPath(k))
);
check("UiSounds choose 檔", /Choose\.wav$/.test(UiSounds.assetPath("choose")));
check("UiSounds back 檔", /Vibe Back\.wav$/.test(UiSounds.assetPath("back")));
check("UiSounds startGame 檔", /Start Game\.mp3$/.test(UiSounds.assetPath("startGame")));
check("UiSounds correct 檔", /correct-choice-gliss-01\.mp3$/.test(UiSounds.assetPath("correct")));
check("UiSounds wrong 檔", /Wrong\.mp3$/.test(UiSounds.assetPath("wrong")));
check("UiSounds finish 檔", /cartoon happy finish\.mp3$/.test(UiSounds.assetPath("finish")));
for (const k of UiSounds.allKinds()) {
  const rel = UiSounds.assetPath(k);
  check(`音效檔存在 ${k}`, fs.existsSync(path.join(root, rel)), rel);
}
check("挑戰 phase 強制 hidden", /\.challenge-idle\[hidden\]/.test(css) && /display:\s*none\s*!important/.test(css));
check("返回首頁空白再淡入", /replayHomeEntranceBlankThenFade/.test(app));
check("app 播放 UI 音效", /function playUiSound/.test(app) && /playUiSound\("choose"\)/.test(app));

(() => {
  let seq = 0;
  const rng = () => {
    seq += 1;
    return (seq * 0.17) % 1;
  };
  const flute = Band.getById("flute");
  check("Band.scaleNotes 存在", typeof Band.scaleNotes === "function");
  const scale = Band.scaleNotes(flute);
  check("長笛音階音數量合理", scale.length >= 5 && scale.length <= 13, String(scale.length));
  check(
    "挑戰音池委派 Band.scaleNotes",
    Challenge.scaleNotes(flute) === scale ||
      JSON.stringify(Challenge.scaleNotes(flute).map((n) => n.writtenMidi)) ===
        JSON.stringify(scale.map((n) => n.writtenMidi))
  );
  for (const inst of Band.instruments) {
    const sn = Band.scaleNotes(inst);
    check(
      `${inst.name} Band.scaleNotes 非空且⊆notes`,
      sn.length >= 1 && sn.every((n) => inst.notes.includes(n))
    );
  }
  const session = Challenge.buildSession(flute, { questionCount: 5, optionCount: 3, rng });
  check("一局 5 題", session.questions.length === 5);
  check(
    "每題 3 選且含正解",
    session.questions.every((q) => q.options.length === 3 && q.correctIndex >= 0 && q.options[q.correctIndex] === q.prompt)
  );
  check(
    "干擾項優先不同指法指紋",
    session.questions.every((q) => {
      const cfp = Challenge.fingeringFingerprint(q.prompt);
      const others = q.options.filter((_, i) => i !== q.correctIndex);
      const distinct = others.filter((n) => Challenge.fingeringFingerprint(n) !== cfp).length;
      return distinct === others.length || distinct >= 1;
    })
  );
  check("app 綁定挑戰流程", /openChallengeForInstrument|startChallengeSession|FingeringChallenge/.test(app));
  const q0 = session.questions[0];
  check("grade 正解為 true", Challenge.grade(q0, q0.correctIndex) === true);
  check(
    "grade 錯選為 false",
    Challenge.grade(q0, (q0.correctIndex + 1) % 3) === false
  );
  for (const inst of Band.instruments) {
    const s = Challenge.buildSession(inst, { questionCount: 5, optionCount: 3, rng });
    check(
      `${inst.name} 可建挑戰局`,
      s.questions.length === 5 && s.questions.every((q) => q.options.length === 3)
    );
  }
})();

check("無頻率欄", !/id="freqDisplay"/.test(html) && !/頻率/.test(html.split("footer")[0]));
check("譜面音在實音標籤之前", html.indexOf("譜面音") < html.indexOf('id="concertFloat"'));
check("譜面音含 pitch-name/solfege", /id="writtenNote"/.test(html) && /class="pitch-name"/.test(html) && /class="solfege"/.test(html));
check("solfege 字級為一半", /\.solfege\s*\{[^}]*font-size:\s*0\.5em/.test(css.replace(/\s+/g, " ")));
check("節拍燈號 4 顆", /id="beatLights"/.test(html) && (html.match(/class="beat-lamp/g) || []).length === 4);
check("節拍燈橘黃樣式", /\.beat-lamp\.beat-1/.test(css) && /\.beat-lamp\.beat-2/.test(css) && /\.on/.test(css));
check("節拍燈間距加 2ch", /gap:\s*calc\(2ch/.test(css));
check("節拍燈跟隨排程", /function scheduleBeatLights/.test(app) && /scheduleBeatLights\(beats/.test(app));
check("有 Tuner", /id="btnTuner"/.test(html));
check("Tuner 標籤為 B♭", /id="tunerLabel">B♭</.test(html) && /tunerLabel\.textContent = "B♭"/.test(app));
check("Tuner 與按鈕水平對齊", /\.tuner-box\s*\{[^}]*display:\s*flex/.test(css.replace(/\s+/g, " ")) && /\.tuner-box\s*\{[^}]*align-items:\s*center/.test(css.replace(/\s+/g, " ")));
check("Tuner 無八度切換", !/name="tunerOctave"/.test(html));
check("每音拍數 1/2/4", /name="beats" value="1"/.test(html) && /value="2"/.test(html) && /value="4"/.test(html));
check("調音固定實音 Bb4", /TUNER_CONCERT_MIDI\s*=\s*70/.test(instrumentsSrc));
check(
  "上行後下行頂音重複",
  JSON.stringify(Timing.buildSequence(3, "both")) === JSON.stringify([0, 1, 2, 2, 1, 0])
);
check("最後一音湊滿小節", Timing.buildBeatPlan(13, 13, 1, "up", "scale")[12] === 4);
check("4/4 小節起始拍", Timing.startBarBeatFromPlan(Timing.buildBeatPlan(8, 8, 1, "up"), 4) === 0);
check("上下行各自收小節", (() => {
  const p = Timing.buildBeatPlan(26, 13, 1, "both", "chromatic");
  return p[12] === 4 && p[25] === 4;
})());
check("長號淡陰影", /\.trombone-svg\s*\{[^}]*drop-shadow/.test(css.replace(/\s+/g, " ")));
const planChromBoth2 = Timing.buildBeatPlan(26, 13, 2, "both", "chromatic");
check("半音階2拍收束為8拍", planChromBoth2[12] === 8 && planChromBoth2[25] === 8);
check("半音階2拍一般音仍2拍", planChromBoth2.slice(0, 12).every((b) => b === 2));
check("半音階2拍總拍為4倍數", planChromBoth2.reduce((a, b) => a + b, 0) % 4 === 0);
check(
  "半音階2拍發音7拍邏輯",
  Timing.toneBeatsForPlanBeats(8, 2, "chromatic") === 7 &&
    Timing.toneBeatsForPlanBeats(2, 2, "chromatic") === 2
);
check("音階2拍末音仍湊小節非8", Timing.buildBeatPlan(8, 8, 2, "up", "scale")[7] !== 8);
check("長笛示意圖檔", fs.existsSync(path.join(root, "assets", "flute-finger-schematic.png")));
check("長笛Bb4參考圖", fs.existsSync(path.join(root, "assets", "flute-finger-Bb4.png")));
check("長笛圖已接入", /flute-finger-schematic\.png/.test(charts) && /fluteBodyMetal/.test(charts) && /fluteKeyGold/.test(charts));
check("長笛 B♭4 指法對齊圖2", /"Bb",\s*"L1",\s*"R1",\s*"Eb"/.test(instrumentsSrc));
check("長笛按下金色", /\.flute-key\.pressed\s*\{[^}]*fluteKeyGold/.test(css.replace(/\s+/g, " ")) || /url\(#fluteKeyGold\)/.test(css));
check("長笛空鍵白色", /\.flute-key\.open\s*\{[^}]*fill:\s*#fff/.test(css.replace(/\s+/g, " ")));
check("長笛固定鐵灰", /\.flute-key-fixed\s*\{[^}]*fill:\s*#4a4f55/.test(css.replace(/\s+/g, " ")));
check("長笛管身金屬漸層", /fluteBodyMetal/.test(charts) && /#d5dce6/.test(charts));
check("長笛起始實音 Bb4", Band.getById("flute").notes[0].concertMidi === 70 && Band.getById("flute").notes[0].writtenMidi === 70);
check(
  "長笛起始指法 Bb·L1·R1·Eb",
  JSON.stringify(Band.getById("flute").notes[0].keys) === JSON.stringify(["Bb", "L1", "R1", "Eb"])
);
check("豎笛AltoTenor左右分欄", /is-ww-split/.test(css) && /clarinet.*altoSax.*tenorSax|wwSplit/.test(app.replace(/\s+/g, " ")));
check("豎笛系譜面音比照小號", /\.stage\.is-ww-split \.pitch-written-wrap \.pitch\.written\s*\{[^}]*clamp\(1\.7rem/.test(css.replace(/\s+/g, " ")));
check("豎笛系靠攏 50px", /translateX\(50px\)/.test(css));
check("豎笛系按鍵外框加粗", /\.stage\.is-ww-split \.ww-svg \.ww-key\s*\{[^}]*stroke-width:\s*3\.8/.test(css.replace(/\s+/g, " ")));
check("長號標題用把位", /practiceKind.*trombone.*把位|ui === "trombone" \? "把位"/.test(app.replace(/\s+/g, " ")));
check("長號把位數字置中", /dominant-baseline="central"/.test(charts) && /labelCy/.test(charts));
check("豎笛水平拉伸10%", /\.ww-clarinet \.ww-svg\.clarinet-chart\s*\{[^}]*scaleX\(1\.1\)/.test(css.replace(/\s+/g, " ")));
check("AltoTenor水平10%垂直-10%", /\.ww-altoSax \.ww-svg\.sax-chart[\s\S]*?scaleX\(1\.1\) scaleY\(0\.9\)/.test(css.replace(/\s+/g, " ")));
check("實音框貼 stage 底部", /id="practiceStage"[\s\S]*?id="concertFloat"/.test(html) && /\.stage\s*\{[^}]*position:\s*relative/.test(css.replace(/\s+/g, " ")));
check("實音框距左下 5px", /\.pitch-concert-float\s*\{[^}]*left:\s*5px/.test(css.replace(/\s+/g, " ")) && /\.pitch-concert-float\s*\{[^}]*bottom:\s*5px/.test(css.replace(/\s+/g, " ")));
check("實音框不攔截指標", /\.pitch-concert-float\s*\{[^}]*pointer-events:\s*none/.test(css.replace(/\s+/g, " ")));
check("實音框不在 fingering-stage 內", /<div class="fingering-stage">\s*<div id="fingeringStage" class="fingering-main"><\/div>\s*<\/div>/.test(html));
check("豎笛黑檀管身", /"ebony"/.test(charts) && /wwBodyMetalDefs\("cl",\s*"ebony"\)/.test(charts));
check("豎笛無管身雙線", /function renderClarinetSvg[\s\S]*?function renderSaxSvg/.test(charts) && !/function renderClarinetSvg[\s\S]*?ww-body-line[\s\S]*?function renderSaxSvg/.test(charts));
check("豎笛按下金色", /\.clarinet-chart \.ww-key\.pressed/.test(css) && /clarinetKeyGold/.test(charts));
check("豎笛空鍵白色", /\.clarinet-chart \.ww-key\.open[\s\S]{0,120}?fill:\s*#fff/.test(css));
check("AltoTenor按鍵同豎笛", /\.sax-chart \.ww-key\.open/.test(css) && /saxKeyGold/.test(charts) && /url\(#saxKeyGold\)/.test(css));
check("豎笛系空按圖例對齊", /\.ww-clarinet \.ww-swatch\.open[\s\S]*?#ffffff/.test(css.replace(/\s+/g, " ")) && /\.ww-altoSax \.ww-swatch\.pressed[\s\S]*?linear-gradient/.test(css.replace(/\s+/g, " ")));
check("無音列標籤", !/>音列</.test(html));
check("音階半音階均分置中", /strip-mode-segmented/.test(html) && /\.strip-mode-segmented\s*\{[^}]*width:\s*100%/.test(css.replace(/\s+/g, " ")) && /grid-template-columns:\s*1fr 1fr/.test(css));
check("音鈕不截斷省略", /text-overflow:\s*clip/.test(css) && !/\.note-chip[^{]*\{[^}]*text-overflow:\s*ellipsis/.test(css.replace(/\s+/g, " ")));
check("首頁副標新文案", /音樂基礎 · 樂器指法\/把位練習/.test(html));
check("選單標題想學習", /今天想學習什麼？/.test(html) && !/今天想練什麼？/.test(html));
check("首頁不顯示點擊開音樂提示", !/點一下頁面即可開啟音樂/.test(html));
check("首頁製作聲明", /home-credit/.test(html) && /吟遊詩人張小熊/.test(html) && /Yamaha/.test(html) && /Tomplay/.test(html));
check("首頁聲明在按鈕下方", /home-credit/.test(html) && /homeGate/.test(html));
check("首頁聲明貼底絕對定位", /\.home-credit\s*\{[^}]*position:\s*absolute/.test(css.replace(/\s+/g, " ")));
check("首頁資產路徑解析", /function assetUrl\(/.test(app) && /assetUrl\("assets\/rachaels-music-logo\.png"\)/.test(app));
check("首頁BGM不在play後load", /勿在 play\(\) 之後再 load\(\)/.test(app) && !(/startHomeBgm\(\)[\s\S]{0,200}homeBgmAudio\.load\(\)/.test(app)));
check("首頁無開啟音樂按鈕", !/btnHomeMusic/.test(html) && !/開啟音樂/.test(html) && !/home-music-btn/.test(css));
check("練習頁 flow-layer.app", /\.flow-layer\.app\s*\{[^}]*position:\s*relative/.test(css.replace(/\s+/g, " ")) && /\.flow-layer\.app\.is-active/.test(css));
check("首頁點擊進入閘門", /id="homeGate"/.test(html) && /點擊進入/.test(html) && /homeGateBlink/.test(css) && /passHomeGate/.test(app));
check("首頁聲明開頁淡入", /\.home-credit\s*\{[^}]*animation:\s*homeFade/.test(css.replace(/\s+/g, " ")));
check("首頁聲明字級縮小3px", /\.home-credit\s*\{[^}]*font-size:\s*clamp\(calc\(0\.68rem - 3px\)/.test(css.replace(/\s+/g, " ")));
check("行動版面斷點", /@media \(max-width:\s*900px\)/.test(css) && /@media \(max-width:\s*640px\)/.test(css) && /@media \(max-width:\s*380px\)/.test(css));
check("viewport-fit cover", /viewport-fit=cover/.test(html));
check("禁手機縮放", /maximum-scale=1/.test(html) && /minimum-scale=1/.test(html) && /user-scalable=no/.test(html) && /lockViewportZoom/.test(app) && /gesturestart/.test(app));
check("單一米色背景", /background:\s*#f0e2d0/.test(css) && !/home-bg\.png/.test(css) && !/radial-gradient/.test(css.match(/\.atmosphere\s*\{[^}]*\}/)?.[0] || ""));
check("樣式快取版本", /styles\.css\?v=/.test(html));
check("導覽上下一行間距", /\.flow-back\s*\{[^}]*margin-top:\s*1em/.test(css.replace(/\s+/g, " ")) && /\.flow-back\s*\{[^}]*margin-bottom:\s*1em/.test(css.replace(/\s+/g, " ")) && /\.basics-nav\s*\{[^}]*margin-top:\s*1em/.test(css.replace(/\s+/g, " ")) && /\.basics-nav\s*\{[^}]*margin-bottom:\s*1em/.test(css.replace(/\s+/g, " ")));
check("CTA玫瑰金按鈕", /--cta-hi:\s*#e6b896/.test(css) && /\.menu-action\s*\{[^}]*var\(--cta-hi\)/.test(css.replace(/\s+/g, " ")) && /\.btn\.primary\s*\{[^}]*var\(--cta-hi\)/.test(css.replace(/\s+/g, " ")));
check("每音拍數三欄均分", /beats-segmented/.test(html) && /grid-template-columns:\s*1fr 1fr 1fr/.test(css));
check("直式木管手機置中", /\.stage\.is-ww-split \.woodwind-view\s*\{[^}]*transform:\s*none/.test(css.replace(/\s+/g, " ")));
check("豎笛viewBox光學置中", /viewBox="-10 0 220 560"/.test(charts));
check("網站圖示 favicon", /rel="icon"/.test(html) && /favicon\.ico\?v=/.test(html) && fs.existsSync(path.join(root, "assets", "favicon.ico")) && fs.existsSync(path.join(root, "assets", "favicon-32.png")) && fs.existsSync(path.join(root, "assets", "apple-touch-icon.png")));
check("根目錄 favicon.ico", fs.existsSync(path.join(root, "favicon.ico")));
check("停用 Jekyll .nojekyll", fs.existsSync(path.join(root, ".nojekyll")));
check("分段選中實體色", /\.segmented input:checked \+ span\s*\{[^}]*background:\s*#e0b070/.test(css.replace(/\s+/g, " ")) && /\.segmented\s*\{[^}]*background:\s*#fff8f0/.test(css.replace(/\s+/g, " ")));
check("選中音鈕實體色", /\.note-chip\.active\s*\{[^}]*background:\s*#e0b070/.test(css.replace(/\s+/g, " ")));
check("開始練習不換行", /#btnPlay\s*\{[^}]*white-space:\s*nowrap/.test(css.replace(/\s+/g, " ")));
check("反覆預設未勾選", /id="loop"/.test(html) && !/<input[^>]*id="loop"[^>]*\bchecked\b/.test(html));
check("反覆標籤記號", /𝄆 反覆 𝄇/.test(html) && !/>\s*循環\s*</.test(html));
check("待機後恢復音訊", /pausedByVisibility/.test(app) && /resumeAudioAfterForeground/.test(app) && /visibilitychange/.test(app));
check("首頁BGM手勢同步play", /手勢當下立刻觸發 play/.test(app) || /passHomeGate/.test(app));
check("進入教室陰影不裁切", /data-layer="home"[^{]*\{[^}]*overflow:\s*visible/.test(css.replace(/\s+/g, " ")) || /\.flow-layer\[data-layer="home"\]\s*\{[^}]*overflow:\s*visible/.test(css.replace(/\s+/g, " ")));
check("進入教室漂浮動畫", /homeEnterFloat/.test(css));
check("首頁 BGM 檔案", fs.existsSync(path.join(root, "assets", "bigger-world-audio-logo.mp3")));
check("首頁 BGM 用 HTMLAudio", /getElementById\("homeBgm"\)/.test(app) && /homeBgmAudio\.play/.test(app) && /id="homeBgm"/.test(html));
check("首頁 BGM 點擊後播放", /passHomeGate/.test(app) && /beginHomeIntro/.test(app) && !/<audio[^>]*\bautoplay\b/.test(html));
check("首頁 BGM 時間軸", /startAt:\s*1\.15/.test(app) && /stopAt:\s*20/.test(app) && !/fadeInEnd:\s*2/.test(app));
check("首頁Logo上浮動畫", /homeRise/.test(css) && /beginHomeIntro/.test(app) && /\.home-hero\.is-intro/.test(css.replace(/\s+/g, " ")));
check("首頁其餘淡入", /homeFade/.test(css) && /\.home-hero\.is-intro \.home-title/.test(css.replace(/\s+/g, " ")));
check("首頁進入教室上浮", /\.home-hero\.is-intro \.home-enter/.test(css.replace(/\s+/g, " ")) && /homeRise/.test(css));
check("進入教室淡出 BGM", /fadeOutHomeBgm/.test(app) && /btnEnterClassroom/.test(app));
check("首頁 BGM 手勢解鎖不略過", /passHomeGate/.test(app) || /手勢當下立刻觸發 play/.test(app));
check("返回首頁不重播 BGM", /homeBgmSessionDone/.test(app) && /showHomeContentWithoutGate/.test(app));
check("Tuner 開啟文字為 Tuner 調音器", /els\.btnTuner\.textContent = "Tuner 調音器"/.test(app) && /Tuner 調音器/.test(html) && !/停止 Tuner/.test(app));
check("Tuner 亮綠燈樣式", /\.btn\.tuner\.active/.test(css) && /#3ddc6a|#1aa84a|rgba\(61,\s*220,\s*106/.test(css));
check("長笛拉伸水平10%垂直15%", /scale\(1\.1,\s*1\.15\)/.test(charts) || /scale\(1\.1,\s*1\.15\)/.test(css));
check("長笛固定框架", /\.flute-chart-frame\s*\{[^}]*aspect-ratio:\s*990\s*\/\s*248/.test(css.replace(/\s+/g, " ")) && /flute-chart-frame/.test(charts));
check("長笛圖例間距加大", /\.ww-flute\s*\{[^}]*gap:\s*calc\(0\.45rem \+ 10px\)/.test(css.replace(/\s+/g, " ")));
check("長笛上緣不裁切", /viewBox="0 0 990 248"/.test(charts) && /translate\(-40,\s*-132\)/.test(charts) && /\.fingering-main\s*\{[^}]*overflow:\s*visible/.test(css.replace(/\s+/g, " ")));
check("長笛拇指座標新圖", /cx="342\.7" cy="295\.7"/.test(charts) && /cx="420\.2" cy="296"/.test(charts));
check("長笛圖例在按鍵圖下方", /family === "flute"[\s\S]*?\$\{svg\}\$\{legend\}/.test(charts.replace(/\s+/g, " ")));
check(
  "長笛 B C C# D 指法",
  JSON.stringify(Band.getById("flute").notes[1].keys) === JSON.stringify(["Bb", "L1", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[2].keys) === JSON.stringify(["L1", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[3].keys) === JSON.stringify(["Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[4].keys) === JSON.stringify(["Bb", "L2", "L3", "R1", "R2", "R3"])
);
check(
  "長笛 D# E F 指法",
  JSON.stringify(Band.getById("flute").notes[5].keys) ===
    JSON.stringify(["Bb", "L2", "L3", "R1", "R2", "R3", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[6].keys) ===
      JSON.stringify(["Bb", "L1", "L2", "L3", "R1", "R2", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[7].keys) ===
      JSON.stringify(["Bb", "L1", "L2", "L3", "R1", "Eb"])
);
check(
  "長笛 F# G G# A Bb 指法",
  JSON.stringify(Band.getById("flute").notes[8].keys) ===
    JSON.stringify(["Bb", "L1", "L2", "L3", "R3", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[9].keys) ===
      JSON.stringify(["Bb", "L1", "L2", "L3", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[10].keys) ===
      JSON.stringify(["Bb", "L1", "L2", "L3", "Ab", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[11].keys) ===
      JSON.stringify(["Bb", "L1", "L2", "Eb"]) &&
    JSON.stringify(Band.getById("flute").notes[12].keys) ===
      JSON.stringify(["Bb", "L1", "R1", "Eb"])
);

/** 4/4 拍值計畫：直接測 PracticeTiming seam（不再 fork 一份邏輯） */
const planChromBoth1 = Timing.buildBeatPlan(26, 13, 1, "both");
check("半音階1拍上行後下行長度26", planChromBoth1.length === 26);
check("上行末（頂音）長音4拍", planChromBoth1[12] === 4);
check("下行首音仍1拍（頂音重複）", planChromBoth1[13] === 1);
check("下行末長音4拍", planChromBoth1[25] === 4);
check("總拍數為4的倍數(chrom both 1)", planChromBoth1.reduce((a, b) => a + b, 0) % 4 === 0);
check(
  "小節型態對齊 C…B | C---- | C B…",
  planChromBoth1.slice(0, 12).every((b) => b === 1) &&
    planChromBoth1[12] === 4 &&
    planChromBoth1.slice(13, 25).every((b) => b === 1)
);

const plan4 = Timing.buildBeatPlan(26, 13, 4, "both");
check("每音4拍時上下行末亦為4", plan4[12] === 4 && plan4[25] === 4 && plan4.every((b) => b === 4));

const planUp1 = Timing.buildBeatPlan(13, 13, 1, "up");
check("僅上行：僅末音長音", planUp1[12] === 4 && planUp1.slice(0, 12).every((b) => b === 1));

check("1拍第5音起於強拍", Timing.startBarBeatFromPlan(planChromBoth1, 4) === 0);
check("頂音長音後下行起於強拍", Timing.startBarBeatFromPlan(planChromBoth1, 13) === 0);
check("2拍第2音起於拍2", Timing.startBarBeatFromPlan(Timing.buildBeatPlan(8, 8, 2, "up"), 1) === 2);

for (const inst of Band.instruments) {
  const expected = 70 + (inst.transpose || 0);
  check(
    `${inst.name} Tuner 記譜 = Bb4+transpose`,
    inst.tunerWrittenMidi === expected,
    `got ${inst.tunerWrittenMidi}, want ${expected}`
  );
}
check("Trumpet Tuner 記譜 C5", Band.getById("trumpet").tunerWrittenMidi === 72);
check("活塞按下為金色光暈", /\.piston\.down \.finger-button/.test(css) && /0 0 18px rgba\(199, 146, 62/.test(css));
check("未按下為銀色", /#c5ccd4/.test(css));
check("PracticeTiming 含 noteDurationSec", typeof Timing.noteDurationSec === "function");
check("60BPM×4拍=4秒", Timing.noteDurationSec(60, 4) === 4);
check("拍長公式", Timing.noteDurationSec(120, 2) === 1);

// —— 首頁 Logo/語言/聲音 ——
const logoPath = path.join(root, "assets", "rachaels-music-logo.png");
check("Logo 檔存在", fs.existsSync(logoPath));
check("首頁有 Logo", /class="home-logo"/.test(html) && /rachaels-music-logo\.png/.test(html));
check("Logo CSS 置中", /\.home-logo/.test(css) && /margin:\s*0 auto/.test(css));
check("Logo 含透明通道", (() => {
  const buf = fs.readFileSync(logoPath);
  if (buf[0] !== 0x89 || buf.toString("ascii", 1, 4) !== "PNG") return false;
  const colorType = buf[25];
  return colorType === 6 || buf.includes(Buffer.from("tRNS"));
})());
check("首頁無舊橫式文字 Logo 拼貼", !/Rachael's Music<\/h1>/.test(html) && !/home-logo-text/.test(html));
check("無陳瑞婷藏譜字樣", !/陳瑞婷藏譜/.test(html) && !/collections/i.test(html.split("BASICS")[0] || html));
check("樂器名無降B調", Band.instruments.every((i) => !/降\s*B/.test(i.nameZh)));
check("豎笛/小號中文名", Band.getById("clarinet").nameZh === "豎笛" && Band.getById("trumpet").nameZh === "小號");
check("頁面語言 zh-Hant", /lang="zh-Hant"/.test(html));
check("節拍器強弱拍頻率", /accent \? 1600 : 900/.test(app) || /1600/.test(app) && /900/.test(app));
check("音訊手勢同步解鎖", /function ensureAudioSync/.test(app) && /ensureAudioSync\(\)/.test(app));
check("速度晶片含中英同字體", /tempo-chip-name/.test(app) && /tempo-chip-name/.test(css));
check("速度手機上3下2置中", /\.tempo-chip:nth-child\(4\)/.test(css) && /grid-column:\s*2\s*\/\s*4/.test(css.replace(/\s+/g, " ")) && /\.tempo-chip:nth-child\(5\)/.test(css));
check("選樂器後捲至練習頁頂", /function scrollPracticeTitleToTop/.test(app) && /scrollTo/.test(app) && /scrollPracticeTitleToTop\(\)/.test(app));
check("練習頁上方縮邊", /\.flow-layer\.app[\s\S]*?padding:\s*max\(0\.45rem/.test(css) || /\.app\s*\{[^}]*padding:\s*0\.35rem\s+0/.test(css.replace(/\s+/g, " ")));
check("練習發聲不 await 後才 tick", /els\.btnPlay\.textContent = "暫停";\s*\/\/[^\n]*\s*tick\(\);/.test(app) || /暫停";\s*\/\/ 必須在使用者手勢[\s\S]*?tick\(\);/.test(app));
check("首頁BGM不預建WebAudio", /首頁 BGM 只用 HTMLAudio|勿在此建立 Web Audio/.test(app));
check("stopPracticeTone不清節拍器", /function stopPracticeTone[\s\S]*?function playPracticeTone/.test(app) && !/function stopPracticeTone[\s\S]*?clearMetronome\(\)[\s\S]*?function playPracticeTone/.test(app));
check("Tuner 實音 Bb4 Hz", Math.abs(Band.midiToHz(70) - 442 * 2 ** (1 / 12)) < 1e-9);
check("A4=442 與 Bb4 關係", Math.abs(Band.midiToHz(70) / Band.midiToHz(69) - Math.pow(2, 1 / 12)) < 1e-9);
check("上行後下行長度=2n", Timing.buildSequence(8, "both").length === 16);
check("4/4 強拍判定", (() => {
  const p = Timing.buildBeatPlan(8, 8, 1, "up");
  return (
    Timing.startBarBeatFromPlan(p, 0) === 0 &&
    Timing.startBarBeatFromPlan(p, 3) === 3 &&
    Timing.startBarBeatFromPlan(p, 4) === 0
  );
})());
check("planSession 對齊 sequence+plan", (() => {
  const s = Timing.planSession({ noteCount: 13, direction: "both", noteMode: "chromatic", noteBeats: 1 });
  return s.sequence.length === 26 && s.beatPlan.length === 26 && s.beatPlan[12] === 4;
})());

console.log("");
console.log(`自檢完成：${passed} 通過，${failed} 失敗`);
if (failed) process.exitCode = 1;
