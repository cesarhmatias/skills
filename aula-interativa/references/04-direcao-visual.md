# Direção visual, composição e legibilidade

## Direção própria do conteúdo

Defina uma tese visual curta: que tipo de instrumento ajuda a compreender este assunto? Uma aula sobre circuitos pode usar desenho técnico; uma aula de história pode usar documentos e mapas; uma aula de matemática pode usar alinhamento de operações e gráficos manipuláveis.

Não use a mesma aparência de dashboard para todos os temas. O player pode ser consistente sem impor a composição de cada cena.

Registre tokens em `design.md`:

- Fundo, superfície, texto, texto secundário e contorno.
- Cores semânticas com papéis explícitos.
- Famílias e pesos tipográficos.
- Escala de títulos, corpo, legendas e código.
- Espaçamentos e limites de largura.
- Tratamento de diagramas, imagens, equações e destaques.
- Uma característica visual que pertença ao tema.

Escolha a paleta antes das cenas. Um estado de erro não pode reutilizar a cor de uma categoria importante sem distinção adicional.

## Hierarquia de uma tela

A tela tem regiões com responsabilidades:

```text
contexto / capítulo
pergunta ou título
explicação curta + demonstração principal
conclusão da etapa / feedback
controles persistentes
```

Essas regiões podem ser laterais ou empilhadas. Não sobreponha controles sobre conteúdo essencial. Uma coluna de apoio não precisa repetir palavra por palavra a legenda da cena.

O título identifica o assunto ou a pergunta de aprendizagem. Evite slogans vagos. A hierarquia deve continuar clara em uma captura sem animação.

## Geometria derivada

Meça o espaço disponível e derive posições a partir dele. Não espalhe coordenadas arbitrárias sem um sistema de referência.

Uma cena SVG pode usar um viewBox estável, mas precisa de tratamento para telas menores. Se o texto ficar minúsculo ao reduzir a escala, recomponha o layout ou permita uma ampliação útil; não declare responsividade apenas porque o SVG encolhe.

Para HTML:

```css
.lesson-grid {
  display: grid;
  grid-template-columns: minmax(16rem, .7fr) minmax(0, 1.7fr);
  gap: clamp(1rem, 3vw, 3rem);
}
@media (max-width: 52rem) {
  .lesson-grid { grid-template-columns: 1fr; }
}
```

Uma composição larga pode precisar de outro desenho no celular: sequência vertical em vez de quatro nós comprimidos na mesma linha.

## Tamanho de leitura

Use uma base confortável no viewport de estudo: corpo em torno de 17–20 px, legendas em torno de 14–16 px, código em torno de 14–16 px quando couber. Esses são pontos de partida, não números que dispensam inspeção.

Corte conteúdo antes de reduzir texto essencial a tamanho de rodapé. Rótulos muito pequenos em um diagrama continuam sendo texto essencial se o aluno precisa deles para seguir a explicação.

Evite linhas muito longas de prosa. Código longo pode rolar horizontalmente dentro de sua região, desde que o aluno perceba isso e o resto da página não ganhe overflow.

Números que mudam usam algarismos tabulares ou mono e espaço reservado. Evite um contador que desloca todos os rótulos ao mudar de 9 para 10.

## Fontes e carregamento

Use fontes locais com licença adequada ou fallbacks confiáveis. Se incorporar webfonts, registre a origem e verifique a licença de redistribuição.

Carregue os pesos usados antes de `lesson.ready`. Uma fonte carregada apenas no meio da animação pode mudar a largura do texto e provocar salto.

Teste a legibilidade com o arquivo final offline. Não dependa de uma fonte remota silenciosamente ausente para a composição funcionar.

## Diagramas

- Nós representam entidades; não transforme toda frase em uma caixa.
- Arestas precisam de significado definido.
- Diferencie fluxo de dados, controle e sequência temporal quando coexistirem.
- Evite atravessar rótulos com setas.
- Mantenha rótulos próximos da entidade correspondente.
- Faça uma legenda para símbolos ou códigos de cor novos.
- Mostre estado por texto ou símbolo além de cor.

Uma caixa com título e descrição pode conter texto intencionalmente; marque esse pertencimento na auditoria em vez de ignorar toda sobreposição.

## Gráficos e escalas

Fixe escalas quando o objetivo for comparar magnitudes entre estados. Uma escala automática que muda junto com o parâmetro pode esconder o efeito ensinado.

Se a escala precisar mudar, anime ou anuncie a mudança. Preserve unidades e explique recortes de eixo relevantes.

Mostre o valor exato em um rótulo estável quando a leitura pela posição não for suficiente. Nunca anime um número de forma independente da forma geométrica que deveria representá-lo.

## Imagens e screenshots

Use uma imagem quando ela for evidência ou ajudar a identificar um objeto. Não preencha slides com fotos decorativas sem relação com a explicação.

Screenshots precisam de ampliação e recortes legíveis. Uma captura inteira ilegível seguida de uma simulação inventada não ensina onde clicar.

A imagem pode ocupar uma região própria; os callouts ficam fora da área que o aluno precisa ler. Quando usar zoom, mantenha uma pequena indicação de onde o recorte veio.

## Estados intermediários

O layout precisa funcionar em todos os frames, não apenas nos endpoints.

Erros comuns:

- Um título novo entra enquanto o antigo ainda ocupa a mesma região.
- Um rótulo cruza uma aresta e fica ilegível.
- Um objeto sai do viewport durante um arco.
- O texto aparece antes do fundo ou do callout.
- A altura do card muda quando a legenda é substituída.
- O controle fica coberto por uma expansão da cena.

Planeje saídas e entradas na mesma faixa para que não disputem espaço. Reserve altura para legendas variáveis ou use transição explícita entre blocos.

## Acessibilidade funcional

Controles precisam de nomes, foco visível e operação por teclado. Ícones isolados precisam de rótulo acessível. O texto de feedback deve ficar disponível a tecnologias assistivas sem anunciar dezenas de atualizações por segundo durante um contador.

No movimento reduzido, leve a cena a um estado equivalente compreensível. Não esconda o mecanismo ou substitua a aula por uma tela vazia.

Respeite campos de edição: setas, espaço e teclas de texto pertencem ao campo enquanto ele está ativo. Atalhos do player não devem alterar a resposta do aluno.

## Instrumentação para revisão

Marque entidades e texto essencial no HTML:

```html
<section data-qa-boundary="scene">
  <h2 data-qa-text="title">Transferência</h2>
  <svg><!-- rótulos essenciais recebem data-qa-text --></svg>
</section>
```

Use `data-qa-allow-overlap` apenas com um motivo local documentado. Uma exceção não pode remover uma cena inteira da revisão. O script detecta colisões e cortes básicos; você ainda precisa julgar hierarquia, clareza e tamanho real de leitura.
