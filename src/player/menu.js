const CHAVE = 'noturnabar.camera'

export function createMenu(aoTrocarCamera, aoVoltar) {
  const botoes = [...document.querySelectorAll('#menu button[data-cam]')]
  const voltar = document.getElementById('voltar')
  const abrirBotao = document.getElementById('abrirmenu')
  let aberto = false

  let modo = 'primeira'
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo === 'terceira' || salvo === 'primeira') modo = salvo
  } catch (erro) {
    void erro
  }

  function marcar() {
    for (const botao of botoes) botao.classList.toggle('on', botao.dataset.cam === modo)
  }

  function definir(novo) {
    modo = novo
    marcar()
    try {
      localStorage.setItem(CHAVE, modo)
    } catch (erro) {
      void erro
    }
    aoTrocarCamera(modo)
  }

  function abrir() {
    aberto = true
    document.body.classList.add('menu')
  }

  function fechar() {
    aberto = false
    document.body.classList.remove('menu')
  }

  for (const botao of botoes) {
    botao.addEventListener('click', () => definir(botao.dataset.cam))
  }
  function retomar() {
    if (!aberto) return
    fechar()
    aoVoltar()
  }

  voltar.addEventListener('click', retomar)

  const fundo = document.getElementById('menu')
  if (fundo) {
    fundo.addEventListener('click', (evento) => {
      if (evento.target === fundo) retomar()
    })
  }

  window.addEventListener(
    'keydown',
    (evento) => {
      if (evento.code !== 'Escape' || !aberto) return
      evento.preventDefault()
      retomar()
    },
    true
  )
  if (abrirBotao) {
    abrirBotao.addEventListener('pointerdown', (evento) => {
      evento.preventDefault()
      evento.stopPropagation()
      abrir()
    })
  }

  marcar()
  aoTrocarCamera(modo)

  return { abrir, fechar, aberto: () => aberto, modo: () => modo }
}
