# Python 自學平台：共用格式（D2 及 選修C）

This file is the contract between the **framework** (`py/`) and the **unit files**
(`d2/src/*.js`, `electc/src/*.js`). Both sides follow it exactly. Student-facing
text is Hong Kong Traditional Chinese (繁體中文，香港用語), plain and short; the
teacher is not a programmer. Do not mention Scratch/Arduino.

The platform is a Python port of the existing D1 platform (`d1/`: pseudocode,
engine.js, common.js, style.css, tools/build.js, tools/test_site.py). Same look,
same sections, same scoring, same signed-report + teacher-page flow. Read `d1/`
for anything not stated here (D1 is the reference implementation; open
`d1/u7/index.html` style behaviour, `d1/src/u7.js` for content style).

## 1. Folders

```
py/                    shared framework (one copy for both courses)
  common.js            UI + scoring + reports + teacher page (port of d1/common.js)
  pyrun.js             browser runner: wraps Skulpt (async)
  style.css            (port of d1/style.css; may add Thonny-ish shell styles)
  skulpt/skulpt.min.js, skulpt/skulpt-stdlib.js   (Skulpt 1.x, supports f-strings)
  tools/build.js       node py/tools/build.js <course> [--only <unitId>] [--out <dir>]
  tools/pyrun.py       CPython helper used by build.js (runs code, traces, files)
  tools/test_site.py   Playwright tests: python3 py/tools/test_site.py <course> [unitIds,comma] 
  READY                created by the framework agent when build+tests work
d2/                    course D2  (必修 D2：Python 編程入門、綜合解難、測試和除錯)
  course.json          {code, title, subtitle, pin, plan:[[id,title,pages]...]}
  src/u1.js …          unit files (CommonJS: module.exports = {...})
  u1/index.html …      generated
  teacher/index.html   generated
  index.html           generated hub
electc/                course 選修C (算法與程式編寫), ids c1, c2, … (split: c5a, c5b)
```

Generated pages load `../../py/style.css`, `../../py/skulpt/*.js`,
`../../py/pyrun.js`, `../../py/common.js`. `--out` also writes single-file
versions (everything inlined) like D1.

`build.js` **orders units by course.json plan**, then any extra ids (natural sort).
`--only u3` checks and builds just that unit (and still regenerates the hub and
teacher page from whatever units currently pass). Build must never be broken
by one bad unit when `--only` is used for another unit.

## 2. Running Python — one rule for both sides

* Program text = Python 3. Keep to what Skulpt and CPython both do identically:
  int/float/str/bool/list (2-D lists ok), dict ok, functions, `global`,
  `import math`, `import random`, f-strings, `str.split/join/upper/lower/strip/
  find/replace/isdigit/isalpha`, slicing, `len/range/abs/round/int/float/str/
  ord/chr/max/min/sum/sorted/list.append/pop/insert/index`, `try/except`
  (only common error types), `open()` for text files (see §2.3).
  Avoid: classes beyond trivial, generators, `print(..., file=)`, `%` string
  formatting with exotic specs, float results whose 15th+ digit matters.
* **Inputs**: an item's `inputs` is a string; one line per `input()` call.
* **Output text** = exactly what Thonny's Shell shows: everything printed, and for
  each `input(prompt)` the prompt, then the typed value, then a newline (the echo).
  Both CPython (build) and Skulpt (browser) produce this same text.
* **Errors**: a run that raises gives `err = {type:'ZeroDivisionError', line:3, msg}`
  and the output printed before it. Infinite loops: build uses a step limit
  (20 000 line events) → `err.type = 'Timeout'`; browser uses Skulpt execLimit.
* **random**: build seeds nothing; items using `random` must not have a checked
  answer that depends on the random value (use `fixRandom: {"randint": 4}` to make
  every `random.randint(...)` return 4 and `random.random()` etc. return the
  given value when checking — the framework patches the module in both runners).

### 2.1 What a question can ask about a run (`ask`)

| ask | answer text |
|---|---|
| `'out'` (default) | the output text, lines joined with `\n` (trailing spaces/blank lines trimmed) |
| `{var:'x'}` | `str(x)` after the run (Python `str`), list → `str(list)` e.g. `[1, 2]` |
| `{expr:'type(x)'}` | `str(eval(expr))` in the final namespace |
| `{error:true}` | the error type name, e.g. `NameError`; `'沒有錯誤'` if none |
| `{count: n}` | how many times line n (1-based) of the code executed |
| `{file:'out.txt'}` | final content of that virtual file |

