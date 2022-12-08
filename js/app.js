/*
My WebGL App
*/

// - Grouping and animating objects as a group.
// - Animation of individual objects in a group.
// - Usage of tween for creating animation.
// - Using sliders with animation function (update).
// - Using events based sliders (onChange).

// Import modules
import * as THREE from './mods/three.module.js';
import Stats from './mods/stats.module.js';
import { OrbitControls } from './mods/OrbitControls.js'; 
import { Water } from './mods/Water2.js';
import { GUI } from './mods/lil-gui.module.min.js';
import { TWEEN } from './mods/tween.module.min.js';


// Global variables
let mainContainer = null;
let fpsContainer
let stats = null;
let camera = null;
let renderer = null;
let scene = null;
let controls = null;
let cameraControls = null;
let stepVerticalMaterial = null;
let gui = null;
let controlPanel = {
    bounceDuration: 1500,
    rotationSpeed: 0.01
};
let animationParams = {
    bounceStep: 0,
    rotateStep: 0,
    cameraStep: 0
};

let pockets, pocket1, pocket2, pocket3, pocket4, pocket5, pocket6 = null, rain;
let balls, ball1, ball2 = null;
let stick;
// let interval = async ()=>{
// 	await setInterval(moveSphere, controlPanel.bounceDuration)
// }

const vertex = new THREE.Vector3();


function init(){
	fpsContainer = document.querySelector( '#fps' );
	mainContainer = document.querySelector( '#webgl-secne' );
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xEEEEEE );	// http://www.colorpicker.com/
	createRenderer();
	createSkyBox();

	createStats();
	createCamera();
	createControls();
	createLights();
	createMeshes();

    createControlBox();

	renderer.setAnimationLoop( () => {
		update();
		render();
  	});
}



//ControlBox
function createControlBox() {
    gui = new GUI();
    let speedCnt = gui.add(controlPanel, 'bounceDuration').min(500).max(3000).step(500).name('Bounce Duration');
	speedCnt.listen();
    speedCnt.onChange(function(value) {
		moveSphere();
    });

    let cntScale = gui.add(controlPanel, 'rotationSpeed').min(0.01).max(0.1).step(0.01).name("Rotation Speed");
    cntScale.listen();
}


// Animations
function update() {
    cameraControls.update(1);

	// Ball 1
	if (typeof stick !== 'undefined') {
		// stick.rotation.y -= controlPanel.bounceDuration //control box params
		animationParams.rotateStep += controlPanel.rotationSpeed
	}

	// stick.rotation.y -= 0.01;
	stick.position.z = -2 * (Math.sin(animationParams.rotateStep));
	// stick.position.z = 1 * (Math.cos(animationParams.rotateStep));
	
	// rainVariation();
	TWEEN.update();
}


function rainVariation() {
    var positionAttribute = rain.geometry.getAttribute( 'position' );
    for ( var i = 0; i < positionAttribute.count; i ++ ) {
        vertex.fromBufferAttribute( positionAttribute, i );
        vertex.y -= 1;
        if (vertex.y < - 60) {
            vertex.y = 90;
        }
        positionAttribute.setXYZ( i, vertex.x, vertex.y, vertex.z );
    }
    positionAttribute.needsUpdate = true;
}


// Statically rendered content
function render(){
	stats.begin();
	renderer.render( scene, camera );
	stats.end();


}
// FPS counter
function createStats(){
	stats = new Stats();
	stats.showPanel( 0 );	// 0: fps, 1: ms, 2: mb, 6+: custom
	fpsContainer.appendChild( stats.dom );
}


// Camera object
function createCamera() {
    const fov = 28;
    const aspect = mainContainer.clientWidth / mainContainer.clientHeight;
    const near = 0.1;
    const far = 300; // meters
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);


    camera.position.set(-70, 20, 20);
    camera.lookAt(scene.position);
}

// Interactive controls
function createControls() {
    cameraControls = new OrbitControls(camera, mainContainer);
    cameraControls.autoRotate = false;
}

// Light objects
function createLights() {
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-10, 18, 10);
    spotLight.shadow.mapSize.width = 2048; // default 512
    spotLight.shadow.mapSize.height = 2048; //default 512
    spotLight.intensity = 1.5;
    spotLight.distance = 200;
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.4; // 0 - 1
    spotLight.decay = 0.2;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
}

function createBase() {
    const texture = new THREE.TextureLoader().load("img/grass.jpeg"); 
    texture.anisotropy = 16; // set anisotropy coefficient
    texture.magFilter = THREE.LinearFilter; 
    texture.minFilter = THREE.LinearMipMapLinearFilter; 

    // set repeating 
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);

    const planeGeometry = new THREE.PlaneGeometry(40, 40);

    const planeMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    
	plane.position.set(0, 0, 0);
    plane.receiveShadow = true;
    scene.add(plane);
}

