# Deploy Guide — benni-operator-gateway

The CI pipeline supports three deploy targets.
Activate **one** by setting the `DEPLOY_TARGET` repo variable.

## Activation (all providers)

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Value |
|---|---|
| `DEPLOY_TARGET` | `railway` \| `fly` \| `vps` |

Then add the provider-specific secrets below.

---

## Option 1 — Railway (easiest, zero-infra)

**Secrets required:**

| Secret | How to get |
|---|---|
| `RAILWAY_TOKEN` | railway.app → Account Settings → Tokens |
| `RAILWAY_PUBLIC_URL` | Variable (not secret) — e.g. `https://benni-gateway.up.railway.app` |

**Steps:**
1. Create a new project on [railway.app](https://railway.app)
2. Copy the token to `RAILWAY_TOKEN`
3. Set `DEPLOY_TARGET=railway`
4. Push to `main` — done.

---

## Option 2 — Fly.io (global edge, free tier)

**Secrets required:**

| Secret | How to get |
|---|---|
| `FLY_API_TOKEN` | `flyctl auth token` |
| `FLY_APP_NAME` | Variable — your app name on Fly |

**Steps:**
1. Install flyctl: `brew install flyctl`
2. Run `flyctl launch` in repo root (generates `fly.toml` if missing)
3. Run `flyctl auth token` → copy to `FLY_API_TOKEN`
4. Set `DEPLOY_TARGET=fly`
5. Push to `main` — done.

---

## Option 3 — VPS via SSH (full control)

**Secrets required:**

| Secret | Description |
|---|---|
| `VPS_HOST` | Server IP or hostname |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Full private key (ed25519 or RSA) |
| `VPS_PORT` | Optional, defaults to `22` |
| `VPS_PUBLIC_URL` | Variable — public URL for environment link |
| `GATEWAY_API_KEY` | Forwarded as env var to container |
| `JULES_API_KEY` | Forwarded as env var to container |
| `JARVAS2_BASE_URL` | Forwarded as env var to container |
| `JARVAS2_API_KEY` | Forwarded as env var to container |

**Pre-requisites on VPS:**
```bash
# Docker
curl -fsSL https://get.docker.com | sh

# GHCR auth (one time)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
```

**Steps:**
1. Add all secrets above
2. Set `DEPLOY_TARGET=vps`
3. Push to `main` — the pipeline builds the image, pushes to GHCR, SSHs into VPS and does a zero-downtime container swap.

---

## Pipeline flow after activation

```
push to main
    │
  quality → test → build → deploy-[railway|fly|vps]
```

Only **one** deploy job runs per push (controlled by `vars.DEPLOY_TARGET`).
All others are skipped automatically.
