import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import gsap from 'gsap'

// ─── RENDERER ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020510)
scene.fog = new THREE.FogExp2(0x020510, 0.009)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.6
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

// ─── CAMERA & CONTROLS ───────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(50, 35, 50)
camera.lookAt(0, 0, 0)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.maxPolarAngle = Math.PI / 2.5
controls.minDistance = 20
controls.maxDistance = 200
controls.autoRotate = true
controls.autoRotateSpeed = 0.15

// ─── LIGHTS ──────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x111827, 0.1))

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

const bluePoint = new THREE.PointLight(0x2244ff, 2, 120)
bluePoint.position.set(0, 30, 0)
scene.add(bluePoint)

const warmPoint = new THREE.PointLight(0xff8833, 2, 80)
warmPoint.position.set(-30, 10, -30)
scene.add(warmPoint)

scene.add(new THREE.HemisphereLight(0x0a0e2a, 0x000000, 0.5))

// ─── STEP 1: TOP LEVEL STATE ──────────────────────────────────────────────────
let gltfScene: THREE.Group | null = null
let isolatedObject: THREE.Mesh | null = null
let hotspots: { div: HTMLElement; position: THREE.Vector3 }[] = []
let floatingLabels: { div: HTMLElement; position: THREE.Vector3; meshName: string }[] = []
let hoveredMesh: THREE.Mesh | null = null
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// ─── STEP 2: PRODUCT CATALOG ──────────────────────────────────────────────────
const catalog: Record<string, any> = {
  'T0': { name: 'SOLAR SOLUTIONS', category: 'ÉNERGIE RENOUVELABLE', color: '#f59e0b', tagline: 'Production solaire intelligente pour bâtiments tertiaires', benefits: ['Réduction facture -60%', 'ROI en 4 ans', 'Monitoring temps réel'], video: 'https://youtube.com', brochure: '/brochures/solar.pdf', contact: 'mailto:contact@netis.com' },
  'T1': { name: 'SMART GENERATOR', category: 'ALIMENTATION DE SECOURS', color: '#3b82f6', tagline: 'Générateurs industriels haute performance', benefits: ['Démarrage automatique', 'Zéro coupure', 'Maintenance prédictive'], video: 'https://youtube.com', brochure: '/brochures/generator.pdf', contact: 'mailto:contact@netis.com' },
  'T2': { name: 'HVAC SYSTEMS', category: 'CLIMATISATION & VENTILATION', color: '#06b6d4', tagline: 'Systèmes CVC intelligents et économes', benefits: ['Économie énergie -40%', 'Qualité air certifiée', 'Contrôle à distance'], video: 'https://youtube.com', brochure: '/brochures/hvac.pdf', contact: 'mailto:contact@netis.com' },
  'T3': { name: 'SMART LIGHTING', category: 'ÉCLAIRAGE INTELLIGENT', color: '#8b5cf6', tagline: 'Solutions LED connectées pour tous vos espaces', benefits: ['Économie -70%', 'Détection présence', 'Ambiances programmables'], video: 'https://youtube.com', brochure: '/brochures/lighting.pdf', contact: 'mailto:contact@netis.com' },
  'T4': { name: 'BMS PLATFORM', category: 'GESTION TECHNIQUE', color: '#10b981', tagline: 'Plateforme de gestion technique centralisée', benefits: ['Dashboard unifié', 'Alertes temps réel', 'Rapports automatiques'], video: 'https://youtube.com', brochure: '/brochures/bms.pdf', contact: 'mailto:contact@netis.com' },
  'M0': { name: 'FIRE SAFETY', category: 'SÉCURITÉ INCENDIE', color: '#ef4444', tagline: 'Détection et extinction automatique incendie', benefits: ['Détection précoce', 'Conformité normes', 'Intervention auto'], video: 'https://youtube.com', brochure: '/brochures/fire.pdf', contact: 'mailto:contact@netis.com' },
  'M1': { name: 'ACCESS CONTROL', category: "CONTRÔLE D'ACCÈS", color: '#f97316', tagline: 'Gestion intelligente des accès et badges', benefits: ['Accès biométrique', 'Historique complet', 'Intégration RH'], video: 'https://youtube.com', brochure: '/brochures/access.pdf', contact: 'mailto:contact@netis.com' },
  'M2': { name: 'CCTV & SECURITY', category: 'VIDÉOSURVEILLANCE', color: '#6366f1', tagline: 'Surveillance intelligente par caméras IP', benefits: ['IA détection anomalies', 'Stockage cloud', 'Vision nocturne'], video: 'https://youtube.com', brochure: '/brochures/cctv.pdf', contact: 'mailto:contact@netis.com' },
}

