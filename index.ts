import cors from "cors";
import express from "express";
import fs from "fs";
import OpenAI from "openai";
const app = express();
app.use(express.json());
app.use(cors());

const key = process.env.API_KEY;

const openai = new OpenAI({
  apiKey: key,
});

async function getResponse(messages, language) {
  try {
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      typeof language !== "string" ||
      language.trim() === ""
    ) {
      throw new Error("Invalid input");
    }

    const lastMessageFromB = messages
      .slice()
      .reverse()
      .find((msg) => msg.sender == "b");
    if (!lastMessageFromB) {
      throw new Error('No message from sender "b"');
    }
    const context = messages.slice(
      Math.max(messages.length - 8, 0),
      messages.length - 1
    );
    const promptContent = `Conversation with a friend.\n${context
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join("\n")}\nWrite a respond to: "${
      lastMessageFromB.message
    }", in ${language}. Do not refer to your AI capabilities. If the conversation slows down, continue with a relevant question or comment. your answer must be very short.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: promptContent }],
      model: "gpt-4-turbo-preview",
    });

    return completion.choices[0];
  } catch (error) {
    console.error(error.message);

    return { message: { content: "Error: Could not process your request." } };
  }
}

app.post("/gpt4", (req, res) => {
  const { messages, language } = req.body;
  getResponse(messages, language).then((response) => {
    res.json(response.message.content);
  });
});

app.get("/snapModule", (req, res) => {
  const file = fs.readFileSync("./module.js", "utf8");
  res.send(file);
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server started on port 3000");
});
