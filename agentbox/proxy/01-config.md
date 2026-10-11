# Proxy configuration

agentbox works with any HTTP(S) forward proxy that accepts `CONNECT` and Basic auth: datacenter pools, residential or mobile pools, ISP proxies, or a "proxy mode" unblocker. It does not know or care which provider you use. The user supplies:

1. **Credentials and endpoint** for each proxy service they want to allow.
2. **A budget per box** in USD.
3. **The cost of each service**: per request, per GB of traffic, or both.

With those, every box can route through the proxy only when needed, stop when its budget is spent, and every subagent knows what each request costs before it spends money.

## `config/proxy.json`

File: `config/proxy.json` (an example; replace every value with the user's own)

```json
{
  "budget_usd_per_box": 1.0,
  "default_service": "datacenter",
  "services": {
    "datacenter": {
      "url": "http://USERNAME:PASSWORD@proxy.example.com:8000",
      "usd_per_request": 0.0005,
      "usd_per_gb": 0,
      "notes": "rotating datacenter IPs, US exit"
    },
    "residential": {
      "url": "http://USERNAME-country-us:PASSWORD@residential.example.com:7777",
      "usd_per_request": 0,
      "usd_per_gb": 4.0,
      "notes": "residential IPs, billed by bandwidth; use only after datacenter fails"
    }
  }
}
```

| Field | Meaning |
|---|---|
| `budget_usd_per_box` | hard cap per box. When the estimated spend reaches it, every proxied request gets HTTP 402 (curl exits 56, python raises). Override for one box with `AGENTBOX_BUDGET_USD=0.25 agentbox up <box>` |
| `default_service` | what `proxy on` picks with no argument. Put the cheapest service here |
| `services.<name>.url` | `http://user:pass@host:port`. Geo-targeting, sessions and rotation are usually encoded in the username by the provider; copy the format from the provider's docs |
| `usd_per_request` | price of one request (successful or not, if the provider bills failures) |
| `usd_per_gb` | price per GB of traffic, for bandwidth-billed services |
| `notes` | one line the orchestrator copies into the subagent brief: exit country, IP type, when to use it |

Estimated cost of one request: `usd_per_request + bytes / 1e9 * usd_per_gb`, where bytes is the response size the listener saw. The estimate does not include TLS overhead, retries the provider makes for you, or images and fonts the browser loads; treat it as a lower bound and check the provider's dashboard after big runs.

## Getting the values from the user

If `config/proxy.json` is missing, ask the user, in one message, for:

- the proxy endpoint(s) and credentials (or "no proxy": boxes then run direct only),
- the budget per box,
- the price of each service (per request and/or per GB, from their plan),
- the exit country they need, if any.

Write the file, then `chmod 600 "$AGENTBOX_HOME/config/proxy.json"`. Never invent a price, never print the credentials back, never put them in a subagent prompt, a log or a commit. Inside the boxes the logs redact `Proxy-Authorization`, `Authorization` and cookies.

## Providers that re-sign TLS

Some unblocker products in "proxy mode" terminate TLS and re-sign it with their own certificate authority. If the user's service does that, save the provider's CA certificate as `config/ca.crt`. On boot each box adds it to the system trust store, so curl and python verify normally. The browser already accepts it (see `browser/browser.md`). For ordinary forward proxies, no CA is needed.

## The cost table for briefs

Before spawning subagents, build this table from the file (never include `url`) and paste it into every brief:

```
Proxy services in your box (budget for this box: $1.00):
  datacenter   $0.0005 / request              rotating datacenter IPs, US exit      (default: `proxy on`)
  residential  $4.00 / GB                     residential IPs, billed by bandwidth   (`proxy on residential`)
```

The `proxy list` command inside a box prints the same table.

## Budget is a guardrail, not a vault

The budget counters live in each box's `/work`, which the box can write. The cap stops honest mistakes (a crawl loop, a forgotten `proxy on`); it does not stop a process that deletes its own spend file. Set a spending limit at the provider as well.
