const ALVO = 'https://www.youtube.com'
const TOLERANCIA = 0.45
const CONFERE = 5000
const ADIANTE = 0.25

function manda(iframe, func, args = []) {
  if (!iframe.contentWindow) return
  try {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), ALVO)
  } catch (erro) {
    void erro
  }
}

function escuta(iframe) {
  if (!iframe.contentWindow) return
  try {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'tela' }), ALVO)
  } catch (erro) {
    void erro
  }
}

export function sincronizarTelas(mestre, telas = []) {
  const iframes = telas.map((tela) => tela && tela.iframe).filter(Boolean)
  if (!iframes.length || !mestre || typeof mestre.tempo !== 'function') {
    return { parar: () => {}, atrasos: () => [] }
  }

  const tempos = new Map()
  let vivo = true

  function aoReceber(evento) {
    if (!vivo || !evento.origin.includes('youtube.com')) return
    const dono = iframes.find((iframe) => iframe.contentWindow === evento.source)
    if (!dono) return
    let dados
    try {
      dados = typeof evento.data === 'string' ? JSON.parse(evento.data) : evento.data
    } catch (erro) {
      return
    }
    const info = dados && dados.info
    if (!info || typeof info.currentTime !== 'number') return
    tempos.set(dono, info.currentTime)
  }

  window.addEventListener('message', aoReceber)

  function conferir() {
    if (!vivo) return
    const base = mestre.tempo()
    for (const iframe of iframes) {
      escuta(iframe)
      if (!Number.isFinite(base) || base <= 0) continue
      const agora = tempos.get(iframe)
      if (agora === undefined) {
        manda(iframe, 'setPlaybackQuality', ['small'])
        manda(iframe, 'seekTo', [base + ADIANTE, true])
        manda(iframe, 'playVideo')
        continue
      }
      if (Math.abs(agora - base) > TOLERANCIA) {
        manda(iframe, 'seekTo', [base + ADIANTE, true])
        manda(iframe, 'playVideo')
      }
    }
  }

  const relogio = setInterval(conferir, CONFERE)
  setTimeout(conferir, 2500)

  return {
    atrasos() {
      const base = mestre.tempo()
      return iframes.map((iframe) => {
        const agora = tempos.get(iframe)
        if (agora === undefined || !Number.isFinite(base)) return null
        return +(agora - base).toFixed(2)
      })
    },
    parar() {
      vivo = false
      clearInterval(relogio)
      window.removeEventListener('message', aoReceber)
      tempos.clear()
    }
  }
}
