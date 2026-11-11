/* 單元 c9a：綜合練習（一）——子程式與二維陣列
 * 教科書 選修C 綜合練習 第 1–3 題（書頁 p.332–336）及開放式問題第 4 題「河內塔」（p.342–343）。
 * 教科書以偽代碼出題（陣列索引由 1 開始）；本單元改寫為 Python（列表索引由 0 開始），
 * 數值（座標、座位編號、行列號碼）保持與書相同。所有答案在 build 時由 CPython 計算／核對。
 * 教科書疑似錯誤：p.341 開放式問題 1「四子棋」程式輸出把欄號標示為「Row」（應為欄 Column）。（不影響本單元題目）
 * 教科書疑似錯誤：p.336 第 3(c)(i) 題答案「設 i 由 1 至 sold()」假設陣列 row/col/name 的項目數目必等於已售座位數（sold() 掃描二維陣列 seat）；若兩者不同步便會出錯，書中沒有說明。（照錄，只作提示）
 */
const R = String.raw;

const PATH = R`path = []
def move(x, y):
    path.append(f'({x},{y})')
`;

const ROBOT = R`D = 2
X = 2
Y = 1

def FW():
    global X, Y
    if D == 0:
        Y = Y - 1
    elif D == 1:
        X = X + 1
    elif D == 2:
        Y = Y + 1
    else:
        X = X - 1

def TL():
    global D
    D = (D + 3) % 4

def TR():
    global D
    D = (D + 1) % 4
`;

const SEAT = R`seat = [[0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 'C2', 'C3', 0, 'C5', 0, 0, 0],
        [0, 0, 0, 'D4', 'D5', 0, 0, 0],
        [0, 0, 0, 0, 0, 'E6', 'E7', 0]]
`;

const SOLD = R`def sold():
    total = 0
    for i in range(5):
        for j in range(8):
            if seat[i][j] != 0:
                total = total + 1
    return total
`;

const NAMES = R`row = [3, 3, 3, 4, 4, 5, 5]
col = [2, 3, 5, 4, 5, 6, 7]
name = ['Katie', 'Aaron', 'Andy', 'Erica', 'Iris', 'Tom', 'May']
`;

// 機械車：讀入 X Y D，計算步數
const ROBOT_IO = R`steps = 0

def FW():
    global X, Y, steps
    steps = steps + 1
    if D == 0:
        Y = Y - 1
    elif D == 1:
        X = X + 1
    elif D == 2:
        Y = Y + 1
    else:
        X = X - 1

def TL():
    global D, steps
    steps = steps + 1
    D = (D + 3) % 4
`;

const HOT_2D = { t: 'hot', why: '二維陣列配合巢式循環（DSE 2015 卷二D 第 3 題為本書第 3 題的參考）' };
const HOT_SUB = { t: 'hot', why: '用子程式控制機械裝置（DSE 2022 卷二D 第 1 題為本書第 2 題的參考）' };

