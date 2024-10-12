let clientId = '176891448048-vmknr61qptail59d019bvcml719vi9qb.apps.googleusercontent.com';

const scriptID = 'AKfycbxKJTVa_9ii5AHhnUeR5eV_CU8BJI0Ynkh6_ovTZE3vEdE9X2b8LZ94JtSp-TLIsrx1';

// Start the Trivia Game
document.addEventListener('DOMContentLoaded', () => {
  let currentQuestionIndex = 0;
  let pointsRemaining;
  let timerInterval;
  const penaltyPerIncorrect = 5;

  const teamNameElement = document.getElementById('team-name');
  const timerElement = document.getElementById('timer');
  const questionElement = document.getElementById('question');
  const optionsElement = document.getElementById('options');
  const feedbackElement = document.getElementById('feedback');
  const finalScoreElement = document.getElementById('final-score');
  const scoreElement = document.getElementById('score');

  const questions = [
    {
      question: 'What is the capital of France?',
      options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
      correct: 2
    },
    {
      question: 'Which planet is known as the Red Planet?',
      options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
      correct: 1
    },
    {
      question: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correct: 3
    }
  ];

  function startTrivia() {
    loadTeamData().then(() => {
      loadTeamName();
      calculatePointsBasedOnElapsedTime();
      startTimer();
      loadQuestion();
    });
  }

  function loadTeamName() {
    const params = new URLSearchParams(window.location.search);
    const teamName = params.get('team') || 'Unknown Team';
    teamNameElement.textContent = teamName;
  }

  function startTimer() {
    timerElement.textContent = `Points Remaining: ${pointsRemaining}`;
    timerInterval = setInterval(() => {
      pointsRemaining -= 1;
      timerElement.textContent = `Points Remaining: ${pointsRemaining}`;
      if (pointsRemaining <= 0) {
        endTrivia();
      }
    }, 1000);
  }

  function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
      endTrivia();
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;
    optionsElement.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.textContent = option;
      button.classList.add('option-button');
      button.addEventListener('click', () => checkAnswer(index));
      optionsElement.appendChild(button);
    });
  }

  function checkAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    logQuestionSubmission(selectedIndex, selectedIndex === currentQuestion.correct);
    if (selectedIndex === currentQuestion.correct) {
      feedbackElement.textContent = 'Correct!';
      currentQuestionIndex++;
      saveProgress();
      setTimeout(() => {
        feedbackElement.textContent = '';
        loadQuestion();
      }, 1000);
    } else {
      feedbackElement.textContent = 'Incorrect! Try again.';
      pointsRemaining -= penaltyPerIncorrect;
      timerElement.textContent = `Points Remaining: ${pointsRemaining}`;
      saveProgress();
    }
  }

  function endTrivia() {
    clearInterval(timerInterval);
    questionElement.style.display = 'none';
    optionsElement.style.display = 'none';
    timerElement.style.display = 'none';
    feedbackElement.style.display = 'none';
    finalScoreElement.style.display = 'block';
    scoreElement.textContent = pointsRemaining;
    saveProgress(true);
  }

  function saveProgress(isFinal = false) {
    const params = new URLSearchParams(window.location.search);
    const teamName = params.get('team') || 'Unknown Team';
    const scriptURL = `https://script.google.com/macros/s/${scriptID}/exec`;
    const formData = new FormData();
    formData.append('team', teamName);
    formData.append('currentQuestionIndex', currentQuestionIndex);
    formData.append('pointsRemaining', pointsRemaining);
    formData.append('isFinal', isFinal);
    formData.append('timestamp', new Date().toISOString());

    fetch(scriptURL, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        console.error('Error saving progress:', result.error);
      } else {
        console.log('Progress saved successfully:', result);
      }
    })
    .catch(error => console.error('Error saving progress!', error.message));
  }

  function logQuestionSubmission(selectedIndex, isCorrect) {
    const params = new URLSearchParams(window.location.search);
    const teamName = params.get('team') || 'Unknown Team';
    const scriptURL = `https://script.google.com/macros/s/${scriptID}/exec?log=true`;
    const formData = new FormData();
    formData.append('team', teamName);
    formData.append('questionIndex', currentQuestionIndex);
    formData.append('selectedIndex', selectedIndex);
    formData.append('isCorrect', isCorrect);
    formData.append('timestamp', new Date().toISOString());

    fetch(scriptURL, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        console.error('Error logging question:', result.error);
      } else {
        console.log('Question logged successfully:', result);
      }
    })
    .catch(error => console.error('Error logging question!', error.message));
  }

  async function loadTeamData() {
    const params = new URLSearchParams(window.location.search);
    const teamName = params.get('team') || 'Unknown Team';
    const scriptURL = `https://script.google.com/macros/s/${scriptID}/exec?team=${teamName}`;

    try {
      const response = await fetch(scriptURL);
      const data = await response.json();
      if (data && data.currentQuestionIndex !== undefined && data.pointsRemaining !== undefined) {
        currentQuestionIndex = parseInt(data.currentQuestionIndex, 10);
        pointsRemaining = parseInt(data.pointsRemaining, 10);

        // Calculate time elapsed since last save and adjust points
        if (data.timestamp) {
          const lastTimestamp = new Date(data.timestamp);
          const now = new Date();
          const secondsElapsed = Math.floor((now - lastTimestamp) / 1000);
          pointsRemaining -= secondsElapsed;
          if (pointsRemaining < 0) {
            pointsRemaining = 0;
          }
        }
      } else {
        pointsRemaining = 1000;
      }
    } catch (error) {
      console.error('Error loading team data!', error.message);
      pointsRemaining = 1000;
    }
  }

  function calculatePointsBasedOnElapsedTime() {
    timerElement.textContent = `Points Remaining: ${pointsRemaining}`;
  }

  startTrivia();
});