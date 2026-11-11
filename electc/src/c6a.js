/* 單元 c6a：檢索——線性檢索（for／while、旗標、找出所有位置、比較次數）、改良線性檢索、
 * 對分檢索（概念、程式、由大至小排序的列表、leftMost／rightMost）、效率比較
 * 教科書 選修C 第 6 章 p.210–227
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.213 例題 6.1(b) 平均檢索次數答 250；按同頁公式 (N + 1) / 2 應為 250.5（書中以 N / 2 近似，未說明）（同選C-36）。本單元 s1-p3 以 N = 10 驗算 (N + 1) / 2 = 5.5。
 * 教科書疑似錯誤：p.225 測試站 6.2(a) 答案只比較首字母 `name[0] < keywords[mid][0]`；同字母開頭的關鍵字會檢索失敗（同選C-23）。本單元 s4-p1 以 ["and", "as", "assert", "break", "class"] 檢索 "and" 示範（輸出 Available for use）。
 * 教科書疑似錯誤：p.220、p.227 把對分檢索最多次數寫成 log₂N；準確應為 ⌊log₂N⌋ + 1（N = 10 時 4 次、N = 300 時 9 次，與測試站 6.2(b) 答案 9 次一致）（同選C-24）。本單元 s4 以程式驗算。
 * 教科書疑似錯誤：p.221 例題 6.2(b)(iii) count(18) 答案 0 要假設 N = 10（只顯示首十項）（同選C-22）；本單元的列表只有這十項。
 */
const C = (...ls) => ls.join('\n');
const HOT_SEARCH = { t: 'hot', why: '線性／對分檢索：DSE 2018 卷二D Q3、2019 卷二D Q2' };

const MARK_U = 'mark = [79, 50, 85, 64, 97, 88, 80, 75, 50, 65]';
const MARK_S = 'mark = [50, 51, 64, 65, 75, 79, 80, 85, 88, 97]';
const LIN_WHILE = [MARK_U, 'target = int(input())', 'found = False', 'i = 0', 'while i < len(mark) and found == False:', '    if target == mark[i]:', '        found = True', '    i = i + 1', 'print(found)'];
const BIN = [MARK_S, 'start = 0', 'end = len(mark)-1', 'target = int(input())', 'found = False', 'while start <= end and found == False:', '    mid = int((start + end)/2)', '    if mark[mid] == target:', '        found = True', '    else:', '        if target < mark[mid]:', '            end = mid - 1', '        else:', '            start = mid + 1', 'if found == True:', '    print("Found at index", mid)', 'else:', '    print("Not found")'];
const AGE = 'age = [50, 48, 43, 38, 38, 38, 29, 29, 25, 19]';
const SBB = ['def SearchByBinary(target):', '    start = 0', '    end = len(age) - 1', '    while start <= end:', '        mid = (start + end) // 2', '        if age[mid] == target:', '            return mid', '        elif age[mid] > target:', '            start = mid + 1', '        else:', '            end = mid - 1', '    return -1'];
const LR = ['def rightMost(index):', '    right = index', '    while right < len(age) - 1 and age[right + 1] == age[index]:', '        right = right + 1', '    return right', '', 'def leftMost(index):', '    left = index', '    while left > 0 and age[left - 1] == age[index]:', '        left = left - 1', '    return left', '', 'def count(target):', '    index = SearchByBinary(target)', '    if index == -1:', '        return 0', '    return rightMost(index) - leftMost(index) + 1'];

