# O arco de uma aula impecável

Esta referência descreve **a forma** de uma aula excelente, independentemente do assunto. Ela foi extraída de aulas que funcionaram e de aulas que falharam. Siga-a como uma estrutura de engenharia: cada parte tem uma função, uma entrada e uma saída. Se uma parte faltar, a aula fica visivelmente pior, mesmo que o conteúdo esteja certo.

`examples/exemplar-dns/` mostra uma instância completa (brief, roteiro, fontes e aula). Estude o **processo** que ela registra; não copie o tema, as cores nem os desenhos.

## 1. As sete decisões que vêm antes de qualquer tela

Tome e registre estas decisões em `brief.md` (modelo em `templates/brief.md`). Sem elas, o roteiro sai genérico.

| # | Decisão | Pergunta que ela responde | Exemplo bom | Exemplo ruim |
|---|---|---|---|---|
| 1 | **Resultado observável** | O que o aluno fará no fim que hoje não faz? | “Dado um nome de site, explica em ordem quem pergunta a quem e prevê o efeito do cache” | “Entender DNS” |
| 2 | **Caso único** | Qual exemplo concreto atravessa a aula inteira? | `padaria.com.br → 203.0.113.42` do começo ao fim | Um exemplo novo a cada tela |
| 3 | **Momento cotidiano** | Onde o aluno já encontrou isso sem saber? | Digitar um endereço e a página abrir | “O DNS é um sistema distribuído…” |
| 4 | **Revelação** | Qual fato surpreende e motiva o resto? | A resposta não é uma página: é um número | Uma definição |
| 5 | **Prova real** | Como o aluno vê que o desenho é verdade? | `dig +trace` mostra a mesma cadeia | Nenhuma; o desenho é a única evidência |
| 6 | **Variação e falha** | O que muda quando uma condição muda? Como isso quebra? | Cache/TTL; nome inexistente (NXDOMAIN) | Só o caminho feliz |
| 7 | **Fronteira** | O que fica de fora, e onde a simplificação é dita? | “Resolvedor recém-ligado” dito na frase; DNSSEC fora | Simplificar sem avisar |

O **caso único** é a decisão mais importante. Ele permite que cada tela reaproveite o que o aluno já viu: os mesmos nomes, números e cores. Escolha valores legíveis e coerentes (ex.: endereços IP de documentação, valores redondos). Calcule todos os resultados antes de desenhar.

## 2. O arco em oito movimentos

```text
1 GANCHO      → 2 REVELAÇÃO → 3 VOCABULÁRIO → 4 MODELO → 5 MECANISMO
→ 6 PROVA REAL → 7 PRÁTICA (prever · variar · diagnosticar) → 8 FECHAMENTO
```

| Movimento | Função | Tipos de tela | Critério de pronto |
|---|---|---|---|
| **1 Gancho** | Situar no cotidiano e abrir uma pergunta | `abertura` | Em 3 s o aluno reconhece a situação e vê a pergunta (“?”) |
| **2 Revelação** | Mostrar, na ferramenta ou situação real, o fato escondido | `mock` | A frase final do passo revela algo que a pessoa não esperava |
| **3 Vocabulário** | Dar nome às peças, uma por vez, com desenho | `explicar` (1 termo por passo) | Cada termo tem desenho próprio e aparece antes de ser usado |
| **4 Modelo** | Mostrar a estrutura estática: quem é quem | `explicar`, `diagrama` | O aluno aponta cada peça no desenho |
| **5 Mecanismo** | Mostrar o processo, um evento por passo | `diagrama` (5–8 passos) | Cada Continuar mostra uma causa e seu efeito; há um contador ou estado visível |
| **6 Prova real** | Reproduzir o mecanismo na ferramenta ou dado real | `mock` | A frase liga explicitamente: “é a mesma cadeia do desenho” |
| **7 Prática** | Usar o modelo: prever, variar, diagnosticar | `pratica`, `diagrama` interativo | Ao menos uma pergunta de cada tipo em profundidade ≥ 2; ao menos previsão e falha em profundidade 1 |
| **8 Fechamento** | Amarrar ao gancho | `resumo` | A última frase volta à situação do gancho |

