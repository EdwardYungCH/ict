/* 選修C 單元 c3a：嵌套條件語句、嵌套循環、嵌套循環與二維列表
 * 教科書 選修C 第 3 章 3.1–3.3 p.70–83（測試站 3.1、活動 3.1–3.2、例題 3.1–3.2、測試站 3.2）；課題練習 p.99–103
 * 第 3 章分為兩個單元：c3a（3.1–3.3）、c3b（3.4–3.5 綜合應用及算法比較）。
 * 教科書的偽代碼陣列由 1 或 0 開始；本單元的 Python 程式一律用 0 開始的列表索引。
 * 所有答案在 build 時由 CPython 計算／核對。
 */
const C = (...ls) => ls.join('\n');
const TRAP_NEST = { t: 'trap', why: '內循環的範圍隨外循環變量改變時，不可以直接用「外循環次數 × 內循環次數」。' };
const HOT_2D = { t: 'hot', why: '卷二D 常考以嵌套循環處理二維陣列（DSE 2014 2D Q4、2016 2D Q4、2017 2D Q4、2019 2D Q2、2021 2D Q3）' };

// 測試站 3.2 第 4 題的賓果結果：每行輸入 5 個 T／F
const READ5 = C(
  'result = []',
  'for i in range(0, 5):',
  '    line = input()',
  '    row = []',
  '    for ch in line:',
  '        row = row + [ch == "T"]',
  '    result = result + [row]');
const BINGO_IN = 'FFTFT\nTFTTF\nTTTTT\nFTTFF\nTFFFF';

const TRI = C(
  'a = int(input())',
  'b = int(input())',
  'c = int(input())',
  'if a <= 0 or b <= 0 or c <= 0:',
  '    print("不可能形成三角形")',
  'elif a + b <= c or a + c <= b or b + c <= a:',
  '    print("不可能形成三角形")',
  'else:',
  '    if a == b and a == c:',
  '        print("等邊三角形")',
  '    elif a == b or a == c or b == c:',
  '        print("等腰三角形")',
  '    else:',
  '        print("不等邊三角形")');

const SHELF = C(
  'B = [[5, 9, 6, 5, 3, 4],',
  '     [2, 3, 8, 2, 6, 5],',
  '     [8, 3, 5, 3, 9, 9]]',
  'total = 0',
  'for i in range(0, 3):',
  '    for j in range(0, 6):',
  '        total = total + B[i][j]',
  'print(total)');

const CHI = C(
  'form5_chi = [[65, 89, 61, 49, 62, 51, 88, 97, 85, 70],',
  '             [38, 68, 79, 90, 89, 95, 77, 61, 55, 63],',
  '             [76, 85, 96, 45, 62, 36, 79, 91, 87, 65],',
  '             [69, 88, 76, 55, 83, 71, 47, 68, 89, 94]]');

