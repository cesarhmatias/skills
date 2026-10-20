# Implementação do HTML e contrato do runtime

## Arquitetura mínima

1. **Modelo:** calcula estado e consequências a partir das entradas.
2. **Cena:** representa esse estado em um instante local, com os blocos do kit.
3. **Player:** navegação guiada, tempo, entradas, fontes.

Você escreve o modelo e as cenas. O player e o kit vêm prontos: adapte tokens de cor no `:root` da aula; não reescreva a navegação.

## Arquivos incluídos

| Arquivo | Responsabilidade |
|---|---|
| `templates/player.js` | Navegação guiada (Continuar/Voltar/↺), progresso, controles, painel de fontes, API de captura |
| `templates/player.css` | Layout de tela cheia, tipografia, blocos `sc-*`, mocks `mock`/`mock-app`, celular |
| `templates/motion.js` | `segment`, easings, `enter`, `stagger`, `spring`, `pulse`, `camera`, `typed`, `cubic`, `contain`, `seeded`, `number`, `escape` |
| `templates/kit.js` | `diagram`, `split`, `hero`, `terminal`, `app`, `quiz`, `cards`, `op`, `rise` |
| `examples/mecanismo.html` | Aula de referência com os seis tipos de tela |
| `scripts/pack.mjs` | Incorpora scripts, CSS, imagens e fontes locais num HTML único |

Ordem dos scripts: `motion.js`, `kit.js`, `player.js`, depois o script da aula.

## Configurar a aula

```js
window.lesson = LessonPlayer.create({
  root: '#lesson',
  title: 'Nome curto da aula',
  lang: 'pt-BR',                        // 'pt-BR' | 'en' | 'es': rótulos do player
  sources: [{ id: 'doc', title: 'Título da fonte', url: 'https://…', note: 'O que ela sustenta' }],
  slides: [{
    id: 'mecanismo', kind: 'diagrama',  // abertura | mock | explicar | diagrama | pratica | resumo
    kicker: 'O mecanismo', title: 'Afirmação curta da tela',
    sources: ['doc'],                   // aparecem no painel Fontes, nunca na cena
    initialInputs: { amount: 8 },
    controls: [{ key: 'amount', type: 'range', label: 'Valor', min: 0, max: 20, step: 1, format: v => `R$ ${v}` }],
    auditCases: [{ id: 'maximo', inputs: { amount: 20 } }],
    steps: [
      { id: 'inicial', label: '', duration: 0 },
      { id: 'transferir', label: '', duration: 1.8 }
    ],
    render({ state, time, motion }) {
      // Calcule o modelo e devolva a cena completa + a frase deste passo.
      return { html: LessonKit.diagram('<g>…</g>', { w: 620, h: 480 }), caption: 'Uma frase derivada do estado.' };
    }
  }]
});
```

- `steps[k].duration` é a transição para o passo k; o fim é o ponto de parada. O primeiro passo de uma tela toca ao entrar; use `duration > 0` para dar a ela uma entrada.
- `steps[k].cta` muda o rótulo do botão que leva a esse passo (“Conferir”).
- `ready(state) === false` bloqueia Continuar; `waitLabel` diz o que falta. O `quiz` do kit já usa isso.
- Controles: `choice` (cartões, o padrão para escolhas), `range` (com valor visível; `format` ou `unit`), `select`, `number`, `textarea`.
- Não existe `description`: o texto de contexto vai para dentro da cena (`split`, `hero`) ou para outra tela.
- `auditDefault: false` tira o cenário default da captura quando os defaults não alcançam os passos (o `quiz` já faz isso); os `auditCases` cobrem a tela.

## Navegação

| Ação | Efeito |
|---|---|
| Continuar, → ou espaço | Se um passo toca: termina-o. Senão: toca o próximo passo e para. No último passo: abre a próxima tela no início, tocando sua entrada |
| Voltar ou ← | Volta um passo (estado final). No primeiro passo: estado final da tela anterior |
| ↺ | Toca de novo o passo atual |
| Barra de progresso | Abre a tela escolhida no início |
| Fontes | Abre o painel de fontes da tela e da aula; Esc fecha |

Teclas não agem enquanto um campo tem foco. Com movimento reduzido, cada passo salta para o estado final.

## API exigida pelas ferramentas

```text
lesson.ready / lesson.error / lesson.readyPromise
lesson.getManifest()              título, telas (kind), passos, inputs e auditCases
lesson.seek({slide,step,time,inputs})
lesson.getState()                 cópia serializável
lesson.updateInputs(patch)
lesson.proceed() / lesson.back() / lesson.replay()
lesson.nextStep({animate}) / lesson.previousStep() / lesson.reset() / lesson.play() / lesson.pause()
lesson.playing
```

Índices começam em zero. `seek` define o estado inteiro: entradas ausentes usam os defaults da tela. Tempo acima da duração vai ao fim; negativo ou não finito é erro. Os scripts pressupõem `[data-player="scene"]` e `[data-player="continue"]`.

## Render puro

A cena não consulta rede, relógio ou estado de um passo anterior: tudo sai de `state` e `time`. Passos anteriores aparecem completos; para isso, calcule o progresso de cada passo a partir de `state.step` (`state.step > k ? 1 : …`).

O player substitui o conteúdo da cena a cada frame e restaura a rolagem de regiões `data-qa-scroll`. Controles ficam fora da cena, na área de entradas, para não perder foco.

## Mocks

- `LessonKit.terminal(state, time, script, { title, prompt, badge })`: `script[k]` são as linhas do passo k; `{ type: true, text, at, cps }` digita, `{ text, at, cls, hl }` mostra uma linha (classes `p`, `k`, `s`, `ok`, `warn`; `hl` destaca a partir de um instante, só durante o próprio passo; `keep: true` mantém o destaque nos seguintes).
- `LessonKit.diagram(body, { w, h, narrow: { body, w, h } })`: versão recomposta para celular.
- `LessonKit.app({ title, body, badge, note })`: cartão de app; monte o corpo com `.app-row`, `.app-btn`, `.app-toast`.
- Para outras interfaces, construa HTML próprio dentro de `.sc-center` seguindo o mesmo idioma visual, com selo de simulação.

## Prontidão e dependências

Aguarde fontes e recursos (`resources`) antes de `lesson.ready`. Um recurso essencial que falha deve falhar a verificação. Use fontes locais com licença compatível (`@font-face` com `url(assets/…)`; o packer embute). Scripts clássicos abrem em `file://`; módulos e bibliotecas de terceiros precisam ser empacotados antes.

## Dependências para produção

Node.js, Playwright, um Chromium utilizável e Sharp. Reutilize instalações existentes:

```bash
export LESSON_NODE_MODULES="/caminho/real/para/node_modules"
node scripts/check_env.mjs --channel chrome
```

Sem tooling: `npm install --prefix work/tooling playwright sharp`. Esse caminho é local; não grave no HTML ou na skill.

## Empacotamento

```bash
node scripts/pack.mjs work/source/lesson.html --out work/out/lesson.html
```

O packer recusa recursos remotos, CSS `@import`, módulos e `srcset`. Links externos (fontes no painel) continuam sendo links: a aula não depende deles para funcionar.
