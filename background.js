// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {


	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});



	chrome.runtime.onConnect.addListener(function(port) {
		console.log("connected with main.js, can send/receive messages now");



		//delay time in ms
		var delayTime = 3000;

		//start polling yahoo
		setInterval(fetchData, delayTime);
		//fetchData();

		port.onMessage.addListener(function(msg) {
			console.log(msg.message);
		});
		
	});

});


function fetchData() {
	console.log("================================= Fetching data");
	chrome.storage.sync.get("stocks", function(result) {
		var stocks = result.stocks;

		for (var key in stocks) {
			console.log("Fetching for stock: " + key);

			//var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + key + "&region=US&lang=en-US";
			var url = "http://localhost:1234/Documents/test.xml";

			// define closure to ensure that correct key is used for get request
			(function (key) {
				$.get(url, function(data, status) {
					console.log("Get");
					
					if (status == "success") {

						var xmlChannel = data.firstChild.firstChild;
						var xmlItems = xmlChannel.getElementsByTagName("item");
						var latestBuildDateString = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;
						latestBuildDate = new Date(latestBuildDateString);
						console.log(latestBuildDateString);

						var storedBuildDate = new Date(stocks[key].lastUpdatedOn);

						if (latestBuildDate > storedBuildDate) {
							console.log("Update stock: " + key);
							console.log("Old update: " + storedBuildDate);
							console.log("New update: " + latestBuildDate);
							//update last update datetime
							stocks[key].lastUpdatedOn = latestBuildDateString;
							console.log(stocks);
							
							var recentNews = getMostRecentNews(xmlItems);
							stocks[key].newsLinks = recentNews;
							chrome.storage.sync.set({"stocks": stocks});
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
