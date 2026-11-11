/* 選修A 單元 a1a：SQL 基礎——創建數據表、插入、檢索、更新和刪除數據
 * 教科書 選修A 第 1 章 1.1–1.5 p.2–31（數據庫與 SQL 語句、創建數據庫及數據表、數據類型、INSERT／SELECT／WHERE／ORDER BY／DISTINCT、UPDATE／DELETE／DROP）
 * 活動 1.1–1.3、實驗站 1.1、例題 1.1–1.3、測試站 1.1–1.3；課後練習 p.56 第 3 題
 * 所有 SELECT／INSERT／UPDATE／DELETE 的答案在 build 時由 SQL 引擎計算／核對；CREATE／SHOW／USE／DROP 只作靜態題。
 *
 * 教科書疑似錯誤：p.23 測試站 1.2(a) 答案第一項 MID 印作 23908，與題目數據 25908 不符
 * 教科書疑似錯誤：p.31 測試站 1.3(b) 答案的出版日期寫成 '20-12-2012'；按 p.29 例題 1.3 分析，DBMS 的日期格式應為 'YYYY-MM-DD'，即 '2012-12-20'
 * 教科書疑似錯誤：p.28 DROP DATABASE 圖中 SCHOOLE 標示為「新數據表」，應為「數據庫」
 * 教科書疑似錯誤：p.56 課後練習第 3 題，插入的記錄是 ('001', '1', 4)，但其後排序結果中玩家 001 的 SCORE1 是 -4、003 是 1（兩部分數據不一致；不影響 (b) 的答案）
 * 備註：p.12 `sHoW dATaBaSes;` 標示 ✗，其實 MySQL 可以執行（不分大小寫），✗ 是指格式不一致，本單元照此解釋。
 * 備註：EVENT、MEMBER、PRODUCT、BOOK 另加了數項自擬記錄，方便練習 WHERE／UPDATE。
 */
const HOT_DML = { t: 'hot', why: '卷二A 常要求寫 INSERT／UPDATE／DELETE 語句，例如 DSE 2016 2A Q1、2018 2A Q4、2020 2A Q1' };
const TRAP_WHERE = { t: 'trap', why: 'UPDATE／DELETE 忘了 WHERE，整個數據表都會被更新／刪除。' };
const TRAP_TYPE = { t: 'trap', why: '用字串（CHAR）儲存分數，排序便按字符逐個比較：\'7\' 排在 \'11\' 之前。' };

const STU7 = [['SID', 'NAME', 'CLASS', 'CNO'], [
  ['03493', 'Ada', '1A', 1], ['03496', 'Clem', '1B', 15], ['03505', 'Eva', '1B', 28], ['03506', 'Gabe', '1C', null],
  ['03510', 'Finn', '1B', 7], ['03513', 'Dio', '1C', 13], ['03517', 'Ben', '1A', 9]]];

