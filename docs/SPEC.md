# SPEC técnica — Casa de Show 3D (v1)

Documento fechado pela v1. O que não está aqui não entra sem atualizar o PRD.

## Stack
- Three.js instalado por npm (sem CDN)
- Vite como dev server e build
- JavaScript puro (ESM), sem TypeScript, sem React, sem engine de física
- Zero asset em arquivo: geometria, material e cor definidos em código
- Dev server na porta 3490

## Estrutura
```
casadeshow/
  index.html
  package.json
  vite.config.js
  docs/PRD.md
  docs/SPEC.md
  src/
    main.js              bootstrap, renderer, loop
    world/
      index.js           monta a cena e devolve a lista de colisores
      shell.js           piso, paredes, teto, vigas
      stage.js           palco, escada, caixas de som, treliça do palco
      mezzanine.js       lajes em U, guarda-corpo, duas escadas
      bar.js             balcão, banquetas, prateleira
      entrance.js        hall, catraca, porta, portas de banheiro e camarim
      materials.js       paleta e materiais compartilhados
      builder.js         acumula geometria por material, mergeia e junta os colisores
    player/
      controls.js        pointer lock, teclado, mouse, e a entrada de toque quando é celular
      touch.js           joystick, arraste de olhar, botões de pulo e corrida, tela cheia
      physics.js         gravidade, pulo, step-up
      collision.js       AABB do jogador contra a lista de colisores
    lighting/
      index.js           ambiente, serviço, refletores, fog
    hud/
      index.js           mira, FPS, ajuda
```

Sem comentário no código. O que precisar de explicação vai nesta spec.

## Coordenadas e dimensões
Origem no centro do piso da pista. Y é pra cima, em metros.

- Galpão: X de -20 a +20 (40m), Z de -12.5 a +12.5 (25m), pé-direito 12m
- Parede com 0.3m de espessura, colisor na face interna

| Área | X | Z | Y |
|---|---|---|---|
| Hall de entrada | -20 a -16 | -6 a 6 | 0 |
| Pista | -16 a 11 | -12.5 a 12.5 | 0 |
| Palco | 11 a 20 | -10 a 10 | topo em 1.2 |
| Escada do palco | 11 a 13 | -11.5 a -10 | 0 a 1.2 |
| Mezanino lateral A | -14 a 8 | 8.5 a 12.5 | laje em 4.0 |
| Mezanino lateral B | -14 a 8 | -12.5 a -8.5 | laje em 4.0 |
| Mezanino fundo | -16 a -14 | -12.5 a 12.5 | laje em 4.0 |
| Escada mezanino 1 | -14 a -11.5 | 1 a 7 | sobe de 0 a 4.0 |
| Escada mezanino 2 | -14 a -11.5 | -7 a -1 | sobe de 0 a 4.0 |
| Bar | -10 a -2 | 9.5 a 12.5 | balcão em 1.1 |

Pista rebaixada: o trecho X de 2 a 11, Z de -8 a 8, fica 0.4m abaixo do piso geral, com degrau de contorno. Resto do piso em Y=0.

As duas escadas do mezanino correm ao longo de Z, encostadas na laje do fundo, e desembarcam nela pela borda X=-14. Ficam fora do footprint das lajes laterais (Z 8.5 a 12.5 e -12.5 a -8.5), então nada passa por baixo de laje.

Guarda-corpo do mezanino: 1.1m de altura, em toda a borda interna das três lajes, com um vão de 2.5m em cada ponto de desembarque das escadas.

Treliça: uma sobre o palco (X 11 a 20, Y 9) e duas sobre a pista (X -2 e X 5, Y 9), atravessando em Z.

## Jogador
- Altura do olho 1.70m, cápsula aproximada por AABB de 0.6 x 1.8 x 0.6
- Andar 3.5 m/s, correr 6.5 m/s, aceleração com amortecimento (sem velocidade instantânea)
- Gravidade -22 m/s², pulo com velocidade inicial 6.2 m/s
- Olhar limitado a ±85° na vertical, sem limite na horizontal
- Spawn no hall, X -18, Z 0, olhando pro palco

### Controles
| Tecla | Ação |
|---|---|
| Clique na tela | trava o mouse |
| ESC | solta o mouse |
| W A S D | andar |
| Shift | correr |
| Espaço | pular |

## Celular

- Detecção por `navigator.maxTouchPoints > 0` e `(pointer: coarse)`. Só aí o `body` ganha a classe `touch` e os controles aparecem.
- Joystick analógico: a magnitude do deslocamento vira `input.scale`, que multiplica a velocidade, então dá para andar devagar. Zona morta de 0.14.
- Olhar: qualquer arraste que não comece dentro de `#touch`. O handler checa `event.target instanceof Element` antes do `closest`, senão um evento cujo alvo não é elemento derruba o listener.
- Sem pointer lock no toque: o clique no canvas só pede a trava quando não é celular.
- Corrida é alternada por toque, não segurada: o polegar direito está ocupado olhando.
- Orientação: classe `portrait` no `body` sincronizada no resize e no orientationchange; em retrato a tela de aviso cobre o jogo. Travar a orientação só funciona dentro de tela cheia, daí o botão.
- `pixelRatio` cai para 1.25 em ponteiro grosso.

