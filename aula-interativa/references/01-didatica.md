# Didática: transformar um assunto em aprendizagem observável

Os princípios de como a pessoa aprende numa tela, o orçamento de texto e os tipos de tela estão em [experiência do aluno](00-experiencia-do-aluno.md). Aqui fica a parte de conteúdo: objetivos, pré-requisitos, exemplo e progressão.

## 1. Delimitar o que a pessoa conseguirá fazer

Um tema não é um objetivo. “Aprender filas” descreve território. “Prever a espera quando a taxa de chegada ultrapassa a capacidade” descreve uma capacidade demonstrável.

Escreva um resultado central e resultados subordinados. Use verbos que permitam verificar comportamento: explicar uma transição, identificar uma causa, calcular, comparar hipóteses, implementar, operar ou justificar uma decisão. Evite “conhecer”, “entender tudo” e “dominar” sem um critério operacional.

Para cada resultado, registre:

| Campo | Pergunta |
|---|---|
| Situação | Em qual cenário o conhecimento será usado? |
| Evidência | O que o aluno fará para mostrar que aprendeu? |
| Condições | Quais informações ou recursos ele poderá consultar? |
| Limite | O que a aula explicitamente não pretende cobrir? |
| Pré-requisito | Qual conhecimento sustenta esse resultado? |

Não transforme essa tabela em um slide burocrático. Ela orienta o autor.

## 2. Usar o contexto sem inventar competências

Reutilize o nível explicitado pelo aluno e evidências acessíveis no contexto autorizado. Diferencie “a pessoa disse que usa”, “o projeto contém” e “a pessoa demonstrou domínio”. Não atribua todo código de um repositório coletivo ao aluno.

Também não deduza desconhecimento pela ausência de um arquivo. Quando a familiaridade for desconhecida, ofereça uma explicação opcional de pré-requisito. Ela deve permitir continuar sem reorganizar a aula inteira.

Uma aula curta pode ser avançada. Uma aula longa pode precisar de fundamentos novos. Profundidade, extensão e experiência prévia são eixos distintos.

Para alguém que conhece uma ferramenta semelhante, uma ponte é útil se explicitar os limites da equivalência. Um nome parecido pode esconder outro modelo de execução. Compare a responsabilidade, a unidade de estado e o comportamento em falha antes de declarar equivalência.

## 3. Construir o mapa de dependências

Liste os conceitos necessários e conecte os pré-requisitos. Ordene a explicação para evitar usar um termo essencial antes de defini-lo.

Exemplo abstrato:

```text
unidade de trabalho
  → dependência
    → elegibilidade
      → limite de recurso
        → fila e espera
```

Uma ramificação do currículo pode ser opcional. Mantenha o caminho principal contínuo e deixe esse aprofundamento acessível.

Para materiais de curso:

1. Extraia os resultados e tópicos de cada trilha.
2. Remova duplicações sem apagar diferenças conceituais.
3. Identifique pré-requisitos que o curso supõe.
4. Agrupe o conteúdo por pergunta de aprendizagem.
5. Transforme trilhas em capítulos e mecanismos em slides.
6. Ajuste o escopo ao total de slides solicitado.

Não copie a organização de um curso só porque ela já está pronta. Preserve uma sequência fornecida quando o usuário a exigir; caso contrário, reorganize para a progressão escolhida.

## 4. Escolher um exemplo que sustente a explicação

Um bom exemplo tem poucas entidades iniciais, valores legíveis e uma consequência observável. Ele permite introduzir condições gradualmente sem trocar todo o universo da aula.

Defina no roteiro:

- As entidades e seus identificadores persistentes.
- As entradas iniciais.
- A transformação que será acompanhada.
- O resultado correto.
- A condição que vai gerar uma variação.
- O limite em que o exemplo deixa de representar o caso real.

Calcule resultados antes de animar. Valores inventados para uma demonstração são permitidos se identificados como sintéticos e coerentes entre si.

Não use um exemplo simples para prometer que o sistema real elimina concorrência, latência, erros ou incerteza. Mostre a hipótese simplificadora no ponto em que ela afeta a conclusão.

