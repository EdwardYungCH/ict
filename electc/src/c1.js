/* 單元 c1：算法設計及 Python 程式的基本知識
 * 教科書 選修C 第 1 章 書頁 p.2–51（課題練習 p.48–51）
 * 所有答案在 build 時由 CPython 計算／核對。教科書偽代碼的陣列索引多由 1 開始；本單元的 Python 版本一律由 0 開始，題目內已註明。
 *
 * 教科書疑似錯誤：p.11 把 print 列為不能用作變量名稱的關鍵字；Python 3 中 print 是內置函數（記錄 選C-1）
 * 教科書疑似錯誤：p.16 表 1.12 把 < <= > >= 排在 == != 之上；Python 所有比較運算符同級，並可連寫（記錄 選C-2）
 * 教科書疑似錯誤：p.34 活動 1.3 3A_mark 第 1 列索引 3 印「3」，應為 80（記錄 選C-4）
 * 教科書疑似錯誤：p.33 測試站 1.7、p.45 測試站 1.8 第 3 題沒有先設定 pw／message 的初始值（記錄 選C-5；記錄寫 p.32、p.44，按文字版書頁應為 p.33、p.45）
 * 教科書疑似錯誤：p.42 測試站 1.8 第 1 題答案 B[5,1] 印 1，按 M 計算應為 0（記錄 選C-6；已用 Python 驗算，見寫程式 c1-w3 測試）
 * 教科書疑似錯誤：p.49 課題練習 1(b) hcf = abs(num1 * num2) / lcm 用 /，12、18 得 6.0；應用 //（記錄 選C-35）
 * 注意（非錯誤）：p.28 測試站 1.5(d) 說 B 全是 1 時「存取超出陣列索引」；偽代碼如此，但 Python 的負索引不會出錯（見小測 c1-q4）。
 */
const C = (...ls) => ls.join('\n');

const HCF = C('num1 = int(input("Input the 1st number: "))', 'num2 = int(input("Input the 2nd number: "))', 'i = 1', 'hcf = i',
  'while i <= num1 and i <= num2:', '    if num1 % i == 0 and num2 % i == 0:', '        hcf = i', '    i = i + 1', 'print("The HCF is", hcf)');

const MINES = C(
  'M = [["F","F","T","F","T","F","F","F","F"],',
  '     ["F","F","T","F","F","T","F","F","F"],',
  '     ["F","T","F","F","F","F","F","F","F"],',
  '     ["F","F","F","F","F","F","F","F","F"],',
  '     ["F","F","T","F","F","F","F","F","F"],',
  '     ["F","F","F","F","F","T","F","F","F"],',
  '     ["F","F","F","F","T","F","F","F","F"],',
  '     ["F","T","F","F","F","F","F","T","F"],',
  '     ["F","F","F","F","F","F","F","F","F"]]');

const POP = C(
  'M = [[4, 2, 3, 3, 3, 2, 1, 1, 2],',
  '     [4, 3, 4, 2, 2, 3, 1, 1, 2],',
  '     [7, 6, 3, 3, 2, 2, 2, 2, 1],',
  '     [3, 4, 5, 6, 7, 3, 3, 2, 2],',
  '     [0, 3, 3, 3, 7, 5, 4, 5, 3],',
  '     [0, 0, 1, 3, 3, 4, 4, 3, 4],',
  '     [0, 0, 0, 1, 1, 2, 3, 4, 3],',
  '     [0, 0, 0, 0, 0, 0, 2, 2, 3],',
  '     [0, 0, 0, 0, 0, 0, 2, 3, 2],',
  '     [0, 0, 0, 0, 0, 0, 1, 2, 1]]');

const MSG = C('P = ["I go to school by bus", "Lift out of service", "over and over",', '     "very nice", "e for egg", "Intelligence", "Cat and dog",', '     "Tomorrow is another day"]');

