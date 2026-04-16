const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

let categories = [];

/** Get all available trivia categories from Open Trivia DB,
 * pick 6 random ones, and return them.
 */
async function getCategoryList() {
  const res = await axios.get("https://opentdb.com/api_category.php");
  const allCategories = res.data.trivia_categories;
  return _.sampleSize(allCategories, NUM_CATEGORIES);
}

/** Get one category's questions and reshape to your board format.
 *
 * Returns:
 * {
 *   title: "Science: Computers",
 *   clues: [
 *     { question: "...", answer: "...", showing: null },
 *     ...
 *   ]
 * }
 */
async function getCategory(categoryObj) {
  const res = await axios.get("https://opentdb.com/api.php", {
    params: {
      amount: NUM_QUESTIONS_PER_CAT,
      category: categoryObj.id,
      type: "multiple"
    }
  });

  const clues = res.data.results.map(q => ({
    question: decodeHtml(q.question),
    answer: decodeHtml(q.correct_answer),
    showing: null
  }));

  return {
    title: categoryObj.name,
    clues
  };
}

/** Decode HTML entities from Open Trivia DB */
function decodeHtml(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

/** Fill the HTML table#jeopardy with categories and clue cells */
function fillTable() {
  const $board = $("#jeopardy");
  $board.empty();

  const $thead = $("<thead>");
  const $headRow = $("<tr>");

  for (let cat of categories) {
    $headRow.append($("<th>").text(cat.title));
  }

  $thead.append($headRow);
  $board.append($thead);

  const $tbody = $("<tbody>");

  for (let clueIdx = 0; clueIdx < NUM_QUESTIONS_PER_CAT; clueIdx++) {
    const $row = $("<tr>");

    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      const $cell = $("<td>")
        .attr("data-cat", catIdx)
        .attr("data-clue", clueIdx)
        .text("?");

      $row.append($cell);
    }

    $tbody.append($row);
  }

  $board.append($tbody);
}

/** Handle clicking on a clue */
function handleClick(evt) {
  const $cell = $(evt.target);
  const catIdx = $cell.data("cat");
  const clueIdx = $cell.data("clue");

  const clue = categories[catIdx]?.clues[clueIdx];
  if (!clue) return;

  if (clue.showing === null) {
    $cell.text(clue.question);
    clue.showing = "question";
  } else if (clue.showing === "question") {
    $cell.text(clue.answer);
    clue.showing = "answer";
  }
}

/** Show loading */
function showLoadingView() {
  $("#jeopardy").html("<tbody><tr><td>Loading...</td></tr></tbody>");
}

/** Hide loading */
function hideLoadingView() {
  // fillTable replaces the board, so nothing needed here for now
}

/** Start / restart game */
async function setupAndStart() {
  try {
    showLoadingView();

    const chosenCategories = await getCategoryList();
    categories = await Promise.all(chosenCategories.map(cat => getCategory(cat)));

    fillTable();
    hideLoadingView();
  } catch (err) {
    console.error("Error loading game:", err);
    $("#jeopardy").html("<tbody><tr><td>Failed to load game.</td></tr></tbody>");
  }
}

$(async function () {
  await setupAndStart();

  $("#jeopardy").on("click", "td", handleClick);

  const $restart = $("<button>")
    .attr("id", "restart")
    .text("Restart Game")
    .on("click", setupAndStart);

  $("body").append($restart);
});