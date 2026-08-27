window.cardQueue = window.cardQueue || [];

// 1. 接收單字輸入 API
function pushNextCard(data) {
  if (data && typeof data.n !== 'undefined' && data.word) {
    window.cardQueue.push(data);
    checkAndPopulateCards();
  }
}

window.addEventListener('pushCardData', (e) => {
  pushNextCard(e.detail);
});

// 2. 向外部輸出數據 API
function dispatchSwipeResult(resultData) {
  window.dispatchEvent(new CustomEvent('cardSwiped', {
    detail: resultData
  }));
}

// UI 變數宣告
let topCard = document.getElementById('topCard');
let nextCard = document.getElementById('nextCard');
const cardStack = document.getElementById('cardStack');
let currentTopData = null;
let currentNextData = null;
let isDragging = false;
let startX = 0;
let currentX = 0;
const threshold = 120;

function checkAndPopulateCards() {
  if (!topCard || !nextCard) return;

  if (!currentTopData && window.cardQueue.length > 0) {
    currentTopData = window.cardQueue.shift();
    document.getElementById('topWordText').innerText = currentTopData.word;
  }
  if (!currentNextData && window.cardQueue.length > 0) {
    currentNextData = window.cardQueue.shift();
    document.getElementById('nextWordText').innerText = currentNextData.word;
  }
}

function initEvents(cardElement) {
  if (!cardElement) return;
  cardElement.addEventListener('mousedown', dragStart);
  cardElement.addEventListener('touchstart', dragStart, { passive: false });
}

function removeEvents(cardElement) {
  if (!cardElement) return;
  cardElement.removeEventListener('mousedown', dragStart);
  cardElement.removeEventListener('touchstart', dragStart);
}

function dragStart(e) {
  if (!currentTopData) return;
  isDragging = true;
  topCard.style.transition = 'none';
  nextCard.style.transition = 'none';
  startX = (e.type === "touchstart") ? e.touches[0].clientX - currentX : e.clientX - currentX;
}

function dragging(e) {
  if (!isDragging) return;
  e.preventDefault();

  let inputX = (e.type === "touchmove") ? e.touches[0].clientX : e.clientX;
  currentX = inputX - startX;

  topCard.style.transform = `translate(${currentX}px, 0px)`;

  const progress = Math.min(Math.abs(currentX) / threshold, 1);
  nextCard.style.transform = `scale(${0.9 + 0.1 * progress})`;
  nextCard.style.opacity = 0.8 + 0.2 * progress;
}

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;

  topCard.style.transition = 'transform 0.3s ease-out';
  nextCard.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

  if (Math.abs(currentX) > threshold) {
    const isKnown = currentX > 0;
    const flyOutX = isKnown ? '150vw' : '-150vw';
    
    topCard.style.transform = `translate(${flyOutX}, 0px)`;
    nextCard.style.transform = 'scale(1)';
    nextCard.style.opacity = '1';

    dispatchSwipeResult({
      n: currentTopData.n,
      result: isKnown
    });

    setTimeout(() => promoteCards(), 300);
  } else {
    currentX = 0;
    topCard.style.transform = 'translate(0px, 0px)';
    nextCard.style.transform = 'scale(0.9)';
    nextCard.style.opacity = '0.8';
  }
}

function promoteCards() {
  removeEvents(topCard);
  topCard.remove();

  topCard = nextCard;
  topCard.className = 'card top-card';
  currentTopData = currentNextData;
  initEvents(topCard);

  const newCard = document.createElement('div');
  newCard.className = 'card next-card';

  if (window.cardQueue.length > 0) {
    currentNextData = window.cardQueue.shift();
    newCard.innerHTML = `<span class="word">${currentNextData.word}</span>`;
  } else {
    currentNextData = null;
    newCard.innerHTML = `<span class="word">LOADING...</span>`;
  }

  cardStack.insertBefore(newCard, topCard);
  nextCard = newCard;

  currentX = 0;
  checkAndPopulateCards();
}

window.addEventListener('mousemove', dragging);
window.addEventListener('mouseup', dragEnd);
window.addEventListener('touchmove', dragging, { passive: false });
window.addEventListener('touchend', dragEnd);

initEvents(topCard);

/* ==========================================
 * 背景點擊切換主題配色
 * ========================================== */
const themes = ['', 'theme-1', 'theme-2', 'theme-3']; // 可在此新增主題名稱
let currentThemeIndex = 0;

document.body.addEventListener('click', (e) => {
  // 點擊卡片內部不切換配色
  if (e.target.closest('.card-stack')) return;

  if (themes[currentThemeIndex]) {
    document.body.classList.remove(themes[currentThemeIndex]);
  }

  currentThemeIndex = (currentThemeIndex + 1) % themes.length;

  if (themes[currentThemeIndex]) {
    document.body.classList.add(themes[currentThemeIndex]);
  }
});