# Deep Research: NixOS → Arch + dcli Migration Strategy

## Context
I am migrating from NixOS to Arch Linux. I want to use **dcli** (a declarative package manager inspired by NixOS) to maintain similar organizational principles without the complexity of the Nix language.

## My Goals
1. **Understand dcli deeply** - How it works, its module system, dotfile management, and limitations
2. **Design an Arch dotfiles structure** that mirrors my NixOS organization philosophy but is simpler
3. **Identify what's portable** from my NixOS config and what needs to be reimplemented
4. **Create a practical migration plan** with folder structure, dcli modules, and a dotfile strategy (GNU Stow vs chezmoi)

## What I DON'T Want
- A 1:1 port of my NixOS config
- Unnecessary complexity
- To lose the "single source of truth" organization I have now

## What I VALUE
- **Modularity**: Separate concerns (desktop, programs, theme, etc.)
- **Git-based config**: Everything in one repo
- **Theme engine**: I have a custom Python-based theme engine that generates configs from wallpapers - this is portable
- **Declarative packages**: dcli should handle this
- **Easy iteration**: I want to test in a VM before committing

---

## ATTACHED: dcli Documentation

Please analyze the dcli repository documentation thoroughly. Key files:
- `README.md` - Full documentation
- `CHEAT-SHEET.md` - Command reference
- `DIRECTORY-MODULES.md` - Module system explanation
- `SERVICES.md` - Service management
- `example-services-config.yaml` - Config format example

---

## ATTACHED: My Current NixOS Config (Lean Dump)

This is my current NixOS configuration, stripped of heavy folders (node_modules, astal shell, etc.) to focus on the structure and logic.

Key files to analyze:
- `flake.nix` - Entry point
- `hosts/default.nix` - System module imports
- `modules/core/*` - System-level config (boot, hardware, packages, etc.)
- `modules/home/*` - User-level config (programs, packages, desktop)
- `modules/home/theme/*` - My custom theme engine (Python, 100% portable)
- `modules/home/programs/*` - Per-program configurations

---

## Questions for Deep Research

### 1. dcli Architecture
- How does dcli's module system compare to NixOS modules?
- Can dcli handle conditional package installation (e.g., different packages for laptop vs desktop)?
- How does dcli manage dotfiles - does it use symlinks like GNU Stow?
- What are dcli's limitations compared to NixOS?

### 2. Folder Structure Design
- What's the optimal folder structure for an Arch dotfiles repo using dcli + Stow?
- How should I organize dcli modules vs stow packages?
- Where should my theme engine live?

### 3. Migration Mapping
For each NixOS component, tell me:
- Is it portable as-is?
- What's the Arch equivalent?
- How would I implement it with dcli?

Components to map:
- `flake.nix` inputs (niri-flake, stylix, chaotic)
- `modules/core/packages.nix` (system packages)
- `modules/home/packages.nix` (user packages)
- `modules/home/programs/*.nix` (per-program config)
- `modules/home/theme/*` (theme engine)
- `modules/home/desktop/niri/*` (window manager config)

### 4. Desktop Environment
- I use Niri (Wayland compositor) on NixOS. It may not work in VMs.
- For testing, I'll use Hyprland or KDE.
- How should I structure configs to support multiple DEs?

### 5. Implementation Plan
Provide a step-by-step plan:
1. Folder structure to create
2. dcli config files to write
3. Stow packages to organize
4. Theme engine integration
5. Testing workflow in VM

---

## Output Format

Please provide:
1. **Executive Summary** - Key insights about dcli and migration strategy
2. **Proposed Folder Structure** - Complete tree with explanations
3. **dcli Module Examples** - Actual YAML files I can use
4. **Migration Checklist** - Step-by-step with estimated effort
5. **Gotchas & Limitations** - What won't work or needs workarounds
