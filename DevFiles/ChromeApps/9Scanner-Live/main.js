// PulsedLight 3d Scanner main.js
//------------------------------------------------------------------------------
// Contents:
// - Variables
// - Serial functions
// - Serial communications read loop
// - Button functions
// - 2D functions
// - 3D functions
// - Supporting functions
//
// Functions to modify:
// - Around line 340 starts the 3d init() function where the 3d geometry is
//	 drawn, edit this to tweak the 3d output.

// Variables
//------------------------------------------------------------------------------

Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}

//	This is the reload button on the connection screen, simply reloads the app
$('#reload_app').click(function() {
	chrome.runtime.reload();
});

const serial = chrome.serial; /* Interprets an ArrayBuffer as UTF-8 encoded string data. */
const storage = chrome.storage.local;
const DEVICE_KEY = 'serialDevice';

var ab2str = function(buf) {
		var bufView = new Uint8Array(buf);
		var encodedString = String.fromCharCode.apply(null, bufView);
		return decodeURIComponent(escape(encodedString));
	}; /* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
		var encodedString = unescape(encodeURIComponent(str));
		var bytes = new Uint8Array(encodedString.length);
		for (var i = 0; i < encodedString.length; ++i) {
			bytes[i] = encodedString.charCodeAt(i);
		}
		return bytes.buffer;
	};


var blob = '1,1';
var mode = 99;
var calibrateArray = [0,0,0,0,0,0,0,0,0];
var calibrateNow = 0;
// Serial functions
//------------------------------------------------------------------------------

var SerialConnection = function() {
		this.connectionId = -1;
		this.lineBuffer = "";
		this.boundOnReceive = this.onReceive.bind(this);
		this.boundOnReceiveError = this.onReceiveError.bind(this);
		this.onConnect = new chrome.Event();
		this.onReadLine = new chrome.Event();
		this.onError = new chrome.Event();
	};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
	if (!connectionInfo) {
		log("Connection failed.");
		return;
	}
	this.connectionId = connectionInfo.connectionId;
	serial.onReceive.addListener(this.boundOnReceive);
	serial.onReceiveError.addListener(this.boundOnReceiveError);
	this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function(receiveInfo) {
	if (receiveInfo.connectionId !== this.connectionId) {
		return;
	}
	this.lineBuffer += ab2str(receiveInfo.data);
	var index;
	while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
		var line = this.lineBuffer.substr(0, index + 1);
		this.onReadLine.dispatch(line);
		this.lineBuffer = this.lineBuffer.substr(index + 1);
	}
};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
	if (errorInfo.connectionId === this.connectionId) {
		this.onError.dispatch(errorInfo.error);
	}
};

SerialConnection.prototype.getDevices = function(callback) {
	serial.getDevices(callback);
};

SerialConnection.prototype.connect = function(path) {
	serial.connect(path, {
		bitrate: 115200
	}, this.onConnectComplete.bind(this));
};

SerialConnection.prototype.send = function(msg) {
	if (this.connectionId < 0) {
		throw 'Invalid connection';
	}
	serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
	if (this.connectionId < 0) {
		throw 'Invalid connection';
	}
};

var connection = new SerialConnection();

// Populate the list of available devices
connection.getDevices(function(ports) {
	// get drop-down port selector
	var dropDown = document.querySelector('#port_list');
	// clear existing options
	dropDown.innerHTML = "";
	// add new options
	ports.forEach(function(port) {
		var displayName = port.path;
		if (!displayName) displayName = port.path;
		var newOption = document.createElement("option");
		newOption.text = displayName;
		newOption.value = port.path;
		dropDown.appendChild(newOption);
	});
	storage.get(null, function(prefs) {
		if (prefs.lastDevice) {
			dropDown.value = prefs.lastDevice;
		}
	});
});

connection.onConnect.addListener(function() {
	// remove the connection drop-down
	document.querySelector('#connect_box').style.display = 'none';
	document.querySelector('#main_box').style.display = 'block';
	mode = 0;
});



// Serial communications read loop, Read all the data from the arduino
//------------------------------------------------------------------------------

function fuzzy(calibrateVal,testVal){
  var isUnique = 0;
  calibrateVal = calibrateVal - 15;
  if(testVal < calibrateVal){
    isUnique = 1;

  }
  return isUnique;

}
var disableCalibration = 1;
connection.onReadLine.addListener(function(line) {
	// What happens when we read?
	if(isNaN(line)){
	}else{

		var s0 =  parseInt(line.substring(0,4))-1000;
		var s1 =  parseInt(line.substring(4,8))-1000;
		var s2 =  parseInt(line.substring(8,12))-1000;
		var s3 =  parseInt(line.substring(12,16))-1000;
		var s4 =  parseInt(line.substring(16,20))-1000;
		var s5 =  parseInt(line.substring(20,24))-1000;
		var s6 =  parseInt(line.substring(24,28))-1000;
		var s7 =  parseInt(line.substring(28,32))-1000;
		var s8 =  parseInt(line.substring(32,36))-1000;
		//console.log(s0 + ", " + s1 + ", " + s2 + ", " + s3 + ", " + s4 + ", " + s5 + ", " + s6 + ", " + s7 + ", " + s8);
    var tempArray = [s0,s1,s2,s3,s4,s5,s6,s7,s8];
    if(calibrateNow){
      calibrateArray = tempArray;
      calibrateNow = 0;
      $('.calibrate').css("backgroundColor","#ff0000");
    }else{
      // if(disableCalibration || fuzzy(calibrateArray[0],s0) || fuzzy(calibrateArray[0],s1) || fuzzy(calibrateArray[0],s2) || fuzzy(calibrateArray[0],s3) || fuzzy(calibrateArray[0],s4) || fuzzy(calibrateArray[0],s5) || fuzzy(calibrateArray[0],s6) || fuzzy(calibrateArray[0],s7) || fuzzy(calibrateArray[0],s8)){
      //   myArray2.unshift(tempArray);
    	// 	myArray2.length = resolution;
      // }
      myArray.unshift(tempArray);
      myArray.length = resolution;
    }
		//console.log(myArray[0]);
	}
});

var myArray = [
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0]
];

var myArray2 = [
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0]
];

var myArray3 = [
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0]
];
// Button functions
//------------------------------------------------------------------------------

//	This is the reload button on the connection screen, simply reloads the app
$('.reload_app').click(function() {
	chrome.runtime.reload();
});

$('.pathMode').click(function() {
	mode = 3;
  two.clear();
});
$('.pathMode2').click(function() {
	mode = 4;
  two.clear();
});
$('.areaMode').click(function() {
	mode = 1;
  two.clear();
});

$('.areaMode2').click(function() {
	mode = 2;
  two.clear();
});

$('.scrollMode').click(function() {
	mode = 0;
  two.clear();
});

$('.calibrate').click(function(){
  calibrateNow = 1;
});

$('.disableCalibration').click(function(){
  if(disableCalibration){
    disableCalibration = 0;
    $('.disableCalibration').html("Disable Calibration");
  }else{
    disableCalibration = 1;
    $('.disableCalibration').html("Enable Calibration");
  }
});
// Handle the 'Connect' button
document.querySelector('#connect_button').addEventListener('click', function() {
	// get the device to connect to
	var dropDown = document.querySelector('#port_list');
	devicePath = dropDown.options[dropDown.selectedIndex].value;
	storage.set({
		lastDevice: devicePath
	});
	// connect
	connection.connect(devicePath);
});




$('#exportCSV').click(function() {
	// To add a header row to CSV append the header to the being of
	// the "blob" variable
	var config = {
		type: 'saveFile',
		suggestedName: event.timeStamp + '.csv'
	};
	chrome.fileSystem.chooseEntry(config, function(writableEntry) {
		var blobSave = new Blob([blob], {
			type: 'text/plain'
		});
		writeFileEntry(writableEntry, blobSave, function(e) {});
	});
});

$('#exportPNG').click(function() {
	var canvas = two.renderer.domElement;
	var dataURL = canvas.toDataURL('image/png');
	var img = '<img src="' + dataURL + '">';
	// d3.select("#img").html(img);
	$('#imgBox').prepend(img);
	var config = {
		type: 'saveFile',
		suggestedName: event.timeStamp + '.png'
	};
	chrome.fileSystem.chooseEntry(config, function(writableEntry) {
		// var blobSave = new Blob([dataURL], {type: "image/png"});
		writeFileEntry(writableEntry, dataURLToBlob(dataURL), function(e) {});
	});
	// window.open(canvas.toDataURL("image/png"));
});



// 2D functions
//------------------------------------------------------------------------------

// Keep the 2D view updated as we

var elem = document.getElementById('container');
var params = {
	type: Two.Types.canvas,
	width: window.innerWidth,
	height: window.innerHeight
};
var two = new Two(params).appendTo(elem);



var globalCounter = 0

var myArrayLength = 100;
var totalNumberOfSensors = 9;
// myArray.length = myArrayLength;


// interval(function() {
//   var countUntil = globalCounter + 20;
//   var array = CSVToArray(blob);
//   var localCounter = 0
//   var didPrint = false;
//   array.forEach(function(entry) {
//     if(localCounter >= globalCounter && localCounter < countUntil){
//       myArray.unshift(entry);
//       didPrint = true;
//       globalCounter++;
//     }
//     localCounter++;
//   });
//   if(!didPrint){
//     globalCounter = 0;
//   }
//   console.log(globalCounter);
// }, 10, 9999999999);


function makeScrollRectangle(sensorNum, positionNum, distanceVal){
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var sizeWidth = windowWidth/100;
  var sizeHeight = windowHeight/9;
  var rect = two.makeRectangle(positionNum*sizeWidth, sensorNum*sizeHeight, sizeWidth,sizeHeight);
  var colorValue = parseInt(distanceVal);
  colorValue = colorValue.toString(16);
  if (colorValue.length == 2) {
    colorValue = "0000" + colorValue;
  } else if (colorValue.length == 3) {
    colorValue = "000" + colorValue;
  } else if (colorValue.length == 4) {
    colorValue = "00" + colorValue;
  } else if (colorValue.length == 5) {
    colorValue = 0 + colorValue;
  } else if (colorValue.length == 1) {
    colorValue = "00000" + colorValue;
  }
  var theColorString = "#" + colorValue;
  rect.fill = theColorString;
  rect.opacity = 1.00;
  rect.noStroke();

}

var originX = 300;
var originY = 0;

function makeRadialAreaRectangle(sensorNum, positionNum, distanceVal, angle){
  var x = Math.sin(angle)*distanceVal;
  var y = Math.cos(angle)*distanceVal;

  var rect = two.makeRectangle(x+originX, y+originY, 4,4);
  var theColorString = "#0000ff";
  rect.fill = theColorString;
  rect.opacity = 1.00/(positionNum+1);
  rect.noStroke();
}

function makeAreaRectangle(sensorNum, positionNum, distanceVal, angle){

  var windowWidth = window.innerWidth;
  var rect = two.makeRectangle((sensorNum*(windowWidth/9)), originY+(distanceVal*2), windowWidth/9,2);
  if(disableCalibration || fuzzy(calibrateArray[sensorNum],distanceVal)){
    var theColorString = "#0000ff";
  }else{
    var theColorString = "#ff0000";
  }

  rect.fill = theColorString;
  rect.opacity = 1.00/(positionNum+1);
  rect.noStroke();
}

function makePath(s0,s1,s2,s3,s4,s5,s6,s7,s8,positionNum){
  var ww = window.innerWidth;
  var curve = two.makeCurve(
      (0*(ww/9))+30, s0*2,
      (1*(ww/9))+30, s1*2,
      (2*(ww/9))+30, s2*2,
      (3*(ww/9))+30, s3*2,
      (4*(ww/9))+30, s4*2,
      (5*(ww/9))+30, s5*2,
      (6*(ww/9))+30, s6*2,
      (7*(ww/9))+30, s7*2,
      (8*(ww/9))+30, s8*2,true);
  curve.linewidth = 2;
  curve.scale = 1.00;
  if(disableCalibration || fuzzy(calibrateArray[0],s0) || fuzzy(calibrateArray[0],s1) || fuzzy(calibrateArray[0],s2) || fuzzy(calibrateArray[0],s3) || fuzzy(calibrateArray[0],s4) || fuzzy(calibrateArray[0],s5) || fuzzy(calibrateArray[0],s6) || fuzzy(calibrateArray[0],s7) || fuzzy(calibrateArray[0],s8)){
    curve.stroke = "#0000ff";
  }else{
    curve.stroke = "#ff0000";
  }
  curve.opacity = 1.00/(positionNum + 1);

  //curve.noFill();
}
var positionCounter = 0;
var resolution = 20;
var countUntil = resolution;
var playBackSpeed = 30;
var mouseDown = 0;
interval2(function() {
	if(mode != 99){
		two.clear();
	  params = {
	  	type: Two.Types.canvas,
	  	fullscreen: true
	  };
	  positionCounter = 0;
	  var blockSize = 30;
		countUntil = resolution;
	}
  if(mode == 3){
    makePath(myArray[0][0],myArray[0][1],myArray[0][2],myArray[0][3],myArray[0][4],myArray[0][5],myArray[0][6],myArray[0][7],myArray[0][8],0);
  }
  if(mode == 2){
    makeAreaRectangle(0,positionCounter, myArray[positionCounter][0], 0);
    makeAreaRectangle(1,positionCounter, myArray[positionCounter][1], 0.05);
    makeAreaRectangle(2,positionCounter, myArray[positionCounter][2], 0.10);
    makeAreaRectangle(3,positionCounter, myArray[positionCounter][3], 0.15);
    makeAreaRectangle(4,positionCounter, myArray[positionCounter][4], 0.20);
    makeAreaRectangle(5,positionCounter, myArray[positionCounter][5], 0.25);
    makeAreaRectangle(6,positionCounter, myArray[positionCounter][6], 0.30);
    makeAreaRectangle(7,positionCounter, myArray[positionCounter][7], 0.35);
    makeAreaRectangle(8,positionCounter, myArray[positionCounter][8], 0.40);
  }

	while(mode != 99 && mode != 2 && positionCounter < countUntil){
    if(mode == 0){
      makeScrollRectangle(0,positionCounter, myArray[positionCounter][0]);
      makeScrollRectangle(1,positionCounter, myArray[positionCounter][1]);
      makeScrollRectangle(2,positionCounter, myArray[positionCounter][2]);
      makeScrollRectangle(3,positionCounter, myArray[positionCounter][3]);
      makeScrollRectangle(4,positionCounter, myArray[positionCounter][4]);
      makeScrollRectangle(5,positionCounter, myArray[positionCounter][5]);
      makeScrollRectangle(6,positionCounter, myArray[positionCounter][6]);
      makeScrollRectangle(7,positionCounter, myArray[positionCounter][7]);
      makeScrollRectangle(8,positionCounter, myArray[positionCounter][8]);

    }else if(mode == 1){
      makeAreaRectangle(0,positionCounter, myArray[positionCounter][0], 0);
      makeAreaRectangle(1,positionCounter, myArray[positionCounter][1], 0.05);
      makeAreaRectangle(2,positionCounter, myArray[positionCounter][2], 0.10);
      makeAreaRectangle(3,positionCounter, myArray[positionCounter][3], 0.15);
      makeAreaRectangle(4,positionCounter, myArray[positionCounter][4], 0.20);
      makeAreaRectangle(5,positionCounter, myArray[positionCounter][5], 0.25);
      makeAreaRectangle(6,positionCounter, myArray[positionCounter][6], 0.30);
      makeAreaRectangle(7,positionCounter, myArray[positionCounter][7], 0.35);
      makeAreaRectangle(8,positionCounter, myArray[positionCounter][8], 0.40);
    }else if(mode == 4){
      makePath(myArray[positionCounter][0],myArray[positionCounter][1],myArray[positionCounter][2],myArray[positionCounter][3],myArray[positionCounter][4],myArray[positionCounter][5],myArray[positionCounter][6],myArray[positionCounter][7],myArray[positionCounter][8],positionCounter);
    }else if(mode == 37){
			// GPS, Accel and Gyro
			// Essentially, the GPS, Lat Lon views load two data sets and then there's a slider to offset from the timestamps.
			// Gyro measure radians per second
			// Accelerometer: The accelerometer measures the sum of two acceleration vectors: gravity and user acceleration. User acceleration is the acceleration that the user imparts to the device.
				// https://developer.apple.com/library/ios/documentation/CoreMotion/Reference/CMDeviceMotion_Class/index.html#//apple_ref/occ/cl/CMDeviceMotion
			// Consider tweaking the update interval: https://developer.apple.com/library/ios/documentation/EventHandling/Conceptual/EventHandlingiPhoneOS/motion_event_basics/motion_event_basics.html

		}else if(mode == 6){
			// Maps Mode
			// https://developers.google.com/maps/documentation/javascript/examples/circle-simple
		}

		positionCounter++;


	}

	two.update();
});




// Supporting functions
//------------------------------------------------------------------------------

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
var ab2str = function(buf) {
		var bufView = new Uint8Array(buf);
		var encodedString = String.fromCharCode.apply(null, bufView);
		return decodeURIComponent(escape(encodedString));
	}; /* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */

