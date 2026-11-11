#!/usr/bin/env node
/* 選修A SQL 自學平台 產生器
 * 用法：node sqlp/tools/build.js <課程資料夾，例如 electa 或 sqlp/demo> [--only <單元>] [--out <單一檔案輸出目錄>]
 * 步驟：載入 <課程>/src/*.js → 按 course.json plan 排序 → 用 SQL 引擎核對所有答案（總分 100、編號不重複、
 * 參考答案通過／起始程式不通過、無限練習生成器抽樣）→ 產生 <課程>/<id>/index.html、teacher/index.html、index.html；
 * --out 另產生單一檔案版（共用檔內嵌；不含 doctype/html/head/body，<title> 放最前）。
 * 有 --only 時：只要求該單元通過；其他單元有問題只會警告，並不放入目錄及教師頁。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const SQLP = path.join(__dirname, '..');
const ROOT = path.join(SQLP, '..');

const args = process.argv.slice(2);
let only = null, outDir = null; const pos = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--only') only = args[++i]; else if (args[i] === '--out') outDir = args[++i]; else pos.push(args[i]); }
if (!pos[0]) { console.error('用法：node sqlp/tools/build.js <課程資料夾> [--only <單元>] [--out <目錄>]'); process.exit(2); }
const CDIR = fs.existsSync(path.resolve(pos[0], 'course.json')) ? path.resolve(pos[0]) : path.join(ROOT, pos[0]);
if (!fs.existsSync(path.join(CDIR, 'course.json'))) { console.error(`找不到 ${path.join(CDIR, 'course.json')}`); process.exit(2); }
const COURSE = JSON.parse(fs.readFileSync(path.join(CDIR, 'course.json'), 'utf8'));
const PLAN = COURSE.plan || [];

const E = require(path.join(SQLP, 'engine.js'));
global.window = { SQLE: E };
require(path.join(SQLP, 'common.js'));
const SQ = global.window.SQ;

// ---------- 載入 ----------
const natural = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const srcDir = path.join(CDIR, 'src');
const files = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort(natural) : [];
const loaded = []; const loadErr = {};
for (const f of files) {
  const id0 = f.replace(/\.js$/, '');
  try { const p = path.join(srcDir, f); delete require.cache[require.resolve(p)]; const U = require(p); if (!U || !U.id) throw new Error('沒有 module.exports.id'); U._file = f; loaded.push(U); }
  catch (e) { loadErr[id0] = `載入失敗：${e.message}`; }
}
const planIds = PLAN.map((p) => p[0]);
loaded.sort((a, b) => { const ia = planIds.indexOf(a.id), ib = planIds.indexOf(b.id); if (ia >= 0 && ib >= 0) return ia - ib; if (ia >= 0) return -1; if (ib >= 0) return 1; return natural(a.id, b.id); });

// ---------- 核對 ----------
function checkUnit(U) {
  const P = [], W = [];
  const chk = (c, m) => { if (!c) P.push(m); };
  const tryF = (id, f) => { try { f(); } catch (e) { P.push(`${id}：${e.message}`); } };
  chk(U.title, '沒有 title'); chk(/^[\x21-\x7e]{12,}$/.test(U.key || ''), 'key 要是 12 個字符以上的英文／數字字串');
  chk(Array.isArray(U.sections) && U.sections.length, '沒有 sections');
  if (U.dbs) for (const k of Object.keys(U.dbs)) tryF(`數據庫 ${k}`, () => SQ.dbOf(U, k));
  const ids = new Set();
  const seen = (id) => { chk(id, '有題目沒有 id'); chk(!ids.has(id), `題目編號重複 ${id}`); ids.add(id); if (id && !new RegExp(`^${U.id}-(s\\d+-[tp]\\d+|w\\d+|q\\d+)$`).test(id)) W.push(`編號 ${id} 不符合「${U.id}-s1-t1／-s1-p1／-w1／-q1」格式`); };
  const cats = { try: 0, prac: 0, write: 0, quiz: 0 };
  const secIds = new Set();
  for (const sec of U.sections || []) {
    if (sec.id) { chk(!secIds.has(sec.id), `節編號重複 ${sec.id}`); secIds.add(sec.id); }
    else if (!sec.kind) P.push(`節「${sec.title}」沒有 id`);
    if (!sec.id) sec.id = sec.kind || 'sec' + secIds.size;
    for (const b of sec.learn || []) {
      if (b.sim) tryF(`${sec.id} sim`, () => { SQ.dbOf(U, b.sim.db); E.runScript(SQ.dbOf(U, b.sim.db), b.sim.sql || ''); });
      if (b.tables) tryF(`${sec.id} tables`, () => SQ.dbOf(U, b.tables.db || b.tables));
      if (b.er) tryF(`${sec.id} er`, () => { const names = (b.er.entities || []).map((e) => e.name); (b.er.rels || []).forEach((r) => { if (!names.includes(r.a) || !names.includes(r.b)) throw new Error(`ER 圖關係 ${r.name} 的實體 ${r.a}／${r.b} 不存在`); }); SQ.erSvg(b.er); });
    }
    for (const it of sec.tries || []) {
      seen(it.id); cats.try += it.pts || 0;
      tryF(it.id, () => { if (!Array.isArray(it.options) || it.options.length < 2) throw new Error('要有最少 2 個選項'); if (!it.sql) throw new Error('試題要有 sql'); SQ.verifyItem(it, U); });
    }
    for (const it of sec.practice || []) {
      seen(it.id); cats.prac += it.pts || 0;
      tryF(it.id, () => {
        if (!(it.pts >= 1)) throw new Error('pts 最少 1');
        if (it.type === 'mc') { if (!Array.isArray(it.options) || it.options.length < 2) throw new Error('要有最少 2 個選項'); SQ.verifyItem(it, U); }
        else if (it.type === 'fill') { const a = SQ.fillAnswers(it, U); if (!it.blanks.length) throw new Error('沒有空格'); a.forEach((x, i) => { if (x === '' && !it.blanks[i].ask) throw new Error(`第 ${i + 1} 個空格沒有答案`); }); }
        else if (it.type === 'complete') {
          const n = (it.template.match(/［\d+］/g) || []).length; if (n !== it.ref.length) throw new Error(`模板有 ${n} 個空格，ref 有 ${it.ref.length} 個答案`);
          const ref = SQ.subBlanks(it.template, it.ref); const r = SQ.checkSql(it, ref, U, ref); if (!r.ok) throw new Error('參考答案未能通過：' + JSON.stringify(r.list.filter((x) => !x.ok)));
          const wrong = SQ.subBlanks(it.template, it.ref.map(() => '1')); const w = SQ.checkSql(it, wrong, U, ref); if (w.ok) W.push(`${it.id}：空格全填「1」竟然通過`);
        }
        else if (it.type === 'fd') { SQ.fdInfo(it); if (it.options) SQ.verifyItem(it, U); }
        else throw new Error(`未知題型 ${it.type}`);
      });
    }
    for (const t of sec.tasks || []) {
      seen(t.id); cats.write += t.pts || 0;
      tryF(t.id, () => {
        if (t.kind === 'table') {
          const ans = SQ.tableAnswers(t);
          if (!ans.length || !ans.every((a) => a !== '')) throw new Error('表格沒有答案');
          t.rows.forEach((r) => r.forEach((c) => { if (c && c.sel && !(t.opts[c.sel] || []).includes(String(c.a))) throw new Error(`答案「${c.a}」不在選項 ${c.sel} 內`); }));
          if (!SQ.checkTableVals(t, ans).every(Boolean)) throw new Error('答案未能通過自己的核對');
          if (t.db) SQ.dbOf(U, t.db);
          return;
        }
        if (!t.ref || !t.db) throw new Error('寫SQL 題要有 db 及 ref');
        const r = SQ.checkSql(t, t.ref, U);
        if (!r.ok) throw new Error('參考答案未能通過：' + (r.ruleMsg || JSON.stringify(r.list.filter((x) => !x.ok))));
        if (r.list.length < 2) W.push(`${t.id}：沒有可用的隱藏變體數據庫（數據表是空的？）`);
        const s = SQ.checkSql(t, t.starter || '', U);
        if (s.ok) throw new Error('起始程式竟然已通過測試');
      });
    }
    if (sec.kind === 'quiz') for (const it of sec.items || []) {
      seen(it.id); cats.quiz += it.pts || 0;
      tryF(it.id, () => { if (!Array.isArray(it.options) || it.options.length < 2) throw new Error('要有最少 2 個選項'); SQ.verifyItem(it, U); });
    }
    if (sec.kind === 'endless') (sec.gens || []).forEach((g) => chk(SQ.GENS[g], `${sec.id}：沒有無限練習生成器 ${g}（可用：${SQ.GEN_NAMES.join('、')}）`));
  }
  const total = cats.try + cats.prac + cats.write + cats.quiz;
  chk(total === 100, `總分是 ${total}（試 ${cats.try}、練 ${cats.prac}、寫 ${cats.write}、小測 ${cats.quiz}），不是 100`);
  const want = U.theory ? { try: 0, prac: 40, write: 35, quiz: 25 } : { try: 20, prac: 25, write: 35, quiz: 20 };
  if (total === 100 && Object.keys(want).some((k) => cats[k] !== want[k])) W.push(`分數分佈 試 ${cats.try}／練 ${cats.prac}／寫 ${cats.write}／小測 ${cats.quiz}，建議 ${JSON.stringify(want)}`);
  const last = (U.sections || [])[U.sections.length - 1];
  if (!last || last.kind !== 'report') W.push('最後一節應是 {kind:\'report\'}');
  return { P, W };
}
// 無限練習生成器抽樣
function sampleGens(names) {
  const P = [];
  for (const g of names) {
    for (let i = 0; i < 200; i++) {
      try {
        const q = SQ.GENS[g]();
        if (!q.options || q.options.length < 2) throw new Error('選項少於 2 個');
        const hits = q.options.filter((o) => SQ.same(o, q.ans)).length;
        if (hits !== 1) throw new Error(`有 ${hits} 個選項等於答案 ${q.ans}`);
        if (q.sql) { const a = SQ.askAnswer({ sql: q.sql, ask: q.ask, _T: q.T }); if (!SQ.same(a, q.ans)) throw new Error('答案與引擎不符'); }
      } catch (e) { P.push(`生成器 ${g}：${e.message}`); break; }
    }
  }
  return P;
}

const results = {};
const units = [];
for (const U of loaded) {
  if (only && U.id !== only) { /* 其他單元：仍核對，失敗只警告 */ }
  let r; try { r = checkUnit(U); } catch (e) { r = { P: [`核對時出錯：${e.stack}`], W: [] }; }
  results[U.id] = r;
}
const genProblems = sampleGens(SQ.GEN_NAMES);
let failed = false;
if (genProblems.length) { console.error('無限練習生成器有問題：\n  ' + genProblems.join('\n  ')); failed = true; }
for (const [id, msg] of Object.entries(loadErr)) {
  if (!only || id === only) { console.error(`✗ ${id}：${msg}`); failed = true; } else console.warn(`⚠ ${id}（未放入目錄）：${msg}`);
}
if (only && !loaded.some((U) => U.id === only) && !loadErr[only]) { console.error(`找不到單元 ${only}（${srcDir}/${only}.js）`); failed = true; }
for (const U of loaded) {
  const { P, W } = results[U.id];
  W.forEach((w) => console.warn(`⚠ ${U.id}：${w}`));
  if (P.length) {
    if (!only || U.id === only) { console.error(`✗ ${U.id} 核對失敗：\n  ` + P.join('\n  ')); failed = true; }
    else console.warn(`⚠ ${U.id} 有問題（未放入目錄及教師頁）：\n  ` + P.slice(0, 5).join('\n  ') + (P.length > 5 ? `\n  …共 ${P.length} 項` : ''));
  } else units.push(U);
}
if (failed && !only) { console.error('核對失敗，沒有產生頁面。'); process.exit(1); }
if (failed && only && !units.some((U) => U.id === only)) { console.error(`單元 ${only} 核對失敗，沒有產生頁面。`); process.exit(1); }

