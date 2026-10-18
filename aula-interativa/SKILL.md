---
name: aula-interativa
description: Produz aulas em slides HTML sobre qualquer assunto, com exemplos, exercícios, cenas animadas determinísticas e revisão visual quadro a quadro via Playwright. Use quando o usuário quiser aprender nesse formato ou transformar material em uma aula interativa. Pergunta apenas idioma, assunto e profundidade ou quantidade de slides; executa pesquisa, roteiro, design, motion, captura, correção e entrega com os recursos incluídos.
---

# Aula interativa

Uma entrada simples deve acionar uma produção completa. Entregue uma aula utilizável: o aluno consegue seguir o mecanismo, manipular um exemplo e aplicar o conceito. Não entregue apenas um resumo ilustrado ou um plano de slides.

## Entrada: somente três perguntas

Reutilize respostas explícitas do pedido e da conversa. Não pergunte novamente o que já foi respondido. Se faltar idioma, pergunte-o antes das demais perguntas e traduza o restante para a resposta escolhida.

1. **Qual idioma? / Which language?** Português, English, Español ou outro.
2. **O que você quer aprender hoje?** Aceite tema, problema, pergunta, ferramenta ou material.
3. **Qual profundidade?** 1 — pouca, 2 — média, 3 — muita. Aceite também uma quantidade exata de slides na mesma resposta.

| Escolha | Escopo de referência | Faixa usual, não cota |
|---|---|---|
| 1 | Modelo central, exemplo acompanhado, aplicação curta | 6–8 slides |
| 2 | Mecanismo, exemplos, aplicação e variação | 12–16 slides |
| 3 | Mecanismos internos, casos, limites, operação e transferência quando pertinentes | 20–28 slides |

Respeite uma quantidade exata, contando abertura e fechamento quando usados. Profundidade não é conhecimento prévio: não trate um profissional experiente como iniciante por ele escolher uma aula curta. Se o usuário delegar a escolha, use 2. Não acrescente um questionário de estética, plataformas, áudio ou currículo. Uma ambiguidade que impeça identificar o assunto admite um esclarecimento específico. Não execute a entrada quando a tarefa for editar esta skill.

## Recursos: leia no momento indicado

| Quando | Leitura / recurso obrigatório | Resultado esperado |
|---|---|---|
| Depois da entrada | [Didática](references/01-didatica.md) | Objetivos, pré-requisitos e progressão |
| Ao pesquisar | [Fontes e interfaces](references/02-fontes-e-interfaces.md) | Evidências, versões e demonstrações honestas |
| Antes de desenhar | [Roteiro de cenas](references/03-roteiro-de-cenas.md) | Beats, estados, exemplos e perguntas |
| Antes de compor frames | [Direção visual](references/04-direcao-visual.md) | Tokens, hierarquia, geometria e layouts |
| Antes de animar | [Motion](references/05-motion.md) e [Receitas](references/06-receitas-motion.md) | Timing, easing, continuidade e mecanismos |
| Ao implementar | [Runtime e HTML](references/07-runtime-html.md) | Player, render puro e interações |
| Antes de entregar | [Captura e revisão](references/08-captura-e-revisao.md) | Frames, testes, inspeção e reparos |
| Para julgar qualidade | [Falhas e critérios](references/09-criterios-e-falhas.md) | Critérios observáveis de aceitação |

As referências contêm decisões e procedimentos; os scripts executam verificações. Ler uma referência ou passar um script não equivale a fazer revisão visual.

## Pipeline de produção

