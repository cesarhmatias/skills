# Workspace

Everything agentbox needs on the host lives in one folder, `$AGENTBOX_HOME` (default `~/.agentbox`). The skill folder only holds instructions; the code inside them is written out ("materialized") into the workspace once.

```
$AGENTBOX_HOME/
  VERSION                 skill version that materialized this workspace
  bin/
    agentbox              host CLI (docker/04-cli.md)
    collect.py            transcript import (logs/logs.md)
    timeline.py           merged timeline (logs/logs.md)
  image/
    Dockerfile            (docker/03-image.md)
    tools/
      boot.sh             box startup (browser/browser.md)
      browser             browser CLI (browser/browser.md)
      boxlib.py           shared logging + budget library (listener/01-boxlib.md)
      netlog.py           browser listener (listener/02-browser-listener.md)
      curl                curl wrapper (listener/03-curl-wrapper.md)
      logcurl.py          curl wrapper's logger (listener/03-curl-wrapper.md)
      agentbox_hook.py    python hook (listener/04-python-hook.md)
      reqlog              log reader (listener/05-reqlog.md)
      tunnel.py           browser tunnel (proxy/02-routing.md)
      proxy               proxy on|off|status|list (proxy/02-routing.md)
  config/
    proxy.json            proxy services, budget, costs (proxy/01-config.md). chmod 600. Never commit.
    ca.crt                optional: CA of a proxy that re-signs TLS (proxy/01-config.md)
  runs/
    <box>/                one folder per box, mounted as /work inside it (logs/logs.md)
    _archive/             older runs of a reused box name
```

## Install or update

The current skill version is **1**.

1. `export AGENTBOX_HOME=${AGENTBOX_HOME:-$HOME/.agentbox}`.
2. If `$AGENTBOX_HOME/VERSION` holds `1`, skip to step 5.
3. Write every file in the tree above from the code block that carries its path (each code block in these docs starts with a `File:` line naming its path relative to `$AGENTBOX_HOME`). Copy the code exactly; do not "improve" it while copying.
4. Make the scripts executable and record the version:
   ```bash
   chmod +x "$AGENTBOX_HOME"/bin/agentbox "$AGENTBOX_HOME"/image/tools/{boot.sh,browser,curl,reqlog,proxy}
   mkdir -p "$AGENTBOX_HOME"/config "$AGENTBOX_HOME"/runs && chmod 700 "$AGENTBOX_HOME"/config
   echo 1 > "$AGENTBOX_HOME"/VERSION
   ```
5. Build the image if it is missing or the files changed: `"$AGENTBOX_HOME"/bin/agentbox build`.

Use the full path `$AGENTBOX_HOME/bin/agentbox` in every command you give subagents; they do not inherit your shell variables.