## Colisão
Sem biblioteca de física. O mundo devolve uma lista de AABBs (`THREE.Box3`) e o jogador testa contra ela.

- Resolução por eixo separado: move em X, resolve; move em Z, resolve; move em Y, resolve. Evita travar em quina.
- Grid espacial simples (células de 4m) pra não testar todos os colisores por frame.
- **Step-up**: antes de bloquear um movimento horizontal, se o topo do colisor estiver até 0.45m acima dos pés, o jogador sobe em vez de parar. Isso resolve escada, degrau da pista rebaixada e subida no palco sem rampa invisível.
- Escada é montada como degraus reais, cada degrau um colisor: 0.2m x 0.28m no palco, 0.2m x 0.3m no mezanino. O step-up faz a subida; a gravidade faz a descida. Cada escada termina num patamar no nível de destino, largo o bastante para o jogador virar sem cair.
- O step-up sobe até o topo mais alto alcançável entre os colisores tocados, e só com os pés apoiados: no ar ele fica desligado, senão dá para escalar o guarda-corpo no ápice do pulo.
- Contato cujo topo está no nível dos pés (piso) ou cuja base está acima da cabeça (laje, teto) não gera empurrão horizontal; é contato de chão ou de teto e se resolve no eixo Y.
- O empurrão horizontal sai pelo eixo de menor penetração, não pela direção do movimento. Empurrar pelo eixo do movimento joga o jogador para fora do prédio quando ele raspa a quina de um colisor comprido.
- Chão: raycast pra baixo não é usado; o próprio AABB do piso e das lajes resolve o apoio. Flag `onGround` vira true quando a resolução em Y empurra o jogador pra cima.
- Teto e lajes do mezanino bloqueiam o pulo normalmente.

## Iluminação
Orçamento fixo: no máximo 4 luzes projetando sombra. O resto não projeta.

- `AmbientLight` bem baixa (0x1a1a22, intensidade 0.25)
- `HemisphereLight` fraca pra não deixar o que está na sombra totalmente preto
- 6 `SpotLight` na treliça do palco apontados pro palco, cores frias e quentes alternadas, com cone visível por `ConeGeometry` de material aditivo e transparente (não é volumetria de verdade)
- 4 `PointLight` de serviço espalhados pela pista, intensidade baixa, sem sombra
- Luz do bar: 2 pontos quentes sobre o balcão, sem sombra
- Sombra: só os 2 spots centrais do palco e 1 ponto da pista, shadow map 1024
- Intensidade em unidades físicas (iluminância cai com o quadrado da distância): spot do palco 2600, ponto de serviço na casa dos 350 a 420, bar 42. Mexer nesses números sem considerar `distance` e `decay` apaga ou estoura a cena.
- `FogExp2` com densidade 0.012, cor igual ao fundo

## Materiais
`MeshStandardMaterial` em tudo. Paleta base:

- Piso da pista: cinza escuro fosco, roughness alta
- Palco: preto fosco
- Paredes: cinza chumbo, um tom mais claro que o piso
- Estrutura metálica (vigas, treliça, guarda-corpo): metalness 0.8, roughness 0.4
- Bar: madeira escura (cor chapada) + topo do balcão mais claro
- Caixas de som: preto com grade escura

Variação de cor é feita por luz, não por textura.

## Performance
Alvo: 60fps, e nunca abaixo de 45 olhando o galpão inteiro do mezanino.

- `InstancedMesh` pro que repete: banquetas, refletores, degraus, pilares, garrafas da prateleira
- `BufferGeometryUtils.mergeGeometries` pra paredes, vigas e guarda-corpo
- Teto de draw calls: 150. Se passar, mergear mais antes de seguir.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`. Baixar para 1.5 economiza fill rate, mas serrilha as barras finas do guarda-corpo e da treliça, e isso aparece como fervilhamento ao girar a câmera. Só baixar se a performance pedir.
- Shadow map congelada: a cena é estática, então `shadowMap.autoUpdate = false` e um único `needsUpdate` na carga. Qualquer luz ou objeto que passe a se mover precisa reativar isso.
- `renderer.compileAsync` antes do primeiro frame, para não compilar shader no meio do giro de câmera
- Shadow map só onde a spec autoriza acima
- Sem postprocessing na v1 (bloom fica pra v2)

## HUD
DOM sobreposto ao canvas, sem lib.
- Mira: ponto de 4px no centro
- FPS: canto superior direito, média de 30 frames
- Ajuda: caixa centralizada com os controles, some no primeiro pointer lock e não volta

## Encerramento
Quando os 9 critérios de aceite do PRD passarem: dois prints (pista olhando pro palco, e do mezanino) e a v1 está fechada.
