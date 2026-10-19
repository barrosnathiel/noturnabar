import * as THREE from 'three'
import { carregarPersonagem, criarPersonagem, IDS } from './personagem.js'

const sorteado = () => IDS[Math.floor(Math.random() * IDS.length)]
const ALCANCE_NOME = 25

function pintarNome(texto) {
  const tela = document.createElement('canvas')
  tela.width = 256
  tela.height = 64
  const ctx = tela.getContext('2d')
  ctx.font = 'bold 32px ui-monospace, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(4,6,12,0.9)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#eef1ff'
  for (let i = 0; i < 3; i++) ctx.fillText(texto, 128, 34)
  const mapa = new THREE.CanvasTexture(tela)
  mapa.colorSpace = THREE.SRGBColorSpace
  return mapa
}

export function createCrowd(scene, camera) {
  const people = new Map()
  const aqui = new THREE.Vector3()

  function etiqueta(pessoa) {
    if (!pessoa.nome || !pessoa.avatar) return
    if (pessoa.placa) {
      pessoa.placa.material.map.dispose()
      pessoa.placa.material.map = pintarNome(pessoa.nome)
      return
    }
    const material = new THREE.SpriteMaterial({
      map: pintarNome(pessoa.nome),
      transparent: true,
      depthWrite: false,
      fog: false
    })
    const placa = new THREE.Sprite(material)
    placa.scale.set(1.5, 0.375, 1)
    placa.position.y = 2.15
    placa.frustumCulled = false
    pessoa.avatar.root.add(placa)
    pessoa.placa = placa
  }

  function nomear(id, nome) {
    const pessoa = people.get(id)
    if (!pessoa) return
    const limpo = String(nome || '').slice(0, 16)
    if (pessoa.nome === limpo) return
    pessoa.nome = limpo
    if (!limpo && pessoa.placa) {
      pessoa.avatar.root.remove(pessoa.placa)
      pessoa.placa.material.map.dispose()
      pessoa.placa.material.dispose()
      pessoa.placa = null
      return
    }
    etiqueta(pessoa)
  }

  function spawn(id, tipo = sorteado(), nome = '') {
    let pessoa = people.get(id)
    if (pessoa) return pessoa
    pessoa = {
      tipo,
      avatar: null,
      target: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      yaw: 0,
      targetYaw: 0,
      speed: 0,
      acao: 'nada',
      nome: String(nome || '').slice(0, 16),
      placa: null,
      vivo: true
    }
    people.set(id, pessoa)
    carregarPersonagem(tipo).then((modelo) => {
      if (!modelo || !pessoa.vivo) return
      pessoa.avatar = criarPersonagem(modelo)
      pessoa.avatar.root.position.copy(pessoa.target)
      scene.add(pessoa.avatar.root)
      etiqueta(pessoa)
    })
    return pessoa
  }

  function place(id, x, y, z, yaw, acao = 'nada') {
    const pessoa = people.get(id) || spawn(id)
    pessoa.acao = acao
    pessoa.previous.copy(pessoa.target)
    pessoa.target.set(x, y, z)
    pessoa.targetYaw = yaw
    pessoa.speed = pessoa.target.distanceTo(pessoa.previous) / 0.1
  }

  function remove(id) {
    const pessoa = people.get(id)
    if (!pessoa) return
    pessoa.vivo = false
    if (pessoa.avatar) scene.remove(pessoa.avatar.root)
    people.delete(id)
  }

  function limpar() {
    for (const pessoa of people.values()) {
      pessoa.vivo = false
      if (pessoa.avatar) scene.remove(pessoa.avatar.root)
    }
    people.clear()
  }

  function update(dt) {
    for (const pessoa of people.values()) {
      if (!pessoa.avatar) continue
      const root = pessoa.avatar.root
      root.position.lerp(pessoa.target, Math.min(1, dt * 9))
      let diff = pessoa.targetYaw - pessoa.yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      pessoa.yaw += diff * Math.min(1, dt * 9)
      root.rotation.y = pessoa.yaw + Math.PI
      pessoa.avatar.update(dt, pessoa.speed, pessoa.acao)
      pessoa.speed *= Math.max(0, 1 - dt * 3)
      if (pessoa.placa) {
        aqui.copy(root.position)
        const longe = camera ? aqui.distanceTo(camera.position) : 0
        pessoa.placa.visible = longe < ALCANCE_NOME
      }
    }
  }

  return { spawn, place, remove, update, limpar, nomear, count: () => people.size }
}
