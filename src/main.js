import * as THREE from 'three'
import { buildWorld } from './world/index.js'
import { buildLighting } from './lighting/index.js'
import { createCollisionWorld } from './player/collision.js'
import { createPlayer, PLAYER } from './player/physics.js'
import { createControls } from './player/controls.js'
import { createHud } from './hud/index.js'

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.shadowMap.autoUpdate = false
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.92
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x07070a)

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120)

const { colliders } = buildWorld(scene)
buildLighting(scene)

const world = createCollisionWorld(colliders)
const player = createPlayer(world, new THREE.Vector3(-18, 0, 0))
const controls = createControls(camera, renderer.domElement)
const hud = createHud()

controls.onLockChange((locked) => {
  if (locked) hud.dismissHelp()
})

controls.onLockError(() => {
  hud.notice('este navegador não liberou a trava do mouse aqui<br />abra <b>http://localhost:3490</b> numa aba normal')
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

await renderer.compileAsync(scene, camera)
renderer.shadowMap.needsUpdate = true

let last = performance.now()

function frame(now = performance.now()) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  const input = controls.sample()
  player.update(dt, input, controls.forward, controls.right)
  camera.position.set(player.position.x, player.position.y + PLAYER.eye, player.position.z)
  controls.apply()
  hud.tick(dt)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

frame()

window.game = { scene, camera, renderer, player, world, controls }
window.stats = () => ({
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  colliders: world.count,
  position: player.position.toArray().map((v) => +v.toFixed(2)),
  onGround: player.isOnGround()
})
