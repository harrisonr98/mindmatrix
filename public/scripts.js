$(document).ready(function() {  // Wait for the document to be ready before running any code
    let activeChatbots = [];    // Array to store the names of the active chatbots
    let activeChatbotImgSrcs = {};  // Object to store the image srcs of the active chatbots
    let isTyping = false;    // Boolean to track if the chatbot is typing
    let isConversationAutomated = false;   // Boolean to track if the conversation is automated
    let chatHistory = [];   // Array to store the chat history
    let messageQueue = [];  // Array to store the messages to be sent to the server




    // Initially disable the automate chat button
    $('#automate-chat-button').prop('disabled', true); 




    function randomChatbotJoinAndMessage() {
        let chatbotButtons = $('.chatbot-btn');
        if (chatbotButtons.length > 0) {
            // Select a random chatbot
            let randomIndex = Math.floor(Math.random() * chatbotButtons.length);
            let randomChatbotButton = chatbotButtons.eq(randomIndex);
            let chatbotName = randomChatbotButton.find('.chatbot-name').text();
            let chatbotImgSrc = randomChatbotButton.data('img-src');

            // Add chatbot to activeChatbots and update UI
            activeChatbots.push(chatbotName);
            activeChatbotImgSrcs[chatbotName] = chatbotImgSrc;
            randomChatbotButton.addClass('active-bot');
            $(".selected-chatbots").append('<img data-bot="' + chatbotName + '" src="' + chatbotImgSrc + '" alt="' + chatbotName + '">');

            // Delay before sending initial message from the chatbot
            setTimeout(function() {
                let initialMessage = `Hello there! I'm ${chatbotName}, one of the historical figures you can chat with on MindMatrix. What's on your mind today?`;
                addBotMessage(initialMessage, chatbotName);
            }, 1000); // 1-second delay
        }
    }

    // Call the function to randomly select a chatbot and make it send a message
    randomChatbotJoinAndMessage();

    


 $('.chatbot-btn').click(async function(event) {
    event.stopPropagation();

    let clickedChatbot = $(this).find('.chatbot-name').text();
    let imgSrc = $(this).data('img-src');

    let index = activeChatbots.indexOf(clickedChatbot);

    if (activeChatbots.includes(clickedChatbot)) {
        $(this).removeClass('active-bot');
        const chatbotIndex = activeChatbots.indexOf(clickedChatbot);
        activeChatbots.splice(chatbotIndex, 1);
        delete activeChatbotImgSrcs[clickedChatbot];

        // remove image from the chat interface
        $(".selected-chatbots img[data-bot='" + clickedChatbot + "']").remove();
    } else {
        activeChatbots.push(clickedChatbot);
        activeChatbotImgSrcs[clickedChatbot] = $(this).data('img-src');
        $(this).addClass('active-bot');

        // add image to the chat interface
        $(".selected-chatbots").append('<img data-bot="' + clickedChatbot + '" src="' + imgSrc + '" alt="' + clickedChatbot + '">');
    }


        // Enable or disable the automate chat button
        const automateChatButton = $('#automate-chat-button');
        if (activeChatbots.length <= 1) {
            automateChatButton.prop('disabled', true);
        } else {
            automateChatButton.prop('disabled', false);
        }
    });



$('#automate-chat-button').click(function() {
    isConversationAutomated = !isConversationAutomated;
    $(this).text(isConversationAutomated ? 'Pause' : 'Auto-Chat');

    // Check if there's text in the input and send it
    let userInput = $('#chat-input').val(); // Get the user input
    if (userInput.trim().length > 0) { // Check if the input is not empty
        sendUserMessage(); // Send the user message
    }

    if (isConversationAutomated) {
        // Hide form control, send button, and help message
        $('#chat-input').hide();
        $('#send-button').hide();
        $('#help-message').hide(); // Hide the help message
        automateConversation();
    } else {
        // Show form control, send button, and help message
        $('#chat-input').show();
        $('#send-button').show();
        $('#help-message').show(); // Show the help message
    }
});



$('.btn-primary').click(sendUserMessage); // Send user message when the button is clicked
$('.form-control').keypress(function(event) { // Listen for keypress on the input
    if (event.which == 13) { // Enter key
        event.preventDefault(); // Prevent the default action (scroll / move caret)
        sendUserMessage(); // Send the user message
    }
});




function sendUserMessage() {
    let message = $('.form-control').val();
    if (message) {
        addUserMessage(message);
        $('.form-control').val('');
        if (activeChatbots.length > 0 && !isConversationAutomated) {
            messageQueue.push({userMessage: message, activeChatbot: activeChatbots[0], activeChatbots: activeChatbots});
        }
        scrollChatToBottom(true);
        scrollPageToTop(); // New function call to scroll to the top
        closeKeyboard(); // New function call to close the keyboard
    }
}

// Function to scroll the page to the top
function scrollPageToTop() {
    window.scrollTo(0, 0); // Scrolls to the top of the page
}

// Function to close the keyboard on mobile devices
function closeKeyboard() {
    // This will trigger blur event and close the keyboard on mobile devices
    document.activeElement.blur();
    $('input').blur();
}

function typeMessage(messageElement, messageText, observer, currentIndex = 0, delay = 30) {
    if (currentIndex < messageText.length) {
        isTyping = true;
        messageElement.textContent += messageText.charAt(currentIndex);
        setTimeout(() => typeMessage(messageElement, messageText, observer, currentIndex + 1, delay), delay);
    }     else {
        observer.disconnect();
        isTyping = false;
        if (isConversationAutomated) {
            automateConversation();
        }
        scrollChatToBottom();
    }
}

async function automateConversation() {
    if (!isConversationAutomated || isTyping || activeChatbots.length < 2) {
        return;
    }

    const serverData = {
        chatHistories: chatHistory,
        activeChatbots: activeChatbots
    };

    messageQueue.push(serverData);
}




function addSystemMessage(message) {
    chatHistory.push({role: 'system', content: message});
    $('.chat-output').append(`<p class="system-message">${message}</p>`);
    scrollChatToBottom();
}


function addUserMessage(message) {
    const userImg = 'images/user_pfp.jpg';
    chatHistory.push({role: 'user', content: `You ${message}`});
    let messageElement = $(`
        <div class="user-message">
            <div class="user-info">
                <img src="${userImg}" alt="User">
                <strong>You</strong>
            </div>
            <div class="user-text">
                ${message}
            </div>
        </div>
    `);
    $('.chat-output').append(messageElement);
    scrollChatToBottom(true);
}

function addBotMessage(message, activeChatbot) {
    let imageSrc = activeChatbotImgSrcs[activeChatbot];
    chatHistory.push({role: 'assistant', content: `${activeChatbot}: ${message}`});
    let messageElement = $(`
    <div class="bot-message">
    <div class="bot-info">
        <img src="${imageSrc}" alt="${activeChatbot}">
        <strong>${activeChatbot}</strong>
    </div>
    <div class="bot-text">
        <span class="typewriter"></span>
    </div>
</div>
`);
$('.chat-output').append(messageElement);


scrollChatToBottom(true);


let botText = messageElement.find('.bot-text')[0];
let lastHeight = botText.clientHeight;
const observer = new MutationObserver(function() {
if (botText.clientHeight > lastHeight) {
    lastHeight = botText.clientHeight;

    scrollChatToBottom();
}
});
observer.observe(botText, {attributes: true, childList: true, characterData: true, subtree: true});

typeMessage(messageElement.find('.typewriter')[0], message, observer);
}




function scrollChatToBottom(forceScroll = false) {
const chatOutput = $('.chat-output');
const scrollHeight = chatOutput[0].scrollHeight;
const scrollTop = chatOutput.scrollTop();
const scrollPos = scrollTop + chatOutput.outerHeight();


if (forceScroll || scrollHeight - scrollPos < 50) {
chatOutput.scrollTop(scrollHeight);
}

}
async function processQueue() {
    if (!isTyping && messageQueue.length > 0) {
        let data = messageQueue.shift();
        await sendToServer(data);
    }


    setTimeout(processQueue, 1000);
}


async function sendToServer(serverData) {
    const url = '/api/gpt';

    let chatHistories = [];
    activeChatbots.forEach((chatbot) => {
      chatHistories = chatHistories.concat(chatHistory[chatbot]);
    });

    const data = {
        chatHistories: chatHistory,
        userMessage: serverData.userMessage,
        activeChatbots: serverData.activeChatbots,
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
            if (!result.message) {
                if (isConversationAutomated) {
                    setTimeout(automateConversation, 1000);
                }
            } else {
                if (activeChatbots.includes(result.activeChatbot)) {
                    addBotMessage(result.message, result.activeChatbot);
                } else {
                    console.error(`Received message from inactive or unknown chatbot ${result.activeChatbot}`);
                }

                if (isConversationAutomated && !isTyping) {
                    setTimeout(automateConversation, 1000);
                }
            }
        } else {
            throw new Error('Error fetching GPT-4 response');
        }
    } catch (error) {
        console.error(error);
        addSystemMessage('An error occurred. Please try again later.');
    }
}
processQueue();

});

$('#clear-chat-button').click(function() {
    // Clear chat history
    chatHistory = [];

    // Clear chat output on the page
    $('.chat-output').empty();

    // Optional: Add a system message stating chat has been cleared
    addSystemMessage('Chat has been cleared.');
});



$('#unselect-all-button').click(function() {
    // Remove all active chatbots
    activeChatbots = [];
    activeChatbotImgSrcs = {};

    // Update UI: Remove active class from chatbot buttons
    $('.chatbot-btn').removeClass('active-bot');

    // Clear the selected chatbots images
    $(".selected-chatbots").empty();

    // Hide the automate chat button if it's visible
    $('#toggle-auto-chat').hide();
});