// ─── STEP 3: HOVER BUBBLE ────────────────────────────────────────────────────
const bubble = document.createElement('div')
bubble.id = 'hover-bubble'
bubble.style.cssText = `
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 50;
  transition: transform 0.2s, background 0.2s;
  pointer-events: auto;
`
bubble.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:white;"></div>`
document.body.appendChild(bubble)

const ring = document.createElement('div')
ring.style.cssText = `
  position:absolute;
  width:40px;height:40px;
  border-radius:50%;
  border:1px solid rgba(255,255,255,0.5);
  animation: pulse 1.5s ease-out infinite;
`
bubble.appendChild(ring)

// ─── HOTSPOT SYSTEM ──────────────────────────────────────────────────────────
const hotspotContainer = document.getElementById('hotspots')!

function clearHotspots() { hotspotContainer.innerHTML = ''; hotspots = [] }

function createHotspot(position: THREE.Vector3, label: string, data: any) {
  const div = document.createElement('div')
  div.className = 'hotspot'
  div.innerHTML = `<div class="hotspot-dot"></div><div class="hotspot-ring"></div><div class="hotspot-label">${label}</div>`
  div.addEventListener('click', (e) => { e.stopPropagation(); showDetailPanel(label, data) })
  hotspotContainer.appendChild(div)
  return { div, position }
}

function showDetailPanel(label: string, data: Record<string, string>) {
  document.getElementById('detail-tag')!.textContent = label + ' — SPECIFICATIONS'
  const grid = document.getElementById('detail-grid')!
  grid.innerHTML = Object.entries(data).map(([k, v]) =>
    `<div><div style="font-size:10px;opacity:0.4;letter-spacing:2px;margin-bottom:4px;">${k.toUpperCase()}</div><div style="font-size:13px;">${v}</div></div>`
  ).join('')
  document.getElementById('detail-panel')!.style.display = 'block'
}

document.getElementById('detail-close')!.addEventListener('click', () => {
  document.getElementById('detail-panel')!.style.display = 'none'
})

function spawnHotspotsOnObject(mesh: THREE.Mesh) {
  clearHotspots()
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const points = [
    { pos: new THREE.Vector3(center.x, center.y + size.y * 0.4, center.z + size.z * 0.5), label: 'FACADE', data: { material: 'Reinforced Concrete', thickness: '300mm', insulation: 'Class A', condition: 'Good' }},
    { pos: new THREE.Vector3(center.x + size.x * 0.3, center.y + size.y * 0.2, center.z + size.z * 0.5), label: 'WINDOW', data: { material: 'Double Glazing', uValue: '1.2 W/m²K', width: '120cm', height: '150cm', condition: 'Excellent' }},
    { pos: new THREE.Vector3(center.x, center.y + size.y * 0.5, center.z), label: 'ROOF', data: { material: 'Waterproof Membrane', area: '450 m²', lastInspected: '2025', condition: 'Good' }},
    { pos: new THREE.Vector3(center.x - size.x * 0.4, center.y - size.y * 0.3, center.z + size.z * 0.4), label: 'ENTRANCE', data: { type: 'Main Lobby', access: 'Secured', width: '3m', condition: 'Excellent' }},
  ]
  points.forEach(p => { hotspots.push(createHotspot(p.pos, p.label, p.data)) })
}

// ─── STEP 7: ISOLATE OBJECT ──────────────────────────────────────────────────
function isolateObject(mesh: THREE.Mesh) {
  isolatedObject = mesh

  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  gltfScene!.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child === mesh) { child.visible = true; return }
    if (child.name.startsWith('WOn') || child.name.startsWith('WOff')) {
      const childBox = new THREE.Box3().setFromObject(child)
      const childCenter = childBox.getCenter(new THREE.Vector3())
      const expandedBox = box.clone().expandByScalar(5)
      child.visible = expandedBox.containsPoint(childCenter)
      return
    }
    child.visible = false
  })

  gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: 1.0, ease: 'power3.out' })
  gsap.to(camera.position, {
    x: center.x + maxDim * 3,
    y: center.y + maxDim * 1.5,
    z: center.z + maxDim * 3,
    duration: 1.0, ease: 'power3.out'
  })

  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6
  controls.minDistance = maxDim * 1.2
  controls.maxDistance = maxDim * 8
  document.getElementById('back-btn')!.style.display = 'flex'
}

