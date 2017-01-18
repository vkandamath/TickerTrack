// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

	chrome.storage.sync.clear();

  // Send a message to the active tab
  chrome.tabs.create({url: 'main.html'});

});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    sendResponse("this is your response");
 });