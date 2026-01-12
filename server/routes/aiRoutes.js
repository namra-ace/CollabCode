const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authenticateJWT = require("../middleware/authenticateJWT");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/ask", authenticateJWT, async (req, res) => {
  const { code, prompt, language } = req.body;

  try {
    // ⚡️ USING GEMINI 2.5 FLASH-LITE
    // This is the most cost-efficient and lowest latency model available.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite" 
    });

    const fullPrompt = `
      You are an expert coding assistant embedded in a code editor.
      The user is working in ${language}.
      
      Here is the current code context they are looking at:
      ---
      ${code}
      ---

      User's Question: ${prompt}
      
      Instructions:
      1. Be concise and helpful.
      2. If providing code, explain it briefly.
      3. Focus on the provided code context.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    res.json({ result: aiText });

  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ 
      error: "AI Service Failed: Ensure your API Key supports 2.5 models." 
    });
  }
});

module.exports = router;