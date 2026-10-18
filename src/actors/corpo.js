import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function tubo(a, b, r0, r1, radial = 12, altura = 6) {
  const eixo = new THREE.Vector3().subVectors(b, a)
  const comprimento = eixo.length()
  const geometry = new THREE.CylinderGeometry(r1, r0, comprimento, radial, altura, false)
  geometry.translate(0, comprimento / 2, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    eixo.clone().normalize()
  )
  geometry.applyQuaternion(quat)
  geometry.translate(a.x, a.y, a.z)
  return geometry
}

export function bolha(centro, raio, escala, radial = 14) {
  const geometry = new THREE.SphereGeometry(raio, radial, Math.round(radial * 0.8))
  if (escala) geometry.scale(escala.x, escala.y, escala.z)
  geometry.translate(centro.x, centro.y, centro.z)
  return geometry
}

export function juntar(pecas) {
  const merged = mergeGeometries(pecas, false)
  pecas.forEach((peca) => peca.dispose())
  return merged
}

function distanciaAoSegmento(ponto, a, b, fora) {
  const ab = fora.ab.subVectors(b, a)
  const ap = fora.ap.subVectors(ponto, a)
  const comprimento = ab.lengthSq()
  const t = comprimento === 0 ? 0 : Math.max(0, Math.min(1, ap.dot(ab) / comprimento))
  fora.alvo.copy(a).addScaledVector(ab, t)
  return fora.alvo.distanceTo(ponto)
}

export function pesar(geometry, segmentos, suavidade = 4.5, corte = 1.9) {
  const posicoes = geometry.attributes.position
  const total = posicoes.count
  const indices = new Uint16Array(total * 4)
  const pesos = new Float32Array(total * 4)
  const ponto = new THREE.Vector3()
  const fora = { ab: new THREE.Vector3(), ap: new THREE.Vector3(), alvo: new THREE.Vector3() }
  const distancias = []

  for (let i = 0; i < total; i++) {
    ponto.fromBufferAttribute(posicoes, i)
    distancias.length = 0
    let menor = Infinity
    for (const seg of segmentos) {
      const d = distanciaAoSegmento(ponto, seg.a, seg.b, fora)
      if (d < menor) menor = d
      distancias.push({ osso: seg.osso, d })
    }
    const limite = (menor + 0.02) * corte
    const candidatos = distancias.filter((item) => item.d <= limite)
    for (const item of candidatos) item.peso = 1 / Math.pow(item.d + 0.012, suavidade)
    candidatos.sort((x, y) => y.peso - x.peso)
    const melhores = candidatos.slice(0, 4)
    const soma = melhores.reduce((acc, item) => acc + item.peso, 0)
    for (let k = 0; k < 4; k++) {
      const item = melhores[k]
      indices[i * 4 + k] = item ? item.osso : 0
      pesos[i * 4 + k] = item ? item.peso / soma : 0
    }
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(pesos, 4))
  return geometry
}
