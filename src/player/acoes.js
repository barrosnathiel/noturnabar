const ESTILOS = ['balanco', 'maos', 'solto']

export function createAcoes(touch) {
  const roda = document.getElementById('roda')
  const barra = document.getElementById('barra')
  const opcoes = [...document.querySelectorAll('#roda .op')]
  const pills = [...document.querySelectorAll('#barra .pill')]
  let atual = 'nada'
  let aberta = false
  let fixa = false
  let abertaEm = 0
  let alvo = 'nada'
  let dx = 0
  let dy = 0

  function marcar() {
    for (const pill of pills) pill.classList.toggle('on', pill.dataset.a === atual)
  }

  function definir(acao) {
    atual = atual === acao ? 'nada' : acao
    marcar()
  }

  function destacar() {
    const distancia = Math.hypot(dx, dy)
    if (distancia < 26) alvo = 'nada'
    else if (Math.abs(dx) > Math.abs(dy)) alvo = dx < 0 ? 'balanco' : 'solto'
    else alvo = dy < 0 ? 'maos' : 'nada'
    for (const op of opcoes) op.classList.toggle('sel', op.dataset.a === alvo)
  }

  function abrir() {
    aberta = true
    fixa = false
    abertaEm = performance.now()
    dx = 0
    dy = 0
    alvo = atual
    document.body.classList.add('roda')
    destacar()
  }

  function fechar(aplicar) {
    if (!aberta) return
    aberta = false
    fixa = false
    document.body.classList.remove('roda')
    if (aplicar) {
      atual = alvo
      marcar()
    }
  }

  window.addEventListener('contextmenu', (evento) => evento.preventDefault())

  const chamaMenu = (evento) =>
    evento.button === 2 || (evento.button === 0 && (evento.ctrlKey || evento.metaKey))

  window.addEventListener('mousedown', (evento) => {
    if (aberta && fixa) {
      evento.preventDefault()
      fechar(true)
      return
    }
    if (!chamaMenu(evento)) return
    evento.preventDefault()
    abrir()
  })

  window.addEventListener('mouseup', (evento) => {
    if (!aberta || fixa) return
    if (performance.now() - abertaEm < 260) {
      fixa = true
      return
    }
    fechar(true)
  })

  window.addEventListener('mousemove', (evento) => {
    if (!aberta) return
    dx += evento.movementX || 0
    dy += evento.movementY || 0
    destacar()
  })

  window.addEventListener('keydown', (evento) => {
    const indice = ['Digit1', 'Digit2', 'Digit3'].indexOf(evento.code)
    if (indice >= 0) definir(ESTILOS[indice])
    if (evento.code === 'Escape' && aberta) {
      fechar(false)
      return
    }
    if (evento.code === 'Digit0') {
      atual = 'nada'
      marcar()
    }
  })

  if (touch.supported) {
    for (const pill of pills) {
      pill.addEventListener('pointerdown', (evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        definir(pill.dataset.a)
      })
    }
  }

  function andou() {
    if (atual !== 'nada') {
      atual = 'nada'
      marcar()
    }
  }

  return { atual: () => atual, andou, aberta: () => aberta }
}
