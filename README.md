# 人生・香港　幼年原型源碼

1984–1986 幼年可玩原型，畀評測睇選擇、記憶同畫面點樣扣埋。

可玩版本：[https://hkpeoplelife.grok.me/](https://hkpeoplelife.grok.me/)

呢個 repo 只抽出遊戲本身嘅源碼，未包含成個應用框架同場景圖，所以 clone 完唔可以直接跑。評測請玩上面條連結，讀碼請由下面開始。

## 先睇邊度

| 檔案 | 做咩 |
| --- | --- |
| `src/game/content.ts` | 三年事件、對白、選擇、舊選擇點樣返嚟 |
| `src/game/engine.ts` | 每年兩次時間、事件唔扣時間、記憶點樣寫低 |
| `src/game/types.ts` | 狀態名。心安唔係血；戰鬥用精神力同幹勁 |
| `src/components/life/LifeApp.tsx` | 畫面先講人，數字收喺檔案 |
| `src/components/life/Battle.tsx` | 幼稚園門口。入唔到可以再試，唔會完 |
| `src/game/battleSim.ts` | 精神力、幹勁、壓力點計 |

## 評測時可以留意

- 1984 年飯枱同阿媽嘅選擇，會喺 1985、1986 嘅對白自己出聲。
- 每年完記低你做過嘅事。十年後先至砌成一句人生回聲。
- 平衡選項有代價，唔係免費最優解。
- 幼稚園輸咗唔係 Game Over。