var str2ab = function(str) {
		var encodedString = unescape(encodeURIComponent(str));
		var bytes = new Uint8Array(encodedString.length);
		for (var i = 0; i < encodedString.length; ++i) {
			bytes[i] = encodedString.charCodeAt(i);
		}
		return bytes.buffer;
	};

function interval2(func) {
	var interv = function() {
			return function() {

					setTimeout(interv, playBackSpeed);
					try {
						func.call(null);
					} catch (e) {

						throw e.toString();
					}

			};
		}(playBackSpeed);
	setTimeout(interv, playBackSpeed);
};

function interval(func, wait, times) {
	var interv = function(w, t) {
			return function() {
				if (typeof t === "undefined" || t-- > 0) {
					setTimeout(interv, w);
					try {
						func.call(null);
					} catch (e) {
						t = 0;
						throw e.toString();
					}
				}
			};
		}(wait, times);
	setTimeout(interv, wait);
};

/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
Updated: Joe Marini (joemarini@google.com)
*/

var chosenEntry = null;
var saveFileButton = document.querySelector('#save_file');

function errorHandler(e) {
	console.error(e);
}

function displayEntryData(theEntry) {
	if (theEntry.isFile) {
		chrome.fileSystem.getDisplayPath(theEntry, function(path) {
			document.querySelector('#file_path').value = path;
		});
		theEntry.getMetadata(function(data) {
			document.querySelector('#file_size').textContent = data.size;
		});
	} else {
		document.querySelector('#file_path').value = theEntry.fullPath;
		document.querySelector('#file_size').textContent = "N/A";
	}
}

