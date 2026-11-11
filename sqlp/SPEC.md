# SQL 自學平台（選修A）：共用格式

Contract between the framework (`sqlp/`) and unit files (`electa/src/*.js`).
Same look, flow, scoring, report and teacher page as D1 (`d1/`) and the Python
platform (`py/SPEC.md` — read it: sections, ids, scoring §4, content rules §5
apply here unchanged, with "Python" replaced by "SQL"). Student text: HK
Traditional Chinese. Teacher PIN in `electa/course.json`.

## 1. Engine

The SQL engine already exists in `sql-design/index.html` (object returned by the
IIFE: `{SErr, tokenize, parse, run, exec, evalRow, fmtV, likeRe, cmpv}`; plus `FDX`
design engine: functional dependencies, candidate keys, normal forms,
decomposition). Rules follow MySQL 8.0 + DSE Paper 2A conventions (single quotes,
`%` `_`, `MINUS`/`FULL JOIN` accepted as DSE notation, case-insensitive string
compare, `/` real division, aggregates ignore NULL, ONLY_FULL_GROUP_BY). The
framework extracts these into `sqlp/engine.js` (works in browser and node) and
may extend it (CREATE TABLE / ALTER / DROP / views if the textbook needs them,
more functions). Build verifies every answer with this same engine. Python's
sqlite3 (3.53) may be used as a cross-check only where semantics match.

Tables value format: `T = { NAME: [ [col,…], [ [v,…], … ] ] }`; values are
numbers, strings, `null`; dates as `'YYYY-MM-DD'` strings (engine supports date
functions if the textbook needs them).

## 2. Unit file

```js
module.exports = {
  id:'a1', title:'…', book:'教科書 選修A 第 1 章 p.…', key:'A-a1-hmac-<10 hex>',
  theory:false,
  dbs: { school: { STUDENT: [['SID','SNAME','CLASS'], [['S01','Amy','5A'], …]], CLUB: … } },
  sections:[ … ]   // learn sections, {kind:'write'}, {kind:'quiz'}, {kind:'endless'}, {kind:'report'}
};
```

Every item that runs SQL names its database `db:'school'` (a key of `dbs`) and
gives `sql` (one statement, or several separated by `;` — DML first, then the
last SELECT is shown/compared).

Learn blocks: as py (`pts`, `h`, `table`, `note`, `warn`, `fix`, `code` (SQL),
`sim:{db, sql, open?}`) — `sim` is a runnable SQL console: editor + ▶ 執行 +
result grid + the tables of that db (collapsible), DML shown on a copy with
changed rows highlighted; 「重設數據」 button.
Also `{er: 'mermaid-like or simple text spec'}` — framework renders a simple ER
diagram (entity boxes, attributes, PK underlined, relationship lines with 1/M);
format: `{er:{entities:[{name, attrs:['*SID','SNAME'], }], rels:[{a:'STUDENT', b:'CLUB', name:'參加', card:'M:1'}]}}`.

Try item: `{id, pts:4, db, sql, q:'先估：結果有多少行？' , ask, options, why}`.
`ask`: `'rows'` (number of result rows), `{cell:[row, 'COL']}` (value), `'table'`
(whole result as text, rows `|`-separated cells joined by `, ` and rows by `\n`,
e.g. `Amy, 5A\nBen, 5B` — option strings use the same format), `{col:'SNAME'}`
(values of one column joined by `, ` in result order), `'error'` (engine error /
'沒有錯誤'), `{after:'TABLE'}` (table content after DML, same text format).

Practice types:
* `mc` `{type:'mc', q, db?, sql?, options, answer:0-based, verify?, ask?}`
* `fill` blanks `{label, ask}` (from a run) or `{label, a, accept}`
* `complete` `{type:'complete', db, template:'SELECT ［1］ FROM STUDENT WHERE ［2］', ref:[…], check?:{order:true}}`
  — student's blanks substituted and run; result must equal ref's result
  (as a bag of rows unless the ref has ORDER BY or `check.order`; column names ignored unless `check.cols`).
