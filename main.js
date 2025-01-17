import {
  createUser,
  findUser,
  getRandomUnsolvedQuestion,
  insertSolveData,
  getLeaderboard,
  getQuestions,
  removeQuestion,
  getTotalQuestion,
  insertQuestion,
  updateQuestion,
} from "/database.js";

// global elements
const questionElement = document.getElementById("question");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit");
const messageElement = document.getElementById("message");
const curQuestionElement = document.getElementById("question_no");

var username = null;
var currentQuestion = null;
var questionNo = 0;

var timer = 0;
var startTime = Date.now();

// Function to update and display the timer
function startTimer() {
  function update() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedTime > timer) {
      timer = elapsedTime;
    }
    requestAnimationFrame(update);
  }
  update();
}

document.querySelectorAll(".logout-btn").forEach((button) => {
  button.addEventListener("click", function () {
    username = null;
    document.getElementById("login-container").style.display = "block";
    document.getElementById("game-container").style.display = "none";
    document.getElementById("admin-container").style.display = "none";
  });
});

document.getElementById("login-btn").addEventListener("click", function () {
  username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  if (username && password) {
    findUser(username, password).then((result) => {
      if (result.status == "exists") {
        if (!result.user.isAdmin) {
          getTotalQuestion().then((result) => {
            questionNo = result;
          });
          nextQuestion(username);
        } else {
          adminLogin();
        }
      } else {
        alert("Username or password is wrong!");
      }
    });
  } else {
    alert("Please enter both username and password.");
  }
});

document
  .getElementById("create-user-btn")
  .addEventListener("click", function () {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("signup-container").style.display = "block";
  });

document.getElementById("signin-btn").addEventListener("click", function () {
  document.getElementById("login-container").style.display = "block";
  document.getElementById("signup-container").style.display = "none";
});

document
  .getElementById("signup-btn")
  .addEventListener("click", async function () {
    const sup_username = document.getElementById("signup-username").value;
    const sup_password = document.getElementById("signup-password").value;

    createUser(sup_username, sup_password)
      .then((result) => {
        if (result.status === "exists") {
          alert("User already exist!");
        } else {
          alert("User registration successful");
        }
      })
      .catch((error) => {
        console.log("Error occurred during user registration:", error);
      });
  });

function nextQuestion(username) {
  getRandomUnsolvedQuestion(username).then((data) => {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    // Handle the result here
    if (data.length === 0) {
      questionElement.style.display = "none";
      answerInput.style.display = "none";
      submitButton.style.display = "none";
      messageElement.style.color = "black";
      messageElement.textContent =
        "Congratulations, you've completed the game!";
      curQuestionElement.style.display = "none";
    } else {
      currentQuestion = data[0];
      questionElement.style.display = "block";
      answerInput.style.display = "block";
      submitButton.style.display = "block";
      questionElement.textContent = currentQuestion.question;

      answerInput.value = ""; // Clear the input
      messageElement.textContent = ""; // Clear the message
      curQuestionElement.style.display = "block";
      curQuestionElement.textContent =
        "Question: " + (currentQuestion.total_solved + 1) + "/" + questionNo;

      startTime = Date.now();
      timer = 0;
      startTimer();
    }
  });
}

// Event Handler: When you click the button
submitButton.addEventListener("click", function () {
  const userAnswer = answerInput.value.trim();
  const correctAnswer = currentQuestion.answer;

  var isCorrect = false;

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
    messageElement.textContent = "Correct! Well done.";
    messageElement.style.color = "green";
    isCorrect = true;
  } else {
    messageElement.textContent =
      "Wrong answer. The correct answer is: " + currentQuestion.answer;
    messageElement.style.color = "red";
  }

  insertSolveData(currentQuestion.qid, username, isCorrect, timer);
  // Pass the next question to move forward
  setTimeout(function () {
    nextQuestion(username);
  }, 1000);
});

// leader board

let page = 0;
let lboard = null;
const usersPerPage = 5; // Show 5 users per page

function displayLeaderboard() {
  const paginatedLeaderboard = lboard.slice(
    page * usersPerPage,
    (page + 1) * usersPerPage
  );
  const leaderboardBody = document.getElementById("leaderboard-body");
  leaderboardBody.innerHTML = ""; // Clear the existing leaderboard
  let curNo = page * usersPerPage + 1;
  paginatedLeaderboard.forEach((user) => {
    const tr = document.createElement("tr");
    if (user.username === username) {
      tr.classList.add("orange"); // Apply the orange class
    }
    tr.innerHTML = `
        <td>${curNo}</td>
        <td>${user.username}</td>
        <td>${user.totalCorrect}</td>
        <td>${user.totalTime}</td>
      `;
    leaderboardBody.appendChild(tr);
    curNo++;
  });
}

document
  .getElementById("leaderboard-btn")
  .addEventListener("click", async function () {
    getLeaderboard().then((result) => {
      document.getElementById("leader-board-container").style.display = "block";
      document.getElementById("game-container").style.display = "none";
      lboard = result;
      displayLeaderboard();
      updateNavigationButtons(page, lboard.length);
    });
  });

function updateNavigationButtons(page, totalUsers) {
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const prevButton = document.getElementById("prev-btn");
  const nextButton = document.getElementById("next-btn");

  // Hide or show the prev button
  prevButton.disabled = page === 0;

  // Hide or show the next button
  nextButton.disabled = page === totalPages - 1;
}

