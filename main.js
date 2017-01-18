window.onload = function() {

	// add rows for stocks that currently exist in storage
	chrome.storage.sync.get("stocks", function(result) {
		if (result.stocks != undefined) {
			for (var i = 0; i < result.stocks.length; i++) {
				// add row for stock
				//var stockHTML = "<div class='stock-row' id='symbol-" + result.stocks[i] + "'><div class='stock-symbol'>" + result.stocks[i].toUpperCase() + "</div><div class='news-ticker'>hello world</div></div>";
				var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + result.stocks[i].toUpperCase() + "</td><td>d</td></tr>";
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
						var newArr = new Array()
						newArr.push(stock);

						chrome.storage.sync.set({"stocks": newArr});

						// add row for stock
						//var stockHTML = "<div class='row stock-row' id='symbol-" + stock + "'><div class='stock-symbol'>" + stock.toUpperCase() + "</div><div class='news-ticker'><marquee direction='left'>Hello world</marquee></div></div>";
						var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td>d</td></tr>";
						$("#stocks").prepend(stockHTML);
					}
					else {
						if (!result.stocks.includes(stock)) {
							// store stock
							result.stocks.push(stock);
							chrome.storage.sync.set({"stocks": result.stocks});
							
							// add row for stock
							//var stockHTML = "<div class='row stock-row' id='symbol-" + stock + "'><div class='stock-symbol'>" + stock.toUpperCase() + "</div><div class='news-ticker'><marquee direction='left'>Hello world</marquee></div></div>";
							var stockHTML = "<tr class='stock-row'><td class='stock-symbol'>" + stock.toUpperCase() + "</td><td>d</td></tr>";
							$("#stocks").prepend(stockHTML);
							startPollingNews(stock);
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

function startPollingNews(stock) {
	chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  		console.log(response);
	});
}