* `fd` (design units): `{type:'fd', q, attrs:'A B C D', fds:'A->B; B->C', ask:'keys'|'nf'|'closure:A'|'decompose3NF', options or fill}` — answers computed by FDX.

Write tasks: `{id, pts, title, q, db, starter:'SELECT …', ref:'…', check?:{order, cols}, rules?:[{must:'GROUP BY', msg}], hint}`
— checked by running against the unit db AND against 1–2 hidden variant dbs the
framework derives automatically (shuffle row order, change some values) so
hard-coded answers fail; ref must pass, starter must fail.
Table tasks (theory): same as D1 (`kind:'table'`).

Quiz items as py (`db`/`sql` optional, `verify` uses ask).
Endless gens (framework provides, JS computes with engine): `sqlWhere` (rows
returned by a WHERE with AND/OR/NOT/BETWEEN/IN/LIKE/NULL), `sqlAgg` (COUNT/SUM/
AVG/MAX/MIN, GROUP BY, HAVING), `sqlFunc` (string/number/date functions),
`sqlJoin` (rows of INNER/LEFT/… JOIN), `sqlSet` (UNION/INTERSECT/MINUS),
`sqlSub` (subquery IN/EXISTS), `sqlDml` (table after INSERT/UPDATE/DELETE),
`fdKey` (candidate key), `fdNf` (highest normal form), `erCard` (cardinality).

## 3. Folders

```
sqlp/  engine.js common.js style.css tools/build.js tools/test_site.py READY demo/
electa/course.json  electa/src/a1.js …  → electa/a1/index.html, teacher/, index.html
```
Build: `node sqlp/tools/build.js electa [--only a1] [--out dir]`; tests:
`python3 sqlp/tools/test_site.py electa [a1]`. Done = both pass. No git commits.

## Framework notes（框架實作說明，向後相容）

**Engine** `sqlp/engine.js` (browser `window.SQLE`, node `require`). Supports, beyond sql-design:
multi-statement scripts (`;`), `SELECT` without `FROM`, `LIMIT n [OFFSET m]`, `CASE`, `IS TRUE`,
`JOIN … USING`, `NATURAL JOIN` (`SELECT *` shows shared columns once, first — MySQL), `%`/`MOD`/`DIV`,
`CREATE TABLE` (types INT/INTEGER/SMALLINT/TINYINT/BIGINT/BOOL/FLOAT/DOUBLE/DECIMAL(p,s)/CHAR(n)/VARCHAR(n)/TEXT/DATE/DATETIME/TIME;
constraints PRIMARY KEY, FOREIGN KEY … REFERENCES (RESTRICT only), NOT NULL, UNIQUE, DEFAULT, CHECK, AUTO_INCREMENT, CONSTRAINT name),
`ALTER TABLE` (RENAME [TO], RENAME COLUMN a TO b, ADD [COLUMN] …, ADD PRIMARY KEY/FOREIGN KEY/UNIQUE/CHECK/INDEX,
MODIFY, CHANGE, DROP [COLUMN] c, DROP PRIMARY KEY, DROP FOREIGN KEY n, DROP INDEX n, DROP CHECK n, ALTER c SET/DROP DEFAULT),
`DROP TABLE`, `CREATE [OR REPLACE] VIEW`, `DROP VIEW`, `CREATE [UNIQUE] INDEX`, `SHOW TABLES`, `SHOW CREATE TABLE`, `DESCRIBE`,
`CREATE/DROP DATABASE`, `USE` (messages only). Constraint names: FK `<table>_ibfk_n`, CHECK `<table>_chk_n`, UNIQUE = first column name (MySQL).
Every INSERT/UPDATE/DELETE/ALTER is checked: PK (unique, not NULL), NOT NULL, UNIQUE, CHECK, FK (child insert/update and parent delete/update),
type coercion (INT rounds, CHAR/VARCHAR length → 數據太長, DATE must be valid `'yyyy-mm-dd'`).
Functions: LENGTH (= number of **characters**, as the textbook defines it; MySQL counts bytes), CHAR_LENGTH, MID/SUBSTR/SUBSTRING, LEFT, RIGHT,
UPPER/LOWER, TRIM/LTRIM/RTRIM, SPACE, CONCAT, CONCAT_WS, REPLACE, INSTR, LOCATE, LPAD/RPAD, REPEAT, REVERSE, ROUND, FLOOR, CEIL, TRUNCATE, ABS,
MOD, POWER, SQRT, IFNULL, COALESCE, NULLIF, IF, YEAR/MONTH/DAY, DATE, ADDDATE/DATE_ADD/SUBDATE/DATE_SUB (days or `INTERVAL n DAY|MONTH|YEAR`),
DATEDIFF, TIMESTAMPDIFF(YEAR|MONTH|DAY…, a, b), CURDATE/NOW (do not use in checked answers), aggregates COUNT/SUM/AVG/MAX/MIN/GROUP_CONCAT
([DISTINCT] … [ORDER BY …] [SEPARATOR '…']).
**ONLY_FULL_GROUP_BY follows MySQL's functional dependence**: a non-aggregated column is allowed if the GROUP BY columns contain the whole PK
of its table, or it is reachable through `=` equalities in INNER JOIN … ON / WHERE (AND-connected) from grouped columns / determined PKs.
So declare PKs on tables (below).

