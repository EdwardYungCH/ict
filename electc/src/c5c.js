/* 單元 c5c：數據結構（三）線性鏈表——節點、指示標、首項／空值指示標、刪除及加入節點、
 * 以陣列顯示鏈表、遍歷（length、printList）、delete(n)、insert(n)、雙向鏈表、鏈表與陣列的比較
 * 教科書 選修C 第 5 章 p.183–200；課題練習 4 p.206–207
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.188–190 例題 5.4(b) 三個鏈表表格中 Mong Kok（索引 6）的指示標印 1；按運算結果應為 4（同頁示意圖亦是 4）（同選C-20）。本單元 s4-t1 以 Python 驗算為 4。
 * 教科書疑似錯誤：p.187 例題 5.4(a)(iii) 答案「任何大於陣列的大小的數字」：等於陣列大小的數字（例如大小 10 時的 10）也不是有效索引，應為「大於或等於」（同選C-21 前半）。本單元 quiz q1 照「大於或等於」。
 */
const C = (...ls) => ls.join('\n');
const HOT_LL = { t: 'hot', why: '以陣列顯示的鏈表：DSE 2014 卷二D Q3' };

// 例題 5.4（p.187）港鐵站鏈表：索引 0 是首個節點 "start"，-1 是空指示標
const MTR = [
  'content = ["start", "", "Yau Ma Tei", "Whampoa", "", "Ho Man Tin",',
  '           "Mong Kok", "", "Wong Tai Sin", "Jordan"]',
  'pointer = [3, None, 6, 5, None, 2, -1, None, -1, 2]',
];
const TRAVERSE = ['cur = 0', 'names = []', 'while cur != -1:', '    names.append(content[cur])', '    cur = pointer[cur]', 'print(", ".join(names))'];
const MTR_OPS = [
  '',
  'def node_index(n):          # 第 n 個節點的索引（第 1 個是 start）',
  '    cur = 0',
  '    for k in range(n - 1):',
  '        cur = pointer[cur]',
  '    return cur',
  '',
  'def insert(n, station):     # 在第 n 個節點後加入新節點',
  '    i = content.index("")   # 找第一個空位',
  '    content[i] = station',
  '    before = node_index(n)',
  '    pointer[i] = pointer[before]     # 先導向新節點的指示標',
  '    pointer[before] = i              # 再導向上一個節點',
  '',
  'def delete(n):              # 刪除第 n 個節點',
  '    before = node_index(n - 1)',
  '    pointer[before] = pointer[pointer[before]]',
];
// 例題 5.5（p.194）：索引 1–6（索引 0 不用），10 代表空指示標
const D_NP = ['D = ["", "Iris", "Ada", "Peter", "", "Ben", ""]', 'NP = [0, 2, 10, 1, 0, 3, 0]'];

