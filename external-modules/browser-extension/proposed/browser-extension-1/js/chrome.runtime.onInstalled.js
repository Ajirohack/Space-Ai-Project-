chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({
        enabled: true
    }).catch(err => console.error('Error setting side panel options:', err));

    chrome.contextMenus.create({
        id: 'smart-assistant',
        title: 'Smart Assistant',
        contexts: ['selection']
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error creating context menu:', chrome.runtime.lastError);
        }
    });
});