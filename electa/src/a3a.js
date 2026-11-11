/* 單元 a3a：連接數據表（一）——分拆數據表、INNER JOIN、LEFT JOIN、RIGHT JOIN、FULL JOIN、
 * 選擇合適的連接、COUNT(*) 與 COUNT(欄) 的分別、WHERE 與 HAVING
 * 教科書 選修A 第 3 章 p.104–121（3.1 A–D、例題 3.1、測試站 3.1）
 * 所有答案在 build 時由 SQL 引擎計算／核對。例題 3.1、測試站 3.1 只有欄位結構，數據由本單元自訂。
 *
 * 教科書疑似錯誤：p.104–105 活動 3.1 未分拆的 STUDENT 中 CID 2 = Chess Club、CID 1 = Art Club，分拆後的 CLUB 卻是 CID 1 = Chess Club、CID 2 = Art Club，兩者不一致。本單元用 p.107 的版本（1 = Chess Club）。
 * 教科書疑似錯誤：p.113「由於學會的記錄儲存於左方的數據表 STUDENT 中」——應為「學生（Ben）的記錄」。
 * 教科書疑似錯誤：p.121 測試站 3.1(c) 題目要求「排除單價高於或等於 1000 元的產品」，答案卻寫 `WHERE PRICE > 1000`，應為 `WHERE PRICE < 1000`。本單元 s5-p3、w3 用 `PRICE < 1000`。
 * 教科書疑似錯誤：p.121 測試站 3.1(a)(iv) 要求列出「每間店舖」，但答案 `LEFT JOIN … WHERE PRICE > 25` 的 WHERE 會篩走沒有單價高於 25 元產品的店舖（LEFT JOIN 的效果被抵消）。本單元 s5 以 note 說明。
 */
const C = (...ls) => ls.join('\n');
const HOT_JOIN = { t: 'hot', why: 'DSE 卷二A 幾乎每年都要求寫 JOIN／等連接語句，並常問結果有多少行' };

const CLUB_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE', 'CID'], [
    ['03493', 'Ada', 'F', '3A', 0, 2], ['03496', 'Clem', 'F', '3B', 89, 1], ['03505', 'Eva', 'F', '3B', 83, 4],
    ['03506', 'Gabe', 'M', '3C', 47, 4], ['03510', 'Finn', 'M', '3B', 35, 1], ['03513', 'Dio', 'M', '3C', 67, 4],
    ['03517', 'Ben', 'M', '3A', 86, null]], ['SID']],
  CLUB: [['CID', 'NAME', 'ROOM', 'TEACH'], [
    [1, 'Chess Club', 501, 'Mr Chan'], [2, 'Art Club', 402, 'Mrs Lee'], [3, 'English Club', 203, 'Mr Suen'], [4, 'Science Club', 502, 'Mr Wong']], ['CID']],
};
// 未分拆的 STUDENT（活動 3.1，p.104；CID 與學會名稱按 p.107 修正）
const FLAT_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE', 'CID', 'CNAME', 'CROOM', 'CTEACH'], [
    ['03493', 'Ada', 'F', '3A', 0, 2, 'Art Club', 402, 'Mrs Lee'], ['03496', 'Clem', 'F', '3B', 89, 1, 'Chess Club', 501, 'Mr Chan'],
    ['03505', 'Eva', 'F', '3B', 83, 4, 'Science Club', 502, 'Mr Wong'], ['03506', 'Gabe', 'M', '3C', 47, 4, 'Science Club', 502, 'Mr Wong'],
    ['03510', 'Finn', 'M', '3B', 35, 1, 'Chess Club', 501, 'Mr Chan'], ['03513', 'Dio', 'M', '3C', 67, 4, 'Science Club', 502, 'Mr Wong'],
    ['03517', 'Ben', 'M', '3A', 86, null, null, null, null]], ['SID']],
};
// 例題 3.1（p.115–119）：EMPLOYEE 與 TEAM 的成員按 p.118 的示例；薪金、部門、負責人自訂
const COMPANY_DB = {
  EMPLOYEE: [['ID', 'ENAME', 'DEPID', 'TEAMID', 'SALARY'], [
    [1, 'Ada', 1, 1, 25000], [2, 'Ben', 2, 2, 22000], [3, 'Clem', 1, 3, 32000], [4, 'Dio', 2, 3, 15000], [5, 'Eva', 2, 2, 17000]], ['ID']],
  TEAM: [['ID', 'TNAME', 'LEADID', 'MEMNUM'], [[1, 'Alpha', 1, 1], [2, 'Beta', 5, 2], [3, 'Gamma', 3, 2], [4, 'Delta', null, 0]], ['ID']],
  DEPARTMENT: [['ID', 'DNAME'], [[1, 'Sales'], [2, 'IT'], [3, 'HR']], ['ID']],
};
// 測試站 3.1（p.120–121）：數據自訂。PID 的英文字母代表產品類別。
const SHOP_DB = {
  PROD: [['PID', 'NAME', 'STOCK', 'PRICE', 'SID'], [
    ['P01', 'Gel Pen', 120, 8.5, 1], ['P02', 'Fountain Pen', 15, 180, 1], ['N01', 'Notebook', 200, 12, 1],
    ['P03', 'Ball Pen', 300, 5, 2], ['N02', 'Sketch Book', 40, 35, 2], ['B01', 'Backpack', 10, 450, 2],
    ['P04', 'Marker Pen', 80, 11.5, 3], ['C01', 'Calculator', 25, 1280, 3],
    ['P05', 'Brush Pen', 60, 9, null], ['N03', 'Diary', 90, 28, null]], ['PID']],
  SHOP: [['SID', 'NAME', 'MID', 'LOCATION'], [
    [1, 'Central Shop', 1, 'Central'], [2, 'Mong Kok Shop', 2, 'Mong Kok'], [3, 'Sha Tin Shop', 1, 'Sha Tin'], [4, 'Tai Po Shop', 3, 'Tai Po']], ['SID']],
  MANR: [['MID', 'NAME'], [[1, 'Ada'], [2, 'Ben'], [3, 'Clem']], ['MID']],
};