document.getElementById("prev-btn").addEventListener("click", () => {
  if (page > 0) {
    page--;
    displayLeaderboard();
    updateNavigationButtons(page, lboard.length);
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  page++;
  displayLeaderboard();
  updateNavigationButtons(page, lboard.length);
});

document
  .getElementById("back-to-game-btn")
  .addEventListener("click", async function () {
    document.getElementById("leader-board-container").style.display = "none";
    document.getElementById("game-container").style.display = "block";
  });

// questions admin

let admin_page = 0;
let questions = null;
const questionPerPage = 5; // Show 10 questions per page

function displayQuestions() {
  const paginatedQuestions = questions.slice(
    admin_page * questionPerPage,
    (admin_page + 1) * questionPerPage
  );
  const questionsBody = document.getElementById("questions-body");
  questionsBody.innerHTML = ""; // Clear the existing leaderboard
  let curNo = admin_page * questionPerPage + 1;
  paginatedQuestions.forEach((quest) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${quest.question}</td>
        <td>${quest.answer}</td>
        <td>
          <button class="edit-qst" style="background-color: #afa54c;" id="edit_${quest.qid}">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="delete-qst" style="background-color: red;" id="delete_${quest.qid}">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      `;
    const deleteButton = tr.querySelector(`#delete_${quest.qid}`);
    deleteButton.addEventListener("click", () => deleteQuestion(quest.qid));

    const editButton = tr.querySelector(`#edit_${quest.qid}`);
    editButton.addEventListener("click", () => openEditPopup(quest));

    questionsBody.appendChild(tr);
    curNo++;
  });
}

function adminLogin() {
  admin_page = 0;
  document.getElementById("login-container").style.display = "none";
  document.getElementById("admin-container").style.display = "block";

  getQuestions().then((result) => {
    document.getElementById("admin-container").style.display = "block";
    document.getElementById("login-container").style.display = "none";
    questions = result;
    displayQuestions();
    updateNavigationAdm(admin_page, questions.length);
  });
}

function updateNavigationAdm(admin_page, totalQuestions) {
  const totalPages = Math.ceil(totalQuestions / questionPerPage);
  const prevButton = document.getElementById("prev-btn-adm");
  const nextButton = document.getElementById("next-btn-adm");

  // Hide or show the prev button
  prevButton.disabled = admin_page === 0;

  // Hide or show the next button
  nextButton.disabled = admin_page === totalPages - 1;
}

document.getElementById("prev-btn-adm").addEventListener("click", () => {
  if (admin_page > 0) {
    admin_page--;
    displayQuestions();
    updateNavigationAdm(admin_page, questions.length);
  }
});

document.getElementById("next-btn-adm").addEventListener("click", () => {
  admin_page++;
  displayQuestions();
  updateNavigationAdm(admin_page, questions.length);
});

function deleteQuestion(delete_qid) {
  const userConfirmed = window.confirm(
    "Are you sure you want to delete this question?"
  );
  if (userConfirmed) {
    removeQuestion(delete_qid).then(() => {
      adminLogin();
    });
  }
}

// open add question pop-up
document.getElementById("add-qst-btn").addEventListener("click", () => {
  document.getElementById("question-input").value = "";
  document.getElementById("answer-input").value = "";
  document.getElementById("add-question-label").style.display = "block";
  document.getElementById("add-question-btn").style.display = "block";
  document.getElementById("edit-question-label").style.display = "none";
  document.getElementById("edit-question-btn").style.display = "none";
  document.getElementById("popup-container").style.display = "flex";
});

// Close the popup when the close button is clicked
document.getElementById("close-popup-btn").addEventListener("click", () => {
  document.getElementById("popup-container").style.display = "none";
});

// Close the popup when the close button is clicked
document.getElementById("add-question-btn").addEventListener("click", () => {
  var new_quest = document.getElementById("question-input").value;
  var new_ans = document.getElementById("answer-input").value;
  insertQuestion(new_quest, new_ans).then(() => {
    alert("New question is added!");
    adminLogin();
    document.getElementById("question-input").value = "";
    document.getElementById("answer-input").value = "";
    document.getElementById("popup-container").style.display = "none";
  });
});

let curEditQuestQID = -1;

function openEditPopup(quest) {
  document.getElementById("question-input").value = quest.question;
  document.getElementById("answer-input").value = quest.answer;

  document.getElementById("add-question-label").style.display = "none";
  document.getElementById("add-question-btn").style.display = "none";
  document.getElementById("edit-question-label").style.display = "block";
  document.getElementById("edit-question-btn").style.display = "block";
  document.getElementById("popup-container").style.display = "flex";

  curEditQuestQID = quest.qid;
}

document.getElementById("edit-question-btn").addEventListener("click", () => {
  var quest = document.getElementById("question-input").value;
  var ans = document.getElementById("answer-input").value;
  updateQuestion(curEditQuestQID, quest, ans).then(() => {
    alert("Question is updated!");
    adminLogin();
    document.getElementById("question-input").value = "";
    document.getElementById("answer-input").value = "";
    document.getElementById("popup-container").style.display = "none";
  });
});
