import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import gsap from 'gsap'

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

// --- TOP-LEVEL STATE ---
let isolatedObject: THREE.Mesh | null = null
let gltfScene: THREE.Group | null = null
let hotspots: { div: HTMLElement; position: THREE.Vector3 }[] = []
let floatingLabels: { div: HTMLElement; position: THREE.Vector3 }[] = []

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

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// --- BUILDING DATA (PRODUCT CATALOG) ---
function getBuildingData(name: string) {
  const catalog: Record<string, any> = {
    'T0': { name: 'SOLAR SOLUTIONS', category: 'ÉNERGIE RENOUVELABLE', color: '#f59e0b', tagline: 'Production solaire intelligente pour bâtiments tertiaires', benefits: ['Réduction facture -60%', 'ROI en 4 ans', 'Monitoring temps réel'], video: 'https://www.youtube.com/watch?v=example1', brochure: '/brochures/solar.pdf', contact: 'mailto:contact@netis.com' },
    'T1': { name: 'SMART GENERATOR', category: 'ALIMENTATION DE SECOURS', color: '#3b82f6', tagline: 'Générateurs industriels haute performance', benefits: ['Démarrage automatique', 'Zéro coupure', 'Maintenance prédictive'], video: 'https://www.youtube.com/watch?v=example2', brochure: '/brochures/generator.pdf', contact: 'mailto:contact@netis.com' },
    'T2': { name: 'HVAC SYSTEMS', category: 'CLIMATISATION & VENTILATION', color: '#06b6d4', tagline: 'Systèmes CVC intelligents et économes', benefits: ['Économie énergie -40%', 'Qualité air certifiée', 'Contrôle à distance'], video: 'https://www.youtube.com/watch?v=example3', brochure: '/brochures/hvac.pdf', contact: 'mailto:contact@netis.com' },
    'T3': { name: 'SMART LIGHTING', category: 'ÉCLAIRAGE INTELLIGENT', color: '#8b5cf6', tagline: 'Solutions LED connectées pour tous vos espaces', benefits: ['Économie -70% vs halogène', 'Détection présence', 'Ambiances programmables'], video: 'https://www.youtube.com/watch?v=example4', brochure: '/brochures/lighting.pdf', contact: 'mailto:contact@netis.com' },
    'T4': { name: 'BMS PLATFORM', category: 'GESTION TECHNIQUE', color: '#10b981', tagline: 'Plateforme de gestion technique centralisée', benefits: ['Dashboard unifié', 'Alertes temps réel', 'Rapports automatiques'], video: 'https://www.youtube.com/watch?v=example5', brochure: '/brochures/bms.pdf', contact: 'mailto:contact@netis.com' },
    'M0': { name: 'FIRE SAFETY', category: 'SÉCURITÉ INCENDIE', color: '#ef4444', tagline: 'Détection et extinction automatique incendie', benefits: ['Détection précoce', 'Conformité normes', 'Intervention automatique'], video: 'https://www.youtube.com/watch?v=example6', brochure: '/brochures/fire.pdf', contact: 'mailto:contact@netis.com' },
    'M1': { name: 'ACCESS CONTROL', category: 'CONTRÔLE D\'ACCÈS', color: '#f97316', tagline: 'Gestion intelligente des accès et badges', benefits: ['Accès biométrique', 'Historique complet', 'Intégration RH'], video: 'https://www.youtube.com/watch?v=example7', brochure: '/brochures/access.pdf', contact: 'mailto:contact@netis.com' },
    'M2': { name: 'CCTV & SECURITY', category: 'VIDÉOSURVEILLANCE', color: '#6366f1', tagline: 'Surveillance intelligente par caméras IP', benefits: ['IA détection anomalies', 'Stockage cloud', 'Vision nocturne'], video: 'https://www.youtube.com/watch?v=example8', brochure: '/brochures/cctv.pdf', contact: 'mailto:contact@netis.com' },
  }
  return catalog[name] || null
}

// --- HOTSPOT SYSTEM ---
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

function showBuildingPanel(data: any) {
  document.getElementById('panel-category')!.textContent = data.category
  document.getElementById('panel-name')!.textContent = data.name
  document.getElementById('panel-tagline')!.textContent = data.tagline
  const benefitsEl = document.getElementById('panel-benefits')!
  benefitsEl.innerHTML = data.benefits.map((b: string) =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:11px;font-family:sans-serif;"><div style="width:4px;height:4px;border-radius:50%;background:#4dff9b;flex-shrink:0;"></div><span style="opacity:0.8;">${b}</span></div>`
  ).join('')
  document.getElementById('btn-video')!.onclick = () => window.open(data.video, '_blank')
  document.getElementById('btn-brochure')!.onclick = () => window.open(data.brochure, '_blank')
  document.getElementById('btn-contact')!.onclick = () => window.open(data.contact, '_blank')
  document.getElementById('panel-header')!.style.borderTop = `3px solid ${data.color}`
  document.getElementById('panel')!.style.display = 'block'
}