### 2.2 Answer matching

`same(a,b)`: trim; collapse runs of spaces; compare lines after trimming each;
numbers compared numerically when both sides parse as numbers (`3` ≠ `3.0` is
**NOT** equal — Python prints them differently, students must learn that; but
`3.50` vs `3.5` only matter if written in an option, so authors write exactly
what Python prints).

### 2.3 Files (選修C CH7)

Items/tasks may give `files: {"data.txt": "line1\nline2\n"}`. `open(name, mode)`
with modes `r`, `w`, `a` works in both runners on a fresh copy of these files
(the browser uses a Python-level replacement `open` that supports `read`,
`readline`, `readlines`, iteration, `write`, `close`, `with`). Ask
`{file:'name'}` to check written content. Missing file → `FileNotFoundError`.

## 3. Unit file schema

```js
const C = (...ls) => ls.join('\n');
module.exports = {
  id: 'u3', title: '選擇：if、elif、else',
  book: '教科書 D2 第 4 章 p.33–51',
  key: 'D2-u3-hmac-<10 random hex>',          // unique per unit
  theory: false,                                // true → no tries/write code tasks; see §5
  writeLabel: '寫程式',                          // optional label for the write section
  sections: [ … ]                               // learning sections, then write, quiz, endless, report
};
```

### 3.1 Learning section

```js
{ id:'s1', title:'…', pages:'教科書 p.33–36',
  learn: [ block, … ],
  tries:    [ tryItem, … ],      // 「試」 估輸出, 4 pts each (theory units: none)
  practice: [ practiceItem, … ]  // 「練」
}
```

Learn blocks (same as D1, `code` is Python):
`{pts:[markdown,…]}`, `{h:'小標題'}`, `{table:{head:[…],rows:[[…]]}}`, `{note:md}`,
`{warn:md}` (常見錯誤), `{fix:{bad:code, good:code, why:md}}`, `{code:pythonCode, cap:md}`,
`{sim:{code, inputs?, files?, open?:['vars','trace'], step?:true}, cap:md}`
 — a runnable editor (Thonny-like: editor + ▶ 執行 + Shell + 變量). With
 `step:true` the build precomputes a CPython line-by-line trace so the student can
 press 「下一步」 and see the current line + variables (only while the code is
 unchanged; after editing, ▶ runs it with Skulpt). Markdown: `**bold**`, `` `code` ``.

Try item (先估後執行; answer computed by build):
```js
{ id:'u3-s1-t1', pts:4, src:'教科書 p.34', code, inputs?, files?, ask?, q:'先估：輸出是什麼？',
  options:['…','…','…','…'],   // exactly one must equal the real answer (build checks)
  why:'…' }                      // shown after answering
```
After choosing, the student may press ▶ to run it in the simulator.

Practice items (`pts` 1–5; types):
* `mc`: `{type:'mc', q, code?, inputs?, options, answer: 0-based index, verify?:true, ask?, hint, why?}`
  `verify:true` → build checks `options[answer]` equals the run result.
* `fill`: `{type:'fill', q, code?, inputs?, blanks:[{label, ask} | {label, a:'answer', accept:[…]}], hint}`
  blanks with `ask` get their answer from the run.
* `trace`: `{type:'trace', q, code, inputs?, spec:{mode:'stmt'|'iter', cols:['i','total'], out:true}, hint}`
  build makes the trace table with CPython (`stmt`: one row per executed line that
  changes a listed variable or prints; `iter`: one row per loop iteration of the first
  loop, values at end of each iteration); student fills blank cells.
* `complete`: `{type:'complete', q, template: code with ［1］ ［2］ … blanks, ref:['…','…'],
  tests:[{inputs, files?}], check?:{out:true, vars:['x'], file:'out.txt'}, hint}`
  The student's blanks are substituted and run (Skulpt) on every test; must
  produce the same results as the ref (precomputed by CPython).
* `order` (optional nice-to-have, framework may implement): put shuffled lines in order.

### 3.2 Write section (`{kind:'write', tasks:[…]}`)