## 5. Sequência de ensino

A progressão de referência é:

1. **Problema:** apresentar a situação e o que precisa ser explicado.
2. **Modelo:** nomear os elementos e as relações relevantes.
3. **Mecanismo:** acompanhar a sequência causal.
4. **Exemplo acompanhado:** resolver um caso com justificativas visíveis.
5. **Variação:** alterar uma condição e comparar.
6. **Aplicação:** pedir uma decisão ou uma pequena construção.
7. **Transferência:** usar outro caso sem repetir toda a ajuda.

Cada etapa costuma ocupar várias telas curtas. Mapeie-as para os tipos de tela: problema → `abertura` + `mock`; modelo → `explicar`; mecanismo e exemplo → `diagrama`; variação → `diagrama` interativo; aplicação e transferência → `pratica`; o caso real resolvido → `mock`.

Cada tela responde a uma pergunta ou mostra um passo necessário. Se uma tela tentar definir o modelo, explicar o algoritmo, ensinar a UI e testar tudo ao mesmo tempo, divida-a. Telas a mais custam pouco; telas cheias custam o aluno.

## 6. Observar, prever, experimentar, explicar

Uma interação útil deve colocar o aluno diante de uma consequência:

```text
Observe o estado → preveja → altere ou execute → confronte → explique.
```

A previsão não precisa bloquear o avanço. Pode haver um botão “ver resultado” ou uma pergunta curta antes da execução.

O feedback deve explicar a relação causal e apontar o elemento visível que a demonstra. Para uma hipótese errada, mostre por que ela parecia plausível e qual condição a impede. Evite mensagens genéricas de “tente novamente”.

Exemplo:

- Pergunta: se o total é conservado, quanto resta em A após transferir 5 unidades para B?
- Ação: escolher um valor ou mover o controle.
- Evidência: os dois reservatórios mudam e o total permanece visível.
- Feedback: “A perdeu as mesmas 5 unidades que B recebeu; o total permaneceu 20”.

## 7. Reduzir a ajuda gradualmente

Comece resolvendo um exemplo com as decisões explicadas. Depois deixe uma decisão para o aluno. No caso final, ofereça o cenário e critérios de avaliação, não a resposta inteira.

Em procedimentos, passe de demonstração guiada para prática com pistas e depois para execução com verificação. Em matemática, passe de solução trabalhada para lacunas e depois para novo problema. Em interpretação histórica, compare evidências e justificativas; não reduza toda questão a uma alternativa única.

O caso de transferência deve mudar algo estrutural: entrada, contexto, restrição ou forma de apresentar o problema. Trocar apenas os nomes não demonstra transferência.

## 8. Ajustar a profundidade

| Nível | O que preservar | O que reduzir primeiro |
|---|---|---|
| Pouca (10–14 telas) | Modelo correto, caso real, exemplo, uma aplicação | Taxonomia extensa, exceções raras, operação especializada |
| Média (18–26 telas) | Mecanismo, variação, caso real resolvido, aplicação com feedback | Detalhes internos que não mudam as decisões |
| Muita (30–40 telas) | Mecanismos, limites, alternativas, recuperação quando pertinente | Repetições, telas decorativas, listas de nomes |

Se o total exato de slides conflitar com uma ambição impossível, delimite uma unidade coerente e registre o restante como continuação. Não finja cobrir um livro inteiro em oito telas.

## 9. Verificação pedagógica antes de desenhar

Leia os títulos em sequência. Eles devem mostrar uma progressão compreensível. Depois confira:

- Todo resultado tem uma demonstração ou oportunidade de aplicação?
- Todo exemplo tem valores e desfecho definidos?
- O aluno terá informação suficiente antes de decidir?
- Há conceitos repetidos com outras palavras sem nova consequência?
- Alguma analogia foi confundida com o mecanismo real?
- O caso final pode ser resolvido com o que foi ensinado?
- A profundidade vem de explicações e decisões ou apenas de mais tópicos?

Uma pergunta sem evidência observável deve ser reformulada antes de virar uma interação.
