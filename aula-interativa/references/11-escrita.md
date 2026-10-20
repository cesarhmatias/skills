# Escrita: títulos, frases de passo, rótulos e feedback

O texto de uma aula é curto, por isso cada palavra pesa. A maioria das aulas ruins geradas por modelos falha aqui: frases genéricas, abstratas, longas, com jargão e entusiasmo artificial. Esta referência dá regras e pares de exemplos. Escreva no idioma escolhido pelo aluno; as regras valem para qualquer idioma.

## 1. Voz

- Fale com o aluno na segunda pessoa (“você digita”) e descreva o sistema na terceira (“o resolvedor pergunta”).
- Frases afirmativas, presente do indicativo, sujeito + verbo + complemento.
- Concreto antes de abstrato: o nome do caso único, o número, o objeto na tela.
- Sem entusiasmo de marketing (“incrível”, “poderoso”, “mágica”), sem “vamos explorar”, “mergulhar”, “jornada”.
- Sem perguntas retóricas em sequência. Uma pergunta só no gancho e nas práticas.

## 2. Títulos (até 12 palavras; prefira menos)

O título diz a ideia da tela, como afirmação ou pergunta que a tela responde.

| Ruim | Por quê | Bom |
|---|---|---|
| Introdução ao DNS | Rótulo de tópico, não ideia | O que acontece antes de o site abrir? |
| Resolvedor e servidor autoritativo: conceitos fundamentais | Longo, abstrato | Dois papéis: quem pergunta e quem sabe |
| Explorando o processo de busca recursiva | Verbo vazio, jargão | A busca, pergunta por pergunta |
| Conclusão | Genérico | Na próxima vez que um site abrir |

## 3. Frases de passo (1–2 frases, até 30 palavras)

A frase da barra diz **o que olhar** ou **o que acabou de acontecer**, com causa e efeito quando houver. Ela não repete o título e não descreve a interface.

Padrões que funcionam:

| Padrão | Forma | Exemplo |
|---|---|---|
| Situação | Sujeito faz algo comum | “Você digita um nome e aperta Enter. Em menos de um segundo, a página aparece.” |
| Lacuna | “Mas…” + o que falta saber | “Mas, entre o Enter e a página, o computador precisa descobrir uma coisa.” |
| Revelação | Contraste com a expectativa | “A resposta não é uma página: é um número, 203.0.113.42.” |
| Definição em uso | Termo + função + exemplo do caso | “O autoritativo de padaria.com.br é ns1.padaria.com.br: é ali que o número está anotado.” |
| Evento causal | Quem faz o quê, e o resultado | “A raiz não sabe o número, mas indica: pergunte aos servidores do .br.” |
| Síntese numérica | Conta o que aconteceu | “Foram 3 perguntas; agora o site pode ser chamado.” |
| Limite de analogia | Onde a comparação para | “Onde a analogia para: não existe uma agenda única.” |
| Ponte para a prova | Liga desenho e realidade | “É a mesma cadeia do desenho.” |
| Fechamento | Volta ao gancho | “Na próxima vez que um site abrir, você sabe o que aconteceu antes.” |

Evite:

| Ruim | Problema | Reescrita |
|---|---|---|
| “Clique em Continuar para ver o próximo passo.” | Descreve a interface | (diga o que vai acontecer) “Agora o resolvedor pergunta à raiz.” |
| “Aqui podemos observar como o processo funciona de forma eficiente.” | Vazia | “Três perguntas bastaram, nenhuma delas ao site.” |
| “O DNS, ou Domain Name System, é um sistema hierárquico e distribuído que traduz nomes de domínio em endereços IP.” | Definição de dicionário, 4 termos novos | “O DNS traduz o nome que você digita no número que a rede entende.” |
| “Isso é muito importante!” | Ênfase sem conteúdo | Diga a consequência: “Sem esse número, o navegador não tem para onde ir.” |
| “Como vimos anteriormente…” | Muleta | Retome o objeto: “O mesmo 203.0.113.42 de antes…” |

