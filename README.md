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
| ESC | solta o mouse |
| W A S D | andar |
| Shift | correr |
| Espaço | pular |

## No celular

Funciona em paisagem. Em retrato a tela pede para girar o aparelho.

| Controle | Ação |
|---|---|
| Encostar na metade esquerda | o joystick nasce debaixo do dedo e você anda |
| Arrastar na metade direita | olhar |
| PULO | pular |
| CORRER | liga e desliga a corrida |
| TELA CHEIA | entra em tela cheia e trava a orientação |

O primeiro toque na tela já tenta entrar em tela cheia e travar em paisagem. No iPhone isso não existe: o Safari não deixa um site entrar em tela cheia, então o jeito de jogar sem as barras é Compartilhar e Adicionar à Tela de Início, que abre pelo manifest em paisagem.

## Multiplayer

Quem entra ganha um avatar sorteado entre um ET e um porco, e vê os outros andando pela casa. A sala é um servidor Node com WebSocket em `server/`, publicado em https://noturnabar.onrender.com — ele hiberna sem tráfego, então a primeira conexão depois de um tempo parado leva até um minuto para acordar.

Para rodar a sala localmente: `npm start` dentro de `server/`, e abrir o jogo com `?sala=ws://localhost:3491`.

## Telão

O fundo do palco tem um telão tocando vídeo, e o volume acompanha a sua distância até as caixas de som: colado nelas é 100, no meio da pista 74, lá no hall 37. O som começa mudo e liga no primeiro clique ou toque, porque navegador nenhum deixa um site tocar som sozinho.

## Stack

Three.js e Vite, JavaScript puro. A colisão é própria: AABB contra um grid espacial, com step-up de 0.45m para escada e degrau. Sem engine de física.

## Escopo

`docs/PRD.md` define o que entra e o que fica de fora da v1, e `docs/SPEC.md` traz as dimensões do galpão, as regras de colisão e o orçamento de performance. Prints em `docs/prints/`.
