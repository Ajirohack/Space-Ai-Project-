import streamlit as st
import requests
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")
BEARER_TOKEN = os.getenv("N8N_BEARER_TOKEN")

# Debug environment variables
st.write("Debug - Webhook URL:", WEBHOOK_URL)
st.write("Debug - Bearer Token:", BEARER_TOKEN[:5] + "..." if BEARER_TOKEN else None)

if not WEBHOOK_URL or not BEARER_TOKEN:
    st.error("Please set N8N_WEBHOOK_URL and N8N_BEARER_TOKEN environment variables")
    st.stop()

def generate_session_id():
    return str(uuid.uuid4())

def send_message_to_llm(session_id, message):
    headers = {
        "X-N8N-API-KEY": f"{BEARER_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "sessionId": session_id,
        "chatInput": message
    }
    
    # Debug information
    st.write("Debug - Headers:", headers)
    st.write("Debug - URL:", WEBHOOK_URL)
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload, headers=headers)
        st.write("Debug - Response Status:", response.status_code)
        st.write("Debug - Response Text:", response.text)
        
        if response.status_code == 200:
            return response.json()["output"]
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Exception occurred: {str(e)}"

def main():
    st.title("Chat with LLM")

    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "session_id" not in st.session_state:
        st.session_state.session_id = generate_session_id()

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.write(message["content"])

    # User input
    user_input = st.chat_input("Type your message here...")

    if user_input:
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.write(user_input)

        # Get LLM response
        llm_response = send_message_to_llm(st.session_state.session_id, user_input)

        # Add LLM response to chat history
        st.session_state.messages.append({"role": "assistant", "content": llm_response})
        with st.chat_message("assistant"):
            st.write(llm_response)

if __name__ == "__main__":
    main()