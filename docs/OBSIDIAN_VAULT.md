# Obsidian vault — FusionAI docs

Recommended setup so **notes, backlinks, and the live build plan** stay in one place alongside the repo.

## Option A — Use `docs/` as the vault (recommended)

1. Install [Obsidian](https://obsidian.md/).
2. **Open folder as vault** → select this repository’s **`docs`** directory:
   `.../FUSION-AI-Enterprise-Suite-AI-Driven-modular-ERP-Platform/docs`
3. Obsidian creates **`docs/.obsidian/`** for settings (plugins, theme). Either:
   - **Commit** `.obsidian/` if you want synced settings across machines, or  
   - Add `docs/.obsidian/` to `.gitignore` if only local/editor-specific.

Navigating from Obsidian:

- **Build orchestration:** `BUILD_ORCHESTRATION.md`
- **Architecture index:** `architecture.md`
- **Module backlog:** `modules/00-master-gap-summary.md`
- ADRs: `adr/`

Because the canonical build tracker is **`docs/BUILD_ORCHESTRATION.md`**, avoid duplicating long state in other notes — use links `[[BUILD_ORCHESTRATION]]` from the same vault.

## Option B — Whole repo as vault

Open the **repository root** as a vault if you want `README`, `frontend`, and `api` paths in the graph. Links to `docs/BUILD_ORCHESTRATION.md` still work with relative paths.

## Root `BUILD_STATE.md`

GitHub and Cursor show `BUILD_STATE.md` at repo root for a **one-screen** pointer. Keep it short; expand only in `docs/BUILD_ORCHESTRATION.md`.