function readAsText(fileEntry, callback) {
	fileEntry.file(function(file) {
		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onload = function(e) {
			callback(e.target.result);
		};
		reader.readAsText(file);
	});
}

function writeFileEntry(writableEntry, opt_blob, callback) {
	if (!writableEntry) {
		output.textContent = 'Nothing selected.';
		return;
	}
	writableEntry.createWriter(function(writer) {
		writer.onerror = errorHandler;
		writer.onwriteend = callback;
		// If we have data, write it to the file. Otherwise, just use the file we
		// loaded.
		if (opt_blob) {
			writer.truncate(opt_blob.size);
			waitForIO(writer, function() {
				writer.seek(0);
				writer.write(opt_blob);
			});
		} else {
			chosenEntry.file(function(file) {
				writer.truncate(file.fileSize);
				waitForIO(writer, function() {
					writer.seek(0);
					writer.write(file);
				});
			});
		}
	}, errorHandler);
}

function waitForIO(writer, callback) {
	// set a watchdog to avoid eventual locking:
	var start = Date.now();
	// wait for a few seconds
	var reentrant = function() {
			if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
				setTimeout(reentrant, 100);
				return;
			}
			if (writer.readyState === writer.WRITING) {
				console.error("Write operation taking too long, aborting!" + " (current writer readyState is " + writer.readyState + ")");
				writer.abort();
			} else {
				callback();
			}
		};
	setTimeout(reentrant, 100);
}
// for files, read the text content into the textarea

