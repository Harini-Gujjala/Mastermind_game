/* =========================================================
   GAME CONFIGURATION
========================================================= */
const COLORS = [
    "red",
    "yellow",
    "green",
    "blue",
    "purple",
    "orange"
];
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;
const MAX_HINTS = 3;
const STARTING_SCORE = 1000;
const ATTEMPT_COST = 50;
const HINT_COST = 100;
/* =========================================================
   GAME STATE
========================================================= */
let secretCode = [];
let currentGuess = [];
let guesses = [];
let feedbackHistory = [];
let attemptsUsed = 0;
let score = STARTING_SCORE;
let hintsRemaining = MAX_HINTS;
let gameState = "playing";
/* =========================================================
   DOM ELEMENTS
========================================================= */
const board =
    document.getElementById("board");
const palette =
    document.getElementById("palette");
const checkBtn =
    document.getElementById("checkBtn");
const hintBtn =
    document.getElementById("hintBtn");
const restartBtn =
    document.getElementById("restartBtn");
const playAgainBtn =
    document.getElementById("playAgainBtn");
const attemptsLeftElement =
    document.getElementById("attemptsLeft");
const scoreElement =
    document.getElementById("score");
const attemptBadge =
    document.getElementById("attemptBadge");
const statusMessage =
    document.getElementById("statusMessage");
const hintBox =
    document.getElementById("hintBox");
const hintCount =
    document.getElementById("hintCount");
const secretCodeElement =
    document.getElementById("secretCode");
const resultOverlay =
    document.getElementById("resultOverlay");
const resultTitle =
    document.getElementById("resultTitle");
const resultMessage =
    document.getElementById("resultMessage");
const resultCode =
    document.getElementById("resultCode");
const resultAttempts =
    document.getElementById("resultAttempts");
const resultScore =
    document.getElementById("resultScore");
const resultIcon =
    document.getElementById("resultIcon");
const gamesPlayedElement =
    document.getElementById("gamesPlayed");
const gamesWonElement =
    document.getElementById("gamesWon");
const bestScoreElement =
    document.getElementById("bestScore");
const bestAttemptsElement =
    document.getElementById("bestAttempts");
