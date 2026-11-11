/* 單元 a5b：數據冗餘、異常與規範化（1NF、2NF、3NF）、非規範化、數據私隱
 * 教科書 選修A 第 5 章 p.277–307（例題 5.4–5.6、測試站 5.5–5.7、活動 5.2、實驗站 5.1、課題練習 p.305–307）
 * 所有 SQL 答案在 build 時由引擎計算／核對；功能相關性題（fd）由 FDX 計算。
 * 本平台的模擬器不支援 CREATE TABLE／CREATE VIEW，所以只執行其中的 SELECT 部分。
 *
 * // 教科書疑似錯誤：p.291–292 CLASSLIST 的主關鍵碼是 CLASS，但表中 3B 重複了三次（共 5 行），違反實體完整性；應只有 3 行
 * //   （SELECT DISTINCT CLASS, CTEACH）。若照書中 5 行執行 p.292 的四表連接，結果是 18 行而不是書中的 8 行。本單元用 3 行版本，並以練習題展示此問題。
 * // 教科書疑似錯誤：p.279 插入異常例子中，插班生 Dio 的 SID 印作 03496，與 Clem 相同（應為新的 SID）。
 * // 教科書疑似錯誤：p.282 測試站 5.5 數據表結構列出 SADD（店舖地址），但數據的欄名是 SLOCAT；又寫「SHOP 的主關鍵碼是 PID+SID」，數據表名稱應為 PROD。本單元用 SLOCAT。
 * // 教科書疑似錯誤：p.290「假設我們知道某個學生的識別碼（CLASS）」應為「班別（CLASS）」（文字版已註明原文如此）。
 * // 教科書疑似錯誤：p.301 例題 5.6(d) 答案 CREATE VIEW … FROM PARTICIPANT，但數據表名稱是 P。
 * // 教科書疑似錯誤：p.302 測試站 5.7(a) 答案的數據表名稱印作 STUDNET（文字版已註明）。
 */
const C = (...ls) => ls.join('\n');
const HOT_NF = { t: 'hot', why: '指出功能相關性、判斷範式及規範化至 3NF（寫出模式、主關鍵碼、外鍵碼）：DSE 卷二A 長題目幾乎每年都考。' };
const HOT_ANO = { t: 'hot', why: '辨別更新／插入／刪除異常並舉例：DSE 卷二A 常考（教科書例題 5.4、測試站 5.5）。' };

const FLAT = [
  ['03493', 'Ada', '3A', 'Mrs Au', 2, 'Physics', 'Mr Poon', 0], ['03496', 'Clem', '3B', 'Mr Bao', 1, 'History', 'Ms Ho', 78],
  ['03496', 'Clem', '3B', 'Mr Bao', 2, 'Physics', 'Mr Poon', 98], ['03496', 'Clem', '3B', 'Mr Bao', 3, 'ICT', 'Mr Suen', 89],
  ['03505', 'Eva', '3B', 'Mr Bao', 1, 'History', 'Ms Ho', 83], ['03506', 'Gabe', '3C', 'Ms Chau', 2, 'Physics', 'Mr Poon', 47],
  ['03506', 'Gabe', '3C', 'Ms Chau', 3, 'ICT', 'Mr Suen', 74], ['03510', 'Finn', '3B', 'Mr Bao', 3, 'ICT', 'Mr Suen', 53]];
const ST3 = [['03493', 'Ada', '3A'], ['03496', 'Clem', '3B'], ['03505', 'Eva', '3B'], ['03506', 'Gabe', '3C'], ['03510', 'Finn', '3B']];
const EL3 = [[1, 'History', 'Ms Ho'], [2, 'Physics', 'Mr Poon'], [3, 'ICT', 'Mr Suen']];
const EN8 = [['03493', 2, 0], ['03496', 1, 78], ['03496', 2, 98], ['03496', 3, 89], ['03505', 1, 83], ['03506', 2, 47], ['03506', 3, 74], ['03510', 3, 53]];
const FD_FLAT = 'SID->SNAME,CLASS,CTEACH; EID->ENAME,ETEACH; SID,EID->SCORE';
const AT_FLAT = 'SID SNAME CLASS CTEACH EID ENAME ETEACH SCORE';
const JOIN4 = C('SELECT s.SID, SNAME, c.CLASS, CTEACH, e.EID, ENAME, ETEACH, SCORE', 'FROM STUDENT s, CLASSLIST c, ENROL en, ELECTIVE e', 'WHERE s.SID = en.SID AND en.EID = e.EID AND s.CLASS = c.CLASS');