**Databases (`dbs`)**: each table is `[cols, rows]`, `[cols, rows, pk]` (pk = array of column names, or one name), or mark PK columns with a
leading `*` in `cols` (`['*SID','NAME']`). A db may also be a **SQL script string** (`"CREATE TABLE …; INSERT INTO …;"`) — use this when the
unit needs types/constraints (NOT NULL, FK, CHECK, DEFAULT…), e.g. CH1/CH4. The build checks that the given data satisfies the constraints.

**Answer text (`ask`)** — default `'table'` when omitted:
* `'table'`: result rows, cells joined by `, `, rows by `\n` (no header). Empty result = `''`; options may write `（沒有記錄）`.
* `'rows'`: number of rows. `'cols'`: column headers joined by `, `.
* `{col:'NAME'}`: that column's values in result order joined by `, ` (header matched case/space-insensitively; `T.NAME` also matches `NAME`).
* `{cell:[r, 'COL']}`: **r is 1-based** (first result row = 1; build rejects 0). COL may be a 1-based column number.
* `{after:'TABLE'}`: whole table content after running the statements (`'table'` format, table's own row order: INSERT appends at end).
* `'error'`: the engine's **error label**, or `'沒有錯誤'`. Labels: `語法錯誤`, `找不到欄位`, `找不到數據表`, `欄名不清楚`, `分組錯誤`
  (ONLY_FULL_GROUP_BY, SELECT * with GROUP BY), `聚合函數使用錯誤` (aggregate in WHERE/ON, nested), `數據類型錯誤`
  (text vs number compare, text arithmetic, bad date), `子查詢錯誤`, `違反主關鍵碼限制` (duplicate or NULL PK), `違反 NOT NULL 限制`,
  `違反 UNIQUE 限制`, `違反 CHECK 限制`, `違反外鍵碼限制`, `數據太長`, `已存在`, `欄位數目不符`, `其他錯誤`. An option equal to the
  full engine message also matches. Prefer labels.
* Values: NULL → `NULL`; numbers → shortest form up to 12 significant digits (`75.5`, not `75.5000`; AVG 407/7 → `58.1428571429`;
  `/` is real division so `10/4` → `2.5`); dates as stored `'2025-09-01'` (no quotes). To avoid long decimals use data whose AVG is
  exact, or `ROUND(AVG(x), 2)`.
* Comparison (`same`): trim; per line, split cells on `,`, trim each, collapse spaces, strip surrounding `'…'`; both numeric → numeric
  compare (`3` = `3.0`); otherwise exact text (MC/try) or case-insensitive (fill blanks, table-task text cells). Exactly one option must match.
* Try/MC option strings that are tables are shown as mini tables.

**Items**: try `{id, pts, db, sql, q?, ask?, options, why, open?:[tables]}` (the console shows the db's tables; locked until answered).
`mc`/`fill`/quiz may have `db`+`sql` (tables shown unless `showTables:false`), `er` (quiz), `table`. `answer` may be given (0-based number or
'A'–'D'); with `verify:true` the build checks it against the engine. `fill` blanks: `{label, ask}` (from the item's sql), `{label, a, accept}`,
or `{label, fd:'keys'|'nf'|'closure:A B'}` (needs item `attrs`/`fds`).
`fd` items: `{type:'fd', id, pts, q, attrs:'A B C D', fds:'A->B; B,C->D', ask, options?}`; without `options` the student types the answer
(checked semantically: keys as `{A, B}、{C}` in any order; nf `2NF`/`第二範式`; closure as a set; `decompose3NF` accepts **any** decomposition
that is lossless, dependency-preserving and all-3NF, written `R1(A, B); R2(B, C)`). Answers display: keys `{A, D}、{B, D}`, nf `2NF`.
`complete` `{type:'complete', db, template, ref:[…], check?, rules?}`: checked like write tasks (unit db + variants).

**Write tasks** `{id, pts, title, q, db, starter, ref, check?, rules?, hint, tier?, showExpected?}`. Checking: run on the unit db and up to 2
variants derived deterministically from the task id (row order reversed/rotated; numeric non-key columns changed; one row added with a new
key; one unreferenced row deleted — constraints respected). If the ref's last statement is a SELECT: compare columns count (names only if
`check.cols`), rows as a bag, plus order if the ref's last SELECT has ORDER BY or `check.order`. If the last statement is not a SELECT
(INSERT/UPDATE/DELETE/DDL) or `check.state:['T1',…]` is given: compare the database state — every table/view (or those listed): columns,
types, PK, NOT NULL, UNIQUE, FK, DEFAULT, AUTO_INCREMENT, CHECK (normalized text) and rows (bag); constraint names are ignored.
`rules`: `{must:'GROUP BY', msg}`, `{mustNot:'LIMIT', msg}`, `{re:'regex', msg}` (case-insensitive, whitespace-collapsed).
The page shows the expected result on the unit db unless `showExpected:false`. Build: ref passes, starter fails (an empty starter is fine).

**Learn blocks** extra: `{tables:'school'}` or `{tables:{db, names?, open?}}` (static tables), `{er:{entities:[{name, attrs:['*SID','SNAME','#CID'], at?:[col,row]}], rels:[{a, b, name, card:'M:1'}]}, cap?}`
(`*` = PK underlined, `#` = FK in italics; entities auto-placed 3 per row unless `at` given; `card` 'M:1' puts M at a's end, 1 at b's end),
`fix` may be `{bad, good, why}`. `sim:{db, sql, open?:[tables]}` console keeps changes until 「重設數據」.

**Endless gens** (all multiple choice; answers by engine; options from engine runs of plausible wrong SQL): `sqlWhere`, `sqlAgg`, `sqlFunc`,
`sqlJoin`, `sqlSet`, `sqlSub`, `sqlDml`, `fdKey`, `fdNf`, `erCard`.

**Course**: `course.json` `{code, title, kicker, subtitle, pin, plan:[[id,title,ch]]}`. Report `app` = `<code>SQL自學平台`. Categories:
試 / 練 / 寫SQL (theory units: 分析題; or `writeLabel`) / 小測.

Sections with `kind` may omit `title`/`id`: defaults 寫SQL（theory: 分析題；or `writeLabel`）／小測／無限練習／交功課, id = kind.
`ask.cell` row numbers are **1-based only** (checked: all current units use 1-based correctly).