module.exports = {
  id: 'c9a',
  title: '綜合練習（一）：子程式與二維陣列',
  book: '教科書 選修C 綜合練習 第 1–3 題 p.332–336；開放式問題 4 p.342–343',
  key: 'C-c9a-hmac-ebfc020356',
  sections: [
    {
      id: 's1', title: '激光切割機：子程式與參數', pages: '教科書 p.332–333（綜合練習第 1 題）',
      learn: [
        { pts: [
          '**子程式**把一組常用步驟包起來，用**參數**傳入不同數值，便可重複使用。（p.332–333）',
          '第 1 題：`rect(x, y, w, h)` 由 (x, y) 開始，向右順時針切割 w × h 的長方形，依次經過 (x, y) → (x+w, y) → (x+w, y−h) → (x, y−h) → (x, y)。（p.333）',
          '本單元把「移動噴嘴至 surface[x,y]」改寫為 Python 函數 `move(x, y)`：把位置記錄在列表 `path`，最後一次過輸出。',
          '在 Python 中，偽代碼的 `設 i 由 1 至 3` 寫成 `for i in range(3)`（執行 3 次）。',
        ] },
        { sim: { code: R`def move(x, y):
    print('Move to', x, y)

def rect(x, y, w, h):
    move(x, y)
    print('Start cutting')
    move(x + w, y)
    move(x + w, y - h)
    move(x, y - h)
    move(x, y)
    print('Stop cutting')

rect(1, 3, 4, 2)`, open: ['vars', 'trace'], step: true },
          cap: '書中例子 `rect(1, 3, 4, 2)`（p.332）：切割出 4 × 2 的長方形。試把最後一行改為 `rect(2, 5, 3, 4)`。' },
      ],
      tries: [
        { id: 'c9a-s1-t1', pts: 4, src: '教科書 p.332 綜合練習第 1(a) 題（改寫為 Python）',
          code: PATH + R`
x = 1
y = 1
move(x, y)
for i in range(3):
    y = y + 1
    move(x, y)
    x = x + 1
    move(x, y)
move(4, 1)
move(1, 1)
print(' '.join(path))`,
          q: '先估：噴嘴依次經過哪些位置？', options: [
            '(1,1) (1,2) (2,2) (2,3) (3,3) (3,4) (4,4) (4,1) (1,1)',
            '(1,1) (2,1) (2,2) (3,2) (3,3) (4,3) (4,4) (4,1) (1,1)',
            '(1,1) (1,2) (2,2) (2,3) (3,3) (4,1) (1,1)',
            '(1,1) (1,2) (2,3) (3,4) (4,1) (1,1)'],
          why: '每次循環先 y 加 1（向上），再 x 加 1（向右），所以切出階梯形；最後回到 (4,1) 再到 (1,1)。（p.332 答案）' },
        { id: 'c9a-s1-t2', pts: 4, src: '教科書 p.333 綜合練習第 1(b)(i) 題',
          code: PATH + R`
def rect(x, y, w, h):
    move(x, y)
    move(x + w, y)
    move(x + w, y - h)
    move(x, y - h)
    move(x, y)

rect(2, 5, 3, 4)
print(' '.join(path))`,
          q: '先估：調用 `rect(2, 5, 3, 4)`，噴嘴依次經過哪些位置？', options: [
            '(2,5) (5,5) (5,1) (2,1) (2,5)',
            '(2,5) (6,5) (6,2) (2,2) (2,5)',
            '(2,5) (5,5) (5,9) (2,9) (2,5)',
            '(2,5) (2,1) (5,1) (5,5) (2,5)'],
          why: '闊 w = 3：x 由 2 到 5；高 h = 4：y 由 5 減到 1。先向右再向下，是順時針。' },
      ],
      practice: [
        { id: 'c9a-s1-p1', type: 'complete', pts: 3, src: '教科書 p.333 綜合練習第 1(b)(ii) 題', label: '補完程式',
          q: '完成子程式 `rect(x, y, w, h)`：由 (x, y) 開始，向右順時針切割 w × h 的長方形。會用多組數據測試。',
          template: PATH + R`
def rect(x, y, w, h):
    move(［1］)
    move(［2］)
    move(［3］)
    move(［4］)
    move(［5］)

nums = input('x y w h: ').split()
rect(int(nums[0]), int(nums[1]), int(nums[2]), int(nums[3]))
print(' '.join(path))`,
          ref: ['x, y', 'x + w, y', 'x + w, y - h', 'x, y - h', 'x, y'],
          tests: [{ inputs: '1 3 4 2' }, { inputs: '2 5 3 4' }, { inputs: '0 1 1 1' }],
          hint: '書中答案：surface[x,y]、surface[x+w,y]、surface[x+w,y-h]、surface[x,y-h]、surface[x,y]。向右是 x 加，向下是 y 減。' },
        { id: 'c9a-s1-p2', type: 'mc', pts: 2, src: '教科書 p.333 綜合練習第 1(c) 題',
          q: '要切割頂點為 (1,5)、(5,5)、(5,4)、(1,4) 的長方形，應調用哪一個？',
          options: ['rect(1, 5, 4, 1)', 'rect(1, 4, 4, 1)', 'rect(1, 5, 1, 4)', 'rect(5, 5, 4, 1)'], answer: 0,
          hint: '起點是左上角 (1,5)；闊 5 − 1 = 4，高 5 − 4 = 1。' },
        { id: 'c9a-s1-p3', type: 'fill', pts: 3, src: '自擬（延伸第 1 題）',
          q: '以下程式切割一排三個 1 × 1 的正方形。運行後，`move` 函數內的第 3 行執行了多少次？列表 path 最後一項是什麼？',
          code: PATH + R`
def rect(x, y, w, h):
    move(x, y)
    move(x + w, y)
    move(x + w, y - h)
    move(x, y - h)
    move(x, y)

for k in range(3):
    rect(1 + 2 * k, 5, 1, 1)`,
          blanks: [{ label: '第 3 行執行次數', ask: { count: 3 } }, { label: 'path[-1]', ask: { expr: 'path[-1]' } }],
          hint: '每次調用 rect 便調用 move 五次；最後一個正方形由 x = 5 開始。' },
      ],
    },
    {
      id: 's2', title: '吸塵機械車：用子程式控制移動', pages: '教科書 p.334–335（綜合練習第 2 題）',
      learn: [
        { pts: [
          '機械車內置三個子程式：`FW` 向前一格、`TL` 逆時針轉 90°、`TR` 順時針轉 90°。（p.334）',
          '變量 `D` 是方向：0 北、1 東、2 南、3 西；`X`、`Y` 是與左上角充電器的水平和垂直距離。（p.334）',
          '本單元的 Python 版本：向北走 `Y` 減 1，向西走 `X` 減 1。`TL` 令 `D = (D + 3) % 4`（例如由北 0 轉到西 3），`TR` 令 `D = (D + 1) % 4`。',
          '`goZero()`：面向北時，先走 Y 步，再 TL（轉向西），走 X 步。（p.335）',
          '`turnZero()`：TL 共 D 次便會面向北。`goBack()`：先 `turnZero()` 再 `goZero()`。（p.335）',
          '注意：`for i in range(D)` 的次數在循環**開始時**已決定，即使循環內 D 改變也不影響次數。',
        ] },
        { table: { head: ['D', '方向', 'FW 的效果'], rows: [['0', '北', 'Y − 1'], ['1', '東', 'X + 1'], ['2', '南', 'Y + 1'], ['3', '西', 'X − 1']] } },
        { sim: { code: ROBOT + R`
FW()
TL()
FW()
TL()
FW()
TR()
FW()
print(X, Y, D)`, open: ['vars', 'trace'], step: true },
          cap: '第 2(a) 題（p.334）：機械車在第 2 行第 3 欄（X = 2、Y = 1），面向南（D = 2）。按「下一步」跟着它走。' },
      ],
      tries: [
        { id: 'c9a-s2-t1', pts: 4, src: '教科書 p.334 綜合練習第 2(a) 題（改寫為 Python）',
          code: ROBOT + R`
FW()
TL()
FW()
TL()
FW()
TR()
FW()
print(X, Y, D)`,
          q: '先估：機械車起初 X = 2、Y = 1、面向南（D = 2）。輸出是什麼？', options: ['4 1 1', '4 3 1', '2 3 3', '4 1 3'],
          why: '向南走到 Y = 2；TL 轉向東，走到 X = 3；TL 轉向北，走到 Y = 1；TR 轉向東，走到 X = 4。書中答案：終點在第 2 行第 5 欄，面向東。' },
        { id: 'c9a-s2-t2', pts: 4, src: '自擬（延伸第 2 題）',
          q: '先估：機械車由充電器出發（X = 0、Y = 0），面向東（D = 1）。輸出是什麼？',
          code: ROBOT + R`
X = 0
Y = 0
D = 1
for cmd in ['FW', 'FW', 'TR', 'FW', 'TR', 'FW']:
    if cmd == 'FW':
        FW()
    elif cmd == 'TL':
        TL()
    else:
        TR()
print(X, Y, D)`,
          options: ['1 1 3', '3 1 1', '1 1 1', '2 1 3'],
          why: '向東走兩格（X = 2）；TR 轉向南，走一格（Y = 1）；TR 轉向西，走一格（X = 1），面向西（D = 3）。' },
      ],
      practice: [
        { id: 'c9a-s2-p1', type: 'complete', pts: 3, src: '教科書 p.335 綜合練習第 2(b)(i) 題', label: '補完程式',
          q: '假設 D = 0（面向北），完成 `goZero()`，令機械車返回左上角的充電器（X = 0、Y = 0）。會用多組數據測試。',
          template: ROBOT + R`
def goZero():
    for i in range(［1］):
        FW()
    ［2］
    for j in range(［3］):
        FW()

nums = input('X Y: ').split()
X = int(nums[0])
Y = int(nums[1])
D = 0
goZero()
print(X, Y, D)`,
          ref: ['Y', 'TL()', 'X'], tests: [{ inputs: '4 3' }, { inputs: '0 2' }, { inputs: '3 0' }],
          hint: '面向北先走 Y 步；充電器在左邊，所以逆時針轉向西（TL），再走 X 步。' },
        { id: 'c9a-s2-p2', type: 'complete', pts: 3, src: '教科書 p.335 綜合練習第 2(b)(ii)、(iii) 題', label: '補完程式',
          q: '完成 `turnZero()`（不論方向都轉向北）和 `goBack()`（不論方向都返回充電器）。會用多組數據測試。',
          template: ROBOT + R`
def goZero():
    for i in range(Y):
        FW()
    TL()
    for j in range(X):
        FW()

def turnZero():
    for i in range(［1］):
        ［2］

def goBack():
    ［3］
    ［4］

nums = input('X Y D: ').split()
X = int(nums[0])
Y = int(nums[1])
D = int(nums[2])
goBack()
print(X, Y, D)`,
          ref: ['D', 'TL()', 'turnZero()', 'goZero()'], tests: [{ inputs: '4 3 1' }, { inputs: '2 2 0' }, { inputs: '1 4 3' }, { inputs: '3 1 2' }],
          hint: '由方向 D 逆時針轉 D 次便回到 0（北）。goBack 先轉向北，再調用 goZero。' },
        { id: 'c9a-s2-p3', type: 'fill', pts: 3, src: '自擬（延伸第 2(b)(ii) 題）',
          q: '如果 turnZero 只可用 TR（順時針），由東（D = 1）轉向北要轉多少次？運行以下程式，寫出 TR 函數內第 22 行執行的次數和 D 的最終值。',
          code: ROBOT + R`
D = 1
for i in range((4 - D) % 4):
    TR()`,
          blanks: [{ label: '第 22 行執行次數', ask: { count: 22 } }, { label: 'D', ask: { var: 'D' } }],
          hint: '東 → 南 → 西 → 北，順時針要轉 3 次；(4 − 1) % 4 = 3。' },
      ],
    },
    {
      id: 's3', title: '電影院座位：二維陣列', pages: '教科書 p.335–336（綜合練習第 3 題）',
      learn: [
        { pts: [
          '二維陣列 `seat` 表示座位表：行代表 A 至 E 行，列代表座位編號 1 至 8。已售出的座位儲存座位位置（例如 `C2`），未售出的儲存 `0`。（p.335）',
          '書中 `seat[3,2]`（索引由 1 開始）在 Python 寫成 `seat[2][1]`：**行和列都要減 1**。',
          '統計已售座位：用兩層 for 循環走遍每一格，`seat[i][j] != 0` 便加 1。（p.336）',
          '實名制：用三個列表 `row`、`col`、`name` 記錄每張已售的票，同一索引代表同一張票（**平行列表**）。（p.336）',
          '比較：三個列表在已售座位少時較省儲存空間；但要逐一檢索才知道某座位的顧客，需時較長。（p.336 答案）',
        ] },
        { table: { head: ['', '1', '2', '3', '4', '5', '6', '7', '8'], rows: [
          ['A', '0', '0', '0', '0', '0', '0', '0', '0'], ['B', '0', '0', '0', '0', '0', '0', '0', '0'],
          ['C', '0', 'C2', 'C3', '0', 'C5', '0', '0', '0'], ['D', '0', '0', '0', 'D4', 'D5', '0', '0', '0'],
          ['E', '0', '0', '0', '0', '0', 'E6', 'E7', '0']] } },
        { sim: { code: SEAT + '\n' + SOLD + R`
print(sold())
print(seat[2][1], seat[0][0])`, open: ['vars'], step: true },
          cap: '`sold()` 用巢式循環統計已售座位（p.336）。留意 `seat[2][1]` 就是 C 行 2 號。' },
      ],
      tries: [
        { id: 'c9a-s3-t1', pts: 4, src: '教科書 p.335 綜合練習第 3(a) 題（改寫為 Python 索引）',
          code: SEAT + R`
print(seat[2][4], seat[4][2], seat[3][4])`,
          q: '先估：書中的 `seat[3,5]`、`seat[5,3]`、`seat[4,5]` 在 Python 是 `seat[2][4]`、`seat[4][2]`、`seat[3][4]`。輸出是什麼？',
          options: ['C5 0 D5', 'D5 0 E6', '0 C3 0', 'C5 E3 D5'],
          why: 'seat[2][4] 是 C 行 5 號（C5）；seat[4][2] 是 E 行 3 號，未售出（0）；seat[3][4] 是 D 行 5 號（D5）。書中答案：C5、0、D5。' },
      ],
      practice: [
        { id: 'c9a-s3-p1', type: 'complete', pts: 3, src: '教科書 p.336 綜合練習第 3(b) 題', label: '補完程式',
          q: '完成子程式 `sold()`，傳回已售出的座位總數。程式會先多賣出一個輸入的座位（例如 `A1`）。會用多組數據測試。',
          template: SEAT + R`
def sold():
    total = ［1］
    for i in range(［2］):
        for j in range(［3］):
            if ［4］:
                total = total + 1
    return total

s = input('Sell seat: ')
r = ord(s[0]) - ord('A')
c = int(s[1:]) - 1
seat[r][c] = s
print(sold())`,
          ref: ['0', '5', '8', 'seat[i][j] != 0'], tests: [{ inputs: 'A1' }, { inputs: 'E8' }, { inputs: 'C2' }],
          hint: '5 行、每行 8 個座位；未售出的格儲存 0。C2 已售出，再賣一次總數不變。' },
        { id: 'c9a-s3-p2', type: 'complete', pts: 3, src: '教科書 p.336 綜合練習第 3(c)(i) 題', label: '補完程式',
          q: '完成子程式 `check(r, c)`：傳回第 r 行第 c 號座位的顧客名字；未售出傳回 `None`（字串）。row、col 用書中的行號和座位號（由 1 開始）。會用多組數據測試。',
          template: SEAT + '\n' + SOLD + '\n' + NAMES + R`
def check(r, c):
    customer = ［1］
    for i in range(［2］):
        if ［3］:
            customer = ［4］
    return customer

nums = input('Row Col: ').split()
print(check(int(nums[0]), int(nums[1])))`,
          ref: ['\'None\'', 'sold()', 'row[i] == r and col[i] == c', 'name[i]'],
          tests: [{ inputs: '3 5' }, { inputs: '4 4' }, { inputs: '1 1' }, { inputs: '5 7' }, { inputs: '3 4' }],
          hint: '書中答案：customer 先設為 "None"；循環次數是已售座位數 sold()；行**和**列都相同才是那張票。' },
        { id: 'c9a-s3-p3', type: 'mc', pts: 2, src: '自擬（延伸第 3 題）', verify: true, ask: { var: 'per_row' },
          q: '運行以下程式後，列表 `per_row` 是什麼？',
          code: SEAT + R`
per_row = []
for i in range(5):
    n = 0
    for j in range(8):
        if seat[i][j] != 0:
            n = n + 1
    per_row.append(n)`,
          options: ['[0, 0, 3, 2, 2]', '[3, 2, 2]', '[0, 0, 3, 5, 7]', '[2, 3, 2, 2, 0]'], answer: 0,
          hint: '每行重新由 0 開始點算，然後加入列表；A、B 行沒有已售座位。' },
      ],
    },
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.334–336、p.342–343',
      tasks: [
        { id: 'c9a-w1', pts: 10, title: '查詢一行的已售座位', src: '延伸教科書 p.335–336 綜合練習第 3 題',
          q: '座位表 `seat` 已寫好（同第 3 題）。輸入行號字母（A 至 E），在**同一行**輸出該行所有已售座位（以空格分隔，由小至大）；若沒有，輸出 `None`。第二行輸出 `Count: ` 加該行已售座位數目。\n例如輸入 `C`，輸出：\n`C2 C3 C5`\n`Count: 3`',
          starter: SEAT + R`
letter = input('Row: ')
# 在這裏寫程式`,
          ref: SEAT + R`
letter = input('Row: ')
i = ord(letter) - ord('A')
found = []
for j in range(8):
    if seat[i][j] != 0:
        found.append(seat[i][j])
if len(found) == 0:
    print('None')
else:
    print(' '.join(found))
print('Count:', len(found))`,
          tests: [{ inputs: 'C' }, { inputs: 'A' }, { inputs: 'E' }, { inputs: 'D' }],
          hint: '`ord(letter) - ord(\'A\')` 把 A 至 E 變成 0 至 4。用一個列表收集已售座位，最後用 `\' \'.join(...)` 輸出；列表是空的便輸出 None。' },
        { id: 'c9a-w2', pts: 12, title: '機械車自動回家 goBack()', src: '教科書 p.335 綜合練習第 2(b) 題',
          q: '`FW()`、`TL()` 已寫好（這題沒有 TR），每做一個動作 `steps` 便加 1。輸入 `X Y D`（以空格分隔）。\n寫出三個子程式：\n(1) `turnZero()`：**只用 TL**，令機械車轉向北；\n(2) `goZero()`：面向北時返回充電器（先向北走 Y 步，再 TL，向西走 X 步）；\n(3) `goBack()`：先 turnZero() 再 goZero()。\n主程式已寫好：最後輸出 `X Y D steps`。',
          starter: ROBOT_IO + R`
def turnZero():
    pass

def goZero():
    pass

def goBack():
    pass

nums = input('X Y D: ').split()
X = int(nums[0])
Y = int(nums[1])
D = int(nums[2])
goBack()
print(X, Y, D, steps)`,
          ref: ROBOT_IO + R`
def turnZero():
    for i in range(D):
        TL()

def goZero():
    for i in range(Y):
        FW()
    TL()
    for j in range(X):
        FW()

def goBack():
    turnZero()
    goZero()

nums = input('X Y D: ').split()
X = int(nums[0])
Y = int(nums[1])
D = int(nums[2])
goBack()
print(X, Y, D, steps)`,
          tests: [{ inputs: '4 3 1' }, { inputs: '0 0 2' }, { inputs: '2 0 3' }, { inputs: '0 3 0' }, { inputs: '6 4 2' }],
          rules: [{ must: 'def turnZero', msg: '要寫子程式 turnZero' }, { must: 'def goZero', msg: '要寫子程式 goZero' }, { mustNot: 'TR(', msg: '依題目，轉向只可用 TL()' }],
          hint: '`turnZero`：`for i in range(D): TL()`。`goZero` 跟第 2(b)(i) 題一樣。三個函數都不用 global，因為 FW()、TL() 已負責改變 X、Y、D。' },
        { id: 'c9a-w3', pts: 13, title: '河內塔（遞歸）', src: '教科書 p.342–343 開放式問題第 4 題',
          q: '輸入圓盤數目 n。若 n 不在 1 至 10 之間，輸出 `Invalid`；否則輸出把所有圓盤由棍子 A 移到棍子 B（以 C 作輔助）的步驟，格式與書中相同：`Move disk 1 from A to B`。\n提示：要移動 n 個圓盤由 A 到 B：先把上面 n − 1 個由 A 移到 C，再把第 n 個由 A 移到 B，最後把 n − 1 個由 C 移到 B。',
          starter: R`def hanoi(n, src, dst, via):
    # 在這裏寫程式
    pass

n = int(input('Number of disks (1 - 10): '))
hanoi(n, 'A', 'B', 'C')`,
          ref: R`def hanoi(n, src, dst, via):
    if n == 1:
        print('Move disk 1 from', src, 'to', dst)
    else:
        hanoi(n - 1, src, via, dst)
        print('Move disk', n, 'from', src, 'to', dst)
        hanoi(n - 1, via, dst, src)

n = int(input('Number of disks (1 - 10): '))
if n < 1 or n > 10:
    print('Invalid')
else:
    hanoi(n, 'A', 'B', 'C')`,
          tests: [{ inputs: '3' }, { inputs: '1' }, { inputs: '2' }, { inputs: '4' }, { inputs: '0' }, { inputs: '11' }],
          rules: [{ must: 'def hanoi', msg: '要用子程式 hanoi' }],
          hint: '**基本情況**：n 是 1 時直接輸出一步。其餘情況調用自己兩次：`hanoi(n - 1, src, via, dst)` 和 `hanoi(n - 1, via, dst, src)`，中間輸出移動第 n 個圓盤。輸入 3 的輸出應與書 p.343 相同（共 7 步）。' },
      ],
    },
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.335–336、p.340',
      items: [
        { id: 'c9a-q1', pts: 4, src: '教科書 p.336 綜合練習第 3(c)(ii) 題', tags: [HOT_2D],
          q: '相比二維陣列 seat，用三個陣列 row、col、name 儲存已售座位記錄，以下哪一項是一個好處和一個壞處？',
          options: ['好處：已售座位少時佔用較少儲存空間；壞處：檢索某個座位需時較長',
            '好處：檢索某個座位較快；壞處：佔用較多儲存空間',
            '好處：可以不用索引；壞處：不能記錄顧客名字',
            '好處：操作較簡單；壞處：不能統計已售座位數目'], answer: 'A',
          why: '書中答案：已售座位比 5 × 8 少時較省空間；但要逐一檢索才找到特定座位，數據結構的操作也較複雜。' },
        { id: 'c9a-q2', pts: 4, src: '教科書 p.335 綜合練習第 2(c)(i) 題', tags: [HOT_SUB],
          q: '機械車有超聲波感應器，可量度與前方障礙物的距離。以下哪個算法最能令機械車走動時不會撞上牆壁或障礙物？',
          options: ['距離低於安全距離時便轉向，否則繼續前進', '每走一步便轉向一次', '距離高於安全距離時便停止', '撞到障礙物後才後退並轉向'], answer: 'A',
          why: '書中答案：與前方障礙物的距離低於安全距離時轉向，否則繼續前進。' },
        { id: 'c9a-q3', pts: 4, src: '教科書 p.340 綜合練習第 7 題（參考 DSE 2022 樣本試卷 2D Q11）',
          q: '穎欣想風扇自動因應需要開關及調整風速。以下哪一項最合適？',
          options: ['溫度感應器：讀數高於臨界值便開風扇，與臨界值差距愈大風速愈快',
            '光感應器：光線愈強風速愈快',
            '超聲波感應器：有人靠近便關掉風扇',
            '溫度感應器：讀數低於臨界值便開風扇，差距愈大風速愈快'], answer: 'A',
          why: '書中答案：溫度高於臨界值開風扇，否則關掉；並按差距調整風速。' },
        { id: 'c9a-q4', pts: 4, src: '自擬（延伸第 2(b)(ii) 題）', tags: [{ t: 'trap', why: 'range() 的次數在循環開始時已決定' }], verify: true,
          q: '以下程式的輸出是什麼？',
          code: R`D = 3
def TL():
    global D
    D = (D + 3) % 4

count = 0
for i in range(D):
    TL()
    count = count + 1
print(D, count)`,
          options: ['0 3', '0 1', '3 3', '2 1'], answer: 'A',
          why: '`range(D)` 在開始時是 range(3)，循環內 D 改變不影響次數：D 由 3 → 2 → 1 → 0，共 3 次。' },
        { id: 'c9a-q5', pts: 4, src: '自擬（延伸開放式問題第 4 題「河內塔」）', verify: true,
          q: '函數 moves(n) 計算河內塔移動 n 個圓盤所需的步數。輸出是什麼？',
          code: R`def moves(n):
    if n == 1:
        return 1
    return 2 * moves(n - 1) + 1

print(moves(5))`,
          options: ['31', '32', '25', '15'], answer: 'A',
          why: 'moves(1)=1、moves(2)=3、moves(3)=7、moves(4)=15、moves(5)=31（即 2⁵ − 1）。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pyFunc', 'pyList', 'pyFor'], intro: '隨機生成子程式、列表和 for 循環題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
