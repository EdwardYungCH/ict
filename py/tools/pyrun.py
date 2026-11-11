#!/usr/bin/env python3
"""CPython 執行器（build.js 用）。

stdin : JSON 陣列，每個 job：
  {code, inputs:'a\\nb', files:{name:text}, fixRandom:{randint:4},
   ask:<ask> | asks:[<ask>...], trace:{mode:'stmt'|'iter', cols:[...], out:true},
   step:true, counts:true}
  ask：'out' | {var} | {expr} | {error:true} | {count:n} | {file:name}
stdout: JSON 陣列，每個結果：
  {out, err:{type,line,msg,tb}|null, vars:{name:str}, vrepr:{name:repr},
   files:{name:text}, answers:[str...], counts:{line:n},
   trace:{mode, cols:[{key,label}], rows:[{label,line,cells:[{v,changed}]}]},
   steps:[{l, v:{name:repr}, o:outLen, fn}], stepsCut:bool}
每個 job 用全新 globals、暫存資料夾、獨立的 input()/stdout。
20000 個 line event 後當作無限循環（err.type = 'Timeout'）。
"""
import ast, builtins, io, json, math, os, random, shutil, signal, sys, tempfile, traceback, types

LINE_LIMIT = 20000
STEP_LIMIT = 400
OUT_LIMIT = 200000
FNAME = '<main>'
ORIG_RANDOM = {k: getattr(random, k) for k in ('randint', 'random', 'randrange', 'uniform', 'choice', 'shuffle')}


class Timeout(BaseException):
    pass


class OutBuf:
    """所有輸出（含 input 回顯）及只有 print 的輸出分開記錄。"""
    def __init__(self):
        self.all = []
        self.n = 0
        self.prn = []

    def write(self, s):
        s = str(s)
        self.all.append(s); self.prn.append(s); self.n += len(s)
        if self.n > OUT_LIMIT:
            raise Timeout('output')
        return len(s)

    def echo(self, s):
        self.all.append(s); self.n += len(s)

    def flush(self):
        pass

    def text(self):
        return ''.join(self.all)

    def ptext(self):
        return ''.join(self.prn)


def s_of(v):
    try:
        return str(v)
    except BaseException:
        return '?'


def r_of(v):
    try:
        r = repr(v)
    except BaseException:
        return '?'
    return r if len(r) < 400 else r[:400] + '…'


def user_vars(ns):
    out = {}
    for k, v in ns.items():
        if k.startswith('__') or isinstance(v, (types.ModuleType, types.FunctionType, types.BuiltinFunctionType, type, io.IOBase)):
            continue
        out[k] = v
    return out


def norm_out(s):
    lines = [l.rstrip() for l in s.replace('\r\n', '\n').split('\n')]
    while lines and not lines[-1]:
        lines.pop()
    while lines and not lines[0]:
        lines.pop(0)
    return '\n'.join(lines)


def first_loop(tree):
    best = None
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.While)):
            if best is None or node.lineno < best.lineno:
                best = node
    return best


