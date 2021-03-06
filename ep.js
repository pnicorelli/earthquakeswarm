'use strict';

var EP = {
  'icons': [],
  'markers': [],
  'map': {},
  // init icons
  'colors': [
    '#d0ffad',
    '#fcffad',
    '#ffea5c',
    '#ff6868',
    '#ff0000',
    '#de10ab',
    '#3a0752',
    '#000000',
    '#000000',
    '#000000'
  ],

  'init': function(){
    $.get('info.html', function(html) {
      $('#messages').html(html)
      $('#messages').modal();
    });

    var self = this;

    $('input[name="daterange"]').daterangepicker({
      endDate: moment().format('MM/DD/YYYY'),
      startDate: moment().subtract(7, 'days').format('MM/DD/YYYY')
    });

    EP.resizeMap();
    EP.map = L.map('map').setView([42, 11], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    	maxZoom: 20,
    	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(EP.map);


    for(var i = 1; i<11; i++){
      $('#legend-list').append('<li><div class="m'+i+'"></div>from '+(i-1)+' to ' + i +' of magnitude</li>')
      var gradient = 10;
      var css = '.m' + i + ' {\
        width: ' + i*gradient + 'px !important;\
        height: ' + i*gradient + 'px !important;\
        background: ' + EP.colors.shift() + ';\
        opacity: 0.5;\
        filter: alpha(opacity=50);\
        -moz-border-radius: ' + i*(gradient/2) + 'px;\
        -webkit-border-radius: ' + i*(gradient/2) + 'px;\
        border-radius: ' + i*(gradient/2) + 'px;\
      }'
      $("<style>")
          .prop("type", "text/css")
          .html(css)
          .appendTo("head");
      EP.icons.push( L.divIcon({className: 'm'+i}) )
    }

    window.onresize = function(event) {
        EP.resizeMap();
    };
  },

  'resizeMap': function(){
    var top = $('#header').height() + $('#panel').height();
    $('#map').height((window.innerHeight - top)*.9);
  },

  'getData': function(){
    // var self = this;
    var dates = $('input[name="daterange"]').val().split(' - ').map(function(x){
      return (new Date(x)).toISOString().replace('.000Z', '');
    });
    EP.fromTime = new Date(dates[0]);
    EP.toTime = new Date(dates[1]);

    $('#panel').spin();
    var url = 'http://webservices.ingv.it/fdsnws/event/1/query?starttime='+dates[0]+'&endtime='+dates[1]+'&format=text';
    $.get(url, function(data, status){
      EP.processData( data );
    }).fail(function(jqXHR, textStatus, errorThrown) {
      $('#messages').html('<h4>Error retrieving data from service</h4><br><b>'+errorThrown.toString()+'</b>')
      $('#messages').modal();
    }).always(function(){
      $('#panel').spin(false)
    });
  },

  'processData': function(data){
    if(!data){
      $('#messages').html('<h4>Error<h4><br><b>no data</b>')
      $('#messages').modal();
    }
    EP.events = data.split('\n').map(function(row, index){
        return row.split('|')
    });
    EP.events.pop();
    $('#playerEvents').html(EP.events.length);
    $('#playerProgress').attr('max', EP.events.length);
    $('#playerProgress').val(0);
    EP.play();
  },

  'play': function(){
    var player = setTimeout(function(){
        EP.fromTime.setTime(EP.fromTime.getTime() + ($('#speed').val() *60*60*1000));
        console.log( EP.toTime - EP.fromTime)
        if( EP.toTime - EP.fromTime < 0 ){
          clearTimeout(player);
          return;
        }
        $('#playerDate').html( moment(EP.fromTime).format('MM/DD/YYYY HH:mm') )
        while(EP.events.length > 1){
          var currentEvent = EP.events[EP.events.length-1];
          // console.log( currentEvent )
          $('#playerProgress').val($('#playerProgress').val()+1);
          var curr = new Date(EP.events[EP.events.length-1][1]);
          if( curr < EP.fromTime ){

            var m = L.marker([currentEvent[2], currentEvent[3]], {icon: EP.icons[ parseInt(currentEvent[10])]})
                      .setZIndexOffset(parseInt(currentEvent[10])*10)
                      .addTo(EP.map);

            setTimeout(function(arg){
              EP.map.removeLayer(arg)
            }, 1000^(currentEvent[10]*10), m);

            EP.markers.push(m)
            EP.events.pop();
          } else {
            break;
          }
        }
        EP.play();
    }, 600);
  }
}
