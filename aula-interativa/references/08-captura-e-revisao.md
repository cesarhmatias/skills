# Captura, inspeção e ciclo de correção

## O que cada etapa comprova

| Etapa | Comprova | Não comprova |
|---|---|---|
| Validação da skill | Estrutura e frontmatter | Qualidade das aulas |
| Execução do exemplo | Runtime e exemplo funcionam nesse ambiente | Toda futura cena será correta |
| Captura de frames | Estados renderizados em instantes definidos | Clareza e exatidão pedagógica |
| Auditoria automática | Verificações implementadas passaram | Julgamento visual ou domínio do assunto |
| Inspeção registrada | O revisor anotou os achados daquela versão | Que nenhum defeito possa existir |

Não escreva “revisão concluída” só porque o browser abriu ou uma screenshot foi salva.

## 1. Preparar o alvo

Use preferencialmente o HTML empacotado que será entregue. Capture o arquivo final, não uma versão anterior com dependências diferentes.

Registre a localização, o hash do conteúdo e, quando houver arquivos vinculados, seus hashes. Os scripts fazem esse registro. Alterar o HTML ou uma dependência invalida a evidência anterior.

Mantenha os arquivos de produção separados:

```text
work/aula/
  brief.md
  curriculum.json
  sources.json
  storyboard/
  source/
  qa/keyframes-desktop/
  qa/keyframes-mobile/
  qa/motion/
  qa/audit.json
outputs/
  aula.html
```

O aluno recebe o HTML e os recursos necessários. Frames e relatórios permanecem no diretório de trabalho, salvo pedido para inspecioná-los.

## 2. Capturar estados de todos os slides

```bash
node scripts/capture.mjs outputs/aula.html \
  --out work/qa/keyframes-desktop --mode keyframes --channel chrome
node scripts/capture.mjs outputs/aula.html \
  --out work/qa/keyframes-mobile --mode keyframes \
  --viewports 768x1024,390x844 --channel chrome
```

O modo keyframes captura início, 25%, 50%, 75% e fim de cada etapa; etapas instantâneas não geram cinco cópias iguais. Inclui defaults e os `auditCases` declarados por cena.

Inspecione todos os slides. Inclua telas com mensagens longas, código, screenshot ampliada, feedback, tabelas e alternativas diferentes do default.

Uma página que permite rolagem vertical no celular pode ser correta. Overflow horizontal involuntário, controle inacessível e texto essencial minúsculo não são resolvidos por simplesmente permitir rolagem.

## 3. Capturar transições quadro a quadro

```bash
node scripts/capture.mjs outputs/aula.html \
  --out work/qa/motion --mode motion --fps 30 --channel chrome
```

O tempo é fornecido por `lesson.seek`, em incrementos de 1/fps. Não use sleeps para tentar fotografar a animação em momentos aproximados.

Capture todas as transições usadas na aula no viewport principal. Para uma cena com movimento rápido, texto fino ou evento próximo da fronteira de frame, use 60 fps no trecho relevante.

Não aplique o pipeline de 240 fps para motion blur de vídeos sociais por padrão. Aqui o aluno precisa ler e inspecionar estados, e o entregável é interativo. Captura a 30 fps é uma referência de produção; aumente conforme a necessidade real.

## 4. Seleção e orçamento de captura

```bash
node scripts/capture.mjs outputs/aula.html \
  --out work/qa/reparo --mode motion --fps 60 \
  --slides mecanismo --steps transferir --scenarios maximo --channel chrome
```

`--slides`, `--steps` e `--scenarios` aceitam IDs separados por vírgula ou `all`. Defaults são identificados como cenário `default`.

O limite padrão de 6.000 frames evita uma geração acidental sem limite. Divida por viewport/cena ou use `--max-frames` com um orçamento deliberado. Não remova o limite por conveniência.

Uma seleção parcial serve para reparar e investigar, não para declarar a aula inteira revisada. O auditor exige cobertura de todos os slides e etapas para um relatório completo; `--partial` permite um relatório explicitamente parcial.

Para reaproveitar um diretório, `--overwrite` reescreve o manifesto e reinicia o registro visual. Prefira diretórios novos durante diagnóstico para preservar a comparação.

## 5. Entender a instrumentação

O verificador lê marcações do HTML:

- `data-qa-text`: bloco ou rótulo essencial, não cada palavra de uma frase.
- `data-qa-boundary`: limite de uma região de conteúdo.
- `data-qa-focal`: objeto cujo recorte deve ser detectado.
- `data-qa-scroll`: região que intencionalmente permite leitura por rolagem.
- `data-qa-allow-overlap`: exceção local acompanhada de um motivo no valor.

