# UI V4：舞台 + 舊紙面板

參考《新武林群俠傳》的版面。圖裡不放任何文字，所有字都是 React／Tailwind 畫出來的。

- **舞台**：場景畫滿版，16:9。寬螢幕時面板疊在畫的下方；窄螢幕（< 768px）時舞台在上、面板在下。
- **左上狀態框**：主角頭像放在圓形木框裡，下面貼一張紙條「{年}・{歲}歲」。1996 和結局不放童年頭像。
- **說話的人**：在舞台邊開一個半身窗。第一個說話的人在右，第二個在左。別人說話時，其他人的窗會變暗。對白放進氣泡，氣泡尾巴指向說話的人那一邊，名字用小字。
- **面板**：舊紙／撕日曆的質感（全用 CSS 漸層），左端是紫色卷軸，有琺瑯杯和膠袋的小 SVG。旁白和動作用書面中文寫在紙上，說過的對白以小字留在紙上。
- **逐句推進**：點一下、輕按，或按空白鍵／Enter，就到下一句。打字機效果可以點一下跳過；系統設定減少動態，或 `localStorage["hk-life-typewriter"]="0"` 時會關閉。「全部顯示」一次過顯示全部。選項要等最後一句出現後才出來。規則寫在 `src/game/reveal.ts`，有審計測試。
- **選項**：右邊吊著的紙牌。主要按鈕顏色較深。右下角顯示「下午 n/2」，n 是今年還剩的下午。
- **戰鬥**：用同一套舞台和面板。四條數值條保留，加上 `role="meter"`。右上角是步數。
- **無障礙**：目前那一句會放進 `aria-live="polite"`；鍵盤可以操作，有 focus-visible 外框；看數字用的 `<details>` 保留並收起。
- **色板**：審計會檢查 LifeApp、Stage、Battle 和 styles.css 裡的每個 hex 色，彩度不能超過琥珀 `#c9843a`。

## 桌面尺寸（V4.1）

這是給桌面瀏覽器玩的網頁遊戲。手機能玩就夠，不另外優化。

- **整頁縮放**：根字級 = 舞台寬 ÷ 80，最小 15px，最大 36px。所有用 rem 寫的尺寸（字、間距、紙牌、氣泡、狀態框）都會跟著舞台一起縮放：
  - 1280×720 是 16px
  - 1366×768 約 17px
  - 1440×900 是 18px
  - 1920×1080 是 24px
  - 2560×1440 是 32px
- **舞台大小**：寬度取「視窗寬 − 3rem」和「（視窗高 − 3rem）× 16/9」之中較小的一個，盡量填滿瀏覽器。
- **外框**：舞台四周是木桌紋底，加一圈紙邊和木框，不再用純黑邊。
- **面板高度**：面板最多佔舞台高度的 38%。半身窗放在面板上方，不會擋住面板。戰鬥時四條數值排成一行。
- **圖片解析度**：場景圖是 1280×720 的 WebP。原圖（assets）也只有 1280×720，沒有更大的版本。所以在 1920 寬會放大約 1.4 倍，在 2560 寬約 1.9 倍，會略為柔和。要更清晰，就要重新生成更高解析度的原圖。

## V4.2 — speaker anchors

- `src/game/sceneAnchors.ts` records the head of every person in each Q painting (`x`, `y` as fractions of the 16:9 image, `r` head radius as a fraction of its height), measured by eye; boy and girl versions share a layout. A speaker who talks on a page but is not painted gets `{ offscreen, label }` (e.g. Dad in EVT_1986_SKILL_05 on the kindergarten plate: 「（旁邊）」).
- Audit: every dialogue speaker on a painted page across the playtest lives must have an anchor or offscreen entry.

## V4.3 — RPG dialogue box with a pointer tail (replaces the V4.2 bubble)

- No speech bubble and no head ring on the painting any more; the painting stays clean.
- Dialogue lives in the bottom panel. When the current line is dialogue, the speaker's portrait (arched window, name plate under it) sits at the panel's left edge, right of the purple scroll end, and the line is shown beside it as name + 「line」 in a larger size. Narration and action lines show no portrait. Earlier dialogue lines stay in the panel history in small type. The panel auto-scrolls to keep the newest line in view.
- The panel grows a tail from its **top edge** up into the painting (`PanelTail` in `Stage.tsx`, geometry in `src/game/panelTail.ts`, pure and tested). The base slides along the top edge under the speaker's head (clamped `TAIL_EDGE` from the corners); the tip aims at the head centre and stops `TAIL_STOP` (1.45) head radii away, i.e. under the chin, never on the face. If the head is at or under the panel edge, no tail.
- Offscreen speakers: a short dashed stub leaning toward the side the voice comes from, plus the label (「（旁邊）」) after the name.
- One accent per speaker (`SPEAKER_ACCENT`) on the portrait frame, name plate, name dot/text and tail stroke. All accents pass the amber chroma check.
- Portrait crops: the standing sprites draw heads at very different sizes, so `personPortrait()` in `art.ts` gives each person its own height so the faces come out about the same size. Portrait windows are rem-sized, so they scale with the stage like the rest of the panel.
- a11y unchanged: the `aria-live` line still reads 「name：「line」」; the portrait and tail are decorative (`alt=""`, `aria-hidden`).
- Tests: for every anchored speaker in every scene, on a desktop layout (panel over the stage) and a phone layout (panel below), the tip sits on the ring round the head, base, tip and head centre line up, the tip is above the panel, and the base stays on the top edge; plus clamping, the offscreen stub, and a guard that no bubble/ring code comes back.