module.exports = {
  id: 'a3a',
  title: '連接數據表（一）：INNER、LEFT、RIGHT、FULL JOIN',
  book: '教科書 選修A 第 3 章 p.104–121',
  key: 'A-a3a-hmac-d4358a57c8',
  theory: false,
  dbs: { flat: FLAT_DB, club: CLUB_DB, company: COMPANY_DB, shop: SHOP_DB },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '為何分拆數據表；INNER JOIN', pages: '教科書 p.104–108',
      learn: [
        { pts: [
          '活動 3.1：把學生和學會的數據全放在一個數據表，會出現三個問題（p.104–105）：',
          '**更新**：科學學會搬到 301 室，要更新 **3** 項記錄（每個會員一項）；漏改一項便不一致。',
          '**插入**：新開的數學學會未有會員，**不能**儲存（SID 是主關鍵碼，不可以是 NULL）。',
          '**刪除**：Ada 轉校，刪除她的記錄後，她所屬的學會（只有她一個會員）的資料也一併消失。',
          '分拆成 **STUDENT** 和 **CLUB**，以**外鍵碼** CID 連接：搬房只改 CLUB 的 **1** 項記錄；新學會直接加入 CLUB；刪除學生不影響學會。（p.105–107）',
          '把數據儲存於多個數據表，用外鍵碼連接，便能保持數據**一致性**，並節省儲存空間。（p.107）',
        ] },
        { sim: { db: 'flat', sql: "SELECT SID, NAME, CNAME, CROOM FROM STUDENT WHERE CNAME = 'Science Club'" }, cap: '未分拆的 STUDENT（p.104）：同一個學會的會室號碼重複儲存了 3 次。' },
        { er: { entities: [{ name: 'STUDENT', attrs: ['*SID', 'NAME', 'SEX', 'CLASS', 'SCORE', 'CID'] }, { name: 'CLUB', attrs: ['*CID', 'NAME', 'ROOM', 'TEACH'] }], rels: [{ a: 'STUDENT', b: 'CLUB', name: '加入', card: 'M:1' }] }, cap: '分拆後（p.107）：STUDENT.CID 是外鍵碼，指向 CLUB 的主關鍵碼 CID。' },
        { h: 'INNER JOIN（內連接）' },
        { pts: [
          '`SELECT * FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID`（p.107）',
          '`FROM` 後面的 STUDENT 是**左方數據表**，`JOIN` 後面的 CLUB 是**右方數據表**；`ON` 之後寫連接條件（外鍵碼 = 主關鍵碼）。',
          '結果**只包括兩個數據表中相符的記錄**。`INNER JOIN` 可簡寫成 `JOIN`。',
          '沒有學會的 Ben（CID 是 NULL）和沒有會員的 English Club **都不在結果中**。（p.108）',
          '`SELECT *` 會列出兩個數據表的所有欄位：前 6 欄來自 STUDENT，後 4 欄來自 CLUB，所以 CID 出現兩次。',
        ] },
        { sim: { db: 'club', sql: 'SELECT * FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID' }, cap: 'p.107–108：數一數結果有多少行，誰不見了？' },
      ],
      tries: [
        { id: 'a3a-s1-t1', pts: 4, src: '教科書 p.107–108', db: 'club', sql: 'SELECT * FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID',
          q: '先估：結果有多少行？', ask: 'rows', options: ['6', '7', '8', '28'],
          why: '7 位學生中只有 Ben 沒有學會（CID 是 NULL，NULL = 任何值都不成立），所以 6 行；English Club 沒有會員，也不會出現。' },
      ],
      practice: [
        { id: 'a3a-s1-p1', type: 'fill', pts: 2, src: '教科書 p.104–105 活動 3.1 個案 1',
          q: '科學學會（Science Club）的會室搬到 301 室。分別要更新多少項記錄？',
          blanks: [{ label: '未分拆（只有一個 STUDENT）', a: '3' }, { label: '分拆成 STUDENT 和 CLUB', a: '1' }],
          hint: '未分拆時，每個科學學會會員的記錄都有 CROOM；分拆後只有 CLUB 的一項記錄有 ROOM。' },
        { id: 'a3a-s1-p2', type: 'mc', pts: 1, src: '教科書 p.104–106 活動 3.1',
          q: '以下哪一項**不是**把學生與學會的數據分拆到兩個數據表的好處？',
          options: ['更新學會資料時，所須更新的記錄較少', '沒有會員的新學會也可以儲存', '刪除學生記錄時，不會失去學會的資料', '查詢學生所屬學會的名稱時，不用連接數據表'], answer: 3,
          hint: '分拆後，學會名稱在另一個數據表，查詢時反而**要**連接。' },
        { id: 'a3a-s1-p3', type: 'mc', pts: 2, src: '教科書 p.107', db: 'club', verify: true, ask: { col: 'NAME' },
          q: '以下語句輸出哪些名字？', sql: "SELECT STUDENT.NAME FROM STUDENT JOIN CLUB ON STUDENT.CID = CLUB.CID WHERE TEACH = 'Mr Chan'",
          options: ['Clem, Finn', 'Ada', 'Clem, Finn, Ben', 'Eva, Gabe, Dio'], answer: 0,
          hint: 'Mr Chan 負責 CID 1（Chess Club）。`JOIN` 就是 INNER JOIN。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: 'LEFT JOIN；別名；連接後匯總', pages: '教科書 p.108–111',
      learn: [
        { pts: [
          '**LEFT JOIN**（左外連接，也可寫 `LEFT OUTER JOIN`）：結果包括**左方數據表的所有記錄**，再加上兩個數據表中相符的值。（p.108）',
          '`SELECT * FROM STUDENT LEFT JOIN CLUB ON STUDENT.CID = CLUB.CID`：Ben 也在結果中，他那一行來自 CLUB 的欄位全是 **NULL**；English Club 在右方，仍然不在結果中。（p.109）',
          '`ON` 條件兩邊的先後次序不影響結果：`ON CLUB.CID = STUDENT.CID` 一樣。（p.109）',
          '連接後可以照常選擇欄位、用 WHERE 篩選、ORDER BY 排序。（p.109）',
          '兩個數據表都有 **NAME**：必須寫成 `STUDENT.NAME`、`CLUB.NAME`，否則出錯（欄名不清楚）。（p.110）',
          '**別名**：`FROM STUDENT s LEFT JOIN CLUB c`，之後用 `s.NAME`、`c.NAME`；欄位也可加別名 `c.NAME AS CLUBNAME`。（p.110）',
        ] },
        { sim: { db: 'club', sql: C('SELECT SID, s.NAME, CLASS, c.NAME AS CLUBNAME, ROOM', '    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID', '    WHERE SCORE >= 60', '    ORDER BY CLASS') }, cap: 'p.110：獲得至少 60 分的學生及其學會。把 LEFT JOIN 改成 INNER JOIN，Ben 會怎樣？' },
        { h: '連接後再分組（p.111）' },
        { code: C("SELECT c.NAME, AVG(SCORE)", "    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID", "    WHERE s.SID <> '03506'", "    GROUP BY c.CID", "    HAVING COUNT(*) > 1"), cap: '處理次序：連接 → WHERE 篩走 Gabe → GROUP BY 每個學會一組（Ben 自成 NULL 一組）→ HAVING 只留人數多於 1 的組。' },
        { sim: { db: 'club', sql: C("SELECT c.NAME, AVG(SCORE), COUNT(*)", "    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID", "    WHERE s.SID <> '03506'", "    GROUP BY c.CID") }, cap: '先不加 HAVING，看看每一組的人數；再自己加上 `HAVING COUNT(*) > 1`。' },
        { warn: '如果有**多於一個**學生不屬於任何學會，他們會組成 NULL 一組，HAVING COUNT(*) > 1 便不能把這組篩走——結果會多了一行 NULL 學會的平均分。（p.111）' },
      ],
      tries: [
        { id: 'a3a-s2-t1', pts: 4, src: '教科書 p.110', db: 'club',
          sql: C('SELECT SID, s.NAME, CLASS, c.NAME AS CLUBNAME, ROOM', '    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID', '    WHERE SCORE >= 60', '    ORDER BY CLASS'),
          q: '先估：結果第一行（ORDER BY CLASS 後）的 CLUBNAME 是什麼？', ask: { cell: [1, 'CLUBNAME'] }, options: ['NULL', 'Art Club', 'Chess Club', 'Science Club'],
          why: '3A 班有 Ada（0 分，被 WHERE 篩走）和 Ben（86 分）。Ben 沒有學會，LEFT JOIN 後 c.NAME 是 NULL。' },
      ],
      practice: [
        { id: 'a3a-s2-p1', type: 'mc', pts: 1, src: '教科書 p.110', db: 'club',
          q: '執行 `SELECT SID, NAME, ROOM FROM STUDENT LEFT JOIN CLUB ON STUDENT.CID = CLUB.CID` 會怎樣？',
          options: ['列出 7 行', '列出 6 行', '出錯：NAME 不清楚，要寫成 STUDENT.NAME 或 CLUB.NAME', '出錯：LEFT JOIN 不可以用 ON'], answer: 2,
          hint: 'STUDENT 和 CLUB 都有欄位 NAME。' },
        { id: 'a3a-s2-p2', type: 'mc', pts: 2, src: '教科書 p.111', db: 'club', verify: true, ask: 'table',
          q: '以下語句的結果是什麼？', sql: C("SELECT c.NAME, AVG(SCORE)", "    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID", "    WHERE s.SID <> '03506'", "    GROUP BY c.CID", "    HAVING COUNT(*) > 1"),
          options: ['Chess Club, 62\nScience Club, 75', 'Chess Club, 62\nScience Club, 65.67', 'Art Club, 0\nChess Club, 62\nScience Club, 75\nNULL, 86', 'Chess Club, 62\nScience Club, 75\nNULL, 86'], answer: 0,
          hint: 'Gabe（47）被 WHERE 篩走：Science Club 剩下 83 和 67；Art Club 和 NULL 組都只有 1 人。' },
        { id: 'a3a-s2-p3', type: 'complete', pts: 2, src: '教科書 p.108–110', db: 'club',
          q: '列出**所有**學生的名字及其學會名稱（沒有學會的學生也要列出）。',
          template: 'SELECT s.NAME, c.NAME FROM STUDENT s ［1］ CLUB c ON ［2］',
          ref: ['LEFT JOIN', 's.CID = c.CID'],
          hint: '要保留左方數據表 STUDENT 的所有記錄。連接條件是兩個數據表的 CID 相等。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: 'RIGHT JOIN 與 FULL JOIN', pages: '教科書 p.112–114',
      learn: [
        { pts: [
          '**RIGHT JOIN**（右外連接，也可寫 `RIGHT OUTER JOIN`）：結果包括**右方數據表的所有記錄**，再加上相符的值。（p.112）',
          '`SELECT * FROM STUDENT RIGHT JOIN CLUB ON STUDENT.CID = CLUB.CID`：English Club 在結果中（學生的欄位是 NULL）；Ben 在左方數據表，不在結果中。（p.112–113）',
          '把兩個數據表**對調位置**，RIGHT JOIN 便可改寫成 LEFT JOIN：`SELECT * FROM CLUB LEFT JOIN STUDENT ON CLUB.CID = STUDENT.CID`。兩個結果除了欄位次序外一模一樣。（p.113）',
          '**FULL JOIN**（`FULL OUTER JOIN`）：包括**左方和右方數據表的所有記錄**。Ben 和 English Club 都在結果中。（p.114）',
          'MySQL 沒有 FULL JOIN 這個關鍵字，可以用 LEFT JOIN 與 RIGHT JOIN 的結果 **UNION** 起來代替（第 3.3 節）。DSE 試題仍會用 FULL JOIN 這個寫法。（p.114）',
        ] },
        { table: { head: ['連接', '左方沒有配對的記錄（Ben）', '右方沒有配對的記錄（English Club）', '本例行數'], rows: [['INNER JOIN', '✗', '✗', '6'], ['LEFT JOIN', '✓', '✗', '7'], ['RIGHT JOIN', '✗', '✓', '7'], ['FULL JOIN', '✓', '✓', '8']] }, cap: '四種連接的比較（p.107–114）' },
        { sim: { db: 'club', sql: 'SELECT * FROM STUDENT RIGHT JOIN CLUB ON STUDENT.CID = CLUB.CID' }, cap: 'p.112：試把 RIGHT 改成 FULL，再改成 LEFT，比較行數。' },
      ],
      tries: [
        { id: 'a3a-s3-t1', pts: 4, src: '教科書 p.114', db: 'club', sql: 'SELECT * FROM STUDENT FULL JOIN CLUB ON STUDENT.CID = CLUB.CID',
          q: '先估：FULL JOIN 的結果有多少行？', ask: 'rows', options: ['6', '7', '8', '11'],
          why: '6 行相符的記錄，加上左方的 Ben 和右方的 English Club，共 8 行。（不是 7 + 4 = 11）' },
      ],
      practice: [
        { id: 'a3a-s3-p1', type: 'mc', pts: 2, src: '教科書 p.113', db: 'club',
          q: '以下哪一句與 `SELECT * FROM STUDENT RIGHT JOIN CLUB ON STUDENT.CID = CLUB.CID` 得出相同的記錄（不計欄位次序）？',
          options: ['SELECT * FROM STUDENT LEFT JOIN CLUB ON STUDENT.CID = CLUB.CID', 'SELECT * FROM CLUB LEFT JOIN STUDENT ON CLUB.CID = STUDENT.CID', 'SELECT * FROM CLUB RIGHT JOIN STUDENT ON CLUB.CID = STUDENT.CID', 'SELECT * FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID'], answer: 1,
          hint: '要保留 CLUB 的所有記錄：把 CLUB 放在左方，用 LEFT JOIN。' },
        { id: 'a3a-s3-p2', type: 'fill', pts: 1, src: '教科書 p.112', db: 'club',
          q: '執行以下語句，寫出結果的行數和 SID 是 NULL 的那一行的學會名稱。',
          sql: 'SELECT SID, CLUB.NAME FROM STUDENT RIGHT JOIN CLUB ON STUDENT.CID = CLUB.CID',
          blanks: [{ label: '行數', ask: 'rows' }, { label: 'SID 是 NULL 的學會', a: 'English Club', accept: ['english club'] }],
          hint: 'RIGHT JOIN 保留右方 CLUB 的全部 4 個學會；沒有會員的學會，學生欄位是 NULL。' },
        { id: 'a3a-s3-p3', type: 'complete', pts: 2, src: '教科書 p.112–113', db: 'club',
          q: '列出**每個學會**的名稱及其會員名字；沒有會員的學會也要列出。用 RIGHT JOIN 完成。',
          template: 'SELECT CLUB.NAME, STUDENT.NAME FROM STUDENT ［1］ CLUB ON ［2］',
          ref: ['RIGHT JOIN', 'STUDENT.CID = CLUB.CID'],
          hint: 'CLUB 在右方，所以用 RIGHT JOIN 保留所有學會。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '選擇合適的連接；COUNT(*) 的陷阱', pages: '教科書 p.115–119（例題 3.1）',
      learn: [
        { pts: [
          '例題 3.1：EMPLOYEE（ID, ENAME, DEPID, TEAMID, SALARY）、TEAM（ID, TNAME, LEADID, MEMNUM）、DEPARTMENT（ID, DNAME）。三個數據表都有欄位 **ID**，要寫 `TEAM.ID`、`EMPLOYEE.ID`。（p.115）',
          '先想：哪一個數據表的記錄**全部都要**出現？用文氏圖想清楚。（p.116–117）',
          '(a)(i) 每位員工都有部門，結果**不要**沒有員工的部門：EMPLOYEE 在左方用 **LEFT JOIN 或 INNER JOIN**（RIGHT JOIN 會多了沒有員工的部門）。',
          '(a)(ii) 部分團隊未有負責人，但每個團隊都要列出：TEAM 在左方用 **LEFT JOIN**，連接條件是 `LEADID = EMPLOYEE.ID`。',
          '(b)(i) TEAM 的 **MEMNUM**（團隊人數）每次加入員工都要更新，容易不一致；應改用 COUNT() 計算。（p.118）',
          '(b)(ii) **COUNT(*) 會點算 NULL 那一行**：沒有成員的團隊（Delta）在 RIGHT JOIN 後仍有一行（ENAME 是 NULL），COUNT(*) 得 1；要用 **COUNT(ENAME)**，NULL 不計，得 0。（p.118–119）',
          '(c) **WHERE 在分組之前**篩選記錄；**HAVING 在分組之後**篩選組。「排除平均薪金低於 20000 的團隊」要用 HAVING AVG(SALARY) >= 20000。（p.119）',
        ] },
        { er: { entities: [{ name: 'EMPLOYEE', attrs: ['*ID', 'ENAME', 'DEPID', 'TEAMID', 'SALARY'] }, { name: 'TEAM', attrs: ['*ID', 'TNAME', 'LEADID', 'MEMNUM'] }, { name: 'DEPARTMENT', attrs: ['*ID', 'DNAME'] }], rels: [{ a: 'EMPLOYEE', b: 'TEAM', name: '屬於', card: 'M:1' }, { a: 'EMPLOYEE', b: 'DEPARTMENT', name: '屬於', card: 'M:1' }, { a: 'TEAM', b: 'EMPLOYEE', name: '負責人', card: 'M:1' }] }, cap: '例題 3.1 的數據表（數據由本單元自訂；團隊成員與 p.118 相同）' },
        { sim: { db: 'company', sql: C('SELECT TNAME, COUNT(*), COUNT(ENAME) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    GROUP BY TEAM.ID') }, cap: 'p.118–119：比較 Delta 一組的 COUNT(*) 和 COUNT(ENAME)。' },
        { fix: { bad: C('SELECT TNAME, AVG(SALARY) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    WHERE SALARY >= 20000 GROUP BY TEAM.ID'), good: C('SELECT TNAME, AVG(SALARY) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    GROUP BY TEAM.ID HAVING AVG(SALARY) >= 20000'), why: '例題 3.1(c)：WHERE 先排除了薪金低於 20000 的**員工**，再計平均；題目要排除平均薪金低於 20000 的**團隊**，要用 HAVING。（沒有員工的團隊 AVG 是 NULL，HAVING 也會把它篩走。）' } },
      ],
      tries: [
        { id: 'a3a-s4-t1', pts: 4, src: '教科書 p.118 例題 3.1(b)(ii)', db: 'company',
          sql: C('SELECT TNAME, COUNT(*) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    GROUP BY TEAM.ID ORDER BY TEAM.ID'),
          q: '先估：結果是什麼？', ask: 'table',
          options: ['Alpha, 1\nBeta, 2\nGamma, 2\nDelta, 1', 'Alpha, 1\nBeta, 2\nGamma, 2\nDelta, 0', 'Alpha, 1\nBeta, 2\nGamma, 2', 'Alpha, 1\nBeta, 2\nGamma, 2\nDelta, NULL'],
          why: 'RIGHT JOIN 保留 Delta，那一行的 EMPLOYEE 欄位全是 NULL；COUNT(*) 點算的是行數，所以 Delta 得 1（錯誤的人數）。改用 COUNT(ENAME) 便得 0。' },
      ],
      practice: [
        { id: 'a3a-s4-p1', type: 'mc', pts: 1, src: '教科書 p.116 例題 3.1(a)(i)', db: 'company',
          q: '每位員工都有部門，部分部門沒有員工。要列出每位員工的名字及其部門名稱，**不要**列出沒有員工的部門。以下哪一句**不**正確？',
          options: ['SELECT ENAME, DNAME FROM EMPLOYEE LEFT JOIN DEPARTMENT ON DEPID = DEPARTMENT.ID', 'SELECT ENAME, DNAME FROM EMPLOYEE INNER JOIN DEPARTMENT ON DEPID = DEPARTMENT.ID', 'SELECT ENAME, DNAME FROM EMPLOYEE RIGHT JOIN DEPARTMENT ON DEPID = DEPARTMENT.ID', 'SELECT ENAME, DNAME FROM DEPARTMENT RIGHT JOIN EMPLOYEE ON DEPID = DEPARTMENT.ID'], answer: 2,
          hint: 'RIGHT JOIN 會保留右方 DEPARTMENT 的所有記錄，包括沒有員工的 HR。' },
        { id: 'a3a-s4-p2', type: 'mc', pts: 2, src: '教科書 p.116、p.119 例題 3.1(c)', db: 'company', verify: true, ask: 'table',
          q: '經理用了以下語句。結果是什麼？', sql: C('SELECT TNAME, AVG(SALARY) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    WHERE SALARY >= 20000 GROUP BY TEAM.ID'),
          options: ['Alpha, 25000\nBeta, 22000\nGamma, 32000', 'Alpha, 25000\nGamma, 23500', 'Alpha, 25000\nBeta, 19500\nGamma, 23500', 'Alpha, 25000\nBeta, 22000\nGamma, 32000\nDelta, NULL'], answer: 0,
          hint: 'WHERE 先篩走 Dio（15000）、Eva（17000）和 Delta 的 NULL 行，再分組計平均。Beta 只剩 Ben。' },
        { id: 'a3a-s4-p3', type: 'complete', pts: 2, src: '教科書 p.119 例題 3.1(b)(ii)', db: 'company',
          q: '列出每個團隊的名稱及團隊人數（沒有成員的團隊要顯示 0）。',
          template: C('SELECT TNAME, COUNT(［1］) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    GROUP BY ［2］'),
          ref: ['ENAME', 'TEAM.ID'],
          hint: '點算一個在沒有成員時會是 NULL 的欄位；按團隊分組（不可以用 TEAMID，因為 Delta 那一行的 TEAMID 是 NULL）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '綜合：連接、篩選與分組', pages: '教科書 p.120–121（測試站 3.1）',
      learn: [
        { pts: [
          '測試站 3.1：PROD（PID, NAME, STOCK, PRICE, SID）、SHOP（SID, NAME, MID, LOCATION）、MANR（MID, NAME）。三個數據表都有 NAME，SHOP 和 PROD 都有 SID。（p.120）',
          '寫連接題的步驟：① 要哪些欄位？來自哪些數據表？② 哪個數據表的記錄要全部保留？→ 選 INNER／LEFT／RIGHT；③ 寫 ON 條件；④ WHERE → GROUP BY → HAVING → ORDER BY。',
          '(a)(ii)「結果應包含不具店舖識別碼的產品」→ PROD 在左方用 LEFT JOIN。',
          '(a)(iii) 每間店舖的產品數量：SHOP 在左方用 LEFT JOIN，點算 `COUNT(PID)`；沒有產品的店舖得 0。',
          '(b) `MID(PID, 1, 1)` 取 PID 第 1 個字母（產品類別）；`GROUP BY SHOP.SID, MID(PID, 1, 1)` 按「店舖 + 類別」分組。（p.121）',
        ] },
        { note: '**注意**：在 LEFT JOIN 之後用 WHERE 篩選**右方**數據表的欄位（例如 `WHERE PRICE > 25`），右方是 NULL 的行會被篩走，LEFT JOIN 保留的記錄便消失了。測試站 3.1(a)(iv) 的答案因此不會列出沒有這類產品的店舖。' },
        { sim: { db: 'shop', sql: C('SELECT SHOP.NAME, MID(PID, 1, 1), MAX(PRICE) FROM SHOP', '    LEFT JOIN PROD ON SHOP.SID = PROD.SID', '    GROUP BY SHOP.SID, MID(PID, 1, 1)') }, cap: '測試站 3.1(b)（p.121）：每間店舖每個產品類別中最高的單價。' },
      ],
      tries: [
        { id: 'a3a-s5-t1', pts: 4, src: '教科書 p.121 測試站 3.1(a)(iii)', db: 'shop',
          sql: C('SELECT SHOP.NAME, COUNT(PID) FROM SHOP', '    LEFT JOIN PROD ON SHOP.SID = PROD.SID', '    GROUP BY SHOP.SID'),
          q: '先估：Tai Po Shop（沒有任何產品）那一行的 COUNT(PID) 是什麼？', ask: { cell: [4, 'COUNT(PID)'] }, options: ['0', '1', 'NULL', '不會出現這一行'],
          why: 'SHOP 在左方，LEFT JOIN 保留 Tai Po Shop；那一行的 PID 是 NULL，COUNT(PID) 不計 NULL，所以是 0。' },
      ],
      practice: [
        { id: 'a3a-s5-p1', type: 'complete', pts: 2, src: '教科書 p.120 測試站 3.1(a)(ii)', db: 'shop',
          q: '列出所有名稱以「Pen」作結，且單價低於 11.5 元的產品之名稱及店舖位置。結果應包含不具店舖識別碼的產品。',
          template: C('SELECT PROD.NAME, LOCATION FROM PROD ［1］ SHOP ON PROD.SID = SHOP.SID', '    WHERE ［2］ AND PRICE < 11.5'),
          ref: ['LEFT JOIN', "PROD.NAME LIKE '%Pen'"],
          hint: 'PROD 在左方，要保留沒有店舖的產品。「以 Pen 作結」用 LIKE 和 %；NAME 要註明來自 PROD。' },
        { id: 'a3a-s5-p2', type: 'mc', pts: 1, src: '教科書 p.120 測試站 3.1(a)(i)', db: 'shop', verify: true, ask: { col: 'NAME' },
          q: '以下語句輸出什麼？', sql: C('SELECT SHOP.NAME FROM SHOP INNER JOIN MANR ON SHOP.MID = MANR.MID', "    WHERE MANR.NAME = 'Ada'"),
          options: ['Central Shop, Sha Tin Shop', 'Central Shop', 'Ada', 'Central Shop, Mong Kok Shop, Sha Tin Shop'], answer: 0,
          hint: 'Ada 的 MID 是 1；SHOP 中 MID 是 1 的店舖有兩間。' },
        { id: 'a3a-s5-p3', type: 'mc', pts: 2, src: '教科書 p.121 測試站 3.1(c)（答案已更正，見單元檔頭）', db: 'shop',
          q: '經理要找出每間店舖的平均產品單價，計算時排除單價 1000 元或以上的產品。以下哪一句正確？',
          options: [C('SELECT NAME, AVG(PRICE) FROM SHOP s LEFT JOIN PROD p ON s.SID = p.SID', '    GROUP BY s.SID HAVING PRICE > 1000'), C('SELECT s.NAME, AVG(PRICE) FROM SHOP s LEFT JOIN PROD p ON s.SID = p.SID', '    GROUP BY s.SID HAVING PRICE < 1000'), C('SELECT s.NAME, AVG(PRICE) FROM SHOP s LEFT JOIN PROD p ON s.SID = p.SID', '    WHERE PRICE < 1000 GROUP BY s.SID'), C('SELECT s.NAME, AVG(PRICE) FROM SHOP s LEFT JOIN PROD p ON s.SID = p.SID', '    WHERE PRICE > 1000 GROUP BY s.SID')], answer: 2,
          hint: '排除個別**產品**（分組前）用 WHERE；NAME 兩個數據表都有，要寫 s.NAME；排除 ≥ 1000 即保留 < 1000。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL', pages: '教科書 p.108–121',
      intro: '在編輯器寫一句 SELECT 語句，可以先按 ▶ 執行自己檢查，再按「提交評核」。評核時會用另外幾組數據測試，所以不可以把答案「寫死」。',
      tasks: [
        { id: 'a3a-w1', pts: 10, title: '每位學生的學會', src: '教科書 p.108–110', db: 'club',
          q: '列出**所有**學生的學生識別碼 SID、名字及所屬學會的名稱（欄位名稱改為 `CLUBNAME`）；沒有學會的學生也要列出。結果按 SID 遞升排序。',
          starter: 'SELECT SID, NAME FROM STUDENT',
          ref: C('SELECT SID, s.NAME, c.NAME AS CLUBNAME', '    FROM STUDENT s LEFT JOIN CLUB c ON s.CID = c.CID', '    ORDER BY SID'),
          check: { order: true },
          rules: [{ must: 'JOIN', msg: '要用 JOIN 連接 STUDENT 和 CLUB。' }],
          hint: 'STUDENT 在左方，用 `LEFT JOIN CLUB c ON s.CID = c.CID`；兩個數據表都有 NAME，要寫 `s.NAME`、`c.NAME AS CLUBNAME`。' },
        { id: 'a3a-w2', pts: 12, title: '每個團隊的人數', src: '教科書 p.118–119 例題 3.1(b)(ii)', db: 'company',
          q: '不可使用 TEAM 的 MEMNUM。列出**每個**團隊的名稱 TNAME 及其員工人數；沒有員工的團隊要顯示 0。',
          starter: 'SELECT TNAME FROM TEAM',
          ref: C('SELECT TNAME, COUNT(ENAME) FROM EMPLOYEE', '    RIGHT JOIN TEAM ON TEAMID = TEAM.ID', '    GROUP BY TEAM.ID'),
          rules: [{ must: 'JOIN', msg: '要連接 EMPLOYEE 和 TEAM。' }, { mustNot: 'MEMNUM', msg: '不可使用 MEMNUM，要用 COUNT() 計算。' }, { must: 'GROUP BY', msg: '要按團隊分組。' }],
          hint: '要保留所有團隊：`TEAM LEFT JOIN EMPLOYEE` 或 `EMPLOYEE RIGHT JOIN TEAM`。用 `COUNT(ENAME)`（不是 COUNT(*)），按 `TEAM.ID` 分組。' },
        { id: 'a3a-w3', pts: 13, title: '店舖的平均單價', src: '教科書 p.121 測試站 3.1(c)', db: 'shop',
          q: '列出每間（有產品的）店舖的店舖名稱及平均產品單價。計算時**排除單價 1000 元或以上**的產品。',
          starter: 'SELECT NAME, AVG(PRICE) FROM SHOP',
          ref: C('SELECT s.NAME, AVG(PRICE) FROM SHOP s', '    INNER JOIN PROD p ON s.SID = p.SID', '    WHERE PRICE < 1000', '    GROUP BY s.SID'),
          rules: [{ must: 'GROUP BY', msg: '要按店舖分組。' }],
          hint: '連接 SHOP 和 PROD（`s.SID = p.SID`）；先用 WHERE 排除貴的產品，再 `GROUP BY s.SID`。SHOP 和 PROD 都有 NAME，要寫 `s.NAME`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.104–121',
      items: [
        { id: 'a3a-q1', pts: 4, src: '自擬（DSE 卷二A 題型）', tags: [HOT_JOIN], db: 'club', verify: true, ask: 'rows',
          q: '執行以下語句，結果有多少行？', sql: 'SELECT * FROM CLUB LEFT JOIN STUDENT ON CLUB.CID = STUDENT.CID',
          options: ['6', '7', '8', '11'], answer: 'B',
          why: 'CLUB 在左方：6 行相符的記錄，加上沒有會員的 English Club，共 7 行；Ben 不會出現。' },
        { id: 'a3a-q2', pts: 4, src: '教科書 p.118–119 例題 3.1(b)', tags: [{ t: 'trap', why: 'COUNT(*) 會點算外連接產生的 NULL 行' }], db: 'club', verify: true, ask: { cell: [3, 'N'] },
          q: '以下語句中，English Club（第 3 行）的 N 是多少？', sql: C('SELECT c.NAME, COUNT(*) AS N FROM CLUB c', '    LEFT JOIN STUDENT s ON c.CID = s.CID', '    GROUP BY c.CID ORDER BY c.CID'),
          options: ['0', '1', 'NULL', '7'], answer: 'B',
          why: 'English Club 沒有會員，但 LEFT JOIN 仍產生一行（學生欄位是 NULL）；COUNT(*) 點算行數，得 1。應改用 COUNT(s.SID)。' },
        { id: 'a3a-q3', pts: 4, src: '教科書 p.119 例題 3.1(c)', tags: [{ t: 'trap', why: 'WHERE 與 HAVING 混淆' }],
          q: '要列出平均分高於 60 的學會名稱。以下哪一句正確？',
          options: [C('SELECT c.NAME FROM STUDENT s JOIN CLUB c ON s.CID = c.CID', '    WHERE AVG(SCORE) > 60 GROUP BY c.CID'), C('SELECT c.NAME FROM STUDENT s JOIN CLUB c ON s.CID = c.CID', '    WHERE SCORE > 60 GROUP BY c.CID'), C('SELECT c.NAME FROM STUDENT s JOIN CLUB c ON s.CID = c.CID', '    GROUP BY c.CID HAVING AVG(SCORE) > 60'), C('SELECT c.NAME FROM STUDENT s JOIN CLUB c ON s.CID = c.CID', '    HAVING AVG(SCORE) > 60 GROUP BY c.CID')], answer: 'C',
          why: 'A：聚合函數不可放在 WHERE。B：先篩走 60 分或以下的學生才計，意思不同。D：HAVING 要寫在 GROUP BY 之後。' },
        { id: 'a3a-q4', pts: 4, src: '教科書 p.110', db: 'club', verify: true, ask: 'rows',
          q: '以下語句的結果有多少行？', sql: C('SELECT s.NAME, c.NAME FROM STUDENT s INNER JOIN CLUB c', "    ON s.CID = c.CID WHERE c.NAME = 'Science Club' OR s.SCORE > 85"),
          options: ['3', '4', '5', '6'], answer: 'B',
          why: 'Science Club 有 Eva、Gabe、Dio；分數高於 85 的 Clem（Chess）和 Ben（沒有學會，INNER JOIN 已排除）。共 4 行。' },
        { id: 'a3a-q5', pts: 4, src: '教科書 p.116–117 例題 3.1(a)', tags: [HOT_JOIN],
          q: 'TEAM（ID, TNAME, LEADID）中部分團隊未有負責人（LEADID 是 NULL）。要列出**每個**團隊的名稱及負責人的名字。以下哪一句正確？',
          options: ['SELECT TNAME, ENAME FROM TEAM INNER JOIN EMPLOYEE ON LEADID = EMPLOYEE.ID', 'SELECT TNAME, ENAME FROM TEAM LEFT JOIN EMPLOYEE ON TEAM.ID = TEAMID', 'SELECT TNAME, ENAME FROM TEAM LEFT JOIN EMPLOYEE ON LEADID = EMPLOYEE.ID', 'SELECT TNAME, ENAME FROM TEAM RIGHT JOIN EMPLOYEE ON LEADID = EMPLOYEE.ID'], answer: 'C',
          why: 'TEAM 在左方用 LEFT JOIN 保留沒有負責人的團隊；負責人的連接條件是 LEADID = EMPLOYEE.ID（B 列出的是團隊成員）。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlJoin', 'sqlAgg'], intro: '隨機生成 INNER／LEFT／RIGHT JOIN 結果行數及連接後分組的題目，答案由 SQL 引擎計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
