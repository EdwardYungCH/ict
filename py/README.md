# Python 自學平台（D2、選修C 共用框架）

學生在瀏覽器內用 Python（Skulpt）寫程式及執行，介面像 Thonny；題目答案在產生網頁時已用電腦上的 Python（CPython）計算及核對。
題目格式見 `SPEC.md`。

## 檔案

| 檔案 | 用途 |
|---|---|
| `common.js` | 介面、計分、報告簽名、教師頁、無限練習生成器 |
| `pyrun.js` | 瀏覽器 Python 執行器（包住 Skulpt；虛擬檔案、固定隨機數、錯誤中文解釋） |
| `style.css` | 樣式（淺色／深色、手機版） |
| `skulpt/` | Skulpt（離線使用，不用網絡） |
| `tools/build.js` | 核對答案並產生網頁 |
| `tools/pyrun.py` | build 用的 CPython 執行器 |
| `tools/test_site.py` | 網站自動測試（Playwright） |
| `demo/` | 示範課程（用齊所有題型，測試框架用） |

## 產生網頁

```
node py/tools/build.js d2                    # 核對及產生整個課程（任何單元有錯便停止）
node py/tools/build.js d2 --only u3          # 只核對及產生 u3（其他單元有錯只會警告）
node py/tools/build.js electc --out /tmp/out # 另外輸出「單一檔案版」
```

產生：`<課程>/<單元>/index.html`、`<課程>/teacher/index.html`（教師頁，PIN 在 `course.json`）、`<課程>/index.html`（目錄）。
有錯時會列出題目編號及原因，例如「u3-s1-t1：選項中有 0 個與 CPython 答案相同」。

## 測試

```
python3 py/tools/test_site.py d2 u3          # 測試一個單元（可用逗號分隔多個）
python3 py/tools/test_site.py d2 --shots /tmp/shots --single /tmp/out
```

測試會自動登記、答每一題（先錯後對）、在瀏覽器執行每題寫程式的參考答案（證明 Skulpt 與 CPython 結果相同）、
做小測及無限練習、產生報告並在教師頁核對簽名；亦檢查手機闊度（390）沒有橫向捲動、沒有 console 錯誤。

## 加一個單元

1. 在 `<課程>/src/` 加 `u9.js`（格式見 `SPEC.md`，可參考 `py/demo/src/x1.js`）。
2. 在 `<課程>/course.json` 的 `plan` 加一行 `["u9", "標題", "頁數"]`（未有檔案的單元在目錄顯示「製作中」）。
3. `node py/tools/build.js <課程> --only u9`，直至沒有錯誤。
4. `python3 py/tools/test_site.py <課程> u9`，直至全部通過。

## 注意

- 網頁只用相對路徑，可放在 GitHub Pages；載入後可離線使用（只有 Google Fonts 需要網絡，沒有也可以用）。
- 學生進度只存在該部裝置的瀏覽器（localStorage）。
- 教師 PIN 寫在公開的網頁程式內，只是方便老師，不是保安措施；分數由 HMAC 簽名保護。
