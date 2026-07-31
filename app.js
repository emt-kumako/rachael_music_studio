/**
 * 管樂半音階指法練習 — 主程式
 * 各樂器：Tuner 固定實音 B♭4 · A4=442 · 拍號 4/4 · 音值可選 1/2/4 拍
 */
(function () {
  const Band = window.BandInstruments;
  const Timing = window.PracticeTiming;
  const Challenge = window.FingeringChallenge;
  const Charts = window.FingeringCharts;
  const UiSounds = window.UiSounds;
  const A4_HZ = Band.A4_HZ;

  const els = {
    instrument: document.getElementById("instrument"),
    appTitle: document.getElementById("appTitle"),
    concertNote: document.getElementById("concertNote"),
    writtenNote: document.getElementById("writtenNote"),
    beatLights: document.getElementById("beatLights"),
    fingeringStage: document.getElementById("fingeringStage"),
    fingeringText: document.getElementById("fingeringText"),
    progressText: document.getElementById("progressText"),
    btnPlay: document.getElementById("btnPlay"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    btnStop: document.getElementById("btnStop"),
    btnTuner: document.getElementById("btnTuner"),
    tunerLabel: document.getElementById("tunerLabel"),
    tempo: document.getElementById("tempo"),
    tempoValue: document.getElementById("tempoValue"),
    tempoMarkName: document.getElementById("tempoMarkName"),
    tempoMarks: document.getElementById("tempoMarks"),
    volume: document.getElementById("volume"),
    loop: document.getElementById("loop"),
    direction: document.getElementById("direction"),
    noteStrip: document.getElementById("noteStrip"),
    metaText: document.getElementById("metaText"),
    practiceStage: document.getElementById("practiceStage"),
    layerHome: document.getElementById("layerHome"),
    homeGate: document.getElementById("homeGate"),
    homeHero: document.getElementById("homeHero"),
    layerMenu: document.getElementById("layerMenu"),
    layerBasics: document.getElementById("layerBasics"),
    layerInstruments: document.getElementById("layerInstruments"),
    layerPractice: document.getElementById("layerPractice"),
    instrumentGrid: document.getElementById("instrumentGrid"),
    basicsLessonTitle: document.getElementById("basicsLessonTitle"),
    basicsVideo: document.getElementById("basicsVideo"),
    basicsFallback: document.getElementById("basicsFallback"),
    basicsThumb: document.getElementById("basicsThumb"),
    basicsWatchLink: document.getElementById("basicsWatchLink"),
    basicsFallbackMsg: document.getElementById("basicsFallbackMsg"),
    btnEnterClassroom: document.getElementById("btnEnterClassroom"),
    btnBasicsCourse: document.getElementById("btnBasicsCourse"),
    btnScalePractice: document.getElementById("btnScalePractice"),
    btnFingeringChallenge: document.getElementById("btnFingeringChallenge"),
    btnMenuHome: document.getElementById("btnMenuHome"),
    btnBasicsBack: document.getElementById("btnBasicsBack"),
    btnBasicsPrev: document.getElementById("btnBasicsPrev"),
    btnBasicsNext: document.getElementById("btnBasicsNext"),
    btnPickBack: document.getElementById("btnPickBack"),
    btnPracticeBack: document.getElementById("btnPracticeBack"),
    pickKicker: document.getElementById("pickKicker"),
    layerChallenge: document.getElementById("layerChallenge"),
    challengeTitle: document.getElementById("challengeTitle"),
    challengeLede: document.getElementById("challengeLede"),
    challengeIdle: document.getElementById("challengeIdle"),
    challengePlay: document.getElementById("challengePlay"),
    challengeResult: document.getElementById("challengeResult"),
    challengeInstrumentName: document.getElementById("challengeInstrumentName"),
    btnChallengeStart: document.getElementById("btnChallengeStart"),
    btnChallengeBack: document.getElementById("btnChallengeBack"),
    challengeProgress: document.getElementById("challengeProgress"),
    challengeWritten: document.getElementById("challengeWritten"),
    btnChallengeReplay: document.getElementById("btnChallengeReplay"),
    challengeOptions: document.getElementById("challengeOptions"),
    challengeFeedback: document.getElementById("challengeFeedback"),
    challengeFeedbackText: document.getElementById("challengeFeedbackText"),
    challengeReveal: document.getElementById("challengeReveal"),
    btnChallengeNext: document.getElementById("btnChallengeNext"),
    challengeScore: document.getElementById("challengeScore"),
    challengeScoreNote: document.getElementById("challengeScoreNote"),
    btnChallengeAgain: document.getElementById("btnChallengeAgain"),
    btnChallengeToMenu: document.getElementById("btnChallengeToMenu"),
  };

  /** 音樂基礎課程（標題預填自 YouTube oEmbed；開啟時再嘗試更新） */
  const BASICS_LESSONS = [
    {
      id: "YgmUEISx5es",
      title: "【瑞瑞老師音樂課🎵】Lesson 1   譜號、拍號、音符",
    },
    {
      id: "DKbFD1GeEdg",
      title: "【瑞瑞老師音樂課🎵】Lesson 2  休止符、臨時記號",
    },
  ];
  let basicsLessonIndex = 0;

  const state = {
    instrumentId: "flute",
    index: 0,
    playing: false,
    sequence: [],
    seqPos: 0,
    beatPlan: [],
    timerId: null,
    tunerOn: false,
    audioUnlocked: false,
    noteMode: "scale", // scale | chromatic
    flowLayer: "home",
    flowBusy: false,
    pickMode: "practice", // practice | challenge
  };

  const challengeState = {
    instrumentId: "flute",
    session: null,
    qIndex: 0,
    score: 0,
    awaitingNext: false,
  };

  const FLOW_MS = 420;

  /** —— Audio —— */
  let audioCtx = null;
  let masterGain = null;
  let practiceOsc = null;
  let practiceGain = null;
  let tunerOsc = null;
  let tunerGain = null;
  let metroOscs = [];
  let beatLightTimers = [];

  /** 相對目前頁面解析資產路徑（避免 GitHub Pages 無尾隨 / 時指到錯目錄） */
  function assetUrl(relPath) {
    const clean = String(relPath || "").replace(/^\.\//, "");
    try {
      return new URL(clean, document.baseURI || location.href).href;
    } catch (_) {
      return clean;
    }
  }

  /** UI 音效：依 UiSounds 對照播放；失敗不擋操作 */
  const uiSoundPlayers = new Map();
  function playUiSound(kind) {
    if (!UiSounds || !kind) return;
    const rel = UiSounds.assetPath(kind);
    if (!rel) return;
    try {
      let audio = uiSoundPlayers.get(kind);
      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        uiSoundPlayers.set(kind, audio);
      }
      audio.src = assetUrl(rel);
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  /** 首頁 BGM：進頁即播；0:01.15 起、0:20.00 停（不淡入） */
  const HOME_BGM_URL = assetUrl("assets/bigger-world-audio-logo.mp3");
  const HOME_BGM = {
    startAt: 1.15,
    stopAt: 20.0,
    peak: 0.75,
    exitFadeSec: 0.35,
  };
  const homeBgmAudio =
    document.getElementById("homeBgm") instanceof HTMLAudioElement
      ? document.getElementById("homeBgm")
      : new Audio();
  homeBgmAudio.preload = "auto";
  homeBgmAudio.loop = false;
  homeBgmAudio.autoplay = false;
  homeBgmAudio.muted = false;
  homeBgmAudio.defaultMuted = false;
  homeBgmAudio.playsInline = true;
  homeBgmAudio.setAttribute("playsinline", "");
  homeBgmAudio.setAttribute("webkit-playsinline", "");
  homeBgmAudio.removeAttribute("autoplay");
  if (!homeBgmAudio.getAttribute("src") || homeBgmAudio.src.indexOf("bigger-world") < 0) {
    homeBgmAudio.src = HOME_BGM_URL;
  }
  let homeBgmWanted = false;
  let homeBgmFadeRaf = null;
  let homeBgmExitTimer = null;
  let homeBgmStopTimer = null;
  let homeBgmRetryTimer = null;
  /** 本次頁面生命週期內：離開首頁後不再自動/點擊觸發 BGM（重新整理才重置） */
  let homeBgmSessionDone = false;
  let homeBgmLoadFailed = false;
  let homeBgmUnlockArmed = false;
  /** 是否已點過「點擊進入」（通過閘門） */
  let homeGatePassed = false;

  homeBgmAudio.addEventListener("error", () => {
    homeBgmLoadFailed = true;
    console.warn("home bgm failed to load:", HOME_BGM_URL, homeBgmAudio.error);
  });

  function clearHomeBgmFade() {
    if (homeBgmFadeRaf !== null) {
      cancelAnimationFrame(homeBgmFadeRaf);
      homeBgmFadeRaf = null;
    }
    if (homeBgmExitTimer !== null) {
      clearTimeout(homeBgmExitTimer);
      homeBgmExitTimer = null;
    }
    if (homeBgmStopTimer !== null) {
      clearTimeout(homeBgmStopTimer);
      homeBgmStopTimer = null;
    }
    if (homeBgmRetryTimer !== null) {
      clearTimeout(homeBgmRetryTimer);
      homeBgmRetryTimer = null;
    }
  }

  function homeBgmIsPlaying() {
    return !!homeBgmAudio && !homeBgmAudio.paused && !homeBgmAudio.ended;
  }

  function stopHomeBgmImmediate() {
    clearHomeBgmFade();
    try {
      homeBgmAudio.pause();
      homeBgmAudio.currentTime = 0;
    } catch (_) {}
    homeBgmAudio.volume = 0;
  }

  function fadeOutHomeBgm(seconds = HOME_BGM.exitFadeSec) {
    homeBgmWanted = false;
    markHomeBgmSessionDone();
    clearHomeBgmFade();
    if (!homeBgmIsPlaying()) {
      stopHomeBgmImmediate();
      return;
    }
    const dur = Math.max(0.05, seconds);
    const startVol = Math.max(homeBgmAudio.volume, 0.0001);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / (dur * 1000));
      homeBgmAudio.volume = startVol * (1 - p);
      if (p < 1 && homeBgmWanted === false) {
        homeBgmFadeRaf = requestAnimationFrame(step);
      } else {
        homeBgmFadeRaf = null;
        stopHomeBgmImmediate();
      }
    };
    homeBgmFadeRaf = requestAnimationFrame(step);
    homeBgmExitTimer = setTimeout(() => stopHomeBgmImmediate(), (dur + 0.08) * 1000);
  }

  function tickHomeBgmWatch() {
    homeBgmFadeRaf = null;
    if (!homeBgmWanted) return;
    if (state.flowLayer !== "home") return;
    if (!homeBgmIsPlaying()) return;
    const t = homeBgmAudio.currentTime;
    if (t >= HOME_BGM.stopAt) {
      stopHomeBgmImmediate();
      markHomeBgmSessionDone();
      return;
    }
    homeBgmAudio.volume = HOME_BGM.peak;
    homeBgmFadeRaf = requestAnimationFrame(tickHomeBgmWatch);
  }

  function armHomeBgmTimeline() {
    if (homeBgmStopTimer !== null) {
      clearTimeout(homeBgmStopTimer);
      homeBgmStopTimer = null;
    }
    if (homeBgmFadeRaf !== null) {
      cancelAnimationFrame(homeBgmFadeRaf);
      homeBgmFadeRaf = null;
    }
    const t = homeBgmAudio.currentTime || HOME_BGM.startAt;
    const remain = Math.max(0.05, HOME_BGM.stopAt - t);
    homeBgmStopTimer = setTimeout(() => {
      if (!homeBgmWanted) return;
      stopHomeBgmImmediate();
      markHomeBgmSessionDone();
    }, remain * 1000);
    homeBgmFadeRaf = requestAnimationFrame(tickHomeBgmWatch);
  }

  function playHomeHeroIntro() {
    const hero = els.homeHero || document.querySelector(".home-hero");
    if (!hero) return;
    hero.hidden = false;
    hero.classList.remove("is-intro");
    void hero.offsetWidth;
    hero.classList.add("is-intro");
  }

  /** 點擊閘門後：播 BGM + Logo／進入教室上浮、標題淡入 */
  function beginHomeIntro() {
    if (state.flowLayer !== "home") return Promise.resolve(false);
    playHomeHeroIntro();
    return startHomeBgm();
  }

  function passHomeGate() {
    if (homeGatePassed) return;
    homeGatePassed = true;
    if (els.homeGate) els.homeGate.hidden = true;
    beginHomeIntro();
  }

  function showHomeContentWithoutGate() {
    if (els.homeGate) els.homeGate.hidden = true;
    homeGatePassed = true;
    if (els.homeHero) {
      els.homeHero.hidden = false;
      playHomeHeroIntro();
    }
  }

  /** 返回首頁：先空白，再完整重播 logo／文案／按鈕淡入 */
  function replayHomeEntranceBlankThenFade() {
    if (els.homeGate) els.homeGate.hidden = true;
    homeGatePassed = true;
    if (els.homeHero) {
      els.homeHero.classList.remove("is-intro");
      els.homeHero.hidden = true;
    }
    window.setTimeout(() => {
      if (state.flowLayer !== "home") return;
      if (!homeBgmSessionDone) {
        beginHomeIntro();
      } else {
        showHomeContentWithoutGate();
      }
    }, 80);
  }

  function seekHomeBgmStart() {
    try {
      if (homeBgmAudio.readyState >= 1) {
        homeBgmAudio.currentTime = HOME_BGM.startAt;
      }
    } catch (_) {}
  }

  /**
   * 進頁即播：同步 play()，並在可播事件／短重試內持續嘗試。
   * 自 0:01.15 直出峰值音量，至 0:20.00 停止。
   */
  function startHomeBgm() {
    if (homeBgmSessionDone) return Promise.resolve(false);
    if (homeBgmLoadFailed) return Promise.resolve(false);
    if (state.flowLayer !== "home") return Promise.resolve(false);
    homeBgmWanted = true;
    if (homeBgmIsPlaying()) {
      // 已在播但可能還在 0:00，拉到 startAt
      if (homeBgmAudio.currentTime < HOME_BGM.startAt - 0.05) seekHomeBgmStart();
      homeBgmAudio.volume = HOME_BGM.peak;
      armHomeBgmTimeline();
      return Promise.resolve(true);
    }

    try {
      // 首頁 BGM 只用 HTMLAudio；勿在此建立 Web Audio
      homeBgmAudio.muted = false;
      homeBgmAudio.volume = HOME_BGM.peak;
      seekHomeBgmStart();
      // 手勢當下立刻觸發 play（進頁／互動皆走這裡）
      const playPromise = homeBgmAudio.play();
      armHomeBgmTimeline();

      const onReady = () => {
        if (!homeBgmWanted || homeBgmSessionDone || state.flowLayer !== "home") return;
        seekHomeBgmStart();
        homeBgmAudio.volume = HOME_BGM.peak;
        if (homeBgmAudio.paused) {
          homeBgmAudio.play().catch(() => {});
        }
      };
      homeBgmAudio.addEventListener("loadedmetadata", onReady, { once: true });
      homeBgmAudio.addEventListener("canplay", onReady, { once: true });

      if (playPromise && typeof playPromise.then === "function") {
        return playPromise
          .then(() => {
            if (!homeBgmWanted || state.flowLayer !== "home" || homeBgmSessionDone) {
              stopHomeBgmImmediate();
              return false;
            }
            seekHomeBgmStart();
            homeBgmAudio.volume = HOME_BGM.peak;
            armHomeBgmTimeline();
            return true;
          })
          .catch((e) => {
            console.warn("home bgm autoplay blocked; will retry on interaction:", e);
            scheduleHomeBgmRetries();
            return false;
          });
      }
      return Promise.resolve(true);
    } catch (e) {
      console.warn("home bgm blocked or failed:", e);
      scheduleHomeBgmRetries();
      return Promise.resolve(false);
    }
  }

  /** 進頁後數秒內多次重試（部分瀏覽器晚一點才允許） */
  function scheduleHomeBgmRetries() {
    if (homeBgmSessionDone || homeBgmLoadFailed) return;
    const delays = [200, 500, 1000, 2000, 3500];
    delays.forEach((ms) => {
      window.setTimeout(() => {
        if (homeBgmSessionDone || homeBgmIsPlaying() || state.flowLayer !== "home") return;
        startHomeBgm();
      }, ms);
    });
  }

  function markHomeBgmSessionDone() {
    homeBgmSessionDone = true;
  }

  function armHomeBgmUnlock() {
    if (homeBgmUnlockArmed) return;
    homeBgmUnlockArmed = true;
    homeBgmAudio.addEventListener("ended", () => {
      stopHomeBgmImmediate();
      markHomeBgmSessionDone();
    });
  }

  function volumeLevel() {
    const v = Number(els.volume?.value);
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v / 100)) : 0.7;
  }

  /** 必須在使用者手勢的同步階段呼叫，否則瀏覽器會拒絕發聲 */
  function ensureAudioSync() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Web Audio API unavailable");
    if (!audioCtx) {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = volumeLevel();
      masterGain.connect(audioCtx.destination);
    }
    if (masterGain) masterGain.gain.value = volumeLevel();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function unlockAudioBuffer(force = false) {
    if (!audioCtx || !masterGain || (state.audioUnlocked && !force)) return;
    try {
      const buf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(masterGain);
      src.start(0);
      state.audioUnlocked = true;
    } catch (_) {}
  }

  async function ensureAudio() {
    ensureAudioSync();
    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
      } catch (_) {}
    }
    if (audioCtx.state === "running") unlockAudioBuffer();
    if (masterGain) masterGain.gain.value = volumeLevel();
    return audioCtx;
  }

  function midiToHz(midi) {
    return Band.midiToHz(midi, A4_HZ);
  }

  function clearMetronome() {
    const t = audioCtx ? audioCtx.currentTime : 0;
    for (const osc of metroOscs) {
      try {
        osc.stop(t);
      } catch (_) {}
    }
    metroOscs = [];
  }

  function beatLampEls() {
    return els.beatLights ? Array.from(els.beatLights.querySelectorAll(".beat-lamp")) : [];
  }

  /** 節拍燈熄滅（關閉節拍器時維持原色加深加暗） */
  function clearBeatLights() {
    for (const id of beatLightTimers) clearTimeout(id);
    beatLightTimers = [];
    beatLampEls().forEach((el) => el.classList.remove("on"));
  }

  /**
   * 譜面音上方 4 燈：第 1 拍橘、2–4 拍黃，跟隨節拍器。
   */
  function scheduleBeatLights(beats, beatSec, startBarBeat = 0) {
    clearBeatLights();
    if (!state.playing || beats < 1 || !els.beatLights) return;
    const lamps = beatLampEls();
    if (lamps.length < 4) return;
    const origin = ((startBarBeat % 4) + 4) % 4;
    const flashMs = Math.max(90, Math.min(220, beatSec * 1000 * 0.32));
    for (let i = 0; i < beats; i++) {
      const beatInBar = (origin + i) % 4;
      const delay = Math.round(i * beatSec * 1000);
      const onId = setTimeout(() => {
        if (!state.playing) return;
        lamps.forEach((el, idx) => el.classList.toggle("on", idx === beatInBar));
        const offId = setTimeout(() => {
          lamps[beatInBar]?.classList.remove("on");
        }, flashMs);
        beatLightTimers.push(offId);
      }, delay);
      beatLightTimers.push(onId);
    }
  }

  /**
   * 練習節拍器：拍號固定 4/4（第 1 拍高響、2–4 拍低響）。
   * 依本音實際拍數點拍；startBarBeat = 本音落在小節內第幾拍（0–3）。
   */
  function scheduleMetronome(beats, beatSec, startBarBeat = 0) {
    clearMetronome();
    scheduleBeatLights(beats, beatSec, startBarBeat);
    if (!audioCtx || !masterGain || beats < 1) return;
    if (masterGain) masterGain.gain.value = volumeLevel();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const origin = ((startBarBeat % 4) + 4) % 4;
    for (let i = 0; i < beats; i++) {
      const t = now + i * beatSec;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const accent = (origin + i) % 4 === 0;
      osc.type = "square";
      osc.frequency.setValueAtTime(accent ? 1600 : 900, t);
      const peak = (accent ? 0.36 : 0.14) * Math.max(volumeLevel(), 0.45);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.003);
      gain.gain.linearRampToValueAtTime(0, t + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
      metroOscs.push(osc);
      osc.onended = () => {
        metroOscs = metroOscs.filter((o) => o !== osc);
      };
    }
  }

  function stopPracticeTone(immediate) {
    if (!practiceOsc || !audioCtx) {
      practiceOsc = null;
      practiceGain = null;
      return;
    }
    const osc = practiceOsc;
    const gain = practiceGain;
    const now = audioCtx.currentTime;
    try {
      if (immediate) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        osc.stop(now);
      } else {
        gain.gain.cancelScheduledValues(now);
        const cur = Math.max(gain.gain.value, 0.001);
        gain.gain.setValueAtTime(cur, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.04);
        osc.stop(now + 0.05);
      }
    } catch (_) {}
    practiceOsc = null;
    practiceGain = null;
  }

  function playPracticeTone(hz, durationSec) {
    if (!(hz > 0) || !(durationSec > 0)) return;
    try {
      ensureAudioSync();
    } catch (_) {
      return;
    }
    if (!audioCtx || !masterGain) return;
    if (masterGain) masterGain.gain.value = volumeLevel();
    stopPracticeTone(true);
    unlockAudioBuffer();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(hz, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, now);
    const dur = Math.max(0.08, durationSec);
    const attack = 0.015;
    const release = Math.min(0.12, dur * 0.22);
    const peak = 0.45;
    const holdEnd = Math.max(attack, dur - release);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.setValueAtTime(peak, now + holdEnd);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.03);
    practiceOsc = osc;
    practiceGain = gain;
    osc.onended = () => {
      if (practiceOsc === osc) {
        practiceOsc = null;
        practiceGain = null;
      }
    };
  }

  function stopTuner() {
    if (!tunerOsc || !audioCtx) {
      tunerOsc = null;
      tunerGain = null;
      state.tunerOn = false;
      els.btnTuner.classList.remove("active");
      els.btnTuner.textContent = "Tuner 調音器";
      return;
    }
    const now = audioCtx.currentTime;
    try {
      tunerGain.gain.cancelScheduledValues(now);
      const cur = Math.max(tunerGain.gain.value, 0.001);
      tunerGain.gain.setValueAtTime(cur, now);
      tunerGain.gain.linearRampToValueAtTime(0, now + 0.05);
      tunerOsc.stop(now + 0.06);
    } catch (_) {}
    tunerOsc = null;
    tunerGain = null;
    state.tunerOn = false;
    els.btnTuner.classList.remove("active");
    els.btnTuner.textContent = "Tuner 調音器";
  }

  function tunerWrittenMidi() {
    const inst = currentInstrument();
    const midi = inst.tunerWrittenMidi;
    if (typeof midi === "number") return midi;
    if (Array.isArray(midi)) return midi[midi.length - 1];
    return 70 + (inst.transpose || 0);
  }

  function updateTunerLabel() {
    // 全員調音固定實音 B♭4；左側僅顯示 B♭
    if (els.tunerLabel) els.tunerLabel.textContent = "B♭";
  }

  function startTuner() {
    try {
      ensureAudioSync();
    } catch (_) {
      return;
    }
    if (!audioCtx || !masterGain) return;
    if (masterGain) masterGain.gain.value = volumeLevel();
    stopPracticeTone(true);
    stopPlayback(false);
    unlockAudioBuffer();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const inst = currentInstrument();
    const writtenMidi = tunerWrittenMidi();
    const concertMidi = Band.writtenToConcert(writtenMidi, inst.transpose || 0);
    const hz = midiToHz(concertMidi);
    if (!(hz > 0)) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, now);
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    tunerOsc = osc;
    tunerGain = gain;
    state.tunerOn = true;
    els.btnTuner.classList.add("active");
    els.btnTuner.textContent = "Tuner 調音器";
    updateTunerLabel();
  }

  async function toggleTuner() {
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (e) {
      console.error(e);
      return;
    }
    if (state.tunerOn) stopTuner();
    else startTuner();
    ensureAudio().catch(() => {});
  }

  /** —— Instrument / notes —— */
  function currentInstrument() {
    return Band.getById(state.instrumentId);
  }

  function currentNotes() {
    const inst = currentInstrument();
    if (state.noteMode !== "scale") return inst.notes;
    return Band.scaleNotes(inst);
  }

  function noteModeFromUi() {
    return document.querySelector('input[name="noteMode"]:checked')?.value === "scale"
      ? "scale"
      : "chromatic";
  }

  function beatsPerNote() {
    const v = Number(document.querySelector('input[name="beats"]:checked')?.value || 4);
    return v === 1 || v === 2 || v === 4 ? v : 4;
  }

  function ensureBeatPlan(seqLen, noteBeats = beatsPerNote()) {
    if (state.beatPlan && state.beatPlan.length === seqLen) return state.beatPlan;
    state.beatPlan = Timing.buildBeatPlan(
      seqLen,
      currentNotes().length,
      noteBeats,
      els.direction.value,
      state.noteMode
    );
    return state.beatPlan;
  }

  function refreshBeatPlan() {
    state.beatPlan = Timing.buildBeatPlan(
      state.sequence.length,
      currentNotes().length,
      beatsPerNote(),
      els.direction.value,
      state.noteMode
    );
    return state.beatPlan;
  }

  function beatsForSequencePosition(seqPos, seqLen, noteBeats = beatsPerNote()) {
    return Timing.beatsAt(ensureBeatPlan(seqLen, noteBeats), seqPos, noteBeats);
  }

  function startBarBeatForSequencePosition(seqPos, seqLen, noteBeats = beatsPerNote()) {
    return Timing.startBarBeatFromPlan(ensureBeatPlan(seqLen, noteBeats), seqPos);
  }

  function toneBeatsForPlanBeats(planBeats, noteBeats = beatsPerNote()) {
    return Timing.toneBeatsForPlanBeats(planBeats, noteBeats, state.noteMode);
  }

  function noteDurationSec(beats = beatsPerNote()) {
    return Timing.noteDurationSec(els.tempo.value, beats);
  }

  function nearestTempoMark(bpm) {
    let best = Band.TEMPO_MARKS[0];
    let bestDist = Infinity;
    for (const m of Band.TEMPO_MARKS) {
      const d = Math.abs(m.bpm - bpm);
      if (d < bestDist) {
        best = m;
        bestDist = d;
      }
    }
    return bestDist <= 8 ? best : null;
  }

  function updateTempoLabel() {
    const bpm = Number(els.tempo.value);
    els.tempoValue.textContent = String(bpm);
    const mark = nearestTempoMark(bpm);
    els.tempoMarkName.textContent = mark ? `${mark.name}（${mark.nameZh}）` : "自訂";
    els.tempoMarks.querySelectorAll(".tempo-chip").forEach((chip) => {
      chip.classList.toggle("active", Number(chip.dataset.bpm) === bpm);
    });
  }

  function renderFingering(note) {
    if (!els.fingeringStage) return;
    const inst = currentInstrument();
    els.fingeringStage.innerHTML =
      Charts && typeof Charts.chartHtml === "function" ? Charts.chartHtml(inst, note) : "";
  }

  function updateDisplay() {
    const notes = currentNotes();
    if (!notes.length) return;
    if (state.index >= notes.length) state.index = 0;
    const note = notes[state.index];
    const inst = currentInstrument();
    const modeLabel = state.noteMode === "scale" ? "音階" : "半音階";

    els.concertNote.textContent = note.concertNameDisplay || Band.displayPitchName(note.concertName);
    const writtenLabel = note.writtenNameDisplay || Band.displayPitchName(note.writtenName);
    els.writtenNote.innerHTML = `<span class="pitch-name">${writtenLabel}</span><span class="solfege">(${note.solfege}, ${note.jianpu})</span>`;
    els.fingeringText.textContent = note.label;
    els.progressText.textContent = `${state.index + 1} / ${notes.length}`;
    const practiceKind = inst.ui === "trombone" ? "把位" : "指法";
    els.appTitle.textContent = `${inst.nameZh}${modeLabel}${practiceKind}練習`;
    const scalePair = inst.scaleWrittenMidi || inst.tunerWrittenMidi;
    const w0 = Band.midiToName(scalePair[0]).label;
    const w1 = Band.midiToName(scalePair[1]).label;
    const c0 = Band.midiToName(inst.concertStart).label;
    const c1 = Band.midiToName(inst.concertEnd).label;
    els.metaText.textContent = `${inst.name} · 記譜 ${w0}–${w1}（實音 ${c0}–${c1}）· ${modeLabel} · 指法參考 Yamaha · A4=442`;

    // 豎笛/Alto/Tenor：左半按鍵、右半譜面音＋指法文字
    const wwSplit = inst.id === "clarinet" || inst.id === "altoSax" || inst.id === "tenorSax";
    if (els.practiceStage) els.practiceStage.classList.toggle("is-ww-split", wwSplit);

    renderFingering(note);
    updateTunerLabel();

    els.noteStrip.querySelectorAll(".note-chip").forEach((chip, i) => {
      chip.classList.toggle("active", i === state.index);
    });
  }

  function stripWrittenLabel(note) {
    return note.writtenNameDisplay || note.writtenName;
  }

  function renderStrip() {
    const notes = currentNotes();
    els.noteStrip.innerHTML = "";
    const rowTop = document.createElement("div");
    const rowBottom = document.createElement("div");
    rowTop.className = "strip-row strip-row-top";
    rowBottom.className = "strip-row strip-row-bottom";
    els.noteStrip.appendChild(rowTop);
    els.noteStrip.appendChild(rowBottom);

    const n = notes.length;
    const topCount = n <= 8 ? Math.ceil(n / 2) : 7;
    const cols = Math.max(topCount, n - topCount, 1);
    els.noteStrip.style.setProperty("--strip-cols", String(cols));

    notes.forEach((note, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "note-chip" + (i === state.index ? " active" : "");
      btn.dataset.index = String(i);
      btn.textContent = stripWrittenLabel(note);
      btn.title = `記譜 ${stripWrittenLabel(note)}`;
      btn.addEventListener("click", () => {
        stopTuner();
        stopPlayback(false);
        state.index = i;
        updateDisplay();
        try {
          ensureAudioSync();
          unlockAudioBuffer();
        } catch (_) {
          return;
        }
        const dur = Math.min(0.9, noteDurationSec() * 0.85);
        playPracticeTone(midiToHz(note.concertMidi), dur);
      });
      (i < topCount ? rowTop : rowBottom).appendChild(btn);
    });
  }

  function populateInstruments() {
    els.instrument.innerHTML = Band.instruments
      .map((inst) => `<option value="${inst.id}">${inst.name}（${inst.nameZh}）</option>`)
      .join("");
    els.instrument.value = state.instrumentId;
  }

  function populateTempoMarks() {
    els.tempoMarks.innerHTML = "";
    Band.TEMPO_MARKS.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tempo-chip";
      btn.dataset.bpm = String(m.bpm);
      btn.innerHTML = `<span class="tempo-chip-name">${m.name} ${m.nameZh}</span><small>${m.bpm}</small>`;
      btn.title = `${m.name} ${m.nameZh} ${m.bpm}`;
      btn.addEventListener("click", () => {
        els.tempo.value = String(m.bpm);
        updateTempoLabel();
      });
      els.tempoMarks.appendChild(btn);
    });
  }

  function scrollPracticeTitleToTop() {
    // 對齊練習頁頂部（含返回列），避免只捲標題而留下大段上方空白
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (_) {
      window.scrollTo(0, 0);
    }
    const topEl = els.layerPractice || els.appTitle;
    if (topEl && typeof topEl.scrollIntoView === "function") {
      topEl.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
    }
  }

  /** —— Playback —— */
  function buildSequence() {
    return Timing.buildSequence(currentNotes().length, els.direction.value);
  }

  function clearTimer() {
    if (state.timerId !== null) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
  }

  function stopPlayback(resetIndex) {
    clearTimer();
    state.playing = false;
    els.btnPlay.textContent = "開始練習";
    clearMetronome();
    clearBeatLights();
    stopPracticeTone();
    if (resetIndex) {
      state.index = els.direction.value === "down" ? currentNotes().length - 1 : 0;
      state.seqPos = 0;
      updateDisplay();
    }
  }

  function scheduleNext(ms) {
    clearTimer();
    state.timerId = setTimeout(tick, ms);
  }

  function tick() {
    if (!state.playing) return;
    if (state.seqPos >= state.sequence.length) {
      if (els.loop.checked) state.seqPos = 0;
      else {
        stopPlayback(false);
        return;
      }
    }
    state.index = state.sequence[state.seqPos];
    updateDisplay();
    const seqLen = state.sequence.length;
    const noteBeats = beatsPerNote();
    const step = Timing.stepTiming({
      beatPlan: ensureBeatPlan(seqLen, noteBeats),
      seqPos: state.seqPos,
      noteBeats,
      noteMode: state.noteMode,
      bpm: Number(els.tempo.value),
    });
    const note = currentNotes()[state.index];
    playPracticeTone(
      midiToHz(note.concertMidi),
      step.toneDurationSec * (step.toneBeats < step.planBeats ? 1 : 0.92)
    );
    scheduleMetronome(step.planBeats, step.beatSec, step.startBarBeat);
    state.seqPos += 1;
    scheduleNext(step.durationSec * 1000);
  }

  async function startPlayback({ resume = false } = {}) {
    stopTuner();
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (e) {
      console.error(e);
      return;
    }
    if (!resume) {
      const planned = Timing.planSession({
        noteCount: currentNotes().length,
        direction: els.direction.value,
        noteMode: state.noteMode,
        noteBeats: beatsPerNote(),
      });
      state.sequence = planned.sequence;
      state.beatPlan = planned.beatPlan;
      state.seqPos = 0;
    } else if (!state.sequence.length) {
      state.sequence = buildSequence();
      refreshBeatPlan();
    } else if (!state.beatPlan.length) {
      refreshBeatPlan();
    }
    state.playing = true;
    els.btnPlay.textContent = "暫停";
    // 必須在使用者手勢同步堆疊內立刻發聲；await 之後會失去手勢
    tick();
    ensureAudio().catch(() => {});
  }

  function togglePlayback() {
    if (state.playing) {
      clearTimer();
      state.playing = false;
      els.btnPlay.textContent = "繼續";
      clearMetronome();
      clearBeatLights();
      stopPracticeTone(true);
      return;
    }
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (e) {
      console.error(e);
      return;
    }
    const resuming = els.btnPlay.textContent === "繼續";
    startPlayback({ resume: resuming });
  }

  function step(delta) {
    stopTuner();
    stopPlayback(false);
    const n = currentNotes().length;
    state.index = (state.index + delta + n) % n;
    updateDisplay();
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (_) {
      return;
    }
    playPracticeTone(midiToHz(currentNotes()[state.index].concertMidi), Math.min(0.9, noteDurationSec() * 0.85));
  }

  function switchInstrument(id) {
    const wasTuner = state.tunerOn;
    stopTuner();
    stopPlayback(false);
    state.instrumentId = id;
    state.index = 0;
    renderStrip();
    updateDisplay();
    updateTunerLabel();
    if (wasTuner) {
      try {
        ensureAudioSync();
        startTuner();
      } catch (_) {}
    }
  }

  /** —— Events —— */
  els.instrument.addEventListener("change", () => switchInstrument(els.instrument.value));
  els.btnPlay.addEventListener("click", () => togglePlayback());
  els.btnStop.addEventListener("click", () => {
    stopTuner();
    stopPlayback(true);
  });
  els.btnPrev.addEventListener("click", () => step(-1));
  els.btnNext.addEventListener("click", () => step(1));
  els.btnTuner.addEventListener("click", () => toggleTuner());
  els.tempo.addEventListener("input", updateTempoLabel);
  els.volume.addEventListener("input", () => {
    if (masterGain) masterGain.gain.value = Number(els.volume.value) / 100;
  });
  els.direction.addEventListener("change", () => {
    state.sequence = buildSequence();
    state.seqPos = 0;
    refreshBeatPlan();
  });
  document.querySelectorAll('input[name="beats"]').forEach((el) => {
    el.addEventListener("change", () => {
      refreshBeatPlan();
    });
  });
  document.querySelectorAll('input[name="noteMode"]').forEach((el) => {
    el.addEventListener("change", () => {
      const wasPlaying = state.playing;
      stopPlayback(false);
      state.noteMode = noteModeFromUi();
      state.index = 0;
      renderStrip();
      updateDisplay();
      if (wasPlaying) startPlayback({ resume: false });
    });
  });
  let pausedByVisibility = false;

  async function resumeAudioAfterForeground() {
    try {
      ensureAudioSync();
      if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      if (audioCtx && audioCtx.state === "running") {
        unlockAudioBuffer(true);
      }
      if (masterGain) masterGain.gain.value = volumeLevel();
    } catch (_) {}
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.playing) {
        pausedByVisibility = true;
        clearTimer();
        state.playing = false;
        els.btnPlay.textContent = "繼續";
        clearMetronome();
        clearBeatLights();
        stopPracticeTone(true);
      }
      if (state.tunerOn) stopTuner();
      return;
    }
    // 手機待機／解鎖後：恢復 AudioContext，並若先前在播則自動續播
    const shouldResume = pausedByVisibility;
    pausedByVisibility = false;
    resumeAudioAfterForeground().then(() => {
      if (
        shouldResume &&
        !state.playing &&
        els.btnPlay.textContent === "繼續" &&
        audioCtx &&
        audioCtx.state === "running"
      ) {
        try {
          startPlayback({ resume: true });
        } catch (_) {}
      }
    });
  });

  window.addEventListener("pageshow", () => {
    resumeAudioAfterForeground();
  });

  window.addEventListener("focus", () => {
    resumeAudioAfterForeground();
  });

  /** —— 指法挑戰 —— */
  function challengeInstrument() {
    return Band.getById(challengeState.instrumentId);
  }

  function challengeChartHtml(note) {
    const inst = challengeInstrument();
    if (!Charts || typeof Charts.chartHtml !== "function" || !note) {
      return `<p class="challenge-option-fallback">${(note && note.label) || ""}</p>`;
    }
    return Charts.chartHtml(inst, note) || `<p class="challenge-option-fallback">${note.label || ""}</p>`;
  }

  function showChallengePhase(phase) {
    if (els.challengeIdle) els.challengeIdle.hidden = phase !== "idle";
    if (els.challengePlay) els.challengePlay.hidden = phase !== "play";
    if (els.challengeResult) els.challengeResult.hidden = phase !== "result";
  }

  function resetChallengeUiToIdle() {
    challengeState.session = null;
    challengeState.qIndex = 0;
    challengeState.score = 0;
    challengeState.awaitingNext = false;
    const inst = challengeInstrument();
    if (els.challengeTitle) els.challengeTitle.textContent = `${inst.nameZh}指法挑戰`;
    if (els.challengeInstrumentName) {
      els.challengeInstrumentName.textContent = `${inst.nameZh}（${inst.name}）`;
    }
    if (els.challengeFeedback) els.challengeFeedback.hidden = true;
    if (els.challengeFeedbackText) els.challengeFeedbackText.textContent = "";
    if (els.challengeReveal) els.challengeReveal.innerHTML = "";
    if (els.challengeOptions) els.challengeOptions.innerHTML = "";
    if (els.challengeProgress) els.challengeProgress.textContent = "";
    if (els.challengeScore) els.challengeScore.textContent = "";
    if (els.challengeScoreNote) els.challengeScoreNote.textContent = "";
    if (els.btnChallengeNext) els.btnChallengeNext.textContent = "下一題";
    showChallengePhase("idle");
  }

  function openChallengeForInstrument(instId) {
    stopTuner();
    stopPlayback(false);
    challengeState.instrumentId = instId;
    resetChallengeUiToIdle();
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (_) {}
    showLayer("challenge");
  }

  function playChallengePromptTone() {
    const q = challengeState.session?.questions?.[challengeState.qIndex];
    if (!q?.prompt) return;
    try {
      ensureAudioSync();
      unlockAudioBuffer();
      playPracticeTone(midiToHz(q.prompt.concertMidi), 0.85);
    } catch (_) {}
  }

  function renderChallengeQuestion() {
    const session = challengeState.session;
    if (!session) return;
    const q = session.questions[challengeState.qIndex];
    if (!q) return;
    challengeState.awaitingNext = false;
    if (els.challengeFeedback) els.challengeFeedback.hidden = true;
    if (els.challengeReveal) els.challengeReveal.innerHTML = "";
    if (els.challengeProgress) {
      els.challengeProgress.textContent = `${challengeState.qIndex + 1} / ${session.questions.length}`;
    }
    const writtenLabel = q.prompt.writtenNameDisplay || Band.displayPitchName(q.prompt.writtenName);
    if (els.challengeWritten) {
      els.challengeWritten.innerHTML = `<span class="pitch-name">${writtenLabel}</span><span class="solfege">(${q.prompt.solfege}, ${q.prompt.jianpu})</span>`;
    }
    if (els.challengeOptions) {
      els.challengeOptions.innerHTML = "";
      q.options.forEach((note, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "challenge-option";
        btn.setAttribute("role", "listitem");
        btn.dataset.index = String(i);
        // 選項只顯示指法圖，避免文字標籤（尤其鋼琴）洩題
        btn.innerHTML = `<div class="challenge-option-chart">${challengeChartHtml(note)}</div>`;
        btn.addEventListener("click", () => onChallengeAnswer(i));
        els.challengeOptions.appendChild(btn);
      });
    }
    showChallengePhase("play");
    playChallengePromptTone();
  }

  function onChallengeAnswer(chosenIndex) {
    if (challengeState.awaitingNext) return;
    const q = challengeState.session?.questions?.[challengeState.qIndex];
    if (!q) return;
    challengeState.awaitingNext = true;
    const ok = Challenge.grade(q, chosenIndex);
    playUiSound(ok ? "correct" : "wrong");
    if (ok) challengeState.score += 1;
    if (els.challengeOptions) {
      els.challengeOptions.querySelectorAll(".challenge-option").forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add("is-correct");
        if (i === chosenIndex && !ok) btn.classList.add("is-wrong");
      });
    }
    if (ok) {
      if (els.challengeFeedbackText) els.challengeFeedbackText.textContent = "答對了！";
      if (els.challengeReveal) els.challengeReveal.innerHTML = "";
      if (els.challengeFeedback) els.challengeFeedback.hidden = false;
      if (els.btnChallengeNext) els.btnChallengeNext.textContent =
        challengeState.qIndex + 1 >= challengeState.session.questions.length ? "看結果" : "下一題";
      return;
    }
    if (els.challengeFeedbackText) els.challengeFeedbackText.textContent = "答錯了，正確指法是：";
    if (els.challengeReveal) {
      els.challengeReveal.innerHTML = `<div class="challenge-option-chart">${challengeChartHtml(
        q.prompt
      )}</div><span class="challenge-option-label">${q.prompt.label || ""}</span>`;
    }
    if (els.challengeFeedback) els.challengeFeedback.hidden = false;
    if (els.btnChallengeNext) {
      els.btnChallengeNext.textContent =
        challengeState.qIndex + 1 >= challengeState.session.questions.length ? "看結果" : "下一題";
    }
  }

  function advanceChallenge() {
    if (!challengeState.session) return;
    if (challengeState.qIndex + 1 >= challengeState.session.questions.length) {
      finishChallenge();
      return;
    }
    challengeState.qIndex += 1;
    renderChallengeQuestion();
  }

  function finishChallenge() {
    const total = challengeState.session?.questions?.length || 5;
    if (els.challengeScore) els.challengeScore.textContent = `${challengeState.score} / ${total}`;
    if (els.challengeScoreNote) {
      els.challengeScoreNote.textContent =
        challengeState.score === total ? "全對！太厲害了" : "再練一次音階指法會更熟喔";
    }
    showChallengePhase("result");
  }

  function startChallengeSession() {
    stopTuner();
    stopPlayback(false);
    const inst = challengeInstrument();
    challengeState.session = Challenge.buildSession(inst, { questionCount: 5, optionCount: 3 });
    challengeState.qIndex = 0;
    challengeState.score = 0;
    try {
      ensureAudioSync();
      unlockAudioBuffer();
    } catch (_) {}
    renderChallengeQuestion();
  }

  function openInstrumentPicker(mode) {
    state.pickMode = mode === "challenge" ? "challenge" : "practice";
    if (els.pickKicker) {
      els.pickKicker.textContent = state.pickMode === "challenge" ? "指法挑戰" : "音階練習";
    }
    showLayer("instruments");
  }

  /** —— Flow navigation —— */
  function layerEl(name) {
    return (
      {
        home: els.layerHome,
        menu: els.layerMenu,
        basics: els.layerBasics,
        instruments: els.layerInstruments,
        practice: els.layerPractice,
        challenge: els.layerChallenge,
      }[name] || null
    );
  }

  function canEmbedYouTube() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  function pauseBasicsVideos() {
    const iframe = els.basicsVideo;
    if (!iframe || !iframe.src) return;
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "*"
      );
    } catch (_) {}
  }

  function basicsEmbedUrl(videoId) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
    });
    if (location.origin && /^https?:/.test(location.origin)) {
      params.set("origin", location.origin);
    }
    // 標準 embed + referrerpolicy；需以 http(s) 開啟才有 Referer，否則會 Error 153
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  }

  function renderBasicsLesson() {
    const lesson = BASICS_LESSONS[basicsLessonIndex];
    if (!lesson) return;
    pauseBasicsVideos();
    if (els.basicsLessonTitle) els.basicsLessonTitle.textContent = lesson.title;
    const watchUrl = `https://www.youtube.com/watch?v=${lesson.id}`;
    if (els.basicsWatchLink) els.basicsWatchLink.href = watchUrl;
    if (els.basicsThumb) {
      els.basicsThumb.src = `https://i.ytimg.com/vi/${lesson.id}/hqdefault.jpg`;
      els.basicsThumb.alt = lesson.title;
    }
    const embedOk = canEmbedYouTube();
    if (els.basicsFallback) els.basicsFallback.hidden = embedOk;
    if (els.basicsVideo) {
      els.basicsVideo.hidden = !embedOk;
      els.basicsVideo.title = lesson.title;
      if (embedOk) {
        els.basicsVideo.src = basicsEmbedUrl(lesson.id);
      } else {
        els.basicsVideo.removeAttribute("src");
        if (els.basicsFallbackMsg) {
          els.basicsFallbackMsg.textContent =
            "目前是以檔案方式開啟（file://），YouTube 嵌入會出現錯誤 153。請在專案資料夾執行 python3 -m http.server 8080，再用瀏覽器開 http://localhost:8080/ ；或先按下方按鈕在 YouTube 觀看。";
        }
      }
    }
    if (els.btnBasicsPrev) els.btnBasicsPrev.hidden = basicsLessonIndex <= 0;
    if (els.btnBasicsNext) els.btnBasicsNext.hidden = basicsLessonIndex >= BASICS_LESSONS.length - 1;
  }

  async function refreshBasicsTitles() {
    await Promise.all(
      BASICS_LESSONS.map(async (lesson) => {
        try {
          const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
            `https://www.youtube.com/watch?v=${lesson.id}`
          )}&format=json`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          if (data && typeof data.title === "string" && data.title.trim()) {
            lesson.title = data.title.trim();
          }
        } catch (_) {}
      })
    );
    if (state.flowLayer === "basics") renderBasicsLesson();
  }

  function openBasicsCourse() {
    basicsLessonIndex = 0;
    renderBasicsLesson();
    refreshBasicsTitles();
    return showLayer("basics");
  }

  function showLayer(name) {
    if (state.flowBusy || state.flowLayer === name) return Promise.resolve();
    const next = layerEl(name);
    const prev = layerEl(state.flowLayer);
    if (!next) return Promise.resolve();
    const leavingHome = state.flowLayer === "home" && name !== "home";
    const enteringHome = name === "home";
    state.flowBusy = true;
    if (state.flowLayer === "basics" && name !== "basics") {
      pauseBasicsVideos();
    }
    if (leavingHome) {
      fadeOutHomeBgm(HOME_BGM.exitFadeSec);
    }
    if (prev && prev !== next) {
      prev.classList.add("is-leaving");
      prev.classList.remove("is-active");
    }
    next.hidden = false;
    requestAnimationFrame(() => {
      next.classList.add("is-active");
      next.classList.remove("is-leaving");
    });
    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (prev && prev !== next) {
          prev.hidden = true;
          prev.classList.remove("is-leaving", "is-active");
        }
        state.flowLayer = name;
        state.flowBusy = false;
        document.body.dataset.flow = name;
        // 返回首頁：先空白再完整淡入；BGM 僅在尚未結束的首次流程才播
        if (enteringHome) {
          if (!homeGatePassed) {
            if (els.homeGate) els.homeGate.hidden = false;
            if (els.homeHero) els.homeHero.hidden = true;
          } else {
            replayHomeEntranceBlankThenFade();
          }
        }
        resolve();
      }, FLOW_MS);
    });
  }

  function populateInstrumentGrid() {
    if (!els.instrumentGrid) return;
    els.instrumentGrid.innerHTML = "";
    Band.instruments.forEach((inst) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "instrument-pick";
      btn.dataset.id = inst.id;
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `${inst.nameZh}<small>${inst.name}</small>`;
      btn.addEventListener("click", () => {
        playUiSound("choose");
        if (state.pickMode === "challenge") {
          openChallengeForInstrument(inst.id);
          return;
        }
        stopTuner();
        stopPlayback(false);
        state.instrumentId = inst.id;
        state.index = 0;
        state.noteMode = "scale";
        const scaleRadio = document.querySelector('input[name="noteMode"][value="scale"]');
        if (scaleRadio) scaleRadio.checked = true;
        if (els.instrument) els.instrument.value = inst.id;
        try {
          ensureAudioSync();
          unlockAudioBuffer();
        } catch (_) {}
        renderStrip();
        updateDisplay();
        updateTunerLabel();
        showLayer("practice").then(() => {
          scrollPracticeTitleToTop();
        });
      });
      els.instrumentGrid.appendChild(btn);
    });
  }

  function leavePracticeToMenu() {
    playUiSound("back");
    stopTuner();
    stopPlayback(false);
    showLayer("menu");
  }

  if (els.btnEnterClassroom) {
    els.btnEnterClassroom.addEventListener("click", () => {
      fadeOutHomeBgm(HOME_BGM.exitFadeSec);
      try {
        ensureAudioSync();
        unlockAudioBuffer();
      } catch (_) {}
      showLayer("menu");
    });
  }
  if (els.btnBasicsCourse) {
    els.btnBasicsCourse.addEventListener("click", () => {
      playUiSound("choose");
      openBasicsCourse();
    });
  }
  if (els.btnScalePractice) {
    els.btnScalePractice.addEventListener("click", () => {
      playUiSound("choose");
      openInstrumentPicker("practice");
    });
  }
  if (els.btnFingeringChallenge) {
    els.btnFingeringChallenge.addEventListener("click", () => {
      playUiSound("choose");
      openInstrumentPicker("challenge");
    });
  }
  if (els.btnMenuHome) {
    els.btnMenuHome.addEventListener("click", () => {
      playUiSound("back");
      showLayer("home");
    });
  }
  if (els.btnChallengeBack) {
    els.btnChallengeBack.addEventListener("click", () => {
      playUiSound("back");
      stopTuner();
      stopPlayback(false);
      showLayer("menu");
    });
  }
  if (els.btnChallengeStart) {
    els.btnChallengeStart.addEventListener("click", () => {
      playUiSound("startGame");
      startChallengeSession();
    });
  }
  if (els.btnChallengeReplay) {
    els.btnChallengeReplay.addEventListener("click", () => playChallengePromptTone());
  }
  if (els.btnChallengeNext) {
    els.btnChallengeNext.addEventListener("click", () => {
      const session = challengeState.session;
      const atLast =
        session && challengeState.qIndex + 1 >= session.questions.length;
      if (atLast) playUiSound("finish");
      advanceChallenge();
    });
  }
  if (els.btnChallengeAgain) {
    els.btnChallengeAgain.addEventListener("click", () => {
      playUiSound("startGame");
      resetChallengeUiToIdle();
      startChallengeSession();
    });
  }
  if (els.btnChallengeToMenu) {
    els.btnChallengeToMenu.addEventListener("click", () => {
      playUiSound("back");
      stopTuner();
      stopPlayback(false);
      showLayer("menu");
    });
  }
  if (els.btnBasicsBack) {
    els.btnBasicsBack.addEventListener("click", () => {
      playUiSound("back");
      showLayer("menu");
    });
  }
  if (els.btnBasicsPrev) {
    els.btnBasicsPrev.addEventListener("click", () => {
      if (basicsLessonIndex <= 0) return;
      basicsLessonIndex -= 1;
      renderBasicsLesson();
    });
  }
  if (els.btnBasicsNext) {
    els.btnBasicsNext.addEventListener("click", () => {
      if (basicsLessonIndex >= BASICS_LESSONS.length - 1) return;
      playUiSound("choose");
      basicsLessonIndex += 1;
      renderBasicsLesson();
    });
  }
  if (els.btnPickBack) {
    els.btnPickBack.addEventListener("click", () => {
      playUiSound("back");
      showLayer("menu");
    });
  }
  if (els.btnPracticeBack) {
    els.btnPracticeBack.addEventListener("click", () => leavePracticeToMenu());
  }

  /** —— Boot —— */
  // iOS Safari 常忽略 viewport user-scalable；手勢再擋一層
  function lockViewportZoom() {
    const block = (ev) => {
      if (ev.cancelable) ev.preventDefault();
    };
    ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
      document.addEventListener(type, block, { passive: false });
    });
    document.addEventListener(
      "touchmove",
      (ev) => {
        if (ev.touches && ev.touches.length > 1 && ev.cancelable) ev.preventDefault();
      },
      { passive: false }
    );
    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (ev) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 320 && ev.cancelable) ev.preventDefault();
        lastTouchEnd = now;
      },
      { passive: false }
    );
  }
  lockViewportZoom();

  state.noteMode = noteModeFromUi();
  populateInstruments();
  populateInstrumentGrid();
  populateTempoMarks();
  renderStrip();
  updateDisplay();
  updateTempoLabel();
  updateTunerLabel();
  document.body.dataset.flow = "home";

  // 首頁 Logo 路徑與 BGM 同樣以頁面為基準解析（GitHub Pages 子路徑較穩）
  const homeLogoEl = document.getElementById("homeLogo");
  if (homeLogoEl) {
    homeLogoEl.src = assetUrl("assets/rachaels-music-logo.png");
    homeLogoEl.addEventListener("error", () => {
      console.warn("home logo failed to load:", homeLogoEl.src);
    });
  }

  // 首頁：先顯示「點擊進入」；點擊後播 BGM（0:01.15→0:20.00）並浮現主畫面
  // 聲明於 CSS 開頁即淡入。注意：勿在 play() 之後再 load()。
  armHomeBgmUnlock();
  if (els.homeGate) {
    els.homeGate.addEventListener("click", (ev) => {
      ev.preventDefault();
      passHomeGate();
    });
  }

  window.BandPracticeApp = {
    state,
    currentInstrument,
    currentNotes,
    majorScalePitchClasses: Band.majorScalePitchClasses,
    scaleNotes: Band.scaleNotes,
    midiToHz,
    noteDurationSec,
    showLayer,
    beatsPerNote,
    buildBeatPlan: Timing.buildBeatPlan,
    refreshBeatPlan,
    beatsForSequencePosition,
    startBarBeatForSequencePosition,
    toneBeatsForPlanBeats,
    ensureAudioSync,
    ensureAudio,
    scheduleMetronome,
    clearMetronome,
    stripWrittenLabel,
    HOME_BGM,
    startHomeBgm,
    fadeOutHomeBgm,
    homeBgmIsPlaying,
    A4_HZ,
  };
})();
