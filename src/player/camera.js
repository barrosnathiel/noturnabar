import * as THREE from 'three'

const DISTANCIA = 3.4
const ALTURA = 1.52
const MARGEM = 0.32

export function createCamera(camera, world) {
  const alvo = new THREE.Vector3()
  const desejada = new THREE.Vector3()
  const direcao = new THREE.Vector3()
  const caixa = new THREE.Box3()
  const raio = new THREE.Ray()
  const batida = new THREE.Vector3()
  const candidatos = []
  let modo = 'primeira'

  function distanciaLivre(origem, rumo, limite) {
    caixa.makeEmpty()
    caixa.expandByPoint(origem)
    caixa.expandByPoint(desejada)
    caixa.expandByScalar(MARGEM)
    raio.set(origem, rumo)
    let menor = limite
    for (const colisor of world.query(caixa, candidatos)) {
      const alvoCaixa = colisor.clone().expandByScalar(MARGEM)
      if (!raio.intersectBox(alvoCaixa, batida)) continue
      const d = origem.distanceTo(batida)
      if (d < menor) menor = d
    }
    return menor
  }

  function aplicar(posicao, olho, yaw, pitch) {
    if (modo === 'primeira') {
      camera.position.set(posicao.x, posicao.y + olho, posicao.z)
      return
    }
    alvo.set(posicao.x, posicao.y + ALTURA, posicao.z)
    direcao.set(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    )
    desejada.copy(alvo).addScaledVector(direcao, -DISTANCIA)
    const rumo = direcao.clone().negate()
    const livre = distanciaLivre(alvo, rumo, DISTANCIA)
    camera.position.copy(alvo).addScaledVector(rumo, Math.max(0.6, livre - 0.1))
  }

  return {
    aplicar,
    modo: () => modo,
    definir: (novo) => {
      modo = novo === 'terceira' ? 'terceira' : 'primeira'
    }
  }
}
