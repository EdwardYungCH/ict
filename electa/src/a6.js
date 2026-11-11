/* 單元 a6：綜合練習（選修A 數據庫 總溫習）
 * 教科書 選修A 綜合練習 p.308–312（書中沒有印答案，只有網址；以下答案由本單元自擬，並由 SQL 引擎核對）
 * 溫習範圍：第 1–5 章（SQL 查詢、函數、聚合、連接、子查詢、集合運算、DML；鍵碼、完整性、檢視、索引、回滾、實體關係圖、規範化）
 *
 * 教科書疑似錯誤／需要留意（請 lead 抄到 教科書疑似錯誤記錄）：
 * // 教科書疑似錯誤：p.310 第 9 題 數據表名稱 `ORDER` 是 SQL 保留字（ORDER BY），MySQL 要寫成 `ORDER`（反引號）才能使用；本單元改名為 ORDERS。
 * // 教科書疑似錯誤：p.310 第 9 題 ORDERDATE 示例寫成 2022/03/28，與 DSE／MySQL 的 'YYYY-MM-DD' 寫法不一致；本單元用 '2022-03-28'。
 * // 教科書疑似錯誤：p.310 第 9(b) 題「提高 10 美元」，但數據表描述的單位是 $（港元）；本單元寫「$10」。
 * // 教科書疑似錯誤：p.311 第 10 題 PRICE、AMOUNT 的類型寫「整數」，但範例是 2.5、7.5（應為實數／DECIMAL）。
 * // 教科書疑似錯誤：p.311 第 10(e) 題「顯示已經缺貨並且不能再銷售的產品」，但第 10 題的數據表沒有存貨欄位，按所給模式無法作答；本單元不採用此分題。
 * // 教科書疑似錯誤：p.308 第 2(c) 題「試提出在非關鍵屬性上建立索引。」句子不完整（似應為「試舉例說明何時應在非關鍵屬性上建立索引」）。
 * // 改編說明：p.309 第 8(b)(iv)(v) 題原為「超過 15 次／未超過 15 天」，p.311 第 10(d) 題原為「超過 50 次」，p.310 第 9(e) 題原為「過去一年」；
 * //   因示例數據只有數十筆記錄，本單元把門檻改為 3 次／2 次，「過去一年」改為「2022 年」（結果才可由引擎固定核對）。
 */
const C = (...ls) => ls.join('\n');

const HR = {
  EMPLOYEE: [['EID', 'ENAME', 'DEPT_ID'], [
    ['E01', 'Alan Chan', 'D001'],
    ['E02', 'Betty Lee', 'D001'],
    ['E03', 'Calvin Cheung', 'D002'],
    ['E04', 'Daisy Wong', 'D002'],
    ['E05', 'Eric Ho', 'D002'],
    ['E06', 'Fiona Lam', 'D003'],
    ['E07', 'Gary Chow', 'D003'],
    ['E08', 'Helen Ng', 'D001'],
  ]],
  DEPARTMENT: [['DEPT_ID', 'DEPT_NAME', 'DEPT_MANAGER'], [
    ['D001', '人力資源部', 'E01'],
    ['D002', '銷售部', 'E04'],
    ['D003', '資訊科技部', 'E07'],
  ]],
  ATTENDANCE: [['EID', 'ATT_DATE', 'ATT_TIME'], [
    ['E01', '2023-03-01', '08:52:00'], ['E01', '2023-03-02', '09:03:00'], ['E01', '2023-03-03', '08:47:00'], ['E01', '2023-03-06', '08:58:00'],
    ['E02', '2022-12-30', '08:55:00'], ['E02', '2023-03-01', '09:10:00'], ['E02', '2023-03-02', '08:59:00'], ['E02', '2023-03-03', '09:00:00'],
    ['E03', '2022-12-29', '08:40:00'], ['E03', '2022-12-30', '08:45:00'], ['E03', '2022-12-31', '08:50:00'], ['E03', '2023-01-02', '09:15:00'],
    ['E04', '2023-01-03', '08:30:00'], ['E04', '2023-02-01', '08:35:00'], ['E04', '2023-03-01', '08:31:00'], ['E04', '2023-12-29', '08:33:00'], ['E04', '2024-01-02', '08:32:00'],
    ['E05', '2023-03-01', '09:20:00'], ['E05', '2023-03-02', '09:05:00'],
    ['E06', '2024-01-02', '08:57:00'], ['E06', '2024-01-03', '08:56:00'], ['E06', '2024-01-04', '08:58:00'], ['E06', '2024-01-05', '08:55:00'],
    ['E07', '2023-05-02', '08:41:00'], ['E07', '2023-05-03', '08:42:00'], ['E07', '2023-05-04', '08:43:00'], ['E07', '2023-05-05', '08:44:00'], ['E07', '2023-05-08', '08:45:00'],
  ]],
};

const SHOP = {
  PRODUCT: [['PRODUCTID', 'PRODUCTNAME', 'BRAND', 'PRICE', 'STOCK'], [
    ['P3001', 'Smart Watch', 'Apple', 399, 50],
    ['P3002', 'Earbuds', 'Sony', 199, 0],
    ['P3003', 'Power Bank', 'Anker', 159, 12],
    ['P3004N', 'Fold Phone', 'Samsung', 899, 8],
    ['P3005', 'Tablet', 'Apple', 499, 0],
    ['P3006N', 'Smart Ring', 'Oura', 299, 20],
    ['P3007', 'Keyboard', 'Logi', 129, 5],
  ]],
  ORDERS: [['ORDERID', 'ORDERDATE', 'CUSTOMERID', 'PAYMENTMETHOD', 'TOTAL'], [
    ['O1001', '2021-12-31', 'C2001', '現金', 399],
    ['O1002', '2022-01-05', 'C2001', '信用卡', 598],
    ['O1003', '2022-01-18', 'C2002', '信用卡', 1197],
    ['O1004', '2022-01-31', 'C2003', '八達通', 318],
    ['O1005', '2022-02-01', 'C2001', '信用卡', 899],
    ['O1006', '2022-03-28', 'C2002', '現金', 499],
    ['O1007', '2022-05-10', 'C2001', '八達通', 159],
    ['O1008', '2022-06-12', 'C2003', '信用卡', 798],
  ]],
  PRODUCTORDER: [['PRODUCTID', 'ORDERID', 'QUANTITY'], [
    ['P3001', 'O1001', 1],
    ['P3001', 'O1002', 1], ['P3002', 'O1002', 1],
    ['P3001', 'O1003', 3],
    ['P3003', 'O1004', 2],
    ['P3004N', 'O1005', 1],
    ['P3005', 'O1006', 1],
    ['P3003', 'O1007', 1],
    ['P3005', 'O1008', 1], ['P3006N', 'O1008', 1],
  ]],
};

