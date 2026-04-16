const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

let categories = [];
let currentClue = null;
let showingAnswer = false;

const board = document.getElementById("game-board");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restart-btn");

const modal = document.getElementById("modal");
const modalCategory = document.getElementById("modal-category");
const modalText = document.getElementById("modal-text");
const modalBtn = document.getElementById("modal-btn");
const closeBtn = document.getElementById("close-btn");

/** Decode HTML entities from API text */
function decodeText(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

/** Shuffle array */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/** Get all trivia categories */
async function getAllCategories() {
  const res = await fetch("https://opentdb.com/api_category.php");
  const data = await res.json();
  return data.trivia_categories;
}

/** Pick random categories */
async function getRandomCategories() {
  const allCategories = await getAllCategories();
  const shuffled = shuffle([...allCategories]);
  return shuffled.slice(0, NUM_CATEGORIES);
}

/** Get questions for one category */
async function getQuestionsForCategory(categoryId) {
  const res = await fetch(
    `https://opentdb.com/api.php?amount=${NUM_QUESTIONS_PER_CAT}&category=${categoryId}&type=multiple`
  );
  const data = await res.json();

  return data.results.map((q, index) => ({
    question: decodeText(q.question),
    answer: decodeText(q.correct_answer),
    value: (index + 1) * 100,
    showing: null
  }));
}

/** Build categories array */
async function setupGameData() {
  statusText.textContent = "Loading categories and questions...";
  categories = [];

  const chosenCategories = await getRandomCategories();

  for (let cat of chosenCategories) {
    const clues = await getQuestionsForCategory(cat.id);

    categories.push({
      title: decodeText(cat.name),
      clues: clues
    });
  }
}

/** Render board */
function renderBoard() {
  board.innerHTML = "";

  // category headers
  for (let category of categories) {
    const catDiv = document.createElement("div");
    catDiv.classList.add("category");
    catDiv.textContent = category.title;
    board.appendChild(catDiv);
  }

  // clues
  for (let row = 0; row < NUM_QUESTIONS_PER_CAT; row++) {
    for (let col = 0; col < NUM_CATEGORIES; col++) {
      const clue = categories[col].clues[row];
      const clueDiv = document.createElement("div");
      clueDiv.classList.add("clue");
      clueDiv.textContent = `$${clue.value}`;
      clueDiv.dataset.col = col;
      clueDiv.dataset.row = row;

      if (clue.showing === "used") {
        clueDiv.classList.add("used");
        clueDiv.textContent = "";
      } else {
        clueDiv.addEventListener("click", handleClueClick);
      }

      board.appendChild(clueDiv);
    }
  }

  statusText.textContent = "Game loaded. Pick a clue!";
}

/** Handle clue click */
function handleClueClick(evt) {
  const col = evt.target.dataset.col;
  const row = evt.target.dataset.row;
  const clue = categories[col].clues[row];

  if (clue.showing === "used") return;

  currentClue = clue;
  showingAnswer = false;

  modalCategory.textContent = categories[col].title;
  modalText.textContent = clue.question;
  modalBtn.textContent = "Show Answer";

  openModal();
}

/** Open modal */
function openModal() {
  modal.classList.remove("hidden");
}

/** Close modal */
function closeModal() {
  modal.classList.add("hidden");

  if (currentClue && currentClue.showing === "used") {
    renderBoard();
    checkIfGameOver();
  }

  currentClue = null;
  showingAnswer = false;
}

/** Show answer, then mark used */
modalBtn.addEventListener("click", function () {
  if (!currentClue) return;

  if (!showingAnswer) {
    modalText.textContent = currentClue.answer;
    modalBtn.textContent = "Mark Used";
    showingAnswer = true;
    currentClue.showing = "answer";
  } else {
    currentClue.showing = "used";
    closeModal();
  }
});

closeBtn.addEventListener("click", closeModal);

/** Check game over */
function checkIfGameOver() {
  const allUsed = categories.every(category =>
    category.clues.every(clue => clue.showing === "used")
  );

  if (allUsed) {
    statusText.textContent = "Game Over! You finished the board.";
  }
}

/** Start / restart game */
async function startGame() {
  board.innerHTML = "";
  statusText.textContent = "Starting new game...";

  try {
    await setupGameData();
    renderBoard();
  } catch (err) {
    console.error(err);
    statusText.textContent = "Something went wrong loading the game.";
    board.innerHTML = "";
  }
}

restartBtn.addEventListener("click", startGame);

startGame();