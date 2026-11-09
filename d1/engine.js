/* D1 偽代碼引擎（香港 DSE ICT 必修 D1 教科書寫法）
 * 以練習室 dryrun/index.html 的 tokenize／parseProgram／evalNode／buildTrace 為基礎擴充。
 * 瀏覽器：window.D1E；Node：module.exports。
 */
(function (root) {
  'use strict';

  class DRError extends Error {
    constructor(m, kind, line) { super(m); this.kind = kind || 'run'; if (line != null) this.line = line; }
  }

  const REL = { '=': '=', '==': '=', '<>': '<>', '!=': '<>', '≠': '<>', '<': '<', '>': '>', '<=': '<=', '≤': '<=', '>=': '>=', '≥': '>=' };
  const KWS = { AND: 1, OR: 1, NOT: 1, TRUE: 1, FALSE: 1 };
  const CJK = /[㐀-鿿豈-﫿]/;

  // ---------- 數值格式 ----------
  const round = (v) => (Number.isInteger(v) ? v : Math.round(v * 1e9) / 1e9);
  function fmt(v) {
    if (typeof v === 'boolean') return v ? 'True' : 'False';
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      const r = Math.round(v * 10000) / 10000;
      return String(Object.is(r, -0) ? 0 : r);
    }
    if (v && typeof v === 'object' && v.__arr) return '[' + arrList(v).map((x) => (x === undefined ? '' : fmt(x))).join(', ') + ']';
    if (v === undefined || v === null) return '';
    return String(v);
  }
  const fmtB = (v) => (v ? 'True' : 'False');
  function arrList(A) {
    const ks = Object.keys(A).filter((k) => k !== '__arr').map(Number);
    if (!ks.length) return [];
    const hi = Math.max(...ks);
    const out = [];
    for (let i = 1; i <= hi; i++) out.push(A[i]);
    return out;
  }
  const newArr = () => Object.defineProperty({}, '__arr', { value: true, enumerable: false });
  const copyArr = (A) => Object.assign(newArr(), A);

  // ---------- 前處理：全形符號、註解 ----------
  const FW = { '（': '(', '）': ')', '，': ',', '＜': '<', '＞': '>', '＝': '=', '＋': '+', '－': '-', '＊': '*', '／': '/', '×': '*', '−': '-', '÷': '/', '［': '[', '］': ']', '“': '"', '”': '"', '‘': "'", '’': "'", '！': '!' };
  function normLine(raw) {
    let lead = raw.match(/^[ \t　]*/)[0];
    const ind = lead.replace(/\t/g, '    ').replace(/　/g, '  ').length;
    let s = raw.slice(lead.length), out = '', q = null;
    for (let i = 0; i < s.length; i++) {
      let c = s[i];
      if (q) { if (c === '”' || c === '’') c = FW[c]; out += c; if (c === q) q = null; continue; }
      if (FW[c] && (c === '“' || c === '‘')) { q = FW[c] === '"' ? '"' : "'"; out += FW[c]; continue; }
      if (c === '"' || c === "'") { q = c; out += c; continue; }
      if (c === '/' && s[i + 1] === '/') break;
      if (FW[c]) c = FW[c];
      out += c;
    }
    // 把字串內的全形右引號 ” 也統一
    out = out.replace(/”/g, '"').replace(/’/g, "'");
    return { ind, s: out.trim() };
  }

  // ---------- 詞法 ----------
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (s.startsWith('的整數部分', i)) { t.push({ k: 'post', v: 'idiv', p: i, e: i + 5 }); i += 5; continue; }
      if (s.startsWith('的餘數', i)) { t.push({ k: 'post', v: 'mod', p: i, e: i + 3 }); i += 3; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
        let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const txt = s.slice(i, j);
        if ((txt.match(/\./g) || []).length > 1) throw new DRError(`數字「${txt}」寫法不正確`, 'parse');
        t.push({ k: 'num', v: parseFloat(txt), p: i, e: j }); i = j; continue;
      }
      if (c === "'" || c === '"' || c === '「') {
        const cl = c === '「' ? '」' : c; const j = s.indexOf(cl, i + 1);
        if (j < 0) throw new DRError('字串缺少收尾的引號', 'parse');
        t.push({ k: 'str', v: s.slice(i + 1, j), p: i, e: j + 1, ch: c === "'" }); i = j + 1; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
        const w = s.slice(i, j), u = w.toUpperCase();
        t.push(KWS[u] ? { k: 'kw', v: u, p: i, e: j } : { k: 'id', v: w, p: i, e: j }); i = j; continue;
      }
      const two = s.slice(i, i + 2);
      if (two === '=<' || two === '=>') throw new DRError(`「${two}」應寫作「${two[1]}=」（關係運算符不會以等號起頭）`, 'parse');
      if (two === '<=' || two === '>=' || two === '<>' || two === '!=' || two === '==') { t.push({ k: 'op', v: two, p: i, e: i + 2 }); i += 2; continue; }
      if (c === '^' || c === '²') throw new DRError('偽代碼沒有次方符號，平方請寫成 height * height', 'parse');
      if (c === '%') throw new DRError('偽代碼不用「%」', 'parse');
      if ('<>=≤≥≠+-*/()[],'.includes(c)) { t.push({ k: 'op', v: c, p: i, e: i + 1 }); i++; continue; }
      if (c === '←') throw new DRError('算式中間不可以再有「←」', 'parse');
      throw new DRError(`無法理解的符號「${c}」`, 'parse');
    }
    return t;
  }

  // ---------- 算式 ----------
  function parseExpr(src) {
    const tk = tokenize(src); let p = 0;
    const peek = () => tk[p];
    const isOp = (v) => tk[p] && tk[p].k === 'op' && tk[p].v === v;
    const isKw = (v) => tk[p] && tk[p].k === 'kw' && tk[p].v === v;
    const sp = (node, a, b) => { node.p = a; node.e = b; node.src = src.slice(a, b); return node; };
    const need = (v) => { const t = tk[p++]; if (!t || t.v !== v) throw new DRError(`算式「${src}」缺少「${v}」`, 'parse'); return t; };
    function or() { let l = and(); while (isKw('OR')) { p++; const r = and(); l = sp({ t: 'or', a: l, b: r }, l.p, r.e); } return l; }
    function and() { let l = not(); while (isKw('AND')) { p++; const r = not(); l = sp({ t: 'and', a: l, b: r }, l.p, r.e); } return l; }
    function not() { if (isKw('NOT')) { const s = tk[p++]; const a = not(); return sp({ t: 'not', a }, s.p, a.e); } return cmp(); }
    function cmp() {
      const l = add(); const t = peek();
      if (t && t.k === 'op' && REL[t.v]) {
        p++; const r = add();
        const t2 = peek();
        if (t2 && t2.k === 'op' && REL[t2.v]) throw new DRError(`「${src}」不可以連續比較，要用 AND 分開寫`, 'parse');
        return sp({ t: 'cmp', op: REL[t.v], a: l, b: r }, l.p, r.e);
      }
      return l;
    }
    function add() { let l = mul(); while (isOp('+') || isOp('-')) { const op = tk[p++].v; const r = mul(); l = sp({ t: 'bin', op, a: l, b: r }, l.p, r.e); } return l; }
    function mul() { let l = un(); while (isOp('*') || isOp('/')) { const op = tk[p++].v; const r = un(); l = sp({ t: 'bin', op, a: l, b: r }, l.p, r.e); } return l; }
    function un() { if (isOp('-')) { const s = tk[p++]; const a = un(); return sp({ t: 'neg', a }, s.p, a.e); } if (isOp('+')) { p++; return un(); } return post(); }
    function post() {
      const t = peek();
      if (t && t.k === 'op' && t.v === '(') {
        p++; const inner = or(); const c = need(')'); let node = sp({ t: 'paren', a: inner }, t.p, c.e);
        if (peek() && peek().k === 'post') {
          const pt = tk[p++];
          if (inner.t !== 'bin' || inner.op !== '/') throw new DRError('「的餘數」「的整數部分」前面要是 (a / b)', 'parse');
          node = sp({ t: pt.v, a: inner.a, b: inner.b }, t.p, pt.e);
        }
        return node;
      }
      return prim();
    }
    function prim() {
      const t = tk[p++]; if (!t) throw new DRError(`算式「${src}」不完整`, 'parse');
      if (t.k === 'num') return sp({ t: 'num', v: t.v }, t.p, t.e);
      if (t.k === 'str') return sp({ t: 'str', v: t.v }, t.p, t.e);
      if (t.k === 'kw' && (t.v === 'TRUE' || t.v === 'FALSE')) return sp({ t: 'bool', v: t.v === 'TRUE' }, t.p, t.e);
      if (t.k === 'op' && t.v === '[') {
        const items = [];
        if (!isOp(']')) { items.push(or()); while (isOp(',')) { p++; items.push(or()); } }
        const c = need(']');
        return sp({ t: 'list', items }, t.p, c.e);
      }
      if (t.k === 'id') {
        if (isOp('[')) {
          p++;
          if (isOp(']')) { const c = tk[p++]; return sp({ t: 'whole', n: t.v }, t.p, c.e); }
          const i = or(); const c = need(']'); return sp({ t: 'idx', n: t.v, i }, t.p, c.e);
        }
        return sp({ t: 'var', n: t.v }, t.p, t.e);
      }
      if (t.k === 'kw') throw new DRError(`「${t.v}」位置不正確`, 'parse');
      throw new DRError(`算式「${src}」無法理解`, 'parse');
    }
    if (!tk.length) throw new DRError('缺少算式', 'parse');
    const node = or();
    if (p < tk.length) {
      const rest = src.slice(tk[p].p).trim();
      if (/^則/.test(rest)) throw new DRError('「則」前面要留空格', 'parse');
      throw new DRError(`算式「${src}」在「${rest}」附近無法理解`, 'parse');
    }
    return node;
  }

  function splitArgs(s) {
    const out = []; let d = 0, q = null, cur = '';
    for (const c of s) {
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === '(' || c === '[') d++; if (c === ')' || c === ']') d--;
      if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  const outsideStr = (s) => s.replace(/"[^"]*"|'[^']*'|「[^」]*」/g, '""');

  // ---------- 語句 ----------
  function parseProgram(code, opt) {
    opt = opt || {};
    const RAW = String(code).replace(/\r/g, '').split('\n');
    const L = RAW.map((raw, i) => Object.assign({ i }, normLine(raw))).filter((l) => l.s);
    const warnings = [];
    let p = 0, uid = 0;
    const nid = () => 'n' + (++uid);
    const fail = (l, m) => { throw new DRError(`第 ${l.i + 1} 行：${m}`, 'parse', l.i); };
    const warn = (l, m) => warnings.push({ line: l.i, msg: `第 ${l.i + 1} 行：${m}` });
    const ex = (src, l) => { try { return parseExpr(src); } catch (e) { fail(l, e.message); } };
    const target = (src, l) => {
      const n = ex(src, l);
      if (n.t !== 'var' && n.t !== 'idx' && n.t !== 'whole') fail(l, `「${src}」不是變量，不能放在「←」左邊或「輸入」後面`);
      return n;
    };
    function block(ind) {
      const out = [];
      while (p < L.length) {
        const l = L[p];
        if (l.ind < ind) break;
        if (l.ind > ind) fail(l, '縮排不正確（這一行比上一行多了縮排）');
        if (/^(否則|直至)/.test(l.s)) break;
        out.push(stmt(l));
      }
      return out;
    }
    function body(h, what) {
      if (p >= L.length || L[p].ind <= h.ind) fail(h, `「${what}」下面缺少要執行的語句（要縮排）`);
      return block(L[p].ind);
    }
    function condOf(src, l, kw) {
      if (!src.trim()) fail(l, `「${kw}」後面缺少條件`);
      return ex(src, l);
    }
    function ifStmt(l, s, isElif) {
      const kw = isElif ? '否則如果' : '如果';
      let m = s.match(isElif ? /^否則\s*如果\s*(.*?)\s*則$/ : /^如果\s*(.*?)\s*則$/);
      let src;
      if (m) src = m[1];
      else {
        src = s.replace(isElif ? /^否則\s*如果/ : /^如果/, '').trim();
        if (p < L.length && L[p].s === '則') p++;
        else if (opt.strictThen) fail(l, `「${kw}」後面缺少「則」`);
        else if (/則\s*\S/.test(outsideStr(src))) fail(l, '「則」後面的語句要寫在下一行，並且縮排');
        else warn(l, `「${kw}」後面通常寫「則」`);
      }
      return { id: nid(), cond: condOf(src, l, kw), condSrc: src.trim(), line: l.i, text: s };
    }
    function stmt(l) {
      p++; const s = l.s; let m; const base = { id: nid(), line: l.i, text: s };
      if (/^如果/.test(s)) {
        const first = ifStmt(l, s, false); first.body = body(l, '如果'); const br = [first]; let els = null;
        while (p < L.length && L[p].ind === l.ind && /^否則/.test(L[p].s)) {
          const e = L[p];
          if (/^否則\s*如果/.test(e.s)) { p++; const b = ifStmt(e, e.s, true); b.body = body(e, '否則如果'); br.push(b); }
          else if (e.s === '否則' || e.s === '否則:' || e.s === '否則：') { p++; els = { id: nid(), line: e.i, text: e.s }; els.body = body(e, '否則'); break; }
          else fail(e, '「否則」後面不應有其他文字（語句要寫在下一行並縮排）');
        }
        return Object.assign(base, { t: 'if', br, els, end: L[p - 1].i });
      }
      if (/^否則/.test(s)) fail(l, '「否則」前面沒有對應的「如果」（或縮排沒有對齊）');
      if (/^直至/.test(s)) fail(l, '「直至」前面沒有對應的「重複」（或縮排沒有對齊）');
      if (/^則$/.test(s)) fail(l, '「則」前面沒有「如果」');
      if (/^設/.test(s)) {
        m = s.match(/^設\s*([A-Za-z_]\w*)\s*由\s*(.+?)\s*(下至|遞減至|至|到)\s*(.+?)(?:\s*執行)?$/);
        if (!m) fail(l, '「設」循環要寫成「設 i 由 1 至 10」或「設 i 由 10 下至 1」');
        const b = body(l, '設');
        return Object.assign(base, { t: 'for', v: m[1], from: ex(m[2], l), to: ex(m[4], l), fromSrc: m[2].trim(), toSrc: m[4].trim(), down: m[3] === '下至' || m[3] === '遞減至', body: b, end: L[p - 1].i });
      }
      if (s === '重複') {
        const b = body(l, '重複'); const u = L[p];
        if (!u || u.ind !== l.ind || !(m = u.s.match(/^直至\s*(.*)$/))) fail(l, '「重複」缺少對齊的「直至 條件」');
        p++; return Object.assign(base, { t: 'repeat', body: b, cond: condOf(m[1], u, '直至'), condSrc: m[1].trim(), condLine: u.i, end: u.i });
      }
      if (s === '執行') {
        const b = body(l, '執行'); const u = L[p];
        if (!u || u.ind !== l.ind || !(m = u.s.match(/^當\s*(.*)$/))) fail(l, '「執行」缺少對齊的「當 條件」');
        p++; return Object.assign(base, { t: 'dowhile', body: b, cond: condOf(m[1], u, '當'), condSrc: m[1].trim(), condLine: u.i, end: u.i });
      }
      if (/^當/.test(s)) {
        m = s.match(/^當\s*(.*?)(?:\s*執行)?$/);
        const c = condOf(m[1], l, '當'); const b = body(l, '當');
        return Object.assign(base, { t: 'while', cond: c, condSrc: m[1].trim(), body: b, end: L[p - 1].i });
      }
      if (/^輸入/.test(s)) {
        const rest = s.replace(/^輸入/, '').trim();
        if (!rest) fail(l, '「輸入」後面缺少變量');
        return Object.assign(base, { t: 'input', targets: splitArgs(rest).map((a) => target(a, l)) });
      }
      if (/^輸出/.test(s)) {
        const rest = s.replace(/^輸出/, '').trim();
        if (!rest) fail(l, '「輸出」後面缺少內容');
        return Object.assign(base, { t: 'output', args: splitArgs(rest).map((a) => ex(a, l)) });
      }
      if (/^調用/.test(s)) return Object.assign(base, { t: 'call', name: s.replace(/^調用/, '').trim() });
      // 賦值
      const os = outsideStr(s);
      let k = os.indexOf('←'), op = '←';
      if (k < 0) {
        const mm = os.match(/^([A-Za-z_]\w*\s*(?:\[[^\]]*\])?)\s*(<-|=)(?!=)/);
        if (mm) { k = mm[1].length + os.slice(mm[1].length).indexOf(mm[2]); op = mm[2]; }
      }
      if (k > 0) {
        const lhsSrc = s.slice(0, k).trim(), rhsSrc = s.slice(k + op.length).trim();
        if (!rhsSrc) fail(l, `「${op}」右邊缺少算式`);
        if (op === '=') warn(l, '這裏用了「=」賦值；偽代碼一般寫「←」');
        const lhs = target(lhsSrc, l);
        let rhs;
        try { rhs = parseExpr(rhsSrc); } catch (e) {
          if (CJK.test(outsideStr(rhsSrc))) { rhs = { t: 'descval', src: rhsSrc }; warn(l, `「${rhsSrc}」是文字描述，模擬器會使用測試數據預設的值`); }
          else fail(l, e.message);
        }
        return Object.assign(base, { t: 'assign', lhs, rhs, op });
      }
      if (k === 0) fail(l, '「←」左邊缺少變量');
      if (CJK.test(s[0])) { warn(l, `「${s}」當作文字描述的步驟（不改變任何變量）`); return Object.assign(base, { t: 'desc' }); }
      fail(l, `無法理解「${s}」`);
    }
    const prog = block(L.length ? L[0].ind : 0);
    if (p < L.length) {
      const l = L[p];
      if (/^否則/.test(l.s)) fail(l, '「否則」前面沒有對應的「如果」（或縮排沒有對齊）');
      if (/^直至/.test(l.s)) fail(l, '「直至」前面沒有對應的「重複」（或縮排沒有對齊）');
      fail(l, '縮排不正確');
    }
    return { prog, warnings, nLines: RAW.length, src: String(code) };
  }

  // ---------- 求值 ----------
  const typeName = (v) => typeof v === 'number' ? '數值' : typeof v === 'boolean' ? '布爾值' : typeof v === 'string' ? '字串' : '陣列';
  const num = (v, what) => { if (typeof v !== 'number') throw new DRError(`${what || ''}「${fmt(v)}」是${typeName(v)}，不能做數學運算`); return v; };
  const bool = (v) => { if (typeof v !== 'boolean') throw new DRError(`「${fmt(v)}」不是布爾值（True／False）`); return v; };
  const toInt = (v) => { num(v); if (!Number.isInteger(v)) throw new DRError(`索引 ${fmt(v)} 不是整數`); return v; };
  function evalNode(n, env) {
    switch (n.t) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'list': { const A = newArr(); n.items.forEach((x, j) => { A[j + 1] = evalNode(x, env); }); return A; }
      case 'var':
        if (Object.prototype.hasOwnProperty.call(env.v, n.n)) return env.v[n.n];
        if (env.a[n.n]) return env.a[n.n];
        throw new DRError(`變量 ${n.n} 未有值（要先賦值或輸入）`);
      case 'whole': if (env.a[n.n]) return env.a[n.n]; throw new DRError(`陣列 ${n.n} 未有值`);
      case 'idx': {
        const i = toInt(evalNode(n.i, env));
        if (!env.a[n.n] && typeof env.v[n.n] === 'string') {
          const s = env.v[n.n]; if (i < 1 || i > s.length) throw new DRError(`${n.n}[${i}] 超出字串範圍`); return s[i - 1];
        }
        const A = env.a[n.n];
        if (!A) throw new DRError(`陣列 ${n.n} 未有值`);
        if (!(i in A)) throw new DRError(`${n.n}[${i}] 未有值（陣列沒有這個項目，或未賦值）`);
        return A[i];
      }
      case 'paren': return evalNode(n.a, env);
      case 'neg': return round(-num(evalNode(n.a, env)));
      case 'bin': {
        const a = evalNode(n.a, env), b = evalNode(n.b, env);
        if (n.op === '+' && typeof a === 'string' && typeof b === 'string') return a + b;
        num(a); num(b);
        if (n.op === '+') return round(a + b); if (n.op === '-') return round(a - b); if (n.op === '*') return round(a * b);
        if (b === 0) throw new DRError(`「${n.src}」除以 0`); return round(a / b);
      }
      case 'mod': case 'idiv': {
        const a = num(evalNode(n.a, env)), b = num(evalNode(n.b, env)); if (b === 0) throw new DRError('除以 0');
        const q = Math.floor(a / b); return n.t === 'idiv' ? q : round(a - b * q);
      }
      case 'cmp': {
        const a = evalNode(n.a, env), b = evalNode(n.b, env);
        if (n.op === '=') return a === b; if (n.op === '<>') return a !== b;
        if (typeof a !== typeof b || typeof a === 'boolean' || typeof a === 'object') throw new DRError(`不能比較「${n.src}」（${typeName(a)}與${typeName(b)}）`);
        if (n.op === '<') return a < b; if (n.op === '>') return a > b; if (n.op === '<=') return a <= b; return a >= b;
      }
      case 'and': return bool(evalNode(n.a, env)) ? bool(evalNode(n.b, env)) : false;
      case 'or': return bool(evalNode(n.a, env)) ? true : bool(evalNode(n.b, env));
      case 'not': return !bool(evalNode(n.a, env));
    }
    throw new DRError('未支援的算式');
  }
  const isBoolNode = (n) => ['cmp', 'and', 'or', 'not'].includes(n.t) || (n.t === 'paren' && isBoolNode(n.a));
  function leaves(n, acc) { if (n.t === 'var' || n.t === 'idx') { acc.push(n); return acc; } for (const k of ['a', 'b']) if (n[k]) leaves(n[k], acc); return acc; }
  function subst(n, env) {
    let s = n.src; const off = n.p;
    for (const l of leaves(n, []).sort((x, y) => y.p - x.p)) {
      let v; try { v = evalNode(l, env); } catch (e) { continue; }
      const t = typeof v === 'string' ? `"${v}"` : fmt(v);
      s = s.slice(0, l.p - off) + t + s.slice(l.e - off);
    }
    return s;
  }
  function condDesc(n, env) {
    const steps = [];
    (function walk(x) {
      if (x.t === 'var' || x.t === 'idx') return;
      for (const k of ['a', 'b']) if (x[k]) walk(x[k]);
      if (['cmp', 'and', 'or', 'not'].includes(x.t)) {
        let v; try { v = evalNode(x, env); } catch (e) { return; }
        steps.push(`${x.src}${x.t === 'cmp' ? `（${subst(x, env)}）` : ''} 是 ${fmtB(v)}`);
      }
    })(n);
    if (!steps.length) { try { return `${n.src} 是 ${fmt(evalNode(n, env))}`; } catch (e) { return ''; } }
    return steps.join('；');
  }

  // ---------- 輸入數據 ----------
  function parseValue(t) {
    t = String(t).trim();
    if (/^["'「].*["'」]$/.test(t) && t.length >= 2) return t.slice(1, -1);
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return Number(t);
    if (/^true$/i.test(t)) return true; if (/^false$/i.test(t)) return false;
    return t;
  }
  function parseInputs(text) {
    if (Array.isArray(text)) return text.slice();
    const s = String(text == null ? '' : text).replace(/[，、；;]/g, ',').replace(/\n/g, ',');
    return splitArgs(s).filter((x) => x !== '').map(parseValue);
  }

  // ---------- 執行 ----------
  const snapOf = (env) => ({ v: Object.assign({}, env.v), a: Object.fromEntries(Object.entries(env.a).map(([k, o]) => [k, copyArr(o)])) });

  function run(code, init, opt) {
    init = init || {}; opt = opt || {};
    const parsed = typeof code === 'string' ? parseProgram(code, opt) : code;
    const prog = parsed.prog;
    const env = { v: {}, a: {} };
    for (const [k, v] of Object.entries(init.vars || {})) {
      if (Array.isArray(v)) { const A = newArr(); v.forEach((x, j) => { if (x != null) A[j + 1] = x; }); env.a[k] = A; } else env.v[k] = v;
    }
    for (const [k, arr] of Object.entries(init.arrays || {})) { const A = newArr(); arr.forEach((x, j) => { if (x !== null && x !== undefined) A[j + 1] = x; }); env.a[k] = A; }
    const inputs = parseInputs(init.inputs || []); const inputsUsed = [];
    const out = []; const events = []; const path = [{ id: 'S' }]; const counts = {};
    let steps = 0;
    const max = opt.maxSteps || 5000, tr = opt.trace !== false;
    const loopStack = [];
    const initSnap = snapOf(env);
    const emit = (e) => { if (tr) { e.snap = snapOf(env); e.outN = out.length; e.pathN = path.length; events.push(e); } };
    const tick = (n, line) => {
      counts[line] = (counts[line] || 0) + 1;
      if (++steps > max) {
        const L = loopStack[loopStack.length - 1];
        let msg = `執行超過 ${max} 步仍未完結，很可能是無限循環。`;
        if (L) {
          if (L.t === 'for') msg += `第 ${L.line + 1} 行的 for 循環一直未能完成，檢查循環體有沒有改變 ${L.v}。`;
          else {
            const always = L.t === 'repeat' ? '一直不成立' : '一直成立';
            msg += `第 ${(L.condLine != null ? L.condLine : L.line) + 1} 行的循環條件「${L.condSrc}」${always}，循環停不了。檢查循環體內有沒有改變條件中的變量。`;
          }
        }
        throw new DRError(msg, 'loop', L ? L.line : n.line);
      }
    };
    const ev = (n) => evalNode(n, env);
    const cond = (n) => { const v = ev(n); if (typeof v !== 'boolean') throw new DRError(`條件「${n.src}」的結果不是 True／False`); return v; };
    const store = (t, val) => {
      if (t.t === 'whole' || (t.t === 'var' && val && typeof val === 'object' && val.__arr)) {
        if (!(val && typeof val === 'object' && val.__arr)) throw new DRError(`${t.n}[] 右邊要是陣列，例如 [1, 2, 3]`);
        env.a[t.n] = copyArr(val); delete env.v[t.n]; return;
      }
      if (t.t === 'var') { if (env.a[t.n]) delete env.a[t.n]; env.v[t.n] = val; return; }
      const i = toInt(ev(t.i));
      if (i < 1) throw new DRError(`索引 ${i} 不正確（陣列索引由 1 開始）`);
      if (!env.a[t.n]) env.a[t.n] = newArr();
      env.a[t.n][i] = val;
    };
    const lhsName = (t) => (t.t === 'var' ? t.n : t.t === 'whole' ? t.n + '[]' : `${t.n}[${fmt(ev(t.i))}]`);
    const assignDesc = (n, name, val) => {
      if (n.rhs.t === 'descval') return `${n.text}　→　（文字描述）${name} = ${fmt(val)}`;
      if (isBoolNode(n.rhs)) return `${n.text}　→　${condDesc(n.rhs, env)}，所以 ${name} = ${fmt(val)}`;
      if (['num', 'str', 'bool', 'list'].includes(n.rhs.t)) return `${n.text}　→　${name} = ${fmt(val)}`;
      const sub = subst(n.rhs, env); return `${n.text}　→　${name} = ${sub}${sub !== fmt(val) ? ' = ' + fmt(val) : ''}`;
    };
    function exec(list) { for (const n of list) one(n); }
    function guard(n, f) {
      try { f(); } catch (e) {
        if (e instanceof DRError && e.line == null) { e.line = n.line; e.message = `第 ${n.line + 1} 行：${e.message}`; }
        throw e;
      }
    }
    function one(n) {
      switch (n.t) {
        case 'assign': guard(n, () => {
          tick(n, n.line);
          let val;
          if (n.rhs.t === 'descval') {
            const nm = n.lhs.n;
            if (n.lhs.t === 'var' && Object.prototype.hasOwnProperty.call(init.vars || {}, nm)) val = init.vars[nm];
            else throw new DRError(`「${n.rhs.src}」是文字描述，模擬器不能計算；請在測試數據中預設 ${nm} 的值`);
          } else val = ev(n.rhs);
          const name = lhsName(n.lhs); const d = tr ? assignDesc(n, name, val) : '';
          store(n.lhs, val); path.push({ id: n.id }); emit({ k: 'stmt', n, line: n.line, desc: d });
        }); return;
        case 'input': guard(n, () => {
          tick(n, n.line);
          const parts = [];
          for (const t of n.targets) {
            if (!inputs.length) throw new DRError('「輸入」沒有數據了——請在「輸入數據」多加數值');
            const val = inputs.shift(); inputsUsed.push(val); const name = lhsName(t); store(t, val); parts.push(`${name} = ${fmt(val)}`);
          }
          path.push({ id: n.id }); emit({ k: 'stmt', n, line: n.line, desc: `${n.text}　→　${parts.join('，')}` });
        }); return;
        case 'output': guard(n, () => {
          tick(n, n.line);
          const vals = n.args.map((a) => fmt(ev(a)));
          out.push(vals.join(' ')); path.push({ id: n.id });
          emit({ k: 'stmt', n, line: n.line, desc: `${n.text}　→　輸出 ${vals.join(' ')}` });
        }); return;
        case 'call': case 'desc': guard(n, () => {
          tick(n, n.line); path.push({ id: n.id });
          emit({ k: 'stmt', n, line: n.line, desc: `${n.text}　→　（${n.t === 'call' ? '調用模組' : '文字描述的步驟'}，不改變變量）` });
        }); return;
        case 'if': {
          for (const b of n.br) {
            let v;
            guard(b, () => { tick(b, b.line); const d = tr ? condDesc(b.cond, env) : ''; v = cond(b.cond); path.push({ id: b.id, o: v ? 'y' : 'n' }); emit({ k: 'cond', n: b, line: b.line, val: v, desc: `${b.text}　→　${d}，${v ? '執行「則」部分' : (b === n.br[n.br.length - 1] ? (n.els ? '執行「否則」部分' : '跳過') : '檢查下一個條件')}` }); });
            if (v) { exec(b.body); return; }
          }
          if (n.els) exec(n.els.body);
          return;
        }
        case 'while': {
          loopStack.push(n); emit({ k: 'loopstart', n, line: n.line });
          for (;;) {
            let v;
            guard(n, () => { tick(n, n.line); const d = tr ? condDesc(n.cond, env) : ''; v = cond(n.cond); path.push({ id: n.id, o: v ? 'y' : 'n' }); emit({ k: 'check', n, line: n.line, val: v, desc: `當 ${n.condSrc}　→　${d}，${v ? '執行循環體' : '離開循環'}` }); });
            if (!v) break;
            exec(n.body); emit({ k: 'iterend', n, line: n.line });
          }
          loopStack.pop(); emit({ k: 'loopexit', n, line: n.line }); return;
        }
        case 'repeat': case 'dowhile': {
          loopStack.push(n); emit({ k: 'loopstart', n, line: n.line });
          for (;;) {
            exec(n.body); emit({ k: 'iterend', n, line: n.line });
            let v;
            guard({ line: n.condLine }, () => {
              tick(n, n.condLine); const d = tr ? condDesc(n.cond, env) : ''; v = cond(n.cond); path.push({ id: n.id, o: v ? 'y' : 'n' });
              const again = n.t === 'repeat' ? !v : v;
              emit({ k: 'check', n, line: n.condLine, val: v, desc: `${n.t === 'repeat' ? '直至' : '當'} ${n.condSrc}　→　${d}，${again ? '再執行循環體' : '離開循環'}` });
            });
            if (n.t === 'repeat' ? v : !v) break;
          }
          loopStack.pop(); emit({ k: 'loopexit', n, line: n.line }); return;
        }
        case 'for': {
          let a, b;
          guard(n, () => { a = num(ev(n.from), '起始值'); b = num(ev(n.to), '最終值'); });
          loopStack.push(n);
          env.v[n.v] = a; path.push({ id: n.id + 'i' });
          emit({ k: 'loopstart', n, line: n.line, from: a, to: b });
          for (;;) {
            const i = env.v[n.v];
            const ok = typeof i === 'number' && (n.down ? i >= b : i <= b);
            guard(n, () => tick(n, n.line));
            path.push({ id: n.id + 't', o: ok ? 'y' : 'n' });
            if (!ok) { emit({ k: 'forend', n, line: n.line, desc: `${n.v} = ${fmt(i)}，${n.v} ${n.down ? '>=' : '<='} ${fmt(b)} 不成立，離開循環` }); break; }
            emit({ k: 'iter', n, line: n.line, v: i, desc: `設 ${n.v} ← ${fmt(i)}` });
            exec(n.body); emit({ k: 'iterend', n, line: n.line });
            guard(n, () => { env.v[n.v] = round(num(env.v[n.v]) + (n.down ? -1 : 1)); });
            path.push({ id: n.id + 'u' });
          }
          loopStack.pop(); emit({ k: 'loopexit', n, line: n.line }); return;
        }
      }
      throw new DRError('未支援的語句');
    }
    let error = null;
    try { exec(prog); path.push({ id: 'E' }); emit({ k: 'end' }); }
    catch (e) {
      if (!(e instanceof DRError)) throw e;
      error = e; if (tr) events.push({ k: 'error', line: e.line, desc: e.message, snap: snapOf(env), outN: out.length, pathN: path.length });
    }
    return { parsed, prog, out, events, env, initSnap, steps, path, counts, error, ok: !error, inputsUsed, inputsLeft: inputs };
  }

  // ---------- 小工具 ----------
  const walkProg = (list, f) => { for (const n of list) { f(n); if (n.t === 'if') { n.br.forEach((b) => walkProg(b.body, f)); if (n.els) walkProg(n.els.body, f); } else if (n.body) walkProg(n.body, f); } };
  const progHas = (prog, t) => { let h = false; walkProg(prog, (n) => { if (n.t === t) h = true; }); return h; };
  const isLoop = (n) => ['while', 'repeat', 'dowhile', 'for'].includes(n.t);
  const valIn = (snap, ast) => { try { return fmt(evalNode(ast, snap)); } catch (e) { return ''; } };
  const countLine = (res, line) => res.counts[line] || 0;

  // 自動選出變量欄：按首次出現的次序（純量；陣列整個顯示）
  function autoCols(res, within) {
    const seen = [];
    let prev = res.initSnap;
    for (const k of Object.keys(prev.v)) if (!seen.includes(k)) seen.push(k);
    for (const k of Object.keys(prev.a)) if (!seen.includes(k + '[]')) seen.push(k + '[]');
    for (const e of res.events) {
      if (!e.snap || (within && !within(e))) continue;
      for (const k of Object.keys(e.snap.v)) if (!seen.includes(k)) seen.push(k);
      for (const k of Object.keys(e.snap.a)) if (!seen.includes(k + '[]')) seen.push(k + '[]');
    }
    return seen;
  }
  const idents = (ast) => { const s = new Set(); (function w(x) { if (!x) return; if (x.t === 'var' || x.t === 'idx' || x.t === 'whole') s.add(x.n); for (const k of ['a', 'b', 'i']) if (x[k]) w(x[k]); })(ast); return s; };
  const colAst = (src) => (/\[\]$/.test(src) ? { t: 'whole', n: src.slice(0, -2) } : parseExpr(src));

  // ---------- 追蹤表 ----------
  // mode 'stmt'：逐句一行（教科書 p.39–41）；mode 'iter'：每次循環一行（p.112–121）
  function buildTrace(res, spec) {
    spec = spec || {};
    const out = res.out;
    const slice = (a, b) => out.slice(a, b).join(' ');
    const hasOut = progHas(res.prog, 'output');
    const mode = spec.mode || (res.prog.some(isLoop) ? 'iter' : 'stmt');
    if (mode === 'stmt') {
      const vnames = spec.cols || autoCols(res).filter((c) => !(spec.hide || []).includes(c));
      const vcols = vnames.map((src) => ({ key: src, label: src, kind: 'var', ast: colAst(src) }));
      const hasCond = res.events.some((e) => e.k === 'cond' || e.k === 'check');
      const cols = [...vcols, ...(hasCond && spec.cond !== false ? [{ key: '?cond', label: '條件', kind: 'cond' }] : []), ...(hasOut && spec.out !== false ? [{ key: '?out', label: '輸出', kind: 'out' }] : [])];
      const rows = []; let prev = res.initSnap, prevOut = 0;
      for (const e of res.events) {
        if (!['stmt', 'cond', 'check', 'iter'].includes(e.k)) continue;
        const cells = {};
        for (const c of cols) {
          if (c.kind === 'var') { const v = valIn(e.snap, c.ast), pv = valIn(prev, c.ast); cells[c.key] = { v, changed: v !== pv }; }
          else if (c.kind === 'cond') cells[c.key] = { v: e.k === 'cond' || e.k === 'check' ? fmtB(e.val) : '', changed: e.k === 'cond' || e.k === 'check' };
          else { const v = slice(prevOut, e.outN); cells[c.key] = { v, changed: !!v }; }
        }
        rows.push({ label: e.k === 'iter' ? e.desc : e.k === 'check' ? (e.n.t === 'repeat' ? '直至 ' : '當 ') + e.n.condSrc : e.n.text, line: e.line, cells, desc: [e.desc] });
        prev = e.snap; prevOut = e.outN;
      }
      return { mode: 'stmt', cols, rows };
    }
    // iter
    let M = null;
    if (spec.loopLine != null) walkProg(res.prog, (n) => { if (!M && isLoop(n) && n.line === spec.loopLine) M = n; });
    else M = res.prog.find(isLoop);
    if (!M) throw new DRError('找不到循環');
    const condIfs = [];
    if (spec.condCols !== false) walkProg(M.body, (n) => { if (n.t === 'if') n.br.forEach((b) => condIfs.push(b)); });
    const inLoop = (e) => e.line != null && e.line >= M.line && e.line <= M.end;
    const vnames = spec.cols || autoCols(res).filter((c) => c !== (M.t === 'for' ? M.v : null) && !(spec.hide || []).includes(c));
    const vcols = vnames.map((src) => ({ key: src, label: src, kind: 'var', ast: colAst(src) }));
    const lc = M.t === 'for' ? { key: '?i', label: M.v, kind: 'loopvar' } : { key: '?lc', label: M.condSrc, kind: 'loopcond', post: M.t !== 'while' };
    const ccols = (spec.condSrcs || condIfs.map((b) => b.condSrc)).map((src, j) => ({ key: '?c' + j, label: src, kind: 'ifcond', br: condIfs[j] }));
    const oc = hasOut && spec.out !== false ? [{ key: '?out', label: '輸出', kind: 'out' }] : [];
    const cols = [...(lc.kind === 'loopvar' || !lc.post ? [lc] : []), ...ccols, ...vcols, ...(lc.post && !spec.condLast ? [lc] : []), ...oc, ...(lc.post && spec.condLast ? [lc] : [])];
    const loopDep = (c) => M.t === 'for' && c.kind === 'var' && idents(c.ast).has(M.v);
    const rows = [];
    let stage = 'pre', prev = res.initSnap, prevOut = 0, desc = [], k = 0, condVals = {}, loopVal = null, lastSnap = res.initSnap, lastOut = 0;
    const mk = (label, snap, outN, kind) => {
      const cells = {};
      for (const c of cols) {
        if (c.kind === 'var') { const v = valIn(snap, c.ast), pv = valIn(prev, c.ast); cells[c.key] = { v, changed: (kind === 'pre' || kind === 'post') && loopDep(c) ? false : kind === 'pre' ? v !== '' : v !== pv }; }
        else if (c.kind === 'loopvar') cells[c.key] = { v: loopVal == null ? '' : fmt(loopVal), changed: loopVal != null };
        else if (c.kind === 'loopcond') cells[c.key] = { v: condVals.loop == null ? '' : fmtB(condVals.loop), changed: condVals.loop != null };
        else if (c.kind === 'ifcond') { const x = c.br ? condVals[c.br.id] : undefined; cells[c.key] = { v: x == null ? '' : fmtB(x), changed: x != null }; }
        else { const v = slice(prevOut, outN); cells[c.key] = { v, changed: !!v }; }
      }
      rows.push({ label, kind, cells, desc }); prev = snap; prevOut = outN; desc = []; condVals = {}; loopVal = null;
    };
    for (const e of res.events) {
      if (e.snap) { lastSnap = e.snap; lastOut = e.outN; }
      if (stage === 'pre') {
        if (e.n === M && e.k === 'loopstart') { mk(spec.preLabel || '進入循環前', M.t === 'for' ? (() => { const s = snapOf({ v: Object.assign({}, e.snap.v), a: e.snap.a }); delete s.v[M.v]; return s; })() : e.snap, e.outN, 'pre'); stage = 'loop'; }
        else if (e.desc) desc.push(e.desc);
        continue;
      }
      if (stage === 'loop') {
        if (e.n === M) {
          if (e.k === 'loopexit') { stage = 'post'; continue; }
          if (M.t === 'while') {
            if (e.k === 'check') { desc.push(e.desc); condVals.loop = e.val; if (!e.val) { k++; mk(`第 ${k} 次循環（條件不成立）`, prev, prevOut, 'exit'); } }
            else if (e.k === 'iterend') { k++; mk(`完成第 ${k} 次循環後`, e.snap, e.outN, 'loop'); }
          } else if (M.t === 'for') {
            if (e.k === 'iter') { desc.push(e.desc); loopVal = e.v; }
            else if (e.k === 'iterend') { k++; mk(`完成 ${M.v} = ${fmt(e.snap.v[M.v])} 的循環體後`, e.snap, e.outN, 'loop'); }
          } else if (e.k === 'check') { desc.push(e.desc); condVals.loop = e.val; k++; mk(`完成第 ${k} 次循環後`, e.snap, e.outN, 'loop'); }
          continue;
        }
        if (e.k === 'cond' && condIfs.includes(e.n)) condVals[e.n.id] = e.val;
        if (e.desc) desc.push(e.desc);
        continue;
      }
      if (e.k === 'error') { desc.push(e.desc); continue; }
      if (e.desc) desc.push(e.desc);
    }
    if (stage === 'post' && (desc.length || lastOut > prevOut)) mk(spec.postLabel || '離開循環後', lastSnap, lastOut, 'post');
    return { mode: 'iter', loop: M, cols, rows };
  }

  // ---------- 答案比較 ----------
  const toks = (s) => String(s == null ? '' : s).normalize('NFKC').replace(/[，、,;；\[\]]/g, ' ').replace(/['"「」‘’“”]/g, '').trim().split(/\s+/).filter(Boolean)
    .map((t) => {
      const u = t.toUpperCase();
      if (u === 'TRUE' || t === '真' || u === 'T') return 'TRUE';
      if (u === 'FALSE' || t === '假' || u === 'F') return 'FALSE';
      if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return String(Math.round(Number(t) * 10000) / 10000);
      return u;
    });
  const same = (a, e) => {
    const A = toks(a), E = toks(e);
    if (A.join(' ') === E.join(' ')) return true;
    return (A.length === 1 && E.length > 1 && A[0] === E.join('')) || (E.length === 1 && A.length > 1 && E[0] === A.join(''));
  };
  // 比較兩組輸出（逐行）；數值容許 0.0001 誤差
  function sameOutput(got, exp) {
    const g = toks(got.join('\n')), x = toks(exp.join('\n'));
    if (g.length !== x.length) return false;
    for (let i = 0; i < g.length; i++) {
      if (g[i] === x[i]) continue;
      const a = Number(g[i]), b = Number(x[i]);
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(b))) continue;
      return false;
    }
    return true;
  }

  // ---------- 流程圖（SVG） ----------
  const tw = (s) => { let w = 0; for (const c of String(s)) w += /[⺀-￿]/.test(c) ? 13.5 : 7.6; return w; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function wrapText(s, maxW) {
    if (tw(s) <= maxW) return [s];
    const words = s.split(/(?<=\s)/); const lines = []; let cur = '';
    for (const w of words) { if (cur && tw(cur + w) > maxW) { lines.push(cur.trim()); cur = w; } else cur += w; }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  let FC_UID = 0;
  function flowchart(parsedOrCode, opt) {
    opt = opt || {};
    const parsed = typeof parsedOrCode === 'string' ? parseProgram(parsedOrCode, opt) : parsedOrCode;
    const GAP = 26, MAXW = opt.maxTextW || 230;
    const shapes = [], edges = [], labels = [];
    const shapeText = (n) => {
      if (n.t === 'assign') return n.text.replace(/\s*(<-|=)\s*/, (m, o) => (n.op === '←' ? m : ' ← '));
      return n.text;
    };
    function leaf(id, kind, text, line) {
      const lines = wrapText(text, MAXW);
      const w0 = Math.max(...lines.map(tw));
      let w = Math.max(kind === 'term' ? 70 : 80, w0 + (kind === 'io' ? 44 : kind === 'mod' ? 40 : 26));
      const h = 32 + (lines.length - 1) * 16;
      return { kind: 'leaf', l: w / 2, r: w / 2, h, entry: id, exitKeys: [id], render(x, y) { shapes.push({ id, kind, x, y, w, h, lines, line }); return []; } };
    }
    function decision(id, text, line) {
      const lines = wrapText(text, MAXW - 20);
      const w0 = Math.max(...lines.map(tw));
      const dw = Math.max(90, w0 * 1.25 + 44), dh = Math.max(46, 30 + lines.length * 17);
      return { id, dw, dh, lines, line };
    }
    const drawDec = (d, x, y) => shapes.push({ id: d.id, kind: 'dec', x, y, w: d.dw, h: d.dh, lines: d.lines, line: d.line });
    const edge = (pts, from, to, arrow) => { const e = { pts, from: from.slice(), to, arrow: arrow !== false }; edges.push(e); return e; };
    const label = (x, y, t, anchor) => labels.push({ x, y, t, anchor: anchor || 'start' });

    function seq(list) {
      const blocks = list.map(node);
      if (!blocks.length) return null;
      const l = Math.max(...blocks.map((b) => b.l)), r = Math.max(...blocks.map((b) => b.r));
      const h = blocks.reduce((s, b) => s + b.h, 0) + GAP * (blocks.length - 1);
      return {
        kind: 'seq', l, r, h, entry: blocks[0].entry, exitKeys: blocks[blocks.length - 1].exitKeys,
        render(x, y) {
          let yy = y, pend = [];
          blocks.forEach((b, i) => {
            if (i > 0) { const e = edge([[x, yy - GAP], [x, yy]], blocks[i - 1].exitKeys, b.entry); pend.forEach((p) => { p.to = b.entry; }); pend = []; void e; }
            pend = b.render(x, yy); yy += b.h + GAP;
          });
          return pend;
        },
      };
    }
    function ifBlock(brs, els) {
      const b0 = brs[0];
      const D = decision(b0.id, b0.condSrc, b0.line);
      const Y = seq(b0.body);
      const N = brs.length > 1 ? ifBlock(brs.slice(1), els) : els ? seq(els.body) : null;
      const xr = N ? Math.max(D.dw / 2 + 6, Y.l + 14) : Math.max(D.dw / 2 + 6, Y.l + 24);
      const xl = N ? -Math.max(D.dw / 2 + 6, N.r + 14) : 0;
      const ctop = D.dh + 20;
      const bottom = ctop + Math.max(Y.h, N ? N.h : 0) + 18;
      const l = Math.max(D.dw / 2, N ? -xl + N.l : 0), r = Math.max(D.dw / 2, xr + Y.r);
      return {
        kind: 'if', l, r, h: bottom, entry: b0.id,
        exitKeys: [...Y.exitKeys, ...(N ? N.exitKeys : [b0.id + ':n'])],
        render(x, y) {
          drawDec(D, x, y);
          const my = y + D.dh / 2, pend = [];
          edge([[x + D.dw / 2, my], [x + xr, my], [x + xr, y + ctop]], [b0.id + ':y'], Y.entry);
          label(x + D.dw / 2 + 4, my - 5, '是');
          pend.push(...Y.render(x + xr, y + ctop));
          pend.push(edge([[x + xr, y + ctop + Y.h], [x + xr, y + bottom], [x, y + bottom]], Y.exitKeys, null, false));
          if (N) {
            edge([[x - D.dw / 2, my], [x + xl, my], [x + xl, y + ctop]], [b0.id + ':n'], N.entry);
            label(x - D.dw / 2 - 4, my - 5, '否', 'end');
            pend.push(...N.render(x + xl, y + ctop));
            pend.push(edge([[x + xl, y + ctop + N.h], [x + xl, y + bottom], [x, y + bottom]], N.exitKeys, null, false));
          } else {
            pend.push(edge([[x, y + D.dh], [x, y + bottom]], [b0.id + ':n'], null, false));
            label(x + 7, y + D.dh + 12, '否');
          }
          return pend;
        },
      };
    }
    // 前測循環（while／for）。pre：for 的初始方塊；post：for 的更新方塊
    function preLoop(D, bodyList, pre, post, entryId) {
      const B = seq(bodyList);
      const P = post ? leaf(post.id, 'proc', post.text, post.line) : null;
      const bl = Math.max(B.l, P ? P.l : 0), br = Math.max(B.r, P ? P.r : 0);
      const top0 = pre ? pre.h + GAP : 0;
      const btop = top0 + D.dh + 22;
      const bodyH = B.h + (P ? GAP + P.h : 0);
      const back = btop + bodyH + 14;
      const h = back + 16;
      const xl = -(Math.max(D.dw / 2, bl) + 16), xr = Math.max(D.dw / 2, br) + 16;
      return {
        kind: 'loop', l: Math.max(-xl + 4, pre ? pre.l : 0), r: Math.max(xr + 4, pre ? pre.r : 0), h, entry: entryId,
        exitKeys: [D.id + ':n'],
        render(x, y) {
          if (pre) { pre.render(x, y); edge([[x, y + pre.h], [x, y + top0]], pre.exitKeys, D.id); }
          const dy = y + top0;
          drawDec(D, x, dy);
          edge([[x, dy + D.dh], [x, y + btop]], [D.id + ':y'], B.entry);
          label(x + 7, dy + D.dh + 12, '是');
          let pend = B.render(x, y + btop);
          let lastKeys = B.exitKeys, endY = y + btop + B.h;
          if (P) { edge([[x, endY], [x, endY + GAP]], B.exitKeys, P.entry); pend.forEach((p) => { p.to = P.entry; }); pend = []; P.render(x, endY + GAP); lastKeys = P.exitKeys; endY += GAP + P.h; }
          pend.forEach((p) => { p.to = D.id; });
          edge([[x, endY], [x, y + back], [x + xl, y + back], [x + xl, dy - 12], [x, dy - 12]], lastKeys, D.id, false);
          const ex = edge([[x + D.dw / 2, dy + D.dh / 2], [x + xr, dy + D.dh / 2], [x + xr, y + h], [x, y + h]], [D.id + ':n'], null, false);
          label(x + D.dw / 2 + 4, dy + D.dh / 2 - 5, '否');
          return [ex];
        },
      };
    }
    function postLoop(n) {
      const B = seq(n.body);
      const D = decision(n.id, n.condSrc, n.condLine);
      const dtop = B.h + 22, h = dtop + D.dh + 18;
      const xl = -(Math.max(D.dw / 2, B.l) + 16);
      const backO = n.t === 'repeat' ? 'n' : 'y', exitO = backO === 'y' ? 'n' : 'y';
      return {
        kind: 'loop', l: -xl + 4, r: Math.max(D.dw / 2, B.r), h, entry: B.entry, exitKeys: [n.id + ':' + exitO],
        render(x, y) {
          const pend = B.render(x, y);
          edge([[x, y + B.h], [x, y + dtop]], B.exitKeys, n.id); pend.forEach((p) => { p.to = n.id; });
          drawDec(D, x, y + dtop);
          const my = y + dtop + D.dh / 2;
          edge([[x - D.dw / 2, my], [x + xl, my], [x + xl, y - 12], [x, y - 12]], [n.id + ':' + backO], B.entry, false);
          label(x - D.dw / 2 - 4, my - 5, backO === 'y' ? '是' : '否', 'end');
          const ex = edge([[x, y + dtop + D.dh], [x, y + h]], [n.id + ':' + exitO], null, false);
          label(x + 7, y + dtop + D.dh + 12, exitO === 'y' ? '是' : '否');
          return [ex];
        },
      };
    }
    function node(n) {
      switch (n.t) {
        case 'assign': return leaf(n.id, 'proc', shapeText(n), n.line);
        case 'input': case 'output': return leaf(n.id, 'io', n.text, n.line);
        case 'call': return leaf(n.id, 'mod', n.text, n.line);
        case 'desc': return leaf(n.id, 'proc', n.text, n.line);
        case 'if': return ifBlock(n.br, n.els);
        case 'while': return preLoop(decision(n.id, n.condSrc, n.line), n.body, null, null, n.id);
        case 'for': {
          const pre = leaf(n.id + 'i', 'proc', `${n.v} ← ${n.fromSrc}`, n.line);
          const D = decision(n.id + 't', `${n.v} ${n.down ? '>=' : '<='} ${n.toSrc}`, n.line);
          return preLoop(D, n.body, pre, { id: n.id + 'u', text: `${n.v} ← ${n.v} ${n.down ? '-' : '+'} 1`, line: n.line }, n.id + 'i');
        }
        case 'dowhile': case 'repeat': return postLoop(n);
      }
      throw new DRError('流程圖未支援');
    }
    const S = leaf('S', 'term', '開始'), E = leaf('E', 'term', '結束');
    const body = seq(parsed.prog);
    const parts = body ? [S, body, E] : [S, E];
    const l = Math.max(...parts.map((b) => b.l)), r = Math.max(...parts.map((b) => b.r));
    const pad = 14, W = Math.ceil(l + r + pad * 2), cx = l + pad;
    let y = pad, pend = [];
    parts.forEach((b, i) => {
      if (i > 0) { edge([[cx, y - GAP], [cx, y]], parts[i - 1].exitKeys, b.entry); pend.forEach((p) => { p.to = b.entry; }); }
      pend = b.render(cx, y); y += b.h + GAP;
    });
    const H = Math.ceil(y - GAP + pad);
    const fcUid = ++FC_UID;
    // 輸出 SVG
    const o = [];
    o.push(`<svg class="fc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="流程圖">`);
    o.push(`<defs><marker id="fcArr${fcUid}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fc-arrowhead"/></marker></defs>`);
    for (const e of edges) {
      const keys = e.from.map((f) => `${f}>${e.to}`).join(' ');
      const d = e.pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      o.push(`<path class="fc-edge" data-k="${esc(keys)}" d="${d}"${e.arrow ? ` marker-end="url(#fcArr${fcUid})"` : ''}/>`);
    }
    for (const s of shapes) {
      const { x, y: sy, w, h } = s; const L = x - w / 2, R = x + w / 2, B = sy + h;
      let g;
      if (s.kind === 'term') g = `<rect x="${L}" y="${sy}" width="${w}" height="${h}" rx="${h / 2}"/>`;
      else if (s.kind === 'proc') g = `<rect x="${L}" y="${sy}" width="${w}" height="${h}" rx="2"/>`;
      else if (s.kind === 'mod') g = `<rect x="${L}" y="${sy}" width="${w}" height="${h}"/><line x1="${L + 9}" y1="${sy}" x2="${L + 9}" y2="${B}"/><line x1="${R - 9}" y1="${sy}" x2="${R - 9}" y2="${B}"/>`;
      else if (s.kind === 'io') g = `<polygon points="${L + 12},${sy} ${R},${sy} ${R - 12},${B} ${L},${B}"/>`;
      else g = `<polygon points="${x},${sy} ${R},${sy + h / 2} ${x},${B} ${L},${sy + h / 2}"/>`;
      const n = s.lines.length, ty = sy + h / 2 - (n - 1) * 8;
      const txt = s.lines.map((t, i) => `<text x="${x}" y="${(ty + i * 16).toFixed(1)}">${esc(t)}</text>`).join('');
      o.push(`<g class="fc-node fc-${s.kind}" data-id="${s.id}"${s.line != null ? ` data-line="${s.line}"` : ''}>${g}${txt}</g>`);
    }
    for (const lb of labels) o.push(`<text class="fc-lab" x="${lb.x.toFixed(1)}" y="${lb.y.toFixed(1)}" text-anchor="${lb.anchor}">${lb.t}</text>`);
    o.push('</svg>');
    return { svg: o.join(''), width: W, height: H };
  }
  // 由執行路徑求出要高亮的節點及路線
  function flowState(path, upto) {
    const P = path.slice(0, upto == null ? path.length : upto);
    const nodes = new Set(P.map((t) => t.id)), pairs = new Set();
    for (let i = 1; i < P.length; i++) { const a = P[i - 1]; pairs.add(`${a.id}${a.o ? ':' + a.o : ''}>${P[i].id}`); }
    return { nodes, pairs, cur: P.length ? P[P.length - 1].id : null };
  }

  const E = { DRError, parseExpr, parseProgram, run, evalNode, fmt, fmtB, buildTrace, progHas, walkProg, same, sameOutput, toks, valIn, countLine, parseInputs, parseValue, flowchart, flowState, condDesc, isLoop };
  if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.D1E = E;
})(typeof window !== 'undefined' ? window : this);
