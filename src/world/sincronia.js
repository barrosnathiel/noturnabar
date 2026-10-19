const TOLERANCIA = 0.4
const INTERVALO = 4000

function comAPI(aoPronto) {
  if (window.YT && window.YT.Player) {
    aoPronto()
    return
  }
  const anterior = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    if (typeof anterior === 'function') anterior()
    aoPronto()
  }
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }
}

export function sincronizarTelas(mestre, telas = []) {
  const iframes = telas.map((tela) => tela && tela.iframe).filter(Boolean)
  if (!iframes.length || !mestre || typeof mestre.tempo !== 'function') {
    return { parar: () => {} }
  }

  const jogadores = []
  let timer = null
  let vivo = true

  function alinhar(jogador, forcar) {
    const base = mestre.tempo()
    if (!Number.isFinite(base) || base <= 0) return
    try {
      if (jogador.getPlayerState() !== 1) jogador.playVideo()
      const diferenca = jogador.getCurrentTime() - base
      if (forcar || Math.abs(diferenca) > TOLERANCIA) {
        jogador.seekTo(base + 0.1, true)
        jogador.playVideo()
      }
    } catch (erro) {
      void erro
    }
  }

  comAPI(() => {
    if (!vivo) return
    for (const iframe of iframes) {
      const jogador = new window.YT.Player(iframe, {
        events: {
          onReady: () => {
            if (!vivo) return
            try {
              jogador.mute()
              jogador.playVideo()
            } catch (erro) {
              void erro
            }
            jogadores.push(jogador)
            alinhar(jogador, true)
            setTimeout(() => alinhar(jogador, true), 1200)
          }
        }
      })
    }
    timer = setInterval(() => {
      for (const jogador of jogadores) alinhar(jogador, false)
    }, INTERVALO)
  })

  return {
    estados() {
      return jogadores.map((jogador) => {
        try {
          return jogador.getPlayerState()
        } catch (erro) {
          return -99
        }
      })
    },
    tempos() {
      return jogadores.map((jogador) => {
        try {
          return jogador.getCurrentTime()
        } catch (erro) {
          return NaN
        }
      })
    },
    parar() {
      vivo = false
      if (timer) clearInterval(timer)
      timer = null
      jogadores.length = 0
    }
  }
}
