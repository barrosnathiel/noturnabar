import * as THREE from 'three'
import { materials as M } from '../world/materials.js'
import { TRUSS_Y } from '../world/stage.js'

const SPOT_COLORS = [0xff4d6a, 0x4da6ff, 0xffb347, 0x9b5cff, 0x45e0a0, 0xff6b2c]

export function buildLighting(scene) {
  scene.fog = new THREE.FogExp2(0x07070a, 0.012)

  scene.add(new THREE.AmbientLight(0x161620, 0.13))
  const hemi = new THREE.HemisphereLight(0x2b3a4a, 0x0a0a0d, 0.15)
  hemi.position.set(0, 12, 0)
  scene.add(hemi)

  const bodies = []
  const bodyGeometry = new THREE.CylinderGeometry(0.16, 0.2, 0.42, 10)

  const positions = [
    [12.5, -6], [12.5, 0], [12.5, 6],
    [17, -6], [17, 0], [17, 6]
  ]

  positions.forEach(([x, z], i) => {
    const color = SPOT_COLORS[i]
    const light = new THREE.SpotLight(color, 2600, 34, THREE.MathUtils.degToRad(22), 0.5, 1.4)
    light.position.set(x, TRUSS_Y - 0.45, z)
    light.target.position.set(x > 14 ? 14 : 16, 1.2, z * 0.45)
    light.castShadow = i === 1 || i === 4
    if (light.castShadow) {
      light.shadow.mapSize.set(1024, 1024)
      light.shadow.camera.near = 1
      light.shadow.camera.far = 30
      light.shadow.bias = -0.0015
    }
    scene.add(light)
    scene.add(light.target)

    const direction = new THREE.Vector3().subVectors(light.target.position, light.position)
    const length = direction.length()
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(length * Math.tan(light.angle) * 0.9, length, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        dithering: true,
        side: THREE.DoubleSide
      })
    )
    cone.position.copy(light.position).addScaledVector(direction, 0.5)
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction.clone().normalize())
    scene.add(cone)

    bodies.push(new THREE.Matrix4().makeTranslation(x, TRUSS_Y - 0.45, z))
  })

  const fixtures = new THREE.InstancedMesh(bodyGeometry, M.lampBody, bodies.length)
  bodies.forEach((matrix, i) => fixtures.setMatrixAt(i, matrix))
  scene.add(fixtures)

  const service = [
    [-12, 0, 0.55, true],
    [-4, 0, 0.5, false],
    [4, 3, 0.5, false],
    [2, -5, 0.45, false]
  ]
  service.forEach(([x, z, intensity, shadow]) => {
    const light = new THREE.PointLight(0x8fa3c8, intensity * 330, 20, 1.8)
    light.position.set(x, 7.2, z)
    light.castShadow = shadow
    if (shadow) {
      light.shadow.mapSize.set(1024, 1024)
      light.shadow.bias = -0.002
    }
    scene.add(light)
  })

  for (const x of [-8.5, -3.5]) {
    const light = new THREE.PointLight(0xffb066, 42, 9, 1.9)
    light.position.set(x, 2.6, 10.6)
    scene.add(light)
  }

  const guides = [
    [-12.75, 5.4, 4.5],
    [-12.75, 5.4, -4.5],
    [12.6, 2.6, -10.75],
    [-15, 5.2, 0]
  ]
  for (const [x, y, z] of guides) {
    const light = new THREE.PointLight(0x7f94b8, 26, 8, 1.9)
    light.position.set(x, y, z)
    scene.add(light)
  }

  const hall = new THREE.PointLight(0x9fb0c8, 120, 13, 1.8)
  hall.position.set(-18, 4, 0)
  scene.add(hall)
}
