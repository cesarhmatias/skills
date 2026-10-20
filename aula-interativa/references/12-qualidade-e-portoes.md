# Qualidade: rubrica, portões e falhas típicas de modelos

Esta referência existe para que a qualidade não dependa do modelo que está produzindo a aula. Ela transforma “ficou bom?” em perguntas com respostas observáveis, define quando é proibido seguir adiante e lista as falhas que modelos de linguagem cometem com mais frequência, com a contramedida de cada uma.

## 1. Rubrica (nota 1–5 por dimensão)

Dê a nota olhando o storyboard e o roteiro, não a intenção. Registre as notas e uma justificativa de uma linha em `$WORK/qualidade.md`. **Toda dimensão precisa de 4 ou mais para entregar.**

| Dimensão | 1 | 3 | 5 |
|---|---|---|---|
| **Arco** | Lista de tópicos | Tem mecanismo, mas sem gancho, prova ou fechamento | Os 8 movimentos de [arco](10-arco-da-aula.md) presentes, na ordem, com caso único |
| **Caso único** | Exemplo muda a cada tela | Um caso principal com desvios | O mesmo caso, com os mesmos nomes e números, do gancho ao fechamento; a prática troca o caso de propósito |
| **Clareza por tela** | Várias ideias por tela | Uma ideia, mas exige ler muito | Em 3 s dá para dizer a ideia; um foco por vez |
| **Texto** | Texto espalhado em muitos estilos, rodapés, citações | Arrumado, mas genérico ou repetido | Frases concretas e causais; aprofundamento num bloco só quando ajuda; uma voz tipográfica ([escrita](11-escrita.md)) |
| **Calma visual** | Muitos tamanhos, cores e lugares de texto | Escala respeitada, mas um ou outro elemento solto | No máximo 4 degraus de tamanho, poucas cores com papel, uma região de texto, rótulos colados aos objetos |
| **Termos** | Jargão sem definição | Definidos, mas em bloco | Um termo por passo, com desenho, antes do uso; nome estável |
| **Mecanismo** | Desenho estático com botão de play | Movimento sem causa clara | Um evento causal por passo, contador ou estado, rastro visível |
| **Prova real** | Nenhuma | Mock genérico ou não verificado | Ferramenta, dado ou fonte primária reproduz o mecanismo, com formato verificado |
| **Prática** | Nenhuma ou decoreba | Pergunta com feedback “certo/errado” | Contexto novo, distratores plausíveis, feedback que nomeia o erro; tipos variados |
| **Visual** | Desalinhado, pequeno, vazio | Limpo mas pálido ou com buracos | Desenho ocupa a cena, hierarquia nítida, paleta com papéis, parece produto acabado |
| **Movimento** | Nenhum ou decorativo | Funciona mas brusco ou lento | Entradas calmas, deslocamentos com significado, foco acompanhado, para no fim |
| **Celular** | Ilegível | Legível com rolagem e cortes | Recomposto, legível, sem rolar para ver o essencial |
| **Honestidade** | Simulação como real, números incoerentes | Rotulado mas com incoerências | Tudo rotulado, números coerentes, simplificações ditas no ponto onde importam |

## 2. Portões

Um portão é um ponto em que você **para e verifica** antes de seguir. Não pule portões, mesmo com pressa ou confiança.

