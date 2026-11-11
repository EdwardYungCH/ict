/* 單元 a3d：合併結果、檢視及索引——UNION、UNION ALL、INTERSECT、EXCEPT（MINUS）、多個集合運算符、
 * 從結果中選取數據、CREATE VIEW／CREATE OR REPLACE VIEW／DROP VIEW、索引與 CREATE INDEX
 * 教科書 選修A 第 3 章 p.158–190（另課文總結 p.191–195）
 * 所有答案在 build 時由 SQL 引擎計算／核對。例題 3.4、3.5 及測試站 3.4、3.5 只有欄位結構，數據由本單元自訂。
 * 模擬器不執行 CREATE VIEW：檢視以「FROM (SELECT …) 檢視名」（從結果中選取數據，p.165）模擬，結果相同。
 *
 * 教科書疑似錯誤：p.163 及 p.193「UNION 會傳回所有列，但會移除同時存在於兩個結果中的列」——UNION 只移除**重複**的列，重複的列仍保留一行（例如 p.158 的 03517 出現一次），並非全部移除。
 * 教科書疑似錯誤：p.165「被排除的列」表頭印作「STUDENTIDID」，應為「STUDENTID」。
 * 教科書疑似錯誤：p.161 兩個被合併的數據表均標示為「CITY2」。
 * 教科書疑似錯誤：p.173、p.180 SC 與 CLUB 的連接表中 03506 一行 CID 3 印作 Debate Club，按 CLUB 應為 English Club。
 * 教科書疑似錯誤：p.174 SQL 結果印作「HANS」「CLEM」（大寫），數據表中是 Hans、Clem；同頁 LIMIT 例子的結果欄名印作 MAX(TOTAL)，應為 TOTAL。
 * 教科書疑似錯誤：p.179 標題及正文寫「CREATE VIEW OR REPLACE VIEW」，正確語法是 `CREATE OR REPLACE VIEW`；同頁「記得要將 COUNT(*) 改為 COUNT(ID)」——語句用的是 COUNT(CID)，應為 COUNT(CID)。
 * 教科書疑似錯誤：p.184 提示「1024 項記錄最多只須進行 10 次檢查」——對分檢索最多要 ⌊log₂1024⌋ + 1 = 11 次（同頁 11 項記錄最多 4 次 = ⌊log₂11⌋ + 1，才是正確算法）（同選C-24）。本單元 s5-p3 以 11 次為答案。
 * 教科書疑似錯誤：p.195 `DROP INDEX ENAMEIDX` 在 MySQL 須寫成 `DROP INDEX ENAMEIDX ON EMPLOYEE`（或 p.185 的 `ALTER TABLE … DROP INDEX …`）。
 * 教科書疑似錯誤：p.194 課文總結 CREATE OR REPLACE VIEW 的例子以 `CREATE VIEW` 開頭——修改現存的 TASKCOUNT 會出錯（檢視已存在）。
 * 教科書疑似錯誤：p.186 ROOM 的 ID 說明寫「病人的識別碼」，應為「病房的識別碼」。
 * 教科書疑似錯誤：p.187–188 例題 3.5(e)(f) 題目要求「列出每種性別／每間病房中 BMI 最低／最高的病人」，答案 `SELECT SEX, MIN(BMI) … GROUP BY SEX` 只列出 BMI 數值，沒有列出是哪位病人（要用子查詢才可列出病人名字）。
 * 備註：p.189 測試站 3.5(b) 答案 `SELECT MNAME, SUM(TPRICE) FROM FORDER2 … GROUP BY MID`：本平台模擬器（ONLY_FULL_GROUP_BY）要求寫成 `GROUP BY MID, MNAME`。
 */
const C = (...ls) => ls.join('\n');
const HOT_SET = { t: 'hot', why: 'DSE 卷二A 以 UNION／INTERSECT／EXCEPT（MINUS）合併兩個數據表的結果' };