### Variações por profundidade

| Profundidade | Como o arco cresce |
|---|---|
| 1 | O arco inteiro uma vez, com um mecanismo central; 10–14 telas |
| 2 | Arco inteiro + uma segunda volta de mecanismo (variação ou camada interna) com sua própria prova; 18–26 telas |
| 3 | Dois ou três mecanismos encadeados, cada um com mini-arco (vocabulário → mecanismo → prova → prática), mais operação e diagnóstico de falhas reais; 30–40 telas |

Um arco mais profundo **não** encurta o gancho nem a revelação: ele acrescenta voltas.

## 3. O mesmo arco em assuntos muito diferentes

Os exemplos abaixo mostram que o arco não depende de software. Use-os para calibrar; não copie.

| Movimento | Juros compostos (finanças) | Fotossíntese (biologia) | Revolução de 1789 (história) | Ordenação por intercalação (algoritmo) |
|---|---|---|---|---|
| Caso único | R$ 1.000 a 1% ao mês por 24 meses | Uma folha de feijoeiro ao sol, das 6h às 18h | Paris, 14 de julho, e um padeiro do Faubourg Saint-Antoine | A lista [38, 27, 43, 3, 9, 82, 10] |
| Gancho | “Por que a dívida do cartão cresce tão rápido?” | “De onde vem a massa de uma árvore?” | “Por que uma cidade inteira foi a uma prisão quase vazia?” | “Como ordenar um milhão de nomes sem esperar horas?” |
| Revelação (mock) | Extrato do cartão: juros sobre juros na linha do mês 2 | Experimento de van Helmont: a terra quase não perdeu massa | Preço do pão em julho de 1789 (fonte de época) | Tempo medido: ordenação ingênua × intercalação no mesmo dado |
| Vocabulário | principal, taxa, período, montante | estômato, clorofila, glicose | Terceiro Estado, Assembleia, Bastilha | dividir, intercalar, sublista |
| Mecanismo | Mês a mês, a barra cresce sobre a anterior | CO₂ entra, luz chega, glicose sai, por etapa | Sequência de eventos com causa declarada e disputa marcada | Divide até unidades; intercala aos pares, um nível por passo |
| Prova real | Simulador de banco ou fórmula na planilha | Gráfico de troca de CO₂ medido ao longo do dia | Trecho de documento primário (cahier de doléances) | Contagem de comparações do código executado |
| Prática | Prever o saldo no mês 12; variar taxa; diagnosticar contrato | Prever o que ocorre à noite; variar luz; diagnosticar planta amarela | Ordenar causas; comparar interpretações; identificar anacronismo | Prever a próxima intercalação; variar tamanho; achar o erro no código |
| Fechamento | “Na próxima fatura você sabe onde olhar” | “A árvore é feita de ar” | “Agora a pergunta é: por que a Bastilha?” | “Agora você sabe por que o computador não demora horas” |

Em assuntos interpretativos (história, literatura, ética), a “prova real” é uma **fonte primária** e o mecanismo declara o que é consenso, o que é disputa e o que é hipótese.

## 4. Anatomia de uma boa tela de mecanismo

O mecanismo é onde a aula ensina de verdade. Siga esta forma:

1. **Elenco fixo:** todas as entidades entram no primeiro passo, em posição definitiva, em tom neutro. Nada muda de lugar depois sem motivo.
2. **Um evento por passo:** “X pergunta a Y”, “Y responde Z”. O passo anima o evento e termina parado.
3. **Marca de atenção única:** só o elemento envolvido no evento recebe a cor de atenção.
4. **Rastro:** o que já aconteceu deixa um traço discreto (nota, aresta tracejada, contador). O aluno lê a história inteira no último passo.
5. **Contador ou estado:** um número que mede o que importa (perguntas feitas, páginas lidas, saldo). Ele muda no instante do evento.
6. **Frase causal:** a frase da barra diz a causa e o efeito do evento, com sujeito e verbo: “A raiz não sabe o número, mas indica: pergunte aos servidores do .br.”
7. **Fim com síntese:** o último passo resume em números: “Foram 3 perguntas; agora o site pode ser chamado.”

