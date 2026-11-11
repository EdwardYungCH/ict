/* 單元 5：列表基本運作
 * 教科書 D2 第 5 章 5.1、5.2A（書頁 p.76–91）；課題練習 p.154 選擇題 1–4
 * // 教科書疑似錯誤：p.85 測試站 5.1 第 5 題示範輸出有「The inputted integers are:」一行，但答案程式沒有輸出這行的指令（本單元寫程式題已把這行寫進要求）。
 * // 教科書疑似錯誤：p.88–89 例題 5.1 偽代碼條件用 Python 的 `!=`；(b) 示範輸出有「Total amount of time:」「Average time:」，但答案程式只寫 print(total)、print(avg)。
 * // 教科書疑似錯誤：p.90 測試站 5.2(a) 偽代碼欄寫 `print(avg)`，應為「輸出 avg」。
 * // 教科書疑似錯誤：p.154 課題練習 選擇題 1–3 以 `list` 作變量名稱，會遮蓋 Python 內置的 list()（可運行，但不是好習慣）。
 * 所有答案在 build 時由 CPython 計算／核對。
 */
const C = (...ls) => ls.join('\n');
const TRAP0 = { t: 'trap', why: '偽代碼的陣列索引由 1 開始；Python 列表索引由 0 開始，長度 N 的列表最後索引是 N − 1（p.78）。' };
const HOT_ARR = { t: 'hot', why: 'DSE 卷一甲部幾乎每年都有空運行陣列／列表算法的題目。' };
const TIME8 = '[15.1, 14.9, 15.6, 16.1, 16.8, 17.0, 16.9, 16.5]';

