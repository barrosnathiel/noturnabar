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
- A tela é dividida ao meio. Toque na metade esquerda faz o joystick aparecer sob o dedo e anda; arraste na metade direita olha. Nenhum controle de movimento tem posição fixa: joystick fixo obriga o polegar a procurar o círculo.
- A magnitude do deslocamento do joystick vira `input.scale`, que multiplica a velocidade.
- `controls.sample` recebe o `dt` por causa de `rate`, que hoje fica zerado; era do joystick de olhar, removido a pedido. O handler checa `event.target instanceof Element` antes do `closest`, senão um evento cujo alvo não é elemento derruba o listener.
- Sem pointer lock no toque: o clique no canvas só pede a trava quando não é celular.
- Corrida é alternada por toque, não segurada: o polegar direito está ocupado olhando.
- Orientação: classe `portrait` no `body` sincronizada no resize e no orientationchange; em retrato a tela de aviso cobre o jogo. Travar a orientação só funciona dentro de tela cheia, daí o botão.
- `pixelRatio` cai para 1.25 em ponteiro grosso.
- O primeiro toque tenta tela cheia e trava a orientação em paisagem, com até três tentativas: pedir tela cheia exige gesto do usuário, então não dá para fazer isso na carga da página.
- iOS não tem `requestFullscreen` para elementos: o botão vira uma instrução para adicionar à tela de início. O `manifest.json` declara `display: fullscreen` e `orientation: landscape`, que é o que resolve o caso no iPhone.

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

## Mundos

- Cada lugar é um módulo em `mundos/` com `construir()`, que devolve o grupo, os colisores, o spawn, o telão e os portais. Nada é adicionado à cena direto: tudo pendura num `Group`, que é o que permite descartar o mundo inteiro de uma vez.
- O colisor é trocado a quente. `main` guarda um wrapper que delega para o mundo atual, então o jogador e a câmera seguem apontando para o mesmo objeto a vida toda.
- Ao descartar, as geometrias são liberadas e os elementos DOM dos `CSS3DObject` removidos à mão; sem isso o iframe do telão fica órfão no documento.
- Portal é uma `Box3`. Ao entrar num mundo o jogador fica imune até sair de qualquer caixa de portal, senão ele renasce dentro do portal de volta e pinga entre os dois mundos.
- `?lugar=arena` entra direto, útil para desenvolver sem atravessar o lobby.

## Sala

Front estático na Vercel, sala num processo Node no Render. No plano gratuito o Render hiberna depois de ~15 minutos sem tráfego, então a primeira conexão demora a acordar; é por isso que o front não mora lá.

- `server/index.js`: WebSocket sobre um http que responde em `/` e `/saude`. O Render só considera o serviço no ar se houver porta HTTP viva.
- Ao conectar, o servidor atribui id e sorteia o avatar; o cliente não escolhe. Também manda a lista de quem já estava na casa.
- O cliente envia a própria posição no máximo 15 vezes por segundo; o servidor rebate o estado na mesma cadência, sempre sem o registro do próprio destinatário — por isso ninguém vê o próprio avatar.
- `crowd.place` guarda a posição alvo e `crowd.update` interpola até lá, senão o movimento sairia aos pulos de pacote em pacote.
- O yaw que trafega é o da câmera, que olha para -Z, mas os avatares são montados com o rosto para +Z. Por isso `crowd` soma meia volta ao aplicar a rotação. Sem isso todo mundo aparece de costas exatamente quando está de frente.
- O lugar viaja junto com a posição e o cliente só mostra quem está no mesmo lugar. Sem isso, quem está na arena vê gente andando no vazio com as coordenadas da casa.
- Posição com número não finito é descartada no servidor, quem fica 20 segundos sem mandar nada é desconectado, e a sala para em 40 pessoas.
- `src/net/sala.js` tem a constante `PADRAO` com a URL do servidor; `?sala=ws://...` sobrescreve para testar local. Com a constante vazia o jogo roda sozinho, sem rede.

## Câmera e menu

- `player/camera.js` tem os dois modos. Em terceira pessoa a câmera fica 3,4m atrás e 1,52m acima, na direção oposta ao olhar, e encurta quando há parede no caminho: um raio do ombro até a posição desejada contra os mesmos colisores do mundo, com margem de 0,32m. Sem isso a câmera entra na parede e mostra o lado de fora.
- O jogador ganha o próprio avatar, escondido em primeira pessoa — visível, a cabeça taparia a tela.
- O menu abre quando o pointer lock cai, que é o que o ESC já faz. Abrir só depois da primeira entrada, senão ele aparece na carga da página. No celular, onde não existe ESC, há um botão MENU no topo.
- A escolha de câmera fica em `localStorage`; toda leitura e escrita vai em try/catch porque em janela anônima o acesso pode lançar.

## Avatares

