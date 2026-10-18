# Receitas de motion para explicar mecanismos

Use estas receitas como decisões de construção. Adapte a geometria ao assunto; não transforme toda aula em um conjunto de nós conectados. As funções puras estão em `templates/motion.js`.

## 1. Entidade percorrendo um caminho

**Serve para:** acompanhar uma mensagem, um objeto, uma etapa de processamento ou uma rota.

**Planejar:** origem, destino, identidade, significado da aresta, instante da entrega e consequência.

```js
const p = M.segment(time, 0.3, 1.7, M.easeInOutCubic);
const pos = M.cubic(P0, P1, P2, P3, p);
const delivered = time >= 1.7;
```

Desenhe o contexto primeiro. Destaque a origem antes de mover. Mantenha o token reconhecível durante a trajetória. Atualize o destino apenas no instante de entrega definido.

**Revisar:** 0,3 s; metade do percurso; 1,7 s menos um frame; 1,7 s; retorno ao início. O destino não pode estar concluído enquanto o token ainda está no meio.

**Evitar:** confundir uma mensagem de controle com o arquivo inteiro; velocidade fisicamente uniforme quando a curva não é parametrizada por comprimento.

## 2. Quantidade transferida e conservação

**Serve para:** volumes, estoques, distribuição de massa ou orçamento de um exemplo matemático.

```js
const moved = amount * M.segment(time, 0.25, 1.45, M.linear);
const left = initial - moved;
const right = moved;
```

Volumes, rótulos e total derivam desses mesmos valores. Use uma escala comum e estável. Se a transferência tiver perda, modele a perda explicitamente e mostre qual sistema está sendo observado.

**Revisar:** menor e maior quantidade, limites, arredondamento, valor intermediário e conservação. `left + right` deve obedecer ao contrato do modelo em todos os frames.

**Evitar:** interpolar o contador com uma curva e o volume com outra; aplicar spring a volumes e produzir valores negativos.

## 3. Dependência e mudança de estado

**Serve para:** workflows, montagem, pré-requisitos e estados condicionais.

Defina eventos discretos primeiro:

```text
A começa: 0,20 s
A conclui: 1,30 s
B fica elegível: 1,30 s
B começa: 1,70 s, se há recurso disponível
```

Separe elegibilidade, fila e execução. Destaque a aresta quando a condição for satisfeita, não quando você quiser preencher a tela.

**Revisar:** frames imediatamente antes e depois de cada evento. Texto, cor e legenda precisam concordar com o estado. Inclua uma variação de falha ou indisponibilidade quando pertinente.

**Evitar:** mover B ou marcar “running” só porque A está perto de terminar.

## 4. Expansão para revelar estrutura

**Serve para:** camadas, composição de um objeto, subcomponentes de um sistema e decomposição conceitual.

Defina posições de repouso e posições expandidas. Interpole posições com a mesma curva para manter a leitura estrutural. Use conectores sutis para preservar o pertencimento.

```js
const p = M.segment(time, 0.2, 2.0, M.easeInOutCubic);
const y = M.lerp(closedY, expandedY, p);
```

Rótulos só aparecem quando houver espaço; suas posições são derivadas das entidades medidas. Mantenha pelo menos um ponto de referência fixo.

**Revisar:** metade da expansão, overlap de rótulos e contenção no viewport menor. O conjunto precisa caber quando totalmente expandido.

**Evitar:** sugerir separação física em uma decomposição apenas lógica sem rotular essa escolha.

## 5. Cursor, clique e resultado na UI

**Serve para:** demonstrar uma operação em interface verificada.

1. Mostre a tela e o objetivo.
2. Destaque a região relevante.
3. Mova o cursor até o controle em 0,6–1,0 s.
4. Faça um indicador curto de clique no ponto de chegada.
5. Aguarde o resultado verificável.
6. Destaque a mudança e como conferi-la.

A posição do cursor é derivada do retângulo do controle ou de coordenadas normalizadas da captura. Em uma reconstrução, use o controle real do DOM.