module.exports = {
  id: 'c1',
  title: '算法設計及 Python 程式的基本知識',
  book: '教科書 選修C 第 1 章 p.2–51',
  key: 'C-c1-hmac-7e3a91c04b',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '算法、追蹤表與 Python 基本語句', pages: '教科書 p.4–13',
      learn: [
        { pts: [
          '**算法**：按照特定次序解決問題的步驟。**空運行**：逐步理解算法或程式，推斷它的目的和輸出。（p.4）',
          '**輸入—處理—輸出周期**：例如 BMI 程式——輸入體重和身高，處理 BMI = 體重 / 身高²，輸出 BMI。（p.5）',
          '算法可以用**偽代碼**或**流程圖**表達；**追蹤表**逐句記錄變量的值，幫助找出錯處。（p.6–7）',
          '偽代碼 `A ← 21` 在 Python 寫成 `A = 21`；`輸出` 是 `print()`，`輸入` 是 `input()`。（p.8、p.13）',
          '`print("Hi", name)` 用逗號分隔，列印時自動加空格；`end = ""` 令下一次列印不換行。（p.10）',
          '**變量名稱**：只可用英文字母、數字和底線，不可以數字開頭，不可有空格或 `! # $`，不可用關鍵字；大小寫有分別（`bmi` 與 `Bmi` 不同）。常數習慣用全大寫，如 `PI`。（p.11）',
          '四種簡單數據類型：`int`、`float`、`bool`、`str`。Python 在**賦值**時按數據自動標籤類型。（p.12）',
          '`input()` 取得的數據**一定是字串**；要計算便用 `int()` 或 `float()` 轉換。（p.13）',
        ] },
        { warn: '教科書 p.11 把 `print` 列作關鍵字。其實 Python 3 的 `print` 是**內置函數**：`print = 5` 不會出語法錯誤，但之後再用 `print(...)` 便會出 `TypeError`。所以仍然**不要**用 print 作變量名稱。' },
        { sim: { code: C('n = 10', 'while n > 5:', '    if n > 3:', '        n = n - 3', '    else:', '        n = n + 1', 'print(n)'), step: true, open: ['vars', 'trace'] },
          cap: '測試站 1.1（p.7，參考 DSE 2017 2D Q2a）的 Python 版本。按「下一步」，對照書中的追蹤表：n 是 10 → 7 → 4。' },
      ],
      tries: [
        { id: 'c1-s1-t1', pts: 4, src: '教科書 p.7 測試站 1.1(b)', code: C('n = 10', 'while n > 5:', '    if n > 3:', '        n = n - 3', '    else:', '        n = n + 1', 'print(n)'),
          q: '先估：輸出是什麼？', options: ['4', '7', '5', '1'],
          why: '10 > 5 → n = 7；7 > 5 → n = 4；4 > 5 不成立，離開循環，輸出 4。else 部分從來沒有執行。' },
      ],
      practice: [
        { id: 'c1-s1-p1', type: 'mc', pts: 1, src: '教科書 p.11', q: '以下哪一個是有效的 Python 變量名稱？',
          options: ['1number', 'new number', 'new_number', 'newnumber!'], answer: 2,
          hint: '不可以數字開頭，不可有空格或「!」。' },
        { id: 'c1-s1-p2', type: 'mc', pts: 2, src: '教科書 p.11（見警告）', q: '以下哪一個**不是** Python 3 的關鍵字？',
          options: ['while', 'and', 'print', 'if'], answer: 2,
          hint: 'Python 3 的 print 是內置函數。在模擬器執行 `import keyword` 和 `print(keyword.kwlist)` 可看到全部關鍵字。' },
        { id: 'c1-s1-p3', type: 'trace', pts: 2, src: '教科書 p.7 追蹤表例子', q: '完成追蹤表：每句完成後 A 和 B 的值。',
          code: C('A = 2', 'B = 5', 'A = B - A', 'A = A * B', 'B = A - B'),
          spec: { mode: 'stmt', cols: ['A', 'B'] }, hint: '每次只有等號左邊的變量改變。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '運算算式與布爾算式', pages: '教科書 p.13–17',
      learn: [
        { table: { head: ['運算符', '意思', '例子', '結果'], rows: [
          ['`/`', '除法（結果必定是 float）', '`9 / 3`', '`3.0`'],
          ['`//`', '整數除法（商數）', '`10 // 3`', '`3`'],
          ['`%`', '模數（餘數）', '`10 % 3`', '`1`'],
          ['`**`', '指數', '`2 ** 3`', '`8`'],
        ] }, cap: '表 1.7 Python 的算術運算符（p.13）' },
        { pts: [
          '關係運算符 `== < <= > >= !=` 得出 `True` 或 `False`；`==` 是比較，`=` 是賦值，不要混淆。（p.15）',
          '布爾運算符 `and`、`or`、`not`：`and` 兩邊都真才真；`or` 一邊真便真。（p.16 真值表）',
          '優次（高 → 低）：`()` → `**`（從右至左）→ 負值 `-` → `* / // %` → `+ -` → 比較 → `not` → `and` → `or` → `=`。（p.16 表 1.12）',
          '例子：`-1 + 2 * 2 + 2 ** 3 ** 2` 解讀成 `(-1) + (2 * 2) + (2 ** (3 ** 2))` = 515。（p.17）',
        ] },
        { warn: '教科書表 1.12 把 `<`、`>` 等排在 `==`、`!=` 之上。Python 中所有比較運算符**同級**，而且會**連寫**：`5 > 3 == True` 是 `(5 > 3) and (3 == True)`，結果是 `False`。' },
        { sim: { code: C('dividend = int(input("The decimal number to be converted: "))', 'binaryString = ""', 'while dividend > 0:', '    remainder = dividend % 2', '    binaryString = str(remainder) + binaryString', '    dividend = dividend // 2', 'print("The corresponding binary number is", binaryString)'), inputs: '100', step: true, open: ['vars', 'trace'] },
          cap: '測試站 1.2（p.14）：用 `%` 取餘數、`//` 取商數，把十進制轉為二進制。新的餘數加在字串**前面**。' },
      ],
      tries: [
        { id: 'c1-s2-t1', pts: 4, src: '教科書 p.17', code: 'print(-1 + 2 * 2 + 2 ** 3 ** 2)',
          q: '先估：輸出是什麼？', options: ['515', '67', '81', '-515'],
          why: '`**` 從右至左：3 ** 2 = 9，2 ** 9 = 512；-1 + 4 + 512 = 515。若錯誤地由左至右計 (2 ** 3) ** 2 = 64，便會得 67。' },
      ],
      practice: [
        { id: 'c1-s2-p1', type: 'fill', pts: 2, src: '教科書 p.17 活動 1.2 第 1–3 題', q: '空運行，寫出各項的值。',
          code: C('print(- 5 ** 2)', 'print(2 ** 3 ** 2)', 'a = 1', 'a += 5 - 3', 'print(a)'),
          blanks: [{ label: '- 5 ** 2', ask: { expr: '- 5 ** 2' } }, { label: '2 ** 3 ** 2', ask: { expr: '2 ** 3 ** 2' } }, { label: '最後 a 的值', ask: { var: 'a' } }],
          hint: '`**` 比負值優先；`+=` 優次最低，先計 5 − 3。' },
        { id: 'c1-s2-p2', type: 'complete', pts: 3, src: '教科書 p.14 測試站 1.2', label: '補完程式',
          q: '完成把十進制數字轉為二進制的程式。會用多組數據測試。',
          template: C('dividend = ［1］(［2］("The decimal number to be converted: "))', 'binaryString = ""', 'while dividend > 0:', '    remainder = ［3］', '    binaryString = str(remainder) + binaryString', '    dividend = ［4］', 'print("The corresponding binary number is", binaryString)'),
          ref: ['int', 'input', 'dividend % 2', 'dividend // 2'], tests: [{ inputs: '100' }, { inputs: '1' }, { inputs: '255' }, { inputs: '8' }],
          hint: '餘數用 `%`，商數用 `//`。若用 `/`，dividend 會變成小數（如 12.5），餘數和結果都會出錯。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '控制結構：選擇與迭代', pages: '教科書 p.18–25',
      learn: [
        { pts: [
          '三類基本控制結構：**序列**、**選擇**、**迭代**。（p.18）',
          '選擇：`if`、`if…else`、`if…elif…else`。Python 用**縮排**表示哪些語句屬於哪個分支；`else` 必須與相應的 `if` 對齊。（p.18–19）',
          '幾個分支執行相同語句時，可用 `or` 把條件合併，例如 `X > 10 or Y > 10`。（p.20 例題 1.1，參考 DSE 2013 2D Q1biii）',
          '多個 `elif` 按次序判斷：把**最常用**的選項放在最前，可減少平均判斷次數。（p.22–23 測試站 1.3，參考 DSE 2014 2D Q1b）',
          '迭代：`for i in range(起始值, 最終值):` 不包括最終值；`while 條件:` 條件成立便重複。（p.24）',
        ] },
        { sim: { code: HCF, inputs: C('12', '18'), step: true, open: ['vars'] },
          cap: '測試站 1.4 第 2 題（p.25）：i 由 1 開始逐個試，能同時整除兩數便記錄在 hcf。' },
      ],
      tries: [
        { id: 'c1-s3-t1', pts: 4, src: '教科書 p.25 測試站 1.4 第 2 題', code: HCF, inputs: C('24', '36'),
          ask: { var: 'hcf' }, q: '先估：輸入 24 和 36，程式完結時 hcf 的值是什麼？', options: ['12', '6', '4', '72'],
          why: 'i 由 1 試到 24；能同時整除 24 和 36 的最大的數是 12。' },
      ],
      practice: [
        { id: 'c1-s3-p1', type: 'complete', pts: 3, src: '教科書 p.20–21 例題 1.1 第 2 題（參考 DSE 2013 2D Q1biii）', label: '補完程式',
          q: '原算法：如果 A = 1 則 Z ← 10；否則如果 B = 2 則 Z ← 20；否則如果 A > B 則 Z ← 10；否則 Z ← 20。\n用**單一** if…else 改寫，結果要完全相同。會用多組 A、B 測試。',
          template: C('A = int(input())', 'B = int(input())', 'if ［1］:', '    Z = 10', 'else:', '    Z = 20', 'print(Z)'),
          ref: ['A == 1 or (B != 2 and A > B)'],
          tests: [{ inputs: C('1', '2') }, { inputs: C('3', '2') }, { inputs: C('3', '1') }, { inputs: C('0', '5') }, { inputs: C('5', '5') }, { inputs: C('1', '9') }],
          hint: '兩條路徑會得 Z = 10：A = 1；或 A 不是 1、B 不是 2、而 A > B。' },
        { id: 'c1-s3-p2', type: 'mc', pts: 2, src: '教科書 p.23 測試站 1.3(b)（參考 DSE 2014 2D Q1b）',
          q: '自動櫃員機：服務「1」「2」「3」「0」的使用百分率分別是 25%、20%、5%、50%。怎樣排列判斷次序，平均判斷次數最少？',
          options: ['數字 = 0 → 數字 = 1 → 數字 = 2，否則模組 3', '數字 = 1 → 數字 = 2 → 數字 = 3，否則登出', '數字 = 3 → 數字 = 2 → 數字 = 1，否則登出', '數字 = 0 → 數字 = 3 → 數字 = 2，否則模組 1'], answer: 0,
          hint: '使用率最高的放最前；最後一個選項不用判斷。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '列表（一維陣列）與字串', pages: '教科書 p.26–33',
      learn: [
        { pts: [
          'Python 用**列表**實踐一維陣列；用**索引**（由 0 開始）存取項目，`age[0]` 是第一項。（p.26）',
          '常用算法：求總和及平均值、搜尋、找最大／最小值、點算項目。（p.26–27）',
          '刪除索引 P 的項目：把後面的項目逐一**向左**移一格；加入項目：先在最後加一格，再由最右方逐一**向右**移。（p.29）',
          '**字串**由字符組成，可以像列表般用索引存取：`the_string[0]` 是 `"W"`。（p.30）',
          '用 `while` 找目標字符的索引：找到便設 `found = True`，令循環停止。（p.30）',
          '**子字串**：把開始索引至結束索引的字符逐一合併成新字串。（p.32）',
        ] },
        { warn: '合併字串或累加前，要先設定**初始值**（`pw = ""`、`total = 0`）。教科書 p.33 測試站 1.7 和 p.45 測試站 1.8 第 3 題的算法沒有這一步；照寫成 Python 會出 `NameError`。' },
        { sim: { code: C('num = [15, 10, 5, 25, 20, 30]', 'print(num)', 'P = 1', 'N = len(num)', 'for i in range(P, N-1):', '    num[i] = num[i+1]', 'num[N-1] = 0', 'print(num)'), step: true, open: ['vars'] },
          cap: '刪除列表中的項目（p.29）。試把 P 改成 3 再執行。' },
        { sim: { code: C('import random', 'c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"', 'i = len(c)', 'pw_length = int(input())', 'pw = ""', 'for k in range(pw_length):', '    r = random.randint(0, i - 1)', '    pw = pw + c[r]', 'print(pw)'), inputs: '8' },
          cap: '測試站 1.7（p.33）的 Python 版本：隨機密碼。每次執行結果都不同。留意 `pw = ""` 和 `randint(0, i - 1)`（包含首尾兩數）。' },
      ],
      tries: [
        { id: 'c1-s4-t1', pts: 4, src: '教科書 p.32 例題 1.2', code: C('h = "cs pain"', 'p = [5, 2, 0, 4, 6, 2, 3, 4, 1, 1]', 'result = ""', 'for i in range(0, 10):', '    result = result + h[p[i]]', 'print(result)'),
          q: '先估：輸出是什麼？', options: ['i can pass', 'ican pass', 'i can pas', 's pcain s'],
          why: 'p[i] 是 h 的索引：h[5] = "i"、h[2] = " "、h[0] = "c"……合起來是 "i can pass"。' },
      ],
      practice: [
        { id: 'c1-s4-p1', type: 'complete', pts: 3, src: '教科書 p.31 測試站 1.6(b)', label: '補完程式',
          q: '檢查一句程式碼的雙引號是否成對：成對輸出 `Valid`，否則輸出 `Missing quotation mark`。會用多組數據測試。',
          template: C('target = "\\""', 'statement = input()', 'pair = 0', 'for i in range(0, len(statement)):', '    if ［1］:', '        pair = pair + 1', 'if ［2］:', '    print("Valid")', 'else:', '    print("Missing quotation mark")'),
          ref: ['statement[i] == target', 'pair % 2 == 0'],
          tests: [{ inputs: 'print("Hello World")' }, { inputs: 'print("Hello", World")' }, { inputs: 'print("Hello, World")' }, { inputs: 'print("The sum of", n1, "and", n2, "is, sum, ".")' }, { inputs: 'x = 1' }],
          hint: '`"\\""` 是只有一個雙引號的字串。數完後，雙數個便成對。' },
        { id: 'c1-s4-p2', type: 'mc', pts: 2, src: '教科書 p.29 刪除列表中的項目', q: '把 P 改為 2。執行後 num 的內容是什麼？', ask: { var: 'num' }, verify: true,
          code: C('num = [15, 10, 5, 25, 20, 30]', 'P = 2', 'N = len(num)', 'for i in range(P, N-1):', '    num[i] = num[i+1]', 'num[N-1] = 0'),
          options: ['[15, 10, 25, 20, 30, 0]', '[15, 5, 25, 20, 30, 0]', '[15, 10, 5, 20, 30, 0]', '[15, 10, 25, 20, 30]'], answer: 0,
          hint: '索引 2 的項目是 5；它後面的項目向左移，最後一格補 0。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '二維陣列', pages: '教科書 p.34–45',
      learn: [
        { pts: [
          '多個單陣列（chi_mark、eng_mark……）改用**二維陣列**儲存，便可用循環／嵌套循環存取所有項目。（p.34 活動 1.3）',
          '二維陣列以表格（列 × 欄）呈現，例如井字過三關、踩地雷。Python 把它看成**列表的列表**。（p.35、p.38）',
          '`list2d1[3][1]`：第一個索引是**列**，第二個是**欄**。`list2d1[0] = [3,4,5]` 會換掉整列。（p.37）',
          '增加一欄：`list2d1[3] = list2d1[3] + [30]`；增加一列：`list2d1 = list2d1 + [[]]`。（p.38、p.47）',
          '例題 1.3（p.40–41，參考 DSE 2017 2D Q4）：P[i][j] = M[i][j] + M[i][j+1] + M[i+1][j] + M[i+1][j+1]。2 × 2 網格不可超出 10 × 9 的地圖，所以 P 的大小是 **9 × 8**。',
          '字串列表也可當作二維字符陣列：`P[k][0]` 是第 k 個字串的第一個字符。（p.45）',
        ] },
        { sim: { code: C(POP, 'K = M[3][4] + M[3][5] + M[4][4] + M[4][5]', 'print("K =", K)', 'print(len(M), "列", len(M[0]), "欄")'), step: true, open: ['vars'] },
          cap: '例題 1.3（p.40）。書中 M[4,5] 的索引由 1 開始；Python 由 0 開始，所以寫成 `M[3][4]`。' },
      ],
      tries: [
        { id: 'c1-s5-t1', pts: 4, src: '教科書 p.39 活動 1.4 第 4 題', code: C('list2d4 = [[9,8,7,6],[6,7,8,9],[1,2,3,4]]', 'list2d4[1][2] = list2d4[1][1] + list2d4[2][2]', 'print(list2d4[1])'),
          q: '先估：輸出是什麼？', options: ['[6, 7, 10, 9]', '[6, 7, 8, 9]', '[6, 10, 8, 9]', '[6, 7, 11, 9]'],
          why: 'list2d4[1][1] 是 7，list2d4[2][2] 是 3，所以 list2d4[1][2] 變成 10。' },
      ],
      practice: [
        { id: 'c1-s5-p1', type: 'fill', pts: 2, src: '教科書 p.40–41 例題 1.3（參考 DSE 2017 2D Q4）', q: '寫出各項的值（Python 索引由 0 開始；書中的 P[4,2] 即 Python 的 P[3][1]）。',
          code: POP,
          blanks: [{ label: '(a) K（左上角 M[3][4] 的 2 × 2 網格）', ask: { expr: 'M[3][4] + M[3][5] + M[4][4] + M[4][5]' } }, { label: '(b)(i) P[3][1]', ask: { expr: 'M[3][1] + M[3][2] + M[4][1] + M[4][2]' } }],
          hint: 'P[3][1] = M[3][1] + M[3][2] + M[4][1] + M[4][2]。' },
        { id: 'c1-s5-p2', type: 'complete', pts: 3, src: '教科書 p.45 測試站 1.8 第 3 題', label: '補完程式',
          q: '解讀訊息：取出 P 中每個字串的第一個字符，合併成 message。',
          template: C(MSG, 'message = ""', 'for k in range(［1］):', '    message = ［2］', 'print(message)'),
          ref: ['len(P)', 'message + P[k][0]'], tests: [{ inputs: '' }],
          hint: 'P 有 8 個字串（索引 0 至 7）；P[k][0] 是第 k 個字串的第一個字符。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.42、p.48–49',
      intro: '在編輯器寫 Python 程式，先按 ▶ 執行自己測試，再按「提交評核」。每行輸入對應一個 input()。',
      tasks: [
        { id: 'c1-w1', tier: '必做', title: '最小公倍數及最大公因數', pts: 10, src: '教科書 p.48–49 課題練習 1',
          q: '輸入兩個正整數，輸出它們的最小公倍數（LCM）及最大公因數（HCF）。輸出格式（輸入 12 和 18）：\n`The LCM of 12 and 18 is 36`\n`The HCF of 12 and 18 is 6`\n方法：lcm 由較大的數開始，未能同時被兩數整除便加 1；HCF = | num1 × num2 | ÷ LCM。',
          starter: C('num1 = int(input("Input the first number: "))', 'num2 = int(input("Input the second number: "))', ''),
          ref: C('num1 = int(input("Input the first number: "))', 'num2 = int(input("Input the second number: "))', 'if num1 > num2:', '    lcm = num1', 'else:', '    lcm = num2', 'found = False', 'while found == False:', '    if lcm % num1 == 0 and lcm % num2 == 0:', '        found = True', '    else:', '        lcm = lcm + 1', 'print("The LCM of", num1, "and", num2, "is", lcm)', 'hcf = abs(num1 * num2) // lcm', 'print("The HCF of", num1, "and", num2, "is", hcf)'),
          tests: [{ inputs: C('12', '18') }, { inputs: C('7', '5') }, { inputs: C('8', '8') }, { inputs: C('1', '9') }, { inputs: C('21', '6') }],
          rules: [{ mustNot: 'gcd', msg: '請自己用循環計算，不可用 math.gcd。' }],
          hint: '用 `//` 而不是 `/`：教科書 p.49 的答案用 `/`，會輸出 `6.0`，與要求不符。' },
        { id: 'c1-w2', tier: '進階', title: '第一個單詞及單詞數目', pts: 12, src: '仿教科書 p.49 課題練習 2(b)(c)',
          q: '輸入一句英文（單詞之間只有一個空格，前後沒有空格）。\n輸出兩行：第一個單詞，以及單詞數目。例如輸入 `THIS IS SAM`：\n`First word: THIS`\n`Words: 3`\n不可用 `split()`；用 while 循環逐個字符檢查，遇到空格（`" "`）便表示第一個單詞完結。',
          starter: C('s = input()', 'word = ""', 'print("First word:", word)'),
          ref: C('s = input()', 'word = ""', 'i = 0', 'found = False', 'while i < len(s) and found == False:', '    if s[i] == " ":', '        found = True', '    else:', '        word = word + s[i]', '    i = i + 1', 'count = 1', 'for ch in s:', '    if ch == " ":', '        count = count + 1', 'print("First word:", word)', 'print("Words:", count)'),
          tests: [{ inputs: 'THIS IS SAM' }, { inputs: 'HELLO' }, { inputs: 'I LOVE ICT' }, { inputs: 'A B C D E' }, { inputs: 'Python is fun' }],
          rules: [{ mustNot: 'split', msg: '這題不可用 split()。' }, { must: 'while', msg: '要用 while 循環找第一個單詞。' }],
          hint: '單詞數目 = 空格數目 + 1。只有一個單詞（沒有空格）時，while 循環要在字串完結時停止：條件 `i < len(s) and found == False`。' },
        { id: 'c1-w3', tier: '挑戰', title: '踩地雷：數周圍的炸彈', pts: 13, src: '教科書 p.42 測試站 1.8 第 1 題（參考 DSE 2019 2D Q2）',
          q: '二維陣列 M 已寫好（"T" 是炸彈，"F" 不是）。按教科書的編號輸入列 i 和欄 j（**都由 1 至 9**）：\n• 如果該格是炸彈，輸出 `T`；\n• 否則輸出由 M[i-1,j-1] 至 M[i+1,j+1] 的炸彈總數（不可超出地圖）。\n例如 i = 1、j = 2 輸出 `2`。',
          starter: C(MINES, 'i = int(input())', 'j = int(input())', ''),
          ref: C(MINES, 'i = int(input())', 'j = int(input())', 'r = i - 1', 'c = j - 1', 'if M[r][c] == "T":', '    print("T")', 'else:', '    count = 0', '    for x in range(r - 1, r + 2):', '        for y in range(c - 1, c + 2):', '            if 0 <= x < 9 and 0 <= y < 9:', '                if M[x][y] == "T":', '                    count = count + 1', '    print(count)'),
          tests: [{ inputs: C('1', '2') }, { inputs: C('1', '1') }, { inputs: C('1', '3') }, { inputs: C('5', '1') }, { inputs: C('9', '9') }, { inputs: C('7', '6') }],
          hint: 'Python 索引由 0 開始，先把 i、j 各減 1。用兩層 for 循環檢查周圍 3 × 3 的格子，先確定 `0 <= x < 9` 和 `0 <= y < 9` 才讀取 `M[x][y]`（Python 的負索引不會出錯，會讀到地圖另一邊！）。留意：教科書答案 B[5,1] 印 1，其實應是 0。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.11、p.16–17、p.28',
      items: [
        { id: 'c1-q1', pts: 4, src: '教科書 p.17 活動 1.2 第 4 題', verify: true,
          q: '以下程式的輸出是什麼？', code: 'print(5 >= 3 and 10 < 15 - 5 * 2)',
          options: ['True', 'False', '5', 'SyntaxError'], answer: 'B',
          why: '(5 >= 3) and (10 < (15 − 10))：10 < 5 是 False，所以整句是 False。' },
        { id: 'c1-q2', pts: 4, src: '仿教科書 p.16 表 1.12', tags: [{ t: 'trap', why: '`/` 的結果必定是浮點數，之後的運算也是浮點數。' }], verify: true,
          q: '以下程式的輸出是什麼？', code: 'print(10 - 4 / 2 ** 2 * 3)',
          options: ['7.0', '7', '4.5', '16.5'], answer: 'A', why: '2 ** 2 = 4 → 4 / 4 = 1.0 → 1.0 * 3 = 3.0 → 10 − 3.0 = 7.0。' },
        { id: 'c1-q3', pts: 4, src: '教科書 p.28 測試站 1.5(b)（參考 DSE 2018 2D Q1）', verify: true,
          q: '以下程式（索引改為由 0 開始）的輸出是什麼？',
          code: C('B = [0, 0, 0, 0, 1, 0, 1, 1]', 'finished = False', 'pos = len(B) - 1', 'while finished == False:', '    if B[pos] == 0:', '        B[pos] = 1', '        finished = True', '    else:', '        B[pos] = 0', '        pos = pos - 1', 'print(B)'),
          options: ['[0, 0, 0, 0, 1, 1, 0, 0]', '[0, 0, 0, 0, 1, 0, 1, 0]', '[0, 0, 0, 0, 1, 1, 1, 1]', '[0, 0, 0, 0, 0, 1, 0, 0]'], answer: 'A',
          why: '算法把二進制數加一：00001011（11）+ 1 = 00001100（12）。由最右方開始，1 變 0 並向左進位，遇到 0 便變 1 停止。' },
        { id: 'c1-q4', pts: 4, src: '教科書 p.28 測試站 1.5(d)', tags: [{ t: 'trap', why: '偽代碼索引由 1 開始時會「超出陣列索引」；Python 的負索引卻不會出錯。' }], verify: true,
          q: '把上題的 B 改為 `[1, 1, 1, 1]`。Python 程式的輸出是什麼？',
          code: C('B = [1, 1, 1, 1]', 'finished = False', 'pos = len(B) - 1', 'while finished == False:', '    if B[pos] == 0:', '        B[pos] = 1', '        finished = True', '    else:', '        B[pos] = 0', '        pos = pos - 1', 'print(B)'),
          options: ['[0, 0, 0, 0]', '[0, 0, 0, 1]', '[1, 0, 0, 0]', '[1, 1, 1, 1]'], answer: 'B',
          why: 'pos 減到 -1 時，B[-1] 是最後一項（剛被設為 0），於是把它設為 1 並停止。教科書說會「存取超出陣列索引的項目」——在偽代碼是對的，但 Python 的負索引令錯誤**沒有被發現**，得出錯誤結果，更難除錯。' },
        { id: 'c1-q5', pts: 4, src: '教科書 p.11、p.13、p.16（見本單元警告）', tags: [{ t: 'trap', why: '教科書的說法與 Python 3 不同。' }],
          q: '以下哪一項關於 Python 3 的描述是正確的？',
          options: ['input() 傳回值的數據類型由用戶輸入的內容決定。', 'print 是關鍵字，用作變量名稱會出語法錯誤。', '比較運算符 == 與 < 的優次相同。', '兩個整數用 / 相除，結果必定是整數。'], answer: 'C',
          why: 'input() 必定傳回字串；print 是內置函數；/ 必定得浮點數。Python 所有比較運算符同級。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyArith', 'pyBool', 'pyStr', 'pyList'], intro: '隨機生成運算、布爾、字串及列表題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