1. **Preparar.** Verifique as ferramentas com `node scripts/check_env.mjs`. Use o runtime já disponível no ambiente antes de instalar dependências. Leia [runtime](references/07-runtime-html.md) para os caminhos portáveis. Se algo faltar, procure uma alternativa disponível; informe uma limitação concreta se continuar impossível.
2. **Pesquisar e estruturar.** Defina resultados observáveis, reúna fontes e desenhe o mapa de dependências. Use o contexto real do aluno. Produza internamente `brief.md`, `sources.json` e `curriculum.json` no diretório de trabalho.
3. **Roteirizar.** Especifique cenas por estado, causa, efeito, tempo e interação. As etapas têm nomes próprios e quantidade variável. Registre os momentos em que texto, desenho e feedback devem concordar. Não force quatro etapas em toda cena.
4. **Desenhar.** Componha os estados inicial, intermediários importantes e final de cada cena. Meça os textos. Escolha layouts que sirvam ao assunto e uma linguagem visual consistente. Revise frames densos antes de interpolar.
5. **Implementar motion.** Use `templates/motion.js` para easing, trajetórias e números ou implemente equivalentes puros. Faça o movimento explicar o mecanismo; a mera entrada de caixas não substitui a demonstração. Siga as receitas correspondentes.
6. **Implementar o player.** Use `templates/player.js` e `templates/player.css`, adaptando a composição, com `examples/mecanismo.html` como exemplo executável. Mantenha a API de captura documentada em [runtime](references/07-runtime-html.md). Navegar uma etapa deve parar nela; reproduzir uma cena pode percorrer suas etapas e deve parar antes do próximo slide.
7. **Revisar em ciclos.** Capture estados de todos os slides e todas as transições com `scripts/capture.mjs`. Gere folhas de contato com `scripts/contact_sheet.mjs`. Rode `scripts/audit.mjs`; inspecione as folhas e os frames suspeitos. Corrija, recapture os trechos alterados e atualize a evidência. O relatório deve corresponder ao hash do HTML entregue.
8. **Empacotar e entregar.** Gere HTML autocontido com `scripts/pack.mjs` quando tiver usado arquivos locais. Abra e teste o arquivo final, inclusive offline. Entregue o HTML e apenas os recursos necessários ao aluno. Guarde roteiros, frames e relatórios fora dos entregáveis.

Não peça aprovação de cada roteiro ou keyframe. Avance dentro do escopo autorizado; dúvidas estéticas comuns são decisões de produção. Audio, vídeo, 3D e contas externas só entram se ajudarem o objetivo e estiverem no escopo. A aula funciona sem som por padrão.

## Invariantes de execução

- O mesmo slide, etapa, tempo e entradas produzem o mesmo frame, inclusive buscando fora de ordem.
- Fonte, imagens e recursos carregam antes de `lesson.ready`. Um recurso necessário que falhou deve ser informado; não declare prontidão silenciosa.
- O modelo determina texto, cores, estados, equações e feedback. Não mantenha uma legenda fixa que contradiz a simulação escolhida.
- Voltar ou reiniciar não depende de reproduzir etapas anteriores. Inputs têm defaults explícitos; `seek` não herda entradas ocultas de outra captura.
- A timeline do conteúdo não depende de transições CSS, relógio real, rede ou aleatoriedade sem seed. A reprodução só converte tempo do player em tempo local.
- Dados reais, capturas reais, interfaces reconstruídas e pseudocódigo recebem rótulos corretos. Identifique versão e data de consulta onde a operação depende delas.
- Interações exigem consequência e feedback. Um formulário sem avaliação, uma animação sem significado ou uma tabela estática com botão de play não contam como demonstração.
- Conteúdo correto com layout ruim exige reparo. Layout bonito com explicação enganosa também exige reparo.

## Comandos de referência

Execute a partir da pasta desta skill ou use caminhos absolutos para seus scripts. `lesson.html` representa o HTML que está sendo produzido, não o exemplo incluído.

```bash
node scripts/check_env.mjs --channel chrome
node scripts/capture.mjs lesson.html --out work/qa/keyframes --mode keyframes --channel chrome
node scripts/capture.mjs lesson.html --out work/qa/motion --mode motion --fps 30 --channel chrome
node scripts/contact_sheet.mjs work/qa/motion/manifest.json
node scripts/audit.mjs lesson.html --capture work/qa/motion/manifest.json --out work/qa/audit.json --channel chrome
node scripts/pack.mjs source/lesson.html --out outputs/lesson.html
```

O canal é opcional: sem `--channel`, usa Chromium do Playwright. Os scripts aceitam `LESSON_NODE_MODULES` para dependências já instaladas. Consulte a referência de revisão para viewports, cenários, seleção de cenas e interpretação do relatório. Não troque falha por silêncio nem marque inspeção visual como aprovada por conveniência.

## Estado de conclusão

Conclua quando a aula cobrir os objetivos, houver prática com feedback, as animações tiverem sido capturadas e inspecionadas, os problemas relevantes estiverem resolvidos e o HTML final tiver sido aberto e testado. Se uma verificação não puder ser realizada, diga exatamente qual foi e não a registre como realizada.

Na resposta final: link da aula, instrução curta para navegar e limitações materiais. Não entregue a árvore de produção como se fosse a aula. Ao editar esta skill, valide seus scripts e o exemplo executável, sincronize a instalação solicitada e mantenha o pacote do repositório coerente.
