import * as THREE from 'three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { createCollisionWorld } from './player/collision.js'
import { createPlayer, PLAYER } from './player/physics.js'
import { createControls } from './player/controls.js'
import { createTouchInput } from './player/touch.js'
import { createAcoes } from './player/acoes.js'
import { createHud } from './hud/index.js'
import { createVenueSound } from './sound/venue.js'
import { createCrowd } from './actors/crowd.js'
import { carregarPersonagem, criarPersonagem, IDS } from './actors/personagem.js'
import { createCamera } from './player/camera.js'
import { createMenu } from './player/menu.js'
import { createSelecao } from './player/selecao.js'
import { createAcesso } from './player/acesso.js'
import { sessao, nome as nomeDaConta } from './player/conta.js'
import { conectarSala } from './net/sala.js'
import { lobby } from './mundos/lobby.js'
import { casa } from './mundos/casa.js'
import { arena } from './mundos/arena.js'

const MUNDOS = { lobby, casa, arena }
const CAIXAS_DE_SOM = {
  casa: [
    new THREE.Vector3(12.2, 1.75, 8.6),
    new THREE.Vector3(12.2, 2.75, 8.6),
    new THREE.Vector3(12.2, 1.75, -8.6),
    new THREE.Vector3(12.2, 2.75, -8.6)
  ],
  arena: [
    new THREE.Vector3(8.5, 10, 27),
    new THREE.Vector3(8.5, 10, -27),
    new THREE.Vector3(23, 14, 0)
  ]
}

const ALCANCE = {
  casa: { perto: 5, longe: 46, piso: 0.18 },
  arena: { perto: 34, longe: 150, piso: 0.45 }
}

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
scene.fog = new THREE.FogExp2(0x07070a, 0.012)

const css = new CSS3DRenderer()
css.setSize(window.innerWidth, window.innerHeight)
document.getElementById('css3d').appendChild(css.domElement)

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 460)

let colisor = createCollisionWorld([])
const mundoColisor = {
  query: (caixa, saida) => colisor.query(caixa, saida),
  anyOverlap: (caixa, ignorar, tol) => colisor.anyOverlap(caixa, ignorar, tol),
  get count() {
    return colisor.count
  }
}

const crowd = createCrowd(scene, camera)
const camera3 = createCamera(camera, mundoColisor)
const player = createPlayer(mundoColisor, new THREE.Vector3(0, 0, 0))
const touch = createTouchInput()
const controls = createControls(camera, renderer.domElement, touch)
const acoes = createAcoes(touch)
controls.bloquearOlhar(acoes.aberta)
const hud = createHud()
const menu = createMenu(
  (modo) => camera3.definir(modo),
  () => controls.travar()
)

let eu = null
let meuTipo = null

function vestir(tipo) {
  meuTipo = tipo
  if (eu) {
    scene.remove(eu.root)
    eu = null
  }
  carregarPersonagem(tipo).then((modelo) => {
    if (!modelo || meuTipo !== tipo) return
    eu = criarPersonagem(modelo)
    eu.root.visible = camera3.modo() === 'terceira'
    scene.add(eu.root)
  })
}

let sala = {
  ativa: () => false,
  enviar: () => {},
  status: () => 'escolhendo',
  online: () => 0
}

let meuNome = nomeDaConta()

const acesso = createAcesso(() => {
  meuNome = nomeDaConta()
  if (atual) hud.sala(comoMostrar(atual.titulo))
})

function comoMostrar(titulo) {
  if (meuNome) return `${titulo} · ${meuNome}`
  return meuTipo ? `${titulo} · você é o ${meuTipo}` : titulo
}

function comecar(escolhido, comoChamar) {
  if (comoChamar) meuNome = comoChamar
  vestir(escolhido)
  sala = conectarSala(
    crowd,
    (tipo) => {
      vestir(tipo)
      hud.sala(atual ? comoMostrar(atual.titulo) : tipo)
    },
    escolhido,
    meuNome
  )
}

const logado = sessao()
if (logado) {
  let salvo = 'Alien'
  try {
    salvo = localStorage.getItem('noturnabar.personagem') || salvo
  } catch (erro) {
    void erro
  }
  const tela = document.getElementById('escolha')
  if (tela) tela.remove()
  document.body.classList.add('jogando')
  comecar(salvo, nomeDaConta())
} else {
  createSelecao((escolhido, comoChamar) => comecar(escolhido, comoChamar))
}

const FIGURANTES = Math.min(
  parseInt(new URLSearchParams(location.search).get('multidao') || '0', 10) || 0,
  800
)
const ESTILOS = ['balanco', 'maos', 'solto', 'jamal']