// ---------- 產生頁面 ----------
const read = (f) => fs.readFileSync(path.join(SQLP, f), 'utf8');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700;900&display=swap">';
const js = (o) => JSON.stringify(o, (k, v) => (k === '_file' ? undefined : v)).replace(/</g, '\\u003c').replace(/ /g, '\\u2028').replace(/ /g, '\\u2029');
const escA = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const CRS = { code: COURSE.code, title: COURSE.title, kicker: COURSE.kicker, pin: COURSE.pin };
function page({ title, desc, boot, inline, rel }) {
  const meta = `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="${escA(desc)}">`;
  if (inline) return `<title>${escA(title)}</title>\n${meta}\n${FONTS}\n<style>\n${read('style.css')}\n</style>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n<script>\n${read('engine.js')}\n</script>\n<script>\n${read('common.js')}\n</script>\n<script>\n${boot}\n</script>\n`;
  return `<!doctype html>\n<html lang="zh-Hant-HK">\n<head>\n${meta}\n<title>${escA(title)}</title>\n${FONTS}\n<link rel="stylesheet" href="${rel}/style.css">\n</head>\n<body>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n<script src="${rel}/engine.js"></script>\n<script src="${rel}/common.js"></script>\n<script>\n${boot}\n</script>\n</body>\n</html>\n`;
}
const relTo = (dir) => path.relative(dir, SQLP).split(path.sep).join('/');
if (outDir) fs.mkdirSync(outDir, { recursive: true });
const written = [];
for (const U of units) {
  if (only && U.id !== only) continue;
  const dir = path.join(CDIR, U.id);
  const opt = { title: `${COURSE.code} ${U.id.toUpperCase()} ${U.title}`, desc: `HKDSE ICT ${COURSE.code} 自學：${U.title}（${U.book || ''}）`, boot: `SQ.unit(${js(U)}, ${js(CRS)});`, rel: relTo(dir) };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(opt));
  if (outDir) fs.writeFileSync(path.join(outDir, `${U.id}_單一檔案.html`), page(Object.assign({}, opt, { inline: true })));
  written.push(U.id);
}
const tdir = path.join(CDIR, 'teacher');
const topt = { title: `${COURSE.title} 教師頁`, desc: `${COURSE.title}教師頁：核對學生簽名報告、匯總 CSV、各單元答案及重點`, boot: `SQ.teacher(${js({ course: CRS, units })});`, rel: relTo(tdir) };
fs.mkdirSync(tdir, { recursive: true });
fs.writeFileSync(path.join(tdir, 'index.html'), page(topt));
if (outDir) fs.writeFileSync(path.join(outDir, 'teacher_單一檔案.html'), page(Object.assign({}, topt, { inline: true })));
// ---------- 目錄頁 ----------
const have = new Set(units.map((u) => u.id).filter((id) => fs.existsSync(path.join(CDIR, id, 'index.html'))));
const extra = units.filter((U) => !planIds.includes(U.id)).map((U) => [U.id, U.title, U.book || '']);
const cards = PLAN.concat(extra).map(([id, t, pg]) => {
  const U = units.find((u) => u.id === id); const title = U ? U.title : t;
  const inner = `<span class="code">${escA(id.toUpperCase())}</span><h2>${escA(title)}</h2><p>${escA(U && U.book ? U.book : '教科書 ' + (pg || ''))}</p>`;
  return have.has(id) ? `<a class="hcard" href="${id}/">${inner}</a>` : `<div class="hcard soon" aria-disabled="true">${inner}<p class="soonlab">製作中</p></div>`;
}).join('\n');
const hub = `<!doctype html>
<html lang="zh-Hant-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${escA(COURSE.title)}：${escA(COURSE.subtitle || '')}；附 SQL 控制台、自動批改及簽名報告">
<title>${escA(COURSE.title)}</title>
${FONTS}
<link rel="stylesheet" href="${relTo(CDIR)}/style.css">
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
<p>每個單元有「學、試、練、寫SQL、小測、無限練習」，可以在瀏覽器內直接執行 SQL；最後按「交功課」產生附簽名的報告，交給老師。進度只儲存在這部裝置。</p>
<div class="hgrid">
${cards}
</div>
<footer><a href="../">← 返回練習室首頁</a><span class="spacer"></span><a href="teacher/">教師頁</a></footer>
</div>
</body>
</html>
`;
fs.writeFileSync(path.join(CDIR, 'index.html'), hub);
console.log(`核對通過：${units.map((u) => u.id).join('、') || '（沒有）'}；已產生 ${written.join('、') || '（沒有單元頁）'}、教師頁及目錄頁${outDir ? `；單一檔案版在 ${outDir}` : ''}`);
if (failed) process.exit(1);
