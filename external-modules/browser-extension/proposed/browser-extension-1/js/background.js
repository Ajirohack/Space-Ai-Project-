chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed');
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4688f1' });
});