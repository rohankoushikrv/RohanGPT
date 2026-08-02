# 🚀 RohanGPT — Advanced Conversational Streaming AI Assistant

A state-of-the-art, 100% serverless client-side AI conversational assistant powered by Groq's OpenAI-compatible responses API. **RohanGPT** features a high-end, responsive, Copilot-style dark interface with smooth animations, custom configuration drawers, and advanced pre-configured prompt automations.

---

### 🌐 **Deployment Information**
* **Live Deployment Link**: [https://rohankoushikrv.github.io/RohanGPT/](https://rohankoushikrv.github.io/RohanGPT/)
* **GitHub Repository**: [https://github.com/rohankoushikrv/RohanGPT](https://github.com/rohankoushikrv/RohanGPT)

---

## ✨ **Key Features**

### 1. ⚡ **Groq OpenAI-Compatible Responses API**
Uses Groq's OpenAI-compatible `/responses` endpoint with `openai/gpt-oss-20b` for fast, low-latency assistant responses.

### 2. 📁 **Multi-Session Chat History**
Fully loaded chat thread lifecycle management:
- Create new chats via the **"+ New chat"** header button.
- Dynamic session listings saved securely in the collapsible sidebar.
- Automatic thread naming based on the first prompt sent.
- Delete individual threads or completely purge all historical session memory in one click.

### 🤖 **Custom Prompt Automations**
Pre-configured, high-efficiency task panels to immediately start complex work:
- 💻 **Explain Code**: Interactive syntax, design patterns, and algorithm explanations with optimization ideas.
- ✉️ **Draft Email**: Write professional, action-oriented, and perfectly toned outreach messages.
- 📝 **Summarize**: Instantly compress raw text into bullet briefs and core CTAs.
- 💡 **Brainstorm Ideas**: Spark creative thinking with 10 structured, out-of-the-box suggestions.

### 🎨 **Ultra-Modern Dark Canvas Design**
- Fully collapsible left-drawer and backdrop overlays for fluid responsive mobile layouts.
- Centered, roomy chat log with custom user (`🧑`) and assistant (`🚀`) premium avatars.
- Floating, pill-shaped input area with vertical auto-resizing text fields.
- ⚙️ **Config Drawer**: Instant access to choose Gemini model variants, adjust temperature, and override custom system prompts dynamically.

---

## 🛠️ **Local Quick Start**

```bash
# Clone the repository
git clone https://github.com/rohankoushikrv/RohanGPT.git
cd RohanGPT

# Run with python lightweight local server
python -m http.server 3000

# Or run with Node npm scripts
npm install
npm start
```
Open **`http://localhost:3000`** in your browser to start streaming!

---

## 🔑 Direct Groq API Key Setup
RohanGPT can send requests directly to the Groq OpenAI-compatible Responses API from the browser.

### Manual API key setup
1. Open `RohanGPT/index.html`.
2. Replace `YOUR_GROQ_API_KEY` in `window.ROHAN_GPT_API_KEY` with your key.
3. Save and reload the app.

### Important
- This method exposes the key in client-side code.
- Do not use this approach for public production deployments unless you understand the risk.

---

## 🔒 **Privacy & Data Security**
- **Direct Browser Requests**: Your API key is stored in the browser code and must be kept private.
- **Client Requests Only**: The browser sends prompts directly to the Groq API.
- **LocalStorage Protection**: Your chat history, model selection, temperature, and prompt overrides remain stored only in your browser.

---

## 📝 **License**
This project is licensed under the standard **MIT License** — feel free to customize and expand!
