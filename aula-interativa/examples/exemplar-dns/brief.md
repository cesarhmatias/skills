# Brief — Aula: como funciona o DNS (pt-BR, profundidade 1)

## Resultado central (observável)
Dado um nome como `padaria.com.br`, o aluno explica em ordem quem pergunta a quem
(navegador → resolvedor → raiz → servidores do .br → servidor autoritativo do site → de volta)
e prevê a consequência de duas variações: resposta já guardada (cache/TTL) e nome inexistente (NXDOMAIN).

| Campo | Valor |
|---|---|
| Situação | Digitar um endereço no navegador e o site abrir (ou não) |
| Evidência | 3 práticas: o que a raiz responde; quantas perguntas com cache válido; onde a busca parou num erro |
| Condições | Nada a consultar; tudo foi mostrado antes |
| Limite (fora) | DNSSEC, IPv6/AAAA, CNAME, DoH/DoT, cache do sistema/navegador em detalhe, anycast, conexão HTTP/TLS depois do IP |
| Pré-requisito | Saber usar um navegador. Nada técnico. |

## Mapa de dependências
endereço IP → DNS (nome → número) → nomes em árvore (raiz, .br, com.br) → papéis (resolvedor, autoritativo)
→ busca passo a passo (indicações) → cache e TTL → falha (NXDOMAIN)

## Caso central (sintético, coerente)
- Nome: `padaria.com.br` (fictício). IP: `203.0.113.42` (bloco de documentação RFC 5737, TEST-NET-3).
- Servidor autoritativo fictício: `ns1.padaria.com.br`. TTL da resposta: 3600 s.
- Cadeia real conferida com `dig +trace` (BIND 9.10.6, macOS, 2026-10-20) em registro.br e www.uol.com.br:
  raiz (a–m.root-servers.net) → servidores do .br (a–f.dns.br, que também respondem por com.br) → NS do site → A.
- Nome errado `padaira.com.br`: dig real em nome inexistente .com.br retornou `status: NXDOMAIN` com SOA de com.br em a.dns.br.
- Chromium: código de página de erro `DNS_PROBE_FINISHED_NXDOMAIN` existe em components/error_page/common/localized_error.cc.

## Simplificações declaradas
- O resolvedor começa "do zero" na primeira busca (na prática ele já guarda a raiz e o .br em cache).
- Uma pergunta por nível; servidores redundantes omitidos.
- Navegador e sistema também têm cache próprio: citado como "seu computador também guarda", sem detalhar.
