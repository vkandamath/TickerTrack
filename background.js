// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {


	// chrome.storage.sync.clear();

	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});

	chrome.runtime.onConnect.addListener(function(port) {

		// delay time in ms
		var delayTime = 3000;

		// start polling yahoo
		setInterval(fetchData, delayTime, port);

		port.onMessage.addListener(function(msg) {
			console.log(msg.message);
		});
		
	});

});


function fetchData(port) {
	chrome.storage.local.get("stocks", function(result) {
		var stocks = result.stocks;

		for (var key in stocks) {

			var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + key + "&region=US&lang=en-US";
			//var url = "http://localhost:1234/" + key + ".xml";

			// define closure to ensure that correct key is used for get request
			(function (key) {
				$.get(url, function(data, status) {
					console.log("Sending get for: " + key);
					
					if (status == "success") {

						var xmlChannel = data.firstChild.firstChild;
						var xmlItems = xmlChannel.getElementsByTagName("item");
						var latestBuildDateString = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;
						latestBuildDate = new Date(latestBuildDateString);

						var storedBuildDate = new Date(stocks[key].lastUpdatedOn);

						if (latestBuildDate > storedBuildDate) {
							console.log("Update stock: " + key);
							//update last update datetime
							stocks[key].lastUpdatedOn = latestBuildDateString;
							
							var recentNews = getMostRecentNews(xmlItems);
							stocks[key].newsLinks = recentNews;
							chrome.storage.local.set({"stocks": stocks});

							// send message to client to update its stock news
							port.postMessage({message: "update stock", stock: key});
						}

					}
				});
			})(key);

		}
	});
}

// takes in list of item nodes, return list of tuples(dictionary) with article title and link
function getMostRecentNews(xmlItems) {
	var latestNews = new Array();

	// note: rss feed's articles are already sorted by date
	var topNArticles = 5;
	if (xmlItems.length < topNArticles) {
		topNArticles = xmlItems.length;
	}


	for (var i = 0; i < topNArticles; i++) {
		var item = xmlItems[i];
		var title = item.getElementsByTagName("title")[0].textContent;
		var link = item.getElementsByTagName("link")[0].textContent;

		// removes [$$] from beginning of some news titles
		if (title.substring(0,5) == '[$$] ') {
			title = title.substring(5);
		}

		var tuple = {title: title, link: link};
		latestNews.push(tuple);
	}

	return latestNews;
}
