async function sendMessage() {
    const userInput = document.getElementById("userInput").value.trim();
    const chatBox = document.getElementById("chatBox");

    if (!userInput) return;

    chatBox.innerHTML += `
        <div class="message user-message">
            You: ${userInput}
        </div>
    `;

    document.getElementById("userInput").value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    generateBotResponse(userInput);
}

async function generateBotResponse(userInput) {
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = `<div class="message bot-message bot-typing" id="typingIndicator">RohanGPT is typing...</div>`;
    chatBox.innerHTML += typingIndicator;
    chatBox.scrollTop = chatBox.scrollHeight;

    const apiKey = "AIzaSyB_lP7hIYkIF899gcx8yJleInuWpjqfXM8"; // Replace with a valid API key
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
                RohanGPT ${aiResponse}
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

function copyMessage(button) {
    const textToCopy = button.parentElement.innerText.replace("📋 Copy", "").trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
        button.innerText = "✅ Copied!";
        setTimeout(() => button.innerText = "📋 Copy", 2000);
    }).catch(err => console.error("Copy failed:", err));
}

document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});
