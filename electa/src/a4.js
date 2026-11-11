/* 單元 a4：關聯式數據庫——元素、模式、關鍵欄位、索引、完整性、回滾
 * 教科書 選修A 第 4 章 p.200–241（活動 4.1–4.6、例題 4.1–4.2、測試站 4.1–4.4、實驗站 4.1、課題練習 p.238–241）
 * 所有 SQL 答案在 build 時由引擎計算／核對。
 * 本平台的 SQL 引擎不會自動執行 PRIMARY KEY／FOREIGN KEY／CHECK 限制，
 * 所以本單元用 SELECT 查出「違反完整性」的記錄（DSE 卷二A 常見寫法）。
 *
 * // 教科書疑似錯誤：p.218「將主數據表 STUDENT 連接到父數據表 CLASS」——按上表應為 CLUB（文字版已註明原文如此）。
 * // 教科書疑似錯誤：p.220 例題 4.2(a) 答案「PNMAE」應為 PNAME；p.221 測試站 4.2 答案「ANMAE」「DATE」應為 ANAME、PDATE。
 * // 教科書疑似錯誤：p.231 活動 4.6 第 2 題 CLUB 數據表結構列出 TEACH 欄，但數據只有 CID、CNAME、LOCAT 三欄。
 * // 教科書疑似錯誤：p.232 測試站 4.3(c) 答案以 ADDRESS 作主關鍵碼，理由「兩家商店的地址不可能完全相同」，但同一地址可有多間店（如商場）；
 * //   本單元只按教科書答案出題，不以此作考核。
 * // 教科書疑似錯誤：p.240 課題練習 3 數據表名稱印作「ILM」，應為 FILM；p.239 TEAM 欄位「GOD」應為 GID。
 */
const C = (...ls) => ls.join('\n');
const HOT_KEY = { t: 'hot', why: '寫出模式、主關鍵碼及外鍵碼：DSE 卷二A 長題目幾乎每年都考（例如 2012 2A Q1、2014 2A Q2）。' };
const HOT_INT = { t: 'hot', why: '指出違反哪種完整性並解釋：參考 DSE 2012 2A Q1、Q4（教科書課題練習 1、2）。' };

const STU7 = [['03493', 'Ada', 'F', '3A', 2], ['03496', 'Clem', 'F', '3B', 1], ['03505', 'Eva', 'F', '3B', 4], ['03506', 'Gabe', 'M', '3C', 4], ['03510', 'Finn', 'M', '3B', 1], ['03513', 'Dio', 'M', '3C', 4], ['03517', 'Ben', 'M', '3A', null]];
const CLUB4 = [[1, 'Chess Club', 501, 'Mr Chan'], [2, 'Art Club', 402, 'Mrs Lee'], [3, 'English Club', 203, 'Mr Suen'], [4, 'Science Club', 502, 'Mr Wong']];

