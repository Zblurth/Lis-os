# Lis-os Cleanup TODO

**Created:** 2025-12-18

## Phase 2: Quick Fixes (5-10 min)

- [ ] **Flake `follows` cleanup** — Add `inputs.nixpkgs.follows = "nixpkgs"` to `stylix`, `noctalia`, `niri-flake`, and `ags` in `flake.nix`. Reduces lockfile bloat.
- [ ] **Remove unused imports in `zsh.nix`** — Delete `lib` from args (line 4) and `variables` let binding (line 8). Clears lint warnings.

## Phase 3: Structural Cleanup (When Ready)

- [ ] **Audit `janitor/*.md`** — Consolidate or delete stale docs (V5 vs V6 guides, old migration plans).
- [ ] **Remove unused flake inputs** — If not using `noctalia` input from flake, remove it.
- [ ] **Consider `astal/flake.nix`** — Newly created, might be orphan from experiments. Delete if unused.

## Phase 4: Future Architecture (Optional)

- [ ] **Stable + Unstable strategy** — Pin core to `nixos-stable`, overlay unstable for apps (only if experiencing boot issues).
- [ ] **Proper Noctalia integration** — Fork and integrate once ready.
