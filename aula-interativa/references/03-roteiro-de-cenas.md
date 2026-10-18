# Roteiro: da pergunta de aprendizagem à cena

## A unidade de autoria

Um slide contém uma unidade de raciocínio. Uma cena é a demonstração dessa unidade. Uma etapa é um ponto de parada que o aluno pode inspecionar.

A quantidade de etapas vem do mecanismo. Um antes/depois pode precisar de duas; uma negociação entre cinco agentes pode precisar de várias. O player incluído aceita quantidades variáveis.

Não confunda slide, capítulo, estado e frame. Um frame é a imagem em um instante. O frame não deve carregar um novo tópico só porque há tempo disponível.

## Ficha completa de cena

Registre antes da implementação:

```text
id e capítulo
pergunta que a cena responde
resultado observável
pré-requisitos já disponíveis
entidades com IDs persistentes
entradas e defaults
modelo que calcula o resultado
estados inicial, intermediários e final
etapas nomeadas e duração de cada transição
texto em cada estado
movimentos e seu significado
interação e hipóteses possíveis
feedback e explicação
limites da representação
fontes e versão quando relevantes
estados e cenários que a revisão deve capturar
```

O roteiro é um artefato interno. Sua função é impedir improviso durante a animação, não criar trabalho administrativo para o aluno.

## Exemplo de beat sheet

Situação: transferir uma quantidade entre dois reservatórios sem perda.

| Etapa | O que permanece | O que muda | O que o aluno deve notar |
|---|---|---|---|
| Inicial | Dois recipientes e escala | Nada foi transferido | Total inicial é 20 |
| Transferência | Identidade dos recipientes | A perde o que B ganha | As alterações são simultâneas |
| Resultado | Escala e total | A e B têm novos valores | Total continua 20 |

A transição de transferência pode ter:

```text
0,00–0,25 s: destaque da saída de A
0,25–1,45 s: transferência; volumes e números mudam juntos
1,45–1,80 s: destaque do total conservado
após 1,80 s: estado final permanece até ação do aluno
```

Os tempos são uma escolha de autoria para este exemplo. Não os aplique mecanicamente a qualquer aula.

## Modelo antes da legenda

Calcule o modelo e derive suas representações:

```js
const transferred = requested * progress;
const left = initial - transferred;
const right = transferred;
const total = left + right;
```

Volumes, rótulos, tabelas e feedback leem esses valores. Uma legenda fixa “transferiu 10” é errada quando o aluno alterou a entrada para 5 ou pausou em 40% do movimento.

Para uma cena com estados discretos, defina o momento da mudança. Se uma task só fica elegível quando outra conclui, não a pinte como executando antes desse momento.

## Cinco perguntas antes de animar

1. Qual é a causa mostrada?
2. Qual é o efeito visível?
3. Que entidade mantém identidade durante a mudança?
4. Qual informação o aluno precisa ler antes de continuar?
5. O que ele pode prever ou alterar?

Se só houver “entra um título e depois entram caixas”, falta a demonstração do mecanismo.

## Especificação de etapas

Para cada etapa, use um identificador estável e uma descrição concreta:

```js
steps: [
  { id: 'initial', label: 'Estado inicial', duration: 0 },
  { id: 'transfer', label: 'A transfere para B', duration: 1.8 },
  { id: 'compare', label: 'Comparar o total', duration: 0.7 }
]
```

A duração é a transição para aquela etapa. `time=duration` é o ponto de parada. Uma etapa de duração zero é instantânea e ainda deve ter estado definido.

O tempo de leitura não deve ser confundido com duração de transição. O resultado fica parado indefinidamente quando a etapa termina. Em reprodução contínua de uma cena, inclua holds necessários dentro da timeline e preserve uma forma de pausar.

## Cenas com escolhas

Registre o produto cartesiano que importa, sem tentar testar todos os números possíveis:

- Menor e maior entrada admitidas.
- Valor intermediário típico.
- Alternativas que mudam o caminho causal.
- Resposta correta e uma hipótese errada plausível.
- Entrada vazia ou sem resultado, se permitida.

Exemplo: no controle “com perda / sem perda”, o total deixa de ser conservado no sistema observado. A legenda, equação e conclusão precisam mudar com essa escolha.

Use um arquivo de cenários para capturas e testes. Não verifique somente o default bonito.

## Densidade e continuidade

Antes de adicionar outra entidade, pergunte se ela serve ao objetivo da cena. Se servir apenas a uma explicação posterior, deixe-a para a próxima etapa ou slide.

Mantenha um mapa de identidades: A continua A; azul continua representando a mesma categoria. Um elemento não pode desaparecer e reaparecer com outro significado sem aviso.

Entre slides do mesmo exemplo, preserve âncoras visuais. Entre assuntos distintos, uma separação de capítulo pode ajudar, mas não exige uma tela vazia.

## Códigos e derivações

Mostre trechos suficientes para explicar o vínculo entre instrução e comportamento. Destaque as linhas que estão produzindo a mudança visível.

Para uma derivação, conserve o alinhamento de termos que mantêm o mesmo papel. Se um termo se move de lado, mostre a operação que justifica o movimento. Não use morphing para esconder uma mudança algébrica não explicada.

Para código parcial, identifique o recorte e disponibilize o exemplo completo. Não ofereça um fragmento com funções ausentes como se fosse executável sozinho.

## História, textos e interpretação

O estado pode ser um conjunto de evidências ou informações disponíveis em um momento. Uma transição pode revelar um documento, comparar explicações ou reorganizar uma cronologia.

Movimento não significa causalidade por si só. Uma seta em uma linha do tempo pode sugerir uma relação causal não demonstrada. Use rótulos que distingam sequência temporal, associação e causa sustentada.

## Revisar o roteiro

Faça uma leitura apenas dos estados finais. Depois faça uma leitura das transições. As duas devem contar a mesma explicação.

Confira pontos críticos: imediatamente antes e depois de cada mudança discreta; troca de legenda; atualização de parâmetro; abertura de feedback; reinício; retorno a uma etapa anterior.

Uma falha encontrada no roteiro é mais barata de corrigir que uma cena inteira já animada. Resolva contradições antes do acabamento visual.