module.exports = {
  id: 'a4',
  title: '關聯式數據庫',
  book: '教科書 選修A 第 4 章 p.200–241',
  key: 'A-a4-hmac-5863e7ae67',
  theory: false,
  dbs: {
    // p.206、p.218、p.226：學生與學會
    club: {
      STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'CID'], STU7, ['SID']],
      CLUB: [['CID', 'NAME', 'ROOM', 'TEACH'], CLUB4, ['CID']],
    },
    // p.215：候選鍵碼與複合鍵
    keys: {
      STUDENT: [['SID', 'NAME', 'CLASS', 'CNO', 'EMAIL'], [
        ['03493', 'Ada', '3A', 1, 'ada@ict.edu'], ['03496', 'Clem', '3B', 15, 'clem@ict.edu'], ['03505', 'Eva', '3B', 28, 'eva@ict.edu'],
        ['03506', 'Gabe', '3C', 15, 'gabe@ict.edu'], ['03510', 'Finn', '3B', 7, 'finn@ict.edu'], ['03513', 'Dio', '3C', 12, 'dio@ict.edu'],
        ['03517', 'Ben', '3A', 9, 'ben@ict.edu']], ['SID']],
    },
    // p.218：學生與學會存於同一數據表（不建議）
    sc: {
      STUDENTCLUB: [['SID', 'NAME', 'SEX', 'CLASS', 'CNAME', 'CROOM', 'CTEACH'], [
        ['03493', 'Ada', 'F', '3A', 'Art Club', 402, 'Mrs Lee'], ['03496', 'Clem', 'F', '3B', 'Chess Club', 501, 'Mr Chan'],
        ['03505', 'Eva', 'F', '3B', 'Science Club', 502, 'Mr Wong'], ['03506', 'Gabe', 'M', '3C', 'Science Club', 502, 'Mr Wong'],
        ['03510', 'Finn', 'M', '3B', 'Chess Club', 501, 'Mr Chan'], ['03513', 'Dio', 'M', '3C', 'Science Club', 502, 'Mr Wong'],
        ['03517', 'Ben', 'M', '3A', null, null, null]], ['SID']],
    },
    // p.230 活動 4.6 第 1 題
    act46: {
      STUDENT: [['CLASS', 'CLASSNO', 'GENDER', 'SNAME'], [
        ['6A', 13, 'F', 'Mary Leung'], ['6A', 22, 'M', 'Ben Kwok'], ['6B', 37, 'M', 'Gary Wu'], ['6B', 4, 'M', 'Ken Cheung'],
        ['6A', 15, 'F', 'Mary Leung'], ['6A', 22, 'F', 'Yen Koo'], ['6B', 13, 'F', 'Lois Law']]],
    },
    // p.231 活動 4.6 第 2 題（SROW 有一個值是 'S'，所以整欄以文字儲存）
    seat: {
      STUDENT: [['SCLN', 'SROW', 'SNAME', 'SEX', 'CID'], [
        [1, '1', 'James Chiu', 'M', 4700], [1, '2', 'Mary Chin', 'F', 3196], [1, '3', 'Robert Suen', 'M', 3196], [1, '4', 'Patricia Lee', 'F', 1558],
        [1, 'S', 'John Chau', 'M', 4453], [2, '1', 'Jennifer Ng', 'F', 1558], [2, '2', 'Michael Cheng', 'M', 4700], [2, '3', 'Linda Wong', 'F', 3169]]],
      CLUB: [['CID', 'CNAME', 'LOCAT'], [[1558, 'Astronomy Club', 'Physics Lab'], [3196, 'Science Club', 'Science Lab'], [4453, 'Chess Club', 'ICT Lab'], [4700, 'English Club', 'Activity Room']], ['CID']],
    },
    // p.232 測試站 4.3(a)
    shop: {
      SHOP: [['SNAME', 'ADDRESS', 'OPEN', 'CLOSE'], [
        ['McReynaulds', 'TM WFS 6 No. 101', '09:00', '23:30'], ['Submarine', 'KLN LCR 23 Bldg. BH 413', '08:00', '19:30'],
        ['Kenneth Fish & Chips', 'HKI QR 14 CRO 508', '09:30', '20:90'], ['Sandwich Empress', 'TYS SDS 15 Blk HWM 12', '09:00', '21:00']]],
    },
    // p.223：索引表的數據表
    idx: {
      STUDENT: [['SID', 'NAME', 'SEX', 'CLASS'], [
        ['03369', 'Hans', 'M', '3C'], ['03405', 'Ivy', 'F', '3A'], ['03410', 'Jean', 'F', '3B'], ['03493', 'Ada', 'F', '3A'],
        ['03496', 'Clem', 'F', '3B'], ['03505', 'Eva', 'F', '3B'], ['03506', 'Gabe', 'M', '3C'], ['03510', 'Finn', 'M', '3B'],
        ['03513', 'Dio', 'M', '3C'], ['03517', 'Ben', 'M', '3A'], ['03518', 'Guy', 'M', '3D']], ['SID']],
    },
    // p.233：新學年升班（回滾）
    roll: {
      STUDENT: [['SID', 'NAME', 'SEX', 'CLASS'], [
        ['03369', 'Hans', 'M', '6A'], ['03405', 'Ivy', 'F', '6A'], ['03410', 'Jean', 'F', '6A'], ['03493', 'Ada', 'F', '5A'],
        ['03496', 'Clem', 'F', '5A'], ['03505', 'Eva', 'F', '5A'], ['03506', 'Gabe', 'M', '5A'], ['03510', 'Finn', 'M', '5A'],
        ['03513', 'Dio', 'M', '5A'], ['03517', 'Ben', 'M', '5A']], ['SID']],
    },
    // 寫 SQL：數據審核（自擬，故意加入違反完整性的記錄）
    audit: {
      STUDENT: [['SID', 'NAME', 'SEX', 'CLASS', 'CNO', 'CID'], [
        ['03493', 'Ada', 'F', '3A', 1, 2], ['03496', 'Clem', 'F', '3B', 15, 1], ['03505', 'Eva', 'F', '3B', 28, 4],
        ['03505', 'Gabe', 'M', '3C', 15, 4], ['03510', 'Finn', 'M', '3B', 7, 5], ['03513', 'Dio', 'M', '3C', 0, 4],
        ['03517', 'Ben', 'M', '3A', 9, null], ['03518', 'Guy', 'X', '3D', 12, 3], ['03520', 'Ivy', 'F', '3A', 31, 7],
        ['03496', 'Jean', 'F', '3B', 3, 1]]],
      CLUB: [['CID', 'NAME', 'ROOM', 'TEACH'], CLUB4, ['CID']],
    },
  },
  sections: [
    // ------------------------------------------------------------------
    {
      id: 's1', title: '關聯式數據庫的元素', pages: '教科書 p.202–212',
      learn: [
        { pts: [
          '**關聯式數據庫**以**數據表**組織數據；數據表由欄和列組成，每一列是一項**記錄**。（p.202）',
          '**實體**：一件實物（學生、產品）或一個概念（交易、課程），必須**獨一無二**。**實體類型**：一組擁有類似屬性的實體，例如「學生」。（p.203）',
          '**屬性**：實體的特性，例如學生的姓名、性別。**衍生屬性**可由其他屬性計算出來，例如由出生日期計算年齡、由開店及關店時間計算營業時數。（p.204–205）',
          '**關係**：實體之間的聯繫，用**動詞**表示，例如學生「加入」學會；在數據庫中以**外鍵碼**表示。（p.205–206）',
          '**域**：屬性所有可能的值，同一個域的值有相同的數據類型，例如班號 `{1 .. 30}`、性別 `{\'M\', \'F\'}`。（p.208）',
        ] },
        { table: { head: ['關聯式數據庫（表 4.1）', 'DBMS 中的表示'], rows: [['實體類型', '數據表'], ['實體', '記錄（一列，又稱元組）'], ['屬性', '欄位（一欄）'], ['關係', '外鍵碼'], ['域', '數據類型與限制']] } },
        { table: { head: ['數據類型（表 4.7）', '關鍵字', '例子'], rows: [
          ['整數', 'INT／INTEGER', '0、283、-19'], ['實數（浮點數／定點數）', 'FLOAT、DOUBLE／DECIMAL', '569.1、-27.382'],
          ['字符（固定／可變長度）', 'CHAR(n)／VARCHAR(n)', "'1B 23'、'007=jb'"], ['布爾', 'BOOL／BOOLEAN', '0 (FALSE)、1 (TRUE)'],
          ['日期與時間', 'DATE、TIME、DATETIME', "'2025-12-31'、'11:30:00'"]] } },
        { note: '以零開首的識別碼（例如學生編號 `03493`、六位數字 SID）要用**字符**，用整數會失去開首的 0；電話號碼 `3320-2310` 亦是字符。金額如 `30.9` 用**實數**。（p.210–211、p.219–220）' },
        { sim: { db: 'club', sql: C('SELECT S.NAME, C.NAME, C.ROOM', 'FROM STUDENT S, CLUB C', 'WHERE S.CID = C.CID') },
          cap: 'p.206：STUDENT 用外鍵碼 CID 參照 CLUB。按 ▶ 執行，看看每位學生加入了哪個學會。留意 Ben 的 CID 是 NULL。' },
      ],
      tries: [
        { id: 'a4-s1-t1', pts: 4, src: '教科書 p.206', db: 'club',
          sql: C('SELECT C.NAME', 'FROM STUDENT S, CLUB C', "WHERE S.CID = C.CID AND S.NAME = 'Eva'"), ask: { cell: [0, 'NAME'] },
          q: '先估：Eva 加入了什麼學會？', options: ['Science Club', 'Chess Club', 'Art Club', 'English Club'],
          why: 'Eva 的 CID 是 4，在 CLUB 中 CID 4 是 Science Club。' },
      ],
      practice: [
        { id: 'a4-s1-p1', type: 'mc', pts: 2, src: '教科書 p.205 活動 4.1 第 2 題',
          q: '以下哪組「實體類型｜屬性 X｜屬性 Y」的搭配是**錯誤**的？',
          options: ['書籍｜出版年份｜ISBN', '貨品｜存貨數量｜價格', '年齡｜患者｜性別', '交易｜日期｜時間'], answer: 2,
          hint: '實體類型是名詞，代表一組事物；屬性是它的特性。', why: '年齡是患者的屬性；患者才是實體類型。' },
        { id: 'a4-s1-p2', type: 'mc', pts: 2, src: '教科書 p.207 活動 4.2 第 2 題',
          q: '以下哪組「實體類型 X｜實體類型 Y｜關係」的搭配是**正確**的？',
          options: ['付款｜收款人｜Y 收到 X', '作者｜書籍｜X 由 Y 撰寫', '長度｜演唱會｜Y 佔用的時間為 X', '僱員｜公司｜X 僱用 Y'], answer: 0,
          hint: '小心主動語態和被動語態；屬性不是實體類型。', why: '作者撰寫書籍（不是由書籍撰寫）；長度是演唱會的屬性；公司僱用僱員。' },
        { id: 'a4-s1-p3', type: 'mc', pts: 1, src: '教科書 p.209 活動 4.3 第 2 題',
          q: '以下哪組「屬性｜域」的搭配是**不合理**的？',
          options: ['酒吧顧客的年齡｜不小於 18 的整數', '員工職銜｜最多 60 字的字串', "衣服尺碼｜{'XS', 'S', 'M', 'L', 'XL'}", "一星期中的一天｜{'1970-01-01' .. '2099-12-31'} 之間的一個日期"], answer: 3,
          hint: '「星期幾」只有七個可能的值。', why: '星期幾不是一個日期；域應是 {1 .. 7} 或星期一至日。' },
        { id: 'a4-s1-p4', type: 'mc', pts: 1, src: '教科書 p.210–211 例題 4.1(c)',
          q: '學生識別碼 SID 是獨一無二的六位號碼，部分號碼開首為零。SID 應使用哪種數據類型？',
          options: ['整數', '字符', '實數', '布爾'], answer: 1,
          hint: '把 012345 存為整數會變成什麼？', why: '整數會失去開首的 0，所以要用字符。' },
        { id: 'a4-s1-p5', type: 'mc', pts: 1, src: '教科書 p.209（STUDENT.CID 的域是 {1, 2, 3, 4, NULL}）', db: 'club', verify: true, ask: 'rows',
          sql: 'SELECT DISTINCT CID FROM STUDENT',
          q: '以上 SQL 語句傳回多少行？', options: ['3', '4', '5', '7'], answer: 1,
          hint: 'DISTINCT 會去除重複的值；NULL 也算作一行。', why: '結果是 2、1、4、NULL 四行。CID 3 是合法的值（在域內），只是現時沒有學生用。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's2', title: '模式與關鍵欄位', pages: '教科書 p.212–222',
      learn: [
        { pts: [
          '**模式**描述數據表的欄位，例如 `STUDENT (SID, NAME, CLASS, CNO, EMAIL)`；**主關鍵碼加底線**。（p.212–213）',
          '**候選鍵碼**：每項記錄都**獨一無二**、**不能是 NULL** 的欄位（或欄位組合），可用來識別記錄。（p.213–214）',
          '**複合鍵**：包含多個欄位的候選鍵碼，例如 `CLASS+CNO`。複合鍵必須**最簡化**：刪除任何一個欄位都會出現重複值。`SID+EMAIL` 不是複合鍵，因為 SID 本身已是候選鍵碼。（p.215）',
          '**主關鍵碼**：由數據庫管理員從候選鍵碼中選出；一個數據表可以有多個候選鍵碼，但**只有一個主關鍵碼**。應選不會改變的欄位：SID 比 CLASS+CNO（每年改變）和 EMAIL（可能更改）好。（p.216–217）',
          '**外鍵碼**：表示兩個數據表的記錄之間的**關係**。主數據表的外鍵碼是**父數據表的主關鍵碼**；外鍵碼可以重複，亦可以是 NULL。一個數據表可以有多個外鍵碼。（p.217–218、p.238）',
        ] },
        { table: { head: ['', '獨一無二', '可以是 NULL', '一個數據表有多少個'], rows: [
          ['候選鍵碼', '✓', '✗', '一個或多個'], ['主關鍵碼', '✓', '✗', '只有一個'], ['外鍵碼', '✗（可以重複）', '✓', '零個或多個']] } },
        { note: 'NULL 不等於 0：0 是一個數值（錢罌裏有 0 元），NULL 是「沒有數據」（根本沒有錢罌），沒有數據類型。（p.214）' },
        { sim: { db: 'keys', sql: C('SELECT CLASS, CNO, COUNT(*)', 'FROM STUDENT', 'GROUP BY CLASS, CNO', 'HAVING COUNT(*) > 1') },
          cap: '檢查 CLASS+CNO 在現有數據中有沒有重複：結果沒有記錄，代表沒有重複。試把 GROUP BY 和 SELECT 改為只用 CNO 或只用 CLASS。' },
        { warn: '現有數據沒有重複，不代表該欄位一定是候選鍵碼：NAME 現時沒有重複值，但學校裏可能有同名的學生，所以 NAME 不是候選鍵碼。（p.214 試想想）' },
        { pts: [
          '把學生和學會的數據存於同一數據表 STUDENTCLUB：Science Club 換老師便要更新三項記錄，否則數據不一致；Art Club 唯一的學生 Ada 退學，Art Club 的數據便會消失。（p.218）',
          '使用外鍵碼：學會的資料只存於 CLUB 一次，更新只需改一項記錄；刪除學生也不會令學會資料丟失。（p.218）',
        ] },
        { sim: { db: 'sc', sql: C("UPDATE STUDENTCLUB SET CTEACH = 'Mr Suen'", "WHERE CNAME = 'Science Club'") },
          cap: 'p.218：Science Club 的老師由 Mr Wong 改為 Mr Suen。執行後看看有多少項記錄被更改（亮起）。' },
      ],
      tries: [
        { id: 'a4-s2-t1', pts: 4, src: '教科書 p.215', db: 'keys', ask: 'rows',
          sql: C('SELECT CNO, COUNT(*)', 'FROM STUDENT', 'GROUP BY CNO', 'HAVING COUNT(*) > 1'),
          q: '先估：結果有多少行？', options: ['0', '1', '2', '7'],
          why: '只有 CNO 15 出現兩次（Clem 和 Gabe），所以 CNO 單獨不能成為候選鍵碼，要與 CLASS 組成複合鍵。' },
      ],
      practice: [
        { id: 'a4-s2-p1', type: 'mc', pts: 2, src: '教科書 p.216 活動 4.4 第 2 題',
          q: '以下哪組「實體類型｜候選鍵碼」的搭配是正確的？',
          options: ['水費繳費戶口｜居家電話號碼', '電腦軟件｜軟件名稱', '電腦型號｜型號 + 價格', '課堂｜開始時間 + 結束時間'], answer: 0,
          hint: '候選鍵碼要獨一無二，而且最簡化。', why: '不同軟件可以同名；「型號 + 價格」不是最簡化；不同課堂可以在同一時間進行。（按教科書答案：一個住址只有一個水費戶口。）' },
        { id: 'a4-s2-p2', type: 'mc', pts: 1, src: '教科書 p.215',
          q: '在 STUDENT (SID, NAME, CLASS, CNO, EMAIL) 中，為什麼 SID+EMAIL **不是**複合鍵？',
          options: ['EMAIL 可能是 NULL', 'SID 本身已是候選鍵碼，刪除 EMAIL 也不會出現重複值，所以不是最簡化', '複合鍵只可以由兩個整數欄位組成', 'SID 和 EMAIL 的數據類型不同'], answer: 1,
          hint: '複合鍵必須最簡化。', why: '刪除 EMAIL 後 SID 仍獨一無二，所以 SID+EMAIL 不是最簡化。' },
        { id: 'a4-s2-p3', type: 'mc', pts: 2, src: '教科書 p.220–221 例題 4.2(c)', tags: [HOT_KEY],
          q: 'GAME (ID, NAME, PNAME, GID, WEBSITE, PHONE, PRICE) 中，與發行商有關的欄位改為存於新數據表 PUBLISHER，並以發行商識別碼 PID 作 GAME 的外鍵碼。改動後 GAME 的模式及外鍵碼是什麼？（主關鍵碼均為 ID）',
          options: ['GAME (ID, NAME, PID, GID, PRICE)；外鍵碼：GID', 'GAME (ID, NAME, PNAME, PID, GID, PRICE)；外鍵碼：PID, GID', 'GAME (ID, NAME, PID, GID, PRICE)；外鍵碼：PID, GID', 'GAME (ID, NAME, PID, WEBSITE, PHONE, PRICE)；外鍵碼：PID'], answer: 2,
          hint: '與發行商有關的是 PNAME、WEBSITE、PHONE；GID 仍參照 GENRE。', why: 'PNAME、WEBSITE、PHONE 移到 PUBLISHER (ID, NAME, WEBSITE, PHONE)；GAME 有兩個外鍵碼 PID 和 GID。' },
        { id: 'a4-s2-p4', type: 'fill', pts: 1, src: '教科書 p.218', db: 'sc',
          sql: C("UPDATE STUDENTCLUB SET CTEACH = 'Mr Suen' WHERE CNAME = 'Science Club';", "SELECT COUNT(*) FROM STUDENTCLUB WHERE CTEACH = 'Mr Suen'"),
          q: 'Science Club 換老師後，STUDENTCLUB 有多少項記錄的 CTEACH 是 Mr Suen？（即是要更新多少項記錄）',
          blanks: [{ label: '記錄數目', ask: { cell: [0, 'COUNT(*)'] } }], hint: '數數有多少位學生加入了 Science Club。' },
        { id: 'a4-s2-p5', type: 'mc', pts: 1, src: '教科書 p.218', db: 'sc', verify: true, ask: { cell: [0, 'COUNT(*)'] },
          sql: C("DELETE FROM STUDENTCLUB WHERE NAME = 'Ada';", "SELECT COUNT(*) FROM STUDENTCLUB WHERE CNAME = 'Art Club'"),
          q: 'Ada 退學，她的記錄被刪除。之後還可以在 STUDENTCLUB 找到多少項有 Art Club 資料的記錄？', options: ['0', '1', '2', '3'], answer: 0,
          hint: '有多少位學生加入了 Art Club？', why: 'Ada 是 Art Club 唯一的學生，刪除她之後 Art Club 的房間和老師資料都消失了。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's3', title: '完整性', pages: '教科書 p.225–233',
      learn: [
        { table: { head: ['完整性（表 4.17）', '重點', '違反的例子'], rows: [
          ['實體完整性', '主關鍵碼是否存在及有效', '沒有主關鍵碼；主關鍵碼有重複值或 NULL'],
          ['參照完整性', '外鍵碼是否有效', '外鍵碼的值不存在於父數據表的主關鍵碼（NULL 除外）'],
          ['域完整性', '屬性的數據類型與限制', '班號為 -6、關店時間為 20:90、班別為 1E']] } },
        { code: C('ALTER TABLE STUDENT ADD PRIMARY KEY (SID)', '', 'ALTER TABLE STUDENT ADD FOREIGN KEY (CID) REFERENCES CLUB(CID)'),
          cap: 'p.225–226：定義主關鍵碼和外鍵碼後，DBMS 便會阻止違反實體完整性和參照完整性的操作。' },
        { pts: [
          '定義外鍵碼後，**不能**：插入或更新 STUDENT 令 CID 不存在於 CLUB；刪除 CLUB 中被參照的記錄；更新 CLUB 中被參照的 CID。（p.227 圖 4.6–4.9）',
          '外鍵碼**可以是 NULL**（Ben 沒有加入學會），這不違反參照完整性。（p.226）',
        ] },
        { code: C('CREATE TABLE STUDENT (', '    SID CHAR(5) PRIMARY KEY,', '    NAME VARCHAR(40),', '    SEX CHAR(1),', '    CLASS CHAR(2),', '    CNO INT,', '    CHECK (LENGTH(SID) = 5),', "    CHECK (SEX IN ('M', 'F')),", "    CHECK (CLASS IN ('1A', '1B', '1C', '1D')),", '    CHECK (CNO BETWEEN 1 AND 30)', ')'),
          cap: 'p.229：用數據類型與 CHECK 限制定義域，DBMS 便會拒絕不在域內的值（例如 CNO 為 \'One\' 或 -6）。' },
        { note: '本平台的模擬器不會執行這些限制。我們改用 **SELECT 查出違反完整性的記錄**：重複的主關鍵碼用 `GROUP BY … HAVING COUNT(*) > 1`；無效的外鍵碼用 `NOT IN (SELECT 主關鍵碼 FROM 父數據表)`；超出域的值用 `NOT BETWEEN`、`NOT IN (…)`。' },
        { sim: { db: 'seat', sql: C('SELECT SNAME, CID', 'FROM STUDENT', 'WHERE CID NOT IN (SELECT CID FROM CLUB)') },
          cap: 'p.231 活動 4.6 第 2 題：找出外鍵碼 CID 無效的學生。再試把條件改為 `SROW NOT IN (\'1\', \'2\', \'3\', \'4\', \'5\')`，找出座位列號不在域 {1 .. 5} 內的記錄。' },
        { warn: '`CID NOT IN (子查詢)` 不會選出 CID 為 NULL 的記錄（NULL 與任何值比較的結果都是 NULL）。這正好符合參照完整性：外鍵碼可以是 NULL。' },
        { table: { head: ['CLASS', 'CLASSNO', 'GENDER', 'SNAME'], rows: [['6A', '13', 'F', 'Mary Leung'], ['6A', '22', 'M', 'Ben Kwok'], ['6B', '37', 'M', 'Gary Wu'], ['6B', '4', 'M', 'Ken Cheung'], ['6A', '15', 'F', 'Mary Leung'], ['6A', '22', 'F', 'Yen Koo'], ['6B', '13', 'F', 'Lois Law']] } },
        { sim: { db: 'act46', sql: C('SELECT CLASS, CLASSNO, COUNT(*)', 'FROM STUDENT', 'GROUP BY CLASS, CLASSNO', 'HAVING COUNT(*) > 1') },
          cap: 'p.230 活動 4.6 第 1 題（上表）：連 CLASS+CLASSNO 也有重複（6A, 22），所以這個數據表找不到可用的主關鍵碼。' },
      ],
      tries: [
        { id: 'a4-s3-t1', pts: 4, src: '教科書 p.231 活動 4.6 第 2 題', db: 'seat', ask: { col: 'SNAME' },
          sql: C('SELECT SNAME', 'FROM STUDENT', 'WHERE CID NOT IN (SELECT CID FROM CLUB)'),
          q: '先估：結果是什麼？', options: ['Linda Wong', 'John Chau', 'John Chau, Linda Wong', '（沒有記錄）'],
          why: 'Linda Wong 的 CID 是 3169，CLUB 只有 1558、3196、4453、4700，所以違反參照完整性。John Chau 的問題是 SROW 為 S（域完整性），CID 4453 是有效的。' },
        { id: 'a4-s3-t2', pts: 4, src: '教科書 p.227 圖 4.8', db: 'club', ask: { cell: [0, 'COUNT(*)'] },
          sql: C('DELETE FROM CLUB WHERE CID = 4;', 'SELECT COUNT(*)', 'FROM STUDENT', 'WHERE CID NOT IN (SELECT CID FROM CLUB)'),
          q: '先估：假如 DBMS 沒有阻止這個刪除，之後有多少位學生的 CID 變成無效？', options: ['0', '1', '3', '4'],
          why: 'Eva、Gabe、Dio 的 CID 都是 4。刪除 Science Club 後，他們的外鍵碼參照不存在的記錄；Ben 的 CID 是 NULL，不計算在內。所以 DBMS 會阻止這個刪除。' },
      ],
      practice: [
        { id: 'a4-s3-p1', type: 'mc', pts: 2, src: '教科書 p.230 活動 4.6 第 1 題', tags: [HOT_INT],
          q: '上面「活動 4.6 第 1 題」的數據表最有可能違反哪項／些完整性？\n(1) 實體完整性\n(2) 參照完整性\n(3) 域完整性',
          options: ['只有 (1)', '只有 (2)', '只有 (1) 和 (3)', '只有 (2) 和 (3)'], answer: 0,
          hint: '每個欄位（甚至 CLASS+CLASSNO）都有重複值。', why: '找不到不重複的欄位或欄位組合作主關鍵碼，所以違反實體完整性；其他值看來都合理。' },
        { id: 'a4-s3-p2', type: 'mc', pts: 2, src: '教科書 p.231 活動 4.6 第 2 題', tags: [HOT_INT],
          q: '活動 4.6 第 2 題的 STUDENT (SCLN, SROW, SNAME, SEX, CID) 及 CLUB（見模擬器）最有可能違反哪項／些完整性？（SCLN、SROW 是座位的欄號和列號，由 1 至 5）\n(1) 實體完整性\n(2) 參照完整性\n(3) 域完整性',
          options: ['只有 (1)', '只有 (2)', '只有 (1) 和 (3)', '只有 (2) 和 (3)'], answer: 3,
          hint: 'SCLN+SROW 可以作主關鍵碼。', why: 'CID 3169 不存在於 CLUB（參照完整性）；SROW 為 S 不在 {1 .. 5}（域完整性）；SCLN+SROW 沒有重複。' },
        { id: 'a4-s3-p3', type: 'mc', pts: 1, src: '教科書 p.232 測試站 4.3(a)', db: 'shop', verify: true, ask: { col: 'SNAME' },
          sql: C('SELECT SNAME', 'FROM SHOP', "WHERE SUBSTRING(CLOSE, 4, 2) > '59'"),
          q: '以上 SQL 語句會選出哪間商店？', options: ['McReynaulds', 'Submarine', 'Kenneth Fish & Chips', 'Sandwich Empress'], answer: 2,
          hint: "SUBSTRING(CLOSE, 4, 2) 取出時間的「分鐘」兩位。", why: '20:90 的分鐘是 90，大於 59，是無效的時間。' },
        { id: 'a4-s3-p4', type: 'mc', pts: 1, src: '教科書 p.232–233 測試站 4.3(a)、(d)',
          q: '關店時間 20:90 違反了哪種完整性？另外，如 SHOP 的主關鍵碼在 PRODUCT 中作外鍵碼，刪除 SHOP 的一項記錄後應怎樣做？',
          options: ['域完整性；把該店舖出售的產品記錄一併刪除', '參照完整性；把該店舖出售的產品記錄一併刪除', '實體完整性；不用做任何事', '域完整性；把 PRODUCT 的主關鍵碼改為 NULL'], answer: 0,
          hint: '20:90 不在合理的時間範圍內。', why: '無效的值違反域完整性；刪除店舖後，PRODUCT 中參照它的記錄要一併處理，才能保持參照完整性。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 's4', title: '索引與回滾', pages: '教科書 p.223–224、p.233–236',
      learn: [
        { pts: [
          '經常被搜尋的欄位可以建立**索引**，加快檢索。索引表只有**索引欄位**和**指向記錄的指針**，並已**排序**，所以 DBMS 可以進行**二分檢索**。（p.223）',
          '11 項記錄的索引表，最多 4 次搜尋便找到任何一項記錄（即使 Guy 是最後一位）。n 項記錄最多約需 ⌈log₂(n+1)⌉ 次。（p.223–224）',
          '缺點：數據更新或新增記錄時，DBMS 要同時更新索引表（需時）；索引表亦佔用儲存空間。所以**只為經常搜尋的欄位**建立索引。（p.223、p.238）',
        ] },
        { sim: { db: 'idx', sql: C('SELECT NAME, SID', 'FROM STUDENT', 'ORDER BY NAME') },
          cap: 'p.223：數據表按 SID 排列；以 NAME 建立的索引表就像這個結果——按 NAME 排序，並記下 SID（指針）。' },
        { pts: [
          '**回滾**：把數據庫復原至先前的狀態。管理數據庫時可能出錯而損害數據完整性，所以要**定期備份**，以便回滾。（p.233）',
          '例子：老師想刪除 6A 學生，再把 5A 升為 6A，卻把次序倒轉——先升班再刪除，結果所有學生都被刪除。（p.233）',
        ] },
        { sim: { db: 'roll', sql: C("UPDATE STUDENT SET CLASS = '6A' WHERE CLASS = '5A';", "DELETE FROM STUDENT WHERE CLASS = '6A';", 'SELECT * FROM STUDENT') },
          cap: '執行這兩句（次序錯了），再按「重設數據」，然後把兩句的次序對調再執行。' },
        { code: C('mysqldump -u root -p SCHOOL > school.sql', '', 'mysql -u root -p -h localhost SCHOOL < school.sql'),
          cap: '實驗站 4.1（p.234–235）：第一行把數據庫 SCHOOL **匯出（備份）**為 SQL 檔案（內有 CREATE TABLE、INSERT INTO 語句）；第二行把檔案**匯入**，回滾數據庫。在命令提示字元輸入。' },
      ],
      tries: [
        { id: 'a4-s4-t1', pts: 4, src: '教科書 p.233', db: 'roll', ask: { cell: [0, 'COUNT(*)'] },
          sql: C("UPDATE STUDENT SET CLASS = '6A' WHERE CLASS = '5A';", "DELETE FROM STUDENT WHERE CLASS = '6A';", 'SELECT COUNT(*) FROM STUDENT'),
          q: '先估：老師把兩句的次序倒轉了。最後 STUDENT 有多少項記錄？', options: ['0', '3', '7', '10'],
          why: '先把 7 位 5A 學生改為 6A，於是 10 位學生全是 6A，再全部刪除，留下空表。正確次序（先刪除再升班）會剩下 7 項記錄。' },
      ],
      practice: [
        { id: 'a4-s4-p1', type: 'fill', pts: 2, src: '教科書 p.224 活動 4.5 第 1、2 題',
          q: '活動 4.5 的索引表有 15 本書（按書名排序）。用二分檢索：\n(1) 找出 Three Little Pigs（第 14 項）需要搜尋多少次？\n(2) 最壞情況下需要搜尋多少次？',
          blanks: [{ label: '(1) 次數', a: '3', accept: ['3次', '3 次'] }, { label: '(2) 次數', a: '4', accept: ['4次', '4 次'] }],
          hint: '第 1 次比較第 8 項；第 2 次比較第 12 項；第 3 次比較第 14 項。15 項 = 2⁴ − 1。' },
        { id: 'a4-s4-p2', type: 'mc', pts: 1, src: '教科書 p.224 活動 4.5 第 3 題（挑戰）',
          q: '若索引表有 1000 本書，最壞情況下二分檢索需要搜尋多少次？', options: ['9', '10', '500', '1000'], answer: 1,
          hint: 'log₂1000 ≈ 9.97。', why: '2⁹ = 512 < 1000 ≤ 1023 = 2¹⁰ − 1，所以最壞情況是 10 次。' },
        { id: 'a4-s4-p3', type: 'mc', pts: 1, src: '教科書 p.236 測試站 4.4(a)', tags: [HOT_KEY],
          q: 'PAYMENT (TID, PAYERID, PAYEEID, AMOUNT, TTIME) 記錄付款；PAYERID、PAYEEID 是付款人及收款人在 ACCOUNT (AID, UNAME, DEPOSIT) 的帳戶識別碼。PAYMENT 的外鍵碼是什麼？',
          options: ['TID', 'PAYERID', 'PAYERID, PAYEEID', 'TID, PAYERID, PAYEEID'], answer: 2,
          hint: '一個數據表可以有多個外鍵碼。', why: 'PAYERID 和 PAYEEID 都參照 ACCOUNT 的主關鍵碼 AID；TID 是主關鍵碼。' },
        { id: 'a4-s4-p4', type: 'mc', pts: 1, src: '教科書 p.236 測試站 4.4(c)',
          q: '程式更新 10,000 筆付款時中途出錯而中止，不知停在哪裏。數據庫管理員應怎樣做？',
          options: ['重新執行整個程式一次', '把數據庫回滾至執行前的狀態（使用備份）', '刪除 PAYMENT 的所有記錄', '為 ACCOUNT 建立索引'], answer: 1,
          hint: '有些付款可能只完成了一半。', why: '可能付款人已扣款但收款人未加款；回滾後才可以安全地重新處理。' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'write', kind: 'write', title: '寫 SQL：數據審核', pages: '教科書 p.225–229',
      intro: '數據庫 `audit` 的 STUDENT (SID, NAME, SEX, CLASS, CNO, CID) 沒有設定任何限制，混入了一些錯誤的記錄。CLUB (CID, NAME, ROOM, TEACH) 的主關鍵碼是 CID。請寫 SQL 把問題找出來。系統會再用另外的數據檢查你的語句，所以不要只寫出現時看到的值。',
      tasks: [
        { id: 'a4-w1', pts: 10, title: '參照完整性：無效的學會', src: '教科書 p.226–228', db: 'audit',
          q: 'STUDENT.CID 是參照 CLUB.CID 的外鍵碼。列出 CID **不存在於 CLUB** 的學生的 NAME。CID 為 NULL 的學生沒有違反參照完整性，**不要**列出。',
          starter: C('SELECT NAME', 'FROM STUDENT'),
          ref: C('SELECT NAME', 'FROM STUDENT', 'WHERE CID NOT IN (SELECT CID FROM CLUB)'),
          hint: '用子查詢 `SELECT CID FROM CLUB` 取得所有有效的 CID，再用 NOT IN。' },
        { id: 'a4-w2', pts: 12, title: '實體完整性：重複的主關鍵碼', src: '教科書 p.225–226', db: 'audit',
          q: 'SID 應該是 STUDENT 的主關鍵碼，但有些 SID 出現了多於一次。列出這些**重複的 SID**（每個 SID 只列一次）。',
          starter: C('SELECT SID', 'FROM STUDENT'),
          ref: C('SELECT SID', 'FROM STUDENT', 'GROUP BY SID', 'HAVING COUNT(*) > 1'),
          hint: '按 SID 分組，再用 HAVING 選出記錄數目大於 1 的組。' },
        { id: 'a4-w3', pts: 13, title: '域完整性：超出域的值', src: '教科書 p.228–229', db: 'audit',
          q: "CNO 的域是 {1 .. 30}，SEX 的域是 {'M', 'F'}。列出 CNO **或** SEX 不在域內的學生的 NAME。",
          starter: C('SELECT NAME', 'FROM STUDENT', 'WHERE CNO > 30'),
          ref: C('SELECT NAME', 'FROM STUDENT', "WHERE CNO NOT BETWEEN 1 AND 30 OR SEX NOT IN ('M', 'F')"),
          hint: "兩個條件用 OR 連接：`CNO NOT BETWEEN 1 AND 30`、`SEX NOT IN ('M', 'F')`。別忘了小於 1 的班號。" },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'quiz', kind: 'quiz', title: '小測', pages: '教科書 p.237–241',
      items: [
        { id: 'a4-q1', pts: 4, src: '教科書 p.238–239 課題練習 1(a)（參考 DSE 2012 2A Q4）', tags: [HOT_INT],
          q: '員工在網上訂餐表格提交的數據存於 MEALORDER (ENAME, AGE, APPETISER, MAINCOURSE, NEEDCUTLERY)。同事指出 MEALORDER 違反了某種完整性。最合理的解釋是：',
          options: ['參照完整性：APPETISER 不是外鍵碼', '實體完整性：沒有一個欄位可作主關鍵碼（員工可能同名）', '域完整性：AGE 可能是 NULL', '實體完整性：ENAME 是字符，不可作主關鍵碼'], answer: 'B',
          why: '數據表必須有主關鍵碼；同名員工會令 ENAME 重複。可加入員工編號（例如 EID）作主關鍵碼。' },
        { id: 'a4-q2', pts: 4, src: '教科書 p.239–240 課題練習 2(c)（參考 DSE 2012 2A Q1）', tags: [HOT_INT],
          q: 'PLAYER 的 TID 參照 TEAM 的主關鍵碼 TID。主辦人把某退出隊伍的記錄從 TEAM 刪去，但沒有其他行動。這可能違反哪種完整性？應怎樣解決？',
          options: ['實體完整性；把該隊伍的 TID 改為 NULL', '域完整性；把 TEAM 的 TID 改為字串', '參照完整性；把 PLAYER 中屬於該隊伍的記錄刪除（或更新其 TID）', '參照完整性；在 TEAM 中為 TID 建立索引'], answer: 'C',
          why: 'PLAYER 仍有記錄的 TID 參照已不存在的隊伍。' },
        { id: 'a4-q3', pts: 4, src: '教科書 p.240 課題練習 2(d)、(e)',
          q: "球員位置只可以是 Goalkeeper、Defender、Midfielder、Forward。某記錄的 POS 是 'Attacker'。以下哪項正確？",
          options: ['違反域完整性；可建立 POSITION (POS, POSTYPE) 數據表，以整數 POS 作外鍵碼，減少輸入錯誤及儲存空間', '違反參照完整性；應刪除 POS 欄', '違反實體完整性；應以 POS 作主關鍵碼', '沒有違反任何完整性，因為 POS 是字串'], answer: 'A',
          why: "'Attacker' 不在 POS 的域內。改用 POSITION 表後，PLAYER 只存 0–3 的整數（例如 2 = Midfielder），佔用空間較少，亦可由外鍵碼限制數值。" },
        { id: 'a4-q4', pts: 4, src: '教科書 p.241 課題練習 3(e)（參考 DSE 2014 2A Q2）',
          q: '網站讓用戶按電影名稱、演員姓名或發行年份搜尋。為什麼**不應**為數據表的所有欄位都建立索引？',
          options: ['索引會令 SELECT 結果出錯', '每次新增或更新記錄都要更新所有索引表，需時較長；索引表亦佔用儲存空間', '一個數據表只可以有一個索引', '建立索引後便不可以再插入記錄'], answer: 'B',
          why: '應只為經常搜尋的欄位（FNAME、ANAME、FYEAR）建立索引。' },
        { id: 'a4-q5', pts: 4, src: '自擬（DSE 卷二A 子查詢與 NULL）', tags: [{ t: 'trap', why: 'NOT IN 遇上 NULL：外鍵碼為 NULL 的記錄不會被選出。' }],
          db: 'club', verify: true, ask: { cell: [0, 'COUNT(*)'] },
          sql: C("INSERT INTO STUDENT VALUES ('03520', 'Kit', 'M', '3C', 5);", 'SELECT COUNT(*)', 'FROM STUDENT', 'WHERE CID NOT IN (SELECT CID FROM CLUB)'),
          q: '在學生與學會數據庫（Ben 的 CID 是 NULL）執行以上語句，最後的結果是什麼？', options: ['0', '1', '2', '8'], answer: 'B',
          why: '只有 Kit 的 CID 5 不存在於 CLUB。Ben 的 CID 是 NULL，`NULL NOT IN (…)` 的結果是 NULL，不會被計算。' },
      ],
    },
    { id: 'more', kind: 'endless', title: '無限練習', gens: ['sqlSub', 'sqlJoin', 'sqlAgg'], intro: '隨機生成子查詢、連接及分組題目（檢查外鍵碼、找出重複值都會用到），答案由模擬器計算。不計分，但次數會寫進報告。' },
    { id: 'report', kind: 'report', title: '交功課' },
  ],
};
