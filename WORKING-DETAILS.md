# 管樂半音階指法練習工具 — Working Details

**專案路徑：** `D:\My Documents\Cursor\Music Program`  
**日期：** 2026-07-25～2026-07-26  
**狀態：** 可開瀏覽器使用；今日暫告一段落  

---

## 1. 如何開啟

用瀏覽器直接開啟：

```
index.html
```

相關檔案：

| 檔案 | 說明 |
|------|------|
| `index.html` | 介面結構 |
| `styles.css` | 樣式（活塞/長號/木管/鋼琴/Tuner 等） |
| `instruments.js` | 樂器資料、移調、指法/把位、速度用語 |
| `app.js` | 播放、Tuner、指法渲染、控制邏輯 |
| `self-check.js` | Node 自檢（若本機有 Node） |
| `self-check.ps1` | PowerShell 自檢（目前環境用這個） |

自檢指令：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\self-check.ps1"
```

---

## 2. 產品目標

給管樂團學生做**對照練習**：全員對同一條**實音 Bb 半音階**，顯示各樂器譜面音與指法/把位，可調速度與每音拍數，並提供 Bb Tuner 延音。

---

## 3. 音樂規格（定案）

### 3.1 音準與音列

- 標準音：**A₄ = 442 Hz**
- 練習音列：**實音 Bb3 → Bb4** 半音階（含兩端，共 **13** 音）
- 播放音高：一律播**實音**（concert pitch）
- 拍號：固定 **4/4**

實音 Bb3（442）≈ **234.14 Hz**；Bb4 = 2 × Bb3 ≈ **468.28 Hz**。

### 3.2 起始音

- **所有樂器起始實音皆為 Bb**（合奏「原始音/實音」，非各樂器自己的譜面 C）
- 譜面音依移調顯示（見下表）

### 3.3 唱名/簡譜

- 依**譜面音**，固定 do：`C (do, 1)`
- 半音例：`C# (#do, #1)`、`Eb (bmi, b3)`、`Bb (bsi, b7)` 等

### 3.4 速度用語（國中常出現 5 種）

| 用語 | 中文 | 錨點 BPM（點選跳轉） |
|------|------|----------------------|
| Largo | 最緩板 | 50 |
| Adagio | 慢板 | 70 |
| Andante | 行板 | 88 |
| Moderato | 中板 | 108 |
| Allegro | 快板 | 120 |

速度滑桿範圍：30–144 BPM。靠近錨點 ±8 時顯示對應用語名稱。

### 3.5 每音拍數

可選 **1 / 2 / 4** 拍。

```
音長（秒）= (60 / BPM) × 每音拍數
```

例：60 BPM、4 拍 → 每音 4 秒。

### 3.6 Tuner

