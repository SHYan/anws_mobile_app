var SCRIPT_LOAD_TIMEOUT = 1000;
var MAP_LOAD_TIMEOUT = 3000;
var defaultLatLng = new google.maps.LatLng(23.56399,120.84961);

if(itemsDb==="undefined")
	itemsDb = openDatabase('aoaws', '1.0', 'Web Storage DB', 70*1024);

$('#map').live('pageinit', initMap);
$('#taiwan').live('pageinit', showTaiwan);
$('#global').live('pageinit', showGlobal);

function showTaiwan(){
	getTaiwan(displayTaiwan);
}

function showGlobal(){
	getGlobal(displayGlobal);
}

function initMap() {
	$.mobile.showPageLoadingMsg();
	setTimeout(checkConnection, SCRIPT_LOAD_TIMEOUT);
	
	function checkConnection() {
	    if (typeof google == "undefined") {
	    	alert('google連線逾時,系統自動切換為列表頁面!');
            $.mobile.changePage("#taiwan");
	    }
	}
	
	var mapOptions = {
	        zoom: 7,
	        center: defaultLatLng,
	        mapTypeControl: false,
	        streetViewControl: false,
	        zoomControl: true,
	        zoomControlOptions: {
	          style: google.maps.ZoomControlStyle.SMALL,
	          position: google.maps.ControlPosition.TOP_LEFT
	        },
	        mapTypeId: google.maps.MapTypeId.ROADMAP
	    };
	
	window.airportsMap = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);
	
    renderMarker();
    $.mobile.hidePageLoadingMsg();
}

function renderMarker(){
	var addMarkers = function(airports) {
    	for (var i = 0; i < airports.length; i++) {
        	var marker = new google.maps.Marker({
                position: new google.maps.LatLng(airports[i].latitude, airports[i].longitude),
                map: window.airportsMap,
                title: airports[i].airport_name,
                aid: airports[i].airport_id,
                weather_en: airports[i].weather_en,
                weather: airports[i].weather,
                icon: "image/airport_marker.png"
            });
        	
        	var infoBubble2 = new InfoBubble({
                content: '<div class="phoneytext">abc</div>',
                shadowStyle: 1,
                padding: 0,
                backgroundColor: 'rgb(57,57,57)',
                borderRadius: 4,
                arrowSize: 10,
                borderWidth: 1,
                borderColor: '#2c2c2c',
                disableAutoPan: true,
                hideCloseButton: true,
                arrowPosition: 30,
                backgroundClassName: 'phoney',
                arrowStyle: 2
              });
        	google.maps.event.addListener(window.airportsMap, 'click', function() { 
                infoBubble2.setMap(null);
            });
        	google.maps.event.addListener(marker, 'click', function() {
        		$.mobile.page.prototype.options.domCache = true;
	        	var contentString = '<div class="phoneytext"><img src="'+getImage(this.weather_en)+'" style="width:40px;height:40px;vertical-align:middle; margin-right: 5px;"/>'+this.title+'</div><span style="display: block; margin-left: 60px; margin-top: -15px; font-size: 13px; color: #F5BC5F;">'+this.weather+'</span>';
	        	infoBubble2.setContent(contentString);
	        	$(infoBubble2.bubble_).attr("id", "g_"+this.aid);
	        	$(infoBubble2.bubble_).live("click", function() {
	        		var tmp = {'airport_id': this.id};
	        		infoBubble2.setMap(null);
	    			$.mobile.changePage("#weather_detail");
	    			fetchWeatherDetail(tmp);
	    	    	return true;
	        	});
	        	infoBubble2.open(window.airportsMap, this);
	        });
        }
    	
    	if(curContinent){
    		var mapOptions = {
    		        zoom: 7,
    		        center: defaultLatLng,
    		        mapTypeControl: false,
    		        streetViewControl: false,
    		        zoomControl: true,
    		        zoomControlOptions: {
    		          style: google.maps.ZoomControlStyle.SMALL,
    		          position: google.maps.ControlPosition.TOP_LEFT
    		        },
    		        mapTypeId: google.maps.MapTypeId.ROADMAP
    		    };
    		if(curContinent=="au"){
    	    	mapOptions.center = new google.maps.LatLng(-28.07198,147.83203);
    	    	mapOptions.zoom = 3;
    		}else if(curContinent=="as"){
    			mapOptions.center = new google.maps.LatLng(27.68353,112.14844);
    	    	mapOptions.zoom = 3;
    		}else if(curContinent=="cn"){
    			mapOptions.center = new google.maps.LatLng(31.735643,110.224609);
    	    	mapOptions.zoom = 4;
    		}else if(curContinent=="tw"){
    			mapOptions.center = defaultLatLng;
    	    	mapOptions.zoom = 7;
    		}else if(curContinent=="na"){
    			mapOptions.center = new google.maps.LatLng(39.02772,-102.74414);
    	    	mapOptions.zoom = 3;
    		}else if(curContinent=="sa"){
    			mapOptions.center = new google.maps.LatLng(-16.46769,-63.45703);
    	    	mapOptions.zoom = 3;
    		}else if(curContinent=="eu"){
    			mapOptions.center = new google.maps.LatLng(49.78126,12.56836);
    	    	mapOptions.zoom = 4;
    		}else if(curContinent=="af"){
    			mapOptions.center = new google.maps.LatLng(6.31530,24.96094);
    	    	mapOptions.zoom = 3;
    		}
    		window.airportsMap.setOptions(mapOptions);
        }
    	
    };
    
    getAirportLocation(addMarkers);
    function getAirportLocation(callback) {
    	var airports = [];
		itemsDb.readTransaction(function(transaction) {
			transaction.executeSql(("SELECT id, airport_name, airport_id, latitude, longitude, weather, weather_en FROM aws_airport where  continent_en=? "), [curContinent], function(transaction, results) {
				for (var ii = 0; ii < results.rows.length; ii++) {
	                airports.push(results.rows.item(ii));
	            }
	    		callback(airports);
	        },
	        function(transaction, error){
	        	//console.log("***aoaws_map : getAirportLocation : error select airport information "+error.message);
	        	}
	        );
	    });
	}
}

