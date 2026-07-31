/**
 * PracticeTiming — 練習序列／4/4 拍值計畫／音長（純計算，無 DOM）
 * 呼叫端傳入數字與方向；此 module 不讀取 UI。
 */
window.PracticeTiming = (function () {
  /**
   * @param {number} noteCount
   * @param {"up"|"down"|"both"} direction
   * @returns {number[]} 音列索引序列
   */
  function buildSequence(noteCount, direction) {
    const n = Math.max(0, Number(noteCount) || 0);
    const ascending = Array.from({ length: n }, (_, i) => i);
    const descending = Array.from({ length: n }, (_, i) => n - 1 - i);
    if (direction === "up") return ascending;
    if (direction === "down") return descending;
    // 上行後下行：頂音重複（如 C…C, C…C）
    return ascending.concat(descending);
  }

  /**
   * 4/4 拍號：一般音＝所選音值。
   * 上行段落末、下行段落末（及單向練習的最後一音）以長音湊滿當下小節。
   * 半音階＋音長 2 拍：末音（各段收束）改為 8 拍時值＝長音 7 拍＋第 8 拍休止（節拍器仍打）。
   */
  function buildBeatPlan(seqLen, noteCount, noteBeats, direction, noteMode = "chromatic") {
    const D = noteBeats;
    const ends = new Set();
    if (seqLen < 1) return [];
    if (direction === "both" && noteCount > 0 && seqLen === noteCount * 2) {
      ends.add(noteCount - 1);
      ends.add(seqLen - 1);
    } else {
      ends.add(seqLen - 1);
    }
    const chromTwoBeatHold = noteMode === "chromatic" && D === 2;
    const plan = [];
    let cum = 0;
    for (let i = 0; i < seqLen; i++) {
      let b = D;
      if (ends.has(i)) {
        b = chromTwoBeatHold ? 8 : 4 - (cum % 4);
      }
      plan.push(b);
      cum += b;
    }
    return plan;
  }

  /** 本音在 4/4 小節內的起始拍（0=強拍），依實際拍值計畫累加 */
  function startBarBeatFromPlan(plan, seqPos) {
    let prior = 0;
    for (let i = 0; i < seqPos && i < plan.length; i++) prior += plan[i];
    return prior % 4;
  }

  function beatsAt(plan, seqPos, fallback) {
    return plan[seqPos] ?? fallback;
  }

  /** 半音階 2 拍收束：計畫 8 拍中，發音 7 拍、第 8 拍休止 */
  function toneBeatsForPlanBeats(planBeats, noteBeats, noteMode) {
    if (noteMode === "chromatic" && noteBeats === 2 && planBeats === 8) return 7;
    return planBeats;
  }

  function noteDurationSec(bpm, beats) {
    return (60 / Number(bpm)) * beats;
  }

  /**
   * 一次產出整段練習的序列與拍值計畫。
   * @param {{ noteCount: number, direction: string, noteMode?: string, noteBeats: number }} opts
   */
  function planSession({ noteCount, direction, noteMode = "chromatic", noteBeats }) {
    const sequence = buildSequence(noteCount, direction);
    const beatPlan = buildBeatPlan(sequence.length, noteCount, noteBeats, direction, noteMode);
    return { sequence, beatPlan };
  }

  /**
   * 序列中某一步的時值細節（給 playback adapter）。
   */
  function stepTiming({ beatPlan, seqPos, noteBeats, noteMode, bpm }) {
    const planBeats = beatsAt(beatPlan, seqPos, noteBeats);
    const toneBeats = toneBeatsForPlanBeats(planBeats, noteBeats, noteMode);
    const startBarBeat = startBarBeatFromPlan(beatPlan, seqPos);
    const beatSec = 60 / Number(bpm);
    return {
      planBeats,
      toneBeats,
      startBarBeat,
      beatSec,
      durationSec: noteDurationSec(bpm, planBeats),
      toneDurationSec: noteDurationSec(bpm, toneBeats),
    };
  }

  return {
    buildSequence,
    buildBeatPlan,
    startBarBeatFromPlan,
    beatsAt,
    toneBeatsForPlanBeats,
    noteDurationSec,
    planSession,
    stepTiming,
  };
})();
