var USE_PHONEGAP = false;
var SCRIPT_LOAD_TIMEOUT = 3000;
var MAP_LOAD_TIMEOUT = 3000;
var FIT_BOUNDS_TIMEOUT = 500;

var defaultLatLng = new google.maps.LatLng(23.56399,120.84961);

itemsDb = openDatabase('aoaws', '1.0', 'Web Storage DB', 256*1024);
$('#map').live('pageshow', initMap);
$('#airport_dialog').live('pageshow', showList);

function showList(){
	getList(displayList);
}

setTimeout(checkConnection, SCRIPT_LOAD_TIMEOUT);
function checkConnection() {
    if (typeof google == "undefined") {
        alert("Can't connect to the Google Maps server. Please make sure youare connected to the internet, then try again.");
        window.location.reload(true);
    }
}

/**
 * Redraws the map when the user rotates their device, so that the markers
 * remain onscreen.
 */
$(window).orientationchange(function (e) {
    if ($.mobile.activePage.attr('id') == "map") {
        window.airportsMap.fitBounds(window.airportsMapBounds);
    }
});

function initMap() {
	var mapOptions = {
	        zoom: 8,
	        center: defaultLatLng,
	        mapTypeControl: false,
	        streetViewControl: false,
	        zoomControl: true,
	        zoomControlOptions: {
	          style: google.maps.ZoomControlStyle.SMALL
	        },
	        mapTypeId: google.maps.MapTypeId.ROADMAP
	    };
	console.log("map reset center to : "+curContinent);
	//statePos = getParam("state");
	statePos = curContinent;
    if(statePos){
    	statePos = statePos.toString();
    	if(statePos.length==2) {
    		if(statePos=="au"){
		    	mapOptions.center = new google.maps.LatLng(-28.07198,147.83203);
		    	mapOptions.zoom = 3;
    		}else if(statePos=="as"){
    			mapOptions.center = new google.maps.LatLng(27.68353,112.14844);
		    	mapOptions.zoom = 3;
    		}else if(statePos=="cn"){
    			mapOptions.center = new google.maps.LatLng(31.735643,110.224609);
		    	mapOptions.zoom = 4;
    		}else if(statePos=="tw"){
    			mapOptions.center = defaultLatLng;
		    	mapOptions.zoom = 7;
    		}else if(statePos=="na"){
    			mapOptions.center = new google.maps.LatLng(39.02772,-102.74414);
		    	mapOptions.zoom = 3;
    		}else if(statePos=="sa"){
    			mapOptions.center = new google.maps.LatLng(-16.46769,-63.45703);
		    	mapOptions.zoom = 3;
    		}else if(statePos=="eu"){
    			mapOptions.center = new google.maps.LatLng(49.78126,12.56836);
		    	mapOptions.zoom = 4;
    		}else if(statePos=="af"){
    			mapOptions.center = new google.maps.LatLng(6.31530,24.96094);
		    	mapOptions.zoom = 3;
    		}
    		
    	}
    }
    window.airportsMap = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);
    
    
    var addMarkers = function(airports) {
    	
    	for (var i = 0; i < airports.length; i++) {
        	var marker = new google.maps.Marker({
                position: new google.maps.LatLng(airports[i].latitude, airports[i].longitude),
                map: window.airportsMap,
                title: airports[i].airport_name,
                aid: airports[i].airport_id,
                icon: "image/airport_marker.png",
                airport_id: airports[i].airport_id
            });
        	
        	var infoBubble2 = new InfoBubble({
                content: '<div class="phoneytext">'+airports[i].id+'</div>',
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

        	google.maps.event.addListener(marker, 'click', function() {
        		$.mobile.page.prototype.options.domCache = true;
	        	var contentString = '<div class="phoneytext">'+this.title+'</div>';
	        	infoBubble2.setContent(contentString);
	        	$(infoBubble2.bubble_).attr("id", "g_"+this.aid);
	        	$(infoBubble2.bubble_).live("click", function() {
	        		console.log("this click id is : "+this.id);
	        		var tmp = {'airport_id': this.id};
	    			$.mobile.changePage("#weather_detail");
	    			fetchWeatherDetail(tmp);
	    	    	return true;
	        	});
	        	infoBubble2.open(window.airportsMap, this);
	        });
        }
    };
    getAirportLocation(addMarkers);
    function getAirportLocation(callback) {
    	console.log("aoaws_map : getAirportLocation");
		var airports = [];
		itemsDb.readTransaction(function(transaction) {
			console.log("now is selecting marker of this continent : "+curContinent);
	    	transaction.executeSql(("SELECT a.id, a.airport_name, a.airport_id, w.weather, a.latitude, a.longitude FROM aws_airport as a, aws_weather as w where w.airport_id=a.airport_id and a.continent_en=? order by a.id"), [curContinent], function(transaction, results) {
	    		console.log("this continent marker numbers are : "+ results.rows.length);
	    		for (var ii = 0; ii < results.rows.length; ii++) {
	                airports.push(results.rows.item(ii));
	            }
	    		callback(airports);
	        }, errorHandler);
	    });
		
	}
}



function displayList(ls){
	$.mobile.showPageLoadingMsg();
	for(var i=0; i<ls.length; i++){
		r = ls[i];
		//var lihtml = '<a href="#weather_detail"><h4>'+r.airport_name+'</h4></a>';
		var lihtml = '<h4>'+r.airport_name+'</h4>';
		//var li = $('<li><a href="weather.html?aid='+r.airport_id+'" data-rel="dialog"><h4>'+r.airport_name+'</h4></a></li>');
		var li = $(document.createElement('li'));
		$(li).attr('id', "l_"+r.airport_id);
	    $(li).bind('click', function(){
	    	event.stopPropagation();
			var tmp = {'airport_id': this.id};
			$.mobile.changePage("#weather_detail");
			fetchWeatherDetail(tmp);
	    	return true;
	    });
		if(r.continent =="臺灣"){
	    	$('#twList').append(li.html(lihtml));
	    }else if(r.continent=="大陸"){
	    	$('#cnList').append(li.html(lihtml));
	    }else if(r.continent=="亞洲"){
	    	$('#asList').append(li.html(lihtml));
	    }else if(r.continent=="大洋洲"){
	    	$('#auList').append(li.html(lihtml));
	    }else if(r.continent=="北美洲"){
	    	$('#naList').append(li.html(lihtml));
	    }else if(r.continent=="中南美洲"){
	    	$('#saList').append(li.html(lihtml));
	    }else if(r.continent=="歐洲"){
	    	$('#euList').append(li.html(lihtml));
	    }else if(r.continent=="中東&非洲"){
	    	$('#afList').append(li.html(lihtml));
	    }
		
	}
	$('#twList').listview('refresh');
	$('#cnList').listview('refresh');
	$('#asList').listview('refresh');
	$('#auList').listview('refresh');
	$('#saList').listview('refresh');
	$('#naList').listview('refresh');
	$('#afList').listview('refresh');
	$('#ouList').listview('refresh');
	$('#stateList').listview('refresh');
	$.mobile.hidePageLoadingMsg();
}
function fetchWeatherDetail(entry){
	$.mobile.showPageLoadingMsg();
	
	itemsDb = openDatabase('aoaws', '1.0', 'Web Storage DB', 1024*1024);
	itemsDb.readTransaction(function(transaction) {
		var airportId = entry.airport_id;
		if(!airportId) return;
		airportId = airportId.substr(2);
    	transaction.executeSql(("SELECT a.airport_name, a.airport_id, a.place, a.state, w.wind_direction, w.wind_speed, w.visibility, w.weather, w.temperature, w.ceiling, w.observation_time, w.metar_text FROM aws_airport as a, aws_weather as w where w.airport_id=a.airport_id and a.airport_id = ?order by a.id"), [airportId], function(transaction, results) {
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
    		if(w.weather!=null && w.weather!="undefined")  $('#weather').html(w.weather);
    		else $('#weather').html("");
    		if(w.ceiling!=null && w.ceiling!="undefined")  $('#ceiling').html(w.ceiling);
    		else $('#ceiling').html("");
    		if(w.temperature!=null && w.temperature!="undefined")  $('#temperature').html(w.temperature);
    		else $('#temperature').html("");
    		
        }, errorHandler);
    });
	
	$.mobile.hidePageLoadingMsg();
}
function getList(callback){
	var airports = [];
	itemsDb.readTransaction(function(transaction) {
    	transaction.executeSql(("SELECT a.id, a.airport_name, a.airport_id, a.continent FROM aws_airport as a order by a.id"), [], function(transaction, results) {
    		for (var ii = 0; ii < results.rows.length; ii++) {
    			var r = results.rows.item(ii);
                airports.push(r);
            }
    		callback(airports);
        }, errorHandler);
    });
}