function encherPista(nome) {
  if (!FIGURANTES) return
  const perto = nome === 'arena' ? 6 : 3
  const longe = nome === 'arena' ? 44 : 11
  const centro = nome === 'arena' ? -22 : 2
  for (let i = 0; i < FIGURANTES; i++) {
    const id = `figurante-${i}`
    crowd.spawn(id, IDS[i % IDS.length])
    const a = Math.random() * Math.PI * 2
    const r = perto + Math.random() * (longe - perto)
    crowd.place(
      id,
      centro + Math.cos(a) * r,
      0,
      Math.sin(a) * r,
      Math.random() * Math.PI * 2,
      ESTILOS[i % ESTILOS.length]
    )
  }
}

let atual = null
let venue = createVenueSound(null, [], false)
let imune = true

function descartar(mundo) {
  scene.remove(mundo.grupo)
  mundo.grupo.traverse((no) => {
    if (no.isMesh || no.isPoints) no.geometry.dispose()
    if (no.element && no.element.parentNode) no.element.remove()
  })
}

function entrar(nome) {
  const receita = MUNDOS[nome] || MUNDOS.lobby
  if (atual) descartar(atual.mundo)
  const mundo = receita.construir()
  scene.add(mundo.grupo)
  atual = { nome: receita.nome, mundo, titulo: receita.titulo }

  colisor = createCollisionWorld(mundo.colliders)
  player.position.copy(mundo.spawn)
  player.velocity.set(0, 0, 0)
  controls.setAngles(mundo.olhar, -0.02)
  scene.fog.color.setHex(receita.fundo)
  scene.fog.density = nome === 'arena' ? 0.004 : 0.012

  venue = mundo.telao
    ? createVenueSound(mundo.telao.iframe, CAIXAS_DE_SOM[nome] || [], mundo.telao.ligado, ALCANCE[nome])
    : createVenueSound(null, [], false)
  venue.unlock()

  imune = true
  hud.sala(comoMostrar(receita.titulo))
  crowd.limpar()
  encherPista(nome)
  renderer.shadowMap.needsUpdate = true
}

function olharPortais(caixaJogador) {
  let dentro = false
  for (const portal of atual.mundo.portais) {
    if (!portal.caixa.intersectsBox(caixaJogador)) continue
    dentro = true
    if (!imune) {
      entrar(portal.destino)
      return
    }
  }
  if (!dentro) imune = false
}

let entrou = false

controls.onLockChange((locked) => {
  if (locked) {
    entrou = true
    acesso.fechar()
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur()
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

entrar(new URLSearchParams(location.search).get('lugar') || (logado ? 'arena' : 'lobby'))


const warmUp = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()
warmUp.catch(() => {}).then(() => {
  renderer.shadowMap.needsUpdate = true
})
renderer.shadowMap.needsUpdate = true

const caixaJogador = new THREE.Box3()
let yawTravado = null
let last = performance.now()

function frame(now = performance.now()) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  const input = controls.sample(dt)
  player.update(dt, input, controls.forward, controls.right)

  caixaJogador.min.set(player.position.x - 0.3, player.position.y, player.position.z - 0.3)
  caixaJogador.max.set(player.position.x + 0.3, player.position.y + 1.8, player.position.z + 0.3)
  olharPortais(caixaJogador)

  const { yaw, pitch } = controls.angulos()
  const andando = Math.hypot(player.velocity.x, player.velocity.z)
  const acao = acoes.atual()
  if (acao !== 'nada' && andando < 0.6) {
    if (yawTravado === null) yawTravado = yaw
  } else {
    yawTravado = null
  }
  const yawCorpo = yawTravado === null ? yaw : yawTravado
  if (eu) {
    eu.root.visible = camera3.modo() === 'terceira'
    eu.root.position.copy(player.position)
    eu.root.rotation.y = yawCorpo + Math.PI
    eu.update(dt, andando, acao)
  }
  controls.apply()
  camera3.aplicar(player.position, PLAYER.eye, yaw, pitch)

  if (input.forward !== 0 || input.strafe !== 0 || input.jump) acoes.andou()
  sala.enviar(player.position, yawCorpo, acao, atual.nome)
  if (atual.mundo.animar) atual.mundo.animar(dt)
  crowd.update(dt)
  hud.tick(dt)
  venue.update(camera.position)
  hud.soundState(venue.isReady(), venue.isOn())
  hud.online(sala.online())
  renderer.render(scene, camera)
  css.render(scene, camera)
  requestAnimationFrame(frame)
}

frame()

window.game = {
  scene,
  camera,
  renderer,
  player,
  controls,
  crowd,
  sala,
  acoes,
  camera3,
  menu,
  entrar,
  lugar: () => atual.nome,
  venue: () => venue
}
window.stats = () => ({
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  colliders: mundoColisor.count,
  lugar: atual.nome,
  position: player.position.toArray().map((v) => +v.toFixed(2))
})