// --- ISOLATION SYSTEM ---
function isolateObject(mesh: THREE.Mesh) {
  isolatedObject = mesh

  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  gltfScene!.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    if (child === mesh) {
      child.visible = true
      return
    }

    // For windows - only show if they are within the building's bounding box
    if (child.name.startsWith('WOn') || child.name.startsWith('WOff')) {
      const childBox = new THREE.Box3().setFromObject(child)
      const childCenter = childBox.getCenter(new THREE.Vector3())
      // Check if window center is inside the building box (expanded slightly)
      const expandedBox = box.clone().expandByScalar(5)
      child.visible = expandedBox.containsPoint(childCenter)
      return
    }

    // Hide everything else
    child.visible = false
  })

  gsap.to(controls.target, {
    x: center.x, y: center.y, z: center.z,
    duration: 1.0, ease: 'power3.out'
  })
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

function exitIsolation() {
  if (!isolatedObject) return
  gltfScene?.traverse((child) => { if (child instanceof THREE.Mesh) child.visible = true })
  isolatedObject = null
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.15
  controls.minDistance = 20
  controls.maxDistance = 200
  gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'power3.out' })
  gsap.to(camera.position, { x: 50, y: 35, z: 50, duration: 1.5, ease: 'power3.out' })
  document.getElementById('back-btn')!.style.display = 'none'
  document.getElementById('panel')!.style.display = 'none'
  document.getElementById('detail-panel')!.style.display = 'none'
  clearHotspots()
}

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

// --- EVENT LISTENERS ---
document.getElementById('back-btn')!.addEventListener('click', (e) => { e.stopPropagation(); exitIsolation() })
document.getElementById('panel-close')!.addEventListener('click', (e) => { e.stopPropagation(); exitIsolation() })

window.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('#panel, #detail-panel, #back-btn, #hotspots')) return

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  if (isolatedObject) return  // hotspots handle their own clicks

  if (!gltfScene) return

  const allMeshes: THREE.Mesh[] = []
  gltfScene.traverse((child) => { if (child instanceof THREE.Mesh) allMeshes.push(child) })

  const intersects = raycaster.intersectObjects(allMeshes, false)
  if (intersects.length === 0) return

  const hit = intersects[0].object as THREE.Mesh
  const data = getBuildingData(hit.name)
  if (!data) return

  showBuildingPanel(data)
  isolateObject(hit)
  spawnHotspotsOnObject(hit)
})

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  if (isolatedObject) {
    const hits = raycaster.intersectObject(isolatedObject, false)
    const mat = isolatedObject.material as THREE.MeshStandardMaterial
    if (hits.length > 0) {
      mat.emissive = new THREE.Color(0x2233ff)
      mat.emissiveIntensity = 0.2
    } else {
      mat.emissiveIntensity = 0
    }
    document.body.style.cursor = 'grab'
    return
  }

  if (!gltfScene) return
  const allMeshes: THREE.Mesh[] = []
  gltfScene.traverse((child) => { if (child instanceof THREE.Mesh) allMeshes.push(child) })
  const intersects = raycaster.intersectObjects(allMeshes, false)
  const hit = intersects.find(i => getBuildingData((i.object as THREE.Mesh).name))
  document.body.style.cursor = hit ? 'pointer' : 'default'
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
})

// --- LOAD GLB ---
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

  // Enhance materials
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

  gsap.from(camera.position, { y: 200, duration: 2.5, ease: 'power3.out' })
  console.log('City loaded!')

  // Floating product labels above T/M buildings
  const productBuildings = ['T0','T1','T2','T3','T4','M0','M1','M2']
  const labelData: Record<string,string> = {
    'T0':'☀️ SOLAR', 'T1':'⚡ GENERATOR', 'T2':'❄️ HVAC',
    'T3':'💡 LIGHTING', 'T4':'🖥️ BMS', 'M0':'🔥 FIRE',
    'M1':'🔐 ACCESS', 'M2':'📷 CCTV'
  }
  gltfScene!.traverse((child) => {
    if (child instanceof THREE.Mesh && productBuildings.includes(child.name)) {
      const box = new THREE.Box3().setFromObject(child)
      const top = box.max.y + 3
      const center = box.getCenter(new THREE.Vector3())
      const div = document.createElement('div')
      div.style.cssText = `position:fixed;background:rgba(5,10,24,0.85);border:0.5px solid rgba(100,140,255,0.4);border-radius:20px;padding:5px 12px;color:white;font-family:monospace;font-size:10px;letter-spacing:2px;pointer-events:none;white-space:nowrap;transform:translate(-50%,-50%);`
      div.textContent = labelData[child.name] || child.name
      document.body.appendChild(div)
      floatingLabels.push({ div, position: new THREE.Vector3(center.x, top, center.z) })
    }
  })
})

// --- ANIMATE LOOP ---
function animate() {
  requestAnimationFrame(animate)
  controls.update()

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
