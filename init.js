plugin.loadMainCSS();

plugin.setValue = function(total, used) {
	var percent = (used/total) * 100;
	color = '#99D699';
	if (percent > 90) color = '#D6D699';
	if (percent > 95) color = '#D6B899';
	if (percent > 100) color = '#D69999';

	$("#meter-disk-value").width(Math.min(100,percent) + "%" ).css("background-color", color);
	if (!plugin.altView) {
		if (used < total) {
			// Under limit
			$("#meter-disk-text").text(theConverter.bytes(total - used) + " free");
		} else {
			// Over limit
			$("#meter-disk-text").text(theConverter.bytes(used - total) + " over");
		}
		$("#meter-disk-td").attr("title", (percent).toFixed(2)+'%');
	} else {
		$("#meter-disk-text").text((percent).toFixed(2)+'%');
		if (used < total) {
			// Under limit
			$("#meter-disk-td").attr("title", theConverter.bytes(total - used) + " free");
		} else {
			// Over limit
			$("#meter-disk-td").attr("title", theConverter.bytes(total - used) + " over");
		}

	}
};

plugin.init = function() {
	plugin.altView = false;

	var visible = true;
	if (typeof document.hidden !== 'undefined') {
		visible = !document.hidden;
		document.addEventListener('visibilitychange', function(){
			visible = !document.hidden;

			//Run check if making page visible
			if (visible) {
				plugin.check();
			}
		});
	}

	if(getCSSRule("#meter-disk-holder")) {
		var meter = $("<div>").attr("id","meter-disk-holder")
		.append(
			$("<span></span>")
			.attr("id","meter-disk-text")
			.css({overflow: "visible"})
		)
		.append(
			$("<div>")
			.attr("id","meter-disk-value")
			.html("&nbsp;")
		);

		plugin.addPaneToStatusbar( "meter-disk-td",  meter);

		$('#meter-disk-td').dblclick(function(){
			plugin.altView = !plugin.altView;

			var tmp = $('#meter-disk-text').text();
			$('#meter-disk-text').text($('#meter-disk-td').attr('title'));
			$('#meter-disk-td').attr('title',tmp);
		});


		plugin.check = function() {
			if (!visible) return;

			var AjaxReq = jQuery.ajax({
				type: "GET",
				timeout: theWebUI.settings["webui.reqtimeout"],
				async : true,
				cache: false,
				url : "/api/disk_usage",
				dataType : "json",
				success : function(data) {
					plugin.setValue( data.disk_space_allotted, data.disk_space_used );
				}
			});
		};

		//check now
		plugin.check();

		//Then again, every 5m
		plugin.interval = setInterval(plugin.check, 5*60*1000);

		plugin.markLoaded();
	} else {
		window.setTimeout(arguments.callee,500);
	}
};

plugin.onRemove = function() {
	plugin.removePaneFromStatusbar("meter-disk-td");
	clearInterval(plugin.interval);
};

plugin.init();
