# Robot AfterMath

Desenvolveu-se este jogo no âmbito da cadeira de Programação e Desenvolvimento Web. O jogo é um _“bullet heaven”_ ou _“survivor-like”_, em que se joga como uma sobrevivente num mundo apocalíptico tomado por robôs. O objetivo é aguentar o máximo de tempo possível contra ondas de robôs num deserto, enquanto se apanham novas armas.

Também foi implementado o Air Quality API da Open-Meteo, que verifica a qualidade do ar em tempo real e aumenta a intensidade visual do sol no mapa.


## Menu Inicial

O menu inicial do jogo possui três botões principais, sendo eles o “Play”, responsável por iniciar o loop do jogo, o “Sobre”, onde é possível visualizar os vários sprites do jogo e perceber o que são, e o “Quit”, para sair.
<img width="1857" height="883" alt="EcraSobre" src="https://github.com/user-attachments/assets/333586f1-6750-41a6-b2ac-3f27f575a7fa" />


## Jogabilidade
<img width="1858" height="875" alt="EcraJogo" src="https://github.com/user-attachments/assets/7d2c8b22-90e7-41d7-8ad4-2c727b49136f" />

### Disparar
O personagem dispara automaticamente no inimigo mais próximo, dentro do alcance das suas armas, e a cada inimigo morto aumenta o score. Quando já não faltarem mais inimigos, passa-se para a próxima ronda, onde o jogador pode escolher um upgrade para o ajudar.
<img width="1866" height="881" alt="EcraUpgrade" src="https://github.com/user-attachments/assets/203c61bd-5cf3-4404-ab41-55defee62bbd" />


### Movimento e Ações
Para controlar a movimentação do personagem são utilizadas as teclas W, A, S e D, a tecla E para interagir e a tecla I para abrir o inventário.

### Novas Armas
Com a passagem das rondas vão aparecendo baús com os quais o jogador pode interagir para conseguir armas novas, como uma faca para o ajudar contra grupos de robôs que cheguem perto demais e uma SMG para aumentar consideravelmente o poder de fogo.

### Game Over
Caso o jogador seja atingido múltiplas vezes e perca todas as vidas, isto irá levar a um Game Over, que guarda o high score.
