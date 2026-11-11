/* 選修A SQL 自學平台：SQL 引擎＋設計引擎（FDX）
 * 抽取自 sql-design/index.html（SQL、FDX），並加入：多句腳本、CREATE/ALTER/DROP TABLE、限制（PRIMARY KEY、
 * FOREIGN KEY、NOT NULL、UNIQUE、DEFAULT、CHECK、AUTO_INCREMENT）、數據類型、檢視（VIEW）、索引、SHOW/DESCRIBE、
 * 無 FROM 的 SELECT、LIMIT、CASE、更多函數（日期、文字、數字、IFNULL、GROUP_CONCAT）。
 * 規則：MySQL 8.0＋DSE 卷二A 慣例（字串比較不分大小寫；三值邏輯；/ 是實數除法；ONLY_FULL_GROUP_BY）。
 * 瀏覽器：window.SQLE；Node：module.exports。
 */
(function (root) {
  'use strict';
  // ====== 小工具 ======
  const uniq = (a) => [...new Set(a)];
  const range = (a, b) => { const o = []; for (let i = a; i < b; i++) o.push(i); return o; };
  const fmtNum = (x) => { if (Object.is(x, -0)) return '0'; if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x); return String(parseFloat(x.toPrecision(12))); };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const up = (s) => String(s).toUpperCase();
  const VIEWS = '#VIEWS';

  // ====== 錯誤 ======
  const ERR = {
    syntax: '語法錯誤', nocol: '找不到欄位', notable: '找不到數據表', ambig: '欄名不清楚', group: '分組錯誤', agg: '聚合函數使用錯誤',
    type: '數據類型錯誤', subq: '子查詢錯誤', pk: '違反主關鍵碼限制', notnull: '違反 NOT NULL 限制', unique: '違反 UNIQUE 限制',
    check: '違反 CHECK 限制', fk: '違反外鍵碼限制', toolong: '數據太長', exists: '已存在', count: '欄位數目不符', other: '其他錯誤',
  };
  class SErr extends Error { constructor(msg, code) { super(msg); this.code = code || null; } }
  const errLabel = (e) => ERR[(e && e.code) || 'other'] || ERR.other;

  // =================== SQL 引擎 ===================
  // 數據表：{表名: [欄名陣列, 記錄陣列, 主關鍵碼陣列（可省）, meta（可省）]}；NULL 以 null 表示；檢視存於 T['#VIEWS']。
  // meta：{types:{COL:'VARCHAR(40)'}, nn:[COL], uq:[{name, cols}], def:{COL:v}, ck:[{name, src}], fk:[{name, cols, ref, rcols}], ai:COL, aiNext, ix:[{name, cols}], nck, nfk}
  const RESERVED = new Set(('SELECT DISTINCT ALL FROM WHERE GROUP BY HAVING ORDER ASC DESC AND OR NOT IN BETWEEN LIKE IS NULL AS TRUE FALSE ' +
    'JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL ON UNION INTERSECT EXCEPT MINUS EXISTS ANY SOME UPDATE SET DELETE INSERT INTO VALUES ' +
    'CREATE TABLE DROP ALTER ADD PRIMARY KEY FOREIGN REFERENCES UNIQUE DEFAULT CHECK CONSTRAINT CASE WHEN THEN ELSE LIMIT INDEX DIV MOD').split(' '));
  const AGG = new Set(['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT']);
  function tokenize(src) {
    const s = String(src).replace(/ /g, ' '), out = []; let i = 0;
    while (i < s.length) {
      const c = s[i], rest = s.slice(i), i0 = i; let m;
      if (/\s/.test(c)) { i++; continue; }
      if (c === '-' && s[i + 1] === '-' && (i + 2 >= s.length || /\s/.test(s[i + 2]))) { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
      if (c === '#') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
      if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); if (j < 0) throw new SErr('註解 /* 缺少收尾的 */。', 'syntax'); i = j + 2; continue; }
      if (c === "'" || c === '"') { let j = i + 1, str = ''; for (;;) { if (j >= s.length) throw new SErr('字串缺少收尾的引號。', 'syntax'); if (s[j] === c) { if (s[j + 1] === c) { str += c; j += 2; continue; } break; } if (s[j] === '\\' && j + 1 < s.length) { str += s[j + 1]; j += 2; continue; } str += s[j++]; } i = j + 1; out.push({ t: 'str', v: str, i0, i1: i }); continue; }
      if (c === '`') { const j = s.indexOf('`', i + 1); if (j < 0) throw new SErr('反引號不配對。', 'syntax'); out.push({ t: 'id', v: s.slice(i + 1, j).toUpperCase(), i0, i1: j + 1, q: true }); i = j + 1; continue; }
      if ((m = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)/.exec(rest))) { i += m[0].length; out.push({ t: 'num', v: Number(m[0]), i0, i1: i }); continue; }
      if ((m = /^[A-Za-z_㐀-鿿][A-Za-z0-9_$㐀-鿿]*/.exec(rest))) { i += m[0].length; const u = m[0].toUpperCase(); out.push({ t: RESERVED.has(u) ? 'kw' : 'id', v: u, i0, i1: i }); continue; }
      if ((m = /^(<=|>=|<>|!=|\|\||&&)/.exec(rest))) { i += 2; const v = m[1] === '!=' ? '<>' : m[1]; if (v === '||' || v === '&&') out.push({ t: 'kw', v: v === '||' ? 'OR' : 'AND', i0, i1: i }); else out.push({ t: 'op', v, i0, i1: i }); continue; }
      if ('=<>+-*/%,().;'.includes(c)) { i++; out.push({ t: 'op', v: c, i0, i1: i }); continue; }
      if ('≤≥≠'.includes(c)) throw new SErr('SQL 不接受「≤」「≥」「≠」，要寫 <=、>=、<>。', 'syntax');
      if ('，（）‘’“”；＝＊'.includes(c)) throw new SErr('請用半形（英文）符號（「' + c + '」是全形）。', 'syntax');
      throw new SErr('不認識的符號「' + c + '」。', 'syntax');
    }
    return out;
  }
  // 把腳本按分號分成多句（引號內的分號不算）
  function splitSQL(src) {
    const s = String(src), out = []; let cur = '', q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { cur += c; if (c === q) { if (s[i + 1] === q) { cur += s[++i]; } else q = null; } else if (c === '\\' && q !== '`' && i + 1 < s.length) cur += s[++i]; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
      if (c === '-' && s[i + 1] === '-' && (i + 2 >= s.length || /\s/.test(s[i + 2]))) { const j = s.indexOf('\n', i); const e = j < 0 ? s.length : j; cur += s.slice(i, e); i = e - 1; continue; }
      if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim() && tokenize(cur).length) out.push(cur.trim());
    return out.filter((x) => tokenize(x).length);
  }
  const TYPES = { INT: 'int', INTEGER: 'int', SMALLINT: 'int', TINYINT: 'int', MEDIUMINT: 'int', BIGINT: 'int', BOOL: 'bool', BOOLEAN: 'bool', FLOAT: 'real', DOUBLE: 'real', REAL: 'real', DECIMAL: 'dec', NUMERIC: 'dec', DEC: 'dec', CHAR: 'str', VARCHAR: 'str', TEXT: 'str', TINYTEXT: 'str', MEDIUMTEXT: 'str', LONGTEXT: 'str', DATE: 'date', DATETIME: 'datetime', TIMESTAMP: 'datetime', TIME: 'time', YEAR: 'int' };
  // ---------------- 語法分析 ----------------
  function parse(src) {
    const toks = tokenize(src), s = String(src); let p = 0;
    while (toks.length && toks[toks.length - 1].t === 'op' && toks[toks.length - 1].v === ';') toks.pop();
    if (!toks.length) throw new SErr('沒有 SQL 語句。', 'syntax');
    if (toks.some((t) => t.t === 'op' && t.v === ';')) throw new SErr('一次只可分析一句 SQL。', 'syntax');
    const near = () => (toks[p] ? '（在「' + s.slice(toks[p].i0, toks[p].i1) + '」附近）' : '（語句未完成）');
    const isK = (v) => toks[p] && toks[p].t === 'kw' && toks[p].v === v, isO = (v) => toks[p] && toks[p].t === 'op' && toks[p].v === v;
    const isW = (v, k) => { const t = toks[p + (k || 0)]; return t && (t.t === 'kw' || t.t === 'id') && !t.q && t.v === v; };
    const isK2 = (v) => toks[p + 1] && toks[p + 1].t === 'kw' && toks[p + 1].v === v;
    const need = (k) => { if (!isK(k) && !isW(k)) throw new SErr('缺少 ' + k + near() + '。', 'syntax'); p++; };
    const eatO = (v) => { if (!isO(v)) throw new SErr('缺少「' + v + '」' + near() + '。', 'syntax'); p++; };
    const ident = (what) => { const t = toks[p]; if (!t || t.t !== 'id') throw new SErr(what + (t && t.t === 'kw' ? '（' + t.v + ' 是保留字，不可用作名稱）' : '') + '。', 'syntax'); p++; return t.v; };
    const span = (p0) => s.slice(toks[p0].i0, toks[p - 1].i1).replace(/\s+/g, ' ');
    const mk = (p0, n) => { n.src = span(p0); return n; };
    function expr() { return or(); }
    function or() { const p0 = p; let a = xor(); while (isK('OR')) { p++; a = mk(p0, { k: 'or', a, b: xor() }); } return a; }
    function xor() { return and(); }
    function and() { const p0 = p; let a = not(); while (isK('AND')) { p++; a = mk(p0, { k: 'and', a, b: not() }); } return a; }
    function not() { if (isK('NOT')) { const p0 = p; p++; return mk(p0, { k: 'not', a: not() }); } return pred(); }
    function subq() { eatO('('); if (!isK('SELECT') && !isO('(')) throw new SErr('這裏要寫子查詢（SELECT …）。', 'syntax'); const q = query(); eatO(')'); return q; }
    function pred() {
      const p0 = p, a = add();
      if (toks[p] && toks[p].t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(toks[p].v)) {
        const op = toks[p++].v;
        if (isK('ANY') || isK('SOME') || isK('ALL')) { const qk = toks[p++].v === 'ALL' ? 'ALL' : 'ANY'; if (!(isO('(') && toks[p + 1] && toks[p + 1].t === 'kw' && toks[p + 1].v === 'SELECT')) throw new SErr(qk + ' 之後必須是子查詢（不可寫成一列數值）。', 'syntax'); return mk(p0, { k: 'quant', op, qk, a, q: subq(), pred: 1 }); }
        return mk(p0, { k: 'cmp', op, a, b: add(), pred: 1 });
      }
      let neg = false; if (isK('NOT') && toks[p + 1] && toks[p + 1].t === 'kw' && ['IN', 'BETWEEN', 'LIKE'].includes(toks[p + 1].v)) { neg = true; p++; }
      if (isK('IN')) { p++; if (isO('(') && isK2('SELECT')) return mk(p0, { k: 'insub', a, q: subq(), neg, pred: 1 }); eatO('('); const list = [add()]; while (isO(',')) { p++; list.push(add()); } eatO(')'); return mk(p0, { k: 'in', a, list, neg, pred: 1 }); }
      if (isK('BETWEEN')) { p++; const lo = add(); need('AND'); const hi = add(); return mk(p0, { k: 'btw', a, lo, hi, neg, pred: 1 }); }
      if (isK('LIKE')) { p++; return mk(p0, { k: 'like', a, pat: add(), neg, pred: 1 }); }
      if (isK('IS')) { p++; let n2 = false; if (isK('NOT')) { p++; n2 = true; } if (isK('TRUE') || isK('FALSE')) { const tv = toks[p++].v === 'TRUE'; return mk(p0, { k: 'istf', a, tv, neg: n2, pred: 1 }); } need('NULL'); return mk(p0, { k: 'isnull', a, neg: n2, pred: 1 }); }
      if (neg) throw new SErr('NOT 的位置不正確。', 'syntax');
      return a;
    }
    function add() { const p0 = p; let a = mul(); while (isO('+') || isO('-')) { const op = toks[p++].v; a = mk(p0, { k: 'ar', op, a, b: mul() }); } return a; }
    function mul() { const p0 = p; let a = un(); while (isO('*') || isO('/') || isO('%') || isK('DIV') || isK('MOD')) { let op = toks[p++].v; if (op === 'MOD') op = '%'; a = mk(p0, { k: 'ar', op, a, b: un() }); } return a; }
    function un() { if (isO('-')) { const p0 = p; p++; return mk(p0, { k: 'neg', a: un() }); } if (isO('+')) { p++; return un(); } return prim(); }
    function prim() {
      const p0 = p, t = toks[p]; if (!t) throw new SErr('語句未完成。', 'syntax');
      if (t.t === 'num') { p++; return mk(p0, { k: 'lit', v: t.v }); }
      if (t.t === 'str') { p++; return mk(p0, { k: 'lit', v: t.v }); }
      if (t.t === 'kw' && t.v === 'NULL') { p++; return mk(p0, { k: 'lit', v: null }); }
      if (t.t === 'kw' && (t.v === 'TRUE' || t.v === 'FALSE')) { p++; return mk(p0, { k: 'lit', v: t.v === 'TRUE' ? 1 : 0 }); }
      if (t.t === 'kw' && t.v === 'EXISTS') { p++; return mk(p0, { k: 'exists', q: subq() }); }
      if (t.t === 'kw' && t.v === 'CASE') {
        p++; let base = null; if (!isK('WHEN')) base = expr(); const whens = [];
        while (isK('WHEN')) { p++; const c = expr(); need('THEN'); whens.push([c, expr()]); }
        if (!whens.length) throw new SErr('CASE 之後要有 WHEN … THEN …。', 'syntax');
        let els = null; if (isK('ELSE')) { p++; els = expr(); } need('END');
        return mk(p0, { k: 'case', base, whens, els });
      }
      if (t.t === 'id' && t.v === 'INTERVAL' && !t.q && toks[p + 1] && !(toks[p + 1].t === 'op' && toks[p + 1].v !== '(' && toks[p + 1].v !== '-')) {
        p++; const n = add(); const u = toks[p]; if (!u || !/^(DAY|WEEK|MONTH|YEAR|HOUR|MINUTE|SECOND)$/.test(u.v)) throw new SErr('INTERVAL 之後要寫數字及單位（DAY、MONTH、YEAR 等）。', 'syntax'); p++;
        return mk(p0, { k: 'interval', n, unit: u.v });
      }
      if (t.t === 'op' && t.v === '(') { if (isK2('SELECT')) return mk(p0, { k: 'scalar', q: subq() }); p++; const a = expr(); eatO(')'); return mk(p0, { k: 'paren', a }); }
      if ((t.t === 'id' || (t.t === 'kw' && ['LEFT', 'RIGHT', 'MOD', 'INSERT', 'REPLACE'].includes(t.v))) && toks[p + 1] && toks[p + 1].t === 'op' && toks[p + 1].v === '(') {
        p += 2; const args = []; let star = false, distinct = false, sep = null, ord = null;
        if (t.v === 'TIMESTAMPDIFF' && toks[p] && (toks[p].t === 'id' || toks[p].t === 'kw')) { args.push({ k: 'lit', v: toks[p].v, src: toks[p].v }); p++; eatO(','); }
        if (isO('*')) { p++; star = true; } else if (!isO(')')) {
          if (isK('DISTINCT')) { p++; distinct = true; }
          args.push(expr()); while (isO(',')) { p++; args.push(expr()); }
          if (t.v === 'GROUP_CONCAT') { if (isK('ORDER')) { p++; need('BY'); ord = orderBy(); } if (isW('SEPARATOR')) { p++; if (!toks[p] || toks[p].t !== 'str') throw new SErr('SEPARATOR 之後要寫字串。', 'syntax'); sep = toks[p++].v; } }
        }
        eatO(')'); if ((star || distinct) && !AGG.has(t.v)) throw new SErr(t.v + ' 不是聚合函數。', 'syntax'); return mk(p0, { k: 'fn', name: t.v, args, star, distinct, sep, ord });
      }
      if (t.t === 'id') {
        p++;
        if (!t.q && /^(CURRENT_DATE|CURRENT_TIMESTAMP|CURRENT_TIME)$/.test(t.v)) return mk(p0, { k: 'fn', name: t.v, args: [] });
        if (isO('.')) { p++; if (isO('*')) throw new SErr('「' + t.v + '.*」只可寫在 SELECT 之後。', 'syntax'); const c = ident('「.」之後要寫欄名'); return mk(p0, { k: 'col', q: t.v, name: c }); }
        return mk(p0, { k: 'col', q: null, name: t.v });
      }
      throw new SErr('「' + s.slice(t.i0, t.i1) + '」的位置不正確。', 'syntax');
    }
    function tableRef() {
      const p0 = p;
      if (isO('(')) { const q = subq(); if (isK('AS')) p++; const al = ident('以子查詢作數據表時要提供別名'); return { k: 'tbl', sub: q, alias: al, src: span(p0) }; }
      const name = ident('FROM／JOIN 之後要寫數據表名稱'); let alias = null;
      if (isK('AS')) { p++; alias = ident('AS 之後要寫別名'); } else if (toks[p] && toks[p].t === 'id' && !isW('SEPARATOR') && !isW('USING')) alias = toks[p++].v;
      return { k: 'tbl', name, alias };
    }
    function fromItem() {
      let left = tableRef();
      for (;;) {
        let type = null;
        if (isK('JOIN')) { p++; type = 'INNER'; }
        else if (isK('INNER') && isK2('JOIN')) { p += 2; type = 'INNER'; }
        else if ((isK('LEFT') || isK('RIGHT') || isK('FULL')) && (isK2('JOIN') || isK2('OUTER'))) { type = toks[p].v; p++; if (isK('OUTER')) p++; need('JOIN'); }
        else if (isK('CROSS') && isK2('JOIN')) { p += 2; type = 'CROSS'; }
        else if (isK('NATURAL')) { p++; if (isK('INNER')) p++; need('JOIN'); type = 'NATURAL'; }
        if (!type) break;
        const right = tableRef(); let on = null, using = null;
        if (isK('ON')) { if (type === 'CROSS' || type === 'NATURAL') throw new SErr(type + ' JOIN 不用 ON。', 'syntax'); p++; on = expr(); }
        else if (isW('USING')) { p++; eatO('('); using = [ident('USING 之後要寫欄名')]; while (isO(',')) { p++; using.push(ident('要寫欄名')); } eatO(')'); }
        else if (type === 'LEFT' || type === 'RIGHT' || type === 'FULL') throw new SErr(type + ' JOIN 之後要寫 ON 連接條件。', 'syntax');
        left = { k: 'join', type, left, right, on, using };
      }
      return left;
    }
    function select() {
      const p0 = p; need('SELECT'); const q = { k: 'select', distinct: false, items: [], group: [], having: null, where: null, from: [] };
      if (isK('DISTINCT')) { p++; q.distinct = true; } else if (isK('ALL')) p++;
      for (;;) {
        const i0 = p;
        if (isO('*')) { p++; q.items.push({ star: true }); }
        else if (toks[p] && toks[p].t === 'id' && toks[p + 1] && toks[p + 1].v === '.' && toks[p + 2] && toks[p + 2].t === 'op' && toks[p + 2].v === '*') { q.items.push({ star: true, q: toks[p].v }); p += 3; }
        else { const e = expr(), text = span(i0); let alias = null; if (isK('AS')) { p++; if (toks[p] && toks[p].t === 'str') alias = toks[p++].v.toUpperCase(); else alias = ident('AS 之後要寫別名'); } else if (toks[p] && toks[p].t === 'str') alias = toks[p++].v.toUpperCase(); else if (toks[p] && toks[p].t === 'id') alias = toks[p++].v; q.items.push({ e, text, alias }); }
        if (isO(',')) { p++; continue; } break;
      }
      if (isK('FROM')) {
        p++;
        if (isW('DUAL')) p++;
        else { q.from = [fromItem()]; while (isO(',')) { p++; q.from.push(fromItem()); } }
      } else if (isK('WHERE') || isK('GROUP') || isK('HAVING')) throw new SErr('缺少 FROM' + near() + '。', 'syntax');
      if (isK('WHERE')) { p++; q.where = expr(); }
      if (isK('GROUP')) { p++; need('BY'); q.group.push(expr()); while (isO(',')) { p++; q.group.push(expr()); } }
      if (isK('HAVING')) { p++; q.having = expr(); }
      q.src = span(p0); return q;
    }
    function operand() { if (isO('(') && (isK2('SELECT') || (toks[p + 1] && toks[p + 1].v === '('))) { p++; const q = query(); eatO(')'); return q; } return select(); }
    function term() { let a = operand(); while (isK('INTERSECT')) { p++; if (isK('DISTINCT')) p++; a = { k: 'set', op: 'INTERSECT', a, b: operand() }; } return a; }
    function orderBy() { const o = []; for (;;) { const p0 = p, e = expr(), text = span(p0); let desc = false; if (isK('ASC')) p++; else if (isK('DESC')) { p++; desc = true; } o.push({ e, desc, text }); if (isO(',')) { p++; continue; } return o; } }
    function query() {
      let a = term();
      while (isK('UNION') || isK('EXCEPT') || isK('MINUS')) { let op = toks[p++].v; if (op === 'MINUS') op = 'EXCEPT'; if (isK('ALL')) { if (op !== 'UNION') throw new SErr('本平台只支援 UNION ALL。', 'syntax'); p++; op = 'UNION ALL'; } else if (isK('DISTINCT')) p++; a = { k: 'set', op, a, b: term() }; }
      if (isK('ORDER')) { p++; need('BY'); a = Object.assign({}, a, { order: orderBy() }); }
      if (isK('LIMIT')) {
        p++; const n1 = toks[p]; if (!n1 || n1.t !== 'num') throw new SErr('LIMIT 之後要寫數字。', 'syntax'); p++;
        let off = 0, n = n1.v;
        if (isO(',')) { p++; const n2 = toks[p]; if (!n2 || n2.t !== 'num') throw new SErr('LIMIT 之後要寫數字。', 'syntax'); p++; off = n1.v; n = n2.v; }
        else if (isW('OFFSET')) { p++; const n2 = toks[p]; if (!n2 || n2.t !== 'num') throw new SErr('OFFSET 之後要寫數字。', 'syntax'); p++; off = n2.v; }
        a = Object.assign({}, a, { limit: [off, n] });
      }
      return a;
    }
    // ---- DDL ----
    function litVal() {
      const t = toks[p]; if (!t) throw new SErr('DEFAULT 之後要寫數值' + near() + '。', 'syntax');
      if (isO('-') && toks[p + 1] && toks[p + 1].t === 'num') { p += 2; return -toks[p - 1].v; }
      if (t.t === 'num' || t.t === 'str') { p++; return t.v; }
      if (isK('NULL')) { p++; return null; }
      if (isK('TRUE') || isK('FALSE')) { p++; return t.v === 'TRUE' ? 1 : 0; }
      if (isW('CURRENT_TIMESTAMP') || isW('CURRENT_DATE')) { p++; return { fn: t.v }; }
      if (isO('(')) { p++; const v = litVal(); eatO(')'); return v; }
      throw new SErr('DEFAULT 之後要寫固定的數值' + near() + '。', 'syntax');
    }
    function typeDef() {
      const t = toks[p]; if (!t || (t.t !== 'id' && t.t !== 'kw') || !TYPES[t.v]) throw new SErr('要寫數據類型（例如 INT、CHAR(5)、VARCHAR(40)、DATE）' + near() + '。', 'syntax');
      p++; let ty = t.v;
      if (isO('(')) { p++; const a = toks[p]; if (!a || a.t !== 'num') throw new SErr('數據類型的括號內要寫數字' + near() + '。', 'syntax'); p++; ty += '(' + a.v; if (isO(',')) { p++; const b = toks[p]; if (!b || b.t !== 'num') throw new SErr('數據類型的括號內要寫數字。', 'syntax'); p++; ty += ',' + b.v; } eatO(')'); ty += ')'; }
      if (isW('UNSIGNED')) p++;
      if (/^(VARCHAR)$/.test(t.v) && !/\(/.test(ty)) throw new SErr('VARCHAR 要寫最大長度，例如 VARCHAR(40)。', 'syntax');
      return ty;
    }
    function colList(what) { eatO('('); const c = [ident(what || '括號內要寫欄名')]; while (isO(',')) { p++; c.push(ident(what || '要寫欄名')); } eatO(')'); return c; }
    function refClause() {
      need('REFERENCES'); const ref = ident('REFERENCES 之後要寫數據表名稱'); const rcols = colList('REFERENCES 數據表之後的括號內要寫欄名');
      while (isK('ON')) { p++; if (!(isK('DELETE') || isK('UPDATE'))) throw new SErr('ON 之後要寫 DELETE 或 UPDATE。', 'syntax'); const ev2 = toks[p++].v; let act; if (isW('CASCADE')) { p++; act = 'CASCADE'; } else if (isK('SET') && isK2('NULL')) { p += 2; act = 'SET NULL'; } else if (isW('RESTRICT')) { p++; act = 'RESTRICT'; } else if (isW('NO') && isW('ACTION', 1)) { p += 2; act = 'RESTRICT'; } else throw new SErr('不認識的 ON ' + ev2 + ' 動作。', 'syntax'); if (act !== 'RESTRICT') throw new SErr('本平台不支援 ON ' + ev2 + ' ' + act + '（教科書不需要）。', 'syntax'); }
      return { ref, rcols };
    }
    function exprSrc() { const p0 = p; eatO('('); const e = expr(); eatO(')'); void e; return span(p0).replace(/^\(\s*|\s*\)$/g, ''); }
    // 欄位定義：name type [限制…]
    function colDef() {
      const name = ident('要寫欄名'); const type = typeDef(); const c = { name, type, nn: false, pk: false, uq: false, def: undefined, ai: false, ck: null, fk: null };
      for (;;) {
        if (isK('NOT') && isK2('NULL')) { p += 2; c.nn = true; }
        else if (isK('NULL')) { p++; }
        else if (isK('PRIMARY')) { p++; need('KEY'); c.pk = true; }
        else if (isK('UNIQUE')) { p++; if (isK('KEY')) p++; c.uq = true; }
        else if (isK('DEFAULT')) { p++; c.def = litVal(); }
        else if (isW('AUTO_INCREMENT')) { p++; c.ai = true; }
        else if (isK('CHECK')) { p++; c.ck = exprSrc(); }
        else if (isK('REFERENCES')) { c.fk = refClause(); }
        else if (isW('COMMENT')) { p++; if (toks[p] && toks[p].t === 'str') p++; }
        else break;
      }
      return c;
    }
    function tblConstraint() {
      let cname = null;
      if (isK('CONSTRAINT')) { p++; if (toks[p] && toks[p].t === 'id') cname = toks[p++].v; }
      if (isK('PRIMARY')) { p++; need('KEY'); return { k: 'pk', cols: colList() }; }
      if (isK('FOREIGN')) { p++; need('KEY'); if (toks[p] && toks[p].t === 'id') p++; const cols = colList(); const r = refClause(); return { k: 'fk', name: cname, cols, ref: r.ref, rcols: r.rcols }; }
      if (isK('UNIQUE')) { p++; if (isK('KEY') || isK('INDEX')) p++; let n = cname; if (toks[p] && toks[p].t === 'id') n = toks[p++].v; return { k: 'uq', name: n, cols: colList() }; }
      if (isK('CHECK')) { p++; return { k: 'ck', name: cname, src: exprSrc() }; }
      if (isK('INDEX') || isK('KEY')) { p++; let n = null; if (toks[p] && toks[p].t === 'id') n = toks[p++].v; return { k: 'ix', name: n, cols: colList() }; }
      return null;
    }
    const isConstraintStart = () => isK('CONSTRAINT') || isK('PRIMARY') || isK('FOREIGN') || isK('UNIQUE') || isK('CHECK') || isK('INDEX') || isK('KEY');
    let st;
    if (isK('UPDATE')) {
      p++; const t = tableRef(); if (t.sub) throw new SErr('UPDATE 之後要寫數據表名稱。', 'syntax'); need('SET'); const sets = [];
      for (;;) { const q0 = toks[p] && toks[p + 1] && toks[p + 1].v === '.' ? (p += 2, toks[p - 2].v) : null; const c = ident('SET 之後要寫欄名'); eatO('='); sets.push({ q: q0, col: c, e: expr() }); if (isO(',')) { p++; continue; } break; }
      let where = null; if (isK('WHERE')) { p++; where = expr(); } st = { k: 'update', name: t.name, alias: t.alias, sets, where };
    } else if (isK('DELETE')) {
      p++; need('FROM'); const t = tableRef(); let where = null; if (isK('WHERE')) { p++; where = expr(); } st = { k: 'delete', name: t.name, alias: t.alias, where };
    } else if (isK('INSERT')) {
      p++; need('INTO'); const name = ident('INSERT INTO 之後要寫數據表名稱'); let cols = null;
      if (isO('(') && !isK2('SELECT')) { p++; cols = [ident('要寫欄名')]; while (isO(',')) { p++; cols.push(ident('要寫欄名')); } eatO(')'); }
      if (isK('VALUES') || isW('VALUE')) { p++; const rows = []; for (;;) { eatO('('); const r = [expr()]; while (isO(',')) { p++; r.push(expr()); } eatO(')'); rows.push(r); if (isO(',')) { p++; continue; } break; } st = { k: 'insert', name, cols, rows }; }
      else if (isK('SELECT') || isO('(')) st = { k: 'insert', name, cols, q: query() };
      else throw new SErr('INSERT INTO … 之後要寫 VALUES (…)。', 'syntax');
    } else if (isK('CREATE')) {
      p++; let orRep = false;
      if (isK('OR') && isW('REPLACE', 1)) { p += 2; orRep = true; }
      if (isK('TABLE')) {
        p++; let ine = false; if (isW('IF') && isK2('NOT')) { p += 2; need('EXISTS'); ine = true; }
        const name = ident('CREATE TABLE 之後要寫數據表名稱'); eatO('(');
        const cols = [], cons = [];
        for (;;) { if (isConstraintStart()) cons.push(tblConstraint()); else cols.push(colDef()); if (isO(',')) { p++; continue; } break; }
        eatO(')'); st = { k: 'create_table', name, cols, cons, ine };
      } else if (isW('VIEW')) {
        p++; const name = ident('CREATE VIEW 之後要寫檢視名稱'); let vcols = null; if (isO('(')) vcols = colList(); need('AS'); const q0 = p; const q = query(); st = { k: 'create_view', name, vcols, q, sql: s.slice(toks[q0].i0, toks[p - 1].i1), orRep };
      } else if (isK('INDEX') || (isK('UNIQUE') && isK2('INDEX'))) {
        const uqI = isK('UNIQUE'); p += uqI ? 2 : 1; const name = ident('CREATE INDEX 之後要寫索引名稱'); need('ON'); const tn = ident('ON 之後要寫數據表名稱'); st = { k: 'create_index', name, table: tn, cols: colList(), unique: uqI };
      } else if (isW('DATABASE') || isW('SCHEMA')) { p++; if (isW('IF') && isK2('NOT')) { p += 2; need('EXISTS'); } const n = ident('CREATE DATABASE 之後要寫數據庫名稱'); st = { k: 'misc', msg: '已創建數據庫 ' + n + '（本平台只示範一個數據庫）。' }; }
      else throw new SErr('CREATE 之後要寫 TABLE、VIEW、INDEX 或 DATABASE' + near() + '。', 'syntax');
    } else if (isK('DROP')) {
      p++;
      if (isK('TABLE') || isW('VIEW')) { const kind = toks[p++].v === 'TABLE' ? 'drop_table' : 'drop_view'; let ie = false; if (isW('IF') && isK2('EXISTS')) { p += 2; ie = true; } const names = [ident('要寫名稱')]; while (isO(',')) { p++; names.push(ident('要寫名稱')); } st = { k: kind, names, ie }; }
      else if (isK('INDEX')) { p++; const name = ident('DROP INDEX 之後要寫索引名稱'); need('ON'); st = { k: 'alter', name: ident('ON 之後要寫數據表名稱'), ops: [{ op: 'drop_index', name }] }; }
      else if (isW('DATABASE') || isW('SCHEMA')) { p++; if (isW('IF') && isK2('EXISTS')) p += 2; const n = ident('DROP DATABASE 之後要寫數據庫名稱'); st = { k: 'misc', msg: '已刪除數據庫 ' + n + '（本平台不會真的刪除，按「重設數據」可還原）。' }; }
      else throw new SErr('DROP 之後要寫 TABLE、VIEW、INDEX 或 DATABASE' + near() + '。', 'syntax');
    } else if (isK('ALTER')) {
      p++; need('TABLE'); const name = ident('ALTER TABLE 之後要寫數據表名稱'); const ops = [];
      for (;;) {
        if (isW('RENAME')) {
          p++;
          if (isW('COLUMN')) { p++; const a = ident('RENAME COLUMN 之後要寫原有欄名'); need('TO'); ops.push({ op: 'rename_col', a, b: ident('TO 之後要寫新欄名') }); }
          else { if (isW('TO') || isK('AS')) p++; ops.push({ op: 'rename', to: ident('RENAME 之後要寫新的數據表名稱') }); }
        } else if (isK('ADD')) {
          p++;
          if (isConstraintStart()) { const c = tblConstraint(); if (!c) throw new SErr('ADD 之後的限制不正確。', 'syntax'); ops.push({ op: 'add_con', c }); }
          else { if (isW('COLUMN')) p++; const c = colDef(); let pos = null; if (isW('FIRST')) { p++; pos = { first: true }; } else if (isW('AFTER')) { p++; pos = { after: ident('AFTER 之後要寫欄名') }; } ops.push({ op: 'add_col', c, pos }); }
        } else if (isW('MODIFY')) { p++; if (isW('COLUMN')) p++; ops.push({ op: 'modify', c: colDef() }); }
        else if (isW('CHANGE')) { p++; if (isW('COLUMN')) p++; const a = ident('CHANGE 之後要寫原有欄名'); const c = colDef(); ops.push({ op: 'change', a, c }); }
        else if (isK('DROP')) {
          p++;
          if (isK('PRIMARY')) { p++; need('KEY'); ops.push({ op: 'drop_pk' }); }
          else if (isK('FOREIGN')) { p++; need('KEY'); ops.push({ op: 'drop_fk', name: ident('DROP FOREIGN KEY 之後要寫限制名稱') }); }
          else if (isK('INDEX') || isK('KEY')) { p++; ops.push({ op: 'drop_index', name: ident('DROP INDEX 之後要寫索引名稱') }); }
          else if (isK('CHECK') || isK('CONSTRAINT')) { p++; ops.push({ op: 'drop_check', name: ident('要寫限制名稱') }); }
          else { if (isW('COLUMN')) p++; ops.push({ op: 'drop_col', col: ident('DROP 之後要寫欄名') }); }
        } else if (isK('ALTER')) {
          p++; if (isW('COLUMN')) p++; const col = ident('ALTER 之後要寫欄名');
          if (isK('SET')) { p++; need('DEFAULT'); ops.push({ op: 'set_def', col, v: litVal() }); }
          else if (isK('DROP')) { p++; need('DEFAULT'); ops.push({ op: 'drop_def', col }); }
          else throw new SErr('ALTER 欄位之後要寫 SET DEFAULT 或 DROP DEFAULT。', 'syntax');
        } else throw new SErr('ALTER TABLE 之後要寫 ADD、DROP、MODIFY、RENAME 等' + near() + '。', 'syntax');
        if (isO(',')) { p++; continue; } break;
      }
      st = { k: 'alter', name, ops };
    } else if (isW('SHOW')) {
      p++;
      if (isW('TABLES')) { p++; st = { k: 'show_tables' }; }
      else if (isK('CREATE')) { p++; if (!(isK('TABLE') || isW('VIEW'))) throw new SErr('SHOW CREATE 之後要寫 TABLE。', 'syntax'); p++; st = { k: 'show_create', name: ident('要寫數據表名稱') }; }
      else if (isW('DATABASES')) { p++; st = { k: 'misc', msg: '本平台只有一個數據庫。' }; }
      else if (isW('COLUMNS') || isW('FIELDS')) { p++; need('FROM'); st = { k: 'describe', name: ident('要寫數據表名稱') }; }
      else throw new SErr('SHOW 之後要寫 TABLES 或 CREATE TABLE。', 'syntax');
    } else if (isW('DESCRIBE') || isK('DESC') || isW('EXPLAIN')) { p++; st = { k: 'describe', name: ident('要寫數據表名稱') }; }
    else if (isW('USE')) { p++; const n = ident('USE 之後要寫數據庫名稱'); st = { k: 'misc', msg: '使用數據庫 ' + n + '（本平台只有一個數據庫）。' }; }
    else if (isK('SELECT') || isO('(')) st = query();
    else throw new SErr('不認識的 SQL 語句' + near() + '（應以 SELECT、INSERT、UPDATE、DELETE、CREATE、ALTER、DROP 等開始）。', 'syntax');
    if (p < toks.length) throw new SErr('「' + s.slice(toks[p].i0, toks[p].i1) + '」附近有語法錯誤（檢查子句次序：SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT）。', 'syntax');
    return st;
  }
  function safeParse(src) { try { return parse(src); } catch (e) { if (e instanceof SErr && !e.code) e.code = 'syntax'; throw e; } }
  // ---------------- 求值 ----------------
  const isStr = (v) => typeof v === 'string';
  const fmtV = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? fmtNum(v) : String(v));
  function cmpv(a, b) {
    if (isStr(a) && isStr(b)) { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
    if (isStr(a) !== isStr(b)) throw new SErr('數據類型不相符：把文字與數字比較（MySQL 會把文字轉為數字，結果難以預料）；文字常數要加單引號，數字不加。', 'type');
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const likeRe = (pat) => new RegExp('^' + String(pat).split('').map((ch) => (ch === '%' ? '[\\s\\S]*' : ch === '_' ? '[\\s\\S]' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('') + '$', 'i');
  const tableKeys = (T) => Object.keys(T).filter((k) => k !== VIEWS);
  const findTOpt = (T, name) => tableKeys(T).find((x) => x.toUpperCase() === up(name));
  const findView = (T, name) => { const V = T[VIEWS] || {}; return Object.keys(V).find((x) => x.toUpperCase() === up(name)); };
  const findT = (T, name) => { const k = findTOpt(T, name); if (k === undefined) { if (findView(T, name) !== undefined) throw new SErr(name + ' 是檢視（VIEW），不可以用這個語句修改。', 'other'); throw new SErr('沒有數據表 ' + name + '。', 'notable'); } return k; };
  const keyOf = (r) => JSON.stringify(r.map((v) => (isStr(v) ? v.toLowerCase().replace(/ +$/, '') : v)));
  const b10 = (v) => (v === true ? 1 : v === false ? 0 : v);
  function lookup(env, q, name) {
    for (let E = env; E; E = E.up) {
      const f = E.f; if (!f) continue;
      if (q) { const si = f.srcs.findIndex((x) => x.alias === q); if (si < 0) continue; const j = f.srcs[si].cols.indexOf(name); if (j < 0) throw new SErr('數據表 ' + q + ' 沒有欄位 ' + name + '。', 'nocol'); return { E, si, j }; }
      const hits = []; f.srcs.forEach((x, si) => { const j = x.cols.indexOf(name); if (j >= 0) hits.push({ E, si, j }); });
      if (hits.length > 1) { if (f.merged && f.merged.includes(name)) return hits[0]; throw new SErr('欄名 ' + name + ' 不清楚（兩個數據表都有這個欄位），要寫成「表名.' + name + '」。', 'ambig'); }
      if (hits.length === 1) return hits[0];
      if (E.sel && name in E.sel) return { E, sel: true };
    }
    return null;
  }
  function colVal(e, env) {
    const L = lookup(env, e.q, e.name);
    if (!L) { if (e.q) throw new SErr('找不到數據表或別名 ' + e.q + '（用了別名後便要以別名稱呼該數據表）。', 'notable'); throw new SErr('找不到欄位 ' + e.name + '（文字常數要加單引號）。', 'nocol'); }
    if (L.sel) return L.E.sel[e.name];
    const rec = L.E.f.vals[L.si]; return rec ? rec[L.j] : null;
  }
  function aggVal(e, env) {
    if (!env.grp) throw new SErr(env.inAgg ? '聚合函數不能嵌套（例如 MAX(COUNT(*))），要改用子查詢。' : '聚合函數 ' + e.name + ' 不可用在 WHERE 或 ON（分組後的篩選要用 HAVING，找最高／最低要用子查詢）。', 'agg');
    if (e.star) { if (e.name !== 'COUNT') throw new SErr('只有 COUNT 可寫成 COUNT(*)。', 'syntax'); return env.grp.length; }
    if (e.name === 'GROUP_CONCAT') {
      let items = env.grp.map((f) => { const ev2 = { f, up: env.up, T: env.T, inAgg: true }; return { v: e.args.map((a) => ev(a, ev2)), ev2 }; }).filter((x) => !x.v.some((v) => v === null));
      if (e.ord) items = sortRows(items.map((x) => ({ vals: x.v, env: x.ev2 })), e.ord, [], (o, r) => ev(o.e, r.env)).map((r) => ({ v: r.vals }));
      let strs = items.map((x) => x.v.map(fmtV).join(''));
      if (e.distinct) { const seen = new Set(); strs = strs.filter((s2) => { const k = s2.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); }
      return strs.length ? strs.join(e.sep == null ? ',' : e.sep) : null;
    }
    if (e.args.length !== 1) throw new SErr(e.name + ' 只有一個參數。', 'syntax');
    let vs = env.grp.map((f) => ev(e.args[0], { f, up: env.up, T: env.T, inAgg: true })).filter((v) => v !== null).map(b10);
    if (e.distinct) { const seen = new Set(); vs = vs.filter((v) => { const k = keyOf([v]); if (seen.has(k)) return false; seen.add(k); return true; }); }
    if (e.name === 'COUNT') return vs.length; if (!vs.length) return null;
    if (e.name === 'SUM' || e.name === 'AVG') { if (vs.some(isStr)) throw new SErr(e.name + ' 只可用於數字欄位。', 'type'); const t = vs.reduce((x, y) => x + y, 0); return e.name === 'SUM' ? t : t / vs.length; }
    return vs.reduce((x, y) => ((e.name === 'MAX' ? cmpv(y, x) > 0 : cmpv(y, x) < 0) ? y : x));
  }
  // ---- 日期 ----
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  function parseDT(v, what) {
    if (v === null) return null;
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(String(v).trim());
    if (!m) throw new SErr((what || '日期') + '要寫成 \'yyyy-mm-dd\'（例如 \'2025-09-01\'）。', 'type');
    const d = { y: +m[1], mo: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0), time: m[4] != null };
    const dim = new Date(Date.UTC(d.y, d.mo, 0)).getUTCDate();
    if (d.mo < 1 || d.mo > 12 || d.d < 1 || d.d > dim) throw new SErr('日期 ' + v + ' 不存在。', 'type');
    return d;
  }
  const dStr = (d) => `${pad(d.y, 4)}-${pad(d.mo)}-${pad(d.d)}` + (d.time ? ` ${pad(d.h)}:${pad(d.mi)}:${pad(d.s)}` : '');
  const toUTC = (d) => Date.UTC(d.y, d.mo - 1, d.d, d.h, d.mi, d.s);
  const fromUTC = (ms, time) => { const x = new Date(ms); return { y: x.getUTCFullYear(), mo: x.getUTCMonth() + 1, d: x.getUTCDate(), h: x.getUTCHours(), mi: x.getUTCMinutes(), s: x.getUTCSeconds(), time }; };
  function addInterval(d, n, unit) {
    if (unit === 'MONTH' || unit === 'YEAR') { const months = unit === 'YEAR' ? n * 12 : n; let mo = d.mo - 1 + months, y = d.y + Math.floor(mo / 12); mo = ((mo % 12) + 12) % 12; const dim = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(); return Object.assign({}, d, { y, mo: mo + 1, d: Math.min(d.d, dim) }); }
    const sec = { WEEK: 604800, DAY: 86400, HOUR: 3600, MINUTE: 60, SECOND: 1 }[unit];
    return fromUTC(toUTC(d) + n * sec * 1000, d.time || !/DAY|WEEK/.test(unit));
  }
  function monthsBetween(a, b) { let m = (b.y - a.y) * 12 + (b.mo - a.mo); const ta = [a.d, a.h, a.mi, a.s], tb = [b.d, b.h, b.mi, b.s]; const cmp = (x, y) => { for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; }; if (m > 0 && cmp(tb, ta) < 0) m--; else if (m < 0 && cmp(tb, ta) > 0) m++; return m; }
  const today = () => { const x = new Date(); return { y: x.getFullYear(), mo: x.getMonth() + 1, d: x.getDate(), h: x.getHours(), mi: x.getMinutes(), s: x.getSeconds(), time: false }; };
  const roundHalf = (x, d) => { const f = Math.pow(10, d || 0); const r = Math.round(Math.abs(x) * f + 1e-9) / f; return x < 0 ? -r : r; };
  function fnVal(e, env) {
    if (AGG.has(e.name)) return aggVal(e, env);
    const a = e.args.map((x) => (x.k === 'interval' ? 0 : b10(ev(x, env)))), A0 = a[0];
    const argN = (...n) => { if (!n.includes(a.length)) throw new SErr(e.name + ' 的參數數目不正確。', 'syntax'); };
    const S0 = () => (A0 === null ? null : isStr(A0) ? A0 : fmtNum(A0));
    const Sx = (v) => (v === null ? null : isStr(v) ? v : fmtNum(v));
    const N = (v) => { if (v === null) return null; if (isStr(v)) { if (/^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v); throw new SErr(e.name + ' 的參數要是數字。', 'type'); } return v; };
    const anyNull = () => a.some((x) => x === null);
    switch (e.name) {
      case 'INT': argN(1); return A0 === null ? null : Math.floor(N(A0));
      case 'ABS': argN(1); return A0 === null ? null : Math.abs(N(A0));
      case 'ROUND': argN(1, 2); return anyNull() ? null : roundHalf(N(A0), a.length > 1 ? N(a[1]) : 0);
      case 'TRUNCATE': argN(2); { if (anyNull()) return null; const f = Math.pow(10, N(a[1])); return Math.trunc(N(A0) * f) / f; }
      case 'FLOOR': argN(1); return A0 === null ? null : Math.floor(N(A0));
      case 'CEIL': case 'CEILING': argN(1); return A0 === null ? null : Math.ceil(N(A0));
      case 'MOD': argN(2); { if (anyNull() || N(a[1]) === 0) return null; return N(A0) % N(a[1]); }
      case 'POWER': case 'POW': argN(2); return anyNull() ? null : Math.pow(N(A0), N(a[1]));
      case 'SQRT': argN(1); return A0 === null || N(A0) < 0 ? null : Math.sqrt(N(A0));
      case 'SIGN': argN(1); return A0 === null ? null : Math.sign(N(A0));
      case 'PI': argN(0); return Math.PI;
      case 'CHAR_LENGTH': case 'CHARACTER_LENGTH': case 'LEN': case 'LENGTH': argN(1); return A0 === null ? null : [...S0()].length;
      case 'SUBSTRING': case 'SUBSTR': case 'MID': { argN(2, 3); if (anyNull()) return null; const t = [...S0()], st = Math.trunc(N(a[1])); const from = st > 0 ? st - 1 : st < 0 ? Math.max(0, t.length + st) : t.length; if (st < 0 && -st > t.length) return ''; return t.slice(from, a.length === 3 ? from + Math.max(0, Math.trunc(N(a[2]))) : undefined).join(''); }
      case 'LEFT': argN(2); return anyNull() ? null : [...S0()].slice(0, Math.max(0, N(a[1]))).join('');
      case 'RIGHT': argN(2); { if (anyNull()) return null; const t = [...S0()]; return N(a[1]) > 0 ? t.slice(-N(a[1])).join('') : ''; }
      case 'UPPER': case 'UCASE': argN(1); return A0 === null ? null : S0().toUpperCase();
      case 'LOWER': case 'LCASE': argN(1); return A0 === null ? null : S0().toLowerCase();
      case 'TRIM': argN(1); return A0 === null ? null : S0().replace(/^ +| +$/g, '');
      case 'LTRIM': argN(1); return A0 === null ? null : S0().replace(/^ +/, '');
      case 'RTRIM': argN(1); return A0 === null ? null : S0().replace(/ +$/, '');
      case 'SPACE': argN(1); return A0 === null ? null : ' '.repeat(Math.max(0, Math.trunc(N(A0))));
      case 'REPEAT': argN(2); return anyNull() ? null : S0().repeat(Math.max(0, Math.trunc(N(a[1]))));
      case 'REVERSE': argN(1); return A0 === null ? null : [...S0()].reverse().join('');
      case 'REPLACE': argN(3); return anyNull() ? null : S0().split(Sx(a[1])).join(Sx(a[2]));
      case 'INSTR': argN(2); return anyNull() ? null : S0().toLowerCase().indexOf(Sx(a[1]).toLowerCase()) + 1;
      case 'LOCATE': argN(2); return anyNull() ? null : Sx(a[1]).toLowerCase().indexOf(S0().toLowerCase()) + 1;
      case 'LPAD': case 'RPAD': { argN(3); if (anyNull()) return null; const s0 = [...S0()], n = N(a[1]), pd = Sx(a[2]); if (s0.length >= n) return s0.slice(0, n).join(''); if (!pd) return null; let fill = ''; while ([...fill].length < n - s0.length) fill += pd; fill = [...fill].slice(0, n - s0.length).join(''); return e.name === 'LPAD' ? fill + s0.join('') : s0.join('') + fill; }
      case 'CONCAT': return a.some((x) => x === null) ? null : a.map(Sx).join('');
      case 'CONCAT_WS': { if (A0 === null) return null; return a.slice(1).filter((x) => x !== null).map(Sx).join(S0()); }
      case 'ASCII': argN(1); return A0 === null ? null : (S0().length ? S0().charCodeAt(0) : 0);
      case 'IFNULL': argN(2); return A0 !== null ? A0 : a[1];
      case 'COALESCE': return a.find((x) => x !== null) ?? null;
      case 'NULLIF': argN(2); return A0 !== null && a[1] !== null && cmpv(A0, a[1]) === 0 ? null : A0;
      case 'IF': argN(3); return truth(A0) ? a[1] : a[2];
      case 'YEAR': argN(1); return A0 === null ? null : parseDT(A0).y;
      case 'MONTH': argN(1); return A0 === null ? null : parseDT(A0).mo;
      case 'DAY': case 'DAYOFMONTH': argN(1); return A0 === null ? null : parseDT(A0).d;
      case 'HOUR': case 'MINUTE': case 'SECOND': { argN(1); if (A0 === null) return null; const tm = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(S0()); if (!tm) throw new SErr(e.name + ' 的參數要是時間。', 'type'); return +(tm[{ HOUR: 1, MINUTE: 2, SECOND: 3 }[e.name]] || 0); }
      case 'DATE': argN(1); { if (A0 === null) return null; const d = parseDT(A0); d.time = false; return dStr(d); }
      case 'CURDATE': case 'CURRENT_DATE': return dStr(today());
      case 'NOW': case 'CURRENT_TIMESTAMP': case 'SYSDATE': { const d = today(); d.time = true; return dStr(d); }
      case 'ADDDATE': case 'DATE_ADD': case 'SUBDATE': case 'DATE_SUB': {
        argN(2); if (anyNull()) return null; const d = parseDT(A0); const iv = e.args[1].k === 'interval' ? e.args[1] : null;
        let n = iv ? N(ev(iv.n, env)) : N(a[1]); const unit = iv ? iv.unit : 'DAY'; if (n === null) return null; if (/SUB/.test(e.name)) n = -n;
        return dStr(addInterval(d, n, unit));
      }
      case 'DATEDIFF': argN(2); { if (anyNull()) return null; const x = parseDT(A0), y = parseDT(a[1]); return Math.round((Date.UTC(x.y, x.mo - 1, x.d) - Date.UTC(y.y, y.mo - 1, y.d)) / 86400000); }
      case 'TIMESTAMPDIFF': {
        argN(3); if (a[1] === null || a[2] === null) return null; const u = String(A0).toUpperCase(), x = parseDT(a[1]), y = parseDT(a[2]);
        if (u === 'YEAR') return Math.trunc(monthsBetween(x, y) / 12); if (u === 'MONTH') return monthsBetween(x, y);
        const sec = { WEEK: 604800, DAY: 86400, HOUR: 3600, MINUTE: 60, SECOND: 1 }[u]; if (!sec) throw new SErr('TIMESTAMPDIFF 的單位要是 YEAR、MONTH、DAY 等。', 'syntax');
        return Math.trunc((toUTC(y) - toUTC(x)) / 1000 / sec);
      }
    }
    throw new SErr('本平台不支援函數 ' + e.name + '。', 'other');
  }
  function subRows(q, env) { return runQ(q, env.T, env).rows; }
  function oneCol(rows) { if (rows.length && rows[0].length !== 1) throw new SErr('子查詢只可傳回一欄。', 'subq'); return rows.map((r) => r[0]); }
  function ev(e, env) {
    switch (e.k) {
      case 'lit': return e.v;
      case 'paren': return ev(e.a, env);
      case 'col': return colVal(e, env);
      case 'neg': { const v = b10(ev(e.a, env)); if (isStr(v)) throw new SErr('文字不可用於算術運算。', 'type'); return v === null ? null : -v; }
      case 'interval': throw new SErr('INTERVAL 只可用在 DATE_ADD／ADDDATE 等日期函數內。', 'syntax');
      case 'ar': { const a = b10(ev(e.a, env)), b = b10(ev(e.b, env)); if (a === null || b === null) return null;
        if (isStr(a) || isStr(b)) throw new SErr('文字不可用於算術運算（MySQL 串連文字要用 CONCAT；日期運算要用 ADDDATE、TIMESTAMPDIFF 等函數）。', 'type');
        if (e.op === '+') return a + b; if (e.op === '-') return a - b; if (e.op === '*') return a * b; if (b === 0) return null;
        if (e.op === '%') return a % b; if (e.op === 'DIV') return Math.trunc(a / b); return a / b; }
      case 'cmp': { const a = b10(ev(e.a, env)), b = b10(ev(e.b, env)); if (a === null || b === null) return null; const c = cmpv(a, b); return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[e.op]; }
      case 'and': { const a = ev(e.a, env); if (a === false || a === 0) return false; const b = ev(e.b, env); if (b === false || b === 0) return false; if (a === null || b === null) return null; return true; }
      case 'or': { const a = ev(e.a, env); if (truth(a)) return true; const b = ev(e.b, env); if (truth(b)) return true; if (a === null || b === null) return null; return false; }
      case 'not': { const a = ev(e.a, env); return a === null ? null : !truth(a); }
      case 'in': case 'insub': {
        const a = b10(ev(e.a, env)), list = e.k === 'in' ? e.list.map((x) => b10(ev(x, env))) : oneCol(subRows(e.q, env));
        if (!list.length) return e.neg;
        if (a === null) return null;
        let r = false, unk = false; for (const v of list) { if (v === null) unk = true; else if (cmpv(a, v) === 0) { r = true; break; } }
        const res = r ? true : unk ? null : false; return res === null ? null : e.neg ? !res : res;
      }
      case 'quant': {
        const a = b10(ev(e.a, env)), list = oneCol(subRows(e.q, env));
        if (!list.length) return e.qk === 'ALL';
        const tv = (v) => (a === null || v === null ? null : { '=': cmpv(a, v) === 0, '<>': cmpv(a, v) !== 0, '<': cmpv(a, v) < 0, '>': cmpv(a, v) > 0, '<=': cmpv(a, v) <= 0, '>=': cmpv(a, v) >= 0 }[e.op]);
        const rs = list.map(tv);
        if (e.qk === 'ALL') return rs.includes(false) ? false : rs.includes(null) ? null : true;
        return rs.includes(true) ? true : rs.includes(null) ? null : false;
      }
      case 'exists': return subRows(e.q, env).length > 0;
      case 'scalar': { const rows = subRows(e.q, env); if (rows.length > 1) throw new SErr('子查詢傳回多於一個值，不可用 = < > 直接比較（可改用 IN、ANY 或 ALL）。', 'subq'); if (rows.length && rows[0].length !== 1) throw new SErr('子查詢只可傳回一欄。', 'subq'); return rows.length ? rows[0][0] : null; }
      case 'btw': { const a = b10(ev(e.a, env)), lo = b10(ev(e.lo, env)), hi = b10(ev(e.hi, env)); if (a === null || lo === null || hi === null) return null; const r = cmpv(a, lo) >= 0 && cmpv(a, hi) <= 0; return e.neg ? !r : r; }
      case 'like': { const a = ev(e.a, env), pt = ev(e.pat, env); if (a === null || pt === null) return null; const r = likeRe(pt).test(isStr(a) ? a : fmtNum(b10(a))); return e.neg ? !r : r; }
      case 'isnull': { const r = ev(e.a, env) === null; return e.neg ? !r : r; }
      case 'istf': { const v = ev(e.a, env); const r = v === null ? false : truth(v) === e.tv; return e.neg ? !r : r; }
      case 'case': {
        if (e.base) { const b = b10(ev(e.base, env)); for (const [w, t] of e.whens) { const v = b10(ev(w, env)); if (b !== null && v !== null && cmpv(b, v) === 0) return ev(t, env); } }
        else for (const [w, t] of e.whens) if (truth(ev(w, env))) return ev(t, env);
        return e.els ? ev(e.els, env) : null;
      }
      case 'fn': return fnVal(e, env);
    }
    throw new SErr('無法計算。', 'other');
  }
  const truth = (v) => v === true || (typeof v === 'number' && v !== 0);
  const hasAgg = (e) => { if (!e || typeof e !== 'object') return false; if (e.k === 'fn' && AGG.has(e.name)) return true; if (e.k === 'col') return false; return ['a', 'b', 'lo', 'hi', 'pat', 'base', 'els', 'n'].some((k) => hasAgg(e[k])) || (e.list || []).some(hasAgg) || (e.args || []).some(hasAgg) || (e.whens || []).some((w) => hasAgg(w[0]) || hasAgg(w[1])); };
  // 檢視
  let viewDepth = 0;
  function viewData(T, vn) {
    const v = T[VIEWS][vn]; if (viewDepth > 8) throw new SErr('檢視互相引用太多層。', 'other');
    viewDepth++; try { const r = runQ(safeParse(v.sql), T, null); const cols = v.cols || r.cols; return [cols, r.rows]; } finally { viewDepth--; }
  }
  function fromSrc(it, T, env) {
    if (it.k === 'tbl') {
      if (it.sub) { const r = runQ(it.sub, T, env); return { srcs: [{ alias: it.alias, name: it.alias, cols: r.cols.map(up), pk: [] }], fs: r.rows.map((x) => [x]) }; }
      const tn = findTOpt(T, it.name);
      if (tn === undefined) { const vn = findView(T, it.name); if (vn === undefined) throw new SErr('沒有數據表 ' + it.name + '。', 'notable'); const [cols, rows] = viewData(T, vn); return { srcs: [{ alias: it.alias || it.name, name: it.name, cols: cols.map(up), pk: [] }], fs: rows.map((r) => [r]) }; }
      const [cols, rows, pk] = T[tn];
      return { srcs: [{ alias: it.alias || it.name, name: it.name, cols: cols.map(up), pk: (pk || []).map(up) }], fs: rows.map((r) => [r]) };
    }
    const L = fromSrc(it.left, T, env), Rt = fromSrc(it.right, T, env), srcs = L.srcs.concat(Rt.srcs);
    srcs.forEach((x, i) => { if (srcs.findIndex((y) => y.alias === x.alias) !== i) throw new SErr('FROM 中有兩個數據表同名（' + x.alias + '），自連接要為數據表提供不同的別名。', 'other'); });
    const nl = L.srcs.length, nr = Rt.srcs.length, out = [];
    let on;
    if (it.type === 'NATURAL' || it.using) {
      const lc = [].concat(...L.srcs.map((x, si) => x.cols.map((c, j) => [c, si, j]))), rc = [].concat(...Rt.srcs.map((x, si) => x.cols.map((c, j) => [c, si, j])));
      const common = it.using ? it.using : uniq(lc.map((x) => x[0]).filter((c) => rc.some((y) => y[0] === c)));
      common.forEach((c) => { if (!lc.some((x) => x[0] === c) || !rc.some((x) => x[0] === c)) throw new SErr('USING 的欄位 ' + c + ' 不在兩個數據表中。', 'nocol'); });
      on = (vals) => common.every((c) => { const a = lc.find((x) => x[0] === c), b = rc.find((x) => x[0] === c); const va = vals[a[1]] ? vals[a[1]][a[2]] : null, vb = vals[nl + b[1]] ? vals[nl + b[1]][b[2]] : null; return va !== null && vb !== null && cmpv(va, vb) === 0; });
      srcs.merged = common;
    } else if (it.on) {
      if (hasAgg(it.on)) throw new SErr('ON 連接條件不可使用聚合函數。', 'agg');
      on = (vals) => truth(ev(it.on, { f: { srcs, vals }, up: env, T }));
    } else on = () => true;
    const nullL = range(0, nl).map(() => null), nullR = range(0, nr).map(() => null), usedR = new Set();
    for (const a of L.fs) { let hit = false; Rt.fs.forEach((b, j) => { const v = a.concat(b); if (on(v)) { out.push(v); hit = true; usedR.add(j); } }); if (!hit && (it.type === 'LEFT' || it.type === 'FULL')) out.push(a.concat(nullR)); }
    const res = { srcs, fs: out, natural: it.type === 'NATURAL' || !!it.using ? { common: srcs.merged, nl } : null };
    if (it.type === 'RIGHT') { const o2 = []; Rt.fs.forEach((b) => { let hit = false; L.fs.forEach((a) => { const v = a.concat(b); if (on(v)) { o2.push(v); hit = true; } }); if (!hit) o2.push(nullL.concat(b)); }); res.fs = o2; }
    if (it.type === 'FULL') Rt.fs.forEach((b, j) => { if (!usedR.has(j)) out.push(nullL.concat(b)); });
    return res;
  }
  function product(parts) {
    let srcs = [], fs = [[]];
    for (const p of parts) { srcs = srcs.concat(p.srcs); const nf = []; for (const a of fs) for (const b of p.fs) nf.push(a.concat(b)); fs = nf; }
    srcs.forEach((x, i) => { if (srcs.findIndex((y) => y.alias === x.alias) !== i) throw new SErr('FROM 中有兩個數據表同名（' + x.alias + '），自連接要為數據表提供不同的別名。', 'other'); });
    return { srcs, fs };
  }
  // MySQL 的功能相關判斷：GROUP BY 包含某表的整個主關鍵碼 → 該表所有欄都已確定；ON／WHERE 中「欄 = 欄」的等式可傳遞
  function eqPairs(q, srcs) {
    const out = [], env = { f: { srcs, vals: [] }, up: null };
    const res = (e) => { if (!e || e.k !== 'col') return null; try { const L = lookup(env, e.q, e.name); return L && !L.sel && L.E === env ? L : null; } catch (x) { return null; } };
    const walkAnd = (e) => { if (!e) return; if (e.k === 'and') { walkAnd(e.a); walkAnd(e.b); return; } if (e.k === 'paren') return walkAnd(e.a); if (e.k === 'cmp' && e.op === '=') { const a = res(e.a), b = res(e.b); if (a && b) out.push([a, b]); } };
    const walkFrom = (it) => { if (it.k === 'join') { walkFrom(it.left); walkFrom(it.right); if (it.type === 'INNER' || it.type === 'CROSS') walkAnd(it.on); } };
    q.from.forEach(walkFrom); walkAnd(q.where);
    return out;
  }
  function groupCheck(q, srcs) {
    const gl = q.group.map((g) => (g.k === 'col' ? lookup({ f: { srcs, vals: [] }, up: null }, g.q, g.name) : null)).filter(Boolean);
    const gtext = q.group.map((g) => g.src.replace(/\s/g, '').toUpperCase());
    const det = new Set(gl.map((L) => L.si + ':' + L.j)), eqs = eqPairs(q, srcs), full = new Set();
    for (let ch = true; ch;) {
      ch = false;
      srcs.forEach((x, si) => { if (!full.has(si) && x.pk.length && x.pk.every((c) => det.has(si + ':' + x.cols.indexOf(c)))) { full.add(si); x.cols.forEach((c, j) => det.add(si + ':' + j)); ch = true; } });
      for (const [a, b] of eqs) { const ka = a.si + ':' + a.j, kb = b.si + ':' + b.j; if (det.has(ka) && !det.has(kb)) { det.add(kb); ch = true; } else if (det.has(kb) && !det.has(ka)) { det.add(ka); ch = true; } }
    }
    const pkOk = (si) => full.has(si);
    const walk = (e, where) => {
      if (!e || typeof e !== 'object') return;
      if (e.k === 'fn' && AGG.has(e.name)) return;
      if (e.src && gtext.includes(e.src.replace(/\s/g, '').toUpperCase())) return;
      if (e.k === 'col') {
        let L; try { L = lookup({ f: { srcs, vals: [] }, up: null, sel: where === 'SELECT' ? null : q._sel }, e.q, e.name); } catch (x) { return; }
        if (!L || L.sel) return;
        if (det.has(L.si + ':' + L.j) || pkOk(L.si)) return;
        if (srcs.merged && srcs.merged.includes(e.name) && gl.some((g) => srcs[g.si].cols[g.j] === e.name)) return;
        throw new SErr(where + ' 中的 ' + (e.q ? e.q + '.' : '') + e.name + ' 既不是聚合函數，也不在 GROUP BY 中（MySQL 的 ONLY_FULL_GROUP_BY 會報錯）。', 'group');
      }
      ['a', 'b', 'lo', 'hi', 'pat', 'base', 'els', 'n'].forEach((k) => walk(e[k], where)); (e.list || []).forEach((x) => walk(x, where)); (e.args || []).forEach((x) => walk(x, where)); (e.whens || []).forEach((w) => { walk(w[0], where); walk(w[1], where); });
    };
    q.items.forEach((it) => { if (it.star) throw new SErr('SELECT * 不可與 GROUP BY 或聚合函數一起使用。', 'group'); walk(it.e, 'SELECT'); });
    walk(q.having, 'HAVING');
  }
  function runSelect(q, T, env, order) {
    let P;
    if (!q.from.length) P = { srcs: [], fs: [[]] };
    else { const parts = q.from.map((it) => fromSrc(it, T, env)); P = parts.length === 1 ? parts[0] : product(parts); if (parts.length === 1 && parts[0].srcs.merged) P.srcs.merged = parts[0].srcs.merged; }
    const srcs = P.srcs;
    if (hasAgg(q.where)) throw new SErr('聚合函數不可用在 WHERE（分組後的篩選要用 HAVING，找最高／最低要用子查詢）。', 'agg');
    const kept = P.fs.filter((vals) => !q.where || truth(ev(q.where, { f: { srcs, vals }, up: env, T })));
    const grouped = q.group.length > 0 || q.items.some((it) => !it.star && hasAgg(it.e)) || !!q.having || (order || []).some((o) => hasAgg(o.e));
    const names = [], cols = [];
    q.items.forEach((it) => {
      if (it.star) {
        if (!srcs.length) throw new SErr('沒有 FROM 時不可以寫 *。', 'syntax');
        const ss = it.q ? srcs.filter((x) => x.alias === it.q) : srcs; if (it.q && !ss.length) throw new SErr('找不到數據表或別名 ' + it.q + '。', 'notable');
        const mg = !it.q && P.natural ? P.natural.common : null;
        if (mg) { mg.forEach((c) => { const si = srcs.findIndex((x) => x.cols.includes(c)); names.push(c); cols.push({ si, j: srcs[si].cols.indexOf(c), coalesce: c }); }); }
        ss.forEach((x) => x.cols.forEach((c, j) => { if (mg && mg.includes(c)) return; names.push(c); cols.push({ si: srcs.indexOf(x), j }); }));
      } else { names.push(it.alias || (it.e.k === 'col' ? it.e.name : it.text)); cols.push({ e: it.e, alias: it.alias }); }
    });
    q._sel = {}; q.items.forEach((it) => { if (!it.star && it.alias) q._sel[it.alias] = 1; });
    let out = [];
    const rowOf = (env2) => cols.map((c) => {
      if (c.e) return b10(ev(c.e, env2));
      if (c.coalesce) { for (let si = 0; si < srcs.length; si++) { const j = srcs[si].cols.indexOf(c.coalesce); if (j >= 0 && env2.f.vals[si] && env2.f.vals[si][j] !== null) return env2.f.vals[si][j]; } return null; }
      return env2.f.vals[c.si] ? env2.f.vals[c.si][c.j] : null;
    });
    const selOf = (vals) => { const o = {}; cols.forEach((c, i) => { if (c.alias) o[c.alias] = vals[i]; }); return o; };
    if (grouped) {
      groupCheck(q, srcs);
      const gs = [], idx = {};
      if (!q.group.length) gs.push(kept);
      else for (const vals of kept) { const k = keyOf(q.group.map((g) => b10(ev(g, { f: { srcs, vals }, up: env, T })))); if (!(k in idx)) { idx[k] = gs.length; gs.push([]); } gs[idx[k]].push(vals); }
      for (const g of gs) {
        const genv = { f: { srcs, vals: g[0] || srcs.map(() => null) }, up: env, grp: g.map((vals) => ({ srcs, vals })), T };
        const vals = rowOf(genv); genv.sel = selOf(vals);
        if (q.having && !truth(ev(q.having, genv))) continue;
        out.push({ vals, env: genv, g });
      }
    } else out = kept.map((vals) => { const env2 = { f: { srcs, vals }, up: env, T }; const v = rowOf(env2); env2.sel = selOf(v); return { vals: v, env: env2 }; });
    if (q.distinct) { const seen = new Set(); out = out.filter((r) => { const k = keyOf(r.vals); if (seen.has(k)) return false; seen.add(k); return true; }); }
    if (order) out = sortRows(out, order, names, (o, r) => ev(o.e, r.env));
    if (q.limit) out = out.slice(q.limit[0], q.limit[0] + q.limit[1]);
    return { cols: names, rows: out.map((r) => r.vals), recs: out, srcs };
  }
  function sortRows(out, order, names, evf) {
    const nm = names.map((n) => n.replace(/\s/g, '').toUpperCase());
    const kf = (o, r) => {
      if (o.e.k === 'lit' && typeof o.e.v === 'number') { if (o.e.v < 1 || o.e.v > names.length || !Number.isInteger(o.e.v)) throw new SErr('ORDER BY 的欄位次序不正確。', 'other'); return r.vals[o.e.v - 1]; }
      const t = o.text.replace(/\s/g, '').toUpperCase(), k = nm.indexOf(t); if (k >= 0) return r.vals[k];
      if (o.e.k === 'col' && !o.e.q) { const k2 = nm.indexOf(o.e.name); if (k2 >= 0) return r.vals[k2]; }
      if (!evf) throw new SErr('ORDER BY 的 ' + o.text + ' 不在輸出的欄位中。', 'nocol');
      return b10(evf(o, r));
    };
    const ks = out.map((r, i) => ({ r, i, k: order.map((o) => kf(o, r)) }));
    ks.sort((x, y) => { for (let j = 0; j < order.length; j++) { const a = x.k[j], b = y.k[j]; let c = a === null && b === null ? 0 : a === null ? -1 : b === null ? 1 : cmpv(a, b); if (order[j].desc) c = -c; if (c) return c; } return x.i - y.i; });
    return ks.map((x) => x.r);
  }
  function runQ(q, T, env) {
    if (q.k === 'select') return runSelect(q, T, env || null, q.order);
    const a = runQ(q.a, T, env), b = runQ(q.b, T, env);
    if (a.cols.length !== b.cols.length) throw new SErr(q.op + ' 兩邊的 SELECT 欄數不同（' + a.cols.length + ' 欄與 ' + b.cols.length + ' 欄）。', 'count');
    let rows;
    const dd = (rs) => { const seen = new Set(); return rs.filter((r) => { const k = keyOf(r); if (seen.has(k)) return false; seen.add(k); return true; }); };
    if (q.op === 'UNION ALL') rows = a.rows.concat(b.rows);
    else if (q.op === 'UNION') rows = dd(a.rows.concat(b.rows));
    else { const kb = new Set(b.rows.map(keyOf)); rows = dd(a.rows).filter((r) => (q.op === 'INTERSECT' ? kb.has(keyOf(r)) : !kb.has(keyOf(r)))); }
    let out = rows.map((vals) => ({ vals }));
    if (q.order) out = sortRows(out, q.order, a.cols, null);
    if (q.limit) out = out.slice(q.limit[0], q.limit[0] + q.limit[1]);
    return { cols: a.cols, rows: out.map((r) => r.vals) };
  }
  function usesTable(e, name) {
    if (!e || typeof e !== 'object') return false;
    if (Array.isArray(e)) return e.some((x) => usesTable(x, name));
    if (e.k === 'tbl' && e.name === name) return true;
    return Object.keys(e).some((k) => k !== 'src' && typeof e[k] === 'object' && usesTable(e[k], name));
  }
  function run(T, sql) { const st = typeof sql === 'string' ? safeParse(sql) : sql; if (st.k !== 'select' && st.k !== 'set') throw new SErr('這裏只可執行 SELECT 語句。', 'other'); const r = runQ(st, T, null); return { cols: r.cols, rows: r.rows }; }

  // ---------------- 數據類型與限制 ----------------
  const baseType = (ty) => (ty ? TYPES[String(ty).replace(/\(.*$/, '').toUpperCase()] : null);
  const typeLen = (ty) => { const m = /\((\d+)(?:,(\d+))?\)/.exec(ty || ''); return m ? [+m[1], m[2] != null ? +m[2] : null] : [null, null]; };
  function coerce(v, ty, col) {
    if (v === null || v === undefined || !ty) return v === undefined ? null : v;
    const bt = baseType(ty), [n, d] = typeLen(ty); v = b10(v);
    const bad = () => new SErr('欄位 ' + col + ' 的數據類型是 ' + ty + '，不可存入 ' + (isStr(v) ? "'" + v + "'" : fmtV(v)) + '。（MySQL：Incorrect value）', 'type');
    if (bt === 'int' || bt === 'bool') { let x = v; if (isStr(x)) { if (!/^\s*-?\d+(\.\d+)?\s*$/.test(x)) throw bad(); x = Number(x); } return roundHalf(x, 0); }
    if (bt === 'real') { if (isStr(v)) { if (!/^\s*-?\d+(\.\d+)?\s*$/.test(v)) throw bad(); return Number(v); } return v; }
    if (bt === 'dec') { let x = v; if (isStr(x)) { if (!/^\s*-?\d+(\.\d+)?\s*$/.test(x)) throw bad(); x = Number(x); } x = roundHalf(x, d || 0); if (n != null && Math.abs(x) >= Math.pow(10, n - (d || 0))) throw new SErr('數值 ' + fmtNum(x) + ' 超出欄位 ' + col + '（' + ty + '）的範圍。（MySQL：Out of range value）', 'toolong'); return x; }
    if (bt === 'str') { const s = isStr(v) ? v : fmtNum(v); const len = /^CHAR|^VARCHAR/i.test(ty) ? n : null; if (len != null && [...s].length > len) throw new SErr("'" + s + "' 有 " + [...s].length + ' 個字符，超出欄位 ' + col + '（' + ty + '）的長度。（MySQL：Data too long for column）', 'toolong'); return /^CHAR\b/i.test(ty) ? s.replace(/ +$/, '') : s; }
    if (bt === 'date') { if (!isStr(v)) throw bad(); const x = parseDT(v, '欄位 ' + col + ' 的日期'); x.time = false; return dStr(x); }
    if (bt === 'datetime') { if (!isStr(v)) throw bad(); const x = parseDT(v, '欄位 ' + col + ' 的日期時間'); x.time = true; return dStr(x); }
    if (bt === 'time') { const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(String(v).trim()); if (!m) throw new SErr('時間要寫成 \'hh:mm:ss\'。', 'type'); return `${pad(+m[1])}:${pad(+m[2])}:${pad(+(m[3] || 0))}`; }
    return v;
  }
  const meta = (t) => { if (!t[3]) t[3] = {}; const m = t[3]; ['nn', 'uq', 'ck', 'fk', 'ix'].forEach((k) => { if (!m[k]) m[k] = []; }); if (!m.types) m.types = {}; if (!m.def) m.def = {}; if (!t[2]) t[2] = []; return m; };
  const ckCache = {};
  function ckExpr(src) { if (!ckCache[src]) ckCache[src] = safeParse('SELECT ' + src).items[0].e; return ckCache[src]; }
  const valTxt = (vs) => vs.map((v) => fmtV(v)).join('-');
  function checkTable(T, tn) {
    const t = T[tn], [cols, rows] = t, U = cols.map(up), pk = (t[2] || []).map(up), m = t[3] || {};
    const ix = (c) => { const i = U.indexOf(up(c)); return i; };
    for (const c of pk) { const i = ix(c); rows.forEach((r) => { if (r[i] === null) throw new SErr('主關鍵碼 ' + c + ' 不可以是 NULL（實體完整性）。（MySQL：Column \'' + c + '\' cannot be null）', 'pk'); }); }
    for (const c of m.nn || []) { const i = ix(c); rows.forEach((r) => { if (r[i] === null) throw new SErr('欄位 ' + c + ' 有 NOT NULL 限制，不可以是 NULL。（MySQL：Column \'' + c + '\' cannot be null）', 'notnull'); }); }
    const dupCheck = (cs, code, nm) => { const is = cs.map(ix), seen = new Set(); rows.forEach((r) => { const vs = is.map((i) => r[i]); if (code !== 'pk' && vs.some((v) => v === null)) return; const k = keyOf(vs); if (seen.has(k)) throw new SErr(code === 'pk' ? '主關鍵碼 ' + cs.join(', ') + ' 的值 \'' + valTxt(vs) + '\' 重複了（每項記錄的主關鍵碼必須獨一無二）。（MySQL：Duplicate entry \'' + valTxt(vs) + '\' for key \'PRIMARY\'）' : '欄位 ' + cs.join(', ') + ' 有 UNIQUE 限制，值 \'' + valTxt(vs) + '\' 重複了。（MySQL：Duplicate entry \'' + valTxt(vs) + '\' for key \'' + nm + '\'）', code); seen.add(k); }); };
    if (pk.length) dupCheck(pk, 'pk');
    for (const u of m.uq || []) dupCheck(u.cols, 'unique', u.name);
    const srcs = [{ alias: up(tn), name: tn, cols: U, pk: [] }];
    for (const c of m.ck || []) { const e = ckExpr(c.src); rows.forEach((r) => { const v = ev(e, { f: { srcs, vals: [r] }, up: null, T }); if (v !== null && !truth(v)) throw new SErr('記錄違反 CHECK (' + c.src + ') 限制。（MySQL：Check constraint \'' + c.name + '\' is violated）', 'check'); }); }
    for (const f of m.fk || []) {
      const pn = findTOpt(T, f.ref); if (pn === undefined) throw new SErr('外鍵碼參照的數據表 ' + f.ref + ' 不存在。', 'fk');
      const P = T[pn], PU = P[0].map(up), pis = f.rcols.map((c) => PU.indexOf(up(c))); if (pis.some((i) => i < 0)) throw new SErr('數據表 ' + f.ref + ' 沒有欄位 ' + f.rcols.join(', ') + '。', 'nocol');
      const have = new Set(P[1].map((r) => keyOf(pis.map((i) => r[i])))), cis = f.cols.map(ix);
      rows.forEach((r) => { const vs = cis.map((i) => r[i]); if (vs.some((v) => v === null)) return; if (!have.has(keyOf(vs))) throw new SErr(tn + ' 的 ' + f.cols.join(', ') + ' = \'' + valTxt(vs) + '\'，但 ' + f.ref + ' 沒有 ' + f.rcols.join(', ') + ' = \'' + valTxt(vs) + '\' 的記錄（參照完整性）。（MySQL：Cannot add or update a child row: a foreign key constraint fails）', 'fk'); });
    }
  }
  function checkParents(T, tn) {
    for (const cn of tableKeys(T)) {
      const m = T[cn][3]; if (!m || !m.fk) continue;
      for (const f of m.fk) {
        if (up(f.ref) !== up(tn)) continue;
        const P = T[tn], PU = P[0].map(up), pis = f.rcols.map((c) => PU.indexOf(up(c)));
        if (pis.some((i) => i < 0)) throw new SErr('數據表 ' + cn + ' 的外鍵碼參照了 ' + tn + ' 的 ' + f.rcols.join(', ') + '，不可刪除或改名這些欄位。', 'fk');
        const have = new Set(P[1].map((r) => keyOf(pis.map((i) => r[i])))), CU = T[cn][0].map(up), cis = f.cols.map((c) => CU.indexOf(up(c)));
        T[cn][1].forEach((r) => { const vs = cis.map((i) => r[i]); if (vs.some((v) => v === null)) return; if (!have.has(keyOf(vs))) throw new SErr('數據表 ' + cn + ' 仍有記錄參照 ' + tn + ' 的 ' + f.rcols.join(', ') + ' = \'' + valTxt(vs) + '\'，不可刪除或修改這項記錄（參照完整性）。（MySQL：Cannot delete or update a parent row: a foreign key constraint fails）', 'fk'); });
      }
    }
  }
  const defVal = (d) => (d && typeof d === 'object' && d.fn ? fnVal({ name: d.fn, args: [] }, {}) : d);
  // DML：在副本上執行，回傳 {T: 新數據表, kind, hit: 受影響記錄的位置（INSERT／UPDATE 是新位置；DELETE 是原有位置）, name, n}
  function exec(T0, sql) {
    const st = typeof sql === 'string' ? safeParse(sql) : sql;
    if (st.k === 'select' || st.k === 'set') return Object.assign({ kind: 'select', T: T0 }, run(T0, st));
    if (st.k === 'insert' || st.k === 'update' || st.k === 'delete') return dml(T0, st);
    return ddl(T0, st);
  }
  function dml(T0, st) {
    const T = clone(T0), tn = findT(T, st.name), t = T[tn], [cols0, rows] = t, cols = cols0.map(up), m = t[3] || {};
    const types = m.types || {};
    const srcs = [{ alias: st.alias || st.name, name: st.name, cols, pk: [] }];
    if (st.k === 'insert') {
      let data;
      if (st.q) data = runQ(st.q, T0, null).rows; else data = st.rows.map((r) => r.map((e) => { if (e.k === 'col' && e.name === 'DEFAULT') return { def: true }; return b10(ev(e, { f: null, up: null, T: T0 })); }));
      const tc = st.cols || cols; tc.forEach((c) => { if (!cols.includes(c)) throw new SErr('數據表 ' + st.name + ' 沒有欄位 ' + c + '。', 'nocol'); });
      const hit = [];
      data.forEach((r) => {
        if (r.length !== tc.length) throw new SErr('VALUES 的數值數目（' + r.length + '）與欄位數目（' + tc.length + '）不同。', 'count');
        const rec = cols.map((c, ci) => {
          const k = tc.indexOf(c); let v = k < 0 || (r[k] && r[k].def) ? undefined : r[k];
          if (m.ai && up(m.ai) === c && (v === undefined || v === null || v === 0)) { const mx = rows.reduce((x, row) => (typeof row[ci] === 'number' && row[ci] > x ? row[ci] : x), 0); v = Math.max(mx + 1, m.aiNext || 1); m.aiNext = v + 1; return v; }
          if (v === undefined) { if (m.def && c in m.def) return coerce(defVal(m.def[c]), types[c], c); if ((m.nn || []).map(up).includes(c) || (t[2] || []).map(up).includes(c)) throw new SErr('欄位 ' + c + ' 沒有提供數值，又沒有預設值（DEFAULT）。（MySQL：Field \'' + c + '\' doesn\'t have a default value）', (t[2] || []).map(up).includes(c) ? 'pk' : 'notnull'); return null; }
          return coerce(v, types[c], c);
        });
        if (m.ai) { const ci = cols.indexOf(up(m.ai)); if (typeof rec[ci] === 'number' && rec[ci] >= (m.aiNext || 1)) m.aiNext = rec[ci] + 1; }
        hit.push(rows.length); rows.push(rec);
      });
      checkTable(T, tn);
      return { T, kind: 'insert', hit, name: tn, n: hit.length };
    }
    const subs = st.k === 'update' ? [st.where].concat(st.sets.map((x) => x.e)) : [st.where];
    if (usesTable(subs, st.name)) throw new SErr('MySQL 不容許在 UPDATE／DELETE 的子查詢中使用正在修改的數據表 ' + st.name + '（ERROR 1093）。', 'other');
    if (st.where && hasAgg(st.where)) throw new SErr('聚合函數不可用在 WHERE。', 'agg');
    const hit = [];
    rows.forEach((r, i) => { const env = { f: { srcs, vals: [r] }, up: null, T: T0 }; if (!st.where || truth(ev(st.where, env))) hit.push(i); });
    if (st.k === 'delete') { t[1] = rows.filter((r, i) => !hit.includes(i)); checkParents(T, tn); return { T, kind: 'delete', hit, name: tn, n: hit.length, old: T0[tn][1] }; }
    st.sets.forEach((x) => { if (!cols.includes(x.col)) throw new SErr('數據表 ' + st.name + ' 沒有欄位 ' + x.col + '。', 'nocol'); if (hasAgg(x.e)) throw new SErr('SET 之後不可直接用聚合函數（要用子查詢）。', 'agg'); });
    for (const i of hit) { const old = T0[tn][1][i]; const rec = rows[i]; for (const x of st.sets) { const c = x.col; let v = b10(ev(x.e, { f: { srcs, vals: [rec] }, up: null, T: T0 })); if (x.e.k === 'col' && x.e.name === 'DEFAULT' && !x.e.q) v = m.def && c in m.def ? defVal(m.def[c]) : null; rec[cols.indexOf(c)] = coerce(v, types[c], c); } void old; }
    checkTable(T, tn); checkParents(T, tn);
    return { T, kind: 'update', hit, name: tn, n: hit.length };
  }
  function showCreate(T, tn) {
    const t = T[tn], m = t[3] || {}, lines = [];
    t[0].forEach((c) => { const C = up(c); let l = '  `' + c + '` ' + (m.types && m.types[C] ? m.types[C].toLowerCase() : 'varchar(255)'); if ((m.nn || []).map(up).includes(C) || (t[2] || []).map(up).includes(C)) l += ' NOT NULL'; if (m.def && C in m.def) l += ' DEFAULT ' + (m.def[C] && m.def[C].fn ? m.def[C].fn : m.def[C] === null ? 'NULL' : isStr(m.def[C]) ? "'" + m.def[C] + "'" : "'" + fmtV(m.def[C]) + "'"); else if (!(m.nn || []).map(up).includes(C) && !(t[2] || []).map(up).includes(C)) l += ' DEFAULT NULL'; if (m.ai && up(m.ai) === C) l += ' AUTO_INCREMENT'; lines.push(l); });
    if ((t[2] || []).length) lines.push('  PRIMARY KEY (' + t[2].map((c) => '`' + c + '`').join(',') + ')');
    (m.uq || []).forEach((u) => lines.push('  UNIQUE KEY `' + u.name + '` (' + u.cols.map((c) => '`' + c + '`').join(',') + ')'));
    (m.ix || []).forEach((u) => lines.push('  KEY `' + u.name + '` (' + u.cols.map((c) => '`' + c + '`').join(',') + ')'));
    (m.fk || []).forEach((f) => lines.push('  CONSTRAINT `' + f.name + '` FOREIGN KEY (' + f.cols.map((c) => '`' + c + '`').join(',') + ') REFERENCES `' + f.ref + '` (' + f.rcols.map((c) => '`' + c + '`').join(',') + ')'));
    (m.ck || []).forEach((c) => lines.push('  CONSTRAINT `' + c.name + '` CHECK (' + c.src + ')'));
    return 'CREATE TABLE `' + tn + '` (\n' + lines.join(',\n') + '\n)';
  }
  function addCon(T, tn, c) {
    const t = T[tn], m = meta(t), U = t[0].map(up);
    const chkCols = (cs) => cs.forEach((x) => { if (!U.includes(up(x))) throw new SErr('數據表 ' + tn + ' 沒有欄位 ' + x + '。', 'nocol'); });
    if (c.k === 'pk') { chkCols(c.cols); if (t[2].length) throw new SErr('數據表 ' + tn + ' 已經有主關鍵碼（一個數據表只可有一個主關鍵碼）。（MySQL：Multiple primary key defined）', 'pk'); t[2] = c.cols.map(up); }
    else if (c.k === 'fk') {
      chkCols(c.cols); const pn = findTOpt(T, c.ref); if (pn === undefined) throw new SErr('外鍵碼參照的數據表 ' + c.ref + ' 不存在。（MySQL：Failed to open the referenced table）', 'fk');
      const P = T[pn], PU = P[0].map(up); c.rcols.forEach((x) => { if (!PU.includes(up(x))) throw new SErr('數據表 ' + c.ref + ' 沒有欄位 ' + x + '。', 'nocol'); });
      const pm = P[3] || {}, keyed = (P[2] || []).map(up).join() === c.rcols.map(up).join() || (pm.uq || []).some((u) => u.cols.map(up).join() === c.rcols.map(up).join()) || (P[2] || []).length && up(P[2][0]) === up(c.rcols[0]);
      if (!keyed) throw new SErr('外鍵碼要參照另一數據表的主關鍵碼（或有 UNIQUE 限制的欄位）；' + c.ref + '(' + c.rcols.join(', ') + ') 不是。（MySQL：Missing index for constraint）', 'fk');
      if (c.cols.length !== c.rcols.length) throw new SErr('外鍵碼的欄位數目與參照的欄位數目不同。', 'count');
      m.nfk = (m.nfk || 0) + 1; m.fk.push({ name: c.name || (tn.toLowerCase() + '_ibfk_' + m.nfk), cols: c.cols.map(up), ref: pn, rcols: c.rcols.map(up) });
    } else if (c.k === 'uq') { chkCols(c.cols); let n = c.name || c.cols[0]; while ((m.uq || []).some((u) => up(u.name) === up(n))) n += '_2'; m.uq.push({ name: n, cols: c.cols.map(up) }); }
    else if (c.k === 'ck') { ckExpr(c.src); m.nck = (m.nck || 0) + 1; m.ck.push({ name: c.name || (tn.toLowerCase() + '_chk_' + m.nck), src: c.src }); }
    else if (c.k === 'ix') { chkCols(c.cols); m.ix.push({ name: c.name || c.cols[0], cols: c.cols.map(up) }); }
  }
  function applyColCons(T, tn, c) {
    const t = T[tn], m = meta(t), C = up(c.name);
    m.types[C] = c.type;
    m.nn = m.nn.filter((x) => up(x) !== C); if (c.nn) m.nn.push(C);
    if (c.def !== undefined) m.def[C] = c.def;
    if (c.ai) { if (m.ai && up(m.ai) !== C) throw new SErr('一個數據表只可有一個 AUTO_INCREMENT 欄位。', 'other'); m.ai = C; if (!baseType(c.type) || baseType(c.type) !== 'int') throw new SErr('AUTO_INCREMENT 只可用於整數欄位。', 'type'); }
    else if (m.ai && up(m.ai) === C) delete m.ai;
    if (c.pk) addCon(T, tn, { k: 'pk', cols: [C] });
    if (c.uq) addCon(T, tn, { k: 'uq', cols: [C] });
    if (c.ck) addCon(T, tn, { k: 'ck', src: c.ck });
    if (c.fk) addCon(T, tn, { k: 'fk', cols: [C], ref: c.fk.ref, rcols: c.fk.rcols });
    if (c.ai && !(t[2] || []).map(up).includes(C) && !(m.uq || []).some((u) => u.cols.length === 1 && up(u.cols[0]) === C)) throw new SErr('AUTO_INCREMENT 欄位必須是主關鍵碼（或有 UNIQUE 限制）。（MySQL：there can be only one auto column and it must be defined as a key）', 'other');
  }
  function ddl(T0, st) {
    const T = clone(T0);
    if (!T[VIEWS]) T[VIEWS] = {};
    const exists = (n) => findTOpt(T, n) !== undefined || findView(T, n) !== undefined;
    const done = (kind, name, msg, extra) => { if (!Object.keys(T[VIEWS]).length) delete T[VIEWS]; return Object.assign({ T, kind, name, msg }, extra || {}); };
    switch (st.k) {
      case 'misc': return done('misc', null, st.msg);
      case 'create_table': {
        if (exists(st.name)) { if (st.ine) return done('misc', null, '數據表 ' + st.name + ' 已存在，沒有改動。'); throw new SErr('數據表 ' + st.name + ' 已經存在。（MySQL：Table \'' + st.name + '\' already exists）', 'exists'); }
        const names = st.cols.map((c) => up(c.name)); names.forEach((n, i) => { if (names.indexOf(n) !== i) throw new SErr('欄名 ' + n + ' 重複了。', 'exists'); });
        if (!st.cols.length) throw new SErr('數據表最少要有一個欄位。', 'syntax');
        T[st.name] = [st.cols.map((c) => c.name), [], [], { types: {}, nn: [], uq: [], def: {}, ck: [], fk: [], ix: [] }];
        if (st.cols.filter((c) => c.pk).length > 1 || (st.cols.some((c) => c.pk) && st.cons.some((c) => c.k === 'pk'))) throw new SErr('一個數據表只可有一個主關鍵碼；複合主關鍵碼要寫成 PRIMARY KEY (欄1, 欄2)。（MySQL：Multiple primary key defined）', 'pk');
        for (const c of st.cons.filter((x) => x.k === 'pk')) addCon(T, st.name, c);
        for (const c of st.cols) { const ai = c.ai; c.ai = false; applyColCons(T, st.name, c); if (ai) c.ai = true; }
        for (const c of st.cons.filter((x) => x.k !== 'pk')) addCon(T, st.name, c);
        for (const c of st.cols) if (c.ai) applyColCons(T, st.name, Object.assign({}, c, { pk: false, uq: false, ck: null, fk: null }));
        return done('create_table', st.name, '已創建數據表 ' + st.name + '。');
      }
      case 'create_view': {
        const vn = findView(T, st.name);
        if (findTOpt(T, st.name) !== undefined) throw new SErr('已有數據表名為 ' + st.name + '。', 'exists');
        if (vn !== undefined && !st.orRep) throw new SErr('檢視 ' + st.name + ' 已經存在（要修改可用 CREATE OR REPLACE VIEW）。（MySQL：Table \'' + st.name + '\' already exists）', 'exists');
        if (vn !== undefined) delete T[VIEWS][vn];
        const r = runQ(st.q, T, null);
        if (st.vcols && st.vcols.length !== r.cols.length) throw new SErr('檢視的欄名數目與 SELECT 的欄數不同。', 'count');
        const cols = st.vcols || r.cols; cols.forEach((c, i) => { if (cols.findIndex((x) => up(x) === up(c)) !== i) throw new SErr('檢視中有兩個欄位同名（' + c + '），要用 AS 改名。（MySQL：Duplicate column name）', 'exists'); });
        T[VIEWS][st.name] = { sql: st.sql, cols: st.vcols || null };
        return done('create_view', st.name, (vn !== undefined ? '已重新定義檢視 ' : '已創建檢視 ') + st.name + '。');
      }
      case 'drop_table': case 'drop_view': {
        const msgs = [];
        for (const n of st.names) {
          if (st.k === 'drop_view') { const vn = findView(T, n); if (vn === undefined) { if (st.ie) continue; throw new SErr('沒有檢視 ' + n + '。', 'notable'); } delete T[VIEWS][vn]; msgs.push(vn); continue; }
          const tn = findTOpt(T, n); if (tn === undefined) { if (st.ie) continue; throw new SErr('沒有數據表 ' + n + '。（MySQL：Unknown table）', 'notable'); }
          for (const cn of tableKeys(T)) { if (up(cn) === up(tn) || st.names.map(up).includes(up(cn))) continue; if ((T[cn][3] && T[cn][3].fk || []).some((f) => up(f.ref) === up(tn))) throw new SErr('數據表 ' + cn + ' 有外鍵碼參照 ' + tn + '，要先刪除該外鍵碼或數據表 ' + cn + '。（MySQL：Cannot drop table referenced by a foreign key constraint）', 'fk'); }
          delete T[tn]; msgs.push(tn);
        }
        return done(st.k, msgs[0] || null, msgs.length ? '已刪除 ' + msgs.join('、') + '。' : '沒有改動。');
      }
      case 'create_index': { const tn = findT(T, st.table); const m = meta(T[tn]); if ([...m.ix, ...m.uq].some((u) => up(u.name) === up(st.name))) throw new SErr('索引 ' + st.name + ' 已經存在。', 'exists'); addCon(T, tn, { k: st.unique ? 'uq' : 'ix', name: st.name, cols: st.cols }); checkTable(T, tn); return done('alter', tn, '已為 ' + tn + ' 建立索引 ' + st.name + '。'); }
      case 'alter': {
        let tn = findT(T, st.name); const msgs = [];
        for (const o of st.ops) {
          const t = T[tn], m = meta(t), U = () => t[0].map(up), ci = (c) => { const i = U().indexOf(up(c)); if (i < 0) throw new SErr('數據表 ' + tn + ' 沒有欄位 ' + c + '。', 'nocol'); return i; };
          switch (o.op) {
            case 'rename': { if (exists(o.to)) throw new SErr('已有數據表名為 ' + o.to + '。', 'exists'); T[o.to] = t; delete T[tn]; for (const cn of tableKeys(T)) (T[cn][3] && T[cn][3].fk || []).forEach((f) => { if (up(f.ref) === up(tn)) f.ref = o.to; }); tn = o.to; msgs.push('數據表改名為 ' + o.to); break; }
            case 'rename_col': { const i = ci(o.a); if (U().includes(up(o.b)) && up(o.b) !== up(o.a)) throw new SErr('已有欄位 ' + o.b + '。', 'exists'); const A = up(o.a), B = up(o.b); t[0][i] = o.b; const ren = (c) => (up(c) === A ? B : c); t[2] = t[2].map(ren); m.nn = m.nn.map(ren); if (A in m.types) { m.types[B] = m.types[A]; if (A !== B) delete m.types[A]; } if (A in m.def) { m.def[B] = m.def[A]; if (A !== B) delete m.def[A]; } if (m.ai && up(m.ai) === A) m.ai = B; [...m.uq, ...m.ix, ...m.fk].forEach((u) => { u.cols = u.cols.map(ren); }); for (const cn of tableKeys(T)) (T[cn][3] && T[cn][3].fk || []).forEach((f) => { if (up(f.ref) === up(tn)) f.rcols = f.rcols.map(ren); }); m.ck.forEach((c) => { c.src = c.src.replace(new RegExp('\\b' + A + '\\b', 'gi'), B); }); msgs.push('欄位 ' + o.a + ' 改名為 ' + o.b); break; }
            case 'add_col': { if (U().includes(up(o.c.name))) throw new SErr('數據表 ' + tn + ' 已有欄位 ' + o.c.name + '。（MySQL：Duplicate column name）', 'exists'); let at = t[0].length; if (o.pos && o.pos.first) at = 0; else if (o.pos && o.pos.after) at = ci(o.pos.after) + 1; t[0].splice(at, 0, o.c.name); const dv = o.c.def !== undefined ? coerce(defVal(o.c.def), o.c.type, up(o.c.name)) : null; t[1].forEach((r, k) => r.splice(at, 0, o.c.ai ? k + 1 : dv)); applyColCons(T, tn, o.c); msgs.push('加入欄位 ' + o.c.name); break; }
            case 'add_con': addCon(T, tn, o.c); msgs.push('加入限制'); break;
            case 'modify': case 'change': {
              const old = o.op === 'change' ? o.a : o.c.name, i = ci(old), C = up(o.c.name);
              if (o.op === 'change' && up(old) !== C) { if (U().includes(C)) throw new SErr('已有欄位 ' + o.c.name + '。', 'exists'); ddl0(T, tn, old, o.c.name); }
              if (C in m.def && o.c.def === undefined) delete m.def[C];
              t[1].forEach((r) => { r[i] = coerce(r[i], o.c.type, C); });
              applyColCons(T, tn, o.c); msgs.push('修改欄位 ' + o.c.name); break;
            }
            case 'drop_col': { const i = ci(o.col), C = up(o.col); if (t[0].length === 1) throw new SErr('不可刪除數據表唯一的欄位（要用 DROP TABLE）。', 'other'); for (const cn of tableKeys(T)) if (up(cn) !== up(tn) && (T[cn][3] && T[cn][3].fk || []).some((f) => up(f.ref) === up(tn) && f.rcols.includes(C))) throw new SErr('數據表 ' + cn + ' 的外鍵碼參照了欄位 ' + o.col + '，不可刪除。', 'fk'); if (m.fk.some((f) => f.cols.includes(C))) throw new SErr('欄位 ' + o.col + ' 是外鍵碼，要先 DROP FOREIGN KEY。（MySQL：Cannot drop column needed in a foreign key constraint）', 'fk'); t[0].splice(i, 1); t[1].forEach((r) => r.splice(i, 1)); t[2] = t[2].filter((c) => up(c) !== C); m.nn = m.nn.filter((c) => up(c) !== C); delete m.types[C]; delete m.def[C]; if (m.ai && up(m.ai) === C) delete m.ai; m.uq = m.uq.map((u) => Object.assign({}, u, { cols: u.cols.filter((c) => c !== C) })).filter((u) => u.cols.length); m.ix = m.ix.map((u) => Object.assign({}, u, { cols: u.cols.filter((c) => c !== C) })).filter((u) => u.cols.length); m.ck = m.ck.filter((c) => !new RegExp('\\b' + C + '\\b', 'i').test(c.src)); msgs.push('刪除欄位 ' + o.col); break; }
            case 'drop_pk': if (!t[2].length) throw new SErr('數據表 ' + tn + ' 沒有主關鍵碼。', 'other'); for (const cn of tableKeys(T)) if (up(cn) !== up(tn) && (T[cn][3] && T[cn][3].fk || []).some((f) => up(f.ref) === up(tn))) throw new SErr('數據表 ' + cn + ' 的外鍵碼參照了 ' + tn + ' 的主關鍵碼，不可刪除。', 'fk'); if (m.ai) throw new SErr('AUTO_INCREMENT 欄位必須是主關鍵碼，要先 MODIFY 該欄。', 'other'); t[2].forEach((c) => { if (!m.nn.includes(up(c))) m.nn.push(up(c)); }); t[2] = []; msgs.push('刪除主關鍵碼'); break;
            case 'drop_fk': { const k = m.fk.findIndex((f) => up(f.name) === up(o.name)); if (k < 0) throw new SErr('沒有名為 ' + o.name + ' 的外鍵碼（可用 SHOW CREATE TABLE ' + tn + ' 查看限制名稱）。', 'other'); m.fk.splice(k, 1); msgs.push('刪除外鍵碼 ' + o.name); break; }
            case 'drop_index': { let k = m.uq.findIndex((u) => up(u.name) === up(o.name)); if (k >= 0) { m.uq.splice(k, 1); msgs.push('刪除索引 ' + o.name); break; } k = m.ix.findIndex((u) => up(u.name) === up(o.name)); if (k < 0) throw new SErr('沒有名為 ' + o.name + ' 的索引。', 'other'); m.ix.splice(k, 1); msgs.push('刪除索引 ' + o.name); break; }
            case 'drop_check': { const k = m.ck.findIndex((c) => up(c.name) === up(o.name)); if (k < 0) { const f = m.fk.findIndex((x) => up(x.name) === up(o.name)); if (f >= 0) { m.fk.splice(f, 1); msgs.push('刪除限制 ' + o.name); break; } throw new SErr('沒有名為 ' + o.name + ' 的 CHECK 限制（可用 SHOW CREATE TABLE ' + tn + ' 查看限制名稱）。', 'other'); } m.ck.splice(k, 1); msgs.push('刪除 CHECK 限制 ' + o.name); break; }
            case 'set_def': ci(o.col); m.def[up(o.col)] = coerce(o.v, m.types[up(o.col)], up(o.col)); msgs.push('設定 ' + o.col + ' 的預設值'); break;
            case 'drop_def': ci(o.col); delete m.def[up(o.col)]; msgs.push('刪除 ' + o.col + ' 的預設值'); break;
          }
        }
        checkTable(T, tn); checkParents(T, tn);
        return done('alter', tn, '已修改數據表 ' + tn + '：' + msgs.join('；') + '。');
      }
      case 'show_tables': { const names = tableKeys(T).concat(Object.keys(T[VIEWS] || {})).sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1)); return done('select', null, null, { cols: ['Tables_in_db'], rows: names.map((n) => [n]) }); }
      case 'show_create': { const vn = findView(T, st.name); if (vn !== undefined && findTOpt(T, st.name) === undefined) return done('select', null, null, { cols: ['View', 'Create View'], rows: [[vn, 'CREATE VIEW `' + vn + '` AS ' + T[VIEWS][vn].sql]] }); const tn = findT(T, st.name); return done('select', null, null, { cols: ['Table', 'Create Table'], rows: [[tn, showCreate(T, tn)]] }); }
      case 'describe': {
        const vn = findView(T, st.name);
        if (vn !== undefined && findTOpt(T, st.name) === undefined) { const [cols] = viewData(T, vn); return done('select', null, null, { cols: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows: cols.map((c) => [c, '', 'YES', '', null, '']) }); }
        const tn = findT(T, st.name), t = T[tn], m = t[3] || {};
        const rows = t[0].map((c) => { const C = up(c), pk = (t[2] || []).map(up).includes(C), nn = pk || (m.nn || []).map(up).includes(C); const key = pk ? 'PRI' : (m.uq || []).some((u) => u.cols.length === 1 && u.cols[0] === C) ? 'UNI' : (m.fk || []).some((f) => f.cols[0] === C) || (m.ix || []).some((u) => u.cols[0] === C) || (m.uq || []).some((u) => u.cols[0] === C) ? 'MUL' : ''; const d = m.def && C in m.def ? m.def[C] : null; return [c, m.types && m.types[C] ? m.types[C].toLowerCase() : '', nn ? 'NO' : 'YES', key, d && d.fn ? d.fn : d, m.ai && up(m.ai) === C ? 'auto_increment' : '']; });
        return done('select', null, null, { cols: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows });
      }
    }
    throw new SErr('不支援這種語句。', 'other');
  }
  function ddl0(T, tn, a, b) {
    const t = T[tn], m = meta(t), A = up(a), B = up(b), i = t[0].map(up).indexOf(A); t[0][i] = b; const ren = (c) => (up(c) === A ? B : c);
    t[2] = t[2].map(ren); m.nn = m.nn.map(ren); if (A in m.def) { m.def[B] = m.def[A]; delete m.def[A]; } delete m.types[A]; if (m.ai && up(m.ai) === A) m.ai = B;
    [...m.uq, ...m.ix, ...m.fk].forEach((u) => { u.cols = u.cols.map(ren); });
  }
  // ---------------- 腳本 ----------------
  // 逐句執行；遇到錯誤便停止。回傳 {T, steps:[{sql, res}], last, error:{msg, code, label, idx, sql}}
  function runScript(T0, src) {
    let T = T0; const steps = []; let stmts;
    try { stmts = splitSQL(src); } catch (e) { return { T, steps, last: null, error: errInfo(e, 0, src) }; }
    if (!stmts.length) return { T, steps, last: null, error: { msg: '沒有 SQL 語句。', code: 'syntax', label: ERR.syntax, idx: 0, sql: '' } };
    for (let i = 0; i < stmts.length; i++) {
      try { const r = exec(T, stmts[i]); steps.push({ sql: stmts[i], res: r }); T = r.T || T; }
      catch (e) { if (!(e instanceof SErr)) { if (e instanceof RangeError) e = new SErr('運算太複雜（可能是遞迴太深）。', 'other'); else throw e; } return { T, steps, last: steps.length ? steps[steps.length - 1].res : null, error: errInfo(e, i, stmts[i]) }; }
    }
    return { T, steps, last: steps[steps.length - 1].res, error: null };
  }
  function errInfo(e, idx, sql) { if (!(e instanceof SErr)) throw e; return { msg: e.message, code: e.code || 'other', label: ERR[e.code || 'other'] || ERR.other, idx, sql }; }
  // 把單元給的數據庫變成標準格式：{表: [cols, rows, pk, meta]}；也接受 SQL 腳本字串
  function normDb(db) {
    if (typeof db === 'string') { const r = runScript({}, db); if (r.error) throw new Error('建立數據庫的 SQL 出錯（第 ' + (r.error.idx + 1) + ' 句）：' + r.error.msg); return r.T; }
    const T = clone(db || {});
    for (const k of tableKeys(T)) {
      const t = T[k]; if (!Array.isArray(t) || !Array.isArray(t[0]) || !Array.isArray(t[1])) throw new Error('數據表 ' + k + ' 的格式不正確（要寫成 [[欄名…], [[值…], …]]）。');
      t[1].forEach((r, i) => { if (!Array.isArray(r) || r.length !== t[0].length) throw new Error('數據表 ' + k + ' 第 ' + (i + 1) + ' 項記錄的數值數目與欄位數目不同。'); r.forEach((v) => { if (!(v === null || typeof v === 'number' || typeof v === 'string')) throw new Error('數據表 ' + k + ' 有不支援的數值 ' + JSON.stringify(v) + '（只可用數字、字串、null）。'); }); });
      const star = t[0].map((c) => String(c).startsWith('*'));
      if (star.some(Boolean)) { t[0] = t[0].map((c) => String(c).replace(/^\*/, '')); if (!t[2] || !t[2].length) t[2] = t[0].filter((c, i) => star[i]); }
      if (t[2] == null) t[2] = [];
      if (typeof t[2] === 'string') t[2] = [t[2]];
      t[2].forEach((c) => { if (!t[0].map(up).includes(up(c))) throw new Error('數據表 ' + k + ' 的主關鍵碼 ' + c + ' 不是它的欄位。'); });
      if (t[3]) meta(t);
    }
    for (const k of tableKeys(T)) { try { checkTable(T, k); } catch (e) { throw new Error('數據表 ' + k + ' 的數據違反限制：' + e.message); } }
    return T;
  }
  function evalRow(T, tname, alias, rec, exprSrc) { const e = safeParse('SELECT ' + exprSrc + ' FROM ' + tname).items[0].e; const tn = findT(T, tname); return ev(e, { f: { srcs: [{ alias: alias || tname, name: tname, cols: T[tn][0].map(up), pk: [] }], vals: [rec] }, up: null, T }); }
  const SQL = { SErr, ERR, errLabel, tokenize, parse: safeParse, splitSQL, run, exec, runScript, normDb, evalRow, fmtV, fmtNum, likeRe, cmpv, keyOf, tableKeys, findT: findTOpt, findView, VIEWS, coerce, showCreate, clone };

  // =================== 設計引擎（FDX）：功能相關性、候選鍵碼、範式、分拆 ===================
  const FDX = (() => {
    const S = (x) => (Array.isArray(x) ? x.slice() : String(x).split(/[\s,，、]+/).filter(Boolean));
    const has = (A, B) => B.every((b) => A.includes(b));
    const eqs = (A, B) => A.length === B.length && has(A, B);
    const FD = (spec) => (Array.isArray(spec) ? spec : String(spec).replace(/→/g, '->').split(/[;\n；]/).filter((x) => x.includes('->')).map((x) => { const [l, r] = x.split('->'); return [S(l), S(r)]; }));
    function closure(X, F) { const c = uniq(S(X)); let ch = true; while (ch) { ch = false; for (const [l, r] of F) if (has(c, l) && !has(c, r)) { r.forEach((a) => { if (!c.includes(a)) c.push(a); }); ch = true; } } return c; }
    function* combos(arr, n, st = 0, cur = []) { if (cur.length === n) { yield cur.slice(); return; } for (let i = st; i < arr.length; i++) { cur.push(arr[i]); yield* combos(arr, n, i + 1, cur); cur.pop(); } }
    const sorted = (a) => a.slice().sort();
    const restrict = (F, R) => F.map(([l, r]) => [l.filter((a) => R.includes(a)), r.filter((a) => R.includes(a))]);
    function keys(R0, F0) {
      const R = sorted(uniq(S(R0))), F = restrict(F0, R), found = [];
      for (let n = 1; n <= R.length; n++) for (const c of combos(R, n)) { if (found.some((k) => has(c, k))) continue; if (has(closure(c, F), R)) found.push(c); }
      return found.map(sorted);
    }
    function project(F, S0) { const Sx = sorted(uniq(S(S0))), out = []; for (let n = 1; n < Sx.length; n++) for (const X of combos(Sx, n)) { const Y = closure(X, F).filter((a) => Sx.includes(a) && !X.includes(a)); if (Y.length) out.push([X, Y]); } return out; }
    function nf(R0, F, projected) {
      const R = sorted(uniq(S(R0))), G = projected ? project(F, R) : F.filter(([l]) => has(R, l)).map(([l, r]) => [l, r.filter((a) => R.includes(a))]);
      const ks = keys(R, G), prime = uniq([].concat(...ks)), partial = [], trans = [];
      for (const k of ks) for (let n = 1; n < k.length; n++) for (const part of combos(k, n)) { const dep = closure(part, G).filter((a) => R.includes(a) && !prime.includes(a) && !part.includes(a)); if (dep.length) partial.push([part, sorted(dep), k]); }
      for (const [l, r] of G) {
        if (has(closure(l, G), R)) continue;
        let bad = r.filter((a) => !l.includes(a) && !prime.includes(a));
        bad = bad.filter((x) => { for (let n = 1; n < l.length; n++) for (const sub of combos(sorted(l), n)) if (closure(sub, G).includes(x)) return false; return true; });
        if (bad.length && !ks.some((k) => has(k, l) && k.length > l.length)) trans.push([sorted(l), sorted(bad)]);
      }
      return { nf: partial.length ? 1 : trans.length ? 2 : 3, partial, trans, keys: ks };
    }
    function checkSplit(R0, F, parts0) {
      const R = sorted(uniq(S(R0))), parts = parts0.map((p) => sorted(uniq(S(p)))), U = uniq([].concat(...parts)), probs = [];
      if (!eqs(U, R)) probs.push('欄位不齊或多出');
      const rows = parts.map((p, i) => Object.fromEntries(R.map((a) => [a, p.includes(a) ? 'a' : 'b' + i + a])));
      let ch = true;
      while (ch) { ch = false; for (const [l, r] of F) for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) if (l.every((a) => rows[i][a] === rows[j][a])) for (const a of r) if (R.includes(a) && rows[i][a] !== rows[j][a]) { const v = rows[i][a] === 'a' || rows[j][a] === 'a' ? 'a' : rows[i][a] < rows[j][a] ? rows[i][a] : rows[j][a]; rows[i][a] = rows[j][a] = v; ch = true; } }
      const lossless = rows.some((row) => R.every((a) => row[a] === 'a'));
      if (!lossless) probs.push('不是無損分拆');
      const G = [].concat(...parts.map((p) => project(F, p)));
      const preserving = F.every(([l, r]) => has(closure(l, G), r.filter((a) => R.includes(a))));
      if (!preserving) probs.push('有功能相關性未能保留');
      const nfs = parts.map((p) => nf(p, F, true));
      nfs.forEach((x, i) => { if (x.nf < 3) probs.push(parts[i].join(',') + ' 只達第 ' + x.nf + ' 範式'); });
      return { lossless, preserving, nf: nfs.map((x) => x.nf), keys: nfs.map((x) => x.keys), problems: probs };
    }
    function violates(cols, rows, F) { const bad = []; for (const [l, r] of F) { const seen = {}; for (const row of rows) { const k = JSON.stringify(l.map((a) => row[cols.indexOf(a)])), v = JSON.stringify(r.map((a) => row[cols.indexOf(a)])); if (k in seen && seen[k] !== v) { bad.push([l, r]); break; } seen[k] = v; } } return bad; }
    function closureSteps(X, F) { const c = uniq(S(X)), st = []; let ch = true; while (ch) { ch = false; for (const [l, r] of F) if (has(c, l) && !has(c, r)) { const add = r.filter((a) => !c.includes(a)); add.forEach((a) => c.push(a)); st.push([l, r, add]); ch = true; } } return { all: c, steps: st }; }
    const fdStr = ([l, r]) => l.join(', ') + ' → ' + r.join(', ');
    return { FD, S, closure, keys, project, nf, checkSplit, violates, closureSteps, fdStr, has, eqs, sorted, combos };
  })();

  const API = Object.assign({ SQL, FDX }, SQL);
  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.SQLE = API;
})(typeof self !== 'undefined' ? self : this);
