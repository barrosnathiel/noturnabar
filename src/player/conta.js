const CHAVE_CONTAS = 'noturnabar.contas'
const CHAVE_SESSAO = 'noturnabar.sessao'

function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : padrao
  } catch (erro) {
    void erro
    return padrao
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch (erro) {
    void erro
  }
}

async function embaralhar(senha) {
  const bytes = new TextEncoder().encode(`noturnabar:${senha}`)
  const resumo = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function sessao() {
  return ler(CHAVE_SESSAO, null)
}

export async function cadastrar(email, senha) {
  const chave = String(email || '').trim().toLowerCase()
  if (!chave || !senha) return { erro: 'preencha email e senha' }
  const contas = ler(CHAVE_CONTAS, {})
  if (contas[chave]) return { erro: 'esse email já tem conta' }
  contas[chave] = { senha: await embaralhar(senha), criada: Date.now() }
  gravar(CHAVE_CONTAS, contas)
  const nova = { email: chave, desde: Date.now() }
  gravar(CHAVE_SESSAO, nova)
  return { conta: nova }
}

export async function entrar(email, senha) {
  const chave = String(email || '').trim().toLowerCase()
  if (!chave || !senha) return { erro: 'preencha email e senha' }
  const contas = ler(CHAVE_CONTAS, {})
  const conta = contas[chave]
  if (!conta) return { erro: 'não achei conta com esse email' }
  if (conta.senha !== (await embaralhar(senha))) return { erro: 'senha errada' }
  const nova = { email: chave, desde: Date.now() }
  gravar(CHAVE_SESSAO, nova)
  return { conta: nova }
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE_SESSAO)
  } catch (erro) {
    void erro
  }
}

export function apelido(email) {
  return String(email || '').split('@')[0] || 'visitante'
}

const CHAVE_NOME = 'noturnabar.nome'

export function nome() {
  const conta = sessao()
  if (conta) return apelido(conta.email)
  return ler(CHAVE_NOME, '') || ''
}

export function guardarNome(valor) {
  const limpo = String(valor || '').trim().slice(0, 16)
  if (limpo) gravar(CHAVE_NOME, limpo)
  return limpo
}
