# 人生・香港 Art Bible V2.1

狀態：**現行規格只有一套：Q 版全圖。** 人畫在場景裡面，不再貼上去。男女各一套，場景圖在 `public/art/q/`，對話框頭像在 `public/art/1985/people/`。

這是玩家定下來的方向，用來改掉上一版的「禁止 chibi」。舊的頭身比、舊生成句子已移到文末〈已廢棄（Legacy）〉，只作歷史紀錄，**不得**再拿來生成或審圖。

V2.1：玩家決定**以現有 Q 版圖為準**。下面的頭身比、線、眼睛都是看現有圖檔寫下的實際樣子（目測，不是量度規格）。新圖要跟現有圖一致，不跟舊版 1:4.5 規格。

## 一句

打開一本舊相簿，裡面的人開始動。平時是生活插畫。有壓力時，同一個地方變擠。多年後，舊物在現在的畫面上短暫疊一下。

本作品不以香港地標作為香港感的主要來源。禁止把霓虹、電車、維港、太平山、唐樓天際線畫成主體。香港感來自日常物件的密度、空間有多窄、人和人有多近。

## 現行畫面語言（Q 版）

兩個畫師必須畫出同一套，所以下面用規則，不用形容詞。

風格：

- Q 版（chibi）全圖：人物和場景畫在同一張圖裡，不是把人物貼在空房間上。
- 每個地方一張 Q 版畫，男、女主角各一張，五官相同。
- 頭身比（看現有圖目測，約數）：
  - 場景圖 `public/art/q/` 的孩子：大頭，頭約佔身高三分之一，約 1:2.5 到 1:3。
  - 頭像 `public/art/1985/people/`：孩子（主角、阿傑）約 1:2.7 到 1:3；媽媽約 1:3；嫲嫲約 1:2.5；爸爸頭特別大，約 1:2.2。
  - 舊版 1:4.5 / 1:5 / 1:5.5 / 1:6.5 / 1:7 已廢棄。

現有圖其實有兩種畫法，新圖要跟它要放的那一種：

| | 場景圖 `public/art/q/` | 頭像 `public/art/1985/people/` |
|---|---|---|
| 用途 | 每頁上方的整張畫 | 對話框 32px 圓形頭像（只露出頭和肩） |
| 線 | 有勾線：深棕近黑、幼、均勻，把人物和物件圈出來 | 幾乎沒有勾線，形體靠彩色鉛筆的明暗分開 |
| 眼睛 | 大，簡化成深色實心橢圓，帶一點白色高光，沒有眼白 | 大，有眼白、啡色虹膜、高光；眼寬約臉寬四分之一到五分之一 |
| 嘴和臉 | 簡單一筆的微笑或合嘴，淡淡腮紅 | 寫實一點的小嘴，多半合著，淡腮紅 |
| 質感 | 平塗加細鉛筆顆粒，背景細節多（舊屋邨、電視、風扇、膠凳） | 彩色鉛筆畫，白底透明 PNG，全身站或坐 |

鏡頭：

- 高度 95 公分，孩子的眼睛高度。相當於 40mm。不用 24mm 廣角，不用 85mm 廣告虛化。
- 近處的手、球、門檻清楚。三公尺外只留形狀，不寫招牌上的字。

光：

- 只有一個主光。1985 是門裡的日光，偏紙色，不是正午的白。
- 沒有輪廓光，沒有三盞燈。陰影軟，邊緣看得見。

顏色和顆粒：

- 沒有比琥珀 `#c9843a` 更鮮的顏色。紅球是舊塑膠，偏暗，不高於這顆琥珀。
- 大面積是紙 `#f3ead7`、墨 `#241c14`、雨灰和屋邨綠 `#35665d`。
- 全圖一層細鉛筆顆粒。看得到，但不能數點。不是厚油畫，不是照片。

線：跟上表。場景圖有深色幼勾線；頭像用彩色鉛筆明暗，不加粗勾線。舊規格「沒有純黑勾邊」已廢棄。

臉：跟上表。眼睛大是現行樣子；淡腮紅可以有。以下仍然有效：嘴多半合著；手指短，五根分開；重心在兩腳；不插腰，不飛髮，不對鏡頭露齒笑。

每張場景圖只能有**一個**主角孩子，除非這一頁本來就寫了別的孩子（例如阿傑、平台上那個沒有名字的孩子）。

材質隨年紀換，不是同一張圖換濾鏡：

