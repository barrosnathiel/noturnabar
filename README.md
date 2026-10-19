# Noturna Bar

Casa de show 3D em primeira pessoa que roda no navegador. Um galpão fechado de 40x25m com palco, pista rebaixada, mezanino em U, bar e hall, para andar livremente. Toda a geometria é gerada em código, sem nenhum asset externo.

Está no ar nos dois, publicados a cada push na `main`:

- https://noturnabar.vercel.app
- https://barrosnathiel.github.io/noturnabar/

O build usa caminho relativo (`base: './'`) justamente porque um serve na raiz do domínio e o outro numa subpasta.

## Rodando

```
npm install
npm run dev
```

Abre em http://localhost:3490.

## Controles

| Tecla | Ação |
|---|---|
| Clique na tela | trava o mouse |
| ESC | abre o menu; com o menu aberto, volta pro jogo |
| W A S D | andar |
| Shift | correr |
| Espaço | pular |
| 1, 2, 3 | dançar: balanço, mãos pro alto, solto |
| Botão direito, ou Control+clique | menu de dança em volta da mira |

## No celular

Funciona em paisagem. Em retrato a tela pede para girar o aparelho.

| Controle | Ação |
|---|---|
| Encostar na metade esquerda | o joystick nasce debaixo do dedo e você anda |
| Arrastar na metade direita | olhar |
| PULO | pular |
| CORRER | liga e desliga a corrida |
| Barra embaixo | escolhe a dança |
| TELA CHEIA | entra em tela cheia e trava a orientação |

O primeiro toque na tela já tenta entrar em tela cheia e travar em paisagem. No iPhone isso não existe: o Safari não deixa um site entrar em tela cheia, então o jeito de jogar sem as barras é Compartilhar e Adicionar à Tela de Início, que abre pelo manifest em paisagem.

## Lugares

O jogo nasce num lobby com dois portais: a casa de show e a arena. Atravessar troca de mundo na hora, sem recarregar. A arena é a céu aberto, com 80m de pista, telão de 28x11m e pilhas de som de 13m.

Para entrar direto num lugar: `?lugar=arena` ou `?lugar=casa`.

Para encher a pista de figurantes dançando: `?multidao=500` (vai até 800). Eles são locais, só seus — ninguém mais vê.

## Multiplayer

Quem entra ganha um avatar sorteado entre um ET e um porco, e vê os outros andando pela casa. A sala é um servidor Node com WebSocket em `server/`, publicado em https://noturnabar.onrender.com — ele hiberna sem tráfego, então a primeira conexão depois de um tempo parado leva até um minuto para acordar.

Para rodar a sala localmente: `npm start` dentro de `server/`, e abrir o jogo com `?sala=ws://localhost:3491`.

## Câmera

Primeira ou terceira pessoa, escolhido no menu do ESC e lembrado entre sessões. Em terceira pessoa a câmera fica atrás do seu avatar e encurta sozinha quando tem parede no caminho.

## Telão

O fundo do palco tem um telão tocando vídeo, e o volume acompanha a sua distância até as caixas de som: colado nelas é 100, no meio da pista 74, lá no hall 37. O som começa mudo e liga no primeiro clique ou toque, porque navegador nenhum deixa um site tocar som sozinho.

## Créditos

Quase tudo é geometria gerada em código. As exceções são quatro peças de cenário da arena (antena, caixotes e barril) do [Sci-Fi Essentials Kit](https://quaternius.com/packs/scifiessentialskit.html) do Quaternius, em CC0, usadas sem as texturas originais.

## Stack

Three.js e Vite, JavaScript puro. A colisão é própria: AABB contra um grid espacial, com step-up de 0.45m para escada e degrau. Sem engine de física.

## Escopo

`docs/PRD.md` define o que entra e o que fica de fora da v1, e `docs/SPEC.md` traz as dimensões do galpão, as regras de colisão e o orçamento de performance. Prints em `docs/prints/`.
