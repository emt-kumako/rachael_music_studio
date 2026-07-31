/**
 * 管樂半音階練習 — 樂器資料
 * 練習音域 = scaleWrittenMidi（記譜上下限）；播放為實音
 * 調音一律實音 B♭4（記譜＝B♭4＋transpose；Bb 管即 C5）
 * ui: valves | trombone | woodwind | piano | horn
 * wwFamily: flute | clarinet | sax
 */

window.BandInstruments = (function () {
  /** 主拼法（黑鍵以常見降號/升號擇一；顯示時再補異名） */
  const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

  /** 異名同音顯示（升/降並陳） */
  const ENHARMONIC = {
    "C♯": "D♭",
    "D♭": "C♯",
    "D♯": "E♭",
    "E♭": "D♯",
    "F♯": "G♭",
    "G♭": "F♯",
    "G♯": "A♭",
    "A♭": "G♯",
    "A♯": "B♭",
    "B♭": "A♯",
  };

  const SOLFEGE = {
    C: { solfege: "do", jianpu: "1" },
    "C♯": { solfege: "♯do/♭re", jianpu: "♯1/♭2" },
    "D♭": { solfege: "♯do/♭re", jianpu: "♯1/♭2" },
    D: { solfege: "re", jianpu: "2" },
    "D♯": { solfege: "♯re/♭mi", jianpu: "♯2/♭3" },
    "E♭": { solfege: "♯re/♭mi", jianpu: "♯2/♭3" },
    E: { solfege: "mi", jianpu: "3" },
    F: { solfege: "fa", jianpu: "4" },
    "F♯": { solfege: "♯fa/♭sol", jianpu: "♯4/♭5" },
    "G♭": { solfege: "♯fa/♭sol", jianpu: "♯4/♭5" },
    G: { solfege: "sol", jianpu: "5" },
    "G♯": { solfege: "♯sol/♭la", jianpu: "♯5/♭6" },
    "A♭": { solfege: "♯sol/♭la", jianpu: "♯5/♭6" },
    A: { solfege: "la", jianpu: "6" },
    "A♯": { solfege: "♯la/♭si", jianpu: "♯6/♭7" },
    "B♭": { solfege: "♯la/♭si", jianpu: "♯6/♭7" },
    B: { solfege: "si", jianpu: "7" },
  };

  function midiToName(midi, octaveOffset = 0) {
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1 + octaveOffset;
    return { name, octave, label: name + octave };
  }

  function displayPitchName(name) {
    const alt = ENHARMONIC[name];
    return alt ? `${name}/${alt}` : name;
  }

  function solfegeFor(name) {
    return SOLFEGE[name] || { solfege: "?", jianpu: "?" };
  }

  function writtenToConcert(writtenMidi, transpose) {
    return writtenMidi - transpose;
  }

  /** Bb 管三閥：一組八度內主用指法（各八度共用） */
  const BB_BRASS_VALVES = [
    { valves: [] }, // B♭ / written C
    { valves: [1, 2, 3] }, // B
    { valves: [1, 3] }, // C
    { valves: [2, 3] }, // D♭/C♯
    { valves: [1, 2] }, // D
    { valves: [1] }, // E♭
    { valves: [2] }, // E
    { valves: [] }, // F
    { valves: [2, 3] }, // G♭/F♯
    { valves: [1, 2] }, // G
    { valves: [1] }, // A♭
    { valves: [2] }, // A
    { valves: [] }, // B♭
  ];

  /**
   * 法國號 F 管指法＝圖中橘色按鍵（白＝空鍵、橘＝按下）
   * 記譜 F3→F4/實音 B♭2→B♭3（F 管移調＋7）
   * F3→B3、C4→F4 皆已對上傳圖橘色（F）列
   */
  const HORN_F_VALVES = [
    { valves: [1] }, // F3
    { valves: [2] }, // F♯
    { valves: [] }, // G
    { valves: [2, 3] }, // G♯/A♭
    { valves: [1, 2] }, // A
    { valves: [1] }, // A♯/B♭
    { valves: [2] }, // B
    { valves: [] }, // C4
    { valves: [1, 2] }, // C♯
    { valves: [1] }, // D
    { valves: [2] }, // D♯/E♭
    { valves: [] }, // E
    { valves: [1] }, // F4
  ];

  /** 全員調音固定實音 B♭4 → 記譜 = 實音 + transpose（Bb 管即 C5） */
  const TUNER_CONCERT_MIDI = 70;
  function tunerWrittenFromTranspose(transpose) {
    return TUNER_CONCERT_MIDI + transpose;
  }

  /**
   * Tenor Trombone 實音 B♭2→B♭3 主用把位
   * （低音區常用 1–7；B2 多為 7 把位）
   */
  const TROMBONE_POS_BB2 = [1, 7, 6, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1];

  /**
   * Flute 記譜 B♭4→B♭5（中高音域主用）
   * Cs = 右手小指 C♯鍵
   */
  const FLUTE_KEYS = [
    ["Bb", "L1", "R1", "Eb"], // B♭4
    ["Bb", "L1", "Eb"], // B4
    ["L1", "Eb"], // C5
    ["Eb"], // C♯5
    ["Bb", "L2", "L3", "R1", "R2", "R3"], // D5
    ["Bb", "L2", "L3", "R1", "R2", "R3", "Eb"], // D♯/E♭5（圖1：拇指B♭槓·L2·L3·R123·E♭；L1/G♯開）
    ["Bb", "L1", "L2", "L3", "R1", "R2", "Eb"], // E5（圖：拇指B♭槓·L123·R12·E♭）
    ["Bb", "L1", "L2", "L3", "R1", "Eb"], // F5（圖：拇指B♭槓·L123·R1·E♭）
    ["Bb", "L1", "L2", "L3", "R3", "Eb"], // F♯5（圖：拇指B♭槓·L123·R3·E♭）
    ["Bb", "L1", "L2", "L3", "Eb"], // G5
    ["Bb", "L1", "L2", "L3", "Ab", "Eb"], // G♯/A♭5
    ["Bb", "L1", "L2", "Eb"], // A5
    ["Bb", "L1", "R1", "Eb"], // A♯/B♭5
  ];

  /**
   * Clarinet 記譜 C4→C5（主用指法，略過 Alternate）
   */
  const CLARINET_KEYS = [
    ["T", "L1", "L2", "L3"], // C4
    ["T", "L1", "L2", "L3", "Cs"], // C♯
    ["T", "L1", "L2"], // D
    ["T", "L1", "L2", "L3", "LLowC"], // D♯/E♭（圖1：左123＋左小指最下鍵）
    ["T", "L1"], // E
    ["T"], // F
    ["L2"], // F♯
    [], // G
    ["Gs"], // G♯（圖2：L1 右上喉鍵）
    ["A"], // A（圖2：喉音 A）
    ["Reg", "A"], // A♯/B♭（圖2：泛音鍵＋A）
    ["Reg", "T", "L1", "L2", "L3", "R1", "R2", "R3", "Trill3"], // B（右側鍵叢由下數第 2）
    ["Reg", "T", "L1", "L2", "L3", "R1", "R2", "R3", "LowC"], // C5（圖4）
  ];

  /**
   * 薩克斯指法（對照全音域指法表主用）
   * Oct=八度鍵；L1–L3 左手；Bis；R1–R3 右手；Gs；SideBb；LowEb/LowC/LowCs
   */

  /**
   * 中音：記譜 G4→G5（調音＝記譜 G4/實音 B♭3）
   * 指法對齊上傳圖 1 之 G → 圖 2 之 G（按鍵位置同圖）
   */
  const ALTO_KEYS_G4_G5 = [
    ["L1", "L2", "L3"], // G4 調音（實音 B♭3）— 圖 1 G
    ["L1", "L2", "L3", "Gs"], // G♯
    ["L1", "L2"], // A
    ["L1", "L2", "SideBb"], // B♭（圖：Alternate Bb＝1·2·側B♭）
    ["L1"], // B
    ["L2"], // C5
    [], // C♯
    ["Oct", "L1", "L2", "L3", "R1", "R2", "R3"], // D5
    ["Oct", "L1", "L2", "L3", "R1", "R2", "R3", "LowEb"], // E♭
    ["Oct", "L1", "L2", "L3", "R1", "R2"], // E
    ["Oct", "L1", "L2", "L3", "R1"], // F
    ["Oct", "L1", "L2", "L3", "R2"], // F♯
    ["Oct", "L1", "L2", "L3"], // G5 — 圖 2 G
  ];

  /**
   * 次中音：記譜 C4→C5（調音＝記譜 C4/實音 B♭2）
   * 指法對齊圖 1 之 C → 圖 2 之 C
   */
  const TENOR_KEYS_C4_C5 = [
    ["L1", "L2", "L3", "R1", "R2", "R3", "LowC"], // C4 調音（實音 B♭2）
    ["L1", "L2", "L3", "R1", "R2", "R3", "LowCs"], // C♯
    ["L1", "L2", "L3", "R1", "R2", "R3"], // D
    ["L1", "L2", "L3", "R1", "R2", "R3", "LowEb"], // E♭
    ["L1", "L2", "L3", "R1", "R2"], // E
    ["L1", "L2", "L3", "R1"], // F
    ["L1", "L2", "L3", "R2"], // F♯
    ["L1", "L2", "L3"], // G
    ["L1", "L2", "L3", "Gs"], // G♯
    ["L1", "L2"], // A
    ["L1", "Bis"], // B♭
    ["L1"], // B
    ["L2"], // C5
  ];

  const KEY_LABEL_ZH = {
    Oct: "八度",
    PalmD: "掌D",
    PalmEb: "掌E♭",
    PalmF: "掌F",
    T: "拇指孔",
    Reg: "泛音鍵",
    A: "A鍵",
    L1: "L1",
    L2: "L2",
    L3: "L3",
    Bis: "Bis",
    R1: "R1",
    R2: "R2",
    R3: "R3",
    FrontF: "前F",
    Gs: "G♯",
    sideBb: "側B♭",
    SideBb: "側B♭",
    SideC: "側C",
    SideE: "高E",
    MidR1: "中右上",
    MidDot1: "中右·1",
    MidDot2: "中右·2",
    Cs: "C♯鍵",
    EbSide: "側E♭",
    LPinky1: "左小指1",
    LPinky2: "左小指2",
    LPinky3: "左小指3",
    LLowC: "左低C",
    Trill2: "右顫2",
    Trill3: "右顫3",
    Trill4: "右顫4",
    RPinkyTL: "右小指上左",
    RPinkyTR: "右小指上右",
    RPinkyBL: "右小指下左",
    LowEb: "低E♭",
    LowC: "低C",
    LowCs: "低C♯",
    LowB: "低B",
    Bb: "拇指B♭",
    BbTrill: "B♭顫音",
    Eb: "E♭鍵",
    Ab: "A♭鍵",
  };

  function keysLabel(keys) {
    if (!keys || keys.length === 0) return "開管";
    return keys.map((k) => KEY_LABEL_ZH[k] || k).join(" · ");
  }

  function valvesLabel(valves) {
    if (!valves || valves.length === 0) return "開管（0）";
    return `活塞 ${valves.join("·")}`;
  }

  function wwNote(keys) {
    return { keys: keys.slice(), label: keysLabel(keys) };
  }

  /**
   * 依記譜練習音域建半音階（13 音）
   * concertStart/End = scaleWritten - transpose
   */
  function buildScale(transpose, scaleWrittenMidi, fingeringAtIndex, writtenOctaveOffset = 0) {
    const concertStart = writtenToConcert(scaleWrittenMidi[0], transpose);
    const concertEnd = writtenToConcert(scaleWrittenMidi[1], transpose);
    const notes = [];
    for (let concertMidi = concertStart; concertMidi <= concertEnd; concertMidi++) {
      const i = concertMidi - concertStart;
      const writtenMidi = concertMidi + transpose;
      const concert = midiToName(concertMidi);
      const written = midiToName(writtenMidi, writtenOctaveOffset);
      const sg = solfegeFor(written.name);
      const fingering = fingeringAtIndex(i, written, concert, concertMidi);
      notes.push({
        concertMidi,
        writtenMidi,
        concertName: concert.name,
        concertNameDisplay: displayPitchName(concert.name),
        concertOctave: concert.octave,
        concertLabel: concert.label,
        writtenName: written.name,
        writtenNameDisplay: displayPitchName(written.name),
        writtenOctave: written.octave,
        writtenLabel: written.label,
        solfege: sg.solfege,
        jianpu: sg.jianpu,
        ...fingering,
      });
    }
    return notes;
  }

  function makeInstrument(def) {
    const {
      id,
      name,
      nameZh,
      transpose,
      ui,
      wwFamily,
      scaleWrittenMidi,
      fingeringAtIndex,
      showValve4,
      writtenOctaveOffset = 0,
    } = def;
    const scalePair = scaleWrittenMidi;
    const tunerWrittenMidi = tunerWrittenFromTranspose(transpose);
    const notes = buildScale(transpose, scalePair, fingeringAtIndex, writtenOctaveOffset);
    const concertStart = writtenToConcert(scalePair[0], transpose);
    const concertEnd = writtenToConcert(scalePair[1], transpose);
    return {
      id,
      name,
      nameZh,
      transpose,
      ui,
      wwFamily,
      showValve4,
      scaleWrittenMidi: scalePair,
      tunerWrittenMidi,
      writtenOctaveOffset,
      concertStart,
      concertEnd,
      notes,
    };
  }

  const instruments = [
    makeInstrument({
      id: "flute",
      name: "Flute",
      nameZh: "長笛",
      transpose: 0,
      ui: "woodwind",
      wwFamily: "flute",
      scaleWrittenMidi: [70, 82], // 練習 B♭4–B♭5
      fingeringAtIndex: (i) => wwNote(FLUTE_KEYS[i]),
    }),
    makeInstrument({
      id: "clarinet",
      name: "Clarinet",
      nameZh: "豎笛",
      transpose: 2,
      ui: "woodwind",
      wwFamily: "clarinet",
      scaleWrittenMidi: [60, 72], // 練習 C4–C5
      fingeringAtIndex: (i) => wwNote(CLARINET_KEYS[i]),
    }),
    makeInstrument({
      id: "altoSax",
      name: "Alto Sax.",
      nameZh: "中音薩克斯風",
      transpose: 9,
      ui: "woodwind",
      wwFamily: "sax",
      scaleWrittenMidi: [67, 79], // 練習 G4–G5
      fingeringAtIndex: (i) => wwNote(ALTO_KEYS_G4_G5[i]),
    }),
    makeInstrument({
      id: "tenorSax",
      name: "Tenor Sax.",
      nameZh: "次中音薩克斯風",
      transpose: 14,
      ui: "woodwind",
      wwFamily: "sax",
      scaleWrittenMidi: [60, 72], // 練習 C4–C5
      fingeringAtIndex: (i) => wwNote(TENOR_KEYS_C4_C5[i]),
    }),
    makeInstrument({
      id: "horn",
      name: "French Horn",
      nameZh: "法國號",
      // 記譜 F3（譜號下三線）→ 實音 B♭2；記譜 F4（第一間）→ 實音 B♭3
      transpose: 7,
      ui: "horn",
      scaleWrittenMidi: [53, 65], // 練習 F3–F4
      fingeringAtIndex: (i) => {
        const f = HORN_F_VALVES[i];
        return { valves: f.valves, valve4: false, label: valvesLabel(f.valves) };
      },
    }),
    makeInstrument({
      id: "trumpet",
      name: "Trumpet",
      nameZh: "小號",
      transpose: 2,
      ui: "valves",
      scaleWrittenMidi: [60, 72], // 練習 C4–C5
      fingeringAtIndex: (i) => {
        const f = BB_BRASS_VALVES[i];
        return { valves: f.valves, valve4: false, label: valvesLabel(f.valves) };
      },
    }),
    makeInstrument({
      id: "trombone",
      name: "Trombone",
      nameZh: "長號",
      transpose: 0,
      ui: "trombone",
      scaleWrittenMidi: [46, 58], // 練習 B♭2–B♭3
      fingeringAtIndex: (i) => {
        const pos = TROMBONE_POS_BB2[i];
        return { position: pos, label: `第 ${pos} 把位` };
      },
    }),
    makeInstrument({
      id: "euphonium",
      name: "Euphonium",
      nameZh: "上低音號",
      transpose: 0,
      ui: "valves",
      showValve4: false,
      scaleWrittenMidi: [46, 58], // 練習 B♭2–B♭3
      fingeringAtIndex: (i) => {
        const f = BB_BRASS_VALVES[i];
        return { valves: f.valves, valve4: false, label: valvesLabel(f.valves) };
      },
    }),
    makeInstrument({
      id: "tuba",
      name: "Tuba",
      nameZh: "低音號",
      transpose: 0,
      ui: "valves",
      showValve4: false,
      scaleWrittenMidi: [34, 46], // 練習 B♭1–B♭2
      fingeringAtIndex: (i) => {
        const f = BB_BRASS_VALVES[i];
        return { valves: f.valves, valve4: false, label: valvesLabel(f.valves) };
      },
    }),
    makeInstrument({
      id: "piano",
      name: "Piano",
      nameZh: "鍵盤",
      transpose: 0,
      ui: "piano",
      scaleWrittenMidi: [58, 70], // 練習 B♭3–B♭4
      fingeringAtIndex: (i, written, concert, concertMidi) => ({
        pianoMidi: concertMidi,
        label: `琴鍵 ${displayPitchName(concert.name)}${concert.octave}`,
      }),
    }),
  ];

  /** 以記譜主音為根的大調音級（0–11） */
  function majorScalePitchClasses(tonicMidi) {
    const tonic = ((tonicMidi % 12) + 12) % 12;
    return new Set([0, 2, 4, 5, 7, 9, 11].map((d) => (tonic + d) % 12));
  }

  /**
   * 音階練習／指法挑戰共用：以音域起始記譜音為主音的大調音級，
   * 過濾該樂器 notes（音域上下限不變）。
   */
  function scaleNotes(instrument) {
    const all = (instrument && instrument.notes) || [];
    if (!all.length) return [];
    const deg = majorScalePitchClasses(all[0].writtenMidi);
    return all.filter((n) => deg.has(((n.writtenMidi % 12) + 12) % 12));
  }

  return {
    A4_HZ: 442,
    NOTE_NAMES,
    ENHARMONIC,
    TEMPO_MARKS: [
      { id: "largo", name: "Largo", nameZh: "廣板", bpm: 50 },
      { id: "adagio", name: "Adagio", nameZh: "慢板", bpm: 70 },
      { id: "andante", name: "Andante", nameZh: "行板", bpm: 88 },
      { id: "moderato", name: "Moderato", nameZh: "中板", bpm: 108 },
      { id: "allegro", name: "Allegro", nameZh: "快板", bpm: 120 },
    ],
    instruments,
    getById(id) {
      return instruments.find((x) => x.id === id) || instruments[0];
    },
    midiToName,
    displayPitchName,
    solfegeFor,
    writtenToConcert,
    majorScalePitchClasses,
    scaleNotes,
    midiToHz(midi, a4 = 442) {
      return a4 * 2 ** ((midi - 69) / 12);
    },
  };
})();
