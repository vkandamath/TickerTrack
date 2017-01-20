// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {


	//chrome.storage.sync.clear();

	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});

	chrome.runtime.onConnect.addListener(function(port) {
		console.log("connected with main.js, can send/receive messages now");

		//delay time in ms
		var delayTime = 3000;

		//start polling yahoo
		setInterval(fetchData, delayTime, port);
		//fetchData();

		port.onMessage.addListener(function(msg) {
			console.log(msg.message);
		});
		
	});

});


function fetchData(port) {
	console.log("================================= Fetching data ====================================");
	chrome.storage.sync.get("stocks", function(result) {
		var stocks = result.stocks;

		for (var key in stocks) {

			//var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + key + "&region=US&lang=en-US";
			var url = "http://localhost:1234/" + key + ".xml";

			// define closure to ensure that correct key is used for get request
			(function (key) {
				$.get(url, function(data, status) {
					
					if (status == "success") {

						var xmlChannel = data.firstChild.firstChild;
						var xmlItems = xmlChannel.getElementsByTagName("item");
						var latestBuildDateString = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;
						latestBuildDate = new Date(latestBuildDateString);

						var storedBuildDate = new Date(stocks[key].lastUpdatedOn);

						console.log(".............. stock: " + key + " .............");
						console.log("old date: " + storedBuildDate);
						console.log("new date: " + latestBuildDate);

						if (latestBuildDate > storedBuildDate) {
							console.log("Update stock: " + key);
							//update last update datetime
							stocks[key].lastUpdatedOn = latestBuildDateString;
							
							var recentNews = getMostRecentNews(xmlItems);
							stocks[key].newsLinks = recentNews;
							chrome.storage.sync.set({"stocks": stocks});

							// send message to client to update its stock news
							port.postMessage({message: "update stock", stock: key});
						}
						/*
						else if (latestBuildDate.getTime() == storedBuildDate.getTime()) {
							console.log("Don't update: " + key);
						}*/
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
	for (var i = 0; i < topNArticles; i++) {
		var item = xmlItems[i];
		var title = item.getElementsByTagName("title")[0].textContent;
		var link = item.getElementsByTagName("link")[0].textContent;
		var tuple = {title: title, link: link};
		latestNews.push(tuple);
	}

	return latestNews;
}
