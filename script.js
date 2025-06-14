async function generateBotResponse(userInput) {
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = `<div class="message bot-message bot-typing" id="typingIndicator"> RohanGPT is typing...</div>`;
    chatBox.innerHTML += typingIndicator;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Normalize input for better matching
    const normalizedInput = userInput.toLowerCase().trim();

    // Predefined responses with flexibility
    const predefinedResponses = [
        { keywords: ["who is rohan koushik gajulapalle"], response: "Rohan Koushik Gajulapalle is a Senior Software Engineer, He works on Gen AI projects, I'm also a part of those projects, He only created me." },
        { keywords: ["where do you live", "where are you located"], response: "I live in Rohan's cloud." },
        { keywords: ["who created you", "who made you"], response: "Rohan Koushik Gajulapalle only created me." }
    ];

    // Check if the input contains a predefined question
    for (const item of predefinedResponses) {
        if (item.keywords.some(keyword => normalizedInput.includes(keyword))) {
            document.getElementById("typingIndicator").remove();
            chatBox.innerHTML += `
                <div class="message bot-message">
                    <strong>RohanGPT</strong>: ${item.response}
                </div>
            `;
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }
    }

    // If input isn't predefined, call the API
    const url = `https://your-proxy-server.com/api/gemini`;

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