def run_job(job):
    code = job.get('code', '')
    inputs = job.get('inputs', '')
    if isinstance(inputs, list):
        q = [str(x) for x in inputs]
    else:
        q = str(inputs).split('\n') if str(inputs) != '' else []
    files = job.get('files') or {}
    fix = job.get('fixRandom') or {}
    asks = job.get('asks') or ([job['ask']] if 'ask' in job else [])
    tspec = job.get('trace')
    want_step = bool(job.get('step'))
    res = {'out': '', 'err': None, 'vars': {}, 'vrepr': {}, 'files': {}, 'answers': [], 'counts': {}}

    buf = OutBuf()
    old_cwd = os.getcwd()
    tmp = tempfile.mkdtemp(prefix='pyrun_')
    for name, text in files.items():
        with open(os.path.join(tmp, name), 'w', encoding='utf-8', newline='') as f:
            f.write(text)
    os.chdir(tmp)

    def fake_input(prompt=''):
        p = s_of(prompt)
        buf.echo(p)
        if not q:
            raise EOFError('EOF when reading a line')
        v = q.pop(0)
        buf.echo(v + '\n')
        return v

    # random 固定值
    for k, v in fix.items():
        if k in ORIG_RANDOM:
            setattr(random, k, (lambda val: (lambda *a, **kw: val))(v) if k != 'shuffle' else (lambda *a, **kw: None))

    ns = {'__name__': '__main__', '__builtins__': builtins}
    old_input, old_open = builtins.input, builtins.open
    builtins.input = fake_input

    def u_open(file, mode='r', *a, **kw):
        if 'b' not in mode and 'encoding' not in kw and len(a) < 2:
            kw['encoding'] = 'utf-8'
        return old_open(file, mode, *a, **kw)
    builtins.open = u_open
    old_stdout = sys.stdout
    counts = {}
    nlines = [0]
    timed_out = [False]
    steps = []
    steps_cut = [False]

    # 追蹤表
    tr = None
    if tspec:
        cols = list(tspec.get('cols', []))
        tr = {'mode': tspec.get('mode', 'stmt'), 'cols': cols, 'out': bool(tspec.get('out')),
              'rows': [], 'last': {c: '' for c in cols}, 'outpos': 0, 'pending': {}}
        src_lines = code.split('\n')
        if tr['mode'] == 'iter':
            try:
                lp = first_loop(ast.parse(code))
            except SyntaxError:
                lp = None
            if lp is None:
                tr['mode'] = 'stmt'
            else:
                tr['loop'] = (lp.lineno, lp.end_lineno)
                tr['iter_open'] = False
                tr['k'] = 0
                # 循環前的初始值
                tr['started'] = False

    def lookup(frame, name):
        if name in frame.f_locals:
            return True, frame.f_locals[name]
        if name in frame.f_globals:
            return True, frame.f_globals[name]
        return False, None

    def emit_row(frame, label, line):
        cells = []
        changed_any = False
        for c in tr['cols']:
            ok, v = lookup(frame, c)
            sv = s_of(v) if ok else tr['last'].get(c, '')
            ch = sv != tr['last'].get(c, '')
            if ch:
                changed_any = True
            cells.append({'v': sv, 'changed': ch})
            tr['last'][c] = sv
        o = ''
        if tr['out']:
            p = buf.ptext()
            o = p[tr['outpos']:]
            tr['outpos'] = len(p)
            o = o.rstrip('\n').replace('\n', ' / ') if o.strip() else ''
            cells.append({'v': o, 'changed': bool(o)})
        if changed_any or o or tr['mode'] == 'iter':
            tr['rows'].append({'label': label, 'line': line, 'cells': cells})
        elif tr['out']:
            pass

    def snapshot(frame, line):
        v = {}
        g = frame.f_globals
        for k, x in user_vars(g).items():
            v[k] = r_of(x)
        if frame.f_code.co_name != '<module>':
            for k, x in user_vars(frame.f_locals).items():
                v[k] = r_of(x)
        return {'l': line, 'v': v, 'o': buf.n, 'fn': frame.f_code.co_name}

    def finish_line(frame):
        """在 frame 內上一行執行完畢（stmt 模式）。"""
        pl = tr['pending'].pop(id(frame), None)
        if pl is not None:
            emit_row(frame, src_lines[pl - 1].strip() if pl - 1 < len(src_lines) else '', pl)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FNAME:
            return None
        if event == 'line':
            ln = frame.f_lineno
            nlines[0] += 1
            if nlines[0] > LINE_LIMIT:
                timed_out[0] = True
                raise Timeout('lines')
            counts[ln] = counts.get(ln, 0) + 1
            if want_step:
                if len(steps) < STEP_LIMIT:
                    steps.append(snapshot(frame, ln))
                else:
                    steps_cut[0] = True
            if tr:
                if tr['mode'] == 'stmt':
                    finish_line(frame)
                    tr['pending'][id(frame)] = ln
                else:
                    a, b = tr['loop']
                    if ln == a:
                        if not tr['started']:
                            tr['started'] = True
                            emit_row(frame, '循環前', ln)
                            tr['rows'][-1]['cells'] = [dict(c, changed=bool(c['v'])) for c in tr['rows'][-1]['cells']]
                        if tr['iter_open']:
                            emit_row(frame, f'第 {tr["k"]} 次', ln)
                            tr['iter_open'] = False
                    elif a < ln <= b:
                        if not tr['iter_open'] and tr['started']:
                            tr['iter_open'] = True
                            tr['k'] += 1
                    else:
                        if tr['iter_open']:
                            emit_row(frame, f'第 {tr["k"]} 次', ln)
                            tr['iter_open'] = False
        elif event == 'return':
            if tr:
                if tr['mode'] == 'stmt':
                    finish_line(frame)
                elif tr['iter_open'] and frame.f_code.co_name == '<module>':
                    emit_row(frame, f'第 {tr["k"]} 次', None)
                    tr['iter_open'] = False
        return tracer

    def on_alarm(sig, frm):
        timed_out[0] = True
        raise Timeout('time')

    err = None
    final_frame_ns = ns
    try:
        try:
            compiled = compile(code, FNAME, 'exec')
        except SyntaxError as e:
            err = {'type': type(e).__name__, 'line': e.lineno or 0, 'msg': e.msg, 'tb': []}
            compiled = None
        if compiled is not None:
            sys.stdout = buf
            signal.signal(signal.SIGALRM, on_alarm)
            signal.setitimer(signal.ITIMER_REAL, 3.0)
            sys.settrace(tracer)
            try:
                exec(compiled, ns)
            except Timeout:
                timed_out[0] = True
            except BaseException as e:
                if timed_out[0]:
                    pass
                else:
                    tb = [(f.lineno, f.name) for f in traceback.extract_tb(e.__traceback__) if f.filename == FNAME]
                    err = {'type': type(e).__name__, 'line': tb[-1][0] if tb else 0, 'msg': s_of(e) if not isinstance(e, KeyError) else r_of(e.args[0]) if e.args else '',
                           'tb': [{'line': l, 'fn': n} for l, n in tb]}
            finally:
                sys.settrace(None)
                signal.setitimer(signal.ITIMER_REAL, 0)
                sys.stdout = old_stdout
            if timed_out[0]:
                last = max(counts, key=lambda k: counts[k]) if counts else 0
                err = {'type': 'Timeout', 'line': last, 'msg': 'Timeout', 'tb': []}
    finally:
        sys.stdout = old_stdout
        builtins.input, builtins.open = old_input, old_open
        for k, f in ORIG_RANDOM.items():
            setattr(random, k, f)

    res['out'] = buf.text()
    res['err'] = err
    uv = user_vars(ns)
    res['vars'] = {k: s_of(v) for k, v in uv.items()}
    res['vrepr'] = {k: r_of(v) for k, v in uv.items()}
    res['counts'] = {str(k): v for k, v in counts.items()}
    try:
        for name in sorted(os.listdir(tmp)):
            p = os.path.join(tmp, name)
            if os.path.isfile(p):
                with old_open(p, encoding='utf-8', newline='') as f:
                    res['files'][name] = f.read()
    except Exception:
        pass
    # ask 答案
    for a in asks:
        res['answers'].append(answer(a, res, ns, fix))
    os.chdir(old_cwd)
    shutil.rmtree(tmp, ignore_errors=True)
    if tr:
        labels = [{'key': c, 'label': c} for c in tr['cols']]
        if tr['out']:
            labels.append({'key': '__out', 'label': '輸出'})
        res['trace'] = {'mode': tr['mode'], 'cols': labels, 'rows': tr['rows']}
    if want_step:
        res['steps'] = steps
        res['stepsCut'] = steps_cut[0]
    return res


