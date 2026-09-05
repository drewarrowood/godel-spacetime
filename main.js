import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

const R_CRIT = 2;
const CTC_R = 3.85;

const canvas = document.querySelector("#viewport");
const labelLayer = document.querySelector("#labels");
const fallback = document.querySelector("#fallback");
const resetButton = document.querySelector("#reset-view");
const legend = document.querySelector(".legend");
const legendToggle = document.querySelector(".legend-toggle");

legendToggle?.addEventListener("click", () => {
  const collapsed = legend.classList.toggle("is-collapsed");
  legendToggle.setAttribute("aria-expanded", String(!collapsed));
});

function showFallback() {
  fallback.hidden = false;
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false,
  });
} catch (err) {
  console.error(err);
  showFallback();
  throw err;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const labelRenderer = new CSS2DRenderer({ element: labelLayer });
labelRenderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2c2f);
scene.fog = new THREE.Fog(0x2b2c2f, 14, 32);
scene.up.set(0, 0, 1);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  80,
);
camera.up.set(0, 0, 1);

const DEFAULT_CAM = new THREE.Vector3(7.4, -8.6, 5.2);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0.35);
camera.position.copy(DEFAULT_CAM);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(DEFAULT_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.2;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.92;
controls.screenSpacePanning = true;
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
};
controls.update();

resetButton?.addEventListener("click", () => {
  camera.position.copy(DEFAULT_CAM);
  controls.target.copy(DEFAULT_TARGET);
  controls.update();
});

scene.add(new THREE.AmbientLight(0x9aa3ad, 0.55));
const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x2a2c30, 0.7);
hemi.position.set(0, 0, 8);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xfff4e6, 1.35);
key.position.set(4, -7, 11);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 28;
key.shadow.camera.left = -9;
key.shadow.camera.right = 9;
key.shadow.camera.top = 9;
key.shadow.camera.bottom = -9;
key.shadow.bias = -0.00035;
scene.add(key);

const fill = new THREE.DirectionalLight(0x88a0c8, 0.35);
fill.position.set(-6, 5, 4);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(9.5, 72),
  new THREE.MeshStandardMaterial({
    color: 0x1d1e21,
    roughness: 0.92,
    metalness: 0.04,
  }),
);
floor.receiveShadow = true;
floor.position.z = -2.15;
scene.add(floor);

const shadowCatch = new THREE.Mesh(
  new THREE.CircleGeometry(9.5, 72),
  new THREE.ShadowMaterial({ opacity: 0.28 }),
);
shadowCatch.receiveShadow = true;
shadowCatch.position.z = -2.14;
scene.add(shadowCatch);

function addAxis() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf4f6f8,
    roughness: 0.28,
    metalness: 0.08,
    emissive: 0x222428,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.1, 28), mat);
  shaft.rotation.x = Math.PI / 2;
  shaft.castShadow = true;
  group.add(shaft);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 14), mat);
  cap.position.z = 2.55;
  group.add(cap);
  scene.add(group);
  addLabel("t / z  axis", new THREE.Vector3(0.18, 0.18, 2.72), "label3d axis");
}

function ring(radius, color, tube = 0.018, emissive = 0x000000, intensity = 0) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 96),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.15,
      emissive,
      emissiveIntensity: intensity,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addRings() {
  const quiet = [0.7, 1.35, 2.65, 3.25, 4.45];
  for (const r of quiet) {
    ring(r, 0x5d6570, 0.016);
  }
  ring(R_CRIT, 0xf0c05a, 0.028, 0xf0c05a, 0.35);
  addLabel(
    "r_crit ≈ 2.0",
    new THREE.Vector3(R_CRIT + 0.05, 0.35, 0.18),
    "label3d crit",
  );
}

function tipAngle(r) {
  return (Math.PI / 2) * (1 - Math.exp(-r / R_CRIT));
}

function makeHalfCone(openTowardPositiveZ, radius, height) {
  const geo = new THREE.ConeGeometry(radius, height, 28, 1, true);
  geo.translate(0, -height / 2, 0);
  geo.rotateX(openTowardPositiveZ ? -Math.PI / 2 : Math.PI / 2);
  return geo;
}