| Portão | Quando | Artefato | Passa quando |
|---|---|---|---|
| **P1 Brief** | Antes do roteiro | `brief.md` (modelo em `templates/brief.md`) | As 7 decisões do [arco](10-arco-da-aula.md#1-as-sete-decisões-que-vêm-antes-de-qualquer-tela) estão preenchidas com exemplos concretos; resultados do caso calculados |
| **P2 Roteiro** | Antes de código | `roteiro.md` (modelo em `templates/roteiro.md`) | Teste de leitura em voz alta passa; termos com tela de definição; tipos alternam; cada movimento do arco mapeado; nenhuma frase fora do orçamento |
| **P3 Primeira tela** | Depois de implementar 2–3 telas | storyboard parcial | Tipografia, paleta e desenho já com cara de produto; corrija o estilo aqui, antes de multiplicá-lo |
| **P4 Storyboard** | Aula completa | storyboard desktop, celular e erros | Checklist de [experiência](00-experiencia-do-aluno.md) “sim” em toda tela; rubrica ≥ 4 |
| **P5 Entrega** | Antes de responder | captura, auditoria, testes da aula | 0 problemas de layout; auditoria sem falhas; motion revisado; HTML final aberto |

Se um portão falha, volte ao artefato que causou a falha (muitas vezes o roteiro), não remende só a tela.

## 3. Falhas típicas de modelos e contramedidas

| Falha | Como aparece | Contramedida |
|---|---|---|
| **Enciclopédia** | Telas que definem e listam em vez de mostrar | Cada tela precisa de um verbo de ação no desenho (algo acontece) ou ser `explicar` de um único termo |
| **Abstração prematura** | Começa pela definição formal | Gancho no cotidiano + revelação em mock antes de qualquer definição |
| **Exemplos trocados** | Um exemplo diferente por tela | Caso único no brief; consulte-o ao escrever cada tela |
| **Texto inflado** | Frases vazias, adjetivos, “muito importante” | Reescreva com [escrita](11-escrita.md); mais texto só se explica mais |
| **Poluição tipográfica** | Cada rótulo num tamanho, várias cores de texto, frases soltas pelo desenho | Escala de 4 degraus; cores com papel; uma região de texto; a captura acusa `TYPE_SIZES`/`TEXT_COLORS` |
| **Jargão em cascata** | Três termos novos numa frase | Um termo por passo; lista de termos no roteiro com a tela de definição |
| **Desenho de caixas** | Retângulos com texto e setas sem significado | Elenco fixo, evento por passo, contador; cada seta tem significado declarado |
| **Movimento decorativo** | Tudo entra deslizando, nada explica | Motion só para causa → efeito; entradas discretas |
| **Mock inventado** | Saída de comando plausível mas errada | Verifique na documentação ou execute; registre em `sources.json` |
| **Números incoerentes** | Um valor numa tela, outro na seguinte | Valores no objeto do caso (`const CASE = {…}`); o texto deriva do modelo |
| **Prática fácil demais** | Pergunta repete a frase de uma tela | Contexto novo; distratores que representam erros reais |
| **Feedback genérico** | “Correto!” / “Tente novamente” | Feedback refaz a cadeia com números e nomeia o erro |
| **Esquecer o celular** | Desenho largo encolhido | Versão `narrow` ou viewBox justo; storyboard em 390×844 |
| **Parar cedo** | Entrega após a primeira captura sem problemas | Rubrica ≥ 4 em tudo; ao menos dois ciclos de storyboard |
| **Desenho enganoso** | Uma peça desenhada como outra coisa (proteína como vírus, pacote como arquivo) | Regra de representação fiel em [direção visual](04-direcao-visual.md); o especialista da autocrítica olha só o desenho |
| **Mecanismo desconectado** | Peças que deveriam mover juntas aparecem soltas (pistão sem biela, engrenagem sem contato) | Seção “Objetos e mecanismos físicos” de [direção visual](04-direcao-visual.md); desenhe a partir de um diagrama técnico |
| **Composição esparsa** | Desenho pequeno num canto, número do outro lado, vazio no meio | Rótulos e números junto da peça; desenho maior; a captura acusa `SCENE_SPARSE` |
| **Generalizar o caso** | “Um motor 1.0 tem quatro cilindros” | Fale do caso com “este/aqui”; regra geral só com fonte ([escrita](11-escrita.md#8-caso-e-regra)) |
| **Prova real fraca** | Mock “ilustrativo” sem nenhum produto, dado ou documento real | Tabela de prova real por assunto em [arco](10-arco-da-aula.md#7-o-que-conta-como-prova-real) |
| **Relatar sem olhar** | “Revisão visual concluída” sem abrir imagens | Cite no relatório o que viu e corrigiu em cada ciclo |

## 4. Autocrítica em três papéis

Depois de cada ciclo de storyboard, revise três vezes, cada vez em um papel, e anote os achados:

1. **O aluno iniciante:** “Eu sei o que olhar? Entendo cada palavra? Sei o que fazer agora? Quero continuar?”
2. **O especialista do assunto:** “Algo está errado ou enganoso? A simplificação esconde algo que muda a conclusão? O mock é fiel?”
3. **O diretor de arte:** “Isto parece um produto acabado? Há buracos, desalinhamentos, textos pequenos, cores sem papel, dois focos ao mesmo tempo?”

Corrija os achados dos três antes do próximo ciclo. Repita até um ciclo não gerar achados relevantes.

## 5. Regra de parada

Entregue somente quando:

- P1–P5 passaram;
- toda dimensão da rubrica tem nota ≥ 4, registrada com justificativa;
- o último ciclo de autocrítica não gerou achado relevante;
- você consegue apontar, no storyboard, onde está cada movimento do arco.

Se algo não puder ser feito (sem acesso a uma ferramenta, fonte indisponível), diga exatamente o quê e qual dimensão ficou abaixo de 4.