def answer(a, res, ns, fix):
    if a is None or a == 'out':
        return norm_out(res['out'])
    if isinstance(a, dict):
        if 'var' in a:
            if a['var'] in ns:
                return s_of(ns[a['var']])
            return '（未有值）'
        if 'expr' in a:
            for k, v in fix.items():
                if k in ORIG_RANDOM:
                    setattr(random, k, (lambda val: (lambda *x, **kw: val))(v))
            try:
                return s_of(eval(a['expr'], ns))
            except BaseException as e:
                return f'（{type(e).__name__}）'
            finally:
                for k, f in ORIG_RANDOM.items():
                    setattr(random, k, f)
        if a.get('error'):
            return res['err']['type'] if res['err'] else '沒有錯誤'
        if 'count' in a:
            return str(res['counts'].get(str(a['count']), 0))
        if 'file' in a:
            return norm_out(res['files'].get(a['file'], ''))
    return '（未知的 ask）'


def main():
    jobs = json.load(sys.stdin)
    out = []
    import time
    for j in jobs:
        try:
            t = time.time()
            r = run_job(j)
            r['ms'] = int((time.time() - t) * 1000)
            out.append(r)
        except BaseException as e:  # 不應發生；保留訊息方便除錯
            out.append({'out': '', 'err': {'type': 'InternalError', 'line': 0, 'msg': repr(e), 'tb': []}, 'vars': {}, 'vrepr': {}, 'files': {}, 'answers': [], 'counts': {}})
    sys.stdout.write(json.dumps(out, ensure_ascii=False))


if __name__ == '__main__':
    main()