function createSkyBox() {
	
	const cubeTextureLoader = new THREE.CubeTextureLoader();
	cubeTextureLoader.setPath( 'img/plants/' );

	const cubeTexture = cubeTextureLoader.load( [
		'posx.jpg', 'negx.jpg',
		'posy.jpg', 'negy.jpg',
		'posz.jpg', 'negz.jpg'
	] );

	scene.background = cubeTexture;

}

function createWater() {
    let waterParams = {
        color: '#93B0FF',
        scale: 4,
        flowX: 0.6,
        flowY: 0.6,
    };
    const waterGeometry = new THREE.PlaneGeometry(10, 6);
    let water = new Water(waterGeometry, {
        color: waterParams.color,
        scale: waterParams.scale,
        flowDirection: new THREE.Vector2(waterParams.flowX, waterParams.flowY),
        textureWidth: 1024,
        textureHeight: 1024
    });
    water.position.y = 1.5;
    water.rotation.x = -0.5 * Math.PI;
	return water;
    // scene.add(water);
}


function createWall(config, position, material, receiveShadow = false, texture_path = null, normal_map = null) {
	let boxGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
	let boxMaterial = new THREE.MeshLambertMaterial(material)
	let wall = null;

	if(texture_path) {
		const texture = new THREE.TextureLoader().load(texture_path);
		texture.anisotropy = 16;
		const normal = new THREE.TextureLoader().load(normal_map); // load normal map
		boxGeometry = new THREE.BoxGeometry(config.w, config.h, config.d);
		boxMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
		wall = new THREE.Mesh(
			boxGeometry,
			boxMaterial
		);
		boxMaterial.normalMap = normal;
		// boxMaterial.normalScale = 0.3;
	}else{
		wall = new THREE.Mesh(
			boxGeometry,
			boxMaterial
		);
	}
	
    wall.receiveShadow = true;
    wall.castShadow = true;
	wall.position.set(position.x, position.y, position.z);
	// scene.add(wall);
	return wall;
}




function createJumpBoard() {
	const texture = new THREE.TextureLoader().load('img/board.jpeg');
	texture.anisotropy = 16;
	const normalMap = new THREE.TextureLoader().load('img/board_normal.png'); // load normal map
	let boxGeometry = new THREE.BoxGeometry(3,0.3,8);
	let boxMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
	let board = new THREE.Mesh(
		boxGeometry,
		boxMaterial
	);
	boxMaterial.normalMap = normalMap;
    board.receiveShadow = true;
    board.castShadow = true;
	board.position.set(0,3,6);
	return (board);
}

function createClouds() {
	let clouds = new THREE.Group();
    const cloudTexture = new THREE.TextureLoader().load("img/clouds.png");
    const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, color: 0xffffff });
    const cloud = new THREE.Sprite(cloudMaterial);
    cloud.scale.set(20, 10, 1);
    cloud.position.set(5, 10, -13);
    clouds.add(cloud);

	const cloudTexture2 = new THREE.TextureLoader().load("img/clouds.png");
    const cloudMaterial2 = new THREE.SpriteMaterial({ map: cloudTexture2, color: 0xffffff });
    const cloud2 = new THREE.Sprite(cloudMaterial2);
    cloud2.scale.set(20, 10, 1);
    cloud2.position.set(20, 10, -13);
    clouds.add(cloud2);

    scene.add(clouds);



	var tween = new TWEEN.Tween(clouds.rotation)
        .to({ y: "-" + Math.PI/2}, 10000) // relative animation
        .onComplete(function() {
            // Check that the full 360 degrees of rotation, 
            // and calculate the remainder of the division to avoid overflow.
            if (Math.abs(clouds.rotation.y)>=2*Math.PI) {
                clouds.rotation.y = clouds.rotation.y % (2*Math.PI);
            }
        })
        .start();
	tween.repeat(Infinity)



}


function createBirds() {
	let birds = new THREE.Group();

    const birdTexture = new THREE.TextureLoader().load("img/birds.png");
    const birdMaterial = new THREE.SpriteMaterial({ map: birdTexture, color: 0xffffff });

	const bird = new THREE.Sprite(birdMaterial);
    bird.scale.set(50, 40, 1);
    bird.position.set(50, 15, 0);
    birds.add(bird);
    scene.add(birds);


	var tween = new TWEEN.Tween(birds.rotation)
        .to({ y: "-" + Math.PI/2}, 10000) // relative animation
        .onComplete(function() {
            // Check that the full 360 degrees of rotation, 
            // and calculate the remainder of the division to avoid overflow.
            if (Math.abs(birds.rotation.y)>=2*Math.PI) {
                birds.rotation.y = birds.rotation.y % (2*Math.PI);
            }
        })
        .start();
	tween.repeat(Infinity)
}



