var USE_PHONEGAP = false;
var SCRIPT_LOAD_TIMEOUT = 1000;
var MAP_LOAD_TIMEOUT = 3000;
var FIT_BOUNDS_TIMEOUT = 500;
var defaultLatLng = new google.maps.LatLng(23.56399,120.84961);

if(itemsDb==="undefined")
	itemsDb = openDatabase('aoaws', '1.0', 'Web Storage DB', 60*1024);
$('#map').live('pageshow', initMap);
$('#airport_dialog').live('pageshow', showList);

function showList(){
	//console.log("aoaws_map : showList");
	getList(displayList);
}
/**
 * Redraws the map when the user rotates their device, so that the markers
 * remain onscreen.
 */
$(window).orientationchange(function (e) {
    if ($.mobile.activePage.attr('id') == "map") {
    	//console.log("aoaws_map : orientationchange");
        //window.airportsMap.fitBounds(window.airportsMapBounds);
    }
});

function initMap() {
	//console.log("aoaws_map : initMap");
	$.mobile.showPageLoadingMsg();
	setTimeout(checkConnection, SCRIPT_LOAD_TIMEOUT);

	function checkConnection() {
		//console.log("aoaws_map : checkConnection of google");
	    if (typeof google == "undefined") {
	    	alert('google連線逾時,系統自動切換為列表頁面!');
            $.mobile.changePage("#airport_dialog");
	    }
	}
	
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
	
    if(curContinent){
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
    }
    
    window.airportsMap = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);
    
    renderMarker();
    /*
    setTimeout( function() { 
    		//console.log("aoaws_map : fitBounds");
    		window.airportsMap.fitBounds(window.airportsMapBounds);
    	}, 
    	FIT_BOUNDS_TIMEOUT 
    );
    */
    $.mobile.hidePageLoadingMsg();
}

function renderMarker(){
	var addMarkers = function(airports) {
    	//console.log("aoaws_map : addMarkers : airports.length" + airports.length);
    	//window.airportsMapBounds = new google.maps.LatLngBounds();
    	for (var i = 0; i < airports.length; i++) {
        	var marker = new google.maps.Marker({
                position: new google.maps.LatLng(airports[i].latitude, airports[i].longitude),
                map: window.airportsMap,
                title: airports[i].airport_name,
                aid: airports[i].airport_id,
                icon: "image/airport_marker.png"
            });
        	
        	var infoBubble2 = new InfoBubble({
                content: '<div class="phoneytext">'+airports[i].airport_name+'</div>',
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
        	//window.airportsMapBounds.extend(marker.getPosition());
        	google.maps.event.addListener(marker, 'click', function() {
        		//console.log("aoaws_map : google marker click : airport_id = " + this.aid);
        		$.mobile.page.prototype.options.domCache = true;
	        	var contentString = '<div class="phoneytext">'+this.title+'</div>';
	        	infoBubble2.setContent(contentString);
	        	$(infoBubble2.bubble_).attr("id", "g_"+this.aid);
	        	$(infoBubble2.bubble_).live("click", function() {
	        		//console.log("aoaws_map : google infobubble click : airport_id = " + this.id);
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
    	//console.log("aoaws_map : getAirportLocation");
		var airports = [];
		itemsDb.readTransaction(function(transaction) {
			//console.log("aoaws_map : getAirportLocation : curContinent : " + curContinent);
			transaction.executeSql(("SELECT a.id, a.airport_name, a.airport_id, a.latitude, a.longitude FROM aws_airport as a where  a.continent_en=? order by a.id"), [curContinent], function(transaction, results) {
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
function displayList(ls){
	$.mobile.showPageLoadingMsg();
	for(var i=0; i<ls.length; i++){
		r = ls[i];
		var lihtml = '<a><h4>'+r.airport_name+'</h4></a>';
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
	$('#euList').listview('refresh');
	$('#stateList').listview('refresh');
	$.mobile.hidePageLoadingMsg();
}

function fetchWeatherDetail(entry){
	$.mobile.showPageLoadingMsg();
	
	itemsDb.readTransaction(function(transaction) {
		var airportId = entry.airport_id;
		if(!airportId) return;
		airportId = airportId.substr(2);
		//console.log("detail airportId : "+airportId);
    	transaction.executeSql(("SELECT a.airport_name, a.airport_id, a.place, a.state, w.wind_direction, w.wind_speed, w.visibility, w.weather, w.temperature, w.ceiling, w.observation_time FROM aws_airport as a, aws_weather as w where w.airport_id=a.airport_id and a.airport_id = ?"), [airportId], function(transaction, results) {
    		//console.log("detail airportLog count : "+results.rows.length);
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
    		
        },
        function(error){
        	//console.log("***aoaws_map : fetchWeatherDetail : error getting weather information " + error.message);
        	}
        );
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
        },
        function(error){
        	//console.log("***aoaws_map : getList : error getting all airport list " + error.message);
        	}
    	);
    });
}