module.exports = {
  id: 'c3a',
  title: '嵌套條件語句及嵌套循環',
  book: '教科書 選修C 第 3 章 3.1–3.3 p.70–83（另有 p.99–103 課題練習）',
  key: 'C-c3a-hmac-859acb7a95',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '嵌套條件語句', pages: '教科書 p.70–71',
      learn: [
        { pts: [
          '**嵌套結構**：把一個結構放進另一個結構內。（p.70）',
          '**嵌套條件語句**：條件語句嵌套在另一條件語句的分支內；先按前一個條件的結果，再決定會否進入另一個條件語句。（p.70）',
          '`if … elif … elif … else` 其實就是嵌套條件語句：每個 `elif` 等於「`else:` 之內再寫一個 `if`」。兩種寫法效果一樣，但 `elif` 不用一層層縮排，較易讀。（p.70 程式碼 A、B）',
          '條件語句不只可以放在 `else` 分支內，也可以放在「則」分支內，例如 `if 條件1:` 之下再有 `if 條件2:`。（p.70）',
          'Python 用**縮排**表示哪些語句屬於哪一個分支；`else` 與哪個 `if` 對齊，就屬於那個 `if`。',
        ] },
        { sim: { code: TRI, inputs: '3\n5\n3', step: true, open: ['vars'] },
          cap: '測試站 3.1（p.71）的 Python 版本：先檢查邊長是否有效、能否形成三角形，再在 `else` 分支內用嵌套條件語句分類。試改輸入，例如 `3 4 5`、`1 2 3`、`0 4 4`。' },
        { fix: {
          bad: C('x = 5', 'if x > 0:', '    if x > 10:', '        print("大於 10")', '    else:', '        print("負數或零")'),
          good: C('x = 5', 'if x > 0:', '    if x > 10:', '        print("大於 10")', 'else:', '    print("負數或零")'),
          why: '`else` 縮排錯了，變成屬於內層的 `if x > 10`，x = 5 時錯誤地輸出「負數或零」。這是**邏輯錯誤**，Python 不會報錯。' } },
      ],
      tries: [
        { id: 'c3a-s1-t1', pts: 4, src: '仿教科書 p.70（嵌套在不同分支內）', code: C('x = 15', 'y = 4', 'if x > 10:', '    if y > 5:', '        print("A")', '    else:', '        print("B")', 'else:', '    if y > 5:', '        print("C")'),
          q: '先估：輸出是什麼？', options: ['A', 'B', 'C', '沒有輸出'],
          why: 'x > 10 成立，進入「則」分支；y > 5 不成立，執行內層的 else，輸出 B。外層 else 分支不會執行。' },
        { id: 'c3a-s1-t2', pts: 4, src: '自擬（縮排陷阱）', code: C('x = 5', 'if x > 10:', '    if x > 20:', '        print("A")', 'else:', '    print("B")', 'print("C")'),
          q: '先估：輸出是什麼？', options: ['C', 'B\nC', 'A\nC', 'B'],
          why: '`else` 與外層 `if x > 10` 對齊，屬於外層。5 > 10 不成立，輸出 B；最後一行不在任何 if 之內，一定執行，輸出 C。' },
      ],
      practice: [
        { id: 'c3a-s1-p1', type: 'complete', pts: 3, src: '教科書 p.71 測試站 3.1 第 1 題', label: '補完程式',
          q: '輸入三角形的 3 條邊長 a、b、c。補完條件，令程式正確分類：等邊、等腰、不等邊，或不可能形成三角形（任何邊長不是正數；或任意 2 條邊之和**不大於**第 3 條邊）。會用多組數據測試。',
          template: C('a = int(input())', 'b = int(input())', 'c = int(input())', 'if ［1］:', '    print("不可能形成三角形")', 'elif ［2］:', '    print("不可能形成三角形")', 'else:', '    if a == b and a == c:', '        print("等邊三角形")', '    elif a == b or a == c or b == c:', '        print("等腰三角形")', '    else:', '        print("不等邊三角形")'),
          ref: ['a <= 0 or b <= 0 or c <= 0', 'a + b <= c or a + c <= b or b + c <= a'],
          tests: [{ inputs: '3\n3\n3' }, { inputs: '3\n4\n5' }, { inputs: '1\n2\n3' }, { inputs: '0\n4\n4' }, { inputs: '5\n3\n3' }, { inputs: '2\n9\n3' }, { inputs: '4\n-1\n4' }],
          hint: '「不可能」只要其中一個情況出現便成立，所以用 `or`。1、2、3 不能形成三角形：1 + 2 = 3，不大於 3。' },
        { id: 'c3a-s1-p2', type: 'mc', pts: 3, src: '教科書 p.70 程式碼 A、B', q: '以下哪一段程式與這段程式的效果**相同**？',
          code: C('if m >= 80:', '    g = "A"', 'elif m >= 50:', '    g = "B"', 'else:', '    g = "C"'),
          options: [
            C('if m >= 80:', '    g = "A"', 'if m >= 50:', '    g = "B"', 'else:', '    g = "C"'),
            C('if m >= 80:', '    g = "A"', 'else:', '    if m >= 50:', '        g = "B"', '    else:', '        g = "C"'),
            C('if m >= 50:', '    g = "B"', 'elif m >= 80:', '    g = "A"', 'else:', '    g = "C"'),
            C('if m >= 80:', '    g = "A"', 'else:', '    if m >= 50:', '        g = "B"', 'else:', '    g = "C"'),
          ], answer: 1,
          hint: '`elif` = 在 `else` 分支內再寫 `if`。第一個選項 m = 90 時 g 會被改成 "B"；第三個選項的條件次序錯了；第四個有兩個 else 對齊同一個 if，是語法錯誤。' },
        { id: 'c3a-s1-p3', type: 'fill', pts: 2, src: '仿教科書 p.70', q: '分別寫出兩組輸入的輸出。',
          code: C('t = int(input())', 'rain = input()', 'if t >= 28:', '    if rain == "Y":', '        advice = "帶傘"', '    else:', '        advice = "帶帽"', 'else:', '    if rain == "Y":', '        advice = "帶傘及外套"', '    else:', '        advice = "帶外套"', 'print(advice)'),
          inputs: '30\nN',
          blanks: [{ label: '輸入 30、N 時 advice 的值', ask: { var: 'advice' } }, { label: '輸入 20、Y 時 advice 的值', a: '帶傘及外套' }],
          hint: '先看外層條件 t >= 28，再看內層 rain。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '嵌套循環', pages: '教科書 p.72–78',
      learn: [
        { pts: [
          '**嵌套循環**：把一個循環放進另一個循環內。（p.74）',
          '外循環體每執行一次，內循環便**由頭到尾**執行一遍。例子：跳舞機械人每跳一次舞要做 10 次仰臥起坐，整支舞重複 10 次，便共做了 100 次。（p.72–73 活動 3.1）',
          '類比：時鐘的分針是外循環，秒針是內循環——分針移一格，秒針便轉一圈（60 格）。（p.75）',
          '內循環體重複的總次數 = 外循環體重複的次數 **×** 內循環體重複的次數。（p.75 活動 3.2）',
          '如果內循環的範圍跟外循環變量有關（例如 `range(1, i + 1)`），每次次數不同，要**逐次加起來**。',
          '`print()` 預設列印後換行；寫 `print("*", end="")` 便不換行，下次列印的內容在同一行顯示。內循環完結後用 `print()` 換行。（p.78 備註）',
        ] },
        { sim: { code: C('for i in range(0, 2):', '    print(i)', '    for j in range(0, 3):', '        print(j)'), step: true, open: ['vars', 'trace'] },
          cap: 'p.74 的嵌套 for 循環。按「下一步」並對照教科書的追蹤表：i = 0 時 j 由 0 至 2，之後 i = 1 時 j 又由 0 開始。' },
        { code: C('L = int(input())', 'for i in range(0, L):', '    for j in range(0, L):', '        print("*", end="")', '    print()'), cap: '例題 3.1（p.77–78）：輸入 L，畫出 L × L 的「*」正方形。內循環畫一列，外循環重複 L 列。' },
      ],
      tries: [
        { id: 'c3a-s2-t1', pts: 4, src: '教科書 p.76 活動 3.2 第 3(b) 題（改為同一行輸出）', code: C('for i in range(1, 4):', '    for j in range(3, 0, -1):', '        print(i + j, end=" ")'),
          q: '先估：輸出是什麼？', options: ['4 3 2 5 4 3 6 5 4', '4 5 6 3 4 5 2 3 4', '2 3 4 3 4 5 4 5 6', '4 3 2'],
          why: '外循環 i = 1 時，內循環 j = 3、2、1，輸出 4 3 2；i = 2 時輸出 5 4 3；i = 3 時輸出 6 5 4。' },
      ],
      practice: [
        { id: 'c3a-s2-p1', type: 'trace', pts: 3, src: '教科書 p.74 追蹤表', label: '追蹤表填格',
          q: '逐句追蹤 p.74 的嵌套循環，填寫 i、j 和輸出。',
          code: C('for i in range(0, 2):', '    print(i)', '    for j in range(0, 3):', '        print(j)'),
          spec: { mode: 'stmt', cols: ['i', 'j'], out: true },
          hint: '外循環體每執行一次，內循環體執行三次。' },
        { id: 'c3a-s2-p2', type: 'fill', pts: 2, src: '教科書 p.75 活動 3.2 第 1(c)、(d) 題', q: '寫出第 3 行（`print(i, j)`）執行的總次數。',
          code: C('for i in range(0, 5):', '    for j in range(0, 10):', '        print(i, j)'),
          blanks: [{ label: '總次數', ask: { count: 3 } }, { label: '把外、內循環的範圍對調（range(0, 10) 在外）後的總次數', a: '50' }],
          hint: '外循環 5 次 × 內循環 10 次。對調後是 10 × 5。' },
        { id: 'c3a-s2-p3', type: 'complete', pts: 3, src: '教科書 p.81 測試站 3.2 第 3 題', label: '補完程式',
          q: '輸入 H，用「*」畫出高度為 H 的直角等腰三角形（第 1 列 1 個，第 2 列 2 個……）。會用多組數據測試。',
          template: C('H = int(input())', 'for i in range(1, ［1］):', '    for j in range(1, ［2］):', '        print("*", end="")', '    print()'),
          ref: ['H + 1', 'i + 1'], tests: [{ inputs: '3' }, { inputs: '6' }, { inputs: '1' }, { inputs: '0' }],
          hint: '偽代碼「設 i 由 1 至 H」→ `range(1, H + 1)`；第 i 列有 i 個「*」，內循環範圍跟 i 有關。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '嵌套循環與二維列表', pages: '教科書 p.78–83',
      learn: [
        { pts: [
          '常用嵌套 for 循環**逐一存取**二維陣列的項目：外循環走「列」i，內循環走「欄」j。偽代碼寫 `B[i,j]`，Python 寫 `B[i][j]`。（p.78）',
          '先 i 後 j：逐列由左至右讀；先 j 後 i：逐欄由上至下讀。求總和時兩種次序結果一樣。（p.79–80 例題 3.2）',
          '存取列表項目前，要先建立列表並賦予預設值，這叫**初始化**。可以用嵌套 for 循環：外循環 `list2d = list2d + [[]]` 加一列，內循環 `list2d[i] = list2d[i] + [0]` 加一欄。（p.78、p.98）',
          '檢查「整列都符合」：每列開始時設旗標 `row = True`，遇到不符合的項目便設為 `False`；整列查完才看旗標。（p.82 測試站 3.2 第 4 題）',
          '用 `while` 循環加上 `and win == False` 等條件，找到答案便可以**提早停止**，平均較快。（p.83 第 4(b) 題）',
        ] },
        { sim: { code: SHELF, step: true, open: ['vars'] }, cap: '例題 3.2（p.79）：博文的書櫃，計算全部書籍數量。' },
        { code: C('num = []', 'for i in range(0, 3):', '    num = num + [[]]', '    for j in range(0, 6):', '        num[i] = num[i] + [0]', '        num[i][j] = i * j', 'print(num)'), cap: 'p.78：初始化 3 × 6 的二維列表，並把每個項目設為 i * j。' },
      ],
      tries: [
        { id: 'c3a-s3-t1', pts: 4, src: '教科書 p.79 例題 3.2', tags: [HOT_2D], code: SHELF,
          q: '先估：輸出是什麼？', options: ['95', '32', '37', '18'],
          why: '三列的總和：32 + 26 + 37 = 95。' },
        { id: 'c3a-s3-t2', pts: 4, src: '教科書 p.78', code: C('num = []', 'for i in range(0, 3):', '    num = num + [[]]', '    for j in range(0, 4):', '        num[i] = num[i] + [0]', '        num[i][j] = i + j', 'print(num)'),
          q: '先估：輸出是什麼？（教科書例子改為 3 × 4、i + j）',
          options: ['[[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]]', '[[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]]', '[[0, 0, 0, 0], [0, 1, 2, 3], [0, 2, 4, 6]]', '[0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5]'],
          why: '外循環加 3 列，每列由內循環加 4 欄；num[i][j] = i + j。' },
      ],
      practice: [
        { id: 'c3a-s3-p1', type: 'complete', pts: 3, src: '教科書 p.82 測試站 3.2 第 4(a)(i) 題（參考 DSE 2016 2D Q4）', label: '補完程式',
          q: '賓果咭 5 × 5；首 7 行把 5 行 T／F 輸入讀進二維列表 `result`（抽中為 True）。補完程式：如果有任何一列完全連上，`win` 為 True。會用多組數據測試。',
          template: C(READ5, 'win = False', 'for i in range(［1］):', '    row = True', '    for j in range(0, 5):', '        if ［2］:', '            row = False', '    if row == True:', '        win = True', 'print(win)'),
          ref: ['0, 5', 'result[i][j] == False'],
          tests: [{ inputs: BINGO_IN }, { inputs: 'FFFFF\nFFFFF\nFFFFF\nFFFFF\nFFFFF' }, { inputs: 'TTTTF\nTTTFT\nTTFTT\nTFTTT\nFTTTT' }, { inputs: 'FFFFF\nFFFFF\nFFFFF\nFFFFF\nTTTTT' }],
          hint: '列索引由 0 至 4；只要該列有一格是 False，這列便未連上。' },
        { id: 'c3a-s3-p2', type: 'complete', pts: 3, src: '教科書 p.83 測試站 3.2 第 4(b)(i) 題', label: '補完程式',
          q: '俊賢用 while 循環檢查有沒有一**欄**完全連上，找到便提早停止。補完四個空格。會用多組數據測試。',
          template: C(READ5, 'win = False', 'j = 0', 'while j <= 4 and win == False:', '    win = ［1］', '    col = ［2］', '    i = 0', '    while i <= 4 and col == True:', '        if result[i][j] == False:', '            col = ［3］', '            win = ［4］', '        i = i + 1', '    j = j + 1', 'print(win)'),
          ref: ['True', 'True', 'False', 'False'],
          tests: [{ inputs: BINGO_IN }, { inputs: 'FFTFF\nFFTFF\nFFTFF\nFFTFF\nFFTFF' }, { inputs: 'TTTTT\nTTTTT\nTTTTT\nTTTTT\nTTTTF' }, { inputs: 'FFFFT\nFFFFT\nFFFFT\nFFFFT\nFFFFT' }],
          hint: '每欄開始時先假設「連上了」；遇到 False 便兩個旗標都改為 False。教科書答案：True、True、False、False。' },
        { id: 'c3a-s3-p3', type: 'mc', pts: 1, src: '教科書 p.83 測試站 3.2 第 4(b)(ii) 題', q: '允行（for 循環檢查列）和俊賢（while 循環檢查欄）的算法，哪個平均較快找出結果？',
          options: ['允行的，因為 for 循環一定比 while 循環快', '俊賢的，因為一旦遇到 False 或已找到完全連上的欄，循環便停止', '兩個一樣快，因為都用了嵌套循環', '無法比較，因為一個檢查列、一個檢查欄'], answer: 1,
          hint: '允行的算法無論如何都會檢查全部 25 格。' },
        { id: 'c3a-s3-p4', type: 'fill', pts: 2, src: '教科書 p.80 例題 3.2「想像」', q: '把例題 3.2 的循環次序對調（先 j 後 i，逐欄讀取）。輸出是什麼？第 7 行執行了多少次？',
          code: C('B = [[5, 9, 6, 5, 3, 4],', '     [2, 3, 8, 2, 6, 5],', '     [8, 3, 5, 3, 9, 9]]', 'total = 0', 'for j in range(0, 6):', '    for i in range(0, 3):', '        total = total + B[i][j]', 'print(total)'),
          blanks: [{ label: '輸出', ask: 'out' }, { label: '第 7 行次數', ask: { count: 7 } }],
          hint: '次序不同，但每個項目仍然只加一次。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.81–83、p.100',
      intro: '在編輯器寫 Python 程式，先按「▶ 執行」自己測試，再按「提交評核」。輸入數據每行一個，按次序交給每一個 `input()`。',
      tasks: [
        { id: 'c3a-w1', tier: '必做', pts: 12, title: '「*」長方形', src: '教科書 p.81 測試站 3.2 第 2 題',
          q: '輸入兩個整數 `W`（闊度）和 `L`（長度），用嵌套循環以「*」畫出 L 列、每列 W 個「*」的長方形（「*」之間不加空格）。\n例如輸入 `3` 和 `2`，輸出：\n```\n***\n***\n```',
          starter: C('W = int(input())', 'L = int(input())', ''),
          ref: C('W = int(input())', 'L = int(input())', 'for i in range(0, L):', '    for j in range(0, W):', '        print("*", end="")', '    print()'),
          tests: [{ inputs: '3\n5' }, { inputs: '8\n2' }, { inputs: '1\n1' }, { inputs: '4\n1' }, { inputs: '1\n3' }],
          rules: [{ must: 'for', msg: '要用 for 循環' }],
          hint: '外循環重複 L 列；內循環每列印 W 個「*」（`end=""`）；內循環完結後 `print()` 換行。教科書答案：「設 i 由 1 至 L、設 j 由 1 至 W」。' },
        { id: 'c3a-w2', tier: '進階', pts: 13, title: '中文科成績分析', src: '教科書 p.100 課題練習第 2 題',
          q: '黃老師以二維列表 `form5_chi` 儲存中五級 4 班、每班 10 個學生的中文科分數（已寫在程式內）。\n輸入及格分數 `p`，輸出兩行：\n• `不及格人數 = X`（分數 **低於** p）\n• `最高分 = Y`\n例如輸入 `50`，輸出 `不及格人數 = 5` 和 `最高分 = 97`。',
          starter: C(CHI, 'p = int(input())', ''),
          ref: C(CHI, 'p = int(input())', 'fail = 0', 'highest_mark = form5_chi[0][0]', 'for i in range(0, 4):', '    for j in range(0, 10):', '        if form5_chi[i][j] < p:', '            fail = fail + 1', '        if form5_chi[i][j] > highest_mark:', '            highest_mark = form5_chi[i][j]', 'print("不及格人數 =", fail)', 'print("最高分 =", highest_mark)'),
          tests: [{ inputs: '50' }, { inputs: '36' }, { inputs: '37' }, { inputs: '0' }, { inputs: '97' }, { inputs: '98' }],
          rules: [{ mustNot: 'max(', msg: '這題要用循環找最高分，不可用 max()' }],
          hint: '`fail` 由 0 開始；最高分先設為 `form5_chi[0][0]`，再逐格比較（教科書答案的寫法）。`print("不及格人數 =", fail)` 會在 = 後自動加空格。' },
        { id: 'c3a-w3', tier: '挑戰', pts: 10, title: '賓果：對角線', src: '教科書 p.83 測試站 3.2 第 4(c) 題',
          q: '首 7 行已把 5 行 T／F 輸入讀進 5 × 5 的二維列表 `result`（抽中為 True）。檢查兩條對角線（左上至右下、右上至左下）：任何一條完全連上，輸出 `True`，否則輸出 `False`。',
          starter: C(READ5, ''),
          ref: C(READ5, 'win = True', 'for i in range(0, 5):', '    if result[i][i] == False:', '        win = False', 'if win == False:', '    win = True', '    for i in range(0, 5):', '        if result[i][4 - i] == False:', '            win = False', 'print(win)'),
          tests: [{ inputs: BINGO_IN }, { inputs: 'TFFFF\nFTFFF\nFFTFF\nFFFTF\nFFFFT' }, { inputs: 'TTTTT\nTTTTT\nTTFTT\nTTTTT\nTTTTT' }, { inputs: 'TFFFT\nFTFTF\nFFTFF\nFTFTF\nTFFFF' }, { inputs: 'FFFFF\nFFFFF\nFFFFF\nFFFFF\nFFFFF' }],
          hint: '左上至右下的項目是 `result[i][i]`；右上至左下是 `result[i][4 - i]`。先查第一條；未連上才查第二條。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.70–83、p.99–103',
      items: [
        { id: 'c3a-q1', pts: 4, src: '自擬（DSE 卷二D 風格）', tags: [TRAP_NEST], verify: true, ask: { count: 4 },
          q: '以下程式中，第 4 行執行了多少次？', code: C('k = 0', 'for i in range(1, 6):', '    for j in range(i, 6):', '        k = k + 1', 'print(k)'),
          options: ['15', '25', '10', '20'], answer: 'A', why: 'i = 1 至 5 時，內循環分別執行 5、4、3、2、1 次，共 15 次，不是 5 × 5。' },
        { id: 'c3a-q2', pts: 4, src: '教科書 p.99 課題練習第 1 題', tags: [HOT_2D], verify: true,
          q: '列表 `map` 儲存了某地區每個單元格的人口（以千計）。以下程式的輸出是什麼？',
          code: C('map = [[0, 2, 3, 2, 0, 0, 0],', '       [1, 3, 5, 4, 4, 2, 0],', '       [1, 4, 6, 7, 6, 4, 3],', '       [0, 4, 4, 7, 5, 4, 0],', '       [0, 2, 3, 4, 0, 0, 0]]', 'population = 0', 'for i in range(0, 5):', '    for j in range(0, 7):', '        population = population + map[i][j]', 'print(population)'),
          options: ['90', '81', '35', '7'], answer: 'A', why: '各列總和：7 + 19 + 31 + 24 + 9 = 90。（教科書答案：90）' },
        { id: 'c3a-q3', pts: 4, src: '仿教科書 p.103 課題練習第 5 題（參考 DSE 2014 2D Q4a）', verify: true,
          q: '以下程式的輸出是什麼？', code: C('row = ["A", "B", "C", "D", "E", "F"]', 'for j in range(0, 6):', '    row[5 - j] = row[j]', 'print("".join(row))'),
          options: ['ABCCBA', 'FEDCBA', 'ABCDEF', 'FEDDEF'], answer: 'A',
          why: 'j = 0、1、2 時把左半複製到右半（F、E、D 被蓋過）；j = 3、4、5 時再把已改過的右半抄回左半，所以左半不變。結果左右對稱：ABCCBA。這就是課題練習第 5 題「沿中線反射」的效果；把範圍改為 range(0, 3) 便可減少一半步數。' },
        { id: 'c3a-q4', pts: 4, src: '仿教科書 p.101 課題練習第 4 題（參考 DSE 2021 2D Q3）', tags: [HOT_2D],
          q: '3 × 3 的二維列表 `ttt_2d` 要由上至下逐列複製到有 9 個項目的一維列表 `ttt_1d`。Python 列表索引由 0 開始，內循環體應該是：',
          code: C('for i in range(0, 3):', '    for j in range(0, 3):', '        ttt_1d[ ？ ] = ttt_2d[i][j]'),
          options: ['i * 3 + j', '(i - 1) * 3 + j', 'j * 3 + i', 'i + j'], answer: 'A',
          why: '第 i 列前面已有 i 列、每列 3 個項目，所以是 i * 3 + j。教科書由 1 開始，答案寫成 (i-1)*3 + j。j * 3 + i 是逐欄複製；i + j 會重複。' },
        { id: 'c3a-q5', pts: 4, src: '自擬', verify: true,
          q: '以下程式的輸出是什麼？', code: C('x = 7', 'y = 3', 'if x > 5:', '    if y > 5:', '        print("P")', '    elif x + y > 9:', '        print("Q")', '    else:', '        print("R")', 'else:', '    print("S")'),
          options: ['P', 'Q', 'R', 'S'], answer: 'B', why: 'x > 5 成立；y > 5 不成立；x + y = 10 > 9 成立，輸出 Q。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyIf', 'pyFor', 'pyListAlgo'], intro: '隨機生成選擇、循環及列表算法的估輸出題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
