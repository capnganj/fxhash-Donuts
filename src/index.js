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
  "Noise": feet.noise.tag,
  "Base Geometry": feet.wireframe.tag,
  "Toon Geometries": feet.toonGeom.tag,
  "Zoom": feet.zoom.tag,
  "Background": feet.background.tag
};
console.log(window.$fxhashFeatures);
//console.log(feet);

//vars related to fxhash preview call
//previewed tracks whether preview has been called
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
  scene.background = feet.background.value;

  renderer = new THREE.WebGLRenderer( { 
    antialias: true,
    alpha: true
  } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.id = "hashish";
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100 );
  camera.position.set( feet.zoom.value, feet.zoom.value, feet.zoom.value );

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
  controls.autoRotateSpeed = 0.5;
  controls.maxDistance = 7;
  controls.minDistance = 1;



  //geometry!

  //wireframe geometry to hang on
  let wireframe = {};
  if (feet.wireframe.tag.includes("Hole")) {
    wireframe = new THREE.IcosahedronBufferGeometry(
      3, 
      Math.round(feet.map(feet.density.value, 0, 1, 4, 11))
    );
    wireframe.rotateX(feet.map(fxrand(), 0, 1, 0, Math.PI/3));
    wireframe.rotateY(feet.map(fxrand(), 0, 1, 0, Math.PI/3));
  } 

  else if (feet.wireframe.tag.includes("Bang!")) {
    wireframe = new THREE.BufferGeometry();
    let positions = [];
    let count = Math.round(feet.map(feet.density.value, 0, 1, 123, 456));
    for (let i = 0; i < count; i++) {
      let u = fxrand();
      let x1 = feet.map(fxrand(), 0, 1, -1, 1);
      let x2 = feet.map(fxrand(), 0, 1, -1, 1);
      let x3 = feet.map(fxrand(), 0, 1, -1, 1);
      let mag = Math.sqrt(x1*x1 + x2*x2 + x3*x3);
      x1 /= mag; 
      x2 /= mag; 
      x3 /= mag;
      let c = Math.cbrt(u);
      let v = new THREE.Vector3(x1*c, x2*c, x3*c).multiplyScalar(3.5);
      positions.push(v.x);
      positions.push(v.y);
      positions.push(v.z);
    }
    wireframe.setAttribute('position', new THREE.Float32BufferAttribute( positions, 3 ));
  }

  else {
    wireframe = new THREE.TorusBufferGeometry(
      2, 1,
      Math.round(feet.map(feet.density.value, 0, 1, 20, 27)),
      Math.round(feet.map(feet.density.value, 0, 1, 35, 45))
    );
    if (feet.wireframe.tag.includes("Left")) {
      wireframe.rotateY(Math.PI/2)
    } 
    else if (feet.wireframe.tag.includes("Right")) {
    }
    else if (feet.wireframe.tag.includes("Random")) {
      wireframe.rotateX(feet.map(fxrand(), 0, 1, 0, Math.PI/2));
      wireframe.rotateY(feet.map(fxrand(), 0, 1, 0, Math.PI/2));
      wireframe.rotateZ(feet.map(fxrand(), 0, 1, 0, Math.PI/2));
    }
    else {
      wireframe.rotateX(Math.PI/2);
    }
  }
  wireframe.computeBoundingBox();



  //toon geometries - donuts and donut holes that hang on the wireframe's vertices
  let toonGeometry = {}
  if (feet.toonGeom.tag.includes("Holes")) {
    toonGeometry = new THREE.SphereBufferGeometry(0.1);
  } else {
    toonGeometry = new THREE.TorusBufferGeometry(0.1, 0.05, 20, 50 )
    if (feet.toonGeom.tag.includes("Left")) {
      toonGeometry.rotateY(Math.PI/2)
    } 
    else if(feet.toonGeom.tag.includes("Right")) {
    }
    else {
      toonGeometry.rotateX(Math.PI/2)
    }
  }


  //toon material 
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

  //mesh instance geometry for nappiness and battery life
  const iMesh = new THREE.InstancedMesh(toonGeometry, toon, wireframe.attributes.position.count,);
  scene.add(iMesh)

  //remove duplicate points in the buffer for donut holes
  let noDupes = wireframe.attributes.position.array;
  if (feet.wireframe.tag.includes("Hole")) {
    noDupes = removeDuplicateVertices(noDupes);
  }
  console.log(wireframe.attributes.position.array.length);
  console.log(noDupes.length);

  //loop over torus and instantiate meshes with random colors
  for (let i = 0, u = 0; i < noDupes.length; i=i+3, u=u+2) {
    
    //matrix
    const m = new THREE.Matrix4();

    //roatation
    if (feet.toonGeom.tag.includes("Random")) {
      m.makeRotationAxis(new THREE.Vector3(1,0,0), feet.map(fxrand(), 0, 1, 0, Math.PI * 2));
      m.makeRotationAxis(new THREE.Vector3(0,1,0), feet.map(fxrand(), 0, 1, 0, Math.PI * 2));
      m.makeRotationAxis(new THREE.Vector3(0,0,1), feet.map(fxrand(), 0, 1, 0, Math.PI * 2))
    }

    //position
    m.setPosition(noDupes[i], noDupes[i+1], noDupes[i+2]);

    //size
    if (!feet.wireframe.tag.includes("Hole") && !feet.wireframe.tag.includes("Bang!")) {
      const s = u < wireframe.attributes.uv.count ? 
        feet.map(wireframe.attributes.uv.array[u+1], 0, 0.5, 1, 0.4) :
        feet.map(wireframe.attributes.uv.array[u+1], 0.5, 1.0, 0.4, 1) ;
      m.scale( new THREE.Vector3(s,s,s))
    }

    iMesh.setMatrixAt(i/3, m);



    //color

    //use noise value to set up a random addition value - how far do we want to jump inside of the gradient?
    const rgbNoise = feet.map(fxrand(), 0, 1, feet.noise.value * -1, feet.noise.value)
    const y = feet.map(wireframe.attributes.position.array[i+1], wireframe.boundingBox.min.y, wireframe.boundingBox.max.y, 0, 1)
    const t = feet.map(rgbNoise + y, 0-feet.noise.value, 1+feet.noise.value, 0, 1);

    const rgb = feet.interpolateFn(feet.color.inverted ? 1-t : t);
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

  if(previewed == false && renderer.info.render.frame > 1){
    fxpreview();
    previewed = true;
    download();
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

function removeDuplicateVertices(vertices) {
  var positionLookup = [];
  var final = [];

  for( let i = 0; i < vertices.length-3; i += 3 ) {
      var index = vertices[i] + vertices[i + 1] + vertices[i + 2];

      if( positionLookup.indexOf( index ) == -1 ) {
          positionLookup.push( index );
          final.push(vertices[i])
          final.push(vertices[i+1])
          final.push(vertices[i+2])
      }
  }
  return final;
}
