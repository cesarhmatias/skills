# Escalation ladder

Cheapest path first. Each rung is tried with both clients that matter (curl for raw HTTP, the browser for JavaScript and cookies), and each attempt lands in the log, so a "blocked" claim can be checked.

| Rung | Command | Cost | Typical reason to move up |
|---|---|---|---|
| 1. Direct | `curl ...`, then `browser open ...` | free | 403 / 429 / timeout from an IP or geo block, a WAF page, an empty JS shell (use the browser) |
| 2. Default proxy | `proxy on`, retry curl and browser | the default service's price | the same block with the proxy on |
| 3. Pricier proxy (if configured) | `proxy on <service>`, retry both | that service's price | still blocked |
| 4. Stop and report | `agentbox note ... "BLOCKED: ..."` | none | strong JS challenge, CAPTCHA, login, paywall |

## Reading the signals

| What the log shows | Likely cause | Next step |
|---|---|---|
| 403/401 for curl, 200 for the browser | header or TLS fingerprint check | use `curl_cffi` with browser impersonation, or keep the browser and replay its XHR calls |
| 403 for both, direct | IP reputation or geo block | rung 2 |
| 200 with an empty HTML shell | single-page app | browser, then `reqlog --xhr` |
| 429 | rate limit | slow down (sleep between requests) before spending proxy money |
| `error: net::ERR_TIMED_OUT` with the proxy on, other sites fine | the proxy service is slow or the site drops its IPs | retry once, then rung 3 |
| `blocked by agentbox (browser background / analytics host)` | the tunnel refused browser noise on purpose | ignore |
| 402 / curl exit 56 / "budget exhausted" | the box budget is spent | stop and report; the orchestrator decides on more budget |
| login form, CAPTCHA page, "verify you are human" | access control | stop; report what is behind it |

## What "blocked" must show

A BLOCKED journal entry cites request ids for: direct curl, direct browser, curl with the proxy on, browser with the proxy on (and the pricier service, if one exists). The orchestrator rejects a claim that skips a rung.

## A real failure this rule caught

A browser request kept failing "even with the proxy on". The log showed `via=<proxy>`, but the request had actually left over a connection opened before the switch, from the box's own IP. That is why the tunnel now closes old connections on every switch (`proxy/02-routing.md`) and why each switch is written to the journal: if a "proxy" failure appears right after a switch with no `proxy ... closed N tunnels` entry, distrust it.