// p.158
const UNION_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE'], [
    ['03493', 'Ada', 'F', '3A', 0], ['03496', 'Clem', 'F', '3B', 89], ['03505', 'Eva', 'F', '3B', 83], ['03506', 'Gabe', 'M', '3C', 47],
    ['03510', 'Finn', 'M', '3B', 35], ['03513', 'Dio', 'M', '3C', 67], ['03517', 'Ben', 'M', '3A', 86]], ['SID']],
  STUDENT2: [['STUDENTID', 'NAME', 'SEX', 'CLASS', 'DOB'], [
    ['03517', 'Benz', 'M', '3A', '2015-05-12'], ['03518', 'Xing', 'M', '3A', '2015-05-01'], ['03519', 'Yen', 'F', '3B', '2015-01-05'], ['03520', 'Zack', 'M', '3D', '2015-02-15']], ['STUDENTID']],
  S1: [['SID'], [[4], [5], [8], [2], [1]], ['SID']],
  S2: [['SID'], [[1], [8], [0], [3], [7]], ['SID']],
  S3: [['SID'], [[2], [6], [7], [9], [8]], ['SID']],
};
// 例題 3.4（p.166–168）：數據自訂（Hugo 未決定參加哪個項目）
const SPORTS_DB = {
  PARTICIPANT: [['ID', 'NAME', 'GENDER', 'AGE'], [[1, 'Amy', 'F', 21], [2, 'Bob', 'M', 23], [3, 'Cara', 'F', 24], [4, 'Dan', 'M', 19], [5, 'Ella', 'F', 22], [6, 'Fred', 'M', 25], [7, 'Gigi', 'F', 22], [8, 'Hugo', 'M', 30]], ['ID']],
  FOOTBALL: [['ID', 'PID', 'BIB', 'TEAM'], [[1, 1, 7, 'A'], [2, 2, 10, 'A'], [3, 3, 9, 'B'], [4, 5, 11, 'B'], [5, 6, 5, 'A']], ['ID']],
  RELAYRACE: [['ID', 'PID', 'BIB', 'TEAM'], [[1, 2, 3, 'B'], [2, 3, 7, 'A'], [3, 4, 9, 'A'], [4, 6, 2, 'B'], [5, 7, 4, 'A']], ['ID']],
};
// 測試站 3.4（p.168–169）：數據自訂（9780006、9780007 未有儲存於 BOOK）
const BOOKS_DB = {
  BOOK: [['ISBN', 'BNAME', 'AUTHOR', 'PAGE'], [
    ['9780001', 'Data Stories', 'Lee', 320], ['9780002', 'SQL Basics', 'Chan', 180], ['9780003', 'Cat Tales', 'Wong', 410], ['9780004', 'Hong Kong Walks', 'Ho', 250], ['9780005', 'Night Sky', 'Lam', 300]], ['ISBN']],
  HBS: [['HBID', 'ISBN', 'STOCK', 'PRICE'], [[1, '9780001', 5, 120], [2, '9780002', 8, 88], [3, '9780003', 2, 150], [4, '9780006', 4, 60]], ['HBID']],
  WBS: [['WBID', 'ISBN', 'STOCK', 'PRICE'], [[1, '9780001', 3, 110], [2, '9780003', 6, 150], [3, '9780004', 10, 95], [4, '9780005', 2, 99], [5, '9780007', 1, 45]], ['WBID']],
};
// 表 3.18–3.21（p.171）
const VIEW_DB = {
  STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'SCORE1', 'SCORE2'], [
    ['03369', 'Hans', 'M', '3C', 82, 67], ['03405', 'Ivy', 'F', '3A', 65, 56], ['03410', 'Jean', 'F', '3B', 74, 65], ['03493', 'Ada', 'F', '3A', 0, 81],
    ['03496', 'Clem', 'F', '3B', 71, 87], ['03505', 'Eva', 'F', '3B', 62, 75], ['03506', 'Gabe', 'M', '3C', 66, 59], ['03510', 'Finn', 'M', '3B', 43, 71],
    ['03513', 'Dio', 'M', '3C', 64, 45], ['03517', 'Ben', 'M', '3A', 88, 74]], ['SID']],
  SC: [['SID', 'CID'], [
    ['03369', 2], ['03369', 3], ['03369', 5], ['03369', 6], ['03405', 1], ['03405', 4], ['03410', 2], ['03410', 6], ['03493', 2], ['03493', 3], ['03496', 1],
    ['03496', 3], ['03496', 4], ['03496', 6], ['03505', 4], ['03505', 6], ['03506', 3], ['03506', 4], ['03506', 5], ['03510', 1], ['03517', 3]], ['SID', 'CID']],
  CLUB: [['CID', 'NAME'], [[1, 'Chess Club'], [2, 'Art Club'], [3, 'English Club'], [4, 'Science Club'], [5, 'Economy Club'], [6, 'Debate Club']], ['CID']],
  CLASS: [['CLASS', 'TEACH', 'LANG'], [['3A', 'Mr Chan', 'Chinese'], ['3B', 'Mrs Lee', 'Chinese'], ['3C', 'Mr Suen', 'English']], ['CLASS']],
};
// 例題 3.5（p.186–188）：數據自訂（B02 沒有病人；Hon 未獲分派病房）
const HOSPITAL_DB = {
  PATIENT: [['ID', 'PNAME', 'SEX', 'WEIGHT', 'HEIGHT', 'RID'], [
    [1, 'Amy', 'F', 50, 1.6, 1], [2, 'Bob', 'M', 80, 1.75, 1], [3, 'Cat', 'F', 65, 1.55, 2], [4, 'Don', 'M', 70, 1.8, 2],
    [5, 'Eve', 'F', 45, 1.65, 3], [6, 'Fai', 'M', 90, 1.7, 3], [7, 'Gus', 'M', 60, 1.68, 3], [8, 'Hon', 'M', 75, 1.72, null]], ['ID']],
  ROOM: [['ID', 'RNAME', 'CAPACITY'], [[1, 'A01', 2], [2, 'A02', 4], [3, 'B01', 3], [4, 'B02', 2]], ['ID']],
};
// 測試站 3.5（p.188–190）：數據自訂（PAID：1 = 已付款，0 = 未付款）
const FOOD_DB = {
  CUSTOMER: [['CID', 'CNAME', 'SEX', 'DEPOSIT'], [['C1', 'Ann', 'F', 100], ['C2', 'Ken', 'M', 50], ['C3', 'May', 'F', 20], ['C4', 'Sam', 'M', 0]], ['CID']],
  MEAL: [['MID', 'MNAME', 'OPRICE', 'DISCOUNT'], [['M1', 'Fried Rice', 50, 0.1], ['M2', 'Noodles', 40, 0], ['M3', 'Pizza', 120, 0.25]], ['MID']],
  FORDER: [['CID', 'MID', 'NUM', 'ETA', 'PAID'], [
    ['C1', 'M1', 2, '2025-01-20', 1], ['C1', 'M3', 1, '2025-01-26', 0], ['C2', 'M2', 1, '2025-01-24', 0],
    ['C2', 'M1', 1, '2025-01-27', 0], ['C3', 'M3', 1, '2025-01-22', 0], ['C3', 'M2', 2, '2025-01-25', 1]], ['CID', 'MID', 'ETA']],
};