Code task:
```js
{ id:'u3-w1', pts:12, title:'…', q: md, starter: code, ref: code,
  tests:[{inputs:'60', files?}, …],           // 3–6 tests incl. boundary values
  check?: {out:true, vars:[…], file:'…', nums:false},  // nums:true → compare numbers with 1e-6 tolerance
  rules?: [{must:'for', msg:'要用 for 循環'}, {mustNot:'max(', msg:'不可用 max()'}],
  hint: md, sample?: 'expected Shell text shown to student (optional; else build shows test 1 output)' }
```
Build checks: ref passes all tests + rules; starter does NOT pass.
Table task (theory / analysis): identical to D1 (`kind:'table'`, head, opts, rows,
cells `{sel:'optsKey', a:'answer'}` or `{a:'answer', accept:[…]}`), used for e.g.
「錯誤類型／原因」「測試數據類別」. 

### 3.3 Quiz (`{kind:'quiz', items:[…]}`)
`{id, pts, src, tags?:[{t:'hot'|'trap', why}], q, code?, inputs?, ask?, options, answer:'A'..'D', verify?:true, why}`
Not runnable by the student (先估後看答案). Use textbook 課題練習 MC (with page/Q no.)
and DSE-style questions.

### 3.4 Endless (`{kind:'endless', gens:['pyArith','pyRange',…]}`) — unscored random practice.
Framework provides these generators (JS computes the answer; build samples each
200× and checks against CPython): `pyArith` (+ - * / // % ** precedence, int vs
float result), `pyCast` (int()/float()/str()/type()), `pyPrint` (print with `,`
`sep`/`end`), `pyIf` (if/elif/else output), `pyBool` (and/or/not value),
`pyRange` (list(range(...)) members / count), `pyFor` (for-loop accumulate output),
`pyWhile` (while-loop output), `pyList` (index, negative index, len, after
assignment/append/pop/insert), `pyListAlgo` (sum/max/count by loop),
`pyStr` (indexing, slicing, len, upper/lower, find, in), `pyAscii` (ord/chr, comparing
strings), `pyFunc` (function return value / local vs global), `pySearch`
(linear/binary search comparisons count), `pySort` (array after k passes of
bubble/selection/insertion sort), `pyStack` (push/pop result), `pyQueue`,
`pyErr` (which error type: SyntaxError/NameError/TypeError/ValueError/
ZeroDivisionError/IndexError/IndentationError). Units list 2–4 that fit.

### 3.5 Report `{kind:'report'}` — last section, same as D1.

## 4. Scoring (total must be exactly 100; build checks)

Normal unit: 試 20 (five tries × 4) · 練 25 · 寫程式 35 · 小測 20.
Theory unit (`theory:true`, e.g. 程式測試和除錯 theory parts): 練 40 · 分析題 35 (table
tasks and/or code tasks) · 小測 25, no tries required (tries allowed if they total 0
— i.e. just don't include them).
Tries are spread over sections (1–2 per section). 練 per section 5–10.

## 5. Content rules (unit authors)

* Follow the textbook text (Project docs `claude/教科書/D2_CH4…`, `D2_CH5…`, `D2_CH6…`,
  `選修C_CH1…CH8`, `選修C_EX…`; read with the Projects tool `project_read`).
  Cite pages in `src`/`pages` (書頁 p.X). Use the textbook's own examples,
  活動/測試站/例題/課題練習 questions first, with their answers; then add your own.
* Every answer must be machine-verified: prefer `ask`/`verify` items over typed answers.
  When the textbook answer is wrong or its code does not run as printed, follow
  real Python, and record it in the unit header comment as
  `// 教科書疑似錯誤：p.X …` (the lead will copy to 教科書疑似錯誤記錄).
* Variety: each section has a `learn`, 1–2 tries (normal units), 2–4 practice items.
  Write section: 2–3 tasks (simple → harder), one may be a table task.
  Quiz: 5–8 items. Tags hot/trap where you know DSE relevance (optional).
* Each unit ≈ one lesson of 60–80 minutes. Sections 3–5.
* Short sentences; HK terms: 變量、列表、循環、輸入、輸出、程式、運行時錯誤、
  語法錯誤、邏輯錯誤、子程式、參數、局部變量、全局變量、堆疊、隊列、檢索、排序.
  Code uses English identifiers like the textbook.
* IDs: `<unitId>-s<k>-t<n>`, `<unitId>-s<k>-p<n>`, `<unitId>-w<n>`, `<unitId>-q<n>`; unique.

## 6. Done = 

`node py/tools/build.js <course> --only <id>` passes (all answers verified by
CPython, total 100) and `python3 py/tools/test_site.py <course> <id>` passes.
Do not git commit (the lead commits). Do not edit other agents' files.