module.exports = {
  id: 'a1a',
  title: 'SQL 基礎：建立數據表與增刪改查',
  book: '教科書 選修A 第 1 章 p.2–31（另有 p.56 課後練習）',
  key: 'A-a1a-hmac-a55b11268f',
  theory: false,
  dbs: {
    // p.10 新創建的空數據表
    empty: { STUDENT: [['SID', 'NAME', 'CLASS', 'CNO'], []] },
    // p.18 插入七項記錄後
    school: { STUDENT: STU7 },
    // 例題 1.1／1.2（首四項是教科書數據；PIC 全是 NULL）
    event: { EVENT: [['EID', 'ENAME', 'PIC', 'EDATE', 'FEE', 'FINISHED'], [
      [83313, '歷史之旅', null, '2036-04-15', 40, 1], [83314, '科學日', null, '2036-05-28', 10.5, 1],
      [83315, '游泳盛會', null, '2036-06-08', 0, 0], [83316, '園藝樂趣', null, '2036-07-13', 59.9, 0],
      [83317, '電影欣賞', null, '2036-08-02', 25, 0], [83312, '書展', null, '2036-03-01', 15, 1]]] },
    // 測試站 1.2（首兩項是教科書數據）
    member: { MEMBER: [['MID', 'MNAME', 'MTYPE', 'AGE', 'CREDIT'], [
      [25908, '陳筱達', '銅', 26, 472.5], [72330, '王小花', '金', 23, 203.7], [31877, '周逸芬', '銀', 31, 88],
      [40125, '李大明', '金', 35, 1000], [55021, '何美美', '金', 19, 56.5], [60318, '張志強', '銅', 42, 0]]] },
    // 例題 1.3（首四項是教科書範例；另加 BA1100）
    product: { PRODUCT: [['PID', 'PNAME', 'STOCK', 'PRICE', 'EXPIRY'], [
      ['AC1389', 'T 恤', 50, 15.99, null], ['BD5790', '蘋果', 100, 0.99, '2023-05-31'], ['CE9401', '運動鞋', 20, 79.99, null],
      ['DF2765', '罐裝湯', 24, 2.5, '2024-12-31'], ['BA1100', '朱古力', 12, 9.9, '2025-01-31']]] },
    // 測試站 1.3（首四項是教科書範例；另加兩本布汀九的書）
    book: { BOOK: [['BID', 'BOOKNAME', 'AUTHOR', 'PUBDATE', 'NUMPAGE', 'PRICE'], [
      ['1567', '迷失的鑰匙', '史詩翰', '2022-03-15', 180, 12.99], ['3241', '最後一口氣', '杜麗珍', '2022-01-08', 224, 15.5],
      ['5678', '靜靜的淚水', '麥尚德', '2021-11-22', 281, 10.75], ['7902', '隱藏的寶石', '李書娜', '2022-02-01', 328, 9.99],
      ['0456', '小島日記', '布汀九', '2020-07-01', 150, 18], ['0890', '夜車', '布汀九', '2021-05-12', 210, 22.5]]] },
    // 課後練習第 3 題（SCORE1 是 CHAR(2)，所以儲存為字串）
    player: { PLAYER: [['PID', 'PTYPE', 'SCORE1', 'SCORE2'], [
      ['001', 3, '-4', 4], ['002', 3, '11', 6], ['003', 1, '1', null], ['004', 2, '7', 9]]] },
  },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '數據庫與 SQL 語句', pages: '教科書 p.4–12',
      learn: [
        { pts: [
          '**數據庫（database）**：電腦系統中有結構的數據集合，方便儲存和檢索大量數據。（p.4）',
          '數據庫管理包括：① 檢索資訊；② 修改、刪除及插入數據；③ 修改數據庫結構以應對新需求。（p.4）',
          '數據庫把數據組織為**欄位（field）**、**記錄（record）**和**數據表（table）**：一個欄位是單一的數據；一項記錄集合所有欄位；一個數據表集合多項記錄。（p.6）',
          '**數據庫管理系統（DBMS）**協助管理數據庫，例如有圖形用戶界面的 Microsoft Access，和可以不用 GUI 的 MySQL。（p.7）',
          '在 DBMS 中用**查詢**篩選、排序、匯總、更新或刪除數據；查詢以**結構化查詢語言（SQL）**編寫。（p.8）',
        ] },
        { table: { head: ['SQL 語句', '用途'], rows: [
          ['`SHOW DATABASES`', '列出所有數據庫'], ['`CREATE DATABASE SCHOOLE`', '創建數據庫'], ['`USE SCHOOLE`', '指明要使用的數據庫'],
          ['`CREATE TABLE STUDENT (SID CHAR(5), NAME CHAR(16), CLASS CHAR(2), CNO INT)`', '創建數據表，每個欄位要寫數據類型'], ['`SHOW TABLES`', '列出現存數據庫中的數據表'],
        ] }, cap: 'p.9–11。一個 DBMS 可以有多個數據庫，所以修改數據前要先 `USE`。' },
        { pts: [
          '**分號 `;`** 標示語句的結束；沒有分號，MySQL 不會回應，所以一句 SQL 可以分成數行輸入。（p.11 實驗站 1.1）',
          'MySQL 指令不分大小寫，但應使用一致的格式，例如全部大寫 `SHOW DATABASES;` 或全部小寫。（p.12）',
          '名稱應避免符號、數字和空格；無法避免時用**反引號** `` ` `` 括起，例如 `` `CLASS NO` ``。反引號不是單引號：單引號用來括起字串和日期。（p.12 擴闊視野）',
        ] },
        { sim: { db: 'school', sql: 'SELECT * FROM STUDENT' }, cap: '本單元的 STUDENT 數據表（p.18）。數一數：這個數據表有多少個欄位、多少項記錄？' },
      ],
      tries: [],
      practice: [
        { id: 'a1a-s1-p1', type: 'mc', pts: 2, src: '教科書 p.12 活動 1.3 第 2、3 題',
          q: '以下哪一句 SQL 語句能夠正確無誤地執行？',
          options: ['CREATE DATABASE CITY CENTRE', 'create table shop (id, name, location)', 'create table shop (id int, name char(30))', 'SHOW DATABASE'], answer: 2,
          hint: '名稱不可有空格；每個欄位都要有數據類型；列出數據庫的指令是 SHOW DATABASES。',
          why: 'A 的名稱有空格；B 沒有數據類型；D 少了 S。' },
        { id: 'a1a-s1-p2', type: 'mc', pts: 1, src: '教科書 p.12 活動 1.3 第 4 題',
          q: '`CREATE TABLE HOTEL (HID INT, HNAME CHAR(40), HADDRESS CHAR(40)` 為什麼不能執行？',
          options: ['欄位名稱不可以用 H 開首', '缺少最後的右括號 )', 'CHAR 的長度不可以是 40', '數據表名稱要用小寫'], answer: 1, hint: '數一數括號。' },
        { id: 'a1a-s1-p3', type: 'fill', pts: 2, src: '教科書 p.6 圖 1.3', db: 'school', sql: 'SELECT * FROM STUDENT',
          q: '執行 `SELECT * FROM STUDENT`。結果有多少項**記錄**？',
          blanks: [{ label: '記錄數目', ask: 'rows' }], hint: '每一行是一項記錄；每一欄是一個欄位。' },
        { id: 'a1a-s1-p4', type: 'mc', pts: 1, src: '教科書 p.11 實驗站 1.1',
          q: '在 MySQL 輸入 `SHOW DATABASES` 再按 Enter，沒有任何回應。原因是什麼？',
          options: ['指令要用小寫', '未有輸入分號 ; 表示語句結束', '未有 USE 數據庫', 'MySQL 不支援這個指令'], answer: 1,
          hint: 'MySQL 等待分號才執行，所以可以把一句分成數行輸入。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '數據類型', pages: '教科書 p.13–17、p.56',
      learn: [
        { table: { head: ['數據類型', '關鍵字', '例子'], rows: [
          ['整數', '`INT`／`INTEGER`', '0、283、-19'],
          ['實數（浮點數）', '`FLOAT`、`DOUBLE`', '569.1、-27.382'],
          ['實數（定點數）', '`DECIMAL`', '（同上）'],
          ['字符（固定長度）', '`CHAR(n)`', '\'1A\'、\'007=jb\''],
          ['字符（可變長度）', '`VARCHAR(n)`', '\'Benjamin Button\''],
          ['布爾', '`BOOL`／`BOOLEAN`', '0（FALSE）、1（TRUE）'],
          ['日期與時間', '`DATE`、`TIME`、`DATETIME`', '\'2025-12-31\'、\'11:30:00\'、\'2025-12-31 11:30:00\''],
        ] }, cap: '表 1.2 常見數據類型（p.13）。字串、日期和時間要用引號括起。' },
        { pts: [
          '`CHAR(n)` 佔用固定空間，適合長度固定的數據（如班別 \'1A\'）；`VARCHAR(n)` 按實際長度佔用空間，適合長度不定的數據（如姓名）。（p.13–14）',
          '有**前置零**的編號（如 \'034930\'）要用字串儲存；存為 INT 會變成 34930。（p.14）',
          '選類型的方法（例題 1.1）：只有數字、沒有前置零的編號 → INT；有小數 → FLOAT；只有 0／1 → BOOL；日期 → DATE；有日期和時間 → DATETIME；文字 → CHAR／VARCHAR。（p.15）',
          '數據類型會影響運算和排序：字串按字符逐個比較，所以 `\'7\'` 比 `\'11\'` 大。（p.56 課後練習第 3 題）',
        ] },
        { code: 'CREATE TABLE EVENT (\n    EID INT,\n    ENAME VARCHAR(255),\n    EDATE DATE,\n    FEE FLOAT,\n    FINISHED BOOL\n)', cap: '例題 1.1 答案（p.15）。INT 可寫成 INTEGER；ENAME 可以是 CHAR(255)；FEE 可以是 DECIMAL。' },
        { sim: { db: 'player', sql: 'SELECT PID, SCORE1 FROM PLAYER ORDER BY SCORE1 DESC' }, cap: 'p.56：SCORE1 定義為 CHAR(2)，所以按字符排序。' },
      ],
      tries: [
        { id: 'a1a-s2-t1', pts: 4, src: '教科書 p.56 課後練習第 3(b) 題', tags: [TRAP_TYPE], db: 'player', sql: 'SELECT PID, SCORE1 FROM PLAYER ORDER BY SCORE1 DESC',
          ask: { cell: [1, 'PID'] }, q: '先估：PLAYER 的 SCORE1 是 CHAR(2)，四位玩家分別是 001 \'-4\'、002 \'11\'、003 \'1\'、004 \'7\'。`ORDER BY SCORE1 DESC` 的第一行是哪位玩家？',
          options: ['001', '002', '003', '004'],
          why: '字串由第一個字符比較：\'7\' > \'1\' > \'-\'，所以 \'7\' 排第一，\'11\' 只排第二。把 SCORE1 定義為 INT 便會正確排序。' },
      ],
      practice: [
        { id: 'a1a-s2-p1', type: 'mc', pts: 2, src: '教科書 p.16 測試站 1.1 第 1 題',
          q: 'NOTICE 的 EXPIRY 是通告到期的**具體時間**，例如 2025-12-25 23:59:59。應選用哪一個數據類型？',
          options: ['DATE', 'TIME', 'DATETIME', 'VARCHAR(10)'], answer: 2, hint: '同時有日期和時間。' },
        { id: 'a1a-s2-p2', type: 'mc', pts: 2, src: '教科書 p.16–17 測試站 1.1 第 2 題',
          q: 'MEMBER 的 MID 是會員的識別碼（五位數字），例如 75319。教科書答案選用哪個數據類型？',
          options: ['CHAR(5)', 'VARCHAR(40)', 'FLOAT', 'BOOL'], answer: 0,
          hint: '識別碼長度固定，不會用來計算；固定長度的字串用 CHAR。', why: '五位數字的識別碼可能有前置零，用 CHAR(5) 較安全（例題 1.1 的 EID 說明了沒有前置零，才用 INT）。' },
        { id: 'a1a-s2-p3', type: 'mc', pts: 1, src: '教科書 p.14',
          q: '把 \'034930\' 儲存在 INT 欄位，會變成什麼？', options: ['034930', '34930', '\'034930\'', '出錯'], answer: 1,
          hint: '數值不會保留前置零。' },
        { id: 'a1a-s2-p4', type: 'mc', pts: 1, src: '教科書 p.13–14 擴闊視野',
          q: '儲存學生姓名（例如 \'Ben Bu\'、\'Benedict Timothy Carlton Cumberbatch\'），哪個數據類型較合適？',
          options: ['CHAR(40)', 'VARCHAR(40)', 'INT', 'DATE'], answer: 1, hint: '長度不定的字串。', why: 'VARCHAR 按實際長度佔用空間，較節省；CHAR 適合長度固定的數據，例如班別。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '插入和檢索數據', pages: '教科書 p.17–23',
      learn: [
        { pts: [
          '`INSERT INTO STUDENT (SID, NAME, CLASS, CNO) VALUES (\'03493\', \'Ada\', \'1A\', 1)`：值的次序要跟欄位的次序一樣。（p.17）',
          '值的次序跟數據表欄位次序相同時，可以不寫欄位：`INSERT INTO STUDENT VALUES (\'03496\', \'Clem\', \'1B\', 15)`；寫明欄位的話，可以按任何次序。（p.17）',
          '沒有提供值的欄位會是 **NULL**（空值）。注意：0 不是 NULL。（p.18）',
          '一句可以插入多項記錄，用逗號分隔：`VALUES (…), (…), (…)`。（p.18）',
          '`SELECT NAME, CNO FROM STUDENT` 檢索指定欄位；`SELECT *` 檢索所有欄位。SELECT 不會改動數據表。（p.18–19）',
          '`WHERE` 設定篩選條件；`ORDER BY` 排序，默認遞升（`ASC`），`DESC` 是遞降；可以按多個欄位排序；字串按字母順序。（p.19–21）',
          '`DISTINCT` 篩走重複的數據：`SELECT DISTINCT CLASS FROM STUDENT`。（p.21）',
        ] },
        { sim: { db: 'empty', sql: 'INSERT INTO STUDENT (SID, NAME, CLASS, CNO) VALUES\n    (\'03493\', \'Ada\', \'1A\', 1),\n    (\'03496\', \'Clem\', \'1B\', 15);\nINSERT INTO STUDENT (SID, NAME, CLASS) VALUES (\'03506\', \'Gabe\', \'1C\');\nSELECT * FROM STUDENT' }, cap: '由空的數據表開始插入記錄（p.17–18）。Gabe 沒有提供 CNO，所以是 NULL。' },
        { sim: { db: 'school', sql: 'SELECT NAME, CNO FROM STUDENT WHERE CLASS = \'1B\' ORDER BY CNO DESC' }, cap: 'p.20–21：1B 班學生，按學號遞降排列。試改為 `ORDER BY CLASS, CNO`（要刪去 WHERE）。' },
      ],
      tries: [
        { id: 'a1a-s3-t1', pts: 4, src: '教科書 p.20', db: 'school', sql: 'SELECT NAME, CNO FROM STUDENT WHERE CLASS = \'1B\' ORDER BY CNO',
          ask: { col: 'NAME' }, q: '先估：`SELECT NAME, CNO FROM STUDENT WHERE CLASS = \'1B\' ORDER BY CNO` 的 NAME 依次是什麼？（1B：Clem 15、Eva 28、Finn 7）',
          options: ['Clem, Eva, Finn', 'Finn, Clem, Eva', 'Eva, Clem, Finn', 'Clem, Finn, Eva'],
          why: '默認遞升：7（Finn）、15（Clem）、28（Eva）。' },
        { id: 'a1a-s3-t2', pts: 4, src: '教科書 p.20「試使用 ORDER BY CLASS, CNO」', db: 'school', sql: 'SELECT NAME, CLASS, CNO FROM STUDENT ORDER BY CLASS, CNO',
          ask: { col: 'NAME' }, q: '先估：`ORDER BY CLASS, CNO` 的 NAME 依次是什麼？（Gabe 的 CNO 是 NULL；MySQL 遞升排序時 NULL 排最前）',
          options: ['Ada, Ben, Finn, Clem, Eva, Gabe, Dio', 'Ada, Ben, Finn, Clem, Eva, Dio, Gabe', 'Ben, Ada, Finn, Clem, Eva, Gabe, Dio', 'Ada, Clem, Eva, Gabe, Finn, Dio, Ben'],
          why: '先按 CLASS 排；同班才按 CNO 排：1A（Ada 1、Ben 9）、1B（Finn 7、Clem 15、Eva 28）、1C（Gabe NULL、Dio 13）。' },
      ],
      practice: [
        { id: 'a1a-s3-p1', type: 'complete', pts: 2, src: '教科書 p.22 例題 1.2(c)', db: 'event', check: { order: true },
          q: '以參與費用的**遞降**順序展示活動名稱。', template: 'SELECT ENAME FROM EVENT ORDER BY ［1］', ref: ['FEE DESC'],
          hint: '遞降用 DESC。' },
        { id: 'a1a-s3-p2', type: 'complete', pts: 2, src: '教科書 p.23 測試站 1.2(b)', db: 'member',
          q: '展示會員周逸芬的會籍類型。', template: 'SELECT ［1］ FROM MEMBER WHERE ［2］', ref: ['MTYPE', 'MNAME = \'周逸芬\''],
          hint: '字串要用單引號括起。' },
        { id: 'a1a-s3-p3', type: 'fill', pts: 2, src: '教科書 p.23 測試站 1.2(d)', db: 'member', sql: 'SELECT DISTINCT MTYPE FROM MEMBER',
          q: '`SELECT DISTINCT MTYPE FROM MEMBER` 展示所有現存的會籍類型，並避免重複。結果有多少行？',
          blanks: [{ label: '行數', ask: 'rows' }], hint: '在試算區先執行 `SELECT MTYPE FROM MEMBER` 比較。' },
        { id: 'a1a-s3-p4', type: 'mc', pts: 1, src: '教科書 p.22 例題 1.2(a)', tags: [HOT_DML], db: 'event',
          sql: 'INSERT INTO EVENT (EID, ENAME, EDATE, FEE, FINISHED) VALUES (83320, \'攝影班\', \'2036-09-10\', 30, 0); SELECT PIC FROM EVENT WHERE EID = 83320',
          ask: { cell: [1, 'PIC'] }, verify: true,
          q: '執行 `INSERT INTO EVENT (EID, ENAME, EDATE, FEE, FINISHED) VALUES (83320, \'攝影班\', \'2036-09-10\', 30, 0)`。新記錄的 PIC 是什麼？',
          options: ['0', 'NULL', '\'\'（空字串）', '出錯，因為少了 PIC'], answer: 1,
          hint: '略過的欄位會是空值。', why: '插入時沒有提供 PIC 的值，所以是 NULL（而不是 0）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '更新和刪除數據', pages: '教科書 p.26–31',
      learn: [
        { pts: [
          '`UPDATE STUDENT SET NAME = \'Bob\' WHERE SID = \'03517\'`：更新符合條件的記錄。（p.26）',
          '條件應該用獨一無二的識別碼（SID），不要用 NAME：可能有多位學生同名。（p.26 試想想）',
          '`UPDATE` 沒有 `WHERE`，**整個數據表**都會被更新。（p.26）',
          '同時更新多個欄位：`SET NAME = \'Buzz\', CLASS = \'1B\'`。（p.27）',
          '`DELETE FROM STUDENT WHERE CLASS = \'1B\'` 刪除符合條件的記錄；沒有 WHERE 便刪除全部記錄（數據表本身還在）。（p.27–28）',
          '`DROP TABLE STUDENT` 刪除整個數據表（連同記錄）；`DROP DATABASE SCHOOLE` 刪除整個數據庫（連同所有數據表）。（p.28）',
          '一個不小心便可能刪掉大量數據，所以要定期**備份**數據庫。（p.28 提示）',
        ] },
        { sim: { db: 'school', sql: 'UPDATE STUDENT SET NAME = \'Buzz\', CLASS = \'1B\' WHERE SID = \'03517\';\nSELECT * FROM STUDENT' }, cap: 'p.27：Ben 改名 Buzz 並轉到 1B 班。試刪去 `WHERE SID = \'03517\'`，看看會怎樣（按「重設數據」還原）。' },
      ],
      tries: [
        { id: 'a1a-s4-t1', pts: 4, src: '教科書 p.26', tags: [TRAP_WHERE], db: 'school', sql: 'UPDATE STUDENT SET NAME = \'Bob\'; SELECT * FROM STUDENT WHERE NAME = \'Bob\'',
          ask: 'rows', q: '先估：執行 `UPDATE STUDENT SET NAME = \'Bob\'`（沒有 WHERE）之後，有多少位學生名叫 Bob？', options: ['0', '1', '6', '7'],
          why: '沒有 WHERE，七項記錄的 NAME 全部變成 Bob。' },
        { id: 'a1a-s4-t2', pts: 4, src: '教科書 p.27', db: 'school',
          sql: 'UPDATE STUDENT SET NAME = \'Buzz\', CLASS = \'1B\' WHERE SID = \'03517\'; DELETE FROM STUDENT WHERE CLASS = \'1B\'; SELECT * FROM STUDENT',
          ask: 'rows', q: '先估：先把 03517 轉到 1B 班，再執行 `DELETE FROM STUDENT WHERE CLASS = \'1B\'`。STUDENT 餘下多少項記錄？', options: ['3', '4', '5', '7'],
          why: '1B 班變成 Clem、Eva、Finn、Buzz 四人，全部刪除後餘下 Ada、Gabe、Dio。' },
      ],
      practice: [
        { id: 'a1a-s4-p1', type: 'complete', pts: 2, src: '教科書 p.29–30 例題 1.3(d)', db: 'product',
          q: '識別碼為 BA1100 的產品目前缺貨。更新它的記錄（之後會列出整個數據表核對）。',
          template: 'UPDATE PRODUCT SET ［1］ WHERE ［2］; SELECT * FROM PRODUCT', ref: ['STOCK = 0', 'PID = \'BA1100\''],
          hint: '缺貨即庫存量 STOCK 是 0；用識別碼做條件。' },
        { id: 'a1a-s4-p2', type: 'complete', pts: 2, src: '教科書 p.31 測試站 1.3(c)', db: 'book',
          q: '顧客能以 $12.4 購買任何由作者**布汀九**撰寫的書籍。更新相應的記錄。',
          template: 'UPDATE BOOK SET ［1］ WHERE ［2］; SELECT * FROM BOOK', ref: ['PRICE = 12.4', 'AUTHOR = \'布汀九\''],
          hint: '價格不要寫 $ 符號。' },
        { id: 'a1a-s4-p3', type: 'mc', pts: 1, src: '教科書 p.29–30 例題 1.3(c)',
          q: '要插入產品 Smart Candy：識別碼 SN2359、庫存 138、價格 $14.5、到期日 24/11/2042。PRODUCT 的欄位次序是 PID、PNAME、STOCK、PRICE、EXPIRY。哪一句正確？',
          options: ['INSERT INTO PRODUCT VALUES (\'SN2359\', \'Smart Candy\', 138, $14.5, \'24/11/2042\')', 'INSERT INTO PRODUCT VALUES (\'SN2359\', \'Smart Candy\', 138, 14.5, \'2042-11-24\')', 'INSERT INTO PRODUCT VALUES (SN2359, Smart Candy, 138, 14.5, 2042-11-24)', 'INSERT INTO PRODUCT VALUES (\'Smart Candy\', \'SN2359\', 14.5, 138, \'2042-11-24\')'], answer: 1,
          hint: '數字不寫 $；日期格式是 YYYY-MM-DD；字串和日期要加引號；值的次序要跟欄位次序一樣。' },
        { id: 'a1a-s4-p4', type: 'mc', pts: 1, src: '教科書 p.27–28',
          q: '執行 `DELETE FROM STUDENT`（沒有 WHERE）之後會怎樣？',
          options: ['出錯，DELETE 一定要有 WHERE', '刪除全部記錄，但數據表 STUDENT 仍然存在', '刪除整個數據表 STUDENT', '刪除整個數據庫'], answer: 1,
          hint: '刪除數據表本身要用 DROP TABLE。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL', pages: '教科書 p.22–23、p.31',
      intro: '在編輯器寫 SQL 語句，先按「▶ 執行」看結果，再按「提交評核」。評核會用另外的數據再測試，所以不可以只寫出現在的答案。',
      tasks: [
        { id: 'a1a-w1', tier: '必做', pts: 10, title: '已完結的活動', src: '教科書 p.22 例題 1.2(b)', db: 'event',
          q: '展示已完結的活動（FINISHED 是 1）的**所有**數據。',
          starter: 'SELECT * FROM EVENT',
          ref: 'SELECT * FROM EVENT WHERE FINISHED = 1',
          hint: '`WHERE FINISHED = 1`（也可以寫 `FINISHED = TRUE`）。' },
        { id: 'a1a-w2', tier: '進階', pts: 12, title: '金級會員按年齡排列', src: '教科書 p.23 測試站 1.2(c)', db: 'member',
          q: '展示會籍為「金」的會員之**所有**數據，並以會員年齡的**遞升**順序排列。',
          starter: 'SELECT * FROM MEMBER WHERE MTYPE = 金',
          ref: 'SELECT * FROM MEMBER WHERE MTYPE = \'金\' ORDER BY AGE',
          hint: '字串要用單引號：`\'金\'`；遞升是默認的排序，`ORDER BY AGE` 即可（ASC 可寫可不寫）。' },
        { id: 'a1a-w3', tier: '挑戰', pts: 13, title: '更新作者的書價', src: '教科書 p.31 測試站 1.3(c)（改編）', db: 'book',
          q: '書店舉辦促銷：作者**史詩翰**和**李書娜**的書，售價一律改為 **$8.8**。寫出 **UPDATE** 語句更新相應的記錄。（其他書的售價不可改變。）',
          starter: 'UPDATE BOOK SET PRICE = 8.8',
          ref: 'UPDATE BOOK SET PRICE = 8.8 WHERE AUTHOR = \'史詩翰\' OR AUTHOR = \'李書娜\'',
          rules: [{ must: 'UPDATE', msg: '這題要寫 UPDATE 語句。' }],
          hint: '起始語句沒有 WHERE，會更新全部書籍。條件：`AUTHOR = \'史詩翰\' OR AUTHOR = \'李書娜\'`（注意要用 OR）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.12–31、p.56',
      items: [
        { id: 'a1a-q1', pts: 4, src: '教科書 p.12 活動 1.3 第 1 題、p.12',
          q: '以下哪一句**不能**執行？',
          options: ['show databases', 'SHOW DATABASES;', 'SHOW DATABASE', 'SHOW TABLES;'], answer: 'C',
          why: '列出數據庫的指令是 SHOW DATABASES（有 S）；MySQL 指令不分大小寫。' },
        { id: 'a1a-q2', pts: 4, src: '教科書 p.56 課後練習第 3(b)、(c) 題', tags: [TRAP_TYPE],
          q: 'PLAYER 的 SCORE1 定義為 CHAR(2)。`SELECT PID, SCORE1 FROM PLAYER ORDER BY SCORE1 DESC` 的結果中，得分 11 的玩家 002 不是第一行。應如何改正？',
          options: ['把 DESC 改為 ASC', '把 SCORE1 的數據類型改為 INT', '把 SCORE1 的長度改為 CHAR(3)', '在 SELECT 之後加 DISTINCT'], answer: 'B',
          why: 'SCORE1 是字串，排序時逐個字符比較（\'7\' > \'11\'）。改為整數（例如 `ALTER TABLE PLAYER MODIFY SCORE1 INT`）便按數值排序。' },
        { id: 'a1a-q3', pts: 4, src: '自擬（DSE 卷二A 題型）', tags: [HOT_DML], db: 'school',
          sql: 'INSERT INTO STUDENT (SID, NAME, CLASS) VALUES (\'03520\', \'Ivy\', \'1A\'); UPDATE STUDENT SET CNO = 0 WHERE CNO IS NULL; DELETE FROM STUDENT WHERE CNO < 10; SELECT * FROM STUDENT',
          ask: 'rows', verify: true,
          q: 'STUDENT 有 p.18 的七項記錄（Gabe 的 CNO 是 NULL；CNO 小於 10 的有 Ada 1、Finn 7、Ben 9）。依次執行：\n① `INSERT INTO STUDENT (SID, NAME, CLASS) VALUES (\'03520\', \'Ivy\', \'1A\')`\n② `UPDATE STUDENT SET CNO = 0 WHERE CNO IS NULL`\n③ `DELETE FROM STUDENT WHERE CNO < 10`\nSTUDENT 最後有多少項記錄？',
          options: ['3', '4', '5', '6'], answer: 'A',
          why: '① 後有 8 項，Ivy 的 CNO 是 NULL；② 把 Gabe 和 Ivy 的 CNO 設為 0；③ 刪除 CNO 是 0、1、7、9 的五項，餘下 Clem、Eva、Dio。' },
        { id: 'a1a-q4', pts: 4, src: '教科書 p.26 試想想',
          q: '要把學生 Ben（SID 03517）改名為 Bob，為何條件應寫 `WHERE SID = \'03517\'` 而不是 `WHERE NAME = \'Ben\'`？',
          options: ['NAME 不可以出現在 WHERE 中', 'SID 是獨一無二的識別碼；可能有多位學生名叫 Ben', '用 NAME 作條件會刪除記錄', 'SID 是數字，執行較快'], answer: 'B',
          why: '用 NAME 作條件可能同時更新了其他同名學生的數據。' },
        { id: 'a1a-q5', pts: 4, src: '教科書 p.22 例題 1.2、p.21', db: 'event',
          sql: 'SELECT DISTINCT FINISHED FROM EVENT ORDER BY FINISHED DESC', ask: 'table', verify: true,
          q: 'EVENT 的 FINISHED 欄依次是 1、1、0、0、0、1。`SELECT DISTINCT FINISHED FROM EVENT ORDER BY FINISHED DESC` 的輸出是什麼？',
          options: ['1\n0', '0\n1', '1\n1\n1\n0\n0\n0', '1'], answer: 'A',
          why: 'DISTINCT 去除重複，只餘 1 和 0；DESC 遞降，所以 1 在前。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlDml', 'sqlWhere'], intro: '隨機生成 INSERT／UPDATE／DELETE 之後數據表內容，以及 WHERE 篩選的題目，答案由 SQL 引擎計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
