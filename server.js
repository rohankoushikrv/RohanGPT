const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Replace with your real OpenRouter API key from https://openrouter.ai/keys
const OPENROUTER_API_KEY = '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';

// 🌐 POST endpoint to handle prompt generation
app.post('/api/generate', async (req, res) => {
  const userPrompt = req.body.text;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter:deepseek/deepseek-chat:free',  // ✅ You can swap in other :free models
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    const botReply = data?.choices?.[0]?.message?.content || '⚠️ No response received.';
    res.json({ response: botReply });

  } catch (error) {
    console.error('OpenRouter error:', error);
    res.status(500).json({ error: 'Failed to fetch from OpenRouter' });
  }
});

// 🔊 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
