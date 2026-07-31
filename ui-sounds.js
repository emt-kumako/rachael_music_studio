/**
 * UiSounds — UI 音效種類 → 資產路徑（純對照，不播放）
 */
window.UiSounds = (function () {
  const KINDS = Object.freeze({
    choose: "choose",
    back: "back",
    startGame: "startGame",
    correct: "correct",
    wrong: "wrong",
    finish: "finish",
  });

  /** 相對站根的部署路徑（檔名含空白由播放端 encode） */
  const ASSETS = Object.freeze({
    choose: "assets/ui-sounds/Choose.wav",
    back: "assets/ui-sounds/Vibe Back.wav",
    startGame: "assets/ui-sounds/Start Game.mp3",
    correct: "assets/ui-sounds/correct-choice-gliss-01.mp3",
    wrong: "assets/ui-sounds/Wrong.mp3",
    finish: "assets/ui-sounds/cartoon happy finish.mp3",
  });

  function assetPath(kind) {
    return ASSETS[kind] || null;
  }

  function allKinds() {
    return Object.keys(ASSETS);
  }

  return { KINDS, ASSETS, assetPath, allKinds };
})();
