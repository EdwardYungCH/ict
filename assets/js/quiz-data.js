// 綜合測驗題庫 - 涵蓋各課題
const QUIZ_QUESTIONS = [
  {
    topic: "資訊處理",
    question: "以下哪一項屬於「資訊」而非「資料」？",
    options: [
      "35（單獨數字）",
      "今日氣溫 35 度，屬酷熱天氣",
      "一堆未整理的學生分數",
      "一連串未經處理的文字"
    ],
    answer: 1
  },
  {
    topic: "資訊處理",
    question: "1 GB 等於多少 MB？",
    options: ["100 MB", "1000 MB", "1024 MB", "1042 MB"],
    answer: 2
  },
  {
    topic: "資訊處理",
    question: "資料處理週期的正確次序是？",
    options: [
      "處理 → 輸入 → 儲存 → 輸出",
      "輸入 → 處理 → 輸出 → 儲存",
      "輸出 → 輸入 → 處理 → 儲存",
      "儲存 → 輸入 → 處理 → 輸出"
    ],
    answer: 1
  },
  {
    topic: "電腦系統",
    question: "以下哪種記憶體屬於揮發性（斷電後資料會消失）？",
    options: ["ROM", "硬碟 HDD", "RAM", "USB 手指"],
    answer: 2
  },
  {
    topic: "電腦系統",
    question: "負責執行指令及進行運算的電腦部件是？",
    options: ["CPU", "RAM", "打印機", "掃描器"],
    answer: 0
  },
  {
    topic: "電腦系統",
    question: "以下何者屬於系統軟件？",
    options: ["Microsoft Word", "Windows 作業系統", "Google Chrome", "PowerPoint"],
    answer: 1
  },
  {
    topic: "互聯網及其應用",
    question: "把網域名稱轉換成 IP 位址的系統稱為？",
    options: ["HTTP", "DNS", "FTP", "ISP"],
    answer: 1
  },
  {
    topic: "互聯網及其應用",
    question: "登入銀行網站時，應留意網址開頭是？",
    options: ["http://", "ftp://", "https://", "www://"],
    answer: 2
  },
  {
    topic: "互聯網及其應用",
    question: "Google Docs 屬於哪一種雲端服務模式？",
    options: ["IaaS", "PaaS", "SaaS", "DaaS"],
    answer: 2
  },
  {
    topic: "資訊及通訊科技與社會",
    question: "未經授權複製及分發受版權保護的音樂檔案，屬於侵犯甚麼？",
    options: ["商標", "專利", "版權", "私隱"],
    answer: 2
  },
  {
    topic: "資訊及通訊科技與社會",
    question: "評鑑網上資訊可信程度時，不需要考慮的是？",
    options: ["資訊來源", "資訊時效性", "網頁的背景顏色", "作者發佈的目的"],
    answer: 2
  },
  {
    topic: "資訊及通訊科技與社會",
    question: "在網上討論區匿名侮辱同學，屬於哪種行為？",
    options: ["資訊素養", "網絡欺凌", "開源精神", "知識共享"],
    answer: 1
  },
  {
    topic: "基本程式編寫概念",
    question: "根據條件決定執行哪組指令，屬於哪種程式結構？",
    options: ["順序結構", "選擇結構", "循環結構", "以上皆非"],
    answer: 1
  },
  {
    topic: "基本程式編寫概念",
    question: "已知需要重複執行 10 次，最適合使用哪種循環？",
    options: ["FOR 循環", "IF 陳述式", "隨機函式", "輸出陳述式"],
    answer: 0
  },
  {
    topic: "基本程式編寫概念",
    question: "程式可以執行，但輸出結果不正確，屬於哪類錯誤？",
    options: ["語法錯誤", "邏輯錯誤", "編譯錯誤", "檔案錯誤"],
    answer: 1
  }
];
