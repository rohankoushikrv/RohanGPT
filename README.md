# 🚀 RohanGPT — Advanced Conversational Streaming AI Assistant

A state-of-the-art, 100% serverless client-side AI conversational assistant powered by Google Generative AI (Gemini) API. **RohanGPT** features a high-end, responsive, Copilot/Gemini-style dark interface with smooth animations, custom configuration drawers, and advanced pre-configured prompt automations.

---

### 🌐 **Deployment Information**
* **Live Deployment Link**: [https://rohankoushikrv.github.io/RohanGPT/](https://rohankoushikrv.github.io/RohanGPT/)
* **GitHub Repository**: [https://github.com/rohankoushikrv/RohanGPT](https://github.com/rohankoushikrv/RohanGPT)

---

## ✨ **Key Features**

### 1. ⚡ **True Real-Time Streaming (SSE)**
Switches from legacy polling or awaiting full payloads to the live Server-Sent Events (SSE) **`streamGenerateContent`** endpoint. Combined with browser-level stream readers (`response.body.getReader()`), responses are output chunk-by-chunk in real-time with **zero perceived thinking latency**.

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
- ⚙️ **Config Drawer**: Instant access to configure Google API keys, toggle between Gemini models (Flash and Pro), dial in Temperature creativity parameters, and override custom System Instructions dynamically!

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

## 🔒 **Privacy & Data Security**
- **100% Client-Side**: RohanGPT connects directly to Google Generative AI servers. Your prompts never route through intermediary backend databases.
- **LocalStorage Protection**: Your custom system prompts, keys, and chat logs are stored strictly inside your own browser.

---

## 📝 **License**
This project is licensed under the standard **MIT License** — feel free to customize and expand!
