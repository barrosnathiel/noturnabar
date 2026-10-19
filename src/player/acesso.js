import { sessao, cadastrar, entrar, sair, apelido } from './conta.js'

export function createAcesso(aoMudar) {
  const chip = document.getElementById('chipConta')
  const painel = document.getElementById('acesso')
  const abas = [...document.querySelectorAll('#acesso .aba')]
  const campoEmail = document.getElementById('email')
  const campoSenha = document.getElementById('senha')
  const botao = document.getElementById('confirmar')
  const aviso = document.getElementById('avisoAcesso')

  let modo = 'entrar'
  let ocupado = false

  function marcar() {
    for (const aba of abas) aba.classList.toggle('on', aba.dataset.modo === modo)
    botao.textContent = modo === 'entrar' ? 'ENTRAR' : 'CRIAR CONTA'
    aviso.textContent = ''
  }

  function mostrarChip() {
    const conta = sessao()
    chip.textContent = conta ? `${apelido(conta.email)} · SAIR` : 'ENTRAR NA CONTA'
  }

  function abrir() {
    painel.classList.add('visivel')
    campoEmail.focus()
  }

  function fechar() {
    painel.classList.remove('visivel')
    if (document.activeElement && painel.contains(document.activeElement)) {
      document.activeElement.blur()
    }
  }

  async function confirmar() {
    if (ocupado) return
    ocupado = true
    botao.disabled = true
    const acao = modo === 'entrar' ? entrar : cadastrar
    const resposta = await acao(campoEmail.value, campoSenha.value)
    ocupado = false
    botao.disabled = false
    if (resposta.erro) {
      aviso.textContent = resposta.erro
      return
    }
    campoSenha.value = ''
    fechar()
    mostrarChip()
    aoMudar(resposta.conta)
  }

  chip.addEventListener('click', () => {
    if (sessao()) {
      sair()
      mostrarChip()
      aoMudar(null)
      return
    }
    if (painel.classList.contains('visivel')) fechar()
    else abrir()
  })

  for (const aba of abas) {
    aba.addEventListener('click', () => {
      modo = aba.dataset.modo
      marcar()
    })
  }

  botao.addEventListener('click', confirmar)
  for (const campo of [campoEmail, campoSenha]) {
    campo.addEventListener('keydown', (evento) => {
      if (evento.code === 'Escape') {
        campo.blur()
        fechar()
        return
      }
      evento.stopPropagation()
      if (evento.code === 'Enter' || evento.code === 'NumpadEnter') confirmar()
    })
  }

  marcar()
  mostrarChip()

  return { conta: sessao, atualizar: mostrarChip, fechar }
}
