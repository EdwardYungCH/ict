/* 單元 a3b：連接數據表（二）——等連接、NATURAL JOIN、自連接、連接多於兩個數據表、CROSS JOIN、
 * 三個數據表的綜合題（例題 3.2、測試站 3.2）
 * 教科書 選修A 第 3 章 p.122–134
 * 所有答案在 build 時由 SQL 引擎計算／核對。例題 3.2、測試站 3.2 只有欄位結構，數據由本單元自訂。
 *
 * 教科書疑似錯誤：p.126 加上 `s1.SID < s2.SID` 後的結果：首三列左右次序相反（按 SID 應為 Clem／Eva、Clem／Ben、Eva／Ben），第 4 列 s2 的 NAME 印成「Gabe」，應為「Finn」。本單元 s2 以引擎結果為準。
 * 教科書疑似錯誤：p.130 按 COST 排序的結果中 Ada／Eva 印作 141.8，應為 4 × 11.2 + 7 × 13.8 = 141.4（與同頁上表一致）。
 * 教科書疑似錯誤：p.131 例題 3.2「每個團隊只少有一位員工」，「只少」應為「至少」。
 * 教科書疑似錯誤：p.133 例題 3.2(d) 答案 ‘IT%’ 印作彎引號，SQL 要用直引號 'IT%'。
 * 教科書疑似錯誤：p.127 表號次序為 3.11（STUDENT）、3.10（SC）、3.12（CLUB），與排列次序不符；p.129 表 3.14 排在表 3.13 之前。
 * 教科書疑似錯誤：p.192 課文總結的 NATURAL JOIN 例子 `SELECT * FROM EMPLOYEE NATURAL JOIN TASK ON EMPLOYEE.EID = TASK.EID` 不能執行——NATURAL JOIN 不可以加 ON（p.125 的寫法正確）。
 * 備註（非教科書錯誤）：p.125 說 NATURAL JOIN 與 INNER JOIN「取得同樣的結果」；在 MySQL 中 `SELECT *` 的 NATURAL JOIN 只顯示共同欄位 CID 一次，INNER JOIN 則顯示兩次，記錄相同但欄位數不同。
 */
const C = (...ls) => ls.join('\n');
const HOT_JOIN = { t: 'hot', why: 'DSE 卷二A 經常要求以等連接連接兩至三個數據表' };

const STU = [
  ['03493', 'Ada', 'F', '3A', 0], ['03496', 'Clem', 'F', '3B', 89], ['03505', 'Eva', 'F', '3B', 83], ['03506', 'Gabe', 'M', '3C', 47],
  ['03510', 'Finn', 'M', '3B', 35], ['03513', 'Dio', 'M', '3C', 67], ['03517', 'Ben', 'M', '3A', 86]];
