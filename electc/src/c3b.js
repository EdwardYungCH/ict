/* 選修C 單元 c3b：綜合應用控制結構及算法比較
 * 教科書 選修C 第 3 章 3.4–3.5 p.86–96（例題 3.3、測試站 3.3、測試站 3.4）；課題練習 p.99–103
 * 第 3 章分為兩個單元：c3a（3.1–3.3）、c3b（3.4–3.5）。
 * 教科書的偽代碼字串／陣列索引多數由 1 開始；本單元的 Python 程式一律用 0 開始的索引。
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * 教科書疑似錯誤：p.88 例題 3.3 分析 (4) n = 3 的完整表，第 9 列 x = 2 印作 1；按算法（及 Python 運行結果）應為 0（文字版整理時已註明）
 */
const C = (...ls) => ls.join('\n');
const HOT_CMP = { t: 'hot', why: '卷二D 常要求比較兩個算法的效率／記憶體用量（DSE 2020 2D Q2 缺少貨物、2016 2D Q4 賓果）' };
const TRAP_IDX = { t: 'trap', why: '嵌套循環內用 i + 1、j + k 等索引時，忘記檢查範圍會出現 IndexError（例題 3.3、測試站 3.3）' };

const FARM = (body) => C(
  'n = int(input("n = "))',
  'F = []',
  'for i in range(0, 10):',
  '    F = F + [[0] * 10]',
  'y = 0',
  'while y < 10:',
  '    x = 0',
  '    while x < 10:',
  ...body,
  'for i in range(0, 10):',
  '    line = ""',
  '    for j in range(0, 10):',
  '        line = line + str(F[i][j])',
  '    print(line)');
const FARM_BODY = ['        for i in range(y, y + n):', '            for j in range(x, x + n):', '                if i <= 9 and j <= 9:', '                    F[i][j] = 1', '        x = x + n * 2', '    y = y + n * 2'];

const PW = C(
  'password = "iloveict"',
  'input_pw = input("密碼：")',
  'correct = True',
  'for j in range(0, len(password)):',
  '    if len(password) != len(input_pw) or password[j] != input_pw[j]:',
  '        correct = False',
  'print(correct)');

const PUZ = C(
  'puzzle = ["JGJGDDAOYD",',
  '          "IDGFHSPOSA",',
  '          "FGDIOSAFSC",',
  '          "INTERNETSO",',
  '          "FJKCOSAFSM",',
  '          "DJSGAPAHDP",',
  '          "HAUSTRFBFU",',
  '          "KDGFUCNSKT",',
  '          "WSJDYCFXDE",',
  '          "ODVFKXJVCR"]');

const ALGO1 = C(
  'A = 51',
  'C = [54, 59, 51, 58, 55, 56, 53, 57, 52]',
  'weight = 0',
  'for i in range(A, A + 10):',
  '    weight = weight + i',
  'total = 0',
  'for i in range(0, 9):',
  '    total = total + C[i]',
  'print(weight - total)');
const ALGO2 = C(
  'A = 51',
  'C = [54, 59, 51, 60, 55, 56, 53, 58, 52]',
  'for i in range(A, A + 10):',
  '    found = False',
  '    for j in range(0, 9):',
  '        if C[j] == i:',
  '            found = True',
  '    if found == False:',
  '        print(i)');
const ALGO3 = C(
  'A = 51',
  'C = [54, 59, 51, 60, 55, 56, 53, 57, 52]',
  'found = [False] * (A + 10)',
  'for i in range(0, 9):',
  '    found[C[i]] = True',
  'for i in range(A, A + 10):',
  '    if found[i] == False:',
  '        print(i)');

