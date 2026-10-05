# 人生・香港

1984–1986 幼年 prototype。規格鎖在 v2.4：記憶是事實，技能要有後續，正式 flag 必須有人讀，戰鬥用同一張消耗表。

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

人類實測（3 人 × 2 次）未做。這裡沒有假造遊玩紀錄。

## 檢查

```bash
npm run audit:content
```
