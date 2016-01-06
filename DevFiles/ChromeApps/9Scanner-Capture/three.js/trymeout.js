function trymeout2(){

  	var container = document.getElementById( 'container' ),
  		containerWidth, containerHeight,
  		renderer,
  		scene,
  		camera,
  		cubes,
  		geom,
  		range = 50,
  		mouseVector,
  		axes,
  		controls;

  	containerWidth = container.clientWidth;
  	containerHeight = container.clientHeight;

  	// Set up renderer, scene and camera
  	renderer = new THREE.CanvasRenderer();
  	renderer.setSize( containerWidth, containerHeight );
  	container.appendChild( renderer.domElement );

  	renderer.setClearColorHex( 0xeeeedd, 1.0 );

  	scene = new THREE.Scene();

  	camera = new THREE.PerspectiveCamera( 45, containerWidth / containerHeight, 1, 10000 );
  	camera.position.set( 0, 0, range * 2 );
  	camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

  	// Add some cubes to the scene
  	geom = new THREE.CubeGeometry( 5, 5, 5 );

  	cubes = new THREE.Object3D();
  	scene.add( cubes );

  	for(var i = 0; i < 100; i++ ) {
  		var grayness = Math.random() * 0.5 + 0.25,
  			mat = new THREE.MeshBasicMaterial(),
  			cube = new THREE.Mesh( geom, mat );
  		mat.color.setRGB( grayness, grayness, grayness );
  		cube.position.set( range * (0.5 - Math.random()), range * (0.5 - Math.random()), range * (0.5 - Math.random()) );
  		cube.rotation.set( Math.random(), Math.random(), Math.random() ).multiplyScalar( 2 * Math.PI );
  		cube.grayness = grayness;
  		cubes.add( cube );
  	}

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


function trymeout(){

Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}


			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var container, stats;

			var camera, controls, scene, renderer;

			init();
			render();

			function animate() {

				requestAnimationFrame(animate);
				controls.update();

			}

			function init() {

				camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 1000 );
				//camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);


				camera.position.set(0,0,-450);
				//camera.up = new THREE.Vector3(0,0,1);
				camera.lookAt(new THREE.Vector3(0,0,0));

				controls = new THREE.OrbitControls( camera );
				controls.damping = 0.2;
				controls.addEventListener( 'change', render );

				scene = new THREE.Scene();
				scene.fog = new THREE.FogExp2( 0x111111, 0.0010 );
				scene.add(new THREE.AxisHelper() );
				// world

var size = 200;
var step = 10;

var gridHelper = new THREE.GridHelper( size, step );
scene.add( gridHelper );

				var geometry = new THREE.BoxGeometry( 1,1,1);
				var material =  new THREE.MeshLambertMaterial( { color:0xffffff, shading: THREE.SmoothShading } );

				var material2 =  new THREE.MeshLambertMaterial( { color:0xff0000, shading: THREE.SmoothShading } );

				var anArray = {};
				var url = "three.js/scan15.csv";
				myArray = Papa.parse(url, {
				download: true,
				delimiter: ",",	// auto-detect
				header: true,
				newline: "",
				complete: function(results, file) {
						//console.log("Parsing complete:", results, file);

						var minZ = 99999;
						var maxZ = 0;
						var minX = 99999;
						var maxX = 0;
						var minY = 99999;
						var maxY = 0;
						for (index = 0; index < results.data.length; ++index) {
							if(results.data[index].radius > maxZ){
								maxZ = results.data[index].radius;
							}

							if(results.data[index].radius < minZ){
								minZ = results.data[index].radius;
							}

							if(results.data[index].azimuth > maxX){
								maxX = results.data[index].azimuth;
							}

							if(results.data[index].azimuth < minX){
								minX = results.data[index].azimuth;
							}

							if(results.data[index].elevation > maxY){
								maxY = results.data[index].elevation;
							}

							if(results.data[index].elevation < minY){
								minY = results.data[index].elevation;
							}

						}

							var maxLength = 99;
							geometry = new THREE.BoxGeometry( 1,1,1);

						for (index = 0; index < results.data.length; ++index) {
    						//console.log(results.data[index]);
    						//console.log(results.data[index].x);

    						// Spherical to Rectangluar
    						//http://keisan.casio.com/exec/system/1359534351

    						// Zero the model at the origin

    						// Make the points go to the nearest whole number
    						radius = results.data[index].radius;
							azimuth = results.data[index].azimuth;
							elevation = results.data[index].elevation;


    						var mesh = new THREE.Mesh( geometry, material );
    						if(elevation % 2 === 0  ){
								//azimuth = azimuth-9;
								azimuth = azimuth;
    						}

    						var scaler = 0;
							mesh.position.x = azimuth - maxX/2;
							mesh.position.y = -elevation;
							mesh.position.z = radius - scaler - maxZ;
							mesh.updateMatrix();
							mesh.castShadow = true;
							mesh.receiveShadow = true;
							mesh.matrixAutoUpdate = false;
							scene.add( mesh );

							// var mesh = new THREE.Mesh( geometry, material2 );
							// mesh.position.x = azimuth;
							// mesh.position.y = elevation;
							// mesh.position.z = radius;
							// mesh.updateMatrix();
							// mesh.matrixAutoUpdate = false;
							// scene.add( mesh );

						}
					}
				});

				// for ( var i = 0; i < 500; i ++ ) {

				// 	var mesh = new THREE.Mesh( geometry, material );
				// 	mesh.position.x = ( Math.random() - 0.5 ) * 1000;
				// 	mesh.position.y = ( Math.random() - 0.5 ) * 1000;
				// 	mesh.position.z = ( Math.random() - 0.5 ) * 1000;
				// 	mesh.updateMatrix();
				// 	mesh.matrixAutoUpdate = false;
				// 	scene.add( mesh );

				// }


				// lights

				light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 1, 1, 1 );
				scene.add( light );

				light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 5, 5, -5 );
				scene.add( light );

				light = new THREE.AmbientLight( 0xffffff );
				scene.add( light );


				// renderer

				renderer = new THREE.WebGLRenderer( { antialias: false } );
				renderer.setClearColor( scene.fog.color );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );

				container = document.getElementById( 'container' );
				container.appendChild( renderer.domElement );

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				stats.domElement.style.zIndex = 100;
				container.appendChild( stats.domElement );

				//

				window.addEventListener( 'resize', onWindowResize, false );

				animate();

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

				render();

			}

			function render() {

				renderer.render( scene, camera );
				stats.update();

			}
}