function createPool() {
	let wall1 = createWall(
		{w: 0.1,h: 2,d: 6}, 
		{x: 5,y: 1,z: 0},
		{color: 0xffffff} // white
	);
	let wall2 = createWall(
		{w: 0.1,h: 2,d: 6}, 
		{x: -5,y:1,z: 0},
		{color: 0xffffff} // white
	);
	
	let wall3 = createWall(
		{w: 10, h: 2, d: 0.1}, 
		{x: 0, y:1, z: -3},
		{color: 0xffffff} // white
	);
	let wall4 = createWall(
		{w: 10, h: 2, d: 0.1}, 
		{x: 0, y:1, z: 3},
		{color: 0xffffff} // white
	);
	let wall5 = createWall(
		{w: 12, h: 0.1, d: 7}, 
		{x: 0, y: 2, z: 0},
		{color: 0xffffff},
		false,
		'img/billiard.jpeg',
		// 'img/pool_normal.png',
	);
    
	let water = createWater();

	const pool = new THREE.Group();
	pool.add( wall1 );
	pool.add( wall2 );
	pool.add( wall3 );
	pool.add( wall4 );
	pool.add( wall5 );
	pool.add( water );

	scene.add(pool);


}




function createPockets() {
	pockets = new THREE.Group();
	pocket1 = createPocket({x: 5.7, y: 2, z: 3.4});
	pocket2 = createPocket({x: -5.7, y: 2, z: -3.4});
	pocket3 = createPocket({x: 5.7, y: 2, z: -3.4});
	pocket4 = createPocket({x: -5.7, y: 2, z: 3.4});


	pocket5 = createPocket({x: 0, y: 2, z: -3.4});
	pocket6 = createPocket({x: 0, y: 2, z: 3.4});

	pockets.add(pocket1);
	pockets.add(pocket2);
	pockets.add(pocket3);
	pockets.add(pocket4);
	pockets.add(pocket5);
	pockets.add(pocket6);
	scene.add(pockets);


}



// Meshes and other visible objects
function createMeshes(){
    createBase();
	createPool();
	createPockets();

	stick = createStick({x: -3, y: 2.5, z: 12});
	scene.add(stick);


	// create a animating ball
	balls = new THREE.Group();
	ball1 = createSphere({x: 3, y: 2.2, z: 0});
	ball2 = createSphere({x: 3, y: 2.2, z: 1});
	balls.add(ball1);
	balls.add(ball2);
	scene.add(balls);

	moveSphere();

	// createClouds();
	// createBirds();
	// create a animating ball
	// balls = new THREE.Group();
	// ball1 = createPocket({x: 3, y: 1.5, z: 0});
	// ball2 = createPocket({x: 3, y: 1.5, z: 1});
	// balls.add(ball1);
	// balls.add(ball2);
	// scene.add(balls);
    // createRain(rain);
}



function createRain() {
	const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 1000; i++) {
        vertices.push( 
		    Math.random() * 120 - 60,
		    Math.random() * 180 - 80,
		    Math.random() * 130 - 60
        );
    }
		
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    const material = new THREE.PointsMaterial( { color: '#ffffff' } );

    rain = new THREE.Points( geometry, material );
    scene.add(rain);
}

function moveSphere() {
	balls.position.x = 1;
	console.log(controlPanel.bounceDuration);
	new TWEEN.Tween(balls.position)
		.to({x: -8}, controlPanel.bounceDuration)
		.easing(TWEEN.Easing.Cubic.In)
		.start()
		.onComplete(() => {
			// new TWEEN.Tween(balls.position)
			// 	.to({x: 1}, controlPanel.bounceDuration)
			// 	.easing(TWEEN.Easing.Cubic.In)
			// 	.start();
		}
	);
}


function createStick(position) {
    const texture = new THREE.TextureLoader().load("img/stick.webp");
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 16;

    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

	// const pocketGeometry = new (1, 1, 1.4, 20);
	// const pocketMaterial = new ({ color: 0x000000 });

    const stickGeometry = new THREE.CylinderGeometry(0.1, 0, 5);
    const stickMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    let stick = new THREE.Mesh(stickGeometry, stickMaterial);
	stick.position.set(position.x, position.y, position.z),
	stick.rotation.set(30, 15, 0),
    stick.castShadow = true;

	
	return stick;
}



function createSphere(position) {
    const texture = new THREE.TextureLoader().load("img/ball.jpg");
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 16;


    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const sphereGeometry = new THREE.SphereGeometry(0.2, 10, 10);
    const sphereMaterial = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
    let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.position.set(position.x, position.y, position.z),
    sphere.castShadow = true;
	
	return sphere;
}

function createPocket(position) {
    const texture = new THREE.TextureLoader().load("img/pocket.png");
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 16;


    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;


	// const pocketGeometry = new (1, 1, 1.4, 20);
	// const pocketMaterial = new ({ color: 0x000000 });

    const sphereGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
    const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.position.set(position.x, position.y, position.z),
    sphere.castShadow = true;
	
	return sphere;
}

// Renderer object and features
function createRenderer(){
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(mainContainer.clientWidth, mainContainer.clientHeight);
	renderer.setPixelRatio( window.devicePixelRatio );

	// types of shaddow: THREE.BasicShadowMap | THREE.PCFShadowMap | THREE.PCFSoftShadowMap
	renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

	mainContainer.appendChild( renderer.domElement );
}

// Auto resize window
window.addEventListener('resize', e => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
});

init();