// ─── STEP 8: EXIT ISOLATION ──────────────────────────────────────────────────
function exitIsolation() {
  isolatedObject = null
  gltfScene!.traverse((child) => { if (child instanceof THREE.Mesh) child.visible = true })
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.15
  controls.minDistance = 20
  controls.maxDistance = 200
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'power3.out' })
  gsap.to(camera.position, { x: 50, y: 35, z: 50, duration: 1.5, ease: 'power3.out' })
  document.getElementById('back-btn')!.style.display = 'none'
  document.getElementById('panel')!.style.display = 'none'
  clearHotspots()
}
;(window as any).exitIsolation = exitIsolation

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
document.getElementById('back-btn')!.addEventListener('click', (e) => { e.stopPropagation(); exitIsolation() })
document.getElementById('panel-close')!.addEventListener('click', (e) => { e.stopPropagation(); exitIsolation() })

// STEP 4: MOUSEMOVE - hover bubble
window.addEventListener('mousemove', (e) => {
  if (isolatedObject) {
    document.body.style.cursor = 'grab'
    bubble.style.display = 'none'
    return
  }

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const allMeshes: THREE.Mesh[] = []
  gltfScene?.traverse((c) => { if (c instanceof THREE.Mesh) allMeshes.push(c) })

  const hits = raycaster.intersectObjects(allMeshes, false)
  const hit = hits.find(h => catalog[(h.object as THREE.Mesh).name])

  if (hit) {
    hoveredMesh = hit.object as THREE.Mesh
    document.body.style.cursor = 'pointer'

    const box = new THREE.Box3().setFromObject(hoveredMesh)
    const top = new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      box.max.y + 4,
      (box.min.z + box.max.z) / 2
    )
    const projected = top.clone().project(camera)
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight

    bubble.style.display = 'flex'
    bubble.style.left = x + 'px'
    bubble.style.top = y + 'px'
    bubble.style.borderColor = catalog[hoveredMesh.name]?.color || 'white'
    const dot = bubble.querySelector('div') as HTMLElement
    if (dot) dot.style.background = catalog[hoveredMesh.name]?.color || 'white'
  } else {
    hoveredMesh = null
    document.body.style.cursor = 'default'
    bubble.style.display = 'none'
  }
})