function displayGlobal(ls){
	$.mobile.showPageLoadingMsg();
	for(var i=0; i<ls.length; i++){
		r = ls[i];
		var lihtml = '<a><p class="my_icon_wrapper"><img src="'+getImage(r.weather_en)+'" width="50" height="50"/></p><h3 style="color: #66a3d3;">'+r.airport_name+'</h3><p>'+r.weather+'</p></a>';
		var li = $(document.createElement('li'));
		$(li).attr('id', "l_"+r.airport_id);
	    $(li).bind('click', function(){
	    	event.stopPropagation();
			var tmp = {'airport_id': this.id};
			$.mobile.changePage("#weather_detail");
			fetchWeatherDetail(tmp);
	    	return true;
	    });
		if(r.continent_en=="cn"){
	    	$('#cnList').append(li.html(lihtml));
	    }else if(r.continent_en=="as"){
	    	$('#asList').append(li.html(lihtml));
	    }else if(r.continent_en=="au"){
	    	$('#auList').append(li.html(lihtml));
	    }else if(r.continent_en=="na"){
	    	$('#naList').append(li.html(lihtml));
	    }else if(r.continent_en=="sa"){
	    	$('#saList').append(li.html(lihtml));
	    }else if(r.continent_en=="eu"){
	    	$('#euList').append(li.html(lihtml));
	    }else if(r.continent_en=="af"){
	    	$('#afList').append(li.html(lihtml));
	    }
		
	}
	$('#cnList').listview('refresh');
	$('#asList').listview('refresh');
	$('#auList').listview('refresh');
	$('#saList').listview('refresh');
	$('#naList').listview('refresh');
	$('#afList').listview('refresh');
	$('#euList').listview('refresh');
	$('#stateList').listview('refresh');
	$.mobile.hidePageLoadingMsg();
}
function getGlobal(callback){
	var airports = [];
	if($('#cnList li').length>0) return;
	var tmp = 'tw';
	itemsDb.readTransaction(function(transaction) {
		transaction.executeSql(
    			"SELECT id, airport_name, airport_id, continent_en, weather, weather_en FROM aws_airport  WHERE weather_en != ? ORDER BY id ", 
    			[tmp], function(transaction, results) {
    				if(results.rows.length==0) {
    	    			alert("網路下載不完整， 請重新啓動！");
    	    			navigator.app.exitApp();
    	    		}
		    		for (var ii = 0; ii < results.rows.length; ii++) {
		    			var r = results.rows.item(ii);
		                airports.push(r);
		            }
		    		callback(airports);
	        },function(transaction, error){
	        	console.log("***aoaws_map : getList : error getting all airport list " + error.message);
	        	}
	    	);
    });
}

function displayTaiwan(ls){
	$.mobile.showPageLoadingMsg();
	for(var i=0; i<ls.length; i++){
		r = ls[i];
		var lihtml = '<a><p class="my_icon_wrapper"><img src="'+getImage(r.weather_en)+'" width="50" height="50"/></p><h4 style="color: #66a3d3;">'+r.airport_name+'</h4><p>'+r.weather+'</p></a>';
		var li = $(document.createElement('li'));
		$(li).attr('id', "l_"+r.airport_id);
	    $(li).bind('click', function(){
	    	event.stopPropagation();
			var tmp = {'airport_id': this.id};
			$.mobile.changePage("#weather_detail");
			fetchWeatherDetail(tmp);
	    	return true;
	    });
		$('#twList').append(li.html(lihtml));
	}
	$('#twList').listview('refresh');
	$.mobile.hidePageLoadingMsg();
}

