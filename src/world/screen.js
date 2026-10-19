import * as THREE from 'three'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { materials as M } from './materials.js'

const VIDEO_ID = 'MToMx6RCW-M'
const PIXELS = 1280
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const LIGADO = !LOCAL || new URLSearchParams(location.search).has('video')

export function buildScreen(scene, opcoes = {}) {
  const WIDTH = opcoes.largura ?? 16
  const HEIGHT = opcoes.altura ?? 9
  const CENTER = opcoes.centro ?? new THREE.Vector3(19.5, 5.9, 0)
  const moldura = opcoes.moldura ?? 0.5
  const brilho = opcoes.brilho ?? 60
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, HEIGHT + moldura, WIDTH + moldura),
    M.darkMetal
  )
  frame.position.set(CENTER.x + 0.12, CENTER.y, CENTER.z)
  scene.add(frame)

  const hole = new THREE.Mesh(
    new THREE.PlaneGeometry(WIDTH, HEIGHT),
    new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, fog: false, side: THREE.DoubleSide, blending: THREE.NoBlending })
  )
  hole.position.copy(CENTER)
  hole.rotation.y = -Math.PI / 2
  scene.add(hole)

  const container = document.createElement('div')
  container.style.width = `${PIXELS}px`
  container.style.height = `${(PIXELS * HEIGHT) / WIDTH}px`
  container.style.background = '#000'
  container.style.pointerEvents = 'none'

  const iframe = document.createElement('iframe')
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  iframe.style.pointerEvents = 'none'
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture'
  iframe.src =
    `https://www.youtube.com/embed/${VIDEO_ID}` +
    `?autoplay=${LIGADO ? 1 : 0}&mute=1&controls=0&playsinline=1&loop=1` +
    `&playlist=${VIDEO_ID}&enablejsapi=1&modestbranding=1&rel=0`
  container.appendChild(iframe)

  const panel = new CSS3DObject(container)
  panel.position.copy(CENTER)
  panel.rotation.y = -Math.PI / 2
  panel.scale.setScalar(WIDTH / PIXELS)
  scene.add(panel)

  const glow = new THREE.PointLight(0x6f8fd0, brilho, Math.max(16, WIDTH), 1.9)
  glow.position.set(CENTER.x - WIDTH * 0.2, CENTER.y, CENTER.z)
  scene.add(glow)

  return { iframe, center: CENTER, ligado: LIGADO }
}
