const apiKeyModal = document.getElementById('apiKeyModal');
const modalContent = apiKeyModal.querySelector('.modal-content');
const closeButton = document.querySelector('.close');
const changeOpenAIKeyLink = document.getElementById('changeOpenAIKey');
const userInput = document.getElementById('userInput');
const sendButton = document.querySelector('.input-section button');
const chatArea = document.querySelector('.chat-area');
const figures = document.querySelectorAll('.figure');
const userImageSrc = '/images/user_pfp.jpg'; // Replace with your chosen image path


let apiKey = '';
let selectedFigure = '';

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  document.getElementById('apiKeySubmitButton').addEventListener('click', () => updateApiKey(document.getElementById('apiKeyInput').value));
  closeButton.addEventListener('click', hideApiKeyModal);
  changeOpenAIKeyLink.addEventListener('click', showApiKeyModalOnClick);
  userInput.addEventListener('keypress', submitQuestionOnEnter);
  sendButton.addEventListener('click', submitQuestion);
  figures.forEach(figure => figure.addEventListener('click', () => selectFigure(figure.dataset.figure)));
  document.addEventListener('click', hideApiKeyModalOnClick);
  document.getElementById('apiKeyForm').addEventListener('submit', (event) => { event.preventDefault(); updateApiKey(document.getElementById('apiKeyInput').value); });
  document.getElementById('userInputForm').addEventListener('submit', (event) => { event.preventDefault(); submitQuestion(); });


  
  showApiKeyModal();
  selectFigure('Albert Einstein');
}


function showApiKeyModal() {
  apiKeyModal.style.display = 'block';
  setTimeout(() => {
    modalContent.classList.add('modal-open');
  }, 10);
}

function hideApiKeyModal() {
  modalContent.classList.remove('modal-open');
  setTimeout(() => {
    apiKeyModal.style.display = 'none';
  }, 300);
}

function showApiKeyModalOnClick(event) {
  event.preventDefault();
  showApiKeyModal();
}

function hideApiKeyModalOnClick(event) {
  if (event.target === apiKeyModal) {
    hideApiKeyModal();
  }
}

function updateApiKey(value) {
  if (value) {
    apiKey = value;
    hideApiKeyModal();
  }
}

function selectFigure(figure) {
  console.log(`Selecting figure: ${figure}`);
  selectedFigure = figure;
  highlightSelectedFigure();
}

function updateSelectedFigureImage() {
  const figureImage = document.getElementById('selectedFigureImage');
  const selectedFigureImageSrc = document.querySelector(`.figure[data-figure="${selectedFigure}"] img`).src;
  figureImage.src = selectedFigureImageSrc;
  figureImage.alt = selectedFigure;
  document.getElementById('selectedFigureImageContainer').style.display = 'block';
}

function highlightSelectedFigure() {
  figures.forEach((fig) => {
    if (fig.getAttribute('data-figure') === selectedFigure) {
      fig.classList.add('selected');
    } else {
      fig.classList.remove('selected');
    }
  });
}

function submitQuestionOnEnter(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitQuestion();
  }
}

async function submitQuestion() {
  const userQuestion = userInput.value.trim();
  if (!userQuestion) return;

  userInput.value = '';
  userInput.disabled = true;

  displayUserMessage(userQuestion); // Display the user's message immediately
  const responseText = await fetchGPTResponse(userQuestion, selectedFigure);
  displayChatbotMessage(responseText, selectedFigure); // Display the chatbot's response after it's fetched


  userInput.disabled = false;
}



async function fetchGPTResponse(userQuestion, selectedFigure) {
  console.log('Fetching GPT response for:', userQuestion, selectedFigure);
  const url = 'https://mindmatrix.online/api/gpt';

  const data = {
    userQuestion: userQuestion,
    selectedFigure: selectedFigure,
    apiKey: apiKey,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Server response:", result);
      return result.data; // Changed from result.text to result.data
    } else {
      throw new Error('Error fetching GPT-3.5 response');
    }
  } catch (error) {
    console.error(error);
    return 'An error occurred. Please try again later.';
  }
}


function typeMessage(messageElement, messageText, currentIndex = 0, delay = 30) {
  if (currentIndex < messageText.length) {
    messageElement.textContent += messageText.charAt(currentIndex);
    setTimeout(() => typeMessage(messageElement, messageText, currentIndex + 1, delay), delay);
  }
}

function scrollToBottom() {
  chatArea.scrollTo({
    top: chatArea.scrollHeight,
    behavior: 'smooth'
  });
}

//user message

function displayUserMessage(userQuestion) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-user';

  const userProfilePictureHTML = `<img class="message-image" src="${userImageSrc}" alt="User" />`;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  messageContent.innerHTML = `<p>${userQuestion}</p>`;

  
  messageDiv.appendChild(messageContent);
  messageDiv.insertAdjacentHTML('beforeend', userProfilePictureHTML); // Change this line

  chatArea.appendChild(messageDiv);
  scrollToBottom();
  chatArea.classList.add('has-messages');
  chatArea.scrollTop = chatArea.scrollHeight;
}

//figure message


function displayChatbotMessage(responseText, figure) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message message-figure';

  const selectedFigureImageSrc = document.querySelector(`.figure[data-figure="${figure}"] img`).src;
  const profilePictureHTML = `<img class="message-image" src="${selectedFigureImageSrc}" alt="${figure}" />`;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  const messageTextElement = document.createElement('span');
  messageTextElement.classList.add('hidden');

  messageDiv.innerHTML = `${profilePictureHTML}`;
  messageDiv.appendChild(messageContent);
  messageContent.appendChild(messageTextElement);

  const userMessage = chatArea.querySelector('.message-user:last-child');
  if (userMessage) {
    userMessage.insertAdjacentElement('afterend', messageDiv);
  } else {
    chatArea.appendChild(messageDiv);
  }
  
  chatArea.classList.add('has-messages');

  console.log("responseText:", responseText);
  
  setTimeout(() => {
    messageTextElement.classList.remove('hidden');
    typeMessage(messageTextElement, responseText);
    scrollToBottom();
  }, 300);
}

