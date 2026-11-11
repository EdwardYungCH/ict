#!/usr/bin/env node
/* Python 自學平台 產生器（D2、選修C 共用）
 * 用法：node py/tools/build.js <course> [--only <unitId>] [--out <dir>] [--samples N]
 *   <course>：課程資料夾（例如 d2、electc、py/demo），內有 course.json 及 src/*.js
 * 步驟：載入單元 → 按 plan 排序 → 用 CPython（tools/pyrun.py，一次過）計算及核對所有答案
 *      → 抽樣核對無限練習生成器 → 產生 <course>/<id>/index.html、teacher/index.html、index.html（目錄）
 *      → --out 目錄放「單一檔案版」。
 * 沒有 --only：任何單元有問題便停止，不寫任何檔案。
 * 有 --only X：X 有問題便停止；其他單元有問題只會警告並略過（保留它舊的頁面）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PYDIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(PYDIR, '..');
const argv = process.argv.slice(2);
const opt = { only: null, out: null, samples: 200 };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--only') opt.only = argv[++i];
  else if (argv[i] === '--out') opt.out = argv[++i];
  else if (argv[i] === '--samples') opt.samples = Number(argv[++i]);
  else pos.push(argv[i]);
}
if (!pos[0]) { console.error('用法：node py/tools/build.js <course> [--only <unitId>] [--out <dir>]'); process.exit(2); }
const CDIR = path.resolve(pos[0]);
if (!fs.existsSync(path.join(CDIR, 'course.json'))) { console.error(`找不到 ${path.join(CDIR, 'course.json')}`); process.exit(2); }
const COURSE = JSON.parse(fs.readFileSync(path.join(CDIR, 'course.json'), 'utf8'));
const PLAN = COURSE.plan || [];
// 共用檔相對於課程資料夾的路徑（d2/u1/index.html → ../../py/）
const relPy = path.relative(path.join(CDIR, 'x'), PYDIR).split(path.sep).join('/');
const relRoot = path.relative(CDIR, ROOT).split(path.sep).join('/') || '.';

require(path.join(PYDIR, 'pyrun.js'));
const PY = require(path.join(PYDIR, 'common.js'));

// ---------- 載入單元 ----------
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const files = fs.existsSync(path.join(CDIR, 'src')) ? fs.readdirSync(path.join(CDIR, 'src')).filter((f) => /\.js$/.test(f)) : [];
const loaded = [];
const loadErr = {};
for (const f of files) {
  const p = path.join(CDIR, 'src', f);
  const id = f.replace(/\.js$/, '');
  try { delete require.cache[require.resolve(p)]; const U = require(p); loaded.push(U); if (U.id !== id) loadErr[id] = [`檔名 ${f} 與 id「${U.id}」不同`]; }
  catch (e) { loadErr[id] = [`未能載入 ${f}：${e.message}`]; }
}
const order = PLAN.map((p) => p[0]);
loaded.sort((a, b) => { const ia = order.indexOf(a.id), ib = order.indexOf(b.id); if (ia >= 0 && ib >= 0) return ia - ib; if (ia >= 0) return -1; if (ib >= 0) return 1; return natural(String(a.id), String(b.id)); });
if (opt.only && !loaded.some((u) => u.id === opt.only) && !loadErr[opt.only]) { console.error(`找不到單元 ${opt.only}（${path.join(CDIR, 'src', opt.only + '.js')}）`); process.exit(1); }

// ---------- 收集 CPython 工作 ----------
const jobs = [];
const after = [];
const probs = {}; // unitId → [msg]
const warns = {};
const P = (u, m) => { (probs[u] = probs[u] || []).push(m); };
const W = (u, m) => { (warns[u] = warns[u] || []).push(m); };
function job(j, cb) { jobs.push(j); after.push(cb); }
const isAskErr = (a) => a && typeof a === 'object' && a.error;
const askOf = (it) => it.ask || 'out';
const OUTONLY = (r) => ({ out: r.out, err: r.err ? { type: r.err.type, line: r.err.line, msg: r.err.msg } : null });
function slimRun(r, withSteps) {
  const o = { out: r.out, err: r.err ? { type: r.err.type, line: r.err.line, msg: r.err.msg, tb: r.err.tb } : null, vrepr: r.vrepr, files: r.files };
  if (withSteps && r.steps) { o.steps = r.steps.map((s) => ({ l: s.l, v: s.v, o: s.o, fn: s.fn === '<module>' ? undefined : s.fn })); o.cut = r.stepsCut; }
  return o;
}
const errTxt = (e) => (e ? `${e.type}（第 ${e.line} 行）${e.msg ? '：' + e.msg : ''}` : '');
const NEED_CODE = (U, it) => { if (typeof it.code !== 'string' || !it.code.trim()) { P(U.id, `${it.id}：沒有 code`); return false; } return true; };
const LETTERS = 'ABCDEFGH';

function expOf(r, chk) {
  const e = { out: r.out, err: r.err ? { type: r.err.type, line: r.err.line, msg: r.err.msg } : null };
  if (chk && chk.vars) { e.vars = {}; for (const v of chk.vars) if (v in r.vars) e.vars[v] = r.vars[v]; }
  if (chk && chk.file) { e.files = {}; if (chk.file in r.files) e.files[chk.file] = r.files[chk.file]; }
  return e;
}

function collect(U) {
  const u = U.id;
  if (!U.id || !U.title || !Array.isArray(U.sections)) { P(u || '?', '單元要有 id、title、sections'); return; }
  if (!U.key || typeof U.key !== 'string') P(u, '單元要有 key（HMAC 簽名用）');
  const ids = new Set();
  const seen = (id, where) => { if (!id) P(u, `${where}：缺少 id`); else if (ids.has(id)) P(u, `題目編號重複：${id}`); ids.add(id); };
  const cat = { try: 0, prac: 0, write: 0, quiz: 0 };
  const secIds = new Set();
  U.sections.forEach((sec, si) => {
    // 預設 id／title
    if (sec.kind === 'write') { sec.id = sec.id || 'write'; sec.title = sec.title || U.writeLabel || (U.theory ? '分析題' : '寫程式'); }
    if (sec.kind === 'quiz') { sec.id = sec.id || 'quiz'; sec.title = sec.title || '小測'; }
    if (sec.kind === 'endless') { sec.id = sec.id || 'more'; sec.title = sec.title || '無限練習'; }
    if (sec.kind === 'report') { sec.id = sec.id || 'report'; sec.title = sec.title || '交功課'; }
    if (!sec.id || !sec.title) P(u, `第 ${si + 1} 節：要有 id 及 title`);
    if (secIds.has(sec.id)) P(u, `節 id 重複：${sec.id}`); secIds.add(sec.id);
    for (const b of sec.learn || []) {
      if (b.sim) {
        if (typeof b.sim.code !== 'string') { P(u, `${sec.id}：sim 沒有 code`); continue; }
        job({ code: b.sim.code, inputs: b.sim.inputs || '', files: b.sim.files, fixRandom: b.sim.fixRandom, step: !!b.sim.step }, (r) => { b.sim._run = slimRun(r, !!b.sim.step); });
      }
    }
    if (U.theory && (sec.tries || []).length) P(u, `${sec.id}：理論單元（theory:true）不應有「試」`);
    for (const it of sec.tries || []) {
      seen(it.id, `${sec.id} 試`); cat.try += it.pts || 0;
      if (!NEED_CODE(U, it)) continue;
      if (!Array.isArray(it.options) || it.options.length < 2) { P(u, `${it.id}：options 要有最少 2 個`); continue; }
      if (it.pts !== 4) W(u, `${it.id}：試一般是 4 分（現在 ${it.pts}）`);
      job({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, asks: [askOf(it)], step: true }, (r) => {
        const ans = r.answers[0];
        if (r.err && !isAskErr(it.ask) && !it.allowError) P(u, `${it.id}：程式執行出錯 ${errTxt(r.err)}（如果是故意的，加 allowError:true 或用 ask:{error:true}）`);
        const hit = it.options.map((o, i) => (PY.same(o, ans) ? i : -1)).filter((i) => i >= 0);
        if (hit.length !== 1) P(u, `${it.id}：選項中有 ${hit.length} 個與 CPython 答案相同（答案：${JSON.stringify(ans)}；選項：${JSON.stringify(it.options)}）`);
        else { it._right = hit[0]; if (it.answer != null) { const a = typeof it.answer === 'number' ? it.answer : LETTERS.indexOf(it.answer); if (a !== hit[0]) P(u, `${it.id}：answer 寫 ${it.answer}，但 CPython 答案是 ${LETTERS[hit[0]]}`); } }
        it._ans = ans;
        it._run = slimRun(r, true);
      });
    }
    for (const it of sec.practice || []) {
      seen(it.id, `${sec.id} 練`); cat.prac += it.pts || 0;
      if (!(it.pts >= 1 && it.pts <= 5)) W(u, `${it.id}：練習分數一般是 1–5（現在 ${it.pts}）`);
      if (it.type === 'mc') {
        if (!Array.isArray(it.options) || it.options.length < 2) { P(u, `${it.id}：options 要有最少 2 個`); continue; }
        const ai = typeof it.answer === 'number' ? it.answer : typeof it.answer === 'string' ? LETTERS.indexOf(it.answer) : -1;
        if (ai < 0 || ai >= it.options.length) { P(u, `${it.id}：answer 要是 0 開始的索引（或 'A'–'D'）`); continue; }
        it._right = ai;
        if (it.verify) {
          if (!NEED_CODE(U, it)) continue;
          job({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, asks: [askOf(it)] }, (r) => {
            const ans = r.answers[0];
            if (r.err && !isAskErr(it.ask) && !it.allowError) P(u, `${it.id}：程式執行出錯 ${errTxt(r.err)}`);
            if (!PY.same(it.options[ai], ans)) P(u, `${it.id}：答案選項「${it.options[ai]}」與 CPython 結果「${ans}」不同`);
            const hit = it.options.filter((o) => PY.same(o, ans)).length;
            if (hit > 1) P(u, `${it.id}：有 ${hit} 個選項與 CPython 結果相同`);
          });
        }
      } else if (it.type === 'fill') {
        if (!Array.isArray(it.blanks) || !it.blanks.length) { P(u, `${it.id}：fill 要有 blanks`); continue; }
        const asks = it.blanks.filter((b) => b.ask != null);
        it._ans = it.blanks.map((b) => (b.ask != null ? null : String(b.a == null ? '' : b.a)));
        if (asks.length) {
          if (!NEED_CODE(U, it)) continue;
          job({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, asks: asks.map((b) => b.ask) }, (r) => {
            if (r.err && !asks.some((b) => isAskErr(b.ask)) && !it.allowError) P(u, `${it.id}：程式執行出錯 ${errTxt(r.err)}`);
            let k = 0; it.blanks.forEach((b, i) => { if (b.ask != null) it._ans[i] = r.answers[k++]; });
            it._ans.forEach((a, i) => { if (a == null || String(a).trim() === '') P(u, `${it.id}：空格「${it.blanks[i].label}」的答案是空白`); });
          });
        } else it._ans.forEach((a, i) => { if (!a.trim()) P(u, `${it.id}：空格「${it.blanks[i].label}」沒有答案`); });
      } else if (it.type === 'trace') {
        if (!NEED_CODE(U, it)) continue;
        if (!it.spec || !Array.isArray(it.spec.cols)) { P(u, `${it.id}：trace 要有 spec:{mode, cols, out}`); continue; }
        job({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, trace: it.spec }, (r) => {
          if (r.err && !it.allowError) P(u, `${it.id}：程式執行出錯 ${errTxt(r.err)}`);
          if (!r.trace || !r.trace.rows.length) P(u, `${it.id}：追蹤表沒有內容（檢查 cols 名稱）`);
          else if (r.trace.rows.length > 40) W(u, `${it.id}：追蹤表有 ${r.trace.rows.length} 行，可能太長`);
          if (r.trace && it.spec.mode === 'iter' && r.trace.mode !== 'iter') P(u, `${it.id}：程式沒有循環，不能用 mode:'iter'`);
          it._trace = r.trace;
        });
      } else if (it.type === 'complete') {
        if (typeof it.template !== 'string' || !Array.isArray(it.ref) || !Array.isArray(it.tests) || !it.tests.length) { P(u, `${it.id}：complete 要有 template、ref、tests`); continue; }
        const nb = PY.blankCount(it.template);
        if (nb !== it.ref.length) { P(u, `${it.id}：template 有 ${nb} 個空格，ref 有 ${it.ref.length} 個答案`); continue; }
        for (let i = 1; i <= nb; i++) if (!it.template.includes(`［${i}］`)) P(u, `${it.id}：空格要由［1］開始連續編號`);
        const code = PY.subBlanks(it.template, it.ref);
        it._exp = [];
        it.tests.forEach((t, ti) => job({ code, inputs: t.inputs || '', files: t.files, fixRandom: t.fixRandom || it.fixRandom }, (r) => {
          if (r.err) P(u, `${it.id}：參考答案在第 ${ti + 1} 組測試出錯 ${errTxt(r.err)}`);
          it._exp[ti] = expOf(r, it.check);
        }));
        // 空白答案不應通過
        job({ code: PY.subBlanks(it.template, it.ref.map(() => 'None')), inputs: (it.tests[0] || {}).inputs || '', files: (it.tests[0] || {}).files, fixRandom: it.fixRandom }, (r) => { it._blankRes = r; });
      } else P(u, `${it.id}：未知的練習題型「${it.type}」（可用 mc、fill、trace、complete）`);
    }
    if (sec.kind === 'write') {
      if (!Array.isArray(sec.tasks) || !sec.tasks.length) P(u, `${sec.id}：write 要有 tasks`);
      for (const t of sec.tasks || []) {
        seen(t.id, `${sec.id} 寫程式`); cat.write += t.pts || 0;
        if (t.kind === 'table') {
          if (!Array.isArray(t.head) || !Array.isArray(t.rows)) { P(u, `${t.id}：表格題要有 head、rows`); continue; }
          const ans = PY.tableAnswers(t);
          if (!ans.length || ans.some((a) => a === '' || a === 'undefined')) P(u, `${t.id}：表格沒有答案（每個空格要有 a）`);
          t.rows.forEach((r) => r.forEach((c) => { if (c && c.sel) { if (!t.opts || !t.opts[c.sel]) P(u, `${t.id}：找不到選項組 ${c.sel}`); else if (!t.opts[c.sel].includes(String(c.a))) P(u, `${t.id}：答案「${c.a}」不在選項 ${c.sel} 內`); } }));
          if (!PY.checkTableVals(t, ans).every(Boolean)) P(u, `${t.id}：答案未能通過自己的核對`);
          continue;
        }
        if (typeof t.ref !== 'string' || !Array.isArray(t.tests) || !t.tests.length) { P(u, `${t.id}：寫程式題要有 ref 及 tests`); continue; }
        if (t.tests.length < 3 || t.tests.length > 6) W(u, `${t.id}：建議 3–6 組測試（現在 ${t.tests.length}）`);
        const rr = PY.checkRules(t.rules, t.ref);
        if (rr) P(u, `${t.id}：參考答案違反規則「${rr}」`);
        t._exp = [];
        t.tests.forEach((ts, ti) => job({ code: t.ref, inputs: ts.inputs || '', files: ts.files, fixRandom: ts.fixRandom || t.fixRandom }, (r) => {
          if (r.err && !t.allowError) P(u, `${t.id}：參考答案在第 ${ti + 1} 組測試出錯 ${errTxt(r.err)}`);
          t._exp[ti] = expOf(r, t.check);
          if (ti === 0) { t._sample = r.out; if (t.check && t.check.file) t._sampleFile = { name: t.check.file, text: t.check.file in r.files ? r.files[t.check.file] : null }; }
        }));
        const starter = t.starter || '';
        const st = [];
        t.tests.forEach((ts, ti) => job({ code: starter, inputs: ts.inputs || '', files: ts.files, fixRandom: ts.fixRandom || t.fixRandom }, (r) => { st[ti] = r; }));
        t._starterRes = st;
      }
    }
    if (sec.kind === 'quiz') {
      if (!Array.isArray(sec.items) || !sec.items.length) P(u, `${sec.id}：quiz 要有 items`);
      for (const it of sec.items || []) {
        seen(it.id, `${sec.id} 小測`); cat.quiz += it.pts || 0;
        if (!Array.isArray(it.options) || it.options.length < 2) { P(u, `${it.id}：options 要有最少 2 個`); continue; }
        const ai = typeof it.answer === 'number' ? it.answer : typeof it.answer === 'string' ? LETTERS.indexOf(it.answer) : -1;
        if (ai < 0 || ai >= it.options.length) { P(u, `${it.id}：answer 要是 'A'–'D'`); continue; }
        it._right = ai;
        if (it.verify) {
          if (!NEED_CODE(U, it)) continue;
          job({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, asks: [askOf(it)] }, (r) => {
            const ans = r.answers[0];
            if (r.err && !isAskErr(it.ask) && !it.allowError) P(u, `${it.id}：程式執行出錯 ${errTxt(r.err)}`);
            if (!PY.same(it.options[ai], ans)) P(u, `${it.id}：答案 ${it.answer}（${it.options[ai]}）與 CPython 結果「${ans}」不同`);
          });
        }
      }
    }
    if (sec.kind === 'endless') {
      if (!Array.isArray(sec.gens) || !sec.gens.length) P(u, `${sec.id}：endless 要有 gens`);
      for (const g of sec.gens || []) if (!PY.GENS[g]) P(u, `${sec.id}：沒有這個生成器「${g}」（可用：${PY.GEN_NAMES.join('、')}）`);
    }
  });
  const last = U.sections[U.sections.length - 1];
  if (!last || last.kind !== 'report') P(u, '最後一節要是 {kind:\'report\'}');
  const total = cat.try + cat.prac + cat.write + cat.quiz;
  if (total !== 100) P(u, `總分是 ${total}，不是 100（試 ${cat.try}、練 ${cat.prac}、寫程式 ${cat.write}、小測 ${cat.quiz}）`);
  else if (U.theory) { if (cat.try || cat.prac !== 40 || cat.write !== 35 || cat.quiz !== 25) P(u, `理論單元分數應為 練 40、分析題 35、小測 25（現在 試 ${cat.try}、練 ${cat.prac}、分析題 ${cat.write}、小測 ${cat.quiz}）`); }
  else if (cat.try !== 20 || cat.prac !== 25 || cat.write !== 35 || cat.quiz !== 20) P(u, `分數應為 試 20、練 25、寫程式 35、小測 20（現在 試 ${cat.try}、練 ${cat.prac}、寫程式 ${cat.write}、小測 ${cat.quiz}）`);
  U._ids = ids;
}
for (const U of loaded) { try { collect(U); } catch (e) { P(U.id || '?', `核對時出錯：${e.stack}`); } }

// ---------- 無限練習生成器抽樣 ----------
const genUsed = new Set();
for (const U of loaded) for (const s of U.sections || []) if (s.kind === 'endless') (s.gens || []).forEach((g) => genUsed.add(g));
const genList = PY.GEN_NAMES.filter((g) => genUsed.has(g) || opt.samples > 0);
let seed = 12345;
PY._rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const genProbs = {};
for (const g of genList) {
  for (let k = 0; k < opt.samples; k++) {
    let s;
    try { s = PY.GENS[g](); } catch (e) { (genProbs[g] = genProbs[g] || []).push(`生成時出錯：${e.message}`); break; }
    job({ code: s.code, inputs: s.inputs || '', asks: [s.ask || 'out'] }, (r) => {
      const ans = r.answers[0];
      const ok = s.strict ? PY.same(s.ans, ans) : PY.same(s.ans, ans);
      if (!ok || (r.err && !(s.ask && s.ask.error))) (genProbs[g] = genProbs[g] || []).push(`JS 答案「${s.ans}」≠ CPython「${ans}」${r.err ? ' ' + errTxt(r.err) : ''}\n${s.code}`);
      if (s.options && !s.options.includes(s.ans)) (genProbs[g] = genProbs[g] || []).push(`答案「${s.ans}」不在選項內`);
    });
  }
}
PY._rand = null;

// ---------- 執行 CPython ----------
const t0 = Date.now();
const proc = spawnSync('python3', [path.join(__dirname, 'pyrun.py')], { input: JSON.stringify(jobs), maxBuffer: 1 << 30, encoding: 'utf8' });
if (proc.status !== 0) { console.error('pyrun.py 執行失敗：\n' + proc.stderr); process.exit(1); }
const results = JSON.parse(proc.stdout);
results.forEach((r, i) => { try { after[i](r); } catch (e) { console.error('內部錯誤', e); } });
if (process.env.PYRUN_SLOW) results.map((r, i) => [r.ms, i]).sort((a, b) => b[0] - a[0]).slice(0, 8).forEach(([ms, i]) => console.log(`慢：${ms} ms`, JSON.stringify(jobs[i]).slice(0, 300), r => r));
const tPy = Date.now() - t0;

// 起始程式不應通過；complete 空白答案不應通過
for (const U of loaded) for (const sec of U.sections || []) {
  for (const t of sec.tasks || []) {
    if (t.kind === 'table' || !t._starterRes) continue;
    const ruleFail = !!PY.checkRules(t.rules, t.starter || '');
    const allPass = t._starterRes.every((r, i) => t._exp[i] && PY.compareRun(r, t._exp[i], t.check).ok);
    if (allPass && !ruleFail) P(U.id, `${t.id}：起始程式（starter）竟然已通過所有測試`);
    delete t._starterRes;
    // 所有測試的期望結果都一樣 → 提示加多些不同的測試
    if (t._exp.length > 1 && t._exp.every((e) => e && t._exp[0] && e.out === t._exp[0].out && !t.check)) W(U.id, `${t.id}：所有測試的期望輸出都一樣，未必能分辨對錯`);
  }
  for (const it of sec.practice || []) {
    if (it.type !== 'complete' || !it._blankRes) continue;
    if (it._exp && it._exp[0] && PY.compareRun(it._blankRes, it._exp[0], it.check).ok && it.tests.length === 1) W(U.id, `${it.id}：空格全填 None 也通過第 1 組測試，測試可能太弱`);
    delete it._blankRes;
  }
}

// ---------- 報告問題 ----------
const allIds = {};
for (const U of loaded) for (const id of U._ids || []) { if (allIds[id]) P(U.id, `題目編號 ${id} 與 ${allIds[id]} 重複`); allIds[id] = U.id; }
const keySeen = {};
for (const U of loaded) { if (U.key) { if (keySeen[U.key]) P(U.id, `key 與 ${keySeen[U.key]} 相同，每個單元要不同`); keySeen[U.key] = U.id; } }
for (const [id, m] of Object.entries(loadErr)) probs[id] = (probs[id] || []).concat(m);
for (const [u, ws] of Object.entries(warns)) for (const w of ws) console.warn(`警告 ${u}：${w}`);
const gp = Object.entries(genProbs);
for (const [g, ps] of gp) console.error(`生成器 ${g} 核對失敗（${ps.length} 個樣本）：\n  ` + ps.slice(0, 3).join('\n  ---\n  '));
const bad = new Set(Object.keys(probs));
for (const [u, ps] of Object.entries(probs)) console.error(`\n✗ ${u} 核對失敗（${ps.length} 項）：\n  - ` + ps.join('\n  - '));
let fatal = gp.length > 0 && (!opt.only || [...genUsed].some((g) => genProbs[g]));
if (opt.only) { if (bad.has(opt.only)) fatal = true; }
else if (bad.size) fatal = true;
if (fatal) { console.error(`\n核對失敗，沒有產生頁面。（CPython ${jobs.length} 個工作，${tPy} ms）`); process.exit(1); }
if (opt.only && bad.size) console.warn(`\n警告：以下單元有問題，已略過（保留舊頁面）：${[...bad].join('、')}`);

// ---------- 產生頁面 ----------
const good = loaded.filter((U) => !bad.has(U.id));
const readPy = (f) => fs.readFileSync(path.join(PYDIR, f), 'utf8');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700;900&display=swap">';
const js = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const escA = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const CRS = { code: COURSE.code, title: COURSE.title, kicker: COURSE.kicker, pin: COURSE.pin };
function clean(U) {
  return JSON.parse(JSON.stringify(U, (k, v) => (k === '_ids' ? undefined : v)));
}
function page({ title, desc, boot, inline, skulpt }) {
  const meta = `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="${escA(desc)}">`;
  const libs = skulpt ? ['skulpt/skulpt.min.js', 'skulpt/skulpt-stdlib.js', 'pyrun.js', 'common.js'] : ['common.js'];
  if (inline) {
    return `<title>${escA(title)}</title>\n${meta}\n${FONTS}\n<style>\n${readPy('style.css')}\n</style>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n${libs.map((f) => `<script>\n${readPy(f).replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n')}\n<script>\n${boot}\n</script>\n`;
  }
  return `<!doctype html>\n<html lang="zh-Hant-HK">\n<head>\n${meta}\n<title>${escA(title)}</title>\n${FONTS}\n<link rel="stylesheet" href="${relPy}/style.css">\n</head>\n<body>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n${libs.map((f) => `<script src="${relPy}/${f}"></script>`).join('\n')}\n<script>\n${boot}\n</script>\n</body>\n</html>\n`;
}
function writeAtomic(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); const tmp = p + '.tmp' + process.pid; fs.writeFileSync(tmp, s); fs.renameSync(tmp, p); }
if (opt.out) fs.mkdirSync(opt.out, { recursive: true });
const toWrite = opt.only ? good.filter((U) => U.id === opt.only) : good;
for (const U of toWrite) {
  const title = `${COURSE.code} ${U.id.toUpperCase()} ${U.title}`;
  const o = { title, desc: `${COURSE.title}：${U.title}（${U.book || ''}）`, boot: `PY.unit(${js(clean(U))}, ${js(CRS)});`, skulpt: true };
  writeAtomic(path.join(CDIR, U.id, 'index.html'), page(o));
  if (opt.out) writeAtomic(path.join(opt.out, `${U.id}_單一檔案.html`), page(Object.assign({}, o, { inline: true })));
}
// 教師頁：通過核對的單元（答案）＋所有能載入的單元的 key（核對報告）
const keys = {}; for (const U of loaded) if (U.key) keys[U.id] = U.key;
const strip = (U) => JSON.parse(JSON.stringify(clean(U), (k, v) => (k === '_run' || k === '_exp' || k === '_sample' ? undefined : v)));
const T = { course: CRS, keys, units: good.map(strip) };
const to = { title: `${COURSE.title} 教師頁`, desc: `${COURSE.title}教師頁：核對學生簽名報告、匯總 CSV、各單元答案及重點`, boot: `PY.teacher(${js(T)});` };
writeAtomic(path.join(CDIR, 'teacher', 'index.html'), page(to));
if (opt.out) writeAtomic(path.join(opt.out, 'teacher_單一檔案.html'), page(Object.assign({}, to, { inline: true })));
// 目錄頁
const hasPage = (id) => fs.existsSync(path.join(CDIR, id, 'index.html'));
const planIds = PLAN.map((p) => p[0]);
const extra = loaded.filter((U) => !planIds.includes(U.id)).map((U) => [U.id, U.title, U.book || '']);
const cards = PLAN.concat(extra).map(([id, t, pg]) => {
  const U = good.find((u) => u.id === id); const title = U ? U.title : t;
  const inner = `<span class="code">${escA(id.toUpperCase())}</span><h2>${escA(title)}</h2><p>${escA(pg || '')}</p>`;
  return hasPage(id) ? `<a class="hcard" href="${id}/">${inner}</a>` : `<div class="hcard soon" aria-disabled="true">${inner}<p class="soonlab">製作中</p></div>`;
}).join('\n');
const hub = `<!doctype html>
<html lang="zh-Hant-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${escA(COURSE.title)}：${escA(COURSE.subtitle || '')}">
<title>${escA(COURSE.title)}</title>
${FONTS}
<link rel="stylesheet" href="${path.relative(CDIR, PYDIR).split(path.sep).join('/')}/style.css">
<style>
.hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.hcard{display:grid;gap:6px;align-content:start;padding:16px;background:var(--card);border:1px solid var(--line);border-radius:12px;color:inherit;text-decoration:none}
a.hcard:hover,a.hcard:focus-visible{border-color:var(--accent);outline:none}
.hcard h2{margin:0;font-size:19px}.hcard p{margin:0;color:var(--muted);font-size:14px}
.hcard .code{justify-self:start;font:600 12px var(--mono);background:var(--tag);color:var(--accent);padding:1px 8px;border-radius:6px}
.hcard.soon{opacity:.55}.soonlab{font-size:13px}
</style>
</head>
<body>
<div class="wrap">
<header class="top"><div class="brand"><span class="kicker">${escA(COURSE.kicker || 'HKDSE ICT')}</span><h1>${escA(COURSE.title)}</h1><span class="pages">${escA(COURSE.subtitle || '')}</span></div></header>
<p>每個單元有「學、試、練、寫程式、小測、無限練習」，程式在瀏覽器內用 Python 執行（像 Thonny）。最後按「交功課」產生附簽名的報告，交給老師。進度只儲存在這部裝置。</p>
<div class="hgrid">
${cards}
</div>
<footer><a href="${relRoot}/">← 返回練習室首頁</a><span class="spacer"></span><a href="teacher/">教師頁</a></footer>
</div>
</body>
</html>
`;
writeAtomic(path.join(CDIR, 'index.html'), hub);
console.log(`已核對 ${loaded.length} 個單元（CPython ${jobs.length} 個工作，${tPy} ms；生成器每個抽樣 ${opt.samples} 次）`);
console.log(`已產生：${toWrite.map((u) => u.id).join('、') || '（沒有單元頁）'}、教師頁、目錄頁${opt.out ? `；單一檔案版在 ${opt.out}` : ''}`);
