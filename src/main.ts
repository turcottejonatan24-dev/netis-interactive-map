import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'
import gsap from 'gsap'

// ─── CATALOG ────────────────────────────────────────────────
const catalog: Record<string, any> = {
  'T0': { name: 'SOLAR SOLUTIONS', category: 'ÉNERGIE RENOUVELABLE', color: '#f59e0b', tagline: 'Production solaire intelligente pour bâtiments tertiaires', benefits: ['Réduction facture -60%', 'ROI en 4 ans', 'Monitoring temps réel'], video: 'https://youtube.com', brochure: '/brochures/solar.pdf', contact: 'mailto:contact@netis.com' },
  'T1': { name: 'SMART GENERATOR', category: 'ALIMENTATION DE SECOURS', color: '#3b82f6', tagline: 'Générateurs industriels haute performance', benefits: ['Démarrage automatique', 'Zéro coupure', 'Maintenance prédictive'], video: 'https://youtube.com', brochure: '/brochures/generator.pdf', contact: 'mailto:contact@netis.com' },
  'T2': { name: 'HVAC SYSTEMS', category: 'CLIMATISATION & VENTILATION', color: '#06b6d4', tagline: 'Systèmes CVC intelligents et économes', benefits: ['Économie énergie -40%', 'Qualité air certifiée', 'Contrôle à distance'], video: 'https://youtube.com', brochure: '/brochures/hvac.pdf', contact: 'mailto:contact@netis.com' },
  'T3': { name: 'SMART LIGHTING', category: 'ÉCLAIRAGE INTELLIGENT', color: '#8b5cf6', tagline: 'Solutions LED connectées pour tous vos espaces', benefits: ['Économie -70%', 'Détection présence', 'Ambiances programmables'], video: 'https://youtube.com', brochure: '/brochures/lighting.pdf', contact: 'mailto:contact@netis.com' },
  'T4': { name: 'BMS PLATFORM', category: 'GESTION TECHNIQUE', color: '#10b981', tagline: 'Plateforme de gestion technique centralisée', benefits: ['Dashboard unifié', 'Alertes temps réel', 'Rapports automatiques'], video: 'https://youtube.com', brochure: '/brochures/bms.pdf', contact: 'mailto:contact@netis.com' },
  'M0': { name: 'FIRE SAFETY', category: 'SÉCURITÉ INCENDIE', color: '#ef4444', tagline: 'Détection et extinction automatique incendie', benefits: ['Détection précoce', 'Conformité normes', 'Intervention auto'], video: 'https://youtube.com', brochure: '/brochures/fire.pdf', contact: 'mailto:contact@netis.com' },
  'M1': { name: 'ACCESS CONTROL', category: "CONTRÔLE D'ACCÈS", color: '#f97316', tagline: 'Gestion intelligente des accès et badges', benefits: ['Accès biométrique', 'Historique complet', 'Intégration RH'], video: 'https://youtube.com', brochure: '/brochures/access.pdf', contact: 'mailto:contact@netis.com' },
  'M2': { name: 'CCTV & SECURITY', category: 'VIDÉOSURVEILLANCE', color: '#6366f1', tagline: 'Surveillance intelligente par caméras IP', benefits: ['IA détection anomalies', 'Stockage cloud', 'Vision nocturne'], video: 'https://youtube.com', brochure: '/brochures/cctv.pdf', contact: 'mailto:contact@netis.com' },
  'M3': { name: 'ENERGY METERING', category: 'COMPTAGE ÉNERGIE', color: '#14b8a6', tagline: 'Mesure et analyse de consommation énergétique', benefits: ['Comptage précis', 'Tableaux de bord', 'Alertes dépassement'], video: 'https://youtube.com', brochure: '/brochures/metering.pdf', contact: 'mailto:contact@netis.com' },
  'M4': { name: 'EV CHARGING', category: 'BORNES DE RECHARGE', color: '#22c55e', tagline: 'Infrastructure de recharge pour véhicules électriques', benefits: ['Recharge rapide', 'Gestion de flotte', 'Facturation automatique'], video: 'https://youtube.com', brochure: '/brochures/ev.pdf', contact: 'mailto:contact@netis.com' },
  'L0': { name: 'SMART METERS', category: 'COMPTEURS INTELLIGENTS', color: '#ec4899', tagline: 'Compteurs communicants nouvelle génération', benefits: ['Relevé automatique', 'Détection fuites', 'Données temps réel'], video: 'https://youtube.com', brochure: '/brochures/meters.pdf', contact: 'mailto:contact@netis.com' },
  'L1': { name: 'AUDIO/VISUAL', category: 'SOLUTIONS AV', color: '#a855f7', tagline: 'Systèmes audiovisuels pour salles de réunion', benefits: ['Visioconférence HD', 'Contrôle tactile', 'Installation clé en main'], video: 'https://youtube.com', brochure: '/brochures/av.pdf', contact: 'mailto:contact@netis.com' },
  'L2': { name: 'NETWORK INFRA', category: 'INFRASTRUCTURE RÉSEAU', color: '#0ea5e9', tagline: 'Câblage structuré et réseau WiFi professionnel', benefits: ['WiFi 6E', 'Câblage Cat8', 'Monitoring réseau'], video: 'https://youtube.com', brochure: '/brochures/network.pdf', contact: 'mailto:contact@netis.com' },
}

