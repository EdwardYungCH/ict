// 示範單元：用到所有一般元件
module.exports = {
  id: 'x1', title: 'SELECT、DML 及 DDL 示範', book: '示範（不是教科書內容）', key: 'DEMO-x1-hmac-3fa9c1d07e', theory: false,
  dbs: {
    school: {
      STUDENT: [['*SID', 'NAME', 'CLASS', 'SCORE', 'CID'], [['S01', 'Amy', '5A', 82, 'C1'], ['S02', 'Ben', '5B', 46, 'C2'], ['S03', 'Cathy', '5A', 74, null], ['S04', 'David', '5C', null, 'C1'], ['S05', 'Eva', '5B', 91, 'C3'], ['S06', 'Finn', '5A', 58, 'C2']]],
      CLUB: [['*CID', 'CNAME', 'ROOM'], [['C1', 'Chess', 101], ['C2', 'Drama', 102], ['C3', 'Music', 103], ['C4', 'Robot', 104]]],
    },
    shop: `CREATE TABLE CAT (CATID CHAR(2) PRIMARY KEY, CNAME VARCHAR(20) NOT NULL);
      INSERT INTO CAT VALUES ('ST', 'Stationery'), ('FD', 'Food');
      CREATE TABLE ITEM (IID INT PRIMARY KEY AUTO_INCREMENT, INAME VARCHAR(20) NOT NULL UNIQUE, CATID CHAR(2), PRICE DECIMAL(6,1) DEFAULT 0, QTY INT,
        CHECK (PRICE >= 0), FOREIGN KEY (CATID) REFERENCES CAT(CATID));
      INSERT INTO ITEM (INAME, CATID, PRICE, QTY) VALUES ('Pen', 'ST', 12.5, 30), ('Ruler', 'ST', 8, 12), ('Cookie', 'FD', 20, 5), ('Juice', 'FD', 9.5, 40);`,
  },
  sections: [
    { id: 's1', title: 'SELECT 與 WHERE', pages: '示範 p.1–2',
      learn: [
        { pts: ['`SELECT 欄 FROM 表 WHERE 條件` 選取記錄。', '文字常數要加**單引號**。'] },
        { h: '比較運算符' },
        { table: { head: ['運算符', '意義'], rows: [['`=`', '等於'], ['`<>`', '不等於']] }, cap: '表 1 比較運算符' },
        { note: 'NULL 不可以用 `= NULL`，要用 `IS NULL`。' },
        { warn: '`SELECT *` 會選取所有欄位。' },
        { fix: { bad: "SELECT NAME FROM STUDENT WHERE CLASS = 5A", good: "SELECT NAME FROM STUDENT WHERE CLASS = '5A'", why: '文字要加單引號。' } },
        { fix: '舊式提示：這是 fix 字串。' },
        { code: "SELECT NAME, SCORE\nFROM STUDENT\nWHERE SCORE >= 60 -- 合格", cap: '例子' },
        { sim: { db: 'school', sql: "SELECT NAME, SCORE FROM STUDENT WHERE SCORE >= 60", open: ['STUDENT'] }, cap: '按「▶ 執行」試試，也可以修改。' },
        { tables: { db: 'school', names: ['CLUB'] }, cap: '學會數據表' },
        { er: { entities: [{ name: 'STUDENT', attrs: ['*SID', 'NAME', 'CLASS', '#CID'] }, { name: 'CLUB', attrs: ['*CID', 'CNAME', 'ROOM'] }], rels: [{ a: 'STUDENT', b: 'CLUB', name: '參加', card: 'M:1' }] }, cap: '實體關係圖' },
      ],
      tries: [
        { id: 'x1-s1-t1', pts: 4, src: '示範', db: 'school', sql: "SELECT NAME FROM STUDENT WHERE SCORE >= 60", ask: 'rows', q: '先估：結果有多少行？', options: ['2', '3', '4', '5'], why: 'David 的 SCORE 是 NULL，不會被選取。' },
        { id: 'x1-s1-t2', pts: 4, db: 'school', sql: "SELECT NAME, CLASS FROM STUDENT WHERE CLASS = '5B'", options: ['Ben, 5B\nEva, 5B', 'Ben, 5B', 'Eva, 5B', '（沒有記錄）'], why: '兩位學生在 5B。' },
      ],
      practice: [
        { id: 'x1-s1-p1', type: 'mc', pts: 3, q: '哪一句會出錯？', db: 'school', sql: "SELECT NAME FROM STUDENT WHERE SCORE > 'abc'", ask: 'error', options: ['沒有錯誤', '數據類型錯誤', '找不到欄位', '語法錯誤'], hint: '文字與數字比較。' },
        { id: 'x1-s1-p2', type: 'fill', pts: 3, q: '執行以下 SQL，填寫結果。', db: 'school', sql: "SELECT NAME, SCORE FROM STUDENT WHERE CLASS = '5A' ORDER BY SCORE DESC", blanks: [{ label: 'NAME 欄（按次序）', ask: { col: 'NAME' } }, { label: '第 1 行的 SCORE', ask: { cell: [1, 'SCORE'] } }, { label: '一共多少行', a: '3', accept: ['三'] }] },
        { id: 'x1-s1-p3', type: 'complete', pts: 4, q: '完成 SQL：列出 5A 班學生的名字。', db: 'school', template: "SELECT ［1］ FROM STUDENT WHERE ［2］", ref: ['NAME', "CLASS = '5A'"] },
      ] },
    { id: 's2', title: '分組、連接與修改數據', pages: '示範 p.3',
      learn: [
        { pts: ['`GROUP BY` 分組；`HAVING` 篩選組別。', 'DML：INSERT、UPDATE、DELETE。'] },
        { sim: { db: 'shop', sql: "UPDATE ITEM SET QTY = QTY + 5 WHERE CATID = 'FD';\nSELECT * FROM ITEM" } },
      ],
      tries: [
        { id: 'x1-s2-t1', pts: 4, db: 'school', sql: "SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS ORDER BY CLASS", q: '先估：結果是什麼？', options: ['5A, 3\n5B, 2\n5C, 1', '5A, 3\n5B, 2', '5A, 2\n5B, 2\n5C, 1', '6'] },
        { id: 'x1-s2-t2', pts: 4, db: 'school', sql: "SELECT S.NAME, C.CNAME FROM STUDENT S LEFT JOIN CLUB C ON S.CID = C.CID", ask: 'rows', options: ['5', '6', '7', '4'] },
        { id: 'x1-s2-t3', pts: 4, db: 'shop', sql: "INSERT INTO ITEM (INAME, CATID, PRICE, QTY) VALUES ('Pen', 'ST', 3, 1)", ask: 'error', q: '先估：會出現什麼錯誤？', options: ['沒有錯誤', '違反 UNIQUE 限制', '違反外鍵碼限制', '違反主關鍵碼限制'] },
      ],
      practice: [
        { id: 'x1-s2-p1', type: 'mc', pts: 3, q: '執行後 ITEM 是什麼？', db: 'shop', sql: "DELETE FROM ITEM WHERE QTY < 10", ask: { after: 'ITEM' }, options: ['1, Pen, ST, 12.5, 30\n2, Ruler, ST, 8, 12\n4, Juice, FD, 9.5, 40', '3, Cookie, FD, 20, 5', '1, Pen, ST, 12.5, 30\n4, Juice, FD, 9.5, 40'], answer: 0, verify: true },
        { id: 'x1-s2-p2', type: 'fill', pts: 3, q: '計算平均分（NULL 不計）。', db: 'school', sql: 'SELECT AVG(SCORE) FROM STUDENT', blanks: [{ label: 'AVG(SCORE)', ask: { cell: [1, 1] } }] },
        { id: 'x1-s2-p3', type: 'complete', pts: 4, q: '完成 SQL：每個學會的學生人數（只列出有學生的學會）。', db: 'school', template: "SELECT C.CNAME, ［1］ FROM STUDENT S JOIN CLUB C ON S.CID = C.CID GROUP BY ［2］", ref: ['COUNT(*)', 'C.CID'] },
        { id: 'x1-s2-p4', type: 'fd', pts: 5, q: 'R 的候選鍵碼是什麼？', attrs: 'A B C D', fds: 'A->B; B->C', ask: 'keys', options: ['{A, D}', '{A}', '{A, B, D}', '{D}'] },
      ] },
    { kind: 'write', id: 'w', title: '寫SQL',
      tasks: [
        { id: 'x1-w1', pts: 10, tier: '基礎', title: '合格學生', q: '列出 SCORE 在 60 或以上的學生的 NAME 和 SCORE，按 SCORE 由高至低排列。', db: 'school', starter: 'SELECT NAME FROM STUDENT', ref: 'SELECT NAME, SCORE FROM STUDENT WHERE SCORE >= 60 ORDER BY SCORE DESC', hint: '用 WHERE 和 ORDER BY … DESC。' },
        { id: 'x1-w2', pts: 12, tier: '進階', title: '加價', q: '把 Stationery（CATID 是 ST）類貨品的 PRICE 增加 1。', db: 'shop', starter: '', ref: "UPDATE ITEM SET PRICE = PRICE + 1 WHERE CATID = 'ST'", rules: [{ must: 'UPDATE', msg: '要用 UPDATE 語句。' }], hint: 'UPDATE … SET … WHERE …' },
        { id: 'x1-w3', pts: 13, tier: '挑戰', title: '建立數據表', q: '建立數據表 SUPPLIER：SID（CHAR(3)，主關鍵碼）、SNAME（VARCHAR(30)，不可以是 NULL）。', db: 'shop', starter: 'CREATE TABLE SUPPLIER (', ref: 'CREATE TABLE SUPPLIER (SID CHAR(3) PRIMARY KEY, SNAME VARCHAR(30) NOT NULL)', hint: '欄名 數據類型 限制，用逗號分隔。' },
      ] },
    { kind: 'quiz', id: 'q', title: '小測',
      items: [
        { id: 'x1-q1', pts: 4, src: '示範', tags: [{ t: 'hot', why: '常考' }], q: '結果有多少行？', db: 'school', sql: "SELECT DISTINCT CLASS FROM STUDENT", ask: 'rows', options: ['2', '3', '6', '1'], why: '5A、5B、5C。' },
        { id: 'x1-q2', pts: 4, tags: [{ t: 'trap', why: 'NULL' }], q: 'COUNT(SCORE) 是多少？', db: 'school', sql: 'SELECT COUNT(SCORE) FROM STUDENT', ask: { cell: [1, 1] }, options: ['6', '5', '4', '0'] },
        { id: 'x1-q3', pts: 4, q: '以下哪一個是 SQL 的「不等於」？', options: ['!==', '<>', '=/=', '≠'], answer: 'B' },
        { id: 'x1-q4', pts: 4, q: '哪個學會沒有學生？', db: 'school', sql: 'SELECT CNAME FROM CLUB WHERE CID NOT IN (SELECT CID FROM STUDENT WHERE CID IS NOT NULL)', ask: { col: 'CNAME' }, options: ['Robot', 'Chess', 'Music', '（沒有記錄）'] },
        { id: 'x1-q5', pts: 4, q: '這個實體關係圖中，STUDENT 與 CLUB 的關係是？', er: { entities: [{ name: 'STUDENT', attrs: ['*SID'] }, { name: 'CLUB', attrs: ['*CID'] }], rels: [{ a: 'STUDENT', b: 'CLUB', name: '參加', card: 'M:1' }] }, options: ['1:1', 'M:1', 'M:N', '1:M'], answer: 1 },
      ] },
    { kind: 'endless', id: 'e', title: '無限練習', gens: ['sqlWhere', 'sqlAgg', 'sqlFunc', 'sqlJoin', 'sqlSet', 'sqlSub', 'sqlDml', 'fdKey', 'fdNf', 'erCard'] },
    { kind: 'report', id: 'r', title: '交功課' },
  ],
};
