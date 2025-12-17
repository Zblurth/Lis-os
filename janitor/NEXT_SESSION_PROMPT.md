# MASTER PROMPT: Astal V5 Configuration Rebuild

**Role:** Senior Systems Architect (Astal/NixOS)
**Objective:** Audit the Astal codebase to derive a clean, functional `default.toml` configuration structure, IGNORING the current "bloated" configuration file.

## 1. Context Acquisition
First, you must ground yourself in the system's architecture and design philosophy.
1.  **Read Documentation:** Read EVERY file in `janitor/`. specificlly `GEMINI.md` and `ASTAL_DESIGN.md`.
2.  **Read Codebase:** Recursively read the entire contents of `modules/home/desktop/astal/` (exclude `node_modules` and `default.toml`).
    *   Pay special attention to `src/ConfigAdapter.ts` (The Schema).
    *   Pay special attention to `src/services/CssInjectionService.ts` (The Consumer).
    *   Pay special attention to `widgets/` (The Consumers).

## 2. The Analysis Task
The user believes the current `default.toml` is broken/bloated and that *only* `barHeight` is actually working correctly.
**Your goal is to explain how the Astal folder works WITHOUT looking at the current `default.toml`.**

*   **Reverse Engineer the Config:** Based *only* on the Zod schema in `ConfigAdapter.ts` and the usage in `CssInjectionService.ts` and Widgets, determine what the `default.toml` *should* look like.
*   **Identify Dead Config:** If the Zod schema defines keys that are never used in the code, flag them.
*   **Identify Missing Config:** If the code relies on hardcoded values that *should* be in the config, flag them.

## 3. The Output
1.  **Explanation:** Explain the architecture of the `astal` folder and how data flows (Config -> Adapter -> Service -> Widget/CSS).
2.  **Draft Config:** Propose a lean, clean `default.toml` that contains ONLY the variables actually used by the code.

**CONSTRAINT:** DO NOT TRUST THE CURRENT `default.toml` file. Treat it as "legacy junk" to be replaced. Your source of truth is the TypeScript code.
