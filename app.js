/**
 * 管樂半音階指法練習 — 主程式
 * 各樂器：Tuner 固定實音 B♭4 · A4=442 · 拍號 4/4 · 音值可選 1/2/4 拍
 */
(function () {
  const Band = window.BandInstruments;
  const Timing = window.PracticeTiming;
  const Challenge = window.FingeringChallenge;
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

  /** 以該樂器音域起始記譜音為主音的大調音級（音域上下限不變） */
  function majorScalePitchClasses(tonicMidi) {
    const tonic = ((tonicMidi % 12) + 12) % 12;
    return new Set([0, 2, 4, 5, 7, 9, 11].map((d) => (tonic + d) % 12));
  }

  function currentNotes() {
    const all = currentInstrument().notes;
    if (state.noteMode !== "scale" || !all.length) return all;
    const deg = majorScalePitchClasses(all[0].writtenMidi);
    return all.filter((n) => deg.has(((n.writtenMidi % 12) + 12) % 12));
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

  /** —— Fingering renderers —— */
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
    els.fingeringStage.innerHTML = html;
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
    els.fingeringStage.innerHTML = `
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

    els.fingeringStage.innerHTML = `
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

  let activeGlowId = "wwGlowFlute";

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

  function renderWoodwind(note) {
    const inst = currentInstrument();
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

    els.fingeringStage.innerHTML = `
      <div class="woodwind-view ww-${inst.id}">
        ${body}
      </div>`;
  }

  function renderPiano(note) {
    const inst = currentInstrument();
    const lo = (inst.concertStart ?? 58) - 1;
    const hi = (inst.concertEnd ?? 70) + 1;
    const isBlack = (name) =>
      ["C♯", "D♯", "E♭", "F♯", "G♯", "A♭", "A♯", "B♭"].includes(name);
    const keys = [];
    for (let m = lo; m <= hi; m++) {
      const info = Band.midiToName(m);
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

    els.fingeringStage.innerHTML = `
      <div class="piano-view">
        <div class="piano-keys">${whiteHtml}${blackHtml}</div>
      </div>`;
  }

  function renderFingering(note) {
    const inst = currentInstrument();
    if (inst.ui === "horn") renderHornValves(note);
    else if (inst.ui === "valves") renderValves(note);
    else if (inst.ui === "trombone") renderTrombone(note);
    else if (inst.ui === "woodwind") renderWoodwind(note);
    else if (inst.ui === "piano") renderPiano(note);
    else els.fingeringStage.innerHTML = "";
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

  function captureFingeringHtml(instId, note) {
    if (!els.fingeringStage || !note) return "";
    const host = document.createElement("div");
    host.className = "challenge-fingering-capture";
    const prevId = state.instrumentId;
    const prevStage = els.fingeringStage;
    state.instrumentId = instId;
    els.fingeringStage = host;
    try {
      renderFingering(note);
    } catch (_) {
      host.innerHTML = `<p class="challenge-option-fallback">${note.label || ""}</p>`;
    }
    els.fingeringStage = prevStage;
    state.instrumentId = prevId;
    return host.innerHTML || `<p class="challenge-option-fallback">${note.label || ""}</p>`;
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
        btn.innerHTML = `<div class="challenge-option-chart">${captureFingeringHtml(
          challengeState.instrumentId,
          note
        )}</div>`;
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
      els.challengeReveal.innerHTML = `<div class="challenge-option-chart">${captureFingeringHtml(
        challengeState.instrumentId,
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
    majorScalePitchClasses,
    midiToHz,
    noteDurationSec,
    showLayer,
    beatsPerNote,
    buildBeatPlan,
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
