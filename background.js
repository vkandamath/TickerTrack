// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

//	chrome.storage.sync.clear();

	// Send a message to the active tab
	chrome.tabs.create({url: 'main.html'});


	chrome.runtime.onConnect.addListener(function(port) {
		console.log("connected with main.js, can send/receive messages now");



		//delay time in ms
		//var delayTime = 1000;

		//start polling yahoo
		//setInterval(fetchData, delayTime);
		fetchData();

		port.onMessage.addListener(function(msg) {
			console.log(msg.message);
		});
		
	});

});


function fetchData() {
	console.log("fetching data");
	chrome.storage.sync.get("stocks", function(result) {
		var stocks = result.stocks;
		console.log(stocks);

		for (var key in stocks) {
			var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + key + "&region=US&lang=en-US";
			console.log("key: " + key);

			// define closure to ensure that correct key is used for get request
			(function (key) {
				$.get(url, function(data, status) {
					if (status == "success") {
						console.log(status + " for key: " + key)
					}
				});
			})(key);


			/*
			$.ajax({
		        url: url,
		        async: false,
				success: function(data){
					var xmlChannel = data.firstChild.firstChild;
					var lastBuildDate = new Date(xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent);

					var recordedBuildDate = new Date(stocks[key].lastUpdatedOn);

					if (lastBuildDate > recordedBuildDate) {
						//update build date
						//update news links
						console.log(key);
						console.log(lastBuildDate);
						console.log(recordedBuildDate);
					}
		        }
			})*/
		}
	});
}

/*
		for (var key in stocks) {
			var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + key + "&region=US&lang=en-US";
			console.log("key: " + key);
			$.get(url, function(data, status) {
				if (status == "success") {
					console.log(status + " for key: " + key);		
				}
			});
		}
		*/