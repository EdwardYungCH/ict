/* 單元 7：字串的綜合應用
 * 教科書 D2 第 5 章 5.3（書頁 p.115–131）；課題練習 p.156 選擇題 10
 * 所有答案在 build 時由 CPython 計算／核對。
 *
 * // 教科書疑似錯誤：p.115 文字及圖用 "Work Hard!"（10 個字符），緊接的程式用 "Work Hard"（9 個）配 range(0,9)（D2-33）。
 * // 教科書疑似錯誤：p.119 「對稱字」以字形左右對稱定義（車、日），但程式其實檢查迴文（level、noon）；「eye」字形並不對稱（D2-35）。
 * // 教科書疑似錯誤：p.123 圖中「結束索引」指向索引 3（包括在內），程式卻用 range(0, 4)，擴闊視野又說切片「不包括結束索引」（D2-36）。
 * // 教科書疑似錯誤：p.129 測試站 5.10(b) 答案 `password[i] == " ":` 及 `nospace = False:` 行尾多了冒號，照抄會有語法錯誤（D2-37）。
 * // 教科書疑似錯誤：p.122 例題 5.10 答案框把空格答案印成 `first_space == -1:`（多了冒號），應填 `first_space == -1`（新發現，與 D2-37 同類）。
 */
const C = (...ls) => ls.join('\n');
const HOT_STR = { t: 'hot', why: 'DSE 卷一甲部常考字串處理：用循環逐個讀取字符、提取子字串、比較 ASCII（例如 2018 卷二 D Q3 密碼檢查）。' };
const TRAP_SLICE = { t: 'trap', why: '切片（slicing）不包括結束索引；超出範圍的切片不會出錯，但超出範圍的索引會出 IndexError。' };