function loadFileEntry(_chosenEntry) {
	chosenEntry = _chosenEntry;
	chosenEntry.file(function(file) {
		readAsText(chosenEntry, function(result) {
			textarea.value = result;
		});
		// Update display.
		saveFileButton.disabled = false; // allow the user to save the content
		displayEntryData(chosenEntry);
	});
}
// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button

function loadDirEntry(_chosenEntry) {
	chosenEntry = _chosenEntry;
	if (chosenEntry.isDirectory) {
		var dirReader = chosenEntry.createReader();
		var entries = [];
		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
				dirReader.readEntries(function(results) {
					if (!results.length) {
						textarea.value = entries.join("\n");
						saveFileButton.disabled = true; // don't allow saving of the list
						displayEntryData(chosenEntry);
					} else {
						results.forEach(function(item) {
							entries = entries.concat(item.fullPath);
						});
						readEntries();
					}
				}, errorHandler);
			};
		readEntries(); // Start reading dirs.
	}
}

function loadInitialFile(launchData) {
	if (launchData && launchData.items && launchData.items[0]) {
		loadFileEntry(launchData.items[0].entry);
	} else {
		// see if the app retained access to an earlier file or directory
		chrome.storage.local.get('chosenFile', function(items) {
			if (items.chosenFile) {
				// if an entry was retained earlier, see if it can be restored
				chrome.fileSystem.isRestorable(items.chosenFile, function(bIsRestorable) {
					// the entry is still there, load the content
					console.info("Restoring " + items.chosenFile);
					chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
						if (chosenEntry) {
							chosenEntry.isFile ? loadFileEntry(chosenEntry) : loadDirEntry(chosenEntry);
						}
					});
				});
			}
		});
	}
}


