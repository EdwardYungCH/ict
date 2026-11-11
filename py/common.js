/* Python 自學平台 共用框架（D2、選修C）：登記、進度、計分、HMAC 報告、老師 PIN、
 * 學／試／練／寫程式／小測／無限練習元件、Thonny 式 Python 編輯器＋Shell＋變量＋逐步執行。
 * 題目答案由 build（CPython）預先計算，放在 _right、_ans、_trace、_exp、_run 等欄位；
 * 學生自己的程式用 Skulpt 執行（需要先載入 skulpt 及 pyrun.js → window.PyRun）。
 * 在 Node 載入（build.js）時只會用到 GENS、same() 等純函數，不會碰 document。
 */
(function (root) {
  'use strict';
  const PY = (root.PY = root.PY || {});
  const PyRun = () => root.PyRun;

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
  if (typeof localStorage !== 'undefined' || typeof document !== 'undefined') {
    try { const t = '__pyt'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { store.ok = false; }
  }
  PY.h = h; PY.md = md; PY.store = store;

  // ---------------- 答案比對（SPEC §2.2） ----------------
  function normOut(s) {
    const L = String(s == null ? '' : s).replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
    while (L.length && !L[L.length - 1]) L.pop();
    while (L.length && !L[0]) L.shift();
    return L.join('\n');
  }
  const NUM = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
  function tokEq(a, b, tol) {
    if (a === b) return true;
    if (NUM.test(a) && NUM.test(b)) {
      const fa = /[.eE]/.test(a), fb = /[.eE]/.test(b);
      const x = Number(a), y = Number(b);
      if (tol) return Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y));
      return fa === fb && x === y;
    }
    return false;
  }
  function lineEq(a, b, tol) {
    if (a === b) return true;
    const ta = a.split(' '), tb = b.split(' ');
    if (ta.length !== tb.length) return false;
    return ta.every((x, i) => tokEq(x, tb[i], tol));
  }
  function same(a, b, opt) {
    opt = opt || {};
    const la = normOut(a).split('\n').map((l) => l.trim().replace(/\s+/g, ' '));
    const lb = normOut(b).split('\n').map((l) => l.trim().replace(/\s+/g, ' '));
    if (la.length !== lb.length) return false;
    return la.every((l, i) => lineEq(l, lb[i], opt.tol));
  }
  // 學生在單行輸入框作答時：多行答案可用空格分隔
  function sameLoose(a, b, opt) {
    if (same(a, b, opt)) return true;
    const j = (s) => normOut(s).replace(/\n/g, ' ');
    return same(j(a), j(b), opt);
  }
  PY.normOut = normOut; PY.same = same; PY.sameLoose = sameLoose;

  // ---------------- SHA-256／HMAC（純 JS） ----------------
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
  PY.hmacHex = hmacHex; PY.canon = canon;
  PY.signReport = (rep, key) => hmacHex(key, canon(rep));
  PY.verifyReport = (rep, key) => { const r = Object.assign({}, rep); const sig = r.sig; delete r.sig; return !!sig && hmacHex(key, canon(r)) === sig; };

  // ---------------- 程式碼工具 ----------------
  // 去掉註解（保留字串內的 #）
  function stripComments(code) {
    return String(code).split('\n').map((line) => {
      let q = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
        if (c === '"' || c === "'") q = c;
        else if (c === '#') return line.slice(0, i).replace(/\s+$/, '');
      }
      return line;
    }).join('\n');
  }
  PY.stripComments = stripComments;
  const subBlanks = (tpl, vals) => tpl.replace(/［(\d+)］/g, (_, n) => (vals[Number(n) - 1] == null ? '' : vals[Number(n) - 1]));
  const blankCount = (tpl) => new Set((String(tpl).match(/［(\d+)］/g) || [])).size;
  PY.subBlanks = subBlanks; PY.blankCount = blankCount;
  function checkRules(rules, code) {
    const c = stripComments(code);
    for (const r of rules || []) {
      if (r.must != null && !c.includes(r.must)) return r.msg || `程式要用到「${r.must}」。`;
      if (r.mustNot != null && c.includes(r.mustNot)) return r.msg || `程式不可以用「${r.mustNot}」。`;
      if (r.re != null && !new RegExp(r.re).test(c)) return r.msg || '程式不符合題目要求。';
      if (r.reNot != null && new RegExp(r.reNot).test(c)) return r.msg || '程式不符合題目要求。';
    }
    return null;
  }
  PY.checkRules = checkRules;
  // 一次執行的結果與期望比較（SPEC：out、vars、file、nums）
  function compareRun(got, exp, chk) {
    chk = chk || {};
    const tol = !!chk.nums;
    if (exp.err) {
      if (!got.err) return { ok: false, msg: `期望出現 ${exp.err.type}，但你的程式沒有出錯。` };
      if (got.err.type !== exp.err.type) return { ok: false, msg: `期望出現 ${exp.err.type}，你的程式出現 ${got.err.type}。` };
    } else if (got.err) {
      return { ok: false, msg: got.err.type === 'Timeout' ? '執行超時（可能是無限循環）。' : `執行出錯：${got.err.type}（第 ${got.err.line} 行）${got.err.msg ? '：' + got.err.msg : ''}`, err: got.err };
    }
    if (chk.out !== false && !same(got.out, exp.out, { tol })) return { ok: false, msg: '輸出不同。', diff: 'out' };
    for (const v of chk.vars || []) {
      const g = got.vars && v in got.vars ? got.vars[v] : '（未有值）', e = exp.vars && v in exp.vars ? exp.vars[v] : '（未有值）';
      if (!same(g, e, { tol })) return { ok: false, msg: `最後 ${v} 的值：期望 ${e}，你的程式是 ${g}。` };
    }
    if (chk.file) {
      const g = got.files && chk.file in got.files ? got.files[chk.file] : null, e = exp.files && chk.file in exp.files ? exp.files[chk.file] : null;
      if (g == null && e != null) return { ok: false, msg: `你的程式沒有建立檔案 ${chk.file}。` };
      if (!same(g || '', e || '', { tol })) return { ok: false, msg: `檔案 ${chk.file} 的內容不同。`, diff: 'file' };
    }
    return { ok: true };
  }
  PY.compareRun = compareRun;

  // ---------------- 主題 ----------------
  function themeBtn() {
    const b = h('button.iconbtn', { type: 'button', title: '切換淺色／深色' });
    const cur = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const lab = () => { b.textContent = cur() === 'dark' ? '☀ 淺色' : '☾ 深色'; };
    const saved = store.get('py:theme'); if (saved) document.documentElement.setAttribute('data-theme', saved);
    b.onclick = () => { const t = cur() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); store.set('py:theme', t); lab(); };
    lab(); return b;
  }

  // ---------------- Python 語法顏色 ----------------
  const PYKW = 'False|None|True|and|as|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield';
  const PYBI = 'print|input|int|float|str|len|range|list|abs|round|max|min|sum|sorted|ord|chr|type|bool|open|dict|enumerate|isinstance|divmod|pow';
  const HLRE = new RegExp(`(#.*$)|([rRfFbB]{0,2}(?:"(?:[^"\\\\]|\\\\.)*"?|'(?:[^'\\\\]|\\\\.)*'?))|\\b(${PYKW})\\b|\\b(${PYBI})(?=\\s*\\()|\\b(\\d+\\.?\\d*(?:[eE][-+]?\\d+)?)\\b`, 'g');
  function hlLine(s) {
    let out = '', last = 0, m;
    HLRE.lastIndex = 0;
    while ((m = HLRE.exec(s))) {
      if (!m[0]) { HLRE.lastIndex++; continue; }
      out += esc(s.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'b' : 'n';
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  PY.hlLine = hlLine;
  function codeView(code, opt) {
    opt = opt || {};
    const el = h('pre.code', { 'aria-label': opt.label || 'Python 程式' });
    const lines = String(code).split('\n');
    const rows = lines.map((s, i) => {
      const ln = h('div.ln', h('span.no', String(i + 1)));
      const body = h('span.lc');
      if (opt.blanks) {
        const segs = s.split(/(［\d+］)/);
        for (const seg of segs) {
          const mm = seg.match(/^［(\d+)］$/);
          if (mm) { const inp = h('input.blank', { type: 'text', 'aria-label': `空格 ${mm[1]}`, 'data-b': mm[1], size: 8, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }); opt.blanks[mm[1]] = opt.blanks[mm[1]] || inp; body.append(inp); }
          else body.insertAdjacentHTML('beforeend', hlLine(seg));
        }
      } else body.innerHTML = hlLine(s) || ' ';
      ln.append(body); el.append(ln); return ln;
    });
    el.mark = (line, cls) => {
      rows.forEach((r) => r.classList.remove('hl', 'err'));
      if (line != null && line > 0 && rows[line - 1]) {
        rows[line - 1].classList.add(cls || 'hl');
        const box = el.closest('.ide-code');
        if (box && box.scrollHeight > box.clientHeight + 4) rows[line - 1].scrollIntoView({ block: 'nearest' });
      }
    };
    return el;
  }
  PY.codeView = codeView;

  // ---------------- 編輯器（行號、Tab 4 格、自動縮排、語法顏色） ----------------
  function Editor(code, opt) {
    opt = opt || {};
    const ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'Python 編輯器' });
    ta.value = code || '';
    const gut = h('div.ed-gut', { 'aria-hidden': 'true' });
    const hl = h('pre.ed-hl', { 'aria-hidden': 'true' });
    let errLine = null;
    const sync = () => {
      const lines = ta.value.split('\n');
      gut.innerHTML = lines.map((_, i) => (i + 1 === errLine ? `<span class="e">${i + 1}</span>` : String(i + 1))).join('\n');
      hl.innerHTML = lines.map((l, i) => (i + 1 === errLine ? `<span class="errl">${hlLine(l) || ' '}</span>` : hlLine(l))).join('\n') + '\n';
      ta.rows = Math.max(opt.minRows || 6, lines.length + 1);
      hl.scrollLeft = ta.scrollLeft;
    };
    const changed = () => { sync(); if (opt.onChange) opt.onChange(ta.value); };
    const insert = (txt) => { const s = ta.selectionStart, e = ta.selectionEnd; ta.setRangeText(txt, s, e, 'end'); ta.focus(); changed(); };
    const lineStart = (pos) => ta.value.lastIndexOf('\n', pos - 1) + 1;
    ta.addEventListener('input', () => { if (errLine) errLine = null; changed(); });
    ta.addEventListener('scroll', () => { hl.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Tab' && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
        if (ta.dataset.esc === '1') { ta.dataset.esc = ''; return; }
        ev.preventDefault();
        if (ev.shiftKey) {
          const ls = lineStart(ta.selectionStart); const m = ta.value.slice(ls).match(/^ {1,4}/);
          if (m) { const s = ta.selectionStart; ta.setRangeText('', ls, ls + m[0].length, 'preserve'); ta.selectionStart = ta.selectionEnd = Math.max(ls, s - m[0].length); changed(); }
        } else insert('    ');
      } else if (ev.key === 'Escape') { ta.dataset.esc = '1'; }
      else if (ev.key === 'Enter' && !ev.isComposing && !ev.shiftKey && !ev.ctrlKey) {
        const ls = lineStart(ta.selectionStart); const cur = ta.value.slice(ls, ta.selectionStart);
        let ind = cur.match(/^ */)[0];
        if (/:\s*(#.*)?$/.test(cur)) ind += '    ';
        else if (/^\s*(return|break|continue|pass)\b/.test(cur)) ind = ind.slice(0, Math.max(0, ind.length - 4));
        ev.preventDefault(); insert('\n' + ind);
      } else if (ev.key === 'Enter' && ev.ctrlKey && opt.onCtrlEnter) { ev.preventDefault(); opt.onCtrlEnter(); }
    });
    const tools = h('div.ed-tools', { role: 'toolbar', 'aria-label': '插入符號' },
      (opt.tools || [':', '(', ')', '"', '[', ']', '=', '==', '!=', '<=', '>=', 'print(', 'input(', 'int(']).map((t) => h('button', { type: 'button', onclick: () => insert(t), title: `插入「${t}」` }, t)),
      h('button', { type: 'button', title: '縮排（Tab）', onclick: () => insert('    ') }, '⇥ 縮排'));
    const box = h('div.ed-box', gut, h('div.ed-area', hl, ta));
    const el = h('div.ed', tools, box, h('p.ed-hint', 'Tab 鍵縮排 4 格，Shift+Tab 減少縮排；Enter 會自動縮排；按 Esc 後再按 Tab 可離開編輯框。'));
    sync();
    return { el, ta, get: () => ta.value, set: (v) => { ta.value = v; changed(); }, markErr: (l) => { errLine = l; sync(); } };
  }
  PY.Editor = Editor;

  // ---------------- Thonny 式 Python 執行器 ----------------
  // o: {code, editable, inputs, files, fixRandom, run:{steps,out,err,vrepr,cut}, fname, locked, lockMsg, open, noInput, minRows, onChange}
  const reprToTxt = (r) => (r == null ? '' : /^'.*'$|^".*"$/s.test(r) ? r.slice(1, -1) : r);
  function PyIDE(o) {
    o = o || {};
    const self = { locked: !!o.locked, k: 0, running: false };
    const fname = o.fname || 'main.py';
    const pre = o.run || null;
    const steps = pre && pre.steps ? pre.steps : null;
    const bRun = h('button.btn.primary.small', { type: 'button' }, '▶ 執行');
    const bStep = h('button.btn.small', { type: 'button', hidden: !steps }, '⏭ 下一步');
    const bReset = h('button.btn.ghost.small', { type: 'button', hidden: !steps }, '↺ 重設');
    const bStop = h('button.btn.ghost.small', { type: 'button', hidden: true }, '■ 停止');
    const stepInfo = h('span.sim-step');
    const bar = h('div.ide-bar', bRun, bStep, bReset, bStop, h('span.fname', fname), stepInfo);
    const codeBox = h('div.ide-code');
    let editor = null, view = null;
    if (o.editable) { editor = Editor(o.code || '', { minRows: o.minRows, onChange: (v) => { codeChanged(); if (o.onChange) o.onChange(v); }, onCtrlEnter: () => bRun.click() }); codeBox.append(editor.el); }
    else { view = codeView(o.code || ''); codeBox.append(view); }
    const varsEl = h('div.vtab');
    const side = h('div.ide-side', h('h4', '變量'), varsEl);
    const main = h('div.ide-main', codeBox, side);
    const hasInput = !o.noInput && (o.editable || /\binput\s*\(/.test(o.code || '') || (o.inputs != null && String(o.inputs) !== ''));
    const inTa = h('textarea.ide-in', { rows: Math.max(1, String(o.inputs || '').split('\n').length), spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': '輸入數據（每行一個）' });
    inTa.value = o.inputs || '';
    const inRow = hasInput ? h('label.ide-inrow', h('span', '輸入', h('small', '（每行一個值，依次給每次 input()；不夠時會在 Shell 問你）')), inTa) : null;
    inTa.addEventListener('input', () => { inTa.rows = Math.max(1, inTa.value.split('\n').length); if (self.k) resetSteps(); });
    let filesNow = o.files || null;
    const filesBody = h('div.files-body');
    const filesEl = o.files ? h('details.ide-files', { open: true }, h('summary', '檔案（虛擬，只在這裏使用）'), filesBody) : null;
    const shell = h('div.shell', { role: 'log', 'aria-live': 'polite', 'aria-label': 'Shell' });
    const assist = h('div.assist', { hidden: true });
    const tBody = h('div.panel-body');
    const tDet = steps ? h('details.ide-trace', { open: (o.open || []).includes('trace') }, h('summary', '追蹤表（逐步執行時自動填寫）'), tBody) : null;
    const el = h('div.ide', bar, main, inRow, filesEl, h('div.shell-wrap', h('div.shell-h', 'Shell'), shell), assist, tDet);
    self.el = el; self.input = inTa; self.editor = editor;
    const lockMsg = o.lockMsg || '先選答案並按「鎖定答案」，才可以執行。';
    self.getCode = () => (editor ? editor.get() : o.code || '');
    const origCode = o.code || '';

    function renderFiles(fs, changedFrom) {
      if (!filesEl) return;
      filesBody.replaceChildren();
      const names = Object.keys(fs || {});
      if (!names.length) filesBody.append(h('p.pts', '（沒有檔案）'));
      for (const n of names) {
        const chg = changedFrom && changedFrom[n] !== fs[n];
        filesBody.append(h('div.file' + (chg ? '.chg' : ''), h('b', n + (chg ? '（已改變）' : '')), h('pre', fs[n] === '' ? '（空檔案）' : fs[n])));
      }
    }
    renderFiles(o.files);
    function renderVars(vrepr, prev) {
      varsEl.replaceChildren();
      const ks = Object.keys(vrepr || {});
      if (!ks.length) { varsEl.append(h('span.pts', '（未有變量）')); return; }
      varsEl.append(h('table', h('tbody', ks.map((k) => h('tr' + (prev && prev[k] !== vrepr[k] ? '.chg' : ''), h('td', k), h('td', vrepr[k]))))));
    }
    renderVars(null);
    function shellReset() { shell.replaceChildren(); }
    function shellAdd(cls, txt) { const s = h('span' + (cls ? '.' + cls : ''), txt); shell.append(s); shell.scrollTop = shell.scrollHeight; return s; }
    function shellPrompt() { shellAdd('pr', '>>> '); }
    shellPrompt();
    function showErr(err, code) {
      const P = PyRun();
      if (!err) { assist.hidden = true; return; }
      if (P) shellAdd('err', P.traceback(err, code, fname) + '\n');
      assist.hidden = false;
      assist.replaceChildren(h('b', err.type === 'Timeout' ? '程式停不下來？' : `${err.type}：怎樣改？`), h('p', P ? P.explain(err, code) : err.msg));
    }
    function markLine(line, cls) {
      if (editor) { if (cls === 'err') editor.markErr(line); }
      else if (view) view.mark(line, cls);
    }
    // ---- 逐步執行（CPython 預先計算） ----
    function codeChanged() { if (self.k) resetSteps(); bStep.disabled = self.locked || !stepOK(); bStep.title = stepOK() ? '' : '修改了程式：逐步執行只適用於原本的程式，請按 ▶ 執行'; }
    const stepOK = () => !!steps && self.getCode() === origCode && inTa.value === (o.inputs || '');
    function resetSteps() {
      self.k = 0; stepInfo.textContent = ''; markLine(null); renderVars(null); shellReset(); shellPrompt(); assist.hidden = true; renderFiles(o.files); renderTrace();
      if (editor && view) { codeBox.replaceChildren(editor.el); view = null; }
      render();
    }
    function showStep() {
      const n = steps.length, k = self.k;
      shellReset(); shellAdd('pr', '>>> '); shellAdd('run', `%Run ${fname}\n`);
      if (k <= n) {
        const s = steps[k - 1];
        if (editor && !view) { view = codeView(self.getCode()); codeBox.replaceChildren(view); }
        view.mark(s.l, 'hl');
        renderVars(s.v, k > 1 ? steps[k - 2].v : {});
        shellAdd('', pre.out.slice(0, s.o));
        stepInfo.textContent = `第 ${k} / ${n} 步：將執行第 ${s.l} 行${s.fn && s.fn !== '<module>' ? `（在 ${s.fn}() 內）` : ''}`;
        assist.hidden = true;
      } else {
        if (view) view.mark(pre.err ? pre.err.line : null, 'err');
        renderVars(pre.vrepr, steps.length ? steps[steps.length - 1].v : {});
        shellAdd('', pre.out);
        showErr(pre.err, self.getCode());
        shellPrompt();
        stepInfo.textContent = pre.cut ? `完成（只可逐步看首 ${n} 步）` : '完成';
        if (pre.files) renderFiles(pre.files, o.files);
      }
      renderTrace();
      bStep.disabled = k > n;
    }
    function renderTrace() {
      if (!tDet) return;
      tBody.replaceChildren();
      if (!self.k) { tBody.append(h('p.pts', '按「⏭ 下一步」逐行執行，追蹤表會逐行填寫。')); return; }
      const upto = Math.min(self.k, steps.length + 1);
      const cols = []; const rows = [];
      const stateAt = (i) => (i < steps.length ? steps[i] : { v: pre.vrepr || {}, o: pre.out.length });
      for (let i = 0; i < upto - 1 && i < steps.length; i++) {
        const a = steps[i].v, b = stateAt(i + 1).v;
        const ch = {};
        for (const k of Object.keys(b)) if (a[k] !== b[k]) { ch[k] = reprToTxt(b[k]); if (!cols.includes(k)) cols.push(k); }
        const out = pre.out.slice(steps[i].o, stateAt(i + 1).o).replace(/\n$/, '').replace(/\n/g, ' / ');
        if (Object.keys(ch).length || out) rows.push({ l: steps[i].l, ch, out });
      }
      const lines = self.getCode().split('\n');
      if (!rows.length) { tBody.append(h('p.pts', '（暫時未有變量改變或輸出）')); return; }
      const hasOut = rows.some((r) => r.out);
      const table = h('table.trace', h('thead', h('tr', h('th', '行'), h('th', '語句'), cols.map((c) => h('th', c)), hasOut ? h('th', '輸出') : null)),
        h('tbody', rows.slice(-200).map((r, i, arr) => h('tr' + (i === arr.length - 1 ? '.cur' : ''), h('td.lab', String(r.l)), h('td.lab', (lines[r.l - 1] || '').trim()), cols.map((c) => h('td.v', c in r.ch ? r.ch[c] : '')), hasOut ? h('td.v', r.out) : null))));
      tBody.append(h('div.tracewrap', table), h('p.pts', '每行顯示該語句執行後改變了的值（空白＝沒有改變）。'));
      const w = tBody.querySelector('.tracewrap'); if (w) w.scrollTop = w.scrollHeight;
    }
    if (tDet) tDet.addEventListener('toggle', renderTrace);
    bStep.onclick = () => { if (self.locked || !stepOK()) return; if (self.running) return; self.k = Math.min(self.k + 1, steps.length + 1); showStep(); };
    bReset.onclick = () => { if (!self.running) resetSteps(); };
    // ---- 執行（Skulpt） ----
    let sig = null, pendingInput = null;
    self.run = async function () {
      if (self.locked || self.running) return null;
      const P = PyRun();
      const code = self.getCode();
      if (editor && view) { codeBox.replaceChildren(editor.el); view = null; }
      self.k = 0; stepInfo.textContent = ''; markLine(null, 'hl'); markLine(null, 'err');
      shellReset(); shellAdd('pr', '>>> '); shellAdd('run', `%Run ${fname}\n`);
      assist.hidden = true;
      if (!P || !P.ready()) { shellAdd('err', '未能載入 Python 執行器（Skulpt）。請重新整理頁面。\n'); return null; }
      self.running = true; bRun.disabled = true; bStep.disabled = true; bReset.disabled = true; bStop.hidden = false;
      sig = { stop: false };
      const outSpan = shellAdd('', '');
      let res;
      try {
        res = await P.run(code, {
          inputs: inTa.value === '' ? [] : inTa.value.replace(/\r/g, '').split('\n'), files: o.files, fixRandom: o.fixRandom, execLimit: o.execLimit || 5000, signal: sig,
          onOut: (t) => { outSpan.textContent += t; shell.scrollTop = shell.scrollHeight; },
          onInput: () => new Promise((resolve, reject) => {
            const inp = h('input.shell-in', { type: 'text', 'aria-label': '程式要求輸入', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
            const ok = h('button.btn.small', { type: 'button' }, '輸入');
            const wrap = h('span.shell-ask', inp, ok);
            shell.append(wrap); inp.focus({ preventScroll: true });
            const done = () => { const v = inp.value; wrap.remove(); pendingInput = null; resolve(v); };
            inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
            ok.onclick = done;
            pendingInput = { reject: () => { wrap.remove(); pendingInput = null; reject(new Error('__PYRUN_STOP__')); } };
          }),
        });
      } catch (e) { res = { out: outSpan.textContent, err: { type: 'InternalError', line: 0, msg: String(e) }, vars: {}, vrepr: {}, files: {} }; }
      self.running = false; bRun.disabled = false; bStop.hidden = true; bReset.disabled = false; bStep.disabled = self.locked || !stepOK();
      outSpan.textContent = res.out;
      renderVars(res.vrepr);
      if (res.err) { showErr(res.err, code); markLine(res.err.line, 'err'); }
      shellPrompt();
      if (o.files) { filesNow = res.files; renderFiles(res.files, o.files); }
      self.last = res;
      if (o.onRun) o.onRun(res);
      return res;
    };
    bRun.onclick = () => { self.run(); };
    bStop.onclick = () => { if (sig) sig.stop = true; if (pendingInput) pendingInput.reject(); };
    function render() {
      const L = self.locked;
      bRun.disabled = L || self.running; bStep.disabled = L || !stepOK(); bReset.disabled = L;
      if (L) { shellReset(); shellAdd('info', lockMsg); }
      else if (!shell.childNodes.length || shell.querySelector('.info')) { shellReset(); shellPrompt(); }
    }
    self.setLocked = (v) => { self.locked = v; render(); };
    self.setCode = (c) => { if (editor) editor.set(c); else { o.code = c; const nv = codeView(c); view.replaceWith(nv); view = nv; } };
    self.markErr = (l) => markLine(l, 'err');
    render();
    void filesNow;
    return self;
  }
  PY.PyIDE = PyIDE;

  // ---------------- 題目答案（build 預先計算） ----------------
  function correctIndex(it) {
    if (typeof it._right === 'number') return it._right;
    if (typeof it.answer === 'number') return it.answer;
    if (typeof it.answer === 'string' && /^[A-H]$/.test(it.answer)) return LET.indexOf(it.answer);
    throw new Error(`題目 ${it.id} 沒有答案`);
  }
  PY.correctIndex = correctIndex;
  PY.fillAnswers = (it) => it._ans || it.blanks.map((b) => String(b.a));
  PY.traceOf = (it) => it._trace;

  // ---------------- 元件：練習題／試 ----------------
  function feedback(kind, title, extra) { return h('div.fb.' + kind, { role: 'status' }, h('b.v', title), extra ? (typeof extra === 'string' ? mdEl('div', extra) : extra) : null); }
  const CJK = /[\u3400-\u9fff\uff00-\uffef]/;
  function optBody(op, codeLike) {
    const s = String(op);
    if (codeLike && !CJK.test(s) && !/`|\*\*/.test(s)) return h('code.optout', s === '' ? '（沒有輸出）' : s);
    return mdEl('span', s);
  }
  function optionList(it, name, onPick) {
    const opts = h('div.opts', { role: 'radiogroup' });
    const codeLike = !!it.code;
    it.options.forEach((op, i) => {
      const r = h('input', { type: 'radio', name, value: String(i) });
      const lab = h('label.opt', r, h('span.lt', LET[i] + '.'), optBody(op, codeLike));
      r.addEventListener('change', () => { opts.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel')); lab.classList.add('sel'); onPick(i); });
      opts.append(lab);
    });
    opts.lock = (sel, right) => { opts.querySelectorAll('input').forEach((x) => { x.disabled = true; }); opts.querySelectorAll('.opt').forEach((x, i) => { x.classList.add('locked'); if (i === right) x.classList.add('right'); else if (i === sel) x.classList.add('wrong'); }); };
    opts.pick = (i) => { const x = opts.querySelectorAll('input')[i]; if (x) { x.checked = true; x.dispatchEvent(new Event('change')); } };
    return opts;
  }
  const inputsNote = (it) => (it.inputs != null && String(it.inputs) !== '' ? h('p.pts', '輸入數據（每行一個）：', h('code.inl', String(it.inputs).split('\n').join(' ⏎ '))) : null);
  const filesNote = (it) => (it.files ? h('details.filesnote', h('summary', '題目用到的檔案'), Object.entries(it.files).map(([n, t]) => h('div.file', h('b', n), h('pre', t)))) : null);
  const askText = (it) => {
    const a = it.ask;
    if (!a || a === 'out') return null;
    if (a.var) return `問：程式完結後變量 ${a.var} 的值`;
    if (a.expr) return `問：程式完結後 ${a.expr} 的結果`;
    if (a.error) return '問：會出現甚麼錯誤？';
    if (a.count != null) return `問：第 ${a.count} 行執行了多少次`;
    if (a.file) return `問：檔案 ${a.file} 最後的內容`;
    return null;
  };

  function renderTry(it, ctx) {
    const st = ctx.state.items[it.id] || {};
    const right = correctIndex(it);
    const box = h('div.blk.try-item', { 'data-id': it.id });
    box.append(h('div.row', h('span.pill.try', h('i', '試'), '先估後執行'), h('span.pts', `${it.pts} 分`), h('span.spacer'), it.src ? h('span.ref', it.src) : null));
    if (it.intro) box.append(mdEl('p', it.intro));
    box.append(mdEl('div.q', it.q || '先估：輸出是什麼？'));
    const at = askText(it); if (at) box.append(h('p.pts', at));
    let pick = st.sel != null ? st.sel : null;
    const lockBtn = h('button.btn.primary', { type: 'button', disabled: pick == null || st.done }, '鎖定答案');
    const opts = optionList(it, 'r-' + it.id, (i) => { pick = i; lockBtn.disabled = false; });
    const fbBox = h('div');
    const ide = PyIDE({ code: it.code, inputs: it.inputs || '', files: it.files, fixRandom: it.fixRandom, run: it._run, locked: !st.done && !ctx.teacher, open: it.open || [], fname: it.id.replace(/-/g, '_') + '.py' });
    const done = (sel, fresh) => {
      opts.lock(sel, right);
      lockBtn.hidden = true;
      const good = sel === right;
      fbBox.replaceChildren(feedback(good ? 'good' : 'bad', good ? `估對了！${fresh ? `+${it.pts} 分` : ''}` : `估錯了。正確答案是 ${LET[right]}。`, (it.why ? it.why + '\n' : '') + '按「▶ 執行」看結果，或按「⏭ 下一步」逐行看變量怎樣改變。'));
      ide.setLocked(false);
    };
    lockBtn.onclick = () => {
      if (pick == null) return;
      const good = pick === right;
      ctx.award(it.id, good ? it.pts : 0, { sel: pick, done: true, kind: 'try' });
      done(pick, good);
    };
    box.append(opts, h('div.row', lockBtn), fbBox, ide.el);
    if (st.done) { opts.pick(st.sel); done(st.sel, false); }
    if (ctx.teacher) box.append(h('div.ans', `答案：${LET[right]}（${it.options[right]}）`));
    return box;
  }
  PY.renderTry = renderTry;

  // 練習：答對全分；看答案 1 分；答錯兩次出提示（checkFn 可以是 async）
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
    bCheck.onclick = async () => {
      if (bCheck.disabled) return;
      bCheck.disabled = true; const lab = bCheck.textContent; bCheck.textContent = '核對中…';
      let r;
      try { r = await checkFn(); } catch (e) { r = { incomplete: '核對時出錯：' + e.message }; }
      bCheck.textContent = lab; bCheck.disabled = false;
      if (r.incomplete) { fb.replaceChildren(feedback('info', r.incomplete)); return; }
      if (r.ok) {
        ctx.award(it.id, it.pts, { done: true, tries: tries + 1, kind: 'prac', val: r.val });
        fb.replaceChildren(feedback('good', `答對了！+${it.pts} 分`, it.why || null)); finish('ok');
      } else {
        tries++; ctx.award(it.id, 0, { tries, kind: 'prac', val: r.val });
        const hint = tries >= 2 ? (it.hint || '重看上面的重點，或在上面的編輯器試試。') : null;
        fb.replaceChildren(feedback('bad', `未對${tries >= 2 ? `（已答錯 ${tries} 次）` : '，再想想'}。`, h('div', r.msg ? (typeof r.msg === 'string' ? mdEl('div', r.msg) : r.msg) : null, hint ? mdEl('div', '提示：' + hint) : null)));
      }
    };
    bShow.onclick = () => {
      ctx.award(it.id, Math.min(1, it.pts), { done: true, shown: true, tries, kind: 'prac' });
      showFn(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', it.why || null)); finish('shown');
    };
    if (st.done) {
      if (restore) restore(st);
      if (st.shown) { showFn(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', it.why || null)); finish('shown'); }
      else { fb.replaceChildren(feedback('good', '已答對。', it.why || null)); finish('ok'); }
    }
    if (ctx.teacher && !st.done) box.append(h('div.ans', h('b', '老師：'), ' ', ...[].concat(showFn(true) || [])));
    return box;
  }

  function renderMC(it, ctx) {
    const right = correctIndex(it);
    let pick = null;
    const opts = optionList(it, 'p-' + it.id, (i) => { pick = i; });
    const body = h('div.blk', mdEl('div.q', it.q), it.code ? codeView(it.code) : null, inputsNote(it), filesNote(it), it.code ? (askText(it) ? h('p.pts', askText(it)) : null) : null, opts);
    return practiceShell(it, ctx, body,
      () => (pick == null ? { incomplete: '請先選一個答案。' } : { ok: pick === right, val: pick, msg: it.wrong && it.wrong[pick] ? it.wrong[pick] : null }),
      (peek) => { if (peek) return `${LET[right]}. ${it.options[right]}`; opts.lock(pick, right); },
      (st) => { if (st.val != null) opts.pick(st.val); opts.lock(st.val, right); });
  }
  function ansInput(label, multi) {
    return multi ? h('textarea.txt', { rows: multi, 'aria-label': label, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' })
      : h('input.txt', { type: 'text', 'aria-label': label, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
  }
  function renderFill(it, ctx) {
    const answers = PY.fillAnswers(it);
    const inputs = it.blanks.map((b, i) => { const n = String(answers[i]).split('\n').length; return ansInput(b.label, n > 1 ? n : 0); });
    inputs.forEach((x, i) => x.setAttribute('data-i', i));
    const body = h('div.blk', mdEl('div.q', it.q), it.code ? codeView(it.code) : null, inputsNote(it), filesNote(it),
      h('div.fillgrid', it.blanks.map((b, i) => h('label.fillrow', mdEl('span', b.label), inputs[i]))));
    const accept = (i, v) => sameLoose(v, answers[i]) || (it.blanks[i].accept || []).some((a) => sameLoose(v, a));
    return practiceShell(it, ctx, body,
      () => {
        const vals = inputs.map((x) => x.value.trim());
        if (vals.some((v) => !v)) return { incomplete: '請填寫所有空格。' };
        let all = true; inputs.forEach((x, i) => { const g = accept(i, vals[i]); x.classList.toggle('ok', g); x.classList.toggle('no', !g); if (!g) all = false; });
        return { ok: all, val: vals };
      },
      (peek) => { if (peek) return it.blanks.map((b, i) => `${b.label} ${answers[i]}`).join('；'); inputs.forEach((x, i) => { x.value = answers[i]; x.readOnly = true; x.classList.add('ok'); }); },
      (st) => { if (st.val) inputs.forEach((x, i) => { x.value = st.val[i] || ''; x.readOnly = true; x.classList.add('ok'); }); });
  }
  function renderTraceItem(it, ctx) {
    const tr = it._trace;
    const cells = [];
    const table = h('table.trace', h('thead', h('tr', h('th', tr.mode === 'stmt' ? '語句' : ''), tr.cols.map((c) => h('th', c.label)))),
      h('tbody', tr.rows.map((r, ri) => h('tr', h('td.lab' + (tr.mode === 'stmt' ? '' : '.t'), r.label), tr.cols.map((c, ci) => {
        const cell = r.cells[ci];
        const inp = h('input.cell' + (c.key === '__out' ? '.wide' : ''), { type: 'text', 'aria-label': `${r.label}：${c.label}`, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
        cells.push({ inp, cell, ri }); return h('td', inp);
      })))));
    const body = h('div.blk', mdEl('div.q', it.q || '空運行以下程式，完成追蹤表（只需填寫改變了的值；沒有改變的格可以留空）。'), codeView(it.code), inputsNote(it), filesNote(it), h('div.tracewrap', table),
      h('p.pts', tr.mode === 'iter' ? '每次循環一行：填寫該次循環完結時的值（沒有改變的格可以留空）。' : '每個改變了變量或有輸出的語句一行（沒有改變的格可以留空）。'));
    return practiceShell(it, ctx, body,
      () => {
        let all = true, filled = 0;
        for (const c of cells) {
          const v = c.inp.value.trim(); if (v) filled++;
          const g = c.cell.changed ? sameLoose(v, c.cell.v) : (v === '' || sameLoose(v, c.cell.v));
          c.inp.classList.toggle('ok', g && v !== ''); c.inp.classList.toggle('no', !g); if (!g) all = false;
        }
        if (!filled) return { incomplete: '請先填寫追蹤表。' };
        return { ok: all, val: cells.map((c) => c.inp.value.trim()), msg: all ? null : '紅色格未對。' };
      },
      (peek) => { if (peek) return '見追蹤表（已自動填上）'; cells.forEach((c) => { c.inp.value = c.cell.changed ? c.cell.v : ''; c.inp.readOnly = true; c.inp.classList.remove('no'); }); },
      (st) => { if (st.val) cells.forEach((c, i) => { c.inp.value = st.val[i] || ''; c.inp.readOnly = true; }); });
  }
  function testLabel(t, i) {
    const parts = [];
    if (t.inputs != null && String(t.inputs) !== '') parts.push('輸入 ' + String(t.inputs).split('\n').join('、'));
    if (t.files) parts.push('檔案 ' + Object.keys(t.files).join('、'));
    return `第 ${i + 1} 組（${parts.length ? parts.join('；') : '沒有輸入'}）`;
  }
  function diffBox(exp, got, chk) {
    const show = (s) => (normOut(s) === '' ? '（沒有輸出）' : normOut(s));
    const rows = [];
    if (chk && chk.file && (!chk.out || chk.out === false)) {
      rows.push(h('div', h('small', `期望檔案 ${chk.file}`), h('pre.out', show((exp.files || {})[chk.file] || ''))), h('div', h('small', '你的檔案'), h('pre.out', show((got.files || {})[chk.file] || ''))));
    } else {
      rows.push(h('div', h('small', '期望輸出'), h('pre.out', show(exp.out))), h('div', h('small', '你的輸出'), h('pre.out', show(got.out))));
    }
    return h('div.diff', rows);
  }
  async function runAgainst(code, tests, exps, chk, fix) {
    const P = PyRun();
    const list = [];
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      const got = await P.run(code, { inputs: t.inputs == null || t.inputs === '' ? [] : String(t.inputs).split('\n'), files: t.files, fixRandom: t.fixRandom || fix, execLimit: 5000 });
      const c = compareRun(got, exps[i], chk);
      list.push(Object.assign({ i, got, exp: exps[i] }, c));
    }
    return list;
  }
  PY.runAgainst = runAgainst;
  function renderComplete(it, ctx) {
    const blanks = {};
    const view = codeView(it.template, { blanks });
    const n = Object.keys(blanks).length;
    const body = h('div.blk', mdEl('div.q', it.q), view, filesNote(it.tests[0] || {}),
      h('p.pts', `會用 ${it.tests.length} 組數據測試：` + it.tests.map((t, i) => testLabel(t, i)).join('；')));
    const vals = () => Array.from({ length: n }, (_, i) => (blanks[i + 1].value || '').trim());
    return practiceShell(it, ctx, body,
      async () => {
        const v = vals(); if (v.some((x) => !x)) return { incomplete: '請填寫所有空格。' };
        const code = subBlanks(it.template, v);
        const list = await runAgainst(code, it.tests, it._exp, it.check, it.fixRandom);
        const bad = list.find((x) => !x.ok);
        if (!bad) return { ok: true, val: v };
        return { ok: false, val: v, msg: h('div', h('p', `${testLabel(it.tests[bad.i], bad.i)}：${bad.msg}`), bad.diff ? diffBox(bad.exp, bad.got, it.check) : bad.err ? h('pre.out.err', PyRun().explain(bad.err, code)) : null) };
      },
      (peek) => { if (peek) return it.ref.map((r, i) => `［${i + 1}］${r}`).join('；'); for (let i = 1; i <= n; i++) { blanks[i].value = it.ref[i - 1]; blanks[i].readOnly = true; } },
      (st) => { if (st.val) for (let i = 1; i <= n; i++) { blanks[i].value = st.val[i - 1] || ''; blanks[i].readOnly = true; } });
  }
  const PRAC = { mc: renderMC, fill: renderFill, trace: renderTraceItem, complete: renderComplete };
  PY.renderPractice = (it, ctx) => PRAC[it.type](it, ctx);

  // ---------------- 寫程式 ----------------
  function renderWrite(task, ctx) {
    const st = ctx.state.items[task.id] || {};
    const draft = (ctx.state.drafts || {})[task.id];
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', task.tier ? h('span.badge', task.tier) : null, task.title || ''), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.q || task.prompt || ''));
    const t0 = task.tests[0] || {};
    const sample = task.sample != null ? task.sample : task._sample;
    box.append(h('div.sample', h('div.sample-h', '例子：', testLabel(t0, 0).replace(/^第 1 組/, '')), h('pre.out', normOut(sample) || '（沒有輸出）')));
    if (task.rules && task.rules.length) box.append(h('ul.rules', task.rules.map((r) => h('li', r.msg || (r.must ? `要用到 ${r.must}` : r.mustNot ? `不可用 ${r.mustNot}` : '')))));
    box.append(h('p.pts', `提交後會用 ${task.tests.length} 組數據自動評核（包括邊界值）。`));
    const ide = PyIDE({ code: draft != null ? draft : task.starter || '', editable: true, inputs: t0.inputs || '', files: t0.files, fixRandom: task.fixRandom || t0.fixRandom, fname: task.id.replace(/-/g, '_') + '.py', minRows: 8,
      onChange: (v) => { ctx.state.drafts = ctx.state.drafts || {}; ctx.state.drafts[task.id] = v; ctx.save(); } });
    const bSubmit = h('button.btn.primary', { type: 'button' }, '提交評核');
    const bRef = h('button.btn.ghost', { type: 'button', hidden: !((st.tries || 0) >= 2) || st.done }, '看參考答案（只得 1 分）');
    const fb = h('div', { 'aria-live': 'polite' });
    box.append(ide.el, h('div.row', bSubmit, bRef), fb);
    let tries = st.tries || 0;
    const showRef = () => { fb.append(h('div.note', h('b', '參考答案'), codeView(task.ref))); };
    const lockDone = () => { bSubmit.disabled = true; bRef.hidden = true; };
    bSubmit.onclick = async () => {
      if (bSubmit.disabled) return;
      const code = ide.getCode();
      if (!code.trim()) { fb.replaceChildren(feedback('info', '請先在編輯器寫程式。')); return; }
      const rmsg = checkRules(task.rules, code);
      if (rmsg) {
        tries++; ctx.award(task.id, 0, { tries, kind: 'write', code });
        fb.replaceChildren(feedback('bad', `未通過（第 ${tries} 次提交）。`, h('div', h('p', rmsg), tries >= 2 && task.hint ? mdEl('p', '提示：' + task.hint) : null)));
        if (tries >= 2) bRef.hidden = false;
        return;
      }
      bSubmit.disabled = true; bSubmit.textContent = '評核中…';
      fb.replaceChildren(feedback('info', '正在用測試數據執行你的程式……'));
      let list;
      try { list = await runAgainst(code, task.tests, task._exp, task.check, task.fixRandom); }
      finally { bSubmit.disabled = false; bSubmit.textContent = '提交評核'; }
      const all = list.every((x) => x.ok);
      if (all) {
        ctx.award(task.id, task.pts, { done: true, tries: tries + 1, kind: 'write', code });
        fb.replaceChildren(feedback('good', `全部 ${list.length} 組數據通過！+${task.pts} 分`, h('ul.tests', list.map((x) => h('li.pass', h('b', testLabel(task.tests[x.i], x.i)), '：通過 ✓')))));
        lockDone(); return;
      }
      tries++; ctx.award(task.id, 0, { tries, kind: 'write', code });
      const firstBad = list.find((x) => !x.ok);
      if (firstBad.err && firstBad.err.line) ide.markErr(firstBad.err.line);
      const parts = [h('ul.tests', list.map((x) => h('li.' + (x.ok ? 'pass' : 'fail'), h('b', testLabel(task.tests[x.i], x.i)), x.ok ? '：通過 ✓' : `：不通過 ✗ ${x.msg}`, !x.ok && x === firstBad ? (x.diff ? diffBox(x.exp, x.got, task.check) : x.err ? h('p.pts', PyRun().explain(x.err, code)) : null) : null)))];
      if (tries >= 2 && task.hint) parts.push(mdEl('p', '提示：' + task.hint));
      fb.replaceChildren(feedback('bad', `未通過（第 ${tries} 次提交）：${list.filter((x) => !x.ok).length} 組數據不通過。`, h('div', parts)));
      if (tries >= 2) bRef.hidden = false;
    };
    bRef.onclick = () => { ctx.award(task.id, Math.min(1, task.pts), { done: true, shown: true, tries, kind: 'write' }); fb.replaceChildren(feedback('info', '已顯示參考答案（這題得 1 分）。')); showRef(); lockDone(); };
    if (st.done) {
      lockDone();
      if (st.shown) { fb.replaceChildren(feedback('info', '已顯示參考答案（這題得 1 分）。')); showRef(); }
      else fb.replaceChildren(feedback('good', '已通過全部測試。'));
    }
    if (ctx.teacher) box.append(h('div.ans', h('b', '老師：參考答案'), codeView(task.ref)));
    return box;
  }
  PY.renderWrite = renderWrite;

  // ---------------- 分析題（表格，與 D1 相同） ----------------
  const isIn = (c) => c && typeof c === 'object' && ('sel' in c || 'text' in c || 'a' in c);
  function tableAnswers(task) { const out = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) out.push(String(c.a)); })); return out; }
  PY.tableAnswers = tableAnswers;
  function checkTableVals(task, vals) {
    const ins = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) ins.push(c); }));
    return ins.map((c, i) => { const v = (vals[i] || '').trim(); return c.sel ? v === String(c.a) : (sameLoose(v, c.a) || (c.accept || []).some((x) => sameLoose(v, x))); });
  }
  PY.checkTableVals = checkTableVals;
  function tableAnswerText(task) { return task.rows.map((r) => r.map((c) => (isIn(c) ? c.a : String(c).replace(/[`*]/g, ''))).join('｜')).join('；'); }
  PY.tableAnswerText = tableAnswerText;
  function renderTableTask(task, ctx) {
    const st = ctx.state.items[task.id] || {};
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', task.tier ? h('span.badge', task.tier) : null, task.title || ''), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.q || task.prompt || ''));
    if (task.code) box.append(codeView(task.code));
    const ctrls = [];
    const body = h('tbody', task.rows.map((r) => h('tr', r.map((c, ci) => {
      if (!isIn(c)) return mdEl('td', String(c), ci ? { 'data-label': task.head[ci] } : { class: 'rowhead' });
      let el;
      const lab = `${String(r[0]).replace(/[`*]/g, '')}：${task.head[ci]}`;
      if (c.sel) el = h('select.cellsel', { 'aria-label': lab }, h('option', { value: '' }, '（請選擇）'), task.opts[c.sel].map((o) => h('option', { value: o }, o)));
      else el = h('input.txt', { type: 'text', 'aria-label': lab, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      ctrls.push(el); return h('td', { 'data-label': task.head[ci] }, el);
    }))));
    box.append(h('div.scroll', h('table.tb.anatab', h('thead', h('tr', task.head.map((x) => mdEl('th', x)))), body)));
    const bSubmit = h('button.btn.primary', { type: 'button' }, '提交評核');
    const bRef = h('button.btn.ghost', { type: 'button', hidden: !((st.tries || 0) >= 2) || st.done }, '看答案（只得 1 分）');
    const fb = h('div.fbslot', { 'aria-live': 'polite' });
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
    if (st.done) {
      lockDone();
      if (st.shown) { fillAns(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', task.why || null)); }
      else { ctrls.forEach((el, i) => { el.value = (st.val || ans)[i]; el.classList.add('ok'); }); fb.replaceChildren(feedback('good', '已全部答對。', task.why || null)); }
    }
    if (ctx.teacher) box.append(h('div.ans', h('b', '老師：'), ' ', tableAnswerText(task)));
    return box;
  }
  PY.renderTableTask = renderTableTask;

  // ---------------- 小測 ----------------
  function quizTags(it) {
    const row = h('div.tagrow');
    for (const t of it.tags || []) row.append(h('span.tag.' + (t.t === 'hot' ? 'hot' : 'trap'), { title: t.why || '' }, t.t === 'hot' ? '常考' : '易錯'));
    if (it.src) row.append(h('span', '出處：' + it.src));
    return row;
  }
  function tableEl(t) { return h('div.scroll', h('table.tb', t.head ? h('thead', h('tr', t.head.map((x) => mdEl('th', x)))) : null, h('tbody', t.rows.map((r) => h('tr', r.map((x) => mdEl('td', String(x)))))))); }
  PY.tableEl = tableEl;
  function renderQuiz(sec, ctx) {
    const qs = ctx.state.quiz = ctx.state.quiz || { ans: {}, submitted: false };
    const box = h('div.blk');
    const hasCode = sec.items.some((it) => it.code);
    const tot = sec.items.reduce((s, x) => s + x.pts, 0);
    box.append(h('p.note', `共 ${sec.items.length} 題，共 ${tot} 分。${hasCode ? '這部分不能執行程式，請自己空運行（可以在紙上畫追蹤表）。' : ''}全部答完才可提交，提交後不能再改。`));
    const lists = [];
    sec.items.forEach((it, qi) => {
      const right = correctIndex(it);
      const opts = optionList(it, 'q-' + it.id, (i) => { qs.ans[it.id] = i; ctx.save(); upd(); });
      const qb = h('div.blk', { 'data-id': it.id }, h('div.row', h('b', `第 ${qi + 1} 題`), h('span.pts', `${it.pts} 分`)), quizTags(it), mdEl('div.q', it.q), it.code ? codeView(it.code) : null, inputsNote(it), it.table ? tableEl(it.table) : null, opts);
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
      for (const L of lists) {
        const sel = qs.ans[L.it.id]; L.opts.lock(sel, L.right); const ok = sel === L.right; if (ok) got += L.it.pts;
        L.qb.fbSlot.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對' : `答錯，答案是 ${LET[L.right]}`, L.it.why || null));
      }
      sum.replaceChildren(feedback('info', `小測得分：${got} / ${tot}${fresh ? '' : '（已提交）'}`));
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

  // ---------------- 無限練習（JS 計算答案；build 用 CPython 抽樣核對） ----------------
  const fr = () => (PY._rand ? PY._rand() : Math.random());
  const R = (a, b) => a + Math.floor(fr() * (b - a + 1));
  const pick = (a) => a[Math.floor(fr() * a.length)];
  const shuffled = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(fr() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const C = (...ls) => ls.join('\n');
  const fl = (x) => (root.PyRun ? root.PyRun.pyFloatRepr(x) : String(x));
  // Python 值 → print 的文字
  function pstr(v) {
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (v == null) return 'None';
    if (Array.isArray(v)) return '[' + v.map(prepr).join(', ') + ']';
    if (typeof v === 'object' && v.f !== undefined) return fl(v.f);
    return String(v);
  }
  function prepr(v) {
    if (typeof v === 'string') return v.includes("'") && !v.includes('"') ? `"${v}"` : `'${v.replace(/'/g, "\\'")}'`;
    return pstr(v);
  }
  PY.pstr = pstr;
  const lit = (arr) => '[' + arr.join(', ') + ']';
  const GENS = (PY.GENS = PY.GENS || {});
  const Q_OUT = '空運行以下程式，Shell 會顯示什麼？（有多行輸出便分行寫）';

  // ---- pyArith：運算符優先次序、int／float ----
  (function () {
    const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '//': 2, '%': 2, '**': 4 };
    const leaf = (first) => {
      const r = fr();
      if (r < 0.15) return { t: 'f', v: R(1, 9) + pick([0.5, 0.25, 0.0]), lit: true };
      if (first && r < 0.25) return { t: 'i', v: -R(1, 15), lit: true };
      return { t: 'i', v: R(1, 20), lit: true };
    };
    function gen(depth, first) {
      if (depth === 0) return leaf(first);
      const op = pick(['+', '-', '*', '/', '//', '%', '**', '+', '-', '*', '//', '%']);
      if (op === '**') return { op, l: { t: 'i', v: R(1, 9), lit: true }, r: { t: 'i', v: R(0, 3), lit: true } };
      const ld = depth - 1 > 0 && fr() < 0.6 ? depth - 1 : 0;
      const rd = depth - 1 > 0 && ld === 0 && fr() < 0.5 ? depth - 1 : 0;
      return { op, l: gen(ld, first), r: gen(rd, false) };
    }
    function render(n, pp, side) {
      if (n.lit) { const s = n.t === 'f' ? fl(n.v) : String(n.v); return n.v < 0 && side === 'R' ? `(${s})` : s; }
      const p = PREC[n.op];
      const s = render(n.l, p, 'L') + ' ' + n.op + ' ' + render(n.r, p, 'R');
      const need = p < pp || (p === pp && ((side === 'R' && n.op !== '**') || (side === 'L' && n.op === '**')));
      return need ? `(${s})` : s;
    }
    function fmod(a, b) { let m = a % b; if (m && (b < 0) !== (m < 0)) m += b; else if (!m) m = b < 0 ? -0 : 0; return m; }
    function ffloordiv(a, b) {
      let mod = a % b; let div = (a - mod) / b;
      if (mod && (b < 0) !== (mod < 0)) { div -= 1; }
      let fd;
      if (div) { fd = Math.floor(div); if (div - fd > 0.5) fd += 1; } else fd = (a / b < 0 ? -0 : 0);
      return fd;
    }
    function ev(n) {
      if (n.lit) return { t: n.t, v: n.v };
      const a = ev(n.l), b = ev(n.r);
      if (!a || !b) return null;
      const f = a.t === 'f' || b.t === 'f';
      const x = a.v, y = b.v;
      let v, t = f ? 'f' : 'i';
      switch (n.op) {
        case '+': v = x + y; break;
        case '-': v = x - y; break;
        case '*': v = x * y; break;
        case '/': if (y === 0) return null; v = x / y; t = 'f'; break;
        case '//': if (y === 0) return null; v = f ? ffloordiv(x, y) : Math.floor(x / y); break;
        case '%': if (y === 0) return null; v = f ? fmod(x, y) : ((x % y) + y) % y; break;
        case '**': v = Math.pow(x, y); break;
      }
      if (!Number.isFinite(v) || Math.abs(v) > 1e12) return null;
      return { t, v };
    }
    GENS.pyArith = () => {
      for (let k = 0; k < 50; k++) {
        const tree = gen(R(1, 2), true);
        const r = ev(tree);
        if (!r) continue;
        const ex = render(tree, 0, 'L');
        return { type: '算術運算', q: '以下程式的輸出是什麼？（留意運算次序，以及結果是 int 還是 float，例如 4 與 4.0）', code: `print(${ex})`, ans: r.t === 'f' ? fl(r.v) : String(r.v),
          why: '次序：括號 → ** → * / // % → + -；用 / 的結果一定是 float；// 是向下取整；% 是餘數。' };
      }
      return { type: '算術運算', q: '以下程式的輸出是什麼？', code: 'print(7 // 2)', ans: '3' };
    };
  })();

  GENS.pyCast = () => {
    const a = R(2, 19), b = R(2, 9), d = R(1, 9), k = R(2, 3);
    const forms = [
      () => [`print(int(${a}.${d}))`, String(a), 'int() 直接捨去小數部分（不是四捨五入）。'],
      () => [`print(int(-${a}.${d}))`, String(-a), 'int() 向 0 方向捨去小數。'],
      () => [`print(float(${a}))`, `${a}.0`, 'float 一定有小數點。'],
      () => [`print(str(${a}) + str(${b}))`, `${a}${b}`, '字串 + 字串 = 連接。'],
      () => [`print(int('${a}') + int('${b}'))`, String(a + b), '轉成整數後相加。'],
      () => [`print('${a}' * ${k})`, String(a).repeat(k), '字串 * 整數 = 重複。'],
      () => [`print(int('${a}') * ${k})`, String(a * k), '先轉成整數再乘。'],
      () => [`print(type(${a} / ${b}))`, "<class 'float'>", '/ 的結果一定是 float。'],
      () => [`print(type(${a * b} // ${b}))`, "<class 'int'>", '兩個 int 用 // 得到 int。'],
      () => [`print(type('${a}'))`, "<class 'str'>", '有引號就是字串。'],
      () => [`print(type(${a} > ${b}))`, "<class 'bool'>", '比較的結果是 True 或 False（bool）。'],
      () => [`print(float('${a}.5') + 1)`, fl(a + 1.5), 'float 加 int 得到 float。'],
      () => [`x = '${a}'\ny = x * 2`, String(a).repeat(2), 'x 是字串，* 2 是重複。', { var: 'y' }],
      () => [`x = int('${a}')\ny = x * 2`, String(a * 2), 'x 已轉成整數。', { var: 'y' }],
      () => [`print(str(${a}.0))`, `${a}.0`, 'str() 保留 .0。'],
      () => [`print(round(${a}.${d}))`, String(d > 5 || (d === 5 && a % 2 === 1) ? a + 1 : a), 'round() 四捨五入；剛好 .5 時取雙數（例如 round(2.5) 是 2）。'],
    ];
    const [code, ans, why, ask] = pick(forms)();
    return { type: '數據類型轉換', q: ask ? '程式完結後，變量 y 的值是什麼？' : '以下程式的輸出是什麼？', code, ans, why, ask };
  };

  GENS.pyPrint = () => {
    const W = ['Hi', 'ICT', 'Python', 'Hello', 'HK', 'OK', 'cat', 'dog'];
    const a = R(1, 20), b = R(1, 20), w1 = pick(W), w2 = pick(W);
    const forms = [
      () => [`print(${a}, ${b})`, `${a} ${b}`],
      () => [`print(${a}, ${b}, sep='')`, `${a}${b}`],
      () => [`print('${w1}', ${a}, sep='-')`, `${w1}-${a}`],
      () => [`print('${w1}', end='')\nprint('${w2}')`, `${w1}${w2}`],
      () => [`print('${w1}', end=' ')\nprint('${w2}')`, `${w1} ${w2}`],
      () => [`print('${w1}')\nprint()\nprint('${w2}')`, `${w1}\n\n${w2}`],
      () => [`print('${w1}' + '${w2}', ${a})`, `${w1}${w2} ${a}`],
      () => [`for i in range(${R(2, 4)}):\n    print(i, end=',')`, null],
      () => [`print(${a} + ${b}, '${a} + ${b}')`, `${a + b} ${a} + ${b}`],
      () => [`print('${w1}', end='*')\nprint('${w2}', end='*')\nprint()`, `${w1}*${w2}*`],
      () => [`x = ${a}\nprint('x =', x)\nprint('x =' + str(x))`, `x = ${a}\nx =${a}`],
      () => [`print(f'{${a}} + {${b}} = {${a} + ${b}}')`, `${a} + ${b} = ${a + b}`],
    ];
    let [code, ans] = pick(forms)();
    if (ans == null) { const n = Number(code.match(/range\((\d+)\)/)[1]); ans = Array.from({ length: n }, (_, i) => i + ',').join(''); }
    return { type: 'print 的 sep 與 end', q: Q_OUT, code, ans, strict: true, why: 'print 的多個值之間預設用一個空格分隔（sep=\' \'），最後預設換行（end=\'\\n\'）。' };
  };

  GENS.pyIf = () => {
    const x = R(0, 100), c1 = pick([80, 70, 75]), c2 = pick([50, 40, 60]);
    const forms = [
      () => [C(`x = ${x}`, `if x >= ${c1}:`, "    print('A')", `elif x >= ${c2}:`, "    print('B')", 'else:', "    print('C')"), x >= c1 ? 'A' : x >= c2 ? 'B' : 'C'],
      () => [C(`x = ${x}`, `if x >= ${c2}:`, "    print('B')", `elif x >= ${c1}:`, "    print('A')", 'else:', "    print('C')"), x >= c2 ? 'B' : x >= c1 ? 'A' : 'C'],
      () => [C(`x = ${x}`, `if x >= ${c2}:`, "    print('合格')", `if x >= ${c1}:`, "    print('優異')", "print('完')"), [x >= c2 ? '合格' : null, x >= c1 ? '優異' : null, '完'].filter(Boolean).join('\n')],
      () => [C(`x = ${x}`, 'if x % 2 == 0:', '    x = x // 2', 'else:', '    x = x * 3 + 1', 'print(x)'), String(x % 2 === 0 ? x / 2 : x * 3 + 1)],
      () => { const y = R(0, 100); return [C(`x = ${x}`, `y = ${y}`, 'if x > y:', '    print(x - y)', 'elif x == y:', "    print('same')", 'else:', '    print(y - x)'), x > y ? String(x - y) : x === y ? 'same' : String(y - x)]; },
      () => [C(`x = ${x}`, `if x >= ${c2} and x < ${c1}:`, "    print('in')", 'else:', "    print('out')"), x >= c2 && x < c1 ? 'in' : 'out'],
      () => [C(`x = ${x}`, `if x > ${c2}:`, `    if x > ${c1}:`, "        print('P')", '    else:', "        print('Q')", 'else:', "    print('R')"), x > c2 ? (x > c1 ? 'P' : 'Q') : 'R'],
    ];
    const [code, ans] = pick(forms)();
    return { type: 'if／elif／else', q: Q_OUT, code, ans, why: 'if…elif…else 由上而下檢查，只會執行第一個成立的部分；兩個獨立的 if 則會各自檢查。' };
  };

  GENS.pyBool = () => {
    const a = R(-3, 12), b = R(-3, 12), k = R(0, 9);
    const atoms = [[`a > b`, a > b], [`a == b`, a === b], [`a != b`, a !== b], [`a % 2 == 0`, ((a % 2) + 2) % 2 === 0], [`b >= ${k}`, b >= k], [`a < ${k}`, a < k], [`b <= a`, b <= a]];
    const A = pick(atoms), B = pick(atoms), Cc = pick(atoms);
    const forms = [
      () => [`${A[0]} and ${B[0]}`, A[1] && B[1]], () => [`${A[0]} or ${B[0]}`, A[1] || B[1]], () => [`not ${A[0]}`, !A[1]],
      () => [`${A[0]} and ${B[0]} or ${Cc[0]}`, (A[1] && B[1]) || Cc[1]], () => [`${A[0]} or ${B[0]} and ${Cc[0]}`, A[1] || (B[1] && Cc[1])],
      () => [`not ${A[0]} and ${B[0]}`, !A[1] && B[1]], () => [`not (${A[0]} or ${B[0]})`, !(A[1] || B[1])], () => [`(${A[0]} or ${B[0]}) and ${Cc[0]}`, (A[1] || B[1]) && Cc[1]],
    ];
    const [ex, v] = pick(forms)();
    return { type: '布爾運算', q: '輸出是 True 還是 False？（優先次序：比較 → not → and → or）', code: C(`a = ${a}`, `b = ${b}`, `print(${ex})`), ans: v ? 'True' : 'False', options: ['True', 'False'], why: `a = ${a}，b = ${b}。先計算每個比較，再按 not、and、or 的次序。` };
  };

  GENS.pyRange = () => {
    const s = R(0, 5), e = s + R(3, 12), st = pick([1, 2, 3]);
    const seq = (a, b, c) => { const o = []; if (c > 0) for (let i = a; i < b; i += c) o.push(i); else for (let i = a; i > b; i += c) o.push(i); return o; };
    const forms = [
      () => [`print(list(range(${s}, ${e}, ${st})))`, pstr(seq(s, e, st))],
      () => [`print(list(range(${e - s})))`, pstr(seq(0, e - s, 1))],
      () => [`print(list(range(${e}, ${s}, -${st})))`, pstr(seq(e, s, -st))],
      () => [`print(len(range(${s}, ${e}, ${st})))`, String(seq(s, e, st).length)],
      () => [`print(sum(range(${s}, ${e})))`, String(seq(s, e, 1).reduce((x, y) => x + y, 0))],
      () => [`for i in range(${s}, ${e}, ${st}):\n    print(i, end=' ')`, seq(s, e, st).join(' ')],
    ];
    const [code, ans] = pick(forms)();
    return { type: 'range()', q: '以下程式的輸出是什麼？（list 寫成 [a, b, c]）', code, ans, why: 'range(start, stop, step)：由 start 開始，每次加 step，**不包括** stop。' };
  };

  GENS.pyFor = () => {
    const n = R(3, 6), k = R(1, 4), a = R(1, 5), b = a + R(4, 10), m = R(2, 4);
    const W = pick(['CAT', 'CODE', 'PYTHON', 'HKDSE', 'LOOP']);
    const forms = [
      () => [C('total = 0', `for i in range(1, ${n + 1}):`, `    total = total + i * ${k}`, 'print(total)'), String(k * n * (n + 1) / 2)],
      () => [C("s = ''", `for c in '${W}':`, '    s = c + s', 'print(s)'), W.split('').reverse().join('')],
      () => { let c = 0; for (let i = a; i < b; i++) if (i % m === 0) c++; return [C('count = 0', `for i in range(${a}, ${b}):`, `    if i % ${m} == 0:`, '        count = count + 1', 'print(count)'), String(c)]; },
      () => [C('p = 1', `for i in range(${n}):`, '    p = p * 2', 'print(p, i)'), `${2 ** n} ${n - 1}`],
      () => { let c = 0; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) c++; return [C('count = 0', `for i in range(${m}):`, `    for j in range(${n}):`, '        count = count + 1', 'print(count)'), String(c)]; },
      () => { const o = []; for (let i = 1; i <= m; i++) o.push('*'.repeat(i)); return [C(`for i in range(1, ${m + 1}):`, "    print('*' * i)"), o.join('\n')]; },
    ];
    const [code, ans] = pick(forms)();
    return { type: 'for 循環', q: Q_OUT, code, ans, why: '留意：Python 的 for 循環完結後，i 是最後一次的值（不是 stop）。' };
  };

  GENS.pyWhile = () => {
    const s = R(1, 6), st = R(2, 5), lim = s + st * R(2, 5) + R(0, st - 1);
    const forms = [
      () => { let x = s; while (x < lim) x += st; return [C(`n = ${s}`, `while n < ${lim}:`, `    n = n + ${st}`, 'print(n)'), String(x)]; },
      () => { let x = R(20, 90), c = 0; const x0 = x; while (x > 1) { x = Math.floor(x / 2); c++; } return [C(`n = ${x0}`, 'count = 0', 'while n > 1:', '    n = n // 2', '    count = count + 1', 'print(n, count)'), `${x} ${c}`]; },
      () => { const o = []; let x = lim; while (x > 0) { o.push(x); x -= st; } return [C(`x = ${lim}`, 'while x > 0:', "    print(x, end=' ')", `    x = x - ${st}`), o.join(' ')]; },
      () => { const n0 = R(100, 9999); let n = n0, t = 0; while (n > 0) { t += n % 10; n = Math.floor(n / 10); } return [C(`n = ${n0}`, 'total = 0', 'while n > 0:', '    total = total + n % 10', '    n = n // 10', 'print(total)'), String(t)]; },
      () => { let a = s, b = 1, c = 0; while (b < a + 5 && c < 20) { a += 1; b += st; c++; } return [C(`a = ${s}`, 'b = 1', 'while b < a + 5:', '    a = a + 1', `    b = b + ${st}`, 'print(a, b)'), `${a} ${b}`]; },
    ];
    const [code, ans] = pick(forms)();
    return { type: 'while 循環', q: Q_OUT, code, ans, why: 'while 每次先檢查條件；條件不成立便離開循環。' };
  };

  GENS.pyList = () => {
    const n = R(4, 6), A = Array.from({ length: n }, () => R(1, 30)), x = R(31, 60), i = R(0, n - 1), k = R(1, n);
    const forms = [
      () => [`print(a[${i}])`, pstr(A[i])],
      () => [`print(a[-${k}])`, pstr(A[n - k])],
      () => [`print(len(a))`, String(n)],
      () => [`a.append(${x})\nprint(a)`, pstr(A.concat([x]))],
      () => [`a.pop()\nprint(a)`, pstr(A.slice(0, -1))],
      () => { const B = A.slice(); const y = B.splice(i, 1)[0]; return [`y = a.pop(${i})\nprint(y, a)`, `${y} ${pstr(B)}`]; },
      () => { const B = A.slice(); B.splice(i, 0, x); return [`a.insert(${i}, ${x})\nprint(a)`, pstr(B)]; },
      () => { const B = A.slice(); B[i] = x; return [`a[${i}] = ${x}\nprint(a)`, pstr(B)]; },
      () => { const j = R(i, n); return [`print(a[${i}:${j}])`, pstr(A.slice(i, j))]; },
      () => [`print(a.index(${A[i]}))`, String(A.indexOf(A[i]))],
      () => { const v = pick([A[i], x]); return [`print(${v} in a)`, A.includes(v) ? 'True' : 'False']; },
      () => [`print(a[${i}] + a[-1])`, String(A[i] + A[n - 1])],
    ];
    const [rest, ans] = pick(forms)();
    return { type: '列表基本運作', q: '以下程式的輸出是什麼？（列表寫成 [a, b, c]）', code: `a = ${lit(A)}\n${rest}`, ans, why: '索引由 0 開始；a[-1] 是最後一項；切片 a[i:j] 不包括 a[j]。' };
  };

  GENS.pyListAlgo = () => {
    const n = R(5, 7), A = Array.from({ length: n }, () => R(1, 99)), k = R(20, 80);
    const forms = [
      () => [C(`a = ${lit(A)}`, 'total = 0', 'for x in a:', '    total = total + x', 'print(total)'), String(A.reduce((s, v) => s + v, 0))],
      () => [C(`a = ${lit(A)}`, 'big = a[0]', 'for i in range(1, len(a)):', '    if a[i] > big:', '        big = a[i]', 'print(big)'), String(Math.max(...A))],
      () => [C(`a = ${lit(A)}`, 'small = a[0]', 'for x in a:', '    if x < small:', '        small = x', 'print(small)'), String(Math.min(...A))],
      () => [C(`a = ${lit(A)}`, 'count = 0', 'for x in a:', `    if x > ${k}:`, '        count = count + 1', 'print(count)'), String(A.filter((v) => v > k).length)],
      () => { let p = 0; A.forEach((v, i) => { if (v < A[p]) p = i; }); return [C(`a = ${lit(A)}`, 'pos = 0', 'for i in range(len(a)):', '    if a[i] < a[pos]:', '        pos = i', 'print(pos)'), String(p)]; },
      () => [C(`a = ${lit(A)}`, 'total = 0', 'for x in a:', '    total = total + x', 'print(total / len(a))'), fl(A.reduce((s, v) => s + v, 0) / n)],
      () => { let ok = true; for (let i = 0; i < n - 1; i++) if (A[i] > A[i + 1]) ok = false; return [C(`a = ${lit(A)}`, 'ok = True', 'for i in range(len(a) - 1):', '    if a[i] > a[i + 1]:', '        ok = False', 'print(ok)'), ok ? 'True' : 'False']; },
    ];
    const [code, ans] = pick(forms)();
    return { type: '列表算法', q: Q_OUT, code, ans, why: '逐項檢查列表，用變量記住總和／最大／最小／數目。' };
  };

  GENS.pyStr = () => {
    const s = pick(['COMPUTER', 'PYTHON', 'Hong Kong', 'ICT 2026', 'banana', 'Hello World', 'algorithm']);
    const n = s.length, i = R(0, n - 1), k = R(1, n), a = R(0, n - 2), b = R(a + 1, n);
    const ch = pick([s[i], 'o', 'a', 'z', 'O']);
    const forms = [
      () => [`print(s[${i}])`, s[i]], () => [`print(s[-${k}])`, s[n - k]], () => [`print(s[${a}:${b}])`, s.slice(a, b)],
      () => [`print(s[:${k}])`, s.slice(0, k)], () => [`print(s[${a}:])`, s.slice(a)], () => ['print(len(s))', String(n)],
      () => ['print(s.upper())', s.toUpperCase()], () => ['print(s.lower())', s.toLowerCase()],
      () => [`print(s.find('${ch}'))`, String(s.indexOf(ch))], () => [`print('${ch}' in s)`, s.includes(ch) ? 'True' : 'False'],
      () => [`print(s.count('${ch}'))`, String(s.split(ch).length - 1)], () => ['print(s[::-1])', s.split('').reverse().join('')],
    ];
    const [rest, ans] = pick(forms)();
    return { type: '字串處理', q: '以下程式的輸出是什麼？', code: `s = '${s}'\n${rest}`, ans, why: `s = '${s}'，長度 ${n}；索引由 0 開始；find() 找不到時傳回 -1；切片不包括終點。` };
  };

  GENS.pyAscii = () => {
    const U = String.fromCharCode(R(65, 90)), L = String.fromCharCode(R(97, 122)), k = R(1, 5);
    const W = ['apple', 'Apple', 'banana', 'Banana', 'cat', 'Cat', 'car', 'card', 'Zoo', 'abc', 'ABC', '10', '9'];
    const w1 = pick(W); let w2 = pick(W); if (w2 === w1) w2 = 'ant';
    const forms = [
      () => [`print(ord('${U}'))`, String(U.charCodeAt(0))], () => [`print(ord('${L}'))`, String(L.charCodeAt(0))],
      () => { const c = R(65, 90); return [`print(chr(${c}))`, String.fromCharCode(c)]; },
      () => { const c = R(97, 117); return [`print(chr(ord('${String.fromCharCode(c)}') + ${k}))`, String.fromCharCode(c + k)]; },
      () => [`print(ord('${L}') - ord('a'))`, String(L.charCodeAt(0) - 97)],
      () => [`print(chr(ord('${L}') - 32))`, L.toUpperCase()],
      () => [`print('${w1}' < '${w2}')`, w1 < w2 ? 'True' : 'False'], () => [`print('${w1}' > '${w2}')`, w1 > w2 ? 'True' : 'False'],
    ];
    const [code, ans] = pick(forms)();
    return { type: 'ASCII 與字串比較', q: '以下程式的輸出是什麼？（A = 65，a = 97，0 = 48）', code, ans, why: '字串由第一個字元開始逐個比較 ASCII 碼：數字 < 大寫 < 小寫。' };
  };

  GENS.pyFunc = () => {
    const a = R(2, 5), b = R(0, 9), n = R(1, 9), x = R(1, 20), y = R(1, 20), c = R(0, 5), k = R(1, 4);
    const forms = [
      () => [C('def f(x):', `    return x * ${a} + ${b}`, `print(f(${n}))`), String(n * a + b)],
      () => [C('def diff(p, q):', '    if p > q:', '        return p - q', '    return q - p', `print(diff(${x}, ${y}))`), String(Math.abs(x - y))],
      () => [C(`x = ${x}`, 'def g():', `    x = ${y}`, '    return x', 'z = g()', 'print(x, z)'), `${x} ${y}`],
      () => [C(`count = ${c}`, 'def add():', '    global count', `    count = count + ${k}`, 'add()', 'add()', 'print(count)'), String(c + 2 * k)],
      () => [C('def double(x):', '    x = x * 2', `print(double(${n}))`), 'None'],
      () => [C('def f(x):', `    return x + ${a}`, 'def g(x):', '    return f(x) * 2', `print(g(${n}))`), String((n + a) * 2)],
      () => [C('def f(n):', '    total = 0', '    for i in range(1, n + 1):', '        total = total + i', '    return total', `print(f(${n}) + ${b})`), String((n * (n + 1)) / 2 + b)],
    ];
    const [code, ans] = pick(forms)();
    return { type: '子程式', q: Q_OUT, code, ans, why: '子程式內賦值的變量是局部變量；要修改全局變量要寫 global；沒有 return 的函數傳回 None。' };
  };

  GENS.pySearch = () => {
    if (fr() < 0.5) {
      const n = R(6, 9), A = shuffled(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, n), t = fr() < 0.75 ? pick(A) : R(31, 40);
      let found = -1, count = 0; for (let i = 0; i < n; i++) { count++; if (A[i] === t) { found = i; break; } }
      return { type: '線性檢索', q: Q_OUT, code: C(`a = ${lit(A)}`, `target = ${t}`, 'count = 0', 'found = -1', 'for i in range(len(a)):', '    count = count + 1', '    if a[i] == target:', '        found = i', '        break', 'print(found, count)'), ans: `${found} ${count}`, why: '線性檢索由第一項開始逐項比較；找到便 break。count 是比較次數。' };
    }
    const n = R(7, 12), A = shuffled(Array.from({ length: 40 }, (_, i) => i + 1)).slice(0, n).sort((x, y) => x - y), t = fr() < 0.75 ? pick(A) : R(1, 41);
    let lo = 0, hi = n - 1, count = 0, found = -1;
    while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); count++; if (A[mid] === t) { found = mid; break; } else if (A[mid] < t) lo = mid + 1; else hi = mid - 1; }
    return { type: '二分檢索', q: Q_OUT, code: C(`a = ${lit(A)}`, `target = ${t}`, 'low = 0', 'high = len(a) - 1', 'count = 0', 'found = -1', 'while low <= high:', '    mid = (low + high) // 2', '    count = count + 1', '    if a[mid] == target:', '        found = mid', '        break', '    elif a[mid] < target:', '        low = mid + 1', '    else:', '        high = mid - 1', 'print(found, count)'), ans: `${found} ${count}`, why: '二分檢索每次比較中間一項 a[mid]，然後把範圍減半。' };
  };

  GENS.pySort = () => {
    const n = R(5, 6), A = shuffled(Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, n), k = R(1, n - 2), B = A.slice();
    const kind = pick(['bubble', 'selection', 'insertion']);
    let code;
    if (kind === 'bubble') {
      for (let p = 0; p < k; p++) for (let i = 0; i < n - 1 - p; i++) if (B[i] > B[i + 1]) [B[i], B[i + 1]] = [B[i + 1], B[i]];
      code = C(`a = ${lit(A)}`, 'n = len(a)', `for p in range(${k}):`, '    for i in range(n - 1 - p):', '        if a[i] > a[i + 1]:', '            a[i], a[i + 1] = a[i + 1], a[i]', 'print(a)');
    } else if (kind === 'selection') {
      for (let p = 0; p < k; p++) { let m = p; for (let i = p + 1; i < n; i++) if (B[i] < B[m]) m = i; [B[p], B[m]] = [B[m], B[p]]; }
      code = C(`a = ${lit(A)}`, 'n = len(a)', `for p in range(${k}):`, '    m = p', '    for i in range(p + 1, n):', '        if a[i] < a[m]:', '            m = i', '    a[p], a[m] = a[m], a[p]', 'print(a)');
    } else {
      for (let p = 1; p <= k; p++) { const key = B[p]; let j = p - 1; while (j >= 0 && B[j] > key) { B[j + 1] = B[j]; j--; } B[j + 1] = key; }
      code = C(`a = ${lit(A)}`, `for p in range(1, ${k + 1}):`, '    key = a[p]', '    j = p - 1', '    while j >= 0 and a[j] > key:', '        a[j + 1] = a[j]', '        j = j - 1', '    a[j + 1] = key', 'print(a)');
    }
    const name = { bubble: '冒泡排序', selection: '選擇排序', insertion: '插入排序' }[kind];
    return { type: name, q: `以下是${name}，只執行了 ${k} 輪。輸出的列表是什麼？`, code, ans: pstr(B), why: `${name}：每一輪之後，列表其中一部分已排好次序。` };
  };

  function stackQueue(isQ) {
    const L = [], ops = [], name = isQ ? 'queue' : 'stack';
    let last = null;
    const n = R(5, 8);
    for (let i = 0; i < n; i++) {
      if (L.length && fr() < 0.4) { last = isQ ? L.shift() : L.pop(); ops.push(`x = ${name}.pop(${isQ ? '0' : ''})`); }
      else { const v = R(1, 30); L.push(v); ops.push(`${name}.append(${v})`); }
    }
    if (last == null) { last = isQ ? L.shift() : L.pop(); ops.push(`x = ${name}.pop(${isQ ? '0' : ''})`); }
    return { type: isQ ? '隊列' : '堆疊', q: Q_OUT + '（列表寫成 [a, b, c]）', code: C(`${name} = []`, ...ops, `print(x, ${name})`), ans: `${last} ${pstr(L)}`, why: isQ ? '隊列「先進先出」：append() 加到尾，pop(0) 由頭取出。' : '堆疊「後進先出」：append() 推入，pop() 取出最後推入的一項。' };
  }
  GENS.pyStack = () => stackQueue(false);
  GENS.pyQueue = () => stackQueue(true);

  const ERR_OPTS = ['SyntaxError', 'IndentationError', 'NameError', 'TypeError', 'ValueError', 'ZeroDivisionError', 'IndexError', '沒有錯誤'];
  GENS.pyErr = () => {
    const a = R(1, 20), b = R(2, 9), n = R(3, 5);
    const forms = [
      ['SyntaxError', () => C(`x = ${a}`, `if x > ${b}`, '    print(x)'), '少了冒號 :。'],
      ['SyntaxError', () => `print('Hello)`, '引號不成對。'],
      ['SyntaxError', () => C(`x = ${a}`, `print((x + ${b})`), '括號不成對。'],
      ['SyntaxError', () => C(`for i in range(${n})`, '    print(i)'), '少了冒號 :。'],
      ['IndentationError', () => C(`x = ${a}`, '    print(x)'), '不應縮排的地方縮排了。'],
      ['IndentationError', () => C(`x = ${a}`, `if x > ${b}:`, 'print(x)'), 'if 之後的句子要縮排。'],
      ['NameError', () => C(`total = ${a}`, 'print(totl)'), '變量名稱串錯。'],
      ['NameError', () => "Print('Hi')", 'Python 分大小寫，應寫 print。'],
      ['NameError', () => 'print(Hello)', '文字忘記加引號，Python 以為 Hello 是變量。'],
      ['TypeError', () => C(`age = '${a}'`, 'print(age + 1)'), '字串不能與整數相加。'],
      ['TypeError', () => `print('Score: ' + ${a * 5})`, '字串不能與整數相加，要用 str()。'],
      ['TypeError', () => `print(len(${a}))`, '整數沒有長度。'],
      ['ValueError', () => "x = int('abc')", "'abc' 不能轉成整數。"],
      ['ValueError', () => `x = int('${a}.5')`, "int() 不能直接轉換有小數點的字串。"],
      ['ZeroDivisionError', () => C('x = 0', `print(${a} / x)`), '除數是 0。'],
      ['ZeroDivisionError', () => `print(${a} % 0)`, '% 的右邊是 0。'],
      ['IndexError', () => C(`a = [${a}, ${b}, ${n}]`, 'print(a[3])'), '列表有 3 項，索引只到 2。'],
      ['IndexError', () => C("s = 'abc'", `print(s[${R(3, 6)}])`), '索引超出字串長度。'],
      ['沒有錯誤', () => C(`a = [${a}, ${b}, ${n}]`, 'print(a[-1])'), 'a[-1] 是最後一項。'],
      ['沒有錯誤', () => `print('${b}' * 3)`, '字串乘整數是重複。'],
      ['沒有錯誤', () => `print(int('${a}') + 1)`, "'" + a + "' 可以轉成整數。"],
    ];
    const [ans, f, why] = pick(forms);
    return { type: '錯誤類型', q: '執行以下程式，會出現哪一種錯誤？', code: f(), ans, options: ERR_OPTS, ask: { error: true }, why };
  };
  PY.GEN_NAMES = Object.keys(GENS);

  function renderEndless(sec, ctx) {
    const es = ctx.state.endless = ctx.state.endless || { n: 0, right: 0 };
    const box = h('div.blk');
    const stat = h('p.pts');
    const area = h('div.blk');
    const updStat = () => { stat.textContent = `已做 ${es.n} 題，答對 ${es.right} 題（不計分，會寫進報告）。`; };
    let lastType = null;
    const gens = (sec.gens || []).filter((g) => GENS[g]);
    function gen() {
      let g = GENS[pick(gens)]();
      for (let k = 0; k < 4 && gens.length > 1 && g.type === lastType; k++) g = GENS[pick(gens)]();
      lastType = g.type; return g;
    }
    function runner(g) {
      return PyIDE({ code: g.code, inputs: g.inputs || '', fname: 'practice.py' }).el;
    }
    function next() {
      const g = gen();
      if (g.options) return nextOpt(g);
      const n = String(g.ans).split('\n').length;
      const inp = ansInput('你的答案', n > 1 || g.strict ? Math.max(2, n) : 0);
      const fb = h('div', { 'aria-live': 'polite' });
      const bChk = h('button.btn.primary', { type: 'button' }, '核對');
      const bNext = h('button.btn', { type: 'button' }, '再練一題');
      const simSlot = h('div');
      let answered = false;
      bChk.onclick = () => {
        if (answered || !inp.value.trim()) return;
        answered = true; const ok = g.strict ? same(inp.value, g.ans) : sameLoose(inp.value, g.ans); es.n++; if (ok) es.right++; ctx.save(); updStat();
        inp.classList.add(ok ? 'ok' : 'no'); inp.readOnly = true; bChk.disabled = true;
        fb.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對了！' : '未對。答案是：', h('div', ok ? null : h('pre.out', g.ans), g.why ? mdEl('p', g.why) : null, h('p.pts', '可以按下面的「▶ 執行」核對。'))));
        simSlot.replaceChildren(runner(g));
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (inp.tagName === 'INPUT' || e.ctrlKey)) { e.preventDefault(); bChk.onclick(); } });
      bNext.onclick = next;
      area.replaceChildren(h('div.row', h('span.pill.prac', h('i', '∞'), g.type)), mdEl('div.q', g.q), codeView(g.code), inputsNote(g), g.ask && g.ask.var ? h('p.pts', `問：變量 ${g.ask.var} 的值`) : null,
        h('div.row', inp, bChk, bNext), n > 1 || g.strict ? h('p.pts', '每行輸出寫一行；按 Ctrl+Enter 或「核對」。') : null, fb, simSlot);
    }
    function nextOpt(g) {
      let sel = null, answered = false;
      const fb = h('div', { 'aria-live': 'polite' });
      const bChk = h('button.btn.primary', { type: 'button', disabled: true }, '核對');
      const bNext = h('button.btn', { type: 'button', onclick: next }, '再練一題');
      const simSlot = h('div');
      const btns = g.options.map((o) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { if (answered) return; sel = o; btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn(o)))); bChk.disabled = false; } }, o));
      const btn = (o) => btns[g.options.indexOf(o)];
      bChk.onclick = () => {
        if (answered || sel == null) return;
        answered = true; const ok = sel === g.ans; es.n++; if (ok) es.right++; ctx.save(); updStat();
        btn(sel).classList.add(ok ? 'ok' : 'no'); if (!ok) btn(g.ans).classList.add('ok'); bChk.disabled = true;
        fb.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對了！' : `未對。答案是「${g.ans}」。`, g.why || null));
        if (g.code) simSlot.replaceChildren(runner(g));
      };
      area.replaceChildren(h('div.row', h('span.pill.prac', h('i', '∞'), g.type)), mdEl('div.q', g.q), g.code ? codeView(g.code) : null, h('div.endopts', { role: 'group', 'aria-label': '選項' }, btns), h('div.row', bChk, bNext), fb, simSlot);
    }
    box.append(sec.intro ? mdEl('p', sec.intro) : mdEl('p', '隨機生成的練習，想練多少就練多少。答案由程式計算，核對後可以按「▶ 執行」看看真正的結果。'));
    box.append(stat, area);
    updStat(); next();
    return box;
  }

  // ---------------- 學 ----------------
  function renderLearn(blocks) {
    const box = h('div.blk');
    box.append(h('span.pill.learn', h('i', '學'), '重點'));
    for (const b of blocks) {
      if (b.h) box.append(h('h3', b.h));
      else if (b.pts) box.append(h('ul.pts-list', b.pts.map((p) => mdEl('li', p))));
      else if (b.p) box.append(mdEl('p', b.p));
      else if (b.note) box.append(mdEl('div.note', b.note));
      else if (b.warn) box.append(h('div.warnbox', h('b', '常見錯誤　'), mdEl('span', b.warn)));
      else if (b.fix) {
        if (typeof b.fix === 'string') box.append(h('p.fixnote', b.fix));
        else box.append(h('div.fixbox', h('div.fixcol', h('b.badl', '✗ 錯誤'), codeView(b.fix.bad)), h('div.fixcol', h('b.goodl', '✓ 正確'), codeView(b.fix.good)), b.fix.why ? mdEl('p.fixwhy', b.fix.why) : null));
      }
      else if (b.table) { box.append(tableEl(b.table)); if (b.cap) box.append(mdEl('p.cap', b.cap)); }
      else if (b.code != null) { if (b.cap) box.append(mdEl('p.cap', b.cap)); box.append(codeView(b.code)); }
      else if (b.sim) { if (b.cap) box.append(mdEl('p', b.cap)); box.append(PyIDE({ code: b.sim.code, editable: b.sim.editable !== false, inputs: b.sim.inputs || '', files: b.sim.files, fixRandom: b.sim.fixRandom, run: b.sim._run, open: b.sim.open || [], fname: b.sim.fname }).el); }
    }
    return box;
  }

  // ---------------- 單元頁 ----------------
  PY.unit = function (U, CRS) {
    CRS = CRS || {};
    PY._unit = U; PY._course = CRS;
    const KEY = `py:${CRS.code || 'py'}:${U.id}:v1`;
    const PIN = CRS.pin || '';
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
      (sec.items || []).forEach((it) => allItems.push({ id: it.id, cat: 'quiz', pts: it.pts, sec: sec.id }));
    }
    const CATS = { try: '試', prac: '練', write: U.writeLabel || (U.theory ? '分析題' : '寫程式'), quiz: '小測' };
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
      get state() { return S; }, save, get teacher() { return teacher; },
      award(id, pts, extra, silent) {
        const cur = S.items[id] || {};
        if (cur.done) return;
        S.items[id] = Object.assign({}, cur, extra, { pts: extra.done ? pts : 0 });
        save(); if (!silent) refreshHead();
      },
      refresh: () => refreshHead(),
    };
    const scoreB = h('b'); const whoEl = h('div.who');
    const head = h('header.top', h('div.brand', h('span.kicker', `${CRS.kicker || 'HKDSE ICT'} · ${U.id.toUpperCase()}`), h('h1', U.title), h('span.pages', U.book || '')), h('div.headr', h('div.scorebox', scoreB, h('span', `/ ${MAX} 分`)), whoEl));
    const progList = h('ol'); const progBar = h('i');
    const prog = h('nav.prog', { 'aria-label': '單元進度' }, progList, h('div.bar', progBar));
    const main = h('main', { id: 'main' });
    const tBar = h('div.teacherbar', { hidden: true }, '老師模式：可跳到任何一節，答案會顯示在題目下面。報告會註明「老師模式」。');
    const pinIn = h('input', { type: 'password', 'aria-label': '老師 PIN', size: 10, style: { fontSize: '14px', padding: '2px 6px' } });
    const pinMsg = h('span');
    const pinBox = h('span.row', { hidden: true }, pinIn, h('button.iconbtn', { type: 'button', onclick: tryPin }, '確定'), pinMsg);
    const foot = h('footer', h('a', { href: '../' }, '← 返回目錄'), h('span', '頁面在瀏覽器內運行，進度只儲存在這部裝置。'), store.ok ? null : h('b', { style: { color: 'var(--bad)' } }, '注意：這個瀏覽器不能儲存進度（例如私密模式），離開頁面後進度會消失。'), h('span.spacer'), themeBtn(), h('button.iconbtn', { type: 'button', onclick: () => { pinBox.hidden = !pinBox.hidden; if (!pinBox.hidden) pinIn.focus(); } }, '老師'), pinBox);
    function tryPin() {
      if (PIN && pinIn.value === PIN) { teacher = true; tBar.hidden = false; pinBox.hidden = true; pinMsg.textContent = ''; render(); }
      else pinMsg.textContent = 'PIN 不正確';
    }
    pinIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryPin(); });
    const wrap = h('div.wrap', head, tBar, prog, main, foot);
    app.replaceChildren(wrap);

    function refreshHead() {
      scoreB.textContent = got();
      whoEl.replaceChildren();
      if (S.reg) whoEl.append(h('span', h('b', S.reg.cls), ' 班 ', h('b', S.reg.no), ' 號 ', h('b', S.reg.name)), h('button.iconbtn', { type: 'button', onclick: () => { regForm(true); } }, '✎ 更改'));
      progList.replaceChildren();
      U.sections.forEach((sec, i) => {
        const can = teacher || S.visited.includes(i) || S.visited.includes(i - 1);
        const b = h('button' + (secDone(sec) ? '.done' : ''), { type: 'button', disabled: !can || !S.reg, 'aria-current': i === S.sec ? 'step' : null, onclick: () => go(i) }, h('span.n', secDone(sec) ? '✓' : String(i + 1)), sec.title);
        progList.append(h('li', b));
      });
      progBar.style.width = `${MAX ? Math.round((100 * got()) / MAX) : 0}%`;
      const cur = progList.querySelector('[aria-current]'); if (cur && progList.scrollWidth > progList.clientWidth) { const l = cur.offsetLeft - progList.offsetLeft; progList.scrollLeft = Math.max(0, l - 40); }
    }
    function go(i) { S.sec = i; if (!S.visited.includes(i)) S.visited.push(i); save(); render(); window.scrollTo({ top: 0 }); }

    function regForm(edit) {
      const r = S.reg || {};
      const cls = h('input', { type: 'text', value: r.cls || '', placeholder: '例如 4A', maxlength: 6, autocomplete: 'off' });
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
      if (sec.learn) card.append(renderLearn(sec.learn));
      for (const it of sec.tries || []) card.append(renderTry(it, ctx));
      for (const it of sec.practice || []) card.append(PY.renderPractice(it, ctx));
      if (sec.kind === 'write') for (const t of sec.tasks) card.append(t.kind === 'table' ? renderTableTask(t, ctx) : renderWrite(t, ctx));
      if (sec.kind === 'quiz') card.append(renderQuiz(sec, ctx));
      if (sec.kind === 'endless') card.append(renderEndless(sec, ctx));
      if (sec.kind === 'report') card.append(renderReport());
      const prev = h('button.btn', { type: 'button', disabled: i === 0, onclick: () => go(i - 1) }, '← 上一節');
      const next = h('button.btn.primary', { type: 'button', disabled: i === U.sections.length - 1, onclick: () => go(i + 1) }, '下一節 →');
      main.replaceChildren(card, h('div.navbtm', prev, next));
    }

    function report() {
      const parts = {};
      for (const c of Object.keys(CATS)) { const m = maxOf((x) => x.cat === c); if (m) parts[c] = [got((x) => x.cat === c), m]; }
      const items = {}; for (const x of allItems) items[x.id] = (S.items[x.id] || {}).pts || 0;
      const rep = { app: 'Python自學平台', course: CRS.code || '', unit: U.id, title: U.title, ver: 1, cls: S.reg.cls, no: S.reg.no, name: S.reg.name, score: got(), max: MAX, parts, items, endless: { n: S.endless.n, right: S.endless.right }, teacher, started: S.started, time: new Date().toISOString() };
      rep.sig = PY.signReport(rep, U.key);
      return rep;
    }
    function reportText(rep) {
      const p = Object.entries(rep.parts).map(([c, [g, m]]) => `${CATS[c]} ${g}/${m}`).join('；');
      return [`${CRS.title || 'Python 自學平台'} 交功課報告`, `單元：${rep.unit.toUpperCase()} ${rep.title}`, `班別：${rep.cls}　學號：${rep.no}　姓名：${rep.name}`, `總分：${rep.score} / ${rep.max}`, p, `無限練習：做了 ${rep.endless.n} 題，答對 ${rep.endless.right} 題`, `提交時間：${new Date(rep.time).toLocaleString('zh-HK')}${rep.teacher ? '（老師模式）' : ''}`, '----- 以下報告資料請勿修改，否則簽名會失效 -----', JSON.stringify(rep)].join('\n');
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
      bDl.onclick = () => {
        try {
          const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `${CRS.code || 'PY'}_${U.id}_${rep.cls}_${rep.no}_${rep.name}.txt` });
          document.body.append(a); a.click(); a.remove(); msg.textContent = '已開始下載。如果沒有下載到檔案，請改用「複製報告」。';
        } catch (e) { msg.textContent = '這個環境不能下載檔案，請改用「複製報告」。'; }
      };
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
    PY._ctx = ctx; PY._state = () => S;
  };

  // ---------------- 教師頁 ----------------
  const dt = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return isNaN(d) ? '' : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  PY.teacher = function (T) {
    const CRS = T.course || {};
    const PIN = CRS.pin || '';
    const app = document.getElementById('app');
    const keys = Object.assign({}, T.keys || {}); T.units.forEach((u) => { keys[u.id] = u.key; });
    const pin = h('input', { type: 'password', 'aria-label': '老師 PIN', autocomplete: 'off' });
    const msg = h('p.pts', { 'aria-live': 'polite' });
    const gate = h('section.card.reg', h('h2', { style: { margin: 0 } }, '輸入老師 PIN'), h('p.note', '注意：PIN 寫在公開的網站程式碼內，任何人都可以看到；這只是方便老師使用，並不是保安措施。學生報告的分數由 HMAC 簽名保護。'), h('label', 'PIN', pin), msg, h('div.row', h('button.btn.primary', { type: 'button', id: 'pin-go', onclick: unlock }, '進入')));
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlock(); });
    const head = h('header.top', h('div.brand', h('span.kicker', CRS.kicker || 'HKDSE ICT'), h('h1', `${CRS.title || 'Python 自學平台'}　教師頁`), h('span.pages', '核對簽名報告、匯總 CSV、各單元答案及重點')), h('div', themeBtn()));
    const main = h('main');
    app.replaceChildren(h('div.wrap', head, main, h('footer', h('a', { href: '../' }, '← 返回目錄'))));
    main.append(gate);
    function unlock() { if (!PIN || pin.value !== PIN) { msg.textContent = 'PIN 不正確'; return; } main.replaceChildren(verifier(), ...T.units.map(answerSheet)); }
    function parseReports(text) {
      const out = []; const re = /\{"app":/g; let m;
      const starts = []; while ((m = re.exec(text))) starts.push(m.index);
      for (const s of starts) {
        let depth = 0, q = false, e = -1;
        for (let i = s; i < text.length; i++) { const c = text[i]; if (q) { if (c === '\\') i++; else if (c === '"') q = false; continue; } if (c === '"') q = true; else if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) { e = i; break; } } }
        if (e > 0) { try { out.push(JSON.parse(text.slice(s, e + 1))); } catch (er) { out.push({ bad: '未能讀取' }); } }
      }
      if (!starts.length && text.trim()) { const t = text.trim(); try { out.push(JSON.parse(t)); } catch (e) { /* 略 */ } }
      return out;
    }
    const CATL = ['try', 'prac', 'write', 'quiz'];
    const CATN = ['試', '練', '寫程式／分析題', '小測'];
    function verifier() {
      const ta = h('textarea.report', { 'aria-label': '貼上報告', placeholder: '把學生的報告（整段文字或 JSON）貼在這裏，可以一次貼多份。' });
      const file = h('input', { type: 'file', multiple: true, accept: '.txt,.json,text/plain,application/json', 'aria-label': '上載報告檔案' });
      const res = h('div');
      let rows = [];
      const csvOf = () => {
        const head = ['狀態', '單元', '班別', '學號', '姓名', '總分', '滿分', ...CATN, '無限練習題數', '無限練習答對', '老師模式', '提交時間'];
        const q = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        return '\ufeff' + [head, ...rows.map((r) => [r.status, r.unit, r.cls, r.no, r.name, r.score, r.max, ...CATL.map((c) => (r.parts && r.parts[c] ? r.parts[c][0] : '')), r.endless ? r.endless.n : '', r.endless ? r.endless.right : '', r.teacher ? '是' : '', r.time ? dt(r.time) : '']).map((x) => x.map(q).join(','))].join('\r\n');
      };
      const show = () => {
        const tb = h('tbody', rows.map((r) => h('tr', h('td', { style: { color: r.status === '✓ 簽名正確' ? 'var(--good)' : 'var(--bad)', fontWeight: 700 } }, r.status), h('td', r.unit || ''), h('td', r.cls || ''), h('td', r.no || ''), h('td', r.name || ''), h('td.num', r.score != null ? `${r.score}/${r.max}` : ''),
          ...CATL.map((c) => h('td.num', r.parts && r.parts[c] ? `${r.parts[c][0]}/${r.parts[c][1]}` : '')), h('td.num', r.endless ? `${r.endless.right}/${r.endless.n}` : ''), h('td', r.teacher ? '老師模式' : ''), h('td', r.time ? dt(r.time) : ''))));
        const dl = h('button.btn', { type: 'button', onclick: () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([csvOf()], { type: 'text/csv;charset=utf-8' })), download: `${CRS.code || 'PY'}_報告匯總.csv` }); document.body.append(a); a.click(); a.remove(); } catch (e) { /* 略 */ } } }, '下載 CSV');
        const cp = h('button.btn', { type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(csvOf()); cp.textContent = '已複製'; } catch (e) { cp.textContent = '未能複製'; } } }, '複製 CSV');
        res.replaceChildren(h('p', `共 ${rows.length} 份報告；簽名正確 ${rows.filter((r) => r.status === '✓ 簽名正確').length} 份。`), h('div.scroll', h('table.tb.sumtab#rep-table', h('thead', h('tr', ['狀態', '單元', '班別', '學號', '姓名', '總分', ...CATN, '無限練習（對/做）', '模式', '提交時間'].map((x) => h('th', x)))), tb)), h('div.row', dl, cp));
      };
      const add = (text) => {
        for (const r of parseReports(text)) {
          let status;
          if (r.bad) status = '✗ 未能讀取';
          else if (!keys[r.unit]) status = '✗ 未知單元';
          else status = PY.verifyReport(r, keys[r.unit]) ? '✓ 簽名正確' : '✗ 簽名不符（報告曾被修改）';
          const dup = rows.findIndex((x) => x.raw === PY.canon(r)); if (dup >= 0) continue;
          rows.push(Object.assign({}, r, { status, raw: PY.canon(r) }));
        }
        rows.sort((a, b) => String(a.unit).localeCompare(String(b.unit), undefined, { numeric: true }) || String(a.cls).localeCompare(String(b.cls)) || Number(a.no) - Number(b.no));
        show();
      };
      const bGo = h('button.btn.primary', { type: 'button', id: 'verify-go', onclick: () => { add(ta.value); } }, '核對');
      const bClr = h('button.btn.ghost', { type: 'button', onclick: () => { rows = []; ta.value = ''; res.replaceChildren(); } }, '清除');
      file.addEventListener('change', async () => { for (const f of file.files) add(await f.text()); });
      return h('section.card', h('h2', { style: { margin: 0 } }, '核對學生報告'), h('p', '可貼上報告文字，或選擇多個報告檔案（.txt）。系統會檢查 HMAC 簽名，並匯總成 CSV（可用 Excel 開啟）。'), ta, h('div.row', bGo, bClr, h('label.row', '上載檔案：', file)), res);
    }
    function answerSheet(U) {
      const body = h('div.blk');
      const det = h('details.ansheet', h('summary', `${U.id.toUpperCase()} ${U.title}：答案及重點`), body);
      det.addEventListener('toggle', () => { if (det.open && !body.children.length) body.append(...sheetBody(U)); });
      return h('section.card', det);
    }
    function sheetBody(U) {
      const out = [h('p.pts', U.book || '')];
      let total = 0;
      for (const sec of U.sections) {
        const blk = h('div.blk', h('h3', sec.title + (sec.pages ? `（${sec.pages}）` : '')));
        if (sec.learn) { const pts = sec.learn.filter((b) => b.pts).flatMap((b) => b.pts); if (pts.length) blk.append(h('ul.pts-list', pts.map((p) => mdEl('li', p)))); }
        const rows = [];
        for (const it of sec.tries || []) { const r = correctIndex(it); rows.push(['試', it.id, it.pts, it.src || '', `${LET[r]}. ${it.options[r]}`]); total += it.pts; }
        for (const it of sec.practice || []) {
          let a;
          if (it.type === 'mc') { const r = correctIndex(it); a = `${LET[r]}. ${it.options[r]}`; }
          else if (it.type === 'fill') { const v = PY.fillAnswers(it); a = it.blanks.map((b, i) => `${b.label} ${v[i]}`).join('；'); }
          else if (it.type === 'trace') { const tr = it._trace; a = tr.rows.map((r) => `${r.label}：${tr.cols.map((c, ci) => (r.cells[ci].changed ? `${c.label}=${r.cells[ci].v}` : '')).filter(Boolean).join('，') || '—'}`).join('\n'); }
          else if (it.type === 'complete') a = it.ref.map((r, i) => `［${i + 1}］${r}`).join('；');
          rows.push(['練', it.id, it.pts, it.src || '', a]); total += it.pts;
        }
        for (const t of sec.tasks || []) { rows.push([t.kind === 'table' ? '分析題' : '寫程式', t.id, t.pts, t.src || '', t.kind === 'table' ? tableAnswerText(t) : t.ref]); total += t.pts; }
        for (const it of sec.items || []) { const r = correctIndex(it); rows.push(['小測', it.id, it.pts, it.src || '', `${LET[r]}. ${it.options[r]}` + ((it.tags || []).length ? `（${it.tags.map((x) => (x.t === 'hot' ? '常考' : '易錯') + '：' + (x.why || '')).join('；')}）` : '')]); total += it.pts; }
        if (rows.length) blk.append(h('div.scroll', h('table.tb', h('thead', h('tr', ['類別', '編號', '分', '出處', '答案'].map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.slice(0, 4).map((x) => h('td', String(x))), h('td', /\n/.test(r[4]) || r[0] === '寫程式' ? h('pre.code.plain', r[4]) : r[4])))))));
        if (sec.kind === 'endless') blk.append(h('p.pts', `隨機題型：${(sec.gens || []).join('、')}（答案由程式計算，不計分）。`));
        out.push(blk);
      }
      out.splice(1, 0, h('p.pts', `總分 ${total}。`));
      return out;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PY;
})(typeof window !== 'undefined' ? window : globalThis);
