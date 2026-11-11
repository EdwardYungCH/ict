/* 單元 c2：程式測試和除錯（二）
 * 教科書 選修C 第 2 章 書頁 p.52–66（課題練習 p.65–66）
 * 所有答案在 build 時由 CPython 計算／核對。
 * 注意：瀏覽器的 Skulpt 顯示某些浮點數時位數較少（例如 0.1 + 0.2 顯示 0.3，CPython 顯示 0.30000000000000004），
 *       所以本單元可執行的例子避開這類數字；round(2.675, 2) 之類的「.5」邊界亦只放在不能執行的小測。
 *
 * 教科書疑似錯誤：p.54 實驗站 2.1 說 sys.float_info.min 是浮點數能儲存的最小值；實為最小的正規化正數（記錄 選C-7）
 * 教科書疑似錯誤：p.55、p.58、p.66 超出陣列索引的例子，正文歸為溢出錯誤，p.58 表歸為運行時錯誤；課題練習 2(b) 答案兩者並存（記錄 選C-8）
 * 教科書疑似錯誤：p.56–57 說 round() 是四捨五入（Python 3 用銀行家捨入，round(2.5) 得 2）；說 Python 沒有上捨及下捨函數（有 math.ceil()／math.floor()）；「捨入誤差必然少於或等於截尾誤差」只適用於四捨五入（記錄 選C-9）
 * 教科書疑似錯誤（新）：p.66 課題練習 3(c)(d) 說 D = 20、25 是錯誤數據／溢出錯誤。偽代碼如此，但照寫成 Python 時 B[3-i] 的索引會變成 -1，Python 不會報錯，而是悄悄覆寫 B[3]（D = 20 得 [0, 1, 0, 1]）；要到 D ≥ 256 才出 IndexError（已用 Python 驗算；不是教科書錯，但學生用 Python 驗證時會困惑）
 */
const C = (...ls) => ls.join('\n');

const BREAK = C('marks = [98, 79, 56, 68, 77, 93]', 'avg_mark = sum(marks) / len(marks)', 'if avg_mark > 80:', '    grade = "Distinction"', 'elif avg_mark > 50:', '    grade = "Pass"', 'else:', '    grade = "Fail"', 'print(avg_mark, grade)');
const TOBIN = (d) => C(`D = ${d}`, 'B = [0, 0, 0, 0]', 'i = 0', 'while D > 0:', '    B[3-i] = D % 2', '    D = D // 2', '    i = i + 1', 'print(B)');

const ERR = ['語法錯誤', '邏輯錯誤', '運行時錯誤', '溢出錯誤', '截尾誤差', '捨入誤差'];