| 年 | 必須是這些材料 |
|---|---|
| 1984 | 木、塑膠、舊電視、布、暖燈 |
| 1985 | 雨水、濕地、校舍油漆、塑膠凳 |
| 1986 | 水泥、晾著的衣服、鐵閘、螢光燈 |
| 1988 | 紙、擦膠屑、原子筆、木書桌 |
| 1996 | 較清楚的玻璃、街燈、制服、書包。仍是同一個人的臉 |

底色仍是程式裡的墨、紙、琥珀、屋邨綠。年代不另做一套主題。

## 人物

臉的基準圖：頭像以 `public/art/1985/people/` 的 `boy.png`、`girl.png`、`mom.png`、`dad.png`、`grandma.png`、`kit.png`、`teacher.png`、`auntie.png` 為準；場景圖以 `public/art/q/` 同一個地方的現有圖為準。舊的 `cast.jpg`（1:4.5 版本）是 Legacy，檔案已刪，只留在 git 歷史。

四歲主角，男女同一張臉、同一種膚色（暖米褐）、同一雙眼睛。
- 男孩：耳上的黑色短髮，有點亂。芥末黃（土黃）圓領 T 恤，深灰短褲，白襪，灰色魔術貼涼鞋。不要畫成鮮黃。
- 女孩：剛過耳的黑色冬菇頭（齊瀏海）。灰色 T 恤，深灰短褲，白襪，灰色涼鞋。不要畫成淺藍衫，不要紮辮。
- 1984 冬天飯桌可以穿長袖（男紅、女粉紅），其他場景用上面的衣服。
- 1988（七歲，小學）：同一張臉，略大。白色短袖校服恤衫；女孩是白恤衫配藍色背心裙或裙。同班同學穿同一套校服。

媽媽三十歲上下，成年人比例，絕不畫成小孩或少女。黑髮在腦後挽一個低髻（不是披肩長髮，不是高馬尾）。基準衣服是綠色上衣（`home-girl.jpg`、1985–86 新場景），頭像是米白寬上衣；啡灰長褲，米色平底鞋。臉比老師圓，眼睛往下看孩子。累，不漂亮。1985 手還牽著。1986 兩隻手各一袋餸。

爸爸：頭特別大，黑色短髮有點亂，不戴眼鏡。基準衣服是灰藍恤衫（裡面灰 T 恤），深藍長褲；頭像是灰 T 恤。

嫲嫲：灰髮在頭頂挽髻，米卡其長裙或米白上衣，可加啡色碎花圍裙。頭像不戴眼鏡。

老師四十歲上下。棕色短髮，用髮夾夾住，米白碎花罩衫，粉紅中長裙，米色鞋。招手、蹲下來。不是壞人。頭像是 `teacher.png`。

阿姨（街市、士多）。短曲髮，灰黑。花上衣，粉紅圍裙，灰色七分褲，手裡拿著一顆橙。頭像是 `auntie.png`。

阿傑和主角同年，稍高一點。黑色短髮，灰米色舊橫間 T 恤，深灰長褲，淺灰波鞋（不是背心、不是牛仔褲）。手上或身邊是一顆有蹭痕的暗紅色膠球。

大人在現有場景圖裡是全身畫出（例如幼稚園門口的媽媽）。舊規格「大人從胸口或腰裁掉」已廢棄。

## 戰鬥畫面

- 同一扇門變擠，不換地方，不出現怪。幼稚園：平時 `kindy`，壓力大時 `pressure`，進去後 `inside`。
- 戰鬥介面仍是精神力、氣力、壓力、目標。沒有血條，沒有寶物圖示。
- 1988 的卷子以後要自己變成場地：紙變髒、字變密、時鐘變大。現在不畫。

## 記憶和物件

記憶不是回到過去的一幕。1996 的畫面留著，疊上小手、紅球、門或那隻不走的錶，然後消失。現在用 `public/art/1985/memory.jpg` 疊一小塊。

塑膠錶普通到有點醜。可以有舊膠帶、不走的針、花痕。不是寶物。

## 字和介面

無襯線 Noto Sans TC 用於步數和四條計量。明體 Noto Serif TC 用於標題。記憶可以有一點鉛筆，不能整頁手寫。

## 圖檔清單

程式用到的每一張圖由 `src/game/art.ts` 的 `imageManifest()` 列出，`npm run audit:content` 逐張檢查檔案存在。畫面元件不得自己拼 `/art/` 路徑。`public/art/` 裡不在清單上的檔，就是沒有用到的檔。