module.exports = {
  id: 'c5c',
  title: '數據結構（三）：線性鏈表',
  book: '教科書 選修C 第 5 章 p.183–200（另有 p.206–207 課題練習 4）',
  key: 'C-c5c-hmac-973db88220',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '鏈表的概念', pages: '教科書 p.149、p.183–186',
      learn: [
        { pts: [
          '**鏈表（linked list）**由許多**節點（node）**組成；每個節點儲存**數據**和一個**指示標**，指示標儲存**下一個節點**的位址（或索引）。（p.183）',
          '**首項指示標**指向第一個節點；最後一個節點的指示標是**空值指示標（null pointer）**，常用 −1 表示。（p.183）',
          '**刪除節點**：把上一個節點的指示標改為指向下一個節點，繞過被刪除的節點。被繞過的節點已無法存取，不必改它的指示標。（p.183）',
          '**加入節點**：① 先令新節點的指示標指向下一個節點；② 再令上一個節點指向新節點。次序調轉的話，下一個節點會失去指向它的指示標（內存泄漏）。（p.183 試想想）',
          '應用：檔案系統用鏈表連結一個檔案的所有分段（磁碟碎片化）。區塊鏈的概念也和鏈表相似。（p.149、p.184–185）',
        ] },
        { table: { head: ['', '鏈表', '陣列'], rows: [
          ['儲存的數據類型', '不同類型', '相同類型'],
          ['數據存取方法', '順序存取（跟着指示標由頭找）', '直接存取／隨機存取（用索引）'],
          ['存取數據的速度', '慢', '快'],
          ['加入或刪除數據的速度', '快（只改指示標）', '慢（要移動其他項目）'],
        ] }, cap: '表 5.1 比較鏈表和陣列（p.186）' },
        { h: '以陣列顯示鏈表（例題 5.4，p.187，參考 DSE 2014 卷二D Q3(a)）' },
        { pts: [
          '用兩個列表：`content` 儲存節點內容，`pointer` 儲存下一個節點的索引。陣列內的次序**不是**鏈表的次序。',
          '遍歷：由首個節點開始，`cur = pointer[cur]`，直至遇到空指示標 −1。',
          '沒有任何指示標指向的位置（例如 Jordan、Wong Tai Sin）不屬於這個鏈表。',
        ] },
        { sim: { code: C(...MTR, '', ...TRAVERSE), step: true, open: ['vars'] },
          cap: '例題 5.4(a)（p.187）：按「下一步」，看 cur 怎樣跟着指示標跳：0 → 3 → 5 → 2 → 6 → −1。' },
      ],
      tries: [
        { id: 'c5c-s1-t1', pts: 4, src: '教科書 p.187 例題 5.4(a)(i)', code: C(...MTR, '', ...TRAVERSE),
          q: '先估：輸出是什麼？', options: ['start, Whampoa, Ho Man Tin, Yau Ma Tei, Mong Kok', 'start, Yau Ma Tei, Whampoa, Ho Man Tin, Mong Kok, Wong Tai Sin, Jordan', 'start, Whampoa, Ho Man Tin, Yau Ma Tei, Mong Kok, Jordan', 'start, Jordan, Yau Ma Tei, Mong Kok'],
          why: '由索引 0 開始跟指示標：0 → 3（Whampoa）→ 5（Ho Man Tin）→ 2（Yau Ma Tei）→ 6（Mong Kok）→ −1 結束。' },
      ],
      practice: [
        { id: 'c5c-s1-p1', type: 'mc', pts: 2, src: '教科書 p.186 表 5.1',
          q: '以下哪一項是鏈表**比陣列優勝**的地方？',
          options: ['可以用索引直接存取第 k 個項目', '加入或刪除數據時只須改變指示標，速度較快', '佔用較少記憶體', '可以用對分檢索'], answer: 1,
          hint: '陣列加入或刪除要把後面的項目逐一移動；鏈表只改指示標。存取第 k 個項目則是陣列較快。' },
        { id: 'c5c-s1-p2', type: 'mc', pts: 2, src: '教科書 p.183 試想想',
          q: '在節點 A、B 之間加入新節點 E。為什麼要**先**令 E 的指示標指向 B，**才**令 A 指向 E？',
          options: ['因為 E 的數據比 A 小', '若先改 A 的指示標，便沒有指示標指向 B，B 及之後的節點會失去連結（內存泄漏）', '因為鏈表只可以在末端加入節點', '兩個步驟的次序沒有影響'], answer: 1,
          hint: 'A 原本是唯一指向 B 的節點。' },
        { id: 'c5c-s1-p3', type: 'fill', pts: 2, src: '教科書 p.187 例題 5.4(a)(ii)',
          q: '包括首個節點，這個鏈表共有多少個節點？最後一個節點的內容是什麼？',
          code: C(...MTR, 'count = 0', 'cur = 0', 'while cur != -1:', '    count = count + 1', '    last = content[cur]', '    cur = pointer[cur]'),
          blanks: [{ label: 'count', ask: { var: 'count' } }, { label: 'last', ask: { var: 'last' } }],
          hint: '只計跟着指示標走到的節點。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '遍歷鏈表：長度及列印', pages: '教科書 p.194–200',
      learn: [
        { pts: [
          '例題 5.5：陣列 `D` 儲存節點內容，陣列 `NP` 儲存下一個節點的索引；全程變量 `start` 儲存首個節點的索引；**10** 代表空指示標。（p.194）',
          '`length()`：由 start 開始，每走一個節點 l 加 1，`next ← NP[next]`，直至遇到空指示標。（p.195 (c)）',
          '`printList()`：同樣的循環，每次輸出 `schedule[current]`。（p.200 測試站 5.5，空指示標用 null；Python 可用 `None`）',
          '教科書變量叫 `next`；它也是 Python 內置函數的名稱，下面程式改叫 `nxt`。',
        ] },
        { sim: { code: C(...D_NP, 'start = 5', '', 'def length():', '    l = 0', '    nxt = start', '    while nxt != 10:', '        l = l + 1', '        print(D[nxt])', '        nxt = NP[nxt]', '    return l', '', 'print("長度:", length())'), step: true, open: ['vars'] },
          cap: '例題 5.5(a)、(c)（p.194–197）：索引 0 不用，跟教科書一樣由 1 開始。' },
      ],
      tries: [
        { id: 'c5c-s2-t1', pts: 4, src: '教科書 p.194 例題 5.5(a)(i)',
          code: C(...D_NP, 'start = 5', 'nxt = start', 'while nxt != 10:', '    print(D[nxt], end=" ")', '    nxt = NP[nxt]'),
          q: '先估：輸出是什麼？', options: ['Ben Peter Iris Ada', 'Iris Ada Peter Ben', 'Ben Iris Ada', 'Ada Iris Peter Ben'],
          why: '5（Ben）→ NP[5] = 3（Peter）→ NP[3] = 1（Iris）→ NP[1] = 2（Ada）→ NP[2] = 10，結束。' },
      ],
      practice: [
        { id: 'c5c-s2-p1', type: 'complete', pts: 3, src: '教科書 p.195 例題 5.5(c)',
          q: '完成子程式 `length()`。程式會輸入首個節點的索引 start（測試會用不同的 start）。',
          template: C(...D_NP, 'start = int(input())', '', 'def length():', '    l = 0', '    nxt = start', '    while nxt != ［1］:', '        l = ［2］', '        nxt = ［3］', '    return l', '', 'print(length())'),
          ref: ['10', 'l + 1', 'NP[nxt]'], tests: [{ inputs: '5' }, { inputs: '3' }, { inputs: '2' }],
          hint: '空指示標是 10；指示標向前移動：`nxt = NP[nxt]`。' },
        { id: 'c5c-s2-p2', type: 'complete', pts: 3, src: '教科書 p.200 測試站 5.5(b)',
          q: '完成 `printList()`，順序列印時間表的活動。空指示標用 `None`。程式會輸入首個節點的索引 monday。',
          template: C('schedule = ["dinner", "japanese", "painting", "", "yoga", "tea"]', 'ptr = [2, None, 5, None, 1, 4]', 'monday = int(input())', '', 'def printList():', '    current = ［1］', '    while current != ［2］:', '        print(［3］)', '        current = ［4］', '', 'printList()'),
          ref: ['monday', 'None', 'schedule[current]', 'ptr[current]'], tests: [{ inputs: '2' }, { inputs: '0' }, { inputs: '4' }],
          hint: '教科書答案：monday、null（Python 用 None）、schedule[current]、ptr[current]。' },
        { id: 'c5c-s2-p3', type: 'fill', pts: 2, src: '教科書 p.206 課題練習 4(a)',
          q: '定向活動的檢查點鏈表（索引 1–10，−1 代表空指示標），首個檢查點的索引是 7。寫出檢查點數目及最後一個檢查點。',
          code: C('CP = ["", "cinema", "", "gas station", "", "substation", "coffee shop", "park", "", "sports ground", "hotel"]', 'P = [0, 6, 0, -1, 0, 9, 5, 1, 0, -1, 3]', 'cur = 7', 'count = 0', 'while cur != -1:', '    count = count + 1', '    last = CP[cur]', '    cur = P[cur]'),
          blanks: [{ label: 'count', ask: { var: 'count' } }, { label: 'last', ask: { var: 'last' } }],
          hint: 'park → cinema → coffee shop → substation → sports ground。gas station、hotel 不在這個鏈表內。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '刪除節點', pages: '教科書 p.183、p.187–189、p.195–198',
      learn: [
        { pts: [
          '刪除**第一個**節點：只須 `start ← NP[start]`。（例題 5.5(d)，p.197）',
          '刪除第 n 個節點（n ≥ 2）：用 `prev`、`current` 兩個指示標，由第 1、2 個節點開始一起向前移，直至 current 到達第 n 個節點；然後 `NP[prev] ← NP[current]`。（p.197）',
          '被刪除的節點仍留在陣列內（內容及指示標都沒有改），只是沒有指示標指向它。',
        ] },
        { sim: { code: C(...D_NP, 'start = 5', '', 'def delete(n):', '    global start', '    if n == 1:', '        start = NP[start]', '    else:', '        prev = start', '        current = NP[start]', '        for k in range(2, n):', '            prev = current', '            current = NP[current]', '        NP[prev] = NP[current]', '', 'delete(3)', 'print("NP:", NP[1:])', 'nxt = start', 'while nxt != 10:', '    print(D[nxt], end=" ")', '    nxt = NP[nxt]'), step: true, open: ['vars'] },
          cap: '例題 5.5(b)(i)、(d)（p.194–198）：刪除第 3 個節點 Iris。教科書「設 k 由 2 至 n−1」寫成 `range(2, n)`。' },
      ],
      tries: [
        { id: 'c5c-s3-t1', pts: 4, src: '教科書 p.194 例題 5.5(b)(i)',
          code: C(...D_NP, 'start = 5', '', 'def delete(n):', '    global start', '    if n == 1:', '        start = NP[start]', '    else:', '        prev = start', '        current = NP[start]', '        for k in range(2, n):', '            prev = current', '            current = NP[current]', '        NP[prev] = NP[current]', '', 'delete(3)', 'print(NP[1:6])'),
          q: '先估：輸出是什麼？（即 NP[1] 至 NP[5]）', options: ['[2, 10, 2, 0, 3]', '[2, 10, 1, 0, 3]', '[10, 10, 2, 0, 3]', '[2, 10, 2, 0, 1]'],
          why: '第 3 個節點是 Iris（索引 1）；它的上一個節點是 Peter（索引 3），所以 NP[3] 改為 NP[1] = 2。Iris 本身的 NP[1] 不變。' },
      ],
      practice: [
        { id: 'c5c-s3-p1', type: 'complete', pts: 3, src: '教科書 p.195 例題 5.5(d)',
          q: '完成子程式 `delete(n)`。程式會輸入 n，刪除後輸出鏈表內容。會測試刪除第 1 至第 4 個節點。',
          template: C(...D_NP, 'start = 5', '', 'def delete(n):', '    global start', '    if n == 1:', '        start = ［1］', '    else:', '        prev = start', '        current = NP[start]', '        for k in range(2, n):', '            prev = ［2］', '            current = ［3］', '        NP[prev] = ［4］', '', 'delete(int(input()))', 'nxt = start', 'while nxt != 10:', '    print(D[nxt], end=" ")', '    nxt = NP[nxt]'),
          ref: ['NP[start]', 'current', 'NP[current]', 'NP[current]'], tests: [{ inputs: '1' }, { inputs: '2' }, { inputs: '3' }, { inputs: '4' }],
          hint: 'prev 移到 current 的位置，current 再向前一步；最後令 prev 繞過 current。' },
        { id: 'c5c-s3-p2', type: 'mc', pts: 2, src: '教科書 p.187–189 例題 5.4(b)（參考 DSE 2014 卷二D Q3(a)）',
          q: '港鐵站鏈表 start（索引 0，指示標 3）→ Whampoa（索引 3，指示標 5）→ Ho Man Tin（索引 5）→ …。執行 `delete(2)` 刪除第 2 個節點 Whampoa，要改變哪一個數值？',
          options: ['索引 3 的指示標改為 −1', '索引 0 的指示標改為 5', '索引 5 的指示標改為 0', '把索引 3 的內容改為空白'], answer: 1,
          hint: '只須令上一個節點（start）繞過 Whampoa，指向 Whampoa 的下一個節點（索引 5）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '加入節點與雙向鏈表', pages: '教科書 p.184、p.187–199、p.207',
      learn: [
        { pts: [
          '在第 n 個節點**之後**加入新節點（例題 5.4）：把內容放在一個空位 i；`pointer[i] ← pointer[第 n 個節點]`，再 `pointer[第 n 個節點] ← i`。（p.188–189）',
          '新節點**成為第 n 個節點**（例題 5.5 挑戰題）：n = 1 時 `NP[i] ← start`、`start ← i`；否則先找出第 n − 1 個節點 prev，`NP[i] ← current`、`NP[prev] ← i`。（p.199）',
          '**雙向鏈表**：每個節點有 `prev`、`next` 兩個指示標。好處：可以從兩個方向存取；壞處：要用較多記憶體，加入／刪除時要改多個指示標。（p.184、p.192）',
          '**循環鏈表**：最後一個節點指回第一個節點。（p.184）',
        ] },
        { sim: { code: C(...MTR, ...MTR_OPS, '', 'insert(5, "Kowloon Tong")', 'insert(5, "Prince Edward")', 'delete(2)', 'print(pointer)', ...TRAVERSE), step: true, open: ['vars'] },
          cap: '例題 5.4(b)（p.187–190）：`insert(n, station)` 在第 n 個節點後加入，`delete(n)` 刪除第 n 個節點。新節點放在第一個空位。' },
      ],
      tries: [
        { id: 'c5c-s4-t1', pts: 4, src: '教科書 p.187–190 例題 5.4(b)（教科書表格有誤，見本單元檔頭）',
          tags: [{ t: 'trap', why: '教科書答案表把 Mong Kok 的指示標印成 1' }],
          code: C(...MTR, ...MTR_OPS, '', 'insert(5, "Kowloon Tong")', 'insert(5, "Prince Edward")', 'delete(2)', 'print(pointer[0], pointer[6], pointer[4])'),
          q: '先估：最後索引 0（start）、索引 6（Mong Kok）、索引 4（Prince Edward）的指示標是什麼？', options: ['5 4 1', '5 1 1', '3 4 1', '5 4 -1'],
          why: 'Kowloon Tong 放在索引 1，接在 Mong Kok 後；Prince Edward 放在索引 4，也接在第 5 個節點 Mong Kok 後，所以 Mong Kok → 4 → 1。教科書答案表印「1」是錯的。delete(2) 令 start 指向 5。' },
        { id: 'c5c-s4-t2', pts: 4, src: '教科書 p.193 測試站 5.4(b)（參考 DSE 2014 卷二D Q3(d)）',
          code: C('content = ["start", "Teresa", "Benson", "Joyce", "Kyle", "Vicky", "Daniel", "Mike"]', 'ptr = [3, 10, 13, 6, 6, 2, 6, 3]      # 每個 ptr = prev + next', 'prev = -1', 'cur = 0', 'for k in range(4):', '    nxt = ptr[cur] - prev', '    prev = cur', '    cur = nxt', '    print(content[cur], end=" ")'),
          q: '先估：鏈表 L2 每個節點只儲存 prev + next 的總和。輸出 start 後的四個節點是什麼？', options: ['Kyle Daniel Benson Mike', 'Joyce Vicky Benson Mike', 'Kyle Daniel Daniel Daniel', 'Teresa Benson Joyce Kyle'],
          why: '已知上一個節點，便可以 next = ptr − prev：3 − (−1) = 4（Kyle）；6 − 0 = 6（Daniel）；6 − 4 = 2（Benson）；13 − 6 = 7（Mike）。' },
      ],
      practice: [
        { id: 'c5c-s4-p1', type: 'complete', pts: 3, src: '教科書 p.199 例題 5.5 挑戰題',
          q: '完成 `insert(n, name, i)`：加入內容為 name、索引為 i 的節點，成為第 n 個節點。程式會輸入 n，把 "Brian" 放在索引 4。',
          template: C(...D_NP, 'start = 5', '', 'def insert(n, name, i):', '    global start', '    D[i] = name', '    if n == 1:', '        NP[i] = ［1］', '        start = i', '    else:', '        prev = start', '        current = NP[start]', '        for k in range(2, n):', '            prev = current', '            current = NP[current]', '        NP[i] = ［2］', '        NP[prev] = ［3］', '', 'insert(int(input()), "Brian", 4)', 'nxt = start', 'while nxt != 10:', '    print(D[nxt], end=" ")', '    nxt = NP[nxt]'),
          ref: ['start', 'current', 'i'], tests: [{ inputs: '1' }, { inputs: '2' }, { inputs: '4' }, { inputs: '5' }],
          hint: '先令新節點指向原本的第 n 個節點（current），再令第 n − 1 個節點（prev）指向新節點。' },
        { id: 'c5c-s4-p2', type: 'mc', pts: 2, src: '教科書 p.192 例題 5.4 第 2 題(c)、p.207 課題練習 4(c)',
          q: '把單向鏈表改為**雙向鏈表**，以下哪一項描述正確？',
          options: ['可以從兩個方向存取節點，但須要使用較多記憶體', '可以用索引直接存取節點，而且記憶體較少', '不再需要空值指示標', '加入節點時只須改一個指示標'], answer: 0,
          hint: '每個節點多了一個 prev 指示標。' },
        { id: 'c5c-s4-p3', type: 'mc', pts: 1, src: '教科書 p.207 課題練習 4(d)',
          q: '雙向鏈表 park（索引 7）→ cinema → coffee shop → substation → sports ground（索引 9）。要令終點返回起點（變成循環），要更新哪兩個指示標？',
          options: ['park 的 next 改為 9，sports ground 的 prev 改為 7', 'park 的 prev 改為 9，sports ground 的 next 改為 7', 'cinema 的 prev 改為 9，substation 的 next 改為 7', '只須 sports ground 的 next 改為 1'], answer: 1,
          hint: '起點 park 原本的 prev 是 −1，終點 sports ground 原本的 next 是 −1。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.183–200',
      intro: '在編輯器寫 Python 程式，先按 ▶ 自己測試，再按「提交評核」。每個 `input()` 讀一行輸入。',
      tasks: [
        { id: 'c5c-w1', pts: 15, title: '遍歷鏈表', src: '教科書 p.195、p.200',
          q: '第一行輸入節點位置的數目 m（索引 0 至 m−1）。之後 m 行，每行是該位置的「內容 指示標」，以一個空格分隔（內容沒有空格；−1 是空指示標）。最後一行輸入首個節點的索引 start。\n順序輸出鏈表每個節點的內容（每個一行），最後輸出 `共 k 個節點`。\n例如輸入 3、`Ada -1`、`Ben 0`、`Cat 1`、`2`，輸出 Cat、Ben、Ada、共 3 個節點。',
          starter: C('m = int(input())', 'content = []', 'pointer = []', 'for i in range(m):', '    parts = input().split()', '    content.append(parts[0])', '    pointer.append(int(parts[1]))', 'start = int(input())', '# 在這裏完成'),
          ref: C('m = int(input())', 'content = []', 'pointer = []', 'for i in range(m):', '    parts = input().split()', '    content.append(parts[0])', '    pointer.append(int(parts[1]))', 'start = int(input())', 'k = 0', 'cur = start', 'while cur != -1:', '    print(content[cur])', '    k = k + 1', '    cur = pointer[cur]', 'print("共", k, "個節點")'),
          tests: [
            { inputs: C('3', 'Ada -1', 'Ben 0', 'Cat 1', '2') },
            { inputs: C('6', 'dinner 2', 'japanese -1', 'painting 5', 'x -1', 'yoga 1', 'tea 4', '2') },
            { inputs: C('1', 'solo -1', '0') },
            { inputs: C('6', 'a 3', 'b -1', 'c 0', 'd 5', 'e -1', 'f 1', '2') },
            { inputs: C('4', 'p -1', 'q 0', 'r -1', 's 1', '0') },
          ],
          hint: '`cur = start`；當 `cur != -1`：輸出 `content[cur]`、計數、`cur = pointer[cur]`。陣列中沒有被指向的位置不用輸出。' },
        { id: 'c5c-w2', pts: 20, title: '按次序加入節點（有序鏈表）', src: '教科書 p.188–189、p.199（自擬延伸）',
          q: '用兩個列表 `data`、`nxt` 和首項指示標 `head`（−1 代表空）建立一個**由小至大**的鏈表。\n第一行輸入 n，之後輸入 n 個整數，每輸入一個：把它加到列表末端的新位置（`data.append(x)`、`nxt.append(-1)`），再**只改指示標**把它接到鏈表的正確位置（相同的數放在已有的數之後）。\n最後：第一行順序輸出鏈表的數字（以空格分隔），第二行輸出 `print(nxt)`。\n**不可**使用 sort 或 sorted。',
          starter: C('data = []', 'nxt = []', 'head = -1', 'n = int(input())', 'for k in range(n):', '    x = int(input())', '    data.append(x)', '    nxt.append(-1)', '    i = len(data) - 1', '    # 在這裏把節點 i 接到正確位置', '', 'cur = head', 'while cur != -1:', '    print(data[cur], end=" ")', '    cur = nxt[cur]', 'print()', 'print(nxt)'),
          ref: C('data = []', 'nxt = []', 'head = -1', 'n = int(input())', 'for k in range(n):', '    x = int(input())', '    data.append(x)', '    nxt.append(-1)', '    i = len(data) - 1', '    if head == -1 or x < data[head]:', '        nxt[i] = head', '        head = i', '    else:', '        prev = head', '        while nxt[prev] != -1 and data[nxt[prev]] <= x:', '            prev = nxt[prev]', '        nxt[i] = nxt[prev]', '        nxt[prev] = i', '', 'cur = head', 'while cur != -1:', '    print(data[cur], end=" ")', '    cur = nxt[cur]', 'print()', 'print(nxt)'),
          rules: [{ mustNot: 'sort', msg: '這題要用指示標排列，不可用 sort／sorted。' }],
          tests: [
            { inputs: C('4', '50', '20', '70', '40') },
            { inputs: C('1', '9') },
            { inputs: C('5', '5', '4', '3', '2', '1') },
            { inputs: C('5', '1', '2', '3', '4', '5') },
            { inputs: C('4', '30', '10', '30', '20') },
          ],
          hint: '分兩種情況：① 鏈表是空的或 x 比首個節點小 → 新節點成為首個節點（`nxt[i] = head`、`head = i`）；② 否則由 head 開始找最後一個「≤ x」的節點 prev，然後先 `nxt[i] = nxt[prev]`，再 `nxt[prev] = i`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.149、p.185–207',
      items: [
        { id: 'c5c-q1', pts: 4, src: '教科書 p.187 例題 5.4(a)(iii)（參考 DSE 2014 卷二D Q3(a)）', tags: [HOT_LL],
          q: '鏈表以索引 0 至 9 的陣列顯示，−1 代表空指示標。以下哪一個數值**不能**用作空指示標？',
          options: ['−5', '9', '10', '99'], answer: 'B',
          why: '空指示標必須不是有效索引：任何負數，或大於或等於陣列大小（10）的數字。9 是有效索引。' },
        { id: 'c5c-q2', pts: 4, src: '教科書 p.206 課題練習 4(a)(i)', tags: [HOT_LL], verify: true,
          q: '首個檢查點的索引是 7。以下程式的輸出是什麼？',
          code: C('CP = ["", "cinema", "", "gas station", "", "substation", "coffee shop", "park", "", "sports ground", "hotel"]', 'P = [0, 6, 0, -1, 0, 9, 5, 1, 0, -1, 3]', 'cur = 7', 'while P[cur] != -1:', '    cur = P[cur]', 'print(CP[cur], P[5])'),
          options: ['sports ground 9', 'gas station 9', 'hotel 3', 'sports ground -1'], answer: 'A',
          why: '循環在 P[cur] 是 −1 時停止，cur 停在最後一個節點（索引 9 sports ground）。P[5] 是 9。' },
        { id: 'c5c-q3', pts: 4, src: '教科書 p.193 測試站 5.4(a)（參考 DSE 2014 卷二D Q3(d)）', verify: true,
          q: '雙向鏈表 L1 的 prev、next 如下。若改用 L2，每個節點只儲存 prev + next 的總和，Jessica（索引 5）的 pointer 是多少？',
          code: C('prev = [-1, 0, 0, 0, 5, 2]', 'nxt  = [2, 0, 5, 0, -1, 4]', '# 索引 0 start、2 Andy、4 Tracy、5 Jessica', 'print(prev[5] + nxt[5])'),
          options: ['4', '6', '7', '2'], answer: 'B',
          why: 'Jessica 的 prev 是 2（Andy）、next 是 4（Tracy），2 + 4 = 6。教科書答案：start 1、Andy 5、Tracy 4、Jessica 6。' },
        { id: 'c5c-q4', pts: 4, src: '教科書 p.185–186 表 5.1',
          q: '一個程式經常要讀取「第 k 個」項目，但很少加入或刪除項目。應選用哪一種數據結構？為什麼？',
          options: ['鏈表，因為順序存取速度快', '陣列，因為可以用索引直接存取', '鏈表，因為可以儲存不同類型的數據', '陣列，因為加入和刪除數據的速度快'], answer: 'B',
          why: '陣列是直接（隨機）存取；鏈表要跟着指示標由頭找（順序存取）。陣列加入、刪除反而較慢。' },
        { id: 'c5c-q5', pts: 4, src: '教科書 p.149 應用與職涯',
          q: '區塊鏈的概念與鏈表相似。以下哪一個操作可以在鏈表進行，但**不能**在區塊鏈進行？',
          options: ['由第一個節點／區塊開始逐一存取', '在中間加入新的節點／區塊', '每個節點／區塊儲存數據', '每個節點／區塊連繫到另一個節點／區塊'], answer: 'B',
          why: '區塊鏈不能刪除某些區塊，也不能在中間加入新區塊；鏈表可以。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyList', 'pyWhile', 'pyFunc'], intro: '隨機生成列表、while 循環及子程式題目，鞏固遍歷鏈表所需的技巧。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
