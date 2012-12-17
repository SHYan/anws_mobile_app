/**
 * this js is used to initialize database we used, and sync airport and weather from server
 * @author JOHN ttosh109@gmail.com
 * @since 2012/11/23
 */
//var USE_PHONEGAP = false;
//
var itemsDb, curContinent, networkFlag=1, reloadCount = 0;
var airportServer = "http://www.anws.gov.tw/weather_app/sync_client_weather.php?method=airport&time=";
var weatherServer = "http://www.anws.gov.tw/weather_app/sync_client_weather.php?method=weather&time=";


curContinent = getParam("state");
if(!curContinent || curContinent.toString().length==0 || curContinent=="undefined") curContinent = "tw";

function getParam(name) {
	var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function initDatabase() {
	//console.log("aoaws_init_db : initDatabase");
	
	itemsDb = window.openDatabase('aoaws', '1.0', 'Web Storage DB', 50*1024);
	//clearTable();
	itemsDb.transaction(function (transaction) {
		transaction.executeSql("CREATE TABLE IF NOT EXISTS aws_airport(id, airport_name, airport_id, place, state, continent, continent_en, latitude, longitude, is_favo, modify_time);", [], createTableSuccess, createTableFail);
		transaction.executeSql("CREATE TABLE IF NOT EXISTS aws_weather(airport_id, wind_direction, wind_speed, weather, visibility, temperature, rh_percent, dewpoint_c, ceiling, msl_pressure, observation_time, metar_text, modify_time);", [], createTableSuccess, createTableFail);
	}, createTableFail, createTableFinish);

	function createTableSuccess(transaction, error) {
		//console.log("aoaws_init_db : create table success!");
	}
	function createTableFail(transaction, error){
		//console.log("***aoaws_init_db : create table faile!");
		alert("create table failed, reload again!" + error.message);
		if(reloadCount<1) {
			//console.log("***aoaws_init_db : reload initDatabase");
			reloadCount++;
			initDatabase();
		}
	}
	function createTableFinish(transaction, error) {
		//console.log("aoaws_init_db : create table Finish!");
		syncData();
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


function syncData(){
	//console.log("aoaws_init_db : syncData");
	itemsDb.transaction( function(transaction){
		if(networkFlag==1)
		transaction.executeSql("SELECT max(modify_time) as value FROM aws_airport", [], 
				function(transaction, results) {
					var w = results.rows.item(0).value;
					//console.log("aoaws_init_db : syncData : start max airport modify_time="+w);
					if(typeof w == "undefined" || w == null || w=="undefined") syncAirport(1);
					else syncAirport(w);
					//console.log("aoaws_init_db : syncData : end max airport modify_time="+w);
		}, selectMaxError);
		
		if(networkFlag==1)
		transaction.executeSql("SELECT max(modify_time) as value FROM aws_weather", [], 
				function(transaction, results) {
					var w = results.rows.item(0).value;
					//console.log("aoaws_init_db : syncData : start max weather modify_time="+w);
					if(typeof w == "undefined" || w == null || w=="undefined") syncWeather(1);
					else syncWeather(w);
					//console.log("aoaws_init_db : syncData : end max weather modify_time="+w);
		}, selectMaxError);
		
		function syncAirport(sync_time){
			//console.log("aoaws_init_db : syncAirport : modify_time = " + sync_time);
			$.ajax({
		        url: airportServer + sync_time,
		        dataType: "jsonp",
		        jsonp : "callback",
		        timeout: 6000,
		        success: function(data) {
		        	//console.log("aoaws_init_db : syncAirport success sync");
		        	if(typeof data == "undefined" || data == null || data=="undefined") return;
		        	itemsDb.transaction(function(transaction) {
		        		transaction.executeSql(
	        					"SELECT airport_id FROM aws_airport ORDER BY airport_id",
	        					[],
	        					function(transaction, results){
	        						var airportArr = [], r;
	        						for (var ii = 0; ii < results.rows.length; ii++) {
	        							r = results.rows.item(ii);
	        							airportArr.push(r.airport_id);
	        			            }
	        						for(var i=0; i<data.length; i++) {
	        							if($.inArray(data[i].airport_id, airportArr)>-1){
	        								//console.log("aoaws_init_db : syncAirport : update of airportUpdate="+data[i].airport_id);
	        								transaction.executeSql(
	        										"UPDATE aws_airport SET airport_name=?, place=?, state=?, continent=?, continent_en=?, latitude=?, longitude=?, modify_time=? WHERE airport_id=?",
	        										[data[i].airport_name, data[i].place, data[i].name, data[i].continent, data[i].continent_en, data[i].latitude, data[i].longitude, data[i].modify_time, data[i].airport_id],
	        										null,
	        										function(error){
	        											//console.log("***aoaws_init_db : syncAirport : error updating airport "+error.message);
	        											}
	        								);
	        							}else{
	        								//console.log("aoaws_init_db : syncAirport : insert of airportInsert="+data[i].airport_id);
		        							transaction.executeSql(
		        								"INSERT INTO aws_airport (id, airport_name, airport_id, place, state, continent, continent_en, latitude, longitude,  modify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ", 
		        								[i, data[i].airport_name, data[i].airport_id, data[i].place, data[i].name, data[i].continent, data[i].continent_en, data[i].latitude, data[i].longitude, data[i].modify_time],
		    			                        null,
		    			                        function(error){
		        									//console.log("***##aoaws_init_db : syncAirport : error inserting airport "+error.message);
		        									}
		    			                    );
	        							}
	        			        	}
	        						//console.log("aoaws_init_db : syncAirport : end sqlite update");
	        						
	        					},
	        					function(error){
	        						//console.log("***aoaws_init_db : syncAirport : error select airport_id list"+error.message);
	        						}
	        			);
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
			//console.log("aoaws_init_db : syncWeather : sync_time = "+sync_time);
			$.ajax({
		        url: weatherServer + sync_time,
		        dataType: "jsonp",
		        jsonp : "callback",
		        timeout: 6000,
		        success: function(data) {
		        	//console.log("aoaws_init_db : syncWeather success sync");
		        	if(typeof data == "undefined" || data == null || data=="undefined") return;
		        	itemsDb.transaction(function(transaction) {
		        		transaction.executeSql(
	        					"SELECT airport_id FROM aws_weather ORDER BY airport_id",
	        					[],
	        					function(transaction, results){
	        						var airportArr = [], r;
	        						for (var ii = 0; ii < results.rows.length; ii++) {
	        							r = results.rows.item(ii);
	        			                airportArr.push(r.airport_id);
	        			            }
	        						for(var i=0; i<data.length; i++) {
	        							if($.inArray(data[i].airport_id, airportArr)>-1){
	        								//console.log("aoaws_init_db : syncWeather : update of weatherUpdate="+data[i].airport_id);
	        								transaction.executeSql(
	        										"UPDATE aws_weather SET wind_direction=?, wind_speed=?,  weather=?, visibility=?, temperature=?, rh_percent=?, dewpoint_c=?, ceiling=?, msl_pressure=?, observation_time=?, metar_text=?, modify_time=? WHERE airport_id=?",
	        										[data[i].wind_direction, data[i].wind_speed, data[i].weather, data[i].visibility, data[i].temperature, data[i].rh_percent, data[i].dewpoint_c, data[i].ceiling, data[i].msl_pressure, data[i].observation_time, data[i].metar_text, data[i].modify_time, data[i].airport_id],
	        										null,
	        										function(error){
	        											//console.log("***aoaws_init_db : syncWeather : error updating weather "+error.message);
	        											}
	        								);
	        							}else{
	        								//console.log("aoaws_init_db : syncWeather : insert of weatherInsert="+data[i].airport_id);
		        							transaction.executeSql(
		    			                        "INSERT INTO aws_weather (airport_id, wind_direction, wind_speed, weather, visibility, temperature, rh_percent, dewpoint_c, ceiling, msl_pressure, observation_time, metar_text, modify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ", 
		    			                        [data[i].airport_id, data[i].wind_direction, data[i].wind_speed, data[i].weather, data[i].visibility, data[i].temperature, data[i].rh_percent, data[i].dewpoint_c, data[i].ceiling, data[i].msl_pressure, data[i].observation_time, data[i].metar_text, data[i].modify_time],
		    			                        null,
		    			                        function(error){
		    			                        	//console.log("***##aoaws_init_db : syncWeather : error inserting weather "+error.message);
		    			                        	}
		    			                    );
	        							}
	        			        	}
	        						//console.log("aoaws_init_db : syncWeather : end sqlite update");
	        						showList();
	        					},
	        					function(error){
	        						////console.log("***aoaws_init_db : syncWeather : error select airport_id list "+error.message);
	        						}
	        			);
		            });
		        },
		        error: function(request, status, err) {
		            if(status == "timeout") {
		            	networkFlag = 0;
		            	alert('網路連線逾時,系統自動切換為列表頁面!');
		                $.mobile.changePage("#airport_dialog");
		            }
		        }
		    });
		}
		
		function selectMaxError(transaction, error) {
		    //console.log("aoaws_init_db : syncData : selectMaxError = "+error.message);
		}
		
	});
}

