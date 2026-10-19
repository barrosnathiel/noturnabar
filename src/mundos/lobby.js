import * as THREE from 'three'
import { createBuilder } from '../world/builder.js'
import { materials as M } from '../world/materials.js'
import { letreiro } from '../world/letreiro.js'

const RAIO = 11

export const lobby = {
  nome: 'lobby',
  titulo: 'lobby',
  fundo: 0x05060a,
  construir() {
    const grupo = new THREE.Group()
    const b = createBuilder()

    b.box(30, 0.5, 30, 0, -0.25, 0, M.floor)
    b.box(30, 0.3, 30, 0, 7.15, 0, M.ceiling)
    for (const [w, d, x, z] of [[30.6, 0.3, 0, 15.15], [30.6, 0.3, 0, -15.15], [0.3, 30.6, 15.15, 0], [0.3, 30.6, -15.15, 0]]) {
      b.box(w, 7, d, x, 3.5, z, M.wall)
    }

    const anel = new THREE.RingGeometry(RAIO - 0.5, RAIO, 48)
    anel.rotateX(-Math.PI / 2)
    anel.translate(0, 0.012, 0)
    b.shape(anel, M.stageEdge)

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      b.box(0.3, 7, 0.3, Math.cos(a) * 13.4, 3.5, Math.sin(a) * 13.4, M.metal)
    }

    const colliders = b.commit(grupo)

    grupo.add(new THREE.AmbientLight(0x252b3a, 1.1))
    const alto = new THREE.PointLight(0xaec2e4, 620, 30, 1.5)
    alto.position.set(0, 5.4, 0)
    grupo.add(alto)

    const portais = []
    const definidos = [
      { destino: 'casa', rotulo: 'casa de show', cor: 0x4f8fd8, angulo: Math.PI },
      { destino: 'arena', rotulo: 'arena', cor: 0xd8814f, angulo: 0 }
    ]

    for (const def of definidos) {
      const x = Math.cos(def.angulo) * RAIO
      const z = Math.sin(def.angulo) * RAIO
      const moldura = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.12, 10, 28, Math.PI),
        new THREE.MeshStandardMaterial({ color: def.cor, roughness: 0.4, metalness: 0.3 })
      )
      moldura.position.set(x, 0.05, z)
      moldura.rotation.y = -def.angulo - Math.PI / 2
      grupo.add(moldura)

      const vao = new THREE.Mesh(
        new THREE.CircleGeometry(1.45, 28, 0, Math.PI),
        new THREE.MeshBasicMaterial({
          color: def.cor,
          transparent: true,
          opacity: 0.17,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      )
      vao.position.copy(moldura.position)
      vao.quaternion.copy(moldura.quaternion)
      grupo.add(vao)

      const placa = letreiro(def.rotulo, `#${def.cor.toString(16).padStart(6, '0')}`, 3.4)
      placa.position.set(x * 0.93, 2.45, z * 0.93)
      placa.rotation.y = -def.angulo - Math.PI / 2
      grupo.add(placa)

      const luz = new THREE.PointLight(def.cor, 240, 14, 1.6)
      luz.position.set(x * 0.82, 1.6, z * 0.82)
      grupo.add(luz)

      const caixa = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, 1.2, z),
        new THREE.Vector3(3, 2.6, 3)
      )
      portais.push({ destino: def.destino, rotulo: def.rotulo, caixa })
    }

    return {
      grupo,
      colliders,
      telao: null,
      spawn: new THREE.Vector3(0, 0, 0),
      olhar: Math.PI / 2,
      portais
    }
  }
}
