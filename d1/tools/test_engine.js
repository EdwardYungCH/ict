#!/usr/bin/env node
/* D1 偽代碼引擎測試：教科書第 2、3 章所有有答案的偽代碼例子、活動、測試站、課題練習選擇題。
 * 執行：node d1/tools/test_engine.js
 * 標記：
 *   〔錯誤記錄 D1-x〕＝教科書疑似錯誤，按錯誤記錄處理（用正確版本）
 *   〔流程圖轉寫〕＝原題是流程圖，這裏轉寫成偽代碼
 *   〔教科書未附答案〕＝答案以人手計算核對
 */
'use strict';
const path = require('path');
const E = require(path.join(__dirname, '..', 'engine.js'));

let pass = 0, fail = 0; const fails = [];
const dd = (s) => { const ls = s.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n'); const ind = Math.min(...ls.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length)); return ls.map((l) => l.slice(ind)).join('\n'); };
const ok = (name, cond, info) => { if (cond) pass++; else { fail++; fails.push(`✗ ${name}${info ? '\n    ' + info : ''}`); } };
const lines = (x) => (Array.isArray(x) ? x : String(x).split('\n'));

function T(ref, code, opt, chk) {
  if (!chk) { chk = opt; opt = {}; }
  const src = dd(code);
  let res;
  try { res = E.run(src, { inputs: opt.inputs || [], vars: opt.vars || {}, arrays: opt.arrays || {} }, { maxSteps: opt.maxSteps, strictThen: opt.strict }); }
  catch (e) {
    if (chk.parseErr) { ok(ref + '（語法錯誤）', e.message.includes(chk.parseErr), `得到：${e.message}`); return; }
    ok(ref, false, '語法錯誤：' + e.message); return;
  }
  if (chk.parseErr) { ok(ref + '（應有語法錯誤）', false, '沒有報錯'); return; }
  if (chk.err) {
    ok(ref + '（應出錯）', res.error && (chk.err === 'loop' ? res.error.kind === 'loop' : res.error.message.includes(chk.err)), `得到：${res.error ? res.error.message : '沒有錯誤'}`);
  } else if (res.error) { ok(ref, false, '執行錯誤：' + res.error.message); return; }
  if (chk.out !== undefined) ok(ref + '（輸出）', E.sameOutput(res.out, lines(chk.out)) && res.out.length === lines(chk.out).filter((x) => x !== '').length || (lines(chk.out).length === 1 && E.same(res.out.join(' '), chk.out)), `期望：${lines(chk.out).join(' / ')}　得到：${res.out.join(' / ')}`);
  if (chk.outJoin !== undefined) ok(ref + '（輸出連寫）', res.out.join('') === chk.outJoin, `期望：${chk.outJoin}　得到：${res.out.join('')}`);
  for (const [k, v] of Object.entries(chk.vars || {})) {
    const got = res.env.v[k];
    ok(`${ref}（${k}）`, typeof v === 'number' && typeof got === 'number' ? Math.abs(got - v) < 1e-6 : got === v, `期望 ${k} = ${E.fmt(v)}　得到：${E.fmt(got)}`);
  }
  for (const [k, v] of Object.entries(chk.arrs || {})) {
    const A = res.env.a[k]; const got = A ? v.map((_, j) => A[j + 1]) : null;
    ok(`${ref}（${k}[]）`, got && got.every((x, j) => x === v[j]), `期望 ${k} = [${v.join(', ')}]　得到：${got ? '[' + got.join(', ') + ']' : '沒有陣列'}`);
  }
  for (const [ln, n] of Object.entries(chk.count || {})) ok(`${ref}（第 ${ln} 行執行次數）`, E.countLine(res, Number(ln) - 1) === n, `期望 ${n} 次，得到 ${E.countLine(res, Number(ln) - 1)} 次`);
  if (chk.trace) {
    const tr = E.buildTrace(res, chk.trace.spec || {});
    const got = tr.rows.map((r) => tr.cols.map((c) => (r.cells[c.key].changed ? r.cells[c.key].v : '')));
    const exp = chk.trace.rows;
    const same = exp.length === got.length && exp.every((row, i) => row.every((v, j) => String(v) === got[i][j]));
    ok(ref + '（追蹤表）', same, `期望：${JSON.stringify(exp)}\n    得到：${JSON.stringify(got)}\n    欄：${tr.cols.map((c) => c.label).join(' | ')}`);
  }
  if (chk.check) ok(ref + '（自訂檢查）', chk.check(res), '');
  return res;
}
// 布爾算式：exprs 為 {算式: 期望}
function B(ref, vars, exprs) {
  for (const [ex, exp] of Object.entries(exprs)) {
    let v; try { v = E.evalNode(E.parseExpr(ex), { v: vars, a: {} }); } catch (e) { ok(`${ref} ${ex}`, false, e.message); continue; }
    ok(`${ref} ${ex}`, v === exp, `期望 ${exp}，得到 ${v}`);
  }
}
const outOf = (code, init, opt) => { const r = E.run(dd(code), init || {}, opt || {}); return r.error ? 'ERR:' + r.error.message : r.out.join(' / '); };
const H10 = [172.2, 152.3, 165, 170, 168.5, 175, 188, 160, 150, 155];
const HS = [150, 152.3, 155, 160, 165, 168.5, 170, 172.2, 175, 188];

// =========================== 第 2 章 ===========================
T('p.35 例題 2.1 BMI（輸入 60, 1.7）', `
  輸入 weight, height
  bmi ← weight/(height*height)
  輸出 bmi`, { inputs: [60, 1.7] }, { check: (r) => Math.abs(r.env.v.bmi - 60 / 2.89) < 1e-9 && r.out[0] === '20.7612' });

T('p.39 活動 2.2 第 1 行', `
  A ← 7
  A ← 10
  輸出 A`, { out: '10' });
T('p.39 活動 2.2 第 2 行', `
  A ← 3
  B ← A + 6
  C ← A * B
  輸出 A, B, C`, { out: '3 9 27' });
T('p.39 活動 2.2 第 3 行', `
  A ← 6
  B ← A/2
  A ← 8
  輸出 A, B`, { out: '8 3' });
T('p.39 例題 2.2 第 1 題', `
  A ← 2
  B ← 5
  A ← B - A
  A ← A * B
  B ← A - B
  輸出 A`, { out: '15', trace: { spec: { mode: 'stmt', out: false }, rows: [['2', ''], ['', '5'], ['3', ''], ['15', ''], ['', '10'], ['', '']] } });
T('p.40 例題 2.2 第 2 題（交換）', `
  X ← 3
  Y ← 9
  temp ← X
  X ← Y
  Y ← temp`, { vars: { X: 9, Y: 3, temp: 3 }, trace: { spec: { mode: 'stmt' }, rows: [['3', '', ''], ['', '9', ''], ['', '', '3'], ['9', '', ''], ['', '3', '']] } });
T('p.40 想像：X ← Y、Y ← X 不能交換', `
  X ← 3
  Y ← 9
  X ← Y
  Y ← X`, { vars: { X: 9, Y: 9 } });
T('p.41 測試站 2.1 第 1 題（答案 A）', `
  A ← 1
  B ← 2
  C ← A + B
  A ← 6
  B ← 8
  輸出 C`, { out: '3', trace: { spec: { mode: 'stmt', out: false }, rows: [['1', '', ''], ['', '2', ''], ['', '', '3'], ['6', '', ''], ['', '8', ''], ['', '', '']] } });
T('p.41 測試站 2.1 第 2 題（答案 D）', `
  A ← 3
  B ← 5
  C ← A * B
  A ← A + 1
  B ← B - 1
  C ← A * B
  輸出 A, B, C`, { out: '4 4 16' });
T('p.41 測試站 2.1 第 3 題', `
  A ← 1
  B ← 2
  C ← A + B
  A ← B + C
  B ← C + A
  輸出 A, B, C`, { out: '5 8 3' });
T('p.46 例題 2.4 原書第 1 行〔錯誤記錄 D1-4〕應報錯', `
  輸入 test 1, test 2, test 3
  avg_mark ← (test1 + test2 + test3) / 3
  輸出 avg_mark`, { inputs: [60, 70, 80] }, { parseErr: '第 1 行' });
T('p.46 例題 2.4 更正版（test1, test2, test3）', `
  輸入 test1, test2, test3
  avg_mark ← (test1 + test2 + test3) / 3
  輸出 avg_mark`, { inputs: [60, 70, 85] }, { out: '71.6667' });
T('p.49 如果…則（mark 45）：不會執行 grade ← "及格"，沒有輸出', `
  輸入 mark
  如果 mark >= 50 則
      grade ← "及格"
  輸出 grade`, { inputs: [45] }, { out: [], err: 'grade 未有值' });
T('p.50 如果…則…否則（mark 50 → 及格）', `
  輸入 mark
  如果 mark >=50 則
      grade ← "及格"
  否則
      grade ← "不及格"
  輸出 grade`, { inputs: [50] }, { out: '及格' });
T('p.50 試想想：改成 > 後 mark 50 → 不及格', `
  輸入 mark
  如果 mark > 50 則
      grade ← "及格"
  否則
      grade ← "不及格"
  輸出 grade`, { inputs: [50] }, { out: '不及格' });
B('p.51 活動 2.3 第 1 題 age 50', { age: 50 }, { 'age = 65': false, 'age < 65': true, 'age <= 65': true, 'age > 65': false, 'age >= 65': false, 'age != 65': true });
B('p.51 活動 2.3 第 1 題 age 65', { age: 65 }, { 'age = 65': true, 'age < 65': false, 'age <= 65': true, 'age > 65': false, 'age >= 65': true, 'age != 65': false });
B('p.51 活動 2.3 第 1 題 age 70', { age: 70 }, { 'age = 65': false, 'age < 65': false, 'age <= 65': false, 'age > 65': true, 'age >= 65': true, 'age != 65': true });
T('p.52 活動 2.3 第 2 題', `
  A ← 20
  如果 A <> 20 則
      輸出 "No"
  否則
      輸出 "Yes"`, { out: 'Yes' });
T('p.52 活動 2.3 第 3 題', `
  A ← 30
  如果 A * 2 >= 60 則
      A ← A - 10
      輸出 A
  否則
      A ← A + 10
      輸出 A`, { vars: { A: 20 }, out: '20' });
T('p.52 活動 2.3 第 4 題（縮排）', `
  mark ← 100
  如果 mark >= 50 則
      輸出 "及格"
      輸出 "升班"
  否則
      輸出 "不及格"
  輸出 "留級"`, { out: ['及格', '升班', '留級'] });
const grade3 = `
  輸入 mark
  如果 mark >= 85 則
      grade ← "A"
  否則
      如果 mark >= 50 則
          grade ← "B"
      否則
          grade ← "F"
  輸出 grade`;
T('p.55 活動 2.4 輸入 80', grade3, { inputs: [80] }, { out: 'B' });
T('p.55 活動 2.4 輸入 30', grade3, { inputs: [30] }, { out: 'F' });
T('p.56 活動 2.4 輸入 95', grade3, { inputs: [95] }, { out: 'A' });
T('p.56 試想想 邏輯錯誤版本 mark 10 → B', `
  輸入 mark
  如果 mark < 85 則
      grade ← "B"
  否則
      如果 mark < 50 則
          grade ← "F"
      否則
          grade ← "A"
  輸出 grade`, { inputs: [10] }, { out: 'B' });
const grade6 = `
  如果 mark >= 90 則
      grade ← "A"
  否則
      如果 mark >= 80 則
          grade ← "B"
      否則
          如果 mark >= 70 則
              grade ← "C"
          否則
              如果 mark >= 60 則
                  grade ← "D"
              否則
                  如果 mark >= 50 則
                      grade ← "E"
                  否則
                      grade ← "F"`;
for (const [m, g] of [[100, 'A'], [90, 'A'], [89, 'B'], [80, 'B'], [79, 'C'], [70, 'C'], [69, 'D'], [60, 'D'], [59, 'E'], [50, 'E'], [49, 'F'], [0, 'F']])
  T(`p.56 試想想 六個等級（mark ${m}）`, grade6, { vars: { mark: m } }, { vars: { grade: g } });
const ex25 = `
  X ← 20
  Y ← 10
  如果 X + Y > 25 則
      如果 Y > X * 2 則
          Y ← X
      否則
          X ← Y
  否則
      Y ← X - 5`;
T('p.58 例題 2.5（Y 的最終值，答案 A）及 p.59 想像（X 的最終值）', ex25, { vars: { Y: 10, X: 10 } });
T('p.58 例題 2.5 分析部分「Y > X * 2 >」〔錯誤記錄 D1-7〕應報錯', ex25.replace('如果 Y > X * 2 則', '如果 Y > X * 2 > 則'), { parseErr: '第 4 行' });
// 測試站 2.4 第 1–3 題（流程圖轉寫）
const fc24 = `
  輸入 X, Y, Z
  如果 X >= Y 則
      如果 Z > X 則
          Y ← Y - 1
      否則
          輸出 "A"
  否則
      如果 Z > Y 則
          輸出 "B"
      否則
          輸出 "C"`;
T('p.59 測試站 2.4 第 1 題〔流程圖轉寫〕X = Y、Z > X → Y 最小（答案 A）', fc24, { inputs: [5, 5, 8] }, { out: [], check: (r) => r.env.v.Y < r.env.v.X && r.env.v.Y < r.env.v.Z });
T('p.59 測試站 2.4 第 2 題〔流程圖轉寫〕X = Y = Z → 輸出 A（答案 B）', fc24, { inputs: [5, 5, 5] }, { out: 'A' });
{
  const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  const rs = perms.map((p) => ({ p, r: E.run(dd(fc24), { inputs: p }) }));
  ok('p.59 測試站 2.4 第 3 題 D 正確：沒有輸出時 Z 最大', rs.filter((x) => !x.r.out.length).every((x) => x.p[2] === 3));
  ok('p.59 測試站 2.4 第 3 題 A 錯：「C」不一定輸出', rs.some((x) => x.r.out[0] !== 'C'));
  ok('p.59 測試站 2.4 第 3 題 B 錯：「A」可以輸出', rs.some((x) => x.r.out[0] === 'A'));
  ok('p.59 測試站 2.4 第 3 題 C 錯：輸出「B」時 Z 不一定最小', rs.some((x) => x.r.out[0] === 'B' && x.p[2] !== 1));
}
T('p.60 測試站 2.4 第 4 題（答案 B）', `
  X ← 8
  Y ← 4
  如果 (2 * Y) >= X 則
      如果 X / 2 > Y 則
          X ← Y
          輸出 X
      否則
          Y ← X
          輸出 Y
  否則
      Z ← X + Y
      輸出 Z`, { out: '8' });
B('p.64 例題 2.6 第 1 題（答案 B）', { A: 1, B: 2 }, {
  '((B > A) AND (B < 1)) OR (A > 1)': false, '((A > B) OR (B > 1)) AND (A <= 1)': true,
  '((A > B) OR (B < 1)) AND (A <= 1)': false, '(B > A) AND ((B < 1) OR (A > 1))': false,
  '(A > B) OR (B < 1)': false, // 〔錯誤記錄 D1-8〕選項 C 第三欄應為 (B < 1)，數值 False
});
B('p.65 例題 2.6 想像', { A: 1, B: 2 }, { '(A > B) AND ((B < 1) OR (A > 1))': false, '((NOT(B > A)) AND (B < 1)) OR (A <= 1)': true });
for (const [a, b] of [[20, 20], [20, 5], [5, 20], [5, 5], [10, 10], [11, 10]]) {
  const env = { A: a, B: b };
  const v = ['(A > 10) AND (B > 10)', 'NOT((A <= 10) OR (B <= 10))', '(NOT(A <= 10)) AND (NOT(B <= 10))'].map((x) => E.evalNode(E.parseExpr(x), { v: env, a: {} }));
  ok(`p.65 例題 2.6 第 2 題 (1)(2)(3) 結果相同（A=${a}, B=${b}）答案 D`, v[0] === v[1] && v[1] === v[2]);
}
B('p.67 測試站 2.5 第 1 題 A = B = 1（答案 B）', { A: 1, B: 1 }, { '(A > B) OR (B > A)': false, '(A > -1) AND (A = B)': true, '(A >= B) AND (B >= A)': true });
B('p.67 測試站 2.5 第 2 題 A = -2、B = 6（答案 D 為假）', { A: -2, B: 6 }, {
  '(A > B) OR ((A < -1) AND (B > 1))': true, '((A < B) OR (A > -1)) AND (B > 1)': true,
  '(A < B) OR ((A > -1) AND (B < 1))': true, '((A > B) OR (A < -1)) AND (B < 1)': false });
B('p.67 測試站 2.5 第 3 題 A = -5、B = -10、C = 0（答案 D）', { A: -5, B: -10, C: 0 }, {
  '(NOT(A > B)) OR (B > C)': false, '(A < B) AND (NOT(B < C))': false, 'NOT((A > B) OR (B < C))': false, 'NOT((A < B) AND (B > C))': true });
T('p.68 測試站 2.5 第 4 題（答案 B）', `
  A ← 11
  B ← -7
  如果 (A - B > A + B) AND (A * B < 0) 則
      A ← B + A * 2
  否則
      B ← A + B * 2
  輸出 A, B`, { out: '15 -7' });
{
  const code = `
    如果 ((NOT(age >= 20)) OR (NOT(age < 35))) AND employed = True 則
        輸出 "Other employed people"`;
  const r = [[10, false], [20, true], [35, true], [50, false]].map(([age, employed]) => outOf(code, { vars: { age, employed } }));
  ok('p.68 測試站 2.5 第 5 題 只有選項 C（35, True）有輸出', r[0] === '' && r[1] === '' && r[2] === 'Other employed people' && r[3] === '', r.join(' | '));
}
{
  const ages = [0, 15, 25, 65, 80];
  const f = (ex) => ages.filter((age) => E.evalNode(E.parseExpr(ex.replace(/X/g, '(age <= 15)').replace(/Y/g, '(age > 65)')), { v: { age }, a: {} })).join(', ');
  ok('p.69 例題 2.7 X OR Y → 0, 15, 80（答案 C）', f('X OR Y') === '0, 15, 80');
  ok('p.70 測試站 2.6 X AND Y → 沒有', f('X AND Y') === '');
  ok('p.70 測試站 2.6 NOT (X OR Y) → 25, 65', f('NOT (X OR Y)') === '25, 65');
  ok('p.70 測試站 2.6 (NOT X) AND (NOT Y) → 25, 65', f('(NOT X) AND (NOT Y)') === '25, 65');
  ok('p.70 測試站 2.6 (NOT X) OR (NOT Y) → 全部', f('(NOT X) OR (NOT Y)') === '0, 15, 25, 65, 80');
}
{
  const grid = []; for (const X of [0, 1, 2]) for (const Y of [1, 2, 3]) grid.push({ X, Y });
  const zOf = (code, v) => { const r = E.run(dd(code), { vars: v }); return r.env.v.Z === undefined ? '-' : r.env.v.Z; };
  const all = (codes) => grid.every((v) => new Set(codes.map((c) => zOf(c, v))).size === 1);
  const c1 = `
    如果 X = 1 則
        如果 Y = 2 則
            Z ← X + Y`;
  const c2 = `
    如果 Y = 2 則
        如果 X = 1 則
            Z ← Y + X`;
  const c3 = `
    如果 X = 1 AND Y = 2 則
        Z ← X + Y`;
  ok('p.71 例題 2.8 (1)(2)(3) 結果相同（答案 D）', all([c1, c2, c3]));
  const d1 = `
    如果 X = 1 OR Y = 2 則
        Z ← X + Y`;
  const d2 = `
    如果 X = 1 則
        Z ← X + Y
    否則如果 Y = 2 則
        Z ← X + Y`;
  const d3 = `
    如果 Y = 2 則
        Z ← X + Y
    否則如果 X = 1 則
        Z ← X + Y`;
  ok('p.72 測試站 2.7 第 1 題 (1)(2)(3) 結果相同（答案 D）', all([d1, d2, d3]));
  const g2 = []; for (const X of [4, 5, 6]) for (const Y of [7, 8, 9]) g2.push({ X, Y });
  const f1 = `
    如果 X > 5 OR Y <= 8 則
        Z ← Y + X`;
  const f2 = `
    如果 X > 5 則
        如果 Y <= 8 則
            Z ← X + Y`;
  const f3 = `
    如果 Y <= 8 則
        如果 X > 5 則
            Z ← X + Y`;
  const f4 = `
    如果 Y > 8 則
        輸出 ""
    否則
        如果 X <= 5 則
            輸出 ""
        否則
            Z ← X + Y`;
  const sameOn = (a, b) => g2.every((v) => zOf(a, v) === zOf(b, v));
  ok('p.72 測試站 2.7 第 2 題〔流程圖轉寫〕(2)(3) 相同、(1) 不同（答案 B）', sameOn(f2, f3) && !sameOn(f1, f2));
  ok('p.73 測試站 2.7 第 3 題〔流程圖轉寫〕兩個算法結果相同（答案：是）', sameOn(f3, f4));
}
T('p.76 for 循環輸出 1 至 10', `
  設 i 由 1 至 10
      輸出 i`, { out: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] });
