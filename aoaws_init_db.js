var USE_PHONEGAP = false;
var itemsDb;
var curContinent = getParam("state");
if(!curContinent || curContinent.toString().length==0) curContinent = "tw";

function getParam(name) {
	var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function initDB() {
	if (USE_PHONEGAP) {
	    // Using PhoneGap: We need to wait for deviceready before trying to
	    // access the device's contacts database
	    document.addEventListener('deviceready', initDatabase, false);
	} else {
	    // Not using PhoneGap: We can pull the contacts immediately from the
	    // dummy contacts array, as soon as the DOM is ready
	    initDatabase();
	}
}

function errorHandlerE(transaction, error) {
    alert("網路連線發生點小錯誤，請重新啓動一次!!!");
}

function errorHandler(transaction, error) {
    alert("發生錯誤!!!" + error.message);
}

function initDatabase() {
	var networkFlag = 1;
	itemsDb = openDatabase('aoaws', '1.0', 'Web Storage DB', 256*1024);
	itemsDb.transaction(function (transaction) {
		//dropTable();
		console.log("aoaws_init_db : initDatabase");
		transaction.executeSql("CREATE TABLE IF NOT EXISTS aws_airport(id, airport_name, airport_id, place, state, continent, continent_en, latitude, longitude, modify_time);", [], null, errorHandlerE);
		transaction.executeSql("CREATE TABLE IF NOT EXISTS aws_weather(airport_id, wind_direction, wind_speed, weather, visibility, temperature, rh_percent, dewpoint_c, ceiling, msl_pressure, observation_time, metar_text, modify_time);", [], null, errorHandlerE);
		console.log("aoaws_init_db : initDatabase2");
		//clearTable();
    	syncAllData();
	});

	function syncAllData() {
		//alert("syncAllTables");
		console.log("aoaws_init_db : syncAllData");
		itemsDb.transaction( function(transaction){
			console.log("aoaws_init_db : initDatabase : select max modify time");
			if(networkFlag==1)
			transaction.executeSql("SELECT max(modify_time) as value FROM aws_airport", [], 
					function(transaction, results) {
						var w = results.rows.item(0).value;
						if(typeof(w) == "undefined" || w == null) syncStateAirport(1);
						else syncStateAirport(w);
			}, errorHandler);
			if(networkFlag==1)
			transaction.executeSql("SELECT max(modify_time) as value FROM aws_weather", [], 
					function(transaction, results) {
						var w = results.rows.item(0).value;
						if(typeof(w) == "undefined" || w == null) syncWeather(1);
						else syncWeather(w);
			}, errorHandler);
		});
	}

	function syncStateAirport(sync_time) {
		console.log("aoaws_init_db : syncStateAirport : time = "+sync_time);
		$.ajax({
	        url: "http://www.anws.gov.tw/weather_app/sync_client_weather.php?method=airport&time="+sync_time,
	        dataType: "jsonp",
	        jsonp : "callback",
	        timeout: 6000,
	        success: function(data) {
	        	if(typeof(data) == "undefined" || data == null || data=="undefined") return;
	        	itemsDb.transaction(function(transaction) {
	        		
	        		for(var i=0; i<data.length; i++) {
	        			// TODO update state need
	        			transaction.executeSql(
	                        "INSERT INTO aws_airport (id, airport_name, airport_id, place, state, continent, continent_en, latitude, longitude, modify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ", 
	                        [i, data[i].airport_name, data[i].airport_id, data[i].place, data[i].name, data[i].continent, data[i].continent_en, data[i].latitude, data[i].longitude, data[i].modify_time],
	                        null,
	                        errorHandler
	                    );
	        		}
	            });
	        	
	        },
	        error: function(request, status, err) {
	        	if(status == "timeout") {
	            	networkFlag = 0;
	                alert('網路連線逾時,切換為列表頁面!');
	                $.mobile.changePage("#airport_dialog");
	            }
	        }
	    });
	}
	
	function syncWeather(sync_time) {
		console.log("aoaws_init_db : syncWeather : time = "+sync_time);
		$.ajax({
	        url: "http://www.anws.gov.tw/weather_app/sync_client_weather.php?method=weather&time="+sync_time,
	        dataType: "jsonp",
	        jsonp : "callback",
	        timeout: 6000,
	        success: function(data) {
	        	if(typeof(data) == "undefined" || data == null || data=="undefined") return;
	        	itemsDb.transaction(function(transaction) {
	        		for(var i=0; i<data.length; i++) {
	        			// TODO update state need 
	        			
	        			transaction.executeSql(
	                        "INSERT INTO aws_weather (airport_id, wind_direction, wind_speed, weather, visibility, temperature, rh_percent, dewpoint_c, ceiling, msl_pressure, observation_time, metar_text, modify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ", 
	                        [data[i].airport_id, data[i].wind_direction, data[i].wind_speed, data[i].weather, data[i].visibility, data[i].temperature, data[i].rh_percent, data[i].dewpoint_c, data[i].ceiling, data[i].msl_pressure, data[i].observation_time, data[i].metar_text, data[i].modify_time],
	                        null,
	                        errorHandler
	                    );
	        		}
	            });
	        },
	        error: function(request, status, err) {
	            if(status == "timeout") {
	            	networkFlag = 0;
	            	alert('網路連線逾時,切換為列表頁面!');
	                $.mobile.changePage("#airport_dialog");
	            }
	        }
	    });
	}

	function clearTable() {
		itemsDb.transaction( function(transaction){ transaction.executeSql("DELETE FROM aws_airport", [], null, errorHandler);});
		itemsDb.transaction(function(transaction){transaction.executeSql("DELETE FROM aws_weather", [], null, errorHandler);});
	}

	function dropTable() {
		itemsDb.transaction(function(tx) { tx.executeSql("DROP TABLE aws_airport", [], null, errorHandler); });
		itemsDb.transaction(function(tx) { tx.executeSql("DROP TABLE aws_weather", [], null, errorHandler); });
	}
}
