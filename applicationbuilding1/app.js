let gameBoard = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const divs = document.querySelectorAll(".parent-div div");
const statusDisplay = document.getElementById("status");

divs.forEach((div) => {
  div.addEventListener("click", () => {
    const index = div.getAttribute("data-index");

    if (gameBoard[index] !== "" || !gameActive) {
      return;
    }

    gameBoard[index] = currentPlayer;
    div.innerText = currentPlayer;

    if (checkWinner()) {
      statusDisplay.innerText = `Player ${currentPlayer} Wins!`;
      gameActive = false;
      return;
    }

    if (gameBoard.every((cell) => cell !== "")) {
      statusDisplay.innerText = "It's a Draw!";
      gameActive = false;
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.innerText = `Player ${currentPlayer}'s Turn`;
  });
});

function checkWinner() {
  for (let condition of winningConditions) {
    const [a, b, c] = condition;
    if (
      gameBoard[a] &&
      gameBoard[a] === gameBoard[b] &&
      gameBoard[a] === gameBoard[c]
    ) {
      return true;
    }
  }
  return false;
}

function resetGame() {
  gameBoard = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  statusDisplay.innerText = "Player X's Turn";
  divs.forEach((div) => {
    div.innerText = "";
  });
}