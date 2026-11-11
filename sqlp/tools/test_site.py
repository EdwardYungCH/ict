#!/usr/bin/env python3
"""選修A SQL 自學平台 網站測試（Playwright）
每單元：登記 → 每節「學」的 SQL 控制台可執行 → 試（一題故意估錯）→ 練習先錯後對（一題看答案只得 1 分）
→ 寫SQL：起始程式不通過、語法錯誤有標籤、錯兩次可看參考答案、參考答案在瀏覽器內執行及通過 → 小測（一題故意錯）
→ 無限練習 → 重新載入分數保留 → 報告簽名可在教師頁核對（竄改的報告會被識破）；
桌面 1366 及手機 390 闊度截圖、不可橫向捲動、沒有 console 錯誤；深色模式、localStorage 封鎖、老師模式。
用法：python3 sqlp/tools/test_site.py <課程資料夾> [單元,單元] [--shots 目錄] [--single 單一檔案目錄]
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
args = sys.argv[1:]
opt = {}
pos = []
i = 0
while i < len(args):
    if args[i] in ('--shots', '--single'):
        opt[args[i][2:]] = args[i + 1]; i += 2
    else:
        pos.append(args[i]); i += 1
if not pos:
    print(__doc__); sys.exit(2)
CDIR = os.path.abspath(pos[0]) if os.path.exists(os.path.join(os.path.abspath(pos[0]), 'course.json')) else os.path.join(ROOT, pos[0])
COURSE = json.load(open(os.path.join(CDIR, 'course.json'), encoding='utf-8'))
PIN = COURSE.get('pin', '')
if len(pos) > 1:
    UNITS = pos[1].split(',')
else:
    _ids = [f[:-3] for f in os.listdir(os.path.join(CDIR, 'src')) if f.endswith('.js')] if os.path.isdir(os.path.join(CDIR, 'src')) else []
    _plan = [p[0] for p in COURSE.get('plan', [])]
    def _key(u):
        k = next((i for i, p in enumerate(_plan) if u == p or (u.startswith(p) and len(u) == len(p) + 1)), 99)
        return (k, [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', u)])
    UNITS = sorted([u for u in _ids if os.path.exists(os.path.join(CDIR, u, 'index.html'))], key=_key)
SHOTS = opt.get('shots') or os.path.join(HERE, 'shots', os.path.basename(CDIR))
os.makedirs(SHOTS, exist_ok=True)
URL = lambda p: 'file://' + os.path.join(CDIR, p)

results = []
def check(name, cond, info=''):
    results.append((name, bool(cond), info))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else f'  —— {info}'), flush=True)

def new_page(browser, width, scheme='light', block_storage=False):
    ctx = browser.new_context(viewport={'width': width, 'height': 900}, color_scheme=scheme)
    ctx.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())
    if block_storage:
        ctx.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});")
    pg = ctx.new_page()
    pg.set_default_timeout(15000)
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_FAILED' not in m.text else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    return ctx, pg, errs

def register(pg, cls='5A', no='12', name='陳大文'):
    pg.fill('.reg label:nth-of-type(1) input', cls)
    pg.fill('.reg label:nth-of-type(2) input', no)
    pg.fill('.reg label:nth-of-type(3) input', name)
    pg.click('#reg-go')

def no_hscroll(pg):
    return pg.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

def overflowing(pg):
    # 任何元素超出視窗右邊（不計會捲動的容器內的內容）
    return pg.evaluate('''() => { const W = document.documentElement.clientWidth; const bad = [];
      for (const el of document.querySelectorAll('main *, header *, footer *')) {
        const r = el.getBoundingClientRect(); if (!r.width || r.right <= W + 1) continue;
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowX)) { if (p.getBoundingClientRect().right <= W + 1) { clipped = true; break; } } p = p.parentElement; }
        if (!clipped) bad.push(el.tagName + '.' + el.className);
      } return bad.slice(0, 5); }''')

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
    U = pg.evaluate('SQ._unit')
    expect = 0
    wrong_try_done = False
    shown_done = False
    for si, sec in enumerate(U['sections']):
        if si:
            goto_sec(pg, si)
        pg.wait_for_selector('#sec-title')
        tag = f'{unit}@{width} 第 {si+1} 節「{sec["title"]}」'
        check(f'{tag} 標題', pg.inner_text('#sec-title') == sec['title'])
        # ---- 學：控制台 ----
        n_sim = sum(1 for b in sec.get('learn', []) if 'sim' in b)
        if n_sim:
            cons = pg.locator('main .blk:has(.pill.learn) .sqlc')
            check(f'{tag} 學的 SQL 控制台數目', cons.count() == n_sim, f'{cons.count()} vs {n_sim}')
            for k in range(cons.count()):
                c = cons.nth(k)
                c.locator('.sim-bar button:has-text("執行")').click()
                check(f'{tag} 控制台 {k+1} 執行有結果', c.locator('.sqlc-out').inner_text().strip() != '')
                c.locator('.sim-bar button:has-text("重設數據")').click()
                check(f'{tag} 控制台 {k+1} 重設數據', '已還原' in c.locator('.sqlc-out').inner_text())
            # 控制台內 DML 的高亮
            if any('UPDATE' in b['sim']['sql'] or 'INSERT' in b['sim']['sql'] or 'DELETE' in b['sim']['sql'] for b in sec.get('learn', []) if 'sim' in b):
                for k in range(cons.count()):
                    c = cons.nth(k)
                    if re.search(r'UPDATE|INSERT|DELETE', c.locator('textarea').input_value(), re.I):
                        c.locator('.sim-bar button:has-text("執行")').click()
                        check(f'{tag} DML 後有高亮記錄', c.locator('tr.chg, tr.del').count() > 0)
        n_er = sum(1 for b in sec.get('learn', []) if 'er' in b)
        if n_er:
            check(f'{tag} ER 圖', pg.locator('main svg.er').count() >= n_er)
        # ---- 試 ----
        for it in sec.get('tries', []):
            box = f'.try-item[data-id="{it["id"]}"]'
            right = pg.evaluate('(it) => SQ.correctIndex(it)', it)
            check(f'{it["id"]} 未鎖定前不能執行', pg.is_disabled(f'{box} .sim-bar button:has-text("執行")'))
            sel = right if wrong_try_done else (right + 1) % len(it['options'])
            pg.click(f'{box} label.opt >> nth={sel}')
            pg.click(f'{box} button:has-text("鎖定答案")')
            good = sel == right
            fb = pg.inner_text(f'{box} .fb')
            check(f'{it["id"]} 估{"對" if good else "錯（故意）"}的回饋', ('估對了' in fb) if good else ('估錯了' in fb), fb)
            if good:
                expect += it['pts']
            wrong_try_done = True
            pg.click(f'{box} .sim-bar button:has-text("執行")')
            out = pg.inner_text(f'{box} .sqlc-out')
            if it.get('ask') == 'error':
                check(f'{it["id"]} 執行後顯示錯誤或成功', out.strip() != '')
            else:
                check(f'{it["id"]} 執行後沒有錯誤並有結果', '出錯' not in pg.inner_text(f'{box} .sim-step') and out.strip() != '', out[:200])
                if it.get('ask') == 'rows':
                    n = pg.locator(f'{box} .sqlc-out .result tbody tr:not(:has(td.empty))').count()
                    ans = pg.evaluate('(it) => SQ.askAnswer(it)', it)
                    check(f'{it["id"]} 結果行數與答案一致', str(n) == ans, f'{n} vs {ans}')
        # ---- 練 ----
        for it in sec.get('practice', []):
            box = f'.prac-item[data-id="{it["id"]}"]'
            t = it['type']
            if t == 'fd' and it.get('options'):
                t = 'mc'
            if not shown_done and t == 'fill':
                before = score(pg)
                pg.click(f'{box} button:has-text("看答案")')
                check(f'{it["id"]} 看答案只得 1 分', score(pg) == before + 1, f'{before} → {score(pg)}')
                expect += 1; shown_done = True
                continue
            if t == 'mc':
                right = pg.evaluate('(it) => SQ.correctIndex(it)', it)
                nopt = len(it['options'])
                pg.click(f'{box} label.opt >> nth={(right + 1) % nopt}')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 選錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                w2 = (right + 2) % nopt if (right + 2) % nopt != right else (right + 1) % nopt
                pg.click(f'{box} label.opt >> nth={w2}')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 答錯兩次出提示', '提示' in pg.inner_text(f'{box} .fb.bad'))
                pg.click(f'{box} label.opt >> nth={right}')
            elif t == 'fill':
                ans = pg.evaluate('(it) => SQ.fillAnswers(it)', it)
                ins = pg.locator(f'{box} input.txt')
                for k in range(ins.count()):
                    ins.nth(k).fill('zzz')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 填錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                for k in range(ins.count()):
                    ins.nth(k).fill(ans[k].replace('\n', ' / '))
            elif t == 'complete':
                bl = pg.locator(f'{box} input.blank')
                for k in range(bl.count()):
                    bl.nth(k).fill('1')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} 補完錯誤時有說明', pg.locator(f'{box} .fb.bad').count() == 1 and len(pg.inner_text(f'{box} .fb.bad')) > 6, pg.inner_text(f'{box}')[-200:])
                for k in range(bl.count()):
                    bl.nth(k).fill(it['ref'][k])
            elif t == 'fd':
                txt = pg.evaluate('(it) => SQ.fdInfo(it).text', it)
                inp = pg.locator(f'{box} input.txt')
                inp.fill('ZZZ')
                pg.click(f'{box} button:has-text("核對答案")')
                check(f'{it["id"]} FD 題填錯有提示', pg.locator(f'{box} .fb.bad').count() == 1)
                inp.fill(txt)
            before = score(pg)
            pg.click(f'{box} button:has-text("核對答案")')
            check(f'{it["id"]} 改正後答對得全分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + it['pts'], f'{before} → {score(pg)}; ' + pg.inner_text(f'{box} .fb')[:200])
            expect += it['pts']
        # ---- 寫SQL／分析題 ----
        for task in sec.get('tasks', []):
            box = f'.write-item[data-id="{task["id"]}"]'
            if task.get('kind') == 'table':
                ans = pg.evaluate('(t) => SQ.tableAnswers(t)', task)
                ctrls = pg.locator(f'{box} .anatab select, {box} .anatab input')
                n = ctrls.count()
                check(f'{task["id"]} 表格空格數目正確', n == len(ans), f'{n} vs {len(ans)}')
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 未填完有提示', '請完成' in pg.inner_text(f'{box} .fb'))
                for k in range(n):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT':
                        el.select_option([o for o in el.evaluate('e => [...e.options].map(o => o.value)') if o and o != ans[k]][0])
                    else:
                        el.fill('zzz')
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 答錯有紅格及提示', pg.locator(f'{box} .anatab .no').count() == n and '不正確' in pg.inner_text(f'{box} .fb'))
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 錯兩次後可看答案', pg.is_visible(f'{box} button:has-text("看答案")'))
                for k in range(n):
                    el = ctrls.nth(k)
                    if el.evaluate('e => e.tagName') == 'SELECT':
                        el.select_option(ans[k])
                    else:
                        el.fill(ans[k])
                before = score(pg)
                pg.click(f'{box} button:has-text("提交評核")')
                check(f'{task["id"]} 改正後全對得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'], pg.inner_text(f'{box} .fb')[:120])
                expect += task['pts']
                continue
            ta = f'{box} .sqlc textarea'
            pg.fill(ta, task.get('starter') or 'SELECT 1')
            pg.click(f'{box} button:has-text("提交評核")')
            fbt = pg.inner_text(f'{box} .fb')
            rule_hit = any(r['msg'] in fbt for r in task.get('rules', []))
            check(f'{task["id"]} 起始程式不通過並有說明', ('不通過' in fbt) or rule_hit, fbt[:200])
            pg.fill(ta, 'SELEC NAME FRM')
            pg.click(f'{box} button:has-text("提交評核")')
            fbt = pg.inner_text(f'{box} .fb')
            check(f'{task["id"]} 語法錯誤有說明', '語法錯誤' in fbt or rule_hit or any(r['msg'] in fbt for r in task.get('rules', [])), fbt[:200])
            check(f'{task["id"]} 錯兩次後可看參考答案', pg.is_visible(f'{box} button:has-text("看參考答案")'))
            pg.fill(ta, task['ref'])
            pg.click(f'{box} .sim-bar button:has-text("執行")')
            check(f'{task["id"]} 參考答案在瀏覽器內執行沒有錯誤', pg.locator(f'{box} .sqlc-out .msg.err').count() == 0 and pg.inner_text(f'{box} .sqlc-out').strip() != '', pg.inner_text(f'{box} .sqlc-out')[:200])
            before = score(pg)
            pg.click(f'{box} button:has-text("提交評核")')
            check(f'{task["id"]} 參考答案通過得 {task["pts"]} 分', pg.locator(f'{box} .fb.good').count() == 1 and score(pg) == before + task['pts'], pg.inner_text(f'{box} .fb')[:200])
            expect += task['pts']
        # ---- 小測 ----
        if sec.get('kind') == 'quiz':
            check(f'{unit} 小測不提供 SQL 控制台', pg.locator('main .sqlc').count() == 0)
            items = sec['items']
            for k, it in enumerate(items):
                right = pg.evaluate('(it) => SQ.correctIndex(it)', it)
                s = right if k else (right + 1) % len(it['options'])
                pg.click(f'.blk[data-id="{it["id"]}"] label.opt >> nth={s}')
                if s == right:
                    expect += it['pts']
            before = score(pg)
            pg.click('button:has-text("提交小測")')
            gained = sum(it['pts'] for it in items[1:])
            check(f'{unit} 小測提交後計分（一題故意錯）', score(pg) == before + gained, f'{before} → {score(pg)}')
        # ---- 無限練習 ----
        if sec.get('kind') == 'endless':
            for k in range(8):
                pg.click('main .endopts button >> nth=0')
                pg.click('main button:has-text("核對")')
                check(f'{unit}@{width} 無限練習計次數（第 {k+1} 題）', f'已做 {k+1} 題' in pg.inner_text('main'))
                if pg.locator('main .sqlc').count():
                    pg.click('main .sqlc .sim-bar button:has-text("執行")')
                    check(f'{unit}@{width} 無限練習的 SQL 可執行', pg.locator('main .sqlc .msg.err').count() == 0)
                pg.click('main button:has-text("再練一題")')
                check(f'{unit}@{width} 再練一題出新題', pg.locator('main .fb').count() == 0)
        check(f'{tag} 沒有多餘的 null／undefined 文字', not re.search(r'(?<![A-Za-z_])(null|undefined|NaN|\[object Object\])(?![A-Za-z_])', pg.inner_text('main')), re.findall(r'.{0,30}(?:null|undefined|NaN).{0,30}', pg.inner_text('main'))[:3])
        check(f'{tag} 沒有橫向捲動', no_hscroll(pg))
        bad = overflowing(pg)
        check(f'{tag} 沒有元素超出畫面', not bad, str(bad))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_{width}_s{si+1}.png'), full_page=True)
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

def teacher_verify(browser, reps, width=1366):
    ctx, pg, errs = new_page(browser, width)
    pg.goto(URL('teacher/index.html'))
    pg.fill('input[type=password]', 'wrong'); pg.click('#pin-go')
    check(f'教師頁@{width} PIN 錯誤時不能進入', 'PIN 不正確' in pg.inner_text('main'))
    pg.fill('input[type=password]', PIN); pg.click('#pin-go')
    tampered = reps[0].replace('"score":', '"score":1', 1)
    pg.fill('textarea.report', '\n\n'.join(reps + [tampered]))
    pg.click('#verify-go')
    t = pg.inner_text('#rep-table')
    check(f'教師頁@{width} 簽名正確的報告', t.count('✓ 簽名正確') == len(reps), t[:300])
    check(f'教師頁@{width} 竄改了的報告簽名不符', '✗ 簽名不符' in t)
    check(f'教師頁@{width} 匯總表有學生資料', '陳大文' in t)
    n = pg.locator('details.ansheet').count()
    for k in range(n):
        pg.locator('details.ansheet summary').nth(k).click()
    pg.wait_for_selector('details.ansheet table')
    txt = pg.inner_text('main')
    check(f'教師頁@{width} 答案及重點（{n} 個單元）', n >= 1 and pg.locator('details.ansheet table').count() >= n and '（題目' not in txt)
    check(f'教師頁@{width} 沒有橫向捲動', no_hscroll(pg))
    pg.screenshot(path=os.path.join(SHOTS, f'teacher_{width}.png'), full_page=True)
    check(f'教師頁@{width} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()

def hub(browser):
    for w in (1366, 390):
        ctx, pg, errs = new_page(browser, w)
        pg.goto(URL('index.html'))
        cards = pg.locator('.hcard').count()
        check(f'目錄頁@{w} 有單元卡', cards >= len(COURSE.get('plan', [])), str(cards))
        check(f'目錄頁@{w} 沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'hub_{w}.png'), full_page=True)
        check(f'目錄頁@{w} 沒有 console 錯誤', not errs, '; '.join(errs[:5]))
        ctx.close()

def dark_and_blocked(browser, unit):
    ctx, pg, errs = new_page(browser, 390, scheme='dark')
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    bg = pg.evaluate('getComputedStyle(document.body).backgroundColor')
    check(f'{unit} 深色模式背景是深色', bg == 'rgb(20, 24, 22)', bg)
    U = pg.evaluate('SQ._unit')
    pg.click('footer button:has-text("老師")')
    pg.fill('footer input[type=password]', PIN)
    pg.click('footer button:has-text("確定")')
    for si, sec in enumerate(U['sections']):
        if si:
            goto_sec(pg, si)
        for b in pg.locator('main .sqlc .sim-bar button:has-text("執行"):not([disabled])').all():
            b.click()
        check(f'{unit}@390 深色 第 {si+1} 節沒有橫向捲動', no_hscroll(pg))
        pg.screenshot(path=os.path.join(SHOTS, f'{unit}_390dark_s{si+1}.png'), full_page=True)
    pg.click('footer button:has-text("淺色")')
    check(f'{unit} 主題切換到淺色', pg.evaluate('document.documentElement.getAttribute("data-theme")') == 'light')
    check(f'{unit} 深色模式沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # localStorage 封鎖
    ctx, pg, errs = new_page(browser, 1366, block_storage=True)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    check(f'{unit} localStorage 封鎖時仍可使用並有提示', '不能儲存進度' in pg.inner_text('footer') and pg.is_visible('#sec-title'))
    s0 = U['sections'][0]
    if s0.get('tries'):
        it = s0['tries'][0]
        right = pg.evaluate('(it) => SQ.correctIndex(it)', it)
        pg.click(f'.try-item[data-id="{it["id"]}"] label.opt >> nth={right}')
        pg.click(f'.try-item[data-id="{it["id"]}"] button:has-text("鎖定答案")')
        check(f'{unit} localStorage 封鎖時仍可計分', score(pg) == it['pts'])
    else:
        mcs = [x for x in s0.get('practice', []) if x.get('options')]
        if mcs:
            it = mcs[0]
            right = pg.evaluate('(it) => SQ.correctIndex(it)', it)
            pg.click(f'.prac-item[data-id="{it["id"]}"] label.opt >> nth={right}')
            pg.click(f'.prac-item[data-id="{it["id"]}"] button:has-text("核對答案")')
            check(f'{unit} localStorage 封鎖時仍可計分', score(pg) == it['pts'])
    check(f'{unit} localStorage 封鎖時沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 老師模式
    ctx, pg, errs = new_page(browser, 1366)
    pg.goto(URL(f'{unit}/index.html'))
    register(pg)
    pg.click('footer button:has-text("老師")')
    pg.fill('footer input[type=password]', 'wrong')
    pg.click('footer button:has-text("確定")')
    check(f'{unit} 老師 PIN 錯誤', 'PIN 不正確' in pg.inner_text('footer'))
    pg.fill('footer input[type=password]', PIN)
    pg.click('footer button:has-text("確定")')
    check(f'{unit} 老師模式顯示答案', pg.locator('.ans').count() > 0 or not (U['sections'][0].get('tries') or U['sections'][0].get('practice')))
    n = len(U['sections'])
    check(f'{unit} 老師模式可跳節', not pg.is_disabled(f'.prog li:nth-child({n}) button'))
    goto_sec(pg, n - 3)
    check(f'{unit} 老師模式跳到後面', pg.is_visible('#sec-title'))
    check(f'{unit} 老師模式沒有 console 錯誤', not errs, '; '.join(errs[:5]))
    ctx.close()
    # 單一檔案版
    sd = opt.get('single')
    if sd:
        for name in (f'{unit}_單一檔案.html', 'teacher_單一檔案.html'):
            p = os.path.join(sd, name)
            if not os.path.exists(p):
                continue
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
        if not os.path.exists(os.path.join(CDIR, u, 'index.html')):
            check(f'{u} 頁面存在', False, '先執行 build.js'); continue
        reps.append(full_run(browser, u, 1366))
        reps.append(full_run(browser, u, 390))
        dark_and_blocked(browser, u)
    if reps:
        teacher_verify(browser, reps)
        teacher_verify(browser, reps, 390)
    hub(browser)
    browser.close()

bad = [r for r in results if not r[1]]
print(f'\n網站測試（{os.path.basename(CDIR)}：{",".join(UNITS)}）：{len(results) - len(bad)} 項通過，{len(bad)} 項失敗；截圖在 {SHOTS}')
sys.exit(1 if bad else 0)
