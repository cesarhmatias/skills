# Roteiro — Como funciona o DNS (13 telas, profundidade 1)

Tese visual: perguntas e indicações entre caixas (servidores). Teal = entidades (servidores, nomes);
âmbar = o que está acontecendo agora (mensagem em trânsito, item em foco); verde/vermelho só no feedback.
Caso único: padaria.com.br → 203.0.113.42 (IP de documentação), autoritativo ns1.padaria.com.br,
TTL do número 300 s (5 min), TTL da indicação do autoritativo 3600 s (1 h).

| tela | tipo | passo | frase da barra (≤ 22 palavras) | o que aparece / muda |
|---|---|---|---|---|
| 1 abertura | abertura | digitar | Você digita um nome e aperta Enter. Em menos de um segundo, a página aparece. | barra de endereço digita padaria.com.br; página do site surge à direita |
| 1 | abertura | pergunta | Mas, entre o Enter e a página, o computador precisa descobrir uma coisa. | "?" âmbar surge entre os dois e pulsa |
| 2 dig | mock | digitar | O comando dig faz a mesma pergunta que o navegador faz: quem é padaria.com.br? | terminal digita `dig padaria.com.br +noall +answer` |
| 2 | mock | resposta | A resposta não é uma página: é um número, 203.0.113.42. | linha `padaria.com.br. 300 IN A 203.0.113.42`, destaque |
| 3 ip | explicar | numero | Esse número é o endereço do servidor onde o site mora. | split: frase com termo "endereço IP"; servidor com etiqueta 203.0.113.42 |
| 3 | explicar | nome | Nomes são para pessoas; a rede só sabe entregar para números. | nome padaria.com.br aparece ligado ao número por "=" |
| 4 dns | explicar | lista | Pense numa agenda de contatos: nome de um lado, número do outro. | split: termo "DNS"; agenda com 3 linhas, padaria em foco |
| 4 | explicar | dividida | Onde a analogia para: não existe uma agenda única. Ela é dividida entre muitos servidores. | linhas se separam em 3 cartões distantes |
| 5 arvore | diagrama | ler | Leia o nome da direita para a esquerda: br, depois com, depois padaria. | padaria · com · br separados, setas da direita p/ esquerda |
| 5 | diagrama | arvore | No topo fica a raiz. Abaixo, o .br; depois com.br; depois o site. | árvore cresce: raiz → br → com.br → padaria.com.br (+ irmãos cinza) |
| 5 | diagrama | delegar | Cada nível não sabe tudo: só sabe quem cuida de cada nome logo abaixo. | caminho em âmbar; rótulos "sabe quem cuida" nas arestas |
| 6 papeis | explicar | resolvedor | Seu computador entrega a pergunta a ele e espera. Em geral, é do seu provedor. | termo "resolvedor"; caixa resolvedor em foco |
| 6 | explicar | autoritativo | O de padaria.com.br se chama ns1.padaria.com.br. É ali que o número está anotado. | termo "servidor autoritativo"; caixa autoritativo em foco |
| 7 busca | diagrama | inicio | Imagine um resolvedor recém-ligado, sem nada guardado. Ele começa pelo topo da árvore. | Você, Resolvedor, Raiz, .br, Autoritativo entram |
| 7 | diagrama | pergunta | O navegador pergunta ao resolvedor: qual é o número de padaria.com.br? | ponto âmbar Você → Resolvedor |
| 7 | diagrama | raiz | A raiz não sabe o número, mas indica: pergunte aos servidores do .br. | ponto vai à Raiz e volta; nota "indica o .br" |
| 7 | diagrama | br | O .br também não sabe, mas indica quem sabe: o autoritativo do site. | vai ao .br e volta; nota "indica o ns1" |
| 7 | diagrama | autoritativo | O autoritativo responde com o número oficial: 203.0.113.42. | vai ao Autoritativo e volta; nota "203.0.113.42" |
| 7 | diagrama | entrega | O resolvedor devolve o número ao navegador. Foram 3 perguntas; agora o site pode ser chamado. | ponto volta a Você com o número; contador "3 perguntas" |
| 8 trace | mock | digitar | Com +trace, o dig refaz a busca do topo e mostra cada resposta. Primeiro: os servidores raiz. | digita `dig +trace padaria.com.br`; linhas NS da raiz (a…m) |
| 8 | mock | raiz | A raiz indicou os servidores do .br. A última linha diz quem respondeu. | NS a.dns.br / b.dns.br + Received … (b.root-servers.net) destacado |
| 8 | mock | br | O .br indicou ns1.padaria.com.br, o autoritativo do site. | NS ns1.padaria.com.br + Received … (a.dns.br) |
| 8 | mock | resposta | E o autoritativo respondeu com o número. É a mesma cadeia do desenho. | A 203.0.113.42 destacado + Received … (ns1.padaria.com.br) |
| 9 prever | pratica | pergunta/resposta | (kit) | "O resolvedor pergunta à raiz pelo número de loja.com.br. O que ela responde?" — certa: indica .br |
| 10 cache | diagrama | guardado | O resolvedor guarda cada resposta pelo tempo do TTL, que o dono do nome escolhe. | termo "TTL"; cartão de memória: número (5 min) e autoritativo (1 h) |
| 10 | diagrama | vizinha | (derivada) <5 min: responde na hora, 0 perguntas; ≥5 min: número venceu, 1 pergunta ao autoritativo | controle "minutos depois" 0–15; ponto vai e volta conforme o modelo |
| 11 ttl | pratica | (kit) | — | vizinha 3 min depois, TTL 300 s → 0 perguntas |
| 12 erro | pratica | (kit + mock) | — | página de erro com DNS_PROBE_FINISHED_NXDOMAIN para padaira.com.br; certa: o .br disse que não existe |
| 13 resumo | resumo | cards | Na próxima vez que um site abrir, você sabe o que aconteceu antes. | 3 cartões |

## Conferências do roteiro
- Termos e onde são definidos: endereço IP (3), DNS (4), raiz (5, rótulo no desenho), resolvedor e autoritativo (6), TTL (10), NXDOMAIN (12, na dica). Nenhum aparece antes.
- "indica" é palavra comum; o desenho mostra a indicação como nota no servidor.
- Tipos: abertura, mock, explicar, explicar, diagrama, explicar, diagrama, mock, pratica, diagrama, pratica, pratica, resumo — nunca 3 iguais seguidos.
- Simplificações: resolvedor recém-ligado (7, dito na frase); 10 mostra que TTLs diferentes fazem o resolvedor pular a raiz e o .br (fiel ao real).
- Mocks: saída de dig com formato executado (BIND 9.10.6); nomes fictícios; selo "simulação".
