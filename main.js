window.onload = function() {

	// add rows for stocks that currently exist in storage
	chrome.storage.sync.get("stocks", function(result) {
		if (result.stocks != undefined) {

			for (var key in result.stocks) {

				var stock = result.stocks[key];

				// add row for stock
				var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + key.toUpperCase() + "</td><td class='marquee-col' id='news-" + key.toLowerCase() + "'><marquee scrollamount='15'>";
					
				for (var i = 0; i < stock.newsLinks.length; i++) {
					var newsLink = stock.newsLinks[i];
					stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + newsLink.title + "</a>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
				}

				stockHTML += "</marquee></td></tr>";
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

	var port = chrome.runtime.connect({name: "messages"});

	port.onMessage.addListener(function(msg) {
		if (msg.message == "update stock") {
			alert('updating stock: ' + msg.stock);
			var stockToUpdate = msg.stock;

			//retrieve updated news
			chrome.storage.sync.get("stocks", function(result) {
				var stockObj = result.stocks[stockToUpdate];
				var newsLinks = stockObj.newsLinks;
				var linksHTML = "";
				for (var i = 0; i < newsLinks.length; i++) {
					var newsLink = stock.newsLinks[i];
					linksHTML += stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + newsLink.title + "</a>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
				}
				$("#news-"+stockToUpdate + " marquee").val(linksHTML);

			});
		}
	});

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

	var url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + stock + "&region=US&lang=en-US";
	//var url = "http://localhost:1234/" + stock + ".xml";

	$.get(url, function(data, status) {
		if (status == "success") {
			var xmlChannel = data.firstChild.firstChild;
			var xmlTitle = xmlChannel.firstChild;

			if (xmlTitle.textContent == "Yahoo! Finance: RSS feed not found") {
				alert("invalid stock");
				return;
			}
			else {
				var xmlItems = xmlChannel.getElementsByTagName("item");
				var lastUpdatedOn = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;

				// store stock
				chrome.storage.sync.get("stocks", function(result) {
					
					if (result.stocks == undefined) {

						var existingStocks = {}

						var latestNews = getMostRecentNews(xmlItems);

						existingStocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

						chrome.storage.sync.set({"stocks": existingStocks});

						var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td class='marquee-col' id='news-" + stock.toLowerCase() + "'><marquee scrollamount='15'>";

						for (var i = 0; i < latestNews.length; i++) {
							var newsLink = latestNews[i];
							stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + newsLink.title + "</a>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
						}

						stockHTML += "</marquee></td></tr>";
						$("#stocks").prepend(stockHTML);
					}
					else {
						if (!(stock in result.stocks)) {

							var latestNews = getMostRecentNews(xmlItems);

							// store stock
							result.stocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

							chrome.storage.sync.set({"stocks": result.stocks});

							var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td class='marquee-col' id='news-" + stock.toLowerCase() + "'><marquee scrollamount='15'>";

							for (var i = 0; i < latestNews.length; i++) {
								var newsLink = latestNews[i];
								stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + newsLink.title + "</a>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
							}

							stockHTML += "</marquee></td></tr>";
							$("#stocks").prepend(stockHTML);
							
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
