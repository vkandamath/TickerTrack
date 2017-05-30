window.onload = function() {

	// add rows for stocks that currently exist in storage
	chrome.storage.local.get("stocks", function(result) {
		if (result.stocks != undefined) {

			for (var key in result.stocks) {

				var stock = result.stocks[key];

				// add row for stock
				var stockHTML = "<tr class='stock-row'><td class='stock-symbol'><span>" + key.toUpperCase() + "</span></td><td class='marquee-col' id='news-" + key.toLowerCase() + "'><div class='marquee'>";

				for (var i = 0; i < stock.newsLinks.length; i++) {
					var newsLink = stock.newsLinks[i];
					stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + (i+1) + ") " + newsLink.title + "</a>";
				}

				stockHTML += "</div></td></tr>";
				$("#stocks").prepend(stockHTML);

			}

			$('.marquee').marquee({
				duration: 10000,
				startVisible: true,
				duplicated: true,
				delayBeforeStart: 0,
				pauseOnHover: true
			});
		}
	});


	$("#stocks").on('click', '.stock-symbol', function() {

		var stock = $(this).eq($(this).index()).text();
		
		// remove tr
		$(this).parent().remove();

		// removes stock from memory
		deleteStock(stock.toLowerCase());
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

	$("#about-button").click(function() {
		window.location.href = 'about.html';
	});

	var port = chrome.runtime.connect({name: "messages"});

	port.onDisconnect.addListener(function() {
		console.log("background script disconnected!")
	});

	port.onMessage.addListener(function(msg) {
		if (msg.message == "update stock") {
			var stockToUpdate = msg.stock;

			var dt = new Date();
			var utcDate = dt.toUTCString();
			console.log('%c Updating stock: ' + stockToUpdate + ' at ' + utcDate, 'background: gray; color: blue');
			
			
			//retrieve updated news
			chrome.storage.local.get("stocks", function(result) {
				var stockObj = result.stocks[stockToUpdate];
				var newsLinks = stockObj.newsLinks;

				// remove old marquee
				$('#news-' + stockToUpdate).val('');

				// update and add new marquee
				var marqueeHTML = "<div class='marquee'>";

				for (var i = 0; i < stockObj.newsLinks.length; i++) {
					var newsLink = stockObj.newsLinks[i];
					if (i == 0) {
						marqueeHTML += "<a target='_blank' class='newslink firstChild' href='" + newsLink.link + "'>" + (i+1) + ") " + newsLink.title + "</a>";
					}
					else {
						marqueeHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + (i+1) + ") " + newsLink.title + "</a>";
					}
				}

				marqueeHTML += "</div>";

				$("#news-" + stockToUpdate.toLowerCase()).html(marqueeHTML);

				// make new newslink flash in red to notify user of update
				$("#news-" + stockToUpdate + " .firstChild").addClass("animated flash infinite");
				$("#news-" + stockToUpdate + " .firstChild").css("color", "red");

				$("#news-" + stockToUpdate + " .firstChild").click(function() {
					// make link appear visited once clicked
					$("#news-" + stockToUpdate + " .firstChild").removeClass("animated flash infinite");
					$("#news-" + stockToUpdate + " .firstChild").css("color", "white");
				});


				$('#news-' + stockToUpdate + ' .marquee').marquee({
					duration: 10000,
					startVisible: true,
					duplicated: true,
					delayBeforeStart: 0,
					pauseOnHover: true
				});

	
				//desktop notifications
				var options = {
					type: "basic",
					title: "Stock News Notification",
					iconUrl: "icon.png",
					message: stockToUpdate.toUpperCase() + " was recently updated!",
					isClickable: true,
					requireInteraction: false
				}
				chrome.notifications.create(options);

			});
		}
	});

}

// removes stock from memory
function deleteStock(stock) {
	chrome.storage.local.get("stocks", function(result) {
		delete result.stocks[stock];
		chrome.storage.local.set({"stocks": result.stocks});
	});
}

// get initial data for stock
function addStock() {

	// if nothing is entered, do nothing
	if ($("#enter-stock").val() == "") {
		return;
	}

	// validate stock symbol
	if (!/^[a-z0-9]+$/i.test($("#enter-stock").val())) {
		alert("Invalid stock symbol");
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
			var xmlChannel = data.firstChild.getElementsByTagName("channel")[0];
			var xmlItems = data.getElementsByTagName("item");

			console.log(xmlChannel);

			// checks if there are any new articles to see if stock symbol is valid
			if (xmlItems.length == 0) {
				alert("Invalid stock symbol!");
				return;
			}

			var lastUpdatedOn = xmlChannel.getElementsByTagName("lastBuildDate")[0].textContent;

			// store stock
			chrome.storage.local.get("stocks", function(result) {
				console.log("storing");
				if (result.stocks == undefined) {

					var existingStocks = {}

					var latestNews = getMostRecentNews(xmlItems);

					existingStocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

					chrome.storage.local.set({"stocks": existingStocks});

					var stockHTML = "<tr class='stock-row'><td class='stock-symbol'><span>" + stock.toUpperCase() + "</span></td><td class='marquee-col' id='news-" + stock.toLowerCase() + "'><div class='marquee'>";

					for (var i = 0; i < latestNews.length; i++) {
						var newsLink = latestNews[i];
						stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + (i+1) + ") " + newsLink.title + "</a>";
					}

					stockHTML += "</marquee></td></tr>";
					$("#stocks").prepend(stockHTML);

					$('#news-' + stock + ' .marquee').marquee({
						duration: 10000,
						startVisible: true,
						duplicated: true,
						delayBeforeStart: 0,
						pauseOnHover: true
					});


				}
				else {
					if (!(stock in result.stocks)) {

						console.log(xmlItems);

						var latestNews = getMostRecentNews(xmlItems);

						// store stock
						result.stocks[stock] = new Stock(stock, lastUpdatedOn, latestNews);

						chrome.storage.local.set({"stocks": result.stocks});

						var stockHTML = "<tr class='stock-row'><td class='stock-symbol'><span>" + stock.toUpperCase() + "</span></td><td class='marquee-col' id='news-" + stock.toLowerCase() + "'><div class='marquee'>";
							
						for (var i = 0; i < latestNews.length; i++) {
							var newsLink = latestNews[i];
							stockHTML += "<a target='_blank' class='newslink' href='" + newsLink.link + "'>" + (i+1) + ") " + newsLink.title + "</a>";
						}

						stockHTML += "</marquee></td></tr>";
						$("#stocks").prepend(stockHTML);

						$('#news-' + stock + ' .marquee').marquee({
							duration: 10000,
							startVisible: true,
							duplicated: true,
							delayBeforeStart: 0,
							pauseOnHover: true
						});

							
					}
					else {
						alert("Stock symbol already displayed");
					}
				}
			});
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
		console.log(i);
		var item = xmlItems[i];
		console.log(item);
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


