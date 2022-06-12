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
  "Density": feet.density.tag,
  "Base Geometry": feet.wireframe.tag,
  "Toon Geometries": feet.toonGeom.tag
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
  scene.background = new THREE.Color(235/255, 213/255, 179/255);

  renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    alpha: true
  } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.id = "hashish";
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100 );
  camera.position.set( 4.20, 4.20, 4.20 );

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

  //wireframe geometry to hang on
  let wireframe = {};
  if (feet.wireframe.tag.includes("Hole")) {
    wireframe = new THREE.IcosahedronBufferGeometry(
      3, 
      Math.round(feet.map(feet.density.value, 0, 1, 3, 11))
    );
  } else {
    wireframe = new THREE.TorusBufferGeometry(
      2, 1,
      Math.round(feet.map(feet.density.value, 0, 1, 20, 30)),
      Math.round(feet.map(feet.density.value, 0, 1, 30, 50))
    );
    if (feet.wireframe.tag.includes("Left")) {
      wireframe.rotateY(Math.PI/2)
    } 
    else if (feet.wireframe.tag.includes("Right")) {
    }
    else {
      wireframe.rotateX(Math.PI/2);
    }
  }

  //toon geometries - donuts and donut holes that hang on the wireframe's vertices
  let toonGeometry = {}
  if (feet.toonGeom.tag.includes("Holes")) {
    toonGeometry = new THREE.SphereBufferGeometry(0.1);
  } else {
    toonGeometry = new THREE.TorusBufferGeometry(0.1, 0.05, 10, 20 )
    //miniTorus.rotateY(Math.PI/2)
  }
  //const sphere = new THREE.SphereBufferGeometry(0.1);
  //const pill = new THREE.CapsuleBufferGeometry(0.1, 0.2, 10, 20)
  //const miniTorus = new THREE.TorusBufferGeometry(0.1, 0.05, 10, 20 )
  //miniTorus.rotateY(Math.PI/2)

  

  //Normal
  //const m = new THREE.MeshNormalMaterial()

  //toon
  const format = ( renderer.capabilities.isWebGL2 ) ? THREE.RedFormat : THREE.LuminanceFormat;
  const colors = new Uint8Array(7);
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
  const iMesh = new THREE.InstancedMesh(toonGeometry, toon, wireframe.attributes.position.count,);
  scene.add(iMesh)

  //loop over torus and instantiate meshes with random colors
  for (let i = 0, u = 0; i < wireframe.attributes.position.count * 3; i=i+3, u=u+2) {
    
    //position
    const m = new THREE.Matrix4();
    m.setPosition(wireframe.attributes.position.array[i], wireframe.attributes.position.array[i+1], wireframe.attributes.position.array[i+2]);

    //size
    if (!feet.wireframe.tag.includes("Hole")) {
      const s = u < wireframe.attributes.uv.count ? 
        feet.map(wireframe.attributes.uv.array[u+1], 0, 0.5, 1, 0.4) :
        feet.map(wireframe.attributes.uv.array[u+1], 0.5, 1, 0.4, 1) ;
      m.scale( new THREE.Vector3(s,s,s))
    }

    iMesh.setMatrixAt(i/3, m);

    //colors
    const rgb = feet.interpolateFn(fxrand());
    const col = new THREE.Color(rgb.r/255, rgb.g/255, rgb.b/255);
    iMesh.setColorAt(i/3, col);
    
  }
  iMesh.instanceMatrix.needsUpdate = true;


  //set up resize listener and let it rip!
  window.addEventListener( 'resize', onWindowResize );
  renderer.domElement.addEventListener( 'dblclick', toggleAutorotate);
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

function toggleAutorotate() {
  controls.autoRotate= !controls.autoRotate;
}

function download() {
  var link = document.createElement('a');
  link.download = 'Torus.png';
  link.href = document.getElementById('hashish').toDataURL()
  link.click();
}
