const express = require("express");
const cors = require("cors");
const openai = require("openai");
const { Configuration, OpenAIApi } = openai;
const path = require("path");

const corsOptions = {
  origin: 'http://mindmatrix.online', // Replace 'yourdomain.com' with your actual domain.
  optionsSuccessStatus: 200,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions)); // Remove the duplicate line

app.use(express.static("/"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/openai_key", (req, res) => {
  const { apiKey } = req.body;
  res.sendStatus(200);
});

app.post("/api/gpt", async (req, res) => {
  const { userQuestion, selectedFigure, apiKey } = req.body;

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openaiClient = new OpenAIApi(configuration);

  try {
    const result = await openaiClient.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are ${selectedFigure}. Respond to the following message as ${selectedFigure} if ${selectedFigure} were alive today.`,
        },
        { role: "user", content: userQuestion },
      ],
    });

    const assistantMessage = result.data.choices[0].message.content;
    res.send({ data: assistantMessage });
  } catch (error) {
    console.error("Error calling OpenAI API:", error, error.stack);
    res.status(500).send({ error: "Error fetching GPT-3.5 response", details: error.message, stack: error.stack }); // Add error details and stack trace
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