const hotspotData: Record<string, any[]> = {
  facade:   [{ label: 'FAÇADE',   specs: { Matériau: 'Béton armé', Épaisseur: '300 mm', Isolation: 'Classe A', État: 'Bon' }}],
  window:   [{ label: 'VITRAGE',  specs: { Type: 'Double vitrage', 'Coefficient U': '1.2 W/m²K', Largeur: '120 cm', Hauteur: '150 cm', État: 'Excellent' }}],
  roof:     [{ label: 'TOITURE',  specs: { Matériau: 'Membrane imperméable', Surface: '450 m²', 'Dernière inspection': '2025', État: 'Bon' }}],
  entrance: [{ label: 'ENTRÉE',   specs: { Type: 'Lobby principal', Accès: 'Sécurisé', Largeur: '3 m', État: 'Excellent' }}],
}

// ─── RENDERER ───────────────────────────────────────────────
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5))

renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.8

if (isMobile) {
  renderer.shadowMap.enabled = false
} else {
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
}
renderer.xr.enabled = true

// ─── SCENE / CAMERA / CONTROLS ──────────────────────────────
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020510)
scene.fog = new THREE.FogExp2(0x020510, isMobile ? 0.015 : 0.007)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(50, 35, 50)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.15
controls.rotateSpeed = 1.2
controls.zoomSpeed = 1.5
controls.panSpeed = 1.2
controls.maxPolarAngle = Math.PI / 2.2
controls.minDistance = 20
controls.maxDistance = 200
controls.autoRotate = true
controls.autoRotateSpeed = 0.15

// Lights
scene.add(new THREE.AmbientLight(0x111827, 0.3))
scene.add(new THREE.HemisphereLight(0x0a0e2a, 0x000000, 0.5))
const dirLight = new THREE.DirectionalLight(0x4466ff, 1.5)
dirLight.position.set(50, 80, 30)
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 2048
dirLight.shadow.mapSize.height = 2048
dirLight.shadow.camera.near = 0.5
dirLight.shadow.camera.far = 500
dirLight.shadow.camera.left = -150
dirLight.shadow.camera.right = 150
dirLight.shadow.camera.top = 150
dirLight.shadow.camera.bottom = -150
scene.add(dirLight)

// ─── STATE ──────────────────────────────────────────────────
let gltfScene: THREE.Group | null = null
let isolatedMesh: THREE.Mesh | null = null
let activeMesh: THREE.Mesh | null = null
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// ─── WEBXR BUTTONS & CONTROLLERS ────────────────────────────
const vrButton = VRButton.createButton(renderer)
vrButton.style.display = 'none'
document.body.appendChild(vrButton)
document.getElementById('vr-btn')!.addEventListener('click', () => vrButton.click())

const arButton = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.body }
})
arButton.style.display = 'none'
document.body.appendChild(arButton)
document.getElementById('ar-btn')!.addEventListener('click', () => arButton.click())

