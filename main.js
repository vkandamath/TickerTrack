window.onload = function() {

	// add rows for stocks that currently exist in storage
	chrome.storage.sync.get("stocks", function(result) {
		if (result.stocks != undefined) {
			console.log(JSON.stringify(result.stocks));
			
			for (var i = 0; i < result.stocks.length; i++) {
				// add row for stock
				//var stockHTML = "<div class='stock-row' id='symbol-" + result.stocks[i] + "'><div class='stock-symbol'>" + result.stocks[i].toUpperCase() + "</div><div class='news-ticker'>hello world</div></div>";
				var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + result.stocks[i].symbol.toUpperCase() + "</td><td>d</td></tr>";
				$("#stocks").prepend(stockHTML);
			}
		}
	});

	// entering stock and hitting enter
	$("#enter-stock").keypress(function(e) {
		// enter key
		if (e.which == 13) {
			addStock();
		}
	});

	$("#submit-stock").click(function(){
		addStock();
	});

/*
	var port = chrome.runtime.connect({name: "messages"});
	port.onMessage.addListener(function(msg) {
		console.log(msg.count);
	});*/

}

// get initial data for stock
function addStock() {

	// if nothing is entered, do nothing
	if ($("#enter-stock").val() == "") {
		alert("enter something");
		return;
	}

	var stock = $("#enter-stock").val().toLowerCase();
	$("#enter-stock").val("");

	//declaring class for Stock
	class Stock {
		constructor(symbol, lastUpdatedOn, newsLinks) {
			this.symbol = symbol;
			this.lastUpdatedOn = lastUpdatedOn;
			this.newsLinks = newsLinks;
		}
	}


	// send get request
	var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + stock + "&region=US&lang=en-US";
	console.log(url);
	$.get(url, function(data, status) {
		if (status == "success") {
			var xmlChannel = data.firstChild.firstChild;
			var xmlTitle = xmlChannel.firstChild;
			//alert(xmlTitle.textContent);

			if (xmlTitle.textContent == "Yahoo! Finance: RSS feed not found") {
				alert("invalid stock");
				return;
			}
			else {
				var xmlItems = xmlChannel.getElementsByTagName("item");
				var lastUpdatedOn = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;

				// store stock
				chrome.storage.sync.get("stocks", function(result) {
					//alert(result.stocks);
					if (result.stocks == undefined) {
						// add row for stock
						//var stockHTML = "<div class='row stock-row' id='symbol-" + stock + "'><div class='stock-symbol'>" + stock.toUpperCase() + "</div><div class='news-ticker'><marquee direction='left'>Hello world</marquee></div></div>";
						var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td>d</td></tr>";
						$("#stocks").prepend(stockHTML);

						var existingStocks = {}

						var latestNews = getMostRecentNews(xmlItems);

						existingStocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

						chrome.storage.sync.set({"stocks": existingStocks});

						console.log(JSON.stringify(existingStocks));
					}
					else {
						if (!(stock in result.stocks)) {
							// add row for stock
							//var stockHTML = "<div class='row stock-row' id='symbol-" + stock + "'><div class='stock-symbol'>" + stock.toUpperCase() + "</div><div class='news-ticker'><marquee direction='left'>Hello world</marquee></div></div>";
							var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td>d</td></tr>";
							$("#stocks").prepend(stockHTML);

							var latestNews = getMostRecentNews(xmlItems);

							// store stock
							result.stocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

							chrome.storage.sync.set({"stocks": result.stocks});

							console.log(JSON.stringify(result.stocks));
							
						}
						else {
							alert("stock already exists");
						}
					}

				});
			}
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
