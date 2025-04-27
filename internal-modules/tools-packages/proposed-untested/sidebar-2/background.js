// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Send a message to the content script to toggle the sidebar
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" })
})

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStatus") {
    // You could retrieve status from storage here
    sendResponse({ status: "active" })
    return true
  }
})