/* =========================================================
   INITIALIZE GAME
========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadStatistics();
        resetGame();
        setupEventListeners();
    }
);
/* =========================================================
   EVENT LISTENERS
========================================================= */
function setupEventListeners() {
    palette.addEventListener(
        "click",
        handleColorSelection
    );
    checkBtn.addEventListener(
        "click",
        submitGuess
    );
    hintBtn.addEventListener(
        "click",
        useHint
    );
    restartBtn.addEventListener(
        "click",
        resetGame
    );
    playAgainBtn.addEventListener(
        "click",
        () => {
            resultOverlay.classList.remove(
                "visible"
            );
            resetGame();
        }
    );
    document.addEventListener(
        "keydown",
        handleKeyboard
    );
}
/* =========================================================
   GENERATE SECRET CODE
========================================================= */
function generateSecretCode() {
    const shuffled =
        [...COLORS].sort(
            () => Math.random() - 0.5
        );
    return shuffled.slice(
        0,
        CODE_LENGTH
    );
}
/* =========================================================
   CREATE GUESS
========================================================= */
function createGuess() {
    return [];
}
/* =========================================================
   RESET GAME
========================================================= */
function resetGame() {
    secretCode =
        generateSecretCode();
    currentGuess =
        createGuess();
    guesses = [];
    feedbackHistory = [];
    attemptsUsed = 0;
    score = STARTING_SCORE;
    hintsRemaining =
        MAX_HINTS;
    gameState = "playing";
    resultOverlay.classList.remove(
        "visible"
    );
    hintBox.classList.remove(
        "visible"
    );
    hintBox.textContent = "";
    statusMessage.textContent =
        "";
    statusMessage.className =
        "status-message";
    renderBoard();
    updateUI();
    revealSecretCode(false);
}
/* =========================================================
   COLOR SELECTION
========================================================= */
function handleColorSelection(event) {
    const button =
        event.target.closest(
            ".color-button"
        );
    if (!button) {
        return;
    }
    if (gameState !== "playing") {
        return;
    }
    const color =
        button.dataset.color;
    selectColor(color);
}
/* =========================================================
   SELECT COLOR
========================================================= */
function selectColor(color) {
    if (
        currentGuess.length >=
        CODE_LENGTH
    ) {
        return;
    }
    /*
       Prevent duplicate colors.
    */
    if (
        currentGuess.includes(color)
    ) {
        showStatus(
            "Each color can only be used once.",
            "error"
        );
        return;
    }
    currentGuess.push(color);
    renderBoard();
    updateUI();
    clearStatus();
}
/* =========================================================
   REMOVE COLOR FROM CURRENT GUESS
========================================================= */
function removeColor(index) {
    if (
        gameState !== "playing"
    ) {
        return;
    }
    if (
        index >= currentGuess.length
    ) {
        return;
    }
    currentGuess.splice(index, 1);
    renderBoard();
    updateUI();
}
/* =========================================================
   EVALUATE GUESS
   TWO-PASS ALGORITHM
========================================================= */
function evaluateGuess(guess) {
    const result = [];
    const remainingSecret = [];
    const remainingGuess = [];
    /*
       PASS 1:
       Find exact matches.
    */
    for (
        let i = 0;
        i < CODE_LENGTH;
        i++
    ) {
        if (
            guess[i] ===
            secretCode[i]
        ) {
            result.push("exact");
        } else {
            result.push(null);
            remainingSecret.push(
                secretCode[i]
            );
            remainingGuess.push(
                guess[i]
            );
        }
    }
    /*
       PASS 2:
       Find correct colors
       in incorrect positions.
    */
    for (
        let i = 0;
        i < remainingGuess.length;
        i++
    ) {
        const color =
            remainingGuess[i];
        const secretIndex =
            remainingSecret.indexOf(
                color
            );
        if (secretIndex !== -1) {
            const originalIndex =
                findUnmatchedIndex(
                    guess,
                    i,
                    result
                );
            if (originalIndex !== -1) {
                result[originalIndex] =
                    "partial";
            }
            remainingSecret.splice(
                secretIndex,
                1
            );
        }
    }
    /*
       Convert remaining null
       values to "none".
    */
    return result.map(
        value =>
            value || "none"
    );
}
/* =========================================================
   HELPER FOR PARTIAL MATCHES
========================================================= */
function findUnmatchedIndex(
    guess,
    remainingIndex,
    result
) {
    let count = 0;
    for (
        let i = 0;
        i < guess.length;
        i++
    ) {
        if (
            result[i] === null
        ) {
            if (
                count ===
                remainingIndex
            ) {
                return i;
            }
            count++;
        }
    }
    return -1;
}
/* =========================================================
   SUBMIT GUESS
========================================================= */
function submitGuess() {
    if (
        gameState !== "playing"
    ) {
        return;
    }
    if (
        currentGuess.length !==
        CODE_LENGTH
    ) {
        showStatus(
            "Choose 4 different colors first.",
            "error"
        );
        shakeBoard();
        return;
    }
    const guess =
        [...currentGuess];
    const feedback =
        evaluateGuess(
            guess
        );
    guesses.push(guess);
    feedbackHistory.push(
        feedback
    );
    attemptsUsed++;
    score = Math.max(
        0,
        STARTING_SCORE -
        (
            attemptsUsed *
            ATTEMPT_COST
        ) -
        (
            (MAX_HINTS -
                hintsRemaining) *
            HINT_COST
        )
    );
    currentGuess =
        createGuess();
    renderBoard();
    updateUI();
    /*
       Check victory.
    */
    if (
        checkWin(feedback)
    ) {
        endGame(true);
        return;
    }
    /*
       Check game over.
    */
    if (
        attemptsUsed >=
        MAX_ATTEMPTS
    ) {
        endGame(false);
        return;
    }
    showStatus(
        "Guess recorded. Keep going.",
        "success"
    );
}
/* =========================================================
   CHECK WIN
========================================================= */
function checkWin(feedback) {
    return feedback.every(
        value =>
            value === "exact"
    );
}
/* =========================================================
   END GAME
========================================================= */
function endGame(won) {
    gameState =
        won
            ? "victory"
            : "gameover";
    revealSecretCode(true);
    renderBoard();
    updateUI();
    /*
       Save statistics.
    */
    saveStatistics(won);
    /*
       Configure result screen.
    */
    if (won) {
        resultIcon.textContent =
            "✓";
        resultTitle.textContent =
            "Code Cracked";
        resultMessage.textContent =
            `You solved the code in ${attemptsUsed} ${
                attemptsUsed === 1
                    ? "attempt"
                    : "attempts"
            }.`;
    } else {
        resultIcon.textContent =
            "×";
        resultTitle.textContent =
            "Game Over";
        resultMessage.textContent =
            "The code remained hidden until the last attempt.";
    }
    renderResultCode();
    resultAttempts.textContent =
        attemptsUsed;
    resultScore.textContent =
        score;
    setTimeout(
        () => {
            resultOverlay.classList.add(
                "visible"
            );
        },
        500
    );
}
/* =========================================================
   REVEAL SECRET CODE
========================================================= */
function revealSecretCode(
    reveal
) {
    const slots =
        secretCodeElement.querySelectorAll(
            ".secret-slot"
        );
    slots.forEach(
        (slot, index) => {
            slot.className =
                "secret-slot";
            if (!reveal) {
                slot.classList.add(
                    "hidden"
                );
            } else {
                slot.classList.add(
                    secretCode[index]
                );
                slot.classList.add(
                    "revealed"
                );
            }
        }
    );
}
/* =========================================================
   RENDER RESULT CODE
========================================================= */
function renderResultCode() {
    resultCode.innerHTML = "";
    secretCode.forEach(
        color => {
            const slot =
                document.createElement(
                    "div"
                );
            slot.className =
                `secret-slot revealed ${color}`;
            resultCode.appendChild(
                slot
            );
        }
    );
}
/* =========================================================
   RENDER BOARD
========================================================= */
function renderBoard() {
    board.innerHTML = "";
    /*
       Render completed guesses.
    */
    guesses.forEach(
        (guess, rowIndex) => {
            const row =
                createGuessRow(
                    guess,
                    feedbackHistory[rowIndex],
                    false
                );
            board.appendChild(row);
        }
    );
    /*
       Render current active row
       while the game is running.
    */
    if (
        gameState === "playing" &&
        attemptsUsed < MAX_ATTEMPTS
    ) {
        const activeRow =
            createGuessRow(
                currentGuess,
                null,
                true
            );
        board.appendChild(
            activeRow
        );
        /*
           Fill remaining empty rows.
        */
        for (
            let i =
                attemptsUsed + 1;
            i < MAX_ATTEMPTS;
            i++
        ) {
            board.appendChild(
                createGuessRow(
                    [],
                    null,
                    false
                )
            );
        }
    } else {
        /*
           After game ends,
           show remaining rows.
        */
        for (
            let i =
                attemptsUsed;
            i < MAX_ATTEMPTS;
            i++
        ) {
            board.appendChild(
                createGuessRow(
                    [],
                    null,
                    false
                )
            );
        }
    }
}
/* =========================================================
   CREATE GUESS ROW
========================================================= */
function createGuessRow(
    guess,
    feedback,
    active
) {
    const row =
        document.createElement(
            "div"
        );
    row.className =
        active
            ? "guess-row active"
            : "guess-row";
    const slots =
        document.createElement(
            "div"
        );
    slots.className =
        "guess-slots";
    for (
        let i = 0;
        i < CODE_LENGTH;
        i++
    ) {
        const slot =
            document.createElement(
                "button"
            );
        slot.className =
            "guess-slot";
        if (
            guess[i]
        ) {
            slot.classList.add(
                "filled"
            );
            slot.classList.add(
                guess[i]
            );
        }
        if (!active) {
            slot.classList.add(
                "locked"
            );
            slot.disabled = true;
        } else {
            slot.setAttribute(
                "aria-label",
                guess[i]
                    ? `Remove ${guess[i]}`
                    : "Empty guess slot"
            );
            slot.addEventListener(
                "click",
                () => {
                    removeColor(i);
                }
            );
        }
        slots.appendChild(
            slot
        );
    }
    const feedbackContainer =
        document.createElement(
            "div"
        );
    feedbackContainer.className =
        "feedback";
    if (feedback) {
        feedback.forEach(
            type => {
                const dot =
                    document.createElement(
                        "span"
                    );
                dot.className =
                    "feedback-dot";
                if (
                    type === "exact"
                ) {
                    dot.classList.add(
                        "exact"
                    );
                } else if (
                    type === "partial"
                ) {
                    dot.classList.add(
                        "partial"
                    );
                }
                feedbackContainer.appendChild(
                    dot
                );
            }
        );
    } else {
        for (
            let i = 0;
            i < CODE_LENGTH;
            i++
        ) {
            const dot =
                document.createElement(
                    "span"
                );
            dot.className =
                "feedback-dot";
            feedbackContainer.appendChild(
                dot
            );
        }
    }
    row.appendChild(
        slots
    );
    row.appendChild(
        feedbackContainer
    );
    return row;
}
/* =========================================================
   UPDATE UI
========================================================= */
function updateUI() {
    const attemptsLeft =
        MAX_ATTEMPTS -
        attemptsUsed;
    attemptsLeftElement.textContent =
        Math.max(
            0,
            attemptsLeft
        );
    scoreElement.textContent =
        score;
    attemptBadge.textContent =
        `${attemptsUsed} / ${MAX_ATTEMPTS}`;
    hintCount.textContent =
        `${hintsRemaining} left`;
    checkBtn.disabled =
        gameState !== "playing" ||
        currentGuess.length !==
        CODE_LENGTH;
    hintBtn.disabled =
        gameState !== "playing" ||
        hintsRemaining <= 0;
    /*
       Disable palette when game ends
       or when guess is full.
    */
    const colorButtons =
        palette.querySelectorAll(
            ".color-button"
        );
    colorButtons.forEach(
        button => {
            const color =
                button.dataset.color;
            const alreadySelected =
                currentGuess.includes(
                    color
                );
            button.classList.toggle(
                "selected",
                alreadySelected
            );
            button.classList.toggle(
                "disabled",
                alreadySelected ||
                currentGuess.length >=
                CODE_LENGTH ||
                gameState !== "playing"
            );
            button.disabled =
                alreadySelected ||
                currentGuess.length >=
                CODE_LENGTH ||
                gameState !== "playing";
        }
    );
    updateStatisticsUI();
}
/* =========================================================
   SCORE UPDATE
========================================================= */
function updateScore() {
    score = Math.max(
        0,
        STARTING_SCORE -
        (
            attemptsUsed *
            ATTEMPT_COST
        ) -
        (
            (MAX_HINTS -
                hintsRemaining) *
            HINT_COST
        )
    );
    scoreElement.textContent =
        score;
}
/* =========================================================
   HINT SYSTEM
========================================================= */
function useHint() {
    if (
        gameState !== "playing"
    ) {
        return;
    }
    if (
        hintsRemaining <= 0
    ) {
        showStatus(
            "You have used all your hints.",
            "error"
        );
        return;
    }
    hintsRemaining--;
    updateScore();
    updateUI();
    const hint =
        generateHint();
    hintBox.textContent =
        hint;
    hintBox.classList.add(
        "visible"
    );
    showStatus(
        "Hint used. 100 points deducted.",
        "success"
    );
    updateScore();
    updateUI();
}
/* =========================================================
   GENERATE HINT
========================================================= */
function generateHint() {
    /*
       Choose randomly between useful
       hint types.
    */
    const availableColors =
        [...COLORS];
    const possibleExisting =
        secretCode.filter(
            color =>
                !guesses.flat().includes(
                    color
                )
        );
    /*
       1. Reveal a color that exists.
    */
    if (
        possibleExisting.length > 0
    ) {
        const color =
            possibleExisting[
                Math.floor(
                    Math.random() *
                    possibleExisting.length
                )
            ];
        return `Hint: ${capitalize(color)} is in the secret code.`;
    }
    /*
       2. Reveal a color that does not exist.
    */
    const absentColors =
        availableColors.filter(
            color =>
                !secretCode.includes(
                    color
                )
        );
    if (
        absentColors.length > 0
    ) {
        const color =
            absentColors[
                Math.floor(
                    Math.random() *
                    absentColors.length
                )
            ];
        return `Hint: ${capitalize(color)} is not in the secret code.`;
    }
    /*
       3. Reveal a correct position.
    */
    const position =
        Math.floor(
            Math.random() *
            CODE_LENGTH
        );
    return `Hint: Position ${
        position + 1
    } contains ${capitalize(
        secretCode[position]
    )}.`;
}
/* =========================================================
   STATISTICS
========================================================= */
function loadStatistics() {
    const statistics =
        JSON.parse(
            localStorage.getItem(
                "mastermindStatistics"
            )
        ) || {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: null,
            bestAttempts: null
        };
    gamesPlayedElement.textContent =
        statistics.gamesPlayed;
    gamesWonElement.textContent =
        statistics.gamesWon;
    bestScoreElement.textContent =
        statistics.bestScore === null
            ? "—"
            : statistics.bestScore;
    bestAttemptsElement.textContent =
        statistics.bestAttempts === null
            ? "—"
            : statistics.bestAttempts;
}
/* =========================================================
   SAVE STATISTICS
========================================================= */
function saveStatistics(won) {
    const statistics =
        JSON.parse(
            localStorage.getItem(
                "mastermindStatistics"
            )
        ) || {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: null,
            bestAttempts: null
        };
    statistics.gamesPlayed++;
    if (won) {
        statistics.gamesWon++;
        if (
            statistics.bestScore === null ||
            score >
            statistics.bestScore
        ) {
            statistics.bestScore =
                score;
        }
        if (
            statistics.bestAttempts === null ||
            attemptsUsed <
            statistics.bestAttempts
        ) {
            statistics.bestAttempts =
                attemptsUsed;
        }
    }
    localStorage.setItem(
        "mastermindStatistics",
        JSON.stringify(statistics)
    );
    updateStatisticsUI();
}
/* =========================================================
   UPDATE STATISTICS UI
========================================================= */
function updateStatisticsUI() {
    const statistics =
        JSON.parse(
            localStorage.getItem(
                "mastermindStatistics"
            )
        ) || {
            gamesPlayed: 0,
            gamesWon: 0,
            bestScore: null,
            bestAttempts: null
        };
    gamesPlayedElement.textContent =
        statistics.gamesPlayed;
    gamesWonElement.textContent =
        statistics.gamesWon;
    bestScoreElement.textContent =
        statistics.bestScore === null
            ? "—"
            : statistics.bestScore;
    bestAttemptsElement.textContent =
        statistics.bestAttempts === null
            ? "—"
            : statistics.bestAttempts;
}
/* =========================================================
   STATUS MESSAGE
========================================================= */
function showStatus(
    message,
    type = ""
) {
    statusMessage.textContent =
        message;
    statusMessage.className =
        `status-message ${type}`;
}
function clearStatus() {
    statusMessage.textContent =
        "";
    statusMessage.className =
        "status-message";
}
/* =========================================================
   SHAKE BOARD
========================================================= */
function shakeBoard() {
    board.classList.remove(
        "shake"
    );
    void board.offsetWidth;
    board.classList.add(
        "shake"
    );
}
/* =========================================================
   KEYBOARD SUPPORT
========================================================= */
function handleKeyboard(event) {
    if (
        gameState !== "playing"
    ) {
        return;
    }
    /*
       Enter = Check
    */
    if (
        event.key === "Enter"
    ) {
        submitGuess();
        return;
    }
    /*
       Number keys 1-6
       select colors.
    */
    const number =
        parseInt(
            event.key
        );
    if (
        number >= 1 &&
        number <= COLORS.length
    ) {
        selectColor(
            COLORS[number - 1]
        );
    }
    /*
       Backspace = remove
       last selected color.
    */
    if (
        event.key === "Backspace"
    ) {
        if (
            currentGuess.length > 0
        ) {
            removeColor(
                currentGuess.length - 1
            );
        }
    }
}
/* =========================================================
   CAPITALIZE
========================================================= */
function capitalize(text) {
    return text.charAt(0).toUpperCase() +
        text.slice(1);
}s