// STEP 5: BUBBLE CLICK - show panel + zoom
bubble.addEventListener('click', (e) => {
  e.stopPropagation()
  if (!hoveredMesh) return
  const data = catalog[hoveredMesh.name]
  if (!data) return

  const box = new THREE.Box3().setFromObject(hoveredMesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: 1.2, ease: 'power3.out' })
  gsap.to(camera.position, {
    x: center.x + maxDim * 4,
    y: center.y + maxDim * 2,
    z: center.z + maxDim * 4,
    duration: 1.2, ease: 'power3.out'
  })
  controls.autoRotate = false

  document.getElementById('panel-category')!.textContent = data.category
  document.getElementById('panel-name')!.textContent = data.name
  document.getElementById('panel-tagline')!.textContent = data.tagline
  document.getElementById('panel-header')!.style.borderTop = `3px solid ${data.color}`

  const benefitsEl = document.getElementById('panel-benefits')!
  benefitsEl.innerHTML = data.benefits.map((b: string) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <div style="width:4px;height:4px;border-radius:50%;background:${data.color};flex-shrink:0;"></div>
      <span style="font-size:11px;font-family:sans-serif;opacity:0.8;">${b}</span>
    </div>
  `).join('')

  document.getElementById('btn-video')!.onclick = () => window.open(data.video, '_blank')
  document.getElementById('btn-brochure')!.onclick = () => window.open(data.brochure, '_blank')
  document.getElementById('btn-contact')!.onclick = () => window.open(data.contact, '_blank')

  document.getElementById('panel')!.style.display = 'block'
})

// STEP 6: CANVAS CLICK - isolate building
window.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('#panel,#back-btn,#hotspots,#hover-bubble')) return
  if (isolatedObject) return

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const allMeshes: THREE.Mesh[] = []
  gltfScene?.traverse((c) => { if (c instanceof THREE.Mesh) allMeshes.push(c) })
  const hits = raycaster.intersectObjects(allMeshes, false)
  const hit = hits.find(h => catalog[(h.object as THREE.Mesh).name])

  if (hit) {
    const mesh = hit.object as THREE.Mesh
    isolateObject(mesh)
    spawnHotspotsOnObject(mesh)
    bubble.style.display = 'none'
    document.getElementById('panel')!.style.display = 'none'
  }
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
})

// ─── LOAD GLB ────────────────────────────────────────────────────────────────
const loader = new GLTFLoader()
loader.load('/glitch_city.glb', (gltf) => {
  gltfScene = gltf.scene
  scene.add(gltfScene)

  gltfScene.traverse((child) => {
    if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true }
  })
  gltfScene.traverse((child) => {
    if (child instanceof THREE.Mesh) console.log('MESH:', child.name)
  })

  // Material system
  gltfScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mat = child.material as THREE.MeshStandardMaterial
    if (!mat) return
    const name = child.name
    if (name === 'Ground') { mat.color.set(0x060a18); mat.roughness = 1.0; mat.metalness = 0.0; mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1 }
    else if (name.startsWith('RdH') || name.startsWith('RdV')) { mat.color.set(0x030508); mat.roughness = 1.0; mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1 }
    else if (name.startsWith('SwH') || name.startsWith('SwV')) { mat.color.set(0x090d1a); mat.roughness = 0.9; mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2 }
    else if (name.startsWith('WOn')) { mat.color.set(0xffffff); mat.emissive = new THREE.Color(0xffcc55); mat.emissiveIntensity = 6; mat.roughness = 0.0 }
    else if (name.startsWith('WOff')) { mat.color.set(0x111111); mat.emissiveIntensity = 0 }
    else if (name.match(/^T\d+$/)) { mat.color.set(0x1a2035); mat.roughness = 0.6; mat.metalness = 0.3 }
    else if (name.match(/^M\d+$/)) { mat.color.set(0x141826); mat.roughness = 0.7; mat.metalness = 0.2 }
    else if (name.match(/^L\d+$/)) { mat.color.set(0x0f1220); mat.roughness = 0.8; mat.metalness = 0.1 }
    else if (name.startsWith('Pole')) { mat.color.set(0x222233); mat.roughness = 0.5; mat.metalness = 0.8 }
    else if (name.startsWith('Trk')) { mat.color.set(0x1a0f05) }
    else if (name.startsWith('Fol')) { mat.color.set(0x0a1f0a); mat.roughness = 1.0 }
    else if (name.startsWith('Car')) { mat.color.set(0x0d1020); mat.roughness = 0.3; mat.metalness = 0.7 }
  })

  // Floating labels above product buildings
  const labelData: Record<string, string> = {
    'T0': '☀️ SOLAR', 'T1': '⚡ GENERATOR', 'T2': '❄️ HVAC',
    'T3': '💡 LIGHTING', 'T4': '🖥️ BMS',
    'M0': '🔥 FIRE', 'M1': '🔐 ACCESS', 'M2': '📷 CCTV'
  }
  gltfScene!.traverse((child) => {
    if (child instanceof THREE.Mesh && labelData[child.name]) {
      const box = new THREE.Box3().setFromObject(child)
      const top = box.max.y + 3
      const center = box.getCenter(new THREE.Vector3())
      const div = document.createElement('div')
      div.style.cssText = `position:fixed;background:rgba(5,10,24,0.85);border:0.5px solid rgba(100,140,255,0.4);border-radius:20px;padding:5px 12px;color:white;font-family:monospace;font-size:10px;letter-spacing:2px;pointer-events:none;white-space:nowrap;transform:translate(-50%,-50%);`
      div.textContent = labelData[child.name]
      document.body.appendChild(div)
      floatingLabels.push({ div, position: new THREE.Vector3(center.x, top, center.z), meshName: child.name })
    }
  })

  gsap.from(camera.position, { y: 200, duration: 2.5, ease: 'power3.out' })
  console.log('City loaded!')
})

// ─── ANIMATE LOOP ────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate)
  controls.update()

  // Hotspot screen projection
  hotspots.forEach(h => {
    const projected = h.position.clone().project(camera)
    const inFront = projected.z < 1
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight
    let occluded = false
    if (isolatedObject && inFront) {
      const dir = h.position.clone().sub(camera.position).normalize()
      raycaster.set(camera.position, dir)
      const hits = raycaster.intersectObject(isolatedObject, false)
      occluded = hits.length > 0 && hits[0].distance < h.position.distanceTo(camera.position) - 0.5
    }
    h.div.style.display = 'flex'
    h.div.style.left = x + 'px'
    h.div.style.top = y + 'px'
    h.div.style.opacity = (inFront && !occluded) ? '1' : '0.15'
  })

  // Floating label screen projection
  floatingLabels.forEach(l => {
    const projected = l.position.clone().project(camera)
    if (projected.z < 1 && !isolatedObject) {
      l.div.style.display = 'block'
      l.div.style.left = ((projected.x * 0.5 + 0.5) * window.innerWidth) + 'px'
      l.div.style.top = ((-projected.y * 0.5 + 0.5) * window.innerHeight) + 'px'
    } else {
      l.div.style.display = 'none'
    }
  })

  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}
animate()
