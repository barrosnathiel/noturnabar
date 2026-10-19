import * as THREE from 'three'
import { carregarPersonagem, criarPersonagem, IDS } from './personagem.js'

const sorteado = () => IDS[Math.floor(Math.random() * IDS.length)]

export function createCrowd(scene) {
  const people = new Map()

  function spawn(id, tipo = sorteado()) {
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
      vivo: true
    }
    people.set(id, pessoa)
    carregarPersonagem(tipo).then((modelo) => {
      if (!modelo || !pessoa.vivo) return
      pessoa.avatar = criarPersonagem(modelo)
      pessoa.avatar.root.position.copy(pessoa.target)
      scene.add(pessoa.avatar.root)
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
    }
  }

  return { spawn, place, remove, update, limpar, count: () => people.size }
}
