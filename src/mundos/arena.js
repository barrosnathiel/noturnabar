import * as THREE from 'three'
import { createBuilder } from '../world/builder.js'
import { materials as M } from '../world/materials.js'
import { buildScreen } from '../world/screen.js'

const PALCO = { x0: 10, x1: 26, z0: -22, z1: 22, topo: 2.6 }
const PISTA = { x0: -52, x1: 26, z0: -34, z1: 34 }

function trelica(b, x, z, altura) {
  const s = 1.1
  for (const dx of [-s / 2, s / 2]) {
    for (const dz of [-s / 2, s / 2]) {
      b.box(0.16, altura, 0.16, x + dx, altura / 2, z + dz, M.truss, { collide: false })
    }
  }
  for (let y = 1.4; y < altura; y += 2.2) {
    b.box(s, 0.1, 0.1, x, y, z - s / 2, M.truss, { collide: false })
    b.box(s, 0.1, 0.1, x, y, z + s / 2, M.truss, { collide: false })
    b.box(0.1, 0.1, s, x - s / 2, y, z, M.truss, { collide: false })
    b.box(0.1, 0.1, s, x + s / 2, y, z, M.truss, { collide: false })
  }
  b.collider([x - 0.8, 0, z - 0.8], [x + 0.8, altura, z + 0.8])
}

function pilhaDeSom(b, x, z) {
  for (let i = 0; i < 9; i++) {
    const largura = 2.6 - i * 0.07
    b.box(2.2, 1.35, largura, x, 3.2 + i * 1.38, z, M.speaker, { collide: false })
    b.box(0.08, 1.1, largura - 0.3, x - 1.16, 3.2 + i * 1.38, z, M.grille, { collide: false })
  }
  b.box(2.6, 3.2, 3, x, 1.6, z, M.darkMetal)
  b.collider([x - 1.3, 0, z - 1.6], [x + 1.3, 16, z + 1.6])
}

export const arena = {
  nome: 'arena',
  titulo: 'arena',
  fundo: 0x05070e,
  construir() {
    const grupo = new THREE.Group()
    const b = createBuilder()

    b.box(PISTA.x1 - PISTA.x0 + 20, 0.6, PISTA.z1 - PISTA.z0 + 20, (PISTA.x0 + PISTA.x1) / 2 - 10, -0.3, 0, M.pit)
    b.box(PALCO.x1 - PALCO.x0, PALCO.topo, PALCO.z1 - PALCO.z0, (PALCO.x0 + PALCO.x1) / 2, PALCO.topo / 2, 0, M.stage)
    b.box(0.2, 0.14, PALCO.z1 - PALCO.z0, PALCO.x0 - 0.1, PALCO.topo - 0.07, 0, M.stageEdge, { collide: false })

    for (const z of [-28, 28]) {
      b.box(78, 1.1, 0.22, -13, 0.55, z, M.darkMetal)
    }
    b.box(0.22, 1.1, 57, -51, 0.55, 0, M.darkMetal)
    b.box(0.22, 1.2, 44, 5.5, 0.6, 0, M.metal)
    b.collider([-56, 0, -40], [-52, 24, 40])
    b.collider([26, 0, -40], [30, 24, 40])
    b.collider([-56, 0, -40], [30, 24, -34])
    b.collider([-56, 0, 34], [30, 24, 40])

    for (const z of [-24.5, 24.5]) {
      trelica(b, 9, z, 30)
      trelica(b, 25, z, 30)
      b.box(17, 0.5, 0.5, 17, 29.4, z, M.truss, { collide: false })
    }
    for (const x of [12, 17, 22]) {
      b.box(0.4, 0.4, 50, x, 28.6, 0, M.truss, { collide: false })
    }

    pilhaDeSom(b, 7, -20)
    pilhaDeSom(b, 7, 20)

    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      b.box(0.5, 9, 0.5, Math.cos(a) * 3, 4.5, Math.sin(a) * 3, M.darkMetal, { collide: false })
    }

    const colliders = b.commit(grupo)

    const telao = buildScreen(grupo, {
      largura: 28,
      altura: 11,
      centro: new THREE.Vector3(25.4, 12.5, 0),
      moldura: 1.1,
      brilho: 420
    })
    for (const lado of [-14.5, 14.5]) {
      buildScreen(grupo, {
        largura: 10,
        altura: 5.6,
        centro: new THREE.Vector3(25.4, 9, lado),
        moldura: 0.6,
        brilho: 120
      })
    }

    grupo.add(new THREE.AmbientLight(0x141a28, 0.22))
    const ceu = new THREE.HemisphereLight(0x222d44, 0x070910, 0.3)
    ceu.position.set(0, 40, 0)
    grupo.add(ceu)

    const cores = [0xff4d6a, 0x4da6ff, 0xffb347, 0x9b5cff, 0x45e0a0, 0xff6b2c]
    cores.forEach((cor, i) => {
      const spot = new THREE.SpotLight(cor, 2600, 60, THREE.MathUtils.degToRad(15), 0.6, 1.7)
      spot.position.set(13 + (i % 3) * 5, 28, -20 + i * 8)
      spot.target.position.set(-6 - (i % 3) * 8, 0, -16 + i * 6)
      grupo.add(spot)
      grupo.add(spot.target)

      const comprimento = spot.position.distanceTo(spot.target.position)
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(comprimento * Math.tan(spot.angle) * 0.85, comprimento, 14, 1, true),
        new THREE.MeshBasicMaterial({
          color: cor,
          transparent: true,
          opacity: 0.035,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          dithering: true,
          side: THREE.DoubleSide
        })
      )
      const rumo = new THREE.Vector3().subVectors(spot.target.position, spot.position)
      cone.position.copy(spot.position).addScaledVector(rumo, 0.5)
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), rumo.clone().normalize())
      grupo.add(cone)
    })

    const palcoLuz = new THREE.PointLight(0xbfd4ff, 420, 34, 1.8)
    palcoLuz.position.set(18, 9, 0)
    grupo.add(palcoLuz)

    const estrelas = new THREE.BufferGeometry()
    const pontos = []
    for (let i = 0; i < 420; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 70 + Math.random() * 40
      pontos.push(Math.cos(a) * r, 26 + Math.random() * 60, Math.sin(a) * r)
    }
    estrelas.setAttribute('position', new THREE.Float32BufferAttribute(pontos, 3))
    grupo.add(
      new THREE.Points(
        estrelas,
        new THREE.PointsMaterial({ color: 0xcdd8f0, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.75 })
      )
    )

    return {
      grupo,
      colliders,
      telao,
      spawn: new THREE.Vector3(-34, 0, 0),
      olhar: -Math.PI / 2,
      portais: [
        {
          destino: 'lobby',
          rotulo: 'lobby',
          caixa: new THREE.Box3(
            new THREE.Vector3(-50, 0, -3),
            new THREE.Vector3(-47, 3, 3)
          )
        }
      ]
    }
  }
}