const controllerFactory = new XRControllerModelFactory()
const controller1 = renderer.xr.getController(0)
const controller2 = renderer.xr.getController(1)
const controllerGrip1 = renderer.xr.getControllerGrip(0)
controllerGrip1.add(controllerFactory.createControllerModel(controllerGrip1))
const controllerGrip2 = renderer.xr.getControllerGrip(1)
controllerGrip2.add(controllerFactory.createControllerModel(controllerGrip2))
scene.add(controller1, controller2, controllerGrip1, controllerGrip2)

const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)])
const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
const rayLine = new THREE.Line(rayGeo, rayMat)
rayLine.scale.z = 5
controller1.add(rayLine.clone())
controller2.add(rayLine.clone())

function onXRSelect(event: any) {
  const ctrl = event.target
  const tempMatrix = new THREE.Matrix4()
  tempMatrix.identity().extractRotation(ctrl.matrixWorld)
  raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld)
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)
  const meshes: THREE.Mesh[] = []
  gltfScene?.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c) })
  const hits = raycaster.intersectObjects(meshes, false)
  const hit = hits.find(h => catalog[(h.object as THREE.Mesh).name])
  if (hit) {
    const mesh = hit.object as THREE.Mesh
    onBubbleClick(mesh, catalog[mesh.name])
  }
}
controller1.addEventListener('selectstart', onXRSelect)
controller2.addEventListener('selectstart', onXRSelect)

// ─── BUBBLES ────────────────────────────────────────────────
interface BubbleEntry { div: HTMLElement; worldPos: THREE.Vector3; meshName: string }
const bubbleEntries: BubbleEntry[] = []
const bubblesContainer = document.getElementById('bubbles-container')!

function createBubble(mesh: THREE.Mesh, data: any): BubbleEntry {
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const worldPos = new THREE.Vector3(center.x, box.max.y + 5, center.z)
  const div = document.createElement('div')
  div.className = 'bubble'
  div.innerHTML = `
    <div class="bubble-dot" style="background:${data.color}"></div>
    <div class="bubble-ring" style="border-color:${data.color}"></div>
    <div class="bubble-label">${data.name}</div>
  `
  div.style.pointerEvents = 'auto'
  bubblesContainer.appendChild(div)
  div.addEventListener('click', (e) => { e.stopPropagation(); onBubbleClick(mesh, data) })
  return { div, worldPos, meshName: mesh.name }
}

function updateBubbles() {
  bubbleEntries.forEach(entry => {
    const projected = entry.worldPos.clone().project(camera)
    if (projected.z >= 1) { entry.div.style.display = 'none'; return }
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight
    entry.div.style.left = x + 'px'
    entry.div.style.top = y + 'px'
    if (isolatedMesh && entry.meshName === isolatedMesh.name) {
      entry.div.style.display = 'none'
    } else {
      entry.div.style.display = 'flex'
      if (activeMesh && entry.meshName !== activeMesh.name) {
        entry.div.style.opacity = '0.3'
        entry.div.style.transform = 'translate(-50%,-50%) scale(0.8)'
      } else {
        entry.div.style.opacity = '1'
        entry.div.style.transform = 'translate(-50%,-50%) scale(1)'
      }
    }
  })
}

