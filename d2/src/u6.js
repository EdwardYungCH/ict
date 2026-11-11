/* 單元 6：列表算法：檢索、點算、最大最小、排序檢查、加入刪除
 * 教科書 D2 第 5 章 5.2B–E（書頁 p.92–114）、5.4 綜合編程 Level 1–2（p.133–143）；課題練習 p.155–156 選擇題 5–9
 * // 教科書疑似錯誤：p.93、p.94 例題 5.2、5.3 程式輸出文字印作「Congratulation」（英文一般寫 Congratulations）；本單元照錄書中文字。
 * // 教科書疑似錯誤：p.99 提示說比較大小的算法「只適用於整數及浮點數」；Python 其實也可以比較字串（按字符編碼），可能是刻意簡化。
 * // 教科書疑似錯誤：p.103、p.104、p.106 三處「試想想」沒有印答案。
 * // 教科書疑似錯誤：p.105 例題 5.5(c) `print("The following student(s) got the highest mark:"` 缺右括號，照抄會出 SyntaxError。
 * // 教科書疑似錯誤：p.110 刪除項目的偽代碼用 `the_list[k] = the_list[k+1]`，其他偽代碼用「←」；程式只把項目左移、`N = N - 1`，Python 列表本身並沒有縮短（最後一項重複），例題 5.7 才以 "" 覆蓋最後一項。
 * // 教科書疑似錯誤：p.114 擴闊視野 `print(min(the_list)` 缺右括號；insert／pop 的輸出空格不一致，Python 實際輸出 `[12, 8, 1234, -6, 40, 23]`、`[12, 8, 40, 23]`。
 * // 教科書疑似錯誤：p.134 自助點餐機範例輸出「Checkout: 125.8」；實際執行因浮點數誤差輸出 125.80000000000001。
 * // 教科書疑似錯誤：p.135–136 第 3 題 (a)(b) 紅字答案多行缺縮排，照抄會出 IndentationError。
 * // 教科書疑似錯誤：p.137 第 4 題 (a) 答案寫 `P[3] - P[2]`，題目列表名稱是 `distance`。
 * // 教科書疑似錯誤：p.140 試想想用 `list[0]`，全題列表名稱是 `the_list`。
 * // 教科書疑似錯誤：p.156 課題練習 選擇題 8 題幹用小寫 x，程式用大寫 X。
 * 所有答案在 build 時由 CPython 計算／核對。
 */
const C = (...ls) => ls.join('\n');
const TRAP0 = { t: 'trap', why: '偽代碼「設 i 由 0 至 N-1」對應 Python `range(0, N)`；學生常寫成 range(0, N-1) 漏了最後一項，或照搬偽代碼由 1 開始。' };
const HOT_ALG = { t: 'hot', why: 'DSE 卷一經常考陣列的檢索、點算、最大最小及加入刪除算法（空運行或填充）。' };
const MARK10 = '[87, 45, 79, 100, 50, 35, 90, 100, 60, 80]';
const MARK55 = '[87, 85, 79, 100, 50, 35, 90, 100, 60, 80]';
const NAMES = '["Mary", "Peter", "Smith", "Yvonne", "Yee"]';
const NOS = '["9319 1919", "9836 1234", "6456 3210", "2715 5432", "5432 9876"]';

