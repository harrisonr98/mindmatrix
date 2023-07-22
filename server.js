const express = require("express");
const cors = require("cors");
const openai = require("openai");
const { Configuration, OpenAIApi } = openai;
const path = require("path");
const dotenv = require("dotenv");


const corsOptions = {
    origin: 'http://mindmatrix.online', 
    optionsSuccessStatus: 200,
  };


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.post('/api/gpt', async (req, res) => {
    const { chatHistories, activeChatbots } = req.body;


    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);


    const messages = [
        {
            role: "system",
            content: `You are participating in a multi-chatbot environment featuring historical figures, the user is also in the chat.
            The currently active chatbots are: ${activeChatbots.join(', ')}.
            Always start your response with the chatbot's name, followed by a colon, then your message of something the chatbot you chose would say in the context of the conversation.
            If there is only one active chatbot, you are to choose this chatbot to act as in your response.
            Always start your response with the chatbot's name who you chose, followed by a colon, then your message, i.e 'Albert Einstein: Your message here'.
            Your task is to choose one of these chatbots to act as in your response and then type a message.
            Base your decision on the context of the chat history thus far.
            Try not to have the same chatbot respond twice in a row.
            The chat history provided to you is in the correct, chronological order.
            For example, if you're emulating 'Albert Einstein', your response should be 'Albert Einstein: Your message here'.
            Only send one message from one chatbot in your response.
            You do not need to offer assistance, rather - be more conversational, entertaining, and interesting.
            If there are no previous chatbot messages, choose an active chatbot and start the conversation by sending a response in the same format, i.e. 'Albert Einstein: Your message here'.`
        },
    ];
    messages.push(...chatHistories); // spread chatHistories directly into messages

                                                                     //console.log('Input to OpenAI API:', messages); // log the input

    try {
        const result = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: messages,
        });

                                                                     //console.log('Output from OpenAI API:', result.data); // log the output

        let assistantMessage = result.data.choices[0].message.content;

        // Extract chatbot name and the message using regex
        const match = assistantMessage.match(/^(.*?):\s*(.*)$/);
        if (match) {
            const chatbotName = match[1];
            assistantMessage = match[2];

            // Check if the chatbot name is one of the active chatbots
            if (activeChatbots.includes(chatbotName)) {
                res.send({ message: assistantMessage, activeChatbot: chatbotName });
            } else {
                console.error(`The assistant's message starts with an unknown chatbot name: ${chatbotName}`);
                res.status(500).send({ error: 'Error parsing GPT-4 response', details: `The assistant's message starts with an unknown chatbot name: ${chatbotName}` });
            }
        } else {
            // No chatbot name found in the assistant's message. Send the raw response.
            console.log("The assistant's message does not start with a chatbot name. Sending the raw response.");
            res.send({ message: assistantMessage });
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error, error.stack);
        if (error.response) {
            console.error('API error response:', error.response.data);
        }
        res.status(500).send({ error: 'Error fetching GPT-4 response', details: error.message, stack: error.stack });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