ok('p.76 沒有使用 for 循環的版本相同', outOf(Array.from({ length: 10 }, (_, i) => `輸出 ${i + 1}`).join('\n')) === outOf('設 i 由 1 至 10\n    輸出 i'));
T('p.76 首五個 3 的倍數', `
  設 i 由 1 至 5
      輸出 3 * i`, { out: ['3', '6', '9', '12', '15'] });
T('p.77 活動 2.6 第 1 題 (1)', `
  設 i 由 1 至 7
      輸出 i`, { out: ['1', '2', '3', '4', '5', '6', '7'], count: { 2: 7 } });
T('p.77 活動 2.6 第 1 題 (2)', `
  設 k 由 5 至 10
      輸出 k`, { out: ['5', '6', '7', '8', '9', '10'], count: { 2: 6 } });
T('p.77 活動 2.6 第 1 題 (3)', `
  設 n 由 10 下至 0
      輸出 n`, { out: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'], count: { 2: 11 } });
T('p.77 活動 2.6 第 1 題 (4)', `
  設 d 由 20 下至 15
      輸出 "1"`, { out: ['1', '1', '1', '1', '1', '1'], count: { 2: 6 } });
ok('p.77 活動 2.6 第 2 題 (a) 對等', outOf([1, 2, 3, 4, 5, 6, 7].map((i) => `輸出 ${i} * 5`).join('\n')) === outOf('設 i 由 1 至 7\n    輸出 i * 5'));
ok('p.77 活動 2.6 第 2 題 (b) 對等', outOf([1, 2, 3, 4, 5].map((i) => `輸出 ${i} * ${i}`).join('\n')) === outOf('設 i 由 1 至 5\n    輸出 i * i'));
ok('p.77 活動 2.6 第 2 題 (c) 對等', outOf('k ← 10\nk ← k + 1\nk ← k + 1\nk ← k + 1\nk ← k + 1\n輸出 k') === outOf('k ← 10\n設 i 由 1 至 4\n    k ← k + 1\n輸出 k'));
T('p.78 活動 2.6 第 3 題', `
  設 i 由 10 下至 3
      輸出 10 * i`, { out: ['100', '90', '80', '70', '60', '50', '40', '30'] });
T('p.79 正四邊形（描述性語句）', `
  設 i 由 1 至 4
      向前畫 10 cm
      轉角 90 度`, { out: [], count: { 2: 4, 3: 4 } });
T('p.79 自訂邊數（輸入 6）', `
  輸入 L
  設 i 由 1 至 L
      向前畫 10 cm
      轉角 360/L 度`, { inputs: [6] }, { out: [], count: { 3: 6 } });
T('p.80 while 循環 100 以內 17 的倍數', `
  num ← 17
  當 num < 100
      輸出 num
      num ← num + 17`, { out: ['17', '34', '51', '68', '85'] });
T('p.80 試想想 自訂範圍和倍數（A = 100、B = 17）', `
  輸入 A, B
  num ← B
  當 num < A
      輸出 num
      num ← num + B`, { inputs: [100, 17] }, { out: ['17', '34', '51', '68', '85'] });
T('p.81 無限循環（i ← i - 1）', `
  X ← 0
  i ← 1
  當 i < 10
      輸入 Y
      X ← X + Y
      i ← i - 1
  輸出 X`, { inputs: Array(3000).fill(1) }, { err: 'loop', check: (r) => /第 3 行的循環條件「i < 10」一直成立/.test(r.error.message) && r.out.length === 0 });
T('p.81 擴闊視野 當 True', `
  當 True
      跑一圈`, { err: 'loop' });
T('p.99 常見錯誤 ✗ i ← i - 1', `
  i ← 1
  當 i < 10
      輸出 x
      i ← i - 1`, { vars: { x: 7 } }, { err: 'loop' });
T('p.99 常見錯誤 ✓ i ← i + 1', `
  i ← 1
  當 i < 10
      輸出 x
      i ← i + 1`, { vars: { x: 7 } }, { out: Array(9).fill('7') });
{
  const c = `
    num ← 1
    輸入 X
    當 num <= 5
        num ← num * X`;
  const r = (x) => E.run(dd(c), { inputs: [x] }).error;
  ok('p.82 測試站 2.8 第 1 題 X = -2 不會無限循環（答案 D）', !r(-2));
  ok('p.82 測試站 2.8 第 1 題 X = 0、1、-1 會無限循環', [0, 1, -1].every((x) => r(x) && r(x).kind === 'loop'));
}
const s28 = `
  輸入 X
  Y ← 0
  Z ← 0
  設 i 由 1 至 10
      Y ← Y + X
      輸出 Y
      Z ← Z + Y
  輸出 Z`;
T('p.83 測試站 2.8 第 2 題 X = 3（答案 B 不正確：33 不會輸出；C：最後輸出 165）', s28, { inputs: [3] }, {
  out: ['3', '6', '9', '12', '15', '18', '21', '24', '27', '30', '165'],
  check: (r) => !r.out.includes('33') && r.events.filter((e) => e.k === 'iterend').every((e) => e.snap.v.Z >= e.snap.v.Y) });
{
  const w = `
    輸入 X
    Y ← 0
    Z ← 0
    i ← 1
    當 i <= 10
        Y ← Y + X
        輸出 Y
        Z ← Z + Y
        i ← i + 1
    輸出 Z`;
  ok('p.83 測試站 2.8 第 3 題 while 版本與 for 版本輸出相同', [3, -2, 7].every((x) => outOf(w, { inputs: [x] }) === outOf(s28, { inputs: [x] })));
}
T('p.84 測試站 2.8 第 4 題 (b) 輸入 7 最後輸出 49', `
  輸入 N
  設 i 由 1 至 N
      輸出 i*i`, { inputs: [7] }, { check: (r) => r.out[r.out.length - 1] === '49' && r.out.length === 7 });
T('p.85 夾公仔機（執行…當）', `
  coins ← 0
  執行
      投下硬幣
      coins ← coins + 1
  當 coins < 5
  啟動機械夾`, { vars: { coins: 5 }, count: { 3: 5, 6: 1 } });
T('p.85 測試站 2.9「輸出 A」執行 1 次', `
  A ← 10
  執行
      A ← A - 3
      輸出 A
  當 A > 10`, { out: '7', count: { 4: 1 } });
T('p.87 猜數字（重複…直至）', `
  輸入 secret
  重複
      輸入 guess
  直至 guess = secret
  輸出 "Bingo!"`, { inputs: [5, 3, 8, 5] }, { out: 'Bingo!', count: { 3: 3 } });
T('p.87 活動 2.7 改用執行…當（guess != secret）', `
  輸入 secret
  執行
      輸入 guess
  當 guess != secret
  輸出"Bingo!"`, { inputs: [5, 3, 8, 5] }, { out: 'Bingo!', count: { 3: 3 } });
T('p.87 活動 2.7 另一答案 NOT(guess = secret)', `
  輸入 secret
  執行
      輸入 guess
  當 NOT(guess = secret)
  輸出 "Bingo!"`, { inputs: [5, 3, 8, 5] }, { out: 'Bingo!', count: { 3: 3 } });
T('p.90 測試站 2.10 第 1 題「輸出 X」0 次（答案 A；原書「如果 X < 30」沒有「則」）', `
  X ← 10
  當 X > 100
      如果 X < 30
          輸出 X
      X ← X + 10`, { out: [], count: { 4: 0 } });
{
  const mk = (c) => `
    執行
        輸入 mark
    當 ${c}`;
  const accepts = (c, m) => { const r = E.run(dd(mk(c)), { inputs: [m] }); return !r.error && r.inputsUsed.length === 1; };
  const valid = [0, 1, 50, 99, 100], bad = [-1, 101];
  const good = (c) => valid.every((m) => accepts(c, m)) && bad.every((m) => !accepts(c, m) || false);
  const okC = (c) => valid.every((m) => accepts(c, m)) && bad.every((m) => E.run(dd(mk(c)), { inputs: [m, 50] }).inputsUsed.length === 2);
  ok('p.91 測試站 2.10 第 3 題〔流程圖轉寫〕C：mark < 0 OR mark > 100 正確', okC('mark < 0 OR mark > 100'));
  ok('p.91 測試站 2.10 第 3 題 A、B、D 不正確', !okC('mark > 0 AND mark < 100') && !okC('mark >=0 AND mark <= 100') && !okC('mark <= 0 OR mark >= 100'));
  void good;
  const mk2 = (c) => `
    重複
        輸入 mark
    直至 ${c}`;
  const okB = (c) => valid.every((m) => { const r = E.run(dd(mk2(c)), { inputs: [m] }); return !r.error && r.inputsUsed.length === 1; }) && bad.every((m) => E.run(dd(mk2(c)), { inputs: [m, 50] }).inputsUsed.length === 2);
  ok('p.91 測試站 2.10 第 4 題〔流程圖轉寫〕「是／否」互換後 B 正確', okB('mark >=0 AND mark <= 100') && !okB('mark > 0 AND mark < 100') && !okB('mark < 0 OR mark > 100'));
}
T('p.91 測試站 2.10 第 5 題 找出最大的數（輸入 5, 3, 9, 2, 0）〔教科書未附數值答案〕', `
  輸入 mNum
  重複
      輸入 num
      如果 num > mNum 則
          mNum ← num
  直至 num = 0
  輸出 mNum`, { inputs: [5, 3, 9, 2, 0] }, { out: '9' });
T('p.92 測試站 2.10 第 5 題 (c) 前測循環版本', `
  輸入 num
  mNum ← num
  當 num != 0
      輸入 num
      如果 num > mNum 則
          mNum ← num
  輸出 mNum`, { inputs: [5, 3, 9, 2, 0] }, { out: '9' });
const game = `
  SecretNumber ← 一個隨機的正整數
  執行
      輸入 GuessNum
      如果 (GuessNum < SecretNumber) 則
          輸出 "數字太小了！"
      如果 (GuessNum > SecretNumber) 則
          輸出 "數字太大了！"
  當 (GuessNum <> SecretNumber)
  輸出 "你猜對了！"`;
T('p.92 測試站 2.10 第 6 題 (b) SecretNumber 38、輸入 -10', game, { vars: { SecretNumber: 38 }, inputs: [-10, 38] }, { check: (r) => r.out[0] === '數字太小了！' });
T('p.92 測試站 2.10 第 6 題 (c) SecretNumber 20：15、25、20', game, { vars: { SecretNumber: 20 }, inputs: [15, 25, 20] }, { out: ['數字太小了！', '數字太大了！', '你猜對了！'] });
const game2 = `
  SecretNumber ← 一個隨機在 1 至 100 之內的整數，包含首尾兩數
  round ← 0
  執行
      round ← round + 1
      輸入 GuessNum
      如果 (GuessNum < 1) or (GuessNum > 100) 則
          輸出 "範圍在 1 至 100 之內！"
      如果 (GuessNum < SecretNumber) 則
          輸出 "數字太小了！"
      如果 (GuessNum > SecretNumber) 則
          輸出 "數字太大了！"
  當 (GuessNum <> SecretNumber) AND ( round != 7 )
  如果 GuessNum = SecretNumber 則
      輸出 "你猜對了！"`;
T('p.93 測試站 2.10 第 6 題 (d)(iv) 輸入 200', game2, { vars: { SecretNumber: 50 }, inputs: [200, 50] }, { check: (r) => r.out[0] === '範圍在 1 至 100 之內！' && r.out[1] === '數字太大了！' });
T('p.93 測試站 2.10 第 6 題 (d)(ii) 七次都錯便結束，沒有「你猜對了！」', game2, { vars: { SecretNumber: 50 }, inputs: [1, 2, 3, 4, 5, 6, 7, 50] }, { vars: { round: 7 }, check: (r) => !r.out.includes('你猜對了！') && r.inputsUsed.length === 7 });
T('p.100 課題練習 選擇題 1（答案 B）', `
  A ← 5
  B ← 7
  A ← B - 2
  C ← B
  B ← C
  輸出 B, A, C`, { out: '7 5 7' });
T('p.100 課題練習 選擇題 2（答案 C）', `
  E ← 0
  F ← 1
  G ← 2
  E ← G × F
  F ← F + E
  G ← E × F
  輸出 G`, { out: '6' });
T('p.101 課題練習 選擇題 4（答案 C：把 A 轉成 B 的數值）〔錯誤記錄 D1-14〕', `
  輸入 A
  輸入 B
  temp ← B
  A ← temp
  B ← A`, { inputs: [3, 8] }, { vars: { A: 8, B: 8 } });
B('p.101 課題練習 選擇題 5 A = 10、Y = 20（答案 D）', { A: 10, Y: 20 }, {
  '((A > 20) OR (Y > 20)) AND (Y > A)': false, '(A > 20) OR ((Y > 20) AND (Y > A))': false,
  '(A >= 20) OR (NOT(Y = 20) AND A <> Y)': false, '(A > 20) OR (Y >= 20 AND A >= 10)': true });
T('p.101 課題練習 選擇題 6〔流程圖轉寫〕X = 10 → A', `
  輸入 X
  如果 X > 10 則
      如果 X < 20 則
          輸出 "B"
      否則
          輸出 "C"
  否則
      輸出 "A"`, { inputs: [10] }, { out: 'A' });
T('p.101 課題練習 選擇題 7（答案 A：11）', `
  A ← 5
  如果 (A > 3 AND A < 7) OR (A > 5) 則
      輸出 "1"
  否則
      輸出 "2"
  如果 A >= 5 AND A <> 0 則
      輸出 "1"
  否則
      輸出 "2"`, { outJoin: '11' });
T('p.102 課題練習 選擇題 8（答案 C）', `
  A ← 10
  j ← 4
  i ← 1
  當 i < j
      A ← A + j
      j ← j - 1
      i ← i + 1
  輸出 A`, { out: '17' });
T('p.102 課題練習 選擇題 9（答案 B；「則」在下一行）', `
  A ← 7
  B ← 5
  如果 A > 7 AND (B < 7 OR NOT(A = 7))
  則
      設 i 由 1 至 100
          temp ← B
          B ← A
          A ← temp
      輸出 B
  否則
      輸出 A`, { out: '7' });
T('p.102 課題練習 選擇題 10（答案 C）', `
  A ← 3
  B ← 1
  輸出 A
  當 B < A
      A ← A + 1
      B ← B + 2
  輸出 B`, { out: ['3', '5'] });
T('p.102 課題練習 選擇題 11（答案 B）', `
  A ← 5
  重複
      輸出 A
      A ← A - 1
  直至 A = 0`, { outJoin: '54321' });
T('p.102 課題練習 選擇題 12（答案 B）', `
  C ← 3
  D ← 3
  執行
      C ← C + 1
      D ← D + 2
  當 D < C
  輸出 D`, { out: '5' });
T('p.103 長題目 1〔教科書未附答案〕', `
  A ← 5
  B ← 7
  C ← A
  A ← B
  B ← C
  C ← (A - C) × B
  輸出 A, C, B`, { out: '7 10 5', trace: { spec: { mode: 'stmt', out: false }, rows: [['5', '', ''], ['', '7', ''], ['', '', '5'], ['7', '', ''], ['', '5', ''], ['', '', '10'], ['', '', '']] } });

// =========================== 第 3 章 ===========================
T('p.110 活動 3.1〔教科書未附答案〕', `
  X ← 2
  Y ← 3
  設 i 由 1 至 6
      如果 i < 3 則
          X ← X + 1
          Y ← X - Y
          輸出 Y
      否則
          Z ← X + Y
          X ← Z + 2
          輸出 Z`, { out: ['0', '4', '8', '14', '20', '26'] });
T('p.110 逐句追蹤表（例題 2.2 重溫）', `
  A ← 2
  B ← 5
  A ← B - A
  A ← A * B
  B ← A - B`, { trace: { spec: { mode: 'stmt' }, rows: [['2', ''], ['', '5'], ['3', ''], ['15', ''], ['', '10']] } });
T('p.111 活動 3.2 第 1 題', `
  A ← 1
  B ← 2
  C ← A + B
  輸出 C
  A ← B + C
  輸出 A
  B ← C + A
  輸出 A, B, C`, { out: ['3', '5', '5 8 3'], trace: { spec: { mode: 'stmt' }, rows: [['1', '', '', ''], ['', '2', '', ''], ['', '', '3', ''], ['', '', '', '3'], ['5', '', '', ''], ['', '', '', '5'], ['', '8', '', ''], ['', '', '', '5 8 3']] } });
T('p.111 活動 3.2 第 2 題', `
  A ← 1
  B ← 2
  C ← A * B
  A ← B + C
  B ← C + A
  輸出 A, B, C`, { out: '4 6 2' });
const fib = `
  X ← 2
  Y ← 3
  設 i 由 1 至 6
      X ← X + Y
      Y ← X - Y
      輸出 Y`;
T('p.112 for 循環追蹤表（每次循環一行）', fib, { vars: { X: 50, Y: 31 }, out: ['2', '5', '7', '12', '19', '31'], trace: { spec: { mode: 'iter', cols: ['X', 'Y'] }, rows: [['', '2', '3', ''], ['1', '5', '2', '2'], ['2', '7', '5', '5'], ['3', '12', '7', '7'], ['4', '19', '12', '12'], ['5', '31', '19', '19'], ['6', '50', '31', '31']] } });
T('p.112 逐句追蹤表首幾行（設 i ← 1 …）', fib, { check: (r) => { const t = E.buildTrace(r, { mode: 'stmt', cols: ['i', 'X', 'Y'] }); return t.rows.slice(0, 8).map((x) => x.label).join('|') === 'X ← 2|Y ← 3|設 i ← 1|X ← X + Y|Y ← X - Y|輸出 Y|設 i ← 2|X ← X + Y' && t.rows[3].cells.X.v === '5' && t.rows[4].cells.Y.v === '2'; } });
T('p.113 例題 3.1（while）', `
  X ← 4
  Y ← 3
  當 Y < 10
      Y ← X - Y
      X ← X + Y
      輸出 X`, { out: ['5', '9', '14', '23', '37'], trace: { spec: { mode: 'iter', cols: ['X', 'Y'] }, rows: [['', '4', '3', ''], ['True', '5', '1', '5'], ['True', '9', '4', '9'], ['True', '14', '5', '14'], ['True', '23', '9', '23'], ['True', '37', '14', '37'], ['False', '', '', '']] } });
T('p.114 例題 3.1 想像（後測循環）', `
  X ← 4
  Y ← 3
  執行
      Y ← X - Y
      X ← X + Y
      輸出 X
  當 Y < 10`, { out: ['5', '9', '14', '23', '37'], trace: { spec: { mode: 'iter', cols: ['X', 'Y'], condLast: true }, rows: [['4', '3', '', ''], ['5', '1', '5', 'True'], ['9', '4', '9', 'True'], ['14', '5', '14', 'True'], ['23', '9', '23', 'True'], ['37', '14', '37', 'False']] } });
T('p.114 測試站 3.1 第 1 題 (a)', `
  X ← 0
  設 k 由 1 至 5
      X ← X + k * k
  輸出 X`, { out: '55', trace: { spec: { mode: 'iter', cols: ['k * k', 'X'] }, rows: [['', '', '0', ''], ['1', '1', '1', ''], ['2', '4', '5', ''], ['3', '9', '14', ''], ['4', '16', '30', ''], ['5', '25', '55', ''], ['', '', '', '55']] } });
for (const c of ['k > 0', 'k >= 1', 'k >= 0', 'k > -1'])
  T(`p.115 測試站 3.1 第 1 題 (c) 條件「${c}」`, `
    X ← 0
    k ← 5
    當 ${c}
        X ← X + k * k
        k ← k - 1
    輸出 X`, { out: '55' });
T('p.115 測試站 3.1 第 2 題（答案 C）', `
  X ← 1
  Y ← 1
  當 X <= 10
      X ← X + 1
      Y ← Y + 2
  輸出 Y`, { out: '21' });
T('p.115 測試站 3.1 第 3 題（答案 B）', `
  X ← 1
  Y ← 3
  Z ← 0
  重複
      X ← X + Y
      Y ← X + X
      Z ← Z + 1
  直至 Y > 20
  輸出 X, Z`, { out: '12 2', trace: { spec: { mode: 'iter', cols: ['X', 'Y', 'Z'] }, rows: [['1', '3', '0', '', ''], ['4', '8', '1', 'False', ''], ['12', '24', '2', 'True', ''], ['', '', '', '', '12 2']] } });
T('p.116 測試站 3.1 第 4 題（答案 B：4 個 "Loop"）', `
  X ← 15
  Y ← 2
  當 X > Y
      X ← X + 1
      Y ← Y + Y
      輸出 "Loop"`, { out: Array(4).fill('Loop') });
T('p.116 測試站 3.1 第 5 題（答案 B）', `
  Z ← 0
  設 N 由 1 至 3
      輸入 X, Y
      Z ← Z + X * 0.6 + Y * 0.4
  輸出 Z`, { inputs: [70, 80, 50, 90, 45, 100] }, { out: '207' });
const s316 = `
  count ← 0
  輸入 X, Y
  重複
      X ← X + 10
      Y ← X - Y
      Z ← X + Y
      輸出 Y
      count ← count + 1
  直至 Z > 50
  輸出 X
  輸出 count`;
T('p.117 測試站 3.1 第 6 題 (a)–(c)〔流程圖轉寫為 (b) 的偽代碼〕', s316, { inputs: [5, 8] }, { out: ['7', '18', '17', '35', '3'], vars: { count: 3 } });
T('p.117 測試站 3.1 第 6 題 (d) 輸入 X = 1、Y = 9', s316, { inputs: [1, 9] }, { check: (r) => { const e = r.events.find((x) => x.k === 'stmt' && x.n.t === 'output'); return e && e.snap.v.Y === 2 && e.snap.v.Z === 13; } });
T('p.118 例題 3.2 第 1 題', `
  X ← 2
  Y ← 3
  設 i 由 1 至 4
      如果 i < 3 則
          X ← X * 2
          輸出 i
      否則
          Y ← Y * 2
          Z ← X + Y
  輸出 Z`, { out: ['1', '2', '20'], trace: { spec: { mode: 'iter', cols: ['X', 'Y', 'Z'] }, rows: [['', '', '2', '3', '', ''], ['1', 'True', '4', '', '', '1'], ['2', 'True', '8', '', '', '2'], ['3', 'False', '', '6', '14', ''], ['4', 'False', '', '12', '20', ''], ['', '', '', '', '', '20']] } });
T('p.119 例題 3.2 第 2 題〔流程圖轉寫〕', `
  X ← 1
  Y ← 2
  Z ← 0
  當 X < 40
      X ← Y + Y
      Y ← X + 1
      Z ← Z + 1
  如果 Y > 50 則
      輸出 X
  否則
      輸出 Y`, { out: '47', vars: { X: 46, Y: 47, Z: 4 } });
T('p.120 測試站 3.2 第 1 題（答案 D）', `
  輸入 X, Y
  設 N 由 1 至 4
      如果 N < 3 則
          輸出 N + 1
      否則
          Z ← X + Y
          Y ← Y + X
          X ← Z
          輸出 Z`, { inputs: [1, 2] }, { out: ['2', '3', '3', '6'] });
T('p.120 測試站 3.2 第 2 題（答案 C；「否則如果」沒有「則」）', `
  輸入 X, Y
  設 N 由 1 至 6
      如果 N <= 2 則
          輸出 X
      否則如果 N <= 4
          Y ← X + Y
          輸出 Y
      否則
          X ← Y + 2
          輸出 X`, { inputs: [1, 2] }, { out: ['1', '1', '3', '4', '6', '6'], trace: { spec: { mode: 'iter', cols: ['X', 'Y'] }, rows: [['', '', '', '1', '2', ''], ['1', 'True', '', '', '', '1'], ['2', 'True', '', '', '', '1'], ['3', 'False', 'True', '', '3', '3'], ['4', 'False', 'True', '', '4', '4'], ['5', 'False', 'False', '6', '', '6'], ['6', 'False', 'False', '', '', '6']] } });
T('p.121 測試站 3.2 第 3 題（答案 A）', `
  X ← 20
  Y ← 11
  當 X > Y
      X ← X - 2
      如果 X - Y > 2 則
          Y ← Y + 2
  輸出 X
  輸出 Y`, { out: ['14', '15'], trace: { spec: { mode: 'iter', cols: ['X', 'Y'], out: false }, rows: [['', '', '20', '11'], ['True', 'True', '18', '13'], ['True', 'True', '16', '15'], ['True', 'False', '14', ''], ['False', '', '', ''], ['', '', '', '']] } });
T('p.121 測試站 3.2 第 4 題（答案 B；循環體用「=」賦值〔錯誤記錄 D1-19〕）', `
  P ← 4
  Q ← 15
  R ← 1
  當 Q > P
      如果 Q > R AND R < 3 則
          P = P + R
      否則
          P = P + P
      R = R + 1
  輸出 P`, { out: '28', check: (r) => r.parsed.warnings.length === 3 });
T('p.124 存取陣列項目', `
  age[3] ← 16
  age[9] ← age[3] + 1`, { check: (r) => r.env.a.age[9] === 17 && r.env.a.age[3] === 16 });
T('p.124 一次過賦值；p.122 試想想 age[6] = 28；p.163 age[4] = 55', `
  age[] ← [8, 21, 16, 55, 80, 28, 49, 52, 17, 25]
  輸出 age[6]
  輸出 age[4]`, { out: ['28', '55'] });
T('p.123 字串當作字符陣列：word[1] = W、word[5] 為空白、word[10] = !', `
  word ← "Work Hard!"
  輸出 word[1]
  輸出 "(" + word[5] + ")"
  輸出 word[10]`, { out: ['W', '( )', '!'] });
T('p.125 for 循環為陣列賦值及輸出', `
  設 i 由 1 至 10
      num[i] ← i * 10
  設 k 由 1 至 10
      輸出 num[k]`, { out: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'] });
T('p.125 活動 3.3 第 1 題 (1)', `
  設 i 由 1 至 5
      num[i] ← i`, { arrs: { num: [1, 2, 3, 4, 5] } });
T('p.125 活動 3.3 第 1 題 (2)', `
  num[] ← [2, 4, 6, 8, 10]
  設 k 由 1 至 5
      num[k] ← num[k] + 50`, { arrs: { num: [52, 54, 56, 58, 60] } });
T('p.125 活動 3.3 第 1 題 (3)', `
  num[1] ← 1
  設 k 由 2 至 7
      num[k] ← num[k-1] + 2`, { arrs: { num: [1, 3, 5, 7, 9, 11, 13] } });
T('p.126 活動 3.3 第 2 題 (i) 輸出整個陣列', `
  count[] ← [1, 0, 0, 1, 1]
  設 i 由 1 至 5
      count[i] ← count[i] * 10
  輸出 count`, { check: (r) => r.out[0] === '[10, 0, 0, 10, 10]' });
T('p.126 活動 3.3 第 2 題 (ii)', `
  num[] ← [5, 10, 15, 20, 25, 30, 35]
  total ← 0
  avg ← 0
  設 N 由 1 至 7
      total ← total + num[N]
  avg ← total / 7
  輸出 total
  輸出 avg`, { out: ['140', '20'] });
T('p.126 活動 3.3 第 2 題 (iii)', `
  num[] ← [15, 20, 10, 20, 25]
  weight[] ← [1, 2, 2, 1, 3]
  設 k 由 1 至 5
      score[k] ← num[k] * weight[k]
  輸出 score`, { check: (r) => r.out[0] === '[15, 40, 20, 20, 75]' });
T('p.126 活動 3.3 第 2 題 (iv)', `
  AR[] ← [10, 20, 40, 80, 160]
  r ← 0
  設 k 由 3 至 5
      r ← r + AR[k]
  輸出 r`, { out: '280' });
T('p.127 例題 3.3 第 1 題（輸出 135；陣列大小 100）', `
  N ← 1
  當 N <= 100
      num[N] ← N * 3
      N ← N + 1
  輸出 num[3] * num[5]`, { out: '135', check: (r) => Object.keys(r.env.a.num).length === 100 && r.env.a.num[100] === 300 });
T('p.128 例題 3.3 第 2 題（輸出 2；原書「R = R + 1」〔錯誤記錄 D1-21〕）', `
  R ← 0
  設 i 由 1 至 5
      如果 AR[i] > 10
          R = R + 1
  輸出 R`, { arrays: { AR: [20, 5, 3, 10, 15] } }, { out: '2', trace: { spec: { mode: 'iter', cols: ['AR[i]', 'R'], out: false }, rows: [['', '', '', '0'], ['1', 'True', '20', '1'], ['2', 'False', '5', ''], ['3', 'False', '3', ''], ['4', 'False', '10', ''], ['5', 'True', '15', '2'], ['', '', '', '']] } });
T('p.129 測試站 3.3 第 1 題（答案 C）', `
  F[1] ← 1
  F[2] ← 1
  設 N 由 3 至 10
      F[N] ← F[N-2] + F[N-1]
  輸出 F[7]`, { out: '13', check: (r) => [1, 1, 2, 3, 5, 8, 13].every((v, j) => r.env.a.F[j + 1] === v) });
T('p.129 測試站 3.3 第 2 題（答案 D）', `
  A[1] ← 10
  設 i 由 1 至 7
      A[i+1] ← A[i] + i
  輸出 A[5] - A[4]`, { out: '4', check: (r) => [10, 11, 13, 16, 20].every((v, j) => r.env.a.A[j + 1] === v) });
T('p.129 測試站 3.3 第 3 題（答案 C）', `
  diff ← 3
  index ← 1
  當 diff < 19
      num[index] ← diff + 1
      輸出 num[index]
      diff ← diff + 4
      index ← index + 1`, { out: ['4', '8', '12', '16'] });
T('p.130 測試站 3.3 第 4–5 題〔流程圖轉寫〕P[5] 最大（D），最大值 12（C）', `
  j ← 1
  P[j] ← 1
  當 j < 5
      如果 P[j] < 5 則
          P[j+1] ← P[j] * 3
      否則
          P[j+1] ← P[j] - 5
      j ← j + 1`, { arrs: { P: [1, 3, 9, 4, 12] } });
const neg = `
  設 k 由 1 至 5
      AR[k] ← AR[k] * (-1)`;
T('p.131 測試站 3.3 第 6 題 (a)(i)', neg, { arrays: { AR: [1, -1, 1, -1, 1] } }, { arrs: { AR: [-1, 1, -1, 1, -1] } });
T('p.131 測試站 3.3 第 6 題 (a)(ii) 初始內容', neg, { arrays: { AR: [1, 1, -1, -1, -1] } }, { arrs: { AR: [-1, -1, 1, 1, 1] } });
const chk7 = `
  check ← 0
  設 K 由 1 至 5
      如果 AR[K] = -1 則
          check ← 1
      如果 check = 1 則
          AR[K] ← AR[K] * (-1)`;
T('p.132 測試站 3.3 第 7 題 (a)(i)', chk7, { arrays: { AR: [1, -1, 1, -1, 1] } }, { arrs: { AR: [1, 1, -1, 1, -1] } });
T('p.132 測試站 3.3 第 7 題 (a)(ii) 再運行一次', chk7, { arrays: { AR: [1, 1, -1, 1, -1] } }, { arrs: { AR: [1, 1, 1, -1, 1] } });
T('p.132 測試站 3.3 第 7 題 (b) 初始內容', chk7, { arrays: { AR: [-1, -1, -1, 1, 1] } }, { arrs: { AR: [1, 1, 1, -1, -1] } });
T('p.132 測試站 3.3 第 7 題 (c) 內容不變', chk7, { arrays: { AR: [1, 1, 1, 1, 1] } }, { arrs: { AR: [1, 1, 1, 1, 1] } });
const profit = [-500, 0, 5000, 10000, 25000, 200000, 1250000];
ok('p.133 測試站 3.3 第 8 題 (a) 2016 至 2019 年總盈利 240000', profit.slice(2, 6).reduce((a, b) => a + b) === 240000);
const prof = (f, l) => `
  first ← ${f}
  last ← ${l}
  total ← 0
  設 k 由 first 到 last
      total ← total + profit[k]
  輸出 total
  輸出 total / (last - first + 1)`;
T('p.133 測試站 3.3 第 8 題 (b)(e) first 1、last 7（「到」〔錯誤記錄 D1-22〕）', prof(1, 7), { arrays: { profit } }, { out: [String(profit.reduce((a, b) => a + b)), '212785.7143'] });
T('p.133 測試站 3.3 第 8 題 (c) 2015 至 2018 年：first 2、last 5', prof(2, 5), { arrays: { profit } }, { check: (r) => r.out[0] === String(0 + 5000 + 10000 + 25000) });
T('p.133 測試站 3.3 第 8 題 (d) first 5、last 7 即 2018 至 2020', prof(5, 7), { arrays: { profit } }, { check: (r) => r.out[0] === String(25000 + 200000 + 1250000) });
const ls1 = `
  輸入 target
  found ← False
  設 i 由 1 至 10
      如果 target = height[i]
          found ← True
  輸出 found`;
T('p.134 線性檢索 輸入 175 → True', ls1, { arrays: { height: H10 }, inputs: [175] }, { out: 'True' });
T('p.134 線性檢索 輸入 140 → False', ls1, { arrays: { height: H10 }, inputs: [140] }, { out: 'False' });
T('p.134 試想想 輸入 150 → True', ls1, { arrays: { height: H10 }, inputs: [150] }, { out: 'True' });
const ls2 = `
  輸入 target
  found ← False
  i ← 1
  當 i <= 10
      如果 target = height[i]
          found ← True
      i ← i + 1
  輸出 found`;
ok('p.135 活動 3.4 第 1 題 while 版本結果相同', [175, 140, 150, 155, 172.2].every((t) => outOf(ls1, { arrays: { height: H10 }, inputs: [t] }) === outOf(ls2, { arrays: { height: H10 }, inputs: [t] })));
const dax = `
  輸入 target
  設 i 由 1 至 10
      如果 target = height[i]
          found ← True
      否則
          found ← False
  輸出 found`;
T('p.135 活動 3.4 第 2 題 大雄的算法：175 存在卻輸出 False（邏輯錯誤）', dax, { arrays: { height: H10 }, inputs: [175] }, { out: 'False' });
T('p.135 活動 3.4 第 2 題 只能判斷最後一項（155 → True）', dax, { arrays: { height: H10 }, inputs: [155] }, { out: 'True' });
const ex34 = `
  輸入 target
  found ← False
  index ← -1
  i ← 1
  當 i <= 10 AND found = False
      如果 target = height[i]
          found ← True
          index ← i
      i ← i + 1
  輸出 index`;
T('p.136 例題 3.4 第 1 題 175 → 6', ex34, { arrays: { height: H10 }, inputs: [175] }, { out: '6' });
T('p.136 例題 3.4 第 1 題 140 → -1', ex34, { arrays: { height: H10 }, inputs: [140] }, { out: '-1' });
const member = [1456, 1530, 2630, 3160, 4604, 5420, 7082, 8652, 9320, 9432];
const ex34b = `
  輸入 target
  found ← False
  index ← -1
  i ← 1
  當 i <= 10 AND found = False AND member[i] <= target
      如果 target = member[i]
          found ← True
          index ← i
      i ← i + 1
  輸出 index`;
T('p.138 例題 3.4 第 2 題 (c)(i) 4604 → 5，循環體 5 次', ex34b, { arrays: { member }, inputs: [4604] }, { out: '5', count: { 6: 5 } });
T('p.138 例題 3.4 第 2 題 (c)(ii) 4000 → -1，循環體 4 次', ex34b, { arrays: { member }, inputs: [4000] }, { out: '-1', count: { 6: 4 } });
T('p.138 例題 3.4 第 2 題 (c)(iii) 1234 → -1，循環體 0 次', ex34b, { arrays: { member }, inputs: [1234] }, { out: '-1', count: { 6: 0 } });
T('p.138 想像 由大至小排列：條件 target <= member[i]', ex34b.replace('member[i] <= target', 'target <= member[i]'), { arrays: { member: member.slice().reverse() }, inputs: [4000] }, { out: '-1', count: { 6: 6 } });
const cnt = `
  輸入 bound
  count ← 0
  設 k 由 1 至 10
      如果 height[k] > bound
          count ← count + 1
  輸出 count`;
T('p.139 點算 輸入 170 → 3', cnt, { arrays: { height: H10 }, inputs: [170] }, { out: '3' });
T('p.139 試想想 輸入 190 → 0', cnt, { arrays: { height: H10 }, inputs: [190] }, { out: '0' });
T('p.139 測試站 3.4 低於平均分的人數〔教科書未附數值答案〕', `
  mark ← [56, 90, 85, 87, 66]
  avg_mark ← 76.8
  count ← 0
  設 i 由 1 至 5
      如果 mark[i] < avg_mark
          count ← count + 1
  輸出 count`, { out: '2' });
const tall = (r) => `
  tallest ← height[1]
  設 i 由 ${r} 至 10
      如果 height[i] > tallest
          tallest ← height[i]
  輸出 tallest`;
T('p.140 找出最高身高 → 188', tall(2), { arrays: { height: H10 } }, { out: '188' });
T('p.141 試想想 改成由 1 至 10 仍然正確', tall(1), { arrays: { height: H10 } }, { out: '188' });
T('p.141 試想想 最矮身高', `
  shortest ← height[1]
  設 i 由 2 至 10
      如果 height[i] < shortest
          shortest ← height[i]
  輸出 shortest`, { arrays: { height: H10 } }, { out: '150' });
const srt = `
  sorted_list ← True
  設 i 由 1 至 9
      如果 height[i] > height[i+1]
          sorted_list ← False
  輸出 sorted_list`;
T('p.142 檢查次序：已排序 → True', srt, { arrays: { height: HS } }, { out: 'True' });
T('p.143 檢查次序：索引 2、3 對調 → False', srt, { arrays: { height: [150, 155, 152.3, 160, 165, 168.5, 170, 172.2, 175, 188] } }, { out: 'False' });
const srtW = `
  sorted_list ← True
  i ← 1
  當 i <= 9 AND sorted_list = True
      如果 height[i] > height[i+1]
          sorted_list ← False
      i ← i + 1
  輸出 sorted_list`;
T('p.144 活動 3.5 while 版本（未排序時提早停止）', srtW, { arrays: { height: [150, 155, 152.3, 160, 165, 168.5, 170, 172.2, 175, 188] } }, { out: 'False', count: { 4: 2 } });
T('p.144 活動 3.5 while 版本（已排序）', srtW, { arrays: { height: HS } }, { out: 'True' });
T('p.144 測試站 3.5 由大至小檢查（7 項〔錯誤記錄 D1-23〕）', `
  weight ← [30.5, 29.6, 29.1, 28.8, 28.1, 27.3, 26.9]
  sorted_list ← True
  設 i 由 1 至 6
      如果 weight[i] < weight[i+1]
          sorted_list ← False
  輸出 sorted_list`, { out: 'True' });
T('p.146 刪除陣列項目（P = 5）', `
  L ← 10
  輸入 P
  設 i 由 P 至 L-1
      height[i] ← height[i+1]
  L ← L - 1`, { arrays: { height: H10 }, inputs: [5] }, { vars: { L: 9 }, arrs: { height: [172.2, 152.3, 165, 170, 175, 188, 160, 150, 155] } });
T('p.147 試想想 由 P 至 L 會讀取不存在的 height[11]（運行時錯誤）', `
  L ← 10
  輸入 P
  設 i 由 P 至 L
      height[i] ← height[i+1]`, { arrays: { height: H10 }, inputs: [5] }, { err: 'height[11] 未有值' });
T('p.148 加入陣列項目（H = 168、P = 3）', `
  L ← 9
  輸入 H, P
  L ← L + 1
  設 i 由 L 下至 P+1
      height[i] ← height[i-1]
  height[P] ← H`, { arrays: { height: [172.2, 152.3, 165, 170, 175, 188, 160, 150, 155] }, inputs: [168, 3] }, { arrs: { height: [172.2, 152.3, 168, 165, 170, 175, 188, 160, 150, 155] } });
T('p.149 試想想 改成由 P+1 至 L：項目 3 至 10 全是同一數值〔錯誤記錄 D1-26：原書印「3 至 11」〕', `
  L ← 9
  輸入 H, P
  L ← L + 1
  設 i 由 P+1 至 L
      height[i] ← height[i-1]`, { arrays: { height: [172.2, 152.3, 165, 170, 175, 188, 160, 150, 155] }, inputs: [168, 3] }, { arrs: { height: [172.2, 152.3, 165, 165, 165, 165, 165, 165, 165, 165] } });
T('p.150 活動 3.6 第 1 行（由 6 下至 3）', `
  num[] ← [1, 2, 3, 4, 5, 6]
  設 i 由 6 下至 3
      num[i] ← num[i-1]`, { arrs: { num: [1, 2, 2, 3, 4, 5] } });
T('p.150 活動 3.6 第 1 行（沒有 for 循環）', `
  num[] ← [1, 2, 3, 4, 5, 6]
  num[6] ← num[5]
  num[5] ← num[4]
  num[4] ← num[3]
  num[3] ← num[2]`, { arrs: { num: [1, 2, 2, 3, 4, 5] } });
T('p.150 活動 3.6 第 2 行（由 3 至 6）', `
  num[] ← [1, 2, 3, 4, 5, 6]
  設 i 由 3 至 6
      num[i] ← num[i-1]`, { arrs: { num: [1, 2, 2, 2, 2, 2] } });
T('p.150 活動 3.6 第 2 行（沒有 for 循環）', `
  num[] ← [1, 2, 3, 4, 5, 6]
  num[3] ← num[2]
  num[4] ← num[3]
  num[5] ← num[4]
  num[6] ← num[5]`, { arrs: { num: [1, 2, 2, 2, 2, 2] } });
const HS166 = [150, 152.3, 155, 160, 165, 166, 168.5, 170, 172.2, 175, 188];
T('p.152 例題 3.5 插入 166 並保持次序', `
  found ← False
  index ← 11
  i ← 1
  當 i <= 10 AND found = False
      如果 166 < height[i]
          found ← True
          index ← i
      i ← i + 1
  L ← 11
  設 i 由 L 下至 index+1
      height[i] ← height[i-1]
  height[index] ← 166`, { arrays: { height: HS } }, { vars: { index: 6 }, arrs: { height: HS166 } });
T('p.152 例題 3.5 想像 2（N 位同學、身高 H）', `
  found ← False
  index ← N + 1
  i ← 1
  當 i <= N AND found = False
      如果 height[i] > H
          found ← True
          index ← i
      i ← i + 1
  N ← N + 1
  設 i 由 N 下至 index+1
      height[i] ← height[i-1]
  height[index] ← H`, { arrays: { height: HS }, vars: { N: 10, H: 166 } }, { vars: { N: 11 }, arrs: { height: HS166 } });
const songsM = Array.from({ length: 10 }, (_, i) => 'M' + (i + 1));
const mv = `
  輸入 K
  temp ← songs[K]
  設 i 由 K 下至 2
      songs[i] ← songs[i-1]
  songs[1] ← temp`;
T('p.154 調動項目 K = 6', mv, { arrays: { songs: songsM }, inputs: [6] }, { arrs: { songs: ['M6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M8', 'M9', 'M10'] } });
T('p.155 調動項目 K = 7', mv, { arrays: { songs: songsM }, inputs: [7] }, { arrs: { songs: ['M7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9', 'M10'] } });
T('p.155 承上題再輸入 3', mv, { arrays: { songs: ['M7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9', 'M10'] }, inputs: [3] }, { arrs: { songs: ['M2', 'M7', 'M1', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9', 'M10'] } });
T('p.156 測試站 3.6 第 1 題 添加字串到 X 位置（答案 B；AR[X] = "000234" 用「=」）', `
  輸入 X
  k ← N
  當 k >= X AND X < N + 1
      AR[k+1] ← AR[k]
      k ← k - 1
  AR[X] = "000234"`, { arrays: { AR: [1, 2, 3, 4, 5] }, vars: { N: 5 }, inputs: [2] }, { arrs: { AR: [1, '000234', 2, 3, 4, 5] } });
T('p.156 測試站 3.6 第 2 題 點算與 target 相同的項目（答案 B）', `
  輸入 target
  C ← 0
  K ← 1
  當 K <= N
      如果 AR[K] = target
          C ← C + 1
      K ← K + 1
  輸出 C`, { arrays: { AR: [3, 1, 3, 3, 2] }, vars: { N: 5 }, inputs: [3] }, { out: '3' });
T('p.157 活動 3.7 第 1 題 身高 100 不能乘坐（邏輯錯誤）', `
  輸入 height
  如果 height > 100 則
      輸出 "歡迎乘坐過山車"
  否則
      輸出 "不能乘坐過山車"`, { inputs: [100] }, { out: '不能乘坐過山車' });
T('p.157 活動 3.7 第 1 題 改成 >= 後正確', `
  輸入 height
  如果 height >= 100 則
      輸出 "歡迎乘坐過山車"
  否則
      輸出 "不能乘坐過山車"`, { inputs: [100] }, { out: '歡迎乘坐過山車' });
{
  const c = (op) => `
    輸入 mark
    如果 mark >= 50 ${op} mark <=100 則
        輸出 "升班"
    否則
        輸出 "留級"`;
  ok('p.157 活動 3.7 第 2 題 OR：永遠成立', [0, 20, 49, 50, 100].every((m) => outOf(c('OR'), { inputs: [m] }) === '升班'));
  ok('p.157 活動 3.7 第 2 題 改成 AND 正確', outOf(c('AND'), { inputs: [20] }) === '留級' && outOf(c('AND'), { inputs: [50] }) === '升班');
}
T('p.157 活動 3.7 第 3 題 前測循環：未輸入便判斷條件', `
  當 num < 0
      輸入 num`, { inputs: [5] }, { err: 'num 未有值' });
T('p.157 活動 3.7 第 4 題 用了「<」會找出最小值', `
  highest_price ← price[1]
  設 i 由 2 至 30
      如果 price[i] < highest_price 則
          highest_price ← price[i]
  輸出 highest_price`, { arrays: { price: Array.from({ length: 30 }, (_, i) => ((i * 37) % 101) + 5) } }, { check: (r) => Number(r.out[0]) === Math.min(...Array.from({ length: 30 }, (_, i) => ((i * 37) % 101) + 5)) });
T('p.158 活動 3.7 第 5 題 i 不變導致無限循環', `
  lowest_price ← price[1]
  i ← 1
  當 i <= 30
      如果 price[i] < lowest_price 則
          lowest_price ← price[i]
  輸出 lowest_price`, { arrays: { price: Array(30).fill(9) } }, { err: 'loop' });
const s37 = (c) => `
  smallest ← AR[1]
  k ← 1
  當 ${c}
      如果 smallest > AR[k]
          smallest ← AR[k]
      k ← k + 1
  輸出 smallest`;
T('p.158 測試站 3.7 k < N 沒有比較 AR[N]', s37('k < N'), { arrays: { AR: [5, 4, 3, 2, 1] }, vars: { N: 5 } }, { out: '2' });
T('p.158 測試站 3.7 改成 k <= N', s37('k <= N'), { arrays: { AR: [5, 4, 3, 2, 1] }, vars: { N: 5 } }, { out: '1' });
T('p.166 課題練習 選擇題 1（答案 C）', `
  A ← 19
  B ← 3
  重複
      A ← A - B
      輸出 "1"
  直至 B > A`, { outJoin: '111111' });
T('p.166 課題練習 選擇題 3（答案 C）', `
  A[2] ← 10
  A[1] ← 5
  A[3] ← A[2] - A[1] - 2
  A[4] ← A[3] + A[1]
  輸出 A[4]`, { out: '8' });
T('p.166 課題練習 選擇題 4（答案 C）', `
  sum ← 0
  A[] ← [5, 2, 45, 17, 33]
  設 i 由 1 至 4
      sum ← sum + A[i]
  輸出 sum`, { out: '69' });
T('p.166 課題練習 選擇題 5（答案 D：59）', `
  A[] ← [4, 5, 5, 3, 8, 9, 5, 6, 8]
  target ← 8
  index ← -1
  設 i 由 1 至 9
      如果 A[i] = target 則
          index ← i
          輸出 index`, { outJoin: '59' });
T('p.167 課題練習 選擇題 6（答案 C：刪除第一個數值）', `
  num[] ← [13, 20, 21, 27]
  設 i 由 1 至 3
      num[i] ← num[i+1]
  num[4] ← 0`, { arrs: { num: [20, 21, 27, 0] } });
T('p.167 課題練習 選擇題 7（答案 D）', `
  L ← 5
  輸入 X
  設 i 由 X 至 L-1
      record[i] ← record[i + 1]
  L ← L - 1`, { arrays: { record: [1, 2, 3, 4, 5] }, inputs: [2] }, { arrs: { record: [1, 3, 4, 5] }, vars: { L: 4 } });
T('p.167 課題練習 選擇題 8（答案 D：對調 num[A] 和 num[B]）', `
  輸入 A
  輸入 B
  num[] ← [12, 15, 26, 34]
  temp ← num[B]
  num[B] ← num[A]
  num[A] ← temp`, { inputs: [1, 3] }, { vars: { A: 1, B: 3 }, arrs: { num: [26, 15, 12, 34] } });
{
  const pass50 = (s) => s >= 50;
  const scores = [0, 30, 49, 50, 51, 80, 100];
  const opts = { A: 'score <= 50', B: 'score = 50 OR score < 50', C: 'NOT(score <> 50) OR score > 50', D: '(NOT(score <> 50)) AND score > 50' };
  const right = Object.entries(opts).filter(([, ex]) => scores.every((s) => E.evalNode(E.parseExpr(ex), { v: { score: s }, a: {} }) === pass50(s))).map(([k]) => k);
  ok('p.167 課題練習 選擇題 10（答案 C）', right.join('') === 'C', right.join(''));
  ok('p.167 課題練習 選擇題 9（答案 B：第 2 行 score > 50 令 50 分不合格）', outOf('輸入 score\n如果 score > 50 則\n    輸出 "Pass"\n如果 score < 50 則\n    輸出 "Fail"', { inputs: [50] }) === '');
}
T('p.168 長題目 2 (a)〔教科書未附答案〕', `
  設 i 由 1 至 4
      A[i] ← 1 - A[i]`, { arrays: { A: [0, 1, 0, 0] } }, { arrs: { A: [1, 0, 1, 1] } });
T('p.169 長題目 3 (a) target = 60〔教科書未附答案〕', `
  num[] ← [51, 54, 55, 60, 60, 60, 78, 81, 90, 93]
  輸入 target
  index ← 0
  i ← 1
  當 i <= 10
      如果 target = num[i]
          index ← i
          輸出 index
      i ← i + 1`, { inputs: [60] }, { out: ['4', '5', '6'] });
T('p.170 長題目 4 (a) 輸入 4 便可升序排列〔教科書未附答案〕', `
  輸入 X
  temp ← num[X]
  設 i 由 X 下至 2
      num[i] ← num[i-1]
  num[1] ← temp`, { arrays: { num: [22, 35, 44, 11, 57] }, inputs: [4] }, { arrs: { num: [11, 22, 35, 44, 57] } });
T('p.170 長題目 5 sum 沒有初始值〔錯誤記錄 D1-29〕', `
  i ← 1
  設 j 由 1 至 5
      輸入 num[j]
  當 i <= 5
      sum ← sum + num[i]
      i ← i - 1
  輸出 sum`, { inputs: [1, 2, 3, 4, 5] }, { err: '第 5 行：變量 sum 未有值' });

// =========================== 引擎本身 ===========================
T('引擎：「=<」報錯（p.48 常見錯誤）', '如果 mark =< 50 則\n    輸出 1', { parseErr: '「=<」應寫作「<=」' });
T('引擎：缺少「直至」', '重複\n    A ← 1\nB ← 2', { parseErr: '「重複」缺少' });
T('引擎：「否則」沒有對應的「如果」', 'A ← 1\n否則\n    A ← 2', { parseErr: '「否則」前面沒有對應的「如果」' });
T('引擎：嚴格模式下缺少「則」', '如果 A > 1\n    A ← 2', { strict: true }, { parseErr: '第 1 行：「如果」後面缺少「則」' });
T('引擎：縮排不正確', 'A ← 1\n    B ← 2', { parseErr: '第 2 行：縮排不正確' });
T('引擎：次方符號', 'bmi ← w / h^2', { parseErr: '平方請寫成' });
T('引擎：除以 0', 'A ← 0\nB ← 5 / A', { err: '第 2 行' });
T('引擎：輸入不足', '輸入 A, B', { inputs: [1] }, { err: '沒有數據' });
T('引擎：全形符號及 <-', 'A <- 3\nB ← （A ＋ 1）× 2\n輸出 A，B', { out: '3 8' });
T('引擎：大小寫 and／or／not、true', 'A ← true\n如果 not(A = False) and (1 < 2 or 1 > 2) 則\n    輸出 "ok"', { out: 'ok' });
T('引擎：NOT > AND > OR', 'X ← False\nY ← True\nZ ← False\n輸出 NOT X OR Y AND Z', { out: 'True' });
T('引擎：≤ ≥ ≠', '輸出 3 ≤ 3, 4 ≥ 5, 1 ≠ 2', { out: 'True False True' });
T('引擎：調用模組', '輸入 weight, height\n調用 計算BMI\n輸出 weight', { inputs: [60, 1.7] }, { out: '60' });
T('引擎：實數除法顯示', '輸出 7 / 2, 6 / 3, 10 / 3, 0.1 + 0.2', { out: '3.5 2 3.3333 0.3' });
{
  const fc = E.flowchart(dd(fib));
  ok('引擎：流程圖產生 SVG（菱形、處理、輸出、開始／結束）', /<svg/.test(fc.svg) && (fc.svg.match(/fc-dec/g) || []).length === 1 && /fc-term/.test(fc.svg) && /fc-io/.test(fc.svg));
  const r = E.run(dd(fib));
  const st = E.flowState(r.path);
  const keys = new Set([...fc.svg.matchAll(/data-k="([^"]*)"/g)].flatMap((m) => m[1].replace(/&gt;/g, '>').split(' ')));
  ok('引擎：流程圖路線與執行路徑對應', [...st.pairs].every((p) => keys.has(p)), [...st.pairs].filter((p) => !keys.has(p)).join(', '));
  for (const code of [grade3, ex25, game2, s316, ex34b, srtW]) {
    const parsed = E.parseProgram(dd(code));
    const f2 = E.flowchart(parsed);
    const ks = new Set([...f2.svg.matchAll(/data-k="([^"]*)"/g)].flatMap((m) => m[1].replace(/&gt;/g, '>').split(' ')));
    const rr = E.run(parsed, { inputs: [50, 60, 7, 8, 9, 1], vars: { SecretNumber: 50 }, arrays: { member, height: HS } });
    const pp = [...E.flowState(rr.path).pairs].filter((p) => !ks.has(p));
    ok('引擎：流程圖路線對應（' + dd(code).split('\n')[0] + '…）', pp.length === 0, pp.join(', '));
  }
}

console.log(`\nD1 引擎測試：${pass} 項通過，${fail} 項失敗`);
if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
