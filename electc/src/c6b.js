/* 單元 c6b：排序（一）——交換、選擇排序法、插入排序法、比較次數、每遍完成後的列表內容
 * 教科書 選修C 第 6 章 p.230–248；課題練習 2–4 p.270–273
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.245–247 例題 6.4 `swap(price[i], price[i-1])` 以陣列項目作參數；按 4.5A 數值是複製，子程式 swap(a, b) 只交換形式參數，陣列不會改變；又在「設 i 由 1 至 7」循環內改變 i（同選C-37）。本單元 s1-t1 以 Python 示範這個陷阱；s3-p2 改用 k 作內部索引並直接交換列表項目，第 3 行（交換）執行 14 次與教科書答案相同。
 * 教科書疑似錯誤：p.245 插入排序法的效率「關鍵值的索引是 K，便須要進行 (K − 1) 次比較和交換」；按同頁 0 起的索引應為 K 次（同選C-44）。本單元 quiz q5 以倒序 [5, 4, 3, 2, 1] 驗算總比較次數 10 = 1 + 2 + 3 + 4。
 * 教科書疑似錯誤：p.236 試想想答案寫 `mark[min_index]`，但程式變量是 max_index（同選C-25）；本單元把由小至大的版本寫成完整程式（min_index）。
 * 教科書疑似錯誤：p.273 課題練習 4(c) 答案「陣列 A」應為「陣列 AR」（同選C-41）。
 */
const C = (...ls) => ls.join('\n');
const HOT_SORT = { t: 'hot', why: '排序算法空運行、每遍後的內容、比較次數：DSE 2012 卷二D Q4、2017 卷二D Q2' };

const MARK = 'mark = [45, 70, 66, 82, 55, 95, 60]';
const SEL = ['for i in range(0, len(mark)):', '    max_index = i', '    for j in range(i+1, len(mark)):', '        if mark[j] > mark[max_index]:', '            max_index = j', '    temp = mark[i]', '    mark[i] = mark[max_index]', '    mark[max_index] = temp'];
const INS = ['for i in range(1, len(mark)):', '    key = mark[i]', '    j = i-1', '    while j >= 0 and key > mark[j]:', '        mark[j+1] = mark[j]', '        j = j - 1', '    mark[j+1] = key'];