const SCORESHEET = '(SELECT s.SID, NAME, SEX, s.CLASS, TEACH, LANG, SCORE1*0.4+SCORE2*0.6 AS FSCORE\n      FROM STUDENT s, CLASS cl WHERE s.CLASS = cl.CLASS) SCORESHEET';
const COUNTCLUB_OLD = '(SELECT SID, COUNT(*) AS CLUBNUM FROM SC GROUP BY SID) COUNTCLUB';
const RPNUM = '(SELECT r.ID, RNAME, CAPACITY, COUNT(p.ID) AS PNUM FROM ROOM r\n      LEFT JOIN PATIENT p ON r.ID = RID GROUP BY r.ID) RPNUM';

module.exports = {
  id: 'a3d',
  title: '合併結果、檢視及索引',
  book: '教科書 選修A 第 3 章 p.158–190',
  key: 'A-a3d-hmac-902ca35d23',
  theory: false,
  dbs: { union: UNION_DB, sports: SPORTS_DB, books: BOOKS_DB, view: VIEW_DB, hospital: HOSPITAL_DB, food: FOOD_DB },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: 'UNION 與 UNION ALL', pages: '教科書 p.158–162',
      learn: [
        { pts: [
          '**集合運算符**把兩個 SELECT 的**結果**合併成一個結果。（p.158）',
          '**UNION**：兩個結果的所有列，**重複的列只保留一次**（如同 DISTINCT）。`SELECT SID FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2`：03517 在兩個數據表都有，只出現一次，共 10 行。（p.158）',
          '只有**完全一致**的列才算重複：同時選擇 SID 和 NAME 時，03517 Ben 和 03517 Benz 不同，兩行都保留。（p.159）',
          '兩個結果的**欄位數目**要相同，欄名不必相同；結果用**第一個** SELECT 的欄名。但數據類型不同（DOB 與 STUDENTID）合併起來毫無意義。（p.159）',
          '每個 SELECT 有自己的 WHERE，**不會共用**。（p.160）',
          '**ORDER BY 只可放在最後**，排序整個合併結果，並要用**第一個**結果的欄名（`ORDER BY SID`，不是 `ORDER BY STUDENTID`）。（p.160–161）',
          '**UNION ALL**：保留重複的列（03517 出現兩次）。想知道某個值出現的次數時使用；不用比較重複，效能較好。（p.162）',
          '**連接 vs 合併**：連接是「橫向」把相關的數據配對（例如城市配國家，欄位增加）；合併是「縱向」把同類數據疊起來（兩個城市表變一個，行數增加）。（p.161）',
        ] },
        { sim: { db: 'union', sql: 'SELECT SID, NAME FROM STUDENT UNION SELECT STUDENTID, NAME FROM STUDENT2' }, cap: 'p.159：數一數 03517 出現多少次。再試把 UNION 改成 UNION ALL，或只選 SID。' },
        { fix: { bad: C("SELECT SID FROM STUDENT WHERE CLASS = '3A' ORDER BY SID", 'UNION', "SELECT STUDENTID FROM STUDENT2 WHERE CLASS = '3B' ORDER BY STUDENTID"), good: C("SELECT SID FROM STUDENT WHERE CLASS = '3A'", 'UNION', "SELECT STUDENTID FROM STUDENT2 WHERE CLASS = '3B'", 'ORDER BY SID'), why: 'ORDER BY 只可在整句最後出現一次，並用第一個 SELECT 的欄名。（p.160–161）' } },
      ],
      tries: [
        { id: 'a3d-s1-t1', pts: 4, src: '教科書 p.160', db: 'union', sql: "SELECT SID FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2 WHERE CLASS = '3B'",
          q: '先估：結果有多少行？', ask: 'rows', options: ['8', '1', '10', '11'],
          why: 'WHERE 只屬於第二個 SELECT：STUDENT 的 7 個 SID 全部保留，STUDENT2 只加入 3B 班的 03519，共 8 行。' },
      ],
      practice: [
        { id: 'a3d-s1-p1', type: 'fill', pts: 2, src: '教科書 p.158、p.162', db: 'union', sql: 'SELECT SID FROM STUDENT UNION ALL SELECT STUDENTID FROM STUDENT2',
          q: '用 UNION ALL 合併兩個數據表的學生識別碼。結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: '7 + 4，不移除重複。（用 UNION 則是 10 行。）' },
        { id: 'a3d-s1-p2', type: 'mc', pts: 1, src: '教科書 p.160–161', db: 'union',
          q: '以下哪一句**可以**正確執行？',
          options: ['SELECT SID FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2 ORDER BY STUDENTID', 'SELECT SID FROM STUDENT ORDER BY SID UNION SELECT STUDENTID FROM STUDENT2', 'SELECT SID FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2 ORDER BY SID', 'SELECT SID, NAME FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2'], answer: 2,
          hint: 'ORDER BY 放在最後並用第一個結果的欄名；兩邊的欄位數目要相同。' },
        { id: 'a3d-s1-p3', type: 'complete', pts: 2, src: '教科書 p.160', db: 'union',
          q: '列出 STUDENT 中 3A 班和 STUDENT2 中 3A 班學生的名字（重複的名字只列一次），按名字排序。',
          template: C("SELECT NAME FROM STUDENT WHERE CLASS = '3A'", "［1］ SELECT NAME FROM STUDENT2 ［2］", 'ORDER BY NAME'),
          ref: ['UNION', "WHERE CLASS = '3A'"], check: { order: true },
          hint: '每個 SELECT 要有自己的 WHERE。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: 'INTERSECT 與 EXCEPT；從結果中選取數據', pages: '教科書 p.163–165',
      learn: [
        { pts: [
          '**INTERSECT**：只傳回**同時存在於兩個結果**中的列。`SELECT SID FROM STUDENT INTERSECT SELECT STUDENTID FROM STUDENT2` 得 03517。（p.163）',
          '同時選擇 SID 和 NAME：Ben ≠ Benz，所以 INTERSECT 沒有結果（Empty set）。（p.163）',
          '**EXCEPT**（DSE 及部分 DBMS 寫作 **MINUS**）：第一個結果的列，**排除**同樣存在於第二個結果的列。（p.164）',
          '同時選擇 SID 和 NAME 時，03517 Ben 與 03517 Benz 不一致，所以**不會**被排除。（p.164–165）',
          '一句 SQL 可用多個集合運算符，例如三個 INTERSECT 找出 S1、S2、S3 都有的 SID（8）。INTERSECT 比 UNION／EXCEPT 先計算；UNION 與 EXCEPT 由左至右計算。（p.165）',
          '**從結果中選取數據**：給結果一個**別名**，便可當作數據表使用：`SELECT COUNT(*) FROM (SELECT SID FROM STUDENT UNION SELECT STUDENTID FROM STUDENT2) u` 得 10。（p.165 擴闊視野）',
          '`SELECT COUNT(SID) FROM STUDENT UNION SELECT COUNT(STUDENTID) FROM STUDENT2` 卻只是把 7 和 4 疊在一起，不是不同學生的人數。（p.165）',
        ] },
        { table: { head: ['運算符', '文氏圖', 'STUDENT 與 STUDENT2 的 SID'], rows: [['A UNION B', 'A ∪ B', '10 個'], ['A UNION ALL B', 'A + B（保留重複）', '11 個'], ['A INTERSECT B', 'A ∩ B', '03517'], ['A EXCEPT B（MINUS）', 'A − B', '6 個（不包括 03517）']] }, cap: '四個集合運算符（p.158–164）' },
        { sim: { db: 'union', sql: 'SELECT SID FROM S1 INTERSECT SELECT SID FROM S2 INTERSECT SELECT SID FROM S3' }, cap: 'p.165：S1 = {4, 5, 8, 2, 1}、S2 = {1, 8, 0, 3, 7}、S3 = {2, 6, 7, 9, 8}。試把運算符改成 UNION、EXCEPT。' },
      ],
      tries: [
        { id: 'a3d-s2-t1', pts: 4, src: '教科書 p.165（延伸）', db: 'union', sql: 'SELECT SID FROM S1 EXCEPT SELECT SID FROM S2 EXCEPT SELECT SID FROM S3',
          q: '先估：輸出哪些 SID？', ask: { col: 'SID' }, options: ['4, 5', '4, 5, 2', '4, 5, 8', '0, 3'],
          why: 'S1 − S2 = {4, 5, 2}（除去 8、1）；再減 S3 = {4, 5}（除去 2）。即只屬於 S1 的數字。' },
      ],
      practice: [
        { id: 'a3d-s2-p1', type: 'mc', pts: 2, src: '教科書 p.164–165', db: 'union', verify: true, ask: 'rows',
          q: '以下語句的結果有多少行？', sql: 'SELECT SID, NAME FROM STUDENT EXCEPT SELECT STUDENTID, NAME FROM STUDENT2',
          options: ['6', '7', '3', '0'], answer: 1,
          hint: '只有完全一致的列才會被排除：(03517, Ben) 與 (03517, Benz) 不同。' },
        { id: 'a3d-s2-p2', type: 'complete', pts: 2, src: '教科書 p.165 擴闊視野', db: 'union',
          q: '點算在 STUDENT 和 STUDENT2 中擁有獨一無二的識別碼的學生人數（結果是 10）。',
          template: 'SELECT COUNT(*) FROM (SELECT SID FROM STUDENT ［1］ SELECT STUDENTID FROM STUDENT2) ［2］',
          ref: ['UNION', 'u'],
          hint: '先用 UNION 移除重複，再給結果一個別名，當作數據表點算。' },
        { id: 'a3d-s2-p3', type: 'mc', pts: 1, src: '教科書 p.165', db: 'union', verify: true, ask: { col: 'SID' },
          q: '以下語句輸出哪些 SID？', sql: 'SELECT SID FROM S1 INTERSECT SELECT SID FROM S3',
          options: ['8, 2', '8', '2, 6, 7, 9, 8', '4, 5, 1'], answer: 0,
          hint: '同時在 S1 和 S3 的數字；結果按 S1 的次序列出。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '綜合：集合運算的應用', pages: '教科書 p.166–169（例題 3.4、測試站 3.4）',
      learn: [
        { pts: [
          '例題 3.4：PARTICIPANT（ID, NAME, GENDER, AGE）、FOOTBALL（ID, PID, BIB, TEAM）、RELAYRACE（ID, PID, BIB, TEAM）。部分參賽者未決定參加哪個項目。（p.166）',
          '(a) 每個號碼出現的**次數**都要列出 → `UNION ALL`，`ORDER BY BIB` 放最後。',
          '(b) 在**其中一個**項目屬於 A 隊 → `UNION`（不是 INTERSECT），每個 SELECT 都要有 `WHERE TEAM = \'A\'`。把 WHERE 放在括號外共用是錯的。',
          '(c) 參加足球、**沒有**參加接力的女性 → 子查詢內用 `EXCEPT`：`ID IN (SELECT PID FROM FOOTBALL EXCEPT SELECT PID FROM RELAYRACE)`。不能直接「排除參加接力的人」，因為有人兩項都沒參加。',
          '(d)「沒有**同時**參加兩個項目」≠「沒有參加任何項目」→ `ID NOT IN (SELECT PID FROM FOOTBALL INTERSECT SELECT PID FROM RELAYRACE)`。（p.167–168）',
          '集合運算符可以放在子查詢中。',
        ] },
        { sim: { db: 'sports', sql: C("SELECT NAME FROM PARTICIPANT WHERE AGE >= 22 AND ID NOT IN", "    (SELECT PID FROM FOOTBALL INTERSECT SELECT PID FROM RELAYRACE)") }, cap: '例題 3.4(d)（p.168）：Hugo 兩項都沒有參加，也符合「沒有同時參加兩個項目」。' },
        { sim: { db: 'books', sql: C('SELECT BNAME, PRICE FROM HBS h, BOOK b WHERE h.ISBN = b.ISBN AND PAGE >= 300', 'UNION', 'SELECT BNAME, PRICE FROM WBS w, BOOK b WHERE w.ISBN = b.ISBN AND PAGE >= 300', 'ORDER BY BNAME') }, cap: '測試站 3.4(c)（p.169）：兩間書店售價相同的書只列一次；售價不同便列兩行。' },
      ],
      tries: [
        { id: 'a3d-s3-t1', pts: 4, src: '教科書 p.168 例題 3.4(c)', db: 'sports',
          sql: C("SELECT NAME FROM PARTICIPANT WHERE GENDER = 'F' AND ID IN", '    (SELECT PID FROM FOOTBALL EXCEPT SELECT PID FROM RELAYRACE)'),
          q: '先估：足球 PID 是 1、2、3、5、6；接力 PID 是 2、3、4、6、7。女性有 Amy(1)、Cara(3)、Ella(5)、Gigi(7)。輸出哪些名字？', ask: { col: 'NAME' },
          options: ['Amy, Ella', 'Amy, Cara, Ella', 'Cara', 'Amy, Ella, Gigi'],
          why: '足球 EXCEPT 接力 = {1, 5}；兩人都是女性。Cara(3) 兩項都參加；Gigi(7) 只參加接力。' },
      ],
      practice: [
        { id: 'a3d-s3-p1', type: 'complete', pts: 2, src: '教科書 p.168 例題 3.4(b)', db: 'sports',
          q: '列出至少在其中一項比賽中屬於「A」隊的參賽者之識別碼。',
          template: C("SELECT PID FROM FOOTBALL WHERE TEAM = 'A'", "    ［1］ SELECT PID FROM RELAYRACE ［2］"),
          ref: ['UNION', "WHERE TEAM = 'A'"],
          hint: '「其中一項」→ UNION；第二個 SELECT 也要有自己的 WHERE。' },
        { id: 'a3d-s3-p2', type: 'fill', pts: 2, src: '教科書 p.169 測試站 3.4(a)', db: 'books', sql: 'SELECT ISBN FROM WBS WHERE PRICE < 100 EXCEPT SELECT ISBN FROM HBS',
          q: '列出在 World Bookstore 而非 Hello Bookstore 出售、且售價低於 $100 的書本之 ISBN。結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: 'WBS 中低於 $100 的：9780004、9780005、9780007；它們都不在 HBS。' },
        { id: 'a3d-s3-p3', type: 'mc', pts: 1, src: '教科書 p.169 測試站 3.4(c)', db: 'books', verify: true, ask: 'rows',
          q: '以下語句的結果有多少行？', sql: C('SELECT BNAME, PRICE FROM HBS h, BOOK b WHERE h.ISBN = b.ISBN AND PAGE >= 300', 'UNION', 'SELECT BNAME, PRICE FROM WBS w, BOOK b WHERE w.ISBN = b.ISBN AND PAGE >= 300'),
          options: ['3', '4', '5', '6'], answer: 1,
          hint: 'HBS：Data Stories 120、Cat Tales 150；WBS：Data Stories 110、Cat Tales 150、Night Sky 99。Cat Tales 150 重複，只留一行。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '檢視（VIEW）', pages: '教科書 p.170–181、p.186–190（例題 3.5、測試站 3.5）',
      learn: [
        { pts: [
          '程式中經常重用的代碼可寫成子程式；數據庫中經常重用的 SELECT 結果，可以創建**檢視（view）**——一個「**虛擬的數據表**」。（p.170）',
          '`CREATE VIEW 檢視名 AS SELECT …`。之後 `SELECT * FROM 檢視名` 與執行那句 SELECT 的結果一模一樣。（p.175）',
          '計算出來的欄位（例如 `SCORE1*0.4+SCORE2*0.6`、`COUNT(*)`）**一定要加別名**（FSCORE、CLUBNUM），否則很難在之後選擇。（p.175）',
          '檢視**不儲存數據**，只參照其他數據表：更新 STUDENT 後，檢視的結果自動改變；**不須、也不應**手動更新檢視。（p.176）',
          '`CREATE OR REPLACE VIEW`：修改現存的檢視。檢視也可以參照其他檢視。（p.179）',
          '`DROP VIEW 檢視名`：刪除檢視。被參照的數據表或檢視刪除後，參照它的檢視便會**失效**。（p.181）',
          '陷阱（p.178–179）：`COUNTCLUB` 用 `SELECT SID, COUNT(*) … FROM SC GROUP BY SID`，沒有學會的 Dio 根本不在 SC，所以**不在檢視中**；找「加入不多於兩個學會」的學生時便漏了他。要改用 `SC RIGHT JOIN STUDENT`，並用 `COUNT(CID)`（不是 COUNT(*)）。',
        ] },
        { code: C('CREATE VIEW SCORESHEET AS', '  SELECT s.SID, NAME, SEX, s.CLASS, TEACH, LANG,', '         SCORE1*0.4+SCORE2*0.6 AS FSCORE', '  FROM STUDENT s, CLASS cl WHERE s.CLASS = cl.CLASS;', '', "SELECT NAME FROM SCORESHEET WHERE TEACH = 'Mr Suen' AND FSCORE < 60"), cap: 'p.175–176：有了檢視，查詢變得很短。' },
        { note: '本平台的模擬器不執行 CREATE VIEW。下面把檢視的 SELECT 寫在 `FROM ( … ) SCORESHEET` 中（「從結果中選取數據」，p.165），效果與使用檢視相同。' },
        { sim: { db: 'view', sql: C('SELECT NAME FROM', '    ' + SCORESHEET, "    WHERE TEACH = 'Mr Suen' AND FSCORE < 60") }, cap: 'p.176：Mr Suen 所教、最終分數低於 60 的學生。試把 `NAME` 改成 `*` 看整個 SCORESHEET。' },
        { sim: { db: 'hospital', sql: C('SELECT RNAME FROM', '    ' + RPNUM, '    WHERE PNUM < CAPACITY') }, cap: '例題 3.5(a)(b)（p.187）：RPNUM 要用 r.ID 和 COUNT(p.ID)，沒有病人的病房才會是 0。' },
      ],
      tries: [
        { id: 'a3d-s4-t1', pts: 4, src: '教科書 p.178', db: 'view',
          sql: C('SELECT NAME FROM', '    ' + SCORESHEET, '    WHERE FSCORE > 60 AND SID IN', '    (SELECT SID FROM ' + COUNTCLUB_OLD + ' WHERE CLUBNUM <= 2)'),
          q: '先估：COUNTCLUB 用 `SELECT SID, COUNT(*) AS CLUBNUM FROM SC GROUP BY SID`。最終分數 > 60 且加入不多於兩個學會的學生是誰？', ask: { col: 'NAME' },
          options: ['Jean, Eva, Ben', 'Jean, Eva, Dio, Ben', 'Hans, Jean, Clem, Eva, Gabe', 'Ivy, Jean, Ada, Eva, Finn, Ben'],
          why: 'FSCORE > 60 的有 Hans、Jean、Clem、Eva、Gabe、Ben；其中 CLUBNUM ≤ 2 的是 Jean、Eva、Ben。（Dio 只有 52.6 分，而且他根本不在 COUNTCLUB 中——如果條件是 FSCORE < 60，他也會被漏掉。）' },
        { id: 'a3d-s4-t2', pts: 4, src: '教科書 p.187 例題 3.5(a) 分析', db: 'hospital',
          sql: C('SELECT RNAME, COUNT(*) AS PNUM FROM ROOM r', '    LEFT JOIN PATIENT p ON r.ID = RID GROUP BY r.ID'),
          q: '先估：病房 B02 沒有病人。用 COUNT(*) 時，B02 的 PNUM 是多少？', ask: { cell: [3, 'PNUM'] }, options: ['1', '0', 'NULL', '2'],
          why: 'LEFT JOIN 保留 B02，產生一行病人欄位全是 NULL 的記錄；COUNT(*) 點算行數得 1。所以書中強調要用 COUNT(p.ID)。' },
      ],
      practice: [
        { id: 'a3d-s4-p1', type: 'mc', pts: 1, src: '教科書 p.176、p.182',
          q: 'Hans 覆核後第二次測驗加了 10 分。應該怎樣更新？',
          options: ["UPDATE STUDENT SET SCORE2 = SCORE2 + 10 WHERE SID = '03369'，SCORESHEET 會自動更新", "UPDATE SCORESHEET SET FSCORE = FSCORE + 6 WHERE SID = '03369'", '先更新 STUDENT，再更新 SCORESHEET', '先 DROP VIEW SCORESHEET，再更新 STUDENT'], answer: 0,
          hint: '檢視不儲存數據，只參照數據表。' },
        { id: 'a3d-s4-p2', type: 'complete', pts: 2, src: '教科書 p.181', db: 'view',
          q: '用 SCORESHEET 列出最終分數最高的學生之名字。',
          template: C('SELECT NAME FROM ' + SCORESHEET, '    WHERE FSCORE = (SELECT ［1］ FROM ' + SCORESHEET.replace(') SCORESHEET', ') S2') + ')'),
          ref: ['MAX(FSCORE)'],
          hint: '子查詢找出最高的 FSCORE。' },
        { id: 'a3d-s4-p3', type: 'fill', pts: 2, src: '教科書 p.188–190 測試站 3.5(d)(f)', db: 'food',
          sql: C('SELECT CNAME, DEPOSIT, DUE FROM', '    (SELECT CNAME, DEPOSIT, SUM(TPRICE) AS DUE FROM CUSTOMER c LEFT JOIN', '        (SELECT CID, OPRICE*(1-DISCOUNT)*NUM AS TPRICE FROM FORDER f, MEAL m', '         WHERE f.MID = m.MID AND PAID = FALSE) FORDER2', '     ON c.CID = FORDER2.CID GROUP BY c.CID) CPAYMENT', '    WHERE DEPOSIT < DUE'),
          q: '這是測試站 3.5 的 CPAYMENT 檢視（DUE = 未付款訂單總價之和）。列出存款不足以支付未付款訂單的顧客。寫出結果的行數。（想一想：沒有訂單的 Sam 為甚麼不在結果中？）',
          blanks: [{ label: '行數', ask: 'rows' }],
          hint: 'Ann 欠 90（存款 100）；Ken 欠 40 + 45 = 85（存款 50）；May 欠 90（存款 20）；Sam 的 DUE 是 NULL，DEPOSIT < NULL 不是 TRUE。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '索引（INDEX）', pages: '教科書 p.182–185',
      learn: [
        { pts: [
          '沒有索引時，DBMS 要**逐行檢查**數據表（線性檢索）：11 項記錄最壞要檢查 11 次。（p.182）',
          '為經常搜尋的欄位（例如 NAME）建立**索引（index）**：DBMS 建立一個**索引表**，包含已排序的索引欄位及指向記錄的指標。（p.182）',
          '索引表已排序，DBMS 便可用**對分檢索**：11 項記錄最壞只要檢查 4 次（Finn → Hans → Gabe → Guy）。（p.183–184）',
          '記錄數目每增加一倍，最多只多檢查 1 次：N 項記錄最多約 ⌊log₂N⌋ + 1 次（1024 項最多 11 次）。',
          '索引欄位的數據改動（Guy 改名 Gal）或加入新記錄（Hope）時，索引表**必須更新**，否則檢索不到。DBMS 會自動更新，但**需時**，而且索引表要**佔用儲存空間**。（p.184–185）',
          '所以**只應為經常搜尋的欄位**建立索引。（p.185）',
          '`CREATE INDEX SNAME ON STUDENT (NAME)`：SNAME 是索引名稱，STUDENT 是數據表，(NAME) 是欄位。（p.185）',
          '刪除索引：`ALTER TABLE STUDENT DROP INDEX SNAME`（MySQL 也可寫 `DROP INDEX SNAME ON STUDENT`）。忘記索引名稱可用 `SHOW CREATE TABLE STUDENT` 查看。（p.185）',
        ] },
        { table: { head: ['', '檢視（VIEW）', '索引（INDEX）'], rows: [['作用', '簡化經常重用的 SQL 語句', '加快搜尋（對分檢索）'], ['儲存數據？', '不儲存，只參照數據表', '儲存已排序的索引表'], ['數據改動時', '結果自動改變', 'DBMS 要更新索引表（需時）'], ['創建', 'CREATE VIEW … AS SELECT …', 'CREATE INDEX … ON 表 (欄)'], ['刪除', 'DROP VIEW …', 'ALTER TABLE … DROP INDEX …']] }, cap: '檢視與索引的比較（p.182、p.195）' },
      ],
      tries: [],
      practice: [
        { id: 'a3d-s5-p1', type: 'mc', pts: 1, src: '教科書 p.185',
          q: '要為數據表 EMPLOYEE 的欄位 ENAME 建立名為 ENAMEIDX 的索引。以下哪一句正確？',
          options: ['CREATE INDEX ENAMEIDX ON EMPLOYEE (ENAME)', 'CREATE INDEX EMPLOYEE ON ENAMEIDX (ENAME)', 'CREATE INDEX ENAME ON EMPLOYEE (ENAMEIDX)', 'ALTER TABLE EMPLOYEE CREATE INDEX (ENAME)'], answer: 0,
          hint: 'CREATE INDEX 索引名稱 ON 數據表名稱 (欄位)。' },
        { id: 'a3d-s5-p2', type: 'mc', pts: 1, src: '教科書 p.184–185',
          q: '以下哪一項**不是**建立索引的代價？',
          options: ['索引表佔用額外的儲存空間', '加入新記錄時要更新索引表，需時', '修改索引欄位的數據時要更新索引表', '以索引欄位搜尋時要逐行檢查所有記錄'], answer: 3,
          hint: '索引令搜尋可以用對分檢索，不用逐行檢查。' },
        { id: 'a3d-s5-p3', type: 'fill', pts: 1, src: '教科書 p.183–184（1024 項的答案已更正，見單元檔頭）',
          q: '用索引表進行對分檢索，最壞情況下要檢查多少次？',
          blanks: [{ label: '11 項記錄', a: '4' }, { label: '1024 項記錄', a: '11' }],
          hint: '最多 ⌊log₂N⌋ + 1 次：log₂11 ≈ 3.46 → 4；log₂1024 = 10 → 11。' },
        { id: 'a3d-s5-p4', type: 'mc', pts: 1, src: '教科書 p.185',
          q: '學校的 STUDENT 數據表經常以學生姓名 NAME 搜尋，很少以性別 SEX 搜尋。應為哪個欄位建立索引？',
          options: ['只為 NAME', '只為 SEX', 'NAME 和 SEX 都要', '每個欄位都要，越多越快'], answer: 0,
          hint: '索引要更新、佔空間，只應為經常搜尋的欄位建立。' },
        { id: 'a3d-s5-p5', type: 'mc', pts: 1, src: '教科書 p.181–182',
          q: '檢視 SCORESHEET 參照了檢視 COUNTCLUB。執行 `DROP VIEW COUNTCLUB` 後會怎樣？',
          options: ['SCORESHEET 失效', 'SCORESHEET 不受影響', 'SCORESHEET 也會被自動刪除，並刪除 SC 的數據', 'COUNTCLUB 的數據會搬到 SCORESHEET'], answer: 0,
          hint: '檢視只參照其他數據表或檢視；被參照的檢視刪除了，它便無法運作。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL', pages: '教科書 p.166–190',
      intro: '在編輯器寫一句 SELECT 語句，可以先按 ▶ 執行自己檢查，再按「提交評核」。評核時會用另外幾組數據測試，所以不可以把答案「寫死」。',
      tasks: [
        { id: 'a3d-w1', pts: 10, title: '每個選手號碼的出現次數', src: '教科書 p.166–168 例題 3.4(a)', db: 'sports',
          q: '列出兩個比賽項目中的所有選手號碼 BIB。如果一個號碼出現了兩次，結果中要列出兩次。號碼按遞升順序排列。',
          starter: 'SELECT BIB FROM FOOTBALL ORDER BY BIB',
          ref: 'SELECT BIB FROM FOOTBALL UNION ALL SELECT BIB FROM RELAYRACE ORDER BY BIB',
          check: { order: true },
          rules: [{ must: 'UNION', msg: '要用集合運算符合併兩個數據表的結果。' }],
          hint: '要保留重複的號碼：`UNION ALL`；`ORDER BY BIB` 放在整句最後。' },
        { id: 'a3d-w2', pts: 12, title: '未儲存於 BOOK 的書', src: '教科書 p.169 測試站 3.4(d)', db: 'books',
          q: '由於人為錯誤，書店內部分書本的數據並未儲存於數據表 BOOK 中。列出這些書本的 ISBN（不重複）。',
          starter: 'SELECT ISBN FROM HBS',
          ref: 'SELECT ISBN FROM HBS UNION SELECT ISBN FROM WBS EXCEPT SELECT ISBN FROM BOOK',
          hint: '先把兩間書店的 ISBN 合併（UNION），再排除 BOOK 中的 ISBN（EXCEPT）；也可用 NOT IN 子查詢。' },
        { id: 'a3d-w3', pts: 13, title: '沒有同時參加兩個項目的參賽者', src: '教科書 p.166–168 例題 3.4(d)', db: 'sports',
          q: '列出年齡至少 22 歲、而且**沒有同時參加**兩個比賽項目的參賽者之名字。（兩項都沒有參加的也要列出。）',
          starter: 'SELECT NAME FROM PARTICIPANT WHERE AGE >= 22',
          ref: C('SELECT NAME FROM PARTICIPANT WHERE AGE >= 22 AND ID NOT IN', '    (SELECT PID FROM FOOTBALL INTERSECT SELECT PID FROM RELAYRACE)'),
          hint: '同時參加兩個項目的 PID = `SELECT PID FROM FOOTBALL INTERSECT SELECT PID FROM RELAYRACE`；把它放在 `ID NOT IN ( … )` 中。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.158–190',
      items: [
        { id: 'a3d-q1', pts: 4, src: '教科書 p.158–164', tags: [HOT_SET], db: 'union', verify: true, ask: { col: 'SID' },
          q: '以下語句輸出哪些 SID？', sql: 'SELECT SID FROM S2 UNION SELECT SID FROM S3 EXCEPT SELECT SID FROM S1',
          options: ['0, 3, 7, 6, 9', '0, 3, 7', '1, 8, 2', '7'], answer: 'A',
          why: '由左至右：S2 ∪ S3 = {1, 8, 0, 3, 7, 2, 6, 9}；再減 S1 {4, 5, 8, 2, 1} = {0, 3, 7, 6, 9}。' },
        { id: 'a3d-q2', pts: 4, src: '教科書 p.163', tags: [{ t: 'trap', why: '集合運算比較的是整行，所有選擇的欄位都要相同' }], db: 'union', verify: true, ask: 'rows',
          q: '以下語句的結果有多少行？', sql: 'SELECT SID, NAME FROM STUDENT INTERSECT SELECT STUDENTID, NAME FROM STUDENT2',
          options: ['0', '1', '4', '7'], answer: 'A',
          why: '03517 在兩邊的名字是 Ben 和 Benz，整行不一致，所以 INTERSECT 沒有結果。' },
        { id: 'a3d-q3', pts: 4, src: '教科書 p.168 例題 3.4(b)', tags: [HOT_SET],
          q: '以下哪一句可以列出至少在其中一個項目屬於 A 隊的參賽者識別碼？',
          options: ["(SELECT PID FROM FOOTBALL UNION SELECT PID FROM RELAYRACE) WHERE TEAM = 'A'", "SELECT PID FROM FOOTBALL WHERE TEAM = 'A' INTERSECT SELECT PID FROM RELAYRACE WHERE TEAM = 'A'", "SELECT PID FROM FOOTBALL WHERE TEAM = 'A' UNION SELECT PID FROM RELAYRACE WHERE TEAM = 'A'", "SELECT PID FROM FOOTBALL WHERE TEAM = 'A' UNION SELECT PID FROM RELAYRACE"], answer: 'C',
          why: 'A：WHERE 不可以被兩個 SELECT 共用。B：INTERSECT 是兩個項目都屬於 A 隊。D：第二個 SELECT 沒有篩選隊伍。' },
        { id: 'a3d-q4', pts: 4, src: '教科書 p.175–182',
          q: '以下哪一項有關檢視（view）的描述是**錯誤**的？',
          options: ['檢視就如虛擬的數據表，可以像數據表一樣用 SELECT 查詢', '檢視可以參照其他檢視', '數據表的數據更新後，要手動更新檢視', '所參照的數據表被刪除後，檢視便會失效'], answer: 'C',
          why: '檢視不儲存數據，每次使用時才從數據表取得結果，所以會自動反映最新的數據。' },
        { id: 'a3d-q5', pts: 4, src: '教科書 p.187 例題 3.5(c)', db: 'hospital', verify: true, ask: { cell: [0, 'AVG(PNUM)'] },
          q: 'RPNUM 是例題 3.5(a) 的檢視（每間病房的病人人數 PNUM；B02 沒有病人）。以下語句的結果是什麼？', sql: C('SELECT AVG(PNUM) FROM', '    ' + RPNUM, "    WHERE RNAME <> 'B01'"),
          options: ['1.33333333333', '2', '1.75', '2.33333333333'], answer: 'A',
          why: 'A01 有 2 人、A02 有 2 人、B02 有 0 人（排除 B01）：(2 + 2 + 0) ÷ 3 ≈ 1.33。若用 COUNT(*)，B02 會變成 1，平均便是 1.67。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlSet', 'sqlSub'], intro: '隨機生成 UNION／INTERSECT／EXCEPT 及子查詢題目，答案由 SQL 引擎計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
