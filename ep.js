'use strict';

var EP = {
  'markers': [],
  'map': {},
  'init': function(){
    var self = this;
    $('input[name="daterange"]').daterangepicker();
    EP.resizeMap();
    EP.map = L.map('map').setView([42, 11], 3);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(EP.map);

    // L.marker([51.5, -0.09]).addTo(map)
    //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    //     .openPopup();

    window.onresize = function(event) {
        EP.resizeMap();
    };
  },

  'resizeMap': function(){
    var top = $('#header').height() + $('#panel').height();
    $('#map').height(window.innerHeight- top);
  },

  'getData': function(){
    // var self = this;
    var dates = $('input[name="daterange"]').val().split(' - ').map(function(x){
      return (new Date(x)).toISOString().replace('.000Z', '');
    });
    EP.fromTime = new Date(dates[0]);
    EP.toTime = new Date(dates[1]);
    var url = 'http://webservices.ingv.it/fdsnws/event/1/query?starttime='+dates[0]+'&endtime='+dates[1]+'&format=text';
    $.get(url, function(data, status){
      if( status === 'success' ){
        EP.processData( data );
      }
    });
  },

  'processData': function(data){
    EP.events = data.split('\n').map(function(row, index){
        return row.split('|')
    });
    EP.events.pop();
    EP.play();
  },

  'play': function(){

    var player = setTimeout(function(){
      if( EP.markers.length > 0){
        for(var i = 0; i<EP.markers.length; i++)
        EP.map.removeLayer(EP.markers[i]);
      }
      EP.markers = [];
      if(EP.fromTime > EP.toTime || EP.events.length < 2){
        $('#playerDate').html( 'finish' )
        clearTimeout(player);
      } else {

        EP.fromTime.setTime(EP.fromTime.getTime() + ($('#speed').val() *60*60*1000));
        $('#playerDate').html( EP.fromTime.toString() )
        while(EP.events.length > 1){
          var curr = new Date(EP.events[EP.events.length-1][1]);
          if( curr < EP.fromTime ){
            var m = L.marker([EP.events[EP.events.length-1][2], EP.events[EP.events.length-1][3]]).addTo(EP.map)
            EP.markers.push(m)
            EP.events.pop();
          } else {
            break;
          }
        }
        EP.play();
      }
    }, 500);
  }
}
