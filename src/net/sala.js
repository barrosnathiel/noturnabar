const PADRAO = 'wss://noturnabar.onrender.com'
const RECONEXAO = 4000

export function conectarSala(crowd, aoEntrar) {
  const url = new URLSearchParams(location.search).get('sala') || PADRAO
  if (!url) return { ativa: () => false, enviar: () => {}, status: () => 'sem servidor' }

  let socket = null
  let meuId = null
  let estado = 'conectando'
  let ultimoEnvio = 0
  const vistos = new Set()

  function abrir() {
    estado = 'conectando'
    socket = new WebSocket(url)

    socket.onopen = () => {
      estado = 'na sala'
    }

    socket.onmessage = (evento) => {
      let dados
      try {
        dados = JSON.parse(evento.data)
      } catch (erro) {
        return
      }
      if (dados.t === 'bemvindo') {
        meuId = dados.id
        aoEntrar(dados.tipo)
        for (const outro of dados.outros) {
          crowd.spawn(outro.id, outro.tipo)
          crowd.place(outro.id, outro.x, outro.y, outro.z, outro.yaw)
          vistos.add(outro.id)
        }
        return
      }
      if (dados.t === 'entrou') {
        crowd.spawn(dados.jogador.id, dados.jogador.tipo)
        vistos.add(dados.jogador.id)
        return
      }
      if (dados.t === 'saiu') {
        crowd.remove(dados.id)
        vistos.delete(dados.id)
        return
      }
      if (dados.t === 'cheio') {
        estado = 'casa cheia'
        return
      }
      if (dados.t !== 'estado') return

      const presentes = new Set()
      for (const outro of dados.jogadores) {
        if (outro.id === meuId) continue
        presentes.add(outro.id)
        if (!vistos.has(outro.id)) {
          crowd.spawn(outro.id, outro.tipo)
          vistos.add(outro.id)
        }
        crowd.place(outro.id, outro.x, outro.y, outro.z, outro.yaw)
      }
      for (const id of [...vistos]) {
        if (presentes.has(id)) continue
        crowd.remove(id)
        vistos.delete(id)
      }
    }

    const cair = () => {
      if (estado === 'casa cheia') return
      estado = 'reconectando'
      for (const id of vistos) crowd.remove(id)
      vistos.clear()
      setTimeout(abrir, RECONEXAO)
    }
    socket.onclose = cair
    socket.onerror = () => socket.close()
  }

  abrir()

  function enviar(position, yaw) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    const agora = performance.now()
    if (agora - ultimoEnvio < 66) return
    ultimoEnvio = agora
    socket.send(
      JSON.stringify({
        t: 'pos',
        x: Math.round(position.x * 100) / 100,
        y: Math.round(position.y * 100) / 100,
        z: Math.round(position.z * 100) / 100,
        yaw: Math.round(yaw * 1000) / 1000
      })
    )
  }

  return { ativa: () => estado === 'na sala', enviar, status: () => estado }
}
