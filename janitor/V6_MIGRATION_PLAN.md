# IMPLEMENTATION PLAN: ASTAL V6 - SCORCHED EARTH PROTOCOL

## Goal
Establish the "Cassowary Citadel" (Astal V6) by abandoning the compromised `astal` directory and rebuilding from a clean slate. This ensures "Brutalist Efficiency" is baked into the foundation, not monkey-patched on top of legacy code.

## User Review Required
> [!WARNING]
> **DESTRUCTIVE ACTION**: The current `modules/home/desktop/astal` folder will be moved to `modules/home/desktop/astal_corpse`.
> The new `astal` folder will start **EMPTY**. Ideally, your bar will be gone until we reach Phase 3.

## The Strategy: "Purge & Rebuild"

You cannot refactor a `centerbox` into a `ConstraintShell`. They are antithetical. One is a suggestion; the other is a mathematical law. We must restart.

### What We Save (The Soul)
*   **`janitor/*.md`**: The blueprints are gold.
*   **Service Logic**: The *concept* of `NiriService` and `AudioService` is correct, but the *implementation* needs auditing against the "No Leaks" protocol. We will copy-paste carefully, not wholesale.
*   **Assets**: Icons and fonts.

### What We Burn (The Body)
*   **`windows/Bar.tsx`**: It is infected with Flexbox.
*   **`widgets/*.tsx`**: They depend on the old layout system.
*   **`default.toml`**: It relies on percentages.

---

## Phase 1: The Foundation (Day 1)
**Goal**: A blank window that renders 60fps red background using `ConstraintLayout`.

1.  **Backup**: `mv astal astal_corpse`.
2.  **Scaffold**: Create the "Generated Citadel" directory structure:
    ```text
    astal/
    ├── package.nix          # Pinned Utils
    ├── flake.nix            # Hermetic Seal
    ├── app.tsx              # Entry Point
    ├── src/
    │   ├── theme/           # The Math (scale.ts)
    │   ├── components/      # ConstraintShell.ts
    │   ├── services/        # NiriService.ts
    │   └── widgets/         # (Empty initially)
    ```
3.  **The Substrate**: Ensure `package.nix` has `gtk4-layer-shell` and `gobject-introspection`.
4.  **The Math**: Implement `src/theme/scale.ts` defining `$u=12`.

## Phase 2: The Constraint Shell (Day 1-2)
**Goal**: Prove the layout engine works.

1.  **Implement `ConstraintShell.ts`**:
    *   This is the hardest file. It must wrap `Gtk.ConstraintLayout`.
    *   It must accept "VFL" arrays: `H:|-[Workspaces]-(>=0)-[Clock(==200)]-|`.
2.  **The First Window**:
    *   Create a "Debug Bar" with three red squares.
    *   Apply constraints to center them perfectly.
    *   **Audit**: Resize window. If squares drift, we failed.

## Phase 3: The Nervous System (Day 2)
**Goal**: Connect to the world (Niri).

1.  **`NiriService.ts`**:
    *   Implement using strict `Gio.SocketClient` (no wrappers).
    *   Verify JSON-RPC streaming without memory leaks.
2.  **`ConfigAdapter.ts`**:
    *   Re-implement strict Types (Integer only).

## Phase 4: The Population (Day 3+)
**Goal**: Port widgets one by one.

1.  **Workspaces**: The most complex widget (dynamic children + signaling).
2.  **Clock**: The simplest widget (verify centering).
3.  **Media**: The heaviest widget (verify GPU layers).

---

## EXECUTION ORDER

### Step 1: Nuclear Option
- [ ] Rename `modules/home/desktop/astal` to `modules/home/desktop/astal_legacy`.
- [ ] Create new `modules/home/desktop/astal`.

### Step 2: The Substrate
- [ ] Create `package.nix` (Copy from legacy but verify inputs).
- [ ] Create `flake.nix` (Ensure inputs are locked).
- [ ] Create `tsconfig.json` (Strict mode).

### Step 3: The Entry Point
- [ ] Create `app.tsx` (Minimal: Just starts the app).
- [ ] Create `src/style/main.scss` (GTK4 Reset).

### Step 4: Verification
- [ ] Run `ags bundle` and ensure it builds a valid (useless) binary.
