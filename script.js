function sendMessage() {
    let userInput = document.getElementById("userInput").value;
    
    fetch("https://rohangpt.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("response").innerText = data.response;
    })
    .catch(error => console.error("Error:", error));
}
