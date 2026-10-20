# Experiência do aluno: o que a pessoa vê, lê e faz

Esta referência manda nas demais. Uma aula correta, determinística e auditada ainda falha se a pessoa não souber para onde olhar, o que ler ou onde clicar. A primeira versão desta skill produzia exatamente isso: telas com parágrafos, rodapés de fonte, cinco botões de player e termos usados antes de serem definidos. O conteúdo estava certo e a aula era ruim.

## 1. Como uma pessoa aprende numa tela

Os princípios abaixo vêm da pesquisa em aprendizagem multimídia (Mayer) e em carga cognitiva. Cada um vira uma regra verificável.

| Princípio | O que significa | Regra nesta skill |
|---|---|---|
| Atenção limitada | A memória de trabalho segura poucas coisas novas por vez | Uma ideia por tela; uma frase-guia por passo; aprofundamento num bloco só |
| Coerência | Tudo que não ajuda atrapalha | Sem rodapés, citações, legendas decorativas, texto repetido ou estilos de texto a mais |
| Sinalização | O olho precisa saber onde ir | Um destaque por vez (cor de atenção); o resto em tom neutro |
| Segmentação | O aluno controla o ritmo | Cada clique em Continuar mostra um passo e para |
| Pré-treino | Termos novos antes do mecanismo | Defina “página”, “folha”, “token” numa tela própria, com desenho |
| Contiguidade | Texto perto do que ele explica | Rótulos dentro do desenho; frase da etapa logo abaixo da cena |
| Redundância | Ler o mesmo texto duas vezes cansa | A frase da barra não repete o título nem um parágrafo da cena |
| Exemplo resolvido → prática | Primeiro ver resolver, depois resolver | Mecanismo guiado antes de qualquer pergunta |
| Recuperação | Lembrar fortalece | Perguntas com escolha e feedback que explica a causa |
| Concreto → abstrato | Situação real antes do modelo | Mostre a ferramenta/caso real (mock) antes do diagrama |

## 2. Contrato de navegação

O aluno nunca deve perguntar “e agora?”.

- **Uma ação principal:** o botão **Continuar →**, sempre no mesmo lugar, com rótulo que diz o que vai acontecer (“Conferir →” numa pergunta, “Escolha uma resposta” quando bloqueado).
- **Continuar** mostra o próximo passo da tela e para. No último passo, abre a próxima tela, que já começa tocando sua entrada.
- **Voltar** e **↺ rever** são secundários e discretos. Não há “Reproduzir cena”, “Pausar” ou “Reiniciar cena” na interface.
- Teclado: → e espaço continuam; ← volta. Enquanto um controle tem foco, as teclas pertencem ao controle.
- Progresso visível: uma barra de segmentos no topo (uma por tela) e pontos para os passos da tela atual.
- Numa tela de prática, Continuar fica bloqueado até haver resposta.

O player incluído implementa esse contrato. Não o substitua por uma barra de mídia.

## 3. Texto calmo: mais conteúdo, nunca poluição

O aluno pode e muitas vezes quer ler mais. O problema nunca é a quantidade de texto: é texto **visualmente poluído**, com tamanhos, cores, pesos e lugares diferentes espalhados pela tela. Uma tela com um parágrafo de cinco linhas bem composto é melhor que uma tela com dez rótulos soltos em seis estilos.

### Uma voz tipográfica

Toda a aula usa **uma família** (mais o mono, só para código e terminal) e uma **escala fixa** de no máximo quatro degraus por tela:

| Degrau | Papel | Onde | Classe |
|---|---|---|---|
| Destaque | A ideia da tela, um número que importa | Frase grande da explicação, número-herói | `sc-say`, `sc-big` |
| Corpo | Explicação, aprofundamento, pergunta, feedback | Bloco de texto único da tela | `sc-read`, `sc-sub`, `sc-feedback` |
| Rótulo | Nomes de peças do desenho | Encostado no objeto | rótulos do SVG (um tamanho só) |
| Nota | Selos e unidades | Junto do valor | `sc-note`, `sc-label` |

Cores de texto: tinta (`--ink`), secundária (`--muted`), a cor do assunto só para **termos** (`sc-term`) e a cor de atenção só para o **que está acontecendo agora**. Nada além disso em texto. Peso: regular para corpo, semibold para destaque e rótulos; não misture três pesos.

### Um lugar para o texto

- Cada tela tem **uma região de texto**: a coluna de texto do `split`, o centro do `hero`/pergunta, ou nenhuma (diagrama puro com rótulos). Não espalhe frases pelos cantos do desenho.
- Rótulos de 1–4 palavras ficam colados no objeto que nomeiam, todos no mesmo tamanho.
- A frase do passo fica sempre na barra; ela guia (“o que olhar agora”) e não repete o texto da cena.

### Quanto texto

| Lugar | Faixa | Observação |
|---|---|---|
| Título | até 12 palavras | Afirma a ideia ou faz a pergunta da tela |
| Kicker | até 4 palavras | Capítulo ou tipo: “Na prática”, “Sua vez” |
| Frase do passo (barra) | 1–2 frases, até 30 palavras | Diz o que olhar ou o que acabou de acontecer |
| Aprofundamento (`read`) | até ~5 linhas (~90 palavras) | Quando o assunto pede mais explicação; mesmo estilo e lugar em toda a aula |
| Texto total pintado na cena | até ~120 palavras (prática 140, resumo 80) | Acima disso a tela vira página de livro: divida |
| Mocks | livres | São evidência com aparência própria; marque mocks próprios com `data-qa-mock` |

