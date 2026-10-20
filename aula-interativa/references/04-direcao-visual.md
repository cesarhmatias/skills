# Direção visual, composição e legibilidade

Leia antes [experiência do aluno](00-experiencia-do-aluno.md): orçamento de texto, tipos de tela e composição vêm de lá. Esta referência trata de como desenhar.

## 1. O palco

O player dá a hierarquia fixa de toda tela:

```text
progresso (segmentos)                                   Fontes
KICKER
Título da tela
┌──────────────────────── cena ────────────────────────┐
│  um bloco: desenho, mock, frase grande ou pergunta   │
└──────────────────────────────────────────────────────┘
[controles da tela, se houver]
← Voltar   Frase deste passo ……………………   ↺   [ Continuar → ]
```

Não acrescente regiões. Não ponha parágrafo entre o título e a cena. Não ponha botões dentro da cena.

## 2. Tese visual e tokens

Escolha uma tese curta para o assunto: que instrumento ajuda a ver? Páginas de papel para banco de dados; recipientes para quantidades; mapa para história; circuito para eletrônica. Ela guia formas e uma cor de atenção.

Redefina só os tokens no `:root` da aula:

- `--accent` / `--accent-soft` / `--accent-ink`: a cor do assunto (entidades principais).
- `--warm` / `--warm-soft`: atenção (o que está acontecendo agora). Use em um elemento por vez.
- `--good` / `--bad`: feedback. Nunca para categorias.
- `--bg`, `--surface`, `--ink`, `--muted`, `--line`: neutros. Mantenha alto contraste.

Duas cores de conteúdo e uma de atenção bastam. Estado também é dito por texto ou forma, não só por cor.

Fonte: o player usa Inter quando a aula a embute (`@font-face` local, licença OFL) e cai para a fonte do sistema. Ambas funcionam; não carregue fontes remotas.

## 3. Blocos de cena (kit.js)

| Bloco | Uso | Regra |
|---|---|---|
| `diagram(svg, {w,h})` | Mecanismo desenhado | `w×h` = caixa do conteúdo, sem margens vazias |
| `diagram(…, {view, camera:true})` | Desenho maior que a tela | Enquadre o foco; marque `data-qa-focal` |
| `split({say, sub, read, visual})` | Termo ou ideia + desenho | `say` ≤ 1 frase; `sub` curta; `read` aprofundamento de até ~5 linhas |
| `hero({big, say, sub})` | Um número ou afirmação | Para viradas e conclusões |
| `terminal(…)` / `app(…)` | Mock da situação real | Formato verificado; selo de simulação |
| `quiz({...})` | Prática | Feedback por alternativa |
| `cards(items, time)` | Resumo | 2–4 cartões, ≤ 12 palavras cada |

## 4. Geometria derivada

- Desenhe em coordenadas próprias do conteúdo: se o desenho tem duas colunas de 220, o viewBox tem ~620 de largura, não 1200.
- Derive posições de constantes nomeadas (`LX(i)`, `LEVEL_Y`); nada de números soltos espalhados.
- Tamanhos no viewBox: escolha **um** tamanho para rótulos e **um** para valores/títulos internos e mantenha-os em toda a aula (a captura acusa `TYPE_SIZES` acima de 4 degraus por tela). Confira o tamanho renderizado: a captura acusa `TEXT_TOO_SMALL` abaixo de 11 px.
- No celular a cena encolhe para ~350 px. Um viewBox justo ao conteúdo normalmente basta. Se não bastar, recomponha: passe `narrow: { body, w, h }` a `LessonKit.diagram` com uma versão vertical do mesmo desenho, calculada do mesmo estado (o CSS mostra uma ou outra; o `render` não depende do viewport). Faça a versão `narrow` sempre que rótulos essenciais renderizarem abaixo de ~14 px no celular (o limite duro da captura é 11 px, mas 12–13 px já cansa). Desenhe-a com proporção perto de 4:5 a 1:1 (é o espaço útil da cena num celular): empilhe ou ponha em diagonal; uma tira alta demais estica a página. Câmera também resolve desenhos largos. `scroll: true` é último recurso.
- Texto em SVG precisa caber no viewBox: o que passa da borda é cortado sem aviso na página (a captura acusa `TEXT_CLIPPED`). Reserve espaço para a frase mais longa entre todos os cenários.

