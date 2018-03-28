import { geolocation } from "geolocation";
import * as messaging from "messaging";
import { settingsStorage } from "settings";

import * as variables from "../common/variables.js";

var index = 1;
var current_favourite_number = -1;

console.log("App started");

var GPSoptions = {
  enableHighAccuracy: false,
  maximumAge: 60000
};

function locationError(error) {
  console.log("Error fetching location");
  sendResponse({error:true,message:"no_location"});
}

function getStations(position) {
  var latitude, longitude;
  
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  
  //@Test
  /*var location_chosen = 1;
  latitude = [53.323288, 53.398299][location_chosen];
  longitude = [-6.261120, -6.242622][location_chosen];*/
  
  console.log("Location: "+latitude+", "+longitude);
  var url = variables.getURLStationNames(latitude, longitude);
  //console.log("Loading data from "+url);
  fetch(url).then(function (response) {
      response.text()
      .then(function(data) {
        var data = JSON.parse(data);
        var searched_index = 0;
        for(var i = 0;i<data["results"].length;i++){
          if(data["results"][i]["id"]!=undefined){
             searched_index++;
          }
          if(data["results"][i]["id"]!=undefined && searched_index >= index){
            fetchStop(data["results"][i]["id"], data.results[i].name);
            break;
          }
        }
      });
  })
  .catch(function (err) {
    console.log("Error fetching: " + err);
  });
}

function getFavourite(setting){
  try{
    return fetchStop(setting.value, setting.name);
  }catch(e){
    console.log("Test:"+e);
    return null;
  }
}

function fetchStop(id, name){
  var url2 = variables.getURLStationDetails(id);
  console.log(url2);
  fetch(url2)
  .then(function (response2) {
      response2.text()
      .then(function(data2) {
        var data2 = JSON.parse(data2);
        var data_response = {
          name: name,
          to:[],
          departures:[],
          number:[],
          operators:[],
          platforms:[],
          categories:[]
        }

        for(var ia=0;ia<data2["results"].length;ia++){
          //console.log(ia+": "+data2["stationboard"][ia]["to"]);
          try{
            var departure = data2["results"][ia]["departuredatetime"];
            var time = departure.split(" ")[1].split(":");

            var departure = new Date();
            departure.setHours(time[0]);
            departure.setMinutes(time[1]);
            departure.setSeconds(time[2]);

            data_response.to[ia] = data2["results"][ia]["destination"];
            data_response.departures[ia] = departure.getTime()/1000;
            data_response.number[ia] = data2["results"][ia]["route"];
            data_response.operators[ia] = data2["results"][ia]["operator"];
            data_response.platforms[ia] = "";
            data_response.categories[ia] = "";
          }catch(e){

          }
        }

        sendResponse(data_response);
      });
  }).catch(function (err) {
    console.log("Error fetching data from internet: " + err);
  });
}

function sendResponse(response){
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    console.log("Sending response");
    console.log(response);
    messaging.peerSocket.send(response);
  } else {
    console.log("Error: Connection is not open");
  }
}

messaging.peerSocket.onopen = function() {
  console.log("Socket open");
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  //Locations
  if(evt.data.key=="changeStationDown" && evt.data.menu == 1){
    index++;
    geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
  }else if(evt.data.key=="changeStationUp" && evt.data.menu == 1){
    index--;
    geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
  } else if(evt.data.menu == 1){
    index = 1;
    geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
  }
  //Favourites
  else if(evt.data.key=="changeStationDown" && evt.data.menu == 0){
    getFavourite(JSON.parse(settingsStorage.getItem("favourite_2")));
  }else if(evt.data.key=="changeStationUp" && evt.data.menu == 0){
    getFavourite(JSON.parse(settingsStorage.getItem("favourite_1")));
  }else{
    index = 1;
    getFavourite(JSON.parse(settingsStorage.getItem("favourite_1")));
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

/*
----------------------------------
--------  Settings  --------------
----------------------------------
*/

settingsStorage.onchange = function(evt) {
  if (evt.key === "searchStations"){
    loadResults(evt.newValue);
  }
}

function loadResults(value){
  var autoValues = [];
 
  var url = "https://api.schmuckli.net/fitbit_os/dublin_transport/find_location.php?name="+value;
  fetch(url).then(function (response) {
      response.text()
      .then(function(data) {
        var data = JSON.parse(data);
        for(var i=0;i<data["results"].length;i++){
          autoValues.push({name: data["results"][i]["name"],value: data["results"][i]["id"]});
        }
        settingsStorage.setItem('resultStations', JSON.stringify(autoValues));
      });
  });
}