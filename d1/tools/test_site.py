#!/usr/bin/env python3
"""D1 自學平台 網站測試（Playwright）
每單元：登記 → 每節試一試估一題（含一題故意錯）→ 練習先錯後對 → 看答案只得 1 分
→ 寫算法三層先錯後對 → 小測 → 無限練習 → 報告簽名可在教師頁驗證；
1366 及 400 闊度；深色模式；localStorage 封鎖；沒有 console 錯誤；不可橫向捲動。
用法：python3 d1/tools/test_site.py [截圖目錄] [單元，例如 u3]
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

D1 = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D1, 'tools', 'shots')
UNITS = sys.argv[2].split(',') if len(sys.argv) > 2 else sorted(
    [d for d in os.listdir(D1) if re.fullmatch(r'u\d+', d)], key=lambda x: int(x[1:]))
os.makedirs(SHOTS, exist_ok=True)
URL = lambda p: 'file://' + os.path.join(D1, p)

results = []
def check(name, cond, info=''):
    results.append((name, bool(cond), info))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else f'  —— {info}'))

def new_page(browser, width, scheme='light', block_storage=False):
    ctx = browser.new_context(viewport={'width': width, 'height': 900}, color_scheme=scheme)
    ctx.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())
    if block_storage:
        ctx.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});")
    pg = ctx.new_page()
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

def unit_data(pg):
    return pg.evaluate('D1._unit')

def score(pg):
    return int(pg.inner_text('.scorebox b'))

def goto_sec(pg, i):
    pg.click(f'.prog li:nth-child({i + 1}) button')

def full_run(browser, unit, width):
    ctx, pg, errs = new_page(browser, width)
    pg.goto(URL(f'{unit}/index.html'))
    check(f'{unit}@{width} 未登記時顯示登記表', pg.is_visible('.reg'))
    pg.click('#reg-go')
    check(f'{unit}@{width} 登記欄空白時不能開始', pg.is_visible('.reg') and '請填寫' in pg.inner_text('.reg'))
    register(pg)
    check(f'{unit}@{width} 登記後顯示姓名', '陳大文' in pg.inner_text('.who'))
    U = unit_data(pg)
    expect = 0
    wrong_try_done = False
    shown_done = False
    for si, sec in enumerate(U['sections']):
        goto_sec(pg, si) if si else None
        pg.wait_for_selector('#sec-title')
        check(f'{unit}@{width} 第 {si+1} 節「{sec["title"]}」標題', pg.inner_text('#sec-title') == sec['title'])
        check(f'{unit}@{width} 第 {si+1} 節沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_{width}_s{si+1}.png'), full_page=True)
        # ---- 試 ----
        for it in sec.get('tries', []):
            box = f'.try-item[data-id="{it["id"]}"]'
            right = pg.evaluate('(it) => D1.correctIndex(it)', it)
            check(f'{it["id"]} 未鎖定前不能執行', pg.is_disabled(f'{box} .sim-bar button:has-text("下一步")'))
            sel = right if wrong_try_done else (right + 1) % len(it['options'])
            pg.click(f'{box} label.opt >> nth={sel}')
            pg.click(f'{box} button:has-text("鎖定答案")')
            good = sel == right
            fb = pg.inner_text(f'{box} .fb')
            check(f'{it["id"]} 估{"對" if good else "錯（故意）"}的回饋', ('估對了' in fb) if good else ('估錯了' in fb), fb)
            if good: expect += it['pts']
            wrong_try_done = True
            pg.click(f'{box} .sim-bar button:has-text("下一步")')
            check(f'{it["id"]} 逐步執行高亮第 1 行', pg.locator(f'{box} .ln.hl').count() == 1)
            pg.click(f'{box} .sim-bar button:has-text("執行到底")')
            out = pg.inner_text(f'{box} .outbox')
            ans = pg.evaluate('(it) => D1.askAnswer(it)', it)
            check(f'{it["id"]} 模擬器輸出與答案一致', ' '.join(out.split()) == ans, f'{out!r} vs {ans!r}')
            if 'flow' in it.get('open', []):
                check(f'{it["id"]} 流程圖有高亮路線', pg.locator(f'{box} .fc-edge.on').count() > 0)
            if 'trace' in it.get('open', []):
                check(f'{it["id"]} 追蹤表有內容', pg.locator(f'{box} table.trace tbody tr').count() > 0)
        # ---- 練 ----
        for it in sec.get('practice', []):
            box = f'.prac-item[data-id="{it["id"]}"]'
            show_this = not shown_done and it['type'] == 'fill'
            if show_this:
                before = score(pg)
                pg.click(f'{box} button:has-text("看答案")')
                check(f'{it["id"]} 看答案只得 1 分', score(pg) == before + 1, f'{before} → {score(pg)}')
                expect += 1; shown_done = True
                continue
            t = it['type']
            if t == 'mc':
                right = pg.evaluate('(it) => D1.correctIndex(it)', it)
                pg.click(f'{box} label.opt >> nth={(right + 1) % len(it["options"])}')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 選錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                pg.click(f'{box} label.opt >> nth={(right + 2) % len(it["options"])}' if (right + 2) % len(it['options']) != right else f'{box} label.opt >> nth={(right + 3) % len(it["options"])}')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 答錯兩次出提示', '提示' in pg.inner_text(f'{box} .fb.bad'))
                pg.click(f'{box} label.opt >> nth={right}')
            elif t == 'fill':
                ans = pg.evaluate('(it) => D1.fillAnswers(it)', it)
                ins = pg.locator(f'{box} input.txt')
                for k in range(ins.count()): ins.nth(k).fill('zzz')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 填錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                for k in range(ins.count()): ins.nth(k).fill(ans[k])
            elif t == 'trace':
                tr = pg.evaluate('(it) => { const t = D1.traceOf(it); return t.rows.map((r) => t.cols.map((c) => r.cells[c.key].changed ? r.cells[c.key].v : "")); }', it)
                cells = pg.locator(f'{box} input.cell')
                flat = [v for r in tr for v in r]
                first = next(i for i, v in enumerate(flat) if v)
                cells.nth(first).fill('999')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 追蹤表填錯有紅格', pg.locator(f'{box} input.cell.no').count() >= 1)
                for k, v in enumerate(flat): cells.nth(k).fill(v)
            elif t == 'complete':
                bl = pg.locator(f'{box} input.blank')
                for k in range(bl.count()): bl.nth(k).fill('1')
                pg.click(f'{box} button:has-text("核對答案")')
                fbt = pg.inner_text(f'{box} .fb.bad')
                check(f'{it["id"]} 補完錯誤時說明期望與實際輸出', '期望輸出' in fbt, fbt)
                for k in range(bl.count()): bl.nth(k).fill(it['ref'][k])
            before = score(pg)
            pg.click(f'{box} button:has-text("核對答案")')
            check(f'{it["id"]} 改正後答對得全分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + it['pts'], f'{before} → {score(pg)}')
            expect += it['pts']
        # ---- 寫算法 ----
        for task in sec.get('tasks', []):
            box = f'.write-item[data-id="{task["id"]}"]'
            if task.get('kind') == 'table':
                ans = pg.evaluate('(t) => D1.tableAnswers(t)', task)
                ctrls = pg.locator(f'{box} .anatab select, {box} .anatab input')
                n = ctrls.count()
                check(f'{task["id"]}（{task["tier"]}）表格空格數目正確', n == len(ans), f'{n} vs {len(ans)}')
                def wrong_val(k):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT':
                        opts = [o for o in el.evaluate('e => [...e.options].map(o => o.value)') if o and o != ans[k]]
                        el.select_option(opts[0])
                    else: el.fill('zzz')
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 未填完有提示', '請完成' in pg.inner_text(f'{box} .fb'))
                for k in range(n): wrong_val(k)
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 答錯有紅格及提示', pg.locator(f'{box} .anatab .no').count() == n and '不正確' in pg.inner_text(f'{box} .fb'), f"{pg.locator(f'{box} .anatab .no').count()} {n} {pg.inner_text(f'{box} .fb')}")
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 錯兩次後可看答案', pg.is_visible(f'{box} button:has-text("看答案")'))
                for k in range(n):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT': el.select_option(ans[k])
                    else: el.fill(ans[k])
                before = score(pg)
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 改正後全對得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'], pg.inner_text(f'{box} .fb')[:120])
                expect += task['pts']
                continue
            ta = f'{box} textarea'
            pg.fill(ta, task.get('starter', '').replace('\n\n', '\nZ ← 1\n') if '\n\n' in task.get('starter', '') else task.get('starter', '') + '\n輸出 1')
            pg.click(f'{box} button:has-text("提交評核")')
            fbt = pg.inner_text(f'{box} .fb')
            check(f'{task["id"]}（{task["tier"]}）錯誤程式不通過並指出哪組數據', '第 1 組' in fbt and ('期望' in fbt), fbt[:160])
            pg.fill(ta, 'A ← \n輸出 A')
            pg.click(f'{box} button:has-text("提交評核")')
            check(f'{task["id"]} 語法錯誤有行號', '第 1 行' in pg.inner_text(f'{box} .fb'))
            check(f'{task["id"]} 錯兩次後可看參考答案', pg.is_visible(f'{box} button:has-text("看參考答案")'))
            pg.fill(ta, task['ref'])
            pg.click(f'{box} .sim-bar button:has-text("執行到底")')
            check(f'{task["id"]} 編輯器內可執行', pg.inner_text(f'{box} .outbox').strip() != '')
            before = score(pg)
            pg.click(f'{box} button:has-text("提交評核")')
            check(f'{task["id"]} 改正後全部通過得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'], pg.inner_text(f'{box} .fb')[:120])
            expect += task['pts']
        # ---- 小測 ----
        if sec.get('kind') == 'quiz':
            check(f'{unit} 小測不提供模擬器', pg.locator('.sim').count() == 0)
            items = sec['items']
            for k, it in enumerate(items):
                right = pg.evaluate('(it) => D1.correctIndex(it)', it)
                sel = right if k else (right + 1) % 4
                pg.click(f'.blk[data-id="{it["id"]}"] label.opt >> nth={sel}')
                if sel == right: expect += it['pts']
            before = score(pg)
            pg.click('button:has-text("提交小測")')
            gained = sum(it['pts'] for it in items[1:])
            check(f'{unit} 小測提交後計分（一題故意錯）', score(pg) == before + gained, f'{before} → {score(pg)}')
            check(f'{unit} 小測標示出處', '出處' in pg.inner_text('main'))
        # ---- 無限練習 ----
        if sec.get('kind') == 'endless':
            for k in range(6):
                if pg.locator('main .endopts').count():
                    pg.click('main .endopts button >> nth=0')
                else:
                    pg.fill('main input.txt', '0')
                pg.click('main button:has-text("核對")')
                check(f'{unit} 無限練習計次數（第 {k+1} 題）', f'已做 {k+1} 題' in pg.inner_text('main'))
                pg.click('main button:has-text("再練一題")')
                check(f'{unit} 再練一題出新題', pg.locator('main .fb').count() == 0)
    check(f'{unit}@{width} 總分正確（{expect}）', score(pg) == expect, f'頁面 {score(pg)}')
    # 重新載入，進度仍在
    pg.reload()
    check(f'{unit}@{width} 重新載入後分數保留', score(pg) == expect)
    # 報告
    last = len(U['sections']) - 1
    goto_sec(pg, last)
    pg.click('button:has-text("產生報告")')
    rep = pg.input_value('textarea.report')
    check(f'{unit}@{width} 報告含分數及簽名', f'總分：{expect} / 100' in rep and '"sig":"' in rep, rep[:200])
    check(f'{unit}@{width} 報告頁沒有橫向捲動', no_hscroll(pg))
    pg.screenshot(path=os.path.join(SHOTS, f'{unit}_{width}_report.png'), full_page=True)
    check(f'{unit}@{width} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    return rep

def teacher_verify(browser, reps, width=1366):
    ctx, pg, errs = new_page(browser, width)
    pg.goto(URL('teacher/index.html'))
    pg.fill('input[type=password]', 'wrong'); pg.click('#pin-go')
    check('教師頁 PIN 錯誤時不能進入', 'PIN 不正確' in pg.inner_text('main'))
    pg.fill('input[type=password]', 'd1ict2026'); pg.click('#pin-go')
    tampered = reps[0].replace('"score":', '"score":1', 1)
    pg.fill('textarea.report', '\n\n'.join(reps + [tampered]))
    pg.click('#verify-go')
    t = pg.inner_text('#rep-table')
    check('教師頁：簽名正確的報告', t.count('✓ 簽名正確') == len(reps), t[:300])
    check('教師頁：竄改了的報告簽名不符', '✗ 簽名不符' in t)
    check('教師頁：匯總表有學生資料', '陳大文' in t)
    pg.click('details.ansheet summary')
    pg.wait_for_selector('details.ansheet table', timeout=5000)
    check('教師頁：答案及重點', '答案' in pg.inner_text('details.ansheet') and pg.locator('details.ansheet table').count() > 0)
    check('教師頁沒有橫向捲動', no_hscroll(pg))
    pg.screenshot(path=os.path.join(SHOTS, f'teacher_{width}.png'), full_page=True)
    check('教師頁沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()

def dark_and_blocked(browser, unit):
    ctx, pg, errs = new_page(browser, 400, scheme='dark')
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    bg = pg.evaluate('getComputedStyle(document.body).backgroundColor')
    check(f'{unit} 深色模式背景是深色', bg in ('rgb(20, 24, 22)',), bg)
    U = unit_data(pg)
    for si, sec in enumerate(U['sections']):
        if si: goto_sec(pg, si)
        # 打開所有流程圖／追蹤表並執行
        for d in pg.locator('main .sim-panels details').all():
            if not d.get_attribute('open') is not None: d.locator('summary').click()
        for b in pg.locator('main .sim-bar button:has-text("執行到底"):not([disabled])').all():
            b.click()
        check(f'{unit}@400 深色 第 {si+1} 節沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_400dark_s{si+1}.png'), full_page=True)
    # 主題切換
    pg.click('footer button:has-text("淺色")')
    check(f'{unit} 主題切換到淺色', pg.evaluate('document.documentElement.getAttribute("data-theme")') == 'light')
    check(f'{unit} 深色模式沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # localStorage 封鎖
    ctx, pg, errs = new_page(browser, 1366, block_storage=True)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    check(f'{unit} localStorage 封鎖時仍可使用並有提示', '不能儲存進度' in pg.inner_text('footer') and pg.is_visible('#sec-title'))
    it = U['sections'][0]['tries'][0]
    right = pg.evaluate('(it) => D1.correctIndex(it)', it)
    pg.click(f'.try-item[data-id="{it["id"]}"] label.opt >> nth={right}')
    pg.click(f'.try-item[data-id="{it["id"]}"] button:has-text("鎖定答案")')
    check(f'{unit} localStorage 封鎖時仍可計分', score(pg) == it['pts'])
    check(f'{unit} localStorage 封鎖時沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 老師模式
    ctx, pg, errs = new_page(browser, 1366)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    pg.click('footer button:has-text("老師")')
    pg.fill('footer input[type=password]', 'd1ict2026')
    pg.click('footer button:has-text("確定")')
    check(f'{unit} 老師模式顯示答案', pg.locator('.ans').count() > 0)
    n = len(U['sections'])
    check(f'{unit} 老師模式可跳節', not pg.is_disabled(f'.prog li:nth-child({n}) button'))
    goto_sec(pg, n - 2)
    check(f'{unit} 老師模式跳到最後幾節', pg.is_visible('#sec-title'))
    ctx.close()
    # 單一檔案版能載入
    for name in (f'{unit}_單一檔案.html', 'teacher_單一檔案.html'):
        p = os.path.join('/home/claude/d1site/out', name)
        if not os.path.exists(p): continue
        src = open(p, encoding='utf-8').read()
        check(f'{name} 以 <title> 開始、沒有 doctype/html/head/body', src.startswith('<title>') and not re.search(r'<!doctype|<html|<head|<body', src, re.I))
        ctx, pg, errs = new_page(browser, 1366)
        pg.goto('file://' + p)
        if 'teacher' in name:
            check(f'{name} 可載入', pg.is_visible('#pin-go'))
        else:
            register(pg); check(f'{name} 可載入', pg.is_visible('#sec-title'))
        check(f'{name} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
        ctx.close()

with sync_playwright() as p:
    browser = p.chromium.launch()
    reps = []
    for u in UNITS:
        reps.append(full_run(browser, u, 1366))
        reps.append(full_run(browser, u, 400))
        dark_and_blocked(browser, u)
    teacher_verify(browser, reps)
    teacher_verify(browser, reps, 400)
    browser.close()

bad = [r for r in results if not r[1]]
print(f'\n網站測試：{len(results) - len(bad)} 項通過，{len(bad)} 項失敗')
sys.exit(1 if bad else 0)