module.exports = {
  id: 'u5',
  title: '列表基本運作',
  book: '教科書 D2 第 5 章 p.76–91（另有 p.154 課題練習）',
  key: 'D2-u5-hmac-3ea3a98a84',
  theory: false,
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '陣列與列表；索引由 0 開始', pages: '教科書 p.76–79',
      learn: [
        { pts: [
          '**一維陣列（1D array）**：有次序地儲存一連串**同一種數據類型**的數據；配合循環，處理大量數據更容易。（p.76）',
          'Python 沒有陣列，但可用**列表（list）**達到相似效果。列表的項目可以屬不同數據類型；本課只放同一種類型，當作陣列使用。（p.76）',
          '建立列表：直接賦值，例如 `list1 = ["David", "Lily", "Ben"]`、`list2 = [34, 23, 90, 56, 100]`。`print(type(list1))` 輸出 `<class \'list\'>`。（p.76）',
          '**初始化（initialisation）**：先建立列表並給預設值，才可以存取項目。`list3 = [0]*10` 建立 10 個 0；`list4 = [""]*5` 建立 5 個空字串。（p.77）',
          '**偽代碼的陣列索引由 1 開始；Python 列表索引由 0 開始。** `list1[0]` 是 `"David"`，`list2[2]` 是 `90`。（p.78）',
          '長度為 `N` 的列表，最後索引是 `N-1`。（p.78 提示）',
        ] },
        { table: { head: ['list2', '34', '23', '90', '56', '100'], rows: [['Python 索引', '0', '1', '2', '3', '4'], ['偽代碼索引', '1', '2', '3', '4', '5']] }, cap: '同一個列表，兩種索引（p.76–78）' },
        { warn: '**DSE 陷阱**：讀偽代碼題時 `A[1]` 是第一項；寫 Python 時 `A[0]` 才是第一項。把偽代碼「設 i 由 1 至 5」直接改成 `range(1, 6)` 便會漏了第一項，還會超出範圍。' },
        { note: '擴闊視野（p.79）：陣列存放在連續的記憶體，程式只記下**起始位址**（指針）。項目位址 = 起始位址 + 索引，第一項距離起始位址 0，所以索引由 0 開始。例如 arr 起始位址 3046，`arr[3]` 在 3046 + 3 = 3049。' },
        { sim: { code: C('list1 = ["David", "Lily", "Ben"]', 'list2 = [34, 23, 90, 56, 100]', 'list3 = [0]*10', 'print(list1[0])', 'print(list2[2])', 'print(type(list1))'), open: ['vars'], step: true }, cap: 'p.76–78 的例子。按「下一步」，在變量表看看三個列表。' },
      ],
      tries: [
        { id: 'u5-s1-t1', pts: 4, src: '教科書 p.78', code: C('list2 = [34, 23, 90, 56, 100]', 'list2[0] = 28', 'list2[1] = list2[2] - 5', 'print(list2)'),
          q: '先估：輸出是什麼？', options: ['[28, 85, 90, 56, 100]', '[28, 18, 90, 56, 100]', '[34, 85, 90, 56, 100]', '[28, 23, 85, 56, 100]'],
          why: 'list2[2] 是 90（索引由 0 開始），90 − 5 = 85 放入 list2[1]。若以為 list2[2] 是 23 便會選錯。' },
      ],
      practice: [
        { id: 'u5-s1-p1', type: 'fill', pts: 1, src: '教科書 p.80 輸出指定項目', q: '寫出輸出。',
          code: C('list1 = ["David", "Lily", "Ben"]', 'print(list1[1])', 'print(list1[0])'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: 'list1[1] 是第 2 項。' },
        { id: 'u5-s1-p2', type: 'mc', pts: 2, src: '教科書 p.78 提示', tags: [TRAP0], q: '`fees` 有 8 個項目。以下哪一項是**最後一項**？',
          options: ['fees[8]', 'fees[7]', 'fees[9]', 'fees[1]'], answer: 1, hint: '長度 N 的列表，最後索引是 N − 1。' },
        { id: 'u5-s1-p3', type: 'mc', pts: 1, src: '教科書 p.78 常見錯誤', q: '執行以下程式時會出現什麼錯誤？', code: C('list1 = []', 'list1[0] = "David"'), ask: { error: true },
          options: ['沒有錯誤', 'IndexError', 'NameError', 'TypeError'], answer: 1, verify: true,
          hint: '空列表（empty list）沒有任何項目，不能用索引賦值。' },
        { id: 'u5-s1-p4', type: 'fill', pts: 1, src: '教科書 p.78 試想想', q: '寫出 `list(range(0, 5))` 的結果，即 `range(0, 5)` 包含的數列。',
          code: C('r = list(range(0, 5))'), blanks: [{ label: 'r', ask: { var: 'r' } }], hint: '由 0 開始，不包括 5。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '更新、輸出及複製列表', pages: '教科書 p.77–84',
      learn: [
        { pts: [
          '**更新項目**：`list2[0] = 28`；也可先讀取再運算：`list2[1] = list2[2] - 5`。（p.78）',
          '用 for 循環逐一賦值：`for i in range(0, 5):` → `list2[i] = i`。（p.78）',
          '**逐一輸出**：`for i in range(0, 5):` → `print(list2[i])`。（p.80）',
          '擴闊視野：`print(list2)` 一次輸出整個列表（有方括號及逗號）；`for item in list1:` 也可逐一取出項目。（p.80）',
          '**複製列表**：先 `new_list = [0]*5`，再用 for 循環 `new_list[i] = list2[i]`。（p.81）',
          '擴闊視野：列表是**動態**的，長度可以改變。`list1 = list1 + ["David"]` 或 `list2.append("Ken")` 都會在末端加入項目。（p.77）',
        ] },
        { sim: { code: C('list2 = [34, 23, 90, 56, 100]', 'new_list = [0]*5', 'for i in range(0, 5):', '    new_list[i] = list2[i]', 'new_list[0] = 99', 'print(list2)', 'print(new_list)'), open: ['vars'], step: true }, cap: '用循環複製（p.81）：改 new_list 不會影響 list2。' },
        { warn: '`new_list = list2` **不是**複製：兩個名稱指向同一個列表，改 `new_list[0]`，`list2[0]` 也會變。' },
        { code: C('list1 = []', 'list1 = list1 + ["David"]', 'list1 = list1 + ["Lily"]', 'list2 = []', 'list2.append("Ken")', 'list2.append("Frank")', 'print(list1)', 'print(list2)'), cap: '兩種加入項目的方法（p.77 擴闊視野）。注意 `list1 + "David"` 會出 TypeError：列表只可以和列表相加。' },
      ],
      tries: [
        { id: 'u5-s2-t1', pts: 4, src: '教科書 p.82 活動 5.2', code: C('even = [2, 4, 6, 8, 10]', 'for i in range(0, 4):', '    even[i] = even[i] + even[i+1]', '    print(even[i])'),
          q: '先估：輸出是什麼？', options: ['6\n10\n14\n18', '6\n10\n14\n18\n10', '2\n6\n10\n14', '6\n16\n30\n48'],
          why: '每次加上「後一項」，後一項還未被更新：2+4、4+6、6+8、8+10。' },
        { id: 'u5-s2-t2', pts: 4, src: '教科書 p.82 活動 5.2', code: C('odd = [1, 3, 5, 7, 9]', 'for i in range(1, 5):', '    odd[i] = odd[i] + odd[i-1]', '    print(odd[i])'),
          q: '先估：輸出是什麼？', options: ['4\n8\n12\n16', '4\n9\n16\n25', '1\n4\n9\n16\n25', '3\n5\n7\n9'],
          why: '這次加上「前一項」，而前一項**已經更新**：3+1=4、5+4=9、7+9=16、9+16=25。' },
      ],
      practice: [
        { id: 'u5-s2-p1', type: 'trace', pts: 2, src: '教科書 p.82 活動 5.2', q: '空運行以下程式，完成追蹤表（每次循環一行）。',
          code: C('original_list = [10, 12, 19, 25]', 'new_list = [0]*4', 'for i in range(0, 4):', '    new_list[i] = original_list[3-i]', '    print(new_list[i])'),
          spec: { mode: 'iter', cols: ['i', 'new_list'], out: true }, hint: 'i = 0 時取 original_list[3]。' },
        { id: 'u5-s2-p2', type: 'complete', pts: 1, src: '教科書 p.83 測試站 5.1 第 1 題', label: '補完程式',
          q: '把列表的值更新為由 0 開始的首五個雙數，並逐行輸出（0、2、4、6、8）。',
          template: C('num = [0, 0, 0, 0, 0]', 'for i in range(0, ［1］):', '    num[i] = ［2］', '    print(num[i])'),
          ref: ['5', 'i * 2'], tests: [{ inputs: '' }], hint: 'Python 的 range 不包括終值；偽代碼則寫「由 0 至 4」。' },
        { id: 'u5-s2-p3', type: 'complete', pts: 2, src: '教科書 p.83 測試站 5.1 第 2 題', label: '補完程式',
          q: '湯先生要向八位客戶每人加收行政費 $50。完成程式（最後一行輸出整個列表）。',
          template: C('fees = [1050, 1000, 2000, 2500, 2800, 1800, 1500, 1400]', 'for index in range(［1］, ［2］):', '    ［3］', 'print(fees)'),
          ref: ['0', '8', 'fees[index] = fees[index] + 50'], tests: [{ inputs: '' }], check: { out: true, vars: ['fees'] },
          hint: '索引 0 至 7，所以 range(0, 8)。偽代碼答案是「設 index 由 0 至 7」。' },
        { id: 'u5-s2-p4', type: 'complete', pts: 2, src: '教科書 p.84 測試站 5.1 第 4 題', label: '補完程式',
          q: 'Mike 未能出席，由弟弟 Stephen 代替。更新列表，再逐行輸出（Stephen、Amy、Billy）。',
          template: C('team = ["Mike", "Amy", "Billy"]', 'team[［1］] = ［2］', 'for i in range(0, ［3］):', '    print(team[i])'),
          ref: ['0', '"Stephen"', '3'], tests: [{ inputs: '' }], hint: 'Mike 在索引 0；三個項目，range(0, 3)。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '除錯：超出範圍與倒序輸出', pages: '教科書 p.78、p.81–85',
      learn: [
        { pts: [
          '不存在於列表中的項目不能被存取：**空列表**（`[]`）沒有項目；`[0]*5` 只有索引 0–4，用 `list2[5]` 便**超出範圍（out of range）**。（p.78 常見錯誤）',
          'Python 會顯示運行時錯誤 **IndexError: list index out of range**，並停在出錯那一行；之前的輸出照樣出現。',
          '小心 `num[i+1]`、`num[i-1]` 這類寫法：要檢查 i 在**第一次**和**最後一次**循環時，索引是否仍在 0 至 N − 1 之內。（p.81 活動 5.1）',
          '**倒序輸出**：`for i in range(4, -1, -1):` 得 i = 4、3、2、1、0；或 `for i in range(0, 5):` 配 `print(num[4-i])`。（p.85 測試站 5.1 第 5 題）',
        ] },
        { sim: { code: C('num = [10, 15, 20, 25, 30, 35, 40]', 'for i in range(0, 7):', '    num[i] = num[i] + num[i+1]', '    print(num[i])'), open: ['vars'], step: true }, cap: '活動 5.1（p.81）：執行到 i = 6 時，`num[7]` 不存在 → IndexError。把 `range(0, 7)` 改成 `range(0, 6)` 便可。' },
        { fix: { bad: C('age = [34, 23, 81, 56, 8]', 'for i in range(1, 6):', '    print(age[i])'), good: C('age = [34, 23, 81, 56, 8]', 'for i in range(0, 5):', '    print(age[i])'), why: '照搬偽代碼「由 1 至 5」：漏了 age[0]，還要讀取不存在的 age[5]。（p.81 活動 5.1）' } },
      ],
      tries: [
        { id: 'u5-s3-t1', pts: 4, src: '教科書 p.81 活動 5.1', code: C('sec = [1.1, 0.98, 0.99]', 'for i in range(3, -1, -1):', '    print(sec[i])'), ask: { error: true },
          q: '先估：執行時會出現什麼錯誤？', options: ['沒有錯誤', 'IndexError', 'SyntaxError', 'ValueError'],
          why: '第一次循環 i = 3，sec[3] 不存在（只有索引 0–2）。應寫 range(2, -1, -1)。' },
      ],
      practice: [
        { id: 'u5-s3-p1', type: 'mc', pts: 1, src: '教科書 p.81 活動 5.1', q: '以下程式無法運行，原因是什麼？', code: C('height = []', 'height[0] = 175', 'height[1] = 180', 'height[2] = 165'),
          options: ['列表名稱不可以叫 height', '建立的列表沒有任何項目', '175 不是整數', '要先輸出 height'], answer: 1,
          hint: '可以改為 `height = [0]*3`，或用 `height.append(175)`。' },
        { id: 'u5-s3-p2', type: 'fill', pts: 2, src: '教科書 p.82 活動 5.2', q: '空運行，寫出輸出。',
          code: C('sec = [1.1, 0.98, 0.99]', 'for i in range(2, -1, -1):', '    print(sec[i])'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: 'i = 2、1、0（不包括 -1）。' },
        { id: 'u5-s3-p3', type: 'complete', pts: 3, src: '教科書 p.85 測試站 5.1 第 5 題', label: '補完程式',
          q: '讀取五個整數，按輸入次序存入列表，再**倒序**逐行輸出。會用多組數據測試。',
          template: C('num = [0, 0, 0, 0, 0]', 'for i in range(0, ［1］):', '    num[i] = int(input("Input an integer: "))', 'print("The inputted integers are:")', 'for i in range(［2］):', '    ［3］'),
          ref: ['5', '4, -1, -1', 'print(num[i])'], tests: [{ inputs: '10\n5\n20\n15\n0' }, { inputs: '1\n2\n3\n4\n5' }],
          hint: '倒序：i 由 4 下至 0，`range(4, -1, -1)`。另一寫法：`range(0, 5)` 配 `print(num[4-i])`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '列表運算：總和、平均值、len()', pages: '教科書 p.86–91',
      learn: [
        { pts: [
          '**求總和**：`total = 0`，用 for 循環逐一 `total = total + time[i]`。（p.86）',
          '**求平均值**：總和 ÷ 列表長度。用 `/` 的結果一定是浮點數。（p.86）',
          '每次數據數目不同時，不要把 8 寫死：用 **`len()`** 取得列表長度 `N = len(time)`，再 `range(0, N)`、`total/N`。（p.87）',
          '例題 5.1：重複輸入，**輸入 -1 代表完成**（-1 不放入列表），用 while 循環；每次 `time = time + [record]`。（p.88）',
          '測試站 5.2：**平均偏差** = Σ|xᵢ − mean| ÷ n；**標準差** = √(Σ(xᵢ − mean)² ÷ n)，要 `import math` 用 `math.sqrt()`。（p.90–91）',
        ] },
        { sim: { code: C('time = ' + TIME8, 'total = 0', 'for i in range(0, 8):', '    total = total + time[i]', 'print(total)', 'avg = total/8', 'print(avg)'), open: ['vars'], step: true }, cap: '800 米跑每 100 米的時間（p.86）：總和 128.9，平均 16.1125。' },
        { sim: { code: C('time = []', 'record = float(input("Input a record (input -1 to exit): "))', 'while record != -1:', '    time = time + [record]', '    record = float(input("Input a record (input -1 to exit): "))', 'print("Your record:", time)', 'total = 0', 'N = len(time)', 'for i in range(0, N):', '    total = total + time[i]', 'print(total)', 'avg = total/N', 'print(avg)'), inputs: '14.9\n15.5\n16.1\n15.8\n-1', open: ['vars'] }, cap: '例題 5.1（p.88–89）完整程式。輸入 -1 結束。' },
      ],
      tries: [
        { id: 'u5-s4-t1', pts: 4, src: '教科書 p.90 測試站 5.2(a)', code: C('mark = [80, 90, 75, 60]', 'total = 0', 'for i in range(0, 4):', '    total = total + mark[i]', 'avg = total/len(mark)', 'print(avg)'),
          q: '先估：輸出是什麼？', options: ['76', '76.25', '76.3', '305'],
          why: '總和 305，305 / 4 = 76.25。' },
      ],
      practice: [
        { id: 'u5-s4-p1', type: 'complete', pts: 2, src: '教科書 p.88–89 例題 5.1(a)(b)', label: '補完程式',
          q: '輸入每 100 米的時間，輸入 -1 代表完成；之後輸出總時間及平均時間。會用多組數據測試。',
          template: C('time = []', 'record = float(input())', 'while ［1］:', '    time = ［2］', '    record = float(input())', 'total = 0', 'N = ［3］', 'for i in range(0, N):', '    total = total + time[i]', 'print(total)', 'print(total/N)'),
          ref: ['record != -1', 'time + [record]', 'len(time)'], tests: [{ inputs: '14.9\n15.5\n16.1\n15.8\n-1' }, { inputs: '12\n-1' }, { inputs: '10\n20\n-1' }],
          hint: '`time + record` 會出 TypeError，要寫 `time + [record]`。' },
        { id: 'u5-s4-p2', type: 'complete', pts: 2, src: '教科書 p.90 測試站 5.2(b)', label: '補完程式',
          q: '已知平均分 `avg`，計算平均偏差（mean deviation）。',
          template: C('mark = [80, 90, 75, 60]', 'avg = 76.25', 'mean_dev = 0', 'for i in range(0, 4):', '    if (mark[i] > avg):', '        mean_dev = ［1］', '    else:', '        mean_dev = ［2］', 'mean_dev = mean_dev/4', 'print(mean_dev)'),
          ref: ['mean_dev + (mark[i] - avg)', 'mean_dev + (avg - mark[i])'], tests: [{ inputs: '' }],
          hint: '兩個分支都要得到正數的差（絕對值）。' },
        { id: 'u5-s4-p3', type: 'fill', pts: 1, src: '教科書 p.91 測試站 5.2(c)', q: '執行以下計算標準差的程式，寫出輸出。',
          code: C('import math', 'mark = [80, 90, 75, 60]', 'avg = 76.25', 'sd = 0', 'for i in range(0, 4):', '    if (mark[i] > avg):', '        sd = sd + (mark[i] - avg) ** 2', '    else:', '        sd = sd + (avg - mark[i]) ** 2', 'sd = math.sqrt(sd/4)', 'print(sd)'),
          blanks: [{ label: '輸出', ask: 'out' }], hint: '可以按 ▶ 執行看看。想一想：平方之後正負一樣，其實不需要 if。' },
        { id: 'u5-s4-p4', type: 'mc', pts: 2, src: '教科書 p.87', q: '以下程式的輸出是什麼？', code: C('time = [1, 2, 3, 4]', 'print(len(time))'),
          options: ['3', '4', '10', '[1, 2, 3, 4]'], answer: 1, verify: true, hint: 'len() 傳回項目數目。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.85–91',
      intro: '在編輯器寫 Python，可以先按「▶ 執行」自己測試，再按「提交評核」。每次 `input()` 讀一行輸入。輸出要和要求完全一樣（包括提示文字）。',
      tasks: [
        { id: 'u5-w1', tier: '必做', pts: 10, title: '倒序列印五個整數', src: '教科書 p.85 測試站 5.1 第 5 題',
          q: '讀取五個整數（提示文字 `Input an integer: `），按輸入次序存入列表 `num`。然後輸出 `The inputted integers are:`，再**倒序**逐行輸出五個整數。',
          starter: C('num = [0, 0, 0, 0, 0]', 'for i in range(0, 5):', '    num[i] = int(input("Input an integer: "))', ''),
          ref: C('num = [0, 0, 0, 0, 0]', 'for i in range(0, 5):', '    num[i] = int(input("Input an integer: "))', 'print("The inputted integers are:")', 'for i in range(4, -1, -1):', '    print(num[i])'),
          tests: [{ inputs: '10\n5\n20\n15\n0' }, { inputs: '1\n2\n3\n4\n5' }, { inputs: '-7\n0\n0\n8\n-7' }, { inputs: '100\n99\n98\n97\n96' }],
          check: { out: true, vars: ['num'] },
          rules: [{ must: 'for', msg: '要用 for 循環倒序輸出。' }],
          hint: '`range(4, -1, -1)` 得 4、3、2、1、0。另一寫法：`range(0, 5)` 配 `num[4-i]`。' },
        { id: 'u5-w2', tier: '進階', pts: 12, title: '跑步記錄：總時間和平均時間', src: '教科書 p.88–89 例題 5.1',
          q: '重複讀取時間（`float(input("Input a record (input -1 to exit): "))`），輸入 **-1** 代表完成。把時間存入列表 `time`，然後：\n• 輸出 `Your record:` 和列表（`print("Your record:", time)`）\n• 如果沒有任何記錄，輸出 `No record` 便結束\n• 否則輸出 `Total amount of time:` 和總和，再輸出 `Average time:` 和平均值（同樣用 print 的逗號）\n例如輸入 14.9、15.5、16.1、15.8、-1，最後兩行是 `Total amount of time: 62.3` 和 `Average time: 15.575`。',
          starter: C('time = []', 'record = float(input("Input a record (input -1 to exit): "))', ''),
          ref: C('time = []', 'record = float(input("Input a record (input -1 to exit): "))', 'while record != -1:', '    time = time + [record]', '    record = float(input("Input a record (input -1 to exit): "))', 'print("Your record:", time)', 'N = len(time)', 'if N == 0:', '    print("No record")', 'else:', '    total = 0', '    for i in range(0, N):', '        total = total + time[i]', '    print("Total amount of time:", total)', '    print("Average time:", total/N)'),
          tests: [{ inputs: '14.9\n15.5\n16.1\n15.8\n-1' }, { inputs: '-1' }, { inputs: '12.5\n-1' }, { inputs: '10\n20\n30\n-1' }],
          check: { out: true, nums: true },
          rules: [{ must: 'while', msg: '要用 while 循環重複讀取，直至輸入 -1。' }],
          hint: '`while record != -1:` 內先把 record 加入列表，再讀下一個。之後用 `len(time)` 判斷有沒有記錄（否則除以 0 → ZeroDivisionError）。' },
        { id: 'u5-w3', tier: '挑戰', pts: 13, title: '平均分、平均偏差、標準差', src: '教科書 p.90–91 測試站 5.2',
          q: '先輸入學生人數 n（n ≥ 1），再逐行輸入 n 個測驗成績（整數，不用提示文字），存入列表 `mark`。逐行輸出：\n1. 平均分\n2. 平均偏差 = Σ|xᵢ − mean| ÷ n\n3. 標準差 = √(Σ(xᵢ − mean)² ÷ n)\n三個數都用 `round(…, 2)` 後才輸出。\n例如輸入 4、80、90、75、60，輸出 `76.25`、`8.75`、`10.83`。',
          starter: C('import math', 'n = int(input())', 'mark = []', ''),
          ref: C('import math', 'n = int(input())', 'mark = []', 'for i in range(0, n):', '    mark.append(int(input()))', 'total = 0', 'for i in range(0, n):', '    total = total + mark[i]', 'avg = total/n', 'mean_dev = 0', 'sd = 0', 'for i in range(0, n):', '    mean_dev = mean_dev + abs(mark[i] - avg)', '    sd = sd + (mark[i] - avg) ** 2', 'print(round(avg, 2))', 'print(round(mean_dev/n, 2))', 'print(round(math.sqrt(sd/n), 2))'),
          tests: [{ inputs: '4\n80\n90\n75\n60' }, { inputs: '1\n55' }, { inputs: '3\n70\n70\n70' }, { inputs: '8\n2\n4\n4\n4\n5\n5\n7\n9' }, { inputs: '2\n0\n100' }],
          check: { out: true, nums: true },
          hint: '先求平均分，才可以計算偏差，所以成績要先存入列表。`abs()` 可代替書中的 if…else；平方要用 `** 2`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.76–91、p.154',
      items: [
        { id: 'u5-q1', pts: 4, src: '教科書 p.154 課題練習 選擇題 1', tags: [TRAP0], verify: true,
          q: '以下 Python 程式的輸出是什麼？', code: C('list = [10, 23, 55]', 'print(list[2])'),
          options: ['10', '23', '55', 'list[2]'], answer: 'C', why: '索引由 0 開始，list[2] 是第 3 項 55。（用 `list` 作變量名稱會遮蓋內置的 list()，自己寫程式時最好避免。）' },
        { id: 'u5-q2', pts: 4, src: '教科書 p.154 課題練習 選擇題 2',
          q: '`list[0]` 和 `list[1]` 的數據類型分別是什麼？', code: C('list = [0] * 2', 'list[0] = "0"', 'list[1] = "integer"'),
          options: ['整數，字串', '字串，整數', '字串，字串', '整數，整數'], answer: 'C', why: '兩項都被賦值為有引號的字串；"0" 不是整數 0。' },
        { id: 'u5-q3', pts: 4, src: '教科書 p.154 課題練習 選擇題 3',
          q: '程式記錄一班學生的體重，用戶必須輸入 `-1` 才能終止。哪項最適合填上〔空格〕？', code: C('list = []', 'weight = float(input())', '〔空格〕', '    list = list + [weight]', '    weight = float(input())', 'print(list)'),
          options: ['while weight == -1:', 'while weight != -1:', 'if weight == -1:', 'if weight != -1:'], answer: 'B', why: '要重複輸入（while），而且不是 -1 時才繼續。' },
        { id: 'u5-q4', pts: 4, src: '教科書 p.154 課題練習 選擇題 4',
          q: '程式計算學生的平均身高。哪項最適合填上〔空格〕？', code: C('list2 = []', 'i = 0', 'total = 0', 'height = float(input())', 'while height != -1:', '    list2 = list2 + [height]', '    〔空格〕', '    height = float(input())', 'print("The mean is", total/i)'),
          options: ['total = total + height', 'total = total - height', 'total = total + height ／ i = i + 1（兩行）', 'total = total + height ／ i = i - 1（兩行）'], answer: 'C', why: '要累加總和，同時用 i 數算人數；只累加 total 的話 i 一直是 0 → ZeroDivisionError。' },
        { id: 'u5-q5', pts: 4, src: '自擬（DSE 風格，參考 p.82 活動 5.2）', tags: [HOT_ARR, TRAP0], verify: true,
          q: '以下程式的輸出是什麼？', code: C('A = [3, 1, 4, 1, 5]', 'for i in range(1, 5):', '    A[i] = A[i] * A[i-1]', 'print(A[4])'),
          options: ['5', '15', '60', '12'], answer: 'C', why: 'A 變成 [3, 3, 12, 12, 60]：每項乘上已更新的前一項。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyList', 'pyListAlgo'], intro: '隨機生成列表索引、len、更新項目及用循環求總和的題目，答案由 Python 計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
