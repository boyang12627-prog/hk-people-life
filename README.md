# 人生・香港

1984–1986 幼年 prototype。規格鎖在 v2.4。v2.5 只做量產準備，不加新章節。

## v2.5 量產準備

- 童年對白在 [src/game/data/events.ts](src/game/data/events.ts)。Reducer 不擁有事件正文。靜態新事件走 `renderStatic`，不必改引擎。
- 戰鬥決定：一份 engine，多份 spec。幼稚園門口是 `KINDY_DOOR`。消耗仍只讀 `BATTLE_COST`。第二套戰鬥規則先不要寫。
- 戰鬥有「跳過，算進去了」（當普通進入，不是完美）和「自動走進去」（steady）。給試玩用。
- `runLives(1000)` 用三種揀法走完三年。這不是人類試玩。
- 清單裡的 R3 / R4 / R5 沒有附定義，所以沒有猜著改。順手修了走近紅球打贏仍寫「拉著媽媽」。

## 玩家看見的

三年選擇、年尾回憶、1996 一個短場面，然後結局。數值在下一層。選項不標夢想或現實。

1996 會按小時候真正做過的事，給一個動作：自己走回去、先把袋子放下、先問一句，或等她說完。

## 規格

- 記憶用 `memoryTypeId`（種類）和 `instanceId`（一次）。同一種類可以留下多過一年，不會蓋掉舊的一次。
- `FLAG_HEARD_ADULT_FUTURE` 只是索引。聽過將來，以 `MEM_NEWS_01` 的 choiceId 為準。
- `FLAG_DAD_OVERTIME_MEMORY`、`FLAG_FIRST_INDEPENDENCE` 已停用。事實在記憶。
- `PLAYER_DAD_CHOICE_RESPONSE` 會在 1996 說出來。
- 卡片回聲用 `selectByPriority`：P0 一定出，P1 最多兩句，其餘先看還有沒有行數。
- `designTendency` 只供內容和測試記錄，不改數值。
- 存檔會丟掉未知事件、未知技能、未知 flag、對不上目錄的記憶，並把 phase / queue / eventId 拉回一致。
- 戰鬥 gate：三種 approach 在 steady + tidy + read 不能低過 20%。`provePerfect()` 用固定時機打出 perfect。

## 未做

人類實測（3–5 人）未做。這裡沒有假造遊玩紀錄。跳過和自動只是讓試玩的人可以走到 1996，不能代替那 3–5 人。

Gate 1 要求量度「寫一個事件要幾耐」。今次只證明一個靜態三選項事件可以不改 reducer，而且沒有放進正式年份。真正坐下來寫對白的時間還沒有量。

## 檢查

```bash
npm run audit:content
```
