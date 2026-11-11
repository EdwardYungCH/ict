/* 單元 8：程式測試和除錯
 * 教科書 D2 第 6 章（書頁 p.160–202）；課題練習 p.196–198 選擇題 1、2、4、5、7、10、11
 * 理論單元（theory: true）：練 40 · 分析題 35 · 小測 25。
 * 書中偽代碼例子如需運行，已忠實地改寫成 Python；純偽代碼只放在說明文字。
 * 所有可運行的答案在 build 時由 CPython 計算／核對。
 *
 * // 教科書疑似錯誤：p.173–174 「語法錯誤」表中第 4、6、7、12、13 題在 Python 實際是 NameError，第 10、11 題是 TypeError，都是運行到該行才出錯（屬運行時錯誤），與 6.2A 的定義不一致（D2-50）。
 * // 教科書疑似錯誤：p.178 運行時錯誤題目 3 的 Shell 截圖缺了最後一行「IndexError: list index out of range」（D2-49）。
 * // 教科書疑似錯誤：p.183 說 C++ 布爾變量只佔 1 bit；C++ bool 一般佔 1 byte（D2-53）。
 * // 教科書疑似錯誤：p.185 例題 6.2 測試數據 2400 不是有效的 24 小時制時間（D2-54）。
 * // 教科書疑似錯誤：p.191 比較表說算法 2 用 2 個變量，實際用了 total、num、i 三個（D2-57）。
 * // 教科書疑似錯誤：p.196 選擇題 3 的偽代碼在 x = 6 時同時輸出 A 及 C（第二個「如果」不是「否則如果」）（D2-58）。
 * // 教科書疑似錯誤：p.163 邊界數據值的分類前後不一（例如 1 只標「邊界」，2 標「正常、邊界」，24 只標「邊界」）（D2-65）；本單元分析題把「是否邊界」與「正常／錯誤」分開兩欄作答。
 */
const C = (...ls) => ls.join('\n');
const HOT_TEST = { t: 'hot', why: '選擇合適的測試數據／邊際個案：DSE 2015 1A Q29、2018 1A Q31、2019 1A Q28、2020 1A Q34（教科書 p.167–168 測試站 6.1 旁註）。' };
const HOT_ERR = { t: 'hot', why: '辨別語法、邏輯、運行時錯誤：DSE 2013 1A Q31 等（教科書 p.179–180 測試站 6.2 旁註）。' };
const HOT_EFF = { t: 'hot', why: '比較兩個算法的效率：DSE 2013 1A Q32、2012PP 1B Q3c（教科書 p.184–189 旁註）。' };

const TYPES = ['語法錯誤', '邏輯錯誤', '運行時錯誤'];
const REASONS = ['缺少括號', '條件後缺少冒號', '將數字除以零', '計算負數的平方根', '字串不能轉換成整數', '條件永遠成立', '循環變量沒有更新，導致無限循環', '存取超出列表索引的項目'];
const BOUND = ['是', '否'];
const NE = ['正常數據值', '錯誤數據值'];
const OPOUT = ['Should be smaller', 'Should be larger', 'OK'];