Marcações não dispensam inspeção. O verificador detecta cortes e colisões básicas de retângulos; não reconhece sozinho toda sobreposição entre formas arbitrárias ou erro conceitual num desenho.

Não marque a cena inteira como exceção para conseguir um relatório verde. Se uma colisão for intencional, registre qual elemento pertence a qual estrutura e inspecione o resultado.

## 6. Gerar folhas de contato

```bash
node scripts/contact_sheet.mjs work/qa/motion/manifest.json
```

O padrão representa todos os frames, sem pular nenhum (`stride=1`). Cada tile mostra índice e tempo local. `sheets.json` relaciona folhas, grupos e frames.

Para triagem, `--stride 3` representa menos frames. O índice registra essa amostragem. Não descreva uma inspeção com stride 3 como inspeção visual de todos os frames.

Folhas de contato servem para notar saltos e comparar. Abra os frames originais para julgar leitura, alinhamento e defeitos pequenos. Uma miniatura não comprova que o texto está legível no tamanho de estudo.

## 7. Inspeção visual efetiva

Para cada grupo de frames:

1. Abra suas folhas de contato.
2. Siga a ordem temporal.
3. Observe entradas, saídas, cruzamentos e mudanças de estado.
4. Abra o frame anterior e posterior ao momento suspeito.
5. Confira o endpoint no tamanho real.
6. Repita nos cenários de limite e erro.
7. Registre achados e decisão em `review.json`.

O arquivo começa com `status: "pending"`. Após inspeção real, use `pass` ou `fail` e notas concretas. Exemplos de notas úteis:

```text
pass: origem e destino estáveis; rótulos não colidem; números e volumes
concordam em 0, 0,5 e 1,0 s; endpoint legível a 1440 px.

fail: rótulo B cruza a seta entre 0,4 e 0,6 s; corrigir posição do callout.
```

Não preencha todos os grupos com “OK” sem olhar as imagens. O script registra a declaração do revisor; não é capaz de provar que ele olhou.

## 8. Testes funcionais e determinismo

```bash
node scripts/audit.mjs outputs/aula.html \
  --capture work/qa/motion/manifest.json \
  --out work/qa/audit.json --channel chrome
```

O auditor confere hashes, imagens capturadas, erros, carregamento offline, problemas de layout registrados, seek fora de ordem, parada após uma etapa, movimento reduzido, fim de reprodução antes do próximo slide e preservação da navegação durante edição.

`--require-visual` exige registro visual completo e íntegro para sair com sucesso. Sem essa opção, um relatório pode ter testes automáticos aprovados e continuar com `verdict: needs-visual-review`.

Para verificar as ferramentas incluídas, execute `test_player.mjs` com o exemplo de referência e `test_tools.mjs` com o HTML empacotado e seu manifesto. Este último injeta colisão, alteração do HTML e corrupção de imagem para verificar falhas reais, além de testar empacotamento offline.

Acrescente testes específicos da aula: conservação, monotonicidade, datas, resultados de cálculo, decisão de branch, resposta de exercício e estados de falha. Testes genéricos do player não verificam o conteúdo de uma nova cena.

Teste também: teclado após clicar em controles, foco visível, abrir/fechar detalhes, reiniciar, alternar hipóteses repetidamente e retomar um rascunho. Essas ações costumam revelar estado oculto.

## 9. Corrigir sem apagar evidência

Classifique o defeito antes de reparar:

| Defeito | Reparo típico |
|---|---|
| Texto colide | Reorganizar espaço, reduzir conteúdo ou separar etapa |
| Legenda contradiz a cena | Derivar do mesmo modelo e condição temporal |
| Número salta | Reservar largura e revisar arredondamento |
| Seek depende do passado | Remover incrementos acumulados e restaurar propriedades |
| Etapa avança duas vezes | Separar navegação, reprodução e preferência de movimento |
| Cena estática com play | Redesenhar a demonstração do mecanismo |
| UI não corresponde à versão | Revalidar o procedimento e substituir evidência |

Depois do reparo, recapture o trecho e os cenários afetados. Se mudar tokens, tipografia, layout ou player global, a abrangência de regressão aumenta. Não reutilize o relatório antigo para o HTML novo.

## 10. Conclusão e limpeza

Antes de entregar, abra o HTML final offline em um browser real, teste a navegação e compare seu hash com o relatório. Verifique os resultados de aprendizagem e a informação de versão.

Mantenha folhas, manifestos, notas e frames usados para evidência enquanto estiver corrigindo. Depois de consolidar a revisão, apague frames temporários volumosos que não precisam ser preservados. Não apague diretórios desconhecidos nem use limpeza global de caches.

Informe limitações específicas: “não houve execução no produto X” ou “não foi possível verificar o viewport Y”. Não esconda uma falha sob “revisado com Playwright”.
