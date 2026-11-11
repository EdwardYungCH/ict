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