## 4. Aprofundamento (`read`)

Quando o assunto pede mais do que uma frase, escreva um bloco de até ~5 linhas na região de texto da tela (`LessonKit.split({ say, read, visual })`). Ele não substitui a frase grande; ele a sustenta.

- Comece pelo porquê ou pela consequência, não pela definição.
- Use o caso único: nomes e números que o aluno já viu.
- Uma ideia por bloco; parágrafo corrido, sem listas, sem negrito no meio.
- Mesmo estilo e lugar em toda a aula. Se uma tela precisa de dois blocos, são duas telas.

| Ruim | Bom |
|---|---|
| “O TTL (Time To Live) é um campo do registro de recurso que especifica, em segundos, o intervalo de tempo durante o qual o registro pode ser armazenado em cache antes de ser consultado novamente na fonte autoritativa.” | “Quem decide quanto tempo a resposta vale é o dono do nome. Para padaria.com.br ele escolheu 300 segundos: durante esses 5 minutos, quem perguntar ao mesmo resolvedor recebe o número na hora, sem que ninguém consulte a raiz ou o .br. Depois disso, o resolvedor pergunta de novo.” |

## 5. Rótulos dentro do desenho

- 1–4 palavras. Substantivo ou verbo curto: “indica o .br”, “3 perguntas”, “TTL 5 min”.
- Rótulo encostado no objeto; mesma cor do objeto ou neutra.
- Números com unidade. Mesmo arredondamento em toda a aula.
- Nada de frases completas em rótulos; a frase está na barra.

## 6. Termos novos

1. Apresente o termo num passo próprio, com o desenho apontando para a coisa.
2. Defina pela **função no caso**, não pela categoria: “o resolvedor é quem faz as perguntas por você” e não “o resolvedor é um servidor recursivo”.
3. Marque a primeira ocorrência com `sc-term`.
4. Depois de definido, use sempre o mesmo nome. Não alterne sinônimos (“resolvedor”, “servidor recursivo”, “DNS do provedor”).
5. Siglas: escreva a forma curta que o aluno vai encontrar na ferramenta e explique uma vez.

## 7. Perguntas de prática

- O enunciado dá o contexto novo em uma frase e pergunta numa segunda: “A tem R$ 20 e envia R$ 8 para B, sem tarifa. Quanto resta em A?”
- Alternativas curtas e paralelas (mesma forma gramatical, tamanhos parecidos).
- A dica aponta o princípio: “Pense no que sai de A, não no que chega em B.”
- Feedback certo: confirma refazendo a conta ou a cadeia. Feedback errado: nomeia o erro de raciocínio e refaz a cadeia. Nunca só “errado”.

## 8. Caso e regra

O caso único é um exemplo; não o transforme em regra geral.

| Ruim | Problema | Bom |
|---|---|---|
| “Um motor 1.0 tem quatro cilindros.” | Falso em geral (muitos têm três) | “Este motor 1.0 tem quatro cilindros.” |
| “O DNS sempre faz três perguntas.” | Depende do cache e da delegação | “Aqui foram três perguntas: raiz, .br, autoritativo.” |

Afirmações gerais (“todo motor de 4 tempos dá uma explosão a cada duas voltas”) precisam de fonte; afirmações sobre o caso usam “este”, “aqui”, “neste exemplo”.

## 9. Números e dados

- Calcule antes de escrever; derive o texto do modelo (`render`), não digite números soltos.
- Mesma unidade e precisão em toda a aula. Separadores do idioma (`M.number`).
- Valores ilustrativos: diga uma vez (selo ou nota) e mantenha a coerência.

## 10. Teste de leitura em voz alta

Leia só as frases da barra, em ordem, em voz alta. Elas devem:

- Contar a aula inteira como uma história, sem precisar das imagens para fazer sentido geral.
- Nunca usar um termo antes de defini-lo.
- Não ter duas frases seguidas com a mesma estrutura.
- Caber em uma respiração cada.

Se algum trecho soar como manual, glossário ou propaganda, reescreva.
