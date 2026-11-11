/* 單元 9：陣列——存取、for 載入、線性檢索與旗標、點算、最大最小、檢查次序、刪除、加入、調動；邏輯錯誤；模組化
 * 教科書 D1 第 3 章 p.122–161；課題練習 p.166–168
 * 常考／易錯出處：卷一歷年試題總索引 2012–2025。
 * 所有答案在 build 時由引擎計算／核對（陣列索引由 1 開始）。
 */
const C = (...ls) => ls.join('\n');
const HOT_ARR = { t: 'hot', why: '空運行包含陣列的算法：2012 甲32（45%）、2016 甲32（72%）、2019 甲33（69%）、2021 甲32（54%）、2023 甲28（77%）、2025 甲35（76%）' };
const HOT_MOD = { t: 'hot', why: '模組化的特徵及優點：2018 甲34（67%）、2022 甲33（53%）、2023 甲33（59%）、2024 甲33（42%）' };
const H = 'height[] ← [172.2, 152.3, 165, 170, 168.5, 175, 188, 160, 150, 155]';
const SONGS = 'songs[] ← ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10"]';
const READ5 = ['設 i 由 1 至 5', '    輸入 num[i]'];

module.exports = {
  id: 'u9',
  title: '陣列',
  book: '教科書 D1 第 3 章 p.122–161（另有 p.166–168 課題練習）',
  key: 'D1-u9-hmac-a2c6f8e05d',
  sections: [
    {
      id: 's1', title: '陣列與存取項目', pages: '教科書 p.122–126',
      learn: [
        { pts: [
          '**數據結構**有助整理數據。**一維陣列**把一組相同類型、相關的數據有次序地儲存在一連串記憶體位置。（p.122）',
          '用**陣列名稱加索引**存取項目：`age[3]` 是第 3 個項目。本書偽代碼索引由 **1** 開始（Python 由 0 開始）。（p.123–124）',
          '類比：陣列就像有很多抽屜的儲物櫃，每個抽屜有編號。（p.122）',
          '一次放入一組數據：`age[] ← [8, 21, 16, 55]`。（p.124 提示）',
          '用 for 循環逐一存取：`設 i 由 1 至 10` → `num[i] ← i * 10`。（p.125）',
          '`輸出 count` 會輸出整個陣列，例如 `[10, 0, 0, 10, 10]`。（p.126）',
        ] },
        { sim: { code: C('count[] ← [1, 0, 0, 1, 1]', '設 i 由 1 至 5', '    count[i] ← count[i] * 10', '輸出 count'), open: [] }, cap: '活動 3.3 第 2(i) 題（p.126）：右邊的變量區會把陣列畫成一格格，正在改變的格會亮起。' },
      ],
      tries: [
        { id: 'u9-s1-t1', pts: 4, src: '教科書 p.126 活動 3.3 第 2(iii) 題', code: C('num[] ← [15, 20, 10, 20, 25]', 'weight[] ← [1, 2, 2, 1, 3]', '設 k 由 1 至 5', '    score[k] ← num[k] * weight[k]', '輸出 score'),
          q: '先估：輸出是什麼？', options: ['[15, 40, 20, 20, 75]', '[16, 22, 12, 21, 28]', '[15, 20, 10, 20, 25]', '170'],
          why: '每個 score[k] 是同一位置的 num 乘 weight。' },
      ],
      practice: [
        { id: 'u9-s1-p1', type: 'fill', pts: 3, src: '教科書 p.126 活動 3.3 第 2(ii)、(iv) 題', q: '寫出兩個算法的輸出。',
          code: C('num[] ← [5, 10, 15, 20, 25, 30, 35]', 'total ← 0', '設 N 由 1 至 7', '    total ← total + num[N]', 'avg ← total / 7', 'AR[] ← [10, 20, 40, 80, 160]', 'r ← 0', '設 k 由 3 至 5', '    r ← r + AR[k]'),
          blanks: [{ label: 'total', ask: { var: 'total' } }, { label: 'avg', ask: { var: 'avg' } }, { label: 'r', ask: { var: 'r' } }], hint: 'r 只加 AR[3] 至 AR[5]。' },
        { id: 'u9-s1-p2', type: 'fill', pts: 2, src: '教科書 p.125 活動 3.3 第 1 題', q: '寫出 num 的最終值。',
          code: C('num[1] ← 1', '設 k 由 2 至 7', '    num[k] ← num[k-1] + 2', '輸出 num'), blanks: [{ label: '輸出', ask: 'out' }], hint: '每一項是前一項加 2。' },
      ],
    },
    {
      id: 's2', title: '以循環載入陣列', pages: '教科書 p.127–133',
      learn: [
        { pts: [
          'while 循環也可以載入陣列：`num[N] ← N * 3`，N 由 1 加到 100。（p.127 例題 3.3）',
          '追蹤陣列時，表內寫「num[1] ← 3」等。（p.127）',
          '一項可以用前面的項計算，例如斐波那契數列 `F[N] ← F[N-2] + F[N-1]`。（p.129）',
          '用變量 first、last 作為索引範圍，不用改寫算法便可計算不同時段。（p.133）',
        ] },
        { sim: { code: C('F[1] ← 1', 'F[2] ← 1', '設 N 由 3 至 10', '    F[N] ← F[N-2] + F[N-1]', '輸出 F[7]'), open: ['trace'] }, cap: '測試站 3.3 第 1 題（p.129）：斐波那契數列。' },
      ],
      tries: [
        { id: 'u9-s2-t1', pts: 4, src: '教科書 p.129 測試站 3.3 第 3 題', code: C('diff ← 3', 'index ← 1', '當 diff < 19', '    num[index] ← diff + 1', '    輸出 num[index]', '    diff ← diff + 4', '    index ← index + 1'),
          q: '先估：輸出是什麼？', options: ['3 7 11 15', '3 7 11 15 19', '4 8 12 16', '4 8 12 16 20'], open: ['trace'],
          why: 'diff 是 3、7、11、15 時執行，各輸出 diff + 1；diff = 19 時離開。' },
      ],
      practice: [
        { id: 'u9-s2-p1', type: 'mc', pts: 3, src: '教科書 p.129 測試站 3.3 第 2 題（參考 DSE 2019 1A Q33）', verify: true,
          q: '以下算法的輸出是什麼？', code: C('A[1] ← 10', '設 i 由 1 至 7', '    A[i+1] ← A[i] + i', '輸出 A[5] - A[4]'),
          options: ['1', '2', '3', '4'], hint: 'A：10、11、13、16、20。' },
        { id: 'u9-s2-p2', type: 'fill', pts: 2, src: '教科書 p.128 例題 3.3 第 2 題', q: '以下算法的輸出是什麼？它的目的是什麼？（只需寫輸出）',
          code: C('AR[] ← [20, 5, 3, 10, 15]', 'R ← 0', '設 i 由 1 至 5', '    如果 AR[i] > 10 則', '        R ← R + 1', '輸出 R'), blanks: [{ label: '輸出', ask: 'out' }],
          fix: '教科書 p.128 原題第 4 行寫「R = R + 1」，用「=」而不是「←」賦值（D1-21 同類）。',
          hint: '統計有多少個項目大於 10；10 不大於 10。' },
      ],
    },
    {
      id: 's3', title: '線性檢索與旗標', pages: '教科書 p.134–138',
      learn: [
        { pts: [
          '**線性檢索**：由索引 1 開始逐一比較，直至找到目標值或到達最後一項。（p.134）',
          '**旗標（flag）**：監視狀態的變量。先假設找不到（`found ← False`），找到才改為 True；應用布爾數據類型。（p.135）',
          '要知道**位置**：`index` 初始值設為 -1（代表找不到），找到時 `index ← i`。（p.136）',
          '找到第一個便停止：while 條件加上 `found = False`。（p.136）',
          '已排序的陣列：遇到比目標大的值便可停止（`member[i] <= target`）。（p.137）',
        ] },
        { sim: { code: C(H, '輸入 target', 'found ← False', '設 i 由 1 至 10', '    如果 target = height[i] 則', '        found ← True', '輸出 found'), inputs: '175', open: ['trace'] }, cap: 'p.134 的算法。試輸入 175、140、150。' },
      ],
      tries: [
        { id: 'u9-s3-t1', pts: 4, src: '教科書 p.135 活動 3.4 第 2 題（大雄的算法）', code: C(H, '輸入 target', '設 i 由 1 至 10', '    如果 target = height[i] 則', '        found ← True', '    否則', '        found ← False', '輸出 found'), inputs: '175', fixedInputs: true,
          q: '先估：175 在陣列中（第 6 項）。大雄的算法輸出什麼？', options: ['True', 'False', '6', '沒有輸出'], open: ['trace'],
          why: '找到後循環仍繼續，之後每次不相等都把 found 改回 False；只有目標在最後一項才會輸出 True。這是邏輯錯誤。' },
      ],
      practice: [
        { id: 'u9-s3-p1', type: 'complete', pts: 3, src: '教科書 p.136 例題 3.4 第 1 題', label: '補完偽代碼',
          q: '找到目標值時輸出它的索引，找不到輸出 -1；有多個相同值時只找第一個。會用多組數據測試。',
          template: C(H, '輸入 target', 'found ← False', 'index ← ［1］', 'i ← 1', '當 i <= 10 AND ［2］', '    如果 target = height[i] 則', '        found ← True', '        index ← i', '    i ← i + 1', '輸出 index'),
          ref: ['-1', 'found = False'], tests: [{ inputs: '175' }, { inputs: '140' }, { inputs: '172.2' }, { inputs: '155' }], hint: 'index 先假設找不到；找到後 found 變成 True，循環便要停止。' },
        { id: 'u9-s3-p2', type: 'fill', pts: 2, src: '教科書 p.137 例題 3.4 第 2(c) 題', q: '已排序的陣列 member。輸入 4000，輸出是什麼？while 循環體執行了多少次？',
          code: C('member[] ← [1456, 1530, 2630, 3160, 4604, 5420, 7082, 8652, 9320, 9432]', '輸入 target', 'found ← False', 'index ← -1', 'i ← 1', '當 i <= 10 AND found = False AND member[i] <= target', '    如果 target = member[i] 則', '        found ← True', '        index ← i', '    i ← i + 1', '輸出 index'), inputs: '4000',
          blanks: [{ label: '輸出', ask: 'out' }, { label: '循環體執行次數', ask: { count: 6 } }], hint: '4604 已大於 4000，便停止。' },
      ],
    },
    {
      id: 's4', title: '點算、最大最小、檢查次序', pages: '教科書 p.139–144',
      learn: [
        { pts: [
          '**點算**：`count ← 0`，符合條件便 `count ← count + 1`。（p.139）',
          '**找最大值**：先把 `tallest ← height[1]`，再由第 2 項逐一比較，較大便取代——就像「打擂台」。（p.140–141）',
          '找最小值：把條件改成 `<`。（p.141）',
          '**檢查次序**：先假設已排序（`sorted_list ← True`），比較 `height[i] > height[i+1]`，i 由 1 至 9（最後一項沒有下一項）。（p.142）',
          '改用 while 循環，找到一個不按次序便立即停止，效率較高。（p.144）',
        ] },
        { fix: '教科書 p.144 測試站 3.5 題目說「五位小朋友」，但陣列 weight 有 7 個值；答案「設 i 由 1 至 6」亦按 7 項計算（D1-23）。' },
        { sim: { code: C(H, 'tallest ← height[1]', '設 i 由 2 至 10', '    如果 height[i] > tallest 則', '        tallest ← height[i]', '輸出 tallest'), open: ['trace'] }, cap: 'p.140：找出最高的身高。' },
      ],
      tries: [
        { id: 'u9-s4-t1', pts: 4, src: '教科書 p.139', code: C(H, '輸入 bound', 'count ← 0', '設 k 由 1 至 10', '    如果 height[k] > bound 則', '        count ← count + 1', '輸出 count'), inputs: '170', fixedInputs: true,
          q: '先估：輸入 170，輸出是什麼？', options: ['2', '3', '4', '5'], open: ['trace'],
          why: '大於 170 的有 172.2、175、188；170 本身不大於 170。' },
      ],
      practice: [
        { id: 'u9-s4-p1', type: 'complete', pts: 3, src: '教科書 p.139 測試站 3.4', label: '補完偽代碼',
          q: '統計有多少個同學的分數低於平均分 76.8。', template: C('mark[] ← [56, 90, 85, 87, 66]', 'avg_mark ← 76.8', 'count ← 0', '設 i 由 ［1］ 至 ［2］', '    如果 ［3］ 則', '        count ← count + 1', '輸出 count'),
          ref: ['1', '5', 'mark[i] < avg_mark'], tests: [{ inputs: '' }], hint: '五個分數；條件是「低於」平均分。' },
        { id: 'u9-s4-p2', type: 'complete', pts: 2, src: '教科書 p.144 測試站 3.5', label: '補完偽代碼',
          q: '檢查陣列 weight 是否由**大至小**順序排列。', template: C('weight[] ← [30.5, 29.6, 29.1, 28.8, 28.1, 27.3, 26.9]', 'sorted_list ← True', '設 i 由 ［1］ 至 ［2］', '    如果 ［3］ 則', '        sorted_list ← False', '輸出 sorted_list'),
          ref: ['1', '6', 'weight[i] < weight[i+1]'], tests: [{ inputs: '' }], hint: '7 個值只需比較 6 次；由大至小時，後一項比前一項大便是出錯。' },
      ],
    },
    {
      id: 's5', title: '刪除、加入及調動項目', pages: '教科書 p.146–155',
      learn: [
        { pts: [
          '**刪除**索引 P 的項目：`設 i 由 P 至 L-1`，`height[i] ← height[i+1]`，最後 `L ← L - 1`（L 是陣列大小）。（p.146）',
          '範圍是「至 L-1」：若到 L，會讀取不存在的 height[L+1]。（p.147）',
          '**加入**到索引 P：先 `L ← L + 1`，再 `設 i 由 L 下至 P+1`，`height[i] ← height[i-1]`，最後 `height[P] ← H`。（p.148）',
          '加入要**由後向前**移；若由前向後，所有項目會變成同一個值。（p.149）',
          '類比「排排坐」：有人離開，後面的人逐一向前移；有人插隊，後面的人由最後一位開始向後移。（p.150）',
          '**調動**：把第 K 項移到第 1 項——先 `temp ← songs[K]`，再把前面的項目向後移，最後 `songs[1] ← temp`。（p.153–154）',
        ] },
        { fix: '教科書 p.149 試想想答案說「陣列項目 3 至 11 全是同一數值」，陣列只有 10 項，應為 3 至 10（D1-26）。' },
        { sim: { code: C(SONGS, '輸入 K', 'temp ← songs[K]', '設 i 由 K 下至 2', '    songs[i] ← songs[i-1]', 'songs[1] ← temp', '輸出 songs'), inputs: '6', open: [] }, cap: 'p.154 小玉的算法：把第 K 首歌移到第一位。' },
      ],
      tries: [
        { id: 'u9-s5-t1', pts: 4, src: '教科書 p.150 活動 3.6', code: C('num[] ← [1, 2, 3, 4, 5, 6]', '設 i 由 3 至 6', '    num[i] ← num[i-1]', '輸出 num'),
          q: '先估：由前向後移，輸出是什麼？', options: ['[1, 2, 2, 2, 2, 2]', '[1, 2, 2, 3, 4, 5]', '[1, 2, 3, 3, 4, 5]', '[2, 3, 4, 5, 6, 6]'],
          why: 'num[3] 先變成 2，之後每項都複製已被改寫的前一項，全部變成 2。' },
      ],
      practice: [
        { id: 'u9-s5-p1', type: 'fill', pts: 3, src: '教科書 p.146–147', q: '刪除第 5 位同學（P = 5）後，輸出是什麼？',
          code: C(H, 'L ← 10', '輸入 P', '設 i 由 P 至 L-1', '    height[i] ← height[i+1]', 'L ← L - 1', '輸出 height[5], L'), inputs: '5',
          blanks: [{ label: '輸出', ask: 'out' }], hint: '原本第 6 項移到第 5 項；L 減 1。' },
        { id: 'u9-s5-p2', type: 'fill', pts: 2, src: '教科書 p.155', q: '播放清單是 M1 至 M10。小萍輸入「7」運行一次，再輸入「3」運行一次。最後輸出是什麼？',
          code: C(SONGS, '設 r 由 1 至 2', '    輸入 K', '    temp ← songs[K]', '    設 i 由 K 下至 2', '        songs[i] ← songs[i-1]', '    songs[1] ← temp', '輸出 songs'), inputs: '7, 3',
          blanks: [{ label: '輸出', ask: 'out' }], hint: '第一次後：M7、M1、M2……；第二次把第 3 項（M2）移到最前。' },
      ],
    },
    {
      id: 'write', kind: 'write', title: '寫算法', pages: '教科書 p.136–152',
      intro: '每題先用 for 循環把 5 個輸入放入陣列 `num`（`設 i 由 1 至 5` → `輸入 num[i]`，已寫好）。輸入數據用逗號分隔。',
      tasks: [
        { id: 'u9-w1', tier: '必做', title: '合格人數及最高分', pts: 20, src: '教科書 p.139–141',
          prompt: '5 個分數已放入陣列 `num`。輸出**合格（50 分或以上）人數**和**最高分**（用一個「輸出」，例如 `輸出 count, highest`）。',
          starter: C(...READ5, ''),
          ref: C(...READ5, 'count ← 0', 'highest ← num[1]', '設 i 由 1 至 5', '    如果 num[i] >= 50 則', '        count ← count + 1', '    如果 num[i] > highest 則', '        highest ← num[i]', '輸出 count, highest'),
          tests: [{ inputs: '56, 90, 45, 87, 30', show: true }, { inputs: '10, 20, 30, 40, 49' }, { inputs: '50, 50, 50, 50, 50' }, { inputs: '99, 12, 75, 100, 0' }],
          hint: '點算：count 由 0 開始；最大值：highest 先設為 num[1]。' },
        { id: 'u9-w2', tier: '進階', title: '找出位置（線性檢索）', pts: 10, src: '教科書 p.136 例題 3.4',
          prompt: '5 個數字放入 num 後，再輸入 `target`。輸出 target **第一次**出現的索引；找不到輸出 -1。用旗標 found 和 while 循環，找到便停止。',
          starter: C(...READ5, '輸入 target', ''),
          ref: C(...READ5, '輸入 target', 'found ← False', 'index ← -1', 'i ← 1', '當 i <= 5 AND found = False', '    如果 num[i] = target 則', '        found ← True', '        index ← i', '    i ← i + 1', '輸出 index'),
          rules: [{ re: '^當 ', msg: '這題要用 while 循環（「當 條件」）。' }],
          tests: [{ inputs: '12, 7, 30, 7, 5, 7', show: true }, { inputs: '12, 7, 30, 7, 5, 99' }, { inputs: '4, 8, 15, 16, 23, 4' }, { inputs: '4, 8, 15, 16, 23, 23' }],
          hint: 'index 先設為 -1；while 條件加上 `found = False`。' },
        { id: 'u9-w3', tier: '挑戰', title: '插班生（加入已排序陣列）', pts: 5, src: '教科書 p.151–152 例題 3.5',
          prompt: '5 個由小至大排好的數字放入 num 後，再輸入新數值 `H`。把 H 加入陣列，使陣列仍然由小至大排列，然後 `輸出 num`。',
          starter: C(...READ5, '輸入 H', ''),
          ref: C(...READ5, '輸入 H', 'found ← False', 'index ← 6', 'i ← 1', '當 i <= 5 AND found = False', '    如果 H < num[i] 則', '        found ← True', '        index ← i', '    i ← i + 1', '設 i 由 6 下至 index + 1', '    num[i] ← num[i-1]', 'num[index] ← H', '輸出 num'),
          tests: [{ inputs: '150, 155, 160, 170, 188, 166', show: true }, { inputs: '10, 20, 30, 40, 50, 5' }, { inputs: '10, 20, 30, 40, 50, 60' }, { inputs: '10, 20, 30, 40, 50, 30' }],
          hint: '先找位置（index 預設 6，代表最大）；再由第 6 項向前移到 index + 1；最後放入 H。' },
      ],
    },
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.122、p.161、p.166–167',
      items: [
        { id: 'u9-q1', pts: 4, src: '教科書 p.166 課題練習 選擇題 4', tags: [HOT_ARR], verify: true,
          q: '以下算法的輸出是什麼？（陣列的索引由 1 開始）', code: C('sum ← 0', 'A[] ← [5, 2, 45, 17, 33]', '設 i 由 1 至 4', '    sum ← sum + A[i]', '輸出 sum'),
          options: ['17', '52', '69', '102'], answer: 'C', why: '只加首 4 項：5 + 2 + 45 + 17 = 69。' },
        { id: 'u9-q2', pts: 4, src: '教科書 p.166 課題練習 選擇題 5', tags: [HOT_ARR], verify: true,
          q: '以下算法的輸出是什麼？（陣列的索引由 1 開始）', code: C('A[] ← [4, 5, 5, 3, 8, 9, 5, 6, 8]', 'target ← 8', 'index ← -1', '設 i 由 1 至 9', '    如果 A[i] = target 則', '        index ← i', '        輸出 index'),
          options: ['0', '5', '9', '59'], answer: 'D', why: '8 在索引 5 和 9，兩次都輸出。' },
        { id: 'u9-q3', pts: 4, src: '教科書 p.167 課題練習 選擇題 6（參考 DSE 2017 1A Q33）', tags: [{ t: 'trap', why: '辨別刪除陣列元素的算法目的：2017 甲33 答對率 33%' }],
          q: '以下算法的目的是什麼？', code: C('num[] ← [13, 20, 21, 27]', '設 i 由 1 至 3', '    num[i] ← num[i+1]', 'num[4] ← 0'),
          options: ['把陣列內所有數值加一', '把 num[1]、num[2] 和 num[3] 加一', '刪除陣列中第一個數值', '刪除陣列中最後的數值'], answer: 'C',
          why: '每項取代為後一項：[20, 21, 27, 0]，第一個數值 13 被刪除。' },
        { id: 'u9-q4', pts: 4, src: '自擬（考點參考 DSE 2013 卷一甲部第 33 題）', tags: [{ t: 'trap', why: '在算法設計上使用陣列的主要優點：2013 甲33 答對率 35%' }],
          q: '在算法設計上使用陣列的主要優點是什麼？', options: ['陣列令程式執行時不會出錯', '可以用同一個名稱加索引，配合循環處理一組數據', '陣列的項目可以是不同的數據類型', '陣列比變量佔用較少記憶體'], answer: 'B',
          why: '十個或一千個數據都可用 for 循環以索引逐一處理，不用逐個變量命名（p.122）。' },
        { id: 'u9-q5', pts: 4, src: '教科書 p.161 測試站 3.8（參考 DSE 2018 1A Q34）', tags: [HOT_MOD],
          q: '以下哪些是設計算法時使用模組的特徵？\n(1) 開發模組的成本較高。\n(2) 模組可獨立開發及測試。\n(3) 模組是可重用的。\n(4) 模組只用來解決簡單的問題。',
          options: ['只有 (1) 和 (2)', '只有 (1) 和 (4)', '只有 (2) 和 (3)', '只有 (2) 和 (4)'], answer: 'C',
          why: '模組化的好處：易於理解、便於重複使用、可獨立開發測試、提升開發效率（p.159–160）。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['arrsum', 'arrshift', 'arrcount'], intro: '按教科書題型（p.125–155）隨機生成陣列題目，答案由模擬器計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