module.exports = {
  id: 'u7',
  title: '字串的綜合應用',
  book: '教科書 D2 第 5 章 p.115–131（另有 p.156 課題練習）',
  key: 'D2-u7-hmac-0c6f4bd15b',
  theory: false,
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '字串是一串字符；長度與點算', pages: '教科書 p.115–117',
      learn: [
        { pts: [
          '**字串（string）**由一連串**字符（character）**組成。`word = "Work Hard!"` 中，`word[0]` 是 `"W"`，`word[4]` 是空格。（p.115）',
          '字串的索引和列表一樣**由 0 開始**；最後一個字符是 `word[len(word) - 1]`，也可寫 `word[-1]`。',
          '`len(word)` 傳回字串長度（空格和標點都計算在內）：`len("Work Hard")` 是 9，`len("Play Harder")` 是 11。（p.117）',
          '用 `+` **合併**字串：`"Work Hard" + "er"` 得 `"Work Harder"`；可由空字串 `""` 開始逐步加上去。（p.115）',
          '字串的字符**不能直接被賦值**：`word[5] = "h"` 會出 **TypeError**（\'str\' object does not support item assignment）。（p.115）',
          '用 for 循環逐個讀取字符：`for i in range(0, len(word)):` 配 `word[i]`；或 `for item in word:`（直接取出每個字符）。（p.117）',
        ] },
        { sim: { code: C('word = "Work Hard!"', 'count = 0', 'for item in word:', '    count = count + 1', 'print(count)', 'print(len(word))'), open: ['vars'], step: true }, cap: 'p.117：用 for 循環數字符，結果與 len() 相同。按「下一步」看 item 怎樣逐個變。' },
        { fix: { bad: C('word = "Work Hard"', 'word[5] = "h"'), good: C('word = "Work Hard"', 'word = word[0:5] + "h" + word[6:9]', 'print(word)'), why: '字串不能逐格修改（p.115）。要「改」字符，只能**合併出一個新字串**再賦值給變量。' } },
      ],
      tries: [
        { id: 'u7-s1-t1', pts: 4, src: '教科書 p.115（改編）', code: C('word = "Work Hard!"', 'print(len(word), word[5], word[-1])'),
          q: '先估：輸出是什麼？', options: ['10 H !', '9 H !', '10 a !', '10 H d'],
          why: '"Work Hard!" 有 10 個字符（空格和「!」都計算）；索引 5 是 H（索引 4 是空格）；-1 是最後一個字符「!」。' },
      ],
      practice: [
        { id: 'u7-s1-p1', type: 'mc', pts: 2, src: '教科書 p.115', q: '運行以下程式，結果是什麼？',
          code: C('word = "cat"', 'word[0] = "b"', 'print(word)'), ask: { error: true }, verify: true,
          options: ['IndexError', 'TypeError', 'SyntaxError', '沒有錯誤'], answer: 1,
          hint: '字串的字符不能直接被賦值（p.115）。' },
        { id: 'u7-s1-p2', type: 'fill', pts: 2, src: '教科書 p.117（改編）', q: '以下程式點算字母 o 的數目。寫出輸出，及第 4 行（if）執行了多少次。',
          code: C('sentence = "Hong Kong is good"', 'count = 0', 'for i in range(0, len(sentence)):', '    if sentence[i] == "o":', '        count = count + 1', 'print(count)'),
          blanks: [{ label: '輸出', ask: 'out' }, { label: '第 4 行執行次數', ask: { count: 4 } }], hint: 'if 對每個字符（包括空格）都判斷一次，共 len(sentence) 次。' },
        { id: 'u7-s1-p3', type: 'mc', pts: 2, src: '自擬', q: '運行以下程式，結果是什麼？',
          code: C('s = "DSE"', 'print(s[3])'), ask: { error: true }, verify: true,
          options: ['E', 'IndexError', 'TypeError', '沒有錯誤'], answer: 1,
          hint: '"DSE" 的索引只有 0、1、2。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '找出字符：for、while、元音、單詞數、對稱字', pages: '教科書 p.117–122',
      learn: [
        { pts: [
          '**用 for 找字符**：`found = False`，逐個比較，相同便 `found = True`；循環一定會走完整個字串。（p.117）',
          '**用 while 找第一個位置**：條件 `i < N and found == False`，找到便停止；`index` 先設為 -1，代表找不到。（p.120）',
          '例題 5.9：數元音字母——每個字符與 "a"、"e"、"i"、"o"、"u" 比較，可寫 5 個 if，或用 `or` 連成一個條件（長條件可用「\\」分行）。（p.118）',
          '測試站 5.8：沒有連續空格時，**單詞數 = 空格數 + 1**。（p.119）',
          '測試站 5.8 挑戰題：「對稱字」（迴文，如 level、noon）——第 i 個字符要等於倒數第 i 個，即 `word[i] == word[length-1-i]`。（p.119–120）',
          '例題 5.10：找第二個詞語的長度——先找第一及第二個空格的位置，再計算兩者之間的字符數。（p.121–122）',
        ] },
        { warn: '大楷和細楷是**不同的字符**："A" == "a" 是 False。例題 5.9 的程式只數細楷元音；要同時數大楷，便要多比較 "A"、"E"、"I"、"O"、"U"（p.118 想像）。' },
        { sim: { code: C('the_string = "Work Hard!"', 'target = "r"', 'index = -1', 'found = False', 'i = 0', 'N = len(the_string)', 'while i < N and found == False:', '    if target == the_string[i]:', '        index = i', '        found = True', '    i = i + 1', 'print(index)'), open: ['vars', 'trace'], step: true }, cap: 'p.120：用 while 找第一個 "r"。找到後 found 變成 True，循環便停止——第二個 "r"（索引 7）不會被檢查。' },
      ],
      tries: [
        { id: 'u7-s2-t1', pts: 4, src: '教科書 p.119–120 測試站 5.8 第 2 題', code: C('word = "moon"', 'sym = True', 'length = len(word)', 'for i in range(0, length):', '    if word[i] != word[length-1-i]:', '        sym = False', 'print(sym)'),
          q: '先估：輸出是什麼？', options: ['True', 'False', 'moon', 'noom'],
          why: 'word[0] 是 m，word[3] 是 n，不相同，所以 sym 變成 False。' },
      ],
      practice: [
        { id: 'u7-s2-p1', type: 'complete', pts: 3, src: '教科書 p.118 例題 5.9', label: '補完程式',
          q: '輸入一個英文單詞，輸出其中**元音字母（a、e、i、o、u，只計細楷）**的總數。例如 intelligence → 5，example → 3。',
          template: C('word = input()', 'count = 0', 'length = len(word)', 'for i in range(0, length):', '    if ［1］:', '        count = count + 1', 'print(count)'),
          ref: ['word[i] == "a" or word[i] == "e" or word[i] == "i" or word[i] == "o" or word[i] == "u"'],
          tests: [{ inputs: 'intelligence' }, { inputs: 'example' }, { inputs: 'rhythm' }, { inputs: 'AEIOUaeiou' }, { inputs: 'u' }],
          hint: '用 `or` 把五個比較連起來：`word[i] == "a" or word[i] == "e" or …`。注意大楷 A 不計算。' },
        { id: 'u7-s2-p2', type: 'complete', pts: 2, src: '教科書 p.119 測試站 5.8 第 1 題', label: '補完程式',
          q: '輸入一句句子（沒有連續空格），輸出單詞總數。例如 This is an example. → 4。',
          template: C('sentence = input()', 'word_count = 0', 'length = len(［1］)', 'for i in range(0, length):', '    if sentence[i] == ［2］:', '        word_count = ［3］', 'print(［4］)'),
          ref: ['sentence', '" "', 'word_count + 1', 'word_count + 1'],
          tests: [{ inputs: 'This is an example.' }, { inputs: 'I love coding.' }, { inputs: 'I go to school by bus.' }, { inputs: 'Hello' }],
          hint: '數空格；最後一個單詞後沒有空格，所以輸出時要再加 1。' },
        { id: 'u7-s2-p3', type: 'fill', pts: 2, src: '教科書 p.121–122 例題 5.10', q: '例題 5.10 的完整程式。輸入「I love coding.」，寫出 first_space、second_space 的最終值及輸出。',
          code: C('sentence = input()', 'first_space = -1', 'second_space = -1', 'length = len(sentence)', '# Find the first occurrence from 0', 'i = 0', 'while i < length and first_space == -1:', '    if sentence[i] == " ":', '        first_space = i', '    i = i + 1', '# Find the second occurrence from "first_space + 1"', 'i = first_space + 1', 'while i < length and second_space == -1:', '    if sentence[i] == " ":', '        second_space = i', '    i = i + 1', 'if first_space == -1 and second_space == -1:', '    print("0")', 'elif second_space == -1:', '    print(length-first_space-1)', 'else:', '    print(second_space-first_space-1)'),
          inputs: 'I love coding.',
          blanks: [{ label: 'first_space', ask: { var: 'first_space' } }, { label: 'second_space', ask: { var: 'second_space' } }, { label: '輸出', ask: 'out' }],
          hint: '「I」後面的空格在索引 1；「love」後面的空格在索引 6。第二個詞語長度 = 6 − 1 − 1。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '提取子字串：循環與切片', pages: '教科書 p.123–126',
      learn: [
        { pts: [
          '**子字串（substring）**：從字串中提取的部分字符。知道**開始索引**和**結束索引**，便可用 for 循環把字符逐一合併到新字串。（p.123）',
          '`for i in range(0, 4): sub_word = sub_word + word[i]` 提取索引 0 至 3，即 "Work"；range 的終值 4 **不包括在內**。（p.123）',
          '擴闊視野：**切片** `word[5:7]` 得 "Ha"，`word[2:4]` 得 "rk"——同樣不包括結束索引。（p.123）',
          '切片可省略開始或結束：`word[:4]` 由頭開始，`word[5:]` 到尾為止。',
          '例題 5.11：全名格式是「名字 空格 姓氏」——找出空格位置 `space`，`range(0, space)` 是名字，`range(space+1, N)` 是姓氏；找不到空格（space 仍是 -1）便輸出 "Not a proper name"。（p.124–125）',
          '測試站 5.9：要找**最後一個**句點，所以用 for 循環走完整個字串（每次遇到 "." 便更新 `dot`），不需要用 while 提早停止。（p.126）',
        ] },
        { table: { head: ['索引', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], rows: [['字符', 'W', 'o', 'r', 'k', '（空格）', 'H', 'a', 'r', 'd', '!']] }, cap: '"Work Hard!"：`word[0:4]` 是 Work；`word[5:9]` 是 Hard（p.123 試想想：range(5, 9)）。' },
        { sim: { code: C('fullname = input()', 'firstname = ""', 'lastname = ""', 'N = len(fullname)', 'space = -1', 'for i in range(0, N):', '    if fullname[i] == " ":', '        space = i', 'if space != -1:', '    for i in range(0, space):', '        firstname = firstname + fullname[i]', '    for i in range(space+1, N):', '        lastname = lastname + fullname[i]', '    print(lastname)', '    print(firstname)', 'else:', '    print("Not a proper name")'), inputs: 'Peter Chan', open: ['vars'], step: true }, cap: '例題 5.11（p.125）：試輸入 Peter Chan、Mary Li、JohnJohn。想像：輸入「Tai Man Chan」會怎樣？' },
      ],
      tries: [
        { id: 'u7-s3-t1', pts: 4, src: '教科書 p.124 活動 5.3 第 2 題', code: C('d = "google.com.hk"', 'sd = ""', 'for i in range(7, 10):', '    sd = sd + d[i]', 'print(sd)'),
          q: '先估：輸出是什麼？', options: ['com', 'com.', '.com', 'om.'],
          why: '索引 6 是「.」，索引 7、8、9 是 c、o、m；range(7, 10) 不包括 10。' },
        { id: 'u7-s3-t2', pts: 4, src: '教科書 p.123 擴闊視野（改編）', tags: [TRAP_SLICE], code: C('word = "Work Hard!"', 'print(word[5:7] + word[2:4])', 'print(word[:4] + word[9:])'),
          q: '先估：輸出是什麼？（兩行）', options: ['Hark\nWork!', 'Har rk\nWork!', 'Hark\nWor!', 'Ha rk\nWorkd!'],
          why: 'word[5:7] 是 "Ha"、word[2:4] 是 "rk"，合併得 "Hark"；word[:4] 是 "Work"，word[9:] 是 "!"。' },
      ],
      practice: [
        { id: 'u7-s3-p1', type: 'fill', pts: 2, src: '教科書 p.124 活動 5.3 第 1 題（另加切片）', q: '寫出 y、m、dd 的最終值。',
          code: C('d = "2021.01.01"', 'y = ""', 'for i in range(0, 4):', '    y = y + d[i]', 'm = d[5:7]', 'dd = d[8:]'),
          blanks: [{ label: 'y', ask: { var: 'y' } }, { label: 'm', ask: { var: 'm' } }, { label: 'dd', ask: { var: 'dd' } }],
          hint: '索引 4 和 7 是句點。' },
        { id: 'u7-s3-p2', type: 'complete', pts: 3, src: '教科書 p.126 測試站 5.9', label: '補完程式',
          q: '輸入網域名稱，輸出最右邊的域名（頂級域名 TLD）；沒有句點便輸出 "Not a proper domain name"。例如 www.google.com → com，www.gov.hk → hk。',
          template: C('domain = input()', 'tld = ""', 'N = len(domain)', 'dot = -1', 'for i in range(［1］):', '    if ［2］:', '        dot = i', 'if dot != -1:', '    for i in range(［3］):', '        ［4］', '    print(tld)', 'else:', '    print("Not a proper domain name")'),
          ref: ['0, N', 'domain[i] == "."', 'dot+1, N', 'tld = tld + domain[i]'],
          tests: [{ inputs: 'www.google.com' }, { inputs: 'www.gov.hk' }, { inputs: 'localhost' }, { inputs: 'a.b' }, { inputs: 'www.hkeaa.edu.hk' }],
          hint: '要走完整個字串才知道最後一個句點在哪裏；TLD 由 dot 的下一個索引開始。' },
        { id: 'u7-s3-p3', type: 'mc', pts: 1, src: '教科書 p.123（改編）', q: '以下程式的輸出是什麼？', verify: true,
          code: C('s = "CHEUNG"', 'sub = ""', 'for i in range(1, 4):', '    sub = sub + s[i]', 'print(sub)'),
          options: ['CHE', 'HEU', 'HEUN', 'CHEU'], answer: 1, hint: 'i 是 1、2、3。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: 'ASCII：判斷字符的類別；密碼檢查', pages: '教科書 p.127–131',
      learn: [
        { pts: [
          '**ASCII** 是常用的字符編碼。`ord()` 傳回字符的 ASCII：`ord("a")` 是 97，`ord("B")` 是 66。（p.127）',
          '比較字符其實是比較 ASCII：`"B" > "a"` 是 False（66 < 97）；`"s" > "l"` 是 True（115 > 108）。（p.127）',
          'ASCII 的特點：**大楷 A–Z 是 65–90，細楷 a–z 是 97–122，數字 0–9 是 48–57**，各自按順序排列。（p.127 表 5.1）',
          '所以判斷類別只需檢查範圍：大楷 `ch >= "A" and ch <= "Z"`；細楷 `ch >= "a" and ch <= "z"`；數字 `ch >= "0" and ch <= "9"`。（p.128 例題 5.12）',
          '`chr()` 是 `ord()` 的相反：`chr(65)` 得 "A"。細楷轉大楷：`chr(ord(ch) - 32)`（97 − 65 = 32）。',
          '測試站 5.10：密碼要求 (1) 至少 8 個字符；(2) 不得有空格；(3) 至少一個數字、一個大楷及一個細楷字母。輸入兩次密碼是為了**數據校驗**（雙重確認）。（p.129–131）',
        ] },
        { table: { head: ['字符', '0', '9', 'A', 'Z', 'a', 'z', '（空格）'], rows: [['ASCII', '48', '57', '65', '90', '97', '122', '32']] }, cap: '要記的 ASCII 分界值' },
        { warn: '比較**多位數字的字串**時是逐個字符比較：`"10" < "9"` 是 True（因為 "1" < "9"）。要比較數值大小，先用 `int()` 轉換。' },
        { sim: { code: C('password = input("Please enter your password: ")', 'count = 0', 'for item in password:', '    count = count + 1', 'cap_letter = False', 'small_letter = False', 'digit = False', 'for i in range(0, count):', '    if password[i] >= "A" and password[i] <= "Z":', '        cap_letter = True', '    if password[i] >= "a" and password[i] <= "z":', '        small_letter = True', '    if password[i] >= "0" and password[i] <= "9":', '        digit = True', 'if cap_letter == False:', '    print("At least one capital letter is required")', 'if small_letter == False:', '    print("At least one small letter is required")', 'if digit == False:', '    print("At least one digit is required")'), inputs: 'iAMaPassword', open: ['vars'] }, cap: '測試站 5.10(c)（p.130）：試輸入 iAMaPassword、abc12345、Ab345678。' },
      ],
      tries: [
        { id: 'u7-s4-t1', pts: 4, src: '教科書 p.127（改編）', code: C('print(ord("C") - ord("A"), chr(ord("a") + 3))', 'print("B" > "a", "s" > "l")'),
          q: '先估：輸出是什麼？（兩行）', options: ['2 d\nFalse True', '3 d\nFalse True', '2 D\nTrue True', '2 d\nTrue False'],
          why: '67 − 65 = 2；97 + 3 = 100 是 "d"。"B"（66）不大於 "a"（97）；"s"（115）大於 "l"（108）。' },
      ],
      practice: [
        { id: 'u7-s4-p1', type: 'complete', pts: 2, src: '教科書 p.128 例題 5.12', label: '補完程式',
          q: '輸入一個字符，判斷它是大楷還是細楷字母（其他字符沒有輸出）。',
          template: C('inputLetter = input()', 'if ［1］ and ［2］:', '    print("It is a capital letter.")', 'if ［3］ and ［4］:', '    print("It is a small letter.")'),
          ref: ['inputLetter >= "A"', 'inputLetter <= "Z"', 'inputLetter >= "a"', 'inputLetter <= "z"'],
          tests: [{ inputs: 'K' }, { inputs: 'h' }, { inputs: 'A' }, { inputs: 'z' }, { inputs: '@' }, { inputs: '[' }, { inputs: '`' }, { inputs: '{' }],
          hint: 'A–Z 和 a–z 各自連續；用 >= 和 <= 包住兩端（"@" 是 64，"[" 是 91，"`" 是 96，"{" 是 123）。' },
        { id: 'u7-s4-p2', type: 'mc', pts: 2, src: '自擬', tags: [{ t: 'trap', why: '字串比較是逐個字符比較 ASCII，不是比較數值。' }], verify: true,
          q: '以下程式的輸出是什麼？', code: C('print("Zoo" < "apple", "10" < "9")'),
          options: ['True True', 'False True', 'True False', 'False False'], answer: 0,
          hint: '"Z" 是 90，"a" 是 97；"1" 是 49，"9" 是 57。' },
        { id: 'u7-s4-p3', type: 'complete', pts: 2, src: '教科書 p.129 測試站 5.10(a)、(b)', label: '補完程式',
          q: '檢查密碼：少於 8 個字符輸出 "Your password is too short!"；有空格輸出 "No spaces are allowed!"。（書中答案行尾多了冒號，這裏已更正。）',
          template: C('password = input("Please enter your password: ")', 'pw_length = False', 'count = 0', 'for item in ［1］:', '    count = count + 1', 'if ［2］:', '    pw_length = True', 'else:', '    print("Your password is too short!")', 'nospace = True', 'for i in range(0, count):', '    if ［3］:', '        nospace = ［4］', 'if nospace == False:', '    print("No spaces are allowed!")'),
          ref: ['password', 'count >= 8', 'password[i] == " "', 'False'],
          tests: [{ inputs: 'abcd1234' }, { inputs: 'abc1234' }, { inputs: 'ab cd 12' }, { inputs: 'a b' }, { inputs: 'iAMaPassword' }],
          hint: '「至少 8 個」即 count >= 8；7 個字符應該是太短。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.117–131',
      tasks: [
        { id: 'u7-w1', tier: '必做', pts: 10, title: '大楷字母與數字', src: '仿教科書 p.128 例題 5.12、p.130 測試站 5.10(c)',
          q: '輸入一句句子，用 for 循環逐個字符檢查，輸出**大楷字母的數目**和**數字（0–9）的數目**，用一個 `print`（例如 `print(cap, num)`）。\n不可以用 `isupper()`、`isdigit()`，要用字符比較（例如 `ch >= "A" and ch <= "Z"`）。',
          starter: C('s = input("Sentence: ")', ''),
          ref: C('s = input("Sentence: ")', 'cap = 0', 'num = 0', 'for ch in s:', '    if ch >= "A" and ch <= "Z":', '        cap = cap + 1', '    if ch >= "0" and ch <= "9":', '        num = num + 1', 'print(cap, num)'),
          tests: [{ inputs: 'Hong Kong DSE 2027' }, { inputs: 'abc xyz' }, { inputs: 'AZ09az' }, { inputs: '@[/:`{' }, { inputs: 'Room 9 in Block Z' }],
          rules: [{ must: 'for', msg: '要用 for 循環逐個字符檢查。' }, { mustNot: 'isupper', msg: '不可用 isupper()，請用字符比較。' }, { mustNot: 'isdigit', msg: '不可用 isdigit()，請用字符比較。' }],
          hint: '兩個點算變量都由 0 開始；在循環內用兩個獨立的 if（一個字符不會同時是大楷和數字）。' },
        { id: 'u7-w2', tier: '進階', pts: 12, title: '姓名縮寫', src: '仿教科書 p.124–125 例題 5.11、p.127–128',
          q: '輸入英文全名（詞語之間只有一個空格，頭尾沒有空格），輸出每個詞語第一個字母組成的**大楷縮寫**。\n例如 `chan tai man` → `CTM`，`Peter Chan` → `PC`。\n細楷要用 `ord()` 和 `chr()` 轉成大楷（不可用 `upper()`、`split()`）。',
          starter: C('name = input("Name: ")', 'initials = ""', ''),
          ref: C('name = input("Name: ")', 'initials = ""', 'for i in range(0, len(name)):', '    if i == 0 or name[i-1] == " ":', '        ch = name[i]', '        if ch >= "a" and ch <= "z":', '            ch = chr(ord(ch) - 32)', '        initials = initials + ch', 'print(initials)'),
          tests: [{ inputs: 'chan tai man' }, { inputs: 'Peter Chan' }, { inputs: 'a' }, { inputs: 'Lee siu Ming' }, { inputs: 'z y x' }],
          rules: [{ mustNot: 'upper(', msg: '請用 ord() 和 chr() 轉換大楷，不可用 upper()。' }, { mustNot: 'split', msg: '請用循環逐個字符處理，不可用 split()。' }, { must: 'chr(', msg: '要用 chr() 把 ASCII 轉回字符。' }],
          hint: '一個字符是詞語的第一個字母，當它是索引 0，或前一個字符（`name[i-1]`）是空格。細楷轉大楷：`chr(ord(ch) - 32)`。' },
        { id: 'u7-w3', tier: '挑戰', pts: 13, title: '設立密碼', src: '仿教科書 p.129–131 測試站 5.10',
          q: '輸入密碼兩次。按以下次序檢查，只輸出**第一個**符合的訊息：\n1. 兩次不相同 → `Not match`\n2. 少於 8 個字符 → `Too short`\n3. 有空格 → `No space allowed`\n4. 沒有數字 → `Need a digit`\n5. 以上都沒有 → `OK`',
          starter: C('password = input("Password: ")', 'password_2 = input("Again: ")', ''),
          ref: C('password = input("Password: ")', 'password_2 = input("Again: ")', 'nospace = True', 'digit = False', 'for ch in password:', '    if ch == " ":', '        nospace = False', '    if ch >= "0" and ch <= "9":', '        digit = True', 'if password != password_2:', '    print("Not match")', 'elif len(password) < 8:', '    print("Too short")', 'elif nospace == False:', '    print("No space allowed")', 'elif digit == False:', '    print("Need a digit")', 'else:', '    print("OK")'),
          tests: [{ inputs: 'abc12345\nabc12345' }, { inputs: 'abc12345\nabc1234' }, { inputs: 'abc1234\nabc1234' }, { inputs: 'abcdefg1\nabcdefg1' }, { inputs: 'abc 12345\nabc 12345' }, { inputs: 'abcdefgh\nabcdefgh' }],
          hint: '先用一個循環找出「有沒有空格」和「有沒有數字」兩個旗標，然後用 if / elif / else 按次序輸出。8 個字符剛好合格（邊界值）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.115–131、p.156',
      items: [
        { id: 'u7-q1', pts: 4, src: '教科書 p.156 課題練習 選擇題 10', tags: [HOT_STR],
          q: '閱讀以下的 Python 程式。如果程式的輸出是「Hello」，以下哪一項最適合用來填上空格？',
          code: C('d = "Hello_world"', 'y = ""', 'for i in range(0, 5):', '    ______', 'print(y)'),
          options: ['y = y + d', 'y = y + d[i-1]', 'y = y + d[i+1]', 'y = y + d[i]'], answer: 'D',
          why: 'i 是 0 至 4，逐個加入 d[0] 至 d[4]，即 "Hello"。B 會先加入 d[-1]（"d"）；C 由 "e" 開始。' },
        { id: 'u7-q2', pts: 4, src: '自擬（DSE 題型）', tags: [TRAP_SLICE], verify: true,
          q: '以下程式的輸出是什麼？', code: C('s = "COMPUTER"', 'print(s[2:5])'),
          options: ['OMP', 'MPU', 'MPUT', 'OMPU'], answer: 'B',
          why: '索引 2、3、4 是 M、P、U；結束索引 5 不包括在內。' },
        { id: 'u7-q3', pts: 4, src: '自擬（DSE 題型）', tags: [HOT_STR], verify: true,
          q: '以下程式的輸出是什麼？', code: C('s = "committee"', 'n = 0', 'for i in range(0, len(s) - 1):', '    if s[i] == s[i+1]:', '        n = n + 1', 'print(n)'),
          options: ['1', '2', '3', '4'], answer: 'C',
          why: '相鄰而相同的有 mm、tt、ee。range 到 len(s) - 1 為止，避免讀取 s[9] 出 IndexError。' },
        { id: 'u7-q4', pts: 4, src: '自擬（考點：教科書 p.127 ASCII）', tags: [{ t: 'trap', why: '大楷的 ASCII 比細楷小；字串逐個字符比較。' }],
          q: '以下哪一個運算式的值是 True？',
          options: ['"a" < "B"', '"Cat" < "Car"', '"9" < "10"', '"Apple" < "apple"'], answer: 'D',
          why: '"A"（65）< "a"（97），所以 "Apple" < "apple"。A：97 < 66 不成立；B：第三個字符 "t"（116）> "r"（114）；C："9"（57）> "1"（49）。' },
        { id: 'u7-q5', pts: 4, src: '自擬（考點：教科書 p.119–120 對稱字）',
          q: '以下程式的目的是什麼？', code: C('s = input()', 't = ""', 'for i in range(len(s) - 1, -1, -1):', '    t = t + s[i]', 'print(t == s)'),
          options: ['檢查 s 是否全是細楷字母', '檢查 s 是否對稱字（倒轉後與原本相同）', '輸出 s 倒轉後的字串', '點算 s 的字符數目'], answer: 'B',
          why: '循環由最後一個字符倒數到索引 0，t 是 s 倒轉後的字串；輸出的是 t == s 的結果（True／False），不是 t 本身。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyStr', 'pyAscii'], intro: '隨機生成字串索引、切片、len、ord／chr 及字串比較題目，答案由 Python 計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
