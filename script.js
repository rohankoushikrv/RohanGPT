import config from "./config.js"; // Ensure correct path

async function generateBotResponse(userInput) {
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = `<div class="message bot-message bot-typing" id="typingIndicator"> RohanGPT is typing...</div>`;
    chatBox.innerHTML += typingIndicator;
    chatBox.scrollTop = chatBox.scrollHeight;

    const url = `https://your-proxy-server.com/api/gemini`;

    const requestBody = {
        contents: [{ parts: [{ text: userInput }] }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apiKey}` // Use API key here
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        let aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't understand.";

        aiResponse = aiResponse
            .replace(/\*\*/g, '')  
            .replace(/\*/g, '')    
            .split("\n")           
            .map(paragraph => `<p>${paragraph}</p>`)
            .join("");

        document.getElementById("typingIndicator").remove();
        chatBox.innerHTML += `
            <div class="message bot-message">
                <strong>RohanGPT</strong>: ${aiResponse}
                <button class="copy-btn" onclick="copyMessage(this)">📋 Copy</button>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("typingIndicator").remove();
        chatBox.innerHTML += `<div class="message bot-message">AI: Failed to fetch response.</div>`;
    }
}
