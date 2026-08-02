/* ========================================================
   RohanGPT — Modern Conversational Streaming AI Assistant
   Client-Side Serverless Real-Time Application controller
   ======================================================== */

const app = {
    // Groq OpenAI-Compatible API Configuration
        // NOTE: Do NOT hardcode secrets in source for public hosting.
        // If you want to hardcode a key for local testing, set it here.
        apiKey: window.ROHAN_GPT_API_KEY || '',
    geminiModel: 'openai/gpt-oss-20b',
    temperature: 0.7,
    systemInstruction: '',
    funMode: false,

    // Chat Thread Memory State
    activeThreadId: null,
    savedThreads: {}, // Format: { threadId: { id, title, messages: [] } }
    searchQuery: '',

    /* ========== INITIALIZATION ========== */

    init() {
        console.log('🚀 RohanGPT initializing...');
        
        // 1. Load configuration settings
        this.loadSettings();
        
        // 2. Load and display chat threads list
        this.loadThreads();
        
        // 3. Attach keyboard/button event listeners
        this.setupEventListeners();
        
        // 4. Create first thread if empty, otherwise restore active
        if (Object.keys(this.savedThreads).length === 0) {
            this.createNewChat();
        } else {
            const lastActive = localStorage.getItem('rohangpt_active_thread_id');
            if (lastActive && this.savedThreads[lastActive]) {
                this.switchThread(lastActive);
            } else {
                const firstThreadId = Object.keys(this.savedThreads)[0];
                this.switchThread(firstThreadId);
            }
        }
    },

    loadSettings() {
        // Load settings panel configurations
        this.geminiModel = localStorage.getItem('rohangpt_model_choice') || 'gemini-3.5-flash';
        this.temperature = parseFloat(localStorage.getItem('rohangpt_temperature')) || 0.7;
        this.systemInstruction = localStorage.getItem('rohangpt_system_instruction') || '';
        this.funMode = localStorage.getItem('rohangpt_fun_mode') === 'true';
        
        // Sync active elements and badge
        this.updateModelBadge();
        this.updateFunModeUI();
    },

    saveSettings() {
        const modelSelect = document.getElementById('settings-model-choice').value;
        const tempVal = document.getElementById('settings-temperature').value;
        const systemText = document.getElementById('settings-system-instruction').value.trim();

        // Save values to LocalStorage
        localStorage.setItem('rohangpt_model_choice', modelSelect);
        localStorage.setItem('rohangpt_temperature', tempVal);
        localStorage.setItem('rohangpt_system_instruction', systemText);

        // Update memory state
        this.geminiModel = modelSelect;
        this.temperature = parseFloat(tempVal) || 0.7;
        this.systemInstruction = systemText;

        // 3. Update active elements
        this.updateModelBadge();
        this.closeSettingsModal();
        
        alert('✅ RohanGPT settings saved successfully!');
    },

    updateModelBadge() {
        const select = document.getElementById('header-model-select');
        if (select) {
            select.value = this.geminiModel;
        }
    },

    handleModelChange(value) {
        this.geminiModel = value;
        localStorage.setItem('rohangpt_model_choice', value);
        this.updateModelBadge();
        console.log('🔄 Model dynamically updated to:', value);
    },

    toggleFunMode() {
        this.funMode = !this.funMode;
        localStorage.setItem('rohangpt_fun_mode', this.funMode);
        this.updateFunModeUI();
    },

    updateFunModeUI() {
        const pill = document.getElementById('mode-toggle-pill');
        const regLabel = document.getElementById('regular-mode-label');
        const funLabel = document.getElementById('fun-mode-label');
        const statusBadge = document.getElementById('grok-status-badge');

        if (this.funMode) {
            regLabel?.classList.remove('active');
            funLabel?.classList.add('active');
            if (statusBadge) statusBadge.textContent = '😜 Fun Mode Active';
            if (pill) pill.style.borderColor = 'var(--border-focus)';
        } else {
            regLabel?.classList.add('active');
            funLabel?.classList.remove('active');
            if (statusBadge) statusBadge.textContent = 'Regular Mode';
            if (pill) pill.style.borderColor = 'var(--border-thin)';
        }
    },

    setupEventListeners() {
        const messageInput = document.getElementById('message-input');
        const tempSlider = document.getElementById('settings-temperature');
        const tempDisplay = document.getElementById('temp-val-display');
        const chatSearchInput = document.getElementById('chat-search-input');

        if (messageInput) {
            // Send message on Enter, Shift+Enter for newline
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize input textarea heights
            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            });
        }

        if (chatSearchInput) {
            chatSearchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.renderHistoryList();
            });
        }

        // Live slider value display
        if (tempSlider && tempDisplay) {
            tempSlider.addEventListener('input', () => {
                tempDisplay.textContent = tempSlider.value;
            });
        }
    },

    /* ========== SESSION & THREAD CONTROLS ========== */

    loadThreads() {
        const saved = localStorage.getItem('rohangpt_saved_threads');
        if (saved) {
            try {
                this.savedThreads = JSON.parse(saved);
            } catch (e) {
                console.error('Could not load threads:', e);
                this.savedThreads = {};
            }
        }
        this.renderHistoryList();
    },

    saveThreads() {
        localStorage.setItem('rohangpt_saved_threads', JSON.stringify(this.savedThreads));
        localStorage.setItem('rohangpt_active_thread_id', this.activeThreadId);
    },

    createNewChat() {
        const threadId = 'thread_' + Math.random().toString(36).substr(2, 9);
        this.savedThreads[threadId] = {
            id: threadId,
            title: 'New chat session',
            messages: []
        };
        this.activeThreadId = threadId;
        this.saveThreads();
        
        this.switchThread(threadId);
        this.renderHistoryList();
    },

    switchThread(threadId) {
        if (!this.savedThreads[threadId]) return;

        this.activeThreadId = threadId;
        localStorage.setItem('rohangpt_active_thread_id', threadId);

        const thread = this.savedThreads[threadId];
        const chatHistory = document.getElementById('chat-history');
        const welcomeContainer = document.getElementById('welcome-container');

        // Clear chat area
        chatHistory.innerHTML = '';

        if (thread.messages.length === 0) {
            welcomeContainer.style.display = 'flex';
        } else {
            welcomeContainer.style.display = 'none';
            // Restore thread message bubbles
            thread.messages.forEach(msg => {
                this.addMessageToChat(msg.content, msg.role === 'user' ? 'user' : 'bot', false);
            });
        }

        this.renderHistoryList();
        
        // Hide sidebar drawer on mobile after switching
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            this.toggleSidebar();
        }
    },

    deleteThread(threadId, event) {
        if (event) event.stopPropagation(); // Stop click bubbling

        if (Object.keys(this.savedThreads).length <= 1) {
            alert('❌ Cannot delete the last remaining chat session!');
            return;
        }

        if (confirm('Are you sure you want to delete this chat session?')) {
            delete this.savedThreads[threadId];
            this.saveThreads();

            if (this.activeThreadId === threadId) {
                const nextId = Object.keys(this.savedThreads)[0];
                this.switchThread(nextId);
            } else {
                this.renderHistoryList();
            }
        }
    },

    clearAllChats() {
        if (confirm('⚠️ Warning: This will permanently delete ALL saved chat sessions. Continue?')) {
            this.savedThreads = {};
            this.activeThreadId = null;
            localStorage.removeItem('rohangpt_saved_threads');
            localStorage.removeItem('rohangpt_active_thread_id');
            
            this.createNewChat();
        }
    },

    renderHistoryList() {
        const container = document.getElementById('history-list');
        if (!container) return;

        container.innerHTML = '';
        const threadKeys = Object.keys(this.savedThreads);
        const normalizedQuery = this.searchQuery.trim().toLowerCase();

        const filteredKeys = normalizedQuery
            ? threadKeys.filter((key) => {
                const thread = this.savedThreads[key];
                return thread.title.toLowerCase().includes(normalizedQuery) ||
                    thread.messages.some((msg) => msg.content.toLowerCase().includes(normalizedQuery));
            })
            : threadKeys;

        if (filteredKeys.length === 0) {
            container.innerHTML = '<p class="empty-history-text">No matching chats</p>';
            return;
        }

        // Render threads from newest to oldest
        filteredKeys.reverse().forEach(key => {
            const thread = this.savedThreads[key];
            
            const item = document.createElement('div');
            item.className = `history-item ${key === this.activeThreadId ? 'active' : ''}`;
            item.onclick = () => this.switchThread(key);

            const titleSpan = document.createElement('span');
            titleSpan.className = 'thread-title';
            titleSpan.textContent = thread.title.length > 25 ? thread.title.substring(0, 22) + '...' : thread.title;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-thread-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Chat Session';
            deleteBtn.onclick = (e) => this.deleteThread(key, e);

            item.appendChild(titleSpan);
            item.appendChild(deleteBtn);
            container.appendChild(item);
        });
    },

    /* ========== CHAT CONTROLS & STREAMING API ========== */

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        // API key validation intentionally disabled to allow local hardcoded keys.
        // If you want to re-enable this guard, uncomment and update the prompt below.
        /*
        if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY') {
            alert('🔧 Please configure your Groq API key before sending a message.');
            return;
        }
        */

        // Collapse welcome state
        document.getElementById('welcome-container').style.display = 'none';

        // Clear input area
        input.value = '';
        input.style.height = 'auto';

        // Disable elements during active request
        input.disabled = true;
        document.getElementById('send-btn').disabled = true;

        // Show user message in chat UI
        this.addMessageToChat(message, 'user');
        
        const activeThread = this.savedThreads[this.activeThreadId];
        activeThread.messages.push({ role: 'user', content: message });

        // Update thread title if it was the first message
        if (activeThread.messages.length === 1) {
            activeThread.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            this.renderHistoryList();
        }

        const messageToSend = message;

        // Create empty bot container bubble for live streaming
        const chatHistory = document.getElementById('chat-history');
        const contentDiv = this.addMessageToChat('', 'bot', true, true);
        this.showLoading(true);

        let fullText = '';

        try {
            await this.streamAIResponse(messageToSend, (chunkText) => {
                this.showLoading(false); // Hide spinner on first packet
                fullText += chunkText;

                // Live markup parsing inside bubble
                contentDiv.innerHTML = this.parseMessageContent(fullText) + '<span class="typing-cursor"></span>';
                this.scrollChatToBottom();
            });

            // Strip active typing cursor on complete
            contentDiv.innerHTML = this.parseMessageContent(fullText);
            contentDiv.classList.remove('streaming');

            // Save bot reply to thread memory
            activeThread.messages.push({ role: 'assistant', content: fullText });
            this.saveThreads();

        } catch (error) {
            this.showLoading(false);
            console.error('Streaming error:', error);
            contentDiv.innerHTML = `<p style="color: var(--danger); font-weight: 600;">❌ Error: ${error.message}</p><p style="margin-top: 10px; font-size:12px;">Make sure your Groq API key is set, your selected model is valid, and the Settings entry is correct.</p>`;
        } finally {
            input.disabled = false;
            document.getElementById('send-btn').disabled = false;
            input.focus();
        }
    },

    normalizeUserMessage(raw) {
        if (!raw) return raw;

        let cleaned = raw.trim();

        const explicitUserSays = /(?:the user says|user says)\s*:\s*["“](.*?)["”]/i;
        const explicitMatch = cleaned.match(explicitUserSays);
        if (explicitMatch && explicitMatch[1]) {
            return explicitMatch[1].trim();
        }

        const explicitNoQuotes = /(?:the user says|user says)\s*:\s*([^"“”\n]+)/i;
        const explicitNoQuotesMatch = cleaned.match(explicitNoQuotes);
        if (explicitNoQuotesMatch && explicitNoQuotesMatch[1]) {
            return explicitNoQuotesMatch[1].trim();
        }

        const quotedMatches = Array.from(cleaned.matchAll(/["“](.*?)["”]/g), m => m[1].trim()).filter(Boolean);
        if (quotedMatches.length > 0) {
            const markerIndex = cleaned.search(/(?:the user says|user says)/i);
            if (markerIndex >= 0) {
                let afterMarker = cleaned.slice(markerIndex);
                const firstQuotedAfterMarker = Array.from(afterMarker.matchAll(/["“](.*?)["”]/g), m => m[1].trim()).filter(Boolean)[0];
                if (firstQuotedAfterMarker) {
                    return firstQuotedAfterMarker;
                }
            }

            return quotedMatches[0];
        }

        cleaned = cleaned
            .replace(/^(?:No no no|no no no|Please|please)[\s\S]*?(?=(Hey|Hi|Hello|The user says|User says|Nice to meet|How are|How're))/i, '$1')
            .replace(/The user says:\s*/i, '')
            .replace(/(?:Please think and apply the changes|if you want to change any logic, please do that\.?)/gi, '')
            .replace(/(?:So we should respond accordingly\.|According to guidelines:.*)$/gi, '')
            .trim();

        return cleaned || raw.trim();
    },

    buildPrompt(userMessage, conversationHistory, systemPrompt) {
        const historyBlock = conversationHistory ? `Conversation History:\n${conversationHistory}\n\n` : '';
        return `${systemPrompt}${historyBlock}Input: ${userMessage}\n\nAssistant:`;
    },

    async streamAIResponse(userMessage, onChunk) {
        // Collect conversation history
        const activeThread = this.savedThreads[this.activeThreadId];
        const chatHistoryContext = activeThread.messages.slice(0, -1).map(msg => 
            msg.role === 'user' ? `User: ${this.normalizeUserMessage(msg.content)}` : `Model: ${msg.content}`
        ).join('\n\n');

        let systemPromptBlock = '';
        
        // Grok-style Fun Mode vs Regular Mode dynamic prompts
        if (this.funMode) {
            systemPromptBlock = `System Guidelines:
You are RohanGPT in FUN MODE. You are extremely witty, highly sarcastic, humorous, bold, and clever. Answer the user's query with sharp intelligence, playful banter, and a pinch of healthy sarcasm. Don't be boring, robotic, or dry! Keep the user entertained while still supplying technically brilliant and accurate results. Use emojis where appropriate to reflect your playful personality.\n\nResponse rules:\n- Reply only as the assistant.\n- Do not explain your reasoning, the system instructions, or the prompt construction.\n- Do not repeat or comment on meta guidance from the user.\n- If the user input is not a question, respond appropriately with a friendly and helpful message.\n- Your response should be short, direct, and professional if appropriate.\n\n`;
        } else {
            systemPromptBlock = this.systemInstruction 
                ? `System Guidelines:\n${this.systemInstruction}\n\nResponse rules:\n- Reply only as the assistant.\n- Do not explain your reasoning, the system instructions, or the prompt construction.\n- Do not repeat or comment on meta guidance from the user.\n- If the user input is not a question, respond appropriately with a friendly and helpful message.\n- Your response should be short, direct, and professional if appropriate.\n\n` 
                : 'System Guidelines:\nYou are RohanGPT, an extremely capable, intelligent, and premium conversational AI assistant. You answer queries clearly, elegantly, and step-by-step.\n\nResponse rules:\n- Reply only as the assistant.\n- Do not explain your reasoning, the system instructions, or the prompt construction.\n- Do not repeat or comment on meta guidance from the user.\n- If the user input is not a question, respond appropriately with a friendly and helpful message.\n- Your response should be short, direct, and professional if appropriate.\n\n';
        }

        const finalPrompt = this.buildPrompt(userMessage, chatHistoryContext, systemPromptBlock);

        const response = await fetch('https://api.groq.com/openai/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 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`
            },
            body: JSON.stringify({
                model: this.geminiModel,
                input: finalPrompt,
                temperature: this.temperature,
                max_output_tokens: 1024
            })
        });

        if (!response.ok) {
            const error = await response.text().catch(() => null);
            const errMsg = error || response.statusText || 'API Request Failed';
            throw new Error(errMsg);
        }

        const json = await response.json();
        let outputText = '';

        // Prefer explicit assistant message blocks when present
        if (json && Array.isArray(json.output)) {
            const messageBlock = json.output.find(item => item.type === 'message');
            if (messageBlock && Array.isArray(messageBlock.content) && messageBlock.content.length > 0) {
                const firstContent = messageBlock.content[0];
                outputText = typeof firstContent === 'string' ? firstContent : (firstContent.text || '');
            }
        }

        // Fallbacks for other payload shapes
        if (!outputText) {
            if (typeof json.output_text === 'string') {
                outputText = json.output_text;
            } else if (Array.isArray(json.output) && json.output.length > 0) {
                const firstOutput = json.output[0];
                if (Array.isArray(firstOutput.content)) {
                    outputText = firstOutput.content
                        .map((item) => typeof item === 'string' ? item : item.text || '')
                        .join('');
                } else if (typeof firstOutput.content === 'string') {
                    outputText = firstOutput.content;
                }
            } else if (json.choices?.[0]?.message?.content) {
                outputText = json.choices[0].message.content;
            } else if (json.choices?.[0]?.text) {
                outputText = json.choices[0].text;
            }
        }

        if (!outputText) {
            throw new Error('No response content returned from Groq API.');
        }

        onChunk(outputText);
    },

    /* ========== AUTOMATIONS WORKFLOWS ========== */

    useAutomation(type) {
        const input = document.getElementById('message-input');
        if (!input) return;

        let promptText = '';
        switch (type) {
            case 'code_explainer':
                promptText = 'Explain this code snippet step-by-step and suggest optimizations:\n\n```javascript\n// Paste code here\n```';
                break;
            case 'email_drafter':
                promptText = 'Draft a highly professional email reply to [Recipient] regarding [Subject]. Keep the tone polite, clear, and action-oriented:\n\nContext: [Add context details here]';
                break;
            case 'text_summarizer':
                promptText = 'Summarize the following text into key bullet points and extract the core call to actions:\n\n[Paste text here]';
                break;
            case 'brainstormer':
                promptText = 'Generate 10 highly creative, out-of-the-box ideas and solutions for:\n\n[Describe task or goal here]';
                break;
        }

        input.value = promptText;
        input.focus();
        
        // Auto resize textarea height
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    },

    /* ========== UI CONTROLLER HELPER FUNCTIONS ========== */

    addMessageToChat(text, sender, scroll = true, isStreaming = false) {
        const chatHistory = document.getElementById('chat-history');
        const chatWorkspace = document.querySelector('.chat-workspace');
        if (!chatHistory || !chatWorkspace) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '🧑' : '🚀';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (sender === 'bot' && isStreaming) {
            bubble.classList.add('streaming');
            bubble.innerHTML = '';
        } else {
            bubble.innerHTML = this.parseMessageContent(text);
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatHistory.appendChild(msgDiv);

        if (scroll) {
            setTimeout(() => {
                chatWorkspace.scrollTo({ top: chatWorkspace.scrollHeight, behavior: 'smooth' });
            }, 50);
        }

        return bubble;
    },

    parseMessageContent(text) {
        if (!text) return '';

        // Standard markdown escaping for XSS protection
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Formatting replacements
        let html = escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^[-•]\s+(.*)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px;">$1</li>');

        if (!html.startsWith('<p>') && !html.startsWith('<li')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    },

    scrollChatToBottom() {
        const chatWorkspace = document.querySelector('.chat-workspace');
        if (!chatWorkspace) return;
        chatWorkspace.scrollTo({ top: chatWorkspace.scrollHeight, behavior: 'smooth' });
    },

    showLoading(show) {
        const generateBadge = document.getElementById('generative-badge');
        const sendBtn = document.getElementById('send-btn');

        if (generateBadge) {
            generateBadge.classList.toggle('active', show);
            generateBadge.textContent = show ? '⚡ Generating...' : '';
        }

        if (sendBtn) {
            sendBtn.disabled = show;
        }
    },

    /* ========== RESPONSIVE DRAWER & MODALS ========== */

    toggleSidebar() {
        const container = document.querySelector('.app-container');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (container && sidebar) {
            if (window.innerWidth > 900) {
                container.classList.toggle('sidebar-hidden');
            } else {
                sidebar.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
            }
        }
    },

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            document.getElementById('settings-model-choice').value = this.geminiModel;
            document.getElementById('settings-temperature').value = this.temperature;
            document.getElementById('temp-val-display').textContent = this.temperature;
            document.getElementById('settings-system-instruction').value = this.systemInstruction;
            
            modal.classList.remove('hidden');
        }
    },

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

// Start application when DOM has loaded
document.addEventListener('DOMContentLoaded', () => app.init());