## 5. Composição

- **Um bloco por cena.** Desenho e seus rótulos formam um grupo central; não espalhe partes pelos cantos.
- **Sem buracos.** No estado final de cada tela o conteúdo ocupa ao menos ~45% da cena (mocks ~30%); a captura acusa `SCENE_SPARSE`. Passos intermediários podem começar com pouco. Se sobra vazio, aumente o desenho, traga rótulos e números para perto, aproxime a câmera ou mude o bloco.
- **Rótulos junto da coisa.** Um rótulo fica a menos de ~1 altura de linha do objeto; nunca numa legenda separada.
- **Números que mudam:** algarismos tabulares, largura reservada, unidade sempre visível.
- **Escalas fixas** quando o objetivo é comparar; se a escala muda, anime e diga.

## 6. Objetos e mecanismos físicos

Quando o assunto é uma máquina, um órgão, um circuito ou qualquer coisa com peças, o desenho **é** a explicação. Um ícone genérico não serve.

- **Peças que se movem juntas aparecem ligadas.** Pistão, biela e virabrequim; engrenagens que se tocam; válvula e came. Se o aluno não vê a ligação, não vê a causa.
- **Proporções plausíveis.** Consulte um diagrama técnico ou foto (registre em `sources`) e simplifique a partir dele, não da memória.
- **Corte quando o interior importa.** Mostre o objeto em corte, com a parede como contorno e o conteúdo (gás, líquido, mistura) em cor de preenchimento.
- **Movimento fiel ao mecanismo.** Se A gira e B sobe e desce, anime as duas a partir do mesmo parâmetro (ângulo, tempo), com a cinemática certa ou uma aproximação declarada.
- **Rótulos e números ao lado da peça que medem**, nunca do outro lado da cena.
- **Estado por cor e forma:** aberto/fechado, cheio/vazio, quente/frio; mantenha a convenção em todas as telas.
- **Representação fiel:** o desenho de uma coisa não pode parecer outra. Uma proteína do vírus não é desenhada como um vírus inteiro; um pacote de rede não é desenhado como o arquivo; uma célula não é um círculo genérico igual ao do núcleo. Pergunte: “o aluno que só olhar o desenho vai concluir algo falso?”. Se sim, redesenhe ou rotule a diferença no próprio desenho.

## 7. Diagramas

- Nós são entidades; não transforme frases em caixas.
- Arestas têm significado definido (dado, controle, tempo). Destaque só a aresta em uso.
- Defina símbolos novos na primeira aparição, no próprio desenho.
- Uma linha do tempo ou seta não implica causa; rotule.

## 8. Mocks e imagens

- Um mock deve parecer a coisa real em proporção, tipografia (mono para terminal) e hierarquia, sem copiar marca registrada.
- Imagens reais só quando são evidência ou ajudam a reconhecer o objeto; nunca decoração.
- Screenshots: recorte, amplie a região que importa e mantenha indicação de origem no painel Fontes.

## 9. Estados intermediários

O layout precisa funcionar em todos os frames, não só no fim:

- Um texto novo entra quando a região já está livre.
- Nada atravessa um rótulo que o aluno está lendo.
- Um objeto não sai do quadro durante um arco ou um movimento de câmera.
- A altura dos blocos não muda quando a frase do passo muda.

## 10. Acessibilidade

Controles com nome e foco visível; navegação por teclado; a frase do passo é anunciada só quando o passo para; movimento reduzido salta para o estado final de cada passo sem esconder informação.

## 11. Instrumentação para revisão

```html
<text data-qa-text="valor-A">…</text>           <!-- texto essencial -->
<g data-qa-focal="token">…</g>                   <!-- deve ficar no quadro da câmera -->
<svg data-qa-camera="segue a busca">…</svg>      <!-- corte intencional (o kit marca) -->
<div data-qa-scroll="motivo">…</div>             <!-- região que rola de propósito -->
<text data-qa-allow-overlap="chaves em trânsito">…</text>
```

Use exceções com motivo local. Nunca marque a cena inteira para silenciar a verificação.
