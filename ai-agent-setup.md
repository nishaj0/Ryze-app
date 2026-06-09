
## AI Coding Agents & Knowledge Graph

This project uses **[graphify](https://github.com/graphify-ai/graphify)** to maintain a navigable knowledge graph of the codebase (`graphify-out/`). All AI coding agents (Antigravity, Claude Code, Codex, Cursor, etc.) are configured to read from this graph before answering architecture questions — so keeping it up to date is important.

The graph updates **automatically on every `git commit`** via a post-commit hook. You just need to do the one-time setup below.

---

### Prerequisites

- **Python ≥ 3.10** — the project uses pyenv-win with `3.10.11`
- **graphify** Python package

---

### 1. Install graphify

```powershell
pip install graphifyy
```

> If you use [pyenv-win](https://github.com/pyenv-win/pyenv-win), make sure you're installing into the active version:
> ```powershell
> pyenv local 3.10.11
> pip install graphifyy
> ```

---

### 2. Add graphify to PATH (Windows — required)

By default, `pip` installs scripts into your Python version's `Scripts\` folder which may not be on your PATH.

**Option A — Permanent user PATH (recommended):**

Open PowerShell and run:

```powershell
# Replace 3.10.11 with your pyenv Python version if different
$scriptsPath = "$env:USERPROFILE\.pyenv\pyenv-win\versions\3.10.11\Scripts"
[Environment]::SetEnvironmentVariable("PATH", "$scriptsPath;" + [Environment]::GetEnvironmentVariable("PATH", "User"), "User")
```

Then **restart your terminal** and verify:

```powershell
graphify --help
```

**Option B — Per-session (add to your PowerShell profile):**

```powershell
# Append to your $PROFILE file
Add-Content $PROFILE "`n`$env:PATH = `"$env:USERPROFILE\.pyenv\pyenv-win\versions\3.10.11\Scripts;`$env:PATH`""
```

> **Not using pyenv?** Replace the path with wherever `pip` installs scripts.  
> To find it: `python -c "import sysconfig; print(sysconfig.get_path('scripts'))"`

---

### 3. Build the initial graph

Run once after cloning:

```powershell
graphify update .
```

This scans all code files and produces `graphify-out/graph.json`, `graph.html`, and `GRAPH_REPORT.md`. No API key or internet access needed — it's purely AST-based.

---

### 4. Install the git hooks

```powershell
python -m graphify hook install
```

This installs two hooks into `.git/hooks/`:

| Hook | Trigger | Action |
|---|---|---|
| `post-commit` | After every `git commit` | Rebuilds the graph in the background |
| `post-checkout` | After switching branches | Rebuilds the graph in the background |

The rebuild runs **in the background** so it never blocks your commit. Rebuild logs go to `~/.cache/graphify-rebuild.log`.

> **Windows note:** The hooks are written in POSIX shell (`#!/bin/sh`) and run through Git's bundled `sh.exe`. They automatically inject the pyenv Scripts path into `$PATH` so `graphify.exe` is found even if it's not in your system PATH. As long as you completed step 2, it will work.

To verify hooks are installed:

```powershell
python -m graphify hook status
```

Expected output:
```
post-commit: installed
post-checkout: installed
```

---

### 5. Install agent integrations (per agent)

Run whichever matches the agent(s) you use. These write the graphify rules into each agent's config so it reads the graph automatically.

```powershell
python -m graphify antigravity install   # Google Antigravity
python -m graphify claude install        # Claude Code
python -m graphify codex install         # OpenAI Codex
python -m graphify cursor install        # Cursor
python -m graphify vscode install        # GitHub Copilot in VS Code
```

---

### Daily workflow

You don't need to think about the graph — it updates itself on every commit. But if you ever need to force a manual rebuild (e.g. after a big refactor that deleted files):

```powershell
# Standard rebuild
graphify update .

# Force rebuild (use after deletions/renames)
graphify update . --force
```

To query the graph directly:

```powershell
graphify query "how does fee tracking work"
graphify path "authMiddleware()" "login()"
graphify explain "feeController"
```

---

### Troubleshooting (Windows)

| Problem | Fix |
|---|---|
| `graphify` not recognized in PowerShell | Complete step 2 and restart terminal |
| `graphify` not recognized in Git Bash | The hook auto-injects the path — you don't need it in Git Bash manually |
| Hook doesn't run after commit | Run `python -m graphify hook install` and confirm status |
| Graph is stale after a big refactor | Run `graphify update . --force` |
| `import graphify` fails | Run `pip install graphifyy` (note the double `y`) |

---