module.exports = {
  id: 'a5b',
  title: '數據冗餘、異常與規範化',
  book: '教科書 選修A 第 5 章 p.277–307',
  key: 'A-a5b-hmac-3f59b9b5fa',
  theory: false,
  dbs: {
    // p.277：未規範化（主關鍵碼 SID+EID）
    flat: { STUDENT: [['SID', 'SNAME', 'CLASS', 'CTEACH', 'EID', 'ENAME', 'ETEACH', 'SCORE'], FLAT, ['SID', 'EID']] },
    // p.288–292：規範化至 3NF（CLASSLIST 已更正為 3 行）
    norm: {
      STUDENT: [['SID', 'SNAME', 'CLASS'], ST3, ['SID']],
      CLASSLIST: [['CLASS', 'CTEACH'], [['3A', 'Mrs Au'], ['3B', 'Mr Bao'], ['3C', 'Ms Chau']], ['CLASS']],
      ELECTIVE: [['EID', 'ENAME', 'ETEACH'], EL3, ['EID']],
      ENROL: [['SID', 'EID', 'SCORE'], EN8, ['SID', 'EID']],
    },
    // p.291 照書中印出的 CLASSLIST（3B 重複三次）
    normbad: {
      STUDENT: [['SID', 'SNAME', 'CLASS'], ST3],
      CLASSLIST: [['CLASS', 'CTEACH'], [['3A', 'Mrs Au'], ['3B', 'Mr Bao'], ['3B', 'Mr Bao'], ['3C', 'Ms Chau'], ['3B', 'Mr Bao']]],
      ELECTIVE: [['EID', 'ENAME', 'ETEACH'], EL3],
      ENROL: [['SID', 'EID', 'SCORE'], EN8],
    },
    // p.281 例題 5.4（主關鍵碼 CID+PID）
    citizen: {
      CITIZEN: [['CID', 'CNAME', 'SEX', 'DOB', 'PID', 'PADDRESS', 'PTYPE'], [
        [4573, 'Adam', 'M', '1994-01-23', 835, 'GG Garden 6/F Flat B', 'Residential'], [4735, 'Beth', 'F', '2003-02-13', 358, 'CC City 11/F Flat C', 'Residential'],
        [4735, 'Beth', 'F', '2003-02-13', 583, 'BB Building 20/F Room 2012', 'Commercial'], [4753, 'Cid', 'M', '1998-03-12', 538, 'EE Estate 9/F Flat D', 'Residential'],
        [5347, 'Dee', 'F', '1997-03-21', 538, 'EE Estate 9/F Flat D', 'Residential'], [4735, 'Beth', 'F', '2003-02-13', 853, 'W Villa 23/F Flat F', 'Residential'],
        [5374, 'Ed', 'M', '2000-12-03', 853, 'W Villa 23/F Flat F', 'Residential'], [5374, 'Ed', 'M', '2000-12-03', 385, 'CC City 15/F Flat D', 'Commercial']], ['CID', 'PID']],
    },
    // p.282 測試站 5.5（主關鍵碼 PID+SID）
    prod: {
      PROD: [['PID', 'CAT', 'PNAME', 'SID', 'PRICE', 'STOCK', 'SNAME', 'SLOCAT', 'SKNAME'], [
        [1, 'C', 'T-shirt', 1, 79.9, 110, 'HomeZone', 'Tuen Mun', 'Cadan'], [2, 'A', 'Coffee Maker', 1, 400, 42, 'HomeZone', 'Tuen Mun', 'Cadan'],
        [3, 'D', 'Shampoo', 1, 42.1, 173, 'HomeZone', 'Tuen Mun', 'Cadan'], [4, 'A', 'Smartphone', 3, 2580, 89, 'FastTech', 'Shatin', 'Sam'],
        [5, 'B', 'Board game', 2, 156, 10, 'HappyToy', 'Tsing Yi', 'Tom'], [6, 'D', 'Lipstick', 1, 78.9, 167, 'HomeZone', 'Tuen Mun', 'Cadan'],
        [7, 'B', 'Toy gun', 2, 54.5, 50, 'HappyToy', 'Tsing Yi', 'Tom'], [8, 'B', 'Board game', 4, 168, 6, 'WitBoard', 'Nam Cheong', 'Bob'],
        [9, 'B', 'Dollhouse', 4, 388, 12, 'WitBoard', 'Nam Cheong', 'Bob']], ['PID', 'SID']],
    },
    // p.299 表 5.21（數據自擬）
    acct: {
      ACCOUNT: [['AID', 'USERNAME', 'SEX', 'PHONE', 'EMAIL', 'ATYPE', 'ENDOFSUB'], [
        [1001, 'amy88', 'F', '91234567', 'amy@mail.hk', 0, '2026-12-31'], [1002, 'bobo', 'M', '92345678', 'bob@mail.hk', 2, '2026-06-30'],
        [1003, 'cat_c', 'F', '93456789', 'cat@mail.hk', 1, '2027-01-31'], [1004, 'dannyw', 'M', '94567890', 'danny@mail.hk', 3, '2026-09-30'],
        [1005, 'eva_e', 'F', '95678901', 'eva@mail.hk', 1, '2026-11-30'], [1006, 'frank', 'M', '96789012', 'frank@mail.hk', 2, '2027-03-31']], ['AID']],
    },
    // p.300 例題 5.6（Kara 的隊友照書；其他參賽者自擬）
    game: {
      P: [['PNUM', 'TNUM', 'PNAME', 'SEX', 'HKID', 'DOB', 'ADDRESS', 'PHONE'], [
        ['313', 2, 'Connor', 'M', 'T248317(8)', '2001-04-02', 'Sha Tin', '61112222'], ['579', 2, 'Kara', 'F', 'T102694(6)', '2003-08-19', 'Tai Po', '62223333'],
        ['684', 2, 'Alice', 'F', 'T203307(5)', '2002-01-30', 'Mong Kok', '63334444'], ['500', 2, 'Markus', 'M', 'T842971(A)', '2000-11-11', 'Tsuen Wan', '64445555'],
        ['101', 1, 'Hank', 'M', 'T300001(1)', '1999-05-05', 'Central', '65556666'], ['102', 1, 'Gavin', 'M', 'T300002(2)', '2004-02-14', 'Yuen Long', '66667777'],
        ['205', 3, 'Chloe', 'F', 'T300003(3)', '2001-12-25', 'Tuen Mun', '67778888']], ['PNUM']],
    },
    // p.302 測試站 5.7（數據自擬）
    health: {
      STUDENT: [['SID', 'SNAME', 'EMAIL', 'SEX', 'AGE', 'WEIGHT', 'HEIGHT'], [
        ['S01', 'Amy', 'amy@sch.hk', 'F', 12, 40, 150], ['S02', 'Bella', 'bella@sch.hk', 'F', 14, 48, 163], ['S03', 'Cathy', 'cathy@sch.hk', 'F', 16, 52, 165],
        ['S04', 'Dick', 'dick@sch.hk', 'M', 13, 45, 158], ['S05', 'Elsa', 'elsa@sch.hk', 'F', 11, 38, 155], ['S06', 'Fred', 'fred@sch.hk', 'M', 15, 60, 172],
        ['S07', 'Gigi', 'gigi@sch.hk', 'F', 10, 33, 140]], ['SID']],
    },
  },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '數據冗餘與異常', pages: '教科書 p.277–283',
      learn: [
        { pts: [
          '數據表 STUDENT 同時儲存學生、選修科目及「學生修讀科目」三種數據，主關鍵碼是 `SID+EID`。Clem 的班別及班主任重複了三次；ICT 由 Mr Suen 教授也重複了三次。（p.277–278）',
          '**數據冗餘度**：重複的數據浪費儲存空間，並會引致三種**異常**。（p.278）',
        ] },
        { table: { head: ['異常', '意思', '例子（p.278–280）'], rows: [
          ['更新異常', '更新後無法維持數據一致', 'Clem 轉班，三項記錄都要改；只改一項便會不一致'],
          ['插入異常', '沒有一個實體類型的數據，便無法插入另一個實體類型的數據', '插班生未選科，EID 只能是 NULL，但主關鍵碼 SID+EID 不能是 NULL'],
          ['刪除異常', '刪除一個實體類型的數據，導致另一個實體類型的數據丟失', '3A 唯一的學生 Ada 退學，3A 班主任是誰便無從得知']] } },
        { sim: { db: 'flat', sql: C("UPDATE STUDENT SET ETEACH = 'Mrs Lee'", "WHERE ENAME = 'ICT'") },
          cap: 'p.279：Mrs Lee 代替 Mr Suen 教授 ICT。執行後看看要更新多少項記錄；若只更新其中一項，便出現更新異常。' },
        { warn: '例題 5.4(a)（p.281）：Adam 改為擁有另一物業。因主關鍵碼是 CID+PID，Adam 與舊物業只有一項記錄，更新**不會**不一致；但舊物業只由 Adam 擁有，改動後舊物業的數據便丟失——這是**刪除異常**，不是更新異常。' },
      ],
      tries: [
        { id: 'a5b-s1-t1', pts: 4, src: '教科書 p.279', db: 'flat', ask: { cell: [0, 'COUNT(*)'] },
          sql: C("UPDATE STUDENT SET ETEACH = 'Mrs Lee' WHERE ENAME = 'ICT';", "SELECT COUNT(*) FROM STUDENT WHERE ETEACH = 'Mrs Lee'"),
          q: '先估：要保持數據一致，Mrs Lee 接手 ICT 時要更新多少項記錄？', options: ['1', '2', '3', '8'],
          why: 'Clem、Gabe、Finn 三項 ICT 記錄都存有教師名字。數據重複得越多，更新異常的機會越大。' },
      ],
      practice: [
        { id: 'a5b-s1-p1', type: 'mc', pts: 2, src: '教科書 p.280 表 5.15', db: 'flat', verify: true, ask: { cell: [0, 'COUNT(*)'] }, tags: [HOT_ANO],
          sql: C("DELETE FROM STUDENT WHERE SNAME = 'Ada';", "SELECT COUNT(*) FROM STUDENT WHERE CLASS = '3A'"),
          q: 'Ada 退學，她的記錄被刪除。之後 STUDENT 還有多少項 3A 班的記錄？', options: ['0', '1', '2', '7'], answer: 0,
          hint: '3A 班有多少個學生？', why: '3A 的班主任資料（Mrs Au）也隨之丟失——刪除異常。' },
        { id: 'a5b-s1-p2', type: 'mc', pts: 2, src: '教科書 p.281–282 例題 5.4(b)、(c)', db: 'citizen', verify: true, ask: { cell: [0, 'COUNT(*)'] }, tags: [HOT_ANO],
          sql: C('SELECT COUNT(*)', 'FROM CITIZEN', "WHERE PADDRESS LIKE 'CC City%'"),
          q: 'CC City 被重新命名為 CC Court。以上語句找出須要更新的記錄數目，結果是什麼？', options: ['1', '2', '3', '8'], answer: 1,
          hint: 'CC City 有兩個物業。', why: 'CC City 11/F Flat C 和 CC City 15/F Flat D 各一項記錄，須更新兩項，可能出現更新異常。' },
        { id: 'a5b-s1-p3', type: 'mc', pts: 1, src: '教科書 p.283 測試站 5.5(c)', db: 'prod', verify: true, ask: { col: 'PNAME' },
          sql: C('SELECT PNAME', 'FROM PROD', 'WHERE SID IN (SELECT SID', '              FROM PROD', '              GROUP BY SID', '              HAVING COUNT(*) = 1)'),
          q: '以上語句找出「移除後會令店舖數據丟失」的產品。結果是什麼？', options: ['Smartphone', 'Board game', 'Dollhouse', 'Smartphone, Dollhouse'], answer: 0,
          hint: '哪間店舖只出售一種產品？', why: 'FastTech 只出售 Smartphone；移除它，FastTech 的地點和店主資料便丟失——刪除異常。' },
        { id: 'a5b-s1-p4', type: 'mc', pts: 1, src: '教科書 p.283 測試站 5.5(d)',
          q: 'PROD (PID, CAT, PNAME, SID, PRICE, STOCK, SNAME, SLOCAT, SKNAME) 的主關鍵碼是 PID+SID。以下哪個情況會出現**插入異常**？',
          options: ['HappyToy 的桌上遊戲減價', '經理要加入一間尚未出售任何產品的新店舖', 'HomeZone 更換店主', '移除 Smartphone'], answer: 1,
          hint: '主關鍵碼不能有 NULL。', why: '新店舖沒有 PID，無法插入。減價只改一項記錄，沒有異常；換店主是更新異常；移除 Smartphone 是刪除異常。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '第一範式與功能相關性', pages: '教科書 p.283–286',
      learn: [
        { pts: [
          '**規範化**：用特定方式設計數據庫，以減低數據冗餘度、防止異常、提升靈活度。常見等級：1NF、2NF、3NF。（p.283）',
          '**第一範式（1NF）**：(1) 每個屬性**不得包含多於一個值**；(2) **不得有重複屬性**（例如 ENAME1、ENAME2、ENAME3，或 LM1、LM2、LM3）。（p.283–284）',
          '規範化為 1NF：把多值分拆成**多項記錄**，例如 Clem 的「History, Physics, ICT」分拆為三項記錄，主關鍵碼變成 `SID+ENAME`。（p.285）',
          '**功能相關性** `X → Y`：知道 X 的值，便能獨一無二地決定 Y 的值。例如 `CLASS → CTEACH`：知道班別便知道班主任，但不能知道學生姓名。（p.285–286）',
        ] },
        { table: { head: ['SID', 'SNAME', 'CLASS', 'CTEACH', 'ENAME'], rows: [['03493', 'Ada', '3A', 'Mrs Au', 'Physics'], ['03496', 'Clem', '3B', 'Mr Bao', 'History, Physics, ICT'], ['03505', 'Eva', '3B', 'Mr Bao', 'History'], ['03506', 'Gabe', '3C', 'Ms Chau', 'Physics, ICT'], ['03510', 'Finn', '3B', 'Mr Bao', 'ICT']] },
          cap: 'p.284：ENAME 有多於一個值，不符合 1NF。' },
        { sim: { db: 'flat', sql: C('SELECT CLASS, COUNT(DISTINCT CTEACH)', 'FROM STUDENT', 'GROUP BY CLASS') },
          cap: '用數據檢查 `CLASS → CTEACH`：每個班別只對應 1 個班主任。試把 CTEACH 改為 SNAME。（注意：樣本數據只能「反證」一個功能相關性；相關性本身要根據數據的意義決定。）' },
        { pts: [
          'p.286 試想想：`SID → {SNAME, CLASS}`；`{SID, EID} → SCORE`（要知道某學生某科的分數，兩者缺一不可）。',
          '由 `SID → CLASS` 和 `CLASS → CTEACH`，可推出 `SID → CTEACH`。由 SID 出發能推出的所有屬性稱為 SID 的**閉包**。',
        ] },
      ],
      tries: [
        { id: 'a5b-s2-t1', pts: 4, src: '教科書 p.286', db: 'flat', ask: { col: 'CLASS' },
          sql: C('SELECT CLASS', 'FROM STUDENT', 'GROUP BY CLASS', 'HAVING COUNT(DISTINCT SNAME) > 1'),
          q: '先估：結果是什麼？', options: ['3B', '3B, 3C', '3A, 3B, 3C', '（沒有記錄）'],
          why: '3B 有 Clem、Eva、Finn 三個不同的姓名，所以 CLASS → SNAME **不**成立。3C 雖然有兩項記錄，但都是 Gabe。' },
      ],
      practice: [
        { id: 'a5b-s2-p1', type: 'mc', pts: 2, src: '教科書 p.294–295 例題 5.5(a)',
          q: 'ACTOR 有 7 項記錄，主關鍵碼 ID+FID。其中兩項記錄的 AWARD 各存了兩個獎項（例如 Aria 的「Best Actress (IFCS), Best Actress (OFCS)」）。轉換為第一範式後有多少項記錄？',
          options: ['7', '8', '9', '11'], answer: 2,
          hint: '每個獎項成為獨立的一項記錄。', why: '兩項記錄各多出一項：7 + 2 = 9。' },
        { id: 'a5b-s2-p2', type: 'mc', pts: 1, src: '教科書 p.297 測試站 5.6(a)', tags: [HOT_NF],
          q: 'CITY (CTID, CTNAME, TIMEZONE, AREA, POPULATION, LM1, LM2, LM3, CC, CNAME, HOS, CONTINENT)，LM1–LM3 是城市地標的名稱。CITY 符合第一範式嗎？',
          options: ['符合，因為每格只有一個值', '不符合，因為 LM1、LM2、LM3 是重複屬性', '不符合，因為 CTID 是主關鍵碼', '符合，因為沒有部分功能相關性'], answer: 1,
          hint: '1NF 有兩條規則。', why: '重複屬性違反 1NF；改為另建 LANDMARK (LMID, LMNAME, CTID) 數據表，便可容許多於三個地標。' },
        { id: 'a5b-s2-p3', type: 'fd', pts: 2, src: '教科書 p.286 試想想、p.290', ask: 'closure:SID',
          attrs: AT_FLAT, fds: 'SID->SNAME,CLASS; CLASS->CTEACH; EID->ENAME,ETEACH; SID,EID->SCORE',
          q: '功能相關性：SID → SNAME, CLASS；CLASS → CTEACH；EID → ENAME, ETEACH；SID, EID → SCORE。知道 SID，可以決定哪些屬性（SID 的閉包）？',
          options: ['SID, SNAME, CLASS', 'SID, SNAME, CLASS, CTEACH', 'SID, SNAME, CLASS, CTEACH, SCORE', 'SID, SNAME, CLASS, CTEACH, EID, ENAME, ETEACH, SCORE'], answer: 1,
          hint: '先加入 SNAME、CLASS；有了 CLASS 便可再加入 CTEACH。SCORE 需要 SID 和 EID。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '第二範式', pages: '教科書 p.286–289',
      learn: [
        { pts: [
          '**第二範式（2NF）**：(1) 符合 1NF；(2) **沒有部分功能相關性**。（p.285）',
          '**完全功能相關性**：所有非主關鍵碼屬性都依賴於**整個**主關鍵碼，例如 ELECTIVE 的 `EID → {ENAME, ETEACH}`。（p.286）',
          '**部分功能相關性**：有非主關鍵碼屬性只依賴於**部分**主關鍵碼。主關鍵碼 SID+EID 中，`SID → {SNAME, CLASS, CTEACH}`、`EID → {ENAME, ETEACH}` 都只依賴一部分；只有 SCORE 依賴整個 SID+EID。（p.287）',
          '只有主關鍵碼是**複合鍵**時，才可能有部分功能相關性。（p.287）',
          '規範化為 2NF：按功能相關性把數據表一分為三——STUDENT (SID, SNAME, CLASS, CTEACH)、ELECTIVE (EID, ENAME, ETEACH)、ENROL (SID, EID, SCORE)。（p.288）',
        ] },
        { sim: { db: 'flat', sql: C('SELECT DISTINCT SID, SNAME, CLASS, CTEACH', 'FROM STUDENT') },
          cap: '用 SELECT DISTINCT 從未規範化的數據表「抽出」2NF 的 STUDENT 數據表：重複的記錄消失了。' },
        { pts: [
          '活動 5.2（p.289）：規範化前，取消 ICT 會出現刪除異常、Gabe 改名會出現更新異常、接收插班生會出現插入異常；規範化後三種情況都**不會**出現異常。',
        ] },
      ],
      tries: [
        { id: 'a5b-s3-t1', pts: 4, src: '教科書 p.288', db: 'flat', ask: 'rows',
          sql: C('SELECT DISTINCT EID, ENAME, ETEACH', 'FROM STUDENT'),
          q: '先估：結果有多少行？', options: ['1', '3', '5', '8'],
          why: '只有三個選修科目，DISTINCT 去除重複後就是 2NF 的 ELECTIVE 數據表。' },
      ],
      practice: [
        { id: 'a5b-s3-p1', type: 'fd', pts: 2, src: '教科書 p.287', ask: 'keys', tags: [HOT_NF],
          attrs: AT_FLAT, fds: FD_FLAT,
          q: 'STUDENT (SID, SNAME, CLASS, CTEACH, EID, ENAME, ETEACH, SCORE) 的功能相關性：SID → SNAME, CLASS, CTEACH；EID → ENAME, ETEACH；SID, EID → SCORE。候選鍵碼是什麼？',
          options: ['SID', 'EID', 'SID, EID', 'SID, EID, SCORE'], answer: 2,
          hint: '要能推出所有屬性，而且最簡化。', why: 'SID 推不出 ENAME、SCORE；EID 推不出 SNAME；SID+EID 便足夠，SCORE 是多餘的。' },
        { id: 'a5b-s3-p2', type: 'fd', pts: 1, src: '教科書 p.287', ask: 'nf',
          attrs: AT_FLAT, fds: FD_FLAT,
          q: '同一個 STUDENT 數據表（假設每格只有一個值）最高符合哪一個範式？',
          options: ['1NF', '2NF', '3NF'], answer: 0,
          hint: 'SNAME 只依賴 SID（主關鍵碼的一部分）。', why: '有部分功能相關性，所以不符合 2NF。' },
        { id: 'a5b-s3-p3', type: 'complete', pts: 2, src: '教科書 p.288', db: 'flat',
          q: '再進一步規範化至 3NF 時，STUDENT 只保留 SID、SNAME、CLASS（CTEACH 移到 CLASSLIST）。從未規範化的 STUDENT 抽出這個數據表：三個欄位依此次序，每位學生只出現一次。',
          template: C('SELECT ［1］', 'FROM STUDENT'), ref: ['DISTINCT SID, SNAME, CLASS'],
          hint: 'Clem 和 Gabe 在原表有多項記錄，要用 DISTINCT。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '第三範式與非規範化', pages: '教科書 p.290–297',
      learn: [
        { pts: [
          '**第三範式（3NF）**：(1) 符合 2NF；(2) **沒有遞移功能相關性**。（p.290）',
          '**遞移功能相關性**：非主關鍵碼屬性依賴於**其他非主關鍵碼屬性**。例如 `SID → CLASS`、`CLASS → CTEACH`，所以 `SID → CTEACH` 是經 CLASS「轉介」而來的。（p.290）',
          '規範化為 3NF：把 `CLASS → CTEACH` 抽出成 CLASSLIST (CLASS, CTEACH)；STUDENT 保留 CLASS 作**外鍵碼**。（p.291）',
          '一句記住：每個非主關鍵碼屬性都依賴「**主關鍵碼、整個主關鍵碼、只依賴主關鍵碼**」。',
        ] },
        { table: { head: ['規則（p.305）', '1NF', '2NF', '3NF'], rows: [['每個屬性不包含多於一個值', '✓', '✓', '✓'], ['不包含重複屬性', '✓', '✓', '✓'], ['沒有部分功能相關性', '', '✓', '✓'], ['沒有遞移功能相關性', '', '', '✓']] } },
        { warn: '教科書 p.291 的 CLASSLIST 印了 5 行（3B 重複三次），但 CLASS 是主關鍵碼，不能重複；正確的 CLASSLIST 只有 3 行。本單元的數據庫已更正。' },
        { pts: [
          '**非規範化**：為了更快提取數據，刻意保留數據冗餘，例如把四個數據表的連接結果存成一個數據表 STUDENTDE。適合數據不常更新、只經常被提取的情況。（p.292–293）',
          '好處：提取更快、SQL 更簡單。壞處：需要更多儲存空間、難以靈活管理，並可能出現更新、插入、刪除異常。（p.294 表 5.20）',
        ] },
        { sim: { db: 'norm', sql: JOIN4 },
          cap: 'p.292：把 3NF 的四個數據表連接，便還原出原本的數據。實驗站 5.1 把這個結果用 `INSERT INTO STUDENTDE (SELECT …)` 存起來。' },
      ],
      tries: [
        { id: 'a5b-s4-t1', pts: 4, src: '教科書 p.292', db: 'norm', ask: 'rows',
          sql: JOIN4,
          q: '先估：這句四表連接傳回多少行？', options: ['5', '8', '18', '40'],
          why: 'ENROL 的每項記錄配對一個學生、一個班別、一個科目，所以共 8 行，與原本的 STUDENT 相同。' },
      ],
      practice: [
        { id: 'a5b-s4-p1', type: 'fd', pts: 1, src: '教科書 p.296 例題 5.5(d)', ask: 'nf', tags: [HOT_NF],
          attrs: 'FID FNAME FYEAR GENRE GDESC', fds: 'FID->FNAME,FYEAR,GENRE; GENRE->GDESC',
          q: 'FILM (FID, FNAME, FYEAR, GENRE) 加入欄位 GDESC（電影類型的描述）。功能相關性：FID → FNAME, FYEAR, GENRE；GENRE → GDESC。FILM 現在最高符合哪一個範式？',
          options: ['1NF', '2NF', '3NF'], answer: 1,
          hint: 'GDESC 依賴非主關鍵碼屬性 GENRE。', why: '主關鍵碼只有 FID，沒有部分功能相關性（2NF）；但 FID → GENRE → GDESC 是遞移功能相關性，所以不再符合 3NF。' },
        { id: 'a5b-s4-p2', type: 'mc', pts: 2, src: '教科書 p.298 測試站 5.6(e)', tags: [HOT_NF],
          q: 'CITY (CTID, CTNAME, TIMEZONE, AREA, POPULATION, CC, CNAME, HOS, CONTINENT) 已符合 2NF；CC 是國家地區代碼，CNAME、HOS、CONTINENT 是國家的資料。規範化至 3NF 後的模式是（＿ 表示主關鍵碼）：',
          options: ['CITY (CTID＿, CTNAME, TIMEZONE, AREA, POPULATION)；COUNTRY (CC＿, CNAME, HOS, CONTINENT)',
            'CITY (CTID＿, CTNAME, TIMEZONE, AREA, POPULATION, CC)；COUNTRY (CC＿, CNAME, HOS, CONTINENT)',
            'CITY (CTID＿, CTNAME, TIMEZONE, AREA, POPULATION, CC, CNAME)；COUNTRY (CC＿, HOS, CONTINENT)',
            'CITY (CTID＿, CC＿, CTNAME, TIMEZONE, AREA, POPULATION)；COUNTRY (CC＿, CNAME, HOS, CONTINENT)'], answer: 1,
          hint: 'CITY 要保留 CC 作外鍵碼，才可以連接到 COUNTRY。', why: '遞移相關 CTID → CC → CNAME, HOS, CONTINENT；把 CC 的資料抽出，CITY 保留 CC 作外鍵碼。' },
        { id: 'a5b-s4-p3', type: 'mc', pts: 1, src: '教科書 p.291–292（CLASSLIST 照書中印出 5 行）', db: 'normbad', verify: true, ask: 'rows',
          sql: JOIN4,
          q: '若 CLASSLIST 照書中印出的 5 行（3B 重複三次），同一句四表連接會傳回多少行？', options: ['5', '8', '18', '40'], answer: 2,
          hint: '3B 的學生每項記錄會配對到三行 CLASSLIST。', why: 'Ada 1 + Clem 3×3 + Eva 1×3 + Gabe 2 + Finn 1×3 = 18。主關鍵碼重複（違反實體完整性）會令連接結果出現重複記錄。' },
        { id: 'a5b-s4-p4', type: 'mc', pts: 1, src: '教科書 p.294 表 5.20、p.298 測試站 5.6(f)',
          q: '以下哪一項是**非規範化**的好處？',
          options: ['需要較少儲存空間', '不會出現更新異常', '提取數據更快，SQL 語句更簡單', '管理數據更靈活'], answer: 2,
          hint: '非規範化不用連接多個數據表。', why: '其餘三項都是規範化的好處。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's5', title: '數據私隱：存取權限與檢視', pages: '教科書 p.298–302',
      learn: [
        { pts: [
          '**數據私隱**：個人資料只可用於**原本的收集目的**，並避免披露予未經授權人士。（p.298）',
          '**用戶存取權限**：不同身份只獲授權進行需要的操作。數據庫模式設計員：CREATE、DROP、ALTER；帳戶管理員：INSERT、UPDATE、DELETE、SELECT；顧客：只可 UPDATE 及 SELECT 自身帳戶的數據。（p.299 表 5.22）',
          '**檢視（VIEW）**限制用戶只能看到部分數據（某些記錄或某些欄位）。（p.299–300）',
        ] },
        { code: C('CREATE VIEW AFILM AS', '    (SELECT * FROM ACCOUNT WHERE ATYPE IN (0, 1))'), cap: 'p.300：只負責電影串流（ATYPE 0、1）的客戶服務員只可看 AFILM。' },
        { sim: { db: 'acct', sql: C('SELECT *', 'FROM ACCOUNT', 'WHERE ATYPE IN (0, 1)') }, cap: '模擬器不支援 CREATE VIEW；這裏執行檢視中的 SELECT 部分，看看客戶服務員能看到哪些記錄（數據自擬）。' },
        { sim: { db: 'game', sql: C('SELECT PNAME, HKID, SEX, PNUM', 'FROM P', 'WHERE TNUM = (SELECT TNUM', "              FROM P", "              WHERE PNUM = '579')") },
          cap: '例題 5.6(a)（p.300–301）：用 Kara 的參賽者編號找出她的隊友。但網頁顯示隊友的**香港身份證號碼**，侵犯數據私隱——應從 SELECT 中刪去 HKID。' },
      ],
      tries: [
        { id: 'a5b-s5-t1', pts: 4, src: '教科書 p.300–301 例題 5.6(a)', db: 'game', ask: 'rows',
          sql: C('SELECT PNAME, HKID, SEX, PNUM', 'FROM P', 'WHERE TNUM = (SELECT TNUM', '              FROM P', "              WHERE PNUM = '579')"),
          q: '先估：結果有多少行？', options: ['1', '3', '4', '7'],
          why: '子查詢找出 Kara 的隊伍編號 2；隊伍 2 有 Connor、Kara、Alice、Markus 四人（包括 Kara 自己）。' },
      ],
      practice: [
        { id: 'a5b-s5-p1', type: 'mc', pts: 1, src: '教科書 p.300', db: 'acct', verify: true, ask: 'rows',
          sql: C('SELECT *', 'FROM ACCOUNT', 'WHERE ATYPE IN (0, 1)'),
          q: '檢視 AFILM 中有多少項記錄？', options: ['2', '3', '4', '6'], answer: 1,
          hint: 'ATYPE 0、1 是電影。', why: 'amy88、cat_c、eva_e 三個帳戶。' },
        { id: 'a5b-s5-p2', type: 'mc', pts: 1, src: '教科書 p.301 例題 5.6(c)',
          q: '每位參賽者只可以編輯自己在數據庫中的數據。應賦予他們哪項存取權限？（CREATE、INSERT、ALTER、UPDATE、DROP、DELETE）',
          options: ['CREATE', 'INSERT', 'UPDATE', 'DELETE'], answer: 2,
          hint: 'CREATE、ALTER、DROP 用於設計數據庫；INSERT、DELETE 用於管理記錄。', why: '編輯已有的記錄只需要 UPDATE。' },
        { id: 'a5b-s5-p3', type: 'fill', pts: 1, src: '教科書 p.302 測試站 5.7(a)', db: 'health',
          sql: C('SELECT AVG(HEIGHT)', 'FROM STUDENT', "WHERE SEX = 'F' AND AGE BETWEEN 11 AND 14"),
          q: '執行測試站 5.7(a) 的語句（數據自擬），年齡介乎 11 至 14 歲的女學生的平均身高是多少？',
          blanks: [{ label: 'AVG(HEIGHT)', ask: { cell: [0, 'AVG(HEIGHT)'] } }], hint: 'BETWEEN 包括 11 和 14；Cathy 16 歲、Gigi 10 歲不計。' },
        { id: 'a5b-s5-p4', type: 'mc', pts: 1, src: '教科書 p.302 測試站 5.7(b)、(d)',
          q: '學生身體檢查的數據存於 STUDENT。以下哪項正確？',
          options: ['醫生可用這些數據為醫療服務做定向廣告，因為數據是他收集的', '用數據做定向廣告並非原本的收集目的，會侵犯數據私隱；只負責搜索和匯出數據的研究人員應獲 SELECT 權限', '研究人員應獲 CREATE 和 DELETE 權限', '只要用檢視，便可以把數據用於任何目的'], answer: 1,
          hint: '數據只可用於原本的收集目的。', why: '定向廣告不是原本目的；研究人員只需讀取數據（SELECT）。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL：規範化數據表', pages: '教科書 p.286–293',
      intro: '第 1 題用未規範化的數據庫 `flat`；第 2、3 題用 3NF 的數據庫 `norm`：STUDENT (SID, SNAME, CLASS)、CLASSLIST (CLASS, CTEACH)、ELECTIVE (EID, ENAME, ETEACH)、ENROL (SID, EID, SCORE)。系統會再用另外的數據檢查你的語句。',
      tasks: [
        { id: 'a5b-w1', pts: 10, title: '抽出 CLASSLIST（3NF）', src: '教科書 p.291', db: 'flat',
          q: '未規範化的 STUDENT (SID, SNAME, CLASS, CTEACH, EID, ENAME, ETEACH, SCORE) 中有 `CLASS → CTEACH`。寫 SQL 產生 3NF 的 CLASSLIST 數據表：列出 CLASS 和 CTEACH，**每個班別只出現一次**（不要像教科書 p.291 那樣重複）。',
          starter: C('SELECT CLASS, CTEACH', 'FROM STUDENT'),
          ref: C('SELECT DISTINCT CLASS, CTEACH', 'FROM STUDENT'),
          hint: '用 DISTINCT 去除重複的記錄。' },
        { id: 'a5b-w2', pts: 12, title: '連接 3NF 數據表', src: '教科書 p.292', db: 'norm',
          q: '列出所有修讀 **Physics** 的學生的 SNAME 及其**班主任** CTEACH（用科目名稱 ENAME，不要直接寫 EID）。',
          starter: C('SELECT SNAME', 'FROM STUDENT'),
          ref: C('SELECT s.SNAME, c.CTEACH', 'FROM STUDENT s, CLASSLIST c, ENROL en, ELECTIVE e', "WHERE s.SID = en.SID AND en.EID = e.EID AND s.CLASS = c.CLASS AND e.ENAME = 'Physics'"),
          hint: "四個數據表需要三個連接條件，再加 `e.ENAME = 'Physics'`。" },
        { id: 'a5b-w3', pts: 13, title: '每科人數及最高分', src: '自擬（教科書 p.288 ELECTIVE、ENROL）', db: 'norm',
          q: '列出每個選修科目的 ENAME、修讀人數及最高分 SCORE（三個欄位依此次序）。',
          starter: C('SELECT ENAME, COUNT(*)', 'FROM ELECTIVE'),
          ref: C('SELECT e.ENAME, COUNT(*), MAX(en.SCORE)', 'FROM ELECTIVE e, ENROL en', 'WHERE e.EID = en.EID', 'GROUP BY e.ENAME'),
          hint: '連接 ELECTIVE 和 ENROL，再按 ENAME 分組；用 COUNT(*) 和 MAX(SCORE)。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.305–307',
      items: [
        { id: 'a5b-q1', pts: 4, src: '教科書 p.305–306 課題練習 1(b)', tags: [HOT_NF],
          q: '診所數據表 RECORD (PID, PNAME, SEX, AGE, DID, DNAME, DOA, DIAG)：PID／DID 是病人／醫生的識別碼，DOA 是預約日期，DIAG 是診斷。SEX 和 DNAME 分別依賴於哪個屬性？',
          options: ['SEX 依賴 PNAME；DNAME 依賴 DOA', 'SEX 依賴 PID；DNAME 依賴 DID', '兩者都依賴 PID+DID', 'SEX 依賴 DID；DNAME 依賴 PID'], answer: 'B',
          why: 'PID → PNAME, SEX, AGE；DID → DNAME。病人可能同名，所以不是 PNAME。' },
        { id: 'a5b-q2', pts: 4, src: '教科書 p.306 課題練習 1(c)', tags: [HOT_NF],
          q: '把 RECORD 規範化至第三範式，以下哪一組數據表最合適？',
          options: ['PATIENT (PID, PNAME, SEX, AGE)；DOCTOR (DID, DNAME)；APPOINTMENT (PID, DID, DOA, DIAG)',
            'PATIENT (PID, PNAME, SEX, AGE, DNAME)；APPOINTMENT (PID, DID, DOA, DIAG)',
            'PATIENT (PID, PNAME)；DOCTOR (DID, DNAME, SEX)；APPOINTMENT (PID, DID, DOA, DIAG, AGE)',
            'RECORD (PID, PNAME, SEX, AGE, DID, DNAME, DOA, DIAG) 已是 3NF'], answer: 'A',
          why: '病人和醫生的資料各成一表；APPOINTMENT 以 PID、DID 作外鍵碼，保存每次預約的日期和診斷。' },
        { id: 'a5b-q3', pts: 4, src: '教科書 p.306 課題練習 2(b)', tags: [{ t: 'trap', why: '沒有遞移功能相關性不代表符合 3NF：必須先符合 1NF、2NF。' }],
          q: 'ENROL (SID, CID1, CID2, CID3) 記錄學生報讀的課程。有人說「數據表沒有遞移功能相關性，所以符合第三範式」。為什麼這說法錯誤？',
          options: ['因為 SID 不可以是主關鍵碼', 'CID1、CID2、CID3 是重複屬性，連第一範式也不符合', '因為有部分功能相關性 CID1 → CID2', '因為 3NF 不容許外鍵碼'], answer: 'B',
          why: '3NF 必須先符合 1NF 和 2NF。應改為 ENROL (SID, CID)，主關鍵碼 SID+CID。' },
        { id: 'a5b-q4', pts: 4, src: '教科書 p.307 課題練習 3(a)、(c)', tags: [HOT_NF],
          q: 'QUESTION (YEAR, QUESTION, MARK, TCODE, TOTALMARK) 記錄每年考卷的題目：YEAR+QUESTION 是主關鍵碼，TOTALMARK 是該年考卷的總分。這個數據表為何不符合 3NF？',
          options: ['YEAR → TOTALMARK 是部分功能相關性，所以連 2NF 也不符合', 'TCODE → MARK 是遞移功能相關性', 'MARK 有多於一個值', '主關鍵碼不可以是複合鍵'], answer: 'A',
          why: '總分只依賴年份（主關鍵碼的一部分）；應把它抽出成 PAPER (YEAR, TOTALMARK)。' },
        { id: 'a5b-q5', pts: 4, src: '教科書 p.282 測試站 5.5(a)–(b)', tags: [HOT_ANO], db: 'prod', verify: true, ask: { cell: [0, 'COUNT(*)'] },
          sql: C('SELECT COUNT(*)', 'FROM PROD', "WHERE SNAME = 'HomeZone'"),
          q: 'HomeZone 的店主由 Cadan 換為 Abby。為避免更新異常，要更新多少項記錄？（以上語句計算）', options: ['1', '3', '4', '9'], answer: 'C',
          why: 'HomeZone 出售四種產品，店主名字重複了四次；只更新一項便會出現更新異常。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['fdKey', 'fdNf', 'sqlDml'], intro: '隨機生成候選鍵碼、範式判斷及 INSERT／UPDATE／DELETE 題目，答案由設計引擎及模擬器計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
