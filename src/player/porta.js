import { CHAVES } from './chaves.js'

const GUARDADA = 'noturnabar.chave'

async function resumo(chave) {
  const bytes = new TextEncoder().encode(`noturnabar:${chave}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function arrumar(bruto) {
  return String(bruto || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(.{4})(?=.)/g, '$1-')
    .slice(0, 14)
}

export async function conferir(chave) {
  const limpa = arrumar(chave)
  if (limpa.length < 14) return false
  return CHAVES.includes(await resumo(limpa))
}

export function abrirPorta(aoPassar) {
  const tela = document.getElementById('porta')
  const campo = document.getElementById('chave')
  const botao = document.getElementById('destravar')
  const aviso = document.getElementById('avisoChave')

  async function liberar(chave) {
    try {
      localStorage.setItem(GUARDADA, chave)
    } catch (erro) {
      void erro
    }
    tela.remove()
    aoPassar()
  }

  async function tentar() {
    const limpa = arrumar(campo.value)
    botao.disabled = true
    const vale = await conferir(limpa)
    botao.disabled = false
    if (!vale) {
      aviso.textContent = 'essa chave não abre'
      campo.select()
      return
    }
    liberar(limpa)
  }

  campo.addEventListener('input', () => {
    const cursorNoFim = campo.selectionStart === campo.value.length
    campo.value = arrumar(campo.value)
    if (cursorNoFim) campo.setSelectionRange(campo.value.length, campo.value.length)
    aviso.textContent = ''
  })

  campo.addEventListener('keydown', (evento) => {
    if (evento.code === 'Escape') {
      campo.blur()
      return
    }
    evento.stopPropagation()
    if (evento.code === 'Enter' || evento.code === 'NumpadEnter') tentar()
  })

  botao.addEventListener('click', tentar)

  let salva = ''
  try {
    salva = localStorage.getItem(GUARDADA) || ''
  } catch (erro) {
    void erro
  }
  if (salva) {
    conferir(salva).then((vale) => {
      if (vale) liberar(salva)
      else campo.focus()
    })
    return
  }
  campo.focus()
}