module.exports = {
  id: 'u6',
  title: '列表算法：檢索、點算、最大最小、排序檢查、加入刪除',
  book: '教科書 D2 第 5 章 p.92–114、p.133–143（另有 p.155–156 課題練習）',
  key: 'D2-u6-hmac-e223164a7f',
  theory: false,
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '線性檢索：for 與 while', pages: '教科書 p.92–98',
      learn: [
        { pts: [
          '**線性檢索（linear search）**：由第一項開始，逐一檢查列表項目是否等於目標值。（p.92）',
          '用 **for 循環**：先 `found = False`，找到便 `found = True`，最後輸出 found。偽代碼「設 i 由 0 至 N-1」→ Python `range(0, N)`。（p.92）',
          'found 用**布爾**數據類型，因為結果只有「找到」或「找不到」。Python 必須寫 `True`／`False`（大楷 T、F）。（p.92 提示、試想想）',
          '`input()` 取得的是**字串**；要找整數便要 `int(input())`。編號如 `"002"` 有前置零，所以用字串儲存，不可轉成整數。（p.92–93）',
          '找出**第一個**目標值的索引：用 **while 循環**，條件 `i < N and found == False`，找到便停止，不用再查下去（省時間）。找不到時 index 保持 **-1**。（p.94）',
          '兩個「排位相通」的列表（例如 `contact_name` 與 `contact_no`）：在第一個列表找到索引 pos，用同一個 pos 讀取第二個列表。（p.96、p.98）',
        ] },
        { sim: { code: C('rank = ["6012", "0122", "1122", "7201", "5402"]', 'runner_num = input("Please input your number: ")', 'index = -1', 'i = 0', 'while i < 5 and index == -1:', '    if runner_num == rank[i]:', '        index = i', '    i = i + 1', 'if index != -1:', '    print("Congratulation! Your rank is", index+1)', 'else:', '    print("Work hard next year.")'), inputs: '0122', open: ['vars'], step: true }, cap: '例題 5.3(b)（p.95）：找到便停止。排名 = 索引 + 1（因為索引由 0 開始）。' },
        { warn: '**常見錯誤**：顯示排名時寫 `index` 而不是 `index+1`；或把 while 條件寫成 `i <= 5`，找不到時會讀取 `rank[5]` → IndexError。' },
      ],
      tries: [
        { id: 'u6-s1-t1', pts: 4, src: '教科書 p.94 例題 5.3(a)', code: C('rank = ["6012", "0122", "1122", "7201", "5402"]', 'runner_num = input("Please input your number: ")', 'found = False', 'i = 0', 'while i < 5 and found == False:', '    if runner_num == rank[i]:', '        found = True', '    i = i + 1', 'print(i)'), inputs: '1122', ask: { var: 'i' },
          q: '先估：輸入 1122，最後輸出的 i 是多少？', options: ['2', '3', '5', '4'],
          why: '1122 在索引 2；找到後 i 仍會加 1 變成 3，然後條件 found == False 不成立，離開循環。' },
      ],
      practice: [
        { id: 'u6-s1-p1', type: 'complete', pts: 2, src: '教科書 p.93 例題 5.2', label: '補完程式',
          q: '查看同學是否得到獎學金。會用多組數據測試。',
          template: C('scholarship = ["002", "134", "192"]', 'application_num = input("Please input your number: ")', 'found = False', 'for i in range(［1］, ［2］):', '    if ［3］:', '        found = True', 'if ［4］:', '    print("Congratulation!")', 'else:', '    print("Sorry, you are not on the list.")'),
          ref: ['0', '3', 'application_num == scholarship[i]', 'found == True'], tests: [{ inputs: '192' }, { inputs: '204' }, { inputs: '002' }, { inputs: '2' }],
          hint: '三個項目，索引 0–2，所以 range(0, 3)。' },
        { id: 'u6-s1-p2', type: 'mc', pts: 1, src: '教科書 p.93 想像', q: '假設用 `int(input())` 讀取用戶輸入的 `002`（即 `int("002")`）。輸出是什麼？', code: C('scholarship = ["002", "134", "192"]', 'num = int("002")', 'print(num in scholarship)'),
          options: ['True', 'False', '002', '出現 ValueError'], answer: 1, verify: true,
          hint: 'int("002") 得 2（前置零消失），整數 2 不等於字串 "002"。所以編號要用字串。' },
        { id: 'u6-s1-p3', type: 'complete', pts: 2, src: '教科書 p.98 測試站 5.3', label: '補完程式',
          q: '電話簿：輸入名字，顯示電話號碼。會用多組數據測試。',
          template: C('contact_name = ' + NAMES, 'contact_no = ' + NOS, 'search_name = input("Search contact: ")', 'pos = -1', 'i = 0', 'while i < 5 and ［1］:', '    if search_name == contact_name[i]:', '        ［2］', '    i = i + 1', 'if ［3］:', '    print("The phone no of", search_name, "is", ［4］)', 'else:', '    print("Not found in the contact list.")'),
          ref: ['pos == -1', 'pos = i', 'pos != -1', 'contact_no[pos]'], tests: [{ inputs: 'Yvonne' }, { inputs: 'Tony' }, { inputs: 'Mary' }, { inputs: 'Yee' }],
          hint: '用 pos 同時做「旗標」和記錄位置：-1 代表未找到。' },
        { id: 'u6-s1-p4', type: 'fill', pts: 1, src: '教科書 p.97 例題 5.3(d)', q: '7201 號之後是否緊接 5402 號？寫出輸出。',
          code: C('rank = ["6012", "0122", "1122", "7201", "5402"]', 'search_num1 = "7201"', 'search_num2 = "5402"', 'pair = False', 'for i in range(0, 4):', '    if rank[i] == search_num1 and rank[i+1] == search_num2:', '        pair = True', 'if pair == True:', '    print("This pair is found!")', 'else:', '    print("This pair is not found!")'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: '注意 range(0, 4)：用到 rank[i+1]，i 最大只可以是 3。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '點算項目', pages: '教科書 p.99–102',
      learn: [
        { pts: [
          '**點算**：`count = 0`，逐一檢查，符合條件便 `count = count + 1`。（p.99）',
          '條件可以是「大於某數」「小於某數」「等於某值」，例如 100 分的人數、不及格人數。（p.99–100）',
          '要列出**學號**而不是索引：學號 = 索引 + 1，即 `print(i+1)`。（p.100 例題 5.4(c)）',
          '挑戰：**最長連勝**——遇到 "W" 便 `count + 1`，並和最高記錄比較；遇到 "L" 便把 count 歸零。（p.102 測試站 5.4 第 2 題）',
        ] },
        { sim: { code: C('mark = ' + MARK10, 'passing_mark = 50', 'fail = 0', 'for i in range(0, 10):', '    if mark[i] < passing_mark:', '        fail = fail + 1', '        print(i+1)', 'print(fail)'), open: ['vars'], step: true }, cap: '例題 5.4(b)(c)（p.100）：數算並列出不及格同學的學號。50 分剛好及格，`<` 不包括 50。' },
      ],
      tries: [
        { id: 'u6-s2-t1', pts: 4, src: '教科書 p.101 測試站 5.4 第 1(b) 題', code: C('rank = [11, 20, 5, 2, 3, 1, 4, 6, 2, 5]', 'top3 = 0', 'for i in range(0, 10):', '    if rank[i] <= 3:', '        top3 = top3 + 1', 'print(top3)'),
          q: '先估：小美取得頭三名的次數是多少？', options: ['3', '4', '5', '2'],
          why: '2、3、1、2 共 4 次。注意要用 `<= 3`。' },
      ],
      practice: [
        { id: 'u6-s2-p1', type: 'complete', pts: 2, src: '教科書 p.100 例題 5.4(a)', label: '補完程式',
          q: '找出有多少位同學取得 100 分。',
          template: C('mark = ' + MARK10, 'search_mark = 100', 'found = ［1］', 'for i in range(0, 10):', '    if ［2］:', '        found = ［3］', 'print(found)'),
          ref: ['0', 'mark[i] == search_mark', 'found + 1'], tests: [{ inputs: '' }], hint: '這裏 found 是計數器（整數），不是布爾值。' },
        { id: 'u6-s2-p2', type: 'mc', pts: 1, src: '教科書 p.100 例題 5.4(c)', tags: [TRAP0],
          q: '要列印不及格同學的**學號**（mark[0] 是 1 號同學），空格應填什麼？', code: C('for i in range(0, 10):', '    if mark[i] < passing_mark:', '        print(〔空格〕)'),
          options: ['i', 'i+1', 'i-1', 'mark[i]'], answer: 1, hint: '學號比索引大 1。' },
        { id: 'u6-s2-p3', type: 'trace', pts: 2, src: '教科書 p.102 測試站 5.4 第 2 題（縮短數據）', q: '空運行最長連勝程式，完成追蹤表（每次循環一行）。',
          code: C('winlose = ["W", "L", "W", "W", "L", "W"]', 'winstreak = 0', 'count = 0', 'for i in range(0, len(winlose)):', '    if winlose[i] == "W":', '        count = count + 1', '        if count > winstreak:', '            winstreak = count', '    if winlose[i] == "L":', '        count = 0', 'print("The longest winning streak is", winstreak)'),
          spec: { mode: 'iter', cols: ['i', 'count', 'winstreak'], out: true }, hint: 'count 是「目前」連勝；winstreak 是「最高」連勝。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '找出最大或最小的值', pages: '教科書 p.103–106',
      learn: [
        { pts: [
          '方法：用變量**暫存第一項** `largest = the_list[0]`，再由索引 **1** 開始逐一比較；發現較大的便更新。（p.103）',
          '為什麼由 1 開始？第 0 項已經放進 largest，和自己比較沒有意義（由 0 開始也不會出錯，只是多比較一次）。',
          '不要把 largest 設為 0：如果全部都是負數，答案便會錯。',
          '同一個循環可以同時找最大和最小：寫兩個 `if`。（p.104 例題 5.5(a)）',
          '要知道**是誰**：同時記下索引 `lowest_no = i`，最後輸出 `lowest_no+1`。（p.104 例題 5.5(b)）',
          '可能有多人同分：先找出最高分，再用第二個循環列出所有 `mark[i] == highest_mark` 的人。（p.105 例題 5.5(c)）',
        ] },
        { sim: { code: C('mark = ' + MARK55, 'highest_mark = mark[0]', 'for i in range(1, 10):', '    if mark[i] > highest_mark:', '        highest_mark = mark[i]', 'print("The following student(s) got the highest mark:")', 'for i in range(0, 10):', '    if mark[i] == highest_mark:', '        print(i+1)'), open: ['vars'], step: true }, cap: '例題 5.5(a)(c)（p.104–105）。書中 print 一行缺右括號，這裏已改正。' },
      ],
      tries: [
        { id: 'u6-s3-t1', pts: 4, src: '教科書 p.104 例題 5.5(b)', code: C('mark = ' + MARK55, 'lowest_mark = mark[0]', 'lowest_no = 0', 'for i in range(1, 10):', '    if mark[i] < lowest_mark:', '        lowest_mark = mark[i]', '        lowest_no = i', 'print("The lowest mark is student no.", lowest_no+1)'),
          q: '先估：輸出是什麼？', options: ['The lowest mark is student no. 5', 'The lowest mark is student no. 6', 'The lowest mark is student no. 35', 'The lowest mark is student no. 1'],
          why: '最低分 35 在索引 5，學號是 5 + 1 = 6。' },
      ],
      practice: [
        { id: 'u6-s3-p1', type: 'complete', pts: 2, src: '教科書 p.106 測試站 5.5(b)', label: '補完程式',
          q: '找出最低價和最高價，計算省了多少錢。',
          template: C('price = [19.9, 24.9, 19.4, 20.9, 23]', 'lowest = price[0]', 'highest = price[0]', 'for i in range(0, 5):', '    if ［1］:', '        lowest = price[i]', '    if ［2］:', '        ［3］', 'difference = ［4］', 'print("You save $", difference)'),
          ref: ['price[i] < lowest', 'price[i] > highest', 'highest = price[i]', 'highest-lowest'], tests: [{ inputs: '' }],
          hint: '兩個獨立的 if；最後 最高價 − 最低價。' },
        { id: 'u6-s3-p2', type: 'mc', pts: 1, src: '教科書 p.103（自擬）', q: '以下程式想找出最大值，但把 largest 設為 0。輸出是什麼？',
          code: C('the_list = [-8, -3, -12, -5]', 'largest = 0', 'for i in range(0, 4):', '    if the_list[i] > largest:', '        largest = the_list[i]', 'print(largest)'),
          options: ['-3', '0', '-12', '-8'], answer: 1, verify: true, hint: '沒有一項大於 0，所以 largest 從未更新 → 邏輯錯誤。應寫 `largest = the_list[0]`。' },
        { id: 'u6-s3-p3', type: 'fill', pts: 2, src: '教科書 p.137 綜合編程第 4(b) 題', q: '找出哪輛汽車與前車的距離最短。寫出輸出。',
          code: C('distance = [3, 5, 8, 12, 16]', 'space = [0, 0, 0, 0]', 'for i in range(0, 4):', '    space[i] = distance[i+1] - distance[i]', 'shortest = space[0]', 'car = 0', 'for i in range(0, 4):', '    if space[i] < shortest:', '        shortest = space[i]', '        car = i', 'print(space)', 'print(car+2)'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: 'space[i] 是第 i+2 輛車與前車的距離。最短距離有兩個時，用 `<` 只會記下第一個。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '檢查是否按次序排列；旗標', pages: '教科書 p.107–109',
      learn: [
        { pts: [
          '檢查**由小至大**：`sorted_list = True`，比較每對相鄰項目，若 `the_list[k] > the_list[k+1]` 便設為 False。（p.107）',
          '相鄰比較共 **N − 1** 次：偽代碼「設 k 由 0 至 N-2」→ Python `range(0, N-1)`。寫 `range(0, N)` 會在最後讀取 `the_list[N]` → IndexError。',
          '檢查**由大至小**：條件改為 `the_list[k+1] > the_list[k]`。（p.107 例題 5.6）',
          '**旗標（flag）**：用來監視程式狀態的變量，例如 found、sorted_list；答案只有「是／否」，用布爾數據類型。（p.108）',
          '可同時用兩個旗標檢查升序和降序。（p.109 測試站 5.6 第 2 題）',
        ] },
        { sim: { code: C('winning_num = [1, 6, 7, 5, 4, 8, 2, 3]', 'de_sorted_list = True', 'as_sorted_list = True', 'for k in range(0, 7):', '    if winning_num[k+1] > winning_num[k]:', '        de_sorted_list = False', '    if winning_num[k+1] < winning_num[k]:', '        as_sorted_list = False', 'if de_sorted_list == True:', '    print("The list is descending sorted.")', 'elif as_sorted_list == True:', '    print("The list is ascending sorted.")', 'else:', '    print("The list is unsorted.")'), open: ['vars'], step: true }, cap: '測試站 5.6 第 2 題（p.109）：兩個旗標。試把列表改成 [8, 7, 6, 5, 4, 3, 2, 1] 再執行。' },
      ],
      tries: [
        { id: 'u6-s4-t1', pts: 4, src: '教科書 p.107 例題 5.6（改動數據）', code: C('score = [99.8, 99.5, 98, 97.9, 97.6, 95.3, 95.2, 93.4, 92.1, 90.5]', 'score[6] = 96', 'sorted_list = True', 'for k in range(0, 9):', '    if score[k+1] > score[k]:', '        sorted_list = False', 'print(sorted_list)'),
          q: '先估：玩家分數更新後（score[6] 改為 96），輸出是什麼？', options: ['True', 'False', '96', '出現 IndexError'],
          why: 'score[6] = 96 大於 score[5] = 95.3，排行榜不再由高至低，旗標變成 False。' },
      ],
      practice: [
        { id: 'u6-s4-p1', type: 'complete', pts: 2, src: '教科書 p.108 測試站 5.6 第 1 題', label: '補完程式',
          q: '覆核中獎編號是否由小至大排列。',
          template: C('winning_num = [561, 918, 1925, 2228, 2816, 3069, 4416, 8147]', 'sorted_list = True', 'for k in range(0, ［1］):', '    if ［2］:', '        sorted_list = False', 'print(sorted_list)'),
          ref: ['7', 'winning_num[k+1] < winning_num[k]'], tests: [{ inputs: '' }], hint: '8 個項目，相鄰比較 7 次。' },
        { id: 'u6-s4-p2', type: 'mc', pts: 1, src: '教科書 p.107（自擬）', tags: [TRAP0], q: '以下程式執行時會怎樣？',
          code: C('the_list = [1, 3, 5, 7]', 'sorted_list = True', 'for k in range(0, 4):', '    if the_list[k] > the_list[k+1]:', '        sorted_list = False', 'print(sorted_list)'), ask: { error: true },
          options: ['沒有錯誤', 'IndexError', 'TypeError', 'NameError'], answer: 1, verify: true, hint: 'k = 3 時讀取 the_list[4]。應寫 range(0, 3)，即 range(0, N-1)。' },
        { id: 'u6-s4-p3', type: 'mc', pts: 1, src: '教科書 p.108', q: '以下哪一個變量最適合稱為「旗標」？',
          options: ['total（總和）', 'found（是否找到）', 'i（循環計數器）', 'mark（成績列表）'], answer: 1, hint: '旗標記錄「是／否」的狀態。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '刪除、加入及調動項目', pages: '教科書 p.110–114',
      learn: [
        { pts: [
          '**刪除索引 P 的項目**：由 P 開始，把後一項逐一**向左移**：`for k in range(P, N-1):` → `the_list[k] = the_list[k+1]`；最後一項可設為 0 或 ""。（p.110）',
          '**在索引 P 加入 new_data**：先 `the_list = the_list + [0]` 加長一格，再由**最後**開始把項目逐一**向右移**：`for k in range(N-1, P, -1):` → `the_list[k] = the_list[k-1]`；最後 `the_list[P] = new_data`。（p.111）',
          '加入時一定要**由後至前**移動，否則前面的項目會覆蓋後面的項目。',
          '**調到最前**：先 `temp = the_list[P]` 暫存，再由 P 下至 1 把項目向右移，最後 `the_list[0] = temp`。（p.113）',
          '擴闊視野：內置函數 `sum()`、`.index()`、`max()`、`min()`、`.insert(P, x)`、`.pop(P)` 可以一句做到；但 DSE 考的是**算法**，要懂得自己用循環寫。（p.114）',
        ] },
        { table: { head: ['操作', '循環', '方向'], rows: [['刪除索引 P', 'range(P, N-1)，the_list[k] = the_list[k+1]', '向左移，由前至後'], ['加入到索引 P', 'range(N-1, P, -1)，the_list[k] = the_list[k-1]', '向右移，由後至前'], ['P 調到最前', 'range(P, 0, -1)，the_list[k] = the_list[k-1]', '向右移，由後至前']] }, cap: '三個算法比較（p.110–113）' },
        { sim: { code: C('wait = [3001, 4001, 5001, 2001, 2002, 3002, 2003, 4002, 2004, 2005]', 'wait = wait + [0]', 'for k in range(10, 4, -1):', '    wait[k] = wait[k-1]', 'wait[4] = 9001', 'print(wait)'), open: ['vars'], step: true }, cap: '測試站 5.7(a)（p.112）：把 VIP 號碼 9001 加入索引 4。' },
        { code: C('the_list = [12, 8, -6, 40, 23]', 'print(sum(the_list))', 'print(the_list.index(40))', 'print(max(the_list))', 'print(min(the_list))', 'the_list.insert(2, 1234)', 'print(the_list)', 'the_list.pop(2)', 'print(the_list)'), cap: '擴闊視野的內置函數（p.114；書中 `print(min(the_list)` 缺右括號，這裏已改正）。輸出：77、3、40、-6、[12, 8, 1234, -6, 40, 23]、[12, 8, -6, 40, 23]。' },
      ],
      tries: [
        { id: 'u6-s5-t1', pts: 4, src: '教科書 p.113 例題 5.8', code: C('show = ["2A", "3B", "1C", "4E", "5A"]', 'temp = show[3]', 'for k in range(3, 0, -1):', '    show[k] = show[k-1]', 'show[0] = temp', 'print(show)'),
          q: '先估：4E 班調到最前後，輸出是什麼？', options: ["['4E', '2A', '3B', '1C', '5A']", "['4E', '3B', '1C', '2A', '5A']", "['2A', '2A', '2A', '2A', '5A']", "['4E', '2A', '2A', '2A', '5A']"],
          why: 'k = 3、2、1：1C、3B、2A 依次右移一格，再把暫存的 4E 放到索引 0。print 列表時字串用單引號。' },
      ],
      practice: [
        { id: 'u6-s5-p1', type: 'complete', pts: 2, src: '教科書 p.110 例題 5.7', label: '補完程式',
          q: 'Paul（索引 1）退出編程班，把他從名單中刪除。',
          template: C('eca_code = ["Tony", "Paul", "Kelly", "Wendy", "Jack"]', 'for k in ［1］:', '    eca_code[［2］] = eca_code[［3］]', 'eca_code[［4］] = ""', 'print(eca_code)'),
          ref: ['range(1, 4)', 'k', 'k+1', '4'], tests: [{ inputs: '' }], check: { out: true, vars: ['eca_code'] },
          hint: 'k 由 1 至 3，每項取後一項的值；最後一項清空。' },
        { id: 'u6-s5-p2', type: 'fill', pts: 2, src: '教科書 p.112 測試站 5.7(b)', q: '把 5001（索引 2）刪除。寫出最後的 `wait`。',
          code: C('wait = [3001, 4001, 5001, 2001, 9001, 2002, 3002, 2003, 4002, 2004, 2005]', 'for k in range(2, 10):', '    wait[k] = wait[k+1]', 'wait[10] = 0'),
          blanks: [{ label: 'wait', ask: { var: 'wait' } }], hint: '索引 2 之後的項目全部左移一格，最後一項設為 0。' },
        { id: 'u6-s5-p3', type: 'mc', pts: 1, src: '教科書 p.111（自擬）', q: '加入項目時，若錯誤地**由前至後**移動，輸出是什麼？',
          code: C('the_list = [5, 6, 7]', 'the_list = the_list + [0]', 'for k in range(1, 4):', '    the_list[k] = the_list[k-1]', 'the_list[1] = 9', 'print(the_list)'),
          options: ['[5, 9, 6, 7]', '[5, 9, 5, 5]', '[9, 5, 6, 7]', '[5, 9, 6, 0]'], answer: 1, verify: true,
          hint: 'k = 1 時 the_list[1] 已被 5 覆蓋，之後一直複製 5。正確做法是 range(3, 1, -1)。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.98、p.139–142',
      intro: '在編輯器寫 Python，可以先按「▶ 執行」自己測試，再按「提交評核」。每次 `input()` 讀一行輸入。輸出要和要求完全一樣。這部分要用循環寫算法，不可以用 max()、min()、sort() 等內置函數。',
      tasks: [
        { id: 'u6-w1', tier: '必做', pts: 10, title: '電話簿', src: '教科書 p.98 測試站 5.3',
          q: '家寶的電話簿有兩個排位相通的列表 `contact_name` 和 `contact_no`（已寫好）。輸入要找的名字（已寫好），用 **while 循環**做線性檢索，找到便停止：\n• 找到：輸出 `The phone no of 名字 is 號碼`（用 print 的逗號）\n• 找不到：輸出 `Not found in the contact list.`\n名字要完全相同（大小楷有別）。',
          starter: C('contact_name = ' + NAMES, 'contact_no = ' + NOS, 'search_name = input("Search contact: ")', ''),
          ref: C('contact_name = ' + NAMES, 'contact_no = ' + NOS, 'search_name = input("Search contact: ")', 'pos = -1', 'i = 0', 'while i < 5 and pos == -1:', '    if search_name == contact_name[i]:', '        pos = i', '    i = i + 1', 'if pos != -1:', '    print("The phone no of", search_name, "is", contact_no[pos])', 'else:', '    print("Not found in the contact list.")'),
          tests: [{ inputs: 'Yvonne' }, { inputs: 'Tony' }, { inputs: 'Mary' }, { inputs: 'Yee' }, { inputs: 'yvonne' }],
          rules: [{ must: 'while', msg: '要用 while 循環檢索。' }, { mustNot: '.index(', msg: '不可用 .index()，要自己寫檢索算法。' }],
          hint: '`pos = -1`、`i = 0`；條件 `i < 5 and pos == -1`；找到便 `pos = i`。之後用 `contact_no[pos]`。' },
        { id: 'u6-w2', tier: '進階', pts: 12, title: '第二大的值', src: '教科書 p.139–140 綜合編程第 5 題',
          q: '先輸入 n（n ≥ 2），再逐行輸入 n 個**互不相同**的整數，存入列表 `the_list`（已寫好）。只用一次走遍列表的循環，找出第二大的值，輸出：\n`Second maximum number is: 23`（用 print 的逗號）\n方法：先比較首兩項，較大的放 `maximum`，較小的放 `secondmax`；再由索引 2 開始逐一比較。',
          starter: C('n = int(input())', 'the_list = []', 'for i in range(0, n):', '    the_list.append(int(input()))', ''),
          ref: C('n = int(input())', 'the_list = []', 'for i in range(0, n):', '    the_list.append(int(input()))', 'if the_list[0] > the_list[1]:', '    maximum = the_list[0]', '    secondmax = the_list[1]', 'else:', '    maximum = the_list[1]', '    secondmax = the_list[0]', 'for i in range(2, n):', '    if the_list[i] > maximum:', '        secondmax = maximum', '        maximum = the_list[i]', '    elif the_list[i] > secondmax:', '        secondmax = the_list[i]', 'print("Second maximum number is:", secondmax)'),
          tests: [{ inputs: '5\n12\n8\n40\n23\n6' }, { inputs: '2\n1\n9' }, { inputs: '3\n50\n8\n40' }, { inputs: '5\n1\n2\n3\n4\n5' }, { inputs: '4\n-5\n-2\n-9\n-7' }],
          rules: [{ mustNot: 'max(', msg: '不可用 max()。' }, { mustNot: 'sort', msg: '不可用 sort() 或 sorted()。' }],
          hint: '新項目大於 maximum：舊的 maximum 先降為 secondmax，再更新 maximum。否則若大於 secondmax，只更新 secondmax。為什麼不可以兩個都設為 the_list[0]？如果第一項剛好最大，第二大便永遠找不到（p.140 試想想）。' },
        { id: 'u6-w3', tier: '挑戰', pts: 13, title: '跳水評分（五人裁判制）', src: '教科書 p.141–142 綜合編程第 7 題',
          q: '逐行輸入五名裁判的分數（浮點數，已寫好，存入 `score`），再輸入動作難度系數 `coef`。\n刪去**一個**最高分和**一個**最低分，餘下三個分數相加，再乘以 coef，輸出最終得分（直接 `print(final_score)`）。\n例如分數 10、9、8、8.5、7，系數 2：(9 + 8 + 8.5) × 2，輸出 `51.0`。',
          starter: C('score = [0]*5', 'for i in range(0, 5):', '    score[i] = float(input())', 'coef = float(input())', ''),
          ref: C('score = [0]*5', 'for i in range(0, 5):', '    score[i] = float(input())', 'coef = float(input())', 'sum5score = 0', 'for i in range(0, 5):', '    sum5score = sum5score + score[i]', 'maximum = score[0]', 'minimum = score[0]', 'for i in range(0, 5):', '    if score[i] > maximum:', '        maximum = score[i]', '    if score[i] < minimum:', '        minimum = score[i]', 'final_score = sum5score - maximum - minimum', 'final_score = final_score * coef', 'print(final_score)'),
          tests: [{ inputs: '10\n9\n8\n8.5\n7\n2' }, { inputs: '8\n8\n8\n8\n8\n1.5' }, { inputs: '10\n10\n10\n9.5\n9.5\n2' }, { inputs: '6.5\n9.5\n7\n7.5\n9\n3' }, { inputs: '0\n10\n5\n5\n5\n2' }],
          check: { out: true, nums: true },
          rules: [{ mustNot: 'max(', msg: '不可用 max()，要自己找最高分。' }, { mustNot: 'min(', msg: '不可用 min()，要自己找最低分。' }, { mustNot: 'sort', msg: '不可用 sort() 或 sorted()。' }],
          hint: '三步：求五個分數的總和；一個循環同時找 maximum 和 minimum（兩個 if）；`(總和 − maximum − minimum) * coef`。有同分時只刪去一個。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.155–156',
      items: [
        { id: 'u6-q1', pts: 4, src: '教科書 p.155 課題練習 選擇題 5', tags: [TRAP0],
          q: '程式判斷陣列 `num` 中是否包含數字 `target`。哪項最適合填上〔空格〕？', code: C('num = [2, 4, 6, 7, 10]', 'target = int(input())', 'found = False', '〔空格〕', 'if found == True:', '    print("Found")', 'else:', '    print("Not found")'),
          options: ['if num == target: ／ found = True', 'if num != target: ／ found = False', 'for i in range(0, 4): ／ if num[i] == target: ／ found = True', 'for i in range(0, 5): ／ if num[i] == target: ／ found = True'], answer: 'D',
          why: '要逐項比較（列表本身不等於整數）；五個項目用 range(0, 5)，range(0, 4) 會漏查最後一項 10。' },
        { id: 'u6-q2', pts: 4, src: '教科書 p.155 課題練習 選擇題 6',
          q: '陣列 `name` 有 100000 個項目。程式中 `flag` 的用途是什麼？', code: C('flag = False', 'i = 0', 'target = input()', 'while i < 100000 and flag == False:', '    if target == name[i]:', '        flag = True', '    i = i + 1', 'if flag == True:', '    print("Target found")', 'else:', '    print("Target not found")'),
          options: ['檢查有否輸入', '令程式一旦找到目標就停止循環', '節省儲存空間', '立即停止 Python 程式'], answer: 'B',
          why: 'flag 變成 True 後，while 條件不成立，便不再檢查餘下的項目。' },
        { id: 'u6-q3', pts: 4, src: '教科書 p.155 課題練習 選擇題 7',
          q: '哪項最適合填上〔空格〕以找出最低分？', code: C('score = [9, 5, 3, 7, 8]', 'lowest = score[0]', 'for i in range(1, 5):', '    〔空格〕', 'print("The lowest is", lowest)'),
          options: ['if score[i] >= lowest: ／ lowest = score[i]', 'if score[i] == lowest: ／ lowest = score[i]', 'if score[i] < lowest: ／ lowest = score[i]', 'if score[i] > lowest: ／ lowest = score[i]'], answer: 'C',
          why: '遇到比暫存值更小的項目便更新。' },
        { id: 'u6-q4', pts: 4, src: '教科書 p.156 課題練習 選擇題 8', tags: [HOT_ALG, TRAP0],
          q: '程式刪除陣列 X 中指定索引的記錄。用戶想刪除記錄「4」，應輸入什麼？', code: C('X = [1, 2, 3, 4, 5, 6]', 'index = int(input())', 'for i in range(index, len(X)-1):', '    X[i] = X[i + 1]', 'X[5] = 0'),
          options: ['2', '3', '4', '5'], answer: 'B',
          why: '「4」在索引 3（索引由 0 開始）。輸入 4 會刪除記錄「5」。' },
        { id: 'u6-q5', pts: 4, src: '教科書 p.156 課題練習 選擇題 9', tags: [HOT_ALG], verify: true,
          q: '如果程式的輸入是 4，輸出會是什麼？', code: C('X = [1, 2, 3, 5, 6, 7]', 'i = 0', 'num = int(input())', 'while num > X[i]:', '    i = i + 1', 'X = X + [0]', 'for j in range(len(X)-1, i, -1):', '    X[j] = X[j - 1]', 'X[i] = num', 'print(X)'), inputs: '4', ask: { var: 'X' },
          options: ['[1, 2, 3, 4, 5, 6, 7]', '[1, 2, 3, 5, 5, 6, 7]', '[1, 2, 3, 4, 5]', '[1, 2, 3, 4]'], answer: 'A',
          why: 'while 找到第一個不小於 4 的位置 i = 3；加長一格後由後至前右移，再把 4 放入索引 3。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyListAlgo', 'pySearch', 'pyList'], intro: '隨機生成用循環求總和、點算、最大最小、線性檢索比較次數及列表操作的題目，答案由 Python 計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
