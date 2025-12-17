# The Generated Citadel: Astal V5 Architecture Analysis

**Status:** REFERENCE  
**Context:** V5 "Regime Change" Protocol  
**Target:** Lis-OS / Niri Dashboard

---

## 1. Core Philosophy: The Regime Change
We have moved from "Math-in-TS" (imperative hacks) to **"The Generated Citadel"** (strict determinism).

*   **Old World:** Layout calculated in JS (`spacing={12}`). Result: "Zombie Config" (unthemeable).
*   **New World:** Layout generated from `default.toml`. Result: **Immutable Ground Truth**.

## 2. The Doctrine of Ground Truth
There is only one source of reality: **`default.toml`**.
Every pixel on screen must trace its lineage back to this file.

### Implementation Stack
1.  **Genotype:** `default.toml` (The DNA).
2.  **Gatekeeper:** `ConfigAdapter` (Zod Validation).
3.  **Engine Room:** `CssInjectionService` (Generates CSS Variables).
4.  **Phenotype:** `Widgets` (Consume CSS Variables).

**Constraint:** Hardcoded visual values in TypeScript are **Strictly Forbidden**.

## 3. The Bundle Reality Principle (Build Time)
*   **The Problem:** `ags bundle` smashes files into one blob. `readdir` and dynamic imports crash in production.
*   **The Solution:** **Ahead-of-Time (AOT) Registry Generation**.
*   **Mechanism:** `scripts/gen-registry.ts` scans widgets at **build time** and locks them into `registry.ts`.
*   **The Contract:** "If a resource cannot be resolved at compile time, it does not exist."

## 4. Brutalist Efficiency (Performance)
*   **Frame Budget:** <16ms (60 FPS).
*   **Rule:** "CSS is the Heavy Lifter."
    *   **CSS (Native C Speed):** Padding, Margins, Colors, Radii, Shadows.
    *   **JS (Slow Bridge):** Only Window Dimensions & GObject Integer Properties.
*   **Implication:** Dashboard logic must rely on CSS Grid/Flexbox, not JS math.

## 5. Memory Hygiene (The Minefield)
*   **The Trap:** JS Garbage Collection is lazy ("Tardy Sweep"). GTK Reference Counting is strict.
*   **The Leak:** `connect()` creates circular references that JS GC fails to clean up.
*   **The Fix:** **Lifecycle-Aware Bindings**.
    *   Use `bind()`: Autokill when widget dies.
    *   Use `safeSignal()`: Explicit cleanup on destroy.

## 6. Dashboard Implementation Implications

### A. Registry Scaling
**Challenge:** Users toggle "WiFi" or "Profile" cards dynamically via JSON.
**Solution:** We need a **Static Dashboard Registry** generated at build time.
*   `DashboardCardRegistry.ts` maps `string ID -> Component`.

### B. Configuration Structure
**Challenge:** Enable distinct layouts for different users.
**Solution:** `default.toml` must support a dashboard schema:
```toml
[dashboard.layout]
cards = ["profile", "quicksettings", "media"]
```

### C. Styling Strategy
**Challenge:** "Gap" between cards.
**Solution:** Derived from `default.toml` -> `CssInjectionService`.
*   CSS: `.DashboardGrid { gap: var(--spacing-2); }`

---
**Verdict:** The system is engineered for stability. We are not scripting; we are systems engineering.
