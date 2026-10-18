# PRD — Casa de Show 3D (v1)

## O que é
Um jogo 3D em primeira pessoa que roda no navegador. O jogador anda livremente dentro de uma casa de show fechada, com palco, pista, mezanino e bar. Sem objetivo, sem pontuação, sem inimigo: a v1 é o lugar e o andar pelo lugar.

## Por que
Base jogável pra evoluir depois pra mundo aberto com show acontecendo. A v1 existe pra validar três coisas: o lugar ficar convincente, a movimentação ficar gostosa e o navegador aguentar 60fps.

## Público
Uma pessoa, no desktop, com teclado e mouse, abrindo uma URL. Sem login, sem save, sem conta.

## Escopo da v1

### Dentro
1. Um galpão fechado, todo construído em código, com as áreas: hall de entrada, pista, palco, mezanino em U, bar.
2. Caminhada em primeira pessoa com mouse look, corrida, pulo e gravidade.
3. Colisão: não atravessa parede, palco, bar nem guarda-corpo. Sobe e desce as escadas.
4. Iluminação de casa de show antes de abrir: ambiente escuro, refletores coloridos no palco, luz de serviço fraca no resto.
5. HUD mínimo: mira, FPS, texto de ajuda dos controles que some no primeiro clique.
6. Roda em Chrome, Firefox e Safari desktop atuais.

### Fora (não implementar na v1)
- Público e NPC: ninguém na casa além dos jogadores de verdade
- Áudio próprio: passos, ambiente, qualquer som que não venha do telão
- Show acontecendo: banda, luz sincronizada
- Mundo aberto, rua, qualquer coisa fora do galpão
- Interiores de banheiro e camarim (porta fechada é o limite)
- Interagir com objeto: abrir porta, pegar copo, sentar
- Menu, configurações, save, gamepad, VR
- Modelo 3D externo, textura em arquivo de imagem, asset baixado

Cada item da lista de fora pode virar v2. Entrar na v1 só com pedido explícito.

### Mudanças de escopo

**18/10/2026 — celular entra na v1.** Mobile estava na lista de fora e saiu dela a pedido. O que entra:

- Controles de toque na tela: joystick analógico à esquerda para andar, arrastar do lado direito para olhar, botão de pulo e botão de correr.
- Funciona em paisagem. Em retrato, a tela pede para girar o aparelho em vez de tentar jogar deitado.
- Botão de tela cheia, que é o que permite travar a orientação.
- Sem pointer lock no toque: ele não existe em touch e nem é necessário.

O que continua fora no celular: gamepad, giroscópio, vibração e qualquer ajuste de qualidade feito pelo usuário.

**18/10/2026 — telão e som entram na v1.** Um telão no fundo do palco toca um vídeo do YouTube, e o volume acompanha a distância do jogador até as caixas de som.

**18/10/2026 — multiplayer básico entra na v1.** Quem entra ganha um avatar sorteado entre dois, um ET e um porco bípede, e vê os outros andando pela casa. Nada além disso: sem voz, sem texto, sem nome em cima da cabeça, sem interação entre jogadores.

O front continua estático na Vercel e a sala vira um processo Node com WebSocket no Render. Sem a variável do servidor configurada, o jogo roda sozinho como antes.

Dois limites que vêm da plataforma, não de escolha nossa:

- O vídeo não vira textura 3D. O player do YouTube é de outra origem e não entrega os pixels para o WebGL; baixar o arquivo violaria os termos. O player oficial é embutido no espaço 3D e um furo no canvas deixa ele aparecer no lugar certo, com a geometria da casa ainda ocultando o que passa na frente.
- O som do player não pode ser espacializado. Pelo mesmo motivo de origem, o Web Audio não alcança o áudio do iframe, então não existe panning por caixa. O que dá é controlar o volume do player pela distância. Estéreo de verdade por caixa só com um arquivo de áudio nosso, e isso continua fora.

## Critérios de aceite
A v1 está pronta quando, num notebook comum:

1. `npm run dev` sobe e a página carrega sem erro no console.
2. Clicar na tela trava o mouse; ESC solta.
3. WASD anda, mouse olha, Shift corre, Espaço pula e cai de volta no chão.
4. O jogador não atravessa nenhuma parede, nem o palco, nem o balcão do bar, nem o guarda-corpo do mezanino, nem sai do galpão.
5. O jogador sobe no palco pela escada lateral e chega ao mezanino pelas duas escadas.
6. O jogador não fica preso em quina nem é jogado pra fora do mapa.
7. O FPS fica em 60 parado na pista e andando, e não cai abaixo de 45 no pior ângulo (mezanino olhando o galpão inteiro).
8. Redimensionar a janela não distorce a imagem.
9. Dá pra identificar cada área (palco, pista, mezanino, bar, hall) só olhando, sem legenda.

## Riscos
- Performance: galpão inteiro visível de uma vez do mezanino. Mitigação na spec (instancing, merge, limite de luz com sombra).
- Colisão em escada é onde esse tipo de jogo costuma quebrar. Tratado como item próprio na spec.
- Tudo procedural pode ficar com cara de maquete cinza. Mitigação: iluminação e variação de material fazem o trabalho que a textura faria.

## Como não fugir do escopo
Toda mudança pedida passa por uma pergunta: está na lista "Dentro"? Se não está, vai pra v2 e o PRD é atualizado com a decisão. Ideia boa que chega no meio do caminho é anotada, não implementada.

## Verificação da v1 (18/10/2026)

Passou, verificado automaticamente no navegador:

1. `npm run dev` sobe na 3490 e a página carrega sem erro no console. `npm run build` também passa (555 kB, 141 kB gzip, quase tudo three).
4. 4000 trajetos aleatórios a partir de 17 pontos do galpão: nenhuma saída pelas paredes, nenhuma queda pelo chão, nenhum travamento no lugar.
5. Sobe no palco pela escada lateral e chega ao mezanino pelas duas escadas; o U do mezanino é percorrível da laje do fundo até a ponta das duas laterais.
6. Nenhum ponto preso em quina nos mesmos 4000 trajetos. O jogador também não consegue mais escalar o guarda-corpo pulando.
7. 60fps girando a câmera, tanto na pista quanto no mezanino, em 1600x1000. 26 a 35 draw calls, 7456 triângulos.
8. Redimensionar acerta o aspect da câmera (testado em 1600x1000).
9. Palco, pista, mezanino, bar e hall se identificam sozinhos nos prints em `docs/prints/`.

Depende de teste manual no navegador (o painel do Claude roda em iframe sem permissão de pointer lock, então a trava do mouse não pode ser verificada aqui):

2. Clique trava o mouse, ESC solta.
3. WASD, shift e espaço no teclado. A física por trás dessas entradas está testada; falta confirmar o caminho do teclado com o mouse travado.

Quando a trava do mouse falha, a tela de ajuda avisa em vez de não fazer nada.
