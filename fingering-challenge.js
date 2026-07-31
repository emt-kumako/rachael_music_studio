/**
 * FingeringChallenge — 指法挑戰純計算（無 DOM／音訊）
 * 看譜面音 → 多選一指法；音池為該樂器大調音階音。
 */
window.FingeringChallenge = (function () {
  function majorScalePitchClasses(tonicMidi) {
    const tonic = ((tonicMidi % 12) + 12) % 12;
    return new Set([0, 2, 4, 5, 7, 9, 11].map((d) => (tonic + d) % 12));
  }

  /** 與音階練習相同：以音域起始記譜音為主音的大調音級 */
  function scaleNotes(instrument) {
    const all = (instrument && instrument.notes) || [];
    if (!all.length) return [];
    const deg = majorScalePitchClasses(all[0].writtenMidi);
    return all.filter((n) => deg.has(((n.writtenMidi % 12) + 12) % 12));
  }

  function fingeringFingerprint(note) {
    if (!note) return "empty";
    if (Array.isArray(note.keys)) {
      return `keys:${[...note.keys].map(String).sort().join("|")}`;
    }
    if (note.position != null && note.position !== undefined) {
      return `pos:${note.position}`;
    }
    if (Array.isArray(note.valves)) {
      const v = [...note.valves].sort((a, b) => a - b).join(",");
      return `valves:${v}|4:${note.valve4 ? 1 : 0}`;
    }
    return `midi:${note.writtenMidi}`;
  }

  function shuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /**
   * @param {object[]} notes 音階音
   * @param {{ prompt?: object, optionCount?: number, rng?: () => number }} [opts]
   */
  function buildQuestion(notes, opts = {}) {
    const optionCount = opts.optionCount || 3;
    const rng = opts.rng || Math.random;
    if (!notes || notes.length < 1) {
      return { prompt: null, options: [], correctIndex: -1 };
    }
    const correct = opts.prompt || notes[Math.floor(rng() * notes.length)];
    const correctFp = fingeringFingerprint(correct);
    const distractors = [];
    const seenFp = new Set([correctFp]);
    for (const n of shuffle(
      notes.filter((x) => x !== correct),
      rng
    )) {
      const fp = fingeringFingerprint(n);
      if (seenFp.has(fp)) continue;
      seenFp.add(fp);
      distractors.push(n);
      if (distractors.length >= optionCount - 1) break;
    }
    // 獨特指法不足時，以不同譜面音補滿（極少數樂器／音階）
    if (distractors.length < optionCount - 1) {
      for (const n of shuffle(
        notes.filter((x) => x !== correct && !distractors.includes(x)),
        rng
      )) {
        distractors.push(n);
        if (distractors.length >= optionCount - 1) break;
      }
    }
    const options = shuffle([correct, ...distractors.slice(0, optionCount - 1)], rng);
    return {
      prompt: correct,
      options,
      correctIndex: options.findIndex((n) => n === correct),
    };
  }

  /**
   * @param {object} instrument BandInstruments 樂器
   * @param {{ questionCount?: number, optionCount?: number, rng?: () => number }} [opts]
   */
  function buildSession(instrument, opts = {}) {
    const questionCount = opts.questionCount || 5;
    const optionCount = opts.optionCount || 3;
    const rng = opts.rng || Math.random;
    const notes = scaleNotes(instrument);
    if (!notes.length) {
      return { instrumentId: instrument && instrument.id, questions: [] };
    }
    const prompts = shuffle(notes, rng);
    const questions = [];
    for (let i = 0; i < questionCount; i++) {
      questions.push(
        buildQuestion(notes, {
          prompt: prompts[i % prompts.length],
          optionCount,
          rng,
        })
      );
    }
    return { instrumentId: instrument.id, questions };
  }

  function grade(question, chosenIndex) {
    if (!question || question.correctIndex < 0) return false;
    return Number(chosenIndex) === question.correctIndex;
  }

  return {
    scaleNotes,
    fingeringFingerprint,
    buildQuestion,
    buildSession,
    grade,
  };
})();
