from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# This would be replaced with your actual GPT model integration
def process_with_gpt(message):
    # Simulate processing time
    time.sleep(1)
    
    # Mock response - replace with actual GPT integration
    responses = {
        "hello": "Hello! How can I assist you today?",
        "help": "I can help you with various tasks. Just let me know what you need!",
        "features": "I can collect data from social media, automate responses, and provide AI-powered assistance."
    }
    
    # Check for keywords in the message
    for keyword, response in responses.items():
        if keyword.lower() in message.lower():
            return response
    
    # Default response
    return f"I received your message: '{message}'. How can I help you with that?"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    message = data['message']
    
    # Process the message with your GPT model
    response = process_with_gpt(message)
    
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

