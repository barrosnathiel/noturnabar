import * as THREE from 'three'
import { PERSONAGENS, carregarPersonagem, criarPersonagem } from '../actors/personagem.js'

const CHAVE = 'noturnabar.personagem'

export function createSelecao(aoEntrar) {
  const tela = document.getElementById('escolha')
  const canvas = document.getElementById('vitrine')
  const rotulo = document.getElementById('nomePersonagem')
  const botaoEntrar = document.getElementById('entrar')

  let indice = 0
  try {
    const salvo = localStorage.getItem(CHAVE)
    const achado = PERSONAGENS.findIndex((p) => p.id === salvo)
    if (achado >= 0) indice = achado
  } catch (erro) {
    void erro
  }

  const cena = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
  camera.position.set(0, 1.1, 3.5)
  camera.lookAt(0, 0.95, 0)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  cena.add(new THREE.AmbientLight(0xaab4d0, 1.4))
  const frente = new THREE.DirectionalLight(0xfff0d8, 2.6)
  frente.position.set(2.4, 4, 3.2)
  cena.add(frente)
  const tras = new THREE.DirectionalLight(0x7f9ad8, 1.6)
  tras.position.set(-2.6, 2, -2.4)
  cena.add(tras)

  const palco = new THREE.Group()
  cena.add(palco)
  let atual = null
  let relogio = performance.now()

  function medir() {
    const r = canvas.getBoundingClientRect()
    const l = Math.max(1, Math.round(r.width))
    const a = Math.max(1, Math.round(r.height))
    renderer.setSize(l, a, false)
    camera.aspect = l / a
    camera.updateProjectionMatrix()
  }

  async function mostrar(i) {
    indice = (i + PERSONAGENS.length) % PERSONAGENS.length
    const escolha = PERSONAGENS[indice]
    rotulo.textContent = escolha.nome
    const modelo = await carregarPersonagem(escolha.id)
    if (!modelo || PERSONAGENS[indice].id !== escolha.id) return
    if (atual) palco.remove(atual.root)
    atual = criarPersonagem(modelo)
    atual.root.position.y = 0
    palco.add(atual.root)
  }

  function girar(passo) {
    mostrar(indice + passo)
  }

  document.getElementById('anterior').addEventListener('click', () => girar(-1))
  document.getElementById('proximo').addEventListener('click', () => girar(1))
  botaoEntrar.addEventListener('click', () => confirmar())

  window.addEventListener('keydown', (evento) => {
    if (document.body.classList.contains('jogando')) return
    if (evento.code === 'ArrowLeft') girar(-1)
    if (evento.code === 'ArrowRight') girar(1)
    if (evento.code === 'Enter' || evento.code === 'Space') confirmar()
  })

  function confirmar() {
    const escolha = PERSONAGENS[indice]
    try {
      localStorage.setItem(CHAVE, escolha.id)
    } catch (erro) {
      void erro
    }
    document.body.classList.add('jogando')
    tela.remove()
    aoEntrar(escolha.id)
  }

  function quadro(agora) {
    if (!document.body.classList.contains('jogando')) {
      const dt = Math.min((agora - relogio) / 1000, 0.05)
      relogio = agora
      medir()
      palco.rotation.y += dt * 0.55
      if (atual) atual.update(dt, 0, 'dance')
      renderer.render(cena, camera)
      requestAnimationFrame(quadro)
      return
    }
    renderer.dispose()
  }

  mostrar(indice)
  requestAnimationFrame(quadro)

  return { escolhido: () => PERSONAGENS[indice].id }
}
