// Create and inject the sidebar
function createSidebar() {
  // Create sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'diego-gpt-sidebar';
  sidebar.className = 'diego-gpt-sidebar';
  
  // Create a custom sidebar element instead of an iframe
  const sidebarContent = document.createElement('div');
  sidebarContent.id = 'diego-sidebar-content';
  sidebarContent.innerHTML = `
    <div class="sidebar-header">
      <h1>Diego GPT</h1>
      <button id="close-sidebar">×</button>
    </div>
    <div class="sidebar-messages" id="sidebar-messages"></div>
    <div class="sidebar-input">
      <textarea id="sidebar-prompt" placeholder="Send a message..."></textarea>
      <button id="sidebar-send">Send</button>
    </div>
  `;
  
  // Append content to sidebar
  sidebar.appendChild(sidebarContent);
  
  // Append sidebar to body
  document.body.appendChild(sidebar);
  
  // Add event listeners
  document.getElementById('close-sidebar').addEventListener('click', () => {
    sidebar.classList.remove('visible');
  });
  
  document.getElementById('sidebar-send').addEventListener('click', sendMessage);
  document.getElementById('sidebar-prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  return sidebar;
}

// Function to send message to Open WebUI
function sendMessage() {
  const promptInput = document.getElementById('sidebar-prompt');
  const messagesContainer = document.getElementById('sidebar-messages');
  const prompt = promptInput.value.trim();
  
  if (!prompt) return;
  
  // Add user message to sidebar
  const userMessage = document.createElement('div');
  userMessage.className = 'sidebar-message user-message';
  userMessage.textContent = prompt;
  messagesContainer.appendChild(userMessage);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Clear input
  promptInput.value = '';
  
  // This is where we integrate with Open WebUI
  // Find the main UI input field and submit button
  const openWebUIInput = document.querySelector('textarea[placeholder*="Send a message"]');
  const openWebUIButton = openWebUIInput?.closest('div').querySelector('button');
  
  if (openWebUIInput && openWebUIButton) {
    // Fill the input
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set;
    nativeTextAreaValueSetter.call(openWebUIInput, prompt);
    
    // Dispatch input event
    const inputEvent = new Event('input', { bubbles: true });
    openWebUIInput.dispatchEvent(inputEvent);
    
    // Click the send button
    openWebUIButton.click();
    
    // Now we need to observe the response and capture it
    captureResponse();
  } else {
    // Fallback if we can't find the UI elements
    const errorMessage = document.createElement('div');
    errorMessage.className = 'sidebar-message system-message';
    errorMessage.textContent = "Couldn't connect to Open WebUI. Please try again.";
    messagesContainer.appendChild(errorMessage);
  }
}

// Function to capture responses from Open WebUI
function captureResponse() {
  const messagesContainer = document.getElementById('sidebar-messages');
  
  // Create loading indicator
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'sidebar-message assistant-message loading';
  loadingMessage.innerHTML = '<div class="loading-dots"><div></div><div></div><div></div></div>';
  messagesContainer.appendChild(loadingMessage);
  
  // Create a MutationObserver to watch for new messages
  const observer = new MutationObserver((mutations) => {
    // Look for newly added response elements in the main UI
    const latestMessage = document.querySelector('.message:last-child .content');
    
    if (latestMessage && !latestMessage.dataset.captured) {
      // Mark as captured to avoid duplicates
      latestMessage.dataset.captured = 'true';
      
      // Remove loading indicator
      if (loadingMessage.parentNode) {
        loadingMessage.remove();
      }
      
      // Create response message
      const responseMessage = document.createElement('div');
      responseMessage.className = 'sidebar-message assistant-message';
      responseMessage.textContent = latestMessage.textContent;
      messagesContainer.appendChild(responseMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Stop observing
      observer.disconnect();
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fallback timeout in case we don't capture the response
  setTimeout(() => {
    if (loadingMessage.parentNode) {
      loadingMessage.remove();
      
      const timeoutMessage = document.createElement('div');
      timeoutMessage.className = 'sidebar-message system-message';
      timeoutMessage.textContent = "Response timeout. The model might still be processing your request.";
      messagesContainer.appendChild(timeoutMessage);
      
      observer.disconnect();
    }
  }, 30000); // 30 second timeout
}

// Toggle sidebar visibility
function toggleSidebar() {
  let sidebar = document.getElementById('diego-gpt-sidebar');
  
  if (sidebar) {
    sidebar.classList.toggle('visible');
  } else {
    sidebar = createSidebar();
    setTimeout(() => {
      sidebar.classList.add('visible');
    }, 50);
  }
}

// Create a toggle button
function createToggleButton() {
  const toggleButton = document.createElement('button');
  toggleButton.id = 'sidebar-toggle';
  toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="3" x2="9" y2="21"></line>
    </svg>
  `;
  toggleButton.addEventListener('click', toggleSidebar);
  document.body.appendChild(toggleButton);
}

// Initialize the sidebar
window.addEventListener('load', () => {
  // Create the toggle button
  createToggleButton();
});
