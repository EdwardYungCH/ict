/* 單元 4：迭代——for 循環、range()、while 循環、前測與後測循環（以 while 模擬）
 * 教科書 D2 第 4 章 4.4 迭代 p.52–60；課題練習 p.67–68 選擇題 7、9、10、11、12
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.68 課題練習選擇題 10 答案 B `points = total // 10`：total 是浮點數，所以 points 會是 3.0 而不是原程式的 3，輸出格式不同（數值相同）；本單元照用答案 B，並在解說中指出。
 * 教科書疑似錯誤：p.68 課題練習選擇題 12 問「計算出首 x 個單數」，應為「首 x 個單數的總和」；程式用 `sum` 作變量名稱，會蓋過內置函數 sum()
 * 教科書疑似錯誤：p.59 「重覆…直至」應為「重複」、「第 2 課」應為「第 2 章」（已記錄 D2-15）；p.60 例題 4.5 偽代碼用 x、程式用 num（已記錄 D2-16）
 */
const C = (...ls) => ls.join('\n');
const HOT_LOOP = { t: 'hot', why: 'DSE 卷一每年都有空運行循環程式的題目（輸出／執行次數）' };

module.exports = {
  id: 'u4',
  title: '迭代：for、range 與 while',
  book: '教科書 D2 第 4 章 p.52–60（另有 p.67–68 課題練習）',
  key: 'D2-u4-hmac-7890d7a0ba',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: 'for 循環與 range()', pages: '教科書 p.52–54',
      learn: [
        { pts: [
          '**迭代**又稱**循環**：重複執行某段語句，直至不再符合循環條件。被重複的語句叫**循環體**。（p.52）',
          '`for` 循環用一個變量作**循環計數器**，指定循環體重複的次數。（p.52）',
          '偽代碼 `設 i 由 1 至 5` 在 Python 寫成 `for i in range(1, 5+1):`——**最終值要加 1**，因為循環條件是「i < 最終值 + 1」。（p.52–53 提示）',
          '`range()` 的參數只可以是整數。（p.53 提示）',
        ] },
        { table: { head: ['range()', '意思', '例子', '包含的數'], rows: [
          ['`range(end)`', '由 0 開始，每次加 1，到 end 為止（**不包括** end）', '`range(4)`', '0, 1, 2, 3'],
          ['`range(start, end)`', '由 start 開始，每次加 1（不包括 end）', '`range(2, 5)`', '2, 3, 4'],
          ['`range(start, end, step)`', '由 start 開始，每次加 step（不包括 end）', '`range(2, 10, 3)`', '2, 5, 8'],
          ['', 'step 是負數便遞減', '`range(8, 2, -3)`', '8, 5'],
        ] }, cap: 'range() 函數（p.53）' },
        { sim: { code: C('for i in range(1, 6):', '    print(3 * i)'), step: true, open: ['vars', 'trace'] }, cap: 'p.53：1 至 5 的值逐一代入 i，每次執行循環體 `print(3 * i)`。若寫成 `range(1, 5)`，i = 5 不符合條件，便少了 15。' },
        { note: '重複次數（step 是 1 時）= end − start。例如 `range(3, 6)` 執行 3 次。遞減時 `range(5, -1, -1)` 包括 0，共 6 次。' },
      ],
      tries: [
        { id: 'u4-s1-t1', pts: 4, src: '教科書 p.54 活動 4.7', code: C('for k in range(5, 0, -1):', '    print(k)'),
          q: '先估：輸出是什麼？', options: [C('5', '4', '3', '2', '1'), C('5', '4', '3', '2', '1', '0'), C('4', '3', '2', '1', '0'), '（沒有輸出）'],
          why: '由 5 開始每次減 1，到 0 為止但不包括 0。' },
        { id: 'u4-s1-t2', pts: 4, src: '教科書 p.54 活動 4.7', code: C('for i in range(5):', '    print(i * 2)'), ask: { count: 2 },
          q: '先估：`print(i * 2)` 執行了多少次？', options: ['4', '5', '6', '10'],
          why: '`range(5)` 是 0, 1, 2, 3, 4，共 5 個數，輸出 0 2 4 6 8。' },
      ],
      practice: [
        { id: 'u4-s1-p1', type: 'fill', pts: 2, src: '教科書 p.54 活動 4.7', q: '空運行，寫出輸出（每個數一行）及循環體重複的次數。',
          code: C('for i in range(5, -1, -1):', '    print(i)'),
          blanks: [{ label: '輸出', ask: 'out' }, { label: '重複次數', ask: { count: 2 } }],
          hint: 'end 是 -1，不包括 -1，所以會去到 0。' },
        { id: 'u4-s1-p2', type: 'fill', pts: 2, src: '教科書 p.53 range() 表', q: '寫出每個 `list(range(...))` 的結果（Python 寫法，例如 `[0, 1, 2]`）。',
          code: C('a = list(range(2, 10, 3))', 'b = list(range(8, 2, -3))', 'c = list(range(3))'),
          blanks: [{ label: 'a', ask: { var: 'a' } }, { label: 'b', ask: { var: 'b' } }, { label: 'c', ask: { var: 'c' } }],
          hint: '由 start 開始加 step，未到 end 便停（不包括 end）。' },
        { id: 'u4-s1-p3', type: 'trace', pts: 3, src: '教科書 p.54 活動 4.7 最後一題', q: '完成追蹤表（每次循環結束時的值）及寫出最後一行的輸出。',
          code: C('total = 0', 'for i in range(0, 6):', '    total = total + i * 5', '    print(total)', 'print(total / 5)'),
          spec: { mode: 'iter', cols: ['i', 'total'], out: true },
          hint: '每次加 i × 5：0、5、10、15、20、25。最後 `/` 除法得浮點數 15.0。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: 'for 循環的應用：星星、倍數、求和、階乘', pages: '教科書 p.55–56',
      learn: [
        { pts: [
          '**列印 n 次**：`for i in range(0, n):` 或 `range(n)`。`print("*", end = "")` 印完不換行，星星便排在同一行。（p.55 測試站 4.7 第 1 題）',
          '**首 X 個 Y 的倍數**：`for i in range(1, X+1):` 輸出 `Y * i`。（p.55 第 2 題）',
          '**求總和（Σ）**：總和變量先設為 **0**，每次加上 n。（p.56 第 3 題）',
          '**階乘 n!**：乘積變量先設為 **1**（設 0 的話乘甚麼都是 0）。0! = 1：n 是 0 時 `range(1, 1)` 一次也不執行，結果正好是 1。（p.56 第 4 題）',
        ] },
        { sim: { code: C('k = int(input())', 'summation = 0', 'for n in range(1, k+1):', '    summation = summation + n', 'print(summation)'), inputs: '5', step: true, open: ['vars', 'trace'] }, cap: '測試站 4.7 第 3 題（p.56）：1 + 2 + 3 + 4 + 5 = 15。' },
        { warn: '累加變量要在循環**之前**設定初始值。如果把 `summation = 0` 放進循環體，每次都會被重設，最後只得到 k。' },
      ],
      tries: [
        { id: 'u4-s2-t1', pts: 4, src: '教科書 p.55 測試站 4.7 第 1 題', code: C('amount = float(input("Please input an amount: "))', 'star = int(amount // 10)', 'for i in range(0, star):', '    print("*", end = "")'), inputs: '91.1',
          q: '先估：輸入 91.1，輸出是什麼？',
          options: [C('Please input an amount: 91.1', '*********'), C('Please input an amount: 91.1', '**********'), C('Please input an amount: 91.1', '********'), C('Please input an amount: 91.1', '*', '*', '*', '*', '*', '*', '*', '*', '*')],
          why: '91.1 // 10 = 9.0，int() 得 9，印 9 粒星；`end = ""` 令星星不換行。' },
      ],
      practice: [
        { id: 'u4-s2-p1', type: 'complete', pts: 2, src: '教科書 p.55 測試站 4.7 第 2 題', label: '補完程式',
          q: '輸入 X 和 Y，輸出首 X 個 Y 的倍數，例如 X = 4、Y = 3 → `The result is: 3 6 9 12`。',
          template: C('X = int(input("X: "))', 'Y = int(input("Y: "))', 'print("The result is: ", end = "")', 'for i in range(［1］):', '    print(［2］, "", end = "")'),
          ref: ['1, X+1', 'Y * i'],
          tests: [{ inputs: C('4', '3') }, { inputs: C('1', '7') }, { inputs: C('5', '10') }, { inputs: C('0', '5') }],
          hint: 'i 由 1 到 X（所以 end 是 X+1），每次輸出 Y × i。' },
        { id: 'u4-s2-p2', type: 'complete', pts: 2, src: '教科書 p.56 測試站 4.7 第 3 題', label: '補完程式',
          q: '輸入正整數 k，輸出 1 + 2 + … + k。',
          template: C('k = int(input())', 'summation = ［1］', 'for n in range(［2］):', '    ［3］', 'print(summation)'),
          ref: ['0', '1, k+1', 'summation = summation + n'],
          tests: [{ inputs: '5' }, { inputs: '1' }, { inputs: '10' }, { inputs: '100' }],
          hint: '總和由 0 開始；n 由 1 到 k。' },
        { id: 'u4-s2-p3', type: 'complete', pts: 3, src: '教科書 p.56 測試站 4.7 第 4 題', label: '補完程式',
          q: '輸入非負整數 n，輸出 n!（0! = 1）。',
          template: C('n = int(input())', 'factorial = ［1］', 'for i in range(［2］):', '    ［3］', 'print(factorial)'),
          ref: ['1', '1, n+1', 'factorial = factorial * i'],
          tests: [{ inputs: '5' }, { inputs: '0' }, { inputs: '1' }, { inputs: '10' }],
          hint: '乘積由 1 開始；n 是 0 時循環不執行，輸出 1。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: 'while 循環', pages: '教科書 p.57–58',
      learn: [
        { pts: [
          '**while 循環**：先判斷條件；成立便執行循環體，然後**再判斷**。只要條件一直成立，循環體便不斷執行。（p.57）',
          '寫法：`while 條件:`，循環體要縮排。',
          '循環體內一定要有語句**改變條件中的變量**，否則條件永遠成立，變成**無限循環**（邏輯錯誤）。',
          '**for**：已知重複次數；**while**：重複次數未知，視乎條件（例如直至餘數小於除數）。',
        ] },
        { sim: { code: C('num = 17', 'while num < 100:', '    print(num)', '    num = num + 17'), step: true, open: ['vars', 'trace'] }, cap: 'p.57 例句。num 變成 102 時，102 < 100 不成立，離開循環，所以 102 不會輸出。' },
        { code: C('t = int(input())', 'd = int(input())', 'r = t', 'while r >= d:', '    r = r - d', 'print(r)'), cap: '測試站 4.8 第 2 題（p.58）：不斷減去 d，直至不夠減。剩下的 r 就是 **t 除以 d 的餘數**；循環體執行的次數就是**商數**（被除數 = 商數 × 除數 + 餘數）。' },
        { warn: '如果漏寫 `num = num + 17`，num 永遠是 17，程式會一直輸出 17，停不下來。在 Thonny 按「停止」可中止程式。' },
      ],
      tries: [
        { id: 'u4-s3-t1', pts: 4, src: '教科書 p.58 測試站 4.8 第 2(a) 題', code: C('t = int(input())', 'd = int(input())', 'r = t', 'while r >= d:', '    r = r - d', 'print(r)'), inputs: C('13', '5'),
          q: '先估：輸入 13 和 5，最後輸出的 r 是多少？', options: [C('13', '5', '3'), C('13', '5', '2'), C('13', '5', '8'), C('13', '5', '-2')],
          why: '13 → 8 → 3；3 >= 5 不成立，離開循環。13 ÷ 5 = 2 餘 3。' },
      ],
      practice: [
        { id: 'u4-s3-p1', type: 'complete', pts: 2, src: '教科書 p.58 測試站 4.8 第 1 題', label: '補完程式',
          q: '輸入 X 和 Y，輸出 X 以內（包括 X）所有 Y 的倍數，每個一行。',
          template: C('X = int(input())', 'Y = int(input())', 'num = Y', 'while ［1］:', '    print(num)', '    ［2］'),
          ref: ['num <= X', 'num = num + Y'],
          tests: [{ inputs: C('20', '3') }, { inputs: C('12', '4') }, { inputs: C('5', '7') }, { inputs: C('10', '10') }],
          hint: '「以內」包括 X，用 `<=`；每次加 Y，否則會無限循環。' },
        { id: 'u4-s3-p2', type: 'trace', pts: 3, src: '教科書 p.58 測試站 4.8 第 2 題', q: '輸入 t = 20、d = 6。完成追蹤表。',
          code: C('t = int(input())', 'd = int(input())', 'r = t', 'while r >= d:', '    r = r - d', 'print(r)'), inputs: C('20', '6'),
          spec: { mode: 'stmt', cols: ['t', 'd', 'r'], out: true },
          hint: '20 → 14 → 8 → 2；2 >= 6 不成立。' },
        { id: 'u4-s3-p3', type: 'mc', pts: 2, src: '教科書 p.58 測試站 4.8 第 2(b) 題', q: '上面這個程式（t、d、r）的目的是什麼？',
          options: ['找出 t 除以 d 的餘數', '找出 t 除以 d 的商數', '找出 t 和 d 的差', '找出 t 和 d 中較小的數'], answer: 0,
          hint: '試想想 r 與 t 和 d 的關係：10 和 3 → 1；13 和 5 → 3。', why: '不斷減去 d，剩下不夠減的部分就是餘數，等於 `t % d`（t、d 是正整數時）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '前測與後測循環', pages: '教科書 p.59–60',
      learn: [
        { pts: [
          '**前測循環**：先檢查條件，成立才執行循環體——`for` 和 `while` 都是。循環體**可能一次也不執行**。（p.59）',
          '**後測循環**：先執行循環體，再檢查條件，循環體**最少執行一次**——偽代碼的「執行…當」和「重複…直至」。（p.59）',
          '**Python 沒有後測循環的語句**。做法：先在循環前執行一次循環體，再接一個 while 循環。（p.59 圖 4.3）',
          '「重複…直至 條件」= 條件**不成立**便繼續，所以轉成 while 時要寫**相反**的條件：`直至 X > 0` → `while X <= 0:`。',
        ] },
        { sim: { code: C('num = float(input())', 'while num <= 0:', '    num = float(input())', 'print("OK:", num)'), inputs: C('-3', '0', '5'), step: true, open: ['vars'] },
          cap: '例題 4.5（p.60）：輸入錯誤（不是正數）便要求重新輸入，直至輸入正數。最後一行是加上去的，方便看結果。' },
        { table: { head: ['', '前測循環', '後測循環'], rows: [['何時檢查條件', '執行循環體之前', '執行循環體之後'], ['循環體最少執行', '0 次', '1 次'], ['例子', 'for、while', '執行…當、重複…直至（Python 用 while 模擬）']] }, cap: '前測與後測循環（p.59）' },
      ],
      tries: [
        { id: 'u4-s4-t1', pts: 4, src: '教科書 p.60 例題 4.5', code: C('num = float(input())', 'while num <= 0:', '    num = float(input())', 'print("OK:", num)'), inputs: C('-3', '0', '5'), ask: { count: 3 },
          q: '先估：依次輸入 -3、0、5。第 3 行（循環體內的 input）執行了多少次？', options: ['1', '2', '3', '0'],
          why: '第 1 行讀 -3；-3 <= 0，第 3 行讀 0；0 <= 0 仍成立，再讀 5；5 <= 0 不成立。第 3 行共 2 次。注意 0 不是正數。' },
      ],
      practice: [
        { id: 'u4-s4-p1', type: 'complete', pts: 2, src: '教科書 p.69 長題目第 3 題（改編）', label: '補完程式',
          q: '用 Python 改寫這個「執行…當」後測循環：`sum ← 0`、`i ← 0`、`執行`（`sum ← sum + 5`、`i ← i + 1`）`當 (i < 5)`、`輸出 sum`。\n做法：先執行一次循環體，再用 while。',
          template: C('total = 0', 'i = 0', 'total = total + 5', 'i = i + 1', 'while ［1］:', '    total = total + 5', '    ［2］', 'print(total)'),
          ref: ['i < 5', 'i = i + 1'], tests: [{ inputs: '' }],
          hint: '「執行…當」的條件成立便繼續，所以 while 用同一個條件。循環體要更新 i。（變量用 total，避免蓋過內置函數 sum()。）' },
        { id: 'u4-s4-p2', type: 'mc', pts: 2, src: '自擬（前測循環）', q: '以下程式的輸出是什麼？',
          code: C('x = 10', 'while x < 5:', '    print(x)', '    x = x + 1', 'print("End")'), verify: true,
          options: ['End', C('10', 'End'), C('5', 'End'), '（無限循環）'], answer: 0,
          hint: 'while 是前測循環：先檢查條件。', why: '一開始 10 < 5 已不成立，循環體一次也不執行，只輸出 End。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.55–60',
      intro: '在編輯器寫 Python，先按 ▶ 執行自己測試，再按「提交評核」。輸入：每次 input() 讀一行。這部分的 input() 不用提示文字。',
      tasks: [
        { id: 'u4-w1', tier: '必做', title: '乘數表', pts: 10, src: '自擬（for 循環，參考 p.55 測試站 4.7 第 2 題）',
          q: '輸入整數 `n`，用 **for 循環**輸出 n 的乘數表（1 至 9），每行格式：`n x i = 答案`。\n例如輸入 3，輸出 `3 x 1 = 3`、`3 x 2 = 6`……直至 `3 x 9 = 27`，共 9 行。',
          starter: C('n = int(input())', ''),
          ref: C('n = int(input())', 'for i in range(1, 10):', '    print(n, "x", i, "=", n * i)'),
          tests: [{ inputs: '3' }, { inputs: '1' }, { inputs: '12' }, { inputs: '0' }, { inputs: '-2' }],
          rules: [{ must: 'for', msg: '要用 for 循環' }],
          hint: '`for i in range(1, 10):`（不包括 10），`print(n, "x", i, "=", n * i)`——逗號之間會自動加一個空格。' },
        { id: 'u4-w2', tier: '必做', title: '用減法求商數和餘數', pts: 12, src: '教科書 p.58 測試站 4.8 第 2 題（延伸）',
          q: '輸入正整數 `t`（被除數）和 `d`（除數）。**不可用 `//` 和 `%`**，用 while 循環不斷減去 d，計算商數 `q` 和餘數 `r`。\n輸出兩行：第一行商數，第二行餘數。\n例如輸入 13、5，輸出 `2` 和 `3`。',
          starter: C('t = int(input())', 'd = int(input())', 'r = t', 'q = 0', ''),
          ref: C('t = int(input())', 'd = int(input())', 'r = t', 'q = 0', 'while r >= d:', '    r = r - d', '    q = q + 1', 'print(q)', 'print(r)'),
          tests: [{ inputs: C('13', '5') }, { inputs: C('10', '3') }, { inputs: C('2', '2') }, { inputs: C('3', '7') }, { inputs: C('20', '10') }, { inputs: C('0', '4') }],
          rules: [{ must: 'while', msg: '要用 while 循環' }, { mustNot: '//', msg: '不可用 // 運算符' }, { mustNot: '%', msg: '不可用 % 運算符' }],
          hint: '測試站 4.8 的程式已求出餘數 r；商數就是循環體執行的次數，在循環體內加一句 `q = q + 1`。' },
        { id: 'u4-w3', tier: '進階', title: '有效輸入與數字和', pts: 13, src: '教科書 p.60 例題 4.5（延伸）',
          q: '輸入一個整數 `n`；如果不是正數（≤ 0），便要求重新輸入，直至輸入正數（例題 4.5 的做法）。\n然後用 while 循環計算 n 每個位的**數字和**並輸出。\n例如輸入 -5、0、1234，輸出 `10`（1 + 2 + 3 + 4）。\n提示：`n % 10` 是個位數字，`n // 10` 去掉個位。',
          starter: C('n = int(input())', ''),
          ref: C('n = int(input())', 'while n <= 0:', '    n = int(input())', 'total = 0', 'while n > 0:', '    total = total + n % 10', '    n = n // 10', 'print(total)'),
          tests: [{ inputs: '1234' }, { inputs: C('-5', '0', '1234') }, { inputs: '100' }, { inputs: C('-1', '99999') }, { inputs: '7' }],
          rules: [{ must: 'while', msg: '要用 while 循環' }],
          hint: '第一個 while：`while n <= 0:` 內再 `n = int(input())`。第二個 while：`while n > 0:` 內把 `n % 10` 加進 total，再 `n = n // 10`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.67–68',
      items: [
        { id: 'u4-q1', pts: 3, src: '教科書 p.67 課題練習 選擇題 7', tags: [HOT_LOOP], verify: true,
          q: '以下 Python 程式的輸出是什麼？', code: C('for i in range(1, 5, 2):', '    print("A")'),
          options: [C('A', 'A'), 'AA', 'AAAAA', C('A', 'A', 'A')], answer: 'A',
          why: '`range(1, 5, 2)` 是 1, 3，共 2 次；print 每次換行，所以 A 分兩行。' },
        { id: 'u4-q2', pts: 4, src: '教科書 p.67 課題練習 選擇題 9', tags: [HOT_LOOP, { t: 'trap', why: '> 與 >= 差一次；for 循環的 range 在開始時已決定，之後改 X 不影響次數' }],
          q: '輸出結果是「AAAAA」。以下哪項最適合填入空格？', code: C('X = 5', '______', '    print("A", end="")', '    X = X - 1'),
          options: ['for i in range(0, X, -1):', 'for i in range(1, X):', 'while (X > 0):', 'while (X >= 0):'], answer: 'C',
          why: 'X 由 5 減到 1 共 5 次。A：由 0 遞減到 5，一次也不執行；B：1 至 4 只得 4 次；D：連 X = 0 也執行，共 6 次。' },
        { id: 'u4-q3', pts: 3, src: '教科書 p.68 課題練習 選擇題 10', tags: [{ t: 'trap', why: 'total 是浮點數，// 的結果也是浮點數' }],
          q: 'VIP 客戶消費 50 元得 1 分，往後每消費 10 元多得 1 分。以下哪項可以取代第 5 至第 7 行，計算出相同的積分？',
          code: C('total = float(input())', 'points = 0', 'if (total >= 50):', '    total = total - 40', '    while (total >= 10):', '        total = total - 10', '        points += 1', 'print(points)'),
          options: ['points = total % 10', 'points = total // 10', 'points = total - 10', 'points = total / 10'], answer: 'B',
          why: '「不斷減 10 並計次數」就是整數除法 `//`。注意：total 是浮點數，所以 B 得出的是 3.0 而原程式輸出 3——數值相同，但輸出格式不同（教科書沒有說明）。要完全一樣可寫 `points = int(total // 10)`。D 會得出 3.5 之類的小數。' },
        { id: 'u4-q4', pts: 3, src: '教科書 p.68 課題練習 選擇題 11',
          q: '下列哪個偽代碼可以代替以下 Python 程式？', code: C('X = int(input("X: "))', 'while X <= 0:', '    X = int(input("X:"))'),
          options: ['執行 / 輸入 X / 當 X >= 0', '執行 / 輸入 X / 當 X < 0', '重複 / 輸入 X / 直至 X < 0', '重複 / 輸入 X / 直至 X > 0'], answer: 'D',
          why: '程式先輸入一次，X <= 0 便再輸入，即「直至 X > 0」。若用「執行…當」，條件應是 `當 X <= 0`，A、B 都不對（B 漏了 0）。' },
        { id: 'u4-q5', pts: 3, src: '教科書 p.68 課題練習 選擇題 12',
          q: '以下程式計算首 X 個雙數的總和（2 + 4 + … + 2X）。以下哪項修改可以使程式計算出首 X 個單數的總和？',
          code: C('X = int(input())', 'sum = 0', 'for i in range(1, X+1):', '    sum = sum + 2 * i'),
          options: ['第 2 行改為 sum = 1', '第 3 行改為 for i in range(1, X):', '第 4 行改為 sum = sum + 2 * i - 1', '第 4 行改為 sum = sum + i'], answer: 'C',
          why: '第 i 個單數是 2i − 1：1, 3, 5, …。A 只是多加 1；B 少了一個雙數；D 是 1 + 2 + … + X。' },
        { id: 'u4-q6', pts: 4, src: '自擬（DSE 式 range 遞減空運行）', tags: [HOT_LOOP], verify: true,
          q: '以下程式的輸出是什麼？', code: C('count = 0', 'for i in range(10, 0, -3):', '    count = count + i', 'print(count)'),
          options: ['22', '18', '12', '15'], answer: 'A',
          why: '`range(10, 0, -3)` 是 10, 7, 4, 1（不包括 0）；10 + 7 + 4 + 1 = 22。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyRange', 'pyFor', 'pyWhile'], intro: '隨機生成 range() 成員／個數、for 循環累加及 while 循環輸出題，答案由電腦計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