const CLUBS = [[1, 'Chess Club', 501, 'Mr Chan'], [2, 'Art Club', 402, 'Mrs Lee'], [3, 'English Club', 203, 'Mr Suen'], [4, 'Science Club', 502, 'Mr Wong']];
const CIDS = [2, 1, 4, 4, 1, 4, null];
const CLUB_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE', 'CID'], STU.map((r, i) => r.concat([CIDS[i]])), ['SID']],
  CLUB: [['CID', 'NAME', 'ROOM', 'TEACH'], CLUBS, ['CID']],
};
const CLUB2_DB = {
  STUDENT: CLUB_DB.STUDENT,
  CLUB: [['CID', 'CLUBNAME', 'ROOM', 'TEACH'], CLUBS, ['CID']],
};
// 表 3.9（p.125）：CMSID 是班長的 SID
const MONITOR_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'CMSID', 'SCORE'], [
    ['03493', 'Ada', 'F', '3A', '03517', 0], ['03496', 'Clem', 'F', '3B', '03505', 89], ['03505', 'Eva', 'F', '3B', '03505', 83],
    ['03506', 'Gabe', 'M', '3C', '03513', 47], ['03510', 'Finn', 'M', '3B', '03505', 35], ['03513', 'Dio', 'M', '3C', '03513', 67],
    ['03517', 'Ben', 'M', '3A', '03517', 86]], ['SID']],
};
// 表 3.10–3.12（p.127）
const SC_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE'], STU, ['SID']],
  SC: [['SID', 'CID'], [['03493', 2], ['03496', 1], ['03496', 2], ['03496', 4], ['03505', 4], ['03506', 4], ['03510', 1], ['03513', 4]], ['SID', 'CID']],
  CLUB: [['CID', 'NAME', 'ROOM', 'TEACH'], CLUBS, ['CID']],
};
// p.129–130
const FRUIT_DB = {
  L: [['LID'], [['A'], ['B'], ['C']], ['LID']],
  R: [['RID'], [['D'], ['E'], ['F']], ['RID']],
  BUYER: [['BNAME', 'NA', 'NO'], [['Ada', 4, 7], ['Ben', 9, 6], ['Clem', 6, 7]], ['BNAME']],
  SELLER: [['SNAME', 'PA', 'PO'], [['Dio', 13.1, 12.0], ['Eva', 11.2, 13.8], ['Finn', 14.0, 11.4]], ['SNAME']],
};
// 例題 3.2（p.131–133）：數據自訂（每位員工都有團隊；每個團隊至少一位員工；每個部門至少一個團隊）
const COMPANY_DB = {
  EMPLOYEE: [['ID', 'ENAME', 'SEX', 'TEAMID', 'SALARY'], [
    [1, 'Ada', 'F', 1, 30000], [2, 'Ben', 'M', 1, 22000], [3, 'Clem', 'F', 2, 26000], [4, 'Dio', 'M', 2, 35000],
    [5, 'Eva', 'F', 2, 18000], [6, 'Finn', 'M', 3, 40000], [7, 'Gabe', 'M', 4, 21000], [8, 'Hana', 'F', 3, 27000]], ['ID']],
  TEAM: [['ID', 'TNAME', 'LEADID', 'DEPID'], [[1, 'Alpha', 1, 1], [2, 'Beta', 4, 2], [3, 'Gamma', 6, 3], [4, 'Delta', 7, 2]], ['ID']],
  DEPARTMENT: [['ID', 'DNAME'], [[1, 'IT Support'], [2, 'Sales'], [3, 'IT Security']], ['ID']],
};
// 測試站 3.2（p.133–134）：數據自訂
const SHOP_DB = {
  PROD: [['PID', 'PNAME', 'STOCK', 'PRICE', 'SID'], [
    [1, 'Pen', 150, 5, 1], [2, 'Ruler', 80, 3, 1], [3, 'Pen', 200, 5.5, 2], [4, 'Eraser', 120, 2, 2], [5, 'Glue', 60, 8, 3],
    [6, 'Tape', 110, 6, 3], [7, 'Stapler', 30, 25, 4], [8, 'Pen', 140, 4.5, 5], [9, 'Folder', 90, 10, 5], [10, 'Clip', 300, 1, 4]], ['PID']],
  SHOP: [['SID', 'SNAME', 'MID', 'DIST'], [
    [1, 'Shop A', 1, 'Kowloon'], [2, 'Shop B', 2, 'Kowloon'], [3, 'Shop C', 1, 'New Territories'], [4, 'Shop D', 3, 'Hong Kong Island'], [5, 'Shop E', 1, 'Kowloon']], ['SID']],
  MANR: [['MID', 'MNAME', 'SEX'], [[1, 'Paul', 'M'], [2, 'Mary', 'F'], [3, 'Kate', 'F'], [4, 'Tom', 'M']], ['MID']],
};

