/**
 * Flow — 導覽轉場＋離場／進場政策（含 ScrollPolicy）
 * 唯一入口 go(name)；停練習音、首頁 BGM／入場、basics 暫停、
 * practice／challenge 文件流捲頂，均經 adapters。
 */
window.Flow = (function () {
  /** practice／challenge：文件流捲頂，且離場或進場時 halt 練習音 */
  const APP_DOC_LAYERS = Object.freeze(["practice", "challenge"]);

  /**
   * @param {{
   *   getLayer: (name: string) => { classList: DOMTokenList, hidden: boolean } | null,
   *   setFlowAttr: (name: string) => void,
   *   syncState: (s: { layer: string, busy: boolean }) => void,
   *   haltPracticeAudio: () => void,
   *   fadeHomeBgm: () => void,
   *   pauseBasics: () => void,
   *   prepareHomeEnter: () => void,
   *   onEnterHome: () => void,
   *   scrollDocumentTop: () => void,
   *   initialLayer?: string,
   *   transitionMs?: number,
   *   raf?: (cb: () => void) => void,
   *   delay?: (cb: () => void, ms: number) => void,
   * }} adapters
   */
  function create(adapters) {
    let current = adapters.initialLayer || "home";
    let busy = false;
    const transitionMs = adapters.transitionMs != null ? adapters.transitionMs : 420;
    const raf = adapters.raf || ((cb) => requestAnimationFrame(cb));
    const delay = adapters.delay || ((cb, ms) => setTimeout(cb, ms));

    function needsPracticeAudioHalt(from, to) {
      return APP_DOC_LAYERS.includes(from) || APP_DOC_LAYERS.includes(to);
    }

    function needsDocScroll(to) {
      return APP_DOC_LAYERS.includes(to);
    }

    /**
     * @param {string} name
     * @returns {Promise<void>}
     */
    function go(name) {
      if (busy || current === name) return Promise.resolve();
      const next = adapters.getLayer(name);
      const prev = adapters.getLayer(current);
      if (!next) return Promise.resolve();

      const from = current;
      const leavingHome = from === "home" && name !== "home";
      const enteringHome = name === "home";
      const leavingBasics = from === "basics" && name !== "basics";

      busy = true;
      adapters.syncState({ layer: from, busy: true });

      if (leavingBasics) adapters.pauseBasics();
      if (leavingHome) adapters.fadeHomeBgm();
      if (needsPracticeAudioHalt(from, name)) adapters.haltPracticeAudio();
      if (enteringHome) adapters.prepareHomeEnter();

      if (prev && prev !== next) {
        prev.classList.add("is-leaving");
        prev.classList.remove("is-active");
      }
      next.hidden = false;
      raf(() => {
        next.classList.add("is-active");
        next.classList.remove("is-leaving");
      });

      return new Promise((resolve) => {
        delay(() => {
          if (prev && prev !== next) {
            prev.hidden = true;
            prev.classList.remove("is-leaving", "is-active");
          }
          current = name;
          busy = false;
          adapters.syncState({ layer: name, busy: false });
          adapters.setFlowAttr(name);
          if (enteringHome) adapters.onEnterHome();
          if (needsDocScroll(name)) adapters.scrollDocumentTop();
          resolve();
        }, transitionMs);
      });
    }

    return { go };
  }

  return { create, APP_DOC_LAYERS };
})();
