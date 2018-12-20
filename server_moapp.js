var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var date_utils = require('date-utils');

var settingInfo = new Object();
var windowState = 3;//2:open, 3:close
var rainState = 1 // 0:On
var aircleanerState = 5;//4:on, 5:off
var humidifierState = 7;//6:on, 7:off
var fireState =0;
var buf="";
var curDate = new Date();
var count = 30;
var cntId = 0;
var info_num=0;

var stateInfo = new Object();

var dustInfo=new Object();
settingInfo.dustLimit = 1000000;

var SerialPort = require('serialport'), 
    portName = 'COM5',//포트 번호 확인 후 추가
    port = new SerialPort(portName),
    SerialPort = 0;

port.on('open', function(){
  console.log('Serial Port OPEN');
  port.on('data', function(data){
      buf += data.toString();
      if(buf[buf.length-1] == 'E'){
          console.log(buf);
          var splitBuf = buf.split(':');
          dustInfo.dust = parseInt(splitBuf[0]);
          dustInfo.temperature = parseInt(splitBuf[1]);
          dustInfo.humidity = parseInt(splitBuf[2]); 
          fireState = parseInt(splitBuf[3]);
          dustInfo.rain = parseInt(splitBuf[4]);
          buf="";
    //아두이노 연결시 계속 정보 수신 및 저장
      }
  });
});

io.on('connection', function(socket){
  console.log('user connection.');

  socket.on('dustMeasure',function(data){//미세먼지 측정 및 정보전달
 	console.log('dustMeasure request');
	
	if(dustInfo!=null){
      dustInfo.windowState = windowState;
      dustInfo.dustLimit = settingInfo.dustLimit;
      //수정
      socket.emit('dustInfo',dustInfo);
    }
    else{console.log('dustInfo does not have anything');}
  })

    socket.on('stateAlert',function(data){
        stateInfo.windowState = windowState;
        stateInfo.humidifierState = humidifierState;
        stateInfo.aircleanerState = aircleanerState;
        console.log(stateInfo);
      socket.emit('stateInfo',stateInfo);//수정부분
    })

    socket.on('windowOpen', function(data){
      console.log('Request of window control : open');
      windowState = 2;
      port.write('2');
    })

    socket.on('windowClose', function(data){
        windowState=3;
        console.log('Request of window control : close');
        port.write('3');
    })

    socket.on('aircleanerOn', function(data){
        console.log('Request of air control : open');
        aircleanerState = 4;
        port.write('4');
    })

    socket.on('aircleanerOff', function(data){
        aircleanerState=5;
        console.log('Request of air control : close');
        port.write('5');
    })

    socket.on('humidifierOn', function(data){
        console.log('Request of humidifier control : open');
        humidifierState = 6;   
        port.write('6');
    })

    socket.on('humidifierOff', function(data){
        humidifierState=7;
        console.log('Request of humidifier control : close');
        port.write('7');
    })

    socket.on('setInfo',function(data){
    
        settingInfo.dustLimit = data.dustLimit;
        console.log('set value: ',settingInfo.dustLimit);
        console.log('dustInfo : ',dustInfo.dust);

        if(settingInfo.dustLimit<dustInfo.dust){
          port.write('3');
        }
    })

    socket.on('fireAlert',function(){
      if(fireState == 1){
        socket.emit('fireAlert');
      }
    })

    socket.on('rainControl',function(data){
     if(rainState==0){
        if(dustInfo.rain >30){
          socket.emit('rainControl');
          port.write('3');
        }
      }
    })

    socket.on('disconnect',function(){
      console.log('disconnection');
    })
});

app.get('/', function(req, res){
  console.log("get success");
});

http.listen(3000, function(){  
  console.log('3000 port listening');
});
