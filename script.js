async function generateBotResponse(userInput) {
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = `<div class="message bot-message bot-typing" id="typingIndicator"> RohanGPT is typing...</div>`;
    chatBox.innerHTML += typingIndicator;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Convert user input to lowercase for better matching
    const normalizedInput = userInput.toLowerCase().trim();

    // Predefined responses
    const predefinedResponses = {
        "who is Rohan Koushik Gajulapalle": "Rohan Koushik Gajulapalle only created me.",
        "where do you live": "I live in Rohan's cloud.",
        "who created you": "Rohan Koushik Gajulapalle only created me."
    };

    // Check if the input matches a predefined question
    if (predefinedResponses[normalizedInput]) {
        document.getElementById("typingIndicator").remove();
        chatBox.innerHTML += `
            <div class="message bot-message">
                <strong>RohanGPT</strong>: ${predefinedResponses[normalizedInput]}
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    // If input isn't predefined, call the API
    const url = `https://your-proxy-server.com/api/gemini`; // Use a proxy to secure API calls

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
