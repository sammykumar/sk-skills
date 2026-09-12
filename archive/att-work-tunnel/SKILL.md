---
name: att-work-tunnel
description: Use when this personal Mac needs to reach AT&T VPN-gated resources (JFrog artifact.it.att.com, ATT-DP1 GitHub, internal *.sbc.com / *.ffdc.sbc.com backends) — or when those fail with SELF_SIGNED_CERT_IN_CHAIN, ENOTFOUND *.sbc.com, "tunneling socket could not be established", ECONNRESET, kex_exchange_identification reset, GitHub "IP allow list" errors, or pnpm/npm install hangs. Brings up / diagnoses the SSH SOCKS tunnel through the work MacBook.
---

# AT&T Work-Mac VPN Tunnel

## Overview

This repo is AT&T work on Sam's **personal** Mac. A corporate VPN only routes traffic originating from the **work MacBook** (`mk7751@192.168.50.65`, ssh alias `worktunnel`), which is on the VPN. Both Macs share the home router. We make personal-Mac traffic *originate on the work Mac* via an SSH SOCKS tunnel, so it traverses the VPN.

```
Personal Mac ──ssh -D 1080──► Work Mac ──AT&T VPN──► JFrog / GitHub / internal *.sbc.com
 privoxy :8118 ◄─HTTP↔SOCKS─┘  (mk7751)
```

`privoxy` bridges HTTP-proxy (what npm/pnpm/git speak) → SOCKS5 :1080. `forward-socks5t` means **DNS resolves on the work Mac**, so internal hostnames resolve over the VPN. `autossh` self-heals the SSH leg; a remote `caffeinate` keeps the work Mac from idle-sleeping.

⚠️ **Policy:** bridges a personal device to corp-gated resources. Sam's judgement call — assume sanctioned. Never echo tokens from `~/.config/att/`.

## Daily workflow

```bash
# 1. bring the tunnel up (autossh SOCKS + privoxy + remote caffeinate)
~/.config/att/work-tunnel.sh up
~/.config/att/work-tunnel.sh status      # SOCKS/HTTP up? autossh running? work-Mac awake-lock?

# 2. for npm/pnpm install: tokens + proxy env (only while tunnel is up)
source ~/.config/att/npm-env.sh

# 3. for serving an SSR app (idp-ui-platform): runtime proxy + internal TLS
cd ~/Development/att/T-Repos/idp-ui-platform
eval "$(fnm env)"; fnm use 24            # node 24.16 + pnpm 10.30 (corepack)
export NODE_DEPLOY_TO_AZURE=true \
       IDP_APP_PROXY_FULL=http://127.0.0.1:8118 \
       NODE_EXTRA_CA_CERTS=$HOME/.config/att/ATTInternalRootv2.cer
npx nx serve next-app-seed-sandbox       # → http://localhost:3001/next-app-seed-sandbox/...
```

## Running commands ON the work Mac over SSH

`ssh worktunnel 'cmd'` is a **non-interactive, non-login** shell — zsh sources only `~/.zshenv`, NOT `.zprofile`/`.zshrc`. A `~/.zshenv` was added on the work Mac (guarded by `[[ ! -o interactive ]]`) that mirrors the full work env — brew/fnm PATH, `node`/`pnpm`, cso corp proxy, ATT cert, and all tokens — into exactly that mode, so plain `ssh worktunnel 'node -v'` works. Interactive shells skip the guard and load `.zshrc` as before (unchanged). To run a project command at the right node version, `cd` into the dir in the same command (fnm `--use-on-cd` fires): `ssh worktunnel 'cd ~/path && pnpm build'`. Fallback if env is ever missing: wrap in a login-interactive shell `ssh worktunnel 'zsh -lic "cmd"'` (may emit p10k/gitstatus warnings without a TTY). ⚠️ The work `.zshrc`/`.zshenv` hold live inline tokens — see [[work-secrets-exposed]].

## Quick reference — `~/.config/att/work-tunnel.sh`

| Command | Does |
|---------|------|
| `up` | autossh `-M 0` SOCKS :1080 + privoxy :8118 + remote `caffeinate -dimsu` |
| `down` | stops autossh + privoxy, releases the work-Mac caffeinate |
| `status` | SOCKS/HTTP listening? autossh running? work-Mac awake-lock? |
| `doctor` | **5-hop health check**: SSH → SOCKS → privoxy → JFrog ping → internal backend TLS. Run this first when anything 500s — it names the broken hop. |