module.exports = {
  id: 'a3b',
  title: '連接數據表（二）：等連接、自連接、多個數據表、CROSS JOIN',
  book: '教科書 選修A 第 3 章 p.122–134',
  key: 'A-a3b-hmac-f36c852fa1',
  theory: false,
  dbs: { club: CLUB_DB, club2: CLUB2_DB, monitor: MONITOR_DB, sc: SC_DB, fruit: FRUIT_DB, company: COMPANY_DB, shop: SHOP_DB },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '等連接與 NATURAL JOIN', pages: '教科書 p.122–125',
      learn: [
        { pts: [
          '**等連接（equi-join）**：在 `FROM` 列出多個數據表（用逗號分隔），在 `WHERE` 寫連接條件。結果與 INNER JOIN 相同。（p.124）',
          '`SELECT * FROM STUDENT, CLUB WHERE STUDENT.CID = CLUB.CID` 等於 `SELECT * FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID`。',
          '等連接是 DSE 最常見的寫法，寫法短，適合連接三個或以上的數據表。但它只能做 INNER JOIN，**不能**保留沒有配對的記錄。',
          '**NATURAL JOIN（自然連接）**：自動用兩個數據表中**名稱相同的所有欄位**連接，不寫 ON。（p.124–125）',
          'STUDENT 和 CLUB 有**兩對**同名欄位：NAME 和 CID。NATURAL JOIN 會要求兩者都相等——學生名字當然不會等於學會名稱，所以結果是空的。把 CLUB 的 NAME 改名為 CLUBNAME 後，NATURAL JOIN 才等於以 CID 連接。（p.124–125）',
        ] },
        { h: '拆解 SQL 秘技（p.122–123）' },
        { pts: [
          'SQL 可分成四部分：**欄名選擇**（SELECT）→ **從哪個表**（FROM，包括連接）→ **條件**（WHERE；HAVING 要在分組後）→ **排序／分組**（GROUP BY、ORDER BY）。',
          '先在題目圈出要顯示的欄位，找出它們來自哪些數據表，再找出連接這些數據表的外鍵碼。',
        ] },
        { code: C('SELECT a.CName, b.PName, c.Quantity, a.Address', '    FROM Customers a, Products b, Orders c', '    WHERE b.PID = c.PID AND c.CID = a.CID', '    ORDER BY c.Quantity DESC'), cap: 'p.123：三個數據表要兩個連接條件。' },
        { sim: { db: 'club', sql: 'SELECT * FROM STUDENT NATURAL JOIN CLUB' }, cap: 'p.124：STUDENT 和 CLUB 都有 NAME 和 CID。猜猜結果有多少行？再試改成等連接 `SELECT * FROM STUDENT, CLUB WHERE STUDENT.CID = CLUB.CID`。' },
      ],
      tries: [
        { id: 'a3b-s1-t1', pts: 4, src: '教科書 p.124', db: 'club', sql: 'SELECT * FROM STUDENT NATURAL JOIN CLUB',
          q: '先估：STUDENT 和 CLUB 都有欄位 NAME 和 CID。結果有多少行？', ask: 'rows', options: ['0', '6', '7', '28'],
          why: 'NATURAL JOIN 要求所有同名欄位都相等：STUDENT.NAME = CLUB.NAME（學生名字 = 學會名稱）永遠不成立，所以沒有任何記錄。' },
      ],
      practice: [
        { id: 'a3b-s1-p1', type: 'fill', pts: 1, src: '教科書 p.125', db: 'club2', sql: 'SELECT * FROM STUDENT NATURAL JOIN CLUB',
          q: '在 club2 中，CLUB 的 NAME 已改名為 CLUBNAME。以下語句的結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: '現在只有 CID 同名，NATURAL JOIN 等於以 CID 做 INNER JOIN。' },
        { id: 'a3b-s1-p2', type: 'mc', pts: 2, src: '教科書 p.124', db: 'club',
          q: '以下哪一句的結果與 `SELECT STUDENT.NAME, ROOM FROM STUDENT INNER JOIN CLUB ON STUDENT.CID = CLUB.CID` **不同**？',
          options: ['SELECT STUDENT.NAME, ROOM FROM STUDENT, CLUB WHERE STUDENT.CID = CLUB.CID', 'SELECT STUDENT.NAME, ROOM FROM STUDENT JOIN CLUB ON CLUB.CID = STUDENT.CID', 'SELECT STUDENT.NAME, ROOM FROM CLUB, STUDENT WHERE CLUB.CID = STUDENT.CID', 'SELECT STUDENT.NAME, ROOM FROM STUDENT LEFT JOIN CLUB ON STUDENT.CID = CLUB.CID'], answer: 3,
          hint: '等連接、JOIN、交換數據表次序都是 INNER JOIN；LEFT JOIN 會多了 Ben。' },
        { id: 'a3b-s1-p3', type: 'complete', pts: 2, src: '教科書 p.124', db: 'club',
          q: '用**等連接**列出每位學生的名字及其學會的負責老師。',
          template: 'SELECT STUDENT.NAME, TEACH FROM STUDENT, CLUB WHERE ［1］',
          ref: ['STUDENT.CID = CLUB.CID'],
          hint: '等連接的連接條件寫在 WHERE。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '自連接', pages: '教科書 p.125–126',
      learn: [
        { pts: [
          '**自連接（self join）**：把一個數據表與**自己**連接。要給同一個數據表**兩個不同的別名**，例如 s1、s2，DBMS 便當作兩個數據表。（p.125）',
          '表 3.9：STUDENT 的 CMSID 是班長的 SID。要列出每個學生及其班長的名字：`s1.CMSID = s2.SID`，s1 是學生，s2 是班長。（p.125）',
          '自連接也可以用等連接寫法：`FROM STUDENT s1, STUDENT s2 WHERE …`。',
          '找「分數差異小於 16」的學習夥伴：`WHERE ABS(s1.SCORE - s2.SCORE) < 16`。但結果會有**自我配對**（Ada & Ada）和**重複配對**（Ben & Clem、Clem & Ben）。（p.126）',
          '加上 `s1.SID < s2.SID`：兩人的 SID 必須不同（沒有自我配對），而每對重複的配對只有一個符合「小於」（沒有重複）。（p.126 試想想）',
          '想分數較高的學生排第一位：改用 `s1.SCORE >= s2.SCORE AND s1.SID <> s2.SID`。（p.126 試想想）',
        ] },
        { sim: { db: 'monitor', sql: C('SELECT s1.NAME, s2.NAME AS CMNAME FROM STUDENT s1', '    INNER JOIN STUDENT s2 ON s1.CMSID = s2.SID') }, cap: 'p.125：每個學生及其班長。' },
        { sim: { db: 'monitor', sql: C('SELECT s1.NAME, s1.SCORE, s2.NAME, s2.SCORE', '    FROM STUDENT s1, STUDENT s2', '    WHERE ABS(s1.SCORE - s2.SCORE) < 16') }, cap: 'p.126：先執行看 15 行結果，再加上 `AND s1.SID < s2.SID`。' },
      ],
      tries: [
        { id: 'a3b-s2-t1', pts: 4, src: '教科書 p.126', db: 'monitor',
          sql: C('SELECT s1.NAME, s1.SCORE, s2.NAME, s2.SCORE', '    FROM STUDENT s1, STUDENT s2', '    WHERE ABS(s1.SCORE - s2.SCORE) < 16 AND s1.SID < s2.SID'),
          q: '先估：結果有多少行？（提示：沒有條件 `s1.SID < s2.SID` 時有 15 行。）', ask: 'rows', options: ['4', '7', '8', '15'],
          why: '15 行中有 7 行是自我配對；餘下 8 行是 4 對重複配對，每對只留一行，所以是 4 行。' },
      ],
      practice: [
        { id: 'a3b-s2-p1', type: 'mc', pts: 2, src: '教科書 p.125', db: 'monitor', verify: true, ask: { col: 'NAME' },
          q: '以下語句輸出哪些名字？', sql: C('SELECT s1.NAME FROM STUDENT s1, STUDENT s2', "    WHERE s1.CMSID = s2.SID AND s2.NAME = 'Eva'"),
          options: ['Clem, Eva, Finn', 'Clem, Finn', 'Eva', 'Eva, Eva, Eva'], answer: 0,
          hint: '找出班長是 Eva 的學生；Eva 自己也是 3B 班的學生，她的班長就是她自己。' },
        { id: 'a3b-s2-p2', type: 'complete', pts: 2, src: '教科書 p.125', db: 'monitor',
          q: '列出每個學生的名字及其班長的分數。',
          template: 'SELECT s1.NAME, ［1］ FROM STUDENT s1, STUDENT s2 WHERE ［2］',
          ref: ['s2.SCORE', 's1.CMSID = s2.SID'],
          hint: 's2 代表班長：s1 的 CMSID 要等於 s2 的 SID。' },
        { id: 'a3b-s2-p3', type: 'mc', pts: 1, src: '教科書 p.126 試想想',
          q: '在自連接中加上條件 `s1.SID < s2.SID` 的作用是什麼？',
          options: ['只移除自我配對', '只移除重複配對', '移除自我配對和重複配對', '令分數較高的學生排在第一位'], answer: 2,
          hint: 'SID 相同時「<」不成立；兩個方向的配對只有一個方向成立。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '連接多於兩個數據表', pages: '教科書 p.127–128',
      learn: [
        { pts: [
          '學生可加入多個學會：STUDENT（SID …）、SC（SID, CID）、CLUB（CID …）。SC 是**中間的數據表**，記錄「哪個學生加入了哪個學會」。（p.127）',
          '連接三個數據表，要**兩個連接條件**：STUDENT—SC（SID）、SC—CLUB（CID）。',
          '用兩次 LEFT JOIN：`FROM STUDENT s LEFT JOIN SC ON SC.SID = s.SID LEFT JOIN CLUB c ON c.CID = SC.CID`——保留所有學生，Ben 的 CLUBNAME 是 NULL；Clem 加入了 3 個學會，所以佔 3 行。（p.127–128）',
          '用等連接：`FROM STUDENT s, SC, CLUB c WHERE SC.SID = s.SID AND c.CID = SC.CID`——等連接是 INNER JOIN，**Ben 不會出現**。（p.128）',
          '擴闊視野：`GROUP_CONCAT(c.NAME)` 配合 `GROUP BY s.SID`，可把 Clem 的三個學會合併成一格（MySQL 獨有函數）。（p.128）',
        ] },
        { er: { entities: [{ name: 'STUDENT', attrs: ['*SID', 'NAME', 'SEX', 'CLASS', 'SCORE'] }, { name: 'SC', attrs: ['*SID', '*CID'] }, { name: 'CLUB', attrs: ['*CID', 'NAME', 'ROOM', 'TEACH'] }], rels: [{ a: 'STUDENT', b: 'SC', name: '', card: '1:M' }, { a: 'CLUB', b: 'SC', name: '', card: '1:M' }] }, cap: '學生與學會是多對多關係，用中間的數據表 SC 連接。' },
        { sim: { db: 'sc', sql: C('SELECT s.SID, s.NAME, c.NAME AS CLUBNAME FROM STUDENT s', '    LEFT JOIN SC ON SC.SID = s.SID', '    LEFT JOIN CLUB c ON c.CID = SC.CID') }, cap: 'p.127–128：數一數 Clem 出現了多少次。' },
        { sim: { db: 'sc', sql: C('SELECT s.NAME, GROUP_CONCAT(c.NAME) AS CNAME FROM STUDENT s', '    LEFT JOIN SC ON SC.SID = s.SID', '    LEFT JOIN CLUB c ON c.CID = SC.CID GROUP BY s.SID') }, cap: '擴闊視野（p.128）：GROUP_CONCAT 把每組的學會名稱以逗號合併（次序可能與書中不同）。' },
        { warn: '等連接漏寫其中一個連接條件，例如只寫 `WHERE SC.SID = s.SID`，SC 的每一行便會與 CLUB 的**每一行**配對（4 倍行數），結果錯得很嚴重。N 個數據表至少要 N − 1 個連接條件。' },
      ],
      tries: [
        { id: 'a3b-s3-t1', pts: 4, src: '教科書 p.128', db: 'sc',
          sql: C('SELECT s.SID, s.NAME, c.NAME AS CLUBNAME FROM STUDENT s, SC, CLUB c', '    WHERE SC.SID = s.SID AND c.CID = SC.CID'),
          q: '先估：用等連接連接三個數據表，結果有多少行？', ask: 'rows', options: ['7', '8', '9', '28'],
          why: 'SC 有 8 行，每行都配對到一個學生和一個學會，所以是 8 行。用兩次 LEFT JOIN 則有 9 行（多了 Ben）。' },
      ],
      practice: [
        { id: 'a3b-s3-p1', type: 'fill', pts: 2, src: '自擬（p.127–128 延伸）', db: 'sc',
          sql: C('SELECT s.NAME, c.NAME FROM STUDENT s, SC, CLUB c', '    WHERE SC.SID = s.SID'),
          q: '以下等連接漏寫了 SC 與 CLUB 的連接條件。結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: 'SC 與 STUDENT 配對得 8 行，每行再與 CLUB 的 4 行全部配對。' },
        { id: 'a3b-s3-p2', type: 'complete', pts: 2, src: '教科書 p.127–128', db: 'sc',
          q: '用等連接列出所有加入了 Science Club 的學生之名字。',
          template: C('SELECT s.NAME FROM STUDENT s, SC, CLUB c', "    WHERE SC.SID = s.SID AND ［1］ AND ［2］ = 'Science Club'"),
          ref: ['c.CID = SC.CID', 'c.NAME'],
          hint: '要再寫 SC 與 CLUB 的連接條件；學會名稱是 c.NAME。' },
        { id: 'a3b-s3-p3', type: 'mc', pts: 1, src: '教科書 p.128', db: 'sc', verify: true, ask: 'table',
          q: '以下語句的結果是什麼？', sql: C('SELECT s.NAME, COUNT(SC.CID) FROM STUDENT s', "    LEFT JOIN SC ON SC.SID = s.SID", "    WHERE s.CLASS = '3A' GROUP BY s.SID"),
          options: ['Ada, 1\nBen, 0', 'Ada, 1\nBen, 1', 'Ada, 1', 'Ada, 1\nBen, NULL'], answer: 0,
          hint: 'Ben 沒有加入學會，LEFT JOIN 後 SC.CID 是 NULL，COUNT(SC.CID) 得 0。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: 'CROSS JOIN', pages: '教科書 p.129–130',
      learn: [
        { pts: [
          '**CROSS JOIN（交叉連接）**：不用外鍵碼，把左方數據表的**每一行**與右方數據表的**每一行**配對。（p.129）',
          '結果行數 = 左方行數 × 右方行數。L（3 行）CROSS JOIN R（3 行）得 9 行。',
          '實際用途（p.129–130）：3 個買家（各要若干蘋果 NA、橙 NO）× 3 個賣家（蘋果價 PA、橙價 PO）——列出每個買家向每個賣家購買的總價 `PA*NA+PO*NO AS COST`，再 `ORDER BY BNAME, COST`，每個買家的第一行就是最便宜的賣家。',
          '略去 CROSS JOIN 關鍵字也可以：`FROM BUYER, SELLER`（沒有 WHERE 連接條件）就是 CROSS JOIN。（p.130）',
          '所以等連接漏寫連接條件，其實就變成了 CROSS JOIN。',
        ] },
        { sim: { db: 'fruit', sql: C('SELECT BNAME, SNAME, PA*NA+PO*NO AS COST FROM BUYER', '    CROSS JOIN SELLER ORDER BY BNAME, COST') }, cap: 'p.130：找出每個買家應向哪位賣家購買。' },
      ],
      tries: [
        { id: 'a3b-s4-t1', pts: 4, src: '教科書 p.130', db: 'fruit',
          sql: C('SELECT BNAME, SNAME, PA*NA+PO*NO AS COST FROM BUYER', '    CROSS JOIN SELLER ORDER BY BNAME, COST'),
          q: '先估：Ben（9 個蘋果、6 個橙）應向哪位賣家購買？即結果第 4 行的 SNAME。', ask: { cell: [3, 'SNAME'] }, options: ['Dio', 'Eva', 'Finn', 'Ben'],
          why: 'Dio：9 × 13.1 + 6 × 12.0 = 189.9；Eva：9 × 11.2 + 6 × 13.8 = 183.6；Finn：9 × 14.0 + 6 × 11.4 = 194.4。Eva 最便宜。' },
      ],
      practice: [
        { id: 'a3b-s4-p1', type: 'fill', pts: 2, src: '教科書 p.129', db: 'fruit', sql: 'SELECT * FROM BUYER, SELLER',
          q: 'BUYER 有 3 行，SELLER 有 3 行。以下語句的結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: '沒有連接條件 = CROSS JOIN。' },
        { id: 'a3b-s4-p2', type: 'mc', pts: 1, src: '教科書 p.130', db: 'fruit', verify: true, ask: { cell: [0, 'COST'] },
          q: 'Clem 向 Finn 購買的總價是多少？', sql: "SELECT PA*NA+PO*NO AS COST FROM BUYER CROSS JOIN SELLER WHERE BNAME = 'Clem' AND SNAME = 'Finn'",
          options: ['163.8', '162.6', '163.4', '177.6'], answer: 0,
          hint: '6 × 14.0 + 7 × 11.4。' },
        { id: 'a3b-s4-p3', type: 'complete', pts: 2, src: '教科書 p.130', db: 'fruit',
          q: '只列出 Ada 向每位賣家購買的總價（欄位名稱 COST），由最便宜排到最貴。',
          template: C('SELECT SNAME, PA*NA+PO*NO AS COST FROM BUYER, SELLER', "    WHERE BNAME = 'Ada' ORDER BY ［1］"),
          ref: ['COST'], check: { order: true },
          hint: '可以用欄位的別名排序，遞升是預設次序。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '綜合：三個數據表', pages: '教科書 p.131–134（例題 3.2、測試站 3.2）',
      learn: [
        { pts: [
          '例題 3.2：EMPLOYEE（ID, ENAME, SEX, TEAMID, SALARY）、TEAM（ID, TNAME, LEADID, DEPID）、DEPARTMENT（ID, DNAME）。每位員工都有團隊、每個團隊至少一位員工、每個部門至少一個團隊——所以用 INNER JOIN／等連接不會缺少數據。（p.131–132）',
          '三個數據表都有 ID，要用別名：`FROM EMPLOYEE e, TEAM t, DEPARTMENT d WHERE TEAMID = t.ID AND DEPID = d.ID`。',
          '(b) 按團隊點算人數：`GROUP BY t.ID`。(d) 部門名稱以「IT」開首：`DNAME LIKE \'IT%\'`，按部門分組，`ORDER BY SUM(SALARY) DESC`。(e) 按部門**和**性別分組：`GROUP BY d.ID, SEX`。（p.133）',
          '(c) 同一個數據表 EMPLOYEE 要用兩次（團隊成員 e、團隊負責人 l）：`FROM EMPLOYEE e, TEAM t, EMPLOYEE l WHERE e.TEAMID = t.ID AND LEADID = l.ID`。（p.132–133）',
        ] },
        { sim: { db: 'company', sql: C('SELECT DNAME, TNAME, COUNT(*) FROM DEPARTMENT d, TEAM t, EMPLOYEE e', '    WHERE d.ID = DEPID AND TEAMID = t.ID', '    GROUP BY d.ID, t.ID ORDER BY t.ID') }, cap: '例題 3.2(b)（p.133）：每個部門的名稱、團隊名稱和人數。書中答案只寫 `GROUP BY t.ID`（MySQL 8 接受）；本平台的模擬器較嚴格，要把 d.ID 也寫進 GROUP BY。' },
        { sim: { db: 'shop', sql: C("SELECT COUNT(PID) FROM PROD p, SHOP s, MANR m", "    WHERE p.SID = s.SID AND s.MID = m.MID AND SEX = 'F'") }, cap: '測試站 3.2(a)（p.134）：由女經理管理的店舖所售產品的數量。' },
      ],
      tries: [
        { id: 'a3b-s5-t1', pts: 4, src: '教科書 p.133 例題 3.2(d)', db: 'company',
          sql: C('SELECT DNAME, SUM(SALARY) FROM DEPARTMENT d, TEAM t, EMPLOYEE e', "    WHERE d.ID = DEPID AND TEAMID = t.ID AND DNAME LIKE 'IT%'", '    GROUP BY d.ID ORDER BY SUM(SALARY) DESC'),
          q: '先估：結果是什麼？', ask: 'table',
          options: ['IT Security, 67000\nIT Support, 52000', 'IT Support, 52000\nIT Security, 67000', 'IT Security, 67000\nSales, 100000\nIT Support, 52000', 'IT Security, 40000\nIT Support, 30000'],
          why: 'IT Support 有 Alpha（Ada 30000、Ben 22000）= 52000；IT Security 有 Gamma（Finn 40000、Hana 27000）= 67000。按總和遞降排序。' },
      ],
      practice: [
        { id: 'a3b-s5-p1', type: 'complete', pts: 2, src: '教科書 p.133 例題 3.2(c)', db: 'company',
          q: '列出每位員工的名字及其所屬團隊的負責人名字（別名 LNAME），按員工的識別碼遞升排序。',
          template: C('SELECT e.ENAME, l.ENAME AS LNAME FROM EMPLOYEE e, TEAM t, EMPLOYEE l', '    WHERE ［1］ AND ［2］ ORDER BY e.ID'),
          ref: ['e.TEAMID = t.ID', 'LEADID = l.ID'], check: { order: true },
          hint: 'e 是團隊成員：e 的 TEAMID 連到 TEAM；TEAM 的 LEADID 連到負責人 l。' },
        { id: 'a3b-s5-p2', type: 'fill', pts: 2, src: '教科書 p.134 測試站 3.2(c)', db: 'shop',
          sql: C("SELECT DIST, AVG(PRICE) FROM PROD p, SHOP s, MANR m", "    WHERE p.SID = s.SID AND s.MID = m.MID AND MNAME = 'Paul' GROUP BY DIST ORDER BY DIST"),
          q: '計算在各地區中，由經理 Paul 管理的店舖所售產品之平均單價。寫出結果的行數及 Kowloon 的平均單價。',
          blanks: [{ label: '行數', ask: 'rows' }, { label: 'Kowloon 的平均單價', ask: { cell: [0, 'AVG(PRICE)'] } }],
          hint: 'Paul 管理 Shop A（Kowloon）、Shop C（New Territories）、Shop E（Kowloon）。Kowloon：5、3、4.5、10 的平均。' },
        { id: 'a3b-s5-p3', type: 'mc', pts: 1, src: '教科書 p.132 例題 3.2 分析',
          q: '例題 3.2 為什麼可以放心用等連接，而不用 LEFT JOIN？',
          options: ['等連接比 LEFT JOIN 快', '每位員工都有團隊、每個團隊都有員工、每個部門都有團隊，沒有記錄會因找不到配對而消失', '三個數據表都有欄位 ID', 'LEFT JOIN 不能連接三個數據表'], answer: 1,
          hint: '等連接 = INNER JOIN，只會失去沒有配對的記錄。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL', pages: '教科書 p.125–134',
      intro: '在編輯器寫一句 SELECT 語句，可以先按 ▶ 執行自己檢查，再按「提交評核」。評核時會用另外幾組數據測試，所以不可以把答案「寫死」。',
      tasks: [
        { id: 'a3b-w1', pts: 10, title: '學生與班長', src: '教科書 p.125 表 3.9', db: 'monitor',
          q: '列出每個學生的名字、班別，以及其班長的名字（欄位名稱改為 `CMNAME`）。只列出**不是**班長本人的學生。',
          starter: 'SELECT NAME, CLASS FROM STUDENT',
          ref: C('SELECT s1.NAME, s1.CLASS, s2.NAME AS CMNAME FROM STUDENT s1, STUDENT s2', '    WHERE s1.CMSID = s2.SID AND s1.SID <> s2.SID'),
          hint: '自連接：`FROM STUDENT s1, STUDENT s2 WHERE s1.CMSID = s2.SID`。學生不是班長本人，即 s1 的 SID 與 s2 的 SID 不同。' },
        { id: 'a3b-w2', pts: 12, title: '部門、團隊與平均薪金', src: '教科書 p.131–133 例題 3.2(b)', db: 'company',
          q: '列出每個部門的名稱 DNAME、團隊名稱 TNAME 及該團隊的平均薪金，按團隊識別碼遞升排序。',
          starter: 'SELECT DNAME FROM DEPARTMENT',
          ref: C('SELECT DNAME, TNAME, AVG(SALARY) FROM DEPARTMENT d, TEAM t, EMPLOYEE e', '    WHERE d.ID = DEPID AND TEAMID = t.ID', '    GROUP BY d.ID, t.ID ORDER BY t.ID'),
          check: { order: true },
          rules: [{ must: 'GROUP BY', msg: '要按團隊分組。' }],
          hint: '三個數據表要兩個連接條件：`d.ID = DEPID`、`TEAMID = t.ID`；`GROUP BY d.ID, t.ID ORDER BY t.ID`（DNAME 來自 DEPARTMENT，所以 d.ID 也要寫進 GROUP BY）。' },
        { id: 'a3b-w3', pts: 13, title: '經理的庫存總和', src: '教科書 p.134 測試站 3.2(b)', db: 'shop',
          q: '列出各經理所管理的店舖裏所有產品的庫存數量總和。結果顯示經理名字 MNAME 及總和，按經理名字的字母順序排序。（沒有店舖的經理不用列出。）',
          starter: 'SELECT MNAME FROM MANR ORDER BY MNAME',
          ref: C('SELECT MNAME, SUM(STOCK) FROM PROD p, SHOP s, MANR m', '    WHERE p.SID = s.SID AND s.MID = m.MID', '    GROUP BY m.MID ORDER BY MNAME'),
          check: { order: true },
          rules: [{ must: 'SUM(', msg: '要用 SUM() 計算庫存總和。' }],
          hint: 'PROD—SHOP 用 SID 連接，SHOP—MANR 用 MID 連接；`GROUP BY m.MID ORDER BY MNAME`。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.122–134',
      items: [
        { id: 'a3b-q1', pts: 4, src: '教科書 p.129（DSE 題型）', tags: [{ t: 'trap', why: '漏寫連接條件，等連接變成 CROSS JOIN' }],
          q: '數據表 P 有 5 行，Q 有 4 行。`SELECT * FROM P, Q` 的結果有多少行？',
          options: ['4', '5', '9', '20'], answer: 'D',
          why: '沒有連接條件即 CROSS JOIN：5 × 4 = 20 行。' },
        { id: 'a3b-q2', pts: 4, src: '教科書 p.124–125', db: 'club2', verify: true, ask: 'rows',
          q: 'club2 的 CLUB 欄位是 CID, CLUBNAME, ROOM, TEACH。以下語句的結果有多少行？', sql: "SELECT NAME, CLUBNAME FROM STUDENT NATURAL JOIN CLUB WHERE TEACH = 'Mr Wong'",
          options: ['0', '1', '3', '7'], answer: 'C',
          why: '現在只有 CID 同名，NATURAL JOIN 等於以 CID 連接；Mr Wong 負責 Science Club，有 Eva、Gabe、Dio。' },
        { id: 'a3b-q3', pts: 4, src: '教科書 p.126', tags: [HOT_JOIN], db: 'monitor', verify: true, ask: 'rows',
          q: '以下語句列出同班同學的配對。結果有多少行？', sql: C('SELECT s1.NAME, s2.NAME FROM STUDENT s1, STUDENT s2', '    WHERE s1.CLASS = s2.CLASS AND s1.SID < s2.SID'),
          options: ['3', '5', '10', '17'], answer: 'B',
          why: '3A：Ada–Ben（1 對）；3B：Clem、Eva、Finn（3 對）；3C：Gabe–Dio（1 對）。共 5 對。' },
        { id: 'a3b-q4', pts: 4, src: '教科書 p.127–128', tags: [HOT_JOIN],
          q: 'STUDENT（SID, NAME）、SC（SID, CID）、CLUB（CID, NAME）。要列出**所有**學生的名字及其學會名稱（沒有學會的學生也要列出）。以下哪一句正確？',
          options: ['SELECT s.NAME, c.NAME FROM STUDENT s, SC, CLUB c WHERE s.SID = SC.SID AND SC.CID = c.CID', 'SELECT s.NAME, c.NAME FROM STUDENT s LEFT JOIN SC ON s.SID = SC.SID LEFT JOIN CLUB c ON SC.CID = c.CID', 'SELECT s.NAME, c.NAME FROM STUDENT s LEFT JOIN CLUB c ON s.SID = c.CID', 'SELECT s.NAME, c.NAME FROM STUDENT s NATURAL JOIN SC NATURAL JOIN CLUB c'], answer: 'B',
          why: 'A 是 INNER JOIN，沒有學會的學生會消失；C 的連接條件錯誤；D 中 STUDENT 與 CLUB 都有 NAME，NATURAL JOIN 會把 NAME 也當作連接欄位。' },
        { id: 'a3b-q5', pts: 4, src: '教科書 p.133 例題 3.2(e)', db: 'company', verify: true, ask: 'rows',
          q: '以下語句的結果有多少行？', sql: C('SELECT DNAME, SEX, AVG(SALARY) FROM DEPARTMENT d, TEAM t, EMPLOYEE e', '    WHERE d.ID = DEPID AND TEAMID = t.ID', '    GROUP BY d.ID, SEX ORDER BY DNAME, SEX'),
          options: ['3', '5', '6', '8'], answer: 'C',
          why: '按「部門 + 性別」分組：IT Security（F、M）、IT Support（F、M）、Sales（F、M），共 6 組。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlJoin', 'sqlWhere'], intro: '隨機生成連接結果行數及篩選題目，答案由 SQL 引擎計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
