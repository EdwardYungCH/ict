#!/usr/bin/env python3
"""Python 自學平台 網站測試（Playwright）
用法：python3 py/tools/test_site.py <course> [單元,單元] [--shots 目錄] [--single 單一檔案目錄]
每個單元（1280 及 390 闊）：登記 → 每節「試」（一題故意錯）→ 鎖定後 ▶ 執行（Skulpt 輸出要與 CPython 相同）及 ⏭ 下一步
→ 練習先錯後對（一題 fill 用「看答案」只得 1 分）→ complete 用 Skulpt 核對 → 寫程式：起始程式不通過、語法錯誤、
參考答案在瀏覽器（Skulpt）通過全部測試 → 表格題 → 小測（一題故意錯）→ 無限練習 → 重新載入分數保留
→ 報告簽名在教師頁核對（竄改的報告要失敗）；深色模式、localStorage 封鎖、老師模式；
沒有 console 錯誤；390 闊不可橫向捲動；截圖存到 --shots（預設 /tmp/py_shots/<course>）。
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
def opt(name, default=None):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
SHOTS_ARG = opt('--shots')
SINGLE = opt('--single')
if not args:
    print(__doc__); sys.exit(2)
COURSE = os.path.abspath(args[0])
CJ = json.load(open(os.path.join(COURSE, 'course.json'), encoding='utf-8'))
PIN = CJ['pin']
SHOTS = SHOTS_ARG or os.path.join('/tmp/py_shots', os.path.basename(COURSE.rstrip('/')))
os.makedirs(SHOTS, exist_ok=True)
plan = [p[0] for p in CJ.get('plan', [])]
if len(args) > 1:
    UNITS = args[1].split(',')
else:
    have = [d for d in os.listdir(COURSE) if os.path.exists(os.path.join(COURSE, d, 'index.html')) and d != 'teacher']
    UNITS = [u for u in plan if u in have] + sorted([u for u in have if u not in plan])
URL = lambda p: 'file://' + os.path.join(COURSE, p)

results = []
def check(name, cond, info=''):
    results.append((name, bool(cond), info))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else f'  —— {str(info)[:400]}'), flush=True)

def new_page(browser, width, scheme='light', block_storage=False):
    ctx = browser.new_context(viewport={'width': width, 'height': 900}, color_scheme=scheme)
    ctx.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())
    if block_storage:
        ctx.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});")
    pg = ctx.new_page()
    pg.set_default_timeout(20000)
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_FAILED' not in m.text else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, pg, errs

def register(pg, cls='4A', no='12', name='陳大文'):
    pg.fill('.reg label:nth-of-type(1) input', cls)
    pg.fill('.reg label:nth-of-type(2) input', no)
    pg.fill('.reg label:nth-of-type(3) input', name)
    pg.click('#reg-go')

def no_hscroll(pg):
    return pg.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

def score(pg):
    return int(pg.inner_text('.scorebox b'))

def goto_sec(pg, i):
    pg.click(f'.prog li:nth-child({i + 1}) button')

def idle(pg):
    pg.wait_for_timeout(30)
    pg.wait_for_function('() => window.PyRun && PyRun.busy === 0 && ![...document.querySelectorAll("button")].some((b) => /核對中|評核中/.test(b.textContent))', timeout=60000)
    pg.wait_for_timeout(30)

def norm(s):
    lines = [l.rstrip() for l in s.replace('\r', '').split('\n')]
    while lines and not lines[-1]: lines.pop()
    while lines and not lines[0]: lines.pop(0)
    return '\n'.join(lines)

def L(pg, box):
    return pg.locator(box) if isinstance(box, str) else box

def shell_text(pg, box):
    return L(pg, box).locator('.shell').first.inner_text()

def run_ide(pg, ide):
    L(pg, ide).locator('.ide-bar button:has-text("執行")').first.click()
    idle(pg)
    return shell_text(pg, ide)

# 數字格式對照：float repr、round()、sum()、// 及 % 等（瀏覽器 Skulpt 要與 CPython 完全相同）
NUM_SAMPLE = '\n'.join([
    "print(0.1 + 0.2, 1.1 * 1.1, 2 / 3, 100 / 3, 7 / 2, 1e16, 1e-05, 0.0001, 3.0, 1e22, 123456789.0, 2 ** 0.5, -0.0)",
    "print(round(2.675, 2), round(7.45, 1), round(2.5), round(0.5), round(1.5), round(-2.5), round(0.125, 2), round(1.005, 2), round(2.345, 2), round(3.14159, 3), round(1234.5678, -2))",
    "print(sum([0.1] * 10), sum([0.1, 0.2, 0.3]), sum([1, 2, 0.5]), sum(range(5)), sum([1.5, 2.25]) / 2)",
    "print(-7 // 2, -7 % 3, 7.5 // 2, -7.5 % 2, 2 ** 10, 2 ** -1, 10 / 4, 10 // 4, int(3.99), int(-3.99), float(7))",
    "x = 7 / 3",
    "print(f'{x}', str(x), [x, 0.1], f'{x:.2f}', '%.3f' % x, format(x, '.1f'), x * 3)",
])
def cpython_out(code):
    import subprocess
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pyrun.py')], input=json.dumps([{'code': code}]), capture_output=True, text=True)
    return json.loads(r.stdout)[0]['out']
NUM_EXP = cpython_out(NUM_SAMPLE)

def uses_random(o):
    # 用了 random 而沒有 fixRandom：每次結果不同，不能比較輸出
    return bool(re.search(r'\brandom\b', o.get('code', ''))) and not o.get('fixRandom')

def full_run(browser, unit, width):
    ctx, pg, errs = new_page(browser, width)
    pg.goto(URL(f'{unit}/index.html'))
    check(f'{unit}@{width} 未登記時顯示登記表', pg.is_visible('.reg'))
    pg.click('#reg-go')
    check(f'{unit}@{width} 登記欄空白時不能開始', pg.is_visible('.reg') and '請填寫' in pg.inner_text('.reg'))
    register(pg)
    check(f'{unit}@{width} 登記後顯示姓名', '陳大文' in pg.inner_text('.who'))
    U = pg.evaluate('PY._unit')
    expect = 0
    wrong_try_done = False
    shown_done = False
    ran_endless = False
    for si, sec in enumerate(U['sections']):
        if si: goto_sec(pg, si)
        pg.wait_for_selector('#sec-title')
        check(f'{unit}@{width} 第 {si+1} 節「{sec["title"]}」標題', pg.inner_text('#sec-title') == sec['title'])
        check(f'{unit}@{width} 第 {si+1} 節沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_{width}_s{si+1}.png'), full_page=True)
        # ---- 學：sim ----
        if width >= 1000:
            sims = pg.locator('main .blk:has(> .pill.learn) > .ide')
            for k in range(sims.count()):
                ide = sims.nth(k)
                sh = run_ide(pg, ide)
                # 找對應的 sim 資料
                simdata = [b['sim'] for b in sec.get('learn', []) if 'sim' in b][k]
                exp = norm(simdata['_run']['out'])
                if uses_random(simdata):
                    check(f'{unit} {sec["id"]} sim {k+1}：用了隨機數，Skulpt 可以執行', '%Run' in sh and 'Traceback' not in sh or bool(simdata['_run']['err']), sh[-300:])
                    continue
                check(f'{unit} {sec["id"]} sim {k+1}：Skulpt 輸出與 CPython 相同', exp in norm(sh), f'{sh!r} vs {exp!r}')
                perr = simdata['_run']['err']
                if perr:
                    check(f'{unit} {sec["id"]} sim {k+1}：錯誤類型相同（{perr["type"]}）', perr['type'] in sh or (perr['type'] == 'Timeout' and '超時' in sh), sh[-200:])
                if simdata.get('step'):
                    ide.locator('.ide-bar button:has-text("下一步")').click()
                    check(f'{unit} {sec["id"]} sim {k+1} 逐步執行高亮一行', ide.locator('.ln.hl').count() == 1)
        # ---- 試 ----
        for it in sec.get('tries', []):
            box = f'.try-item[data-id="{it["id"]}"]'
            right = it['_right']
            check(f'{it["id"]} 未鎖定前不能執行', pg.is_disabled(f'{box} .ide-bar button:has-text("執行")'))
            sel = right if wrong_try_done else (right + 1) % len(it['options'])
            pg.click(f'{box} label.opt >> nth={sel}')
            pg.click(f'{box} button:has-text("鎖定答案")')
            good = sel == right
            fb = pg.inner_text(f'{box} .fb')
            check(f'{it["id"]} 估{"對" if good else "錯（故意）"}的回饋', ('估對了' in fb) if good else ('估錯了' in fb), fb)
            if good: expect += it['pts']
            wrong_try_done = True
            pg.click(f'{box} .ide-bar button:has-text("下一步")')
            check(f'{it["id"]} 逐步執行高亮一行', pg.locator(f'{box} .ln.hl').count() == 1)
            sh = run_ide(pg, box)
            exp = norm(it['_run']['out'])
            if uses_random(it): exp = ''
            check(f'{it["id"]} ▶ 執行：Skulpt 輸出與 CPython 相同', exp in norm(sh), f'{sh!r} vs {exp!r}')
            if it['_run']['err']:
                check(f'{it["id"]} ▶ 執行：錯誤類型與 CPython 相同（{it["_run"]["err"]["type"]}）', it['_run']['err']['type'] in sh, sh[-300:])
        # ---- 練 ----
        for it in sec.get('practice', []):
            box = f'.prac-item[data-id="{it["id"]}"]'
            if not shown_done and it['type'] == 'fill':
                before = score(pg)
                pg.click(f'{box} button:has-text("看答案")')
                check(f'{it["id"]} 看答案只得 1 分', score(pg) == before + 1, f'{before} → {score(pg)}')
                expect += 1; shown_done = True
                continue
            t = it['type']
            if t == 'mc':
                right = it['_right']; n = len(it['options'])
                pg.click(f'{box} label.opt >> nth={(right + 1) % n}')
                pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
                check(f'{it["id"]} 選錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                w2 = (right + 2) % n if (right + 2) % n != right else (right + 1) % n
                pg.click(f'{box} label.opt >> nth={w2}')
                pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
                check(f'{it["id"]} 答錯兩次出提示', '提示' in pg.inner_text(f'{box} .fb.bad'))
                pg.click(f'{box} label.opt >> nth={right}')
            elif t == 'fill':
                ans = it['_ans']
                ins = pg.locator(f'{box} .fillrow .txt')
                for k in range(ins.count()): ins.nth(k).fill('zzz')
                pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
                check(f'{it["id"]} 填錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                for k in range(ins.count()): ins.nth(k).fill(ans[k])
            elif t == 'trace':
                tr = it['_trace']
                flat = [c['v'] if c['changed'] else '' for r in tr['rows'] for c in r['cells']]
                cells = pg.locator(f'{box} input.cell')
                check(f'{it["id"]} 追蹤表格數正確', cells.count() == len(flat), f'{cells.count()} vs {len(flat)}')
                first = next(i for i, v in enumerate(flat) if v)
                cells.nth(first).fill('999')
                pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
                check(f'{it["id"]} 追蹤表填錯有紅格', pg.locator(f'{box} input.cell.no').count() >= 1)
                for k, v in enumerate(flat): cells.nth(k).fill(v)
            elif t == 'complete':
                bl = pg.locator(f'{box} input.blank')
                for k in range(bl.count()): bl.nth(k).fill('1')
                pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
                fbt = pg.inner_text(f'{box} .fb.bad')
                check(f'{it["id"]} 補完錯誤時說明哪組數據及原因', '第 1 組' in fbt or '組' in fbt, fbt)
                for k in range(bl.count()): bl.nth(k).fill(it['ref'][k])
            before = score(pg)
            pg.click(f'{box} button:has-text("核對答案")'); idle(pg)
            ok = pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + it['pts']
            check(f'{it["id"]} 改正後答對得全分{"（Skulpt 與 CPython 結果相同）" if t == "complete" else ""}', ok, pg.inner_text(f'{box}')[-500:])
            expect += it['pts']
        # ---- 寫程式／分析題 ----
        for task in sec.get('tasks', []):
            box = f'.write-item[data-id="{task["id"]}"]'
            if task.get('kind') == 'table':
                ans = pg.evaluate('(t) => PY.tableAnswers(t)', task)
                ctrls = pg.locator(f'{box} .anatab select, {box} .anatab input')
                n = ctrls.count()
                check(f'{task["id"]} 表格空格數目正確', n == len(ans), f'{n} vs {len(ans)}')
                def wrong_val(k):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT':
                        opts = [o for o in el.evaluate('e => [...e.options].map(o => o.value)') if o and o != ans[k]]
                        el.select_option(opts[0])
                    else: el.fill('zzz')
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 未填完有提示', '請完成' in pg.inner_text(f'{box} .fbslot'))
                for k in range(n): wrong_val(k)
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 答錯有紅格及提示', pg.locator(f'{box} .anatab .no').count() == n and '不正確' in pg.inner_text(f'{box} .fbslot'))
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 錯兩次後可看答案', pg.is_visible(f'{box} button:has-text("看答案")'))
                for k in range(n):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT': el.select_option(ans[k])
                    else: el.fill(ans[k])
                before = score(pg)
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 改正後全對得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'])
                expect += task['pts']
                continue
            ta = f'{box} .ed textarea'
            pg.fill(ta, task.get('starter', ''))
            pg.click(f'{box} button:has-text("提交評核")'); idle(pg)
            fbt = pg.inner_text(f'{box} > div[aria-live]')
            rule_hit = any((r.get('msg') or '') and r['msg'] in fbt for r in task.get('rules', []))
            check(f'{task["id"]} 起始程式不通過並指出哪組數據（或違反的規定）', ('第 1 組' in fbt and '不通過' in fbt) or rule_hit, fbt[:300])
            bad = 'x = (\n' + task['ref']
            pg.fill(ta, bad)
            pg.click(f'{box} button:has-text("提交評核")'); idle(pg)
            fbt = pg.inner_text(f'{box} > div[aria-live]')
            check(f'{task["id"]} 語法錯誤有說明', 'SyntaxError' in fbt or '執行出錯' in fbt or any((r.get('msg') or '') in fbt for r in task.get('rules', []) if r.get('msg')), fbt[:300])
            check(f'{task["id"]} 錯兩次後可看參考答案', pg.is_visible(f'{box} button:has-text("看參考答案")'))
            pg.fill(ta, task['ref'])
            sh = run_ide(pg, box)
            check(f'{task["id"]} 編輯器內 ▶ 執行參考答案（第 1 組輸入）與 CPython 相同', norm(task['_exp'][0]['out']) in norm(sh) and 'Traceback' not in sh, f'{sh!r} vs {task["_exp"][0]["out"]!r}')
            before = score(pg)
            pg.click(f'{box} button:has-text("提交評核")'); idle(pg)
            check(f'{task["id"]} 參考答案在瀏覽器（Skulpt）通過全部 {len(task["tests"])} 組測試，得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'], pg.inner_text(f'{box} > div[aria-live]')[:500])
            expect += task['pts']
        # ---- 小測 ----
        if sec.get('kind') == 'quiz':
            check(f'{unit} 小測不提供執行器', pg.locator('main .ide').count() == 0)
            items = sec['items']
            for k, it in enumerate(items):
                right = it['_right']
                sel = right if k else (right + 1) % len(it['options'])
                pg.click(f'.blk[data-id="{it["id"]}"] label.opt >> nth={sel}')
                if sel == right: expect += it['pts']
            before = score(pg)
            pg.click('button:has-text("提交小測")')
            gained = sum(it['pts'] for it in items[1:])
            check(f'{unit} 小測提交後計分（一題故意錯）', score(pg) == before + gained, f'{before} → {score(pg)}')
        # ---- 無限練習 ----
        if sec.get('kind') == 'endless':
            for k in range(6):
                if pg.locator('main .endopts').count():
                    pg.click('main .endopts button >> nth=0')
                else:
                    pg.fill('main .row > .txt', '0')
                pg.click('main button:has-text("核對")')
                check(f'{unit}@{width} 無限練習計次數（第 {k+1} 題）', f'已做 {k+1} 題' in pg.inner_text('main'))
                if not ran_endless and pg.locator('main .ide').count():
                    sh = run_ide(pg, pg.locator('main .ide').first)
                    check(f'{unit} 無限練習題目可以 ▶ 執行', '%Run' in sh and 'Traceback' not in sh or '錯誤' in pg.inner_text('main .q'), sh[-200:])
                    ran_endless = True
                pg.click('main button:has-text("再練一題")')
                check(f'{unit}@{width} 再練一題出新題', pg.locator('main .fb').count() == 0)
    check(f'{unit}@{width} 總分正確（{expect}）', score(pg) == expect, f'頁面 {score(pg)}')
    pg.reload()
    check(f'{unit}@{width} 重新載入後分數保留', score(pg) == expect)
    goto_sec(pg, len(U['sections']) - 1)
    pg.click('button:has-text("產生報告")')
    rep = pg.input_value('textarea.report')
    check(f'{unit}@{width} 報告含分數及簽名', f'總分：{expect} / 100' in rep and '"sig":"' in rep, rep[:200])
    check(f'{unit}@{width} 報告頁沒有橫向捲動', no_hscroll(pg))
    pg.screenshot(path=os.path.join(SHOTS, f'{unit}_{width}_report.png'), full_page=True)
    check(f'{unit}@{width} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    return rep

def teacher_verify(browser, reps, width=1280):
    ctx, pg, errs = new_page(browser, width)
    pg.goto(URL('teacher/index.html'))
    pg.fill('input[type=password]', 'wrong'); pg.click('#pin-go')
    check(f'教師頁@{width} PIN 錯誤時不能進入', 'PIN 不正確' in pg.inner_text('main'))
    pg.fill('input[type=password]', PIN); pg.click('#pin-go')
    tampered = reps[0].replace('"score":', '"score":1', 1)
    pg.fill('textarea.report', '\n\n'.join(reps + [tampered]))
    pg.click('#verify-go')
    t = pg.inner_text('#rep-table')
    check(f'教師頁@{width}：簽名正確的報告', t.count('✓ 簽名正確') == len(reps), t[:300])
    check(f'教師頁@{width}：竄改了的報告簽名不符', '✗ 簽名不符' in t)
    check(f'教師頁@{width}：匯總表有學生資料', '陳大文' in t)
    sheets = pg.locator('details.ansheet')
    for k in range(sheets.count()):
        sheets.nth(k).locator('summary').click()
    check(f'教師頁@{width}：答案及重點', pg.locator('details.ansheet table').count() >= len(UNITS))
    check(f'教師頁@{width} 沒有橫向捲動', no_hscroll(pg))
    pg.screenshot(path=os.path.join(SHOTS, f'teacher_{width}.png'), full_page=True)
    check(f'教師頁@{width} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()

def extras(browser, unit):
    # 深色模式＋手機：每節執行所有可執行的 ide
    ctx, pg, errs = new_page(browser, 390, scheme='dark')
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    bg = pg.evaluate('getComputedStyle(document.body).backgroundColor')
    check(f'{unit} 深色模式背景是深色', bg == 'rgb(20, 24, 22)', bg)
    U = pg.evaluate('PY._unit')
    for si, sec in enumerate(U['sections']):
        if si: goto_sec(pg, si)
        for d in pg.locator('main details.ide-trace').all():
            if d.get_attribute('open') is None: d.locator('summary').click()
        for b in pg.locator('main .ide-bar button:has-text("下一步"):not([disabled])').all():
            b.click(); b.click()
        check(f'{unit}@390 深色 第 {si+1} 節沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_390dark_s{si+1}.png'), full_page=True)
    pg.click('footer button:has-text("淺色")')
    check(f'{unit} 主題切換到淺色', pg.evaluate('document.documentElement.getAttribute("data-theme")') == 'light')
    check(f'{unit} 深色模式沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 編輯器功能：Tab、自動縮排、無限循環、input 不夠時在 Shell 問、錯誤中文解釋
    ctx, pg, errs = new_page(browser, 1280)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    wsec = next((i for i, s in enumerate(U['sections']) if s.get('kind') == 'write' and any(t.get('kind') != 'table' for t in s['tasks'])), None)
    if wsec is not None:
        pg.evaluate('(i) => { const S = PY._state(); S.visited = [...Array(i + 1).keys()]; PY._ctx.refresh(); }', wsec)
        goto_sec(pg, wsec)
        task = next(t for t in U['sections'][wsec]['tasks'] if t.get('kind') != 'table')
        box = f'.write-item[data-id="{task["id"]}"]'
        ta = pg.locator(f'{box} .ed textarea')
        ta.fill('')
        ta.click()
        pg.keyboard.type('if True:')
        pg.keyboard.press('Enter')
        pg.keyboard.type('x = 1')
        check(f'{unit} 編輯器 Enter 後自動縮排 4 格', ta.input_value() == 'if True:\n    x = 1', repr(ta.input_value()))
        ta.fill('while True:\n    pass')
        sh = run_ide(pg, box)
        check(f'{unit} 無限循環會自動停止並有中文說明', '超時' in sh and '無限循環' in pg.inner_text(f'{box} .assist'), sh)
        ta.fill('a = input("a? ")\nb = input("b? ")\nprint(a + b)')
        pg.fill(f'{box} .ide-in', '1')
        pg.click(f'{box} .ide-bar button:has-text("執行")')
        pg.wait_for_selector(f'{box} .shell-in')
        pg.fill(f'{box} .shell-in', '2'); pg.press(f'{box} .shell-in', 'Enter'); idle(pg)
        sh = shell_text(pg, box)
        check(f'{unit} input() 不夠時在 Shell 問', 'a? 1\nb? 2\n12' in sh, repr(sh))
        ta.fill('x = 5\nprint("x" + x)')
        sh = run_ide(pg, box)
        check(f'{unit} TypeError 顯示 Traceback 及中文解釋', 'TypeError: can only concatenate str (not "int") to str' in sh and '字串' in pg.inner_text(f'{box} .assist'), sh)
        ta.fill('x = 1\nif x > 0\n    print(x)')
        sh = run_ide(pg, box)
        check(f'{unit} 漏冒號顯示 SyntaxError: expected \':\'', "SyntaxError: expected ':'" in sh and 'line 2' in sh, sh)
        check(f'{unit} 錯誤行在編輯器標紅', pg.locator(f'{box} .ed-gut .e').count() == 1)
    check(f'{unit} 編輯器測試沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 數字格式：Skulpt 與 CPython 相同
    ctx, pg, errs = new_page(browser, 1280)
    pg.goto(URL(f'{unit}/index.html'))
    got = pg.evaluate('(c) => PyRun.run(c, {}).then((r) => r.out + (r.err ? "ERR " + r.err.type : ""))', NUM_SAMPLE)
    check(f'{unit} float／round()／sum() 的輸出與 CPython 完全相同', got == NUM_EXP, f'Skulpt {got!r}\nCPython {NUM_EXP!r}')
    ctx.close()
    # localStorage 封鎖
    ctx, pg, errs = new_page(browser, 1280, block_storage=True)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    check(f'{unit} localStorage 封鎖時仍可使用並有提示', '不能儲存進度' in pg.inner_text('footer') and pg.is_visible('#sec-title'))
    s0 = U['sections'][0]
    if s0.get('tries'):
        it = s0['tries'][0]
        pg.click(f'.try-item[data-id="{it["id"]}"] label.opt >> nth={it["_right"]}')
        pg.click(f'.try-item[data-id="{it["id"]}"] button:has-text("鎖定答案")')
    else:
        it = next(x for x in s0['practice'] if x['type'] == 'mc')
        pg.click(f'.prac-item[data-id="{it["id"]}"] label.opt >> nth={it["_right"]}')
        pg.click(f'.prac-item[data-id="{it["id"]}"] button:has-text("核對答案")'); idle(pg)
    check(f'{unit} localStorage 封鎖時仍可計分', score(pg) == it['pts'])
    check(f'{unit} localStorage 封鎖時沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 老師模式
    ctx, pg, errs = new_page(browser, 1280)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    pg.click('footer button:has-text("老師")')
    pg.fill('footer input[type=password]', PIN)
    pg.click('footer button:has-text("確定")')
    check(f'{unit} 老師模式顯示答案', pg.locator('.ans').count() > 0)
    n = len(U['sections'])
    check(f'{unit} 老師模式可跳節', not pg.is_disabled(f'.prog li:nth-child({n}) button'))
    ctx.close()
    # 單一檔案版
    if SINGLE:
        for name in (f'{unit}_單一檔案.html', 'teacher_單一檔案.html'):
            p = os.path.join(SINGLE, name)
            if not os.path.exists(p): continue
            src = open(p, encoding='utf-8').read()
            check(f'{name} 以 <title> 開始、沒有 doctype/html/head/body', src.startswith('<title>') and not re.search(r'^\s*(<!doctype|<html|<head|<body)', src, re.I | re.M))
            ctx, pg, errs = new_page(browser, 1280)
            pg.goto('file://' + p)
            if 'teacher' in name:
                check(f'{name} 可載入', pg.is_visible('#pin-go'))
            else:
                register(pg); check(f'{name} 可載入', pg.is_visible('#sec-title'))
                ide = pg.locator('main .ide').first
                if ide.count() and not ide.locator('.ide-bar button:has-text("執行")').is_disabled():
                    ide.locator('.ide-bar button:has-text("執行")').click(); idle(pg)
                    check(f'{name} Skulpt 可執行', '%Run' in ide.locator('.shell').inner_text())
            check(f'{name} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
            ctx.close()

with sync_playwright() as p:
    browser = p.chromium.launch()
    reps = []
    for u in UNITS:
        if not os.path.exists(os.path.join(COURSE, u, 'index.html')):
            check(f'{u} 頁面存在（先執行 build）', False); continue
        reps.append(full_run(browser, u, 1280))
        reps.append(full_run(browser, u, 390))
        extras(browser, u)
    if reps:
        teacher_verify(browser, reps)
        teacher_verify(browser, reps, 390)
    browser.close()

bad = [r for r in results if not r[1]]
print(f'\n網站測試：{len(results) - len(bad)} 項通過，{len(bad)} 項失敗（截圖：{SHOTS}）')
for r in bad: print('  FAIL', r[0])
sys.exit(1 if bad else 0)