A captura acusa `TYPE_SIZES` (mais de 4 degraus de tamanho na cena), `TEXT_COLORS` (mais de 4 cores de texto), `FONT_FAMILIES` (mais de uma família fora do mono), `TEXT_WALL`, `TITLE_TOO_LONG` e `CAPTION_TOO_LONG`. Profundidade pode vir de telas com aprofundamento **e** de mais telas e passos; nunca de telas desarrumadas.

Proibido na tela: citação de fonte, nota de versão em rodapé, “Fonte: …”, número de seção de documentação, legenda que repete a frase da barra. Fontes ficam no painel **Fontes** (`sources` por tela). Rótulos obrigatórios de honestidade (“simulação”, “valores ilustrativos”) entram como um selo curto dentro do mock ou desenho.

## 4. Tipos de tela e ritmo

Toda tela declara `kind`. Cada conceito importante passa por pelo menos dois tipos: um que o explica e outro que o mostra (desenho, mock ou prática).

| `kind` | Para quê | Como fica |
|---|---|---|
| `abertura` | A pergunta da aula e o que está em jogo | Título-pergunta + um desenho mínimo animado |
| `mock` | O assunto como ele aparece de verdade | Terminal, app, documento ou tela reconstruída (`LessonKit.terminal` / `app`), rotulada como simulação |
| `explicar` | Um termo ou uma ideia | Frase grande à esquerda + desenho à direita (`LessonKit.split`), ou número/afirmação central (`hero`) |
| `diagrama` | O mecanismo passo a passo | Desenho em tela cheia (`LessonKit.diagram`), câmera quando ajuda a ler |
| `pratica` | Prever ou decidir | Pergunta + cartões de resposta + feedback causal (`LessonKit.quiz`) |
| `resumo` | O que levar | 2–4 cartões curtos (`LessonKit.cards`) |

Ritmo de referência para um conceito:

```text
mock (o problema real) → explicar (termo) → diagrama (mecanismo) → mock (o mesmo caso resolvido) → pratica
```

Não repita o mesmo tipo mais de três telas seguidas. Um diagrama interativo conta como prática leve, não substitui a pergunta.

## 5. Termos

- Antes de usar um termo técnico na frase da etapa, ele precisa ter aparecido numa tela `explicar` ou ser definido no próprio passo, com o desenho apontando para ele.
- Exceção: no gancho e na revelação, um nome que o aluno já ouviu no dia a dia (“vacina de mRNA”, “DNS”, “motor 1.0”) pode aparecer **como nome**; o significado vem na tela de vocabulário, logo depois.
- Use `<span class="sc-term">` na primeira vez que o termo aparece.
- Analogias são pontes: diga onde elas param de valer.

## 6. Mocks

Um mock mostra o que a pessoa realmente encontraria: o comando no terminal e sua saída, o app com o botão, o documento com o trecho. Ele é a ponte entre a aula e o mundo.

- Use nomes, comandos e formatos de saída verificados na documentação (registre em `sources`). Valores podem ser ilustrativos; o formato não.
- Rotule: o kit coloca o selo “simulação” no canto.
- Digitação e saída aparecem em ritmo legível (≈ 30 caracteres/s; saída linha a linha) e o trecho que importa recebe destaque (`hl`).
- Um mock por conceito, no início (o problema) e, quando possível, de novo no fim (o problema resolvido).

## 7. Composição

- **Um foco por momento.** Só o elemento que a frase menciona recebe a cor de atenção.
- **Grupo compacto.** O conteúdo de uma cena forma um bloco; nada de número gigante num canto e legenda no outro. Se sobra muito vazio, aumente o desenho ou reduza a área.
- **O desenho ocupa a cena.** Dimensione o viewBox pelo conteúdo, sem margens vazias. Isso também mantém o texto legível no celular.
- **Tipografia grande:** frase de explicação 24–34 px, rótulos de desenho ≥ 18 px no desktop e ≥ 11 px renderizados no celular, números de destaque 44 px ou mais.
- **Câmera** quando o desenho é grande demais para ler inteiro: enquadre o nível ou objeto ativo (`M.camera`), mantendo o foco (`data-qa-focal`) dentro do quadro.

## 8. Movimento natural

- Entradas: fade + subida de 10–14 px em 0,45–0,6 s (`M.enter`), em sequência curta (`M.stagger`, 60–180 ms).
- Deslocamentos: ease-in-out de 0,8–1,4 s; trajetórias curvas só quando o caminho importa.
- Chegada: um pulso ou spring leve (`M.pulse`, `M.spring`) no objeto que chegou.
- Depois de uma revelação, segure: o passo termina e espera o aluno.
- Texto nunca se move enquanto deve ser lido; ele entra e fica.
- Nada de transição CSS em elementos da cena: o tempo vem do player.

## 9. Checklist da experiência (rode no storyboard)

Para cada tela do storyboard (`scripts/storyboard.mjs`):

1. Em 3 segundos dá para dizer qual é a ideia da tela?
2. Há um único lugar óbvio para olhar?
3. O texto está num lugar só, numa escala de no máximo quatro tamanhos e poucas cores? Algum texto é decorativo ou repetido? Remova.
4. Algum termo aparece antes de ser definido?
5. O desenho ocupa a cena, sem buracos?
6. A frase da barra diz o que olhar ou o que mudou, sem repetir o título?
7. O que fazer agora está claro (Continuar, escolher, arrastar)?
8. A tela é bonita o bastante para alguém querer continuar?

Uma resposta “não” é um defeito, com a mesma prioridade de um erro de conteúdo.