**Revisar:** cursor sobre o controle certo, não sobre um rótulo aproximado; clique somente após chegada; resultado posterior à ação; aparência correta em zoom e mobile.

**Evitar:** inventar um resultado real para um clique simulado. Mantenha o rótulo de simulação visível.

## 6. Zoom para um detalhe

**Serve para:** ler um controle, um trecho de documento ou uma região de gráfico.

Meça o retângulo alvo e a região de destino. Calcule a transformação que o contém sem cortar o que precisa ser lido:

```js
const fit = M.contain(target, destination);
const scale = M.lerp(1, fit.scale, p);
```

Mostre primeiro o conjunto, depois o recorte. Preserve uma indicação de origem ou permita retornar ao conjunto. As anotações devem acompanhar a transformação do alvo.

**Revisar:** alvo inteiro no endpoint, limites intermediários, nitidez e tamanho de leitura.

**Evitar:** ampliar uma imagem de baixa resolução até fingir detalhe que ela não contém; deixar o aluno sem saber de onde o recorte veio.

## 7. Código e comportamento sincronizados

**Serve para:** explicar uma instrução, declaração ou sequência de operações.

Separe código, cena e explicação em regiões. Use IDs de linhas ou faixas estáveis. O modelo decide a operação atual; o destaque acompanha essa operação.

Uma dependência declarada no parse não deve parecer execução imediata da função. Diferencie autoria de runtime quando isso fizer parte do assunto.

**Revisar:** linha destacada no mesmo instante do efeito; destaque não corta o texto; código completo acessível; recorte identificado como parcial.

**Evitar:** rolagem rápida de código como decoração ou highlight que percorre linhas sem consequência visível.

## 8. Derivação ou transformação simbólica

**Serve para:** álgebra, lógica, simplificação e mudança de representação.

Dê IDs aos termos. Mantenha alinhamento de igualdade e papéis semânticos. Mostre a operação aplicada a ambos os lados antes de mover termos.

É aceitável usar um corte entre duas expressões complexas se a operação for explicada. Um morph bonito não justifica uma passagem matemática.

**Revisar:** sinais, unidades, domínio, zero em denominadores e parâmetros extremos. Faça uma verificação numérica independente de um caso quando possível.

**Evitar:** transformar símbolos só pela semelhança visual, ocultando uma operação inválida.

## 9. Comparação entre hipóteses

**Serve para:** estratégias, antes/depois, explicações alternativas ou comportamentos em falha.

Use entradas iguais e escalas iguais. Mostre a diferença relevante no mesmo ponto do processo. Permita alternar mantendo o estado comparável ou exiba duas regiões simultâneas.

Se o aluno troca a hipótese, recalcule legenda, resultado e feedback juntos. Não deixe uma conclusão da hipótese anterior na tela.

**Revisar:** defaults, alternância repetida, pausa no meio e retorno a uma etapa anterior.

**Evitar:** comparar momentos distintos ou omitir um custo da alternativa favorecida.

## 10. Crescimento de uma fila e recurso limitado

**Serve para:** capacidade, gargalo, concorrência e atendimento.

Modele chegadas, capacidade e conclusão antes de desenhar posições. Preserve a ordem dos itens quando essa ordem tiver significado. Mostre quem está aguardando e quem ocupa o recurso.

Uma visualização pode simplificar tempos, mas deve declarar isso. Aumentar a capacidade deve alterar a admissão de acordo com o modelo, não apenas colorir mais caixas.

**Revisar:** capacidade mínima e máxima, fila vazia, fila cheia e limite do recurso externo.

**Evitar:** afirmar ganho de throughput por aumentar workers quando outro recurso continua limitando.

## Combinar receitas

Combine poucas receitas em uma mesma cena. Declare qual é principal. Um zoom pode orientar para um clique; o clique pode liberar um fluxo; o fluxo produz uma mudança de quantidade. Se todas ocorrerem juntas sem um caminho de atenção, divida em etapas.

Antes de implementar uma combinação, escreva uma tabela com tempo, entidade, propriedade e significado. Depois capture as sobreposições de eventos. É nessa fronteira que rótulos, estados e conclusões costumam se contradizer.