function onBubbleClick(mesh: THREE.Mesh, data: any) {
  activeMesh = mesh
  controls.autoRotate = false
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: 1.2, ease: 'power3.out' })
  gsap.to(camera.position, { x: center.x + maxDim * 4, y: center.y + maxDim * 2, z: center.z + maxDim * 4, duration: 1.2, ease: 'power3.out' })
  spawnHotspots(mesh)
  document.getElementById('panel-category')!.textContent = data.category
  document.getElementById('panel-name')!.textContent = data.name
  document.getElementById('panel-tagline')!.textContent = data.tagline
  ;(document.getElementById('panel-header') as HTMLElement).style.borderTop = `3px solid ${data.color}`
  document.getElementById('panel-benefits')!.innerHTML = data.benefits.map((b: string) =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="width:4px;height:4px;border-radius:50%;background:${data.color};flex-shrink:0;"></div><span style="font-size:11px;font-family:sans-serif;opacity:0.8;">${b}</span></div>`
  ).join('')
  document.getElementById('btn-video')!.onclick = () => window.open(data.video, '_blank')
  document.getElementById('btn-brochure')!.onclick = () => window.open(data.brochure, '_blank')
  document.getElementById('btn-contact')!.onclick = () => window.open(data.contact, '_blank')
  document.getElementById('panel')!.style.display = 'block'
  document.getElementById('back-btn')!.style.display = 'block'
}

// ─── HOTSPOTS ───────────────────────────────────────────────
interface HotspotEntry { div: HTMLElement; worldPos: THREE.Vector3 }
let hotspotEntries: HotspotEntry[] = []
const hotspotsContainer = document.getElementById('hotspots-container')!

function clearHotspots() { hotspotsContainer.innerHTML = ''; hotspotEntries = [] }

function spawnHotspots(mesh: THREE.Mesh) {
  clearHotspots()
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const points = [
    { key: 'facade',   pos: new THREE.Vector3(center.x, center.y + size.y * 0.3, center.z + size.z * 0.5 + 1) },
    { key: 'window',   pos: new THREE.Vector3(center.x + size.x * 0.2, center.y + size.y * 0.1, center.z + size.z * 0.5 + 1) },
    { key: 'roof',     pos: new THREE.Vector3(center.x, center.y + size.y * 0.5 + 1, center.z) },
    { key: 'entrance', pos: new THREE.Vector3(center.x, center.y - size.y * 0.4, center.z + size.z * 0.5 + 1) },
  ]
  points.forEach(p => {
    const hData = hotspotData[p.key][0]
    const div = document.createElement('div')
    div.className = 'hotspot'
    div.style.pointerEvents = 'auto'
    div.innerHTML = `<div style="position:relative;width:8px;height:8px;"><div class="hotspot-dot"></div><div class="hotspot-ring"></div></div><div class="hotspot-label">${hData.label}</div>`
    div.addEventListener('click', (e) => { e.stopPropagation(); onHotspotClick(mesh, hData) })
    hotspotsContainer.appendChild(div)
    hotspotEntries.push({ div, worldPos: p.pos })
  })
}

function updateHotspots() {
  hotspotEntries.forEach(entry => {
    const projected = entry.worldPos.clone().project(camera)
    if (projected.z >= 1) { entry.div.style.display = 'none'; return }
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight
    entry.div.style.display = 'flex'
    entry.div.style.left = x + 'px'
    entry.div.style.top = y + 'px'
  })
}

function onHotspotClick(mesh: THREE.Mesh, hData: any) {
  isolatedMesh = mesh
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  gltfScene!.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child === mesh) { child.visible = true; return }
    if (child.name.startsWith('WOn') || child.name.startsWith('WOff')) {
      const cb = new THREE.Box3().setFromObject(child)
      child.visible = box.clone().expandByScalar(5).containsPoint(cb.getCenter(new THREE.Vector3()))
      return
    }
    child.visible = false
  })
  gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: 1.0, ease: 'power3.out' })
  gsap.to(camera.position, { x: center.x + maxDim * 2.5, y: center.y + maxDim * 1.2, z: center.z + maxDim * 2.5, duration: 1.0, ease: 'power3.out' })
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  controls.minDistance = maxDim
  controls.maxDistance = maxDim * 6
  document.getElementById('detail-tag')!.textContent = hData.label + ' — SPÉCIFICATIONS'
  document.getElementById('detail-grid')!.innerHTML = Object.entries(hData.specs).map(([k, v]) =>
    `<div><div style="font-size:8px;opacity:0.4;letter-spacing:2px;margin-bottom:4px;">${k.toUpperCase()}</div><div style="font-size:12px;">${v as string}</div></div>`
  ).join('')
  document.getElementById('detail-panel')!.style.display = 'block'
}

// ─── BACK ───────────────────────────────────────────────────
function goBack() {
  if (isolatedMesh) {
    isolatedMesh = null
    gltfScene!.traverse((child) => { if (child instanceof THREE.Mesh) child.visible = true })
    controls.autoRotate = false
    controls.minDistance = 20
    controls.maxDistance = 200
    document.getElementById('detail-panel')!.style.display = 'none'
    if (activeMesh) { const data = catalog[activeMesh.name]; if (data) onBubbleClick(activeMesh, data) }
    return
  }
  activeMesh = null
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.15
  controls.minDistance = 20
  controls.maxDistance = 200
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'power3.out' })
  gsap.to(camera.position, { x: 50, y: 35, z: 50, duration: 1.5, ease: 'power3.out' })
  document.getElementById('panel')!.style.display = 'none'
  document.getElementById('back-btn')!.style.display = 'none'
  clearHotspots()
}
;(window as any).goBack = goBack

// ─── MATERIALS ──────────────────────────────────────────────
function applyMaterials(root: THREE.Group) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mat = child.material as THREE.MeshStandardMaterial
    if (!mat) return
    const n = child.name
    if (n === 'Ground') { mat.color.set(0x060a18); mat.roughness = 1; mat.polygonOffset = true; mat.polygonOffsetFactor = -1 }
    else if (n.startsWith('RdH') || n.startsWith('RdV')) { mat.color.set(0x030508); mat.roughness = 1; mat.polygonOffset = true; mat.polygonOffsetFactor = -1 }
    else if (n.startsWith('SwH') || n.startsWith('SwV')) { mat.color.set(0x090d1a); mat.roughness = 0.9; mat.polygonOffset = true; mat.polygonOffsetFactor = -2 }
    else if (n.startsWith('WOn')) { mat.color.set(0xffffff); mat.emissive = new THREE.Color(0xffcc55); mat.emissiveIntensity = 5 }
    else if (n.startsWith('WOff')) { mat.color.set(0x111111); mat.emissiveIntensity = 0 }
    else if (n.match(/^T\d+$/)) { mat.color.set(0x1a2035); mat.roughness = 0.6; mat.metalness = 0.3 }
    else if (n.match(/^M\d+$/)) { mat.color.set(0x141826); mat.roughness = 0.7; mat.metalness = 0.2 }
    else if (n.match(/^L\d+$/)) { mat.color.set(0x0f1220); mat.roughness = 0.8; mat.metalness = 0.1 }
    else if (n.startsWith('Pole')) { mat.color.set(0x222233); mat.roughness = 0.5; mat.metalness = 0.8 }
    else if (n.startsWith('Trk')) { mat.color.set(0x1a0f05) }
    else if (n.startsWith('Fol')) { mat.color.set(0x0a1f0a); mat.roughness = 1 }
    else if (n.startsWith('Car')) { mat.color.set(0x0d1020); mat.roughness = 0.3; mat.metalness = 0.7 }
    child.castShadow = true
    child.receiveShadow = true
  })
}

// ─── LOAD GLB ───────────────────────────────────────────────
const loader = new GLTFLoader()
loader.load('/glitch_city.glb', (gltf) => {
  gltfScene = gltf.scene
  scene.add(gltfScene)
  applyMaterials(gltfScene)
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = true
      obj.matrixAutoUpdate = false
      obj.updateMatrix()
    }
  })
  gltfScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const data = catalog[child.name]
    if (data) bubbleEntries.push(createBubble(child, data))
  })
  gsap.from(camera.position, { y: 150, duration: 2.5, ease: 'power3.out' })
  console.log('City loaded! Bubbles:', bubbleEntries.length)
})

// ─── INTERACTIONS ───────────────────────────────────────────
window.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (target.closest('#panel,#detail-panel,#back-btn,#bubbles-container,#hotspots-container')) return
  if (isolatedMesh) return
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const meshes: THREE.Mesh[] = []
  gltfScene?.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c) })
  const hits = raycaster.intersectObjects(meshes, false)
  const hit = hits.find(h => catalog[(h.object as THREE.Mesh).name])
  if (hit) { const mesh = hit.object as THREE.Mesh; onBubbleClick(mesh, catalog[mesh.name]) }
})

window.addEventListener('mousemove', (e) => {
  if (isolatedMesh) { document.body.style.cursor = 'grab'; return }
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const meshes: THREE.Mesh[] = []
  gltfScene?.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c) })
  const hits = raycaster.intersectObjects(meshes, false)
  document.body.style.cursor = hits.find(h => catalog[(h.object as THREE.Mesh).name]) ? 'pointer' : 'default'
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ─── ANIMATE (XR-compatible) ────────────────────────────────
let lastTime = 0
renderer.setAnimationLoop((time) => {
  if (time - lastTime < 16) return
  lastTime = time
  controls.update()
  updateBubbles()
  if (hotspotEntries.length > 0) updateHotspots()
  renderer.render(scene, camera)
})
