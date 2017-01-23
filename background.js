// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {


	// chrome.storage.sync.clear();

	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});

	chrome.runtime.onConnect.addListener(function(port) {

		// delay time in ms
		var delayTime = 5000;

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

			var startTime = new Date();
			//console.log(".......Before get request for " + key + ": " + (new Date()).toUTCString());
			// define closure to ensure that correct key is used for get request
			(function (key) {
				$.get(url, function(data, status) {
					console.log("Sent get for: " + key + " ========================================");
					console.log("......Before get request for: " + key + ": " + startTime);
					console.log("......After get request for: " + key + ": " + (new Date()));

					if (status == "success") {

						var xmlChannel = data.firstChild.firstChild;
						var xmlItems = xmlChannel.getElementsByTagName("item");
						var latestBuildDateString = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;
						latestBuildDate = new Date(latestBuildDateString);

						var storedBuildDate = new Date(stocks[key].lastUpdatedOn);

						console.log("Old date: " + storedBuildDate);
						console.log("New date: " + latestBuildDate);

						if (latestBuildDate > storedBuildDate) {
							console.log('%c Updating stock: ' + key + ' at ' + (new Date()), 'background: gray; color: blue');

							//var date = new Date();
							//var currTime = Math.round(date.getTime()/(1000*60*60*24*365));

							//console.log("Updating stock: " + key + " at " + currTime);
							//update last update datetime
							stocks[key].lastUpdatedOn = latestBuildDateString;
							
							var recentNews = getMostRecentNews(xmlItems);
							stocks[key].newsLinks = recentNews;
							chrome.storage.local.set({"stocks": stocks});

							// send message to client to update its stock news
							port.postMessage({message: "update stock", stock: key});
						}
						else if (latestBuildDate < storedBuildDate) {
							throw new Error("new build date less than old date");
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


