from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Function to fetch Wikipedia summaries
def get_wikipedia_summary(query):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get("extract", "No information found.")
    return "Error fetching data."

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "").lower()

    if "trip" in user_input or "itinerary" in user_input:
        return jsonify({"response": "I can help plan your trip! Where do you want to go?"})
    elif "sports" in user_input:
        return jsonify({"response": "Which sport are you interested in? I can fetch the latest updates!"})
    elif "medical" in user_input:
        return jsonify({"response": "I can provide general medical treatment information. What do you need help with?"})
    else:
        return jsonify({"response": get_wikipedia_summary(user_input)})

if __name__ == "__main__":
    app.run(debug=True)
