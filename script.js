const chatContainer = document.getElementById('chat-container');
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const suggestBtn = document.getElementById('suggest-btn');
        const summarizeBtn = document.getElementById('summarize-btn');
        const clearBtn = document.getElementById('clear-btn');
        
        let chatHistory = [];

        const markdownConverter = new showdown.Converter({ simplifiedAutoLink: true, strikethrough: true, tables: true });
        
        const geminiLogoSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.5C12 1.5 12.3812 4.3125 14.25 6.1875C16.1188 8.0625 18.9375 8.4375 18.9375 8.4375C18.9375 8.4375 16.125 8.8125 14.25 10.6875C12.375 12.5625 12 15.375 12 15.375C12 15.375 11.6188 12.5625 9.75 10.6875C7.875 8.8125 5.0625 8.4375 5.0625 8.4375C5.0625 8.4375 7.88125 8.0625 9.75 6.1875C11.625 4.3125 12 1.5 12 1.5Z" fill="url(#gemini-gradient)"/><path d="M12 22.5C12 22.5 11.6188 19.6875 9.75 17.8125C7.875 15.9375 5.0625 15.5625 5.0625 15.5625C5.0625 15.5625 7.875 15.1875 9.75 13.3125C11.625 11.4375 12 8.625 12 8.625C12 8.625 12.3812 11.4375 14.25 13.3125C16.125 15.1875 18.9375 15.5625 18.9375 15.5625C18.9375 15.5625 16.1188 15.9375 14.25 17.8125C12.3812 19.6875 12 22.5 12 22.5Z" fill="url(#gemini-gradient)"/></svg>`;

        const addMessageToUI = (role, message) => {
             const messageElement = document.createElement('div');
             messageElement.className = 'message-bubble-animation flex items-start gap-3';
             
             if (role === 'user') {
                 messageElement.classList.add('justify-end');
                 messageElement.innerHTML = `
                    <div class="bg-blue-600 rounded-lg p-4 max-w-full"><p>${message}</p></div>
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm">You</div>`;
             } 
             chatContainer.appendChild(messageElement);
             chatContainer.scrollTop = chatContainer.scrollHeight;
        };

        const streamBotMessage = (fullMessage, sources = [], isSummary = false) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message-bubble-animation flex items-start gap-3';
            
            const summaryHeader = isSummary ? `<h3 class="font-bold mb-2 text-indigo-300">Conversation Summary ✨</h3>` : '';
            messageElement.innerHTML = `
                <div class="gemini-avatar flex-shrink-0 w-8 h-8 flex items-center justify-center">${geminiLogoSvg}</div>
                <div class="bg-gray-800 rounded-lg p-4 max-w-full w-full">
                    ${summaryHeader}
                    <div class="markdown-content">
                        <p class="typing-cursor border-r-2 border-transparent"></p>
                    </div>
                </div>`;
            chatContainer.appendChild(messageElement);
            
            const contentP = messageElement.querySelector('.markdown-content p');
            const words = fullMessage.split(' ');
            let wordIndex = 0;

            const intervalId = setInterval(() => {
                if (wordIndex < words.length) {
                    contentP.textContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                    wordIndex++;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                } else {
                    clearInterval(intervalId);
                    // Final render with full markdown
                    const fullHtml = markdownConverter.makeHtml(fullMessage);
                    messageElement.querySelector('.markdown-content').innerHTML = fullHtml;
                    contentP.classList.remove('typing-cursor');

                    // Add sources after streaming is complete
                    if (sources.length > 0) {
                        const sourcesContainer = document.createElement('div');
                        sourcesContainer.className = 'mt-4 border-t border-gray-700 pt-3 text-sm';
                        let sourcesHtml = '<h4 class="font-semibold mb-2 text-gray-400">Sources:</h4><ol class="list-decimal list-inside space-y-1">';
                        sources.forEach(source => {
                            sourcesHtml += `<li><a href="${source.uri}" target="_blank" class="text-indigo-400 hover:underline break-all">${source.title || source.uri}</a></li>`;
                        });
                        sourcesHtml += '</ol>';
                        sourcesContainer.innerHTML = sourcesHtml;
                        messageElement.querySelector('.bg-gray-800').appendChild(sourcesContainer);
                    }
                }
            }, 50); // Adjust timing for faster/slower typing
        };
        
        const showTypingIndicator = () => {
            const typingElement = document.createElement('div');
            typingElement.id = 'typing-indicator';
            typingElement.className = 'message-bubble-animation flex items-start gap-3';
            typingElement.innerHTML = `
                <div class="gemini-avatar flex-shrink-0 w-8 h-8 flex items-center justify-center">${geminiLogoSvg}</div>
                <div class="bg-gray-800 rounded-lg p-4 flex items-center justify-center dot-bounce">
                    <div class="dot w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
                    <div class="dot w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
                    <div class="dot w-2 h-2 bg-gray-400 rounded-full mx-1"></div>
                </div>`;
            chatContainer.appendChild(typingElement);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return typingElement;
        };
        
        const generateGeminiContent = async (prompt, isGrounded = false, currentHistory = []) => {
            const apiKey = "AIzaSyDdzYVm6MsAFMCjLcoA6fR9BwJMBW6DGW0"; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [...currentHistory, { role: "user", parts: [{ "text": prompt }] }],
            };

            if (isGrounded) {
                 payload.tools = [{ "google_search": {} }];
            }

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error((await response.json()).error?.message || `API Error`);
                const result = await response.json();
                return result.candidates?.[0];
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                streamBotMessage(`An error occurred: ${error.message}`);
                return null;
            }
        };
        
        const handleChatSubmit = async (message) => {
            addMessageToUI('user', message);
            chatHistory.push({ role: "user", parts: [{ text: message }] });

            const typingIndicator = showTypingIndicator();
            const candidate = await generateGeminiContent(message, true, chatHistory.slice(0, -1));
            typingIndicator.remove();
            
            if (candidate) {
                let botResponse = candidate.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata?.groundingAttributions) {
                     sources = groundingMetadata.groundingAttributions
                        .map(attr => ({ uri: attr.web?.uri, title: attr.web?.title }))
                        .filter(source => source.uri && source.title);
                }
                streamBotMessage(botResponse, sources);
                chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
            }
        };

        const handleSuggestReply = async () => {
            const lastBotMessage = chatHistory.filter(m => m.role === 'model').pop();
            if (!lastBotMessage) {
                messageInput.value = "What is the weather like in Hyderabad?";
                return;
            }
            suggestBtn.disabled = true;
            const prompt = `Based on this statement: "${lastBotMessage.parts[0].text}", suggest a creative and insightful follow-up question a user could ask. Provide only the question text itself.`;
            const candidate = await generateGeminiContent(prompt, false);
            if(candidate) {
                messageInput.value = candidate.content.parts[0].text.replace(/["']/g, "");
                messageInput.focus();
                messageInput.dispatchEvent(new Event('input'));
            }
            suggestBtn.disabled = false;
        };
        
        const handleSummarize = async () => {
             if (chatHistory.length < 2) {
                streamBotMessage("There's not enough conversation to summarize yet!");
                return;
            }
            summarizeBtn.disabled = true;
            const typingIndicator = showTypingIndicator();
            const historyText = chatHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n');
            const prompt = `Please provide a concise, one-paragraph summary of the following conversation:\n\n${historyText}`;
            const candidate = await generateGeminiContent(prompt, false);
            typingIndicator.remove();
            if(candidate) {
                streamBotMessage(candidate.content.parts[0].text, [], true);
            }
            summarizeBtn.disabled = false;
        };

        const handleClearChat = () => {
            chatHistory = [];
            chatContainer.innerHTML = '';
            initChat();
        };

        const initChat = () => {
            streamBotMessage("Hello! How can I help you today?");
            sendButton.disabled = true;
        }

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (!message) return;
            
            sendButton.disabled = true;
            messageInput.value = '';
            messageInput.style.height = 'auto';

            await handleChatSubmit(message);

            sendButton.disabled = false;
            messageInput.focus();
        });
        
        suggestBtn.addEventListener('click', handleSuggestReply);
        summarizeBtn.addEventListener('click', handleSummarize);
        clearBtn.addEventListener('click', handleClearChat);

        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = `${messageInput.scrollHeight}px`;
            sendButton.disabled = messageInput.value.trim().length === 0;
        });

        // Initialize the chat on load
        initChat();
        document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("message-input");
    const form = document.getElementById("chat-form");

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent newline
        form.requestSubmit();   // Submit the form
      }
    });
  });

