/* 選修C 單元 c4：子程式
 * 教科書 選修C 第 4 章 p.104–147（4.1 子程式、4.2 調用子程式、4.3 定義子程式、4.4 變量範圍、4.5 傳遞參數、4.6 子程式存根）
 * 測試站 4.1–4.4、活動 4.1–4.3、例題 4.1；課題練習 p.142–147
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.144 課題練習第 2(a) 題，第二個 image 表的 image[4,1] 印作 76，與上一個表的 78 不一致（不影響答案；本單元未採用此題）
 * 備註（非錯誤）：p.125 教科書把 `score = score + 1`（沒有 global）描述為「使用了未被宣告的局部變量」；Python 的錯誤類型是 UnboundLocalError（NameError 的一種），本單元照實際錯誤名稱教學。
 * 備註：遞歸（p.130）屬「擴闊視野」，本單元不設題目。
 */
const C = (...ls) => ls.join('\n');
const HOT_FN = { t: 'hot', why: '卷二D 常要求寫出調用子程式的傳回值（DSE 2015 2D Q1、2019 2D Q2、2019 2D Q4）' };
const TRAP_SCOPE = { t: 'trap', why: '子程式內對變量賦值，Python 便把它當作局部變量；要修改全程變量須用 global。' };
const TRAP_PASS = { t: 'trap', why: '列表是可變的物件：在子程式內改動項目會影響實際參數；但把形式參數賦值為另一個列表則不會。' };

const ADD3 = C(
  'def add3(a, b, c):',
  '    s = a + b + c',
  '    return s',
  'n1 = 1',
  'n2 = 2',
  'n3 = 3',
  'summ = add3(n1, n2, n3)',
  'print(summ)',
  'n4 = 4',
  'n5 = 5',
  'summ = add3(summ, n4, n5)',
  'print(summ)');

const ROBOT = C(
  'def FW():',
  '    global x, y',
  '    if d == 1:',
  '        y = y + 1',
  '    elif d == 2:',
  '        x = x + 1',
  '    elif d == 3:',
  '        y = y - 1',
  '    else:',
  '        x = x - 1',
  '',
  'def TR():',
  '    global d',
  '    d = d % 4 + 1',
  '');
const TL3 = C('def TL():', '    for i in range(0, 3):', '        TR()', '');

const ZLIST = 'Z = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig"]';
const COINS_C = C(
  'C = [[0, 0, 1, 0, 2, 2, 0, 0],',
  '     [4, 3, 4, 2, 2, 3, 0, 0],',
  '     [3, 6, 3, 10, 2, 2, 0, 0],',
  '     [0, 4, 5, 6, 7, 3, 3, 0],',
  '     [0, 3, 3, 3, 7, 5, 5, 2],',
  '     [0, 0, 0, 0, 0, 0, 1, 1]]');

