#!/usr/bin/env node
/* D1 自學平台 產生器
 * 讀 d1/src/uN.js → 產生 d1/uN/index.html 及 d1/teacher/index.html；
 * 同時產生「單一檔案版」（共用檔內嵌；不含 doctype/html/head/body，<title> 放最前）。
 * 產生前用引擎核對所有題目答案；有任何問題便停止。
 * 用法：node d1/tools/build.js [單一檔案輸出目錄]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const D1DIR = path.join(__dirname, '..');
const OUT1 = process.argv[2] || path.join(D1DIR, 'dist');

const E = require(path.join(D1DIR, 'engine.js'));
global.window = { D1E: E };
require(path.join(D1DIR, 'common.js'));
const D1 = global.window.D1;

const units = fs.readdirSync(path.join(D1DIR, 'src')).filter((f) => /^u\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  .map((f) => { delete require.cache[require.resolve(path.join(D1DIR, 'src', f))]; return require(path.join(D1DIR, 'src', f)); });

// ---------- 核對 ----------
const problems = [];
const ids = new Set();
function chk(cond, msg) { if (!cond) problems.push(msg); }
for (const U of units) {
  let total = 0;
  const seen = (id) => { chk(!ids.has(id), `${U.id}：題目編號重複 ${id}`); ids.add(id); };
  for (const sec of U.sections) {
    for (const it of sec.tries || []) {
      seen(it.id); total += it.pts;
      try { D1.correctIndex(it); } catch (e) { problems.push(`${it.id}：${e.message}`); }
      try { E.parseProgram(it.code); } catch (e) { problems.push(`${it.id}：${e.message}`); }
    }
    for (const it of sec.practice || []) {
      seen(it.id); total += it.pts;
      try {
        if (it.type === 'mc') { D1.correctIndex(it); if (it.code && it.verify) { const r = D1.askAnswer(it); chk(E.same(it.options[D1.correctIndex(it)], r), `${it.id}：選項與引擎答案不符`); } }
        else if (it.type === 'fill') { const a = D1.fillAnswers(it); chk(a.every((x) => x !== ''), `${it.id}：有空白答案`); }
        else if (it.type === 'trace') { const tr = D1.traceOf(it); chk(tr.rows.length > 0, `${it.id}：追蹤表沒有內容`); }
        else if (it.type === 'complete') { const code = D1.subBlanks(it.template, it.ref); for (const t of it.tests) { const o = D1.outcome(code, t, it.check); chk(!o.err, `${it.id}：參考答案出錯 ${o.err}`); } }
        else problems.push(`${it.id}：未知題型 ${it.type}`);
      } catch (e) { problems.push(`${it.id}：${e.message}`); }
    }
    for (const t of sec.tasks || []) {
      seen(t.id); total += t.pts;
      const r = D1.checkWrite(t, t.ref);
      chk(r.ok, `${t.id}：參考答案未能通過自己的測試 ${JSON.stringify(r)}`);
      const s = D1.checkWrite(t, t.starter || '');
      chk(!s.ok, `${t.id}：起始程式竟然已通過測試`);
    }
    for (const it of sec.items || []) {
      seen(it.id); total += it.pts;
      try {
        const ci = D1.correctIndex(it);
        if (it.verify) { const a = D1.askAnswer(it); chk(E.same(it.options[ci], a), `${it.id}：教科書答案 ${it.answer}（${it.options[ci]}）與引擎答案「${a}」不符`); }
      } catch (e) { problems.push(`${it.id}：${e.message}`); }
    }
  }
  chk(total === 100, `${U.id}：總分是 ${total}，不是 100`);
}
if (problems.length) { console.error('核對失敗：\n' + problems.join('\n')); process.exit(1); }

// ---------- 產生頁面 ----------
const read = (f) => fs.readFileSync(path.join(D1DIR, f), 'utf8');
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700;900&display=swap">';
const js = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const unitNo = (U) => U.id.replace(/^u/, '');

function page({ title, desc, boot, inline }) {
  const meta = `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="${desc}">`;
  if (inline) {
    return `<title>${title}</title>\n${meta}\n${FONTS}\n<style>\n${read('style.css')}\n</style>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n<script>\n${read('engine.js')}\n</script>\n<script>\n${read('common.js')}\n</script>\n<script>\n${boot}\n</script>\n`;
  }
  return `<!doctype html>\n<html lang="zh-Hant-HK">\n<head>\n${meta}\n<title>${title}</title>\n${FONTS}\n<link rel="stylesheet" href="../style.css">\n</head>\n<body>\n<div id="app"><noscript>這個頁面需要開啟 JavaScript。</noscript></div>\n<script src="../engine.js"></script>\n<script src="../common.js"></script>\n<script>\n${boot}\n</script>\n</body>\n</html>\n`;
}
fs.mkdirSync(OUT1, { recursive: true });
for (const U of units) {
  const title = `D1 單元${unitNo(U)} ${U.title}`;
  const opt = { title, desc: `HKDSE ICT 必修 D1 自學：${U.title}（${U.book}）`, boot: `D1.unit(${js(U)});` };
  fs.mkdirSync(path.join(D1DIR, U.id), { recursive: true });
  fs.writeFileSync(path.join(D1DIR, U.id, 'index.html'), page(opt));
  fs.writeFileSync(path.join(OUT1, `${U.id}_單一檔案.html`), page(Object.assign({}, opt, { inline: true })));
}
const T = { units };
const topt = { title: 'D1 自學平台 教師頁', desc: 'D1 自學平台教師頁：核對學生簽名報告、匯總 CSV、各單元答案及重點', boot: `D1.teacher(${js(T)});` };
fs.mkdirSync(path.join(D1DIR, 'teacher'), { recursive: true });
fs.writeFileSync(path.join(D1DIR, 'teacher', 'index.html'), page(topt));
fs.writeFileSync(path.join(OUT1, 'teacher_單一檔案.html'), page(Object.assign({}, topt, { inline: true })));
console.log(`已產生 ${units.map((u) => u.id).join('、')} 及教師頁；單一檔案版在 ${OUT1}`);
