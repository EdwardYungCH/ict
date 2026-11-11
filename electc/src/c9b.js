/* 單元 c9b：綜合練習（二）——檢索、堆疊與文字檔案
 * 教科書 選修C 綜合練習 第 4–6 題（書頁 p.337–340）及開放式問題第 1、3 題「四子棋」「2048」（p.341–342）。
 * 教科書以偽代碼出題（陣列索引由 1 開始）；本單元改寫為 Python（列表索引由 0 開始）。
 * 所有答案在 build 時由 CPython 計算／核對。
 * 教科書疑似錯誤：p.341 開放式問題 1「四子棋」程式輸出把欄號標示為「Row」（應為欄 Column）。
 */
const R = String.raw;

const WIN = 'winner = [158, 161, 168, 170, 173, 178]\n';

const STACK = R`def push(S, L):
    S.append(L)

def pop(S):
    return S.pop()

def isEmpty(S):
    return len(S) == 0
`;

const EXPORT = R`def export(L):
    out = []
    while not isEmpty(box):
        temp = pop(box)
        if temp != L:
            push(out, temp)
    while not isEmpty(out):
        push(box, pop(out))
`;

const IMG55 = '22221\n11000\n00000\n11112\n22222\n';
const IMG54 = '1001\n1001\n1111\n1001\n1001\n';

const HOT_SEARCH = { t: 'hot', why: '線性檢索的效率及提早停止（DSE 卷二D 常考）' };
const HOT_LL = { t: 'hot', why: '鏈表與陣列的比較（DSE 2019 卷二D 第 2(c) 題為本書第 4(c) 題的參考）' };