function binaryblob() {
	var byteString = atob(document.querySelector("canvas").toDataURL().replace(/^data:image\/(png|jpg);base64,/, ""));
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	var dataView = new DataView(ab);
	var blobX = new Blob([dataView], {
		type: "image/png"
	});
	var DOMURL = self.URL || self.webkitURL || self;
	var newurl = DOMURL.createObjectURL(blobX);
	var config = {
		type: 'saveFile',
		suggestedName: event.timeStamp + '.png'
	};
	chrome.fileSystem.chooseEntry(config, function(writableEntry) {
		var blobSave = new Blob([dataView], {
			type: "image/png"
		});
		writeFileEntry(writableEntry, blobSave, function(e) {});
	});
}

function dataURLToBlob(dataURL) {
	var BASE64_MARKER = ';base64,';
	if (dataURL.indexOf(BASE64_MARKER) == -1) {
		var parts = dataURL.split(',');
		var contentType = parts[0].split(':')[1];
		var raw = decodeURIComponent(parts[1]);
		return new Blob([raw], {
			type: contentType
		});
	}
	var parts = dataURL.split(BASE64_MARKER);
	var contentType = parts[0].split(':')[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;
	var uInt8Array = new Uint8Array(rawLength);
	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}
	return new Blob([uInt8Array], {
		type: contentType
	});
}


function CSVToArray(strData, strDelimiter) {
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");
	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp((
	// Delimiters.
	"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
	// Quoted fields.
	"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
	// Standard fields.
	"([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [
		[]
	];
	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;
	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec(strData)) {
		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[1];
		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
		strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push([]);
		}
		var strMatchedValue;
		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[2]) {
			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[2].replace(
			new RegExp("\"\"", "g"), "\"");
		} else {
			// We found a non-quoted value.
			strMatchedValue = arrMatches[3];
		}
		// Now that we have our value string, let's add
		// it to the data array.
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	// Return the parsed data.
	return (arrData);
}
