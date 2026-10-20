# Critérios de qualidade e falhas que exigem reparo

## Usar evidência observável

Julgue a aula pelo que o aluno consegue observar e fazer. Quantidade de arquivos, linhas, slides ou animações não comprova qualidade. Os módulos existem para orientar decisões e tornar o trabalho reproduzível.

## Experiência do aluno

Falhas reais que reprovaram uma aula desta skill:

- Parágrafo de contexto acima de cada cena e rodapé “Fonte: PostgreSQL 17, §64.1.4” em todas as telas.
- Cinco botões de player (Reproduzir, Pausar, Reiniciar, Etapa ←/→) e o aluno sem saber o que apertar.
- “Folhas” usado antes de qualquer explicação do que é uma folha.
- Texto em seis tamanhos e quatro cores espalhado pela tela; desenho ocupando um terço da cena; buracos de espaço vazio. (Texto longo, sozinho, não é defeito: um parágrafo de aprofundamento bem composto é bem-vindo.)
- Visual genérico de documento, sem nenhum mock do mundo real.

Reparo: roteiro fala · imagem · tipo; uma frase por passo; termo antes do uso; mock do caso real; player guiado; storyboard revisado com o checklist de experiência.

## Didática

Uma aula está pronta nesta dimensão quando:

- O objetivo central tem um critério de aplicação ou explicação.
- Os pré-requisitos aparecem antes de serem necessários.
- O exemplo tem entradas, resultados e hipóteses coerentes.
- Há uma consequência que o aluno pode prever ou experimentar.
- O feedback explica a relação causal.
- A profundidade escolhida é atendida por mecanismos e decisões, não só listas.
- A aplicação final usa o conteúdo ensinado sem introduzir requisitos ocultos.

Falha de aceitação: o aluno passa por 26 slides de definições e ainda não consegue explicar um único caso do começo ao fim.

Reparo: escolher um caso central, demonstrar o mecanismo e retirar tópicos que não contribuem para o resultado escolhido.

## Fontes e operação

Uma demonstração de software precisa distinguir o procedimento verificado de uma simulação. O aluno deve saber qual versão está olhando e como conferir o resultado.

Falhas de aceitação:

- Captura inventada apresentada como real.
- Botão demonstrado que não existe na versão consultada.
- Código com import de outra versão sem aviso.
- Sintaxe analisada apresentada como integração executada.
- UI inteira ilegível sem opção útil de ampliação.

Reparo: trocar a evidência, identificar a reconstrução e testar ou delimitar o código.

## Motion

Uma transição precisa mostrar alguma relação: mudança de estado, transformação, deslocamento, estrutura ou comparação. A identidade dos elementos permanece compreensível.

Falhas de aceitação:

- O botão play apenas muda um número de etapa sobre uma tabela estática.
- Uma caixa “running” fica ativa antes de suas condições serem satisfeitas.
- Uma seta sugere transporte físico quando há somente atualização de metadados.
- Um contador e sua geometria usam resultados diferentes.
- O texto diz “concluído” durante a transição inicial.
- O objeto atravessa o rótulo que o aluno precisa ler.

Reparo: especificar o modelo, eventos e propriedades; depois reconstruir a transição com timing explícito.

## Composição e leitura

A tela precisa funcionar nos endpoints e entre eles. O olhar deve encontrar uma ordem clara de leitura.

Falhas de aceitação:

- Texto essencial fica minúsculo para caber.
- Código ou diagrama cria overflow horizontal da página.
- Um elemento fica cortado por uma região com overflow hidden.
- Dois títulos disputam o mesmo espaço no meio da troca.
- Uma legenda varia de altura e desloca os controles a cada frame.
- A versão mobile é só a composição larga encolhida até perder leitura.
- Um rótulo de SVG termina fora do viewBox e aparece cortado, sem nenhum overflow na página.
- No desktop, o aluno precisa rolar a página para encontrar Continuar.

Reparo: recompor o layout, dividir conteúdo e reservar regiões estáveis. Não use mais efeitos para esconder um problema de espaço.

## Interação e player

Os controles precisam corresponder ao nome da ação. A preferência de movimento reduzido preserva informação e alcance da navegação.

Falhas de aceitação:

- Continuar reproduz todos os passos restantes de uma vez.
- O fim de uma animação troca de tela sem o aluno pedir.
- Setas navegam enquanto o aluno edita uma resposta.
- Uma prática deixa avançar sem resposta, ou mostra só “errado”.
- Digitar perde foco porque o campo foi reconstruído.
- Rever (↺) ou Voltar mantém cores ou rótulos de outro passo.
- Seek direto e reprodução sequencial geram estados diferentes.
- Uma resposta errada recebe apenas “erro”, sem explicação.

Reparo: separar player, estado e render; testar a sequência concreta que falhou.

## Revisão e evidência

O pacote de evidência deve corresponder ao arquivo entregue. A inspeção precisa cobrir mais do que o estado final.

Falhas de aceitação:

- Apenas um screenshot final para uma cena animada.
- Capturas em momentos aproximados com sleeps.
- Relatório de uma versão anterior do HTML.
- Exceção global que desativa as verificações de overlap.
- “Passou na revisão visual” escrito por um script sem registro de inspeção.
- Cenários de erro nunca capturados.
- O exemplo é validado e isso é apresentado como validação de toda aula futura.

Reparo: recapturar por seek, registrar hash, inspecionar frames e documentar os achados específicos.

## Processo de decisão

Para cada defeito, registre:

```text
onde: slide / etapa / cenário / viewport / tempo
observação: o que aparece errado
impacto: qual interpretação ou ação fica comprometida
causa provável: modelo, roteiro, layout, motion, player ou evidência
reparo: alteração concreta
verificação: qual captura ou teste comprova o resultado
```

Priorize defeitos que mudam o entendimento, impedem a operação ou comprometem a evidência. Polimento visual não deve adiar uma correção factual.

## O que pode continuar como limitação explícita

Uma aula pode conter um exemplo de referência não executado em um produto real, desde que isso esteja identificado e o conteúdo não dependa de uma alegação de execução. Uma reconstrução pode simplificar a UI, desde que a simplificação e a versão de referência sejam claras.

Essas limitações não permitem inventar uma operação nem entregar um controle quebrado. Se a verificação necessária ao próprio objetivo estiver indisponível, ajuste o escopo e diga o que ficou sem comprovação.

## Pronto para entrega

A decisão final combina:

1. Conteúdo e sequência conferidos.
2. Exemplos e exercícios com resultados coerentes.
3. Cenas capturadas e inspecionadas.
4. Problemas relevantes reparados e recapturados.
5. Player e arquivo final testados.
6. Evidência correspondente à versão final.

Não converta essa decisão em uma nota numérica arbitrária. Descreva o resultado e qualquer limitação material com precisão.
