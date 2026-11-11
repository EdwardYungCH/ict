/* 單元 c6c：排序（二）——冒泡排序法（比較及交換次數、改良）、合併兩個已排序的列表、
 * 合併排序法與快速排序法的概念、各種排序算法的效率
 * 教科書 選修C 第 6 章 p.249–266；課題練習 3(c)、5 p.271、p.273
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.252–254 例題 6.5(b)(i) 問第 3 行條件語句執行了多少次，答案 6；按原算法（i、j 均由 0 至 3）條件判斷 16 次，6 其實是第 4 行交換的次數；分析圖用了改良版（j 由 0 至 3−i）的比較次數（同選C-26）。本單元 s2-t1 及 quiz q2 以 Python 驗算為 16 次比較、6 次交換。
 * 教科書疑似錯誤：p.256 合併示意圖的 class4B 用 60，表格及其他圖用 85（同選C-27）；本單元按表格用 [43, 69, 85, 91]。
 * 教科書疑似錯誤：p.265–266 說快速排序法最壞情況比較次數是 N log₂N；以首項作樞軸遇上已排序的列表時，最壞為 N(N−1)/2（同選C-28）。本單元 s4-t2 以 Python 驗算：10 個已排序項目比較 45 次。
 * 教科書疑似錯誤：p.259 例題 6.6(b) 用多重賦值 `i, j, k ← 0`，全書其他地方沒有此寫法（同選C-42）；本單元的 Python 版本分開賦值。
 */
const C = (...ls) => ls.join('\n');
const HOT_BUB = { t: 'hot', why: '冒泡排序法每遍內容、執行次數及改良：DSE 2013 卷二D Q1(a)' };
const HOT_MERGE = { t: 'hot', why: '合併兩個已排序的列表：DSE 2013 卷二D Q1(b)' };

const MARK = 'mark = [45, 70, 66, 82, 55, 95, 60]';
const BUB = ['for i in range(0, len(mark)-1):', '    for j in range(0, len(mark)-1-i):', '        if mark[j] < mark[j+1]:', '            temp = mark[j]', '            mark[j] = mark[j+1]', '            mark[j+1] = temp'];
const EX65 = ['A = [73, 85, 62, 96, 61]', 'compare = 0', 'swap = 0', 'for i in range(0, 4):', '    for j in range(0, 4):', '        compare = compare + 1', '        if A[j] > A[j+1]:', '            A[j], A[j+1] = A[j+1], A[j]', '            swap = swap + 1', 'print(compare, swap)'];
const MERGE = ['class4A = [45, 55, 66, 70, 82, 95]', 'class4B = [43, 69, 85, 91]', 'form4 = [0] * 10', 'i = 0', 'j = 0', 'for k in range(0, len(class4A)+len(class4B)):', '    if i < len(class4A) and (j == len(class4B) or class4A[i] < class4B[j]):', '        form4[k] = class4A[i]', '        i = i + 1', '    else:', '        form4[k] = class4B[j]', '        j = j + 1'];
const QUICK = ['count = 0', '', 'def quick(lst):', '    global count', '    if len(lst) <= 1:', '        return lst', '    pivot = lst[0]', '    less = []', '    more = []', '    for x in lst[1:]:', '        count = count + 1', '        if x < pivot:', '            less.append(x)', '        else:', '            more.append(x)', '    return quick(less) + [pivot] + quick(more)'];

