window.onload = function() {
	// entering stock and hitting enter
	$("#enter-stock").keypress(function(e) {
		// enter key
		if (e.which == 13) {
			startNewsRetrieval();
		}
	});

	$("#submit-stock").click(function(){
		startNewsRetrieval();
	});
}

// ask server for top stock headlines, server retrieves periodically
function startNewsRetrieval() {
	if ($("#enter-stock").val() != "") {
		var stock = $("#enter-stock").val().toLowerCase();
		$("#enter-stock").val("");
	}
}