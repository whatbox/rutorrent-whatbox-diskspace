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

	const DISK_TD = document.querySelector('#meter-disk-td');
	const DISK_TEXT = document.querySelector('#meter-disk-text');

	$('#meter-disk-value').width(Math.min(100, percent) + '%').css('background-color', color);
	if (!plugin.altView) {
		if (used < total) {
			// Under limit
			DISK_TEXT.textContent = theConverter.bytes(total - used) + ' free';
		} else {
			// Over limit
			DISK_TEXT.textContent = theConverter.bytes(used - total) + ' over';
		}
		DISK_TD.title = percent.toFixed(2) + '%';
	} else {
		DISK_TEXT.textContent = percent.toFixed(2)+'%';
		if (used < total) {
			// Under limit
			DISK_TD.title = theConverter.bytes(total - used) + ' free';
		} else {
			// Over limit
			DISK_TD.title = theConverter.bytes(total - used) + ' over';
		}

	}
};

plugin.init = function() {
	plugin.altView = false;

	if (getCSSRule('#meter-disk-holder')) {
		var meter = $('<div>').attr('id','meter-disk-holder')
			.append(
				$('<span></span>')
					.attr('id','meter-disk-text')
					.css({overflow: 'visible'})
			)
			.append(
				$('<div>')
					.attr('id','meter-disk-value')
					.html('&nbsp;')
			);

		plugin.addPaneToStatusbar('meter-disk-td',  meter);

		const DISK_TD = document.querySelector('#meter-disk-td');
		const DISK_TEXT = document.querySelector('#meter-disk-text');
		DISK_TD.addEventListener('dblclick', function(){
			plugin.altView = !plugin.altView;

			let tmp = DISK_TEXT.textContent;
			DISK_TEXT.textContent = DISK_TD.title;
			DISK_TD.title = tmp;
		});

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