const HUMAN = 'human = [[1, 0, 1], [1, 1, 1], [0, 1, 0]]';
const PHOTO1 = C('photo = [[0, 1, 0, 0, 1, 1, 0, 1],', '         [1, 0, 1, 0, 1, 1, 1, 1],', '         [1, 1, 1, 1, 1, 0, 1, 0],', '         [0, 1, 0, 1, 0, 0, 0, 1]]');
const PHOTO2 = C('photo = [[0, 0, 1, 0, 1, 1, 0, 1],', '         [1, 0, 1, 1, 1, 1, 1, 1],', '         [1, 1, 1, 1, 0, 0, 1, 0],', '         [0, 1, 0, 1, 0, 1, 0, 0]]');
const COUNT_HUMAN = C(
  'count = 0',
  'for i in range(0, 2):',
  '    for j in range(0, 6):',
  '        match = True',
  '        for p in range(0, 3):',
  '            for q in range(0, 3):',
  '                if human[p][q] != photo[i + p][j + q]:',
  '                    match = False',
  '        if match == True:',
  '            count = count + 1',
  'print(count)');
const READ_PHOTO = C(
  'photo = []',
  'for i in range(0, 4):',
  '    line = input()',
  '    row = []',
  '    for ch in line:',
  '        row = row + [int(ch)]',
  '    photo = photo + [row]');

