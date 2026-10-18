import * as THREE from 'three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { buildWorld } from './world/index.js'
import { buildScreen } from './world/screen.js'
import { buildLighting } from './lighting/index.js'
import { createCollisionWorld } from './player/collision.js'
import { createPlayer, PLAYER } from './player/physics.js'
import { createControls } from './player/controls.js'
import { createTouchInput } from './player/touch.js'
import { createHud } from './hud/index.js'
import { createVenueSound } from './sound/venue.js'

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
const coarse = window.matchMedia('(pointer: coarse)').matches
renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.25 : 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x07070a, 0)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.shadowMap.autoUpdate = false
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.92
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const css = new CSS3DRenderer()
css.setSize(window.innerWidth, window.innerHeight)
document.getElementById('css3d').appendChild(css.domElement)

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120)

const { colliders } = buildWorld(scene)
buildLighting(scene)
const videoWall = buildScreen(scene)
const venue = createVenueSound(videoWall.iframe, [
  new THREE.Vector3(12.2, 1.75, 8.6),
  new THREE.Vector3(12.2, 2.75, 8.6),
  new THREE.Vector3(12.2, 1.75, -8.6),
  new THREE.Vector3(12.2, 2.75, -8.6)
])

const world = createCollisionWorld(colliders)
const player = createPlayer(world, new THREE.Vector3(-18, 0, 0))
const touch = createTouchInput()
const controls = createControls(camera, renderer.domElement, touch)
const hud = createHud()

controls.onLockChange((locked) => {
  if (locked) {
    hud.dismissHelp()
    venue.unlock()
  }
})

for (const gesto of ['pointerdown', 'keydown', 'touchstart']) {
  window.addEventListener(gesto, () => venue.unlock())
}

if (touch.supported) {
  window.addEventListener('pointerdown', () => {
    hud.dismissHelp()
    venue.unlock()
  })
}

controls.onLockError(() => {
  hud.notice('este navegador não liberou a trava do mouse aqui<br />abra <b>http://localhost:3490</b> numa aba normal')
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  css.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x07070a, 0)
})

const warmUp = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()
warmUp.catch(() => {}).then(() => {
  renderer.shadowMap.needsUpdate = true
})
renderer.shadowMap.needsUpdate = true

let last = performance.now()

function frame(now = performance.now()) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  const input = controls.sample(dt)
  player.update(dt, input, controls.forward, controls.right)
  camera.position.set(player.position.x, player.position.y + PLAYER.eye, player.position.z)
  controls.apply()
  hud.tick(dt)
  venue.update(camera.position)
  hud.soundState(venue.isReady(), venue.isOn())
  renderer.render(scene, camera)
  css.render(scene, camera)
  requestAnimationFrame(frame)
}

frame()

window.game = { scene, camera, renderer, player, world, controls, videoWall, venue }
window.stats = () => ({
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  colliders: world.count,
  position: player.position.toArray().map((v) => +v.toFixed(2)),
  onGround: player.isOnGround()
})
