import { geolocation } from "geolocation";
import * as messaging from "messaging";

var index = 1;

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
  /*var location_chosen = 0;
  latitude = [53.323288, 53.398299][location_chosen];
  longitude = [-6.261120, -6.242622][location_chosen];*/
  
  console.log("Location: "+latitude+", "+longitude);
  var url = "https://api.schmuckli.net/fitbit_os/dublin_transport/near_locations.php?lat="+latitude+"&lon="+longitude;
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
            var url2 = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid="+data["results"][i]["id"]+"&format=json";
            //console.log(url2);
            fetch(url2)
            .then(function (response2) {
                response2.text()
                .then(function(data2) {
                  //console.log("Hallo:"+data2);
                  var data2 = JSON.parse(data2);
                  var data_response = {
                    name: data["results"][i]["name"],
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
            break;
          }
        }
      });
  })
  .catch(function (err) {
    console.log("Error fetching: " + err);
  });
}

function sendResponse(response){
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    console.log("Sending response");
    messaging.peerSocket.send(response);
  } else {
    console.log("Error: Connection is not open");
  }
}

messaging.peerSocket.onopen = function() {
  console.log("Socket open");
  geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if(evt.data.key=="changeStationDown"){
    index++;
    geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
  }else if(evt.data.key=="changeStationUp"){
    index--;
    geolocation.getCurrentPosition(getStations, locationError, GPSoptions);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}