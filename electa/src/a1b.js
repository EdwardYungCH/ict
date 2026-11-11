/* 選修A 單元 a1b：數據表的限制與更改數據表結構（理論單元）
 * 教科書 選修A 第 1 章 1.6–1.7 p.32–52（主關鍵碼、複合鍵、外鍵碼、NOT NULL／UNIQUE／DEFAULT／CHECK、AUTO_INCREMENT、ALTER TABLE）
 * 活動 1.4、例題 1.4–1.5、測試站 1.4–1.5；課文總結 p.51–52；課後練習 p.53–56
 * 理論單元（theory: true）：練 40 · 分析題 35 · 小測 25。CREATE／ALTER／DROP 等語句不在模擬器執行，題目為靜態題；
 * 可以執行的 SELECT／UPDATE（例題 1.5(b)、(c)）由 SQL 引擎核對。
 *
 * 教科書疑似錯誤：p.46 句子「我們可使用以下 SQL 語句刪除主關鍵碼」，所示語句 `ALTER TABLE STUDENT DROP FOREIGN KEY STUDENT_IBFK_1` 刪除的是外鍵碼
 * 教科書疑似錯誤：p.52 課文總結「刪除 CHECK」印作 `ALTER TABLE table DROP constraint_name`，與 p.47 表 1.4 的 `ALTER TABLE STUDENT DROP CHECK STUDENT_CHK_1` 不一致（缺少 CHECK）
 * 教科書疑似錯誤：p.43–45 多個「更改前」的數據表標題印作 STUDNET（應為 STUDENT；只有 p.42 重新命名一例才是 STUDNET）
 * 備註：p.55–56 課後練習第 2、3 題沒有印上答案，本單元的答案按 MySQL 8.0 行為擬定（2(a)：ROOM 已有主關鍵碼，不能再加；3(a)：PTYPE 取默認值 3）。
 * 備註：p.49 測試站 1.5(b) 的教師版旁註說「主關鍵碼不能是 NULL，DBMS 通常會為主關鍵碼設定默認值 0」：新欄位每項記錄都是 0，重複，所以不能加入。
 */
const TRAP_FK = { t: 'trap', why: '父數據表的記錄仍被主數據表參照時，不能直接刪除或更改它的主關鍵碼。' };
const HOT_KEY = { t: 'hot', why: '卷二A 每年都要求指出主關鍵碼／外鍵碼，例如 DSE 2018 2A Q4、2019 2A Q3（課後練習第 1、2 題即改編自這兩題）' };

const REASONS = ['沒有違反任何限制', '主關鍵碼的值重複', 'NOT NULL 欄位沒有值', 'UNIQUE 欄位的值重複', '外鍵碼的值不在父數據表中', '父數據表的記錄仍被參照', '不符合 CHECK 的條件'];
const YN = ['能', '不能'];
const ALTERS = [
  'ALTER TABLE STUDNET RENAME STUDENT',
  'ALTER TABLE STUDENT ADD NAME VARCHAR(40)',
  'ALTER TABLE STUDENT RENAME COLUMN LAME TO NAME',
  'ALTER TABLE STUDENT MODIFY SID INT',
  'ALTER TABLE STUDENT DROP CNO',
  'ALTER TABLE STUDENT ADD PRIMARY KEY (SID)',
  'ALTER TABLE STUDENT DROP PRIMARY KEY',
  'ALTER TABLE STUDENT ADD UNIQUE(EMAIL)',
  'ALTER TABLE STUDENT ALTER NAME SET DEFAULT \'John\'',
  'ALTER TABLE STUDENT ADD CHECK (CNO > 0)',
  'ALTER TABLE STUDENT DROP FOREIGN KEY STUDENT_IBFK_1',
];
const KEYS = ['MEMID', 'CHESSID', 'MCID', 'MEMID、CHESSID', 'GID', 'PCODE、GENREID', 'SID', 'PHONE', 'N/A'];

