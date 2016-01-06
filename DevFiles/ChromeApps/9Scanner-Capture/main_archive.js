Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}
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



////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

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
	//   serial.connect(path, this.onConnectComplete.bind(this))
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

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var sensorBox = false;
var mainBox = false;
var calibrateLeft;
var calibrateRight;
var scalerValue = 1;
var positionValue = 0;


var connection = new SerialConnection();
connection.onConnect.addListener(function() {
	// remove the connection drop-down
	document.querySelector('#connect_box').style.display = 'none';
	document.querySelector('#main_box').style.display = 'block';
	sensorBox == true;





});


var distanceValue;
var updateCounter = 0;
var points = new Array();
points[0] = [4,5,6];

var scaler = 0.5;
var minRange = 0;
var maxRange = 0;
var rangeFactor = 0;
var azimuthInt = 0;
var elevationInt = 0;
var distanceInt = 0;
var azimuthStepsInt = 0;
var elevationStepsInt = 0;




connection.onReadLine.addListener(function(line) {
	distanceValue = line;
//console.log(line);
document.getElementById("serialComm").innerHTML = line;
  var piece = [];

  if(line.substring(0,1) == "c"){
    minRange = parseInt(line.substring(1));

  }else if(line.substring(0,1) == "C"){
    maxRange = parseInt(line.substring(1));
    rangeFactor = (maxRange-minRange)/4;
    maxDistance.value = maxRange+rangeFactor;
    minDistance.value = minRange-rangeFactor;
	}else{
    azimuthInt = 4000 - parseInt(line.substring(0,4))-1000;
    elevationInt = parseInt(line.substring(4,8))-1000;
    distanceInt = parseInt(line.substring(8,13))-10000;
    azimuthStepsInt = parseInt(line.substring(13,16))-100;
    elevationStepsInt = parseInt(line.substring(16))-100;

    console.log(azimuthInt + ", " + elevationInt+ ", " +distanceInt+ ", " +  azimuthStepsInt+ ", " + elevationStepsInt);
    piece = [azimuthInt, elevationInt,distanceInt,  azimuthStepsInt, elevationStepsInt];
		points.push(piece);
    var rect = two.makeRectangle(piece[0]-xOffset.value,piece[1]-yOffset.value,piece[3],piece[4]);
    var colorValue = parseInt(piece[2]);
    colorValue = 255-parseInt(colorValue.map(minRange,maxRange,0,255));
    //console.log("ColorValue: " + colorValue);
    var theColorString = "rgb(" + colorValue + "," + colorValue + "," + colorValue + ")";
    rect.fill = theColorString;
    rect.opacity = 1.00;
    rect.noStroke();
    two.update();
	}


});


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
// Handle the 'Connect' button
document.querySelector('#connect_button').addEventListener('click', function() {
	// get the device to connect to
	var dropDown = document.querySelector('#port_list');
	devicePath = dropDown.options[dropDown.selectedIndex].value;

	storage.set({lastDevice: devicePath});

	// connect
	connection.connect(devicePath);
});


scanBtn.onclick = function(){
	var theString = "g " + sensor.value + " " + azSteps.value + " " + azStart.value + " " + azEnd.value + " " + azDelay.value + " " + elSteps.value + " " + elStart.value + " " + elEnd.value + " " + elDelay.value + "\n";
	console.log(theString);
	connection.send(theString);

}

cancelBtn.onclick = function(){
	connection.send('X\n');
	// Make an instance of two and place it on the page.

}

clearPtsBtn.onclick = function(){
	points.length = 0;
	two.clear();
}

