# Lis-os Cleanup TODO

**Updated:** 2025-12-18

## Phase 2: Quick Fixes (5-10 min)

- [ ] **Flake `follows` cleanup** — Add `inputs.nixpkgs.follows = "nixpkgs"` to `stylix`, `noctalia`, `niri-flake` in `flake.nix`. Reduces lockfile bloat.
- [ ] **Remove unused imports in `zsh.nix`** — Delete `lib` from args (line 4) and `variables` let binding (line 8). Clears lint warnings.

## Phase 3: Structural Cleanup (When Ready)

- [ ] **Remove unused flake inputs** — Audit `flake.nix` for stale inputs.
- [ ] **Audit Theme Engine outputs** — Verify templates match current Noctalia paths.

## Phase 4: Future Architecture (Optional)

- [ ] **Stable + Unstable strategy** — Pin core to `nixos-stable`, overlay unstable for apps (only if experiencing boot issues).
- [ ] **Proper Noctalia integration** — Fork and customize once stable.
