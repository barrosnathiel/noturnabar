# Noturna Bar

Casa de show 3D em primeira pessoa que roda no navegador. Um galpão fechado de 40x25m com palco, pista rebaixada, mezanino em U, bar e hall, para andar livremente. Toda a geometria é gerada em código, sem nenhum asset externo.

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
| Joystick à esquerda | andar |
| Joystick à direita | girar a câmera, em velocidade constante |
| Arrastar na tela | olhar, para mira rápida |
| PULO | pular |
| CORRER | liga e desliga a corrida |
| TELA CHEIA | entra em tela cheia e trava a orientação |

O primeiro toque na tela já tenta entrar em tela cheia e travar em paisagem. No iPhone isso não existe: o Safari não deixa um site entrar em tela cheia, então o jeito de jogar sem as barras é Compartilhar e Adicionar à Tela de Início, que abre pelo manifest em paisagem.

## Stack

Three.js e Vite, JavaScript puro. A colisão é própria: AABB contra um grid espacial, com step-up de 0.45m para escada e degrau. Sem engine de física.

## Escopo

`docs/PRD.md` define o que entra e o que fica de fora da v1, e `docs/SPEC.md` traz as dimensões do galpão, as regras de colisão e o orçamento de performance. Prints em `docs/prints/`.
