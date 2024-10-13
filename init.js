/* eslint-env jquery */
/* global theConverter, getCSSRule, plugin */
plugin.loadMainCSS();

plugin.setValue = function(total, used) {
	let percent = (used/total) * 100;
	let color;
	if (percent > 100) {
		color = '#D69999';
	} else if (percent > 95) {
		color = '#D6B899';
	} else if (percent > 90) {
		color = '#D6D699';
	} else {
		color = '#99D699';
	}

	$('#meter-disk-value').width(Math.min(100, percent) + '%').css('background-color', color);
	if (!plugin.altView) {
		if (used < total) {
			// Under limit
			$("#meter-disk-text").text(theConverter.bytes(total - used) + ' free');
		} else {
			// Over limit
			$("#meter-disk-text").text(theConverter.bytes(used - total) + ' over');
		}
		$("#meter-disk-pane").attr("title", percent.toFixed(2) + '%');
	} else {
		$("#meter-disk-text").text(percent.toFixed(2)+'%');
		if (used < total) {
			// Under limit
			$("#meter-disk-pane").attr("title", theConverter.bytes(total - used) + ' free');
		} else {
			// Over limit
			$("#meter-disk-pane").attr("title", theConverter.bytes(used - total) + ' over');
		}
	}
};

plugin.init = function() {
	plugin.altView = false;
	if (getCSSRule('#meter-disk-holder')) {
		plugin.addPaneToStatusbar(
			"meter-disk-pane",
			$("<div>").append(
				$("<div>").addClass("icon"),
				$("<div>").attr({id: "meter-disk-holder"}).append(
					$("<div>").attr({id: "meter-disk-value"}).width(0),
					$("<div>").attr({id: "meter-disk-text"}),
				),
			),
			1, true,
		);

		// $('#meter-disk-holder').on('dblclick', function () {
		// 	plugin.altView = !plugin.altView;

		// 	let tmp = $("#meter-disk-text").text();
		// 	$("#meter-disk-text").text = $("#meter-disk-pane").attr('title');
		// 	$("#meter-disk-pane").attr('title', tmp);
		// });

		plugin.check = function() {
			if (document.hidden || !navigator.onLine) {
				return;
			}

			fetch('/api/disk_usage', {
				credentials: 'include',
			}).then(function (resp) {
				return resp.json();
			}).then(function (data) {
				plugin.setValue(data.disk_space_allotted, data.disk_space_used);
			});
		};

		// Now
		plugin.check();

		// Every 5m
		plugin.interval = setInterval(plugin.check, 5 * 60 * 1000);

		// Tab focus
		document.addEventListener('visibilitychange', plugin.check);

		// 15 seconds after network reconnect
		window.addEventListener('online', function() {
			setTimeout(function () {
				plugin.check();
			}, 15 * 1000);
		});

		plugin.markLoaded();
	} else {
		window.setTimeout(arguments.callee,500);
	}
};

plugin.onRemove = function() {
	plugin.removePaneFromStatusbar('meter-disk-td');
	clearInterval(plugin.interval);
};

plugin.init();
