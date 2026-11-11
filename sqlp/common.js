/* 選修A SQL 自學平台 共用框架（移植自 d1/common.js）：登記、進度、計分、HMAC 報告、老師 PIN、
 * 學／試／練／寫SQL／小測／無限練習元件、SQL 控制台（編輯器＋執行＋結果表＋數據表＋DML 高亮）、ER 圖、FD 題。
 * 需要先載入 engine.js（window.SQLE）。Node（build.js）亦可載入：global.window = {SQLE}。
 */
(function () {
  'use strict';
  const E = window.SQLE;
  const FDX = E.FDX;
  const SQ = (window.SQ = window.SQ || {});
  const hasDoc = typeof document !== 'undefined';

  // ---------------- 小工具 ----------------
  function h(sel, attrs, ...kids) {
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, n) => { if (t === '.') el.classList.add(n); else el.id = n; });
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const mdEl = (tag, s, attrs) => h(tag, Object.assign({ html: md(s) }, attrs || {}));
  const LET = 'ABCDEFGH';
  const store = {
    ok: true,
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { this.ok = false; return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { this.ok = false; return false; } },
  };
  try { const t = '__sqt'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { store.ok = false; }
  SQ.h = h; SQ.md = md; SQ.store = store;

  // ---------------- SHA-256／HMAC ----------------
  function sha256(bytes) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
    m.set(bytes); m[l] = 0x80; const bl = l * 8; for (let i = 0; i < 4; i++) m[n - 1 - i] = (bl >>> (8 * i)) & 255; m[n - 5] = Math.floor(bl / 2 ** 32) & 255;
    const w = new Uint32Array(64), r = (x, s) => (x >>> s) | (x << (32 - s));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + 4 * i] << 24) | (m[o + 4 * i + 1] << 16) | (m[o + 4 * i + 2] << 8) | m[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, b, c, d, e, f, g, hh] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [a, b, c, d, e, f, g, hh].map((x, i) => (x + H[i]) | 0);
    }
    const out = new Uint8Array(32); H.forEach((x, i) => { out[4 * i] = x >>> 24; out[4 * i + 1] = (x >>> 16) & 255; out[4 * i + 2] = (x >>> 8) & 255; out[4 * i + 3] = x & 255; });
    return out;
  }
  const utf8 = (s) => new TextEncoder().encode(s);
  function hmacHex(key, msg) {
    let k = utf8(key); if (k.length > 64) k = sha256(k);
    const kk = new Uint8Array(64); kk.set(k);
    const ip = kk.map((x) => x ^ 0x36), op = kk.map((x) => x ^ 0x5c), mb = utf8(msg);
    const inner = new Uint8Array(64 + mb.length); inner.set(ip); inner.set(mb, 64);
    const ih = sha256(inner); const outer = new Uint8Array(96); outer.set(op); outer.set(ih, 64);
    return Array.from(sha256(outer), (x) => x.toString(16).padStart(2, '0')).join('');
  }
  const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);
  SQ.hmacHex = hmacHex; SQ.canon = canon;
  SQ.signReport = (rep, key) => hmacHex(key, canon(rep));
  SQ.verifyReport = (rep, key) => { const r = Object.assign({}, rep); const sig = r.sig; delete r.sig; return !!sig && hmacHex(key, canon(r)) === sig; };

  // ---------------- 主題 ----------------
  function themeBtn() {
    const b = h('button.iconbtn', { type: 'button', title: '切換淺色／深色' });
    const cur = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const lab = () => { b.textContent = cur() === 'dark' ? '☀ 淺色' : '☾ 深色'; };
    const saved = store.get('sqlp:theme'); if (saved) document.documentElement.setAttribute('data-theme', saved);
    b.onclick = () => { const t = cur() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); store.set('sqlp:theme', t); lab(); };
    lab(); return b;
  }

  // ---------------- 數據庫、答案 ----------------
  const DBC = new WeakMap(), OBJC = new WeakMap();
  function dbOf(U, ref) {
    U = U || SQ._unit || {};
    if (ref && typeof ref === 'object') { if (!OBJC.has(ref)) OBJC.set(ref, E.normDb(ref)); return OBJC.get(ref); }
    if (!U.dbs || !(ref in U.dbs)) throw new Error(`沒有數據庫「${ref}」（單元 dbs 內沒有這個名稱）`);
    let c = DBC.get(U); if (!c) { c = {}; DBC.set(U, c); }
    if (!c[ref]) c[ref] = E.normDb(U.dbs[ref]);
    return c[ref];
  }
  SQ.dbOf = dbOf;
  const itemDb = (it, U) => (it._T ? it._T : dbOf(U, it.db));
  const fmtV = E.fmtV;
  const rowsText = (rows) => rows.map((r) => r.map(fmtV).join(', ')).join('\n');
  const colIdx = (cols, c) => {
    if (typeof c === 'number') return c - 1;
    const n = (x) => String(x).replace(/\s+/g, '').toUpperCase();
    let i = cols.findIndex((x) => n(x) === n(c));
    if (i < 0) i = cols.findIndex((x) => n(x).split('.').pop() === n(c).split('.').pop());
    return i;
  };
  function runIt(it, U) { return E.runScript(itemDb(it, U), it.sql); }
  // ask：'table'（預設）| 'rows' | {cell:[第幾行(由 1 起), 欄]} | {col} | 'error' | {after:'表'} | 'cols'
  function askAnswer(it, U, r) {
    r = r || runIt(it, U);
    const a = it.ask || 'table';
    if (a === 'error') return r.error ? r.error.label : '沒有錯誤';
    if (r.error) throw new Error(`題目 ${it.id || ''} 的 SQL 出錯（第 ${r.error.idx + 1} 句）：${r.error.msg}`);
    if (a.after) {
      const tn = E.findT(r.T, a.after);
      if (tn === undefined) { if (E.findView(r.T, a.after) !== undefined) return rowsText(E.run(r.T, 'SELECT * FROM ' + a.after).rows); throw new Error(`題目 ${it.id || ''}：執行後沒有數據表 ${a.after}`); }
      return rowsText(r.T[tn][1]);
    }
    const L = r.last;
    if (!L || !L.cols) throw new Error(`題目 ${it.id || ''}：最後一句不是 SELECT（DML 題要用 ask:{after:'表名'}）`);
    if (a === 'rows') return String(L.rows.length);
    if (a === 'table') return rowsText(L.rows);
    if (a === 'cols') return L.cols.join(', ');
    if (a.col != null) { const i = colIdx(L.cols, a.col); if (i < 0) throw new Error(`題目 ${it.id || ''}：結果沒有欄 ${a.col}（有 ${L.cols.join('、')}）`); return L.rows.map((row) => fmtV(row[i])).join(', '); }
    if (a.cell) {
      const [ri, c] = a.cell;
      if (!(ri >= 1)) throw new Error(`題目 ${it.id || ''}：ask.cell 的行號由 1 開始（第 1 行是第一項記錄）`);
      const row = L.rows[ri - 1]; if (!row) throw new Error(`題目 ${it.id || ''}：結果只有 ${L.rows.length} 行，沒有第 ${ri} 行`);
      const i = colIdx(L.cols, c); if (i < 0 || i >= row.length) throw new Error(`題目 ${it.id || ''}：結果沒有欄 ${c}`);
      return fmtV(row[i]);
    }
    throw new Error(`題目 ${it.id || ''}：未知的 ask ${JSON.stringify(a)}`);
  }
  SQ.askAnswer = askAnswer;
  // 比較答案：逐行、逐格（以逗號分隔）；兩邊都是數字時按數值比較；ci = 不分大小寫
  const EMPTY = /^[（(]?\s*(沒有記錄|沒有結果|空)\s*[）)]?$/;
  const isNum = (s) => /^-?\d+(\.\d+)?$/.test(s);
  function same(a, b, ci) {
    const norm = (s) => { s = String(s == null ? '' : s).replace(/\r/g, '').trim(); return EMPTY.test(s) ? '' : s; };
    const A = norm(a), B = norm(b);
    const lines = (s) => (s === '' ? [] : s.split('\n').map((l) => l.split(',').map((c) => c.trim().replace(/\s+/g, ' ').replace(/^'(.*)'$/, '$1'))));
    const la = lines(A), lb = lines(B);
    if (la.length !== lb.length) return false;
    for (let i = 0; i < la.length; i++) {
      if (la[i].length !== lb[i].length) return false;
      for (let j = 0; j < la[i].length; j++) {
        const x = la[i][j], y = lb[i][j];
        if (isNum(x) && isNum(y)) { if (Math.abs(Number(x) - Number(y)) > 1e-9) return false; }
        else if (ci ? x.toLowerCase() !== y.toLowerCase() : x !== y) return false;
      }
    }
    return true;
  }
  SQ.same = same;
  // FD 題
  const setTxt = (a) => '{' + a.join(', ') + '}';
  function fdSynth(R, F) {
    let G = []; F.forEach(([l, r]) => r.forEach((a) => { if (!l.includes(a) && R.includes(a)) G.push([l.slice(), [a]]); }));
    G = G.map(([l, r]) => { let L = l.slice(); for (const x of l) { if (L.length < 2) break; const L2 = L.filter((y) => y !== x); if (FDX.closure(L2, G).includes(r[0])) L = L2; } return [L, r]; });
    for (let i = 0; i < G.length; i++) { const rest = G.filter((_, j) => j !== i); if (FDX.has(FDX.closure(G[i][0], rest), G[i][1])) { G.splice(i, 1); i--; } }
    const groups = {}; G.forEach(([l, r]) => { const k = FDX.sorted(l).join(','); (groups[k] = groups[k] || new Set(l)); r.forEach((a) => groups[k].add(a)); });
    let rels = Object.values(groups).map((s) => FDX.sorted([...s]));
    const ks = FDX.keys(R, F);
    if (!rels.some((r) => ks.some((k) => FDX.has(r, k)))) rels.push(ks[0]);
    rels = rels.filter((r, i) => !rels.some((o, j) => j !== i && FDX.has(o, r) && (o.length > r.length || j < i)));
    return rels;
  }
  const parseSets = (v) => {
    const s = String(v); const g = []; const re = /[{(（]([^})）]*)[})）]/g; let m;
    while ((m = re.exec(s))) g.push(m[1]);
    const parts = g.length ? g : s.split(/[;；|]/);
    return parts.map((p) => FDX.sorted([...new Set(FDX.S(p.replace(/[+＋]/g, ' ').toUpperCase()))])).filter((x) => x.length);
  };
  const nfOf = (v) => { const s = String(v); const m = /([123])\s*NF/i.exec(s) || /第\s*([一二三123])\s*範式/.exec(s) || /^\s*([123])\s*$/.exec(s); return m ? ({ 一: 1, 二: 2, 三: 3 }[m[1]] || +m[1]) : null; };
  function fdInfo(it) {
    const R = FDX.sorted([...new Set(FDX.S(it.attrs))]), F = FDX.FD(it.fds), ask = String(it.ask || 'keys');
    if (ask === 'keys') { const ks = FDX.keys(R, F); return { text: ks.map(setTxt).join('、'), match: (v) => { const p = parseSets(v); return p.length === ks.length && ks.every((k) => p.some((x) => FDX.eqs(x, k))); }, why: '候選鍵碼：' + ks.map((k) => setTxt(k) + '⁺ = ' + setTxt(FDX.sorted(FDX.closure(k, F)))).join('；') + '。' }; }
    if (ask === 'nf') { const r = FDX.nf(R, F); const why = r.partial.length ? '有部分功能相關：' + r.partial.map(([l, rr, k]) => `${l.join(', ')} → ${rr.join(', ')}（只是鍵碼 ${setTxt(k)} 的一部分）`).join('；') : r.trans.length ? '有遞移功能相關：' + r.trans.map(([l, rr]) => `${l.join(', ')} → ${rr.join(', ')}`).join('；') : '沒有部分功能相關，也沒有遞移功能相關。'; return { text: r.nf + 'NF', match: (v) => nfOf(v) === r.nf, why: '候選鍵碼 ' + r.keys.map(setTxt).join('、') + '。' + why }; }
    if (ask.startsWith('closure:')) { const X = FDX.S(ask.slice(8)); const c = FDX.sorted(FDX.closure(X, F).filter((a) => R.includes(a) || X.includes(a))); const st = FDX.closureSteps(X, F); return { text: setTxt(c), match: (v) => { const p = parseSets(v.includes('{') || v.includes('(') ? v : '{' + v + '}'); return p.length === 1 && FDX.eqs(p[0], c); }, why: setTxt(X) + ' 開始：' + (st.steps.map((s) => `用 ${FDX.fdStr(s)} 加入 ${s[2].join('、')}`).join('；') || '不能再加入') + '。' }; }
    if (ask === 'decompose3NF') { const rels = fdSynth(R, F); return { text: rels.map((r, i) => `R${i + 1}(${r.join(', ')})`).join('；'), match: (v) => { const p = parseSets(v); return p.length > 0 && FDX.checkSplit(R, F, p).problems.length === 0; }, why: '要求：無損、保留所有功能相關性、每個關係都達第三範式。' }; }
    throw new Error(`題目 ${it.id}：未知的 fd ask ${ask}`);
  }
  SQ.fdInfo = fdInfo;
  function correctIndex(it, U) {
    if (typeof it.answer === 'number') return it.answer;
    if (typeof it.answer === 'string' && /^[A-H]$/.test(it.answer)) return LET.indexOf(it.answer);
    let hits;
    if (it.type === 'fd') { const f = fdInfo(it); hits = it.options.map((op, i) => (f.match(op) ? i : -1)).filter((i) => i >= 0); if (hits.length !== 1) throw new Error(`題目 ${it.id}：選項中有 ${hits.length} 個符合 FDX 的答案「${f.text}」`); return hits[0]; }
    const r = runIt(it, U), ans = askAnswer(it, U, r);
    hits = it.options.map((op, i) => (same(op, ans) || (it.ask === 'error' && r.error && String(op).trim() === r.error.msg) ? i : -1)).filter((i) => i >= 0);
    if (hits.length !== 1) throw new Error(`題目 ${it.id}：選項中有 ${hits.length} 個與引擎答案「${ans.replace(/\n/g, ' / ')}」相同`);
    return hits[0];
  }
  SQ.correctIndex = correctIndex;
  function verifyItem(it, U) {
    // 有 answer 又有 verify：核對答案與引擎一致
    const ci = correctIndex(it, U);
    if (it.verify && (it.sql || it.type === 'fd')) {
      if (it.type === 'fd') { if (!fdInfo(it).match(it.options[ci])) throw new Error(`題目 ${it.id}：答案 ${LET[ci]}（${it.options[ci]}）與 FDX 答案「${fdInfo(it).text}」不符`); }
      else { const r = runIt(it, U), a = askAnswer(it, U, r); if (!same(it.options[ci], a) && !(it.ask === 'error' && r.error && it.options[ci] === r.error.msg)) throw new Error(`題目 ${it.id}：答案 ${LET[ci]}（${it.options[ci]}）與引擎答案「${a.replace(/\n/g, ' / ')}」不符`); }
    }
    return ci;
  }
  SQ.verifyItem = verifyItem;
  function fillAnswers(it, U) {
    let r = null;
    return it.blanks.map((b) => {
      if (b.ask) { if (!r && it.sql) r = runIt(it, U); return askAnswer(Object.assign({}, it, { ask: b.ask }), U, r); }
      if (b.fd) return fdInfo(Object.assign({}, it, { ask: b.fd })).text;
      return String(b.a);
    });
  }
  SQ.fillAnswers = fillAnswers;
  const subBlanks = (tpl, vals) => tpl.replace(/［(\d+)］/g, (_, n) => vals[Number(n) - 1]);
  SQ.subBlanks = subBlanks;

  // ---------------- 自動檢查 SQL（寫SQL、補完）：單元數據庫＋自動產生的變體 ----------------
  function hashStr(s) { let x = 2166136261; for (const c of String(s)) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
  function rng(seed) { let a = hashStr(seed) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const UPc = (s) => String(s).toUpperCase();
  function colRoles(T, tn) {
    const t = T[tn], m = t[3] || {}, keyish = new Set((t[2] || []).map(UPc));
    (m.uq || []).forEach((u) => u.cols.forEach((c) => keyish.add(UPc(c))));
    (m.fk || []).forEach((f) => f.cols.forEach((c) => keyish.add(UPc(c))));
    for (const cn of E.tableKeys(T)) ((T[cn][3] || {}).fk || []).forEach((f) => { if (UPc(f.ref) === UPc(tn)) f.rcols.forEach((c) => keyish.add(UPc(c))); });
    if (m.ai) keyish.add(UPc(m.ai));
    return { keyish, m };
  }
  function checkAll(T) { try { E.runScript(T, 'SELECT 1'); for (const k of E.tableKeys(T)) { const r = E.runScript(T, 'UPDATE `' + k + '` SET `' + T[k][0][0] + '` = `' + T[k][0][0] + '`'); if (r.error) return false; } return true; } catch (e) { return false; } }
  function tweakNums(T, tn, rnd, share) {
    const { keyish, m } = colRoles(T, tn), [cols, rows] = T[tn];
    cols.forEach((c, j) => {
      if (keyish.has(UPc(c))) return;
      const vals = rows.map((r) => r[j]).filter((v) => v !== null);
      if (!vals.length || !vals.every((v) => typeof v === 'number')) return;
      const allInt = vals.every(Number.isInteger) || /INT/i.test((m.types || {})[UPc(c)] || '');
      rows.forEach((r) => { if (r[j] === null || rnd() > share) return; let d = (1 + Math.floor(rnd() * 3)) * (rnd() < 0.5 ? -1 : 1); if (!allInt) d = d / 2; const nv = r[j] + d; if (nv >= 0 || r[j] < 0) r[j] = allInt ? Math.round(nv) : Math.round(nv * 100) / 100; });
    });
  }
  function newKeyVal(vals, ty, rnd) {
    const nums = vals.filter((v) => typeof v === 'number');
    if (vals.length && nums.length === vals.length) return Math.max(...nums) + 1 + Math.floor(rnd() * 3);
    const strs = vals.filter((v) => typeof v === 'string'), len = (/\((\d+)\)/.exec(ty || '') || [])[1];
    const fits = (s) => !len || [...s].length <= +len;
    const taken = new Set(strs.map((s) => s.toLowerCase()));
    const sm = strs.map((s) => /^(.*?)(\d+)$/.exec(s)).filter(Boolean);
    if (sm.length) { const [, pre, dg] = sm[0]; const mx = Math.max(...sm.filter((x) => x[1] === pre).map((x) => +x[2])); for (let k = 1; k < 50; k++) { const v = pre + String(mx + k).padStart(dg.length, '0'); if (!taken.has(v.toLowerCase()) && fits(v)) return v; } }
    const base = strs[0] || 'X';
    for (const ch of 'ZQXJKW') { const v = fits(base + ch) ? base + ch : base.slice(0, -1) + ch; if (!taken.has(v.toLowerCase()) && fits(v)) return v; }
    return null;
  }
  const VARC = new WeakMap();
  function variants(T0, seed) {
    let c = VARC.get(T0); if (!c) { c = new Map(); VARC.set(T0, c); }
    if (!c.has(seed)) c.set(seed, variants0(T0, seed));
    return c.get(seed);
  }
  function variants0(T0, seed) {
    const rnd = rng('v:' + seed), out = [];
    const names = E.tableKeys(T0).filter((k) => T0[k][1].length);
    if (!names.length) return out;
    // 變體 1：倒轉並轉動記錄次序，改動部分數值
    let V = E.clone(T0);
    names.forEach((tn) => { const rows = V[tn][1].reverse(); const k = Math.floor(rnd() * rows.length); V[tn][1] = rows.slice(k).concat(rows.slice(0, k)); });
    const V0 = E.clone(V);
    names.forEach((tn) => tweakNums(V, tn, rnd, 0.45));
    out.push(checkAll(V) ? V : V0);
    // 變體 2：每個數據表加一項新記錄、刪除一項記錄，改動部分數值
    let W = E.clone(T0);
    for (const tn of names) {
      const t = W[tn], [cols, rows] = t, { m } = colRoles(W, tn), pk = (t[2] || []).map(UPc);
      const src = rows[Math.floor(rnd() * rows.length)].slice();
      const uniqCols = new Set(pk.length === 1 ? pk : []); (m.uq || []).forEach((u) => { if (u.cols.length === 1) uniqCols.add(UPc(u.cols[0])); });
      if (pk.length > 1) { const fkc = new Set(((m.fk) || []).flatMap((f) => f.cols.map(UPc))); const c = pk.find((x) => !fkc.has(x)); if (c) uniqCols.add(c); else continue; }
      if (m.ai) uniqCols.add(UPc(m.ai));
      let ok = true;
      cols.forEach((c, j) => { if (uniqCols.has(UPc(c))) { const v = newKeyVal(rows.map((r) => r[j]).filter((x) => x !== null), (m.types || {})[UPc(c)], rnd); if (v === null) ok = false; else src[j] = v; } });
      if (!ok) continue;
      const at = Math.floor(rnd() * (rows.length + 1));
      const W2 = E.clone(W); W2[tn][1].splice(at, 0, src);
      let added = -1; if (checkAll(W2)) { W = W2; added = at; }
      if (W[tn][1].length >= 3) { for (let tries = 0; tries < 4; tries++) { const W3 = E.clone(W); let k = Math.floor(rnd() * W3[tn][1].length); if (k === added) k = (k + 1) % W3[tn][1].length; W3[tn][1].splice(k, 1); if (checkAll(W3)) { W = W3; break; } } }
    }
    const W0 = E.clone(W);
    names.forEach((tn) => tweakNums(W, tn, rnd, 0.3));
    if (!checkAll(W)) W = W0;
    if (JSON.stringify(W) !== JSON.stringify(T0)) out.push(W);
    return out;
  }
  SQ.variants = variants;
  const normType = (t) => String(t || '').toUpperCase().replace(/\s+/g, '').replace(/^INTEGER/, 'INT').replace(/^BOOLEAN/, 'BOOL').replace(/^(NUMERIC|DEC)\b/, 'DECIMAL').replace(/^REAL/, 'DOUBLE');
  const normCk = (s) => String(s).toUpperCase().replace(/[\s()`]/g, '');
  function snapshot(T, names) {
    const out = {};
    const all = E.tableKeys(T).concat(Object.keys(T[E.VIEWS] || {}));
    const want = names ? names.map(UPc) : all.map(UPc);
    for (const n of all) {
      if (!want.includes(UPc(n))) continue;
      if (E.findT(T, n) === undefined) { const r = E.run(T, 'SELECT * FROM `' + n + '`'); out[UPc(n)] = { view: true, cols: r.cols.map(UPc), rows: r.rows }; continue; }
      const t = T[n], m = t[3] || {};
      out[UPc(n)] = { cols: t[0].map(UPc), rows: t[1], types: t[0].map((c) => normType((m.types || {})[UPc(c)])), pk: (t[2] || []).map(UPc).sort(), nn: (m.nn || []).map(UPc).sort(), uq: (m.uq || []).map((u) => u.cols.map(UPc).join('+')).sort(), fk: (m.fk || []).map((f) => f.cols.join('+') + '>' + UPc(f.ref) + '(' + f.rcols.join('+') + ')').sort(), def: Object.keys(m.def || {}).sort().map((k) => k + '=' + JSON.stringify(m.def[k])), ai: m.ai ? UPc(m.ai) : '', ck: (m.ck || []).map((c) => normCk(c.src)).sort() };
    }
    want.forEach((n) => { if (!(n in out)) out[n] = null; });
    return out;
  }
  const cellKey = (v) => (v === null ? 'N' : typeof v === 'number' ? 'n' + fmtV(Math.round(v * 1e9) / 1e9) : 's' + v);
  const rowKey = (r) => r.map(cellKey).join('\u0001');
  function sameRows(a, b, ordered) {
    if (a.length !== b.length) return false;
    const ka = a.map(rowKey), kb = b.map(rowKey);
    if (ordered) return ka.every((k, i) => k === kb[i]);
    ka.sort(); kb.sort(); return ka.every((k, i) => k === kb[i]);
  }
  function refOrdered(sql) { try { const st = E.splitSQL(sql); const p = E.parse(st[st.length - 1]); return !!p.order; } catch (e) { return false; } }
  function outcome(T, sql, chk) {
    const r = E.runScript(T, sql);
    if (r.error) return { err: r.error, T: r.T };
    const L = r.last, stateMode = (chk && chk.state) || !L.cols;
    if (!stateMode) return { sel: { cols: L.cols, rows: L.rows }, T: r.T };
    return { state: snapshot(r.T, chk && chk.state), T: r.T, base: chk && chk.state ? null : snapshot(T) };
  }
  SQ.outcome = outcome;
  const LIST_L = { pk: '主關鍵碼', nn: 'NOT NULL 限制', uq: 'UNIQUE 限制', fk: '外鍵碼', def: 'DEFAULT 預設值', ai: 'AUTO_INCREMENT', ck: 'CHECK 限制', types: '數據類型' };
  function diff(exp, got, ordered, chk) {
    if (exp.sel) {
      if (!got.sel) return '期望最後一句是 SELECT 並顯示結果。';
      const A = exp.sel, B = got.sel;
      if (A.cols.length !== B.cols.length) return `欄數不同：期望 ${A.cols.length} 欄（${A.cols.join(', ')}），你的結果有 ${B.cols.length} 欄（${B.cols.join(', ')}）。`;
      if (chk && chk.cols) { const bad = A.cols.findIndex((c, i) => UPc(c).replace(/\s/g, '') !== UPc(B.cols[i]).replace(/\s/g, '')); if (bad >= 0) return `第 ${bad + 1} 欄的欄名應該是 ${A.cols[bad]}（你的是 ${B.cols[bad]}；可用 AS 改名）。`; }
      if (A.rows.length !== B.rows.length) return `行數不同：期望 ${A.rows.length} 行，你的結果有 ${B.rows.length} 行。`;
      if (!sameRows(A.rows, B.rows, false)) return '結果的內容不同（行數相同，但有些值不對）。';
      if (ordered && !sameRows(A.rows, B.rows, true)) return '內容對了，但次序不對（留意 ORDER BY）。';
      return null;
    }
    if (!got.state) return '這題要修改數據表（或結構），最後不應只是 SELECT。';
    for (const n of Object.keys(exp.state)) {
      const a = exp.state[n], b = got.state[n];
      if (a === null && b !== null) return `執行後不應再有 ${n}。`;
      if (a === null) continue;
      if (!b) return `執行後應該有 ${a.view ? '檢視' : '數據表'} ${n}。`;
      if (a.cols.join() !== b.cols.join()) return `${n} 的欄位應該是 ${a.cols.join(', ')}（你的是 ${b.cols.join(', ')}）。`;
      if (!a.view) for (const k of ['types', 'pk', 'nn', 'uq', 'fk', 'def', 'ai', 'ck']) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return `${n} 的${LIST_L[k]}不對。`;
      if (a.rows.length !== b.rows.length) return `${n} 應該有 ${a.rows.length} 項記錄，你的有 ${b.rows.length} 項。`;
      if (!sameRows(a.rows, b.rows, false)) return `${n} 的記錄內容不對。`;
    }
    if (!chk || !chk.state) for (const n of Object.keys(got.state)) if (!(n in exp.state)) return `執行後不應有 ${n}。`;
    return null;
  }
  function normRuleSql(s) { return String(s).replace(/\s+/g, ' ').toUpperCase(); }
  function checkRules(task, sql) {
    const N = normRuleSql(sql);
    for (const r of task.rules || []) {
      const hit = r.re ? new RegExp(r.re, 'i').test(sql) : r.must != null ? N.includes(normRuleSql(r.must)) : N.includes(normRuleSql(r.mustNot));
      if ((r.must != null || (r.re && r.mustNot !== true && r.not !== true)) ? !hit : hit) return r.msg;
    }
    return null;
  }
  const EXPC = new Map();
  function expected(task, U, T, i, ref) {
    const k = (task.id || '') + '|' + i + '|' + ref + '|' + (U && U.id);
    if (!EXPC.has(k)) EXPC.set(k, outcome(T, ref, task.check));
    return EXPC.get(k);
  }
  function checkSql(task, sql, U, refSql) {
    const ref = refSql || task.ref;
    if (!String(sql).trim()) return { ok: false, empty: true, list: [] };
    const base = dbOf(U, task.db);
    const pre = E.runScript(base, sql);
    if (pre.error && pre.error.code === 'syntax') return { ok: false, list: [{ i: 0, ok: false, msg: `執行出錯（${pre.error.label}${pre.error.idx ? `，第 ${pre.error.idx + 1} 句` : ''}）：${pre.error.msg}`, hidden: false }] };
    const ruleMsg = checkRules(task, sql); if (ruleMsg) return { ok: false, ruleMsg, list: [] };
    const dbs = [base].concat(variants(base, task.id || ref));
    const ordered = (task.check && task.check.order) || refOrdered(ref);
    const list = []; let all = true;
    dbs.forEach((T, i) => {
      const exp = expected(task, U, T, i, ref);
      if (exp.err) { if (i === 0) throw new Error(`題目 ${task.id} 的參考答案出錯：${exp.err.msg}`); return; }
      const got = outcome(T, sql, task.check);
      let msg = null;
      if (got.err) msg = `執行出錯（${got.err.label}${got.err.idx ? `，第 ${got.err.idx + 1} 句` : ''}）：${got.err.msg}`;
      else msg = diff(exp, got, ordered, task.check);
      if (msg) all = false;
      list.push({ i, ok: !msg, msg, hidden: i > 0 });
    });
    return { ok: all, list };
  }
  SQ.checkSql = checkSql;

  // ---------------- SQL 顯示 ----------------
  const SQLKW = /\b(SELECT|DISTINCT|FROM|WHERE|GROUP|BY|HAVING|ORDER|ASC|DESC|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|AS|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|NATURAL|ON|USING|UNION|ALL|INTERSECT|EXCEPT|MINUS|EXISTS|ANY|SOME|UPDATE|SET|DELETE|INSERT|INTO|VALUES|CREATE|TABLE|VIEW|INDEX|DROP|ALTER|ADD|COLUMN|MODIFY|CHANGE|RENAME|TO|PRIMARY|FOREIGN|KEY|REFERENCES|UNIQUE|DEFAULT|CHECK|CONSTRAINT|AUTO_INCREMENT|DATABASE|USE|SHOW|TABLES|DESCRIBE|CASE|WHEN|THEN|ELSE|END|LIMIT|OFFSET|REPLACE|TRUE|FALSE|INT|INTEGER|CHAR|VARCHAR|TEXT|DATE|DATETIME|TIME|FLOAT|DOUBLE|DECIMAL|BOOL|BOOLEAN|IF)\b/i;
  function hlLine(s) {
    const re = new RegExp(`('(?:[^']|'')*'?|"(?:[^"]|"")*"?)|(--\\s.*$|#.*$)|(\\b\\d+(?:\\.\\d+)?\\b)|${SQLKW.source}`, 'gi');
    const parts = []; let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(esc(s.slice(last, m.index)));
      if (m[1]) parts.push(`<span class="s">${esc(m[1])}</span>`);
      else if (m[2]) parts.push(`<span class="cm">${esc(m[2])}</span>`);
      else if (m[3]) parts.push(`<span class="nu">${esc(m[3])}</span>`);
      else parts.push(`<span class="k">${esc(m[0])}</span>`);
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    parts.push(esc(s.slice(last)));
    return parts.join('');
  }
  function codeView(code, opt) {
    opt = opt || {};
    const el = h('pre.code', { 'aria-label': opt.label || 'SQL' });
    String(code).split('\n').forEach((s, i) => {
      const ln = h('div.ln', h('span.no', String(i + 1))), body = h('span');
      if (opt.blanks) {
        for (const seg of s.split(/(［\d+］)/)) {
          const mm = seg.match(/^［(\d+)］$/);
          if (mm) { const inp = h('input.blank', { type: 'text', 'aria-label': `空格 ${mm[1]}`, 'data-b': mm[1], size: 10, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }); opt.blanks[mm[1]] = inp; body.append(inp); }
          else body.insertAdjacentHTML('beforeend', hlLine(seg));
        }
      } else body.innerHTML = hlLine(s) || ' ';
      ln.append(body); el.append(ln);
    });
    return el;
  }
  SQ.codeView = codeView;
  function Editor(code, opt) {
    opt = opt || {};
    const ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'SQL 編輯器' });
    ta.value = code || '';
    const gut = h('div.ed-gut', { 'aria-hidden': 'true' });
    let errLine = null;
    const sync = () => { const n = ta.value.split('\n').length; gut.innerHTML = Array.from({ length: n }, (_, i) => (i === errLine ? `<span class="e">${i + 1}</span>` : String(i + 1))).join('\n'); ta.rows = Math.max(opt.minRows || 3, n + 1); if (opt.onChange) opt.onChange(ta.value); };
    const insert = (txt) => { const s = ta.selectionStart, e = ta.selectionEnd; ta.setRangeText(txt, s, e, 'end'); ta.focus(); sync(); };
    ta.addEventListener('input', sync);
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); if (opt.onRun) opt.onRun(); return; }
      if (ev.key === 'Tab' && !ev.altKey && !ev.ctrlKey && !ev.metaKey) { if (ta.dataset.esc === '1') { ta.dataset.esc = ''; return; } ev.preventDefault(); insert('    '); }
      else if (ev.key === 'Escape') ta.dataset.esc = '1';
    });
    const TOOLS = opt.tools || ['SELECT ', 'FROM ', 'WHERE ', 'AND ', 'OR ', 'GROUP BY ', 'HAVING ', 'ORDER BY ', 'JOIN ', 'ON ', 'COUNT(*)', "''", '*', '=', '<>', ';'];
    const tools = h('div.ed-tools', { role: 'toolbar', 'aria-label': '插入關鍵字' }, TOOLS.map((t) => h('button', { type: 'button', onclick: () => { insert(t); if (t === "''") { ta.selectionStart = ta.selectionEnd = ta.selectionStart - 1; } }, title: `插入「${t.trim()}」` }, t.trim())));
    const box = h('div.ed-box', gut, ta);
    const el = h('div.ed', opt.noTools ? null : tools, box);
    sync();
    return { el, ta, get: () => ta.value, set: (v) => { ta.value = v; sync(); }, markErr: (l) => { errLine = l; sync(); } };
  }
  SQ.Editor = Editor;

  // ---------------- 表格顯示 ----------------
  const cellEl = (v) => (v === null || v === undefined ? h('td.nul', 'NULL') : h('td' + (typeof v === 'number' ? '.n' : ''), fmtV(v)));
  function gridEl(cols, rows, opt) {
    opt = opt || {};
    const hl = opt.hl || new Set(), del = opt.del || [];
    const head = h('tr', cols.map((c, j) => h('th', (opt.pk || []).includes(j) ? h('u', c) : c)));
    const body = h('tbody', rows.map((r, i) => h('tr' + (hl.has(i) ? '.chg' : ''), r.map(cellEl))), del.map((r) => h('tr.del', { title: '已刪除' }, r.map(cellEl))));
    if (!rows.length && !del.length) body.append(h('tr', h('td.empty', { colspan: Math.max(1, cols.length) }, '（沒有記錄）')));
    return h('div.gridwrap', h('table.grid', h('thead', head), body));
  }
  SQ.gridEl = gridEl;
  function schemaLine(T, tn) {
    const t = T[tn], pk = (t[2] || []).map(UPc), m = t[3] || {}, fkc = new Set((m.fk || []).flatMap((f) => f.cols.map(UPc)));
    return h('span.schema', tn, '(', t[0].flatMap((c, j) => { const el = pk.includes(UPc(c)) ? h('u', c) : fkc.has(UPc(c)) ? h('i.fk', { title: '外鍵碼' }, c) : c; return j ? [', ', el] : [el]; }), ')');
  }
  function tableBox(T, tn, opt) {
    opt = opt || {};
    const t = T[tn], pkIdx = t[0].map((c, j) => ((t[2] || []).map(UPc).includes(UPc(c)) ? j : -1)).filter((j) => j >= 0);
    const det = h('details.tbox', { open: opt.open !== false, 'data-t': tn }, h('summary', schemaLine(T, tn), h('span.cnt', `${t[1].length} 項記錄`)), gridEl(t[0], t[1], { pk: pkIdx, hl: opt.hl, del: opt.del }));
    return det;
  }
  function viewBox(T, vn, opt) {
    let body;
    try { const r = E.run(T, 'SELECT * FROM `' + vn + '`'); body = gridEl(r.cols, r.rows); } catch (e) { body = h('p.msg.err', e.message); }
    return h('details.tbox.view', { open: !!(opt && opt.open) }, h('summary', h('span.schema', '檢視 ', vn), h('span.cnt', 'VIEW')), codeView(T[E.VIEWS][vn].sql), body);
  }
  function tablesEl(T, opt) {
    opt = opt || {};
    const names = (opt.names || E.tableKeys(T)).filter((n) => E.findT(T, n) !== undefined).map((n) => E.findT(T, n));
    const many = names.length > 3;
    const out = names.map((n) => tableBox(T, n, { open: opt.open ? opt.open.map(UPc).includes(UPc(n)) || (opt.hlT && UPc(opt.hlT) === UPc(n)) : !many || (opt.hlT && UPc(opt.hlT) === UPc(n)), hl: opt.hlT && UPc(opt.hlT) === UPc(n) ? opt.hl : null, del: opt.hlT && UPc(opt.hlT) === UPc(n) ? opt.del : null }));
    if (!opt.names) Object.keys(T[E.VIEWS] || {}).forEach((v) => out.push(viewBox(T, v)));
    if (!out.length) out.push(h('p.pts', '（數據庫內沒有數據表）'));
    return h('div.tables', out);
  }
  SQ.tablesEl = tablesEl;
  function tablesPanel(T, opt) {
    const names = E.tableKeys(T);
    return h('details.sqlc-tables.static', { open: true }, h('summary', `數據表：${names.join('、') || '（沒有）'}`), h('div.panel-body', tablesEl(T, opt)));
  }

  // ---------------- SQL 控制台 ----------------
  // o: {T, sql, locked, lockMsg, open:[表], minRows, noTables, onRun}
  function Console(o) {
    o = o || {};
    const self = { T: o.T, locked: !!o.locked };
    const bRun = h('button.btn.primary.small', { type: 'button', title: 'Ctrl+Enter' }, '▶ 執行');
    const bReset = h('button.btn.ghost.small', { type: 'button', title: '還原所有數據表' }, '↺ 重設數據');
    const bRestore = h('button.btn.ghost.small', { type: 'button', hidden: !o.sql }, '↶ 還原 SQL');
    const status = h('span.sim-step');
    const editor = Editor(o.sql || '', { onRun: () => bRun.onclick(), minRows: o.minRows || 3, tools: o.tools });
    const out = h('div.sqlc-out', { 'aria-live': 'polite' });
    const tBody = h('div.panel-body');
    const tDet = h('details.sqlc-tables', { open: o.tablesOpen !== false }, h('summary', '數據表'), tBody);
    const el = h('div.sim.sqlc', h('div.sim-bar', bRun, bReset, bRestore, status), h('div.sqlc-ed', editor.el), out, o.noTables ? null : tDet);
    const lockMsg = o.lockMsg || '先選答案並按「鎖定答案」，才可執行。';
    function renderTables(hlT, hl, del) {
      const names = E.tableKeys(self.T); const nv = Object.keys(self.T[E.VIEWS] || {}).length;
      tDet.querySelector('summary').textContent = `數據表（${names.length}${nv ? `＋${nv} 個檢視` : ''}）：${names.join('、') || '沒有'}`;
      tBody.replaceChildren(tablesEl(self.T, { open: o.open, hlT, hl, del }));
    }
    function stepLine(st, i, n) {
      const r = st.res; let t;
      if (r.kind === 'select') t = `顯示結果：${r.rows.length} 行`;
      else if (r.kind === 'insert') t = `${r.name}：加入了 ${r.n} 項記錄`;
      else if (r.kind === 'update') t = `${r.name}：更新了 ${r.n} 項記錄`;
      else if (r.kind === 'delete') t = `${r.name}：刪除了 ${r.n} 項記錄`;
      else t = r.msg || '完成';
      return h('li.ok', n > 1 ? h('b', `第 ${i + 1} 句 `) : null, '✓ ', t);
    }
    function run() {
      if (self.locked) { out.replaceChildren(h('div.msg', lockMsg)); return null; }
      const sql = editor.get();
      if (!sql.trim()) { out.replaceChildren(h('div.msg', '請先輸入 SQL。')); return null; }
      const r = E.runScript(self.T, sql);
      self.T = r.T; self.last = r;
      const kids = [];
      const n = r.steps.length + (r.error ? 1 : 0);
      if (n > 1 || (r.steps.length && r.steps[r.steps.length - 1].res.kind !== 'select')) kids.push(h('ul.steps', r.steps.map((st, i) => stepLine(st, i, n))));
      if (r.error) { kids.push(h('div.msg.err', h('b.errlab', r.error.label), ' ', n > 1 ? `第 ${r.error.idx + 1} 句：` : '', r.error.msg)); status.textContent = '出錯'; }
      else status.textContent = '完成';
      const L = r.steps.length ? r.steps[r.steps.length - 1].res : null;
      if (L && L.cols && !r.error) kids.push(h('div.result', h('div.reshead', h('b', '結果'), h('span.pts', `${L.rows.length} 行`)), gridEl(L.cols, L.rows)));
      out.replaceChildren(...kids);
      const lastDml = r.steps.slice().reverse().find((s) => ['insert', 'update', 'delete'].includes(s.res.kind));
      if (lastDml) {
        const R = lastDml.res;
        const tn = E.findT(self.T, R.name);
        if (tn !== undefined) { if (R.kind === 'delete') renderTables(tn, null, R.hit.map((i) => R.old[i])); else renderTables(tn, new Set(R.hit)); tDet.open = true; }
        else renderTables();
      } else renderTables();
      if (o.onRun) o.onRun(r, self);
      return r;
    }
    bRun.onclick = run;
    bReset.onclick = () => { self.T = o.T; out.replaceChildren(h('div.msg', '已還原所有數據表。')); status.textContent = ''; renderTables(); };
    bRestore.onclick = () => { editor.set(o.sql || ''); };
    self.setLocked = (v) => { self.locked = v; bRun.disabled = v; if (!v && out.firstChild && out.textContent === lockMsg) out.replaceChildren(); };
    self.el = el; self.editor = editor; self.run = run; self.getSql = () => editor.get(); self.setSql = (s) => editor.set(s); self.reset = () => bReset.onclick();
    renderTables(); self.setLocked(self.locked);
    if (self.locked) out.replaceChildren(h('div.msg', lockMsg));
    return self;
  }
  SQ.Console = Console;

  // ---------------- ER 圖（實體方框內列出屬性，主關鍵碼加底線；關係用菱形；兩端標 1／M） ----------------
  const tw = (s) => [...String(s)].reduce((w, c) => w + (/[⺀-￿]/.test(c) ? 14 : 8), 0);
  function erSvg(spec) {
    const ents = spec.entities || [], rels = spec.rels || [];
    const info = ents.map((e, i) => {
      const attrs = (e.attrs || []).map((a) => { const s = String(a); const pk = s.startsWith('*'); const fk = s.startsWith('#'); return { t: s.replace(/^[*#]/, ''), pk, fk }; });
      const w = Math.max(110, tw(e.name) + 30, ...attrs.map((a) => tw(a.t) + 28));
      const hgt = 34 + (attrs.length ? attrs.length * 20 + 10 : 0);
      const at = e.at || [i % 3, Math.floor(i / 3)];
      return { e, attrs, w, h: hgt, c: at[0], r: at[1] };
    });
    const maxW = Math.max(...info.map((x) => x.w), 110), maxH = Math.max(...info.map((x) => x.h), 34);
    const relW = Math.max(110, ...rels.map((r) => tw(r.name || '') + 50));
    const pitchX = maxW + relW + 30, pitchY = maxH + 110;
    const cols = Math.max(...info.map((x) => x.c)) + 1, rows = Math.max(...info.map((x) => x.r)) + 1;
    const hasCurve = rels.some((r) => { const a = info.find((x) => x.e.name === r.a), b = info.find((x) => x.e.name === r.b); return a && b && a.r === b.r && Math.abs(a.c - b.c) > 1; });
    const top = hasCurve ? 70 : 20;
    info.forEach((x) => { x.cx = 20 + maxW / 2 + x.c * pitchX; x.cy = top + maxH / 2 + x.r * pitchY; x.x = x.cx - x.w / 2; x.y = x.cy - x.h / 2; });
    const W = 40 + maxW + (cols - 1) * pitchX, H = top + 20 + maxH + (rows - 1) * pitchY;
    const P = [];
    const clip = (b, tx, ty) => { const dx = tx - b.cx, dy = ty - b.cy; if (!dx && !dy) return [b.cx, b.cy]; const sx = dx ? (b.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2) / Math.abs(dy) : Infinity, s = Math.min(sx, sy); return [b.cx + dx * s, b.cy + dy * s]; };
    for (const r of rels) {
      const a = info.find((x) => x.e.name === r.a), b = info.find((x) => x.e.name === r.b);
      if (!a || !b) continue;
      const [ca, cb] = String(r.card || '').split(':');
      const dw = tw(r.name || '') + 44, dh = 34;
      let mx, my, pa, pb, d;
      if (a.r === b.r && Math.abs(a.c - b.c) > 1) {
        const yTop = Math.min(a.y, b.y) - 45; mx = (a.cx + b.cx) / 2; my = yTop;
        pa = [a.cx, a.y]; pb = [b.cx, b.y];
        d = `M${pa[0]},${pa[1]} L${pa[0]},${yTop} L${pb[0]},${yTop} L${pb[0]},${pb[1]}`;
        P.push(`<path class="er-line" d="${d}"/>`);
        P.push(`<text class="er-card" x="${pa[0] + 8}" y="${pa[1] - 10}">${esc(ca || '')}</text><text class="er-card" x="${pb[0] + 8}" y="${pb[1] - 10}">${esc(cb || '')}</text>`);
      } else {
        pa = clip(a, b.cx, b.cy); pb = clip(b, a.cx, a.cy); mx = (pa[0] + pb[0]) / 2; my = (pa[1] + pb[1]) / 2;
        P.push(`<line class="er-line" x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}"/>`);
        const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1, ux = (pb[0] - pa[0]) / L, uy = (pb[1] - pa[1]) / L, nx = -uy, ny = ux;
        const lab = (p, sgn, t) => `<text class="er-card" x="${p[0] + ux * 16 * sgn + nx * 11}" y="${p[1] + uy * 16 * sgn + ny * 11}">${esc(t || '')}</text>`;
        P.push(lab(pa, 1, ca), lab(pb, -1, cb));
      }
      P.push(`<g class="er-rel"><polygon points="${mx},${my - dh / 2} ${mx + dw / 2},${my} ${mx},${my + dh / 2} ${mx - dw / 2},${my}"/><text x="${mx}" y="${my}">${esc(r.name || '')}</text></g>`);
    }
    for (const x of info) {
      let g = `<g class="er-ent"><rect x="${x.x}" y="${x.y}" width="${x.w}" height="${x.h}" rx="4"/><text class="er-name" x="${x.cx}" y="${x.y + 17}">${esc(x.e.name)}</text>`;
      if (x.attrs.length) g += `<line x1="${x.x}" y1="${x.y + 34}" x2="${x.x + x.w}" y2="${x.y + 34}"/>`;
      x.attrs.forEach((a, k) => { const ty = x.y + 34 + 15 + k * 20; g += `<text class="er-attr${a.fk ? ' fk' : ''}" x="${x.x + 12}" y="${ty}"${a.pk ? ' text-decoration="underline"' : ''}>${esc(a.t)}</text>`; });
      P.push(g + '</g>');
    }
    return `<svg class="er" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="實體關係圖：${esc(ents.map((e) => e.name).join('、'))}">${P.join('')}</svg>`;
  }
  SQ.erSvg = erSvg;
  const erEl = (spec) => h('div.erwrap', { html: erSvg(spec) });

  // ---------------- 元件：試／練 ----------------
  function feedback(kind, title, extra) { return h('div.fb.' + kind, { role: 'status' }, h('b.v', title), extra ? (typeof extra === 'string' ? mdEl('div', extra) : extra) : null); }
  const isTableAsk = (a) => a === 'table' || (a && a.after) || a == null;
  function ansView(text, tableish) {
    const s = String(text);
    if (s.trim() === '' || EMPTY.test(s.trim())) return h('span.empty', '（沒有記錄）');
    if (tableish && (s.includes('\n') || s.includes(', '))) return h('table.mini', h('tbody', s.split('\n').map((l) => h('tr', l.split(', ').map((c) => (c === 'NULL' ? h('td.nul', 'NULL') : h('td', c)))))));
    return mdEl('span', s);
  }
  SQ.ansView = ansView;
  function optionList(it, name, onPick) {
    const opts = h('div.opts', { role: 'radiogroup' });
    const tableish = it.type !== 'fd' && it.sql && isTableAsk(it.ask);
    it.options.forEach((op, i) => {
      const r = h('input', { type: 'radio', name, value: String(i) });
      const lab = h('label.opt', r, h('span.lt', LET[i] + '.'), ansView(op, tableish));
      r.addEventListener('change', () => { opts.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel')); lab.classList.add('sel'); onPick(i); });
      opts.append(lab);
    });
    opts.lock = (sel, right) => { opts.querySelectorAll('input').forEach((x) => { x.disabled = true; }); opts.querySelectorAll('.opt').forEach((x, i) => { x.classList.add('locked'); if (i === right) x.classList.add('right'); else if (i === sel) x.classList.add('wrong'); }); };
    opts.pick = (i) => { const x = opts.querySelectorAll('input')[i]; if (x) { x.checked = true; x.dispatchEvent(new Event('change')); } };
    return opts;
  }
  function fdHead(it) {
    const F = FDX.FD(it.fds);
    return h('div.fdbox', h('div', h('b', '關係 '), h('code', `R(${FDX.S(it.attrs).join(', ')})`)), h('div', h('b', '功能相關性'), h('ul.fds', F.map((f) => h('li', h('code', FDX.fdStr(f)))))));
  }
  function renderTry(it, ctx) {
    const U = ctx.U, st = ctx.state.items[it.id] || {};
    const right = correctIndex(it, U);
    const box = h('div.blk.try-item', { 'data-id': it.id });
    box.append(h('div.row', h('span.pill.try', h('i', '試'), '先估後執行'), h('span.pts', `${it.pts} 分`), h('span.spacer'), it.src ? h('span.ref', it.src) : null));
    if (it.intro) box.append(mdEl('p', it.intro));
    box.append(mdEl('div.q', it.q || '先估：執行以下 SQL 的結果是什麼？'));
    if (it.sql) box.append(codeView(it.sql));
    let pick = st.sel != null ? st.sel : null;
    const lockBtn = h('button.btn.primary', { type: 'button', disabled: pick == null || st.done }, '鎖定答案');
    const opts = optionList(it, 'r-' + it.id, (i) => { pick = i; lockBtn.disabled = false; });
    const fbBox = h('div');
    const con = Console({ T: itemDb(it, U), sql: it.sql, locked: !st.done && !ctx.teacher, open: it.open });
    const done = (sel, fresh) => {
      opts.lock(sel, right); lockBtn.hidden = true;
      const good = sel === right;
      fbBox.replaceChildren(feedback(good ? 'good' : 'bad', good ? `估對了！${fresh ? `+${it.pts} 分` : ''}` : `估錯了。正確答案是 ${LET[right]}。`, (it.why ? it.why + '\n' : '') + '按「▶ 執行」看看真正的結果；也可以修改 SQL 再試。'));
      con.setLocked(false);
    };
    lockBtn.onclick = () => { if (pick == null) return; const good = pick === right; ctx.award(it.id, good ? it.pts : 0, { sel: pick, done: true, kind: 'try' }); done(pick, good); };
    box.append(opts, h('div.row', lockBtn), fbBox, con.el);
    if (st.done) { opts.pick(st.sel); done(st.sel, false); }
    if (ctx.teacher) box.append(h('div.ans', `答案：${LET[right]}（${String(it.options[right]).replace(/\n/g, ' / ')}）`));
    return box;
  }
  SQ.renderTry = renderTry;
  function practiceShell(it, ctx, body, checkFn, showFn, restore) {
    const st = ctx.state.items[it.id] || {};
    const box = h('div.blk.prac-item', { 'data-id': it.id });
    box.append(h('div.row', h('span.pill.prac', h('i', '練'), it.label || '自動批改'), h('span.pts', `${it.pts} 分`), h('span.spacer'), it.src ? h('span.ref', it.src) : null));
    box.append(body);
    const bCheck = h('button.btn.primary', { type: 'button' }, '核對答案');
    const bShow = h('button.btn.ghost', { type: 'button' }, '看答案（只得 1 分）');
    const fb = h('div', { 'aria-live': 'polite' });
    box.append(h('div.row', bCheck, bShow), fb);
    let tries = st.tries || 0;
    const finish = (how) => { bCheck.disabled = true; bShow.disabled = true; bCheck.hidden = how === 'shown'; bShow.hidden = true; };
    bCheck.onclick = () => {
      const r = checkFn();
      if (r.incomplete) { fb.replaceChildren(feedback('info', r.incomplete)); return; }
      if (r.ok) { ctx.award(it.id, it.pts, { done: true, tries: tries + 1, kind: 'prac', val: r.val }); fb.replaceChildren(feedback('good', `答對了！+${it.pts} 分`, it.why || null)); finish('ok'); }
      else {
        tries++; ctx.award(it.id, 0, { tries, kind: 'prac', val: r.val });
        const hint = tries >= 2 ? (it.hint || '重看上面的重點，或在 SQL 控制台試試。') : null;
        fb.replaceChildren(feedback('bad', `未對${tries >= 2 ? `（已答錯 ${tries} 次）` : '，再想想'}。`, h('div', r.msg ? mdEl('div', r.msg) : null, hint ? mdEl('div', '提示：' + hint) : null)));
      }
    };
    bShow.onclick = () => { ctx.award(it.id, Math.min(1, it.pts), { done: true, shown: true, tries, kind: 'prac' }); showFn(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', it.why || null)); finish('shown'); };
    if (st.done) {
      if (restore) restore(st);
      if (st.shown) { showFn(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', it.why || null)); finish('shown'); }
      else { fb.replaceChildren(feedback('good', '已答對。', it.why || null)); finish('ok'); }
    }
    if (ctx.teacher && !st.done) box.append(h('div.ans', h('b', '老師：'), ' ', ...[].concat(showFn(true) || [])));
    return box;
  }
  const itemTables = (it, U) => (it.db || it._T ? tablesPanel(itemDb(it, U), { open: it.open }) : null);
  function renderMC(it, ctx) {
    const U = ctx.U, right = correctIndex(it, U);
    let pick = null;
    const opts = optionList(it, 'p-' + it.id, (i) => { pick = i; });
    const body = h('div.stack', mdEl('div.q', it.q), it.type === 'fd' ? fdHead(it) : null, it.sql && it.showTables !== false ? itemTables(it, U) : null, it.sql ? codeView(it.sql) : null, opts);
    return practiceShell(it, ctx, body,
      () => (pick == null ? { incomplete: '請先選一個答案。' } : { ok: pick === right, val: pick, msg: it.wrong && it.wrong[pick] ? it.wrong[pick] : null }),
      (peek) => { if (peek) return `${LET[right]}. ${String(it.options[right]).replace(/\n/g, ' / ')}`; opts.lock(pick, right); },
      (st) => { if (st.val != null) opts.pick(st.val); opts.lock(st.val, right); });
  }
  function renderFill(it, ctx) {
    const U = ctx.U, answers = fillAnswers(it, U);
    const inputs = it.blanks.map((b, i) => h('input.txt', { type: 'text', 'aria-label': b.label, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'data-i': i }));
    const body = h('div.stack', mdEl('div.q', it.q), it.attrs && it.fds ? fdHead(it) : null, it.sql && it.showTables !== false ? itemTables(it, U) : null, it.sql ? codeView(it.sql) : null,
      h('div', { style: { display: 'grid', gap: '8px' } }, it.blanks.map((b, i) => h('label.row', mdEl('span', b.label), inputs[i]))), h('p.pts', '多個值用「, 」分隔；多行結果每行之間用「 / 」分隔；沒有記錄可留空或寫「沒有記錄」。'));
    const accept = (i, v) => { const b = it.blanks[i]; if (answers[i].includes('\n')) v = v.replace(/\s*\/\s*/g, '\n'); if (b.fd) return fdInfo(Object.assign({}, it, { ask: b.fd })).match(v); return same(v, answers[i], true) || (b.accept || []).some((a) => same(v, a, true)); };
    return practiceShell(it, ctx, body,
      () => {
        const vals = inputs.map((x) => x.value.trim());
        if (vals.some((v, i) => !v && answers[i] !== '')) return { incomplete: '請填寫所有空格。' };
        let all = true; inputs.forEach((x, i) => { const g = accept(i, vals[i]); x.classList.toggle('ok', g); x.classList.toggle('no', !g); if (!g) all = false; });
        return { ok: all, val: vals };
      },
      (peek) => { if (peek) return it.blanks.map((b, i) => `${b.label} ${answers[i].replace(/\n/g, ' / ') || '（沒有記錄）'}`).join('；'); inputs.forEach((x, i) => { x.value = answers[i].replace(/\n/g, ' / '); x.readOnly = true; x.classList.add('ok'); }); },
      (st) => { if (st.val) inputs.forEach((x, i) => { x.value = st.val[i] || ''; x.readOnly = true; x.classList.add('ok'); }); });
  }
  function renderComplete(it, ctx) {
    const U = ctx.U, blanks = {};
    const view = codeView(it.template, { blanks });
    const n = Object.keys(blanks).length;
    const refSql = subBlanks(it.template, it.ref);
    const T = dbOf(U, it.db);
    const body = h('div.stack', mdEl('div.q', it.q || '在空格填上適當的內容，令 SQL 得出正確結果。'), it.showTables !== false ? tablesPanel(T, { open: it.open }) : null, view, h('p.pts', '核對時會在這個數據庫及另外 1–2 個改動過數據的數據庫上執行，結果要與參考答案相同。'));
    const vals = () => Array.from({ length: n }, (_, i) => (blanks[i + 1].value || '').trim());
    return practiceShell(it, ctx, body,
      () => {
        const v = vals(); if (v.some((x) => !x)) return { incomplete: '請填寫所有空格。' };
        const r = checkSql(Object.assign({}, it, { rules: it.rules }), subBlanks(it.template, v), U, refSql);
        if (r.ruleMsg) return { ok: false, val: v, msg: r.ruleMsg };
        const bad = r.list.find((x) => !x.ok);
        return { ok: r.ok, val: v, msg: bad ? (bad.hidden ? `改動過數據的數據庫：${bad.msg}` : bad.msg) : null };
      },
      (peek) => { if (peek) return it.ref.map((r, i) => `［${i + 1}］${r}`).join('；'); for (let i = 1; i <= n; i++) { blanks[i].value = it.ref[i - 1]; blanks[i].readOnly = true; } },
      (st) => { if (st.val) for (let i = 1; i <= n; i++) { blanks[i].value = st.val[i - 1] || ''; blanks[i].readOnly = true; } });
  }
  function renderFd(it, ctx) {
    if (it.options) return renderMC(it, ctx);
    const f = fdInfo(it);
    const inp = h('input.txt.wide', { type: 'text', 'aria-label': '答案', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    const ph = { keys: '例如 {A, B}、{C}', nf: '例如 2NF', decompose3NF: '例如 R1(A, B); R2(B, C)' }[it.ask] || '例如 {A, B, C}';
    inp.placeholder = ph;
    const body = h('div.stack', mdEl('div.q', it.q), fdHead(it), h('label.row', h('span', '答案'), inp));
    return practiceShell(it, ctx, body,
      () => { const v = inp.value.trim(); if (!v) return { incomplete: '請先填寫答案。' }; const ok = f.match(v); inp.classList.toggle('ok', ok); inp.classList.toggle('no', !ok); return { ok, val: v, msg: ok ? null : it.ask === 'decompose3NF' ? (() => { try { const p = parseSets(v); return '問題：' + FDX.checkSplit(FDX.S(it.attrs), FDX.FD(it.fds), p).problems.join('；'); } catch (e) { return null; } })() : null }; },
      (peek) => { if (peek) return f.text; inp.value = f.text; inp.readOnly = true; inp.classList.add('ok'); },
      (st) => { if (st.val) { inp.value = st.val; inp.readOnly = true; inp.classList.add('ok'); } });
  }
  const PRAC = { mc: renderMC, fill: renderFill, complete: renderComplete, fd: renderFd };
  SQ.renderPractice = (it, ctx) => { if (!PRAC[it.type]) throw new Error(`題目 ${it.id}：未知題型 ${it.type}`); return PRAC[it.type](it, ctx); };

  // ---------------- 寫SQL ----------------
  function expectedView(task, U) {
    const T = dbOf(U, task.db), exp = expected(task, U, T, 0, task.ref);
    if (exp.err) return null;
    if (exp.sel) return h('div.result.expect', h('div.reshead', h('b', '期望結果（用上面的數據）'), h('span.pts', `${exp.sel.rows.length} 行`)), gridEl(exp.sel.cols, exp.sel.rows));
    const before = snapshot(T), names = Object.keys(exp.state).filter((n) => JSON.stringify(exp.state[n]) !== JSON.stringify(before[n] || null));
    if (!names.length) return null;
    return h('div.result.expect', h('div.reshead', h('b', '完成後應該是：')), names.map((n) => { const s = exp.state[n]; if (!s) return h('p', `數據表 ${n} 已被刪除。`); const tn = E.findT(exp.T, n); return tn !== undefined ? tableBox(exp.T, tn, { open: true }) : h('div', h('b', '檢視 ' + n), gridEl(s.cols, s.rows)); }));
  }
  function renderWrite(task, ctx) {
    const U = ctx.U, st = ctx.state.items[task.id] || {};
    const draft = (ctx.state.drafts || {})[task.id];
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', task.tier ? h('span.badge', task.tier) : null, task.title), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.q || task.prompt || ''));
    if (task.showExpected !== false) { const ev = expectedView(task, U); if (ev) box.append(ev); }
    box.append(h('p.pts', '提交後會在這個數據庫及另外 1–2 個「改動過數據」的隱藏數據庫上執行；結果都要與參考答案相同（所以不可以把答案直接寫出來）。'));
    const con = Console({ T: dbOf(U, task.db), sql: draft != null ? draft : task.starter || '', open: task.open, minRows: 4 });
    con.editor.ta.addEventListener('input', () => { ctx.state.drafts = ctx.state.drafts || {}; ctx.state.drafts[task.id] = con.getSql(); ctx.save(); });
    const bSubmit = h('button.btn.primary', { type: 'button' }, '提交評核');
    const bRef = h('button.btn.ghost', { type: 'button', hidden: !((st.tries || 0) >= 2) || st.done }, '看參考答案（只得 1 分）');
    const fb = h('div', { 'aria-live': 'polite' });
    box.append(con.el, h('div.row', bSubmit, bRef), fb);
    let tries = st.tries || 0;
    const showRef = () => { fb.append(h('div.note', h('b', '參考答案'), codeView(task.ref))); };
    const lockDone = () => { bSubmit.disabled = true; bRef.hidden = true; };
    const lab = (x) => (x.hidden ? `隱藏測試 ${x.i}` : '這個數據庫');
    bSubmit.onclick = () => {
      const sql = con.getSql();
      if (!sql.trim()) { fb.replaceChildren(feedback('info', '請先在編輯器寫 SQL。')); return; }
      const r = checkSql(task, sql, U);
      if (r.ok) { ctx.award(task.id, task.pts, { done: true, tries: tries + 1, kind: 'write', code: sql }); fb.replaceChildren(feedback('good', `全部 ${r.list.length} 個數據庫通過！+${task.pts} 分`, h('ul.tests', r.list.map((x) => h('li.pass', h('b', lab(x)), '通過 ✓'))))); lockDone(); return; }
      tries++; ctx.award(task.id, 0, { tries, kind: 'write', code: sql });
      const parts = [];
      if (r.ruleMsg) parts.push(h('p', r.ruleMsg));
      else parts.push(h('ul.tests', r.list.map((x) => h('li.' + (x.ok ? 'pass' : 'fail'), h('b', lab(x)), x.ok ? '通過 ✓' : '不通過 ✗ ' + x.msg + (x.hidden && !r.list[0].ok ? '' : x.hidden ? '（這個數據庫的記錄次序或數值不同：SQL 要按條件計算，不可把答案寫死。）' : '')))));
      if (tries >= 2 && task.hint) parts.push(mdEl('p', '提示：' + task.hint));
      fb.replaceChildren(feedback('bad', `未通過（第 ${tries} 次提交）。`, h('div', parts)));
      if (tries >= 2) bRef.hidden = false;
    };
    bRef.onclick = () => { ctx.award(task.id, Math.min(1, task.pts), { done: true, shown: true, tries, kind: 'write' }); fb.replaceChildren(feedback('info', '已顯示參考答案（這題得 1 分）。')); showRef(); lockDone(); };
    if (st.done) { lockDone(); if (st.shown) { fb.replaceChildren(feedback('info', '已顯示參考答案（這題得 1 分）。')); showRef(); } else fb.replaceChildren(feedback('good', '已通過全部測試。')); }
    if (ctx.teacher) box.append(h('div.ans', h('b', '老師：參考答案'), codeView(task.ref)));
    return box;
  }
  SQ.renderWrite = renderWrite;
  // 分析題（表格）
  const isIn = (c) => c && typeof c === 'object' && ('sel' in c || 'text' in c || 'a' in c);
  function tableAnswers(task) { const out = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) out.push(String(c.a)); })); return out; }
  SQ.tableAnswers = tableAnswers;
  function checkTableVals(task, vals) {
    const ins = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) ins.push(c); }));
    return ins.map((c, i) => { const v = (vals[i] || '').trim(); return c.sel ? v === String(c.a) : (same(v, c.a, true) || (c.accept || []).some((x) => same(v, x, true))); });
  }
  SQ.checkTableVals = checkTableVals;
  function tableAnswerText(task) { return task.rows.map((r) => r.map((c) => (isIn(c) ? c.a : String(c).replace(/[`*]/g, ''))).join('｜')).join('；'); }
  SQ.tableAnswerText = tableAnswerText;
  function renderTableTask(task, ctx) {
    const U = ctx.U, st = ctx.state.items[task.id] || {};
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', task.tier ? h('span.badge', task.tier) : null, task.title), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.q || task.prompt || ''));
    if (task.db) box.append(tablesPanel(dbOf(U, task.db), { open: task.open }));
    if (task.sql || task.code) box.append(codeView(task.sql || task.code));
    if (task.er) box.append(erEl(task.er));
    const ctrls = [];
    const body = h('tbody', task.rows.map((r) => h('tr', r.map((c, ci) => {
      if (!isIn(c)) return mdEl('td', String(c), ci ? { 'data-label': task.head[ci] } : { class: 'rowhead' });
      const lab = `${String(r[0]).replace(/[`*]/g, '')}：${task.head[ci]}`;
      const el = c.sel ? h('select.cellsel', { 'aria-label': lab }, h('option', { value: '' }, '（請選擇）'), task.opts[c.sel].map((o) => h('option', { value: o }, o))) : h('input.txt', { type: 'text', 'aria-label': lab, autocomplete: 'off', spellcheck: 'false' });
      ctrls.push(el); return h('td', { 'data-label': task.head[ci] }, el);
    }))));
    box.append(h('div.scroll', h('table.tb.anatab', h('thead', h('tr', task.head.map((x) => mdEl('th', x)))), body)));
    const bSubmit = h('button.btn.primary', { type: 'button' }, '提交評核');
    const bRef = h('button.btn.ghost', { type: 'button', hidden: !((st.tries || 0) >= 2) || st.done }, '看答案（只得 1 分）');
    const fb = h('div', { 'aria-live': 'polite' });
    box.append(h('div.row', bSubmit, bRef), fb);
    let tries = st.tries || 0;
    const ans = tableAnswers(task);
    const fillAns = () => ctrls.forEach((el, i) => { el.value = ans[i]; el.disabled = true; el.classList.remove('no'); el.classList.add('ok'); });
    const lockDone = () => { bSubmit.disabled = true; bRef.hidden = true; ctrls.forEach((el) => { el.disabled = true; }); };
    bSubmit.onclick = () => {
      const vals = ctrls.map((el) => el.value.trim());
      if (vals.some((v) => !v)) { fb.replaceChildren(feedback('info', '請完成表格內所有空格。')); return; }
      const res = checkTableVals(task, vals);
      ctrls.forEach((el, i) => { el.classList.toggle('ok', res[i]); el.classList.toggle('no', !res[i]); });
      const nWrong = res.filter((x) => !x).length;
      if (!nWrong) { ctx.award(task.id, task.pts, { done: true, tries: tries + 1, kind: 'write', val: vals }); fb.replaceChildren(feedback('good', `全部正確！+${task.pts} 分`, task.why || null)); lockDone(); return; }
      tries++; ctx.award(task.id, 0, { tries, kind: 'write', val: vals });
      fb.replaceChildren(feedback('bad', `未全對（第 ${tries} 次提交）：有 ${nWrong} 格不正確（紅色）。`, tries >= 2 && task.hint ? '提示：' + task.hint : null));
      if (tries >= 2) bRef.hidden = false;
    };
    bRef.onclick = () => { ctx.award(task.id, Math.min(1, task.pts), { done: true, shown: true, tries, kind: 'write' }); fillAns(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', task.why || null)); lockDone(); };
    if (st.done) { lockDone(); if (st.shown) { fillAns(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', task.why || null)); } else { ctrls.forEach((el, i) => { el.value = (st.val || ans)[i]; el.classList.add('ok'); }); fb.replaceChildren(feedback('good', '已全部答對。', task.why || null)); } }
    if (ctx.teacher) box.append(h('div.ans', h('b', '老師：'), ' ', tableAnswerText(task)));
    return box;
  }
  SQ.renderTableTask = renderTableTask;

  // ---------------- 小測 ----------------
  function quizTags(it) {
    const row = h('div.tagrow');
    for (const t of it.tags || []) row.append(h('span.tag.' + (t.t === 'hot' ? 'hot' : 'trap'), t.t === 'hot' ? '常考' : '易錯'));
    if (it.src) row.append(h('span', '出處：' + it.src));
    return row;
  }
  function tableEl(t) { return h('div.scroll', h('table.tb', t.head ? h('thead', h('tr', t.head.map((x) => mdEl('th', x)))) : null, h('tbody', t.rows.map((r) => h('tr', r.map((x) => mdEl('td', String(x)))))))); }
  SQ.tableEl = tableEl;
  function renderQuiz(sec, ctx) {
    const U = ctx.U, qs = ctx.state.quiz = ctx.state.quiz || { ans: {}, submitted: false };
    const box = h('div.blk');
    const hasSql = sec.items.some((it) => it.sql);
    box.append(h('p.note', `共 ${sec.items.length} 題，每題 ${sec.items[0].pts} 分。${hasSql ? '這部分不能執行 SQL，請自己推算（可以在紙上寫出結果）。' : ''}全部答完才可提交，提交後不能再改。`));
    const lists = [];
    sec.items.forEach((it, qi) => {
      const right = correctIndex(it, U);
      const opts = optionList(it, 'q-' + it.id, (i) => { qs.ans[it.id] = i; ctx.save(); upd(); });
      const qb = h('div.blk', { 'data-id': it.id }, h('div.row', h('b', `第 ${qi + 1} 題`), h('span.pts', `${it.pts} 分`)), quizTags(it), mdEl('div.q', it.q),
        it.type === 'fd' ? fdHead(it) : null, it.er ? erEl(it.er) : null, (it.db && it.sql && it.showTables !== false) ? itemTables(it, U) : null, it.sql ? codeView(it.sql) : it.code ? codeView(it.code) : null, it.table ? tableEl(it.table) : null, opts);
      qb.fbSlot = h('div'); qb.append(qb.fbSlot);
      lists.push({ it, opts, right, qb });
      if (ctx.teacher) qb.append(h('div.ans', `答案：${LET[right]}`));
      box.append(qb);
      if (qs.ans[it.id] != null) opts.pick(qs.ans[it.id]);
    });
    const bSub = h('button.btn.primary', { type: 'button' }, '提交小測');
    const sum = h('div', { 'aria-live': 'polite' });
    box.append(h('div.row', bSub), sum);
    function upd() { bSub.disabled = qs.submitted || sec.items.some((it) => qs.ans[it.id] == null); }
    function showResults(fresh) {
      let got = 0;
      for (const L of lists) { const sel = qs.ans[L.it.id]; L.opts.lock(sel, L.right); const ok = sel === L.right; if (ok) got += L.it.pts; L.qb.fbSlot.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對' : `答錯，答案是 ${LET[L.right]}`, L.it.why || null)); }
      sum.replaceChildren(feedback('info', `小測得分：${got} / ${sec.items.reduce((s, x) => s + x.pts, 0)}${fresh ? '' : '（已提交）'}`));
      bSub.hidden = true;
    }
    bSub.onclick = () => {
      if (sec.items.some((it) => qs.ans[it.id] == null)) return;
      qs.submitted = true;
      for (const L of lists) ctx.award(L.it.id, qs.ans[L.it.id] === L.right ? L.it.pts : 0, { done: true, kind: 'quiz', sel: qs.ans[L.it.id] }, true);
      ctx.save(); ctx.refresh(); showResults(true);
    };
    upd(); if (qs.submitted) showResults(false);
    return box;
  }

  // ---------------- 無限練習（隨機生成；答案由引擎計算） ----------------
  let rand = Math.random;
  SQ._setRand = (f) => { rand = f || Math.random; };
  const R = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const NAMES = ['Amy', 'Ben', 'Cathy', 'David', 'Eva', 'Finn', 'Gabe', 'Hugo', 'Ivy', 'Jack', 'Kelly', 'Leo', 'Mandy', 'Nick', 'Olivia', 'Peter', 'Queenie', 'Ray', 'Sam', 'Tina'];
  const sv = (v) => (typeof v === 'string' ? `'${v}'` : String(v));
  function mkStudents(n, nulls) {
    const ns = sample(NAMES, n).sort(() => 0);
    const rows = ns.map((nm, i) => [`S${String(i + 1).padStart(2, '0')}`, nm, pick(['5A', '5B', '5C']), pick(['M', 'F']), nulls && rand() < 0.18 ? null : R(6, 20) * 5]);
    return { STUDENT: [['SID', 'NAME', 'CLASS', 'GENDER', 'SCORE'], rows, ['SID']] };
  }
  // 由正確 SQL 及「錯誤版本」產生選項（答案不同才保留）
  function mcFrom(T, sql, ask, wrongs, fill) {
    const ans = askAnswer({ sql, ask, _T: T });
    const seen = [ans]; const opts = [ans];
    for (const w of shuffle(wrongs)) { if (opts.length >= 4) break; let a; try { a = askAnswer({ sql: w, ask, _T: T }); } catch (e) { continue; } if (!seen.some((x) => same(x, a))) { seen.push(a); opts.push(a); } }
    for (let k = 0; opts.length < 4 && fill && k < 40; k++) { const a = fill(); if (a != null && !seen.some((x) => same(x, a))) { seen.push(a); opts.push(a); } }
    return { ans, options: shuffle(opts) };
  }
  const perturbFill = (ans) => () => { const ls = String(ans).split('\n').map((l) => l.split(', ')); const cells = []; ls.forEach((l, i) => l.forEach((c, j) => { if (isNum(c)) cells.push([i, j]); })); if (!cells.length) return ls.length > 1 ? ls.slice(0, -1).map((l) => l.join(', ')).join('\n') : null; const [i, j] = pick(cells); ls[i][j] = fmtV(Number(ls[i][j]) + pick([-5, -1, 1, 2, 5])); return ls.map((l) => l.join(', ')).join('\n'); };
  const subsetFill = (vals) => () => sample(vals, R(0, Math.min(vals.length, 4))).join(', ');
  const numFill = (ans) => () => { const n = Number(ans); if (!Number.isFinite(n)) return null; return fmtV(n + pick([-2, -1, 1, 2, 3, 5, 10])); };
  const GENS = (SQ.GENS = SQ.GENS || {});
  GENS.sqlWhere = () => {
    const T = E.normDb(mkStudents(R(6, 8), true)), rows = T.STUDENT[1];
    const k = pick(rows.filter((r) => r[4] !== null))[4], k2 = k + pick([10, 15, 20]);
    const L = pick(['A', 'B', 'C', 'D', 'E', 'J', 'K', 'M', 'N', 'P', 'S', 'T']);
    const cls = pick(['5A', '5B', '5C']), cls2 = pick(['5A', '5B', '5C'].filter((c) => c !== cls));
    const forms = [
      [`SCORE >= ${k}`, [`SCORE > ${k}`, `SCORE <= ${k}`, `SCORE < ${k}`]],
      [`CLASS = '${cls}' AND SCORE < ${k}`, [`CLASS = '${cls}' OR SCORE < ${k}`, `CLASS = '${cls}' AND SCORE <= ${k}`, `CLASS <> '${cls}' AND SCORE < ${k}`]],
      [`CLASS = '${cls}' OR GENDER = 'F'`, [`CLASS = '${cls}' AND GENDER = 'F'`, `CLASS <> '${cls}' OR GENDER = 'F'`, `GENDER = 'F'`]],
      [`NOT (CLASS = '${cls}' OR CLASS = '${cls2}')`, [`NOT CLASS = '${cls}' OR CLASS = '${cls2}'`, `CLASS = '${cls}' OR CLASS = '${cls2}'`, `NOT CLASS = '${cls}'`]],
      [`SCORE BETWEEN ${k} AND ${k2}`, [`SCORE > ${k} AND SCORE < ${k2}`, `SCORE NOT BETWEEN ${k} AND ${k2}`, `SCORE >= ${k}`]],
      [`CLASS IN ('${cls}', '${cls2}') AND GENDER = 'M'`, [`CLASS NOT IN ('${cls}', '${cls2}') AND GENDER = 'M'`, `CLASS IN ('${cls}', '${cls2}') OR GENDER = 'M'`, `CLASS IN ('${cls}', '${cls2}')`]],
      [`NAME LIKE '${L}%'`, [`NAME LIKE '%${L}'`, `NAME LIKE '%${L}%'`, `NAME LIKE '_${L}%'`]],
      [`NAME LIKE '%${pick(['a', 'e', 'n', 'y', 'i'])}%' AND SCORE > ${k}`, [`SCORE > ${k}`, `SCORE <= ${k}`]],
      ['SCORE IS NULL', ['SCORE IS NOT NULL', 'SCORE = 0', `SCORE < ${k}`]],
      [`SCORE < ${k} OR SCORE IS NULL`, [`SCORE < ${k}`, `SCORE >= ${k}`, 'SCORE IS NULL']],
      [`NOT SCORE > ${k}`, [`SCORE > ${k}`, `SCORE <= ${k} OR SCORE IS NULL`, `SCORE < ${k}`]],
    ];
    const [c, ws] = pick(forms);
    const sql = `SELECT NAME FROM STUDENT WHERE ${c}`;
    const mc = mcFrom(T, sql, { col: 'NAME' }, ws.map((w) => `SELECT NAME FROM STUDENT WHERE ${w}`), subsetFill(rows.map((r) => r[1])));
    return Object.assign({ type: 'WHERE 篩選', T, sql, ask: { col: 'NAME' }, q: '執行以下 SQL，結果會列出哪些 NAME（按數據表次序）？（留意 NULL：與 NULL 比較的結果是「未知」，不會被選取）' }, mc);
  };
  GENS.sqlAgg = () => {
    let T, sql, ws, ask, q;
    for (let t = 0; t < 30; t++) {
      T = E.normDb(mkStudents(R(6, 8), true));
      const k = R(10, 18) * 5, cls = pick(['5A', '5B', '5C']), f = pick(['SUM', 'AVG', 'MAX', 'MIN']);
      const forms = [
        [`SELECT COUNT(*) FROM STUDENT WHERE CLASS = '${cls}'`, [`SELECT COUNT(*) FROM STUDENT WHERE CLASS <> '${cls}'`, 'SELECT COUNT(*) FROM STUDENT'], [1, 1]],
        ['SELECT COUNT(SCORE) FROM STUDENT', ['SELECT COUNT(*) FROM STUDENT', 'SELECT COUNT(DISTINCT CLASS) FROM STUDENT'], [1, 1]],
        [`SELECT ${f}(SCORE) FROM STUDENT WHERE SCORE >= ${k}`, ['SUM', 'AVG', 'MAX', 'MIN'].filter((x) => x !== f).map((g) => `SELECT ${g}(SCORE) FROM STUDENT WHERE SCORE >= ${k}`).concat([`SELECT ${f}(SCORE) FROM STUDENT`]), [1, 1]],
        ['SELECT AVG(SCORE) FROM STUDENT', ['SELECT SUM(SCORE) / COUNT(*) FROM STUDENT', 'SELECT MAX(SCORE) FROM STUDENT', 'SELECT MIN(SCORE) FROM STUDENT'], [1, 1]],
        ['SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS ORDER BY CLASS', ['SELECT CLASS, COUNT(SCORE) FROM STUDENT GROUP BY CLASS ORDER BY CLASS', "SELECT CLASS, COUNT(*) FROM STUDENT WHERE GENDER = 'F' GROUP BY CLASS ORDER BY CLASS", 'SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS HAVING COUNT(*) >= 2 ORDER BY CLASS'], 'table'],
        [`SELECT CLASS, ${f}(SCORE) FROM STUDENT GROUP BY CLASS ORDER BY CLASS`, ['SUM', 'AVG', 'MAX', 'MIN'].filter((x) => x !== f).map((g) => `SELECT CLASS, ${g}(SCORE) FROM STUDENT GROUP BY CLASS ORDER BY CLASS`), 'table'],
        ['SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS HAVING COUNT(*) >= 2 ORDER BY CLASS', ['SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS HAVING COUNT(*) > 2 ORDER BY CLASS', 'SELECT CLASS, COUNT(*) FROM STUDENT GROUP BY CLASS ORDER BY CLASS', 'SELECT CLASS, COUNT(SCORE) FROM STUDENT GROUP BY CLASS HAVING COUNT(SCORE) >= 2 ORDER BY CLASS'], 'table'],
        [`SELECT GENDER, MAX(SCORE) FROM STUDENT WHERE SCORE < ${k} GROUP BY GENDER ORDER BY GENDER`, [`SELECT GENDER, MAX(SCORE) FROM STUDENT GROUP BY GENDER ORDER BY GENDER`, `SELECT GENDER, MIN(SCORE) FROM STUDENT WHERE SCORE < ${k} GROUP BY GENDER ORDER BY GENDER`], 'table'],
      ];
      const fm = pick(forms); sql = fm[0]; ws = fm[1]; ask = fm[2] === 'table' ? 'table' : { cell: [1, 1] };
      const a = askAnswer({ sql, ask, _T: T });
      if (a.split(/[\n,]/).every((x) => !/\.\d{3,}/.test(x)) && !/NULL/.test(a)) break;
    }
    q = ask === 'table' ? '執行以下 SQL，結果是什麼？（聚合函數會略過 NULL；COUNT(*) 則點算所有記錄）' : '執行以下 SQL，結果是什麼？（聚合函數會略過 NULL；COUNT(*) 則點算所有記錄）';
    const mc = mcFrom(T, sql, ask, ws, (ask === 'table' ? perturbFill : numFill)(askAnswer({ sql, ask, _T: T })));
    return Object.assign({ type: '聚合函數及分組', T, sql, ask, q }, mc);
  };
  const WORDS = ['Luggage', 'Database', 'Computer', 'Elective', 'Keyboard', 'Monitor', 'Network', 'Printer', 'Student', 'Library', 'Hong Kong', 'Sha Tin', 'Ice Cream'];
  GENS.sqlFunc = () => {
    const w = pick(WORDS), n = [...w].length, s = R(1, n - 2), l = R(2, Math.min(4, n - s + 1));
    const y = R(2005, 2014), mo = R(1, 12), d = R(1, 28), dt = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ref = `20${R(24, 26)}-09-01`;
    const forms = [
      [`MID('${w}', ${s}, ${l})`, [`MID('${w}', ${s + 1}, ${l})`, `MID('${w}', ${s - 1 || s + 2}, ${l})`, `MID('${w}', ${s}, ${l + 1})`, `LEFT('${w}', ${l})`]],
      [`LEFT('${w}', ${l})`, [`RIGHT('${w}', ${l})`, `MID('${w}', 2, ${l})`, `LEFT('${w}', ${l + 1})`]],
      [`RIGHT('${w}', ${l})`, [`LEFT('${w}', ${l})`, `MID('${w}', ${l}, ${l})`, `RIGHT('${w}', ${l + 1})`]],
      [`LENGTH('  ${w} ')`, [`LENGTH('${w}')`, `LENGTH('${w}') + 1`, `LENGTH('${w}') + 2`]],
      [`LENGTH(TRIM('  ${w} '))`, [`LENGTH('  ${w} ')`, `LENGTH('${w}') + 1`, `LENGTH('${w}') - 1`]],
      [`UPPER(MID('${w}', ${s}, ${l}))`, [`MID('${w}', ${s}, ${l})`, `UPPER(MID('${w}', ${s + 1}, ${l}))`, `LOWER(MID('${w}', ${s}, ${l}))`]],
      [`CONCAT(LEFT('${w}', ${l}), '-', ${R(1, 9)})`, [`CONCAT(RIGHT('${w}', ${l}), '-', ${R(1, 9)})`, `CONCAT(LEFT('${w}', ${l + 1}), '-', ${R(1, 9)})`]],
      [`MONTH('${dt}')`, [`DAY('${dt}')`, `YEAR('${dt}')`, `MONTH('${dt}') + 1`]],
      [`DAY('${dt}')`, [`MONTH('${dt}')`, `DAY('${dt}') + 1`, `YEAR('${dt}')`]],
      [`TIMESTAMPDIFF(YEAR, '${dt}', '${ref}')`, [`YEAR('${ref}') - YEAR('${dt}')`, `YEAR('${ref}') - YEAR('${dt}') + 1`, `YEAR('${ref}') - YEAR('${dt}') - 1`]],
      [`YEAR('${dt}') + ${R(1, 5)}`, [`YEAR('${dt}')`, `MONTH('${dt}') + ${R(1, 5)}`]],
      [`ABS(${R(2, 9)} - ${R(10, 30)})`, [`${R(2, 9)} - ${R(10, 30)}`]],
    ];
    const [e, ws] = pick(forms);
    const T = {};
    const mc = mcFrom(T, `SELECT ${e}`, { cell: [1, 1] }, ws.map((x) => `SELECT ${x}`), () => null);
    return Object.assign({ type: '函數', T, sql: `SELECT ${e}`, ask: { cell: [1, 1] }, q: '執行以下 SQL，結果是什麼？（MID(字串, 開始位置, 字符數)，位置由 1 開始；空格也算一個字符）', noTables: true }, mc);
  };
  function mkJoinDb() {
    const clubs = sample([['C1', 'Chess'], ['C2', 'Drama'], ['C3', 'Music'], ['C4', 'Robot'], ['C5', 'Swim']], R(3, 4)).sort();
    const extra = ['C8', 'C9'];
    const ns = sample(NAMES, R(5, 7));
    const st = ns.map((nm, i) => [`S${i + 1}`, nm, rand() < 0.15 ? null : rand() < 0.8 ? pick(clubs.slice(0, clubs.length - 1))[0] : pick(extra)]);
    return E.normDb({ STUDENT: [['SID', 'NAME', 'CID'], st, ['SID']], CLUB: [['CID', 'CNAME'], clubs, ['CID']] });
  }
  GENS.sqlJoin = () => {
    const T = mkJoinDb();
    const J = { INNER: 'INNER JOIN', LEFT: 'LEFT JOIN', RIGHT: 'RIGHT JOIN', FULL: 'FULL JOIN', CROSS: 'CROSS JOIN' };
    const k = pick(['INNER', 'LEFT', 'RIGHT', 'FULL', 'INNER', 'LEFT', 'CROSS', 'NATURAL']);
    const mk = (t) => (t === 'CROSS' ? 'SELECT S.NAME, C.CNAME FROM STUDENT S CROSS JOIN CLUB C' : t === 'NATURAL' ? 'SELECT NAME, CNAME FROM STUDENT NATURAL JOIN CLUB' : `SELECT S.NAME, C.CNAME FROM STUDENT S ${J[t]} CLUB C ON S.CID = C.CID`);
    const sql = mk(k);
    const ask = rand() < 0.6 || k === 'CROSS' ? 'rows' : { col: k === 'NATURAL' ? 'NAME' : 'NAME' };
    const others = Object.keys(J).concat(['NATURAL']).filter((t) => t !== k).map(mk);
    const mc = mcFrom(T, sql, ask, others, ask === 'rows' ? numFill(askAnswer({ sql, ask, _T: T })) : subsetFill(T.STUDENT[1].map((r) => r[1])));
    return Object.assign({ type: '連接（JOIN）', T, sql, ask, q: ask === 'rows' ? '執行以下 SQL，結果有多少行？（FULL JOIN 是 DSE 寫法；沒有配對的一方以 NULL 補上）' : '執行以下 SQL，結果中 NAME 欄的值是什麼（按結果次序；NULL 寫成 NULL）？' }, mc);
  };
  GENS.sqlSet = () => {
    const all = sample(NAMES, 9), a = sample(all, R(3, 5)).sort(), b = sample(all, R(3, 5)).sort();
    const T = E.normDb({ CLUB2024: [['NAME'], a.map((x) => [x])], CLUB2025: [['NAME'], b.map((x) => [x])] });
    const ops = ['UNION', 'UNION ALL', 'INTERSECT', 'MINUS'];
    const op = pick(ops), mk = (o, x, y) => `SELECT NAME FROM ${x} ${o} SELECT NAME FROM ${y} ORDER BY NAME`;
    const sql = mk(op, 'CLUB2024', 'CLUB2025');
    const ask = rand() < 0.4 ? 'rows' : { col: 'NAME' };
    const wr = ops.filter((o) => o !== op).map((o) => mk(o, 'CLUB2024', 'CLUB2025')).concat([mk(op, 'CLUB2025', 'CLUB2024')]);
    const mc = mcFrom(T, sql, ask, wr, ask === 'rows' ? numFill(askAnswer({ sql, ask, _T: T })) : subsetFill(all));
    return Object.assign({ type: '集合運算', T, sql, ask, q: ask === 'rows' ? '執行以下 SQL，結果有多少行？（UNION／INTERSECT／MINUS 會刪除重複；UNION ALL 不會）' : '執行以下 SQL，結果中的 NAME 是什麼（按 NAME 排序）？' }, mc);
  };
  GENS.sqlSub = () => {
    const S = mkStudents(R(5, 7), false).STUDENT;
    const n2 = sample(NAMES.filter((x) => !S[1].some((r) => r[1] === x)), R(2, 3));
    const S2 = n2.map((nm, i) => [`T${i + 1}`, nm, pick(['5A', '5B', '5C']), pick(['M', 'F']), R(8, 19) * 5]);
    const T = E.normDb({ STUDENT: S, STUDENT2: [S[0], S2, ['SID']] });
    const forms = [
      ['SCORE > ALL (SELECT SCORE FROM STUDENT2)', ['SCORE > ANY (SELECT SCORE FROM STUDENT2)', 'SCORE < ALL (SELECT SCORE FROM STUDENT2)', 'SCORE >= ALL (SELECT SCORE FROM STUDENT2)']],
      ['SCORE > ANY (SELECT SCORE FROM STUDENT2)', ['SCORE > ALL (SELECT SCORE FROM STUDENT2)', 'SCORE < ANY (SELECT SCORE FROM STUDENT2)', 'SCORE < ALL (SELECT SCORE FROM STUDENT2)']],
      ['SCORE < ALL (SELECT SCORE FROM STUDENT2)', ['SCORE < ANY (SELECT SCORE FROM STUDENT2)', 'SCORE > ALL (SELECT SCORE FROM STUDENT2)', 'SCORE > ANY (SELECT SCORE FROM STUDENT2)']],
      ['CLASS IN (SELECT CLASS FROM STUDENT2)', ['CLASS NOT IN (SELECT CLASS FROM STUDENT2)', 'CLASS <> ANY (SELECT CLASS FROM STUDENT2)', 'CLASS <> ALL (SELECT CLASS FROM STUDENT2)']],
      ['CLASS <> ALL (SELECT CLASS FROM STUDENT2)', ['CLASS <> ANY (SELECT CLASS FROM STUDENT2)', 'CLASS IN (SELECT CLASS FROM STUDENT2)', 'CLASS = ANY (SELECT CLASS FROM STUDENT2)']],
      ['SCORE > (SELECT AVG(SCORE) FROM STUDENT)', ['SCORE < (SELECT AVG(SCORE) FROM STUDENT)', 'SCORE > (SELECT AVG(SCORE) FROM STUDENT2)', 'SCORE >= (SELECT MAX(SCORE) FROM STUDENT)']],
      ['SCORE = (SELECT MAX(SCORE) FROM STUDENT)', ['SCORE = (SELECT MIN(SCORE) FROM STUDENT)', 'SCORE = (SELECT MAX(SCORE) FROM STUDENT2)', 'SCORE > (SELECT AVG(SCORE) FROM STUDENT)']],
      ['EXISTS (SELECT * FROM STUDENT2 T WHERE T.CLASS = STUDENT.CLASS)', ['NOT EXISTS (SELECT * FROM STUDENT2 T WHERE T.CLASS = STUDENT.CLASS)', 'EXISTS (SELECT * FROM STUDENT2 T WHERE T.GENDER = STUDENT.GENDER)']],
    ];
    const [c, ws] = pick(forms);
    const sql = `SELECT NAME FROM STUDENT WHERE ${c}`;
    const mc = mcFrom(T, sql, { col: 'NAME' }, ws.map((w) => `SELECT NAME FROM STUDENT WHERE ${w}`), subsetFill(S[1].map((r) => r[1])));
    return Object.assign({ type: '子查詢', T, sql, ask: { col: 'NAME' }, q: '執行以下 SQL，結果會列出哪些 NAME（按數據表次序）？（> ANY：比最少一個大；> ALL：比所有都大）' }, mc);
  };
  GENS.sqlDml = () => {
    const items = sample([['Pen', 12], ['Ruler', 8], ['Eraser', 5], ['Folder', 15], ['Glue', 10], ['Tape', 9]], 4).map(([n, p], i) => [i + 1, n, p, R(1, 9) * 5]);
    const T = E.normDb({ ITEM: [['ID', 'NAME', 'PRICE', 'QTY'], items, ['ID']] });
    const p = pick(items)[2], k = R(1, 3) * 5, q = pick(items)[3];
    const forms = [
      [`UPDATE ITEM SET QTY = QTY + ${k} WHERE PRICE > ${p}`, [`UPDATE ITEM SET QTY = QTY + ${k} WHERE PRICE >= ${p}`, `UPDATE ITEM SET QTY = QTY + ${k}`, `UPDATE ITEM SET QTY = ${k} WHERE PRICE > ${p}`, `UPDATE ITEM SET QTY = QTY + ${k} WHERE PRICE < ${p}`]],
      [`UPDATE ITEM SET PRICE = PRICE * 2 WHERE QTY < ${q}`, [`UPDATE ITEM SET PRICE = PRICE * 2 WHERE QTY <= ${q}`, `UPDATE ITEM SET PRICE = PRICE * 2`, `UPDATE ITEM SET PRICE = PRICE * 2 WHERE QTY > ${q}`]],
      [`DELETE FROM ITEM WHERE QTY >= ${q}`, [`DELETE FROM ITEM WHERE QTY > ${q}`, `DELETE FROM ITEM WHERE QTY < ${q}`, `DELETE FROM ITEM WHERE QTY <= ${q}`]],
      [`DELETE FROM ITEM WHERE PRICE < ${p} OR QTY > ${q}`, [`DELETE FROM ITEM WHERE PRICE < ${p} AND QTY > ${q}`, `DELETE FROM ITEM WHERE PRICE < ${p}`, `DELETE FROM ITEM WHERE QTY > ${q}`]],
      [`INSERT INTO ITEM (ID, NAME, PRICE) VALUES (5, 'Clip', ${R(2, 9)})`, [`INSERT INTO ITEM VALUES (5, 'Clip', ${R(2, 9)}, 0)`, `UPDATE ITEM SET QTY = NULL WHERE ID = 5`, `DELETE FROM ITEM WHERE ID = 4`]],
    ];
    const [sql, ws] = pick(forms);
    const ask = { after: 'ITEM' };
    const mc = mcFrom(T, sql, ask, ws, perturbFill(askAnswer({ sql, ask, _T: T })));
    return Object.assign({ type: 'INSERT／UPDATE／DELETE', T, sql, ask, q: '執行以下 SQL 後，數據表 ITEM 的內容是什麼？（沒有給值的欄位是 NULL）' }, mc);
  };
  function absRel() {
    for (let t = 0; t < 200; t++) {
      const n = R(4, 5), A = 'ABCDE'.slice(0, n).split(''), F = [];
      for (let i = 0, m = R(2, 4); i < m; i++) { const l = FDX.sorted(sample(A, R(1, 2))), r = FDX.sorted(sample(A.filter((x) => !l.includes(x)), 1)); if (!F.some((f) => FDX.eqs(f[0], l) && FDX.eqs(f[1], r))) F.push([l, r]); }
      const ks = FDX.keys(A, F); if (!ks.length || ks.length > 3 || ks.some((k) => k.length === n || k.length > 3)) continue;
      return { A, F, ks };
    }
    return { A: ['A', 'B', 'C', 'D'], F: [[['A'], ['B']], [['B'], ['C']]], ks: [['A', 'D']] };
  }
  const fdsTxt = (F) => F.map(([l, r]) => `${l.join(',')}->${r.join(',')}`).join('; ');
  GENS.fdKey = () => {
    const { A, F, ks } = absRel(), txt = (S) => S.map(setTxt).join('、');
    const ans = txt(ks), opts = [ans], seen = new Set([ans]);
    const cands = [];
    ks.forEach((k) => { const extra = A.filter((x) => !k.includes(x)); if (extra.length) cands.push(ks.map((x) => (x === k ? FDX.sorted(k.concat(pick(extra))) : x))); if (k.length > 1) cands.push(ks.map((x) => (x === k ? k.slice(0, k.length - 1) : x))); });
    if (ks.length > 1) cands.push([ks[0]]);
    for (let i = 0; i < 20; i++) cands.push([FDX.sorted(sample(A, R(1, 2)))]);
    for (const c of shuffle(cands)) { const s = txt(c); if (opts.length < 4 && !seen.has(s)) { seen.add(s); opts.push(s); } }
    const it = { type: 'fd', attrs: A.join(' '), fds: fdsTxt(F), ask: 'keys' };
    return { type: '候選鍵碼', fd: it, q: '這個關係的候選鍵碼是什麼？（選出「全部」候選鍵碼）', options: shuffle(opts), ans, why: fdInfo(it).why };
  };
  GENS.fdNf = () => {
    const { A, F } = absRel(); const it = { type: 'fd', attrs: A.join(' '), fds: fdsTxt(F), ask: 'nf' }; const f = fdInfo(it);
    return { type: '範式', fd: it, q: '這個關係最高達到第幾範式？（假設已符合 1NF）', options: ['1NF', '2NF', '3NF'], ans: f.text, why: f.why };
  };
  const ER_BANK = [
    ['學生', '班別', '每名學生只屬於一個班別；每個班別有多名學生。', 'M:1'],
    ['班別', '班主任', '每個班別只有一位班主任；每位班主任只負責一個班別。', '1:1'],
    ['學生', '學會', '每名學生可參加多個學會；每個學會有多名學生參加。', 'M:N'],
    ['顧客', '訂單', '每位顧客可下多張訂單；每張訂單只屬於一位顧客。', '1:M'],
    ['作者', '書本', '每位作者可寫多本書；每本書可由多位作者合寫。', 'M:N'],
    ['國家', '首都', '每個國家只有一個首都；每個首都只屬於一個國家。', '1:1'],
    ['員工', '部門', '每位員工只屬於一個部門；每個部門有多位員工。', 'M:1'],
    ['老師', '科目', '每位老師可教多個科目；每個科目可由多位老師任教。', 'M:N'],
    ['動物', '區域', '每隻動物只住在動物園的一個區域；每個區域住了多隻動物。', 'M:1'],
    ['會員', '會員證', '每位會員只有一張會員證；每張會員證只屬於一位會員。', '1:1'],
    ['醫生', '病人', '每位醫生會診治多位病人；每位病人可看多位醫生。', 'M:N'],
    ['出版社', '書本', '每間出版社出版多本書；每本書只由一間出版社出版。', '1:M'],
    ['球隊', '球員', '每支球隊有多名球員；每名球員只屬於一支球隊。', '1:M'],
    ['電影', '演員', '每部電影有多位演員；每位演員可演出多部電影。', 'M:N'],
    ['航班', '機師', '每個航班由一位機長駕駛；每位機長可駕駛多個航班。', 'M:1'],
  ];
  GENS.erCard = () => {
    const [a, b, s, c] = pick(ER_BANK); const flip = rand() < 0.4;
    const card = flip && c !== 'M:N' ? c.split(':').reverse().join(':') : c, x = flip ? b : a, y = flip ? a : b;
    return { type: '實體關係（基數）', q: `${s}\n「${x}」與「${y}」之間的關係（${x}：${y}）是哪一種？`, options: ['1:1', '1:M', 'M:1', 'M:N'], ans: card, why: `一個「${x}」對應${card.split(':')[1] === 'M' || card.split(':')[1] === 'N' ? '多個' : '一個'}「${y}」；一個「${y}」對應${card.split(':')[0] === 'M' ? '多個' : '一個'}「${x}」。`, er: { entities: [{ name: x }, { name: y }], rels: [{ a: x, b: y, name: '?', card: '?:?' }] } };
  };
  SQ.GEN_NAMES = Object.keys(GENS);
  function renderEndless(sec, ctx) {
    const es = ctx.state.endless = ctx.state.endless || { n: 0, right: 0 };
    const box = h('div.blk'), stat = h('p.pts'), area = h('div.blk');
    const updStat = () => { stat.textContent = `已做 ${es.n} 題，答對 ${es.right} 題（不計分，會寫進報告）。`; };
    let lastType = null;
    function next() {
      let g = GENS[pick(sec.gens)]();
      for (let k = 0; k < 4 && sec.gens.length > 1 && g.type === lastType; k++) g = GENS[pick(sec.gens)]();
      lastType = g.type;
      let sel = null, answered = false;
      const tableish = g.sql && isTableAsk(g.ask);
      const fb = h('div', { 'aria-live': 'polite' });
      const bChk = h('button.btn.primary', { type: 'button', disabled: true }, '核對');
      const bNext = h('button.btn', { type: 'button', onclick: next }, '再練一題');
      const after = h('div');
      const btns = g.options.map((o, i) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { if (answered) return; sel = i; btns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); bChk.disabled = false; } }, ansView(o, tableish)));
      bChk.onclick = () => {
        if (answered || sel == null) return;
        answered = true; const ok = same(g.options[sel], g.ans); es.n++; if (ok) es.right++; ctx.save(); updStat();
        btns[sel].classList.add(ok ? 'ok' : 'no'); if (!ok) btns[g.options.findIndex((o) => same(o, g.ans))].classList.add('ok'); bChk.disabled = true;
        fb.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對了！' : '未對。綠色的是正確答案。', g.why || (g.sql ? '可以在下面執行這句 SQL 核對。' : null)));
        if (g.sql) after.replaceChildren(Console({ T: g.T, sql: g.sql, tablesOpen: false }).el);
      };
      area.replaceChildren(...[h('div.row', h('span.pill.prac', h('i', '∞'), g.type)), mdEl('div.q', g.q), g.fd ? fdHead(g.fd) : null, g.er ? erEl(g.er) : null, g.sql && !g.noTables ? h('div.tables.mini', tablesEl(g.T)) : null, g.sql ? codeView(g.sql) : null, h('div.endopts' + (tableish ? '.tall' : ''), { role: 'group', 'aria-label': '選項' }, btns), h('div.row', bChk, bNext), fb, after].filter(Boolean));
    }
    box.append(mdEl('p', sec.intro || '按教科書題型隨機生成，答案由 SQL 引擎計算。想練多少就練多少。'), stat, area);
    updStat(); next();
    return box;
  }

  // ---------------- 學 ----------------
  function renderLearn(blocks, U) {
    const box = h('div.blk');
    box.append(h('span.pill.learn', h('i', '學'), '重點'));
    for (const b of blocks) {
      if (b.h) box.append(h('h3', b.h));
      else if (b.pts) box.append(h('ul.pts-list', b.pts.map((p) => mdEl('li', p))));
      else if (b.p) box.append(mdEl('p', b.p));
      else if (b.note) box.append(mdEl('div.note', b.note));
      else if (b.warn) box.append(mdEl('div.warnbox', b.warn));
      else if (b.fix) { if (typeof b.fix === 'string') box.append(h('p.fixnote', b.fix)); else box.append(h('div.fixpair', h('div.bad', h('b', '✗ 錯誤寫法'), codeView(b.fix.bad)), h('div.good', h('b', '✓ 正確寫法'), codeView(b.fix.good)), b.fix.why ? mdEl('p', b.fix.why) : null)); }
      else if (b.table) { box.append(tableEl(b.table)); if (b.cap) box.append(mdEl('p.cap', b.cap)); }
      else if (b.code) { if (b.cap) box.append(mdEl('p.cap', b.cap)); box.append(codeView(b.code)); }
      else if (b.sim) { if (b.cap) box.append(mdEl('p', b.cap)); box.append(Console({ T: dbOf(U, b.sim.db), sql: b.sim.sql, open: b.sim.open }).el); }
      else if (b.er) { box.append(erEl(b.er)); if (b.cap) box.append(mdEl('p.cap', b.cap)); }
      else if (b.tables) { if (b.cap) box.append(mdEl('p.cap', b.cap)); box.append(tablesEl(dbOf(U, b.tables.db || b.tables), { names: b.tables.names, open: b.tables.open })); }
    }
    return box;
  }
  SQ.renderLearn = renderLearn;

  const KIND_TITLE = { write: '寫SQL', quiz: '小測', endless: '無限練習', report: '交功課' };
  function defaultTitles(U) { (U.sections || []).forEach((sec, i) => { if (!sec.title) sec.title = sec.kind === 'write' ? (U.writeLabel || (U.theory ? '分析題' : '寫SQL')) : KIND_TITLE[sec.kind] || `第 ${i + 1} 節`; if (!sec.id) sec.id = sec.kind || 's' + (i + 1); }); return U; }
  SQ.defaultTitles = defaultTitles;
  // ---------------- 單元頁 ----------------
  SQ.unit = function (U, CRS) {
    CRS = CRS || {};
    SQ._unit = U; SQ._course = CRS;
    defaultTitles(U);
    const PIN = CRS.pin || '';
    const KEY = `sqlp:${CRS.code || 'c'}:${U.id}:v1`;
    const blank = () => ({ reg: null, sec: 0, visited: [0], items: {}, drafts: {}, quiz: { ans: {}, submitted: false }, endless: { n: 0, right: 0 }, started: new Date().toISOString() });
    let S = Object.assign(blank(), store.get(KEY) || {});
    let teacher = false;
    const save = () => store.set(KEY, S);
    const app = document.getElementById('app');
    const allItems = [];
    for (const sec of U.sections) {
      (sec.tries || []).forEach((it) => allItems.push({ id: it.id, cat: 'try', pts: it.pts, sec: sec.id }));
      (sec.practice || []).forEach((it) => allItems.push({ id: it.id, cat: 'prac', pts: it.pts, sec: sec.id }));
      (sec.tasks || []).forEach((it) => allItems.push({ id: it.id, cat: 'write', pts: it.pts, sec: sec.id }));
      (sec.kind === 'quiz' ? sec.items || [] : []).forEach((it) => allItems.push({ id: it.id, cat: 'quiz', pts: it.pts, sec: sec.id }));
    }
    const CATS = { try: '試', prac: '練', write: U.writeLabel || (U.theory ? '分析題' : '寫SQL'), quiz: '小測' };
    const MAX = allItems.reduce((s, x) => s + x.pts, 0);
    const got = (filter) => allItems.filter(filter || (() => true)).reduce((s, x) => s + ((S.items[x.id] || {}).pts || 0), 0);
    const maxOf = (filter) => allItems.filter(filter).reduce((s, x) => s + x.pts, 0);
    const secDone = (sec) => {
      if (sec.kind === 'quiz') return !!S.quiz.submitted;
      if (sec.kind === 'endless') return S.endless.n > 0;
      if (sec.kind === 'report') return !!S.reported;
      const ids = allItems.filter((x) => x.sec === sec.id).map((x) => x.id);
      if (!ids.length) return S.visited.includes(U.sections.indexOf(sec));
      return ids.every((id) => (S.items[id] || {}).done);
    };
    const ctx = {
      U, get state() { return S; }, save, get teacher() { return teacher; },
      award(id, pts, extra, silent) { const cur = S.items[id] || {}; if (cur.done) return; S.items[id] = Object.assign({}, cur, extra, { pts: extra.done ? pts : 0 }); save(); if (!silent) refreshHead(); },
      refresh: () => refreshHead(),
    };
    const scoreB = h('b'); const whoEl = h('div.who');
    const head = h('header.top', h('div.brand', h('span.kicker', `${CRS.kicker || 'HKDSE ICT'} · ${U.id.toUpperCase()}`), h('h1', U.title), h('span.pages', U.book || '')), h('div', { style: { display: 'grid', gap: '6px', justifyItems: 'end' } }, h('div.scorebox', scoreB, h('span', `/ ${MAX} 分`)), whoEl));
    const progList = h('ol'); const progBar = h('i');
    const prog = h('nav.prog', { 'aria-label': '單元進度' }, progList, h('div.bar', progBar));
    const main = h('main', { id: 'main' });
    const tBar = h('div.teacherbar', { hidden: true }, '老師模式：可跳到任何一節，答案會顯示在題目下面。報告會註明「老師模式」。');
    const pinIn = h('input', { type: 'password', 'aria-label': '老師 PIN', size: 10, style: { fontSize: '14px', padding: '2px 6px' } });
    const pinMsg = h('span');
    const pinBox = h('span.row', { hidden: true }, pinIn, h('button.iconbtn', { type: 'button', onclick: tryPin }, '確定'), pinMsg);
    const foot = h('footer', h('a', { href: '../' }, '← 返回目錄'), h('span', '頁面在瀏覽器內運行，進度只儲存在這部裝置。'), store.ok ? null : h('b', { style: { color: 'var(--bad)' } }, '注意：這個瀏覽器不能儲存進度（例如私密模式），離開頁面後進度會消失。'), h('span.spacer'), themeBtn(), h('button.iconbtn', { type: 'button', onclick: () => { pinBox.hidden = !pinBox.hidden; if (!pinBox.hidden) pinIn.focus(); } }, '老師'), pinBox);
    function tryPin() { if (PIN && pinIn.value === PIN) { teacher = true; tBar.hidden = false; pinBox.hidden = true; pinMsg.textContent = ''; render(); } else pinMsg.textContent = 'PIN 不正確'; }
    pinIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryPin(); });
    app.replaceChildren(h('div.wrap', head, tBar, prog, main, foot));
    function refreshHead() {
      scoreB.textContent = got();
      whoEl.replaceChildren();
      if (S.reg) whoEl.append(h('span', h('b', S.reg.cls), ' 班 ', h('b', S.reg.no), ' 號 ', h('b', S.reg.name)), h('button.iconbtn', { type: 'button', onclick: () => { regForm(true); } }, '✎ 更改'));
      progList.replaceChildren();
      U.sections.forEach((sec, i) => {
        const can = teacher || S.visited.includes(i) || S.visited.includes(i - 1);
        progList.append(h('li', h('button' + (secDone(sec) ? '.done' : ''), { type: 'button', disabled: !can || !S.reg, 'aria-current': i === S.sec ? 'step' : null, onclick: () => go(i) }, h('span.n', secDone(sec) ? '✓' : String(i + 1)), sec.title)));
      });
      progBar.style.width = `${MAX ? Math.round((100 * got()) / MAX) : 0}%`;
      const cur = progList.querySelector('[aria-current]'); if (cur && progList.scrollWidth > progList.clientWidth) progList.scrollLeft = Math.max(0, cur.offsetLeft - progList.offsetLeft - 40);
    }
    function go(i) { S.sec = i; if (!S.visited.includes(i)) S.visited.push(i); save(); render(); window.scrollTo({ top: 0 }); }
    function regForm(edit) {
      const r = S.reg || {};
      const cls = h('input', { type: 'text', value: r.cls || '', placeholder: '例如 5A', maxlength: 6, autocomplete: 'off' });
      const no = h('input', { type: 'text', inputmode: 'numeric', value: r.no || '', placeholder: '例如 12', maxlength: 3, autocomplete: 'off' });
      const nm = h('input', { type: 'text', value: r.name || '', placeholder: '例如 陳大文', maxlength: 20, autocomplete: 'off' });
      const msg = h('p.pts', { 'aria-live': 'polite' });
      const card = h('section.card.reg', h('h2', { style: { margin: 0 } }, edit ? '更改登記資料' : '開始前請先登記'), h('p', { style: { margin: 0 } }, '資料只用於「交功課」報告，儲存在這部裝置。'),
        h('label', '班別', cls), h('label', '學號', no), h('label', '姓名', nm), msg,
        h('div.row', h('button.btn.primary', { type: 'button', id: 'reg-go', onclick: () => {
          const c = cls.value.trim().toUpperCase(), n = no.value.trim(), m = nm.value.trim();
          if (!c || !n || !m) { msg.textContent = '請填寫班別、學號及姓名。'; return; }
          if (!/^\d{1,3}$/.test(n)) { msg.textContent = '學號只可以是數字。'; return; }
          S.reg = { cls: c, no: n, name: m }; save(); render();
        } }, edit ? '儲存' : '開始'), edit ? h('button.btn.ghost', { type: 'button', onclick: render }, '取消') : null));
      main.replaceChildren(card); refreshHead(); cls.focus();
    }
    function render() {
      if (!S.reg) { regForm(false); return; }
      refreshHead();
      const i = Math.min(S.sec, U.sections.length - 1), sec = U.sections[i];
      const card = h('section.card', { 'aria-labelledby': 'sec-title' });
      card.append(h('div.sec-head', h('span.pts', `第 ${i + 1} 節（共 ${U.sections.length} 節）`), h('h2#sec-title', sec.title), sec.pages ? h('span.pages', sec.pages) : null));
      if (sec.intro && sec.kind !== 'endless') card.append(mdEl('p', sec.intro));
      if (sec.learn) card.append(renderLearn(sec.learn, U));
      for (const it of sec.tries || []) card.append(renderTry(it, ctx));
      for (const it of sec.practice || []) card.append(SQ.renderPractice(it, ctx));
      if (sec.kind === 'write') for (const t of sec.tasks) card.append(t.kind === 'table' ? renderTableTask(t, ctx) : renderWrite(t, ctx));
      if (sec.kind === 'quiz') card.append(renderQuiz(sec, ctx));
      if (sec.kind === 'endless') card.append(renderEndless(sec, ctx));
      if (sec.kind === 'report') card.append(renderReport());
      const prev = h('button.btn', { type: 'button', disabled: i === 0, onclick: () => go(i - 1) }, '← 上一節');
      const next = h('button.btn.primary', { type: 'button', disabled: i === U.sections.length - 1, onclick: () => go(i + 1) }, '下一節 →');
      main.replaceChildren(card, h('div.navbtm', prev, next));
    }
    const APP = (CRS.code || '') + 'SQL自學平台';
    function report() {
      const parts = {};
      for (const c of Object.keys(CATS)) { const m = maxOf((x) => x.cat === c); if (m) parts[c] = [got((x) => x.cat === c), m]; }
      const items = {}; for (const x of allItems) items[x.id] = (S.items[x.id] || {}).pts || 0;
      const rep = { app: APP, course: CRS.code || '', unit: U.id, title: U.title, ver: 1, cls: S.reg.cls, no: S.reg.no, name: S.reg.name, score: got(), max: MAX, parts, items, endless: { n: S.endless.n, right: S.endless.right }, teacher, started: S.started, time: new Date().toISOString() };
      rep.sig = SQ.signReport(rep, U.key);
      return rep;
    }
    function reportText(rep) {
      const p = Object.entries(rep.parts).map(([c, [g, m]]) => `${CATS[c]} ${g}/${m}`).join('；');
      return [`${CRS.title || APP} 交功課報告`, `單元：${rep.unit.toUpperCase()} ${rep.title}`, `班別：${rep.cls}　學號：${rep.no}　姓名：${rep.name}`, `總分：${rep.score} / ${rep.max}`, p, `無限練習：做了 ${rep.endless.n} 題，答對 ${rep.endless.right} 題`, `提交時間：${new Date(rep.time).toLocaleString('zh-HK')}${rep.teacher ? '（老師模式）' : ''}`, '----- 以下報告資料請勿修改，否則簽名會失效 -----', JSON.stringify(rep)].join('\n');
    }
    function renderReport() {
      const box = h('div.blk');
      const rows = U.sections.filter((s) => allItems.some((x) => x.sec === s.id)).map((s) => h('tr', h('td', s.title), h('td.num', String(got((x) => x.sec === s.id))), h('td.num', String(maxOf((x) => x.sec === s.id)))));
      box.append(h('div.scroll', h('table.tb.sumtab', h('thead', h('tr', h('th', '部分'), h('th.num', '得分'), h('th.num', '滿分'))), h('tbody', rows, h('tr', h('th', '總分'), h('th.num', String(got())), h('th.num', String(MAX)))))));
      box.append(h('p.pts', Object.keys(CATS).filter((c) => maxOf((x) => x.cat === c)).map((c) => `${CATS[c]} ${got((x) => x.cat === c)}/${maxOf((x) => x.cat === c)}`).join('　') + `　｜　無限練習 ${S.endless.n} 題（答對 ${S.endless.right}）`));
      const ta = h('textarea.report', { readonly: true, 'aria-label': '報告內容', hidden: true });
      const msg = h('p.pts', { 'aria-live': 'polite' });
      const bGen = h('button.btn.primary', { type: 'button' }, '產生報告');
      const bDl = h('button.btn', { type: 'button', hidden: true }, '下載報告');
      const bCp = h('button.btn', { type: 'button', hidden: true }, '複製報告');
      let txt = '', rep = null;
      bGen.onclick = () => { rep = report(); txt = reportText(rep); ta.value = txt; ta.hidden = false; bDl.hidden = bCp.hidden = false; S.reported = true; save(); refreshHead(); msg.textContent = '報告已產生。請下載或複製，再按老師指示提交（例如上載到 Google Classroom）。'; };
      bDl.onclick = () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })), download: `${CRS.code || 'SQL'}_${U.id}_${rep.cls}_${rep.no}_${rep.name}.txt` }); document.body.append(a); a.click(); a.remove(); msg.textContent = '已開始下載。如果沒有下載到檔案，請改用「複製報告」。'; } catch (e) { msg.textContent = '這個環境不能下載檔案，請改用「複製報告」。'; } };
      bCp.onclick = async () => {
        let ok = false;
        try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) { /* 改用選取 */ }
        if (!ok) { try { ta.focus(); ta.select(); ok = document.execCommand('copy'); } catch (e) { ok = false; } }
        msg.textContent = ok ? '已複製報告，可以貼上給老師。' : '未能自動複製，請按住報告文字全選後複製。';
        if (!ok) { ta.focus(); ta.select(); }
      };
      box.append(h('p', '完成各節後，按「產生報告」。報告附有數碼簽名，老師會在教師頁核對；改動分數會令簽名失效。'), h('div.row', bGen, bDl, bCp), msg, ta);
      return box;
    }
    render();
    SQ._ctx = ctx; SQ._state = () => S;
  };

  // ---------------- 教師頁 ----------------
  const dt = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return isNaN(d) ? '' : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  SQ.teacher = function (TT) {
    const CRS = TT.course || {}, PIN = CRS.pin || '';
    SQ._course = CRS;
    const app = document.getElementById('app');
    const keys = {}; TT.units.forEach((u) => { keys[u.id] = u.key; });
    const pin = h('input', { type: 'password', 'aria-label': '老師 PIN', autocomplete: 'off' });
    const msg = h('p.pts', { 'aria-live': 'polite' });
    const gate = h('section.card.reg', h('h2', { style: { margin: 0 } }, '輸入老師 PIN'), h('p.note', '注意：PIN 寫在公開的網站程式碼內，任何人都可以看到；這只是方便老師使用，並不是保安措施。學生報告的分數由 HMAC 簽名保護。'), h('label', 'PIN', pin), msg, h('div.row', h('button.btn.primary', { type: 'button', id: 'pin-go', onclick: unlock }, '進入')));
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlock(); });
    const head = h('header.top', h('div.brand', h('span.kicker', CRS.kicker || 'HKDSE ICT'), h('h1', `${CRS.title || 'SQL 自學平台'}　教師頁`), h('span.pages', '核對簽名報告、匯總 CSV、各單元答案及重點')), h('div', themeBtn()));
    const main = h('main');
    app.replaceChildren(h('div.wrap', head, main, h('footer', h('a', { href: '../' }, '← 返回目錄'))));
    main.append(gate);
    function unlock() { if (!PIN || pin.value !== PIN) { msg.textContent = 'PIN 不正確'; return; } main.replaceChildren(verifier(), ...TT.units.map(answerSheet)); }
    function parseReports(text) {
      const out = []; const re = /\{"app":/g; let m; const starts = [];
      while ((m = re.exec(text))) starts.push(m.index);
      for (const s of starts) {
        let depth = 0, q = false, e = -1;
        for (let i = s; i < text.length; i++) { const c = text[i]; if (q) { if (c === '\\') i++; else if (c === '"') q = false; continue; } if (c === '"') q = true; else if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) { e = i; break; } } }
        if (e > 0) { try { out.push(JSON.parse(text.slice(s, e + 1))); } catch (er) { out.push({ bad: '未能讀取' }); } }
      }
      if (!starts.length && text.trim()) { try { out.push(JSON.parse(text.trim())); } catch (e) { /* 略 */ } }
      return out;
    }
    const WL = '寫SQL／分析';
    function verifier() {
      const ta = h('textarea.report', { 'aria-label': '貼上報告', placeholder: '把學生的報告（整段文字或 JSON）貼在這裏，可以一次貼多份。' });
      const file = h('input', { type: 'file', multiple: true, accept: '.txt,.json,text/plain,application/json', 'aria-label': '上載報告檔案' });
      const res = h('div');
      let rows = [];
      const csvOf = () => {
        const head = ['狀態', '單元', '班別', '學號', '姓名', '總分', '滿分', '試', '練', WL, '小測', '無限練習題數', '無限練習答對', '老師模式', '提交時間'];
        const q = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        return '﻿' + [head, ...rows.map((r) => [r.status, r.unit, r.cls, r.no, r.name, r.score, r.max, ...['try', 'prac', 'write', 'quiz'].map((c) => (r.parts && r.parts[c] ? r.parts[c][0] : '')), r.endless ? r.endless.n : '', r.endless ? r.endless.right : '', r.teacher ? '是' : '', r.time ? dt(r.time) : '']).map((x) => x.map(q).join(','))].join('\r\n');
      };
      const show = () => {
        const tb = h('tbody', rows.map((r) => h('tr', h('td', { style: { color: r.status === '✓ 簽名正確' ? 'var(--good)' : 'var(--bad)', fontWeight: 700 } }, r.status), h('td', r.unit || ''), h('td', r.cls || ''), h('td', r.no || ''), h('td', r.name || ''), h('td.num', r.score != null ? `${r.score}/${r.max}` : ''),
          ...['try', 'prac', 'write', 'quiz'].map((c) => h('td.num', r.parts && r.parts[c] ? `${r.parts[c][0]}/${r.parts[c][1]}` : '')), h('td.num', r.endless ? `${r.endless.right}/${r.endless.n}` : ''), h('td', r.teacher ? '老師模式' : ''), h('td', r.time ? dt(r.time) : ''))));
        const dl = h('button.btn', { type: 'button', onclick: () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([csvOf()], { type: 'text/csv;charset=utf-8' })), download: `${CRS.code || 'SQL'}_報告匯總.csv` }); document.body.append(a); a.click(); a.remove(); } catch (e) { /* 略 */ } } }, '下載 CSV');
        const cp = h('button.btn', { type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(csvOf()); cp.textContent = '已複製'; } catch (e) { cp.textContent = '未能複製'; } } }, '複製 CSV');
        res.replaceChildren(h('p', `共 ${rows.length} 份報告；簽名正確 ${rows.filter((r) => r.status === '✓ 簽名正確').length} 份。`), h('div.scroll', h('table.tb.sumtab#rep-table', h('thead', h('tr', ['狀態', '單元', '班別', '學號', '姓名', '總分', '試', '練', WL, '小測', '無限練習（對/做）', '模式', '提交時間'].map((x) => h('th', x)))), tb)), h('div.row', dl, cp));
      };
      const add = (text) => {
        for (const r of parseReports(text)) {
          let status;
          if (r.bad) status = '✗ 未能讀取';
          else if (!keys[r.unit]) status = '✗ 未知單元';
          else status = SQ.verifyReport(r, keys[r.unit]) ? '✓ 簽名正確' : '✗ 簽名不符（報告曾被修改）';
          if (rows.some((x) => x.raw === canon(r))) continue;
          rows.push(Object.assign({}, r, { status, raw: canon(r) }));
        }
        rows.sort((a, b) => String(a.unit).localeCompare(String(b.unit)) || String(a.cls).localeCompare(String(b.cls)) || Number(a.no) - Number(b.no));
        show();
      };
      const bGo = h('button.btn.primary', { type: 'button', id: 'verify-go', onclick: () => { add(ta.value); } }, '核對');
      const bClr = h('button.btn.ghost', { type: 'button', onclick: () => { rows = []; ta.value = ''; res.replaceChildren(); } }, '清除');
      file.addEventListener('change', async () => { for (const f of file.files) add(await f.text()); });
      return h('section.card', h('h2', { style: { margin: 0 } }, '核對學生報告'), h('p', '可貼上報告文字，或選擇多個報告檔案（.txt）。系統會檢查 HMAC 簽名，並匯總成 CSV（可用 Excel 開啟）。'), ta, h('div.row', bGo, bClr, h('label.row', '上載檔案：', file)), res);
    }
    function answerSheet(U) {
      defaultTitles(U);
      const body = h('div.blk');
      const det = h('details.ansheet', h('summary', `${U.id.toUpperCase()} ${U.title}：答案及重點`), body);
      det.addEventListener('toggle', () => { if (det.open && !body.children.length) body.append(...sheetBody(U)); });
      return h('section.card', det);
    }
    const ansTxt = (s) => String(s).replace(/\n/g, ' / ');
    function sheetBody(U) {
      const out = [h('p.pts', U.book || '')];
      let total = 0;
      for (const sec of U.sections) {
        const blk = h('div.blk', h('h3', sec.title + (sec.pages ? `（${sec.pages}）` : '')));
        if (sec.learn) { const pts = sec.learn.filter((b) => b.pts).flatMap((b) => b.pts); if (pts.length) blk.append(h('ul.pts-list', pts.map((p) => mdEl('li', p)))); }
        const rows = [];
        const safe = (f) => { try { return f(); } catch (e) { return '（' + e.message + '）'; } };
        for (const it of sec.tries || []) { rows.push(['試', it.id, it.pts, it.src || '', safe(() => { const r = correctIndex(it, U); return `${LET[r]}. ${ansTxt(it.options[r])}`; })]); total += it.pts; }
        for (const it of sec.practice || []) {
          const a = safe(() => {
            if (it.type === 'mc' || (it.type === 'fd' && it.options)) { const r = correctIndex(it, U); return `${LET[r]}. ${ansTxt(it.options[r])}`; }
            if (it.type === 'fill') { const v = fillAnswers(it, U); return it.blanks.map((b, i) => `${b.label} ${ansTxt(v[i]) || '（沒有記錄）'}`).join('；'); }
            if (it.type === 'fd') return fdInfo(it).text;
            if (it.type === 'complete') return { sql: subBlanks(it.template, it.ref) };
            return '';
          });
          rows.push(['練', it.id, it.pts, it.src || '', a]); total += it.pts;
        }
        for (const t of sec.tasks || []) { rows.push([t.kind === 'table' ? '分析題' : '寫SQL', t.id, t.pts, t.src || '', t.kind === 'table' ? tableAnswerText(t) : { sql: t.ref }]); total += t.pts; }
        if (sec.kind === 'quiz') for (const it of sec.items || []) { rows.push(['小測', it.id, it.pts, it.src || '', safe(() => { const r = correctIndex(it, U); return `${LET[r]}. ${ansTxt(it.options[r])}` + ((it.tags || []).length ? `（${it.tags.map((x) => (x.t === 'hot' ? '常考' : '易錯') + '：' + x.why).join('；')}）` : ''); })]); total += it.pts; }
        if (rows.length) blk.append(h('div.scroll', h('table.tb', h('thead', h('tr', ['類別', '編號', '分', '出處', '答案'].map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.slice(0, 4).map((x) => h('td', String(x))), h('td', r[4] && r[4].sql ? codeView(r[4].sql) : String(r[4]))))))));
        if (sec.kind === 'endless') blk.append(h('p.pts', `隨機題型：${sec.gens.join('、')}（答案由引擎計算，不計分）。`));
        out.push(blk);
      }
      out.splice(1, 0, h('p.pts', `總分 ${total}。`));
      return out;
    }
  };
  void hasDoc;
})();
