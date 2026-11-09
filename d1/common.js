/* D1 自學平台 共用框架：登記、進度、計分、HMAC 報告、老師 PIN、
 * 試／練／寫算法／小測／無限練習元件、偽代碼編輯器＋模擬器＋追蹤表＋流程圖面板。
 * 需要先載入 engine.js（window.D1E）。
 */
(function () {
  'use strict';
  const E = window.D1E;
  const PIN = 'd1ict2026';
  const D1 = (window.D1 = window.D1 || {});

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
  try { const t = '__d1t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); } catch (e) { store.ok = false; }
  D1.h = h; D1.md = md; D1.store = store;

  // ---------------- SHA-256／HMAC（純 JS，兩邊結果一致） ----------------
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
  D1.hmacHex = hmacHex; D1.canon = canon;
  D1.signReport = (rep, key) => hmacHex(key, canon(rep));
  D1.verifyReport = (rep, key) => { const r = Object.assign({}, rep); const sig = r.sig; delete r.sig; return !!sig && hmacHex(key, canon(r)) === sig; };

  // ---------------- 主題 ----------------
  function themeBtn() {
    const b = h('button.iconbtn', { type: 'button', title: '切換淺色／深色' });
    const cur = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const lab = () => { b.textContent = cur() === 'dark' ? '☀ 淺色' : '☾ 深色'; };
    const saved = store.get('d1:theme'); if (saved) document.documentElement.setAttribute('data-theme', saved);
    b.onclick = () => { const t = cur() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); store.set('d1:theme', t); lab(); };
    lab(); return b;
  }

  // ---------------- 代碼顯示 ----------------
  const KW = /(否則如果|否則|如果|則|下至|直至|重複|執行|輸入|輸出|調用|設|由|至|到|當|\bAND\b|\bOR\b|\bNOT\b|\bTrue\b|\bFalse\b|\band\b|\bor\b|\bnot\b)/;
  function hlLine(s) {
    const parts = []; let rest = s;
    const re = /("[^"]*"|'[^']*')|(←)|(否則如果|否則|如果|則|下至|直至|重複|執行|輸入|輸出|調用|設|由|至|到|當|\bAND\b|\bOR\b|\bNOT\b|\bTrue\b|\bFalse\b|\band\b|\bor\b|\bnot\b)/g;
    let last = 0, m;
    while ((m = re.exec(rest))) {
      if (m.index > last) parts.push(esc(rest.slice(last, m.index)));
      if (m[1]) parts.push(`<span class="s">${esc(m[1])}</span>`);
      else if (m[2]) parts.push('<span class="o">←</span>');
      else parts.push(`<span class="k">${esc(m[3])}</span>`);
      last = m.index + m[0].length;
    }
    parts.push(esc(rest.slice(last)));
    return parts.join('');
  }
  void KW;
  function codeView(code, opt) {
    opt = opt || {};
    const el = h('pre.code', { 'aria-label': opt.label || '偽代碼' });
    const lines = String(code).split('\n');
    const rows = lines.map((s, i) => {
      const ln = h('div.ln', h('span.no', String(i + 1)));
      const body = h('span');
      if (opt.blanks) {
        // ［1］ 之類的空格換成輸入框
        const segs = s.split(/(［\d+］)/);
        for (const seg of segs) {
          const mm = seg.match(/^［(\d+)］$/);
          if (mm) { const inp = h('input.blank', { type: 'text', 'aria-label': `空格 ${mm[1]}`, 'data-b': mm[1], size: 8, autocomplete: 'off', spellcheck: 'false' }); opt.blanks[mm[1]] = inp; body.append(inp); }
          else body.insertAdjacentHTML('beforeend', hlLine(seg));
        }
      } else body.innerHTML = hlLine(s) || ' ';
      ln.append(body); el.append(ln); return ln;
    });
    el.mark = (line, cls) => { rows.forEach((r) => r.classList.remove('hl', 'err')); if (line != null && rows[line]) { rows[line].classList.add(cls || 'hl'); if (opt.scroll !== false) { const box = el.closest('.sim-code'); if (box && rows[line].scrollIntoView && box.scrollHeight > box.clientHeight) rows[line].scrollIntoView({ block: 'nearest' }); } } };
    return el;
  }
  D1.codeView = codeView;

  // ---------------- 編輯器 ----------------
  function Editor(code, opt) {
    opt = opt || {};
    const ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off', 'aria-label': '偽代碼編輯器' });
    ta.value = code || '';
    const gut = h('div.ed-gut', { 'aria-hidden': 'true' });
    let errLine = null;
    const sync = () => {
      const n = ta.value.split('\n').length;
      gut.innerHTML = Array.from({ length: n }, (_, i) => (i === errLine ? `<span class="e">${i + 1}</span>` : String(i + 1))).join('\n');
      ta.rows = Math.max(opt.minRows || 6, n + 1);
      if (opt.onChange) opt.onChange(ta.value);
    };
    const insert = (txt) => {
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(txt, s, e, 'end'); ta.focus(); sync();
    };
    const lineStart = (pos) => ta.value.lastIndexOf('\n', pos - 1) + 1;
    ta.addEventListener('input', sync);
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Tab' && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
        if (ta.dataset.esc === '1') { ta.dataset.esc = ''; return; }
        ev.preventDefault();
        if (ev.shiftKey) {
          const ls = lineStart(ta.selectionStart); const m = ta.value.slice(ls).match(/^ {1,4}/);
          if (m) { const s = ta.selectionStart; ta.setRangeText('', ls, ls + m[0].length, 'preserve'); ta.selectionStart = ta.selectionEnd = Math.max(ls, s - m[0].length); sync(); }
        } else insert('    ');
      } else if (ev.key === 'Escape') { ta.dataset.esc = '1'; }
      else if (ev.key === 'Enter' && !ev.isComposing) {
        const ls = lineStart(ta.selectionStart); const cur = ta.value.slice(ls, ta.selectionStart);
        let ind = cur.match(/^ */)[0];
        if (/(則|否則|執行|重複)\s*$/.test(cur) || /^\s*(設|當)\s/.test(cur)) ind += '    ';
        ev.preventDefault(); insert('\n' + ind);
      }
    });
    const tools = h('div.ed-tools', { role: 'toolbar', 'aria-label': '插入符號' },
      (opt.tools || ['←', '輸入 ', '輸出 ', '如果 ', ' 則', '否則', '設 i 由 1 至 ', '當 ', '"', '<=', '>=', '<>']).map((t) => h('button', { type: 'button', onclick: () => insert(t), title: `插入「${t.trim()}」` }, t.trim() || t)),
      h('button', { type: 'button', title: '縮排（Tab）', onclick: () => insert('    ') }, '⇥ 縮排'));
    const box = h('div.ed-box', gut, ta);
    const el = h('div.ed', tools, box, h('p.ed-hint', '提示：Tab 鍵縮排 4 格，Shift+Tab 減少縮排；按 Esc 後再按 Tab 可離開編輯框。'));
    sync();
    return { el, ta, get: () => ta.value, set: (v) => { ta.value = v; sync(); }, markErr: (l) => { errLine = l; sync(); } };
  }
  D1.Editor = Editor;

  // ---------------- 模擬器 ----------------
  const SHOW = ['stmt', 'cond', 'check', 'iter', 'forend', 'error', 'end'];
  function Sim(o) {
    o = o || {};
    const self = { res: null, k: 0, steps: [], locked: !!o.locked, parsed: null, flowEl: null, traceMode: null };
    const inp = h('input', { type: 'text', value: o.inputs || '', 'aria-label': '輸入數據', placeholder: '例如 60, 1.7', spellcheck: 'false' });
    const bStep = h('button.btn.primary.small', { type: 'button' }, '▶ 下一步');
    const bAll = h('button.btn.small', { type: 'button' }, '⏩ 執行到底');
    const bReset = h('button.btn.ghost.small', { type: 'button' }, '↺ 重設');
    const bEdit = h('button.btn.ghost.small', { type: 'button', hidden: true }, '✎ 修改程式');
    const stepInfo = h('span.sim-step');
    if (o.noInput == null) o.noInput = !o.editable && !/輸入/.test(o.code || '');
    const bar = h('div.sim-bar', o.noInput ? null : h('label', '輸入數據', inp), bStep, bAll, bReset, bEdit, stepInfo);
    const codeBox = h('div.sim-code');
    let editor = null, view = null;
    const varsEl = h('div.vars'), outEl = h('div.outbox', { 'aria-live': 'polite' }), msgEl = h('div.msg', { 'aria-live': 'polite' }), warnEl = h('ul.warns');
    const state = h('div.sim-state', h('h4', '變量'), varsEl, h('h4', '輸出'), outEl, h('h4', '說明'), msgEl, warnEl);
    const main = h('div.sim-main', codeBox, state);
    // 面板
    const tBody = h('div.panel-body'), fBody = h('div.panel-body');
    const tDet = h('details', { open: (o.open || []).includes('trace') }, h('summary', '追蹤表'), tBody);
    const fDet = h('details', { open: (o.open || []).includes('flow') }, h('summary', '流程圖'), fBody);
    const panels = h('div.sim-panels', o.noTrace ? null : tDet, o.noFlow ? null : fDet);
    const el = h('div.sim', bar, main, panels);
    self.el = el; self.input = inp;
    const lockMsg = o.lockMsg || '先選答案並按「鎖定答案」，才可逐步執行。';

    if (o.editable) { editor = Editor(o.code || '', { onChange: () => { if (self.res) clearRun(); } }); codeBox.append(editor.el); }
    else { view = codeView(o.code || ''); codeBox.append(view); }
    self.editor = editor;
    self.getCode = () => (editor ? editor.get() : o.code || '');
    self.setCode = (c) => { if (editor) editor.set(c); else { o.code = c; const nv = codeView(c); view.replaceWith(nv); view = nv; } clearRun(); };
    function clearRun() { self.res = null; self.k = 0; self.parsed = null; self.flowEl = null; render(); }
    function showEditor(on) {
      if (!editor) return;
      if (on) { codeBox.replaceChildren(editor.el); bEdit.hidden = true; }
      else { view = codeView(editor.get()); codeBox.replaceChildren(view); bEdit.hidden = false; }
    }
    function prepare() {
      const code = self.getCode();
      warnEl.replaceChildren();
      try { self.parsed = E.parseProgram(code, { strictThen: !!o.strict }); }
      catch (e) {
        self.res = null; self.parseErr = e;
        msgEl.className = 'msg err'; msgEl.textContent = e.message;
        if (editor) editor.markErr(e.line); else if (view) view.mark(e.line, 'err');
        return false;
      }
      if (editor) editor.markErr(null);
      self.parseErr = null;
      self.res = E.run(self.parsed, { inputs: inp.value, vars: o.vars || {}, arrays: o.arrays || {} }, { maxSteps: o.maxSteps || 5000 });
      self.steps = []; self.res.events.forEach((e, i) => { if (SHOW.includes(e.k)) self.steps.push(i); });
      self.k = 0; self.flowEl = null;
      for (const w of self.parsed.warnings) warnEl.append(h('li', w.msg));
      if (editor) showEditor(false);
      if (!self.traceMode) self.traceMode = o.traceSpec && o.traceSpec.mode ? o.traceSpec.mode : (self.parsed.prog.some(E.isLoop) ? 'iter' : 'stmt');
      return true;
    }
    function snapAt(k) { if (k <= 0) return self.res.initSnap; return self.res.events[self.steps[k - 1]].snap; }
    function renderVars(snap, prev) {
      varsEl.replaceChildren();
      const names = Object.keys(snap.v);
      for (const n of names) {
        const v = E.fmt(snap.v[n]); const pv = prev && n in prev.v ? E.fmt(prev.v[n]) : null;
        const disp = typeof snap.v[n] === 'string' ? `"${v}"` : v;
        varsEl.append(h('div.var' + (pv !== v && self.k > 0 ? '.chg' : ''), h('b', n), h('span', disp)));
      }
      for (const [n, A] of Object.entries(snap.a)) {
        const ks = Object.keys(A).map(Number); const hi = ks.length ? Math.max(...ks) : 0; const PA = prev && prev.a[n];
        const cells = []; for (let i = 1; i <= hi; i++) { const v = A[i] === undefined ? '' : E.fmt(A[i]); const ch = self.k > 0 && (!PA || (PA[i] === undefined ? '' : E.fmt(PA[i])) !== v); cells.push(h('div' + (ch ? '.chg' : ''), h('span', v || ' '), h('small', String(i)))); }
        varsEl.append(h('div.arrv', h('b', n + '[]'), h('div.arrcells', cells)));
      }
      if (!names.length && !Object.keys(snap.a).length) varsEl.append(h('span.pts', '（未有變量）'));
    }
    function renderTrace(idx) {
      tBody.replaceChildren();
      if (!self.res) { tBody.append(h('p.pts', self.parseErr ? '程式有錯誤，未能產生追蹤表。' : '按「▶ 下一步」或「⏩ 執行到底」便會逐行填寫追蹤表。')); return; }
      const hasLoop = self.parsed.prog.some(E.isLoop);
      if (hasLoop) {
        const seg = h('div.seg', { role: 'group', 'aria-label': '追蹤表格式' }, [['stmt', '逐句'], ['iter', '每次循環一行']].map(([m, t]) => h('button', { type: 'button', 'aria-pressed': String(self.traceMode === m), onclick: () => { self.traceMode = m; renderTrace(idx); } }, t)));
        tBody.append(seg);
      }
      const evs = self.res.events.slice(0, idx);
      let tr;
      try { tr = E.buildTrace(Object.assign({}, self.res, { events: evs }), Object.assign({}, o.traceSpec || {}, { mode: hasLoop ? self.traceMode : 'stmt' })); }
      catch (e) { tBody.append(h('p.pts', e.message)); return; }
      const head = h('tr', h('th', tr.mode === 'stmt' ? '語句' : ''), tr.cols.map((c) => h('th', c.label)));
      const rows = tr.rows.slice(-200);
      const tb = h('tbody', rows.map((r, i) => h('tr' + (i === rows.length - 1 ? '.cur' : ''), h('td.lab' + (tr.mode === 'stmt' ? '' : '.t'), r.label), tr.cols.map((c) => { const cell = r.cells[c.key]; return h('td.v' + (cell.changed ? '' : '.same'), cell.v); }))));
      if (tr.rows.length > 200) tBody.append(h('p.pts', `只顯示最後 200 行（共 ${tr.rows.length} 行）。`));
      tBody.append(h('div.tracewrap', h('table.trace', h('thead', head), tb)));
      tBody.append(h('p.pts', '粗體＝這一步改變了的值；淡色＝沒有改變（考試時可以留空）。'));
      const wrap = tBody.querySelector('.tracewrap'); if (wrap) wrap.scrollTop = wrap.scrollHeight;
    }
    function renderFlow(upto) {
      if (!self.parsed) { fBody.replaceChildren(h('p.pts', self.parseErr ? '程式有錯誤，未能畫出流程圖。' : '按「▶ 下一步」後會畫出流程圖，並用顏色標示走過的路線（「畫鬼腳」）。')); return; }
      if (!self.flowEl) {
        let fc; try { fc = E.flowchart(self.parsed); } catch (e) { fBody.replaceChildren(h('p.pts', e.message)); return; }
        self.flowEl = h('div.flowwrap', { html: fc.svg });
        fBody.replaceChildren(self.flowEl, h('p.pts', '橙色＝已走過的路線；粗框＝現在這一步。'));
      }
      const st = self.res ? E.flowState(self.res.path, upto) : { nodes: new Set(), pairs: new Set(), cur: null };
      self.flowEl.querySelectorAll('.fc-node').forEach((g) => { const id = g.getAttribute('data-id'); g.classList.toggle('on', upto > 0 && st.nodes.has(id)); g.classList.toggle('cur', upto > 0 && st.cur === id); });
      self.flowEl.querySelectorAll('.fc-edge').forEach((p) => { const ks = (p.getAttribute('data-k') || '').split(' '); p.classList.toggle('on', upto > 0 && ks.some((k) => st.pairs.has(k))); });
      const cur = self.flowEl.querySelector('.fc-node.cur');
      if (cur && fDet.open && self.k > 0) { const box = self.flowEl, r = cur.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) box.scrollTop += r.top - b.top - b.height / 2; }
    }
    function render() {
      const locked = self.locked;
      bStep.disabled = bAll.disabled = locked; bReset.disabled = locked;
      if (locked) { msgEl.className = 'msg'; msgEl.textContent = lockMsg; stepInfo.textContent = ''; varsEl.replaceChildren(); outEl.textContent = ''; renderTraceSafe(0); renderFlowSafe(0); return; }
      if (!self.res) {
        stepInfo.textContent = '';
        if (!self.parseErr) { msgEl.className = 'msg'; msgEl.textContent = '按「▶ 下一步」逐步執行，或按「⏩ 執行到底」。'; }
        varsEl.replaceChildren(h('span.pts', '（未開始）')); outEl.textContent = '';
        if (view) view.mark(self.parseErr ? self.parseErr.line : null, 'err');
        renderTraceSafe(0); renderFlowSafe(0); bStep.disabled = false; return;
      }
      const k = self.k, n = self.steps.length;
      const ev = k > 0 ? self.res.events[self.steps[k - 1]] : null;
      stepInfo.textContent = `第 ${k} / ${n} 步`;
      renderVars(ev ? ev.snap : self.res.initSnap, k > 1 ? snapAt(k - 1) : self.res.initSnap);
      outEl.textContent = self.res.out.slice(0, ev ? ev.outN : 0).join('\n');
      if (!ev) { msgEl.className = 'msg'; msgEl.textContent = '準備好了。按「▶ 下一步」執行第一句。'; view && view.mark(null); }
      else if (ev.k === 'error') { msgEl.className = 'msg ' + (self.res.error.kind === 'loop' ? 'loop' : 'err'); msgEl.textContent = ev.desc; view && view.mark(ev.line, 'err'); }
      else if (ev.k === 'end') { msgEl.className = 'msg'; msgEl.textContent = '完成，算法已結束。'; view && view.mark(null); }
      else { msgEl.className = 'msg'; msgEl.textContent = ev.desc || ''; view && view.mark(ev.line); }
      bStep.disabled = k >= n;
      const idx = ev ? self.steps[k - 1] + 1 : 0;
      renderTraceSafe(idx); renderFlowSafe(ev ? ev.pathN : 0);
      if (o.onRender) o.onRender(self);
    }
    const renderTraceSafe = (i) => { if (!o.noTrace && tDet.open) renderTrace(i); else self._tPending = i; };
    const renderFlowSafe = (i) => { if (!o.noFlow && fDet.open) renderFlow(i); else self._fPending = i; };
    tDet.addEventListener('toggle', () => { if (tDet.open) renderTrace(self.res ? (self.k > 0 ? self.steps[self.k - 1] + 1 : 0) : 0); });
    fDet.addEventListener('toggle', () => { if (fDet.open) { if (!self.parsed && !self.locked && !self.parseErr) { try { self.parsed = E.parseProgram(self.getCode()); } catch (e) { /* 未執行 */ } } renderFlow(self.res && self.k > 0 ? self.res.events[self.steps[self.k - 1]].pathN : 0); } });
    bStep.onclick = () => { if (!self.res && !prepare()) { render(); return; } self.k = Math.min(self.k + 1, self.steps.length); render(); };
    bAll.onclick = () => { if (!self.res && !prepare()) { render(); return; } self.k = self.steps.length; render(); };
    bReset.onclick = () => { self.res = null; self.k = 0; self.parseErr = null; self.parsed = null; self.flowEl = null; if (editor) showEditor(true); msgEl.className = 'msg'; warnEl.replaceChildren(); render(); };
    bEdit.onclick = () => bReset.onclick();
    inp.addEventListener('change', () => { if (self.res) bReset.onclick(); });
    self.setLocked = (v) => { self.locked = v; render(); };
    self.runAll = () => bAll.onclick();
    self.render = render;
    // 未執行時先畫流程圖（只顯示結構）
    if ((o.open || []).includes('flow') && !o.locked) { try { self.parsed = E.parseProgram(self.getCode()); } catch (e) { /* 留待執行時報錯 */ } }
    render();
    if (self.parsed && !self.res) { try { const fc = E.flowchart(self.parsed); self.flowEl = h('div.flowwrap', { html: fc.svg }); fBody.replaceChildren(self.flowEl, h('p.pts', '按「▶ 下一步」後，橙色會標示走過的路線（「畫鬼腳」）。')); } catch (e) { /* 略 */ } }
    return self;
  }
  D1.Sim = Sim;

  // ---------------- 流程圖符號 ----------------
  function symbolSvg(kind, text) {
    const w = 150, hh = 40, x = 10, y = 6, W = w + 20, H = hh + 12, R = x + w, B = y + hh, cx = x + w / 2;
    let g;
    if (kind === 'term') g = `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${hh / 2}"/>`;
    else if (kind === 'proc') g = `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="2"/>`;
    else if (kind === 'io') g = `<polygon points="${x + 14},${y} ${R},${y} ${R - 14},${B} ${x},${B}"/>`;
    else if (kind === 'dec') g = `<polygon points="${cx},${y - 2} ${R},${y + hh / 2} ${cx},${B + 2} ${x},${y + hh / 2}"/>`;
    else g = `<rect x="${x}" y="${y}" width="${w}" height="${hh}"/><line x1="${x + 10}" y1="${y}" x2="${x + 10}" y2="${B}"/><line x1="${R - 10}" y1="${y}" x2="${R - 10}" y2="${B}"/>`;
    return `<svg class="fc" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><g class="fc-node fc-${kind}">${g}<text x="${cx}" y="${y + hh / 2}">${esc(text)}</text></g></svg>`;
  }
  D1.symbolSvg = symbolSvg;

  // ---------------- 答案計算 ----------------
  function runItem(it) {
    const res = E.run(it.code, { inputs: it.inputs || '', vars: it.vars || {}, arrays: it.arrays || {} });
    if (res.error && !it.allowError) throw new Error(`題目 ${it.id} 的偽代碼執行出錯：${res.error.message}`);
    return res;
  }
  function askAnswer(it, res) {
    res = res || runItem(it);
    const a = it.ask || 'out';
    if (a === 'out') return res.out.join(' ');
    if (a.var) return E.fmt(res.env.v[a.var]);
    if (a.vars) return a.vars.map((v) => E.fmt(res.env.v[v])).join(' ');
    if (a.value != null) return String(a.value);
    throw new Error('未知的 ask');
  }
  D1.askAnswer = askAnswer; D1.runItem = runItem;
  function correctIndex(it) {
    if (typeof it.answer === 'number') return it.answer;
    if (typeof it.answer === 'string' && /^[A-H]$/.test(it.answer)) return LET.indexOf(it.answer);
    const ans = askAnswer(it);
    const idx = it.options.map((op, i) => (E.same(op, ans) ? i : -1)).filter((i) => i >= 0);
    if (idx.length !== 1) throw new Error(`題目 ${it.id}：選項中有 ${idx.length} 個與引擎答案「${ans}」相同`);
    return idx[0];
  }
  D1.correctIndex = correctIndex;
  function fillAnswers(it) {
    let res = null;
    return it.blanks.map((b) => {
      if (b.ask && b.ask.value == null && !res) res = runItem(it);
      return b.ask ? askAnswer(Object.assign({}, it, { ask: b.ask }), res) : String(b.value);
    });
  }
  D1.fillAnswers = fillAnswers;
  function traceOf(it) { const res = runItem(it); return E.buildTrace(res, it.spec || {}); }
  D1.traceOf = traceOf;
  const subBlanks = (tpl, vals) => tpl.replace(/［(\d+)］/g, (_, n) => vals[Number(n) - 1]);
  D1.subBlanks = subBlanks;
  function outcome(code, t, chk) {
    let res;
    try { res = E.run(code, { inputs: t.inputs || '', vars: t.vars || {}, arrays: t.arrays || {} }, { maxSteps: 5000 }); }
    catch (e) { return { err: e.message }; }
    if (res.error) return { err: res.error.message, res };
    const o = { out: res.out, res };
    if (chk && chk.vars) o.vars = chk.vars.map((v) => (v in res.env.v ? E.fmt(res.env.v[v]) : res.env.a[v] ? E.fmt(res.env.a[v]) : '（未有值）'));
    return o;
  }
  D1.outcome = outcome;
  const sameVals = (a, b) => a.every((x, i) => E.same(x, b[i]));

  // ---------------- 元件：練習題／試 ----------------
  // ctx: {state, save(), award(id, pts, extra), teacher}
  function feedback(kind, title, extra) { return h('div.fb.' + kind, { role: 'status' }, h('b.v', title), extra ? (typeof extra === 'string' ? mdEl('div', extra) : extra) : null); }

  function optionList(it, name, onPick) {
    const opts = h('div.opts', { role: 'radiogroup' });
    it.options.forEach((op, i) => {
      const r = h('input', { type: 'radio', name, value: String(i) });
      const lab = h('label.opt', r, h('span.lt', LET[i] + '.'), mdEl('span', op));
      r.addEventListener('change', () => { opts.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel')); lab.classList.add('sel'); onPick(i); });
      opts.append(lab);
    });
    opts.lock = (sel, right) => { opts.querySelectorAll('input').forEach((x) => { x.disabled = true; }); opts.querySelectorAll('.opt').forEach((x, i) => { x.classList.add('locked'); if (i === right) x.classList.add('right'); else if (i === sel) x.classList.add('wrong'); }); };
    opts.pick = (i) => { const x = opts.querySelectorAll('input')[i]; if (x) { x.checked = true; x.dispatchEvent(new Event('change')); } };
    return opts;
  }
  const srcLine = (it) => (it.src ? h('div.tagrow', h('span', '出處：' + it.src)) : null);

  function renderTry(it, ctx) {
    const st = ctx.state.items[it.id] || {};
    const right = correctIndex(it);
    const box = h('div.blk.try-item', { 'data-id': it.id });
    box.append(h('div.row', h('span.pill.try', h('i', '試'), '先估後執行'), h('span.pts', `${it.pts} 分`), h('span.spacer'), it.src ? h('span.ref', it.src) : null));
    if (it.intro) box.append(mdEl('p', it.intro));
    box.append(mdEl('div.q', it.q));
    let pick = st.sel != null ? st.sel : null;
    const lockBtn = h('button.btn.primary', { type: 'button', disabled: pick == null || st.done }, '鎖定答案');
    const opts = optionList(it, 'r-' + it.id, (i) => { pick = i; lockBtn.disabled = false; });
    const fbBox = h('div');
    const sim = Sim({ code: it.code, inputs: it.inputs || '', vars: it.vars, arrays: it.arrays, locked: !st.done && !ctx.teacher, open: it.open || [], traceSpec: it.spec });
    sim.input.readOnly = !!it.fixedInputs;
    const done = (sel, fresh) => {
      opts.lock(sel, right);
      lockBtn.hidden = true;
      const good = sel === right;
      fbBox.replaceChildren(feedback(good ? 'good' : 'bad', good ? `估對了！${fresh ? `+${it.pts} 分` : ''}` : `估錯了。正確答案是 ${LET[right]}。`, (it.why ? it.why + '\n' : '') + '按「▶ 下一步」逐步執行，看看每一步變量怎樣改變。'));
      sim.setLocked(false);
    };
    lockBtn.onclick = () => {
      if (pick == null) return;
      const good = pick === right;
      ctx.award(it.id, good ? it.pts : 0, { sel: pick, done: true, kind: 'try' });
      done(pick, good);
    };
    box.append(opts, h('div.row', lockBtn), fbBox, sim.el);
    if (st.done) { opts.pick(st.sel); done(st.sel, false); }
    if (ctx.teacher) box.append(h('div.ans', `答案：${LET[right]}（${it.options[right]}）`));
    return box;
  }
  D1.renderTry = renderTry;

  // 練習：答對全分；看答案 1 分；答錯兩次出提示
  function practiceShell(it, ctx, body, checkFn, showFn, restore) {
    const st = ctx.state.items[it.id] || {};
    const box = h('div.blk.prac-item', { 'data-id': it.id });
    box.append(h('div.row', h('span.pill.prac', h('i', '練'), it.label || '自動批改'), h('span.pts', `${it.pts} 分`), h('span.spacer'), it.src ? h('span.ref', it.src) : null));
    if (it.fix) box.append(h('p.fixnote', it.fix));
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
      if (r.ok) {
        ctx.award(it.id, it.pts, { done: true, tries: tries + 1, kind: 'prac', val: r.val });
        fb.replaceChildren(feedback('good', `答對了！+${it.pts} 分`, it.why || null)); finish('ok');
      } else {
        tries++; ctx.award(it.id, 0, { tries, kind: 'prac', val: r.val });
        const hint = tries >= 2 ? (it.hint || '用模擬器逐步執行，或重看上面的重點。') : null;
        fb.replaceChildren(feedback('bad', `未對${tries >= 2 ? `（已答錯 ${tries} 次）` : '，再想想'}。`, h('div', r.msg ? mdEl('div', r.msg) : null, hint ? mdEl('div', '提示：' + hint) : null)));
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
    const body = h('div', mdEl('div.q', it.q), it.code ? codeView(it.code) : null, it.inputsNote ? mdEl('p.pts', it.inputsNote) : null, opts);
    return practiceShell(it, ctx, body,
      () => (pick == null ? { incomplete: '請先選一個答案。' } : { ok: pick === right, val: pick, msg: it.wrong && it.wrong[pick] ? it.wrong[pick] : null }),
      (peek) => { if (peek) return `${LET[right]}. ${it.options[right]}`; opts.lock(pick, right); },
      (st) => { if (st.val != null) opts.pick(st.val); opts.lock(st.val, right); });
  }
  function renderFill(it, ctx) {
    const answers = fillAnswers(it);
    const inputs = it.blanks.map((b, i) => h('input.txt', { type: 'text', 'aria-label': b.label, autocomplete: 'off', spellcheck: 'false', 'data-i': i }));
    const body = h('div', mdEl('div.q', it.q), it.code ? codeView(it.code) : null, it.inputs ? mdEl('p.pts', `輸入數據：\`${it.inputs}\``) : null,
      h('div', { style: { display: 'grid', gap: '8px' } }, it.blanks.map((b, i) => h('label.row', h('span', b.label), inputs[i]))));
    const accept = (i, v) => E.same(v, answers[i]) || (it.blanks[i].accept || []).some((a) => E.same(v, a));
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
    const tr = traceOf(it);
    const cells = [];
    const table = h('table.trace', h('thead', h('tr', h('th', tr.mode === 'stmt' ? '語句' : ''), tr.cols.map((c) => h('th', c.label)))),
      h('tbody', tr.rows.map((r, ri) => h('tr', h('td.lab' + (tr.mode === 'stmt' ? '' : '.t'), r.label), tr.cols.map((c) => {
        const cell = r.cells[c.key];
        const inp = h('input.cell' + (c.kind === 'out' || c.kind === 'cond' || c.kind === 'loopcond' || c.kind === 'ifcond' ? '.wide' : ''), { type: 'text', 'aria-label': `${r.label}：${c.label}`, autocomplete: 'off', spellcheck: 'false' });
        cells.push({ inp, cell, ri, key: c.key }); return h('td', inp);
      })))));
    const body = h('div', mdEl('div.q', it.q || '空運行以下算法，完成追蹤表（只需填寫改變了的值；沒有改變的格可以留空）。'), codeView(it.code), it.inputs ? mdEl('p.pts', `輸入數據：\`${it.inputs}\``) : null, h('div.tracewrap', table));
    return practiceShell(it, ctx, body,
      () => {
        let all = true, filled = 0;
        for (const c of cells) {
          const v = c.inp.value.trim(); if (v) filled++;
          const g = c.cell.changed ? E.same(v, c.cell.v) : (v === '' || E.same(v, c.cell.v));
          c.inp.classList.toggle('ok', g && v !== ''); c.inp.classList.toggle('no', !g); if (!g) all = false;
        }
        if (!filled) return { incomplete: '請先填寫追蹤表。' };
        return { ok: all, val: cells.map((c) => c.inp.value.trim()), msg: all ? null : '紅色格未對。' };
      },
      (peek) => { if (peek) return '見追蹤表（已自動填上）'; cells.forEach((c) => { c.inp.value = c.cell.changed ? c.cell.v : ''; c.inp.readOnly = true; c.inp.classList.remove('no'); }); },
      (st) => { if (st.val) cells.forEach((c, i) => { c.inp.value = st.val[i] || ''; c.inp.readOnly = true; }); });
  }
  function renderComplete(it, ctx) {
    const blanks = {};
    const view = codeView(it.template, { blanks });
    const n = Object.keys(blanks).length;
    const refCode = subBlanks(it.template, it.ref);
    const refs = it.tests.map((t) => outcome(refCode, t, it.check));
    refs.forEach((r, i) => { if (r.err) throw new Error(`題目 ${it.id} 參考答案第 ${i + 1} 組出錯：${r.err}`); });
    const body = h('div', mdEl('div.q', it.q), view, h('p.pts', `會用 ${it.tests.length} 組數據測試：` + it.tests.map((t) => t.inputs ? `輸入 ${t.inputs}` : '（沒有輸入）').join('；')));
    const vals = () => Array.from({ length: n }, (_, i) => (blanks[i + 1].value || '').trim());
    return practiceShell(it, ctx, body,
      () => {
        const v = vals(); if (v.some((x) => !x)) return { incomplete: '請填寫所有空格。' };
        const code = subBlanks(it.template, v);
        for (let i = 0; i < it.tests.length; i++) {
          const got = outcome(code, it.tests[i], it.check), exp = refs[i];
          const inTxt = it.tests[i].inputs ? `輸入 ${it.tests[i].inputs}` : '這組數據';
          if (got.err) return { ok: false, val: v, msg: `${inTxt}：執行出錯——${got.err}` };
          if (it.check && it.check.vars) { if (!sameVals(got.vars, exp.vars)) return { ok: false, val: v, msg: `${inTxt}：期望最後 ${it.check.vars.map((x, j) => `${x} = ${exp.vars[j]}`).join('、')}；你的算法得到 ${it.check.vars.map((x, j) => `${x} = ${got.vars[j]}`).join('、')}` }; }
          if (!E.sameOutput(got.out, exp.out)) return { ok: false, val: v, msg: `${inTxt}：期望輸出「${exp.out.join(' / ')}」，你的算法輸出「${got.out.join(' / ') || '（沒有輸出）'}」` };
        }
        return { ok: true, val: v };
      },
      (peek) => { if (peek) return it.ref.map((r, i) => `［${i + 1}］${r}`).join('；'); for (let i = 1; i <= n; i++) { blanks[i].value = it.ref[i - 1]; blanks[i].readOnly = true; } },
      (st) => { if (st.val) for (let i = 1; i <= n; i++) { blanks[i].value = st.val[i - 1] || ''; blanks[i].readOnly = true; } });
  }
  const PRAC = { mc: renderMC, fill: renderFill, trace: renderTraceItem, complete: renderComplete };
  D1.renderPractice = (it, ctx) => PRAC[it.type](it, ctx);

  // ---------------- 寫算法 ----------------
  function checkWrite(task, code) {
    const res = [];
    let parsed;
    try { parsed = E.parseProgram(code); } catch (e) { return { ok: false, parseErr: e.message, line: e.line, list: [] }; }
    const norm = code.split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean);
    for (const r of task.rules || []) {
      const re = new RegExp(r.re);
      const hit = norm.some((l) => re.test(l));
      if (r.must !== false ? !hit : hit) return { ok: false, ruleMsg: r.msg, list: [] };
    }
    let all = true;
    task.tests.forEach((t, i) => {
      const exp = outcome(task.ref, t, task.check), got = outcome(parsed, t, task.check);
      const inTxt = t.inputs ? `輸入 ${t.inputs}` : '沒有輸入';
      let ok = true, msg = '';
      if (got.err) { ok = false; msg = `執行出錯——${got.err}`; }
      else {
        if (task.check && task.check.vars && !sameVals(got.vars, exp.vars)) { ok = false; msg = `期望最後 ${task.check.vars.map((x, j) => `${x} = ${exp.vars[j]}`).join('、')}；你的程式最後 ${task.check.vars.map((x, j) => `${x} = ${got.vars[j]}`).join('、')}`; }
        if (ok && (!task.check || task.check.out !== false) && !E.sameOutput(got.out, exp.out)) { ok = false; msg = `期望輸出「${exp.out.join(' / ')}」，你的輸出「${got.out.join(' / ') || '（沒有輸出）'}」`; }
      }
      if (!ok) all = false;
      res.push({ i, ok, msg, inTxt });
    });
    return { ok: all, list: res, warnings: parsed.warnings };
  }
  D1.checkWrite = checkWrite;
  function renderWrite(task, ctx) {
    const st = ctx.state.items[task.id] || {};
    const draft = (ctx.state.drafts || {})[task.id];
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', h('span.badge', task.tier), task.title), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.prompt));
    const shown = task.tests.filter((t) => t.show);
    if (shown.length) {
      box.append(h('div.scroll', h('table.tb', h('thead', h('tr', h('th', '例子：輸入'), h('th', '期望輸出'))), h('tbody', shown.map((t) => { const r = outcome(task.ref, t, task.check); return h('tr', h('td', h('code', t.inputs || '（沒有）')), h('td', h('code', r.out.join(' / ')))); })))));
    }
    const hidden = task.tests.length - shown.length;
    box.append(h('p.pts', `提交後會用 ${task.tests.length} 組數據自動評核${hidden ? `（其中 ${hidden} 組不公開）` : ''}。`));
    const sim = Sim({ code: draft != null ? draft : task.starter || '', editable: true, inputs: (shown[0] || task.tests[0]).inputs || '', open: [] });
    if (sim.editor) sim.editor.ta.addEventListener('input', () => { ctx.state.drafts = ctx.state.drafts || {}; ctx.state.drafts[task.id] = sim.getCode(); ctx.save(); });
    const bSubmit = h('button.btn.primary', { type: 'button' }, '提交評核');
    const bRef = h('button.btn.ghost', { type: 'button', hidden: !((st.tries || 0) >= 2) || st.done }, '看參考答案（只得 1 分）');
    const fb = h('div', { 'aria-live': 'polite' });
    box.append(sim.el, h('div.row', bSubmit, bRef), fb);
    let tries = st.tries || 0;
    const showRef = () => { fb.append(h('div.note', h('b', '參考答案'), codeView(task.ref))); };
    const lockDone = () => { bSubmit.disabled = true; bRef.hidden = true; };
    bSubmit.onclick = () => {
      const code = sim.getCode();
      if (!code.trim()) { fb.replaceChildren(feedback('info', '請先在編輯器寫偽代碼。')); return; }
      const r = checkWrite(task, code);
      if (r.ok) {
        ctx.award(task.id, task.pts, { done: true, tries: tries + 1, kind: 'write', code });
        fb.replaceChildren(feedback('good', `全部 ${task.tests.length} 組數據通過！+${task.pts} 分`, h('ul.tests', r.list.map((x) => h('li.pass', h('b', `第 ${x.i + 1} 組`), `${x.inTxt}：通過 ✓`)))));
        lockDone(); return;
      }
      tries++; ctx.award(task.id, 0, { tries, kind: 'write', code });
      const parts = [];
      if (r.parseErr) { parts.push(h('p', '程式有語法錯誤：' + r.parseErr)); sim.editor.markErr(r.line); }
      else if (r.ruleMsg) parts.push(h('p', r.ruleMsg));
      else parts.push(h('ul.tests', r.list.map((x) => h('li.' + (x.ok ? 'pass' : 'fail'), h('b', `第 ${x.i + 1} 組`), `${x.inTxt}：${x.ok ? '通過 ✓' : '不通過 ✗ ' + x.msg}`))));
      if (tries >= 2 && task.hint) parts.push(mdEl('p', '提示：' + task.hint));
      fb.replaceChildren(feedback('bad', `未通過（第 ${tries} 次提交）。`, h('div', parts)));
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
  D1.renderWrite = renderWrite;

  // ---------------- 分析題（表格；u1、u2、u4） ----------------
  // task: {kind:'table', head:[...], rows:[[cell...]], opts:{key:[...]}}；cell 是字串（固定）、{sel:key, a}（下拉）或 {text:true, a, accept:[]}（填寫）
  const isIn = (c) => c && typeof c === 'object' && ('sel' in c || 'text' in c);
  function tableAnswers(task) { const out = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) out.push(String(c.a)); })); return out; }
  D1.tableAnswers = tableAnswers;
  function checkTableVals(task, vals) {
    const ins = []; task.rows.forEach((r) => r.forEach((c) => { if (isIn(c)) ins.push(c); }));
    return ins.map((c, i) => { const v = (vals[i] || '').trim(); return c.sel ? v === String(c.a) : (E.same(v, c.a) || (c.accept || []).some((x) => E.same(v, x))); });
  }
  D1.checkTableVals = checkTableVals;
  function renderTableTask(task, ctx) {
    const st = ctx.state.items[task.id] || {};
    const box = h('div.blk.write-item', { 'data-id': task.id });
    box.append(h('div.row', h('span.tier', h('span.badge', task.tier), task.title), h('span.pts', `${task.pts} 分`), h('span.spacer'), task.src ? h('span.ref', task.src) : null));
    box.append(mdEl('div.q', task.prompt));
    if (task.code) box.append(codeView(task.code));
    const ctrls = [];
    const body = h('tbody', task.rows.map((r) => h('tr', r.map((c, ci) => {
      if (!isIn(c)) return mdEl('td', String(c), ci ? { 'data-label': task.head[ci] } : { class: 'rowhead' });
      let el;
      const lab = `${String(r[0]).replace(/[`*]/g, '')}：${task.head[ci]}`;
      if (c.sel) el = h('select.cellsel', { 'aria-label': lab }, h('option', { value: '' }, '（請選擇）'), task.opts[c.sel].map((o) => h('option', { value: o }, o)));
      else el = h('input.txt', { type: 'text', 'aria-label': lab, autocomplete: 'off', spellcheck: 'false' });
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
    if (st.done) {
      lockDone();
      if (st.shown) { fillAns(); fb.replaceChildren(feedback('info', '已顯示答案（這題得 1 分）。', task.why || null)); }
      else { ctrls.forEach((el, i) => { el.value = (st.val || ans)[i]; el.classList.add('ok'); }); fb.replaceChildren(feedback('good', '已全部答對。', task.why || null)); }
    }
    if (ctx.teacher) box.append(h('div.ans', h('b', '老師：'), ' ', tableAnswerText(task)));
    return box;
  }
  function tableAnswerText(task) { return task.rows.map((r) => r.map((c) => (isIn(c) ? c.a : String(c).replace(/[`*]/g, ''))).join('｜')).join('；'); }
  D1.tableAnswerText = tableAnswerText;
  D1.renderTableTask = renderTableTask;
  // 變量命名規則（教科書 p.36）：只可用英文字母、數字、下劃線；不能以數字開首
  D1.validName = (s) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);

  // ---------------- 小測 ----------------
  function quizTags(it) {
    const row = h('div.tagrow');
    for (const t of it.tags || []) row.append(h('span.tag.' + (t.t === 'hot' ? 'hot' : 'trap'), t.t === 'hot' ? '常考' : '易錯'));
    if (it.src) row.append(h('span', '出處：' + it.src));
    return row;
  }
  function renderQuiz(sec, ctx) {
    const qs = ctx.state.quiz = ctx.state.quiz || { ans: {}, submitted: false };
    const box = h('div.blk');
    const hasCode = sec.items.some((it) => it.code);
    box.append(h('p.note', `共 ${sec.items.length} 題，每題 ${sec.items[0].pts} 分。${hasCode ? '這部分不能用模擬器，請自己空運行（可以在紙上畫追蹤表）。' : ''}全部答完才可提交，提交後不能再改。`));
    const lists = [];
    sec.items.forEach((it, qi) => {
      const right = correctIndex(it);
      const opts = optionList(it, 'q-' + it.id, (i) => { qs.ans[it.id] = i; ctx.save(); upd(); });
      lists.push({ it, opts, right });
      const qb = h('div.blk', { 'data-id': it.id }, h('div.row', h('b', `第 ${qi + 1} 題`), h('span.pts', `${it.pts} 分`)), quizTags(it), mdEl('div.q', it.q), it.code ? codeView(it.code) : null, it.table ? tableEl(it.table) : null, opts);
      qb.fbSlot = h('div'); qb.append(qb.fbSlot); lists[qi].qb = qb;
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
  function tableEl(t) { return h('div.scroll', h('table.tb', t.head ? h('thead', h('tr', t.head.map((x) => mdEl('th', x)))) : null, h('tbody', t.rows.map((r) => h('tr', r.map((x) => mdEl('td', String(x)))))))); }
  D1.tableEl = tableEl;

  // ---------------- 無限練習（隨機生成，答案由引擎計算） ----------------
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const GENS = (D1.GENS = D1.GENS || {});
  GENS.seq = () => {
    const V = pick([['A', 'B', 'C'], ['X', 'Y', 'Z'], ['P', 'Q', 'R']]);
    const n = R(2, 3), used = V.slice(0, n), L = [];
    used.forEach((v) => L.push(`${v} ← ${R(1, 9)}`));
    const k = R(2, 4);
    for (let i = 0; i < k; i++) {
      const t = pick(V.slice(0, Math.min(3, n + 1))), a = pick(used), op = pick(['+', '-', '*', '+', '-']);
      const b = Math.random() < 0.5 ? pick(used) : String(R(1, 5));
      L.push(`${t} ← ${a} ${op} ${b}`); if (!used.includes(t)) used.push(t);
    }
    const outs = used.slice().sort(() => Math.random() - 0.5).slice(0, R(1, Math.min(3, used.length)));
    L.push(`輸出 ${outs.join(', ')}`);
    return { code: L.join('\n'), q: '空運行以下算法，輸出是什麼？（多個值用空格分隔）', type: '序列賦值' };
  };
  GENS.swap = () => {
    const a = R(1, 20); let b = R(1, 20); if (b === a) b = a + 3;
    const ways = [
      ['temp ← X', 'X ← Y', 'Y ← temp'], ['X ← Y', 'Y ← X'], ['temp ← X', 'Y ← X', 'X ← temp'], ['temp ← Y', 'Y ← X', 'X ← temp'], ['Y ← X', 'X ← Y'], ['temp ← X', 'X ← Y', 'Y ← X'],
    ];
    return { code: [`X ← ${a}`, `Y ← ${b}`, ...pick(ways), '輸出 X, Y'].join('\n'), q: '以下算法嘗試交換 X 和 Y 的值。輸出是什麼？', type: '交換變量' };
  };
  GENS.inout = () => {
    const x = R(2, 12), y = R(2, 9);
    const f = pick([['C ← A * B', 'A ← A + 1', '輸出 A, C'], ['C ← A + B', 'B ← C - B', '輸出 B, C'], ['A ← A + B', 'B ← A - B', 'A ← A - B', '輸出 A, B'], ['C ← (A + B) / 2', '輸出 C']]);
    return { code: ['輸入 A, B', ...f].join('\n'), inputs: `${x}, ${y}`, q: `輸入數據是 ${x}, ${y}。輸出是什麼？`, type: '輸入與運算' };
  };
  // ---- 單元 4：數據類型、命名規則 ----
  const DTYPE_LIT = [['288', '整數'], ['-101', '整數'], ['0', '整數'], ['56.5', '實數'], ['-30.0', '實數'], ['0.05', '實數'], ['-0.382', '實數'], ["'a'", '字符'], ["'B'", '字符'], ["'8'", '字符'], ["'%'", '字符'], ['True', '布爾'], ['False', '布爾'], ['"abc"', '字串'], ['"0011"', '字串'], ['"P%ssword123"', '字串'], ['"I go to school by bus."', '字串']];
  const DTYPE_CTX = [['班上的學生人數', '整數', '人數只會是整數。'], ['捐獻人數', '整數', '人數只會是整數。（p.44 例題 2.3）'], ['善款數字（例如 65000.5）', '實數', '金額有小數。（p.44 例題 2.3）'], ['身高（以 m 為單位）', '實數', '身高有小數。'], ['體重（以 kg 為單位）', '實數', '體重有小數。（p.43 變量分析表）'], ['三次測驗的平均分', '實數', '平均分可能有小數。（p.46 例題 2.4）'], ['電話號碼', '字串', '電話號碼不用作運算，又可能有 (852)、+852。（p.43 提示）'], ['電郵地址', '字串', '文字資料。（p.44 測試站 2.2）'], ['會員姓名', '字串', '文字資料。'], ['會長的話（例如「新年快樂!」）', '字串', '文字資料。（p.44 例題 2.3）'], ['年齡組別（例如「20-39歲」）', '字串', '以範圍記錄，不是一個數字。（p.44 試想想）'], ['是否同意接收廣告', '布爾', '只有兩個可能性。（p.44 測試站 2.2）'], ['是否已交功課', '布爾', '只有「是」「否」兩個可能性。'], ['網站評分（1 至 5 顆星）', '整數', '評分是整數。（p.44 測試站 2.2）'], ['考試等級（A、B 或 F，一個字母）', '字符', '只有一個字母。'], ['性別（M 或 F）', '字符', '只有一個字母。']];
  const DT_OPTS = ['整數', '實數', '字符', '字串', '布爾'];
  GENS.dtype = () => {
    if (Math.random() < 0.45) { const [v, a] = pick(DTYPE_LIT); return { options: DT_OPTS, ans: a, q: `數據 \`${v}\` 屬於哪一種數據類型？`, type: '數據類型', why: '參考教科書 p.42 表 2.5：整數（沒有小數）、實數（有小數點）、字符（單引號內一個字符）、布爾（True／False）、字串（雙引號內的文字）。' }; }
    const [d, a, w] = pick(DTYPE_CTX);
    return { options: DT_OPTS, ans: a, q: `要儲存「${d}」，最合適的數據類型是什麼？`, type: '選擇數據類型', why: w };
  };
  const NM_OK = ['number1', 'numberOne', 'new_number', 'newNumber', 'sum_of_scores', 'sumOfScores', '_total', 'avg_mark', 'test2', 'PI', 'bmi', 'Bmi', 'x1y2', 'MAX_SIZE'];
  const NM_BAD = ['1number', '2total', 'new number', 'newnumber!', 'total$', '#count', 'avg-mark', 'my score', '3D', 'price%', 'e@mail', 'test 1'];
  GENS.name = () => {
    const ok = Math.random() < 0.5; const n = pick(ok ? NM_OK : NM_BAD);
    if (D1.validName(n) !== ok) throw new Error('命名題資料錯誤：' + n);
    const why = ok ? '只用了英文字母、數字或下劃線，而且不是以數字開首。' : /^[0-9]/.test(n) ? '不能以數字開首（規則 1）。' : '含有空白格或其他符號，只可用英文字母、數字和下劃線（規則 2）。';
    return { options: ['符合規則', '不符合規則'], ans: ok ? '符合規則' : '不符合規則', q: `變量名稱 \`${n}\` 是否符合命名規則？（教科書 p.36）`, type: '變量命名', why };
  };
  GENS.circle = () => {
    const r = R(1, 12); const f = pick([['area ← PI * r * r', '輸出 area'], ['c ← 2 * PI * r', '輸出 c']]);
    return { code: ['PI ← 3.14', `r ← ${r}`, ...f].join('\n'), q: '常數 PI 取 3.14。輸出是什麼？', type: '常數與運算' };
  };
  // ---- 單元 5：選擇 ----
  GENS.relop = () => {
    const v = pick(['mark', 'age', 'A', 'X']), x = R(1, 9) * 10 + pick([0, 0, 5]), k = pick([x, x, x - 5, x + 5]);
    const op = pick(['=', '<', '<=', '>', '>=', '<>', '!=']);
    return { code: [`${v} ← ${x}`, `輸出 ${v} ${op} ${k}`].join('\n'), q: '輸出是 True 還是 False？', type: '關係運算符' };
  };
  GENS.ifelse = () => {
    const a = R(1, 30), b = R(1, 30), op = pick(['>', '>=', '<', '<=', '=', '<>']);
    const t = pick([[`A ← A - B`, '輸出 A'], ['輸出 "Yes"'], [`B ← A + B`, '輸出 B']]), e = pick([[`A ← A + B`, '輸出 A'], ['輸出 "No"'], [`B ← B * 2`, '輸出 B']]);
    const L = [`A ← ${a}`, `B ← ${b}`, `如果 A ${op} B 則`, ...t.map((s) => '    ' + s), '否則', ...e.map((s) => '    ' + s)];
    if (Math.random() < 0.4) L.push('輸出 A + B');
    return { code: L.join('\n'), q: '空運行以下算法，輸出是什麼？（多個值用空格分隔）', type: '如果…則…否則' };
  };
  GENS.grade = () => {
    const c = pick([[90, 80, 70, 60, 50], [85, 50], [80, 65, 50], [75, 60, 40]]), L = 'ABCDE';
    const nest = Math.random() < 0.5, m = R(0, 100);
    const lines = ['輸入 mark'];
    if (nest) {
      c.forEach((v, i) => { const ind = '    '.repeat(i); lines.push(`${ind}${i ? '' : ''}如果 mark >= ${v} 則`, `${ind}    grade ← "${L[i]}"`, `${ind}否則`); });
      lines.push(`${'    '.repeat(c.length)}grade ← "F"`);
    } else {
      c.forEach((v, i) => { lines.push(`${i ? '否則如果' : '如果'} mark >= ${v} 則`, `    grade ← "${L[i]}"`); });
      lines.push('否則', '    grade ← "F"');
    }
    lines.push('輸出 grade');
    return { code: lines.join('\n'), inputs: String(m), q: `輸入 mark 為 ${m}，輸出是什麼？`, type: nest ? '嵌套條件語句' : '如果…否則如果' };
  };
  GENS.nested = () => {
    const x = R(2, 20), y = R(2, 20), k = R(10, 35), m = pick([2, 3]);
    const L = [`X ← ${x}`, `Y ← ${y}`, `如果 X + Y > ${k} 則`, `    如果 Y > X * ${m} 則`, '        Y ← X', '    否則', '        X ← Y', '否則', `    Y ← X - ${R(1, 5)}`, pick(['輸出 X', '輸出 Y', '輸出 X, Y'])];
    return { code: L.join('\n'), q: '空運行以下算法，輸出是什麼？（參考教科書 p.58 例題 2.5）', type: '嵌套條件語句' };
  };
  function renderEndless(sec, ctx) {
    const es = ctx.state.endless = ctx.state.endless || { n: 0, right: 0 };
    const box = h('div.blk');
    const stat = h('p.pts');
    const area = h('div.blk');
    const updStat = () => { stat.textContent = `已做 ${es.n} 題，答對 ${es.right} 題（不計分，會寫進報告）。`; };
    let lastType = null;
    function next() {
      let g = GENS[pick(sec.gens)]();
      for (let k = 0; k < 4 && sec.gens.length > 1 && g.type === lastType; k++) g = GENS[pick(sec.gens)]();
      lastType = g.type;
      if (g.options) return nextOpt(g);
      const res = E.run(g.code, { inputs: g.inputs || '' });
      if (res.error) return next();
      const ans = res.out.join(' ');
      const inp = h('input.txt', { type: 'text', 'aria-label': '你的答案', autocomplete: 'off', spellcheck: 'false' });
      const fb = h('div', { 'aria-live': 'polite' });
      const bChk = h('button.btn.primary', { type: 'button' }, '核對');
      const bNext = h('button.btn', { type: 'button' }, '再練一題');
      const simSlot = h('div');
      let answered = false;
      bChk.onclick = () => {
        if (answered || !inp.value.trim()) return;
        answered = true; const ok = E.same(inp.value, ans); es.n++; if (ok) es.right++; ctx.save(); updStat();
        inp.classList.add(ok ? 'ok' : 'no'); inp.readOnly = true; bChk.disabled = true;
        fb.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對了！' : `未對。答案是「${ans}」。`, '可以用下面的模擬器逐步執行核對。'));
        simSlot.replaceChildren(Sim({ code: g.code, inputs: g.inputs || '', open: ['trace'] }).el);
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') bChk.onclick(); });
      bNext.onclick = next;
      area.replaceChildren(h('div.row', h('span.pill.prac', h('i', '∞'), g.type)), mdEl('div.q', g.q), codeView(g.code), h('div.row', inp, bChk, bNext), fb, simSlot);
    }
    // 選項題（答案由生成器按教科書規則計算，例如命名規則）
    function nextOpt(g) {
      let sel = null, answered = false;
      const fb = h('div', { 'aria-live': 'polite' });
      const bChk = h('button.btn.primary', { type: 'button', disabled: true }, '核對');
      const bNext = h('button.btn', { type: 'button', onclick: next }, '再練一題');
      const btns = g.options.map((o) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { if (answered) return; sel = o; btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn(o)))); bChk.disabled = false; } }, o));
      const btn = (o) => btns[g.options.indexOf(o)];
      bChk.onclick = () => {
        if (answered || sel == null) return;
        answered = true; const ok = sel === g.ans; es.n++; if (ok) es.right++; ctx.save(); updStat();
        btn(sel).classList.add(ok ? 'ok' : 'no'); if (!ok) btn(g.ans).classList.add('ok'); bChk.disabled = true;
        fb.replaceChildren(feedback(ok ? 'good' : 'bad', ok ? '答對了！' : `未對。答案是「${g.ans}」。`, g.why || null));
      };
      area.replaceChildren(h('div.row', h('span.pill.prac', h('i', '∞'), g.type)), ...[mdEl('div.q', g.q), g.code ? codeView(g.code) : null].filter(Boolean), h('div.endopts', { role: 'group', 'aria-label': '選項' }, btns), h('div.row', bChk, bNext), fb);
    }
    if (!sec.intro) box.append(mdEl('p', '按教科書題型隨機生成，答案由模擬器計算。想練多少就練多少。'));
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
      else if (b.warn) box.append(mdEl('div.warnbox', b.warn));
      else if (b.fix) box.append(h('p.fixnote', b.fix));
      else if (b.table) { box.append(tableEl(b.table)); if (b.cap) box.append(h('p.cap', b.cap)); }
      else if (b.code) { if (b.cap) box.append(h('p.cap', b.cap)); box.append(codeView(b.code)); }
      else if (b.sim) { if (b.cap) box.append(mdEl('p', b.cap)); box.append(Sim(b.sim).el); }
      else if (b.symbols) box.append(h('div.symgrid', b.symbols.map((s) => h('div.sym', h('div', { html: symbolSvg(s.kind, s.text) }), h('b', s.name), mdEl('span', s.desc)))));
    }
    return box;
  }

  // ---------------- 單元頁 ----------------
  D1.unit = function (U) {
    D1._unit = U;
    const KEY = `d1:${U.id}:v1`;
    const blank = () => ({ reg: null, sec: 0, visited: [0], items: {}, drafts: {}, quiz: { ans: {}, submitted: false }, endless: { n: 0, right: 0 }, started: new Date().toISOString() });
    let S = Object.assign(blank(), store.get(KEY) || {});
    let teacher = false;
    const save = () => store.set(KEY, S);
    const app = document.getElementById('app');
    // 每項分數類別
    const allItems = [];
    for (const sec of U.sections) {
      (sec.tries || []).forEach((it) => allItems.push({ id: it.id, cat: 'try', pts: it.pts, sec: sec.id }));
      (sec.practice || []).forEach((it) => allItems.push({ id: it.id, cat: 'prac', pts: it.pts, sec: sec.id }));
      (sec.tasks || []).forEach((it) => allItems.push({ id: it.id, cat: 'write', pts: it.pts, sec: sec.id }));
      (sec.items || []).forEach((it) => allItems.push({ id: it.id, cat: 'quiz', pts: it.pts, sec: sec.id }));
    }
    const CATS = { try: '試', prac: '練', write: U.writeLabel || '寫算法', quiz: '小測' };
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
    // 頁首
    const scoreB = h('b'); const whoEl = h('div.who');
    const head = h('header.top', h('div.brand', h('span.kicker', `HKDSE ICT · 必修 D1 · ${U.id.toUpperCase()}`), h('h1', U.title), h('span.pages', U.book)), h('div', { style: { display: 'grid', gap: '6px', justifyItems: 'end' } }, h('div.scorebox', scoreB, h('span', `/ ${MAX} 分`)), whoEl));
    const progList = h('ol'); const progBar = h('i');
    const prog = h('nav.prog', { 'aria-label': '單元進度' }, progList, h('div.bar', progBar));
    const main = h('main', { id: 'main' });
    const tBar = h('div.teacherbar', { hidden: true }, '老師模式：可跳到任何一節，答案會顯示在題目下面。報告會註明「老師模式」。');
    const pinIn = h('input', { type: 'password', 'aria-label': '老師 PIN', size: 10, style: { fontSize: '14px', padding: '2px 6px' } });
    const pinMsg = h('span');
    const pinBox = h('span.row', { hidden: true }, pinIn, h('button.iconbtn', { type: 'button', onclick: tryPin }, '確定'), pinMsg);
    const foot = h('footer', h('span', '頁面在瀏覽器內運行，進度只儲存在這部裝置。'), store.ok ? null : h('b', { style: { color: 'var(--bad)' } }, '注意：這個瀏覽器不能儲存進度（例如私密模式），離開頁面後進度會消失。'), h('span.spacer'), themeBtn(), h('button.iconbtn', { type: 'button', onclick: () => { pinBox.hidden = !pinBox.hidden; if (!pinBox.hidden) pinIn.focus(); } }, '老師'), pinBox);
    function tryPin() {
      if (pinIn.value === PIN) { teacher = true; tBar.hidden = false; pinBox.hidden = true; pinMsg.textContent = ''; render(); }
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
      progBar.style.width = `${Math.round((100 * got()) / MAX)}%`;
      const cur = progList.querySelector('[aria-current]'); if (cur && cur.scrollIntoView && progList.scrollWidth > progList.clientWidth) { const l = cur.offsetLeft - progList.offsetLeft; progList.scrollLeft = Math.max(0, l - 40); }
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
      if (sec.intro) card.append(mdEl('p', sec.intro));
      if (sec.learn) card.append(renderLearn(sec.learn));
      for (const it of sec.tries || []) card.append(renderTry(it, ctx));
      for (const it of sec.practice || []) card.append(D1.renderPractice(it, ctx));
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
      const rep = { app: 'D1自學平台', unit: U.id, title: U.title, ver: 1, cls: S.reg.cls, no: S.reg.no, name: S.reg.name, score: got(), max: MAX, parts, items, endless: { n: S.endless.n, right: S.endless.right }, teacher, started: S.started, time: new Date().toISOString() };
      rep.sig = D1.signReport(rep, U.key);
      return rep;
    }
    function reportText(rep) {
      const p = Object.entries(rep.parts).map(([c, [g, m]]) => `${CATS[c]} ${g}/${m}`).join('；');
      return [`D1 自學平台 交功課報告`, `單元：${rep.unit.toUpperCase()} ${rep.title}`, `班別：${rep.cls}　學號：${rep.no}　姓名：${rep.name}`, `總分：${rep.score} / ${rep.max}`, p, `無限練習：做了 ${rep.endless.n} 題，答對 ${rep.endless.right} 題`, `提交時間：${new Date(rep.time).toLocaleString('zh-HK')}${rep.teacher ? '（老師模式）' : ''}`, '----- 以下報告資料請勿修改，否則簽名會失效 -----', JSON.stringify(rep)].join('\n');
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
          const a = h('a', { href: URL.createObjectURL(blob), download: `D1_${U.id}_${rep.cls}_${rep.no}_${rep.name}.txt` });
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
    D1._ctx = ctx; D1._state = () => S;
  };

  // ---------------- 教師頁 ----------------
  const dt = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return isNaN(d) ? '' : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  D1.teacher = function (T) {
    const app = document.getElementById('app');
    const keys = {}; T.units.forEach((u) => { keys[u.id] = u.key; });
    const pin = h('input', { type: 'password', 'aria-label': '老師 PIN', autocomplete: 'off' });
    const msg = h('p.pts', { 'aria-live': 'polite' });
    const gate = h('section.card.reg', h('h2', { style: { margin: 0 } }, '輸入老師 PIN'), h('p.note', '注意：PIN 寫在公開的網站程式碼內，任何人都可以看到；這只是方便老師使用，並不是保安措施。學生報告的分數由 HMAC 簽名保護。'), h('label', 'PIN', pin), msg, h('div.row', h('button.btn.primary', { type: 'button', id: 'pin-go', onclick: unlock }, '進入')));
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlock(); });
    const head = h('header.top', h('div.brand', h('span.kicker', 'HKDSE ICT · 必修 D1'), h('h1', 'D1 自學平台　教師頁'), h('span.pages', '核對簽名報告、匯總 CSV、各單元答案及重點')), h('div', themeBtn()));
    const main = h('main');
    app.replaceChildren(h('div.wrap', head, main));
    main.append(gate);
    function unlock() { if (pin.value !== PIN) { msg.textContent = 'PIN 不正確'; return; } main.replaceChildren(verifier(), ...T.units.map(answerSheet)); }
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
    function verifier() {
      const ta = h('textarea.report', { 'aria-label': '貼上報告', placeholder: '把學生的報告（整段文字或 JSON）貼在這裏，可以一次貼多份。' });
      const file = h('input', { type: 'file', multiple: true, accept: '.txt,.json,text/plain,application/json', 'aria-label': '上載報告檔案' });
      const res = h('div');
      let rows = [];
      const csvOf = () => {
        const head = ['狀態', '單元', '班別', '學號', '姓名', '總分', '滿分', '試', '練', '寫算法', '小測', '無限練習題數', '無限練習答對', '老師模式', '提交時間'];
        const q = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        return '﻿' + [head, ...rows.map((r) => [r.status, r.unit, r.cls, r.no, r.name, r.score, r.max, ...['try', 'prac', 'write', 'quiz'].map((c) => (r.parts && r.parts[c] ? r.parts[c][0] : '')), r.endless ? r.endless.n : '', r.endless ? r.endless.right : '', r.teacher ? '是' : '', r.time ? dt(r.time) : '']).map((x) => x.map(q).join(','))].join('\r\n');
      };
      const show = () => {
        const tb = h('tbody', rows.map((r) => h('tr', h('td', { style: { color: r.status === '✓ 簽名正確' ? 'var(--good)' : 'var(--bad)', fontWeight: 700 } }, r.status), h('td', r.unit || ''), h('td', r.cls || ''), h('td', r.no || ''), h('td', r.name || ''), h('td.num', r.score != null ? `${r.score}/${r.max}` : ''),
          ...['try', 'prac', 'write', 'quiz'].map((c) => h('td.num', r.parts && r.parts[c] ? `${r.parts[c][0]}/${r.parts[c][1]}` : '')), h('td.num', r.endless ? `${r.endless.right}/${r.endless.n}` : ''), h('td', r.teacher ? '老師模式' : ''), h('td', r.time ? dt(r.time) : ''))));
        const dl = h('button.btn', { type: 'button', onclick: () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([csvOf()], { type: 'text/csv;charset=utf-8' })), download: 'D1_報告匯總.csv' }); document.body.append(a); a.click(); a.remove(); } catch (e) { /* 略 */ } } }, '下載 CSV');
        const cp = h('button.btn', { type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(csvOf()); cp.textContent = '已複製'; } catch (e) { cp.textContent = '未能複製'; } } }, '複製 CSV');
        res.replaceChildren(h('p', `共 ${rows.length} 份報告；簽名正確 ${rows.filter((r) => r.status === '✓ 簽名正確').length} 份。`), h('div.scroll', h('table.tb.sumtab#rep-table', h('thead', h('tr', ['狀態', '單元', '班別', '學號', '姓名', '總分', '試', '練', '寫算法', '小測', '無限練習（對/做）', '模式', '提交時間'].map((x) => h('th', x)))), tb)), h('div.row', dl, cp));
      };
      const add = (text) => {
        for (const r of parseReports(text)) {
          let status;
          if (r.bad) status = '✗ 未能讀取';
          else if (!keys[r.unit]) status = '✗ 未知單元';
          else status = D1.verifyReport(r, keys[r.unit]) ? '✓ 簽名正確' : '✗ 簽名不符（報告曾被修改）';
          const dup = rows.findIndex((x) => x.raw === D1.canon(r)); if (dup >= 0) continue;
          rows.push(Object.assign({}, r, { status, raw: D1.canon(r) }));
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
      const body = h('div.blk');
      const det = h('details.ansheet', h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '18px' } }, `${U.id.toUpperCase()} ${U.title}：答案及重點`), body);
      det.addEventListener('toggle', () => { if (det.open && !body.children.length) body.append(...sheetBody(U)); });
      return h('section.card', det);
    }
    function sheetBody(U) {
      const out = [h('p.pts', U.book)];
      let total = 0;
      for (const sec of U.sections) {
        const blk = h('div.blk', h('h3', sec.title + (sec.pages ? `（${sec.pages}）` : '')));
        if (sec.learn) { const pts = sec.learn.filter((b) => b.pts).flatMap((b) => b.pts); if (pts.length) blk.append(h('ul.pts-list', pts.map((p) => mdEl('li', p)))); }
        const rows = [];
        for (const it of sec.tries || []) { const r = correctIndex(it); rows.push(['試', it.id, it.pts, it.src || '', `${LET[r]}. ${it.options[r]}`]); total += it.pts; }
        for (const it of sec.practice || []) {
          let a;
          if (it.type === 'mc') { const r = correctIndex(it); a = `${LET[r]}. ${it.options[r]}`; }
          else if (it.type === 'fill') { const v = fillAnswers(it); a = it.blanks.map((b, i) => `${b.label} ${v[i]}`).join('；'); }
          else if (it.type === 'trace') { const tr = traceOf(it); a = tr.rows.map((r) => `${r.label}：${tr.cols.map((c) => (r.cells[c.key].changed ? `${c.label}=${r.cells[c.key].v}` : '')).filter(Boolean).join('，') || '—'}`).join('\n'); }
          else if (it.type === 'complete') a = it.ref.map((r, i) => `［${i + 1}］${r}`).join('；');
          rows.push(['練', it.id, it.pts, it.src || '', a]); total += it.pts;
        }
        for (const t of sec.tasks || []) { rows.push([`${t.kind === 'table' ? '分析題' : '寫算法'}（${t.tier}）`, t.id, t.pts, t.src || '', t.kind === 'table' ? tableAnswerText(t) : t.ref]); total += t.pts; }
        for (const it of sec.items || []) { const r = correctIndex(it); rows.push(['小測', it.id, it.pts, it.src || '', `${LET[r]}. ${it.options[r]}` + ((it.tags || []).length ? `（${it.tags.map((x) => (x.t === 'hot' ? '常考' : '易錯') + '：' + x.why).join('；')}）` : '')]); total += it.pts; }
        if (rows.length) blk.append(h('div.scroll', h('table.tb', h('thead', h('tr', ['類別', '編號', '分', '出處', '答案'].map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.slice(0, 4).map((x) => h('td', String(x))), h('td', /\n/.test(r[4]) || r[0].startsWith('寫') ? h('pre.code', { style: { padding: '6px 10px' } }, r[4]) : r[4])))))));
        if (sec.kind === 'endless') blk.append(h('p.pts', `隨機題型：${sec.gens.join('、')}（答案由引擎計算，不計分）。`));
        out.push(blk);
      }
      out.splice(1, 0, h('p.pts', `總分 ${total}。`));
      return out;
    }
  };
})();
