/* 單元 1：Python 入門——print、變量與數據類型
 * 教科書 D2 第 4 章 p.4–15（4.1 程式開發；4.2A 變量：關鍵字、識別符、數據類型、轉換數據類型、常數）
 * 教科書疑似錯誤：p.11 把 print 列為關鍵字（Python 3 的 print 是內置函數）——同 D2-3。
 * 教科書疑似錯誤：p.10 活動 4.1 例 4 的「unexpected EOF while parsing」是舊版訊息；新版顯示「'(' was never closed」——同 D2-4。
 * 教科書疑似錯誤：p.11 表 4.1 布爾的例子寫「1 (True)」「0 (False)」；Python 的布爾值是 True／False，1 和 0 是 int（type(1) 是 int）。
 * 教科書疑似錯誤：p.13 說 int() 把浮點數「向下捨入」；實際是向零截斷（int(-2.8) 得 -2，向下捨入應是 -3）。p.61 同類問題見 D2-17。
 * 所有答案在 build 時由 CPython 計算／核對。
 */
const C = (...ls) => ls.join('\n');
const ERR = ['SyntaxError', 'NameError', 'ValueError', 'TypeError', '沒有錯誤'];
const TRAP_INT = { t: 'trap', why: 'int() 把浮點數的小數部分捨去（向零截斷），不是四捨五入：int(7.9) 是 7，int(-2.8) 是 -2。' };
const TRAP_STR = { t: 'trap', why: '有引號的是字串：「"15"」不是整數。' };

