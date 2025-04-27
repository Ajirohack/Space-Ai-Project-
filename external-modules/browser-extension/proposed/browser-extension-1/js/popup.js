chrome.runtime.sendMessage({ greeting: "hello" })
    .then(response => {
        if (response) {
            console.log(response.farewell);
        }
    })
    .catch(error => {
        console.error('Message error:', error);
    });