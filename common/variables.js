export function getURLStationNames(lat, lon){
  return "https://api.schmuckli.net/fitbit_os/dublin_transport/near_locations.php?lat="+lat+"&lon="+lon;
}

export function getURLStationDetails(id){
  return "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid="+id+"&format=json";
}