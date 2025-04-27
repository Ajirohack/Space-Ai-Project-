const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');

sendBtn.addEventListener('click', () => {
  const text = inputEl.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  userMsg.textContent = text;
  messagesEl.appendChild(userMsg);

  const botMsg = document.createElement('div');
  botMsg.className = 'message bot';
  botMsg.textContent = 'This is a simulated response.';
  messagesEl.appendChild(botMsg);

  inputEl.value = '';
  messagesEl.scrollTop = messagesEl.scrollHeight;
});