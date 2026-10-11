# Docker preflight

Run these checks on the host before anything else. Stop at the first failure and tell the user what to do; do not install or start Docker yourself.

```bash
docker --version                      # Docker CLI installed?
docker info --format '{{.ServerVersion}} {{.OperatingSystem}} cpus={{.NCPU}} mem={{.MemTotal}}'   # daemon running?
docker run --rm hello-world >/dev/null && echo "docker ok"                                         # can run containers?
python3 --version                     # the host CLI uses python3 for its logs (3.8+)
```

| Result | What to tell the user |
|---|---|
| `docker: command not found` | Install Docker Desktop (macOS, Windows) or Docker Engine (Linux): https://docs.docker.com/get-docker/ |
| `Cannot connect to the Docker daemon` | Start Docker Desktop, or `sudo systemctl start docker` on Linux |
| `permission denied ... docker.sock` (Linux) | Add the user to the `docker` group (`sudo usermod -aG docker $USER`, then log in again) |
| hello-world fails to pull | No network or a registry proxy; the image build will fail too |
| no `python3` | Install Python 3 |

## Resources

Each box runs a headless Chromium. Plan about **1 GB of RAM and 0.5 CPU per box**. With the daemon's memory from `docker info`, cap the number of boxes you run at once:

```
max_boxes ≈ floor((MemTotal_GB - 2) / 1)
```

If the user asks for more subagents than that, run them in waves.

## Architecture

The image is built from `mcr.microsoft.com/playwright/python`, which ships for `linux/amd64` and `linux/arm64`, so it runs natively on Apple Silicon and on x86 hosts.
