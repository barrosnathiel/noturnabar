import * as THREE from 'three'
import { buildWorld } from '../world/index.js'
import { buildLighting } from '../lighting/index.js'
import { buildScreen } from '../world/screen.js'

export const casa = {
  nome: 'casa',
  titulo: 'casa de show',
  fundo: 0x07070a,
  construir() {
    const grupo = new THREE.Group()
    const { colliders } = buildWorld(grupo)
    buildLighting(grupo)
    const telao = buildScreen(grupo)
    return {
      grupo,
      colliders,
      telao,
      spawn: new THREE.Vector3(-18, 0, 0),
      olhar: -Math.PI / 2,
      portais: [
        {
          destino: 'lobby',
          rotulo: 'lobby',
          caixa: new THREE.Box3(
            new THREE.Vector3(-20, 0, -2.4),
            new THREE.Vector3(-19.2, 2.6, 2.4)
          )
        }
      ]
    }
  }
}