module.exports = {
  id: 'c9b',
  title: '綜合練習（二）：檢索、堆疊與文字檔案',
  book: '教科書 選修C 綜合練習 第 4–6 題 p.337–340；開放式問題 1、3 p.341–342',
  key: 'C-c9b-hmac-1f1cf41e57',
  sections: [
    {
      id: 's1', title: '中獎號碼：線性檢索與效率', pages: '教科書 p.337–338（綜合練習第 4 題）',
      learn: [
        { pts: [
          '陣列 `winner` 已由小至大排序。`fromMin(num)` 由左至右逐一比較，找到便傳回 True。（p.337）',
          '**提早停止**：既然已排序，遇到比 num 大的項目便不用再找，條件加上 `num >= winner[i]`。（p.337 第 4(a)(ii) 題）',
          '`fromMax(num)` 由右至左：`i` 由最後一個索引開始，條件是 `i >= 0 and num <= winner[i]`，每次 `i = i - 1`。（p.337）',
          '第 4(b) 題：先和中間的項目比較，較小用 fromMin、較大用 fromMax，可把檢索範圍減半，減少平均比較次數。（p.337 答案）',
          'Python 的 `and` 由左至右計算：把 `i <= 5` 寫在 `winner[i]` 前面，i 超出範圍時便不會讀取 `winner[i]`。',
        ] },
        { sim: { code: WIN + R`
def fromMin(num):
    i = 0
    while i <= 5 and num >= winner[i]:
        print('compare', winner[i])
        if num == winner[i]:
            return True
        i = i + 1
    return False

print(fromMin(int(input('Number: '))))`, inputs: '170', open: ['vars', 'trace'], step: true },
          cap: '已加入提早停止的 fromMin。試輸入 170、165、200。' },
      ],
      tries: [
        { id: 'c9b-s1-t1', pts: 4, src: '教科書 p.337 綜合練習第 4(a)(ii) 題（改寫為 Python）',
          code: WIN + R`count = 0

def fromMin(num):
    global count
    i = 0
    while i <= 5 and num >= winner[i]:
        count = count + 1
        if num == winner[i]:
            return True
        i = i + 1
    return False

print(fromMin(165), count)`,
          q: '先估：輸出是什麼？（count 是比較 `num == winner[i]` 的次數）', options: ['False 2', 'False 6', 'False 3', 'True 2'],
          why: '和 158、161 比較後，168 已大於 165，while 條件不成立便停止，共比較 2 次。' },
        { id: 'c9b-s1-t2', pts: 4, src: '教科書 p.337 綜合練習第 4(b) 題（改寫為 Python）',
          code: WIN + R`count = 0

def fromMin(num):
    global count
    i = 0
    while i <= 5 and num >= winner[i]:
        count = count + 1
        if num == winner[i]:
            return True
        i = i + 1
    return False

def fromMax(num):
    global count
    i = 5
    while i >= 0 and num <= winner[i]:
        count = count + 1
        if num == winner[i]:
            return True
        i = i - 1
    return False

target = 173
if target <= winner[2]:
    print(fromMin(target), count)
else:
    print(fromMax(target), count)`,
          q: '先估：輸出是什麼？', options: ['True 2', 'True 5', 'False 2', 'True 4'],
          why: '173 大於 winner[2]（168），所以用 fromMax：先比 178，再比 173，找到，共 2 次。若直接用 fromMin 要比較 5 次。' },
      ],
      practice: [
        { id: 'c9b-s1-p1', type: 'complete', pts: 3, src: '教科書 p.337 綜合練習第 4(a)(iii) 題', label: '補完程式',
          q: '完成 `fromMax(num)`：由右至左檢索，遇到比 num 小的項目便停止。會用多組數據測試。',
          template: WIN + R`
def fromMax(num):
    i = ［1］
    while ［2］ and ［3］:
        if ［4］:
            return True
        i = ［5］
    return False

print(fromMax(int(input('Number: '))))`,
          ref: ['5', 'i >= 0', 'num <= winner[i]', 'num == winner[i]', 'i - 1'],
          tests: [{ inputs: '178' }, { inputs: '158' }, { inputs: '165' }, { inputs: '200' }, { inputs: '100' }],
          hint: '書中答案（索引由 1 開始）：i ← 6；當 i >= 1 AND num <= winner[i]；i ← i - 1。Python 最後一個索引是 5，第一個是 0。' },
        { id: 'c9b-s1-p2', type: 'fill', pts: 3, src: '延伸教科書 p.337 綜合練習第 4(b) 題',
          q: '以下程式把六個中獎號碼逐一作為 target 檢索，統計總比較次數。a 只用 fromMin；b 用第 4(b) 題的方法。寫出 a 和 b。',
          code: WIN + R`count = 0

def fromMin(num):
    global count
    i = 0
    while i <= 5 and num >= winner[i]:
        count = count + 1
        if num == winner[i]:
            return True
        i = i + 1
    return False

def fromMax(num):
    global count
    i = 5
    while i >= 0 and num <= winner[i]:
        count = count + 1
        if num == winner[i]:
            return True
        i = i - 1
    return False

for t in winner:
    fromMin(t)
a = count
count = 0
for t in winner:
    if t <= winner[2]:
        fromMin(t)
    else:
        fromMax(t)
b = count`,
          blanks: [{ label: 'a', ask: { var: 'a' } }, { label: 'b', ask: { var: 'b' } }],
          hint: 'fromMin 找第 k 個號碼要比較 k 次：1 + 2 + … + 6。分兩半後，兩邊各是 1 + 2 + 3。' },
        { id: 'c9b-s1-p3', type: 'mc', pts: 2, src: '自擬（延伸第 4(a)(ii) 題）', verify: true, ask: { error: true },
          q: '小明把條件的次序調轉了。輸入 200，運行時會出現哪一種錯誤？',
          code: WIN + R`
def fromMin(num):
    i = 0
    while num >= winner[i] and i <= 5:
        if num == winner[i]:
            return True
        i = i + 1
    return False

print(fromMin(int(input('Number: '))))`, inputs: '200',
          options: ['IndexError', '沒有錯誤', 'ValueError', 'TypeError'], answer: 0,
          hint: '200 比所有號碼都大，i 會加到 6；這時先計算 `winner[6]`。' },
      ],
    },
    {
      id: 's2', title: '貨物配送：堆疊', pages: '教科書 p.338–339（綜合練習第 5 題）',
      learn: [
        { pts: [
          '**堆疊**是後進先出（LIFO）：只可以在頂部存入（push）或取出（pop）。（p.338）',
          '書中子程式：`push(S, L)` 存入、`pop(S)` 取出並傳回、`isEmpty(S)` 檢查是否空。Python 可用列表的 `append()` 和 `pop()` 實現。（p.338）',
          '第 5(b) 題 `export(L)`：把 box 的貨物逐件取出，不是 L 的便放入另一個堆疊 out；之後把 out 的貨物逐件放回 box，次序便會還原。（p.339）',
          '把一個堆疊的項目逐件 pop 再 push 到另一個堆疊，次序會**倒轉**；再倒一次便回復原來次序。',
        ] },
        { sim: { code: STACK + R`
box = ['HK', 'HK', 'KLN', 'NT']
pop(box)
push(box, 'NT')
push(box, 'NT')
pop(box)
push(box, 'KLN')
push(box, 'HK')
print(box)`, open: ['vars'], step: true },
          cap: '第 5(a) 題（p.338）：列表的最後一項就是堆疊頂（書中索引最大的一格）。' },
      ],
      tries: [
        { id: 'c9b-s2-t1', pts: 4, src: '教科書 p.338 綜合練習第 5(a) 題（改寫為 Python）',
          code: STACK + R`
box = ['HK', 'HK', 'KLN', 'NT']
pop(box)
push(box, 'NT')
push(box, 'NT')
pop(box)
push(box, 'KLN')
push(box, 'HK')
print(box)`,
          q: '先估：輸出是什麼？', options: [
            "['HK', 'HK', 'KLN', 'NT', 'KLN', 'HK']",
            "['HK', 'HK', 'KLN', 'NT', 'NT', 'KLN', 'HK']",
            "['HK', 'HK', 'KLN', 'KLN', 'HK']",
            "['HK', 'KLN', 'NT', 'NT', 'KLN', 'HK']"],
          why: 'pop 取走頂部的 NT；push 兩個 NT 再 pop 一個，剩一個 NT；最後 push KLN、HK。書中答案：HK HK KLN NT KLN HK。' },
        { id: 'c9b-s2-t2', pts: 4, src: '自擬（參考教科書第 5 章 push(B, pop(A)) 例子）',
          code: STACK + R`
A = []
B = []
for x in [1, 2, 3, 4]:
    push(A, x)
while not isEmpty(A):
    push(B, pop(A))
print(pop(B), pop(B))`,
          q: '先估：輸出是什麼？', options: ['1 2', '4 3', '2 1', '3 4'],
          why: 'A 是 [1, 2, 3, 4]；逐件搬到 B 後次序倒轉，B 是 [4, 3, 2, 1]，頂部是 1，所以先取出 1 再取出 2。' },
      ],
      practice: [
        { id: 'c9b-s2-p1', type: 'mc', pts: 2, src: '教科書 p.339 綜合練習第 5(b)(i) 題', verify: true, ask: { var: 'box' },
          q: '調用 `export(\'NT\')` 後，堆疊 box 是什麼？',
          code: STACK + '\n' + EXPORT + R`
box = ['KLN', 'NT', 'KLN', 'NT', 'KLN', 'NT', 'HK', 'HK']
export('NT')`,
          options: ["['KLN', 'KLN', 'KLN', 'HK', 'HK']", "['HK', 'HK', 'KLN', 'KLN', 'KLN']", "['NT', 'NT', 'NT']", "['KLN', 'KLN', 'KLN', 'HK', 'HK', 'NT', 'NT', 'NT']"], answer: 0,
          hint: '取走所有 NT，其餘貨物保持原有次序。（書中答案：KLN KLN KLN HK HK）' },
        { id: 'c9b-s2-p2', type: 'complete', pts: 3, src: '教科書 p.339 綜合練習第 5(b)(ii) 題', label: '補完程式',
          q: '完成 `export(L)`：取出 box 內應發送到地區 L 的貨物，其餘貨物以原有次序留在 box。會用多組數據測試。',
          template: STACK + R`
def export(L):
    out = []
    while not isEmpty(［1］):
        temp = pop(box)
        if ［2］:
            push(［3］)
    while not isEmpty(［4］):
        push(［5］)

box = ['KLN', 'HK', 'KLN', 'NT', 'KLN', 'KLN', 'HK', 'NT']
export(input('Region: '))
print(box)`,
          ref: ['box', 'temp != L', 'out, temp', 'out', 'box, pop(out)'],
          tests: [{ inputs: 'KLN' }, { inputs: 'NT' }, { inputs: 'HK' }, { inputs: 'XYZ' }],
          hint: '書中答案：當 not isEmpty(box)；如果 temp != L 則 push(out, temp)；當 not isEmpty(out)：push(box, pop(out))。' },
        { id: 'c9b-s2-p3', type: 'trace', pts: 3, src: '自擬（延伸第 5(b) 題）',
          q: '完成追蹤表：export 第一個 while 循環每次結束時 temp 和 out 的值。',
          code: STACK + R`
box = ['A', 'B', 'A', 'C']
out = []
while not isEmpty(box):
    temp = pop(box)
    if temp != 'A':
        push(out, temp)
while not isEmpty(out):
    push(box, pop(out))
print(box)`,
          spec: { mode: 'iter', cols: ['temp', 'out'], out: true },
          hint: '由頂部（列表最後一項）開始取出：C、A、B、A。' },
      ],
    },
    {
      id: 's3', title: '圖像像素：文字檔案與數據壓縮', pages: '教科書 p.340（綜合練習第 6 題）',
      learn: [
        { pts: [
          '**方法一**：每個像素的數值（0 白、1 灰、2 黑）逐個儲存，位置對應圖像位置。（p.340）',
          '**方法二**：由上至下、左至右掃描，把連續相同的像素當作一組，以 `[D,N]` 儲存（D 是數值，N 是連續數目）。**跨行也會連續計算**。（p.340）',
          '方法二最好的情況：所有像素相同（只有一組）；最壞：沒有連續相同的像素（每個像素一組，檔案反而更大）。（p.340 第 6(b) 題）',
          '方法一的好處：顯示方式簡單直接；轉為二維陣列後運算較快。（p.340 第 6(c) 題）',
          '文字檔案的好處：數據獨立、可被多於一個程式存取、非易失性（程式結束後仍保存）。（p.340 第 6(d) 題）',
          'Python：`for line in f:` 逐行讀取，`line.strip()` 去掉換行；把各行接成一個字串便可連續掃描。',
        ] },
        { sim: { code: R`f = open('img.txt', 'r')
s = ''
for line in f:
    s = s + line.strip()
f.close()
groups = []
d = s[0]
n = 1
for k in range(1, len(s)):
    if s[k] == d:
        n = n + 1
    else:
        groups.append('[' + d + ',' + str(n) + ']')
        d = s[k]
        n = 1
groups.append('[' + d + ',' + str(n) + ']')
print(' '.join(groups))`, files: { 'img.txt': IMG55 }, open: ['vars'] },
          cap: '書中 5 × 5 圖像的例子（p.340）：結果應是 [2,4] [1,3] [0,8] [1,4] [2,6]。' },
      ],
      tries: [
        { id: 'c9b-s3-t1', pts: 4, src: '教科書 p.340 綜合練習第 6(a) 題（改寫為 Python）', files: { 'img.txt': IMG54 },
          code: R`f = open('img.txt', 'r')
s = ''
for line in f:
    s = s + line.strip()
f.close()
groups = []
d = s[0]
n = 1
for k in range(1, len(s)):
    if s[k] == d:
        n = n + 1
    else:
        groups.append('[' + d + ',' + str(n) + ']')
        d = s[k]
        n = 1
groups.append('[' + d + ',' + str(n) + ']')
print(' '.join(groups))`,
          q: '先估：img.txt 是 5 × 4 圖像 `1001`／`1001`／`1111`／`1001`／`1001`（方法一）。輸出是什麼？', options: [
            '[1,1] [0,2] [1,2] [0,2] [1,6] [0,2] [1,2] [0,2] [1,1]',
            '[1,1] [0,2] [1,2] [0,2] [1,4] [0,2] [1,2] [0,2] [1,1]',
            '[1,1] [0,2] [1,1] [1,1] [0,2] [1,1] [1,4] [1,1] [0,2] [1,1] [1,1] [0,2] [1,1]',
            '[1,12] [0,8]'],
          why: '跨行連續計算：第 2 行末的 1、第 3 行四個 1、第 4 行頭的 1 連成 6 個。書中答案共 9 組。' },
      ],
      practice: [
        { id: 'c9b-s3-p1', type: 'complete', pts: 3, src: '延伸教科書 p.340 綜合練習第 6 題', label: '補完程式',
          q: '把 img.txt（方法一）轉換為方法二，寫入 img2.txt，每組一行。會用多個檔案測試。',
          template: R`f = open('img.txt', 'r')
s = ''
for line in f:
    s = s + ［1］
f.close()
out = open('img2.txt', 'w')
d = s[0]
n = 1
for k in range(1, len(s)):
    if s[k] == d:
        n = ［2］
    else:
        out.write('[' + d + ',' + str(n) + ']\n')
        d = ［3］
        n = 1
out.write('[' + d + ',' + str(n) + ']\n')
out.close()`,
          ref: ['line.strip()', 'n + 1', 's[k]'], check: { file: 'img2.txt' },
          tests: [{ inputs: '', files: { 'img.txt': IMG55 } }, { inputs: '', files: { 'img.txt': IMG54 } }, { inputs: '', files: { 'img.txt': '1111\n1111\n' } }, { inputs: '', files: { 'img.txt': '0' } }],
          hint: '每行要先去掉換行符號；相同便數目加 1；不同便寫出上一組，再由新的像素 s[k] 開始計算。' },
        { id: 'c9b-s3-p2', type: 'mc', pts: 3, src: '自擬（第 6 題反向：方法二 → 方法一）', verify: true, files: { 'img2.txt': '[2,3]\n[0,2]\n[1,5]\n' },
          q: 'img2.txt 用方法二儲存一個闊 5 的圖像。輸出是什麼？',
          code: R`f = open('img2.txt', 'r')
s = ''
for line in f:
    parts = line.strip()[1:-1].split(',')
    s = s + parts[0] * int(parts[1])
f.close()
rows = []
for k in range(0, len(s), 5):
    rows.append(s[k:k + 5])
print('/'.join(rows))`,
          options: ['22200/11111', '23021/5', '22200/1111', '222/00/11111'], answer: 0,
          hint: '`line.strip()[1:-1]` 去掉方括號；`\'2\' * 3` 是 \'222\'。共 10 個像素，每 5 個一行。' },
        { id: 'c9b-s3-p3', type: 'fill', pts: 3, src: '延伸教科書 p.340 綜合練習第 6(b) 題',
          q: '函數 groups(s) 計算用方法二儲存時有多少組。寫出 g1（所有像素相同）和 g2（黑白相間）的值。',
          code: R`def groups(s):
    g = 1
    for k in range(1, len(s)):
        if s[k] != s[k - 1]:
            g = g + 1
    return g

g1 = groups('0' * 20)
g2 = groups('01' * 10)`,
          blanks: [{ label: 'g1', ask: { var: 'g1' } }, { label: 'g2', ask: { var: 'g2' } }],
          hint: '每遇到和前一個不同的像素便多一組。最好的情況只有 1 組；最壞的情況每個像素一組。' },
      ],
    },
    {
      id: 'write', kind: 'write', title: '寫程式', pages: '教科書 p.340–342',
      tasks: [
        { id: 'c9b-w1', pts: 10, title: '還原圖像（方法二 → 方法一）', src: '延伸教科書 p.340 綜合練習第 6 題',
          q: 'img2.txt 以方法二儲存圖像，每行一組，例如 `[2,4]`。先輸入圖像的闊度 w，然後讀取檔案，以方法一輸出圖像：每行 w 個數字。\n例如書中 5 × 5 的例子，輸入 5，輸出 `22221`、`11000`、`00000`、`11112`、`22222` 五行。',
          starter: R`w = int(input('Width: '))
f = open('img2.txt', 'r')
# 在這裏寫程式
f.close()`,
          ref: R`w = int(input('Width: '))
f = open('img2.txt', 'r')
s = ''
for line in f:
    parts = line.strip()[1:-1].split(',')
    s = s + parts[0] * int(parts[1])
f.close()
for k in range(0, len(s), w):
    print(s[k:k + w])`,
          tests: [
            { inputs: '5', files: { 'img2.txt': '[2,4]\n[1,3]\n[0,8]\n[1,4]\n[2,6]\n' } },
            { inputs: '4', files: { 'img2.txt': '[1,1]\n[0,2]\n[1,2]\n[0,2]\n[1,6]\n[0,2]\n[1,2]\n[0,2]\n[1,1]\n' } },
            { inputs: '3', files: { 'img2.txt': '[1,6]\n' } },
            { inputs: '1', files: { 'img2.txt': '[0,1]' } },
          ],
          hint: '每行先 `strip()`，再用 `[1:-1]` 去掉方括號，`split(\',\')` 得到 D 和 N；`D * int(N)` 重複 N 次。把所有像素接成一個字串，再用切片 `s[k:k + w]` 每 w 個輸出一行。' },
        { id: 'c9b-w2', pts: 12, title: '2048：向左移動一行', src: '延伸教科書 p.342 開放式問題第 3 題',
          q: '輸入一行 4 個數字（以空格分隔，0 代表空格）。模擬「2048」**向左**移動：\n(1) 所有非 0 方塊向左靠；\n(2) 由左至右，相鄰兩個相同的方塊合併為兩者之和，**每個方塊每次只可合併一次**；\n(3) 右邊補 0。\n以空格分隔輸出 4 個數字。例如 `2 2 2 2` → `4 4 0 0`；`4 4 8 0` → `8 8 0 0`。',
          starter: R`row = input('Row: ').split()
# 在這裏寫程式`,
          ref: R`row = input('Row: ').split()
nums = []
for x in row:
    if x != '0':
        nums.append(int(x))
result = []
i = 0
while i < len(nums):
    if i + 1 < len(nums) and nums[i] == nums[i + 1]:
        result.append(nums[i] * 2)
        i = i + 2
    else:
        result.append(nums[i])
        i = i + 1
while len(result) < 4:
    result.append(0)
print(result[0], result[1], result[2], result[3])`,
          tests: [{ inputs: '2 2 0 4' }, { inputs: '2 2 2 2' }, { inputs: '0 2 0 2' }, { inputs: '4 4 8 0' }, { inputs: '2 4 2 4' }, { inputs: '0 0 0 0' }],
          hint: '分三步：先把非 0 的數字放入新列表 nums；再用 while 由左至右檢查 nums[i] 和 nums[i + 1]，相同便合併並跳過兩格（i + 2），否則只放 nums[i]；最後補 0 至 4 個。' },
        { id: 'c9b-w3', pts: 13, title: '四子棋：誰勝出？', src: '延伸教科書 p.341 開放式問題第 1 題',
          q: 'board.txt 有 6 行，每行 7 個字元：`0` 是空位，`A`、`B` 是兩位玩家的棋子。輸入玩家（A 或 B）。若該玩家有 4 枚棋子以**橫、直或斜**（兩個斜方向）連成一線，輸出 `A wins`（或 `B wins`），否則輸出 `No winner`。',
          starter: R`f = open('board.txt', 'r')
board = []
for line in f:
    board.append(line.strip())
f.close()
p = input('Player: ')
# 在這裏寫程式`,
          ref: R`f = open('board.txt', 'r')
board = []
for line in f:
    board.append(line.strip())
f.close()
p = input('Player: ')
win = False
for r in range(6):
    for c in range(7):
        for d in [[0, 1], [1, 0], [1, 1], [1, -1]]:
            count = 0
            for k in range(4):
                rr = r + d[0] * k
                cc = c + d[1] * k
                if 0 <= rr < 6 and 0 <= cc < 7 and board[rr][cc] == p:
                    count = count + 1
            if count == 4:
                win = True
if win:
    print(p, 'wins')
else:
    print('No winner')`,
          tests: [
            { inputs: 'A', files: { 'board.txt': '0000000\n0000000\n0000000\n0000000\n0000000\nBBBAAAA\n' } },
            { inputs: 'B', files: { 'board.txt': '0000000\n0000000\n000000B\n000000B\n00A000B\nAAA000B\n' } },
            { inputs: 'A', files: { 'board.txt': '0000000\n0000000\n000A000\n00AB000\n0ABB000\nABBA000\n' } },
            { inputs: 'B', files: { 'board.txt': '0000000\n0000000\nB000000\nAB00000\nAAB0000\nAAAB000\n' } },
            { inputs: 'A', files: { 'board.txt': '0000000\n0000000\n0000000\n0000000\n0000000\nAAA0AAA\n' } },
            { inputs: 'A', files: { 'board.txt': '0000000\n0000000\n0000000\n0000000\n0000000\nBBBB000\n' } },
          ],
          hint: '`board[r][c]` 是第 r 行第 c 個字元。由每一格出發，檢查四個方向：向右 (0, 1)、向下 (1, 0)、右下 (1, 1)、左下 (1, −1)，連續 4 格都是 p 便勝出。檢查前要確保行 0–5、列 0–6 沒有超出範圍。' },
      ],
    },
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.337–340',
      items: [
        { id: 'c9b-q1', pts: 4, src: '教科書 p.337 綜合練習第 4(b) 題', tags: [HOT_SEARCH],
          q: '曉彤先比較 target 和 winner 中間的項目：較小便用 fromMin（由左至右），否則用 fromMax（由右至左）。這比直接用 fromMin 更有效率嗎？',
          options: ['同意，因為把檢索範圍減半，能減少平均的比較次數', '不同意，因為多了一次比較，一定較慢', '不同意，因為只有對分檢索才可以提高效率', '同意，因為每次都只須比較一次'], answer: 'A',
          why: '書中答案：同意，將檢索減半能減少平均的比較次數。' },
        { id: 'c9b-q2', pts: 4, src: '教科書 p.338 綜合練習第 4(c)(i)、(ii) 題（參考 DSE 2019 2D Q2c）', tags: [HOT_LL],
          q: '中獎名單改用單向鏈表（由小至大，每個節點只有指向下一個節點的 next）。為什麼 fromMax 較難編寫？怎樣解決？',
          options: ['在單向鏈表追蹤前一個節點較複雜；可新增指向前一個節點的指示標（雙向鏈表）',
            '鏈表不能儲存數字；可改用二維陣列',
            '鏈表的最後一個節點不能存取；可刪除最後一個節點',
            '鏈表一定比陣列慢；可改用對分檢索'], answer: 'A',
          why: '書中答案：fromMin 跟着 next 由左至右搜尋較容易；fromMax 要由右至左，單向鏈表難以找到前一個節點。可加指向前一個節點的指示標。' },
        { id: 'c9b-q3', pts: 4, src: '教科書 p.338 綜合練習第 4(c)(iii) 題', tags: [HOT_LL],
          q: '對已排序的鏈表進行對分檢索，能提高檢索的效率嗎？',
          options: ['不能，因為對分檢索須直接存取指定項目，而鏈表只能順序存取', '能，因為鏈表已經排序', '能，因為鏈表不用移動項目', '不能，因為鏈表不能排序'], answer: 'A',
          why: '書中答案：對分檢索要直接跳到中間的項目，鏈表只能由頭沿指示標逐個前進。' },
        { id: 'c9b-q4', pts: 4, src: '教科書 p.338 綜合練習第 4(c)(iv) 題', tags: [HOT_LL],
          q: '以下哪一項是使用鏈表而非陣列儲存數據的好處？',
          options: ['加入或刪除數據時只須改變指示標，不用逐一移動項目', '可以用索引直接存取任何項目', '佔用的儲存空間一定較少', '可以使用對分檢索'], answer: 'A',
          why: '書中答案：鏈表只須改變指示標的指向；陣列須把項目逐一移動，步驟較多。' },
        { id: 'c9b-q5', pts: 4, src: '教科書 p.340 綜合練習第 6(d) 題',
          q: '相比儲存在程式內的陣列，用文字檔案儲存圖像像素的一個好處是什麼？',
          options: ['數據是非易失性的，程式結束後仍保存在檔案內', '程式讀取數據一定較快', '不用把數字轉換為字串', '檔案的內容不會被其他程式存取'], answer: 'A',
          why: '書中答案：確保數據的獨立性；數據可被多於一個程式存取；數據是非易失性的。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['pySearch', 'pyStack', 'pyStr'], intro: '隨機生成檢索、堆疊和字串題目，答案由程式計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
