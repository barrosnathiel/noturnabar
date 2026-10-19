import * as THREE from 'three'

export function letreiro(texto, cor = '#dfe6f5', largura = 3.6) {
  const escala = 128
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = '600 128px ui-monospace, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = cor
  ctx.shadowBlur = 38
  ctx.fillStyle = cor
  ctx.fillText(texto.toUpperCase(), canvas.width / 2, canvas.height / 2)
  ctx.shadowBlur = 0
  ctx.fillText(texto.toUpperCase(), canvas.width / 2, canvas.height / 2)

  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4

  const altura = (largura * canvas.height) / canvas.width
  const malha = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshBasicMaterial({
      map: textura,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  )
  malha.userData.escala = escala
  return malha
}
