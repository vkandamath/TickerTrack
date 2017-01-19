// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

	chrome.storage.sync.clear();

	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});

/*
	chrome.runtime.onConnect.addListener(function(port) {
		var i = 0;
		setInterval(function() {
			port.postMessage({count: i});
			i++;
		}, 1000);
	});*/

});