module.exports = {
  id: 'c6c',
  title: '排序（二）：冒泡排序法、合併列表及排序效率',
  book: '教科書 選修C 第 6 章 p.249–266（另有 p.271、p.273 課題練習 3(c)、5）',
  key: 'C-c6c-hmac-1ed1912697',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '冒泡排序法', pages: '教科書 p.249–251、p.271',
      learn: [
        { pts: [
          '**冒泡排序法**：由列表首個項目開始，比較**相鄰**兩個項目；次序錯誤便交換。（p.249）',
          '完成一遍後，最小（由大至小排列時）或最大（由小至大排列時）的值便「冒升」到列表**最後**，成為已排序部分。（p.249）',
          '程式：外循環 `i` 數遍數；內循環 `for j in range(0, len(mark)-1-i)`，每遍少比較一個已排好的項目。（p.250）',
          '比較次數：(N − 1) + (N − 2) + … + 1 = **N(N − 1) / 2**。（p.251）',
          '由大至小：`if mark[j] < mark[j+1]` 便交換；由小至大：`if mark[j] > mark[j+1]`。',
        ] },
        { sim: { code: C(MARK, ...BUB, '    print(mark)'), step: true, open: ['vars'] },
          cap: '冒泡排序法的程式（p.250），每遍完成後輸出列表。看 45 怎樣在第一遍一路移到最後。' },
      ],
      tries: [
        { id: 'c6c-s1-t1', pts: 4, src: '教科書 p.249 冒泡排序法的概念',
          code: C(MARK, 'for j in range(0, len(mark)-1):     # 只做第一遍', '    if mark[j] < mark[j+1]:', '        temp = mark[j]', '        mark[j] = mark[j+1]', '        mark[j+1] = temp', 'print(mark)'),
          q: '先估：第一遍完成後，列表是什麼？', options: ['[70, 66, 82, 55, 95, 60, 45]', '[95, 70, 66, 82, 55, 45, 60]', '[70, 82, 66, 95, 60, 55, 45]', '[95, 82, 70, 66, 60, 55, 45]'],
          why: '45 每次比較都較小，一直被交換到最後；其他項目只在相鄰比較時移動。和選擇排序法第一遍（95 直接換到首項）不同。' },
      ],
      practice: [
        { id: 'c6c-s1-p1', type: 'fill', pts: 3, src: '教科書 p.251 冒泡排序法的效率',
          q: '在冒泡排序法中加入計數器。寫出 7 個項目的比較次數和交換次數。',
          code: C(MARK, 'compare = 0', 'swaps = 0', 'for i in range(0, len(mark)-1):', '    for j in range(0, len(mark)-1-i):', '        compare = compare + 1', '        if mark[j] < mark[j+1]:', '            mark[j], mark[j+1] = mark[j+1], mark[j]', '            swaps = swaps + 1'),
          blanks: [{ label: 'compare', ask: { var: 'compare' } }, { label: 'swaps', ask: { var: 'swaps' } }],
          hint: '比較次數只看 N：7 × 6 / 2。交換次數就要看數據的次序。' },
        { id: 'c6c-s1-p2', type: 'mc', pts: 3, src: '教科書 p.271 課題練習 3(c)', verify: true,
          q: '用冒泡排序法把 SR 由小至大排列。以下程式輸出第**二**遍完成後的 SR，輸出是什麼？',
          code: C('SR = [42, 45, 43, 47, 41, 44]', 'for i in range(0, 2):', '    for j in range(0, 5 - i):', '        if SR[j] > SR[j+1]:', '            SR[j], SR[j+1] = SR[j+1], SR[j]', 'print(SR)'),
          options: ['[42, 43, 41, 44, 45, 47]', '[42, 43, 45, 41, 44, 47]', '[41, 42, 43, 44, 45, 47]', '[41, 42, 43, 47, 45, 44]'], answer: 0,
          hint: '第一遍：[42, 43, 45, 41, 44, 47]（47 冒升到最後）；第二遍：45 冒升到尾二。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '分析及改良冒泡排序法', pages: '教科書 p.251–255',
      learn: [
        { pts: [
          '例題 6.5：i、j 都由 0 至 3，每遍都比較 4 次，共 **16 次**比較，交換 6 次。（p.251–254，參考 DSE 2013 卷二D Q1(a)）',
          '改良一：內循環改為 `j` 由 0 至 3 − i（即 `range(0, 4 - i)`），不再比較已排序的部分，結果相同，比較次數減少。（例題 6.5(b)(ii)）',
          '改良二：只須要冠、亞、季軍時，外循環只做 3 遍（i 由 0 至 2）。由小至大排列時，冠軍在 A[4]。（例題 6.5(d)）',
          '冒泡也可以由**後向前**：測試站 6.6 由 j = 8 下至 2 比較 B[j−1] 與 B[j]，每遍把最小值移到**前面**；改良：j 由 8 下至 1 + i。（p.255）',
          '改良三（常見做法）：用旗標 `swapped` 記錄這一遍有沒有交換；如果沒有交換，列表已排好，可**提早停止**。',
        ] },
        { sim: { code: C(...EX65), step: true, open: ['vars'] }, cap: '例題 6.5（p.251）：數一數比較和交換的次數。' },
      ],
      tries: [
        { id: 'c6c-s2-t1', pts: 4, src: '教科書 p.252 例題 6.5(b)(i)（教科書答案有誤，見本單元檔頭）',
          tags: [{ t: 'trap', why: '教科書答 6，那是交換次數，不是條件判斷次數' }],
          code: C(...EX65),
          q: '先估：輸出 compare（第 7 行的條件判斷次數）和 swap 是什麼？', options: ['16 6', '6 6', '10 6', '16 16'],
          why: 'i 有 4 個值、j 有 4 個值，條件判斷 4 × 4 = 16 次；當中 6 次需要交換。改為 j 由 0 至 3 − i 後才是 4 + 3 + 2 + 1 = 10 次。' },
      ],
      practice: [
        { id: 'c6c-s2-p1', type: 'fill', pts: 2, src: '教科書 p.255 測試站 6.6(a)(i)、(ii)',
          q: '生日日期以 "MMDD" 字串儲存（索引 1–8，索引 0 不用）。寫出 i = 1 及 i = 2 的循環體完成後的 B[1:]。',
          code: C('B = ["", "1218", "1023", "1019", "0101", "0123", "1205", "0705", "0601"]', 'for i in range(1, 3):', '    for j in range(8, 1, -1):', '        if B[j-1] > B[j]:', '            B[j-1], B[j] = B[j], B[j-1]', '    if i == 1:', '        after1 = B[1:]', 'after2 = B[1:]'),
          blanks: [{ label: 'i = 1 之後', ask: { var: 'after1' } }, { label: 'i = 2 之後', ask: { var: 'after2' } }],
          hint: '由後向前比較：最小的 "0101" 第一遍便移到最前。用字串儲存才保留前面的 0。' },
        { id: 'c6c-s2-p2', type: 'complete', pts: 3, src: '自擬（冒泡排序法的常見改良）',
          q: '加入旗標 `swapped`：一遍內沒有交換便提早停止。程式輸入一行整數，輸出排序後的列表及做了多少遍。',
          template: C('a = [int(x) for x in input().split()]', 'n = len(a)', 'passes = 0', 'for i in range(0, n - 1):', '    swapped = ［1］', '    for j in range(0, n - 1 - i):', '        if a[j] > a[j+1]:', '            a[j], a[j+1] = a[j+1], a[j]', '            swapped = ［2］', '    passes = passes + 1', '    if ［3］:', '        break', 'print(a, passes)'),
          ref: ['False', 'True', 'swapped == False'], tests: [{ inputs: '5 1 4 2 8' }, { inputs: '1 2 3 4 5' }, { inputs: '5 4 3 2 1' }, { inputs: '2 1 3 4' }],
          hint: '每遍開始先假設沒有交換；有交換便設為 True；一遍完結後仍是 False 便離開外循環。' },
        { id: 'c6c-s2-p3', type: 'mc', pts: 2, src: '教科書 p.252 例題 6.5(d)(ii)（參考 DSE 2013 卷二D Q1(a)）',
          q: '例題 6.5 由小至大排列 5 個得分，只須找出冠、亞、季軍。外循環「設 i 由 0 至 3」應怎樣改，令步數最少？',
          options: ['設 i 由 0 至 1', '設 i 由 0 至 2', '設 i 由 1 至 3', '設 i 由 2 至 4'], answer: 1,
          hint: '每一遍把一個最大值冒升到最後：做 3 遍，A[4]、A[3]、A[2] 便是冠、亞、季軍。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '合併兩個已排序的列表', pages: '教科書 p.256–261、p.273',
      learn: [
        { pts: [
          '比較兩個列表**首項未合併項目**，把較小的複製到已合併列表；重複直到全部合併。（p.256–257）',
          '變量 i、j 代表兩個列表的首項未合併項目，k 代表下一個項目在合併列表的位置。（p.258 提示）',
          '要處理特殊情況：一個列表已全部合併（i 到了列表長度），便只能從另一個列表複製。條件寫成 `i < len(A) and (j == len(B) or A[i] < B[j])`。',
          '由高至低合併（例題 6.6）：條件改為 `P[i] > Q[j]`。（p.259，參考 DSE 2013 卷二D Q1(b)）',
          '也可以由兩個列表的**末端**開始（課題練習 5）：兩個列表都由大至小，從最小的一端取起，得到由小至大的結果。（p.273）',
        ] },
        { sim: { code: C(...MERGE, 'print(form4)'), step: true, open: ['vars'] }, cap: '合併列表的程式（p.258）。按「下一步」，看 i、j、k 怎樣移動。' },
      ],
      tries: [
        { id: 'c6c-s3-t1', pts: 4, src: '教科書 p.256–258', code: C(...MERGE, 'print(form4[:5], i, j)'),
          q: '先估：輸出合併列表的首 5 項，以及最後的 i、j。', options: ['[43, 45, 55, 66, 69] 6 4', '[43, 45, 55, 60, 66] 6 4', '[45, 55, 66, 70, 82] 6 4', '[43, 45, 55, 66, 69] 5 3'],
          why: '43（B）、45、55、66（A）、69（B）……最後兩個列表都已全部合併：i = 6、j = 4。' },
      ],
      practice: [
        { id: 'c6c-s3-p1', type: 'complete', pts: 3, src: '教科書 p.259 例題 6.6(c)（參考 DSE 2013 卷二D Q1(b)）',
          q: 'P、Q 都已由高至低排列（各 5 個）。用**單一**的 if-else 完成合併，令 score 由高至低。會用兩組數據測試。',
          template: C('P = [int(x) for x in input().split()]', 'Q = [int(x) for x in input().split()]', 'score = [0] * 10', 'i = 0', 'j = 0', 'for k in range(0, 10):', '    if ［1］:', '        score[k] = P[i]', '        i = i + 1', '    else:', '        score[k] = Q[j]', '        j = j + 1', 'print(score)'),
          ref: ['i < 5 and (j == 5 or P[i] > Q[j])'], tests: [{ inputs: C('98 95 88 55 48', '97 84 63 60 53') }, { inputs: C('10 9 8 7 6', '5 4 3 2 1') }, { inputs: C('5 4 3 2 1', '10 9 8 7 6') }],
          hint: '教科書答案：`i < 5 and (j = 5 or P[i] > Q[j])`，Python 的「等於」要寫 `==`。' },
        { id: 'c6c-s3-p2', type: 'fill', pts: 2, src: '教科書 p.261 測試站 6.7（參考 DSE 2013 卷二D Q1(b)）',
          q: '寫出合併後的 cards[1:] 及第 8 行條件語句執行的次數。',
          code: C('X = [0, 16, 18, 25, 27, 29, 30, 41, 43]      # 索引 1–8', 'Y = [0, 23, 26, 36, 38, 50, 52]              # 索引 1–6', 'cards = [0] * 15', 'i = 1', 'j = 1', 'k = 1', 'while k <= 14:', '    if j <= 6 and (i > 8 or Y[j] < X[i]):', '        cards[k] = Y[j]', '        j = j + 1', '    else:', '        cards[k] = X[i]', '        i = i + 1', '    k = k + 1'),
          blanks: [{ label: 'cards[1:]', ask: { expr: 'cards[1:]' } }, { label: '第 8 行執行次數', ask: { count: 8 } }],
          hint: '每複製一張卡牌便判斷一次條件：共 8 + 6 = 14 次。' },
        { id: 'c6c-s3-p3', type: 'mc', pts: 2, src: '教科書 p.273 課題練習 5', verify: true,
          q: 'C1、C2 都由大至小排列。子程式 draw4 由兩個列表的末端開始合併。輸出是什麼？',
          code: C('C1 = [9, 7, 7, 3]', 'C2 = [8, 7, 5, 4, 1]', 'ucard = [0] * 9', 'i = 3', 'j = 4', 'for k in range(0, 9):', '    if i >= 0 and (j < 0 or C1[i] < C2[j]):', '        ucard[k] = C1[i]', '        i = i - 1', '    else:', '        ucard[k] = C2[j]', '        j = j - 1', 'print(ucard)'),
          options: ['[1, 3, 4, 5, 7, 7, 7, 8, 9]', '[9, 8, 7, 7, 7, 5, 4, 3, 1]', '[3, 1, 7, 4, 7, 5, 9, 7, 8]', '[1, 3, 4, 5, 7, 7, 8, 9, 0]'], answer: 0,
          hint: '由末端取最小的：1（C2）、3（C1）、4、5（C2）……得到由小至大。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '更快的排序算法；排序效率', pages: '教科書 p.264–266',
      learn: [
        { pts: [
          '**合併排序法（merge sort）**：把列表不斷分拆，直到子列表只有一個項目；再把排好的子列表兩兩**合併**。（p.264）',
          '**快速排序法（quick sort）**：以第一個項目作**樞軸（pivot）**，把其餘項目分成「比樞軸小」及「等於或比樞軸大」兩個子列表，再分別重複。（p.265）',
          '兩者都用**分而治之（divide-and-conquer）**及**遞歸（recursion）**。（p.264–265；學生只須明白有更快的算法）',
          '最壞情況比較次數：選擇、插入、冒泡排序法 N(N − 1) / 2；合併排序法約 N log₂N。（p.266）',
          '快速排序法**平均**約 N log₂N；但以首項作樞軸遇上**已排序**的列表，每次只分出一個空的子列表，最壞也是 N(N − 1) / 2（教科書未提，見本單元檔頭）。',
        ] },
        { table: { head: ['N', 'N(N − 1) / 2', 'N log₂N（約）'], rows: [['10', '45', '33'], ['100', '4 950', '664'], ['1 000', '499 500', '9 966']] }, cap: '列表越長，兩類算法的差距越大（參考圖 6.5，p.266）。' },
        { sim: { code: C(...QUICK, '', 'print(quick([70, 55, 95, 82, 66, 45]))', 'print("比較次數:", count)'), open: ['vars'] }, cap: '快速排序法（p.265）的示範程式：遞歸調用 quick()。只須明白概念，不用背程式。' },
      ],
      tries: [
        { id: 'c6c-s4-t1', pts: 4, src: '教科書 p.265 快速排序法的概念',
          code: C('lst = [70, 55, 95, 82, 66, 45]', 'pivot = lst[0]', 'less = []', 'more = []', 'for x in lst[1:]:', '    if x < pivot:', '        less.append(x)', '    else:', '        more.append(x)', 'print(less, pivot, more)'),
          q: '先估：以首項作樞軸分拆一次，輸出是什麼？', options: ['[55, 66, 45] 70 [95, 82]', '[45, 55, 66] 70 [82, 95]', '[55, 45] 70 [95, 82, 66]', '[55, 66, 45] 70 [95, 82, 70]'],
          why: '比 70 小的保持原有次序放入 less；95、82 放入 more。子列表要再分拆才會排好。' },
        { id: 'c6c-s4-t2', pts: 4, src: '教科書 p.265–266（教科書未提的最壞情況，見本單元檔頭）',
          tags: [{ t: 'trap', why: '快速排序法並非在所有情況都是 N log₂N' }],
          code: C(...QUICK, '', 'result = quick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])   # 已排序', 'print(count)'),
          q: '先估：用首項作樞軸，對 10 個**已排序**的項目進行快速排序，比較了多少次？', options: ['45', '33', '10', '100'],
          why: '每次樞軸都是最小值，less 是空的，more 只少一個：9 + 8 + … + 1 = 45 = N(N − 1) / 2，不是約 33 次（N log₂N）。' },
      ],
      practice: [
        { id: 'c6c-s4-p1', type: 'mc', pts: 2, src: '教科書 p.264–265',
          q: '以下哪兩種排序算法利用了「分而治之」及「遞歸」的策略？',
          options: ['選擇排序法及插入排序法', '冒泡排序法及選擇排序法', '合併排序法及快速排序法', '插入排序法及合併排序法'], answer: 2,
          hint: '先把列表分拆成較小的子列表，再用同一方法處理子列表。' },
        { id: 'c6c-s4-p2', type: 'mc', pts: 1, src: '教科書 p.266', verify: true,
          q: '在最壞情況下，用冒泡排序法排列 150 個項目要比較多少次？（程式只是計算公式）',
          code: C('N = 150', 'print(N * (N - 1) // 2)'),
          options: ['11175', '22350', '1084', '150'], answer: 0,
          hint: 'N(N − 1) / 2。圖 6.5 中 N = 150 時約 11 000 次；合併排序法約 1 000 次。' },
        { id: 'c6c-s4-p3', type: 'fill', pts: 2, src: '教科書 p.265 快速排序法的概念',
          q: '用上面的 quick() 排列 [70, 55, 95, 82, 66, 45]。寫出結果及比較次數。',
          code: C(...QUICK, '', 'result = quick([70, 55, 95, 82, 66, 45])'),
          blanks: [{ label: 'result', ask: { var: 'result' } }, { label: 'count', ask: { var: 'count' } }],
          hint: '第一次分拆比較 5 次；[55, 66, 45] 比較 2 次；[95, 82] 比較 1 次。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.250、p.258',
      intro: '在編輯器寫 Python 程式，先按 ▶ 自己測試，再按「提交評核」。每個 `input()` 讀一行輸入。**不可**使用 sort、sorted、min、max。',
      tasks: [
        { id: 'c6c-w1', pts: 15, title: '改良冒泡排序法（提早停止）', src: '教科書 p.250–254',
          q: '輸入一行整數（以空格分隔）。用**冒泡排序法**由小至大排列：第 i 遍（i 由 0 開始）只比較 `a[0]` 至 `a[n-1-i]` 的相鄰項目。\n每遍完成後 `print(a)`；如果這一遍**沒有交換**，便停止。\n最後一行輸出 `共 k 遍`。只有一個數字時，直接輸出 `共 0 遍`。',
          starter: C('a = [int(x) for x in input().split()]', 'n = len(a)', 'k = 0', '# 在這裏完成', 'print("共", k, "遍")'),
          ref: C('a = [int(x) for x in input().split()]', 'n = len(a)', 'k = 0', 'for i in range(0, n - 1):', '    swapped = False', '    for j in range(0, n - 1 - i):', '        if a[j] > a[j + 1]:', '            a[j], a[j + 1] = a[j + 1], a[j]', '            swapped = True', '    k = k + 1', '    print(a)', '    if swapped == False:', '        break', 'print("共", k, "遍")'),
          rules: [{ mustNot: 'sort', msg: '要自己寫冒泡排序法，不可用 sort／sorted。' }],
          tests: [{ inputs: '73 85 62 96 61' }, { inputs: '1 2 3 4' }, { inputs: '4 3 2 1' }, { inputs: '2 1 3 4 5' }, { inputs: '9' }],
          hint: '外循環每遍先設 `swapped = False`；交換時設為 True。`print(a)` 和計數放在內循環之後；然後才檢查 swapped。' },
        { id: 'c6c-w2', pts: 20, title: '合併兩個已排序的列表', src: '教科書 p.256–258',
          q: '第一行、第二行各輸入一串**已由小至大排序**的整數（以空格分隔，每行最少一個）。用合併列表的算法（比較兩個列表的首項未合併項目）把它們合併成一個由小至大的列表 `merged`，然後 `print(merged)`。\n第二行輸出 `比較次數: c`，c 是比較 `A[i] < B[j]`（或 `A[i] <= B[j]`）的次數：當其中一個列表已全部合併，便直接複製另一個列表餘下的項目，**不用**再比較。',
          starter: C('A = [int(x) for x in input().split()]', 'B = [int(x) for x in input().split()]', 'merged = []', 'c = 0', '# 在這裏完成', 'print(merged)', 'print("比較次數:", c)'),
          ref: C('A = [int(x) for x in input().split()]', 'B = [int(x) for x in input().split()]', 'merged = []', 'c = 0', 'i = 0', 'j = 0', 'while i < len(A) and j < len(B):', '    c = c + 1', '    if A[i] <= B[j]:', '        merged.append(A[i])', '        i = i + 1', '    else:', '        merged.append(B[j])', '        j = j + 1', 'while i < len(A):', '    merged.append(A[i])', '    i = i + 1', 'while j < len(B):', '    merged.append(B[j])', '    j = j + 1', 'print(merged)', 'print("比較次數:", c)'),
          rules: [{ mustNot: 'sort', msg: '要用合併列表的算法，不可用 sort／sorted。' }, { mustNot: 'min(', msg: '要自己比較，不可用 min()。' }],
          tests: [
            { inputs: C('45 55 66 70 82 95', '43 69 85 91') },
            { inputs: C('1 2 3', '4 5 6') },
            { inputs: C('10 20', '5') },
            { inputs: C('2 4 6', '1 3 5 7') },
            { inputs: C('5 5', '5') },
          ],
          hint: '先用 while 在兩個列表都未完時比較首項（c 加 1）；之後把剩下的列表全部複製。相同的數先取哪一個都可以，輸出相同。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.251–266',
      items: [
        { id: 'c6c-q1', pts: 4, src: '教科書 p.252 例題 6.5(b)(ii)（參考 DSE 2013 卷二D Q1(a)）', tags: [HOT_BUB],
          q: '冒泡排序法原本是「設 j 由 0 至 3」。穎彤建議改為「設 j 由 0 至 3−i」。以下哪項描述正確？',
          options: ['不同意，因為結果會不同', '同意，因為循環體的執行次數減少，但排序結果相同', '同意，因為交換的次數會減少', '不同意，因為會出現索引超出範圍'], answer: 'B',
          why: '每遍後最後的 i 個項目已排好，不用再比較。交換次數其實不變（只少了不會交換的比較）。' },
        { id: 'c6c-q2', pts: 4, src: '教科書 p.252 例題 6.5(b)(i)（教科書答案有誤，見本單元檔頭）', tags: [HOT_BUB, { t: 'trap', why: '條件判斷次數 ≠ 交換次數' }], verify: true, ask: { count: 4 },
          q: '第 4 行的條件語句執行了多少次？',
          code: C('A = [73, 85, 62, 96, 61]', 'for i in range(0, 4):', '    for j in range(0, 4):', '        if A[j] > A[j+1]:', '            A[j], A[j+1] = A[j+1], A[j]'),
          options: ['6', '10', '16', '20'], answer: 'C',
          why: '兩層循環各 4 次，條件判斷 16 次；其中 6 次成立而交換。' },
        { id: 'c6c-q3', pts: 4, src: '教科書 p.255 測試站 6.6(c)',
          q: '「設 i 由 1 至 7」「設 j 由 8 下至 2」，比較 B[j−1] 與 B[j]，每遍把最小值移到前面。怎樣修改內循環可以提高效率？',
          options: ['設 j 由 8 下至 1 + i', '設 j 由 8 − i 下至 2', '設 j 由 7 下至 2', '設 j 由 8 下至 i − 1'], answer: 'A',
          why: '第 i 遍後 B[1] 至 B[i] 已排好，最後一次比較只須到 B[i] 與 B[i+1]，即 j = i + 1。' },
        { id: 'c6c-q4', pts: 4, src: '教科書 p.258–259 例題 6.6(a)（參考 DSE 2013 卷二D Q1(b)）', tags: [HOT_MERGE], verify: true,
          q: 'P、Q 已由高至低排列。以下程式的輸出是什麼？',
          code: C('P = [98, 95, 88, 55, 48]', 'Q = [97, 84, 63, 60, 53]', 'score = [0] * 10', 'i = 0', 'j = 0', 'for k in range(0, 10):', '    if i < 5 and (j == 5 or P[i] > Q[j]):', '        score[k] = P[i]', '        i = i + 1', '    else:', '        score[k] = Q[j]', '        j = j + 1', 'print(score[3:7])'),
          options: ['[88, 84, 63, 60]', '[55, 48, 97, 84]', '[88, 63, 60, 55]', '[84, 63, 60, 55]'], answer: 'A',
          why: 'score = [98, 97, 95, 88, 84, 63, 60, 55, 53, 48]；索引 3 至 6 是 88、84、63、60。' },
        { id: 'c6c-q5', pts: 4, src: '教科書 p.236、p.245、p.251',
          q: '一個 1 000 項的列表**已經由小至大排好**。再用以下算法由小至大排序一次，哪一個的比較次數最少？',
          options: ['選擇排序法', '插入排序法', '冒泡排序法（沒有提早停止）', '三者相同'], answer: 'B',
          why: '插入排序法的最好情況：每個關鍵值只比較一次，共 N − 1 次。選擇排序法及沒有改良的冒泡排序法不論次序都要 N(N − 1) / 2 次。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pySort', 'pySearch', 'pyListAlgo'], intro: '隨機生成排序（執行 k 遍後的內容）及檢索題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