module.exports = {
  id: 'c4',
  title: '子程式',
  book: '教科書 選修C 第 4 章 p.104–147',
  key: 'C-c4-hmac-a7e31c94d2',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '子程式、內置函數及函數庫', pages: '教科書 p.106–111',
      learn: [
        { pts: [
          '**模組化**：把大問題拆解成細小而容易處理的模組，逐個擊破。程式內的模組稱為**子程式**（Python 亦稱為**函數**），可以獨立並重複使用。（p.106）',
          '**黑盒**：不用知道函數內裏的算法，只要知道它的輸入和輸出便可以使用，例如 `math.exp(1)` 得到 e ≈ 2.718。（p.107）',
          '子程式的四種類型：沒有輸入沒有輸出（例如列印歡迎訊息）、有輸入沒有輸出、沒有輸入有輸出（例如隨機抽獎）、**有輸入有輸出**（最常見，例如 `sum(a, b)`）。（p.108–109）',
          '常見錯誤：子程式內**列印**的字串是程式的輸出，**不是**子程式的傳回值。（p.108）',
          '調用函數：寫函數名稱及**實際參數**（又稱**變元**）；有傳回值的可以用變量儲存，例如 `a = input()`。（p.109）',
          '內置函數：`abs(x)` 絕對值；`round(x, y)` 四捨五入到 y 位小數。（p.109 表 4.1）',
          '**函數庫**要先匯入（`import math`、`import random`），每個程式匯入一次即可。`math.sqrt(16)` 得 `4.0`；`random.randint(a, b)` 得 a 至 b 的隨機整數（**包括 b**）；`random.random()` 得 0 至 1（不包括 1）的浮點數。（p.110 表 4.2–4.3）',
        ] },
        { sim: { code: C('import math', 'import random', 'print(abs(-10), abs(20))', 'print(round(10/3, 2), round(10/3, 5))', 'print(math.sqrt(16))', 'print(round(math.exp(1), 3))', 'y = random.randint(1, 10)', 'print(1 <= y <= 10)'), open: [] },
          cap: '表 4.1–4.3 的例句。y 每次執行都可能不同，但一定在 1 至 10 之內（試加一行 `print(y)` 再執行幾次）。' },
      ],
      tries: [
        { id: 'c4-s1-t1', pts: 4, src: '教科書 p.109 表 4.1', code: C('y = round(10/3, 2) + abs(-10)', 'print(y)'),
          q: '先估：輸出是什麼？', options: ['13.33', '-6.67', '13.333333333333334', '13'],
          why: 'round(10/3, 2) = 3.33；abs(-10) = 10；3.33 + 10 = 13.33。' },
      ],
      practice: [
        { id: 'c4-s1-p1', type: 'fill', pts: 2, src: '教科書 p.111 測試站 4.1 第 1 題（參考 DSE 2019 2D Q2ai）', q: '李老師用列表 `mark` 儲存 10 個學生的數學分數。寫出兩個子程式的傳回值。',
          code: C('mark = [78, 89, 87, 95, 60, 44, 51, 98, 77, 69]', '', 'def average():', '    total = 0', '    for i in range(0, 10):', '        total = total + mark[i]', '    return total / 10', '', 'def higher(m):', '    count = 0', '    for i in range(0, 10):', '        if mark[i] > m:', '            count = count + 1', '    return count'),
          blanks: [{ label: 'average() 的傳回值', ask: { expr: 'average()' } }, { label: 'higher(90) 的傳回值', ask: { expr: 'higher(90)' } }],
          hint: '總分 748 ÷ 10；高於 90 的只有 95 和 98。（教科書答案：74.8、2）' },
        { id: 'c4-s1-p2', type: 'mc', pts: 1, src: '教科書 p.108', q: '以下哪一個子程式屬於「有輸入、沒有輸出（傳回值）」？',
          options: ['def show(n):\n    print(n * 2)', 'def double(n):\n    return n * 2', 'def hello():\n    print("Hello")', 'def lucky():\n    return "Peter"'], answer: 0,
          hint: '`print` 只是在 Shell 顯示，不是傳回值。' },
        { id: 'c4-s1-p3', type: 'mc', pts: 2, src: '教科書 p.110 表 4.3', q: '執行 `y = random.randint(1, 10)` 後，y 可能是哪些值？',
          options: ['1 至 10 的整數（包括 10）', '1 至 9 的整數', '0 至 10 的整數', '1 至 10 之間的任何小數'], answer: 0,
          hint: 'randint 的範圍包括首尾兩數；這點和 range() 不同。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '定義及調用子程式', pages: '教科書 p.112–116',
      learn: [
        { pts: [
          '寫子程式前，先分析它的**輸入—處理—輸出周期**。（p.112）',
          '用 `def` 定義：`def 子程式名稱(形式參數):`，下面縮排的是**子程式主體**；`return` 後面是**傳回值**。（p.112）',
          '子程式名稱是**識別符**，命名規則與變量相同；同一程式內的識別符不可重複。（p.113）',
          '**形式參數**：多於一個用逗號分隔；沒有參數便把括號留空，例如 `def myFunctionC():`。（p.113）',
          '`return` 表示**結束子程式**並把數據傳回調用的位置；`return value1, value2` 可傳回多於一個值。沒有傳回值便不用寫 `return`。（p.113）',
          '子程式**必須在被調用前定義**，否則出現 `NameError`。（p.115 活動 4.1）',
          '調用時，實際參數的值傳給形式參數（`a ← n1`、`b ← n2`……），執行子程式主體，然後返回調用的位置。可以重複調用。（p.114）',
        ] },
        { sim: { code: ADD3, step: true, open: ['vars', 'trace'] }, cap: 'p.114 調用子程式的序列：按「下一步」看程式怎樣由第 7 行跳到子程式，再返回第 7 行。' },
        { fix: {
          bad: C('total = add3(1, 2, 3)', '', 'def add3(a, b, c):', '    s = a + b + c', '    return s', '', 'print(total)'),
          good: C('def add3(a, b, c):', '    s = a + b + c', '    return s', '', 'total = add3(1, 2, 3)', 'print(total)'),
          why: '活動 4.1（p.115）：第 1 行調用 add3 時它還未定義，出現 `NameError: name \'add3\' is not defined`。子程式必須在被調用前定義。' } },
      ],
      tries: [
        { id: 'c4-s2-t1', pts: 4, src: '教科書 p.116 活動 4.2 第 1 題', code: C('def printsth():', '    print("One")', '    print("Two")', '', 'print("Three")', 'printsth()', 'print("Four")'),
          q: '先估：輸出是什麼？', options: ['Three\nOne\nTwo\nFour', 'One\nTwo\nThree\nFour', 'Three\nFour\nOne\nTwo', 'One\nTwo\nThree\nOne\nTwo\nFour'],
          why: '`def` 只是定義，不會執行主體。程式由 `print("Three")` 開始，調用 printsth() 時才輸出 One、Two。' },
      ],
      practice: [
        { id: 'c4-s2-p1', type: 'fill', pts: 1, src: '教科書 p.116 活動 4.2 第 3 題', q: '寫出程式的輸出。',
          code: C('def birthday():', '    return "Jan", 1', '', 'month, day = birthday()', 'print(day, month)'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: '傳回兩個值，依次存入 month、day；列印時次序對調。' },
        { id: 'c4-s2-p2', type: 'mc', pts: 1, src: '教科書 p.116 活動 4.2 第 4 題', verify: true, q: '以下程式的輸出是什麼？',
          code: C('def isOdd(num):', '    if num % 2 == 0:', '        return False', '    else:', '        return True', '', 'if isOdd(4) == True:', '    print("This is an odd number")', 'else:', '    print("This is an even number")'),
          options: ['This is an even number', 'This is an odd number', 'False', 'True'], answer: 0,
          hint: '4 % 2 == 0，傳回 False。' },
        { id: 'c4-s2-p3', type: 'fill', pts: 1, src: '教科書 p.115 活動 4.1', q: '執行以下程式會出現什麼錯誤？（寫錯誤類型名稱）',
          code: C('total = add3(1, 2, 3)', '', 'def add3(a, b, c):', '    s = a + b + c', '    return s', '', 'print(total)'),
          blanks: [{ label: '錯誤類型', ask: { error: true } }], hint: '子程式必須在被調用前定義。' },
        { id: 'c4-s2-p4', type: 'complete', pts: 2, src: '教科書 p.111 測試站 4.1 第 2 題（參考 DSE 2015 2D Q1ai）', label: '補完程式',
          q: '`functionA(a, b)` 傳回兩數的差（大減小），`functionB(c, d)` 傳回較大的數。例如 functionA(3, 9) 傳回 6，functionB(3, 9) 傳回 9。會用多組數據測試。',
          template: C('def functionA(a, b):', '    if a > b:', '        return ［1］', '    else:', '        return ［2］', '', 'def functionB(c, d):', '    if ［3］:', '        return c', '    return d', '', 'x = int(input())', 'y = int(input())', 'print(functionA(x, y), functionB(x, y))'),
          ref: ['a - b', 'b - a', 'c > d'],
          tests: [{ inputs: '6\n2' }, { inputs: '3\n9' }, { inputs: '5\n10' }, { inputs: '3\n-4' }, { inputs: '7\n7' }],
          hint: '`return` 之後的語句不會執行，所以 functionB 第一個 return 不用配 else。（教科書答案：functionA(5, 10) = 5；functionB(3, -4) = 3）' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '變量範圍：局部變量及全程變量', pages: '教科書 p.124–127',
      learn: [
        { pts: [
          '每個變量都有有效的使用**範圍**，主要分為**局部變量**及**全程變量**。（p.124）',
          '**局部變量**：在子程式中宣告的變量，**形式參數也是局部變量**；只在該子程式內有效，子程式結束後便被捨去。在子程式外使用它會出現 `NameError`。（p.124 活動 4.3）',
          '兩個子程式內同名的局部變量（例如 add 和 sub 都有 result）是**不同的變量**。（p.124）',
          '**全程變量**：在子程式之外宣告的變量，有效範圍涵蓋整個程式，包括所有子程式之內——子程式可以直接**讀取**它。（p.125）',
          '子程式內對變量**賦值**，Python 便視它為局部變量。要**修改**全程變量，須在子程式內寫 `global 變量名稱`。（p.125）',
          '類比：「紅的」行走全港 = 全程變量；「綠的」「藍的」只在新界、大嶼山 = 局部變量。（p.126）',
        ] },
        { sim: { code: C('adj = "fun"', '', 'def fill():', '    print("Python is " + adj)', '', 'fill()', 'print(adj, adj, adj)'), step: true, open: ['vars'] }, cap: 'p.125：子程式 fill 只讀取全程變量 adj，不用 global。' },
        { fix: {
          bad: C('score = 0', '', 'def add1():', '    score = score + 1', '', 'add1()', 'print(score)'),
          good: C('score = 0', '', 'def add1():', '    global score', '    score = score + 1', '', 'add1()', 'print(score)'),
          why: 'p.125：沒有 `global` 時，add1 內的 score 是局部變量，但在賦值前就要讀取它的值，出現 `UnboundLocalError`（一種 NameError）。' } },
      ],
      tries: [
        { id: 'c4-s3-t1', pts: 4, src: '仿教科書 p.124', tags: [TRAP_SCOPE], code: C('result = 100', '', 'def add(a, b):', '    result = a + b', '    print(result)', '', 'add(1, 1)', 'print(result)'),
          q: '先估：輸出是什麼？', options: ['2\n100', '2\n2', '100\n100', '2'],
          why: 'add 內的 result 是局部變量（有賦值、沒有 global），與全程變量 result 是不同的變量。子程式結束後局部變量被捨去，全程變量仍是 100。' },
      ],
      practice: [
        { id: 'c4-s3-p1', type: 'mc', pts: 2, src: '教科書 p.125', tags: [TRAP_SCOPE], verify: true, ask: { error: true }, q: '執行以下程式會出現什麼錯誤？',
          code: C('score = 0', '', 'def add1():', '    score = score + 1', '', 'add1()', 'print(score)'),
          options: ['UnboundLocalError', 'SyntaxError', 'TypeError', '沒有錯誤'], answer: 0,
          hint: '子程式內有 `score = …`，所以 score 是局部變量；右邊讀取它時它還沒有值。' },
        { id: 'c4-s3-p2', type: 'fill', pts: 1, src: '教科書 p.124 活動 4.3', q: '以下程式會出現什麼錯誤？（寫錯誤類型名稱）',
          code: C('def add(a, b):', '    result = a + b', '', 'add(1, 1)', 'print(result)'),
          blanks: [{ label: '錯誤類型', ask: { error: true } }],
          hint: 'result 是 add 的局部變量，子程式結束後已被捨去。（教科書：使用超出有效範圍的變量）' },
        { id: 'c4-s3-p3', type: 'complete', pts: 2, src: '教科書 p.126–127 測試站 4.3（參考 DSE 2018 2D Q3）', label: '補完程式',
          q: '`username` 和 `N`（長度）是全程變量。`hasDigit()` 在用戶名稱包含數字時傳回 True，否則傳回 False。補完傳回值。會用多組數據測試。',
          template: C('username = input()', 'N = len(username)', '', 'def hasDigit():', '    for i in range(0, N):', '        if username[i] >= "0" and username[i] <= "9":', '            return ［1］', '    return ［2］', '', 'def noSpace():', '    for i in range(0, N):', '        if username[i] == " ":', '            return False', '    return True', '', 'print(hasDigit(), noSpace())'),
          ref: ['True', 'False'],
          tests: [{ inputs: 'abc1' }, { inputs: 'abc' }, { inputs: 'ab 1' }, { inputs: '9' }, { inputs: 'a b' }],
          hint: '一找到數字便可以 `return True`（子程式立即結束）；整個循環完結都找不到，才 `return False`。注意第二個 return 不在循環之內。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '傳遞參數', pages: '教科書 p.128–129',
      learn: [
        { pts: [
          '**傳遞參數**：調用子程式時，實際參數傳遞至形式參數。Python 按實際參數的數據類型決定傳遞方法。（p.128）',
          '**不可變的物件**：整數、浮點數、布爾、字串。實際參數的值被**複製**到形式參數；在子程式內修改形式參數**不會影響**實際參數。（p.128）',
          '**可變的物件**：列表。形式參數儲存實際參數的記憶體地址（**指示標**）；在子程式內修改列表的項目**會影響**實際參數。（p.129）',
          'C++ 的類似做法：**按值調用**（call-by-value）、**按址調用**（call-by-reference）。（p.129 擴闊視野）',
          '注意：如果在子程式內把形式參數**賦值為另一個列表**（例如 `x = [0]`），它便指向新列表，不再影響實際參數。',
        ] },
        { table: { head: ['實際參數的數據類型', '物件種類', '修改形式參數會否影響實際參數'], rows: [['int、float、bool、str', '不可變的物件（複製值）', '不會'], ['list', '可變的物件（記憶體地址）', '會（修改項目時）']] }, cap: 'p.141 課文總結' },
        { sim: { code: C('def add(x):', '    print("Inside, before add:", x)', '    x = x + 1', '    print("Inside, after add:", x)', '', 'num = 1', 'print("Outside, before add:", num)', 'add(num)', 'print("Outside, after add:", num)'), step: true, open: ['vars'] }, cap: 'p.128：傳遞整數。把第 3 行改為 `x[0] = x[0] + 1`、第 6 行改為 `num = [1]`，便是 p.129 傳遞列表的例子，再執行比較。' },
      ],
      tries: [
        { id: 'c4-s4-t1', pts: 4, src: '仿教科書 p.129', tags: [TRAP_PASS], code: C('def add_bonus(scores):', '    for i in range(0, len(scores)):', '        scores[i] = scores[i] + 5', '', 'data = [60, 70]', 'add_bonus(data)', 'print(data)'),
          q: '先估：輸出是什麼？', options: ['[65, 75]', '[60, 70]', '[65, 70]', 'None'],
          why: '列表是可變的物件：scores 和 data 指向同一個列表，改動項目便會反映在 data。' },
      ],
      practice: [
        { id: 'c4-s4-p1', type: 'fill', pts: 2, src: '教科書 p.128–129', q: '執行後，num 和 lst 的值分別是什麼？',
          code: C('def add(x):', '    x = x + 1', '', 'def add_list(y):', '    y[0] = y[0] + 1', '', 'num = 1', 'lst = [1]', 'add(num)', 'add_list(lst)'),
          blanks: [{ label: 'num', ask: { var: 'num' } }, { label: 'lst', ask: { var: 'lst' } }],
          hint: '整數：複製值；列表：傳遞記憶體地址。' },
        { id: 'c4-s4-p2', type: 'mc', pts: 2, src: '自擬', tags: [TRAP_PASS], verify: true, q: '以下程式的輸出是什麼？',
          code: C('def reset(a):', '    a = [0, 0]', '', 'data = [5, 6]', 'reset(data)', 'print(data)'),
          options: ['[5, 6]', '[0, 0]', '[0, 0, 5, 6]', 'None'], answer: 0,
          hint: '`a = [0, 0]` 令局部變量 a 指向一個新列表；原本的列表沒有被修改。' },
        { id: 'c4-s4-p3', type: 'mc', pts: 1, src: '教科書 p.128', q: '以下哪一組全是 Python 的**不可變的物件**？',
          options: ['整數、浮點數、布爾、字串', '整數、列表', '字串、列表', '列表、布爾'], answer: 0,
          hint: '列表是可變的物件。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '子程式存根及模組化應用', pages: '教科書 p.131–139',
      learn: [
        { pts: [
          '複雜的程式分拆為多個子程式，主程式調用它們，把功能組合起來。（p.136）',
          '問題：子程式未全部完成時，整個程式不能正確運行；出錯時亦難以得知是哪個子程式有問題。（p.137）',
          '**子程式存根**：以短小、簡單、臨時的程式碼取代子程式的本體（例如 `return 100`），令主程式在子程式未完成時仍可運行。（p.138）',
          '除錯時用存根取代某些子程式，可縮窄範圍，更有效率地找出問題。（p.138）',
          '模組化的好處：**易於理解**、**便於重複使用**、**提升開發效率**（可分工）。（p.142）',
          '子程式可以調用其他子程式：例如無人機只有 FW（前進）和 TR（順時針轉 90°），`TL` 可以寫成「TR 三次」。（p.131–135 測試站 4.4，參考 DSE 2020、2022 2D Q1）',
        ] },
        { sim: { code: C('def calc_bmi(weight, height):', '    return 21          # 子程式存根', '', 'def analyse(bmi):', '    return "正常"       # 子程式存根', '', 'def report(bmi, category):', '    return "Your BMI: " + str(bmi) + " belongs to " + category', '', 'w = float(input("weight: "))', 'h = float(input("height: "))', 'b = calc_bmi(w, h)', 'c = analyse(b)', 'print(report(b, c))'), inputs: '60\n1.7', open: [] },
          cap: 'p.137–138：用存根取代「計算 BMI」和「分析 BMI」，先測試「製作報告」。試把 calc_bmi 改為 `return weight / height ** 2`。' },
        { sim: { code: C('x = 3', 'y = 2', 'd = 1          # 1 北、2 東、3 南、4 西', '', ROBOT, TL3, 'FW()', 'FW()', 'FW()', 'TR()', 'FW()', 'FW()', 'TL()', 'FW()', 'TL()', 'print(x, y, d)'), step: true, open: ['vars'] },
          cap: 'p.131 測試站 4.4：無人機由 (3, 2) 面向北方出發，執行 9 個指令後在 (5, 6) 面向西方（d = 4）。' },
      ],
      tries: [
        { id: 'c4-s5-t1', pts: 4, src: '教科書 p.132 測試站 4.4(a)', code: C('x = 5', 'y = 3', 'd = 1', '', ROBOT, TL3, 'TL()', 'FW()', 'FW()', 'FW()', 'TR()', 'FW()', 'FW()', 'print(x, y, d)'),
          q: '先估：無人機由 (5, 3) 面向北方出發。輸出是什麼？', options: ['2 5 1', '8 5 1', '2 5 4', '5 6 2'],
          why: 'TL 後面向西，前進 3 格到 (2, 3)；TR 後面向北，前進 2 格到 (2, 5)。（教科書答案：(2, 5)，面向北方）' },
      ],
      practice: [
        { id: 'c4-s5-p1', type: 'complete', pts: 3, src: '教科書 p.132–133 測試站 4.4(b)、(c)', label: '補完程式',
          q: '補完子程式 `TL`（用 TR）及 `SQ(N)`（以長度 N 的正方形路徑飛行，最後回到起點及原來方向）。SQ 每飛完一條邊便輸出位置及方向。主程式由 (1, 1) 面向北方出發，執行 SQ(N)、TL()、FW()。會用多組數據測試。',
          template: C('x = 1', 'y = 1', 'd = 1', '', ROBOT, 'def TL():', '    for i in range(0, ［1］):', '        TR()', '', 'def SQ(N):', '    for i in range(0, ［2］):', '        for j in range(0, ［3］):', '            FW()', '        TR()', '        print(x, y, d)', '', 'N = int(input())', 'SQ(N)', 'print(x, y, d)', 'TL()', 'FW()', 'print(x, y, d)'),
          ref: ['3', '4', 'N'],
          tests: [{ inputs: '3' }, { inputs: '1' }, { inputs: '5' }, { inputs: '0' }],
          hint: '逆時針 90° = 順時針 270° = TR 三次。正方形有 4 邊，每邊 FW N 次，然後 TR。（教科書答案：1 至 3；i 由 1 至 4、j 由 1 至 N）' },
        { id: 'c4-s5-p2', type: 'mc', pts: 2, src: '教科書 p.137–138', q: '以下哪一項**不是**使用子程式存根的原因？',
          options: ['令主程式在部分子程式未完成時仍可運行', '排除某些子程式，縮窄除錯範圍', '令最終程式運行得較快', '可以先測試其中一個子程式'], answer: 2,
          hint: '存根只是臨時的程式碼，完成後要換回真正的子程式。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫子程式', pages: '教科書 p.117–119、p.145–146',
      intro: '每題的子程式已用**子程式存根**佔位（只傳回固定值），主程式已寫好。把存根換成真正的子程式，先按「▶ 執行」自己測試，再按「提交評核」。',
      tasks: [
        { id: 'c4-w1', tier: '必做', pts: 12, title: '十二生肖 zodiac(year)', src: '教科書 p.145 課題練習第 3 題',
          q: '列表 `Z` 依次儲存十二生肖。完成子程式 `zodiac(year)`，傳回該年份所屬的生肖。\n提示：先將年份減去 4，再除以 12；餘數是 0 便是 "rat"，餘數是 1 便是 "ox"，如此類推。\n例如輸入 `2023`，輸出 `rabbit`。',
          starter: C(ZLIST, '', 'def zodiac(year):', '    return "rat"        # 子程式存根', '', 'year = int(input())', 'print(zodiac(year))'),
          ref: C(ZLIST, '', 'def zodiac(year):', '    remainder = (year - 4) % 12', '    return Z[remainder]', '', 'year = int(input())', 'print(zodiac(year))'),
          tests: [{ inputs: '2023' }, { inputs: '2013' }, { inputs: '2020' }, { inputs: '2019' }, { inputs: '2024' }],
          rules: [{ must: 'def zodiac(', msg: '要定義子程式 zodiac(year)' }, { must: 'return', msg: '子程式要用 return 傳回生肖' }],
          hint: '`remainder = (year - 4) % 12`，然後 `return Z[remainder]`。教科書的陣列由 1 開始，所以寫 `Z[remainder + 1]`；Python 列表由 0 開始，不用加 1。Z 是全程變量，可以直接讀取。' },
        { id: 'c4-w2', tier: '進階', pts: 13, title: '十六進制轉十進制', src: '教科書 p.146 課題練習第 4 題',
          q: '完成兩個子程式：\n• `F1(c)`：把一個字元 `c`（"0"–"9" 或 "A"–"F"）轉換為 0 至 15 的數字並傳回，例如 F1("D") 傳回 13。\n• `hex2dec(h)`：把十六進制字串 h 轉換為十進制數字並傳回，要**調用 F1**。\n例如輸入 `9B1`，輸出 `2481`。（不可以用 `int(h, 16)`。）',
          starter: C('def F1(c):', '    return 0            # 子程式存根', '', 'def hex2dec(h):', '    return 0            # 子程式存根', '', 'h = input()', 'print(hex2dec(h))'),
          ref: C('def F1(c):', '    if c >= "0" and c <= "9":', '        return int(c)', '    return ord(c) - ord("A") + 10', '', 'def hex2dec(h):', '    dec = 0', '    length = len(h)', '    for i in range(0, length):', '        digit = length - 1 - i', '        dec = dec + F1(h[i]) * (16 ** digit)', '    return dec', '', 'h = input()', 'print(hex2dec(h))'),
          tests: [{ inputs: '9B1' }, { inputs: 'FF' }, { inputs: '0' }, { inputs: 'A' }, { inputs: '1000' }, { inputs: '7E3' }],
          rules: [{ mustNot: ', 16)', msg: '不可以用 int(h, 16)' }, { must: 'def F1(', msg: '要定義子程式 F1(c)' }, { must: 'def hex2dec(', msg: '要定義子程式 hex2dec(h)' }],
          hint: 'F1：數字字元用 `int(c)`；字母用 `ord(c) - ord("A") + 10`。hex2dec（教科書答案）：`digit = length - 1 - i`，`dec = dec + F1(h[i]) * (16 ** digit)`。dec、length、digit 都是局部變量。' },
        { id: 'c4-w3', tier: '挑戰', pts: 10, title: '藏寶地圖 coins(i, j)', src: '教科書 p.117–119 例題 4.1（參考 DSE 2019 2D Q4）',
          q: '二維列表 `C` 儲存 6 × 8 藏寶地圖每格的金幣數量。教科書的位置 (i, j) 由 **1** 開始（第 i 列、第 j 欄），對應 Python 的 `C[i - 1][j - 1]`。\n完成子程式 `coins(i, j)`，傳回位置 (i − 1, j − 1) 至 (i + 1, j + 1) 這 3 × 3 區域的金幣總和；**超出地圖的格不計算**（例題 4.1(d)）。\n例如輸入 `5` 和 `2`，輸出 `15`；輸入 `1` 和 `7`，輸出 `5`。',
          starter: C(COINS_C, '', 'def coins(i, j):', '    return 0            # 子程式存根', '', 'i = int(input())', 'j = int(input())', 'print(coins(i, j))'),
          ref: C(COINS_C, '', 'def coins(i, j):', '    total = 0', '    for x in range(1, 4):', '        for y in range(1, 4):', '            r = i - 2 + x', '            c = j - 2 + y', '            if 1 <= r <= 6 and 1 <= c <= 8:', '                total = total + C[r - 1][c - 1]', '    return total', '', 'i = int(input())', 'j = int(input())', 'print(coins(i, j))'),
          tests: [{ inputs: '5\n2' }, { inputs: '4\n4' }, { inputs: '1\n7' }, { inputs: '6\n8' }, { inputs: '1\n1' }, { inputs: '3\n4' }],
          hint: '教科書答案：x、y 由 1 至 3，位置是 `[i-2+x, j-2+y]`；先檢查 `1 <= i-2+x <= 6 and 1 <= j-2+y <= 8`。Python 讀取時兩個索引都要減 1。注意：Python 的負數索引不會出錯，但會讀錯格，所以一定要檢查範圍。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.112–138',
      items: [
        { id: 'c4-q1', pts: 4, src: '自擬（DSE 卷二D 風格）', tags: [HOT_FN], verify: true,
          q: '以下程式的輸出是什麼？', code: C('def f(a, b):', '    a = a + b', '    b = a - b', '    return a * b', '', 'x = 2', 'y = 3', 'print(f(y, x), x, y)'),
          options: ['15 2 3', '10 2 3', '15 5 3', '10 5 2'], answer: 'A',
          why: '實際參數按次序傳遞：a = y = 3、b = x = 2。a = 5，b = 3，傳回 15。x、y 是整數（不可變），不受影響。' },
        { id: 'c4-q2', pts: 4, src: '教科書 p.108 常見錯誤', tags: [{ t: 'trap', why: '列印不等於傳回；沒有 return 的子程式傳回 None。' }], verify: true,
          q: '以下程式的輸出是什麼？', code: C('def double(x):', '    print(x * 2)', '', 'y = double(4)', 'print(y)'),
          options: ['8\nNone', '8\n8', '8', 'None'], answer: 'A',
          why: 'double 只列印 8，沒有 return，所以傳回值是 None，y 便是 None。' },
        { id: 'c4-q3', pts: 4, src: '教科書 p.124–128', tags: [TRAP_SCOPE], verify: true,
          q: '以下程式的輸出是什麼？', code: C('x = 5', '', 'def f():', '    global x', '    x = x * 2', '', 'def g(x):', '    x = x + 1', '    return x', '', 'f()', 'y = g(x)', 'print(x, y)'),
          options: ['10 11', '5 6', '10 10', '11 11'], answer: 'A',
          why: 'f 用 global，把全程變量 x 改為 10。g 的形式參數 x 是局部變量，加 1 後傳回 11，全程變量 x 仍是 10。' },
        { id: 'c4-q4', pts: 4, src: '教科書 p.129', tags: [TRAP_PASS], verify: true,
          q: '以下程式的輸出是什麼？', code: C('def h(a):', '    a[0] = a[0] + len(a)', '    a = [0]', '    a[0] = 9', '', 'nums = [1, 2]', 'h(nums)', 'print(nums)'),
          options: ['[3, 2]', '[9]', '[1, 2]', '[9, 2]'], answer: 'A',
          why: '第 2 行修改的是 nums 指向的列表（1 + 2 = 3）；第 3 行之後 a 指向新列表，再修改不影響 nums。' },
        { id: 'c4-q5', pts: 4, src: '教科書 p.137–142',
          q: '一個程式由主程式及子程式 A 至 E 組成。子程式 C 未完成，其他人想先測試子程式 D。最合適的做法是：',
          options: ['等所有子程式完成後才一起測試', '為子程式 C 寫一個子程式存根，例如只傳回一個固定值', '把子程式 C 的程式碼複製到主程式內', '把所有子程式合併成一個大的子程式'], answer: 'B',
          why: '子程式存根令主程式在子程式未完成時仍可運行，亦可縮窄除錯範圍。合併子程式會失去模組化的好處。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyFunc', 'pyErr', 'pyList'], intro: '隨機生成子程式（傳回值、局部與全程變量）、錯誤類型及列表的估輸出題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