module.exports = {
  id: 'c6a',
  title: '檢索：線性檢索與對分檢索',
  book: '教科書 選修C 第 6 章 p.210–227',
  key: 'C-c6a-hmac-c184a82eaa',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '線性檢索', pages: '教科書 p.210–213',
      learn: [
        { pts: [
          '**檢索（searching）**：在列表中找出與目標值相同的記錄。（p.210）',
          '**線性檢索（順序檢索）**：由索引 0 開始逐一比較，直至找到目標值或到達最後一項。**適用於未排序的列表**。（p.210）',
          '**旗標（flag）**：監視程式狀態的變量，例如 `found`。先假設找不到（False），找到才轉為 True。（p.211）',
          '用 for 循環：一定比較 N 次。改用 while 循環加上條件 `found == False`：找到便停止，效率較高。（p.211）',
          '要找出**所有**位置（列表有重複的值），便不能找到第一個就停止。用 `index = -1` 表示找不到。（p.212）',
          '比較次數（N 個項目）：最好 1 次；最壞 N 次（在最後或不存在）；平均 (1 + 2 + … + N) / N = **(N + 1) / 2** ≈ N / 2。（p.213 例題 6.1，參考 DSE 2018 卷二D Q3(c)）',
        ] },
        { table: { head: ['target', 'for 循環', 'while 循環', ''], rows: [['79', '10 次', '1 次', '最好的情況'], ['50', '10 次', '2 次', ''], ['85', '10 次', '3 次', ''], ['100', '10 次', '10 次', '最差的情況']] }, cap: '條件 `target == mark[i]` 的判斷次數（p.211）' },
        { sim: { code: C(...LIN_WHILE), inputs: '85', step: true, open: ['vars'] }, cap: 'while 循環的線性檢索（p.211）。輸入 85，數一數第 6 行執行了多少次。' },
      ],
      tries: [
        { id: 'c6a-s1-t1', pts: 4, src: '教科書 p.211', code: C(...LIN_WHILE), inputs: '50', ask: { count: 6 },
          q: '先估：輸入 50 時，第 6 行 `if target == mark[i]:` 執行了多少次？', options: ['2', '9', '10', '1'],
          why: 'mark[1] 已是 50，found 變成 True，循環停止。列表後面另一個 50（索引 8）不會再比較。' },
      ],
      practice: [
        { id: 'c6a-s1-p1', type: 'mc', pts: 2, src: '教科書 p.212', verify: true,
          q: '以下程式的輸出是什麼？',
          code: C(MARK_U, 'target = 50', 'index = -1', 'for i in range(0, len(mark)):', '    if target == mark[i]:', '        index = i', '        print(i, end=" ")', 'if index == -1:', '    print("No result is found.")'),
          options: ['1 8', '1', '8', 'No result is found.'], answer: 0,
          hint: 'for 循環會檢查全部項目，兩個 50 的索引都會輸出。' },
        { id: 'c6a-s1-p2', type: 'fill', pts: 2, src: '教科書 p.211 表', inputs: '100',
          q: '輸入 100（不在列表中）。第 6 行執行了多少次？這是最好還是最壞的情況？',
          code: C(...LIN_WHILE),
          blanks: [{ label: '第 6 行執行次數', ask: { count: 6 } }, { label: '最好／最壞', a: '最壞', accept: ['最壞的情況', '最差', '最差的情況'] }],
          hint: '找不到便要比較全部 N 個項目。' },
        { id: 'c6a-s1-p3', type: 'fill', pts: 2, src: '教科書 p.213 例題 6.1(b) 分析（答案有近似，見本單元檔頭）',
          q: '以下程式逐一檢索列表中每一個值，計算平均比較次數（列表沒有重複的值）。寫出 avg；再用公式 (N + 1) / 2 計算 N = 500 時的平均檢索次數。',
          code: C('mark = [79, 51, 85, 64, 97, 88, 80, 75, 50, 65]', 'total = 0', 'for target in mark:', '    i = 0', '    while i < len(mark) and mark[i] != target:', '        i = i + 1', '    total = total + (i + 1)', 'avg = total / len(mark)'),
          blanks: [{ label: 'avg（N = 10）', ask: { var: 'avg' } }, { label: 'N = 500 的平均次數', a: '250.5' }],
          hint: '(1 + 2 + … + 10) / 10 = 5.5。教科書例題 6.1(b) 答 250，是用 N / 2 近似；準確是 (500 + 1) / 2。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '改良線性檢索', pages: '教科書 p.214',
      learn: [
        { pts: [
          '測試站 6.1：`found = -1` 表示未找到；找到時 `found = i`。在 while 加上 `found == -1`，找到便停止。（p.214，參考 DSE 2018 卷二D Q3(d)）',
          '只把列表排序，檢索方法不變的話，效率**沒有改善**（平均仍約 n / 2 次）。',
          '列表**由小至大**排序時，可再加條件 `staff_no >= retire[i]`：遇到比目標大的項目，餘下的項目一定更大，可以立即停止。',
          '列表**由大至小**排序時，條件改為 `staff_no <= retire[i]`。（試想想）',
        ] },
        { sim: { code: C('retire = [4497, 5557, 5568, 5790, 7924]', 'staff_no = int(input())', 'found = -1', 'i = 0', 'while i < len(retire) and found == -1 and staff_no >= retire[i]:', '    if staff_no == retire[i]:', '        found = i', '    i = i + 1', 'print(found)'), inputs: '5000', step: true, open: ['vars'] },
          cap: '已由小至大排序的列表：輸入 5000，看循環怎樣在 5557 前停止。' },
      ],
      tries: [
        { id: 'c6a-s2-t1', pts: 4, src: '教科書 p.214 測試站 6.1(b)(ii)',
          code: C('retire = [4497, 5557, 5568, 5790, 7924]', 'staff_no = int(input())', 'found = -1', 'i = 0', 'while i < len(retire) and found == -1 and staff_no >= retire[i]:', '    if staff_no == retire[i]:', '        found = i', '    i = i + 1', 'print(found)'),
          inputs: '5700', ask: { count: 6 },
          q: '先估：輸入 5700（不在列表中），第 6 行 `if staff_no == retire[i]:` 執行了多少次？', options: ['3', '4', '5', '1'],
          why: '4497、5557、5568 都 ≤ 5700，要比較；到 5790 時 5700 >= 5790 不成立，循環停止。不用比較全部 5 個。' },
      ],
      practice: [
        { id: 'c6a-s2-p1', type: 'complete', pts: 3, src: '教科書 p.214 測試站 6.1(a)',
          q: '在 while 循環加入條件，令程式找到員工編號後立即停止。會用多組數據測試，並檢查比較次數。',
          template: C('retire = [4497, 5557, 5568, 7924, 5790]', 'staff_no = int(input())', 'found = -1', 'i = 0', 'checks = 0', 'while i < len(retire) and ［1］:', '    checks = checks + 1', '    if staff_no == retire[i]:', '        found = i', '    i = i + 1', 'print(found, checks)'),
          ref: ['found == -1'], tests: [{ inputs: '4497' }, { inputs: '7924' }, { inputs: '5790' }, { inputs: '1234' }],
          hint: '還未找到時 found 仍是 −1。' },
        { id: 'c6a-s2-p2', type: 'mc', pts: 2, src: '教科書 p.214 測試站 6.1(b)(ii)（參考 DSE 2018 卷二D Q3(d)）',
          q: '列表 retire 已**由小至大**排序。輸入的編號不在記錄中是最壞情況之一。應在 while 再加入哪個條件以改善效率？',
          options: ['and staff_no >= retire[i]', 'and staff_no <= retire[i]', 'and staff_no != retire[i]', 'and i < len(retire) // 2'], answer: 0,
          hint: '遇到比目標大的項目便停止，所以繼續的條件是目標仍然 ≥ 項目。' },
        { id: 'c6a-s2-p3', type: 'mc', pts: 1, src: '教科書 p.214 試想想',
          q: '若列表改為**由大至小**排序，上題的條件應改為什麼？',
          options: ['and staff_no >= retire[i]', 'and staff_no <= retire[i]', 'and staff_no == retire[i]', '不用改'], answer: 1,
          hint: '由大至小時，遇到比目標小的項目便可停止。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '對分檢索', pages: '教科書 p.215–224',
      learn: [
        { pts: [
          '**對分檢索（二分檢索）**：**只能用於已排序的列表**。（p.215）',
          '每次比較檢索範圍**中間**的項目 `mid = (start + end) // 2`（取整數）：相同便結束；目標較小便 `end = mid - 1`（前半部分）；目標較大便 `start = mid + 1`（後半部分）。（p.215–217）',
          '循環條件 `start <= end`：範圍收窄至沒有項目時便知道找不到。',
          '列表**由大至小**排序時，方向相反：`age[mid] > target` 時要找**後半部分**（`start = mid + 1`）。（p.221–223 例題 6.2，參考 DSE 2019 卷二D Q2）',
          '找出相同值的數目：先用對分檢索找到其中一個位置，再向左、向右逐一比較（leftMost、rightMost）。（p.222）',
        ] },
        { sim: { code: C(...BIN), inputs: '80', step: true, open: ['vars'] }, cap: '對分檢索的程式（p.217）。輸入 80，看 start、end、mid 怎樣變化：mid 依次是 4、7、5、6。' },
      ],
      tries: [
        { id: 'c6a-s3-t1', pts: 4, src: '教科書 p.215–217', code: C(...BIN), inputs: '80', ask: { count: 8 },
          q: '先估：輸入 80，第 8 行 `if mark[mid] == target:` 執行了多少次？', options: ['4', '3', '7', '1'],
          why: 'mid = 4（75）→ 7（85）→ 5（79）→ 6（80，找到）。共比較 4 次；線性檢索要 7 次。' },
      ],
      practice: [
        { id: 'c6a-s3-p1', type: 'trace', pts: 3, src: '教科書 p.218 活動 6.1 第 1 題',
          q: '輸入 68（不在列表中），完成每次循環**結束時**的追蹤表。',
          code: C(...BIN), inputs: '68', spec: { mode: 'iter', cols: ['start', 'end', 'mid'], out: true },
          hint: 'mid 依次是 4、1、2、3（即教科書位置 5、2、3、4），共比較 4 次。最後 start > end，輸出 Not found。' },
        { id: 'c6a-s3-p2', type: 'mc', pts: 2, src: '教科書 p.219 活動 6.1 第 4 題', verify: true,
          q: '列表**由大至小**排序。以下程式檢索 66，輸出是什麼？',
          code: C('a = [98, 92, 85, 77, 73, 66, 65, 50, 43, 28]', 'target = 66', 'start = 0', 'end = len(a) - 1', 'count = 0', 'while start <= end:', '    mid = (start + end) // 2', '    count = count + 1', '    if a[mid] == target:', '        break', '    elif a[mid] > target:', '        start = mid + 1', '    else:', '        end = mid - 1', 'print(count, mid)'),
          options: ['3 5', '2 5', '3 6', '4 5'], answer: 0,
          hint: 'mid：4（73 > 66，找後半）→ 7（50 < 66，找前半）→ 5（66，找到）。教科書以位置 1 起計，寫成 5、8、6。' },
        { id: 'c6a-s3-p3', type: 'complete', pts: 3, src: '教科書 p.221 例題 6.2(a)（參考 DSE 2019 卷二D Q2）',
          q: '列表 age **由大至小**排序。完成 `SearchByBinary(target)`：找到傳回索引，找不到傳回 −1（Python 索引由 0 開始）。會用多個目標值測試。',
          template: C(AGE, '', 'def SearchByBinary(target):', '    start = 0', '    end = len(age) - 1', '    while ［1］:', '        mid = ［2］', '        if age[mid] == target:', '            return mid', '        elif age[mid] > target:', '            ［3］', '        else:', '            ［4］', '    return -1', '', 'print(SearchByBinary(int(input())))'),
          ref: ['start <= end', '(start + end) // 2', 'start = mid + 1', 'end = mid - 1'], tests: [{ inputs: '38' }, { inputs: '50' }, { inputs: '19' }, { inputs: '20' }, { inputs: '29' }],
          hint: '由大至小：中間項目比目標大，目標只會在後半部分（索引較大的一邊）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '對分檢索的效率；比較兩種檢索', pages: '教科書 p.220、p.222–227',
      learn: [
        { pts: [
          '每次比較後，檢索範圍減半：N → N/2 → N/4 → …。（p.220）',
          '最壞情況（最後一個或不存在）的比較次數：教科書寫 log₂N（約數）；準確是 **⌊log₂N⌋ + 1**。N = 10 → 4 次；N = 300 → 9 次；N = 1000 → 10 次。（p.220、p.226）',
          '計算機的 log 一般以 10 為底：log₂N = log N ÷ log 2。（p.220 提示）',
          '列表項目越多，對分檢索的優勢越大（圖 6.1）。但列表必須已排序；加入項目時要放在正確位置，花較多時間。（p.226–227）',
        ] },
        { table: { head: ['', '線性檢索', '對分檢索'], rows: [
          ['算法設計及程式編寫', '簡單', '複雜'],
          ['對列表的要求', '沒有', '必須已排序'],
          ['最多檢索次數（N 個項目）', 'N', '約 log₂N（準確：⌊log₂N⌋ + 1）'],
          ['平均檢索次數', '(N + 1) / 2', '約 log₂N'],
          ['適用於', '項目較少的列表', '項目較多的列表'],
        ] }, cap: '表 6.1 比較線性檢索和對分檢索（p.227）' },
        { sim: { code: C(AGE, '', ...SBB, '', ...LR, '', 'print(count(38), count(29), count(18), count(25))'), step: false, open: ['vars'] },
          cap: '例題 6.2(b)–(d)（p.221–224）：`count(target)` 先用對分檢索找到一個位置，再找最左和最右的相同值。' },
      ],
      tries: [
        { id: 'c6a-s4-t1', pts: 4, src: '教科書 p.221–222 例題 6.2(b)（參考 DSE 2019 卷二D Q2）',
          code: C(AGE, '', ...SBB, '', ...LR, '', 'print(count(38), count(29), count(18), count(25))'),
          q: '先估：輸出是什麼？', options: ['3 2 0 1', '1 1 0 1', '3 2 -1 1', '4 2 0 1'],
          why: '38 出現 3 次、29 出現 2 次、18 不存在、25 出現 1 次。與教科書答案相同。' },
        { id: 'c6a-s4-t2', pts: 4, src: '教科書 p.226 測試站 6.2(b)（參考 DSE 2018 卷二D Q3(e)）',
          code: C('data = list(range(1, 301))      # 300 個已排序的項目', 'target = 999                    # 不在列表中', 'start = 0', 'end = len(data) - 1', 'count = 0', 'while start <= end:', '    mid = (start + end) // 2', '    count = count + 1', '    if data[mid] == target:', '        break', '    elif target < data[mid]:', '        end = mid - 1', '    else:', '        start = mid + 1', 'print(count)'),
          q: '先估：在 300 個項目中檢索不存在的值，比較了多少次？', options: ['9', '8', '150', '300'],
          why: 'log₂300 ≈ 8.23，要比較 9 次（⌊8.23⌋ + 1）。線性檢索則要 300 次。' },
      ],
      practice: [
        { id: 'c6a-s4-p1', type: 'mc', pts: 2, src: '教科書 p.225 測試站 6.2(a)（答案有漏洞，見本單元檔頭）', verify: true,
          tags: [{ t: 'trap', why: '只比較首字母，同字母開頭的字串會找錯方向' }],
          q: '以下程式只比較首字母來決定方向。檢索 "and"（它**是**列表中的關鍵字），輸出是什麼？',
          code: C('keywords = ["and", "as", "assert", "break", "class"]', 'name = "and"', 'start = 0', 'end = len(keywords)-1', 'found = False', 'while start <= end and found == False:', '    mid = int((start + end)/2)', '    if keywords[mid] == name:', '        found = True', '    else:', '        if name[0] < keywords[mid][0]:', '            end = mid - 1', '        else:', '            start = mid + 1', 'if found == True:', '    print("This is a keyword.")', 'else:', '    print("Available for use")'),
          options: ['This is a keyword.', 'Available for use', 'IndexError', '沒有輸出'], answer: 1,
          hint: 'mid = 2 是 "assert"；"a" < "a" 不成立，程式便去找後半部分，錯過了 "and"。應比較整個字串：`name < keywords[mid]`。' },
        { id: 'c6a-s4-p2', type: 'mc', pts: 1, src: '教科書 p.227 表 6.1 及提示',
          q: '一個程式**經常加入新項目**，很少檢索，而且列表很短。應選用哪一種檢索？',
          options: ['線性檢索，因為列表無須排序，新項目加到末端即可', '對分檢索，因為它一定較快', '對分檢索，因為加入項目較容易', '兩者都不能用'], answer: 0,
          hint: '對分檢索要保持列表已排序，每次加入都要放到正確位置。' },
        { id: 'c6a-s4-p3', type: 'complete', pts: 2, src: '教科書 p.222 例題 6.2(d)',
          q: '參考 `rightMost(index)`，完成 `leftMost(index)`（Python 索引由 0 開始）。程式會輸入目標值，輸出它出現的次數。',
          template: C(AGE, '', ...SBB, '', 'def rightMost(index):', '    right = index', '    while right < len(age) - 1 and age[right + 1] == age[index]:', '        right = right + 1', '    return right', '', 'def leftMost(index):', '    left = index', '    while ［1］ and ［2］:', '        left = ［3］', '    return left', '', 'index = SearchByBinary(int(input()))', 'if index == -1:', '    print(0)', 'else:', '    print(leftMost(index), rightMost(index) - leftMost(index) + 1)'),
          ref: ['left > 0', 'age[left - 1] == age[index]', 'left - 1'], tests: [{ inputs: '38' }, { inputs: '29' }, { inputs: '50' }, { inputs: '19' }],
          hint: '向左走：不可超出索引 0，而且左邊的值要和 age[index] 相同。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.212、p.217、p.269',
      intro: '在編輯器寫 Python 程式，先按 ▶ 自己測試，再按「提交評核」。每個 `input()` 讀一行輸入。',
      tasks: [
        { id: 'c6a-w1', pts: 15, title: '線性檢索：找出所有位置', src: '教科書 p.212',
          q: '第一行輸入一串整數（以空格分隔），第二行輸入目標值 target。\n用**線性檢索**找出 target 在列表中的**所有**索引，每個一行輸出。如果找不到，輸出 `No result is found.`。\n最後一行輸出 `共 k 個`（k 是找到的數目）。',
          starter: C('nums = [int(x) for x in input().split()]', 'target = int(input())', '# 在這裏完成'),
          ref: C('nums = [int(x) for x in input().split()]', 'target = int(input())', 'k = 0', 'for i in range(0, len(nums)):', '    if target == nums[i]:', '        print(i)', '        k = k + 1', 'if k == 0:', '    print("No result is found.")', 'print("共", k, "個")'),
          rules: [{ must: 'for', msg: '要用循環逐一比較（線性檢索）。' }, { mustNot: '.index(', msg: '不可用 index()，要自己逐一比較。' }, { mustNot: '.count(', msg: '不可用 count()，要自己計算。' }],
          tests: [
            { inputs: C('79 50 85 64 97 88 80 75 50 65', '50') },
            { inputs: C('79 50 85 64 97 88 80 75 50 65', '100') },
            { inputs: C('7 7 7', '7') },
            { inputs: C('3 1 4 1 5 9', '9') },
            { inputs: C('42', '42') },
          ],
          hint: '用 for 循環檢查每一個索引，相同便輸出索引並計數。循環完結後才判斷 k 是否為 0。' },
        { id: 'c6a-w2', pts: 20, title: '對分檢索並計算比較次數', src: '教科書 p.217、p.269 課題練習 1',
          q: '第一行輸入一串**已由小至大排序**、沒有重複的整數（以空格分隔），第二行輸入目標值 target。\n用**對分檢索**（`mid = (start + end) // 2`）檢索 target：找到輸出 `Found at index 索引`，找不到輸出 `Not found`。\n第二行輸出 `比較次數: c`，c 是 `nums[mid]` 與 target 比較是否相同的次數。',
          starter: C('nums = [int(x) for x in input().split()]', 'target = int(input())', 'start = 0', 'end = len(nums) - 1', 'c = 0', '# 在這裏完成'),
          ref: C('nums = [int(x) for x in input().split()]', 'target = int(input())', 'start = 0', 'end = len(nums) - 1', 'c = 0', 'found = -1', 'while start <= end and found == -1:', '    mid = (start + end) // 2', '    c = c + 1', '    if nums[mid] == target:', '        found = mid', '    elif target < nums[mid]:', '        end = mid - 1', '    else:', '        start = mid + 1', 'if found == -1:', '    print("Not found")', 'else:', '    print("Found at index", found)', 'print("比較次數:", c)'),
          rules: [{ must: 'while', msg: '要用 while 循環實現對分檢索。' }, { must: '//', msg: '用 (start + end) // 2 計算中間索引。' }, { mustNot: '.index(', msg: '不可用 index()。' }],
          tests: [
            { inputs: C('50 51 64 65 75 79 80 85 88 97', '80') },
            { inputs: C('50 51 64 65 75 79 80 85 88 97', '75') },
            { inputs: C('50 51 64 65 75 79 80 85 88 97', '68') },
            { inputs: C('50 51 64 65 75 79 80 85 88 97', '100') },
            { inputs: C('5', '5') },
            { inputs: C('2 4 6 8 10 12 14 16', '1') },
          ],
          hint: '每次進入循環先計算 mid，c 加 1，再比較。找不到時循環在 start > end 時停止。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.213–227',
      items: [
        { id: 'c6a-q1', pts: 4, src: '教科書 p.226 測試站 6.2(b)（參考 DSE 2018 卷二D Q3(e)）', tags: [HOT_SEARCH],
          q: '已排序的列表有 300 個關鍵字。用對分檢索檢索一個**不是**關鍵字的名稱，最多要比較字串多少次？',
          options: ['8', '9', '150', '300'], answer: 'B',
          why: 'log₂300 ≈ 8.23；每次範圍減半，最多 9 次（⌊log₂300⌋ + 1）。' },
        { id: 'c6a-q2', pts: 4, src: '教科書 p.213 例題 6.1(a)（參考 DSE 2018 卷二D Q3(c)）', tags: [HOT_SEARCH], verify: true, ask: { count: 4 },
          q: '第 4 行的條件 `participant[i] != name` 被判斷了多少次？',
          code: C('participant = ["smartguy123", "happy555", "supersuperwoman", "funfunfun", "sakura_0101"]', 'name = "funfunfun"', 'i = 0', 'while i < len(participant) and participant[i] != name:', '    i = i + 1', 'registered = i < len(participant)'),
          options: ['3', '4', '5', '1'], answer: 'B',
          why: '比較了索引 0、1、2、3；第 4 次相同，條件不成立，離開循環。' },
        { id: 'c6a-q3', pts: 4, src: '教科書 p.219 活動 6.1 第 5 題',
          q: '列表**由大至小**排序：位置 1–10 為 98、92、85、77、73、66、65、50、43、28。用對分檢索找 25（不存在），依次比較了哪些位置？',
          options: ['5、8、9、10', '5、2、1', '5、8、6、7', '10、9、8'], answer: 'A',
          why: '73 > 25 → 後半；位置 8（50）> 25 → 後半；位置 9（43）→ 後半；位置 10（28）→ 後半，範圍變空，比較 4 次。' },
        { id: 'c6a-q4', pts: 4, src: '教科書 p.215、p.227',
          q: '以下哪一項有關對分檢索的描述是**錯誤**的？',
          options: ['只適用於已排序的列表', '項目越多，它比線性檢索的優勢越大', '它的最好情況是只比較 1 次', '它可直接用於未排序的列表，只是速度較慢'], answer: 'D',
          why: '未排序的列表不能用對分檢索：捨棄一半範圍的判斷會錯誤，可能找不到存在的值。' },
        { id: 'c6a-q5', pts: 4, src: '教科書 p.215–217', verify: true,
          q: '以下程式的輸出是什麼？',
          code: C(MARK_S, 'target = 97', 'start = 0', 'end = len(mark) - 1', 'while start <= end:', '    mid = (start + end) // 2', '    print(mid, end=" ")', '    if mark[mid] == target:', '        break', '    elif target < mark[mid]:', '        end = mid - 1', '    else:', '        start = mid + 1'),
          options: ['4 7 8 9', '4 7 9', '5 8 9', '9'], answer: 'A',
          why: '(0 + 9) // 2 = 4；(5 + 9) // 2 = 7；(8 + 9) // 2 = 8；(9 + 9) // 2 = 9，找到。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pySearch', 'pyWhile', 'pyListAlgo'], intro: '隨機生成線性檢索、對分檢索比較次數及列表算法題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