const MART = {
  CUSTOMER: [['CUSTOMERID', 'CUSTOMERNAME', 'EMAIL'], [
    ['C1001', 'Lee Siu Ming', 'johnlee@abcdabee.com'],
    ['C1002', 'Wong Ka Yan', 'kywong@mail.com'],
    ['C2001', 'Chan Tai Man', 'tmchan@mail.com'],
    ['C2002', 'Ho Wong Fat', 'hwf@mail.com'],
    ['C2003', 'Cheung Mei', 'mei@mail.com'],
  ]],
  PRODUCT: [['PRODUCTID', 'PRODUCTNAME', 'SUPPLIER', 'PRICE'], [
    ['P1001', 'ABC Fruit', 'XYZ Co', 2.5],
    ['P1002', 'Milk', 'Fresh Farm', 12.9],
    ['P1003', 'Bread', 'Garden', 9.5],
    ['P2001', 'Apple Juice', 'XYZ Co', 4],
    ['P2002', 'Cookies', 'Jolly', 15.9],
    ['P2003', 'Rice', 'Golden', 59.9],
  ]],
  SALES: [['TRANSACTIONID', 'TRANSDATE', 'CUSTOMERID', 'PRODUCTID', 'QUANTITY', 'AMOUNT'], [
    ['T1001', '2022-03-28', 'C1001', 'P1001', 3, 7.5],
    ['T1002', '2022-03-28', 'C2001', 'P2002', 1, 15.9],
    ['T1003', '2022-03-29', 'C2001', 'P1003', 2, 19],
    ['T1004', '2022-03-30', 'C2001', 'P2002', 2, 31.8],
    ['T1005', '2022-03-30', 'C1002', 'P1001', 4, 10],
    ['T1006', '2022-04-01', 'C2002', 'P1001', 2, 5],
    ['T1007', '2022-04-02', 'C2001', 'P1001', 1, 2.5],
    ['T1008', '2022-04-02', 'C1001', 'P1002', 1, 12.9],
    ['T1009', '2022-04-03', 'C2003', 'P1003', 1, 9.5],
  ]],
};

const HOT_SUB = { t: 'hot', why: 'DSE 卷二A 幾乎每年都考「找出沒有……」及子查詢；2025 5(b)(iii) 超過一半考生在子查詢和 MAX 上遇到困難。' };
const HOT_INT = { t: 'hot', why: '完整性（實體、參照、域）是卷二A 甲部常見短答題。' };

