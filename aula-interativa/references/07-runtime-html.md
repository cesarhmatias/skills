# Implementação do HTML e contrato do runtime

## Arquitetura mínima

Separe três responsabilidades:

1. **Modelo:** calcula estado e consequências a partir das entradas.
2. **Cena:** representa esse estado em um instante local.
3. **Player:** controla navegação, tempo, pausa e interação.

O player incluído é uma base funcional. Adapte a aparência e componha as cenas para o tema. Não use seu layout de demonstração como identidade obrigatória de toda aula.

## Arquivos incluídos

| Arquivo | Responsabilidade |
|---|---|
| `templates/motion.js` | Interpolação, segmentos, easing, curva cúbica, contain e formatação |
| `templates/player.js` | API de tempo e entradas, teclado, etapas variáveis e prontidão |
| `templates/player.css` | Base funcional, foco e layout que pode ser substituído |
| `examples/mecanismo.html` | Duas cenas executáveis; conservação e previsão com feedback |
| `scripts/pack.mjs` | Incorpora scripts clássicos, CSS e recursos locais suportados |

O exemplo tem propósito de referência de implementação. Não é uma aula completa nem o padrão de conteúdo a ser copiado literalmente.

## Configurar uma cena

```js
window.lesson = LessonPlayer.create({
  root: '#lesson',
  title: 'Título da aula',
  resources: ['assets/imagem-necessaria.png'],
  slides: [{
    id: 'mecanismo',
    title: 'Pergunta de aprendizagem',
    chapter: 'Capítulo',
    description: 'Contexto suficiente para acompanhar.',
    initialInputs: { amount: 8 },
    controls: [{ key: 'amount', type: 'range', label: 'Quantidade',
                 min: 0, max: 20, step: 1 }],
    auditCases: [{ id: 'maximo', inputs: { amount: 20 } }],
    steps: [
      { id: 'inicial', label: 'Estado inicial', duration: 0 },
      { id: 'transferir', label: 'Ação observada', duration: 1.8 }
    ],
    render({ state, time, progress, motion }) {
      // Calcule o modelo e devolva a representação completa.
      return { html: '<div>...</div>', caption: 'Texto derivado do estado.' };
    }
  }]
});
```

Preencha o conteúdo; não entregue os marcadores desse exemplo. Use IDs estáveis para registrar capturas e localizar falhas. Durações estão em segundos e correspondem à transição para a etapa.

## API exigida pelas ferramentas

```text
lesson.ready                     boolean
lesson.error                     mensagem, se preparação falhou
lesson.getManifest()             título, slides, etapas, inputs e auditCases
lesson.seek({slide,step,time,inputs})
lesson.getState()                cópia serializável do estado
lesson.updateInputs(patch)
lesson.nextStep({animate:true})
lesson.previousStep()
lesson.reset()
lesson.play()
lesson.pause()
lesson.playing                  boolean
```

Índices de slide e etapa começam em zero. `seek` define o estado inteiro: entradas ausentes usam defaults da cena, nunca o último cenário capturado. Um tempo acima da duração é limitado ao endpoint; valores negativos ou não finitos são erros.

Os scripts pressupõem um elemento `[data-player="scene"]`. Se escrever seu próprio player, preserve essa marcação ou adapte explicitamente as ferramentas e os testes.

## Render puro

A cena não consulta rede, relógio ou estado de uma etapa anterior. Use a etapa e o tempo para construir o resultado completo.

Se o objeto foi ocultado no endpoint, o seek ao início precisa restaurá-lo. Se um controle mudou a hipótese, todos os rótulos e o feedback devem acompanhar a hipótese nova.

O renderer incluído substitui o conteúdo da região de cena. Isso é simples e determinístico; para cenas complexas, pode ser mais eficiente atualizar nós estáveis. Nesse caso, restaure todas as propriedades em todo render.

Mantenha controles editáveis fora da região recriada a cada frame. Caso contrário, digitar ou arrastar pode perder foco e posição do cursor.

## Tempo e navegação

`nextStep` reproduz somente a transição para a etapa seguinte e para nela. `play` pode percorrer o restante da cena, mas para no último estado do slide. Nenhuma dessas operações deve trocar de slide automaticamente.

`reset` volta ao primeiro estado e preserva as entradas atuais para repetir o experimento. Navegação de estudo pode preservar rascunhos por slide. `seek`, usado pela revisão, continua independente desses rascunhos.

Ao adaptar o player, preserve essa distinção. Foi um defeito real ter “Etapa →” disparando todas as etapas restantes.

## Texto e acessibilidade

O texto visível deve corresponder ao modelo em todo frame. Evite atualizar uma live region numérica 30 vezes por segundo: mantenha anúncios silenciosos durante reprodução e anuncie o resultado estável na pausa.

A interface do template está em português. Ao gerar outro idioma, traduza rótulos, nomes acessíveis, mensagens de erro e feedback no player adaptado, além do conteúdo das cenas. Não deixe um curso em inglês com botões de navegação em português.

No modo de movimento reduzido, avance diretamente ao endpoint da etapa escolhida. Essa preferência não deve fazer o código pular uma etapa adicional.

## Prontidão e dependências

Aguarde fontes e recursos declarados. Recursos que surgem só em uma etapa posterior também precisam estar no conjunto de preparação.

Não transforme `onerror` de uma imagem essencial em sucesso. Uma aula com imagem faltando deve informar o problema e falhar na verificação, em vez de capturar um espaço vazio como se estivesse pronto.

O template usa scripts clássicos para abrir em `file://`. Se usar módulos ou bibliotecas de terceiros, empacote-os com uma ferramenta apropriada antes de entregar. O packer incluído não é um bundler JavaScript geral.

## Dependências para produção

Use ferramentas já disponíveis no ambiente. Para os scripts desta skill, são necessários Node.js, Playwright, um Chromium utilizável e Sharp.

Se as bibliotecas estiverem fora do projeto:

```bash
export LESSON_NODE_MODULES="/caminho/real/para/node_modules"
node scripts/check_env.mjs --channel chrome
```

Esse caminho é um parâmetro local e não deve ficar gravado no HTML ou na skill distribuída. Se não houver tooling, prepare um diretório de trabalho:

```bash
npm install --prefix work/tooling playwright sharp
export LESSON_NODE_MODULES="$PWD/work/tooling/node_modules"
```

Instale o browser pelo CLI do Playwright desse ambiente quando necessário. Se já existir Chrome compatível, use `--channel chrome`. Não instale um browser inteiro por reflexo quando um disponível resolver.

## Empacotamento

```bash
node scripts/pack.mjs source/lesson.html --out outputs/lesson.html
```

O packer recusa recursos remotos: adquira-os e verifique direitos de uso antes de incorporá-los. Ele suporta scripts clássicos locais, folhas CSS, imagens e fontes locais nos formatos listados no script. Resolve `url(...)` relativo à folha CSS original.

CSS `@import`, módulos não empacotados e `srcset` precisam ser resolvidos antes. Requisições dinâmicas feitas pelo JavaScript não são convertidas magicamente. A abertura offline pelos scripts de revisão continua obrigatória.

O HTML final pode conter links externos de referência sem depender deles para exibir a aula.
