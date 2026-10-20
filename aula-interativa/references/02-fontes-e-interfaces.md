# Fontes, versões e demonstrações de interface

## Evidência antes do roteiro

Use documentação oficial, artigos originais, dados publicados pelo responsável e fontes primárias adequadas ao assunto. Um tutorial de terceiros pode sugerir uma pergunta; não deve substituir a verificação de um comportamento específico de software.

Para assuntos interpretativos, reúna fontes capazes de sustentar as leituras apresentadas e distinga consenso, disputa e hipótese. Uma animação não transforma uma interpretação em fato.

Ao receber material do usuário, registre seu papel: fonte de conteúdo, currículo a seguir ou referência visual. Um screenshot bonito não autoriza atribuir a ele fatos que não aparecem nele.

## Registro de fontes

Mantenha `sources.json` no diretório de trabalho. Registre somente evidência usada:

```json
{
  "sources": [{
    "id": "manual-intervalos",
    "title": "Manual oficial: intervalos",
    "url": "URL efetivamente consultada",
    "accessed": "data local da consulta",
    "version": "versão identificada no documento",
    "supports": ["qual período é processado", "quando fica elegível"],
    "limitations": ["exemplo não cobre disparos manuais"]
  }],
  "assets": [{
    "id": "tela-historico",
    "sourceId": "manual-interface",
    "path": "assets/historico.png",
    "kind": "official-screenshot",
    "licenseOrPermission": "licença ou fundamento verificado",
    "edits": "recorte; nenhuma mudança no conteúdo"
  }]
}
```

Os textos explicativos acima são campos de autoria, não valores que possam permanecer em um registro final. Preencha com as evidências reais. Não invente uma versão ou licença.

Associe fontes às telas e às afirmações que dependem delas, pelo campo `sources` de cada tela; o player as mostra no painel **Fontes**, junto com a biblioteca completa. Nunca escreva a citação na cena: nada de “Fonte: …”, número de seção ou data de consulta na tela. Evite despejar dezenas de links sem relação com o conteúdo.

## Fixar a versão demonstrada

1. Identifique a versão no documento ou no ambiente real.
2. Registre a data de consulta.
3. Quando houver documentação versionada, prefira a URL daquela versão.
4. Se só usar `stable`, informe que o endereço pode mudar no futuro.
5. Confira imports, nomes de controles e parâmetros contra a mesma referência.
6. Trate versões de plugins e providers separadamente do produto principal.

Capturas de um manual podem mostrar uma build antiga, mesmo quando a página tem um número novo. Diga “captura publicada na documentação X”, salvo se a própria imagem ou o ambiente comprovar a build.

Não misture um código de uma versão, uma tela de outra e um procedimento de uma terceira sem explicar a diferença que interessa ao aluno.

## Escolher o tipo de demonstração

| Tipo | Quando usar | Identificação obrigatória |
|---|---|---|
| Captura real própria | A posição exata do controle importa e há acesso autorizado | Ambiente e versão observados |
| Captura oficial | O manual documenta a tela e o percurso | Fonte, versão do documento, possível diferença de build |
| Mock (reconstrução) | Mostrar a ferramenta ou situação como o aluno a encontra | Selo “simulação” no mock; formatos e nomes verificados |
| Modelo conceitual | É preciso explicar o mecanismo por trás da tela | “Modelo conceitual”; escopo |
| Código executado | O ambiente pertinente foi realmente usado | O que foi executado e com quais dependências |
| Código de referência | Não houve execução no produto | “Não executado neste ambiente”; como verificar |

Uma reconstrução pode seguir fielmente os nomes verificados dos controles sem copiar o visual inteiro. Não invente uma interface com aparência oficial e apresente-a como uma captura.

## Roteiro de operação

Para cada tarefa operacional, documente:

```text
Intenção do aluno
→ estado inicial necessário
→ caminho verificado até o controle
→ ação exata
→ resultado observável
→ como conferir o resultado
→ como diagnosticar uma divergência comum
```

Exemplo de especificação, sem assumir um produto:

- Intenção: inspecionar uma execução com erro.
- Pré-condição: a lista de execuções contém o exemplo.
- Caminho: lista → execução → instância → logs, se confirmado na fonte.
- Ação: selecionar a execução e a tentativa corretas.
- Evidência: o identificador e a mensagem correspondem ao caso.
- Divergência: se a tela não mostrar a aba, conferir versão e permissões.

Dizer apenas “clique no botão de executar” não é uma demonstração completa.

## Cursor e anotações

O cursor é um instrumento de atenção. Deve ir até o controle, parar, indicar a ação e aguardar o resultado. Não deixe o cursor atravessar conteúdo sem propósito.

Para anotações em screenshots:

- Preserve uma cópia original.
- Registre o recorte em coordenadas normalizadas.
- Não cubra o texto ou resultado que está explicando.
- Use callouts fora do controle, com uma linha guia curta.
- Amplie a região quando o controle ficar pequeno demais para ler.
- Derive a posição do callout do retângulo efetivamente medido da imagem.

A receita de cursor e zoom está em [receitas de motion](06-receitas-motion.md).

## Diferenças entre versões

Mostre uma comparação quando ela muda o que o aluno faz: controle renomeado, import alterado, comportamento padrão novo ou recurso removido. A comparação deve explicar a consequência e o caminho equivalente verificado.

Não transforme toda aula em uma cronologia de releases. Se uma diferença não afeta o objetivo, registre-a como nota opcional.

## Exemplos reproduzíveis

Separe:

- Sintaxe analisada.
- Lógica pura executada.
- Integração simulada.
- Execução real na ferramenta.
- Verificação em produção.

Essas evidências não são intercambiáveis. Um teste que remove decoradores para executar funções Python não prova que o scheduler consegue descobrir ou executar o workflow.

Quando entregar código:

1. Informe dependências e versão de referência.
2. Mostre onde salvar e como iniciar o laboratório.
3. Defina entradas e saídas esperadas.
4. Inclua um caso normal e um caso de erro pertinente.
5. Diga o que o teste real comprovou.
6. Evite exigir serviços pagos para observar um conceito que pode usar dados locais.

O laboratório não deve instalar ou modificar contas do aluno por conta própria. Construir o material e executar uma demonstração local isolada são atividades distintas de operar sistemas externos.