Config + secrets live in `~/.config/att/`: `work-tunnel.sh`, `privoxy.conf`, `npm-env.sh`, `gh-askpass.sh`, and chmod-600 token/cert files (`jfrog_token`, `bit_token`, `gh_pat`, `ATTInternalRootv2.cer`). SSH alias `worktunnel` is in `~/.ssh/config`.

## The TLS two-cert gotcha (most common mistake)

Two **different** certs depending on the target — getting this wrong breaks installs:

| Target | Cert through the tunnel | What to trust |
|--------|-------------------------|---------------|
| JFrog `artifact.it.att.com` | genuine **DigiCert** (tunnel bypasses the corp TLS-intercepting proxy) | node's built-in CA — **do NOT** set `cafile`/`NODE_EXTRA_CA_CERTS`. Setting the ATT root here breaks it with `SELF_SIGNED_CERT_IN_CHAIN`. |
| internal `*.ffdc.sbc.com` backends | **ATT internal root** | `NODE_EXTRA_CA_CERTS=~/.config/att/ATTInternalRootv2.cer` |

So: JFrog wants the default CA; internal app backends want the ATT cert. `npm-env.sh` deliberately sets **no** cafile; the serve step sets `NODE_EXTRA_CA_CERTS` only for the runtime SSR fetches.

## GitHub (ATT-DP1) specifics

- Org has a **GitHub IP allow-list** → clones must egress from the VPN IP → route git through the tunnel: `git -c http.proxy=http://127.0.0.1:8118 ...`
- Personal GitHub account has no org access → auth with the work PAT via `GIT_ASKPASS=~/.config/att/gh-askpass.sh` and `-c credential.helper=` (bypass keychain).
- `scripts/proxify` in the repos is the **on-corp-network** setup (Cisco AnyConnect / network-location switch). **Do not run it here** — the tunnel replaces it.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SELF_SIGNED_CERT_IN_CHAIN` on JFrog | remove any cafile override — use default CA |
| pages 500 `ENOTFOUND *.sbc.com` | set `NODE_DEPLOY_TO_AZURE=true` + `IDP_APP_PROXY_FULL` + `NODE_EXTRA_CA_CERTS` (the app *clears* the proxy unless `NODE_DEPLOY_TO_AZURE=true`) |
| pages 500 `tunneling socket could not be established` / `ECONNRESET` | tunnel dropped (work Mac slept/docked). `work-tunnel.sh doctor`, then `up`. autossh auto-recovers once the Mac is awake. |
| `kex_exchange_identification: Connection reset` | work Mac asleep or just waking — retry; recovers within seconds of wake |
| git `IP allow list ... not permitted` | route git through `http.proxy=http://127.0.0.1:8118` |
| git auth fails as personal account | `GIT_ASKPASS=~/.config/att/gh-askpass.sh` + `-c credential.helper=` |
| npm/pnpm install hangs | forgot `source ~/.config/att/npm-env.sh`, or tunnel down — `doctor` |
| `doctor` hop 1 FAIL | work Mac unreachable: wake it, dock/undock, or enable Remote Login (System Settings → General → Sharing → Remote Login) |

## Keeping the tunnel alive

Everything hangs off the single SSH link. Two failure modes, two mitigations:

- **autossh** (`-M 0 -f -N`, `AUTOSSH_GATETIME=0`) self-heals Wi-Fi blips / VPN reconnects in seconds, using `ServerAliveInterval 30` / `CountMax 3` from `~/.ssh/config` to detect death in ~90s. But it **can't wake a sleeping Mac** — only reconnect once it's reachable.
- **caffeinate** (`-dimsu`, started remotely by `up`) blocks idle-sleep. **Clamshell caveat:** docking lid-closed sleeps the Mac regardless, unless on an external display+power. The firmer fix `sudo pmset -c disablesleep 1` needs sudo + may be overridden by MDM, so it's deliberately **not** automated. Easiest workaround: keep the lid cracked, or use an external display.

## One-time bootstrap (already done on this machine)

If rebuilding from scratch: `brew install autossh privoxy`; generate `~/.ssh/id_personal_mac_tunnel` and `ssh-copy-id` it to `worktunnel`; enable Remote Login on the work Mac; pull the token/cert files into `~/.config/att/` (chmod 600); add the `worktunnel` SSH alias.

## Full deep-dive

`~/Development/att/T-Repos/LOCAL-DEV-TUNNEL-SETUP.md` has the complete write-up (architecture diagram, why each step matters, toolchain/`.npmrc` config). Memory: `[[work-tunnel-setup]]`, `[[work-secrets-exposed]]`, `[[run-idp-ui-platform-sandbox]]`.
