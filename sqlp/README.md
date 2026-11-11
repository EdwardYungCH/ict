# sqlp：SQL 自學平台共用框架（選修A）

和 D1 自學平台一樣的外觀及流程（學 → 試 → 練 → 寫SQL → 小測 → 無限練習 → 交功課），但所有題目都在瀏覽器內用 SQL 引擎執行。

## 檔案

| 檔案 | 用途 |
|---|---|
| `engine.js` | SQL 引擎（MySQL 8.0＋DSE 規則，中文錯誤訊息）及 FDX 設計引擎（功能相關性、候選鍵碼、範式、分拆）。瀏覽器及 node 都可用。 |
| `common.js` | 頁面元件：登記、計分、SQL 控制台、結果表、數據表（DML 高亮）、ER 圖、各種題型、無限練習、HMAC 報告、教師頁。 |
| `style.css` | 樣式（淺色／深色、手機版）。 |
| `tools/build.js` | 核對答案並產生頁面。 |
| `tools/test_site.py` | Playwright 網站測試（桌面及手機闊度截圖）。 |
| `demo/` | 示範課程（兩個單元用到所有元件），用來測試框架。 |
| `SPEC.md` | 單元檔格式（老師／單元作者必讀，尤其最後的 Framework notes）。 |

## 指令

```
node sqlp/tools/build.js electa                 # 核對及產生全部單元（有錯便停止）
node sqlp/tools/build.js electa --only a3a      # 只要求 a3a 通過（其他單元有錯只警告）
node sqlp/tools/build.js electa --out 某目錄     # 另產生單一檔案版
python3 sqlp/tools/test_site.py electa          # 測試全部已產生的單元
python3 sqlp/tools/test_site.py electa a3a,a3b  # 只測試某些單元
```

產生的頁面：`electa/<單元>/index.html`、`electa/teacher/index.html`（PIN 在 `electa/course.json`）、`electa/index.html`（目錄）。
頁面以相對路徑載入 `../../sqlp/*.js`、`*.css`，可直接放上 GitHub Pages。

## 要點

- 每個答案都由引擎計算；選項中必須剛好有一個與引擎答案相同，否則 build 失敗。
- 「寫SQL」題除了用單元的數據庫，還會用 1–2 個自動改動過的數據庫（記錄次序、數值、多一項／少一項記錄）核對，學生不能把答案直接寫出來。
- 修改數據（INSERT／UPDATE／DELETE）或結構（CREATE／ALTER）的題目，會比較執行後整個數據庫（欄位、限制、記錄）。
- 進度只存在學生的瀏覽器；「交功課」報告附 HMAC 簽名，老師在教師頁貼上便可核對及匯出 CSV。