## 5. Anatomia de uma boa prática

- **Contexto novo, mesmo modelo:** troque o caso (outro nome, outra quantia, outro dia), não a regra. Usar o caso da aula testa memória, não compreensão.
- **Três tipos:** prever (o que acontece?), variar (e se a condição mudar?), diagnosticar (o que deu errado?).
- **Distratores plausíveis:** cada alternativa errada representa um erro real de raciocínio, e o feedback nomeia esse erro: “8 é o que chegou em B, não o que ficou em A”.
- **Feedback causal:** a explicação refaz a cadeia com os números do caso. Nunca “Incorreto, tente de novo”.
- **Dica curta:** aponta o princípio sem entregar a resposta.

## 6. Anatomia de um bom mock

- Mostra exatamente o que o aluno veria: comando, saída, botão, extrato, documento.
- Formatos verificados na fonte ou executados de verdade; valores podem ser ilustrativos, desde que sejam coerentes com o caso único.
- Um passo por momento de leitura: digitar → resposta → detalhe destacado.
- O destaque cai no trecho que a frase menciona, e só nele.
- Selo de simulação visível. Cortes declarados (“2 das 13 linhas”) no painel Fontes ou no brief.

## 7. O que conta como prova real

A prova real mostra que o desenho corresponde ao mundo. Ela depende do tipo de assunto:

| Assunto | Prova real aceitável | Não conta |
|---|---|---|
| Software, redes, dados | Comando executado e sua saída; tela do produto; log; resposta de API | Saída inventada “plausível” |
| Máquinas e engenharia | Ficha técnica de um produto **real e identificado** (fabricante, modelo); medição publicada; leitura de instrumento (tacômetro, scanner, osciloscópio); foto ou corte técnico com fonte | Ficha “ilustrativa” sem produto real |
| Ciências naturais e saúde | Experimento documentado com dados; ensaio clínico; gráfico de medição publicado; imagem de microscopia com fonte | Animação do próprio autor como evidência |
| Finanças, economia | Extrato, contrato, tabela oficial (taxa publicada), simulador do banco central | Exemplo numérico sem âncora |
| História, humanidades | Fonte primária (documento, jornal, imagem de época) com referência | Resumo de terceiros |
| Matemática | Verificação independente: cálculo numérico, contraexemplo, gráfico gerado do modelo | Repetir a própria derivação |

Quando as etapas internas não são observáveis pelo aluno (moléculas, órgãos, processos em servidores alheios), a prova real mostra a **consequência** que o mecanismo prevê, medida no mundo: o desfecho do ensaio, a curva medida, o resultado do comando. A frase faz a ponte: “é o fim da mesma cadeia do desenho”.

Se o caso único for sintético, ancore-o num caso real: “o motor desta aula tem os números de um motor real, o X 1.0 do fabricante Y”. Se nenhuma prova real for possível, diga isso no relatório e trate a dimensão como abaixo do portão.

## 8. Sinais de que o arco falhou

| Sinal | Causa provável | Reparo |
|---|---|---|
| O aluno não sabe por que está vendo aquilo | Falta gancho ou revelação | Abra com a situação cotidiana e o fato surpreendente |
| Muitos termos de uma vez | Vocabulário comprimido | Um termo por passo, com desenho |
| O mecanismo parece mágica | Eventos agrupados num passo só | Um evento por passo; contador |
| “O desenho é bonito mas é só um desenho” | Falta prova real | Mock da ferramenta, dado ou fonte reproduzindo o mecanismo |
| A prática é decoreba | Mesmo caso da aula | Troque o caso, mantenha a regra |
| O fim não fecha | Resumo genérico | Volte ao gancho com o que o aluno agora sabe |
