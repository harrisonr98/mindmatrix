$(document).ready(function() { 
    let activeChatbots = [];
    let activeChatbotImgSrcs = {};
    let isTyping = false;
    let isConversationAutomated = false;
    let chatHistory = [];
    let messageQueue = [];



    $("#open-side-panel-btn").click(function() {
        $(".side-panel").css("left", "0"); // Show the side panel by setting left position to 0
      });
      
      
      $("#slide-back-btn").click(function() {
        $(".side-panel").css("left", "-100%"); // Hide the side panel by setting left position to -100%
      });
      
      

    $('#toggle-auto-chat').click(function(event) {
        event.stopPropagation();

        if (!isConversationAutomated && $('.form-control').val()) {
            sendUserMessage();
        }

        isConversationAutomated = !isConversationAutomated;


        if (isConversationAutomated) {
            $(this).text('Pause');
            $('#chat-input').attr('disabled', 'disabled');
            $('#chat-input').prop('placeholder', 'Pause to send a message');
            if (activeChatbots.length > 1) {
                automateConversation();
            }
        } else {
            $(this).text('Automate');
            $('#chat-input').removeAttr('disabled');
            $('#chat-input').prop('placeholder', 'Type your message here...');
        }
    });


$('input').focus(function(){
    $(this).attr('placeholder','');
 }).blur(function(){
    $(this).attr('placeholder','Type your message here...');
 });


 $('.category-btn').click(function(event) {
    // Get the id of the clicked category button
    let category = $(this).attr('id');
    // Hide the category list
    $('.category-list').addClass('d-none');
    // Show the chatbot list
    $('.chatbot-list').removeClass('d-none');
    // Change the title to "Select Chatbot(s)"
    $('.side-panel h2').text('Select Chatbot(s)');
    // Filter the chatbot buttons based on the category
    $('.chatbot-btn').each(function() {
        if ($(this).data('category') === category) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
});

$('.back-btn').click(function(event) {
    // Show the category list
    $('.category-list').removeClass('d-none');
    // Hide the chatbot list
    $('.chatbot-list').addClass('d-none');
    // Change the title back to "Select a Category"
    $('.side-panel h2').text('Select a Category');
});


 $('.chatbot-btn').click(async function(event) {
    event.stopPropagation();

    let clickedChatbot = $(this).find('.chatbot-name').text();
    let imgSrc = $(this).data('img-src');

    let index = activeChatbots.indexOf(clickedChatbot);
    if (activeChatbots.includes(clickedChatbot)) {
        addSystemMessage(`${clickedChatbot} has left the chat.`);
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
        addSystemMessage(`${clickedChatbot} has joined the chat.`);

        // add image to the chat interface
        $(".selected-chatbots").append('<img data-bot="' + clickedChatbot + '" src="' + imgSrc + '" alt="' + clickedChatbot + '" width="100" style="margin-right: 10px;">');
    }
        if (activeChatbots.length > 1) {
            $('#toggle-auto-chat').text(isConversationAutomated ? 'Pause' : 'Automate');
            $('#toggle-auto-chat').show();
            $('#send-button').hide();
        } else {
            $('#toggle-auto-chat').hide();
            $('#send-button').show();
            if (isConversationAutomated) {
                $('#toggle-auto-chat').click();
            }
        }

    });



    $('.btn-primary').click(sendUserMessage);
    $('.form-control').keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            if (activeChatbots.length > 1) {
                if (!isConversationAutomated) {
                    $('#toggle-auto-chat').click();
                } else {
                    sendUserMessage();
                }
            } else {
                sendUserMessage();
            }
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
        }
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










