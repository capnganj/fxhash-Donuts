//CAPNGANJ TORUS fxhash generative token
//June, 2022

//imports
import { Features } from './Features';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';


//1) - generate fxhash features - global driving parameters
//new featuresClass
let feet = new Features();
window.$fxhashData = feet;

// FX Features
window.$fxhashFeatures = {
  "Palette" : feet.color.inverted ? feet.color.name + " Invert" : feet.color.name,
  "Scale" : feet.scale.tag,
  "Speed": feet.speed.tag,
  "Density": feet.density.tag
};
console.log(window.$fxhashFeatures);
//console.log(feet);

//vars related to fxhash preview call
//loaded tracks whether texture has loaded;
//previewed tracks whether preview has been called
let loaded = false;
let previewed = false;

//from fxhash webpack boilerplate
// these are the variables you can use as inputs to your algorithms
//console.log(fxhash)   // the 64 chars hex number fed to your algorithm
//console.log(fxrand()) // deterministic PRNG function, use it instead of Math.random()
//console.log("fxhash features", window.$fxhashFeatures);


//2) Initialize three.js scene and start the render loop
//all data driving geometry and materials and whatever else should be generated in step 2




//global vars 
var controls, renderer, scene, camera, effect;
init();

function init() {
  //scene & camera
  scene = new THREE.Scene();
  //let bc = feet.desaturateColor(feet.color.background, 1.5);
  scene.background = new THREE.Color(235/255, 213/255, 179/255);

  renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    alpha: true
  } );
  
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.id = "hashish";
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 1000 );
  camera.position.set( 4, 4, 4 );

  //lights
  const p1 = new THREE.PointLight( 0xcccccc, 0.666 );
  p1.position.set( 5, 10, 5);
  scene.add(p1);
  const amb = new THREE.AmbientLight( 0xcccccc, 0.666);
  scene.add(amb);

  //outline effect
  effect = new OutlineEffect( renderer );

  // controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.enableDamping=true;
  controls.dampingFactor = 0.2;
  //controls.autoRotate= true;
  controls.autoRotateSpeed = 1.0;
  controls.maxDistance = 10;
  controls.minDistance = 1;



  //geometry!

  //torus provides base points to hang on
  const torus = new THREE.IcosahedronBufferGeometry(3, Math.round(feet.map(fxrand(), 0, 1, 2, 12)));

  // const dashing = new THREE.MeshStandardMaterial({
  //   color: 0x000000,
  //   wireframe: true,
  // })

  // const wireframe = new THREE.Mesh(torus, dashing);
  // scene.add(wireframe);

  //shere geometry to hang
  const sphere = new THREE.SphereBufferGeometry(0.1);
  //const pill = new THREE.CapsuleBufferGeometry(0.1, 0.2, 10, 20)
  const miniTorus = new THREE.TorusBufferGeometry(0.1, 0.05, 10, 20 )
  miniTorus.rotateY(Math.PI/2)

  

  //Normal
  //const m = new THREE.MeshNormalMaterial()

  //toon
  const format = ( renderer.capabilities.isWebGL2 ) ? THREE.RedFormat : THREE.LuminanceFormat;
  const colors = new Uint8Array(5);
  for (let c = 0; c < colors.length; c++) {
    colors[c] = (c/colors.length) * 256;
  }
  const gradientMap = new THREE.DataTexture(colors, colors.length, 1, format);
  gradientMap.needsUpdate = true;
  const toon = new THREE.MeshToonMaterial({
    color: new THREE.Color(),
    gradientMap: gradientMap
  });

  //mesh instance geometry for battery life
  const iMesh = new THREE.InstancedMesh(miniTorus, toon, torus.attributes.position.length/3,);
  scene.add(iMesh)

  //loop over torus and instantiate meshes with random colors
  for (let i = 0; i < torus.attributes.position.array.length; i=i+3) {
    
    const m = new THREE.Matrix4();
    m.setPosition(torus.attributes.position.array[i], torus.attributes.position.array[i+1], torus.attributes.position.array[i+2]);
    iMesh.setMatrixAt(i/3, m);

    const rgb = feet.interpolateFn(fxrand());
    const col = new THREE.Color(rgb.r/255, rgb.g/255, rgb.b/255);
    iMesh.setColorAt(i/3, col);
    
  }
  iMesh.instanceMatrix.needsUpdate = true;


  //set up resize listener and let it rip!
  window.addEventListener( 'resize', onWindowResize );
  animate();
}


// threejs animation stuff
function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  requestAnimationFrame( animate );
  render();

}

function render() {

  effect.render( scene, camera );

  if(previewed == false && loaded == true && renderer.info.render.frame > 100){
    fxpreview();
    previewed = true;
    //download();
  } 

  //mesh.rotation.y += 0.001;

}

function download() {
  var link = document.createElement('a');
  link.download = 'Torus.png';
  link.href = document.getElementById('hashish').toDataURL()
  link.click();
}
