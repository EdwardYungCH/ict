/* 示範單元 x2：理論單元（theory:true）——練 40、分析題 35（表格＋程式）、小測 25，沒有「試」。 */
const C = (...ls) => ls.join('\n');

module.exports = {
  id: 'x2',
  title: '示範理論單元：錯誤類型與測試數據',
  book: '框架示範（不是教科書內容）',
  key: 'DEMO-x2-hmac-8e14b2d6a0',
  theory: true,
  sections: [
    {
      id: 's1', title: '三類錯誤', pages: '示範 p.10',
      learn: [
        { pts: ['**語法錯誤**：不符合 Python 的寫法，程式不能開始執行。', '**運行時錯誤**：執行到某一行才出錯，例如除以 0。', '**邏輯錯誤**：程式可以執行，但結果不對。'] },
        { sim: { code: C('a = 10', 'b = 0', 'print(a / b)') }, cap: '按「▶ 執行」看看運行時錯誤的訊息及中文解釋。' },
      ],
      practice: [
        { id: 'x2-s1-p1', type: 'mc', pts: 5, q: '這段程式會出現哪一類錯誤？', code: C('total = 0', 'for i in range(1, 4)', '    total = total + i'), ask: { error: true }, verify: false, options: ['語法錯誤', '運行時錯誤', '邏輯錯誤', '沒有錯誤'], answer: 0, hint: 'for 一行少了冒號。' },
        { id: 'x2-s1-p2', type: 'mc', pts: 5, q: '執行後出現甚麼錯誤？', code: C('n = int("12a")'), ask: { error: true }, verify: true, options: ['ValueError', 'TypeError', 'NameError', 'SyntaxError'], answer: 0, hint: '"12a" 不是整數。' },
        { id: 'x2-s1-p3', type: 'fill', pts: 5, q: '寫出錯誤類型名稱。', code: C('marks = [50, 60]', 'print(marks[2])'), blanks: [{ label: '錯誤類型', ask: { error: true } }], hint: '索引超出範圍。' },
        { id: 'x2-s1-p4', type: 'fill', pts: 5, q: '這個程式想計算 1 至 5 的總和，但有邏輯錯誤。寫出它的輸出及正確的總和。', code: C('total = 0', 'for i in range(1, 5):', '    total = total + i', 'print(total)'),
          blanks: [{ label: '程式輸出', ask: 'out' }, { label: '正確總和', a: '15' }], hint: 'range(1, 5) 不包括 5。' },
      ],
    },
    {
      id: 's2', title: '測試數據', pages: '示範 p.11',
      learn: [
        { pts: ['**正常數據**：在有效範圍內。', '**邊界數據**：剛好在範圍的邊界。', '**錯誤數據**：不合理、應被拒絕的數據。'] },
      ],
      practice: [
        { id: 'x2-s2-p1', type: 'mc', pts: 5, q: '有效分數是 0–100。輸入 100 屬於哪一類測試數據？', options: ['正常數據', '邊界數據', '錯誤數據'], answer: 1, hint: '100 剛好在邊界。' },
        { id: 'x2-s2-p2', type: 'trace', pts: 5, q: '用追蹤表找出邏輯錯誤（每次循環一行）。', code: C('big = 0', 'for x in [-5, -2, -9]:', '    if x > big:', '        big = x', 'print(big)'), spec: { mode: 'iter', cols: ['x', 'big'], out: false }, hint: 'big 一開始是 0，比所有負數都大。' },
        { id: 'x2-s2-p3', type: 'mc', pts: 5, q: '上題程式的輸出是什麼？', code: C('big = 0', 'for x in [-5, -2, -9]:', '    if x > big:', '        big = x', 'print(big)'), verify: true, options: ['0', '-2', '-9', '-5'], answer: 0, hint: '沒有一個 x 大於 0。' },
        { id: 'x2-s2-p4', type: 'complete', pts: 5, q: '修正邏輯錯誤：big 的初始值應該是列表的第一項。', template: C('a = [int(x) for x in input().split()]', 'big = ［1］', 'for x in a:', '    if x > big:', '        big = x', 'print(big)'),
          ref: ['a[0]'], tests: [{ inputs: '-5 -2 -9' }, { inputs: '3 8 1' }, { inputs: '7' }], hint: '用 a[0]。' },
      ],
    },
    {
      kind: 'write', id: 'write', title: '分析題',
      tasks: [
        { id: 'x2-w1', kind: 'table', pts: 20, title: '錯誤類型分析', tier: '必做', q: '為每段程式選出錯誤類型及類別。',
          head: ['程式', '錯誤類型', '類別'], opts: { t: ['SyntaxError', 'NameError', 'TypeError', 'ZeroDivisionError'], k: ['語法錯誤', '運行時錯誤'] },
          rows: [
            ['`print("Hi)`', { sel: 't', a: 'SyntaxError' }, { sel: 'k', a: '語法錯誤' }],
            ['`print(totl)`', { sel: 't', a: 'NameError' }, { sel: 'k', a: '運行時錯誤' }],
            ['`print("A" + 1)`', { sel: 't', a: 'TypeError' }, { sel: 'k', a: '運行時錯誤' }],
            ['`print(5 / 0)`', { sel: 't', a: 'ZeroDivisionError' }, { text: true, a: '運行時錯誤', accept: ['運行時'] }],
          ], hint: '語法錯誤令程式不能開始執行。' },
        { id: 'x2-w2', pts: 15, title: '修正程式', tier: '進階', q: '以下程式應輸出 1 至 n 的雙數（每行一個），但有錯誤。請修正。',
          starter: C('n = int(input())', 'for i in range(2, n, 2):', '    print(i)'),
          ref: C('n = int(input())', 'for i in range(2, n + 1, 2):', '    print(i)'),
          tests: [{ inputs: '6' }, { inputs: '7' }, { inputs: '2' }, { inputs: '1' }], hint: 'range 不包括終點。' },
      ],
    },
    {
      kind: 'quiz', id: 'quiz', title: '小測',
      items: [
        { id: 'x2-q1', pts: 5, src: '示範', q: '哪一類錯誤會令程式完全不能開始執行？', options: ['語法錯誤', '運行時錯誤', '邏輯錯誤', '以上皆是'], answer: 'A', why: '語法錯誤在執行前已被發現。' },
        { id: 'x2-q2', pts: 5, src: '示範', q: '輸出是什麼？', code: C('x = "5"', 'print(x * 2)'), options: ['55', '10', '錯誤', '5 5'], answer: 'A', verify: true, why: '字串乘 2 是重複。' },
        { id: 'x2-q3', pts: 5, src: '示範', q: '分數範圍 0–100，以下哪一個是錯誤數據？', options: ['0', '50', '100', '101'], answer: 'D', why: '101 超出範圍。' },
        { id: 'x2-q4', pts: 5, src: '示範', q: '會出現甚麼錯誤？', code: C('a = [1, 2, 3]', 'a.pop(5)'), ask: { error: true }, options: ['IndexError', 'ValueError', 'KeyError', '沒有錯誤'], answer: 'A', verify: true, why: '沒有索引 5。' },
        { id: 'x2-q5', pts: 5, src: '示範', q: '追蹤表的主要用途是什麼？', options: ['找出邏輯錯誤', '令程式執行得更快', '找出語法錯誤', '儲存數據'], answer: 'A', why: '逐步記錄變量的值。' },
      ],
    },
    { kind: 'endless', gens: ['pyErr', 'pyIf'] },
    { kind: 'report' },
  ],
};