function addDoubleCone(r, phi, z) {
  const tipped = tipAngle(r);
  const inside = r < R_CRIT;
  const color = inside ? 0x8fd4ea : 0xe89a7c;
  const emissive = inside ? 0x16303a : 0x3a1810;
  const group = new THREE.Group();

  const mat = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    roughness: 0.22,
    metalness: 0.04,
    emissive,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
    transmission: 0.08,
  });

  const h = 0.52;
  const cr = 0.2 + 0.015 * r;
  const future = new THREE.Mesh(makeHalfCone(true, cr, h), mat);
  const past = new THREE.Mesh(makeHalfCone(false, cr, h), mat);
  future.castShadow = true;
  past.castShadow = true;
  group.add(future, past);

  const rimGeo = new THREE.RingGeometry(cr * 0.92, cr, 28);
  const rimMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const rimF = new THREE.Mesh(rimGeo, rimMat);
  const rimP = new THREE.Mesh(rimGeo, rimMat);
  rimF.position.z = h;
  rimP.position.z = -h;
  group.add(rimF, rimP);

  const radial = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0);
  group.quaternion.setFromAxisAngle(radial, tipped);
  group.position.set(r * Math.cos(phi), r * Math.sin(phi), z);
  scene.add(group);
}

function addCones() {
  const placements = [
    [0.48, 0.35, 0.22],
    [0.52, 2.45, 0.95],
    [0.78, 4.3, -0.15],
    [1.05, 1.15, 0.55],
    [1.12, 3.55, 0.12],
    [1.4, 5.15, 0.88],
    [1.58, 2.05, -0.28],
    [1.72, 4.25, 0.48],
    [2.0, 0.55, 0.18],
    [2.02, 2.65, 0.78],
    [2.05, 4.75, -0.12],
    [2.48, 1.35, 0.42],
    [2.55, 3.55, 0.98],
    [2.88, 0.15, 0.08],
    [2.92, 5.15, 0.62],
    [3.28, 2.15, 0.32],
    [3.35, 4.05, -0.18],
    [3.62, 0.95, 0.72],
  ];
  for (const [r, phi, z] of placements) {
    addDoubleCone(r, phi, z);
  }
  addLabel(
    "tipped cones: φ can be timelike",
    new THREE.Vector3(3.15, -1.55, 1.15),
    "label3d tip",
  );
}

function helixCurve(radius, turns, z0, z1, phase, swirl) {
  const pts = [];
  const n = 220;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const z = z0 + (z1 - z0) * t;
    const ang = phase + swirl * t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(ang), radius * Math.sin(ang), z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function addTube(curve, radius, color, emissive, intensity = 0.2) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 180, radius, 8, false),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.08,
      emissive,
      emissiveIntensity: intensity,
    }),
  );
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

function addWorldlines() {
  addTube(
    helixCurve(0.22, 0.55, -1.55, 2.15, 0.4, 1),
    0.018,
    0x8ee08a,
    0x245c28,
    0.45,
  );
  addLabel(
    "ordinary worldline (near axis)",
    new THREE.Vector3(0.55, -0.85, 1.55),
    "label3d worldline",
  );

  const dust = [
    [0.95, 1.15, 0.2],
    [1.55, 1.45, 1.4],
    [2.25, 1.7, 2.6],
    [2.95, 1.95, 0.8],
  ];
  for (const [r, turns, phase] of dust) {
    addTube(helixCurve(r, turns, -1.45, 1.85, phase, 1), 0.012, 0xd7c09a, 0x3a2e1c, 0.15);
  }
}

function addCTC() {
  const glow = ring(CTC_R, 0xff6eb4, 0.055, 0xff4da6, 1.6);
  glow.material.emissiveIntensity = 2.1;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(CTC_R, 0.11, 16, 96),
    new THREE.MeshBasicMaterial({
      color: 0xff6eb4,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(halo);

  const light = new THREE.PointLight(0xff6eb4, 1.4, 8, 2);
  light.position.set(CTC_R, 0, 0);
  scene.add(light);

  addLabel(
    "closed timelike curve (r > r_crit)",
    new THREE.Vector3(-0.2, CTC_R + 0.15, 0.32),
    "label3d ctc",
  );
}

function addLabel(text, position, className) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.position.copy(position);
  scene.add(obj);
  return obj;
}

addLabel("Gödel spacetime (1949)", new THREE.Vector3(-1.1, -3.4, 2.35), "label3d title");
addAxis();
addRings();
addCones();
addWorldlines();
addCTC();

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
}

window.addEventListener("resize", onResize);

function frame() {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

try {
  frame();
} catch (err) {
  console.error(err);
  showFallback();
}
