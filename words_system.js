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
  new WordItem(101, 'priority', '優先事項'),
  new WordItem(102, 'craft', '工藝 / 手藝'),
  new WordItem(103, 'cabinet', '櫥櫃 / 內閣'),
  new WordItem(104, 'hurricane', '颶風'),
  new WordItem(105, 'tornado', '龍捲風'),
  new WordItem(106, 'sculpture', '雕塑品'),
  new WordItem(107, 'sculptor', '雕刻家'),
  new WordItem(108, 'landmark', '地標'),
  new WordItem(109, 'efficient', '有效率的'),
  new WordItem(110, 'arrange', '安排 / 整理'),
  new WordItem(111, 'thoroughly', '徹底地'),
  new WordItem(112, 'consumption', '消費'),
  new WordItem(113, 'carpenter', '木匠'),
  new WordItem(114, 'furniture', '家具'),
  new WordItem(115, 'displayed', '展示的'),
  new WordItem(116, 'tribe', '部落'),
  new WordItem(117, 'sticking', '黏貼的 / 堅持的'),
  new WordItem(118, 'as well as', '以及 / 也'),
  new WordItem(119, 'clue', '線索 / 提示'),
  new WordItem(120, 'patients medical records', '病患病歷紀錄'),
  new WordItem(121, 'claim', '宣稱 / 索賠 / 主張'),
  new WordItem(122, 'frequently', '頻繁地 / 經常'),
  new WordItem(123, 'stuck', '卡住的 / 陷入困境的'),
  new WordItem(124, 'carve', '雕刻 / 刨削'),
  new WordItem(125, 'materials', '材料 / 原料'),
  new WordItem(126, 'continuous', '持續的 / 連續的'),
  new WordItem(127, 'stretch', '延伸 / 伸展')
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