module.exports = {
  id: 'a1b',
  title: '數據表的限制與更改結構',
  book: '教科書 選修A 第 1 章 p.32–56',
  key: 'A-a1b-hmac-d05a62c9a4',
  theory: true,
  writeLabel: '分析題',
  dbs: {
    // p.35 STUDENT 與 CLASSLIST
    school: {
      STUDENT: [['SID', 'NAME', 'CLASS'], [['03493', 'Ada', '1A'], ['03496', 'Clem', '1B'], ['03505', 'Eva', '1B'], ['03506', 'Gabe', '1C'],
        ['03510', 'Finn', '1B'], ['03513', 'Dio', '1C'], ['03517', 'Ben', '1A']], ['SID']],
      CLASSLIST: [['CLASSNAME', 'TEACHER', 'LOCATION'], [['1A', 'Mr. Chan', 'ROOM 101'], ['1B', 'Miss Lee', 'ROOM 102'],
        ['1C', 'Mrs. Tse', 'ROOM 104'], ['1D', 'Mr. Wong', 'ROOM 105']], ['CLASSNAME']],
    },
    // 例題 1.5（自擬數據；MTYPE 已加入，默認 'Regular'）
    user: { USER: [['UID', 'USERNAME', 'CREDIT', 'MTYPE'], [
      ['10000001', 'amy88', 120.5, 'Regular'], ['10000002', 'benny', 0, 'Premium'], ['10000003', 'cat_lo', 56, 'Regular'],
      ['10000004', 'dicky', 300, 'Premium'], ['10000005', 'eva.w', 15, 'Gold'], ['10000006', 'fongfong', 999, 'Silver']], ['UID']] },
  },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '主關鍵碼與複合鍵', pages: '教科書 p.32–34',
      learn: [
        { pts: [
          '為保持數據的**完整性**與**有效性**，要為數據表設置**限制**。（p.32）',
          '**主關鍵碼（primary key）**：一個或多個欄位，儲存每項記錄中**獨一無二**的數據，用來區分每項記錄；它的值**不能是 NULL**。每個數據表都應有一個主關鍵碼。（p.32）',
          '選主關鍵碼要問三個問題：會否重複？每項記錄都有嗎？會否變更？例如香港市民的 HKID 不會重複、人人都有、不會改變，適合做主關鍵碼；銀行戶口號碼不是人人都有，電郵地址會更改。（p.32–33 活動 1.4）',
          '創建時設定：`SID CHAR(5) PRIMARY KEY`；可以用**底線**標示主關鍵碼欄位。（p.33）',
          'PRIMARY KEY 限制會阻止任何插入或更新造成**重複值**或 **NULL**：一句 INSERT 中只要有一項記錄違反限制，整句都不會插入任何記錄。（p.33）',
          '**複合鍵（composite key）**：把一組欄位一起設定為主關鍵碼，例如 `PRIMARY KEY(CLASS, CNO)`：班別可以重複、學號可以重複，但兩者的**組合**必須獨一無二。（p.34）',
        ] },
        { code: 'CREATE TABLE STUDENT (\n    NAME VARCHAR(40),\n    CLASS CHAR(2),\n    CNO INT,\n    PRIMARY KEY(CLASS, CNO)\n)', cap: '以 CLASS + CNO 為複合鍵（p.34）。' },
        { warn: '例 3（p.33）：STUDENT 已有 03506 Gabe 和 03513 Dio。`UPDATE STUDENT SET SID = \'03506\' WHERE NAME = \'Dio\'` 會因 PRIMARY KEY 限制而出錯——更新也不可以造成重複的主關鍵碼。' },
      ],
      practice: [
        { id: 'a1b-s1-p1', type: 'mc', pts: 2, src: '教科書 p.32–33 活動 1.4', tags: [HOT_KEY],
          q: 'HKCITIZEN 儲存所有香港市民的數據，欄位有 HKID、ENAME、SEX、DOB、BANKAC（個人銀行戶口號碼）、EMAIL。哪個欄位應用作主關鍵碼？',
          options: ['HKID', 'ENAME', 'BANKAC', 'EMAIL'], answer: 0, hint: '獨一無二、人人都有、不會變更。' },
        { id: 'a1b-s1-p2', type: 'mc', pts: 2, src: '教科書 p.32 活動 1.4',
          q: '為什麼 BANKAC（個人銀行戶口號碼）**不適合**做 HKCITIZEN 的主關鍵碼？',
          options: ['銀行戶口號碼會重複', '有些人沒有銀行戶口，值會是 NULL', '銀行戶口號碼太長', '銀行戶口號碼是數字'], answer: 1,
          hint: '主關鍵碼不能是 NULL。', why: '而且人們可以開設新戶口（會變更）。' },
        { id: 'a1b-s1-p3', type: 'mc', pts: 2, src: '教科書 p.33 例 1',
          q: 'STUDENT 的 SID 是主關鍵碼，數據表原本是空的。執行：\n`INSERT INTO STUDENT (SID, NAME, CLASS, CNO) VALUES (\'03493\', \'Ada\', \'1A\', 1), (\'03496\', \'Clem\', \'1B\', 15), (\'03493\', \'Eva\', \'1B\', 28)`\n之後 STUDENT 有多少項記錄？',
          options: ['0', '1', '2', '3'], answer: 0,
          hint: '整句 INSERT 違反了 PRIMARY KEY 限制。', why: '第三項記錄的 SID 與第一項重複，整句出錯，不會有記錄插入。' },
        { id: 'a1b-s1-p4', type: 'mc', pts: 2, src: '教科書 p.34',
          q: 'STUDENT 以 `PRIMARY KEY(CLASS, CNO)` 為複合鍵。以下哪一組記錄**不能**同時存在？',
          options: ['(\'Ada\', \'1A\', 1) 和 (\'Clem\', \'1B\', 1)', '(\'Gabe\', \'1C\', 15) 和 (\'Clem\', \'1B\', 15)', '(\'Gabe\', \'1C\', 15) 和 (\'Dio\', \'1C\', 15)', '(\'Ada\', \'1A\', 1) 和 (\'Ada\', \'1A\', 2)'], answer: 2,
          hint: '只有 CLASS 和 CNO **兩者都相同**才算重複。' },
        { id: 'a1b-s1-p5', type: 'mc', pts: 2, src: '教科書 p.39–40 例題 1.4(a)', tags: [HOT_KEY],
          q: 'GAME 的欄位：PCODE（2 位發行商識別碼）、GCODE（3 位遊戲識別碼，同一發行商不會重複）、GID（格式 XXYYY，即 PCODE 加 GCODE）、GNAME、GENREID、PRICE。哪個**單一**欄位適合做主關鍵碼？',
          options: ['PCODE', 'GCODE', 'GID', 'GENREID'], answer: 2,
          hint: '不同發行商的遊戲可以有相同的 GCODE（例如 ZY009 和 HL009）。', why: '主關鍵碼可以是 GID 或複合鍵 PCODE + GCODE；題目要求一個欄位，所以是 GID。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '外鍵碼', pages: '教科書 p.34–36、p.39–40',
      learn: [
        { pts: [
          '**外鍵碼（foreign key）**展示兩個數據表記錄之間的關係：數據表 X 的外鍵碼必須是另一數據表 Y 的**主關鍵碼**。X 稱為**主數據表**，Y 稱為**父數據表**。（p.34）',
          '例子：STUDENT 的 CLASS 參照 CLASSLIST 的 CLASSNAME，以免學生被分派到不存在的班別。（p.35）',
          '`FOREIGN KEY (CLASS) REFERENCES CLASSLIST(CLASSNAME)`：括號內先寫主數據表的欄位，REFERENCES 之後寫父數據表及其主關鍵碼。（p.35）',
          'FOREIGN KEY 限制阻止主數據表出現父數據表中**不存在**的值：插入或更新為 1E 班都會出錯。（p.35–36）',
          '反過來，父數據表中**仍被參照**的記錄（例如 1A 班仍有學生），不能直接刪除，也不能更改它的主關鍵碼；沒有被參照的 1D 班則可以。（p.36）',
        ] },
        { er: { entities: [{ name: 'CLASSLIST', attrs: ['*CLASSNAME', 'TEACHER', 'LOCATION'] }, { name: 'STUDENT', attrs: ['*SID', 'NAME', 'CLASS'] }],
          rels: [{ a: 'CLASSLIST', b: 'STUDENT', name: '屬於', card: '1:M' }] }, cap: '一個班別有多位學生；STUDENT.CLASS 是外鍵碼，參照 CLASSLIST.CLASSNAME（p.35）。' },
        { code: 'CREATE TABLE STUDENT (\n    SID CHAR(5) PRIMARY KEY,\n    NAME VARCHAR(40),\n    CLASS CHAR(2),\n    FOREIGN KEY (CLASS) REFERENCES CLASSLIST(CLASSNAME)\n)', cap: '創建時設定外鍵碼（p.35）。CLASSLIST 要先存在。' },
        { sim: { db: 'school', sql: 'SELECT * FROM STUDENT WHERE CLASS = \'1A\'' }, cap: '在模擬器看看兩個數據表：哪些班別有學生參照？哪個班別沒有學生？' },
      ],
      practice: [
        { id: 'a1b-s2-p1', type: 'mc', pts: 2, src: '教科書 p.36 例 1', tags: [TRAP_FK],
          q: 'CLASSLIST 有 1A、1B、1C、1D 班，STUDENT.CLASS 是參照 CLASSLIST 的外鍵碼。以下哪一句**會出錯**？',
          options: ['INSERT INTO STUDENT (SID, NAME, CLASS) VALUES (\'03520\', \'Ivy\', \'1D\')', 'INSERT INTO STUDENT (SID, NAME, CLASS) VALUES (\'03521\', \'Jo\', \'1E\')', 'UPDATE STUDENT SET CLASS = \'1C\' WHERE SID = \'03493\'', 'DELETE FROM STUDENT WHERE CLASS = \'1A\''], answer: 1,
          hint: '外鍵碼的值必須在父數據表中存在。', why: 'CLASSLIST 沒有 1E 班。刪除主數據表（STUDENT）的記錄不受外鍵碼影響。' },
        { id: 'a1b-s2-p2', type: 'mc', pts: 2, src: '教科書 p.36', tags: [TRAP_FK],
          q: 'STUDENT 有 1A、1B、1C 班的學生，但沒有 1D 班的學生。以下哪一句**可以**執行？',
          options: ['DELETE FROM CLASSLIST WHERE CLASSNAME = \'1A\'', 'UPDATE CLASSLIST SET CLASSNAME = \'1E\' WHERE CLASSNAME = \'1A\'', 'DELETE FROM CLASSLIST WHERE CLASSNAME = \'1D\'', 'DELETE FROM CLASSLIST'], answer: 2,
          hint: '只有沒有被參照的父記錄才可以刪除。' },
        { id: 'a1b-s2-p3', type: 'mc', pts: 2, src: '教科書 p.39–40 例題 1.4(b)', tags: [HOT_KEY],
          q: 'PUBLISHER(CODE, NAME, CAPTION) 和 GENRE(ID, NAME, CAPTION) 分別以 CODE 和 ID 為主關鍵碼。GAME 的哪兩個欄位適合做外鍵碼？',
          options: ['GID 和 GNAME', 'PCODE 和 GENREID', 'GCODE 和 PRICE', 'PCODE 和 GCODE'], answer: 1,
          hint: '外鍵碼參照另一數據表的主關鍵碼。', why: 'PCODE 參照 PUBLISHER(CODE)；GENREID 參照 GENRE(ID)。' },
        { id: 'a1b-s2-p4', type: 'mc', pts: 2, src: '教科書 p.55 課後練習第 2(c)(i) 題', tags: [TRAP_FK],
          q: 'ROOM 的 RTYPEID 是參照 RTYPE(RTYPEID) 的外鍵碼。`DELETE FROM RTYPE WHERE RTYPEID = 6` 無法執行，最可能的原因是什麼？',
          options: ['RTYPE 沒有主關鍵碼', 'ROOM 中仍有房間的 RTYPEID 是 6', 'DELETE 一定要刪除全部記錄', 'RTYPEID 是整數，不能作條件'], answer: 1,
          hint: '父數據表的記錄仍被參照。' },
        { id: 'a1b-s2-p5', type: 'mc', pts: 2, src: '教科書 p.55 課後練習第 2(c)(ii) 題',
          q: '承上題。要把 Presidential Suite（RTYPEID 6）從 RTYPE 刪除，之前應先執行哪一句？',
          options: ['DROP TABLE ROOM', 'DELETE FROM ROOM WHERE RTYPEID = 6（或把這些房間的 RTYPEID 改為其他類型）', 'ALTER TABLE RTYPE DROP PRIMARY KEY', 'UPDATE RTYPE SET RTYPEID = NULL WHERE RTYPEID = 6'], answer: 1,
          hint: '先處理主數據表中參照 6 的記錄。', why: '刪除整個 ROOM 數據表會失去所有房間資料；去掉主關鍵碼或設為 NULL 都不是合理做法。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '其他限制', pages: '教科書 p.37–41、p.56',
      learn: [
        { code: 'CREATE TABLE STUDENT1A (\n    SID CHAR(5) PRIMARY KEY,\n    NAME VARCHAR(40) NOT NULL,\n    CNO INT UNIQUE,\n    HOUSE CHAR(1),\n    SCORE INT DEFAULT 0,\n    FOREIGN KEY (HOUSE) REFERENCES HOUSELIST(HOUSE),\n    CHECK (SCORE >= 0)\n)', cap: '其他限制有助**數據有效性檢驗**（p.37）。' },
        { table: { head: ['關鍵字', '作用'], rows: [
          ['`PRIMARY KEY`', '值獨一無二，而且不能是 NULL；其他數據表的外鍵碼或會參照它'],
          ['`NOT NULL`', '值不能是 NULL'],
          ['`UNIQUE`', '值必須獨一無二（但可以是 NULL）'],
          ['`FOREIGN KEY`', '值必須來自父數據表的主關鍵碼'],
          ['`DEFAULT 0`', '沒有提供值時，預設為 0'],
          ['`CHECK (SCORE >= 0)`', '每項記錄都要符合條件'],
        ] }, cap: '表 1.3 常見限制（p.37）。一個欄位可以有多個關鍵字，例如 `NAME VARCHAR(40) NOT NULL DEFAULT \'TBA\'`；一個關鍵字也可以套用到多個欄位，例如 `UNIQUE(CLASS, CNO)`。' },
        { pts: [
          '**AUTO_INCREMENT**（擴闊視野）：套用於主關鍵碼欄位，插入記錄時不用提供值，由 1 開始自動分配。（p.38）',
          '冗餘欄位：可以在其他欄位或數據表找到的數據，例如 GID = PCODE + GCODE、SHOP 中經理的 SEX 可在 MANAGER 找到。（p.40–41）',
        ] },
      ],
      practice: [
        { id: 'a1b-s3-p1', type: 'mc', pts: 2, src: '教科書 p.41 測試站 1.4(b)',
          q: '規則：「所有店舖都不應於 08:00 前開始營業」。SHOP 的 OPEN 欄位（TIME）應加上哪個限制？',
          options: ['DEFAULT \'08:00\'', 'CHECK (OPEN >= \'08:00\')', 'CHECK (OPEN > \'08:00\')', 'UNIQUE(OPEN)'], answer: 1,
          hint: '08:00 本身是可以的。' },
        { id: 'a1b-s3-p2', type: 'mc', pts: 2, src: '教科書 p.41 測試站 1.4(b)',
          q: '規則：「默認開始營業時間為 09:00」及「OPEN 不能為空」。哪一個欄位定義正確？',
          options: ['OPEN TIME NOT NULL DEFAULT \'09:00\'', 'OPEN TIME UNIQUE DEFAULT \'09:00\'', 'OPEN DATE NOT NULL DEFAULT \'09:00\'', 'OPEN TIME DEFAULT NULL'], answer: 0,
          hint: '時間用 TIME 類型；不能為空是 NOT NULL。' },
        { id: 'a1b-s3-p3', type: 'fill', pts: 2, src: '教科書 p.37 表 1.3、p.41 測試站 1.4(b)',
          q: '寫出限制的關鍵字。\n(a) 規則「店舖不應共用店名」：SNAME 要加上什麼？\n(b) 規則「NAME 的值不能是 NULL」：NAME 要加上什麼？',
          blanks: [{ label: '(a)', a: 'UNIQUE', accept: ['unique'] }, { label: '(b)', a: 'NOT NULL', accept: ['not null'] }],
          hint: '「不可重複」和「不能為空」。' },
        { id: 'a1b-s3-p4', type: 'mc', pts: 2, src: '教科書 p.56 課後練習第 3(a) 題',
          q: 'PLAYER 以 `PTYPE INT DEFAULT 3` 和 `SCORE1 CHAR(2)` 定義。執行 `INSERT INTO PLAYER (PID, SCORE1, SCORE2) VALUES (\'001\', \'1\', 4)` 後，`SELECT * FROM PLAYER WHERE PID = \'001\'` 的輸出是什麼？',
          options: ['001 | NULL | 1 | 4', '001 | 3 | 1 | 4', '001 | 0 | 1 | 4', '出錯，因為沒有提供 PTYPE'], answer: 1,
          hint: '沒有提供值的欄位會取默認值。' },
        { id: 'a1b-s3-p5', type: 'mc', pts: 2, src: '教科書 p.41 測試站 1.4(c)',
          q: 'SHOP(SID, SNAME, OPEN, PHONE, SEX) 的 PHONE 是參照 MANAGER(MNAME, PHONE, SEX) 的外鍵碼。SHOP 的哪個欄位是冗餘的？',
          options: ['SID', 'SNAME', 'PHONE', 'SEX'], answer: 3,
          hint: '可以在另一個數據表找到的數據。', why: '經理的性別可以經 PHONE 在 MANAGER 找到；PHONE 不能刪除，因為它是連接兩個數據表的外鍵碼。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '更改數據表結構', pages: '教科書 p.42–50',
      learn: [
        { table: { head: ['要做的事', 'SQL 語句'], rows: [
          ['重新命名數據表', '`ALTER TABLE STUDNET RENAME STUDENT`'],
          ['加入欄位（可附限制）', '`ALTER TABLE STUDENT ADD NAME VARCHAR(40) DEFAULT \'John\'`'],
          ['重新命名欄位', '`ALTER TABLE STUDENT RENAME COLUMN LAME TO NAME`'],
          ['更改數據類型', '`ALTER TABLE STUDENT MODIFY SID INT`'],
          ['刪除欄位', '`ALTER TABLE STUDENT DROP CNO`'],
          ['加入／刪除主關鍵碼', '`ALTER TABLE STUDENT ADD PRIMARY KEY (SID)`／`ALTER TABLE STUDENT DROP PRIMARY KEY`'],
          ['加入／刪除外鍵碼', '`ALTER TABLE STUDENT ADD FOREIGN KEY (CLASS) REFERENCES CLASSLIST(CLASS)`／`… DROP FOREIGN KEY STUDENT_IBFK_1`'],
        ] }, cap: 'p.42–46。部分變更可能**損失數據**，要小心。' },
        { pts: [
          '加入的新欄位沒有默認值的話，所有現存記錄在該欄都是 NULL；有 DEFAULT 便填上默認值。（p.42–43）',
          '更改數據類型時，DBMS 嘗試轉換所有值：\'03493\' 轉為 INT 變成 3493（前置零消失）；有任何值無法轉換，整個欄位都不能轉換。（p.44）',
          '刪除欄位後，即使再加入同名欄位，數據也無法復原。（p.44）',
          '加入限制前，現存數據不能違反它：SID 有重複值或 NULL，便不能設為主關鍵碼；CLASS 有 CLASSLIST 中不存在的值，便不能設為外鍵碼。（p.45–46）',
          '數據表只有一個主關鍵碼，所以 `DROP PRIMARY KEY` 不用寫欄名；外鍵碼可以有多個，刪除時要寫**限制名稱**，可用 `SHOW CREATE TABLE STUDENT` 查看（例如 STUDENT_IBFK_1）。（p.45–46）',
        ] },
        { table: { head: ['作用', 'SQL 語句'], rows: [
          ['加入／刪除 NOT NULL', '`ALTER TABLE STUDENT MODIFY NAME CHAR(16) NOT NULL`／`ALTER TABLE STUDENT MODIFY NAME CHAR(16)`'],
          ['加入／刪除 UNIQUE', '`ALTER TABLE STUDENT ADD UNIQUE(EMAIL)`／`ALTER TABLE STUDENT DROP INDEX EMAIL`'],
          ['加入／刪除 DEFAULT', '`ALTER TABLE STUDENT ALTER NAME SET DEFAULT \'John\'`／`ALTER TABLE STUDENT ALTER NAME DROP DEFAULT`'],
          ['加入／刪除 CHECK', '`ALTER TABLE STUDENT ADD CHECK (CNO > 0)`／`ALTER TABLE STUDENT DROP CHECK STUDENT_CHK_1`'],
        ] }, cap: '表 1.4 加入或刪除其他限制（p.47）' },
        { sim: { db: 'user', sql: 'UPDATE USER SET MTYPE = \'Bronze\' WHERE MTYPE = \'Premium\';\nSELECT * FROM USER ORDER BY MTYPE' }, cap: '例題 1.5(b)、(c)（p.47–48）：高級用戶改為銅級，再按會籍遞升排列。字串按字母順序排序。' },
      ],
      practice: [
        { id: 'a1b-s4-p1', type: 'mc', pts: 2, src: '教科書 p.47–48 例題 1.5(a)',
          q: '把欄位 MTYPE 加入數據表 USER，默認值是 \'Regular\'。哪一句正確？',
          options: ['ALTER TABLE USER ADD MTYPE CHAR(7) DEFAULT \'Regular\'', 'ALTER TABLE USER MODIFY MTYPE CHAR(7) DEFAULT \'Regular\'', 'ALTER TABLE USER ADD MTYPE CHAR(5) DEFAULT \'Regular\'', 'UPDATE USER SET MTYPE = \'Regular\''], answer: 0,
          hint: '加入新欄位用 ADD；\'Regular\' 有 7 個字符。' },
        { id: 'a1b-s4-p2', type: 'mc', pts: 2, src: '教科書 p.47–48 例題 1.5(c)(ii)', db: 'user',
          sql: 'UPDATE USER SET MTYPE = \'Bronze\' WHERE MTYPE = \'Premium\'; SELECT DISTINCT MTYPE FROM USER ORDER BY MTYPE', ask: { col: 'MTYPE' }, verify: true,
          q: '高級用戶改為銅級後，會籍有 Regular、Bronze、Silver、Gold 四種。`ORDER BY MTYPE`（遞升）會怎樣排列會籍？',
          options: ['Regular, Bronze, Silver, Gold', 'Bronze, Silver, Gold, Regular', 'Bronze, Gold, Regular, Silver', 'Gold, Silver, Bronze, Regular'], answer: 2,
          hint: '字串按字母順序：B、G、R、S。' },
        { id: 'a1b-s4-p3', type: 'mc', pts: 2, src: '教科書 p.49 測試站 1.5(b)',
          q: 'BOOKCLUB 已有 500 多項記錄。`ALTER TABLE BOOKCLUB ADD MEMID INT PRIMARY KEY` 能否執行？',
          options: ['能，DBMS 會自動為每項記錄編號', '不能：新欄位在所有記錄的值都相同（0 或 NULL），違反 PRIMARY KEY 限制', '不能：INT 不可以做主關鍵碼', '能，但要先刪除所有記錄'], answer: 1,
          hint: '主關鍵碼不能是 NULL，也不能重複。', why: '新欄位沒有值，所有記錄都是 NULL 或 0（重複），所以不能加入。（AUTO_INCREMENT 才會自動編號。）' },
        { id: 'a1b-s4-p4', type: 'fill', pts: 2, src: '教科書 p.49 測試站 1.5(a)、(c)',
          q: '完成 SQL 語句。\n(a) 把 HKID 從 BOOKCLUB 中移除：`ALTER TABLE BOOKCLUB ［?］ HKID`\n(b) 加入欄位 SCORE，默認值 55.5：`ALTER TABLE BOOKCLUB ADD SCORE FLOAT ［?］ 55.5`',
          blanks: [{ label: '(a)', a: 'DROP', accept: ['drop'] }, { label: '(b)', a: 'DEFAULT', accept: ['default'] }],
          hint: '刪除欄位用 DROP；默認值用 DEFAULT。' },
        { id: 'a1b-s4-p5', type: 'mc', pts: 2, src: '教科書 p.44',
          q: 'STUDENT 的 SID 是 CHAR(5)，有值 \'03493\'、\'03496\'。執行 `ALTER TABLE STUDENT MODIFY SID INT` 後，SID 的值會怎樣？',
          options: ['不變：\'03493\'、\'03496\'', '變成 3493、3496', '全部變成 NULL', '出錯，字串不能轉為數字'], answer: 1,
          hint: '數值不保留前置零。', why: '轉換數據類型可能損失數據，所以更改前要小心。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '分析題', pages: '教科書 p.33–50、p.53',
      intro: '每一行選出正確的答案，然後按「提交評核」。',
      tasks: [
        { id: 'a1b-w1', kind: 'table', tier: '必做', pts: 12, title: '語句能否執行？', src: '教科書 p.33–37（表 1.3）',
          q: 'STUDENT1A 按 p.37 定義：SID 是主關鍵碼；NAME NOT NULL；CNO UNIQUE；HOUSE 參照 HOUSELIST(HOUSE)；SCORE DEFAULT 0；CHECK (SCORE >= 0)。\nHOUSELIST 有 R、G、B、Y 四社。STUDENT1A 原有一項記錄 (\'03493\', \'Ada\', 1, \'R\', 70)。\n以下語句**依次**執行，判斷每句能否執行及原因。',
          prompt: 'STUDENT1A 按 p.37 定義：SID 是主關鍵碼；NAME NOT NULL；CNO UNIQUE；HOUSE 參照 HOUSELIST(HOUSE)；SCORE DEFAULT 0；CHECK (SCORE >= 0)。\nHOUSELIST 有 R、G、B、Y 四社。STUDENT1A 原有一項記錄 (\'03493\', \'Ada\', 1, \'R\', 70)。\n以下語句**依次**執行，判斷每句能否執行及原因。',
          head: ['SQL 語句', '能否執行？', '原因'], opts: { Y: YN, R: REASONS },
          rows: [
            ['`INSERT INTO STUDENT1A VALUES (\'03496\', \'Clem\', 2, \'G\', 80)`', { sel: 'Y', a: '能' }, { sel: 'R', a: REASONS[0] }],
            ['`INSERT INTO STUDENT1A VALUES (\'03493\', \'Eva\', 3, \'B\', 60)`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[1] }],
            ['`INSERT INTO STUDENT1A (SID, CNO, HOUSE) VALUES (\'03505\', 3, \'B\')`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[2] }],
            ['`INSERT INTO STUDENT1A VALUES (\'03506\', \'Gabe\', 1, \'Y\', 50)`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[3] }],
            ['`INSERT INTO STUDENT1A VALUES (\'03510\', \'Finn\', 5, \'P\', 40)`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[4] }],
            ['`INSERT INTO STUDENT1A VALUES (\'03513\', \'Dio\', 6, \'R\', -5)`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[6] }],
            ['`INSERT INTO STUDENT1A (SID, NAME, CNO, HOUSE) VALUES (\'03517\', \'Ben\', 7, \'G\')`', { sel: 'Y', a: '能' }, { sel: 'R', a: REASONS[0] }],
            ['`DELETE FROM HOUSELIST WHERE HOUSE = \'G\'`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[5] }],
            ['`UPDATE STUDENT1A SET SID = \'03496\' WHERE NAME = \'Ben\'`', { sel: 'Y', a: '不能' }, { sel: 'R', a: REASONS[1] }],
            ['`DELETE FROM HOUSELIST WHERE HOUSE = \'Y\'`', { sel: 'Y', a: '能' }, { sel: 'R', a: REASONS[0] }],
          ],
          hint: '逐句記下數據表的變化：只有「能」執行的語句才會改變數據。Ben 沒有提供 SCORE，會取默認值 0（符合 CHECK）。Gabe 沒有插入成功，所以沒有學生屬 Y 社。' },
        { id: 'a1b-w2', kind: 'table', tier: '進階', pts: 12, title: '選出合適的 ALTER TABLE 語句', src: '教科書 p.42–47、表 1.4',
          q: '為每項工作選出合適的 SQL 語句。',
          prompt: '為每項工作選出合適的 SQL 語句。',
          head: ['要做的事', 'SQL 語句'], opts: { S: ALTERS },
          rows: [
            ['數據表名稱串錯了，把 STUDNET 改為 STUDENT', { sel: 'S', a: ALTERS[0] }],
            ['加入儲存學生姓名的欄位', { sel: 'S', a: ALTERS[1] }],
            ['欄位名稱 LAME 串錯了，改為 NAME', { sel: 'S', a: ALTERS[2] }],
            ['SID 應為整數欄位', { sel: 'S', a: ALTERS[3] }],
            ['不再需要學號 CNO', { sel: 'S', a: ALTERS[4] }],
            ['把現存欄位 SID 設為主關鍵碼', { sel: 'S', a: ALTERS[5] }],
            ['不再以 SID 作主關鍵碼', { sel: 'S', a: ALTERS[6] }],
            ['電郵地址 EMAIL 不可重複', { sel: 'S', a: ALTERS[7] }],
            ['沒有提供姓名時，預設為 John', { sel: 'S', a: ALTERS[8] }],
            ['學號必須大於 0', { sel: 'S', a: ALTERS[9] }],
            ['刪除參照 CLASSLIST 的外鍵碼（限制名稱 STUDENT_IBFK_1）', { sel: 'S', a: ALTERS[10] }],
          ],
          hint: 'RENAME 數據表／RENAME COLUMN 欄位；ADD 加入；MODIFY 改數據類型；DROP 刪除；ALTER … SET DEFAULT 設定默認值。' },
        { id: 'a1b-w3', kind: 'table', tier: '挑戰', pts: 11, title: '主關鍵碼與外鍵碼', src: '教科書 p.53 課後練習第 1(a) 題、p.39–41 例題 1.4、測試站 1.4',
          q: '為每個數據表選出主關鍵碼和外鍵碼。如沒有適合的關鍵碼，選「N/A」。\n• MEMBER(MEMID, MEMNAME, REGDATE)；CHESS(CHESSID, CNAME, ORIGIN)；INTEREST(MCID, MEMID, CHESSID) 儲存會員感興趣的棋類。\n• GAME(PCODE, GCODE, GID, GNAME, GENREID, PRICE)，GID = PCODE + GCODE；主關鍵碼只選一個欄位。\n• SHOP(SID, SNAME, OPEN, PHONE, SEX)；MANAGER(MNAME, PHONE, SEX)。',
          prompt: '為每個數據表選出主關鍵碼和外鍵碼。如沒有適合的關鍵碼，選「N/A」。\n• MEMBER(MEMID, MEMNAME, REGDATE)；CHESS(CHESSID, CNAME, ORIGIN)；INTEREST(MCID, MEMID, CHESSID) 儲存會員感興趣的棋類。\n• GAME(PCODE, GCODE, GID, GNAME, GENREID, PRICE)，GID = PCODE + GCODE；主關鍵碼只選一個欄位。\n• SHOP(SID, SNAME, OPEN, PHONE, SEX)；MANAGER(MNAME, PHONE, SEX)。',
          head: ['數據表', '主關鍵碼', '外鍵碼'], opts: { K: KEYS },
          rows: [
            ['MEMBER', { sel: 'K', a: 'MEMID' }, { sel: 'K', a: 'N/A' }],
            ['CHESS', { sel: 'K', a: 'CHESSID' }, { sel: 'K', a: 'N/A' }],
            ['INTEREST', { sel: 'K', a: 'MCID' }, { sel: 'K', a: 'MEMID、CHESSID' }],
            ['GAME', { sel: 'K', a: 'GID' }, { sel: 'K', a: 'PCODE、GENREID' }],
            ['SHOP', { sel: 'K', a: 'SID' }, { sel: 'K', a: 'PHONE' }],
            ['MANAGER', { sel: 'K', a: 'PHONE' }, { sel: 'K', a: 'N/A' }],
          ],
          hint: '外鍵碼要參照另一數據表的主關鍵碼：INTEREST 連接 MEMBER 和 CHESS；SHOP 經 PHONE 連接 MANAGER。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.40、p.49–50、p.54–56',
      items: [
        { id: 'a1b-q1', pts: 5, src: '教科書 p.55 課後練習第 2(a) 題（參考 DSE 2018 2A Q4）', tags: [HOT_KEY],
          q: 'ROOM 以 `PRIMARY KEY (FLOOR, RNUM)` 創建。執行 `ALTER TABLE ROOM ADD PRIMARY KEY (RID)` 能否把 RID 設為主關鍵碼？',
          options: ['能，RID 會取代原有的主關鍵碼', '能，ROOM 會有兩個主關鍵碼', '不能，ROOM 已有主關鍵碼，要先 DROP PRIMARY KEY', '不能，RID 是整數'], answer: 'C',
          why: '每個數據表只可以有一個主關鍵碼（可以是複合鍵）。' },
        { id: 'a1b-q2', pts: 5, src: '教科書 p.56 課後練習第 3(d) 題（參考 DSE 2012 PP 2A Q1）',
          q: '玩家參與兩輪遊戲便獲安慰獎，未參加其中一輪則沒有獎項。子謙建議把 SCORE1 和 SCORE2 的默認值設為 0。你同意嗎？',
          options: ['同意，0 分代表沒有參加', '不同意：參加了但得 0 分與沒有參加會無法分辨；應保留 NULL 代表沒有參加', '同意，NULL 不能儲存在數據表中', '不同意：DEFAULT 只可用於字串欄位'], answer: 'B',
          why: '0 是分數，NULL 代表沒有值（p.18）。默認值 0 會令沒有參加的玩家也像得了 0 分。' },
        { id: 'a1b-q3', pts: 5, src: '教科書 p.50 測試站 1.5(f)',
          q: 'BOOKCLUB 的 BCGROUP 是會員所屬組別號碼；BCGROUP 數據表以 GNUM 為主關鍵碼。哪一句能確保 BOOKCLUB 中每項記錄都具有效的組別號碼？',
          options: ['ALTER TABLE BCGROUP ADD FOREIGN KEY (GNUM) REFERENCES BOOKCLUB (BCGROUP)', 'ALTER TABLE BOOKCLUB ADD FOREIGN KEY (BCGROUP) REFERENCES BCGROUP (GNUM)', 'ALTER TABLE BOOKCLUB ADD PRIMARY KEY (BCGROUP)', 'ALTER TABLE BOOKCLUB ADD CHECK (BCGROUP = GNUM)'], answer: 'B',
          why: '外鍵碼在主數據表（BOOKCLUB）中設定，參照父數據表（BCGROUP）的主關鍵碼 GNUM。' },
        { id: 'a1b-q4', pts: 5, src: '教科書 p.40 例題 1.4(d)',
          q: 'GAME 的 GID 由 PCODE 和 GCODE 組成，是冗餘的。PCODE 是參照 PUBLISHER 的外鍵碼。刪除冗餘欄位後，應如何設定主關鍵碼？',
          options: ['刪除 GID，改用複合鍵 PCODE + GCODE 作主關鍵碼', '刪除 PCODE 和 GCODE，保留 GID', '刪除 GID，改用 GNAME 作主關鍵碼', '刪除 GID，不設主關鍵碼'], answer: 'A',
          why: 'PCODE 用作識別發行商的外鍵碼，不能刪除，所以只能刪除 GID。' },
        { id: 'a1b-q5', pts: 5, src: '教科書 p.46',
          q: '要刪除 STUDENT 中參照 CLASSLIST 的外鍵碼，為什麼要先執行 `SHOW CREATE TABLE STUDENT`？',
          options: ['要確認 STUDENT 有記錄', '數據表可以有多個外鍵碼，刪除時要寫出外鍵碼的限制名稱（例如 STUDENT_IBFK_1）', '要先把外鍵碼改為主關鍵碼', '外鍵碼要先轉為 INT'], answer: 'B',
          why: '`ALTER TABLE STUDENT DROP FOREIGN KEY STUDENT_IBFK_1`。主關鍵碼只有一個，所以 `DROP PRIMARY KEY` 不用寫名稱。' },
      ],
    },
    // ------------------------------------------------------------------
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlDml', 'erCard'], intro: '隨機生成 INSERT／UPDATE／DELETE 之後數據表內容，及實體關係基數的題目。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