module.exports = {
  id: 'c6b',
  title: '排序（一）：交換、選擇排序法、插入排序法',
  book: '教科書 選修C 第 6 章 p.230–248（另有 p.270–273 課題練習 2–4）',
  key: 'C-c6b-hmac-ef76375504',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '交換', pages: '教科書 p.230–231、p.270',
      learn: [
        { pts: [
          '**排序**：把數據由小至大或由大至小順序排列。排序後才可以用對分檢索。（p.233）',
          '**交換（swapping）**是排序的基本操作：好像交換兩杯飲品，要用第三個杯暫存。（p.230 活動 6.2）',
          '`temp = A`、`A = B`、`B = temp`。只寫 `A = B`、`B = A` 會令兩個變量都變成 B 的值。',
          'Python 可以一句交換：`x, y = y, x`。（p.230 擴闊視野）',
          '交換**列表項目**：`temp = A[m]`、`A[m] = A[n]`、`A[n] = temp`（測試站 6.3）。把列表傳入子程式，子程式改的是同一個列表。',
        ] },
        { fix: {
          bad: C('price = [32.2, 19.8]', '', 'def swap(a, b):', '    temp = a', '    a = b', '    b = temp', '', 'swap(price[0], price[1])', 'print(price)'),
          good: C('price = [32.2, 19.8]', '', 'def swap(A, m, n):', '    temp = A[m]', '    A[m] = A[n]', '    A[n] = temp', '', 'swap(price, 0, 1)', 'print(price)'),
          why: '教科書例題 6.4 寫 `swap(price[i], price[i-1])`。在 Python，`a`、`b` 只收到兩個**數值的副本**，子程式內交換 a、b 不會改變列表。要把**列表和索引**傳入子程式（或直接寫 `price[i], price[i-1] = price[i-1], price[i]`）。' } },
        { sim: { code: C('A = [3, 17, 11, 55, 37, 28, 43, 22]', '', 'def F(A, m, n):', '    temp = A[m]', '    A[m] = A[n]', '    A[n] = temp', '', 'F(A, 6, 2)', 'print(A)'), step: true, open: ['vars'] },
          cap: '測試站 6.3 第 2 題（p.231）。教科書索引由 1 開始的 F(A, 7, 3)，在 Python（由 0 開始）是 F(A, 6, 2)。' },
      ],
      tries: [
        { id: 'c6b-s1-t1', pts: 4, src: '教科書 p.245–246 例題 6.4 分析（陷阱，見本單元檔頭）',
          tags: [{ t: 'trap', why: '傳入的是數值副本，形式參數交換不影響列表' }],
          code: C('price = [32.2, 19.8, 26.7]', '', 'def swap(a, b):', '    temp = a', '    a = b', '    b = temp', '', 'swap(price[0], price[1])', 'print(price)'),
          q: '先估：輸出是什麼？', options: ['[32.2, 19.8, 26.7]', '[19.8, 32.2, 26.7]', '[19.8, 19.8, 26.7]', 'TypeError'],
          why: 'a、b 是局部變量，只收到 32.2 和 19.8 的副本；交換它們不會改變列表 price。' },
      ],
      practice: [
        { id: 'c6b-s1-p1', type: 'complete', pts: 2, src: '教科書 p.231 測試站 6.3 第 1 題',
          q: '完成子程式 `swap(num)`，交換列表 num 內兩個值。程式會輸入兩個數字。',
          template: C('def swap(num):', '    temp = ［1］', '    num[0] = num[1]', '    num[1] = ［2］', '', 'A = [int(input()), int(input())]', 'swap(A)', 'print(A)'),
          ref: ['num[0]', 'temp'], tests: [{ inputs: C('29', '8') }, { inputs: C('5', '5') }, { inputs: C('-1', '3') }],
          hint: '先把 num[0] 暫存到 temp，num[0] 被覆寫後，再把 temp 放入 num[1]。' },
        { id: 'c6b-s1-p2', type: 'fill', pts: 2, src: '教科書 p.270 課題練習 2(a)',
          q: '子程式 s(a, b) 沒有用 temp。寫出兩次調用後的列表 A（教科書索引 1–5，下面索引 0 不用）。',
          code: C('A = [0, 18, 23, 16, 20, 28]', '', 'def s(a, b):', '    d = A[a] + A[b]', '    A[a] = d - A[a]', '    A[b] = d - A[a]', '', 's(4, 2)', 'after1 = A[1:]', 's(2, 5)', 'after2 = A[1:]'),
          blanks: [{ label: 's(4, 2) 後', ask: { var: 'after1' } }, { label: '再 s(2, 5) 後', ask: { var: 'after2' } }],
          hint: 'd 是兩數之和：A[a] = d − A[a] 得到原本的 A[b]；A[b] = d − (新 A[a]) 得到原本的 A[a]。即交換兩個值。' },
        { id: 'c6b-s1-p3', type: 'mc', pts: 2, src: '教科書 p.230', verify: true,
          q: '以下程式的輸出是什麼？',
          code: C('A = 1', 'B = 2', 'A = B', 'B = A', 'print(A, B)'),
          options: ['2 1', '2 2', '1 1', '1 2'], answer: 1,
          hint: '沒有用 temp 暫存，A 原本的值已被覆寫。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '選擇排序法', pages: '教科書 p.234–241',
      learn: [
        { pts: [
          '**選擇排序法**：在未排序部分用**線性檢索**找出最大（或最小）值，與**未排序部分的首項**交換；已排序部分每遍增加一個項目。（p.234）',
          '由大至小：找 `max_index`，條件 `mark[j] > mark[max_index]`；由小至大：找 `min_index`，條件 `mark[j] < mark[min_index]`。（p.236）',
          '比較次數：(N − 1) + (N − 2) + … + 1 = **N(N − 1) / 2**，不論數據次序如何都一樣。7 個項目 → 21 次。（p.236）',
          '外循環最後一遍（只剩一個項目）是多餘的：`range(0, N - 1)` 也有相同結果。（p.239 例題 6.3(c)）',
          '有多個相關列表（例如名字和成績）時，交換一個列表的項目，另一個列表也要同時交換，保持排位相通。（p.240 測試站 6.4）',
        ] },
        { sim: { code: C(MARK, ...SEL, '    print(mark)'), step: true, open: ['vars'] },
          cap: '選擇排序法的程式（p.236），每遍完成後輸出列表。由大至小排列。' },
      ],
      tries: [
        { id: 'c6b-s2-t1', pts: 4, src: '教科書 p.234–235 選擇排序法的概念',
          code: C(MARK, 'for i in range(0, 2):        # 只做首兩遍', '    max_index = i', '    for j in range(i+1, len(mark)):', '        if mark[j] > mark[max_index]:', '            max_index = j', '    temp = mark[i]', '    mark[i] = mark[max_index]', '    mark[max_index] = temp', 'print(mark)'),
          q: '先估：首兩遍完成後，列表是什麼？', options: ['[95, 82, 66, 70, 55, 45, 60]', '[95, 82, 70, 66, 60, 55, 45]', '[95, 70, 66, 82, 55, 45, 60]', '[70, 66, 82, 55, 95, 60, 45]'],
          why: '第一遍：95 與 45 交換；第二遍：在 70、66、82、55、45、60 中找到 82，與 70 交換。其餘項目位置不變。' },
      ],
      practice: [
        { id: 'c6b-s2-p1', type: 'mc', pts: 2, src: '教科書 p.237 例題 6.3(b)（參考 DSE 2012 卷二D Q4(b)）', verify: true,
          q: '用選擇排序法把書名由小至大排列。以下程式輸出第**三**次交換後的列表，輸出是什麼？',
          code: C('book = ["Who am I?", "Magic Bell", "Happy Life", "King Bear", "Oh, Hello!"]', 'for i in range(0, 3):', '    min_index = i', '    for j in range(i+1, 5):', '        if book[j] < book[min_index]:', '            min_index = j', '    book[i], book[min_index] = book[min_index], book[i]', 'print(book)'),
          options: ["['Happy Life', 'King Bear', 'Magic Bell', 'Who am I?', 'Oh, Hello!']", "['Happy Life', 'King Bear', 'Who am I?', 'Magic Bell', 'Oh, Hello!']", "['Happy Life', 'King Bear', 'Magic Bell', 'Oh, Hello!', 'Who am I?']", "['Happy Life', 'Magic Bell', 'Who am I?', 'King Bear', 'Oh, Hello!']"], answer: 0,
          hint: '例題 6.3(b) 的「第三次」一欄：H、K、M 已排好，W 和 O 還未處理。' },
        { id: 'c6b-s2-p2', type: 'fill', pts: 2, src: '教科書 p.236 選擇排序法的效率',
          q: '7 個項目。第 5 行的比較 `mark[j] > mark[max_index]` 執行了多少次？若有 10 個項目，用公式 N(N − 1) / 2 計算比較次數。',
          code: C(MARK, ...SEL),
          blanks: [{ label: '7 個項目的比較次數', ask: { count: 5 } }, { label: '10 個項目的比較次數', a: '45' }],
          hint: '6 + 5 + 4 + 3 + 2 + 1 = 21；10 × 9 / 2 = 45。' },
        { id: 'c6b-s2-p3', type: 'complete', pts: 3, src: '教科書 p.241 測試站 6.4(c)',
          q: '完成 `sortByResult()`：用選擇排序法把成績 result **由大至小**排列，athlete 要保持排位相通（Python 索引由 0 開始）。程式最後輸出首三名。會用兩組數據測試。',
          template: C('athlete = input().split()', 'result = [int(x) for x in input().split()]', 'n = len(result)', '', 'def swap(i, j):', '    athlete[i], athlete[j] = athlete[j], athlete[i]', '    result[i], result[j] = result[j], result[i]', '', 'def sortByResult():', '    for i in range(0, n - 1):', '        highest = i', '        for j in range(［1］, n):', '            if ［2］:', '                highest = j', '        swap(［3］)', '', 'sortByResult()', 'print(athlete[:3], result[:3])'),
          ref: ['i + 1', 'result[j] > result[highest]', 'i, highest'],
          tests: [{ inputs: C('rose amy bonnie elaine molly kate ivy cherry', '165 181 168 173 175 169 173 172') }, { inputs: C('a b c d', '10 40 20 30') }],
          hint: '教科書答案：設 j 由 i+1 至 8；如果 result[j] > result[highest]；swap(i, highest)。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '插入排序法', pages: '教科書 p.241–248',
      learn: [
        { pts: [
          '**插入排序法**：把未排序部分的首項取出作為**關鍵值（key）**，與左邊已排序的項目逐一比較；位置不對的項目往後移，直至找到正確位置便插入。（p.241–243）',
          '由大至小：`while j >= 0 and key > mark[j]`；由小至大：把條件改為 `key < mark[j]`。（p.243 試想想）',
          '最好的情況：列表已按要求排好，每個關鍵值只比較一次，**無須移動**。（p.245）',
          '最壞的情況：列表剛好是相反次序，每個關鍵值都要移到首項：比較和移動共 1 + 2 + … + (N − 1) = **N(N − 1) / 2** 次。（p.245）',
          '「把項目往後移」比「逐次交換相鄰項目」的步數少：交換要 3 步，移動只要 1 步。（p.246–247 例題 6.4(c)，參考 DSE 2017 卷二D Q2）',
        ] },
        { sim: { code: C(MARK, ...INS, '    print(mark)'), step: true, open: ['vars'] },
          cap: '插入排序法的程式（p.243），每遍完成後輸出列表。留意 key 怎樣暫存，讓左邊的項目往後移。' },
      ],
      tries: [
        { id: 'c6b-s3-t1', pts: 4, src: '教科書 p.241–243 插入排序法的概念',
          code: C(MARK, 'for i in range(1, 4):        # 只做 i = 1、2、3', '    key = mark[i]', '    j = i-1', '    while j >= 0 and key > mark[j]:', '        mark[j+1] = mark[j]', '        j = j - 1', '    mark[j+1] = key', 'print(mark)'),
          q: '先估：執行 i = 1 至 3 後，列表是什麼？', options: ['[82, 70, 66, 45, 55, 95, 60]', '[95, 82, 70, 66, 55, 45, 60]', '[70, 66, 45, 82, 55, 95, 60]', '[82, 70, 66, 45, 95, 60, 55]'],
          why: 'i = 1 插入 70 → [70, 45, …]；i = 2 插入 66 → [70, 66, 45, …]；i = 3 插入 82 到首項。後面 55、95、60 還未處理。' },
      ],
      practice: [
        { id: 'c6b-s3-p1', type: 'trace', pts: 3, src: '教科書 p.243',
          q: '完成外循環每一遍**結束時**的追蹤表（由大至小）。',
          code: C('mark = [45, 70, 66, 82]', ...INS), spec: { mode: 'iter', cols: ['i', 'key', 'j', 'mark'], out: false },
          hint: '每遍結束時 j 是關鍵值插入位置的前一格（可能是 −1）。' },
        { id: 'c6b-s3-p2', type: 'fill', pts: 2, src: '教科書 p.245–246 例題 6.4(a)(iii)、(b)(i)（參考 DSE 2017 卷二D Q2）',
          q: '例題 6.4 用「逐次交換相鄰項目」的方法由小至大排列。寫出最終的 price 及交換（第 6 行）執行的次數。',
          code: C('price = [32.2, 19.8, 26.7, 18.8, 23.5, 29.5, 27.0, 25.4]', 'for i in range(1, 8):', '    k = i', '    while k > 0 and price[k] < price[k-1]:', '        # 交換 price[k] 與 price[k-1]', '        price[k], price[k-1] = price[k-1], price[k]', '        k = k - 1'),
          blanks: [{ label: '最終的 price', ask: { var: 'price' } }, { label: '交換次數', ask: { count: 6 } }],
          hint: '教科書答案：第 3 行（交換）執行 14 次。教科書直接改變循環變量 i；這裏改用 k，結果相同。' },
        { id: 'c6b-s3-p3', type: 'mc', pts: 1, src: '教科書 p.244 活動 6.4 第 2 題',
          q: '位置 1–9 已由小至大排好：30、32、35、38、43、49、56、60、79。位置 10 的關鍵值是 28。插入排序法要把多少個項目往後移？',
          options: ['0', '1', '9', '10'], answer: 2,
          hint: '28 比全部 9 個項目都小，要插入首項：最差的情況。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '每遍完成後的內容（DSE 題型）', pages: '教科書 p.248、p.270–273',
      learn: [
        { pts: [
          'DSE 常問：「執行第 k 遍後列表的內容」「某一行執行了多少次」「算法的目的」「怎樣修改循環範圍提高效率」。',
          '分辨方法：**選擇排序法**每遍把最大／最小值放到前面，已排序部分之後的項目只有一個位置改變（被交換的那個）。',
          '**插入排序法**每遍只處理左邊的部分：右邊未處理的項目**完全不變**。',
          '寫每遍的內容時，**只改有改變的項目**，其餘照抄上一遍，並檢查每遍仍然有全部 N 個數字。',
          '同一個算法可以用不同方向寫：例如由**最後**一個項目開始向左處理（課題練習 4 的子程式 S）。',
        ] },
        { sim: { code: C('SR = [42, 45, 43, 47, 41, 44]', 'n = len(SR)', 'print("選擇排序法：")', 'A = SR[:]', 'for i in range(0, n - 1):', '    m = i', '    for j in range(i + 1, n):', '        if A[j] < A[m]:', '            m = j', '    A[i], A[m] = A[m], A[i]', '    print(A)', 'print("插入排序法：")', 'B = SR[:]', 'for i in range(1, n):', '    key = B[i]', '    j = i - 1', '    while j >= 0 and B[j] > key:', '        B[j + 1] = B[j]', '        j = j - 1', '    B[j + 1] = key', '    print(B)'), open: ['vars'] },
          cap: '課題練習 3(a)(i)、(b)（p.270–271）：同一組數據，兩種排序法每一遍的內容。和教科書答案表對照。' },
      ],
      tries: [
        { id: 'c6b-s4-t1', pts: 4, src: '教科書 p.270 課題練習 3(a)(i)',
          code: C('SR = [42, 45, 43, 47, 41, 44]', 'for i in range(0, 2):          # 第一、二遍', '    m = i', '    for j in range(i + 1, 6):', '        if SR[j] < SR[m]:', '            m = j', '    SR[i], SR[m] = SR[m], SR[i]', 'print(SR)'),
          q: '先估：選擇排序法第二遍完成後，SR 是什麼？', options: ['[41, 42, 43, 47, 45, 44]', '[41, 45, 43, 47, 42, 44]', '[41, 42, 43, 44, 45, 47]', '[42, 43, 45, 47, 41, 44]'],
          why: '第一遍 41 與 42 交換；第二遍在 45、43、47、42、44 找到 42，與 45 交換。' },
        { id: 'c6b-s4-t2', pts: 4, src: '教科書 p.272 課題練習 4(b)(i)（參考 DSE 2017 卷二D Q2）',
          code: C('AR = [0, 58, 67, 43, 30, 49]       # 索引 1–5，索引 0 不用', 'n = 5', 'for i in range(n, 2, -1):          # 只做 i = 5、4、3', '    k = AR[i]', '    j = i + 1', '    while j <= n and k < AR[j]:', '        AR[j-1] = AR[j]', '        j = j + 1', '    AR[j-1] = k', 'print(AR[1:])'),
          q: '先估：執行子程式 S 內 i = 3 的循環體後，AR 是什麼？', options: ['[58, 67, 49, 43, 30]', '[58, 67, 43, 49, 30]', '[67, 58, 49, 43, 30]', '[58, 67, 30, 43, 49]'],
          why: '由右邊開始插入，令右邊部分由大至小：i = 4 → 49、30；i = 3 → 49、43、30。左邊 58、67 未處理。' },
      ],
      practice: [
        { id: 'c6b-s4-p1', type: 'mc', pts: 3, src: '教科書 p.271 課題練習 3(b)',
          q: 'SR 原本是 [42, 45, 43, 47, 41, 44]。某排序算法首兩遍後分別是 [42, 45, 43, 47, 41, 44] 及 [42, 43, 45, 47, 41, 44]。這是哪一種算法？',
          options: ['選擇排序法', '插入排序法', '對分檢索', '合併兩個已排序的列表'], answer: 1,
          hint: '右邊 41、44 完全沒有動；左邊 42、45 → 42、43、45：每遍把一個關鍵值插入左邊的已排序部分。' },
        { id: 'c6b-s4-p2', type: 'fill', pts: 3, src: '教科書 p.248 測試站 6.5（參考 DSE 2017 卷二D Q2）',
          q: '寫出最終的 score 及交換（第 7 行）被執行的次數。',
          code: C('score = [0, 28, 32, 29, 28, 30, 27, 26, 30, 26, 29]   # 索引 1–10', 'i = 10', 'while i > 1:', '    if i > 10 or score[i-1] >= score[i]:', '        i = i - 1', '    else:', '        score[i-1], score[i] = score[i], score[i-1]', '        i = i + 1'),
          blanks: [{ label: '最終的 score[1:]', ask: { expr: 'score[1:]' } }, { label: '交換次數', ask: { count: 7 } }],
          hint: '算法的目的是由大至小排列；教科書答案：swap 被調用 15 次。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.236、p.243、p.270–271',
      intro: '在編輯器寫 Python 程式，先按 ▶ 自己測試，再按「提交評核」。每個 `input()` 讀一行輸入。**不可**使用 sort、sorted、max、min。',
      tasks: [
        { id: 'c6b-w1', pts: 15, title: '選擇排序法（由大至小，顯示每遍）', src: '教科書 p.236、p.270 課題練習 3(a)',
          q: '輸入一行整數（以空格分隔）。用**選擇排序法**由大至小排列：外循環做 N − 1 遍，每遍完成後 `print(列表)`。\n例如輸入 `45 70 66`，輸出 `[70, 45, 66]`、`[70, 66, 45]`。只有一個數字時不用輸出。',
          starter: C('mark = [int(x) for x in input().split()]', '# 在這裏完成'),
          ref: C('mark = [int(x) for x in input().split()]', 'for i in range(0, len(mark) - 1):', '    max_index = i', '    for j in range(i + 1, len(mark)):', '        if mark[j] > mark[max_index]:', '            max_index = j', '    temp = mark[i]', '    mark[i] = mark[max_index]', '    mark[max_index] = temp', '    print(mark)'),
          rules: [{ mustNot: 'sort', msg: '要自己寫選擇排序法，不可用 sort／sorted。' }, { mustNot: 'max(', msg: '要用線性檢索找最大值，不可用 max()。' }, { mustNot: 'index(', msg: '要用線性檢索找最大值的索引，不可用 index()。' }],
          tests: [{ inputs: '45 70 66 82 55 95 60' }, { inputs: '45 70 66' }, { inputs: '1 2 3 4' }, { inputs: '9 9 1 9' }, { inputs: '7' }],
          hint: '外循環 `for i in range(0, len(mark) - 1)`；內循環找 max_index；交換 mark[i] 與 mark[max_index]；`print(mark)` 放在外循環內（內循環之外）。' },
        { id: 'c6b-w2', pts: 20, title: '插入排序法（由小至大）並計算移動次數', src: '教科書 p.243–247',
          q: '輸入一行整數（以空格分隔）。用**插入排序法**由小至大排列，每遍（i = 1 至 N − 1）完成後 `print(列表)`。\n最後一行輸出 `移動次數: m`，m 是把項目往後移一格（`a[j+1] = a[j]`）的總次數。相同的數**不用**移動。',
          starter: C('a = [int(x) for x in input().split()]', 'm = 0', '# 在這裏完成', 'print("移動次數:", m)'),
          ref: C('a = [int(x) for x in input().split()]', 'm = 0', 'for i in range(1, len(a)):', '    key = a[i]', '    j = i - 1', '    while j >= 0 and key < a[j]:', '        a[j + 1] = a[j]', '        m = m + 1', '        j = j - 1', '    a[j + 1] = key', '    print(a)', 'print("移動次數:", m)'),
          rules: [{ mustNot: 'sort', msg: '要自己寫插入排序法，不可用 sort／sorted。' }, { must: 'while', msg: '用 while 循環把項目往後移。' }],
          tests: [{ inputs: '42 45 43 47 41 44' }, { inputs: '1 2 3 4' }, { inputs: '5 4 3 2 1' }, { inputs: '3 1 3 2' }, { inputs: '8' }],
          hint: '`while j >= 0 and key < a[j]`：移動一格後 m 加 1。條件用 `<`（不是 `<=`），相同的數便不會移動。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.236–247、p.272–273',
      items: [
        { id: 'c6b-q1', pts: 4, src: '教科書 p.239 例題 6.3(c)（參考 DSE 2012 卷二D Q4(b)）', tags: [HOT_SORT],
          q: '選擇排序法有 5 個項目，外循環原本是「設 i 由 0 至 4」。如果改為「設 i 由 0 至 3」，結果會怎樣？',
          options: ['最後一個項目不會被排序', '沒有影響，因為 i = 4 時未排序部分只剩一個項目', '會出現運行時錯誤', '列表會變成由大至小'], answer: 'B',
          why: '前 4 個位置放好後，最後一個位置的值一定正確；i = 4 的那一遍只是自己與自己交換。' },
        { id: 'c6b-q2', pts: 4, src: '教科書 p.236',
          q: '用選擇排序法排列 8 個項目，共要進行多少次比較？',
          options: ['8', '28', '36', '64'], answer: 'B',
          why: 'N(N − 1) / 2 = 8 × 7 / 2 = 28（7 + 6 + … + 1）。' },
        { id: 'c6b-q3', pts: 4, src: '教科書 p.246–247 例題 6.4(c)（參考 DSE 2017 卷二D Q2）', tags: [HOT_SORT],
          q: '智文的插入排序法每次「交換」相鄰兩項（swap 有 3 步）；子謙的方法先把關鍵值存入 key，再把項目「往後移」，最後放回 key。哪個算法較有效率？',
          options: ['智文的，因為比較次數較少', '子謙的，因為項目移動的次數（步數）較少', '兩者完全一樣', '智文的，因為不需要變量 key'], answer: 'B',
          why: '例如插入 18.8：交換法要 3 × 3 = 9 步；移動法只要 5 步。兩者比較次數相同，結果也相同。' },
        { id: 'c6b-q4', pts: 4, src: '教科書 p.273 課題練習 4(d)', tags: [HOT_SORT],
          q: '子程式 S「設 i 由 n 下至 1」由最後一個項目開始，把 AR[i] 插入右邊已排序的部分。怎樣修改這一行可以提高效率而結果不變？',
          options: ['設 i 由 n 下至 2', '設 i 由 n−1 下至 1', '設 i 由 1 至 n', '設 i 由 n 下至 0'], answer: 'B',
          why: 'i = n 時右邊沒有項目，AR[n] 自己已是「已排序部分」，那一遍是多餘的。' },
        { id: 'c6b-q5', pts: 4, src: '教科書 p.245 插入排序法的效率（見本單元檔頭）', tags: [{ t: 'trap', why: '教科書寫 (K − 1) 次，按 0 起的索引是 K 次' }], verify: true,
          q: '以下程式用插入排序法把倒序的列表由小至大排列，輸出是什麼？',
          code: C('a = [5, 4, 3, 2, 1]', 'count = 0', 'for i in range(1, len(a)):', '    key = a[i]', '    j = i - 1', '    while j >= 0:', '        count = count + 1', '        if key < a[j]:', '            a[j + 1] = a[j]', '            j = j - 1', '        else:', '            break', '    a[j + 1] = key', 'print(count)'),
          options: ['4', '10', '15', '25'], answer: 'B',
          why: '最壞情況：索引 K 的關鍵值要比較 K 次，1 + 2 + 3 + 4 = 10 = N(N − 1) / 2。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pySort', 'pyListAlgo', 'pyList'], intro: '隨機生成「執行 k 遍後列表的內容」等排序題目（選擇、插入、冒泡排序法），答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
