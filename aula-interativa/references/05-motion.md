# Motion: especificação e construção das transições

## 1. Atribuir significado ao movimento

Antes de escolher uma curva, escreva o que a mudança visual significa. O aluno deve conseguir apontar a causa e a consequência na cena.

| Movimento | Significado possível | Risco de interpretação |
|---|---|---|
| Translação | Uma entidade percorre um caminho | Sugerir transporte quando só houve comunicação de estado |
| Crescimento | Uma quantidade aumenta | Mudar largura e altura e exagerar a percepção de volume |
| Conexão desenhada | Uma dependência se torna relevante | Sugerir causalidade não estabelecida |
| Expansão de componentes | Revelar estrutura interna | Inventar separação física de uma estrutura lógica |
| Destaque | Direcionar atenção | Parecer mudança de estado quando é só foco |
| Zoom | Inspecionar um detalhe | Perder a orientação do conjunto |
| Mudança de cor | Estado ou categoria | Codificar dois significados na mesma cor |

A mera aparição de um elemento pode servir à leitura, mas não substitui a animação do mecanismo central.

## 2. Definir o contrato da transição

Para cada transição, registre:

```text
estado anterior
estado de destino
propriedades contínuas
propriedades discretas
instante de cada mudança discreta
texto durante o movimento
momento de conclusão
estado que permanecerá após a pausa
```

Uma task “running” é discreta; a posição de um token na aresta é contínua. Um volume é contínuo; o feedback “transferência completa” só aparece quando o destino foi alcançado.

Ao pausar em 40%, todos os elementos precisam concordar com 40%. Não use um contador independente para fingir progresso.

## 3. Tempo local, eventos e easing

Use segundos de tempo local da etapa. Normalize cada segmento:

```js
const u = clamp((time - begin) / (end - begin), 0, 1);
const p = easeInOutCubic(u);
const x = lerp(startX, endX, p);
```

Cada segmento tem limites explícitos. Não derive a posição acumulando diferenças a cada frame: uma busca direta precisaria repetir o passado e erros numéricos se acumulariam.

Escolha a curva pela propriedade:

- **Linear:** passagem uniforme de tempo, transferência com taxa constante, comparação física que exige taxa constante.
- **Ease in/out:** deslocamento de um foco ou entidade entre posições sem promessa de velocidade constante.
- **Ease out:** entrada de uma anotação que precisa assentar rapidamente.
- **Spring:** apenas para ênfase que tolere overshoot; nunca para quantidade negativa, probabilidade fora de [0,1] ou geometria que sairia do quadro.

Não use easing em um fenômeno cuja taxa é o próprio conteúdo sem explicar a diferença. Se ensina velocidade constante, animar a posição com ease-in/out ensina outra coisa.

## 4. Pacing de referência

Comece com um ritmo calmo de estudo:

| Evento | Referência inicial |
|---|---|
| Destaque de atenção | 0,20–0,35 s |
| Entrada de rótulo curto | 0,35–0,55 s |
| Deslocamento legível | 0,80–1,60 s |
| Comparação ou expansão estrutural | 1,50–2,50 s |
| Assentamento após a mudança | 0,40–0,80 s |

Ajuste pela distância, densidade e necessidade de leitura. Esses tempos são decisões de design, não leis de aprendizagem.

Uma entrada de 0,4 s não dá 0,4 s para ler um parágrafo. O texto deve permanecer no endpoint. Se houver reprodução contínua, adicione hold suficiente ou deixe o parágrafo fora da faixa que será substituída.

Evite dois movimentos grandes simultâneos quando a pessoa precisa comparar seus significados. Se a simultaneidade for o conteúdo — por exemplo, conservação de quantidade — preserve-a e dê foco ao vínculo.

## 5. Antecipação, ação e consequência

Uma transição didática costuma ter:

1. Orientação do olhar para a entidade relevante.
2. Ação que muda o modelo.
3. Consequência acompanhada pelos rótulos.
4. Destaque da relação que deve ser compreendida.
5. Pausa estável para inspeção.

Não force essa sequência quando ela falsificar o fenômeno. Em uma transação atômica, mostrar publicação parcial como se fosse observável pode ser enganoso. Use um estado de preparação e uma troca no instante do commit.

## 6. Identidade e trajetórias

A mesma entidade mantém ID, rótulo e papel semântico. Quando precisar mudar a forma, preserve âncoras reconhecíveis.

Uma trajetória deve evitar texto e controles. Use linha reta quando ela explicar o caminho; use uma curva para desviar de conteúdo ou representar uma rota documentada. Não faça arcos decorativos em toda transição.

Para uma curva cúbica:

```js
const point = cubicBezier(P0, P1, P2, P3, p);
```

Parametrização por `p` não garante velocidade espacial constante. Se a velocidade for importante, use amostragem por comprimento de arco ou uma trajetória simples com comprimento conhecido. A receita incluída não deve ser apresentada como simulação física de velocidade constante.

## 7. Entradas, saídas e troca de texto

Componha os blocos de texto antes da animação. Não adicione palavra a palavra ao DOM se isso fizer as palavras existentes mudarem de posição.

Quando um título substitui outro na mesma região:

```text
0,00–0,20: título anterior sai
0,20–0,25: região fica livre
0,25–0,65: título novo entra
```

Em uma comparação lado a lado, os dois textos podem coexistir em regiões distintas. Sobreposição espacial sem intenção é um defeito, mesmo que dure apenas dois frames.

Anotações numéricas precisam de largura reservada, unidades e arredondamento consistente. O valor exato do modelo continua disponível mesmo que a exibição seja arredondada.

## 8. Estado, foco e tempo de leitura

Foco visual e estado são camadas diferentes. Uma borda azul para “elemento em foco” não pode ser confundida com a cor que significa “executando”. Mostre o estado em texto quando necessário.

A legenda deve acompanhar a etapa em andamento. Há três estratégias:

- Descrição da ação contínua: “A transfere quantidade para B”.
- Texto derivado: “Foram transferidas 4 de 10 unidades”.
- Revelação no fim: “Transferência concluída” aparece apenas no endpoint.

Evite um texto final fixo enquanto a geometria ainda mostra o estado anterior.

## 9. Movimento reduzido

Use os mesmos estados e entradas. Troque a transição por um salto controlado ao endpoint, com a explicação pertinente. O botão de etapa avança uma etapa, inclusive com movimento reduzido; ele não pode avançar duas porque o código aplicou a preferência depois da navegação.

Se um movimento comunica informação essencial que some no salto, ofereça uma sequência de estados ou comparação estática equivalente.

## 10. Determinismo e inspeção

A função de renderização recebe estado e produz imagem. O player pode usar `requestAnimationFrame` para fornecer o tempo; a cena não pode consultar o relógio por conta própria.

Proíba dentro do render:

- `Date.now()` e tempo de rede para decidir o conteúdo.
- `Math.random()` sem seed explícita.
- `setTimeout` para mudar entidades.
- Transições CSS que não respondem ao seek.
- Incrementos acumulados como `x += velocidade`.

Calcule o frame completo a cada chamada. Se não reconstruir o DOM, restaure explicitamente cada propriedade alterável, incluindo visibilidade, conteúdo, posição e classes.

Revise instantes antes e depois de eventos, mais os frames intermediários. Um endpoint perfeito pode esconder um rótulo que cruza o diagrama ou um número que salta. Consulte [captura e revisão](08-captura-e-revisao.md).
