// This script will be added to Open WebUI's frontend to help integrate our sidebar
(function() {
  // Create sidebar container
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'diego-sidebar-container';
  sidebarContainer.style.display = 'none';
  document.body.appendChild(sidebarContainer);
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'diego-sidebar-toggle';
  toggleButton.innerHTML = 'D';
  toggleButton.title = 'Toggle Diego GPT Sidebar';
  document.body.appendChild(toggleButton);
  
  // Toggle sidebar
  toggleButton.addEventListener('click', () => {
    if (sidebarContainer.style.display === 'none') {
      sidebarContainer.style.display = 'block';
    } else {
      sidebarContainer.style.display = 'none';
    }
  });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #diego-sidebar-container {
      position: fixed;
      top: 0;
      right: 0;
      width: 350px;
      height: 100vh;
      background: #1a1a1a;
      z-index: 9999;
      box-shadow: -5px 0 15px rgba(0,0,0,0.5);
    }
    
    #diego-sidebar-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #7C3AED;
      color: white;
      font-size: 20px;
      border: none;
      cursor: pointer;
      z-index: 10000;
    }
  `;
  document.head.appendChild(style);
})();
