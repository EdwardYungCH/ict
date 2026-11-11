/* Python 自學平台：瀏覽器 Python 執行器（包住 Skulpt）
 * window.PyRun.run(code, {inputs, files, fixRandom, execLimit, onInput, onOut, signal})
 *   → Promise<{out, err:{type,line,msg,tb}|null, vars:{name:str}, vrepr:{name:repr}, files:{name:text}}>
 * 輸出文字與 Thonny Shell 一樣：input(prompt) 會顯示 prompt + 輸入值 + 換行。
 * open() 用 Python 寫的虛擬檔案（_PyrunFile），在 _pyrun 模組先執行，所以使用者程式的行號不用調整。
 * 亦提供 PyRun.explain(err, code)：用簡單中文解釋常見錯誤；PyRun.pyFloatRepr()：與 CPython 相同的 float 表示。
 */
(function (root) {
  'use strict';
  const PyRun = (root.PyRun = root.PyRun || {});

  // ---------- 與 CPython 相同的 float repr（最短表示） ----------
  function pyFloatRepr(x) {
    if (Number.isNaN(x)) return 'nan';
    if (x === Infinity) return 'inf';
    if (x === -Infinity) return '-inf';
    if (x === 0) return 1 / x < 0 ? '-0.0' : '0.0';
    const neg = x < 0;
    const s = Math.abs(x).toExponential(); // 最短而可還原的位數
    let [m, e] = s.split('e');
    e = Number(e);
    const digits = m.replace('.', '');
    let out;
    if (e >= -4 && e < 16) {
      if (e >= 0) {
        const ip = digits.length > e + 1 ? digits.slice(0, e + 1) : digits + '0'.repeat(e + 1 - digits.length);
        const fp = digits.length > e + 1 ? digits.slice(e + 1) : '0';
        out = ip + '.' + fp;
      } else out = '0.' + '0'.repeat(-e - 1) + digits;
    } else {
      out = digits[0] + (digits.length > 1 ? '.' + digits.slice(1) : '') + 'e' + (e < 0 ? '-' : '+') + String(Math.abs(e)).padStart(2, '0');
    }
    return (neg ? '-' : '') + out;
  }
  PyRun.pyFloatRepr = pyFloatRepr;
  // round(x, n)：以 x 的真實二進位值作「四捨六入五成雙」（與 CPython 相同）
  function pyRoundFloat(x, n) {
    if (!Number.isFinite(x) || x === 0) return x;
    if (n >= 0 && n <= 30 && Math.abs(x) < 1e21) {
      const s = Math.abs(x).toFixed(100);
      const dot = s.indexOf('.');
      const keep = s.slice(0, dot) + s.slice(dot + 1, dot + 1 + n);
      const rest = s.slice(dot + 1 + n);
      let up;
      if (rest[0] > '5') up = true;
      else if (rest[0] < '5') up = false;
      else if (/[1-9]/.test(rest.slice(1))) up = true;
      else up = Number(keep[keep.length - 1]) % 2 === 1;
      let k = BigInt(keep);
      if (up) k += 1n;
      let ks = k.toString().padStart(n + 1, '0');
      const str = n ? ks.slice(0, ks.length - n) + '.' + ks.slice(ks.length - n) : ks;
      return (x < 0 ? -1 : 1) * parseFloat(str);
    }
    const p = Math.pow(10, n), y = x * p, r = Math.round(y);
    const t = Math.abs(y % 1) === 0.5 ? (r % 2 === 0 ? r : r - 1) : r;
    return t / p;
  }
  PyRun.pyRoundFloat = pyRoundFloat;

  // ---------- Skulpt 修補 ----------
  let patched = false;
  function patch() {
    if (patched || typeof Sk === 'undefined') return;
    patched = true;
    Sk.builtin.float_.prototype.str$ = function (base, sign) {
      let v = this.v;
      if (sign === false) v = Math.abs(v);
      if (base !== undefined && base !== 10) return v.toString(base);
      return pyFloatRepr(v);
    };
    const origRound = Sk.builtin.float_.prototype.round$;
    Sk.builtin.float_.prototype.round$ = function (nd) {
      if (nd === undefined || nd === Sk.builtin.none.none$) return origRound.call(this, nd);
      const n = Sk.misceval.asIndexSized(nd);
      return new Sk.builtin.float_(pyRoundFloat(Sk.builtin.asnum$(this), n));
    };
    // sum()：CPython 3.12+ 對 float 用補償加法（例如 sum([0.1]*10) == 1.0）
    const origSum = Sk.builtins.sum;
    const newSum = function (iterable, start) {
      const args = start === undefined ? [iterable] : [iterable, start];
      let arr = null;
      try { if (iterable instanceof Sk.builtin.list || iterable instanceof Sk.builtin.tuple) arr = iterable.v.slice(); } catch (e) { arr = null; }
      const isNum = (o) => o instanceof Sk.builtin.int_ || o instanceof Sk.builtin.float_;
      if (!arr || !arr.some((o) => o instanceof Sk.builtin.float_) || !arr.every(isNum) || (start !== undefined && !isNum(start))) return Sk.misceval.callsimOrSuspendArray(origSum, args);
      let i = 0, si = start === undefined ? 0 : Sk.builtin.asnum$(start);
      if (start instanceof Sk.builtin.float_) si = NaN;
      // 先把 float 之前的 int 準確相加
      let intPart = null;
      if (!Number.isNaN(si)) { intPart = Sk.misceval.callsimArray(origSum, [new Sk.builtin.list(arr.filter((_, k) => k < arr.findIndex((o) => o instanceof Sk.builtin.float_)))].concat(start === undefined ? [] : [start])); }
      let sF = intPart ? Number(Sk.builtin.asnum$(intPart)) : Sk.builtin.asnum$(start), c = 0;
      i = Number.isNaN(si) ? 0 : arr.findIndex((o) => o instanceof Sk.builtin.float_);
      for (; i < arr.length; i++) {
        const x = Number(Sk.builtin.asnum$(arr[i]));
        const t = sF + x;
        if (Math.abs(sF) >= Math.abs(x)) c += (sF - t) + x; else c += (x - t) + sF;
        sF = t;
      }
      const r = Number.isFinite(c) && c ? sF + c : sF;
      return new Sk.builtin.float_(r);
    };
    Sk.builtins.sum = new Sk.builtin.func(newSum);
    for (const n of ['OSError', 'FileNotFoundError', 'IndentationError', 'TimeoutError', 'EOFError', 'KeyboardInterrupt', 'UnboundLocalError', 'RecursionError']) {
      if (!Sk.builtins[n] && Sk.builtin[n]) Sk.builtins[n] = Sk.builtin[n];
    }
    const F = Sk.builtinFiles && Sk.builtinFiles.files;
    if (F && F['src/lib/random.js'] && !/__pyrunFix/.test(F['src/lib/random.js'])) {
      F['src/lib/random.js'] += ';(function(){var o=$builtinmodule;$builtinmodule=function(n){var m=o(n);[\'randint\',\'random\',\'randrange\',\'uniform\',\'choice\',\'shuffle\'].forEach(function(k){var f=m[k];if(!f)return;m[k]=new Sk.builtin.func(function(){var fx=Sk.__pyrunFix;if(fx&&Object.prototype.hasOwnProperty.call(fx,k))return k===\'shuffle\'?Sk.builtin.none.none$:Sk.ffi.remapToPy(fx[k]);return Sk.misceval.callsimOrSuspendArray(f,Array.prototype.slice.call(arguments));});});return m;};})();';
    }
  }

  // ---------- 虛擬檔案（Python 寫，Skulpt 執行） ----------
  const PRE = [
    'class _PyrunFile:',
    '    def __init__(self, name, mode):',
    '        self.name = name',
    '        self.mode = mode',
    '        self.closed = False',
    '        self._pos = 0',
    '    def _chk(self, w):',
    '        if self.closed:',
    '            raise ValueError("I/O operation on closed file.")',
    '        if w and self.mode == "r":',
    '            raise OSError("not writable")',
    '        if not w and self.mode != "r":',
    '            raise OSError("not readable")',
    '    def read(self, n=-1):',
    '        self._chk(False)',
    '        d = _pyrun_vfs[self.name]',
    '        if n is None or n < 0:',
    '            s = d[self._pos:]',
    '        else:',
    '            s = d[self._pos:self._pos + n]',
    '        self._pos += len(s)',
    '        return s',
    '    def readline(self):',
    '        self._chk(False)',
    '        d = _pyrun_vfs[self.name]',
    '        if self._pos >= len(d):',
    '            return ""',
    '        i = d.find("\\n", self._pos)',
    '        if i < 0:',
    '            i = len(d) - 1',
    '        s = d[self._pos:i + 1]',
    '        self._pos = i + 1',
    '        return s',
    '    def readlines(self):',
    '        out = []',
    '        s = self.readline()',
    '        while s != "":',
    '            out.append(s)',
    '            s = self.readline()',
    '        return out',
    '    def write(self, s):',
    '        self._chk(True)',
    '        if not isinstance(s, str):',
    '            raise TypeError("write() argument must be str, not " + type(s).__name__)',
    '        _pyrun_vfs[self.name] = _pyrun_vfs[self.name] + s',
    '        return len(s)',
    '    def writelines(self, ls):',
    '        for s in ls:',
    '            self.write(s)',
    '    def close(self):',
    '        self.closed = True',
    '    def __iter__(self):',
    '        return self',
    '    def __next__(self):',
    '        s = self.readline()',
    '        if s == "":',
    '            raise StopIteration',
    '        return s',
    '    def __enter__(self):',
    '        return self',
    '    def __exit__(self, a, b, c):',
    '        self.closed = True',
    '        return False',
    '    def __repr__(self):',
    '        return "<_io.TextIOWrapper name=\'" + self.name + "\' mode=\'" + self.mode + "\' encoding=\'utf-8\'>"',
    'def open(file, mode="r", encoding=None, newline=None):',
    '    m = mode.replace("t", "")',
    '    if m not in ("r", "w", "a"):',
    '        raise ValueError("invalid mode: \'" + mode + "\'")',
    '    file = str(file)',
    '    if m == "r" and file not in _pyrun_vfs:',
    '        raise FileNotFoundError("[Errno 2] No such file or directory: \'" + file + "\'")',
    '    if m == "w" or file not in _pyrun_vfs:',
    '        _pyrun_vfs[file] = ""',
    '    f = _PyrunFile(file, m)',
    '    return f',
  ].join('\n');

  // ---------- 錯誤：Skulpt → CPython 名稱及訊息 ----------
  const KW_BLOCK = /^(if|elif|else|for|while|def|try|except|finally|with|class)\b/;
  function tokenScan(code) {
    // 找：未完結的字串、括號不配對；回傳第一個問題
    const lines = code.split('\n');
    const stack = [];
    let i = 0, line = 1;
    const n = code.length;
    while (i < n) {
      const c = code[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === '#') { while (i < n && code[i] !== '\n') i++; continue; }
      if (c === '"' || c === "'") {
        const triple = code.substr(i, 3) === c.repeat(3);
        // 前綴 f/r/b 已在前一字元，不影響
        if (triple) {
          const end = code.indexOf(c.repeat(3), i + 3);
          if (end < 0) return { type: 'SyntaxError', line, msg: `unterminated triple-quoted string literal (detected at line ${lines.length})` };
          line += (code.slice(i, end).match(/\n/g) || []).length; i = end + 3; continue;
        }
        let j = i + 1;
        while (j < n && code[j] !== c && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
        if (j >= n || code[j] === '\n') return { type: 'SyntaxError', line, msg: `unterminated string literal (detected at line ${line})` };
        i = j + 1; continue;
      }
      if (c.charCodeAt(0) > 127 && !/[\p{L}\p{N}_]/u.test(c)) return { type: 'SyntaxError', line, msg: `invalid character '${c}' (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})` };
      if ('([{'.includes(c)) stack.push({ c, line });
      else if (')]}'.includes(c)) {
        const open = { ')': '(', ']': '[', '}': '{' }[c];
        if (!stack.length) return { type: 'SyntaxError', line, msg: `unmatched '${c}'` };
        const top = stack.pop();
        if (top.c !== open) return { type: 'SyntaxError', line, msg: `closing parenthesis '${c}' does not match opening parenthesis '${top.c}'` + (top.line !== line ? ` on line ${top.line}` : '') };
      }
      i++;
    }
    if (stack.length) return { type: 'SyntaxError', line: stack[0].line, msg: `'${stack[0].c}' was never closed` };
    return null;
  }
  function logicalLines(code) {
    // 回傳 [{line, indent, text}]（略去空行、註解行、括號內的續行）
    const out = [];
    const L = code.split('\n');
    let depth = 0;
    L.forEach((raw, k) => {
      const stripped = raw.replace(/\s+$/, '');
      const body = stripped.replace(/^[ \t]*/, '');
      const startDepth = depth;
      // 粗略計算括號深度（略去字串及註解）
      let s = '', q = null;
      for (let i = 0; i < stripped.length; i++) {
        const c = stripped[i];
        if (q) { if (c === '\\') { i++; continue; } if (c === q) { q = null; s += '"'; } continue; }
        if (c === '"' || c === "'") { q = c; s += '"S'; continue; }
        if (c === '#') break;
        s += c;
        if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth = Math.max(0, depth - 1);
      }
      if (startDepth > 0) return;
      if (!body || body.startsWith('#')) return;
      const ind = stripped.length - body.length;
      out.push({ line: k + 1, indent: stripped.slice(0, ind).replace(/\t/g, '        ').length, text: body, code: s.trim() });
    });
    return out;
  }
  function diagnoseSyntax(code, skLine, skMsg) {
    // 收集各種可能的錯誤，取行號最小的（與 CPython 先遇到先報告相近）
    const cands = [];
    const t = tokenScan(code);
    if (t) cands.push(t);
    const a = layoutErr(code);
    if (a) cands.push(a);
    const b = stmtErr(code);
    if (b) cands.push(b);
    if (cands.length) { cands.sort((x, y) => x.line - y.line); return cands[0]; }
    return { type: 'SyntaxError', line: skLine, msg: /EOF/.test(skMsg || '') ? "'(' was never closed" : 'invalid syntax' };
  }
  function layoutErr(code) {
    const LL = logicalLines(code);
    const levels = [0];
    for (let k = 0; k < LL.length; k++) {
      const cur = LL[k], prev = LL[k - 1];
      const opener = prev && /:$/.test(prev.code) && KW_BLOCK.test(prev.code);
      if (k === 0 && cur.indent > 0) return { type: 'IndentationError', line: cur.line, msg: 'unexpected indent' };
      if (opener) {
        if (cur.indent <= prev.indent) {
          const kw = prev.code.match(KW_BLOCK)[1];
          const what = { if: "'if' statement", elif: "'elif' statement", else: "'else' statement", for: "'for' statement", while: "'while' statement", def: 'function definition', try: "'try' statement", except: "'except' statement", finally: "'finally' statement", with: "'with' statement", class: 'class definition' }[kw];
          return { type: 'IndentationError', line: cur.line, msg: `expected an indented block after ${what} on line ${prev.line}` };
        }
        levels.push(cur.indent);
      } else if (prev) {
        if (cur.indent > prev.indent) return { type: 'IndentationError', line: cur.line, msg: 'unexpected indent' };
        if (cur.indent < prev.indent) {
          while (levels.length && levels[levels.length - 1] > cur.indent) levels.pop();
          if (!levels.length || levels[levels.length - 1] !== cur.indent) return { type: 'IndentationError', line: cur.line, msg: 'unindent does not match any outer indentation level' };
        }
      }
    }
    if (LL.length && /:$/.test(LL[LL.length - 1].code) && KW_BLOCK.test(LL[LL.length - 1].code)) {
      return { type: 'SyntaxError', line: LL[LL.length - 1].line, msg: 'incomplete input' };
    }
    return null;
  }
  function stmtErr(code) {
    const LL = logicalLines(code);
    for (const l of LL) {
      if (KW_BLOCK.test(l.code) && !l.code.includes(':')) return { type: 'SyntaxError', line: l.line, msg: "expected ':'" };
      if (/^(if|elif|while)\b/.test(l.code) && /[^=!<>]=[^=]/.test(l.code.replace(/:$/, '') + ' ')) return { type: 'SyntaxError', line: l.line, msg: "invalid syntax. Maybe you meant '==' or ':=' instead of '='?" };
      if (/^print\s+[^\s(=.]/.test(l.code)) return { type: 'SyntaxError', line: l.line, msg: "Missing parentheses in call to 'print'. Did you mean print(...)?" };
      if (/^(else|elif)\b/.test(l.code)) {
        // else/elif 之前要有 if（同一縮排）
        const idx = LL.indexOf(l);
        let ok = false;
        for (let j = idx - 1; j >= 0; j--) { if (LL[j].indent < l.indent) break; if (LL[j].indent === l.indent) { ok = /^(if|elif|for|while|try|except)\b/.test(LL[j].code); break; } }
        if (!ok) return { type: 'SyntaxError', line: l.line, msg: 'invalid syntax' };
      }
    }
    return null;
  }
  PyRun.diagnoseSyntax = diagnoseSyntax;

  function jsStr(o) {
    try { if (o == null) return ''; if (o.v !== undefined && typeof o.v === 'string') return o.v; const s = o.tp$str ? o.tp$str() : null; return s && typeof s.v === 'string' ? s.v : String(o); } catch (e) { return String(o); }
  }
  function jsRepr(o) {
    try { const r = Sk.misceval.objectRepr(o); return typeof r === 'string' ? r : jsStr(r); } catch (e) { return jsStr(o); }
  }
  function mapErr(e, code) {
    if ((e && e.__pyrunStop) || /__PYRUN_STOP__/.test(String(e && (e.message || (e.toString && e.toString()))))) return { type: 'Stopped', line: 0, msg: '已停止', tb: [] };
    if (!e || !e.tp$name) {
      const m = String(e && e.message ? e.message : e);
      if (/OutputLimit/.test(m)) return { type: 'Timeout', line: 0, msg: 'output limit', tb: [] };
      return { type: 'InternalError', line: 0, msg: m, tb: [] };
    }
    let type = e.tp$name;
    let msg = '';
    try { const a = e.args && e.args.v; if (a && a.length) msg = type === 'KeyError' ? jsRepr(a[0]) : a.length === 1 ? jsStr(a[0]) : '(' + a.map(jsRepr).join(', ') + ')'; } catch (x) { msg = ''; }
    let tb = [];
    try { tb = (e.traceback || []).filter((f) => /<stdin>/.test(f.filename || '')).map((f) => ({ line: f.lineno, fn: '' })); } catch (x) { tb = []; }
    let line = tb.length ? tb[0].line : 0;
    tb.reverse();
    if (type === 'TimeoutError' && /run time limit/.test(msg)) return { type: 'Timeout', line, msg: 'Timeout', tb: [] };
    if (type === 'SyntaxError' || type === 'IndentationError' || type === 'TabError') {
      if (!line) { const m = /line (\d+)/.exec(e.toString()); if (m) line = Number(m[1]); }
      const d = diagnoseSyntax(code, line, msg);
      return { type: d.type, line: d.line, msg: d.msg, tb: [] };
    }
    if (type === 'ExternalError' && /File not found/.test(msg)) { type = 'ModuleNotFoundError'; msg = msg.replace(/File not found: /, 'No module named '); }
    msg = msg
      .replace(/^cannot concatenate '(\w+)' and '(\w+)' objects$/, 'can only concatenate $1 (not "$2") to $1')
      .replace(/^'(\w+)' does not support item assignment$/, "'$1' object does not support item assignment")
      .replace(/missing (\d+) required argument/, 'missing $1 required positional argument')
      .replace(/^(max|min) expected 1 argument/, '$1 expected at least 1 argument')
      .replace(/a bytes-like object or a number, not/, 'a bytes-like object or a real number, not')
      .replace(/^local variable '(\w+)' referenced before assignment$/, "cannot access local variable '$1' where it is not associated with a value");
    if (type === 'OverflowError' && msg === 'Numerical result out of range') msg = "(34, 'Numerical result out of range')";
    if (type === 'IndexError' && msg === 'pop index out of range' && /\.pop\(\s*\)/.test(code.split('\n')[line - 1] || '')) msg = 'pop from empty list';
    if (type === 'ZeroDivisionError' && /integer division or modulo/.test(msg)) {
      const src = (code.split('\n')[line - 1] || '');
      if (/%/.test(src) && !/\/\//.test(src)) msg = 'integer modulo by zero';
    }
    return { type, line, msg, tb };
  }
  PyRun.mapErr = mapErr;

  // ---------- 中文解釋 ----------
  function explain(err, code) {
    if (!err) return '';
    const k = err.type, m = err.msg || '', ln = err.line;
    const at = ln ? `第 ${ln} 行` : '程式';
    const src = ln ? ((code || '').split('\n')[ln - 1] || '').trim() : '';
    if (k === 'Timeout') return `程式執行太久，已自動停止。很可能是無限循環：檢查 while 的條件會不會變成 False（循環內有沒有改變條件用到的變量）。`;
    if (k === 'Stopped') return '你按了「停止」，程式已停止。';
    if (k === 'IndentationError') {
      if (/expected an indented block/.test(m)) return `${at}應該縮排。if、for、while、def 等以冒號 : 結尾的句子，下一行要向右縮排（通常 4 格）。`;
      if (/unindent/.test(m)) return `${at}的縮排與上面任何一層都對不上。同一層的句子要用相同數目的空格。`;
      return `${at}開頭多了空格（縮排）。只有 if、for、while、def 等冒號 : 後面的句子才要縮排。`;
    }
    if (k === 'SyntaxError') {
      if (/unterminated/.test(m)) return `${at}的引號不成對。字串要用一對引號包住，例如 "Hello"。`;
      if (/never closed/.test(m)) return `${at}有括號沒有關上。每個 ( 都要有一個 )；[ 要有 ]。`;
      if (/unmatched|does not match/.test(m)) return `${at}的括號不配對：多了一個關括號，或者 ( 與 ] 混用了。`;
      if (/expected ':'/.test(m)) return `${at}最後漏了冒號 :。if、elif、else、for、while、def 的一行要以 : 結尾。`;
      if (/'=='/.test(m)) return `${at}：比較兩個值是否相等要用 ==，單一個 = 是賦值。`;
      if (/Missing parentheses/.test(m)) return `${at}：Python 3 的 print 要加括號，例如 print("Hi")。`;
      if (/incomplete input/.test(m)) return `${at}以冒號結尾，但下面沒有縮排的句子。`;
      return `${at}不符合 Python 的寫法（語法錯誤）。檢查有沒有打錯符號、漏了冒號 :、引號或括號不成對。`;
    }
    if (k === 'NameError') {
      const nm = (/name '([^']+)'/.exec(m) || [])[1] || '';
      if (/^(Print|PRINT|Input|INPUT|Int|Len|Range)$/.test(nm)) return `Python 分大小寫：「${nm}」應該寫成小寫「${nm.toLowerCase()}」。`;
      return `Python 不認識名稱「${nm}」。可能是：變量未賦值就使用、名稱串錯字或大小寫不同，或者文字忘記加引號（例如 print(Hello) 應寫成 print("Hello")）。`;
    }
    if (k === 'UnboundLocalError') return `子程式內使用了局部變量「${(/'([^']+)'/.exec(m) || [])[1] || ''}」，但它在這之前未有值。若要修改全局變量，要先寫 global。`;
    if (k === 'TypeError') {
      if (/concatenate|unsupported operand.*'(int|float)' and 'str'|'str' and '(int|float)'/.test(m)) return `${at}：數字和字串不能直接一起運算。字串轉數字用 int() 或 float()；數字轉字串用 str()。記住 input() 得到的是字串。`;
      if (/not supported between/.test(m)) return `${at}：不同類型（例如數字和字串）不能比較大小。input() 得到的是字串，要先用 int() 或 float() 轉換。`;
      if (/item assignment/.test(m)) return `${at}：字串不可以修改其中一個字元。可以建立一個新字串。`;
      if (/missing \d+ required positional argument|takes \d+ positional argument/.test(m)) return `${at}：調用子程式時，參數的數目不對。檢查 def 那一行有多少個參數。`;
      if (/indices must be integers/.test(m)) return `${at}：列表的索引要是整數，例如 a[2]；如果是計算出來的值，可用 int() 或 //。`;
      if (/has no len/.test(m)) return `${at}：len() 只可用於字串、列表等，不可用於數字。`;
      if (/not callable/.test(m)) return `${at}：這個名稱不是函數，不能在後面加 ( )。可能是變量名稱與函數名稱相同了。`;
      if (/can't multiply sequence/.test(m)) return `${at}：字串或列表只可乘以整數。input() 得到的是字串，記得先轉成數字。`;
      return `${at}：數據類型不對（TypeError）。檢查運算或函數用到的值是不是正確的類型。`;
    }
    if (k === 'ValueError') {
      if (/invalid literal for int/.test(m)) { const v = (/: '(.*)'$/.exec(m) || [])[1]; return `int() 只可以把整數的文字變成整數，但收到「${v == null ? '' : v}」。如果有小數，要用 float()。`; }
      if (/could not convert string to float/.test(m)) return 'float() 收到的文字不是數字。';
      if (/math domain/.test(m)) return `${at}：數學函數收到不合理的值（例如負數開平方）。`;
      if (/not in list/.test(m)) return `${at}：要找的值不在列表內。可以先用 in 檢查。`;
      return `${at}：值不合理（ValueError）。`;
    }
    if (k === 'ZeroDivisionError') return `${at}：除數是 0。/、//、% 的右邊不可以是 0；可以先用 if 檢查。`;
    if (k === 'IndexError') return `${at}：索引超出範圍。索引由 0 開始，最後一個是 len(...) - 1。${/pop/.test(m) ? '空列表不可以 pop()。' : ''}`;
    if (k === 'KeyError') return `${at}：字典內沒有鍵 ${m}。`;
    if (k === 'FileNotFoundError') return `${at}：找不到檔案。檢查檔名（包括 .txt）是否正確。`;
    if (k === 'AttributeError') { const a = (/attribute '([^']+)'/.exec(m) || [])[1] || ''; return `${at}：這類數據沒有「${a}」這個方法或屬性。檢查拼寫，以及變量是不是你以為的類型（例如數字沒有 append）。`; }
    if (k === 'EOFError') return '程式要求的輸入多過提供的輸入。請在「輸入」框每行寫一個值（每次 input() 用一行）。';
    if (k === 'RecursionError') return '子程式不停調用自己（遞歸太深）。檢查停止條件。';
    if (k === 'ModuleNotFoundError' || k === 'ImportError') return `${at}：這裏只可以 import math 和 random 等常用模組。`;
    if (k === 'OSError') return `${at}：檔案操作不正確（例如用 "r" 模式開啟卻寫入）。`;
    void src;
    return `${at}出錯：${k}${m ? '：' + m : ''}`;
  }
  PyRun.explain = explain;

  // Thonny 式 Traceback 文字
  function traceback(err, code, fname) {
    if (!err) return '';
    fname = fname || 'main.py';
    const lines = (code || '').split('\n');
    const src = (n) => (lines[n - 1] || '').trim();
    if (err.type === 'Timeout') return '程式執行超時，已停止（可能是無限循環）。';
    if (err.type === 'Stopped') return '已停止。';
    if (err.type === 'SyntaxError' || err.type === 'IndentationError') return `  File "${fname}", line ${err.line}\n    ${src(err.line)}\n${err.type}: ${err.msg}`;
    const tb = err.tb && err.tb.length ? err.tb : [{ line: err.line }];
    return 'Traceback (most recent call last):\n' + tb.map((f) => `  File "${fname}", line ${f.line}${f.fn ? ', in ' + f.fn : ''}\n    ${src(f.line)}`).join('\n') + `\n${err.type}${err.msg ? ': ' + err.msg : ''}`;
  }
  PyRun.traceback = traceback;

  // ---------- 執行 ----------
  let chain = Promise.resolve();
  function readFile(x) {
    if (Sk.builtinFiles && Sk.builtinFiles.files[x] !== undefined) return Sk.builtinFiles.files[x];
    throw "File not found: '" + x + "'";
  }
  function isHidden(k, v) {
    if (k.startsWith('__') || k.startsWith('_pyrun') || k === '_PyrunFile') return true;
    if (v == null) return true;
    if (v instanceof Sk.builtin.func || v instanceof Sk.builtin.module || v instanceof Sk.builtin.type) return true;
    if (Sk.builtin.method && v instanceof Sk.builtin.method) return true;
    try { if (Sk.abstr.typeName(v) === '_PyrunFile') return true; } catch (e) { /* 略 */ }
    return false;
  }
  // Skulpt 會把列表推導式 [x for x in …] 的 x 留在全局；CPython 不會。只在推導式出現的名稱便隱藏。
  function compOnly(k, code) {
    const lines = String(code || '').split('\n');
    const inComp = new RegExp(`\\S.*\\bfor\\s+(?:\\w+\\s*,\\s*)*${k}\\s*(?:,|\\bin\\b)`);
    if (!lines.some((l) => inComp.test(l.replace(/^\s+/, '')))) return false;
    const bound = new RegExp(`^\\s*(?:for\\s+(?:\\w+\\s*,\\s*)*${k}\\b|${k}\\s*(?:,[^=]*)?[-+*/%]?=(?!=)|(?:\\w+\\s*,\\s*)+${k}\\s*=(?!=)|global\\s.*\\b${k}\\b|def\\s+${k}\\b|(?:from\\s.*)?import\\s.*\\b${k}\\b|with\\s.*\\bas\\s+${k}\\b)`);
    return !lines.some((l) => bound.test(l));
  }
  function readGlobals(G, code) {
    const vars = {}, vrepr = {}, vtype = {};
    for (const key of Object.keys(G || {})) {
      const v = G[key];
      const k = key.replace(/_\$rw\$$/, '');
      if (k === 'open' || isHidden(k, v) || compOnly(k, code)) continue;
      vars[k] = jsStr(v); vrepr[k] = jsRepr(v);
      try { vtype[k] = Sk.abstr.typeName(v); } catch (e) { vtype[k] = ''; }
    }
    return { vars, vrepr, vtype };
  }
  function pyLit(o) { return JSON.stringify(o); }

  function runNow(code, opt) {
    opt = opt || {};
    patch();
    const q = Array.isArray(opt.inputs) ? opt.inputs.map(String) : (opt.inputs != null && String(opt.inputs) !== '' ? String(opt.inputs).replace(/\r/g, '').split('\n') : []);
    let out = '';
    const emit = (t) => { out += t; if (out.length > 100000) throw new Error('OutputLimit'); if (opt.onOut) opt.onOut(t); };
    const sig = opt.signal || {};
    Sk.__pyrunFix = opt.fixRandom || null;
    Sk.configure({
      output: emit, read: readFile, __future__: Sk.python3, retainGlobals: true,
      inputfunTakesPrompt: true, execLimit: opt.execLimit || 5000, yieldLimit: 100,
      inputfun: (prompt) => {
        const p = prompt == null ? '' : String(prompt);
        emit(p);
        if (q.length) { const v = q.shift(); emit(v + '\n'); return v; }
        if (!opt.onInput) throw new Sk.builtin.EOFError('EOF when reading a line');
        return Promise.resolve(opt.onInput(p)).then((v) => { v = v == null ? '' : String(v); emit(v + '\n'); Sk.execStart = Date.now(); return v; });
      },
    });
    Sk.globals = { __name__: new Sk.builtin.str('__main__') };
    const handlers = { '*': () => { if (sig.stop) { const e = new Error('__PYRUN_STOP__'); e.__pyrunStop = true; throw e; } } };
    const pre = PRE + '\n_pyrun_vfs = ' + pyLit(opt.files || {}) + '\n';
    const res = { out: '', err: null, vars: {}, vrepr: {}, vtype: {}, files: {} };
    const t0 = Date.now();
    return Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('_pyrun', false, pre, true))
      .then(() => { Sk.execStart = Date.now(); Sk.lastYield = Date.now(); return Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true), handlers); })
      .then(() => null, (e) => e)
      .then((e) => {
        res.out = out;
        res.err = e ? mapErr(e, code) : null;
        const G = Sk.globals || {};
        Object.assign(res, readGlobals(G, code));
        try { const fs = G._pyrun_vfs; if (fs) res.files = Sk.ffi.remapToJs(fs); } catch (x) { res.files = {}; }
        res.ms = Date.now() - t0;
        Sk.__pyrunFix = null;
        return res;
      });
  }
  PyRun.busy = 0; // 測試用：正在執行或排隊的數目
  PyRun.run = function (code, opt) {
    PyRun.busy++;
    const p = chain.then(() => runNow(code, opt)).finally(() => { PyRun.busy--; });
    chain = p.catch(() => null);
    return p;
  };
  PyRun.ready = () => typeof Sk !== 'undefined';
  if (typeof module !== 'undefined' && module.exports) module.exports = PyRun;
})(typeof window !== 'undefined' ? window : globalThis);
