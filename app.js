/* ========================================================
   RohanGPT — Modern Conversational Streaming AI Assistant
   Client-Side Serverless Real-Time Application controller
   ======================================================== */

const app = {
    // Generative AI Configuration
    googleApiKey: null,
    geminiModel: 'gemini-3.5-flash',
    temperature: 0.7,
    systemInstruction: '',
    funMode: false,

    // Chat Thread Memory State
    activeThreadId: null,
    savedThreads: {}, // Format: { threadId: { id, title, messages: [] } }

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
        // Load API Key
        this.googleApiKey = localStorage.getItem('rohangpt_google_api_key') || '';
        
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
        const keyInput = document.getElementById('settings-api-key').value.trim();
        const modelSelect = document.getElementById('settings-model-choice').value;
        const tempVal = document.getElementById('settings-temperature').value;
        const systemText = document.getElementById('settings-system-instruction').value.trim();

        // 1. Save values to LocalStorage
        localStorage.setItem('rohangpt_google_api_key', keyInput);
        localStorage.setItem('rohangpt_model_choice', modelSelect);
        localStorage.setItem('rohangpt_temperature', tempVal);
        localStorage.setItem('rohangpt_system_instruction', systemText);

        // 2. Update memory state
        this.googleApiKey = keyInput;
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

        if (threadKeys.length === 0) {
            container.innerHTML = '<p class="empty-history-text">No recent chats</p>';
            return;
        }

        // Render threads from newest to oldest
        threadKeys.reverse().forEach(key => {
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

        // Verify API Key existence
        if (!this.googleApiKey) {
            alert('🔑 REQUIRED: Please set your Google Generative AI API key in Settings first!');
            this.openSettingsModal();
            return;
        }

        // Collapse welcome state
        document.getElementById('welcome-container').style.display = 'none';

        // Clear input area
        input.value = '';
        input.style.height = 'auto';

        // Disable elements during active request
        input.disabled = true;
        document.getElementById('send-btn').disabled = true;

        // Stage user message to chat UI & memory state
        this.addMessageToChat(message, 'user');
        
        const activeThread = this.savedThreads[this.activeThreadId];
        activeThread.messages.push({ role: 'user', content: message });

        // Update thread title if it was the first message
        if (activeThread.messages.length === 1) {
            activeThread.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            this.renderHistoryList();
        }

        // Create empty bot container bubble for live streaming
        const chatHistory = document.getElementById('chat-history');
        const contentDiv = this.addMessageToChat('', 'bot', true, true);
        this.showLoading(true);

        let fullText = '';

        try {
            await this.streamAIResponse(message, (chunkText) => {
                this.showLoading(false); // Hide spinner on first packet
                fullText += chunkText;

                // Live markup parsing inside bubble
                contentDiv.innerHTML = this.parseMessageContent(fullText) + '<span class="typing-cursor"></span>';
                chatHistory.scrollTop = chatHistory.scrollHeight;
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
            contentDiv.innerHTML = `<p style="color: var(--danger); font-weight: 600;">❌ Error: ${error.message}</p><p style="margin-top: 10px; font-size:12px;">Make sure your API key in Settings is active and correct.</p>`;
        } finally {
            input.disabled = false;
            document.getElementById('send-btn').disabled = false;
            input.focus();
        }
    },

    async streamAIResponse(userMessage, onChunk) {
        // Collect conversation history
        const activeThread = this.savedThreads[this.activeThreadId];
        const chatHistoryContext = activeThread.messages.slice(0, -1).map(msg => 
            msg.role === 'user' ? `User: ${msg.content}` : `Model: ${msg.content}`
        ).join('\n\n');

        let systemPromptBlock = '';
        
        // Grok-style Fun Mode vs Regular Mode dynamic prompts
        if (this.funMode) {
            systemPromptBlock = `System Guidelines:
You are RohanGPT in FUN MODE. You are extremely witty, highly sarcastic, humorous, bold, and clever. Answer the user's query with sharp intelligence, playful banter, and a pinch of healthy sarcasm. Don't be boring, robotic, or dry! Keep the user entertained while still supplying technically brilliant and accurate results. Use emojis where appropriate to reflect your playful personality!\n\n`;
        } else {
            systemPromptBlock = this.systemInstruction 
                ? `System Guidelines:\n${this.systemInstruction}\n\n` 
                : 'System Guidelines:\nYou are RohanGPT, an extremely capable, intelligent, and premium conversational AI assistant. You answer queries clearly, elegantly, and step-by-step.\n\n';
        }

        const finalPrompt = `${systemPromptBlock}Previous Conversation Logs:\n${chatHistoryContext}\n\nUser: ${userMessage}`;

        // Trigger real-time SSE streamGenerateContent Gemini endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:streamGenerateContent?alt=sse&key=${this.googleApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: finalPrompt
                    }]
                }],
                generationConfig: {
                    temperature: this.temperature,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            const errMsg = error.error?.message || response.statusText || 'API Request Failed';
            throw new Error(errMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Hold incomplete last packet inside buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data:')) {
                    const dataStr = trimmed.substring(5).trim();
                    if (!dataStr) continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (chunkText) {
                            onChunk(chunkText);
                        }
                    } catch (e) {
                        console.error('SSE packet parsing failure:', e);
                    }
                }
            }
        }
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

    simulateAttachment() {
        alert('📎 File attachment simulation triggered!\n\nRohanGPT will integrate localized PDF/TXT OCR processing in our next feature roadmap!');
    },

    /* ========== UI CONTROLLER HELPER FUNCTIONS ========== */

    addMessageToChat(text, sender, scroll = true, isStreaming = false) {
        const chatHistory = document.getElementById('chat-history');
        if (!chatHistory) return;

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
                chatHistory.scrollTop = chatHistory.scrollHeight;
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

    showLoading(show) {
        // Toggle opacity or visibility elements if needed
        const badge = document.querySelector('.model-badge-container');
        if (badge) {
            if (show) {
                badge.style.borderColor = 'var(--primary-color)';
                badge.querySelector('.model-status-dot').style.backgroundColor = 'var(--primary-light)';
                badge.querySelector('.model-status-dot').style.boxShadow = '0 0 10px var(--primary-light)';
            } else {
                badge.style.borderColor = 'var(--border-glass)';
                badge.querySelector('.model-status-dot').style.backgroundColor = 'var(--success)';
                badge.querySelector('.model-status-dot').style.boxShadow = '0 0 8px var(--success)';
            }
        }
    },

    /* ========== RESPONSIVE DRAWER & MODALS ========== */

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    },

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            // Restore form values
            document.getElementById('settings-api-key').value = this.googleApiKey;
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
