import * as THREE from 'three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { buildWorld } from './world/index.js'
import { buildScreen } from './world/screen.js'
import { buildLighting } from './lighting/index.js'
import { createCollisionWorld } from './player/collision.js'
import { createPlayer, PLAYER } from './player/physics.js'
import { createControls } from './player/controls.js'
import { createTouchInput } from './player/touch.js'
import { createAcoes } from './player/acoes.js'
import { createHud } from './hud/index.js'
import { createVenueSound } from './sound/venue.js'
import { createCrowd } from './actors/crowd.js'
import { createAvatar, SKIN_NAMES } from './actors/avatar.js'
import { createCamera } from './player/camera.js'
import { createMenu } from './player/menu.js'
import { conectarSala } from './net/sala.js'

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
], videoWall.ligado)

const crowd = createCrowd(scene)
const demo = new URLSearchParams(location.search).has('teste')
const rotas = [
  { id: 'teste-1', kind: 'et', centro: [4, 0, 3], raio: 3.5, velocidade: 0.5, fase: 0 },
  { id: 'teste-2', kind: 'porco', centro: [-2, 0, -4], raio: 4, velocidade: 0.38, fase: 2 },
  { id: 'teste-3', kind: 'et', centro: [15.5, 1.2, 0], raio: 2.6, velocidade: 0.6, fase: 4 }
]
if (demo) rotas.forEach((rota) => crowd.spawn(rota.id, rota.kind))

let eu = null

function vestir(tipo) {
  if (eu) scene.remove(eu.root)
  eu = createAvatar(tipo)
  eu.root.visible = false
  scene.add(eu.root)
}

const sala = conectarSala(crowd, (tipo) => {
  hud.sala(`você é o ${tipo}`)
  vestir(tipo)
})

const world = createCollisionWorld(colliders)
const camera3 = createCamera(camera, world)
const player = createPlayer(world, new THREE.Vector3(-18, 0, 0))
const touch = createTouchInput()
const controls = createControls(camera, renderer.domElement, touch)
const acoes = createAcoes(touch)
controls.bloquearOlhar(acoes.aberta)

const menu = createMenu(
  (modo) => camera3.definir(modo),
  () => controls.travar()
)
const hud = createHud()

let entrou = false

controls.onLockChange((locked) => {
  if (locked) {
    entrou = true
    hud.dismissHelp()
    venue.unlock()
    menu.fechar()
    return
  }
  if (entrou) menu.abrir()
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
  const { yaw, pitch } = controls.angulos()
  const andando = Math.hypot(player.velocity.x, player.velocity.z)
  if (eu) {
    eu.root.visible = camera3.modo() === 'terceira'
    eu.root.position.copy(player.position)
    eu.root.rotation.y = yaw + Math.PI
    eu.update(dt, andando, acoes.atual())
  }
  controls.apply()
  camera3.aplicar(player.position, PLAYER.eye, yaw, pitch)
  if (demo) {
    const t = performance.now() / 1000
    for (const rota of rotas) {
      const a = t * rota.velocidade + rota.fase
      crowd.place(
        rota.id,
        rota.centro[0] + Math.cos(a) * rota.raio,
        rota.centro[1],
        rota.centro[2] + Math.sin(a) * rota.raio,
        -a + Math.PI / 2
      )
    }
  }
  if (input.forward !== 0 || input.strafe !== 0 || input.jump) acoes.andou()
  sala.enviar(player.position, camera.rotation.y, acoes.atual())
  crowd.update(dt)
  hud.tick(dt)
  venue.update(camera.position)
  hud.soundState(venue.isReady(), venue.isOn())
  renderer.render(scene, camera)
  css.render(scene, camera)
  requestAnimationFrame(frame)
}

frame()

if (!eu) vestir(SKIN_NAMES[Math.floor(Math.random() * SKIN_NAMES.length)])

window.game = { scene, camera, renderer, player, world, controls, videoWall, venue, crowd, sala, acoes, camera3, menu }
window.stats = () => ({
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  colliders: world.count,
  position: player.position.toArray().map((v) => +v.toFixed(2)),
  onGround: player.isOnGround()
})
