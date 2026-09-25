# ICT 自學練習室

HKDSE ICT（中四 · 必修 A a – A c）自學練習網站。

## 內容

- [`index.html`](index.html) — 主頁，連結至各練習室
- [`concept-lab.html`](concept-lab.html) — 概念練習室：A a–A c 概念選擇題（每回合 10 題）及中英詞彙卡
- [`bit-lab.html`](bit-lab.html) — 位元練習室：進制互換、二進制補碼、位元計算、字符編碼、奇偶檢驗及檢查數位

題目即時生成，可重複練習，答題後會顯示解說。成績只保存在使用者自己的裝置上（`localStorage`），不會上傳任何資料。

## 技術說明

純靜態 HTML/CSS/JavaScript，無需建構工具，可直接以瀏覽器開啟，或透過 GitHub Pages 發佈：

Settings → Pages → Source 選擇 `Deploy from a branch`，Branch 選擇 `main`，資料夾選擇 `/ (root)`。
