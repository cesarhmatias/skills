# Image

One image, `agentbox:latest`, shared by every box. It holds the tools; every box gets its own container, its own `/work` folder and its own browser profile.

What is inside:

| Piece | Why |
|---|---|
| Playwright Python base image | Chromium plus its system libraries, for amd64 and arm64 |
| `requests`, `curl_cffi`, `openpyxl` | plain HTTP, TLS/browser impersonation, spreadsheet outputs |
| `curl`, `jq` | quick probes from the terminal |
| `/opt/agentbox/*` | the box tools; `browser`, `reqlog`, `proxy` and the `curl` wrapper are linked into `/usr/local/bin` so they win over the system curl |
| `agentbox_hook.pth` | loads the python hook into every `python3` process (a `.pth` file is used because Ubuntu ships its own `sitecustomize.py`) |

No proxy variables are set in the image. Proxying is decided per request by the box tools, from the active service in `/work/.proxy_on`.

File: `image/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright/python:v1.49.1-noble

RUN apt-get update && apt-get install -y --no-install-recommends curl jq ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir playwright==1.49.1 requests curl_cffi openpyxl

COPY tools/ /opt/agentbox/
RUN chmod +x /opt/agentbox/* \
 && for t in browser reqlog proxy curl; do ln -sf /opt/agentbox/$t /usr/local/bin/$t; done \
 && SITE=$(python3 -c 'import site; print(site.getsitepackages()[0])') \
 && cp /opt/agentbox/agentbox_hook.py "$SITE/agentbox_hook.py" \
 && echo 'import agentbox_hook' > "$SITE/agentbox_hook.pth"

# Listeners only observe: no proxy env, no TLS interception for logging.
ENV NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
WORKDIR /work
ENTRYPOINT ["/opt/agentbox/boot.sh"]
```

## Build

```bash
"$AGENTBOX_HOME"/bin/agentbox build
```

The first build downloads about 2 GB (the Playwright base image). Later builds take seconds. Rebuild after changing any file under `image/`; running boxes keep the old image until they are recreated with `agentbox up`.

## Check a fresh box

```bash
A="$AGENTBOX_HOME/bin/agentbox"
$A up smoke
$A exec smoke -- curl -s -o /dev/null -w '%{http_code}\n' https://example.com      # 200
$A exec smoke -- browser open https://example.com                                 # {"title": "Example Domain", ...}
$A exec smoke -- python3 -c "import requests; print(requests.get('https://example.com').status_code)"
$A exec smoke -- reqlog                                                           # three sources: curl, browser, python:requests
$A down smoke
```

If `reqlog` shows all three sources, the listeners work.
