// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;

let categories = [];




/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    const res = await axios.get('https://projects.springboard.com/jeopardy/api/categories?count=100');
    const allCategories = res.data;
    const randomCats = _.sampleSize(allCategories, NUM_CATEGORIES);
    return randomCats.map(cat => cat.id);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    const res = await axios.get(`https://projects.springboard.com/jeopardy/api/category?id=${catId}`);
     const title = res.data.title;
    const allClues = res.data.clues;
    const selectedClues = _.sampleSize(allClues, NUM_CATEGORIES_per_CAT);





    const clues = selectedClues.map(clue => ({
        question: clue.question,
        answer: clue.answer,
        showing: null
    }));

    return { title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    const $board = $('#jeopardy');
    $board.empty();

    const $thead = $('<thead>');
    const $tr = $('<tr>');
    for (let cat of categories) {
       $tr.append($('<th>').text(cat.title));

    }
    $thead.append($tr);
    $board.append($thead);

    const $tbody = $('<tbody>');
    for (let clueIdx = 0; clueIdx < NUM_CATEGORIES_per_CAT; clueIdx++) {
        const $row = $('<tr>');
        for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
            const $cell = $('<td>')
            .attr("data-cat", catIdx)
            .attr("data-clue", clueIdx)
            .text("?");
            $row.append($cell);
        }
        $tbody.append($row);
    }
    $board.append($tbody);
}
            


/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    const $cell = $(evt.target);
    const catIdx = $cell.data('cat');
    const clueIdx = $cell.data('clue');


    const clue = categories[catIdx].clues[clueIdx];

    if (clue.showing === null) {
        $cell.text(clue.question);
        clue.showing = "question";
    } else if (clue.showing === "question") {
        $cell.text(clue.answer);
        clue.showing = "answer";
    
 }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $("#jeopardy").html("<p>Loading...</p>");
}



/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();
    const catIds = await getCategoryIds();
    categories = await Promise.all(catIds.map(id => getCategory(id)));
    await fillTable();
    hideLoadingView();
}
console.log("Starting game setup...");
console.log("Category IDs:", catIds);
console.log("Category data:", categories);

/** On click of start / restart button, set up game. */

// TODO

/** On page load, add event handler for clicking clues */

// TODO
$(async function () {
    await setupAndStart();

    $('#jeopardy').on('click', 'td', handleClick);

    const $restart = $("<button>")
    .attr("id", "restart")
    .text("Restart Game")
    .on('click', setupAndStart);

    $('body').append($restart);
});