module.exports = {
  id: 'a6',
  title: '綜合練習',
  book: '教科書 選修A 綜合練習 p.308–312（溫習第 1–5 章）',
  key: 'A-a6-hmac-c82dcfa8e9',
  theory: false,
  dbs: { hr: HR, shop: SHOP, mart: MART },
  sections: [
    // ───────────────────────── s1 ─────────────────────────
    {
      id: 's1', title: '單一數據表查詢與函數', pages: '教科書 p.18–27、66–80；綜合練習 p.310–311 第 9(a)(b)(c)、10(a)(f) 題',
      learn: [
        { pts: [
          '本單元用綜合練習第 8–10 題的數據表（示例數據由本單元補上）：`hr`（員工上班）、`shop`（ABC 企業產品訂單）、`mart`（XYZ 超市銷售）。',
          '基本格式：`SELECT 欄位 FROM 數據表 WHERE 條件 ORDER BY 欄位 [ASC|DESC]`。`DISTINCT` 去除重複的行。（p.18–21）',
          '`LIKE`：`%` 代表任何數目（包括零個）的字符，`_` 代表剛好一個字符。「包含 Wong」寫 `LIKE \'%Wong%\'`；「以 N 結尾」寫 `LIKE \'%N\'`。（p.66–）',
          '與 NULL 比較要寫 `IS NULL`／`IS NOT NULL`，不可寫 `= NULL`。',
          '常用函數：`LENGTH()`、`MID(s, 開始, 個數)`、`LEFT()`、`RIGHT()`、`UPPER()`、`LOWER()`、`TRIM()`；日期：`YEAR()`、`MONTH()`、`DAY()`。（p.77–78）',
          '改數據用 DML：`UPDATE … SET … WHERE …`、`DELETE FROM … WHERE …`、`INSERT INTO … VALUES (…)`。忘記 `WHERE` 會改動**所有**記錄。（p.17、26–27）',
        ] },
        { table: { head: ['綜合練習題目', '參考答案（本單元自擬）'], rows: [
          ['9(a) 列出所有產品的名稱和識別碼', '`SELECT PRODUCTNAME, PRODUCTID FROM PRODUCT`'],
          ['9(b) 新產品（PRODUCTID 以 N 結尾）價格加 $10', '`UPDATE PRODUCT SET PRICE = PRICE + 10 WHERE PRODUCTID LIKE \'%N\'`'],
          ['9(c) 列出完全售罄產品的名稱', '`SELECT PRODUCTNAME FROM PRODUCT WHERE STOCK = 0`'],
          ['10(a) 名字包含 Wong 的顧客', '`SELECT CUSTOMERNAME FROM CUSTOMER WHERE CUSTOMERNAME LIKE \'%Wong%\'`'],
          ['10(f) P2001 價格改為 $3.5', '`UPDATE PRODUCT SET PRICE = 3.5 WHERE PRODUCTID = \'P2001\'`'],
        ] } },
        { warn: '9(b) 也可寫 `WHERE RIGHT(PRODUCTID, 1) = \'N\'`。寫 `LIKE \'N%\'` 是「以 N 開首」，寫 `LIKE \'%N%\'` 會把中間有 N 的編號也包括在內，都不對。' },
        { sim: { db: 'shop', sql: C('UPDATE PRODUCT', 'SET PRICE = PRICE + 10', "WHERE PRODUCTID LIKE '%N';", 'SELECT * FROM PRODUCT') }, cap: '綜合練習 9(b)（p.310）：執行後，被改動的記錄會亮起。按「重設數據」可還原。' },
        { fix: { bad: "SELECT CUSTOMERNAME FROM CUSTOMER WHERE CUSTOMERNAME = '%Wong%'", good: "SELECT CUSTOMERNAME FROM CUSTOMER WHERE CUSTOMERNAME LIKE '%Wong%'", why: '`%` 只在 `LIKE` 中才是萬用字符；用 `=` 會找名字剛好是「%Wong%」的顧客。' } },
      ],
      tries: [
        { id: 'a6-s1-t1', pts: 4, src: '綜合練習 p.311 第 10(a) 題', db: 'mart',
          sql: C('SELECT CUSTOMERNAME', 'FROM CUSTOMER', "WHERE CUSTOMERNAME LIKE '%Wong%'"),
          ask: { col: 'CUSTOMERNAME' }, q: '先估：輸出哪些名字？',
          options: ['Wong Ka Yan', 'Wong Ka Yan, Ho Wong Fat', 'Ho Wong Fat', 'Wong Ka Yan, Ho Wong Fat, Cheung Mei'],
          why: '`%Wong%` 表示 Wong 前後可以有任何字符（包括沒有），所以姓 Wong 和名字中間有 Wong 的都符合。若只要「姓 Wong」，應寫 `LIKE \'Wong%\'`。' },
      ],
      practice: [
        { id: 'a6-s1-p1', type: 'complete', pts: 2, src: '綜合練習 p.310 第 9(b) 題', db: 'shop', label: '補完 SQL',
          q: '新發布產品的 PRODUCTID 以 \'N\' 結尾。把這些產品的價格提高 $10。',
          template: C('UPDATE PRODUCT', 'SET PRICE = ［1］', 'WHERE PRODUCTID LIKE ［2］;', 'SELECT * FROM PRODUCT'),
          ref: ['PRICE + 10', "'%N'"], hint: '新價格是舊價格加 10；「以 N 結尾」：N 前面可以有任何字符。' },
        { id: 'a6-s1-p2', type: 'mc', pts: 2, src: '自擬（LIKE 的 _）', db: 'shop', verify: true, ask: 'rows',
          q: '以下語句輸出多少行？',
          sql: C('SELECT PRODUCTID, PRODUCTNAME', 'FROM PRODUCT', "WHERE PRODUCTID LIKE 'P300_'"),
          options: ['2', '5', '7', '0'], answer: 1,
          hint: '`_` 剛好代表一個字符：P3004N、P3006N 有 6 個字符，不符合。',
          why: 'P3001、P3002、P3003、P3005、P3007 符合，共 5 行。' },
        { id: 'a6-s1-p3', type: 'fill', pts: 2, src: '自擬（參考教科書 p.78–80 例題 2.3）', db: 'mart',
          q: '寫出以下語句的輸出。',
          sql: C('SELECT MID(CUSTOMERNAME, 1, 4) AS A, LENGTH(EMAIL) AS B, MONTH(TRANSDATE) AS C', 'FROM CUSTOMER, SALES', "WHERE CUSTOMER.CUSTOMERID = SALES.CUSTOMERID AND TRANSACTIONID = 'T1005'"),
          blanks: [{ label: 'A', ask: { cell: [0, 'A'] } }, { label: 'B', ask: { cell: [0, 'B'] } }, { label: 'C', ask: { cell: [0, 'C'] } }],
          hint: 'T1005 的顧客是 C1002。MID 由第 1 個字符起取 4 個；LENGTH 包括 @ 和 . 。' },
      ],
    },
    // ───────────────────────── s2 ─────────────────────────
    {
      id: 's2', title: '聚合函數、GROUP BY 與 HAVING', pages: '教科書 p.81–92；綜合練習 p.309–311 第 8(b)(iii)、9(d)(e)、10(b)(d) 題',
      learn: [
        { pts: [
          '聚合函數：`COUNT(*)`（記錄數目）、`COUNT(欄)`（不計 NULL）、`COUNT(DISTINCT 欄)`（不同值的數目）、`SUM`、`AVG`、`MAX`、`MIN`。聚合函數不計 NULL。（p.81–90）',
          '`GROUP BY`：把欄位值相同的記錄歸入同一組，每組輸出一行。`SELECT` 中沒有被聚合的欄位都要寫在 `GROUP BY`。（p.81–）',
          '`WHERE` 在分組**前**篩選記錄；`HAVING` 在分組**後**篩選組別。聚合函數不可寫在 `WHERE`。',
          '「某年某月」：`YEAR(ORDERDATE) = 2022 AND MONTH(ORDERDATE) = 1`，或 `ORDERDATE BETWEEN \'2022-01-01\' AND \'2022-01-31\'`。',
          '「超過」是 `>`，「至少」是 `>=`，「未超過」是 `<=` —— DSE 常在這裏扣分。',
        ] },
        { table: { head: ['綜合練習題目', '參考答案（本單元自擬）'], rows: [
          ['8(b)(iii) 有上班記錄的員工數量', '`SELECT COUNT(DISTINCT EID) FROM ATTENDANCE`'],
          ['9(d) 2022 年 1 月所有訂單的總收入', '`SELECT SUM(TOTAL) FROM ORDERS WHERE YEAR(ORDERDATE) = 2022 AND MONTH(ORDERDATE) = 1`'],
          ['9(e) 2022 年至少下過 3 個訂單的客戶（原題：過去一年）', '`SELECT CUSTOMERID FROM ORDERS WHERE YEAR(ORDERDATE) = 2022 GROUP BY CUSTOMERID HAVING COUNT(*) >= 3`'],
          ['10(b) 所有產品中最高的價格', '`SELECT MAX(PRICE) FROM PRODUCT`'],
          ['10(d) 交易次數超過 50 次的產品（本單元改為 2 次）', '`SELECT PRODUCTID, COUNT(*) FROM SALES GROUP BY PRODUCTID HAVING COUNT(*) > 2`'],
        ] } },
        { fix: { bad: 'SELECT PRODUCTID FROM SALES WHERE COUNT(*) > 2 GROUP BY PRODUCTID', good: 'SELECT PRODUCTID, COUNT(*) FROM SALES GROUP BY PRODUCTID HAVING COUNT(*) > 2', why: '聚合函數不可用在 `WHERE`；分組後的條件要寫在 `HAVING`。題目要求「顯示產品 ID 和交易次數」，`SELECT` 也要有 `COUNT(*)`。' } },
        { warn: '8(b)(iii)「有上班記錄的員工數量」：`COUNT(*)` 計算的是上班記錄的數目（每人很多筆），要用 `COUNT(DISTINCT EID)`。' },
        { sim: { db: 'shop', sql: C('SELECT CUSTOMERID, COUNT(*)', 'FROM ORDERS', 'WHERE YEAR(ORDERDATE) = 2022', 'GROUP BY CUSTOMERID') }, cap: '先看每位客戶 2022 年的訂單數目，再加上 `HAVING COUNT(*) >= 3`。試把 WHERE 刪去，看看 C2001 的數目有何改變。' },
      ],
      tries: [
        { id: 'a6-s2-t1', pts: 4, src: '綜合練習 p.309 第 8(b)(iii) 題', db: 'hr',
          sql: C('SELECT COUNT(*), COUNT(DISTINCT EID)', 'FROM ATTENDANCE'),
          ask: 'table', q: '先估：輸出是什麼？',
          options: ['28, 7', '28, 8', '7, 7', '8, 8'],
          why: 'ATTENDANCE 有 28 筆上班記錄；不同的 EID 只有 7 個（E08 沒有上班記錄，不會出現在 ATTENDANCE）。題目問「員工數量」，答案是 `COUNT(DISTINCT EID)`。' },
      ],
      practice: [
        { id: 'a6-s2-p1', type: 'complete', pts: 2, src: '綜合練習 p.310 第 9(d) 題', db: 'shop', label: '補完 SQL',
          q: '找出 2022 年 1 月份所有訂單產生的總收入。',
          template: C('SELECT ［1］', 'FROM ORDERS', 'WHERE ［2］'),
          ref: ['SUM(TOTAL)', 'YEAR(ORDERDATE) = 2022 AND MONTH(ORDERDATE) = 1'],
          hint: '總收入是 TOTAL 的總和；條件要同時限制年份和月份（2021-12-31、2022-02-01 都不應計算）。' },
        { id: 'a6-s2-p2', type: 'mc', pts: 2, src: '綜合練習 p.310 第 9(e) 題（改編）', db: 'shop', verify: true, ask: { col: 'CUSTOMERID' },
          q: '以下語句的輸出是什麼？',
          sql: C('SELECT CUSTOMERID', 'FROM ORDERS', 'WHERE YEAR(ORDERDATE) = 2022', 'GROUP BY CUSTOMERID', 'HAVING COUNT(*) >= 3'),
          options: ['C2001', 'C2001, C2002', 'C2002, C2003', 'C2001, C2002, C2003'], answer: 0,
          hint: 'C2001 的 O1001 在 2021 年，先被 WHERE 剔除。',
          why: '2022 年：C2001 有 3 張訂單（O1002、O1005、O1007），C2002、C2003 各 2 張。' },
        { id: 'a6-s2-p3', type: 'mc', pts: 2, src: '綜合練習 p.311 第 10(d) 題（改編）', db: 'mart', verify: true, ask: 'table',
          q: '以下語句的輸出是什麼？',
          sql: C('SELECT PRODUCTID, COUNT(*)', 'FROM SALES', 'GROUP BY PRODUCTID', 'HAVING COUNT(*) >= 2', 'ORDER BY PRODUCTID'),
          options: ['P1001, 4', 'P1001, 4\nP1003, 2\nP2002, 2', 'P1001, 4\nP1002, 1\nP1003, 2\nP2002, 2', 'P1001, 10\nP1003, 3\nP2002, 3'], answer: 1,
          hint: 'COUNT(*) 數的是交易記錄數目，不是 QUANTITY 的總和；>= 2 包括剛好 2 次。',
          why: 'P1001 有 4 筆交易，P1003、P2002 各 2 筆，P1002 只有 1 筆。' },
      ],
    },
    // ───────────────────────── s3 ─────────────────────────
    {
      id: 's3', title: '連接、子查詢與集合運算', pages: '教科書 p.104–169；綜合練習 p.309–311 第 8(b)(i)(ii)(v)、9(f)、10(c) 題',
      learn: [
        { pts: [
          '連接兩個數據表：`FROM A, B WHERE A.k = B.k` 或 `FROM A INNER JOIN B ON A.k = B.k`。N 個數據表要 N − 1 個連接條件。（p.104–107）',
          '`LEFT JOIN`：保留左表所有記錄，沒有配對的右表欄位是 NULL。配合 `WHERE 右表.k IS NULL` 可找出「沒有……」的記錄。（p.108）',
          '同一個數據表可以用兩次（給不同別名），例如 8(b)(ii)：員工 `E` 和經理 `M` 都在 EMPLOYEE。',
          '子查詢：`IN`／`NOT IN`、`EXISTS`／`NOT EXISTS`、`= (SELECT MAX(…))`、`> (SELECT AVG(…))`。（p.134–157）',
          '集合運算：`UNION`（合併、去除重複）、`INTERSECT`（兩邊都有）、`MINUS`／`EXCEPT`（在左邊而不在右邊）。（p.158–169）',
          '連接後同一個值可能重複出現，題目要「列出產品名稱」時要考慮 `DISTINCT`。',
        ] },
        { table: { head: ['綜合練習題目', '參考答案（本單元自擬）'], rows: [
          ['8(b)(i) 銷售部員工的姓名和部門，按姓名升序', '`SELECT E.ENAME, D.DEPT_NAME FROM EMPLOYEE E, DEPARTMENT D WHERE E.DEPT_ID = D.DEPT_ID AND D.DEPT_NAME = \'銷售部\' ORDER BY E.ENAME`'],
          ['8(b)(ii) 人力資源部員工的姓名及其部門經理的姓名', '`SELECT E.ENAME, M.ENAME FROM EMPLOYEE E, DEPARTMENT D, EMPLOYEE M WHERE E.DEPT_ID = D.DEPT_ID AND D.DEPT_MANAGER = M.EID AND D.DEPT_NAME = \'人力資源部\'`'],
          ['9(f) `SELECT PRODUCTID FROM PRODUCT MINUS SELECT PRODUCTID FROM PRODUCTORDER` 的目的', '列出從未被訂購（沒有出現在任何訂單）的產品識別碼'],
          ['10(c) 向顧客 C2001 出售的產品名稱，按字母順序', '`SELECT DISTINCT P.PRODUCTNAME FROM SALES S, PRODUCT P WHERE S.PRODUCTID = P.PRODUCTID AND S.CUSTOMERID = \'C2001\' ORDER BY P.PRODUCTNAME`'],
        ] } },
        { sim: { db: 'hr', sql: C('SELECT E.ENAME, M.ENAME AS MANAGER', 'FROM EMPLOYEE E, DEPARTMENT D, EMPLOYEE M', 'WHERE E.DEPT_ID = D.DEPT_ID', '  AND D.DEPT_MANAGER = M.EID', "  AND D.DEPT_NAME = '人力資源部'") }, cap: '綜合練習 8(b)(ii)（p.309）：EMPLOYEE 用了兩次，E 是員工，M 是經理。' },
        { note: '「找出沒有……」的四種寫法（結果相同）：`NOT IN (子查詢)`、`LEFT JOIN … WHERE … IS NULL`、`NOT EXISTS (相關子查詢)`、`MINUS`。用 `NOT IN` 時，子查詢的欄位不可有 NULL。' },
        { sim: { db: 'shop', sql: C('SELECT PRODUCTID FROM PRODUCT', 'WHERE PRODUCTID NOT IN (SELECT PRODUCTID', '                        FROM PRODUCTORDER)') }, cap: '與 9(f) 的 MINUS 語句結果相同。（MySQL 不接受 MINUS，上機要改寫成 NOT IN 或 EXCEPT。）' },
      ],
      tries: [
        { id: 'a6-s3-t1', pts: 4, src: '綜合練習 p.309 第 8(b)(ii) 題', db: 'hr',
          sql: C('SELECT E.ENAME, M.ENAME AS MANAGER', 'FROM EMPLOYEE E, DEPARTMENT D, EMPLOYEE M', 'WHERE E.DEPT_ID = D.DEPT_ID', '  AND D.DEPT_MANAGER = M.EID', "  AND D.DEPT_NAME = '人力資源部'"),
          ask: 'rows', q: '先估：結果有多少行？',
          options: ['1', '3', '4', '8'],
          why: '人力資源部（D001）有 E01、E02、E08 三名員工，每人一行，經理都是 Alan Chan（經理本人也是部門員工，所以也會出現）。' },
        { id: 'a6-s3-t2', pts: 4, src: '綜合練習 p.310 第 9(f) 題', db: 'shop',
          sql: C('SELECT PRODUCTID FROM PRODUCT', 'MINUS', 'SELECT PRODUCTID FROM PRODUCTORDER'),
          ask: { col: 'PRODUCTID' }, q: '先估：輸出是什麼？',
          options: ['P3007', 'P3002, P3005', 'P3004N, P3006N, P3007', 'P3001, P3003, P3005'],
          why: 'MINUS 保留在 PRODUCT 中、但不在 PRODUCTORDER 中的 PRODUCTID，即從未被訂購的產品：只有 P3007。（P3002、P3005 是售罄，與訂購無關。）' },
      ],
      practice: [
        { id: 'a6-s3-p1', type: 'complete', pts: 3, src: '綜合練習 p.311 第 10(c) 題', db: 'mart', label: '補完 SQL',
          q: '列出向顧客 \'C2001\' 出售的產品名稱，按產品名稱的字母順序排列（每個名稱只列一次）。',
          template: C('SELECT ［1］ P.PRODUCTNAME', 'FROM SALES S, PRODUCT P', 'WHERE ［2］', "  AND S.CUSTOMERID = 'C2001'", 'ORDER BY ［3］'),
          ref: ['DISTINCT', 'S.PRODUCTID = P.PRODUCTID', 'P.PRODUCTNAME'], check: { order: true },
          hint: 'C2001 買了兩次 Cookies；兩個數據表要一個連接條件。' },
        { id: 'a6-s3-p2', type: 'mc', pts: 2, src: '自擬（參考教科書 p.108–111 LEFT JOIN）', db: 'hr', verify: true, ask: { col: 'ENAME' },
          q: '以下語句的輸出是什麼？',
          sql: C('SELECT E.ENAME', 'FROM EMPLOYEE E LEFT JOIN ATTENDANCE A', '  ON E.EID = A.EID', 'WHERE A.EID IS NULL'),
          options: ['Helen Ng', 'Fiona Lam, Helen Ng', 'Eric Ho, Helen Ng', 'Alan Chan, Betty Lee, Calvin Cheung, Daisy Wong, Eric Ho, Fiona Lam, Gary Chow'], answer: 0,
          hint: 'A.EID IS NULL：在 ATTENDANCE 中完全找不到配對的員工。',
          why: '只有 E08 Helen Ng 沒有任何上班記錄。Fiona Lam 在 2023 年沒有上班，但 2024 年有記錄，所以有配對。' },
        { id: 'a6-s3-p3', type: 'fill', pts: 2, src: '自擬（子查詢）', db: 'shop',
          q: '以下語句輸出多少行？',
          sql: C('SELECT PRODUCTNAME', 'FROM PRODUCT', 'WHERE PRICE > (SELECT AVG(PRICE)', '               FROM PRODUCT)'),
          blanks: [{ label: '行數', ask: 'rows' }],
          hint: '先計算子查詢：7 件產品的平均價格是多少？' },
      ],
    },
    // ───────────────────────── s4 ─────────────────────────
    {
      id: 's4', title: '數據庫設計：鍵碼、完整性、實體關係圖、規範化', pages: '教科書 p.170–185、202–237、244–297；綜合練習 p.308–312 第 1–7、8(a)、11 題',
      learn: [
        { h: '鍵碼與完整性（第 8(a)、1 題）' },
        { pts: [
          '**主關鍵碼**：獨一無二、不可為 NULL、最簡化；可以由多個欄位組成（複合鍵）。**外鍵碼**：參照另一個數據表的主關鍵碼。（p.213–222）',
          '**實體完整性**：主關鍵碼存在而且有效；**參照完整性**：外鍵碼的值必須在父數據表中存在（或為 NULL）；**域完整性**：數據類型和限制。（p.225–232）',
          '第 1 題：員工離職而被刪除，但 SHOP 的經理欄（外鍵碼）仍指向他 → 違反**參照完整性**。做法：先把該商店的經理改為另一名員工（或 NULL），才刪除員工記錄（或設定 ON DELETE 動作）。',
        ] },
        { table: { head: ['第 8(a) 題', '主關鍵碼', '外鍵碼'], rows: [
          ['EMPLOYEE', 'EID', 'DEPT_ID（參照 DEPARTMENT）'],
          ['ATTENDANCE', '(EID, ATT_DATE)', 'EID（參照 EMPLOYEE）'],
          ['DEPARTMENT', 'DEPT_ID', 'DEPT_MANAGER（參照 EMPLOYEE.EID）'],
        ] } },
        { warn: 'ATTENDANCE 中 EID 會重複（每天一筆），單獨 EID 不能做主關鍵碼；同一員工每天只有一筆上班記錄，所以 (EID, ATT_DATE) 才是主關鍵碼。' },
        { h: '檢視、索引、衍生屬性、回滾（第 2–4 題）' },
        { table: { head: ['概念', '要點'], rows: [
          ['檢視 view（p.170–181、299）', '虛擬的數據表。優點：簡化經常重用的複雜查詢；只讓用戶看到部分欄位／記錄，保障數據私隱。'],
          ['索引 index（p.182–185、223）', '優點：加快檢索（可用二分檢索）。缺點：需要額外儲存空間；插入／更新數據時要同時更新索引，較慢。只為經常搜尋的欄位（例如姓名）建立索引。'],
          ['衍生屬性（p.204）', '可由其他屬性計算出來，例如由 DOE（僱用日期）和今天日期計算 LOE（僱用期限）。優點：查詢時不用每次計算；缺點：佔用空間，而且日子過去後數值會過時，要不斷更新，否則數據不一致。'],
          ['回滾 rollback（p.233–）', '把數據庫復原至先前的狀態（例如交易出錯後取消）。要定期備份；回滾後，之後的合法更新亦可能一併消失。'],
        ] } },
        { h: '實體關係圖（第 5–7 題）' },
        { pts: [
          '第 5 題：員工與部門是**多對多**（員工可在多個部門工作，部門有多名員工）；「部門由一位員工管理」是另一個關係（每個部門有一名經理）。',
          '第 7 題：「選科紀錄」連接一個課程和一個學生並有成績 → 把學生與課程的多對多關係**分解**為兩個一對多關係。（p.260–276）',
        ] },
        { er: { entities: [
          { name: 'STUDENT', attrs: ['*SID', 'SNAME'] },
          { name: 'ENROLMENT', attrs: ['*SID', '*CID', 'GRADE'] },
          { name: 'COURSE', attrs: ['*CID', 'CNAME', 'CREDIT'] },
          { name: 'LECTURER', attrs: ['*LID', 'LNAME'] },
        ], rels: [
          { a: 'STUDENT', b: 'ENROLMENT', name: '進行', card: '1:M' },
          { a: 'ENROLMENT', b: 'COURSE', name: '屬於', card: 'M:1' },
          { a: 'LECTURER', b: 'COURSE', name: '教授', card: 'M:N' },
        ] }, cap: '第 7 題（p.309）參考答案。題目不要求屬性，這裏加上方便理解。' },
        { h: '規範化（第 11 題）' },
        { pts: [
          '1NF：每個屬性只有一個值、沒有重複屬性；2NF：再沒有**部分**功能相關性；3NF：再沒有**遞移**功能相關性。（p.283–291）',
          '第 11 題的借書紀錄：一名用戶有多筆借書（重複組），每筆有 ISBN、書名、DDC、借書日、到期日。NAME 只依賴 HKID、書名只依賴 ISBN（部分功能相關性）；ISBN → DDC → 種類（遞移功能相關性）。所以要拆成四個數據表。',
        ] },
        { code: C('USER     (HKID, NAME, GENDER, PHONE, EMAIL)          主關鍵碼：HKID', 'CATEGORY (DDC, CATEGORY)                             主關鍵碼：DDC', 'BOOK     (ISBN, TITLE, DDC)                          主關鍵碼：ISBN；外鍵碼：DDC', 'LOAN     (HKID, ISBN, BORROW_DATE, DUE_DATE)          主關鍵碼：(HKID, ISBN, BORROW_DATE)；', '                                                      外鍵碼：HKID、ISBN'), cap: '第 11 題（p.312）參考答案（3NF）。同一用戶可以再借同一本書（陳大文兩次借《豬命何在？》），所以借書日要放進主關鍵碼。' },
        { sim: { db: 'hr', sql: C("DELETE FROM EMPLOYEE WHERE EID = 'E04';", 'SELECT DEPT_ID, DEPT_MANAGER', 'FROM DEPARTMENT', 'WHERE DEPT_MANAGER NOT IN (SELECT EID FROM EMPLOYEE)') }, cap: '模擬第 1 題：本練習的數據表沒有設定外鍵碼限制，刪除經理後，DEPARTMENT 便出現「孤兒」外鍵碼 —— 這就是參照完整性受到破壞。' },
      ],
      tries: [
        { id: 'a6-s4-t1', pts: 4, src: '綜合練習 p.308 第 1 題（改用第 8 題的數據表）', db: 'hr',
          sql: C("DELETE FROM EMPLOYEE WHERE EID = 'E04';", 'SELECT DEPT_ID, DEPT_MANAGER', 'FROM DEPARTMENT', 'WHERE DEPT_MANAGER NOT IN (SELECT EID FROM EMPLOYEE)'),
          ask: 'table', q: '先估：刪除 E04 後，SELECT 的輸出是什麼？（數據表沒有設定外鍵碼限制）',
          options: ['D002, E04', 'D001, E01\nD002, E04\nD003, E07', 'D001, E01\nD003, E07', '（沒有輸出）E04 已被刪除'],
          why: 'E04 是銷售部（D002）的經理。刪除後 DEPT_MANAGER = \'E04\' 找不到對應員工，違反參照完整性。若有設定外鍵碼限制，DBMS 會拒絕這次刪除。' },
      ],
      practice: [
        { id: 'a6-s4-p1', type: 'fd', pts: 1, src: '綜合練習 p.309 第 8(a) 題', q: 'ATTENDANCE (EID, ATT_DATE, ATT_TIME)：同一員工每天只有一筆上班記錄。候選鍵碼是什麼？',
          attrs: 'EID ATT_DATE ATT_TIME', fds: 'EID ATT_DATE -> ATT_TIME', ask: 'keys',
          options: ['EID', 'ATT_DATE', 'EID ATT_DATE', 'EID ATT_DATE ATT_TIME'] },
        { id: 'a6-s4-p2', type: 'fd', pts: 2, src: '綜合練習 p.312 第 11 題', q: '把第 11 題的借書紀錄寫成一個數據表（屬性如下）。HKID 決定用戶資料；ISBN 決定書名和 DDC；DDC 決定種類；同一用戶在同一日借同一本書只有一筆記錄。候選鍵碼是什麼？',
          attrs: 'HKID NAME ISBN TITLE DDC CATEGORY BDATE DUEDATE', fds: 'HKID -> NAME; ISBN -> TITLE DDC; DDC -> CATEGORY; HKID ISBN BDATE -> DUEDATE', ask: 'keys',
          options: ['HKID ISBN', 'HKID ISBN BDATE', 'ISBN BDATE', 'HKID BDATE DUEDATE'] },
        { id: 'a6-s4-p3', type: 'fd', pts: 1, src: '綜合練習 p.312 第 11 題', q: '上題的數據表（已是 1NF）最高符合哪個範式？',
          attrs: 'HKID NAME ISBN TITLE DDC CATEGORY BDATE DUEDATE', fds: 'HKID -> NAME; ISBN -> TITLE DDC; DDC -> CATEGORY; HKID ISBN BDATE -> DUEDATE', ask: 'nf',
          options: ['1NF', '2NF', '3NF'] },
        { id: 'a6-s4-p4', type: 'mc', pts: 2, src: '綜合練習 p.309 第 7 題',
          q: '第 7 題：每個選科紀錄都與一個課程和一個學生相關聯，並包括一個成績。以下哪項最能表示學生、選科紀錄、課程之間的關係？',
          options: ['學生 1:M 選科紀錄，選科紀錄 M:1 課程', '學生 M:1 選科紀錄，選科紀錄 1:M 課程', '學生 1:1 選科紀錄，選科紀錄 1:1 課程', '學生 M:N 課程，不需要選科紀錄'], answer: 0,
          hint: '一名學生有多個選科紀錄；一個選科紀錄只屬於一個課程。',
          why: '學生與課程本是多對多；「選科紀錄」帶有自己的屬性（成績），把它分解為兩個一對多關係（教科書 p.260–276）。' },
      ],
    },
    // ───────────────────────── write ─────────────────────────
    {
      kind: 'write',
      tasks: [
        { id: 'a6-w1', pts: 10, title: '向 C2001 出售的產品', db: 'mart',
          q: C('綜合練習 p.311 第 10(c) 題。', '', '使用 `mart` 數據庫，寫一句 SQL：列出曾經向顧客 `\'C2001\'` 出售的**產品名稱**，按產品名稱的字母順序（升序）排列。每個產品名稱只列一次。'),
          starter: C('SELECT PRODUCTNAME', 'FROM PRODUCT'),
          ref: C('SELECT DISTINCT P.PRODUCTNAME', 'FROM SALES S, PRODUCT P', 'WHERE S.PRODUCTID = P.PRODUCTID', "  AND S.CUSTOMERID = 'C2001'", 'ORDER BY P.PRODUCTNAME'),
          check: { order: true },
          hint: '產品名稱在 PRODUCT，顧客在 SALES：兩個數據表要用 PRODUCTID 連接。C2001 買過兩次同一產品，要用 DISTINCT。' },
        { id: 'a6-w2', pts: 12, title: '2023 年上班超過 3 次的員工', db: 'hr',
          q: C('綜合練習 p.309 第 8(b)(iv) 題（原題「超過 15 次」，本題改為 3 次）。', '', '使用 `hr` 數據庫，寫一句 SQL：列出 **2023 年**有**超過 3 次**上班記錄的員工姓名（ENAME）。', '', '留意：2022 年、2024 年的記錄不計；剛好 3 次的不算「超過」。'),
          starter: C('SELECT ENAME', 'FROM EMPLOYEE'),
          ref: C('SELECT E.ENAME', 'FROM EMPLOYEE E, ATTENDANCE A', 'WHERE E.EID = A.EID', '  AND YEAR(A.ATT_DATE) = 2023', 'GROUP BY E.EID, E.ENAME', 'HAVING COUNT(*) > 3'),
          rules: [{ must: 'GROUP BY', msg: '要按員工分組（GROUP BY）才可計算每人的次數。' }],
          hint: '先用 WHERE 只保留 2023 年的記錄（YEAR(ATT_DATE) = 2023），再 GROUP BY 員工，最後 HAVING COUNT(*) > 3。姓名在 EMPLOYEE，要連接。' },
        { id: 'a6-w3', pts: 13, title: '2023 年上班不超過 3 天的員工（包括從未上班）', db: 'hr',
          q: C('綜合練習 p.309 第 8(b)(v) 題（原題「未超過 15 天」，本題改為 3 天）。', '', '使用 `hr` 數據庫，寫一句 SQL：列出 2023 年上班天數**未超過 3 天**的員工姓名（ENAME）。', '', '留意：2023 年**完全沒有**上班記錄的員工（0 天）也要列出。'),
          starter: C('SELECT E.ENAME', 'FROM EMPLOYEE E, ATTENDANCE A', 'WHERE E.EID = A.EID', '  AND YEAR(A.ATT_DATE) = 2023', 'GROUP BY E.EID, E.ENAME', 'HAVING COUNT(*) <= 3'),
          ref: C('SELECT ENAME', 'FROM EMPLOYEE', 'WHERE EID NOT IN (SELECT EID', '                  FROM ATTENDANCE', '                  WHERE YEAR(ATT_DATE) = 2023', '                  GROUP BY EID', '                  HAVING COUNT(*) > 3)'),
          hint: '起始語句用了連接，0 天的員工在 2023 年沒有配對記錄，所以不會出現。換個角度：先用子查詢找出「超過 3 天」的員工 EID（即 w2），再用 NOT IN 找出其餘的員工。' },
      ],
    },
    // ───────────────────────── quiz ─────────────────────────
    {
      kind: 'quiz',
      items: [
        { id: 'a6-q1', pts: 3, src: '綜合練習 p.308 第 1(a) 題', tags: [HOT_INT],
          q: '零售連鎖公司用 SHOP 和 STAFF 儲存數據，SHOP 有一欄記錄經理的員工編號（外鍵碼）。一名身為經理的員工離職，其 STAFF 記錄被刪除，管理員沒有採取其他行動。可能會違反哪種完整性？',
          options: ['實體完整性：STAFF 的主關鍵碼變成 NULL', '參照完整性：SHOP 的經理外鍵碼指向不存在的員工', '域完整性：經理欄的數據類型不正確', '不會違反任何完整性'], answer: 'B',
          why: '外鍵碼的值必須在父數據表（STAFF）中存在。員工被刪除後，SHOP 中仍記錄他的編號，便違反參照完整性（p.226）。' },
        { id: 'a6-q2', pts: 3, src: '綜合練習 p.308 第 1(b) 題',
          q: '承上題，應採取什麼行動以解決問題？',
          options: ['刪除 SHOP 數據表', '把 STAFF 的主關鍵碼改為允許 NULL', '先把該商店的經理更新為另一名員工（或暫設為 NULL），才刪除該員工的記錄', '在 STAFF 為員工姓名建立索引'], answer: 'C',
          why: '先更新 SHOP 中參照該員工的外鍵碼，確保每個外鍵碼都有對應記錄，才刪除員工。' },
        { id: 'a6-q3', pts: 3, src: '綜合練習 p.308 第 2(b)(c) 題',
          q: '以下哪項是使用索引的**缺點**？',
          options: ['不能再用 WHERE 檢索該欄位', '需要額外儲存空間，而且插入或更新記錄時要同時更新索引', '令數據表不能設定主關鍵碼', '令 SELECT 的結果次序錯誤'], answer: 'B',
          why: '索引加快檢索，但要佔用空間，而且改動數據時 DBMS 需時更新索引（p.223、182–185）。只應為經常搜尋的非關鍵欄位（例如姓名）建立索引。' },
        { id: 'a6-q4', pts: 3, src: '綜合練習 p.308 第 2(a) 題',
          q: '以下哪項**不是**使用檢視（view）的優點？',
          options: ['簡化經常重用的複雜查詢', '只讓某些用戶看到部分欄位或記錄，保障數據私隱', '檢視會另外複製一份數據，所以原數據表損壞時可用作備份', '用戶可以像使用數據表一樣查詢檢視'], answer: 'C',
          why: '檢視是「虛擬的數據表」，不會另存一份數據（p.170），不能當作備份。' },
        { id: 'a6-q5', pts: 3, src: '綜合練習 p.308 第 3 題', tags: [{ t: 'trap', why: '考生常只答「可以計算出來」，沒有說明由哪些屬性計算。' }],
          q: 'EMPLOYEE 儲存了 DOE（僱用日期）和 LOE（僱用期限）。以下哪項說明最正確？',
          options: ['LOE 是主關鍵碼，因為每名員工的僱用期限都不同', 'LOE 是衍生屬性，可由 DOE 和今天的日期計算；儲存它可省去每次計算，但數值會隨時間過時，須不斷更新', 'LOE 是外鍵碼，參照 DOE', 'DOE 是衍生屬性，可由 LOE 計算，因此應刪除 DOE'], answer: 'B',
          why: '衍生屬性可由其他屬性計算出來（p.204）。優點：查詢較快、SQL 較簡單；缺點：佔用空間，而且不更新便會與 DOE 不一致。' },
        { id: 'a6-q6', pts: 3, src: '綜合練習 p.308 第 4 題',
          q: '一筆信用卡轉帳交易完成後，發現要取消。應該對數據庫採取什麼行動？',
          options: ['DROP TABLE，再重新建立數據表', '回滾（rollback）：把數據庫復原至交易前的狀態', '為交易數據表建立索引', '建立一個只顯示該交易的檢視'], answer: 'B',
          why: '回滾把數據庫復原至先前的狀態（p.233）。要留意：若用舊備份回滾，備份之後其他合法的交易也可能一併消失，導致數據不完整或不一致。' },
        { id: 'a6-q7', pts: 2, src: '綜合練習 p.310 第 9(f) 題', db: 'shop', tags: [HOT_SUB],
          q: '`SELECT PRODUCTID FROM PRODUCT MINUS SELECT PRODUCTID FROM PRODUCTORDER` 的目的是什麼？',
          sql: C('SELECT PRODUCTID FROM PRODUCT', 'MINUS', 'SELECT PRODUCTID FROM PRODUCTORDER'),
          options: ['列出所有已售罄的產品識別碼', '列出最少被訂購的產品識別碼', '列出從未被任何訂單訂購的產品識別碼', '列出曾被訂購的產品識別碼'], answer: 'C',
          why: 'MINUS（EXCEPT）保留在第一個結果、但不在第二個結果中的值。在本單元的數據，結果是 P3007。' },
      ],
    },
    { kind: 'endless', gens: ['sqlAgg', 'sqlJoin', 'sqlSub', 'fdNf'] },
    { kind: 'report' },
  ],
};
