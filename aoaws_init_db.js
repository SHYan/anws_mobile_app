/**
 * this js is used to initialize database we used, and sync airport and weather from server
 * @author JOHN ttosh109@gmail.com
 * @since 2012/11/23
 */
var itemsDb = window.openDatabase('aoaws', '1.0', 'Web Storage DB', 70*1024);
var curContinent, networkFlag=1, mapLoadCount = 0, reloadCount = 0;
var airportServer = "http://www.anws.gov.tw/weather_app/sync_client_weather.php";

if(!curContinent || curContinent.toString().length==0 || curContinent=="undefined") curContinent = "tw";

function onDeviceReady() {
    document.addEventListener("backbutton", function(e){
    	//console.log("backbutton is on");
	    if($.mobile.activePage.is('#map') || $.mobile.activePage.is('#taiwan') || $.mobile.activePage.is('#global')){
	        e.preventDefault();
	        navigator.app.exitApp();
	    }
	    else {
	        navigator.app.backHistory();
	    }
	}, false);
}
function initDatabase() {
	
	$.mobile.showPageLoadingMsg();
	document.addEventListener("deviceready", onDeviceReady, false);
	itemsDb.transaction(function (transaction) {
		transaction.executeSql("CREATE TABLE IF NOT EXISTS aws_airport(id, airport_name, airport_id, place, state, continent_en, latitude, longitude, wind_direction, wind_speed, weather, weather_en, visibility, temperature, ceiling, observation_time);", [], createTableSuccess, createTableFail);
	}, createTableFail, createTableFinish);

	function createTableSuccess(transaction, error) {
		//console.log("aoaws_init_db : create table success!");
	}
	function createTableFail(transaction, error){
		if(reloadCount<1) {
			reloadCount++;
			initDatabase();
		}
	}
	function createTableFinish(transaction, error) {
		syncAirport();
	}

	$.mobile.hidePageLoadingMsg();
}

function clearTable(data) {
	itemsDb.transaction( 
			function(transaction){ 
				transaction.executeSql("DELETE FROM aws_airport", [], function(transaction){
					setTimeout(insertTable(data), 500);
					}, function(error) {
					//console.log("***aoaws_init_db : syncAirport : error select airport_id list"+error.message);
					}
				);
			});
}

function dropTable() {
	itemsDb.transaction(function(tx) { tx.executeSql("DROP TABLE aws_airport", [], null, errorHandler); });
}

var countTotal = 0;
function countSql(sizeT){
	countTotal++;
	//console.log("count = "+countTotal+"__size:"+sizeT);
	if(countTotal==sizeT) {
		setTimeout(renderMarker, 500);
		countTotal = 0;
	}
}

function insertTable(data) {
	$.mobile.showPageLoadingMsg();
	//console.log("aoaws_init_db : insertTable : dataLength = " + data.length);
	itemsDb.transaction(function(transaction) {
		transaction.executeSql(
				"SELECT airport_id FROM aws_airport limit 1",
				[],
				function(transaction, results){
					for(var i=0; i<data.length; i++) {
						transaction.executeSql(
							"INSERT INTO aws_airport (id, airport_name, airport_id, place, state, continent_en, latitude, longitude, wind_direction, wind_speed, weather, weather_en, visibility, temperature, ceiling, observation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ", 
							[i, data[i].airport_name, data[i].airport_id, data[i].place, data[i].name, data[i].continent_en, data[i].latitude, data[i].longitude, data[i].wind_direction, data[i].wind_speed, data[i].weather, data[i].weather_en, data[i].visibility, data[i].temperature, data[i].ceiling, data[i].observation_time],
				            function(transaction) {
								//console.log("aoaws_init_db : syncAirport : insert of airportInsert="+this.i+data.length);
								countSql(data.length);
								},
				            function(error){
								console.log("***##aoaws_init_db : syncAirport : error inserting airport "+error.message);
								}
				        );
					}
				},
				function(error){
					//console.log("***aoaws_init_db : syncAirport : error select airport_id list"+error.message);
					}
				);
	});
	
	$.mobile.hidePageLoadingMsg();
}
function syncAirport(){
	//console.log("aoaws_init_db : syncAirport : modify_time = " + sync_time);
	$.mobile.showPageLoadingMsg();
	$.ajax({
        url: airportServer,
        dataType: "jsonp",
        jsonp : "callback",
        timeout: 10000,
        success: function(data) {
        	//console.log("aoaws_init_db : syncAirport success sync");
        	if(typeof data == "undefined" || data == null || data=="undefined") return;
        	if(data.length > 0) {
        		clearTable(data);
        	}
        },
        error: function(request, status, err) {
        	if(status == "timeout") {
            	networkFlag = 0;
                alert('網路連線逾時,切換為台灣列表頁面!');
                $.mobile.changePage("#taiwan");
            }
        }
    });
	$.mobile.hidePageLoadingMsg();
}

