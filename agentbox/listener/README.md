# Listener

Every request a box makes is logged, failures included, with the full response body saved, and nothing sits in the traffic path to do it. There are three observers, one per way a subagent can reach the web, and they all write to the same file through one shared library.

| Client | Observer | How it sees the traffic | File |
|---|---|---|---|
| Chromium | `netlog.py` | subscribes to Chromium's own network events over the DevTools protocol (CDP) | `02-browser-listener.md` |
| `curl` | `curl` wrapper | runs the real `/usr/bin/curl` unchanged, saves its headers and output, writes one record | `03-curl-wrapper.md` |
| python (`requests`, `curl_cffi`) | `agentbox_hook.py` | wraps `Session.send` / `Session.request` at import time | `04-python-hook.md` |

Shared library (`boxlib.py`): `01-boxlib.md`. Reader for subagents (`reqlog`): `05-reqlog.md`.

## Why not an intercepting proxy?

A logging proxy that decrypts TLS (a man-in-the-middle) changes the TLS fingerprint the site sees, breaks certificate-pinned sites, and stops all traffic when it crashes. Observing from the side keeps the browser's real fingerprint and cannot break a request. The browser does go through a local tunnel (`proxy/02-routing.md`), but that tunnel only forwards bytes; it never decrypts or logs content.

## Record format (`/work/requests.jsonl`, one JSON object per line)

| Field | Meaning |
|---|---|
| `id` | unique id (nanosecond timestamp as a string). Subagents cite it as evidence |
| `ts` | unix time in seconds |
| `source` | `browser`, `curl`, `python:requests`, `python:curl_cffi` |
| `method`, `url`, `type` | request; `type` is the browser resource type (`document`, `xhr`, `fetch`, ...) |
| `req_headers`, `req_body` | sent headers (secrets redacted) and body (first 4000 chars) |
| `status`, `ctype` | response status and content type; `status` is `null` when no response arrived |
| `error` | why it failed: network error, timeout, curl exit code, budget exhausted |
| `via` | `direct` or the name of the proxy service that carried it |
| `body`, `body_file` | first 2000 chars of a text response, and the full body saved in `/work/bodies/<id>.txt` |

Images, fonts, stylesheets and media from the browser are skipped to keep the log readable.