graph3dBtn.onclick = function(){
    $('#container2').show();
    $('#container').hide();
		var container = document.getElementById( 'container2' ),
			containerWidth, containerHeight,
			renderer,
			scene,
			camera,
			cubes,
			geom,
			range = 500,
			mouseVector,
			axes,
			controls;

		if( window.parent != window ) {
			var h1 = document.querySelector( 'h1' );
			h1.parentNode.removeChild( h1 );
		}

		containerWidth = container.clientWidth;
		containerHeight = container.clientHeight;

		// Set up renderer, scene and camera
		renderer = new THREE.CanvasRenderer();
		renderer.setSize( containerWidth, containerHeight );
		container.appendChild( renderer.domElement );

		renderer.setClearColorHex( 0xffffff, 1.0 );

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera( 45, containerWidth / containerHeight, 1, 10000 );
		camera.position.set( 0, 0, range );
		camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

		// Add some cubes to the scene
		geom = new THREE.CubeGeometry(1, 1, 1 );

		cubes = new THREE.Object3D();
		scene.add( cubes );

		// for(var i = 0; i < 100; i++ ) {
		// 	var grayness = Math.random() * 0.5 + 0.25,
		// 		mat = new THREE.MeshBasicMaterial(),
		// 		cube = new THREE.Mesh( geom, mat );
		// 	mat.color.setRGB( grayness, grayness, grayness );
		// 	cube.position.set( range * (0.5 - Math.random()), range * (0.5 - Math.random()), range * (0.5 - Math.random()) );
		// 	cube.rotation.set( Math.random(), Math.random(), Math.random() ).multiplyScalar( 2 * Math.PI );
		// 	cube.grayness = grayness;
		// 	cubes.add( cube );
		// }

    var azShiftHigh = 0;
    var azShiftLow = 100000;
    var elShiftHigh = 0;
    var elShiftLow = 100000;
    var distShiftHigh = 0;
    var distShiftLow = 100000;

    points.forEach(function(entry) {
        if(azShiftHigh < entry[0]){
          azShiftHigh = entry[0];
        }
        if(azShiftLow > entry[0]){
          azShiftLow = entry[0];
        }

        if(elShiftHigh < entry[1]){
          elShiftHigh = entry[1];
        }
        if(elShiftLow > entry[1]){
          elShiftLow = entry[1];
        }

        if(distShiftHigh < entry[2]){
          distShiftHigh = entry[2];
        }
        if(distShiftLow > entry[2]){
          distShiftLow = entry[2];
        }

    });

      var distShift = 0;
      var azShift = 0;
      var elShift = 0;

      distShift = distShiftHigh/distShiftLow;
      azShift = azShiftHigh/azShiftLow;
      elShift = elShiftHigh/elShiftLow;

			points.forEach(function(entry) {
				var grayness = Math.random() * 0.5 + 0.25,
					mat = new THREE.MeshBasicMaterial(),
					cube = new THREE.Mesh( geom, mat );
          // geom = new THREE.CubeGeometry(entry[3], entry[4], entry[4]);
				mat.color.setRGB( grayness, grayness, grayness );
				cube.position.set( entry[0].map(azShiftLow,azShiftHigh,-azShift/2,azShift/2),entry[1].map(elShiftLow,elShiftHigh,elShift/2,-elShift/2),entry[2].map(distShiftLow,distShiftHigh,-distShift/2,distShift/2));
				cube.grayness = grayness;
				cubes.add( cube );
			});

		//cube.rotation.set( Math.random(), Math.random(), Math.random() ).multiplyScalar( 2 * Math.PI );


		// Axes
		axes = buildAxes();
		scene.add( axes );

		// Picking stuff

		projector = new THREE.Projector();
		mouseVector = new THREE.Vector3();

		// User interaction
		window.addEventListener( 'mousemove', onMouseMove, false );
		window.addEventListener( 'resize', onWindowResize, false );

		controls = new THREE.TrackballControls( camera );
		controls.zoomSpeed = 0.1;

		// And go!
		animate();


		function onMouseMove( e ) {

			mouseVector.x = 2 * (e.clientX / containerWidth) - 1;
			mouseVector.y = 1 - 2 * ( e.clientY / containerHeight );

			var raycaster = projector.pickingRay( mouseVector.clone(), camera ),
				intersects = raycaster.intersectObjects( cubes.children );

			cubes.children.forEach(function( cube ) {
				cube.material.color.setRGB( cube.grayness, cube.grayness, cube.grayness );
			});


			for( var i = 0; i < intersects.length; i++ ) {
				var intersection = intersects[ i ],
					obj = intersection.object;

				obj.material.color.setRGB( 1.0 - i / intersects.length, 0, 0 );
			}


		}

		function onWindowResize( e ) {
			containerWidth = container.clientWidth;
			containerHeight = container.clientHeight;
			renderer.setSize( containerWidth, containerHeight );
			camera.aspect = containerWidth / containerHeight;
			camera.updateProjectionMatrix();
		}

		function animate() {
			requestAnimationFrame( animate );
			controls.update();
			renderer.render( scene, camera );
		}


		// http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
		function buildAxes() {
			var axes = new THREE.Object3D();

			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 100, 0, 0 ), 0xFF0000, false ) ); // +X
			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -100, 0, 0 ), 0x800000, true) ); // -X
			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 100, 0 ), 0x00FF00, false ) ); // +Y
			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -100, 0 ), 0x008000, true ) ); // -Y
			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 100 ), 0x0000FF, false ) ); // +Z
			axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -100 ), 0x000080, true ) ); // -Z

			return axes;

		}

		function buildAxis( src, dst, colorHex, dashed ) {
			var geom = new THREE.Geometry(),
				mat;

			if(dashed) {
				mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: 5, gapSize: 5 });
			} else {
				mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
			}

			geom.vertices.push( src.clone() );
			geom.vertices.push( dst.clone() );

			var axis = new THREE.Line( geom, mat );

			return axis;

		}
}

