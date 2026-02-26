// ===== Grab elements from the HTML =====
var boxes = Array.prototype.slice.call(document.querySelectorAll(".box"));
var scoreEl = document.getElementById("score");
var timerEl = document.getElementById("timer");
var msgEl = document.getElementById("msg");
var startBtn = document.getElementById("start-btn");

// ===== Game State Variables =====
var score = 0;
var timeLeft = 30;
var gameOn = false;
var timer1; // for mole popping
var timer2; // for countdown

function clearMoles() {
  boxes.forEach(function (b) {
    b.textContent = "";
    b.classList.remove("mole");
  });
}

// picks a random box and shows the mole
function showMole() {
  // clear old mole first
  clearMoles();

  // pick random box
  var rand = Math.floor(Math.random() * boxes.length);
  boxes[rand].textContent = "🐹";
  boxes[rand].classList.add("mole");
}

// when player clicks a box
function hit(box) {
  if (!gameOn) return;
  if (!box.classList.contains("mole")) return;

  score++;
  scoreEl.textContent = score;

  // hide the mole after clicking
  box.textContent = "";
  box.classList.remove("mole");
}

function resetTimers() {
  clearInterval(timer1);
  clearInterval(timer2);
}

// starts the game
function startGame() {
  resetTimers();
  score = 0;
  timeLeft = 30;
  gameOn = true;
  scoreEl.textContent = 0;
  timerEl.textContent = 30;
  msgEl.textContent = "";

  // show mole every 1 second
  timer1 = setInterval(showMole, 1000);

  // countdown timer
  timer2 = setInterval(function () {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// ends the game
function endGame() {
  gameOn = false;
  resetTimers();

  // clear any leftover mole
  clearMoles();

  msgEl.textContent = "Game Over! You scored " + score + " points.";
}

// wire events
startBtn.addEventListener("click", startGame);
boxes.forEach(function (box) {
  box.addEventListener("click", function () {
    hit(box);
  });
});