module.exports = {
  id: 'u1',
  title: 'Python 入門：print、變量與數據類型',
  book: '教科書 D2 第 4 章 p.4–15',
  key: 'D2-u1-hmac-22b87eb6c5',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '由偽代碼到 Python：Hello World!', pages: '教科書 p.4–10',
      learn: [
        { pts: [
          '偽代碼讓人類理解算法，但電腦不懂偽代碼。由本課開始，我們用 **Python** 編程語言跟電腦溝通。（p.4）',
          '**整合開發環境（IDE）**是用來編寫程式的應用程式，附有程式碼編輯器和其他編程功能。本書用 **Thonny**：上面是編輯器（寫程式），下面是**互動環境（Shell）**（顯示輸出、輸入和錯誤信息）。（p.5）',
          '**實驗站 4.1**：第一個程式 `print("Hello World!")`。按綠色運行按鈕或 F5 執行。`print()` 會**輸出（列印出）括號中的內容**；每個 `print()` 輸出一行。（p.8–9）',
          '文字（字串）要放在**引號**內；數字和算式不用引號：`print(3 + 4)` 輸出 `7`。',
        ] },
        { table: { head: ['偽代碼', 'Python'], rows: [
          ['輸出 "This is to find the area of a square!"', 'print("This is to find the area of a square!")'],
          ['輸入 length', 'length = input("Please enter a side length for a square: ")\nlength = float(length)'],
          ['area ← length * length', 'area = length * length'],
          ['輸出 area', 'print(area)'],
        ] }, cap: '計算正方形面積：偽代碼與 Python 對照（p.4）' },
        { sim: { code: C('print("Hello World!")', 'print("Python is fun")', 'print(3 + 4)', 'print("3 + 4")') }, cap: '實驗站 4.1 第 7 步（p.9）再加兩行。按 ▶ 執行，比較最後兩行。' },
        { h: '活動 4.1：除錯（p.9–10）' },
        { table: { head: ['程式', '錯誤信息', '原因'], rows: [
          ['Print("Hello Warld!")', 'NameError', 'Python 區分大小寫，Print 和 print 不相通'],
          ['print"Hello World!"', 'SyntaxError', '缺少括號'],
          ['print(Hello World!)', 'SyntaxError', '缺少引號'],
          ['print("Hello World!"', 'SyntaxError', '括號（和引號）必須成對'],
        ] } },
        { pts: [
          '注意：引號內的文字寫錯（例如 Warld）不影響程式運行，`print()` 只會照樣列印出來。（p.9）',
          '**語法的重要性**：偽代碼可以把「輸出」寫成「列印」、把「/」寫成「÷」；但程式語言必須遵守嚴格的語法，例如把 `*` 寫成 `x`、把 `"` 寫成 `〃`，程式便不能運行。（p.10）',
          'Thonny 發現語法問題時，程式碼的顏色或背景會改變——多留意這個提示和 Shell 的錯誤信息。（p.10）',
        ] },
        { warn: '新版 Python 對例 4 會顯示 `\'(\' was never closed`；教科書截圖是舊版的 `unexpected EOF while parsing`，意思一樣：括號沒有關上。' },
      ],
      tries: [
        { id: 'u1-s1-t1', pts: 4, src: '教科書 p.8–9 實驗站 4.1', code: C('print("3 + 4")', 'print(3 + 4)'),
          q: '先估：輸出是什麼？', options: ['3 + 4\n7', '7\n7', '3 + 4\n3 + 4', '7\n3 + 4'],
          why: '有引號是字串，原樣輸出；沒有引號是算式，先計算再輸出。' },
      ],
      practice: [
        { id: 'u1-s1-p1', type: 'mc', pts: 2, src: '教科書 p.9–10 活動 4.1', q: '以下哪一句可以正確輸出 Hello World!？',
          options: ['print(Hello World!)', 'Print("Hello World!")', 'print("Hello World!")', 'print"Hello World!"'], answer: 2,
          hint: '小寫 print、括號、字串放在引號內。' },
        { id: 'u1-s1-p2', type: 'mc', pts: 2, src: '教科書 p.10 活動 4.1 例 4', q: '執行以下程式會出現哪一種錯誤？', code: 'print("Hello World!"',
          ask: { error: true }, options: ['SyntaxError', 'NameError', 'ValueError', '沒有錯誤'], answer: 0, verify: true,
          hint: '數一數括號。語法錯誤時，程式一行也不會執行。' },
        { id: 'u1-s1-p3', type: 'complete', pts: 2, src: '教科書 p.9 實驗站 4.1 第 7 步', label: '補完程式',
          q: '補完程式，令 Shell 輸出兩行：`Hello World!` 和 `Python is fun`。', template: C('［1］("Hello World!")', 'print(［2］)'),
          ref: ['print', '"Python is fun"'], tests: [{ inputs: '' }], hint: '第二行的文字要放在引號內。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '變量、關鍵字與識別符', pages: '教科書 p.11–12、p.16',
      learn: [
        { pts: [
          '**變量**用來儲存數據。Python 以 `=` 作為**賦值運算符**：`length = 12` 把 12 放入變量 length。（p.12）',
          '`=` 先計算右邊，再存入左邊；**右邊的新值會取代變量原有的值**。它不是數學的「等於」，所以 `x = x + 1` 是合理的。（p.16）',
          '宣告變量名稱後，該名稱便成為它的**識別符（identifier）**。（p.11）',
          '**關鍵字（保留字）**由程式語言保留，有預定意義，不可用作變量名稱，例如 `and`、`or`、`for`、`while`、`if`、`else`、`import`、`True`、`False`。Thonny 用紫色顯示關鍵字。（p.11）',
          '教科書也把 `print` 列為關鍵字；嚴格來說，Python 3 的 `print` 是**內置函數**，不是關鍵字。但也不應用 print 作變量名稱。',
          '變量未賦值便使用 → **NameError**。',
        ] },
        { h: '命名變量的規則（必修 D 第 2.1 節）' },
        { table: { head: ['規則', '可以', '不可以'], rows: [
          ['只用英文字母、數字、底線 _', 'total_mark', 'total-mark、total mark'],
          ['不可以數字開頭', 'mark2', '2mark'],
          ['不可以是關鍵字', 'for_count', 'for、import'],
          ['區分大小寫', 'SUBJECT 和 subject 是兩個不同的變量', ''],
        ] } },
        { note: '好的名稱要有意義：`price` 比 `p` 易明白。兩個英文字可用底線連接，例如 `total_mark`。' },
        { sim: { code: C('a = 5', 'b = a', 'a = 10', 'print(a)', 'print(b)'), step: true, open: ['vars', 'trace'] }, cap: '按「下一步」：`b = a` 只是把當時 a 的值（5）複製給 b，之後改 a 不會影響 b。' },
      ],
      tries: [
        { id: 'u1-s2-t1', pts: 4, src: '自擬（p.16 賦值）', code: C('x = 3', 'x = x + 2', 'y = x * 2', 'x = 1', 'print(y)'),
          q: '先估：輸出是什麼？', options: ['10', '2', '6', '5'],
          why: 'x 先變成 5，y = 5 * 2 = 10；之後 x 改為 1，不會影響已計算好的 y。' },
      ],
      practice: [
        { id: 'u1-s2-p1', type: 'mc', pts: 1, src: '教科書 p.11', q: '以下哪一個是**有效**的變量名稱？',
          options: ['2nd_score', 'total score', 'for', 'score_2'], answer: 3, hint: '不可數字開頭、不可有空格、不可是關鍵字。' },
        { id: 'u1-s2-p2', type: 'mc', pts: 1, src: '教科書 p.11', q: '以下哪一個**不可以**用作變量名稱？',
          options: ['_count', 'Mark1', 'while', 'myName'], answer: 2, hint: '哪一個是關鍵字？' },
        { id: 'u1-s2-p3', type: 'fill', pts: 2, src: '自擬（常見錯誤：交換兩個變量）', q: '程式想交換 a 和 b 的值。執行後 a 和 b 各是多少？',
          code: C('a = 4', 'b = 7', 'a = b', 'b = a'), blanks: [{ label: 'a', ask: { var: 'a' } }, { label: 'b', ask: { var: 'b' } }],
          hint: '第 3 行之後，a 原來的 4 已被取代。' },
        { id: 'u1-s2-p4', type: 'mc', pts: 2, src: '仿教科書 p.17 活動 4.3', q: '執行以下程式會出現哪一種錯誤？', code: C('SUBJECT = "ICT"', 'print(subject)'),
          ask: { error: true }, options: ['SyntaxError', 'NameError', 'ValueError', '沒有錯誤'], answer: 1, verify: true,
          hint: 'Python 區分大小寫。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '數據類型與 type()', pages: '教科書 p.11–12',
      learn: [
        { table: { head: ['Python 數據類型', '數據', '例子'], rows: [
          ['整數（int）', '整數，包括正負數', '288、-101'],
          ['浮點數（float）', '整數及小數，包括正負數', '56.5、-30.0、-0.382'],
          ['布爾（bool）', '只可能是 True 或 False', 'True、False'],
          ['字串（str）', '一串字符：字母、數字、特別符號', '"abc"、"P%ssword123"、"1"、"k"'],
        ] }, cap: '表 4.1 常見的數據類型（p.11）' },
        { pts: [
          '**數據類型**定義變量儲存的值是哪種類型；電腦據此分配記憶體，也決定可以做哪些運算而不出錯。（p.11）',
          'Python 不用先宣告數據類型：賦值時，按數據自動為變量**標籤**數據類型。（p.12）',
          '`type()` 函數傳回數據類型，例如 `print(type(12))` 輸出 `<class \'int\'>`。（p.12）',
          '同一個變量可以隨時改存另一種類型的數據。（p.12）',
          '`12.0` 有小數點，是 float；`"12"` 有引號，是 str；`True` 第一個字母大寫、不加引號，`"True"` 是字串。',
          'Python 把字符當作長度為 1 的字串（`"k"` 也是 str）。（p.11 提示）',
        ] },
        { sim: { code: C('length = 12', 'print(length)', 'print(type(length))', '', 'length = 12.0', 'print(length)', 'print(type(length))', '', 'length = "The length is twelve"', 'print(length)', 'print(type(length))'), open: ['vars'] }, cap: '同一個變量 length 被標籤成三種數據類型（p.12）。' },
      ],
      tries: [
        { id: 'u1-s3-t1', pts: 4, src: '教科書 p.12', tags: [TRAP_STR], code: C('x = "3.5"', 'print(type(x))'),
          q: '先估：輸出是什麼？', options: ["<class 'str'>", "<class 'float'>", "<class 'int'>", '3.5'],
          why: '3.5 放在引號內，是字串。' },
      ],
      practice: [
        { id: 'u1-s3-p1', type: 'fill', pts: 3, src: '教科書 p.11 表 4.1', q: '寫出每個變量的數據類型（int、float、bool 或 str）。',
          code: C('a = 288', 'b = -30.0', 'c = "1"', 'd = False'),
          blanks: [{ label: 'a', ask: { expr: 'type(a).__name__' } }, { label: 'b', ask: { expr: 'type(b).__name__' } }, { label: 'c', ask: { expr: 'type(c).__name__' } }, { label: 'd', ask: { expr: 'type(d).__name__' } }],
          hint: '看小數點和引號。' },
        { id: 'u1-s3-p2', type: 'mc', pts: 1, src: '教科書 p.11', q: '以下哪一個值是**浮點數（float）**？',
          options: ['7', '"7.0"', '7.0', 'True'], answer: 2, hint: '有小數點、沒有引號。' },
        { id: 'u1-s3-p3', type: 'mc', pts: 1, src: '教科書 p.12', q: '以下程式的輸出是什麼？', code: C('ok = "False"', 'print(type(ok))'),
          options: ["<class 'bool'>", "<class 'str'>", 'False', "<class 'int'>"], answer: 1, verify: true, hint: '留意引號。' },
        { id: 'u1-s3-p4', type: 'mc', pts: 1, src: '教科書 p.11', q: '以下哪一句把布爾值「真」存入變量 passed？',
          options: ['passed = true', 'passed = "True"', 'passed = True', 'passed = TRUE'], answer: 2, hint: '第一個字母大寫，不加引號。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '轉換數據類型與常數', pages: '教科書 p.13–15',
      learn: [
        { table: { head: ['函數', '目的', '例子', '結果'], rows: [
          ['int()', '轉換成整數', 'int("12")、int(12.1)', '12、12'],
          ['float()', '轉換成浮點數', 'float("12")、float(12)', '12.0、12.0'],
          ['str()', '轉換成字串', 'str(12)、str(12.1)', '"12"、"12.1"'],
        ] }, cap: '轉換數據類型（type casting）（p.13–14）' },
        { pts: [
          '`int()` 把浮點數的**小數部分捨去**：`int(12.1)` 是 12，`int(7.9)` 是 7（不是四捨五入）。教科書說「向下捨入」；負數時其實是向零截斷：`int(-2.8)` 是 -2。',
          '`print()` 字串時不會顯示引號：`print(str(12))` 輸出 `12`，要用 `type()` 才看到是 str。（p.14）',
          '字串和數字不可以直接用 `+` 連接：`"Age: " + 16` → **TypeError**；要寫 `"Age: " + str(16)`。',
          '預告（p.24）：`input()` 取得的數據一定是**字串**，要計算便要用 `int()` 或 `float()` 轉換。',
        ] },
        { h: '活動 4.2：除錯（數據類型）（p.14–15）' },
        { fix: { bad: C('length = "12.1"', 'length = int(length)'), good: C('length = "12.1"', 'length = float(length)', 'length = int(length)'), why: '帶小數的字串不能直接轉換成整數（ValueError）；先轉換成浮點數，再轉換成整數。' } },
        { pts: [
          '例 2：`int("ten")` → **ValueError**：字串內的文字不能轉換成數字。',
        ] },
        { h: '常數（p.15）' },
        { pts: [
          '有些值是固定的，例如 π = 3.14159。擁有固定數據的變量稱為**常數（constant）**。',
          'Python 其實也把常數當作變量，可以隨時改變；所以約定俗成**以全大寫字母命名**，例如 `PI = 3.14159`，提醒程式員不應更改。',
        ] },
        { table: { head: ['錯誤類型', '原因', '例子'], rows: [
          ['SyntaxError', '寫法不符合 Python 語法', 'print"Hi"、print("Hi"'],
          ['NameError', '名稱未定義', 'Print("Hi")、未賦值便 print(mark)'],
          ['ValueError', '值的內容不能轉換', 'int("12.1")、int("ten")'],
          ['TypeError', '數據類型不能這樣運算', '"Age: " + 16'],
        ] }, cap: '本課見到的錯誤類型' },
        { sim: { code: C('length = "12.1"', 'print(length)', 'print(type(length))', 'length = int(length)', 'print(length)', 'print(type(length))'), open: ['vars'] }, cap: '活動 4.2 例 1（p.14）：按 ▶ 看錯誤信息，再按上面的方法改正。' },
      ],
      tries: [
        { id: 'u1-s4-t1', pts: 4, src: '教科書 p.13 程式碼 A', tags: [TRAP_INT], code: C('length = 7.9', 'length = int(length)', 'print(length)'),
          q: '先估：輸出是什麼？', options: ['7', '8', '7.0', '8.0'],
          why: 'int() 直接捨去小數部分，結果是整數 7。' },
        { id: 'u1-s4-t2', pts: 4, src: '自擬（p.14 str()）', code: C('x = str(12) + "3"', 'print(x)'),
          q: '先估：輸出是什麼？', options: ['123', '15', '12 3', '12'],
          why: '兩個字串用 + 連接，"12" + "3" 得 "123"。' },
      ],
      practice: [
        { id: 'u1-s4-p1', type: 'mc', pts: 1, src: '教科書 p.15 活動 4.2 例 2', q: '執行以下程式會出現哪一種錯誤？', code: C('length = "ten"', 'length = int(length)', 'print(length * length)'),
          ask: { error: true }, options: ['SyntaxError', 'NameError', 'ValueError', '沒有錯誤'], answer: 2, verify: true,
          hint: '字串內的文字不能轉換成數字。' },
        { id: 'u1-s4-p2', type: 'mc', pts: 1, src: '自擬（p.14）', q: '執行以下程式會出現哪一種錯誤？', code: 'print("Age: " + 16)',
          ask: { error: true }, options: ['SyntaxError', 'NameError', 'TypeError', '沒有錯誤'], answer: 2, verify: true,
          hint: '字串 + 整數。' },
        { id: 'u1-s4-p3', type: 'complete', pts: 2, src: '教科書 p.14 活動 4.2 例 1 答案', label: '補完程式',
          q: '改正活動 4.2 例 1：把字串 "12.1" 轉換成整數 12，並輸出它的數據類型。', template: C('length = "12.1"', 'length = ［1］(length)', 'length = ［2］(length)', 'print(length)', 'print(type(length))'),
          ref: ['float', 'int'], tests: [{ inputs: '' }], hint: '先轉換成浮點數，再轉換成整數。' },
        { id: 'u1-s4-p4', type: 'fill', pts: 2, src: '自擬（p.13–14 轉換數據類型）', q: '執行後，a、b、c 的值是什麼？（照 Python 顯示的寫法）',
          code: C('a = float(7)', 'b = int(-2.8)', 'c = str(3.0)'),
          blanks: [{ label: 'a', ask: { var: 'a' } }, { label: 'b', ask: { var: 'b' } }, { label: 'c', ask: { var: 'c' } }],
          hint: 'float 一定有小數點；int() 捨去小數部分；str() 照樣保留「.0」。' },
        { id: 'u1-s4-p5', type: 'mc', pts: 1, src: '教科書 p.15', q: '以下哪一句最符合 Python 表示**常數**的習慣？',
          options: ['tax_rate = 0.15', 'TAX_RATE = 0.15', 'TaxRate = "0.15"', 'const tax = 0.15'], answer: 1, hint: '全大寫字母命名。（const 是 C++ 的寫法。）' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.9–15',
      intro: '在編輯器寫 Python，可以先按 ▶ 自己測試，再按「提交評核」。輸入數據每行一個，按次序交給每一個 input()。',
      tasks: [
        { id: 'u1-w1', kind: 'table', tier: '必做', title: '認出錯誤類型', pts: 10, src: '教科書 p.9–10 活動 4.1、p.14–15 活動 4.2',
          q: '每行程式**單獨執行**時，會出現哪一種錯誤？',
          prompt: '每行程式**單獨執行**時，會出現哪一種錯誤？',
          head: ['程式', '錯誤類型'], opts: { E: ERR },
          rows: [
            ['Print("Hello Warld!")', { sel: 'E', a: 'NameError' }],
            ['print"Hello World!"', { sel: 'E', a: 'SyntaxError' }],
            ['print(Hello World!)', { sel: 'E', a: 'SyntaxError' }],
            ['length = int("12.1")', { sel: 'E', a: 'ValueError' }],
            ['length = float("12")', { sel: 'E', a: '沒有錯誤' }],
            ['print("Total: " + 5)', { sel: 'E', a: 'TypeError' }],
            ['print(mark)（之前沒有 mark）', { sel: 'E', a: 'NameError' }],
            ['for = 3', { sel: 'E', a: 'SyntaxError' }],
          ],
          hint: '寫法錯 → SyntaxError；名稱未定義 → NameError；值不能轉換 → ValueError；類型不能一起運算 → TypeError。' },
        { id: 'u1-w2', tier: '進階', title: '除錯：明年幾歲', pts: 12, src: '仿教科書 p.9–10 活動 4.1、p.14',
          q: '程式讀入姓名和年齡，應輸出兩行，例如輸入 `Amy` 和 `16`：\n`Hello, Amy`\n`Next year: 17`\n但最後一行出錯。請改正程式（不要改 input() 那兩行）。',
          prompt: '程式讀入姓名和年齡，應輸出兩行，例如輸入 `Amy` 和 `16`：\n`Hello, Amy`\n`Next year: 17`\n但最後一行出錯。請改正程式（不要改 input() 那兩行）。',
          starter: C('name = input("Name: ")', 'age = input("Age: ")', 'print("Hello, " + name)', 'print("Next year: " + age + 1)'),
          ref: C('name = input("Name: ")', 'age = input("Age: ")', 'print("Hello, " + name)', 'print("Next year: " + str(int(age) + 1))'),
          tests: [{ inputs: 'Amy\n16' }, { inputs: 'Chan Tai Man\n15' }, { inputs: 'Ben\n0' }, { inputs: 'Grandma\n99' }],
          hint: 'age 是字串：先 `int(age) + 1`，再用 `str()` 轉回字串才可以和 "Next year: " 連接。' },
        { id: 'u1-w3', tier: '挑戰', title: '分數變身', pts: 13, src: '仿教科書 p.14 活動 4.2',
          q: '輸入一個帶小數的分數（例如 `87.6`）。輸出三行：\n1. 轉換成浮點數後的值，例如 `87.6`\n2. 用 `int()` 取得的整數部分，例如 `87`\n3. 整數部分後面加上「分」，例如 `87分`',
          prompt: '輸入一個帶小數的分數（例如 `87.6`）。輸出三行：\n1. 轉換成浮點數後的值，例如 `87.6`\n2. 用 `int()` 取得的整數部分，例如 `87`\n3. 整數部分後面加上「分」，例如 `87分`',
          starter: C('s = input("Mark: ")', 'print(int(s))'),
          ref: C('s = input("Mark: ")', 'mark = float(s)', 'print(mark)', 'whole = int(mark)', 'print(whole)', 'print(str(whole) + "分")'),
          tests: [{ inputs: '87.6' }, { inputs: '100.0' }, { inputs: '0.5' }, { inputs: '59.99' }, { inputs: '-3.7' }],
          rules: [{ must: 'float(', msg: '要用 float() 先把字串轉換成浮點數' }],
          hint: '`int("87.6")` 會 ValueError（活動 4.2），要先 `float(s)`；`int()` 捨去小數部分，-3.7 變 -3。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.9–15',
      items: [
        { id: 'u1-q1', pts: 4, src: '自擬（p.11 識別符）', q: '以下哪一個是 Python 中**有效**的變量名稱？',
          options: ['my-score', 'if', '_total2', '3rd'], answer: 'C', why: '可以底線開頭；不可有「-」、不可是關鍵字、不可數字開頭。' },
        { id: 'u1-q2', pts: 4, src: '自擬（p.13–14 轉換數據類型）', tags: [TRAP_STR], verify: true, q: '以下程式的輸出是什麼？',
          code: C('a = "10"', 'b = int(a) + 5', 'print(str(b) + a)'),
          options: ['1510', '25', '15 10', 'TypeError'], answer: 'A', why: 'b = 15；str(15) + "10" 是字串連接，得 "1510"。' },
        { id: 'u1-q3', pts: 4, src: '自擬（p.14 活動 4.2、p.24）', verify: true, ask: { error: true }, inputs: '3.5',
          q: '用戶輸入 `3.5`。執行以下程式會出現哪一種錯誤？', code: C('num = int(input())', 'print(num * 2)'),
          options: ['SyntaxError', 'NameError', 'ValueError', '沒有錯誤'], answer: 'C', why: 'input() 得到字串 "3.5"，int() 不能直接轉換帶小數的字串。' },
        { id: 'u1-q4', pts: 4, src: '自擬（p.11–12 變量）', q: '關於 Python 的變量，以下哪些正確？\n(1) 變量名稱區分大小寫\n(2) 運用變量前必須先宣告它的數據類型\n(3) 同一個變量可以先後儲存不同數據類型的值',
          options: ['只有 (1)', '只有 (1) 和 (3)', '只有 (2) 和 (3)', '(1)、(2) 和 (3)'], answer: 'B', why: 'Python 賦值時自動標籤數據類型，不用先宣告（要先宣告的是 C++）。' },
        { id: 'u1-q5', pts: 4, src: '自擬（p.12–14）', tags: [TRAP_INT], verify: true, ask: { expr: 'type(x).__name__' },
          q: '執行以下程式後，x 的數據類型是什麼？', code: C('x = 9.99', 'x = int(x)', 'x = str(x)'),
          options: ['float', 'int', 'str', 'bool'], answer: 'C', why: '變量可以改存另一類型的值；最後一次賦值的是字串 "9"。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyCast', 'pyErr', 'pyPrint'], intro: '隨機生成轉換數據類型、錯誤類型及 print 輸出題目，答案由 Python 計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
