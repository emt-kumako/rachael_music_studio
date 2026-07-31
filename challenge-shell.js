/**
 * ChallengeShell — 指法挑戰 UI 流程殼（無 DOM）
 * open / start / answer / advance / replay / reset；畫面經 render(viewModel)，
 * 副作用經 haltAudio / goChallenge / playCue / playTone。
 * 題庫／評分委派 FingeringChallenge（經 adapters）。
 */
window.ChallengeShell = (function () {
  /**
   * @param {{
   *   getInstrument: (id: string) => object,
   *   buildSession: (instrument: object, opts?: object) => { questions: object[] },
   *   grade: (question: object, chosenIndex: number) => boolean,
   *   chartHtml: (instrument: object, note: object) => string,
   *   displayPitchName: (name: string) => string,
   *   render: (vm: object) => void,
   *   haltAudio: () => void,
   *   goChallenge: () => void,
   *   playCue: (kind: string) => void,
   *   playTone: (concertMidi: number) => void,
   * }} adapters
   */
  function create(adapters) {
    const state = {
      instrumentId: null,
      session: null,
      qIndex: 0,
      score: 0,
      awaitingNext: false,
    };

    function instrument() {
      return adapters.getInstrument(state.instrumentId);
    }

    function currentQuestion() {
      return state.session?.questions?.[state.qIndex] || null;
    }

    function isLastQuestion() {
      const total = state.session?.questions?.length || 0;
      return total > 0 && state.qIndex + 1 >= total;
    }

    function chartFor(note) {
      const inst = instrument();
      if (!note) return "";
      try {
        return adapters.chartHtml(inst, note) || "";
      } catch (_) {
        return "";
      }
    }

    function writtenHtmlFor(note) {
      if (!note) return "";
      const writtenLabel =
        note.writtenNameDisplay || adapters.displayPitchName(note.writtenName || "");
      return `<span class="pitch-name">${writtenLabel}</span><span class="solfege">(${note.solfege}, ${note.jianpu})</span>`;
    }

    function optionsVm(q, marks) {
      if (!q?.options) return [];
      return q.options.map((note, i) => {
        const o = {
          index: i,
          chartHtml: chartFor(note),
          disabled: !!(marks && marks.locked),
          isCorrect: !!(marks && i === marks.correctIndex),
          isWrong: !!(marks && marks.chosenIndex === i && !marks.ok),
        };
        return o;
      });
    }

    function idleVm() {
      const inst = instrument();
      const nameZh = (inst && inst.nameZh) || "";
      const name = (inst && inst.name) || "";
      return {
        phase: "idle",
        title: `${nameZh}指法挑戰`,
        instrumentLabel: `${nameZh}（${name}）`,
        progress: "",
        writtenHtml: "",
        options: [],
        feedback: { hidden: true, text: "", revealHtml: "", revealLabel: "" },
        nextLabel: "下一題",
        scoreText: "",
        scoreNote: "",
        awaitingNext: false,
      };
    }

    function playVm(marks) {
      const session = state.session;
      const q = currentQuestion();
      const total = session?.questions?.length || 0;
      const nextLabel = isLastQuestion() ? "看結果" : "下一題";
      let feedback = { hidden: true, text: "", revealHtml: "", revealLabel: "" };
      if (marks && marks.locked) {
        if (marks.ok) {
          feedback = { hidden: false, text: "答對了！", revealHtml: "", revealLabel: "" };
        } else {
          feedback = {
            hidden: false,
            text: "答錯了，正確指法是：",
            revealHtml: chartFor(q.prompt),
            revealLabel: (q.prompt && q.prompt.label) || "",
          };
        }
      }
      return {
        phase: "play",
        title: idleVm().title,
        instrumentLabel: idleVm().instrumentLabel,
        progress: total ? `${state.qIndex + 1} / ${total}` : "",
        writtenHtml: writtenHtmlFor(q && q.prompt),
        options: optionsVm(q, marks),
        feedback,
        nextLabel,
        scoreText: "",
        scoreNote: "",
        awaitingNext: !!state.awaitingNext,
      };
    }

    function resultVm() {
      const total = state.session?.questions?.length || 5;
      return {
        phase: "result",
        title: idleVm().title,
        instrumentLabel: idleVm().instrumentLabel,
        progress: "",
        writtenHtml: "",
        options: [],
        feedback: { hidden: true, text: "", revealHtml: "", revealLabel: "" },
        nextLabel: "下一題",
        scoreText: `${state.score} / ${total}`,
        scoreNote:
          state.score === total ? "全對！太厲害了" : "再練一次音階指法會更熟喔",
        awaitingNext: false,
      };
    }

    function paint(vm) {
      adapters.render(vm);
    }

    function playPromptTone() {
      const q = currentQuestion();
      if (!q?.prompt || q.prompt.concertMidi == null) return;
      adapters.playTone(q.prompt.concertMidi);
    }

    function showQuestion() {
      state.awaitingNext = false;
      paint(playVm(null));
      playPromptTone();
    }

    function open(instrumentId) {
      adapters.haltAudio();
      state.instrumentId = instrumentId;
      state.session = null;
      state.qIndex = 0;
      state.score = 0;
      state.awaitingNext = false;
      adapters.goChallenge();
      paint(idleVm());
    }

    function reset() {
      state.session = null;
      state.qIndex = 0;
      state.score = 0;
      state.awaitingNext = false;
      paint(idleVm());
    }

    function start() {
      adapters.haltAudio();
      const inst = instrument();
      state.session = adapters.buildSession(inst, { questionCount: 5, optionCount: 3 });
      state.qIndex = 0;
      state.score = 0;
      state.awaitingNext = false;
      showQuestion();
    }

    function answer(chosenIndex) {
      if (state.awaitingNext) return;
      const q = currentQuestion();
      if (!q) return;
      state.awaitingNext = true;
      const ok = adapters.grade(q, chosenIndex);
      adapters.playCue(ok ? "correct" : "wrong");
      if (ok) state.score += 1;
      paint(
        playVm({
          locked: true,
          ok,
          correctIndex: q.correctIndex,
          chosenIndex: Number(chosenIndex),
        })
      );
    }

    function advance() {
      if (!state.session) return;
      if (isLastQuestion()) {
        adapters.playCue("finish");
        paint(resultVm());
        return;
      }
      state.qIndex += 1;
      showQuestion();
    }

    function replay() {
      playPromptTone();
    }

    return {
      open,
      start,
      answer,
      advance,
      replay,
      reset,
      /** @internal 測試用 */
      _state: state,
    };
  }

  return { create };
})();
