# Domain glossary

## ScaleNotes / BandInstruments.scaleNotes

樂器「音階練習音池」：以該樂器音域起始記譜音為大調主音，過濾 `instrument.notes` 得到大調音級音列。音階練習與指法挑戰共用此 seam（`BandInstruments.scaleNotes`）。

## PracticeTiming

練習「怎麼排、打多久」的純計算 module：依音數、方向（上行／下行／上行後下行）、音階或半音階、每音拍數與 BPM，產出音列索引序列、4/4 拍值計畫，以及各步的發音時長／小節起始拍。不含 DOM、不含音訊。

## FingeringChallenge

「指法挑戰」純計算 module：從樂器大調音階音抽出一局題目（預設 5 題），每題 1 個譜面提示音與 3 個指法選項（優先選指法指紋不同者），並可判定對錯。音池委派 `BandInstruments.scaleNotes`。不含 DOM、不含音訊。

## UiSounds

UI 按鈕回饋音的對照 module：將音效種類（choose／back／startGame／correct／wrong／finish）對應到站內資產路徑。不含 DOM、不負責實際播放。