function getTaiwan(callback){
	//console.log("aoaws_map : getTaiwan "+$('#twList li').length);
	var airports = [];
	if($('#twList li').length>0) return;
	var tmp = 'tw';
	itemsDb.readTransaction(function(transaction) {
		transaction.executeSql("SELECT id, airport_name, airport_id, weather, weather_en FROM aws_airport WHERE continent_en = ? ORDER BY latitude DESC", [tmp], function(transaction, results) {
			if(results.rows.length==0) {
    			alert("網路下載不完整， 請重新啓動！");
    			navigator.app.exitApp();
    		}
    		for (var ii = 0; ii < results.rows.length; ii++) {
    			var r = results.rows.item(ii);
                airports.push(r);
            }
    		callback(airports);
        },
        function(error){
        	console.log("***aoaws_map : getList : error getting all airport list " + error.message);
        	}
    	);
    });
}

function fetchWeatherDetail(entry){
	$.mobile.showPageLoadingMsg();
	
	itemsDb.readTransaction(function(transaction) {
		var airportId = entry.airport_id;
		if(!airportId) return;
		airportId = airportId.substr(2);
		//console.log("detail airportId : "+airportId);
    	transaction.executeSql(("SELECT airport_name, airport_id, place, state, wind_direction, wind_speed, visibility, weather, weather_en, temperature, ceiling, observation_time FROM aws_airport where airport_id = ?"), [airportId], function(transaction, results) {
    		//console.log("detail airportLog count : "+results.rows.length);
    		if(results.rows.length==0) {
    			alert("網路下載不完整， 請重新啓動！");
    			navigator.app.exitApp();
    		}
    		var w = results.rows.item(0);
    		if(w.state!=null && w.state!="undefined")  $('#state').html(w.state);
    		else $('#state').html("");
    		if(w.place!=null && w.place!="undefined")  $('#place').html(w.place);
    		else $('#place').html("");
    		if(w.airport_name!=null && w.airport_name!="undefined")  $('#airport_name').html(w.airport_name);
    		else $('#airport_name').html("");
    		if(w.observation_time!=null && w.observation_time!="undefined")  $('#time').html(w.observation_time);
    		else $('#time').html("");
    		if(w.wind_direction!=null && w.wind_direction!="undefined")  $('#wind_direction').html(w.wind_direction);
    		else $('#wind_direction').html("");
    		if(w.wind_speed!=null && w.wind_speed!="undefined")  $('#wind_speed').html(w.wind_speed);
    		else $('#wind_speed').html("");
    		if(w.visibility!=null && w.visibility!="undefined")  $('#visibility').html(w.visibility);
    		else $('#visibility').html("");
    		if(w.weather!=null && w.weather!="undefined"){
    			var weatherStr = '<div><img style="width:40px;height:40px;vertical-align:middle; margin-right: 10px;" src="'+getImage(w.weather_en)+'" /><span style="">'+w.weather+'</span></div>';
    			$('#weather').html(weatherStr);
    		}
    		else $('#weather').html("");
    		if(w.ceiling!=null && w.ceiling!="undefined")  $('#ceiling').html(w.ceiling);
    		else $('#ceiling').html("");
    		if(w.temperature!=null && w.temperature!="undefined")  $('#temperature').html(w.temperature);
    		else $('#temperature').html("");
    		
        },
        function(error){
        	//console.log("***aoaws_map : fetchWeatherDetail : error getting weather information " + error.message);
        	}
        );
    });
	$.mobile.hidePageLoadingMsg();
}

var weatherArr = {
		'thunder':'lightning.gif','dust':'sandstorm.gif','sandstorm':'sandstorm.gif',
		'duststorm':'sandstorm.gif','thunderstorm':'thunderstorm.gif','sleet':'sleet.gif',
		'vcfg':'fog.gif','snow':'snow.gif','va':'volcano.gif','drizzle':'rain.gif','shower':'rain.gif',
		'haze':'haze.gif','mist':'mist.gif','fog':'fog.gif','smoke':'smoke.gif','rain':'rain.gif',
		'sand':'sandstorm.gif','squalline':'whirlwind.gif','tornado':'tornado.gif','vcsh':'clear.gif',
		'clear':'clear.gif','partlycloudy':'partlycloudy.gif','mostlycloudy':'mostlycloudy.gif','cloudy':'cloudy.gif',
		'vcts':'lightning.gif' 
};

function getImage(weather) {
	if(weather==="undefined" || weather==null || weather.length<=0 ) return "";
    var w = weather.replace(/ /g,"");
    w = w.toLowerCase();
    return "image/"+weatherArr[w];
}