## 現行生成句子（Q 版）

每張都要帶：

```
Q-version (chibi) Hong Kong everyday illustration, people painted inside the scene, not pasted on.
Big-head chibi proportions, children about 1:2.5 to 1:3 head-to-body. Large simple dark eyes with a small highlight, light blush, thin even dark-brown outlines.
Exactly one child protagonist unless the scene names another child.
Child's eye height about 95cm, 40mm lens. One soft main light. Fine pencil grain.
Nothing more saturated than amber #c9843a. Large areas of paper #f3ead7, ink #241c14, rain grey, estate green #35665d.
No neon, no tram, no harbour, no skyline, no photo, no pixel art, no monster.
```

負面：

```
photoreal, pixel art, monster, health bar, treasure icon, postcard skyline, readable sign, sexualized child, extra children
```

頭像（`public/art/1985/people/`）另用：

```
Coloured-pencil chibi portrait, full body, plain transparent background, big head about 1:2.5 to 1:3,
large eyes with whites and brown irises, soft shading, no heavy outline, mouth closed, standing weight on both feet.
Match the existing boy.png / mom.png set.
```

頭像檔存成透明 PNG，長邊 320px（畫面只用 32px，320px 足夠 3 倍以上）。

場景圖（`public/art/q/`）存成 WebP，1280×720，quality 80。畫面欄最闊是 `max-w-lg`（512px），圖片高度是畫面 34%，`object-cover` 之下實際寬度大約 400–640 CSS px；1280px 足夠 2 倍螢幕。新圖可以用更大的原圖生成，入庫前縮到 1280 寬再轉 WebP。男女一對必須同一個構圖、同一班大人，只換主角。

---

## 已廢棄（Legacy）— 不得再用

以下是 V1.0（Q 版定稿之前）的規格，保留作紀錄。**現行畫面不跟這套比例和句子。**

### 舊比例（已廢棄）

- 四歲，頭身長比 1:4.5。頭約佔身高兩成二。不是 1:2 的大頭。
- 五歲 1:5。七歲 1:5.5。十五歲 1:6.5。
- 大人若必須全身，1:7。1985 的畫面裡，大人從胸口或腰裁掉。

### 舊線和臉（已廢棄）

- 沒有純黑勾邊。形體靠顏色和陰影分開。若有線，只用暖棕 `#5c4a3a`，透明度不超過三成，只在頭髮和衣褶，不把整個人圈起來。
- 眼睛約佔臉寬五分之一。有眼白，瞳孔小。不畫圓腮紅，不畫星星高光。
- 臉以 `public/art/1985/cast.jpg` 為準。後續圖不得另起一張臉。（`cast.jpg` 已刪，只留在 git 歷史。）

### 舊 1985 直切要證明的十一項（歷史）

1. 幼稚園門口，95 公分高
2. 主角（男、女各一張，五官相同）
3. 媽媽
4. 老師
5. 阿傑
6. 紅球
7. 戰鬥時同一扇門變擠，不換地方，不出現怪
8. 戰鬥介面仍是精神力、氣力、壓力、目標
9. 進去之後的結果
10. 1996 只疊一小塊舊畫面，然後還是現在
11. 1986 仍是這扇門、這張臉，孩子略高，媽媽提著兩袋

舊計劃是「做完才畫 1984 飯桌、1986 走廊、1988 試卷、1996 街」。現在 1984–1988 的地方都已有 Q 版圖；1996 街仍未畫。

這一批的舊檔（`public/art/1985/` 的 `cast.jpg`、`door-*`、`pressure-*`、`inside-*`、`later-*`，以及 `public/art/1984/dinner-*`）已不在程式清單上，V3.2 已刪除，只留在 git 歷史。

### 舊生成句子（已廢棄）

```
1985 Hong Kong kindergarten, from a 95cm eye height, 40mm lens.
Head-to-body of the four-year-old is 1:4.5. Adults cropped at the waist.
One soft daylight from inside the door. No black outlines. Fine pencil grain.
Nothing more saturated than amber #c9843a.
No neon, no tram, no harbour, no skyline, no photo, no anime, no pixel art, no monster.
```

舊負面：

```
photoreal, pixel art, monster, health bar, treasure icon, black contour, postcard skyline, readable sign, sexualized child
```
