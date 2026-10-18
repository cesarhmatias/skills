---
name: aula-interativa
description: Cria aulas em HTML com slides interativos, exemplos e animações que explicam mecanismos, sobre qualquer assunto. Use quando a pessoa quiser aprender um conteúdo nesse formato ou transformar material didático em uma aula visual. A entrada pede apenas idioma, assunto e profundidade ou quantidade de slides.
---

# Aula interativa

Transforme um assunto em uma aula HTML navegável e autocontida. O objetivo é a pessoa conseguir explicar ou aplicar o conteúdo, com exemplos e participação. Adapte a representação ao assunto: ferramentas, matemática, história, processos ou outros temas.

## Entrada: três perguntas

Pergunte somente o que ainda não foi respondido no pedido ou nesta conversa:

1. **Qual idioma? / Which language?** Português, English, Español ou outro. Se faltar, pergunte primeiro; traduza as perguntas seguintes para o idioma escolhido.
2. **O que você quer aprender hoje?** Aceite um tema, pergunta, problema ou material fornecido.
3. **Qual profundidade você quer?**
   - **1 — Pouca:** visão geral, conceitos centrais e um exemplo acompanhado; normalmente 6–8 slides.
   - **2 — Média:** funcionamento, exemplos, aplicação e uma variação ou falha; normalmente 12–16 slides.
   - **3 — Muita:** mecanismos internos, aplicações, limites, alternativas e exercícios de transferência; normalmente 20–28 slides.

Na terceira pergunta, aceite também uma quantidade exata de slides. As faixas são referências, não cotas de preenchimento. Respeite um total informado, incluindo abertura e fechamento quando existirem, e ajuste o escopo. Não pergunte quantidade e profundidade separadamente. Se a pessoa delegar a escolha, use o nível 2.

Depois dessas respostas, faça as escolhas de produção e construa a aula. Não acrescente um questionário de estética, currículo, narração ou plataforma. Use o contexto disponível para ajustar o nível; profundidade curta não significa aluno iniciante. Se uma ambiguidade impedir identificar o assunto, peça somente o esclarecimento necessário. Não execute a entrada se o pedido for apenas editar a própria skill.

## Planejamento e fontes

- Defina o resultado em termos observáveis: explicar, comparar, resolver, implementar ou operar. Delimite o que cabe na profundidade escolhida.
- Reaproveite conhecimentos prévios conhecidos. Quando forem desconhecidos, ofereça pré-requisitos em explicações opcionais sem novas perguntas de nivelamento.
- Pesquise antes de ensinar. Prefira fontes primárias e documentação oficial; verifique informações atuais de software e procedimentos. Material fornecido pode orientar o currículo; evite reproduzir extensamente conteúdo protegido.
- Organize conceitos por dependência. Uma trilha de curso vira um capítulo; uma unidade de raciocínio vira um slide. Não comprima uma trilha inteira em uma tela densa.
- Planeje internamente para cada slide: objetivo, ponto de partida, demonstração, estados da cena, interação quando útil, conclusão e fonte. Não exiba essas fichas como conteúdo da aula nem peça aprovação de cada uma.

## Didática

Use uma progressão flexível: problema e contexto → modelo → mecanismo → exemplo acompanhado → variação → aplicação → caso novo. Ajuste ao assunto; nem toda etapa precisa de um slide próprio.

Escolha um exemplo concreto e faça-o evoluir. Acrescente condições que justifiquem os próximos conceitos. Inclua contraexemplos e limites quando ajudarem a distinguir ideias. Declare onde uma analogia deixa de representar o mecanismo real.

Alterne demonstração e participação: observar → prever → experimentar → explicar. Dê feedback com o motivo da resposta. Em aulas curtas, inclua ao menos uma oportunidade de aplicar o conceito. Em aulas profundas, reduza gradualmente a ajuda e termine com um caso diferente do exemplo acompanhado.

Escolha interações pelo objetivo: variar parâmetros, ordenar etapas, comparar cenários, localizar uma falha, completar uma solução ou tomar uma decisão. Não force código, quizzes ou simulações em todos os temas. História e assuntos interpretativos exigem distinguir evidência, interpretação e incerteza.

## Software: conceito, interface e resultado

Conecte o modelo mental à operação: intenção → onde clicar → ação → resultado esperado → como verificar. Mostre trechos de código junto do comportamento que explicam, quando apropriado.