module.exports = {
  id: 'c2',
  title: '程式測試和除錯（二）',
  book: '教科書 選修C 第 2 章 p.52–66',
  key: 'C-c2-hmac-b5d20e8f37',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '溢出錯誤', pages: '教科書 p.54–55、p.65–66',
      learn: [
        { pts: [
          '**溢出錯誤／上溢錯誤**：要儲存的數字**超出**該數據類型可儲存的範圍。**下溢錯誤**：數字**低於**可儲存的範圍。（p.55）',
          'Python 的**整數**沒有大小限制：`2 ** 100` 也可以準確計算。（p.54 提示）',
          'Python 的**浮點數**最大約是 `1.7976931348623157e+308`（`sys.float_info.max`）。（p.54 實驗站 2.1）',
          '`pow(math.e, 1000)` 超出範圍，出 `OverflowError`，程式終止。（p.54）',
          '其他例子：二進制補碼計算結果超出範圍（例如 8 位元 `01111111 + 00000001` 得 `10000000`，即 −128）；存取超出陣列索引的項目。（p.55）',
          '課題練習 2（p.65）：每個浮點數佔 4 字節，400 字節的陣列只可存 100 項（索引 0–99），存取 `num[100]` 便會出錯。',
        ] },
        { note: '`sys.float_info.min`（約 2.2e-308）其實是**最小的正規化正數**，不是「最小值」：負數 `-1e308` 也可以儲存，而更接近 0 的 `1e-320` 也可以（精確度較低）。' },
        { warn: '不是每次溢出都會出錯！`1e308 * 10` 在 Python 會變成 `inf`（無限大）而**不會終止**，之後的計算全部錯誤——這是更難發現的錯誤。' },
        { sim: { code: C('import math', 'print(2 ** 100)', 'print(1e308 * 10)', 'print(pow(math.e, 1000))', 'print("這一行不會執行")'), open: [] },
          cap: '實驗站 2.1 第 3 步（p.54）：留意哪一行令程式終止。' },
      ],
      tries: [
        { id: 'c2-s1-t1', pts: 4, src: '教科書 p.54 實驗站 2.1', code: C('import math', 'e = math.e', 'print(pow(e, 1000))'), ask: { error: true },
          q: '先估：程式會出現哪種錯誤？', options: ['OverflowError', 'ZeroDivisionError', 'ValueError', '沒有錯誤'],
          why: 'e¹⁰⁰⁰ 約是 1.97 × 10⁴³⁴，超出浮點數能儲存的最大值（約 1.8 × 10³⁰⁸）。' },
        { id: 'c2-s1-t2', pts: 4, src: '教科書 p.66 課題練習 3(a)（參考 DSE 2018 2D Q1b）', code: TOBIN(6),
          q: '先估：輸出是什麼？', options: ['[0, 1, 1, 0]', '[0, 1, 1]', '[1, 1, 0, 0]', '[0, 0, 1, 1]'],
          why: '6 = 110₂。餘數由 B[3] 開始向左放：B[3] = 0、B[2] = 1、B[1] = 1，B[0] 保持 0。' },
      ],
      practice: [
        { id: 'c2-s1-p1', type: 'mc', pts: 1, src: '教科書 p.65 課題練習 2(a)', q: '每個浮點數以 4 字節儲存。陣列 num 獲分配 400 字節，它的大小（項目數目）是什麼？',
          options: ['100', '400', '99', '1600'], answer: 0, hint: '400 ÷ 4。' },
        { id: 'c2-s1-p2', type: 'mc', pts: 2, src: '教科書 p.65 課題練習 2(b)', q: '執行以下程式會出現哪種錯誤？', ask: { error: true }, verify: true,
          code: C('num = [0.0] * 100', 'num[100] = 3.5'),
          options: ['IndexError', 'OverflowError', 'SyntaxError', '沒有錯誤'], answer: 0,
          hint: '索引只有 0 至 99。教科書稱這情況為溢出錯誤／運行時錯誤；Python 報告的錯誤類型是 IndexError。' },
        { id: 'c2-s1-p3', type: 'mc', pts: 2, src: '仿教科書 p.54–55', q: '輸出是什麼？', code: 'print(1e308 * 10)', verify: true,
          options: ['inf', 'OverflowError', '1e+309', '0.0'], answer: 0,
          hint: '浮點數乘法溢出時，Python 得出 inf（無限大），不會出錯。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '數字誤差：截尾與捨入', pages: '教科書 p.55–58',
      learn: [
        { pts: [
          '**截尾**：直接截除多出的數位。**截尾誤差** = |真實數值 − 實際儲存數值|。π 截尾至 3 個小數位 = 3.141。（p.55）',
          'Python：`math.trunc(1234.56789)` 和 `int(1234.56789)` 都得 `1234`。（p.55）',
          '**四捨五入**：`round(PI, 2)` 得 3.14，`round(PI, 4)` 得 3.1416。（p.56）',
          '**上捨**：調升到最接近的數值（π → 3.15）；**下捨**：降低到最接近的數值（π → 3.14）。**捨入誤差** = |真實數值 − 捨入後的數值|。（p.57）',
          '常見錯誤：下捨 ≠ 截尾。負數時：−3.456 下捨至兩個小數位是 −3.46，截尾是 −3.45。（p.57）',
        ] },
        { table: { head: ['', 'Python', '2.7', '-2.7'], rows: [
          ['截尾', '`int(x)`／`math.trunc(x)`', '2', '-2'],
          ['下捨（至整數）', '`math.floor(x)`', '2', '-3'],
          ['上捨（至整數）', '`math.ceil(x)`', '3', '-2'],
          ['捨入（至整數）', '`round(x)`', '3', '-3'],
        ] }, cap: '教科書 p.57 說 Python 沒有上捨及下捨函數；其實 `math` 有 `ceil()` 和 `floor()`（只捨入至整數）。' },
        { warn: 'Python 3 的 `round()` **不完全是四捨五入**：剛好在中間（.5）時取**雙數**（銀行家捨入），所以 `round(2.5)` 得 `2`，`round(3.5)` 得 `4`。此外很多小數不能以二進制準確儲存，`round(2.675, 2)` 得 `2.67`。' },
        { sim: { code: C('import math', 'x = -3.456', 'print(math.trunc(x * 100) / 100)', 'print(math.floor(x * 100) / 100)', 'print(math.ceil(x * 100) / 100)', 'print(round(x, 2))'), step: true, open: ['vars'] },
          cap: '先乘 100、取整、再除 100，便可截尾／下捨／上捨至兩個小數位。' },
      ],
      tries: [
        { id: 'c2-s2-t1', pts: 4, src: '教科書 p.55–57', code: C('import math', 'print(math.trunc(-3.7), math.floor(-3.7), round(-3.7))'),
          q: '先估：輸出是什麼？', options: ['-3 -4 -4', '-4 -4 -4', '-3 -3 -4', '-3 -4 -3'],
          why: '截尾直接去掉小數得 -3；下捨向較小的方向得 -4；四捨五入 -3.7 最接近 -4。' },
      ],
      practice: [
        { id: 'c2-s2-p1', type: 'fill', pts: 3, src: '教科書 p.58 活動 2.1 第 1 題', q: '把 2.3 捨入至整數。寫出數值及上捨的誤差。',
          code: C('import math', 'x = 2.3'),
          blanks: [{ label: '上捨 math.ceil(x)', ask: { expr: 'math.ceil(x)' } }, { label: '上捨的誤差', a: '0.7', accept: ['.7'] }, { label: '下捨 math.floor(x)', ask: { expr: 'math.floor(x)' } }, { label: '四捨五入 round(x)', ask: { expr: 'round(x)' } }],
          hint: '誤差 = |真實數值 − 捨入後的數值| = |2.3 − 3|。' },
        { id: 'c2-s2-p2', type: 'mc', pts: 2, src: '教科書 p.58 活動 2.1 第 3 題', q: '把 −6.20638 **下捨**至三個小數位，數值和誤差是什麼？',
          options: ['−6.207，誤差 0.00062', '−6.206，誤差 0.00038', '−6.207，誤差 0.00038', '−6.206，誤差 0.00062'], answer: 0,
          hint: '下捨是向數線的左方（較小的數）：−6.207 < −6.20638。' },
        { id: 'c2-s2-p3', type: 'fill', pts: 2, src: '教科書 p.66 課題練習 2(c)', q: '程式把 c 四捨五入至兩個小數位後儲存。寫出儲存的數值及捨入誤差（取十位有效數字）。',
          code: C('import math', 'a = 2', 'b = 3', 'c = math.sqrt(a*a + b*b)', 'stored = round(c, 2)', 'print(stored)'),
          blanks: [{ label: 'stored', ask: { var: 'stored' } }, { label: '捨入誤差', ask: { expr: 'round(abs(c - stored), 12)' } }],
          hint: '√13 = 3.605551275463989…；誤差 = |3.605551275463989 − 3.61|。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '語法、邏輯及運行時錯誤', pages: '教科書 p.58',
      learn: [
        { table: { head: ['', '語法錯誤', '邏輯錯誤', '運行時錯誤'], rows: [
          ['定義', '違反編程語言的規則，無法被編譯及執行', '邏輯出錯，程式行為出錯或產生錯誤結果', '執行期間遇到問題，程式意外終止'],
          ['例子', '缺乏冒號、關鍵字拼錯、缺乏縮排或括號', '序列出錯、條件語句出錯、無限循環', '除以零、負數的平方根、存取超出陣列索引的項目'],
          ['如何偵測', 'IDE 能偵測', '用測試數據測試邏輯流程', 'IDE 在程式終止後顯示錯誤訊息'],
        ] }, cap: '程式錯誤類型（p.58）' },
        { table: { head: ['Python 錯誤訊息', '例子', '類型'], rows: [
          ['`SyntaxError`／`IndentationError`', '`if x > 3` 欠冒號；縮排不一致', '語法錯誤'],
          ['`ZeroDivisionError`', '`10 / 0`', '運行時錯誤'],
          ['`ValueError`', '`math.sqrt(-4)`、`int("abc")`', '運行時錯誤'],
          ['`IndexError`', '列表有 3 項卻存取 `a[3]`', '運行時錯誤'],
          ['`NameError`', '變量名稱打錯、未賦值便使用', '運行時錯誤'],
          ['`TypeError`', '`"Total: " + 5`', '運行時錯誤'],
        ] } },
        { warn: '邏輯錯誤**沒有**錯誤訊息——程式照樣完成，只是結果錯。只有用測試數據比較「預期結果」與「實際結果」才能發現。' },
        { sim: { code: C('import math', 'n = int(input("輸入一個數："))', 'print("平方根是", math.sqrt(n))', 'print("倒數是", 1 / n)'), inputs: '-4', open: [] },
          cap: '試輸入 -4、0、9，看看出現哪一種運行時錯誤。' },
      ],
      tries: [
        { id: 'c2-s3-t1', pts: 4, src: '仿教科書 p.58', code: C('marks = [80, 75, 90]', 'avg = sum(marks) / len(mark)', 'print(avg)'), ask: { error: true },
          q: '先估：程式會出現哪種錯誤？', options: ['NameError', 'SyntaxError', 'TypeError', '沒有錯誤'],
          why: '`mark` 少了 s，是未定義的變量名稱。語法本身沒有問題，所以要到執行第 2 行時才出錯（運行時錯誤）。' },
      ],
      practice: [
        { id: 'c2-s3-p1', type: 'mc', pts: 2, src: '教科書 p.58（計算負數的平方根）', q: '執行以下程式會出現哪種錯誤？', ask: { error: true }, verify: true,
          code: C('import math', 'x = -4', 'print(math.sqrt(x))'),
          options: ['ValueError', 'ZeroDivisionError', 'OverflowError', '沒有錯誤'], answer: 0, hint: '數值不合要求（math domain error）。' },
        { id: 'c2-s3-p2', type: 'mc', pts: 1, src: '教科書 p.58', q: '程式寫了 `while x > 0` （欠冒號）。這屬於哪一類錯誤？',
          options: ['語法錯誤', '邏輯錯誤', '運行時錯誤', '溢出錯誤'], answer: 0, hint: '違反 Python 的語法規則，程式完全不能開始執行。' },
        { id: 'c2-s3-p3', type: 'mc', pts: 2, src: '教科書 p.58', q: '程式本應計算 6 個分數的平均分，卻寫成 `avg = total / 5`。這屬於哪一類錯誤？',
          options: ['邏輯錯誤', '語法錯誤', '運行時錯誤', '截尾誤差'], answer: 0, hint: '程式可以完成，沒有錯誤訊息，但結果錯。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '除錯：測試數據、程式追蹤及斷點', pages: '教科書 p.59–62、p.65–66',
      learn: [
        { pts: [
          '**測試數據**：代入數據運行程式，把測試結果與**預期結果**比較；不相等即程式有錯誤。（p.59）',
          '**除錯**：找出錯誤的位置並除去錯誤。人手方式：測試數據、**標記**、**子程式存根**。（p.59）',
          '**程式追蹤**：在 IDE 的除錯模式逐步執行，監察變量的值（等於電腦幫你做追蹤表）。（p.59）',
          '**斷點**：程式暫停執行的位置。暫停時可檢視當刻變量的值，判斷錯誤在斷點之前還是之後；通常加在條件語句或想測試的部分**之前**。（p.59）',
          '斷點加在分支**內**：程式在那裏暫停，表示該條件成立。（p.61）',
          '**迴聲測試**：在關鍵位置（運算後、條件語句前、循環體內）用 `print()` 輸出變量值；除錯完畢後刪除。（p.62）',
          '測試數據分三類：**正常數據**、**邊界數據（邊際個案）**、**錯誤數據**。例如 D 的有效範圍是 0–15：3 是正常、15 是邊界、20 是錯誤。（p.66 課題練習 3(c)）',
        ] },
        { sim: { code: BREAK, step: true, open: ['vars'] },
          cap: '實驗站 2.2（p.60–61）：按「下一步」就像在 Thonny 逐步執行。看看執行到哪一個分支，avg_mark 的值是多少。' },
      ],
      tries: [
        { id: 'c2-s4-t1', pts: 4, src: '教科書 p.60 實驗站 2.2', code: BREAK,
          q: '先估：輸出是什麼？', options: ['78.5 Pass', '78.5 Distinction', '78 Pass', '78.5 Fail'],
          why: '總分 471 ÷ 6 = 78.5；不大於 80，但大於 50，所以是 Pass。' },
      ],
      practice: [
        { id: 'c2-s4-p1', type: 'trace', pts: 3, src: '教科書 p.65 課題練習 1', q: '以人手方式進行程式追蹤：完成每次循環完結時 i 和 total 的值。',
          code: C('step = 10', 'total = 0', 'for i in range(1, step + 1):', '    total = total + (i * i) + step', 'print(total)'),
          spec: { mode: 'iter', cols: ['i', 'total'], out: true }, hint: '每次加 i × i + 10：11、25、44……' },
        { id: 'c2-s4-p2', type: 'mc', pts: 2, src: '教科書 p.61 測試站 2.1 第 2 題', q: '在第 3 行加入斷點，以除錯模式運行。程式**首次暫停**時，Shell 顯示什麼？',
          code: C('print("This is the first line.")', 'print("A new line")', 'print("Another new line")', 'print("This is line 4")', 'print("The end")'),
          options: ['This is the first line.\nA new line', 'This is the first line.\nA new line\nAnother new line', 'This is the first line.', '（沒有輸出）'], answer: 0,
          hint: '程式在**執行**斷點那一行之前暫停。' },
        { id: 'c2-s4-p3', type: 'complete', pts: 3, src: '教科書 p.62 測試站 2.1 第 3 題', label: '補完程式（迴聲測試）',
          q: '在第 5 行及第 7 行輸出剛計算好的變量，以檢視變量的狀態。',
          template: C('marks = [98, 79, 56, 68, 77, 93]', 'total_mark = 0', 'for i in range(0, len(marks)):', '    total_mark = total_mark + marks[i]', 'print(［1］)', 'avg_mark = total_mark / len(marks)', 'print(［2］)', 'if avg_mark >= 50:', '    print("Pass")', 'else:', '    print("Fail")'),
          ref: ['total_mark', 'avg_mark'], tests: [{ inputs: '' }],
          hint: '輸出剛在上一行計算出來的變量。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式及除錯', pages: '教科書 p.55–62、p.66',
      intro: '第 1 題是分析題；第 2、3 題在編輯器寫或修改 Python 程式，先按 ▶ 執行自己測試，再按「提交評核」。',
      tasks: [
        { id: 'c2-w1', kind: 'table', tier: '必做', title: '找出錯誤類型', pts: 10, src: '教科書 p.54–58、p.66',
          q: '為以下每個情況選出最合適的錯誤類型。',
          head: ['情況', '錯誤類型'], opts: { E: ERR },
          rows: [
            ['`if mark >= 50` 後面欠了冒號', { sel: 'E', a: ERR[0] }],
            ['循環條件永遠成立，程式停不下來', { sel: 'E', a: ERR[1] }],
            ['`avg = total / n`，而用戶輸入 n 為 0', { sel: 'E', a: ERR[2] }],
            ['`pow(math.e, 1000)` 的結果超出浮點數能儲存的範圍', { sel: 'E', a: ERR[3] }],
            ['8 位元二進制補碼計算 127 + 1', { sel: 'E', a: ERR[3] }],
            ['把 π 儲存為 3.141（直接刪去後面的數位）', { sel: 'E', a: ERR[4] }],
            ['`int(19.99)` 得 19', { sel: 'E', a: ERR[4] }],
            ['`num[1] = round(c, 2)`，c 是 3.6055…，儲存了 3.61', { sel: 'E', a: ERR[5] }],
            ['計算平均分時把 `len(marks)` 誤寫成 `len(marks) - 1`', { sel: 'E', a: ERR[1] }],
            ['把 e 上捨至兩個小數位，儲存為 2.72', { sel: 'E', a: ERR[5] }],
          ],
          hint: '截尾是「直接刪去」；捨入包括四捨五入、上捨、下捨。程式能完成但結果錯是邏輯錯誤；程式中途終止是運行時錯誤。' },
        { id: 'c2-w2', tier: '進階', title: '四位元二進制：加入範圍檢查', pts: 12, src: '教科書 p.66 課題練習 3（參考 DSE 2018 2D Q1b）',
          q: '下面是課題練習 3 的算法：把非負整數 D 轉換為 4 位元二進制，存入陣列 B。但 D 太大時，結果會出錯（Python 甚至不會報錯！）。\n修改程式：先檢查 D 是否在 **0 至 15** 之內——不在範圍便只輸出 `超出範圍`；否則照樣輸出 B。',
          starter: C('D = int(input())', 'B = [0, 0, 0, 0]', 'i = 0', 'while D > 0:', '    B[3-i] = D % 2', '    D = D // 2', '    i = i + 1', 'print(B)'),
          ref: C('D = int(input())', 'B = [0, 0, 0, 0]', 'if D < 0 or D > 15:', '    print("超出範圍")', 'else:', '    i = 0', '    while D > 0:', '        B[3-i] = D % 2', '        D = D // 2', '        i = i + 1', '    print(B)'),
          tests: [{ inputs: '6' }, { inputs: '3' }, { inputs: '0' }, { inputs: '15' }, { inputs: '16' }, { inputs: '20' }, { inputs: '-1' }],
          hint: '四位元最大是 1111₂ = 15。測試要包括正常數據（6、3）、邊界數據（0、15、16）和錯誤數據（20、-1）。先用 ▶ 試 D = 20：原程式輸出 [0, 1, 0, 1]——因為 B[3-4] 即 B[-1]，在 Python 是最後一項！' },
        { id: 'c2-w3', tier: '挑戰', title: '除錯：平均及最高氣溫', pts: 13, src: '仿教科書 p.59–62（實驗站 2.2、測試站 2.1）',
          q: '程式要求：先輸入天數 n，再輸入 n 天的氣溫（整數，可以是負數）。輸出平均氣溫（**四捨五入至 1 個小數位**）及最高氣溫，例如：\n`Average: 22.3`\n`Highest: 25`\n下面的程式有 **3 個錯誤**。用逐步執行或迴聲測試找出並改正它們。',
          starter: C('n = int(input())', 'temps = []', 'for i in range(1, n):', '    temps.append(int(input()))', 'highest = 0', 'total = 0', 'for t in temps:', '    total = total + t', '    if t > highest:', '        highest = t', 'avg = total // n', 'print("Average:", avg)', 'print("Highest:", highest)'),
          ref: C('n = int(input())', 'temps = []', 'for i in range(n):', '    temps.append(int(input()))', 'highest = temps[0]', 'total = 0', 'for t in temps:', '    total = total + t', '    if t > highest:', '        highest = t', 'avg = round(total / n, 1)', 'print("Average:", avg)', 'print("Highest:", highest)'),
          tests: [{ inputs: C('3', '20', '25', '22') }, { inputs: C('1', '-3') }, { inputs: C('4', '-5', '-2', '-8', '-1') }, { inputs: C('2', '30', '33') }, { inputs: C('5', '10', '12', '11', '13', '9') }, { inputs: C('3', '1', '2', '2') }],
          hint: '(1) `range(1, n)` 只讀入 n − 1 個氣溫。(2) highest 由 0 開始，全部是負數時便錯（邊界／特殊數據！）；應由第一個氣溫開始。(3) `//` 截除了小數，要用 `/` 再 `round(..., 1)`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.56–61、p.66',
      items: [
        { id: 'c2-q1', pts: 4, src: '教科書 p.56（見本單元警告）', tags: [{ t: 'trap', why: '教科書說 round() 是四捨五入；Python 3 在 .5 時取雙數，而且 0.125 等數值有二進制表示問題。' }], verify: true,
          q: '以下程式的輸出是什麼？', code: 'print(round(2.5), round(3.5), round(0.125, 2))',
          options: ['3 4 0.13', '2 4 0.12', '2 4 0.13', '3 4 0.12'], answer: 'B',
          why: '剛好在中間時，Python 3 捨入至雙數：2.5 → 2，3.5 → 4，0.125 → 0.12。' },
        { id: 'c2-q2', pts: 4, src: '教科書 p.66 課題練習 3(c)(d)', tags: [{ t: 'trap', why: '負索引令 Python 不報錯，錯誤數據產生錯誤結果。' }], verify: true,
          q: '把課題練習 3 的算法照寫成 Python，D = 20。輸出是什麼？', code: TOBIN(20),
          options: ['[1, 0, 1, 0, 0]', '[0, 1, 0, 1]', 'IndexError', '[0, 1, 0, 0]'], answer: 'B',
          why: '20 = 10100₂ 要 5 位元。第 5 次循環 i = 4，B[3-4] 即 B[-1]（最後一項），把 B[3] 由 0 改為 1。程式沒有終止，結果卻錯了。' },
        { id: 'c2-q3', pts: 4, src: '教科書 p.57 常見錯誤', verify: true,
          q: '以下程式的輸出是什麼？', code: C('import math', 'x = -3.456', 'print(math.floor(x * 100) / 100, math.trunc(x * 100) / 100)'),
          options: ['-3.46 -3.45', '-3.45 -3.45', '-3.46 -3.46', '-3.45 -3.46'], answer: 'A',
          why: '負數時，下捨（floor）向較小的方向得 −3.46；截尾直接刪去數位得 −3.45。所以下捨和截尾並不相同。' },
        { id: 'c2-q4', pts: 4, src: '教科書 p.61 測試站 2.1 第 1 題（參考 DSE 2019 2D Q1e）',
          q: '以下哪一項最能描述斷點如何協助找出程式錯誤？',
          options: ['斷點會自動改正程式的語法錯誤。', '程式在斷點暫停，讓我們檢視當刻變量的值，判斷錯誤在斷點之前還是之後。', '斷點令程式跳過有錯誤的語句，繼續執行。', '斷點會把所有變量的值輸出到 Shell。'], answer: 'B',
          why: '斷點只是令程式在指定行數暫停；之後可檢視變量或逐步執行。' },
        { id: 'c2-q5', pts: 4, src: '教科書 p.66 課題練習 3(c)(i)',
          q: '算法只可處理 D = 0 至 15。以 D = 3、D = 15、D = 20 測試，三組數據分別屬於什麼？',
          options: ['正常、邊界、錯誤', '正常、正常、錯誤', '邊界、正常、錯誤', '正常、錯誤、錯誤'], answer: 'A',
          why: '15 是有效範圍的分界值（邊際個案）；20 超出範圍，是錯誤數據。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyErr', 'pyCast', 'pyArith'], intro: '隨機生成錯誤類型、數據類型轉換及運算題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
