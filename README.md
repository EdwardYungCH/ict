# ICT 學習資源中心

資訊及通訊科技（Information and Communication Technology）學習資源網站，收錄補充筆記、練習及互動自學工具，供學生自主學習及溫習使用。

## 🌐 網站首頁

打開 [`index.html`](index.html) 即可瀏覽主頁面（亦可透過 GitHub Pages 發佈成網站）。

## 📁 目錄結構

```
ict/
├── index.html              # 主頁面
├── assets/
│   ├── css/style.css       # 共用樣式
│   └── js/                 # 互動工具所用的資料與腳本
├── notes/                  # 各課題補充筆記（HTML）
│   ├── information-processing.html      # 1. 資訊處理
│   ├── computer-systems.html            # 2. 電腦系統
│   ├── internet-applications.html       # 3. 互聯網及其應用
│   ├── ict-and-society.html             # 4. 資訊及通訊科技與社會
│   └── programming-concepts.html        # 5. 基本程式編寫概念
├── exercises/               # 各課題練習（附答案，可收合）
│   └── ...（對應 notes 中各課題）
└── interactive/             # 互動自學網頁
    ├── quiz.html            # 綜合測驗（隨機題目、即時對答案、記錄最佳分數）
    └── flashcards.html      # 術語閃卡（翻卡練習、隨機排序）
```

## 📚 涵蓋課題

1. 資訊處理 Information Processing
2. 電腦系統 Computer Systems
3. 互聯網及其應用 Internet and Its Applications
4. 資訊及通訊科技與社會 ICT and Society
5. 基本程式編寫概念 Basic Programming Concepts

每個課題均包含：**筆記**（重點整理、圖表、術語解釋）及 **練習**（附詳細答案，方便自我檢查）。

## 🚀 啟用 GitHub Pages（讓網站可在線上瀏覽）

1. 到 repository 的 **Settings → Pages**
2. Source 選擇 `Deploy from a branch`
3. Branch 選擇 `main`，資料夾選擇 `/ (root)`
4. 儲存後，網站會發佈於 `https://<你的 GitHub 用戶名>.github.io/ict/`

## 🛠 技術說明

全站使用純 HTML / CSS / JavaScript 編寫，無需任何建構工具或伺服器端程式，可直接以瀏覽器開啟或部署至任何靜態網站託管服務。互動工具（測驗、閃卡）僅使用瀏覽器 `localStorage` 記錄最佳分數，不會上傳任何個人資料。

## ✏️ 貢獻 / 擴充

歡迎新增更多課題筆記、練習或互動工具：

- 新增筆記：在 `notes/` 內新增 HTML 檔案，並沿用 `assets/css/style.css` 的樣式結構
- 新增練習：在 `exercises/` 內新增 HTML 檔案，使用 `<details class="exercise">` 包裝題目與答案
- 新增測驗題目：編輯 `assets/js/quiz-data.js`
- 新增閃卡：編輯 `assets/js/flashcards-data.js`
- 記得在 `index.html` 加入對應連結