graph2dBtn.onclick = function(){
  $('#container').show();
  $('#container2').hide();
	graph2dPoints(points);
}

var elem = document.getElementById('container');
var params = { width: 2000, height: 2000 };
var two = new Two(params).appendTo(elem);

function graph2dPoints(myArray){



		// two has convenience methods to create shapes.
		//var circle = two.makeCircle(72, 100, 50);
		var myMinDistance = 10000;
		var myMaxDistance = 0;
		myArray.forEach(function(entry) {
			var testValue = parseInt(entry[2]);
			if(testValue < myMinDistance){
				myMinDistance = testValue;
			}
			if(testValue > myMaxDistance){
				myMaxDistance = testValue;
			}
		});

		console.log(minDistance + ", WOO,  " + maxDistance);

		myArray.forEach(function(entry) {
			var rect = two.makeRectangle(entry[0]-500,entry[1]-500,scaler*entry[3],scaler*entry[4]);
			var colorValue = parseInt(entry[2]);
			colorValue = 255-parseInt(colorValue.map(myMinDistance,myMaxDistance,0,255));
			//console.log("ColorValue: " + colorValue);
			var theColorString = "rgb(" + colorValue + "," + colorValue + "," + colorValue + ")";
			rect.fill = theColorString;
			rect.opacity = 1.00;
			rect.noStroke();
			two.update();
		});


}

/*
clearCanvas.onclick = function(){
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect( 0 , 0 , 900,900);
	ctx.fill();
};
*/

// two_0.onclick = function(){
//   document.getElementById("serialComm").innerHTML = "WOO";
// }
// $("#container").click(function(){
//       var myClientRect = this.getBBox();
//       document.getElementById("pathPosition").innerHTML= parseInt(myClientRect['x']) + ", " + parseInt(myClientRect['y']);
//       document.getElementById("serialComm").innerHTML = line;
//     });


// function svgHover(){ //svgHover is a method of a generic object
//   //var hotspotObject =this; //hotspotObject is storing the current object as a variable
// var myThis = jQuery(this);
// var myThisId = myThis.attr('id');
//   myThis.hover( //hotspotSvg is simply $('#path_' +this.name);
//     function() {
//       console.log(myThis.attr('id'));
//       //var myClientRect = $(this).getBBox();
//       document.getElementById("pathPosition").innerHTML= myThis.attr('id');
//     },
//     function() {
//
//     }
// ).click(function() {
//   console.log('You clicked me');
// });
//
// };
//
// svgHover();

$('#zoomIn').click(function(){
  var zoom = parseInt($('#container').css('zoom')) + 1;
  $('#container').css('zoom',zoom);
  console.log(zoom);
});

$('#zoomOut').click(function(){
  var zoom = parseInt($('#container').css('zoom')) - 1;
  if(zoom < 1){
    zoom = 1;
  }
  $('#container').css('zoom',zoom);
});

document.onmouseover = function(e) {
    var targ;
    if (!e) var e = window.event;
    if (e.target) targ = e.target;
    else if (e.srcElement) targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
        if(typeof(targ.transform) != "undefined"){
          document.getElementById("pathPosition").innerHTML= (2000 - targ.transform.animVal.getItem(0).matrix.e) + ", " + targ.transform.animVal.getItem(0).matrix.f;
          $('#container').mousedown(function(){
            $('#azEnd').val(2000 - targ.transform.animVal.getItem(0).matrix.e);
            $('#elStart').val(targ.transform.animVal.getItem(0).matrix.f);
          });

          $('#container').mouseup(function(){
            $('#azStart').val(2000 - targ.transform.animVal.getItem(0).matrix.e);
            $('#elEnd').val(targ.transform.animVal.getItem(0).matrix.f);
          });

    }
}