- 音高：實音 **Bb**（442）
- 可選：**原始（Bb3）**/**高八度（Bb4）**
- 行為：按下後**無限延音**；再按停止
- 開始練習/換樂器/停止時會關掉 Tuner

---

## 4. 樂器一覽（UI 不標調性）

內部仍使用國中常見管樂移調以計算實音；UI 只顯示名稱。

| UI 名稱 | 中文 | 內部記譜調性 | transpose（譜面−實音半音） | 起始譜面（實音 Bb） | 指法 UI |
|---------|------|--------------|---------------------------|---------------------|---------|
| Trumpet | 小號 | Bb | +2 | C | 三活塞 |
| Flute | 長笛 | C | 0 | Bb | 木管簡圖 |
| Clarinet | 豎笛 | Bb | +2 | C | 木管簡圖 |
| Alto Sax. | 中音薩氏管 | Eb | +9 | G | 木管簡圖 |
| Tenor Sax. | 中低音薩氏管 | Bb（含八度） | +14 | C | 木管簡圖 |
| French Horn | 法國號 | F | +7 | F | 三閥 |
| Trombone | 長號 | C（譜＝實） | 0 | Bb | 把位 1–7 |
| Euphonium | 上低音號 | C（譜＝實） | 0 | Bb | 三閥（四閥僅資料） |
| Tuba | 低音號 | C（譜＝實） | 0 | Bb | 三閥（四閥僅資料） |
| Piano | 鍵盤 | C | 0 | Bb | 琴鍵高亮 |

### 4.1 空閥/第 1 把位（重要）

- **Trumpet**：空閥＝譜面 C（實音 Bb）→ 與起始音一致  
- **Trombone/Euphonium/Tuba**：記譜為 C 調（譜＝實），但樂器自然音為 **Bb**  
  - 長號第 1 把位＝Bb  
  - 上低音號/低音號空閥＝Bb  
  - 故起始實音 Bb 時，這些樂器正好是 1 把位/空閥  

### 4.2 Euphonium/Tuba 四閥

- UI **只顯示三閥**
- 資料欄位保留 `valve4`（目前皆 `false`），暫不渲染、不動畫

---

## 5. 介面定案摘要

1. 音高列：**實音在左/上，譜面音在右/下**；已移除「頻率」  
2. 譜面主標簡化為 `C`、`D`、`Eb`…，旁附 `(do, 1)` 等（字級保持可讀）  
3. **Piston**：未按＝銀色；按下＝金色＋微光暈；左→右 1·2·3  
4. **Trombone**：大把位數字＋滑管刻度；含 Tenor **号口大概位置**當視覺錨點（第 3 把位對齊号口幾何）；**不顯示**教學說明句  
5. 其餘資訊列與小號一致：指法文字、進度、音列 chips、播放控制  

---

## 6. 指法資料來源與呈現

- 參考：[Yamaha Musical Instrument Guide — Fingering](https://www.yamaha.com/en/musical_instrument_guide/feature/fingering/)
- 銅管 Bb 系列三閥：與常見 Trumpet/Euphonium/Tuba 主指法一致（開、123、13、23、12、1、2…）
- 法國號：F 調常用三閥主指法（未含拇指鍵/雙調切換細節）
- 長號：Bb3–Bb4 主用把位表（1–7）
- 木管：簡化 ●○ 圖＋文字（非零件級 Yamaha PDF 還原）；後續可再精修
- 鋼琴：實音鍵位高亮

---

## 7. 架構概要

```
樂器選擇 → instruments.js（音列＋指法）
                ↓
         app.js 渲染指法 UI
                ↓
         Web Audio 播放實音（A=442）
```

`instruments.js` 匯出 `window.BandInstruments`：

- `instruments[]`、`getById()`
- `TEMPO_MARKS`
- `CONCERT_START` / `CONCERT_END`（58 / 70）
- `midiToHz()`、`midiToName()`、`solfegeFor()`

`app.js` 匯出 `window.BandPracticeApp`（除錯用）。

---

## 8. 今日決策紀錄（對話定案）

| 主題 | 定案 |
|------|------|
| 音域 | 由「各樂器譜面 C→C」改為全員**實音 Bb→Bb**（管樂合奏） |
| 樂器名稱 | 不顯示調性（不寫 Bb Clarinet 等） |
| Trombone/Euph/Tuba | 記譜 C 調；空閥/1 把位為 Bb |
| 長號 UI | 方案 B：大數字＋滑管刻度＋号口；無教學文案 |
| 四閥 | 資料可留、UI 不顯示 |
| 速度用語 | Largo、Adagio、Andante、Moderato、Allegro |
| Tuner | 實音 Bb 442，原始/高八度，無限延音 |

---

## 9. 已知限制/後續可做

1. 木管指法為教學簡化版，高音側鍵等尚未完整對齊 Yamaha PDF  
2. 法國號未做 Bb/F 雙調拇指鍵切換  
3. Tuba 目前與全員同高（Bb3–Bb4）；若要低八度可再加選項  
4. 長笛低音 Bb 需 B 腳鍵，資料有標註概念，圖示仍簡化  
5. 本機未必有 Node；自檢以 `self-check.ps1` 為準  
6. 尚無打包/安裝程式，純靜態網頁  

---

## 10. 快速驗收清單

- [ ] 選 Trumpet：起始實音 Bb、譜面 `C (do, 1)`、空閥  
- [ ] 選 Trombone：起始 Bb、第 1 把位、号口與刻度可見  
- [ ] 選 Euphonium/Tuba：三閥、起始空閥、無第四閥 UI  
- [ ] 每音 4 拍＋60 BPM：節奏明顯變慢  
- [ ] 點 Allegro → BPM 120  
- [ ] Tuner 原始/高八度延音，再按可停  
- [ ] 活塞未按銀、按下金＋光暈  

---

*本文件記錄 2026-07-25/26 工作階段的規格與實作現況，供之後接續開發使用。*