Identifique a versão demonstrada e a data de consulta. Verifique controles e percursos na UI usando documentação oficial, capturas ou uma instalação acessível. Explique diferenças entre versões quando verificadas e relevantes. Não chame uma versão de atual sem conferir.

Prefira capturas reais quando a interface exata importar. Identifique interfaces reconstruídas como simulações e procedimentos não verificados como tal. Diferencie exemplos executados, pseudocódigo e animações conceituais. Não invente controles, resultados ou screenshots. Demonstrações em contas reais continuam sujeitas à autorização do usuário; use ambiente local isolado ou simulação identificada quando apropriado.

## Padrão visual e motion design

- Crie uma direção visual coerente com o assunto, com tipografia legível, hierarquia e espaço. Use uma composição principal por slide; fontes, texto extenso e detalhes podem ficar em camadas opcionais.
- Faça o movimento representar tempo, dependência, transformação, mudança de estado ou comparação. Preserve identidade e posição dos elementos entre etapas quando isso ajudar a acompanhá-los.
- Construa primeiro os estados visuais importantes e depois suas transições. Destaque o elemento relevante, mostre a mudança e mantenha o resultado visível. Use easing e continuidade para tornar a mudança legível; evite movimento decorativo e transições aleatórias.
- Toda cena deve continuar compreensível quando pausada. O aluno controla o avanço; não retire texto nem avance slides automaticamente.
- Mantenha o mesmo sistema de navegação. Adapte diagramas, gráficos, documentos e exemplos ao conteúdo, sem forçar o mesmo layout em todos os slides.

Princípios de motion adaptados da [motion-designer](https://github.com/gabrielgreco1/skills/tree/main/motion-designer): história antes do visual, estados bem compostos, timeline determinística e revisão quadro a quadro. Esta skill é autocontida; não exige instalar essa referência nem seguir sua entrada de produção de vídeos.

## HTML e animação reproduzível

Entregue um HTML autocontido, com estilos, scripts e recursos incorporados quando possível, que abra sem serviço externo. Não dependa de um build ou servidor permanente para estudar. Se o pedido exigir recursos adicionais, entregue a pasta completa e explique como abrir.

Inclua índice, progresso, navegação por slides, controles de etapa, reprodução, pausa e reinício das cenas. Suporte teclado, foco visível e movimento reduzido. Não capture setas ou espaço durante edição de campos. Mantenha aprofundamento e fontes acessíveis.

Modele a cena por **slide + etapa + tempo local + entradas do aluno**. Exponha uma função como `window.lesson.seek({ slide, step, time, inputs })` que restaure o estado completo, inclusive ao voltar ou buscar fora de ordem. Aguarde fontes e recursos antes de sinalizar prontidão.

Calcule a imagem a partir desse estado: o mesmo estado produz o mesmo frame. O relógio de reprodução apenas avança o tempo local. Evite aleatoriedade sem seed, transições CSS que escapem ao seek e mudanças acumuladas que impeçam voltar no tempo. Separe o estado pedagógico do relógio da animação.

## Revisão com Playwright e entrega

Abra o HTML com Playwright e verifique navegação, teclado, etapas, pausa, reinício e uma interação de aprendizagem. Busque cenas fora de ordem para verificar que não dependem de reprodução anterior.

Capture os estados importantes de todos os slides. Gere quadros das sequências animadas curtas com Playwright, avançando a timeline frame a frame, normalmente a 30 fps, em lotes pequenos. Inspecione uma folha de contato e amplie os frames suspeitos. Confira cortes, sobreposições, legibilidade e continuidade durante as transições; uma captura final não basta. Corrija e recapture as cenas alteradas. Mantenha a revisão fora dos entregáveis e descarte frames temporários volumosos depois da inspeção.

Confira também uma largura menor e o modo de movimento reduzido. Não declare revisão visual ou execução que não tenha ocorrido. Se alguma verificação for impossível, informe a limitação específica.

Antes de entregar, confira o resultado de aprendizagem, exatidão, fontes, quantidade solicitada de slides e coerência entre explicação, imagem e comportamento. Execute exemplos em ambiente apropriado quando apresentados como testados; uma simulação no navegador não prova o funcionamento de uma ferramenta real.

Salve o resultado na pasta de entregáveis do projeto. Entregue o link da aula e uma instrução breve de navegação. O produto é o HTML interativo; exporte vídeo somente se solicitado.
