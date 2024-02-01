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
            content: `See which chatbots are active: ${activeChatbots.join(', ')}.
                    Pick one chatbot to respond as, based on the chat's flow. Avoid repeating the same chatbot consecutively.
                    Start your message with the chosen chatbot's name, then a colon, like 'Albert Einstein: [Your Message]'.
                    If there's only one chatbot, use that one.
                    Keep your response conversational and interesting, not for assistance.
                    If it's the first message, just pick a chatbot and start the conversation.`
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
