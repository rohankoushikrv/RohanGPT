async function sendMessage() {
            const userInput = document.getElementById("userInput").value;
            const chatBox = document.getElementById("chatBox");

            if (!userInput.trim()) return;

            chatBox.innerHTML += `<div class="message user-message">You: ${userInput}</div>`;
            document.getElementById("userInput").value = "";

            // Show typing animation
            const typingAnimation = `<div class="message bot-message bot-typing" id="typingIndicator">Bot is typing...</div>`;
            chatBox.innerHTML += typingAnimation;
            chatBox.scrollTop = chatBox.scrollHeight;

            const apiKey = "AIzaSyB_lP7hIYkIF899gcx8yJleInuWpjqfXM8"; // Replace with your Gemini API key
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const requestBody = {
                contents: [{ parts: [{ text: userInput }] }]
            };

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                console.log(data);

                let aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't understand.";
                aiResponse = aiResponse.replace(/\*\*/g, '').replace(/\*/g, '');

                document.getElementById("typingIndicator").remove(); // Remove typing animation
                chatBox.innerHTML += `<div class="message bot-message">AI: ${aiResponse}</div>`;
                chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message

            } catch (error) {
                console.error("Error:", error);
                document.getElementById("typingIndicator").remove(); // Remove typing animation
                chatBox.innerHTML += `<div class="message bot-message">AI: Failed to fetch response.</div>`;
            }
        }
