import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

const PORT = process.env.PORT || 3491
const TICK = 1000 / 15
const LIMITE = 40
const SILENCIO = 20000
const TIPOS = ['et', 'porco']

const jogadores = new Map()
let proximoId = 1

const http = createServer((req, res) => {
  if (req.url === '/saude') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, jogadores: jogadores.size }))
    return
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
  res.end(`sala da noturna bar, ${jogadores.size} na casa`)
})

const wss = new WebSocketServer({ server: http })

function envia(socket, dados) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(dados))
}

wss.on('connection', (socket) => {
  if (jogadores.size >= LIMITE) {
    envia(socket, { t: 'cheio' })
    socket.close()
    return
  }

  const id = proximoId++
  const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)]
  const jogador = { id, tipo, x: -18, y: 0, z: 0, yaw: -Math.PI / 2, visto: Date.now() }
  jogadores.set(id, { jogador, socket })

  envia(socket, {
    t: 'bemvindo',
    id,
    tipo,
    outros: [...jogadores.values()].filter((p) => p.jogador.id !== id).map((p) => p.jogador)
  })

  for (const { socket: outro, jogador: dono } of jogadores.values()) {
    if (dono.id !== id) envia(outro, { t: 'entrou', jogador })
  }

  socket.on('message', (raw) => {
    let dados
    try {
      dados = JSON.parse(raw)
    } catch (erro) {
      return
    }
    if (dados.t !== 'pos') return
    const alvo = jogadores.get(id)
    if (!alvo) return
    const p = alvo.jogador
    if (![dados.x, dados.y, dados.z, dados.yaw].every((v) => Number.isFinite(v))) return
    p.x = dados.x
    p.y = dados.y
    p.z = dados.z
    p.yaw = dados.yaw
    p.visto = Date.now()
  })

  const sair = () => {
    if (!jogadores.has(id)) return
    jogadores.delete(id)
    for (const { socket: outro } of jogadores.values()) envia(outro, { t: 'saiu', id })
  }
  socket.on('close', sair)
  socket.on('error', sair)
})

setInterval(() => {
  if (jogadores.size === 0) return
  const agora = Date.now()
  for (const [id, { jogador, socket }] of jogadores) {
    if (agora - jogador.visto > SILENCIO) {
      socket.terminate()
      jogadores.delete(id)
      for (const { socket: outro } of jogadores.values()) envia(outro, { t: 'saiu', id })
    }
  }
  const estado = [...jogadores.values()].map(({ jogador }) => ({
    id: jogador.id,
    tipo: jogador.tipo,
    x: Math.round(jogador.x * 100) / 100,
    y: Math.round(jogador.y * 100) / 100,
    z: Math.round(jogador.z * 100) / 100,
    yaw: Math.round(jogador.yaw * 1000) / 1000
  }))
  for (const { socket, jogador } of jogadores.values()) {
    envia(socket, { t: 'estado', jogadores: estado.filter((p) => p.id !== jogador.id) })
  }
}, TICK)

http.listen(PORT, () => {
  console.log(`sala ouvindo na porta ${PORT}`)
})
