const WORDS = [
  "KİTAP", "MASAL", "GÜNEŞ", "BULUT", "DENİZ",
  "KALEM", "BİLGİ", "ÇİÇEK", "DEMİR", "SABAH",
  "AKŞAM", "GÖREV", "ARABA", "ELMAS", "DÜNYA",
  "KİRAZ", "KÖPEK", "ORMAN", "ÇORAP", "KAVUN",
  "LİMON", "ŞEKER", "TABAK", "BİBER", "ÇANTA",
  "KİLİT", "YEMEK", "EKMEK", "BAHÇE", "ÇOCUK",
  "BEBEK", "BALIK", "GÖLGE", "SEVGİ", "DOSTU",
  "MUTLU", "BARIŞ", "HAYAL", "ZAMAN", "SOKAK",
  "ŞEHİR", "BİLET", "YOLCU", "KAŞIK", "ÇATAL",
  "BIÇAK", "KADIN", "ERKEK", "YAŞAM", "DÜŞÜK",
  "YÜREK", "GÖNÜL", "İNANÇ", "SEÇİM", "ÖZGÜR",
  "KORKU", "KAVGA", "SAVAŞ", "KÜÇÜK", "BÜYÜK",
  "SICAK", "SOĞUK", "TEMİZ", "KİRLİ", "HIZLI",
  "YAVAŞ", "GÜZEL", "YALAN", "DOĞRU", "EKSİK",
  "FAZLA", "GÜVEN", "İŞLEM", "SORUN", "ÇÖZÜM",
  "SONUÇ", "NEDEN", "NASIL", "BELKİ", "HATTA",
  "ÇÜNKÜ", "FAKAT", "ANCAK", "BİZİM", "SİZİN",
  "ONLAR", "YILAN", "SİNEK", "HOROZ", "TAVUK",
  "KOYUN", "ÖRDEK", "KARGA", "SERÇE", "NEHİR",
  "IRMAK", "GÖLET", "SAHİL", "DALGA", "KUMRU"
];

const MAX_ROWS = 6;
const WORD_LENGTH = 5;
const STORAGE_KEY = "wordleEveryDayState";

const gridEl = document.getElementById("grid");
const keyboardEl = document.getElementById("keyboard");
const messageEl = document.getElementById("message");

let WORD;
let state;
let board;
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let keyboardStates = {};

const KEY_ROWS = [
  ["E", "R", "T", "Y", "U", "Ü", "O", "P", "Ğ"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "SİL"]
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDailyWord() {
  const start = new Date(2026, 0, 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = Math.floor((today - start) / 86400000);
  return WORDS[((day % WORDS.length) + WORDS.length) % WORDS.length];
}

function emptyBoard() {
  return Array.from({ length: MAX_ROWS }, () => Array(WORD_LENGTH).fill(""));
}

function createGrid() {
  gridEl.innerHTML = "";
  for (let r = 0; r < MAX_ROWS; r++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    gridEl.appendChild(row);
  }
}

function createKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_ROWS.forEach(keys => {
    const row = document.createElement("div");
    row.className = "keyboard-row";
    keys.forEach(key => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key";
      button.id = `key-${key}`;
      button.textContent = key;
      if (key === "ENTER" || key === "SİL") button.classList.add("wide");
      button.addEventListener("click", () => handleKey(key));
      row.appendChild(button);
    });
    keyboardEl.appendChild(row);
  });
}

function updateTile(r, c, letter) {
  const tile = document.getElementById(`tile-${r}-${c}`);
  tile.textContent = letter;
  tile.classList.toggle("filled", letter !== "");
}

function showMessage(text) {
  messageEl.textContent = text;
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (key === "SİL" || key === "BACKSPACE") {
    if (currentTile > 0) {
      currentTile--;
      board[currentRow][currentTile] = "";
      updateTile(currentRow, currentTile, "");
    }
    return;
  }

  if (/^[A-ZÇĞİÖŞÜ]$/.test(key) && currentTile < WORD_LENGTH) {
    board[currentRow][currentTile] = key;
    updateTile(currentRow, currentTile, key);
    currentTile++;
  }
}

function scoreGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = [...answer];

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const index = remaining.indexOf(guess[i]);
    if (index !== -1) {
      result[i] = "present";
      remaining[index] = null;
    }
  }
  return result;
}

function paintKeyboard(guess, result) {
  const priority = { absent: 1, present: 2, correct: 3 };

  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i];
    const old = keyboardStates[letter];

    if (!old || priority[result[i]] > priority[old]) {
      keyboardStates[letter] = result[i];
    }

    const button = document.getElementById(`key-${letter}`);
    if (button) {
      button.classList.remove("correct", "present", "absent");
      button.classList.add(keyboardStates[letter]);
    }
  }
}

function renderSavedGame() {
  createGrid();
  createKeyboard();
  board = emptyBoard();
  keyboardStates = {};

  state.guesses.forEach((saved, r) => {
    for (let c = 0; c < WORD_LENGTH; c++) {
      board[r][c] = saved.word[c];
      updateTile(r, c, saved.word[c]);
      document.getElementById(`tile-${r}-${c}`).classList.add(saved.result[c]);
    }
    paintKeyboard(saved.word, saved.result);
  });

  currentRow = state.guesses.length;
  currentTile = 0;
  gameOver = state.done;

  if (gameOver) {
    showMessage(state.won
      ? `Helal kral! ${state.guesses.length}/6 tahminde bildin! 🎉`
      : `Oyun bitti! Kelime: ${WORD}`);
  } else {
    showMessage("Günün kelimesini bul bakalım kral!");
  }
}

async function saveGame() {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function submitGuess() {
  if (gameOver) return;

  if (currentTile !== WORD_LENGTH) {
    showMessage("Tam 5 harf gir kral!");
    return;
  }

  const guess = board[currentRow].join("");

  if (state.guesses.some(item => item.word === guess)) {
    showMessage("Bu kelimeyi zaten denedin!");
    return;
  }

  const result = scoreGuess(guess, WORD);
  state.guesses.push({ word: guess, result });
  paintKeyboard(guess, result);

  for (let i = 0; i < WORD_LENGTH; i++) {
    document.getElementById(`tile-${currentRow}-${i}`).classList.add(result[i]);
  }

  if (guess === WORD) {
    state.done = true;
    state.won = true;
    gameOver = true;
    showMessage(`Helal kral! ${state.guesses.length}/6 tahminde bildin! 🎉`);
  } else if (state.guesses.length >= MAX_ROWS) {
    state.done = true;
    gameOver = true;
    showMessage(`Bilemedin kral! Kelime: ${WORD}`);
  } else {
    currentRow++;
    currentTile = 0;
    showMessage(`${MAX_ROWS - state.guesses.length} tahmin hakkın kaldı.`);
  }

  await saveGame();
}

document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.altKey || event.metaKey) return;

  if (event.key === "Enter") {
    event.preventDefault();
    handleKey("ENTER");
  } else if (event.key === "Backspace") {
    event.preventDefault();
    handleKey("SİL");
  } else {
    const letter = event.key.toLocaleUpperCase("tr-TR");
    if (/^[A-ZÇĞİÖŞÜ]$/.test(letter)) handleKey(letter);
  }
});

async function init() {
  WORD = getDailyWord();
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const previous = saved[STORAGE_KEY];

  if (previous && previous.date === todayKey()) {
    state = previous;
  } else {
    state = {
      date: todayKey(),
      guesses: [],
      done: false,
      won: false
    };
    await saveGame();
  }

  renderSavedGame();
}

init();