- `actors/avatar.js` monta os dois tipos com primitivas e devolve `root` mais um `update(dt, speed)`. Geometrias e materiais ficam em cache por tipo, então o segundo ET não recria nada.
- A animação é um ciclo de caminhada simples: pernas e braços oscilam em torno dos pivôs com amplitude proporcional à velocidade, mais um sobe-e-desce do tronco. Com velocidade zero ele para em pé.
- O ET tem passo longo e o porco passo curto (`stride` em cada skin), que é o que faz os dois andarem diferente sem animação própria.
- `actors/crowd.js` guarda quem está na sala, interpola posição e ângulo entre as atualizações que chegam da rede e aplica o `update` de cada um. É ele que a camada de rede vai alimentar.
- Braço e perna têm dois segmentos cada, com uma esfera centrada no pivô da dobra. É ela que fecha a junta quando o cotovelo e o joelho dobram; sem a esfera abre fresta e o membro lê como duas peças encaixadas.
- Tentei antes uma malha única com esqueleto (`SkinnedMesh`) e ficou pior: o corpo é um conjunto de peças sobrepostas, e ao deformar cada peça entorta por conta própria e elas se atravessam. Skinning aqui só valeria com uma casca contínua de verdade; `actors/corpo.js` guarda os helpers de geometria que sobraram dessa tentativa.
- Custo medido: cerca de 6 draw calls por avatar. O teto de 150 vale para a casa vazia (30); com 20 pessoas fica em 150. A saída, quando encher, é `InstancedMesh` por parte e por tipo.
- Acionamento em `player/acoes.js`: botão direito segurado abre um menu em volta da mira e a direção do mouse escolhe; teclas 1, 2 e 3 ligam e desligam direto; no celular é a barra de pílulas na base. O `contextmenu` do navegador é bloqueado, senão o menu do sistema abre por cima do jogo. No Mac, Control+clique não chega como botão direito: vem botão 0 com `ctrlKey`, então o menu aceita as duas formas.

O menu tem dois modos, decididos pela duração do gesto. Segurou mais de 260ms, é o radial clássico: solta e aplica a direção. Foi clique curto (o caso do Control+clique e do toque de dois dedos), o menu fica fixo aberto e o próximo clique aplica. Enquanto está aberto a câmera não gira, senão escolher a direção viraria girar a cabeça junto; `controls.bloquearOlhar` cuida disso. Esc fecha sem aplicar.
- Andar cancela a dança: `acoes.andou()` é chamado quando há entrada de movimento.
- As danças são três (`balanco`, `maos`, `solto`) e vivem no mesmo `update`, que só dança quando o jogador está praticamente parado. O movimento soma duas ou três senoides de frequências diferentes e defasa um lado do outro — uma senoide só lê como robô.
- `?teste=1` na URL liga três avatares de demonstração circulando pela casa, sem rede nenhuma.

## Telão e som

- `world/screen.js` monta três coisas no mesmo lugar: a moldura em WebGL, um plano de "furo" e o player do YouTube como `CSS3DObject`.
- O furo é um `MeshBasicMaterial` com `blending: NoBlending` **e `opacity: 0`**. Sem a opacidade zero ele escreve alpha 1 e pinta um retângulo preto opaco, que foi exatamente o primeiro sintoma. Com alpha 0 o canvas fica transparente ali e o iframe, que está numa camada abaixo, aparece.
- Por isso o renderer precisa de `alpha: true`, `setClearColor(0x07070a, 0)` e `scene.background` nulo; o fundo preto vem do CSS do `body`.
- O `CSS3DRenderer` fica em `#css3d` com `z-index: 0` e o canvas com `z-index: 1`. Geometria na frente do telão continua ocultando ele, porque é desenhada no WebGL por cima do furo.
- `sound/venue.js` usa a IFrame API para o volume. O volume vem da distância até a caixa de som mais próxima, de 100 colado nela a 18 no limite de 46m. O player começa mudo porque autoplay com som é bloqueado. Todo clique, tecla e toque tenta `unMute`, e a tentativa só é dada por encerrada quando o player confirma que saiu do mudo.

O volume é aplicado sempre que o player está pronto, sem depender de o som já ter sido ligado. `isMuted()` responde pelo estado em cache da IFrame API, que é alimentado por mensagem assíncrona: lido logo depois do `unMute()` ele ainda devolve o valor velho. Usar essa leitura como condição para aplicar volume deixava o player desmutado e em volume zero — vídeo rodando, silêncio. Hoje ela serve só para o aviso do HUD, com cache de 400ms.

Duas outras armadilhas que já custaram um bug de som que só aparecia na máquina dos outros: desmutar uma vez só, no momento do pointer lock, perde a janela quando a API do YouTube ainda não terminou de carregar; e o handler de `pointerlockchange` não é um gesto do usuário, então o navegador pode recusar o `unMute` ali. Enquanto o som está mudo, o HUD mostra um aviso — sem ele, ninguém descobre que precisa clicar.

## Materiais
`MeshStandardMaterial` em tudo. Paleta base:

- Piso da pista: cinza escuro fosco, roughness alta
- Palco: preto fosco
- Paredes: cinza chumbo, um tom mais claro que o piso
- Estrutura metálica (vigas, treliça, guarda-corpo): metalness 0.8, roughness 0.4
- Bar: madeira escura (cor chapada) + topo do balcão mais claro
- Caixas de som: preto com grade escura

Variação de cor é feita por luz, não por textura.

## Publicação

O build sai com `base: './'`. A Vercel serve na raiz do domínio e o GitHub Pages serve em `/noturnabar/`: com base absoluta, um dos dois sempre pede o bundle no caminho errado e recebe 404, e a tela fica parada na entrada sem dizer nada. Caminho relativo serve os dois com o mesmo artefato.

Um script inline no `index.html`, antes do módulo, escreve na tela qualquer erro de execução, promessa rejeitada ou arquivo que não baixou, e avisa se o jogo não iniciar em 8 segundos. Ele é a única forma de enxergar falha no celular de outra pessoa, então não remover.

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