module.exports = {
  id: 'c3b',
  title: '綜合應用控制結構及算法比較',
  book: '教科書 選修C 第 3 章 3.4–3.5 p.86–96（另有 p.99–103 課題練習）',
  key: 'C-c3b-hmac-031886ff49',
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '綜合應用控制結構', pages: '教科書 p.86–89',
      learn: [
        { pts: [
          '**控制流程**：電腦程式以不同控制結構改變語句的執行順序。（p.86）',
          '控制結構基本分為三類：**序列**、**選擇**及**迭代**；無論多複雜的程式都可以用這三類構造。（p.86）',
          '控制結構可配合單陣列、二維陣列等數據結構，組合成**多層嵌套**的控制結構。（p.86）',
          '分析多層嵌套的算法：由內至外逐層看——最內層產生一個 n × n 的方形；`while x` 循環產生一列方形；`while y` 循環產生多列。（p.88 例題 3.3 分析）',
          '**不存在於陣列中的項目不能被存取**：計算出來的索引可能超出範圍，要先用條件語句（例如 `i <= 9 and j <= 9`）檢查，否則 Python 出現 `IndexError`。（p.88）',
        ] },
        { sim: { code: FARM(FARM_BODY), inputs: '3', step: false, open: ['vars'] },
          cap: '例題 3.3(b)（p.87–89）：播種機械人。輸入 n，產生大小 n × n、相隔 n 的方形播種區域（1 = 播種）。試輸入 1、2、3、4。' },
      ],
      tries: [
        { id: 'c3b-s1-t1', pts: 4, src: '教科書 p.87 例題 3.3(a)',
          code: C('F = []', 'for i in range(0, 10):', '    F = F + [[0] * 10]', 'y = 0', 'while y < 10:', '    x = 0', '    while x < 10:', '        for i in range(y, y + 2):', '            for j in range(x, x + 2):', '                F[i][j] = 1', '        x = x + 4', '    y = y + 4', 'count = 0', 'for i in range(0, 10):', '    for j in range(0, 10):', '        count = count + F[i][j]', 'print(count)'),
          q: '先估：執行後，F 內有多少個 1？', options: ['36', '25', '50', '100'],
          why: 'x、y 都是 0、4、8，共 3 × 3 = 9 個位置；每個位置產生 2 × 2 = 4 格。9 × 4 = 36。' },
      ],
      practice: [
        { id: 'c3b-s1-p1', type: 'complete', pts: 3, src: '教科書 p.87 例題 3.3(b)', label: '補完程式',
          q: '輸入正整數 n，產生大小為 n × n、與相鄰方形距離為 n 的方形播種區域。補完五個空格。會用多組數據測試。',
          template: FARM(['        for i in range(y, ［1］):', '            for j in range(x, ［2］):', '                if ［3］:', '                    F[i][j] = 1', '        x = ［4］', '    y = ［5］']),
          ref: ['y + n', 'x + n', 'i <= 9 and j <= 9', 'x + n * 2', 'y + n * 2'],
          tests: [{ inputs: '1' }, { inputs: '2' }, { inputs: '3' }, { inputs: '4' }, { inputs: '6' }],
          hint: '教科書偽代碼「設 i 由 y 至 y+n-1」→ `range(y, y + n)`。下一個方形相隔 n，所以 x 每次加 n × 2。n = 3、4 時方形會超出地圖，要檢查索引。' },
        { id: 'c3b-s1-p2', type: 'fill', pts: 2, src: '教科書 p.88 例題 3.3 分析 (1)', q: '刪去檢查索引的條件語句後，輸入 4。程式出現什麼錯誤？（寫錯誤類型名稱）',
          code: FARM(['        for i in range(y, y + n):', '            for j in range(x, x + n):', '                F[i][j] = 1', '        x = x + n * 2', '    y = y + n * 2']),
          inputs: '4',
          blanks: [{ label: '錯誤類型', ask: { error: true } }],
          hint: 'n = 4 時，x 依次是 0、8：x = 8 的方形要用 j = 8、9、10、11，但每列只有索引 0 至 9。（n = 3 時 x 是 0、6，j 最大是 8，剛好不會出錯——所以要用多組數據測試。）' },
        { id: 'c3b-s1-p3', type: 'mc', pts: 2, src: '教科書 p.86', q: '以下哪一項**不是**控制結構的基本類別？',
          options: ['序列', '選擇', '迭代', '初始化'], answer: 3,
          hint: '控制結構基本分為三類。初始化是為列表賦予預設值的過程。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '逐個字元比較：密碼及找字遊戲', pages: '教科書 p.90–93',
      learn: [
        { pts: [
          '字串可以像列表一樣用索引逐個讀取字元。教科書偽代碼假設索引由 1 開始；**Python 由 0 開始**，例如 `password[0]` 是第 1 個字元。（p.90）',
          '比較兩個字串：先比較長度，再用 for 循環逐個字元比較；任何一個不同，旗標便設為 False。（p.90 測試站 3.3 第 1 題）',
          '在字串內找單詞：外循環逐個位置 i 找 `word[0]`；找到後內循環逐個比較 `word[j]` 與 `string[i + j]`。（p.90 第 2 題，參考 DSE 2014 2D Q4b）',
          '條件 `i + j >= len(string) or …`：`or` 左邊成立時，Python **不會再計算右邊**，所以不會讀取超出索引範圍的項目。（p.90 第 2(b) 題）',
          '找字遊戲（10 × 10）：同一列 `puzzle[i][j + k]`、同一欄 `puzzle[i + k][j]`、左上至右下對角線 `puzzle[i + k][j + k]`。（p.91–93 第 3 題）',
        ] },
        { sim: { code: PW, inputs: 'iloveICT', step: true, open: ['vars'] },
          cap: '測試站 3.3 第 1 題的 Python 版本。試輸入 `iloveict`、`ilove`、`iloveICT`。' },
        { sim: { code: C(PUZ, 'word = input()', 'found = False', 'for i in range(0, 10):', '    for j in range(0, 10):', '        if puzzle[i][j] == word[0] and found == False:', '            found = True', '            for k in range(0, len(word)):', '                if i + k >= 10 or j + k >= 10 or word[k] != puzzle[i + k][j + k]:', '                    found = False', 'print(found)'), inputs: 'CAR', open: ['vars'] },
          cap: '測試站 3.3 第 3(c) 題（p.93）：在對角線內找單詞。試輸入 `CAR`、`INTERNET`。' },
      ],
      tries: [
        { id: 'c3b-s2-t1', pts: 4, src: '教科書 p.90 測試站 3.3 第 1 題', code: PW, inputs: 'iloveICT', ask: { count: 6 },
          q: '先估：用戶輸入 `iloveICT`，第 6 行（`correct = False`）執行了多少次？', options: ['3', '0', '1', '8'],
          why: '長度相同（8）；只有最後 3 個字元 I、C、T 與 i、c、t 不同（大小寫不同的字元並不相等），所以執行 3 次。' },
      ],
      practice: [
        { id: 'c3b-s2-p1', type: 'complete', pts: 3, src: '教科書 p.90 測試站 3.3 第 2(a) 題（參考 DSE 2014 2D Q4b）', label: '補完程式',
          q: '判斷輸入的單詞是否在字串內（Python 索引由 0 開始）。會用多組數據測試。',
          template: C('string = "gjbjcdcomputerskgkxvxzvlvjsfgjgvfbh"', 'word = input()', 'found = False', 'for i in range(0, len(string)):', '    if string[i] == word[0] and found == False:', '        found = ［1］', '        for j in range(0, len(word)):', '            if i + j >= len(string) or ［2］:', '                found = False', 'print(found)'),
          ref: ['True', 'word[j] != string[i + j]'],
          tests: [{ inputs: 'computer' }, { inputs: 'ter' }, { inputs: 'fbh' }, { inputs: 'bhx' }, { inputs: 'comx' }, { inputs: 'gj' }],
          hint: '教科書（索引由 1 開始）寫 `word[j] != string[i+j-1]`；Python 由 0 開始，便是 `string[i + j]`。' },
        { id: 'c3b-s2-p2', type: 'mc', pts: 1, src: '教科書 p.90 測試站 3.3 第 2(b) 題', q: '上題第 8 行條件中 `i + j >= len(string)` 的目的是什麼？',
          options: ['令程式運行得較快', '避免讀取超出索引範圍的項目（IndexError）', '檢查單詞是否太長', '避免無限循環'], answer: 1,
          hint: '試想 word = "bhx"：比較到 x 時，i + j 已等於字串長度。' },
        { id: 'c3b-s2-p3', type: 'complete', pts: 2, src: '教科書 p.92 測試站 3.3 第 3(b) 題', label: '補完程式',
          q: '找字遊戲：判斷輸入的單詞是否連續地儲存在字母陣列的其中一**欄**內（由上至下）。會用多組數據測試。',
          template: C(PUZ, 'word = input()', 'found = False', 'for i in range(0, 10):', '    for j in range(0, 10):', '        if puzzle[i][j] == word[0] and found == False:', '            found = True', '            for k in range(0, len(word)):', '                if ［1］ or word[k] != ［2］:', '                    found = False', 'print(found)'),
          ref: ['i + k >= 10', 'puzzle[i + k][j]'],
          tests: [{ inputs: 'COMPUTER' }, { inputs: 'INTERNET' }, { inputs: 'JIFIF' }, { inputs: 'TER' }, { inputs: 'ROX' }],
          hint: '同一欄：列號 i 加 k，欄號 j 不變；先檢查 i + k 有沒有超出 9。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '算法比較', pages: '教科書 p.94–96、p.99',
      learn: [
        { pts: [
          '同一個問題可以用不同算法解決，各有優劣；要比較後選擇最合適和正確的方案。（p.94）',
          '**執行步數**越多，運行需時越長，**時間複雜度**通常越高。（p.94）',
          '使用不同數據結構或不同數量的變量，佔用的資源亦不同；佔用的電腦資源越多，**空間複雜度**越高。（p.94）',
          '比較算法時可考慮：**正確／適合程度**、**執行步數／時間**、**資源運用**、**複雜性**、**數據結構**。（p.99）',
          '測試站 3.4（參考 DSE 2020 2D Q2）：貨箱應有 10 件連續編號的貨物，少了一件。三個算法：① 應有總和 − 實際總和；② 逐個編號用嵌套循環在陣列內找；③ 用布爾列表 `found` 記錄每個編號是否出現。',
        ] },
        { table: { head: ['', '算法 1（總和相減）', '算法 2（嵌套循環）', '算法 3（found 列表）'], rows: [['循環體執行次數', '10 + 9 = 19', '10 × 9 = 90', '9 + 10 = 19'], ['額外記憶體', '兩個變量', '一個旗標', '一個列表'], ['少了多於一件', '找不到', '可以', '可以']] }, cap: '測試站 3.4(d) 的比較（p.96）' },
        { sim: { code: ALGO1, step: true, open: ['vars'] }, cap: '算法 1（p.95）：weight 是應有的編號總和，total 是箱內貨物的編號總和。' },
        { sim: { code: ALGO3, open: ['vars'] }, cap: '算法 3（p.96）的 Python 版本：直接用編號作 `found` 的索引，所以列表要有 A + 10 個項目——快，但佔用較多記憶體。' },
      ],
      tries: [
        { id: 'c3b-s3-t1', pts: 4, src: '教科書 p.96 測試站 3.4(b)(ii)', tags: [HOT_CMP], code: ALGO2, ask: { count: 6 },
          q: '先估：算法 2 的第 6 行（`if C[j] == i:`）執行了多少次？', options: ['90', '9', '10', '100'],
          why: '外循環 10 次（51 至 60），每次內循環 9 次：10 × 9 = 90。（教科書答案：90）' },
        { id: 'c3b-s3-t2', pts: 4, src: '教科書 p.96 測試站 3.4(c)(ii)', code: ALGO3,
          q: '先估：算法 3 的輸出是什麼？', options: ['58', '57', '60', '51'],
          why: 'C 內有 51–57、59、60，只有 found[58] 仍是 False。（教科書答案：58）' },
      ],
      practice: [
        { id: 'c3b-s3-p1', type: 'fill', pts: 2, src: '教科書 p.95 測試站 3.4(a)', q: '算法 1 的輸出是什麼？weight 的值是多少？',
          code: ALGO1, blanks: [{ label: '輸出', ask: 'out' }, { label: 'weight', ask: { var: 'weight' } }],
          hint: 'weight = 51 + 52 + … + 60。' },
        { id: 'c3b-s3-p2', type: 'mc', pts: 2, src: '教科書 p.96 測試站 3.4(d)(i)–(iii)', q: '以下哪一項描述是**正確**的？',
          options: ['算法 2 比算法 1 效率高，因為它使用了嵌套循環', '算法 1 比算法 3 所需的電腦記憶體較少', '算法 3 比算法 2 執行時間較長', '三個算法的執行步數相同'], answer: 1,
          hint: '算法 3 要一個 found 列表；算法 1 只用兩個變量。算法 2 的嵌套循環令步數最多。' },
        { id: 'c3b-s3-p3', type: 'mc', pts: 2, src: '教科書 p.96 測試站 3.4(d)(iv)（挑戰題）', q: '哪一種特殊情況，算法 1 無法處理，但算法 2 和算法 3 可以？',
          options: ['貨箱編號是 1', '陣列 C 的次序是隨機的', '貨箱少了多於一件貨物', '缺少的是編號最大的貨物'], answer: 2,
          hint: '算法 1 只得出「缺少編號的總和」。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '二維陣列綜合題', pages: '教科書 p.100–103 課題練習',
      learn: [
        { pts: [
          '**圖案匹配**（課題練習第 3 題，參考 DSE 2017 2D Q4b）：用 3 × 3 的 `human` 與 `photo` 由 (i, j) 開始的 3 × 3 部分逐格比較；對應的格是 `photo[i + p][j + q]`。',
          '把左上角 (i, j) 移遍所有可能位置（4 × 8 的 photo：i = 0–1、j = 0–5），便可以數出圖案出現的次數。',
          '**二維 ↔ 一維**（課題練習第 4 題，參考 DSE 2021 2D Q3）：m × n 的二維列表逐列複製到一維列表，`ttt_2d[i][j]` 的位置是 `i * n + j`（索引由 0 開始）。教科書（由 1 開始）寫 `(i-1)*n + j`。',
          '**反射圖像**（課題練習第 5 題）：`art[i][7 - j] = art[i][j]`；只需 j = 0 至 3，便可把左半反射到右半，步數減半。',
        ] },
        { sim: { code: C(HUMAN, PHOTO1, COUNT_HUMAN), step: false, open: ['vars'] }, cap: '課題練習第 3 題（p.100）：human 在 photo 中出現了 3 次。' },
      ],
      tries: [
        { id: 'c3b-s4-t1', pts: 4, src: '教科書 p.101 課題練習第 3(a) 題', code: C(HUMAN, PHOTO2, COUNT_HUMAN),
          q: '先估：在這幅 photo 中，human 出現了多少次？', options: ['2', '1', '3', '4'],
          why: '左上角 (1, 0) 和 (1, 2) 兩處完全匹配。（教科書答案：2 次）' },
      ],
      practice: [
        { id: 'c3b-s4-p1', type: 'complete', pts: 3, src: '教科書 p.101 課題練習第 3(b)(ii) 題', label: '補完程式',
          q: '輸入左上角的列 i 和欄 j（由 0 開始），檢查 photo[i][j] 至 photo[i+2][j+2] 是否與 human 匹配，輸出 True 或 False。會用多組數據測試。',
          template: C(HUMAN, PHOTO1, 'i = int(input())', 'j = int(input())', 'match = ［1］', 'for p in range(0, 3):', '    for q in range(0, 3):', '        if human[p][q] != photo[［2］][［3］]:', '            match = ［4］', 'print(match)'),
          ref: ['True', 'i + p', 'j + q', 'False'],
          tests: [{ inputs: '1\n0' }, { inputs: '0\n0' }, { inputs: '0\n5' }, { inputs: '1\n2' }, { inputs: '1\n1' }],
          hint: '先假設匹配；有任何一格不同便設為 False。教科書（由 1 開始）寫 `photo[i-1+p, j-1+q]`。' },
        { id: 'c3b-s4-p2', type: 'fill', pts: 1, src: '教科書 p.102 課題練習第 4(c)(i) 題', q: '把 4 × 5 的 ttt_2d 逐列複製到一維列表。輸出的字串是什麼？',
          code: C('ttt_2d = [["O", "X", "O", "X", "O"],', '          ["O", "X", "O", "O", "X"],', '          ["X", "O", "O", "O", "X"],', '          ["X", "X", "X", "O", "X"]]', 'ttt_1d = [""] * 20', 'for i in range(0, 4):', '    for j in range(0, 5):', '        ttt_1d[i * 5 + j] = ttt_2d[i][j]', 'print("".join(ttt_1d))'),
          blanks: [{ label: '輸出', ask: 'out' }],
          hint: '由上至下，每列由左至右。' },
        { id: 'c3b-s4-p3', type: 'complete', pts: 2, src: '教科書 p.102 課題練習第 4(c)(ii) 題', label: '補完程式',
          q: '輸入 m 和 n，再輸入 m 行、每行 n 個符號，存入二維列表 `ttt_2d`。補完索引，把它逐列複製到一維列表 `ttt_1d`。會用多組數據測試。',
          template: C('m = int(input())', 'n = int(input())', 'ttt_2d = []', 'for i in range(0, m):', '    line = input()', '    row = []', '    for ch in line:', '        row = row + [ch]', '    ttt_2d = ttt_2d + [row]', 'ttt_1d = [""] * (m * n)', 'for i in range(0, m):', '    for j in range(0, n):', '        ttt_1d[［1］] = ttt_2d[i][j]', 'print("".join(ttt_1d))'),
          ref: ['i * n + j'],
          tests: [{ inputs: '3\n3\nXXO\nOOX\nXOO' }, { inputs: '4\n5\nOXOXO\nOXOOX\nXOOOX\nXXXOX' }, { inputs: '2\n4\nABCD\nEFGH' }, { inputs: '1\n3\nXYZ' }],
          hint: '第 i 列前面已有 i 列，每列 n 個項目。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.94–96、p.100',
      intro: '在編輯器寫 Python 程式，先按「▶ 執行」自己測試，再按「提交評核」。輸入數據每行一個，按次序交給每一個 `input()`。',
      tasks: [
        { id: 'c3b-w1', tier: '必做', pts: 12, title: '找出缺少的貨物（算法 1）', src: '教科書 p.95 測試站 3.4(a)（參考 DSE 2020 2D Q2）',
          q: '第一個輸入是貨箱編號 `A`（箱內應有 A 至 A + 9 共 10 件貨物），之後輸入箱內 9 件貨物的編號（每行一個，次序隨機）。用**算法 1**（應有總和 − 實際總和）輸出缺少的貨物編號。\n例如輸入 `51` 和 `54 59 51 58 55 56 53 57 52`（每行一個），輸出 `60`。',
          starter: C('A = int(input())', ''),
          ref: C('A = int(input())', 'weight = 0', 'for i in range(A, A + 10):', '    weight = weight + i', 'total = 0', 'for i in range(0, 9):', '    total = total + int(input())', 'print(weight - total)'),
          tests: [{ inputs: '51\n54\n59\n51\n58\n55\n56\n53\n57\n52' }, { inputs: '21\n28\n25\n21\n29\n23\n30\n22\n24\n27' }, { inputs: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10' }, { inputs: '1\n9\n8\n7\n6\n5\n4\n3\n2\n1' }, { inputs: '91\n100\n99\n98\n97\n96\n94\n93\n92\n91' }],
          rules: [{ must: 'for', msg: '要用 for 循環' }],
          hint: '`weight` = A + (A+1) + … + (A+9)，用 `for i in range(A, A + 10)`；`total` 用另一個循環把 9 個輸入加起來。' },
        { id: 'c3b-w2', tier: '進階', pts: 13, title: '找出所有缺少的貨物', src: '教科書 p.96 測試站 3.4(d)(iv)（挑戰題延伸）',
          q: '貨箱可能少了多於一件貨物，算法 1 不再適用。\n輸入貨箱編號 `A`，再輸入箱內貨物數量 `k`（0 至 10），之後輸入 k 個貨物編號（每行一個）。\n由小至大輸出所有缺少的編號（每行一個）；沒有缺少便輸出 `沒有缺少`。',
          starter: C('A = int(input())', 'k = int(input())', 'C = []', 'for i in range(0, k):', '    C = C + [int(input())]', ''),
          ref: C('A = int(input())', 'k = int(input())', 'C = []', 'for i in range(0, k):', '    C = C + [int(input())]', 'missing = 0', 'for i in range(A, A + 10):', '    found = False', '    for j in range(0, k):', '        if C[j] == i:', '            found = True', '    if found == False:', '        print(i)', '        missing = missing + 1', 'if missing == 0:', '    print("沒有缺少")'),
          tests: [{ inputs: '51\n9\n54\n59\n51\n60\n55\n56\n53\n58\n52' }, { inputs: '21\n8\n28\n25\n29\n23\n30\n22\n24\n27' }, { inputs: '1\n10\n10\n9\n8\n7\n6\n5\n4\n3\n2\n1' }, { inputs: '31\n0' }, { inputs: '11\n3\n15\n11\n20' }],
          hint: '用算法 2：外循環逐個編號 i 由 A 至 A + 9；內循環在 C 內找 i，用旗標 `found`。另用一個計數器記錄缺少了多少件，最後才決定是否輸出「沒有缺少」。' },
        { id: 'c3b-w3', tier: '挑戰', pts: 10, title: '圖像中的人類圖案', src: '教科書 p.100 課題練習第 3 題（參考 DSE 2017 2D Q4b）',
          q: '首 7 行已把 4 行、每行 8 個 0／1 的輸入讀進 4 × 8 的二維列表 `photo`。`human` 是 3 × 3 的人類圖案。\n輸出 human 在 photo 中出現的次數（圖案可以重疊）。',
          starter: C(READ_PHOTO, HUMAN, ''),
          ref: C(READ_PHOTO, HUMAN, COUNT_HUMAN),
          tests: [{ inputs: '01001101\n10101111\n11111010\n01010001' }, { inputs: '00101101\n10111111\n11110010\n01010100' }, { inputs: '00000000\n00000000\n00000000\n00000000' }, { inputs: '10110100\n11111110\n01010100\n00000000' }, { inputs: '00000101\n00000111\n00000010\n00000000' }],
          hint: '四層 for 循環：左上角 i（0–1）、j（0–5），再逐格 p、q（0–2）比較 `human[p][q]` 與 `photo[i + p][j + q]`。每個位置先設 `match = True`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.86–103',
      items: [
        { id: 'c3b-q1', pts: 4, src: '教科書 p.96 測試站 3.4(d)(iii)', tags: [HOT_CMP],
          q: '以執行程式所需的步數及時間而言，算法 1（兩個獨立的 for 循環）還是算法 2（嵌套循環）更有效率？',
          options: ['算法 1，因為它執行的循環體較少', '算法 2，因為嵌套循環可以同時檢查多個項目', '一樣，因為兩者都檢查所有貨物', '算法 2，因為它不用計算總和'], answer: 'A',
          why: '算法 1 約 19 次循環體；算法 2 的嵌套循環要 90 次。（教科書答案：算法 1 效率更高）' },
        { id: 'c3b-q2', pts: 4, src: '教科書 p.94',
          q: '某算法為了加快速度，額外使用了一個很大的列表。以下哪一項描述最正確？',
          options: ['時間複雜度及空間複雜度都降低', '時間複雜度可能降低，但空間複雜度提高', '時間複雜度提高，空間複雜度降低', '兩者都不受影響'], answer: 'B',
          why: '佔用的電腦資源（記憶體）越多，空間複雜度越高；以空間換取時間，例如算法 3。' },
        { id: 'c3b-q3', pts: 4, src: '仿教科書 p.90 測試站 3.3', verify: true,
          q: '以下程式的輸出是什麼？', code: C('s = "abcabcab"', 'w = "cab"', 'count = 0', 'for i in range(0, len(s) - len(w) + 1):', '    ok = True', '    for j in range(0, len(w)):', '        if s[i + j] != w[j]:', '            ok = False', '    if ok:', '        count = count + 1', 'print(count)'),
          options: ['2', '1', '3', '0'], answer: 'A', why: '"cab" 在索引 2 和 5 出現。外循環範圍是 0 至 len(s) − len(w)，所以不會超出索引。' },
        { id: 'c3b-q4', pts: 4, src: '教科書 p.103 課題練習第 5(c) 題（參考 DSE 2014 2D Q4a）',
          q: '以下算法把 8 × 8 圖像 art 的左半反射到右半。哪一項修改可以改善效率而結果不變？',
          code: C('for i in range(0, 8):', '    for j in range(0, 8):', '        art[i][7 - j] = art[i][j]'),
          options: ['把內循環改為 range(0, 4)', '把外循環改為 range(0, 4)', '把兩個循環對調', '改用 while 循環'], answer: 'A',
          why: 'j = 4 至 7 時只是把右半抄回左半，值不變；只需 j = 0 至 3。外循環要處理全部 8 列。' },
        { id: 'c3b-q5', pts: 4, src: '仿教科書 p.88 例題 3.3 分析 (1)', tags: [TRAP_IDX], verify: true, ask: { error: true },
          q: '執行以下程式會出現什麼錯誤？', code: C('F = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]', 'for i in range(0, 3):', '    for j in range(0, 3):', '        F[i][j] = F[i][j + 1] + 1'),
          options: ['IndexError', 'NameError', 'TypeError', '沒有錯誤'], answer: 'A',
          why: 'j = 2 時讀取 F[i][3]，超出索引範圍（只有 0 至 2）。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyFor', 'pyStr', 'pyListAlgo'], intro: '隨機生成循環、字串及列表算法的估輸出題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
