# Robot AfterMath

Desenvolveu-se este jogo, no âmbito da cadeira de Programação e Desenvolvimento Web. O jogo é um "bullet heaven" ou "survivor-like" em que se joga como uma sobrevivente num mundo apocalitico tomado por robos. O objetivo é aguentar o maximo de tempo possivel contra ondas de robos num deserto enquanto se apanha novas armas.

Támbem foi implementado o Air Quality API da Open-Meteo, que verifica a qualidade do ar em tempo real e aumenta a intensidade visual do sol no mapa.


## Menu Inicial

O menu inicial do jogo, possui 3 botões principais, sendo eles o "Play", responsável por iniciar o loop do jogo, "Sobre", onde é possivel visualizar os varios sprites no jogo e o que são e "Quit" para sair.
<img width="1853" height="886" alt="ecraInicial" src="https://github.com/user-attachments/assets/7cc65fe9-6066-46f5-965f-d4a3a8e82b72" />

## Jogabilidade
<img width="1858" height="875" alt="EcraJogo" src="https://github.com/user-attachments/assets/7d2c8b22-90e7-41d7-8ad4-2c727b49136f" />

### Disparar
O personagem dispara automaticamente no imimigo mais proximo dentro do alcance das suas armas e com cada inimigo morto aumenta o score. Quando já não faltarem mais inimigos passa-se para a proxima ronda onde o jogador pode escolher um upgrade para o ajudar.
<img width="1866" height="881" alt="EcraUpgrade" src="https://github.com/user-attachments/assets/203c61bd-5cf3-4404-ab41-55defee62bbd" />


### Movimento e Ações
Para controlar a movimentação do personagem são utilizadas as teclas W A S D, a tecla E para interagir e A tecla I para abrir o inventario.

### Novas Armas
Com a passagem das rondas vão aparecendo baus que o jogador pode interagir para consegui armas novas, como uma faca para o ajudar contra grupos de robos que cheguem perto demais e uma SMG para aumentar o poder de fogo consideravelmente.

### Game Over
Caso o jogador seja atingido multiplas vezes e perca todas as vidas, isto irá levar a um game over que guarda o high score.
