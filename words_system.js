// ==========================================
// 1. 核心 API：統一發送單字給 UI (格式保持原本純文字)
// ==========================================
function sendWordToCard(n, word) {
  if (typeof pushNextCard === 'function') {
    pushNextCard({ n: n, word: word });
  } else {
    window.dispatchEvent(new CustomEvent('pushCardData', {
      detail: { n: n, word: word }
    }));
  }
}

// ==========================================
// 2. 物件結構 (Class) 與資料庫 (vector<WordItem>)
// ==========================================
class WordItem {
  constructor(id, en, zh) {
    this.id = id;          // 唯一識別碼
    this.en = en;          // 英文單字 (UI 顯示)
    this.zh = zh;          // 中文解釋 (後台備用數據)
    this.correct = 0;      // 答對次數
    this.wrong = 0;        // 答錯次數
  }

  // 計算抽中權重：答錯次數越高/熟練度越低，被抽中的機率越高
  getWeight() {
    const total = this.correct + this.wrong;
    if (total === 0) return 3; // 初始未刷過的單字給予基本權重 3

    const wrongRate = this.wrong / total; 
    return Math.max(0.5, wrongRate * 10); // 答錯率越高的單字權重越高，最低保底 0.5
  }
}

// 你的向量清單 vector<WordItem> (在這邊新增你的單字與中文備註)
const wordVector = [
  new WordItem(101, 'reputation', '名聲 / 聲譽'),
  new WordItem(102, 'scarce', '缺乏的 / 稀有的'),
  new WordItem(103, 'territory', '領土 / 地盤'),
  new WordItem(104, 'capable', '有能力的 / 勝任的'),
  new WordItem(105, 'exhausted', '精疲力竭的'),
  new WordItem(106, 'desperate', '絕望的 / 渴望的 / 拼命的'),
  new WordItem(107, 'memorable', '值得紀念的 / 難忘的'),
  new WordItem(108, 'investigation', '調查 / 審查'),
  new WordItem(109, 'dramatic', '戲劇性的 / 誇張的'),
  new WordItem(110, 'convincing', '有說服力的'),
  new WordItem(111, 'symbolize', '象徵 / 代表'),
  new WordItem(112, 'in search of', '尋找 / 搜尋'),
  new WordItem(113, 'come across', '偶遇 / 偶然發現'),
  new WordItem(114, 'take hold', '抓住 / 普及 / 興起'),
  new WordItem(115, 'take sth at face value', '僅憑外表相信 / 照單全收'),
  new WordItem(116, 'deliberately', '故意地 / 蓄意地'),
  new WordItem(117, 'frantic', '發狂的 / 緊張忙亂的'),
  new WordItem(118, 'documentary', '紀錄片'),
  new WordItem(119, 'sequence', '順序 / 一連串'),
  new WordItem(120, 'staged', '預先安排好的 / 擺拍的'),
  new WordItem(121, 'suicidal', '自殺的 / 自毀的')
];

// 歷史記錄，防止連續出現同一張卡片
let recentHistory = []; 

// ==========================================
// 3. 後台演算法：加權輪盤賭抽卡 logic
// ==========================================
function getNextWeightedWord() {
  // 過濾掉最近出現過的卡片
  const candidates = wordVector.filter(item => !recentHistory.includes(item.id));
  const pool = candidates.length > 0 ? candidates : wordVector;

  // 計算權重總和
  const totalWeight = pool.reduce((sum, item) => sum + item.getWeight(), 0);
  let randomNum = Math.random() * totalWeight;

  // 根據權重隨機挑選單字
  for (const item of pool) {
    randomNum -= item.getWeight();
    if (randomNum <= 0) {
      recentHistory.push(item.id);
      if (recentHistory.length > 2) recentHistory.shift(); // 記住前兩張
      return item;
    }
  }

  return pool[0];
}

let globalCardCount = 0;
function loadNextWord() {
  const selectedItem = getNextWeightedWord();
  globalCardCount++;

  // 統一使用 sendWordToCard 送出「純英文單字」
  // 識別碼 n 攜帶原始 id 與流水號
  sendWordToCard(`${selectedItem.id}_${globalCardCount}`, selectedItem.en);
}

// ==========================================
// 4. 接收 UI 回傳結果並更新後台數據
// ==========================================
window.addEventListener('cardSwiped', (event) => {
  const { n, result } = event.detail; // result: true(會/右滑), false(不會/左滑)

  // 解析出單字的原始 ID
  const wordId = parseInt(n.toString().split('_')[0]);
  const targetWord = wordVector.find(item => item.id === wordId);

  if (targetWord) {
    if (result) {
      targetWord.correct++;
    } else {
      targetWord.wrong++;
    }

    // 在 Console 輸出大數據追蹤數據
    console.log(`[後台數據更新] ${targetWord.en} (${targetWord.zh}) -> 答對:${targetWord.correct} | 答錯:${targetWord.wrong} | 出現權重:${targetWord.getWeight().toFixed(2)}`);
  }

  // 補充下一張卡片
  loadNextWord();
});

// 啟動系統
function startSystem() {
  loadNextWord();
  loadNextWord();
  loadNextWord();
}

//等待其他腳本載入
setTimeout(startSystem, 500);