module.exports = {
  id: 'u8',
  title: '程式測試和除錯',
  book: '教科書 D2 第 6 章 p.160–202（另有 p.196–198 課題練習）',
  key: 'D2-u8-hmac-e0ca0aeb1f',
  theory: true,
  writeLabel: '分析題',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '測試數據：正常、錯誤、邊界', pages: '教科書 p.162–168',
      learn: [
        { pts: [
          '**測試數據（test data）**：用來驗證程式準確性的一系列數據。代入數據運行程式，把**測試結果**與**預期結果**比較；不相等便表示程式有錯誤。（p.162）',
          '**正常數據值**：程式預期處理、在有效範圍內的數據；數量要足夠測試**所有選擇結構的分支**。（p.162）',
          '**錯誤數據值**：無效的輸入，用來測試程式能否處理（例如拒絕或提示）。（p.162）',
          '**邊界數據值／邊際個案（boundary case）**：(1) 正常範圍與錯誤範圍的**分界值及其兩旁的數據**；(2) 影響條件判斷結果的**分界值及其兩旁的數據**。（p.162）',
          '例：檢查是否非負數，分界在 0 → 邊界數據值是 -1、0、1；-1 同時是錯誤數據值，1 同時是正常數據值。（p.162）',
          '有兩個輸入時要測試所有組合：例題 6.1 第 3 題 coupon（0、1、2、3）× isStudent（True、False）= 8 組。（p.166）',
          '完成算法設計並用正確數據測試後，**下一步是用錯誤數據再測試**。（p.167 測試站 6.1 第 1 題）',
        ] },
        { table: { head: ['測試數據', '類別', '預期結果'], rows: [['-5', '錯誤數據值', '負數'], ['-1', '錯誤數據值、邊界數據值', '負數'], ['0', '邊界數據值', '非負數'], ['1', '正常數據值、邊界數據值', '非負數'], ['20', '正常數據值', '非負數']] }, cap: 'p.162：檢查非負數的測試數據' },
        { sim: { code: C('bmi = float(input("BMI: "))', 'if bmi <= 0:', '    print("輸入錯誤")', 'elif bmi < 18.5:', '    print("過輕")', 'elif bmi < 23:', '    print("正常")', 'elif bmi < 25:', '    print("超重")', 'else:', '    print("肥胖")'), inputs: '20', open: [] }, cap: '例題 6.1 第 1 題（p.164）改寫成 Python。書中答案：-5、15、20、24、30 各測試一個分支。再試邊界值 18.5、23、25。' },
      ],
      practice: [
        { id: 'u8-s1-p1', type: 'mc', pts: 2, src: '教科書 p.167 測試站 6.1 第 1 題（參考 DSE 2012 1A Q29）', tags: [HOT_TEST],
          q: '大仁完成了算法設計，並利用了一些正確的數據作測試。他下一個步驟應該做什麼？',
          options: ['繪畫算法的流程圖', '利用一些錯誤的數據再作測試', '編製文件', '使用模組化設計改良算法'], answer: 1,
          hint: '正確數據測試過了，還未測試的是什麼？' },
        { id: 'u8-s1-p2', type: 'mc', pts: 2, src: '教科書 p.167 測試站 6.1 第 2 題（參考 DSE 2015 1A Q29）', tags: [HOT_TEST],
          q: '參考以下程式。下列哪組測試數據最適合用作測試此程式？',
          code: C('second = int(input())', 'if second < 0 or second > 59:', '    print("錯誤")'), inputs: '60',
          options: ['20, 30, 58, 59, 60', '-1, 0, 1, 40, 50', '-2, 0, 20, 59, 60', '0, 10, 30, 50, 59'], answer: 2,
          hint: '要同時包括兩端（0 和 59）的分界值、兩邊的錯誤數據及正常數據。' },
        { id: 'u8-s1-p3', type: 'mc', pts: 2, src: '教科書 p.167 測試站 6.1 第 3 題（參考 DSE 2020 1A Q34）', tags: [HOT_TEST],
          q: '某電子錢包每筆轉賬：最低 $1，最高 $3000。下列哪組金額最適合作為測試數據？',
          options: ['0, 0.5, 10, 100, 200, 500, 1500', '100, 200, 500, 1500, 2000, 2500', '0, 1, 1000, 2000, 3000, 4000', '10, 100, 200, 500, 1000, 3000'], answer: 2,
          hint: '包括 1 和 3000 兩個分界值，以及兩邊的錯誤數據（0、4000）。' },
        { id: 'u8-s1-p4', type: 'mc', pts: 2, src: '教科書 p.168 測試站 6.1 第 4 題（參考 DSE 2019 1A Q28）', tags: [HOT_TEST],
          q: '用於測試以下程式的邊際個案是什麼？\n(1) 0　(2) 50　(3) 51　(4) 100',
          code: C('x = int(input())', 'if x > 50:', '    Y = 100', 'else:', '    Y = 0'), inputs: '51',
          options: ['只有 (1) 和 (2)', '只有 (2) 和 (3)', '只有 (1) 和 (4)', '(1)、(2)、(3) 和 (4)'], answer: 1,
          hint: '條件 x > 50 的結果在 50 和 51 之間改變。' },
        { id: 'u8-s1-p5', type: 'fill', pts: 2, src: '教科書 p.164 例題 6.1 第 1 題（邊界值）', q: '輸入邊界數據值 23，輸出是什麼？（先想，再按 ▶ 驗證）',
          code: C('bmi = float(input("BMI: "))', 'if bmi <= 0:', '    print("輸入錯誤")', 'elif bmi < 18.5:', '    print("過輕")', 'elif bmi < 23:', '    print("正常")', 'elif bmi < 25:', '    print("超重")', 'else:', '    print("肥胖")'),
          inputs: '23', blanks: [{ label: '輸出（最後一行）', a: '超重', accept: ['超重'] }],
          hint: '23 不小於 23，所以不是「正常」。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '三種程式錯誤', pages: '教科書 p.169–180',
      learn: [
        { pts: [
          '**語法錯誤（syntax error）**：程式碼違反編程語言的規則，程式**不能執行**。例如欠缺冒號、括號或引號，關鍵字拼錯、用關鍵字作變量名稱、縮排錯誤。IDE 會顯示 `SyntaxError` 或 `IndentationError`。（p.169、p.173–174）',
          '**邏輯錯誤（logic error）**：**沒有錯誤信息**，程式能執行，但結果或行為不正確。例如序列出錯、條件寫錯、無限循環、`=` 與 `==` 以外的計算錯誤。要用**測試數據**才找得到。（p.170、p.175–177）',
          '**運行時錯誤（run-time error）**：程式在執行過程中遇到問題而**意外終止**。例如除以零（`ZeroDivisionError`）、負數開方（`ValueError: math domain error`）、索引超出範圍（`IndexError`）、`int("A")`（`ValueError`）。（p.170、p.178）',
          '讀錯誤信息：Traceback 的 `line 3` 是出錯的行號，最後一行是**錯誤類型**和原因。（p.178）',
          '注意：Python 是逐行執行的。`Print("x")`、未定義的變量、未 `import math` 便用 `math.sqrt` 會在**運行到那一行**才出 `NameError`；`"10" + 5` 出 `TypeError`。教科書把它們放在語法錯誤表（p.173–174），因為成因是「寫錯字」；在 Python 中它們嚴格來說是運行時才出現的錯誤。',
        ] },
        { table: { head: ['錯誤類型', '程式能否開始執行？', '有沒有錯誤信息？', '例子'], rows: [['語法錯誤', '不能', '有（SyntaxError）', '`if num < 0`（欠冒號）'], ['運行時錯誤', '能，但中途終止', '有（ZeroDivisionError 等）', '`Z = (X + Y)/(X - Y)`，X = Y'], ['邏輯錯誤', '能，並完成', '沒有', '`if age >= 18 or age < 65:`']] } },
        { sim: { code: C('age = int(input("Age: "))', 'if age >= 18 or age < 65:', '    print("成人票")', 'else:', '    print("特惠票")'), inputs: '70', open: [] }, cap: 'p.175 的邏輯錯誤：無論輸入 15、65 還是 70，都輸出「成人票」。把 `or` 改成 `and` 再試。' },
        { sim: { code: C('AR = [2, 4, 6, 8, 10]', 'for i in range(0, 6):', '    print(AR[i])'), open: [] }, cap: 'p.178 運行時錯誤題目 3：先輸出 5 個數字，到 AR[5] 才出 IndexError。' },
      ],
      practice: [
        { id: 'u8-s2-p1', type: 'mc', pts: 2, src: '教科書 p.174 語法錯誤表第 15 題', tags: [HOT_ERR], verify: true, ask: { error: true },
          q: '運行以下程式，會出現哪一種錯誤信息？', code: C('num = 0', 'if num = 0:', '    print("It is a zero")'),
          options: ['SyntaxError', 'NameError', 'ZeroDivisionError', '沒有錯誤'], answer: 0,
          hint: '條件要用關係運算符 `==`，不能用賦值運算符 `=`。' },
        { id: 'u8-s2-p2', type: 'mc', pts: 2, src: '教科書 p.178 運行時錯誤題目 3', tags: [HOT_ERR], verify: true, ask: { error: true },
          q: '運行以下程式，最後出現哪一種錯誤？', code: C('AR = [2, 4, 6, 8, 10]', 'for i in range(0, 6):', '    print(AR[i])'),
          options: ['SyntaxError', 'ValueError', 'IndexError', 'TypeError'], answer: 2,
          hint: 'AR 只有索引 0 至 4。' },
        { id: 'u8-s2-p3', type: 'fill', pts: 2, src: '教科書 p.178 運行時錯誤題目 2、p.180 測試站 6.2 第 4 題', q: '運行以下程式。寫出錯誤類型及出錯的行號。',
          code: C('import math', 'A = 2', 'B = 6', 'C = math.sqrt(A-B)', 'print(C)'),
          blanks: [{ label: '錯誤類型', ask: { error: true } }, { label: '行號', a: '4', accept: ['4', '第4行', '第 4 行'] }],
          hint: 'A − B = −4；不能計算負數的平方根（math domain error）。' },
        { id: 'u8-s2-p4', type: 'mc', pts: 2, src: '教科書 p.173 語法錯誤表第 6 題', verify: true, ask: { error: true },
          q: '運行以下程式，Python 實際顯示哪一種錯誤？', code: C('NAME = "Apple"', 'print(name)'),
          options: ['SyntaxError', 'NameError', 'TypeError', '沒有錯誤'], answer: 1,
          hint: 'Python 區分大小寫，NAME 和 name 是兩個不同的變量。',
          why: '教科書把它列在語法錯誤表（原因是寫錯名稱），但 Python 運行到第 2 行才發現 name 未定義，顯示 NameError。' },
        { id: 'u8-s2-p5', type: 'mc', pts: 2, src: '教科書 p.179 測試站 6.2 第 1 題（參考 DSE 2013 1A Q31）', tags: [HOT_ERR],
          q: '以下程式計算直線斜率。輸入什麼 X2 值，會產生運行時錯誤？',
          code: C('X2 = int(input())', 'Y2 = 4', 'Y1 = 2', 'X1 = 1', 'print((Y2-Y1)/(X2-X1))'), inputs: '3',
          options: ['-1', '0', '1', '2'], answer: 2,
          hint: '分母 X2 − X1 等於 0 時會除以零。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '找出邏輯錯誤；除錯模式；程式設計階段', pages: '教科書 p.171–172、p.175–181',
      learn: [
        { pts: [
          '**除錯模式（debug mode）**：Thonny 按甲蟲圖示開始，按「跳入（Step into）」逐句執行，並在「變數」窗格觀察每個變量的值——就像電腦替你做空運行和追蹤表。（p.171–172 實驗站 6.1）',
          '找邏輯錯誤的方法：用測試數據比較**預期結果**與**測試結果**；不相同便逐步追蹤，看哪一行令變量出錯。（p.175）',
          'p.176 題目 2：互換 A、B 時直接 `A = B`、`B = A`，兩個都變成 20——要先用**暫儲變量**保存其中一個值。',
          'p.177 題目 5：多向選擇的條件**次序**錯了（先判斷 `>= 50`），90 分也只得「Pass」——應由最高的分界開始判斷。',
          '**程式設計兩大階段**（p.181）：\n(1) 分析問題階段：界定問題 → 識別輸入和輸出 → 設計算法；\n(2) 實施階段：把算法翻譯成程式語言 → 運行程式，識別**語法錯誤** → 用測試數據測試，識別**運行時和邏輯錯誤** → 編製文件。',
        ] },
        { sim: { code: C('A = 1', 'B = 3', 'if A > B:', '    print(B-A/2)', 'else:', '    print(A-B/2)'), open: ['vars'], step: true }, cap: '實驗站 6.1（p.171）：按「下一步」逐句執行，觀察變量 A、B，以及程式走進 if 還是 else。' },
        { sim: { code: C('A = 10', 'B = 20', 'A = B', 'B = A', 'print(A)', 'print(B)'), open: ['vars'], step: true }, cap: 'p.176 題目 2：預期 20、10，結果是 20、20。逐步看 A 在哪一步被覆蓋。' },
      ],
      practice: [
        { id: 'u8-s3-p1', type: 'trace', pts: 3, src: '教科書 p.176 題目 2（更正版）', q: '以下是更正後的互換程式。填寫追蹤表。',
          code: C('A = 10', 'B = 20', 'temp = A', 'A = B', 'B = temp', 'print(A, B)'),
          spec: { mode: 'stmt', cols: ['A', 'B', 'temp'], out: true },
          hint: 'temp 先保存 A 原本的值 10。' },
        { id: 'u8-s3-p2', type: 'complete', pts: 3, src: '教科書 p.177 題目 5', label: '更正程式',
          q: '以下程式根據成績輸出等級，但只會得出 Pass 或 Fail。把條件的次序更正：80 或以上 Distinction，60 或以上 Credit，50 或以上 Pass，其餘 Fail。',
          template: C('score = int(input())', 'if score >= ［1］:', '    print("Distinction")', 'elif score >= ［2］:', '    print("Credit")', 'elif score >= ［3］:', '    print("Pass")', 'else:', '    print("Fail")'),
          ref: ['80', '60', '50'],
          tests: [{ inputs: '40' }, { inputs: '55' }, { inputs: '70' }, { inputs: '90' }, { inputs: '49' }, { inputs: '50' }, { inputs: '60' }, { inputs: '80' }],
          hint: '由最高的分界開始判斷；elif 只會在前面的條件不成立時才判斷。' },
        { id: 'u8-s3-p3', type: 'mc', pts: 2, src: '教科書 p.179 測試站 6.2 第 3 題（參考 DSE 2013 1A Q35）',
          q: '以下程式（由 p.179 流程圖改寫）的目的是找出 3 個輸入數值中最小的數值。哪個邏輯錯誤導致它不能輸出正確結果？',
          code: C('min_num = 0', 'C = 1', 'while not (C > 3):', '    N = int(input())', '    if N < min_num:', '        min_num = N', '    C = C + 1', 'print(min_num)'), inputs: '2\n5\n6',
          options: ['變量 min_num 的初始值是 0', '變量 C 的初始值是 1', '循環條件「C > 3」', '判斷條件「N < min_num」'], answer: 0,
          hint: '輸入 2、5、6（都大於 0）試試看：結果會是 0。' },
        { id: 'u8-s3-p4', type: 'mc', pts: 2, src: '教科書 p.181 圖 6.1',
          q: '根據程式設計過程，**測試程式**時發現邏輯錯誤，下一步應該做什麼？',
          options: ['重新界定問題', '識別錯誤後返回「編寫程式」修改', '直接編製文件', '重新識別程式的輸入和輸出'], answer: 1,
          hint: '圖 6.1：測試程式 NO → 識別運行時錯誤和邏輯錯誤 → 返回編寫程式。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '算法比較：條件判斷次數與資源', pages: '教科書 p.182–192',
      learn: [
        { pts: [
          '算法的優劣可從**執行步數**及**資源運用**（例如變量數目）比較。（p.182）',
          '**多個獨立 if** 每次都會判斷所有條件；**if…elif…else** 遇到成立的條件便離開，判斷次數較少。（p.182、p.184–185 例題 6.2 第 1 題）',
          '**for 循環**檢索一定走完整個列表；**while 循環**加上 `found == False`，找到便停止，一般較快。（p.186 例題 6.2 第 2 題）',
          '**短路求值**：`A and B` 若 A 不成立，便不會判斷 B；`A or B` 若 A 成立，便不會判斷 B。所以 `if A == 0 and B == 0` 與嵌套的兩個 if 判斷次數大致相同。（p.190 測試站 6.3 第 3、4 題）',
          '短路求值也可防止運行時錯誤：`if b != 0 and a / b > 2:`——b 是 0 時不會計算 a / b。',
          '有時要取捨：p.191 用 5 個變量直接相加（步數少、變量多）vs 用循環重複使用一個變量 num（步數多、變量少）。（p.191）',
        ] },
        { table: { head: ['time', '算法 1（5 個獨立 if）', '算法 2（if…elif）'], rows: [['300', '5', '1（最好情況）'], ['900', '5', '2'], ['1500', '5', '3'], ['1900', '5', '4'], ['2200', '5', '4（最差情況）']] }, cap: 'p.185 例題 6.2 第 1 題：條件判斷次數' },
        { sim: { code: C('time = int(input("Time (24-hour): "))', 'if time < 500 or time >= 2300:', '    print("Sleeping...")', 'elif time < 1200:', '    print("Good morning!")', 'elif time < 1800:', '    print("Good afternoon!")', 'elif time < 2000:', '    print("Good evening!")', 'else:', '    print("Good night!")'), inputs: '1500', open: ['trace'], step: true }, cap: '例題 6.2 算法 2（p.184）改寫成 Python。逐步執行，數一數判斷了多少個條件。' },
      ],
      practice: [
        { id: 'u8-s4-p1', type: 'fill', pts: 3, src: '教科書 p.186 例題 6.2 第 2 題（改寫成 Python）', tags: [HOT_EFF],
          q: '程式先用算法 1（for）再用算法 2（while）檢索 target。寫出第 6 行和第 11 行（`if target == A[i]`）各執行了多少次。',
          code: C('A = [12, 7, 30, 7, 5, 18, 9, 21]', 'target = 30', 'N = len(A)', 'found = False', 'for i in range(0, N):', '    if target == A[i]:', '        found = True', 'found2 = False', 'i = 0', 'while i < N and found2 == False:', '    if target == A[i]:', '        found2 = True', '    i = i + 1', 'print(found, found2)'),
          blanks: [{ label: '第 6 行（算法 1）', ask: { count: 6 } }, { label: '第 11 行（算法 2）', ask: { count: 11 } }],
          hint: '算法 1 走完 8 個項目；算法 2 在第 3 個項目找到便停止。' },
        { id: 'u8-s4-p2', type: 'fill', pts: 3, src: '教科書 p.184–185 例題 6.2 第 1 題', tags: [HOT_EFF],
          q: '例題 6.2 算法 2。輸入 1900，寫出輸出，以及一共判斷了多少個條件（`or` 組成的第一個條件當 1 次）。',
          code: C('time = int(input("Time (24-hour): "))', 'if time < 500 or time >= 2300:', '    print("Sleeping...")', 'elif time < 1200:', '    print("Good morning!")', 'elif time < 1800:', '    print("Good afternoon!")', 'elif time < 2000:', '    print("Good evening!")', 'else:', '    print("Good night!")'),
          inputs: '1900',
          blanks: [{ label: '輸出（最後一行）', a: 'Good evening!', accept: ['Good evening!', 'Good evening'] }, { label: '條件判斷次數', a: '4', accept: ['4'] }],
          hint: '依次判斷：第一個條件、< 1200、< 1800、< 2000（成立）。' },
        { id: 'u8-s4-p3', type: 'mc', pts: 2, src: '自擬（考點：教科書 p.190 短路求值）', verify: true,
          q: '以下程式的輸出是什麼？', code: C('a = 10', 'b = 0', 'if b != 0 and a / b > 2:', '    print("Big")', 'else:', '    print("Small")'),
          options: ['Big', 'Small', 'ZeroDivisionError', '沒有輸出'], answer: 1,
          hint: '`b != 0` 不成立，`and` 後面的 a / b 根本不會計算。' },
        { id: 'u8-s4-p4', type: 'mc', pts: 2, src: '教科書 p.190 測試站 6.3 第 4 題（挑戰題）',
          q: '以下哪些算法的效率是大致相同的？\n算法 1：`if grade == "5**" or grade == "5*":` 輸出一次\n算法 2：兩個獨立的 `if`（先 "5**"，再 "5*"）\n算法 3：`if grade == "5**":` … `elif grade == "5*":` …',
          options: ['算法 1 和算法 2', '算法 1 和算法 3', '算法 2 和算法 3', '三個都相同'], answer: 1,
          hint: 'OR 的第一個條件成立便不判斷第二個，效果與 elif 相同；算法 2 一定判斷兩次。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '分析題', pages: '教科書 p.162–178、p.194–198',
      tasks: [
        { id: 'u8-w1', kind: 'table', tier: '必做', pts: 12, title: '錯誤類型及原因', src: '教科書 p.173–178',
          q: '每段程式都有一個錯誤。選出錯誤類型及原因。',
          head: ['程式（或情況）', '錯誤類型', '原因'], opts: { T: TYPES, R: REASONS },
          rows: [
            ['`print"I love ICT"`', { sel: 'T', a: TYPES[0] }, { sel: 'R', a: REASONS[0] }],
            ['`if num < 0`（下一行是縮排了的 print）', { sel: 'T', a: TYPES[0] }, { sel: 'R', a: REASONS[1] }],
            ['`X = 2`、`Y = 2`、`Z = (X + Y)/(X - Y)`', { sel: 'T', a: TYPES[2] }, { sel: 'R', a: REASONS[2] }],
            ['`A = 2`、`B = 6`、`C = math.sqrt(A-B)`', { sel: 'T', a: TYPES[2] }, { sel: 'R', a: REASONS[3] }],
            ['`num = int(input())`，用家輸入 A', { sel: 'T', a: TYPES[2] }, { sel: 'R', a: REASONS[4] }],
            ['`if age >= 18 or age < 65:` 輸出成人票', { sel: 'T', a: TYPES[1] }, { sel: 'R', a: REASONS[5] }],
            ['`i = 1`、`while i <= 10:` 循環內只有 `print(i)`', { sel: 'T', a: TYPES[1] }, { sel: 'R', a: REASONS[6] }],
            ['`AR` 有 5 個項目，`for i in range(0, 6): print(AR[i])`', { sel: 'T', a: TYPES[2] }, { sel: 'R', a: REASONS[7] }],
          ],
          hint: '不能開始執行 → 語法錯誤；執行中途終止 → 運行時錯誤；完成執行但結果錯 → 邏輯錯誤（無限循環也是邏輯錯誤）。' },
        { id: 'u8-w2', kind: 'table', tier: '進階', pts: 11, title: '設計測試數據', src: '教科書 p.194 課文總結（op 算法）',
          q: '程式：`op > 5` 輸出 Should be smaller；`op < -5` 輸出 Should be larger；否則輸出 OK。正常範圍是 -5 至 5。\n**邊界數據值**＝分界值（-5、5）及其兩旁的值。為每個測試數據選出：是否邊界數據值、屬正常還是錯誤數據值、預期輸出。',
          head: ['op', '邊界數據值？', '正常／錯誤', '預期輸出'], opts: { B: BOUND, N: NE, O: OPOUT },
          rows: [
            ['-10', { sel: 'B', a: '否' }, { sel: 'N', a: NE[1] }, { sel: 'O', a: OPOUT[1] }],
            ['-6', { sel: 'B', a: '是' }, { sel: 'N', a: NE[1] }, { sel: 'O', a: OPOUT[1] }],
            ['-5', { sel: 'B', a: '是' }, { sel: 'N', a: NE[0] }, { sel: 'O', a: OPOUT[2] }],
            ['-4', { sel: 'B', a: '是' }, { sel: 'N', a: NE[0] }, { sel: 'O', a: OPOUT[2] }],
            ['0', { sel: 'B', a: '否' }, { sel: 'N', a: NE[0] }, { sel: 'O', a: OPOUT[2] }],
            ['5', { sel: 'B', a: '是' }, { sel: 'N', a: NE[0] }, { sel: 'O', a: OPOUT[2] }],
            ['6', { sel: 'B', a: '是' }, { sel: 'N', a: NE[1] }, { sel: 'O', a: OPOUT[0] }],
            ['10', { sel: 'B', a: '否' }, { sel: 'N', a: NE[1] }, { sel: 'O', a: OPOUT[0] }],
          ],
          hint: '-5 和 5 本身在正常範圍內（條件是 > 5 和 < -5）；-6 和 6 已在範圍外。' },
        { id: 'u8-w3', tier: '挑戰', pts: 12, title: '除錯：五個數的總和、平均及合格數', src: '仿教科書 p.198 課題練習 選擇題 9、10',
          q: '以下程式要輸入 **5 個**整數，輸出總和、平均數，以及 **50 或以上**的數目。程式可以運行，但有**三個邏輯錯誤**。用測試數據（例如 10、20、30、40、50）找出並更正它們。',
          starter: C('total = 0', 'N = 4', 'passed = 0', 'for i in range(1, 5):', '    num = int(input("Num: "))', '    total = total + num', '    if num > 50:', '        passed = passed + 1', 'print("Total:", total)', 'print("Average:", total / N)', 'print("Passed:", passed)'),
          ref: C('total = 0', 'N = 5', 'passed = 0', 'for i in range(0, 5):', '    num = int(input("Num: "))', '    total = total + num', '    if num >= 50:', '        passed = passed + 1', 'print("Total:", total)', 'print("Average:", total / N)', 'print("Passed:", passed)'),
          tests: [{ inputs: '10\n20\n30\n40\n50' }, { inputs: '1\n2\n3\n4\n5' }, { inputs: '50\n50\n50\n50\n50' }, { inputs: '49\n51\n0\n100\n0' }, { inputs: '-5\n5\n10\n0\n15' }],
          hint: '數一數 range(1, 5) 執行幾次；平均數要除以幾多個數；「50 或以上」包括 50（邊界數據值）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.196–198 課題練習',
      items: [
        { id: 'u8-q1', pts: 4, src: '教科書 p.196 課題練習 選擇題 1',
          q: '某程式設計師編寫了一個電腦程式以計算某商店的利潤。他下一步應該做什麼？',
          options: ['直接將程式交予商戶。', '用不同的數據組合測試程式是否可能出錯。', '判斷程式的輸入和輸出。', '繪畫流程圖以說明程式。'], answer: 'B',
          why: '寫好程式後便要測試（p.181 實施階段）；判斷輸入輸出和流程圖屬於之前的分析問題階段。' },
        { id: 'u8-q2', pts: 4, src: '教科書 p.196 課題練習 選擇題 2', tags: [HOT_TEST],
          q: '判斷以下程式的邊界案例。', code: C('Y = int(input())', 'if Y < 3:', '    print("less")', 'if Y >= 3 and Y <= 6:', '    print("between")', 'if Y > 6:', '    print("more")'), inputs: '3',
          options: ['3', '3, 6', '3, 6, 9', '1, 3, 5, 6, 10'], answer: 'B',
          why: '輸出在 3 和 6 這兩個分界值改變。' },
        { id: 'u8-q3', pts: 4, src: '教科書 p.197 課題練習 選擇題 4', tags: [HOT_ERR],
          q: '以下 Python 程式中，哪（幾）行有語法錯誤？（第 1 行是 `name = input("name:")`）', code: C('name = input("name:")', 'age = "17"', 'print(name, is, age)'), inputs: 'Tom',
          options: ['只有第 1 行', '只有第 2 行', '只有第 3 行', '只有第 1 行和第 3 行'], answer: 'C',
          why: '`is` 是 Python 關鍵字，沒有引號便不能當作要輸出的文字，第 3 行出 SyntaxError；應寫 `print(name, "is", age)`。' },
        { id: 'u8-q4', pts: 4, src: '教科書 p.197 課題練習 選擇題 5',
          q: '以下 Python 程式中，哪行有邏輯錯誤？（第 1 行是 `score = int(input())`）', code: C('score = int(input())', 'if score >= 50 or score < 50:', '    print("Pass")', 'else:', '    print("Fail")'), inputs: '40',
          options: ['第 1 行', '第 2 行', '第 3 行', '第 5 行'], answer: 'B',
          why: '條件永遠成立，任何分數都輸出 Pass（與 p.175 成人票例子相同）。' },
        { id: 'u8-q5', pts: 3, src: '教科書 p.197 課題練習 選擇題 7', tags: [HOT_ERR],
          q: '以上程式有哪種／些錯誤？\n(1) 語法錯誤　(2) 邏輯錯誤　(3) 運行時錯誤', code: C('import math', 'A = int("10")', 'B = 2', 'C = math.sqrt(-A + B)'),
          options: ['只有 (1)', '只有 (3)', '只有 (1) 和 (2)', '以上皆是'], answer: 'B',
          why: '`int("10")` 沒有問題；-A + B = -8，計算負數的平方根出 ValueError（運行時錯誤）。' },
        { id: 'u8-q6', pts: 3, src: '教科書 p.198 課題練習 選擇題 10', tags: [{ t: 'trap', why: 'range(1, 5) 由 1 開始，漏了索引 0——程式能運行，是邏輯錯誤。' }],
          q: '以下程式用以計算五個輸入數值的總數。哪行有錯誤？（第 1 行是 `total = 0`）',
          code: C('total = 0', 'i = 0', 'num = [0] * 5', 'while i < 5:', '    num[i] = int(input("num:"))', '    i = i + 1', 'for j in range(1, 5):', '    total = total + num[j]', 'print(total)'), inputs: '1\n2\n3\n4\n5',
          options: ['第 3 行', '第 4 行', '第 7 行', '第 8 行'], answer: 'C',
          why: '列表索引由 0 開始，range(1, 5) 漏了 num[0]；應為 range(0, 5)。' },
        { id: 'u8-q7', pts: 3, src: '教科書 p.198 課題練習 選擇題 11', tags: [HOT_EFF],
          q: '兩個程式都用作找出列表 A（N 個項目）中最大及最小的值。比較兩者的執行時間，以下哪一句描述是正確的？\n程式 1：一個 for 循環（range(1, N)），循環內有兩個 if。\n程式 2：兩個 for 循環（各 range(0, N)），各有一個 if。',
          options: ['兩個算法的執行時間是差不多', '算法 1 一般較快', '算法 2 一般較快', '無法判斷'], answer: 'B',
          why: '程式 1 只走一次列表並由索引 1 開始；程式 2 要走兩次列表，循環次數約多一倍。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyErr', 'pyIf'], intro: '隨機生成「這段程式會出哪種錯誤？」及 if／elif／else 輸出題目，答案由 Python 計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
